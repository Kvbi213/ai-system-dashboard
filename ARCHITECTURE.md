# ARCHITECTURE.md — REJESTR ARCHITEKTURY OMNIDASH REBORN
> Dokument nadrzędny architektury systemu OmniDash Reborn.
> Standard: Protokół Antigravity v4.0 (Deterministic Edition).
> Status: AKTYWNY (v4.0.0-rc.6) | Monorepo: `pnpm workspaces`

---

## 1. STATUS SYSTEMU I METRYKI WYDANIA

- **Wersja:** `v4.0.0-rc.11`
- **Typ Architektury:** Domain-Driven Modular Monolith w kontenerach Docker Compose
- **Standard Jakości:** 100% TypeScript (`strict: true`, zero `any`), Zero-Placeholder Policy
- **Środowisko:** Node.js 22 LTS, Vite 6, React 19, TailwindCSS v4, Vitest, Playwright 1.50
- **Metryki Testowe:** 163 passed (54 Playwright E2E + 109 API Vitest + 8 Worker Vitest, 100% green)
- **Warstwa Pamięci Podręcznej:** Redis 7 Alpine (`omnidash-redis`) z resilientnym in-memory fallbackiem TTL
- **Dostępne Porty Usług:**
  - `3000`: Frontend SPA (`apps/web` Vite Dev / Nginx Alpine)
  - `5000`: API Gateway (`apps/api` Express TS Zero-Trust)
  - `4173`: Playwright UI Runner (`apps/web` E2E Visual Inspector)
  - `5432`: PostgreSQL 16 Alpine (`omnidash-db`)
  - `6379`: Redis 7 Alpine (`omnidash-redis`)

---

## 2. DRZEWO MONOREPO (TOPOLOGIA STRUKTURALNA)

