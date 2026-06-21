import React, { useState } from 'react';
import { render, screen, act, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudyProvider } from '../context/StudyContext';
import Dashboard from '../components/Dashboard';
import Subjects from '../components/Subjects';
import Tasks from '../components/Tasks';
import Log from '../components/Log';
import Analytics from '../components/Analytics';
import { today } from '../utils';

// userEvent setup with fake-timer support
function setup() {
  return userEvent.setup({ advanceTimers: jest.advanceTimersByTime.bind(jest), delay: null });
}
beforeEach(() => { jest.useFakeTimers(); });
afterEach(() => { jest.runOnlyPendingTimers(); jest.useRealTimers(); });

function AppShell({ defaultPage = 'dashboard' }) {
  const [page, setPage] = useState(defaultPage);
  const pages = { dashboard: Dashboard, subjects: Subjects, tasks: Tasks, log: Log, analytics: Analytics };
  const Page = pages[page];
  return (
    <StudyProvider>
      <button onClick={() => setPage('dashboard')}>go dashboard</button>
      <button onClick={() => setPage('subjects')}>go subjects</button>
      <button onClick={() => setPage('tasks')}>go tasks</button>
      <button onClick={() => setPage('log')}>go log</button>
      <button onClick={() => setPage('analytics')}>go analytics</button>
      <Page />
    </StudyProvider>
  );
}

function preload(data = {}) {
  Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v)));
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

describe('Integration: Subject → Dashboard sync', () => {
  test('adding a subject updates subject count on dashboard', async () => {
    const user = setup();
    render(<AppShell defaultPage="subjects" />);
    await user.click(screen.getByText('+ Add subject'));
    await user.type(screen.getByPlaceholderText('e.g. Mathematics'), 'Biology');
    await user.click(screen.getByText('Add'));

    await user.click(screen.getByText('go dashboard'));
    const subjectsCard = screen.getByText('Subjects').closest('.stat-card');
    expect(within(subjectsCard).getByText('1')).toBeInTheDocument();
  });

  test('session added via preload appears in dashboard today total', () => {
    preload({
      st_subjects: [{ id: 1, name: 'Math', color: '#6c63ff', topics: [] }],
      st_sessions: [{ id: 1, subjectId: 1, duration: 1800, date: today() }],
    });
    render(<AppShell defaultPage="dashboard" />);
    const todayCard = screen.getByText('Today').closest('.stat-card');
    expect(within(todayCard).getByText('30m')).toBeInTheDocument();
  });
});

describe('Integration: Tasks → Log sync', () => {
  test('adding a task creates a log entry', async () => {
    const user = setup();
    render(<AppShell defaultPage="tasks" />);
    await user.type(screen.getByPlaceholderText('Add a task...'), 'Write essay');
    await user.click(screen.getByText('+'));

    await user.click(screen.getByText('go log'));
    expect(screen.getByText(/Write essay/i)).toBeInTheDocument();
  });
});

describe('Integration: Subjects → Log sync', () => {
  test('adding a subject creates a log entry', async () => {
    const user = setup();
    render(<AppShell defaultPage="subjects" />);
    await user.click(screen.getByText('+ Add subject'));
    await user.type(screen.getByPlaceholderText('e.g. Mathematics'), 'Chemistry');
    await user.click(screen.getByText('Add'));

    await user.click(screen.getByText('go log'));
    expect(screen.getByText(/Added subject: Chemistry/i)).toBeInTheDocument();
  });
});

describe('Integration: Dashboard goal vs sessions', () => {
  test('goal bar updates when sessions exist', () => {
    preload({
      st_goals: { daily: 3600, subjects: {} },
      st_sessions: [{ id: 1, subjectId: 1, duration: 1800, date: today() }],
    });
    render(<AppShell defaultPage="dashboard" />);
    expect(screen.getByText(/50%/)).toBeInTheDocument();
  });

  test('goal bar shows 100% when goal is met', () => {
    preload({
      st_goals: { daily: 3600, subjects: {} },
      st_sessions: [{ id: 1, subjectId: 1, duration: 3600, date: today() }],
    });
    render(<AppShell defaultPage="dashboard" />);
    expect(screen.getByText(/100%/)).toBeInTheDocument();
  });
});

describe('Integration: Analytics reflects sessions', () => {
  test('analytics shows week total matching sessions', () => {
    preload({
      st_subjects: [{ id: 1, name: 'Math', color: '#6c63ff', topics: [] }],
      st_sessions: [{ id: 1, subjectId: 1, duration: 3600, date: today() }],
    });
    render(<AppShell defaultPage="analytics" />);
    // "1h 0m" appears in both the total header and the legend — either is proof data is correct
    expect(screen.getAllByText(/1h 0m/i).length).toBeGreaterThanOrEqual(1);
  });
});

