import { motion } from 'framer-motion';
import { Dumbbell, TrendingUp, Trophy, Clock, ChevronRight, Zap } from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export default function Dashboard() {
  const {
    workoutHistory,
    workoutPresets,
    exercises,
    muscleGroups,
    prRecords,
    setCurrentView,
    settings,
  } = useWorkoutStore();

  const totalSessions = workoutHistory.length;
  const totalSets = workoutHistory.reduce(
    (sum, s) => sum + s.exercises.reduce((es, e) => es + e.sets.length, 0), 0
  );
  const totalPRs = prRecords.filter(p => p.type === 'weight' || p.type === 'volume').length;
  const lastSession = workoutHistory[workoutHistory.length - 1];

  const stats = [
    { label: 'Sessions', value: totalSessions, icon: Dumbbell, color: '#6366f1' },
    { label: 'Total Sets', value: totalSets, icon: TrendingUp, color: '#3b82f6' },
    { label: 'PRs Hit', value: totalPRs, icon: Trophy, color: '#eab308' },
    { label: 'Exercises', value: exercises.length, icon: Zap, color: '#22c55e' },
  ];

  return (
    <motion.div
      className="page-container"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Greeting */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">
          Ready to lift{settings?.profile?.name ? `, ${settings.profile.name}` : ''}? 💪
        </h2>
        <p className="text-dark-200 text-sm">
          {lastSession
            ? `Last session: ${lastSession.name}`
            : 'Start your first workout today'}
        </p>
      </div>

      {/* Quick Start */}
      <motion.button
        onClick={() => setCurrentView('workout-builder')}
        className="w-full mb-6 p-5 rounded-2xl relative overflow-hidden"
        whileTap={{ scale: 0.98 }}
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
        }}
      >
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="text-white font-bold text-lg">Start Workout</p>
              <p className="text-white/70 text-sm">Choose a preset or custom</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/70" />
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-8 -translate-x-8" />
      </motion.button>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="glass-card p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              <span className="text-dark-200 text-xs font-medium">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Presets */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-dark-200 uppercase tracking-wider mb-3">
          Quick Start
        </h3>
        <div className="flex flex-col gap-2">
          {workoutPresets.slice(0, 4).map((preset, i) => {
            const presetMuscles = muscleGroups.filter(mg =>
              preset.muscleGroupIds.includes(mg.id)
            );
            return (
              <motion.button
                key={preset.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                onClick={() => setCurrentView('workout-builder')}
                className="glass-card-sm p-3.5 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${presetMuscles[0]?.color ?? '#6366f1'}22, ${presetMuscles[0]?.color ?? '#6366f1'}11)`,
                    }}
                  >
                    <Dumbbell className="w-5 h-5" style={{ color: presetMuscles[0]?.color }} />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium text-sm">{preset.name}</p>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {presetMuscles.map(mg => (
                        <span
                          key={mg.id}
                          className="text-[0.625rem] px-1.5 py-0.5 rounded-full font-medium"
                          style={{
                            background: `${mg.color}15`,
                            color: mg.color,
                          }}
                        >
                          {mg.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-dark-400 group-hover:text-dark-200 transition-colors" />
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Recent Session */}
      {lastSession && (
        <div>
          <h3 className="text-sm font-semibold text-dark-200 uppercase tracking-wider mb-3">
            Last Session
          </h3>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-white font-semibold">{lastSession.name}</p>
                <p className="text-dark-300 text-xs flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {lastSession.sessionLabel}
                  {lastSession.duration && ` · ${lastSession.duration}min`}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {lastSession.exercises.slice(0, 5).map(ex => (
                <span
                  key={ex.exerciseId}
                  className="text-xs px-2 py-1 rounded-lg bg-dark-600 text-dark-100"
                >
                  {ex.exerciseName}
                </span>
              ))}
              {lastSession.exercises.length > 5 && (
                <span className="text-xs px-2 py-1 rounded-lg bg-dark-600 text-dark-300">
                  +{lastSession.exercises.length - 5} more
                </span>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
