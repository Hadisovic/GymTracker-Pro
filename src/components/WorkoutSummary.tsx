import { motion } from 'framer-motion';
import { Trophy, Clock, Dumbbell, Zap, ChevronRight } from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

export default function WorkoutSummary() {
  const { workoutHistory, prRecords, lastCompletedSessionId, dismissSummary } = useWorkoutStore();

  const session = workoutHistory.find(s => s.id === lastCompletedSessionId);
  
  useEffect(() => {
    if (session) {
      const timer = setTimeout(() => {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#22c55e', '#a855f7', '#3b82f6', '#eab308']
        });
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100, 50, 200]);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [session]);

  if (!session) return null;

  const totalSets = session.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const sessionPRs = prRecords.filter(pr => pr.sessionId === session.id);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="page-container flex flex-col min-h-screen"
    >
      <div className="flex-1 flex flex-col items-center justify-center py-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.2 }}
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
        >
          <Trophy className="w-10 h-10 text-white" />
        </motion.div>

        <h2 className="text-3xl font-bold text-white mb-2">Workout Complete!</h2>
        <p className="text-dark-300 text-sm mb-8">{session.name}</p>

        <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-8">
          <div className="glass-card p-4 flex flex-col items-center text-center">
            <Clock className="w-6 h-6 text-accent-400 mb-2" />
            <span className="text-2xl font-bold text-white">{session.duration ?? 0}</span>
            <span className="text-xs text-dark-300 uppercase tracking-wider font-semibold">Minutes</span>
          </div>
          <div className="glass-card p-4 flex flex-col items-center text-center">
            <Dumbbell className="w-6 h-6 text-purple-400 mb-2" />
            <span className="text-2xl font-bold text-white">{totalSets}</span>
            <span className="text-xs text-dark-300 uppercase tracking-wider font-semibold">Sets</span>
          </div>
        </div>

        {sessionPRs.length > 0 && (
          <div className="w-full max-w-sm">
            <h3 className="text-sm font-semibold text-dark-200 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              New Records ({sessionPRs.length})
            </h3>
            <div className="space-y-2">
              {sessionPRs.map(pr => (
                <div key={pr.id} className="glass-card p-3 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{pr.exerciseName}</p>
                    <p className="text-xs text-dark-400 uppercase">{pr.type.replace('_', ' ')}</p>
                  </div>
                  <span className="text-yellow-500 font-bold text-sm bg-yellow-500/10 px-2 py-1 rounded-md">
                    {pr.value} {pr.type === 'weight' ? 'kg' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 pb-8 mt-auto w-full max-w-sm mx-auto">
        <motion.button
          onClick={dismissSummary}
          className="btn-primary w-full py-4 text-base"
          whileTap={{ scale: 0.97 }}
        >
          Continue to Dashboard <ChevronRight className="w-5 h-5 ml-2" />
        </motion.button>
      </div>
    </motion.div>
  );
}
