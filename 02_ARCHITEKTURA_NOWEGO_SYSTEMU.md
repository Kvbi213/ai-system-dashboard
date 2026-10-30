# 02. ARCHITEKTURA NOWEGO SYSTEMU (OMNIDASH REBORN v4.0.0)
> Projekt: OmniDash Reborn  
> Standard wykonania: Protokół Antigravity v4.0 (Deterministic Edition)  
> Paradygmat: Domain-Driven Modular Monolith w strukturze Monorepo  

---

## 1. STRUKTURA KATALOGÓW I PODZIAŁ ODPOWIEDZIALNOŚCI

W celu wyeliminowania rozproszenia kodu i problemu "Split-Brain", nowy system jest zorganizowany jako nowoczesne Monorepo (pnpm workspaces / Turborepo) o ścisłym podziale na aplikacje i współdzielone pakiety:

```
C:\Users\Jakub Lis\Desktop\01_PROJEKTY\OmniDash/
│
├── .github/                      ← Potoki CI/CD (GitHub Actions, lint, test, docker build)
│   └── workflows/
│       ├── test.yml              ← Automatyczne testy jednostkowe i integracyjne (Vitest)
│       └── docker.yml            ← Weryfikacja budowania obrazów kontenerów
│
├── apps/
│   ├── web/                      ← [FRONTEND GUI] Nowoczesny interfejs użytkownika
│   │   ├── src/
│   │   │   ├── app/              ← Routing stron (Next.js App Router lub TanStack Router)
│   │   │   ├── components/       ← Reużywalne klocki UI w stylu Apple Glassmorphism
│   │   │   │   ├── ui/           ← Primitivy Shadcn/Radix (Button, Dialog, Drawer, Badge)
│   │   │   │   ├── modules/      ← Dedykowane widoki kart i szuflad (Dashboard, Chat, Grades)
│   │   │   │   └── navigation/   ← Sidebar, AppHeader, CommandPalette
│   │   │   ├── stores/           ← Zarządzanie stanem globalnym klienta (Zustand)
│   │   │   ├── hooks/            ← Hooki pobierania danych (TanStack Query v5) i SSE
│   │   │   └── styles/           ← Tokeny stylów (TailwindCSS v4, CSS Variables, Theme tokens)
│   │   ├── package.json
│   │   └── Dockerfile.web
│   │
│   ├── api/                      ← [BACKEND HTTP & SSE] Główny serwer API i logiki domenowej
│   │   ├── src/
│   │   │   ├── core/             ← Inicjalizacja serwera, bazy danych, middleware, CORS, rate-limit
│   │   │   ├── domains/          ← Czysta architektura domenowa (Domain-Driven Design)
│   │   │   │   ├── ai/           ← Silnik agenta (Worker, Mentor, Harvey), sandbox narzędzi, Groq SDK
│   │   │   │   ├── librus/       ← Scraper Synergii, normalizacja ocen, plan lekcji, zastępstwa
│   │   │   │   ├── finance/      ← Silnik 50/30/20, koperty, importy/eksporty CSV, Pushbullet
│   │   │   │   ├── entities/     ← Drzewo podmiotów, 10 kart profilu, relacje sieciowe, ASCII, Obsidian
│   │   │   │   ├── osint/        ← Rozpoznanie domen, IP, WHOIS, DNS-over-HTTPS, tarcza anty-SSRF
│   │   │   │   ├── traffic/      ← Geolokalizacja GPS, radary CANARD/GITD, alerty GDDKiA, routing
│   │   │   │   ├── voice/        ← Silnik mowy (Fish Audio, Edge TTS, ElevenLabs, Whisper STT)
│   │   │   │   ├── workouts/     ← Plan dnia, sesje FBW na strychu, steppery i timery
│   │   │   │   ├── gcp/          ← Odbiór powiadomień Pub/Sub, nadzór budżetowy i circuit breaker
│   │   │   │   └── system/       ← Telemetria sprzętowa (CPU, RAM, Uptime), strumień SSE
│   │   │   ├── db/               ← Definicje schematów, migracje, repozytoria danych (Drizzle ORM)
│   │   │   └── index.ts          ← Główny punkt startowy aplikacji serwerowej
│   │   ├── package.json
│   │   └── Dockerfile.api
│   │
│   └── worker/                   ← [DAEMON WORKER] Procesy tła i zadania cykliczne
│       ├── src/
│       │   ├── pushbullet/       ← Ciągły nasłuch WebSocketu Pushbullet (wss://stream.pushbullet.com)
│       │   ├── scheduler/        ← Harmonogram cron (synchronizacja Librusa co 2h, podsumowania AI)
│       │   └── sync/             ← Replika danych do Google Cloud Firestore (region Warszawa)
│       ├── package.json
│       └── Dockerfile.worker
│
├── packages/
│   ├── contracts/                ← [SHARED TYPES] Schematy Zod i typy TypeScript (Frontend & Backend)
│   │   ├── src/
│   │   │   ├── ai.schema.ts      ← Kontrakty wiadomości czatu, narzędzi i odpowiedzi JSON
│   │   │   ├── librus.schema.ts  ← Kontrakty ocen, wag, planu lekcji i terminarza
│   │   │   ├── finance.schema.ts ← Kontrakty transakcji, koszyków 50/30/20 i powiadomień bankowych
│   │   │   ├── entities.schema.ts← Kontrakty 10 domen podmiotów, relacji grafowych i drzewa
│   │   │   └── system.schema.ts  ← Kontrakty metryk telemetrii, konfiguracji i motywów
│   │   └── package.json
│   │
│   └── shared-utils/             ← [SHARED UTILS] Czyste funkcje matematyczne i normalizacyjne
│       ├── src/
│       │   ├── budgetMath.ts     ← Matematyka podziału 50/30/20 i transferów między kopertami
│       │   ├── gradeMath.ts      ← Matematyka średnich ważonych z uwzględnieniem wag 0 i modyfikatorów
│       │   └── timeUtils.ts      ← Obsługa strefy Europe/Warsaw i precyzyjnych timestampów
│       └── package.json
│
├── docker-compose.yml            ← Główny manifest orkiestracji wielokontenerowej
├── docker-compose.dev.yml        ← Konfiguracja developerska z montowaniem wolumenów w locie
├── .env.example                  ← Wzorzec bezpiecznych zmiennych środowiskowych
├── ZASADYPRACY.md                ← Nadrzędny Rygor Operacyjny Protokołu Antigravity
├── ARCHITECTURE.md               ← Rejestr architektury systemu
└── HISTORY.md                    ← Niemutowalny rejestr wersji SemVer
```

