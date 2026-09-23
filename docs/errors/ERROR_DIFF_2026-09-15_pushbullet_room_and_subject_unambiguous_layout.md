# ERROR_DIFF: Pushbullet Room & Subject Unambiguous Layout & Universal Formatter Integration

**Identyfikator:** `ERROR_DIFF_2026-09-15_pushbullet_room_and_subject_unambiguous_layout` 
**Data wystąpienia:** 2026-09-15 
**Status:** SUCCESS 
**Priorytet:** KRYTYCZNY 

---

## 1. PROBLEM

### Terminal Raw / Symptomy
```text
Symptom:
Użytkownik zgłasza: "jest lepiej ale dalej są problemy by jednoznacznie odczytać"
oraz przesyła zrzut ekranu smartfona Motorola Moto g34 5G.
Na zrzucie widoczne są dwa stany powiadomień Pushbullet:
1. Pierwsza wiadomość testowa:
   "• 08:00 - 08:45: PUTKOM (Sala 1.16, PW)
    • 08:50 - 09:35: PUTKOM (Sala 1.16, PW)..."
   - Skróty PUTKOM/PSOPE mogą być niejednoznaczne dla ucznia.
   - Sala lekcyjna umieszczona na samym końcu wiersza (po nazwie przedmiotu) ulega zawijaniu na wąskich ekranach smartfonów, przez co odnalezienie numeru sali wymaga czytania całego wiersza.
2. Druga wiadomość (wygenerowana przez agenta):
   "Plan lekcji – 15.09.2026
    08:00-08:45 Pracownia urządzeń techniki komputerowej (Sala 1.16, PW, Laboratorium)\n08:50-09:35..."
   - Ciąg dalszy występowania literalnych znaków "\n" na początku wierszy z powodu braku objęcia formaterem formatPushText wszystkich ścieżek wysyłki (m.in. sendPushNotification w modules/pushbullet.js, api/phone.js oraz modules/agent.js).
   - Nazwy przedmiotów o długości ponad 40 znaków ("Pracownia urządzeń techniki komputerowej") powodują wielokrotne łamanie wierszy (3-4 linie na pojedynczą lekcję), zalewając ekran smartfona nieczytelnym blokiem tekstu.
   - Zbędny szum informacyjny: dopiski ", Laboratorium", ", Wykład", ", Ćwiczenia", ", Inne".
```

### Klasyfikacja
Wada ergonomii wizualnej na urządzeniach mobilnych (Mobile UX Clutter) oraz niekompletna integracja normalizatora tekstu na backendowych ścieżkach wysyłki powiadomień.

---

## 2. SOLUTION

### Działania Naprawcze
1. **Architektura Ergonomicznego Wiersza Lekcji (`• HH:MM [Sala] Przedmiot (Nauczyciel)`):**
   - Sala lekcyjna przeniesiona bezpośrednio po przedziale czasowym w czytelnym nawiasie kwadratowym `[Sala 1.16]`, `[Hala]`, `[Sala 26]`. Uczeń natychmiast widzi godzinę i salę bez konieczności szukania na końcu zawiniętego wiersza.
   - Słownik standaryzacji i skracania długich nazw (`cleanSubjectName`):
     - `Pracownia urządzeń techniki komputerowej` -> `Pracownia UTK`
     - `Pracownia systemów operacyjnych` -> `Pracownia SO`
     - `Wychowanie fizyczne` -> `WF`
     - `Zajęcia z wychowawcą` -> `Godz. wychowawcza`
     - `Urządzenia techniki komputerowej` -> `Urządzenia TK`
   - Odsianie zbędnego szumu akademickiego (usuwanie dopisków `Laboratorium`, `Wykład`, `Ćwiczenia`, `Inne`).
   - Bezpieczna ekstrakcja inicjałów nauczyciela z polskich znaków diakrytycznych (`PW`, `GŁ`, `ZJ`, `SR`, `ZB`).
2. **Uniwersalna Integracja Formatera na Wszystkich Ścieżkach:**
   - Wdrożono `formatPushText` w:
     - `modules/services/pushbulletService.js` (klient przeglądarkowy)
     - `modules/pushbullet.js` (`sendPushNotification` na serwerze Express)
     - `api/phone.js` (serverless endpoint)
     - `api/agent.js` (prompt systemowy i funkcja fallback)
     - `modules/services/clientAiDispatcher.js` (prompty mentora i workera oraz context summary)
3. **Weryfikacja na Żywo (Live Device Testing):**
   - Wysłano na smartfon operatora powiadomienie Pushbullet (`ujylmeQi3B6sjuOHTViaBM`) z nowym układem. Każda lekcja mieści się w 1-2 wierszach, a sala i przedmiot są jednoznacznie czytelne w ułamku sekundy.
4. **Zestaw Testów Jednostkowych (`tests/pushbullet_finance.test.js`):**
   - 27 testów przechodzi pomyślnie (83/83 PASS w całym projekcie).

---

## 3. POST-MORTEM

- **STATUS:** Rozwiązany (SUCCESS).
- **APPROACH:** Mobile-First Layout Optimization + Context Cleansing + Multi-Path Formatter Enforcement.
- **IMPROVED:** Powiadomienie planu lekcji na telefonie jest w 100% jednoznaczne, zwarte, estetyczne i natychmiast przyswajalne dla operatora.
- **BROKE:** Brak regresji. Wszystkie testy PASS.
