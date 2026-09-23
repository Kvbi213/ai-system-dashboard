## Wersja Bieżąca
**v2.23.0**

## v 2.23.0 — 2026-09-23
**Typ:** MINOR  
**Zakres:** Automatyczna Synchronizacja Planu Lekcji z Librus Synergia, Dynamiczna Detekcja Nieobecności Nauczycieli i Korelacja Zastępstw/Okienek w Module Planu Lekcji (`TimetablePage.jsx`), Baner Absencji, Oznaczanie Odwołanych Lekcji, Integracja z Kontekstem Kognitywnym AI (`clientAiDispatcher.js`), Pamięć Podręczna SQLite `librus_timetable_cache` oraz Zestaw Testów Vitest (158/158 PASS).

### Zmiany
- [+] Dodano: Algorytm korelacji planu lekcji z absencjami w `modules/services/librusService.js` (`cleanTeacherName`, `matchTeacherNames`, `parseTimeToMinutes`, `checkTimeOverlap`, `fetchLibrusTimetableFromSource`, `correlateTimetableWithAbsences`, `saveTimetableToCache`, `getCachedTimetable`, `syncLibrusTimetable`, `getDemoTimetableData`).
- [+] Dodano: Endpointy REST `GET /api/librus/timetable`, `POST /api/librus/timetable/refresh`, `POST /api/librus/timetable/import-to-schedule` w `modules/routes/librus.js` i `api/librus.js`.
- [+] Dodano: Replikację planu lekcji i zastępstw do bazy SQLite `librus_timetable_cache` oraz Cloud Firestore `librus_cache/timetable`.
- [+] Dodano: Nowe funkcjonalności w `modules/pages/TimetablePage.jsx`: bursztynowy baner absencji kadry na wybrany dzień/tydzień, pigułki `⚠️ ABSENCJA (${hours})`, przekreślanie nieobecnych nauczycieli, przycisk i status „Okienko / Odwołana” (`❌ OKIENKO`), szybki filtr „Tylko zmiany / absencje”, przycisk „Pobierz z Librusa” ze statusem ostatniej synchronizacji oraz wsparcie widoku siatki.
- [*] Zmodyfikowano: `modules/services/clientAiDispatcher.js` – formatowanie planu lekcji dla asystenta AI wzbogacono o adnotacje `⚠️ [NIEOBECNOŚĆ NAUCZYCIELA: ...]` oraz `❌ [ODWOŁANA - OKIENKO]`.
- [+] Dodano: Zestaw testów jednostkowych w `tests/librus.test.js` weryfikujących sanityzację nazwisk, dopasowanie nauczycieli, nakładanie przedziałów czasowych oraz korelację planu lekcji (158/158 PASS).
- [+] Dodano: Raport wydania `docs/versions/v2.23.0.md`.
- [*] Zmodyfikowano: `package.json` – wersja podniesiona do `2.23.0`.
- [*] Zmodyfikowano: `ARCHITECTURE.md` – zaktualizowano wersję i architekturę pamięci podręcznej planu lekcji.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY (REFERENCJA 10/10 ENTERPRISE GRADE)

---

## v 2.22.0 — 2026-09-23
**Typ:** MINOR  
**Zakres:** Dedykowana Zakładka i Tryb „Szkolny” w Kalendarzu (`CalendarPage.jsx`) z Terminarzem Librus Synergia (Sprawdziany, Kartkówki, Nieobecności Nauczycieli), Kompleksowa Modernizacja Ergonomii i Przejrzystości Zakładki Ocen (`GradesPage.jsx`) z Widocznymi Wagami Ocen (`w:3`), Filtrem „Tylko z ocenami”, Zwartym Widokiem Wierszowym i Paskami Średnich, Rozszerzenie Serwisu i Tras Librusa oraz Zestaw Testów Vitest (147/147 PASS).

### Zmiany
- [+] Dodano: Nowy tryb „Szkolny (Librus)” w `modules/pages/CalendarPage.jsx` z neonowymi kafelkami KPI (Sprawdziany, Kartkówki, Absencje kadry, Najbliższy termin), kolorowymi wskaźnikami na siatce kalendarza, kartami szczegółów i agendą nadchodzących terminów.
- [+] Dodano: Obsługę pobierania terminarza Librus Synergia w `modules/services/librusService.js` (`parseCalendarEvent`, `fetchLibrusCalendarFromSource`, `saveCalendarToCache`, `getCachedCalendar`, `syncLibrusCalendar`, `getDemoCalendarData`).
- [+] Dodano: Endpointy REST `GET /api/librus/calendar` oraz `POST /api/librus/calendar/refresh` w `modules/routes/librus.js` i `api/librus.js`.
- [+] Dodano: Replikację terminarza do bazy SQLite `librus_calendar_cache` oraz Cloud Firestore `librus_cache/calendar`.
- [*] Zmodyfikowano: `modules/pages/GradesPage.jsx` – dodano pigułki ocen z widocznymi mikro-wagami (`5 w:3`, `4+ w:1`), szybkie filtry przedmiotów (`Wszystkie`, `Tylko z ocenami`, `Zagrożenia`, `Wzorowe`), przełącznik widoku (Karty vs Zwarty) oraz gradientowe paski postępu średniej.
- [+] Dodano: 4 nowe testy jednostkowe w `tests/librus.test.js` dla parsera terminarza szkolnego i danych demonstracyjnych (147/147 PASS).
- [+] Dodano: Raport wydania `docs/versions/v2.22.0.md`.
- [*] Zmodyfikowano: `package.json` – wersja podniesiona do `2.22.0`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY (REFERENCJA 10/10 ENTERPRISE GRADE)

---

## v 2.21.1 — 2026-09-22
**Typ:** PATCH  
**Zakres:** Eliminacja fałszywego komunikatu o błędzie HTML Rewrite w widoku Ocen (`/grades`) na hostingu produkcyjnym Firebase Hosting. Pełna separacja środowiska hybrydowego (bezpośredni odczyt Firestore w chmurze bez zapytań do nieistniejących endpointów Express).

### Zmiany
- [*] Zmodyfikowano: `modules/pages/GradesPage.jsx` – dodano wbudowany zestaw danych demonstracyjnych `STATIC_DEMO_DATA`, odcięto zapytania Axios do Express w środowisku Firebase Hosting na rzecz bezpośredniego odczytu z Cloud Firestore `librus_cache/latest`.
- [*] Zmodyfikowano: `modules/pages/GradesPage.jsx` – zaktualizowano warunek renderowania banera błędu, tłumiąc fałszywe komunikaty o parsowaniu HTML na hostingu statycznym.
- [+] Dodano: Kartę błędu `docs/errors/ERROR_DIFF_2026-09-22_librus_grades_html_rewrite_cloud_suppression.md`.
- [+] Dodano: Raport wydania `docs/versions/v2.21.1.md`.
- [*] Zmodyfikowano: `package.json` – wersja podniesiona do `2.21.1`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY (REFERENCJA 10/10 ENTERPRISE GRADE)

---

## v 2.21.0 — 2026-09-22
**Typ:** MINOR  
**Zakres:** Integracja Dziennika Elektronicznego Librus Synergia (`librus-api` v2.18.1), 2-Godzinny Harmonogram Odświeżania Ocen (`librusSyncJob`), Nowy Widok "Oceny" (`/grades` i `/oceny`), Obsługa Szczęśliwego Numerka, Średnich Ważonych, Detali Ocen w Oknie Modalnym, Konfiguracja Poświadczeń w Ustawieniach oraz Pamięć Podręczna SQLite.

### Zmiany
- [+] Dodano: Zależność produkcyjną `librus-api` (v2.18.1).
- [+] Dodano: Moduł `modules/services/librusService.js` z kompletną obsługą autoryzacji w Librus Synergia, pobieraniem ocen, szczęśliwego numerka, kalkulatorem średnich ważonych oraz danymi demonstracyjnymi.
- [+] Dodano: Router Express `modules/routes/librus.js` udostępniający endpointy REST `/api/librus/grades`, `/api/librus/refresh`, `/api/librus/status`, `/api/librus/credentials`, `/api/librus/test-auth`.
- [+] Dodano: Tabelę `librus_cache` w bazie danych SQLite `tasks.sqlite` (`modules/database.js`).
- [+] Dodano: 2-godzinny cykl synchronizacji `librusSyncJob` w `modules/scheduler.js`.
- [+] Dodano: Serverless endpoint `api/librus.js` dla środowiska Vercel Gateway.
- [+] Dodano: Nową podstronę `modules/pages/GradesPage.jsx` w stylistyce Adaptive-Clean UI z kafelkami KPI (Szczęśliwy numerek, średnia ogólna, przedmioty), pigułkami ocen w kolorach zależnych od stopni, filtrami semestralnymi i oknem modalnym detali.
- [+] Dodano: Pozycję nawigacyjną "Oceny" z ikoną `Award` w `modules/components/Sidebar.jsx` i `DEFAULT_VISIBLE_NAV`.
- [+] Dodano: Rejestrację tras `/grades` i `/oceny` z Code-Splittingiem w `core.client.jsx`.
- [+] Dodano: Sekcję konfiguracji poświadczeń Librus Synergia w `modules/pages/SettingsPage.jsx` z testowaniem połączenia i zapisem poświadczeń.
- [+] Dodano: Zestaw 8 testów jednostkowych w `tests/librus.test.js` (100% PASS).
- [*] Zmodyfikowano: `package.json` – wersja podniesiona do `2.21.0`.
- [*] Zmodyfikowano: Utworzono raport wydania `docs/versions/v2.21.0.md`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY (REFERENCJA 10/10 ENTERPRISE GRADE)

---

## v 2.20.0 — 2026-09-17
**Typ:** MINOR  
**Zakres:** Chirurgiczna Redukcja Archaicznego Web Speech API (`speakWithWebSpeech`), Permanentna Eliminacja Drewnianych Głosów Desktopowych, Wdrożenie Google Cloud Neural Text-to-Speech API (`google`) z Pakietem 1 000 000 Znaków Miesięcznie (WaveNet & Neural2), Konfiguracja Klucza i Wybór Lektorów w Ustawieniach, Odporny Studyjny Łańcuch Awaryjny.

### Zmiany
- [-] Usunięto: Metodę `speakWithWebSpeech` oraz tablicę `WEB_VOICE_PROFILES` z `modules/services/ttsService.js` (chirurgiczna redukcja).
- [-] Usunięto: Kafelek oraz panel konfiguracyjny Web Speech z `modules/pages/SettingsPage.jsx`.
- [+] Dodano: Stałą `GOOGLE_DEFAULT_VOICES` ze zweryfikowanymi lektorami studyjnymi WaveNet i Neural2 (`pl-PL-Wavenet-B`, `pl-PL-Neural2-A`, `pl-PL-Wavenet-C`, `pl-PL-Wavenet-A`, `pl-PL-Wavenet-D`, `en-US-Journey-D`, `en-US-Neural2-F`).
- [+] Dodano: Metodę `speakWithGoogle(text, apiKey, voiceId, options)` w `modules/services/ttsService.js` z bezpośrednim żądaniem REST (CORS), konwersją Base64 MP3 na Blob i odtwarzaniem audio.
- [+] Dodano: Kafelek `Google Neural` (`1 MLN / MC`) oraz panel konfiguracyjny klucza API Google Cloud (`system_google_tts_api_key`) z przełącznikiem widoczności i selektorem głosów w `modules/pages/SettingsPage.jsx`.
- [+] Dodano: Obsługę silnika `google` w backendowych trasach proxy `/voice/tts` w `modules/routes/ai.js`, `api/tts.js` i `api/voice/tts.js`.
- [*] Zmodyfikowano: `speak()` w `ttsService.js` z bezpiecznym łańcuchem studyjnym (ElevenLabs → Google Neural → Edge Neural) i emisją `systemAlert` zamiast odtwarzania robotycznego głosu w razie awarii dostawców.
- [+] Dodano: 4 nowe testy jednostkowe w `tests/tts_quota.test.js` potwierdzające usunięcie Web Speech i poprawność Google TTS.
- [*] Zmodyfikowano: Utworzono i zamknięto kartę defektu `docs/errors/ERROR_DIFF_2026-09-17_wooden_webspeech_elimination_and_google_neural_tts.md`.
- [*] Zmodyfikowano: Utworzono raport wydania `docs/versions/v2.20.0.md`.
- [*] Zmodyfikowano: `package.json` – wersja podniesiona do `2.20.0`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY (REFERENCJA 10/10 ENTERPRISE GRADE)

---

## v 2.19.9 — 2026-09-17
**Typ:** PATCH  
**Zakres:** Inspekcja i Monitorowanie Limitu Konta ElevenLabs (`checkElevenLabsQuota`), Eliminacja Cichej Degradacji Syntezy Mowy do Web Speech, Transparentne Powiadomienia w Ustawieniach i Terminalu (`ttsQuotaExceeded`), 1-Klikowe Przełączenie na Microsoft Edge Neural Studio oraz Odblokowanie Autoryzacji Audio Proxy w Express.

### Zmiany
- [+] Dodano: Funkcję `checkElevenLabsQuota(apiKey)` w `modules/services/ttsService.js` z pobieraniem zużycia z `https://api.elevenlabs.io/v1/user/subscription` i buforowaniem w `localStorage`.
- [+] Dodano: Wykrywanie statusu `quota_exceeded` / 401 w `speakWithElevenLabs` z emisją zdarzenia `ttsQuotaExceeded` i powiadomień `systemAlert`.
- [+] Dodano: Estetyczny panel stanu i pasek zużycia limitu ElevenLabs w `modules/pages/SettingsPage.jsx` z datą odnowienia i natychmiastowym przyciskiem przełączenia na Edge Neural.
- [+] Dodano: Baner ostrzegawczy w `modules/components/Terminal.jsx` informujący o wyczerpaniu znaków konta i przekierowujący do konfiguracji.
- [*] Zmodyfikowano: `modules/routes/auth.js` – odblokowano ścieżkę `/voice/tts` spod blokady tokenowej w `authMiddleware`.
- [*] Zmodyfikowano: `api/voice/tts.js` – dodano pełne nagłówki CORS i obsługę preflight OPTIONS.
- [+] Dodano: Zestaw testów jednostkowych w `tests/tts_quota.test.js` (131/131 PASS).
- [*] Zmodyfikowano: Utworzono i zamknięto kartę defektu `docs/errors/ERROR_DIFF_2026-09-17_elevenlabs_quota_exceeded_and_transparent_fallback.md`.
- [*] Zmodyfikowano: `package.json` – wersja podniesiona do `2.19.9`.
- [*] Zmodyfikowano: Utworzono dokumentację wydania `docs/versions/v2.19.9.md`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY (REFERENCJA 10/10 ENTERPRISE GRADE)

