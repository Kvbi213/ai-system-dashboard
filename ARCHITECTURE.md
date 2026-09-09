# OMNIDASH — PEŁNA DOKUMENTACJA ARCHITEKTONICZNA I OPERACYJNA

**Wersja Systemu:** v2.14.1 (Stan na Wrzesień 2026)  
**Status:** AKTYWNY | PRODUKCJA (10/10 ENTERPRISE GRADE)  
**Rodzaj:** Kompleksowy System OmniDash / Asystent Osobisty (Desktop, Mobile Native UX, Cloud-First Firestore Sync, Real-Time SSE Telemetry, Theme Toggle Dark/Light, React Testing Library + JSDOM Suite, Toast Notification Hub, Network Online/Offline Guard, Automated Testing Suite Vitest 39/39 PASS, CSV & PDF Export Engine, Dual CI/CD Pipelines main.yml & ci.yml, Deterministic Chat Purge, Dynamic 0% Budgeting & Dual-Mode Donut Allocation, Calendar Management, Warsaw Timezone AI Engine, Multi-Cloud OSINT Serverless, Vercel Serverless & Firebase Hosting)

---

## 1. WSTĘP I PARADYGMATY
System to zintegrowane środowisko asystenckie oparte na modelu LLM `openai/gpt-oss-120b` (Groq SDK). Projekt łączy w sobie cechy inteligentnego terminala poleceń, zarządzania zadaniami (To-Do), planu lekcji i harmonogramu zajęć (Timetable), kalendarza z możliwością ręcznego planowania, elastycznego budżetu z dynamicznym dysponowaniem środkami (autopodział dochodów 50/30/20, jedna pula, podział własny oraz transfery między koszykami), planera treningów, długoterminowej pamięci (Operator Brain), monitoringu parametrów systemu w czasie rzeczywistym przez Server-Sent Events (SSE) oraz wyszukiwania w sieci na żywo (Brave Search API).

**Główne Paradygmaty:**
1. **Multi-Cloud & Cloud-First Architecture:** Aplikacja operuje hybrydowo: statyczny frontend i hosting Firebase (Prywatna Instancja Produkcyjna), baza danych Cloud Firestore w regionie Warszawa (`europe-central2`), oraz dedykowany backend bezstanowy Vercel Serverless Gateway (`/api/agent`, `api/news`, `api/models`, `api/status`, `api/osint`). Wszystkie operacje na telefonach, tabletach i desktopie natychmiast synchronizują się z chmurą bez wymogu logowania Google OAuth.
2. **Quality Gate & Automated Testing (39/39 PASS):** Zintegrowany silnik testowy Vitest (`npm test`) z 6 dedykowanymi zestawami testowymi weryfikującymi algorytm budżetowy, klasyfikację celów OSINT, strefę czasową `Europe/Warsaw`, eksport CSV, rejestr synchronizacji chmurowej oraz renderowanie komponentów Reacta z `@testing-library/react` i `jsdom` (SystemMonitor SSE/Client, WeatherWidget fallback, Sidebar theme toggle, Toast notifications, ExportModal).
3. **Real-time SSE Telemetry & Dual Mode:** Backend Express dostarcza strumień Server-Sent Events (`/api/system/stream`) emitujący metryki CPU/RAM/Heap/Uptime co 2 sekundy. W chmurze komponent `SystemMonitor` automatycznie przechodzi w tryb telemetrii przeglądarkowej ze wskaźnikami `● SSE LIVE` i `● CLIENT`.
4. **Instant Theme Toggle:** Szybki przełącznik trybu jasnego/ciemnego (Sun/Moon) umieszczony w widocznym miejscu w nagłówku mobilnym oraz stopce menu bocznego na desktopie, zintegrowany z pamięcią `localStorage` i 7 paletami kolorystycznymi.
5. **Toast Notification Hub & Offline Guard:** Pływające komunikaty w stylu Glassmorphism informujące o operacjach i mutacjach w czasie rzeczywistym. Detektor `navigator.onLine` oraz zdarzeń sieciowych ostrzega o utracie połączenia z automatycznym buforowaniem operacji w pamięci podręcznej Firestore.
6. **Data Export & Reporting Engine:** Zaawansowany generator raportów (`exportService.js`) z bezpośrednim pobieraniem plików CSV (zgodność ze standardem RFC 4180) oraz generowaniem raportów do druku i zapisu do pliku PDF (`@media print`).
7. **Advanced Budgeting & Envelope Allocation:** Autonomiczny i elastyczny system podziału finansów oparty na dedykowanym silniku matematycznym `budgetCalculator.js`. Obsługa podziałów standardowych 50/30/20, alokacji z koszykami 0% (np. 70/0/30) oraz bezpośrednich transferów między kopertami.
8. **LLM with Precise Warsaw Timezone & Multi-Tool Engine:** Cała logika kognitywna oparta jest na modelu `openai/gpt-oss-120b`. Klient każdorazowo przesyła precyzyjny timestamp oraz zlokalizowaną godzinę, a Vercel Gateway wymusza strefę `Europe/Warsaw`, gwarantując natychmiastową i niezmiennie poprawną wiedzę o aktualnej godzinie w Polsce.
9. **Clean & Modern Aesthetics**: Interfejs zaprojektowany w oparciu o czyste linie, glassmorphism, elegancką i nowoczesną typografię oraz bogatą paletę motywów (Dark Cyber, Retro Amber CRT, Monochrome Slate, Matrix Terminal, Synthwave 80s, Nordic Frost, Paper Light).

