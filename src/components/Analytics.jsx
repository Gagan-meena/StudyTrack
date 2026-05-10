import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Chart } from 'chart.js/auto';
import { useStudy } from '../context/StudyContext';
import { fmtHM, getWeekDays } from '../utils';

function WeeklyBarChart({ sessions, subjects, weekOffset }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const weekData = useMemo(() => getWeekDays(weekOffset), [weekOffset]);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();

    const datasets = subjects.map((sub) => ({
      label: sub.name,
      data: weekData.map((d) =>
        parseFloat((sessions.filter((s) => Number(s.subjectId) === Number(sub.id) && s.date === d.key)
          .reduce((a, s) => a + s.duration, 0) / 3600).toFixed(2))
      ),
      backgroundColor: sub.color + 'cc',
      borderColor: sub.color,
      borderWidth: 1,
      borderRadius: 4,
    }));

    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: { labels: weekData.map((d) => d.label), datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${c.raw}h` } },
        },
        scales: {
          x: { stacked: true, ticks: { color: '#888', font: { size: 11 } }, grid: { color: '#1e1e1e' } },
          y: { stacked: true, ticks: { color: '#888', font: { size: 11 }, callback: (v) => `${v}h` }, grid: { color: '#1e1e1e' }, beginAtZero: true },
        },
      },
    });

    return () => { if (chartRef.current && typeof chartRef.current.destroy === 'function') chartRef.current.destroy(); };
  }, [sessions, subjects, weekData]);

  return (
    <div style={{ position: 'relative', width: '100%', height: 200 }}>
      <canvas ref={canvasRef} role="img" aria-label="Weekly study hours stacked bar chart" />
    </div>
  );
}

function SubjectWeekChart({ subject, sessions, weekOffset }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const weekData = useMemo(() => getWeekDays(weekOffset), [weekOffset]);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();

    const data = weekData.map((d) =>
      parseFloat((sessions.filter((s) => s.subjectId === subject.id && s.date === d.key)
        .reduce((a, s) => a + s.duration, 0) / 3600).toFixed(2))
    );

    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels: weekData.map((d) => d.label),
        datasets: [{
          label: subject.name,
          data,
          backgroundColor: subject.color + '99',
          borderColor: subject.color,
          borderWidth: 1,
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#666', font: { size: 10 } }, grid: { display: false } },
          y: { ticks: { color: '#666', font: { size: 10 }, callback: (v) => `${v}h` }, grid: { color: '#1e1e1e' }, beginAtZero: true },
        },
      },
    });

    return () => { if (chartRef.current && typeof chartRef.current.destroy === 'function') chartRef.current.destroy(); };
  }, [sessions, subject, weekData]);

  return (
    <div style={{ position: 'relative', height: 120 }}>
      <canvas ref={canvasRef} role="img" aria-label={`Weekly chart for ${subject.name}`} />
    </div>
  );
}

export default function Analytics() {
  const { subjects, sessions, goals, setGoals } = useStudy();
  const [weekOffset, setWeekOffset] = useState(0);
  const [tab, setTab] = useState('overview');
  const [editSubGoal, setEditSubGoal] = useState(null);
  const [subGoalInput, setSubGoalInput] = useState(1);

  const weekLabel = () => {
    if (weekOffset === 0) return 'This week';
    if (weekOffset === 1) return 'Last week';
    const d = new Date();
    d.setDate(d.getDate() - weekOffset * 7);
    return `Week of ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  };

  const getWeekTotal = (subId) => {
    const days = getWeekDays(weekOffset);
    return days.reduce((total, d) =>
      total + sessions.filter((s) => (!subId || s.subjectId === subId) && s.date === d.key)
        .reduce((a, s) => a + s.duration, 0), 0
    );
  };

  const openSubGoal = (sub) => {
    setEditSubGoal(sub);
    setSubGoalInput(Math.floor((goals.subjects?.[sub.id] || 3600) / 3600));
  };
  const saveSubGoal = () => {
    setGoals((g) => ({ ...g, subjects: { ...(g.subjects || {}), [editSubGoal.id]: subGoalInput * 3600 } }));
    setEditSubGoal(null);
  };

  return (
    <div>
      <h1>Analytics</h1>

      <div className="tab-row">
        {['overview', 'per subject'].map((t) => (
          <div key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</div>
        ))}
      </div>

      <div className="week-nav">
        <button onClick={() => setWeekOffset((w) => w + 1)}>← prev</button>
        <span>{weekLabel()}</span>
        <button onClick={() => setWeekOffset((w) => Math.max(0, w - 1))} disabled={weekOffset === 0} style={{ opacity: weekOffset === 0 ? 0.3 : 1 }}>next →</button>
      </div>

      {tab === 'overview' && (
        <div>
          <div className="card">
            <div className="flex-between mb-12">
              <h2 style={{ marginBottom: 0 }}>Weekly overview — stacked by subject</h2>
              <span style={{ fontSize: 12, color: '#666' }}>{fmtHM(getWeekTotal())} total</span>
            </div>
            {subjects.length === 0
              ? <div className="empty-state">Add subjects first</div>
              : <WeeklyBarChart sessions={sessions} subjects={subjects} weekOffset={weekOffset} />
            }
            {subjects.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
                {subjects.map((s) => (
                  <div key={s.id} className="legend-item">
                    <div className="legend-sq" style={{ background: s.color }} />
                    {s.name} · {fmtHM(getWeekTotal(s.id))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid-4">
            {subjects.map((s) => {
              const wt = getWeekTotal(s.id);
              const all = sessions.filter((x) => x.subjectId === s.id).reduce((a, x) => a + x.duration, 0);
              return (
                <div key={s.id} className="stat-card">
                  <div className="flex-center gap-8 mb-12">
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color }} />
                    <div className="stat-label" style={{ marginBottom: 0 }}>{s.name}</div>
                  </div>
                  <div className="stat-val" style={{ fontSize: 18 }}>{fmtHM(wt) || '0m'}</div>
                  <div className="stat-sub">this week</div>
                  <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>All time: {fmtHM(all) || '0m'}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'per subject' && (
        <div>
          {subjects.length === 0
            ? <div className="card empty-state">Add subjects first</div>
            : (
              <div className="grid-2">
                {subjects.map((s) => {
                  const wt = getWeekTotal(s.id);
                  const all = sessions.filter((x) => x.subjectId === s.id).reduce((a, x) => a + x.duration, 0);
                  const prog = s.topics?.length ? Math.round(s.topics.filter((t) => t.done).length / s.topics.length * 100) : 0;
                  const subGoal = goals.subjects?.[s.id];
                  return (
                    <div key={s.id} className="card">
                      <div className="flex-between mb-12">
                        <div className="flex-center gap-8">
                          <div style={{ width: 12, height: 12, borderRadius: '50%', background: s.color }} />
                          <span style={{ fontWeight: 500, color: '#e8e8e8' }}>{s.name}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <span className="badge badge-purple">{fmtHM(wt) || '0m'}</span>
                          <button className="btn btn-sm" onClick={() => openSubGoal(s)}>set goal</button>
                        </div>
                      </div>
                      <SubjectWeekChart subject={s} sessions={sessions} weekOffset={weekOffset} />
                      {subGoal && (
                        <div style={{ marginTop: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#666', marginBottom: 4 }}>
                            <span>Daily goal</span>
                            <span>{fmtHM(sessions.filter((x) => x.subjectId === s.id && x.date === today()).reduce((a, x) => a + x.duration, 0))} / {fmtHM(subGoal)}</span>
                          </div>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{
                              width: `${Math.min(100, Math.round(sessions.filter((x) => x.subjectId === s.id && x.date === today()).reduce((a, x) => a + x.duration, 0) / subGoal * 100))}%`,
                              background: s.color
                            }} />
                          </div>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12, color: '#666' }}>
                        <span>All time: {fmtHM(all) || '0m'}</span>
                        {s.topics?.length > 0 && <span>Topics: {prog}% done</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          }
        </div>
      )}

      {editSubGoal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Daily goal — {editSubGoal.name}</h3>
            <div className="form-group">
              <label className="form-label">Hours per day</label>
              <input type="number" min={0.5} max={12} step={0.5} value={subGoalInput} onChange={(e) => setSubGoalInput(+e.target.value)} />
            </div>
            <div className="flex gap-8" style={{ justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setEditSubGoal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveSubGoal}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
