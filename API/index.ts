import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  getAnimalWeightReportHandler,
  getBarnWeightReportHandler,
  addAnimalWeightHandler,
  deleteAnimalWeightHandler,
  getAllAnimalsWithWeightsHandler,
  getWeightStatisticsHandler,
} from "./routes/weights";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Weight tracking API routes
  app.get("/api/weights/animal/:animalId", getAnimalWeightReportHandler);
  app.get("/api/weights/barn/:barnId", getBarnWeightReportHandler);
  app.post("/api/weights/animal/:animalId", addAnimalWeightHandler);
  app.delete("/api/weights/animal/:animalId/weight/:weightId", deleteAnimalWeightHandler);
  app.get("/api/weights/all", getAllAnimalsWithWeightsHandler);
  app.get("/api/weights/statistics", getWeightStatisticsHandler);

  return app;
}
