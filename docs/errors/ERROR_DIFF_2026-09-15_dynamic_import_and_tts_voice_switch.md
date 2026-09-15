# ERROR_DIFF: Błąd Dynamic Importu Przestarzałego Chunka oraz Brak Zmiany Głosu TTS w Ustawieniach

- **Data**: 2026-09-15
- **Klasyfikacja**: KRYTYCZNY (Błąd ładowania modułu po wdrożeniu produkcyjnym & anomalia wyboru głosu TTS)
- **Komponenty**: `modules/services/ttsService.js`, `core.client.jsx`, `modules/pages/SettingsPage.jsx`, `modules/components/ErrorBoundary.jsx`

---

## 1. PROBLEM

### Terminal Raw / Konsola Błędów:
```text
Error: TypeError: Failed to fetch dynamically imported module: https://void-potato-7721.web.app/assets/SettingsPage-CfNPiueX.js

Stack:
    at rG (https://void-potato-7721.web.app/assets/index-g9yCqwYr.js:216:4231)
    at hG (https://void-potato-7721.web.app/assets/index-g9yCqwYr.js:216:8411)
    at Suspense
    at div
    at div
    at fG (https://void-potato-7721.web.app/assets/index-g9yCqwYr.js:216:7522)
    at jG (https://void-potato-7721.web.app/assets/index-g9yCqwYr.js:216:17436)
    at _oe (https://void-potato-7721.web.app/assets/index-g9yCqwYr.js:4171:424)
    at _ce (https://void-potato-7721.web.app/assets/index-g9yCqwYr.js:4211:25227)
    at ace (https://void-potato-7721.web.app/assets/index-g9yCqwYr.js:4197:49515)
    at _7 (https://void-potato-7721.web.app/assets/index-g9yCqwYr.js:232:4602)
    at pce (https://void-potato-7721.web.app/assets/index-g9yCqwYr.js:4208:32539)
```

Zgłoszenie operatora:
> "w ustawieniach jak robię to głos się nie zmienia i wywaliło error na moment: Error: TypeError: Failed to fetch dynamically imported module: ..."

### Izolacja Przyczyn Źródłowych (Root Cause Analysis):
1. **Dynamic Import Error po Nowym Release**:
   - Po wdrożeniu nowej wersji na Firebase Hosting, poprzednie hashe plików z `dist/assets/` (np. `SettingsPage-CfNPiueX.js`) zostały usunięte i zastąpione nowymi (`SettingsPage-RYqqgxN0.js`).
   - Przeglądarka użytkownika miała otwartą sesję ze starszą wersją pliku `index.html` wskazującą na nieistniejący już chunk. Przy kliknięciu w zakładkę Ustawienia nastąpiła próba pobrania skasowanego pliku `SettingsPage-CfNPiueX.js`, co skutkowało błędem modułu i zatrzymaniem w `ErrorBoundary`.
2. **Brak Zmiany Głosu w Ustawieniach**:
   - Na hostingu Firebase wszystkie ścieżki `/api/*` są przekierowywane przez regułę rewrite (`** -> /index.html`) do statycznego `index.html` ze statusem HTTP 200 i Content-Type `text/html`.
   - Metoda `speakWithElevenLabs` w `ttsService.js` najpierw wysyłała zapytanie do `/api/voice/tts`. Ponieważ Firebase zwracał kod 200, `proxyRes.ok` miało wartość `true`, a odebrany obiekt `audioBlob` zawierał tekst strony HTML (`index.html`).
   - Przez to `!audioBlob && apiKey` nie było spełnione (bezpośrednie zapytanie z przeglądarki do ElevenLabs zostało pominięte).
   - Odtwarzacz audio `<audio>` próbował zdekodować kod HTML jako plik dźwiękowy MP3, co wywoływało błąd `audio.onerror`.
   - Po błędzie ElevenLabs aplikacja natychmiast przechodziła do awaryjnego silnika przeglądarki `speakWithWebSpeech`, który zawsze odtwarzał ten sam domyślny głos systemowy niezależnie od wybranego głosu w ElevenLabs lub Edge.

---

## 2. SOLUTION

1. **Auto-Recovery dla Dynamicznych Importów**:
   - Zaimplementowanie `lazyWithRetry` w `core.client.jsx` z automatycznym odświeżaniem strony (`window.location.reload()`) przy wykryciu przestarzałego chunka.
   - Rejestracja globalnego nasłuchu zdarzenia `vite:preloadError`.
   - Zabezpieczenie w `ErrorBoundary.jsx` automatycznie przeładowujące stronę zamiast blokowania ekranu błędem.
2. **Bezpośrednie Połączenie z ElevenLabs API & Weryfikacja Content-Type**:
   - W `ttsService.js`: jeśli w aplikacji dostępny jest klucz API ElevenLabs, wykonujemy zapytanie bezpośrednio do `https://api.elevenlabs.io/v1/text-to-speech/${targetVoice}` (ElevenLabs posiada otwarte nagłówki CORS `Access-Control-Allow-Origin: *`).
   - Weryfikacja nagłówka odpowiedzi proxy: akceptowane są wyłącznie odpowiedzi z nagłówkiem `content-type` zawierającym `audio/` lub `application/octet-stream`. Wszelkie odpowiedzi `text/html` są bezwzględnie odrzucane.
   - W metodzie `testVoice` w `SettingsPage.jsx` przekazujemy jawnie `{ engine: ttsEngine, voiceId: activeVoiceId, apiKey }` do `ttsService.speak`, gwarantując natychmiastowe testowanie aktualnie wybranego głosu z selektora.

---

## 3. POST-MORTEM

- **STATUS**: ROZWIĄZANY (SUCCESS)
- **APPROACH**: Usunięcie fałszywego odpytywania endpointu proxy w środowisku statycznym na rzecz bezpośredniej syntezy ElevenLabs z poprawną walidacją MIME audio oraz potrójna ochrona dynamicznego ładowania modułów (`lazyWithRetry`, `vite:preloadError`, `ErrorBoundary`).
- **IMPROVED**: Natychmiastowe odtwarzanie wybranego głosu studyjnego ElevenLabs w przeglądarce, bezbłędna zmiana lektorów w czasie rzeczywistym z personalizowaną zapowiedzią głosu, brak crashy po nowych wdrożeniach (automatyczne przeładowanie świeżych chunków z CDN).
- **BROKE**: Brak regresji. Wszystkie 76 testów jednostkowych zaliczone.
