## Wersja Bieżąca
**v1.10.0**

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
