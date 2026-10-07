# OMNIDASH :: MASTER SYSTEM DOCUMENTATION & OPERATIONAL DOSSIER
**Dokument Nadrzędny: Kompendium Architektury, Ewolucji, Bezpieczeństwa i Wdrożeń Systemu OmniDash**

- **Identyfikator Wersji:** `v2.30.0`
- **Data Ostatniej Aktualizacji:** Październik 2026
- **Status Operacyjny:** PRODUKCJA | ENTERPRISE-GRADE (221/221 PASS, 17 Pakietów Testowych)
- **Repozytorium Źródłowe:** `https://github.com/Kvbi213/ai-system-dashboard`
- **Instancja Chmurowa (Hosting):** `https://void-potato-7721.web.app`
- **Region Danych Cloud Firestore:** `europe-central2` (Warszawa, Polska)
- **Brama Serwerless:** `https://ai-system-dashboard.vercel.app`
- **Standard Inżynieryjny:** Protokół Antigravity (NANO v3.2) | Zero-Emoji Policy | Zero-Trust Architecture

---

## 1. WPROWADZENIE I DEKLARACJA MISJI SYSTEMU

**OmniDash** to prywatny, wielochmurowy ekosystem operacyjny łączący funkcje asystenta osobistego sztucznej inteligencji, huba telemetrycznego, autonomicznego strażnika finansów, monitoringu drogowego, analizy wywiadowczej OSINT oraz dwukierunkowej synchronizacji z urządzeniami mobilnymi operatora.

System został zaprojektowany z myślą o suwerenności danych, odporności na awarie sieciowe (Offline-First / Cloud-First) oraz deterministycznym bezpieczeństwie wykonawczym (Policy Engine & Least Privilege).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            EKOSYSTEM OMNIDASH                               │
│                                                                             │
│  [ Operator Desktop / Mobile ] ───► [ Cloud Hosting / Firebase 12 ]         │
│               │                                   │                         │
│               ▼                                   ▼                         │
│  [ Node.js Express 4.19 Core ]      [ Cloud Firestore europe-central2 ]     │
│  ├── SQLite 5.1 (Lokalny WAL)                     │                         │
│  ├── Autonomous OmniDaemon 24/7                   ▼                         │
│  ├── Brave Search Quota Guard       [ Vercel Edge Serverless Gateway ]      │
│  └── Traffic & CANARD Engine                      │                         │
│               │                                   ▼                         │
│               ▼                     [ Pushbullet Mobile Gateway & PubSub ]  │
│  [ Policy Engine Zero-Trust ] ───► [ Google Cloud Identity / Anonymous ]    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. CHRONOLOGICZNA EWOLUCJA SYSTEMU (v1.0.0 – v2.30.0)

Ewolucja OmniDash obejmuje ponad 120 wydań i commitów zorganizowanych w logiczne kamienie milowe. Poniższa tabela przedstawia kluczowe etapy rozwoju architektury:

