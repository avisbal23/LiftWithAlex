import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type UpdateExercise = z.infer<typeof updateExerciseSchema>;
export type WorkoutLog = typeof workoutLogs.$inferSelect;
export type InsertWorkoutLog = z.infer<typeof insertWorkoutLogSchema>;
