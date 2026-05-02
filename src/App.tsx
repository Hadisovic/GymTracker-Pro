import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useWorkoutStore } from './store/workoutStore';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import WorkoutBuilder from './components/WorkoutBuilder';
import ActiveWorkout from './components/ActiveWorkout';
import ExerciseLibrary from './components/ExerciseLibrary';
import History from './components/History';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import LockScreen from './components/LockScreen';

export default function App() {
  const { initialize, isInitialized, currentView, activeWorkout } = useWorkoutStore();
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('gymtracker_auth') === 'true';
  });

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isAuthenticated) {
    return <LockScreen onUnlock={() => setIsAuthenticated(true)} />;
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-accent-500 border-t-transparent animate-spin" />
          <p className="text-dark-200 text-sm">Loading GymTracker Pro...</p>
        </div>
      </div>
    );
  }

  // If there's an active workout, show it regardless of nav
  const view = activeWorkout ? 'active-workout' : currentView;

  return (
    <Layout>
      <AnimatePresence mode="wait">
        {view === 'dashboard' && <Dashboard key="dashboard" />}
        {view === 'workout-builder' && <WorkoutBuilder key="builder" />}
        {view === 'active-workout' && <ActiveWorkout key="active" />}
        {view === 'exercises' && <ExerciseLibrary key="exercises" />}
        {view === 'history' && <History key="history" />}
        {view === 'analytics' && <Analytics key="analytics" />}
        {view === 'settings' && <Settings key="settings" />}
      </AnimatePresence>
    </Layout>
  );
}
