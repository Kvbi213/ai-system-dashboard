## Wersja Bieżąca
**v2.9.0**

## v 2.9.0 — 2026-09-07
**Typ:** MINOR  
**Zakres:** Integracja Wyboru Motywu i Akcentu przy Nazwie Użytkownika, Wielomodułowe Narzędzia AI (Timetable, Workouts, Finances, Calendar, Theme), Pełne Przewijanie i Ergonomia Widoków Finansów, Planu Lekcji, Treningów i Kalendarza, Serverless News API z Integracją Brave Search.

### Zmiany
- [+] Dodano: Szybki wybór gotowego motywu wizualnego (`THEME_PRESETS`: Dark Cyber, Retro Amber CRT, Monochrome Slate, Matrix Terminal, Synthwave 80s, Nordic Frost, Paper Light) oraz paletę akcentów kolorystycznych bezpośrednio w kreatorze początkowym `SetupWizard.jsx` (Krok 1) tuż obok wprowadzania imienia / pseudonimu.
- [+] Dodano: Szybki selektor motywów i akcentów w sekcji „Profil Użytkownika & Język” w `SettingsPage.jsx`, umożliwiając natychmiastową zmianę estetyki systemu bez konieczności przewijania do odrębnych sekcji.
- [+] Dodano: Rozszerzone narzędzia i dyspozytor akcji dla agenta AI (`api/agent.js` oraz `clientAiDispatcher.js`) — obsługa znaczników akcji (`[ACTION:ADD_TASK]`, `[ACTION:ADD_LESSON]`, `[ACTION:ADD_EXPENSE]`, `[ACTION:ADD_WORKOUT]`, `[ACTION:ADD_EVENT]`, `[ACTION:SET_THEME]`, `[ACTION:REMEMBER]`). Agent potrafi teraz bezpośrednio modyfikować plan lekcji, rejestrować wydatki i treningi, planować wydarzenia w kalendarzu oraz przełączać motywy na polecenie słowne.
- [+] Dodano: Nowy endpoint serverless `api/news.js` na Vercel z integracją Brave Search News API (`api.search.brave.com`), nagłówkami CORS oraz zoptymalizowanymi kategoriami fallbacku (AI, CyberSec, Startups, Cloud, Dev).
- [*] Zmodyfikowano: `ITNewsTicker.jsx` — usunięto blokadę trybu chmurowego, podłączono pobieranie najnowszych wiadomości z `api/news`, dodano dynamiczne kategorie i podgląd snippetów.
- [!] Naprawiono: Brak możliwości przewijania widoku finansów w `FinancePage.jsx` — usunięto restrykcyjne `overflow-hidden`, dodano `overflow-y-auto custom-scrollbar pb-24 md:pb-8 min-h-0` oraz wyeliminowano ściskanie kontenera historii transakcji (`shrink-0 min-h-[380px]`). Cała strona przewija się płynnie od wykresów po pełną historię wpisów.
- [!] Naprawiono: Zbyt małą przestrzeń na podgląd lekcji w `TimetablePage.jsx` — kontener główny otrzymał pełne przewijanie `overflow-y-auto custom-scrollbar`, dodano przycisk zwijania/rozwijania statystyk górnych (`Zwiń Statystyki ▴`), a w karcie Live Tracker zintegrowano „Dzisiejszą oś czasu” z podglądem wszystkich kolejnych lekcji danego dnia.
- [!] Naprawiono: Ograniczenia przewijania w `WorkoutsPage.jsx` — kontener otrzymał `overflow-y-auto custom-scrollbar pb-24 md:pb-8`, umożliwiając swobodny wgląd w całą historię treningów i opisy ćwiczeń.
- [!] Naprawiono: Obcinanie dolnej sekcji w `CalendarPage.jsx` — dostosowano proporcje komórek dni (`min-h-[44px] sm:min-h-[56px] md:min-h-[62px]`) oraz wprowadzono `overflow-y-auto custom-scrollbar pb-24 md:pb-8`, dzięki czemu cały kalendarz miesięczny oraz panel „Najbliższe Wydarzenia” mieszczą się na ekranie i są w 100% czytelne.
- [*] Zmodyfikowano: Pomyślnie zrekompilowano (0 błędów) obie wersje repozytorium (z Firebase oraz BEZ FIREBASE).

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY

---

## v 2.8.0 — 2026-09-07
**Typ:** MINOR  
**Zakres:** Kompleksowa Przebudowa Architektury Mobilnej & Touch UX (Górny Pasek App Bar, Dolny Pasek Quick Bar, Wysuwana Szuflada Modułów & Motywów, Responsywność Siatek 2x2 i Modali)

