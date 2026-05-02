import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LockScreenProps {
  onUnlock: () => void;
}

export default function LockScreen({ onUnlock }: LockScreenProps) {
  const [passwordInput, setPasswordInput] = useState('');
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const CORRECT_PASSWORD = '1304';
  const MAX_LENGTH = 4;

  const handleInput = useCallback((digit: string) => {
    if (isError || isSuccess || passwordInput.length >= MAX_LENGTH) return;
    
    const newPassword = passwordInput + digit;
    setPasswordInput(newPassword);

    if (newPassword.length === MAX_LENGTH) {
      if (newPassword === CORRECT_PASSWORD) {
        setIsSuccess(true);
        setTimeout(() => {
          localStorage.setItem('gymtracker_auth', 'true');
          onUnlock();
        }, 600);
      } else {
        setIsError(true);
        setTimeout(() => {
          setPasswordInput('');
          setIsError(false);
        }, 500);
      }
    }
  }, [passwordInput, isError, isSuccess, onUnlock]);

  const handleDelete = useCallback(() => {
    if (isError || isSuccess || passwordInput.length === 0) return;
    setPasswordInput(prev => prev.slice(0, -1));
  }, [isError, isSuccess, passwordInput.length]);

  // Handle physical keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleInput(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInput, handleDelete]);

  const dots = Array.from({ length: MAX_LENGTH });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-dark-900 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 w-full max-w-sm flex flex-col items-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-accent-500/20 flex items-center justify-center mb-6">
          <span className="text-3xl">🔒</span>
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">GymTracker Pro</h1>
        <p className="text-dark-300 text-sm mb-8">Enter PIN to access</p>

        {/* Password Dots */}
        <motion.div 
          className="flex gap-4 mb-10"
          animate={isError ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          {dots.map((_, i) => {
            const isFilled = i < passwordInput.length;
            return (
              <motion.div
                key={i}
                className={`w-4 h-4 rounded-full ${
                  isSuccess 
                    ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' 
                    : isError 
                      ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                      : isFilled 
                        ? 'bg-accent-500 shadow-[0_0_10px_rgba(56,189,248,0.5)]' 
                        : 'bg-dark-600'
                }`}
                animate={{
                  scale: isFilled ? [1, 1.2, 1] : 1,
                }}
                transition={{ duration: 0.2 }}
              />
            );
          })}
        </motion.div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-[240px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <motion.button
              key={num}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleInput(num.toString())}
              className="w-16 h-16 rounded-full bg-dark-700 text-white text-2xl font-semibold flex items-center justify-center hover:bg-dark-600 transition-colors shadow-lg"
            >
              {num}
            </motion.button>
          ))}
          <div className="w-16 h-16"></div> {/* Empty space */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleInput('0')}
            className="w-16 h-16 rounded-full bg-dark-700 text-white text-2xl font-semibold flex items-center justify-center hover:bg-dark-600 transition-colors shadow-lg"
          >
            0
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDelete}
            className="w-16 h-16 rounded-full bg-dark-700/50 text-dark-200 text-xl flex items-center justify-center hover:bg-dark-600 hover:text-white transition-colors"
          >
            ⌫
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
