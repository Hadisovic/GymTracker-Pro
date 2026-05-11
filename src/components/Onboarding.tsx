import { useState } from 'react';
import { motion } from 'framer-motion';
import { useWorkoutStore } from '../store/workoutStore';
import { User, Target, Dumbbell, Ruler, ChevronRight } from 'lucide-react';

export default function Onboarding() {
  const { user, updateSettings } = useWorkoutStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.displayName?.split(' ')[0] || '',
    age: '',
    weight: '',
    height: '',
    goal: 'Build Muscle', // Default goal
  });

  const goals = [
    'Build Muscle',
    'Lose Weight',
    'Improve Endurance',
    'Maintain Health',
    'Get Stronger'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      // App.tsx will automatically re-render and show Dashboard
    } catch (e) {
      console.error("Failed to save profile:", e);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-dark-900 overflow-y-auto">
      <div className="flex-1 max-w-lg w-full mx-auto px-6 py-12 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-accent-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">👋</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to GymTracker</h1>
          <p className="text-dark-300">Let's set up your profile so the AI Coach can personalize your experience.</p>
        </motion.div>

        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* Name */}
          <div className="glass-card p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-dark-200 mb-2">
              <User className="w-4 h-4 text-accent-400" /> Preferred Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
              placeholder="What should we call you?"
              className="w-full bg-dark-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent-500/50 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Age */}
            <div className="glass-card p-4">
              <label className="flex items-center gap-2 text-sm font-medium text-dark-200 mb-2">
                 Age
              </label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData(p => ({ ...p, age: e.target.value }))}
                placeholder="Years"
                className="w-full bg-dark-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent-500/50 transition-all"
              />
            </div>

            {/* Height */}
            <div className="glass-card p-4">
              <label className="flex items-center gap-2 text-sm font-medium text-dark-200 mb-2">
                <Ruler className="w-4 h-4 text-purple-400" /> Height
              </label>
              <input
                type="number"
                value={formData.height}
                onChange={(e) => setFormData(p => ({ ...p, height: e.target.value }))}
                placeholder="cm"
                className="w-full bg-dark-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
              />
            </div>
          </div>

          {/* Weight */}
          <div className="glass-card p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-dark-200 mb-2">
              <Dumbbell className="w-4 h-4 text-blue-400" /> Current Weight
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.weight}
              onChange={(e) => setFormData(p => ({ ...p, weight: e.target.value }))}
              placeholder="kg"
              className="w-full bg-dark-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>

          {/* Primary Goal */}
          <div className="glass-card p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-dark-200 mb-3">
              <Target className="w-4 h-4 text-green-400" /> Primary Goal
            </label>
            <div className="flex flex-wrap gap-2">
              {goals.map(goal => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, goal }))}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    formData.goal === goal
                      ? 'bg-accent-500 text-white'
                      : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                  }`}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={!formData.name || isSubmitting}
            className="w-full btn-primary py-4 mt-8 flex items-center justify-center gap-2 text-lg font-bold"
          >
            {isSubmitting ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>Let's Go <ChevronRight className="w-5 h-5" /></>
            )}
          </motion.button>
        </motion.form>
      </div>
    </div>
  );
}