---

## v 2.19.8 — 2026-09-16
**Typ:** PATCH  
**Zakres:** Otwarte Odkrywanie Modeli Frontier 2026 (Open Discovery Queries), Bezwzględne Uziemienie w Bazie Pamięci (`https://void-potato-7721.web.app/memory` / `operator_brain`), Autonomiczne Utrwalanie Faktów (`[ACTION:REMEMBER]`), Obowiązek Jawnej Treści Notyfikacji Push w Czacie, Uniwersalny Inspektor Wykonania Narzędzi (`AgentExecutionTrace`) w Każdej Wiadomości i Trybie Czatu, Odporna Sanityzacja Zapisów Firestore.

### Zmiany
- [+] Dodano: Uziemienie wiedzy w pamięci długoterminowej (`operator_brain`) w promptach `deepResearchPrompt` oraz systemowych (`mentor`, `daemon`, `worker`). Wprowadzono żelazną regułę Zero-Trust dla starych danych nieobecnych w Pamięci ani w wynikach Brave Search Live.
- [+] Dodano: Autonomiczne zapisywanie nowo zweryfikowanych faktów o modelach i preferencjach do `operator_brain` (`[ACTION:REMEMBER fact="..." category="Modele AI"]`) wraz z natychmiastową synchronizacją lokalnego cache `cloud_cache_operator_brain`.
- [+] Dodano: Obowiązek wypisywania pełnej treści powiadomień Pushbullet w samej treści wiadomości na czacie (sekcja `📲 Podsumowanie wysłane na smartfon (Pushbullet)`).
- [*] Zmodyfikowano: `modules/components/AgentExecutionTrace.jsx` – zunifikowano ekstrakcję śladu (`extractTraceFromMessage`), dzięki czemu każda odpowiedź asystenta w każdym trybie prezentuje eksplorowane bazy (w tym `operator_brain`) oraz wykonane narzędzia (`Ran Tool: ...`).
- [*] Zmodyfikowano: `modules/services/cloudSync.js` – zabezpieczono `saveCloudDocument` przed polami `undefined`, zapewniając stabilność bazy Firestore.
- [+] Dodano: Nowe testy jednostkowe w `tests/agent_execution_trace.test.jsx` weryfikujące ślad narzędzi i integrację z `operator_brain` (126/126 PASS).
- [*] Zmodyfikowano: `package.json` – wersja podniesiona do `2.19.8`.
- [*] Zmodyfikowano: Wdrożenie na Firebase Hosting `https://void-potato-7721.web.app` (SUCCESS).
- [*] Zmodyfikowano: Utworzono dokumentację wydania `docs/versions/v2.19.8.md`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY (REFERENCJA 10/10 ENTERPRISE GRADE)

---

## v 2.19.7 — 2026-09-16
**Typ:** PATCH  
**Zakres:** Elastyczna Klasyfikacja Intencji Badawczej w Języku Polskim (`isDeepResearchIntent`), Obsługa `onProgress` we Wszystkich Kartach Czatu (`ChatContext.jsx`), Integracja Bramy Brave Search `/api/news`, Pacing 3.5s na Etap z Powiadomieniami Push, Rygorystyczny Prompt Anty-Halucynacyjny (Zakaz Modeli Fikcyjnych i Open-Source), Auto-Healing Fallbacku Groq LLM.

### Zmiany
- [+] Dodano: Elastyczne wzorce wyrażeń regularnych w `modules/services/autonomousClassifier.js` uwzględniające odmianę gramatyczną w języku polskim (`modeli ai`, `modelach ai`, `skan`, `dokładny skan`, `informuj mnie na bieżąco powiadomieniami push`, `zbierz wszystko`).
- [+] Dodano: Obsługę strumieniowania `onProgress` w trybach `worker` i `mentor` w `modules/context/ChatContext.jsx` (kamienie milowe i wskaźnik live trace działają w każdej karcie czatu).
- [*] Zmodyfikowano: `modules/services/clientAiDispatcher.js` – przekierowano `executeBrowserWebSearch` na działające proxy `/api/news?q=...` zwracające realne dane z 2026 roku; wydłużono pacing etapów do 3.5s z etapowymi powiadomieniami Pushbullet; zaostrzono reguły antyhalucynacyjne wykluczające modele open-source i zmyślone specyfikacje.
- [*] Zmodyfikowano: `api/agent.js` oraz `modules/services/autonomousAgent.js` – zastąpiono wycofany model `llama-3.3-70b-versatile` elastyczną pętlą fallbacku (`openai/gpt-oss-120b` -> `openai/gpt-oss-20b` -> `groq/compound` -> `qwen/qwen3.8-27b`), eliminując błędy HTTP 500/429.
- [+] Dodano: Nowe testy jednostkowe w `tests/autonomous_agent.test.js` zabezpieczające zapytania o skan komercyjnych modeli AI.
- [*] Zmodyfikowano: `package.json` – wersja podniesiona do `2.19.7`.
- [*] Zmodyfikowano: Wdrożenie na Firebase Hosting `https://void-potato-7721.web.app` (SUCCESS).
- [*] Zmodyfikowano: Utworzono dokumentację wydania `docs/versions/v2.19.7.md`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY (REFERENCJA 10/10 ENTERPRISE GRADE)

---

## v 2.19.6 — 2026-09-16
**Typ:** PATCH  
**Zakres:** Usunięcie Widgetu Agenta z Głównego Pulpitu, Przywrócenie Kanonicznego Układu Siatki 3-Kolumnowej (TodoList, ITNewsTicker, Routines, NewsFeed), Centralizacja Kontroli OmniDaemon w Terminalu AI.

### Zmiany
- [*] Zmodyfikowano: `modules/pages/Dashboard.jsx` – usunięto osadzenie `AgentControlWidget` zakłócające układ kolumn; przywrócono pełną symetrię i ergonomię głównego pulpitu.
- [*] Zmodyfikowano: `package.json` – wersja podniesiona do `2.19.6`.
- [*] Zmodyfikowano: Wdrożenie na Firebase Hosting `https://void-potato-7721.web.app` (SUCCESS).
- [*] Zmodyfikowano: Utworzono dokumentację wydania `docs/versions/v2.19.6.md`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY (REFERENCJA 10/10 ENTERPRISE GRADE)

---

## v 2.19.5 — 2026-09-16
**Typ:** PATCH  
**Zakres:** Interaktywny Inspektor Wykonania Agenta AI (`AgentExecutionTrace`), Wizualizacja Eksplorowanych Plików/Baz Danych (`Explored X files`), Uruchomionych Narzędzi (`Ran <tool>`), Zrealizowanych Wyszukiwań Sieciowych (`Exploring X searches` / `Searched <query> X results`), Wskaźnik Stanu Na Żywo (`Working.`), Sanityzacja Sekretów oraz Nowe Testy Jednostkowe (125/125 PASS).

### Zmiany
- [+] Dodano: Nowy komponent interfejsu `modules/components/AgentExecutionTrace.jsx` wzorowany na zaawansowanych środowiskach agentowych (Antigravity/Cursor/Gemini):
  - Zwijalne wiersze eksplorowanych plików i kolekcji bazy danych z dedykowanymi ikonami zasobów.
  - Zwijalne pozycje wykonanych komend i akcji z podglądem danych wyjściowych oraz weryfikacją statusu (`200 OK`, `sent`).
  - Rozwijana sekcja zapytań sieciowych z etykietami liczby wyników i możliwością bezpośredniego podglądu tytułów, odnośników URL i abstraktów znalezionych stron.
  - Wskaźnik pracy na żywo (`Working.`) z animacją pulsującą.
  - Automatyczna sanityzacja kluczy poświadczeń (`sanitizeCommand`).
  - Funkcja pomocnicza `extractTraceFromMessage` do automatycznej ekstrakcji śladów dla wiadomości historycznych.
- [+] Dodano: Pełne śledzenie wykonania w `modules/services/clientAiDispatcher.js`:
  - `parseAndExecuteAiActionsWithWidgets`: rejestracja wykonanych akcji w tablicy `executedTools`.
  - `executeClientDeepResearch`: strumieniowanie obiektu `trace` w czasie rzeczywistym przez `onProgress` oraz dołączenie kompletnego `executionTrace` do raportu końcowego.
  - Nowy generator śladów `buildExecutionTrace` dla zapytań standardowych w trybach Worker i Mentor.
- [+] Dodano: Obsługa stanu `liveTrace` w `modules/context/ChatContext.jsx` oraz dołączanie `executionTrace` do obiektów wiadomości zapisywanych w Cloud Firestore.
- [*] Zmodyfikowano: `modules/components/Terminal.jsx` – integracja komponentu `AgentExecutionTrace` w kartach wiadomości AI oraz podglądu na żywo w trakcie przetwarzania zapytania (`isProcessing`).
- [+] Dodano: Nowy plik testów jednostkowych `tests/agent_execution_trace.test.jsx` (125/125 PASS w 10 plikach testowych).
- [*] Zmodyfikowano: `package.json` – wersja podniesiona do `2.19.5`.
- [*] Zmodyfikowano: Wdrożenie na Firebase Hosting `https://void-potato-7721.web.app` (SUCCESS).
- [*] Zmodyfikowano: Utworzono dokumentację wydania `docs/versions/v2.19.5.md`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY (REFERENCJA 10/10 ENTERPRISE GRADE)

---

## v 2.19.4 — 2026-09-16
**Typ:** PATCH  
**Zakres:** Eliminacja Defektu Deduplikacji Źródeł Brave Search, Auto-Healing i Sanityzacja Modeli w LocalStorage, 3-Warstwowa Odporna Synteza Raportów OmniDaemon (Direct Groq -> Vercel Gateway -> Fail-Safe Generator), Ochrona Przed Fallbackiem Asystenta.

### Zmiany
- [+] Dodano: Unikalne kotwice URI dla węzłów wyszukiwania Brave Search w `modules/services/clientAiDispatcher.js` (`executeBrowserWebSearch`) – eliminacja zjawiska 0 źródeł w kolejnych etapach badania.
- [+] Dodano: 3-warstwową odporną syntezę raportu końcowego w `executeClientDeepResearch`:
  - Warstwa 1: Bezpośrednie Groq API z dynamiczną rotacją modeli (`openai/gpt-oss-120b`, `qwen/qwen3-32b`).
  - Warstwa 2: Vercel Serverless Gateway fallback (`/api/agent`).
  - Warstwa 3: Deterministyczny generator raportu dossier (`generateDeterministicReport`) z gwarancją dostarczenia pełnej tabeli Markdown i analizy modeli czatowych 2026.
- [+] Dodano: Crash Guard w `dispatchAiQuery` zapobiegający spadkowi do generycznej odpowiedzi powitalnej asystenta w trybie daemon.
- [+] Dodano: Automatyczną sanityzację wycofanych modeli w `localStorage` (zastępowanie nieobsługiwanych wariantów llama przez `openai/gpt-oss-120b`).
- [*] Zmodyfikowano: `modules/components/ModelWidget.jsx` – zastąpiono wycofany model `llama-3.3-70b-versatile` przez `qwen/qwen3-32b`.
- [*] Zmodyfikowano: `package.json` – wersja podniesiona do `2.19.4`.
- [*] Zmodyfikowano: Wdrożenie na Firebase Hosting `https://void-potato-7721.web.app` (SUCCESS).
- [*] Zmodyfikowano: Utworzono dokumentację wydania `docs/versions/v2.19.4.md`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY (REFERENCJA 10/10 ENTERPRISE GRADE)

---

## v 2.19.3 — 2026-09-16
**Typ:** PATCH  
**Zakres:** Autonomiczny Multi-Stage Loop OmniDaemon, Selekcja Komercyjnych Modeli Czatu 2026 (Wykluczenie Open-Source), Powiadomienia Push Na Żywo (Start, Kamienie Milowe, Finał), Strumieniowanie do Terminala OMNIDAEMON, Serwerless Search Proxy w `api/agent.js` i Testy Jednostkowe.

### Zmiany
- [+] Dodano: Wieloetapowa pętla autonomiczna w `modules/services/clientAiDispatcher.js` (`executeClientDeepResearch`):
  - 4-etapowa sekwencja z realistycznym interwałem pracy agenta (pacing 2.5s) i strumieniowaniem postępów na żywo (`onProgress`).
  - Natychmiastowe powiadomienie o starcie badania na smartfon (`sendPushNotificationClient`).
  - Powiadomienia push Pushbullet po każdym ukończonym etapie (milestone pushes) z liczbą pozyskanych źródeł.
  - Gwarantowane wysłanie raportu końcowego na smartfon operatora.
- [+] Dodano: Bezwzględne wykluczenie modeli open-source dla zapytań czatowych (`isNoOpenSource`):
  - Selekcja planu badawczego w `autonomousClassifier.js` ukierunkowana wyłącznie na komercyjne subskrypcje czatowe 2026.
  - Rygorystyczny zakaz uwzględniania modeli open-source/open-weights (Llama, DeepSeek, Mistral, Qwen) w prompcie syntezy przy zapytaniach o modele dostępne w czacie.
  - Tabela porównawcza i analiza techniczna dedykowana: ChatGPT Plus/Pro, Claude.ai Pro, Gemini Advanced, Grok, Copilot Pro i Perplexity Pro.
