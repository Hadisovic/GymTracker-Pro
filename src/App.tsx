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

export default function App() {
  const { initialize, isInitialized, currentView, activeWorkout } = useWorkoutStore();
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('gymtracker_auth') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-dark-900 p-4">
        <div className="glass-card p-6 w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent-500/20 mx-auto flex items-center justify-center mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">GymTracker Pro</h1>
          <p className="text-dark-300 text-sm mb-6">Please enter the password to access.</p>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (passwordInput === '1304') {
                localStorage.setItem('gymtracker_auth', 'true');
                setIsAuthenticated(true);
              } else {
                alert('Incorrect password');
                setPasswordInput('');
              }
            }}
            className="flex gap-2"
          >
            <input 
              type="password" 
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              placeholder="Password"
              className="input-field flex-1"
              autoFocus
            />
            <button type="submit" className="btn-primary">Enter</button>
          </form>
        </div>
      </div>
    );
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
