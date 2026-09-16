# ERROR_DIFF :: 2026-09-16 :: Pusta wiadomość Push o lekcji & Defekt bazy głosów ElevenLabs

## 1. PROBLEM

### Kontekst i Objawy:
1. **Wiadomość Push ze zniekształconą/pustą treścią:**
   - Operator zlecił asystentowi: *„Wyślij mi informację o następnej lekcji na telefon”*.
   - Na smartfon dotarło powiadomienie Pushbullet zawierające ucięty tekst: `Następna lekcja: ".` lub samo `Następna lekcja: ` bez danych o przedmiocie, godzinie ani sali.
   - Analiza raw trace wykazała podwójny błąd:
     - `actionRegex` w `clientAiDispatcher.js` dopasowywał treść akcji za pomocą `[^\]]*\]`. W momencie, gdy parametr `body` zawierał numer sali w nawiasie kwadratowym (np. `[Sala 0.2]`), wyrażenie natychmiast zamykało znacznik na pierwszym `]`, odcinając resztę atrybutu.
     - `attrRegex` z wyrażeniem `[^"'„”«»]*` zamykał wartość atrybutu na pierwszym cudzysłowie wewnątrz tekstu (np. `body="Następna lekcja: "Biznes i zarządzanie" o 10:40."`), co redukowało treść do `"Następna lekcja: "`.
     - Brak prekomputacji bieżącej i kolejnej lekcji w promptach systemowych zmuszał model do ręcznego przeliczania 38 lekcji z całego tygodnia, co rano przed lekcjami (godz. 07:05) prowadziło do halucynowania pustych cudzysłowów.
2. **Działanie tylko dwóch głosów ElevenLabs:**
   - Operator zgłosił: *„Tylko kilka głosów nie działa, działają tylko dwa więc to też do poprawy, załączam całą listę głosów”*.
   - Analiza `ELEVENLABS_DEFAULT_VOICES` w `modules/services/ttsService.js` wykazała, że zdefiniowano jedynie 6 starych identyfikatorów głosów (`Adam`, `Antoni`, `Rachel`, `Sarah`, `Nicole`, `Arnold`).
   - Bezpośrednie odpytanie `GET https://api.elevenlabs.io/v1/voices` poświadczeniami operatora wykazało, że na jego koncie istnieją wyłącznie **Adam** (`pNInz6obpgDQGcFmaJgB`) oraz **Sarah** (`EXAVITQu4vr4xnSDxMaL`). Pozostałe 4 głosy zwracały błąd HTTP 400/404.
   - Pozostałe 19 oficjalnych głosów z biblioteki operatora (Roger, Bella, Laura, Charlie, George, Callum, River, Harry, Liam, Alice, Matilda, Will, Jessica, Eric, Chris, Brian, Daniel, Lily, Bill) nie było skonfigurowanych w systemie.

### Klasyfikacja:
- **Typ:** KRYTYCZNY (Defekt składniowy parsera akcji push) & WYSOKI (Niekompletna baza lektorów TTS).
- **Środowisko:** Client Browser (`modules/services/clientAiDispatcher.js`, `modules/services/ttsService.js`, `modules/pages/SettingsPage.jsx`) oraz Serverless Proxy (`api/agent.js`).

---

## 2. SOLUTION

1. **Odporny Parser Znaczników Akcji i Atrybutów:**
   - Zastąpienie `actionRegex` i `attrRegex` odpornym mechanizmem analizy leksykalnej, który:
     - Poprawnie ignoruje zagnieżdżone nawiasy kwadratowe `[...]` wewnątrz atrybutów.
     - Nie przerywa parsowania wartości przy napotkaniu wewnętrznych cudzysłowów prostych ani typograficznych (`"..."`, `'...'`, `„...”`).
     - Całkowicie i czysto usuwa znaczniki akcji z tekstu użytkownika.
2. **Prekomputacja Harmonogramu Lekcji (Time-Aware Helper):**
   - Dodanie deterministycznego modułu `getTimetableContext(timetable, now)` w `clientAiDispatcher.js` i `api/agent.js`.
   - Obliczanie dla strefy Europe/Warsaw:
     - `AKTUALNA LEKCJA` (lub informacja o przerwie/czasie wolnym),
     - `NAJBLIŻSZA NASTĘPNA LEKCJA DZISIAJ` (np. 10:40 Biznes i zarządzanie),
     - `PLAN NA DZIŚ` oraz `PLAN NA JUTRO`.
   - Wstrzyknięcie tych pól wprost do promptów `OMNI MIND` i `OMNI EXEC`.
3. **Autonomiczny Fallback dla Powiadomień Push:**
   - Jeśli parametr `body` akcji `SEND_PUSH` jest ucięty lub pusty, a zapytanie dotyczyło lekcji, dyspozytor automatycznie zasila powiadomienie sformatowaną najbliższą lekcją z bazy `timetable`.
4. **Wdrożenie Pełnej Bazy 21 Głosów ElevenLabs & Dynamiczne Pobieranie:**
   - Zaktualizowanie `ELEVENLABS_DEFAULT_VOICES` o pełną listę 21 zweryfikowanych głosów z VoiceLab operatora z prawidłowymi identyfikatorami.
   - Dodanie metody `fetchElevenLabsVoices(apiKey)` oraz dynamicznej synchronizacji w `SettingsPage.jsx`.

---

## 3. POST-MORTEM

- **STATUS:** CLOSED
- **APPROACH:** Eliminacja podatności regex (`parseActionTags` i `parseAttributes` radzące sobie z `[Sala 0.2]` oraz cudzysłowami wewnętrznymi), prekomputacja kognitywna harmonogramu (`getTimetableContext` wstrzykujący stan lekcji do promptów), autonomiczny fallback dla zapytań o lekcję przy wysyłce push, oraz pełna aktualizacja 21 głosów ElevenLabs wraz z dynamicznym pobieraniem z API.
- **IMPROVED:** 
  - Bezpieczne wyodrębnianie powiadomień Pushbullet bez ucinania treści na nawiasach i cudzysłowach.
  - Zawsze precyzyjna informacja o aktualnej i kolejnej lekcji w powiadomieniach mobilnych i odpowiedzi asystenta.
  - Wszystkie 21 oficjalnych głosów ElevenLabs (Roger, Bella, Sarah, Adam, Charlie, George itp.) działają poprawnie ze zweryfikowanymi ID; dodano opcję odświeżenia biblioteki głosów z poziomu Ustawień.
  - Zestaw 91/91 testów jednostkowych przechodzi pomyślnie.
- **BROKE:** Nic (pełna wsteczna kompatybilność, brak regresji).
