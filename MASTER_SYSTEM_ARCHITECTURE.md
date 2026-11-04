# MASTER_SYSTEM_ARCHITECTURE.md — MASTER SYSTEM SPECIFICATION
> **OmniDash Reborn v4.0.0 (Core & Edge Operating System)**  
> **Status:** PRODUKCYJNY / ZWERYFIKOWANY EMPIRYCZNIE (100% GREEN)  
> **Standard:** Protokół Antigravity v4.0 (Deterministic Edition)  
> **Data kompilacji raportu:** 2026-11-04  

---

## 1. WPROWADZENIE I TOPOLOGIA EKOSYSTEMU

OmniDash Reborn v4.0.0 to modularna, wysokowydajna platforma operacyjna dla jednego użytkownika (personal executive environment), integrująca asystenta AI, edukację (Librus Synergia), finanse (50/30/20), logistykę miejską (kamery GDDKiA, radary CANARD), kalistenikę (FBW), terminarz szkolno-osobisty, graf encji Matrix 120m² oraz telemetrię infrastruktury w standardzie **Apple Liquid Glass** i architekturze **Zero-Trust**.

### Topologia Węzłów:
```
                                +-----------------------------------+
                                |    Frontend SPA (React 19 Vite)   |
                                |       http://localhost:3000       |
                                +-----------------+-----------------+
                                                  | REST / SSE / MCP
                                                  v
+-----------------------------+        +----------+-----------------------+        +--------------------------+
|  OmniDash Worker (Daemon)   | <====> |  OmniDash API Gateway (Express)  | <====> |   PostgreSQL / SQLite    |
|   - Cron Scheduler (5 task) |        |       http://localhost:5000      |        |      dbStore (Single)    |
|   - Pushbullet Dispatcher   |        |  - Zero-Trust Bearer Auth Guard  |        +--------------------------+
|   - LogDrain Clustering     |        |  - Multi-Provider LLM Gateway    |
+-----------------------------+        |  - Lab-Zero Semantic Memory      |        +--------------------------+
                                       |  - KeepHQ Rules Engine           | <====> |  Zewnętrzne Modele AI    |
                                       |  - Internal MCP Server (29 tools)|        |  Groq / Gemini / OpenAI  |
                                       +----------------------------------+        +--------------------------+
```

---

## 2. REJESTR WSZYSTKICH MODUŁÓW I STRUKTURA PLIKÓW

### A. Repozytorium Root
* `package.json` — konfiguracja globalna monorepo `pnpm workspaces`.
* `pnpm-workspace.yaml` — definicja pakietów: `apps/*`, `packages/*`.
* `docker-compose.yml` — orkiestracja kontenerów produkcyjnych: `omnidash-web`, `omnidash-api`, `omnidash-worker`, `omnidash-db`, `omnidash-redis`.
* `ZASADYPRACY.md` — nadrzędna konstytucja operacyjna systemu.
* `ARCHITECTURE.md` — skrótowy rejestr komponentów i metryk testowych.
* `HISTORY.md` — append-only chronologiczny rejestr wydań SemVer 2.0.0.

### B. `apps/api/` — API Gateway & Silnik Domenowy (Port 5000)
* **`src/index.ts`** — punkt wejścia serwera Express, obsługa CORS, json body parser, rejestracja routerów pod prefiksem `/api`.
* **`src/middleware/authMiddleware.ts`** — filtr Zero-Trust weryfikujący nagłówek `Authorization: Bearer <TOKEN>` (obsługa dev-tokenów i tokenów sesji, publiczny endpoint webhooka).
* **`src/db/store.ts`** — silnik bazy danych in-memory z pełnym pokryciem encji, operacjami CRUD (To-Do, Finanse, Kalendarz, Wydatki) i fallbackiem Zod.
* **`src/db/seedData.ts`** — autorytatywny zbiór danych wzorcowych: 35 lekcji tygodniowych 1:1 z Librus Synergia, 16 ocen szkolnych, transakcje finansowe, fotoradary CANARD, rutyny i ćwiczenia FBW.
* **`src/domains/pushbullet/`**:
  - `pushbulletService.ts` — fizyczna wysyłka push przez REST API Pushbullet (`/v2/pushes`), weryfikacja tokena (`/v2/users/me`), sanityzacja markdownu na urządzenia mobilne, tryb symulacyjny przy braku tokenu.
  - `router.ts` — endpointy `/api/pushbullet/send`, `/api/pushbullet/test`, `/api/pushbullet/history`, `/api/pushbullet/webhook`.
