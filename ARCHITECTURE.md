# OMNIDASH — PEŁNA DOKUMENTACJA ARCHITEKTONICZNA I OPERACYJNA

**Wersja Systemu:** v2.9.0 (Stan na Wrzesień 2026)  
**Status:** AKTYWNY | PRODUKCJA  
**Rodzaj:** Kompleksowy System OmniDash / Asystent Osobisty (Desktop, Mobile Native UX, Multi-Tool AI, Vercel Serverless & Firebase Cloud)

---

## 1. WSTĘP I PARADYGMATY
System to zintegrowane środowisko asystenckie oparte na modelu LLM `openai/gpt-oss-120b` (Groq SDK). Projekt łączy w sobie cechy inteligentnego terminala poleceń, zarządzania zadaniami (To-Do), planu lekcji i harmonogramu zajęć (Timetable), kalendarza, elastycznego budżetu (konfigurowalne proporcje potrzeb, zachcianek i oszczędności), planera treningów, długoterminowej pamięci (Operator Brain), monitoringu systemu oraz wyszukiwania w sieci na żywo (Brave Search API).

**Główne Paradygmaty:**
1. **Multi-Cloud Architecture:** Aplikacja operuje hybrydowo: statyczny frontend i hosting Firebase (`https://void-potato-7721.web.app`), baza danych Cloud Firestore w regionie Warszawa (`europe-central2`), oraz dedykowany backend bezstanowy Vercel Serverless Gateway (`https://ai-system-dashboard.vercel.app/api/agent`, `api/news`, `api/models`, `api/status`).
2. **Mobile-First Touch Architecture:** Pełna natywna obsługa urządzeń mobilnych (iOS/Android) z trójwarstwową architekturą nawigacyjną: Mobile Top App Bar (`h-14`), Mobile Bottom Quick Bar (`h-16` z `safe-area-inset-bottom`) oraz wysuwaną szufladą (Bottom Sheet Drawer). Siatki komponentów i metryk automatycznie dostosowują się do formatu 2-kolumnowego (`grid-cols-2`), a wszystkie modale i formularze zabezpieczone są przed ucięciem przez klawiatury dotykowe.
3. **LLM with Live Web & Multi-Tool Action Engine:** Cała logika kognitywna oparta jest na modelu `openai/gpt-oss-120b`. Prompt systemowy otrzymuje wstrzyknięty w czasie rzeczywistym pełen stan 7 kategorii danych użytkownika (Zadania, Plan Lekcji, Kalendarz, Finanse, Treningi, Operator Brain, Historia Chatu) oraz natychmiastowe dane z sieci za pośrednictwem Brave Search API (`api.search.brave.com`). Model posiada bezpośrednie narzędzia akcji (`[ACTION:ADD_TASK]`, `[ACTION:ADD_LESSON]`, `[ACTION:ADD_EXPENSE]`, `[ACTION:ADD_WORKOUT]`, `[ACTION:ADD_EVENT]`, `[ACTION:SET_THEME]`, `[ACTION:REMEMBER]`).
4. **Clean & Modern Aesthetics**: Interfejs zaprojektowany jest w oparciu o czyste linie, glassmorphism, elegancką i nowoczesną typografię oraz bogatą paletę motywów (Dark Cyber, Retro Amber CRT, Monochrome Slate, Matrix Terminal, Synthwave 80s, Nordic Frost, Paper Light). Asystent J.A.R.V.I.S (główny rdzeń/Mentor) jest przyjazny i analityczny, z kolei F.R.I.D.A.Y (Worker) wykonuje zadania w hiper-profesjonalnym i inżynieryjnym tonie.

---

## 2. STRUKTURA KATALOGÓW

Cały projekt jest osadzony w katalogu na pulpicie użytkownika. Poniżej znajduje się rygorystyczny rozkład warstw:

