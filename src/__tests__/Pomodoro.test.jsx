import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudyProvider } from '../context/StudyContext';
import Pomodoro from '../components/Pomodoro';

// userEvent v14 + fake timers: use setup with advanceTimers
function setup() {
  return userEvent.setup({ advanceTimers: jest.advanceTimersByTime.bind(jest), delay: null });
}

beforeEach(() => { jest.useFakeTimers(); });
afterEach(() => { jest.runOnlyPendingTimers(); jest.useRealTimers(); });

function wrap(preload = {}) {
  Object.entries(preload).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v)));
  return render(<StudyProvider><Pomodoro /></StudyProvider>);
}

describe('Pomodoro', () => {
  test('renders timer display at 25:00', () => {
    wrap();
    expect(screen.getByText('25:00')).toBeInTheDocument();
  });

  test('start button begins countdown', async () => {
    const user = setup();
    wrap();
    await user.click(screen.getByText('▶ Start'));
    act(() => { jest.advanceTimersByTime(3000); });
    expect(screen.getByText('24:57')).toBeInTheDocument();
  });

  test('pause stops countdown', async () => {
    const user = setup();
    wrap();
    await user.click(screen.getByText('▶ Start'));
    act(() => { jest.advanceTimersByTime(2000); });
    await user.click(screen.getByText('⏸ Pause'));
    act(() => { jest.advanceTimersByTime(5000); });
    expect(screen.getByText('24:58')).toBeInTheDocument();
  });

  test('reset returns to full time', async () => {
    const user = setup();
    wrap();
    await user.click(screen.getByText('▶ Start'));
    act(() => { jest.advanceTimersByTime(10000); });
    await user.click(screen.getByText('⏹ Reset'));
    expect(screen.getByText('25:00')).toBeInTheDocument();
  });

  test('switching to short break changes time to 5:00', async () => {
    const user = setup();
    wrap();
    await user.click(screen.getByText('Short break'));
    expect(screen.getByText('05:00')).toBeInTheDocument();
  });

  test('switching to long break changes time to 15:00', async () => {
    const user = setup();
    wrap();
    await user.click(screen.getByText('Long break'));
    expect(screen.getByText('15:00')).toBeInTheDocument();
  });

  test('switching mode resets timer and stops it', async () => {
    const user = setup();
    wrap();
    await user.click(screen.getByText('▶ Start'));
    act(() => { jest.advanceTimersByTime(5000); });
    await user.click(screen.getByText('Short break'));
    act(() => { jest.advanceTimersByTime(3000); });
    expect(screen.getByText('05:00')).toBeInTheDocument();
  });

  test('subject selector shows subjects from context', () => {
    wrap({
      st_subjects: [
        { id: 1, name: 'Math', color: '#6c63ff', topics: [] },
        { id: 2, name: 'Physics', color: '#f87171', topics: [] },
      ],
    });
    expect(screen.getByText('Math')).toBeInTheDocument();
    expect(screen.getByText('Physics')).toBeInTheDocument();
  });

  test('selecting a subject persists to localStorage', async () => {
    const user = setup();
    wrap({ st_subjects: [{ id: 1, name: 'Math', color: '#6c63ff', topics: [] }] });
    await user.selectOptions(screen.getByRole('combobox'), '1');
    const stored = JSON.parse(localStorage.getItem('st_pom'));
    expect(String(stored.subjectId)).toBe('1');
  });

  test('cycle counter starts at 0', () => {
    wrap();
    expect(screen.getByText('Cycles completed: 0')).toBeInTheDocument();
  });

  test('completing a focus session increments cycles', async () => {
    const user = setup();
    wrap({
      st_subjects: [{ id: 1, name: 'Math', color: '#6c63ff', topics: [] }],
      st_pom: { subjectId: '1', elapsed: 0, running: false, mode: 'focus', cycles: 0 },
    });
    await user.click(screen.getByText('▶ Start'));
    act(() => { jest.advanceTimersByTime(25 * 60 * 1000); });
    expect(screen.getByText('Cycles completed: 1')).toBeInTheDocument();
  });

  test('after 1 focus cycle, mode switches to short break', async () => {
    const user = setup();
    wrap({
      st_subjects: [{ id: 1, name: 'Math', color: '#6c63ff', topics: [] }],
      st_pom: { subjectId: '1', elapsed: 0, running: false, mode: 'focus', cycles: 0 },
    });
    await user.click(screen.getByText('▶ Start'));
    act(() => { jest.advanceTimersByTime(25 * 60 * 1000); });
    expect(screen.getByText('05:00')).toBeInTheDocument();
  });

  test('after 4 focus cycles, mode switches to long break', async () => {
    const user = setup();
    wrap({
      st_subjects: [{ id: 1, name: 'Math', color: '#6c63ff', topics: [] }],
      st_pom: { subjectId: '1', elapsed: 0, running: false, mode: 'focus', cycles: 3 },
    });
    await user.click(screen.getByText('▶ Start'));
    act(() => { jest.advanceTimersByTime(25 * 60 * 1000); });
    expect(screen.getByText('15:00')).toBeInTheDocument();
  });

  test('settings sliders render with default values', () => {
    wrap();
    const sliders = screen.getAllByRole('slider');
    expect(sliders[0].value).toBe('25');
    expect(sliders[1].value).toBe('5');
    expect(sliders[2].value).toBe('15');
  });
});
