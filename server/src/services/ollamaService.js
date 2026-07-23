function getOllamaBaseUrl() {
  return (
    process.env.OLLAMA_BASE_URL ||
    "http://localhost:11434"
  );
}

function getDefaultModel() {
  return process.env.OLLAMA_MODEL;
}

function normaliseTemperature(value) {
  if (value === undefined || value === null || value === "") {
    return 0;
  }

  const parsedValue = Number(value);

  if (
    !Number.isFinite(parsedValue) ||
    parsedValue < 0 ||
    parsedValue > 2
  ) {
    throw new Error(
      "Temperature must be a number between 0 and 2.",
    );
  }

  return parsedValue;
}

export async function generateWithOllama({
  prompt,
  model,
  temperature = 0,
}) {
  const ollamaBaseUrl = getOllamaBaseUrl();
  const selectedModel = model || getDefaultModel();

  if (!selectedModel) {
    throw new Error(
      "OLLAMA_MODEL is not configured in server/.env.",
    );
  }

  const parsedTemperature =
    normaliseTemperature(temperature);

  const startedAt = Date.now();

  let response;

  try {
      response = await fetch(`${ollamaBaseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        prompt,
        stream: false,
        format: "json",
        keep_alive: "60m",
        options: {
          temperature: 0.4,
          num_predict: 4096,
        },
      }),
    });
  } catch (error) {
    throw new Error(
      `Could not connect to Ollama at ${ollamaBaseUrl}: ${error.message}`,
    );
  }

  if (!response.ok) {
    const responseBody = await response.text();

    throw new Error(
      `Ollama returned ${response.status}: ${responseBody}`,
    );
  }

  const data = await response.json();

  if (
    typeof data.response !== "string" ||
    data.response.trim() === ""
  ) {
    throw new Error(
      "Ollama returned an empty generation response.",
    );
  }

  return {
    model: data.model || selectedModel,
    rawResponse: data.response,
    generationMetrics: {
      requestDurationMilliseconds:
        Date.now() - startedAt,
      totalDurationNanoseconds:
        data.total_duration ?? null,
      loadDurationNanoseconds:
        data.load_duration ?? null,
      promptTokenCount:
        data.prompt_eval_count ?? null,
      outputTokenCount:
        data.eval_count ?? null,
    },
  };
}