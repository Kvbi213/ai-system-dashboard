import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ToastContainer from '../modules/components/ToastContainer.jsx';
import { ToastProvider, useToast } from '../modules/context/ToastContext.jsx';
import ExportModal from '../modules/components/ExportModal.jsx';
import SystemMonitor from '../modules/components/SystemMonitor.jsx';
import WeatherWidget from '../modules/components/WeatherWidget.jsx';
import Sidebar from '../modules/components/Sidebar.jsx';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        settings: 'Ustawienia',
        weatherNoData: 'Brak danych pogodowych',
        weatherSunny: 'Słonecznie',
      };
      return translations[key] || key;
    },
    i18n: { language: 'pl' }
  })
}));

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true, configurable: true });
global.localStorage = localStorageMock;

describe('React Component Rendering & State Error Boundary Suites', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should render ToastContainer without crashing when empty', () => {
    const { container } = render(
      <ToastProvider>
        <ToastContainer />
      </ToastProvider>
    );
    expect(container).toBeTruthy();
  });

  it('should render active toasts and close buttons properly', () => {
    const TestComponent = () => {
      const { toast } = useToast();
      return (
        <div>
          <button onClick={() => toast.success('Operacja powiodła się', 'Sukces')}>
            Dodaj Toast
          </button>
          <ToastContainer />
        </div>
      );
    };

    const { getByText } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const btn = getByText('Dodaj Toast');
    act(() => {
      fireEvent.click(btn);
    });

    expect(screen.getByText('Sukces')).toBeTruthy();
    expect(screen.getByText('Operacja powiodła się')).toBeTruthy();
  });

  it('should render ExportModal with tabs and CSV export action buttons', () => {
    const handleClose = vi.fn();
    const mockFinances = [
      { id: '1', title: 'Wypłata', amount: 5000, type: 'income', transaction_date: '2026-09-01' }
    ];

    render(
      <ToastProvider>
        <ExportModal
          isOpen={true}
          onClose={handleClose}
          finances={mockFinances}
          tasks={[]}
          workouts={[]}
          timetable={[]}
        />
      </ToastProvider>
    );

    expect(screen.getByText('Centrum Eksportu i Raportów')).toBeTruthy();
    expect(screen.getByText('Pobierz Arkusz CSV')).toBeTruthy();
    expect(screen.getByText('Drukuj / Zapisz jako PDF')).toBeTruthy();
  });

  it('should not render ExportModal when isOpen is false', () => {
    const { queryByText } = render(
      <ToastProvider>
        <ExportModal
          isOpen={false}
          onClose={() => {}}
        />
      </ToastProvider>
    );

    expect(queryByText('Centrum Eksportu i Raportów')).toBeNull();
  });

  it('should render SystemMonitor with telemetry metrics and status indicator', async () => {
    render(<SystemMonitor />);

    // In jsdom environment, client telemetry runs immediately
    expect(screen.getByText('System Monitor')).toBeTruthy();
    expect(screen.getByText('CPU')).toBeTruthy();
    expect(screen.getByText('RAM')).toBeTruthy();
    expect(screen.getByText('Uptime')).toBeTruthy();
  });

  it('should render WeatherWidget fallback gracefully when API data is absent', async () => {
    // Stub fetch to simulate API failure
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    render(<WeatherWidget />);

    // Fast-forward or wait for error state
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(screen.getByText('Brak danych pogodowych')).toBeTruthy();
  });

  it('should render Sidebar and toggle dark/light theme on button click', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    expect(screen.getAllByText('Pulpit').length).toBeGreaterThan(0);
    const themeButtons = screen.getAllByLabelText('Przełącz tryb jasny/ciemny');
    expect(themeButtons.length).toBeGreaterThan(0);

    // Initial theme defaults to dark
    expect(localStorage.getItem('system_theme') || 'dark').toBe('dark');

    // Click desktop/mobile theme toggle
    act(() => {
      fireEvent.click(themeButtons[0]);
    });

    // Theme should switch to light
    expect(localStorage.getItem('system_theme')).toBe('light');

    // Click again to switch back to dark
    act(() => {
      fireEvent.click(themeButtons[0]);
    });
    expect(localStorage.getItem('system_theme')).toBe('dark');
  });
});
