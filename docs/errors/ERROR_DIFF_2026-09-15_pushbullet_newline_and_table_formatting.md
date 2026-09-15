# ERROR_DIFF: Pushbullet Mobile Notification Newline & Table Formatting

**Identyfikator:** `ERROR_DIFF_2026-09-15_pushbullet_newline_and_table_formatting`  
**Data wystąpienia:** 2026-09-15  
**Status:** SUCCESS  
**Priorytet:** KRYTYCZNY  

---

## 1. PROBLEM

### Terminal Raw / Symptomy
```text
Symptom:
Użytkownik wysyła polecenie wygenerowania planu lekcji i wysłania go na smartfon przez Pushbullet.
Powiadomienie na telefonie Motorola Moto g34 5G wyświetla się jako jeden zbity blok tekstu z widocznymi
dosłownymi znakami ucieczki "\n" oraz surowymi tabelami Markdown:
"08:00-08:45: Wychowanie Fizyczne (Sala 1.16, PW, Laboratorium)\n08:50-09:35: Język Angielski..."

Przyczyna źródłowa (Root Cause Analysis):
1. Klient mobilny Pushbullet (Android) nie parsuje składni Markdown ani wierszy tabel (|...|).
   Wszystkie znaki Markdown (np. `**`, `|`) są renderowane dosłownie jako znaki tekstu.
2. Modele językowe LLM wewnątrz atrybutów tagów [ACTION:SEND_PUSH body="..."] generują sekwencje
   dwuznakowe '\' + 'n' (literal backslash-n) zamiast bajtu nowej linii (0x0A).
3. Brak warstwy formatującej i normalizującej w `sendPushNotificationClient` powodował, że
   dosłowny ciąg "\n" oraz separatory tabel trafiły bezpośrednio do pola `body` obiektu JSON
   wysyłanego do API Pushbullet (`https://api.pushbullet.com/v2/pushes`).
```

### Klasyfikacja
Defekt formatowania wyjścia mobilnego (brak dekodowania sekwencji ucieczki tekstu i brak transformacji tabel Markdown do zoptymalizowanego layoutu mobilnego).

---

## 2. SOLUTION

### Działania Naprawcze
1. **Implementacja `formatPushText` w `modules/services/pushbulletService.js`:**
   - Normalizacja znaków nowej linii: zamiana `\r\n`, `\n` oraz `\r` na rzeczywisty znak nowej linii `\n` (bajt 0x0A).
   - Oczyszczanie składni Markdown: usuwanie `**`, `*`, `__`, `_`, ```` ` ```` oraz nagłówków `#`.
   - Inteligentny parser tabel Markdown:
     - Wykrywanie wierszy tabeli `| a | b | c |` oraz ignorowanie wierszy separatorów `|---|---|` i nagłówków.
     - Przekształcanie komórek tabeli w estetyczny format mobilny: `• Godzina: Przedmiot (Sala) [Dodatkowe]`.
   - Standaryzacja zakresów godzin: automatyczne dodawanie punktorów `• 08:00 - 08:45: Przedmiot`.
   - Zintegrowanie `formatPushText` bezpośrednio w wywołaniu `sendPushNotificationClient(title, body)`.
2. **Aktualizacja Prompterów Systemowych (`clientAiDispatcher.js` & `api/agent.js`):**
   - Dodano rygorystyczną regułę w promptach `mentor` i `worker`: zakaz formatowania tabel Markdown w atrybucie `body` akcji `[ACTION:SEND_PUSH]`.
   - Wymóg formatowania wierszowego z punktorami `• HH:MM: Przedmiot (Sala)`.
   - Oczyszczanie atrybutu `body` za pomocą `formatPushText` w funkcji `extractPushDetails`.
3. **Pokrycie Testami Jednostkowymi (`tests/pushbullet_finance.test.js`):**
   - 5 dedykowanych testów weryfikujących: zamianę `\n`/`\r\n`, usuwanie Markdown, transformację tabel, formatowanie godzin i obsługę pustych wejść.

---

## 3. POST-MORTEM

- **STATUS:** Rozwiązany (SUCCESS).
- **APPROACH:** Direct Text Normalizer (`formatPushText`) + Prompt Engineering Constraints + Comprehensive Vitest Test Suite.
- **IMPROVED:** Powiadomienia na ekranie blokady i belce powiadomień telefonu renderują się z zachowaniem pełnych odstępów wierszowych, bez zaśmiecających znaków ucieczki `\n` i surowych separatorów tabel `|`.
- **BROKE:** Brak regresji. Wszystkie 82 testy jednostkowe w 8 plikach przechodzą pomyślnie.
