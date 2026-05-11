import type { WorkoutSet } from '../types/workout';

// ─── Shared Utility Functions ─────────────────────────────

/**
 * Estimate 1-Rep Max using the Brzycki formula.
 * Capped at 36 reps to prevent division-by-zero/negative results.
 */
export function estimate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  // Brzycki formula is only accurate for reps <= ~12, and mathematically
  // breaks at reps >= 37 (division by zero). Cap at 36 for safety.
  const clampedReps = Math.min(reps, 36);
  return weight * (36 / (37 - clampedReps));
}

/**
 * Calculate total volume for a single set, including drop set volume.
 */
export function setVolume(set: WorkoutSet): number {
  const w = set.weight ?? 0;
  const r = set.reps ?? 0;
  let vol = w * r;
  if (set.drops) {
    for (const d of set.drops) {
      vol += (d.weight ?? 0) * (d.reps ?? 0);
    }
  }
  return vol;
}
