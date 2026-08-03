import {
  access,
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFilePath =
  fileURLToPath(import.meta.url);

const currentDirectory =
  path.dirname(currentFilePath);

const defaultExperimentsDirectory =
  path.resolve(
    currentDirectory,
    "../../../experiments",
  );

export function getExperimentsDirectory() {
  const configuredDirectory =
    process.env.EXPERIMENTS_DIRECTORY;

  if (!configuredDirectory) {
    return defaultExperimentsDirectory;
  }

  return path.resolve(
    process.cwd(),
    configuredDirectory,
  );
}

export function getExperimentDirectory(
  experimentId,
) {
  return path.join(
    getExperimentsDirectory(),
    experimentId,
  );
}

export function getManifestPath(
  experimentId,
) {
  return path.join(
    getExperimentDirectory(
      experimentId,
    ),
    "manifest.json",
  );
}

export async function pathExists(
  targetPath,
) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function writeJson(
  filePath,
  value,
) {
  await mkdir(
    path.dirname(filePath),
    { recursive: true },
  );

  await writeFile(
    filePath,
    JSON.stringify(value, null, 2),
    "utf8",
  );
}

export async function readJson(
  filePath,
) {
  const contents =
    await readFile(
      filePath,
      "utf8",
    );

  return JSON.parse(contents);
}

export async function createExperiment({
  configuration,
  runs,
}) {
  const experimentDirectory =
    getExperimentDirectory(
      configuration.experimentId,
    );

  const manifestPath =
    getManifestPath(
      configuration.experimentId,
    );

  if (await pathExists(manifestPath)) {
    throw new Error(
      `Experiment "${configuration.experimentId}" already exists.`,
    );
  }

  await mkdir(
    path.join(
      experimentDirectory,
      "responses",
    ),
    { recursive: true },
  );

  const manifest = {
    schemaVersion: "1.0.0",
    experimentId:
      configuration.experimentId,
    status: "pending",
    createdAt:
      configuration.createdAt,
    startedAt: null,
    completedAt: null,
    updatedAt:
      configuration.createdAt,
    configuration,
    summary: {
      totalRuns: runs.length,
      pending: runs.length,
      running: 0,
      completed: 0,
      failed: 0,
      validPassed: 0,
      validPoorQuality: 0,
      generationApiFailures: 0,
      pipelineFailures: 0,
    },
    runs,
  };

  await saveManifest(manifest);

  return manifest;
}

export async function loadManifest(
  experimentId,
) {
  const manifestPath =
    getManifestPath(experimentId);

  if (!(await pathExists(manifestPath))) {
    throw new Error(
      `Experiment "${experimentId}" was not found at ${manifestPath}.`,
    );
  }

  return readJson(manifestPath);
}

export function updateManifestSummary(
  manifest,
) {
  const summary = {
    totalRuns:
      manifest.runs.length,
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
    validPassed: 0,
    validPoorQuality: 0,
    generationApiFailures: 0,
    pipelineFailures: 0,
  };

  for (const run of manifest.runs) {
    if (
      Object.hasOwn(
        summary,
        run.status,
      )
    ) {
      summary[run.status] += 1;
    }

    if (
      run.resultClassification ===
      "valid-passed"
    ) {
      summary.validPassed += 1;
    }

    if (
      run.resultClassification ===
      "valid-poor-quality"
    ) {
      summary.validPoorQuality += 1;
    }

    if (
      run.failureType ===
      "generation-api-failure"
    ) {
      summary.generationApiFailures += 1;
    }

    if (
      run.failureType ===
      "pipeline-failure"
    ) {
      summary.pipelineFailures += 1;
    }
  }

  manifest.summary = summary;
  return manifest;
}

export async function saveManifest(
  manifest,
) {
  manifest.updatedAt =
    new Date().toISOString();

  updateManifestSummary(manifest);

  await writeJson(
    getManifestPath(
      manifest.experimentId,
    ),
    manifest,
  );

  return manifest;
}

export async function saveRunResponse({
  experimentId,
  experimentRunId,
  value,
}) {
  const relativePath =
    path.join(
      "responses",
      `${experimentRunId}.json`,
    );

  const absolutePath =
    path.join(
      getExperimentDirectory(
        experimentId,
      ),
      relativePath,
    );

  await writeJson(
    absolutePath,
    value,
  );

  return relativePath
    .split(path.sep)
    .join("/");
}