```
$PROJECT_ROOT/OmniDash/
├── docker-compose.yml              # Multi-container orchestration (web, api, worker, db, redis)
├── pnpm-workspace.yaml             # Definicja obszarów roboczych pnpm
├── package.json                    # Skrypty globalne monorepo
├── tsconfig.base.json              # Wspólna konfiguracja kompilatora TypeScript
├── ZASADYPRACY.md                  # Konstytucja operacyjna systemu
├── ARCHITECTURE.md                 # Niniejszy rejestr architektury i komponentów
├── HISTORY.md                      # Chronologiczny rejestr wydań SemVer 2.0.0
│
├── apps/
│   ├── web/                        # [SPA Frontend] React 19, Tailwind v4, Liquid Glass
│   │   ├── Dockerfile              # Multi-stage Nginx Alpine build
│   │   ├── playwright.config.ts    # Konfiguracja audytu E2E (Desktop Chromium & Mobile Pixel 7)
│   │   ├── tests/                  # Zestaw 46 testów Playwright E2E
│   │   │   ├── chat-viewport-isolation.spec.ts
│   │   │   ├── full-gui-audit.spec.ts
│   │   │   ├── ruler-wheel-and-timetable.spec.ts
│   │   │   ├── finops-threats-prediction.spec.ts
│   │   │   └── theme-dark-mode.spec.ts
│   │   └── src/
│   │       ├── api/client.ts       # Type-safe API Client z offline fallbackiem
│   │       ├── components/         # Współdzielone prymitywy UI i nawigacji
│   │       │   ├── ui/             # GlassCard, Badge, SubTabBar, PageHeader, Toast, HumanCheckpointModal, RulerWheelPicker
│   │       │   └── navigation/     # Sidebar (zwijane kategorie), BottomTabBar, AppHeader, MoreDrawerSheet
│   │       └── modules/            # Zdecentralizowane moduły domenowe (≤150 linii per plik)
│   │           ├── dashboard/      # Pulpit operacyjny, widżety, drawer zadań, DailyTimelineWidget
│   │           ├── chat/           # Asystent AI, strumieniowanie SSE, kasetki narzędziowe
│   │           ├── school/         # Hub edukacyjny (plan 1:1 Librus, oceny, frekwencja, egzaminy)
│   │           ├── timetable/      # Dedykowany plan lekcji z wyborem dnia (pełna zgodność Synergia)
│   │           ├── grades/         # LibrusTableView (tabela 1:1 Synergia), SubjectGradesGrid, GradeStatsSummary, fallbackData
│   │           ├── finance/        # Budżet 50/30/20, BudgetPredictionCard z Write-Back, abonamenty, cele
│   │           ├── workouts/       # Trening FBW (AtticFBWTracker), RestTimerOverlay (OLED True Black), rekordy osobiste PR
│   │           ├── private/        # Strefa Prywatna: Nawyki i rutyny dobowe (DailyHabitStreaks, PrivateRoutinesCard), cele, dziennik
│   │           ├── traffic/        # Kamery GDDKiA, radary CANARD, alerty drogowe
│   │           ├── osint/          # Inspekcja domen, ThreatMonitoringTimeline (SSRF Shield), certyfikaty SSL
│   │           ├── server/         # Telemetria kontenerów Docker, węzeł Mikr.us LXC, kopia zapasowa
│   │           └── settings/       # FinOpsAndMemoryCard (ai-cost-dashboard & Lab-Zero recall), Kernel, Motyw
│   │
│   ├── api/                        # [API Gateway] Port 5000, Zero-Trust, Drizzle Store
│   │   └── src/
│   │       ├── domains/
│   │       │   ├── memory/         # Lab-Zero Semantic Recall Engine (128-dim dense embedding)
│   │       │   ├── system/         # FinOpsCollector (kolektor tokenów AI & TTS, detektor coverage gaps)
│   │       │   └── ...             # Domeny biznesowe (school, finance, workouts, traffic, osint)
│   │
│   └── worker/                     # [Background Worker] Daemon zadań w tle i synchronizacji
│       └── src/
│           ├── cron/               # SystemScheduler z synchronizacją czasu autorytatywnego co 1 min
│           └── pushbullet/         # Deterministyczny PushbulletDispatcher (kolejka priorytetyzowana, rate-limiter)
```
│   │   ├── Dockerfile              # Node 22 Alpine production container
│   │   ├── src/
│   │   │   ├── index.ts            # Entrypoint serwera Express TS
│   │   │   ├── core/
│   │   │   │   ├── corsConfig.ts   # Ścisła biała lista CORS (zero wildcard '*')
│   │   │   │   ├── security.ts     # Nagłówki Helmet i audyt bezpieczeństwa
│   │   │   │   ├── authMiddleware.ts # Zero-Trust Bearer / Dev-Bypass guard
│   │   │   │   └── redisCache.ts   # Resilientny bufor Redis (SCAN iteration, key sanitization, in-memory TTL failover, auto-reconnect)
│   │   │   ├── db/
│   │   │   │   └── store.ts        # Relacyjny store Drizzle-ready z izolacją tenanta (userId)
│   │   │   └── domains/            # Modularne routery domenowe
│   │   │       ├── auth/           # /api/auth
│   │   │       ├── system/         # /api/system (health, status, export)
│   │   │       ├── tasks/          # /api/tasks (CRUD zadań wykonawczych)
│   │   │       ├── finance/        # /api/finance (50/30/20, transakcje)
│   │   │       ├── workouts/       # /api/workouts (ćwiczenia, nawyki, serie)
│   │   │       ├── traffic/        # /api/traffic (kamery, CANARD, alerty)
│   │   │       ├── school/         # /api/school (plan, oceny, librusHtmlScraper, librusSyncService, /sync)
│   │   │       ├── news/           # /api/news (ticker IT/CERT)
│   │   │       ├── ai/             # /api/ai (SSE chat reasoning, tool calling)
│   │   │       ├── osint/          # /api/osint (DNS, ASN, SSL inspect)
│   │   │       └── pushbullet/     # /api/pushbullet (webhooki i powiadomienia)
│   │   └── tests/                  # Zestaw 16 testów jednostkowych Vitest (100% passed)
│   │
│   └── worker/                     # [Background Daemon] Procesy asynchroniczne i zadania cron
│       ├── Dockerfile              # Node 22 Alpine worker container
│       ├── src/
│       │   ├── index.ts            # Daemon lifecycle manager
│       │   ├── pushbullet/
│       │   │   ├── listener.ts     # Klient WebSocket ze 60s oknem deduplikacji i backoffem
│       │   │   └── classifier.ts   # Klasyfikator SMS bankowych (50/30/20) i alertów szkolnych
│       │   └── cron/
│       │       └── scheduler.ts    # Zadania cykliczne (synchronizacja danych i reset streaków)
│       └── tests/                  # Zestaw 3 testów jednostkowych Vitest (100% passed)
│
└── packages/
    └── contracts/                  # [Współdzielone Kontrakty] Schematy Zod i typy TS
        └── src/index.ts            # Zod schemas: Task, Transaction, Habit, Lesson, Grade
