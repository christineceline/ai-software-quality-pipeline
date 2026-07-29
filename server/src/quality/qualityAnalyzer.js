import { analyseCss } from "./cssAnalyzer.js";
import { analyseHtml } from "./htmlAnalyzer.js";
import { analyseJavaScript } from "./javascriptAnalyzer.js";

function calculateSummary({
  html,
  css,
  javascript,
}) {
  const totalIssues =
    html.issueCount +
    css.issueCount +
    javascript.issueCount;

  const totalErrors =
    html.errorCount +
    css.errorCount +
    javascript.errorCount;

  const totalWarnings =
    html.warningCount +
    css.warningCount +
    javascript.warningCount;

  return {
    totalIssues,
    totalErrors,
    totalWarnings,
    passed:
      html.passed &&
      css.passed &&
      javascript.passed,
  };
}

export async function analyseApplication(application) {
  if (!application) {
    throw new Error(
      "An application is required for quality analysis.",
    );
  }

  const html = analyseHtml(application.html);
  const javascript = analyseJavaScript(
    application.javascript,
  );
  const css = await analyseCss(application.css);

  return {
    analysedAt: new Date().toISOString(),
    analyzers: {
      html,
      css,
      javascript,
    },
    summary: calculateSummary({
      html,
      css,
      javascript,
    }),
  };
}