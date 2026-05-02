import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Plus, Save, Trash2, ChevronDown, ChevronUp,
  Zap, AlertTriangle
} from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { useWorkoutStore } from '../store/workoutStore';
import type { WorkoutSet, WeightMode, WeightUnit, DropEntry } from '../types/workout';

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

export default function ExerciseLogger({ exerciseId, exerciseName, onBack }: Props) {
  const {
    activeWorkout, latestLogs, addSetToExercise, deleteSetFromExercise,
  } = useWorkoutStore();

  const currentLog = activeWorkout?.exerciseLogs.find(l => l.exerciseId === exerciseId);
  const latestLog = latestLogs[exerciseId];
  const currentSets = currentLog?.sets ?? [];

  const [isAddingSet, setIsAddingSet] = useState(false);
  const [showRef, setShowRef] = useState(true);

  // Form state
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [unit, setUnit] = useState<WeightUnit>('kg');
  const [weightMode, setWeightMode] = useState<WeightMode>('machine');
  const [notes, setNotes] = useState('');
  const [isDropSet, setIsDropSet] = useState(false);
  const [drops, setDrops] = useState<DropEntry[]>([]);
  const [assistedReps, setAssistedReps] = useState('');
  const [hasAssistedReps, setHasAssistedReps] = useState(false);
  const [restPause, setRestPause] = useState(false);
  const [toFailure, setToFailure] = useState(false);

  const resetForm = () => {
    setWeight('');
    setReps('');
    setNotes('');
    setIsDropSet(false);
    setDrops([]);
    setAssistedReps('');
    setHasAssistedReps(false);
    setRestPause(false);
    setToFailure(false);
  };

  const addDrop = () => {
    setDrops(prev => [...prev, { weight: 0, reps: null }]);
  };

  const updateDrop = (idx: number, field: keyof DropEntry, value: unknown) => {
    setDrops(prev => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d));
  };

  const removeDrop = (idx: number) => {
    setDrops(prev => prev.filter((_, i) => i !== idx));
  };

  const saveSet = () => {
    const newSet: WorkoutSet = {
      id: uuid(),
      setNumber: currentSets.length + 1,
      weight: weight ? parseFloat(weight) : null,
      reps: reps ? parseFloat(reps) : null,
      unit,
      weightMode,
      notes: notes || undefined,
      isDropSet: isDropSet || undefined,
      drops: isDropSet && drops.length > 0 ? drops : undefined,
      assistedReps: hasAssistedReps && assistedReps ? parseInt(assistedReps) : undefined,
      restPause: restPause || undefined,
      toFailure: toFailure || undefined,
      timestamp: new Date().toISOString(),
    };

    addSetToExercise(exerciseId, newSet);
    resetForm();
    setIsAddingSet(false);
  };

  const formatSetDisplay = (set: WorkoutSet) => {
    const parts: string[] = [];
    if (set.weightMode === 'bodyweight') {
      parts.push('BW');
    } else if (set.weight !== null) {
      parts.push(`${set.weight}${set.unit}`);
      if (set.weightMode === 'each_side') parts.push('(each side)');
    }
    if (set.reps !== null) parts.push(`× ${set.reps}`);
    else parts.push('× ?');
    return parts.join(' ');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.2 }}
      className="page-container"
    >
      {/* Header */}
      <button onClick={onBack} className="flex items-center gap-1 text-accent-400 text-sm font-medium mb-3">
        <ChevronLeft className="w-4 h-4" /> Back to exercises
      </button>

      <h2 className="text-xl font-bold text-white mb-1">{exerciseName}</h2>

      {/* Latest Log Reference */}
      {latestLog && (
        <div className="mb-4">
          <button
            onClick={() => setShowRef(!showRef)}
            className="flex items-center gap-2 text-dark-300 text-xs font-medium mb-2"
          >
            Previous Log ({latestLog.sessionLabel})
            {showRef ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <AnimatePresence>
            {showRef && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="glass-card-sm p-3 space-y-1.5">
                  {latestLog.sets.map((set, i) => (
                    <div key={i} className="ref-text flex items-center gap-2">
                      <span className="text-dark-400 text-xs w-6">#{set.setNumber}</span>
                      <span>{formatSetDisplay(set)}</span>
                      {set.isDropSet && (
                        <span className="text-dark-400 text-xs">
                          → {set.drops?.map(d => `${d.weight}${set.unit}`).join(' → ')}
                        </span>
                      )}
                      {set.toFailure && <Zap className="w-3 h-3 text-yellow-500" />}
                      {set.notes && <span className="text-dark-400 text-xs">({set.notes})</span>}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Current Sets */}
      <div className="space-y-2 mb-4">
        {currentSets.map((set) => (
          <motion.div
            key={set.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-3 flex items-start justify-between"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-accent-400 font-bold text-sm">Set {set.setNumber}</span>
                <span className="text-white font-medium">{formatSetDisplay(set)}</span>
              </div>
              {set.isDropSet && set.drops && (
                <div className="mt-1 flex items-center gap-1 text-xs text-dark-300">
                  <AlertTriangle className="w-3 h-3 text-orange-400" />
                  Drop: {set.drops.map(d => `${d.weight}${set.unit} × ${d.reps ?? '?'}`).join(' → ')}
                  {set.drops.some(d => d.toFailure) && ' (failure)'}
                </div>
              )}
              {set.toFailure && (
                <span className="text-[0.625rem] text-yellow-500 font-medium">TO FAILURE</span>
              )}
              {set.restPause && (
                <span className="text-[0.625rem] text-purple-400 font-medium ml-2">REST-PAUSE</span>
              )}
              {set.assistedReps && (
                <span className="text-[0.625rem] text-teal-400 font-medium ml-2">+{set.assistedReps} assisted</span>
              )}
              {set.notes && <p className="text-dark-400 text-xs mt-0.5">{set.notes}</p>}
            </div>
            <button
              onClick={() => deleteSetFromExercise(exerciseId, set.id)}
              className="text-dark-400 hover:text-red-400 p-1 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Add Set Form */}
      <AnimatePresence>
        {isAddingSet && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="glass-card p-4 space-y-4">
              <h3 className="text-sm font-semibold text-white">
                Set {currentSets.length + 1}
              </h3>

              {/* Weight + Reps */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-dark-300 text-xs font-medium mb-1 block">Weight</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    placeholder="0"
                    className="input-field text-center text-lg font-bold"
                    disabled={weightMode === 'bodyweight'}
                  />
                </div>
                <div>
                  <label className="text-dark-300 text-xs font-medium mb-1 block">Reps</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={reps}
                    onChange={e => setReps(e.target.value)}
                    placeholder="0"
                    className="input-field text-center text-lg font-bold"
                  />
                </div>
              </div>

              {/* Unit & Weight Mode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-dark-300 text-xs font-medium mb-1 block">Unit</label>
                  <div className="flex gap-1">
                    {(['kg', 'lbs'] as WeightUnit[]).map(u => (
                      <button
                        key={u}
                        onClick={() => setUnit(u)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                          unit === u
                            ? 'bg-accent-500 text-white'
                            : 'bg-dark-600 text-dark-200'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-dark-300 text-xs font-medium mb-1 block">Type</label>
                  <select
                    value={weightMode}
                    onChange={e => setWeightMode(e.target.value as WeightMode)}
                    className="input-field text-sm"
                  >
                    {weightModeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                {/* Drop Set */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dark-100">Drop Set</span>
                  <button
                    onClick={() => { setIsDropSet(!isDropSet); if (!isDropSet) addDrop(); else setDrops([]); }}
                    className={`toggle-switch ${isDropSet ? 'active' : ''}`}
                  />
                </div>

                {isDropSet && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="pl-3 border-l-2 border-orange-500/30 space-y-2"
                  >
                    {drops.map((drop, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="number"
                          inputMode="decimal"
                          value={drop.weight || ''}
                          onChange={e => updateDrop(i, 'weight', parseFloat(e.target.value) || 0)}
                          placeholder="Weight"
                          className="input-field flex-1 text-sm py-2"
                        />
                        <input
                          type="number"
                          inputMode="decimal"
                          value={drop.reps ?? ''}
                          onChange={e => updateDrop(i, 'reps', e.target.value ? parseFloat(e.target.value) : null)}
                          placeholder="Reps"
                          className="input-field flex-1 text-sm py-2"
                        />
                        <label className="flex items-center gap-1 text-xs text-dark-200 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={drop.toFailure ?? false}
                            onChange={e => updateDrop(i, 'toFailure', e.target.checked)}
                            className="accent-orange-500"
                          />
                          Fail
                        </label>
                        <button onClick={() => removeDrop(i)} className="text-dark-400 hover:text-red-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button onClick={addDrop} className="text-xs text-orange-400 font-medium flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Add Drop
                    </button>
                  </motion.div>
                )}

                {/* To Failure */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dark-100">To Failure</span>
                  <button
                    onClick={() => setToFailure(!toFailure)}
                    className={`toggle-switch ${toFailure ? 'active' : ''}`}
                  />
                </div>

                {/* Assisted Reps */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dark-100">Assisted Reps</span>
                  <button
                    onClick={() => setHasAssistedReps(!hasAssistedReps)}
                    className={`toggle-switch ${hasAssistedReps ? 'active' : ''}`}
                  />
                </div>
                {hasAssistedReps && (
                  <input
                    type="number"
                    inputMode="numeric"
                    value={assistedReps}
                    onChange={e => setAssistedReps(e.target.value)}
                    placeholder="How many assisted?"
                    className="input-field text-sm"
                  />
                )}

                {/* Rest-Pause */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dark-100">Rest-Pause</span>
                  <button
                    onClick={() => setRestPause(!restPause)}
                    className={`toggle-switch ${restPause ? 'active' : ''}`}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-dark-300 text-xs font-medium mb-1 block">Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Optional notes..."
                  className="input-field text-sm"
                />
              </div>

              {/* Save */}
              <div className="flex gap-2">
                <button onClick={() => { resetForm(); setIsAddingSet(false); }} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button onClick={saveSet} className="btn-primary flex-1">
                  <Save className="w-4 h-4" /> Save Set
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Set Button */}
      {!isAddingSet && (
        <motion.button
          onClick={() => setIsAddingSet(true)}
          className="btn-primary"
          whileTap={{ scale: 0.97 }}
        >
          <Plus className="w-5 h-5" />
          {currentSets.length === 0 ? 'Start Set' : 'Add Set'}
        </motion.button>
      )}
    </motion.div>
  );
}
