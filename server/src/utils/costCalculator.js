function parseOptionalRate(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const parsedValue = Number(value);

  if (
    !Number.isFinite(parsedValue) ||
    parsedValue < 0
  ) {
    return null;
  }

  return parsedValue;
}

export function calculateEstimatedCost({
  promptTokens,
  outputTokens,
}) {
  const inputCostPerMillionTokens =
    parseOptionalRate(
      process.env.OPENAI_INPUT_COST_PER_MILLION_TOKENS,
    );

  const outputCostPerMillionTokens =
    parseOptionalRate(
      process.env.OPENAI_OUTPUT_COST_PER_MILLION_TOKENS,
    );

  if (
    inputCostPerMillionTokens === null ||
    outputCostPerMillionTokens === null
  ) {
    return {
      estimatedCostUsd: null,
      inputCostUsd: null,
      outputCostUsd: null,
      pricingConfigured: false,
    };
  }

  const validPromptTokens =
    Number.isFinite(promptTokens)
      ? promptTokens
      : 0;

  const validOutputTokens =
    Number.isFinite(outputTokens)
      ? outputTokens
      : 0;

  const inputCostUsd =
    (validPromptTokens / 1_000_000) *
    inputCostPerMillionTokens;

  const outputCostUsd =
    (validOutputTokens / 1_000_000) *
    outputCostPerMillionTokens;

  return {
    estimatedCostUsd:
      inputCostUsd + outputCostUsd,

    inputCostUsd,
    outputCostUsd,

    pricingConfigured: true,

    inputCostPerMillionTokens,
    outputCostPerMillionTokens,
  };
}