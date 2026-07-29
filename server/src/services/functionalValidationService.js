import { getFunctionalTests } from "../functional/functionalTests.js";

export async function runFunctionalValidation({
  applicationUrl,
  runDirectory,
  runId,
  specificationId,
}) {
  const tests = getFunctionalTests(specificationId);

  return {
    applicationUrl,
    runDirectory,
    runId,
    specificationId,
    tests,
  };
}