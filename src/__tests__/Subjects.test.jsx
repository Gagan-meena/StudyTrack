import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudyProvider } from '../context/StudyContext';
import Subjects from '../components/Subjects';

function renderSubjects(preloadedStorage = {}) {
  Object.entries(preloadedStorage).forEach(([k, v]) => {
    localStorage.setItem(k, JSON.stringify(v));
  });
  return render(<StudyProvider><Subjects /></StudyProvider>);
}

describe('Subjects', () => {
  test('renders empty state with no subjects', () => {
    renderSubjects();
    expect(screen.getByText(/No subjects yet/i)).toBeInTheDocument();
  });

  test('opens add subject modal', async () => {
    renderSubjects();
    await userEvent.click(screen.getByText('+ Add subject'));
    expect(screen.getByText('New subject')).toBeInTheDocument();
  });

  test('closes modal on cancel', async () => {
    renderSubjects();
    await userEvent.click(screen.getByText('+ Add subject'));
    await userEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('New subject')).not.toBeInTheDocument();
  });

  test('adds a new subject', async () => {
    renderSubjects();
    await userEvent.click(screen.getByText('+ Add subject'));
    await userEvent.type(screen.getByPlaceholderText('e.g. Mathematics'), 'Biology');
    await userEvent.click(screen.getByText('Add'));
    expect(screen.getByText('Biology')).toBeInTheDocument();
  });

  test('does not add subject with empty name', async () => {
    renderSubjects();
    await userEvent.click(screen.getByText('+ Add subject'));
    await userEvent.click(screen.getByText('Add'));
    expect(screen.getByText('New subject')).toBeInTheDocument(); // modal stays open
  });

  test('adds subject via Enter key', async () => {
    renderSubjects();
    await userEvent.click(screen.getByText('+ Add subject'));
    const input = screen.getByPlaceholderText('e.g. Mathematics');
    await userEvent.type(input, 'History{Enter}');
    expect(screen.getByText('History')).toBeInTheDocument();
  });

  test('persists new subject to localStorage', async () => {
    renderSubjects();
    await userEvent.click(screen.getByText('+ Add subject'));
    await userEvent.type(screen.getByPlaceholderText('e.g. Mathematics'), 'Physics');
    await userEvent.click(screen.getByText('Add'));
    const stored = JSON.parse(localStorage.getItem('st_subjects'));
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('Physics');
  });

  test('loads existing subjects from localStorage', () => {
    renderSubjects({
      st_subjects: [{ id: 1, name: 'Chemistry', color: '#f87171', topics: [] }],
    });
    expect(screen.getByText('Chemistry')).toBeInTheDocument();
  });

  test('deletes a subject', async () => {
    renderSubjects({
      st_subjects: [{ id: 1, name: 'Art', color: '#4ade80', topics: [] }],
    });
    await userEvent.click(screen.getByText('del'));
    expect(screen.queryByText('Art')).not.toBeInTheDocument();
  });

  test('clicking subject shows topic panel', async () => {
    renderSubjects({
      st_subjects: [{ id: 1, name: 'Math', color: '#6c63ff', topics: [] }],
    });
    await userEvent.click(screen.getByText('Math'));
    expect(screen.getByPlaceholderText('Add a topic...')).toBeInTheDocument();
  });

  test('adds a topic to selected subject', async () => {
    renderSubjects({
      st_subjects: [{ id: 1, name: 'Math', color: '#6c63ff', topics: [] }],
    });
    await userEvent.click(screen.getByText('Math'));
    await userEvent.type(screen.getByPlaceholderText('Add a topic...'), 'Calculus');
    await userEvent.click(screen.getByText('+'));
    expect(screen.getByText('Calculus')).toBeInTheDocument();
  });

  test('adds topic via Enter key', async () => {
    renderSubjects({
      st_subjects: [{ id: 1, name: 'Math', color: '#6c63ff', topics: [] }],
    });
    await userEvent.click(screen.getByText('Math'));
    await userEvent.type(screen.getByPlaceholderText('Add a topic...'), 'Algebra{Enter}');
    expect(screen.getByText('Algebra')).toBeInTheDocument();
  });

  test('checking a topic marks it done', async () => {
    renderSubjects({
      st_subjects: [{ id: 1, name: 'Math', color: '#6c63ff', topics: [{ id: 10, text: 'Limits', done: false }] }],
    });
    await userEvent.click(screen.getByText('Math'));
    const checkbox = screen.getByRole('checkbox');
    await userEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(screen.getByText('Limits')).toHaveStyle('text-decoration: line-through');
  });

  test('unchecking a topic marks it undone', async () => {
    renderSubjects({
      st_subjects: [{ id: 1, name: 'Math', color: '#6c63ff', topics: [{ id: 10, text: 'Limits', done: true }] }],
    });
    await userEvent.click(screen.getByText('Math'));
    const checkbox = screen.getByRole('checkbox');
    await userEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  test('deleting a topic removes it', async () => {
    renderSubjects({
      st_subjects: [{ id: 1, name: 'Math', color: '#6c63ff', topics: [{ id: 10, text: 'Vectors', done: false }] }],
    });
    await userEvent.click(screen.getByText('Math'));
    expect(screen.getByText('Vectors')).toBeInTheDocument();
    await userEvent.click(screen.getByText('×'));
    expect(screen.queryByText('Vectors')).not.toBeInTheDocument();
  });

  test('progress bar reflects topic completion', async () => {
    renderSubjects({
      st_subjects: [{
        id: 1, name: 'Math', color: '#6c63ff',
        topics: [
          { id: 10, text: 'A', done: true },
          { id: 11, text: 'B', done: false },
        ],
      }],
    });
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  test('topic count shows in subject card', () => {
    renderSubjects({
      st_subjects: [{
        id: 1, name: 'Math', color: '#6c63ff',
        topics: [
          { id: 10, text: 'A', done: false },
          { id: 11, text: 'B', done: false },
          { id: 12, text: 'C', done: false },
        ],
      }],
    });
    expect(screen.getByText(/3 topics/)).toBeInTheDocument();
  });

  test('deleting subject closes topic panel', async () => {
    renderSubjects({
      st_subjects: [{ id: 1, name: 'Math', color: '#6c63ff', topics: [] }],
    });
    await userEvent.click(screen.getByText('Math'));
    expect(screen.getByPlaceholderText('Add a topic...')).toBeInTheDocument();
    await userEvent.click(screen.getByText('del'));
    expect(screen.queryByPlaceholderText('Add a topic...')).not.toBeInTheDocument();
  });

  test('topics persist to localStorage', async () => {
    renderSubjects({
      st_subjects: [{ id: 1, name: 'Math', color: '#6c63ff', topics: [] }],
    });
    await userEvent.click(screen.getByText('Math'));
    await userEvent.type(screen.getByPlaceholderText('Add a topic...'), 'Integrals{Enter}');
    const stored = JSON.parse(localStorage.getItem('st_subjects'));
    expect(stored[0].topics[0].text).toBe('Integrals');
  });
});
