import type { WorkoutSession, WorkoutSet, LatestLog } from '../types/workout';
import { v4 as uuid } from 'uuid';

// Helper to create a set
function s(
  num: number,
  weight: number | null,
  reps: number | null,
  unit: 'kg' | 'lbs' = 'lbs',
  weightMode: 'each_side' | 'full_stack' | 'machine' | 'bodyweight' | 'dumbbell' = 'machine',
  opts: Partial<WorkoutSet> = {}
): WorkoutSet {
  return {
    id: uuid(),
    setNumber: num,
    weight,
    reps,
    unit,
    weightMode,
    ...opts,
  };
}

// ─── SESSION 1: First Upper / General Comeback ────────────
const session1: WorkoutSession = {
  id: 'session-1',
  name: 'First Upper / General Comeback',
  date: null,
  sessionLabel: 'Session 1',
  muscleGroupIds: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
  createdAt: new Date(2026, 0, 1).toISOString(),
  exercises: [
    {
      exerciseId: 'incline-db-bench',
      exerciseName: 'Incline DB Bench Press',
      sets: [
        s(1, 10, 8, 'kg', 'dumbbell'),
        s(2, 15, 8, 'kg', 'dumbbell'),
        s(3, 20, 8, 'kg', 'dumbbell'),
      ],
      completed: true,
    },
    {
      exerciseId: 'chest-fly',
      exerciseName: 'Chest Fly',
      sets: [
        s(1, 80, null, 'lbs', 'machine', { notes: 'Reps unknown' }),
        s(2, 80, null, 'lbs', 'machine', { notes: 'Reps unknown' }),
      ],
      completed: true,
    },
    {
      exerciseId: 'wide-lat-pulldown',
      exerciseName: 'Wide Lat Pulldown',
      sets: [
        s(1, 100, 9, 'lbs', 'machine'),
        s(2, 100, 9, 'lbs', 'machine'),
        s(3, 100, 9, 'lbs', 'machine'),
      ],
      completed: true,
    },
    {
      exerciseId: 'cable-row-single',
      exerciseName: 'Cable Row Single Arm',
      sets: [
        s(1, 50, 9, 'kg', 'machine', { notes: 'Each arm' }),
        s(2, 50, 9, 'kg', 'machine', { notes: 'Each arm' }),
      ],
      completed: true,
    },
    {
      exerciseId: 'lateral-raises',
      exerciseName: 'Lateral Raises',
      sets: [
        s(1, 7.5, 12, 'kg', 'dumbbell'),
        s(2, 7.5, 12, 'kg', 'dumbbell'),
        s(3, 7.5, 12, 'kg', 'dumbbell'),
      ],
      completed: true,
    },
    {
      exerciseId: 'shoulder-press',
      exerciseName: 'Shoulder Press Machine',
      sets: [
        s(1, 80, 9, 'lbs', 'machine'),
        s(2, 80, 9, 'lbs', 'machine'),
      ],
      completed: true,
    },
    {
      exerciseId: 'ez-preacher-curl',
      exerciseName: 'EZ Bar Preacher Curl',
      sets: [
        s(1, 15, 10, 'kg', 'machine'),
        s(2, 15, 10, 'kg', 'machine'),
      ],
      completed: true,
    },
    {
      exerciseId: 'hammer-curl',
      exerciseName: 'Hammer Curl',
      sets: [
        s(1, 7.5, 12, 'kg', 'dumbbell'),
        s(2, 7.5, 12, 'kg', 'dumbbell'),
        s(3, 7.5, 12, 'kg', 'dumbbell'),
      ],
      completed: true,
    },
    {
      exerciseId: 'overhead-triceps',
      exerciseName: 'Single Arm Overhead Triceps Cable',
      sets: [
        s(1, 15, 8, 'lbs', 'machine'),
        s(2, 15, 8, 'lbs', 'machine'),
      ],
      completed: true,
    },
    {
      exerciseId: 'triceps-machine',
      exerciseName: 'Triceps Machine',
      sets: [
        s(1, 80, 12, 'lbs', 'machine'),
        s(2, 80, 12, 'lbs', 'machine'),
      ],
      completed: true,
    },
  ],
};

