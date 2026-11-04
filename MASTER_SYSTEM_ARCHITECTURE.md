# MASTER_SYSTEM_ARCHITECTURE.md — MASTER SYSTEM SPECIFICATION
> **OmniDash Reborn v4.0.0 (Core & Edge Operating System)**  
> **Status:** PRODUKCYJNY / ZWERYFIKOWANY EMPIRYCZNIE (100% GREEN)  
> **Standard:** Protokół Antigravity v4.0 (Deterministic Edition)  
> **Data kompilacji raportu:** 2026-11-04  

---

## 1. WPROWADZENIE I TOPOLOGIA EKOSYSTEMU

OmniDash Reborn v4.0.0 to modularna, wysokowydajna platforma operacyjna dla jednego użytkownika (personal executive environment), integrująca asystenta AI, edukację (Librus Synergia), finanse (50/30/20), logistykę miejską (kamery GDDKiA, radary CANARD), kalistenikę (FBW) oraz telemetrię infrastruktury w standardzie **Apple Liquid Glass** i architekturze **Zero-Trust**.

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
                                       |  - Internal MCP Server           |        |  Groq / Gemini / OpenAI  |
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
* **`src/middleware/authMiddleware.ts`** — filtr Zero-Trust weryfikujący nagłówek `Authorization: Bearer <TOKEN>` (obsługa dev-tokenów i tokenów sesji).
* **`src/db/store.ts`** — silnik bazy danych in-memory z pełnym pokryciem encji, sortowaniem i bezpiecznym fallbackiem Zod.
* **`src/db/seedData.ts`** — autorytatywny zbiór danych wzorcowych: 35 lekcji tygodniowych 1:1 z Librus Synergia, 16 ocen szkolnych, transakcje finansowe, fotoradary CANARD, rutyny i ćwiczenia FBW.
* **`src/domains/ai/llmGateway.ts`** — brama wielomodelowa: Groq (`llama-3.3-70b-versatile`) -> Gemini 2.0 Flash -> OpenAI (`gpt-4o-mini`) -> Deterministic Local Core z bezpiecznym wrapperem `withTimeout`.
* **`src/domains/ai/iterationBudget.ts`** — ogranicznik pętli i budżetu tokenów zapobiegający pętlom nieskończonym agentów (`maxLoops`, `maxTokens`, `timeoutMs`).
* **`src/domains/ai/router.ts`** — endpointy `/api/ai/chat` (z obsługą tool calls) oraz `/api/ai/stream` (SSE).
* **`src/domains/memory/semanticRecall.ts`** — lokalny offline silnik wektorowy Lab-Zero (128-wymiarowe n-gramowe embeddingi gęste z rankingiem cosinusowym `<30ms`).
* **`src/domains/system/finopsCollector.ts`** — telemetria kosztowa FinOps śledząca zużycie tokenów i znaków TTS z wykrywaniem przerw w danych (*Coverage Gaps*).
* **`src/domains/rules/ruleEngine.ts`** & **`router.ts`** — deklaratywny silnik reguł automatyzacji wzorowany na `keephq/keep` montowany pod `/api/rules`.
* **`src/mcp/internalMcpServer.ts`** — serwer MCP udostępniający 7 narzędzi operacyjnych pod `/api/mcp/tools` i `/api/mcp/call`.

### C. `apps/worker/` — Asynchroniczny Kontener Roboczy
* **`src/index.ts`** — inicjalizacja daemona roboczego, synchronizacja zegara systemowego z API Gateway.
* **`src/pushbullet/dispatcher.ts`** — priorytetyzowany dispatcher powiadomień push (`CRITICAL` > `NORMAL` > `LOW`) z token-bucket rate limiterem (max 12 pushy/min) i kolejką FIFO.
* **`src/scheduler/systemScheduler.ts`** — cykliczny harmonogram zadań cron (odpytywanie Librusa, radary CANARD, telemetria serwerowa).
* **`src/telemetry/logDrain.ts`** — silnik klastrowania logów online (algorytm Drain) redukujący redundancję logów o >95%.

