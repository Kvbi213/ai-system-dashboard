# TOPOGRAFIA SYSTEMU OMNIDASH :: DRZEWO STRON, PODSTRON I KOMPONENTÓW (SITEMAP V3.0)
> Dokument Architektoniczny: Kompletna Topologia Interfejsu, Hierarchia Tras React Router v7, Subwidoki, Modale, Warstwy Nakładkowe i Punkty Końcowe API.

- **Wersja Systemowa:** `v2.34.2 / v3.0.0-PROPOSAL`
- **Data Aktualizacji:** Październik 2026
- **Status Operacyjny:** `[+] DOKUMENTACJA ZSYNCHRONIZOWANA`
- **Standard Inżynieryjny:** Protokół Antigravity (NANO v3.2) | Zero-Emoji Policy | Zero-Trust Architecture
- **Obsidian Sync:** `C:\Users\Jakub Lis\Documents\OBSIDIAN\PROJEKTY\OmniDash_AI_Dashboard\07_Topografia_Stron_i_Podstron_Tree.md`

---

## 1. STRUKTURALNE DRZEWO TOPOGRAFII SYSTEMU (ASCII SITEMAP TREE)

Poniższe drzewo przedstawia pełny rozkład tras routera, hierarchię komponentów podrzędnych, zakładek, okien modalnych oraz powiązań z warstwą danych (Firestore / SQLite / API):

