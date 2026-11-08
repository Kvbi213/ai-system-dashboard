# ERROR_DIFF :: 2026-11-08 :: CORS Blocked Pushbullet API Error 500

## 1. PROBLEM
- **Komponent:** `apps/api/src/core/corsConfig.ts`, `docker-compose.prod.yml`, `apps/api/src/index.ts`
- **Symptom:**
  W Setup Wizard (Krok 2) po wprowadzeniu tokenu Pushbullet i kliknięciu "Testuj" zgłaszany jest błąd:
  `Błąd połączenia: API Error [500]:`
  oraz toast: `Błąd połączenia z Pushbullet API`.
- **Surowy log z kontenera `omnidash-api`:**
  ```text
  [!] API Gateway Error: Error: CORS blocked for origin: https://omni.kvbi.pl
      at origin (file:///app/apps/api/dist/index.js:46:22)
      at /app/node_modules/.pnpm/cors@2.8.6/node_modules/cors/lib/index.js:219:13
      at optionsCallback (/app/node_modules/.pnpm/cors@2.8.6/node_modules/cors/lib/index.js:199:9)
  ```
- **Przyczyna źródłowa (Root-Cause):**
  1. `docker-compose.prod.yml` nie deklarował dyrektywy `env_file: - .env` dla `omnidash-api` ani `omnidash-worker`, w związku z czym `process.env.ALLOWED_ORIGINS` był `undefined` w środowisku kontenera.
  2. Wartości domyślne `DEFAULT_ALLOWED_ORIGINS` w `apps/api/src/core/corsConfig.ts` oraz dopasowanie regex ograniczały się ściśle do domen lokalnych (`localhost`, `127.0.0.1`), brakowało reguły dla produkcyjnej domeny `https://omni.kvbi.pl` oraz subdomen `*.kvbi.pl`.
  3. Po odrzuceniu origin przez `cors`, wywołanie `callback(new Error('CORS blocked...'))` trafiało do globalnego error handlera Express, który zwracał HTTP 500.

## 2. SOLUTION
1. Zaktualizowanie `apps/api/src/core/corsConfig.ts`:
   - Dodanie `https://omni.kvbi.pl`, `https://dash.kvbi.pl`, `https://omnidash.kvbi.pl`, `https://hub.kvbi.pl`, `https://kvbi.pl` do `DEFAULT_ALLOWED_ORIGINS`.
   - Dodanie reguły regex dopuszczającej wszystkie subdomeny w domenie `kvbi.pl` (`/^https:\/\/(.*\.)?kvbi\.pl$/`).
2. Zaktualizowanie `docker-compose.prod.yml`:
   - Wstrzyknięcie `env_file: - .env` do konfiguracji `omnidash-api` oraz `omnidash-worker`.
3. Dodanie testów regresyjnych w `apps/api/tests/api_gateway.test.ts`.
4. Przebudowanie i restart kontenerów `omnidash-api` oraz `omnidash-worker` na Mikrus VPS.

## 3. POST-MORTEM
- **STATUS:** CLOSED (exit code 0, 17/17 Vitest passed, Groq Code Reviewer passed, live HTTP 200 OK verified)
- **APPROACH:** Rozszerzenie autoryzowanych domen CORS o `*.kvbi.pl`, wstrzyknięcie pliku środowiskowego `.env` w `docker-compose.prod.yml`, dodanie dozwolonych nagłówków `x-pushbullet-token`.
- **IMPROVED:** Pełne odblokowanie żądań z `https://omni.kvbi.pl`, poprawna weryfikacja tokenu Pushbullet na produkcji (użytkownik zweryfikowany z API Pushbullet, HTTP 200 OK), zerowy narzut pamięciowy (łączny RAM OmniDash: 91.55 MiB).
- **BROKE:** Brak regresji wstecznej.
