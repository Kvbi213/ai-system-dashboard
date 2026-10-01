import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import ITNewsTicker, { getNewsSlotInfo, getStoredNewsCache, setStoredNewsCache } from '../modules/components/ITNewsTicker.jsx';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        newsTickerTitle: 'News IT',
        newsLive: 'Na żywo',
        newsRefresh: 'Odśwież',
        newsConnError: 'Błąd połączenia',
        newsNoResults: 'Brak wiadomości'
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

describe('Brave Search Quota Guard & ITNewsTicker Slot Engine', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('1. Logika wyznaczania slotów czasowych (getNewsSlotInfo)', () => {
    it('wyznacza slot 10:00 dla godzin między 10:00 a 14:59', () => {
      const d1 = new Date('2026-10-01T10:00:00');
      const d2 = new Date('2026-10-01T14:59:59');
      const res1 = getNewsSlotInfo(d1);
      const res2 = getNewsSlotInfo(d2);

      expect(res1.label).toBe('10:00');
      expect(res1.slotKey).toBe('2026-10-01_10');
      expect(res2.label).toBe('10:00');
      expect(res2.slotKey).toBe('2026-10-01_10');
    });

    it('wyznacza slot 15:00 dla godzin między 15:00 a 19:59', () => {
      const d1 = new Date('2026-10-01T15:00:00');
      const d2 = new Date('2026-10-01T19:59:59');
      const res1 = getNewsSlotInfo(d1);
      const res2 = getNewsSlotInfo(d2);

      expect(res1.label).toBe('15:00');
      expect(res1.slotKey).toBe('2026-10-01_15');
      expect(res2.label).toBe('15:00');
      expect(res2.slotKey).toBe('2026-10-01_15');
    });

    it('wyznacza slot 20:00 dla godzin między 20:00 a 23:59', () => {
      const d = new Date('2026-10-01T20:30:00');
      const res = getNewsSlotInfo(d);

      expect(res.label).toBe('20:00');
      expect(res.slotKey).toBe('2026-10-01_20');
    });

    it('wyznacza slot 20:00 z dnia poprzedniego dla godzin porannych (00:00 - 09:59)', () => {
      const d = new Date('2026-10-02T08:15:00');
      const res = getNewsSlotInfo(d);

      expect(res.label).toBe('20:00');
      expect(res.slotKey).toBe('2026-10-01_20');
    });
  });

  describe('2. Pamięć podręczna przeglądarki (LocalStorage Cache)', () => {
    it('poprawnie zapisuje i odczytuje artykuły ze wskazanego slotu', () => {
      const mockArticles = [
        { title: 'Przełom w modelach LLM', url: 'https://example.com/1', source: 'Tech', time: '1h' }
      ];

      setStoredNewsCache('ai', '2026-10-01_10', mockArticles);
      const retrieved = getStoredNewsCache('ai', '2026-10-01_10');

      expect(retrieved).not.toBeNull();
      expect(retrieved.articles).toHaveLength(1);
      expect(retrieved.articles[0].title).toBe('Przełom w modelach LLM');
      expect(retrieved.slotKey).toBe('2026-10-01_10');
    });

    it('zwraca null w przypadku braku bufora lub błędnego formatu', () => {
      expect(getStoredNewsCache('unknown_cat', 'non_existing_slot')).toBeNull();
      localStorageMock.setItem('news_cache_ai_invalid', 'invalid json string');
      expect(getStoredNewsCache('ai', 'invalid')).toBeNull();
    });
  });

  describe('3. Komponent ITNewsTicker i optymalizacja zapytań Brave Search', () => {
    it('wykorzystuje zbuforowane artykuły bez wysyłania zapytania sieciowego', async () => {
      const slot = getNewsSlotInfo();
      const mockArticles = [
        { title: 'Zbuforowany artykuł AI 2026', url: 'https://example.com/ai', source: 'CacheIntel', time: '20m', description: 'Opis z bufora' }
      ];
      setStoredNewsCache('ai', slot.slotKey, mockArticles);

      const fetchSpy = vi.spyOn(global, 'fetch');

      await act(async () => {
        render(<ITNewsTicker selectedCategories={['ai', 'security']} />);
      });

      expect(screen.getAllByText('Zbuforowany artykuł AI 2026').length).toBeGreaterThan(0);
      expect(screen.getByText(`Slot: ${slot.label}`)).toBeTruthy();
      expect(fetchSpy).not.toHaveBeenCalled();

      fetchSpy.mockRestore();
    });

    it('pobiera dane z API gdy bufor jest pusty i zapisuje je w localStorage', async () => {
      const slot = getNewsSlotInfo();
      const apiResponse = {
        results: [
          { title: 'Nowy news z Brave Search API', url: 'https://brave.com/1', source: 'BraveNews', time: 'teraz', description: 'Świeże dane' }
        ]
      };

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => apiResponse
      });

      await act(async () => {
        render(<ITNewsTicker selectedCategories={['ai', 'security']} />);
      });

      await waitFor(() => {
        expect(screen.getAllByText('Nowy news z Brave Search API').length).toBeGreaterThan(0);
      });

      const cached = getStoredNewsCache('ai', slot.slotKey);
      expect(cached).not.toBeNull();
      expect(cached.articles[0].title).toBe('Nowy news z Brave Search API');

      fetchSpy.mockRestore();
    });

    it('wymusza ponowne zapytanie sieciowe po kliknięciu przycisku odświeżania', async () => {
      const slot = getNewsSlotInfo();
      setStoredNewsCache('ai', slot.slotKey, [
        { title: 'Stary artykuł z bufora', url: 'https://example.com/old', source: 'Old', time: '1h' }
      ]);

      const freshResponse = {
        results: [
          { title: 'Świeży artykuł po odświeżeniu ręcznym', url: 'https://example.com/fresh', source: 'Fresh', time: 'teraz' }
        ]
      };

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => freshResponse
      });

      await act(async () => {
        render(<ITNewsTicker selectedCategories={['ai', 'security']} />);
      });

      expect(screen.getAllByText('Stary artykuł z bufora').length).toBeGreaterThan(0);

      const refreshBtn = screen.getByTitle('Odśwież ręcznie (Wymuszenie zapytania API)');
      await act(async () => {
        fireEvent.click(refreshBtn);
      });

      await waitFor(() => {
        expect(screen.getAllByText('Świeży artykuł po odświeżeniu ręcznym').length).toBeGreaterThan(0);
      });

      expect(fetchSpy).toHaveBeenCalled();
      fetchSpy.mockRestore();
    });
  });
});
