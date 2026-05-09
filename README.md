# StudyTrack

A personal study tracker — subject-wise time tracking, Pomodoro timer, topic checklists, GitHub-style heatmap, weekly bar charts, daily goal progress, side tasks, and activity log. All data stored in localStorage — no backend, no login.

## Project Structure

```
src/
  components/
    Sidebar.jsx       ← navigation
    Dashboard.jsx     ← stats, heatmap, goal progress bars
    Subjects.jsx      ← add/manage subjects + topic checklists
    Analytics.jsx     ← weekly bar charts (overview + per subject)
    Pomodoro.jsx      ← focus timer with auto session logging
    Tasks.jsx         ← side task manager with priority
    Log.jsx           ← activity log + JSON export
  context/
    StudyContext.js   ← global state via React Context
  hooks/
    useLocalStorage.js
  utils.js            ← shared helpers (fmtHM, today, COLORS…)
  App.jsx
  index.js
  index.css
```

## Setup & Run

```bash
npm install
npm start
```

## Deploy to Vercel (free)

1. Push this folder to a GitHub repo
2. Go to vercel.com → New Project → import your repo
3. Vercel auto-detects Create React App — just click Deploy
4. Done. Your app is live at a free `.vercel.app` URL.

## Data Backup

Use the **Export JSON** button in the Log page to download all your data. You can import it back by copying the JSON into localStorage manually if you switch devices.

## Tech Stack

- React 18 (Create React App)
- Chart.js 4 + react-chartjs-2 (weekly bar charts)
- localStorage (zero backend)
- Pure CSS (no UI library)
