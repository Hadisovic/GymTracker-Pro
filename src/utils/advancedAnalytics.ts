import type { WorkoutSession, Exercise, MuscleGroup } from '../types/workout';
import { setVolume } from './fitness';

// ─── Sports Science Hypertrophy Landmarks (Mike Israetel / RP) ───
export interface HypertrophyLandmark {
  muscleGroupId: string;
  muscleGroupName: string;
  completedSets: number;
  mev: number; // Minimum Effective Volume
  mrv: number; // Maximum Recoverable Volume
  mavMin: number; // Max Adaptive Volume min
  mavMax: number; // Max Adaptive Volume max
  status: 'under' | 'mev' | 'mav' | 'mrv' | 'over';
}

// ─── ACWR Daily Point ───
export interface ACWRPoint {
  date: string; // YYYY-MM-DD
  acuteLoad: number;
  chronicLoad: number;
  acwr: number; // Acute-to-Chronic Workload Ratio
  status: 'sweet' | 'danger_low' | 'danger_high';
}

// ─── Cardio Advanced Point ───
export interface AdvancedCardioPoint {
  sessionLabel: string;
  date: string;
  distance: number;
  time: number; // minutes
  speedKmh: number; // km/h
  paceMinKm: number; // decimal minutes per km
  paceFormatted: string; // MM:SS format
}

// Helper to get Monday-based week identifier: "Week of YYYY-MM-DD"
export function getStartOfWeekDate(dateInput: string | Date): string {
  const date = new Date(dateInput);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(date.setDate(diff));
  return monday.toISOString().split('T')[0];
}

/**
 * 1. Weekly Overload Chart Pipeline
 * Aggregates completed volume tonnage and total completed sets per UTC calendar week.
 */
