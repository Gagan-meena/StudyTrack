import React, { useState } from 'react';
import { StudyProvider } from './context/StudyContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Subjects from './components/Subjects';
import Analytics from './components/Analytics';
import Pomodoro from './components/Pomodoro';
import Tasks from './components/Tasks';
import Log from './components/Log';
import './index.css';

const PAGES = {
  dashboard: Dashboard,
  subjects:  Subjects,
  analytics: Analytics,
  timer:     Pomodoro,
  tasks:     Tasks,
  log:       Log,
};

export default function App() {
  const [page, setPage] = useState('dashboard');
  const PageComponent = PAGES[page] || Dashboard;

  return (
    <StudyProvider>
      <div className="app">
        <Sidebar page={page} setPage={setPage} />
        <div className="main">
          <PageComponent />
        </div>
      </div>
    </StudyProvider>
  );
}
