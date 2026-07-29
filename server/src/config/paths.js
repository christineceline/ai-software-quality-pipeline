import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

export const repositoryRoot = path.resolve(
  currentDirectory,
  "../../..",
);

export const generatedAppsDirectory = path.join(
  repositoryRoot,
  "generated-apps",
);

export const generatedRunsDirectory = path.join(
  generatedAppsDirectory,
  "runs",
);