```
OMNIDASH ROOT (core.client.jsx)
│
├── [0.0] GLOBAL OVERLAYS & CONTROLLERS (Warstwy Nakładkowe & Nasłuch)
│   ├── LockScreen.jsx                     [Autoryzacja PIN / Hasło, SHA-256 session lock]
│   ├── SetupWizard.jsx                    [Kreator pierwszego rozruchu & profil operatora]
│   ├── ApiConfigScreen.jsx                [HUD brakujących kluczy API (.env / runtime)]
│   ├── CommandPalette.jsx                 [Globalny skrót Ctrl+K, wyszukiwarka akcji i tras]
│   ├── ToastContainer.jsx                 [Pływający hub powiadomień Glassmorphism]
│   ├── VoiceInspectorHUD.jsx              [Wskaźnik mowy i ciągłego nasłuchu "Hej Omni"]
│   ├── OnboardingTour.jsx                 [Interaktywny samouczek krok-po-kroku]
│   └── GlobalEventListener.jsx            [Globalny nasłuch zdarzeń systemowych i skrótów]
│
├── [1.0] GŁÓWNA NAWIGACJA (Navigation Shell)
│   ├── Sidebar.jsx (Desktop: md:flex)
│   │   ├── Brand Header (AG Logo + Rozwijanie/Zwijanie md:w-20 vs md:w-64)
│   │   ├── Wyszukiwarka Szybka (Ctrl+K Button)
│   │   ├── Przycisk Hej Omni (Status LIVE nasłuchu mikrofonu)
│   │   ├── Lista 12+ Zakładek Głównych (z opcją konfiguracji widoczności)
│   │   └── Dolny Pasek Akcji (Szybki Theme Switcher Sun/Moon + Link do Ustawień)
│   │
│   ├── Mobile Top Bar (Mobile: md:hidden)
│   │   ├── Logo AG + Nazwa aktywnej podstrony
│   │   ├── Wskaźnik "Hej Omni" (ikona mikrofonu z animacją ping)
│   │   ├── Przycisk Wyszukiwarki (Search)
│   │   └── Przycisk Menu Drawer (Hamburger / Krzyżyk)
│   │
│   ├── Mobile Bottom Bar (Mobile: md:hidden, fixed bottom-0)
│   │   ├── Tab 1: Pulpit (/)
│   │   ├── Tab 2: Asystent AI (/chat)
│   │   ├── Tab 3: Plan Dnia (/timetable)
│   │   ├── Tab 4: Oceny (/grades)
│   │   └── Tab 5: Więcej (Otwarcie Mobile Drawer)
│   │
│   └── Mobile Navigation Drawer (Mobile Bottom Sheet)
│       ├── Profil Operatora (Witaj <OPERATOR> + Status Online)
│       ├── Szybka Wyszukiwarka z Ctrl+K
│       ├── Siatka Modułów 2-kolumnowa (Dostęp do 12 modułów)
│       ├── Karuzela Szybkiej Zmiany Motywu (7 palet: Dark, Retro, Mono, Matrix, Synth, Nordic, Light)
│       └── Przycisk Ustawień Systemu (/settings)
│
└── [2.0] TRASY I PODSTRONY APLIKACJI (Application Router Routes)
    │
    ├── [2.1] / -> Dashboard.jsx [Pulpit Główny & Telemetria]
    │   ├── Header: Powitanie, Zegar Warszawski, Status Usług SSE / Cloud
    │   ├── ITNewsTicker.jsx: Wiadomości IT (Brave API, harmonogram slotowy 10:00/15:00/20:00)
    │   ├── QuickActionsBar: Szybkie dodawanie zadań, wydatków, wywołanie asystenta
    │   ├── QuickStatsDeck: Kafelki KPI (Zadania dziś, Średnia ocen, Stan budżetu, Pogoda)
    │   ├── TasksMatrix: Rejestr zadań z podziałem na statusy (Do zrobienia / Zrobione)
    │   ├── WeatherWidget: Pogodynka Open-Meteo z geolokalizacją GPS
    │   ├── TrafficWidget: Alerty drogowe CANARD / GITD / GDDKiA w promieniu 10 km
    │   └── QuickHabitTracker: Odznaczanie nawyków porannych i wieczornych
    │
    ├── [2.2] /chat -> ChatPage.jsx [Centrum Kognitywne AI & Asystent Głosowy]
    │   ├── ChatHistoryFeed: Wątek konwersacji (Markdown, bloki kodu, formatowanie techniczne)
    │   ├── ToolExecutionLog: Wizualny podgląd wywołań narzędzi (Tool Calling):
    │   │   ├── ADD_TO_DO / UPDATE_TO_DO / DELETE_TO_DO
    │   │   ├── ADD_FINANCE_RECORD / TRANSFER_FUNDS
    │   │   ├── WEB_SEARCH (Brave Search Integration)
    │   │   ├── SEND_PUSH (Powiadomienia Pushbullet na smartfon)
    │   │   └── fs_read_file (Bezpieczny odczyt z tarczy sandboxingu)
    │   ├── AudioPlayerControl: Odtwarzacz syntezy mowy (Fish Audio / Edge TTS / ElevenLabs)
    │   ├── LiveVoiceIndicator: Wizualizacja fali dźwiękowej podczas rozmowy na żywo
    │   └── ChatInputBar: Pole tekstowe, przycisk mikrofonu, selektor modelu AI (Groq LPU)
    │
    ├── [2.3] /timetable -> TimetablePage.jsx [Plan Dnia & Harmonogram Zajęć]
    │   ├── Subnawigacja Zakładek (Segmented Tabs):
    │   │   ├── Tab: [ Wszystkie ] (Połączony plan dnia)
    │   │   ├── Tab: [ Szkolne ]   (Dziennik Librus Synergia)
    │   │   └── Tab: [ Osobiste ]  (Stały schemat dnia: 06:00 - 23:00)
    │   ├── Przełącznik Widoków: Tydzień (Siatka 7 dni) vs Dzień (Lista chronologiczna)
    │   ├── Selektor Dni Tygodnia (Poniedziałek – Niedziela)
    │   ├── Narzędzia Sortowania: Chronologicznie, Kategoria, Status (Odwołane/Odbywające się)
    │   ├── Karta Lekcji / Zdarzenia:
    │   │   ├── Detekcja lekcji odwołanych ([!] ODWOŁANA, przekreślenie, czerwony badge)
    │   │   ├── Wykrywanie zastępstw i okienek
    │   │   ├── Rozpoznawanie nauczyciela (teacherUtils.js) i numeru sali
    │   │   └── Etykieta kategorii (Wykład, Ćwiczenia, Trening, Nauka, Praca, Reset)
    │   └── Modal: Dodaj / Edytuj wpis do planu (Firestore `timetable` & SQLite)
    │
    ├── [2.4] /grades & /oceny -> GradesPage.jsx [Dziennik Ocen Librus Synergia]
    │   ├── Metric Hero Card: Średnia Ważona (4.62), Wskaźnik paska, Bilans ocen
    │   ├── Pasek Akcji: Wymuszenie odświeżenia z serwera Librus (pasek postępu min. 800ms)
    │   ├── Przełącznik Semestrów: Semestr 1 | Semestr 2 | Cały Rok
    │   ├── Filtry Przedmiotów: Wszystkie, Zagrożenia, Oceny celujące/bardzo dobre
    │   ├── Karta Przedmiotu:
    │   │   ├── Nazwa przedmiotu i średnia cząstkowa
    │   │   ├── Pigułki ocen z wagami (Waga 1, Waga 2, Waga 3, Waga 0 diagnostyczna)
    │   │   ├── Obsługa ocen ze znakami +/- oraz ocen nienumerycznych (N, np, zw)
    │   │   └── Symulator Ocen: Możliwość wpisania hipotetycznej oceny i podglądu nowej średniej
    │   └── Tabela Szczegółowa Ocen: Data wpisu, kategoria, waga, nauczyciel, komentarz
    │
    ├── [2.5] /finances -> FinancePage.jsx [Autonomiczny Budżet 50/30/20]
    │   ├── EnvelopeCardsDeck:
    │   │   ├── Koszyk Konieczności (Needs - 50%): Rachunki, jedzenie, szkoła
    │   │   ├── Koszyk Zachcianki (Wants - 30%): Relaks, wyjścia, hobby
    │   │   └── Koszyk Oszczędności (Savings - 20%): Inwestycje, rezerwa awaryjna
    │   ├── PushbulletBankListener: Pasywny odbiór transakcji ze strumienia WebSocket
    │   ├── TransactionLedger: Lista transakcji z filtrowaniem wg daty, kwoty i koszyka
    │   ├── TransferModal: Bezkolizyjny transfer środków pomiędzy koszykami
    │   ├── AddExpenseModal: Ręczne księgowanie wydatku z przypisaniem tagów
    │   └── ExportToolsBar: Eksport do pliku CSV (RFC 4180) oraz generowanie raportu PDF
    │
    ├── [2.6] /workouts -> WorkoutsPage.jsx [Dziennik Treningowy & FBW Strych]
    │   ├── Header: Statystyki sesji (Zapisane sesje, Ostatni trening, Tonaż)
    │   ├── ActiveWorkoutMode:
    │   │   ├── Baza Schematu: FBW Strych (Podciąganie, Dipy, Wiosłowanie, OHP, Przysiady, Wznosy)
    │   │   ├── Stepper Serii: Oznaczanie ukończonych serii (2 serie × 8-12 powt.)
    │   │   ├── Rejestr Ciężaru: Obciążenie hantli / kolor gumy oporowej
    │   │   └── Stoper Przerw (Rest Timer): Odliczanie 90s - 120s z sygnałem dźwiękowym
    │   ├── FilterPills: Wszystkie, Siłowy, Cardio, Kalistenika, Rozciąganie
    │   ├── WorkoutFeed: Archiwum odbytych sesji z notatkami i podglądem objętości
    │   └── Modal: Nowa sesja treningowa (Zapis do Firestore `workouts` i SQLite)
    │
    ├── [2.7] /calendar -> CalendarPage.jsx [Terminarz & Kalendarz Wydarzeń]
    │   ├── Grid View: Miesięczna siatka terminów z podglądem zagęszczenia zdarzeń
    │   ├── Agenda View: Lista nadchodzących terminów (Najbliższe 7 dni / 30 dni)
    │   ├── Kategoryzacja: Sprawdziany (Librus), Urodziny, Spotkania, Zadania
    │   └── Modal: Utwórz wydarzenie z powiadomieniem Push na smartfon
    │
    ├── [2.8] /osint -> OSINTPage.jsx [Centrum Wywiadu & Bezpieczeństwa]
    │   ├── DomainInvestigationTab: Skanowanie domen (DNS, MX, SPF, DMARC, NS)
    │   ├── IPGeolocationTab: Dokładna geolokalizacja adresu IP z mapą (GeoJS API)
    │   ├── HistoricalArchiveTab: Migawki archiwalne stron (Wayback Machine API)
    │   ├── ThreatIntelligenceTab: Wykrywanie podatności i otwartych portów (HackerTarget)
    │   └── InvestigationLog: Dziennik śledztwa z możliwością eksportu dowodów do TXT/PDF
    │
    ├── [2.9] /entities & /podmioty -> EntitiesPage.jsx [Drzewo Pochodzenia & Graf]
    │   ├── ProvenanceTreeView: Drzewo hierarchii podmiotów z relacjami rodzic-dziecko
    │   ├── NetworkGraphView: Interaktywna sieć powiązań między osobami i organizacjami
    │   ├── 10-DomainCardInspector: Karta podmiotu ze skarbca Obsidian:
    │   │   ├── Metryka, Sociale, Charakter, Zdrowie, Finanse
    │   │   └── Zainteresowania, Rutyna, Relacja, Sieć, Zaufanie & Ryzyka
    │   ├── HousingMatrix120m2: Klasyfikacja rezydentów (Core / Współlokator / Gość)
    │   └── LisCraftMixologyMenu: Cyfrowa karta receptur barmańskich
    │
    ├── [2.10] /memory -> MemoryPage.jsx [Pamięć Długoterminowa AI - Operator Brain]
    │   ├── FactBrowser: Baza utrwalonych faktów o operatorze, nawykach i preferencjach
    │   ├── InstructionEditor: Zarządzanie trwałymi dyrektywami asystenta
    │   └── MemorySyncStatus: Stan spójności pliku `data/operator_brain.json` z Firestore
    │
    ├── [2.11] /widgets -> WidgetsPage.jsx [Siatka Monitoringu & Widżety]
    │   ├── HardwareMonitorWidget: Obciążenie procesora, pamięci RAM i temperatury
    │   ├── MarketWatchWidget: Kursy walut, kryptowalut i indeksów giełdowych
    │   ├── QuickNotesWidget: Podręczny notatnik scratchpad
    │   └── ConfigDrawer: Personalizacja układu kafelków
    │
    ├── [2.12] /server -> ServerPage.jsx [Konsola Zarządzania Serwerem Node.js]
    │   ├── ProcessHealthMonitor: Uptime, pamięć sterty V8, stan pętli zdarzeń
    │   ├── DatabaseStatsDeck: Liczba rekordów w tabelach SQLite, stan pliku WAL
    │   ├── SSETelemetryConsole: Terminal logów systemowych emitowanych na żywo
    │   └── ActionsBar: Restart procesów pomocniczych, czyszczenie pamięci podręcznej
    │
    ├── [2.13] /browser -> BrowserPage.jsx [Wbudowany Webview / Hub Linków]
    │   ├── SandboxedWebFrame: Podgląd zewnętrznych serwisów i paneli chmurowych
    │   └── BookmarksDeck: Szybkie skróty do paneli Firebase, Vercel, Librus, GitHub
    │
    ├── [2.14] /search -> SearchPage.jsx [Globalna Wyszukiwarka Pełnotekstowa]
    │   ├── UnifiedSearchInput: Wyszukiwanie jednoczesne we wszystkich zbiorach danych
    │   └── CategorizedResultsList: Zadania, Oceny, Plan Dnia, Notatki, Finanse, OSINT
    │
    └── [2.15] /settings -> SettingsPage.jsx [Konfiguracja Środowiskowa i Bezpieczeństwo]
        ├── ThemeSelector: Wybór motywu (Cyber Dark, Retro Amber, Mono, Matrix, Synth, Nordic, Light)
        ├── ApiCredentialsManager: Konfiguracja kluczy Groq, Brave, Pushbullet, Librus
        ├── SecurityPolicyEngine: Podgląd uprawnień AI, reguł CORS i blokad destrukcyjnych
        ├── NavigationCustomizer: Włączanie i ukrywanie zakładek w Sidebarze
        └── BackupAndRestore: Zrzut lokalnej bazy SQLite i eksport konfiguracji
```

