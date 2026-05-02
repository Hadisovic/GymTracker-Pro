import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit3, Trash2, Search, X, Save } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { useWorkoutStore } from '../store/workoutStore';
import type { Exercise } from '../types/workout';

export default function ExerciseLibrary() {
  const { exercises, muscleGroups, addExercise, updateExercise, deleteExercise } = useWorkoutStore();

  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [editingEx, setEditingEx] = useState<Exercise | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formMuscle, setFormMuscle] = useState('');
  const [formEquipment, setFormEquipment] = useState('');
  const [formAliases, setFormAliases] = useState('');

  const filtered = exercises.filter(ex => {
    const matchesSearch = !search ||
      ex.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.aliases?.some(a => a.toLowerCase().includes(search.toLowerCase()));
    const matchesMuscle = !selectedMuscle || ex.muscleGroupId === selectedMuscle;
    return matchesSearch && matchesMuscle;
  });

  const grouped = muscleGroups.map(mg => ({
    ...mg,
    exercises: filtered.filter(e => e.muscleGroupId === mg.id),
  })).filter(g => g.exercises.length > 0);

  const startEdit = (ex: Exercise) => {
    setEditingEx(ex);
    setFormName(ex.name);
    setFormMuscle(ex.muscleGroupId);
    setFormEquipment(ex.equipment ?? '');
    setFormAliases(ex.aliases?.join(', ') ?? '');
    setIsAdding(false);
  };

  const startAdd = () => {
    setEditingEx(null);
    setFormName('');
    setFormMuscle(muscleGroups[0]?.id ?? '');
    setFormEquipment('');
    setFormAliases('');
    setIsAdding(true);
  };

  const handleSave = async () => {
    const aliases = formAliases.split(',').map(a => a.trim()).filter(Boolean);
    if (editingEx) {
      await updateExercise({
        ...editingEx,
        name: formName,
        muscleGroupId: formMuscle,
        equipment: formEquipment || undefined,
        aliases: aliases.length > 0 ? aliases : undefined,
      });
    } else {
      await addExercise({
        id: uuid(),
        name: formName,
        muscleGroupId: formMuscle,
        equipment: formEquipment || undefined,
        aliases: aliases.length > 0 ? aliases : undefined,
      });
    }
    setEditingEx(null);
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    await deleteExercise(id);
    setEditingEx(null);
    setIsAdding(false);
  };

  const showForm = isAdding || editingEx !== null;

  return (
    <motion.div
      className="page-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Exercise Library</h2>
        <motion.button
          onClick={startAdd}
          className="w-9 h-9 rounded-xl bg-accent-500/20 flex items-center justify-center text-accent-400"
          whileTap={{ scale: 0.9 }}
        >
          <Plus className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search exercises..."
          className="input-field pl-10 text-sm"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Muscle filter */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none">
        <button
          onClick={() => setSelectedMuscle(null)}
          className={`muscle-chip flex-shrink-0 ${
            !selectedMuscle
              ? 'bg-accent-500/20 text-accent-400 border border-accent-500/30'
              : 'bg-dark-600 text-dark-200 border border-transparent'
          }`}
        >
          All
        </button>
        {muscleGroups.map(mg => (
          <button
            key={mg.id}
            onClick={() => setSelectedMuscle(mg.id === selectedMuscle ? null : mg.id)}
            className="muscle-chip flex-shrink-0"
            style={{
              background: selectedMuscle === mg.id ? `${mg.color}20` : 'rgba(255,255,255,0.03)',
              color: selectedMuscle === mg.id ? mg.color : '#8888aa',
              border: `1px solid ${selectedMuscle === mg.id ? mg.color + '30' : 'transparent'}`,
            }}
          >
            {mg.name}
          </button>
        ))}
      </div>

      {/* Exercise Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="glass-card p-4 space-y-3">
              <h3 className="text-sm font-semibold text-white">
                {editingEx ? 'Edit Exercise' : 'New Exercise'}
              </h3>
              <input
                type="text"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="Exercise name"
                className="input-field text-sm"
              />
              <select
                value={formMuscle}
                onChange={e => setFormMuscle(e.target.value)}
                className="input-field text-sm"
              >
                {muscleGroups.map(mg => (
                  <option key={mg.id} value={mg.id}>{mg.name}</option>
                ))}
              </select>
              <input
                type="text"
                value={formEquipment}
                onChange={e => setFormEquipment(e.target.value)}
                placeholder="Equipment (optional)"
                className="input-field text-sm"
              />
              <input
                type="text"
                value={formAliases}
                onChange={e => setFormAliases(e.target.value)}
                placeholder="Aliases (comma-separated)"
                className="input-field text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setIsAdding(false); setEditingEx(null); }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                {editingEx && (
                  <button
                    onClick={() => handleDelete(editingEx.id)}
                    className="btn-danger flex-none px-4"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={!formName || !formMuscle}
                  className="btn-primary flex-1 disabled:opacity-40"
                >
                  <Save className="w-4 h-4" /> Save
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exercise List */}
      {grouped.map(group => (
        <div key={group.id} className="mb-5">
          <h3
            className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2"
            style={{ color: group.color }}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: group.color }} />
            {group.name}
            <span className="text-dark-400">({group.exercises.length})</span>
          </h3>
          <div className="space-y-1.5">
            {group.exercises.map(ex => (
              <motion.div
                key={ex.id}
                layout
                className="glass-card-sm p-3 flex items-center justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-medium truncate">{ex.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {ex.equipment && (
                      <span className="text-dark-400 text-xs">{ex.equipment}</span>
                    )}
                    {ex.aliases && ex.aliases.length > 0 && (
                      <span className="text-dark-500 text-[0.625rem]">
                        aka: {ex.aliases.slice(0, 2).join(', ')}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => startEdit(ex)}
                  className="text-dark-400 hover:text-accent-400 p-1.5 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="flex flex-col items-center py-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-dark-700 flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-dark-400" />
          </div>
          <p className="text-dark-200 font-medium">No exercises found</p>
          <p className="text-dark-400 text-sm mt-1">Try a different search or add a new exercise</p>
        </div>
      )}
    </motion.div>
  );
}
