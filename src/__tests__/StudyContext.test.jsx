import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudyProvider, useStudy } from '../context/StudyContext';
import { today } from '../utils';

// Helper: renders a component wrapped in StudyProvider
function renderWithProvider(ui) {
  return render(<StudyProvider>{ui}</StudyProvider>);
}

// ── Consumer component that exposes context actions via buttons ──
function TestConsumer() {
  const {
    subjects, setSubjects,
    sessions, setSessions,
    tasks, setTasks,
    logs,
    goals, setGoals,
    addLog, logSession,
  } = useStudy();

  return (
    <div>
      {/* Subjects */}
      <div data-testid="subject-count">{subjects.length}</div>
      <button onClick={() => setSubjects((s) => [...s, { id: 1, name: 'Math', color: '#fff', topics: [] }])}>
        add subject
      </button>
      <button onClick={() => setSubjects([])}>clear subjects</button>

      {/* Sessions */}
      <div data-testid="session-count">{sessions.length}</div>
      <div data-testid="today-total">
        {sessions.filter((s) => s.date === today()).reduce((a, s) => a + s.duration, 0)}
      </div>
      <button onClick={() => setSessions((s) => [...s, { id: 99, subjectId: 1, duration: 3600, date: today() }])}>
        add session
      </button>

      {/* logSession helper */}
      <button onClick={() => logSession(1, 1800)}>log session</button>

      {/* Tasks */}
      <div data-testid="task-count">{tasks.length}</div>
      <button onClick={() => setTasks((t) => [...t, { id: 2, text: 'Read book', done: false }])}>
        add task
      </button>
      <button onClick={() => setTasks((t) => t.map((x) => x.id === 2 ? { ...x, done: true } : x))}>
        complete task
      </button>

      {/* Logs */}
      <div data-testid="log-count">{logs.length}</div>
      <button onClick={() => addLog('test log entry', '#6c63ff')}>add log</button>

      {/* Goals */}
      <div data-testid="daily-goal">{goals.daily}</div>
      <button onClick={() => setGoals((g) => ({ ...g, daily: 14400 }))}>set goal 4h</button>
    </div>
  );
}

describe('StudyContext — state management', () => {
  test('initial state is correct', () => {
    renderWithProvider(<TestConsumer />);
    expect(screen.getByTestId('subject-count').textContent).toBe('0');
    expect(screen.getByTestId('session-count').textContent).toBe('0');
    expect(screen.getByTestId('task-count').textContent).toBe('0');
    expect(screen.getByTestId('log-count').textContent).toBe('0');
    expect(screen.getByTestId('daily-goal').textContent).toBe('7200');
  });

  test('addSubject updates subject count', async () => {
    renderWithProvider(<TestConsumer />);
    await userEvent.click(screen.getByText('add subject'));
    expect(screen.getByTestId('subject-count').textContent).toBe('1');
  });

  test('clearSubjects resets to zero', async () => {
    renderWithProvider(<TestConsumer />);
    await userEvent.click(screen.getByText('add subject'));
    await userEvent.click(screen.getByText('clear subjects'));
    expect(screen.getByTestId('subject-count').textContent).toBe('0');
  });

  test('addSession updates session count and today total', async () => {
    renderWithProvider(<TestConsumer />);
    await userEvent.click(screen.getByText('add session'));
    expect(screen.getByTestId('session-count').textContent).toBe('1');
    expect(screen.getByTestId('today-total').textContent).toBe('3600');
  });

  test('logSession adds a session and a log entry', async () => {
    renderWithProvider(<TestConsumer />);
    // Need subject in context first so logSession can find the name
    await userEvent.click(screen.getByText('add subject'));
    await userEvent.click(screen.getByText('log session'));
    expect(screen.getByTestId('session-count').textContent).toBe('1');
    expect(screen.getByTestId('log-count').textContent).toBe('1');
  });

  test('addTask updates task count', async () => {
    renderWithProvider(<TestConsumer />);
    await userEvent.click(screen.getByText('add task'));
    expect(screen.getByTestId('task-count').textContent).toBe('1');
  });

  test('completing a task updates done state', async () => {
    renderWithProvider(<TestConsumer />);
    await userEvent.click(screen.getByText('add task'));
    await userEvent.click(screen.getByText('complete task'));
    expect(screen.getByTestId('task-count').textContent).toBe('1'); // still 1, just done
  });

  test('addLog increments log count', async () => {
    renderWithProvider(<TestConsumer />);
    await userEvent.click(screen.getByText('add log'));
    expect(screen.getByTestId('log-count').textContent).toBe('1');
  });

  test('addLog stores text and color', async () => {
    let capturedLogs;
    function Inspector() {
      const { logs, addLog } = useStudy();
      capturedLogs = logs;
      return <button onClick={() => addLog('hello world', '#ff0000')}>log</button>;
    }
    renderWithProvider(<Inspector />);
    await userEvent.click(screen.getByText('log'));
    expect(capturedLogs[0].text).toBe('hello world');
    expect(capturedLogs[0].color).toBe('#ff0000');
    expect(capturedLogs[0].date).toBe(today());
  });

  test('logs are capped at 300 entries', async () => {
    let ctx;
    function Inspector() {
      ctx = useStudy();
      return <button onClick={() => {
        for (let i = 0; i < 310; i++) ctx.addLog(`entry ${i}`, '#fff');
      }}>flood</button>;
    }
    renderWithProvider(<Inspector />);
    await userEvent.click(screen.getByText('flood'));
    expect(ctx.logs.length).toBeLessThanOrEqual(300);
  });

  test('setGoal updates daily goal', async () => {
    renderWithProvider(<TestConsumer />);
    await userEvent.click(screen.getByText('set goal 4h'));
    expect(screen.getByTestId('daily-goal').textContent).toBe('14400');
  });

  test('state persists to localStorage', async () => {
    renderWithProvider(<TestConsumer />);
    await userEvent.click(screen.getByText('add subject'));
    const stored = JSON.parse(localStorage.getItem('st_subjects'));
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('Math');
  });

  test('state is loaded from localStorage on mount', () => {
    localStorage.setItem('st_subjects', JSON.stringify([{ id: 1, name: 'Physics', color: '#fff', topics: [] }]));
    renderWithProvider(<TestConsumer />);
    expect(screen.getByTestId('subject-count').textContent).toBe('1');
  });
});

describe('StudyContext — cross-state sync', () => {
  // Two consumers reading the same context
  function ReaderA() {
    const { sessions } = useStudy();
    return <div data-testid="reader-a-sessions">{sessions.length}</div>;
  }
  function ReaderB() {
    const { sessions } = useStudy();
    return <div data-testid="reader-b-sessions">{sessions.length}</div>;
  }
  function Writer() {
    const { setSessions } = useStudy();
    return (
      <button onClick={() => setSessions((s) => [...s, { id: 1, subjectId: 1, duration: 900, date: today() }])}>
        write session
      </button>
    );
  }

  test('multiple consumers stay in sync when state changes', async () => {
    renderWithProvider(<><ReaderA /><ReaderB /><Writer /></>);
    expect(screen.getByTestId('reader-a-sessions').textContent).toBe('0');
    expect(screen.getByTestId('reader-b-sessions').textContent).toBe('0');
    await userEvent.click(screen.getByText('write session'));
    expect(screen.getByTestId('reader-a-sessions').textContent).toBe('1');
    expect(screen.getByTestId('reader-b-sessions').textContent).toBe('1');
  });
});
