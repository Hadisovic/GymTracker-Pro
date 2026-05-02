import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, Clock, XCircle, Dumbbell, ChevronRight, Trophy, Square
} from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';
import ExerciseLogger from './ExerciseLogger';

export default function ActiveWorkout() {
  const {
    activeWorkout, exercises, muscleGroups, latestLogs,
    setCurrentExercise, finishExercise, finishWorkout, cancelWorkout,
    setCurrentView,
  } = useWorkoutStore();

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  if (!activeWorkout) return null;

  const currentExId = activeWorkout.currentExerciseId;

  // If an exercise is selected, show the logger
  if (currentExId) {
    const ex = exercises.find(e => e.id === currentExId);
    return (
      <ExerciseLogger
        exerciseId={currentExId}
        exerciseName={ex?.name ?? currentExId}
        onBack={() => setCurrentExercise('')}
      />
    );
  }

  const elapsed = Math.round(
    (Date.now() - new Date(activeWorkout.startedAt).getTime()) / 60000
  );

  const completedCount = activeWorkout.exerciseLogs.filter(l => l.completed).length;
  const totalCount = activeWorkout.exerciseLogs.length;

  const handleFinishWorkout = async () => {
    await finishWorkout();
    setCurrentView('dashboard');
  };

  const handleCancel = () => {
    cancelWorkout();
    setCurrentView('dashboard');
  };

  return (
    <motion.div
      className="page-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Workout Header */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-white">{activeWorkout.presetName}</h2>
          <div className="flex items-center gap-2 text-dark-200 text-sm">
            <Clock className="w-4 h-4" />
            {elapsed}m
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #6366f1, #a855f7)',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="text-dark-200 text-xs font-medium">{completedCount}/{totalCount}</span>
        </div>
      </div>

      {/* Exercise List */}
      <div className="space-y-2 mb-6">
        {activeWorkout.exerciseLogs.map((log, i) => {
          const ex = exercises.find(e => e.id === log.exerciseId);
          const mg = muscleGroups.find(m => m.id === ex?.muscleGroupId);
          const latest = latestLogs[log.exerciseId];
          const hasSets = log.sets.length > 0;
          const isCompleted = log.completed;

          return (
            <motion.div
              key={log.exerciseId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <motion.button
                onClick={() => !isCompleted && setCurrentExercise(log.exerciseId)}
                className={`w-full glass-card p-4 text-left transition-all ${
                  isCompleted ? 'opacity-50' : ''
                }`}
                whileTap={!isCompleted ? { scale: 0.98 } : undefined}
                disabled={isCompleted}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: isCompleted
                          ? 'rgba(34,197,94,0.15)'
                          : hasSets
                            ? 'rgba(99,102,241,0.15)'
                            : `${mg?.color ?? '#6366f1'}12`,
                      }}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5 text-green-400" />
                      ) : hasSets ? (
                        <Dumbbell className="w-5 h-5 text-accent-400" />
                      ) : (
                        <Square className="w-5 h-5" style={{ color: mg?.color ?? '#6366f1' }} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className={`font-medium text-sm truncate ${
                        isCompleted ? 'text-dark-300 line-through' : 'text-white'
                      }`}>
                        {log.exerciseName}
                      </p>
                      {hasSets && (
                        <p className="text-dark-300 text-xs mt-0.5">
                          {log.sets.length} set{log.sets.length > 1 ? 's' : ''} logged
                        </p>
                      )}
                      {!hasSets && latest && (
                        <p className="ref-text text-xs mt-0.5 truncate">
                          Last: {latest.sets.length} sets
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {hasSets && !isCompleted && (
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          finishExercise(log.exerciseId);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: 'rgba(34,197,94,0.15)',
                          color: '#4ade80',
                          border: '1px solid rgba(34,197,94,0.3)',
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </motion.button>
                    )}
                    {!isCompleted && (
                      <ChevronRight className="w-4 h-4 text-dark-400" />
                    )}
                  </div>
                </div>
              </motion.button>
            </motion.div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <motion.button
          onClick={handleFinishWorkout}
          className="w-full p-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
          whileTap={{ scale: 0.97 }}
          style={{
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
          }}
        >
          <Trophy className="w-5 h-5" />
          Finish Workout
        </motion.button>

        <button
          onClick={() => setShowCancelConfirm(true)}
          className="w-full py-3 text-dark-300 text-sm font-medium"
        >
          Cancel Workout
        </button>
      </div>

      {/* Cancel Confirm Modal */}
      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)' }}
            onClick={() => setShowCancelConfirm(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="glass-card p-5 w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <XCircle className="w-6 h-6 text-red-400" />
                <div>
                  <h3 className="text-white font-semibold">Cancel Workout?</h3>
                  <p className="text-dark-300 text-sm">All progress will be lost.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowCancelConfirm(false)} className="btn-secondary flex-1">
                  Keep Going
                </button>
                <button onClick={handleCancel} className="btn-danger flex-1">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
