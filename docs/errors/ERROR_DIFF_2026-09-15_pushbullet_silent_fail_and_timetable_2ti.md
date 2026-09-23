# ERROR_DIFF: Pushbullet Silent Fail & Timetable 2TI Synchronization

**Identyfikator:** `ERROR_DIFF_2026-09-15_pushbullet_silent_fail_and_timetable_2ti` 
**Data wystąpienia:** 2026-09-15 
**Status:** SUCCESS 
**Priorytet:** KRYTYCZNY 

---

## 1. PROBLEM

### Terminal Raw / Symptomy
```text
Symptom 1: Powiadomienia na telefon przez Pushbullet nie dochodzą, a asystent nie zgłasza żadnego błędu ("nawet nie pisze że nie może").
Terminal Raw Pushbullet API Query:
fetch('https://api.pushbullet.com/v2/pushes?limit=10')
-> Ostatni zarejestrowany push na koncie operatora: 10.09.2026, 12:56:46 ("OmniDash AI System Test połączenia Pushbullet").
-> Brak jakichkolwiek zapytań z dni 11-15.09.2026 w Pushbullet API.

Symptom 2: fetch('https://ai-system-dashboard.vercel.app/api/phone')
-> HTTP 405 Method Not Allowed / text/html (błędna trasa serwera Vercel)
-> clientAiDispatcher.js: fetch(pushEndpoint).catch(() => {});
-> Tłumienie wyjątków sieciowych pustym blokiem catch, brak weryfikacji response.ok, przedwczesna emisja toastu sukcesu.

Symptom 3: Dezaktualizacja planu lekcji (2TI od 14.09.2026) w bazie danych:
-> W bazie Cloud Firestore znajdowały się 40 rekordów, w tym 2 nieprawidłowe wpisy śmieciowe i przestarzałe sale/godziny (np. sala 1.2 zamiast 1.16, sala 35/24 zamiast 26, brak religii w poniedziałek o 8:00).
```

### Klasyfikacja
Defekt logiki komunikacji sieciowej (Silent Catch / False Success Toast) + Brak Direct Client CORS dla Pushbullet + Brak dedykowanego modułu konfiguracyjnego w UI + Dezaktualizacja harmonogramu bazy Firestore i SQLite.

---

## 2. SOLUTION

### Działania Naprawcze
1. **Natywny Serwis Direct Pushbullet (`modules/services/pushbulletService.js`):**
   - Pushbullet API (`https://api.pushbullet.com/v2/pushes`) wspiera natywnie CORS (`access-control-allow-origin: *`).
   - Wdrożono funkcję `sendPushNotificationClient(title, body)` odpytującą bezpośrednio Pushbullet z nagłówkiem `Access-Token`.
   - Weryfikacja `res.ok` oraz statusów HTTP (400, 401, 403, 500). W przypadku braku autoryzacji lub błędu emitowany jest czerwony toast błędu z rzeczywistą przyczyną odrzuconego zapytania.
   - Wdrożono `testPushbulletConnection(token)` sprawdzający użytkownika przez `v2/users/me` i wysyłający natychmiastowy push testowy.
2. **Refaktoryzacja `modules/services/clientAiDispatcher.js`:**
   - Wyeliminowano cichy `fetch(pushEndpoint).catch(() => {})`.
   - Podpięto `sendPushNotificationClient` pod znacznik akcji `[ACTION:SEND_PUSH]` oraz fallback autonomiczny.
   - W przypadku niepowodzenia użytkownik otrzymuje rzetelny komunikat o przyczynie błędu w czacie i toastach.
3. **Zarządzanie Poświadczeniami w UI (`modules/pages/SettingsPage.jsx`):**
   - Dodano sekcję `Pushbullet (Powiadomienia na Smartfon)` w zakładce `Bazy & Bezpieczeństwo`.
   - Dodano pole wprowadzania `Access-Token` z przełącznikiem widoczności hasła, zapisem do `localStorage` oraz przyciskiem `Wyślij Testowy Push na Telefon`.
   - Wprowadzono wskaźnik stanu połączenia (Zielony: `POŁĄCZENIE DIRECT AKTYWNE`, Żółty: `BRAK KLUCZA`).
4. **Aktualizacja Planu Lekcji 2TI (od 14.09.2026 - Grupa 1):**
   - Poprawiono skrypt `scripts/seed_real_timetable.js` oraz `INITIAL_FIRESTORE_DATA.timetable` w `modules/services/cloudSync.js`.
   - Wyczyszczono stare i śmieciowe wpisy z Firestore (`void-potato-7721`).
   - Zapisano 38 dokładnych lekcji dla Grupy 1 do Cloud Firestore oraz SQLite `data/tasks.sqlite`.

---

## 3. POST-MORTEM

- **STATUS:** RESOLVED / SUCCESS.
- **APPROACH:** Direct Client-Side Network Architecture (CORS) + rygorystyczna obsługa błędów sieciowych i tokenów.
- **IMPROVED:** Asystent i system nigdy więcej nie fałszują statusu wysyłki push; operator otrzymuje natychmiastowe testy z UI oraz bezpośrednie powiadomienia na telefon.
- **BROKE:** Żadne istniejące funkcjonalności nie zostały naruszone; wszystkie 76 testów automatycznych zakończyły się sukcesem.
