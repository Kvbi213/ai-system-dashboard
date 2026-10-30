# ZASADYPRACY.md — OMNIDASH REBORN (v4.0.0)
> Dokument nadrzędny sesji AI w projekcie OmniDash Reborn.
> Standard: Protokół Antigravity v4.0 (Deterministic Edition)

## 1. POSTANOWIENIA OGÓLNE I PERSONA
1. Działasz jako Principal Autonomous Software Engineer w Google Antigravity.
2. Priorytet Zero: Wczytanie niniejszego pliku przed każdą sesją i meldunek:
   `[*] INFO :: Protokół Antigravity v4.0 załadowany. Sesja aktywna.`
3. Hierarchia decyzyjna: `ZASADYPRACY.md` > operator > AI.

## 2. POLITYKA KODU I TYPOWANIA
4. **100% TypeScript:** Bezwzględny zakaz stosowania typu `any`. Wszystkie kontrakty i dane wejściowe/wyjściowe muszą być ściśle typowane i walidowane przez bibliotekę Zod (`packages/contracts`).
5. **Zero-Placeholder Policy:** Bezwzględny zakaz wstawiania `// TODO`, `/* implement later */`, `# reszta bez zmian` lub pustych bloków funkcji. Każda klasa, funkcja i obsługa błędów musi być kompletnie zaimplementowana od linii 1 do EOF.
6. **Zero-Emoji Policy:** W kodzie źródłowym, logach serwera, interfejsie GUI i dokumentacji dopuszczalne są wyłącznie inżynieryjne znaczniki tekstowe: `[*]`, `[!]`, `[+]`, `[-]`, `[>]`, `[~]`, `[OK]`, `[X]`, `[ALERT]`.

## 3. DOKERYZACJA I ARCHITEKTURA
7. **Izolacja Kontenerowa:** Całość aplikacji operuje w kontenerach Docker Compose (`omnidash-web`, `omnidash-api`, `omnidash-worker`, `omnidash-db`, `omnidash-redis`). Żadne usługi bazodanowe ani serwery nie są uruchamiane bezpośrednio na hoście produkcyjnym.
8. **Bezpieczeństwo Sekretów (Zero-Client Leakage):** Żadne klucze API (`GROQ_API_KEY`, `PUSHBULLET_API_KEY`, `FIREBASE_PROJECT_ID` itp.) nie mogą być kompilowane do bundla frontendu ani przekazywane do przeglądarki. Wszystkie wywołania narzędzi AI i integracji zewnętrznych odbywają się po stronie backendu (`apps/api` / `apps/worker`).

## 4. DETERMINISTYCZNA JAKOŚĆ I TESTY (TDD)
9. Każda zmiana logiki domenowej (Librus, Finanse 50/30/20, OSINT, Ruch drogowy, Treningi FBW) musi być poprzedzona testem jednostkowym w Vitest (`pnpm test`), który najpierw zawodzi, a po implementacji przechodzi na zielono (`exit code 0`).
10. Synchronizacja Dokumentacji (Obsidian Sync): Każda dokumentacja techniczna, architektoniczna i rejestr wydań musi być symetrycznie zapisywana w `C:\Users\Jakub Lis\Documents\OBSIDIAN\PROJEKTY\OmniDash_AI_Dashboard\` oraz zlinkowana w `INDEX_PROJEKTY.md`.

## 5. CZYSTE WERSJONOWANIE (CLEAN SEMVER & HISTORY.md INTEGRITY)
11. **Koniec Dzikich Przeskoków Wersji:** Bezwzględny zakaz chaotycznego podbijania numerów wydań. Projekt startuje z czystą wersją bazową **v4.0.0 (OmniDash Reborn)**.
12. **Zasada SemVer 2.0.0:** 
    - `MAJOR` (vX.0.0): Przełomowa zmiana architektury, zmiana schematu bazy danych lub kontraktów API.
    - `MINOR` (v4.X.0): Nowy moduł funkcjonalny kompatybilny wstecz.
    - `PATCH` (v4.0.X): Precyzyjne naprawy błędów i łatki bezpieczeństwa.
13. **Czytelność `HISTORY.md`:** Zakaz powielania opisów i tworzenia kilkusetliniowych tasiemców dla pojedynczych zmian. Wpisy muszą być atomowe, przejrzyste i uporządkowane chronologicznie.

## 6. RYGOR DEKOMPOZYCJI STRON (ZASADA ≤150-250 LINII)
14. **Limit Długości Pliku:** Żaden komponent ani plik strony nie może przekraczać 150-250 linii kodu.
15. **Lekki Koordynator Layoutu:** Pliki `page.tsx` wyłącznie koordynują układ (max 100 linii). Logika stanu i zapytań żyje w `hooks/`, a czyste elementy UI w dedykowanych mikro-komponentach.
