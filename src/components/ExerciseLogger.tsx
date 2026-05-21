import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Plus, Trash2, Check, Clock, Volume2, VolumeX, Sparkles, Settings
} from 'lucide-react';
import { v4 as uuid } from 'uuid';
import confetti from 'canvas-confetti';
import { useWorkoutStore } from '../store/workoutStore';
import type { WorkoutSet, WeightMode, WeightUnit } from '../types/workout';

interface Props {
  exerciseId: string;
  exerciseName: string;
  onBack: () => void;
}

const weightModeOptions: { value: WeightMode; label: string }[] = [
  { value: 'machine', label: 'Machine/Cable' },
  { value: 'dumbbell', label: 'Dumbbell' },
  { value: 'each_side', label: 'Each Side' },
  { value: 'full_stack', label: 'Full Stack' },
  { value: 'bodyweight', label: 'Bodyweight' },
];

// ─── Web Audio API Sound Synthesizer ───────────────────────
function playRestChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    // Beat 1: High note (880Hz - A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);
    
    // Beat 2: Higher note (1109Hz - C#6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1109, now + 0.15);
    gain2.gain.setValueAtTime(0.2, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.5);
  } catch (e) {
    console.warn("Web Audio chime failed:", e);
  }
}

// ─── Floating Rest Timer Component ─────────────────────────
interface RestTimerProps {
  duration: number;
  onClose: () => void;
}

export function RestTimer({ duration: initialDuration, onClose }: RestTimerProps) {
  const [duration, setDuration] = useState(initialDuration);
  const [secondsRemaining, setSecondsRemaining] = useState(initialDuration);
  const [isMuted, setIsMuted] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    setSecondsRemaining(duration);
  }, [duration]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimerComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [duration]);

  const handleTimerComplete = () => {
    if (!isMuted) {
      playRestChime();
    }
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 100]);
    }
    onClose();
  };

  const adjustTime = (amount: number) => {
    setDuration(prev => Math.max(10, prev + amount));
  };

  // SVG circular progress calculation
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const progress = (secondsRemaining / duration) * 100;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 150 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 150 }}
      className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-6 mx-auto max-w-md"
    >
      <div className="glass-card p-5 flex flex-col items-center border border-accent-500/30 shadow-[0_0_30px_rgba(99,102,241,0.3)] relative overflow-hidden bg-dark-900/95 backdrop-blur-xl">
        {/* Progress backdrop glow */}
        <div className="absolute -top-24 w-48 h-48 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex w-full justify-between items-center mb-3 relative z-10">
          <span className="text-accent-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 animate-pulse text-indigo-400" /> REST INTERVAL
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-dark-300 hover:text-white p-1 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4.5 h-4.5 text-red-400" /> : <Volume2 className="w-4.5 h-4.5 text-emerald-400" />}
            </button>
            <button
              onClick={onClose}
              className="text-dark-200 hover:text-white text-xs font-semibold px-2 py-0.5 bg-dark-800 rounded border border-dark-600 transition-colors"
            >
              Skip
            </button>
          </div>
        </div>

        {/* Circular Countdown */}
        <div className="relative w-32 h-32 flex items-center justify-center my-2 relative z-10">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background ring */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              className="stroke-dark-700"
              strokeWidth="5"
              fill="transparent"
            />
            {/* Animated neon progress ring */}
            <motion.circle
              cx="64"
              cy="64"
              r={radius}
              stroke="url(#restGradient)"
              strokeWidth="5"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.8, ease: "linear" }}
            />
            <defs>
              <linearGradient id="restGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-2xl font-extrabold text-white tracking-tight tabular-nums">
              {formatTime(secondsRemaining)}
            </span>
            <span className="text-[0.6rem] text-dark-300 font-bold uppercase mt-0.5">
              of {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Quick adjustments */}
        <div className="flex items-center gap-3 w-full mt-3 relative z-10">
          <button
            onClick={() => adjustTime(-30)}
            className="flex-1 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-dark-200 hover:text-white text-xs font-semibold border border-dark-600 transition-colors"
          >
            -30s
          </button>
          <button
            onClick={() => adjustTime(30)}
            className="flex-1 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-dark-200 hover:text-white text-xs font-semibold border border-dark-600 transition-colors"
          >
            +30s
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Inline Set Grid Row Component ─────────────────────────
interface InlineSetRowProps {
  set: WorkoutSet;
  index: number;
  previousSet?: WorkoutSet;
  unit: WeightUnit;
  weightMode: WeightMode;
  isCardio: boolean;
  onUpdate: (updates: Partial<WorkoutSet>) => void;
  onDelete: () => void;
  onCompleteToggle: (completed: boolean, finalWeight: number | null, finalReps: number | null) => void;
}

