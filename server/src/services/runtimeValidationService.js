import path from "node:path";
import { writeFile } from "node:fs/promises";
import { chromium } from "playwright";

import { getRuntimeRequirements } from "../config/runtimeRequirements.js";

const DEFAULT_TIMEOUT_MS = 15_000;
const POST_LOAD_WAIT_MS = 500;

async function candidateExists(page, candidate) {
  if (candidate.type === "css") {
    return page.locator(candidate.selector).count().then(
      (count) => count > 0,
    );
  }

  if (candidate.type === "role") {
    return page
      .getByRole(candidate.role, {
        name: candidate.name,
      })
      .count()
      .then((count) => count > 0);
  }

  throw new Error(
    `Unsupported runtime requirement type: ${candidate.type}`,
  );
}

async function evaluateRequiredControl(page, requirement) {
  const candidateResults = [];

  for (const candidate of requirement.candidates) {
    try {
      const found = await candidateExists(page, candidate);

      candidateResults.push({
        type: candidate.type,
        selector:
          candidate.type === "css"
            ? candidate.selector
            : undefined,
        role:
          candidate.type === "role"
            ? candidate.role
            : undefined,
        name:
          candidate.type === "role"
            ? candidate.name.source
            : undefined,
        found,
      });
    } catch (error) {
      candidateResults.push({
        type: candidate.type,
        found: false,
        error: error.message,
      });
    }
  }

  return {
    id: requirement.id,
    label: requirement.label,
    present: candidateResults.some((result) => result.found),
    candidates: candidateResults,
  };
}

function normalisePageError(error) {
  return {
    name: error.name || "Error",
    message: error.message || String(error),
    stack: error.stack || null,
  };
}

export async function runRuntimeValidation({
  applicationUrl,
  runDirectory,
  runId,
  specificationId,
}) {
  const startedAt = new Date();
  const consoleErrors = [];
  const uncaughtExceptions = [];
  let browser;
  let navigation = {
    successful: false,
    status: null,
    finalUrl: null,
    error: null,
  };

  try {
    browser = await chromium.launch({
      headless: true,
    });

    const context = await browser.newContext({
      viewport: {
        width: 1280,
        height: 720,
      },
    });

    const page = await context.newPage();

    page.setDefaultTimeout(DEFAULT_TIMEOUT_MS);
    page.setDefaultNavigationTimeout(DEFAULT_TIMEOUT_MS);

    page.on("console", (message) => {
      if (message.type() !== "error") {
        return;
      }

      const location = message.location();

      consoleErrors.push({
        type: message.type(),
        text: message.text(),
        location: {
          url: location.url || null,
          lineNumber:
            Number.isInteger(location.lineNumber)
              ? location.lineNumber
              : null,
          columnNumber:
            Number.isInteger(location.columnNumber)
              ? location.columnNumber
              : null,
        },
      });
    });

    page.on("pageerror", (error) => {
      uncaughtExceptions.push(normalisePageError(error));
    });

    const response = await page.goto(applicationUrl, {
      waitUntil: "load",
    });

    navigation = {
      successful: true,
      status: response?.status() ?? null,
      finalUrl: page.url(),
      error: null,
    };

    // Allows short asynchronous startup errors to be captured.
    await page.waitForTimeout(POST_LOAD_WAIT_MS);

    const body = await page.evaluate(() => {
      const bodyElement = document.body;

      if (!bodyElement) {
        return {
          exists: false,
          visible: false,
          textLength: 0,
          textPreview: "",
        };
      }

      const styles = window.getComputedStyle(bodyElement);
      const rectangle = bodyElement.getBoundingClientRect();
      const text = bodyElement.innerText.trim();

      const visible =
        styles.display !== "none" &&
        styles.visibility !== "hidden" &&
        Number(styles.opacity) !== 0 &&
        rectangle.width > 0 &&
        rectangle.height > 0;

      return {
        exists: true,
        visible,
        textLength: text.length,
        textPreview: text.slice(0, 200),
      };
    });

    const requiredDefinitions =
      getRuntimeRequirements(specificationId);

    const requiredControls = [];

    for (const requirement of requiredDefinitions) {
      requiredControls.push(
        await evaluateRequiredControl(page, requirement),
      );
    }

    const requiredControlSummary = {
      expected: requiredControls.length,
      present: requiredControls.filter(
        (control) => control.present,
      ).length,
      allPresent: requiredControls.every(
        (control) => control.present,
      ),
      controls: requiredControls,
    };

    const visibleBodyContent =
      body.exists && body.visible && body.textLength > 0;

    const passed =
      navigation.successful &&
      visibleBodyContent &&
      consoleErrors.length === 0 &&
      uncaughtExceptions.length === 0 &&
      requiredControlSummary.allPresent;

    const completedAt = new Date();

    const report = {
      reportVersion: "1.0",
      runId,
      specificationId,
      applicationUrl,
      browser: {
        engine: "chromium",
        headless: true,
        viewport: {
          width: 1280,
          height: 720,
        },
      },
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      durationMs:
        completedAt.getTime() - startedAt.getTime(),
      navigation,
      body: {
        ...body,
        hasVisibleContent: visibleBodyContent,
      },
      consoleErrors,
      uncaughtExceptions,
      requiredControls: requiredControlSummary,
      summary: {
        passed,
        navigationSuccessful: navigation.successful,
        hasVisibleBodyContent: visibleBodyContent,
        consoleErrorCount: consoleErrors.length,
        uncaughtExceptionCount: uncaughtExceptions.length,
        requiredControlsPresent:
          requiredControlSummary.present,
        requiredControlsExpected:
          requiredControlSummary.expected,
      },
    };

    await writeFile(
      path.join(runDirectory, "runtime-report.json"),
      JSON.stringify(report, null, 2),
      "utf8",
    );

    await context.close();

    return report;
  } catch (error) {
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
      navigation: {
        ...navigation,
        error: error.message,
      },
      body: {
        exists: false,
        visible: false,
        textLength: 0,
        textPreview: "",
        hasVisibleContent: false,
      },
      consoleErrors,
      uncaughtExceptions,
      requiredControls: {
        expected: 0,
        present: 0,
        allPresent: false,
        controls: [],
      },
      summary: {
        passed: false,
        navigationSuccessful: false,
        hasVisibleBodyContent: false,
        consoleErrorCount: consoleErrors.length,
        uncaughtExceptionCount: uncaughtExceptions.length,
        requiredControlsPresent: 0,
        requiredControlsExpected: 0,
      },
      analysisError: {
        name: error.name,
        message: error.message,
        stack: error.stack || null,
      },
    };

    await writeFile(
      path.join(runDirectory, "runtime-report.json"),
      JSON.stringify(report, null, 2),
      "utf8",
    );

    return report;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}