### Zmiany
- [+] Dodano: Nowy Mobile Top App Bar w `Sidebar.jsx` z logotypem AG, dynamicznym wskaźnikiem aktywnego widoku, pulsem statusu online oraz skrótem wyszukiwarki.
- [+] Dodano: Natywny Mobile Bottom Quick Bar w `Sidebar.jsx` z bezpiecznym marginesem iOS (`safe-area-inset-bottom`), 4 kluczowymi zakładkami (`Pulpit`, `Czat AI`, `Plan Lekcji`, `Finanse`) oraz przyciskiem menu `Więcej`.
- [+] Dodano: Wysuwaną szufladę mobilną (Bottom Sheet Drawer) z efektem rozmytego szkła, 2-kolumnową siatką wszystkich modułów systemu, 1-dotykowym przełącznikiem motywów stylistycznych oraz łączem do Ustawień.
- [*] Zmodyfikowano: `core.client.jsx` — reorganizacja kontenera nadrzędnego (`flex-col md:flex-row`) oraz wprowadzenie bezpiecznego odstępu `pb-20 md:pb-0` eliminującego przesłanianie treści przez dolny pasek nawigacyjny.
- [*] Zmodyfikowano: Responsywność wszystkich modułów i stron (`Dashboard.jsx`, `ChatPage.jsx`, `Terminal.jsx`, `TimetablePage.jsx`, `FinancePage.jsx`, `WorkoutsPage.jsx`, `CalendarPage.jsx`, `SettingsPage.jsx`, `WidgetsPage.jsx`, `MemoryPage.jsx`, `OSINTPage.jsx`, `ServerPage.jsx`, `SearchPage.jsx`, `LockScreen.jsx`) — bezpieczne modale z przewijaniem pionowym `max-h-[90dvh] overflow-y-auto`, 2-kolumnowe siatki metryk na smartfonach, zabezpieczenie `min-w-0` przed rozszerzaniem formularzy przez klawiatury dotykowe oraz przyciski akcji widoczne na ekranach dotykowych.
- [*] Zmodyfikowano: Pomyślnie zrekompilowano (0 błędów) i wdrożono do chmury produkcyjnej.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY

---

## v 2.7.0 — 2026-09-07
**Typ:** MINOR  
**Zakres:** Konfiguracja Widoczności Zakładek Nawigacji, Równe Wymiary Wszystkich Widżetów & Rozszerzone Presety Motywów Wizualnych (Retro CRT, Monochrome, Matrix, Synthwave, Nordic)

### Zmiany
- [+] Dodano: Pełną personalizację widoczności zakładek bocznego paska nawigacji (`system_visible_nav`). W `SettingsPage.jsx` wdrożono dedykowaną zakładkę „Nawigacja & Zakładki” z przełącznikami dla wszystkich 10 modułów (`/`, `/chat`, `/timetable`, `/memory`, `/osint`, `/calendar`, `/finances`, `/workouts`, `/widgets`, `/server`) oraz szybkimi profilami (Pokaż wszystkie, Profil minimalistyczny, Przywróć domyślne).
- [*] Zmodyfikowano: `Sidebar.jsx` dynamicznie filtruje pozycje menu w oparciu o stan `visibleNav` i nasłuchuje w czasie rzeczywistym zdarzenia `visibleNavChanged`. Zakładka `Ustawienia` jest trwale przypięta jako zabezpieczenie przed utratą dostępu.
- [*] Zmodyfikowano: Ujednolicono i wyrównano wszystkie widżety w `WidgetsPage.jsx` — siatka została skonfigurowana ze sztywnym `auto-rows-[360px]` oraz jednakową wysokością kontenerów `h-[360px] flex flex-col`. Poprawiono `SystemMonitor.jsx` z `h-fit` na `h-full flex flex-col`. Wszystkie 8 widżetów ma teraz dokładnie tę samą wysokość i idealne wyrównanie w siatce.
- [+] Dodano: Rozbudowaną paletę gotowych motywów wizualnych w `SettingsPage.jsx` z interaktywnymi kartami podglądu i 1-klikiem aktywacji:
  - 🌌 **Dark Cyber (Domyślny)**: Głęboki grafit, neonowa zieleń.
  - 📟 **Retro Amber CRT**: Kineskopowy bursztyn lat 80. (`#140E05` / `#FFB000`).
  - 🏁 **Monochrome Slate**: Czysta czerń, grafit i biel (`#0A0A0C` / `#F5F5F5`).
  - 🟢 **Matrix Terminal**: Hakerska zielona konsola (`#020B04` / `#00FF41`).
  - 🌆 **Synthwave 80s**: Neonowa magenta i fiolet cyberpunku (`#120824` / `#FF0080`).
  - ❄️ **Nordic Frost**: Krystaliczny chłodny błękit i arktyczny granat (`#0A131F` / `#38BDF8`).
  - 📄 **Paper Light**: Jasny tryb produktywny (`#F4F4F5` / `#FFFFFF`).
- [+] Dodano: Dodatkowe opcje sterowania interfejsem w Ustawieniach: przełącznik efektu Glassmorphism (rozmycie tła), przełącznik animacji interfejsu (tryb natychmiastowy / terminalowy), tryb kompaktowy UI o wysokiej gęstości danych oraz selektor domyślnego modelu AI (`openai/gpt-oss-120b`).
- [+] Dodano: Narzędzie kopii zapasowej konfiguracji — eksport wszystkich ustawień do pliku `omnidash-config.json` oraz natychmiastowy import JSON.
- [*] Zmodyfikowano: Poprawiono ładowanie akcentów i modyfikatorów UI (`compact-mode`, `no-glass`, `no-animations`) przy starcie w `core.client.jsx`.
- [*] Zmodyfikowano: Pomyślnie zrekompilowano (0 błędów) i opublikowano na **Firebase Hosting** (`https://void-potato-7721.web.app`) oraz **Vercel Production** (`https://ai-system-dashboard.vercel.app`).
- [*] Zmodyfikowano: Zsynchronizowano i zrekompilowano (0 błędów) repozytorium lustrzane `AI SYSTEM DASHBOARD GITHUB - BEZ FIREBASE`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY

