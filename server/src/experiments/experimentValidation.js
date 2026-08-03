import path from "node:path";
import {
  access,
  readFile,
} from "node:fs/promises";
import {
  getExperimentDirectory,
  loadManifest,
} from "./experimentStorage.js";

function expectedRunIds(
  configuration,
) {
  const ids = [];

  for (
    let repetition = 1;
    repetition <= configuration.repetitions;
    repetition += 1
  ) {
    for (
      const specification of
      configuration.specifications
    ) {
      for (
        const workflow of
        configuration.workflows
      ) {
        ids.push(
          `${specification.id}__${workflow}__${repetition}`,
        );
      }
    }
  }

  return ids;
}

async function exists(
  targetPath,
) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function validateExperiment(
  experimentId,
) {
  const manifest =
    await loadManifest(
      experimentId,
    );

  const errors = [];
  const warnings = [];

  const expected =
    expectedRunIds(
      manifest.configuration,
    );

  const actual =
    manifest.runs.map(
      (run) =>
        run.experimentRunId,
    );

  const duplicateIds =
    actual.filter(
      (id, index) =>
        actual.indexOf(id) !==
        index,
    );

  const missingIds =
    expected.filter(
      (id) =>
        !actual.includes(id),
    );

  const unexpectedIds =
    actual.filter(
      (id) =>
        !expected.includes(id),
    );

  if (duplicateIds.length > 0) {
    errors.push(
      `Duplicate runs: ${[...new Set(duplicateIds)].join(", ")}`,
    );
  }

  if (missingIds.length > 0) {
    errors.push(
      `Missing runs: ${missingIds.join(", ")}`,
    );
  }

  if (unexpectedIds.length > 0) {
    errors.push(
      `Unexpected runs: ${unexpectedIds.join(", ")}`,
    );
  }

  if (
    manifest.runs.length !==
    expected.length
  ) {
    errors.push(
      `Expected ${expected.length} runs but found ${manifest.runs.length}.`,
    );
  }

  const sequences =
    manifest.runs.map(
      (run) =>
        run.sequence,
    );

  const expectedSequences =
    Array.from(
      {
        length:
          manifest.runs.length,
      },
      (_, index) =>
        index + 1,
    );

  if (
    JSON.stringify(
      [...sequences].sort(
        (left, right) =>
          left - right,
      ),
    ) !==
    JSON.stringify(
      expectedSequences,
    )
  ) {
    errors.push(
      "Run sequence values are missing, duplicated, or non-contiguous.",
    );
  }

  for (const run of manifest.runs) {
    if (
      ![
        "pending",
        "running",
        "completed",
        "failed",
      ].includes(run.status)
    ) {
      errors.push(
        `${run.experimentRunId}: invalid status "${run.status}".`,
      );
    }

    if (
      run.status === "completed" &&
      !run.runId
    ) {
      errors.push(
        `${run.experimentRunId}: completed run has no runId.`,
      );
    }

    if (
      run.status === "completed" &&
      ![
        "valid-passed",
        "valid-poor-quality",
      ].includes(
        run.resultClassification,
      )
    ) {
      errors.push(
        `${run.experimentRunId}: completed run has invalid classification.`,
      );
    }

    if (
      run.status === "failed" &&
      !run.failureType
    ) {
      errors.push(
        `${run.experimentRunId}: failed run has no failureType.`,
      );
    }

    if (run.responseFile) {
      const responsePath =
        path.join(
          getExperimentDirectory(
            experimentId,
          ),
          run.responseFile,
        );

      if (
        !(await exists(
          responsePath,
        ))
      ) {
        errors.push(
          `${run.experimentRunId}: response file is missing.`,
        );
      } else {
        try {
          const response =
            JSON.parse(
              await readFile(
                responsePath,
                "utf8",
              ),
            );

          if (
            typeof response.ok !==
            "boolean"
          ) {
            errors.push(
              `${run.experimentRunId}: response file has no boolean ok value.`,
            );
          }
        } catch (error) {
          errors.push(
            `${run.experimentRunId}: response file is invalid JSON (${error.message}).`,
          );
        }
      }
    } else if (
      [
        "completed",
        "failed",
      ].includes(run.status)
    ) {
      errors.push(
        `${run.experimentRunId}: finished run has no responseFile.`,
      );
    }
  }

  if (
    !manifest.configuration
      ?.reproducibility
      ?.combinedSha256
  ) {
    errors.push(
      "Manifest reproducibility fingerprint is missing.",
    );
  }

  if (
    manifest.configuration
      ?.runOrder !==
    "seeded-random"
  ) {
    errors.push(
      "Manifest runOrder is not seeded-random.",
    );
  }

  if (
    !Number.isInteger(
      manifest.configuration
        ?.randomSeed,
    )
  ) {
    errors.push(
      "Manifest randomSeed is missing or invalid.",
    );
  }

  if (
    manifest.summary.totalRuns !==
    manifest.runs.length
  ) {
    errors.push(
      "Manifest summary totalRuns does not match the run array.",
    );
  }

  if (
    manifest.status === "completed" &&
    manifest.runs.some(
      (run) =>
        run.status !== "completed",
    )
  ) {
    errors.push(
      "Experiment is marked completed but one or more runs are not completed.",
    );
  }

  if (
    manifest.status ===
      "completed-with-failures" &&
    !manifest.runs.some(
      (run) =>
        run.status === "failed",
    )
  ) {
    warnings.push(
      "Experiment is marked completed-with-failures but no failed runs were found.",
    );
  }

  return {
    experimentId,
    validatedAt:
      new Date().toISOString(),
    passed:
      errors.length === 0,
    errors,
    warnings,
    expectedRuns:
      expected.length,
    actualRuns:
      manifest.runs.length,
  };
}

export function printValidationReport(
  report,
) {
  console.log(
    `Dataset validation: ${
      report.passed
        ? "PASSED"
        : "FAILED"
    }`,
  );

  console.log(
    `Runs: ${report.actualRuns}/${report.expectedRuns}`,
  );

  for (const error of report.errors) {
    console.log(
      `FAIL  ${error}`,
    );
  }

  for (
    const warning of
    report.warnings
  ) {
    console.log(
      `WARN  ${warning}`,
    );
  }
}