| Seria / Wersja | Zakres Inżynieryjny | Kluczowe Zmiany i Osiągnięcia |
|---|---|---|
| **v1.0.0 – v1.4.0** | Fundamenty Monolitu | Wstępny dashboard React + Express, lokalna baza SQLite, moduł zadań To-Do, pogoda Open-Meteo, stylistyka Dark-Cyber. |
| **v2.0.0 – v2.5.0** | Refaktoryzacja Modułowa | Rozbicie monolitu na `/modules/`, `/modules/routes/`, `/modules/services/`. Wdrożenie Server-Sent Events (SSE) `/api/system/stream`, integracja pamięci długoterminowej Operator Brain. |
| **v2.6.0 – v2.10.0** | Integracje Zewnętrzne | Implementacja scrapera Librus Synergia (oceny, plan lekcji), obsługa strumienia Pushbullet WebSocket dla powiadomień bankowych, algorytm kopertowy 50/30/20 (`budgetCalculator.js`), moduł nawigacyjny Janosik/CANARD. |
| **v2.11.0 – v2.20.0** | Węzeł Chmurowy i Wielojęzyczność | Wdrożenie bramy Vercel Serverless Gateway, integracja i18n (PL, EN, UK, ZH), Toast Hub, klasyfikator intencji badawczej Deep Research, autonomiczny pętlowy agent ciągły (OmniDaemon 24/7). |
| **v2.21.0 – v2.27.0** | Ekosystem Multimodalny | Wdrożenie motywów kolorystycznych (Retro, Matrix, Nordic, Paper Light, Synthwave), Cloud Billing Pub/Sub Budget Guard (`budget-auto-stop`), silniki mowy Edge TTS i ElevenLabs, router OSINT. |
| **v2.28.0 – v2.28.1** | Audyt i Zero-Trust Hardening | Całkowite zamknięcie reguł `firestore.rules` (wymóg `isAuthenticated()`, izolacja `system_budget`), stałoczasowa autoryzacja `crypto.timingSafeEqual`, tarcza sekretów w `fs_explorer.js` (blokada `.env`), tarcza SSRF. Pakiet testów: 202/202 PASS. |
| **v2.29.0** | Golden Dataset & Architektura Bezpieczeństwa | Eliminacja defektu wagi 0 w kalkulacjach średniej Librus, wdrożenie Golden Dataset (`tests/fixtures/librus/grades_golden.json`), tarcza SSRF IPv6 ULA/Link-Local, publikacja `AI_PERMISSIONS_AND_SECURITY.md`. Pakiet testów: 212/212 PASS. |
| **v2.30.0** | Strażnik Limitów Brave Search & Live Sync | Wyeliminowanie agresywnego interwału 2-minutowego; wdrożenie harmonogramu slotowego (10:00, 15:00, 20:00), ładowanie kategorii on-demand, dwupoziomowy bufor serwer/klient, synchronizacja ocen Librus do Firestore (śr. 4.61), 221/221 PASS. |

---

## 3. ARCHITEKTURA SYSTEMU I GŁÓWNE KOMPONENTY

### 3.1. Rdzeń Serwera (`core.server.js`)
Główny punkt wejścia środowiska stacji roboczej Node.js (Express 4.19). Odpowiada za:
- **Ścisłe Ograniczenie CORS:** Whitelista domen produkcyjnych (`https://void-potato-7721.web.app`, `https://void-potato-7721.firebaseapp.com`, `https://ai-system-dashboard.vercel.app`) oraz dozwolonych portów localhost (`3000`, `5000`, `5173`).
- **Ograniczniki Ruchu (Rate Limiting):**
  - Globalny: 250 zapytań na 15 minut na IP.
  - Moduł AI (`/api/agent`): 40 wywołań na 15 minut.
  - Wywiad OSINT (`/api/osint`): 30 zapytań na 15 minut.
- **Middleware Bezpieczeństwa:** `helmet`, sanityzacja JSON do 15 MB, nagłówki bezpieczeństwa X-Content-Type-Options, X-Frame-Options.

### 3.2. Baza Danych i Warstwa Danych (Dual-Store Architecture)
- **Lokalna Baza SQLite (`modules/database.js`):**
  - Plik: `data/system_dashboard.db` z aktywnym trybem WAL (Write-Ahead Logging).
  - Tabele: `tasks` (zadania To-Do z regułami cyklicznymi), `timetable` (plan lekcji), `finance_records` (transakcje i alokacje kopertowe), `workouts` (rejestr ćwiczeń), `phone_notifications` (zrzut ze smartfona), `system_logs` (audyt bezpieczeństwa i pogoda).
- **Chmura Cloud Firestore (`modules/firebase.js` & `modules/firebaseClient.js`):**
  - Prywatny projekt produkcyjny: `void-potato-7721`.
  - Replikacja dwukierunkowa ze wsparciem pracy offline (Offline Persistence).
  - Autoryzacja klientów przez Firebase Anonymous Auth zintegrowana w Google Cloud Identity Platform.

### 3.3. Kognitywny Silnik AI i OmniDaemon 24/7 (`modules/agent.js`, `autonomousAgent.js`)
- Model główny: `openai/gpt-oss-120b` za pośrednictwem Groq SDK (błyskawiczna inferencja).
- **Zestaw Narzędzi (Tool Calling):**
  - `ADD_TO_DO` / `UPDATE_TO_DO` / `DELETE_TO_DO` – zarządzanie zadaniami z blokadą operacji masowych.
  - `ADD_FINANCE_RECORD` / `TRANSFER_FUNDS` / `DELETE_FINANCE_RECORD` – operacje księgowe.
  - `WEB_SEARCH` – wyszukiwanie w internecie za pośrednictwem zoptymalizowanej bramy `/api/news`.
  - `SEND_PUSH` – asynchroniczne wysyłanie alertów i powiadomień na smartfon operatora.
  - `fs_read_file` – odczyt plików projektowych z bezwzględną blokadą sekretów i ucieczki poza katalog.
