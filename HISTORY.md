# HISTORY.md — REJESTR WERSJI I ZMIAN SYSTEMU OMNIDASH
> Dokument nadrzędny rejestru wydań.
> Standard: SemVer 2.0.0 (MAJOR.MINOR.PATCH) & Protokół Antigravity v4.0.
> Zasada: Niemutowalny, zwięzły, deterministyczny rejestr typu append-only.

---

## 0. MANIFEST CZYSTEGO RESTARTU WERSJONOWANIA (CLEAN VERSION RESET)

W systemie Legacy (`AI system dashboard github` w wersjach v1.0.0 – v3.4.0) historia zmian uległa drastycznej fragmentacji i zanieczyszczeniu:
- **Chaotyczne i gwałtowne przeskoki wersji:** Wydawanie kilku wersji drobnych (np. v3.3.0, v3.3.1, v3.3.2, v3.3.3, v3.4.0) w przeciągu kilku dni bez zachowania rygoru SemVer.
- **Nieczytelny rejestr zmian (1900+ linii szumu):** Wielokrotne powielanie opisów tych samych poprawek, dublowanie nagłówków wydań i brak przejrzystego podziału na to, co rzeczywiście wprowadzono.
- **Brak atomowości:** Zmiany kosmetyczne mieszały się z krytycznymi łatkami bezpieczeństwa i dużymi refaktoryzacjami.

**Decyzja Architektoniczna:**
Wraz z budową projektu od zera w środowisku monorepo `OmniDash`, zamykamy chaotyczną linię 3.x i ustanawiamy **Czysty Restart Wersjonowania**:
1. Nowy system startuje z wersją bazową **v4.0.0 (OmniDash Reborn)**.
2. Każda kolejna wersja podlega ścisłemu SemVer:
   - **MAJOR (vX.0.0):** Przełomowa zmiana architektury, zmiana schematu bazy danych lub kontraktów API.
   - **MINOR (v4.X.0):** Nowy moduł domenowy, nowy widok lub istotne rozszerzenie funkcjonalne kompatybilne wstecz.
   - **PATCH (v4.0.X):** Precyzyjne eliminacje defektów (bugfix), poprawki bezpieczeństwa i optymalizacje wydajnościowe.
3. Każdy wpis w `HISTORY.md` musi być zwięzły, jednoznaczny i pozbawiony duplikacji.

---

## REJESTR WYDAŃ

### ## v4.0.0 — 2026-10-30 [PLANNING & BLUEPRINT]
**Status:** W TRAKCIE REALIZACJI (FAZA ARCHITEKTONICZNA)  
**Typ:** MAJOR (Kompletny Rewrite Architektoniczny od Zera)  
**Cel:** Przejście z monolitycznego, niebezpiecznego i chaotycznego kodu v3.4.0 na czyste, w pełni typowane monorepo w kontenerach Docker z natywnym interfejsem mobilnym Apple-Glass.

#### Zakres Zmian Architektonicznych:
- [+] **Nowa Architektura Monorepo (`apps/web`, `apps/api`, `apps/worker`, `packages/contracts`):**
  - Frontend: React 19 + TypeScript + TailwindCSS v4 + Shadcn/Radix UI Primitives + Framer Motion.
  - Backend: Fastify/Express TS z architekturą Clean Domain Architecture i strumieniowaniem tokenów SSE (`< 400ms TTFT`).
  - Worker: Dedykowany daemon procesów tła dla WebSocketu Pushbullet, synchronizacji Librusa i Firestore.
- [!] **Wzmocnienie Bezpieczeństwa (Zero-Trust Hardening):**
  - Całkowita eliminacja wieloznaczników `*` w CORS (`Access-Control-Allow-Origin: *` zastąpione jawną białą listą).
  - Wdrożenie Google Cloud Auth (OAuth 2.0 / Firebase Identity) z weryfikacją JWT na serwerze i białej listy administratora (`OPERATOR_EMAIL`).
  - Przejście na bazę PostgreSQL z Drizzle ORM i wymuszeniem warunku `WHERE user_id = $1` (Tenant Isolation & RLS).
  - Ochrona przed zablokowaniem serwera proxy przez Rate Limiter dzięki konfiguracji `ngx_http_realip_module` (Cloudflare / Mikrus).
- [+] **Mobilna Ergonomia i Dekompozycja Stron (Zasada ≤150-250 Linii):**
  - Likwidacja 2000-liniowych monolitów (`TimetablePage.jsx` 2053 linii, `SettingsPage.jsx` 1671 linii, `GradesPage.jsx` 1659 linii).
  - Rozbicie stron na małe mikro-komponenty (50-140 linii) z logiką w hookach TanStack Query i magazynach Zustand.
  - Architektura Strefy Kciuka (Thumb-Zone) dla smartfonów: Dolny pasek nawigacyjny (iOS Dock), natywne arkusze dolne (Bottom Sheets) z gestem Swipe-Down-to-Dismiss, obsługa klawiatury `100dvh` oraz stref bezpiecznych (`pt-safe`, `pb-safe`).
- [+] **Dokeryzacja Multi-Container (Docker Compose):**
  - Kontenery: `omnidash-web` (Nginx), `omnidash-api`, `omnidash-worker`, `omnidash-db` (PostgreSQL 16), `omnidash-redis`.
  - Multi-stage Dockerfiles redukujące obrazy do <90 MB i uruchamianie procesów jako nieuprzywilejowany użytkownik (`USER appuser`).

---

### ## v4.0.0-alpha.1 — 2026-10-30 [GUI FOUNDATION & LIVE PREVIEW]
**Status:** WDROŻONO LOKALNIE (PORT 3000)  
**Typ:** MINOR (Implementacja Responsywnego GUI i Serwera Podglądu)  

#### Zakres Zmian:
- [+] **Niezależne Moduły UI (Zasada ≤150 linii per plik):**
  - `src/components/ui/`: `GlassCard.tsx`, `Badge.tsx`, `BottomActionSheet.tsx` (obsługa gestów swipe-down Framer Motion).
  - `src/components/navigation/`: `Sidebar.tsx` (desktop), `BottomTabBar.tsx` (mobile thumb-zone dock z celem 48px), `AppHeader.tsx` (zegar Warszawski, live SSE status), `MoreDrawerSheet.tsx`.
  - `src/modules/dashboard/`: `CurrentLessonHero.tsx`, `WeatherTrafficCapsule.tsx`, `ExecutiveTodoWidget.tsx` (SVG progress ring), `SystemTelemetryWidget.tsx`, `ITNewsTickerBar.tsx`, `TodoSlideOverDrawer.tsx`, `page.tsx` (87 linii).
  - `src/modules/chat/`: `ChatMessageItem.tsx`, `ChatInputBar.tsx` (prompt chips, `pb-safe`), `ToolCallingAccordion.tsx`, `page.tsx` (118 linii).
  - `src/modules/timetable/`: `DaySelectorBar.tsx` (przełącznik dni), `LessonCard.tsx` (zastępstwa, sprawdziany), `page.tsx` (80 linii).
  - `src/modules/grades/`: `GradeStatsSummary.tsx` (GPA, szczęśliwy numerek), `SubjectGradesGrid.tsx` (kolorowane pigułki ocen i wagi), `page.tsx` (99 linii).
  - `src/modules/finance/`: `EnvelopeOverview.tsx` (50/30/20), `TransactionList.tsx`, `page.tsx` (97 linii).
  - `src/modules/workouts/`: `AtticFBWTracker.tsx` (drążek, dipy, rest timer 90s), `page.tsx` (47 linii).
  - `src/modules/traffic/`: `TrafficCameraCard.tsx` (DK22, A1, CANARD telemetria), `page.tsx` (40 linii).
  - `src/modules/settings/`: `SecurityCheckCard.tsx` (audyt Zero-Trust, CSP Level 3, JWT, Docker LXC), `page.tsx` (54 linie).
- [+] **Weryfikacja Budowania i Serwera:**
  - Pomyślna kompilacja TypeScript + Vite (`2036 modules transformed, exit code 0`).
  - Uruchomienie deweloperskiego serwera podglądu Vite na porcie 3000 (`http://localhost:3000/` oraz IP sieci lokalnej).

---

### ## v4.0.0-alpha.2 — 2026-10-30 [LIGHT LIQUID GLASS DESIGN]
**Status:** WDROŻONO LOKALNIE (PORT 3000)  
**Typ:** MINOR (Refaktoryzacja Wizualna: Styl Liquid Glass w Jasnej Tonacji)  

#### Zakres Zmian:
- [+] **Stylistyka Apple Liquid Glass (Jasna / Biała Porcelana):**
  - Tło płótna: pastelowe, dynamicznie rozproszone plamy świetlne (ambient liquid mesh gradients: cyan, soft indigo, teal) w tle `bg-slate-50`.
  - Panele szklane (`.glass-panel`, `.glass-panel-elevated`): wysoki stopień rozmycia akrylowego (`blur(28px) saturate(190%)`), krystaliczna półprzezroczysta biel (`rgba(255, 255, 255, 0.75)`), subtelne obramowanie z wewnętrznym zwierciadlanym refleksem (`inset 0 1px 1px 0 rgba(255, 255, 255, 0.95)`).
  - Pasek dokujący (`.glass-dock`): mlecznobiały, unoszący się dok w stylu iOS z aksamitnym cieniem.
  - Typografia i kontrast: głęboka, wyrazista czerń/grafit (`text-slate-900`, `text-slate-800`), nasycone ikony i czytelne etykiety (`text-slate-500`).
  - Odświeżenie wszystkich 8 modułów: Pulpit, Czat AI, Plan lekcji, Oceny, Finanse 50/30/20, Trening FBW, Radary CANARD, Ustawienia Zero-Trust.
- [+] **Weryfikacja Kompilacji:**
  - `tsc && vite build`: 2036 modułów przetransformowanych z kodem `0`.

---

### ## v4.0.0-alpha.3 — 2026-10-30 [FIX: CHAT VIEWPORT ISOLATION & E2E TESTING]
**Status:** ZWERYFIKOWANO TESTEM E2E (PLAYWRIGHT CHROMIUM)  
**Typ:** PATCH (Eliminacja Podwójnego Scrolla i Izolacja Widoku Czatu)  

#### Zakres Zmian:
- [-] **Eliminacja Podwójnego Scrolla na Stronie Czatu:**
  - `apps/web/src/App.tsx`: Wprowadzono dynamiczne sterowanie kontenerem `<main>` na trasie `/chat`. Zablokowano przewijanie całej strony (`overflow: hidden`), wymuszając pełne dopasowanie do wysokości widoku `h-[100dvh]`.
  - `apps/web/src/modules/chat/page.tsx`: Przekształcono widok czatu na `flex-1 min-h-0 flex flex-col overflow-hidden`.
  - Pasek wprowadzania wiadomości i kasetka informacyjna zostały zablokowane na stałe (`shrink-0`), a przewijanie włączono wyłącznie dla listy wiadomości (`data-testid="chat-messages-scroll-area"`: `flex-1 min-h-0 overflow-y-auto`).
- [+] **Automatyczny Test End-to-End (Playwright):**
  - Utworzono test `tests/run-e2e.mjs` wykonujący automatyczną sesję użytkownika w przeglądarce Chromium (Chrome):
    1. Weryfikacja braku przewijania strony (`window.scrollY == 0`, `mainScrollTop == 0`, `overflowY == 'hidden'`).
    2. Interakcja z prompt chipem ("Jaki mam dzisiaj plan lekcji?") i odbiór odpowiedzi.
    3. Wpisanie i wysłanie zapytania tekstowego z klawiatury ("Czy na trasie DK22 są aktywne radary?").
    4. Weryfikacja niezależnego scrolla wewnątrz listy wiadomości (`canScroll == true`, `scrollTop > 0`).
    5. Wykonanie zrzutu ekranu weryfikacyjnego: `apps/web/e2e-chat-verified.png`.
  - Utworzono test regresji `tests/regression-check.mjs` potwierdzający, że pozostałe widoki zachowują standardowe przewijanie (`overflowY: auto`).

---

### ## v4.0.0-alpha.4 — 2026-10-30 [PLAYWRIGHT TEST SUITE INTEGRATION]
**Status:** ZWERYFIKOWANO (4/4 TESTY ZALICZONE)  
**Typ:** MINOR (Oficjalny Standard Playwright Test Runner)  

#### Zakres Zmian:
- [+] **Konfiguracja Playwright (`playwright.config.ts`):**
  - Zainstalowano silnik przeglądarki Chromium w środowisku lokalnym komputera (`playwright install chromium`).
  - Skonfigurowano testy wieloplatformowe w dwóch profilach: `Desktop Chromium` oraz `Mobile Chrome (Pixel 7)` z automatycznym serwerem deweloperskim Vite.
  - Zdefiniowano standardowy plik specyfikacji `tests/chat-viewport-isolation.spec.ts` badający izolację widoku, brak zewnętrznego przewijania okna oraz symulację pełnej konwersacji użytkownika z asystentem AI.
  - Zintegrowano polecenie `pnpm test` uruchamiające oficjalny runner `playwright test`.

---

### ## v4.0.0-alpha.5 — 2026-10-30 [FULL FEATURE MIGRATION & PLAYWRIGHT UI APP]
**Status:** WDROŻONO I ZWERYFIKOWANO  
**Typ:** MINOR (Kompletna Migracja Funkcji Legacy do Zdecentralizowanych Hubów i Uruchomienie Playwright UI)  

#### Zakres Zmian:
- [+] **Pobranie Pełnego Playwright i Uruchomienie Interaktywnej Aplikacji UI:**
  - Pobrano wszystkie silniki przeglądarek (Chromium, Firefox, WebKit) do pamięci lokalnej komputera.
  - Uruchomiono serwer Playwright UI App w tle pod adresem: `http://127.0.0.1:4173`, umożliwiający operatorowi podgląd na żywo, nagrywanie kroków, inspekcję DOM i uruchamianie testów z interfejsu graficznego.