---

## 2. STRUKTURA KATALOGÓW

Cały projekt jest osadzony w katalogu na pulpicie użytkownika. Poniżej znajduje się rygorystyczny rozkład warstw:

```
[Katalog Główny]
│
├── /.github/workflows/        ← Potoki CI/CD (GitHub Actions)
│   ├── main.yml               ← Główny potok CI/CD produkcyjny
│   └── ci.yml                 ← Równoległy potok weryfikacyjny pull requestów
│
├── /tests/                    ← Automatyczne zestawy testów jednostkowych i integracyjnych (Vitest)
│   ├── components.test.jsx    ← Testy komponentów Reacta (@testing-library/react + JSDOM)
│   ├── budget.test.js         ← Testy reguły 50/30/20, alokacji, wag 0% i transferów
│   ├── export.test.js         ← Testy serializacji RFC 4180 dla plików CSV
│   ├── time.test.js           ← Testy obliczeń czasowych strefy Europe/Warsaw
│   ├── osint.test.js          ← Testy klasyfikatora celów OSINT (IP, e-mail, domena, MAC)
│   └── cloudSync.test.js      ← Testy rejestru kolekcji i detekcji środowiska
│
├── /api/                      ← Funkcje Vercel Serverless (Node.js Gateway)
│   ├── agent.js               ← CORS-enabled proxy do openai/gpt-oss-120b z wstrzykiwaniem kontekstu, narzędzi akcji & Live Brave Search
│   ├── news.js                ← Serverless endpoint newsowy z integracją Brave Search News API i kategoryzacją
│   ├── models.js              ← Dynamiczny wykaz dostępnych modeli LLM z fallbackiem
│   ├── osint.js               ← Multi-cloud OSINT intelligence (DNS, GeoJS, Wayback, WHOIS, HIBP)
│   └── status.js              ← Healthcheck i pomiar opóźnień (ping)
│
├── core.server.js             ← Mózg backendu lokalnego (Express.js).
├── core.client.jsx            ← Mózg frontendu (React 18 + React Router + ToastProvider).
├── index.html                 ← Plik ładujący aplikację SPA.
├── vercel.json                ← Konfiguracja routingu i rewrites Vercel.
│
├── ZASADYPRACY.md             ← Nadrzędny Rygor Operacyjny [PRIORYTET ZERO] (Protokół lokalny sesji AI, chroniony w .gitignore).
├── ARCHITECTURE.md            ← (Ten plik) Centralne źródło prawdy o systemie.
├── HISTORY.md                 ← Niemutowalny rejestr wersji (SemVer append-only).
├── README.md                  ← Główna prezentacja repozytorium z diagramami Mermaid.
│
├── /modules/                  ← Główna logika i komponenty.
│   ├── agent.js               ← System podłączający się do API LLM (lokalnie i chmurowo).
│   ├── database.js            ← Abstrakcja nad SQLite dla środowiska lokalnego (w tym tabela timetable).
│   ├── firebase.js            ← Most z chmurą Firebase Admin SDK.
│   ├── firebaseClient.js      ← Klient frontendowy Firebase Web SDK (Auth, Firestore).
│   ├── osint.js               ← Narzędzia rozpoznania OSINT i klasyfikator celów.
│   │
│   ├── /services/             ← Usługi rozproszone i synchronizacja w czasie rzeczywistym.
│   │   ├── cloudSync.js       ← Dwukierunkowa subskrypcja 8 kolekcji Firestore z auto-inicjalizacją i cloud purge czatu.
│   │   ├── clientAiDispatcher.js ← Autonomiczny silnik zapytań LLM (openai/gpt-oss-120b) przez Vercel Gateway.
│   │   ├── budgetCalculator.js ← Czysty silnik kalkulacji budżetowych 50/30/20 i kopert.
│   │   ├── exportService.js   ← Usługa eksportu danych do formatu CSV oraz podglądu PDF/druku.
│   │   └── timeUtils.js       ← Narzędzia strefy czasowej Europe/Warsaw i formatowania dat.
│   │
│   ├── /context/              ← Konteksty globalnego stanu aplikacji.
│   │   ├── ChatContext.jsx    ← Zarządzanie wiadomościami Workera/Mentora, obsługa komend systemowych (/clear, /purge) i izolacja sesji.
│   │   └── ToastContext.jsx   ← Pływające powiadomienia, błędy i detekcja łączności online/offline.
│   │
│   ├── /components/           ← Komponenty interfejsu użytkownika.
│   │   ├── ToastContainer.jsx ← Kontener pływających powiadomień toast i paska offline.
│   │   ├── ExportModal.jsx    ← Modal eksportu danych CSV oraz wydruków PDF.
│   │   └── ...                ← Pozostałe komponenty nawigacji i widżetów.
│   │
│   ├── /routes/             ← Modułowe routery Express:
│   │   ├── auth.js, system.js, finance.js, ai.js, osint.js, weather.js, news.js, tasks.js, calendar.js, workouts.js, timetable.js, memory.js, phone.js, logs.js, events.js, firebase.js
│   │   └── middleware.js    ← Middleware zabezpieczające i limitujące zapytania.
│   │
│   ├── /components/         ← Reużywalne klocki UI w React.
│   │   ├── CommandPalette.jsx ← Globalna paleta komend i szybkich akcji (Ctrl + K).
│   │   ├── Sidebar.jsx      ← Lewy pasek nawigacyjny z zakładką Plan Lekcji (GraduationCap).
│   │   ├── ErrorBoundary.jsx← Strażnik awarii interfejsu (Crash Guard & Recovery Screen).
│   │   ├── Terminal.jsx     ← Zaawansowany terminal czatu z Markdown i TTS.
│   │   ├── TodoList.jsx     ← Interaktywna lista to-do z obsługą priorytetów.
│   │   └── ... (pozostałe widżety UI)
│   │
│   └── /pages/              ← Konkretne podstrony w React Router.
│       ├── Dashboard.jsx    ← Strona startowa. Siatka wszystkich widżetów.
│       ├── ChatPage.jsx     ← Pełnoekranowy Terminal AI.
│       ├── TimetablePage.jsx← Plan Lekcji & Zajęć (Live Tracker, widok osi czasu i siatki, CRUD, Firestore sync).
│       ├── CalendarPage.jsx ← Kalendarz operacyjny i terminarz zdarzeń.
│       ├── FinancePage.jsx  ← Finanse, budżet (konfigurowalne wagi procentowe, dwutrybowy Donut Chart [Wydatki vs Pule], dynamiczna repartycja split).
│       ├── WorkoutsPage.jsx ← Dziennik sesji treningowych.
│       ├── MemoryPage.jsx   ← Pamięć długoterminowa asystenta (Operator Brain).
│       ├── SearchPage.jsx   ← Wyszukiwarka zintegrowana z Brave Search.
│       └── SettingsPage.jsx ← Centrum kategorii Firestore, motywy i diagnostyka bramy.
│
├── /data/                   ← Magazyn danych lokalnych.
│   └── tasks.sqlite         ← Baza SQL przechowująca zadania, harmonogram lekcji i logi.
│
└── /docs/                   ← Hub dokumentacji (logi wersji SemVer, błędy ERROR_DIFF, mapy architektoniczne).
```