- **OmniDaemon 24/7:** Autonomiczny agent pracujący w tle, wykonujący kroki decyzyjne co 30 sekund w oparciu o kolejkę celów i priorytetów.

### 3.4. Dziennik Elektroniczny Librus Synergia (`modules/services/librusService.js`)
- Bezpieczny, bezgłowy klient autoryzacyjny do portalu Librus.
- Precyzyjny parser ocen eliminujący błędy wag zerowych (waga 0 jako ocena diagnostyczna nie zafałszowuje średniej).
- Wzorcowy zbiór testowy (`tests/fixtures/librus/grades_golden.json`) gwarantujący niezmienność logiki matematycznej.
- Automatyczna replikacja stanu ocen i planu lekcji do Cloud Firestore (`librus_cache/latest`).

### 3.5. Strażnik Limitów Wyszukiwarki Brave Search (`modules/components/ITNewsTicker.jsx`, `api/news.js`)
- Zastąpienie agresywnego interwału (2 minuty) modelem dobowych slotów czasowych:
  - **10:00** (10:00:00 – 14:59:59)
  - **15:00** (15:00:00 – 19:59:59)
  - **20:00** (20:00:00 – 09:59:59)
- Automatyczne pobieranie w tle **wyłącznie dla pierwszej kategorii** na dashboardzie (`AI & LLM`).
- Pozostałe kategorie (`CyberSec`, `Startupy`, `Cloud`, `Dev`, etc.) pobierane wyłącznie na żądanie po kliknięciu użytkownika.
- Klient buforuje wyniki w `localStorage`, a serwery (Vercel Edge i Node.js Express) w pamięci RAM (`TTL 1h`), drastycznie redukując zużycie limitu darmowego API.

### 3.6. Wywiad Drogowy i Bezpieczeństwo Trasy (`modules/services/trafficService.js`)
- Integracja z bazą fotoradarów, kamer RedLight oraz Odcinkowych Pomiarów Prędkości (CANARD / GITD) na trasie Trójmiasto – Starogard Gdański.
- Monitoring alertów utrudnień drogowych GDDKiA w promieniu 10 km od współrzędnych operatora.
- Wyznaczanie tras z analizą punktów kontroli prędkości przez OSRM.

### 3.7. Silnik Syntezy Mowy (TTS Hub) (`modules/services/ttsService.js`)
- Obsługa silników: Google Cloud Neural WaveNet (`pl-PL-Wavenet-B`), Edge TTS (`pl-PL-MarekNeural`), ElevenLabs oraz Web Speech API.
- Wbudowany strażnik limitu darmowego pakietu Google Cloud (do 1 000 000 znaków/miesiąc) zapobiegający naliczeniu opłat na koncie bilingowym GCP.

---

## 4. BEZPIECZEŃSTWO, ZERO-TRUST I POLICY ENGINE

### 4.1. Deterministyczny Policy Engine
Żadne wywołanie narzędzia wygenerowane przez LLM nie trafia bezpośrednio do systemu operacyjnego:

```
[ Model LLM ] ──► [ POLICY ENGINE ] ──► Decyzja:
                     ├── CRITICAL: [X] Twarda odmowa (np. próba odczytu .env)
                     ├── HIGH:     [!] Wymóg confirmed: true (np. masowe usunięcie To-Do)
                     ├── MEDIUM:   [*] Walidacja typów/koszyków (np. transfer finansowy)
                     └── LOW:      [OK] Wykonanie bezpieczne (np. odczyt zadań)
```

### 4.2. Jawne Granice Uprawnień Agenta AI

