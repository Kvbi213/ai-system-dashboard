# 📌 REJESTR ROZWOJU I ZADAŃ SYSTEMOWYCH :: TO-DO.md

> **Projekt:** OmniDash Personal Assistant System (v2.20.0+)  
> **Zarządzanie:** Protokół Antigravity (NANO v3.2)  
> **Status:** AKTYWNY | MAPA DROGOWA ROZWOJU  
> **Data aktualizacji:** 2026-09-20  

---

## 📊 TABELA ZBIORCZA ZADAŃ (ROADMAP SPRINT)

| ID | Moduł / Obszar | Zadanie Operacyjne | Priorytet | Kategoria | Szacowany Czas | Status |
| :-: | :--- | :--- | :-: | :-: | :-: | :-: |
| **TODO-01** | **Głos 2.0 (Audio)** | `[VOICE] Mechanizm wtrącania się (Barge-in) oraz dźwięki systemowe (Earcons)` | **HIGH** | `systemowe` | ~2.0h | `[~] PENDING` |
| **TODO-02** | **Asystent Autonomiczny** | `[PUSHBULLET] Autonomiczny poranny i wieczorny briefing operacyjny na smartfon` | **HIGH** | `powtarzalne` | ~2.0h | `[~] PENDING` |
| **TODO-03** | **Zdalne Sterowanie** | `[PUSHBULLET] Headless Remote: Zdalne dodawanie zadań, wydatków i notatek przez push` | **HIGH** | `systemowe` | ~2.5h | `[~] PENDING` |
| **TODO-04** | **Inteligentne Finanse** | `[FINANSE] Predykcja tempa wydatków (Run-rate) i kognitywne wykrywanie subskrypcji` | **MEDIUM** | `jednorazowe` | ~2.0h | `[~] PENDING` |
| **TODO-05** | **Rutyny & Nawyki** | `[HABITS] Moduł śledzenia codziennych nawyków z licznikiem passy (Streaks)` | **MEDIUM** | `powtarzalne` | ~3.0h | `[~] PENDING` |
| **TODO-06** | **Mobilne PWA** | `[PWA] Pełna instalowalna aplikacja mobilna z ikonami i buforowaniem offline` | **LOW** | `jednorazowe` | ~1.5h | `[~] PENDING` |

---

## 🛠️ SZCZEGÓŁOWE SPECYFIKACJE ZADAŃ

### 1. [TODO-01] 🎙️ Głos 2.0: Mechanizm Wtrącania Się (Barge-in) & Dźwięki Systemowe
- **Cel:** Likwidacja sztuczności w trybie ciągłej rozmowy głosowej (*Live Voice Mode*). Gdy Omni odtwarza mowę przez TTS (Google Neural / Edge / ElevenLabs), a operator zacznie mówić, system natychmiast wycisza mowę i przełącza się na odbiór audio operatora.
- **Zakres techniczny:**
  1. **Detekcja Mowy w Trakcie Odtwarzania (Barge-in):** Utrzymanie aktywnego nasłuchu `SpeechRecognition` w trakcie odtwarzania audio. Wykrycie głosu operatora natychmiast wywołuje `ttsService.stop()`, resetuje stan odtwarzacza i rozpoczyna transkrypcję nowego zapytania.
  2. **Dźwięki Systemowe (Earcons / Audio Cues):** Wdrożenie syntetycznych, minimalistycznych mikro-dźwięków:
     - Dźwięk wybudzenia po wykryciu słowa *"Hej Omni"*.
     - Dźwięk rozpoczęcia przetwarzania zapytania przez LLM.
     - Dźwięk ukończenia operacji (np. zapis transakcji lub zadania w bazie).
     - Dźwięk ostrzeżenia / błędu API.
  3. **Zaawansowane Suwaki Syntezy w Ustawieniach:** Dodanie w `SettingsPage.jsx` suwaka tempa mowy (Speaking Rate: 0.8x – 1.5x) oraz intonacji (Pitch: -4.0 do +4.0 st) dla silnika Google Cloud Neural TTS.
