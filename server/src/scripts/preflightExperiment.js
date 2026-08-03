import "dotenv/config";
import {
  parseExperimentArguments,
} from "../experiments/experimentConfig.js";
import {
  printPreflightReport,
  runExperimentPreflight,
} from "../experiments/experimentPreflight.js";

async function main() {
  const options =
    parseExperimentArguments();

  const report =
    await runExperimentPreflight({
      baseUrl:
        options.baseUrl,
      temperature:
        options.temperature,
      requireOpenAI: true,
    });

  printPreflightReport(
    report,
  );

  if (!report.passed) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(
    "Experiment preflight failed:",
    error.message,
  );

  process.exitCode = 1;
});
