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
  category: text("category").notNull(), // 'push', 'pull', 'legs', 'push2', 'pull2', 'legs2', 'cardio'
  // Cardio-specific fields
  duration: text("duration").default(""), // "28:32"
  distance: text("distance").default(""), // "3.1 miles"
  pace: text("pace").default(""), // "9:10/mile"
  calories: integer("calories").default(0),
  rpe: integer("rpe").default(0), // Rate of Perceived Exertion (1-10)
  createdAt: timestamp("created_at").defaultNow(),
});

export const workoutLogs = pgTable("workout_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(), // 'push', 'pull', 'legs', 'push2', 'pull2', 'legs2', 'cardio'
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
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const photoProgress = pgTable("photo_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").default(""),
  photoUrl: text("photo_url").notNull(), // Object storage path like /objects/uploads/uuid
  bodyPart: text("body_part"), // 'front', 'back', 'side', 'arms', 'legs', 'abs', etc.
  weight: real("weight"), // Weight at time of photo (optional)
  takenAt: timestamp("taken_at").notNull(), // When photo was taken
  createdAt: timestamp("created_at").defaultNow(),
});

export const thoughts = pgTable("thoughts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  mood: text("mood").default("neutral"), // 'happy', 'sad', 'excited', 'frustrated', 'grateful', 'motivated', 'contemplative', 'neutral'
  tags: text("tags").array().default(sql`ARRAY[]::text[]`), // Array of tag strings
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

// Personal Records - separate from workout exercises
export const personalRecords = pgTable("personal_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  exercise: text("exercise").notNull(),
  weight: text("weight").default(""),
  reps: text("reps").default(""),
  time: text("time").default(""), // For cardio
  category: text("category").notNull(), // 'Push', 'Pull', 'Legs', 'Cardio'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertExerciseSchema = createInsertSchema(exercises).omit({
  id: true,
  createdAt: true,
});

export const updateExerciseSchema = insertExerciseSchema.partial();

export const insertWorkoutLogSchema = createInsertSchema(workoutLogs).omit({
  id: true,
  completedAt: true,
});

export const insertWeightEntrySchema = createInsertSchema(weightEntries).omit({
  id: true,
  createdAt: true,
});

export const updateWeightEntrySchema = insertWeightEntrySchema.partial();

export const insertBloodEntrySchema = createInsertSchema(bloodEntries).omit({
  id: true,
  createdAt: true,
});

export const updateBloodEntrySchema = insertBloodEntrySchema.partial();

export const insertPhotoProgressSchema = createInsertSchema(photoProgress).omit({
  id: true,
  createdAt: true,
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

export const insertPersonalRecordSchema = createInsertSchema(personalRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updatePersonalRecordSchema = insertPersonalRecordSchema.partial();

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type UpdateExercise = z.infer<typeof updateExerciseSchema>;
export type WorkoutLog = typeof workoutLogs.$inferSelect;
export type InsertWorkoutLog = z.infer<typeof insertWorkoutLogSchema>;
export type WeightEntry = typeof weightEntries.$inferSelect;
export type InsertWeightEntry = z.infer<typeof insertWeightEntrySchema>;
export type UpdateWeightEntry = z.infer<typeof updateWeightEntrySchema>;
export type BloodEntry = typeof bloodEntries.$inferSelect;
export type InsertBloodEntry = z.infer<typeof insertBloodEntrySchema>;
export type UpdateBloodEntry = z.infer<typeof updateBloodEntrySchema>;
export type PhotoProgress = typeof photoProgress.$inferSelect;
export type InsertPhotoProgress = z.infer<typeof insertPhotoProgressSchema>;
export type UpdatePhotoProgress = z.infer<typeof updatePhotoProgressSchema>;
export type Thought = typeof thoughts.$inferSelect;
export type InsertThought = z.infer<typeof insertThoughtSchema>;
export type UpdateThought = z.infer<typeof updateThoughtSchema>;
export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type UpdateQuote = z.infer<typeof updateQuoteSchema>;
export type PersonalRecord = typeof personalRecords.$inferSelect;
export type InsertPersonalRecord = z.infer<typeof insertPersonalRecordSchema>;
export type UpdatePersonalRecord = z.infer<typeof updatePersonalRecordSchema>;