---

## 3. ARCHITEKTURA BACKENDU I API (core.server.js)

Backend to lekka aplikacja oparta na Express.js. Działa na porcie `5000`. Pełni dwie kluczowe funkcje:
1. Wystawia endpointy `/api/*` dla frontendu.
2. Inicjalizuje tło operacyjne (połączenie z bazą, scheduler procesów cyklicznych).

### Endpointy API:

| Endpoint | Metody | Parametry | Funkcja |
|---|---|---|---|
| `/api/agent` | `POST` | `text`, `mode` (worker/mentor) | Odbiera zapytanie użytkownika, przesyła do LLM i zwraca JSON z odpowiedzią i listą widżetów. |
| `/api/model/status` | `GET` | - | Wykonuje testowy ping (timeout 5s) do serwerów Groq (OpenAI proxy), zwracając latencję i status LLM. |
| `/api/weather` | `GET` | - | Uderza do `api.open-meteo.com` pobierając aktualne dane dla lokacji operatora. Implementuje retry cache. |
| `/api/news` | `GET` | `?q=` | Interfejs proxujący zapytania do Brave Search API (unikanie CORS dla klienta). |
| `/api/tasks` | `GET`, `POST` | (Body dla POST) | Pobieranie (`GET`) listy zadań. Tworzenie (`POST`) zadania (wymagane: title, priority, category). |
| `/api/tasks/:id` | `DELETE` | URL param: `id` | Usuwanie zadania (jeśli id='all', czyści całą tabelę zadań). |
| `/api/tasks/:id/status` | `PATCH` | `status` (pending/completed)| Zmiana stanu checkboxa na liście. |
| `/api/schedule` | `GET` | - | Zwraca tablicę aktualnie zakolejkowanych procesów cyklicznych Schedulera (dla AgentQueue.jsx). |
| `/api/logs` | `GET` | - | Zwraca ostatnie wpisy z tabeli `system_logs` (dla NewsFeed.jsx). |
| `/api/system/metrics`| `GET` | - | Zwraca dane o zużyciu sprzętu (CPU, RAM, Uptime). |
| `/api/firebase/status` | `GET` | - | Zwraca status połączenia z Firestore (projekt `$FIREBASE_PROJECT_ID`) oraz konfigurację właściciela. |
| `/api/firebase/verify-owner` | `POST` | `idToken` lub `email` | Uwierzytelnia właściciela z chmury Firebase i przyznaje unikalny token sesyjny. |
| `/api/firebase/sync` | `POST` | - | Przeprowadza pełną synchronizację bazy lokalnej SQLite do chmury Firestore. |
| `/api/firebase/data/:col` | `GET` | URL param: `col` | Bezpośredni odczyt dokumentów z kolekcji Firestore w chmurze. |

