const ollamaBaseUrl =
  process.env.OLLAMA_BASE_URL || "http://localhost:11434";

const defaultModel = process.env.OLLAMA_MODEL;

export async function generateWithOllama({
  prompt,
  model = defaultModel,
  temperature = 0,
}) {
  if (!model) {
    throw new Error("OLLAMA_MODEL is not configured.");
  }

  const response = await fetch(`${ollamaBaseUrl}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: {
        temperature,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();

    throw new Error(
      `Ollama request failed with status ${response.status}: ${body}`,
    );
  }

  const data = await response.json();

  return {
    model: data.model,
    response: data.response,
    totalDuration: data.total_duration,
    promptTokens: data.prompt_eval_count,
    outputTokens: data.eval_count,
  };
}