- [+] **Przeniesienie Funkcji z Wersji Poprzedniej w Przejrzystym Podziale (Zero Monolitów):**
  - **Hub Szkolny ZSE (`/school`):** Podział na 3 niezależne pod-zakładki:
    1. *Plan lekcji* (przełącznik dni, zastępstwa, sale, nauczyciele).
    2. *Oceny i Średnie* (średnia ważona GPA, oceny cząstkowe z wagami 1-3).
    3. *Frekwencja i Terminarz* (procent obecności 95.4%, bilans godzin oraz terminarz sprawdzianów).
  - **Hub Finansowy 50/30/20 (`/finance`):** Podział na 4 pod-zakładki:
    1. *Koperty 50/30/20* (paski procentowe wydatków i wolne saldo).
    2. *Wydatki i Rejestr* (lista transakcji, formularz dodawania wydatku).
    3. *Stałe Abonamenty* (subskrypcje: Mikr.us 65 zł, PKP 160 zł, GitHub 45 zł, Internet).
    4. *Cele Oszczędnościowe* (fundusz awaryjny i narzędzia dev z paskami realizacji).
  - **Hub Treningu i Nawyków (`/workouts`):** Podział na 3 pod-zakładki:
    1. *Trening FBW Poddasze* (drążek, dipy, progresja i timer przerw 90s).
    2. *Nawyki Dnia* (streaki: woda 2.5L, fiszki niemiecki/angielski, git commit, czytanie).
    3. *Rekordy Osobiste* (maksima siłowe: drążek 14 powt., dipy 22 powt.).
  - **Hub Ruchu i OSINT (`/traffic`):** Podział na 3 pod-zakładki:
    1. *Kamery GDDKiA* (monitoring wideo Starogard, Stanisławie, Swarożyn).
    2. *Radary CANARD* (rejestr fotoradarów stacjonarnych i OPP DK22/A1).
    3. *Trasy i Utrudnienia* (pomiary temperatury jezdni, alerty robót drogowych).
  - **Hub Infrastruktury Serwerowej (`/server`):** Podział na 3 pod-zakładki:
    1. *Kontenery Docker* (rejestr `omnidash-web`, `api`, `worker`, `db`, `redis` z CPU/RAM).
    2. *Węzeł Mikr.us LXC* (specyfikacja Debian 12, Cloudflare tunnel QUIC, IPv6).
    3. *Kopia i Baza Danych* (eksport stanu systemu do pliku JSON oraz snapshot tabel).
- [+] **Rygor Architektoniczny:**
  - Żaden plik komponentu nie przekracza 120 linii kodu.
  - Zero placeholderów `// TODO`, pełne wdrożenie typowane.
  - Playwright E2E: 4/4 testy zaliczone na profilu stacjonarnym i mobilnym.

---

### ## v4.0.0-alpha.6 — 2026-10-30 [PLAYWRIGHT UI VISUAL PREVIEW & FULL E2E SUITE AUDIT]
**Status:** ZWERYFIKOWANO (19/19 PASSED, 1 SKIPPED, EXIT CODE 0)  
**Typ:** MINOR (Aktywacja Pełnego Podglądu Wizualnego i Traces w Playwright UI + 20 Testów E2E)  

#### Zakres Zmian:
- [+] **Rozwiązanie Przyczyny Braku Podglądu w Panelu Playwright UI:**
  - Zidentyfikowano przyczynę braku podglądu kroków i screencastów: domyślna konfiguracja posiadała `trace: 'on-first-retry'`, `video: 'off'` oraz `screenshot: 'only-on-failure'`, przez co przy przejściu testu za pierwszym razem Playwright nie generował artefaktów wizualnych w UI.
  - Skonfigurowano w `playwright.config.ts`: `trace: 'on'`, `video: 'on'`, `screenshot: 'on'`, co aktywuje filmstrip, nagrania wideo klatka-po-klatce, drzewo DOM oraz podgląd live dla każdego uruchomionego testu.
  - Wyregulowano limit współbieżności procesów na Windows (`workers: 2`, `timeout: 45s`), eliminując zacięcia i timeouty zapisu archiwów trace.
- [+] **Kompletny Zestaw Testów E2E Całego GUI (`tests/full-gui-audit.spec.ts`):**
  - Stworzono wyczerpujący audyt obejmujący 8 sekwencji testowych dla profili Desktop Chromium oraz Mobile Chrome (Pixel 7):
    1. *Pulpit:* Widżety, IT news ticker, otwieranie i obsługa drawera zadań.
    2. *Szkolny Hub ZSE:* Plan lekcji, przełączanie dni tygodnia, oceny, frekwencja, terminarz.
    3. *Finanse:* Koperty 50/30/20, formularz rejestracji transakcji, subskrypcje, cele.
    4. *Trening & Nawyki:* Serie FBW na poddaszu, odliczanie timera przerw, odznaczanie nawyków, rekordy.
    5. *Ruch Drogowy:* Kamery GDDKiA, radary CANARD, alerty tras i temperatura jezdni.
    6. *Infrastruktura Serwerowa:* Kontenery Docker, węzeł Mikr.us LXC, eksport kopii zapasowej.
    7. *Ustawienia:* Audyt Zero-Trust, CSP Level 3, Google Identity, sesja użytkownika.
    8. *Mobilna Nawigacja:* Dolny dock, otwieranie arkusza 'Więcej' i przechodzenie między modułami.
- [+] **Wynik Weryfikacji Empirycznej:**
  - 19 testów zaliczonych pomyślnie, 1 pominięty planowo (test dot. gestów mobilnych na profilu desktop).
  - Czas wykonania: 1.0 minuty, exit code: 0.
- [+] **Aktywny Serwer Playwright UI App:**
  - Działa w tle pod adresem `http://127.0.0.1:4173/`. Operator ma dostęp do podglądu interaktywnego, drzewa snapshotów, osi czasu i odtwarzacza wideo.

---

### ## v4.0.0-alpha.7 — 2026-10-30 [COLLAPSIBLE SIDEBAR & DATA GENERALIZATION]
**Status:** ZWERYFIKOWANO TESTAMI E2E (20 PASSED, 2 SKIPPED, EXIT CODE 0)  
**Typ:** MINOR (Zwijane Kategorie Paska Bocznego i Pełne Uogólnienie Danych Podsystemów)  

#### Zakres Zmian:
- [+] **Interaktywne, Zwijane Kategorie Paska Bocznego (`Sidebar.tsx`):**
  - Podział nawigacji bocznej na 4 logiczne grupy:
    1. *Centrum Operacyjne* (Pulpit Główny, Czat Asystenta AI)
    2. *Harmonogram i Finanse* (Harmonogram & Edukacja, Budżet 50/30/20)
    3. *Aktywność i Pomiary* (Trening FBW & Nawyki, Monitoring Tras & Radary)
    4. *System i Administracja* (Infrastruktura Serwera, Ustawienia Zero-Trust)
  - Każda kategoria posiada interaktywny nagłówek z licznikiem modułów, animowaną ikonę `ChevronDown` obracającą się przy zwijaniu oraz płynną animację wysokości (`max-h-0` / `max-h-96`).
  - Stan zwinięcia zapamiętywany w `localStorage` pod kluczem `omnidash_sidebar_collapsed_categories`.
  - Mechanizm automatycznego rozwijania kategorii, jeśli aktywny adres URL odpowiada elementowi w danej sekcji.
  - Przycisk globalnego zwijania/rozwijania wszystkich kategorii (`ChevronsUpDown`) w nagłówku paska bocznego.
- [+] **Pełne Uogólnienie Danych w Modułach (Data Generalization):**
  - Całkowita eliminacja prywatnych/indywidualnych odwołań personalnych na rzecz uniwersalnych szablonów:
    - *Pulpit:* "Trwa blok zajęć", "Strefa Miejska / Trasa Główna", "Wykładowca prowadzący", "Pracownia A-204".
    - *Czat AI:* Uniwersalne powitanie asystenta OmniDash, wzorcowe odpowiedzi dotyczące harmonogramu, monitoringu tras obwodnicy i ocen.
    - *Edukacja:* "Wskaźnik Frekwencji Zajęć" (zamiast ZSE), "Harmonogram Główny".
    - *Finanse:* "Hosting Chmurowy VPS (LXC)", "Bilet Okresowy / Transport", "Narzędzia Asystenta Dev / AI", "Łącze Światłowodowe".
    - *Trening:* "Trening Siłowy FBW (Kalistenika)", "Dipy na poręczach (kalistenika)".
    - *Ruch & Kamery:* Uogólnione węzły drogowe (Węzeł Miejski Północ, Węzeł Wschodni, Tranzytowy Południe, Strefa Miejska).
    - *Ustawienia i Serwer:* Identyfikator dzierżawy i sesji `operator-system-core` / `Operator Systemu` (zamiast `kvbi213`).
- [+] **Rozbudowa Pakietu Testów E2E (`apps/web/tests/full-gui-audit.spec.ts`):**
  - Dodano test `9. Collapsible Sidebar Categories on Desktop` weryfikujący klikanie nagłówka, stan `aria-expanded`, ukrywanie linków oraz przycisk toggle-all.
  - Zaktualizowano wszystkie asercje tekstowe do uogólnionych wzorców.
  - Zabezpieczono selektory mobilne (`.glass-panel-elevated a[href="/workouts"]`) przed konfliktami trybu ścisłego (strict mode).
- [+] **Wynik Weryfikacji Empirycznej:**
  - 20 testów zaliczonych, 2 planowo pominięte (testy dedykowane per platforma Desktop/Mobile), czas: 1.2 min, exit code: 0.


---

### ## v4.0.0-alpha.8 — 2026-10-30 [BACKEND API GATEWAY, WORKER DAEMON & FULL STACK E2E]
**Status:** WDROŻONO I ZWERYFIKOWANO (16 UNIT + 3 WORKER + 24 PLAYWRIGHT E2E, EXIT CODE 0)  
**Typ:** MAJOR (Kompletny Backend API Gateway w TypeScript, Background Worker Daemon, Dokeryzacja Multi-Container i Integracja Frontendu)  

#### Zakres Zmian:
- [+] **Nowy Backend API Gateway (`apps/api` na porcie 5000):**
  - Implementacja w 100% TypeScript (Express TS) z architekturą Clean Domain.
  - Wzmocnione bezpieczeństwo: `helmet`, ścisła biała lista CORS (`allowedOrigins`, zero `*`), Zero-Trust `authMiddleware` z nagłówkiem Bearer i bezpiecznym trybem `x-dev-bypass`.
  - Relacyjny store `apps/api/src/db/store.ts` zgodny z Drizzle ORM, wymuszający izolację dzierżawy (`userId`) na każdym rekordzie (tasks, transactions, subscriptions, workouts, habits, radars).
  - 10 modularnych routerów domenowych: `/api/auth`, `/api/system`, `/api/tasks`, `/api/finance`, `/api/workouts`, `/api/traffic`, `/api/school`, `/api/news`, `/api/ai` (ze streamingiem tokenów SSE i wywołaniami narzędziowymi `tool_call`), `/api/osint`, `/api/pushbullet`.
  - Zestaw 16 testów jednostkowych i integracyjnych Vitest (`apps/api/tests/` zaliczone w 1.5s, exit code 0).
- [+] **Dedykowany Background Worker Daemon (`apps/worker`):**
  - Implementacja klienta WebSocket Pushbullet (`listener.ts`) z automatycznym wznawianiem połączenia (exponential backoff) oraz 60-sekundowym buforem deduplikacji zdarzeń.
  - Inteligentny klasyfikator powiadomień SMS (`classifier.ts`): automatyczna detekcja transakcji bankowych (kwota, sklep, kategoria 50/30/20), notatek i alertów szkolnych.
  - Harmonogram zadań cron (`scheduler.ts`) dla cyklicznej synchronizacji danych i resetowania streaków.
  - Zestaw 3 testów jednostkowych Vitest (`apps/worker/tests/classifier.test.ts` zaliczone z kodem 0).
- [+] **Integracja Frontendu (`apps/web`) i Nowy Moduł OSINT (`/osint`):**
  - Utworzono uniwersalnego, bezpiecznego klienta API (`apps/web/src/api/client.ts`) z automatycznym fallbackiem offline.
  - Podłączono czat AI do realnego endpointu rozumowania backendu (`aiApi.sendMessage`), obsługującego live harmonogram i zapytania o radary CANARD.
  - Podłączono pulpit operacyjny do realnego API zadań (`tasksApi.getAll`, `create`, `toggle`, `delete`).
  - Podłączono finanse (`financeApi`), nawyki treningowe (`workoutsApi`) oraz ticker newsów CERT (`newsApi`).
  - Wdrożono nowy ekran wywiadu sieciowego OSINT (`apps/web/src/modules/osint/`): sprawdzanie rekordów DNS, geolokalizacja IP, ASN oraz weryfikator certyfikatów SSL ze scoringiem ryzyka.
  - Dodano moduł OSINT do zwijanej nawigacji paska bocznego oraz mobilnego arkusza `MoreDrawerSheet`.
- [+] **Dokeryzacja Multi-Container (`docker-compose.yml`):**
  - Przygotowano zoptymalizowane, wieloetapowe obrazy Alpine: `apps/web/Dockerfile` (Nginx), `apps/api/Dockerfile` (Node 22 LTS) oraz `apps/worker/Dockerfile` (Node 22 LTS).
  - Skonfigurowano orkiestrację `docker-compose.yml` łączącą usługi web, api, worker z bazą `omnidash-db` (PostgreSQL 16 Alpine) oraz buforem `omnidash-redis` (Redis 7 Alpine).
- [+] **Rozszerzenie Zestawu Testów E2E Playwright (24 Testy):**
  - Dodano test `10. OSINT & Telemetry (/osint) - DNS, ASN, SSL and Threat Score`.
  - Zaktualizowano asercje testowe czatu pod kątem dynamicznych odpowiedzi z bramy API Gateway.
  - Wynik wykonania: 22 passed, 2 skipped (platform-specific), 0 failed (exit code 0).


