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

## 3. HISTORIA ZMIAN REJESTRU
- **2026-11-02:** Dodano zadania `TASK-PB-01` (Dwukierunkowy czat AI Pushbullet) oraz `TASK-PB-02` (Proaktywne przypomnienia 3h przed snem) do rejestru sprintu `v4.1.0`.
