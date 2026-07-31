import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const applicationSchema = {
  type: "object",
  properties: {
    html: {
      type: "string",
    },
    css: {
      type: "string",
    },
    javascript: {
      type: "string",
    },
    metadata: {
      type: "object",
      properties: {
        applicationName: {
          type: "string",
        },
        summary: {
          type: "string",
        },
      },
      required: [
        "applicationName",
        "summary",
      ],
      additionalProperties: false,
    },
  },
  required: [
    "html",
    "css",
    "javascript",
    "metadata",
  ],
  additionalProperties: false,
};

export async function generateWithOpenAI({
  prompt,
  model,
  temperature = 0,
}) {
  const apiKey = process.env.OPENAI_API_KEY;

  const selectedModel =
    model ||
    process.env.OPENAI_MODEL ||
    "gpt-5.6-luna";

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured.",
    );
  }

  const startedAt = Date.now();

  const response = await client.responses.create({
    model: selectedModel,
    input: prompt,

    reasoning: {
      effort: "low",
    },

    text: {
      format: {
        type: "json_schema",
        name: "generated_application",
        strict: true,
        schema: applicationSchema,
      },
    },
  });

  const rawResponse = response.output_text;

  if (!rawResponse) {
    throw new Error(
      "OpenAI returned an empty response.",
    );
  }

  console.log(
    "OpenAI usage:",
    response.usage,
  );

  return {
    model: selectedModel,
    rawResponse,

    generationMetrics: {
      totalDurationMs:
        Date.now() - startedAt,

      promptTokens:
        response.usage?.input_tokens ??
        null,

      outputTokens:
        response.usage?.output_tokens ??
        null,

      totalTokens:
        response.usage?.total_tokens ??
        null,

      finishReason: null,
    },
  };
}