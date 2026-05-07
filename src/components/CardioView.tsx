import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { Activity, MapPin, Clock, Zap } from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';
import { computeCardioProgress } from '../utils/analytics';

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
  const { workoutHistory, exercises } = useWorkoutStore();

  const data = useMemo(() => {
    return computeCardioProgress([...workoutHistory].reverse(), exercises);
  }, [workoutHistory, exercises]);

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
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Cardio</h2>
          <p className="text-dark-300 text-sm">Track your endurance</p>
        </div>
      </div>

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