```

---

## 3. TABELA KOMPONENTÓW I ZALEŻNOŚCI

| Warstwa / Moduł | Ścieżka | Rola Architektoniczna | Zależności Zewnętrzne |
|---|---|---|---|
| **Frontend Web** | `apps/web/` | Interfejs użytkownika Apple Liquid Glass | React 19, Tailwind v4, Lucide, Framer Motion |
| **API Gateway** | `apps/api/` | Brama API, autoryzacja Zero-Trust, REST/SSE | Express TS, Helmet, CORS, Drizzle ORM |
| **Worker Daemon** | `apps/worker/` | Procesy asynchroniczne w tle, parser SMS | WebSocket (`ws`), Vitest |
| **Shared Contracts** | `packages/contracts/` | Pojedyncze źródło prawdy dla kontraktów API | Zod, TypeScript |
| **Baza Relacyjna** | `apps/api/src/db/` | Magazyn danych z izolacją tenanta (`userId`) | PostgreSQL 16 / SQLite WAL |
| **Kolejka / Cache** | `omnidash-redis` | Pamięć podręczna i rate limiting | Redis 7 Alpine |

---

## 4. STANDARDY ZERO-TRUST I BEZPIECZEŃSTWA

1. **CORS Whitelist:** Wyłącznie jawnie zdefiniowane pochodzenia (`http://localhost:3000`, `http://127.0.0.1:3000`, domen produkcyjnych). Całkowity zakaz `Access-Control-Allow-Origin: *`.
2. **Zero-Client Secrets:** Żadne tokeny API ani klucze integracyjne nie opuszczają środowiska serwerowego backendu (`apps/api` / `apps/worker`).
3. **Tenant Isolation:** Każdy rekord w bazie danych posiada przypisanie do `userId` (`operator-system-core`). Zapytania zawsze filtrują stan po tożsamości użytkownika.
4. **Izolacja Kontenerowa:** Każda usługa kompilowana i uruchamiana w dedykowanym, odizolowanym kontenerze Docker jako użytkownik nieuprzywilejowany (`USER appuser`).

---

## 5. REJESTR DŁUGU TECHNICZNEGO I ZADAŃ KOLEJNYCH

- **Status Długu:** 0 placeholderów `// TODO`, 0 typów `any`, 100% zielonych testów jednostkowych i E2E.
- **Kolejne Zadania:**
  - Rozszerzenie parsera Librus o sesję Synergia z automatycznym odnawianiem ciasteczek w `apps/worker`.
  - Integracja Web Speech API (TTS) w oknie dialogowym czatu AI.
  - Wdrożenie fizycznej synchronizacji bazy wiedzy Obsidian przez lokalny skrypt filesystemowy.
