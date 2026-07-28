import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);

const defaultRunsDirectory = path.resolve(
  currentDirectory,
  "../../../generated-apps/runs",
);

function getRunsDirectory() {
  const configuredDirectory = process.env.GENERATED_APPS_DIRECTORY;

  if (!configuredDirectory) {
    return defaultRunsDirectory;
  }

  return path.resolve(process.cwd(), configuredDirectory);
}

function createRunId() {
  const timestamp = new Date()
    .toISOString()
    .replaceAll(":", "-")
    .replaceAll(".", "-");

  return `${timestamp}-${randomUUID().slice(0, 8)}`;
}

async function writeJson(filePath, value) {
  await writeFile(
    filePath,
    JSON.stringify(value, null, 2),
    "utf8",
  );
}

export async function saveGeneratedRun({
  application,
  specification,
  workflow,
  model,
  temperature,
  prompt,
  rawResponse,
  generationMetrics,
  qualityReport,
}) {
  const runId = createRunId();
  const runDirectory = path.join(getRunsDirectory(), runId);

  await mkdir(runDirectory, { recursive: true });

  const metadata = {
    runId,
    createdAt: new Date().toISOString(),
    specification: {
      id: specification.id,
      name: specification.name,
    },
    workflow,
    model,
    temperature,
    promptVersion: "1.0.0",
    generationMetrics,
    generatedApplication: application.metadata,
    qualitySummary: qualityReport.summary,
  };

  await Promise.all([
    writeFile(
      path.join(runDirectory, "index.html"),
      application.html,
      "utf8",
    ),
    writeFile(
      path.join(runDirectory, "styles.css"),
      application.css,
      "utf8",
    ),
    writeFile(
      path.join(runDirectory, "script.js"),
      application.javascript,
      "utf8",
    ),
    writeFile(
      path.join(runDirectory, "prompt.txt"),
      prompt,
      "utf8",
    ),
    writeFile(
      path.join(runDirectory, "raw-response.txt"),
      rawResponse,
      "utf8",
    ),
    writeJson(
      path.join(runDirectory, "metadata.json"), metadata
    ),
    writeJson(
      path.join(runDirectory, "quality-report.json"),
      qualityReport,
    ),
  ]);

  return {
    ...metadata,
    runDirectory,
  };
}

export async function saveRefinementRun({
  application,
  specification,
  workflow,
  model,
  temperature,
  prompt,
  rawResponse,
  generationMetrics,
  qualityReport,
  maxRefinementIterations,
}) {
  const runId = createRunId();

  const runDirectory = path.join(
    getRunsDirectory(),
    runId,
  );

  const iterationsDirectory = path.join(
    runDirectory,
    "iterations",
  );

  const iterationDirectory = path.join(
    iterationsDirectory,
    "0",
  );

  await mkdir(iterationDirectory, {
    recursive: true,
  });

  const createdAt = new Date().toISOString();

  const iterationMetadata = {
    iteration: 0,
    type: "initial-generation",
    createdAt,
    generationMetrics,
    qualitySummary: qualityReport.summary,
  };

  const metadata = {
    runId,
    createdAt,
    specification: {
      id: specification.id,
      name: specification.name,
    },
    workflow,
    model,
    temperature,
    promptVersion: "1.0.0",
    maxRefinementIterations,
    generatedApplication: application.metadata,
    iterations: [
      iterationMetadata,
    ],
  };

  await Promise.all([
    writeFile(
      path.join(iterationDirectory, "index.html"),
      application.html,
      "utf8",
    ),
    writeFile(
      path.join(iterationDirectory, "styles.css"),
      application.css,
      "utf8",
    ),
    writeFile(
      path.join(iterationDirectory, "script.js"),
      application.javascript,
      "utf8",
    ),
    writeFile(
      path.join(iterationDirectory, "prompt.txt"),
      prompt,
      "utf8",
    ),
    writeFile(
      path.join(
        iterationDirectory,
        "raw-response.txt",
      ),
      rawResponse,
      "utf8",
    ),
    writeJson(
      path.join(
        iterationDirectory,
        "metadata.json",
      ),
      iterationMetadata,
    ),
    writeJson(
      path.join(
        iterationDirectory,
        "quality-report.json",
      ),
      qualityReport,
    ),
    writeJson(
      path.join(runDirectory, "metadata.json"),
      metadata,
    ),
  ]);

  return {
    ...metadata,
    runDirectory,
    iterationDirectory,
  };
}

export async function saveRefinementIteration({
  runDirectory,
  iteration,
  application,
  prompt,
  rawResponse,
  generationMetrics,
  qualityReport,
}) {
  if (!Number.isInteger(iteration) || iteration < 1) {
    throw new Error(
      "Refinement iteration must be an integer greater than or equal to 1.",
    );
  }

  const iterationDirectory = path.join(
    runDirectory,
    "iterations",
    String(iteration),
  );

  await mkdir(iterationDirectory, {
    recursive: false,
  });

  const iterationMetadata = {
    iteration,
    type: "refinement",
    createdAt: new Date().toISOString(),
    generationMetrics,
    qualitySummary: qualityReport.summary,
  };

  await Promise.all([
    writeFile(
      path.join(iterationDirectory, "index.html"),
      application.html,
      "utf8",
    ),
    writeFile(
      path.join(iterationDirectory, "styles.css"),
      application.css,
      "utf8",
    ),
    writeFile(
      path.join(iterationDirectory, "script.js"),
      application.javascript,
      "utf8",
    ),
    writeFile(
      path.join(iterationDirectory, "prompt.txt"),
      prompt,
      "utf8",
    ),
    writeFile(
      path.join(
        iterationDirectory,
        "raw-response.txt",
      ),
      rawResponse,
      "utf8",
    ),
    writeJson(
      path.join(
        iterationDirectory,
        "metadata.json",
      ),
      iterationMetadata,
    ),
    writeJson(
      path.join(
        iterationDirectory,
        "quality-report.json",
      ),
      qualityReport,
    ),
  ]);

  return {
    ...iterationMetadata,
    iterationDirectory,
  };
}