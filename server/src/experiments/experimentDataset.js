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

function getFinalReports(
  responseBody,
) {
  if (
    responseBody?.refinement
  ) {
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
        finalIteration?.qualityReport ??
        responseBody.initial
          ?.qualityReport ??
        null,
      runtimeReport:
        finalIteration?.runtimeReport ??
        responseBody.initial
          ?.runtimeReport ??
        null,
      accessibilityReport:
        finalIteration
          ?.accessibilityReport ??
        finalIteration?.runtimeReport
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

function getBoolean(
  ...values
) {
  return values.find(
    (value) =>
      typeof value === "boolean",
  ) ?? null;
}

export function classifySuccessfulRun(
  responseBody,
) {
  const reports =
    getFinalReports(responseBody);

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
        ?.summary?.accessibilityPassed,
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

  const allPassed =
    passValues.length > 0 &&
    passValues.every(Boolean);

  return {
    resultClassification:
      allPassed
        ? "valid-passed"
        : "valid-poor-quality",
    reports,
    passStatus: {
      staticPassed,
      runtimePassed,
      accessibilityPassed,
      functionalPassed,
      allPassed,
    },
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
    return `"${text.replaceAll("\"", "\"\"")}"`;
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

  const accessibilitySummary =
    reports.accessibilityReport
      ?.summary ?? {};

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
      runtimeSummary.consoleErrors ??
      reports.runtimeReport
        ?.consoleErrors?.length ??
      null,
    runtimePageErrors:
      runtimeSummary.pageErrors ??
      reports.runtimeReport
        ?.pageErrors?.length ??
      null,
    accessibilityViolations:
      accessibilitySummary
        .violationCount ??
      reports.accessibilityReport
        ?.violations?.length ??
      null,
    accessibilityAffectedNodes:
      accessibilitySummary
        .affectedNodes ??
      null,
    functionalPassedTests:
      functionalSummary
        .passedTests ??
      functionalSummary.passed ??
      null,
    functionalFailedTests:
      functionalSummary
        .failedTests ??
      functionalSummary.failed ??
      null,
    functionalTotalTests:
      functionalSummary
        .totalTests ??
      null,
  };
}

async function loadResponse(
  experimentDirectory,
  run,
) {
  if (!run.responseFile) {
    return null;
  }

  const responsePath =
    path.join(
      experimentDirectory,
      run.responseFile,
    );

  const contents =
    await readFile(
      responsePath,
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
            reports: {
              qualityReport: null,
              runtimeReport: null,
              accessibilityReport: null,
              functionalReport: null,
            },
            passStatus: {
              staticPassed: null,
              runtimePassed: null,
              accessibilityPassed: null,
              functionalPassed: null,
              allPassed: false,
            },
          };

    const metadata =
      responseBody?.run ?? null;

    const metrics =
      metadata?.experimentMetrics ??
      null;

    const counts =
      getReportCounts(
        classification.reports,
      );

    fullRuns.push({
      ...run,
      metadata,
      reports:
        classification.reports,
      passStatus:
        classification.passStatus,
      response: storedResponse,
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
        manifest.configuration.model,
      temperature:
        metadata?.temperature ??
        manifest.configuration
          .temperature,
      promptVersion:
        metadata?.promptVersion ??
        manifest.configuration
          .promptVersion,
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
      staticPassed:
        classification.passStatus
          .staticPassed,
      runtimePassed:
        classification.passStatus
          .runtimePassed,
      accessibilityPassed:
        classification.passStatus
          .accessibilityPassed,
      functionalPassed:
        classification.passStatus
          .functionalPassed,
      allQualityChecksPassed:
        classification.passStatus
          .allPassed,
      ...counts,
      iterationMetrics:
        metrics?.iterations ??
        null,
      responseFile:
        run.responseFile,
    });
  }

  const fullDataset = {
    schemaVersion: "1.0.0",
    exportedAt:
      new Date().toISOString(),
    experimentId:
      manifest.experimentId,
    configuration:
      manifest.configuration,
    summary:
      manifest.summary,
    runs: fullRuns,
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
      ? Object.keys(flatRows[0])
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
    json: "dataset.json",
    csv: "dataset.csv",
  };

  await saveManifest(manifest);

  return {
    jsonPath,
    csvPath,
  };
}
