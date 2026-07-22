function removeCodeFences(value) {
  return value
    .replace(/```json/gi, "")
    .replace(/```javascript/gi, "")
    .replace(/```js/gi, "")
    .replace(/```/g, "")
    .trim();
}

function extractJsonObject(value) {
  const firstOpeningBrace = value.indexOf("{");
  const lastClosingBrace = value.lastIndexOf("}");

  if (
    firstOpeningBrace === -1 ||
    lastClosingBrace === -1 ||
    lastClosingBrace <= firstOpeningBrace
  ) {
    throw new Error("The AI response does not contain a JSON object.");
  }

  return value.slice(firstOpeningBrace, lastClosingBrace + 1);
}

function validateGeneratedApplication(application) {
  if (
    typeof application !== "object" ||
    application === null ||
    Array.isArray(application)
  ) {
    throw new Error("The parsed AI response is not an object.");
  }

  const requiredStringProperties = ["html", "css", "javascript"];

  for (const property of requiredStringProperties) {
    if (
      typeof application[property] !== "string" ||
      application[property].trim() === ""
    ) {
      throw new Error(
        `The generated application has no valid "${property}" property.`,
      );
    }
  }

  if (!application.html.toLowerCase().includes("<!doctype html")) {
    throw new Error(
      "The generated HTML is not a complete HTML document.",
    );
  }

  const metadata =
    typeof application.metadata === "object" &&
    application.metadata !== null &&
    !Array.isArray(application.metadata)
      ? application.metadata
      : {};

  return {
    html: application.html.trim(),
    css: application.css.trim(),
    javascript: application.javascript.trim(),
    metadata: {
      applicationName:
        typeof metadata.applicationName === "string" &&
        metadata.applicationName.trim() !== ""
          ? metadata.applicationName.trim()
          : "Generated Application",
      summary:
        typeof metadata.summary === "string"
          ? metadata.summary.trim()
          : "",
    },
  };
}

export function parseGeneratedApplication(rawResponse) {
  if (typeof rawResponse !== "string" || rawResponse.trim() === "") {
    throw new Error("Cannot parse an empty AI response.");
  }

  const cleanedResponse = removeCodeFences(rawResponse);
  const jsonText = extractJsonObject(cleanedResponse);

  let parsedResponse;

  try {
    parsedResponse = JSON.parse(jsonText);
  } catch (error) {
    throw new Error(`The AI returned invalid JSON: ${error.message}`);
  }

  return validateGeneratedApplication(parsedResponse);
}