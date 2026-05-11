import { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { loginWithGoogle } from '../lib/firebase';

export default function LockScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      await loginWithGoogle();
    } catch (e: any) {
      setError(e.message || "Failed to sign in");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(99, 102, 241, 0.12), transparent 60%), radial-gradient(ellipse 60% 50% at 20% 80%, rgba(168, 85, 247, 0.08), transparent 50%), #08080d',
      }}
    >
      {/* Floating ambient orbs */}
      <motion.div
        className="absolute w-64 h-64 rounded-full blur-3xl"
        style={{ background: 'rgba(99, 102, 241, 0.06)', top: '10%', right: '-10%' }}
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-48 h-48 rounded-full blur-3xl"
        style={{ background: 'rgba(168, 85, 247, 0.05)', bottom: '15%', left: '-5%' }}
        animate={{ x: [0, -20, 0], y: [0, 15, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="glass-card p-8 w-full max-w-sm flex flex-col items-center text-center relative z-10"
        style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)' }}
      >
        {/* Logo with animated pulse ring */}
        <div className="relative mb-6">
          <motion.div 
            className="w-20 h-20 rounded-2xl flex items-center justify-center relative"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
            animate={{ rotate: [0, 2, -2, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Flame className="w-10 h-10 text-white" />
          </motion.div>
          {/* Outer glow ring */}
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{ border: '2px solid rgba(99,102,241,0.3)' }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{ border: '1px solid rgba(168,85,247,0.2)' }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />
        </div>
        
        <motion.h1 
          className="text-3xl font-extrabold text-shimmer mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          GymTracker Pro
        </motion.h1>
        <motion.p 
          className="text-dark-300 text-sm mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Sign in to sync your workouts across devices
        </motion.p>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm mb-6 w-full text-left"
          >
            {error}
          </motion.div>
        )}

        <motion.button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full py-3.5 flex items-center justify-center gap-3 font-semibold rounded-xl relative overflow-hidden group"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
          whileHover={{ scale: 1.02, borderColor: 'rgba(255,255,255,0.2)' }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {/* Hover shine */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.06) 50%, transparent 60%)' }}
          />
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-white">Sign in with Google</span>
            </>
          )}
        </motion.button>

        {/* Subtle trust note */}
        <motion.p 
          className="text-dark-400 text-[0.65rem] mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          Your data is encrypted and synced via Firebase
        </motion.p>
      </motion.div>
    </div>
  );
}
