import type { MuscleGroup, Exercise, WorkoutPreset } from '../types/workout';

// ─── Muscle Groups ────────────────────────────────────────
export const defaultMuscleGroups: MuscleGroup[] = [
  { id: 'chest',     name: 'Chest',     color: '#f43f5e' },
  { id: 'back',      name: 'Back',      color: '#3b82f6' },
  { id: 'shoulders', name: 'Shoulders', color: '#a855f7' },
  { id: 'biceps',    name: 'Biceps',    color: '#f97316' },
  { id: 'triceps',   name: 'Triceps',   color: '#14b8a6' },
  { id: 'legs',      name: 'Legs',      color: '#eab308' },
  { id: 'forearms',  name: 'Forearms',  color: '#64748b' },
  { id: 'abs',       name: 'Abs',       color: '#ec4899' },
  { id: 'cardio',    name: 'Cardio',    color: '#f97316' },
];

// ─── Exercises ────────────────────────────────────────────
export const defaultExercises: Exercise[] = [
  // Chest
  { id: 'incline-db-bench',     name: 'Incline DB Bench Press',       aliases: ['Incline Press', 'Incline Dumbbell Press'],     muscleGroupId: 'chest', equipment: 'Dumbbells' },
  { id: 'flat-press',           name: 'Flat Press',                   aliases: ['Flat Bench Press', 'Bench Press'],              muscleGroupId: 'chest', equipment: 'Barbell / Dumbbells' },
  { id: 'chest-fly',            name: 'Chest Fly',                    aliases: ['Pec Fly', 'Machine Fly'],                      muscleGroupId: 'chest', equipment: 'Machine' },
  { id: 'cable-fly',            name: 'Cable Fly',                    aliases: ['Cable Chest Fly', 'Cable Crossover'],          muscleGroupId: 'chest', equipment: 'Cable' },

  // Back
  { id: 'wide-lat-pulldown',    name: 'Wide Lat Pulldown',            aliases: ['Wide Grip Lat Pulldown', 'Lat Pulldown Wide'],  muscleGroupId: 'back', equipment: 'Cable Machine' },
  { id: 'close-lat-pulldown',   name: 'Close Grip Lat Pulldown',      aliases: ['Close Lat Pulldown', 'Narrow Grip Pulldown'],   muscleGroupId: 'back', equipment: 'Cable Machine' },
  { id: 'cable-row-single',     name: 'Single-arm Cable Row',         aliases: ['Cable Row Single Arm', 'One Arm Cable Row'],    muscleGroupId: 'back', equipment: 'Cable' },
  { id: 'cable-row-both',       name: 'Cable Row Both Arms',          aliases: ['Seated Cable Row', 'Cable Row'],                muscleGroupId: 'back', equipment: 'Cable' },
  { id: 't-bar-row',            name: 'T-Bar Row',                    aliases: ['T Bar Row', 'Landmine Row'],                    muscleGroupId: 'back', equipment: 'T-Bar' },

  // Shoulders
  { id: 'lateral-raises',       name: 'Lateral Raises',               aliases: ['Side Raises', 'DB Lateral Raise'],              muscleGroupId: 'shoulders', equipment: 'Dumbbells' },
  { id: 'cable-lateral-raises', name: 'Cable Lateral Raises',         aliases: ['Cable Side Raise'],                             muscleGroupId: 'shoulders', equipment: 'Cable' },
  { id: 'shoulder-press',       name: 'Shoulder Press Machine',       aliases: ['Shoulder Press', 'Machine Shoulder Press'],      muscleGroupId: 'shoulders', equipment: 'Machine' },
  { id: 'face-pull',            name: 'Face Pull',                    aliases: ['Cable Face Pull'],                              muscleGroupId: 'shoulders', equipment: 'Cable' },
  { id: 'rear-delt-cable',      name: 'Single-arm Rear Delt Cable',   aliases: ['Rear Delt Cable', 'Reverse Cable Fly'],         muscleGroupId: 'shoulders', equipment: 'Cable' },

  // Biceps
  { id: 'ez-preacher-curl',     name: 'EZ Bar Preacher Curl',         aliases: ['Preacher Curl', 'EZ Curl'],                    muscleGroupId: 'biceps', equipment: 'EZ Bar' },
  { id: 'single-preacher-curl', name: 'Single-arm Preacher Curl',     aliases: ['One Arm Preacher Curl', 'DB Preacher Curl'],     muscleGroupId: 'biceps', equipment: 'Dumbbell' },
  { id: 'hammer-curl',          name: 'Hammer Curl',                  aliases: ['DB Hammer Curl'],                               muscleGroupId: 'biceps', equipment: 'Dumbbells' },
  { id: 'cable-curl-behind',    name: 'Cable Curl Behind Body',       aliases: ['Behind Body Cable Curl', 'Bayesian Curl'],       muscleGroupId: 'biceps', equipment: 'Cable' },

  // Triceps
  { id: 'overhead-triceps',     name: 'Overhead Triceps Cable',       aliases: ['Single Arm Overhead Triceps Cable', 'Overhead Triceps', 'Overhead Cable Extension'], muscleGroupId: 'triceps', equipment: 'Cable' },
  { id: 'triceps-pushdown',     name: 'Triceps Pushdown',             aliases: ['Cable Pushdown', 'Rope Pushdown'],              muscleGroupId: 'triceps', equipment: 'Cable' },
  { id: 'triceps-machine',      name: 'Triceps Machine',              aliases: ['Tricep Machine', 'Machine Triceps Extension'],   muscleGroupId: 'triceps', equipment: 'Machine' },
  { id: 'single-arm-cable-tri', name: 'Single Arm Triceps Cable',     aliases: ['Single Arm Cable', 'One Arm Pushdown'],          muscleGroupId: 'triceps', equipment: 'Cable' },

  // Legs
  { id: 'leg-press',            name: 'Leg Press',                    aliases: ['Machine Leg Press'],                            muscleGroupId: 'legs', equipment: 'Machine' },
  { id: 'leg-curl',             name: 'Leg Curl',                     aliases: ['Hamstring Curl', 'Lying Leg Curl'],             muscleGroupId: 'legs', equipment: 'Machine' },
  { id: 'leg-extension',        name: 'Leg Extension',                aliases: ['Quad Extension'],                               muscleGroupId: 'legs', equipment: 'Machine' },
  { id: 'calf-raises',          name: 'Calf Raises',                  aliases: ['Standing Calf Raise', 'Seated Calf Raise'],     muscleGroupId: 'legs', equipment: 'Machine / Bodyweight' },

  // Forearms
  { id: 'wrist-curl',           name: 'Wrist Curl',                   aliases: ['Forearm Curl'],                                muscleGroupId: 'forearms', equipment: 'Barbell / Dumbbells' },
  { id: 'reverse-wrist-curl',   name: 'Reverse Wrist Curl',           aliases: ['Reverse Forearm Curl'],                        muscleGroupId: 'forearms', equipment: 'Barbell / Dumbbells' },

  // Abs
  { id: 'cable-crunch',         name: 'Cable Crunch',                 aliases: ['Kneeling Cable Crunch'],                       muscleGroupId: 'abs', equipment: 'Cable' },
  { id: 'hanging-leg-raise',    name: 'Hanging Leg Raise',            aliases: ['Leg Raise'],                                   muscleGroupId: 'abs', equipment: 'Bodyweight' },

  // Cardio
  { id: 'treadmill',            name: 'Treadmill',                    aliases: ['Running', 'Walking'],                          muscleGroupId: 'cardio', equipment: 'Machine', category: 'cardio' },
  { id: 'stairmaster',          name: 'Stairmaster',                  aliases: ['Stairs'],                                      muscleGroupId: 'cardio', equipment: 'Machine', category: 'cardio' },
  { id: 'cycling',              name: 'Cycling',                      aliases: ['Stationary Bike', 'Bike'],                     muscleGroupId: 'cardio', equipment: 'Machine', category: 'cardio' },
  { id: 'rowing',               name: 'Rowing Machine',               aliases: ['Erg', 'Rowing'],                               muscleGroupId: 'cardio', equipment: 'Machine', category: 'cardio' },
];

// ─── Workout Presets ──────────────────────────────────────
export const defaultWorkoutPresets: WorkoutPreset[] = [
  { id: 'chest-back',               name: 'Chest + Back',                    muscleGroupIds: ['chest', 'back'] },
  { id: 'shoulders-biceps-triceps', name: 'Shoulders + Biceps + Triceps',   muscleGroupIds: ['shoulders', 'biceps', 'triceps'] },
  { id: 'legs-forearms',            name: 'Legs + Forearms',                muscleGroupIds: ['legs', 'forearms'] },
  { id: 'abs',                      name: 'Abs',                            muscleGroupIds: ['abs'] },
];
