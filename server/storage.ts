import { type User, type InsertUser, type Exercise, type InsertExercise, type UpdateExercise } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getExercisesByCategory(category: string): Promise<Exercise[]>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  updateExercise(id: string, exercise: UpdateExercise): Promise<Exercise | undefined>;
  deleteExercise(id: string): Promise<boolean>;
  getAllExercises(): Promise<Exercise[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private exercises: Map<string, Exercise>;

  constructor() {
    this.users = new Map();
    this.exercises = new Map();
    
    // Add some initial sample data
    this.seedData();
  }

  private seedData() {
    // Push Day 1 exercises
    const pushExercises = [
      // Main Lifts
      { name: "Flat Dumbbell Press", weight: 80, reps: 6, notes: "80, 75 lbs | 5–7 reps", category: "push" },
      { name: "Incline Dumbbell Press", weight: 70, reps: 6, notes: "70, 65 lbs | 5–7 reps", category: "push" },
      { name: "Seated Cable Press", weight: 8, reps: 9, notes: "8,7 down | 8–10 reps", category: "push" },
      // Accessories
      { name: "Pec Deck", weight: 125, reps: 0, notes: "125 lbs | reps not logged | Seat height 4", category: "push" },
      { name: "Dumbbell Shoulder Press", weight: 65, reps: 6, notes: "65 lbs | 6 reps", category: "push" },
      { name: "Dumbbell Lateral Raises", weight: 25, reps: 0, notes: "25 lbs | To failure", category: "push" },
    ];

    // Push Day 2 exercises
    const push2Exercises = [
      // Main Lifts
      { name: "Flat Dumbbell Press", weight: 80, reps: 6, notes: "80, 75 lbs | 5–7 reps", category: "push2" },
      { name: "Incline Dumbbell Press", weight: 70, reps: 6, notes: "70, 65 lbs | 5–7 reps", category: "push2" },
      { name: "Seated Cable Press", weight: 8, reps: 9, notes: "8,7 down | 8–10 reps", category: "push2" },
      // Accessories
      { name: "Downward Cable Press", weight: 33, reps: 0, notes: "33 lbs | reps not logged", category: "push2" },
      { name: "Tricep Extensions (Cable, Single/Double)", weight: 35, reps: 0, notes: "35 lbs | reps not logged", category: "push2" },
      { name: "Shrugs (DB/KB)", weight: 25, reps: 0, notes: "25 lbs | To failure", category: "push2" },
    ];

    // Pull Day 1 exercises
    const pullExercises = [
      // Main Lifts
      { name: "Pull-Ups (Assisted)", weight: 20, reps: 0, notes: "20 lbs assist | To failure", category: "pull" },
      { name: "Seated Low Rows (Close Grip)", weight: 70, reps: 0, notes: "~70 lbs (est.) | reps not logged", category: "pull" },
      { name: "EZ Bar Preacher Curl", weight: 50, reps: 7, notes: "50 lbs | 6–8 reps", category: "pull" },
      { name: "Tricep Extensions (Cable, Single/Double)", weight: 35, reps: 0, notes: "35 lbs | reps not logged", category: "pull" },
      { name: "Shrugs (DB)", weight: 25, reps: 0, notes: "25 lbs | To failure", category: "pull" },
      // Accessories
      { name: "Seated Lat Pulldowns (Wide)", weight: 130, reps: 7, notes: "130 lbs | 6–8 reps", category: "pull" },
      { name: "Incline Dumbbell Curls", weight: 25, reps: 0, notes: "25 lbs | reps not logged", category: "pull" },
      { name: "Straight Arm Pulldowns (Bar)", weight: 35, reps: 0, notes: "35 lbs | reps not logged", category: "pull" },
    ];

    // Pull Day 2 exercises
    const pull2Exercises = [
      // Main Lifts
      { name: "Seated Lat Pulldowns (Wide)", weight: 130, reps: 7, notes: "130 lbs | 6–8 reps", category: "pull2" },
      { name: "Diverging Lat Pulldown", weight: 80, reps: 0, notes: "80 lbs, 60 lbs | reps not logged", category: "pull2" },
      { name: "Standing Dumbbell Curls", weight: 25, reps: 0, notes: "25 lbs | To failure", category: "pull2" },
      { name: "Downward Cable Press", weight: 33, reps: 0, notes: "33 lbs | reps not logged", category: "pull2" },
      { name: "Shrugs (DB)", weight: 25, reps: 0, notes: "25 lbs | To failure", category: "pull2" },
      // Accessories
      { name: "Pull-Ups (Assisted)", weight: 20, reps: 0, notes: "20 lbs assist | To failure", category: "pull2" },
      { name: "Cable X Front Crosses", weight: 6, reps: 0, notes: "6 down | reps not logged", category: "pull2" },
      { name: "Through the Legs Cable Bicep Curls", weight: 30, reps: 0, notes: "30 lbs | reps not logged", category: "pull2" },
      { name: "Between Legs Cable Bicep Curls", weight: 30, reps: 0, notes: "30 lbs | reps not logged", category: "pull2" },
    ];

    // Leg Day 1 exercises
    const legExercises = [
      // Main Lifts
      { name: "Barbell Squats", weight: 135, reps: 0, notes: "~135 lbs (est.) | reps not logged", category: "legs" },
      { name: "Trap Bar Deadlifts", weight: 135, reps: 0, notes: "~135 lbs (est.) | reps not logged", category: "legs" },
      { name: "Kettlebell Lunges", weight: 35, reps: 30, notes: "35 lbs each | 30 reps (15 each side)", category: "legs" },
      { name: "Calf Extensions", weight: 100, reps: 0, notes: "~100 lbs (est.) | reps not logged", category: "legs" },
      // Accessories
      { name: "Leg Press", weight: 180, reps: 0, notes: "~180 lbs (est.) | reps not logged", category: "legs" },
      { name: "Hip Thrusts", weight: 95, reps: 0, notes: "~95 lbs (est.) | reps not logged", category: "legs" },
    ];

    // Leg Day 2 exercises
    const legs2Exercises = [
      // Main Lifts
      { name: "Leg Press", weight: 180, reps: 0, notes: "~180 lbs (est.) | reps not logged", category: "legs2" },
      { name: "Barbell Squats", weight: 135, reps: 0, notes: "~135 lbs (est.) | reps not logged", category: "legs2" },
      { name: "Kettlebell Lunges", weight: 35, reps: 30, notes: "35 lbs each | 30 reps (15 each side)", category: "legs2" },
      { name: "Calf Extensions", weight: 100, reps: 0, notes: "~100 lbs (est.) | reps not logged", category: "legs2" },
      // Accessories
      { name: "Quad Extensions", weight: 100, reps: 10, notes: "100 lbs | 10 reps (slow downs)", category: "legs2" },
      { name: "Hamstring Curls", weight: 70, reps: 0, notes: "~70 lbs (est.) | reps not logged", category: "legs2" },
    ];

    [...pushExercises, ...push2Exercises, ...pullExercises, ...pull2Exercises, ...legExercises, ...legs2Exercises].forEach(exercise => {
      const id = randomUUID();
      const fullExercise: Exercise = {
        ...exercise,
        id,
        createdAt: new Date(),
      };
      this.exercises.set(id, fullExercise);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getExercisesByCategory(category: string): Promise<Exercise[]> {
    return Array.from(this.exercises.values())
      .filter(exercise => exercise.category === category)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createExercise(insertExercise: InsertExercise): Promise<Exercise> {
    const id = randomUUID();
    const exercise: Exercise = {
      ...insertExercise,
      id,
      createdAt: new Date(),
    };
    this.exercises.set(id, exercise);
    return exercise;
  }

  async updateExercise(id: string, updateExercise: UpdateExercise): Promise<Exercise | undefined> {
    const existing = this.exercises.get(id);
    if (!existing) {
      return undefined;
    }
    
    const updated: Exercise = {
      ...existing,
      ...updateExercise,
    };
    this.exercises.set(id, updated);
    return updated;
  }

  async deleteExercise(id: string): Promise<boolean> {
    return this.exercises.delete(id);
  }

  async getAllExercises(): Promise<Exercise[]> {
    return Array.from(this.exercises.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const storage = new MemStorage();
