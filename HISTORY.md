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
