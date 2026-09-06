import "dotenv/config";
import cors from "cors";
import express from "express";
import path from "node:path";
import { generatedAppsDirectory } from "./config/paths.js";
import generationRoutes from "./routes/generationRoutes.js";
import specificationRoutes from "./routes/specificationRoutes.js";


const app = express();
const port = Number(process.env.PORT) || 3001;

console.log("Environment check:", {
  port,
  aiProvider: process.env.AI_PROVIDER,
  geminiModel: process.env.GEMINI_MODEL,
  ollamaModel: process.env.OLLAMA_MODEL,
});

app.disable("x-powered-by");

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

app.use(express.json({ limit: "10mb" }));

app.use(
  "/generated-apps",
  express.static(generatedAppsDirectory),
);

app.get("/api/health", (request, response) => {
  response.json({
    status: "ok",
    service: "AQuA API",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/specifications", specificationRoutes);
app.use("/api/generate", generationRoutes);

app.use((request, response) => {
  response.status(404).json({
    error: "Route not found.",
  });
});

app.use((error, request, response, next) => {
  console.error("Unhandled server error:", error);

  response.status(500).json({
    error: "Unexpected server error.",
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});