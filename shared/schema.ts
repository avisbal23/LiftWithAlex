import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const exercises = pgTable("exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  weight: integer("weight").default(0),
  reps: integer("reps").default(0),
  notes: text("notes").default(""),
  category: text("category").notNull(), // 'push', 'pull', 'arms', 'legs', 'pull2', 'legs2', 'cardio', 'core'
  order: integer("order").default(0), // For custom ordering
  // Cardio-specific fields
  duration: text("duration").default(""), // "28:32"
  distance: text("distance").default(""), // "3.1 miles"
  pace: text("pace").default(""), // "9:10/mile"
  calories: integer("calories").default(0),
  rpe: integer("rpe").default(0), // Rate of Perceived Exertion (1-10)
  createdAt: timestamp("created_at").defaultNow(),
});

export const weightHistory = pgTable("weight_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  exerciseId: varchar("exercise_id").notNull(), // references exercises(id)
  previousWeight: integer("previous_weight").notNull(), // Previous weight value
  newWeight: integer("new_weight").notNull(), // New weight value
  changedAt: timestamp("changed_at").defaultNow(), // When the change occurred
});

export const workoutLogs = pgTable("workout_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(), // 'push', 'pull', 'arms', 'legs', 'pull2', 'legs2', 'cardio', 'core'
  completedAt: timestamp("completed_at").defaultNow(),
});

export const weightEntries = pgTable("weight_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(),
  time: text("time"), // Time portion like "11:52:37 AM"
  weight: real("weight").notNull(), // Weight(lb)
  bodyFat: real("body_fat"), // Body Fat(%)
  fatFreeMass: real("fat_free_mass"), // Fat-Free Mass(lb)
  muscleMass: real("muscle_mass"), // Muscle Mass(lb)
  bmi: real("bmi"), // BMI
  subcutaneousFat: real("subcutaneous_fat"), // Subcutaneous Fat(%)
  skeletalMuscle: real("skeletal_muscle"), // Skeletal Muscle(%)
  bodyWater: real("body_water"), // Body Water(%)
  visceralFat: integer("visceral_fat"), // Visceral Fat
  boneMass: real("bone_mass"), // Bone Mass(lb)
  protein: real("protein"), // Protein(%)
  bmr: integer("bmr"), // BMR(kcal)
  metabolicAge: integer("metabolic_age"), // Metabolic Age
  optimalWeight: real("optimal_weight"), // Optimal Weight(lb) - often null
  targetToOptimalWeight: real("target_to_optimal_weight"), // Target to optimal weight(lb) - often null
  targetToOptimalFatMass: real("target_to_optimal_fat_mass"), // Target to optimal fat mass(lb) - often null
  targetToOptimalMuscleMass: real("target_to_optimal_muscle_mass"), // Target to optimal muscle mass(lb) - often null
  bodyType: text("body_type"), // Body Type - often null
  remarks: text("remarks"), // Remarks - often null
  createdAt: timestamp("created_at").defaultNow(),
});

