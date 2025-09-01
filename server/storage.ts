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
    // Push exercises
    const pushExercises = [
      // Main Lifts
      { name: "Flat Dumbbell Press", weight: 80, reps: 6, notes: "80, 75 lbs | 5–7 reps", category: "push" },
      { name: "Incline Dumbbell Press", weight: 70, reps: 6, notes: "70, 65 lbs | 5–7 reps", category: "push" },
      { name: "Seated Cable Press", weight: 8, reps: 9, notes: "8,7 down | 8–10 reps", category: "push" },
      // Accessories
      { name: "Downward Cable Press", weight: 33, reps: 0, notes: "___ reps", category: "push" },
      { name: "Pec Deck", weight: 125, reps: 0, notes: "Seat height 4 | ___ reps", category: "push" },
      { name: "Dumbbell Shoulder Press", weight: 65, reps: 6, notes: "6 reps", category: "push" },
      { name: "Dumbbell Lateral Raises", weight: 25, reps: 0, notes: "To failure", category: "push" },
      { name: "Shrugs (DB/KB)", weight: 25, reps: 0, notes: "To failure", category: "push" },
      { name: "Tricep Extensions (Cable)", weight: 35, reps: 0, notes: "Single/Double | ___ reps", category: "push" },
    ];

    // Pull exercises
    const pullExercises = [
      // Main Lifts
      { name: "Pull-Ups (Assisted)", weight: 20, reps: 0, notes: "20 lbs assist | To failure", category: "pull" },
      { name: "Seated Lat Pulldowns (Wide)", weight: 130, reps: 7, notes: "6–8 reps", category: "pull" },
      { name: "Diverging Lat Pulldown", weight: 80, reps: 0, notes: "80 lbs, 60 lbs | ___ reps", category: "pull" },
      { name: "Seated Low Rows (Close Grip)", weight: 70, reps: 0, notes: "~70 lbs (est.) | ___ reps", category: "pull" },
      // Accessories
      { name: "Straight Arm Pulldowns (Bar)", weight: 35, reps: 0, notes: "___ reps", category: "pull" },
      { name: "Cable X Front Crosses", weight: 6, reps: 0, notes: "6 down | ___ reps", category: "pull" },
      { name: "Through the Legs Cable Bicep Curls", weight: 30, reps: 0, notes: "___ reps", category: "pull" },
      { name: "Between Legs Cable Bicep Curls", weight: 30, reps: 0, notes: "___ reps", category: "pull" },
      { name: "Standing Dumbbell Curls", weight: 25, reps: 0, notes: "To failure", category: "pull" },
      { name: "EZ Bar Preacher Curl", weight: 50, reps: 7, notes: "6–8 reps", category: "pull" },
      { name: "Incline Dumbbell Curls", weight: 25, reps: 0, notes: "___ reps", category: "pull" },
      { name: "Shrugs (DB)", weight: 25, reps: 0, notes: "To failure", category: "pull" },
    ];

    // Leg exercises
    const legExercises = [
      // Main Lifts
      { name: "Barbell Squats", weight: 135, reps: 0, notes: "~135 lbs (est.) | ___ reps", category: "legs" },
      { name: "Trap Bar Deadlifts", weight: 135, reps: 0, notes: "~135 lbs (est.) | ___ reps", category: "legs" },
      { name: "Leg Press", weight: 180, reps: 0, notes: "~180 lbs (est.) | ___ reps", category: "legs" },
      { name: "Kettlebell Lunges", weight: 35, reps: 30, notes: "35 lbs each | 30 reps (15 each side)", category: "legs" },
      // Accessories
      { name: "Quad Extensions", weight: 100, reps: 10, notes: "10 reps (slow downs)", category: "legs" },
      { name: "Hamstring Curls", weight: 70, reps: 0, notes: "~70 lbs (est.) | ___ reps", category: "legs" },
      { name: "Calf Extensions", weight: 100, reps: 0, notes: "~100 lbs (est.) | ___ reps", category: "legs" },
    ];

    [...pushExercises, ...pullExercises, ...legExercises].forEach(exercise => {
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
