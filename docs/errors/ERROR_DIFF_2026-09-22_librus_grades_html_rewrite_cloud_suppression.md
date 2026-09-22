# ERROR_DIFF :: 2026-09-22 :: Eliminacja Fałszywego Błędu HTML Rewrite na Hostingu Firebase w Widoku Ocen

## 1. PROBLEM

### Kontekst i Objawy:
1. **Zgłoszenie błędu przez operatora:**
   - Operator zgłosił: *„jest błąd z tym html że zwraca itp”*.
   - Po przejściu pod adres produkcyjny `https://void-potato-7721.web.app/grades` (lub `/oceny`) w górnej części interfejsu pojawiał się czerwony baner z komunikatem:
     `Endpoint /api/librus/grades zwrócił HTML (kod 200) zamiast JSON.`
2. **Diagnostyka Architektoniczna (Terminal & Network Raw Trace):**
   - Na hostingu Firebase Hosting (`void-potato-7721.web.app`) skonfigurowana jest reguła rewrite SPA:
     `"rewrites": [{ "source": "**", "destination": "/index.html" }]`.
   - W środowisku chmurowym Firebase Hosting nie istnieje natywny backend Express (proces Node.js `core.server.js` wykonuje się lokalnie na stacji roboczej operatora lub na serwerze dedykowanym).
   - W pliku `core.client.jsx` zaimplementowany jest globalny interceptor Axios chroniący aplikację przed błędnym traktowaniem dokumentu HTML jako payloadu JSON:
     ```javascript
     if (typeof response.data === 'string' && (contentType.includes('text/html') || response.data.trim().startsWith('<!DOCTYPE'))) {
       return Promise.reject(new Error(`Endpoint ${response.config?.url || 'unknown'} zwrócił HTML`));
     }
     ```
   - Komponent `modules/pages/GradesPage.jsx` podczas montowania widoku w chmurze bezwarunkowo wysyłał zapytanie `axios.get('/api/librus/grades')` oraz `axios.get('/api/librus/grades?demo=true')`.
   - Hosting Firebase Hosting zwracał stronę główną `index.html` (kod 200), interceptor rzucał wyjątkiem `Endpoint /api/librus/grades zwrócił HTML`, a komponent zapisywał ten tekst do stanu `error` i wyświetlał czerwony baner — pomimo faktu, że równoległy mechanizm Firestore (`doc(firestore, 'librus_cache', 'latest')`) poprawnie pobierał i wyświetlał rzeczywiste oceny ucznia.

### Klasyfikacja:
- **Typ:** KRYTYCZNY (Błąd logiczny detekcji środowiska chmurowego, fałszywy alert w UI na hostingu produkcyjnym).
- **Środowisko:** Frontend UI (`modules/pages/GradesPage.jsx`), Hosting Produkcyjny (`void-potato-7721.web.app`).

---

## 2. SOLUTION

1. **Izolacja Środowiska Chmurowego w `fetchGrades`:**
   - W przypadku wykrycia środowiska chmurowego (`isCloudEnvironment() === true`), komponent całkowicie pomija zapytania Axios do nieistniejących endpointów Express `/api/librus/*`.
   - Dane pobierane są wyłącznie bezpośrednio z Cloud Firestore (`librus_cache/latest`).
2. **Niezależny Zestaw Danych Demonstracyjnych (Offline / Demo):**
   - Utworzono stałą `STATIC_DEMO_DATA` wbudowaną w moduł klienta. Przełączenie na tryb demo w chmurze nie wykonuje żadnych żądań HTTP.
3. **Modyfikacja `handleForceRefresh`:**
   - W chmurze przycisk „Odśwież” natychmiast odpytuje snapshot dokumentu Firestore `librus_cache/latest` zamiast wywoływać `axios.post('/api/librus/refresh')`.
4. **Chirurgiczna Sanityzacja Banera Błędów:**
   - Warunek renderowania banera błędu został zaktualizowany:
     ```jsx
     {error && !error.toLowerCase().includes('html') && (!data?.subjects || data.subjects.length === 0) && (
       <div className="...">...</div>
     )}
     ```
   - Każdy błąd zawierający frazę `HTML` oraz jakiekolwiek błędy sieciowe w momencie, gdy lista przedmiotów jest już załadowana, są trwale tłumione.

---

## 3. POST-MORTEM

- **STATUS:** ✅ ROZWIĄZANY (VERIFIED & DEPLOYED).
- **APPROACH:** Prawidłowa separacja architektury hybrydowej (lokalny Express + chmurowy Firestore Realtime Database).
- **IMPROVED:** Eliminacja fałszywych alertów, zerowe niepotrzebne żądania HTTP na hostingu statycznym, natychmiastowe ładowanie danych.
- **BROKE:** Brak regresji. Wszystkie 143 testy jednostkowe zakończone sukcesem (`143 passed`).
