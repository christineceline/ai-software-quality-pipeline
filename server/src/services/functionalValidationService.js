import path from "node:path";
import { writeFile } from "node:fs/promises";
import { chromium } from "playwright";

import { getFunctionalTests } from "../functional/functionalTests.js";

const DEFAULT_TIMEOUT_MS = 15_000;

async function writeJsonReport(filePath, report) {
  await writeFile(
    filePath,
    JSON.stringify(report, null, 2),
    "utf8",
  );
}

export async function runFunctionalValidation({
  applicationUrl,
  runDirectory,
  runId,
  specificationId,
}) {
  const startedAt = new Date();
  const tests = getFunctionalTests(specificationId);
  const results = [];

  let browser;
  let context;

  try {
    browser = await chromium.launch({
      headless: true,
    });

    context = await browser.newContext({
      viewport: {
        width: 1280,
        height: 720,
      },
    });

    const page = await context.newPage();

    page.setDefaultTimeout(DEFAULT_TIMEOUT_MS);
    page.setDefaultNavigationTimeout(DEFAULT_TIMEOUT_MS);

    for (const test of tests) {
      try {
        await page.goto(applicationUrl, {
          waitUntil: "load",
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
          error: {
            name: error.name || "Error",
            message: error.message || String(error),
          },
        });
      }
    }

    const completedAt = new Date();

    const report = {
      reportVersion: "1.0",
      runId,
      specificationId,
      applicationUrl,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      durationMs:
        completedAt.getTime() - startedAt.getTime(),
      tests: results,
      summary: {
        passed:
          results.length > 0 &&
          results.every((result) => result.passed),
        passedCount: results.filter(
          (result) => result.passed,
        ).length,
        failedCount: results.filter(
          (result) => !result.passed,
        ).length,
        totalCount: results.length,
      },
    };

    await writeJsonReport(
      path.join(runDirectory, "functional-report.json"),
      report,
    );

    return report;
  } finally {
    if (context) {
      await context.close().catch(() => {});
    }

    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}