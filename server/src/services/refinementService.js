import { generateWithOllama } from "./ollamaService.js";
import { parseGeneratedApplication } from "../utils/responseParser.js";
import {
  buildQualityFeedback,
  hasActionableFeedback,
} from "../utils/qualityFeedbackBuilder.js";
import { buildRefinementPrompt } from "../prompts/buildRefinementPrompt.js";

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