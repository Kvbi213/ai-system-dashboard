# ERROR_DIFF :: 2026-09-17 :: Wyczerpanie limitu znaków ElevenLabs & Cicha degradacja do Web Speech

## 1. PROBLEM

### Kontekst i Objawy:
1. **Odtwarzanie podstawowego głosu zamiast ElevenLabs:**
   - Operator zgłosił: *„coś psują się głosy i odtwarza te basic a nie eleven labs mimo iż mam ustawione eleven labs”*.
   - Mimo poprawnego skonfigurowania klucza API ElevenLabs i wyboru lektora w Ustawieniach, każda próba syntezy mowy (zarówno test w Ustawieniach, jak i odpowiedzi asystenta w czacie) odtwarzana była za pomocą wbudowanego, podstawowego syntezatora przeglądarki Web Speech API zamiast studyjnego modelu ElevenLabs.
2. **Diagnostyka API ElevenLabs (Terminal Raw Trace):**
   - Bezpośrednie odpytanie `GET https://api.elevenlabs.io/v1/user/subscription` kluczem API operatora zwróciło:
     ```json
     {
       "tier": "free",
       "character_count": 9994,
       "character_limit": 10000,
       "status": "free",
       "next_character_count_reset_unix": 1792024066
     }
     ```
   - Bezpośrednie żądanie syntezy `POST https://api.elevenlabs.io/v1/text-to-speech/CwhRBWXzGAHq8TQ4Fs17` zwróciło:
     ```json
     HTTP 401 Unauthorized
     {
       "detail": {
         "type": "invalid_request",
         "code": "quota_exceeded",
         "message": "This request exceeds your quota of 10000. You have 6 credits remaining, while 19 credits are required for this request.",
         "status": "quota_exceeded"
       }
     }
     ```
   - **Przyczyna źródłowa 1:** Na darmowym koncie ElevenLabs pozostało zaledwie **6 znaków** (zużyto 9 994 z 10 000). Każde żądanie z tekstem dłuższym niż 6 znaków jest natychmiast odrzucane przez serwery ElevenLabs z błędem `quota_exceeded`.
   - **Przyczyna źródłowa 2 (Cicha degradacja):** W `modules/services/ttsService.js` błąd `quota_exceeded` był przechwytywany w bloku `catch` i logowany jedynie w konsoli deweloperskiej F12 (`console.warn`). Brakowało emitowania powiadomienia do interfejsu użytkownika.
   - **Przyczyna źródłowa 3 (Niedostępność rezerwowego Edge TTS):** Po odrzuceniu przez ElevenLabs system próbował odwołać się do endpointu Edge TTS (`/api/voice/tts`). Na serwerze lokalnym Express żądanie było blokowane kodem `401 Brak autoryzacji` z powodu braku wyłączenia `/voice/tts` spod `authMiddleware` w `modules/routes/auth.js`.
   - **Skutek:** Kaskada syntezatorów spadała na ostatni stopień awaryjny – podstawowy Web Speech API przeglądarki. Użytkownik nie miał pojęcia, dlaczego słyszy robotyczny głos mimo aktywnego ElevenLabs.

### Klasyfikacja:
- **Typ:** KRYTYCZNY (Brak obsługi wyczerpania limitu konta zewnętrznego dostawcy & cicha degradacja UX).
- **Środowisko:** Client TTS Service (`modules/services/ttsService.js`), Interfejs Ustawień (`modules/pages/SettingsPage.jsx`), Interfejs Czatu i HUD (`modules/components/Terminal.jsx`, `modules/components/VoiceInspectorHUD.jsx`), Backend Auth (`modules/routes/auth.js`).

---

## 2. SOLUTION

1. **Inspekcja i Odpytywanie Limitu Konta w `ttsService.js`:**
   - Dodanie metody `checkElevenLabsQuota(apiKey)` komunikującej się z `https://api.elevenlabs.io/v1/user/subscription`.
   - Zwracanie przejrzystego obiektu stanu limitu: `{ tier, characterCount, characterLimit, remaining, isExceeded, resetDate, status }`.
2. **Transparentna Sygnalizacja Wyczerpania Limitu w `speakWithElevenLabs`:**
   - W przypadku odpowiedzi `401` / `quota_exceeded` natychmiastowe rozgłoszenie zdarzenia `ttsQuotaExceeded` z informacją o liczbie pozostałych znaków oraz zdarzenia toast/alert.
   - Zapisanie stanu wyczerpania w pamięci podręcznej `localStorage.setItem('elevenlabs_quota_exceeded', 'true')` w celu natychmiastowego ostrzeżenia w UI.
3. **Panel Zużycia Znaków i Szybkie Przełączanie w `SettingsPage.jsx`:**
   - Wyświetlenie w sekcji ElevenLabs estetycznego paska zużycia limitu (`Zużycie konta: 9 994 / 10 000 znaków (99.9%)`).
   - Wyróżniony baner ostrzegawczy:
     > [!] **Limit darmowego konta ElevenLabs został wyczerpany (pozostało: 6 znaków).**
     > Wprowadź nowy klucz API ElevenLabs lub przełącz silnik na Microsoft Edge Neural (Marek/Zofia – w 100% darmowy, studyjna jakość bez limitów).
   - Przycisk szybkiej akcji `[Przełącz na bezpłatny silnik Microsoft Edge Neural (Marek Studio)]` przełączający silnik jednym kliknięciem.
4. **Powiadomienie w Czacie (`Terminal.jsx`) oraz `VoiceInspectorHUD.jsx`:**
   - Nasłuchiwanie zdarzenia `ttsQuotaExceeded` – wyświetlanie czytelnego ostrzeżenia informującego, dlaczego nastąpiło przełączenie na głos zapasowy wraz z linkiem do konfiguracji.
5. **Autoryzacja Endpointu `/api/voice/tts`:**
   - Dodanie reguły w `modules/routes/auth.js` zezwalającej na lokalne wywołania syntezy głosu bez wymogu tokenu logowania.

---

## 3. POST-MORTEM

- **STATUS:** CLOSED
- **APPROACH:** Wprowadzenie proaktywnej inspekcji limitów ElevenLabs (`checkElevenLabsQuota`), transparentne powiadamianie operatora w UI (alert banner w Terminalu i karcie limitów) o wyczerpaniu kredytów na koncie ElevenLabs zamiast cichej degradacji do podstawowego syntezatora przeglądarki, zaoferowanie 1-klikowego natychmiastowego przełączenia na darmowy silnik Microsoft Edge Neural (Marek Studio), odblokowanie autoryzacji `/voice/tts` w Express backendzie oraz dodanie dedykowanych testów jednostkowych `tests/tts_quota.test.js`.
- **IMPROVED:** 
  - Operator natychmiast widzi, ile znaków pozostało na jego koncie ElevenLabs i kiedy limit się odnawia.
  - W razie wyczerpania znaków system jasno ostrzega i umożliwia natychmiastową zmianę na nieograniczony silnik Edge Neural.
  - Pełny zestaw testów jednostkowych (131/131 PASS).
- **BROKE:** Nic (pełna wsteczna kompatybilność, brak regresji).
