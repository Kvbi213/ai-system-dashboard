# REJESTR ZADAŃ, ROADMAP & DŁUG TECHNICZNY (TODO MATRIX V3.0)
> Dokument Nadrzędny Backlogu Inżynieryjnego Ekosystemu OmniDash.

- **Wersja Bazowa:** `v2.34.2`
- **Data Aktualizacji:** Październik 2026
- **Status Operacyjny:** `[+] DOKUMENTACJA ZSYNCHRONIZOWANA`
- **Standard Inżynieryjny:** Protokół Antigravity (NANO v3.2) | Zero-Emoji Policy | Zero-Trust Architecture
- **Obsidian Sync:** `C:\Users\Jakub Lis\Documents\OBSIDIAN\PROJEKTY\OmniDash_AI_Dashboard\08_Roadmap_i_Backlog_TODO.md`

---

## 1. STRUKTURA I HIERARCHIA PRIORYTETÓW BACKLOGU

Rejestr zadań dzieli się na trzy twarde kategorie priorytetów inżynieryjnych:
1. `[!] KRYTYCZNY (P0)` – Zadania blokujące rozwój platformy, transformacje architektoniczne i fundamenty bezpieczeństwa/UX.
2. `[*] WYSOKI (P1)` – Nowe moduły operacyjne, rozszerzenia integracji zewnętrznych oraz automatyzacje.
3. `[~] ŚREDNI / NISKI (P2/P3)` – Optymalizacje wydajnościowe, refaktoryzacje czyszczące i ulepszenia wizualne.

---

## 2. GŁÓWNE ZADANIA STRATEGICZNE (ROADMAP WYKONAWCZY)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ROADMAP ROZWOJU SYSTEMU OMNIDASH                      │
│                                                                             │
│  [ TASK-01: GUI REDESIGN v3.0 ] ──► [ TASK-02: USER ACCOUNTS & AUTH ]       │
│  ├── Mobile-First Architecture      ├── Multi-Provider Firebase Auth        │
│  ├── Unified Design Tokens          │   ├── Google Sign-In (OAuth)          │
│  ├── Eliminacja Scroll-Jackingu     │   ├── Email & Password / Magic Link   │
│  ├── Bottom-Sheets & Navigation     │   └── Phone SMS OTP (Recaptcha)       │
│  └── Interaktywny FBW Tracker       ├── Firestore Multi-Tenant Schema       │
│                                     └── Firebase Extensions & GCP Cloud IAM │
│                                                                             │
│  [ TASK-03: IOT & SMART ACCESS ] ──► [ TASK-05: OPENJARVIS AGENT STACK ]    │
│  ├── ESP32 / MQTT Mosquitto         ├── Local-First Offline (Ollama / Rust) │
│  └── Dynamiczne OTP / QR            ├── Morning Digest (TTS Briefing 06:00) │
│                                     ├── Deep Research & Continuous Operative│
│  [ TASK-04: ENTERPRISE CLOUD EXT ]  └── agentskills.io (~13k+ skilli)       │
│  ├── Image Resizer & Email Trigger                                          │
│  └── RODO/GDPR Auto-Purge                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### [!] TASK-01: Kompleksowy Redesign GUI & Architektura Mobile-First (v3.0)
- **Priorytet:** `[!] KRYTYCZNY (P0)`
- **Stan:** `[~] W TOKU (Oczekiwanie na zatwierdzenie wytycznych estetycznych)`
- **Specyfikacja Źródłowa:** [`docs/architecture/MASTER_GUI_REDESIGN_DOCUMENT.md`](MASTER_GUI_REDESIGN_DOCUMENT.md)
- **Zakres Wykonawczy:**
  1. **Eliminacja Anomalii Mobilnych:**
     - Usunięcie konfliktu podwójnego paddingu dolnego (`pb-20 md:pb-0` w `core.client.jsx` vs `pb-24` w podstronach).
     - Likwidacja zagnieżdżonego Scroll-Jackingu (`overflow-y-auto max-h-[700px]`) blokującego przewijanie dotykowe na iOS i Androidzie.
     - Przebudowa kontenera widoku z sztywnego `100dvh` na elastyczny `fixed inset-0` ze zmiennymi bezpiecznych stref (`env(safe-area-inset-top)` i `env(safe-area-inset-bottom)`).
     - Zagwarantowanie stref trafień (Touch Targets) minimum 44×44px dla wszystkich przycisków i kontrolek.
  2. **Unifikacja Stylistyczna Podstron:**
     - Wdrożenie semantycznych Design Tokens w `assets/styles/index.css` oraz `tailwind.config.js` (poziomy elewacji, tła kart, delikatne krawędzie).
     - Stworzenie zestawu ustandaryzowanych komponentów bazowych w `modules/components/ui/` (`PageHeader`, `MetricCard`, `SegmentedControl`, `AdaptiveModal`, `TouchCard`).
  3. **Re-architektura Modułu Treningów (`WorkoutsPage.jsx`):**
     - Zastąpienie surowego bloku tekstu Markdown interaktywnym **Rejestratorem FBW na Strych** (6 ćwiczeń: Podciąganie na drążku, Dipy/Pompki, Wiosłowanie hantlem, OHP, Goblet Squat, Wznosy kolan w wiszeniu).
     - Wdrożenie stepperów powtórzeń (8-12), rejestracji ciężaru/gumy, odznaczania serii roboczych oraz pływającego stopera przerw (90s / 120s).
  4. **Adaptacyjny System Okien Modalnych (Adaptive Bottom-Sheets):**
     - Na ekranach mobilnych (`< 768px`) wszystkie dotychczasowe okna modalne automatycznie przekształcane w wysuwane szuflady dolne (Bottom Sheets) z uchwytem i gestem przeciągnięcia w dół (swipe-to-dismiss).