export const bloodEntries = pgTable("blood_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  asOf: timestamp("as_of").notNull(),
  source: text("source").notNull(), // 'labcorp_pdf', 'user_screenshots', etc.
  
  // Hormone Balance
  totalTestosterone: real("total_testosterone"),
  totalTestosteroneUnit: text("total_testosterone_unit").default("ng/dL"),
  freeTestosterone: real("free_testosterone"),
  freeTestosteroneUnit: text("free_testosterone_unit").default("pg/mL"),
  shbg: real("shbg"),
  shbgUnit: text("shbg_unit").default("nmol/L"),
  estradiol: real("estradiol"),
  estradiolUnit: text("estradiol_unit").default("pg/mL"),
  estrogensTotal: real("estrogens_total"),
  estrogensTotalUnit: text("estrogens_total_unit").default("pg/mL"),
  dheasulfate: real("dhea_sulfate"),
  dheasulfateUnit: text("dhea_sulfate_unit").default("ug/dL"),
  cortisolAm: real("cortisol_am"),
  cortisolAmUnit: text("cortisol_am_unit").default("ug/dL"),
  psa: real("psa"),
  psaUnit: text("psa_unit").default("ng/mL"),
  testosteroneEstrogenRatio: real("testosterone_estrogen_ratio"),
  
  // Thyroid
  tsh: real("tsh"),
  tshUnit: text("tsh_unit").default("uIU/mL"),
  freeT3: real("free_t3"),
  freeT3Unit: text("free_t3_unit").default("pg/mL"),
  freeT4: real("free_t4"),
  freeT4Unit: text("free_t4_unit").default("ng/dL"),
  tpoAb: real("tpo_ab"),
  tpoAbUnit: text("tpo_ab_unit").default("IU/mL"),
  
  // Vitamin/Inflammation/Glucose
  vitaminD25oh: real("vitamin_d_25oh"),
  vitaminD25ohUnit: text("vitamin_d_25oh_unit").default("ng/mL"),
  crpHs: real("crp_hs"),
  crpHsUnit: text("crp_hs_unit").default("mg/L"),
  insulin: real("insulin"),
  insulinUnit: text("insulin_unit").default("uIU/mL"),
  hba1c: real("hba1c"),
  hba1cUnit: text("hba1c_unit").default("%"),
  
  // Lipids
  cholesterolTotal: real("cholesterol_total"),
  cholesterolTotalUnit: text("cholesterol_total_unit").default("mg/dL"),
  triglycerides: real("triglycerides"),
  triglyceridesUnit: text("triglycerides_unit").default("mg/dL"),
  hdl: real("hdl"),
  hdlUnit: text("hdl_unit").default("mg/dL"),
  ldlCalc: real("ldl_calc"),
  ldlCalcUnit: text("ldl_calc_unit").default("mg/dL"),
  ldlCalcFlag: text("ldl_calc_flag"), // 'high', 'low', etc.
  vldlCalc: real("vldl_calc"),
  vldlCalcUnit: text("vldl_calc_unit").default("mg/dL"),
  apob: real("apob"),
  apobUnit: text("apob_unit").default("mg/dL"),
  apobFlag: text("apob_flag"),
  ldlApobRatio: real("ldl_apob_ratio"),
  tgHdlRatio: real("tg_hdl_ratio"),
  
  // Proteins/Misc
  albumin: real("albumin"),
  albuminUnit: text("albumin_unit").default("g/dL"),
  ferritin: real("ferritin"),
  ferritinUnit: text("ferritin_unit").default("ng/mL"),
  
  // File Attachments
  attachedFiles: text("attached_files").array(), // Array of JSON strings: {fileName, fileUrl, fileType, fileSize}
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const bloodOptimalRanges = pgTable("blood_optimal_ranges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  markerKey: text("marker_key").notNull().unique(), // 'freeTestosterone', 'tsh', 'ldl', etc.
  comparator: text("comparator").notNull(), // 'between', 'lte', 'gte'
  low: real("low"), // Lower bound for 'between' comparator
  high: real("high"), // Upper bound for 'between' and single value for 'lte'/'gte'
  unit: text("unit"), // Unit for the range (e.g., 'pg/mL', 'ng/dL')
});

export const photoProgress = pgTable("photo_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").default(""),
  photoUrl: text("photo_url").notNull(), // Object storage path like /objects/uploads/uuid
  fileType: text("file_type").notNull().default("image"), // "image" or "video"
  bodyPart: text("body_part"), // 'front', 'back', 'side', 'arms', 'legs', 'abs', etc.
  weight: real("weight"), // Weight at time of photo/video (optional)
  takenAt: timestamp("taken_at").notNull(), // When photo/video was taken
  createdAt: timestamp("created_at").defaultNow(),
});

