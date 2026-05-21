import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Line } from 'recharts';
import { useWorkoutStore } from '../../store/workoutStore';
import { computeWeeklyOverload } from '../../utils/advancedAnalytics';
import { TrendingUp } from 'lucide-react';

export const WeeklyOverloadChart: React.FC = () => {
  const { workoutHistory, exercises } = useWorkoutStore();

  const data = useMemo(() => {
    return computeWeeklyOverload(workoutHistory, exercises);
  }, [workoutHistory, exercises]);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 border border-white/5 bg-dark-900/40 rounded-xl p-4">
        <TrendingUp className="w-8 h-8 text-dark-500 mb-2" />
        <p className="text-xs text-dark-300 font-bold uppercase tracking-wider">No Overload Data Yet</p>
        <p className="text-[10px] text-dark-400 mt-1">Complete strength sets to build overload trend</p>
      </div>
    );
  }

  // Calculate current vs last week comparison
  const latestPoint = data[data.length - 1];
  const previousPoint = data[data.length - 2];
  let tonnageChange = 0;
  if (latestPoint && previousPoint && previousPoint.tonnage > 0) {
    tonnageChange = Math.round(((latestPoint.tonnage - previousPoint.tonnage) / previousPoint.tonnage) * 100);
  }

  return (
    <div className="glass-card p-4 flex flex-col w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Weekly Progressive Overload</h3>
            <p className="text-[10px] text-dark-300 font-semibold mt-0.5">Dual-Axis Tonnage vs Hard Sets</p>
          </div>
        </div>

        {latestPoint && (
          <div className="text-right">
            <p className="text-[10px] font-bold text-dark-400 uppercase tracking-wider">This Week</p>
            <div className="flex items-center gap-1.5 mt-0.5 justify-end">
              <span className="text-xs font-black text-white font-mono">{latestPoint.tonnage.toLocaleString()} kg</span>
              {tonnageChange !== 0 && (
                <span className={`text-[9px] font-black font-mono px-1 rounded ${
                  tonnageChange > 0 
                    ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-rose-950/40 text-rose-400 border border-rose-500/20'
                }`}>
                  {tonnageChange > 0 ? '+' : ''}{tonnageChange}%
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="h-56 relative overflow-visible mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="overloadGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="week" 
              tick={{ fill: '#8888aa', fontSize: 9, fontWeight: 600 }} 
              axisLine={false} 
              tickLine={false} 
              dy={8}
            />
            {/* Left Y-axis (Tonnage) */}
            <YAxis 
              yAxisId="left" 
              tick={{ fill: '#818cf8', fontSize: 9, fontWeight: 700, fontFamily: 'monospace' }} 
              axisLine={false} 
              tickLine={false}
              tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}
            />
            {/* Right Y-axis (Sets) */}
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              tick={{ fill: '#f472b6', fontSize: 9, fontWeight: 700, fontFamily: 'monospace' }} 
              axisLine={false} 
              tickLine={false}
              dx={10}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const ton = payload.find(p => p.dataKey === 'tonnage')?.value ?? 0;
                const sets = payload.find(p => p.dataKey === 'sets')?.value ?? 0;
                return (
                  <div className="glass-card p-2.5 text-[10px] border border-white/10 backdrop-blur-xl shadow-2xl">
                    <p className="text-white font-extrabold mb-1.5 font-mono">{label}</p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-indigo-300 font-bold">Tonnage Volume:</span>
                        <span className="text-white font-black font-mono">{(ton as number).toLocaleString()} kg</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-pink-300 font-bold">Completed Sets:</span>
                        <span className="text-white font-black font-mono">{sets} sets</span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            {/* Tonnage Area */}
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="tonnage"
              name="Tonnage"
              stroke="#818cf8"
              fill="url(#overloadGrad)"
              strokeWidth={2.5}
            />
            {/* Completed Sets overlay line */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="sets"
              name="Sets"
              stroke="#f472b6"
              strokeWidth={2.5}
              dot={{ fill: '#f472b6', strokeWidth: 1.5, stroke: '#1a1a24', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-white/5">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(129,140,248,0.4)]"></span>
          <span className="text-[10px] font-bold text-dark-300 uppercase tracking-wider">Volume (Tonnage)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(244,114,182,0.4)]"></span>
          <span className="text-[10px] font-bold text-dark-300 uppercase tracking-wider">Hard Sets Count</span>
        </div>
      </div>
    </div>
  );
};
