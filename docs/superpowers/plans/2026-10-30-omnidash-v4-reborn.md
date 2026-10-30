# [OmniDash Reborn v4.0.0] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kompletna rekonstrukcja i przepisanie od zera systemu OmniDash do nowoczesnego, w pełni typowanego monorepo (TypeScript 5.6+) opartego na architekturze kontenerowej Docker Compose, ścisłym bezpieczeństwie Zero-Trust (eliminacja wieloznaczników `*`, integracja z Google Cloud Auth, Drizzle ORM z Row-Level Security, ochrona SSRF i Rate Limiting) oraz nowoczesnym, w 100% responsywnym interfejsie użytkownika w stylu Apple-Glass dla smartfonów, tabletów i laptopów, z zachowaniem wszystkich dotychczasowych funkcji i modułów domenowych.

**Architecture:** Domain-Driven Modular Monolith zorganizowany w monorepo (pnpm workspaces): frontend SPA (`apps/web`) serwowany przez Nginx z modułem `ngx_http_realip_module`, serwer API (`apps/api`) w Fastify/Express TS ze strumieniowaniem tokenów SSE i sandboxem narzędzi AI, daemon procesów tła (`apps/worker`) dla WebSocketu Pushbullet i harmonogramu Librusa, relacyjna baza PostgreSQL 16 (lub SQLite WAL w wolumenie) z Drizzle ORM oraz współdzielone kontrakty walidacji Zod (`packages/contracts`).

**Tech Stack:** TypeScript 5.6+, Node.js 22 LTS, Fastify/Express TS, React 19, TailwindCSS v4, Shadcn/Radix UI Primitives, Framer Motion, Google Cloud Identity / Firebase Auth SDK, Drizzle ORM, PostgreSQL 16 Alpine, Redis 7 Alpine, Docker & Docker Compose, Vitest.

**Spec:** `02_ARCHITEKTURA_NOWEGO_SYSTEMU.md`, `SECURITY_AUDIT_VIBE_HARDENING.md` oraz `06_DEKOMPOZYCJA_STRON_I_ERGONOMIA_MOBILNA.md`

## Global Constraints

- 100% TypeScript w całym repozytorium (`strict: true`, bezwzględny zakaz typu `any`).
- Całkowita eliminacja wieloznaczników `*` w regułach CORS (`Access-Control-Allow-Origin: *` zabronione; wyłącznie jawna biała lista domen) oraz w regułach autoryzacji bazodanowej.
- Całkowity zakaz placeholderów (`// TODO`, `/* implement later */`, `# reszta bez zmian`, pustych bloków funkcji).
- Zero-Emoji Policy: w kodzie źródłowym, logach, GUI i dokumentacji dozwolone wyłącznie inżynieryjne znaczniki tekstowe `[*]`, `[!]`, `[+]`, `[-]`, `[>]`, `[~]`, `[OK]`, `[X]`, `[ALERT]`.
- Wszystkie klucze API i poświadczenia zewnętrzne (`GROQ_API_KEY`, `PUSHBULLET_API_KEY`, `LIBRUS_PASSWORD`) wyłącznie w zmiennych środowiskowych backendu i wolumenach Docker (Zero Client Exposure).
- Wszelkie operacje I/O walidowane na granicy systemu schematami Zod (`packages/contracts`) przed mutacją stanu.
- Rygor dekompozycji: żaden komponent ani plik strony nie przekracza 150-250 linii kodu. Pliki `page.tsx` wyłącznie koordynują layout.

## Review Focus

1. Weryfikacja CORS i nagłówków bezpieczeństwa — żądanie z nieautoryzowanej domeny (`Origin: https://malicious.site`) musi zostać bezwzględnie zablokowane kodem `403/400`.
2. Izolacja danych wielodostępnych (Tenant Isolation) — żądanie odczytu lub modyfikacji zasobów użytkownika A przez token użytkownika B musi zwrócić błąd odmowy dostępu (403/404).
3. Ochrona przed zablokowaniem całego serwera proxy przez Rate Limiting — weryfikacja czy moduł `realip` poprawnie odzyskuje adres IP klienta z nagłówka `X-Forwarded-For`.
4. Matematyka średnich ocen Librusa na zbiorze wzorcowym Golden Dataset — brak wpływu ocen o wadze 0 oraz nienumerycznych symboli (`N`, `np`) na wynik.
5. Poprawność renderowania i brak scroll-jackingu na urządzeniach mobilnych — testy responsywne dla widoków 375px (telefon), 768px (tablet) oraz 1280px+ (desktop) z obsługą `env(safe-area-inset-*)`.

