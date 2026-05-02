import Dexie, { type EntityTable } from 'dexie';
import type {
  MuscleGroup,
  Exercise,
  WorkoutPreset,
  WorkoutSession,
  LatestLog,
  PRRecord,
  AppSettings,
} from '../types/workout';

// ─── Database Schema ──────────────────────────────────────
class GymTrackerDB extends Dexie {
  muscleGroups!: EntityTable<MuscleGroup, 'id'>;
  exercises!: EntityTable<Exercise, 'id'>;
  workoutPresets!: EntityTable<WorkoutPreset, 'id'>;
  workoutHistory!: EntityTable<WorkoutSession, 'id'>;
  latestLogs!: EntityTable<LatestLog, 'exerciseId'>;
  prRecords!: EntityTable<PRRecord, 'id'>;
  settings!: EntityTable<AppSettings & { id: string }, 'id'>;

  constructor() {
    super('GymTrackerPro');
    this.version(1).stores({
      muscleGroups: 'id, name',
      exercises: 'id, name, muscleGroupId',
      workoutPresets: 'id, name',
      workoutHistory: 'id, name, date, sessionLabel, createdAt',
      latestLogs: 'exerciseId',
      prRecords: 'id, exerciseId, type, sessionId',
      settings: 'id',
    });
  }
}

export const db = new GymTrackerDB();
