import { motion } from 'framer-motion';
import { Trophy, Clock, Dumbbell, TrendingUp, Sparkles, ChevronRight } from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

export default function WorkoutSummary() {
  const { workoutHistory, lastCompletedSessionId, dismissSummary, prRecords } = useWorkoutStore();
  const session = workoutHistory.find(s => s.id === lastCompletedSessionId);

  useEffect(() => {
    // Triple-burst confetti on mount
    const fire = (delay: number, opts: any) => {
      setTimeout(() => {
        confetti({
          particleCount: 60,
          spread: 80,
          origin: { y: 0.7 },
          colors: ['#6366f1', '#a855f7', '#ec4899', '#facc15', '#22c55e'],
          ...opts,
        });
      }, delay);
    };
    fire(0, { angle: 60, origin: { x: 0 } });
    fire(200, { angle: 90, origin: { x: 0.5 } });
    fire(400, { angle: 120, origin: { x: 1 } });
  }, []);

  if (!session) return null;

  const totalSets = session.exercises.reduce((s, e) => s + e.sets.length, 0);
  const totalVolume = session.exercises.reduce((total, ex) =>
    total + ex.sets.reduce((s, set) => s + ((set.weight || 0) * (set.reps || 0)), 0), 0
  );
  const sessionPRs = prRecords.filter(pr => pr.sessionId === session.id);

  const summaryStats = [
    { label: 'Duration', value: `${session.duration || 0}m`, icon: Clock, color: '#3b82f6' },
    { label: 'Exercises', value: session.exercises.length, icon: Dumbbell, color: '#22c55e' },
    { label: 'Total Sets', value: totalSets, icon: TrendingUp, color: '#a855f7' },
    { label: 'Volume', value: `${Math.round(totalVolume).toLocaleString()}`, icon: Sparkles, color: '#f97316' },
  ];

  return (
    <motion.div
      className="page-container flex flex-col items-center text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Trophy hero */}
      <motion.div
        className="relative mb-6 mt-4"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
      >
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(234,179,8,0.2), rgba(234,179,8,0.05))', border: '1px solid rgba(234,179,8,0.3)' }}
        >
          <Trophy className="w-12 h-12 text-yellow-400" />
        </div>
        <motion.div
          className="absolute inset-0 rounded-3xl"
          style={{ border: '2px solid rgba(234,179,8,0.3)' }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>

      <motion.h2
        className="text-2xl font-extrabold text-white mb-1"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        Workout Complete! 🔥
      </motion.h2>
      <motion.p
        className="text-dark-300 text-sm mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {session.name}
      </motion.p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 w-full mb-6">
        {summaryStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="glass-card p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
          >
            <div className="flex items-center justify-center gap-1.5 mb-1.5">
              <stat.icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
              <span className="text-dark-300 text-xs font-medium">{stat.label}</span>
            </div>
            <p className="text-xl font-extrabold text-white">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* PRs earned */}
      {sessionPRs.length > 0 && (
        <motion.div
          className="w-full mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <h3 className="text-sm font-semibold text-yellow-400 mb-3">🏆 PRs Earned</h3>
          <div className="space-y-2">
            {sessionPRs.map(pr => (
              <div key={pr.id} className="glass-card-sm p-3 flex items-center gap-2 text-left">
                <span className="text-lg">{pr.type === 'weight' ? '🏆' : pr.type === 'reps' ? '💪' : '📊'}</span>
                <div>
                  <p className="text-white text-sm font-medium">{pr.exerciseName}</p>
                  <p className="text-dark-300 text-xs">{pr.value} — {pr.type} PR</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Continue button */}
      <motion.button
        onClick={dismissSummary}
        className="btn-primary"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Continue
        <ChevronRight className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
}