---

## 4. BAZA DANYCH (database.js)

System bazuje na plikowej bazie SQLite (`/data/tasks.sqlite`), która tworzy się automatycznie, jeśli nie istnieje.

### Tabele Główne:
1. **`tasks`**
   - `id`: INTEGER PRIMARY KEY AUTOINCREMENT
   - `title`: TEXT
   - `status`: TEXT DEFAULT 'pending' (lub 'completed')
   - `target_date`: TEXT
   - `target_time`: TEXT
   - `priority`: TEXT (HIGH, MEDIUM, LOW)
   - `category`: TEXT (jednorazowe, powtarzalne, inne)
   - `recurrence_rule`: TEXT (np. "weekly:wtorek:17:00", "daily:08:00", null)
   - `created_at`: DATETIME

2. **`system_logs`**
   - `id`: INTEGER PRIMARY KEY AUTOINCREMENT
   - `type`: TEXT (INFO, WARN, ERROR, SCHEDULER)
   - `content`: TEXT
   - `created_at`: DATETIME

*Moduł `database.js` udostępnia promisyfikowane funkcje `executeQuery` i `executeRun`, co pozwala używać składni `async/await` w całym kodzie backendu.*

---

## 5. SILNIK AI I NARZĘDZIA (agent.js)

`agent.js` to serce systemu decyzyjnego. Komunikuje się z modelem **openai/gpt-oss-120b** poprzez `groq-sdk` (z fallbackiem do modeli pomocniczych).

