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
  sortOrder?: number;
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
  notes?: string; // AI Context or User Notes
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

// ============================================
// Phase 1: Trainer-Trainee System Types
// ============================================

export type UserRole = 'user' | 'trainer' | 'owner';
export type TraineeStatus = 'active' | 'pending' | 'removed';
export type PlanDifficulty = 'beginner' | 'intermediate' | 'advanced';

// Extended UserProfile with trainer/gym fields
export interface ExtendedUserProfile extends UserProfile {
  id?: string;
  userId?: string;
  role: UserRole;
  trainerId?: string; // If this user has a trainer
  gymId?: string;
  isProfilePublic: boolean;
  displayName?: string;
  avatarUrl?: string;
}

// Trainee as seen by a Trainer
export interface Trainee {
  id: string; // relationship id
  traineeId: string; // user id
  trainerId: string;
  status: TraineeStatus;
  notes?: string;
  createdAt: string;
  // Joined data
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  // Stats
  lastWorkoutDate?: string;
  weeklyWorkouts?: number;
  currentStreak?: number;
  totalVolume?: number;
}

// Workout Plan Template
export interface WorkoutPlan {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  gymId?: string;
  isCommon: boolean; // gym-wide template
  isPublic: boolean;
  difficulty: PlanDifficulty;
  durationWeeks: number;
  daysPerWeek: number;
  exercises: PlanExercise[];
  tags: string[];
  createdAt: string;
  updatedAt?: string;
}

// Exercise within a Plan
export interface PlanExercise {
  id: string;
  name: string;
  muscleGroup: string;
  targetSets: number;
  targetReps: number;
  restSeconds?: number;
  notes?: string;
  trackingType?: TrackingType;
  dayIndex?: number; // which day of the week (0-6)
}

// Assigned Plan (linking user to a plan)
export interface AssignedPlan {
  id: string;
  userId: string;
  planId: string;
  assignedBy: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  // Joined data
  plan?: WorkoutPlan;
  assignerName?: string;
}

// Trainer Invite Code
export interface TrainerInvite {
  id: string;
  trainerId: string;
  code: string;
  description?: string;
  expiresAt?: string;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}

// Trainer Stats (for dashboard)
export interface TrainerStats {
  totalTrainees: number;
  activeTrainees: number;
  inactiveTrainees: number; // no workout in 3+ days
  totalPlansCreated: number;
  plansAssignedThisWeek: number;
}

// Activity Log Entry
export interface TrainerActivityLog {
  id: string;
  trainerId: string;
  traineeId?: string;
  action: 'assigned_plan' | 'logged_workout' | 'sent_message' | 'added_trainee' | 'removed_trainee';
  details?: Record<string, any>;
  createdAt: string;
}