| Zasób Systemowy | Uprawnienie AI | Mechanizm Egzekwujący |
|---|---|---|
| **Pliki środowiskowe (`.env`, `.env.*`)** | **BEZWZGLĘDNA BLOKADA** | Regex `SENSITIVE_FILES_REGEX` w `fs_explorer.js` |
| **Klucze Firebase (`firebase-service-account.json`)** | **BEZWZGLĘDNA BLOKADA** | Czarna lista plików wrażliwych |
| **Powłoka systemowa (sh, bash, cmd, powershell)** | **BRAK INTERFEJSU** | Usunięto moduł `exec` z narzędzi agenta |
| **Pliki OS poza projektem** | **BEZWZGLĘDNA BLOKADA** | Path Traversal Shield (weryfikacja `path.resolve`) |
| **Adresy prywatne LAN i chmurowe (SSRF)** | **BEZWZGLĘDNA BLOKADA** | Filtr RFC 1918, 169.254.169.254, IPv6 ULA w `osint.js` |
| **Modyfikacja reguł Firebase** | **BRAK MOŻLIWOŚCI** | Reguły wdrażane wyłącznie przez CLI/CI/CD operatora |
| **Baza SQLite i Cloud Firestore** | **KONTROLOWANY ZAPIS/ODCZYT** | Wyłącznie przez parametryzowane funkcje i reguły Firestore |

### 4.3. Reguły Cloud Firestore (`firestore.rules`)
- Bezwzględny wymóg `request.auth != null` dla wszystkich kolekcji operacyjnych.
- Zablokowanie publicznego odczytu i zapisu kolekcji wrażliwych (`system_budget`, `settings/librus_credentials` podlegają regule `isOwner()`).
- Zabezpieczenie przed atakami czasowymi w autoryzacji wewnętrznej za pomocą `crypto.timingSafeEqual` w nagłówkach `x-system-pin` oraz `x-internal-key`.

---

## 5. REJESTR TESTÓW I ZAPEWNIENIE JAKOŚCI (221/221 PASS)

System posiada 100% pokrycie kluczowych modułów w środowisku testowym Vitest. Wszystkie 17 pakietów testowych wykonuje się asynchronicznie i bezbłędnie:

```
Test Files  17 passed (17)
Tests       221 passed (221)
```

### Szczegółowa Macierz Pakietów Testowych:

1. `tests/news_ticker_quota.test.jsx` (9 testów) – Weryfikacja harmonogramu slotów 10:00, 15:00, 20:00, buforowania `localStorage`, odporności na awarie JSON, blokady zapytania sieciowego przy trafieniu w cache oraz wymuszenia manualnego.
2. `tests/librus_golden.test.js` (6 testów) – Testy warstwowe kalkulacji ocen na zbiorze wzorcowym (`grades_golden.json`), ochrona wagi 0 przed zaburzeniem średniej, modyfikatory `+` i `-`.
3. `tests/librus.test.js` (30 testów) – Testy parsera ocen Librus Synergia, planu lekcji, terminarza i obsługi sesji.
4. `tests/security_audit.test.js` (16 testów) – Testy Zero-Trust: odrzucenie `.env`, blokada path traversal, segregacja poświadczeń, stałoczasowa weryfikacja PIN, macierz adresów SSRF (IPv4/IPv6).
5. `tests/autonomous_agent.test.js` (18 testów) – Testy klasyfikatorów agenta 24/7, pętli celów OmniDaemon, transformacji zapytań mobilnych Pushbullet.
6. `tests/pushbullet_finance.test.js` (44 testy) – Testy parsera SMS-ów bankowych, deduplikacji powiadomień w oknie 60s, kategoryzacji wydatków 50/30/20.
7. `tests/traffic.test.js` (16 testów) – Testy wywiadu drogowego Janosik/CANARD, wyszukiwanie fotoradarów w promieniu 10 km, wyznaczanie tras OSRM.
8. `tests/gcp_budget.test.js` (8 testów) – Testy integracji Cloud Billing i Pub/Sub `budget-auto-stop`, symulacja alertów 50%, 90% i 100%.
9. `tests/budget.test.js` (15 testów) – Testy algorytmu alokacji kopertowej `budgetCalculator.js`, transfery między koszykami, alokacje z koszykami 0%.
10. `tests/tts_quota.test.js` (10 testów) – Testy silników mowy Google Cloud Neural, Edge TTS, limitera znaków i rozgłaszania zdarzeń wyczerpania limitu.
11. `tests/wakeword.test.js` (17 testów) – Testy detekcji słowa wybudzającego (Hotword Detection), sanityzacja tekstu dla syntezatorów TTS.
12. `tests/components.test.jsx` (7 testów) – Testy renderowania komponentów React (`ToastContainer`, `ExportModal`, `SystemMonitor`, `Sidebar`).
13. `tests/agent_execution_trace.test.jsx` (8 testów) – Testy wizualizacji śladu wykonania narzędzi agenta i stanów ładowania.
14. `tests/time.test.js` (6 testów) – Testy strefy czasowej `Europe/Warsaw`, formatowania dat, obsługi czasu letniego/zimowego.
15. `tests/osint.test.js` (5 testów) – Testy klasyfikatora zapytań wywiadowczych i tarczy blokowania skanowania sieci wewnętrznych.
16. `tests/export.test.js` (4 testy) – Testy generatora raportów CSV zgodnego z RFC 4180 oraz druku PDF.
17. `tests/cloudSync.test.js` (2 testy) – Testy rejestru synchronizacji chmurowej i flag środowiskowych.

