# OmniDash Reborn (v4.0.0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kompletna rekonstrukcja i przepisanie od zera systemu OmniDash do nowoczesnego, w pełni typowanego monorepo (TypeScript 5.6+) opartego na architekturze kontenerowej Docker Compose, ścisłym bezpieczeństwie Zero-Trust (eliminacja wieloznaczników `*`, integracja z Google Cloud Auth, Drizzle ORM z Row-Level Security, ochrona SSRF i Rate Limiting) oraz nowoczesnym, w 100% responsywnym interfejsie użytkownika w stylu Apple-Glass dla smartfonów, tabletów i laptopów, z zachowaniem wszystkich dotychczasowych funkcji i modułów domenowych.

**Architecture:** Domain-Driven Modular Monolith zorganizowany w monorepo (pnpm workspaces): frontend SPA (`apps/web`) serwowany przez Nginx z modułem `ngx_http_realip_module`, serwer API (`apps/api`) w Fastify/Express TS ze strumieniowaniem tokenów SSE i sandboxem narzędzi AI, daemon procesów tła (`apps/worker`) dla WebSocketu Pushbullet i harmonogramu Librusa, relacyjna baza PostgreSQL 16 (lub SQLite WAL w wolumenie) z Drizzle ORM oraz współdzielone kontrakty walidacji Zod (`packages/contracts`).

**Tech Stack:** TypeScript 5.6+, Node.js 22 LTS, Fastify/Express TS, React 19, TailwindCSS v4, Shadcn/Radix UI Primitives, Framer Motion, Google Cloud Identity / Firebase Auth SDK, Drizzle ORM, PostgreSQL 16 Alpine, Redis 7 Alpine, Docker & Docker Compose, Vitest.

**Spec:** `C:\Users\Jakub Lis\Desktop\01_PROJEKTY\OmniDash\02_ARCHITEKTURA_NOWEGO_SYSTEMU.md` oraz `C:\Users\Jakub Lis\Desktop\01_PROJEKTY\OmniDash\SECURITY_AUDIT_VIBE_HARDENING.md`

## Global Constraints

- 100% TypeScript w całym repozytorium (`strict: true`, bezwzględny zakaz typu `any`).
- Całkowita eliminacja wieloznaczników `*` w regułach CORS (`Access-Control-Allow-Origin: *` zabronione; wyłącznie jawna biała lista domen) oraz w regułach autoryzacji bazodanowej.
- Całkowity zakaz placeholderów (`// TODO`, `/* implement later */`, `# reszta bez zmian`, pustych bloków funkcji).
- Zero-Emoji Policy: w kodzie źródłowym, logach, GUI i dokumentacji dozwolone wyłącznie inżynieryjne znaczniki tekstowe `[*]`, `[!]`, `[+]`, `[-]`, `[>]`, `[~]`, `[OK]`, `[X]`, `[ALERT]`.
- Wszystkie klucze API i poświadczenia zewnętrzne (`GROQ_API_KEY`, `PUSHBULLET_API_KEY`, `LIBRUS_PASSWORD`) wyłącznie w zmiennych środowiskowych backendu i wolumenach Docker (Zero Client Exposure).
- Wszelkie operacje I/O walidowane na granicy systemu schematami Zod (`packages/contracts`) przed mutacją stanu.
- Deterministyczne testy jednostkowe Vitest (`pnpm test`) dla każdego modułu przed wdrożeniem (TDD).

## Review Focus

1. Weryfikacja CORS i nagłówków bezpieczeństwa — żądanie z nieautoryzowanej domeny (`Origin: https://malicious.site`) musi zostać bezwzględnie zablokowane kodem `403/400`.
2. Izolacja danych wielodostępnych (Tenant Isolation) — żądanie odczytu lub modyfikacji zasobów użytkownika A przez token użytkownika B musi zwrócić błąd odmowy dostępu (403/404).
3. Ochrona przed zablokowaniem całego serwera proxy przez Rate Limiting — weryfikacja czy moduł `realip` poprawnie odzyskuje adres IP klienta z nagłówka `X-Forwarded-For`.
4. Matematyka średnich ocen Librusa na zbiorze wzorcowym Golden Dataset — brak wpływu ocen o wadze 0 oraz nienumerycznych symboli (`N`, `np`) na wynik.
5. Poprawność renderowania i brak scroll-jackingu na urządzeniach mobilnych — testy responsywne dla widoków 375px (telefon), 768px (tablet) oraz 1280px+ (desktop) z obsługą `env(safe-area-inset-*)`.

