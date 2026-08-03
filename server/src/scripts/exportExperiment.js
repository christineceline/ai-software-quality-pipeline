import "dotenv/config";
import {
  exportExperimentDatasets,
} from "../experiments/experimentDataset.js";
import {
  loadManifest,
} from "../experiments/experimentStorage.js";

function getExperimentId(
  args = process.argv.slice(2),
) {
  const inline =
    args.find((argument) =>
      argument.startsWith(
        "--experiment-id=",
      ),
    );

  if (inline) {
    return inline.slice(
      "--experiment-id=".length,
    );
  }

  const optionIndex =
    args.indexOf(
      "--experiment-id",
    );

  if (optionIndex !== -1) {
    return args[
      optionIndex + 1
    ];
  }

  return args.find(
    (argument) =>
      !argument.startsWith("-"),
  );
}

async function main() {
  const experimentId =
    getExperimentId();

  if (!experimentId) {
    throw new Error(
      "Provide an experiment ID.",
    );
  }

  const manifest =
    await loadManifest(
      experimentId,
    );

  const result =
    await exportExperimentDatasets(
      manifest,
    );

  console.log(
    `JSON: ${result.jsonPath}`,
  );

  console.log(
    `CSV: ${result.csvPath}`,
  );
}

main().catch((error) => {
  console.error(
    "Dataset export failed:",
    error.message,
  );

  process.exitCode = 1;
});