---

### [!] TASK-02: Wielometodowy System Kont Użytkowników & Zaawansowana Autoryzacja Firebase / GCP
- **Priorytet:** `[!] KRYTYCZNY (P0)`
- **Stan:** `[~] ZAPLANOWANE (Do wdrożenia w ślad za GUI Redesign)`
- **Zakres Wykonawczy:**
  1. **Warstwa Danych Firestore (Multi-Tenant & User-Scoped Architecture):**
     - Przejście z modelu pojedynczego właściciela (`single-owner`) na model relacyjny lub subkolekcje:
       - Kolekcja główna kont: `users/{uid}` przechowująca profil:
         ```json
         {
           "uid": "string",
           "displayName": "string",
           "email": "string",
           "phoneNumber": "string",
           "photoURL": "string",
           "role": "admin | operator | member | guest",
           "preferences": {
             "theme": "dark",
             "language": "pl",
             "notificationsEnabled": true,
             "hapticsEnabled": true
           },
           "createdAt": "timestamp",
           "lastLoginAt": "timestamp"
         }
         ```
       - Izolacja kolekcji operacyjnych: `tasks`, `timetable`, `finances`, `workouts`, `calendar_events` z indeksem `userId: uid` lub subkolekcjami `users/{uid}/*`.
       - Wzmocnienie reguł `firestore.rules`:
         ```javascript
         match /users/{userId} {
           allow read: if request.auth != null;
           allow write: if request.auth.uid == userId || request.auth.token.role == 'admin';
         }
         match /tasks/{taskId} {
           allow read, write: if request.auth != null && (resource == null || resource.data.userId == request.auth.uid);
         }
         ```
  2. **Matryca Dostawców Autoryzacji (Firebase Multi-Provider Authentication Matrix):**
     - **Google Sign-In (`GoogleAuthProvider`):**
       - Natywne logowanie jednym kliknięciem (Google One-Tap & Popup / Redirect) zsynchronizowane z Google Cloud Identity Platform.
     - **E-mail & Hasło oraz E-mail Link (`EmailAuthProvider` & `sendSignInLinkToEmail`):**
       - Tradycyjna rejestracja z weryfikacją adresu e-mail oraz bezhasłowy Magic Link przesyłany na skrzynkę pocztową.
     - **Numer Telefonu & SMS OTP (`PhoneAuthProvider`):**
       - Weryfikacja kodem SMS z zabezpieczeniem reCAPTCHA v3 / Enterprise (`RecaptchaVerifier`).
     - **Płynna Migracja Kont Anonimowych (`linkWithCredential`):**
       - Transparentne podnoszenie uprawnień: użytkownik rozpoczynający pracę w trybie gościa/anonimowym (`signInAnonymously`) może w dowolnym momencie podpiąć konto Google, E-mail lub Telefon bez utraty wygenerowanych danych.
  3. **Wykorzystanie Potencjału Rozszerzeń Firebase (Firebase Extensions):**
     - **Trigger Email from Firestore (`firebase/firestore-send-email`):**
       - Integracja z dostawcą transakcyjnym (Resend / SendGrid / SMTP) – automatyczne wysyłanie raportów budżetowych, powiadomień o zaległościach i linków weryfikacyjnych.
     - **Resize Images (`firebase/storage-resize-images`):**
       - Automatyczne skalowanie przesyłanych avatarów użytkowników w Cloud Storage do formatów WebP (64×64, 128×128, 256×256) zoptymalizowanych pod kątem urządzeń mobilnych.
     - **Delete User Data (`firebase/delete-user-data`):**
       - Automatyczne czyszczenie wszystkich powiązanych dokumentów Firestore i zasobów Cloud Storage przy usunięciu konta (pełna zgodność z RODO/GDPR).
  4. **Integracja z Google Cloud Platform (GCP Enterprise):**
     - Zarządzanie rolami RBAC i uprawnieniami za pośrednictwem Custom Claims w Google Cloud Identity Platform.
     - Zabezpieczenie endpointów Vercel i Express weryfikacją tokenów `firebase-admin.auth().verifyIdToken(token)`.