- **Powiązane komponenty i pliki:**
  - `modules/components/Terminal.jsx` (zarządzanie cyklem życia rozmowy na żywo)
  - `modules/services/ttsService.js` (natychmiastowe tłumienie i parametry syntezy)
  - `modules/services/wakeWordService.js` (niezawodna detekcja ciągła)
  - `modules/pages/SettingsPage.jsx` (interfejs suwaków tempa i tonu)
- **Kryteria Akceptacji (DoD):**
  - [ ] Wypowiedzenie dowolnego słowa podczas mowy Omni natychmiast ucina dźwięk i rejestruje mowę.
  - [ ] Opcja włączenia/wyłączenia dźwięków systemowych w Ustawieniach (`system_sound_effects`).
  - [ ] Płynne dostosowanie tempa odtwarzania lektorów WaveNet / Neural2 w Google TTS.

---

### 2. [TODO-02] 🌅 Autonomiczny Briefing Poranny & Wieczorny na Smartfon (Pushbullet Digest)
- **Cel:** Przejście asystenta OmniDash w tryb proaktywnego zarządzania dniem operatora bez konieczności otwierania przeglądarki.
- **Zakres techniczny:**
  1. **Poranny Raport Operacyjny (Domyślnie godz. 07:15):**
     - Odpytanie Open-Meteo API dla bieżącej geolokalizacji (temperatura, warunki pogodowe, opady).
     - Odpytanie tabeli `timetable` i wyodrębnienie planu zajęć/lekcji na bieżący dzień tygodnia.
     - Pobranie z tabeli `tasks` zadań oznaczonych priorytetem `HIGH` z terminem na dziś.
     - Obliczenie dostępnego budżetu dziennego z koszyka "Potrzeby" i "Zachcianki".
     - Sformatowanie zwartej, czytelnej notyfikacji Pushbullet z emotikonami statusu i wysłanie na telefon operatora.
  2. **Wieczorne Podsumowanie Dnia (Domyślnie godz. 21:30):**
     - Podsumowanie zrealizowanych zadań to-do w danym dniu.
     - Sumaryczne zestawienie zarejestrowanych wydatków z dnia (z podziałem na koszyki 50/30/20).
     - Przypomnienie o kluczowych zadaniach i planie na dzień jutrzejszy.
  3. **Konfiguracja Harmonogramu w Ustawieniach:**
     - Możliwość włączenia/wyłączenia briefingu porannego i wieczornego.
     - Pola wyboru godziny dostarczenia notyfikacji (domyślnie 07:15 i 21:30).
- **Powiązane komponenty i pliki:**
  - `core.server.js` (`scheduler.js` / cron pętlowy)
  - `api/cron/agent.js` (dla środowiska bezserwerowego Vercel Cron)
  - `modules/services/pushbulletService.js` (dyspozytor notyfikacji push)
  - `modules/pages/SettingsPage.jsx` (konfiguracja godzin briefingu)
- **Kryteria Akceptacji (DoD):**
  - [ ] Punktualne generowanie i wysyłanie porannego briefingu na smartfon.
  - [ ] Poprawne uwzględnienie planu lekcji dla aktualnego dnia tygodnia (poniedziałek–piątek).
  - [ ] Brak spamu i deduplikacja – maksymalnie 1 briefing poranny i 1 wieczorny na dobę.

---