// ─── SESSION 2: Legs ──────────────────────────────────────
const session2: WorkoutSession = {
  id: 'session-2',
  name: 'Legs',
  date: null,
  sessionLabel: 'Session 2',
  muscleGroupIds: ['legs'],
  createdAt: new Date(2026, 0, 3).toISOString(),
  exercises: [
    {
      exerciseId: 'leg-press',
      exerciseName: 'Leg Press',
      sets: [
        s(1, 40, 10, 'kg', 'each_side'),
        s(2, 40, 10, 'kg', 'each_side'),
      ],
      completed: true,
    },
    {
      exerciseId: 'leg-curl',
      exerciseName: 'Leg Curl',
      sets: [
        s(1, 100, 11, 'lbs', 'machine', { notes: '10-12 reps range' }),
        s(2, 100, 11, 'lbs', 'machine', { notes: '10-12 reps range' }),
      ],
      completed: true,
    },
    {
      exerciseId: 'leg-extension',
      exerciseName: 'Leg Extension',
      sets: [
        s(1, 100, 12, 'lbs', 'machine', { toFailure: true }),
      ],
      completed: true,
    },
    {
      exerciseId: 'calf-raises',
      exerciseName: 'Calf Raises',
      sets: [
        s(1, 20, 15, 'kg', 'machine'),
        s(2, 30, 15, 'kg', 'machine'),
        s(3, null, 22, 'kg', 'bodyweight', { notes: 'Bodyweight' }),
      ],
      completed: true,
    },
  ],
};

// ─── SESSION 3: Back + Biceps ─────────────────────────────
const session3: WorkoutSession = {
  id: 'session-3',
  name: 'Back + Biceps',
  date: null,
  sessionLabel: 'Session 3',
  muscleGroupIds: ['back', 'biceps'],
  createdAt: new Date(2026, 0, 5).toISOString(),
  exercises: [
    {
      exerciseId: 't-bar-row',
      exerciseName: 'T-Bar Row',
      sets: [
        s(1, 110, 12, 'lbs', 'machine'),
        s(2, 110, 11, 'lbs', 'machine'),
        s(3, 99, 11, 'lbs', 'machine', {
          isDropSet: true,
          drops: [{ weight: 70, reps: 8, unit: 'lbs' }],
        }),
      ],
      completed: true,
    },
    {
      exerciseId: 'close-lat-pulldown',
      exerciseName: 'Close Grip Lat Pulldown',
      sets: [
        s(1, 130, 10.5, 'lbs', 'machine'),
        s(2, 130, 7.5, 'lbs', 'machine'),
        s(3, 130, 7.5, 'lbs', 'machine'),
      ],
      completed: true,
    },
    {
      exerciseId: 'wide-lat-pulldown',
      exerciseName: 'Wide Grip Lat Pulldown',
      sets: [
        s(1, 100, 10, 'lbs', 'machine'),
        s(2, 100, 8, 'lbs', 'machine'),
        s(3, 100, 8, 'lbs', 'machine', {
          isDropSet: true,
          drops: [{ weight: 0, reps: null, toFailure: true }],
          notes: 'Drop set to failure',
        }),
      ],
      completed: true,
    },
    {
      exerciseId: 'cable-row-single',
      exerciseName: 'Single-arm Cable Row',
      sets: [
        s(1, 50, 12, 'kg', 'machine'),
        s(2, 55, 10.5, 'kg', 'machine'),
      ],
      completed: true,
    },
    {
      exerciseId: 'cable-row-both',
      exerciseName: 'Cable Row Both Arms',
      sets: [
        s(1, 55, 10, 'kg', 'machine', {
          isDropSet: true,
          drops: [{ weight: 0, reps: null, toFailure: true }],
          notes: 'Drop set to failure',
        }),
      ],
      completed: true,
    },
    {
      exerciseId: 'single-preacher-curl',
      exerciseName: 'Single-arm Preacher Curl',
      sets: [
        s(1, 12.5, 8, 'kg', 'dumbbell'),
        s(2, 12.5, 8, 'kg', 'dumbbell', {
          isDropSet: true,
          drops: [
            { weight: 10, reps: null, unit: 'kg' },
            { weight: 5, reps: null, unit: 'kg' },
          ],
        }),
      ],
      completed: true,
    },
    {
      exerciseId: 'cable-curl-behind',
      exerciseName: 'Cable Curl Behind Body',
      sets: [
        s(1, 15, 12, 'kg', 'machine'),
        s(2, 15, 9, 'kg', 'machine'),
        s(3, 10, null, 'kg', 'machine', {
          isDropSet: true,
          drops: [{ weight: 5, reps: null, unit: 'kg' }],
          notes: 'Drop set',
        }),
      ],
      completed: true,
    },
    {
      exerciseId: 'hammer-curl',
      exerciseName: 'Hammer Curl',
      sets: [
        s(1, 15, 6, 'kg', 'dumbbell'),
        s(2, 10, null, 'kg', 'dumbbell', {
          isDropSet: true,
          notes: 'Planned drop set',
        }),
      ],
      completed: true,
    },
  ],
};

