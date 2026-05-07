import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
} from 'recharts';
import { TrendingUp, Target, Zap } from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';
import {
  computePerformanceTrend,
  computeMuscleProgress,
  computeVolumeByMuscle,
  computeExerciseProgress,
  computeBestSetProgression,
} from '../utils/analytics';

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

type Tab = 'overview' | 'muscles' | 'exercises' | 'prs';

export default function Analytics() {
  const { workoutHistory, exercises, muscleGroups, prRecords } = useWorkoutStore();
  const [tab, setTab] = useState<Tab>('overview');
  const [selectedExercise, setSelectedExercise] = useState('');

  const performanceTrend = useMemo(
    () => computePerformanceTrend(workoutHistory),
    [workoutHistory]
  );

  const muscleVolume = useMemo(
    () => computeVolumeByMuscle(workoutHistory, exercises, muscleGroups),
    [workoutHistory, exercises, muscleGroups]
  );

  const muscleProgress = useMemo(
    () => computeMuscleProgress(workoutHistory, exercises, muscleGroups),
    [workoutHistory, exercises, muscleGroups]
  );

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
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentVolume = muscleGroups.map(mg => ({ id: mg.id, name: mg.name, volume: 0, color: mg.color }));
    
    workoutHistory.forEach(session => {
      if (new Date(session.createdAt) >= sevenDaysAgo) {
        session.exercises.forEach(exLog => {
          const ex = exercises.find(e => e.id === exLog.exerciseId);
          if (ex) {
            const mg = recentVolume.find(m => m.id === ex.muscleGroupId);
            if (mg) {
               mg.volume += exLog.sets.reduce((sum, s) => sum + ((s.weight || 0) * (s.reps || 0)), 0);
            }
          }
        });
      }
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
    { id: 'prs', label: 'PRs' },
  ];

  return (
    <motion.div
      className="page-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-xl font-bold text-white mb-4">Analytics</h2>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-dark-700 mb-6">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
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
          {/* Performance Trend */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-accent-400" />
              <h3 className="text-sm font-semibold text-white">Performance Trend</h3>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceTrend}>
                  <defs>
                    <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="session" tick={{ fill: chartTheme.text, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: chartTheme.text, fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="totalVolume"
                    name="Volume"
                    stroke="#6366f1"
                    fill="url(#volGrad)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Average Weight */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-green-400" />
              <h3 className="text-sm font-semibold text-white">Avg Weight Per Session</h3>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceTrend}>
                  <XAxis dataKey="session" tick={{ fill: chartTheme.text, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: chartTheme.text, fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="avgWeight"
                    name="Avg Weight"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ fill: '#22c55e', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Muscles Tab */}
      {tab === 'muscles' && (
        <div className="space-y-6">
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

          {/* Volume Pie */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-white mb-4">Volume by Muscle Group</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={muscleVolume}
                    dataKey="volume"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={40}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {muscleVolume.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {muscleVolume.map(mv => (
                <span key={mv.name} className="text-xs flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: mv.color }} />
                  <span className="text-dark-200">{mv.name}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Muscle Progress */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-white mb-4">Muscle Progress Over Time</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={muscleProgress}>
                  <XAxis dataKey="session" tick={{ fill: chartTheme.text, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: chartTheme.text, fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip content={<CustomTooltip />} />
                  {muscleGroups.slice(0, 6).map(mg => (
                    <Bar key={mg.id} dataKey={mg.name} fill={mg.color} radius={[4, 4, 0, 0]} stackId="a" />
                  ))}
                </BarChart>
              </ResponsiveContainer>
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
                  {pr.type === 'weight' && `${pr.value}${pr.weight ? '' : ''} — Weight PR`}
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
    </motion.div>
  );
}
