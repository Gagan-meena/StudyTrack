import React, { useState } from 'react';
import { useStudy } from '../context/StudyContext';
import { today } from '../utils';

const PRIORITY_COLORS = { high: '#f87171', medium: '#fbbf24', low: '#4ade80' };

export default function Tasks() {
  const { tasks, setTasks, addLog } = useStudy();
  const [input, setInput] = useState('');
  const [priority, setPriority] = useState('medium');

  const add = () => {
    if (!input.trim()) return;
    const t = { id: Date.now(), text: input.trim(), done: false, priority, created: today() };
    setTasks((ts) => [t, ...ts]);
    addLog(`Task added: ${t.text}`, '#fbbf24');
    setInput('');
  };

  const toggle = (id) => setTasks((ts) => ts.map((t) => t.id === id ? { ...t, done: !t.done } : t));
  const del = (id) => setTasks((ts) => ts.filter((t) => t.id !== id));

  const pending = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  return (
    <div>
      <h1>Side Tasks</h1>
      <div className="card">
        {/* Input row */}
        <div className="flex-center gap-8 mb-12">
          <input
            type="text" placeholder="Add a task..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            style={{ flex: 1 }}
          />
          <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ width: 'auto' }}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button className="btn btn-primary" onClick={add}>+</button>
        </div>

        {pending.length === 0 && done.length === 0 && (
          <div className="empty-state">No tasks yet. Add one above.</div>
        )}

        {/* Pending */}
        {pending.map((t) => (
          <div key={t.id} className="task-item">
            <input
              type="checkbox" checked={false} onChange={() => toggle(t.id)}
              style={{ width: 15, height: 15, accentColor: '#6c63ff', cursor: 'pointer', flexShrink: 0 }}
            />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLORS[t.priority], flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 13, color: '#ccc' }}>{t.text}</span>
            <span style={{ fontSize: 11, color: '#555' }}>{t.created}</span>
            <button className="btn btn-danger btn-sm" style={{ padding: '2px 6px' }} onClick={() => del(t.id)}>×</button>
          </div>
        ))}

        {/* Done */}
        {done.length > 0 && (
          <div>
            <div style={{ fontSize: 12, color: '#555', margin: '14px 0 8px' }}>Completed ({done.length})</div>
            {done.map((t) => (
              <div key={t.id} className="task-item" style={{ opacity: 0.4 }}>
                <input
                  type="checkbox" checked={true} onChange={() => toggle(t.id)}
                  style={{ width: 15, height: 15, accentColor: '#6c63ff', cursor: 'pointer', flexShrink: 0 }}
                />
                <span style={{ flex: 1, fontSize: 13, color: '#555', textDecoration: 'line-through' }}>{t.text}</span>
                <button className="btn btn-danger btn-sm" style={{ padding: '2px 6px' }} onClick={() => del(t.id)}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