export const thoughts = pgTable("thoughts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  mood: text("mood"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quotes = pgTable("quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  text: text("text").notNull(),
  author: text("author").notNull(),
  category: text("category").default("motivational"), // 'motivational', 'fitness', 'mindset', 'success', etc.
  isActive: integer("is_active").default(1), // 1 for active, 0 for inactive
  createdAt: timestamp("created_at").defaultNow(),
});

// Daily set progress tracking for mobile tap-to-track system
export const dailySetProgress = pgTable("daily_set_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  exerciseId: varchar("exercise_id").notNull(), // references exercises(id)
  date: timestamp("date").notNull(), // Date in PST timezone (reset at midnight PST)
  setsCompleted: integer("sets_completed").default(0), // 0-3 sets completed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dailyWorkoutStatus = pgTable("daily_workout_status", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(), // 'push', 'pull', 'arms', 'legs', 'pull2', 'legs2', 'cardio', 'core'
  date: timestamp("date").notNull(), // Date in PST timezone (reset at midnight PST)
  isCompleted: integer("is_completed").default(0), // 1 for completed, 0 for not completed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const workoutNotes = pgTable("workout_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(), // 'push', 'pull', 'arms', 'legs', 'pull2', 'legs2', 'cardio', 'core'
  date: timestamp("date").notNull(), // Date in PST timezone
  notes: text("notes").notNull().default(""), // The workout notes/prep text
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Page notes for tracking instructions on how to use different pages
export const pageNotes = pgTable("page_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  page: text("page").notNull().unique(), // 'blood-tracking', 'steps-tracking', 'affirmations', etc.
  notes: text("notes").notNull().default(""), // Instructions/notes for the page
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User settings for storing current body weight and other preferences
export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  currentBodyWeight: real("current_body_weight"), // Current body weight in lbs
  appTitle: text("app_title").default("Visbal Gym Tracker"), // Customizable app title
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Personal Records - separate from workout exercises
export const personalRecords = pgTable("personal_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  exercise: text("exercise").notNull(),
  weight: text("weight").default(""),
  reps: text("reps").default(""),
  time: text("time").default(""), // For cardio
  category: text("category").notNull(), // 'Push', 'Pull', 'Legs', 'Cardio'
  order: integer("order").default(0), // For custom ordering
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shortcut Settings - for managing home screen shortcut visibility
export const shortcutSettings = pgTable("shortcut_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shortcutKey: text("shortcut_key").notNull().unique(), // 'push', 'pull', 'legs', 'push2', 'pull2', 'legs2', 'cardio', 'weight', 'blood', 'photos', 'thoughts', 'admin'
  shortcutName: text("shortcut_name").notNull(), // Display name
  routePath: text("route_path").notNull(), // '/push', '/pull', etc.
  isVisible: integer("is_visible").default(1), // 1 for visible, 0 for hidden
  order: integer("order").default(0), // For custom ordering
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tab Settings - for managing navigation tab visibility
export const tabSettings = pgTable("tab_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tabKey: text("tab_key").notNull().unique(), // 'push', 'pull', 'legs', 'push2', 'pull2', 'legs2', 'cardio'
  tabName: text("tab_name").notNull(), // Display name
  routePath: text("route_path").notNull(), // '/push', '/pull', etc.
  isVisible: integer("is_visible").default(1), // 1 for visible, 0 for hidden
  order: integer("order").default(0), // For custom ordering
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Exercise Templates - master list of exercise names for data consistency
export const exerciseTemplates = pgTable("exercise_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(), // "Bench Press", "Squats", etc.
  lastUsed: timestamp("last_used").defaultNow(), // Track when last used
  createdAt: timestamp("created_at").defaultNow(),
});

// Changes Audit - for tracking weight changes in workout exercises
export const changesAudit = pgTable("changes_audit", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  exerciseId: varchar("exercise_id").notNull(), // references exercises(id)
  exerciseName: text("exercise_name").notNull(), // snapshot of exercise name at time of change
  previousWeight: integer("previous_weight").notNull(), // previous weight value
  newWeight: integer("new_weight").notNull(), // new weight value
  percentageIncrease: real("percentage_increase"), // percentage change (can be negative for decreases)
  category: text("category").notNull(), // workout category for filtering
  changedAt: timestamp("changed_at").defaultNow(),
});

// PR Changes Audit - for tracking changes to Personal Records
export const prChangesAudit = pgTable("pr_changes_audit", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  personalRecordId: varchar("personal_record_id").notNull(), // references personalRecords(id)
  exerciseName: text("exercise_name").notNull(), // snapshot of exercise name at time of change
  category: text("category").notNull(), // PR category for filtering
  fieldChanged: text("field_changed").notNull(), // 'weight', 'reps', 'time'
  previousValue: text("previous_value"), // previous value (can be null for new records)
  newValue: text("new_value").notNull(), // new value
  changedAt: timestamp("changed_at").defaultNow(),
});

// Weight Audit - for tracking changes to weight entries
export const weightAudit = pgTable("weight_audit", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weightEntryId: varchar("weight_entry_id"), // references weightEntries(id), null for deletions
  action: text("action").notNull(), // 'create', 'update', 'delete', 'import'
  source: text("source").notNull(), // 'manual', 'renpho_csv'
  previousWeight: real("previous_weight"), // previous weight value
  newWeight: real("new_weight"), // new weight value
  weightDelta: real("weight_delta"), // absolute change in weight (new - previous)
  weightPercentageChange: real("weight_percentage_change"), // percentage change
  previousBodyFat: real("previous_body_fat"), // previous body fat %
  newBodyFat: real("new_body_fat"), // new body fat %
  bodyFatDelta: real("body_fat_delta"), // absolute change in body fat
  previousMuscleMass: real("previous_muscle_mass"), // previous muscle mass
  newMuscleMass: real("new_muscle_mass"), // new muscle mass
  muscleMassDelta: real("muscle_mass_delta"), // absolute change in muscle mass
  previousBMI: real("previous_bmi"), // previous BMI
  newBMI: real("new_bmi"), // new BMI
  bmiDelta: real("bmi_delta"), // absolute change in BMI
  remarks: text("remarks"), // optional notes about the change
  changedAt: timestamp("changed_at").defaultNow(),
});

// Workout Timers - persistent timer state that survives restarts
export const workoutTimers = pgTable("workout_timers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storageKey: text("storage_key").notNull(), // 'workout-stopwatch', 'mini-stopwatch', etc.
  isRunning: integer("is_running").default(0), // 1 for running, 0 for stopped
  sessionStartEpochMs: integer("session_start_epoch_ms").default(0), // When current session started
  lapStartEpochMs: integer("lap_start_epoch_ms").default(0), // When current lap started
  elapsedBeforeStartMs: integer("elapsed_before_start_ms").default(0), // Total elapsed before current session
  lapElapsedBeforeStartMs: integer("lap_elapsed_before_start_ms").default(0), // Lap elapsed before current session
  dateKey: text("date_key").notNull(), // Date string for daily reset (e.g., "Mon Sep 21 2025")
  autoResetDaily: integer("auto_reset_daily").default(1), // 1 for auto reset daily, 0 for persistent
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Timer Lap Times - individual lap records for each timer
export const timerLapTimes = pgTable("timer_lap_times", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timerId: varchar("timer_id").notNull(), // references workoutTimers(id)
  lapId: integer("lap_id").notNull(), // Sequential lap number (1, 2, 3...)
  lapTime: text("lap_time").notNull(), // Formatted lap time display (e.g., "2:35")
  lapTimeMs: integer("lap_time_ms").notNull(), // Lap time in milliseconds
  startedAtMs: integer("started_at_ms").notNull(), // When this lap started (epoch ms)
  createdAt: timestamp("created_at").defaultNow(),
});

// Body Measurements - tape measure body tracking
export const bodyMeasurements = pgTable("body_measurements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(),
  neck: real("neck"), // Neck measurement in inches
  shoulder: real("shoulder"), // Shoulder measurement in inches
  lBiceps: real("l_biceps"), // Left biceps measurement in inches
  rBiceps: real("r_biceps"), // Right biceps measurement in inches
  chest: real("chest"), // Chest measurement in inches
  waist: real("waist"), // Waist measurement in inches
  abdomen: real("abdomen"), // Abdomen measurement in inches
  hip: real("hip"), // Hip measurement in inches
  lThigh: real("l_thigh"), // Left thigh measurement in inches
  rThigh: real("r_thigh"), // Right thigh measurement in inches
  lCalf: real("l_calf"), // Left calf measurement in inches
  rCalf: real("r_calf"), // Right calf measurement in inches
  waistHipRatio: real("waist_hip_ratio"), // Calculated waist-hip ratio
  createdAt: timestamp("created_at").defaultNow(),
});

