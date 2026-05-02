import type { WorkoutSession, WorkoutSet, PRRecord, PRBadge, PRType } from '../types/workout';
import { v4 as uuid } from 'uuid';

// Estimate 1RM using Brzycki formula
function estimate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (36 / (37 - reps));
}

// Calculate volume for a set (weight × reps)
function setVolume(set: WorkoutSet): number {
  const w = set.weight ?? 0;
  const r = set.reps ?? 0;
  let vol = w * r;
  // Add drop set volume
  if (set.drops) {
    for (const drop of set.drops) {
      vol += (drop.weight ?? 0) * (drop.reps ?? 0);
    }
  }
  return vol;
}

export interface PRCheckResult {
  badges: PRBadge[];
  newRecords: PRRecord[];
}

export function detectPRs(
  exerciseId: string,
  exerciseName: string,
  currentSets: WorkoutSet[],
  sessionId: string,
  sessionLabel: string,
  sessionDate: string | null,
  existingPRs: PRRecord[]
): PRCheckResult {
  const badges: PRBadge[] = [];
  const newRecords: PRRecord[] = [];

  const exercisePRs = existingPRs.filter(p => p.exerciseId === exerciseId);

  // 1. Heaviest weight
  const maxWeight = Math.max(...currentSets.map(s => s.weight ?? 0));
  const prevMaxWeight = exercisePRs
    .filter(p => p.type === 'weight')
    .reduce((max, p) => Math.max(max, p.value), 0);

  if (maxWeight > 0 && maxWeight > prevMaxWeight) {
    badges.push({ type: 'weight', label: 'New PR', value: maxWeight, isNew: true });
    newRecords.push(makePR(exerciseId, exerciseName, 'weight', maxWeight, sessionId, sessionLabel, sessionDate, maxWeight));
  } else if (maxWeight > 0 && maxWeight === prevMaxWeight) {
    badges.push({ type: 'weight', label: 'Matched Peak', value: maxWeight });
  }

  // 2. Most reps at same weight (for each unique weight)
  const weightRepsMap = new Map<number, number>();
  for (const s of currentSets) {
    if (s.weight && s.reps) {
      const key = s.weight;
      weightRepsMap.set(key, Math.max(weightRepsMap.get(key) ?? 0, s.reps));
    }
  }
  const prevRepPRs = exercisePRs.filter(p => p.type === 'reps');
  for (const [weight, reps] of weightRepsMap) {
    const prevBest = prevRepPRs
      .filter(p => p.weight === weight)
      .reduce((max, p) => Math.max(max, p.value), 0);
    if (reps > prevBest && reps > 0) {
      badges.push({ type: 'reps', label: 'Rep PR', value: reps, isNew: true });
      newRecords.push(makePR(exerciseId, exerciseName, 'reps', reps, sessionId, sessionLabel, sessionDate, weight, reps));
    }
  }

  // 3. Best volume (total for this exercise in session)
  const totalVolume = currentSets.reduce((sum, s) => sum + setVolume(s), 0);
  const prevMaxVolume = exercisePRs
    .filter(p => p.type === 'volume')
    .reduce((max, p) => Math.max(max, p.value), 0);
  if (totalVolume > prevMaxVolume && totalVolume > 0) {
    badges.push({ type: 'volume', label: 'Volume PR', value: totalVolume, isNew: true });
    newRecords.push(makePR(exerciseId, exerciseName, 'volume', totalVolume, sessionId, sessionLabel, sessionDate));
  }

  // 4. Best estimated 1RM
  const maxEstimated = Math.max(
    ...currentSets
      .filter(s => (s.weight ?? 0) > 0 && (s.reps ?? 0) > 0)
      .map(s => estimate1RM(s.weight!, s.reps!))
  );
  const prevMaxEstimated = exercisePRs
    .filter(p => p.type === 'estimated')
    .reduce((max, p) => Math.max(max, p.value), 0);
  if (maxEstimated > prevMaxEstimated && isFinite(maxEstimated) && maxEstimated > 0) {
    newRecords.push(makePR(exerciseId, exerciseName, 'estimated', Math.round(maxEstimated * 10) / 10, sessionId, sessionLabel, sessionDate));
  }

  return { badges, newRecords };
}

function makePR(
  exerciseId: string,
  exerciseName: string,
  type: PRType,
  value: number,
  sessionId: string,
  sessionLabel: string,
  date: string | null,
  weight?: number,
  reps?: number
): PRRecord {
  return {
    id: uuid(),
    exerciseId,
    exerciseName,
    type,
    value,
    weight,
    reps,
    sessionId,
    sessionLabel,
    date,
    detectedAt: new Date().toISOString(),
  };
}

// Compute PRs for all existing history (for rebuilding)
export function rebuildAllPRs(sessions: WorkoutSession[]): PRRecord[] {
  const allPRs: PRRecord[] = [];

  for (const session of sessions) {
    for (const log of session.exercises) {
      const result = detectPRs(
        log.exerciseId,
        log.exerciseName,
        log.sets,
        session.id,
        session.sessionLabel,
        session.date,
        allPRs
      );
      allPRs.push(...result.newRecords);
    }
  }

  return allPRs;
}
