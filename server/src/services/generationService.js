import { generateWithOllama } from "./ollamaService.js";
import { generateWithGemini } from "./geminiService.js";
import { generateWithOpenAI } from "./openaiService.js";

export async function generateApplication({
  prompt,
  temperature = 0,
}) {
  const provider =
    process.env.AI_PROVIDER

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

    if (provider === "openai") {
    return generateWithOpenAI({
      prompt,
      temperature,
    });
  }

  throw new Error(
    `Unsupported AI provider: ${provider}`,
  );
}