### D. `apps/web/` — Frontend SPA (React 19 + Vite 6 + Tailwind v4) (Port 3000)
* **`src/App.tsx`** — główny router SPA z obsługą motywów Dark/Light i wstrzykiwaniem toastów.
* **`src/components/ui/GlassCard.tsx`** — prymityw Apple Liquid Glass (`bg-slate-950/85 backdrop-blur-2xl border-white/10`).
* **`src/components/ui/RulerWheelPicker.tsx`** — interaktywny suwak/bęben 3D z perspektywą cylindryczną, fizyką momentum scroll, Web Audio i wibracjami haptycznymi.
* **`src/components/ui/HumanCheckpointModal.tsx`** — modal autoryzacji operacji krytycznych z 3-sekundowym countdownem bezpieczeństwa.
* **`src/modules/dashboard/page.tsx`** — Pulpit Główny: wskaźniki KPI, trwający blok zajęć, radar DK22/A1, Oś Czasu Dnia.
* **`src/modules/workouts/page.tsx`** & **`components/RestTimerOverlay.tsx`** — kalistenika FBW na strychu, licznik przerw między seriami, reaktywny hook `useWorkoutState.ts`.
* **`src/modules/school/page.tsx`** — moduł szkolny: pełny tydzień planu zajęć Librus, oceny, frekwencja, terminarz.
* **`src/modules/finance/page.tsx`** — finanse 50/30/20, predykcja budżetu z write-backiem, koperty, subskrypcje.
* **`src/modules/osint/page.tsx`** — analiza IP, DNS, ASN, certyfikatów SSL oraz tarcza anty-SSRF.
* **`src/modules/settings/page.tsx`** — konfiguracja kernelu, widżet FinOps i Semantic Memory Recall.

---

## 3. PEŁNY SPIS NARZĘDZI MCP (INTERNAL MCP SERVER TOOLS)

Serwer MCP udostępnia standardowy protokół narzędziowy pod adresem `POST /api/mcp/call`:

| Nazwa Narzędzia (`name`) | Parametry Wejściowe | Opis Działania | Format Wyjściowy |
|---|---|---|---|
| **`get_current_lesson_status`** | `day?: number`, `currentTime?: string` (np. `"11:45"`) | Wylicza bieżący status: trwającą lekcję, czas do dzwonka, długość przerwy i dane kolejnej lekcji. | `{ isBreak: boolean, currentLesson: {...}, breakInfo: {...}, nextLesson: {...}, statusSummary: string }` |
| **`schedule_lesson_transition_alert`** | `minutesBeforeEnd?: number`, `lessonIndex?: number`, `customNote?: string` | Planuje powiadomienie Pushbullet / alert asystenta na koniec lekcji z informacją o sali i kolejnym bloku. | `{ success: boolean, scheduledForLesson: string, fireAtTime: string, notificationPreview: string, payload: {...} }` |
| **`save_student_directive`** | `directive: string` *(wymagane)*, `tags?: string` | Zapisuje stałą preferencję/dyrektywę ucznia bezpośrednio do bazy Lab-Zero z generowaniem wektora cech. | `{ success: boolean, directiveId: string, category: "SCHOOL", totalMemoryFacts: number }` |
| **`get_system_metrics`** | *brak* | Zwraca telemetrię zasobów serwera w standardzie Beszel (RAM, CPU, Uptime, Load Avg). | `{ status: "HEALTHY", memory: { totalMb, usedMb, percent }, cpus, uptimeSeconds }` |
| **`query_timetable`** | `day: number` *(wymagane: 1-5)* | Zwraca zsynchronizowany plan zajęć Librus Synergia dla zadanego dnia roboczego. | `{ day: number, count: number, lessons: Array<{ order, time, subject, teacher, classroom }> }` |
| **`get_active_alerts`** | *brak* | Zwraca aktywne ostrzeżenia drogowe CANARD, fotoradary i zdarzenia tranzytowe. | `{ canardRadarsCount, trafficCamerasCount, hazards: [...] }` |
| **`trigger_workout_sync`** | `cycle?: string` | Pobiera i synchronizuje stan postępu serii kalisteniki FBW z magazynem danych. | `{ cycle: string, completedSets: number, totalSets: number, isFinished: boolean }` |

---

## 4. GŁÓWNE ENDPOINTY REST API GATEWAY (PORT 5000)

Wszystkie żądania chronione są nagłówkiem `Authorization: Bearer <TOKEN>`:

* **Szkolne (Librus Synergia):**
  - `GET /api/timetable?day=2` — plan zajęć dla wybranego dnia
  - `GET /api/grades` — 16 zsynchronizowanych ocen i średnia ważona
  - `GET /api/events` — terminarz sprawdzianów i kartkówek
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
  - `GET /api/mcp/tools` — lista zarejestrowanych narzędzi MCP
  - `POST /api/mcp/call` — deterministyczne wywołanie narzędzia MCP

---

## 5. AUDYT JAKOŚCI KODU I WERYFIKACJA REGRESYJNA

* **Playwright E2E:** 46 passed na Desktop Chromium i Mobile Pixel 7 (2 skipped warunkowo).
* **API Gateway Vitest:** 52 passed (w tym 9 testów dedykowanych MCP).
* **Worker Vitest:** 8 passed (w tym testy LogDrain i Dispatchera).
* **Łącznie testów jednostkowych i E2E:** **106 testów na zielono.**
* **Senior Code Reviewer (Groq openai/gpt-oss-120b):** `[+] SUCCESS :: KOD ZWERYFIKOWANY - BRAK UWAG`.