// Step Entries - daily step tracking from pedometer/phone
export const stepEntries = pgTable("step_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(),
  steps: integer("steps").notNull(), // Daily step count
  distance: real("distance"), // Distance traveled (miles)
  floorsAscended: integer("floors_ascended"), // Floors climbed
  createdAt: timestamp("created_at").defaultNow(),
});

// Supplements tracking with flippable card design and URL preview
export const supplements = pgTable("supplements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // Supplement name
  imageUrl: text("image_url"), // Object storage path for supplement image
  personalNotes: text("personal_notes").default(""), // Personal reasoning/notes for taking supplement
  referenceUrl: text("reference_url"), // External URL to studies/articles
  urlPreview: text("url_preview"), // JSON string with URL metadata {title, description, siteName, previewImage}
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const affirmations = pgTable("affirmations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  text: text("text").notNull(), // The affirmation text
  isActive: text("is_active").default("false").notNull(), // Active/inactive status as text boolean
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cardio Log Entries - voice-recorded cardio workouts
export const cardioLogEntries = pgTable("cardio_log_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(), // Date of the workout
  workoutType: text("workout_type").notNull(), // Running, cycling, walking, rowing, etc.
  duration: text("duration"), // Duration as string like "30 min" or "45:00"
  distance: text("distance"), // Distance like "3.5 miles" or "5 km"
  caloriesBurned: integer("calories_burned"), // Calories burned during workout
  pace: text("pace"), // Average pace for running/walking (e.g. "10:00 /mi")
  notes: text("notes").default(""), // Additional notes/details
  rawTranscription: text("raw_transcription"), // Original voice input text
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCardioLogEntrySchema = createInsertSchema(cardioLogEntries).omit({
  id: true,
  createdAt: true,
}).extend({
  date: z.union([
    z.string().transform((str) => new Date(str)),
    z.date()
  ]).transform((date) => date instanceof Date ? date : new Date(date)),
});

export const updateCardioLogEntrySchema = insertCardioLogEntrySchema.partial();

export type CardioLogEntry = typeof cardioLogEntries.$inferSelect;
export type InsertCardioLogEntry = z.infer<typeof insertCardioLogEntrySchema>;
export type UpdateCardioLogEntry = z.infer<typeof updateCardioLogEntrySchema>;

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertExerciseSchema = createInsertSchema(exercises).omit({
  id: true,
  createdAt: true,
});

export const updateExerciseSchema = insertExerciseSchema.partial();

export const insertWeightHistorySchema = createInsertSchema(weightHistory).omit({
  id: true,
  changedAt: true,
});

export const updateWeightHistorySchema = insertWeightHistorySchema.partial();

export const insertWorkoutLogSchema = createInsertSchema(workoutLogs).omit({
  id: true,
  completedAt: true,
});

export const insertWeightEntrySchema = createInsertSchema(weightEntries).omit({
  id: true,
  createdAt: true,
}).extend({
  // Allow string dates to be coerced to Date objects
  date: z.string().transform((str) => new Date(str)),
});

export const updateWeightEntrySchema = insertWeightEntrySchema.partial();

export const insertBloodEntrySchema = createInsertSchema(bloodEntries).omit({
  id: true,
  createdAt: true,
}).extend({
  // Allow string dates and Date objects to be coerced properly
  asOf: z.union([
    z.string().transform((str) => new Date(str)),
    z.date()
  ]).transform((date) => date instanceof Date ? date : new Date(date)),
});

export const updateBloodEntrySchema = insertBloodEntrySchema.partial();

export const insertBloodOptimalRangeSchema = createInsertSchema(bloodOptimalRanges).omit({
  id: true,
});

export const updateBloodOptimalRangeSchema = insertBloodOptimalRangeSchema.partial();

export const insertPhotoProgressSchema = createInsertSchema(photoProgress).omit({
  id: true,
  createdAt: true,
}).extend({
  fileType: z.enum(["image", "video"]).default("image"),
  // Allow string dates and Date objects to be coerced properly
  takenAt: z.union([
    z.string().transform((str) => new Date(str)),
    z.date()
  ]).transform((date) => date instanceof Date ? date : new Date(date)),
});

export const updatePhotoProgressSchema = insertPhotoProgressSchema.partial();

export const insertThoughtSchema = createInsertSchema(thoughts).omit({
  id: true,
  createdAt: true,
});

export const updateThoughtSchema = insertThoughtSchema.partial();

export const insertQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
  createdAt: true,
});

export const updateQuoteSchema = insertQuoteSchema.partial();

export const insertDailySetProgressSchema = createInsertSchema(dailySetProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateDailySetProgressSchema = insertDailySetProgressSchema.partial();

export const insertDailyWorkoutStatusSchema = createInsertSchema(dailyWorkoutStatus).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateDailyWorkoutStatusSchema = insertDailyWorkoutStatusSchema.partial();

export const insertWorkoutNotesSchema = createInsertSchema(workoutNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateWorkoutNotesSchema = insertWorkoutNotesSchema.partial();

export const insertPageNotesSchema = createInsertSchema(pageNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updatePageNotesSchema = insertPageNotesSchema.partial();

export const insertPersonalRecordSchema = createInsertSchema(personalRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updatePersonalRecordSchema = insertPersonalRecordSchema.partial();

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateUserSettingsSchema = insertUserSettingsSchema.partial();

export const insertShortcutSettingsSchema = createInsertSchema(shortcutSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateShortcutSettingsSchema = insertShortcutSettingsSchema.partial();

export const insertTabSettingsSchema = createInsertSchema(tabSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateTabSettingsSchema = insertTabSettingsSchema.partial();

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type UpdateExercise = z.infer<typeof updateExerciseSchema>;
export type WeightHistory = typeof weightHistory.$inferSelect;
export type InsertWeightHistory = z.infer<typeof insertWeightHistorySchema>;
export type UpdateWeightHistory = z.infer<typeof updateWeightHistorySchema>;
export type WorkoutLog = typeof workoutLogs.$inferSelect;
export type InsertWorkoutLog = z.infer<typeof insertWorkoutLogSchema>;
export type WeightEntry = typeof weightEntries.$inferSelect;
export type InsertWeightEntry = z.infer<typeof insertWeightEntrySchema>;
export type UpdateWeightEntry = z.infer<typeof updateWeightEntrySchema>;
export type BloodEntry = typeof bloodEntries.$inferSelect;
export type InsertBloodEntry = z.infer<typeof insertBloodEntrySchema>;
export type UpdateBloodEntry = z.infer<typeof updateBloodEntrySchema>;
export type BloodOptimalRange = typeof bloodOptimalRanges.$inferSelect;
export type InsertBloodOptimalRange = z.infer<typeof insertBloodOptimalRangeSchema>;
export type UpdateBloodOptimalRange = z.infer<typeof updateBloodOptimalRangeSchema>;
export type PhotoProgress = typeof photoProgress.$inferSelect;
export type InsertPhotoProgress = z.infer<typeof insertPhotoProgressSchema>;
export type UpdatePhotoProgress = z.infer<typeof updatePhotoProgressSchema>;
export type Thought = typeof thoughts.$inferSelect;
export type InsertThought = z.infer<typeof insertThoughtSchema>;
export type UpdateThought = z.infer<typeof updateThoughtSchema>;
export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type UpdateQuote = z.infer<typeof updateQuoteSchema>;
export type DailySetProgress = typeof dailySetProgress.$inferSelect;
export type InsertDailySetProgress = z.infer<typeof insertDailySetProgressSchema>;
export type UpdateDailySetProgress = z.infer<typeof updateDailySetProgressSchema>;
export type DailyWorkoutStatus = typeof dailyWorkoutStatus.$inferSelect;
export type InsertDailyWorkoutStatus = z.infer<typeof insertDailyWorkoutStatusSchema>;
export type UpdateDailyWorkoutStatus = z.infer<typeof updateDailyWorkoutStatusSchema>;
export type WorkoutNotes = typeof workoutNotes.$inferSelect;
export type InsertWorkoutNotes = z.infer<typeof insertWorkoutNotesSchema>;
export type UpdateWorkoutNotes = z.infer<typeof updateWorkoutNotesSchema>;
export type PageNotes = typeof pageNotes.$inferSelect;
export type InsertPageNotes = z.infer<typeof insertPageNotesSchema>;
export type UpdatePageNotes = z.infer<typeof updatePageNotesSchema>;
export type PersonalRecord = typeof personalRecords.$inferSelect;
export type InsertPersonalRecord = z.infer<typeof insertPersonalRecordSchema>;
export type UpdatePersonalRecord = z.infer<typeof updatePersonalRecordSchema>;
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UpdateUserSettings = z.infer<typeof updateUserSettingsSchema>;
export type ShortcutSettings = typeof shortcutSettings.$inferSelect;
export type InsertShortcutSettings = z.infer<typeof insertShortcutSettingsSchema>;
export type UpdateShortcutSettings = z.infer<typeof updateShortcutSettingsSchema>;
export type TabSettings = typeof tabSettings.$inferSelect;
export type InsertTabSettings = z.infer<typeof insertTabSettingsSchema>;
export type UpdateTabSettings = z.infer<typeof updateTabSettingsSchema>;

export const insertExerciseTemplateSchema = createInsertSchema(exerciseTemplates).omit({
  id: true,
  createdAt: true,
  lastUsed: true,
});

export const updateExerciseTemplateSchema = insertExerciseTemplateSchema.partial();

export const insertChangesAuditSchema = createInsertSchema(changesAudit).omit({
  id: true,
  changedAt: true,
});

export const updateChangesAuditSchema = insertChangesAuditSchema.partial();

export const insertPRChangesAuditSchema = createInsertSchema(prChangesAudit).omit({
  id: true,
  changedAt: true,
});

export const updatePRChangesAuditSchema = insertPRChangesAuditSchema.partial();

export const insertWeightAuditSchema = createInsertSchema(weightAudit).omit({
  id: true,
  changedAt: true,
});

export const updateWeightAuditSchema = insertWeightAuditSchema.partial();

export const insertWorkoutTimerSchema = createInsertSchema(workoutTimers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateWorkoutTimerSchema = insertWorkoutTimerSchema.partial();

export const insertTimerLapTimeSchema = createInsertSchema(timerLapTimes).omit({
  id: true,
  createdAt: true,
});

export const updateTimerLapTimeSchema = insertTimerLapTimeSchema.partial();

export const insertBodyMeasurementSchema = createInsertSchema(bodyMeasurements).omit({
  id: true,
  createdAt: true,
}).extend({
  // Allow string dates to be coerced to Date objects
  date: z.string().transform((str) => new Date(str)),
});

export const updateBodyMeasurementSchema = insertBodyMeasurementSchema.partial();

export const insertStepEntrySchema = createInsertSchema(stepEntries).omit({
  id: true,
  createdAt: true,
}).extend({
  // Allow string dates to be coerced to Date objects
  date: z.string().transform((str) => new Date(str)),
});

export const updateStepEntrySchema = insertStepEntrySchema.partial();

export const insertSupplementSchema = createInsertSchema(supplements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateSupplementSchema = insertSupplementSchema.partial();

export const insertAffirmationSchema = createInsertSchema(affirmations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateAffirmationSchema = insertAffirmationSchema.partial();

export type ExerciseTemplate = typeof exerciseTemplates.$inferSelect;
export type InsertExerciseTemplate = z.infer<typeof insertExerciseTemplateSchema>;
export type UpdateExerciseTemplate = z.infer<typeof updateExerciseTemplateSchema>;
export type ChangesAudit = typeof changesAudit.$inferSelect;
export type InsertChangesAudit = z.infer<typeof insertChangesAuditSchema>;
export type UpdateChangesAudit = z.infer<typeof updateChangesAuditSchema>;
export type PRChangesAudit = typeof prChangesAudit.$inferSelect;
export type InsertPRChangesAudit = z.infer<typeof insertPRChangesAuditSchema>;
export type UpdatePRChangesAudit = z.infer<typeof updatePRChangesAuditSchema>;
export type WeightAudit = typeof weightAudit.$inferSelect;
export type InsertWeightAudit = z.infer<typeof insertWeightAuditSchema>;
export type UpdateWeightAudit = z.infer<typeof updateWeightAuditSchema>;
export type WorkoutTimer = typeof workoutTimers.$inferSelect;
export type InsertWorkoutTimer = z.infer<typeof insertWorkoutTimerSchema>;
export type UpdateWorkoutTimer = z.infer<typeof updateWorkoutTimerSchema>;
export type TimerLapTime = typeof timerLapTimes.$inferSelect;
export type InsertTimerLapTime = z.infer<typeof insertTimerLapTimeSchema>;
export type UpdateTimerLapTime = z.infer<typeof updateTimerLapTimeSchema>;
export type BodyMeasurement = typeof bodyMeasurements.$inferSelect;
export type InsertBodyMeasurement = z.infer<typeof insertBodyMeasurementSchema>;
export type UpdateBodyMeasurement = z.infer<typeof updateBodyMeasurementSchema>;
export type StepEntry = typeof stepEntries.$inferSelect;
export type InsertStepEntry = z.infer<typeof insertStepEntrySchema>;
export type UpdateStepEntry = z.infer<typeof updateStepEntrySchema>;
export type Supplement = typeof supplements.$inferSelect;
export type InsertSupplement = z.infer<typeof insertSupplementSchema>;
export type UpdateSupplement = z.infer<typeof updateSupplementSchema>;
export type Affirmation = typeof affirmations.$inferSelect;
export type InsertAffirmation = z.infer<typeof insertAffirmationSchema>;
export type UpdateAffirmation = z.infer<typeof updateAffirmationSchema>;

// Blood work comparison types
export type BloodWorkComparison = {
  markerKey: string;
  markerName: string;
  baseValue: number | null;
  comparisonValue: number | null;
  unit: string;
  absoluteChange: number | null;
  percentageChange: number | null;
  changeDirection: 'increase' | 'decrease' | 'no_change';
  isBetterTrend: boolean | null; // Whether the change is in a better direction
};

export type BloodWorkComparisonResult = {
  type: 'automatic' | 'manual';
  baseEntry: BloodEntry;
  comparisonEntry: BloodEntry;
  comparisons: BloodWorkComparison[];
  summary: {
    totalMetrics: number;
    improvedMetrics: number;
    worsenedMetrics: number;
    unchangedMetrics: number;
  };
};

export const bloodWorkComparisonRequestSchema = z.object({
  baseEntryId: z.string(),
  comparisonEntryId: z.string(),
});
