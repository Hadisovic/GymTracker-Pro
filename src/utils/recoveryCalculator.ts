import type { WorkoutSession, Exercise } from '../types/workout';

export interface MuscleRecoveryState {
  muscleGroupId: string;
  mrs: number; // 0 to 100
  aml: number; // raw load volume in kg*reps
  color: string; // HSL color string
  glowClass: string; // Tailwind glow dropshadow
}

// 7-day half-life decay helper (2.5 days half-life for fatigue decay)
const FATIGUE_HALF_LIFE_DAYS = 2.5;
const DECAY_CONSTANT = Math.log(2) / FATIGUE_HALF_LIFE_DAYS; // ~0.277

// Baseline Maximum Capacity per muscle group in kg*reps (calibrated for standard lifter)
const DEFAULT_CAPACITIES: Record<string, number> = {
  chest: 8000,
  back: 9000,
  shoulders: 7000,
  biceps: 4500,
  triceps: 4500,
  legs: 15000,
  forearms: 3000,
  abs: 2000,
  cardio: 1000,
};

/**
 * Calculates recovery percentages and load metrics for a given muscle group.
 * Follows an exponential decay curve to decay workload fatigue over 7 days.
 */
export function calculateMuscleRecovery(
  history: WorkoutSession[],
  exercises: Exercise[],
  muscleGroupId: string,
  targetDate: Date = new Date()
): MuscleRecoveryState {
  const cutoffDate = new Date(targetDate);
  cutoffDate.setDate(cutoffDate.getDate() - 7); // 7-day sliding window

  let totalDecayedLoad = 0;

  // Filter history to within the last 7 days
  const recentSessions = history.filter(session => {
    if (!session.date) return false;
    const sessionTime = new Date(session.date).getTime();
    return sessionTime >= cutoffDate.getTime() && sessionTime <= targetDate.getTime();
  });

  for (const session of recentSessions) {
    if (!session.date) continue;
    
    // Calculate days elapsed since this session
    const elapsedMs = targetDate.getTime() - new Date(session.date).getTime();
    const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);

    let sessionMuscleVolume = 0;

    for (const exLog of session.exercises) {
      // Find the base exercise definition to check its muscle group
      const baseEx = exercises.find(e => e.id === exLog.exerciseId);
      if (baseEx?.muscleGroupId !== muscleGroupId) continue;

      for (const set of exLog.sets) {
        if (!set.completed) continue;
        const weight = set.weight ?? 0;
        const reps = set.reps ?? 0;
        
        // Handle cardio or bodyweight approximations
        if (baseEx.category === 'cardio') {
          sessionMuscleVolume += (set.time ?? 0) * 100; // 1 min cardio = 100 volume units
        } else if (weight === 0 && reps > 0) {
          sessionMuscleVolume += 75 * reps; // Assume 75kg default for bodyweight
        } else {
          sessionMuscleVolume += weight * reps;
        }
      }
    }

    // Apply exponential decay: V * e^(-lambda * delta_t)
    const decayedVolume = sessionMuscleVolume * Math.exp(-DECAY_CONSTANT * elapsedDays);
    totalDecayedLoad += decayedVolume;
  }

  // Calculate Muscle Recovery Score
  const capacity = DEFAULT_CAPACITIES[muscleGroupId] || 5000;
  const aml = Math.round(totalDecayedLoad);
  
  // Calculate raw score (100 is fully recovered, 0 is fully fatigued)
  const rawScore = Math.max(0, 100 - (aml / capacity) * 100);
  const mrs = Math.round(rawScore);

  // Dynamic HSL interpolation
  let color = 'hsl(215, 25%, 27%)'; // Fresh/Default cool slate
  let glowClass = 'shadow-none';

  if (mrs < 100) {
    if (mrs >= 70) {
      // Light Fatigue: Slate to Golden Muted Yellow
      const ratio = (mrs - 70) / 30; // 0 to 1
      const h = Math.round(48 + ratio * (215 - 48));
      const s = Math.round(80 + ratio * (25 - 80));
      const l = Math.round(45 + ratio * (27 - 45));
      color = `hsl(${h}, ${s}%, ${l}%)`;
      glowClass = 'drop-shadow-[0_0_4px_rgba(234,179,8,0.3)]';
    } else if (mrs >= 40) {
      // Moderate Fatigue: Yellow (48) to Orange (24)
      const ratio = (mrs - 40) / 30; // 0 to 1
      const h = Math.round(24 + ratio * (48 - 24));
      const s = Math.round(90 + ratio * (80 - 90));
      const l = Math.round(50 + ratio * (45 - 50));
      color = `hsl(${h}, ${s}%, ${l}%)`;
      glowClass = 'drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]';
    } else {
      // Severe Fatigue: Orange (24) to Deep Crimson (346)
      const ratio = mrs / 40; // 0 to 1
      const h = Math.round(346 + ratio * (24 - 346));
      const s = Math.round(84 + ratio * (90 - 84));
      const l = Math.round(48 + ratio * (50 - 48));
      color = `hsl(${h}, ${s}%, ${l}%)`;
      glowClass = 'drop-shadow-[0_0_12px_rgba(244,63,94,0.7)]';
    }
  }

  return { muscleGroupId, mrs, aml, color, glowClass };
}
