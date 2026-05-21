import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import { TrendingUp, Zap, Clock } from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';
import {
  computeExerciseProgress,
  computeBestSetProgression,
} from '../utils/analytics';
import { WeeklyOverloadChart } from './charts/WeeklyOverloadChart';
import { MuscleLandmarksChart } from './charts/MuscleLandmarksChart';
import { ACWRChart } from './charts/ACWRChart';
import { CardioPaceChart } from './charts/CardioPaceChart';
import History from './History';

const chartTheme = {
  background: 'transparent',
  text: '#8888aa',
  grid: '#24243a',
  tooltip: {
    background: '#1a1a24',
    border: 'rgba(255,255,255,0.08)',
  },
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload) return null;
  return (
    <div
      className="glass-card p-2.5 text-xs"
      style={{ border: `1px solid ${chartTheme.tooltip.border}` }}
    >
      <p className="text-dark-200 font-medium mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="font-semibold">
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  );
};

type Tab = 'overview' | 'muscles' | 'exercises' | 'cardio' | 'prs';

export default function Analytics() {
  const { currentView, workoutHistory, exercises, muscleGroups, prRecords } = useWorkoutStore();
  const [subView, setSubView] = useState<'visuals' | 'history'>(
    currentView === 'history' ? 'history' : 'visuals'
  );
  const [tab, setTab] = useState<Tab>(
    currentView === 'cardio' ? 'cardio' : 'overview'
  );
  const [selectedExercise, setSelectedExercise] = useState('');


  const exerciseProgress = useMemo(
    () => selectedExercise ? computeExerciseProgress(workoutHistory, selectedExercise) : [],
    [workoutHistory, selectedExercise]
  );

  const bestSets = useMemo(
    () => selectedExercise ? computeBestSetProgression(workoutHistory, selectedExercise) : [],
    [workoutHistory, selectedExercise]
  );

  const exercisesWithHistory = useMemo(() => {
    const ids = new Set(workoutHistory.flatMap(s => s.exercises.map(e => e.exerciseId)));
    return exercises.filter(e => ids.has(e.id));
  }, [workoutHistory, exercises]);

  const muscleHeatmap = useMemo(() => {
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    
    const recentVolume = muscleGroups.map(mg => ({ id: mg.id, name: mg.name, volume: 0, color: mg.color }));
    
    workoutHistory.forEach(session => {
      // Use actual workout date, fallback to createdAt
      const sessionDate = session.date ? new Date(session.date).getTime() : new Date(session.createdAt).getTime();
      const ageMs = now - sessionDate;
      
      // Only consider last 7 days
      if (ageMs > sevenDaysMs || ageMs < 0) return;
      
      // Apply time decay: yesterday counts ~7x more than 6 days ago
      const decayFactor = Math.exp(-ageMs / (2 * 24 * 60 * 60 * 1000)); // ~2-day half-life
      
      session.exercises.forEach(exLog => {
        const ex = exercises.find(e => e.id === exLog.exerciseId);
        if (ex) {
          const mg = recentVolume.find(m => m.id === ex.muscleGroupId);
          if (mg) {
            const rawVolume = exLog.sets.reduce((sum, s) => sum + ((s.weight || 0) * (s.reps || 0)), 0);
            mg.volume += rawVolume * decayFactor;
          }
        }
      });
    });
    
    const maxVolume = Math.max(...recentVolume.map(m => m.volume), 1);
    return recentVolume.map(m => {
      const intensity = m.volume === 0 ? 0 : Math.max(0.2, m.volume / maxVolume); 
      let status = 'Recovered';
      if (intensity > 0.7) status = 'Fatigued';
      else if (intensity > 0.3) status = 'Active';
      return { ...m, intensity, status };
    });
  }, [workoutHistory, exercises, muscleGroups]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'muscles', label: 'Muscles' },
    { id: 'exercises', label: 'Exercises' },
    { id: 'cardio', label: 'Cardio' },
    { id: 'prs', label: 'PRs' },
  ];

  return (
    <motion.div
      className="page-container pb-24"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-xl font-bold text-white mb-4">Analytics</h2>

      {/* Segmented Sub-view Picker */}
      <div className="flex p-0.5 border rounded-xl bg-dark-950/80 border-white/5 mb-6 font-semibold shadow-inner">
        <button
          onClick={() => setSubView('visuals')}
          className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            subView === 'visuals'
              ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/20'
              : 'text-dark-300 hover:text-dark-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Visual Analytics
        </button>
        <button
          onClick={() => setSubView('history')}
          className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            subView === 'history'
              ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/20'
              : 'text-dark-300 hover:text-dark-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          Logs History
        </button>
      </div>

      {subView === 'history' ? (
        <History isNested={true} />
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl bg-dark-700 mb-6 overflow-x-auto scrollbar-none">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  tab === t.id
                    ? 'bg-accent-500 text-white'
                    : 'text-dark-300 hover:text-dark-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {tab === 'overview' && (
            <div className="space-y-6">
              <WeeklyOverloadChart />
              <ACWRChart />
            </div>
          )}

          {/* Muscles Tab */}
          {tab === 'muscles' && (
            <div className="space-y-6">
              <MuscleLandmarksChart />

              {/* Muscle Heatmap */}
              <div className="glass-card p-4">
                <h3 className="text-sm font-semibold text-white mb-4">7-Day Muscle Fatigue Heatmap</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {muscleHeatmap.map(mg => (
                    <div 
                      key={mg.id} 
                      className="rounded-xl p-3 flex flex-col justify-between"
                      style={{
                        backgroundColor: mg.intensity > 0 ? `${mg.color}${Math.floor(mg.intensity * 80).toString(16).padStart(2, '0')}` : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${mg.intensity > 0 ? mg.color : 'rgba(255,255,255,0.1)'}`
                      }}
                    >
                      <span className="text-sm font-bold text-white mb-1">{mg.name}</span>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-medium" style={{ color: mg.intensity > 0 ? '#fff' : '#8888aa' }}>
                          {mg.status}
                        </span>
                        {mg.intensity > 0 && (
                          <Zap className="w-3 h-3 text-white opacity-80" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Exercises Tab */}
          {tab === 'exercises' && (
            <div className="space-y-6">
              <select
                value={selectedExercise}
                onChange={e => setSelectedExercise(e.target.value)}
                className="input-field text-sm"
              >
                <option value="">Select an exercise...</option>
                {exercisesWithHistory.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>

              {selectedExercise && exerciseProgress.length > 0 && (
                <>
                  <div className="glass-card p-4">
                    <h3 className="text-sm font-semibold text-white mb-4">Weight & Volume Progression</h3>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={exerciseProgress}>
                          <XAxis dataKey="session" tick={{ fill: chartTheme.text, fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: chartTheme.text, fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                          <Tooltip content={<CustomTooltip />} />
                          <Line type="monotone" dataKey="maxWeight" name="Max Weight" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 3 }} />
                          <Line type="monotone" dataKey="estimated1RM" name="Est. 1RM" stroke="#a855f7" strokeWidth={2} dot={{ fill: '#a855f7', r: 3 }} strokeDasharray="5 5" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="glass-card p-4">
                    <h3 className="text-sm font-semibold text-white mb-4">Best Set Progression</h3>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={bestSets}>
                          <XAxis dataKey="session" tick={{ fill: chartTheme.text, fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: chartTheme.text, fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="weight" name="Weight" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}

              {selectedExercise && exerciseProgress.length === 0 && (
                <div className="text-center py-8 text-dark-300 text-sm">
                  No data for this exercise yet.
                </div>
              )}
            </div>
          )}

          {/* Cardio Tab */}
          {tab === 'cardio' && (
            <div className="space-y-6">
              <CardioPaceChart />
            </div>
          )}

          {/* PRs Tab */}
          {tab === 'prs' && (
            <div className="space-y-3">
              {prRecords.length === 0 && (
                <div className="flex flex-col items-center py-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-dark-700 flex items-center justify-center mb-4">
                    <Zap className="w-8 h-8 text-dark-400" />
                  </div>
                  <p className="text-dark-200 font-medium">No PRs yet</p>
                  <p className="text-dark-400 text-sm mt-1">Complete workouts to start tracking PRs</p>
                </div>
              )}

              {[...prRecords].reverse().slice(0, 50).map((pr, i) => (
                <motion.div
                  key={pr.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="glass-card-sm p-3 flex items-center gap-3"
                >
                  <div className={`pr-badge ${
                    pr.type === 'weight' ? 'pr-badge-weight' :
                    pr.type === 'reps' ? 'pr-badge-reps' :
                    pr.type === 'volume' ? 'pr-badge-volume' :
                    'pr-badge-matched'
                  }`}>
                    {pr.type === 'weight' ? '🏆' :
                     pr.type === 'reps' ? '💪' :
                     pr.type === 'volume' ? '📊' : '⚡'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{pr.exerciseName}</p>
                    <p className="text-dark-300 text-xs">
                      {pr.type === 'weight' && `${pr.value}kg — Weight PR`}
                      {pr.type === 'reps' && `${pr.value} reps @ ${pr.weight} — Rep PR`}
                      {pr.type === 'volume' && `${pr.value} volume — Volume PR`}
                      {pr.type === 'estimated' && `${pr.value} est. 1RM`}
                    </p>
                  </div>
                  <span className="text-dark-400 text-xs flex-shrink-0">{pr.sessionLabel}</span>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