---

## 2. WYBÓR STOSU TECHNOLOGICZNEGO DLA GUI I PORÓWNANIE JĘZYKÓW

Operator zażądał: *"lepszy język do gui oraz gui od zera"*. Przeprowadzono inżynieryjną analizę trzech alternatywnych podejść:

### Podejście A: Next.js 15 (React 19 + TypeScript) + TailwindCSS v4 + Shadcn/Radix + Framer Motion (Rekomendowane)
- **Charakterystyka:** Najbardziej dojrzały ekosystem dla aplikacji klasy Enterprise z obsługą Server Components (błyskawiczne pierwsze ładowanie) oraz Client Components dla interaktywnych elementów (slide-over drawers, terminale).
- **Zalety:**
  - 100% zgodności ze sprawdzonymi bibliotekami ekosystemu (Lucide Icons, Framer Motion dla fizyki Apple Spring).
  - Pełne, ścisłe typowanie TypeScript (`strict: true`) od warstwy pobierania danych do komponentów UI.
  - Łatwa separacja SSR od interaktywnych widżetów.
  - Gotowa baza dostępnych, przetestowanych komponentów (Radix UI / Shadcn UI) eliminująca konieczność ręcznego pisania obsługi klawiatury i focusu.
- **Wady:** Większy rozmiar bundla w porównaniu do Svelte, zależność od środowiska Node.js (rozwiązana przez kontener Docker).

### Podejście B: SvelteKit 2 (Svelte 5 Runes + TypeScript) + TailwindCSS
- **Charakterystyka:** Architektura oparta na kompilatorze bez wirtualnego DOM (Virtual DOM-less). Zmienne reaktywne definiowane przez nowe "Runes" (`$state`, `$derived`, `$effect`).
- **Zalety:**
  - Ekstremalnie mały bundle wyjściowy (kilkukrotnie mniejszy niż React).
  - Płynność renderowania bez narzutu wirtualnego drzewa DOM.
  - Wbudowane przejścia i animacje w silniku Svelte.
- **Wady:** Konieczność przepisania od zera całej składni JSX na szablony Svelte oraz mniejsza liczba gotowych komponentów typu Apple Glass Drawers.

