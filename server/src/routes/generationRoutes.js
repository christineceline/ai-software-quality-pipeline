import express from "express";
import { buildPrompt } from "../prompts/buildPrompt.js";
import { generateApplication } from "../services/generationService.js";
import {
  saveGeneratedRun,
  completeGeneratedRun,
  saveRefinementRun,
  completeRefinementRun,
} from "../services/runStorageService.js";
import { getSpecificationById } from "../specifications/index.js";
import { parseGeneratedApplication } from "../utils/responseParser.js";
import { analyseApplication } from "../quality/qualityAnalyzer.js";
import { runRuntimeValidation } from "../services/runtimeValidationService.js";
import { runFunctionalValidation } from "../services/functionalValidationService.js";
import {
  MAX_REFINEMENT_ITERATIONS,
  runRefinementLoop,
} from "../services/refinementService.js";

const router = express.Router();

const supportedWorkflows = [
  "one-shot",
  "quality-focused",
  "automated-refinement",
];

function sumMetric(metrics, property) {
  const values = metrics
    .map((item) => item?.[property])
    .filter((value) => Number.isFinite(value));

  if (values.length === 0) {
    return null;
  }

  return values.reduce(
    (total, value) => total + value,
    0,
  );
}

router.post("/", async (request, response) => {
  const workflowStartedAt = Date.now();
  let failureType = "generation-api-failure";
  let failureStage = "request-validation";

  try {
    const {
      specificationId,
      workflow,
      temperature = 0,
    } = request.body;

    if (
      typeof specificationId !== "string" ||
      specificationId.trim() === ""
    ) {
      return response.status(400).json({
        error: "A specificationId is required.",
        failureType: "request-failure",
        failureStage,
      });
    }

    if (!supportedWorkflows.includes(workflow)) {
      return response.status(400).json({
        error: `Workflow must be one of: ${supportedWorkflows.join(", ")}.`,
        failureType: "request-failure",
        failureStage,
      });
    }

    const specification = getSpecificationById(
      specificationId.trim(),
    );

    if (!specification) {
      return response.status(404).json({
        error: `No specification exists with ID "${specificationId}".`,
        failureType: "request-failure",
        failureStage,
      });
    }

    const initialPromptWorkflow =
      workflow === "automated-refinement"
        ? "one-shot"
        : workflow;

    failureStage = "prompt-construction";

    const prompt = buildPrompt({
      workflow: initialPromptWorkflow,
      specification,
    });

    failureStage = "ai-generation";

    const generationResult =
      await generateApplication({
        prompt,
        temperature,
      });

    failureStage = "response-parsing";

    const application =
      parseGeneratedApplication(
        generationResult.rawResponse,
      );

    failureType = "pipeline-failure";
    failureStage = "static-analysis";

    const qualityReport =
      await analyseApplication(application);

    if (workflow === "automated-refinement") {
      failureStage = "run-storage";

      const runMetadata =
        await saveRefinementRun({
          application,
          specification,
          workflow,
          model: generationResult.model,
          temperature: Number(temperature),
          prompt,
          rawResponse:
            generationResult.rawResponse,
          generationMetrics:
            generationResult.generationMetrics,
          qualityReport,
          maxRefinementIterations:
            MAX_REFINEMENT_ITERATIONS,
        });

      const {
        runId,
        runDirectory,
        iterationDirectory,
      } = runMetadata;

      const encodedRunId =
        encodeURIComponent(runId);

      const initialApplicationUrl =
        `http://localhost:${process.env.PORT || 3001}` +
        `/generated-apps/runs/${encodedRunId}` +
        `/iterations/0/index.html`;

      failureStage = "runtime-validation";

      const initialRuntimeReport =
        await runRuntimeValidation({
          applicationUrl:
            initialApplicationUrl,
          runDirectory:
            iterationDirectory,
          runId,
          specificationId:
            specification.id,
        });

      failureStage = "functional-validation";

      const initialFunctionalReport =
        await runFunctionalValidation({
          applicationUrl:
            initialApplicationUrl,
          runDirectory:
            iterationDirectory,
          runId,
          specificationId:
            specification.id,
        });

      failureStage = "automated-refinement";

      const refinementResult =
        await runRefinementLoop({
          runId,
          runDirectory,
          specification,
          initialApplication:
            application,
          initialQualityReport:
            qualityReport,
          initialRuntimeReport,
          initialAccessibilityReport:
            initialRuntimeReport.accessibility,
          initialFunctionalReport,
          temperature:
            Number(temperature),
        });

      const workflowDurationMs =
        Date.now() - workflowStartedAt;

      const iterationMetrics = [
        generationResult.generationMetrics,
        ...refinementResult.iterations.map(
          (iteration) =>
            iteration.generationMetrics,
        ),
      ];

      const experimentMetrics = {
        workflowDurationMs,

        aiGenerationDurationMs:
          sumMetric(
            iterationMetrics,
            "totalDurationMs",
          ),

        refinementIterations:
          refinementResult.completedIterations,

        converged:
          refinementResult.stopReason ===
          "no-actionable-feedback",

        stopReason:
          refinementResult.stopReason,

        totalPromptTokens:
          sumMetric(
            iterationMetrics,
            "promptTokens",
          ),

        totalOutputTokens:
          sumMetric(
            iterationMetrics,
            "outputTokens",
          ),

        totalTokens:
          sumMetric(
            iterationMetrics,
            "totalTokens",
          ),

        iterations:
          iterationMetrics.map(
            (metrics, iteration) => ({
              iteration,

              generationDurationMs:
                metrics?.totalDurationMs ??
                null,

              promptTokens:
                metrics?.promptTokens ??
                null,

              outputTokens:
                metrics?.outputTokens ??
                null,

              totalTokens:
                metrics?.totalTokens ??
                null,
            }),
          ),
      };

      failureStage = "run-finalisation";

      const completedRunMetadata =
        await completeRefinementRun({
          runDirectory,
          refinementResult,
          experimentMetrics,
        });

      return response.status(201).json({
        run: {
          ...completedRunMetadata,
          runDirectory,
        },

        initial: {
          iteration: 0,
          application,
          qualityReport,
          runtimeReport:
            initialRuntimeReport,
          accessibilityReport:
            initialRuntimeReport.accessibility,
          functionalReport:
            initialFunctionalReport,
          generationMetrics:
            generationResult.generationMetrics,
        },

        refinement:
          refinementResult,
      });
    }

    failureStage = "run-storage";

    const runMetadata =
      await saveGeneratedRun({
        application,
        specification,
        workflow,
        model: generationResult.model,
        temperature: Number(temperature),
        prompt,
        rawResponse:
          generationResult.rawResponse,
        generationMetrics:
          generationResult.generationMetrics,
        qualityReport,
      });

    const {
      runId,
      runDirectory,
    } = runMetadata;

    if (!runId || !runDirectory) {
      throw new Error(
        "saveGeneratedRun did not return runId and runDirectory.",
      );
    }

    const encodedRunId =
      encodeURIComponent(runId);

    const applicationUrl =
      `http://localhost:${process.env.PORT || 3001}` +
      `/generated-apps/runs/${encodedRunId}/index.html`;

    failureStage = "runtime-validation";

    const runtimeReport =
      await runRuntimeValidation({
        applicationUrl,
        runDirectory,
        runId,
        specificationId:
          specification.id,
      });

    failureStage = "functional-validation";

    const functionalReport =
      await runFunctionalValidation({
        applicationUrl,
        runDirectory,
        runId,
        specificationId:
          specification.id,
      });

    const workflowDurationMs =
      Date.now() - workflowStartedAt;

    const generationMetrics =
      generationResult.generationMetrics;

    const experimentMetrics = {
      workflowDurationMs,

      aiGenerationDurationMs:
        generationMetrics.totalDurationMs ??
        null,

      refinementIterations: 0,

      converged: null,

      stopReason: "not-applicable",

      totalPromptTokens:
        generationMetrics.promptTokens ??
        null,

      totalOutputTokens:
        generationMetrics.outputTokens ??
        null,

      totalTokens:
        generationMetrics.totalTokens ??
        null,

      iterations: [
        {
          iteration: 0,

          generationDurationMs:
            generationMetrics.totalDurationMs ??
            null,

          promptTokens:
            generationMetrics.promptTokens ??
            null,

          outputTokens:
            generationMetrics.outputTokens ??
            null,

          totalTokens:
            generationMetrics.totalTokens ??
            null,
        },
      ],
    };

    failureStage = "run-finalisation";

    const completedRunMetadata =
      await completeGeneratedRun({
        runDirectory,
        experimentMetrics,
      });

    return response.status(201).json({
      run: completedRunMetadata,
      application,
      qualityReport,
      runtimeReport,
      accessibilityReport:
        runtimeReport.accessibility,
      functionalReport,
    });
  } catch (error) {
    console.error(
      "Generation failed:",
      error,
    );

    return response.status(500).json({
      error:
        "Application generation failed.",
      details: error.message,
      failureType,
      failureStage,
    });
  }
});

export default router;