---

## 2. TABELA MATRYCY STRON, UPRAWNIEŃ I PUNKTÓW KOŃCOWYCH

| Trasa URL | Główny Komponent | Typ Zawartości | Kluczowe Podwidoki / Modale | Zależności Danych (Backend / DB) |
|---|---|---|---|---|
| `/` | `Dashboard.jsx` | Przegląd & KPI | Szybkie akcje, Pogoda, Korki, Wiadomości IT | SQLite, Firestore `tasks`, `api/news`, Open-Meteo |
| `/chat` | `ChatPage.jsx` | Konwersacja LLM | Wskaźnik audio, Log narzędzi, Wybór modelu | Groq API `openai/gpt-oss-120b`, `/api/tts` |
| `/timetable` | `TimetablePage.jsx` | Harmonogram Dnia | Zakładki Szkolne/Osobiste, Dni Tygodnia, Modal wpisu | Firestore `timetable`, SQLite `timetable`, Librus Scraper |
| `/grades` | `GradesPage.jsx` | Dziennik Ocen | Karty przedmiotów, Symulator średniej, Refresh bar | Firestore `librus_cache`, `GET /api/librus?refresh=true` |
| `/finances` | `FinancePage.jsx` | Budżet 50/30/20 | Koperty budżetowe, Księgowanie, Transfery, Eksport | SQLite `finance_records`, Pushbullet WebSocket |
| `/workouts` | `WorkoutsPage.jsx` | Trening & FBW | Tryb Live Sesji, Stepper serii, Stoper przerw | Firestore `workouts`, SQLite `workouts` |
| `/calendar` | `CalendarPage.jsx` | Terminarz | Siatka miesięczna, Lista terminów, Modal zdarzenia | Firestore `calendar_events`, Terminy Librus |
| `/osint` | `OSINTPage.jsx` | Wywiad & Śledztwo | DNS Lookup, GeoIP, Wayback, HackerTarget | `/api/osint`, GeoJS, Wayback Machine |
| `/entities` | `EntitiesPage.jsx` | Relacje & Graf | Drzewo pochodzenia, Graf powiązań, Karty 10 domen | Firestore `entities_cache`, Obsidian Vault |
| `/memory` | `MemoryPage.jsx` | Baza Wiedzy AI | Przeglądarka faktów, Edytor instrukcji | `data/operator_brain.json`, Firestore `operator_brain` |
| `/widgets` | `WidgetsPage.jsx` | Monitoring | Siatka telemetrii, Kursy walut, Kryptowaluty | `/api/system/stream` (SSE), API giełdowe |
| `/server` | `ServerPage.jsx` | Stan Systemu | Monitor sterty, Stan SQLite WAL, Konsola logów | Express `/api/system/stream`, `database.js` |
| `/browser` | `BrowserPage.jsx` | Przeglądarka | Ramka sandboxed, Baza zakładek chmurowych | Klient statyczny |
| `/search` | `SearchPage.jsx` | Szukaj (Ctrl+K) | Wyszukiwanie hybrydowe po wszystkich kolekcjach | Lokalne indeksy SQLite + Firestore Cache |
| `/settings` | `SettingsPage.jsx` | Ustawienia | Selektor 7 motywów, Menedżer API, Polityka praw | `localStorage`, `/api/system/keys-status`, `.env` |