---

### Task 1: Inicjalizacja Monorepo i Współdzielonych Kontraktów Typów (packages/contracts) [COMPLETE - 12/12 PASS]

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `package.json`
- Create: `packages/contracts/package.json`
- Create: `packages/contracts/tsconfig.json`
- Create: `packages/contracts/src/index.ts`
- Create: `packages/contracts/src/auth.schema.ts`
- Create: `packages/contracts/src/ai.schema.ts`
- Create: `packages/contracts/src/librus.schema.ts`
- Create: `packages/contracts/src/finance.schema.ts`
- Create: `packages/contracts/src/entities.schema.ts`
- Create: `packages/contracts/src/system.schema.ts`
- Test: `packages/contracts/tests/contracts.test.ts`

**Interfaces:**
- Produces: Wyeksportowane schematy Zod oraz typy TypeScript: `GoogleAuthPayloadSchema`, `ChatMessageSchema`, `AiToolCallSchema`, `GradeSchema`, `TimetableLessonSchema`, `TransactionSchema`, `EntityCardSchema`, `TelemetryMetricsSchema`.

- [x] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { GradeSchema, TransactionSchema, GoogleAuthPayloadSchema } from '../src';

describe('Contracts Schema Validation', () => {
  it('validates a correct Google Auth login payload', () => {
    const validAuth = { idToken: 'valid-google-jwt-token-string' };
    expect(GoogleAuthPayloadSchema.safeParse(validAuth).success).toBe(true);
  });

  it('rejects an invalid transaction payload', () => {
    const invalidTx = { amount: -50 }; // brak typu, koszyka i daty
    expect(TransactionSchema.safeParse(invalidTx).success).toBe(false);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @omnidash/contracts test`  
Expected: FAIL (brak plików źródłowych).

- [ ] **Step 3: Implement schemas in `packages/contracts/src/`**

Zaimplementuj kompletne schematy walidacji Zod dla wszystkich struktur domenowych, w tym Google Auth, ocen Librusa z modyfikatorami, transakcji 50/30/20 oraz 10 kart encji OSINT.

- [x] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @omnidash/contracts test`  
Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add packages/contracts/ pnpm-workspace.yaml package.json
git commit -m "feat(contracts): initialize monorepo and define shared Zod schemas"
```

---

### Task 2: Baza Danych Drizzle ORM i Weryfikacja Row-Level Security (apps/api/src/db)

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/db/schema.ts`
- Create: `apps/api/src/db/client.ts`
- Create: `apps/api/drizzle.config.ts`
- Test: `apps/api/tests/db_rls.test.ts`

**Interfaces:**
- Consumes: `@omnidash/contracts`
- Produces: `db` instancja Drizzle ORM, tabele `users`, `tasks`, `transactions`, `librusGrades`, `librusTimetable`, `entities`, `entityRelations`, `systemLogs`.

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { getTestDb } from './testDbHelper';
import { tasks, users } from '../src/db/schema';
import { eq } from 'drizzle-orm';

describe('Database Schema & Tenant Isolation', () => {
  it('enforces user ownership on inserted tasks', async () => {
    const db = await getTestDb();
    const user = await db.insert(users).values({ email: 'operator@omnidash.local', role: 'ADMIN' }).returning();
    const inserted = await db.insert(tasks).values({
      userId: user[0].id,
      title: 'Zainicjować nowy silnik OmniDash',
      priority: 'HIGH',
      category: 'system'
    }).returning();

    expect(inserted[0].userId).toBe(user[0].id);
    const userTasks = await db.select().from(tasks).where(eq(tasks.userId, user[0].id));
    expect(userTasks.length).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @omnidash/api test tests/db_rls.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement Drizzle schema with explicit foreign keys and user relations in `apps/api/src/db/`**

Zdefiniuj pełny schemat relacyjny w TypeScript z wymogiem klucza `userId` na każdej tabeli operacyjnej oraz generowaniem migracji SQL (`npm run db:generate`).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @omnidash/api test tests/db_rls.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/db/ apps/api/drizzle.config.ts
git commit -m "feat(api): implement Drizzle ORM database schemas with tenant isolation"
```

---

### Task 3: Moduł Bezpieczeństwa, Google Cloud Auth & Eliminacja Dzikich Gwiazdek CORS

**Files:**
- Create: `apps/api/src/core/security.ts`
- Create: `apps/api/src/core/corsConfig.ts`
- Create: `apps/api/src/core/rateLimiter.ts`
- Create: `apps/api/src/domains/auth/googleAuthService.ts`
- Create: `apps/api/src/domains/auth/authMiddleware.ts`
- Test: `apps/api/tests/security_auth.test.ts`

**Interfaces:**
- Consumes: `@omnidash/contracts`, `apps/api/src/db`
- Produces: `verifyGoogleToken(idToken)`, `authMiddleware`, `corsPlugin`, `rateLimitPlugin`.

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { isOriginAllowed } from '../src/core/corsConfig';
import { verifyGoogleIdToken } from '../src/domains/auth/googleAuthService';

describe('Security & Auth Hardening', () => {
  it('blocks wildcard and unauthorized origins strictly', () => {
    expect(isOriginAllowed('*')).toBe(false);
    expect(isOriginAllowed('http://malicious-website.com')).toBe(false);
    expect(isOriginAllowed('https://omnidash.local')).toBe(true);
  });

  it('rejects forged Google ID token without throwing unhandled exceptions', async () => {
    const result = await verifyGoogleIdToken('invalid.token.here');
    expect(result.isValid).toBe(false);
    expect(result.user).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @omnidash/api test tests/security_auth.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement Security Modules and Google Auth Verification**

Zaimplementuj weryfikację tokenów Google (`google-auth-library`), bezpieczne ciasteczka HttpOnly, middleware autoryzacji z kwalifikacją roli właściciela (`OPERATOR_EMAIL`), restrykcyjny CORS bez gwiazdek oraz Rate Limiter oparty o Redis/pamięć.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @omnidash/api test tests/security_auth.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/core/ apps/api/src/domains/auth/
git commit -m "feat(security): implement strict CORS whitelist, rate limiting and Google Cloud Auth"
```

---

### Task 4: Backendowy Silnik Agenta AI & Tool Sandbox (apps/api/src/domains/ai)

**Files:**
- Create: `apps/api/src/domains/ai/agentRuntime.ts`
- Create: `apps/api/src/domains/ai/promptEngine.ts`
- Create: `apps/api/src/domains/ai/toolSandbox.ts`
- Create: `apps/api/src/domains/ai/harveyPersona.ts`
- Test: `apps/api/tests/agent_runtime.test.ts`

**Interfaces:**
- Consumes: `@omnidash/contracts`, `apps/api/src/db`
- Produces: `runAgentStream(messages, mode, userId): AsyncGenerator<AgentEvent>` — generator SSE strumieniujący tokeny i zdarzenia narzędzi bez wycieku promptów do przeglądarki.

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { executeToolSandbox } from '../src/domains/ai/toolSandbox';

describe('AI Tool Sandbox Execution', () => {
  it('executes ADD_TASK safely and associates with authenticated userId', async () => {
    const result = await executeToolSandbox('ADD_TASK', {
      title: 'Trening FBW Attic',
      priority: 'HIGH',
      category: 'workouts'
    }, { userId: 'user-1', mode: 'WORKER' });
    expect(result.success).toBe(true);
    expect(result.data.userId).toBe('user-1');
  });

  it('rejects tool execution completely in MENTOR mode', async () => {
    const result = await executeToolSandbox('DELETE_TASK', { id: '1' }, { userId: 'user-1', mode: 'MENTOR' });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Tool execution disabled in MENTOR mode/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @omnidash/api test tests/agent_runtime.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement Agent Runtime, Tool Sandbox & Harvey Persona**

Zaimplementuj obsługę Groq SDK (model `openai/gpt-oss-120b`), streaming tokenów SSE do klienta, pełną personę Harvey (AIDA/PAS/BAB/QVC/3Ps, 23 sygnały) oraz twardy sandbox uniemożliwiający wyjście poza uprawnienia użytkownika.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @omnidash/api test tests/agent_runtime.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/domains/ai/
git commit -m "feat(ai): implement server-side agent runtime, SSE streaming and Harvey sales persona"
```

---

### Task 5: Serwis Domenowy Librus Synergia i Scraper Odwołanych Lekcji

**Files:**
- Create: `apps/api/src/domains/librus/gradeEngine.ts`
- Create: `apps/api/src/domains/librus/timetableScraper.ts`
- Create: `apps/api/src/domains/librus/librusService.ts`
- Test: `apps/api/tests/librus_domain.test.ts`

**Interfaces:**
- Consumes: `@omnidash/contracts`
- Produces: `calculateWeightedAverage(grades)`, `parseTimetableHtml(rawHtml)`, `syncLibrusData(credentials)`.

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { calculateWeightedAverage, parseTimetableHtml } from '../src/domains/librus';

describe('Librus Domain Engine', () => {
  it('correctly calculates weighted average ignoring weight 0 and non-numeric symbols', () => {
    const grades = [
      { value: 5, weight: 2 },
      { value: 1, weight: 0 }, // nie wlicza się
      { value: 4, weight: 1 }
    ];
    // (5*2 + 4*1) / (2+1) = 14 / 3 = 4.67
    expect(calculateWeightedAverage(grades)).toBe(4.67);
  });

  it('detects cancelled lessons marked with <s> tags and preserves subject', () => {
    const html = `<td class="line0"><s>Język Polski</s> <span class="plan-lekcji-info">Odwołane</span></td>`;
    const parsed = parseTimetableHtml(html);
    expect(parsed[0].isCancelled).toBe(true);
    expect(parsed[0].subject).toBe('Język Polski');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @omnidash/api test tests/librus_domain.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement Librus Engine in TypeScript**

Zaimplementuj matematykę ocen (Golden Dataset standard), Cheerio parser HTML dla planu lekcji i obsługę autoryzacji sesji Synergii.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @omnidash/api test tests/librus_domain.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/domains/librus/
git commit -m "feat(librus): implement grade math engine and timetable cancellation scraper"
```

---

### Task 6: Finanse 50/30/20 i Daemon Pushbullet WebSocket (apps/worker)

**Files:**
- Create: `apps/worker/package.json`
- Create: `apps/worker/tsconfig.json`
- Create: `apps/worker/src/pushbullet/websocketListener.ts`
- Create: `apps/worker/src/pushbullet/classifier.ts`
- Create: `apps/api/src/domains/finance/budgetEngine.ts`
- Test: `apps/worker/tests/pushbullet_classifier.test.ts`

**Interfaces:**
- Consumes: `@omnidash/contracts`, `apps/api/src/db`
- Produces: `startPushbulletDaemon()`, `calculateEnvelopeAllocation(income, customSplit)`.

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { classifyExpenseNotification } from '../src/pushbullet/classifier';

describe('Pushbullet Expense Classifier', () => {
  it('extracts amount and classifies groceries to Needs envelope', () => {
    const notification = 'Płatność kartą: 68,40 PLN w LIDL dnia 28-10-2026';
    const result = classifyExpenseNotification(notification);
    expect(result.isExpense).toBe(true);
    expect(result.amount).toBe(68.40);
    expect(result.envelope).toBe('NEEDS');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @omnidash/worker test tests/pushbullet_classifier.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement Pushbullet Daemon and Budget Engine**

Zaimplementuj klienta WebSocket z exponential backoff, buforem deduplikacji w oknie 60 sekund oraz silnikiem matematycznym kopert 50/30/20.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @omnidash/worker test tests/pushbullet_classifier.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/worker/ apps/api/src/domains/finance/
git commit -m "feat(finance): implement 50/30/20 budget engine and Pushbullet background daemon"
```

---

### Task 7: Pozostałe Domeny: Entities OSINT, Traffic CANARD, Voice, Workouts

**Files:**
- Create: `apps/api/src/domains/entities/entityTree.ts`
- Create: `apps/api/src/domains/traffic/trafficService.ts`
- Create: `apps/api/src/domains/voice/ttsService.ts`
- Create: `apps/api/src/domains/workouts/workoutEngine.ts`
- Test: `apps/api/tests/remaining_domains.test.ts`

**Interfaces:**
- Consumes: `@omnidash/contracts`
- Produces: API dla drzewa encji (10 domen), radaru CANARD/GDDKiA, syntezy mowy Fish Audio / Edge oraz rejestratora treningu FBW na strychu.

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { calculateTreePath } from '../src/domains/entities/entityTree';
import { getSpeedCamerasOnCorridor } from '../src/domains/traffic/trafficService';

describe('Remaining Core Domains', () => {
  it('computes canonical tree_path for nested entity', () => {
    const path = calculateTreePath('polska/pomorskie/starogard_gdanski', 'ZSE');
    expect(path).toBe('polska/pomorskie/starogard_gdanski/zse');
  });

  it('retrieves exactly 9 CANARD speed points on Gdansk corridor', () => {
    const cameras = getSpeedCamerasOnCorridor('starogard_gdansk');
    expect(cameras.length).toBe(9);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @omnidash/api test tests/remaining_domains.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement Remaining Domains in TypeScript**

Zaimplementuj logikę 10 kart encji, wywiad drogowy CANARD/GDDKiA, syntezę Fish Audio oraz rejestrator FBW.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @omnidash/api test tests/remaining_domains.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/domains/
git commit -m "feat(domains): implement entities tree, traffic radar, voice and workouts"
```

---

### Task 8: Nowoczesne GUI Multi-Device (Telefon, Tablet, Desktop) — Architektura Mikro-Komponentów (≤150 Linii)

**Rygor Dekompozycji:** Całkowity zakaz plików >200 linii. Każda strona rozbita na modułowe klocki (`modules/<feature>/components/*`).

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/src/App.tsx`
- Create: `apps/web/src/components/navigation/BottomTabBar.tsx` (iOS Dock / Thumb-Zone)
- Create: `apps/web/src/components/navigation/Sidebar.tsx` (Desktop / Tablet Mini)
- Create: `apps/web/src/components/ui/BottomActionSheet.tsx` (Apple Swipe-Down Sheet)
- Create: `apps/web/src/modules/timetable/page.tsx` (Koordynator max 90 linii)
- Create: `apps/web/src/modules/timetable/components/DaySelectorBar.tsx` (Touch Swipe)
- Create: `apps/web/src/modules/timetable/components/LessonCard.tsx`
- Create: `apps/web/src/modules/timetable/components/LessonDetailsSheet.tsx`
- Create: `apps/web/src/modules/grades/page.tsx` (Koordynator max 80 linii)
- Create: `apps/web/src/modules/grades/components/GradeStatsSummary.tsx`
- Create: `apps/web/src/modules/grades/components/SubjectGradesGrid.tsx`
- Create: `apps/web/src/modules/grades/components/GradeDetailsSheet.tsx`
- Create: `apps/web/src/modules/chat/page.tsx` (Koordynator max 90 linii)
- Create: `apps/web/src/modules/chat/components/ChatMessageList.tsx`
- Create: `apps/web/src/modules/chat/components/ChatInputBar.tsx` (100dvh keyboard-safe)
- Create: `apps/web/src/modules/chat/components/ToolCallingAccordion.tsx`
- Create: `apps/web/src/modules/dashboard/page.tsx` (Koordynator max 80 linii)
- Create: `apps/web/src/modules/dashboard/components/WeatherTrafficCapsule.tsx`
- Create: `apps/web/src/modules/dashboard/components/SystemTelemetryWidget.tsx`
- Create: `apps/web/src/modules/dashboard/components/TodoSlideOverDrawer.tsx`
- Test: `apps/web/tests/responsive_gui.test.tsx`

**Interfaces:**
- Consumes: `@omnidash/contracts`, API REST/SSE
- Produces: Responsywny interfejs użytkownika z obsługą widoków: Mobile (Bottom Dock + Bottom Sheets), Tablet (Master-Detail), Desktop (Sidebar + Slide-Over Drawer), z zachowaniem safe-area insets (`pt-safe`, `pb-safe`) i fizyki Apple Spring.

- [ ] **Step 1: Write the failing test**

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BottomTabBar } from '../src/components/navigation/BottomTabBar';
import { MemoryRouter } from 'react-router-dom';

describe('GUI Multi-Device Navigation', () => {
  it('renders bottom tab bar with 44px touch targets on mobile view', () => {
    render(
      <MemoryRouter>
        <BottomTabBar activeRoute="/dashboard" />
      </MemoryRouter>
    );
    const navItem = screen.getByRole('link', { name: /Pulpit/i });
    expect(navItem).toBeInTheDocument();
    expect(navItem.className).toContain('min-h-[44px]');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @omnidash/web test tests/responsive_gui.test.tsx`  
Expected: FAIL.

- [ ] **Step 3: Implement Multi-Device GUI components in React 19 + TypeScript + Tailwind v4**

Zaimplementuj komponenty stron, nawigację dolną (Bottom Tab Bar) dla telefonów, boczny pasek dla desktopów, wysuwane szuflady w stylu Apple Glass Slide-Over, segmentowane paski oraz akordeony wywołań narzędzi.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @omnidash/web test tests/responsive_gui.test.tsx`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/
git commit -m "feat(web): build modern responsive Apple-Glass GUI for mobile, tablet and desktop"
```

---

### Task 9: Dokeryzacja Środowiska, Konfiguracja Nginx / Real-IP i Audyt Bezpieczeństwa End-to-End

**Files:**
- Create: `docker-compose.yml`
- Create: `docker-compose.dev.yml`
- Create: `apps/api/Dockerfile.api`
- Create: `apps/web/Dockerfile.web`
- Create: `apps/worker/Dockerfile.worker`
- Create: `apps/web/nginx.conf`
- Test: `tests/e2e/security_smoke.test.ts`

**Interfaces:**
- Produces: W pełni orkiestrowane środowisko wielokontenerowe uruchamiane poleceniem `docker compose up -d` z modułem `ngx_http_realip_module` i weryfikacją braku podatności CVE/CORS.

- [ ] **Step 1: Write the failing E2E security test**

```typescript
import { describe, it, expect } from 'vitest';
import axios from 'axios';

describe('Production Docker & Security E2E Test', () => {
  it('rejects cross-origin requests from untrusted origins with 403', async () => {
    try {
      await axios.get('http://127.0.0.1:5000/api/system/metrics', {
        headers: { Origin: 'https://evil-hacker.com' }
      });
      expect.fail('Should have been blocked by CORS');
    } catch (err: any) {
      expect(err.response?.status).toBe(403);
    }
  });

  it('restores real client IP correctly via X-Forwarded-For', async () => {
    const res = await axios.get('http://127.0.0.1:5000/api/system/client-ip', {
      headers: { 'X-Forwarded-For': '198.51.100.42' }
    });
    expect(res.data.clientIp).toBe('198.51.100.42');
  });
});
```

- [ ] **Step 2: Run verification to ensure containers are not yet running**

Run: `pnpm test:e2e`  
Expected: FAIL.

- [ ] **Step 3: Build and launch Docker Compose stack**

Run: `docker compose build && docker compose up -d`  
Verify: `docker compose ps` pokazuje wszystkie 5 kontenerów ze statusem `healthy` lub `running`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:e2e`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add docker-compose*.yml apps/*/Dockerfile* apps/web/nginx.conf tests/e2e/
git commit -m "feat(infra): finalize Docker Compose multi-stage containers and security E2E audit"
```
