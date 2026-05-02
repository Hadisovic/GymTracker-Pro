import { motion } from 'framer-motion';
import {
  LayoutDashboard, Dumbbell, BookOpen, Clock, BarChart3, Settings,
  Flame
} from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';

const navItems = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'exercises', label: 'Exercises', icon: BookOpen },
  { id: 'workout-builder', label: 'Workout', icon: Dumbbell },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'analytics', label: 'Charts', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { currentView, setCurrentView, activeWorkout } = useWorkoutStore();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3"
        style={{
          background: 'linear-gradient(to bottom, rgba(10,10,15,0.98), rgba(10,10,15,0.9))',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-purple-600 flex items-center justify-center">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-white to-dark-200 bg-clip-text text-transparent">
            GymTracker Pro
          </h1>
        </div>
        {activeWorkout && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.1))',
              border: '1px solid rgba(34,197,94,0.3)',
              color: '#4ade80',
            }}
          >
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
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
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all duration-200 relative"
                style={{ minWidth: '3.5rem' }}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -top-1 w-8 h-1 rounded-full bg-accent-500"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <Icon
                  className={`w-5 h-5 transition-colors duration-200 ${
                    isActive ? 'text-accent-400' : 'text-dark-300'
                  }`}
                />
                <span className={`text-[0.625rem] font-medium transition-colors duration-200 ${
                  isActive ? 'text-accent-400' : 'text-dark-300'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
