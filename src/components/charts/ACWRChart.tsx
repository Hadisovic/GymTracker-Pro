import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea, ReferenceLine } from 'recharts';
import { useWorkoutStore } from '../../store/workoutStore';
import { computeACWRTrend } from '../../utils/advancedAnalytics';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

export const ACWRChart: React.FC = () => {
  const { workoutHistory } = useWorkoutStore();

  const data = useMemo(() => {
    // Generate trend for the last 14 days
    return computeACWRTrend(workoutHistory, new Date(), 14);
  }, [workoutHistory]);

  const hasVolume = useMemo(() => {
    return data.some(d => d.acuteLoad > 0);
  }, [data]);

  if (!hasVolume) {
    return (
      <div className="flex flex-col items-center justify-center h-48 border border-white/5 bg-dark-900/40 rounded-xl p-4">
        <ShieldCheck className="w-8 h-8 text-dark-500 mb-2" />
        <p className="text-xs text-dark-300 font-bold uppercase tracking-wider">No fatigue index computed</p>
        <p className="text-[10px] text-dark-400 mt-1">Complete strength sessions over 2-3 weeks to calculate ACWR</p>
      </div>
    );
  }

  // Get current ACWR status
  const currentPoint = data[data.length - 1];
  const currentAcwr = currentPoint?.acwr ?? 1.0;
  
  let statusText = 'Safe (Sweet Spot)';
  let statusColorClass = 'text-emerald-400 border-emerald-500/20 bg-emerald-950/30';
  let statusIcon = <ShieldCheck className="w-4 h-4 text-emerald-400" />;
  let explanation = 'Your training load is perfectly balanced. Excellent progression rate!';

  if (currentAcwr > 1.5) {
    statusText = 'Danger (Overreaching)';
    statusColorClass = 'text-rose-400 border-rose-500/20 bg-rose-950/30';
    statusIcon = <ShieldAlert className="w-4 h-4 text-rose-400" />;
    explanation = 'Training load is spiking too fast! High risk of injury. Consider a deload.';
  } else if (currentAcwr < 0.8 && currentAcwr > 0) {
    statusText = 'Undertrained';
    statusColorClass = 'text-amber-400 border-amber-500/20 bg-amber-950/30';
    statusIcon = <ShieldAlert className="w-4 h-4 text-amber-400" />;
    explanation = 'Your workload has dropped. Fitness is decaying. Time to ramp up volume safely.';
  }

  return (
    <div className="glass-card p-4 flex flex-col w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <ShieldCheck className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Acute-to-Chronic Workload Ratio</h3>
            <p className="text-[10px] text-dark-300 font-semibold mt-0.5">Fatigue vs Fitness Injury Safeguard</p>
          </div>
        </div>

        {currentPoint && (
          <div className="text-right">
            <p className="text-[10px] font-bold text-dark-400 uppercase tracking-wider">Index</p>
            <span className="text-xs font-black text-white font-mono mt-0.5 inline-block">{currentAcwr}</span>
          </div>
        )}
      </div>

      {/* Real-time safeguard status card */}
      <div className={`flex items-start gap-2.5 p-3 rounded-xl border mb-4 transition-colors ${statusColorClass}`}>
        <div className="mt-0.5">{statusIcon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-wide leading-none">{statusText}</p>
          <p className="text-[10px] opacity-80 leading-normal mt-1">{explanation}</p>
        </div>
      </div>

      <div className="h-48 relative overflow-visible mt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="acwrGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              tickFormatter={(d) => d.split('-').slice(1).join('/')} // Convert YYYY-MM-DD to MM/DD
              tick={{ fill: '#8888aa', fontSize: 9, fontWeight: 600 }} 
              axisLine={false} 
              tickLine={false} 
              dy={8}
            />
            <YAxis 
              domain={[0, (v: number) => Math.max(v, 2.0)]}
              tick={{ fill: '#8888aa', fontSize: 9, fontWeight: 700, fontFamily: 'monospace' }} 
              axisLine={false} 
              tickLine={false}
            />
            
            {/* Reference Areas for Gabbett Zones */}
            <ReferenceArea y1={0.8} y2={1.3} fill="rgba(16,185,129,0.06)" />
            <ReferenceArea y1={1.5} y2={3.0} fill="rgba(244,63,94,0.08)" />
            
            {/* Target Baseline Dotted Line */}
            <ReferenceLine y={1.0} stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" />
            
            <Tooltip 
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const pt = payload[0].payload;
                return (
                  <div className="glass-card p-2.5 text-[10px] border border-white/10 backdrop-blur-xl shadow-2xl font-mono">
                    <p className="text-white font-extrabold font-sans mb-1.5">{label}</p>
                    <div className="space-y-1">
                      <div className="flex justify-between gap-4">
                        <span className="text-dark-300">ACWR Ratio:</span>
                        <span className="text-orange-400 font-black">{pt.acwr}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-indigo-400">Acute Vol (7d):</span>
                        <span className="text-white font-bold">{pt.acuteLoad.toLocaleString()} kg</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-pink-400">Chronic Vol (28d avg):</span>
                        <span className="text-white font-bold">{pt.chronicLoad.toLocaleString()} kg</span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="acwr"
              name="ACWR"
              stroke="#f97316"
              fill="url(#acwrGrad)"
              strokeWidth={2.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-5 mt-4 pt-3 border-t border-white/5 text-[9px] text-dark-400 uppercase tracking-wider font-bold">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-1.5 bg-rose-500/20 border border-rose-500/40 rounded-sm"></span>
          <span>Danger Spike ({'>'}1.5)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-1.5 bg-emerald-500/20 border border-emerald-500/40 rounded-sm"></span>
          <span>Sweet Spot (0.8 - 1.3)</span>
        </div>
      </div>
    </div>
  );
};
