import React, { useState, useMemo } from 'react';
import { useStudy } from '../context/StudyContext';
import { fmtHM, today, dateKey } from '../utils';

function GoalProgressBar({ label, current, goal, color }) {
  const pct = Math.min(100, Math.round((current / goal) * 100));
  const done = current >= goal;
  return (
    <div className="goal-bar-wrap">
      <div className="goal-bar-label">
        <span style={{ color: '#ccc' }}>{label}</span>
        <span style={{ color: done ? '#4ade80' : '#888' }}>
          {fmtHM(current)} / {fmtHM(goal)} · {pct}%
        </span>
      </div>
      <div className="goal-bar-track">
        <div
          className="goal-bar-fill"
          style={{ width: `${pct}%`, background: done ? '#4ade80' : color || '#6c63ff' }}
        />
      </div>
    </div>
  );
}

function Heatmap({ sessions }) {
  const cells = useMemo(() => {
    const data = [];
    const now = new Date();
    for (let w = 52; w >= 0; w--) {
      const col = [];
      for (let d = 0; d < 7; d++) {
        const dt = new Date(now);
        dt.setDate(dt.getDate() - (w * 7 + (6 - d)));
        const k = dateKey(dt);
        const dur = sessions.filter((s) => s.date === k).reduce((a, s) => a + s.duration, 0);
        const hrs = dur / 3600;
        col.push({ key: k, level: hrs === 0 ? 0 : hrs < 1 ? 1 : hrs < 2 ? 2 : hrs < 4 ? 3 : 4, day: dt.getDay(), date: dt });
      }
      data.push(col);
    }
    return data;
  }, [sessions]);

  // Build month labels
  const monthLabels = useMemo(() => {
    const labels = [];
    let lastMonth = -1;
    cells.forEach((col, wi) => {
      const month = col[0].date.getMonth();
      if (month !== lastMonth) {
        labels.push({ wi, label: col[0].date.toLocaleString('default', { month: 'short' }) });
        lastMonth = month;
      }
    });
    return labels;
  }, [cells]);

  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const CELL = 13; // cell size + gap

  return (
    <div className="card">
      <div className="flex-between" style={{ marginBottom: 12 }}>
        <h2 style={{ marginBottom: 0 }}>Activity heatmap</h2>
        <span className="text-sm">Last 53 weeks</span>
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        {/* Day labels on left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 20 }}>
          {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((label, i) => (
            <div key={i} style={{ height: 11, fontSize: 9, color: '#555', lineHeight: '11px', width: 24, textAlign: 'right', paddingRight: 4 }}>
              {label}
            </div>
          ))}
        </div>

        {/* Chart area */}
        <div style={{ flex: 1, overflowX: 'auto' }}>
          {/* Month labels */}
          <div style={{ display: 'flex', marginBottom: 4, position: 'relative', height: 16 }}>
            {monthLabels.map(({ wi, label }) => (
              <div key={wi} style={{ position: 'absolute', left: wi * CELL, fontSize: 10, color: '#666' }}>
                {label}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div style={{ display: 'flex', gap: 2 }}>
            {cells.map((col, ci) => (
              <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {col.map((cell, ri) => (
                  <div
                    key={ri}
                    className="hm-cell"
                    data-l={cell.level}
                    title={`${cell.key}: ${cell.level === 0 ? 'No study' : ''}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 6, marginTop: 10, alignItems: 'center', justifyContent: 'flex-end' }}>
        <span className="text-sm">Less</span>
        {[0, 1, 2, 3, 4].map((l) => <div key={l} className="hm-cell" data-l={l} />)}
        <span className="text-sm">More</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { subjects, sessions, logs, goals, setGoals } = useStudy();
  const [editGoal, setEditGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(Math.floor((goals.daily || 7200) / 3600));

  const todaySessions = sessions.filter((s) => s.date === today());
  const totalToday = todaySessions.reduce((a, s) => a + s.duration, 0);
  const totalAll = sessions.reduce((a, s) => a + s.duration, 0);

  const streak = useMemo(() => {
    const days = new Set(sessions.map((s) => s.date));
    let count = 0;
    const d = new Date();
    while (true) {
      const k = dateKey(d);
      if (days.has(k)) { count++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return count;
  }, [sessions]);

  const subTotals = subjects.map((sub) => ({
    ...sub,
    total: sessions.filter((s) => Number(s.subjectId) === Number(sub.id)).reduce((a, s) => a + s.duration, 0),
    todayTime: todaySessions.filter((s) => Number(s.subjectId) === Number(sub.id)).reduce((a, s) => a + s.duration, 0),
  })).sort((a, b) => b.todayTime - a.todayTime);

  const saveGoal = () => {
    setGoals((g) => ({ ...g, daily: goalInput * 3600 }));
    setEditGoal(false);
  };

  return (
    <div>
      <h1>Dashboard</h1>

      {/* Daily goal */}
      <div className="card mb-16">
        <div className="flex-between mb-12">
          <h2 style={{ marginBottom: 0 }}>Today's goal</h2>
          <button className="btn btn-sm" onClick={() => setEditGoal(true)}>Edit goal</button>
        </div>
        <GoalProgressBar label="Overall today" current={totalToday} goal={goals.daily} color="#6c63ff" />
        {subTotals.filter((s) => goals.subjects?.[s.id]).map((s) => (
          <GoalProgressBar key={s.id} label={s.name} current={s.todayTime} goal={goals.subjects[s.id]} color={s.color} />
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid-4">
        <div className="stat-card"><div className="stat-label">Today</div><div className="stat-val">{fmtHM(totalToday) || '0m'}</div></div>
        <div className="stat-card"><div className="stat-label">All time</div><div className="stat-val">{fmtHM(totalAll) || '0m'}</div></div>
        <div className="stat-card"><div className="stat-label">Streak</div><div className="stat-val">{streak}d 🔥</div></div>
        <div className="stat-card"><div className="stat-label">Subjects</div><div className="stat-val">{subjects.length}</div></div>
      </div>

      <Heatmap sessions={sessions} />

      <div className="grid-2">
        {/* Today by subject */}
        <div className="card">
          <h2>Today by subject</h2>
          {subTotals.length === 0
            ? <div className="empty-state">No subjects yet</div>
            : subTotals.map((s) => (
              <div key={s.id} className="subject-row">
                <div className="subject-dot" style={{ background: s.color }} />
                <span style={{ flex: 1, fontSize: 13, color: '#ccc' }}>{s.name}</span>
                <span style={{ fontSize: 13, color: '#888' }}>{fmtHM(s.todayTime) || '—'}</span>
              </div>
            ))
          }
        </div>

        {/* Recent activity */}
        <div className="card">
          <h2>Recent activity</h2>
          {logs.length === 0
            ? <div className="empty-state">No activity yet</div>
            : logs.slice(0, 7).map((l) => (
              <div key={l.id} className="log-entry">
                <div className="log-dot" style={{ background: l.color || '#6c63ff' }} />
                <div>
                  <div style={{ fontSize: 12, color: '#ccc' }}>{l.text}</div>
                  <div style={{ fontSize: 11, color: '#555' }}>{l.time}</div>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Edit goal modal */}
      {editGoal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Set daily goal</h3>
            <div className="form-group">
              <label className="form-label">Daily overall goal (hours)</label>
              <input
                type="number" min={0.5} max={24} step={0.5}
                value={goalInput}
                onChange={(e) => setGoalInput(+e.target.value)}
              />
            </div>
            <div style={{ fontSize: 12, color: '#555', marginBottom: 14 }}>
              Per-subject goals can be set in the Analytics page.
            </div>
            <div className="flex gap-8" style={{ justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setEditGoal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveGoal}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
