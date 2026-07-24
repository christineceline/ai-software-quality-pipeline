import path from "node:path";
import { writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

import { getRuntimeRequirements } from "../config/runtimeRequirements.js";

const DEFAULT_TIMEOUT_MS = 15_000;
const POST_LOAD_WAIT_MS = 500;

const AXE_TAGS = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
];

async function candidateExists(page, candidate) {
  if (candidate.type === "css") {
    const count = await page.locator(candidate.selector).count();
    return count > 0;
  }

  if (candidate.type === "role") {
    const count = await page
      .getByRole(candidate.role, {
        name: candidate.name,
      })
      .count();

    return count > 0;
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
        selector:
          candidate.type === "css"
            ? candidate.selector
            : undefined,
        role:
          candidate.type === "role"
            ? candidate.role
            : undefined,
        name:
          candidate.type === "role" &&
          candidate.name instanceof RegExp
            ? candidate.name.source
            : undefined,
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

function simplifyAxeNode(node) {
  return {
    html: node.html,
    target: node.target,
    failureSummary: node.failureSummary || null,
    impact: node.impact || null,
  };
}

function simplifyAxeViolation(violation) {
  return {
    id: violation.id,
    impact: violation.impact || null,
    tags: violation.tags,
    description: violation.description,
    help: violation.help,
    helpUrl: violation.helpUrl,
    nodeCount: violation.nodes.length,
    nodes: violation.nodes.map(simplifyAxeNode),
  };
}

function countViolationsByImpact(violations) {
  const counts = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
    unknown: 0,
  };

  for (const violation of violations) {
    const impact = violation.impact;

    if (impact && Object.hasOwn(counts, impact)) {
      counts[impact] += 1;
    } else {
      counts.unknown += 1;
    }
  }

  return counts;
}

function createFailedAccessibilityReport(error) {
  return {
    successful: false,
    standard: "WCAG 2.0 and 2.1 Level A and AA",
    tags: AXE_TAGS,
    violationCount: null,
    violatingNodeCount: null,
    violationsByImpact: null,
    violations: [],
    incompleteCount: null,
    inapplicableCount: null,
    passCount: null,
    error: {
      name: error.name || "Error",
      message: error.message || String(error),
    },
  };
}

async function runAccessibilityAnalysis(page) {
  try {
    const axeResults = await new AxeBuilder({ page })
      .withTags(AXE_TAGS)
      .analyze();

    const violations = axeResults.violations.map(
      simplifyAxeViolation,
    );

    return {
      successful: true,
      standard: "WCAG 2.0 and 2.1 Level A and AA",
      tags: AXE_TAGS,
      violationCount: violations.length,
      violatingNodeCount: violations.reduce(
        (total, violation) =>
          total + violation.nodeCount,
        0,
      ),
      violationsByImpact:
        countViolationsByImpact(violations),
      violations,
      incompleteCount: axeResults.incomplete.length,
      inapplicableCount: axeResults.inapplicable.length,
      passCount: axeResults.passes.length,
      error: null,
    };
  } catch (error) {
    return createFailedAccessibilityReport(error);
  }
}

async function writeJsonReport(filePath, report) {
  await writeFile(
    filePath,
    JSON.stringify(report, null, 2),
    "utf8",
  );
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
  let context;

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

    context = await browser.newContext({
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

    const navigationResponse = await page.goto(
      applicationUrl,
      {
        waitUntil: "load",
      },
    );

    const status = navigationResponse?.status() ?? null;

    navigation = {
      successful:
        navigationResponse === null ||
        (status >= 200 && status < 400),
      status,
      finalUrl: page.url(),
      error: null,
    };

    // Capture errors produced shortly after initial page loading.
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
      const result = await evaluateRequiredControl(
        page,
        requirement,
      );

      requiredControls.push(result);
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

    const accessibilityReport =
      await runAccessibilityAnalysis(page);

    const visibleBodyContent =
      body.exists &&
      body.visible &&
      body.textLength > 0;

    const runtimePassed =
      navigation.successful &&
      visibleBodyContent &&
      consoleErrors.length === 0 &&
      uncaughtExceptions.length === 0 &&
      requiredControlSummary.allPresent;

    const accessibilityPassed =
      accessibilityReport.successful &&
      accessibilityReport.violationCount === 0;

    const completedAt = new Date();

    const report = {
      reportVersion: "1.1",
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
      accessibility: accessibilityReport,
      summary: {
        runtimePassed,
        accessibilityPassed,
        navigationSuccessful: navigation.successful,
        hasVisibleBodyContent: visibleBodyContent,
        consoleErrorCount: consoleErrors.length,
        uncaughtExceptionCount:
          uncaughtExceptions.length,
        requiredControlsPresent:
          requiredControlSummary.present,
        requiredControlsExpected:
          requiredControlSummary.expected,
        accessibilityAnalysisSuccessful:
          accessibilityReport.successful,
        accessibilityViolationCount:
          accessibilityReport.violationCount,
        accessibilityViolatingNodeCount:
          accessibilityReport.violatingNodeCount,
      },
    };

    await Promise.all([
      writeJsonReport(
        path.join(runDirectory, "runtime-report.json"),
        report,
      ),
      writeJsonReport(
        path.join(
          runDirectory,
          "accessibility-report.json",
        ),
        accessibilityReport,
      ),
    ]);

    return report;
  } catch (error) {
    const completedAt = new Date();

    const accessibilityReport =
      createFailedAccessibilityReport(
        new Error(
          "Accessibility analysis was not completed because runtime validation failed.",
        ),
      );

    const report = {
      reportVersion: "1.1",
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
      accessibility: accessibilityReport,
      summary: {
        runtimePassed: false,
        accessibilityPassed: false,
        navigationSuccessful: false,
        hasVisibleBodyContent: false,
        consoleErrorCount: consoleErrors.length,
        uncaughtExceptionCount:
          uncaughtExceptions.length,
        requiredControlsPresent: 0,
        requiredControlsExpected: 0,
        accessibilityAnalysisSuccessful: false,
        accessibilityViolationCount: null,
        accessibilityViolatingNodeCount: null,
      },
      analysisError: {
        name: error.name || "Error",
        message: error.message || String(error),
        stack: error.stack || null,
      },
    };

    await Promise.all([
      writeJsonReport(
        path.join(runDirectory, "runtime-report.json"),
        report,
      ),
      writeJsonReport(
        path.join(
          runDirectory,
          "accessibility-report.json",
        ),
        accessibilityReport,
      ),
    ]);

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