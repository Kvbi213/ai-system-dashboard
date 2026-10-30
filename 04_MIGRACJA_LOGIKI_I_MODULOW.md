# 04. MIGRACJA LOGIKI DOMENOWEJ I PRZEPISANIE MODUŁÓW
> Projekt: OmniDash Reborn (v4.0.0)  
> Cel: 100% bezstratna rekonstrukcja funkcji domenowych z podniesieniem bezpieczeństwa, typowania i płynności  
> Standard wykonania: Protokół Antigravity v4.0 (Deterministic Edition)  

---

## 1. RESTRUKTURYZACJA SILNIKA AI (AGENT RUNTIME & HARVEY)

### Stan w Legacy v3.4.0:
- Logika uruchamiana w przeglądarce (`modules/services/clientAiDispatcher.js`, 154 KB).
- Klucze API i prompty narażone na wgląd w DevTools przeglądarki.
- Wywoływanie narzędzi wstrzymuje interfejs na czas całego zapytania (10-25 sekund) bez wizualnego feedbacku postępu.

### Architektura v4.0.0 (`apps/api/src/domains/ai/`):
```
apps/api/src/domains/ai/
├── agentRuntime.ts        ← Główny zarządca sesji LLM i pętli decyzyjnej
├── promptEngine.ts        ← Wstrzykiwanie ról (Worker / Mentor / Harvey) i pamięci
├── toolSandbox.ts         ← Izolowany egzekutor narzędzi z matrycą uprawnień
├── harveySalesEngine.ts   ← Silnik perswazyjny B2B Harveya (AIDA/PAS/BAB/QVC/3Ps)
└── llmProvider.ts         ← Klient Groq SDK (openai/gpt-oss-120b) ze strumieniowaniem
```

1. **Strumieniowanie SSE Token-by-Token:**
   - Użytkownik widzi odpowiedź w czasie rzeczywistym od pierwszego tokenu (`< 400ms TTFT`).
   - W przypadku wywołania narzędzia (`ADD_TASK`, `SEARCH_WEB`, `GET_LIBRUS_GRADES`), backend natychmiast wysyła zdarzenie SSE:
     `event: tool_start, data: {"tool": "GET_LIBRUS_GRADES", "status": "executing"}`
     co w GUI renderuje elegancką, animowaną kapsułę postępu przed zakończeniem generowania tekstu.
2. **Zachowanie 1:1 Silnika Sprzedażowego Harvey:**
   - Wszystkie 5 ram cold mailingu (AIDA, PAS, BAB, QVC, 3Ps).
   - 23 sygnały rynkowe (SERP Rank 11-30, brak formularza rezerwacji, piksele reklamowe Meta/Google Ads).
   - Protokół LAARC (Listen, Acknowledge, Assess, Respond, Confirm) i scoring leadów BANT/MEDDIC w typowanych strukturach TypeScript.

---

## 2. INTEGRACJA LIBRUS SYNERGIA (GRADES & TIMETABLE SCRAPER)

### Stan w Legacy v3.4.0:
- Podział logiki pomiędzy `librusService.js` (94 KB), `gradeUtils.js` oraz kontrolery Express.
- Uruchamianie zapytań bezpośrednio w wątku HTTP, co przy wolnej odpowiedzi Librusa blokowało serwer.

### Architektura v4.0.0 (`apps/api/src/domains/librus/`):
```
apps/api/src/domains/librus/
├── librusClient.ts        ← Autoryzacja i odpytywanie Librus Synergia API
├── htmlScraper.ts         ← Parser Cheerio dla odwołanych lekcji i zastępstw
├── gradeEngine.ts         ← Ścisła matematyka średnich ważonych semestrów 1 i 2
├── timetableEngine.ts     ← Nakładanie absencji nauczycieli i okienek
└── librusCacheRepo.ts     ← Persystencja buforów w bazie Drizzle ORM
```

1. **Matematyka Ocen (Golden Dataset 22/22 PASS):**
   - Ochrona wag: oceny o wadze `0` nie wpływają na mianownik średniej ważonej.
   - Prawidłowa normalizacja modyfikatorów: `+` (+0.25 lub +0.5 w zależności od konfiguracji) oraz `-` (-0.25).
   - Oceny nienumeryczne: ignorowanie symboli `'N'`, `'np'`, `'bz'` przy kalkulacji średniej z zachowaniem ich widoczności w widoku kafelkowym i modalnym.
2. **Scraper Odwołanych Lekcji i Zastępstw:**
   - Wykrywanie znaczników `<s>` oraz klas CSS `.plan-lekcji-info` w pobieranym HTML.
   - Zabezpieczenie przed utratą lekcji w naprzemiennych wierszach `tr.line0` i `tr.line1`.
   - Automatyczna korelacja nieobecności kadry nauczycielskiej z harmonogramem lekcji ucznia.

---

## 3. FINANSE 50/30/20 & PUSHBULLET WEBSOCKET LISTENER

### Stan w Legacy v3.4.0:
- Nasłuch WebSocket w `core.server.js` podatny na zerwanie połączenia przy restarcie serwera HTTP.
- Obliczenia budżetowe rozproszone pomiędzy frontend a backend.