---

### Zmiany
- [!] Naprawiono: Całkowicie wyeliminowano błąd "Błąd połączenia z API Groq" w widżecie wyboru modeli AI (`ModelWidget.jsx`). Wdrożono dedykowaną funkcję serverless `api/models.js` na Vercel z pełną obsługą CORS, dynamicznym wykrywaniem modeli (`openai/gpt-oss-120b`, `llama-3.3-70b-versatile`) oraz resilient fallback.
- [*] Zmodyfikowano: Przebudowano karty wskaźników budżetowych w `FinancePage.jsx` (`POTRZEBY`, `ZACHCIANKI`, `OSZCZĘDNOŚCI`) — dodano obliczanie procentu wykorzystania limitu (`% limitu`), dynamiczne paski postępu, synchronizację z Firestore oraz szybkie profile (`50/30/20`, `60/20/20`, `70/20/10`, `40/30/30`). Kliknięcie w dowolną kartę otwiera konfigurator.
- [-] Usunięto: Zgodnie z dyspozycją operatora wyczyszczono bazy danych dla kategorii `finanse` i `treningi` w Cloud Firestore (`void-potato-7721`) oraz lokalnej SQLite (`tasks.sqlite`). Opróżniono tablice startowe w `cloudSync.js`.
- [*] Zmodyfikowano: Zapewniono pełną dwukierunkową synchronizację: wszystkie dane zapisują się natychmiastowo lokalnie (SQLite / localStorage) oraz w chmurze Google Cloud Firestore, zapewniając dostęp z dowolnego urządzenia w czasie rzeczywistym.
- [*] Zmodyfikowano: Pomyślnie zrekompilowano (0 błędów) i opublikowano na **Firebase Hosting** (`https://void-potato-7721.web.app`) oraz **Vercel Production** (`https://ai-system-dashboard.vercel.app`).
- [*] Zmodyfikowano: Zsynchronizowano i zrekompilowano repozytorium lustrzane `AI SYSTEM DASHBOARD GITHUB - BEZ FIREBASE`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY

---

## v 2.6.1 — 2026-09-07
**Typ:** PATCH  
**Zakres:** Plan Lekcji — Rygorystyczna Selekcja Grupy 1 (38 Jednostek Lekcyjnych) & Pełna Synchronizacja Multi-Platform  

### Zmiany
- [*] Zmodyfikowano: Oczyszczono plan lekcji w `modules/services/cloudSync.js`, Firestore oraz SQLite — usunięto wszystkie pozycje drugiej grupy. Użytkownik przypisany jest bezwzględnie do Grupy 1 (pierwsza pozycja na każdym dzielonym bloku).
- [*] Zmodyfikowano: Wykonano migrację 38 zajęć bezpośrednio do kolekcji `timetable` w Cloud Firestore (`void-potato-7721`) oraz lokalnej bazy SQLite (`data/tasks.sqlite`).
- [*] Zmodyfikowano: Skompilowano z wynikiem 0 błędów i wdrożono na **Firebase Hosting** (`https://void-potato-7721.web.app`) oraz **Vercel Production** (`https://ai-system-dashboard.vercel.app`).
- [*] Zmodyfikowano: Zaktualizowano i zrekompilowano repozytorium `AI SYSTEM DASHBOARD GITHUB - BEZ FIREBASE`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY

---

## v 2.6.0 — 2026-09-07
**Typ:** MINOR  
**Zakres:** Nowy Moduł "Plan Lekcji" (`TimetablePage.jsx`), 7. Kategoria Cloud Firestore (`timetable`), Live Class Tracker & Kognitywna Integracja z GPT-120B  

### Zmiany
- [+] Dodano: Nowy moduł i widok `modules/pages/TimetablePage.jsx` — tygodniowy i dzienny harmonogram zajęć dydaktycznych z dwoma trybami prezentacji (karty osi czasu i siatka tygodniowa od poniedziałku do niedzieli).
- [+] Dodano: Live Class Tracker w `TimetablePage.jsx` automatycznie sprawdzający czas zegara systemowego z powiadomieniem `🟢 TRWAJĄCE ZAJĘCIA` (przedmiot, sala, czas, prowadzący) lub `⏱️ NAJBLIŻSZE ZAJĘCIA DZISIAJ`.
- [+] Dodano: Nową 7. kolekcję Cloud Firestore `timetable` w `modules/services/cloudSync.js` z pełną dwukierunkową synchronizacją w czasie rzeczywistym i starter data.
- [+] Dodano: Pasek statystyk planu (godziny zegarowe w tygodniu, liczba bloków, unikalne przedmioty, liczba zajęć dzisiaj).
- [+] Dodano: Pełny CRUD w `TimetablePage.jsx` (dodawanie, edycja, usuwanie, duplikacja do następnego dnia, filtry typów i wyszukiwarka live).
- [+] Dodano: Integrację kognitywną planu lekcji w `clientAiDispatcher.js` i `api/agent.js` — model `openai/gpt-oss-120b` otrzymuje pełny harmonogram w prompcie systemowym i wykrywa pytania o lekcje.
- [+] Dodano: Pozycję w menu bocznym `Sidebar.jsx` z ikoną `GraduationCap` oraz skrót szybkiej nawigacji w `CommandPalette.jsx` (Ctrl + K).
- [+] Dodano: Kafelek `timetable` w panelu diagnostycznym `SettingsPage.jsx` z obsługą jednoczesnej synchronizacji 7 kategorii.
- [+] Dodano: Tabelę `timetable` w lokalnej bazie SQLite `modules/database.js` oraz dedykowany router `modules/routes/timetable.js` zamontowany w `core.server.js`.
- [*] Zmodyfikowano: Pomyślnie zrekompilowano i opublikowano na **Vercel Production** (`https://ai-system-dashboard.vercel.app`) oraz **Firebase Hosting** (`https://void-potato-7721.web.app`).
- [*] Zmodyfikowano: Zsynchronizowano i pomyślnie zbudowano lustro lokalne `AI SYSTEM DASHBOARD GITHUB - BEZ FIREBASE`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY

