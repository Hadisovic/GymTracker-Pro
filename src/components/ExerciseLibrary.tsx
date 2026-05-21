import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit3, Trash2, Search, X, Save, SlidersHorizontal } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { useWorkoutStore } from '../store/workoutStore';
import type { Exercise } from '../types/workout';

// ─── Real-Time PR Badges Subcomponent ───────────────────────
function ExercisePRDisplay({ exerciseId }: { exerciseId: string }) {
  const { prRecords } = useWorkoutStore();
  
  const exercisePRs = prRecords.filter(pr => pr.exerciseId === exerciseId);
  const weightPR = exercisePRs.find(pr => pr.type === 'weight');
  const volumePR = exercisePRs.find(pr => pr.type === 'volume');
  const est1RMPR = exercisePRs.find(pr => pr.type === 'estimated');

  if (exercisePRs.length === 0) return null;

  return (
    <div className="mt-2.5 grid grid-cols-3 gap-1.5 bg-dark-800/40 p-2 rounded-lg border border-dark-600/30">
      {weightPR && (
        <div className="text-center border-r border-dark-600/20">
          <p className="text-[7.5px] uppercase font-bold text-accent-400 tracking-wider">Peak Lift</p>
          <p className="text-[11px] font-extrabold text-white leading-tight mt-0.5">{weightPR.value} kg</p>
        </div>
      )}
      {volumePR && (
        <div className="text-center border-r border-dark-600/20">
          <p className="text-[7.5px] uppercase font-bold text-emerald-400 tracking-wider">Max Vol</p>
          <p className="text-[11px] font-extrabold text-white leading-tight mt-0.5">{Math.round(volumePR.value)} kg</p>
        </div>
      )}
      {est1RMPR && (
        <div className="text-center">
          <p className="text-[7.5px] uppercase font-bold text-amber-400 tracking-wider">Est. 1RM</p>
          <p className="text-[11px] font-extrabold text-white leading-tight mt-0.5">{est1RMPR.value} kg</p>
        </div>
      )}
    </div>
  );
}

