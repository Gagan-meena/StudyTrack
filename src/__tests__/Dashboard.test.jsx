import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudyProvider } from '../context/StudyContext';
import Dashboard from '../components/Dashboard';
import { today } from '../utils';

function renderDashboard(preloadedStorage = {}) {
  Object.entries(preloadedStorage).forEach(([k, v]) => {
    localStorage.setItem(k, JSON.stringify(v));
  });
  return render(
    <StudyProvider>
      <Dashboard />
    </StudyProvider>
  );
}

describe('Dashboard', () => {
  test('renders heading', () => {
    renderDashboard();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  test('shows 0m today with no sessions', () => {
    renderDashboard();
    const todayCard = screen.getByText('Today').closest('.stat-card');
    expect(within(todayCard).getByText('0m')).toBeInTheDocument();
  });

  test('shows correct session total for today', () => {
    renderDashboard({
      st_sessions: [
        { id: 1, subjectId: 1, duration: 3600, date: today() },
        { id: 2, subjectId: 1, duration: 1800, date: today() },
      ],
    });
    const todayCard = screen.getByText('Today').closest('.stat-card');
    expect(within(todayCard).getByText('1h 30m')).toBeInTheDocument();
  });

  test('does not count past sessions in today total', () => {
    renderDashboard({
      st_sessions: [
        { id: 1, subjectId: 1, duration: 7200, date: '2000-01-01' },
        { id: 2, subjectId: 1, duration: 1800, date: today() },
      ],
    });
    const todayCard = screen.getByText('Today').closest('.stat-card');
    expect(within(todayCard).getByText('30m')).toBeInTheDocument();
  });

  test('shows correct subject count', () => {
    renderDashboard({
      st_subjects: [
        { id: 1, name: 'Math', color: '#6c63ff', topics: [] },
        { id: 2, name: 'Physics', color: '#f87171', topics: [] },
      ],
    });
    const subjectsCard = screen.getByText('Subjects').closest('.stat-card');
    expect(within(subjectsCard).getByText('2')).toBeInTheDocument();
  });

  test('shows streak as 0 with no sessions', () => {
    renderDashboard();
    expect(screen.getByText('0d 🔥')).toBeInTheDocument();
  });

  test('shows streak of 1 with a session today', () => {
    renderDashboard({
      st_sessions: [{ id: 1, subjectId: 1, duration: 3600, date: today() }],
    });
    expect(screen.getByText('1d 🔥')).toBeInTheDocument();
  });

  test('goal bar renders with correct label', () => {
    renderDashboard({
      st_goals: { daily: 7200, subjects: {} },
      st_sessions: [{ id: 1, subjectId: 1, duration: 3600, date: today() }],
    });
    expect(screen.getByText("Today's goal")).toBeInTheDocument();
    expect(screen.getByText('Overall today')).toBeInTheDocument();
  });

  test('goal progress shows correct percentage', () => {
    renderDashboard({
      st_goals: { daily: 3600, subjects: {} },
      st_sessions: [{ id: 1, subjectId: 1, duration: 1800, date: today() }],
    });
    expect(screen.getByText(/50%/)).toBeInTheDocument();
  });

  test('goal progress shows 100% when goal met', () => {
    renderDashboard({
      st_goals: { daily: 3600, subjects: {} },
      st_sessions: [{ id: 1, subjectId: 1, duration: 3600, date: today() }],
    });
    expect(screen.getByText(/100%/)).toBeInTheDocument();
  });

  test('edit goal modal opens on button click', async () => {
    renderDashboard();
    await userEvent.click(screen.getByText('Edit goal'));
    expect(screen.getByText('Set daily goal')).toBeInTheDocument();
  });

  test('edit goal modal closes on cancel', async () => {
    renderDashboard();
    await userEvent.click(screen.getByText('Edit goal'));
    await userEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Set daily goal')).not.toBeInTheDocument();
  });

  test('saving goal updates localStorage', async () => {
    renderDashboard();
    await userEvent.click(screen.getByText('Edit goal'));
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '4' } });
    await userEvent.click(screen.getByText('Save'));
    const stored = JSON.parse(localStorage.getItem('st_goals'));
    expect(stored.daily).toBe(14400); // 4 * 3600
  });

  test('heatmap renders', () => {
    renderDashboard();
    expect(screen.getByText('Activity heatmap')).toBeInTheDocument();
    expect(screen.getByText('Less')).toBeInTheDocument();
    expect(screen.getByText('More')).toBeInTheDocument();
  });

  test('today by subject shows subjects with sessions', () => {
    renderDashboard({
      st_subjects: [{ id: 1, name: 'Chemistry', color: '#4ade80', topics: [] }],
      st_sessions: [{ id: 1, subjectId: 1, duration: 1800, date: today() }],
    });
    expect(screen.getByText('Chemistry')).toBeInTheDocument();
  });

  test('recent activity shows log entries', () => {
    renderDashboard({
      st_logs: [{ id: 1, text: 'Studied Math for 30m', color: '#6c63ff', time: '10:00', date: today() }],
    });
    expect(screen.getByText('Studied Math for 30m')).toBeInTheDocument();
  });
});
