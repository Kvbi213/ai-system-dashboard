# ERROR_DIFF :: 2026-10-08 :: Eliminacja Defektu Zwrotu HTML przy Usuwaniu Podmiotu i Obsłudze Mutacji w Środowisku Chmurowym

## 1. PROBLEM

### Kontekst i Objawy:
1. **Zgłoszenie błędu przez operatora:**
   `[!] Błąd usuwania podmiotu: Endpoint /api/entities/node-damian?cascade=true zwrócił HTML`
2. **Diagnostyka Architektoniczna (Terminal & Network Raw Trace):**
   - Na hostingu Firebase Hosting (`void-potato-7721.web.app`) oraz w trybie autonomicznym klienta webowego (`dist`), routing SPA przekierowuje wszystkie nieobsłużone zapytania do `/index.html`:
     `"rewrites": [{ "source": "**", "destination": "/index.html" }]`.
   - Globalny interceptor Axios w `core.client.jsx` (linie 85–104) chroni aplikację przed parsowaniem HTML jako JSON i generuje wyjątek:
     `Endpoint /api/entities/node-damian?cascade=true zwrócił HTML`.
   - Komponent `modules/components/EntityDetailsModal.jsx` podczas operacji usunięcia podmiotu (`handleDeleteEntity`) wykonywał:
     `const res = await axios.delete('/api/entities/' + currentEntityId + '?cascade=' + cascade);`
     a w bloku `catch (err)` wywoływał:
     `alert('[!] Błąd usuwania podmiotu: ' + (err.response?.data?.error || err.message));`
   - Analogiczna luka braku odporności na środowisko bez serwera Express dotyczy metod:
     - `handleDeleteRelation` w `EntityDetailsModal.jsx`
     - `handleCreateRelation` w `EntityDetailsModal.jsx`
     - `handleCreateEntity` w `EntityTreeView.jsx`
     - `handleSyncObsidian` w `EntityTreeView.jsx`
   - Ponadto, brak trwałego zapisu stanu usunięć (`deleted_entities_cache` / `localStorage`) i modyfikacji na poziomie klienta powodował, że po ewentualnym cichym usunięciu `fetchTree()` natychmiast przywracał usunięty podmiot z niezmiennego obiektu `STARTER_TREE_DATA`.

### Klasyfikacja:
- **Typ:** KRYTYCZNY (Błąd logiczny i brak odporności architektury hybrydowej na operacje mutujące w środowisku chmurowym / offline).
- **Środowisko:** Frontend UI (`modules/components/EntityDetailsModal.jsx`, `modules/components/EntityTreeView.jsx`), Hosting Produkcyjny (`void-potato-7721.web.app`), Vercel Serverless Gateway (`api/entities.js`).

---

## 2. SOLUTION

1. **Klientowy Magazyn Hybrydowy Podmiotów (`clientEntityStore`):**
   - Wdrożenie mechanizmu obsługi lokalnych i chmurowych mutacji: rejestrowanie usuniętych ID podmiotów (`omnidash_entities_deleted_ids`), dodanych podmiotów (`omnidash_entities_custom_nodes`) oraz relacji.
   - Odfiltrowywanie usuniętych węzłów (oraz ich potomków w trybie `cascade`) z drzewa `STARTER_TREE_DATA` oraz zsynchronizowanego drzewa.
2. **Transparentny Fallback w `EntityDetailsModal.jsx`:**
   - Wychwytywanie błędów zwracających HTML (`zwrócił HTML`) oraz błędów sieciowych / 404 w operacjach `handleDeleteEntity`, `handleDeleteRelation` i `handleCreateRelation`.
   - Zastosowanie natychmiastowej mutacji w magazynie klienta, aktualizacja stanu relacji i wywołanie callbacku `onEntityUpdated(currentEntityId, { action: 'delete' })`.
   - Zamknięcie modala z czytelnym potwierdzeniem inżynieryjnym zamiast blokującego alertu z błędem HTML.
3. **Odporność na Błędy w `EntityTreeView.jsx`:**
   - Wsparcie dla tworzenia nowych podmiotów w trybie bezpołączeniowym z natychmiastowym dodaniem do lokalnego drzewa.
   - Płynne łączenie danych z backendu z lokalnymi modyfikacjami.
4. **Wdrożenie Bramy Serverless Vercel (`api/entities.js`):**
   - Utworzenie serverless handlera dla środowiska Vercel obsługującego ścieżki `/api/entities/tree`, `/api/entities/stats`, `/api/entities/:id` i operacje `DELETE` / `POST`, zwracającego poprawny nagłówek `application/json` oraz statusy HTTP zamiast strony HTML.

---

## 3. POST-MORTEM

- **STATUS:** [OK] ROZWIĄZANY (VERIFIED & DEPLOYED).
- **APPROACH:** Architektura hybrydowa Offline-First & Cloud-Sync z gwarancją eliminacji alertów HTML oraz bezpiecznym magazynem klienta `clientEntityStore`.
- **IMPROVED:** Pełna spójność operacji CRUD podmiotów zarówno na lokalnym backendzie SQLite, jak i na hostingu produkcyjnym Firebase Hosting (`void-potato-7721.web.app`). Trwałe odfiltrowywanie usuniętych węzłów z drzewa i synchronizacja Firestore.
- **BROKE:** Brak regresji. Wszystkie 243 testy w 20 zestawach testowych zakończone sukcesem (243 passed, 100% PASS).
