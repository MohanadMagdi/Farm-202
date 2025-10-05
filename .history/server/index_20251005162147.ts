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
import {
  getAllAnimalsHandler,
  getAnimalByIdHandler,
  createAnimalHandler,
  updateAnimalHandler,
  deleteAnimalHandler,
} from "./routes/animals";
import { initializeDatabase } from "./db";

// Initialize database on server start
initializeDatabase();

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

  // Animals API routes
  app.get("/api/animals", getAllAnimalsHandler);
  app.get("/api/animals/:id", getAnimalByIdHandler);
  app.post("/api/animals", createAnimalHandler);
  app.put("/api/animals/:id", updateAnimalHandler);
  app.delete("/api/animals/:id", deleteAnimalHandler);

  // Weight tracking API routes
  app.get("/api/weights/animal/:animalId", getAnimalWeightReportHandler);
  app.get("/api/weights/barn/:barnId", getBarnWeightReportHandler);
  app.post("/api/weights/animal/:animalId", addAnimalWeightHandler);
  app.delete("/api/weights/animal/:animalId/weight/:weightId", deleteAnimalWeightHandler);
  app.get("/api/weights/all", getAllAnimalsWithWeightsHandler);
  app.get("/api/weights/statistics", getWeightStatisticsHandler);

  return app;
}
