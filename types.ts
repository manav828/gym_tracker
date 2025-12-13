// Domain Models

export type TrackingType = 'reps_weight' | 'reps_only' | 'duration' | 'distance_duration';

export interface Set {
  id: string;
  reps: number;
  weight: number;
  distance?: number; // km
  duration?: number; // minutes (for cardio/plank logs)
  completed: boolean;
  rpe?: number; // Rate of Perceived Exertion (1-10)
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  videoUrl?: string;
  notes?: string;
  defaultSets: number;
  defaultReps: number;
  trackingType?: TrackingType;
}

export interface RoutineExercise extends Exercise {
  // Routine specific overrides
  targetSets?: number;
  targetReps?: number;
}

export interface Routine {
  id: string;
  name: string; // e.g., "Chest & Triceps"
  dayLabel?: string; // e.g., "Day 1" or "Monday"
  exercises: RoutineExercise[];
  lastPerformed?: number; // timestamp
}

export interface CompletedExercise {
  exerciseId: string;
  name: string;
  sets: Set[];
  notes?: string;
  trackingType?: TrackingType;
}

export interface WorkoutSession {
  id: string;
  routineId: string;
  routineName: string;
  startTime: number;
  endTime?: number;
  durationSeconds: number;
  exercises: CompletedExercise[];
  totalVolume: number;
  date: string; // ISO Date string YYYY-MM-DD
  bodyWeight?: number; // User's bodyweight at time of workout
  // New fields for timer pause logic
  totalPausedDuration?: number; // accumulated pause time in seconds
  lastPausedTime?: number; // timestamp when last paused, null if running
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  unit: 'kg' | 'lb';
  defaultRestTimer: number; // seconds
}

export interface UserProfile {
  goal: 'hypertrophy' | 'strength' | 'endurance' | 'weight_loss' | 'general';
  targetWeight?: number;
  height?: number;
  // Nutrition Goals
  calorieGoal?: number;
  proteinGoal?: number;
  carbsGoal?: number;
  fatsGoal?: number;
  waterGoal?: number;
  email?: string;
}

export interface BodyWeightLog {
  id: string;
  date: string;
  weight: number;
}

// --- Nutrition Types ---

export interface FoodItem {
  id?: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servingSize: string; // e.g. "100g", "1 cup", "1 slice"
  isCustom?: boolean;
}

export interface FoodLog {
  id: string;
  date: string;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  quantity: number; // multiplier of base serving
  unit: string;
}

export interface WaterLog {
  id: string;
  date: string;
  amount: number; // ml
}

// For Gemini Generation
export interface GeneratedRoutine {
  name: string;
  exercises: {
    name: string;
    muscleGroup: string;
    sets: number;
    reps: number;
    notes?: string;
  }[];
}