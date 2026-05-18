import React, { createContext, useContext, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { today } from '../utils';

const StudyContext = createContext(null);

export function StudyProvider({ children }) {
  const [subjects, setSubjects] = useLocalStorage('st_subjects', []);
  const [sessions, setSessions] = useLocalStorage('st_sessions', []);
  const [tasks, setTasks] = useLocalStorage('st_tasks', []);
  const [logs, setLogs] = useLocalStorage('st_logs', []);
  const [goals, setGoals] = useLocalStorage('st_goals', { daily: 7200, subjects: {} });
  const [pomState, setPomState] = useLocalStorage('st_pom', {
    subjectId: null, elapsed: 0, running: false, mode: 'focus', cycles: 0, startedAt: null
  });
  const [subjectTimers, setSubjectTimers] = useLocalStorage('st_subject_timers', {});

  const addLog = useCallback((text, color) => {
    setLogs((l) => [
      {
        id: Date.now(),
        text,
        color,
        time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
        date: today(),
      },
      ...l,
    ].slice(0, 300));
  }, [setLogs]);

  const logSession = useCallback((subjectId, duration) => {
    const numId = Number(subjectId);
    setSessions((s) => [
      ...s,
      { id: Date.now(), subjectId, duration, date: today(), ts: Date.now() },
    ]);
    const sub = subjects.find((s) => s.id === numId);
    if (sub) addLog(`Studied ${sub.name} for ${Math.floor(duration / 60)}m`, sub.color);
  }, [subjects, setSessions, addLog]);

  return (
    <StudyContext.Provider value={{
      subjects, setSubjects,
      sessions, setSessions,
      tasks, setTasks,
      logs, setLogs,
      goals, setGoals,
      pomState, setPomState,
      subjectTimers, setSubjectTimers,
      addLog, logSession,
    }}>
      {children}
    </StudyContext.Provider>
  );
}

export function useStudy() {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error('useStudy must be used within StudyProvider');
  return ctx;
}
