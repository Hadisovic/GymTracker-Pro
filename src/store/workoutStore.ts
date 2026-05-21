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
  cloudSyncStatus: 'synced' | 'local' | 'error' | 'syncing' | null;

  // Init
  initialize: () => Promise<void>;
  loadUserData: () => Promise<void>;
  setUser: (user: User | null) => void;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  syncToCloud: () => Promise<void>;
  syncFromCloud: () => Promise<boolean>;
  quickAddExerciseToWorkout: (name: string, muscleGroupId: string, equipment?: string) => Promise<string>;

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
      settings: { defaultUnit: 'kg', theme: 'dark', aiApiKey: 'b091ccb4666344569d0d860cd2d84731.WGZCXU2e7Aye8QGS' },
      currentView: 'dashboard',
      lastCompletedSessionId: null,
      user: null,
      cloudSyncStatus: null,

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
          isInitialized: false,
          cloudSyncStatus: null
        });
      },

      syncToCloud: async () => {
        const state = get();
        if (!state.user) throw new Error("Not logged in");
        set({ cloudSyncStatus: 'syncing' });
        const jsonStr = await state.exportData();

        let localSuccess = false;
        let cloudSuccess = false;

        // Save to localStorage as a reliable fallback / local cloud simulation
        try {
          localStorage.setItem(`gymtracker_cloud_backup_${state.user.uid}`, jsonStr);
          localStorage.setItem(`gymtracker_cloud_updated_${state.user.uid}`, new Date().toISOString());
          localSuccess = true;
        } catch (e) {
          console.warn("Local storage backup failed:", e);
        }

        if (firestoreDb) {
          try {
            await setDoc(doc(firestoreDb, "users", state.user.uid), {
              data: jsonStr,
              updatedAt: new Date().toISOString()
            });
            cloudSuccess = true;
          } catch (err) {
            console.warn("Firestore sync failed (e.g. expired security rules/offline), relying on local backup:", err);
          }
        }

        if (cloudSuccess) {
          set({ cloudSyncStatus: 'synced' });
        } else if (localSuccess) {
          set({ cloudSyncStatus: 'local' });
        } else {
          set({ cloudSyncStatus: 'error' });
        }
      },

      syncFromCloud: async () => {
        const state = get();
        if (!state.user) throw new Error("Not logged in");
        set({ cloudSyncStatus: 'syncing' });

        let cloudData: string | null = null;
        let cloudSuccess = false;

        if (firestoreDb) {
          try {
            const docRef = doc(firestoreDb, "users", state.user.uid);
            const snap = await getDoc(docRef);
            if (snap.exists() && snap.data().data) {
              cloudData = snap.data().data;
            }
            cloudSuccess = true;
          } catch (err) {
            console.warn("Firestore pull failed, attempting local fallback:", err);
          }
        }

        if (!cloudData) {
          cloudData = localStorage.getItem(`gymtracker_cloud_backup_${state.user.uid}`);
        }

        if (cloudData) {
          await state.importData(cloudData);
          set({ cloudSyncStatus: cloudSuccess ? 'synced' : 'local' });
          return true;
        } else {
          set({ cloudSyncStatus: cloudSuccess ? 'synced' : 'error' });
          return false; // No cloud backup found
        }
      },

      async loadUserData() {
        set({ cloudSyncStatus: 'syncing' });

        try {
          // 1. Check if local data already exists (Existential Check via direct db import)
          const localMuscleGroups = await db.muscleGroups.toArray();
          const isFirstTimeInstall = localMuscleGroups.length === 0;

          // 2. Attempt Cloud Sync
          const syncSuccess = await this.syncFromCloud();

          if (syncSuccess) {
            set({ cloudSyncStatus: 'synced' });
          } else {
            // Failed sync but not caught by error block (e.g., empty cloud database)
            set({ cloudSyncStatus: 'local' });
            
            // Only seed default data if the local DB is completely empty
            if (isFirstTimeInstall) {
              await this.resetToSeed();
            }
          }
        } catch (error) {
          console.error("Cloud synchronization failed:", error);
          
          // Set status to local or error depending on internet connection
          if (!navigator.onLine) {
            set({ cloudSyncStatus: 'local' }); // Offline backup fallback
          } else {
            set({ cloudSyncStatus: 'error' });
          }

          // CRITICAL FIX: Fall back to local data. NEVER wipe data via resetToSeed() here!
          const localMuscleGroups = await db.muscleGroups.toArray();
          if (localMuscleGroups.length === 0) {
            // Only run initial seeding if it's a completely fresh application install
            await this.resetToSeed();
          }
        }
      },

      async quickAddExerciseToWorkout(name: string, muscleGroupId: string, equipment?: string) {
        const newId = uuid();
        const newEx: Exercise = {
          id: newId,
          name,
          muscleGroupId,
          equipment,
          category: 'strength',
          isCustom: true,
          usageCount: 1,
          lastPerformedAt: new Date().toISOString()
        };

        // 1. Add to local IndexedDB
        await db.exercises.add(newEx);

        // 2. Update state list
        set(s => ({ exercises: [...s.exercises, newEx] }));

        // 3. Auto-insert into active workout if currently running
        const state = get();
        if (state.activeWorkout) {
          state.addExerciseToActiveWorkout(newId);
        }

        return newId;
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
            settings: settingsArr[0] ?? { defaultUnit: 'kg', theme: 'dark', aiApiKey: 'b091ccb4666344569d0d860cd2d84731.WGZCXU2e7Aye8QGS' },
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

        // Find max session number to avoid duplicates after deletions
        const maxSessionNum = state.workoutHistory.reduce((max, s) => {
          const match = s.sessionLabel.match(/Session (\d+)/);
          return match ? Math.max(max, parseInt(match[1])) : max;
        }, 0);
        const sessionNumber = maxSessionNum + 1;
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

        // Update latest logs and exercise popularity/recency metrics
        const newLatestLogs = { ...state.latestLogs };
        const updatedExercises = [...state.exercises];
        const nowStr = new Date().toISOString();
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

          // Update usage counts and recency in IndexedDB and state
          const exIndex = updatedExercises.findIndex(e => e.id === log.exerciseId);
          if (exIndex !== -1) {
            const currentEx = updatedExercises[exIndex];
            const usageCount = (currentEx.usageCount ?? 0) + 1;
            const lastPerformedAt = nowStr;
            const newEx = { ...currentEx, usageCount, lastPerformedAt };
            updatedExercises[exIndex] = newEx;
            await db.exercises.update(log.exerciseId, { usageCount, lastPerformedAt });
          }
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
          exercises: updatedExercises,
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

        const maxSessionNum = state.workoutHistory.reduce((max, s) => {
          const match = s.sessionLabel.match(/Session (\d+)/);
          return match ? Math.max(max, parseInt(match[1])) : max;
        }, 0);
        const sessionNumber = maxSessionNum + 1;
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
        // Strip sensitive data (API key) before exporting
        const safeSettings = { ...state.settings };
        delete safeSettings.aiApiKey;
        return JSON.stringify({
          version: 1,
          exportedAt: new Date().toISOString(),
          muscleGroups: state.muscleGroups,
          exercises: state.exercises,
          workoutPresets: state.workoutPresets,
          workoutHistory: state.workoutHistory,
          latestLogs: state.latestLogs,
          prRecords: state.prRecords,
          settings: safeSettings,
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
            const currentSettings = get().settings;
            const newSettings = { ...currentSettings, ...data.settings };
            
            // Preserve profile if the imported backup doesn't have one
            if (!data.settings.profile && currentSettings.profile) {
              newSettings.profile = currentSettings.profile;
            }
            
            await db.settings.put({ id: 'main', ...newSettings });
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

        const defaultSettings: AppSettings = { defaultUnit: 'kg', theme: 'dark', aiApiKey: 'b091ccb4666344569d0d860cd2d84731.WGZCXU2e7Aye8QGS' };
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