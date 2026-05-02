# GymTracker Pro — Premium Gym Logging PWA

## Overview
Build a visually premium, mobile-first gym logging Progressive Web App using React + TypeScript + Vite. The app replaces a chat-based workout tracker with a polished, Apple-style dark UI featuring glassmorphism, Framer Motion animations, and real-time workout logging.

## Tech Stack
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS v3
- **Animations**: Framer Motion
- **Charts**: Recharts
- **State**: Zustand + localStorage persistence
- **PWA**: vite-plugin-pwa
- **Icons**: Lucide React

## Architecture

```
src/
├── types/workout.ts          # All TypeScript interfaces
├── data/
│   ├── seedWorkoutData.ts    # Muscle groups, exercises, presets
│   └── seedWorkoutHistory.ts # 6 sessions of real workout history
├── store/workoutStore.ts     # Zustand store with persistence
├── utils/
│   ├── prDetection.ts        # PR detection logic
│   └── analytics.ts          # Chart data computation
├── components/
│   ├── Layout.tsx             # Shell + bottom nav
│   ├── Dashboard.tsx          # Home screen
│   ├── WorkoutBuilder.tsx     # Build/select workouts
│   ├── ActiveWorkout.tsx      # Live workout session
│   ├── ExerciseLogger.tsx     # Set logging UI
│   ├── ExerciseLibrary.tsx    # Browse/edit exercises
│   ├── History.tsx            # Past sessions
│   ├── Analytics.tsx          # Charts page
│   ├── Settings.tsx           # Import/export/settings
│   └── ui/                    # Shared UI components
│       ├── PRBadge.tsx
│       ├── SetCard.tsx
│       └── EmptyState.tsx
├── App.tsx
├── main.tsx
└── index.css
```

## Proposed Changes

### Phase 1: Project Setup
- Initialize Vite + React + TS project
- Install dependencies: tailwindcss, framer-motion, recharts, zustand, lucide-react, vite-plugin-pwa
- Configure Tailwind with custom dark theme, glassmorphism utilities
- Set up PWA manifest and service worker

### Phase 2: Types & Data Layer
- `src/types/workout.ts` — Complete type system for exercises, sets, drop sets, sessions, PRs
- `src/data/seedWorkoutData.ts` — 8 muscle groups, ~30 exercises, 4 workout presets
- `src/data/seedWorkoutHistory.ts` — All 6 sessions with full detail preservation

### Phase 3: State Management
- `src/store/workoutStore.ts` — Zustand store with:
  - Muscle groups, exercises, workout presets CRUD
  - Active workout state machine
  - History management
  - Latest logs tracking
  - Import/export JSON
  - localStorage persistence via zustand/middleware

### Phase 4: UI Components & Pages
1. **Layout + Navigation** — Bottom tab bar, page transitions
2. **Dashboard** — Quick stats, recent workouts, start workout CTA
3. **Workout Builder** — Select presets or custom muscles, pick exercises
4. **Active Workout** — Exercise list, tap to log, previous log reference
5. **Exercise Logger** — Set entry with weight/reps/drops/notes/toggles
6. **Exercise Library** — Browse by muscle, add/edit/delete
7. **History** — Sessions by date, expand to see details, edit/delete
8. **Analytics** — 7 Recharts charts
9. **Settings** — Dark mode, import/export JSON, reset data

### Phase 5: PR Detection & Utilities
- Detect heaviest weight, rep PR, volume PR, matched peak
- Badge rendering on sets and exercise cards

### Phase 6: Polish & PWA
- Framer Motion page transitions and micro-animations
- PWA manifest, icons, service worker
- Final responsive polish

## Verification Plan

### Automated
- `npm run build` — Ensure clean production build
- `npm run dev` — Visual inspection in browser

### Manual
- Test all workout flows in browser
- Verify PWA installability
- Test import/export
- Verify all 6 sessions appear in history
- Check PR badges display correctly
- Verify charts render with seed data

> [!IMPORTANT]
> This is a large project (~20+ files). I'll build it incrementally and verify at the end. The seed history data will faithfully preserve all weights, reps, drop sets, partial reps, and notes from the provided workout logs.
