import { Linter } from "eslint";

const linter = new Linter();

const eslintConfig = [
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        alert: "readonly",
        console: "readonly",
        document: "readonly",
        Event: "readonly",
        HTMLElement: "readonly",
        localStorage: "readonly",
        navigator: "readonly",
        Node: "readonly",
        setInterval: "readonly",
        setTimeout: "readonly",
        window: "readonly",
      },
    },

    rules: {
      "constructor-super": "error",
      "for-direction": "error",
      "getter-return": "error",
      "no-async-promise-executor": "error",
      "no-class-assign": "error",
      "no-compare-neg-zero": "error",
      "no-cond-assign": "error",
      "no-const-assign": "error",
      "no-constant-binary-expression": "error",
      "no-constant-condition": "error",
      "no-control-regex": "error",
      "no-debugger": "error",
      "no-dupe-args": "error",
      "no-dupe-class-members": "error",
      "no-dupe-else-if": "error",
      "no-dupe-keys": "error",
      "no-duplicate-case": "error",
      "no-empty-character-class": "error",
      "no-empty-pattern": "error",
      "no-ex-assign": "error",
      "no-extra-boolean-cast": "error",
      "no-fallthrough": "error",
      "no-func-assign": "error",
      "no-import-assign": "error",
      "no-inner-declarations": "error",
      "no-invalid-regexp": "error",
      "no-irregular-whitespace": "error",
      "no-loss-of-precision": "error",
      "no-misleading-character-class": "error",
      "no-new-native-nonconstructor": "error",
      "no-obj-calls": "error",
      "no-promise-executor-return": "error",
      "no-prototype-builtins": "warn",
      "no-self-assign": "error",
      "no-setter-return": "error",
      "no-shadow-restricted-names": "error",
      "no-sparse-arrays": "error",
      "no-this-before-super": "error",
      "no-undef": "error",
      "no-unexpected-multiline": "error",
      "no-unreachable": "error",
      "no-unreachable-loop": "error",
      "no-unsafe-finally": "error",
      "no-unsafe-negation": "error",
      "no-unsafe-optional-chaining": "error",
      "no-unused-labels": "error",
      "no-useless-backreference": "error",
      "no-useless-catch": "error",
      "no-useless-escape": "warn",
      "no-with": "error",
      "require-yield": "error",
      "use-isnan": "error",
      "valid-typeof": "error",

      "eqeqeq": "warn",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-var": "warn",
      "prefer-const": "warn",
    },
  },
];

function normaliseMessage(message) {
  return {
    line: message.line ?? null,
    column: message.column ?? null,
    endLine: message.endLine ?? null,
    endColumn: message.endColumn ?? null,
    severity: message.severity === 2 ? "error" : "warning",
    message: message.message,
    ruleId: message.ruleId ?? "parsing-error",
  };
}

export function analyseJavaScript(javascript) {
  if (typeof javascript !== "string") {
    throw new TypeError(
      "JavaScript source must be a string.",
    );
  }

  const rawMessages = linter.verify(
    javascript,
    eslintConfig,
    {
      filename: "script.js",
    },
  );

  const messages = rawMessages.map(normaliseMessage);

  const errorCount = messages.filter(
    (message) => message.severity === "error",
  ).length;

  const warningCount = messages.filter(
    (message) => message.severity === "warning",
  ).length;

  return {
    tool: "ESLint",
    issueCount: messages.length,
    errorCount,
    warningCount,
    passed: errorCount === 0,
    messages,
  };
}