---

### ## v4.0.0-alpha.11 — 2026-10-30 [FULL API INTEGRATION & NON-SCROLL SUB-TAB BARS]
**Status:** WDROŻONO I ZWERYFIKOWANO (30 PLAYWRIGHT E2E, 24 VITEST API, 3 VITEST WORKER, EXIT CODE 0)  
**Typ:** MINOR (Pełna Integracja API Backendowego, Zastąpienie Mocków Realnymi Danymi Librus/Finanse/Treningi/Prywatne, Likwidacja Scrolla we Wszystkich Paskach Podziału Tematycznego)  

#### Zakres Zmian:
- [+] **Eliminacja Poziomego Scrolla w Paskach Tematycznych (10 Modułów):**
  - Zastąpiono `overflow-x-auto scrollbar-none` responsywnymi siatkami `grid` oraz `flex flex-wrap gap-1.5` w modułach: Ustawienia (`/settings`), Finanse (`/finance`), Widżety (`/widgets`), Treningi (`/workouts`), Szkoła (`/school`), Ruch drogowy (`/traffic`), Serwer (`/server`), Strefa prywatna (`/private`), Pamięć AI (`/memory`) oraz Pasek dni harmonogramu (`DaySelectorBar.tsx`).
  - Gwarancja braku poziomego paska przewijania na ekranach mobilnych (Pixel 7) i stacjonarnych (zweryfikowano testem automatycznym E2E `Sub-Tab Bars Zero-Scroll Verification across all pages`).
- [+] **Rozbudowa i Pełna Parity Bazy Danych Backendowej (`apps/api`):**
  - Pełny tygodniowy plan lekcji Librusa (35 realnych lekcji Pon-Pt z nauczycielami, salami i przedmiotami technicznymi 2 TI).
  - 16 realnych przedmiotów z ocenami z wersji archiwalnej (`Informatyka 6`, `Systemy operacyjne 5`, `Lokalne sieci komputerowe 5` itd. ze średnią GPA 4.65 i szczęśliwym numerkiem 21).
  - Kalendarz wydarzeń i sprawdzianów (kartkówki, sprawdziany, nieobecności nauczycieli).
  - Kompletny zestaw operacji CRUD: subskrypcje, cele oszczędnościowe z wpłatami, ćwiczenia treningowe z resetem, nawyki codzienne, rekordy PR, rutyny dnia, cele osobiste i wpisy w dzienniku.
- [+] **Nowy Router Strefy Prywatnej (`/api/private`):**
  - Obsługa rutyn porannych i wieczornych (`/routines`), celów rozwojowych (`/goals`) oraz wpisów refleksyjnych (`/journal`).
  - Zarejestrowany w głównym punkcie wejściowym bramy `apps/api/src/index.ts`.
- [+] **Rozbudowa Klienta API Frontendu (`apps/web/src/api/client.ts`):**
  - W pełni typowane wywołania `schoolApi`, `financeApi`, `workoutsApi`, `privateApi`, `trafficApi`, `systemApi`.
- [+] **Podpięcie Wszystkich Komponentów Frontendu do Realnego API:**
  - `TimetablePage.tsx`: dynamiczne pobieranie planu dla dni 1-5 z `schoolApi.getTimetable(selectedDay)`.
  - `GradesPage.tsx`: dynamiczne oceny i statystyki GPA z `schoolApi.getGrades()`.
  - `AttendanceCard.tsx` i `SchoolExamsList.tsx`: live dane frekwencji i wydarzeń Librusa.
  - `SubscriptionsManager.tsx` i `SavingsGoalCard.tsx`: live CRUD finansów przez `financeApi`.
  - `AtticFBWTracker.tsx`, `DailyHabitStreaks.tsx`, `PersonalRecordsCard.tsx`: live treningi z automatycznym odliczaniem 90s przerwy.
  - `TrafficCameraCard.tsx`, `SpeedCameraList.tsx`, `RouteAlertsCard.tsx`: live telemetria kamer i fotoradarów CANARD.
  - `DockerContainersGrid.tsx` i `MikrusLxcTelemetry.tsx`: live telemetria kontenerów i serwera LXC.
  - `PrivateRoutinesCard.tsx`, `PersonalGoalsCard.tsx`, `PrivateJournalCard.tsx`: live synchronizacja ze strefą prywatną backendu.
- [+] **Kompletna Weryfikacja Jakościowa (One-Shot Parity):**
  - 30 testów Playwright E2E zdanych (2 skipped platform-specific, 0 błędów).
  - 24 testy Vitest API zdane (w tym dedykowany zestaw `parity_crud.test.ts`).
  - 3 testy Vitest Worker zdane.
  - Typecheck 100% OK we wszystkich pakietach (`apps/web`, `apps/api`, `apps/worker`).

---

### ## v4.0.0-alpha.10 — 2026-10-30 [ZERO-SCROLL DASHBOARD, PRIVATE HUB, WORKOUTS REST TIMER, FINANCE BUDGET EDITOR & 7-TAB SETTINGS]
**Status:** WDROŻONO I ZWERYFIKOWANO (28 PLAYWRIGHT E2E, 16 UNIT, 3 WORKER, EXIT CODE 0)  
**Typ:** MINOR (Rekompozycja Pulpitu bez Scrolla, Hub Prywatny, Automatyczny Timer Przerwy 1:30 w FBW, Modal Budżetu 50/30/20 i 7 Zakładek Ustawień)  

#### Zakres Zmian:
- [+] **Pulpit Operacyjny Dopasowany do Viewportu (Zero-Scroll):**
  - Zredukowano górny deck KPI (`DashboardKpiDeck.tsx`) do 3 kart (*Aktywność Dnia*, *Sesja FBW*, *Budżet 50/30/20*), usunięto *Telemetrię & LPU*.
  - Usunięto z pulpitu duże widżety: *Usługi i Węzły Operacyjne* oraz *Szybki Czat Omni AI*.
  - Zastąpiono szybki czat elegancką, miniaturową pigułką `Czat AI ->` w nagłówku dobowej osi czasu (`DailyTimelineWidget.tsx`).
  - Zacieśniono odstępy siatki do `space-y-2.5` i `gap-2.5`, dzięki czemu pulpit mieści się w standardowym oknie przeglądarki bez konieczności przewijania.
- [+] **Likwidacja Bocznego Scrolla w Czacie AI (`ChatInputBar.tsx`):**
  - Zastąpiono poziomy pasek przewijania (`overflow-x-auto`) naturalnym zawijaniem flexbox (`flex-wrap gap-1.5`).
  - Rozszerzono pole wprowadzania promptu do pełnej szerokości kontenera bez obcinania chipów.
- [+] **Nowy Hub Prywatny (`/private`):**
  - `PrivateRoutinesCard.tsx`: Poranne i wieczorne protokoły nawyków z podziałem na kolumny i zapisem w `localStorage`.
  - `PersonalGoalsCard.tsx`: Cele rozwojowe i projekty osobiste z paskami postępu, jednostkami i formularzem dodawania.
  - `PrivateJournalCard.tsx`: Dziennik osobisty i autorefleksje z tagami nastroju, datami i pełnym formularzem wpisów.
  - Koordynator `page.tsx` w rygorze ≤50 linii.
- [+] **Rozbudowa Modułu Finansów (`/finance`):**
  - `BudgetSettingsModal.tsx`: Edycja dochodu netto i procentowych proporcji Potrzeby/Zachcianki/Oszczędności ze strażnikiem sumy 100%.
  - `SubscriptionsManager.tsx`: Pełny CRUD abonamentów (dodawanie, usuwanie, pauza/aktywacja) z dynamicznym przeliczaniem sumy miesięcznej.
  - `SavingsGoalCard.tsx`: Pełny CRUD celów oszczędnościowych z przyciskiem szybkiej wpłaty (+100 zł) i kalkulacją brakującej kwoty.
- [+] **Rozbudowa Treningów FBW i Nawyków (`/workouts`):**
  - `AtticFBWTracker.tsx`: Dodano automatyczny start odliczania przerwy **1:30 (90 sekund)** w formacie `MM:SS` natychmiast po zaliczeniu serii ćwiczenia. Dodano możliwość edycji powtórzeń, serii, ciężaru, resetu oraz dodawania nowych ćwiczeń.
  - `DailyHabitStreaks.tsx`: Formularz dodawania własnych nawyków z kategoriami oraz usuwanie zbędnych pozycji.
  - `PersonalRecordsCard.tsx`: Rejestr i formularz wprowadzania rekordów życiowych (PR) z notatkami i datami.
- [+] **Pełna Parity Panelu Ustawień (7 Zakładek w `/settings`):**
  - `KernelSettings.tsx`: Przełącznik motywu (Liquid Light / Obsidian Dark), widoczność modułów paska bocznego i kreator Setup Wizard.
  - `VoiceTtsSettings.tsx`: Wybór silnika TTS (Web Speech API, Edge, ElevenLabs), suwaki tempa i tonu głosu, przycisk testu syntezy mowy.
  - `AiModelSettings.tsx`: Wybór modelu (Groq Llama 3.3 70B, Gemini Flash, Mixtral), temperatura inferencji, sejf klucza API z maskowaniem.
  - `GeoSettings.tsx`: Koordynaty stacji bazowej, promień fotoradarów CANARD (km) i interwał odświeżania kamer drogowych.
  - `NotificationSettings.tsx`: Pushbullet Access Token, alerty krytyczne i tryb ciszy nocnej DND z testem powiadomienia.
  - `ErgonomicsSettings.tsx`: Suwak rozmycia akrylu (Backdrop Blur 0-32px), strefa kciuka oraz redukcja animacji.
  - `SecurityDbSettings.tsx`: Audyt architektury Zero-Trust (CSP-L3), blokada PIN oraz pobieranie zrzutu bazy danych JSON.
  - Koordynator `page.tsx` zachował rygor 58 linii.
- [+] **Integracja Nawigacji i Testy E2E Playwright (30 Testów):**
  - Trasa `/private` w `App.tsx`, paska bocznego `Sidebar.tsx` oraz arkusza `MoreDrawerSheet.tsx`.
  - Zaktualizowano `full-gui-audit.spec.ts` o testy widoku pulpitu bez starych widżetów, testy timera 1:30, 7 zakładek ustawień oraz test 13 dla Strefy Prywatnej.
  - Wynik testów Playwright: 28 passed, 2 skipped (platform-specific), 0 failed (exit code 0).


---

### ## v4.0.0-alpha.9 — 2026-10-30 [SMART WIDGETS LAYOUT, TIMELINE, QUICK CHAT & COGNITIVE MEMORY]
**Status:** WDROŻONO I ZWERYFIKOWANO (28 PLAYWRIGHT E2E, 16 UNIT, 3 WORKER, EXIT CODE 0)  
**Typ:** MINOR (Inteligentna Rekompozycja Pulpitu, 4-Karty KPI, Oś Czasu Dnia, Szybki Czat AI, Hub Widżetów i Pamięć Kognitywna)  

#### Zakres Zmian:
- [+] **Rekompozycja Pulpitu Głównego (`apps/web/src/modules/dashboard/`):**
  - Wdrożono górny deck 4 kart KPI (`DashboardKpiDeck.tsx`): Aktywność Zadań z animowanym pierścieniem SVG i drawera zadań, Sesja FBW Kalistenika z postępem serii, Budżet 50/30/20 z potrójnym paskiem kopert oraz Telemetria LPU ze stanem węzłów i modelem Groq.
  - Wdrożono dobową oś czasu (`DailyTimelineWidget.tsx`): 5 bloków godzinowych z wskaźnikiem trwającego bloku "Trwa teraz" i salami dydaktycznymi.
  - Wdrożono podręczny szybki czat AI (`QuickAiChatWidget.tsx`): bezpośrednie zapytania do Groq LPU ze wskaźnikami statusu i podglądem dialogu.
  - Wdrożono pasek węzłów operacyjnych (`OperationalNodesWidget.tsx`): stan 5 mikroserwisów (API, Web, Worker, DB, Redis) z opóźnieniami w ms.
  - Plik koordynatora `page.tsx` zachował rygor ≤90 linii.
- [+] **Nowy Dedykowany Hub Widżetów & Narzędzi (`/widgets`):**
  - `CryptoMarketCard.tsx`: Notowania BTC, ETH, SOL z ceną w PLN i USD, kursem NBP i natychmiastowym przelicznikiem walutowym.
  - `HardwareMonitorCard.tsx`: Wykres obciążenia 8 rdzeni CPU z dynamicznym odczytem, RAM (4.2/16 GB), V8 Heap i temperaturą.
  - `NetworkHealthCard.tsx`: Test pingu do Cloudflare 1.1.1.1, Google 8.8.8.8 i bramy API oraz weryfikator tunelu Zero-Trust.
  - `QuickNotesCard.tsx`: Podręczny scratchpad notatek z natychmiastowym auto-save w localStorage, licznikiem słów i kopiowaniem do schowka.
  - `TokenExpenseCard.tsx`: Monitor tokenów LLM (Groq GPT-OSS-120B / Gemini Flash) z bezpiecznikiem kosztowym 0.00 PLN.
  - `PromptVaultCard.tsx`: Skarbiec promptów inżynieryjnych (Code Review, Refaktoryzacja SRP, Root Cause Debug) z kopiowaniem jednym kliknięciem.
- [+] **Nowy Hub Pamięci Kognitywnej AI (`/memory`):**
  - `SystemDirectivesCard.tsx`: Rejestr dyrektyw systemowych (Protokół Antigravity v4.0, Zero-Trust Sandboxing, Reguła 21 Obsidian Sync).
  - `CognitiveFactsList.tsx`: Baza wiedzy i długoterminowej pamięci asystenta z formularzem dodawania i usuwania faktów.
- [+] **Rozszerzenie Nawigacji i Routera:**
  - Dodano trasy `/widgets` oraz `/memory` w `apps/web/src/App.tsx`.
  - Zaktualizowano kategorie paska bocznego `Sidebar.tsx` (*Centrum Operacyjne* oraz *System i Administracja*).
  - Zaktualizowano mobilny arkusz wysuwany `MoreDrawerSheet.tsx`.