describe('Integration: localStorage persistence across remounts', () => {
  test('subjects survive remount', async () => {
    const user = setup();
    const { unmount } = render(<AppShell defaultPage="subjects" />);
    await user.click(screen.getByText('+ Add subject'));
    await user.type(screen.getByPlaceholderText('e.g. Mathematics'), 'History');
    await user.click(screen.getByText('Add'));
    unmount();

    render(<AppShell defaultPage="subjects" />);
    expect(screen.getByText('History')).toBeInTheDocument();
  });

  test('tasks survive remount', async () => {
    const user = setup();
    const { unmount } = render(<AppShell defaultPage="tasks" />);
    await user.type(screen.getByPlaceholderText('Add a task...'), 'Persistent task');
    await user.click(screen.getByText('+'));
    unmount();

    render(<AppShell defaultPage="tasks" />);
    expect(screen.getByText('Persistent task')).toBeInTheDocument();
  });

  test('sessions survive remount and dashboard reflects them', () => {
    preload({
      st_sessions: [{ id: 1, subjectId: 1, duration: 7200, date: today() }],
    });
    const { unmount } = render(<AppShell defaultPage="dashboard" />);
    const todayCard = screen.getByText('Today').closest('.stat-card');
    expect(within(todayCard).getByText('2h 0m')).toBeInTheDocument();
    unmount();

    render(<AppShell defaultPage="dashboard" />);
    const todayCard2 = screen.getByText('Today').closest('.stat-card');
    expect(within(todayCard2).getByText('2h 0m')).toBeInTheDocument();
  });

  test('completed tasks survive remount', () => {
    preload({
      st_tasks: [{ id: 1, text: 'Done task', done: true, priority: 'low', created: today() }],
    });
    const { unmount } = render(<AppShell defaultPage="tasks" />);
    expect(screen.getByText('Done task')).toBeInTheDocument();
    unmount();

    render(<AppShell defaultPage="tasks" />);
    expect(screen.getByText('Done task')).toBeInTheDocument();
    expect(screen.getByText(/Completed/i)).toBeInTheDocument();
  });
});

describe('Integration: streak calculation', () => {
  test('streak is 0 with no sessions', () => {
    render(<AppShell defaultPage="dashboard" />);
    expect(screen.getByText('0d 🔥')).toBeInTheDocument();
  });

  test('streak is 1 with only today session', () => {
    preload({
      st_sessions: [{ id: 1, subjectId: 1, duration: 3600, date: today() }],
    });
    render(<AppShell defaultPage="dashboard" />);
    expect(screen.getByText('1d 🔥')).toBeInTheDocument();
  });

  test('streak counts consecutive days', () => {
    const yesterday = (() => {
      const d = new Date(); d.setDate(d.getDate() - 1);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    })();
    preload({
      st_sessions: [
        { id: 1, subjectId: 1, duration: 3600, date: today() },
        { id: 2, subjectId: 1, duration: 1800, date: yesterday },
      ],
    });
    render(<AppShell defaultPage="dashboard" />);
    expect(screen.getByText('2d 🔥')).toBeInTheDocument();
  });

  test('streak breaks on gap', () => {
    preload({
      st_sessions: [
        { id: 1, subjectId: 1, duration: 3600, date: today() },
        { id: 2, subjectId: 1, duration: 1800, date: '2000-01-01' },
      ],
    });
    render(<AppShell defaultPage="dashboard" />);
    expect(screen.getByText('1d 🔥')).toBeInTheDocument();
  });
});

describe('Integration: Streak fix — yesterday keeps streak alive', () => {
  test('shows streak when last session was yesterday (no session today)', () => {
    preload({
      st_sessions: [
        { id: 1, subjectId: 1, duration: 3600, date: daysAgo(1) },
        { id: 2, subjectId: 1, duration: 3600, date: daysAgo(2) },
      ],
    });
    render(<AppShell defaultPage="dashboard" />);
    expect(screen.getByText('2d 🔥')).toBeInTheDocument();
  });

  test('streak is 0 when gap is 2+ days', () => {
    preload({
      st_sessions: [{ id: 1, subjectId: 1, duration: 3600, date: daysAgo(2) }],
    });
    render(<AppShell defaultPage="dashboard" />);
    expect(screen.getByText('0d 🔥')).toBeInTheDocument();
  });

  test('studying today extends a yesterday streak', () => {
    preload({
      st_sessions: [
        { id: 1, subjectId: 1, duration: 3600, date: today() },
        { id: 2, subjectId: 1, duration: 3600, date: daysAgo(1) },
        { id: 3, subjectId: 1, duration: 3600, date: daysAgo(2) },
      ],
    });
    render(<AppShell defaultPage="dashboard" />);
    expect(screen.getByText('3d 🔥')).toBeInTheDocument();
  });
});

describe('Integration: This week stat', () => {
  test('weekly card shows combined sessions from last 7 days, today card shows only today', () => {
    preload({
      st_sessions: [
        { id: 1, subjectId: 1, duration: 1800, date: today() },        // 30m today
        { id: 2, subjectId: 1, duration: 3600, date: daysAgo(4) },     // 1h — 4 days ago
        { id: 3, subjectId: 1, duration: 7200, date: daysAgo(10) },    // 2h — 10 days ago, excluded
      ],
    });
    render(<AppShell defaultPage="dashboard" />);
    const todayCard = screen.getByText('Today').closest('.stat-card');
    const weekCard  = screen.getByText('This week').closest('.stat-card');
    expect(within(todayCard).getByText('30m')).toBeInTheDocument();
    expect(within(weekCard).getByText('1h 30m')).toBeInTheDocument();
  });
});

