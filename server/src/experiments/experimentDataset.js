import {
  readFile,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {
  getExperimentDirectory,
  saveManifest,
  writeJson,
} from "./experimentStorage.js";

function getInitialReports(
  responseBody,
) {
  if (responseBody?.initial) {
    return {
      qualityReport:
        responseBody.initial
          .qualityReport ??
        null,

      runtimeReport:
        responseBody.initial
          .runtimeReport ??
        null,

      accessibilityReport:
        responseBody.initial
          .accessibilityReport ??
        responseBody.initial
          .runtimeReport
          ?.accessibility ??
        null,

      functionalReport:
        responseBody.initial
          .functionalReport ??
        null,
    };
  }

  return {
    qualityReport:
      responseBody?.qualityReport ??
      null,

    runtimeReport:
      responseBody?.runtimeReport ??
      null,

    accessibilityReport:
      responseBody
        ?.accessibilityReport ??
      responseBody?.runtimeReport
        ?.accessibility ??
      null,

    functionalReport:
      responseBody?.functionalReport ??
      null,
  };
}

function getFinalReports(
  responseBody,
) {
  if (!responseBody?.refinement) {
    return getInitialReports(
      responseBody,
    );
  }

  const iterations =
    responseBody.refinement
      .iterations ?? [];

  const finalIteration =
    iterations.length > 0
      ? iterations[
          iterations.length - 1
        ]
      : responseBody.initial;

  return {
    qualityReport:
      finalIteration
        ?.qualityReport ??
      responseBody.initial
        ?.qualityReport ??
      null,

    runtimeReport:
      finalIteration
        ?.runtimeReport ??
      responseBody.initial
        ?.runtimeReport ??
      null,

    accessibilityReport:
      finalIteration
        ?.accessibilityReport ??
      finalIteration
        ?.runtimeReport
        ?.accessibility ??
      responseBody.initial
        ?.accessibilityReport ??
      null,

    functionalReport:
      finalIteration
        ?.functionalReport ??
      responseBody.initial
        ?.functionalReport ??
      null,
  };
}

function getBoolean(
  ...values
) {
  return (
    values.find(
      (value) =>
        typeof value === "boolean",
    ) ?? null
  );
}

function getPassStatus(
  reports,
) {
  const staticPassed =
    getBoolean(
      reports.qualityReport
        ?.summary?.passed,
    );

  const runtimePassed =
    getBoolean(
      reports.runtimeReport
        ?.summary?.runtimePassed,
      reports.runtimeReport
        ?.summary?.passed,
    );

  const accessibilityPassed =
    getBoolean(
      reports.runtimeReport
        ?.summary
        ?.accessibilityPassed,
      reports.accessibilityReport
        ?.summary?.passed,
      reports.accessibilityReport
        ?.passed,
    );

  const functionalPassed =
    getBoolean(
      reports.functionalReport
        ?.summary?.passed,
    );

  const passValues = [
    staticPassed,
    runtimePassed,
    accessibilityPassed,
    functionalPassed,
  ].filter(
    (value) =>
      typeof value === "boolean",
  );

  return {
    staticPassed,
    runtimePassed,
    accessibilityPassed,
    functionalPassed,

    allPassed:
      passValues.length > 0 &&
      passValues.every(Boolean),
  };
}

export function classifySuccessfulRun(
  responseBody,
) {
  const initialReports =
    getInitialReports(
      responseBody,
    );

  const finalReports =
    getFinalReports(
      responseBody,
    );

  const initialPassStatus =
    getPassStatus(
      initialReports,
    );

  const finalPassStatus =
    getPassStatus(
      finalReports,
    );

  return {
    resultClassification:
      finalPassStatus.allPassed
        ? "valid-passed"
        : "valid-poor-quality",

    initialReports,
    finalReports,
    initialPassStatus,
    finalPassStatus,
  };
}

function csvEscape(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  const text =
    typeof value === "object"
      ? JSON.stringify(value)
      : String(value);

  if (
    text.includes(",") ||
    text.includes("\"") ||
    text.includes("\n") ||
    text.includes("\r")
  ) {
    return `"${text.replaceAll(
      "\"",
      "\"\"",
    )}"`;
  }

  return text;
}

function getReportCounts(
  reports,
) {
  const qualitySummary =
    reports.qualityReport
      ?.summary ?? {};

  const runtimeSummary =
    reports.runtimeReport
      ?.summary ?? {};

  const accessibility =
    reports.accessibilityReport ??
    {};

  const functionalSummary =
    reports.functionalReport
      ?.summary ?? {};

  return {
    staticTotalIssues:
      qualitySummary.totalIssues ??
      null,

    staticErrors:
      qualitySummary.totalErrors ??
      null,

    staticWarnings:
      qualitySummary.totalWarnings ??
      null,

    runtimeConsoleErrors:
      runtimeSummary
        .consoleErrorCount ??
      reports.runtimeReport
        ?.consoleErrors?.length ??
      null,

    runtimeUncaughtExceptions:
      runtimeSummary
        .uncaughtExceptionCount ??
      reports.runtimeReport
        ?.uncaughtExceptions
        ?.length ??
      null,

    requiredControlsPresent:
      runtimeSummary
        .requiredControlsPresent ??
      reports.runtimeReport
        ?.requiredControls
        ?.present ??
      null,

    requiredControlsExpected:
      runtimeSummary
        .requiredControlsExpected ??
      reports.runtimeReport
        ?.requiredControls
        ?.expected ??
      null,

    accessibilityViolations:
      runtimeSummary
        .accessibilityViolationCount ??
      accessibility
        .violationCount ??
      accessibility
        .violations?.length ??
      null,

    accessibilityViolatingNodes:
      runtimeSummary
        .accessibilityViolatingNodeCount ??
      accessibility
        .violatingNodeCount ??
      null,

    accessibilityCritical:
      accessibility
        .violationsByImpact
        ?.critical ??
      null,

    accessibilitySerious:
      accessibility
        .violationsByImpact
        ?.serious ??
      null,

    accessibilityModerate:
      accessibility
        .violationsByImpact
        ?.moderate ??
      null,

    accessibilityMinor:
      accessibility
        .violationsByImpact
        ?.minor ??
      null,

    accessibilityIncomplete:
      accessibility
        .incompleteCount ??
      null,

    functionalPassedTests:
      functionalSummary
        .passedCount ??
      null,

    functionalFailedTests:
      functionalSummary
        .failedCount ??
      null,

    functionalTotalTests:
      functionalSummary
        .totalCount ??
      null,
  };
}

function prefixObject(
  prefix,
  value,
) {
  return Object.fromEntries(
    Object.entries(value).map(
      ([key, item]) => [
        `${prefix}${key[0].toUpperCase()}${key.slice(1)}`,
        item,
      ],
    ),
  );
}

async function loadResponse(
  experimentDirectory,
  run,
) {
  if (!run.responseFile) {
    return null;
  }

  const contents =
    await readFile(
      path.join(
        experimentDirectory,
        run.responseFile,
      ),
      "utf8",
    );

  return JSON.parse(contents);
}

export async function exportExperimentDatasets(
  manifest,
) {
  const experimentDirectory =
    getExperimentDirectory(
      manifest.experimentId,
    );

  const fullRuns = [];
  const flatRows = [];

  for (const run of manifest.runs) {
    const storedResponse =
      await loadResponse(
        experimentDirectory,
        run,
      );

    const responseBody =
      storedResponse?.body ??
      null;

    const classification =
      responseBody &&
      run.status === "completed"
        ? classifySuccessfulRun(
            responseBody,
          )
        : {
            initialReports: {},
            finalReports: {},
            initialPassStatus: {
              staticPassed: null,
              runtimePassed: null,
              accessibilityPassed: null,
              functionalPassed: null,
              allPassed: false,
            },
            finalPassStatus: {
              staticPassed: null,
              runtimePassed: null,
              accessibilityPassed: null,
              functionalPassed: null,
              allPassed: false,
            },
          };

    const metadata =
      responseBody?.run ??
      null;

    const metrics =
      metadata
        ?.experimentMetrics ??
      null;

    const initialCounts =
      getReportCounts(
        classification
          .initialReports,
      );

    const finalCounts =
      getReportCounts(
        classification
          .finalReports,
      );

    fullRuns.push({
      ...run,
      metadata,

      initialReports:
        classification
          .initialReports,

      finalReports:
        classification
          .finalReports,

      initialPassStatus:
        classification
          .initialPassStatus,

      finalPassStatus:
        classification
          .finalPassStatus,

      response:
        storedResponse,
    });

    flatRows.push({
      experimentId:
        manifest.experimentId,

      experimentRunId:
        run.experimentRunId,

      sequence:
        run.sequence,

      specificationId:
        run.specification.id,

      specificationName:
        run.specification.name,

      workflow:
        run.workflow,

      repetition:
        run.repetition,

      status:
        run.status,

      resultClassification:
        run.resultClassification,

      failureType:
        run.failureType,

      failureStage:
        run.failureStage,

      error:
        run.error,

      attemptCount:
        run.attemptCount,

      startedAt:
        run.startedAt,

      completedAt:
        run.completedAt,

      runId:
        run.runId,

      provider:
        manifest.configuration
          .provider,

      model:
        metadata?.model ??
        manifest.configuration
          .model,

      temperature:
        metadata?.temperature ??
        manifest.configuration
          .temperature,

      promptVersion:
        metadata
          ?.promptVersion ??
        manifest.configuration
          .promptVersion,

      runOrder:
        manifest.configuration
          .runOrder ??
        "fixed",

      randomSeed:
        manifest.configuration
          .randomSeed ??
        null,

      workflowDurationMs:
        metrics
          ?.workflowDurationMs ??
        null,

      aiGenerationDurationMs:
        metrics
          ?.aiGenerationDurationMs ??
        null,

      refinementIterations:
        metrics
          ?.refinementIterations ??
        null,

      converged:
        metrics?.converged ??
        null,

      stopReason:
        metrics?.stopReason ??
        null,

      totalPromptTokens:
        metrics
          ?.totalPromptTokens ??
        null,

      totalOutputTokens:
        metrics
          ?.totalOutputTokens ??
        null,

      totalTokens:
        metrics?.totalTokens ??
        null,

      ...prefixObject(
        "initial",
        classification
          .initialPassStatus,
      ),

      ...prefixObject(
        "initial",
        initialCounts,
      ),

      ...prefixObject(
        "final",
        classification
          .finalPassStatus,
      ),

      ...prefixObject(
        "final",
        finalCounts,
      ),

      staticIssueChange:
        Number.isFinite(
          initialCounts
            .staticTotalIssues,
        ) &&
        Number.isFinite(
          finalCounts
            .staticTotalIssues,
        )
          ? finalCounts
              .staticTotalIssues -
            initialCounts
              .staticTotalIssues
          : null,

      accessibilityViolationChange:
        Number.isFinite(
          initialCounts
            .accessibilityViolations,
        ) &&
        Number.isFinite(
          finalCounts
            .accessibilityViolations,
        )
          ? finalCounts
              .accessibilityViolations -
            initialCounts
              .accessibilityViolations
          : null,

      functionalFailedTestChange:
        Number.isFinite(
          initialCounts
            .functionalFailedTests,
        ) &&
        Number.isFinite(
          finalCounts
            .functionalFailedTests,
        )
          ? finalCounts
              .functionalFailedTests -
            initialCounts
              .functionalFailedTests
          : null,

      iterationMetrics:
        metrics?.iterations ??
        null,

      responseFile:
        run.responseFile,
    });
  }

  const fullDataset = {
    schemaVersion: "1.1.0",
    exportedAt:
      new Date().toISOString(),
    experimentId:
      manifest.experimentId,
    configuration:
      manifest.configuration,
    summary:
      manifest.summary,
    runs:
      fullRuns,
  };

  const jsonPath =
    path.join(
      experimentDirectory,
      "dataset.json",
    );

  const csvPath =
    path.join(
      experimentDirectory,
      "dataset.csv",
    );

  await writeJson(
    jsonPath,
    fullDataset,
  );

  const headers =
    flatRows.length > 0
      ? Object.keys(
          flatRows[0],
        )
      : [];

  const csvLines = [
    headers
      .map(csvEscape)
      .join(","),

    ...flatRows.map(
      (row) =>
        headers
          .map(
            (header) =>
              csvEscape(
                row[header],
              ),
          )
          .join(","),
    ),
  ];

  await writeFile(
    csvPath,
    `${csvLines.join("\n")}\n`,
    "utf8",
  );

  manifest.exports = {
    generatedAt:
      new Date().toISOString(),
    schemaVersion: "1.1.0",
    json: "dataset.json",
    csv: "dataset.csv",
  };

  await saveManifest(manifest);

  return {
    jsonPath,
    csvPath,
  };
}
