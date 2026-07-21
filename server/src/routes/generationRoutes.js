import express from "express";
import { generateWithOllama } from "../services/ollamaService.js";

const router = express.Router();

router.post("/", async (request, response) => {
  try {
    const { prompt, model, temperature } = request.body;

    if (typeof prompt !== "string" || prompt.trim().length === 0) {
      return response.status(400).json({
        error: "A non-empty prompt is required.",
      });
    }

    const result = await generateWithOllama({
      prompt: prompt.trim(),
      model,
      temperature,
    });

    return response.json(result);
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      error: "Application generation failed.",
      details: error.message,
    });
  }
});

export default router;