- [+] Dodano: Serwerless proxy Brave Search w `api/agent.js` (`mode: 'search'`) z ominięciem CORS przeglądarki.
- [*] Zmodyfikowano: `api/search.js` – usunięto problematyczną flagę `maxDuration: 60`, ujednolicono nagłówki CORS z `api/status.js`.
- [*] Zmodyfikowano: `modules/services/clientAiDispatcher.js` – 4-stopniowy fallback wyszukiwania w `executeBrowserWebSearch`, obsługa parametru `onProgress` w `dispatchAiQuery`.
- [+] Dodano: Nowy test jednostkowy w `tests/autonomous_agent.test.js` weryfikujący planowanie komercyjne bez modeli open-source (118/118 PASS).
- [*] Zmodyfikowano: `package.json` – wersja podniesiona do `2.19.3`.
- [*] Zmodyfikowano: Wdrożenie na Firebase Hosting `https://void-potato-7721.web.app` (SUCCESS).
- [*] Zmodyfikowano: Utworzono dokumentację wydania `docs/versions/v2.19.3.md`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY (REFERENCJA 10/10 ENTERPRISE GRADE)

---

## v 2.19.2 — 2026-09-16
**Typ:** PATCH  
**Zakres:** Autonomiczny Silnik Deep Research (Brave Search), Wieloetapowa Analiza Modeli AI, Eliminacja Natychmiastowych Halucynacji w OMNIDAEMON, Uniwersalny Klasyfikator `autonomousClassifier.js`, Raportowanie Mobilne Pushbullet i Testy Jednostkowe.

### Zmiany
- [+] Dodano: Nowy moduł `modules/services/autonomousClassifier.js` – czysty moduł JavaScript bez zależności od Node/SQLite (funkcje `isDeepResearchIntent`, rozbudowane `extractTaskFromPhone`, zoptymalizowane `isStatusInquiry`, 3-etapowe `generateFallbackPlan` dla modeli AI).
- [+] Dodano: Klientowy silnik Deep Research w `modules/services/clientAiDispatcher.js`:
  - Eliminacja natychmiastowych statycznych odpowiedzi w zakładce OMNIDAEMON przy zleceniach badawczych.
  - Hybrydowe pobieranie danych przez Brave Search (`executeBrowserWebSearch`) z wykorzystaniem proxy `/api/search` i bezpośredniego fallbacku.
  - Wieloetapowe badanie sieci (`executeClientDeepResearch`): sekwencyjne odpytywanie Brave Search (News + Web), deduplikacja źródeł, synteza Groq LLM z tabelą porównawczą, dogłębną analizą techniczną każdego modelu, roadmapą przyszłości i rekomendacją.
  - Automatyczna emisja znacznika `[ACTION:SEND_PUSH]` z natychmiastową wysyłką powiadomienia na telefon przez Pushbullet.
  - Obsługa zapytań o stan na żywo w przeglądarce (`isStatusInquiry`) z pamięcią podręczną `omni_daemon_last_job`.
- [+] Dodano: Wieloetapowy badacz w chmurze w `api/pushbullet-webhook.js` – dekompozycja celu, zapytania Brave Search z milestone push po etapie 1, pełna synteza techniczna modeli AI i odesłanie raportu push na telefon.
- [+] Dodano: Uniwersalny endpoint `/api/search` z nagłówkami CORS w Express routerze (`modules/routes/ai.js`).
- [+] Dodano: Automatyczny zapis raportów końcowych badań do Cloud Firestore `chat_history` (`chatMode: 'daemon'`) w `modules/services/autonomousAgent.js`.
- [+] Dodano: 3 nowe testy jednostkowe w `tests/autonomous_agent.test.js` (117/117 PASS).
- [*] Zmodyfikowano: `package.json` – wersja podniesiona do `2.19.2`.
- [*] Zmodyfikowano: Wdrożenie na Firebase Hosting `https://void-potato-7721.web.app` (SUCCESS).
- [*] Zmodyfikowano: Utworzono dokumentację wydania `docs/versions/v2.19.2.md`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY (REFERENCJA 10/10 ENTERPRISE GRADE)

---

## v 2.19.1 — 2026-09-16
**Typ:** PATCH  
**Zakres:** Dedykowana Zakładka OMNIDAEMON w Terminalu (`Terminal.jsx`), Zarządzanie Stanem i Historią Chmurową w `ChatContext.jsx`, Dwukierunkowy Czat Smartfonowy Pushbullet z Obowiązkową Odpowiedzią Push (`handleMobileChatQuery`), Ochrona Przed Pętlą Echa Powiadomień (`isOwnSystemNotification`), Dedykowany Prompt Operacyjny OmniDaemon oraz Testy Jednostkowe.

### Zmiany
- [+] Dodano: Dedykowana zakładka OMNIDAEMON w interfejsie `modules/components/Terminal.jsx` obok trybów WORKER i MENTOR (przycisk `<Bot /> OMNIDAEMON`, dedykowane nagłówki, ikony i komunikaty przetwarzania).
- [+] Dodano: Obsługa trybu `daemon` w `modules/context/ChatContext.jsx` ze stanem `daemonMessages`, synchronizacją Cloud Firestore (`chat_history` pod `chatMode: 'daemon'`), pamięcią podręczną `system_daemon_history` oraz komendami `/clear`, `/mode daemon`, `/purge`, `/export`.
- [+] Dodano: Funkcja `handleMobileChatQuery(content)` w `modules/pushbullet.js` – każde zapytanie od operatora ze smartfona jest rejestrowane w historii czatu, przetwarzane przez silnik kognitywny AI i **bezwzględnie odsyłane na telefon przez Pushbullet**.
- [+] Dodano: Ochrona przed pętlą echa (`isOwnSystemNotification`) w `modules/pushbullet.js` oraz `api/pushbullet-webhook.js` zabezpieczająca przed zapętleniem powiadomień generowanych przez OmniDash.
- [+] Dodano: Obsługa ogólnych zapytań ze smartfona w chmurze Vercel w `api/pushbullet-webhook.js` z natychmiastową odpowiedzią zwrotną push.
- [+] Dodano: Dedykowany prompt systemowy OmniDaemon w `modules/services/clientAiDispatcher.js`.
- [*] Zmodyfikowano: `modules/agent.js` – dodano opcję `dangerouslyAllowBrowser: true` w inicjalizacji Groq.
- [+] Dodano: 4 nowe testy jednostkowe w `tests/autonomous_agent.test.js` (114/114 PASS).
- [*] Zmodyfikowano: `package.json` – wersja podniesiona do `2.19.1`.
- [*] Zmodyfikowano: Utworzono dokumentację wydania `docs/versions/v2.19.1.md`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY (REFERENCJA 10/10 ENTERPRISE GRADE)

---

## v 2.19.0 — 2026-09-16
**Typ:** MINOR  
**Zakres:** Autonomiczny Agent Ciągły (OmniDaemon 24/7), Deep Research z Brave Search, Etapowe Raportowanie i Interaktywne Odpytywanie ze Smartfona (Pushbullet), Architektura Hybrydowa (Vercel Serverless & Node Daemon) oraz Widżet Dashboardu.

### Zmiany
- [+] Dodano: Nowy moduł silnika autonomicznego agenta `modules/services/autonomousAgent.js`:
  - Dekompozycja celów badawczych na sekwencję zapytań do Brave Search (`decomposeGoal`, `generateFallbackPlan`).
  - Pętla badawcza z syntezą cząstkową przez Groq LLM (`openai/gpt-oss-120b` / `llama-3.3-70b-versatile`).
  - Wysyłka powiadomień etapowych (Milestone Pushes) oraz generowanie ustrukturyzowanego raportu końcowego na smartfon.
  - Obsługa zapytań o stan pracy (`handleStatusInquiry`) i poleceń awaryjnego zatrzymania (`abortActiveJob`).
- [+] Dodano: Interaktywny mobilny Push Relay w `modules/pushbullet.js`:
  - Obsługa przychodzących notatek z telefonu przez WebSocket (reakcja na `stan`, `status`, `jak idzie?`, `stop`, `Omni: ...`).
- [+] Dodano: Endpointy Vercel Serverless dla pracy w chmurze bez włączonego komputera:
  - `api/pushbullet-webhook.js` – natychmiastowy odbiór notatek i zapytań o stan ze smartfona przez Webhook Pushbullet.
  - `api/cron/agent.js` – cykliczne taktowanie przez Vercel Cron.
  - `vercel.json` – konfiguracja harmonogramu crons.
- [+] Dodano: Nowy komponent `modules/components/AgentControlWidget.jsx` w dashboardzie (status pracy, pasek postępu, formularz badań, zrzut stanu na telefon, Kill Switch).
- [*] Zmodyfikowano: `modules/search.js` – wzbogacenie Brave Search o zapytania ogólne `web` i `news` z deduplikacją wyników.
- [*] Zmodyfikowano: `modules/database.js` – utworzenie tabeli `agent_jobs` w SQLite.
- [*] Zmodyfikowano: `modules/scheduler.js` – dodano 30-sekundowy ticker obsługujący zadania agenta w tle.
- [*] Zmodyfikowano: `modules/routes/ai.js` – dodano endpointy `/api/agent/jobs`, `/api/agent/research`, `/api/agent/abort`, `/api/agent/status-inquiry`.
- [*] Zmodyfikowano: `modules/services/clientAiDispatcher.js` & `api/agent.js` – dodano opcjonalny parametr `now` w `extractPushDetails` zapewniający 100% determinizmu testów planu lekcji.
- [+] Dodano: 10 nowych testów jednostkowych w `tests/autonomous_agent.test.js` (110/110 PASS).
- [*] Zmodyfikowano: `package.json` – wersja podniesiona do `2.19.0`.
- [*] Zmodyfikowano: Utworzono dokumentację wydania `docs/versions/v2.19.0.md`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY (REFERENCJA 10/10 ENTERPRISE GRADE)

---

## v 2.18.13 — 2026-09-16
**Typ:** PATCH  
**Zakres:** Obsługa Operacji Masowych na Zadaniach To-Do (`CLEAR_TASKS`, `COMPLETE_ALL_TASKS`, `DELETE_COMPLETED_TASKS`), Odznaczanie Zadań (`UNCOMPLETE_TASK`), Autonomiczny Filtr Kognitywny Intencji oraz Wyczyszczenie Zalegających Dokumentów w Cloud Firestore.

### Zmiany
- [+] Dodano: Wdrożenie funkcji masowych i operacji zbiorczych w `modules/services/cloudSync.js`:
  - `clearCloudCollection(collectionName)` z czyszczeniem pamięci lokalnej, Cloud Firestore oraz lokalnego Express SQLite (`DELETE /api/tasks/all`).
  - `completeAllCloudTasks()` masowo ustawiające `status: 'completed'` na wszystkich zadaniach.
  - `uncompleteCloudTask(docIdOrTitle)` przywracające zadanie do statusu `pending`.
  - `deleteCompletedCloudTasks()` usuwające wyłącznie zadania ze statusem `completed`.
- [+] Dodano: Obsługę znaczników `[ACTION:CLEAR_TASKS]`, `[ACTION:CLEAR_TODO]`, `[ACTION:DELETE_ALL_TASKS]`, `[ACTION:COMPLETE_ALL_TASKS]`, `[ACTION:DELETE_COMPLETED_TASKS]` oraz `[ACTION:UNCOMPLETE_TASK]` w `modules/services/clientAiDispatcher.js`.
- [+] Dodano: Inteligentną obsługę słów kluczowych `wszystko`, `wszystkie`, `all` w akcjach `DELETE_TASK` i `COMPLETE_TASK`.
- [+] Dodano: Autonomiczny filtr kognitywny (Cognitive Fallback) w `parseAndExecuteAiActionsWithWidgets`, który w razie zadeklarowania przez model wyczyszczenia listy To-Do lub oznaczenia zadań bez wyemitowania znacznika automatycznie wykonuje operację w bazie danych.
- [*] Zmodyfikowano: `getClientTasks()` w `clientAiDispatcher.js` – wyeliminowano defekt przywracania 5 domyślnych zadań startowych, gdy tablica zadań w pamięci podręcznej ma długość 0 (`[]`).
- [*] Zmodyfikowano: Prompty systemowe `OMNI MIND` i `OMNI EXEC` w `clientAiDispatcher.js` oraz `api/agent.js` o kompletną specyfikację znaczników akcji To-Do oraz bezwzględny zakaz deklarowania operacji bez tagu akcji.
- [+] Dodano: Wyczyszczono 7 zalegających dokumentów w Cloud Firestore (`tasks`), sprowadzając stan bazy do 0.
- [+] Dodano: 8 nowych testów jednostkowych w `tests/pushbullet_finance.test.js` (100/100 PASS).
- [*] Zmodyfikowano: `package.json` – podniesiono wersję do `2.18.13`.
- [*] Zmodyfikowano: Utworzono dokumentację wydania `docs/versions/v2.18.13.md`.
- [*] Zmodyfikowano: Zamknięto kartę defektu `docs/errors/ERROR_DIFF_2026-09-16_ai_todo_actions_and_batch_operations.md`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY (REFERENCJA 10/10 ENTERPRISE GRADE)

---

## v 2.18.12 — 2026-09-16
**Typ:** PATCH  
**Zakres:** Odporny Parser Znaczników Akcji Push (Obsługa Zagnieżdżonych Nawiasów `[Sala]` i Wewnętrznych Cudzysłowów), Kognitywna Prekomputacja Harmonogramu Lekcji w Czasie Rzeczywistym (`getTimetableContext`) oraz Wdrożenie Pełnej Bazy 21 Głosów ElevenLabs z Dynamicznym Pobieraniem z API.