export function computeWeeklyOverload(
  sessions: WorkoutSession[],
  exercises: Exercise[]
): { week: string; tonnage: number; sets: number }[] {
  const weekMap = new Map<string, { tonnage: number; sets: number }>();
  const strengthExerciseIds = new Set(
    exercises.filter(e => e.category !== 'cardio').map(e => e.id)
  );

  // Sort sessions chronological first
  const sortedSessions = [...sessions].sort((a, b) => {
    if (!a.date || !b.date) return 0;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  for (const session of sortedSessions) {
    if (!session.date) continue;
    const weekKey = `Week of ${getStartOfWeekDate(session.date)}`;

    let sessionTonnage = 0;
    let sessionSets = 0;

    for (const exLog of session.exercises) {
      if (!strengthExerciseIds.has(exLog.exerciseId)) continue;
      for (const set of exLog.sets) {
        if (!set.completed) continue;
        sessionTonnage += setVolume(set);
        sessionSets += 1;
      }
    }

    const current = weekMap.get(weekKey) || { tonnage: 0, sets: 0 };
    weekMap.set(weekKey, {
      tonnage: current.tonnage + Math.round(sessionTonnage),
      sets: current.sets + sessionSets,
    });
  }

  return Array.from(weekMap.entries()).map(([week, data]) => ({
    week,
    tonnage: data.tonnage,
    sets: data.sets,
  }));
}

/**
 * 2. Renaissance Periodization (RP) Volume Landmarks (MEV, MAV, MRV)
 * Calculates working sets completed per muscle group over the last 7 days and compares to landmarks.
 */
const RP_LANDMARKS: Record<string, { mev: number; mavMin: number; mavMax: number; mrv: number }> = {
  chest: { mev: 10, mavMin: 12, mavMax: 20, mrv: 22 },
  back: { mev: 10, mavMin: 12, mavMax: 22, mrv: 25 },
  shoulders: { mev: 8, mavMin: 10, mavMax: 18, mrv: 20 },
  biceps: { mev: 8, mavMin: 10, mavMax: 18, mrv: 20 },
  triceps: { mev: 6, mavMin: 8, mavMax: 14, mrv: 16 },
  legs: { mev: 10, mavMin: 12, mavMax: 20, mrv: 22 },
  forearms: { mev: 4, mavMin: 6, mavMax: 10, mrv: 12 },
  abs: { mev: 4, mavMin: 6, mavMax: 10, mrv: 12 },
};

export function computeHypertrophyLandmarks(
  sessions: WorkoutSession[],
  exercises: Exercise[],
  muscleGroups: MuscleGroup[],
  targetDate: Date = new Date()
): HypertrophyLandmark[] {
  // Filter history to within the last 7 days
  const cutoffDate = new Date(targetDate);
  cutoffDate.setDate(cutoffDate.getDate() - 7);

  const recentSessions = sessions.filter(session => {
    if (!session.date) return false;
    const sessionTime = new Date(session.date).getTime();
    return sessionTime >= cutoffDate.getTime() && sessionTime <= targetDate.getTime();
  });

  const muscleSetCounts: Record<string, number> = {};
  muscleGroups.forEach(mg => {
    muscleSetCounts[mg.id] = 0;
  });

  for (const session of recentSessions) {
    for (const exLog of session.exercises) {
      const baseEx = exercises.find(e => e.id === exLog.exerciseId);
      if (!baseEx || baseEx.category === 'cardio') continue;
      const mgId = baseEx.muscleGroupId;

      // Count completed sets
      const completedSets = exLog.sets.filter(s => s.completed).length;
      if (muscleSetCounts[mgId] !== undefined) {
        muscleSetCounts[mgId] += completedSets;
      }
    }
  }

  return muscleGroups
    .filter(mg => mg.id !== 'cardio') // Filter out cardio
    .map(mg => {
      const sets = muscleSetCounts[mg.id] || 0;
      const landmark = RP_LANDMARKS[mg.id] || { mev: 8, mavMin: 10, mavMax: 16, mrv: 20 };
      
      let status: HypertrophyLandmark['status'] = 'under';
      if (sets >= landmark.mrv) {
        status = sets > landmark.mrv ? 'over' : 'mrv';
      } else if (sets >= landmark.mavMin) {
        status = 'mav';
      } else if (sets >= landmark.mev) {
        status = 'mev';
      }

      return {
        muscleGroupId: mg.id,
        muscleGroupName: mg.name,
        completedSets: sets,
        mev: landmark.mev,
        mrv: landmark.mrv,
        mavMin: landmark.mavMin,
        mavMax: landmark.mavMax,
        status,
      };
    });
}

/**
 * 3. Acute-to-Chronic Workload Ratio (ACWR)
 * Standard athletic safety metric to prevent spikes in training workload volume.
 * Acute (fatigue) = Total volume over the last 7 days.
 * Chronic (fitness) = Average weekly volume over the last 28 days.
 * ACWR = Acute / (Chronic / 4)  [Normalised to 1.0 baseline]
 */
export function computeACWRTrend(
  sessions: WorkoutSession[],
  targetDate: Date = new Date(),
  daysToTrend: number = 14
): ACWRPoint[] {
  const points: ACWRPoint[] = [];

  // Helper to calculate workload on a specific date for a sliding window of N days
  const getVolumeWindow = (refDate: Date, windowDays: number): number => {
    const end = refDate.getTime();
    const start = refDate.getTime() - windowDays * 24 * 60 * 60 * 1000;
    
    let totalVol = 0;
    for (const session of sessions) {
      if (!session.date) continue;
      const sTime = new Date(session.date).getTime();
      if (sTime > start && sTime <= end) {
        for (const exLog of session.exercises) {
          for (const set of exLog.sets) {
            if (set.completed) {
              totalVol += setVolume(set);
            }
          }
        }
      }
    }
    return totalVol;
  };

  // Generate data points for each of the last days leading up to targetDate
  for (let i = daysToTrend - 1; i >= 0; i--) {
    const currentDate = new Date(targetDate.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = currentDate.toISOString().split('T')[0];

    const acuteLoad = getVolumeWindow(currentDate, 7);
    const chronicLoad28 = getVolumeWindow(currentDate, 28);
    
    // Normalise chronic load to a weekly average
    const chronicWeeklyAverage = chronicLoad28 / 4;
    
    let acwr = 1.0;
    if (chronicWeeklyAverage > 0) {
      acwr = acuteLoad / chronicWeeklyAverage;
    } else if (acuteLoad > 0) {
      acwr = 1.5; // High stress if sudden spike from zero
    } else {
      acwr = 0.0;
    }

    // Normalise decimals
    acwr = Math.round(acwr * 100) / 100;

    let status: ACWRPoint['status'] = 'sweet';
    if (acwr > 1.5) {
      status = 'danger_high';
    } else if (acwr < 0.8 && acwr > 0) {
      status = 'danger_low';
    }

    points.push({
      date: dateStr,
      acuteLoad: Math.round(acuteLoad),
      chronicLoad: Math.round(chronicWeeklyAverage),
      acwr,
      status,
    });
  }

  return points;
}

/**
 * 4. Advanced Cardio Pace Tracking
 * Segregates and computes speed, decimal pace, and format pace (MM:SS) for cardio sessions.
 */
export function computeAdvancedCardioTrend(
  sessions: WorkoutSession[],
  exercises: Exercise[]
): AdvancedCardioPoint[] {
  const cardioExerciseIds = new Set(
    exercises.filter(e => e.category === 'cardio').map(e => e.id)
  );

  const points: AdvancedCardioPoint[] = [];

  // Sort sessions chronologically
  const sortedSessions = [...sessions].sort((a, b) => {
    if (!a.date || !b.date) return 0;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  for (const session of sortedSessions) {
    let sessionDistance = 0;
    let sessionTime = 0; // minutes

    for (const log of session.exercises) {
      if (!cardioExerciseIds.has(log.exerciseId)) continue;
      for (const set of log.sets) {
        if (!set.completed) continue;
        sessionDistance += (set.distance ?? 0);
        sessionTime += (set.time ?? 0);
      }
    }

    if (sessionDistance > 0 && sessionTime > 0) {
      const speedKmh = (sessionDistance / (sessionTime / 60));
      const paceMinKm = sessionTime / sessionDistance;
      
      const paceMins = Math.floor(paceMinKm);
      const paceSecs = Math.round((paceMinKm - paceMins) * 60);
      const paceFormatted = `${paceMins}:${paceSecs < 10 ? '0' : ''}${paceSecs}`;

      points.push({
        sessionLabel: session.sessionLabel,
        date: session.date ?? session.sessionLabel,
        distance: Math.round(sessionDistance * 100) / 100,
        time: Math.round(sessionTime * 10) / 10,
        speedKmh: Math.round(speedKmh * 100) / 100,
        paceMinKm: Math.round(paceMinKm * 100) / 100,
        paceFormatted,
      });
    }
  }

  return points;
}
