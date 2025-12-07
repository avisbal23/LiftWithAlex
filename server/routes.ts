import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import path from "path";
import fs from "fs";
import { insertExerciseSchema, updateExerciseSchema, insertWorkoutLogSchema, insertWeightEntrySchema, updateWeightEntrySchema, insertBloodEntrySchema, updateBloodEntrySchema, insertBloodOptimalRangeSchema, updateBloodOptimalRangeSchema, insertPhotoProgressSchema, updatePhotoProgressSchema, insertThoughtSchema, updateThoughtSchema, insertQuoteSchema, updateQuoteSchema, insertPersonalRecordSchema, updatePersonalRecordSchema, insertUserSettingsSchema, updateUserSettingsSchema, updateShortcutSettingsSchema, updateTabSettingsSchema, insertDailySetProgressSchema, updateDailySetProgressSchema, insertExerciseTemplateSchema, updateExerciseTemplateSchema, insertChangesAuditSchema, updateChangesAuditSchema, insertPRChangesAuditSchema, insertWeightAuditSchema, updateWeightAuditSchema, insertWorkoutTimerSchema, updateWorkoutTimerSchema, insertTimerLapTimeSchema, updateTimerLapTimeSchema, insertBodyMeasurementSchema, updateBodyMeasurementSchema, insertStepEntrySchema, updateStepEntrySchema, insertSupplementSchema, updateSupplementSchema, insertAffirmationSchema, updateAffirmationSchema, bloodWorkComparisonRequestSchema, type BloodEntry, type BloodWorkComparison, type BloodWorkComparisonResult } from "@shared/schema";
import { z } from "zod";