---

## v 2.5.1 — 2026-09-07
**Typ:** PATCH  
**Zakres:** Live Brave Search Integration (Brave API + openai/gpt-oss-120b) & Dynamiczne Proporcje Budżetu Finansów  

### Zmiany
- [+] Dodano: Integrację z oficjalnym silnikiem Brave Search API (`api.search.brave.com/res/v1/news/search` oraz `web/search`) bezpośrednio w bezstanowej funkcji serverless Vercel (`api/agent.js`), zasilaną kluczem `BRAVE_SEARCH_API_KEY`.
- [+] Dodano: Inteligentną detekcję intencji `shouldTriggerWebSearch` w zapytaniach użytkownika (wiadomości, newsy, fakty, wydarzenia, technologie, rynki) i automatyczne dołączanie Live Web Intel do promptu systemowego modelu `openai/gpt-oss-120b`.
- [+] Dodano: Rygorystyczny protokół eliminacji fałszywych komunikatów o braku dostępu do internetu w promptach systemowych trybów Mentor (J.A.R.V.I.S) i Worker (F.R.I.D.A.Y).
- [+] Dodano: Dynamiczne obliczanie i prezentację procentów oraz limitów budżetowych w `modules/pages/FinancePage.jsx` (`POTRZEBY (X%)`, `ZACHCIANKI (Y%)`, `OSZCZĘDNOŚCI (Z%)`, wykres kołowy donut, cel alokacji, modale edycji parametrów) w oparciu o konfigurację użytkownika z trwałą synchronizacją w Cloud Firestore.
- [*] Zmodyfikowano: `api/agent.js` z uniwersalną obsługą parametrów wejściowych (`text`, `message`, `prompt`).
- [*] Zmodyfikowano: Zrekompilowano i opublikowano na **Vercel Production** (`https://ai-system-dashboard.vercel.app`) oraz **Firebase Hosting** (`https://void-potato-7721.web.app`).
- [*] Zmodyfikowano: Zsynchronizowano i zrekompilowano repozytorium `AI SYSTEM DASHBOARD GITHUB - BEZ FIREBASE`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY

---

## v 2.5.0 — 2026-09-07
**Typ:** MINOR  
**Zakres:** Vercel Serverless AI Gateway (openai/gpt-oss-120b), Pełna Integracja 6 Kategorii Firestore & Trwały Multi-Device Sync  

### Zmiany
- [+] Dodano: `api/agent.js` — dedykowana bezstanowa funkcja serverless Node.js hostowana na Vercel (`https://ai-system-dashboard.vercel.app/api/agent`), eliminująca blokady CORS przeglądarki, obsługująca model `openai/gpt-oss-120b` (Groq SDK) z pulą 3500 tokenów i głębokim promptem analitycznym.
- [+] Dodano: `api/status.js` — punkt końcowy monitoringu zdrowia i opóźnień bramy Vercel z nagłówkami CORS.
- [+] Dodano: `vercel.json` — konfigurację wdrożeniową dla Vercel z regułami rewrites dla API i routingu SPA.
- [+] Dodano: Pełną integrację 6 kategorii danych w Cloud Firestore: `tasks` (zadania To-Do), `finances` (budżet 50/30/20), `workouts` (treningi), `calendar` (terminarz), `operator_brain` (pamięć długoterminowa) oraz `chat_history` (trwała historia konwersacji).
- [+] Dodano: `initializeAllFirestoreCollections()` w `modules/services/cloudSync.js` z kompletnym zestawem danych starterowych dla każdej kategorii i automatyczną synchronizacją.
- [*] Zmodyfikowano: `modules/services/clientAiDispatcher.js` — skierowano wszystkie zapytania LLM na Vercel Gateway, wstrzykując w czasie rzeczywistym stan wszystkich 6 kategorii danych do promptu systemowego modelu `openai/gpt-oss-120b`.
- [*] Zmodyfikowano: `modules/pages/MemoryPage.jsx` — w pełni zintegrowano z kolekcją `operator_brain` w Firestore w czasie rzeczywistym wraz z modalem dodawania faktów.
- [*] Zmodyfikowano: `modules/context/ChatContext.jsx` — dodano automatyczną, trwałą synchronizację wiadomości z kolekcją `chat_history` w Firestore (niezależnie od urządzenia i przeglądarki).
- [*] Zmodyfikowano: `modules/pages/SettingsPage.jsx` — dodano panel diagnostyczny Vercel AI Gateway (pomiar opóźnienia ping w ms) oraz Centrum Kategorii Firestore z 1-kliknięciową auto-inicjalizacją.
- [*] Zmodyfikowano: Pomyślnie zbudowano i opublikowano na Vercel Production (`https://ai-system-dashboard.vercel.app`) oraz zaktualizowano Firebase Hosting (`https://void-potato-7721.web.app`).
- [*] Zmodyfikowano: Zsynchronizowano i zrekompilowano katalog `AI SYSTEM DASHBOARD GITHUB - BEZ FIREBASE`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY

