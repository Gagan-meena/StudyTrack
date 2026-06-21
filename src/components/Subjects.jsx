import React, { useState } from 'react';
import { useStudy } from '../context/StudyContext';
import { fmtHM, today, COLORS } from '../utils';

export default function Subjects() {
  const { subjects, setSubjects, sessions, addLog } = useStudy();
  const [sel, setSel] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', color: COLORS[0] });
  const [topicInput, setTopicInput] = useState('');
  const [editSubId, setEditSubId] = useState(null);
  const [editSubName, setEditSubName] = useState('');
  const [editTopicId, setEditTopicId] = useState(null);
  const [editTopicText, setEditTopicText] = useState('');

  const addSubject = () => {
    if (!form.name.trim()) return;
    const ns = { id: Date.now(), name: form.name.trim(), color: form.color, topics: [] };
    setSubjects((s) => [...s, ns]);
    addLog(`Added subject: ${ns.name}`, ns.color);
    setForm({ name: '', color: COLORS[0] });
    setShowAdd(false);
  };

  const delSubject = (id) => {
    setSubjects((s) => s.filter((x) => x.id !== id));
    if (sel?.id === id) setSel(null);
  };

  const addTopic = () => {
    if (!topicInput.trim() || !sel) return;
    const t = { id: Date.now(), text: topicInput.trim(), done: false, date: null };
    setSubjects((s) => s.map((x) => x.id === sel.id ? { ...x, topics: [...x.topics, t] } : x));
    setSel((p) => ({ ...p, topics: [...p.topics, t] }));
    setTopicInput('');
  };

  const toggleTopic = (subId, topId) => {
    setSubjects((s) => s.map((x) => x.id === subId
      ? { ...x, topics: x.topics.map((t) => t.id === topId ? { ...t, done: !t.done, date: t.done ? null : today() } : t) }
      : x
    ));
    setSel((p) => p ? { ...p, topics: p.topics.map((t) => t.id === topId ? { ...t, done: !t.done } : t) } : p);
  };

  const delTopic = (subId, topId) => {
    setSubjects((s) => s.map((x) => x.id === subId ? { ...x, topics: x.topics.filter((t) => t.id !== topId) } : x));
    setSel((p) => p ? { ...p, topics: p.topics.filter((t) => t.id !== topId) } : p);
  };

  const renameSubject = (id, name) => {
    if (!name.trim()) return;
    setSubjects((s) => s.map((x) => x.id === id ? { ...x, name: name.trim() } : x));
    setEditSubId(null);
  };

  const renameTopic = (subId, topId, text) => {
    if (!text.trim()) return;
    setSubjects((s) => s.map((x) => x.id === subId
      ? { ...x, topics: x.topics.map((t) => t.id === topId ? { ...t, text: text.trim() } : t) }
      : x
    ));
    setSel((p) => p ? { ...p, topics: p.topics.map((t) => t.id === topId ? { ...t, text: text.trim() } : t) } : p);
    setEditTopicId(null);
  };

  const selFull = sel ? subjects.find((s) => s.id === sel.id) : null;
  const subTotal = selFull
    ? sessions.filter((s) => s.subjectId === selFull.id).reduce((a, s) => a + s.duration, 0)
    : 0;

  return (
    <div>
      <div className="flex-between mb-16">
        <h1 style={{ marginBottom: 0 }}>Subjects</h1>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add subject</button>
      </div>

      <div className="grid-2">
        {/* Subject list */}
        <div>
          {subjects.length === 0
            ? <div className="card empty-state">No subjects yet. Add one to get started.</div>
            : subjects.map((sub) => {
              const tot = sessions.filter((s) => Number(s.subjectId) === Number(sub.id)).reduce((a, s) => a + s.duration, 0);
              const prog = sub.topics?.length
                ? Math.round(sub.topics.filter((t) => t.done).length / sub.topics.length * 100)
                : 0;
              return (
                <div
                  key={sub.id}
                  className="card"
                  style={{ cursor: 'pointer', border: selFull?.id === sub.id ? `1px solid ${sub.color}` : '1px solid #222', marginBottom: 10 }}
                  onClick={() => setSel(sub)}
                >
                  <div className="flex-between mb-12">
                    <div className="flex-center gap-8" style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: sub.color, flexShrink: 0 }} />
                      {editSubId === sub.id ? (
                        <input
                          type="text" value={editSubName} autoFocus
                          style={{ flex: 1, fontSize: 13, padding: '2px 6px' }}
                          onChange={(e) => setEditSubName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') renameSubject(sub.id, editSubName); if (e.key === 'Escape') setEditSubId(null); }}
                          onBlur={() => renameSubject(sub.id, editSubName)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span style={{ fontWeight: 500, color: '#e8e8e8', fontSize: 14 }}>{sub.name}</span>
                      )}
                    </div>
                    <div className="flex-center gap-8">
                      <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); setEditSubId(sub.id); setEditSubName(sub.name); }}>edit</button>
                      <button className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); delSubject(sub.id); }}>del</button>
                    </div>
                  </div>
                  <div className="flex-between" style={{ marginBottom: 6 }}>
                    <span className="text-sm">{(sub.topics || []).length} topics · {fmtHM(tot) || '0m'}</span>
                    <span className="text-sm">{prog}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${prog}%`, background: sub.color }} />
                  </div>
                </div>
              );
            })
          }
        </div>

        {/* Topic panel */}
        {selFull ? (
          <div className="card">
            <div className="flex-between mb-12">
              <div className="flex-center gap-8">
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: selFull.color }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>{selFull.name}</span>
              </div>
              <span className="badge badge-purple">{fmtHM(subTotal) || '0m'} total</span>
            </div>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>
              {(selFull.topics || []).filter((t) => t.done).length}/{(selFull.topics || []).length} topics done
            </div>
            <div className="flex-center gap-8 mb-12">
              <input
                type="text" placeholder="Add a topic..." value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTopic()}
                style={{ flex: 1 }}
              />
              <button className="btn btn-primary btn-sm" onClick={addTopic}>+</button>
            </div>
            {(selFull.topics || []).length === 0
              ? <div className="empty-state" style={{ padding: '16px 0' }}>No topics yet</div>
              : (selFull.topics || []).map((t) => (
                <div key={t.id} className="topic-item">
                  <input
                    type="checkbox" checked={t.done}
                    onChange={() => toggleTopic(selFull.id, t.id)}
                    style={{ width: 15, height: 15, accentColor: '#6c63ff', cursor: 'pointer', flexShrink: 0 }}
                  />
                  {editTopicId === t.id ? (
                    <input
                      type="text" value={editTopicText} autoFocus
                      style={{ flex: 1, fontSize: 13, padding: '2px 6px' }}
                      onChange={(e) => setEditTopicText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') renameTopic(selFull.id, t.id, editTopicText); if (e.key === 'Escape') setEditTopicId(null); }}
                      onBlur={() => renameTopic(selFull.id, t.id, editTopicText)}
                    />
                  ) : (
                    <span style={{ flex: 1, fontSize: 13, color: t.done ? '#555' : '#ccc', textDecoration: t.done ? 'line-through' : 'none' }}>
                      {t.text}
                    </span>
                  )}
                  {t.done && !editTopicId && <span style={{ fontSize: 10, color: '#555' }}>{t.date || ''}</span>}
                  <button className="btn btn-sm" style={{ padding: '2px 6px' }} onClick={() => { setEditTopicId(t.id); setEditTopicText(t.text); }}>✎</button>
                  <button className="btn btn-danger btn-sm" style={{ padding: '2px 6px' }} onClick={() => delTopic(selFull.id, t.id)}>×</button>
                </div>
              ))
            }
          </div>
        ) : (
          <div className="card empty-state">Select a subject to view topics</div>
        )}
      </div>

      {/* Add subject modal */}
      {showAdd && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>New subject</h3>
            <div className="form-group">
              <label className="form-label">Subject name</label>
              <input
                type="text" value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Mathematics" autoFocus
                onKeyDown={(e) => e.key === 'Enter' && addSubject()}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <div className="color-picker">
                {COLORS.map((c) => (
                  <div
                    key={c}
                    className={`color-opt${form.color === c ? ' selected' : ''}`}
                    style={{ background: c }}
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-8" style={{ justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={addSubject}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
