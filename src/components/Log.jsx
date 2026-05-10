import React from 'react';
import { useStudy } from '../context/StudyContext';
import { today } from '../utils';

export default function Log() {
  const { logs, setLogs, sessions, setSessions, subjects, setSubjects, tasks, setTasks } = useStudy();

  const grouped = {};
  logs.forEach((l) => {
    if (!grouped[l.date]) grouped[l.date] = [];
    grouped[l.date].push(l);
  });
  const days = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const migrateData = (data) => {
    if (data.subjects) {
      data.subjects = data.subjects.map(s => ({
        id: s.id || Date.now(),
        name: s.name || 'Unnamed',
        color: s.color || '#6c63ff',
        topics: s.topics || [],
        created: s.created || today(),
      }));
    }
    if (data.sessions) {
      data.sessions = data.sessions.map(s => ({
        id: s.id || Date.now(),
        subjectId: Number(s.subjectId),
        duration: s.duration || 0,
        date: s.date || today(),
        ts: s.ts || Date.now(),
      }));
    }
    if (data.tasks) {
      data.tasks = data.tasks.map(t => ({
        id: t.id || Date.now(),
        text: t.text || '',
        done: t.done || false,
        priority: t.priority || 'medium',
        created: t.created || today(),
      }));
    }
    if (data.logs) {
      data.logs = data.logs.map(l => ({
        id: l.id || Date.now(),
        text: l.text || '',
        color: l.color || '#6c63ff',
        time: l.time || '00:00',
        date: l.date || today(),
      }));
    }
    return data;
  };

  const exportData = () => {
    const data = {
      subjects,
      sessions,
      logs,
      tasks,
      exported: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `studytrack-${today()}.json`;
    a.click();
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = JSON.parse(ev.target.result);
        const data = migrateData(raw);
        if (data.subjects) setSubjects(data.subjects);
        if (data.sessions) setSessions(data.sessions);
        if (data.logs) setLogs(data.logs);
        if (data.tasks) setTasks(data.tasks);
        alert('✅ Data imported successfully!');
      } catch {
        alert('❌ Invalid file. Please use a StudyTrack export file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div>
      <div className="flex-between mb-16">
        <h1 style={{ marginBottom: 0 }}>Activity Log</h1>
        <div className="flex gap-8">
          <label className="btn" style={{ cursor: 'pointer' }}>
            ⬆ Import JSON
            <input type="file" accept=".json" onChange={importData} style={{ display: 'none' }} />
          </label>
          <button className="btn" onClick={exportData}>⬇ Export JSON</button>
        </div>
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