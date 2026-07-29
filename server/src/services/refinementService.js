import { generateWithOllama } from "./ollamaService.js";
import { parseGeneratedApplication } from "../utils/responseParser.js";
import {
  buildQualityFeedback,
  hasActionableFeedback,
} from "../utils/qualityFeedbackBuilder.js";
import { buildRefinementPrompt } from "../prompts/buildRefinementPrompt.js";
import { analyseApplication } from "../quality/qualityAnalyzer.js";
import { runRuntimeValidation } from "./runtimeValidationService.js";
import { saveRefinementIteration } from "./runStorageService.js";

export const MAX_REFINEMENT_ITERATIONS = 3;

export async function refineApplicationOnce({
  specification,
  application,
  qualityReport,
  runtimeReport,
  accessibilityReport,
  temperature = 0,
  iteration = 1,
}) {
  const feedback = buildQualityFeedback({
    qualityReport,
    runtimeReport,
    accessibilityReport,
  });

  if (!hasActionableFeedback(feedback)) {
    return {
      refined: false,
      reason: "no-actionable-feedback",
      feedback,
    };
  }

  const prompt = buildRefinementPrompt({
    specification,
    application,
    feedback,
    iteration,
  });

  const ollamaResult = await generateWithOllama({
    prompt,
    temperature,
  });

  const refinedApplication = parseGeneratedApplication(
    ollamaResult.rawResponse,
  );

  return {
    refined: true,
    reason: null,
    iteration,
    prompt,
    feedback,
    application: refinedApplication,
    model: ollamaResult.model,
    rawResponse: ollamaResult.rawResponse,
    generationMetrics: ollamaResult.generationMetrics,
  };
}

export async function refineAndEvaluateOnce({
  runId,
  runDirectory,
  specification,
  application,
  qualityReport,
  runtimeReport,
  accessibilityReport,
  temperature = 0,
  iteration = 1,
}) {
  const refinementResult = await refineApplicationOnce({
    specification,
    application,
    qualityReport,
    runtimeReport,
    accessibilityReport,
    temperature,
    iteration,
  });

  if (!refinementResult.refined) {
    return refinementResult;
  }

  const refinedApplication =
    refinementResult.application;

  const refinedQualityReport =
    await analyseApplication(refinedApplication);

  const savedIteration =
    await saveRefinementIteration({
      runDirectory,
      iteration,
      application: refinedApplication,
      prompt: refinementResult.prompt,
      rawResponse:
        refinementResult.rawResponse,
      generationMetrics:
        refinementResult.generationMetrics,
      qualityReport:
        refinedQualityReport,
    });

  const encodedRunId =
    encodeURIComponent(runId);

  const applicationUrl =
    `http://localhost:${process.env.PORT || 3001}` +
    `/generated-apps/runs/${encodedRunId}` +
    `/iterations/${iteration}/index.html`;

  const refinedRuntimeReport =
    await runRuntimeValidation({
      applicationUrl,
      runDirectory:
        savedIteration.iterationDirectory,
      runId,
      specificationId: specification.id,
    });

  return {
    refined: true,
    reason: null,
    iteration,
    application:
      refinedApplication,
    qualityReport:
      refinedQualityReport,
    runtimeReport:
      refinedRuntimeReport,
    accessibilityReport:
      refinedRuntimeReport.accessibility,
    feedback:
      refinementResult.feedback,
    prompt:
      refinementResult.prompt,
    generationMetrics:
      refinementResult.generationMetrics,
    iterationDirectory:
      savedIteration.iterationDirectory,
  };
}

export async function runRefinementLoop({
  runId,
  runDirectory,
  specification,
  initialApplication,
  initialQualityReport,
  initialRuntimeReport,
  initialAccessibilityReport,
  temperature = 0,
}) {
  const iterations = [];

  let currentApplication =
    initialApplication;

  let currentQualityReport =
    initialQualityReport;

  let currentRuntimeReport =
    initialRuntimeReport;

  let currentAccessibilityReport =
    initialAccessibilityReport;

  for (
    let iteration = 1;
    iteration <= MAX_REFINEMENT_ITERATIONS;
    iteration += 1
  ) {
    const result =
      await refineAndEvaluateOnce({
        runId,
        runDirectory,
        specification,
        application:
          currentApplication,
        qualityReport:
          currentQualityReport,
        runtimeReport:
          currentRuntimeReport,
        accessibilityReport:
          currentAccessibilityReport,
        temperature,
        iteration,
      });

    if (!result.refined) {
      return {
        iterations,
        stoppedEarly: true,
        stopReason:
          result.reason,
        completedIterations:
          iterations.length,
      };
    }

    iterations.push(result);

    currentApplication =
      result.application;

    currentQualityReport =
      result.qualityReport;

    currentRuntimeReport =
      result.runtimeReport;

    currentAccessibilityReport =
      result.accessibilityReport;
  }

  return {
    iterations,
    stoppedEarly: false,
    stopReason:
      "maximum-iterations-reached",
    completedIterations:
      iterations.length,
  };
}