### Tryby Pracy (Modes)
Agent posiada dwa tryby, sterowane zmienną `mode` przekazywaną z frontendu (Terminal.jsx):
1. **WORKER (Domyślny)**:
   - Funkcjonalny asystent nastawiony na akcję.
   - Posiada bezpośredni dostęp do narzędzi (Tool Calling) pozwalających mu na autonomiczne zapisywanie danych, przeszukiwanie sieci i operowanie na systemie.
2. **MENTOR**:
   - Wysoce obiektywny analityk oziębły w tonie.
   - Analizuje logikę myślenia użytkownika. 
   - Pozbawiony dostępu do aktywnych narzędzi (Tool Calling), zablokowane aby uchronić przed chaosem.
   - Wymuszone pole `mentor_thoughts` w responsie do potajemnego "obgadywania" procesu myślowego.

### Rygor JSON
Dzięki parametrowi `response_format: { type: 'json_object' }`, AI ZAWSZE zwraca JSON według ścisłego schematu:
```json
{
  "intent": "add_task | delete_task | update_task | get_system_status | search_news | general_conversation | unknown",
  "payload": { ... },
  "agent_response": "Treść merytoryczna sformatowana w Markdown",
  "widgets": ["weather", "tasks", "system", "news"]
}
```

### System "Tool Calling"
Agent w trybie `worker` potrafi sam zidentyfikować potrzebę użycia narzędzia. Zdefiniowane narzędzia to:
- `executeWebSearch`: Odpytywanie Brave o najświeższe fakty.
- `ADD_TO_DO`, `DELETE_TO_DO`, `UPDATE_TO_DO`: Bezpośrednia modyfikacja bazy danych sqlite z poziomu "rozmowy" poprzez NLP.
- `GET_ALL_TASKS`: Skanowanie pełnej listy zadań do celów zarządczych.

---

## 6. FRONTEND I CYKL ŻYCIA WIDŻETÓW (React)

Aplikacja React (zbudowana za pomocą Vite) implementuje architekturę komponentów zamkniętych. 

### Ekosystem Komponentów:
- **`Terminal.jsx`**: Główny punkt komunikacyjny czatu. Obsługuje renderowanie bogatego formatu Markdown ze wsparciem GitHub Flavored Markdown (`remark-gfm` — tabele, przekreślenia, zadania) oraz historię wiadomości (`localStorage` + Cloud Firestore). Posiada płynną syntezę mowy TTS (z filtracją składni tabel) oraz dynamiczny montaż widżetów pod dymkiem czatu.
- **`ChatInlineWidgets.jsx`**: Zestaw wyspecjalizowanych, interaktywnych mini-widżetów montowanych w czacie: `TimetableChatWidget` (plan lekcji na dziś), `FinanceChatWidget` (saldo i paski 50/30/20), `WorkoutsChatWidget` (ostatnie sesje), `CalendarChatWidget` (nadchodzące wydarzenia).
- **`TodoList.jsx`**: Interaktywny klient odpytujący `/api/tasks`. Pozwala na inline dodawanie (własny mały formularz) oraz interakcję (usuwanie, modyfikowanie checkboxów). Reaktywny na LLM.
- **`Sidebar.jsx`**: Obsługuje routing (React Router), z logiką zapamiętywania stanu "collapsed" w `localStorage`. Zapewnia responsywność i układ justify-start w stanie złożonym.
- **Odświeżanie danych (Polling)**: Komponenty używają hooków `useEffect` z funkcją `setInterval`, odpytując w tle backend. Przykłady: 
  - `AgentQueue` odświeża `api/schedule` co 10 sekund.
  - `CryptoTracker` odświeża się z API Binance co 10 sekund.
  - `ModelStatus` pinguje `/api/model/status` co 5 sekund.

