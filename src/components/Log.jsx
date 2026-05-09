import React from 'react';
import { useStudy } from '../context/StudyContext';
import { today } from '../utils';

export default function Log() {
  const { logs, sessions, subjects } = useStudy();

  const grouped = {};
  logs.forEach((l) => {
    if (!grouped[l.date]) grouped[l.date] = [];
    grouped[l.date].push(l);
  });
  const days = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const exportData = () => {
    const data = { subjects, sessions, logs, exported: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `studytrack-${today()}.json`;
    a.click();
  };

  return (
    <div>
      <div className="flex-between mb-16">
        <h1 style={{ marginBottom: 0 }}>Activity Log</h1>
        <button className="btn" onClick={exportData}>⬇ Export JSON</button>
      </div>

      {days.length === 0
        ? <div className="card empty-state">No activity logged yet.</div>
        : days.map((d) => (
          <div key={d} className="card" style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 8, fontWeight: 500 }}>
              {d === today() ? 'Today' : d}
            </div>
            {grouped[d].map((l) => (
              <div key={l.id} className="log-entry">
                <div className="log-dot" style={{ background: l.color || '#6c63ff' }} />
                <div>
                  <div style={{ fontSize: 13, color: '#ccc' }}>{l.text}</div>
                  <div style={{ fontSize: 11, color: '#555' }}>{l.time}</div>
                </div>
              </div>
            ))}
          </div>
        ))
      }
    </div>
  );
}
