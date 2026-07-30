import { GoogleGenAI, Type } from "@google/genai";

const applicationSchema = {
  type: Type.OBJECT,
  properties: {
    html: {
      type: Type.STRING,
    },
    css: {
      type: Type.STRING,
    },
    javascript: {
      type: Type.STRING,
    },
    metadata: {
      type: Type.OBJECT,
      properties: {
        applicationName: {
          type: Type.STRING,
        },
        summary: {
          type: Type.STRING,
        },
      },
      required: [
        "applicationName",
        "summary",
      ],
    },
  },
  required: [
    "html",
    "css",
    "javascript",
    "metadata",
  ],
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableGeminiError(error) {
  const status =
    error?.status ||
    error?.code ||
    error?.error?.code;

  return [429, 500, 502, 503, 504].includes(
    Number(status),
  );
}

export async function generateWithGemini({
  prompt,
  model,
  temperature = 0,
}) {
  const apiKey = process.env.GEMINI_API_KEY;

  const selectedModel =
    model ||
    process.env.GEMINI_MODEL ||
    "gemini-2.5-flash";

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured.",
    );
  }

  const ai = new GoogleGenAI({
    apiKey,
  });

  const startedAt = Date.now();

 let response;
let lastError;

const maxAttempts = 4;

for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  try {
    response = await ai.models.generateContent({
      model: selectedModel,
      contents: prompt,
      config: {
        temperature,
        responseMimeType: "application/json",
        responseSchema: applicationSchema,
      },
    });

    break;
  } catch (error) {
    lastError = error;

    if (
      !isRetryableGeminiError(error) ||
      attempt === maxAttempts
    ) {
      throw error;
    }

    const baseDelay = 1000 * 2 ** (attempt - 1);
    const jitter = Math.floor(Math.random() * 500);

    console.warn(
      `Gemini request failed with transient error. Retrying ${attempt}/${maxAttempts - 1}...`,
    );

    await sleep(baseDelay + jitter);
  }
}

if (!response) {
  throw lastError;
}

  const rawResponse = response.text;

  if (!rawResponse) {
    throw new Error(
      "Gemini returned an empty response.",
    );
  }

  return {
    model: selectedModel,
    rawResponse,
    generationMetrics: {
      totalDurationMs:
        Date.now() - startedAt,
      promptTokens:
        response.usageMetadata?.promptTokenCount ??
        null,
      outputTokens:
        response.usageMetadata?.candidatesTokenCount ??
        null,
      totalTokens:
        response.usageMetadata?.totalTokenCount ??
        null,
    },
  };
}