---

### [*] TASK-03: Ekosystem IoT Smart Access & Moduł Bramy (ESP32 / RPi Bridge)
- **Priorytet:** `[*] WYSOKI (P1)`
- **Stan:** `[~] ZAPLANOWANE`
- **Zakres Wykonawczy:**
  - Integracja protokołu MQTT z brokerem Mosquitto dla modułu Smart Access w osiedlu Smart Estate.
  - Generowanie dynamicznych kodów OTP oraz kodów QR dla kurierów i gości z poziomu aplikacji mobilnej OmniDash.
  - Dedykowany widżet szybkiego otwierania bramy wjazdowej na pulpicie głównym.

---

### [*] TASK-04: Wielosilnikowa Synteza Mowy i Tryb Pełnomodalny
- **Priorytet:** `[*] WYSOKI (P1)`
- **Stan:** `[+] CZĘŚCIOWO ZREALIZOWANE (Fish Audio + Edge TTS działa, oczekuje na integrację WebRTC/AudioStream)`
- **Zakres Wykonawczy:**
  - Wdrożenie strumieniowania audio w czasie rzeczywistym (Real-time Audio Streaming) w trybie rozmowy na żywo.
  - Wybór głosu asystenta bezpośrednio w profilu użytkownika.

---

### [*] TASK-05: Integracja Frameworka OpenJarvis (Local-First AI & Agent Ecosystem)
- **Priorytet:** `[*] WYSOKI (P1)`
- **Stan:** `[~] ZAPLANOWANE (Analiza architektury open-jarvis/OpenJarvis)`
- **Źródło Referencyjne:** `https://github.com/open-jarvis/OpenJarvis` (Stanford SAIL / Hazy Research, Apache 2.0)
- **Zakres Wykonawczy i Potencjał Integracyjny dla OmniDash:**
  1. **Architektura Local-First (Hybrydowy Silnik LLM):**
     - Adaptacja podejścia OpenJarvis: wykonywanie 85%+ rutynowych zapytań lokalnie na stacji roboczej operatora (za pośrednictwem Ollama / rozszerzeń Rust / Python venv), a odpytywanie chmury Groq LPU (`openai/gpt-oss-120b`) wyłącznie przy złożonym rozumowaniu lub braku mocy lokalnej.
     - Pełna praca offline modułu asystenckiego na stacji roboczej Windows / WSL2.
  2. **Adopcja Wzorców Gotowych Agentów Specjalistycznych (Built-in Agents):**
     - **`morning_digest`**: Wdrożenie autonomicznego generatora porannego briefingu audio (TTS). Automatyczna synteza danych z Planu Dnia (06:00–06:30), odwołanych lekcji Librus, wydarzeń z Kalendarza, pogody Open-Meteo i nagłówków ITNewsTicker przed wyjściem do szkoły.
     - **`deep_research`**: Wielokrokowe badanie i przeszukiwanie źródeł z automatycznym formatowaniem cytowań akademickich i technicznych w module OSINT.
     - **`monitor_operative` & `operative`**: Wzmocnienie autonomicznego agenta OmniDaemon 24/7 (`autonomousAgent.js`) o techniki kompresji pamięci, długohoryzontowy monitoring procesów i stanów systemu.
     - **`code-assistant` & `native_openhands`**: Izolowane środowisko CodeAct do generowania i wykonywania skryptów pomocniczych na żądanie.
  3. **Standard Otwartych Umiejętności (Open Agent Skills Standard - `agentskills.io`):**
     - Integracja z uniwersalnym katalogiem umiejętności (dostęp do ponad 13 700 skilli społecznościowych z ekosystemów OpenClaw i Hermes Agent).
     - Optymalizacja jakości działania narzędzi na podstawie lokalnych śladów telemetrycznych za pomocą DSPy (`jarvis optimize skills --policy dspy`).
  4. **Most Komunikacyjny (WSL2 / Windows CLI & Express Bridge):**
     - Integracja lokalnego serwera API OpenJarvis (`jarvis gui` / API daemon) z backendem `core.server.js:5000` za pośrednictwem lokalnego mostu HTTP / SSE.