### Podejście C: Vite + React 19 + TypeScript + Zustand + TanStack Query (Czysty SPA Client)
- **Charakterystyka:** Lekki klient statyczny serwowany bezpośrednio przez Nginx w kontenerze Docker, komunikujący się wyłącznie przez API HTTP i SSE.
- **Zalety:**
  - Najprostszy model wdrożeniowy (kontener Nginx zajmuje <30 MB RAM).
  - Brak serwera Node.js po stronie frontendu — pełna separacja od backendu.
  - Wykorzystanie Zustand do czystego stanu bez zbędnego boilerplate'u.
- **Wady:** Wymaga starannego zarządzania optymalizacją pierwszego renderowania.

> **Rekomendacja Inżynieryjna:** **Podejście A (Next.js 15 / React 19 + TypeScript) lub Podejście C (Vite + React 19 + TypeScript)**. Pozwala to na natychmiastowe przeniesienie 15 domen funkcjonalnych z zachowaniem 100% logiki matematycznej i biznesowej, przy jednoczesnym osiągnięciu pełnego bezpieczeństwa typów i nowoczesnego interfejsu Apple-Glass.

---

## 3. ARCHITEKTURA BACKENDU (API & WORKER)

Backend zostaje podzielony na dwa wyspecjalizowane procesy:

### 1. `apps/api` (Serwer HTTP / SSE)
- **Technologia:** Node.js 22 LTS + Fastify (lub Express w TypeScript). Fastify zapewnia 3-krotnie wyższą przepustowość zapytań i natywną walidację schematów JSON.
- **Zarządzanie Połączeniami:**
  - `/api/system/stream`: Czysty strumień Server-Sent Events z natywnym buforowaniem i automatycznym reconnection.
  - `/api/agent/stream`: Strumieniowanie tokenów odpowiedzi LLM (Server-Sent Events) z równoległym raportowaniem postępu wywołań narzędzi (Tool Calling Events).
- **Bezpieczeństwo (Zero-Trust):**
  - Wszystkie żądania walidowane przed wejściem do kontrolera za pomocą schematów Zod (`packages/contracts`).
  - Restrykcyjny CORS i ochrona nagłówków przez Helmet.
  - Całkowity brak ekspozycji kluczy API do klienta.

### 2. `apps/worker` (Proces Zadań Tła)
- **Technologia:** Dedykowany proces TypeScript uruchamiany w osobnym kontenerze `omnidash-worker`.
- **Zadania Ciągłe i Cykliczne:**
  - **Pushbullet WebSocket Listener:** Stałe, nieblokujące połączenie z `wss://stream.pushbullet.com`, automatyczny re-connect z exponential backoff, deduplikacja w oknie 60s i natychmiastowa kategoryzacja wydatków 50/30/20.
  - **Librus Synchronizer:** Cykliczne odpytywanie serwerów Synergii co 2 godziny o oceny, szczęśliwy numerek i plan lekcji na kolejny dzień.
  - **Firestore Replicator:** Bezpieczna, asynchroniczna replikacja zaktualizowanych rekordów do Cloud Firestore w regionie Warszawa, gwarantująca dostępność danych offline na urządzeniach mobilnych operatora.

---

## 4. WARSTWA DANYCH I ORM (DRIZZLE ORM)

W wersji Legacy baza SQLite była odpytywana bezpośrednio przez surowe zapytania SQL w tekście (`modules/database.js`). W wersji v4.0.0 wprowadzono **Drizzle ORM**:
- **Zalety Drizzle:**
  - Zero narzutu wydajnościowego (Zero Overhead).
  - Automatyczne generowanie typów TypeScript z definicji tabel.
  - Gotowość do bezproblemowego przełączenia pomiędzy **SQLite WAL** (dla środowisk domowych/lekkich) a **PostgreSQL** (dla pełnych wdrożeń produkcyjnych 24/7) poprzez zmianę jednego sterownika dialektu.
- **Struktura Schematu Bazy Danych:**
  - `tasks`: zadania, priorytety, reguły powtarzalności.
  - `budget_envelopes` i `financial_transactions`: koszyki 50/30/20, transfery, powiadomienia Pushbullet.
  - `librus_grades`, `librus_timetable`, `librus_events`: buforowane dane szkolne z pełnymi metadanymi.
  - `entities` i `entity_relations`: podmioty z indeksem na `tree_path` oraz krawędzie grafu relacji.
  - `system_logs` i `gcp_budget_logs`: rejestr zdarzeń i telemetrii.
