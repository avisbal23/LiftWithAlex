import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import path from "path";
import fs from "fs";
import { insertExerciseSchema, updateExerciseSchema, insertWorkoutLogSchema, insertWeightEntrySchema, updateWeightEntrySchema, insertBloodEntrySchema, updateBloodEntrySchema, insertPhotoProgressSchema, updatePhotoProgressSchema, insertThoughtSchema, updateThoughtSchema, insertQuoteSchema, updateQuoteSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static images from server/public/images
  app.get("/images/:filename", (req, res) => {
    const filename = req.params.filename;
    const imagePath = path.resolve(import.meta.dirname, "public", "images", filename);
    
    if (fs.existsSync(imagePath)) {
      res.sendFile(imagePath);
    } else {
      res.status(404).json({ error: "Image not found" });
    }
  });

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

  // Blood entry routes
  
  // Create new blood entry
  app.post("/api/blood-entries", async (req, res) => {
    try {
      const validatedData = insertBloodEntrySchema.parse(req.body);
      const bloodEntry = await storage.createBloodEntry(validatedData);
      res.status(201).json(bloodEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create blood entry" });
      }
    }
  });

  // Update blood entry
  app.patch("/api/blood-entries/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const validatedData = updateBloodEntrySchema.parse(req.body);
      const bloodEntry = await storage.updateBloodEntry(id, validatedData);
      
      if (!bloodEntry) {
        return res.status(404).json({ message: "Blood entry not found" });
      }
      
      res.json(bloodEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update blood entry" });
      }
    }
  });

  // Delete blood entry
  app.delete("/api/blood-entries/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await storage.deleteBloodEntry(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Blood entry not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete blood entry" });
    }
  });

  // Get all blood entries
  app.get("/api/blood-entries", async (req, res) => {
    try {
      const entries = await storage.getAllBloodEntries();
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blood entries" });
    }
  });

  // Photo Progress Routes

  // Get all photo progress entries
  app.get("/api/photo-progress", async (req, res) => {
    try {
      const entries = await storage.getAllPhotoProgress();
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch photo progress" });
    }
  });

  // Get photo progress by body part
  app.get("/api/photo-progress/body-part/:bodyPart", async (req, res) => {
    try {
      const bodyPart = req.params.bodyPart;
      const entries = await storage.getPhotoProgressByBodyPart(bodyPart);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch photo progress by body part" });
    }
  });

  // Create photo progress entry
  app.post("/api/photo-progress", async (req, res) => {
    try {
      const validatedData = insertPhotoProgressSchema.parse(req.body);
      const entry = await storage.createPhotoProgress(validatedData);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create photo progress entry" });
      }
    }
  });

  // Update photo progress entry
  app.patch("/api/photo-progress/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const validatedData = updatePhotoProgressSchema.parse(req.body);
      const entry = await storage.updatePhotoProgress(id, validatedData);
      
      if (!entry) {
        return res.status(404).json({ message: "Photo progress entry not found" });
      }
      
      res.json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update photo progress entry" });
      }
    }
  });

  // Delete photo progress entry
  app.delete("/api/photo-progress/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await storage.deletePhotoProgress(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Photo progress entry not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete photo progress entry" });
    }
  });

  // Object Storage Routes

  // Serve private objects (for photo progress)
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Get upload URL for photo progress
  app.post("/api/objects/upload", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Set ACL policy after photo upload
  app.put("/api/objects/set-acl", async (req, res) => {
    if (!req.body.photoURL) {
      return res.status(400).json({ error: "photoURL is required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(req.body.photoURL);
      
      // For single user app, set as public photos
      const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
      await objectStorageService.trySetObjectEntityAclPolicy(req.body.photoURL, {
        owner: "single-user",
        visibility: "public", // Photos are publicly viewable
      });

      res.status(200).json({ objectPath });
    } catch (error) {
      console.error("Error setting ACL policy:", error);
      res.status(500).json({ error: "Failed to set photo permissions" });
    }
  });

  // Thoughts & Reflections Routes

  // Get all thoughts
  app.get("/api/thoughts", async (req, res) => {
    try {
      const thoughts = await storage.getAllThoughts();
      res.json(thoughts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch thoughts" });
    }
  });

  // Create thought
  app.post("/api/thoughts", async (req, res) => {
    try {
      const validatedData = insertThoughtSchema.parse(req.body);
      const thought = await storage.createThought(validatedData);
      res.status(201).json(thought);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create thought" });
      }
    }
  });

  // Update thought
  app.patch("/api/thoughts/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const validatedData = updateThoughtSchema.parse(req.body);
      const thought = await storage.updateThought(id, validatedData);
      
      if (!thought) {
        return res.status(404).json({ message: "Thought not found" });
      }
      
      res.json(thought);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update thought" });
      }
    }
  });

  // Delete thought
  app.delete("/api/thoughts/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await storage.deleteThought(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Thought not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete thought" });
    }
  });

  // Quotes routes
  // Get all quotes
  app.get("/api/quotes", async (req, res) => {
    try {
      const quotes = await storage.getAllQuotes();
      res.json(quotes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quotes" });
    }
  });

  // Get active quotes
  app.get("/api/quotes/active", async (req, res) => {
    try {
      const quotes = await storage.getActiveQuotes();
      res.json(quotes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active quotes" });
    }
  });

  // Get random quote
  app.get("/api/quotes/random", async (req, res) => {
    try {
      const quote = await storage.getRandomQuote();
      if (!quote) {
        return res.status(404).json({ message: "No active quotes found" });
      }
      res.json(quote);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch random quote" });
    }
  });

  // Create new quote
  app.post("/api/quotes", async (req, res) => {
    try {
      const validatedData = insertQuoteSchema.parse(req.body);
      const quote = await storage.createQuote(validatedData);
      res.status(201).json(quote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create quote" });
      }
    }
  });

  // Update quote
  app.patch("/api/quotes/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const validatedData = updateQuoteSchema.parse(req.body);
      const quote = await storage.updateQuote(id, validatedData);
      
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }
      
      res.json(quote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update quote" });
      }
    }
  });

  // Delete quote
  app.delete("/api/quotes/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await storage.deleteQuote(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Quote not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete quote" });
    }
  });

  // Bulk import quotes (clears existing and adds new)
  app.post("/api/quotes/bulk-import", async (req, res) => {
    try {
      const { quotes } = req.body;
      
      if (!Array.isArray(quotes)) {
        return res.status(400).json({ error: "Quotes must be an array" });
      }

      // Clear existing quotes and add new ones
      await storage.clearAllQuotes();
      
      for (const quote of quotes) {
        await storage.createQuote(quote);
      }

      res.status(200).json({ message: `Successfully imported ${quotes.length} quotes` });
    } catch (error) {
      console.error("Error bulk importing quotes:", error);
      res.status(500).json({ error: "Failed to bulk import quotes" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
