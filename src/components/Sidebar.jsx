import React from 'react';

const NAV = [
  { id: 'dashboard', label: 'Dashboard',  path: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z' },
  { id: 'subjects',  label: 'Subjects',   path: 'M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z' },
  { id: 'analytics', label: 'Analytics',  path: 'M18 20V10M12 20V4M6 20v-6' },
  { id: 'timer',     label: 'Pomodoro',   path: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2' },
  { id: 'tasks',     label: 'Tasks',      path: 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11' },
  { id: 'log',       label: 'Log',        path: 'M22 12l-4-4v3H3v2h15v3z' },
];

export default function Sidebar({ page, setPage }) {
  return (
    <div className="sidebar">
      <div className="logo"><span>Study</span>Track</div>
      {NAV.map(({ id, label, path }) => (
        <div
          key={id}
          className={`nav-item${page === id ? ' active' : ''}`}
          onClick={() => setPage(id)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width={16} height={16}>
            <path d={path} />
          </svg>
          {label}
        </div>
      ))}
    </div>
  );
}