* **`src/domains/ai/llmGateway.ts`** — brama wielomodelowa: Groq (`llama-3.3-70b-versatile`) -> Gemini 2.0 Flash -> OpenAI (`gpt-4o-mini`) -> Deterministic Local Core z bezpiecznym wrapperem `withTimeout`.
* **`src/domains/ai/iterationBudget.ts`** — ogranicznik pętli i budżetu tokenów zapobiegający pętlom nieskończonym agentów (`maxLoops`, `maxTokens`, `timeoutMs`).
* **`src/domains/ai/router.ts`** — endpointy `/api/ai/chat` (z obsługą tool calls) oraz `/api/ai/stream` (SSE).
* **`src/domains/memory/semanticRecall.ts`** — lokalny offline silnik wektorowy Lab-Zero (128-wymiarowe n-gramowe embeddingi gęste z rankingiem cosinusowym `<30ms`).
* **`src/domains/system/finopsCollector.ts`** — telemetria kosztowa FinOps śledząca zużycie tokenów i znaków TTS z wykrywaniem przerw w danych (*Coverage Gaps*).
* **`src/domains/rules/ruleEngine.ts`** & **`router.ts`** — deklaratywny silnik reguł automatyzacji wzorowany na `keephq/keep` montowany pod `/api/rules`.
* **`src/mcp/internalMcpServer.ts`** — serwer MCP udostępniający 29 narzędzi operacyjnych pod `/api/mcp/tools` i `/api/mcp/call`.

### C. `apps/worker/` — Asynchroniczny Kontener Roboczy
* **`src/index.ts`** — inicjalizacja daemona roboczego, synchronizacja zegara systemowego z API Gateway.
* **`src/pushbullet/dispatcher.ts`** — priorytetyzowany dispatcher powiadomień push (`CRITICAL` > `NORMAL` > `LOW`) z token-bucket rate limiterem (max 12 pushy/min) i kolejką FIFO.
* **`src/scheduler/systemScheduler.ts`** — cykliczny harmonogram zadań cron (odpytywanie Librusa, radary CANARD, telemetria serwerowa).
* **`src/telemetry/logDrain.ts`** — silnik klastrowania logów online (algorytm Drain) redukujący redundancję logów o >95%.

### D. `apps/web/` — Frontend SPA (React 19 + Vite 6 + Tailwind v4) (Port 3000)
* **`src/App.tsx`** — główny router SPA z obsługą motywów Dark/Light, wstrzykiwaniem toastów i blokadą PIN Zero-Trust.
* **`src/components/ui/GlassCard.tsx`** — prymityw Apple Liquid Glass (`bg-slate-950/85 backdrop-blur-2xl border-white/10`).
* **`src/components/ui/RulerWheelPicker.tsx`** — interaktywny suwak/bęben 3D z perspektywą cylindryczną, fizyką momentum scroll, Web Audio i wibracjami haptycznymi.
* **`src/components/ui/HumanCheckpointModal.tsx`** — modal autoryzacji operacji krytycznych z 3-sekundowym countdownem bezpieczeństwa.
* **`src/components/security/LockScreenOverlay.tsx`** — ekran blokady PIN z zabezpieczeniem lockout po 3 błędnych próbach.
* **`src/modules/dashboard/page.tsx`** — Pulpit Główny: wskaźniki KPI, trwający blok zajęć, radar DK22/A1, Oś Czasu Dnia.
* **`src/modules/workouts/page.tsx`** & **`components/RestTimerOverlay.tsx`** — kalistenika FBW na strychu, licznik przerw między seriami, reaktywny hook `useWorkoutState.ts`.
* **`src/modules/school/page.tsx`** — moduł szkolny: pełny tydzień planu zajęć Librus, oceny, frekwencja, terminarz.
* **`src/modules/finance/page.tsx`** — finanse 50/30/20, predykcja budżetu z write-backiem, koperty, subskrypcje.
* **`src/modules/calendar/page.tsx`** & **`components/MonthGridCalendar.tsx`** & **`components/EventModal.tsx`** — Terminarz miesięczny, integracja sprawdzianów Librus i wydarzeń osobistych z modalem dodawania.
* **`src/modules/entities/page.tsx`** & **`components/EntityTreeView.tsx`** & **`components/EntityDetailsModal.tsx`** — Baza Wiedzy & Rejestr Podmiotów: hierarchiczny graf powiązań Matrix 120m², osób, infrastruktury i szkół z linkami do Obsidian.
* **`src/modules/search/page.tsx`** — Uniwersalna Wyszukiwarka Omnibox przeszukująca pamięć Lab-Zero, zadania, transakcje finansowe i oceny.
* **`src/modules/osint/page.tsx`** — analiza IP, DNS, ASN, certyfikatów SSL oraz tarcza anty-SSRF.
* **`src/modules/settings/page.tsx`** — konfiguracja kernelu, ustawienia powiadomień Pushbullet z testem tokena i wysyłką alertów, widżet FinOps i Semantic Memory Recall.

