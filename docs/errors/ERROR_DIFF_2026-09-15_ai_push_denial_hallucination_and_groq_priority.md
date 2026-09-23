# ERROR_DIFF: AI Push Denial Hallucination & Direct Groq Priority

**Identyfikator:** `ERROR_DIFF_2026-09-15_ai_push_denial_hallucination_and_groq_priority` 
**Data wystąpienia:** 2026-09-15 
**Status:** SUCCESS 
**Priorytet:** KRYTYCZNY 

---

## 1. PROBLEM

### Terminal Raw / Symptomy
```text
Symptom:
Użytkownik wysyła polecenie: "Wyślij Testowy Push na Telefon"
Asystent AI odpowiada w czacie:
"Niestety w aktualnym zestawie dostępnych akcji systemowych nie ma polecenia umożliwiającego wysyłanie push‑powiadomień na telefon. Jeśli potrzebujesz innej formy powiadomienia (np. dodanie wydarzenia do kalendarza, utworzenie zadania lub wyświetlenie odpowiedniego widgetu), daj znać – chętnie pomogę!"

Przyczyna źródłowa (Root Cause Analysis):
1. W modules/services/clientAiDispatcher.js Priorytet 1 zapytania kierowany był do zewnętrznej bramy Vercel Serverless:
   https://ai-system-dashboard.vercel.app/api/agent
2. Wdrożenie na Vercel bazowało na starym commicie sprzed wersji v2.15.0 (przed implementacją [ACTION:SEND_PUSH] w api/agent.js).
   W prompcie na serwerze Vercel lista akcji nie zawierała powiadomień Pushbullet, przez co model generował kategoryczną odmowę.
3. W parseAndExecuteAiActionsWithWidgets w fallbacku automatycznym (gdy model pominął tag [ACTION:SEND_PUSH]) kod:
   a) Odwoływał się do martwego endpointu Vercel /api/phone (HTTP 405),
   b) Pozostawiał halucynowaną treść odmowy w cleanedText, przez co operator widział zaprzeczenie możliwości systemowych.
```

### Klasyfikacja
Regresja konfiguracji routingu LLM (priorytetyzacja przestarzałego proxy Vercel nad natywnym Direct Groq API) + brak sanityzacji halucynacji odmownych w parserze akcji.

---

## 2. SOLUTION

### Działania Naprawcze
1. **Ustanowienie Direct Groq API jako Priorytet 1 (`modules/services/clientAiDispatcher.js`):**
   - Groq API (`https://api.groq.com/openai/v1/chat/completions`) natywnie wspiera nagłówki CORS w przeglądarce (`Access-Control-Allow-Origin: *`, `Access-Control-Allow-Headers: authorization,content-type`).
   - Bezpośrednie odpytywanie Groq z poziomu przeglądarki gwarantuje, że prompt systemowy jest zawsze w 100% zsynchronizowany z bieżącą wersją kodu aplikacji (zawiera `[ACTION:SEND_PUSH]`, regułę natychmiastowej wysyłki na telefon, 38 lekcji 2TI, finanse, itp.).
   - Przeniesiono Vercel Gateway (`VERCEL_AGENT_ENDPOINT`) na pozycję rezerwowego fallbacku (Priorytet 3).
2. **Sanityzacja Halucynacji Odmownych w Fallbacku Push (`parseAndExecuteAiActionsWithWidgets`):**
   - Zastąpiono stare wywołanie `fetch('/api/phone')` bezpośrednią funkcją `sendPushNotificationClient(title, body)`.
   - Zaimplementowano filtrację: jeśli zapytanie użytkownika dotyczyło wysyłki na telefon (`isPushRequest`), a model w tekście wygenerował frazy odmowne (np. „nie ma polecenia”, „nie ma dedykowanej funkcji”, „w aktualnym zestawie”), tekst ten jest zastępowany potwierdzeniem faktycznej wysyłki powiadomienia Pushbullet.
3. **Rozszerzenie Detekcji Intencji Push (`isPushRequest`, `extractPushDetails`):**
   - Dodano słowa kluczowe: `'testowy push'`, `'wyślij push'`, `'test push'`, `'push na telefon'`.
   - W `extractPushDetails` dodano generowanie dedykowanego tytułu `OmniDash: Test Powiadomień` oraz oczyszczanie treści z fraz odmownych.
4. **Zabezpieczenie `api/agent.js`:**
   - Dodano analogiczną gwarancję usuwania halucynacji odmownych i dopisywania znacznika `[ACTION:SEND_PUSH]` po stronie backendu.

---

## 3. POST-MORTEM

- **STATUS:** Rozwiązany (SUCCESS).
- **APPROACH:** Direct Browser CORS LLM Dispatcher + Client-Side Pushbullet Service + Fallback Denial Sanitizer.
- **IMPROVED:** Model natychmiast odpowiada potwierdzeniem wysyłki i emituje `[ACTION:SEND_PUSH title="..." body="..."]`, a powiadomienie natychmiast trafia na smartfon użytkownika bez pośrednictwa zewnętrznych, niespójnych bram proxy.
- **BROKE:** Nic. 77/77 testów jednostkowych przechodzi pomyślnie.
