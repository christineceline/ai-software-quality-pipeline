const MAX_STATIC_MESSAGES_PER_ANALYZER = 5;
const MAX_CONSOLE_ERRORS = 5;
const MAX_UNCAUGHT_EXCEPTIONS = 5;
const MAX_ACCESSIBILITY_VIOLATIONS = 5;
const MAX_NODES_PER_ACCESSIBILITY_VIOLATION = 3;

function summariseStaticAnalyzer(analyzer) {
  if (!analyzer) {
    return null;
  }

  return {
    tool: analyzer.tool,
    passed: analyzer.passed,
    issueCount: analyzer.issueCount,
    errorCount: analyzer.errorCount,
    warningCount: analyzer.warningCount,
    messages: (analyzer.messages || [])
      .slice(0, MAX_STATIC_MESSAGES_PER_ANALYZER),
  };
}

function summariseStaticAnalysis(qualityReport) {
  if (!qualityReport) {
    return null;
  }

  return {
    passed: qualityReport.summary?.passed ?? false,
    totalIssues:
      qualityReport.summary?.totalIssues ?? 0,
    totalErrors:
      qualityReport.summary?.totalErrors ?? 0,
    totalWarnings:
      qualityReport.summary?.totalWarnings ?? 0,

    html: summariseStaticAnalyzer(
      qualityReport.analyzers?.html,
    ),

    css: summariseStaticAnalyzer(
      qualityReport.analyzers?.css,
    ),

    javascript: summariseStaticAnalyzer(
      qualityReport.analyzers?.javascript,
    ),
  };
}

function summariseRuntimeValidation(runtimeReport) {
  if (!runtimeReport) {
    return null;
  }

  const missingControls =
    runtimeReport.requiredControls?.controls
      ?.filter((control) => !control.present)
      .map((control) => ({
        id: control.id,
        label: control.label,
      })) || [];

  return {
    passed:
      runtimeReport.summary?.runtimePassed ?? false,

    navigationSuccessful:
      runtimeReport.navigation?.successful ?? false,

    hasVisibleBodyContent:
      runtimeReport.body?.hasVisibleContent ?? false,

    consoleErrors: (
      runtimeReport.consoleErrors || []
    ).slice(0, MAX_CONSOLE_ERRORS),

    uncaughtExceptions: (
      runtimeReport.uncaughtExceptions || []
    ).slice(0, MAX_UNCAUGHT_EXCEPTIONS),

    requiredControls: {
      expected:
        runtimeReport.requiredControls?.expected ?? 0,

      present:
        runtimeReport.requiredControls?.present ?? 0,

      allPresent:
        runtimeReport.requiredControls?.allPresent ??
        false,

      missing: missingControls,
    },
  };
}

function summariseAccessibility(accessibilityReport) {
  if (!accessibilityReport) {
    return null;
  }

  return {
    successful:
      accessibilityReport.successful ?? false,

    violationCount:
      accessibilityReport.violationCount ?? 0,

    violatingNodeCount:
      accessibilityReport.violatingNodeCount ?? 0,

    violationsByImpact:
      accessibilityReport.violationsByImpact || {},

    violations: (
    accessibilityReport.violations || []
    )
    .slice(0, MAX_ACCESSIBILITY_VIOLATIONS)
    .map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        description: violation.description,
        help: violation.help,
        affectedNodeCount:
        violation.nodes?.length ?? 0,

        nodes: (violation.nodes || [])
        .slice(
            0,
            MAX_NODES_PER_ACCESSIBILITY_VIOLATION,
        )
        .map((node) => ({
            target: node.target,
            failureSummary: node.failureSummary,
        })),
    })),
  };
}

export function buildQualityFeedback({
  qualityReport,
  runtimeReport,
  accessibilityReport,
}) {
  if (
    !qualityReport ||
    !runtimeReport ||
    !accessibilityReport
  ) {
    throw new Error(
      "Quality, runtime and accessibility reports are required to build refinement feedback.",
    );
  }

  return {
    staticAnalysis:
      summariseStaticAnalysis(qualityReport),

    runtimeValidation:
      summariseRuntimeValidation(runtimeReport),

    accessibility:
      summariseAccessibility(accessibilityReport),
  };
}

export function hasActionableFeedback(feedback) {
  if (!feedback) {
    return false;
  }

  const staticHasIssues =
    (feedback.staticAnalysis?.totalIssues ?? 0) > 0;

  const runtimeHasIssues =
    feedback.runtimeValidation?.passed === false;

  const accessibilityHasIssues =
    (feedback.accessibility?.violationCount ?? 0) > 0;

  return (
    staticHasIssues ||
    runtimeHasIssues ||
    accessibilityHasIssues
  );
}