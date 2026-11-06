# Graph Report - OmniDash  (2026-11-06)

## Corpus Check
- 213 files · ~127,305 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 4, .example 1, .css 1)

## Summary
- 1372 nodes · 3024 edges · 66 communities (60 shown, 6 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 77 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `91e492e2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- PushbulletDispatcher
- llmGateway.ts
- GlassCard
- DatabaseStore
- useWorkoutState.ts
- api/package.json
- SqliteStore
- store.ts
- App.tsx
- services
- client.ts
- Badge
- REJESTR WYDAŃ
- api/src/index.ts
- worker/package.json
- lucide-react
- ChatInlineWidgets.tsx
- private/page.tsx
- sqliteStore.ts
- compilerOptions
- finance/page.tsx
- librusTimetableParser.ts
- web/package.json
- internalMcpServer.ts
- grades/page.tsx
- compilerOptions
- school/page.tsx
- README.md
- contracts/package.json
- RedisCache
- librusSyncService.ts
- HISTORY.md — REJESTR WERSJI I ZMIAN SYSTEMU OMNIDASH
- ruleEngine.ts
- package.json
- semanticRecall.ts
- pushbulletService.ts
- compilerOptions
- traffic/page.tsx
- compilerOptions
- DailyTimelineWidget.tsx
- ref_vitest
- redisCache.ts
- MASTER_SYSTEM_ARCHITECTURE.md — MASTER SYSTEM SPECIFICATION
- contracts.test.ts
- dependencies
- server/page.tsx
- FinOpsCollector
- ThemeContext.tsx
- librusHtmlScraper.ts
- scripts
- compilerOptions
- ai.schema.ts
- system.schema.ts
- @playwright/test
- entities.schema.ts
- finance.schema.ts
- ref_zod
- traffic.schema.ts
- contracts/src/index.ts
- Wydanie v4.0.0-rc.12 — 2026-11-05
- 1. Zakres Wydania
- pnpm-workspace.yaml
- librus-api.d.ts

## God Nodes (most connected - your core abstractions)
1. `GlassCard()` - 101 edges
2. `react` - 100 edges
3. `lucide-react` - 89 edges
4. `DatabaseStore` - 87 edges
5. `Badge()` - 41 edges
6. `SqliteStore` - 39 edges
7. `useToast()` - 34 edges
8. `PageHeader()` - 26 edges
9. `App()` - 25 edges
10. `RedisCache` - 24 edges

## Surprising Connections (you probably didn't know these)
- `Zakres Wdrożenia i Zmian:` --references--> `DatabaseStore`  [INFERRED]
  HISTORY.md → apps/api/src/db/store.ts
- `B. `apps/api/` — API Gateway & Silnik Domenowy (Port 5000)` --references--> `withTimeout()`  [INFERRED]
  MASTER_SYSTEM_ARCHITECTURE.md → apps/api/src/domains/ai/llmGateway.ts
- `Zakres Wdrożenia i Zmian:` --references--> `InternalMcpServer`  [INFERRED]
  HISTORY.md → apps/api/src/mcp/internalMcpServer.ts
- `[*] TASK-PB-01: Dwukierunkowy Most Konwersacyjny Pushbullet (Bidirectional Pushbullet Chat Bridge)` --references--> `PushbulletListener`  [INFERRED]
  TODO.md → apps/worker/src/pushbullet/websocketListener.ts
- `Zakres Zmian:` --references--> `authMiddleware()`  [INFERRED]
  HISTORY.md → apps/api/src/core/authMiddleware.ts

## Import Cycles
- 2-file cycle: `apps/web/src/modules/grades/components/LibrusTableView.tsx -> apps/web/src/modules/grades/components/SubjectGradesGrid.tsx -> apps/web/src/modules/grades/components/LibrusTableView.tsx`

## Communities (66 total, 6 thin omitted)

### Community 0 - "PushbulletDispatcher"
Cohesion: 0.05
Nodes (23): formatRoomText(), formatTeacherText(), getSubjectNotes(), LessonAlertMonitor, LessonAlertMonitorOptions, KnownGradeInfo, LibrusAutoScraper, LibrusAutoScraperOptions (+15 more)

### Community 1 - "llmGateway.ts"
Cohesion: 0.06
Nodes (39): IterationBudget, IterationBudgetConfig, IterationBudgetExhaustedError, AUTOMATION_TOOLS, determineWidgets(), LLM_TOOLS, LLMGateway, llmGateway (+31 more)

### Community 2 - "GlassCard"
Cohesion: 0.08
Nodes (41): GlassCard(), GlassCardProps, GlassGlow, glowStyles, useTheme(), NODES, OperationalNodesWidget(), SystemTelemetryWidget() (+33 more)

### Community 3 - "DatabaseStore"
Cohesion: 0.08
Nodes (6): DatabaseStore, ExerciseItem, PersonalGoalItem, SavingsGoal, SubscriptionItem, Zakres Wdrożenia i Zmian:

### Community 4 - "useWorkoutState.ts"
Cohesion: 0.07
Nodes (27): workoutsApi, ACCENT_STYLES, AudioHapticsService, feedback, RulerWheelPicker(), RulerWheelPickerProps, AtticFBWTracker(), PersonalRecordsCard() (+19 more)

### Community 5 - "api/package.json"
Cohesion: 0.06
Nodes (41): dependencies, cheerio@^1.2.0, cors@^2.8.5, dotenv@^16.4.7, express@^4.21.2, helmet@^8.0.0, ioredis@^5.4.1, librus-api@^2.20.0 (+33 more)

### Community 6 - "SqliteStore"
Cohesion: 0.08
Nodes (5): SqliteStore, AutomationScriptItem, HabitItem, TaskItem, TransactionItem

### Community 7 - "store.ts"
Cohesion: 0.10
Nodes (27): SEED_EVENTS, SEED_EXERCISES, SEED_GRADES, SEED_HABITS, SEED_JOURNAL, SEED_PERSONAL_GOALS, SEED_RECORDS, SEED_ROUTINES (+19 more)

### Community 8 - "App.tsx"
Cohesion: 0.08
Nodes (28): pushbulletApi, App(), ROUTE_TITLES, AppHeader(), AppHeaderProps, BottomTabBar(), BottomTabBarProps, MoreDrawerSheet() (+20 more)

### Community 9 - "services"
Cohesion: 0.06
Nodes (34): context, dockerfile, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, build, depends_on, environment (+26 more)

### Community 10 - "client.ts"
Cohesion: 0.10
Nodes (23): aiApi, ApiFetchOptions, memoryApi, newsApi, osintApi, tasksApi, CurrentLessonHero(), CurrentLessonHeroProps (+15 more)

### Community 11 - "Badge"
Cohesion: 0.14
Nodes (23): Badge(), BadgeProps, BadgeVariant, variantStyles, HumanCheckpointModal(), HumanCheckpointProps, PageHeader(), PageHeaderProps (+15 more)

### Community 12 - "REJESTR WYDAŃ"
Cohesion: 0.06
Nodes (33): REJESTR WYDAŃ, ## v4.0.0 — 2026-10-30 [PLANNING & BLUEPRINT], ## v4.0.0-alpha.10 — 2026-10-30 [ZERO-SCROLL DASHBOARD, PRIVATE HUB, WORKOUTS REST TIMER, FINANCE BUDGET EDITOR & 7-TAB SETTINGS], ## v4.0.0-alpha.11 — 2026-10-30 [FULL API INTEGRATION & NON-SCROLL SUB-TAB BARS], ## v4.0.0-alpha.1 — 2026-10-30 [GUI FOUNDATION & LIVE PREVIEW], ## v4.0.0-alpha.2 — 2026-10-30 [LIGHT LIQUID GLASS DESIGN], ## v4.0.0-alpha.3 — 2026-10-30 [FIX: CHAT VIEWPORT ISOLATION & E2E TESTING], ## v4.0.0-alpha.4 — 2026-10-30 [PLAYWRIGHT TEST SUITE INTEGRATION] (+25 more)

### Community 13 - "api/src/index.ts"
Cohesion: 0.16
Nodes (20): AuthenticatedRequest, authMiddleware(), extractWebhookSecret(), isSecretPrimitive(), PUBLIC_PATHS, sanitizeSecret(), UserContext, sqliteStore (+12 more)

### Community 14 - "worker/package.json"
Cohesion: 0.08
Nodes (30): dependencies, dotenv@^16.4.7, @omnidash/contracts@workspace:*, ws@^8.18.0, zod@^3.23.8, devDependencies, tsx@^4.19.2, @types/node@^22.9.0 (+22 more)

### Community 15 - "lucide-react"
Cohesion: 0.12
Nodes (20): SubTabBar(), SubTabBarProps, TabItem, EventModal(), EventModalProps, CalendarEventItem, MonthGridCalendar(), MonthGridCalendarProps (+12 more)

### Community 16 - "ChatInlineWidgets.tsx"
Cohesion: 0.13
Nodes (24): AutomationChatWidget(), CalendarChatWidget(), ChatInlineWidgetsContainer(), ChatInlineWidgetsContainerProps, DAY_MAP, DAY_NAMES, FinancesChatWidget(), GradesChatWidget() (+16 more)

### Community 17 - "private/page.tsx"
Cohesion: 0.12
Nodes (21): automationApi, privateApi, AutomationScriptsManager(), ScriptItem, TemplateItem, DailyHabitStreaks(), HabitItem, INITIAL_HABITS (+13 more)

### Community 18 - "sqliteStore.ts"
Cohesion: 0.10
Nodes (16): { DatabaseSync }, __dirname, __filename, require, SqliteAutomationScriptRow, SqliteFinanceEnvelopesRow, SqliteHabitRow, SqliteSystemConfigRow (+8 more)

### Community 19 - "compilerOptions"
Cohesion: 0.07
Nodes (26): compilerOptions, alwaysStrict, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution (+18 more)

### Community 20 - "finance/page.tsx"
Cohesion: 0.13
Nodes (19): financeApi, BudgetPredictionCard(), BudgetPredictionProps, BudgetConfig, BudgetSettingsModal(), BudgetSettingsModalProps, DEFAULT_CONFIG, EnvelopeOverview() (+11 more)

### Community 21 - "librusTimetableParser.ts"
Cohesion: 0.14
Nodes (16): LessonItem, SchoolEvent, CurrentLessonInfo, ScriptExecutionContext, capitalize(), checkTimeOverlap(), cleanTeacherName(), COMMON_FIRST_NAMES (+8 more)

### Community 22 - "web/package.json"
Cohesion: 0.11
Nodes (23): devDependencies, autoprefixer@^10.4.20, playwright@^1.64.1, @playwright/test@^1.64.1, postcss@^8.5.2, tailwindcss@^3.4.17, @types/react@^19.0.10, @types/react-dom@^19.0.4 (+15 more)

### Community 23 - "internalMcpServer.ts"
Cohesion: 0.19
Nodes (12): getCurrentWorkday(), httpStatusFromError(), InternalMcpServer, McpBadRequestError, McpError, McpNotFoundError, McpNotImplementedError, mcpRouter (+4 more)

### Community 24 - "grades/page.tsx"
Cohesion: 0.22
Nodes (16): GradeStatsSummary(), createGradeTooltip(), formatGradeBadgeText(), getBadgeInlineStyle(), getLibrusBadgeColor(), isLightColor(), LibrusTableView(), LibrusTableViewProps (+8 more)

### Community 25 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution (+12 more)

### Community 26 - "school/page.tsx"
Cohesion: 0.17
Nodes (14): schoolApi, AttendanceCard(), ExamItem, FALLBACK_EXAMS, SchoolExamsList(), SchoolPage(), DaySelectorBar(), DaySelectorBarProps (+6 more)

### Community 27 - "README.md"
Cohesion: 0.10
Nodes (16): 1. STATUS SYSTEMU I METRYKI WYDANIA, 2. DRZEWO MONOREPO (TOPOLOGIA STRUKTURALNA), ARCHITECTURE.md — REJESTR ARCHITEKTURY OMNIDASH REBORN, 1. MISJA I CELE RESTRUKTURYZACJI, 2. PORÓWNANIE ARCHITEKTUR (LEGACY vs REBORN), 3. ARCHITEKTURA I SPECYFIKACJA SYSTEMOWA, Diagnoza Wersji Legacy (v3.4.0):, Niezmienniki Nowego Systemu (v4.0.0): (+8 more)

### Community 28 - "contracts/package.json"
Cohesion: 0.12
Nodes (19): dependencies, zod@^3.23.8, devDependencies, typescript@^5.6.3, vitest@^2.1.4, exports, typescript, vitest (+11 more)

### Community 30 - "librusSyncService.ts"
Cohesion: 0.20
Nodes (13): redisCache, formatDisplayGrade(), parseEventId(), parseGradeValue(), parseLibrusDate(), parseSafeAverage(), sanitizeEventInfo(), __dirname (+5 more)

### Community 31 - "HISTORY.md — REJESTR WERSJI I ZMIAN SYSTEMU OMNIDASH"
Cohesion: 0.11
Nodes (18): RedisCtor, 0. MANIFEST CZYSTEGO RESTARTU WERSJONOWANIA (CLEAN VERSION RESET), Autorytatywna Synchronizacja Librus Synergia, GPA 4.28, Prezentacja Ocen i Grupowanie Popraw w Klamrach, Autorytatywny Silnik Direct HTML Scraper dla Librus Synergia, Autentyczne Barwy Kategorii HEX i Weryfikacja Terminarza, Autorytatywny Silnik Zastępstw i Odwołanych Lekcji z Librus Synergia, Korelacja Absencji i Pełne Odwzorowanie w UI, Autorytatywny Widok Tabelaryczny Librus Synergia 1:1, Usunięcie Wad Prezentacji Ocen i Naprawa Zaleceń Groq Reviewera, HISTORY.md — REJESTR WERSJI I ZMIAN SYSTEMU OMNIDASH, Refaktoryzacja Bufora Redis (SCAN Iteration), Sanityzacja Kluczy i Korekta Odliczania Treningowego (+10 more)

### Community 32 - "ruleEngine.ts"
Cohesion: 0.16
Nodes (9): rulesRouter, Action, ActionSchema, AutomationRule, AutomationRuleSchema, Condition, ConditionSchema, RulesEngine (+1 more)

### Community 33 - "package.json"
Cohesion: 0.12
Nodes (17): devDependencies, typescript@^5.6.3, vitest@^2.1.4, typescript, vitest, name, pnpm, onlyBuiltDependencies (+9 more)

### Community 34 - "semanticRecall.ts"
Cohesion: 0.19
Nodes (9): memoryRouter, computeDenseEmbedding(), cosineSimilarity(), hashString(), MemoryFact, RecallResult, SEED_MEMORY_FACTS, semanticMemory (+1 more)

### Community 35 - "pushbulletService.ts"
Cohesion: 0.18
Nodes (8): formatPushText(), PushbulletService, PushHistoryEntry, PushResult, SendPushPayload, SendPushSchema, VerifyTokenResult, pushbulletRouter

### Community 36 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, declaration, esModuleInterop, module, moduleResolution, outDir, resolveJsonModule, rootDir (+6 more)

### Community 37 - "traffic/page.tsx"
Cohesion: 0.21
Nodes (11): trafficApi, FALLBACK_ROUTES, RouteAlertItem, RouteAlertsCard(), FALLBACK_RADARS, RadarPoint, SpeedCameraList(), CameraNode (+3 more)

### Community 38 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, declaration, esModuleInterop, module, moduleResolution, outDir, resolveJsonModule, rootDir (+6 more)

### Community 39 - "DailyTimelineWidget.tsx"
Cohesion: 0.24
Nodes (13): calendarApi, computeStatus(), DAILY_ANCHOR_BLOCKS, DailyTimelineWidget(), getInitialTimeline(), getTimelineCacheKey(), getTodayDateKey(), LessonItemDTO (+5 more)

### Community 40 - "ref_vitest"
Cohesion: 0.24
Nodes (3): DEFAULT_ALLOWED_ORIGINS, isOriginAllowed(), app

### Community 41 - "redisCache.ts"
Cohesion: 0.19
Nodes (7): CacheItem, CacheSerializationError, InvalidCacheKeyError, MAX_PREFIX_LENGTH, MAX_TOTAL_KEY_LENGTH, RedisCacheOptions, RedisConstructor

### Community 42 - "MASTER_SYSTEM_ARCHITECTURE.md — MASTER SYSTEM SPECIFICATION"
Cohesion: 0.17
Nodes (11): 1. WPROWADZENIE I TOPOLOGIA EKOSYSTEMU, 2. REJESTR WSZYSTKICH MODUŁÓW I STRUKTURA PLIKÓW, 3. PEŁNY SPIS NARZĘDZI MCP (INTERNAL MCP SERVER TOOLS — 29 NARZĘDZI), 4. GŁÓWNE ENDPOINTY REST API GATEWAY (PORT 5000), 5. AUDYT JAKOŚCI KODU I WERYFIKACJA REGRESYJNA, A. Repozytorium Root, B. `apps/api/` — API Gateway & Silnik Domenowy (Port 5000), C. `apps/worker/` — Asynchroniczny Kontener Roboczy (+3 more)

### Community 43 - "contracts.test.ts"
Cohesion: 0.18
Nodes (10): GoogleAuthPayloadSchema, EntityCardSchema, TransactionSchema, Grade, GradeModifierSchema, GradeSchema, SchoolCalendarEvent, SchoolCalendarEventSchema (+2 more)

### Community 44 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, clsx@^2.1.1, framer-motion@^12.4.10, lucide-react@^0.475.0, @omnidash/contracts@workspace:*, react@^19.0.0, react-router-dom@^7.2.0, tailwind-merge@^3.0.1 (+3 more)

### Community 45 - "server/page.tsx"
Cohesion: 0.31
Nodes (7): systemApi, DataBackupExportCard(), DockerContainerItem, DockerContainersGrid(), FALLBACK_CONTAINERS, MikrusLxcTelemetry(), ServerPage()

### Community 46 - "FinOpsCollector"
Cohesion: 0.24
Nodes (4): CoverageSourceStatus, FinOpsCollector, finOpsCollector, UsageMetric

### Community 47 - "ThemeContext.tsx"
Cohesion: 0.22
Nodes (7): react-dom@^19.0.0, ThemeContext, ThemeContextType, ThemeMode, ThemeProvider(), rootEl, react-dom

### Community 48 - "librusHtmlScraper.ts"
Cohesion: 0.36
Nodes (7): getContrastingTextColor(), parseGradeBox(), parseGradeValue(), parseLibrusGradesHtml(), parseSemesterCell(), ScrapedGradeDetail, ScrapedSubject

### Community 49 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, dev, preview, test, test:e2e, test:headed, test:ui (+1 more)

### Community 50 - "compilerOptions"
Cohesion: 0.22
Nodes (8): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, strict, include

### Community 51 - "ai.schema.ts"
Cohesion: 0.22
Nodes (8): AiRoleMode, AiRoleModeSchema, AiToolCall, AiToolCallSchema, ChatMessage, ChatMessageSchema, HarveyLeadQualification, HarveyLeadQualificationSchema

### Community 52 - "system.schema.ts"
Cohesion: 0.22
Nodes (8): Task, TaskPriority, TaskPrioritySchema, TaskSchema, TaskStatus, TaskStatusSchema, TelemetryMetrics, TelemetryMetricsSchema

### Community 54 - "entities.schema.ts"
Cohesion: 0.25
Nodes (7): EntityCard, EntityRelation, EntityRelationSchema, EntityType, EntityTypeSchema, HousingModel, HousingModelSchema

### Community 55 - "finance.schema.ts"
Cohesion: 0.25
Nodes (7): BudgetAllocation, BudgetAllocationSchema, BudgetEnvelope, BudgetEnvelopeSchema, Transaction, TransactionSource, TransactionSourceSchema

### Community 56 - "ref_zod"
Cohesion: 0.29
Nodes (5): GoogleAuthPayload, UserProfile, UserProfileSchema, UserRole, UserRoleSchema

### Community 57 - "traffic.schema.ts"
Cohesion: 0.29
Nodes (6): SpeedCamera, SpeedCameraSchema, SpeedCameraType, SpeedCameraTypeSchema, TrafficAlert, TrafficAlertSchema

### Community 58 - "contracts/src/index.ts"
Cohesion: 0.33
Nodes (4): AtticExercise, AtticExerciseSchema, AtticWorkoutSession, AtticWorkoutSessionSchema

### Community 59 - "Wydanie v4.0.0-rc.12 — 2026-11-05"
Cohesion: 0.50
Nodes (3): 1. Zakres Wydania, 2. Checklista Integralności, Wydanie v4.0.0-rc.12 — 2026-11-05

### Community 60 - "1. Zakres Wydania"
Cohesion: 0.50
Nodes (3): 1. Zakres Wydania, 2. Checklista Integralności, Wydanie v4.0.0-rc.13 — 2026-11-05

### Community 61 - "pnpm-workspace.yaml"
Cohesion: 0.50
Nodes (3): allowBuilds, esbuild, packages

## Knowledge Gaps
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DatabaseStore` connect `DatabaseStore` to `llmGateway.ts`, `SqliteStore`, `store.ts`, `REJESTR WYDAŃ`, `sqliteStore.ts`, `librusTimetableParser.ts`, `librusSyncService.ts`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `DatabaseStore` (e.g. with `Autonomiczny Agent AI (Groq gpt-oss-120b Function Calling), Silnik Skryptów Automatyzacji i Dzwonkowy Monitor Pushbullet` and `Zakres Wdrożenia i Zmian:`) actually correct?**
  _`DatabaseStore` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `PushbulletDispatcher` be split into smaller, more focused modules?**
  _Cohesion score 0.0517503805175038 - nodes in this community are weakly interconnected._
- **Why does `react` connect `GlassCard` to `useWorkoutState.ts`, `traffic/page.tsx`, `DailyTimelineWidget.tsx`, `App.tsx`, `client.ts`, `Badge`, `dependencies`, `server/page.tsx`, `lucide-react`, `ThemeContext.tsx`, `ChatInlineWidgets.tsx`, `private/page.tsx`, `finance/page.tsx`, `web/package.json`, `grades/page.tsx`, `school/page.tsx`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Should `llmGateway.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06233538191395961 - nodes in this community are weakly interconnected._
- **Why does `GlassCard()` connect `GlassCard` to `useWorkoutState.ts`, `traffic/page.tsx`, `DailyTimelineWidget.tsx`, `client.ts`, `Badge`, `server/page.tsx`, `lucide-react`, `private/page.tsx`, `finance/page.tsx`, `grades/page.tsx`, `school/page.tsx`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Should `GlassCard` be split into smaller, more focused modules?**
  _Cohesion score 0.08361581920903954 - nodes in this community are weakly interconnected._