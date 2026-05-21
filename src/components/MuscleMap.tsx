import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkoutStore } from '../store/workoutStore';
import { calculateMuscleRecovery } from '../utils/recoveryCalculator';
import type { MuscleRecoveryState } from '../utils/recoveryCalculator';
import { Activity, RefreshCw } from 'lucide-react';

interface MuscleMapProps {
  onSelectMuscles?: (muscleIds: string[]) => void;
  selectedMuscleIds?: string[];
  multiSelect?: boolean;
}

export const MuscleMap: React.FC<MuscleMapProps> = ({
  onSelectMuscles,
  selectedMuscleIds = [],
  multiSelect = true,
}) => {
  // ─── STORES ───────────────────────────────────────────────
  const { workoutHistory, exercises, muscleGroups } = useWorkoutStore();

  // ─── LOCAL STATE ──────────────────────────────────────────
  const [view, setView] = useState<'front' | 'back'>('front');
  const [hoveredGroup, setHoveredGroup] = useState<MuscleRecoveryState | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // ─── CALCULATE RECOVERY STATES ─────────────────────────────
  const recoveryMap = useMemo<Record<string, MuscleRecoveryState>>(() => {
    const map: Record<string, MuscleRecoveryState> = {};
    muscleGroups.forEach(mg => {
      map[mg.id] = calculateMuscleRecovery(workoutHistory, exercises, mg.id);
    });
    return map;
  }, [workoutHistory, exercises, muscleGroups]);

  // ─── INTERACTIONS ──────────────────────────────────────────
  const handleMuscleClick = (muscleId: string) => {
    if (!onSelectMuscles) return;
    
    let newSelection = [...selectedMuscleIds];
    if (newSelection.includes(muscleId)) {
      newSelection = newSelection.filter(id => id !== muscleId);
    } else {
      if (multiSelect) {
        newSelection.push(muscleId);
      } else {
        newSelection = [muscleId];
      }
    }
    onSelectMuscles(newSelection);
  };

  const handleMouseMove = (e: React.MouseEvent, muscleId: string) => {
    const recoveryState = recoveryMap[muscleId];
    if (!recoveryState) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const mapContainer = e.currentTarget.parentElement?.getBoundingClientRect();

    if (mapContainer) {
      // Calculate coordinates relative to the map container to prevent scrolling jitters
      setTooltipPos({
        x: rect.left - mapContainer.left + rect.width / 2,
        y: rect.top - mapContainer.top - 10,
      });
    }
    setHoveredGroup(recoveryState);
  };

  const handleMouseLeave = () => {
    setHoveredGroup(null);
  };

  // Get localized display name
  const getGroupName = (id: string) => {
    return muscleGroups.find(m => m.id === id)?.name || id.toUpperCase();
  };

  // ─── SHARED PATH RENDERER ──────────────────────────────────
  const renderMusclePath = (muscleId: string, d: string, label: string) => {
    const isSelected = selectedMuscleIds.includes(muscleId);
    const recState = recoveryMap[muscleId];
    const fillColor = recState ? recState.color : 'hsl(215, 25%, 27%)';
    const isHovered = hoveredGroup?.muscleGroupId === muscleId;

    return (
      <path
        d={d}
        fill={fillColor}
        className={`transition-all duration-300 ease-out cursor-pointer stroke-slate-950/60
          ${isSelected ? 'stroke-cyan-400 stroke-[2] scale-[1.01]' : 'stroke-[1.2]'}
          ${isHovered ? 'opacity-90 contrast-125' : 'opacity-80'}
        `}
        style={{
          filter: isHovered && recState ? `drop-shadow(0 0 6px ${recState.color})` : undefined,
          vectorEffect: 'non-scaling-stroke',
          transformOrigin: '100px 200px',
        }}
        onClick={() => handleMuscleClick(muscleId)}
        onMouseMove={(e) => handleMouseMove(e, muscleId)}
        onMouseLeave={handleMouseLeave}
        aria-label={`${label} - Recovery: ${recState?.mrs ?? 100}%`}
      />
    );
  };

  return (
    <div className="relative flex flex-col items-center w-full p-4 border rounded-2xl bg-dark-900/60 border-white/5 backdrop-blur-md shadow-xl overflow-visible">
      {/* View Selector Header */}
      <div className="flex items-center justify-between w-full mb-4">
        <div className="flex flex-col">
          <h3 className="text-sm font-extrabold text-white tracking-wide uppercase flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
            Muscle Recovery Map
          </h3>
          <p className="text-[10px] text-dark-300 font-semibold tracking-wide mt-0.5">Based on recent set volumes</p>
        </div>
        <div className="flex p-0.5 border rounded-lg bg-dark-950/80 border-white/5">
          <button
            onClick={() => setView(view === 'front' ? 'back' : 'front')}
            className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-md text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-all"
          >
            <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin-slow" />
            {view === 'front' ? 'Show Back' : 'Show Front'}
          </button>
        </div>
      </div>

      {/* SVG Canvas Map Area with 2.5D Rotation container */}
      <div className="relative w-full h-[320px] flex justify-center bg-dark-950/20 rounded-xl border border-white/5 overflow-visible p-2"
        style={{ perspective: 1200 }}
      >
        {/* Render Cardio Systemic indicator behind the body */}
        {recoveryMap['cardio'] && (
          <div
            className={`absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2 py-1 rounded-full border transition-all cursor-pointer ${
              selectedMuscleIds.includes('cardio')
                ? 'border-orange-500 bg-orange-950/30 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.15)]'
                : 'border-white/5 bg-dark-900/60 text-dark-200 hover:border-white/10'
            }`}
            onClick={() => handleMuscleClick('cardio')}
            onMouseMove={(e) => handleMouseMove(e, 'cardio')}
            onMouseLeave={handleMouseLeave}
          >
            <span className="relative flex w-2 h-2">
              <span
                className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping"
                style={{ backgroundColor: recoveryMap['cardio'].color }}
              ></span>
              <span
                className="relative inline-flex w-2 h-2 rounded-full"
                style={{ backgroundColor: recoveryMap['cardio'].color }}
              ></span>
            </span>
            <span className="text-[9px] font-black uppercase tracking-wider font-mono">
              Cardio: {recoveryMap['cardio'].mrs}%
            </span>
          </div>
        )}

        {/* Double-Sided Framer Motion Card */}
        <motion.div
          className="relative w-full h-full flex justify-center items-center overflow-visible"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: view === 'front' ? 0 : 180 }}
          transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
        >
          {/* FRONT VIEW (Backface Hidden) */}
          <div 
            className="absolute inset-0 flex justify-center items-center overflow-visible"
            style={{ 
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            <svg
              viewBox="0 0 200 400"
              className="w-auto h-full max-h-[290px] select-none overflow-visible filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]"
            >
              {/* Head & Neck Base Reference Graphic (Non-clickable) */}
              <path
                d="M 90 60 C 90 40, 110 40, 110 60 L 105 85 L 95 85 Z"
                fill="#1e293b"
                className="stroke-[1.5] stroke-slate-900/60"
              />
              <g id="front-view-group">
                {/* Chest */}
                {renderMusclePath('chest', 'M 100 110 L 75 110 L 70 135 L 100 140 Z', 'Left Chest')}
                {renderMusclePath('chest', 'M 100 110 L 125 110 L 130 135 L 100 140 Z', 'Right Chest')}

                {/* Shoulders */}
                {renderMusclePath('shoulders', 'M 75 110 L 60 115 L 63 135 L 70 135 Z', 'Left Deltoid')}
                {renderMusclePath('shoulders', 'M 125 110 L 140 115 L 137 135 L 130 135 Z', 'Right Deltoid')}

                {/* Biceps */}
                {renderMusclePath('biceps', 'M 60 115 L 48 135 L 53 155 L 63 135 Z', 'Left Bicep')}
                {renderMusclePath('biceps', 'M 140 115 L 152 135 L 147 155 L 137 135 Z', 'Right Bicep')}

                {/* Forearms */}
                {renderMusclePath('forearms', 'M 53 155 L 40 190 L 48 200 L 58 175 Z', 'Left Forearm')}
                {renderMusclePath('forearms', 'M 147 155 L 160 190 L 152 200 L 142 175 Z', 'Right Forearm')}

                {/* Abs */}
                {renderMusclePath('abs', 'M 80 142 L 120 142 L 118 200 L 82 200 Z', 'Abs/Core')}

                {/* Legs (Quads) */}
                {renderMusclePath('legs', 'M 80 205 L 100 205 L 100 300 L 75 300 Z', 'Left Quad')}
                {renderMusclePath('legs', 'M 100 205 L 120 205 L 125 300 L 100 300 Z', 'Right Quad')}
              </g>
            </svg>
          </div>

          {/* BACK VIEW (Flipped 180 and Backface Hidden) */}
          <div 
            className="absolute inset-0 flex justify-center items-center overflow-visible"
            style={{ 
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <svg
              viewBox="0 0 200 400"
              className="w-auto h-full max-h-[290px] select-none overflow-visible filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]"
            >
              {/* Head & Neck Base Reference Graphic (Non-clickable) */}
              <path
                d="M 90 60 C 90 40, 110 40, 110 60 L 105 85 L 95 85 Z"
                fill="#1e293b"
                className="stroke-[1.5] stroke-slate-900/60"
              />
              <g id="back-view-group">
                {/* Back / Lats */}
                {renderMusclePath('back', 'M 100 85 L 85 100 L 75 110 L 125 110 L 115 100 Z', 'Upper Traps')}
                {renderMusclePath('back', 'M 100 110 L 75 110 L 80 160 L 100 165 Z', 'Left Lat')}
                {renderMusclePath('back', 'M 100 110 L 125 110 L 120 160 L 100 165 Z', 'Right Lat')}

                {/* Rear Shoulders */}
                {renderMusclePath('shoulders', 'M 75 110 L 68 112 L 65 125 L 73 125 Z', 'Left Rear Delt')}
                {renderMusclePath('shoulders', 'M 125 110 L 132 112 L 135 125 L 127 125 Z', 'Right Rear Delt')}

                {/* Triceps */}
                {renderMusclePath('triceps', 'M 65 115 L 53 135 L 56 150 L 68 135 Z', 'Left Tricep')}
                {renderMusclePath('triceps', 'M 135 115 L 147 135 L 144 150 L 132 135 Z', 'Right Tricep')}

                {/* Glutes & Hamstrings & Calves (Mapped to legs group) */}
                {renderMusclePath('legs', 'M 78 200 L 122 200 L 120 230 L 100 240 L 80 230 Z', 'Glutes')}
                {renderMusclePath('legs', 'M 80 232 L 100 238 L 100 310 L 78 310 Z', 'Left Hamstring')}
                {renderMusclePath('legs', 'M 100 238 L 120 232 L 122 310 L 100 310 Z', 'Right Hamstring')}
                {renderMusclePath('legs', 'M 78 312 L 98 312 L 95 380 L 82 380 Z', 'Left Calf')}
                {renderMusclePath('legs', 'M 102 312 L 122 312 L 118 380 L 105 380 Z', 'Right Calf')}
              </g>
            </svg>
          </div>
        </motion.div>

        {/* Dynamic Hover Tooltip overlay */}
        <AnimatePresence>
          {hoveredGroup && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute z-30 flex flex-col p-2.5 border rounded-xl shadow-2xl pointer-events-none bg-dark-950/95 border-white/10 backdrop-blur-xl w-40"
              style={{
                left: `${tooltipPos.x}px`,
                top: `${tooltipPos.y}px`,
                transform: 'translate(-50%, -100%)',
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black text-slate-100 uppercase tracking-wider">
                  {getGroupName(hoveredGroup.muscleGroupId)}
                </span>
                <span
                  className="text-[9px] px-1 py-0.5 rounded font-mono font-black"
                  style={{
                    backgroundColor: `${hoveredGroup.color}20`,
                    color: hoveredGroup.color,
                  }}
                >
                  {hoveredGroup.mrs}%
                </span>
              </div>
              
              {/* Dynamic Status Progress Bar */}
              <div className="w-full h-1 rounded-full bg-white/5 overflow-hidden mb-1.5">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${hoveredGroup.mrs}%`,
                    backgroundColor: hoveredGroup.color,
                  }}
                ></div>
              </div>
              
              <div className="flex flex-col gap-0.5 text-[8px] text-dark-300 font-mono">
                <div className="flex justify-between">
                  <span>Fatigue Load:</span>
                  <span className="text-white font-bold">{hoveredGroup.aml} kg*reps</span>
                </div>
                <div className="flex justify-between">
                  <span>Readiness:</span>
                  <span
                    className="font-black uppercase"
                    style={{ color: hoveredGroup.mrs > 70 ? '#10b981' : hoveredGroup.mrs > 40 ? '#fb923c' : '#f43f5e' }}
                  >
                    {hoveredGroup.mrs > 70 ? 'TRAIN' : hoveredGroup.mrs > 40 ? 'CAUTION' : 'REST'}
                  </span>
                </div>
              </div>
              
              <div className="mt-1.5 text-[7.5px] text-center text-dark-400 italic font-semibold uppercase tracking-wider">
                Click to filter Exercises
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected Indicator Summary */}
      {selectedMuscleIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5 justify-center mt-3 w-full">
          {selectedMuscleIds.map(id => (
            <span
              key={id}
              onClick={() => handleMuscleClick(id)}
              className="flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-bold rounded-lg border bg-dark-950/80 border-white/5 text-dark-100 hover:border-white/10 cursor-pointer transition-colors"
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: recoveryMap[id]?.color }}
              ></span>
              {getGroupName(id)}
              <span className="text-dark-400 font-bold">×</span>
            </span>
          ))}
          <button
            onClick={() => onSelectMuscles && onSelectMuscles([])}
            className="text-[9px] font-black text-cyan-400 hover:text-cyan-300 px-1.5 tracking-wider uppercase"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};