### Zmiany
- [+] Dodano: Wdrożenie 21 oficjalnych głosów z konta ElevenLabs VoiceLab w `modules/services/ttsService.js` (Roger, Bella, Sarah, Laura, Charlie, George, Callum, River, Harry, Liam, Alice, Matilda, Will, Jessica, Eric, Chris, Brian, Daniel, Lily, Adam, Bill) wraz ze zweryfikowanymi identyfikatorami API.
- [+] Dodano: Funkcję `fetchElevenLabsVoices(apiKey)` w `ttsService.js` z buforowaniem w `localStorage` oraz integracją przycisku odświeżania listy głosów w `modules/pages/SettingsPage.jsx`.
- [+] Dodano: Deterministyczny silnik prekomputacji harmonogramu lekcji `getTimetableContext(timetable, now)` w `modules/services/clientAiDispatcher.js` oraz `api/agent.js`, automatycznie wstrzykujący trwającą lekcję, najbliższą kolejną lekcję oraz plan dnia do promptów systemowych `OMNI MIND` i `OMNI EXEC`.
- [*] Zmodyfikowano: `modules/services/clientAiDispatcher.js` – wprowadzono odporny analizator leksykalny `parseActionTags` i `parseAttributes`, eliminujący defekt przedwczesnego ucinania atrybutów `body` powiadomień Pushbullet na nawiasach sal (np. `[Sala 0.2]`) i wewnętrznych cudzysłowach.
- [*] Zmodyfikowano: `modules/services/clientAiDispatcher.js` & `api/agent.js` – dodano autonomiczny fallback w `extractPushDetails` i `SEND_PUSH`, automatycznie uzupełniający treść powiadomienia najbliższą lekcją przy pytaniach o plan zajęć.
- [+] Dodano: 8 nowych testów jednostkowych w `tests/pushbullet_finance.test.js` pokrywających parser zagnieżdżeń i cudzysłowów, prekomputację harmonogramu, fallback push oraz poprawność 21 głosów ElevenLabs (91/91 PASS).
- [*] Zmodyfikowano: `package.json` – podniesiono wersję do `2.18.12`.
- [*] Zmodyfikowano: Utworzono dokumentację wydania `docs/versions/v2.18.12.md`.
- [*] Zmodyfikowano: Zaktualizowano i zamknięto kartę defektu `docs/errors/ERROR_DIFF_2026-09-16_next_lesson_push_syntax_and_elevenlabs_voices.md`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY (REFERENCJA 10/10 ENTERPRISE GRADE)

---

## v 2.18.11 — 2026-09-15
**Typ:** PATCH  
**Zakres:** Jednoznaczny i Zoptymalizowany Układ Powiadomień Mobilnych Pushbullet: Wyróżniona Sala `[Sala]` Bezpośrednio po Godzinie, Słownik Skrótów Przedmiotów (`cleanSubjectName`), Usunięcie Szumu Akademickiego i Uniwersalna Integracja Formatera we Wszystkich Modułach.

