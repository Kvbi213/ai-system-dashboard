# ERROR_DIFF: ReferenceError resetToDefaults is not defined w SettingsPage

Data wykrycia: 2026-10-20
Identyfikator: ERR-20261020-SETTINGS-REF-01
Komponent: `modules/pages/SettingsPage.jsx`
Środowisko: Produkcyjne (Firebase Hosting `void-potato-7721.web.app` / Vercel `ai-system-dashboard.vercel.app`)

---

## 1. PROBLEM

### Terminal Raw / Konsola Przeglądarki
```
Error: ReferenceError: resetToDefaults is not defined

Stack:
    at Jo (https://void-potato-7721.web.app/assets/SettingsPage-DjtuvxCN.js:56:4598)
    at RG (https://void-potato-7721.web.app/assets/index-xe1dIeWA.js:216:4231)
    at JG (https://void-potato-7721.web.app/assets/index-xe1dIeWA.js:216:8411)
    at Suspense
    at main
    at div
    at FG (https://void-potato-7721.web.app/assets/index-xe1dIeWA.js:216:7522)
    at m9 (https://void-potato-7721.web.app/assets/index-xe1dIeWA.js:216:17436)
    at ble (https://void-potato-7721.web.app/assets/index-xe1dIeWA.js:4643:424)
    at yde (https://void-potato-7721.web.app/assets/index-xe1dIeWA.js:4680:30384)
    at $ce (https://void-potato-7721.web.app/assets/index-xe1dIeWA.js:4666:89566)
    at a$ (https://void-potato-7721.web.app/assets/index-xe1dIeWA.js:232:4602)
    at sde (https://void-potato-7721.web.app/assets/index-xe1dIeWA.js:4677:36144)
```

### Klasyfikacja
- Typ: Defekt Wykonawczy JavaScript / Runtime ReferenceError
- Priorytet: KRYTYCZNY (blokuje renderowanie podstrony `/settings`)
- Obszar: Front-End / React Router Lazy Component (`SettingsPage.jsx`)

### Izolacja
W pliku `modules/pages/SettingsPage.jsx` w sekcji nagłówka akcji globalnych (linie 1123-1138) dodano przyciski:
- `<button onClick={resetToDefaults}>`
- `<button onClick={saveSettings}>`
Żadna z tych funkcji (`resetToDefaults`, `saveSettings`) nie została zdefiniowana w ciele komponentu funkcyjnego `SettingsPage`. W momencie montowania komponentu React następuje odwołanie do niezdefiniowanego identyfikatora i awaria całego drzewa renderowania.

---

## 2. SOLUTION

### Plan Naprawy
1. Wdrożenie pełnych implementacji `saveSettings` oraz `resetToDefaults` w `modules/pages/SettingsPage.jsx`.
2. `saveSettings`:
   - Zapis bieżących stanów konfiguracyjnych do `localStorage`: motyw (`system_theme`), akcent (`system_accent_hex`), powiadomienia (`system_notifications`), tryb ghost (`system_ghost_mode`), język (`system_language`), kategorie newsów (`system_news_categories`), preferencje monitora (`system_sysmonitor`), aktywne widżety (`system_active_widgets`), parametry głosu TTS, widoczność zakładek (`system_visible_nav`), domyślny model AI (`system_default_model`), przełączniki graficzne (glassmorphism, animacje, compact UI, zegar 24h/sekundy).
   - Rozgłoszenie zdarzeń `CustomEvent` (`visibleNavChanged`, `newsCategoriesChanged`, `activeWidgetsChanged`, `defaultModelChanged`, `sysMonitorPrefsChanged`, `themeChanged`).
   - Aktywacja wskaźnika stanu `saved` na 2.5 sekundy.
3. `resetToDefaults`:
   - Przywrócenie domyślnych wartości wszystkich stanów.
   - Aktualizacja klas DOM (`no-glass`, `no-animations`, `compact-mode`) i atrybutu `data-theme`.
   - Zapis wartości domyślnych do `localStorage` i rozgłoszenie zdarzeń synchronizacyjnych.
   - Aktywacja wskaźnika stanu `saved`.
4. Dodanie wizualnego indykatora zapisu obok przycisków akcji.

---

## 3. POST-MORTEM (STATUS: RESOLVED)

### Status
- STATUS: RESOLVED
- APPROACH:
  - Zaimplementowano w `modules/pages/SettingsPage.jsx` pełne funkcje `saveSettings` oraz `resetToDefaults`.
  - Obie funkcje synchronizują stan do `localStorage`, modyfikują atrybuty i klasy drzewa DOM (`data-theme`, `no-glass`, `no-animations`, `compact-mode`) oraz emitują spójne zdarzenia `CustomEvent` (`visibleNavChanged`, `newsCategoriesChanged`, `activeWidgetsChanged`, `defaultModelChanged`, `sysMonitorPrefsChanged`, `themeChanged`) do reszty ekosystemu OmniDash.
  - Dodano wizualny indykator powiadomienia o pomyślnym zapisie (`saved`) z ikoną `Check`.
- IMPROVED:
  - Brak awarii i rzucania `ReferenceError` podczas montowania `SettingsPage`.
  - 100% zgodności testów jednostkowych Vitest (22 zestawy, 264 testy przeszły pomyślnie).
  - Czysta kompilacja produkcyjna Vite (`npm run build`).
- BROKE:
  - Brak regresji. Wszystkie istniejące funkcjonalności ustawień, TTS i integracji pozostały nienaruszone.