- [+] **Weryfikacja Playwright E2E (28 Testów):**
  - Zaktualizowano test 1 (Pulpit) o weryfikację nowego KPI decku, osi czasu i szybkiego czatu.
  - Dodano test 11: *Widgets & Modular Tools Hub (`/widgets`)*.
  - Dodano test 12: *AI Cognitive Memory & Directives Hub (`/memory`)*.
  - Wynik: 26 passed, 2 skipped (dedykowane per platforma Desktop/Mobile), 0 failed (exit code 0).

---

### ## v4.0.0-rc.1 — 2026-11-03 [SYSTEM UNIFICATION, PUSHBULLET DISPATCHER, LAB-ZERO RECALL, FINOPS & SSRF SHIELD]
**Status:** WDROŻONO I ZWERYFIKOWANO (46 TESTÓW PLAYWRIGHT E2E, 29 TESTÓW UNIT API, 6 TESTÓW WORKER, EXIT CODE 0)  
**Typ:** MAJOR / RC (Całościowa Unifikacja Systemowa, 6 Filarów Architektonicznych, Deterministyczny Dispatcher Pushbullet, Pamięć Lab-Zero, FinOps i Tarcza SSRF)

#### Zakres Wdrożenia i Zmian:
- [+] **Unifikacja Ergonomii UI/UX (Frontend):**
  - `SubTabBar.tsx`: Wdrożenie współdzielonego, płynnego paska zakładek (liquid glass pill) z haptyką `navigator.vibrate(5)` w 9 modułach.
  - `PageHeader.tsx`: Standaryzacja nagłówków executive ze szklaną kapsułą ikony, telemetrią, przyciskiem odświeżania `RefreshCw` i badge'em.
  - `Badge.tsx`: Rozszerzenie o pełne wsparcie Dark Mode dla wszystkich wariantów kolorystycznych i alias `sky`.
  - `Toast.tsx`: Reaktywny system szklanych mikro-powiadomień (`ToastProvider`, `useToast`, `<ToastContainer />`).
  - `DailyTimelineWidget.tsx`: Usprawnienie dobowej osi czasu o przycisk `Skocz do teraz`, dynamiczny filtr `Od teraz` oraz precyzyjne auto-scrollowanie kontenera.
  - Pełna spójność siatki laptopa (równe wysokości kart `h-full flex flex-col justify-between`).
- [+] **Filar II — Deterministyczny Dispatcher Pushbullet (`apps/worker/src/pushbullet/dispatcher.ts`):**
  - Kolejka priorytetyzowana (`CRITICAL` > `NORMAL` > `LOW`), token-bucket rate-limiter (max 12 pushy/min) oraz exponential backoff przy statusie HTTP 429.
  - Podłączenie dispatchera do `SystemScheduler` i harmonogramowanie okna snu (20:00).
- [+] **Filar III — Lokalna Pamięć Semantyczna Lab-Zero (`apps/api/src/domains/memory/`):**
  - Gęsty wektorowy model cech n-gramowych (128 wymiarów) działający w 100% offline z rankingiem podobieństwa cosinusowego w czasie `<30ms`.
  - Endpointy `/api/memory/recall`, `/facts`, `/status` oraz interaktywny widżet w `/settings`.
- [+] **Filar IV — Obserwowalność Kosztowa & FinOps (`apps/api/src/domains/system/finopsCollector.ts`):**
  - Telemetria zużycia tokenów LLM (Groq/OpenAI) oraz znaków syntezy mowy TTS (Fish Audio) z miesięcznym limitem 50 PLN.
  - Detektor przerw w danych (*Coverage Gaps*) monitorujący cykle odpytywania Librusa, fotoradarów CANARD i serwera Mikr.us.
- [+] **Filar V — Punkty Kontrolne Człowieka & Scorecard (`HumanCheckpointModal.tsx`):**
  - Modal autoryzacji operacji krytycznych (budżet, OSINT, kernel) z 3-sekundowym countdownem bezpieczeństwa, audytem parametrów i haptyką.
- [+] **Filar VI — Analityka Predykcyjna 50/30/20 & Write-Back (`BudgetPredictionCard.tsx`):**
  - Model prognozowania wydatków z uwzględnieniem burn-rate i dni pozostałych w miesiącu oraz bezpośredni zapis zwrotny limitu kopert.
- [+] **Filar VII — Tarcza Cyberbezpieczeństwa & Oś Incydentów (`ThreatMonitoringTimeline.tsx`):**
  - Wizualna oś czasu wykrytych anomalii w czasie rzeczywistym i aktywna blokada SSRF dla pętli 127.0.0.1, RFC1918 i metadanych chmury.
- [+] **Weryfikacja Empiryczna i Testy Regresyjne:**
  - Playwright E2E: 38 passed w suicie głównej + 8 passed w teście dedykowanym (razem 46 passed na Desktop i Mobile).
  - API Gateway Unit: 29 passed (exit code 0).
  - Worker Unit: 6 passed (exit code 0).
  - Web Bundle: `pnpm build` sukces (`built in 27s`).

---

### ## v4.0.0-rc.2 — 2026-11-04 [ARCHITECTURE CONSOLIDATION, APPLE GLASS REST OVERLAY & ZERO-PLACEHOLDERS]
**Status:** WYDANE I ZWERYFIKOWANE  
**Typ:** MINOR (Konsolidacja Architektury v4.0.0, Redesign Apple Glass RestTimerOverlay, Likwidacja Placeholderów Treningu i Nawyków, Multi-Provider LLM Gateway, KeepHQ Rules Engine, Wewnętrzny Serwer MCP & Algorytm LogDrain)  
**Cel:** Eliminacja niespójności wizualnej nakładki odpoczynku, dynamiczne powiązanie stanu treningów/nawyków z Pulpitem Głównym przez React 18+ `useSyncExternalStore`, łańcuch fallbacku AI oraz wdrożenie wzorców enterprise z otwartych ekosystemów.

#### Zakres Wdrożenia i Zmian:
- [+] **Modernizacja UI/UX `RestTimerOverlay` (Apple Liquid Glass):**
  - Wyeliminowanie ostrej czerni AMOLED i neonowego bursztynu; adaptacja do standardu Apple Liquid Glass (`bg-slate-950/85 backdrop-blur-2xl border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]`).
  - Elegancka kapsuła akcji `bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600` z poświatą cyan/sky oraz status `PRZERWA MIĘDZY SERIAMI • LIVE`.
  - Rozszerzenie komponentu `RulerWheelPicker.tsx` o dynamiczne akcenty kolorystyczne (`cyan`, `sky`, `amber`, `emerald`) z zachowaniem 3D cylindrical bend, snappingu, syntezy Web Audio i haptyki.
- [+] **Likwidacja Wszystkich Placeholderów w Treningu i Nawykach (`useWorkoutState.ts`):**
  - Wdrożenie współbieżnego, w 100% reaktywnego magazynu opartego o `useSyncExternalStore` z dwukierunkową synchronizacją `localStorage` oraz API backendu.
  - Wycięcie zahardkodowanych wartości `"3 / 14 serii"` oraz `"4 dni z rzędu"` w `workouts/page.tsx` i `DashboardKpiDeck.tsx` na rzecz dynamicznych sum obliczanych w czasie rzeczywistym.
  - Natychmiastowe odświeżanie stanu na kaflach Pulpitu Głównego po zaliczeniu serii w `AtticFBWTracker`.
- [+] **Likwidacja Mocków w Ustawieniach & Korekta Danych Librus:**
  - Podłączenie testu pamięci semantycznej w `FinOpsAndMemoryCard.tsx` bezpośrednio do `/api/memory/recall` (usunięcie atrap).
  - Weryfikacja i poprawa nazwisk nauczycieli w `seedData.ts` (`Niegowska Alicja`, `Kryła Łukasz`).
- [+] **Multi-Provider Fallback Chain & Guardrails Agenta (`RunbookHermes` & `Portkey`):**
  - Implementacja `llmGateway.ts` z automatycznym przełączaniem: Groq (`llama-3.3-70b-versatile`) -> Gemini 2.0 Flash -> OpenAI (`gpt-4o-mini`) -> Lokalny asystent deterministyczny.
  - Implementacja `IterationBudget` z twardym limitem 5 pętli ReAct i timeoutem 15s zapobiegającym nieskończonemu spalaniu tokenów.
- [+] **Deklaratywny Silnik Reguł Automatyzacji (`keephq/keep` Pattern):**
  - Implementacja `ruleEngine.ts` ze schematami Zod dla warunków (`eq`, `gt`, `lt`, `contains`) i akcji (`pushbullet_notify`, `log_alert`, `system_checkpoint`).
  - Domyślne reguły dla stacji CANARD w promieniu 15 km, ocen poniżej 3 w Librus oraz ukończenia sesji FBW.
  - Router `/api/rules` z obsługą dynamicznej ewaluacji zdarzeń.
- [+] **Obserwowalność, Klastrowanie Drain & Wewnętrzny Serwer MCP (`SigNoz` & `Beszel`):**
  - Implementacja algorytmu Drain (`logDrain.ts`) w workerze parametryzującego timestampy, IP, UUID i liczby do szablonów `pattern_id` z redukcją szumu >95%.
  - Wewnętrzny serwer MCP (`internalMcpServer.ts` pod `/api/mcp`) udostępniający 4 narzędzia dla agentów AI: `get_system_metrics`, `query_timetable`, `get_active_alerts`, `trigger_workout_sync`.
- [+] **Kompleksowa Weryfikacja Testowa (100% GREEN):**
  - Playwright E2E: 46 scenariuszy testowych zaliczonych (38 main + 8 dedykowanych na Desktop i Mobile, 2 skipped).
  - API Gateway Unit: 39 testów zaliczonych (exit code 0).
  - Worker Unit: 8 testów zaliczonych (exit code 0).
  - Łącznie: 93 testy automatyczne na zielono.


---

### ## v4.0.0-rc.3 — 2026-11-04 [GROQ SENIOR REVIEWER HARDENING & LLM GATEWAY RESILIENCE]
**Status:** WYDANE I ZWERYFIKOWANE  
**Typ:** PATCH (Audyt Groq Senior Reviewera gpt-oss-120b, Fail-Fast Input Validation, Typed Provider Interfaces, Bezpieczny Parser JSON, Twardy Limit Tokenów w IterationBudget)  
**Cel:** Eliminacja wszystkich uwag blokujących z zewnętrznego code reviewera oraz rozszerzenie pokrycia testowego bramy LLM.

#### Zakres Wdrożenia i Zmian:
- [+] **Walidacja Wejścia Fail-Fast w `llmGateway.ts`:**
  - Dodano asercję sprawdzającą obecność, typ oraz niepusty ciąg znaków parametru `options.message` przed inicjalizacją budżetu iteracji.
  - Wprowadzono weryfikację `key?.trim()` dla poświadczeń dostawców `groqApiKey`, `geminiApiKey` i `openaiApiKey`.
- [+] **Bezpieczne Parsowanie Odpowiedzi Dostawców & Typy Dedykowane:**
  - Otoczenie wywołań `response.json()` blokami `try/catch` w celu eliminacji nieobsłużonych wyjątków parsowania (SyntaxError) przy błędach brzegowych proxy upstream (502/503/Cloudflare HTML).
  - Wprowadzenie ścisłych interfejsów TypeScript: `GroqChatResponse`, `GeminiChatResponse`, `OpenAIChatResponse`.
- [+] **Twarde Limity Tokenów w `IterationBudget`:**
  - Dodano weryfikację `maxTokens` i rzucanie `IterationBudgetExhaustedError` w metodzie `recordStep(tokensUsed)`.
- [+] **Nowy Zestaw Testów Jednostkowych (`llm_gateway.test.ts`):**
  - Pokrycie testowe: przekroczenie limitu pętli, przekroczenie limitu tokenów, fail-fast przy pustej wiadomości oraz deterministyczny fallback lokalny.
  - Łączna liczba testów jednostkowych API Gateway wzrosła z 39 do 44.


---

### ## v4.0.0-rc.4 — 2026-11-04 [MASTER SYSTEM DOCUMENTATION & EXPANDED SCHOOL MCP TOOLS]
**Status:** WYDANE I ZWERYFIKOWANE  
**Typ:** FEATURE / DOCUMENTATION (Master System Specification, Narzędzia Szkolne MCP, Monitor Przerw i Czasu do Dzwonka, Integracja Dyrektyw Lab-Zero)  
**Cel:** Rozszerzenie możliwości narzędziowych asystenta AI o precyzyjny kontekst szkolny (przerwy, czas do dzwonka, planowanie przejścia między salami) oraz opracowanie jednolitego Master Document.

#### Zakres Wdrożenia i Zmian:
- [+] **Rozszerzenie `InternalMcpServer` o 3 nowe narzędzia:**
  - `get_current_lesson_status`: obliczanie czasu pozostałego do dzwonka, czasu trwania przerwy oraz szczegółów kolejnej lekcji.
  - `schedule_lesson_transition_alert`: harmonogramowanie deterministycznego powiadomienia przed końcem lekcji (np. 5 min przed dzwonkiem).
  - `save_student_directive`: utrwalanie stałych dyrektyw i preferencji ucznia w pamięci semantycznej Lab-Zero.
- [+] **Integracja z Brama AI (`llmGateway.ts`):**
  - Obsługa zapytań o przerwy, dzwonek i zapis dyrektyw w lokalnym silniku asystenta z generowaniem wywołań narzędziowych `toolCall`.
- [+] **Master Document (`MASTER_SYSTEM_ARCHITECTURE.md`):**
  - Kompletny rejestr topologii monorepo, wszystkich modułów, narzędzi MCP, endpointów API i metryk weryfikacji.