### Ustawienia Zewnętrzne (CSS / Motywy):
- Całość oparta jest o **TailwindCSS** kompilowany w pamięci.
- Plik `index.css` definiuje kluczowe zmienne CSS (`--color-accent-primary`, `--bg-app`), które są globalnie wstrzykiwane. Przełączanie w `SettingsPage.jsx` zapisuje wartości do localStorage i dynamicznie nadpisuje `:root`.
- **Glassmorphism**: Stylistyka w oparciu o klasy `.glass-panel` z rozmytym tłem `backdrop-blur-xl` i czarnym wypełnieniem o kryciu 20%-40%.

---

## 7. AUTOMATYZACJA TŁA (scheduler.js)

Backend posiada całkowicie niezależny pętlowy proces chronometryczny:
- Skrypt parsuje tabelę `tasks` szukając pola `recurrence_rule` podczas każdego startu serwera lub dodawania eventu.
- Wpisy jak `daily:08:00` są rejestrowane jako wewnętrzne obiekty Job, które iterowane są za pomocą `setInterval` z 60-sekundowym interwałem weryfikującym "cyknięcia" zegara.
- Odpowiada to za listę z `/api/schedule`, z której korzysta widżet na głównej stronie, wizualizując, co i o której "odpali się" jako tło operacyjne.
- Wbudowana funkcja auto-podsumowań: regularnie aktywuje w tle LLM z funkcją `generateHourlySummary` i wrzuca mini-raport (np. pogodowy) do tabeli `system_logs`.

---

## 8. BEZPIECZEŃSTWO I STABILNOŚĆ
1. **Zabezpieczenie Kluczy (Credentials)**: Wszystkie klucze (Groq, Brave API, Firebase Service Account) znajdują się wyłącznie w plikach chronionych `.env` oraz `firebase-service-account.json`, ignorowanych przez `.gitignore`.
2. **Graceful Fallbacks**: Jeżeli API zewnętrzne padnie (np. Open-Meteo zrzuci Rate Limit), komponenty są chronione blokami `try-catch`, a obiekty ustawiane w stanie Loading/Error bez rozbijania ekranu na biało (brak crash'u UI).
3. **Ghost Mode**: Tryb czatu, w którym po odświeżeniu zapomina historię i nie zapisuje logów w localStorage z myślą o prywatnych sesjach projektowych.
4. **Izolacja Portów**: Komunikacja oparta w 100% o proxy Vite, tak aby żądania webowe przechodziły przez localhost połączone z Node.js, rozwiązując problemy z CORS (Cross-Origin Resource Sharing).

---

## 9. INTEGRACJA CHMUROWA FIREBASE & RESTRYKCJA DOSTĘPU

Projekt chmurowy w Google Firebase został utworzony w architekturze ścisłej izolacji:
- **Identyfikator Projektu:** `$FIREBASE_PROJECT_ID`
- **Instancja Bazy Danych:** Cloud Firestore `(default)` w lokalizacji `europe-central2` (Warszawa).
- **Model Bezpieczeństwa (Single-Owner Access):**
  - Reguły `firestore.rules` dopuszczają operacje zapisu i odczytu wyłącznie dla uwierzytelnionego konta właściciela (`<ALLOWED_OWNER_EMAIL>`).
  - Każda próba logowania lub odpytania API przez inną tożsamość kończy się natychmiastowym kodem `403 Forbidden`.
  - Backend udostępnia bezpieczną procedurę synchronizacji dwukierunkowej (`/api/firebase/sync`), migrując dane zadań, transakcji i kalendarza z lokalnego SQLite do Cloud Firestore.

---
*Dokument zrealizowany zgodnie ze zleceniem. Podpisano: Agent AI.*
