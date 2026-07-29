import stylelint from "stylelint";

const stylelintConfig = {
  rules: {
    "annotation-no-unknown": true,
    "at-rule-no-unknown": true,
    "block-no-empty": true,
    "color-no-invalid-hex": true,
    "comment-no-empty": true,
    "custom-property-no-missing-var-function": true,
    "declaration-block-no-duplicate-custom-properties": true,
    "declaration-block-no-duplicate-properties": [
      true,
      {
        ignore: ["consecutive-duplicates-with-different-values"],
      },
    ],
    "declaration-block-no-shorthand-property-overrides": true,
    "font-family-no-duplicate-names": true,
    "font-family-no-missing-generic-family-keyword": true,
    "function-calc-no-unspaced-operator": true,
    "function-linear-gradient-no-nonstandard-direction": true,
    "function-no-unknown": true,
    "keyframe-block-no-duplicate-selectors": true,
    "keyframe-declaration-no-important": true,
    "media-feature-name-no-unknown": true,
    "named-grid-areas-no-invalid": true,
    "no-descending-specificity": null,
    "no-duplicate-at-import-rules": true,
    "no-duplicate-selectors": true,
    "no-empty-source": null,
    "no-invalid-double-slash-comments": true,
    "property-no-unknown": true,
    "selector-anb-no-unmatchable": true,
    "selector-pseudo-class-no-unknown": true,
    "selector-pseudo-element-no-unknown": true,
    "string-no-newline": true,
    "unit-no-unknown": true,
  },
};

function normaliseWarning(warning) {
  return {
    line: warning.line ?? null,
    column: warning.column ?? null,
    endLine: warning.endLine ?? null,
    endColumn: warning.endColumn ?? null,
    severity: warning.severity ?? "error",
    message: warning.text,
    ruleId: warning.rule ?? "unknown",
  };
}

export async function analyseCss(css) {
  if (typeof css !== "string") {
    throw new TypeError("CSS source must be a string.");
  }

  const result = await stylelint.lint({
    code: css,
    codeFilename: "styles.css",
    config: stylelintConfig,
  });

  const messages = result.results.flatMap((fileResult) =>
    fileResult.warnings.map(normaliseWarning),
  );

  const errorCount = messages.filter(
    (message) => message.severity === "error",
  ).length;

  const warningCount = messages.filter(
    (message) => message.severity === "warning",
  ).length;

  return {
    tool: "Stylelint",
    issueCount: messages.length,
    errorCount,
    warningCount,
    passed: errorCount === 0,
    messages,
  };
}