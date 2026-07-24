import path from "node:path";
import { fileURLToPath } from "node:url";

import { runRuntimeValidation } from "../services/runtimeValidationService.js";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);

const runId = process.argv[2];
const specificationId = process.argv[3];

if (!runId || !specificationId) {
  console.error(
    "Usage: npm run validate:run -- <runId> <specificationId>",
  );

  process.exit(1);
}

const runsDirectory = path.resolve(
  currentDirectory,
  "../../../generated-apps/runs",
);

const runDirectory = path.join(runsDirectory, runId);

const port = process.env.PORT || 3001;

const applicationUrl =
  `http://localhost:${port}` +
  `/generated-apps/runs/${encodeURIComponent(runId)}` +
  "/index.html";

try {
  const report = await runRuntimeValidation({
    applicationUrl,
    runDirectory,
    runId,
    specificationId,
  });

  console.log("Runtime validation complete.");
  console.log(
    JSON.stringify(report.summary, null, 2),
  );
} catch (error) {
  console.error("Runtime validation failed:");
  console.error(error);

  process.exit(1);
}