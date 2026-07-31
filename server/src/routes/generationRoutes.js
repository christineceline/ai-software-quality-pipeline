import express from "express";
import { buildPrompt } from "../prompts/buildPrompt.js";
import { generateApplication } from "../services/generationService.js";
import {
  saveGeneratedRun,
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

router.post("/", async (request, response) => {
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
      });
    }

    if (!supportedWorkflows.includes(workflow)) {
      return response.status(400).json({
        error: `Workflow must be one of: ${supportedWorkflows.join(", ")}.`,
      });
    }

    const specification = getSpecificationById(
      specificationId.trim(),
    );

    if (!specification) {
      return response.status(404).json({
        error: `No specification exists with ID "${specificationId}".`,
      });
    }

    const initialPromptWorkflow =
      workflow === "automated-refinement"
        ? "one-shot"
        : workflow;

    const prompt = buildPrompt({
      workflow: initialPromptWorkflow,
      specification,
    });

    const generationResult = await generateApplication({
      prompt,
      temperature,
    });

    const application = parseGeneratedApplication(
      generationResult.rawResponse,
    );

    const qualityReport = await analyseApplication(application);

if (workflow === "automated-refinement") {
  const runMetadata = await saveRefinementRun({
    application,
    specification,
    workflow,
    model: generationResult.model,
    temperature: Number(temperature),
    prompt,
    rawResponse: generationResult.rawResponse,
    generationMetrics: generationResult.generationMetrics,
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

  const initialRuntimeReport =
    await runRuntimeValidation({
      applicationUrl: initialApplicationUrl,
      runDirectory: iterationDirectory,
      runId,
      specificationId: specification.id,
    });

  const initialFunctionalReport =
    await runFunctionalValidation({
      applicationUrl: initialApplicationUrl,
      runDirectory: iterationDirectory,
      runId,
      specificationId: specification.id,
    });

  const refinementResult =
    await runRefinementLoop({
      runId,
      runDirectory,
      specification,
      initialApplication:
        application,
      initialQualityReport:
        qualityReport,
      initialRuntimeReport:
        initialRuntimeReport,
      initialAccessibilityReport:
        initialRuntimeReport.accessibility,
      initialFunctionalReport,
      temperature:
        Number(temperature),
    });

    const completedRunMetadata =
      await completeRefinementRun({
        runDirectory,
        refinementResult,
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
      runtimeReport: initialRuntimeReport,
      accessibilityReport:
        initialRuntimeReport.accessibility,
      functionalReport: initialFunctionalReport,
      generationMetrics:
        generationResult.generationMetrics,
    },

    refinement: refinementResult,
  });
}

const runMetadata = await saveGeneratedRun({
  application,
  specification,
  workflow,
  model: generationResult.model,
  temperature: Number(temperature),
  prompt,
  rawResponse: generationResult.rawResponse,
  generationMetrics: generationResult.generationMetrics,
  qualityReport,
});

const { runId, runDirectory } = runMetadata;

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

const runtimeReport =
  await runRuntimeValidation({
    applicationUrl,
    runDirectory,
    runId,
    specificationId: specification.id,
  });

  const functionalReport =
  await runFunctionalValidation({
    applicationUrl,
    runDirectory,
    runId,
    specificationId: specification.id,
  });

return response.status(201).json({
  run: runMetadata,
  application,
  qualityReport,
  runtimeReport,
  accessibilityReport:
    runtimeReport.accessibility,
  functionalReport,
});

  } catch (error) {
    console.error("Generation failed:", error);

    return response.status(500).json({
      error: "Application generation failed.",
      details: error.message,
    });
  }
});

export default router;