---


### Zmiany
- [+] Dodano: Kompleksowy renderer Markdown w `Terminal.jsx` z obsługą wielopoziomowych list z pionowymi liniami gałęziowymi (`border-l-2 border-accentPrimary/30`), świecącymi węzłami sekcji (`glowing accent nodes`) oraz czytelną hierarchią typograficzną.
- [+] Dodano: Nowy asymetryczny interfejs dymków wiadomości: dedykowane karty wiadomości Operatora (wyrównane do prawej, z plakietką `OPERATOR`, ikoną i znacznikiem czasu) oraz karty Asystenta z nagłówkiem tożsamości (`J.A.R.V.I.S` / `F.R.I.D.A.Y`), etykietą modelu `openai/gpt-oss-120b` i paskiem akcji.
- [+] Dodano: Komponent `CodeBlock` dla bloków kodu z wyróżnieniem języka oraz przyciskiem natychmiastowego kopiowania kodu (`Copy Code`) ze wskaźnikiem potwierdzenia.
- [+] Dodano: Syntezę mowy na żądanie (przycisk TTS przy każdej wypowiedzi asystenta z możliwością odsłuchania i zatrzymania).
- [+] Dodano: Pasek szybkich podpowiedzi (`Quick Prompts`) z pigułkami akcji (To-Do, Pogoda, Wiadomości IT, Status systemu, /clear) do natychmiastowego wywoływania zapytań 1-kliknięciem.
- [+] Dodano: Pływający przycisk *"Przewiń na dół"* pojawiający się dynamicznie podczas przeglądania wcześniejszej historii czatu.
- [*] Zmodyfikowano: `ChatContext.jsx` wzbogacony o precyzyjne znaczniki czasu ISO dla każdej wiadomości użytkownika i asystenta.
- [*] Zmodyfikowano: Pomyślnie zrekompilowano i opublikowano wersję produkcyjną na Firebase Hosting (`https://void-potato-7721.web.app`) oraz w lokalnej instancji Pulpitu.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY

---

## v 2.3.2 — 2026-09-07
**Typ:** PATCH
**Zakres:** Kognitywna Integracja Kontekstu Zadań & Dynamiczny Dispatcher UI

### Zmiany
- [*] Zmodyfikowano: `modules/services/clientAiDispatcher.js` — wyeliminowano statyczny, sztywny komunikat przekierowujący do Pulpitu przy pytaniach o zadania To-Do.
- [+] Dodano: Automatyczne wstrzykiwanie bieżącego stanu bazy zadań, kalendarza i notatek do promptu systemowego modelu `openai/gpt-oss-120b` w przeglądarce, dzięki czemu model w pełni zna i analizuje zadania użytkownika.
- [+] Dodano: Dynamiczne wykrywanie intencji i montowanie widżetów (`widgets: ['tasks']`, `'weather'`, `'system'`, `'news'`) bezpośrednio pod dymkiem odpowiedzi asystenta w Terminalu.
- [+] Dodano: Obsługa konwersacyjnego dodawania zadań bezpośrednio z czatu (np. *"dodaj zadanie: Przygotować raport pilne"*) z natychmiastowym zapisem do Cloud Firestore.
- [+] Dodano: Wzbogacony inteligentny fallback offline, generujący ustrukturyzowane zestawienie oczekujących i zrealizowanych zadań z identyfikatorami priorytetów wraz z widżetem To-Do.
- [*] Zmodyfikowano: `modules/components/CommandPalette.jsx` — ujednolicono schemat zapisu zadań (`title`, `status`, `priority`) do wspólnej kolekcji `tasks`.
- [*] Zmodyfikowano: `vite.config.js` oraz `.env` — zapewniono stałe wstrzykiwanie `VITE_GROQ_API_KEY` do bundla produkcyjnego.
- [*] Zmodyfikowano: Pomyślnie zrekompilowano i opublikowano nową wersję na Firebase Hosting (`https://void-potato-7721.web.app`) oraz w lokalnej instancji Pulpitu.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY

---

## v 2.3.1 — 2026-09-07
**Typ:** PATCH
**Zakres:** Migracja Silnika LLM na model openai/gpt-oss-120b

### Zmiany
- [*] Zmodyfikowano: Przełączono domyślny model językowy z `llama-3.3-70b-versatile` na `openai/gpt-oss-120b` (GPT-OSS 120B) w `modules/agent.js` (zarówno pętla decyzyjna z łańcuchem fallbacków, jak i auto-podsumowania `generateHourlySummary`).
- [*] Zmodyfikowano: Zaktualizowano autonomiczny dyspozytor LLM po stronie przeglądarki `modules/services/clientAiDispatcher.js` do wykonywania zapytań z modelem `openai/gpt-oss-120b`.
- [*] Zmodyfikowano: Zaktualizowano komponent telemetrii modelu `modules/components/ModelStatus.jsx` do raportowania aktywnego modelu `openai/gpt-oss-120b`.
- [*] Zmodyfikowano: Pomyślnie zrekompilowano i zsynchronizowano zmiany w wersji chmurowej Firebase (`https://void-potato-7721.web.app`) oraz w lokalnej instancji pulpitu wolnej od Firebase (`AI SYSTEM DASHBOARD GITHUB - BEZ FIREBASE`).

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY

