import '@testing-library/jest-dom';

// Mock Chart.js to avoid canvas errors in jsdom
const mockDestroy = jest.fn();
const mockUpdate = jest.fn();
const MockChart = jest.fn().mockImplementation(() => ({
  destroy: mockDestroy,
  update: mockUpdate,
}));
jest.mock('chart.js/auto', () => ({
  __esModule: true,
  Chart: MockChart,
  default: MockChart,
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Reset localStorage before each test
beforeEach(() => {
  window.localStorage.clear();
  jest.clearAllMocks();
});
