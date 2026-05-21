import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ChevronDown, ChevronUp, Trash2, Edit3, X, Save,
  Calendar, Clock, Dumbbell, Zap, AlertTriangle
} from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';
import type { WorkoutSession, WorkoutSet } from '../types/workout';

export default function History({ isNested = false }: { isNested?: boolean }) {
  const { workoutHistory, muscleGroups, exercises, updateSession, deleteSession } = useWorkoutStore();

  const [search, setSearch] = useState('');
  const [filterMuscle, setFilterMuscle] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<WorkoutSession | null>(null);
  const [editName, setEditName] = useState('');
  const [editDate, setEditDate] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = [...workoutHistory].reverse();
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.sessionLabel.toLowerCase().includes(q) ||
        s.exercises.some(e => e.exerciseName.toLowerCase().includes(q))
      );
    }
    if (filterMuscle) {
      result = result.filter(s => s.muscleGroupIds.includes(filterMuscle));
    }
    return result;
  }, [workoutHistory, search, filterMuscle]);

  const startEdit = (session: WorkoutSession) => {
    setEditingSession(session);
    setEditName(session.name);
    setEditDate(session.date ? session.date.substring(0, 10) : '');
  };

  const saveEdit = async () => {
    if (!editingSession) return;
    const updated = {
      ...editingSession,
      name: editName,
      date: editDate || null,
    };
    await updateSession(updated);
    setEditingSession(null);
  };

  const handleDelete = async (id: string) => {
    await deleteSession(id);
    setDeleteConfirmId(null);
  };

  const formatSet = (set: WorkoutSet) => {
    if (set.time !== undefined || set.distance !== undefined) {
      const parts: string[] = [];
      if (set.time) parts.push(`${set.time}m`);
      if (set.distance) parts.push(`${set.distance}${set.unit === 'kg' ? 'km' : 'mi'}`);
      if (set.speed) parts.push(`@ ${set.speed}${set.unit === 'kg' ? 'km/h' : 'mph'}`);
      if (set.incline) parts.push(`Inc: ${set.incline}`);
      return parts.length > 0 ? parts.join(' ') : 'Completed';
    }

    const parts: string[] = [];
    if (set.weightMode === 'bodyweight') {
      parts.push('BW');
    } else if (set.weight !== null) {
      parts.push(`${set.weight}${set.unit}`);
      if (set.weightMode === 'each_side') parts.push('(ea. side)');
    }
    if (set.reps !== null) parts.push(`× ${set.reps}`);
    else parts.push('× ?');
    return parts.join(' ');
  };

  const content = (
    <>
      {!isNested && <h2 className="text-xl font-bold text-white mb-4">Workout History</h2>}

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search sessions, exercises..."
          className="input-field pl-10 text-sm"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-300">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Muscle Filter */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 no-scrollbar">
        <button
          onClick={() => setFilterMuscle(null)}
          className={`muscle-chip flex-shrink-0 ${
            !filterMuscle ? 'bg-accent-500/20 text-accent-400 border border-accent-500/30' : 'bg-dark-600 text-dark-200 border border-transparent'
          }`}
        >
          All
        </button>
        {muscleGroups.map(mg => (
          <button
            key={mg.id}
            onClick={() => setFilterMuscle(mg.id === filterMuscle ? null : mg.id)}
            className="muscle-chip flex-shrink-0"
            style={{
              background: filterMuscle === mg.id ? `${mg.color}20` : 'rgba(255,255,255,0.03)',
              color: filterMuscle === mg.id ? mg.color : '#8888aa',
              border: `1px solid ${filterMuscle === mg.id ? mg.color + '30' : 'transparent'}`,
            }}
          >
            {mg.name}
          </button>
        ))}
      </div>

      {/* Sessions */}
      <div className="space-y-3">
        {filtered.map((session, i) => {
          const isExpanded = expandedId === session.id;
          const totalSets = session.exercises.reduce((sum, e) => sum + e.sets.length, 0);

          return (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass-card overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : session.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold">{session.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-dark-300">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {session.date
                          ? new Date(session.date).toLocaleDateString()
                          : session.sessionLabel}
                      </span>
                      <span className="flex items-center gap-1">
                        <Dumbbell className="w-3 h-3" />
                        {session.exercises.length} exercises
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {totalSets} sets
                      </span>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-dark-300" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-dark-300" />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3">
                      {session.exercises.map(log => {
                        const ex = exercises.find(e => e.id === log.exerciseId);
                        const mg = muscleGroups.find(m => m.id === ex?.muscleGroupId);
                        return (
                          <div key={log.exerciseId} className="glass-card-sm p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ background: mg?.color ?? '#6366f1' }}
                              />
                              <span className="text-white text-sm font-medium">{log.exerciseName}</span>
                            </div>
                            <div className="space-y-1">
                              {log.sets.map(set => (
                                <div key={set.id} className="flex items-center gap-2 text-xs">
                                  <span className="text-dark-400 w-5">#{set.setNumber}</span>
                                  <span className="text-dark-100">{formatSet(set)}</span>
                                  {set.isDropSet && (
                                    <span className="text-orange-400 flex items-center gap-0.5">
                                      <AlertTriangle className="w-2.5 h-2.5" />
                                      {set.drops?.map(d => `${d.weight}${set.unit}`).join('→')}
                                    </span>
                                  )}
                                  {set.toFailure && <Zap className="w-3 h-3 text-yellow-500" />}
                                  {set.notes && <span className="text-dark-400">({set.notes})</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}

                      {/* Action buttons */}
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => startEdit(session)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-dark-600 text-dark-100 text-xs font-medium"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(session.id)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center py-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-dark-700 flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-dark-400" />
          </div>
          <p className="text-dark-200 font-medium">No sessions found</p>
          <p className="text-dark-400 text-sm mt-1">Start a workout to build your history</p>
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editingSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)' }}
            onClick={() => setEditingSession(null)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="glass-card p-5 w-full max-w-md space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-white font-semibold">Edit Session</h3>
              <div>
                <label className="text-dark-300 text-xs font-medium mb-1 block">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="text-dark-300 text-xs font-medium mb-1 block">Date</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={e => setEditDate(e.target.value)}
                  className="input-field text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditingSession(null)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={saveEdit} className="btn-primary flex-1">
                  <Save className="w-4 h-4" /> Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)' }}
            onClick={() => setDeleteConfirmId(null)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="glass-card p-5 w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-white font-semibold mb-2">Delete Session?</h3>
              <p className="text-dark-300 text-sm mb-4">This action cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteConfirmId(null)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={() => handleDelete(deleteConfirmId)} className="btn-danger flex-1">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  if (isNested) {
    return <div className="space-y-4 pb-24">{content}</div>;
  }

  return (
    <motion.div
      className="page-container pb-24"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {content}
    </motion.div>
  );
}