---

## v 2.3.0 — 2026-09-07
**Typ:** MINOR
**Zakres:** Architektura Rozproszona (CloudSync, Standalone AI Dispatcher, Charts 50/30/20, Omni Command Palette)

### Zmiany
- [+] Dodano: `modules/services/cloudSync.js` z obsługą dwukierunkowej synchronizacji Firestore w czasie rzeczywistym (Zadania, Notatki, Kalendarz, Finanse, Treningi).
- [+] Dodano: `modules/services/clientAiDispatcher.js` hybrydowy dyspozytor AI z bezpośrednim dostępem do Groq Llama 3.3 70b z poziomu przeglądarki.
- [+] Dodano: `modules/components/CommandPalette.jsx` globalna paleta komend (`Ctrl + K`) do szybkiej nawigacji i akcji w systemie.
- [+] Dodano: Pierścień SVG Donut Chart w `FinancePage.jsx` do wizualizacji alokacji budżetu 50/30/20 oraz dynamiczny wskaźnik przepływów Cashflow.
- [*] Zmodyfikowano: `ChatContext.jsx` zintegrowany z nowym silnikiem `dispatchAiQuery`.
- [*] Zmodyfikowano: `WorkoutsPage.jsx` wzbogacony o kategoryzację, analitykę i synchronizację chmurową.
- [*] Zmodyfikowano: Pomyślnie zbudowano i wdrożono produkcję na `https://void-potato-7721.web.app`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY

---

## v 2.2.1 — 2026-09-07
**Typ:** PATCH
**Zakres:** Eliminacja Defektu Czarnego Ekranu (Crash Guard & Static Host Resilience)

### Zmiany
- [+] Dodano: Komponent `ErrorBoundary.jsx` (Crash Guard) zapobiegający odmontowywaniu drzewa React do czarnego ekranu i oferujący panel ratunkowy (reset sesji, przeładowanie, kopiowanie logu błędu).
- [+] Dodano: Globalny interceptor Axios odrzucający odpowiedzi HTML zwracane przez reguły rewrite hostingu statycznego dla zapytań `/api/*`.
- [*] Zmodyfikowano: `core.client.jsx` zoptymalizowano sekwencję bramek autoryzacyjnych (LockScreen przed SetupWizard), dodano animated loader dla `isVerifying` oraz 3-sekundowy timeout dla zapytań inicjalizacyjnych.
- [*] Zmodyfikowano: `TodoList.jsx`, `NewsFeed.jsx`, `CalendarPage.jsx`, `WorkoutsPage.jsx`, `SystemMonitor.jsx`, `AgentQueue.jsx`, `ModelStatus.jsx`, `MemoryPage.jsx`, `WidgetsPage.jsx` zabezpieczono przed błędami wywołania metod tablicowych (`.filter`, `.map`, `.reduce`) oraz dodano fallback telemetryczny w trybie chmurowym.
- [*] Zmodyfikowano: `WeatherWidget.jsx` wzbogacono o bezpośredni fallback do otwartego API Open-Meteo w środowisku chmurowym.
- [*] Zmodyfikowano: `FinancePage.jsx` usunięto błąd `ReferenceError: bal is not defined`.
- [*] Zmodyfikowano: Przeprowadzono ponowne wdrożenie na Firebase Hosting (`void-potato-7721.web.app`).

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY

---

### Zmiany
- [+] Dodano: Utworzono projekt w Google Cloud Firebase o unikalnym identyfikatorze `void-potato-7721` (Void Potato Matrix).
- [+] Dodano: Baza danych Cloud Firestore `(default)` w regionie `europe-central2` (Warszawa).
- [+] Dodano: Moduł backendowy `modules/firebase.js` (Firebase Admin SDK) obsługujący połączenie i synchronizację.
- [+] Dodano: Moduł tras Express `modules/routes/firebase.js` z punktami końcowymi statusu, weryfikacji i synchronizacji bazy.
- [+] Dodano: Klient frontendowy `modules/firebaseClient.js` (Firebase Web SDK) do autoryzacji w chmurze.
- [+] Dodano: Wdrożono reguły bezpieczeństwa `firestore.rules` ograniczające dostęp wyłącznie do autoryzowanego właściciela (`marektowarek21372137@gmail.com`).
- [*] Zmodyfikowano: `LockScreen.jsx` rozszerzono o autoryzację tożsamości Firebase Właściciela.
- [*] Zmodyfikowano: `SettingsPage.jsx` wzbogacono o panel monitorowania Firestore i przycisk synchronizacji SQLite -> Firestore.
- [*] Zmodyfikowano: `core.server.js` zintegrowano z routerem `/api/firebase`.
- [*] Zmodyfikowano: `ARCHITECTURE.md` zaktualizowano o nową architekturę chmurową.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY

---

## v 2.1.0 — 2026-08-10
**Typ:** MINOR
**Zakres:** Modularna Architektura Backendu (Podział monolitów)