---

## 3. MAPA ARCHITEKTURY WARSTWY API (SERVERLESS & EXPRESS ENDPOINTS)

```
API GATEWAY (Vercel Serverless & Express Core 5000)
│
├── /api/agent                       [POST: Kognitywny proces decyzyjny Groq LPU + Tool Calling]
├── /api/tts                         [POST: Wielosilnikowa synteza mowy: Fish Audio / Edge TTS]
├── /api/librus                      [GET: Odczyt buforu ocen i planu z flagą ?refresh=true]
├── /api/librus/refresh              [POST: Wymuszenie bezpośredniej autoryzacji i scrapingu Librus]
├── /api/news                        [GET: Brave Search API z harmonogramem slotowym 10/15/20]
├── /api/osint                       [POST: Bezpieczna brama wywiadowcza z tarczą anty-SSRF]
├── /api/entities                    [GET: Ekstrakcja podmiotów i relacji z bazy SQLite / Obsidian]
├── /api/pushbullet-webhook          [POST: Webhook asynchronicznych powiadomień bankowych]
├── /api/gcp/budget-webhook          [POST: Odbiór alertów Cloud Pub/Sub budget-auto-stop]
├── /api/system/stream               [GET: Strumień Server-Sent Events (SSE) metryk CPU/RAM/WAL]
└── /api/system/keys-status          [GET: Status gotowości zmiennych środowiskowych API]
```

---

> **MELDUNEK TOPOGRAFICZNY:**  
> Mapa topograficzna v3.0 odzwierciedla stan faktyczny całego frontendu i backendu OmniDash.  
> Stan: `[+] ZGODNOŚĆ Z KODEM 100%`.
