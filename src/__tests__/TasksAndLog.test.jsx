import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudyProvider } from '../context/StudyContext';
import Tasks from '../components/Tasks';
import Log from '../components/Log';
import { today } from '../utils';

function wrap(ui, preload = {}) {
  Object.entries(preload).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v)));
  return render(<StudyProvider>{ui}</StudyProvider>);
}

// ─────────────────────────────────────────
// TASKS
// ─────────────────────────────────────────
describe('Tasks', () => {
  test('renders empty state', () => {
    wrap(<Tasks />);
    expect(screen.getByText(/No tasks yet/i)).toBeInTheDocument();
  });

  test('adds a task', async () => {
    wrap(<Tasks />);
    await userEvent.type(screen.getByPlaceholderText('Add a task...'), 'Read chapter 5');
    await userEvent.click(screen.getByText('+'));
    expect(screen.getByText('Read chapter 5')).toBeInTheDocument();
  });

  test('adds a task via Enter', async () => {
    wrap(<Tasks />);
    await userEvent.type(screen.getByPlaceholderText('Add a task...'), 'Do homework{Enter}');
    expect(screen.getByText('Do homework')).toBeInTheDocument();
  });

  test('does not add empty task', async () => {
    wrap(<Tasks />);
    await userEvent.click(screen.getByText('+'));
    expect(screen.getByText(/No tasks yet/i)).toBeInTheDocument();
  });

  test('clears input after adding', async () => {
    wrap(<Tasks />);
    const input = screen.getByPlaceholderText('Add a task...');
    await userEvent.type(input, 'Some task{Enter}');
    expect(input.value).toBe('');
  });

  test('high priority dot is red', async () => {
    wrap(<Tasks />);
    const select = screen.getByRole('combobox');
    await userEvent.selectOptions(select, 'high');
    await userEvent.type(screen.getByPlaceholderText('Add a task...'), 'Urgent{Enter}');
    const dots = document.querySelectorAll('[style*="border-radius: 50%"]');
    const red = Array.from(dots).some((d) => d.style.background === 'rgb(248, 113, 113)');
    expect(red).toBe(true);
  });

  test('completing a task moves it to Completed section', async () => {
    wrap(<Tasks />);
    await userEvent.type(screen.getByPlaceholderText('Add a task...'), 'Finish notes{Enter}');
    const checkbox = screen.getByRole('checkbox');
    await userEvent.click(checkbox);
    expect(screen.getByText(/Completed/i)).toBeInTheDocument();
  });

  test('completed task shows strikethrough', async () => {
    wrap(<Tasks />);
    await userEvent.type(screen.getByPlaceholderText('Add a task...'), 'Done task{Enter}');
    await userEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByText('Done task')).toHaveStyle('text-decoration: line-through');
  });

  test('unchecking a completed task moves it back to pending', async () => {
    wrap(<Tasks />, {
      st_tasks: [{ id: 1, text: 'Review notes', done: true, priority: 'medium', created: today() }],
    });
    expect(screen.getByText(/Completed/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('checkbox'));
    expect(screen.queryByText(/Completed/i)).not.toBeInTheDocument();
  });

  test('deletes a task', async () => {
    wrap(<Tasks />);
    await userEvent.type(screen.getByPlaceholderText('Add a task...'), 'Delete me{Enter}');
    await userEvent.click(screen.getByText('×'));
    expect(screen.queryByText('Delete me')).not.toBeInTheDocument();
  });

  test('persists task to localStorage', async () => {
    wrap(<Tasks />);
    await userEvent.type(screen.getByPlaceholderText('Add a task...'), 'Persistent task{Enter}');
    const stored = JSON.parse(localStorage.getItem('st_tasks'));
    expect(stored[0].text).toBe('Persistent task');
  });

  test('loads tasks from localStorage', () => {
    wrap(<Tasks />, {
      st_tasks: [{ id: 1, text: 'Preloaded task', done: false, priority: 'low', created: today() }],
    });
    expect(screen.getByText('Preloaded task')).toBeInTheDocument();
  });

  test('task count in completed section is correct', async () => {
    wrap(<Tasks />, {
      st_tasks: [
        { id: 1, text: 'Task A', done: true, priority: 'low', created: today() },
        { id: 2, text: 'Task B', done: true, priority: 'low', created: today() },
      ],
    });
    expect(screen.getByText(/Completed \(2\)/i)).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────
// LOG
// ─────────────────────────────────────────
describe('Log', () => {
  test('renders empty state with no logs', () => {
    wrap(<Log />);
    expect(screen.getByText(/No activity logged yet/i)).toBeInTheDocument();
  });

  test('renders log entries', () => {
    wrap(<Log />, {
      st_logs: [{ id: 1, text: 'Studied Math for 30m', color: '#6c63ff', time: '09:00', date: today() }],
    });
    expect(screen.getByText('Studied Math for 30m')).toBeInTheDocument();
  });

  test('groups entries by date', () => {
    wrap(<Log />, {
      st_logs: [
        { id: 1, text: 'Session A', color: '#fff', time: '10:00', date: today() },
        { id: 2, text: 'Session B', color: '#fff', time: '08:00', date: '2024-01-01' },
      ],
    });
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('2024-01-01')).toBeInTheDocument();
    expect(screen.getByText('Session A')).toBeInTheDocument();
    expect(screen.getByText('Session B')).toBeInTheDocument();
  });

  test('shows most recent date first', () => {
    wrap(<Log />, {
      st_logs: [
        { id: 1, text: 'Older entry', color: '#fff', time: '08:00', date: '2024-01-01' },
        { id: 2, text: 'Newer entry', color: '#fff', time: '10:00', date: today() },
      ],
    });
    const allText = document.body.textContent;
    expect(allText.indexOf('Today')).toBeLessThan(allText.indexOf('2024-01-01'));
  });

  test('export JSON button is present', () => {
    wrap(<Log />);
    expect(screen.getByText(/Export JSON/i)).toBeInTheDocument();
  });

  test('export JSON triggers download', async () => {
    const createObjectURL = jest.fn(() => 'blob:mock');
    window.URL.createObjectURL = createObjectURL;
    const clickMock = jest.fn();
    const origCreate = document.createElement.bind(document);
    jest.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = origCreate(tag);
      if (tag === 'a') el.click = clickMock;
      return el;
    });

    wrap(<Log />, {
      st_logs: [{ id: 1, text: 'Test', color: '#fff', time: '10:00', date: today() }],
    });
    await userEvent.click(screen.getByText(/Export JSON/i));
    expect(createObjectURL).toHaveBeenCalled();
    expect(clickMock).toHaveBeenCalled();

    jest.restoreAllMocks();
  });
});
