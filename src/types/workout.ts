// ─── Weight & Unit Types ──────────────────────────────────
export type WeightMode = 'each_side' | 'full_stack' | 'machine' | 'bodyweight' | 'dumbbell';
export type WeightUnit = 'kg' | 'lbs';

// ─── Drop Set ─────────────────────────────────────────────
export interface DropEntry {
  weight: number;
  reps: number | null;
  toFailure?: boolean;
  unit?: WeightUnit;
}

// ─── Single Set ───────────────────────────────────────────
export interface WorkoutSet {
  id: string;
  setNumber: number;
  weight: number | null;
  reps: number | null;          // supports partial reps like 10.5
  unit: WeightUnit;
  weightMode: WeightMode;
  notes?: string;
  isDropSet?: boolean;
  drops?: DropEntry[];
  assistedReps?: number;
  restPause?: boolean;
  toFailure?: boolean;
  time?: number;        // minutes
  distance?: number;    // km or miles
  speed?: number;       // km/h or mph
  incline?: number;     // level
  timestamp?: string;
}

// ─── Exercise Definition ──────────────────────────────────
export interface Exercise {
  id: string;
  name: string;
  aliases?: string[];           // alternate names that map to same exercise
  muscleGroupId: string;
  equipment?: string;
  notes?: string;
  category?: 'strength' | 'cardio';
  defaultUnit?: WeightUnit;
}

// ─── Muscle Group ─────────────────────────────────────────
export interface MuscleGroup {
  id: string;
  name: string;
  color: string;                // for UI badges/charts
  icon?: string;
}

// ─── Workout Preset ───────────────────────────────────────
export interface WorkoutPreset {
  id: string;
  name: string;
  muscleGroupIds: string[];
  isCustom?: boolean;
}

// ─── Exercise Log (sets for one exercise in one session) ──
export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  sets: WorkoutSet[];
  completed?: boolean;
}

// ─── Workout Session (one gym visit) ──────────────────────
export interface WorkoutSession {
  id: string;
  name: string;
  date: string | null;          // null = user hasn't set a date yet
  sessionLabel: string;         // e.g. "Session 1", "Session 2"
  muscleGroupIds: string[];
  exercises: ExerciseLog[];
  duration?: number;            // minutes
  notes?: string;
  createdAt: string;
}

// ─── Latest Log (per exercise, for reference display) ─────
export interface LatestLog {
  exerciseId: string;
  exerciseName: string;
  sets: WorkoutSet[];
  sessionId: string;
  sessionDate: string | null;
  sessionLabel: string;
}

// ─── PR Record ────────────────────────────────────────────
export type PRType = 'weight' | 'reps' | 'volume' | 'estimated' | 'drop_set';

export interface PRRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  type: PRType;
  value: number;
  weight?: number;
  reps?: number;
  sessionId: string;
  sessionLabel: string;
  date: string | null;
  detectedAt: string;
}

// ─── PR Badge display ─────────────────────────────────────
export interface PRBadge {
  type: PRType;
  label: string;
  value: number;
  isNew?: boolean;
}

// ─── Active Workout State ─────────────────────────────────
export interface ActiveWorkoutState {
  presetId?: string;
  presetName: string;
  muscleGroupIds: string[];
  exerciseIds: string[];
  exerciseLogs: ExerciseLog[];
  startedAt: string;
  currentExerciseId?: string;
}

// ─── App Store State ──────────────────────────────────────
export interface AppState {
  muscleGroups: MuscleGroup[];
  exercises: Exercise[];
  workoutPresets: WorkoutPreset[];
  workoutHistory: WorkoutSession[];
  latestLogs: Record<string, LatestLog>;  // keyed by exerciseId
  prRecords: PRRecord[];
  activeWorkout: ActiveWorkoutState | null;
  isInitialized: boolean;
  settings: AppSettings;
}

export interface AppSettings {
  defaultUnit: WeightUnit;
  theme: 'dark' | 'light';
  aiApiKey?: string;
}
