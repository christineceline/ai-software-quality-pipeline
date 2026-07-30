import { generateWithOllama } from "./ollamaService.js";
import { generateWithGemini } from "./geminiService.js";

export async function generateApplication({
  prompt,
  temperature = 0,
}) {
  const provider =
    process.env.AI_PROVIDER || "ollama";

  if (provider === "gemini") {
    return generateWithGemini({
      prompt,
      temperature,
    });
  }

  if (provider === "ollama") {
    return generateWithOllama({
      prompt,
      temperature,
    });
  }

  throw new Error(
    `Unsupported AI provider: ${provider}`,
  );
}