// Blood work comparison calculation function
function calculateBloodWorkComparison(
  baseEntry: BloodEntry, 
  comparisonEntry: BloodEntry, 
  type: 'automatic' | 'manual'
): BloodWorkComparisonResult {
  const biomarkers = [
    { key: 'totalTestosterone', name: 'Total Testosterone', unit: 'totalTestosteroneUnit', betterDirection: 'higher' },
    { key: 'freeTestosterone', name: 'Free Testosterone', unit: 'freeTestosteroneUnit', betterDirection: 'higher' },
    { key: 'shbg', name: 'SHBG', unit: 'shbgUnit', betterDirection: 'optimal' },
    { key: 'estradiol', name: 'Estradiol', unit: 'estradiolUnit', betterDirection: 'optimal' },
    { key: 'dheasulfate', name: 'DHEA Sulfate', unit: 'dheasulfateUnit', betterDirection: 'higher' },
    { key: 'cortisolAm', name: 'Cortisol AM', unit: 'cortisolAmUnit', betterDirection: 'optimal' },
    { key: 'psa', name: 'PSA', unit: 'psaUnit', betterDirection: 'lower' },
    { key: 'tsh', name: 'TSH', unit: 'tshUnit', betterDirection: 'optimal' },
    { key: 'freeT3', name: 'Free T3', unit: 'freeT3Unit', betterDirection: 'optimal' },
    { key: 'freeT4', name: 'Free T4', unit: 'freeT4Unit', betterDirection: 'optimal' },
    { key: 'vitaminD25oh', name: 'Vitamin D', unit: 'vitaminD25ohUnit', betterDirection: 'higher' },
    { key: 'crpHs', name: 'CRP (hs)', unit: 'crpHsUnit', betterDirection: 'lower' },
    { key: 'insulin', name: 'Insulin', unit: 'insulinUnit', betterDirection: 'lower' },
    { key: 'hba1c', name: 'HbA1c', unit: 'hba1cUnit', betterDirection: 'lower' },
    { key: 'cholesterolTotal', name: 'Total Cholesterol', unit: 'cholesterolTotalUnit', betterDirection: 'lower' },
    { key: 'triglycerides', name: 'Triglycerides', unit: 'triglyceridesUnit', betterDirection: 'lower' },
    { key: 'hdl', name: 'HDL', unit: 'hdlUnit', betterDirection: 'higher' },
    { key: 'ldlCalc', name: 'LDL', unit: 'ldlCalcUnit', betterDirection: 'lower' },
    { key: 'vldlCalc', name: 'VLDL', unit: 'vldlCalcUnit', betterDirection: 'lower' },
    { key: 'apob', name: 'ApoB', unit: 'apobUnit', betterDirection: 'lower' },
    { key: 'albumin', name: 'Albumin', unit: 'albuminUnit', betterDirection: 'optimal' },
    { key: 'ferritin', name: 'Ferritin', unit: 'ferritinUnit', betterDirection: 'optimal' },
  ];

  const comparisons: BloodWorkComparison[] = [];
  let improvedMetrics = 0;
  let worsenedMetrics = 0;
  let unchangedMetrics = 0;

  for (const biomarker of biomarkers) {
    const baseValue = (baseEntry as any)[biomarker.key] as number | null;
    const comparisonValue = (comparisonEntry as any)[biomarker.key] as number | null;
    const unit = (comparisonEntry as any)[biomarker.unit] as string || '';

    // Skip if both values are null
    if (baseValue === null && comparisonValue === null) continue;

    let absoluteChange: number | null = null;
    let percentageChange: number | null = null;
    let changeDirection: 'increase' | 'decrease' | 'no_change' = 'no_change';
    let isBetterTrend: boolean | null = null;

    if (baseValue !== null && comparisonValue !== null) {
      absoluteChange = comparisonValue - baseValue;
      percentageChange = baseValue !== 0 ? (absoluteChange / baseValue) * 100 : null;
      
      if (absoluteChange > 0) {
        changeDirection = 'increase';
        isBetterTrend = biomarker.betterDirection === 'higher';
      } else if (absoluteChange < 0) {
        changeDirection = 'decrease';
        isBetterTrend = biomarker.betterDirection === 'lower';
      } else {
        changeDirection = 'no_change';
        isBetterTrend = null;
      }
    }

    comparisons.push({
      markerKey: biomarker.key,
      markerName: biomarker.name,
      baseValue,
      comparisonValue,
      unit,
      absoluteChange,
      percentageChange,
      changeDirection,
      isBetterTrend,
    });

    // Count improvement/worsening
    if (isBetterTrend === true) improvedMetrics++;
    else if (isBetterTrend === false) worsenedMetrics++;
    else unchangedMetrics++;
  }

  return {
    type,
    baseEntry,
    comparisonEntry,
    comparisons: comparisons.filter(c => c.baseValue !== null || c.comparisonValue !== null),
    summary: {
      totalMetrics: comparisons.filter(c => c.baseValue !== null || c.comparisonValue !== null).length,
      improvedMetrics,
      worsenedMetrics,
      unchangedMetrics,
    },
  };
}

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
      if (!["push", "pull", "arms", "legs", "pull2", "legs2", "cardio", "core"].includes(category)) {
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
      console.log("Received weight entry data:", JSON.stringify(req.body));
      const validatedData = insertWeightEntrySchema.parse(req.body);
      console.log("Validated weight entry data:", JSON.stringify(validatedData));
      const entry = await storage.createWeightEntry(validatedData);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log("Validation errors:", error.errors);
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        console.error("Server error:", error);
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

  // Body measurement routes
  
  // Get all body measurements
  app.get("/api/body-measurements", async (req, res) => {
    try {
      const measurements = await storage.getAllBodyMeasurements();
      res.json(measurements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch body measurements" });
    }
  });

  // Get latest body measurement
  app.get("/api/body-measurements/latest", async (req, res) => {
    try {
      const measurement = await storage.getLatestBodyMeasurement();
      if (!measurement) {
        return res.status(404).json({ message: "No body measurements found" });
      }
      res.json(measurement);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch latest body measurement" });
    }
  });

  // Create new body measurement
  app.post("/api/body-measurements", async (req, res) => {
    try {
      const validatedData = insertBodyMeasurementSchema.parse(req.body);
      const measurement = await storage.createBodyMeasurement(validatedData);
      res.status(201).json(measurement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create body measurement" });
      }
    }
  });

  // Update body measurement
  app.patch("/api/body-measurements/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const validatedData = updateBodyMeasurementSchema.parse(req.body);
      const measurement = await storage.updateBodyMeasurement(id, validatedData);
      
      if (!measurement) {
        return res.status(404).json({ message: "Body measurement not found" });
      }
      
      res.json(measurement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update body measurement" });
      }
    }
  });

  // Delete body measurement
  app.delete("/api/body-measurements/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await storage.deleteBodyMeasurement(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Body measurement not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete body measurement" });
    }
  });

  // Step entry routes
  
  // Get all step entries
  app.get("/api/step-entries", async (req, res) => {
    try {
      const entries = await storage.getAllStepEntries();
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch step entries" });
    }
  });

  // Get latest step entry
  app.get("/api/step-entries/latest", async (req, res) => {
    try {
      const entry = await storage.getLatestStepEntry();
      if (!entry) {
        return res.status(404).json({ message: "No step entries found" });
      }
      res.json(entry);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch latest step entry" });
    }
  });

  // Get step entries in date range
  app.get("/api/step-entries/range", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate and endDate are required" });
      }
      
      const entries = await storage.getStepEntriesInDateRange(
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch step entries in range" });
    }
  });

  // Create new step entry
  app.post("/api/step-entries", async (req, res) => {
    try {
      const validatedData = insertStepEntrySchema.parse(req.body);
      const entry = await storage.createStepEntry(validatedData);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create step entry" });
      }
    }
  });

  // Update step entry
  app.patch("/api/step-entries/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const validatedData = updateStepEntrySchema.parse(req.body);
      const entry = await storage.updateStepEntry(id, validatedData);
      
      if (!entry) {
        return res.status(404).json({ message: "Step entry not found" });
      }
      
      res.json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update step entry" });
      }
    }
  });

  // Delete step entry
  app.delete("/api/step-entries/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await storage.deleteStepEntry(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Step entry not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete step entry" });
    }
  });

  // Delete all step entries
  app.delete("/api/step-entries", async (req, res) => {
    try {
      const deleted = await storage.deleteAllStepEntries();
      
      if (!deleted) {
        return res.status(404).json({ message: "No step entries found to delete" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete all step entries" });
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

  // Add attachment to blood entry
  app.post("/api/blood-entries/:id/attachments", async (req, res) => {
    try {
      const id = req.params.id;
      const { fileName, fileUrl, fileType, fileSize } = req.body;
      
      if (!fileName || !fileUrl || !fileType || !fileSize) {
        return res.status(400).json({ message: "Missing required attachment fields" });
      }

      // Get current entry by fetching all and finding by ID
      const allEntries = await storage.getAllBloodEntries();
      const currentEntry = allEntries.find(entry => entry.id === id);
      
      if (!currentEntry) {
        return res.status(404).json({ message: "Blood entry not found" });
      }

      // Add new attachment to existing attachments
      const newAttachment = JSON.stringify({ fileName, fileUrl, fileType, fileSize });
      const updatedAttachments = [...(currentEntry.attachedFiles || []), newAttachment];
      
      // Update entry with new attachments
      const updatedEntry = await storage.updateBloodEntry(id, { 
        attachedFiles: updatedAttachments 
      });
      
      if (!updatedEntry) {
        return res.status(404).json({ message: "Blood entry not found" });
      }
      
      res.json(updatedEntry);
    } catch (error) {
      res.status(500).json({ message: "Failed to add attachment" });
    }
  });

  // Remove attachment from blood entry
  app.delete("/api/blood-entries/:id/attachments", async (req, res) => {
    try {
      const id = req.params.id;
      const { fileUrl } = req.body;
      
      if (!fileUrl) {
        return res.status(400).json({ message: "Missing fileUrl" });
      }

      // Get current entry by fetching all and finding by ID
      const allEntries = await storage.getAllBloodEntries();
      const currentEntry = allEntries.find(entry => entry.id === id);
      
      if (!currentEntry) {
        return res.status(404).json({ message: "Blood entry not found" });
      }

      // Remove attachment with matching fileUrl
      const updatedAttachments = (currentEntry.attachedFiles || []).filter((fileStr: string) => {
        try {
          const file = JSON.parse(fileStr);
          return file.fileUrl !== fileUrl;
        } catch {
          return true; // Keep malformed entries
        }
      });
      
      // Update entry with filtered attachments
      const updatedEntry = await storage.updateBloodEntry(id, { 
        attachedFiles: updatedAttachments 
      });
      
      if (!updatedEntry) {
        return res.status(404).json({ message: "Blood entry not found" });
      }
      
      res.json(updatedEntry);
    } catch (error) {
      res.status(500).json({ message: "Failed to remove attachment" });
    }
  });

  // Blood Optimal Range Routes
  // Get all blood optimal ranges
  app.get("/api/blood-optimal-ranges", async (req, res) => {
    try {
      const ranges = await storage.getAllBloodOptimalRanges();
      res.json(ranges);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blood optimal ranges" });
    }
  });

  // Get blood optimal range by marker key
  app.get("/api/blood-optimal-ranges/:markerKey", async (req, res) => {
    try {
      const markerKey = req.params.markerKey;
      const range = await storage.getBloodOptimalRange(markerKey);
      
      if (!range) {
        return res.status(404).json({ message: "Blood optimal range not found" });
      }
      
      res.json(range);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blood optimal range" });
    }
  });

  // Create or update blood optimal range
  app.put("/api/blood-optimal-ranges/:markerKey", async (req, res) => {
    try {
      const markerKey = req.params.markerKey;
      const bodyWithMarkerKey = { ...req.body, markerKey };
      const validatedData = insertBloodOptimalRangeSchema.parse(bodyWithMarkerKey);
      const range = await storage.upsertBloodOptimalRange(validatedData);
      
      res.json(range);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to save blood optimal range" });
      }
    }
  });

  // Delete blood optimal range
  app.delete("/api/blood-optimal-ranges/:markerKey", async (req, res) => {
    try {
      const markerKey = req.params.markerKey;
      const deleted = await storage.deleteBloodOptimalRange(markerKey);
      
      if (!deleted) {
        return res.status(404).json({ message: "Blood optimal range not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete blood optimal range" });
    }
  });

  // Blood Work Comparison Routes

  // Calculate comparison between two blood entries
  app.post("/api/blood-entries/compare", async (req, res) => {
    try {
      const { baseEntryId, comparisonEntryId } = bloodWorkComparisonRequestSchema.parse(req.body);
      
      const allEntries = await storage.getAllBloodEntries();
      const baseEntry = allEntries.find(e => e.id === baseEntryId);
      const comparisonEntry = allEntries.find(e => e.id === comparisonEntryId);
      
      if (!baseEntry || !comparisonEntry) {
        return res.status(404).json({ message: "One or both blood entries not found" });
      }
      
      const comparison = calculateBloodWorkComparison(baseEntry, comparisonEntry, 'manual');
      res.json(comparison);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to calculate comparison" });
      }
    }
  });

  // Get automatic comparison for a blood entry (compares with most recent previous entry)
  app.get("/api/blood-entries/:id/auto-compare", async (req, res) => {
    try {
      const entryId = req.params.id;
      
      const allEntries = await storage.getAllBloodEntries();
      const currentEntry = allEntries.find(e => e.id === entryId);
      
      if (!currentEntry) {
        return res.status(404).json({ message: "Blood entry not found" });
      }
      
      // Find the most recent previous entry
      const sortedEntries = allEntries
        .filter(e => e.id !== entryId && new Date(e.asOf) < new Date(currentEntry.asOf))
        .sort((a, b) => new Date(b.asOf).getTime() - new Date(a.asOf).getTime());
      
      if (sortedEntries.length === 0) {
        return res.status(404).json({ message: "No previous entry found for comparison" });
      }
      
      const previousEntry = sortedEntries[0];
      const comparison = calculateBloodWorkComparison(previousEntry, currentEntry, 'automatic');
      
      res.json(comparison);
    } catch (error) {
      res.status(500).json({ message: "Failed to calculate automatic comparison" });
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
      
      // Check if user has permission to access the file
      const { canAccessObject, ObjectPermission } = await import("./objectAcl");
      const canAccess = await canAccessObject({
        userId: "single-user", // For single user app, use consistent user ID
        objectFile,
        requestedPermission: ObjectPermission.READ,
      });
      
      if (!canAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      
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

  // Personal Records API routes
  // Get all personal records
  app.get("/api/personal-records", async (req, res) => {
    try {
      const records = await storage.getAllPersonalRecords();
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch personal records" });
    }
  });

  // Create new personal record
  app.post("/api/personal-records", async (req, res) => {
    try {
      // Get next order number
      const allRecords = await storage.getAllPersonalRecords();
      const maxOrder = Math.max(...allRecords.map(r => r.order || 0), 0);
      
      const dataWithOrder = { ...req.body, order: maxOrder + 1 };
      const validatedData = insertPersonalRecordSchema.parse(dataWithOrder);
      const record = await storage.createPersonalRecord(validatedData);
      res.status(201).json(record);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create personal record" });
      }
    }
  });

  // Update personal record
  app.patch("/api/personal-records/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const validatedData = updatePersonalRecordSchema.parse(req.body);
      const record = await storage.updatePersonalRecord(id, validatedData);
      
      if (!record) {
        return res.status(404).json({ message: "Personal record not found" });
      }
      
      res.json(record);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update personal record" });
      }
    }
  });

  // Delete personal record
  app.delete("/api/personal-records/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await storage.deletePersonalRecord(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Personal record not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete personal record" });
    }
  });

  // Reorder personal records
  app.put("/api/personal-records/reorder", async (req, res) => {
    try {
      const reorderData = req.body;
      await storage.reorderPersonalRecords(reorderData);
      res.status(200).json({ message: "Personal records reordered successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reorder personal records" });
    }
  });

  // User Settings API routes
  // Get user settings
  app.get("/api/user-settings", async (req, res) => {
    try {
      const settings = await storage.getUserSettings();
      res.json(settings || { currentBodyWeight: null });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user settings" });
    }
  });

  // Create or update user settings
  app.post("/api/user-settings", async (req, res) => {
    try {
      const validatedData = insertUserSettingsSchema.parse(req.body);
      const settings = await storage.createOrUpdateUserSettings(validatedData);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to save user settings" });
      }
    }
  });

  // Update user settings by ID
  app.patch("/api/user-settings/:id", async (req, res) => {
    try {
      const validatedData = updateUserSettingsSchema.parse(req.body);
      const settings = await storage.createOrUpdateUserSettings(validatedData);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update user settings" });
      }
    }
  });

  // Shortcut Settings API routes
  // Get all shortcut settings
  app.get("/api/shortcut-settings", async (req, res) => {
    try {
      const settings = await storage.getAllShortcutSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shortcut settings" });
    }
  });

  // Get visible shortcut settings
  app.get("/api/shortcut-settings/visible", async (req, res) => {
    try {
      res.set('Cache-Control', 'no-store');
      const settings = await storage.getVisibleShortcutSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch visible shortcut settings" });
    }
  });

  // Update shortcut setting
  app.patch("/api/shortcut-settings/:shortcutKey", async (req, res) => {
    try {
      const shortcutKey = req.params.shortcutKey;
      const validatedData = updateShortcutSettingsSchema.parse(req.body);
      const setting = await storage.updateShortcutSettings(shortcutKey, validatedData);
      
      if (!setting) {
        return res.status(404).json({ message: "Shortcut setting not found" });
      }
      
      res.json(setting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update shortcut setting" });
      }
    }
  });

  // Tab Settings Routes
  app.get("/api/tab-settings", async (req, res) => {
    try {
      const settings = await storage.getAllTabSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tab settings" });
    }
  });

  app.get("/api/tab-settings/visible", async (req, res) => {
    try {
      res.set('Cache-Control', 'no-store');
      const settings = await storage.getVisibleTabSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch visible tab settings" });
    }
  });

  app.patch("/api/tab-settings/:tabKey", async (req, res) => {
    try {
      const tabKey = req.params.tabKey;
      const validatedData = updateTabSettingsSchema.parse(req.body);
      const setting = await storage.updateTabSettings(tabKey, validatedData);
      
      if (!setting) {
        return res.status(404).json({ message: "Tab setting not found" });
      }
      
      res.json(setting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update tab setting" });
      }
    }
  });

  // Daily Set Progress Routes for mobile tap-to-track
  
  // Get daily set progress for a specific workout category
  app.get("/api/daily-set-progress/:category", async (req, res) => {
    try {
      const category = req.params.category;
      if (!["push", "pull", "arms", "legs", "pull2", "legs2", "cardio", "core"].includes(category)) {
        return res.status(400).json({ message: "Invalid category" });
      }
      
      const today = storage.getTodaysPSTDate();
      const progress = await storage.getDailySetProgressByCategory(category, today);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch daily set progress" });
    }
  });

  // Tap to increment sets completed for an exercise
  app.post("/api/daily-set-progress/tap/:exerciseId", async (req, res) => {
    try {
      const exerciseId = req.params.exerciseId;
      const today = storage.getTodaysPSTDate();
      
      // Get current progress
      const currentProgress = await storage.getDailySetProgressByExerciseId(exerciseId, today);
      const currentSets = currentProgress?.setsCompleted || 0;
      
      // Increment sets, max 3
      const newSets = Math.min(currentSets + 1, 3);
      
      // Create or update progress
      const updatedProgress = await storage.createOrUpdateDailySetProgress({
        exerciseId,
        date: today,
        setsCompleted: newSets
      });
      
      res.json(updatedProgress);
    } catch (error) {
      console.error("Error updating set progress:", error);
      res.status(500).json({ message: "Failed to update set progress" });
    }
  });

  // Manual set count update (for potential UI controls)
  app.patch("/api/daily-set-progress/:exerciseId", async (req, res) => {
    try {
      const exerciseId = req.params.exerciseId;
      const validatedData = updateDailySetProgressSchema.parse(req.body);
      const today = storage.getTodaysPSTDate();
      
      // Ensure sets are between 0-3
      const setsCompleted = Math.max(0, Math.min(validatedData.setsCompleted || 0, 3));
      
      const updatedProgress = await storage.createOrUpdateDailySetProgress({
        exerciseId,
        date: today,
        setsCompleted
      });
      
      res.json(updatedProgress);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update set progress" });
      }
    }
  });

  // Manual daily reset (primarily for testing, scheduled reset will happen automatically)
  app.post("/api/daily-set-progress/reset", async (req, res) => {
    try {
      await storage.resetAllDailySetProgress();
      res.json({ message: "Daily set progress reset successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reset daily set progress" });
    }
  });

  // Daily Workout Status Routes
  
  // Get daily workout status for a specific category
  app.get("/api/daily-workout-status/:category", async (req, res) => {
    try {
      const category = req.params.category;
      if (!["push", "pull", "arms", "legs", "pull2", "legs2", "cardio", "core"].includes(category)) {
        return res.status(400).json({ message: "Invalid category" });
      }
      
      const today = storage.getTodaysPSTDate();
      const status = await storage.getDailyWorkoutStatus(category, today);
      res.json({ isCompleted: status?.isCompleted === 1 ? true : false });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch daily workout status" });
    }
  });

  // Set daily workout status for a category
  app.post("/api/daily-workout-status/:category", async (req, res) => {
    try {
      const category = req.params.category;
      if (!["push", "pull", "arms", "legs", "pull2", "legs2", "cardio", "core"].includes(category)) {
        return res.status(400).json({ message: "Invalid category" });
      }
      
      const { isCompleted } = req.body;
      if (typeof isCompleted !== "boolean") {
        return res.status(400).json({ message: "isCompleted must be a boolean" });
      }
      
      const today = storage.getTodaysPSTDate();
      const status = await storage.setDailyWorkoutStatus(category, today, isCompleted);
      res.json({ isCompleted: status.isCompleted === 1 });
    } catch (error) {
      res.status(500).json({ message: "Failed to set daily workout status" });
    }
  });

  // Manual daily workout status reset (primarily for testing)
  app.post("/api/daily-workout-status/reset", async (req, res) => {
    try {
      await storage.resetAllDailyWorkoutStatus();
      res.json({ message: "Daily workout status reset successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reset daily workout status" });
    }
  });

  // Workout Notes Routes
  
  // Get workout notes for a specific category and date (today)
  app.get("/api/workout-notes/:category", async (req, res) => {
    try {
      const category = req.params.category;
      if (!["push", "pull", "arms", "legs", "pull2", "legs2", "cardio", "core"].includes(category)) {
        return res.status(400).json({ message: "Invalid category" });
      }
      
      const today = storage.getTodaysPSTDate();
      const notes = await storage.getWorkoutNotes(category, today);
      res.json({ notes: notes?.notes || "" });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workout notes" });
    }
  });

  // Save workout notes for a specific category and date (today)
  app.post("/api/workout-notes/:category", async (req, res) => {
    try {
      const category = req.params.category;
      if (!["push", "pull", "arms", "legs", "pull2", "legs2", "cardio", "core"].includes(category)) {
        return res.status(400).json({ message: "Invalid category" });
      }
      
      const { notes } = req.body;
      if (typeof notes !== "string") {
        return res.status(400).json({ message: "Notes must be a string" });
      }
      
      const today = storage.getTodaysPSTDate();
      const savedNotes = await storage.saveWorkoutNotes(category, today, notes);
      res.json({ notes: savedNotes.notes });
    } catch (error) {
      res.status(500).json({ message: "Failed to save workout notes" });
    }
  });

  // Page Notes Routes
  
  // Get page notes for a specific page
  app.get("/api/page-notes/:page", async (req, res) => {
    try {
      const page = req.params.page;
      const notes = await storage.getPageNotes(page);
      res.json({ notes: notes?.notes || "" });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch page notes" });
    }
  });

  // Save page notes for a specific page
  app.post("/api/page-notes/:page", async (req, res) => {
    try {
      const page = req.params.page;
      const { notes } = req.body;
      
      if (typeof notes !== "string") {
        return res.status(400).json({ message: "Notes must be a string" });
      }
      
      const savedNotes = await storage.savePageNotes(page, notes);
      res.json({ notes: savedNotes.notes });
    } catch (error) {
      res.status(500).json({ message: "Failed to save page notes" });
    }
  });

  // Get all changes audit entries
  app.get("/api/changes-audit", async (req, res) => {
    try {
      const entries = await storage.getAllChangesAudit();
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch changes audit entries" });
    }
  });

  // Create a new changes audit entry
  app.post("/api/changes-audit", async (req, res) => {
    try {
      const validatedData = insertChangesAuditSchema.parse(req.body);
      const entry = await storage.createChangesAudit(validatedData);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create changes audit entry" });
      }
    }
  });

  // Delete changes audit entry
  app.delete("/api/changes-audit/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await storage.deleteChangesAudit(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Changes audit entry not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete changes audit entry" });
    }
  });

  // Get all PR changes audit entries
  app.get("/api/pr-changes-audit", async (req, res) => {
    try {
      const entries = await storage.getAllPRChangesAudit();
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch PR changes audit entries" });
    }
  });

  // Create a new PR changes audit entry
  app.post("/api/pr-changes-audit", async (req, res) => {
    try {
      const validatedData = insertPRChangesAuditSchema.parse(req.body);
      const entry = await storage.createPRChangesAudit(validatedData);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create PR changes audit entry" });
      }
    }
  });

  // Delete PR changes audit entry
  app.delete("/api/pr-changes-audit/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await storage.deletePRChangesAudit(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "PR changes audit entry not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete PR changes audit entry" });
    }
  });

  // Get all weight audit entries
  app.get("/api/weight-audit", async (req, res) => {
    try {
      const entries = await storage.getAllWeightAudit();
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch weight audit entries" });
    }
  });

  // Create a new weight audit entry
  app.post("/api/weight-audit", async (req, res) => {
    try {
      const validatedData = insertWeightAuditSchema.parse(req.body);
      const entry = await storage.createWeightAudit(validatedData);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create weight audit entry" });
      }
    }
  });

  // Delete weight audit entry
  app.delete("/api/weight-audit/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await storage.deleteWeightAudit(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Weight audit entry not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete weight audit entry" });
    }
  });

  // Exercise Templates endpoints
  app.get("/api/exercise-templates", async (req, res) => {
    try {
      const templates = await storage.getAllExerciseTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exercise templates" });
    }
  });

  app.post("/api/exercise-templates", async (req, res) => {
    try {
      const data = insertExerciseTemplateSchema.parse(req.body);
      // Normalize the name (trim and maintain original case for display)
      const normalizedData = {
        ...data,
        name: data.name.trim()
      };
      const created = await storage.createExerciseTemplate(normalizedData);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      // Handle unique constraint violation
      if (error?.message?.includes('unique') || error?.code === '23505') {
        return res.status(409).json({ message: "Exercise template with this name already exists" });
      }
      res.status(500).json({ message: "Failed to create exercise template" });
    }
  });

  app.patch("/api/exercise-templates/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const data = updateExerciseTemplateSchema.parse(req.body);
      // Normalize the name if provided
      const normalizedData = data.name ? {
        ...data,
        name: data.name.trim()
      } : data;
      const updated = await storage.updateExerciseTemplate(id, normalizedData);
      
      if (!updated) {
        return res.status(404).json({ message: "Exercise template not found" });
      }
      
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      // Handle unique constraint violation
      if (error?.message?.includes('unique') || error?.code === '23505') {
        return res.status(409).json({ message: "Exercise template with this name already exists" });
      }
      res.status(500).json({ message: "Failed to update exercise template" });
    }
  });

  app.delete("/api/exercise-templates/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await storage.deleteExerciseTemplate(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Exercise template not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete exercise template" });
    }
  });

  app.post("/api/exercise-templates/get-or-create", async (req, res) => {
    try {
      const { name } = req.body;
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ message: "Exercise name is required" });
      }
      
      // Normalize the name
      const normalizedName = name.trim();
      if (!normalizedName) {
        return res.status(400).json({ message: "Exercise name cannot be empty" });
      }
      
      const template = await storage.getOrCreateExerciseTemplate(normalizedName);
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Failed to get or create exercise template" });
    }
  });

  // Timer Management Routes
  
  // Get timer state by storage key
  app.get("/api/timers/:storageKey", async (req, res) => {
    try {
      const storageKey = req.params.storageKey;
      const timer = await storage.getWorkoutTimer(storageKey);
      
      if (!timer) {
        return res.status(404).json({ message: "Timer not found" });
      }
      
      // Get associated lap times
      const lapTimes = await storage.getTimerLapTimes(timer.id);
      
      res.json({ ...timer, lapTimes });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch timer" });
    }
  });

  // Create or update timer state
  app.put("/api/timers/:storageKey", async (req, res) => {
    try {
      const storageKey = req.params.storageKey;
      const validatedData = insertWorkoutTimerSchema.parse({
        ...req.body,
        storageKey
      });
      
      const timer = await storage.createOrUpdateWorkoutTimer(validatedData);
      res.json(timer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to save timer state" });
      }
    }
  });

  // Delete timer
  app.delete("/api/timers/:storageKey", async (req, res) => {
    try {
      const storageKey = req.params.storageKey;
      const deleted = await storage.deleteWorkoutTimer(storageKey);
      
      if (!deleted) {
        return res.status(404).json({ message: "Timer not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete timer" });
    }
  });

  // Get lap times for a timer
  app.get("/api/timers/:storageKey/laps", async (req, res) => {
    try {
      const storageKey = req.params.storageKey;
      const timer = await storage.getWorkoutTimer(storageKey);
      
      if (!timer) {
        return res.status(404).json({ message: "Timer not found" });
      }
      
      const lapTimes = await storage.getTimerLapTimes(timer.id);
      res.json(lapTimes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lap times" });
    }
  });

  // Add a new lap time
  app.post("/api/timers/:storageKey/laps", async (req, res) => {
    try {
      const storageKey = req.params.storageKey;
      const timer = await storage.getWorkoutTimer(storageKey);
      
      if (!timer) {
        return res.status(404).json({ message: "Timer not found" });
      }
      
      const validatedData = insertTimerLapTimeSchema.parse({
        ...req.body,
        timerId: timer.id
      });
      
      const lapTime = await storage.createTimerLapTime(validatedData);
      res.status(201).json(lapTime);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create lap time" });
      }
    }
  });

  // Clear all lap times for a timer
  app.delete("/api/timers/:storageKey/laps", async (req, res) => {
    try {
      const storageKey = req.params.storageKey;
      const timer = await storage.getWorkoutTimer(storageKey);
      
      if (!timer) {
        return res.status(404).json({ message: "Timer not found" });
      }
      
      await storage.clearTimerLapTimes(timer.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to clear lap times" });
    }
  });

  // Supplements API endpoints
  // Get all supplements
  app.get("/api/supplements", async (req, res) => {
    try {
      const supplements = await storage.getAllSupplements();
      res.json(supplements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch supplements" });
    }
  });

  // Create new supplement
  app.post("/api/supplements", async (req, res) => {
    try {
      const validatedData = insertSupplementSchema.parse(req.body);
      const supplement = await storage.createSupplement(validatedData);
      res.status(201).json(supplement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create supplement" });
      }
    }
  });

  // Update supplement
  app.patch("/api/supplements/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const validatedData = updateSupplementSchema.parse(req.body);
      const supplement = await storage.updateSupplement(id, validatedData);
      
      if (!supplement) {
        return res.status(404).json({ message: "Supplement not found" });
      }
      
      res.json(supplement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update supplement" });
      }
    }
  });

  // Delete supplement
  app.delete("/api/supplements/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const success = await storage.deleteSupplement(id);
      
      if (!success) {
        return res.status(404).json({ message: "Supplement not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete supplement" });
    }
  });

  // Bulk import supplements
  app.post("/api/supplements/bulk", async (req, res) => {
    try {
      const supplementsData = req.body;
      
      if (!Array.isArray(supplementsData)) {
        return res.status(400).json({ message: "Invalid data format. Expected array of supplements." });
      }

      let imported = 0;
      const errors: string[] = [];

      for (const [index, supplementData] of supplementsData.entries()) {
        try {
          const validatedData = insertSupplementSchema.parse(supplementData);
          await storage.createSupplement(validatedData);
          imported++;
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.push(`Item ${index + 1}: ${error.errors.map(e => e.message).join(", ")}`);
          } else {
            errors.push(`Item ${index + 1}: Failed to import`);
          }
        }
      }

      res.json({
        imported,
        total: supplementsData.length,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to process bulk import" });
    }
  });

  // Affirmations API endpoints
  app.get("/api/affirmations", async (req, res) => {
    try {
      const affirmations = await storage.getAllAffirmations();
      res.json(affirmations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch affirmations" });
    }
  });

  app.get("/api/affirmations/active", async (req, res) => {
    try {
      const activeAffirmations = await storage.getActiveAffirmations();
      res.json(activeAffirmations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active affirmations" });
    }
  });

  app.post("/api/affirmations", async (req, res) => {
    try {
      const validatedData = insertAffirmationSchema.parse(req.body);
      const affirmation = await storage.createAffirmation(validatedData);
      res.status(201).json(affirmation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid affirmation data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create affirmation" });
      }
    }
  });

  app.patch("/api/affirmations/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const validatedData = updateAffirmationSchema.parse(req.body);
      const affirmation = await storage.updateAffirmation(id, validatedData);
      
      if (!affirmation) {
        return res.status(404).json({ message: "Affirmation not found" });
      }
      
      res.json(affirmation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid affirmation data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update affirmation" });
      }
    }
  });

  app.delete("/api/affirmations/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const success = await storage.deleteAffirmation(id);
      
      if (!success) {
        return res.status(404).json({ message: "Affirmation not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete affirmation" });
    }
  });

  // Bulk import affirmations
  app.post("/api/affirmations/bulk", async (req, res) => {
    try {
      const affirmationsData = req.body;
      
      if (!Array.isArray(affirmationsData)) {
        return res.status(400).json({ message: "Invalid data format. Expected array of affirmations." });
      }

      let imported = 0;
      const errors: string[] = [];

      for (const [index, affirmationData] of affirmationsData.entries()) {
        try {
          const validatedData = insertAffirmationSchema.parse(affirmationData);
          await storage.createAffirmation(validatedData);
          imported++;
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.push(`Item ${index + 1}: ${error.errors.map(e => e.message).join(", ")}`);
          } else {
            errors.push(`Item ${index + 1}: Failed to import`);
          }
        }
      }

      res.json({
        imported,
        total: affirmationsData.length,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to process bulk import" });
    }
  });

  // URL metadata fetching with security and error handling
  app.post("/api/url-metadata", async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url || typeof url !== "string") {
        return res.status(400).json({ message: "Valid URL is required" });
      }

      // Helper function to extract YouTube video ID from various URL formats
      const extractYouTubeVideoId = (url: string): string | null => {
        const patterns = [
          /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
          /youtube\.com\/watch\?.*v=([^&\n?#]+)/
        ];
        
        for (const pattern of patterns) {
          const match = url.match(pattern);
          if (match) {
            return match[1];
          }
        }
        return null;
      };

      // Check if this is a YouTube URL
      const youtubeVideoId = extractYouTubeVideoId(url);
      
      if (youtubeVideoId) {
        // Return YouTube-specific metadata with embed URL
        const preview = {
          title: `YouTube Video - ${youtubeVideoId}`,
          description: 'YouTube video content',
          siteName: 'YouTube',
          previewImage: `https://img.youtube.com/vi/${youtubeVideoId}/mqdefault.jpg`,
          type: 'video',
          url: url,
          embedUrl: `https://www.youtube.com/embed/${youtubeVideoId}`,
          videoId: youtubeVideoId,
          isYouTube: true
        };
        
        return res.json(preview);
      }

      // Import url-metadata module for non-YouTube URLs
      const urlMetadata = (await import("url-metadata")).default;
      
      // Fetch metadata with security options
      const metadata = await urlMetadata(url, {
        timeout: 10000,
        maxRedirects: 3,
        requestHeaders: {
          'User-Agent': 'Mozilla/5.0 (compatible; FitnessApp/1.0)',
          'Accept': 'text/html,application/xhtml+xml'
        }
      });
      
      // Return structured metadata
      const preview = {
        title: metadata.title || '',
        description: metadata.description || '',
        siteName: metadata['og:site_name'] || '',
        previewImage: metadata['og:image'] || metadata.image || '',
        type: metadata['og:type'] || 'website',
        url: metadata.url || url,
        isYouTube: false
      };
      
      res.json(preview);
    } catch (error) {
      console.error('URL metadata fetch failed:', error);
      // Return graceful fallback instead of error
      const fallbackPreview = {
        title: '',
        description: '',
        siteName: '',
        previewImage: '',
        type: 'website',
        url: req.body.url || '',
        error: 'Failed to fetch metadata',
        isYouTube: false
      };
      res.json(fallbackPreview);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
