import React, { useEffect, useRef } from 'react';
import { useStudy } from '../context/StudyContext';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function Pomodoro() {
  const { subjects, pomState, setPomState, logSession, addLog } = useStudy();
  const [settings, setSettings] = useLocalStorage('st_pom_settings', { focus: 25, short: 5, long: 15 });
  const intervalRef = useRef(null);

  const modeTime = {
    focus: settings.focus * 60,
    short: settings.short * 60,
    long: settings.long * 60,
  };

  const total = modeTime[pomState.mode];
  const remaining = total - pomState.elapsed;
  const pct = (pomState.elapsed / total) * 100;
  const mins = Math.floor(remaining / 60).toString().padStart(2, '0');
  const secs = (remaining % 60).toString().padStart(2, '0');

  const r = 58, cx = 70, cy = 70;
  const circ = 2 * Math.PI * r;
useEffect(() => {
  if (pomState.running) {
    intervalRef.current = setInterval(() => {
      setPomState((p) => {
        if (!p.running) return p;
        const now = Date.now();
        // Use real elapsed time since last tick so background tab throttling doesn't lose time
        const delta = p.startedAt ? Math.max(1, Math.floor((now - p.startedAt) / 1000)) : 1;
        const ne = p.elapsed + delta;
        if (ne >= modeTime[p.mode]) {
          setTimeout(() => {
            if (p.mode === 'focus' && p.subjectId) logSession(p.subjectId, modeTime.focus);
            addLog(`Pomodoro ${p.mode} complete`, '#6c63ff');
          }, 0);
          const nc = p.mode === 'focus' ? p.cycles + 1 : p.cycles;
          const nm = p.mode === 'focus' ? (nc % 4 === 0 ? 'long' : 'short') : 'focus';
          return { ...p, elapsed: 0, running: false, mode: nm, cycles: nc, startedAt: null };
        }
        return { ...p, elapsed: ne, startedAt: now };
      });
    }, 10);
  }
  return () => clearInterval(intervalRef.current);
}, [pomState.running, pomState.mode, settings]);

  const modeLabel = { focus: 'Focus', short: 'Short break', long: 'Long break' };

  return (
    <div>
      <h1>Pomodoro Timer</h1>
      <div className="grid-2">
        <div className="card" style={{ textAlign: 'center' }}>
          {/* Mode tabs */}
          <div className="flex-center gap-8" style={{ justifyContent: 'center', marginBottom: 16 }}>
            {['focus', 'short', 'long'].map((m) => (
              <button
                key={m}
                className={`btn btn-sm${pomState.mode === m ? ' btn-primary' : ''}`}
                onClick={() => setPomState((p) => ({ ...p, mode: m, elapsed: 0, running: false, startedAt: null }))}
              >
                {modeLabel[m]}
              </button>
            ))}
          </div>

          {/* Ring */}
          <div className="pomodoro-ring">
            <svg width={140} height={140} className="ring-svg">
              <circle cx={cx} cy={cy} r={r} fill="none" stroke="#222" strokeWidth={8} />
              <circle
                cx={cx} cy={cy} r={r} fill="none" stroke="#6c63ff" strokeWidth={8}
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - pct / 100)}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset .5s' }}
              />
            </svg>
            <div className="ring-center">
              <div style={{ fontSize: 32, fontWeight: 300, letterSpacing: 2, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                {mins}:{secs}
              </div>
              <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{modeLabel[pomState.mode]}</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex-center gap-8 mb-16" style={{ justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => setPomState((p) => {
              if (p.running) {
                const ne = p.elapsed + (p.startedAt ? Math.floor((Date.now() - p.startedAt) / 1000) : 0);
                return { ...p, running: false, elapsed: Math.min(ne, modeTime[p.mode] - 1), startedAt: null };
              }
              return { ...p, running: true, startedAt: Date.now() };
            })}>
              {pomState.running ? '⏸ Pause' : '▶ Start'}
            </button>
            <button className="btn" onClick={() => setPomState((p) => ({ ...p, elapsed: 0, running: false, startedAt: null }))}>
              ⏹ Reset
            </button>
          </div>

          <div style={{ fontSize: 12, color: '#666', marginBottom: 14 }}>Cycles completed: {pomState.cycles}</div>

          {/* Subject selector */}
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="form-label">Studying subject</label>
            <select
              value={pomState.subjectId || ''}
              onChange={(e) => setPomState((p) => ({ ...p, subjectId: e.target.value ? Number(e.target.value) : null }))}
            >
              <option value="">— Select subject —</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {/* Settings */}
        <div className="card">
          <h2>Timer settings</h2>
          {[
            ['focus', 'Focus (min)', 1, 120],
            ['short', 'Short break (min)', 1, 30],
            ['long', 'Long break (min)', 1, 60],
          ].map(([k, label, mn, mx]) => (
            <div key={k} className="form-group">
              <label className="form-label">{label}</label>
              <div className="flex-center gap-8">
                <input
                  type="range" min={mn} max={mx} step={1}
                  value={settings[k]}
                  onChange={(e) => setSettings((s) => ({ ...s, [k]: +e.target.value }))}
                  style={{ flex: 1 }}
                />
                <span style={{ minWidth: 28, textAlign: 'right', color: '#ccc', fontSize: 13 }}>{settings[k]}</span>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 8, padding: 10, background: '#111', borderRadius: 8, fontSize: 12, color: '#555' }}>
            Complete 4 focus sessions → long break. Sessions auto-log to your selected subject when the timer ends.
          </div>
        </div>
      </div>
    </div>
  );
}