describe('Integration: Edit subject name → Dashboard sync', () => {
  test('renamed subject appears in Dashboard "Today by subject"', async () => {
    const user = setup();
    preload({
      st_subjects: [{ id: 1, name: 'Biology', color: '#4ade80', topics: [] }],
      st_sessions: [{ id: 1, subjectId: 1, duration: 1800, date: today() }],
    });
    render(<AppShell defaultPage="subjects" />);

    await user.click(screen.getByText('edit'));
    const input = screen.getByDisplayValue('Biology');
    await user.clear(input);
    await user.type(input, 'Molecular Biology{Enter}');

    await user.click(screen.getByText('go dashboard'));
    expect(screen.getByText('Molecular Biology')).toBeInTheDocument();
    expect(screen.queryByText('Biology')).not.toBeInTheDocument();
  });

  test('renaming subject does not create a log entry', async () => {
    const user = setup();
    preload({ st_subjects: [{ id: 1, name: 'Chemistry', color: '#f87171', topics: [] }] });
    render(<AppShell defaultPage="subjects" />);

    await user.click(screen.getByText('edit'));
    const input = screen.getByDisplayValue('Chemistry');
    await user.clear(input);
    await user.type(input, 'Organic Chemistry{Enter}');

    const logs = JSON.parse(localStorage.getItem('st_logs') || '[]');
    const renameLogs = logs.filter((l) => l.text.includes('Organic Chemistry'));
    expect(renameLogs).toHaveLength(0);
  });
});

describe('Integration: Edit isolation — changes do not cross-affect other data', () => {
  test('renaming a subject does not change task text', async () => {
    const user = setup();
    preload({
      st_subjects: [{ id: 1, name: 'Math', color: '#6c63ff', topics: [] }],
      st_tasks: [{ id: 1, text: 'Study for exam', done: false, priority: 'high', created: today() }],
    });
    render(<AppShell defaultPage="subjects" />);

    await user.click(screen.getByText('edit'));
    const input = screen.getByDisplayValue('Math');
    await user.clear(input);
    await user.type(input, 'Advanced Math{Enter}');

    await user.click(screen.getByText('go tasks'));
    expect(screen.getByText('Study for exam')).toBeInTheDocument(); // task unchanged
  });

  test('editing a task does not change subject name', async () => {
    const user = setup();
    preload({
      st_subjects: [{ id: 1, name: 'Physics', color: '#f87171', topics: [] }],
      st_tasks: [{ id: 1, text: 'Review notes', done: false, priority: 'low', created: today() }],
    });
    render(<AppShell defaultPage="tasks" />);

    await user.click(screen.getByText('✎'));
    const input = screen.getByDisplayValue('Review notes');
    await user.clear(input);
    await user.type(input, 'Review chapter notes{Enter}');

    await user.click(screen.getByText('go subjects'));
    expect(screen.getByText('Physics')).toBeInTheDocument(); // subject unchanged
  });

  test('editing a topic does not affect sibling topics or the subject name', async () => {
    const user = setup();
    preload({
      st_subjects: [{ id: 1, name: 'Math', color: '#6c63ff', topics: [
        { id: 10, text: 'Algebra', done: false },
        { id: 11, text: 'Geometry', done: false },
      ]}],
    });
    render(<AppShell defaultPage="subjects" />);

    await user.click(screen.getByText('Math'));
    const pencilBtns = screen.getAllByText('✎');
    await user.click(pencilBtns[0]);
    const input = screen.getByDisplayValue('Algebra');
    await user.clear(input);
    await user.type(input, 'Linear Algebra{Enter}');

    expect(screen.getByText('Linear Algebra')).toBeInTheDocument();
    expect(screen.getByText('Geometry')).toBeInTheDocument();       // sibling untouched
    expect(screen.getAllByText('Math').length).toBeGreaterThan(0);  // subject name appears in card + panel
  });

  test('weekly stat and streak are independent — sessions shared, computed separately', () => {
    preload({
      st_sessions: [
        { id: 1, subjectId: 1, duration: 3600, date: today() },
        { id: 2, subjectId: 1, duration: 3600, date: daysAgo(1) },
      ],
    });
    render(<AppShell defaultPage="dashboard" />);
    // Streak: today + yesterday → 2d
    expect(screen.getByText('2d 🔥')).toBeInTheDocument();
    // This week: 2 sessions × 1h → 2h 0m
    const weekCard = screen.getByText('This week').closest('.stat-card');
    expect(within(weekCard).getByText('2h 0m')).toBeInTheDocument();
    // Today: only today → 1h 0m
    const todayCard = screen.getByText('Today').closest('.stat-card');
    expect(within(todayCard).getByText('1h 0m')).toBeInTheDocument();
  });
});
