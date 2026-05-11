import { motion } from 'framer-motion';
import {
  LayoutDashboard, Dumbbell, BookOpen, Clock, BarChart3, Settings,
  Flame, Activity
} from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';

const navItems = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'exercises', label: 'Exercises', icon: BookOpen },
  { id: 'workout-builder', label: 'Workout', icon: Dumbbell },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'analytics', label: 'Charts', icon: BarChart3 },
  { id: 'cardio', label: 'Cardio', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { currentView, setCurrentView, activeWorkout } = useWorkoutStore();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3"
        style={{
          background: 'linear-gradient(to bottom, rgba(8,8,13,0.98), rgba(8,8,13,0.88))',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          backdropFilter: 'blur(24px) saturate(1.3)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <motion.div 
            className="w-8 h-8 rounded-lg flex items-center justify-center relative"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Flame className="w-5 h-5 text-white" />
            {/* Animated glow ring */}
            <motion.div
              className="absolute inset-0 rounded-lg"
              style={{ border: '1px solid rgba(99,102,241,0.4)' }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
          <h1 className="text-lg font-extrabold text-shimmer tracking-tight">
            GymTracker Pro
          </h1>
        </div>
        {activeWorkout && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold tracking-wider"
            style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.08))',
              border: '1px solid rgba(34,197,94,0.3)',
              color: '#4ade80',
            }}
          >
            <span className="w-2 h-2 rounded-full bg-green-400 live-dot" />
            LIVE
          </motion.div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 relative">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <div className="flex items-center justify-around py-2 px-1 max-w-lg mx-auto">
          {navItems.map(item => {
            const isActive = currentView === item.id;
            const Icon = item.icon;
            return (
              <motion.button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className="flex flex-col items-center gap-0.5 py-1 px-1 rounded-xl relative"
                style={{ minWidth: '3rem' }}
                whileTap={{ scale: 0.85 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -top-1 w-8 h-1 rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, #6366f1, #a855f7)',
                      boxShadow: '0 0 8px rgba(99,102,241,0.5)',
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <motion.div
                  animate={isActive ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Icon
                    className={`w-5 h-5 transition-colors duration-300 ${
                      isActive ? 'text-accent-400' : 'text-dark-400'
                    }`}
                  />
                </motion.div>
                <span className={`text-[0.6rem] font-semibold transition-colors duration-300 ${
                  isActive ? 'text-accent-400' : 'text-dark-400'
                }`}>
                  {item.label}
                </span>
                {/* Active glow dot */}
                {isActive && (
                  <motion.div
                    layoutId="nav-glow"
                    className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-accent-400"
                    style={{ boxShadow: '0 0 6px rgba(99,102,241,0.6)' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