// ─── SESSION 4: Chest + Triceps ───────────────────────────
const session4: WorkoutSession = {
  id: 'session-4',
  name: 'Chest + Triceps',
  date: null,
  sessionLabel: 'Session 4',
  muscleGroupIds: ['chest', 'triceps'],
  createdAt: new Date(2026, 0, 7).toISOString(),
  exercises: [
    {
      exerciseId: 'incline-db-bench',
      exerciseName: 'Incline Press',
      sets: [
        s(1, 20, 10, 'kg', 'each_side'),
        s(2, 20, 8, 'kg', 'each_side'),
        s(3, 20, 6, 'kg', 'each_side'),
      ],
      completed: true,
    },
    {
      exerciseId: 'flat-press',
      exerciseName: 'Flat Press',
      sets: [
        s(1, 20, 12, 'kg', 'each_side'),
      ],
      completed: true,
    },
    {
      exerciseId: 'cable-fly',
      exerciseName: 'Cable Fly',
      sets: [
        s(1, 15, 12, 'kg', 'machine'),
        s(2, 15, 12, 'kg', 'machine'),
        s(3, 15, null, 'kg', 'machine', {
          isDropSet: true,
          drops: [{ weight: 0, reps: null, toFailure: true }],
          notes: 'Drop set to failure',
        }),
      ],
      completed: true,
    },
    {
      exerciseId: 'overhead-triceps',
      exerciseName: 'Overhead Triceps',
      sets: [
        s(1, 20, 11, 'kg', 'machine'),
      ],
      completed: true,
    },
    {
      exerciseId: 'triceps-pushdown',
      exerciseName: 'Triceps Pushdown',
      sets: [
        s(1, 60, 12, 'kg', 'machine'),
      ],
      completed: true,
    },
    {
      exerciseId: 'single-arm-cable-tri',
      exerciseName: 'Single Arm Cable',
      sets: [
        s(1, 60, 12, 'kg', 'machine'),
      ],
      completed: true,
    },
  ],
};

// ─── SESSION 5: Legs Updated ──────────────────────────────
const session5: WorkoutSession = {
  id: 'session-5',
  name: 'Legs',
  date: null,
  sessionLabel: 'Session 5',
  muscleGroupIds: ['legs'],
  createdAt: new Date(2026, 0, 9).toISOString(),
  exercises: [
    {
      exerciseId: 'leg-press',
      exerciseName: 'Leg Press',
      sets: [
        s(1, 65, 12, 'kg', 'each_side'),
      ],
      completed: true,
    },
    {
      exerciseId: 'leg-curl',
      exerciseName: 'Leg Curl',
      sets: [
        s(1, 130, 12, 'lbs', 'machine'),
      ],
      completed: true,
    },
    {
      exerciseId: 'leg-extension',
      exerciseName: 'Leg Extension',
      sets: [
        s(1, 130, 12, 'lbs', 'machine'),
      ],
      completed: true,
    },
    {
      exerciseId: 'calf-raises',
      exerciseName: 'Calf Raises',
      sets: [
        s(1, 45, 12, 'kg', 'machine'),
      ],
      completed: true,
    },
  ],
};

