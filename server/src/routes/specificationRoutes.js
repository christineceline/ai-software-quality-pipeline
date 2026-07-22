import express from "express";
import { specifications } from "../specifications/index.js";

const router = express.Router();

router.get("/", (request, response) => {
  response.json({
    specifications,
  });
});

export default router;