### 3. [TODO-03] 📲 Headless Remote: Zdalne Sterowanie ze Smartfona przez Pushbullet
- **Cel:** Umożliwienie operatorowi zarządzania zadaniami, finansami i pamięcią asystenta bezpośrednio z telefonu (z aplikacji Pushbullet lub SMS/Note) bez wchodzenia na stronę www.
- **Zakres techniczny:**
  1. **Nasłuchiwanie Strumienia WebSocket:** Wykorzystanie istniejącego połączenia `wss://stream.pushbullet.com` do wyłapywania notatek tekstowych tworzonych przez operatora na telefonie.
  2. **Parser Kognitywny Poleceń:** Rozpoznawanie prefiksu `Omni:` lub pytań bezpośrednich:
     - `Omni: kupić mleko i baterie` ➔ narzędzie `ADD_TO_DO` (dodanie do tabeli `tasks` z priorytetem MEDIUM).
     - `Omni: wydatek 38 zł obiad` ➔ narzędzie finansowe (rejestracja w koszyku Potrzeby w SQLite i Firestore).
     - `Omni: zapamiętaj, że klucze zapasowe są w garażu` ➔ narzędzie `[ACTION:REMEMBER]` w `operator_brain`.
     - `Omni: jaki mam plan na dziś?` ➔ wygenerowanie odpowiedzi i odesłanie planu w powiadomieniu zwrotnym.
  3. **Błyskawiczny Push Zwrotny:** Odesłanie potwierdzenia na telefon w 1-2 sekundy: `[+] Omni: Zapisano wydatek 38,00 PLN (Kategoria: Potrzeby).`.
- **Powiązane komponenty i pliki:**
  - `modules/services/pushbulletService.js` (obsługa zdarzeń typu note/push)
  - `modules/services/pushbulletClassifier.js` (klasyfikacja intencji zdalnej)
  - `modules/routes/ai.js` (przetwarzanie bezgłowe przez `openai/gpt-oss-120b`)
- **Kryteria Akceptacji (DoD):**
  - [ ] Wysłanie notatki z telefonu skutkuje natychmiastowym dodaniem rekordu do bazy danych.
  - [ ] Operator otrzymuje powiadomienie zwrotne z potwierdzeniem operacji na telefonie.

---

### 4. [TODO-04] 📈 Predykcja Tempa Wydatków (Run-rate) & Detekcja Subskrypcji
- **Cel:** Proaktywne ostrzeganie operatora przed wyczerpaniem środków w koszykach budżetu 50/30/20 przed końcem miesiąca.
- **Zakres techniczny:**
  1. **Wskaźnik Burn-rate i Prognoza Wyczerpania:**
     - Obliczanie średniego dziennego tempa wydatków w bieżącym miesiącu:  
       `Średni wydatek dzienny = Suma wydatków w koszyku / Dzień miesiąca`.
     - Ekstrapolacja do końca miesiąca i estymacja dnia krytycznego:  
       *"Przy obecnym tempie wydatków koszyk Zachcianki wyczerpie się za 6 dni (26 września)"*.
     - Wizualny wskaźnik ryzyka (kolory: zielony, żółty, czerwony) w kafelkach na podstronie Finanse.
  2. **Kognitywna Detekcja Subskrypcji i Opłat Stałych:**
     - Algorytm analizujący powtarzalność transakcji w historii (np. Spotify, Netflix, siłownia, rachunki za telefon).
     - Wyliczanie sumy miesięcznych zobowiązań stałych i rezerwacja środków w koszyku "Potrzeby".
- **Powiązane komponenty i pliki:**
  - `modules/pages/FinancePage.jsx` (komponenty wizualne prognoz)
  - `modules/services/budgetCalculator.js` (czyste funkcje matematyczne projekcji)
  - `modules/components/ChatInlineWidgets.jsx` (mini-widżet finansowy czatu)
- **Kryteria Akceptacji (DoD):**
  - [ ] Dynamiczne wyliczanie prognozowanego stanu konta na koniec miesiąca kalendarzowego.
  - [ ] Lista wykrytych subskrypcji z możliwością ręcznego potwierdzenia lub odrzucenia przez operatora.

---