---

## 3. PEŁNY SPIS NARZĘDZI MCP (INTERNAL MCP SERVER TOOLS — 29 NARZĘDZI)

Serwer MCP udostępnia standardowy protokół narzędziowy pod adresem `POST /api/mcp/call`:

| Lp. | Nazwa Narzędzia (`name`) | Parametry Wejściowe | Opis Działania |
|---|---|---|---|
| 1 | **`get_current_lesson_status`** | `day?: number`, `currentTime?: string` | Wylicza bieżący status lekcji, czas do dzwonka, przerwę i kolejną salę. |
| 2 | **`schedule_lesson_transition_alert`** | `minutesBeforeEnd?: number`, `lessonIndex?: number`, `customNote?: string` | Planuje powiadomienie Pushbullet / alert asystenta na koniec lekcji. |
| 3 | **`save_student_directive`** | `directive: string`, `tags?: string` | Zapisuje stałą preferencję/dyrektywę ucznia do bazy Lab-Zero. |
| 4 | **`get_system_metrics`** | *brak* | Zwraca telemetrię serwera (RAM, CPU, Uptime, Load Avg). |
| 5 | **`query_timetable`** | `day: number` (1-5) | Zwraca zsynchronizowany plan zajęć Librus Synergia. |
| 6 | **`get_active_alerts`** | *brak* | Zwraca ostrzeżenia drogowe CANARD, fotoradary i zdarzenia. |
| 7 | **`trigger_workout_sync`** | `cycle?: string` | Synchronizuje stan postępu serii kalisteniki FBW z magazynem danych. |
| 8 | **`send_phone_notification`** | `title: string`, `body: string`, `priority?: string` | Wysyła powiadomienie Pushbullet bezpośrednio na smartfon operatora. |
| 9 | **`get_phone_notifications`** | `limit?: number` | Pobiera historię ostatnich powiadomień push wysłanych przez system. |
| 10 | **`add_to_do`** | `title: string`, `category?: string`, `priority?: string`, `dueTime?: string` | Tworzy nowe zadanie w systemowym rejestrze zadań To-Do. |
| 11 | **`delete_to_do`** | `id: string` | Usuwa zadanie z listy To-Do. |
| 12 | **`update_to_do`** | `id: string`, `completed?: boolean`, `title?: string`, `priority?: string` | Aktualizuje status wykonania lub treść zadania. |
| 13 | **`get_all_tasks`** | `category?: string`, `onlyPending?: boolean` | Pobiera listę zadań z opcją filtrowania po kategorii i statusie. |
| 14 | **`add_finance_record`** | `title: string`, `amount: number`, `envelope: string`, `category: string` | Rejestruje transakcję/wydatek w budżecie 50/30/20. |
| 15 | **`delete_finance_record`** | `id: string` | Usuwa wpis finansowy z rejestru. |
| 16 | **`transfer_funds`** | `fromEnvelope: string`, `toEnvelope: string`, `amount: number`, `note?: string` | Wykonuje przesunięcie środków pomiędzy kopertami budżetowymi. |
| 17 | **`get_gcp_budget_status`** | *brak* | Zwraca telemetryczny stan wydatków chmury Google Cloud i limitów. |
| 18 | **`get_librus_grades`** | `subject?: string` | Zwraca oceny szkolne, wagi ocen i wyliczoną średnią ważoną. |
| 19 | **`get_librus_calendar`** | `startDate?: string`, `endDate?: string` | Pobiera terminarz sprawdzianów i wydarzeń z e-dziennika Librus. |
| 20 | **`add_calendar_event`** | `title: string`, `date: string`, `type?: string`, `description?: string` | Dodaje nowe wydarzenie lub sprawdzian do terminarza. |
| 21 | **`delete_calendar_event`** | `id: string` | Usuwa wydarzenie z terminarza kalendarzowego. |
| 22 | **`get_calendar_events`** | `month?: number`, `year?: number` | Pobiera listę wydarzeń z kalendarza z filtrowaniem po miesiącu. |
| 23 | **`learn_fact`** | `fact: string`, `category?: string` | Zapisuje fakt kognitywny w pamięci semantycznej Lab-Zero. |
| 24 | **`query_semantic_memory`** | `query: string`, `limit?: number`, `minSimilarity?: number` | Wyszukuje semantycznie wiedzę w pamięci wektorowej Lab-Zero. |
| 25 | **`perform_osint_scan`** | `target: string`, `scanType?: string` | Przeprowadza rekonesans OSINT domeny/hosta z weryfikacją tarczy Anti-SSRF. |
| 26 | **`execute_web_search`** | `query: string`, `maxResults?: number` | Wyszukuje informacje w zewnętrznych źródłach wiedzy. |
| 27 | **`read_project_file`** | `filePath: string` | Bezpieczny odczyt pliku projektu w sandboksie deweloperskim. |
| 28 | **`scan_project_directory`** | `dirPath?: string`, `depth?: number` | Rekurencyjne mapowanie struktury katalogów i modułów projektu. |
| 29 | **`get_traffic_alerts`** | `region?: string` | Pobiera aktualne zdarzenia drogowe i stan tras DK22/A1. |