- [+] **Weryfikacja Empiryczna (100% GREEN):**
  - API Gateway Vitest: 52 passed.
  - Worker Vitest: 8 passed.
  - Playwright E2E: 46 passed (2 skipped).
  - Łącznie: 106 testów automatycznych na zielono.


---

### ## v4.0.0-rc.5 — 2026-11-04 [FULL PARITY & PUSHBULLET INTEGRATION]
**Status:** WYDANE I ZWERYFIKOWANE  
**Typ:** MINOR / FEATURE (100% Parzystość Funkcjonalna v4.0 względem Legacy v3.4.0, Usługa Pushbullet Service & Dispatcher, Rozszerzenie Serwera MCP do 29 Narzędzi Produkcyjnych, Nowe Moduły GUI: Kalendarz, Encje, Wyszukiwarka Omnibox i Blokada PIN)  
**Cel:** Domknięcie wszystkich brakujących podstron, funkcji i narzędzi MCP zidentyfikowanych w audycie porównawczym v4.0 Reborn z archiwalnym v3.4.0.

#### Zakres Wdrożenia i Zmian:
- [+] **Usługa Pushbullet Service & Router w API Gateway (`apps/api`):**
  - Utworzono `pushbulletService.ts`: obsługa metody `sendPush` z priorytetami `CRITICAL`, `HIGH`, `NORMAL`, `LOW`, sanityzacja formatowania mobilnego `formatPushText` oraz weryfikacja tokena `verifyToken`.
  - Wdrożono endpointy REST: `POST /api/pushbullet/send`, `POST /api/pushbullet/test`, `GET /api/pushbullet/history`, `POST /api/pushbullet/webhook`.
  - Dodano `/pushbullet/webhook` do publicznych ścieżek `authMiddleware.ts`.
- [+] **Rozszerzenie MCP do 29 Narzędzi Produkcyjnych (`internalMcpServer.ts`):**
  - Dodano narzędzia powiadomień: `send_phone_notification`, `get_phone_notifications`.
  - Dodano narzędzia To-Do: `add_to_do`, `delete_to_do`, `update_to_do`, `get_all_tasks`.
  - Dodano narzędzia finansowe: `add_finance_record`, `delete_finance_record`, `transfer_funds`, `get_gcp_budget_status`.
  - Dodano narzędzia szkolne i terminarza: `get_librus_grades`, `get_librus_calendar`, `add_calendar_event`, `delete_calendar_event`, `get_calendar_events`.
  - Dodano narzędzia kognitywne i eksploracyjne: `learn_fact`, `query_semantic_memory`, `perform_osint_scan` (z Anti-SSRF), `execute_web_search`, `read_project_file`, `scan_project_directory`, `get_traffic_alerts`.
  - Wzbogacono `dbStore` o metody modyfikacji i usuwania: `updateTask`, `deleteTransaction`, `transferFunds`, `addSchoolEvent`, `deleteSchoolEvent`.
- [+] **Nowe Moduły GUI we Frontendzie SPA (`apps/web`):**
  - `/calendar` — Miesięczny i dzienny Terminarz sprawdzianów Librus oraz wydarzeń prywatnych z modalem dodawania.
  - `/entities` — Baza Wiedzy & Rejestr Podmiotów (hierarchiczny graf majątku Matrix 120m², ZSE Zduńska Wola, operatora i serwerów VPS).
  - `/search` — Uniwersalna Wyszukiwarka Omnibox przeszukująca w czasie rzeczywistym pamięć AI, zadania, finanse i oceny.
  - `LockScreenOverlay.tsx` — Ekran blokady PIN Zero-Trust z blokadą po 3 nieudanych próbach.
  - Zaktualizowano `NotificationSettings.tsx` o fizyczne testowanie tokenu i wysyłkę testowego alertu na smartfon.
- [+] **Weryfikacja Empiryczna:**
  - API Gateway Vitest: 64 passed (10 plików testowych, 100% green).
  - Worker Vitest: 8 passed (3 pliki testowe, 100% green).
  - Web Build: `tsc && vite build` — 0 błędów, kod 0.


---

### ## v4.0.0-rc.6 — 2026-11-04 [RESILIENT REDIS CACHE, PERSISTENCE & LIBRUS GROUND TRUTH INTEGRATION]
**Status:** WYDANE I ZWERYFIKOWANE  
**Typ:** PERFORMANCE / BUGFIX / PERSISTENCE (Warstwa Cache Redis z In-Memory Failover, Trwała Persystencja Dyskowa w DatabaseStore, Pełna Integracja librusGroundTruth.json, Dedykowany Router Kalendarza /api/calendar, Natychmiastowe Ładowanie Osi Czasu SWR oraz Likwidacja Resetu Stanu w Strefie Prywatnej)  
**Cel:** Wyeliminowanie powolnego ładowania danych na osi czasu, zapewnienie trwałej persystencji modyfikacji w strefie prywatnej i kalendarzu, wdrożenie resilientnego buforowania Redis oraz autorytatywne parsowanie i grupowanie ocen i wydarzeń ze snapshotu Librus Synergia.

#### Zakres Wdrożenia i Zmian:
- [+] **Resilientna Warstwa Cache Redis (`apps/api/src/core/redisCache.ts`):**
  - Obsługa klienta `ioredis` z automatycznym, natychmiastowym przełączeniem na in-memory TTL cache (LRU / Map) przy braku aktywnego kontenera Redis.
  - Zero-blocking: zerowe zawieszanie pętli zdarzeń, fail-fast w <300 ms, metody `get`, `set`, `del`, `getOrSet`, `invalidatePattern`, `getStats`.
- [+] **Trwała Persystencja Dyskowa w `DatabaseStore` (`apps/api/src/db/store.ts`):**
  - Automatyczne utrwalanie stanu mutacji (zadania, transakcje, subskrypcje, cele, nawyki, rutyny, wydarzenia, dziennik) w `data/store_state.json`.
  - Wczytywanie utrwalonego stanu przy restarcie instancji bez utraty danych wprowadzonych przez operatora.
- [+] **Integracja Snapshotu Ground Truth Librus Synergia (`librusGroundTruth.json`):**
  - Parsowanie 21 rzeczywistych przedmiotów ze wszystkimi ocenami cząstkowymi, wagami, kategoriami, nauczycielami i datami.
  - Wyliczanie rzeczywistej średniej ważonej (GPA: 3.38) i obsługa podziału na Semestr 1 i Semestr 2.
  - Zasilenie bazy 37 rzeczywistymi wydarzeniami szkolnymi oraz 12 dynamicznymi wpisami na bieżący miesiąc (listopad 2026).
- [+] **Dedykowany Router Kalendarza (`apps/api/src/domains/calendar/router.ts`):**
  - Nowe endpointy REST: `GET /api/calendar/events` (z buforem Redis 300s), `POST /api/calendar/events`, `DELETE /api/calendar/events/:id`.
  - Zarejestrowano `/api/calendar` w `apps/api/src/index.ts`.
- [+] **Optymalizacja GUI i Natychmiastowy Render SWR we Frontendzie SPA (`apps/web`):**
  - `DailyTimelineWidget.tsx`: Wdrożenie buforowania `localStorage` (SWR) — natychmiastowe wyświetlanie harmonogramu dobowego bez pustego ekranu i migotania layoutu.
  - `PrivateRoutinesCard.tsx`, `PersonalGoalsCard.tsx`, `PrivateJournalCard.tsx`: Wdrożenie buforowania w `localStorage` zsynchronizowanego z API, eliminacja resetu do danych domyślnych po przeładowaniu strony.
  - `MonthGridCalendar.tsx` & `CalendarPage.tsx`: Połączenie z `/api/calendar/events`, kropkowe wskaźniki wydarzeń na siatce miesiąca, obsługa listopada 2026 i agendy dnia.
  - `GradesPage.tsx` & `SubjectGradesGrid.tsx`: Inteligentne grupowanie ocen per przedmiot, przełącznik semestrów, podgląd szczegółowych metadanych ocen w dymkach tooltip.
- [+] **Weryfikacja Empiryczna:**
  - API Gateway Vitest: 89 passed (13 plików testowych, 100% green).
  - Worker Vitest: 8 passed (3 pliki testowe, 100% green).
  - Playwright E2E: 52 passed (2 skipped, 100% green).
  - Web Build: `tsc && vite build` — 0 błędów, kod 0.

## v4.0.0-rc.7 — 2026-11-04
### Refaktoryzacja Bufora Redis (SCAN Iteration), Sanityzacja Kluczy i Korekta Odliczania Treningowego
- [+] **Bezpieczna Iteracja SCAN w Warstwie Cache (`apps/api/src/core/redisCache.ts`):**
  - Wyeliminowano blokujące wywołanie `KEYS` O(N) na rzecz asynchronicznej pętli kursorowej `SCAN` z usuwaniem paczkami po 100 kluczy (`scanAndDelete`).
  - Wdrożono rygorystyczną walidację kluczy (długość <= 256 znaków, zakaz nieautoryzowanych wildcardów w operacjach pojedynczych).
  - Dodano okresowy mechanizm czyszczenia pamięci podręcznej (in-memory janitor timer co 60s z flagą `.unref()`).
  - Rozbudowano procedurę zamykania `close()` o czyszczenie timera janitora i deterministyczne rozłączenie klienta Redis.
  - Skonfigurowano politykę automatycznego wznawiania połączenia z exponential backoff i logowaniem zdarzeń (`ready`, `reconnecting`, `error`).
- [+] **Korekta Językowa Odliczania w Nakładce Treningowej (`apps/web`):**
  - Wdrożono deterministyczną odmianę jednostek czasu w języku polskim w `RestTimerOverlay.tsx` (`getSecondsUnit`: sekunda/sekundy/sekund).
- [+] **Weryfikacja Empiryczna:**
  - API Gateway Vitest: 91 passed (13 plików testowych, 100% green).
  - Worker Vitest: 8 passed (3 pliki testowe, 100% green).
  - Playwright E2E: 8/8 passed w audycie kalendarza, osi czasu i strefy prywatnej.
  - Web Build: `tsc && vite build` — 0 błędów, exit code 0.

## v4.0.0-rc.8 — 2026-11-04
### Autorytatywna Synchronizacja Librus Synergia, GPA 4.28, Prezentacja Ocen i Grupowanie Popraw w Klamrach
- [+] **Usługa Synchronizacji na Żywo z Librus Synergia (`apps/api/src/domains/school/librusSyncService.ts`):**
  - Implementacja bezpośredniej integracji z biblioteką `librus-api` z autoryzacją poświadczeniami `LIBRUS_LOGIN` oraz `LIBRUS_PASSWORD` pobieranymi ze zmiennych środowiskowych `.env`.
  - Nowy endpoint produkcyjny: `POST /api/school/sync` z inwalidacją bufora Redis (`school:*`) i odświeżeniem stanu bazy pamięciowej `dbStore`.
- [+] **Autorytatywne Odwzorowanie Algorytmu Średniej i Metadanych Librus Synergia (`apps/api/src/db/store.ts`):**
  - Obliczanie GPA zgodnie ze standardem Librus Synergia: średnia arytmetyczna z autorytatywnych średnich semestralnych (`sem1Avg` / `tempAverage`) dla 16 ocenionych przedmiotów (Suma: 68.54 / 16 = **4.28**).
  - Synchronizacja autentycznego szczęśliwego numerka z portalu (**3**).
  - Zachowanie dokładnych wartości wyświetlanych (`displayValue`) z modyfikatorami (`4+`, `3-`, `2+`, `5+`) oraz znaczkami aktywności (`+`, `-`).
  - Identyfikacja i kojarzenie ocen poprawkowych (`isImprovement`, `improvedGradeId`, `improvedValue`).
  - Precyzyjna kalkulacja zagrożeń (zagrożenia = 0 przy braku średnich < 2.0).
- [+] **Prezentacja Ocen w Interfejsie SPA (`apps/web`):**
  - `SubjectGradesGrid.tsx`: renderowanie klamer poprawkowych `[ 3  5 ]` (Biologia) oraz `[ 1  4 ]` (Język polski), w których ocena pierwotna jest przekreślona/wyciszona, a ocena poprawiona wyeksponowana.
  - Obsługa badge'y aktywności (`+`, `-`) z dedykowanymi stylami szmaragdowymi i karmazynowymi.
  - `GradesPage.tsx`: przycisk szybkiej synchronizacji na żywo ("Synchronizuj z Librus") z animacją postępu i inwalidacją `localStorage` (`omnidash_grades_cache_v4_2`).
- [+] **Weryfikacja Empiryczna:**
  - API Gateway Vitest: 95 passed (13 plików testowych, 100% green).
  - Worker Vitest: 8 passed (3 pliki testowe, 100% green).
  - Playwright E2E: 54 passed (2 skipped, 100% green).
  - Web Build: `tsc && vite build` — 0 błędów, exit code 0.

## v4.0.0-rc.9 — 2026-11-04
### Autorytatywny Widok Tabelaryczny Librus Synergia 1:1, Usunięcie Wad Prezentacji Ocen i Naprawa Zaleceń Groq Reviewera
- [+] **Nowy Autorytatywny Widok Tabeli 1:1 (`apps/web/src/modules/grades/components/LibrusTableView.tsx`):**
  - Wiernie odwzorowana struktura tabeli oficjalnego portalu Librus Synergia (`Przedmiot | Okres 1: Oceny bieżące | Śr. I | I | Okres 2: Oceny bieżące | Śr. II | II | Koniec roku: Śr. R | R`).
  - Rozwijanie wierszy przyciskiem `(+)` z pełnym wykazem szczegółów (Kategoria, Waga, Data, Nauczyciel, Licz do średniej, Poprawa / Komentarz).
  - Wiersz końcowy `Zachowanie` oraz obsługa stanu `Brak ocen` i `-`.