export function InlineSetRow({
  set, index, previousSet, unit, weightMode, isCardio,
  onUpdate, onDelete, onCompleteToggle
}: InlineSetRowProps) {
  const [localWeight, setLocalWeight] = useState(set.weight !== null ? set.weight.toString() : '');
  const [localReps, setLocalReps] = useState(set.reps !== null ? set.reps.toString() : '');
  const [localTime, setLocalTime] = useState(set.time !== null && set.time !== undefined ? set.time.toString() : '');
  const [localDistance, setLocalDistance] = useState(set.distance !== null && set.distance !== undefined ? set.distance.toString() : '');
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [localNotes, setLocalNotes] = useState(set.notes ?? '');

  // Track if they beat a PR inline for high visual gratification (Gold Glow)
  const isPrSet = set.completed && previousSet && !isCardio && set.weight !== null && previousSet.weight !== null && (
    set.weight > previousSet.weight || (set.weight === previousSet.weight && set.reps !== null && previousSet.reps !== null && set.reps > previousSet.reps)
  );

  useEffect(() => {
    setLocalWeight(set.weight !== null ? set.weight.toString() : '');
    setLocalReps(set.reps !== null ? set.reps.toString() : '');
    setLocalTime(set.time !== null && set.time !== undefined ? set.time.toString() : '');
    setLocalDistance(set.distance !== null && set.distance !== undefined ? set.distance.toString() : '');
  }, [set.weight, set.reps, set.time, set.distance]);

  const handleWeightAdjust = (amount: number) => {
    if (set.completed) return;
    const currentVal = parseFloat(localWeight) || (previousSet?.weight ?? 0);
    const newVal = Math.max(0, currentVal + amount);
    const formatted = parseFloat(newVal.toFixed(2)).toString();
    setLocalWeight(formatted);
    onUpdate({ weight: newVal });
  };

  const handleRepsAdjust = (amount: number) => {
    if (set.completed) return;
    const currentVal = parseFloat(localReps) || (previousSet?.reps ?? 0);
    const newVal = Math.max(0, currentVal + amount);
    const formatted = newVal.toString();
    setLocalReps(formatted);
    onUpdate({ reps: newVal });
  };

  const handleTimeAdjust = (amount: number) => {
    if (set.completed) return;
    const currentVal = parseFloat(localTime) || (previousSet?.time ?? 0);
    const newVal = Math.max(0, currentVal + amount);
    const formatted = newVal.toString();
    setLocalTime(formatted);
    onUpdate({ time: newVal });
  };

  const handleDistanceAdjust = (amount: number) => {
    if (set.completed) return;
    const currentVal = parseFloat(localDistance) || (previousSet?.distance ?? 0);
    const newVal = Math.max(0, currentVal + amount);
    const formatted = parseFloat(newVal.toFixed(2)).toString();
    setLocalDistance(formatted);
    onUpdate({ distance: newVal });
  };

  const handleBlur = () => {
    if (isCardio) {
      onUpdate({
        time: localTime ? parseFloat(localTime) : undefined,
        distance: localDistance ? parseFloat(localDistance) : undefined,
      });
    } else {
      onUpdate({
        weight: localWeight ? parseFloat(localWeight) : null,
        reps: localReps ? parseFloat(localReps) : null,
      });
    }
  };

  const handleCheckboxClick = () => {
    if (!set.completed) {
      let finalWeight = localWeight ? parseFloat(localWeight) : null;
      let finalReps = localReps ? parseFloat(localReps) : null;
      let finalTime = localTime ? parseFloat(localTime) : undefined;
      let finalDistance = localDistance ? parseFloat(localDistance) : undefined;

      if (!isCardio) {
        if (finalWeight === null && previousSet?.weight !== undefined && previousSet.weight !== null) {
          finalWeight = previousSet.weight;
          setLocalWeight(previousSet.weight.toString());
        }
        if (finalReps === null && previousSet?.reps !== undefined && previousSet.reps !== null) {
          finalReps = previousSet.reps;
          setLocalReps(previousSet.reps.toString());
        }
        
        // Fallbacks if no history exists either
        if (finalWeight === null) finalWeight = 0;
        if (finalReps === null) finalReps = 0;

        onUpdate({ weight: finalWeight, reps: finalReps, completed: true });
        onCompleteToggle(true, finalWeight, finalReps);
      } else {
        if (finalTime === undefined && previousSet?.time !== undefined) {
          finalTime = previousSet.time;
          setLocalTime(previousSet.time.toString());
        }
        if (finalDistance === undefined && previousSet?.distance !== undefined) {
          finalDistance = previousSet.distance;
          setLocalDistance(previousSet.distance.toString());
        }
        
        if (finalTime === undefined) finalTime = 0;
        if (finalDistance === undefined) finalDistance = 0;

        onUpdate({ time: finalTime, distance: finalDistance, completed: true });
        onCompleteToggle(true, null, null);
      }
    } else {
      onUpdate({ completed: false });
      onCompleteToggle(false, null, null);
    }
  };

  let setTypeLabel = `${index + 1}`;
  let typeBg = 'bg-dark-600/50';
  let typeText = 'text-dark-200';
  if (set.isDropSet) {
    setTypeLabel = 'D';
    typeBg = 'bg-orange-500/15 border border-orange-500/30';
    typeText = 'text-orange-400 font-bold';
  } else if (set.toFailure) {
    setTypeLabel = 'F';
    typeBg = 'bg-yellow-500/15 border border-yellow-500/30';
    typeText = 'text-yellow-400 font-bold';
  } else if (set.restPause) {
    setTypeLabel = 'RP';
    typeBg = 'bg-purple-500/15 border border-purple-500/30';
    typeText = 'text-purple-400 font-bold';
  }

  const getPrevDisplay = () => {
    if (!previousSet) return '—';
    if (isCardio) {
      const parts = [];
      if (previousSet.time) parts.push(`${previousSet.time}m`);
      if (previousSet.distance) parts.push(`${previousSet.distance}${unit === 'kg' ? 'km' : 'mi'}`);
      return parts.join(' ');
    }
    return `${previousSet.weight ?? 0}${unit} x ${previousSet.reps ?? 0}`;
  };

  return (
    <div className={`border-b border-dark-700/30 py-2 last:border-0`}>
      <div className={`grid grid-cols-12 gap-1 items-center px-1.5 py-1.5 rounded-xl transition-all duration-300 ${
        isPrSet
          ? 'bg-yellow-500/10 border border-yellow-500/20 shadow-[0_0_12px_rgba(234,179,8,0.1)]'
          : set.completed
            ? 'bg-green-500/5 border border-green-500/10'
            : 'border border-transparent'
      }`}>
        {/* Set Indicator / Type Config Trigger */}
        <div className="col-span-2 flex items-center justify-start">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold select-none transition-all ${typeBg} ${typeText} hover:bg-dark-500`}
            title="Expand set configurations"
          >
            {setTypeLabel}
          </button>
        </div>

        {/* Previous Session Guide column */}
        <div className="col-span-3 text-xs text-dark-300 font-medium truncate text-center select-none italic">
          {getPrevDisplay()}
        </div>

        {/* Weight / Time Input Cell + Increments */}
        <div className="col-span-3 flex items-center justify-center">
          {!isCardio ? (
            <div className="flex items-center w-full relative">
              <button
                onClick={() => handleWeightAdjust(-2.5)}
                disabled={set.completed}
                className="w-5 h-7 flex items-center justify-center text-[10px] text-dark-400 hover:text-white bg-dark-700 rounded-l border border-dark-600 disabled:opacity-20 disabled:pointer-events-none transition-colors"
              >
                -
              </button>
              <input
                type="number"
                inputMode="decimal"
                value={localWeight}
                onChange={e => setLocalWeight(e.target.value)}
                onBlur={handleBlur}
                disabled={set.completed || weightMode === 'bodyweight'}
                placeholder={previousSet?.weight?.toString() ?? '0'}
                className="w-full h-7 bg-dark-800/80 text-center text-xs text-white font-bold border-y border-dark-600 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none disabled:opacity-50"
              />
              <button
                onClick={() => handleWeightAdjust(2.5)}
                disabled={set.completed}
                className="w-5 h-7 flex items-center justify-center text-[10px] text-dark-400 hover:text-white bg-dark-700 rounded-r border border-dark-600 disabled:opacity-20 disabled:pointer-events-none transition-colors"
              >
                +
              </button>
            </div>
          ) : (
            <div className="flex items-center w-full relative">
              <button
                onClick={() => handleTimeAdjust(-1)}
                disabled={set.completed}
                className="w-5 h-7 flex items-center justify-center text-[10px] text-dark-400 hover:text-white bg-dark-700 rounded-l border border-dark-600 disabled:opacity-20 disabled:pointer-events-none transition-colors"
              >
                -
              </button>
              <input
                type="number"
                inputMode="decimal"
                value={localTime}
                onChange={e => setLocalTime(e.target.value)}
                onBlur={handleBlur}
                disabled={set.completed}
                placeholder={previousSet?.time?.toString() ?? '0'}
                className="w-full h-7 bg-dark-800/80 text-center text-xs text-white font-bold border-y border-dark-600 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none disabled:opacity-50"
              />
              <button
                onClick={() => handleTimeAdjust(1)}
                disabled={set.completed}
                className="w-5 h-7 flex items-center justify-center text-[10px] text-dark-400 hover:text-white bg-dark-700 rounded-r border border-dark-600 disabled:opacity-20 disabled:pointer-events-none transition-colors"
              >
                +
              </button>
            </div>
          )}
        </div>

        {/* Reps / Distance Input Cell + Increments */}
        <div className="col-span-3 flex items-center justify-center">
          {!isCardio ? (
            <div className="flex items-center w-full relative">
              <button
                onClick={() => handleRepsAdjust(-1)}
                disabled={set.completed}
                className="w-5 h-7 flex items-center justify-center text-[10px] text-dark-400 hover:text-white bg-dark-700 rounded-l border border-dark-600 disabled:opacity-20 disabled:pointer-events-none transition-colors"
              >
                -
              </button>
              <input
                type="number"
                inputMode="numeric"
                value={localReps}
                onChange={e => setLocalReps(e.target.value)}
                onBlur={handleBlur}
                disabled={set.completed}
                placeholder={previousSet?.reps?.toString() ?? '0'}
                className="w-full h-7 bg-dark-800/80 text-center text-xs text-white font-bold border-y border-dark-600 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none disabled:opacity-50"
              />
              <button
                onClick={() => handleRepsAdjust(1)}
                disabled={set.completed}
                className="w-5 h-7 flex items-center justify-center text-[10px] text-dark-400 hover:text-white bg-dark-700 rounded-r border border-dark-600 disabled:opacity-20 disabled:pointer-events-none transition-colors"
              >
                +
              </button>
            </div>
          ) : (
            <div className="flex items-center w-full relative">
              <button
                onClick={() => handleDistanceAdjust(-0.1)}
                disabled={set.completed}
                className="w-5 h-7 flex items-center justify-center text-[10px] text-dark-400 hover:text-white bg-dark-700 rounded-l border border-dark-600 disabled:opacity-20 disabled:pointer-events-none transition-colors"
              >
                -
              </button>
              <input
                type="number"
                inputMode="decimal"
                value={localDistance}
                onChange={e => setLocalDistance(e.target.value)}
                onBlur={handleBlur}
                disabled={set.completed}
                placeholder={previousSet?.distance?.toString() ?? '0'}
                className="w-full h-7 bg-dark-800/80 text-center text-xs text-white font-bold border-y border-dark-600 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none disabled:opacity-50"
              />
              <button
                onClick={() => handleDistanceAdjust(0.1)}
                disabled={set.completed}
                className="w-5 h-7 flex items-center justify-center text-[10px] text-dark-400 hover:text-white bg-dark-700 rounded-r border border-dark-600 disabled:opacity-20 disabled:pointer-events-none transition-colors"
              >
                +
              </button>
            </div>
          )}
        </div>

        {/* Circular completion checkmark button */}
        <div className="col-span-1 flex items-center justify-end">
          <motion.button
            onClick={handleCheckboxClick}
            whileTap={{ scale: 0.8 }}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
              set.completed
                ? isPrSet
                  ? 'bg-yellow-500 text-white shadow-[0_0_12px_rgba(234,179,8,0.5)] border-none'
                  : 'bg-green-500 text-white shadow-[0_0_12px_rgba(34,197,94,0.4)] border-none'
                : 'border border-dark-500 hover:border-dark-400 bg-dark-800 text-transparent'
            }`}
          >
            <Check className="w-4 h-4 stroke-[3]" />
          </motion.button>
        </div>
      </div>

      {/* Expandable options drawer */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-1 px-1"
          >
            <div className="glass-card-sm p-3 space-y-3 bg-dark-800/60 border border-dark-700/50">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-accent-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> SET CUSTOMIZATIONS
                </span>
                <button
                  onClick={onDelete}
                  className="text-[10px] text-red-400 hover:text-red-300 font-bold flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/25 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> REMOVE SET
                </button>
              </div>

              {!isCardio && (
                <div className="grid grid-cols-2 gap-3">
                  {/* Set Type selection */}
                  <div>
                    <label className="text-[9px] text-dark-400 font-extrabold uppercase tracking-wider block mb-1">Set Type Badge</label>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onUpdate({ isDropSet: !set.isDropSet, toFailure: false, restPause: false })}
                        className={`px-2 py-1 rounded text-[9px] font-extrabold border transition-colors ${
                          set.isDropSet
                            ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                            : 'bg-dark-700 border-dark-600 text-dark-300'
                        }`}
                      >
                        Drop Set
                      </button>
                      <button
                        onClick={() => onUpdate({ toFailure: !set.toFailure, isDropSet: false, restPause: false })}
                        className={`px-2 py-1 rounded text-[9px] font-extrabold border transition-colors ${
                          set.toFailure
                            ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                            : 'bg-dark-700 border-dark-600 text-dark-300'
                        }`}
                      >
                        To Failure
                      </button>
                      <button
                        onClick={() => onUpdate({ restPause: !set.restPause, isDropSet: false, toFailure: false })}
                        className={`px-2 py-1 rounded text-[9px] font-extrabold border transition-colors ${
                          set.restPause
                            ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                            : 'bg-dark-700 border-dark-600 text-dark-300'
                        }`}
                      >
                        Rest Pause
                      </button>
                    </div>
                  </div>

                  {/* Assisted reps */}
                  <div>
                    <label className="text-[9px] text-dark-400 font-extrabold uppercase tracking-wider block mb-1">Assisted Reps</label>
                    <input
                      type="number"
                      placeholder="e.g. 2"
                      value={set.assistedReps ?? ''}
                      onChange={e => onUpdate({ assistedReps: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="w-full px-2.5 py-1 bg-dark-700 text-xs text-white rounded border border-dark-600 focus:border-accent-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Set-level Note input */}
              <div>
                <label className="text-[9px] text-dark-400 font-extrabold uppercase tracking-wider block mb-1">Set Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Challenging set, form got sloppy"
                  value={localNotes}
                  onChange={e => {
                    setLocalNotes(e.target.value);
                    onUpdate({ notes: e.target.value || undefined });
                  }}
                  onBlur={() => onUpdate({ notes: localNotes || undefined })}
                  className="w-full px-2.5 py-1.5 bg-dark-700 text-xs text-white rounded border border-dark-600 focus:border-accent-500 focus:outline-none"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Exercise Logger Page Component ───────────────────
export default function ExerciseLogger({ exerciseId, exerciseName, onBack }: Props) {
  const {
    activeWorkout, latestLogs, addSetToExercise, deleteSetFromExercise,
    exercises, settings, updateExercise, finishExercise, updateSetInExercise
  } = useWorkoutStore();

  const currentLog = activeWorkout?.exerciseLogs.find(l => l.exerciseId === exerciseId);
  const latestLog = latestLogs[exerciseId];
  const currentSets = currentLog?.sets ?? [];

  const exercise = exercises.find(e => e.id === exerciseId);
  const isCardio = exercise?.category === 'cardio';
  const initialUnit = exercise?.defaultUnit ?? settings.defaultUnit ?? 'kg';

  // Global logging settings
  const [unit, setUnit] = useState<WeightUnit>(initialUnit);
  const [weightMode, setWeightMode] = useState<WeightMode>(currentSets[0]?.weightMode ?? 'machine');
  const [showConfig, setShowConfig] = useState(false);

  // Rest Timer State
  const [showTimer, setShowTimer] = useState(false);
  const [timerDuration, setTimerDuration] = useState(90);

  // Automatically pre-populate active set rows on mount to minimize tap-friction
  useEffect(() => {
    if (!activeWorkout) return;
    
    const currentLog = activeWorkout.exerciseLogs.find(l => l.exerciseId === exerciseId);
    const setsCount = currentLog?.sets?.length ?? 0;

    if (setsCount === 0) {
      if (latestLog && latestLog.sets.length > 0) {
        latestLog.sets.forEach((prevSet, index) => {
          addSetToExercise(exerciseId, {
            id: uuid(),
            setNumber: index + 1,
            weight: null,
            reps: null,
            unit: prevSet.unit ?? 'kg',
            weightMode: prevSet.weightMode ?? 'machine',
            time: undefined,
            distance: undefined,
            speed: undefined,
            incline: undefined,
            completed: false,
          });
        });
      } else {
        // Fallback: 3 default empty sets
        for (let i = 1; i <= 3; i++) {
          addSetToExercise(exerciseId, {
            id: uuid(),
            setNumber: i,
            weight: null,
            reps: null,
            unit: initialUnit,
            weightMode: 'machine',
            completed: false,
          });
        }
      }
    }
  }, [exerciseId]);

  const handleGlobalUnitChange = (newUnit: WeightUnit) => {
    setUnit(newUnit);
    if (exercise) {
      updateExercise({ ...exercise, defaultUnit: newUnit });
    }
    // Update all existing sets to match the new unit selection
    currentSets.forEach(set => {
      updateSetInExercise(exerciseId, set.id, { unit: newUnit });
    });
  };

  const handleGlobalWeightModeChange = (newMode: WeightMode) => {
    setWeightMode(newMode);
    currentSets.forEach(set => {
      updateSetInExercise(exerciseId, set.id, { weightMode: newMode });
    });
  };

  const handleAddSet = () => {
    const nextSetNum = currentSets.length + 1;
    // Pre-populate with previous values if they exist, or the last entered set
    const lastSet = currentSets[currentSets.length - 1];
    
    addSetToExercise(exerciseId, {
      id: uuid(),
      setNumber: nextSetNum,
      weight: lastSet?.weight ?? null,
      reps: lastSet?.reps ?? null,
      unit: lastSet?.unit ?? unit,
      weightMode: lastSet?.weightMode ?? weightMode,
      time: lastSet?.time ?? undefined,
      distance: lastSet?.distance ?? undefined,
      speed: lastSet?.speed ?? undefined,
      incline: lastSet?.incline ?? undefined,
      completed: false,
    });
  };

  const handleCompleteToggle = (completed: boolean, weight: number | null, reps: number | null) => {
    if (completed) {
      // Haptic physical vibration feedback for logging
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

      // Confetti & double-vibrate if PR is broken
      if (latestLog) {
        const maxPrevWeight = Math.max(0, ...latestLog.sets.map(s => s.weight || 0));
        const maxPrevReps = Math.max(0, ...latestLog.sets.map(s => s.reps || 0));
        
        const beatWeight = weight !== null && weight > maxPrevWeight;
        const beatReps = reps !== null && reps > maxPrevReps && (weight || 0) >= maxPrevWeight;
        
        if (beatWeight || beatReps) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#a855f7', '#ec4899', '#facc15']
          });
          if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
          }
        }
      }

      // Auto slide-up rest intermission overlay
      setTimerDuration(90); // standard 90s rest interval
      setShowTimer(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="page-container"
    >
      {/* Back button header navigation */}
      <button onClick={onBack} className="flex items-center gap-1 text-accent-400 text-sm font-semibold mb-3 transition-colors hover:text-accent-300">
        <ChevronLeft className="w-4 h-4" /> Back to workout
      </button>

      <div className="flex items-start justify-between mb-2">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">{exerciseName}</h2>
          <p className="text-dark-300 text-xs font-semibold uppercase mt-0.5">
            {isCardio ? 'Cardiovascular Training' : `${exercise?.equipment ?? 'Machine'} / ${unit.toUpperCase()}`}
          </p>
        </div>

        {/* Global Configurations Settings cog */}
        <button
          onClick={() => setShowConfig(!showConfig)}
          className={`p-2 rounded-xl border border-dark-750 transition-all ${
            showConfig ? 'bg-accent-500/10 text-accent-400 border-accent-500/30' : 'bg-dark-800 text-dark-300 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Collapsible Global Settings panel */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="glass-card p-4 space-y-4 border border-dark-700 bg-dark-800/20">
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1">
                <Settings className="w-3.5 h-3.5 text-accent-400" /> GLOBAL EXERCISE PREFERENCES
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Weight Unit */}
                <div>
                  <label className="text-[10px] text-dark-300 font-bold uppercase tracking-wider block mb-1.5">Weight Unit</label>
                  <div className="flex gap-1 bg-dark-700 p-0.5 rounded-lg border border-dark-600">
                    {(['kg', 'lbs'] as WeightUnit[]).map(u => (
                      <button
                        key={u}
                        onClick={() => handleGlobalUnitChange(u)}
                        className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all uppercase ${
                          unit === u
                            ? 'bg-accent-500 text-white shadow-sm'
                            : 'text-dark-300 hover:text-white'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Weight Mode */}
                {!isCardio && (
                  <div>
                    <label className="text-[10px] text-dark-300 font-bold uppercase tracking-wider block mb-1.5">Equipment Type</label>
                    <select
                      value={weightMode}
                      onChange={e => handleGlobalWeightModeChange(e.target.value as WeightMode)}
                      className="w-full bg-dark-700 text-xs text-white border border-dark-600 rounded-lg py-1.5 px-2.5 focus:border-accent-500 focus:outline-none font-medium"
                    >
                      {weightModeOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spreadsheet Logging Table Grid */}
      <div className="glass-card p-3 mb-4 border border-dark-750/60 bg-dark-800/10">
        {/* Table Headers */}
        <div className="grid grid-cols-12 gap-1 border-b border-dark-700/50 pb-2 mb-1 px-1.5 text-center">
          <div className="col-span-2 text-left text-[9px] text-dark-400 font-extrabold uppercase tracking-wider">Set</div>
          <div className="col-span-3 text-[9px] text-dark-400 font-extrabold uppercase tracking-wider">Previous</div>
          <div className="col-span-3 text-[9px] text-dark-400 font-extrabold uppercase tracking-wider">
            {isCardio ? 'Time' : `Weight (${unit})`}
          </div>
          <div className="col-span-3 text-[9px] text-dark-400 font-extrabold uppercase tracking-wider">
            {isCardio ? 'Distance' : 'Reps'}
          </div>
          <div className="col-span-1 text-right text-[9px] text-dark-400 font-extrabold uppercase tracking-wider">✓</div>
        </div>

        {/* Set rows list */}
        <div className="space-y-1.5">
          {currentSets.map((set, idx) => (
            <InlineSetRow
              key={set.id}
              set={set}
              index={idx}
              previousSet={latestLog?.sets[idx]}
              unit={unit}
              weightMode={set.weightMode ?? weightMode}
              isCardio={isCardio}
              onUpdate={(updates) => updateSetInExercise(exerciseId, set.id, updates)}
              onDelete={() => deleteSetFromExercise(exerciseId, set.id)}
              onCompleteToggle={handleCompleteToggle}
            />
          ))}
        </div>
      </div>

      {/* Action triggers */}
      <div className="flex flex-col gap-3">
        <motion.button
          onClick={handleAddSet}
          className="w-full p-3 rounded-xl border border-dashed border-dark-500 hover:border-dark-400 text-dark-200 hover:text-white font-bold flex items-center justify-center gap-1.5 bg-dark-800/30 transition-all text-sm"
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-4 h-4" /> Add Set Row
        </motion.button>

        <motion.button
          onClick={() => {
            finishExercise(exerciseId);
            onBack();
          }}
          className="w-full p-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-95 transition-all text-sm bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-[0_4px_15px_rgba(16,185,129,0.2)]"
          whileTap={{ scale: 0.98 }}
        >
          <Check className="w-5 h-5 stroke-[2.5]" />
          Finish Exercise Logging
        </motion.button>
      </div>

      {/* Sliding recovery intermission rest timer */}
      <AnimatePresence>
        {showTimer && (
          <RestTimer
            duration={timerDuration}
            onClose={() => setShowTimer(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
