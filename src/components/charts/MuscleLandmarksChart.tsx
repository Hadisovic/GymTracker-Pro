import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useWorkoutStore } from '../../store/workoutStore';
import { computeHypertrophyLandmarks } from '../../utils/advancedAnalytics';
import { Target, Info } from 'lucide-react';

export const MuscleLandmarksChart: React.FC = () => {
  const { workoutHistory, exercises, muscleGroups } = useWorkoutStore();

  const data = useMemo(() => {
    // Calculate landmarks in last 7 days
    return computeHypertrophyLandmarks(workoutHistory, exercises, muscleGroups);
  }, [workoutHistory, exercises, muscleGroups]);

  // Check if there is any set history in the last 7 days
  const hasData = useMemo(() => {
    return data.some(d => d.completedSets > 0);
  }, [data]);

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-48 border border-white/5 bg-dark-900/40 rounded-xl p-4">
        <Target className="w-8 h-8 text-dark-500 mb-2" />
        <p className="text-xs text-dark-300 font-bold uppercase tracking-wider">No Working Sets This Week</p>
        <p className="text-[10px] text-dark-400 mt-1">Perform strength workouts to track volume landmarks</p>
      </div>
    );
  }

  // Find maximum value to scale the XAxis appropriately
  const maxSetsValue = Math.max(...data.map(d => Math.max(d.completedSets, d.mrv)), 25);

  return (
    <div className="glass-card p-4 flex flex-col w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Hypertrophy Volume Landmarks</h3>
            <p className="text-[10px] text-dark-300 font-semibold mt-0.5">Completed Sets vs MEV / MRV Science</p>
          </div>
        </div>
      </div>

      <div className="h-72 mt-2 overflow-visible relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 10, left: -25, bottom: 5 }}
            barGap={2}
          >
            <XAxis 
              type="number" 
              domain={[0, maxSetsValue + 2]} 
              tick={{ fill: '#8888aa', fontSize: 9, fontWeight: 600, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              type="category" 
              dataKey="muscleGroupName" 
              tick={{ fill: '#fff', fontSize: 10, fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
              width={75}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                
                let zoneLabel = 'Under MEV (No growth)';
                let zoneColor = 'text-rose-400';
                
                if (d.completedSets >= d.mrv) {
                  zoneLabel = 'Over MRV (Danger/Overreaching)';
                  zoneColor = 'text-red-500';
                } else if (d.completedSets >= d.mavMin) {
                  zoneLabel = 'MAV (Max Adaptive Volume - OPTIMAL)';
                  zoneColor = 'text-emerald-400';
                } else if (d.completedSets >= d.mev) {
                  zoneLabel = 'MEV (Minimum Effective Volume)';
                  zoneColor = 'text-cyan-400';
                }

                return (
                  <div className="glass-card p-2.5 text-[10px] border border-white/10 backdrop-blur-xl shadow-2xl">
                    <p className="text-white font-extrabold mb-1.5 uppercase">{d.muscleGroupName}</p>
                    <div className="space-y-1 font-mono">
                      <div className="flex justify-between gap-4">
                        <span className="text-dark-300">Completed Sets:</span>
                        <span className="text-white font-black">{d.completedSets} sets</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-cyan-400">MEV Landmark:</span>
                        <span className="text-cyan-400 font-bold">{d.mev} sets</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-rose-400">MRV Landmark:</span>
                        <span className="text-rose-400 font-bold">{d.mrv} sets</span>
                      </div>
                      <div className="pt-1.5 mt-1.5 border-t border-white/5 flex flex-col">
                        <span className="text-[8px] text-dark-400 font-sans uppercase font-bold">Training Zone:</span>
                        <span className={`text-[9.5px] font-sans font-black ${zoneColor}`}>{zoneLabel}</span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />

            {/* MEV Reference Shadow Bar (renders first so completed is on top) */}
            <Bar 
              dataKey="mev" 
              name="MEV" 
              fill="rgba(34,211,238,0.12)" 
              radius={[0, 4, 4, 0]}
              barSize={6}
            />
            {/* Completed Sets Bar */}
            <Bar 
              dataKey="completedSets" 
              name="Sets" 
              radius={[0, 4, 4, 0]}
              barSize={12}
            >
              {data.map((entry, index) => {
                let color = 'hsl(215, 25%, 35%)'; // Gray default
                if (entry.completedSets >= entry.mrv) {
                  color = '#f43f5e'; // Danger rose red
                } else if (entry.completedSets >= entry.mavMin) {
                  color = '#10b981'; // Green sweet spot
                } else if (entry.completedSets >= entry.mev) {
                  color = '#06b6d4'; // Cyan MEV
                }
                return <Cell key={`cell-${index}`} fill={color} />;
              })}
            </Bar>
            {/* MRV Marker indicator bar */}
            <Bar 
              dataKey="mrv" 
              name="MRV" 
              fill="rgba(244,63,94,0.12)" 
              radius={[0, 4, 4, 0]}
              barSize={4}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Science guidelines */}
      <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-1.5 rounded-sm bg-cyan-500"></span>
            <span className="text-[8.5px] font-bold text-dark-300 uppercase tracking-wider">MEV (Min Effective)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-1.5 rounded-sm bg-emerald-500"></span>
            <span className="text-[8.5px] font-bold text-dark-300 uppercase tracking-wider">MAV (Max Adaptive)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-1.5 rounded-sm bg-rose-500"></span>
            <span className="text-[8.5px] font-bold text-dark-300 uppercase tracking-wider">MRV (Max Recoverable)</span>
          </div>
        </div>
        <div className="flex items-start gap-1.5 p-2 rounded-lg bg-dark-950/40 border border-white/5 text-[9px] text-dark-400">
          <Info className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <p className="leading-normal">
            For muscular growth, aim for completed sets to sit between <strong className="text-cyan-400">MEV</strong> and <strong className="text-rose-400">MRV</strong>. Exceeding MRV leads to excessive systemic fatigue and overtraining.
          </p>
        </div>
      </div>
    </div>
  );
};
