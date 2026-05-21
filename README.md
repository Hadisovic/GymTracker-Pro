# ⚡ GymTracker Pro — Premium Gym Logging & Analytics PWA

<div align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black&style=for-the-badge" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white&style=for-the-badge" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?logo=tailwind-css&logoColor=white&style=for-the-badge" alt="Tailwind CSS 3" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white&style=for-the-badge" alt="Vite 6" />
  <img src="https://img.shields.io/badge/PWA-Ready-FF6F00?logo=pwa&logoColor=white&style=for-the-badge" alt="PWA Ready" />
</div>

<br />

**GymTracker Pro** is a high-performance, evidence-based training logger and analytical powerhouse designed with an Apple-style dark glassmorphism aesthetic. It streamlines fitness tracking into a minimalist, offline-first workflow, combining state-of-the-art vector anatomy graphics with elite sports-science analytics.

---

## ✨ Core Pillars & Features

### 🌟 1. Elite Minimalist UI (4-Tab Layout)
We consolidated 7 clunky tabs into **4 focused navigation tabs** optimized for fast-paced workout scenarios:
* 🏠 **Home/Log**: Quick statistics, recent sessions, and instant preset templates to launch active logging within 2 seconds.
* 📚 **Exercises**: Custom muscle-group filters, advanced search, creators, and sorting drawers.
* 📊 **Tracker**: Unified space containing advanced graphical charts and a comprehensive, editable history log.
* ⚙️ **Settings**: Dark mode modifiers, system defaults (metric/imperial), and seamless manual JSON data import/exports.

---

### 🗺️ 2. Interactive 2.5D Anatomical Muscle Map
Built directly inside the exercise library using premium, responsive vector pathways:
* **Frictionless Rotation**: Smoothly spin the anatomical avatar between **Front** and **Back** views using `framer-motion` triggers.
* **Instant Filtering**: Click any muscle on the model to automatically filter the catalog and show matching exercises.
* **Workload-Decayed Muscle Fatigue**: Hovering over a muscle displays detailed metrics calculated from your last 7 days of training volume using a time-decay exponential fatigue algorithm.

---

### 📊 3. Sports-Science Analytical Engines
Replaced unscientific charts with 4 validated models tailored to hypertrophy science and recovery thresholds:

| Analytics Model | Scientific Safeguard | Description |
| :--- | :--- | :--- |
| **Weekly Progressive Overload** | Progression Tracking | Tracks cumulative training volume (Tonnage) against the total number of Hard Sets completed week-over-week. |
| **Hypertrophy Volume Landmarks** | Hypertrophy Optimization | Compares actual sets completed per muscle group against Mike Israetel's landmarks: **MEV** (Min Effective), **MAV** (Max Adaptive), and **MRV** (Max Recoverable) zones. |
| **Acute-to-Chronic Workload Ratio (ACWR)** | Fatigue & Injury Guard | Gabbett's index dividing 7-day acute volume spike by 28-day chronic baseline to warn you before entering overtraining injury zones. |
| **Cardio Pace Analytics** | Pace Progression | Dedicated cardio tracker with a reversed Y-axis pace scale, plotting faster speeds visually higher on the graph. |

---

### 📶 4. Robust Offline-First Cloud Sync
* **Destruction-Free Syncing**: Offline-first Dexie (IndexedDB) protection. Local workouts are backed up safely on-device without data wipes.
* **Live Sync Pill Indicators**: Integrated a premium glassmorphic top status pill showcasing database sync states (`Synced`, `Local-only`, `Syncing`, and `Offline`).

---

## 📁 Premium Folder Architecture

```
src/
├── components/
│   ├── charts/                # Advanced Recharts implementations
│   │   ├── ACWRChart.tsx      # Fatigue safeguard index
│   │   ├── CardioPaceChart.tsx# Reversed-pace cardio monitoring
│   │   ├── MuscleLandmarksChart.tsx # MEV/MAV/MRV boundaries
│   │   └── WeeklyOverloadChart.tsx  # Dual-axis progressive volume
│   ├── ActiveWorkout.tsx      # Inline set spreadsheet & audio timer
│   ├── AIAssistant.tsx        # Evidence-based "gym bro" LLM companion
│   ├── Analytics.tsx          # Main charts and history tab router
│   ├── ExerciseLibrary.tsx    # Browse library with Anatomy map toggles
│   ├── Layout.tsx             # App shell and 4-tab bottom navigation
│   └── MuscleMap.tsx          # 2.5D Front/Back SVG anatomical map
├── db/
│   └── index.ts               # Dexie IndexedDB setup
├── store/
│   └── workoutStore.ts        # Zustand global state manager
└── utils/
    ├── advancedAnalytics.ts   # Sports-science formulas (ACWR, MEV)
    └── recoveryCalculator.ts  # Exponential half-life volume decays
```

---

## 🚀 Setup & Developer Guide

### 📦 Prerequisites
* **Node.js**: `v18` or higher
* **Package Manager**: `npm`

### 💻 Installation & Local Dev

1. Clone the repository:
   ```bash
   git clone https://github.com/Hadisovic/GymTracker-Pro.git
   cd GymTracker-Pro
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server locally:
   ```bash
   npm run dev
   ```

4. Build for production (fully optimized PWA bundle):
   ```bash
   npm run build
   ```

---

> [!IMPORTANT]
> **GymTracker Pro** compiles cleanly with zero TS errors under the strict `verbatimModuleSyntax` and `noUnusedLocals` compiler flags. All IndexedDB layers operate securely under sandboxed offline modes, meaning your training data is 100% safe even when your connection drops mid-workout!
