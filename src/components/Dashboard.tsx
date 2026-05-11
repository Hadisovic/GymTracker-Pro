import { motion } from 'framer-motion';
import { Dumbbell, TrendingUp, Trophy, Clock, ChevronRight, Zap, Sparkles, Activity } from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';
import { useEffect, useState } from 'react';

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  exit: { opacity: 0, y: -20 },
};

const itemVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
};

function AnimatedCounter({ value, duration = 1.2 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);
  return <>{display}</>;
}

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
    { label: 'Sessions', value: totalSessions, icon: Dumbbell, color: '#6366f1', gradient: 'from-indigo-500/20 to-indigo-600/5' },
    { label: 'Total Sets', value: totalSets, icon: TrendingUp, color: '#3b82f6', gradient: 'from-blue-500/20 to-blue-600/5' },
    { label: 'PRs Hit', value: totalPRs, icon: Trophy, color: '#eab308', gradient: 'from-yellow-500/20 to-yellow-600/5' },
    { label: 'Exercises', value: exercises.length, icon: Zap, color: '#22c55e', gradient: 'from-green-500/20 to-green-600/5' },
  ];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <motion.div
      className="page-container"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Greeting */}
      <motion.div variants={itemVariants} className="mb-6">
        <h2 className="text-2xl font-extrabold text-white mb-1">
          {greeting()}{settings?.profile?.name ? `, ${settings.profile.name}` : ''} 💪
        </h2>
        <p className="text-dark-200 text-sm">
          {lastSession
            ? `Last session: ${lastSession.name}`
            : 'Start your first workout today'}
        </p>
      </motion.div>

      {/* Quick Start — Animated gradient CTA */}
      <motion.button
        variants={itemVariants}
        onClick={() => setCurrentView('workout-builder')}
        className="w-full mb-6 p-5 rounded-2xl relative overflow-hidden group"
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 40%, #ec4899 80%, #6366f1 100%)',
          backgroundSize: '300% 300%',
        }}
      >
        {/* Animated shine overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)', backgroundSize: '200% 100%' }}
        />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm"
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Dumbbell className="w-6 h-6 text-white" />
            </motion.div>
            <div className="text-left">
              <p className="text-white font-bold text-lg tracking-tight">Start Workout</p>
              <p className="text-white/60 text-sm">Choose a preset or custom</p>
            </div>
          </div>
          <motion.div
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronRight className="w-5 h-5 text-white/70" />
          </motion.div>
        </div>
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/[0.07] rounded-full blur-sm" />
        <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-white/[0.05] rounded-full blur-sm" />
      </motion.button>

      {/* Stats Grid — Animated counters */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            variants={itemVariants}
            whileHover={{ scale: 1.03, y: -2 }}
            className={`glass-card p-4 relative overflow-hidden bg-gradient-to-br ${stat.gradient}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}20` }}>
                <stat.icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
              </div>
              <span className="text-dark-200 text-xs font-medium">{stat.label}</span>
            </div>
            <p className="text-2xl font-extrabold text-white stat-value">
              <AnimatedCounter value={stat.value} duration={1.2} />
            </p>
            {/* Subtle decorative ring */}
            <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full opacity-[0.04]"
              style={{ border: `2px solid ${stat.color}` }}
            />
          </motion.div>
        ))}
      </div>

      {/* Quick Presets */}
      <motion.div variants={itemVariants} className="mb-6">
        <h3 className="text-sm font-semibold text-dark-200 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-accent-400" />
          Quick Start
        </h3>
        <div className="flex flex-col gap-2">
          {workoutPresets.slice(0, 4).map((preset) => {
            const presetMuscles = muscleGroups.filter(mg =>
              preset.muscleGroupIds.includes(mg.id)
            );
            return (
              <motion.button
                key={preset.id}
                variants={itemVariants}
                onClick={() => setCurrentView('workout-builder')}
                className="glass-card-sm p-3.5 flex items-center justify-between group"
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${presetMuscles[0]?.color ?? '#6366f1'}22, ${presetMuscles[0]?.color ?? '#6366f1'}08)`,
                      border: `1px solid ${presetMuscles[0]?.color ?? '#6366f1'}20`,
                    }}
                  >
                    <Dumbbell className="w-5 h-5" style={{ color: presetMuscles[0]?.color }} />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-semibold text-sm">{preset.name}</p>
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
                <ChevronRight className="w-4 h-4 text-dark-400 group-hover:text-accent-400 transition-colors duration-300" />
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Recent Session */}
      {lastSession && (
        <motion.div variants={itemVariants}>
          <h3 className="text-sm font-semibold text-dark-200 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-green-400" />
            Last Session
          </h3>
          <motion.div
            className="glass-card p-4"
            whileHover={{ scale: 1.01 }}
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
                  className="text-xs px-2 py-1 rounded-lg bg-dark-600/50 text-dark-100 border border-dark-500/30"
                >
                  {ex.exerciseName}
                </span>
              ))}
              {lastSession.exercises.length > 5 && (
                <span className="text-xs px-2 py-1 rounded-lg bg-dark-600/50 text-dark-300">
                  +{lastSession.exercises.length - 5} more
                </span>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
