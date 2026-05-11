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
import WorkoutSummary from './components/WorkoutSummary';
import CardioView from './components/CardioView';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import AIAssistant from './components/AIAssistant';

export default function App() {
  const { 
    initialize, isInitialized, currentView, activeWorkout, setUser, user, loadUserData
  } = useWorkoutStore();
  
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, [setUser]);

  useEffect(() => {
    const init = async () => {
      if (isAuthReady && user && !isInitialized) {
        await initialize();
        await loadUserData();
      }
    };
    init();
  }, [isAuthReady, user, isInitialized, initialize, loadUserData]);

  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-900">
        <div className="w-12 h-12 rounded-full border-2 border-accent-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LockScreen />;
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-accent-500 border-t-transparent animate-spin" />
          <p className="text-dark-200 text-sm">Syncing your data...</p>
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
        {view === 'cardio' && <CardioView key="cardio" />}
        {view === 'settings' && <Settings key="settings" />}
        {view === 'workout-summary' && <WorkoutSummary key="summary" />}
      </AnimatePresence>
      <AIAssistant />
    </Layout>
  );
}
