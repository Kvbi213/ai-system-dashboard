# OMNIDASH — PEŁNA DOKUMENTACJA ARCHITEKTONICZNA I OPERACYJNA

**Wersja Systemu:** v2.0.0 (Stan na Czerwiec 2026)  
**Status:** AKTYWNY | PRODUKCJA  
**Rodzaj:** Kompleksowy System OmniDash / Asystent Osobisty

---

## 1. WSTĘP I PARADYGMATY
System to zintegrowane środowisko asystenckie oparte na modelu LLM (obecnie Llama-3.3-70b-versatile od Groq). Projekt łączy w sobie cechy inteligentnego terminala poleceń, zarządzania zadaniami (To-Do), kalendarza, czytnika newsów IT oraz monitoringu systemu. 

**Główne Paradygmaty:**
1. **Desktop-First & Local-First:** Frontend i backend działają lokalnie na maszynie dewelopera (Windows z mostem do WSL/Node.js). Baza danych to plikowy SQLite.
2. **LLM as the Core Engine:** Cała logika decyzyjna w zakresie rozumienia poleceń oparta jest na LLM. LLM decyduje jakie funkcje systemowe (Tool Calling) wywołać, a odpowiedź formatuje do ścisłego schematu JSON.
3. **Cyberpunk & Hacker Aesthetics:** Interfejs zaprojektowany jest w oparciu o ciemne motywy, glassmorphism, terminalową typografię i bezwzględnie szczery, czasami ostry ton asystenta.

---

## 2. STRUKTURA KATALOGÓW

Cały projekt jest osadzony w katalogu na pulpicie użytkownika. Poniżej znajduje się rygorystyczny rozkład warstw:

```
[Katalog Główny]
│
├── core.server.js           ← Mózg backendu. Punkt wejścia dla Express.js i definicja REST API.
├── core.client.jsx          ← Mózg frontendu. Punkt wejścia dla aplikacji React.
├── index.html               ← Plik ładujący skrypt kliencki do przeglądarki.
│
├── ZASADYPRACY.md           ← Nadrzędny Rygor Operacyjny (System Prompt dla deweloperów AI).
├── ARCHITECTURE.md          ← (Ten plik) Centralne źródło prawdy o systemie.
├── HISTORY.md               ← Niemutowalny rejestr wersji (Changlog SemVer).
│
├── /modules/                ← Główna logika i komponenty.
│   ├── agent.js             ← System podłączający się do API Groq. Definiuje prompty i tool calls.
│   ├── database.js          ← Abstrakcja nad SQLite, zawiera metody `executeQuery` i `executeRun`.
│   ├── scheduler.js         ← Wbudowany "cron" do odpalania zautomatyzowanych procesów.
│   ├── search.js            ← Wrapper na Brave Search API.
│   ├── pushbullet.js        ← Skrypt nasłuchujący WebSockets API Pushbullet dla powiadomień.
│   │
│   ├── /components/         ← Reużywalne klocki UI w React.
│   │   ├── Terminal.jsx     ← Złożony widget czatu tekstowego z obsługą renderingu markdownu i widżetów w locie.
│   │   ├── TodoList.jsx     ← Interaktywna lista to-do z obsługą priorytetów i deadline'ów.
│   │   ├── SystemMonitor.jsx← Live data o zużyciu CPU, RAM i Uptime.
│   │   ├── ITNewsTicker.jsx ← Komponent wyświetlający nagłówki z Brave Search w pętli.
│   │   ├── WeatherWidget.jsx← Moduł pogodowy odpytujący API Open-Meteo.
│   │   ├── NotificationsWidget.jsx ← Live widget powiadomień z telefonu.
│   │   ├── ModelStatus.jsx  ← Monitor stanu LLM (Ping / Latency).
│   │   ├── NetworkMonitor.jsx ← Śledzenie połączeń z ważnymi punktami sieci (Google, Cloudflare itp).
│   │   ├── CryptoTracker.jsx← Pasek kryptowalut uderzający do API Binance.
│   │   ├── AgentQueue.jsx   ← Lista zadań systemowych zakolejkowanych w schedulerze (live z API).
│   │   ├── NewsFeed.jsx     ← Strumień logów systemowych pobieranych z bazy.
│   │   └── Sidebar.jsx      ← Lewy panel nawigacyjny (kompaktowy z możliwością rozwinięcia).
│   │
│   └── /pages/              ← Konkretne podstrony w React Router.
│       ├── Dashboard.jsx    ← Strona startowa. Siatka (grid) wszystkich mniejszych widżetów.
│       ├── ChatPage.jsx     ← Pełnoekranowy Terminal.
│       ├── SearchPage.jsx   ← Wyszukiwarka zintegrowana z Brave Search.
│       └── SettingsPage.jsx ← Sterowanie motywem, preferencjami i akcentami (zapis w localStorage).
│
├── /data/                   ← Magazyn danych lokalnych.
│   └── tasks.sqlite         ← Baza SQL przechowująca zadania, powiadomienia i logi systemowe.
│
└── /docs/                   ← Hub dokumentacji (logi błędów ERROR_DIFF, archiwa zmian, logi serwera).
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

`agent.js` to serce systemu decyzyjnego. Komunikuje się z modelem **llama-3.3-70b-versatile** poprzez `groq-sdk`.

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
1. **Zabezpieczenie Kluczy (Credentials)**: Wszystkie klucze (Groq, Brave API) znajdują się wyłącznie w pliku `.env` na serwerze (backend) ignorowanym w `.gitignore`. Aplikacja w React uderza po endpointach lokalnych `/api/`.
2. **Graceful Fallbacks**: Jeżeli API zewnętrzne padnie (np. Open-Meteo zrzuci Rate Limit), komponenty są chronione blokami `try-catch`, a obiekty ustawiane w stanie Loading/Error bez rozbijania ekranu na biało (brak crash'u UI).
3. **Ghost Mode**: Tryb czatu, w którym po odświeżeniu zapomina historię i nie zapisuje logów w localStorage z myślą o prywatnych sesjach projektowych.
4. **Izolacja Portów**: Komunikacja oparta w 100% o proxy Vite, tak aby żądania webowe przechodziły przez localhost połączone z Node.js, rozwiązując problemy z CORS (Cross-Origin Resource Sharing).

---
*Dokument zrealizowany zgodnie ze zleceniem. Podpisano: Agent AI.*
