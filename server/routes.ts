import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertExerciseSchema, updateExerciseSchema, insertWorkoutLogSchema, insertWeightEntrySchema, updateWeightEntrySchema } from "@shared/schema";
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

  // Create workout log entry
  app.post("/api/workout-logs", async (req, res) => {
    try {
      const validatedData = insertWorkoutLogSchema.parse(req.body);
      const log = await storage.createWorkoutLog(validatedData);
      res.status(201).json(log);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create workout log" });
      }
    }
  });

  // Get latest workout log
  app.get("/api/workout-logs/latest", async (req, res) => {
    try {
      const log = await storage.getLatestWorkoutLog();
      res.json(log || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch latest workout log" });
    }
  });

  // Get all workout logs
  app.get("/api/workout-logs", async (req, res) => {
    try {
      const logs = await storage.getAllWorkoutLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workout logs" });
    }
  });

  // Create weight entry
  app.post("/api/weight-entries", async (req, res) => {
    try {
      const validatedData = insertWeightEntrySchema.parse(req.body);
      const entry = await storage.createWeightEntry(validatedData);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create weight entry" });
      }
    }
  });

  // Update weight entry
  app.patch("/api/weight-entries/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const validatedData = updateWeightEntrySchema.parse(req.body);
      const entry = await storage.updateWeightEntry(id, validatedData);
      
      if (!entry) {
        return res.status(404).json({ message: "Weight entry not found" });
      }
      
      res.json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update weight entry" });
      }
    }
  });

  // Delete weight entry
  app.delete("/api/weight-entries/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await storage.deleteWeightEntry(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Weight entry not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete weight entry" });
    }
  });

  // Get all weight entries
  app.get("/api/weight-entries", async (req, res) => {
    try {
      const entries = await storage.getAllWeightEntries();
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch weight entries" });
    }
  });

  // Get weight entries in date range
  app.get("/api/weight-entries/range", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate and endDate are required" });
      }
      
      const entries = await storage.getWeightEntriesInDateRange(
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch weight entries in range" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
