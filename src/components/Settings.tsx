import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Download, Upload, RotateCcw, Shield, Database,
  ChevronRight, Check, AlertTriangle, Cloud, LogOut, Bot
} from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';

export default function Settings() {
  const {
    settings, updateSettings, exportData, importData, resetToSeed, rebuildPRs,
    workoutHistory, exercises, muscleGroups, prRecords, updateExercise,
    user, logout, syncToCloud, syncFromCloud
  } = useWorkoutStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showRebuildConfirm, setShowRebuildConfirm] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const handleCloudSync = async (type: 'push' | 'pull') => {
    setSyncStatus('syncing');
    try {
      if (type === 'push') await syncToCloud();
      else await syncFromCloud();
      setSyncStatus('success');
      setTimeout(() => setSyncStatus(null), 3000);
    } catch (e) {
      console.error(e);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus(null), 3000);
    }
  };

  const handleExport = async () => {
    const json = await exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gymtracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const json = await file.text();
      await importData(json);
      try {
        await syncToCloud();
      } catch (e) {
        console.warn("Auto-sync after import failed:", e);
      }
      setImportStatus('success');
      setTimeout(() => setImportStatus(null), 3000);
    } catch {
      setImportStatus('error');
      setTimeout(() => setImportStatus(null), 3000);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReset = async () => {
    await resetToSeed();
    setShowResetConfirm(false);
  };

  const handleRebuildPRs = async () => {
    await rebuildPRs();
    setShowRebuildConfirm(false);
  };

  return (
    <motion.div
      className="page-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-xl font-bold text-white mb-6">Settings</h2>

      {/* Stats */}
      <div className="glass-card p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Database className="w-4 h-4 text-accent-400" />
          <h3 className="text-sm font-semibold text-white">Data Summary</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Sessions', value: workoutHistory.length },
            { label: 'Exercises', value: exercises.length },
            { label: 'Muscle Groups', value: muscleGroups.length },
            { label: 'PRs Tracked', value: prRecords.length },
          ].map(stat => (
            <div key={stat.label} className="glass-card-sm p-3">
              <p className="text-dark-300 text-xs">{stat.label}</p>
              <p className="text-white text-lg font-bold">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Default Unit */}
      <div className="glass-card p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium text-sm">Default Weight Unit</p>
            <p className="text-dark-300 text-xs mt-0.5">Used for new sets globally</p>
          </div>
          <div className="flex gap-1">
            {(['kg', 'lbs'] as const).map(u => (
              <button
                key={u}
                onClick={() => updateSettings({ defaultUnit: u })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  settings.defaultUnit === u
                    ? 'bg-accent-500 text-white'
                    : 'bg-dark-600 text-dark-200'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Configuration */}
      <div className="glass-card p-4 mb-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex-1">
            <p className="text-white font-medium text-sm">AI Assistant (Gemini)</p>
            <p className="text-dark-300 text-xs mt-0.5">
              Enter your Google Gemini API Key to enable the smart assistant. Keys are stored securely in your browser and never sent to our servers.
            </p>
          </div>
        </div>
        <input
          type="password"
          placeholder="Paste your Gemini API Key here..."
          value={settings.aiApiKey || ''}
          onChange={(e) => updateSettings({ aiApiKey: e.target.value })}
          className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
        />
        <a 
          href="https://aistudio.google.com/app/apikey" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-purple-400 hover:text-purple-300 mt-2 inline-block"
        >
          Get a free API key &rarr;
        </a>
      </div>

      {/* Exercise Units */}
      <div className="glass-card p-4 mb-6">
        <div className="mb-3">
          <p className="text-white font-medium text-sm">Exercise Specific Units</p>
          <p className="text-dark-300 text-xs mt-0.5">Override the global unit for specific exercises</p>
        </div>
        <div className="max-h-64 overflow-y-auto pr-2 space-y-1">
          {exercises.map(ex => {
            // If the exercise has no specific unit, it falls back to the global default
            const currentUnit = ex.defaultUnit || settings.defaultUnit;
            return (
              <div key={ex.id} className="flex items-center justify-between py-2 border-b border-dark-600/50 last:border-0">
                <span className="text-dark-100 text-sm truncate pr-2">{ex.name}</span>
                <div className="flex gap-1 shrink-0">
                  {(['kg', 'lbs'] as const).map(u => {
                    const isActive = currentUnit === u;
                    return (
                      <button
                        key={u}
                        onClick={() => updateExercise({ ...ex, defaultUnit: u })}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-accent-500 text-white'
                            : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                        }`}
                      >
                        {u}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cloud Sync */}
      <div className="space-y-2 mb-6">
        <h3 className="text-sm font-semibold text-dark-200 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Cloud className="w-4 h-4" /> Cloud Sync
        </h3>

        {user && (
          <div className="glass-card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent-500/20 flex items-center justify-center">
                  <span className="text-accent-400 font-bold text-xs">{user.displayName?.[0] || 'U'}</span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{user.displayName || 'User'}</p>
                  <p className="text-dark-300 text-xs">{user.email}</p>
                </div>
              </div>
              <button onClick={logout} className="text-dark-400 hover:text-red-400 transition-colors p-2" title="Sign Out">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleCloudSync('push')}
                disabled={syncStatus === 'syncing'}
                className="btn-secondary py-2 flex items-center justify-center gap-2 text-xs"
              >
                <Upload className="w-3 h-3" /> Force Backup
              </button>
              <button
                onClick={() => handleCloudSync('pull')}
                disabled={syncStatus === 'syncing'}
                className="btn-secondary py-2 flex items-center justify-center gap-2 text-xs"
              >
                <Download className="w-3 h-3" /> Force Restore
              </button>
            </div>

            {syncStatus && (
              <p className={`text-xs text-center font-medium ${
                syncStatus === 'success' ? 'text-green-400' :
                syncStatus === 'error' ? 'text-red-400' : 'text-accent-400 animate-pulse'
              }`}>
                {syncStatus === 'syncing' && 'Syncing...'}
                {syncStatus === 'success' && '✓ Sync completed'}
                {syncStatus === 'error' && '✗ Sync failed'}
              </p>
            )}
          </div>
        )}
      </div>


      {/* Export / Import */}
      <div className="space-y-2 mb-6">
        <h3 className="text-sm font-semibold text-dark-200 uppercase tracking-wider mb-3">
          Data Management
        </h3>

        <motion.button
          onClick={handleExport}
          className="w-full glass-card p-4 flex items-center justify-between"
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center">
              <Download className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-left">
              <p className="text-white font-medium text-sm">Export Backup</p>
              <p className="text-dark-300 text-xs">Download all data as JSON</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-dark-400" />
        </motion.button>

        <motion.button
          onClick={() => fileInputRef.current?.click()}
          className="w-full glass-card p-4 flex items-center justify-between"
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <Upload className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-left">
              <p className="text-white font-medium text-sm">Import Backup</p>
              <p className="text-dark-300 text-xs">Restore from JSON file</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {importStatus === 'success' && <Check className="w-4 h-4 text-green-400" />}
            {importStatus === 'error' && <AlertTriangle className="w-4 h-4 text-red-400" />}
            <ChevronRight className="w-4 h-4 text-dark-400" />
          </div>
        </motion.button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImport}
        />

        <motion.button
          onClick={() => setShowRebuildConfirm(true)}
          className="w-full glass-card p-4 flex items-center justify-between"
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-left">
              <p className="text-white font-medium text-sm">Rebuild PRs</p>
              <p className="text-dark-300 text-xs">Recalculate from history</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-dark-400" />
        </motion.button>

        <motion.button
          onClick={() => setShowResetConfirm(true)}
          className="w-full glass-card p-4 flex items-center justify-between"
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-red-400" />
            </div>
            <div className="text-left">
              <p className="text-white font-medium text-sm">Reset to Seed Data</p>
              <p className="text-dark-300 text-xs">Restore defaults (destructive)</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-dark-400" />
        </motion.button>
      </div>

      {/* Import Status Toast */}
      {importStatus && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className={`fixed bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-sm font-medium ${
            importStatus === 'success'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}
        >
          {importStatus === 'success' ? '✓ Import successful' : '✗ Import failed'}
        </motion.div>
      )}

      {/* Reset Confirm */}
      {showResetConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-end justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setShowResetConfirm(false)}
        >
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="glass-card p-5 w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-white font-semibold mb-2">Reset All Data?</h3>
            <p className="text-dark-300 text-sm mb-4">
              This will delete all your workout history and restore defaults. Export a backup first!
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowResetConfirm(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleReset} className="btn-danger flex-1">Reset</button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Rebuild Confirm */}
      {showRebuildConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-end justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setShowRebuildConfirm(false)}
        >
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="glass-card p-5 w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-white font-semibold mb-2">Rebuild PRs?</h3>
            <p className="text-dark-300 text-sm mb-4">
              This will recalculate all PRs from your workout history. Useful after editing past sessions.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowRebuildConfirm(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleRebuildPRs} className="btn-primary flex-1">Rebuild</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