---

## 3. TABELA ZREALIZOWANYCH KAMIENI MILOWYCH (ARCHIWUM ZADAŃ)

| Identyfikator | Zakres Zadania | Wersja Realizacji | Status |
|---|---|---|---|
| `DONE-01` | Przekształcenie modułu na elastyczny "Plan Dnia" z podziałem Szkolne/Osobiste | `v2.34.0` | `[+] ZREALIZOWANE` |
| `DONE-02` | Scraper odwołanych lekcji Librus Synergia i wizualizacja okienek | `v2.34.0` | `[+] ZREALIZOWANE` |
| `DONE-03` | Realistyczny proces odświeżania ocen z paskiem postępu min. 800ms i średnią 4.62 | `v2.34.0` | `[+] ZREALIZOWANE` |
| `DONE-04` | Utrwalenie stałego schematu dnia (06:00–23:00) i planu FBW strych | `v2.34.1` | `[+] ZREALIZOWANE` |
| `DONE-05` | Migracja kolumny `category` w SQLite i Cloud Firestore | `v2.34.2` | `[+] ZREALIZOWANE` |
| `DONE-06` | Opracowanie nadrzędnego Master Documentu Redesignu GUI v3.0 | `v3.0.0-PROPOSAL` | `[+] ZREALIZOWANE` |
| `DONE-07` | Pełna mapa topografii stron, podstron i endpointów (Sitemap Tree) | `v3.0.0-PROPOSAL` | `[+] ZREALIZOWANE` |

---

> **MELDUNEK REJESTRU:**  
> Niniejszy rejestr jest jedynym wiążącym źródłem prawdy dla priorytetów rozwojowych platformy.