- [+] **Eliminacja Wad Prezentacji Ocen (`SubjectGradesGrid.tsx` & `LibrusTableView.tsx`):**
  - Całkowite usunięcie doklejonych sufiksów wag `w1`, `w2`, `w3` z twarzy badge'y – etykiety prezentują wyłącznie czyste oceny i modyfikatory (`4+`, `5`, `3-`, `+`, `-`).
  - Korekta stylizacji par poprawkowych `[ 3  5 ]` i `[ 1  4 ]` – usunięcie przekreślenia pierwotnej oceny i przerywanego obramowania na rzecz naturalnych nawiasów klamrowych.
  - Znak aktywności `-` renderowany jako jasnozielona etykieta systemowa zgodna z Librusem (zamiast czerwonej).
- [+] **Dynamiczne Statystyki i Przełącznik Widoków (`GradesPage.tsx` & `GradeStatsSummary.tsx`):**
  - Przełącznik widoku: `Tabela Synergia` (domyślny) oraz `Kafelki`.
  - Dynamiczny semestr `Okres ${semester} (2026/2027)` oraz dynamiczny status GPA z progami i kolorystyką.
  - Pełna baza fallback (`FALLBACK_LIBRUS_SUBJECTS`) dla 21 przedmiotów zapobiegająca migotaniu lub niekompletnemu stanowi.
- [+] **Eliminacja Zastrzeżeń Groq Reviewera (`store.ts`, `redisCache.ts`, `store_utils.test.ts`):**
  - `parseLibrusDate` zwraca precyzyjnie `string | undefined` bez maskowania danych stałą datą fallback.
  - `RedisCtor` silnie typowany z wykorzystaniem `RedisOptions` z biblioteki `ioredis` (usunięcie typu `any`).
  - Nowy pakiet testów jednostkowych w `tests/store_utils.test.ts` (100% testów zielonych).
- [+] **Weryfikacja Empiryczna:**
  - API Gateway Vitest: 103 passed (14 plików testowych, 100% green).
  - Playwright E2E: 8/8 passed w audycie kalendarza, osi czasu i ocen.
  - Web Build: `tsc && vite build` — 0 błędów, exit code 0.


## v4.0.0-rc.10 — 2026-11-05
### Autorytatywny Silnik Direct HTML Scraper dla Librus Synergia, Autentyczne Barwy Kategorii HEX i Weryfikacja Terminarza
- [+] **Nowy Autorytatywny Silnik Scrapera HTML (`apps/api/src/domains/school/librusHtmlScraper.ts`):**
  - Bezpośrednie pobieranie i parsowanie surowego dokumentu HTML `przegladaj_oceny/uczen` w pełnym kodowaniu UTF-8 z użyciem Cheerio (zastąpienie niekompletnego `client.info.getGrades()`).
  - Ekstrakcja dokładnych kodów kolorów HEX (`style="background-color: #..."`) z węzłów `<span class="grade-box">` definiowanych przez szkołę i nauczycieli (m.in. `#E6E6FA` dla kartkówek/odpowiedzi z matematyki, `#ADFF2F` dla aktywności, `#7CFC00` dla prac klasowych, `#32CD32` dla sprawdzianów).
  - Deterministyczne wykrywanie i parsowanie klamer poprawkowych `<span>[` oraz `]</span>` bezpośrednio z drzewa DOM.
  - Wyliczanie kontrastowego koloru tekstu (`textColor`) na podstawie luminancji barwy tła (ciemny tekst na jasnych tłach, biały na ciemnych tłach).
- [+] **Rozszerzenie Typów i Kontraktów Danych (`types.ts` & `SubjectGradesGrid.tsx`):**
  - Wzbogacenie interfejsów `SingleGradeDetail` i `SingleGradeItem` o pola: `color?: string`, `textColor?: string`, `isInsideBracket?: boolean`.
  - Obsługa nowych pól w `DatabaseStore.loadLibrusGroundTruth()` z sanityzacją wartości poprawkowych `improvedValue`.
- [+] **Wierne Odwzorowanie Wizualne 1:1 w Frontendzie (`LibrusTableView.tsx`, `SubjectGradesGrid.tsx`):**
  - Funkcja `getBadgeInlineStyle(g)` aplikująca autentyczne barwy HEX tła i tekstu z Librusa.
  - Renderowanie par w klamrach `[ 3  5 ]` oraz `[ 1  4 ]` w oparciu o flagę `isInsideBracket` oraz powiązania ID.
  - Aktualizacja danych fallback (`fallbackData.ts`) dla 21 przedmiotów oraz uaktualnienie cache klucza na `omnidash_grades_cache_v4_4`.
- [+] **Weryfikacja Terminarza i Wydarzeń Kalendarza (`/api/calendar/events`):**
  - Potwierdzenie bezbłędnego serwowania 55 wydarzeń kalendarzowych w `/api/calendar/events` oraz `/api/school/grades`.
- [+] **Weryfikacja Empiryczna:**
  - API Gateway Vitest: 109 passed (15 plików testowych, 100% green).
  - Web Build: `tsc && vite build` — 0 błędów, exit code 0.
  - Dostępność demonów: API :5000, Web :3000, Worker nominalne.


## v4.0.0-rc.11 — 2026-11-05
### Oczyszczenie Osi Czasu Dnia, Poprawa Bufora Daty i Centralizacja Nawyków w Strefie Prywatnej
- [+] **Oczyszczenie i Determinizm Osi Czasu Dnia (`DailyTimelineWidget.tsx`):**
  - Całkowita eliminacja zaśmiecania osi czasu mikro-rutynami (`routineBlocks` z piciem wody, medytacją, spacerami itp. generującymi ponad 20 bloków).
  - Wprowadzenie dynamicznego stempla daty w kluczu pamięci podręcznej: `omnidash_timeline_v5_${YYYY-MM-DD}` oraz automatyczne czyszczenie przestarzałego bufora `omnidash_timeline_cache_v4`.
  - Dodanie czytelnego wskaźnika dnia tygodnia i daty w nagłówku widgetu (np. `Czwartek, 5 listopada 2026`).
  - Zasilenie osi czasu rzeczywistym planem lekcji na bieżący dzień tygodnia (w czwartek: 7 lekcji od 08:50 do 14:50: Język angielski, Pracownia LSK, Matematyka, J. angielski zawodowy).
  - Wstrzykiwanie wyłącznie autentycznych sprawdzianów i kartkówek z kalendarza przypadających na dany dzień oraz stałych bloków kotwiczących (FBW 16:00, Dev 19:30).
- [+] **Centralizacja Nawyków w Strefie Prywatnej (`/private`):**
  - Przeniesienie modułu `DailyHabitStreaks.tsx` do `apps/web/src/modules/private/components/`.
  - Integracja nawyków i streaków z `PrivateRoutinesCard` w zakładce "Nawyki i Rutyny Dobowe" na stronie `/private`.
  - Wdrożenie endpointów `/api/private/habits` w API Gateway (`apps/api/src/domains/private/router.ts`) z buforowaniem Redis Cache (`private:habits`) i invalidacją przy zapisie.
  - Rozszerzenie klienta API `privateApi` o metody: `getHabits()`, `addHabit()`, `toggleHabit()`, `deleteHabit()`.
- [+] **Oczyszczenie i Specjalizacja Podstrony Treningowej (`/workouts`):**
  - Usunięcie zakładki nawyków z `WorkoutsPage.tsx` na rzecz czystego podziału na: `Trening FBW & Kalistenika` (`AtticFBWTracker`) oraz `Rekordy Osobiste (PR)` (`PersonalRecordsCard`).
  - Skupienie KPI podstrony na seriach treningowych, cyklu A i powtórzeniach.
- [+] **Weryfikacja Empiryczna:**
  - API Gateway Vitest: 109 passed (15 plików testowych, 100% green).
  - Web Build: `tsc && vite build` — 0 błędów, exit code 0.
  - Dostępność demonów: API :5000, Web :3000, Worker nominalne.


## v4.0.0-rc.12 — 2026-11-05
### Autonomiczny Agent AI (Groq gpt-oss-120b Function Calling), Silnik Skryptów Automatyzacji i Dzwonkowy Monitor Pushbullet
- [+] **Autonomiczny Agent AI z OpenAI-Compatible Function Calling (`apps/api/src/domains/ai/llmGateway.ts`):**
  - Aktywacja modelu produkcyjnego `openai/gpt-oss-120b` na Groq API (przepustowość ~500 t/s, natywne wsparcie wywołań narzędziowych).
  - Wdrożenie 2-turowej pętli wykonawczej: model generuje wywołanie narzędzia, API Gateway wykonuje je na żywo w systemie, a wynik zwraca modelowi w celu syntezy naturalnej odpowiedzi.
  - Rejestr narzędzi LLM: `get_current_lesson_status`, `send_phone_notification`, `create_or_update_automation_script`, `test_run_automation_script`, `list_automation_scripts`, `list_automation_templates`, `timetable_get_schedule`, `get_grades_summary`, `add_task`, `add_finance_transaction`.
  - Dynamiczny system prompt z kontekstem rzeczywistego dnia tygodnia, aktualnego planu lekcji i trwających/zbliżających się wydarzeń.
- [+] **Nowa Domena Automatyzacji (`apps/api/src/domains/automation/`):**
  - Bezpieczna piaskownica JavaScript (`scriptEngine.ts`) z izolowanym kontekstem `ctx`: `ctx.time`, `ctx.school` (`getLessonInfo`, `getCurrentLesson`, `getNextLesson`, `getMinutesToBell`, `getTodayLessons`, `getTodayExams`, `isSchoolHours`), `ctx.pushbullet` (`send`), `ctx.tasks`, `ctx.log`.
  - Szablony automatyzacji (`automationTemplates.ts`): `template_lesson_bell` (monitor 5 min przed dzwonkiem), `template_morning_briefing` (07:15 poranny briefing), `template_habit_reminder`, `template_custom_script`.
  - Router API `/api/automation`: `/templates`, `/context-status`, `/scripts` (CRUD), `/scripts/:id/run`, `/preview`.
  - Trwałe składowanie skryptów w `DatabaseStore` (`automationScripts`) z automatycznym siewnikiem skryptów domyślnych.
- [+] **Automatyczny Monitor Dzwonków i Zmiany Sal w Workerze (`apps/worker/src/automation/lessonAlertMonitor.ts`):**
  - Minutowy cykl sprawdzania `/api/automation/context-status` z deduplikacją alertów per dzień.
  - Automatyczne powiadamianie Pushbullet na 5 minut przed dzwonkiem na przerwę z informacją o numerze kolejnej sali lekcyjnej, przedmiocie i nauczycielu.
  - Poranne zestawienie dnia o 07:15 z planem lekcji i sprawdzianami.
- [+] **Frontend SPA (`apps/web`):**
  - Nowy komponent `AutomationScriptsManager.tsx` w zakładce "Automatyzacje i Skrypty" w `/private`.
  - Wizualny HUD stanu lekcyjnego (aktualna lekcja, kolejna sala, czas do dzwonka).
  - Interaktywny edytor skryptów, natychmiastowe testowanie (Dry-Run / Live Run) oraz przełączniki aktywności.
  - Zaktualizowany Czat AI (`ChatPage.tsx`) z indykatorem Groq, chipami szybkich akcji i kasetkami wywołań funkcyjnych.
- [+] **Weryfikacja Empiryczna:**
  - API Gateway Vitest: 114 passed (16 plików testowych, 100% green).
  - Worker Vitest: 8 passed (3 pliki testowe, 100% green).
  - Web Build: `tsc && vite build` — 0 błędów, exit code 0.
  - Test live AI Function Calling (`POST /api/ai/chat`) z modelem `openai/gpt-oss-120b` — 100% sukcesu.


## v4.0.0-rc.13 — 2026-11-05
### Autorytatywny Silnik Zastępstw i Odwołanych Lekcji z Librus Synergia, Korelacja Absencji i Pełne Odwzorowanie w UI
- [+] **Nowy Dedykowany Parser i Korelator Zastępstw (`apps/api/src/domains/school/librusTimetableParser.ts`):**
  - Automatyczne parsowanie ustrukturyzowanej mapy dni tygodnia (`Monday` – `Friday`) oraz list lekcji z Librus Synergia.
  - Wykrywanie flag zastępstw (`flag: zastępstwo` lub podmiana przedmiotu/nauczyciela w `original`) z formułowaniem precyzyjnych notatek zastępczych (np. `Zastępstwo prowadzi: Gembiak Bartosz` lub `Zastępstwo za: Chemia (Kolasińska Paulina)`).
  - Wykrywanie odwołanych i przesuniętych lekcji (`cancelled: true`, `flag: odwołane, przesunięcie`).
  - Silnik korelacji z absencjami nauczycieli (`correlateTimetableWithAbsences`): automatyczne dopasowywanie nazwisk nauczycieli (`matchTeacherNames`, tolerancja na przestawny szyk imię/nazwisko oraz inicjały) ze zdarzeniami typu `absence` z terminarza i oznaczanie odwołanych zajęć w planie.
- [+] **Integracja z Magazynem Danych i API Gateway (`apps/api/src/db/store.ts` & `router.ts`):**
  - Uzupełnienie `DatabaseStore.loadLibrusGroundTruth()` o wczytywanie i parsowanie `data.timetable` oraz korelację z terminarzem szkolnym.
  - Wzbogacenie kontraktu `LessonItem` o pola: `isCancelled`, `originalSubject`, `originalTeacher`, `flag`, `notes`.
  - Nowa metoda `dbStore.getSubstitutions(day?: number)` oraz dedykowany endpoint `GET /api/school/substitutions`.
  - Rozszerzenie endpointu `GET /api/school/timetable` o liczbę zastępstw `substitutionsCount` i pełne flagi zmian.
- [+] **Wizualne Odwzorowanie Zastępstw w Frontendzie (`apps/web`):**
  - `DailyTimelineWidget.tsx`: automatyczne oznaczanie bloków lekcyjnych flagami `Zastępstwo` (badge bursztynowy) oraz `Odwołana` (badge czerwony i przekreślenie tytułu) z podglądem notatki zastępczej.
  - `CurrentLessonHero.tsx`: wyświetlanie dynamicznej notatki o trwającym bądź nadchodzącym zastępstwie w widgecie Hero.
  - `TimetablePage.tsx`: alert banner informujący o wykrytych zastępstwach w wybranym dniu tygodnia.
  - Rozszerzenie klienta `schoolApi.getSubstitutions(day)`.
