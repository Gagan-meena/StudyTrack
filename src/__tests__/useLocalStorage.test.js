import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../hooks/useLocalStorage';

describe('useLocalStorage', () => {
  test('returns initial value when nothing in storage', () => {
    const { result } = renderHook(() => useLocalStorage('test_key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  test('returns initial array when nothing in storage', () => {
    const { result } = renderHook(() => useLocalStorage('test_arr', []));
    expect(result.current[0]).toEqual([]);
  });

  test('persists a string value to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test_str', ''));
    act(() => { result.current[1]('hello'); });
    expect(result.current[0]).toBe('hello');
    expect(JSON.parse(localStorage.getItem('test_str'))).toBe('hello');
  });

  test('persists an object to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test_obj', {}));
    act(() => { result.current[1]({ name: 'Math', color: '#fff' }); });
    expect(result.current[0]).toEqual({ name: 'Math', color: '#fff' });
    expect(JSON.parse(localStorage.getItem('test_obj'))).toEqual({ name: 'Math', color: '#fff' });
  });

  test('supports functional updater', () => {
    const { result } = renderHook(() => useLocalStorage('test_fn', [1, 2]));
    act(() => { result.current[1]((prev) => [...prev, 3]); });
    expect(result.current[0]).toEqual([1, 2, 3]);
  });

  test('reads existing value from localStorage on mount', () => {
    localStorage.setItem('test_existing', JSON.stringify({ loaded: true }));
    const { result } = renderHook(() => useLocalStorage('test_existing', {}));
    expect(result.current[0]).toEqual({ loaded: true });
  });

  test('falls back to initial value on invalid JSON', () => {
    localStorage.setItem('test_bad', 'not-json{{{{');
    const { result } = renderHook(() => useLocalStorage('test_bad', 'fallback'));
    expect(result.current[0]).toBe('fallback');
  });

  test('two hooks with different keys do not share state', () => {
    const { result: a } = renderHook(() => useLocalStorage('key_a', 0));
    const { result: b } = renderHook(() => useLocalStorage('key_b', 0));
    act(() => { a.current[1](99); });
    expect(a.current[0]).toBe(99);
    expect(b.current[0]).toBe(0);
  });
});
