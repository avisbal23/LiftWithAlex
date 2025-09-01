import { type User, type InsertUser, type Exercise, type InsertExercise, type UpdateExercise, type WorkoutLog, type InsertWorkoutLog, type WeightEntry, type InsertWeightEntry, type UpdateWeightEntry, type BloodEntry, type InsertBloodEntry, type UpdateBloodEntry } from "@shared/schema";
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
  
  createWorkoutLog(log: InsertWorkoutLog): Promise<WorkoutLog>;
  getLatestWorkoutLog(): Promise<WorkoutLog | undefined>;
  getAllWorkoutLogs(): Promise<WorkoutLog[]>;
  
  createWeightEntry(entry: InsertWeightEntry): Promise<WeightEntry>;
  updateWeightEntry(id: string, entry: UpdateWeightEntry): Promise<WeightEntry | undefined>;
  deleteWeightEntry(id: string): Promise<boolean>;
  getAllWeightEntries(): Promise<WeightEntry[]>;
  getWeightEntriesInDateRange(startDate: Date, endDate: Date): Promise<WeightEntry[]>;
  
  createBloodEntry(entry: InsertBloodEntry): Promise<BloodEntry>;
  updateBloodEntry(id: string, entry: UpdateBloodEntry): Promise<BloodEntry | undefined>;
  deleteBloodEntry(id: string): Promise<boolean>;
  getAllBloodEntries(): Promise<BloodEntry[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private exercises: Map<string, Exercise>;
  private workoutLogs: Map<string, WorkoutLog>;
  private weightEntries: Map<string, WeightEntry>;
  private bloodEntries: Map<string, BloodEntry>;

  constructor() {
    this.users = new Map();
    this.exercises = new Map();
    this.workoutLogs = new Map();
    this.weightEntries = new Map();
    this.bloodEntries = new Map();
    
    // Add some initial sample data
    this.seedData();
    this.seedBloodData();
  }

  private seedData() {
    // Push Day 1 exercises
    const pushExercises = [
      // Main Lifts
      { name: "Flat Dumbbell Press", weight: 80, reps: 6, notes: "80, 75 lbs | 5–7 reps", category: "push", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
      { name: "Incline Dumbbell Press", weight: 70, reps: 6, notes: "70, 65 lbs | 5–7 reps", category: "push", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
      { name: "Seated Cable Press", weight: 8, reps: 9, notes: "8,7 down | 8–10 reps", category: "push", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
      // Accessories
      { name: "Pec Deck", weight: 125, reps: 0, notes: "125 lbs | reps not logged | Seat height 4", category: "push", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
      { name: "Dumbbell Shoulder Press", weight: 65, reps: 6, notes: "65 lbs | 6 reps", category: "push", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
      { name: "Dumbbell Lateral Raises", weight: 25, reps: 0, notes: "25 lbs | To failure", category: "push", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
    ];

    // Push Day 2 exercises
    const push2Exercises = [
      // Main Lifts
      { name: "Flat Dumbbell Press", weight: 80, reps: 6, notes: "80, 75 lbs | 5–7 reps", category: "push2", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
      { name: "Incline Dumbbell Press", weight: 70, reps: 6, notes: "70, 65 lbs | 5–7 reps", category: "push2", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
      { name: "Seated Cable Press", weight: 8, reps: 9, notes: "8,7 down | 8–10 reps", category: "push2", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
      // Accessories
      { name: "Downward Cable Press", weight: 33, reps: 0, notes: "33 lbs | reps not logged", category: "push2", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
      { name: "Tricep Extensions (Cable, Single/Double)", weight: 35, reps: 0, notes: "35 lbs | reps not logged", category: "push2", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
      { name: "Shrugs (DB/KB)", weight: 25, reps: 0, notes: "25 lbs | To failure", category: "push2", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
    ];

    // Pull Day 1 exercises
    const pullExercises = [
      // Main Lifts
      { name: "Pull-Ups (Assisted)", weight: 20, reps: 0, notes: "20 lbs assist | To failure", category: "pull", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
      { name: "Seated Low Rows (Close Grip)", weight: 70, reps: 0, notes: "~70 lbs (est.) | reps not logged", category: "pull", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
      { name: "EZ Bar Preacher Curl", weight: 50, reps: 7, notes: "50 lbs | 6–8 reps", category: "pull", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
      { name: "Tricep Extensions (Cable, Single/Double)", weight: 35, reps: 0, notes: "35 lbs | reps not logged", category: "pull", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
      { name: "Shrugs (DB)", weight: 25, reps: 0, notes: "25 lbs | To failure", category: "pull", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
      // Accessories
      { name: "Seated Lat Pulldowns (Wide)", weight: 130, reps: 7, notes: "130 lbs | 6–8 reps", category: "pull", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
      { name: "Incline Dumbbell Curls", weight: 25, reps: 0, notes: "25 lbs | reps not logged", category: "pull", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
      { name: "Straight Arm Pulldowns (Bar)", weight: 35, reps: 0, notes: "35 lbs | reps not logged", category: "pull", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
    ];

    // Pull Day 2 exercises
    const pull2Exercises = [
      // Main Lifts
      { name: "Seated Lat Pulldowns (Wide)", weight: 130, reps: 7, notes: "130 lbs | 6–8 reps", category: "pull2", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
      { name: "Diverging Lat Pulldown", weight: 80, reps: 0, notes: "80 lbs, 60 lbs | reps not logged", category: "pull2", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
      { name: "Standing Dumbbell Curls", weight: 25, reps: 0, notes: "25 lbs | To failure", category: "pull2", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
      { name: "Downward Cable Press", weight: 33, reps: 0, notes: "33 lbs | reps not logged", category: "pull2", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
      { name: "Shrugs (DB)", weight: 25, reps: 0, notes: "25 lbs | To failure", category: "pull2", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
      // Accessories
      { name: "Pull-Ups (Assisted)", weight: 20, reps: 0, notes: "20 lbs assist | To failure", category: "pull2", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
      { name: "Cable X Front Crosses", weight: 6, reps: 0, notes: "6 down | reps not logged", category: "pull2", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
      { name: "Through the Legs Cable Bicep Curls", weight: 30, reps: 0, notes: "30 lbs | reps not logged", category: "pull2", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
      { name: "Between Legs Cable Bicep Curls", weight: 30, reps: 0, notes: "30 lbs | reps not logged", category: "pull2", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
    ];

    // Leg Day 1 exercises
    const legExercises = [
      // Main Lifts
      { name: "Barbell Squats", weight: 135, reps: 0, notes: "~135 lbs (est.) | reps not logged", category: "legs", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
      { name: "Trap Bar Deadlifts", weight: 135, reps: 0, notes: "~135 lbs (est.) | reps not logged", category: "legs", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
      { name: "Kettlebell Lunges", weight: 35, reps: 30, notes: "35 lbs each | 30 reps (15 each side)", category: "legs", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
      { name: "Calf Extensions", weight: 100, reps: 0, notes: "~100 lbs (est.) | reps not logged", category: "legs", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
      // Accessories
      { name: "Leg Press", weight: 180, reps: 0, notes: "~180 lbs (est.) | reps not logged", category: "legs", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
      { name: "Hip Thrusts", weight: 95, reps: 0, notes: "~95 lbs (est.) | reps not logged", category: "legs", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
    ];

    // Leg Day 2 exercises
    const legs2Exercises = [
      // Main Lifts
      { name: "Leg Press", weight: 180, reps: 0, notes: "~180 lbs (est.) | reps not logged", category: "legs2", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
      { name: "Barbell Squats", weight: 135, reps: 0, notes: "~135 lbs (est.) | reps not logged", category: "legs2", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
      { name: "Kettlebell Lunges", weight: 35, reps: 30, notes: "35 lbs each | 30 reps (15 each side)", category: "legs2", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
      { name: "Calf Extensions", weight: 100, reps: 0, notes: "~100 lbs (est.) | reps not logged", category: "legs2", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
      // Accessories
      { name: "Quad Extensions", weight: 100, reps: 10, notes: "100 lbs | 10 reps (slow downs)", category: "legs2", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
      { name: "Hamstring Curls", weight: 70, reps: 0, notes: "~70 lbs (est.) | reps not logged", category: "legs2", duration: "", distance: "", pace: "", calories: 0, rpe: 0 },
    ];

    // Cardio exercises
    const cardioExercises = [
      { name: "Walk 1", weight: 0, reps: 0, duration: "30:00", distance: "2.0 miles", pace: "15:00/mile", calories: 150, rpe: 3, notes: "Easy morning walk", category: "cardio" },
      { name: "Run 1", weight: 0, reps: 0, duration: "25:00", distance: "3.0 miles", pace: "8:20/mile", calories: 300, rpe: 7, notes: "Steady pace run", category: "cardio" },
      { name: "1 mile", weight: 0, reps: 0, duration: "8:15", distance: "1.0 mile", pace: "8:15/mile", calories: 100, rpe: 8, notes: "Time trial", category: "cardio" },
      { name: "5K", weight: 0, reps: 0, duration: "28:32", distance: "3.1 miles", pace: "9:10/mile", calories: 320, rpe: 8, notes: "Official 5K race pace", category: "cardio" },
      { name: "10K", weight: 0, reps: 0, duration: "58:45", distance: "6.2 miles", pace: "9:28/mile", calories: 650, rpe: 9, notes: "Long distance run", category: "cardio" },
      { name: "10 min rowing", weight: 0, reps: 0, duration: "10:00", distance: "2200m", pace: "2:16/500m", calories: 120, rpe: 7, notes: "Steady rowing session", category: "cardio" },
      { name: "10 min stair stepper", weight: 0, reps: 0, duration: "10:00", distance: "0.8 miles", pace: "12:30/mile", calories: 110, rpe: 6, notes: "Consistent stepping pace", category: "cardio" },
    ];

    [...pushExercises, ...push2Exercises, ...pullExercises, ...pull2Exercises, ...legExercises, ...legs2Exercises, ...cardioExercises].forEach(exercise => {
      const id = randomUUID();
      const fullExercise: Exercise = {
        ...exercise,
        id,
        createdAt: new Date(),
      };
      this.exercises.set(id, fullExercise);
    });

    // Your actual RENPHO health data
    const weightSampleData = [
      { 
        date: new Date('2025-08-24'), time: '11:52:37 AM', weight: 166.4, bodyFat: 15.0, 
        fatFreeMass: 141.4, muscleMass: 134.2, bmi: 26.8, subcutaneousFat: 12.4, 
        skeletalMuscle: 54.9, bodyWater: 61.4, visceralFat: 9, boneMass: 7.2, 
        protein: 19.4, bmr: 1769, metabolicAge: 31, remarks: '--',
        optimalWeight: null, targetToOptimalWeight: null, targetToOptimalFatMass: null, 
        targetToOptimalMuscleMass: null, bodyType: null
      },
      { 
        date: new Date('2025-08-21'), time: '7:47:06 AM', weight: 167.4, bodyFat: 15.1, 
        fatFreeMass: 142.0, muscleMass: 135.0, bmi: 27.0, subcutaneousFat: 12.5, 
        skeletalMuscle: 54.8, bodyWater: 61.3, visceralFat: 10, boneMass: 7.0, 
        protein: 19.4, bmr: 1747, metabolicAge: 31, remarks: '--',
        optimalWeight: null, targetToOptimalWeight: null, targetToOptimalFatMass: null, 
        targetToOptimalMuscleMass: null, bodyType: null
      },
      { 
        date: new Date('2025-08-18'), time: '5:29:39 AM', weight: 164.8, bodyFat: 14.8, 
        fatFreeMass: 140.4, muscleMass: 133.4, bmi: 26.6, subcutaneousFat: 12.3, 
        skeletalMuscle: 55.0, bodyWater: 61.5, visceralFat: 9, boneMass: 7.0, 
        protein: 19.4, bmr: 1760, metabolicAge: 31, remarks: '--',
        optimalWeight: null, targetToOptimalWeight: null, targetToOptimalFatMass: null, 
        targetToOptimalMuscleMass: null, bodyType: null
      },
      { 
        date: new Date('2025-08-14'), time: '9:22:50 AM', weight: 161.8, bodyFat: 14.4, 
        fatFreeMass: 138.6, muscleMass: 131.6, bmi: 26.1, subcutaneousFat: 12.0, 
        skeletalMuscle: 55.3, bodyWater: 61.8, visceralFat: 9, boneMass: 7.0, 
        protein: 19.5, bmr: 1734, metabolicAge: 30, remarks: '--',
        optimalWeight: null, targetToOptimalWeight: null, targetToOptimalFatMass: null, 
        targetToOptimalMuscleMass: null, bodyType: null
      },
      { 
        date: new Date('2025-07-21'), time: '5:00:26 AM', weight: 168.6, bodyFat: 15.2, 
        fatFreeMass: 143.0, muscleMass: 136.0, bmi: 27.2, subcutaneousFat: 12.5, 
        skeletalMuscle: 54.8, bodyWater: 61.2, visceralFat: 10, boneMass: 7.0, 
        protein: 19.3, bmr: 1756, metabolicAge: 31, remarks: '--',
        optimalWeight: null, targetToOptimalWeight: null, targetToOptimalFatMass: null, 
        targetToOptimalMuscleMass: null, bodyType: null
      },
      { 
        date: new Date('2025-06-25'), time: '8:27:38 AM', weight: 164.6, bodyFat: 14.7, 
        fatFreeMass: 140.4, muscleMass: 133.4, bmi: 26.6, subcutaneousFat: 12.2, 
        skeletalMuscle: 55.1, bodyWater: 61.6, visceralFat: 9, boneMass: 7.0, 
        protein: 19.4, bmr: 1756, metabolicAge: 31, remarks: '--',
        optimalWeight: null, targetToOptimalWeight: null, targetToOptimalFatMass: null, 
        targetToOptimalMuscleMass: null, bodyType: null
      },
      { 
        date: new Date('2025-05-27'), time: '7:06:45 AM', weight: 173.8, bodyFat: 15.9, 
        fatFreeMass: 146.2, muscleMass: 138.8, bmi: 28.1, subcutaneousFat: 13.0, 
        skeletalMuscle: 54.3, bodyWater: 60.7, visceralFat: 11, boneMass: 7.2, 
        protein: 19.2, bmr: 1799, metabolicAge: 32, remarks: '--',
        optimalWeight: null, targetToOptimalWeight: null, targetToOptimalFatMass: null, 
        targetToOptimalMuscleMass: null, bodyType: null
      },
      { 
        date: new Date('2025-04-29'), time: '7:21:07 AM', weight: 179.6, bodyFat: 15.9, 
        fatFreeMass: 151.2, muscleMass: 143.6, bmi: 28.1, subcutaneousFat: 13.0, 
        skeletalMuscle: 54.3, bodyWater: 60.7, visceralFat: 11, boneMass: 7.6, 
        protein: 19.2, bmr: 1846, metabolicAge: 32, remarks: '--',
        optimalWeight: null, targetToOptimalWeight: null, targetToOptimalFatMass: null, 
        targetToOptimalMuscleMass: null, bodyType: null
      },
    ];

    weightSampleData.forEach(entry => {
      const id = randomUUID();
      const fullEntry: WeightEntry = {
        ...entry,
        id,
        createdAt: new Date(),
      };
      this.weightEntries.set(id, fullEntry);
    });
  }

  private seedBloodData() {
    // August 2025 Lab Results (from Rhythm Health CSV)
    const aug2025Id = randomUUID();
    const aug2025Entry: BloodEntry = {
      id: aug2025Id,
      asOf: new Date("2025-08-16"),
      source: "rhythm_health_csv",
      
      // Hormone Balance
      totalTestosterone: 390,
      totalTestosteroneUnit: "ng/dL",
      freeTestosterone: 84.42,
      freeTestosteroneUnit: "pg/mL",
      shbg: 27.4,
      shbgUnit: "nmol/L",
      estradiol: null,
      estradiolUnit: "pg/mL",
      estrogensTotal: 16,
      estrogensTotalUnit: "pg/mL",
      dheasulfate: null,
      dheasulfateUnit: "ug/dL",
      cortisolAm: null,
      cortisolAmUnit: "ug/dL",
      psa: null,
      psaUnit: "ng/mL",
      testosteroneEstrogenRatio: 1.6, // Triglycerides/HDL Ratio from CSV
      
      // Thyroid
      tsh: 3.0,
      tshUnit: "uIU/mL",
      freeT3: 3.27,
      freeT3Unit: "pg/mL",
      freeT4: null,
      freeT4Unit: "ng/dL",
      tpoAb: null,
      tpoAbUnit: "IU/mL",
      
      // Vitamin/Inflammation/Glucose
      vitaminD25oh: 62,
      vitaminD25ohUnit: "ng/mL",
      crpHs: 0.5,
      crpHsUnit: "mg/L",
      insulin: null,
      insulinUnit: "uIU/mL",
      hba1c: null,
      hba1cUnit: "%",
      
      // Lipids
      cholesterolTotal: null,
      cholesterolTotalUnit: "mg/dL",
      triglycerides: 88,
      triglyceridesUnit: "mg/dL",
      hdl: 55,
      hdlUnit: "mg/dL",
      ldlCalc: 123.4,
      ldlCalcUnit: "mg/dL",
      ldlCalcFlag: null,
      vldlCalc: null,
      vldlCalcUnit: "mg/dL",
      apob: 101,
      apobUnit: "mg/dL",
      apobFlag: "high",
      ldlApobRatio: 1.22,
      tgHdlRatio: 1.6,
      
      // Proteins/Misc
      albumin: 4.6,
      albuminUnit: "g/dL",
      ferritin: 262,
      ferritinUnit: "ng/mL",
      
      createdAt: new Date(),
    };
    this.bloodEntries.set(aug2025Id, aug2025Entry);
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
      weight: 0,
      reps: 0,
      notes: "",
      duration: "",
      distance: "",
      pace: "",
      calories: 0,
      rpe: 0,
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

  async createWorkoutLog(insertLog: InsertWorkoutLog): Promise<WorkoutLog> {
    const id = randomUUID();
    const log: WorkoutLog = {
      ...insertLog,
      id,
      completedAt: new Date(),
    };
    this.workoutLogs.set(id, log);
    return log;
  }

  async getLatestWorkoutLog(): Promise<WorkoutLog | undefined> {
    const logs = Array.from(this.workoutLogs.values())
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    return logs[0];
  }

  async getAllWorkoutLogs(): Promise<WorkoutLog[]> {
    return Array.from(this.workoutLogs.values())
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  }

  async createWeightEntry(insertEntry: InsertWeightEntry): Promise<WeightEntry> {
    const id = randomUUID();
    const entry: WeightEntry = {
      ...insertEntry,
      id,
      createdAt: new Date(),
    };
    this.weightEntries.set(id, entry);
    return entry;
  }

  async updateWeightEntry(id: string, updateEntry: UpdateWeightEntry): Promise<WeightEntry | undefined> {
    const existing = this.weightEntries.get(id);
    if (!existing) {
      return undefined;
    }
    
    const updated: WeightEntry = {
      ...existing,
      ...updateEntry,
    };
    this.weightEntries.set(id, updated);
    return updated;
  }

  async deleteWeightEntry(id: string): Promise<boolean> {
    return this.weightEntries.delete(id);
  }

  async getAllWeightEntries(): Promise<WeightEntry[]> {
    return Array.from(this.weightEntries.values())
      .sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });
  }

  async getWeightEntriesInDateRange(startDate: Date, endDate: Date): Promise<WeightEntry[]> {
    return Array.from(this.weightEntries.values())
      .filter(entry => {
        const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
        return entryDate >= startDate && entryDate <= endDate;
      })
      .sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });
  }

  // Blood Entry Methods
  async createBloodEntry(entry: InsertBloodEntry): Promise<BloodEntry> {
    const id = randomUUID();
    const now = new Date();
    const bloodEntry: BloodEntry = {
      id,
      ...entry,
      createdAt: now,
    };
    this.bloodEntries.set(id, bloodEntry);
    return bloodEntry;
  }

  async updateBloodEntry(id: string, updateEntry: UpdateBloodEntry): Promise<BloodEntry | undefined> {
    const existing = this.bloodEntries.get(id);
    if (!existing) {
      return undefined;
    }
    
    const updated: BloodEntry = {
      ...existing,
      ...updateEntry,
    };
    this.bloodEntries.set(id, updated);
    return updated;
  }

  async deleteBloodEntry(id: string): Promise<boolean> {
    return this.bloodEntries.delete(id);
  }

  async getAllBloodEntries(): Promise<BloodEntry[]> {
    return Array.from(this.bloodEntries.values())
      .sort((a, b) => {
        const dateA = a.asOf instanceof Date ? a.asOf : new Date(a.asOf);
        const dateB = b.asOf instanceof Date ? b.asOf : new Date(b.asOf);
        return dateA.getTime() - dateB.getTime();
      });
  }
}

export const storage = new MemStorage();
