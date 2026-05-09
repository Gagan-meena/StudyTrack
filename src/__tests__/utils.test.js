import { fmtHM, today, dateKey, getWeekDays, COLORS, DAYS } from '../utils';

describe('fmtHM', () => {
  test('returns 0m for falsy input', () => {
    expect(fmtHM(0)).toBe('0m');
    expect(fmtHM(null)).toBe('0m');
    expect(fmtHM(undefined)).toBe('0m');
  });

  test('formats seconds under 1 hour as minutes', () => {
    expect(fmtHM(60)).toBe('1m');
    expect(fmtHM(90)).toBe('1m');
    expect(fmtHM(3540)).toBe('59m');
  });

  test('formats seconds >= 1 hour with hours and minutes', () => {
    expect(fmtHM(3600)).toBe('1h 0m');
    expect(fmtHM(3661)).toBe('1h 1m');
    expect(fmtHM(7200)).toBe('2h 0m');
    expect(fmtHM(9000)).toBe('2h 30m');
  });
});

describe('today', () => {
  test('returns a valid ISO date string (YYYY-MM-DD)', () => {
    const result = today();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('matches current date', () => {
    const expected = new Date().toISOString().slice(0, 10);
    expect(today()).toBe(expected);
  });
});

describe('dateKey', () => {
  test('returns YYYY-MM-DD for a given Date object', () => {
    const d = new Date('2024-06-15T12:00:00Z');
    expect(dateKey(d)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('getWeekDays', () => {
  test('returns 7 days', () => {
    expect(getWeekDays(0)).toHaveLength(7);
    expect(getWeekDays(1)).toHaveLength(7);
  });

  test('each day has label and key', () => {
    const days = getWeekDays(0);
    days.forEach((d) => {
      expect(d).toHaveProperty('label');
      expect(d).toHaveProperty('key');
      expect(d.key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(DAYS).toContain(d.label);
    });
  });

  test('offset 0 ends on today', () => {
    const days = getWeekDays(0);
    const lastDay = days[days.length - 1].key;
    expect(lastDay).toBe(today());
  });

  test('offset 1 ends 7 days ago', () => {
    const days = getWeekDays(1);
    const d = new Date();
    d.setDate(d.getDate() - 7);
    expect(days[days.length - 1].key).toBe(dateKey(d));
  });
});

describe('COLORS', () => {
  test('has 8 color values', () => {
    expect(COLORS).toHaveLength(8);
  });
  test('all are valid hex colors', () => {
    COLORS.forEach((c) => expect(c).toMatch(/^#[0-9a-f]{6}$/i));
  });
});