export default function ExerciseLibrary() {
  const { exercises, muscleGroups, addExercise, updateExercise, deleteExercise } = useWorkoutStore();

  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [editingEx, setEditingEx] = useState<Exercise | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Advanced Filters & Sort State
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const [filterCustomOnly, setFilterCustomOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'alphabetical' | 'popularity' | 'recency'>('popularity');
  const [showFilters, setShowFilters] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formMuscle, setFormMuscle] = useState('');
  const [formCategory, setFormCategory] = useState<'strength' | 'cardio'>('strength');
  const [formEquipment, setFormEquipment] = useState('');
  const [formAliases, setFormAliases] = useState('');

  // Extract unique equipment dynamically from the data
  const uniqueEquipment = Array.from(
    new Set(exercises.map(e => e.equipment).filter(Boolean) as string[])
  );

  // Advanced multi-criteria search & filtering logic
  const filtered = exercises.filter(ex => {
    // 1. Fuzzy Search match on Name and Aliases
    const searchLower = search.toLowerCase().trim();
    const matchesSearch = !searchLower ||
      ex.name.toLowerCase().includes(searchLower) ||
      ex.aliases?.some(a => a.toLowerCase().includes(searchLower));

    // 2. Muscle Group match
    const matchesMuscle = !selectedMuscle || ex.muscleGroupId === selectedMuscle;

    // 3. Equipment category match
    const matchesEquipment = !selectedEquipment || ex.equipment === selectedEquipment;

    // 4. Custom Filter
    const matchesCustom = !filterCustomOnly || ex.isCustom;

    return matchesSearch && matchesMuscle && matchesEquipment && matchesCustom;
  }).sort((a, b) => {
    // Smart Sorting
    if (sortBy === 'popularity') {
      return (b.usageCount ?? 0) - (a.usageCount ?? 0);
    }
    if (sortBy === 'recency') {
      return new Date(b.lastPerformedAt ?? 0).getTime() - new Date(a.lastPerformedAt ?? 0).getTime();
    }
    return a.name.localeCompare(b.name);
  });

  const grouped = muscleGroups.map(mg => ({
    ...mg,
    exercises: filtered.filter(e => e.muscleGroupId === mg.id),
  })).filter(g => g.exercises.length > 0);

  const startEdit = (ex: Exercise) => {
    setEditingEx(ex);
    setFormName(ex.name);
    setFormMuscle(ex.muscleGroupId);
    setFormCategory(ex.category || 'strength');
    setFormEquipment(ex.equipment ?? '');
    setFormAliases(ex.aliases?.join(', ') ?? '');
    setIsAdding(false);
  };

  const startAdd = () => {
    setEditingEx(null);
    setFormName('');
    setFormMuscle(muscleGroups[0]?.id ?? '');
    setFormCategory('strength');
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
        category: formCategory,
        equipment: formEquipment || undefined,
        aliases: aliases.length > 0 ? aliases : undefined,
      });
    } else {
      await addExercise({
        id: uuid(),
        name: formName,
        muscleGroupId: formMuscle,
        category: formCategory,
        equipment: formEquipment || undefined,
        aliases: aliases.length > 0 ? aliases : undefined,
        isCustom: true,
        usageCount: 0,
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
      className="page-container pb-24"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Exercise Library</h2>
        <div className="flex gap-2">
          <motion.button
            onClick={() => setShowFilters(!showFilters)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              showFilters || selectedEquipment || filterCustomOnly || sortBy !== 'popularity'
                ? 'bg-accent-500/20 text-accent-400 border border-accent-500/30'
                : 'bg-dark-600 text-dark-300 border border-transparent'
            }`}
            whileTap={{ scale: 0.9 }}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={startAdd}
            className="w-9 h-9 rounded-xl bg-accent-500/20 flex items-center justify-center text-accent-400"
            whileTap={{ scale: 0.9 }}
          >
            <Plus className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Advanced Filters Block */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="glass-card p-4 space-y-4">
              {/* Filter Equipment */}
              <div>
                <p className="text-xs font-bold text-dark-300 uppercase tracking-wider mb-2">Filter by Equipment</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedEquipment(null)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      !selectedEquipment
                        ? 'bg-accent-500/20 text-accent-400 border-accent-500/30'
                        : 'bg-dark-700 text-dark-300 border-transparent hover:bg-dark-600'
                    }`}
                  >
                    All Equipment
                  </button>
                  {uniqueEquipment.map(eq => (
                    <button
                      key={eq}
                      onClick={() => setSelectedEquipment(eq === selectedEquipment ? null : eq)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        selectedEquipment === eq
                          ? 'bg-accent-500/20 text-accent-400 border-accent-500/30'
                          : 'bg-dark-700 text-dark-300 border-transparent hover:bg-dark-600'
                      }`}
                    >
                      {eq}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sorting and Creator Filters */}
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-dark-600/20">
                {/* Sort dropdown */}
                <div>
                  <p className="text-xs font-bold text-dark-300 uppercase tracking-wider mb-2">Sort Order</p>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as 'alphabetical' | 'popularity' | 'recency')}
                    className="input-field text-xs py-2"
                  >
                    <option value="popularity">Popularity (Frequency)</option>
                    <option value="recency">Recently Performed</option>
                    <option value="alphabetical">Alphabetical</option>
                  </select>
                </div>

                {/* Custom Only Switch */}
                <div>
                  <p className="text-xs font-bold text-dark-300 uppercase tracking-wider mb-2">Creator</p>
                  <button
                    onClick={() => setFilterCustomOnly(!filterCustomOnly)}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-bold border transition-all text-center ${
                      filterCustomOnly
                        ? 'bg-accent-500/20 text-accent-400 border-accent-500/30'
                        : 'bg-dark-700 text-dark-300 border-transparent hover:bg-dark-600'
                    }`}
                  >
                    {filterCustomOnly ? 'Custom Exercises Only' : 'Show All Creators'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search exercises by name or alias..."
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
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={formMuscle}
                  onChange={e => setFormMuscle(e.target.value)}
                  className="input-field text-sm"
                >
                  {muscleGroups.map(mg => (
                    <option key={mg.id} value={mg.id}>{mg.name}</option>
                  ))}
                </select>
                <select
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value as 'strength' | 'cardio')}
                  className="input-field text-sm"
                >
                  <option value="strength">Strength</option>
                  <option value="cardio">Cardio</option>
                </select>
              </div>
              <input
                type="text"
                value={formEquipment}
                onChange={e => setFormEquipment(e.target.value)}
                placeholder="Equipment (e.g. Dumbbell, Cables, Barbell)"
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
                className="glass-card-sm p-3 flex flex-col justify-between gap-1.5"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-white text-sm font-medium truncate">{ex.name}</p>
                      {ex.isCustom && (
                        <span className="text-[8px] bg-accent-500/20 text-accent-400 border border-accent-500/30 px-1 py-0.2 rounded font-extrabold uppercase tracking-wide">
                          Custom
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {ex.equipment && (
                        <span className="text-dark-400 text-xs">{ex.equipment}</span>
                      )}
                      {ex.aliases && ex.aliases.length > 0 && (
                        <span className="text-dark-500 text-[0.625rem] truncate">
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
                </div>
                
                {/* Real-Time Personal Records (PR) badging */}
                <ExercisePRDisplay exerciseId={ex.id} />
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