// ─── SESSION 6: Shoulders + Arms ──────────────────────────
const session6: WorkoutSession = {
  id: 'session-6',
  name: 'Shoulders + Arms',
  date: null,
  sessionLabel: 'Session 6',
  muscleGroupIds: ['shoulders', 'biceps', 'triceps'],
  createdAt: new Date(2026, 0, 11).toISOString(),
  exercises: [
    {
      exerciseId: 'shoulder-press',
      exerciseName: 'Shoulder Press',
      sets: [
        s(1, 95, 12, 'lbs', 'machine'),
        s(2, 95, 10, 'lbs', 'machine'),
        s(3, 95, 8, 'lbs', 'machine', {
          isDropSet: true,
          drops: [{ weight: 50, reps: null, unit: 'lbs', toFailure: true }],
          notes: 'Drop to 50 lbs to failure',
        }),
      ],
      completed: true,
    },
    {
      exerciseId: 'cable-lateral-raises',
      exerciseName: 'Cable Lateral Raises',
      sets: [
        s(1, 10, 15, 'kg', 'machine'),
        s(2, 15, 9.5, 'kg', 'machine'),
        s(3, 15, null, 'kg', 'machine', { toFailure: true, notes: 'To failure' }),
      ],
      completed: true,
    },
    {
      exerciseId: 'face-pull',
      exerciseName: 'Face Pull',
      sets: [
        s(1, 70, 12, 'kg', 'machine'),
        s(2, 70, 11, 'kg', 'machine'),
        s(3, 70, 10, 'kg', 'machine'),
      ],
      completed: true,
    },
    {
      exerciseId: 'rear-delt-cable',
      exerciseName: 'Single-arm Rear Delt Cable',
      sets: [
        s(1, 10, 15, 'kg', 'machine', { notes: 'Each arm' }),
      ],
      completed: true,
    },
    {
      exerciseId: 'cable-curl-behind',
      exerciseName: 'Cable Curl Behind Body',
      sets: [
        s(1, 15, 12, 'kg', 'machine'),
        s(2, 20, 9, 'kg', 'machine'),
        s(3, 20, 9, 'kg', 'machine', {
          isDropSet: true,
          drops: [{ weight: 0, reps: null, toFailure: true }],
          notes: 'Drop set to failure',
        }),
      ],
      completed: true,
    },
    {
      exerciseId: 'single-preacher-curl',
      exerciseName: 'Single-arm Preacher Curl',
      sets: [
        s(1, 12.5, 8, 'kg', 'dumbbell'),
        s(2, 12.5, 8, 'kg', 'dumbbell', {
          isDropSet: true,
          drops: [{ weight: 0, reps: null }],
          notes: 'Drop set',
        }),
      ],
      completed: true,
    },
    {
      exerciseId: 'hammer-curl',
      exerciseName: 'Hammer Curl',
      sets: [
        s(1, 15, 6, 'kg', 'dumbbell'),
        s(2, 10, null, 'kg', 'dumbbell', {
          isDropSet: true,
          drops: [{ weight: 5, reps: null, unit: 'kg' }],
          notes: 'Drop set 10kg -> 5kg',
        }),
      ],
      completed: true,
    },
    {
      exerciseId: 'overhead-triceps',
      exerciseName: 'Overhead Triceps',
      sets: [
        s(1, 10, 13, 'kg', 'machine'),
        s(2, 15, 10, 'kg', 'machine', { notes: '10 right / 9 left' }),
        s(3, 15, 8, 'kg', 'machine', {
          isDropSet: true,
          drops: [{ weight: 5, reps: null, unit: 'kg', toFailure: true }],
          notes: 'Drop to 5kg to failure',
        }),
      ],
      completed: true,
    },
    {
      exerciseId: 'triceps-pushdown',
      exerciseName: 'Triceps Pushdown',
      sets: [
        s(1, 50, 12, 'kg', 'machine'),
        s(2, 60, 8, 'kg', 'machine'),
        s(3, 55, 9, 'kg', 'machine', {
          isDropSet: true,
          drops: [{ weight: 0, reps: null, toFailure: true }],
          notes: 'Drop set to failure',
        }),
      ],
      completed: true,
    },
  ],
};

// ─── All Sessions ─────────────────────────────────────────
export const seedWorkoutHistory: WorkoutSession[] = [
  session1,
  session2,
  session3,
  session4,
  session5,
  session6,
];

// ─── Build Latest Logs from newest session per exercise ───
export function buildLatestLogs(history: WorkoutSession[]): Record<string, LatestLog> {
  const latestLogs: Record<string, LatestLog> = {};

  // Iterate sessions in chronological order; latest overwrites earlier
  for (const session of history) {
    for (const exerciseLog of session.exercises) {
      latestLogs[exerciseLog.exerciseId] = {
        exerciseId: exerciseLog.exerciseId,
        exerciseName: exerciseLog.exerciseName,
        sets: exerciseLog.sets,
        sessionId: session.id,
        sessionDate: session.date,
        sessionLabel: session.sessionLabel,
      };
    }
  }

  return latestLogs;
}

export const seedLatestLogs = buildLatestLogs(seedWorkoutHistory);
