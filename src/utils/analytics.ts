import type { WorkoutSession, MuscleGroup, Exercise } from '../types/workout';
import { estimate1RM, setVolume } from './fitness';

// ─── Chart Data Types ─────────────────────────────────────
export interface PerformanceTrendPoint {
  session: string;
  date: string;
  totalVolume: number;
  totalSets: number;
  avgWeight: number;
}

export interface MuscleProgressPoint {
  session: string;
  [muscleGroup: string]: number | string;
}

export interface ExerciseProgressPoint {
  session: string;
  maxWeight: number;
  maxReps: number;
  volume: number;
  estimated1RM: number;
}

export interface VolumeByMuscle {
  name: string;
  volume: number;
  color: string;
}

export interface BestSetPoint {
  session: string;
  weight: number;
  reps: number;
}

export interface CardioProgressPoint {
  session: string;
  date: string;
  distance: number;
  time: number;
}

// 1. Overall performance trend
export function computePerformanceTrend(sessions: WorkoutSession[]): PerformanceTrendPoint[] {
  return sessions.map(s => {
    const allSets = s.exercises.flatMap(e => e.sets);
    const totalVolume = allSets.reduce((sum, set) => sum + setVolume(set), 0);
    const weights = allSets.filter(set => (set.weight ?? 0) > 0).map(set => set.weight!);
    const avgWeight = weights.length ? weights.reduce((a, b) => a + b, 0) / weights.length : 0;
    return {
      session: s.sessionLabel,
      date: s.date ?? s.sessionLabel,
      totalVolume: Math.round(totalVolume),
      totalSets: allSets.length,
      avgWeight: Math.round(avgWeight * 10) / 10,
    };
  });
}

// 2. Muscle group progress (volume per muscle per session)
export function computeMuscleProgress(
  sessions: WorkoutSession[],
  exercises: Exercise[],
  muscleGroups: MuscleGroup[]
): MuscleProgressPoint[] {
  const exerciseMuscleMap = new Map(exercises.map(e => [e.id, e.muscleGroupId]));

  return sessions.map(s => {
    const point: MuscleProgressPoint = { session: s.sessionLabel };
    for (const mg of muscleGroups) {
      point[mg.name] = 0;
    }
    for (const log of s.exercises) {
      const mgId = exerciseMuscleMap.get(log.exerciseId);
      const mg = muscleGroups.find(m => m.id === mgId);
      if (mg) {
        const vol = log.sets.reduce((sum, set) => sum + setVolume(set), 0);
        point[mg.name] = (point[mg.name] as number) + Math.round(vol);
      }
    }
    return point;
  });
}

// 3. Exercise-specific progress
export function computeExerciseProgress(
  sessions: WorkoutSession[],
  exerciseId: string
): ExerciseProgressPoint[] {
  const points: ExerciseProgressPoint[] = [];

  for (const session of sessions) {
    const log = session.exercises.find(e => e.exerciseId === exerciseId);
    if (!log) continue;

    const maxWeight = Math.max(...log.sets.map(s => s.weight ?? 0));
    const maxReps = Math.max(...log.sets.map(s => s.reps ?? 0));
    const volume = log.sets.reduce((sum, s) => sum + setVolume(s), 0);
    const est = Math.max(
      ...log.sets
        .filter(s => (s.weight ?? 0) > 0 && (s.reps ?? 0) > 0)
        .map(s => estimate1RM(s.weight!, s.reps!))
    );

    points.push({
      session: session.sessionLabel,
      maxWeight,
      maxReps,
      volume: Math.round(volume),
      estimated1RM: Math.round((isFinite(est) ? est : 0) * 10) / 10,
    });
  }

  return points;
}

// 5. Volume per muscle group (aggregate)
export function computeVolumeByMuscle(
  sessions: WorkoutSession[],
  exercises: Exercise[],
  muscleGroups: MuscleGroup[]
): VolumeByMuscle[] {
  const exerciseMuscleMap = new Map(exercises.map(e => [e.id, e.muscleGroupId]));
  const volumeMap = new Map<string, number>();

  for (const session of sessions) {
    for (const log of session.exercises) {
      const mgId = exerciseMuscleMap.get(log.exerciseId) ?? 'unknown';
      const vol = log.sets.reduce((sum, s) => sum + setVolume(s), 0);
      volumeMap.set(mgId, (volumeMap.get(mgId) ?? 0) + vol);
    }
  }

  return muscleGroups
    .map(mg => ({
      name: mg.name,
      volume: Math.round(volumeMap.get(mg.id) ?? 0),
      color: mg.color,
    }))
    .filter(v => v.volume > 0);
}

// 6. Best set progression per exercise
export function computeBestSetProgression(
  sessions: WorkoutSession[],
  exerciseId: string
): BestSetPoint[] {
  const points: BestSetPoint[] = [];

  for (const session of sessions) {
    const log = session.exercises.find(e => e.exerciseId === exerciseId);
    if (!log) continue;

    let bestWeight = 0;
    let bestReps = 0;
    for (const set of log.sets) {
      const w = set.weight ?? 0;
      const r = set.reps ?? 0;
      if (w * r > bestWeight * bestReps) {
        bestWeight = w;
        bestReps = r;
      }
    }

    if (bestWeight > 0) {
      points.push({
        session: session.sessionLabel,
        weight: bestWeight,
        reps: bestReps,
      });
    }
  }

  return points;
}

// 7. Cardio Progress Trend (filters out sessions with no cardio data)
export function computeCardioProgress(
  sessions: WorkoutSession[],
  exercises: Exercise[]
): CardioProgressPoint[] {
  const cardioExerciseIds = new Set(
    exercises.filter(e => e.category === 'cardio').map(e => e.id)
  );

  const points: CardioProgressPoint[] = [];

  for (const session of sessions) {
    let totalDistance = 0;
    let totalTime = 0;

    for (const log of session.exercises) {
      if (!cardioExerciseIds.has(log.exerciseId)) continue;
      for (const set of log.sets) {
        totalDistance += (set.distance ?? 0);
        totalTime += (set.time ?? 0);
      }
    }

    // Only include sessions that actually had cardio
    if (totalDistance > 0 || totalTime > 0) {
      points.push({
        session: session.sessionLabel,
        date: session.date ?? session.sessionLabel,
        distance: Math.round(totalDistance * 10) / 10,
        time: Math.round(totalTime),
      });
    }
  }

  return points;
}
