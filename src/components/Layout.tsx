import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Dumbbell, BookOpen, Clock, BarChart3, Settings,
  Flame, Activity, Cloud, CloudOff, Loader2, Check
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
  const { currentView, setCurrentView, activeWorkout, cloudSyncStatus } = useWorkoutStore();

  // Helper config for premium dynamic states
  const getSyncBadgeConfig = () => {
    switch (cloudSyncStatus) {
      case 'synced':
        return {
          bg: 'rgba(16, 185, 129, 0.08)',
          border: 'rgba(16, 185, 129, 0.25)',
          text: '#34d399',
          label: 'Synced',
          icon: <Check className="w-3 h-3 text-[#34d399]" />,
          shadow: '0 0 10px rgba(16, 185, 129, 0.15)',
        };
      case 'local':
        return {
          bg: 'rgba(245, 158, 11, 0.08)',
          border: 'rgba(245, 158, 11, 0.25)',
          text: '#fbbf24',
          label: 'Local',
          icon: <Cloud className="w-3 h-3 text-[#fbbf24]" />,
          shadow: '0 0 10px rgba(245, 158, 11, 0.12)',
        };
      case 'syncing':
        return {
          bg: 'rgba(59, 130, 246, 0.08)',
          border: 'rgba(59, 130, 246, 0.25)',
          text: '#60a5fa',
          label: 'Syncing',
          icon: <Loader2 className="w-3 h-3 text-[#60a5fa] animate-spin" />,
          shadow: '0 0 10px rgba(59, 130, 246, 0.15)',
        };
      case 'error':
        return {
          bg: 'rgba(239, 68, 68, 0.08)',
          border: 'rgba(239, 68, 68, 0.25)',
          text: '#f87171',
          label: 'Offline',
          icon: <CloudOff className="w-3 h-3 text-[#f87171]" />,
          shadow: '0 0 10px rgba(239, 68, 68, 0.15)',
        };
      default:
        return null;
    }
  };

  const syncConfig = getSyncBadgeConfig();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between"
        style={{
          background: 'linear-gradient(to bottom, rgba(8,8,13,0.98), rgba(8,8,13,0.88))',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          backdropFilter: 'blur(24px) saturate(1.3)',
        }}
      >
        <div className="flex items-center gap-3">
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
          <div className="flex flex-col">
            <h1 className="text-lg font-extrabold text-shimmer tracking-tight leading-none mb-0.5">
              GymTracker Pro
            </h1>
          </div>

          {/* Premium Glassmorphic Sync Status Pill */}
          <AnimatePresence mode="wait">
            {syncConfig && (
              <motion.div
                key={cloudSyncStatus}
                initial={{ opacity: 0, scale: 0.85, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 4 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all duration-300 backdrop-blur-md cursor-help ml-1"
                style={{
                  background: syncConfig.bg,
                  border: `1px solid ${syncConfig.border}`,
                  color: syncConfig.text,
                  boxShadow: syncConfig.shadow,
                }}
                title={
                  cloudSyncStatus === 'synced' ? 'All changes secure in the cloud.' :
                  cloudSyncStatus === 'local' ? 'No internet or custom rules. Backed up safely on your device!' :
                  cloudSyncStatus === 'syncing' ? 'Syncing your workout data...' : 'Device offline. Local backups active.'
                }
              >
                <div className="flex items-center justify-center">
                  {syncConfig.icon}
                </div>
                <span className="opacity-90 select-none">
                  {syncConfig.label}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Live Indicator (Far Right) */}
        {activeWorkout && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold tracking-wider"
            style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.08))',
              border: '1px solid rgba(34,197,94,0.3)',
              color: '#4ade80',
            }}
          >
            <span className="w-2 h-2 rounded-full bg-green-400 live-dot animate-pulse" />
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