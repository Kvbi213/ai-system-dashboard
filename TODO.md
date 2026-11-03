# OMNIDASH REBORN :: REJESTR ZADAŃ (TODO.md)
> Ścieżka systemowa: `OmniDash/TODO.md`  
> Wersja bazowa: `v4.0.0` (OmniDash Reborn)  
> Zgodność: Protokół Antigravity v4.0 (Deterministic Edition)  
> Status: AKTYWNY REJESTR STRATEGICZNY

---

## 1. STRATEGICZNE ZADANIA ROZWOJOWE (SPRINT ROADMAP)

| ID | Moduł | Zadanie Operacyjne | Priorytet | Wersja Docelowa | Status |
|---|---|---|---|---|---|
| `TASK-PB-01` | `apps/worker` + `apps/api` | Dwukierunkowy most czatu AI przez oficjalną aplikację Pushbullet | `[*] WYSOKI` | `v4.1.0` | `[~] ZAPLANOWANE` |
| `TASK-PB-02` | `apps/worker` (Cron) | Proaktywny asystent zdrowotny: AI przypomnienie o posiłku 3h przed snem | `[*] WYSOKI` | `v4.1.0` | `[~] ZAPLANOWANE` |
| `TASK-PB-03` | `apps/worker` (Cron) | Deterministyczny dispatch Pushbullet: powiadomienie o ukończeniu i następnym punkcie planu (szkoła/praca/prywatne) | `[*] WYSOKI` | `v4.1.0` | `[~] ZAPLANOWANE` |
| `TASK-AUTH-01` | `apps/api` + `apps/web` | Firebase Multi-Auth (Google OAuth, E-mail Magic Link, SMS OTP) | `[!] KRYTYCZNY` | `v4.2.0` | `[~] ZAPLANOWANE` |
| `TASK-JARVIS-01` | `apps/api` | Hybrydowy silnik LLM (Ollama Local-First + Groq LPU Fallback) | `[*] WYSOKI` | `v4.3.0` | `[~] ZAPLANOWANE` |

---

## 2. SZCZEGÓŁOWA SPECYFIKACJA NOWYCH FUNKCJONALNOŚCI

### [*] TASK-PB-01: Dwukierunkowy Most Konwersacyjny Pushbullet (Bidirectional Pushbullet Chat Bridge)
- **Cel:** Umożliwienie bezpośredniej, dwustronnej konwersacji z asystentem AI z aplikacji Pushbullet na smartfonie/komputerze bez konieczności otwierania dashboardu w przeglądarce.
- **Architektura Przepływu Danych:**
  1. Operator wysyła wiadomość w aplikacji mobilnej lub desktopowej Pushbullet (zwykły push, notatka tekstowa lub odpowiedź na wątek).
  2. Proces roboczy `apps/worker` (`PushbulletListener`) podłączony do WebSocket `wss://stream.pushbullet.com/websocket/` natychmiast rejestruje zdarzenie `tickle` lub ephemeral push.
  3. Treść wiadomości jest weryfikowana pod kątem deduplikacji i przekazywana do bramy `apps/api` (`POST /api/ai/chat`), uwzględniając kontekst pamięci operacyjnej operatora.
  4. Model wnioskowania na Groq LPU (`openai/gpt-oss-120b`) generuje odpowiedź asystenta.
  5. `apps/worker` odsyła zwrotne powiadomienie Pushbullet przez REST API (`POST https://api.pushbullet.com/v2/pushes`) bezpośrednio na urządzenie operatora.
- **Kryteria Akceptacji (DoD):**
  - [ ] Wysłanie wiadomości z aplikacji Pushbullet generuje odpowiedź AI w czasie rzeczywistym.
  - [ ] Bezpieczna obsługa zerwania połączenia WebSocket z automatycznym mechanizmem reconnectu.

---

### [*] TASK-PB-02: Proaktywny Asystent AI i Przypomnienia Dobowe (Posiłek 3h przed snem)
- **Cel:** Wdrożenie proaktywnych, autonomicznych przypomnień generowanych dynamicznie przez AI o określonych porach dnia w oparciu o rytm biologiczny operatora.
- **Architektura Przepływu Danych:**
  1. Moduł `apps/worker/src/cron/scheduler.ts` utrzymuje pętlę harmonogramu dobowego.
  2. Na podstawie profilu zdrowotnego i planowanej godziny snu (`target_bedtime`, np. 23:00) system oblicza godzinę wyzwolenia reguły żywieniowej (np. 20:00 — 3 godziny przed snem).
  3. O wyznaczonej godzinie worker wywołuje zapytanie do silnika AI z promptem instruującym o sformułowaniu zwięzłego, motywującego i spersonalizowanego przypomnienia o spożyciu ostatniego posiłku w celu ochrony cyklu trawiennego, regeneracji wątroby i jakości fazy REM.
  4. Wygenerowany komunikat jest wysyłany asynchronicznie przez Pushbullet na smartfon.
  5. Konfiguracja godziny snu i preferencji żywieniowych dostępna w panelu `/settings` oraz `/private`.
