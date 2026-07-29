import { chromium } from "playwright";
import { getFunctionalTests } from "../functional/functionalTests.js";

export async function runFunctionalValidation({
  applicationUrl,
  runDirectory,
  runId,
  specificationId,
}) {
  const tests = getFunctionalTests(specificationId);

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  const results = [];

  try {
    for (const test of tests) {
      try {
        await page.goto(applicationUrl, {
          waitUntil: "domcontentloaded",
        });

        await test.run(page);

        results.push({
          id: test.id,
          requirement: test.requirement,
          passed: true,
          error: null,
        });
      } catch (error) {
        results.push({
          id: test.id,
          requirement: test.requirement,
          passed: false,
          error: error.message,
        });
      }
    }
  } finally {
    await browser.close();
  }

  return {
    runId,
    specificationId,
    applicationUrl,
    runDirectory,
    tests: results,
    summary: {
      passed: results.every((result) => result.passed),
      passedCount: results.filter((result) => result.passed).length,
      failedCount: results.filter((result) => !result.passed).length,
      totalCount: results.length,
    },
  };
}