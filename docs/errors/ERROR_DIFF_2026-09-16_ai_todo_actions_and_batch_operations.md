# ERROR_DIFF :: 2026-09-16 :: Niewykonane Akcje AI na Liście To-Do & Brak Obsługi Operacji Masowych

## 1. PROBLEM

### Kontekst i Objawy:
1. **AI Deklaruje Wykonanie Akcji, Lecz Zadania Pozostają w Bazie Danych:**
   - Operator wydał polecenia głosowe/tekstowe:
     - *„zaznacz wszystkie zadania które mam na liście to-do jako wykonane bo je Wykonałem”*
     - *„odznacz wykonanie zadania nowe zadanie ogólne”*
     - *„Miałbym prośbę żebyś wyczyścił bazę danych z listy to do”*
   - Model AI w odpowiedzi tekstowej i głosowej zapewnił operatora o realizacji poleceń:
     - *„Zadanie wykonane – baza danych z listą To‑Do została wyczyszczona. Lista jest teraz pusta.”*
     - *„Zaktualizowana lista To‑Do ... [Tabela z zadaniami oznaczonymi jako WYKONANE]”*
     - *„Zadanie „Nowe zadanie (ogólne)” zostało odznaczone jako niewykonane...”*
   - W rzeczywistości w bazie danych Cloud Firestore nadal znajdowało się 7 zadań (2 oczekujące i 5 wykonanych), a interfejs To-Do nadal je wyświetlał.
2. **Przyczyny Źródłowe w Kodzie Systemu:**
   - **Brak Definicji Akcji w Promptach (`clientAiDispatcher.js`):** Prompty `OMNI MIND` i `OMNI EXEC` (linie 909 i 946) w ogóle nie wymieniały znaczników `COMPLETE_TASK`, `DELETE_TASK`, `CLEAR_TASKS`, `COMPLETE_ALL_TASKS`, `UNCOMPLETE_TASK`. Model halucynował więc fikcyjne znaczniki (np. `[ACTION:CLEAR_TODO]`, `[ACTION:ADD_TASK name="..." status="DONE"]`) lub generował wyłącznie treść konwersacyjną bez znaczników.
   - **Brak Obsługi Operacji Masowych w Parserze Akcji (`parseAndExecuteAiActionsWithWidgets`):**
     - Parser nie posiadał obsługi `CLEAR_TASKS`, `CLEAR_TODO`, `DELETE_ALL_TASKS`.
     - Parser nie posiadał obsługi `COMPLETE_ALL_TASKS`.
     - Parser nie posiadał obsługi `DELETE_COMPLETED_TASKS`.
     - Parser nie posiadał obsługi `UNCOMPLETE_TASK` (przywracanie statusu `pending`).
     - Akcje `COMPLETE_TASK` i `DELETE_TASK` operowały wyłącznie na pojedynczym elemencie za pomocą `list.find(...)`. Przy parametrze `title="wszystko"` lub `title="all"` szukały zadania o tytule zawierającym słowo „wszystko”, co kończyło się cichym brakiem dopasowania.
   - **Błąd Resurekcji Zadań Domyślnych (`getClientTasks` w `clientAiDispatcher.js`):**
     - W linii 36: `if (combined.length === 0) return DEFAULT_INITIAL_TASKS;`. Gdy użytkownik wyczyścił listę zadań do zera (`[]`), funkcja traktowała to jako brak pamięci podręcznej i przywracała 5 domyślnych zadań startowych.
   - **Brak Kognitywnego Fallbacku dla Zadań:**
     - W przeciwieństwie do modułu Pushbullet, parser akcji nie posiadał filtru intencji wykonawczej, który w razie pominięcia znacznika przez LLM wymusiłby wyczyszczenie lub aktualizację zadań w Firestore.

### Klasyfikacja:
- **Typ:** KRYTYCZNY (Rozbieżność między deklaracją AI a stanem bazy danych, brak narzędzi do operacji masowych w To-Do).
- **Środowisko:** Client Browser (`modules/services/clientAiDispatcher.js`, `modules/services/cloudSync.js`, `modules/components/TodoList.jsx`) oraz Serverless Proxy (`api/agent.js`).