### Architektura v4.0.0 (`apps/api/src/domains/finance/` oraz `apps/worker/src/pushbullet/`):
```
apps/worker/src/pushbullet/
├── websocketListener.ts   ← Odporny klient WebSocketu Pushbullet z auto-reconnectem
├── notificationParser.ts  ← Kognitywny regex + parser kwot transakcji bankowych
└── slidingDeduplicator.ts ← Bufor przesuwny eliminujący duplikaty w oknie 60 sekund

apps/api/src/domains/finance/
├── budgetEngine.ts        ← Algorytm podziału dochodów 50/30/20 (Needs, Wants, Savings)
├── envelopeTransfer.ts    ← Bezpieczne transfery między koszykami z saldem transakcyjnym
└── csvExporter.ts         ← Czysty generator RFC 4180 dla raportów finansowych
```

1. **Autonomiczny Obieg Transakcji:**
   1) Bank operatora wysyła powiadomienie push na telefon z Androidem.
   2) Usługa Pushbullet przekazuje powiadomienie do strumienia `wss://stream.pushbullet.com`.
   3) Kontener `omnidash-worker` przechwytuje zdarzenie, weryfikuje okno deduplikacji 60s i ekstrahuje kwotę (np. "Płatność kartą: 45,50 PLN w BIEDRONKA").
   4) Klasyfikator przypisuje wydatek do koszyka "Needs" (Koszty życia).
   5) Transakcja zostaje atomowo zapisana w bazie Drizzle ORM, a worker wysyła na telefon powiadomienie push z podsumowaniem nowego stanu portfela.

---

## 4. ENTITIES & INTELLIGENCE OSINT HUB (10 KART DZIEDZINOWYCH)

### Stan w Legacy v3.4.0:
- Złożona hierarchia drzewa podmiotów ze ścieżkami `tree_path` oraz 15 relacjami grafowymi.

### Architektura v4.0.0 (`apps/api/src/domains/entities/`):
```
apps/api/src/domains/entities/
├── entityTreeService.ts   ← Obliczanie kanonicznych ścieżek Kraj/Region/Miasto/Org/Osoba
├── domainCardsSchema.ts   ← Schemat Zod dla 10 kart dziedzinowych
├── graphNetwork.ts        ← Wyznaczanie krawędzi, stopni centralności i relacji sieciowych
├── asciiTreeRenderer.ts   ← Deterministyczny generator drzewa ASCII
└── obsidianSyncBridge.ts  ← Synchronizacja ze skarbcem w Documents/OBSIDIAN/informacje
```

1. **Format 10 Kart Dziedzinowych:**
   Dla każdego podmiotu utrzymywane są ściśle typowane sekcje:
   `Metryka`, `Sociale`, `Charakter`, `Zdrowie`, `Finanse`, `Zainteresowania`, `Rutyna`, `Relacja`, `Siec_Relacji`, `Zaufanie_i_Ryzyka`.
2. **Model Mieszkaniowy 120m²:**
   Kwalifikacja lokatorów: `Core`, `Współlokator`, `Gość`, `Rezerwa`, `Brak kwalifikacji` z kontrolą dostępności przestrzeni.

---

## 5. WYWIAD DROGOWY & CANARD / GDDKIA RADAR

### Architektura v4.0.0 (`apps/api/src/domains/traffic/`):
```
apps/api/src/domains/traffic/
├── gpsService.ts          ← Precyzyjne geokodowanie i odczyt pozycji
├── canardRadarDb.ts       ← Baza fotoradarów stacjonarnych, OPP i RedLight (korytarz do Gdańska)
├── gddkiaAlertScanner.ts  ← Skaner zdarzeń drogowych w promieniu 10 km (wypadki, utrudnienia)
└── routeCalculator.ts     ← Integracja OSRM / Google Maps z nakładaniem punktów kontrolnych
```

---

## 6. WIELOSILNIKOWA SYNTEZA MOWY & SŁUCH (VOICE ENGINE)

### Architektura v4.0.0 (`apps/api/src/domains/voice/`):
```
apps/api/src/domains/voice/
├── fishAudioService.ts    ← Synteza mowy Fish Audio (modele Anna i Michał)
├── edgeTtsService.ts      ← Szybki fallback Microsoft Edge Neural TTS
├── elevenLabsService.ts   ← Silnik ElevenLabs z kontrolą limitów miesięcznych
└── whisperSttService.ts   ← Transkrypcja nagrań mikrofonu przez Groq Whisper
```
- Frontend GUI otrzymuje zoptymalizowany strumień audio (PCM/MP3) ze zintegrowanym wskaźnikiem fali dźwiękowej (Visualizer Waveform) i przełącznikiem silników w locie.

---

## 7. SCHEMAT DNIA & TRENING ATTIC FBW

### Architektura v4.0.0 (`apps/api/src/domains/workouts/`):
- Utrwalenie stałego schematu dnia w bazie i interfejsie:
  - `06:00-06:30` Poranny rozruch
  - `06:30-16:15` Szkoła i powrót
  - `16:15-17:00` Obiad i reset
  - `17:00-18:00` Blok A: Trening FBW / Nauka naprzemiennie
  - `18:00-20:00` Blok B: Chill i reset
  - `20:00-22:30` Blok C: Praca głęboka / Kodowanie
  - `22:30-23:00` Wyciszenie i sen
- Moduł treningowy na strych: drążek nachwyt, dipy/pompki, wiosłowanie, OHP, goblet squat, unoszenie kolan z interaktywnymi timerami przerw (90s / 120s) i zapisem obciążeń.
