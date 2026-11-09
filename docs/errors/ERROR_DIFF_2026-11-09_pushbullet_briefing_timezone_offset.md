# ERROR_DIFF :: Przesunięcie strefy czasowej porannego briefingu Pushbullet (07:15 -> 08:15)

## 1. PROBLEM
- **Komponent:** `apps/worker/src/automation/lessonAlertMonitor.ts`, `apps/worker/src/cron/scheduler.ts`, `docker-compose.prod.yml`, `apps/worker/Dockerfile`
- **Klasyfikacja:** Defekt logiki synchronizacji czasu / anomalie strefy czasowej w kontenerze Alpine (UTC vs Europe/Warsaw)
- **Symptomy i opis:**
  Na serwerze Mikrus VPS poranny briefing Pushbullet jest dostarczany o godzinie 08:15 zamiast o 07:15.
- **Terminal Raw / Reprodukcja:**
  ```javascript
  // W środowisku kontenera (brak TZ, domyślne UTC):
  const d = new Date('2026-11-09T07:15:00Z');
  // d.getHours() zwraca 7 (godzina w UTC)
  // W Polsce (CET, UTC+1) jest to godzina 08:15!
  if (hours === 7 && mins === 15) { ... } // Wyzwala o 08:15 czasu polskiego!
  ```

## 2. SOLUTION
- **Architektura naprawy:**
  1. Wdrożenie modułu `timeUtils.ts` (`getWarsawTime`) opartego o `Intl.DateTimeFormat` z `timeZone: 'Europe/Warsaw'`.
  2. Zapewnienie, że ewaluacja godzin (`hours === 7 && mins === 15`) operuje ściśle na wyliczonej strefie warszawskiej niezależnie od lokalnego zegara maszyny hosta czy kontenera Docker.
  3. Dodanie pakietu `tzdata` oraz zmiennej środowiskowej `TZ=Europe/Warsaw` do `apps/worker/Dockerfile`, `apps/api/Dockerfile` oraz `docker-compose.prod.yml`.
- **Zasada Zero-Placeholder:** Pełna, deterministyczna implementacja bez skrótów i atrap.

## 3. POST-MORTEM
- **STATUS:** CLOSED (exit code 0, deterministyczna weryfikacja pomyślna)
- **APPROACH:** Dwuwarstwowa ochrona: aplikacyjna (Intl.DateTimeFormat) + środowiskowa (tzdata + ENV TZ).
- **IMPROVED:** Deterministyczne wyzwalanie briefingu o 07:15 czasu polskiego, zsynchronizowanie alertów dzwonkowych i okna snu o 20:00.
- **BROKE:** Brak regresji. Wszystkie testy jednostkowe i integracyjne przeszły pomyślnie.
