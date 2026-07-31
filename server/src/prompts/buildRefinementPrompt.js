const REFINEMENT_PROMPT_VERSION = "1.0.0";

export function buildRefinementPrompt({
  specification,
  application,
  feedback,
  iteration,
}) {
  if (!specification) {
    throw new Error(
      "A specification is required to build a refinement prompt.",
    );
  }

  if (!application) {
    throw new Error(
      "An application is required to build a refinement prompt.",
    );
  }

  if (!feedback) {
    throw new Error(
      "Quality feedback is required to build a refinement prompt.",
    );
  }

  return `
You are refining an existing frontend web application.

Refinement iteration: ${iteration}

Your task is to REPAIR the existing application based on the automated validation failures below.

You MUST modify the application to address every reported issue that can be repaired.

The automated feedback represents observed defects in the current application. Do not simply reproduce the current application.

Repair priorities:

1. FUNCTIONAL FAILURES
- Every failed functional test represents required behaviour that is currently broken.
- Modify the HTML and/or JavaScript so each failed requirement works.
- Check that HTML element IDs and JavaScript selectors match.
- Check that event listeners are attached to elements that actually exist.
- Add any controls required by the original specification, including controls for completing or deleting items where applicable.

2. RUNTIME FAILURES
- Every uncaught exception must be investigated and repaired.
- If JavaScript attempts to access an element that does not exist, correct either the HTML or the JavaScript so they match.
- Do not leave code that can throw the reported exception.

3. ACCESSIBILITY VIOLATIONS
- Repair every reported accessibility violation where possible.
- Use each node's target and failureSummary to identify the affected element.
- For contrast violations, change the relevant CSS colours so the reported WCAG minimum contrast ratio is met.

4. STATIC ANALYSIS
- Repair reported HTMLHint, Stylelint and ESLint issues.
- Apply straightforward lint fixes such as changing let to const when a variable is never reassigned.

Before returning the application, verify your replacement files against:
- the original specification;
- every functional failure;
- every runtime exception;
- every accessibility violation;
- every static-analysis issue.

IMPORTANT:
- The replacement application MUST contain concrete code changes addressing the reported feedback.
- Do NOT return the current application unchanged when actionable feedback exists.
- Preserve functionality that already works.
- Do not add unrelated features.
- Do not redesign the application unnecessarily.
- Keep the application frontend-only.
- Use only HTML, CSS and vanilla JavaScript.
- Do not use external frameworks, libraries or APIs.
- Do not use cookies or collect personal data.
- Return complete replacement files, not patches.
- Reference styles.css from the HTML.
- Reference script.js using defer.
- Do not include CSS or JavaScript inline.
- Preserve every test hook and state attribute defined in the original specification's testabilityContract.
- Do not remove, rename or repurpose required data-testid attributes during refinement.

Return valid JSON only.
Do not use Markdown code fences.

The JSON must have this exact structure:

{
  "html": "complete HTML document",
  "css": "complete stylesheet",
  "javascript": "complete JavaScript source",
  "metadata": {
    "applicationName": "short name",
    "summary": "one-sentence summary"
  }
}

ORIGINAL APPLICATION SPECIFICATION

${JSON.stringify(specification, null, 2)}

CURRENT APPLICATION

HTML:
${application.html}

CSS:
${application.css}

JAVASCRIPT:
${application.javascript}

AUTOMATED QUALITY FEEDBACK

${JSON.stringify(feedback, null, 2)}

Improve the existing application while preserving its original specification.
`.trim();
}

export function getRefinementPromptVersion() {
  return REFINEMENT_PROMPT_VERSION;
}