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
    writeJson(path.join(runDirectory, "metadata.json"), metadata),
  ]);

  return metadata;
}