---

## 4. GŁÓWNE ENDPOINTY REST API GATEWAY (PORT 5000)

Wszystkie żądania chronione są nagłówkiem `Authorization: Bearer <TOKEN>`:

* **Powiadomienia Mobilne (Pushbullet):**
  - `POST /api/pushbullet/send` — natychmiastowa wysyłka powiadomienia z walidacją Zod
  - `POST /api/pushbullet/test` — weryfikacja poprawności tokenu API
  - `GET /api/pushbullet/history` — lista ostatnich powiadomień
  - `POST /api/pushbullet/webhook` — publiczny punkt wejścia webhooków (zabezpieczony w authMiddleware)
* **Szkolne (Librus Synergia):**
  - `GET /api/timetable?day=2` — plan zajęć dla wybranego dnia
  - `GET /api/grades` — 16 zsynchronizowanych ocen i średnia ważona
  - `GET /api/events` — terminarz sprawdzianów i kartkówek
* **Zadania & To-Do:**
  - `GET /api/tasks` — lista wszystkich zadań
  - `POST /api/tasks` — dodanie nowego zadania
  - `PATCH /api/tasks/:id` — zmiana statusu lub priorytetu
  - `DELETE /api/tasks/:id` — usunięcie zadania
* **Finanse 50/30/20:**
  - `GET /api/finance/transactions` — historia transakcji
  - `POST /api/finance/transactions` — rejestracja wydatku
  - `DELETE /api/finance/transactions/:id` — wycofanie transakcji
  - `POST /api/finance/transfer` — przesunięcie środków między kopertami
* **Kalistenika & Nawyki:**
  - `GET /api/workouts/exercises` — lista ćwiczeń FBW i ukończonych serii
  - `POST /api/workouts/exercises/:id/complete-set` — inkrementacja serii z rozgłoszeniem
  - `GET /api/habits` — codzienne nawyki i passy (streaks)
* **Pamięć i FinOps (Lab-Zero):**
  - `GET /api/memory/facts` — lista faktów w pamięci podręcznej
  - `POST /api/memory/recall` — semantic vector search z rankingiem cosinusowym
  - `GET /api/system/finops` — raport zużycia tokenów, kosztów PLN i coverage gaps
* **Brama AI & MCP:**
  - `POST /api/ai/chat` — inteligentne wnioskowanie z tool callingiem i fallbackiem
  - `GET /api/mcp/tools` — lista zarejestrowanych narzędzi MCP (29 narzędzi)
  - `POST /api/mcp/call` — deterministyczne wywołanie narzędzia MCP

---

## 5. AUDYT JAKOŚCI KODU I WERYFIKACJA REGRESYJNA

* **API Gateway Vitest:** 64 passed (10 plików testowych, w tym 16 testów MCP i 5 testów Pushbullet).
* **Worker Vitest:** 8 passed (3 pliki testowe, w tym testy LogDrain i Dispatchera).
* **Frontend Web Build:** 0 błędów TypeScript (`tsc && vite build` — 100% GREEN).
* **Senior Code Reviewer (Groq openai/gpt-oss-120b):** `[+] SUCCESS :: KOD ZWERYFIKOWANY - BRAK UWAG`.
