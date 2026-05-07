import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuid } from 'uuid';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { Activity, MapPin, Clock, Zap, Plus, X, ListFilter } from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';
import { computeCardioProgress } from '../utils/analytics';
import type { WorkoutSet } from '../types/workout';

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
          {entry.name}: {entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

export default function CardioView() {
  const { workoutHistory, exercises, latestLogs, logStandaloneCardio } = useWorkoutStore();
  
  const [isLogging, setIsLogging] = useState(false);
  
  const cardioExercises = useMemo(() => exercises.filter(e => e.category === 'cardio'), [exercises]);
  const defaultExId = cardioExercises.length > 0 ? cardioExercises[0].id : '';

  const [formExId, setFormExId] = useState(defaultExId);
  const [formTime, setFormTime] = useState('');
  const [formDistance, setFormDistance] = useState('');
  const [formSpeed, setFormSpeed] = useState('');
  const [formIncline, setFormIncline] = useState('');
  const [showPresets, setShowPresets] = useState(false);

  useEffect(() => {
    if (!formExId && cardioExercises.length > 0) {
      setFormExId(cardioExercises[0].id);
    }
  }, [cardioExercises, formExId]);

  const data = useMemo(() => {
    return computeCardioProgress([...workoutHistory].reverse(), exercises);
  }, [workoutHistory, exercises]);

  const handleApplyPreset = () => {
    const treadmill = cardioExercises.find(e => e.name.toLowerCase().includes('treadmill'));
    if (treadmill) setFormExId(treadmill.id);
    setFormTime('20');
    setFormSpeed('3.0');
    setFormIncline('15.0');
    setFormDistance('');
    setShowPresets(false);
  };

  const handleCopyPrevious = () => {
    if (!formExId) return;
    const latest = latestLogs[formExId];
    if (latest && latest.sets.length > 0) {
      const s = latest.sets[latest.sets.length - 1];
      setFormTime(s.time?.toString() ?? '');
      setFormDistance(s.distance?.toString() ?? '');
      setFormSpeed(s.speed?.toString() ?? '');
      setFormIncline(s.incline?.toString() ?? '');
    }
    setShowPresets(false);
  };

  const handleSave = async () => {
    const targetExId = formExId || (cardioExercises.length > 0 ? cardioExercises[0].id : null);
    if (!targetExId) return;

    try {
      const newSet: any = {
        id: uuid(),
        setNumber: 1,
        weight: null,
        reps: null,
        unit: 'kg',
        weightMode: 'machine',
      };
      
      if (formTime) newSet.time = parseFloat(formTime);
      if (formDistance) newSet.distance = parseFloat(formDistance);
      if (formSpeed) newSet.speed = parseFloat(formSpeed);
      if (formIncline) newSet.incline = parseFloat(formIncline);

      await logStandaloneCardio(targetExId, newSet as WorkoutSet);
    } catch (e) {
      console.error('Failed to log cardio:', e);
    } finally {
      setIsLogging(false);
      // Reset form
      setFormTime('');
      setFormDistance('');
      setFormSpeed('');
      setFormIncline('');
    }
  };

  const stats = useMemo(() => {
    let totalDistance = 0;
    let totalTime = 0;
    data.forEach(d => {
      totalDistance += d.distance;
      totalTime += d.time;
    });

    return {
      sessions: data.length,
      totalDistance: Math.round(totalDistance * 10) / 10,
      totalTime: Math.round(totalTime),
    };
  }, [data]);

  return (
    <motion.div
      className="page-container pb-24"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Cardio</h2>
            <p className="text-dark-300 text-sm">Track your endurance</p>
          </div>
        </div>
        {!isLogging && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsLogging(true)}
            className="flex items-center gap-2 px-3 py-2 bg-accent-600 hover:bg-accent-500 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Start Cardio
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {isLogging && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="glass-card p-4 border border-accent-500/30 relative">
              <button 
                onClick={() => setIsLogging(false)}
                className="absolute top-3 right-3 text-dark-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-lg font-bold text-white mb-4">Log Cardio</h3>
              
              <div className="flex items-center gap-2 mb-4 relative">
                <select
                  value={formExId}
                  onChange={e => setFormExId(e.target.value)}
                  className="input-field flex-1 text-sm font-medium"
                >
                  {cardioExercises.length === 0 && <option value="">No Cardio Exercises...</option>}
                  {cardioExercises.map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.name}</option>
                  ))}
                </select>

                <button 
                  onClick={() => setShowPresets(!showPresets)}
                  className="p-2.5 rounded-xl bg-dark-600 hover:bg-dark-500 text-dark-200 transition-colors"
                >
                  <ListFilter className="w-5 h-5" />
                </button>

                <AnimatePresence>
                  {showPresets && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute top-12 right-0 w-48 bg-dark-700 border border-dark-500 rounded-xl shadow-xl overflow-hidden z-20"
                    >
                      <button onClick={handleApplyPreset} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-dark-600 transition-colors border-b border-dark-600 flex flex-col">
                        <span className="font-semibold text-accent-400">15-3-20 Workout</span>
                        <span className="text-xs text-dark-300">Treadmill (15 Inc, 3 Spd, 20m)</span>
                      </button>
                      <button onClick={handleCopyPrevious} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-dark-600 transition-colors">
                        Copy Previous Log
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-dark-300 mb-1 block">Time (min)</label>
                  <input type="number" value={formTime} onChange={e => setFormTime(e.target.value)} className="input-field text-center text-lg font-bold" placeholder="0" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-dark-300 mb-1 block">Distance</label>
                  <input type="number" value={formDistance} onChange={e => setFormDistance(e.target.value)} className="input-field text-center text-lg font-bold" placeholder="0" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-dark-300 mb-1 block">Speed</label>
                  <input type="number" step="0.1" value={formSpeed} onChange={e => setFormSpeed(e.target.value)} className="input-field text-center text-lg font-bold" placeholder="0.0" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-dark-300 mb-1 block">Incline</label>
                  <input type="number" step="0.5" value={formIncline} onChange={e => setFormIncline(e.target.value)} className="input-field text-center text-lg font-bold" placeholder="0.0" />
                </div>
              </div>

              <button 
                onClick={handleSave}
                disabled={!formExId}
                className="btn-primary w-full shadow-lg shadow-accent-500/20"
              >
                Save Session
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <motion.div 
          className="glass-card p-4"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-orange-400" />
            <h3 className="text-xs font-semibold text-dark-200 uppercase tracking-wider">Total Distance</h3>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalDistance}</p>
        </motion.div>
        
        <motion.div 
          className="glass-card p-4"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-semibold text-dark-200 uppercase tracking-wider">Total Time</h3>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalTime} <span className="text-sm font-medium text-dark-300">min</span></p>
        </motion.div>
      </div>

      {/* Charts */}
      {data.length > 0 ? (
        <div className="space-y-4">
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-white mb-4">Distance Over Time</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorDistance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="session" 
                    stroke={chartTheme.text} 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(val) => val.split(' ')[1] || val}
                  />
                  <YAxis 
                    stroke={chartTheme.text} 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    width={30}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="distance" 
                    name="Distance"
                    stroke="#f97316" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorDistance)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-white mb-4">Time Invested (min)</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <XAxis 
                    dataKey="session" 
                    stroke={chartTheme.text} 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(val) => val.split(' ')[1] || val}
                  />
                  <YAxis 
                    stroke={chartTheme.text} 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    width={30}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="time" 
                    name="Time (min)"
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card p-8 flex flex-col items-center text-center">
          <Zap className="w-8 h-8 text-dark-400 mb-3" />
          <p className="text-white font-medium">No Cardio Data Yet</p>
          <p className="text-dark-300 text-sm mt-1">Log a cardio exercise to see your trends!</p>
        </div>
      )}
    </motion.div>
  );
}