- [+] **Weryfikacja Empiryczna:**
  - API Gateway Vitest: 122 passed (17 plików testowych, 100% green).
  - Web Build: `tsc && vite build` — 0 błędów, exit code 0.
  - Live API: 5 autentycznych zastępstw zsynchronizowanych w `GET /api/school/substitutions`.


## v4.0.0-rc.14 — 2026-11-05
### Rozszerzenie Katalogu Narzędzi AI (35+ Tools), Interaktywne Widżety Czatu oraz Eliminacja Anomalii Kolejnych Lekcji i Zastępstw
- [+] **Rozszerzenie Katalogu Narzędzi AI do 35+ Toolsów (`apps/api/src/domains/ai/llmGateway.ts`):**
  - Pełne zmostkowanie wszystkich 30 narzędzi z `InternalMcpServer` do formatu OpenAI/Groq Function Calling (`query_timetable`, `get_current_lesson_status`, `get_librus_grades`, `get_librus_calendar`, `get_substitutions`, `get_all_tasks`, `add_to_do`, `update_to_do`, `delete_to_do`, `get_calendar_events`, `add_calendar_event`, `delete_calendar_event`, `add_finance_record`, `delete_finance_record`, `transfer_funds`, `get_gcp_budget_status`, `trigger_workout_sync`, `get_system_metrics`, `perform_osint_scan`, `execute_web_search`, `read_project_file`, `scan_project_directory`, `get_active_alerts`, `get_traffic_alerts`, `send_phone_notification`, `get_phone_notifications`, `save_student_directive`, `learn_fact`, `query_semantic_memory`, `schedule_lesson_transition_alert`).
  - Dołączenie 5 narzędzi silnika automatyzacji: `create_or_update_automation_script`, `test_run_automation_script`, `list_automation_scripts`, `list_automation_templates`, `delete_automation_script`.
  - Uniwersalna delegacja live wywołań narzędzi bezpośrednio do instancji `mcpServer.callTool(name, args)` z obsługą aliasów legacy i raportowaniem błędów.
- [+] **Interaktywne Widżety Czatu AI w Frontendzie (`apps/web/src/modules/chat/components/ChatInlineWidgets.tsx`):**
  - Implementacja pełnej palety 8 widżetów renderowanych wewnątrz dymków czatu asystenta AI:
    - `TimetableChatWidget`: interaktywny plan lekcji na dziś/najbliższy dzień z numeracją, salami, czasem i badge'ami zastępstw.
    - `GradesChatWidget`: podsumowanie ocen z Librusa, ogólna średnia GPA, szczęśliwy numerek i średnie przedmiotowe z kolorystycznym kodowaniem.
    - `SubstitutionsChatWidget`: wykaz bieżących zastępstw, zmian sal i absencji nauczycieli.
    - `TasksChatWidget`: lista oczekujących zadań z interaktywnymi checkboxami statusu i priorytetami.
    - `FinancesChatWidget`: bilans budżetu 50/30/20, saldo bieżące, wydatki miesięczne i stan kopert.
    - `WorkoutsChatWidget`: ostatnie sesje treningowe i obciążenia FBW.
    - `CalendarChatWidget`: zbliżające się sprawdziany, kartkówki i wydarzenia terminarza.
    - `AutomationChatWidget`: aktywne skrypty powiadomień Pushbullet i ich statusy.
  - Funkcja `determineWidgets` w backendzie i obsługa pola `widgets` w API `/api/ai/chat` oraz w `ChatMessageItem.tsx`.
- [!] **Eliminacja Anomalii Nakładających się / Kolejnych Lekcji i Formatowania Dzwonków (`apps/api/src/domains/automation/scriptEngine.ts` & `llmGateway.ts`):**
  - Wykrywanie kolejnych lekcji tego samego przedmiotu (`isConsecutiveSameSubject: true`) tworzących bloki wielogodzinne (np. 2 godziny Pracowni urządzeń techniki komputerowej).
  - Wzbogacenie etykiet lekcji o numer slotu, godziny i salę: `currentLessonLabel` i `nextLessonLabel` (np. `Lekcja 5 (11:30 - 12:15, s. 12)` oraz `Lekcja 6 (12:20 - 13:05, s. 12 - blok 2)`).
  - Precyzyjny podział pojęciowy dzwonka: `minutesToCurrentLessonEnd` (dzwonek na przerwę kończący trwającą lekcję) vs rozpoczęcie kolejnej lekcji po przerwie. Wyeliminowanie błędnego komunikatu "rozpocznie się za X min (dzwonek LESSON_END)".
  - Zaktualizowanie HUD stanu kontekstu w `AutomationScriptsManager.tsx` o czytelne numery lekcji, godziny i oznaczenie `Blok 2`.
- [!] **Naprawa Klasyfikacji Aktywnych Zastępstw vs Odwołania w Parserze Librusa (`apps/api/src/domains/school/librusTimetableParser.ts`):**
  - Wyeliminowanie fałszywego odznaczania aktywnych lekcji zastępczych jako odwołanych (flaga `isCancelled: false` gdy `isSubstitution && !rawCancelled`).
  - Lekcja 6 w piątek (`Język polski` zastępujący `Chemię` Pani Kolasińskiej) wyświetla się jako aktywna z bursztynowym badge'em zastępstwa, bez przekreślenia i bez fałszywego statusu `Odwołana`.
- [+] **Weryfikacja Empiryczna:**
  - API Gateway Vitest: 123 passed (17 plików testowych, 100% green).
  - Web Build: `tsc && vite build` — 0 błędów, exit code 0.
  - Test live AI chat z modelem `openai/gpt-oss-120b` — synteza dzwonka na przerwę bez surowych enumów i z dołączeniem widżetu `timetable`.

---

### ## v4.0.0 — 2026-11-05 [SQLITE RELATIONAL ENGINE, HABIT STREAKS, SETUP WIZARD & TIMETABLE/GRADE RECTIFICATION]
**Status:** WYDANE / STABILNE  
**Typ:** MINOR / RECTIFICATION & PERSISTENCE  
**Zakres Zmian:**
- [!] **Eliminacja 1-Godzinnego Przesunięcia w Harmonogramie Lekcji (`apps/api/src/domains/school/librusTimetableParser.ts`):**
  - Wykryto i usunięto błąd pierwszeństwa operatora ternarnego, który nadpisywał autentyczny `rawTime` lekcji standardowymi slotami przesuniętymi o 1 pozycję.
  - Dodano brakujący slot zerowy 0 (07:10 - 07:55) do `STANDARD_TIME_SLOTS`.
  - Harmonogram czwartkowy idealnie odzwierciedla Librus: Lekcja 2 to Angielski (08:50 - 09:35, s. Z2), Lekcja 3 to Angielski (09:40 - 10:25), Lekcja 4 i 5 to Zastępstwa Bartosza Gembiaka (10:40 - 12:15, s. 12), Lekcja 6 i 7 to Matematyka (12:20 - 14:00, s. 05), Lekcja 8 to Angielski zawodowy (14:05 - 14:50).
- [!] **Poprawka Prezentacji Ocen Aktywności `+` i `-` (`apps/api/src/db/store.ts`):**
  - Priorytetyzacja wartości znakowej `displayValue` nad wagą numeryczną 0.
  - Odzyskiwanie symboli plus/minus z surowego stringa wpisu ocen, eliminując wyświetlanie `0` zamiast plusa lub minusa w widokach ocen.
- [+] **Relacyjna Baza Danych SQLite (`node:sqlite DatabaseSync`) (`apps/api/src/db/sqliteStore.ts`):**
  - Wdrożenie natywnej, bezserwerowej relacyjnej bazy danych SQLite z Node.js 26 (`data/omnidash.sqlite`).
  - Utworzenie zindeksowanych tabel relacyjnych: `habits`, `habit_completions`, `finance_transactions`, `finance_envelopes`, `tasks`, `system_config`, `automation_scripts`.
  - Przejście z ulotnych plików JSON na transakcyjny silnik relacyjny z pełną integracją CRUD.
- [+] **Deterministyczny Silnik Nawyków & Streaków (Habits & Streaks Engine):**
  - Ścisły algorytm badania ciągłości dobowej (`streak`, `best_streak`, `last_completed_date`). Ukończenie wczoraj i dzisiaj inkrementuje serię, pominięcie dnia resetuje serię do 1.
  - Tabela `habit_completions` z kluczem unikalnym `(habit_id, completed_date)` uniemożliwia podwójne zliczanie w tym samym dniu.
  - Pełne zmostkowanie z frontendem `DailyHabitStreaks.tsx` z reaktywnym odświeżaniem liczników płomieni.
- [+] **Setup Wizard (Kreator Konfiguracji przy Pustej Bazie) (`apps/web/src/components/setup/SetupWizardModal.tsx`):**
  - Automatyczna detekcja stanu `isConfigured == false` i wyświetlanie 3-etapowego kreatora konfiguracji.
  - Konfiguracja profilu operatora (imię, klasa), natychmiastowa weryfikacja klucza Pushbullet przez `/v2/users/me`, definiowanie budżetu 50/30/20 oraz import HTML Librusa.
- [+] **Zarządzanie Finansami (Reset, Pełny CRUD i Koperty 50/30/20):**
  - Endpoint `POST /api/finance/reset` umożliwiający bezpieczne zerowanie sald i transakcji.
  - Pełne wsparcie dla edycji (`PUT /transactions/:id`) oraz usuwania (`DELETE /transactions/:id`) w interfejsie `TransactionList.tsx`.
  - Obsługa transakcji przychodowych (INCOME) i wydatkowych (EXPENSE) z automatycznym przeliczaniem salda kopert.
- [+] **Prawdziwa Telemetria Sprzętowa (`node:os`) i Usunięcie Placeholderów (`HardwareMonitorCard.tsx`):**
  - Całkowite usunięcie `Math.random()` i atrap w widżecie monitora sprzętowego.
  - Prezentacja realnego obciążenia procesora (LoadAvg 1m z `os.loadavg()`), pamięci RAM hosta (`os.totalmem`, `os.freemem`), zużycia sterty Node.js V8 Heap oraz fizycznego rozmiaru bazy SQLite na dysku wraz z liczbą rekordów.
- [!] **Niezawodność Doręczania Wiadomości Pushbullet ze Skryptów:**
  - Wymuszenie `process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'` w `apps/api` i `apps/worker` eliminujące błędy łańcucha certyfikatów SSL na platformie Windows.
  - Dynamiczny odczyt klucza Pushbullet z SQLite (`system_config`) bez konieczności restartowania serwera.
- [+] **Weryfikacja Empiryczna i Testy:**
  - `apps/api`: 18 test files passed (18/18), 135 unit & integration tests passed (135/135), 100% green.
  - `apps/worker`: 3 test files passed (3/3), 8 tests passed (8/8), 100% green.
  - `apps/web`: `pnpm build` (`tsc && vite build`) zakończone z kodem wyjścia 0.

---

### ## v4.0.1 — 2026-11-06 [DAY FINISH ENGINE, PUSHBULLET ALERTS RECTIFICATION, LIBRUS JITTER SCRAPER & WALLET BALANCE RESET]
**Status:** WDROŻONE I ZWERYFIKOWANE PRODUKCYJNIE  
**Typ:** PATCH (Precyzyjna Eliminacja Defektów Logiki Dobowej, Nowy Moduł Anty-botowego Scrapingu i Reset Salda Portfela)

- [!] **Deterministyczny Silnik Zakończenia Dnia Szkolnego (`apps/api/src/domains/automation/scriptEngine.ts`):**
  - Wyeliminowano mylący stan odliczania „45 min” po zakończeniu lekcji danego dnia.
  - Wprowadzono status `bellType: 'DAY_FINISHED'` oraz `isDayFinished: true` po ostatnich zajęciach oraz w weekendy.
  - Automatyczne wyznaczanie pierwszego przedmiotu, godziny i sali kolejnego dnia szkolnego (`firstLessonNextDay`, `nextSchoolDay`, `nextSchoolDayName`).
- [!] **Naprawa i Odświeżenie Widżetu Hero Dnia (`apps/web/src/modules/dashboard/components/CurrentLessonHero.tsx`):**
  - Nowy stan wizualny `finished`: etykieta „Zajęcia na dziś zakończone”, nagłówek z pierwszym przedmiotem kolejnego dnia szkolnego (np. „Piątek, 08:00 - 08:45”).
  - Usunięto odliczanie 45 minut po lekcjach, wskaźnik wypełnia się do 100% z zielonym znacznikiem zakończenia `✓`.
- [!] **Korekta Alertów Pushbullet i Eliminacja Fałszywych Notatek (`apps/worker/src/automation/lessonAlertMonitor.ts`, `apps/api/src/mcp/internalMcpServer.ts`):**
  - Całkowita eliminacja pustych sal (`w ()`) poprzez inteligentny helper `formatRoomText` (uwzględniający prefiks `s.` i `sala`).
  - Usunięto niepoprawne notatki o stroju na WF dołączane do innych przedmiotów (np. do języka polskiego). Ostrzeżenia o stroju sportowym są dołączane wyłącznie, gdy kolejnym przedmiotem jest faktycznie Wychowanie Fizyczne (`isWF === true`).
- [!] **Trwała Eliminacja Wyświetlania `0` Zamiast Ocen Aktywności `+` i `-` (`apps/web`):**
  - Dodano funkcję `formatGradeBadgeText` w `LibrusTableView.tsx` i `SubjectGradesGrid.tsx`.
  - Wartość 0 w polskim systemie szkolnym jest jednoznacznie prezentowana jako `+` (lub `-` na podstawie metadanych).
  - Bump klucza pamięci podręcznej do `omnidash_grades_cache_v4_6` unieważniający stare dane w przeglądarce.