### 5. [TODO-05] 🎯 Moduł Nawyków i Rutyn Dnia (Habits & Streaks)
- **Cel:** Budowanie i monitorowanie codziennych nawyków wspierających produktywność i zdrowie operatora.
- **Zakres techniczny:**
  1. **Model Danych Nawyków:**
     - Tabela `habits` w SQLite oraz kolekcja w Cloud Firestore (`id`, `title`, `icon`, `target_days`, `created_at`).
     - Tabela `habit_logs` rejestrująca ukończenie nawyku w danym dniu kalendarzowym (`YYYY-MM-DD`).
  2. **Interfejs Wizualny na Dashboardzie:**
     - Widżet nawyków ze statystykami: bieżąca passa (Current Streak), rekord passy (Best Streak).
     - Siatka aktywności za ostatnie 30/90 dni inspirowana wykresem wkładu GitHub.
  3. **Integracja z Agentem Kognitywnym:**
     - Agent ma wgląd w nawyki i podczas porannej lub wieczornej interakcji przypomina o nieodhaczonych pozycjach.
     - Komenda autonomiczna `[ACTION:HABIT_CHECK:id]` umożliwiająca odznaczanie nawyku bezpośrednio z poziomu konwersacji w czacie.
- **Powiązane komponenty i pliki:**
  - `modules/pages/Dashboard.jsx` (montaż widżetu nawyków)
  - `modules/database.js` (struktura tabel `habits` i `habit_logs`)
  - `modules/ai/tools.js` (narzędzia LLM do odznaczania nawyków)
- **Kryteria Akceptacji (DoD):**
  - [ ] Jedno-klikowe odznaczanie nawyku na dany dzień z natychmiastowym przeliczeniem passy.
  - [ ] Synchronizacja stanu nawyków pomiędzy lokalnym SQLite a chmurą Firestore.

---

### 6. [TODO-06] 📱 Pełna Instalowalna Aplikacja PWA z Buforowaniem Offline
- **Cel:** Zamiana interfejsu przeglądarkowego w pełnoprawną aplikację mobilną działającą na smartfonie na pełnym ekranie (Standalone).
- **Zakres techniczny:**
  1. **Web App Manifest (`public/manifest.json`):**
     - Pełna konfiguracja `display: standalone`, kolor motywu (`theme_color: #121212`), orientacja pionowa.
     - Komplet ikon wysokiej rozdzielczości (192x192, 512x512, maskable icons).
  2. **Service Worker (`sw.js`):**
     - Buforowanie kluczowych zasobów statycznych aplikacji (shell cache).
     - Płynne ładowanie interfejsu przy braku łączności z internetem.
  3. **Integracja z Paskiem Offline:**
     - Płynna współpraca z istniejącym detektorem `ToastContext` i buforem operacji Firestore.
- **Powiązane komponenty i pliki:**
  - `public/manifest.json`
  - `public/sw.js`
  - `index.html`
  - `vite.config.js`
- **Kryteria Akceptacji (DoD):**
  - [ ] Smartfon z Androidem / iOS wyświetla monit "Zainstaluj OmniDash na ekranie głównym".
  - [ ] Po zainstalowaniu aplikacja otwiera się bez pasków nawigacji przeglądarki.
  - [ ] Przy braku internetu interfejs otwiera się poprawnie z pamięci podręcznej.

---

## 📈 REJESTR STATUSU REALIZACJI

```
[ ] TODO-01: Głos 2.0 (Barge-in & Dźwięki systemowe)
[ ] TODO-02: Autonomiczny briefing Pushbullet (Poranek & Wieczór)
[ ] TODO-03: Headless Remote (Zdalne sterowanie ze smartfona)
[ ] TODO-04: Predykcja tempa wydatków & Subskrypcje
[ ] TODO-05: Moduł Nawyków i Rutyn (Habits & Streaks)
[ ] TODO-06: PWA i tryb offline dla telefonu
```

---
*Dokument utworzony zgodnie z Protokołem Antigravity (NANO v3.2). Podpisano: Agent AI.*
