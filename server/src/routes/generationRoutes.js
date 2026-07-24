import express from "express";
import { buildPrompt } from "../prompts/buildPrompt.js";
import { generateWithOllama } from "../services/ollamaService.js";
import { saveGeneratedRun } from "../services/runStorageService.js";
import { getSpecificationById } from "../specifications/index.js";
import { parseGeneratedApplication } from "../utils/responseParser.js";
import { analyseApplication } from "../quality/qualityAnalyzer.js";
import { runRuntimeValidation } from "../services/runtimeValidationService.js";

const router = express.Router();

const supportedWorkflows = ["one-shot", "quality-focused"];

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

    const prompt = buildPrompt({
      workflow,
      specification,
    });

    const ollamaResult = await generateWithOllama({
      prompt,
      temperature,
    });

    const application = parseGeneratedApplication(
      ollamaResult.rawResponse,
    );

    const qualityReport = await analyseApplication(application);

const runMetadata = await saveGeneratedRun({
  application,
  specification,
  workflow,
  model: ollamaResult.model,
  temperature: Number(temperature),
  prompt,
  rawResponse: ollamaResult.rawResponse,
  generationMetrics: ollamaResult.generationMetrics,
  qualityReport,
});

const { runId, runDirectory } = runMetadata;

if (!runId || !runDirectory) {
  throw new Error(
    "saveGeneratedRun did not return runId and runDirectory.",
  );
}

const encodedRunId = encodeURIComponent(runId);

const applicationUrl =
  `http://localhost:${process.env.PORT || 3001}` +
  `/generated-apps/runs/${encodedRunId}/index.html`;

const runtimeReport = await runRuntimeValidation({
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