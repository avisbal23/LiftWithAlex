import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertExerciseSchema, updateExerciseSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get exercises by category
  app.get("/api/exercises/:category", async (req, res) => {
    try {
      const category = req.params.category;
      if (!["push", "pull", "legs", "push2", "pull2", "legs2", "cardio"].includes(category)) {
        return res.status(400).json({ message: "Invalid category" });
      }
      
      const exercises = await storage.getExercisesByCategory(category);
      res.json(exercises);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exercises" });
    }
  });

  // Get all exercises for dashboard
  app.get("/api/exercises", async (req, res) => {
    try {
      const exercises = await storage.getAllExercises();
      res.json(exercises);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exercises" });
    }
  });

  // Create new exercise
  app.post("/api/exercises", async (req, res) => {
    try {
      const validatedData = insertExerciseSchema.parse(req.body);
      const exercise = await storage.createExercise(validatedData);
      res.status(201).json(exercise);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create exercise" });
      }
    }
  });

  // Update exercise
  app.patch("/api/exercises/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const validatedData = updateExerciseSchema.parse(req.body);
      const exercise = await storage.updateExercise(id, validatedData);
      
      if (!exercise) {
        return res.status(404).json({ message: "Exercise not found" });
      }
      
      res.json(exercise);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update exercise" });
      }
    }
  });

  // Delete exercise
  app.delete("/api/exercises/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await storage.deleteExercise(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Exercise not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete exercise" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
