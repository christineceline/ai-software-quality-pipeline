import "dotenv/config";
import {
  printValidationReport,
  validateExperiment,
} from "../experiments/experimentValidation.js";

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

  const report =
    await validateExperiment(
      experimentId,
    );

  printValidationReport(
    report,
  );

  if (!report.passed) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(
    "Experiment validation failed:",
    error.message,
  );

  process.exitCode = 1;
});
