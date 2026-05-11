import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import { db } from '../db';
import type {
  MuscleGroup, Exercise, WorkoutPreset, WorkoutSession,
  LatestLog, PRRecord, ActiveWorkoutState, ExerciseLog,
  WorkoutSet, AppSettings,
} from '../types/workout';
import { defaultMuscleGroups, defaultExercises, defaultWorkoutPresets } from '../data/seedWorkoutData';
import { buildLatestLogs } from '../data/seedWorkoutHistory';
import { detectPRs, rebuildAllPRs } from '../utils/prDetection';
import type { User } from 'firebase/auth';
import { loginWithGoogle, logout as firebaseLogout, db as firestoreDb } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface WorkoutStore {
  // Data
  muscleGroups: MuscleGroup[];
  exercises: Exercise[];
  workoutPresets: WorkoutPreset[];
  workoutHistory: WorkoutSession[];
  latestLogs: Record<string, LatestLog>;
  prRecords: PRRecord[];
  activeWorkout: ActiveWorkoutState | null;
  isInitialized: boolean;
  settings: AppSettings;
  currentView: string;
  lastCompletedSessionId: string | null;
  user: User | null;

  // Init
  initialize: () => Promise<void>;
  loadUserData: () => Promise<void>;
  setUser: (user: User | null) => void;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  syncToCloud: () => Promise<void>;
  syncFromCloud: () => Promise<boolean>;

  // Navigation
  setCurrentView: (view: string) => void;

  // Muscle Groups
  addMuscleGroup: (mg: MuscleGroup) => Promise<void>;
  updateMuscleGroup: (mg: MuscleGroup) => Promise<void>;
  deleteMuscleGroup: (id: string) => Promise<void>;

  // Exercises
  addExercise: (ex: Exercise) => Promise<void>;
  updateExercise: (ex: Exercise) => Promise<void>;
  deleteExercise: (id: string) => Promise<void>;

  // Presets
  addPreset: (p: WorkoutPreset) => Promise<void>;
  updatePreset: (p: WorkoutPreset) => Promise<void>;
  deletePreset: (id: string) => Promise<void>;

  // Active Workout
  startWorkout: (presetName: string, muscleGroupIds: string[], exerciseIds: string[]) => void;
  addExerciseToActiveWorkout: (exerciseId: string) => void;
  setCurrentExercise: (exerciseId: string) => void;
  addSetToExercise: (exerciseId: string, set: WorkoutSet) => void;
  updateSetInExercise: (exerciseId: string, setId: string, set: Partial<WorkoutSet>) => void;
  deleteSetFromExercise: (exerciseId: string, setId: string) => void;
  finishExercise: (exerciseId: string) => void;
  finishWorkout: () => Promise<void>;
  cancelWorkout: () => void;
  dismissSummary: () => void;
  logStandaloneCardio: (exerciseId: string, set: WorkoutSet) => Promise<void>;

  // History
  updateSession: (session: WorkoutSession) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;

  // Latest Logs
  updateLatestLog: (log: LatestLog) => Promise<void>;

  // PR
  rebuildPRs: () => Promise<void>;

  // Import / Export
  exportData: () => Promise<string>;
  importData: (json: string) => Promise<void>;
  resetToSeed: () => Promise<void>;

  // Settings
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
}

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
      muscleGroups: [],
      exercises: [],
  workoutPresets: [],
  workoutHistory: [],
  latestLogs: {},
  prRecords: [],
  activeWorkout: null,
  isInitialized: false,
  settings: { defaultUnit: 'kg', theme: 'dark' },
  currentView: 'dashboard',
  lastCompletedSessionId: null,
  user: null,

  // ─── Initialize from IndexedDB ──────────────────────────
  setUser: (user) => set({ user }),
  
  login: async () => {
    const user = await loginWithGoogle();
    set({ user });
  },

  logout: async () => {
    await firebaseLogout();
    
    // Wipe local database on logout for data isolation
    await Promise.all([
      db.muscleGroups.clear(),
      db.exercises.clear(),
      db.workoutPresets.clear(),
      db.workoutHistory.clear(),
      db.latestLogs.clear(),
      db.prRecords.clear(),
      db.settings.clear(),
    ]);

    set({ 
      user: null,
      muscleGroups: [],
      exercises: [],
      workoutPresets: [],
      workoutHistory: [],
      latestLogs: {},
      prRecords: [],
      activeWorkout: null,
      isInitialized: false 
    });
  },

  syncToCloud: async () => {
    const state = get();
    if (!state.user) throw new Error("Not logged in");
    if (!firestoreDb) throw new Error("Firebase not configured");
    const jsonStr = await state.exportData();
    await setDoc(doc(firestoreDb, "users", state.user.uid), {
      data: jsonStr,
      updatedAt: new Date().toISOString()
    });
  },

  syncFromCloud: async () => {
    const state = get();
    if (!state.user) throw new Error("Not logged in");
    if (!firestoreDb) throw new Error("Firebase not configured");
    const docRef = doc(firestoreDb, "users", state.user.uid);
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data().data) {
      await state.importData(snap.data().data);
      return true;
    } else {
      return false; // No cloud backup found
    }
  },

  loadUserData: async () => {
    try {
      const state = get();
      if (!state.user) return;
      
      const hasCloudData = await state.syncFromCloud();
      if (!hasCloudData) {
        // Brand new user, seed their empty dashboard and push it to their cloud
        await state.resetToSeed();
        await state.syncToCloud();
      }
    } catch (err) {
      console.error('Failed to load user data from cloud:', err);
      // Fallback to empty/seed if network error
      await get().resetToSeed();
    }
  },

  initialize: async () => {
    try {
      const [mgs, exs, presets, history, logs, prs, settingsArr] = await Promise.all([
        db.muscleGroups.toArray(),
        db.exercises.toArray(),
        db.workoutPresets.toArray(),
        db.workoutHistory.toArray(),
        db.latestLogs.toArray(),
        db.prRecords.toArray(),
        db.settings.toArray(),
      ]);

      if (mgs.length === 0) {
        // First launch — seed
        await get().resetToSeed();
        return;
      }

      let finalMgs = mgs;
      let finalExs = exs;

      // Migration: Add Cardio exercises if missing
      if (!mgs.find(m => m.id === 'cardio')) {
        const cardioMg = defaultMuscleGroups.find(m => m.id === 'cardio');
        if (cardioMg) {
          await db.muscleGroups.add(cardioMg);
          finalMgs.push(cardioMg);
          
          const cardioExs = defaultExercises.filter(e => e.muscleGroupId === 'cardio');
          for (const ex of cardioExs) {
            await db.exercises.add(ex);
            finalExs.push(ex);
          }
        }
      }

      const latestLogsMap: Record<string, LatestLog> = {};
      for (const l of logs) latestLogsMap[l.exerciseId] = l;

      const sortedHistory = history.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      set({
        muscleGroups: finalMgs,
        exercises: finalExs,
        workoutPresets: presets,
        workoutHistory: sortedHistory,
        latestLogs: latestLogsMap,
        prRecords: prs,
        settings: settingsArr[0] ?? { defaultUnit: 'kg', theme: 'dark' },
        isInitialized: true,
      });
    } catch (err) {
      console.error('Failed to initialize:', err);
      await get().resetToSeed();
    }
  },

  setCurrentView: (view) => set({ currentView: view }),

  // ─── Muscle Groups ──────────────────────────────────────
  addMuscleGroup: async (mg) => {
    await db.muscleGroups.add(mg);
    set(s => ({ muscleGroups: [...s.muscleGroups, mg] }));
  },
  updateMuscleGroup: async (mg) => {
    await db.muscleGroups.put(mg);
    set(s => ({ muscleGroups: s.muscleGroups.map(m => m.id === mg.id ? mg : m) }));
  },
  deleteMuscleGroup: async (id) => {
    await db.muscleGroups.delete(id);
    set(s => ({ muscleGroups: s.muscleGroups.filter(m => m.id !== id) }));
  },

  // ─── Exercises ──────────────────────────────────────────
  addExercise: async (ex) => {
    await db.exercises.add(ex);
    set(s => ({ exercises: [...s.exercises, ex] }));
  },
  updateExercise: async (ex) => {
    await db.exercises.put(ex);
    set(s => ({ exercises: s.exercises.map(e => e.id === ex.id ? ex : e) }));
  },
  deleteExercise: async (id) => {
    await db.exercises.delete(id);
    set(s => ({ exercises: s.exercises.filter(e => e.id !== id) }));
  },

  // ─── Presets ────────────────────────────────────────────
  addPreset: async (p) => {
    await db.workoutPresets.add(p);
    set(s => ({ workoutPresets: [...s.workoutPresets, p] }));
  },
  updatePreset: async (p) => {
    await db.workoutPresets.put(p);
    set(s => ({ workoutPresets: s.workoutPresets.map(x => x.id === p.id ? p : x) }));
  },
  deletePreset: async (id) => {
    await db.workoutPresets.delete(id);
    set(s => ({ workoutPresets: s.workoutPresets.filter(x => x.id !== id) }));
  },

  // ─── Active Workout ────────────────────────────────────
  startWorkout: (presetName, muscleGroupIds, exerciseIds) => {
    const exercises = get().exercises;
    const exerciseLogs: ExerciseLog[] = exerciseIds.map(id => {
      const ex = exercises.find(e => e.id === id);
      return {
        exerciseId: id,
        exerciseName: ex?.name ?? id,
        sets: [],
        completed: false,
      };
    });

    set({
      activeWorkout: {
        presetName,
        muscleGroupIds,
        exerciseIds,
        exerciseLogs,
        startedAt: new Date().toISOString(),
      },
    });
  },

  addExerciseToActiveWorkout: (exerciseId) => {
    set(s => {
      if (!s.activeWorkout) return {};
      // Prevent duplicates
      if (s.activeWorkout.exerciseIds.includes(exerciseId)) return {};
      
      const ex = get().exercises.find(e => e.id === exerciseId);
      const newLog: ExerciseLog = {
        exerciseId,
        exerciseName: ex?.name ?? exerciseId,
        sets: [],
        completed: false,
      };

      return {
        activeWorkout: {
          ...s.activeWorkout,
          exerciseIds: [...s.activeWorkout.exerciseIds, exerciseId],
          exerciseLogs: [...s.activeWorkout.exerciseLogs, newLog],
        }
      };
    });
  },

  setCurrentExercise: (exerciseId) => {
    set(s => s.activeWorkout
      ? { activeWorkout: { ...s.activeWorkout, currentExerciseId: exerciseId } }
      : {}
    );
  },

  addSetToExercise: (exerciseId, newSet) => {
    set(s => {
      if (!s.activeWorkout) return {};
      const logs = s.activeWorkout.exerciseLogs.map(log => {
        if (log.exerciseId !== exerciseId) return log;
        return { ...log, sets: [...log.sets, newSet] };
      });
      return { activeWorkout: { ...s.activeWorkout, exerciseLogs: logs } };
    });
  },

  updateSetInExercise: (exerciseId, setId, updates) => {
    set(s => {
      if (!s.activeWorkout) return {};
      const logs = s.activeWorkout.exerciseLogs.map(log => {
        if (log.exerciseId !== exerciseId) return log;
        return {
          ...log,
          sets: log.sets.map(st => st.id === setId ? { ...st, ...updates } : st),
        };
      });
      return { activeWorkout: { ...s.activeWorkout, exerciseLogs: logs } };
    });
  },

  deleteSetFromExercise: (exerciseId, setId) => {
    set(s => {
      if (!s.activeWorkout) return {};
      const logs = s.activeWorkout.exerciseLogs.map(log => {
        if (log.exerciseId !== exerciseId) return log;
        return {
          ...log,
          sets: log.sets.filter(st => st.id !== setId)
            .map((st, i) => ({ ...st, setNumber: i + 1 })),
        };
      });
      return { activeWorkout: { ...s.activeWorkout, exerciseLogs: logs } };
    });
  },

  finishExercise: (exerciseId) => {
    set(s => {
      if (!s.activeWorkout) return {};
      const logs = s.activeWorkout.exerciseLogs.map(log =>
        log.exerciseId === exerciseId ? { ...log, completed: true } : log
      );
      return {
        activeWorkout: {
          ...s.activeWorkout,
          exerciseLogs: logs,
          currentExerciseId: undefined,
        },
      };
    });
  },

  finishWorkout: async () => {
    const state = get();
    const aw = state.activeWorkout;
    if (!aw) return;

    const sessionNumber = state.workoutHistory.length + 1;
    const session: WorkoutSession = {
      id: uuid(),
      name: aw.presetName,
      date: new Date().toISOString(),
      sessionLabel: `Session ${sessionNumber}`,
      muscleGroupIds: aw.muscleGroupIds,
      exercises: aw.exerciseLogs.filter(l => l.sets.length > 0),
      createdAt: new Date().toISOString(),
      duration: Math.round((Date.now() - new Date(aw.startedAt).getTime()) / 60000),
    };

    // Save to DB
    await db.workoutHistory.add(session);

    // Update latest logs
    const newLatestLogs = { ...state.latestLogs };
    for (const log of session.exercises) {
      const ll: LatestLog = {
        exerciseId: log.exerciseId,
        exerciseName: log.exerciseName,
        sets: log.sets,
        sessionId: session.id,
        sessionDate: session.date,
        sessionLabel: session.sessionLabel,
      };
      newLatestLogs[log.exerciseId] = ll;
      await db.latestLogs.put(ll);
    }

    // Detect PRs
    let newPRs = [...state.prRecords];
    for (const log of session.exercises) {
      const result = detectPRs(
        log.exerciseId, log.exerciseName, log.sets,
        session.id, session.sessionLabel, session.date,
        newPRs
      );
      newPRs = [...newPRs, ...result.newRecords];
      for (const pr of result.newRecords) {
        await db.prRecords.add(pr);
      }
    }

    set({
      workoutHistory: [...state.workoutHistory, session],
      latestLogs: newLatestLogs,
      prRecords: newPRs,
      activeWorkout: null,
      lastCompletedSessionId: session.id,
    });
    
    try {
      await get().syncToCloud();
    } catch (e) {
      console.warn("Failed to auto-sync workout:", e);
    }
  },

  cancelWorkout: () => set({ activeWorkout: null }),

  dismissSummary: () => set({ lastCompletedSessionId: null, currentView: 'dashboard' }),

  logStandaloneCardio: async (exerciseId: string, workoutSet: WorkoutSet) => {
    const state = get();
    const ex = state.exercises.find(e => e.id === exerciseId);
    if (!ex) return;

    const sessionNumber = state.workoutHistory.length + 1;
    const session: WorkoutSession = {
      id: uuid(),
      name: `Quick Cardio: ${ex.name}`,
      date: new Date().toISOString(),
      sessionLabel: `Session ${sessionNumber}`,
      muscleGroupIds: [ex.muscleGroupId],
      exercises: [{
        exerciseId,
        exerciseName: ex.name,
        completed: true,
        sets: [workoutSet]
      }],
      createdAt: new Date().toISOString(),
      duration: Math.round(workoutSet.time ?? 0),
    };

    // Update latest logs
    const newLatestLogs = { ...state.latestLogs };
    const ll: LatestLog = {
      exerciseId,
      exerciseName: ex.name,
      sets: [workoutSet],
      sessionId: session.id,
      sessionDate: session.date,
      sessionLabel: session.sessionLabel,
    };
    newLatestLogs[exerciseId] = ll;

    try {
      // Save to DB
      await db.workoutHistory.add(session);
      await db.latestLogs.put(ll);
    } catch (e) {
      console.error('Dexie save error:', e);
    }

    // Update state
    set({
      workoutHistory: [...state.workoutHistory, session],
      latestLogs: newLatestLogs,
    });
    
    try {
      await get().syncToCloud();
    } catch (e) {
      console.warn("Failed to auto-sync cardio:", e);
    }
  },

  // ─── History ────────────────────────────────────────────
  updateSession: async (session) => {
    await db.workoutHistory.put(session);
    const newLatestLogs = buildLatestLogs([...get().workoutHistory.map(s =>
      s.id === session.id ? session : s
    )]);
    // Sync latest logs to DB
    await db.latestLogs.clear();
    const logEntries = Object.values(newLatestLogs);
    if (logEntries.length > 0) await db.latestLogs.bulkAdd(logEntries);

    set(s => ({
      workoutHistory: s.workoutHistory.map(h => h.id === session.id ? session : h),
      latestLogs: newLatestLogs,
    }));
    
    try {
      await get().syncToCloud();
    } catch (e) {
      console.warn("Failed to auto-sync updateSession:", e);
    }
  },

  deleteSession: async (id) => {
    await db.workoutHistory.delete(id);
    const remaining = get().workoutHistory.filter(h => h.id !== id);
    const newLatestLogs = buildLatestLogs(remaining);
    await db.latestLogs.clear();
    const logEntries = Object.values(newLatestLogs);
    if (logEntries.length > 0) await db.latestLogs.bulkAdd(logEntries);

    set({
      workoutHistory: remaining,
      latestLogs: newLatestLogs,
    });
    
    try {
      await get().syncToCloud();
    } catch (e) {
      console.warn("Failed to auto-sync deleteSession:", e);
    }
  },

  updateLatestLog: async (log) => {
    await db.latestLogs.put(log);
    set(s => ({
      latestLogs: { ...s.latestLogs, [log.exerciseId]: log },
    }));
  },

  // ─── Rebuild PRs ───────────────────────────────────────
  rebuildPRs: async () => {
    const sessions = get().workoutHistory;
    const allPRs = rebuildAllPRs(sessions);
    await db.prRecords.clear();
    if (allPRs.length > 0) await db.prRecords.bulkAdd(allPRs);
    set({ prRecords: allPRs });
  },

  // ─── Import / Export ────────────────────────────────────
  exportData: async () => {
    const state = get();
    return JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      muscleGroups: state.muscleGroups,
      exercises: state.exercises,
      workoutPresets: state.workoutPresets,
      workoutHistory: state.workoutHistory,
      latestLogs: state.latestLogs,
      prRecords: state.prRecords,
      settings: state.settings,
    }, null, 2);
  },

  importData: async (json) => {
    try {
      const data = JSON.parse(json);

      // Clear all tables
      await Promise.all([
        db.muscleGroups.clear(),
        db.exercises.clear(),
        db.workoutPresets.clear(),
        db.workoutHistory.clear(),
        db.latestLogs.clear(),
        db.prRecords.clear(),
      ]);

      // Bulk add
      if (data.muscleGroups?.length) await db.muscleGroups.bulkAdd(data.muscleGroups);
      if (data.exercises?.length) await db.exercises.bulkAdd(data.exercises);
      if (data.workoutPresets?.length) await db.workoutPresets.bulkAdd(data.workoutPresets);
      if (data.workoutHistory?.length) await db.workoutHistory.bulkAdd(data.workoutHistory);
      if (data.prRecords?.length) await db.prRecords.bulkAdd(data.prRecords);

      // Handle latestLogs (could be object or array)
      if (data.latestLogs) {
        const logs = Array.isArray(data.latestLogs)
          ? data.latestLogs
          : Object.values(data.latestLogs);
        if (logs.length) await db.latestLogs.bulkAdd(logs as LatestLog[]);
      }

      if (data.settings) {
        await db.settings.put({ id: 'main', ...data.settings });
      }

      // Reload
      await get().initialize();
    } catch (err) {
      console.error('Import failed:', err);
      throw err;
    }
  },

  resetToSeed: async () => {
    await Promise.all([
      db.muscleGroups.clear(),
      db.exercises.clear(),
      db.workoutPresets.clear(),
      db.workoutHistory.clear(),
      db.latestLogs.clear(),
      db.prRecords.clear(),
      db.settings.clear(),
    ]);

    await db.muscleGroups.bulkAdd(defaultMuscleGroups);
    await db.exercises.bulkAdd(defaultExercises);
    await db.workoutPresets.bulkAdd(defaultWorkoutPresets);

    const defaultSettings: AppSettings = { defaultUnit: 'kg', theme: 'dark' };
    await db.settings.put({ id: 'main', ...defaultSettings });

    set({
      muscleGroups: defaultMuscleGroups,
      exercises: defaultExercises,
      workoutPresets: defaultWorkoutPresets,
      workoutHistory: [],
      latestLogs: {},
      prRecords: [],
      settings: defaultSettings,
      isInitialized: true,
      activeWorkout: null,
    });
  },

  updateSettings: async (updates) => {
    const current = get().settings;
    const newSettings = { ...current, ...updates };
    await db.settings.put({ id: 'main', ...newSettings });
    set({ settings: newSettings });

    try {
      await get().syncToCloud();
    } catch (e) {
      console.warn("Failed to auto-sync settings:", e);
    }
  },
}), {
  name: 'gymtracker-active-workout',
  partialize: (state) => ({ activeWorkout: state.activeWorkout }),
}));
