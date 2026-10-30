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
Wraz z budową projektu od zera w lokalizacji `C:\Users\Jakub Lis\Desktop\01_PROJEKTY\OmniDash`, zamykamy chaotyczną linię 3.x i ustanawiamy **Czysty Restart Wersjonowania**:
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

