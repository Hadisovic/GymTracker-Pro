import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useWorkoutStore } from '../../store/workoutStore';
import { computeAdvancedCardioTrend } from '../../utils/advancedAnalytics';
import { Heart, Activity } from 'lucide-react';

export const CardioPaceChart: React.FC = () => {
  const { workoutHistory, exercises } = useWorkoutStore();
  const [metric, setMetric] = useState<'pace' | 'speed'>('pace');

  const data = useMemo(() => {
    return computeAdvancedCardioTrend(workoutHistory, exercises);
  }, [workoutHistory, exercises]);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 border border-white/5 bg-dark-900/40 rounded-xl p-4">
        <Heart className="w-8 h-8 text-dark-500 mb-2" />
        <p className="text-xs text-dark-300 font-bold uppercase tracking-wider">No Cardio History Yet</p>
        <p className="text-[10px] text-dark-400 mt-1">Complete and log cardio sessions to view pacing metrics</p>
      </div>
    );
  }

  // Get current session values
  const currentPoint = data[data.length - 1];

  return (
    <div className="glass-card p-4 flex flex-col w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
            <Heart className="w-4 h-4 text-rose-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Advanced Cardio Pacing</h3>
            <p className="text-[10px] text-dark-300 font-semibold mt-0.5">Segregated speed vs inverted pace tracking</p>
          </div>
        </div>

        {/* Metric Switcher */}
        <div className="flex p-0.5 border rounded-lg bg-dark-950/80 border-white/5 font-mono">
          <button
            onClick={() => setMetric('pace')}
            className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-md transition-all ${
              metric === 'pace' 
                ? 'bg-rose-500 text-white shadow-[0_0_8px_rgba(244,63,94,0.3)]' 
                : 'text-dark-300 hover:text-dark-100'
            }`}
          >
            Pace
          </button>
          <button
            onClick={() => setMetric('speed')}
            className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-md transition-all ${
              metric === 'speed' 
                ? 'bg-rose-500 text-white shadow-[0_0_8px_rgba(244,63,94,0.3)]' 
                : 'text-dark-300 hover:text-dark-100'
            }`}
          >
            Speed
          </button>
        </div>
      </div>

      {/* Hero Stats */}
      {currentPoint && (
        <div className="grid grid-cols-3 gap-2.5 bg-dark-950/30 p-2.5 rounded-xl border border-white/5 mb-4 font-mono">
          <div className="text-center border-r border-white/5">
            <p className="text-[7.5px] uppercase font-bold text-dark-400 tracking-wider">Latest Dist.</p>
            <p className="text-xs font-black text-white mt-0.5">{currentPoint.distance} km</p>
          </div>
          <div className="text-center border-r border-white/5">
            <p className="text-[7.5px] uppercase font-bold text-dark-400 tracking-wider">Speed</p>
            <p className="text-xs font-black text-white mt-0.5">{currentPoint.speedKmh} km/h</p>
          </div>
          <div className="text-center">
            <p className="text-[7.5px] uppercase font-bold text-dark-400 tracking-wider">Pace</p>
            <p className="text-xs font-black text-rose-400 mt-0.5">{currentPoint.paceFormatted} /km</p>
          </div>
        </div>
      )}

      <div className="h-44 relative overflow-visible mt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <XAxis 
              dataKey="sessionLabel" 
              tick={{ fill: '#8888aa', fontSize: 9, fontWeight: 600 }} 
              axisLine={false} 
              tickLine={false} 
              dy={8}
            />
            <YAxis 
              reversed={metric === 'pace'} // Pace is reversed YAxis (smaller pace is plotted higher)
              tick={{ fill: '#8888aa', fontSize: 9, fontWeight: 700, fontFamily: 'monospace' }} 
              axisLine={false} 
              tickLine={false}
              tickFormatter={(v) => {
                if (metric === 'pace') {
                  const min = Math.floor(v);
                  const sec = Math.round((v - min) * 60);
                  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
                }
                return `${v.toFixed(1)} km/h`;
              }}
            />
            
            <Tooltip 
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const pt = payload[0].payload;
                return (
                  <div className="glass-card p-2.5 text-[10px] border border-white/10 backdrop-blur-xl shadow-2xl font-mono">
                    <p className="text-white font-extrabold font-sans mb-1.5">{label} ({pt.date})</p>
                    <div className="space-y-1">
                      <div className="flex justify-between gap-4">
                        <span className="text-dark-300">Distance:</span>
                        <span className="text-white font-bold">{pt.distance} km</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-dark-300">Duration:</span>
                        <span className="text-white font-bold">{pt.time} mins</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-rose-400">Pace:</span>
                        <span className="text-rose-400 font-black">{pt.paceFormatted} min/km</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-cyan-400">Speed:</span>
                        <span className="text-cyan-400 font-bold">{pt.speedKmh} km/h</span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />

            <Line
              type="monotone"
              dataKey={metric === 'pace' ? 'paceMinKm' : 'speedKmh'}
              name={metric === 'pace' ? 'Pace' : 'Speed'}
              stroke="#f43f5e"
              strokeWidth={2.5}
              dot={{ fill: '#f43f5e', strokeWidth: 1.5, stroke: '#1a1a24', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-1.5 mt-3 pt-3 border-t border-white/5 text-[8.5px] font-bold text-dark-400 uppercase tracking-wider text-center">
        <Activity className="w-3.5 h-3.5 text-rose-400" />
        {metric === 'pace' 
          ? 'Note: Y-axis is inverted. Higher values on chart represent faster paces.' 
          : 'Note: Standard speed scale. Higher represents faster speed (km/h).'
        }
      </div>
    </div>
  );
};
