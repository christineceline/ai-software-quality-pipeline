import "dotenv/config";
import {
  buildExperimentConfiguration,
  buildRunPlan,
  createExperimentId,
  parseExperimentArguments,
  printExperimentHelp,
} from "../experiments/experimentConfig.js";
import {
  createExperiment,
  loadManifest,
  saveManifest,
  saveRunResponse,
} from "../experiments/experimentStorage.js";
import {
  classifySuccessfulRun,
  exportExperimentDatasets,
} from "../experiments/experimentDataset.js";
import {
  printPreflightReport,
  runExperimentPreflight,
} from "../experiments/experimentPreflight.js";

function findNextRunnableRun(
  manifest,
) {
  return manifest.runs.find(
    (run) =>
      run.status === "pending",
  );
}

function resetInterruptedRuns(
  manifest,
) {
  for (const run of manifest.runs) {
    if (run.status === "running") {
      run.status = "pending";
      run.startedAt = null;
      run.error =
        "Previous process stopped while this run was in progress; run reset to pending.";
    }
  }
}

function resetFailedRuns(
  manifest,
) {
  for (const run of manifest.runs) {
    if (run.status === "failed") {
      run.status = "pending";
      run.startedAt = null;
      run.completedAt = null;
      run.runId = null;
      run.resultClassification =
        null;
      run.failureType = null;
      run.failureStage = null;
      run.error = null;
      run.responseFile = null;
    }
  }
}

async function checkServer(
  baseUrl,
) {
  let response;

  try {
    response =
      await fetch(
        `${baseUrl}/api/health`,
      );
  } catch (error) {
    throw new Error(
      `Cannot connect to ${baseUrl}. Start the Express server before running the experiment. ${error.message}`,
    );
  }

  if (!response.ok) {
    throw new Error(
      `Server health check failed with HTTP ${response.status}.`,
    );
  }
}

async function executeRun({
  manifest,
  run,
}) {
  run.status = "running";
  run.startedAt =
    new Date().toISOString();
  run.completedAt = null;
  run.attemptCount += 1;
  run.error = null;
  run.failureType = null;
  run.failureStage = null;

  await saveManifest(manifest);

  console.log(
    `[${run.sequence}/${manifest.summary.totalRuns}] ` +
    `${run.specification.id} | ${run.workflow} | repetition ${run.repetition}`,
  );

  let httpResponse;
  let responseBody = null;
  let transportError = null;

  try {
    httpResponse =
      await fetch(
        `${manifest.configuration.baseUrl}/api/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            specificationId:
              run.specification.id,
            workflow:
              run.workflow,
            temperature:
              manifest.configuration
                .temperature,
          }),
        },
      );

    const responseText =
      await httpResponse.text();

    if (responseText.trim()) {
      try {
        responseBody =
          JSON.parse(responseText);
      } catch {
        responseBody = {
          error:
            "Server returned a non-JSON response.",
          details:
            responseText,
          failureType:
            "pipeline-failure",
          failureStage:
            "response-serialization",
        };
      }
    }
  } catch (error) {
    transportError = error;
    responseBody = {
      error:
        "Experiment runner could not reach the generation endpoint.",
      details:
        error.message,
      failureType:
        "generation-api-failure",
      failureStage:
        "http-request",
    };
  }

  const responseFile =
    await saveRunResponse({
      experimentId:
        manifest.experimentId,
      experimentRunId:
        run.experimentRunId,
      value: {
        capturedAt:
          new Date().toISOString(),
        httpStatus:
          httpResponse?.status ??
          null,
        ok:
          httpResponse?.ok ??
          false,
        body: responseBody,
      },
    });

  run.responseFile =
    responseFile;
  run.completedAt =
    new Date().toISOString();

  if (
    transportError ||
    !httpResponse?.ok
  ) {
    run.status = "failed";
    run.failureType =
      responseBody?.failureType ??
      "generation-api-failure";
    run.failureStage =
      responseBody?.failureStage ??
      "unknown";
    run.error =
      responseBody?.details ??
      responseBody?.error ??
      transportError?.message ??
      `HTTP ${httpResponse?.status ?? "unknown"}`;

    console.error(
      `  Failed: ${run.failureType} at ${run.failureStage}: ${run.error}`,
    );
  } else {
    const classification =
      classifySuccessfulRun(
        responseBody,
      );

    run.status = "completed";
    run.runId =
      responseBody?.run?.runId ??
      null;
    run.resultClassification =
      classification
        .resultClassification;

    console.log(
      `  Completed: ${run.resultClassification}` +
      (run.runId
        ? ` (${run.runId})`
        : ""),
    );
  }

  await saveManifest(manifest);
  await exportExperimentDatasets(
    manifest,
  );
}

async function loadOrCreateExperiment(
  options,
) {
  if (options.experimentId) {
    const manifest =
      await loadManifest(
        options.experimentId,
      );

    resetInterruptedRuns(
      manifest,
    );

    if (options.retryFailed) {
      resetFailedRuns(manifest);
    }

    await saveManifest(manifest);

    return manifest;
  }

  if (
    options.repetitions === null
  ) {
    throw new Error(
      "--repetitions N is required when creating a new experiment.",
    );
  }

  const preflight =
    await runExperimentPreflight({
      baseUrl:
        options.baseUrl,
      temperature:
        options.temperature,
      requireOpenAI: true,
    });

  printPreflightReport(
    preflight,
  );

  if (!preflight.passed) {
    throw new Error(
      "Experiment preflight failed. Resolve all blocking checks before creating a new experiment.",
    );
  }

  const experimentId =
    createExperimentId();

  const configuration =
    buildExperimentConfiguration({
      experimentId,
      repetitions:
        options.repetitions,
      baseUrl:
        options.baseUrl,
      temperature:
        options.temperature,
    });

  const runs =
    buildRunPlan(
      configuration,
    );

  return createExperiment({
    configuration,
    runs,
  });
}

async function main() {
  const options =
    parseExperimentArguments();

  if (options.help) {
    printExperimentHelp();
    return;
  }

  const manifest =
    await loadOrCreateExperiment(
      options,
    );

  await checkServer(
    manifest.configuration.baseUrl,
  );

  if (!manifest.startedAt) {
    manifest.startedAt =
      new Date().toISOString();
  }

  manifest.status = "running";
  manifest.completedAt = null;

  await saveManifest(manifest);

  console.log(
    `Experiment: ${manifest.experimentId}`,
  );
  console.log(
    `Runs: ${manifest.summary.totalRuns}; completed: ${manifest.summary.completed}; failed: ${manifest.summary.failed}; pending: ${manifest.summary.pending}`,
  );

  let run =
    findNextRunnableRun(manifest);

  while (run) {
    await executeRun({
      manifest,
      run,
    });

    run =
      findNextRunnableRun(
        manifest,
      );
  }

  manifest.status =
    manifest.summary.failed > 0
      ? "completed-with-failures"
      : "completed";

  manifest.completedAt =
    new Date().toISOString();

  await saveManifest(manifest);

  const exports =
    await exportExperimentDatasets(
      manifest,
    );

  console.log(
    `Experiment finished with status: ${manifest.status}`,
  );
  console.log(
    `JSON: ${exports.jsonPath}`,
  );
  console.log(
    `CSV: ${exports.csvPath}`,
  );
}

main().catch((error) => {
  console.error(
    "Experiment runner failed:",
    error.message,
  );

  process.exitCode = 1;
});