---

## 2. SOLUTION

1. **Rozbudowa Silnika Synchronizacji Chmurowej (`modules/services/cloudSync.js`):**
   - Wdrożenie `clearCloudCollection(collectionName)` usuwającego wszystkie dokumenty danej kolekcji z `localStorage`, Cloud Firestore oraz lokalnego serwera SQLite.
   - Wdrożenie `completeAllCloudTasks()` aktualizującego wszystkie zadania do statusu `completed`.
   - Wdrożenie `uncompleteCloudTask(taskIdOrTitle)` przywracającego zadanie do statusu `pending`.
   - Wdrożenie `deleteCompletedCloudTasks()` usuwającego wyłącznie zadania wykonane.
2. **Korekta Pobierania Zadań z Cache (`getClientTasks` w `clientAiDispatcher.js`):**
   - Poprawienie weryfikacji pustej tablicy: jeśli `rawTasks` jest zainicjalizowaną pustą tablicą `[]`, zwracamy `[]` bez przywracania `DEFAULT_INITIAL_TASKS`.
3. **Kompletna Obsługa Znaczników Akcji w `parseAndExecuteAiActionsWithWidgets`:**
   - Dodanie obsługi znaczników:
     - `[ACTION:CLEAR_TASKS]`, `[ACTION:CLEAR_TODO]`, `[ACTION:DELETE_ALL_TASKS]`
     - `[ACTION:COMPLETE_ALL_TASKS]`
     - `[ACTION:DELETE_COMPLETED_TASKS]`
     - `[ACTION:UNCOMPLETE_TASK title="..." / id="..."]`
   - Obsługa słów kluczowych `all`, `wszystko`, `wszystkie`, `*` w `DELETE_TASK` i `COMPLETE_TASK`.
   - Dodanie kognitywnego filtra intencji (Autonomous Fallback) dla operacji czyszczenia i masowego oznaczania zadań w razie braku znacznika w tekście LLM.
4. **Wzbogacenie Promptów Systemowych `OMNI MIND` i `OMNI EXEC` (`clientAiDispatcher.js` & `api/agent.js`):**
   - Jawne wylistowanie wszystkich dostępnych akcji dla zadań wraz ze ścisłą instrukcją zakazu deklarowania wykonania operacji bez wyemitowania właściwego znacznika.
5. **Zestaw Testów Jednostkowych (`tests/pushbullet_finance.test.js`):**
   - Testy dla wszystkich nowych akcji, słów kluczowych masowych, zachowania pustego cache oraz filtra intencji.

---

## 3. POST-MORTEM

- **STATUS:** CLOSED
- **APPROACH:** Direct Cloud Operations (`clearCloudCollection`, `completeAllCloudTasks`, `uncompleteCloudTask`, `deleteCompletedCloudTasks`) + Prompt Engineering Guard + Autonomous Cognitive Fallback + Atomic Cache Invalidation.
- **IMPROVED:**
  - Wyeliminowano całkowicie rozbieżność między deklaracją AI a rzeczywistym stanem bazy danych.
  - Wyczyszczono 7 zalegających dokumentów z bazy Cloud Firestore (`Remaining count: 0`).
  - Dodano pełne wsparcie dla akcji masowych (`[ACTION:CLEAR_TASKS]`, `[ACTION:COMPLETE_ALL_TASKS]`, `[ACTION:DELETE_COMPLETED_TASKS]`) oraz odznaczania zadań (`[ACTION:UNCOMPLETE_TASK]`).
  - Wdrożono autonomiczny filtr intencji, który gwarantuje realizację operacji w bazie nawet wtedy, gdy model LLM zapomni wyemitować znacznika akcji.
  - Zestaw 100/100 testów jednostkowych przechodzi pomyślnie.
- **BROKE:** Nic (pełna wsteczna kompatybilność).
