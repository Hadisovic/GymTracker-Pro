import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkoutStore } from '../store/workoutStore';
import { User, Target, Dumbbell, Ruler, ChevronRight, ChevronLeft, Calendar } from 'lucide-react';

export default function Onboarding() {
  const { user, updateSettings, settings } = useWorkoutStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  
  const [formData, setFormData] = useState({
    name: user?.displayName?.split(' ')[0] || '',
    age: '',
    weight: '',
    height: '',
    goal: 'Build Muscle',
  });

  const goals = [
    'Build Muscle',
    'Lose Weight',
    'Improve Endurance',
    'Maintain Health',
    'Get Stronger'
  ];

  const stepsLength = 6;

  const handleNext = () => {
    if (step === 1 && !formData.name) return;
    setDirection(1);
    setStep(s => Math.min(stepsLength - 1, s + 1));
  };

  const handlePrev = () => {
    setDirection(-1);
    setStep(s => Math.max(0, s - 1));
  };

  const handleSubmit = async () => {
    if (!formData.name) return;

    setIsSubmitting(true);
    try {
      await updateSettings({
        profile: {
          name: formData.name,
          age: formData.age ? parseInt(formData.age) : null,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          height: formData.height ? parseFloat(formData.height) : null,
          goal: formData.goal,
          isComplete: true,
        }
      });
    } catch (e) {
      console.error("Failed to save profile:", e);
      setIsSubmitting(false);
    }
  };

  const variants: any = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.2 }
    })
  };

  const renderStep = () => {
    switch(step) {
      case 0:
        return (
          <motion.div
            key="step-0"
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            className="text-center"
          >
            <motion.div 
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-accent-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-8 border border-accent-500/20"
            >
              <span className="text-5xl">👋</span>
            </motion.div>
            <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Welcome to GymTracker</h1>
            <p className="text-dark-300 text-lg leading-relaxed">
              Let's set up your profile so your new AI Coach can personalize your entire experience.
            </p>
          </motion.div>
        );
      case 1:
        return (
          <motion.div key="step-1" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6">
              <User className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2 text-center">What's your name?</h2>
            <p className="text-dark-300 mb-8 text-center">We'll use this to personalize your dashboard.</p>
            <input
              autoFocus
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
              placeholder="Preferred name"
              onKeyDown={(e) => e.key === 'Enter' && formData.name && handleNext()}
              className="w-full max-w-xs bg-dark-800 text-white text-2xl font-bold rounded-2xl px-6 py-5 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-center placeholder-dark-400"
            />
          </motion.div>
        );
      case 2:
        return (
          <motion.div key="step-2" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center mb-6">
              <Calendar className="w-8 h-8 text-orange-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2 text-center">How old are you?</h2>
            <p className="text-dark-300 mb-8 text-center">This helps tailor your fitness insights.</p>
            <input
              autoFocus
              type="number"
              value={formData.age}
              onChange={(e) => setFormData(p => ({ ...p, age: e.target.value }))}
              placeholder="Years"
              onKeyDown={(e) => e.key === 'Enter' && handleNext()}
              className="w-full max-w-xs bg-dark-800 text-white text-2xl font-bold rounded-2xl px-6 py-5 outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-center placeholder-dark-400"
            />
          </motion.div>
        );
      case 3:
        return (
          <motion.div key="step-3" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6">
              <Ruler className="w-8 h-8 text-purple-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2 text-center">How tall are you?</h2>
            <p className="text-dark-300 mb-8 text-center">Used to calculate BMI and ideal ranges.</p>
            <div className="relative w-full max-w-xs">
              <input
                autoFocus
                type="number"
                value={formData.height}
                onChange={(e) => setFormData(p => ({ ...p, height: e.target.value }))}
                placeholder="0"
                onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                className="w-full bg-dark-800 text-white text-3xl font-bold rounded-2xl px-6 py-6 outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-center placeholder-dark-400"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-dark-300 font-bold text-xl">cm</span>
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div key="step-4" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-6">
              <Dumbbell className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2 text-center">What's your current weight?</h2>
            <p className="text-dark-300 mb-8 text-center">Track your progress automatically.</p>
            <div className="relative w-full max-w-xs">
              <input
                autoFocus
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData(p => ({ ...p, weight: e.target.value }))}
                placeholder="0.0"
                onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                className="w-full bg-dark-800 text-white text-3xl font-bold rounded-2xl px-6 py-6 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-center placeholder-dark-400"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-dark-300 font-bold text-xl">{settings.defaultUnit}</span>
            </div>
          </motion.div>
        );
      case 5:
        return (
          <motion.div key="step-5" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" className="flex flex-col items-center w-full">
            <div className="w-16 h-16 rounded-2xl bg-accent-500/20 flex items-center justify-center mb-6">
              <Target className="w-8 h-8 text-accent-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2 text-center">What's your primary goal?</h2>
            <p className="text-dark-300 mb-8 text-center">This focuses the AI Coach's advice.</p>
            <div className="flex flex-col gap-3 w-full max-w-sm">
              {goals.map((goal, i) => (
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={goal}
                  onClick={() => setFormData(p => ({ ...p, goal }))}
                  className={`w-full p-4 rounded-2xl text-left font-semibold text-lg transition-all ${
                    formData.goal === goal 
                      ? 'bg-accent-500 text-white ring-2 ring-accent-400 shadow-[0_0_15px_rgba(56,189,248,0.3)] scale-105 z-10' 
                      : 'bg-dark-800 text-dark-200 hover:bg-dark-700'
                  }`}
                >
                  {goal}
                </motion.button>
              ))}
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-dark-900 overflow-hidden relative">
      {/* Background gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      {/* Progress Bar */}
      {step > 0 && (
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-dark-800 z-20">
          <motion.div 
            className="h-full bg-gradient-to-r from-accent-500 to-purple-500 shadow-[0_0_10px_rgba(56,189,248,0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${(step / (stepsLength - 1)) * 100}%` }}
            transition={{ type: 'spring', damping: 20 }}
          />
        </div>
      )}

      <div className="flex-1 max-w-lg w-full mx-auto px-6 flex flex-col justify-center relative z-10 py-12">
        <div className="relative flex-1 flex flex-col justify-center min-h-[400px]">
          <AnimatePresence mode="wait" custom={direction}>
             {renderStep()}
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-3 mt-8">
          {step > 0 && (
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrev}
              className="w-14 h-14 rounded-2xl bg-dark-800 text-white flex items-center justify-center hover:bg-dark-700 transition-colors shrink-0 shadow-lg"
            >
              <ChevronLeft className="w-6 h-6" />
            </motion.button>
          )}

          {step < stepsLength - 1 ? (
            <motion.button
              layout
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNext}
              disabled={step === 1 && !formData.name}
              className="flex-1 h-14 rounded-2xl bg-accent-500 text-white flex items-center justify-center gap-2 font-bold text-lg hover:bg-accent-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent-500/25"
            >
              {step === 0 ? "Let's Get Started" : "Continue"} <ChevronRight className="w-5 h-5" />
            </motion.button>
          ) : (
            <motion.button
              layout
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-accent-500 to-purple-600 text-white flex items-center justify-center gap-2 font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-purple-500/25"
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Finish Setup <ChevronRight className="w-5 h-5" /></>
              )}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