### Zmiany
- [+] Dodano: Dedykowany folder `modules/routes/` dla poszczególnych routerów Express.js.
- [+] Dodano: Dedykowany folder `modules/ai/` wyodrębniający prompty i narzędzia z `agent.js`.
- [*] Zmodyfikowano: `core.server.js` przepisano z pliku ponad 600 linii do czystego entry-pointu.
- [*] Zmodyfikowano: `agent.js` zredukowano poprzez importowanie narzędzi i promptów z nowych modułów.
- [*] Zmodyfikowano: Zaktualizowano `ARCHITECTURE.md`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY

---

## v 1.10.0 — 2026-07-07
**Typ:** MINOR  
**Zakres:** Agent God Mode (Server-Sent Events i narzędzia zarządzające)  

### Zmiany
- [+] Dodano: Server-Sent Events (SSE) w core.server.js i GlobalEventListener w UI
- [+] Dodano: Narzędzia dla Agenta (CHANGE_UI_TAB, RUN_OSINT_SCAN, UPDATE_SYSTEM_SETTINGS, UPDATE_FINANCE_SETTINGS, RELOAD_SYSTEM)

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY

---

## v 1.9.0 — 2026-07-06
**Typ:** MINOR
**Zakres:** Moduł Finansów & Aktualizacja Protokołu Pracy

### Zmiany
- [+] Dodano: Nowa tabela w bazie danych `finances` do obsługi wpisów finansowych.
- [+] Dodano: Narzędzia dla agenta `ADD_FINANCE_RECORD` oraz `DELETE_FINANCE_RECORD` aby AI mogło automatycznie zapisywać/usuwać wydatki i przychody.
- [+] Dodano: Kontekst finansowy (saldo miesięczne, ostatnie transakcje) przekazywany do agenta w `processUserIntent`.
- [+] Dodano: Zakładka "Finanse" w interfejsie graficznym (`FinancePage.jsx`) z listą wpisów, stawkami i możliwością ręcznego dodawania oraz kasowania wpisów.
- [+] Zmieniono: Dodano regułę 26 (Auto-Commit Protocol) w `ZASADYPRACY.md` wymuszającą na AI natychmiastowe commity.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY

---

## v 1.8.0 — 2026-07-06
**Typ:** MINOR
**Zakres:** Architektura: Delegacja Zadań Mentor -> Worker

### Zmiany
- [+] Dodano: Mentor (Digital Mentor) może teraz delegować skomplikowane zadania do Workera poprzez polecenie `delegate_to_worker` w swoim outpuci JSON.
- [+] Dodano: Automatyczne rekursywne wywołanie Workera w tle w `processUserIntent`, jeśli Mentor zgłosił delegację. Wyniki Workera są dołączane do odpowiedzi Mentora.
- [*] Zmodyfikowano: `agent.js` — poprawa promptu `getMentorPrompt` w celu obsługi nowej funkcjonalności.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY

---

## v 1.5.0 — 2026-06-15
**Typ:** MINOR
**Zakres:** Pełna rozbudowa frontendu i backendu — live IT newsy, preferencje kategorii, scheduler, globalny error handler.

### Zmiany
- [+] Dodano: ITNewsTicker.jsx — live IT newsy z Brave Search podzielone na 5 kategorii (AI, Sprzęt, Jailbreak, White Hat, Open Source)
- [+] Dodano: Preferencje kategorii newsów w SettingsPage z zapisem do localStorage i propagacją przez CustomEvent
- [+] Dodano: Endpoint /api/news (proxy Brave Search) i /api/news-brief i /api/schedule
- [+] Dodano: Globalny error middleware Express + logowanie do docs/error.log
- [*] Zmodyfikowano: TodoList.jsx — inline form dodawania zadań, badge priorytetu kolorowy, sekcja ukończonych
- [*] Zmodyfikowano: WeatherWidget.jsx — WMO weather codes, 3h mini prognoza, prawdopodobieństwo opadów
- [*] Zmodyfikowano: NewsFeed.jsx — relative timestamps, ReactMarkdown, hover animations
- [*] Zmodyfikowano: Dashboard.jsx — nasłuchuje na zmianę kategorii newsów przez CustomEvent
- [*] Zmodyfikowano: agent.js — dynamiczna data, Promise.all dla kontekstu, pełne mapowanie recurrence_rule
- [*] Zmodyfikowano: core.server.js — kompletny rewrite z 9 endpointami i error middleware

### Audyt
Status: ZGODNY Z PROTOKOŁEM SYSTEM

---
## Wersja BieĹĽÄ…ca
**v1.4.1**

## v 1.4.1 â€” 2026-06-15
**Typ:** PATCH
**Zakres:** Aktualizacja parsera AI (Groq/Llama 3.3) oraz uniezaleĹĽnienie WeatherWidget od backendu proxy.

### Zmiany
- [*] Zmodyfikowano: `WeatherWidget.jsx` - pobieranie przez czysty frontend zamiast `/api/weather`.
- [*] Zmodyfikowano: `SettingsPage.jsx` - naprawa JSX.
- [*] Zmodyfikowano: `agent.js` - przepisano silnik wczytywania intencji JSON by zlikwidowaÄ‡ "anomaliÄ™", zmieniono model bazowy na LLama-3.3-70b.
- [*] Zmodyfikowano: `package.json` - dodanie `--watch` dla backendu.

