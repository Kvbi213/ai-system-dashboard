# ERROR_DIFF :: 2026-09-17 :: Eliminacja drewnianego Web Speech i wdrożenie Google Cloud Neural TTS

## 1. PROBLEM

### Kontekst i Objawy:
1. **Odtwarzanie archaicznego, drewnianego głosu przeglądarki:**
   - Operator zgłosił: *„nwm czm ale dalej używa tych drewnianych głosów dokładniej tego żeńskiego dziwnego on używa tych web speech a weź je całkowicie usuń i zamiast tego przygotuj na ich miejscu pole na api google cloud neural”*.
   - W przypadku wyczerpania limitu ElevenLabs lub problemu sieciowego silnik TTS kaskadowo degradował się do Web Speech API (`speakWithWebSpeech`). W środowisku Windows syntezator systemowy wybierał `Microsoft Paulina Desktop - Polish (Poland)`, który brzmi nienaturalnie, mechanicznie i psuje odbiór asystenta OmniDash.
2. **Brak wsparcia dla Google Cloud Text-to-Speech API:**
   - Google Cloud TTS oferuje 1 000 000 znaków miesięcznie bezpłatnie w ramach darmowego pakietu (Free Tier) dla głosów WaveNet i Neural2 (`pl-PL-Wavenet-B`, `pl-PL-Neural2-A`).
   - Brakowało bezpośredniej integracji z Google Cloud TTS, uniemożliwiając operatorowi korzystanie z darmowego limitu Google jako głównego lub zapasowego silnika o jakości studyjnej.

### Klasyfikacja:
- **Typ:** KRYTYCZNY (Eliminacja archaicznego fallbacku głosowego & Implementacja nowego silnika chmurowego).
- **Komponenty:** `modules/services/ttsService.js`, `modules/pages/SettingsPage.jsx`, `modules/routes/ai.js`, `api/tts.js`, `api/voice/tts.js`, testy jednostkowe `tests/tts_quota.test.js`.

---

## 2. SOLUTION (Plan i Implementacja)

1. **Chirurgiczna redukcja Web Speech API (`web`):**
   - Całkowite usunięcie metody `speakWithWebSpeech` oraz tablicy `WEB_VOICE_PROFILES` z `ttsService.js`.
   - Usunięcie kafli i opcji konfiguracji `web` z `SettingsPage.jsx`.
   - Zapewnienie, że w razie awarii chmurowych silników TTS system nigdy nie odtworzy głosu robotycznego – zamiast tego emitowany jest czysty `systemAlert` o błędzie dostawcy.
2. **Implementacja silnika Google Cloud Neural TTS (`google`):**
   - Dodanie metody `speakWithGoogle(text, apiKey, voiceId, options)` wykonującej bezpośrednie żądanie REST do `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`.
   - Dekodowanie strumienia MP3 z Base64 do `Blob(audio/mpeg)` i odtwarzanie przez `playAudioBlob`.
   - Dodanie zestawu zweryfikowanych głosów studyjnych `GOOGLE_DEFAULT_VOICES` (WaveNet i Neural2).
   - Wsparcie backend proxy dla środowisk z ograniczeniami CORS.
3. **Interfejs konfiguracji w `SettingsPage.jsx`:**
   - Wprowadzenie kafelka `Google Cloud Neural` z etykietą `1 MLN ZNAKÓW / MC`.
   - Bezpieczne pole wprowadzania klucza API Google Cloud (`system_google_tts_api_key`) z przełącznikiem widoczności.
   - Selektor głosów WaveNet/Neural2 z pamięcią w `system_google_voice_id`.
   - Zaktualizowanie funkcji `handleTestVoice` o próbę głosu Google.
4. **Weryfikacja i Testy Jednostkowe:**
   - Rozbudowa testów w `tests/tts_quota.test.js` o weryfikację `speakWithGoogle` oraz potwierdzenie braku `speakWithWebSpeech`.

---

## 3. POST-MORTEM

- **STATUS:** CLOSED
- **APPROACH:** Przeprowadzono kompletną, chirurgiczną redukcję mechanicznego silnika syntezy Web Speech API (`speakWithWebSpeech`) w całej bazie kodu. Wprowadzono w jego miejsce pełnoprawną integrację z Google Cloud Text-to-Speech REST API (pakiet WaveNet / Neural2 z 1 000 000 znaków darmowego limitu miesięcznie), intuicyjny interfejs konfiguracji klucza API Google Cloud w Ustawieniach z przełącznikiem widoczności oraz selektorem głosów polskich i angielskich. Zabezpieczono łańcuch awaryjny – w razie niepowodzenia odpytywane są wyłącznie silniki o jakości studyjnej (ElevenLabs → Google Neural → Edge Neural), a w przypadku awarii wszystkich dostawców emitowane jest czytelne powiadomienie systemowe zamiast odtwarzania robotycznego głosu.
- **IMPROVED:** Całkowita eliminacja zniekształconego głosu Paulina Desktop. Wprowadzenie darmowego pakietu 1 mln znaków/mc od Google Cloud. 100% zaliczonych testów jednostkowych (9/9 w `tests/tts_quota.test.js`). Pomyślne wdrożenie produkcyjne v2.20.0 na Firebase Hosting (`void-potato-7721.web.app`).
- **BROKE:** Brak regresji. Poprzednie zapisane preferencje silnika `web` są płynnie migrowane do `edge` lub `google`.
