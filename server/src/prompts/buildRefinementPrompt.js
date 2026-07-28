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

Your task is to improve the application using only the automated quality feedback provided below.

Important requirements:
- Preserve the original application specification and required functionality.
- Fix the reported quality issues where possible.
- Do not remove working functionality.
- Do not add unrelated features.
- Do not redesign the application unnecessarily.
- Keep the application frontend-only.
- Use only HTML, CSS and vanilla JavaScript.
- Do not use external frameworks, libraries or APIs.
- Do not use cookies or collect personal data.
- Return complete replacement files, not partial changes.
- Reference styles.css from the HTML.
- Reference script.js using defer.
- Do not include CSS or JavaScript inline.

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