- **Kryteria Akceptacji (DoD):**
  - [ ] Automatyczne, niezawodne wysłanie powiadomienia o zdefiniowanej porze bez konieczności interakcji ze strony użytkownika.
  - [ ] Precyzyjny dobór tonu wypowiedzi asystenta (profesjonalny, wspierający, bez zbędnych ozdobników).

---

### [*] TASK-PB-03: Deterministyczny Dispatcher Zdarzeń Dnia przez Pushbullet (Zero-LLM Fast Notification)
- **Cel:** Natychmiastowe wysyłanie precyzyjnych powiadomień Pushbullet na smartfon po ukończeniu bieżącego punktu planu (lekcja szkolna, blok pracy, aktywność prywatna), informujących o godzinie zakończenia oraz szczegółach kolejnego zadania — bez kosztownego i zbędnego odpytywania modelu AI (czyste zapytanie bazodanowe i formatowanie szablonowe).
- **Logika Deterministyczna i Priorytetowanie Czasowe:**
  1. **Detekcja Zdarzenia Kończącego:** Worker w `apps/worker` monitoruje zakończenie aktywnego punktu w planie dnia (np. upływ godziny lekcyjnej z planu Librus/szkoła lub zakończenie slotu z harmonogramu prywatnego).
  2. **Agregacja i Analiza Najbliższego Horyzontu (Min-Distance Scheduler):**
     - System równolegle odpytuje bazę SQLite / REST API o najbliższe nadchodzące zdarzenia z obu kategorii:
       - Kategoria A: Plan Szkolny / Praca (`timetable` / `school_events` / `work_tasks`).
       - Kategoria B: Plan Osobisty / Prywatny (`private_events` / `personal_routine` / `habits`).
     - Algorytm porównuje znaczniki czasowe (`start_time`) i wybiera zdarzenie, które jest bezwzględnie najbliższe w czasie (`min(delta_school, delta_private)`).
  3. **Szablon Wiadomości (Zero-LLM Cost):**
     - Sformatowanie zwartego komunikatu z podstawionymi zmiennymi:
       `[+] Zakończono: [Nazwa_Zadania] o [HH:MM].`
       `[>] Następnie: [Nazwa_Kolejnego_Zadania] ([KATEGORIA: SZKOŁA / PRYWATNE / PRACA])`
       `[~] Czas: [HH:MM] - [HH:MM] | Lokalizacja / Sala: [Miejsce_Lub_Sala]`
       `[*] Odstęp: za [X] min.`
  4. **Ekspresowa Wysyłka:** Wysłanie powiadomienia push w <200ms przez Pushbullet API (`POST https://api.pushbullet.com/v2/pushes`). Zero zużycia tokenów LLM, stuprocentowa niezawodność i determinizm.
- **Kryteria Akceptacji (DoD):**
  - [ ] Prawidłowe wykrycie i powiadomienie dokładnie w minucie zakończenia bloku czasowego.
  - [ ] Poprawne wyłonienie najbliższego punktu niezależnie od tego, czy pochodzi z terminarza szkolnego czy prywatnego.
  - [ ] Wskazanie kategorii (prywatne vs szkolne/praca), dokładnego miejsca/sali oraz czasu do rozpoczęcia.
  - [ ] Całkowity brak wywołań LLM (działanie wyłącznie w oparciu o czystą logikę TypeScript / SQLite).

---

## 3. HISTORIA ZMIAN REJESTRU
- **2026-11-02:** Dodano zadania `TASK-PB-01` (Dwukierunkowy czat AI Pushbullet) oraz `TASK-PB-02` (Proaktywne przypomnienia 3h przed snem) do rejestru sprintu `v4.1.0`.
- **2026-11-03:** Dodano zadanie `TASK-PB-03` (Deterministyczny dispatcher powiadomień Pushbullet o zakończeniu i następnym punkcie planu: prywatne vs szkoła/praca bez LLM).
