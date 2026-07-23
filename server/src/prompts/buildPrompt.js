const OUTPUT_INSTRUCTIONS = `
Return one valid JSON object only.

Do not include:
- Markdown
- Code fences
- Explanatory text before or after the JSON

The JSON object must use this exact structure:
{
  "html": "A complete HTML document",
  "css": "The complete stylesheet",
  "javascript": "The complete JavaScript source",
  "metadata": {
    "applicationName": "A short application name",
    "summary": "A one-sentence summary"
  }
}

The HTML must:
- Begin with <!doctype html>.
- Reference styles.css using a link element.
- Reference script.js using a script element with the defer attribute.
- Contain no inline CSS.
- Contain no inline JavaScript.

The CSS and JavaScript must be returned separately in their corresponding
JSON properties.

All newline characters and quotation marks inside JSON strings must be
properly escaped so that the response can be parsed using JSON.parse().
`.trim();

function formatSpecification(specification) {
  const requirements = specification.functionalRequirements
    .map((requirement, index) => `${index + 1}. ${requirement}`)
    .join("\n");

  return `
Application name: ${specification.name}

Description:
${specification.description}

Functional requirements:
${requirements}
`.trim();
}

export function buildOneShotPrompt(specification) {
  return `
You are a frontend web developer.

Create the complete frontend web application described below using:
- HTML
- CSS
- Vanilla JavaScript

Make it visually appealing.
Do not use external frameworks, external libraries, external APIs, cookies,
analytics, user accounts or server-side code.

${formatSpecification(specification)}

${OUTPUT_INSTRUCTIONS}
`.trim();
}

export function buildQualityFocusedPrompt(specification) {
  return `
You are a senior frontend web developer specialising in software quality.

Create the complete frontend web application described below using:
- HTML
- CSS
- Vanilla JavaScript

Functional correctness and software quality are equally important.

Quality requirements:
- Make it visually appealing.
- Use semantic HTML5 elements.
- Provide associated labels for every form control.
- Ensure the application is usable using a keyboard.
- Use accessible names for interactive controls.
- Maintain a logical heading structure.
- Provide visible keyboard focus styles.
- Use sufficient colour contrast.
- Avoid unnecessary ARIA attributes.
- Provide clear validation and error messages.
- Use responsive CSS that works on mobile and desktop.
- Avoid fixed dimensions that cause horizontal scrolling.
- Organise JavaScript into small, clearly named functions.
- Use const and let instead of var.
- Avoid duplicated logic.
- Handle invalid input safely.
- Do not use eval or dynamically execute strings as code.
- Do not use inline event handlers.
- Keep HTML, CSS and JavaScript separated.

Do not use external frameworks, external libraries, external APIs, cookies,
analytics, user accounts or server-side code.

${formatSpecification(specification)}

${OUTPUT_INSTRUCTIONS}
`.trim();
}

export function buildPrompt({ workflow, specification }) {
  switch (workflow) {
    case "one-shot":
      return buildOneShotPrompt(specification);

    case "quality-focused":
      return buildQualityFocusedPrompt(specification);

    case "automated-refinement":
      throw new Error(
        "Automated refinement has not been implemented at this stage.",
      );

    default:
      throw new Error(`Unsupported workflow: ${workflow}`);
  }
}