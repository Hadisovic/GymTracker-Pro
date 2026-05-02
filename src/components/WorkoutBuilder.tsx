import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Play, Check, Plus, GripVertical } from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';

const pageVariants = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

type Step = 'choose-preset' | 'choose-muscles' | 'choose-exercises' | 'ready';

export default function WorkoutBuilder() {
  const {
    muscleGroups, exercises, workoutPresets, setCurrentView,
    startWorkout,
  } = useWorkoutStore();

  const [step, setStep] = useState<Step>('choose-preset');
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [workoutName, setWorkoutName] = useState('');

  const availableExercises = useMemo(() =>
    exercises.filter(ex => selectedMuscles.includes(ex.muscleGroupId)),
    [exercises, selectedMuscles]
  );

  const toggleMuscle = (id: string) => {
    setSelectedMuscles(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const toggleExercise = (id: string) => {
    setSelectedExercises(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const selectPreset = (presetId: string) => {
    const preset = workoutPresets.find(p => p.id === presetId);
    if (!preset) return;
    setSelectedMuscles(preset.muscleGroupIds);
    setWorkoutName(preset.name);
    // Auto-select all exercises for those muscles
    const exs = exercises.filter(e => preset.muscleGroupIds.includes(e.muscleGroupId));
    setSelectedExercises(exs.map(e => e.id));
    setStep('choose-exercises');
  };

  const goCustom = () => {
    setStep('choose-muscles');
  };

  const confirmMuscles = () => {
    const exs = exercises.filter(e => selectedMuscles.includes(e.muscleGroupId));
    setSelectedExercises(exs.map(e => e.id));
    const names = muscleGroups
      .filter(mg => selectedMuscles.includes(mg.id))
      .map(mg => mg.name)
      .join(' + ');
    setWorkoutName(names);
    setStep('choose-exercises');
  };

  const handleStart = () => {
    startWorkout(workoutName, selectedMuscles, selectedExercises);
    setCurrentView('active-workout');
  };

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    const newList = [...selectedExercises];
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= newList.length) return;
    [newList[index], newList[swapIdx]] = [newList[swapIdx], newList[index]];
    setSelectedExercises(newList);
  };

  return (
    <motion.div
      className="page-container"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25 }}
    >
      {/* Back button */}
      {step !== 'choose-preset' && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => {
            if (step === 'choose-muscles') setStep('choose-preset');
            else if (step === 'choose-exercises') setStep(workoutName ? 'choose-preset' : 'choose-muscles');
          }}
          className="flex items-center gap-1 text-accent-400 text-sm font-medium mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </motion.button>
      )}

      <AnimatePresence mode="wait">
        {/* Step 1: Choose Preset */}
        {step === 'choose-preset' && (
          <motion.div key="presets" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <h2 className="text-xl font-bold text-white mb-1">Start a Workout</h2>
            <p className="text-dark-200 text-sm mb-6">Choose a preset or build custom</p>

            <div className="flex flex-col gap-2 mb-6">
              {workoutPresets.map((preset, i) => {
                const presetMuscles = muscleGroups.filter(mg =>
                  preset.muscleGroupIds.includes(mg.id)
                );
                return (
                  <motion.button
                    key={preset.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => selectPreset(preset.id)}
                    className="glass-card p-4 flex items-center justify-between text-left"
                    whileTap={{ scale: 0.98 }}
                  >
                    <div>
                      <p className="text-white font-semibold">{preset.name}</p>
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {presetMuscles.map(mg => (
                          <span
                            key={mg.id}
                            className="muscle-chip"
                            style={{
                              background: `${mg.color}15`,
                              color: mg.color,
                              border: `1px solid ${mg.color}30`,
                            }}
                          >
                            {mg.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Play className="w-5 h-5 text-accent-400" />
                  </motion.button>
                );
              })}
            </div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              onClick={goCustom}
              className="btn-secondary"
            >
              <Plus className="w-4 h-4" />
              Custom Workout
            </motion.button>
          </motion.div>
        )}

        {/* Step 2: Choose Muscles */}
        {step === 'choose-muscles' && (
          <motion.div key="muscles" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <h2 className="text-xl font-bold text-white mb-1">Select Muscles</h2>
            <p className="text-dark-200 text-sm mb-6">Pick the muscle groups for today</p>

            <div className="grid grid-cols-2 gap-2 mb-6">
              {muscleGroups.map(mg => {
                const isSelected = selectedMuscles.includes(mg.id);
                return (
                  <motion.button
                    key={mg.id}
                    onClick={() => toggleMuscle(mg.id)}
                    className="p-4 rounded-xl text-left transition-all duration-200"
                    whileTap={{ scale: 0.96 }}
                    style={{
                      background: isSelected
                        ? `linear-gradient(135deg, ${mg.color}25, ${mg.color}10)`
                        : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSelected ? mg.color + '50' : 'rgba(255,255,255,0.06)'}`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${isSelected ? 'text-white' : 'text-dark-200'}`}>
                        {mg.name}
                      </span>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: mg.color }}
                        >
                          <Check className="w-3 h-3 text-white" />
                        </motion.div>
                      )}
                    </div>
                    <p className="text-dark-300 text-xs mt-1">
                      {exercises.filter(e => e.muscleGroupId === mg.id).length} exercises
                    </p>
                  </motion.button>
                );
              })}
            </div>

            <button
              onClick={confirmMuscles}
              disabled={selectedMuscles.length === 0}
              className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue with {selectedMuscles.length} muscle{selectedMuscles.length !== 1 ? 's' : ''}
            </button>
          </motion.div>
        )}

        {/* Step 3: Choose Exercises */}
        {step === 'choose-exercises' && (
          <motion.div key="exercises" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <h2 className="text-xl font-bold text-white mb-1">{workoutName}</h2>
            <p className="text-dark-200 text-sm mb-4">
              Select exercises · tap to reorder
            </p>

            {muscleGroups
              .filter(mg => selectedMuscles.includes(mg.id))
              .map(mg => {
                const mgExercises = availableExercises.filter(e => e.muscleGroupId === mg.id);
                return (
                  <div key={mg.id} className="mb-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-2"
                      style={{ color: mg.color }}>
                      {mg.name}
                    </h3>
                    <div className="flex flex-col gap-1.5">
                      {mgExercises.map(ex => {
                        const isSelected = selectedExercises.includes(ex.id);
                        const idx = selectedExercises.indexOf(ex.id);
                        return (
                          <motion.div
                            key={ex.id}
                            layout
                            className="flex items-center gap-2"
                          >
                            <button
                              onClick={() => toggleExercise(ex.id)}
                              className="flex-1 glass-card-sm p-3 flex items-center justify-between text-left"
                              style={{
                                borderColor: isSelected ? `${mg.color}40` : undefined,
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-5 h-5 rounded-md border flex items-center justify-center transition-all"
                                  style={{
                                    borderColor: isSelected ? mg.color : 'rgba(255,255,255,0.15)',
                                    background: isSelected ? mg.color : 'transparent',
                                  }}
                                >
                                  {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <span className={`text-sm ${isSelected ? 'text-white' : 'text-dark-200'}`}>
                                  {ex.name}
                                </span>
                              </div>
                              {ex.equipment && (
                                <span className="text-dark-400 text-[0.625rem]">{ex.equipment}</span>
                              )}
                            </button>
                            {isSelected && (
                              <div className="flex flex-col gap-0.5">
                                <button
                                  onClick={() => moveExercise(idx, 'up')}
                                  className="text-dark-400 hover:text-white p-0.5"
                                  disabled={idx === 0}
                                >
                                  <GripVertical className="w-3 h-3 rotate-180" />
                                </button>
                                <button
                                  onClick={() => moveExercise(idx, 'down')}
                                  className="text-dark-400 hover:text-white p-0.5"
                                  disabled={idx === selectedExercises.length - 1}
                                >
                                  <GripVertical className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

            <motion.button
              onClick={handleStart}
              disabled={selectedExercises.length === 0}
              className="btn-primary disabled:opacity-40 mt-4"
              whileTap={{ scale: 0.97 }}
            >
              <Play className="w-5 h-5" />
              Start Workout ({selectedExercises.length} exercises)
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
