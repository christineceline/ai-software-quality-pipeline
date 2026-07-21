import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import generationRoutes from "./routes/generationRoutes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (request, response) => {
  response.json({
    status: "ok",
    service: "AI Software Quality Pipeline API",
  });
});

app.use("/api/generate", generationRoutes);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});