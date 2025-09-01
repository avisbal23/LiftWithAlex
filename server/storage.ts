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
      { name: "Bench Press", weight: 185, reps: 8, notes: "Good form, felt strong", category: "push" },
      { name: "Shoulder Press", weight: 135, reps: 10, notes: "", category: "push" },
      { name: "Tricep Dips", weight: 45, reps: 12, notes: "Full range of motion", category: "push" },
    ];

    // Pull exercises
    const pullExercises = [
      { name: "Deadlift", weight: 225, reps: 5, notes: "Perfect form today", category: "pull" },
      { name: "Pull-ups", weight: 0, reps: 8, notes: "", category: "pull" },
    ];

    // Leg exercises
    const legExercises = [
      { name: "Squats", weight: 205, reps: 10, notes: "Hit depth on all reps", category: "legs" },
      { name: "Romanian Deadlifts", weight: 155, reps: 12, notes: "", category: "legs" },
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