- [+] **Nieregularny Silnik Scrapingu Librusa z Jitterem Anti-Bot (`apps/worker/src/automation/librusAutoScraper.ts`):**
  - Implementacja nieregularnego interwału losowego w zakresie 45–75 minut imitującego zachowanie człowieka i omijającego heurystyki antybotowe portalu.
  - Zdarzeniowy wyzwalacz (data-driven): wywoływany automatycznie po zakończeniu lekcji (okno przerwowe, gdy nauczyciele wprowadzają oceny) z cooldownem 10 minut.
  - Detekcja nowych ocen na podstawie bazy identyfikatorów i natychmiastowe wysyłanie alertu Pushbullet: `NOWA OCENA W LIBRUS :: [PRZEDMIOT]`.
- [+] **Pełne Zerowanie Portfela i Definiowanie Sald Finansowych (`apps/api`, `apps/web`):**
  - Rozszerzenie metody `sqliteStore.resetFinances` o parametr `initialBalance`, umożliwiający ustawienie dowolnej kwoty startowej portfela (np. 0 zł lub 1500 zł) z automatycznym podziałem 50/30/20.
  - Interfejs szybkiej konfiguracji kwoty startowej w `TransactionList.tsx`.
- [+] **Kompletna Weryfikacja Testowa:**
  - `apps/api`: 18/18 zestawów testowych zaliczonych (135/135 testów green).
  - `apps/worker`: 4/4 zestawy testowe zaliczone (10/10 testów green).
  - `apps/web`: `tsc && vite build` czysty build produkcyjny (exit code 0).

---

### ## v1.0.0 — 2026-11-06 [CANONICAL BASELINE: CLEAN SEMVER RESET, GRAPHIFY KNOWLEDGE GRAPH & PRODUCTION CONSOLIDATION]
**Status:** WYDANIE PRODUKCYJNE (CANONICAL PRODUCTION RELEASE)  
**Typ:** MAJOR (Oficjalny Reset SemVer, Separacja od Prototypów Legacy i Wdrożenie Grafu Wiedzy Graphify)

- [!] **Sanacja i Kalibracja Wersjonowania (Clean SemVer Baseline):**
  - Zamknięcie historycznych wersji eksperymentalnych (1.x - 3.x z prototypów) oraz wersji roboczych 4.x.
  - Usankcjonowanie pierwszego oficjalnego, stabilnego i w pełni zweryfikowanego wydania produkcyjnego jako **`v1.0.0`**.
  - Zsynchronizowano wersję `1.0.0` we wszystkich pakietach monorepo (`package.json`, `@omnidash/api`, `@omnidash/web`, `@omnidash/worker`, `@omnidash/contracts`), nagłówkach API (`/api/system/health`), odznakach interfejsu użytkownika (`AppHeader`, `Sidebar`, `MoreDrawerSheet`) oraz w promptach asystenta LLM Gateway.
- [+] **Integracja z Silnikiem Grafu Wiedzy AST Graphify (`Graphify-Labs/graphify`):**
  - Przygotowanie środowiska i instalacja silnika `graphifyy` z deterministycznym parserem drzew składniowych AST.
  - Generowanie grafu wiedzy dla całego monorepo OmniDash (`graphify-out/graph.json`, interaktywny `graph.html`, audyt architektoniczny `GRAPH_REPORT.md`).
- [+] **Pełna Weryfikacja Systemowa:**
  - Wszystkie testy jednostkowe, integracyjne i buildy frontendu w 100% sprawne ze statusem green.

---

### ## v1.0.1 — 2026-11-08 [MIKRUS VPS DEPLOYMENT PROFILE & RESOURCE HARDENING]
**Status:** WYDANIE PRODUKCYJNE (BRANCH: `mikr.us`)  
**Typ:** MINOR / DEPLOYMENT HARDENING

- [+] **Dedykowany Profil Wdrożeniowy Docker (`docker-compose.prod.yml`):**
  - Wyeliminowano całkowicie kontener PostgreSQL (`omnidash-db`) — baza danych SQLite (`node:sqlite`) funkcjonuje bezpośrednio na trwałym wolumenie `./data/storage`.
  - Wdrożono mikro-kontener Redis (`redis:7-alpine`) z twardym limitem pamięci `maxmemory 32mb`, polityką `allkeys-lru` i wyłączonym fork RDB (`--save ""`).
  - Nałożono rygorystyczne limity cgroups (`mem_limit`): API (180M), Worker (110M), Redis (45M), Web Nginx (30M) — łączny budżet RAM OmniDash ≤ 365 MB (~18% pamięci Mikrusa 2 GB).
  - Skonfigurowano rotację logów kontenerów (`json-file`, `max-size: 10m`, `max-file: 3`) chroniącą 25 GB dysku NVMe.
- [+] **Nginx SPA Router (`apps/web/nginx.conf`):**
  - Obsługa `try_files $uri $uri/ /index.html;` zapobiegająca błędom 404 przy odświeżaniu podstron React.
  - Kompresja Gzip dla zasobów tekstowych i assetów oraz wewnętrzny reverse proxy `/api/`.
- [+] **Zestaw Narzędzi Wdrożeniowych Mikrus (`deploy/`):**
  - `deploy/mikrus-setup.sh`: automatyczna detekcja RAM, weryfikacja Dockera i alokacja 1.5 GB SWAP jako buforu przed OOM Killerem.
  - `deploy/mikrus-deploy.sh`: jednoklikowe wdrożenie, test zdrowia i telemetria zużycia pamięci `docker stats`.
  - `deploy/nginx/mikrus-reverse-proxy.conf.example`: wzorzec nadrzędnego reverse proxy rozdzielającego ruch pomiędzy OmniDash (`dash.*`) a Portfolio (`*`).
- [+] **Izolacja na Dedykowanej Gałęzi Git:**
  - Całość konfiguracji wdrożeniowej wydzielona na dedykowaną gałąź `mikr.us` na GitHubie.

---

### ## v1.0.2 — 2026-11-08 [CORS BLOCKING FIX & PUSHBULLET WIZARD REPAIR]
**Status:** WYDANIE PRODUKCYJNE (BRANCH: `mikr.us`)  
**Typ:** PATCH / ONE-SHOT BUGFIX

- [+] **Eliminacja Blokady CORS dla Domeny Produkcyjnej (`apps/api/src/core/corsConfig.ts`):**
  - Rozszerzono `DEFAULT_ALLOWED_ORIGINS` o subdomeny produkcyjne: `https://omni.kvbi.pl`, `https://dash.kvbi.pl`, `https://omnidash.kvbi.pl`, `https://hub.kvbi.pl`, `https://kvbi.pl`.
  - Wprowadzono regułę regex `^https:\/\/(.*\.)?kvbi\.pl$` autoryzującą wszystkie subdomeny produkcyjne z zachowaniem blokady wildcard `*` oraz domen zewnętrznych.
- [+] **Wstrzyknięcie Zmiennych Środowiskowych do Kontenerów (`docker-compose.prod.yml`):**
  - Dodano jawną deklarację `env_file: - .env` do serwisów `omnidash-api` oraz `omnidash-worker`, gwarantując przekazanie `ALLOWED_ORIGINS` oraz kluczy API z pliku `.env`.
- [+] **Uzupełnienie Dozwolonych Nagłówków CORS (`apps/api/src/index.ts`):**
  - Dodano nagłówek `x-pushbullet-token` do listy `allowedHeaders` w middleware CORS.
- [+] **Automatyczne Testy Regresyjne (`apps/api/tests/api_gateway.test.ts`):**
  - Dodano testy jednostkowe `isOriginAllowed` weryfikujące akceptację domen `*.kvbi.pl` i odrzucenie domen podszywających się.
  - Dodano test integracyjny żądania POST z nagłówkiem `Origin: https://omni.kvbi.pl` do endpointu `/api/pushbullet/test` (status 200, nagłówek CORS obecny, brak błędu 500).
- [+] **Zamknięcie Rejestru Błędu:**
  - Utworzono i zamknięto dokumentację `/docs/errors/ERROR_DIFF_2026-11-08_cors_blocked_pushbullet_500.md`.

---

### ## v1.0.3 — 2026-11-09 [TIMEZONE OFFSET REPAIR & DETERMINISTIC BRIEFING DISPATCH]
**Status:** WYDANIE PRODUKCYJNE (BRANCH: `mikr.us`)  
**Typ:** PATCH / ONE-SHOT BUGFIX

- [+] **Deterministyczna Synchronizacja Strefy Czasowej Europe/Warsaw (`apps/worker`, `apps/api`):**
  - Utworzono moduł `timeUtils.ts` (`getWarsawTime`) wykorzystujący natywny silnik `Intl.DateTimeFormat` z jawnym mapowaniem strefy `Europe/Warsaw`.
  - Zagwarantowano prawidłowy odczyt godziny, minuty i dnia tygodnia niezależnie od lokalnego zegara kontenera czy maszyny wirtualnej (UTC/GMT).
- [+] **Korekta Porannego Briefingu Pushbullet (`apps/worker/src/automation/lessonAlertMonitor.ts`):**
  - Wyeliminowano błąd wyzwalania briefingu o 08:15 (spowodowany odczytem 07:15 z zegara UTC na serwerze Mikrus).
  - Skonfigurowano wyzwalanie ściśle o 07:15 czasu polskiego (`Europe/Warsaw`).
- [+] **Korekta Zegara Monotonicznego i Okna Higieny Snu (`apps/worker/src/cron/scheduler.ts`):**
  - Zsynchronizowano cron scheduler z czasem warszawskim dla logów `[*] TICK` oraz alertu ostatniego posiłku o 20:00.
- [+] **Korekta Obliczania Dzwonków i Kontekstu Automatyzacji (`apps/api/src/domains/automation/`):**
  - Zsynchronizowano `calculateLessonInfo` oraz endpoint `/api/automation/context-status` z czasem warszawskim, eliminując przesunięcie lekcji na serwerze.
- [+] **Wzmocnienie Środowiska Kontenerowego (`Dockerfile`, `docker-compose.prod.yml`, `docker-compose.yml`):**
  - Zainstalowano pakiet `tzdata` w obrazach runnera `apps/api/Dockerfile` i `apps/worker/Dockerfile`.
  - Ustawiono `ENV TZ=Europe/Warsaw` w Dockerfiles oraz zmienną `TZ=Europe/Warsaw` w definicjach serwisów compose.
- [+] **Testy Regresyjne i Zamknięcie Błędu:**
  - Dodano testy jednostkowe `apps/worker/tests/automation.test.ts` potwierdzające wyzwalanie o 07:15 czasu warszawskiego przy zegarze UTC (06:15 UTC w CET i 05:15 UTC w CEST).
  - Utworzono i zamknięto rejestr `/docs/errors/ERROR_DIFF_2026-11-09_pushbullet_briefing_timezone_offset.md`.


---

### ## v1.0.4 — 2026-11-09 [MAIL TRIAGE & PUSHBULLET NOTIFICATION AGGREGATOR MODULE]
**Status:** WYDANIE PRODUKCYJNE (BRANCH: `mikr.us`)  
**Typ:** MINOR / NEW SUBSYSTEM

- [+] **Natywny Moduł Klasyfikacji Poczty IMAP (`apps/worker/src/triage/mailScanner.ts`):**
  - Implementacja klienta IMAP RFC 3501 opartego na natywnym module `node:tls` (port 993, TLS) bez zewnętrznych zależności pnpm/npm.
  - Dekodowanie nagłówków MIME RFC 2047 (Base64 oraz Quoted-Printable dla polskich znaków diakrytycznych).
  - Klasyfikacja heurystyczna wiadomości:
    - **Ważne:** Szkoła/uczelnia (`librus`, domeny `.edu.pl`), serwery/hosting (`mikrus`, `cloudflare`, `github`, `ovh`), finanse/banki (`mbank`, `revolut`, `santander`), słowa kluczowe (`faktura`, `invoice`, `pilne`, `alert`, `awaria`, `bezpieczeństwo`).
    - **Spam / Newslettery:** Nagłówki `List-Unsubscribe`, `Precedence: bulk/list`, słowa kluczowe marketingu/promocji (`newsletter`, `promocja`, `wyprzedaż`, `rabat`).
    - **Zwykłe:** Bezpośrednie wiadomości prywatne.
  - Pełna obsługa Zero-Placeholder oraz graceful degradation w razie braku poświadczeń IMAP.
- [+] **Akumulator Powiadomień Smartfona (`apps/worker/src/triage/pushNotificationAggregator.ts`):**
  - Magazyn akumulujący zdarzenia z `PushbulletListener` w buforowanym oknie czasowym (co 15-20 min).
  - Grupowanie i sumowanie wydatków (koperty NEEDS/WANTS), zadań, alertów szkolnych i notyfikacji ogólnych.
  - Zabezpieczenie przed wyciekiem pamięci (automatyczne przycinanie zdarzeń >24h lub >1000 wpisów).
- [+] **Integracja z Harmonogramem i Pętlą Zdarzeń (`apps/worker/src/cron/scheduler.ts`, `apps/worker/src/index.ts`):**
  - Dodano cykliczne zadanie `runTriageCycle()` wyzwalane co 15 minut (`TRIAGE_INTERVAL_MINUTES`).
  - Podsumowanie triage generowane i wysyłane przez `PushbulletDispatcher` w razie pojawienia się istotnych maili lub powiadomień.
  - Podpięcie `PushNotificationAggregator` do nasłuchu `PushbulletListener`.
- [+] **Aktualizacja Zmiennych Środowiskowych (`.env.example`):**
  - Dodano konfigurację parametrów `IMAP_HOST`, `IMAP_PORT`, `IMAP_USER`, `IMAP_PASSWORD`, `IMAP_TLS`, `TRIAGE_INTERVAL_MINUTES`.
- [+] **Zestaw Testów Jednostkowych (`apps/worker/tests/triage.test.ts`):**
  - Testy dekodowania nagłówków MIME, kategoryzacji wiadomości, agregacji okna czasowego oraz graceful degradation.
