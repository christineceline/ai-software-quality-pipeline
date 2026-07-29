import htmlhintPackage from "htmlhint";

const { HTMLHint } = htmlhintPackage;

const htmlRules = {
  "alt-require": true,
  "attr-lowercase": true,
  "attr-no-duplication": true,
  "attr-value-double-quotes": true,
  "attr-value-not-empty": false,
  "doctype-first": true,
  "doctype-html5": true,
  "id-unique": true,
  "inline-script-disabled": true,
  "inline-style-disabled": true,
  "space-tab-mixed-disabled": true,
  "spec-char-escape": true,
  "src-not-empty": true,
  "tag-pair": true,
  "tag-self-close": false,
  "tagname-lowercase": true,
  "title-require": true,
};

function normaliseMessage(message) {
  return {
    line: message.line,
    column: message.col,
    evidence: message.evidence,
    message: message.message,
    ruleId: message.rule?.id ?? "unknown",
  };
}

export function analyseHtml(html) {
  if (typeof html !== "string") {
    throw new TypeError("HTML source must be a string.");
  }

  const messages = HTMLHint.verify(html, htmlRules).map(
    normaliseMessage,
  );

  return {
    tool: "HTMLHint",
    issueCount: messages.length,
    errorCount: messages.length,
    warningCount: 0,
    passed: messages.length === 0,
    messages,
  };
}