---

### Task 1: Inicjalizacja Monorepo i Współdzielonych Kontraktów Typów (packages/contracts)
- [ ] Step 1: Write failing test in `packages/contracts/tests/contracts.test.ts`
- [ ] Step 2: Run test to verify it fails
- [ ] Step 3: Implement Zod schemas in `packages/contracts/src/`
- [ ] Step 4: Run test to verify it passes
- [ ] Step 5: Commit

### Task 2: Baza Danych Drizzle ORM i Weryfikacja Tenant Isolation (apps/api/src/db)
- [ ] Step 1: Write failing test in `apps/api/tests/db_rls.test.ts`
- [ ] Step 2: Run test to verify it fails
- [ ] Step 3: Implement Drizzle schema with explicit foreign keys and user relations
- [ ] Step 4: Run test to verify it passes
- [ ] Step 5: Commit

### Task 3: Moduł Bezpieczeństwa, Google Cloud Auth & Eliminacja Dzikich Gwiazdek CORS
- [ ] Step 1: Write failing test in `apps/api/tests/security_auth.test.ts`
- [ ] Step 2: Run test to verify it fails
- [ ] Step 3: Implement Security Modules and Google Auth Verification
- [ ] Step 4: Run test to verify it passes
- [ ] Step 5: Commit

### Task 4: Backendowy Silnik Agenta AI & Tool Sandbox (apps/api/src/domains/ai)
- [ ] Step 1: Write failing test in `apps/api/tests/agent_runtime.test.ts`
- [ ] Step 2: Run test to verify it fails
- [ ] Step 3: Implement Agent Runtime, Tool Sandbox & Harvey Persona
- [ ] Step 4: Run test to verify it passes
- [ ] Step 5: Commit

### Task 5: Serwis Domenowy Librus Synergia i Scraper Odwołanych Lekcji
- [ ] Step 1: Write failing test in `apps/api/tests/librus_domain.test.ts`
- [ ] Step 2: Run test to verify it fails
- [ ] Step 3: Implement Librus Engine in TypeScript
- [ ] Step 4: Run test to verify it passes
- [ ] Step 5: Commit

### Task 6: Finanse 50/30/20 i Daemon Pushbullet WebSocket (apps/worker)
- [ ] Step 1: Write failing test in `apps/worker/tests/pushbullet_classifier.test.ts`
- [ ] Step 2: Run test to verify it fails
- [ ] Step 3: Implement Pushbullet Daemon and Budget Engine
- [ ] Step 4: Run test to verify it passes
- [ ] Step 5: Commit

### Task 7: Pozostałe Domeny: Entities OSINT, Traffic CANARD, Voice, Workouts
- [ ] Step 1: Write failing test in `apps/api/tests/remaining_domains.test.ts`
- [ ] Step 2: Run test to verify it fails
- [ ] Step 3: Implement Remaining Domains in TypeScript
- [ ] Step 4: Run test to verify it passes
- [ ] Step 5: Commit

### Task 8: Nowoczesne GUI Multi-Device — Architektura Mikro-Komponentów (≤150 Linii)
- [ ] Step 1: Write failing test in `apps/web/tests/responsive_gui.test.tsx`
- [ ] Step 2: Run test to verify it fails
- [ ] Step 3: Implement Multi-Device GUI components in React 19 + TypeScript + Tailwind v4
- [ ] Step 4: Run test to verify it passes
- [ ] Step 5: Commit

### Task 9: Dokeryzacja Środowiska, Konfiguracja Nginx / Real-IP i Audyt Bezpieczeństwa End-to-End
- [ ] Step 1: Write failing E2E security test in `tests/e2e/security_smoke.test.ts`
- [ ] Step 2: Run test to verify it fails
- [ ] Step 3: Build and launch Docker Compose stack (`docker compose up -d`)
- [ ] Step 4: Run test to verify it passes
- [ ] Step 5: Commit