---

## 6. INSTRUKCJA OPERACYJNA I PROCEDURY WDROŻENIOWE

### 6.1. Zmienne Środowiskowe (`.env.example`)
Projekt wymaga zdefiniowania następujących kluczowych zmiennych w pliku `.env` (plik objęty blokadą i wpisany do `.gitignore`):
- `GROQ_API_KEY` – klucz inferencji modelu LLM GPT-120B.
- `BRAVE_SEARCH_API_KEY` – token zapytań wyszukiwarki internetowej Brave Search.
- `FIREBASE_PROJECT_ID` – identyfikator projektu produkcyjnego (`void-potato-7721`).
- `FIREBASE_SERVICE_ACCOUNT_PATH` – ścieżka do poświadczeń konta usługi (`firebase-service-account.json`).
- `DASHBOARD_PIN` – PIN autoryzacyjny operatora (`x-system-pin`).
- `INTERNAL_SERVICE_KEY` – klucz komunikacji maszynowej (`x-internal-key`).
- `PUSHBULLET_API_KEY` – token API do komunikacji ze smartfonem.
- `GOOGLE_TTS_API_KEY` – klucz dostępu do Google Cloud Text-to-Speech API.
- `LIBRUS_USER` / `LIBRUS_PASS` – poświadczenia dziennika Librus Synergia.

### 6.2. Procedura Budowania i Wdrażania Produkcyjnego

```bash
# 1. Weryfikacja jakościowa kodu i wykonanie wszystkich 221 testów
npm test

# 2. Kompilacja zoptymalizowanego pakietu produkcyjnego frontendu
npm run build

# 3. Wdrożenie do globalnej sieci CDN Firebase Hosting
node scripts/deploy_hosting.js
```

### 6.3. Uruchomienie Środowiska Deweloperskiego Lokalnego

```bash
# Równoległe uruchomienie backendu Express (port 5000) i klienta Vite (port 5173/3000)
npm start
```

---

## 7. PODSUMOWANIE STANU SYSTEMU (STATUS DASHBOARD)

| Obszar Operacyjny | Wskaźnik | Stan |
|---|---|---|
| **Stabilność Architektury** | Test Suite Vitest | [+] 221/221 PASS (100% Zaliczone) |
| **Bezpieczeństwo Danych** | Zero-Trust & Sandboxing | [+] ZALICZONE (Brak dostępu do .env, blokada powłoki, tarcza SSRF) |
| **Optymalizacja Kosztów** | Brave Search API Quota | [+] ZALICZONE (Maks. 3 auto/doba: 10/15/20 + on-demand + bufor RAM/Storage) |
| **Integralność Danych Szkolnych** | Librus Synergia Sync | [+] ZALICZONE (21 przedmiotów, 12 ze średnią, śr. ogólna 4.61 w Firestore) |
| **Dostępność Chmurowa** | Firebase Hosting & CDN | [+] ONLINE (`https://void-potato-7721.web.app`) |
| **Zgodność z Protokołem** | Protokół Antigravity | [+] ZGODNE (Zero-Emoji, SemVer 2.30.0, Pełna Dokumentacja) |