### Audyt
Status: ZGODNY Z PROTOKOĹEM SYSTEM

---

## v 1.4.0 â€” 2026-06-15
**Typ:** MINOR
**Zakres:** Skokowa poprawa responsywnoĹ›ci UI oraz wdroĹĽenie SettingsPage (Ghost Mode).

### Zmiany
- [+] Dodano: Nowy peĹ‚noekranowy widok `SettingsPage.jsx` do obsĹ‚ugi moduĹ‚u "Ghost".
- [*] Zmodyfikowano: `core.client.jsx` adaptujÄ…c root layout do wyĹ›wietlaczy mobilnych (Bottom Bar).
- [*] Zmodyfikowano: `Sidebar.jsx` zapewniajÄ…c wsparcie RWD i nawigacjÄ™ do `/settings`.
- [*] Zmodyfikowano: `Dashboard.jsx`, naprawiono zapadanie siÄ™ kolumn na smartfonach poprzez dodanie jawnej wysokoĹ›ci siatki flex.
- [*] Zmodyfikowano: Poprawa marginesĂłw na `ChatPage.jsx` oraz `SearchPage.jsx`.

### Audyt
Status: ZGODNY Z PROTOKOĹEM SYSTEM

---

## v 1.3.0 â€” 2026-06-15
**Typ:** MAJOR / MINOR
**Zakres:** Implementacja architektury Multi-Page (React Router) oraz integracja z Brave Search.

### Zmiany
- [+] Dodano: ZaleĹĽnoĹ›Ä‡ `react-router-dom` dla obsĹ‚ugi nawigacji kliencskiej.
- [+] Dodano: Dedykowane widoki: `Dashboard.jsx`, `ChatPage.jsx`, `SearchPage.jsx`.
- [+] Dodano: Komponent bocznego paska nawigacji `Sidebar.jsx`.
- [*] Zmodyfikowano: PÄ™tlÄ™ AI w `agent.js` dodajÄ…c narzÄ™dzia ReAct (Tool Calling dla Brave Search).
- [*] Zmodyfikowano: `core.client.jsx` jako korzeĹ„ nawigacji (BrowserRouter).
- [*] Zmodyfikowano: `Terminal.jsx` dopasowujÄ…c go do peĹ‚noekranowego okna ChatPage.

### Audyt
Status: ZGODNY Z PROTOKOĹEM SYSTEM

---

## v 1.0.0 â€” 2026-06-15

**Typ:** MAJOR  
**Zakres:** Inicjalizacja rdzenia projektu Personal Command Center  

### Zmiany
- [+] Dodano: StrukturÄ™ katalogĂłw zgodnie z reguĹ‚ami System.
- [+] Dodano: ZASADYPRACY.md, ARCHITECTURE.md, HISTORY.md.
- [+] Dodano: Pliki konfiguracyjne Node.js (.env, package.json).

### Audyt
Status: ZGODNY Z PROTOKOĹEM SYSTEM

---


## v 1.6.0 — 2026-06-22
**Typ:** MINOR
**Zakres:** Integracja z Pushbullet, Live Notifications Widget i optymalizacja Agenta.

### Zmiany
- [+] Dodano: Moduł WebSockets w pushbullet.js.
- [+] Dodano: Widget NotificationsWidget.jsx w Terminalu.
- [*] Zmodyfikowano: Rozszerzono GET_PHONE_NOTIFICATIONS o archiwalne wiadomości w gent.js.
- [*] Zmodyfikowano: Wyłączono rendering tabel powiadomień przez Agenta.

### Audyt
Status: ZGODNY Z PROTOKOŁEM SYSTEM
---

## v 1.7.0 — 2026-06-29
**Typ:** MINOR
**Zakres:** Chirurgiczna redukcja nazwy kodowej (Antigravity -> System) oraz wdrożenie dynamicznej inicjalizacji API i Factory Reset.

### Zmiany
- [+] Dodano: ApiConfigScreen.jsx — inicjalizacja i szyfrowanie kluczy przy pierwszym starcie
- [+] Dodano: Endpoint /api/system/reset — zacieranie śladów bazy i kluczy API
- [*] Zmodyfikowano: Globalne wyczyszczenie słowa-klucza z wszystkich plików projektu
- [*] Zmodyfikowano: core.client.jsx - nowa kolejność renderowania i autoryzacji

### Audyt
Status: ZGODNY Z PROTOKOŁEM SYSTEM

---

## v 1.8.0 — 2026-06-30
**Typ:** MINOR
**Zakres:** De-personalizacja i przygotowanie kodu do publicznego repozytorium na Githubie.

### Zmiany
- [+] Dodano: Możliwość wpisania Imienia/Pseudonimu w SetupWizard oraz SettingsPage.
- [*] Zmodyfikowano: agent.js — zastąpiono sztywno wpisane imiona dynamiczną wartością options.userName z kontekstu.
- [*] Zmodyfikowano: ChatContext.jsx i core.server.js — wstrzyknięcie userName do payloadu zapytań agenta.
- [*] Zmodyfikowano: ZASADYPRACY.md — anonimizacja ścieżki Windows/WSL z użyciem zmiennej $USER.

### Audyt
Status: ZGODNY Z PROTOKOŁEM SYSTEM

---