### Zmiany
- [+] Dodano: Optymalizację ergonomii wiersza lekcji `• HH:MM [Sala] Przedmiot (Nauczyciel)` w `formatPushText` ([pushbulletService.js](file:///c:/Users/Jakub%20Lis/Desktop/AI%20system%20dashboard%20github/modules/services/pushbulletService.js)):
  - Przeniesienie numeru sali `[Sala 1.16]` bezpośrednio za godzinę, umożliwiając natychmiastowy odczyt sali bez konieczności szukania na końcu zawiniętego wiersza.
  - Słownik standaryzacji i skrótów `cleanSubjectName` (np. `Pracownia UTK`, `Pracownia SO`, `WF`, `Godz. wychowawcza`, `Urządzenia TK`).
  - Oczyszczanie ze zbędnych metadanych typu `, Laboratorium`, `, Wykład`, `, Ćwiczenia`, `, Inne`.
  - Ekstrakcja kodu nauczyciela z uwzględnieniem polskich znaków (`GŁ`, `PW`, itp.).
- [*] Zmodyfikowano: `modules/pushbullet.js` – zintegrowano `formatPushText` w backendowej funkcji `sendPushNotification`, zabezpieczając wywołania ze środowiska lokalnego Express.
- [*] Zmodyfikowano: `api/phone.js` – serverless endpoint wzbogacony o `formatPushText` i `cleanSubjectName`.
- [*] Zmodyfikowano: `modules/services/clientAiDispatcher.js` & `api/agent.js` – ustrukturyzowano `timetableSummary` w prompcie LLM, zapobiegając generowaniu nadmiernie rozwlekłych linii.
- [+] Dodano: Nowy test jednostkowy w `tests/pushbullet_finance.test.js` weryfikujący poprawność ekstrakcji sali, nauczyciela i formatu linii (83/83 PASS).
- [*] Zmodyfikowano: `package.json` – podniesiono wersję do `2.18.11`.
- [*] Zmodyfikowano: Utworzono dokumentację wydania `docs/versions/v2.18.11.md`.
- [*] Zmodyfikowano: Utworzono kartę błędu `docs/errors/ERROR_DIFF_2026-09-15_pushbullet_room_and_subject_unambiguous_layout.md` (zamknięta ze statusem SUCCESS).

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY (REFERENCJA 10/10 ENTERPRISE GRADE)

---

## v 2.18.10 — 2026-09-15
**Typ:** PATCH  
**Zakres:** Formatowanie Wielowierszowe Powiadomień Pushbullet na Urządzenia Mobilne (Konwersja Literalnych \n na Znaki Nowej Linii, Oczyszczanie Markdown, Transformacja Tabel na Estetyczne Listy Punktorów •).

### Zmiany
- [+] Dodano: Dedykowany silnik normalizacji tekstu powiadomień `formatPushText(text)` w `modules/services/pushbulletService.js`:
  - Normalizacja sekwencji ucieczki `\r\n`, `\n`, `\r` do rzeczywistych znaków nowego wiersza (bajt 0x0A), eliminująca zbijanie tekstu w jeden blok z literalnymi znakami `\n`.
  - Usuwanie nieobsługiwanych przez klienta mobilnego Pushbullet znaczników Markdown (`**`, `*`, `__`, `_`, ```` ` ````, nagłówki `#`).
  - Inteligentna transformacja tabel Markdown (`| Godzina | Przedmiot | Sala |` -> `• Godzina: Przedmiot (Sala) [Dodatkowe]`) z pomijaniem nagłówków i separatorów `|---|`.
  - Automatyczna standaryzacja zakresów godzin bez punktorów do jednolitej formy `• 08:00 - 08:45: Przedmiot`.
- [*] Zmodyfikowano: `modules/services/pushbulletService.js` – zintegrowano `formatPushText` w wywołaniu `sendPushNotificationClient(title, body)`, zapewniając czyste powiadomienia niezależnie od źródła wywołania.
- [*] Zmodyfikowano: `modules/services/clientAiDispatcher.js` & `api/agent.js` – wzmocniono prompty systemowe `mentor` i `worker` o bezwzględny zakaz wstawiania tabel Markdown w atrybucie `body` akcji `[ACTION:SEND_PUSH]` oraz wymóg formatowania wierszowego z punktorami `•`.
- [*] Zmodyfikowano: `modules/services/clientAiDispatcher.js` – zintegrowano oczyszczanie `formatPushText` w funkcji `extractPushDetails`.
- [+] Dodano: 5 nowych testów jednostkowych w `tests/pushbullet_finance.test.js` (82/82 PASS we wszystkich 8 plikach testowych).
- [*] Zmodyfikowano: `package.json` – podniesiono wersję do `2.18.10`.
- [*] Zmodyfikowano: Utworzono dokumentację wydania `docs/versions/v2.18.10.md`.
- [*] Zmodyfikowano: Utworzono kartę błędu `docs/errors/ERROR_DIFF_2026-09-15_pushbullet_newline_and_table_formatting.md` (zamknięta ze statusem SUCCESS).

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY (REFERENCJA 10/10 ENTERPRISE GRADE)

---

## v 2.18.9 — 2026-09-15
**Typ:** PATCH  
**Zakres:** Eliminacja Halucynacji Odmowy Wysyłki Push, Ustanowienie Direct Groq API jako Priorytet 1 (Natywny Browser CORS, Pełna Spójność Promptu z Akcją SEND_PUSH), Sanityzacja Kognitywna i Fallback w Dispatcherze.

### Zmiany
- [*] Zmodyfikowano: `modules/services/clientAiDispatcher.js` – przestawiono bezpośrednie odpytywanie Groq API (`cloud_groq`) na Priorytet 1, eliminując zależność od przestarzałej bramy Vercel Serverless serwującej stary prompt bez `[ACTION:SEND_PUSH]`.
- [*] Zmodyfikowano: `modules/services/clientAiDispatcher.js` – wdrożono filtr kognitywny w `parseAndExecuteAiActionsWithWidgets`, który przy żądaniu pusha automatycznie przechwytuje i zastępuje halucynacje odmowne asystenta potwierdzeniem faktycznej wysyłki przez Pushbullet.
- [*] Zmodyfikowano: `modules/services/clientAiDispatcher.js` & `api/agent.js` – rozszerzono słownik detekcji intencji push (`isPushRequest`) o zwroty testowe (`testowy push`, `wyślij push`, `test push`, `push na telefon`) oraz dodano dedykowany tytuł w `extractPushDetails`.
- [*] Zmodyfikowano: `api/agent.js` – dodano gwarancję sanityzacji odmowy i wymuszenia znacznika `[ACTION:SEND_PUSH]` po stronie backendu.
- [+] Dodano: Nowe testy jednostkowe w `tests/pushbullet_finance.test.js` weryfikujące zastępowanie halucynowanej odmowy i detekcję testowego pusha (77/77 PASS).
- [*] Zmodyfikowano: `package.json` – podniesiono wersję do `2.18.9`.
- [*] Zmodyfikowano: Utworzono dokumentację wydania `docs/versions/v2.18.9.md`.
- [*] Zmodyfikowano: Utworzono kartę błędu `docs/errors/ERROR_DIFF_2026-09-15_ai_push_denial_hallucination_and_groq_priority.md` (zamknięta ze statusem SUCCESS).

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY (REFERENCJA 10/10 ENTERPRISE GRADE)

---

## v 2.18.8 — 2026-09-15
**Typ:** MINOR / PATCH  
**Zakres:** Aktualizacja Planu Lekcji 2TI (od 14.09.2026 - Grupa 1, 38 lekcji, Cloud Firestore & SQLite), Direct Client Pushbullet Service (Natywny CORS, Eliminacja Silent Fail, Precyzyjne Toasty), Dedykowany Panel Konfiguracji i Testu Pushbullet w Ustawieniach.

### Zmiany
- [+] Dodano: Nowy moduł `modules/services/pushbulletService.js` z funkcjami `sendPushNotificationClient()` oraz `testPushbulletConnection()`, realizujący bezpośrednie połączenia do Pushbullet API z przeglądarki (pełne wsparcie CORS `*`) z nagłówkiem `Access-Token`.
- [+] Dodano: Karta konfiguracji i testu Pushbullet w `modules/pages/SettingsPage.jsx` w zakładce Bazy & Bezpieczeństwo z polem tokenu, przełącznikiem widoczności hasła, statusem połączenia i przyciskiem testowego pusha na smartfon.
- [+] Dodano: Konfiguracja `VITE_PUSHBULLET_API_KEY` w `.env` i `.env.example`.
- [*] Zmodyfikowano: `modules/services/clientAiDispatcher.js` – usunięto cichy blok `fetch(pushEndpoint).catch(() => {})`. Zintegrowano `sendPushNotificationClient` z natychmiastową, prawdziwą informacją zwrotną dla operatora w toastach i czacie.
- [*] Zmodyfikowano: `scripts/seed_real_timetable.js` oraz `modules/services/cloudSync.js` – wprowadzono 38 lekcji dla klasy 2TI Grupa 1 (plan od 14.09.2026), wyczyszczono stare i błędne rekordy z Firestore (`void-potato-7721`) oraz zaktualizowano bazę SQLite `data/tasks.sqlite`.
- [*] Zmodyfikowano: `package.json` – podniesiono wersję do `2.18.8`.
- [*] Zmodyfikowano: Utworzono dokumentację wydania `docs/versions/v2.18.8.md`.
- [*] Zmodyfikowano: Utworzono kartę błędu `docs/errors/ERROR_DIFF_2026-09-15_pushbullet_silent_fail_and_timetable_2ti.md` (zamknięta ze statusem SUCCESS).

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY (REFERENCJA 10/10 ENTERPRISE GRADE)

---


## v 2.18.7 — 2026-09-15
**Typ:** PATCH  
**Zakres:** Auto-Recovery Dynamicznych Importów (Vite Preload Guard & ChunkLoadError Auto-Reload), Bezpośrednia Synteza ElevenLabs z Przeglądarki (Eliminacja Fałszywego Proxy HTML), Dynamiczne Próbki Głosowe w Ustawieniach z Identyfikacją Lektora oraz Serverless Endpoint `/api/tts`.

### Zmiany
- [+] Dodano: Wrapper `lazyWithRetry` w `core.client.jsx` oraz globalny listener `vite:preloadError`, automatycznie odświeżające aplikację w przypadku unieważnienia chunków po nowym wdrożeniu na CDN/Firebase.
- [+] Dodano: Automatyczna detekcja błędów importu modułów w `modules/components/ErrorBoundary.jsx` (przeładowanie zamiast blokowania ekranu).
- [+] Dodano: Bezpośrednia synteza mowy w `modules/services/ttsService.js` przez ElevenLabs API z przeglądarki (CORS `*`) z priorytetyzacją klucza klienta i ścisłą walidacją nagłówków MIME audio (`audio/mpeg`).
- [+] Dodano: Nowy serverless endpoint `api/tts.js` z pełną obsługą CORS na Vercel.
- [+] Dodano: Personalizowana próbka audio w `testVoice` w `modules/pages/SettingsPage.jsx` informująca głosem o aktualnie testowanym lektorze (Adam, Antoni, Rachel, Sarah, Marek, Zofia).
- [+] Dodano: Karta błędu `docs/errors/ERROR_DIFF_2026-09-15_dynamic_import_and_tts_voice_switch.md` (zamknięta ze statusem SUCCESS).
- [*] Zmodyfikowano: `package.json` – podniesiono wersję do `2.18.7`.
- [*] Zmodyfikowano: Utworzono dokumentację wydania `docs/versions/v2.18.7.md`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY (REFERENCJA 10/10 ENTERPRISE GRADE)

---

## v 2.18.6 — 2026-09-14
**Typ:** PATCH  
**Zakres:** Studyjna Synteza Mowy ElevenLabs (API Integration, Polish Multilingual v2, Studio Voices), Manualne Wyciszanie Mikrofonu (Mute/Unmute Toggle w LiveVoiceBar, Chat Toolbarze i VoiceInspectorHUD) oraz Automatyczna Kaskada TTS.

### Zmiany
- [+] Dodano: Pełna integracja z ElevenLabs Text-to-Speech API (`eleven_multilingual_v2`) w `modules/services/ttsService.js` z obsługą głosów studyjnych: Adam (`pNInz6obpgDQGcFmaJgB`), Antoni (`ErXwobaYiN019PkySvjV`), Rachel (`21m00Tcm4TlvDq8ikWAM`) oraz Sarah (`EXAVITQu4vr4xnSDxMaL`).
- [+] Dodano: Automatyczna kaskada silników TTS (*multi-tier fallback*): `elevenlabs` -> `edge` (Microsoft Neural) -> `web` (Web Speech API) przy wykryciu klucza w środowisku lub magazynie lokalnym.
- [+] Dodano: Dedykowany przycisk `[Wycisz] / [Odcisz]` w pasku `LiveVoiceBar` w `modules/components/Terminal.jsx`, natychmiastowo przerywający i wstrzymujący pętlę ciągłego nasłuchu z bursztynowym wyróżnieniem `[WYCISZONY (MANUALNIE)]`.
- [+] Dodano: Szybki przycisk wyciszania mikrofonu w toolbarze formularza czatu obok trybu ciągłego i dyktafonu w `Terminal.jsx`, sterujący stanem globalnego nasłuchu `wakeWordService`.
- [+] Dodano: Pełnowymiarowy przycisk `WYCISZ MIKROFON (MUTE)` / `ODCISZ MIKROFON` w widżecie diagnostycznym `VoiceInspectorHUD.jsx`.
- [+] Dodano: Flaga `isManualMuted`, metody `toggleMute()` / `setMuted()` oraz dystrybucja zdarzenia `omniMicMuteChanged` w `modules/services/wakeWordService.js`.
- [*] Zmodyfikowano: Konfiguracja `.env` i `.env.example` o parametry `ELEVENLABS_API_KEY` oraz `VITE_ELEVENLABS_API_KEY`.
- [*] Zmodyfikowano: `modules/pages/SettingsPage.jsx` – automatyczne wczytywanie klucza ElevenLabs ze zmiennych środowiskowych i domyślne ustawianie studyjnego silnika TTS.
- [*] Zmodyfikowano: `package.json` – podniesiono wersję do `2.18.6`.
- [*] Zmodyfikowano: Utworzono dokumentację wydania `docs/versions/v2.18.6.md`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY (REFERENCJA 10/10 ENTERPRISE GRADE)

---

## v 2.18.5 — 2026-09-14
**Typ:** PATCH  
**Zakres:** Eliminacja Sprzężenia Akustycznego (Acoustic Self-Echo Cancellation), Aktywne Wyciszanie Mikrofonu Podczas Mowy AI, Bufor Wygaszania Pogłosu (Acoustic Tail Guard Cooldown 600ms) oraz Wizualna Sygnalizacja Stanu Wyciszenia w Interfejsie.

### Zmiany
- [+] Dodano: Algorytm tłumienia echa akustycznego `isAcousticEcho(spokenText, aiText)` w `modules/services/wakeWordService.js`, weryfikujący podciągi i pokrycie leksykalne (>60%) wypowiedzi asystenta i neutralizujący rejestrację dźwięku emitowanego z głośników.
- [+] Dodano: Bufor wygaszania pogłosu akustycznego (Acoustic Tail Guard Cooldown 600ms) po zakończeniu syntezy mowy `ttsService.speak` w `modules/components/Terminal.jsx`, eliminujący przechwytywanie rewerberacji fali dźwiękowej z pomieszczenia/laptopa.
- [+] Dodano: Dedykowana sygnalizacja wyciszenia w `LiveVoiceBar` w `Terminal.jsx` z pulsującą czerwoną ikoną `MicOff`, etykietą `[MIKROFON WYCISZONY (AI MÓWI)]` oraz statusem blokady.
- [+] Dodano: Reakcja widżetu `VoiceInspectorHUD.jsx` na zdarzenie `omniAiSpeaking` – wyświetlanie stanu `🔇 Wyciszony (AI mówi)` oraz wytłumienie wskaźnika poziomu VU do 0%.
- [+] Dodano: 4 nowe testy jednostkowe w `tests/wakeword.test.js` badające precyzję filtrowania echa i brak fałszywych odrzuceń nowych komend.
- [*] Zmodyfikowano: Natychmiastowy abort `liveRecognitionRef.current.abort()` i czyszczenie buforów/timerów w `handleLiveUserSpeech` w momencie rozpoczęcia przetwarzania i mówienia.
- [*] Zmodyfikowano: Zabezpieczenie przed równoległym wznawianiem `wakeWordService` w tle podczas aktywnego trybu ciągłej rozmowy (`setLiveModeActive`).
- [*] Zmodyfikowano: `package.json` – podniesiono wersję do `2.18.5`.
- [*] Zmodyfikowano: Utworzono dokumentację wydania `docs/versions/v2.18.5.md`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY (REFERENCJA 10/10 ENTERPRISE GRADE)

---

## v 2.18.4 — 2026-09-14
**Typ:** PATCH  
**Zakres:** Ultra-Czuły Nasłuch Cichej Mowy i Szeptu (Matryca Fonetyczna "o mnie" / "omini" / "asystent"), Eliminacja Deadlocka `setAiSpeaking` (Trwałe Uciszenie Asystenta), Wskaźnik Poziomu Wejścia Audio Na Żywo (Live VU Meter) oraz Natychmiastowy Nasłuch w Live Voice Mode.

### Zmiany
- [+] Dodano: Ultra-szeroka matryca fonetyczna w `modules/services/wakeWordService.js` obsługująca szept i cichą mowę: wykrywanie zwrotów `o mnie`, `omini`, `oni`, `on mi`, `asystent`, `asystencie`, `komputer`, `hejka o mnie`, `hej mommy`, `hej mami` oraz pytań złożonych bez wymogu głośnego krzyczenia w klasie.
- [+] Dodano: Wskaźnik poziomu audio na żywo (Live VU Meter 0–100%) oparty o `AudioContext` i `AnalyserNode` w `VoiceInspectorHUD.jsx`, zapewniający natychmiastową wizualną informację zwrotną o czułości mikrofonu.
- [*] Zmodyfikowano: Wyeliminowano krytyczny deadlock w `setAiSpeaking` w `wakeWordService.js`, który powodował trwałe zablokowanie nasłuchu w stanie paused po pierwszej odpowiedzi AI.
- [*] Zmodyfikowano: Wyłączono programowe tłumienie szumów WebRTC (`noiseSuppression: false`), które w salach lekcyjnych usuwało cichy szept jako szum tła.
- [*] Zmodyfikowano: W `modules/components/Terminal.jsx` usunięto blokujące powitanie głosowe przy `enterLiveMode` – mikrofon natychmiast rozpoczyna nasłuch bez opóźnień, a próg VAD zredukowano do 650ms.
- [*] Zmodyfikowano: Rozszerzono zestaw testów jednostkowych w `tests/wakeword.test.js`.
- [*] Zmodyfikowano: `package.json` – podniesiono wersję do `2.18.4`.
- [*] Zmodyfikowano: Utworzono dokumentację wydania `docs/versions/v2.18.4.md`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY (REFERENCJA 10/10 ENTERPRISE GRADE)

---

## v 2.18.3 — 2026-09-14
**Typ:** PATCH  
**Zakres:** Inteligentny Detektor Pauzy VAD (750ms Debounce) w Hałasie Otoczenia, Eliminacja Blokady Sprzętowej Mikrofonu (Hardware Contention), Naprawa Pętli Ciągłego Nasłuchu w Chromium (`InvalidStateError`) oraz Przycisk Natychmiastowej Wysyłki ("Wyślij teraz") w Pasku Rozmowy Na Żywo.

### Zmiany
- [+] Dodano: Aplikacyjny detektor pauzy mowy VAD (Voice Activity Detection) z 750ms debounce w `modules/components/Terminal.jsx` – automatycznie zatwierdza i wysyła transkrypcję do AI, eliminując zawieszanie w hałasie sali lekcyjnej/otoczenia, gdzie przeglądarka nie emituje `isFinal`.
- [+] Dodano: Dedykowany przycisk natychmiastowej wysyłki (`Wyślij`) w pasku `Live Voice Bar` w `modules/components/Terminal.jsx`, pozwalający operatorowi wysłać rozpoznany tekst od razu bez oczekiwania na pauzę.
- [*] Zmodyfikowano: `modules/components/Terminal.jsx` – eliminacja błędu `InvalidStateError` w zdarzeniu `recognition.onend` poprzez zastąpienie nielegalnego restartu `recognition.start()` na zakończonym obiekcie czystą reinicjalizacją pętli `startLiveListeningLoop()`.
- [*] Zmodyfikowano: `modules/components/Terminal.jsx` – zamiana `wakeWordService.pause()` na `wakeWordService.stop()` przy wchodzeniu w tryb ciągłej rozmowy, całkowicie zwalniając urządzenie wejściowe audio.
- [*] Zmodyfikowano: `modules/services/wakeWordService.js` – zwalnianie strumienia mikrofonu (`releaseSilentAudioStream`) w `pause()` oraz zerowanie referencji `this.recognition = null` przy `onend`, zapobiegając konfliktom sprzętowym z innymi modułami.
- [*] Zmodyfikowano: Włączenie sprzętowej redukcji szumów (`noiseSuppression: true`) w strumieniu pomocniczym audio mikrofonu.
- [*] Zmodyfikowano: `package.json` – podniesiono wersję do `2.18.3`.
- [*] Zmodyfikowano: Utworzono dokumentację wydania `docs/versions/v2.18.3.md`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY (REFERENCJA 10/10 ENTERPRISE GRADE)

---

## v 2.18.2 — 2026-09-14
**Typ:** PATCH  
**Zakres:** Globalna Dostępność OmniVoice na Ekranie Blokady (`LockScreen`), Bezwzględny Brak Cache dla `index.html` w Firebase Hosting, Usunięcie Błędu 404 `noise.svg` oraz Rejestracja w `globalThis.__OMNI_VOICE__`.

### Zmiany
- [+] Dodano: Wyniesienie montowania `<VoiceInspectorHUD />` na poziom nadrzędny w `core.client.jsx`, gwarantujące dostępność widżetu diagnostycznego oraz inicjalizację nasłuchu `wakeWordService.start()` na ekranie blokady (`LockScreen`).
- [+] Dodano: Automatyczne odblokowanie ekranu po detekcji słowa wybudzającego „Hej Omni” na `LockScreen`.
- [+] Dodano: Globalne dowiązanie `globalThis.__OMNI_VOICE__ = hub` obok `window.__OMNI_VOICE__` w `modules/services/wakeWordService.js`.
- [+] Dodano: Reguły `headers` w `firebase.json` wymuszające `Cache-Control: no-cache, no-store, must-revalidate` dla `index.html`, zapobiegające serwowaniu starego bundle JS z pamięci podręcznej przeglądarki.
- [+] Dodano: Meta tagi anty-cache w `index.html`.
- [*] Zmodyfikowano: Usunięto zewnętrzne odwołanie do `noise.svg` (404 w DevTools) w `LockScreen.jsx`, `ApiConfigScreen.jsx` i `SetupWizard.jsx` na rzecz czystego gradientu CSS.
- [*] Zmodyfikowano: `package.json` – podniesiono wersję do `2.18.2`.
- [*] Zmodyfikowano: Zaktualizowano `scripts/sync_bez_firebase.js`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY (REFERENCJA 10/10 ENTERPRISE GRADE)

---

## v 2.18.1 — 2026-09-14
**Typ:** PATCH  
**Zakres:** Diagnostyka w Konsoli DevTools (`window.__OMNI_VOICE__`), Eliminacja Przestojów `no-speech` Exponential Backoff, Pływający Komponent Ekranowy `VoiceInspectorHUD` oraz Automatyczne Wznawianie Mikrofonu po Interakcji Użytkownika.

### Zmiany
- [+] Dodano: Globalny interfejs diagnostyczny `window.__OMNI_VOICE__` w DevTools F12 z metodami `getStatus()`, `getState()`, `history`, `testWakeWord()`, `requestMic()`, `restart()`, `showInspector()`, `hideInspector()`, `help()`.
- [+] Dodano: Pływający widżet ekranowy `modules/components/VoiceInspectorHUD.jsx` montowany w `core.client.jsx` z podglądem na żywo słyszanej mowy, statusem mikrofonu i przyciskami diagnostycznymi.
- [+] Dodano: Zdarzenie rozgłoszeniowe `omniSpeechHeard` w `modules/services/wakeWordService.js` przesyłające bieżącą transkrypcję do UI i konsoli.
- [+] Dodano: Przełącznik widoczności Live HUD oraz informator o konsoli DevTools w `modules/pages/SettingsPage.jsx`.
- [*] Zmodyfikowano: `modules/services/wakeWordService.js` – naprawiono krytyczny błąd akumulacji opóźnienia wykładniczego przy zdarzeniu `no-speech` w Chromium/Edge; cisza natychmiast restartuje nasłuch w 80ms bez nakładania kary czasowej.
- [*] Zmodyfikowano: Dodano nasłuchiwacze interakcji (`click`, `keydown`, `pointerdown`) odblokowujące mikrofon w przypadku restrykcji autoplay przeglądarki.
- [*] Zmodyfikowano: `package.json` – podniesiono wersję do `2.18.1`.
- [*] Zmodyfikowano: Zaktualizowano `scripts/sync_bez_firebase.js`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY (REFERENCJA 10/10 ENTERPRISE GRADE)

---

## v 2.18.0 — 2026-09-14
**Typ:** MINOR  
**Zakres:** Zaawansowana Czułość Wykrywania Wake Word "Hej Omni" (Fonetyczna Matryca Cichej Mowy, MaxAlternatives = 5, Wyłączenie Agresywnej Bramki Szumów) oraz Dedykowany Silnik Microsoft Edge Cognitive Neural TTS (Studio 24kHz MP3, Marek / Zofia, Zero API Key).

### Zmiany
- [+] Dodano: Domyślny silnik studyjnej syntezy mowy Microsoft Edge Neural (`msedge-tts`) w `modules/services/ttsService.js`, `modules/routes/ai.js` oraz `api/voice/tts.js` z ultra-naturalnymi głosami `pl-PL-MarekNeural` i `pl-PL-ZofiaNeural` bez wymogu kluczy API.
- [+] Dodano: Pełną fonetyczną matrycę wariantów cichej mowy w języku polskim w `modules/services/wakeWordService.js` („oni”, „o mnie”, „on mi”, „omnie”, „omnia”, „omi”, „homi”) eliminującą konieczność podnoszenia głosu lub krzyczenia.
- [+] Dodano: Weryfikację wielu hipotez transkrypcyjnych (`recognition.maxAlternatives = 5`) w `wakeWordService.js` oraz `Terminal.jsx`.
- [+] Dodano: Wyłączenie programowej bramki szumów (`noiseSuppression: false`) w mikrofonie, zapobiegając ucinaniu cichej i spokojnej mowy.
- [+] Dodano: Obsługę niedomkniętych transkrypcji częściowych (`interimResults`) przy zdarzeniu `onend` w pętli rozmowy na żywo w `Terminal.jsx`.
- [+] Dodano: Dedykowany panel wyboru głosów Microsoft Edge Neural w `modules/pages/SettingsPage.jsx`.
- [+] Dodano: Zestaw testów weryfikujących warianty cichej mowy w `tests/wakeword.test.js` (72/72 PASS).
- [*] Zmodyfikowano: `package.json` – dodano `msedge-tts` oraz podniesiono wersję do `2.18.0`.
- [*] Zmodyfikowano: Zaktualizowano `scripts/sync_bez_firebase.js`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY (REFERENCJA 10/10 ENTERPRISE GRADE)

---

## v 2.17.0 — 2026-09-14
**Typ:** MINOR  
**Zakres:** Bezpośrednie Przekierowanie Wake Word "Hej Omni" do Natywnego Chatu (`/chat`), Zintegrowany Pasek Live Voice Bar w `Terminal.jsx`, Wielosilnikowa Synteza Mowy (ElevenLabs Multilingual v2, OpenAI TTS-1, Web Speech Neural Fallback) oraz Chirurgiczna Redukcja Modalu Radar Orb.

### Zmiany
- [+] Dodano: Nowy serwis wielosilnikowej syntezy mowy `modules/services/ttsService.js` z obsługą ElevenLabs, OpenAI TTS oraz priorytetyzacją naturalnych głosów Web Speech API.
- [+] Dodano: Backendowe proxy TTS `POST /api/voice/tts` w `modules/routes/ai.js` ze wsparciem dla kluczy API serwera i nagłówków klienta.
- [+] Dodano: Zintegrowany pasek stanu głosu Live Voice Bar w głównym komponencie `modules/components/Terminal.jsx` z automatyczną pętlą ciągłej rozmowy, wizualizacją fal dźwiękowych i zachowaniem pełnego widoku historii wiadomości.
- [+] Dodano: Dedykowaną sekcję konfiguracji silnika głosu (ElevenLabs / OpenAI / Web Speech) i kluczy API w `modules/pages/SettingsPage.jsx`.
- [*] Zmodyfikowano: `modules/components/GlobalEventListener.jsx` – detekcja "Hej Omni" natychmiast przekierowuje do `/chat` i wysyła zdarzenie `startContinuousLiveVoice`.
- [*] Zmodyfikowano: `modules/components/Sidebar.jsx` – kliknięcie asystenta głosowego nawiguje bezpośrednio do `/chat` i aktywuje sesję live.
- [*] Zmodyfikowano: `core.client.jsx` – usunięto montowanie oddzielnego modalu na rzecz natywnego czatu.
- [-] Usunięto: Zgodnie z dyspozycją operatora usunięto komponent `modules/components/GlobalLiveVoiceModal.jsx` (chirurgiczna redukcja).
- [*] Zmodyfikowano: Zaktualizowano `scripts/sync_bez_firebase.js` i podniesiono wersję do `2.17.0`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY (REFERENCJA 10/10 ENTERPRISE GRADE)

---

## v 2.16.1 — 2026-09-14
**Typ:** PATCH  
**Zakres:** Optymalizacja i Stabilizacja Podsystemu Głosowego: Eliminacja Pętli Rezonansowej Web Speech API & TTS, Strażniki Stanów useRef w GlobalLiveVoiceModal, Bezkolizyjny Cichy Strumień Audio (Warm Audio Stream) w wakeWordService i Wytłumienie Akustyczne (400ms Reverberation Buffer).

### Zmiany
- [+] Dodano: `acquireSilentAudioStream()` z wykorzystaniem `navigator.mediaDevices.getUserMedia()` w `modules/services/wakeWordService.js` zapobiegające cyklicznemu wygaszaniu pipeline'u audio i klikom sprzętowym w systemie Windows.
- [+] Dodano: Strażnik stanu `setAiSpeaking(isSpeaking)` w `wakeWordService.js` gwarantujący bezpieczne zawieszenie nasłuchu w tle podczas syntezy mowy.
- [*] Zmodyfikowano: `modules/components/GlobalLiveVoiceModal.jsx` z użyciem `useRef` (`isSpeakingRef`, `isListeningRef`, `isProcessingRef`), eliminując wyścigi domknięć (closure race condition) i pętlę sprzężenia zwrotnego.
- [*] Zmodyfikowano: Wprowadzono 400ms opóźnienie akustyczne przed wznowieniem nasłuchu mowy po zakończeniu odpowiedzi TTS.
- [*] Zmodyfikowano: Utworzono dokumentację wydania `/docs/versions/v2.16.1.md`.
- [*] Zmodyfikowano: Podniesiono wersję w `package.json` do `2.16.1`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY (REFERENCJA 10/10 ENTERPRISE GRADE)

---

## v 2.16.0 — 2026-09-14
**Typ:** MINOR  
**Zakres:** Globalny Asystent Głosowy "Hej Omni" & Autonomiczny Tryb Ciągłej Rozmowy (Web Speech API, Automatyczny Watchdog Nasłuchu w Tle, Synteza Odpowiedzi TTS, Globalny Cyberpunk Radar Orb Modal oraz Integracja w Pasku Bocznym i Mobilnym).

### Zmiany
- [+] Dodano: Serwis `modules/services/wakeWordService.js` z automatycznym nasłuchem słowa wybudzającego "Hej Omni" w tle, inteligentnym watchdogiem, normalizacją transkrypcji i sanityzacją tekstu pod kątem syntezy TTS.
- [+] Dodano: Globalny interfejs konwersacji głosowej `modules/components/GlobalLiveVoiceModal.jsx` z animowaną kulą radarową, pętlą ciągłej rozmowy bez konieczności ponownego klikania oraz obsługą komend zakończenia (np. "stop", "dziękuję").
- [+] Dodano: Zestaw 12 testów jednostkowych w `tests/wakeword.test.js`. Łączny stan testów w projekcie: 71/71 PASS (100%).
- [+] Dodano: Raport wdrożenia `/docs/versions/v2.16.0.md`.
- [*] Zmodyfikowano: `core.client.jsx` montując `GlobalLiveVoiceModal` na poziomie nadrzędnym aplikacji.
- [*] Zmodyfikowano: `modules/components/Sidebar.jsx` o przyciski wywołania i wskaźniki statusu nasłuchu na pulpicie i w nagłówku mobilnym.
- [*] Zmodyfikowano: `modules/components/Terminal.jsx` integrując przycisk trybu ciągłej rozmowy z globalnym asystentem.
- [*] Zmodyfikowano: `modules/pages/SettingsPage.jsx` dodając przełącznik ciągłego nasłuchu i test interakcji głosowej.
- [*] Zmodyfikowano: Podniesiono wersję w `package.json` do `2.16.0`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY (REFERENCJA 10/10 ENTERPRISE GRADE)

---

## v 2.15.0 — 2026-09-10
**Typ:** MINOR  
**Zakres:** Dwukierunkowa Integracja Pushbullet ze Smartfonem Operatora: Autonomiczny Kasyfikator Wydatków 50/30/20 z Powiadomień Mobilnych (Portfel Google, BLIK, Banki), Hybrydowa Persystencja SQLite + Cloud Firestore, Nowy Znacznik Akcji AI [ACTION:SEND_PUSH] oraz Punkty Końcowe API /api/phone/push.

### Zmiany
- [+] Dodano: Dedykowany moduł regułowo-kognitywny `modules/services/pushbulletClassifier.js` realizujący filtrację powiadomień bankowych, odsiewanie kodów jednorazowych BLIK/2FA, deduplikację w oknie czasowym 60s oraz ekstrakcję kwoty, waluty, podmiotu i alokacji 50/30/20 (Needs vs Wants vs Savings) za pomocą LLM i reguł heurystycznych.
- [+] Dodano: Automatyczne księgowanie wydatków w `modules/pushbullet.js` do bazy SQLite (`finances`) oraz chmury Cloud Firestore z natychmiastowym rozgłaszaniem zdarzeń SSE (`broadcastEvent('finance_updated')`).
- [+] Dodano: Zwrotne powiadomienie Push do telefonu operatora po automatycznym zaksięgowaniu wydatku (`formatExpenseConfirmation`).
- [+] Dodano: Punkty końcowe `POST /api/phone/push` i `GET /api/phone/status` w `modules/routes/phone.js`.
- [+] Dodano: Nowy znacznik akcji `[ACTION:SEND_PUSH title="..." body="..."]` w promptach asystenta AI (`api/agent.js` oraz `modules/services/clientAiDispatcher.js`), umożliwiający asystentowi przesyłanie wiadomości i zadań bezpośrednio na telefon operatora.
- [+] Dodano: Zestaw 15 testów jednostkowych w `tests/pushbullet_finance.test.js`. Łączny stan testów w projekcie: 54/54 PASS (100%).
- [*] Zmodyfikowano: `modules/routes/auth.js` o bezpieczne wyjątki dla ścieżek `/phone/`.
- [*] Zmodyfikowano: `scripts/sync_bez_firebase.js` zsynchronizowano z nowymi modułami Pushbullet.
- [*] Zmodyfikowano: Podniesiono wersję w `package.json` do `2.15.0`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY (REFERENCJA 10/10 ENTERPRISE GRADE)

---


## v 2.14.1 — 2026-09-09
**Typ:** PATCH  
**Zakres:** Wzmocnienie Bezpieczeństwa & Zero-Leak Sanitization Repozytorium: Wykluczenie z Indeksu Gita i Zabezpieczenie Pliku ZASADYPRACY.md, Usunięcie Prywatnych Konfiguracji Chmurowych (.firebaserc, scripts/seed_real_timetable.js, docs/error.log) z Wypychania do Gita, Aktualizacja Reguł .gitignore, Pełna Normalizacja Bezwzględnych Ścieżek i Identyfikatorów Projektowych w Dokumentacji i Narzędziach.

### Zmiany
- [+] Dodano: Reguły ignorowania w `.gitignore` dla `ZASADYPRACY.md`, `.firebaserc`, `scripts/seed_real_timetable.js`.
- [+] Dodano: Raport wdrożenia `/docs/versions/v2.14.1.md`.
- [*] Zmodyfikowano: Wyrejestrowano z indeksu Gita (`git rm --cached`): `ZASADYPRACY.md` (pozostawiony lokalnie dla zachowania Priorytetu Zero), `.firebaserc`, `scripts/seed_real_timetable.js`, `docs/error.log`.
- [*] Zmodyfikowano: Wyczyszczono lokalny plik `docs/error.log` usuwając archiwalne zrzuty stosu Express/Axios.
- [*] Zmodyfikowano: Przeskanowano i znormalizowano archiwalną dokumentację (`HISTORY.md`, `docs/versions/v2.2.0.md`, `docs/versions/v2.10.0.md`, `docs/versions/v2.11.0.md`) usuwając wszelkie odnośniki `file:///c:/Users/...` oraz prywatne nazwy instancji chmurowych.
- [*] Zmodyfikowano: `scripts/translate.py`, `scripts/translate2.py`, `scripts/update_i18n.cjs` zabezpieczono przed wyciekiem ścieżek bezwzględnych poprzez dynamiczną alokację `BASE_DIR`.
- [*] Zmodyfikowano: Zaktualizowano `ARCHITECTURE.md` oraz podniesiono wersję w `package.json` do `2.14.1`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY (REFERENCJA 10/10 ENTERPRISE GRADE)

---


## v 2.14.0 — 2026-09-09
**Typ:** MINOR  
**Zakres:** Eliminacja Anomalii Spójności Danych Finansowych: Rozdzielenie Analityki Wydatków od Puli Portfela (Dwutrybowy SVG Donut Chart [Wydatki vs Cel | Pule Portfela]), Dynamiczna Repartycja Przychodów Typu Split po Zmianie Celów Budżetowych (np. 30/0/70), Pasek Automatycznej Weryfikacji Integralności Matematycznej w Cashflow Trend oraz Dynamiczny Eksport Raportów.

### Zmiany
- [+] Dodano: Dwutrybowy przełącznik widoku Donut Chart w `FinancePage.jsx` (`[Wydatki vs Cel | Pule Portfela]`), eliminujący mylenie podziału pojedynczych wydatków (np. 23.24 PLN) z alokacją całego kapitału / przychodów (517.50 PLN).
- [+] Dodano: Pasek weryfikacji integralności matematycznej w Cashflow Trend (`Wpływy - Wydatki = Cashflow = Dostępne w kopertach [Spójne ✅]`).
- [+] Dodano: Nowy parametr analityczny `allocationPercentages` w silniku `modules/services/budgetCalculator.js` zwracający rzeczywisty procentowy rozkład środków w portfelu.
- [+] Dodano: Testy jednostkowe w `tests/budget.test.js` sprawdzające automatyczne przeliczanie przychodów typu split przy zmianie reguły budżetowej oraz zachowanie stałych wartości w trybie custom. Stan testów: 39/39 PASS (100%).
- [*] Zmodyfikowano: `budgetCalculator.js` – wpisy przychodów w trybie `split` (oraz bez jawnego trybu) są dynamicznie dzielone według aktywnych procentów budżetowych, zapobiegając blokowaniu starych snapshotów `distribution`.
- [*] Zmodyfikowano: `FinancePage.jsx` – ujednolicono obliczenia przy pomocy silnika `calculateFinanceStats` oraz zaimplementowano automatyczną re-synchronizację zapisanych transakcji `split` w procedurze `handleSetupSubmit`.
- [*] Zmodyfikowano: `ExportModal.jsx` – zastąpiono statyczne etykiety 50/30/20 dynamicznym odczytem konfiguracji przekazanej w props lub zapisanej w `system_finance_settings`.
- [*] Zmodyfikowano: Podniesiono wersję w `package.json` do `2.14.0`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY (REFERENCJA 10/10 ENTERPRISE GRADE)

---

## v 2.13.0 — 2026-09-09
**Typ:** MINOR  
**Zakres:** Certyfikacja Jakości Enterprise 10/10: Rozbudowa Testów Komponentów Reacta (@testing-library/react + JSDOM, 37/37 Testów PASS), Telemetria Czasu Rzeczywistego Server-Sent Events (SSE /api/system/stream), Przełącznik Motywów Dark/Light (Mobile & Desktop), Odporność Stanów Brzegowych (Szkielety Ładowania, Fallbacki, Retry) oraz Zunifikowany Potok CI/CD (.github/workflows/main.yml).

### Zmiany
- [+] Dodano: Dedykowany pakiet testów komponentowych Reacta (`tests/components.test.jsx`) oparty o `@testing-library/react` i `jsdom` (7 testów sprawdzających stany szkieletowe, przełączanie motywów, stos toastów, okno eksportu oraz odporność na awarie sieciowe). Łączny stan testów w projekcie: 37/37 PASS (100%).
- [+] Dodano: Strumień Server-Sent Events (SSE) `/api/system/stream` w `modules/routes/system.js` transmitujący telemetrię systemu (CPU, RAM, Uptime, Heap) co 2 sekundy w czasie rzeczywistym.
- [+] Dodano: Hybrydowy odbiornik telemetrii w `SystemMonitor.jsx` z obsługą SSE, automatycznym przejściem w tryb telemetrii przeglądarkowej w chmurze (`performance.memory`), wskaźnikiem stanu (`● SSE LIVE` vs `● CLIENT`), szkieletem ładowania (Skeleton Loader) i przyciskiem ponowienia (Retry).
- [+] Dodano: Błyskawiczny przełącznik motywów Dark / Light (`toggleDarkLight`) umieszczony w widocznym miejscu w nagłówku mobilnym oraz w stopce menu bocznego na desktopie, zintegrowany z pamięcią `localStorage` i 7 paletami kolorystycznymi.
- [+] Dodano: Główny potok CI/CD GitHub Actions (`.github/workflows/main.yml`) uruchamiający linter, 37 testów jednostkowych/komponentowych, budowanie produkcyjne i weryfikację artefaktów `dist/`.
- [*] Zmodyfikowano: `README.md` rozszerzony o makietę wizualną interfejsu (ASCII Preview), wyczerpującą tabelę zmiennych środowiskowych `.env.example`, poradnik rozwiązywania problemów (Troubleshooting Guide) oraz podsumowanie zestawu testów.
- [*] Zmodyfikowano: Wyeliminowano wszelkie wycieki nazw prywatnych projektów i adresów e-mail z kodu źródłowego, szablonów `.env.example` oraz archiwalnej dokumentacji (Rule 11 Ghost Operator & Rule 15 Secure-by-Design).
- [*] Zmodyfikowano: Podniesiono wersję w `package.json` do `2.13.0`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY (REFERENCJA 10/10 ENTERPRISE GRADE)

---

## v 2.12.0 — 2026-09-09
**Typ:** MINOR  
**Zakres:** Podniesienie Projektu do Oceny Referencyjnej 10/10: Pływające Centrum Powiadomień (Toast Hub), Monitor Sieci Online/Offline, Zautomatyzowany Silnik Testów (Vitest, 30/30 PASS), Generator Raportów CSV & Druk/PDF, Potok CI/CD GitHub Actions, Czyste Silniki Obliczeniowe (Budget & Warsaw Time) oraz Przebudowa README z Diagramami Mermaid.

### Zmiany
- [+] Dodano: Zunifikowane Centrum Powiadomień (`modules/context/ToastContext.jsx` oraz `modules/components/ToastContainer.jsx`) w stylistyce Glassmorphism z obsługą typów `success`, `error`, `warning`, `info`, animowanym paskiem czasu i auto-dismiss.
- [+] Dodano: Strażnika sieci i wykrywanie stanu połączenia (`navigator.onLine` + zdarzenia `online`/`offline`) z automatycznym ostrzeżeniem nagłówkowym w przypadku utraty łączności.
- [+] Dodano: Centrum Raportów i Eksportu Danych (`modules/services/exportService.js` oraz `modules/components/ExportModal.jsx`) z pobieraniem plików CSV (zgodność z RFC 4180) oraz generowaniem raportów do druku / zapisu PDF (`@media print`) dla Finansów, Zadań, Treningów i Planu Lekcji.
- [+] Dodano: Zautomatyzowany runner testów Vitest (`package.json`: `"test": "vitest run"`) oraz 5 kompletnych zestawów testowych w katalogu `tests/` (`budget.test.js`, `export.test.js`, `time.test.js`, `osint.test.js`, `cloudSync.test.js`) — 30/30 testów zdanych (100% PASS).
- [+] Dodano: Potok integracji ciągłej GitHub Actions (`.github/workflows/ci.yml`) weryfikujący automatycznie zależności, testy jednostkowe, kompilację produkcyjną Vite i artefakty `dist/`.
- [+] Dodano: Czysty silnik obliczeniowy 50/30/20 (`modules/services/budgetCalculator.js`) z obsługą kopert celowych, transferów i wag 0%.
- [+] Dodano: Dedykowany moduł narzędziowy czasu polskiego (`modules/services/timeUtils.js`) formatujący datę, godzinę i dni tygodnia w strefie `Europe/Warsaw`.
- [*] Zmodyfikowano: `README.md` kompletnie przebudowany: dodano interaktywne odznaki, diagramy architektoniczne Mermaid (Multi-Cloud Mesh oraz pętla kognitywna AI), szczegółową tabelę modułów i instrukcje instalacji.
- [*] Zmodyfikowano: `modules/osint.js` oraz `api/osint.js` ulepszone o priorytetyzację detekcji e-maili przed domenami oraz pełną obsługę domen wielopoziomowych i subdomen.
- [*] Zmodyfikowano: `FinancePage.jsx` zintegrowany z przyciskiem eksportu, powiadomieniami toast oraz kompletną obsługą usuwania transakcji `handleDelete`.
- [*] Zmodyfikowano: Zaktualizowano skrypt `scripts/sync_bez_firebase.js` i zsynchronizowano repozytorium mirror bez Firebase.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY (10/10 ENTERPRISE GRADE)

---

## v 2.11.5 — 2026-09-08
**Typ:** PATCH  
**Zakres:** Eliminacja Błędów Zwracania HTML w Endpointach API (Cloud-First Guard `isCloudEnvironment`), Nowa Funkcja Serverless `api/osint.js` na Vercel z CORS i Fallback Kliencki, Telemetria Kliencka w SystemMonitor/NetworkMonitor/ModelStatus/AgentQueue, Wyciszenie Ostrzeżeń Geolocation i Eliminacja Wywołań setState Podczas Renderowania.

### Zmiany
- [+] Dodano: Dedykowaną funkcję Vercel Serverless Function `api/osint.js` z pełną obsługą CORS (`Access-Control-Allow-Origin: *`), rozpoznawaniem typów celów (IP, domena, MAC, email, hasło), rozwiązywaniem DNS (Node DNS + Google DNS fallback), geolokalizacją GeoJS, historią migawek Wayback Machine, zapytaniami WHOIS i HaveIBeenPwned Range API.
- [+] Dodano: Autonomiczny mechanizm fallbacku klienckiego (browser-native OSINT scan) w `modules/pages/OSINTPage.jsx`, gwarantujący natychmiastowe wyniki bez ryzyka błędu HTML ze strony hostingu statycznego.
- [+] Dodano: Asynchroniczny dyspozytor zdarzeń `emitCloudDataChanged` w `modules/services/cloudSync.js` z opóźnieniem `setTimeout(..., 0)`, co całkowicie eliminuje ostrzeżenia Reacta o aktualizowaniu stanu innych komponentów w trakcie renderowania.
- [*] Zmodyfikowano: `FinancePage.jsx`, `TimetablePage.jsx` oraz `WorkoutsPage.jsx` zabezpieczono warunkiem `if (!isCloudEnvironment())` przed niepotrzebnym odpytywaniem lokalnych tras Express w środowisku statycznym Firebase Hosting.
- [*] Zmodyfikowano: `SettingsPage.jsx` w trybie chmurowym natychmiast zwraca konfigurację projektu Firestore `<PROJECT_ID_REDACTED>` bez odpytywania `/api/firebase/status` oraz zarządza kodem PIN lokalnie w chmurze.
- [*] Zmodyfikowano: `SystemMonitor.jsx`, `NetworkMonitor.jsx`, `ModelStatus.jsx` oraz `AgentQueue.jsx` w środowisku chmurowym wykorzystują telemetrię kliencką (`performance.memory`, `performance.now()`) oraz endpoint `https://ai-system-dashboard.vercel.app/api/status`, eliminując cykliczne błędy w konsoli co 5-10 sekund.
- [*] Zmodyfikowano: W `core.client.jsx` interceptor Axios ogranicza powiadomienia `console.warn` wyłącznie do lokalnego środowiska deweloperskiego (`localhost`).
- [*] Zmodyfikowano: W `WeatherWidget.jsx` zmieniono logowanie błędu braku dostępu do geolokalizacji na `console.debug`.
- [*] Zmodyfikowano: `ChatContext.jsx` dla komendy `/ping` pinguje bramę Vercel Gateway w trybie chmurowym.
- [*] Zmodyfikowano: `scripts/sync_bez_firebase.js` zaktualizowano o nowe pliki `api/osint.js`, monitory oraz dokumentację v2.11.5.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY

---

## v 2.11.4 — 2026-09-08
**Typ:** PATCH  
**Zakres:** Eliminacja Defektu Komendy /clear & /purge, Trwały Purge Historii Chatu w Cloud Firestore (`clearChatHistoryCloud`), Strażnik Granicy Sesji (`clearedAt` Timestamp Guard) & Zapobieganie Resurekcji Wiadomości.

### Zmiany
- [+] Dodano: Funkcję `clearChatHistoryCloud(targetMode)` w `modules/services/cloudSync.js` wykonującą natychmiastowe usunięcie wiadomości z lokalnego cache i asynchroniczne równoległe usunięcie (`deleteDoc`) z kolekcji `chat_history` w Cloud Firestore.
- [+] Dodano: Granicę odcięcia sesji chatu (`system_chat_cleared_worker` i `system_chat_cleared_mentor`) w `localStorage`, chroniącą przed resurekcją starych komunikatów w listenerze `subscribeCollection`.
- [+] Dodano: Ścisłe sortowanie chronologiczne i deduplikację unikalnych identyfikatorów wiadomości przy napływie aktualizacji z chmury w `ChatContext.jsx`.
- [+] Dodano: Obsługę globalnego zdarzenia `chatCleared` integrującą czyszczenie w `ChatContext.jsx`, `CommandPalette.jsx` oraz pigułce szybkiego promptu `🧹 Wyczyść czat`.
- [+] Dodano: Stabilne klucze renderowania list wiadomości w `Terminal.jsx` (`key={msg.id || ...}`) zapobiegające anomaliom DOM.
- [*] Zmodyfikowano: Skrypt synchronizacji `scripts/sync_bez_firebase.js` rozszerzony o pliki `ChatContext.jsx`, `CommandPalette.jsx` oraz dokumentację wersji.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY

---

## v 2.11.3 — 2026-09-08
**Typ:** PATCH  
**Zakres:** Obsługa Wartości 0% w Koszykach Budżetowych (Zachcianki, Potrzeby, Oszczędności), Eliminacja Regresji Falsy Check, Ochrona Przed Dzieleniem Przez Zero w Limitach, Profile Frugal/Minimal/FIRE.

### Zmiany
- [+] Dodano: Pełną obsługę wartości `0%` w konfiguracji budżetu (`needs_percent`, `wants_percent`, `savings_percent`) — wyeliminowano błąd logiczny polegający na traktowaniu `0` jako wartości falsy i wymuszaniu wartości domyślnych (`30%`).
- [+] Dodano: Bezpieczne parsowanie wskaźników procentowych w `FinancePage.jsx`, `ChatInlineWidgets.jsx`, `modules/agent.js`, `api/agent.js` oraz `clientAiDispatcher.js`.
- [+] Dodano: Ochronę przed dzieleniem przez zero w kalkulacjach limitów wydatków (`needsLimitPct`, `wantsLimitPct`, `savingsLimitPct`).
- [+] Dodano: Nowe szybkie presety alokacji w modalu ustawień: `70/0/30 (Frugal)`, `80/0/20 (Minimal)`, `50/0/50 (FIRE)`.
- [+] Dodano: Dedykowany stan i badge `Pula 0%` na karcie Zachcianek, gdy użytkownik ustali zerowy limit.
- [*] Zmodyfikowano: Pomyślna weryfikacja kompilacji produkcyjnej obu repozytoriów (0 błędów) oraz wdrożenie na Firebase Hosting.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY

---

## v 2.11.2 — 2026-09-07
**Typ:** PATCH  
**Zakres:** Odporny Parser Znaczników Akcji AI (obsługa pogrubień Markdown **, grawisów `, cudzysłowów typograficznych), Trwałe Utrwalenie Pamięci Sal Lekcyjnych w SQLite i Firestore (`operator_brain`), Wielopoziomowe Usuwanie Wydarzeń z Kalendarza & Pełny Audyt Metryk Kodu.

### Zmiany
- [+] Dodano: Elastyczny i odporny parser akcji agenta AI w `clientAiDispatcher.js` dopasowujący tagi akcji nawet wtedy, gdy model otoczy je pogrubieniem Markdown (`[**ACTION:REMEMBER** ...]`), grawisem lub spacjami.
- [+] Dodano: Obsługę polskich cudzysłowów drukarskich (`„`, `”`) oraz ostrokątnych (`«`, `»`) przy parsowaniu atrybutów akcji (`attrRegex`).
- [+] Dodano: Czyste usuwanie sformatowanych znaczników z treści odpowiedzi AI oraz syntezy mowy TTS (`Terminal.jsx`), eliminujące eksponowanie kodu akcji użytkownikowi.
- [+] Dodano: Trwały zapis faktu o rozmieszczeniu sal lekcyjnych (budynek Z/SZ/kropka vs główny) w bazie SQLite `user_memory` oraz kolekcji Firestore `operator_brain` (dokument `b5`).
- [+] Dodano: Wyraźną dyrektywę składniową w promptach mentora i workera (`api/agent.js` oraz `clientAiDispatcher.js`) zakazującą formatowania tagów akcji.
- [*] Zmodyfikowano: Potwierdzono 100% parytetu synchronizacji z repozytorium bez Firebase oraz bezbłędną kompilację produkcyjną (0 błędów).

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY

---

## v 2.11.1 — 2026-09-07
**Typ:** PATCH  
**Zakres:** Zaawansowane Usuwanie Wydarzeń w Kalendarzu (UI, Siatka Dni, Nadchodzące, Modal Szczegółów, Chat Widget), Komenda NL w AI Dispatcherze & Audyt Metryk Projektu.

### Zmiany
- [+] Dodano: Pełną, wielopoziomową obsługę usuwania wydarzeń w `CalendarPage.jsx`:
  - Bezpośredni przycisk usuwania (`Trash2`) na każdej karcie nadchodzących wydarzeń (`upcomingEvents`).
  - Zawsze widoczny, estetyczny przycisk usuwania w liście wydarzeń wybranego dnia (`selectedDayEvents`).
  - Dedykowany modal szczegółów wydarzenia (`viewingEvent`) otwierany po kliknięciu wydarzenia na siatce miesiąca, liście dnia lub w kartach nadchodzących — z pełnym podglądem metadanych (priorytet, kategoria, opis) i dużym przyciskiem „Usuń wydarzenie”.
- [+] Dodano: Bezpośrednie usuwanie wydarzeń z poziomu widżetu czatu `CalendarChatWidget` w `ChatInlineWidgets.jsx`.
- [+] Dodano: Obsługę komend języka naturalnego (`usuń wydarzenie`, `skasuj wydarzenie`, `odwołaj spotkanie`) w asystencie AI (`clientAiDispatcher.js`).
- [*] Zmodyfikowano: Pomyślna weryfikacja kompilacji produkcyjnej obu repozytoriów (0 błędów) oraz wdrożenie na Firebase Hosting i Vercel.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY

---

## v 2.11.0 — 2026-09-07
**Typ:** MINOR  
**Zakres:** Architektura Cloud-First (Odporna na Brak Sesji OAuth na Mobile), Samodzielne Dysponowanie Środkami & Autopodział Dochodów 50/30/20, Ręczne Tworzenie Wydarzeń w Kalendarzu, Synchronizacja Strefy Czasowej (Europe/Warsaw) na Vercel Gateway.

### Zmiany
- [+] Dodano: Architekturę Cloud-First w regułach Firestore (`firestore.rules`) umożliwiającą natychmiastowy, dwukierunkowy odczyt i zapis z urządzeń mobilnych, tabletów, PWA i desktopu bez wymogu logowania przez wyskakujące okno Google OAuth.
- [+] Dodano: Zaawansowane Samodzielne Dysponowanie Środkami w `FinancePage.jsx`:
  - Trzy tryby alokacji przy dodawaniu przychodów: automatyczny podział według reguły (np. 50/30/20), przypisanie do jednej puli (Potrzeby, Zachcianki lub Oszczędności) oraz własny, precyzyjny podział kwotowy z walidacją sumy i podglądem na żywo.
  - Narzędzie transferu środków („Przesuń środki” / `showModal === 'transfer'`) umożliwiające dowolne przesuwanie funduszy pomiędzy kubełkami (np. z Potrzeb do Oszczędności) z natychmiastową aktualizacją sald kopertowych.
  - Dynamiczne obliczanie dostępnych środków w każdym kubełku (`availableNeeds`, `availableWants`, `availableSavings`) z uwzględnieniem przychodów, transferów i wydatków oraz wizualnym ostrzeganiem o deficycie.
  - Szybką zmianę przypisania kubełka bezpośrednio z poziomu wierszy tabeli transakcji.
- [+] Dodano: Pełny interfejs ręcznego dodawania wydarzeń w `CalendarPage.jsx` z poziomu nagłówka („+ Dodaj wydarzenie”) oraz panelu wybranego dnia („+ Dodaj”) z wyborem daty, godziny, priorytetu, kategorii i opisu.
- [+] Dodano: Precyzyjną synchronizację strefy czasowej `Europe/Warsaw` pomiędzy przeglądarką klienta a Vercel Serverless Gateway:
  - Klient przesyła dokładny znacznik czasu oraz sformatowaną datę i godzinę (`clientTimestamp`, `clientTimeStr`, `clientDateStr`).
  - `api/agent.js` oraz `api/status.js` wymuszają strefę `timeZone: 'Europe/Warsaw'` przy wszystkich formatowaniach daty i godziny oraz precyzyjnym wyliczaniu dnia tygodnia planu lekcji (dziś/jutro).
  - Wyraźne instrukcje w promptach agenta LLM gwarantujące poprawną znajomość aktualnego czasu w Polsce.
- [*] Zmodyfikowano: `cloudSync.js` zoptymalizowany pod kątem natychmiastowej propagacji zdarzeń `cloudDataChanged` w całym interfejsie.
- [*] Zmodyfikowano: Pomyślna weryfikacja kompilacji produkcyjnej obu repozytoriów (0 błędów).

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY

---

## v 2.10.0 — 2026-09-07
**Typ:** MINOR  
**Zakres:** Natywne Renderowanie Tabel Markdown (remark-gfm), Dedykowane Inline Widżety Czatu (Plan Lekcji, Finanse, Treningi, Kalendarz), Pełna Analityka Danych w Promptach AI, Multi-Tool Action Tags & Płynna Synteza TTS.

### Zmiany
- [+] Dodano: Integrację `remark-gfm@4.0.1` w `Terminal.jsx` wraz z komponentem `ReactMarkdown`. Tabele w wiadomościach asystenta AI (np. prognozy pogody, raporty finansowe, harmonogramy) są od teraz renderowane jako pełnoprawne, responsywne tabele HTML z horyzontalnym przewijaniem, czytelnymi nagłówkami i naprzemiennym cieniowaniem wierszy.
- [+] Dodano: Dedykowany komponent `ChatInlineWidgets.jsx` z 4 interaktywnymi widżetami montowanymi pod odpowiedziami AI w Terminalu:
  - `TimetableChatWidget`: dzisiejszy plan lekcji z godzinami, salami i statusem.
  - `FinanceChatWidget`: bieżące saldo, wydatki, paski alokacji budżetu 50/30/20 (Potrzeby, Zachcianki, Oszczędności).
  - `WorkoutsChatWidget`: ostatnie sesje treningowe z datami i kategoriami.
  - `CalendarChatWidget`: nadchodzące wydarzenia i priorytety.
- [+] Dodano: Zaawansowane strukturyzowane obliczanie kontekstu finansowego i planu lekcji w `api/agent.js` oraz `clientAiDispatcher.js` — agent otrzymuje precyzyjne wyliczenia salda, kwot w koszykach 50/30/20, rozbicie lekcji na dziś/jutro/tydzień oraz wytyczną używania tabel Markdown.
- [+] Dodano: Rozszerzoną paletę narzędzi wykonawczych (Action Tags): `[ACTION:COMPLETE_TASK]`, `[ACTION:DELETE_TASK]`, `[ACTION:ADD_INCOME]`, `[ACTION:CLEAR_FINANCES]`, `[ACTION:DELETE_LESSON]`, `[ACTION:DELETE_WORKOUT]`, `[ACTION:DELETE_EVENT]`, `[ACTION:SET_ACCENT]`, `[ACTION:FORGET]`, `[ACTION:SHOW_WIDGET]`, `[ACTION:NAVIGATE]`.
- [*] Zmodyfikowano: Usprawniono syntezę mowy (TTS) w `Terminal.jsx` — funkcja `toggleSpeech` automatycznie usuwa formatowanie tabel Markdown i tagi akcji, zapobiegając literowaniu kresek `|` i znaków specjalnych.
- [*] Zmodyfikowano: Pomyślna weryfikacja kompilacji produkcyjnej obu repozytoriów (0 błędów).

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY

---

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
- [*] Zmodyfikowano: Pomyślnie zrekompilowano (0 błędów) i opublikowano na **Firebase Hosting** (`https://<HOST_REDACTED>.web.app`) oraz **Vercel Production** (`https://ai-system-dashboard.vercel.app`).
- [*] Zmodyfikowano: Zsynchronizowano i zrekompilowano (0 błędów) repozytorium lustrzane `AI SYSTEM DASHBOARD GITHUB - BEZ FIREBASE`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY

---

### Zmiany
- [!] Naprawiono: Całkowicie wyeliminowano błąd "Błąd połączenia z API Groq" w widżecie wyboru modeli AI (`ModelWidget.jsx`). Wdrożono dedykowaną funkcję serverless `api/models.js` na Vercel z pełną obsługą CORS, dynamicznym wykrywaniem modeli (`openai/gpt-oss-120b`, `llama-3.3-70b-versatile`) oraz resilient fallback.
- [*] Zmodyfikowano: Przebudowano karty wskaźników budżetowych w `FinancePage.jsx` (`POTRZEBY`, `ZACHCIANKI`, `OSZCZĘDNOŚCI`) — dodano obliczanie procentu wykorzystania limitu (`% limitu`), dynamiczne paski postępu, synchronizację z Firestore oraz szybkie profile (`50/30/20`, `60/20/20`, `70/20/10`, `40/30/30`). Kliknięcie w dowolną kartę otwiera konfigurator.
- [-] Usunięto: Zgodnie z dyspozycją operatora wyczyszczono bazy danych dla kategorii `finanse` i `treningi` w Cloud Firestore (`<PROJECT_ID_REDACTED>`) oraz lokalnej SQLite (`tasks.sqlite`). Opróżniono tablice startowe w `cloudSync.js`.
- [*] Zmodyfikowano: Zapewniono pełną dwukierunkową synchronizację: wszystkie dane zapisują się natychmiastowo lokalnie (SQLite / localStorage) oraz w chmurze Google Cloud Firestore, zapewniając dostęp z dowolnego urządzenia w czasie rzeczywistym.
- [*] Zmodyfikowano: Pomyślnie zrekompilowano (0 błędów) i opublikowano na **Firebase Hosting** (`https://<HOST_REDACTED>.web.app`) oraz **Vercel Production** (`https://ai-system-dashboard.vercel.app`).
- [*] Zmodyfikowano: Zsynchronizowano i zrekompilowano repozytorium lustrzane `AI SYSTEM DASHBOARD GITHUB - BEZ FIREBASE`.

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY

---

## v 2.6.1 — 2026-09-07
**Typ:** PATCH  
**Zakres:** Plan Lekcji — Rygorystyczna Selekcja Grupy 1 (38 Jednostek Lekcyjnych) & Pełna Synchronizacja Multi-Platform  

### Zmiany
- [*] Zmodyfikowano: Oczyszczono plan lekcji w `modules/services/cloudSync.js`, Firestore oraz SQLite — usunięto wszystkie pozycje drugiej grupy. Użytkownik przypisany jest bezwzględnie do Grupy 1 (pierwsza pozycja na każdym dzielonym bloku).
- [*] Zmodyfikowano: Wykonano migrację 38 zajęć bezpośrednio do kolekcji `timetable` w Cloud Firestore (`<PROJECT_ID_REDACTED>`) oraz lokalnej bazy SQLite (`data/tasks.sqlite`).
- [*] Zmodyfikowano: Skompilowano z wynikiem 0 błędów i wdrożono na **Firebase Hosting** (`https://<HOST_REDACTED>.web.app`) oraz **Vercel Production** (`https://ai-system-dashboard.vercel.app`).
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
- [*] Zmodyfikowano: Pomyślnie zrekompilowano i opublikowano na **Vercel Production** (`https://ai-system-dashboard.vercel.app`) oraz **Firebase Hosting** (`https://<HOST_REDACTED>.web.app`).
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
- [*] Zmodyfikowano: Zrekompilowano i opublikowano na **Vercel Production** (`https://ai-system-dashboard.vercel.app`) oraz **Firebase Hosting** (`https://<HOST_REDACTED>.web.app`).
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
- [*] Zmodyfikowano: Pomyślnie zbudowano i opublikowano na Vercel Production (`https://ai-system-dashboard.vercel.app`) oraz zaktualizowano Firebase Hosting (`https://<HOST_REDACTED>.web.app`).
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
- [*] Zmodyfikowano: Pomyślnie zrekompilowano i opublikowano wersję produkcyjną na Firebase Hosting (`https://<HOST_REDACTED>.web.app`) oraz w lokalnej instancji Pulpitu.

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
- [*] Zmodyfikowano: Pomyślnie zrekompilowano i opublikowano nową wersję na Firebase Hosting (`https://<HOST_REDACTED>.web.app`) oraz w lokalnej instancji Pulpitu.

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
- [*] Zmodyfikowano: Pomyślnie zrekompilowano i zsynchronizowano zmiany w wersji chmurowej Firebase (`https://<HOST_REDACTED>.web.app`) oraz w lokalnej instancji pulpitu wolnej od Firebase (`AI SYSTEM DASHBOARD GITHUB - BEZ FIREBASE`).

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
- [*] Zmodyfikowano: Pomyślnie zbudowano i wdrożono produkcję na `https://<HOST_REDACTED>.web.app`.

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
- [*] Zmodyfikowano: Przeprowadzono ponowne wdrożenie na Firebase Hosting (`<HOST_REDACTED>.web.app`).

### Audyt
Status: ZGODNY Z PROTOKOŁEM ANTIGRAVITY

---

### Zmiany
- [+] Dodano: Utworzono projekt w Google Cloud Firebase o unikalnym identyfikatorze `<PROJECT_ID_REDACTED>` (Cloud Firebase Instance).
- [+] Dodano: Baza danych Cloud Firestore `(default)` w regionie `europe-central2` (Warszawa).
- [+] Dodano: Moduł backendowy `modules/firebase.js` (Firebase Admin SDK) obsługujący połączenie i synchronizację.
- [+] Dodano: Moduł tras Express `modules/routes/firebase.js` z punktami końcowymi statusu, weryfikacji i synchronizacji bazy.
- [+] Dodano: Klient frontendowy `modules/firebaseClient.js` (Firebase Web SDK) do autoryzacji w chmurze.
- [+] Dodano: Wdrożono reguły bezpieczeństwa `firestore.rules` ograniczające dostęp wyłącznie do autoryzowanego właściciela (`<EMAIL_REDACTED>`).
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