```
[Katalog Główny]
│
├── /api/                      ← Funkcje Vercel Serverless (Node.js Gateway)
│   ├── agent.js               ← CORS-enabled proxy do openai/gpt-oss-120b z wstrzykiwaniem kontekstu, narzędzi akcji & Live Brave Search
│   ├── news.js                ← Serverless endpoint newsowy z integracją Brave Search News API i kategoryzacją
│   ├── models.js              ← Dynamiczny wykaz dostępnych modeli LLM z fallbackiem
│   └── status.js              ← Healthcheck i pomiar opóźnień (ping)
│
├── core.server.js             ← Mózg backendu lokalnego (Express.js).
├── core.client.jsx            ← Mózg frontendu (React 18 + React Router).
├── index.html                 ← Plik ładujący aplikację SPA.
├── vercel.json                ← Konfiguracja routingu i rewrites Vercel.
│
├── ZASADYPRACY.md             ← Nadrzędny Rygor Operacyjny [PRIORYTET ZERO].
├── ARCHITECTURE.md            ← (Ten plik) Centralne źródło prawdy o systemie.
├── HISTORY.md                 ← Niemutowalny rejestr wersji (SemVer append-only).
│
├── /modules/                  ← Główna logika i komponenty.
│   ├── agent.js               ← System podłączający się do API LLM (lokalnie i chmurowo).
│   ├── database.js            ← Abstrakcja nad SQLite dla środowiska lokalnego (w tym tabela timetable).
│   ├── firebase.js            ← Most z chmurą Firebase Admin SDK.
│   ├── firebaseClient.js      ← Klient frontendowy Firebase Web SDK (Auth, Firestore).
│   │
│   ├── /services/             ← Usługi rozproszone i synchronizacja w czasie rzeczywistym.
│   │   ├── cloudSync.js       ← Dwukierunkowa subskrypcja 7 kolekcji Firestore z auto-inicjalizacją.
│   │   └── clientAiDispatcher.js ← Autonomiczny silnik zapytań LLM (openai/gpt-oss-120b) przez Vercel Gateway.
│   │
│   ├── /ai/                   ← Pliki konfiguracyjne dla agentów AI.
│   │   ├── prompts.js         ← Zbiór promptów systemowych (Worker, Mentor).
│   │   └── tools.js           ← Definicje narzędzi (Tool Calling) dla agentów.
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
│       ├── FinancePage.jsx  ← Finanse, budżet (konfigurowalne wagi procentowe) i statystyki.
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
| `/api/firebase/status` | `GET` | - | Zwraca status połączenia z Firestore (projekt `void-potato-7721`) oraz konfigurację właściciela. |
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
- **`Terminal.jsx`**: Punkt komunikacyjny. Zawiera mechanizm historii wiadomości (zapis do `localStorage`). Gdy serwer odsyła pole `widgets: ["tasks"]`, Terminal dynamicznie ładuje komponent `TodoList` pod aktualną dymkiem czatu. Zapewnia on płynną konwersję komend (np. `/clear`).
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

## 9. INTEGRACJA CHMUROWA FIREBASE & RESTRYKCJA DOSTĘPU (void-potato-7721)

Projekt chmurowy w Google Firebase został utworzony w architekturze ścisłej izolacji:
- **Identyfikator Projektu:** `void-potato-7721` (Void Potato Matrix)
- **Instancja Bazy Danych:** Cloud Firestore `(default)` w lokalizacji `europe-central2` (Warszawa).
- **Model Bezpieczeństwa (Single-Owner Access):**
  - Reguły `firestore.rules` dopuszczają operacje zapisu i odczytu wyłącznie dla uwierzytelnionego konta właściciela (`marektowarek21372137@gmail.com`).
  - Każda próba logowania lub odpytania API przez inną tożsamość kończy się natychmiastowym kodem `403 Forbidden`.
  - Backend udostępnia bezpieczną procedurę synchronizacji dwukierunkowej (`/api/firebase/sync`), migrując dane zadań, transakcji i kalendarza z lokalnego SQLite do Cloud Firestore.

---
*Dokument zrealizowany zgodnie ze zleceniem. Podpisano: Agent AI.*
