# IMPLEMENTATION PLAN :: ENTITIES & INTELLIGENCE OSINT HUB (v2.31.0)
**Architektura struktury drzewiastej pochodzenia (Tree & Graph) oraz integracja z wywiadem OSINT**

- **Wersja docelowa:** `v2.31.0`
- **Standard wykonawczy:** Protokół Antigravity (NANO v3.2) | Zero-Emoji Policy | Zero-Trust Architecture
- **Status:** W TRAKCIE REALIZACJI (FAZA 1 - FAZA 4)

---

## 1. ARCHITEKTURA STRUKTURY DRZEWIASTEJ (TREE & GRAPH)

Model węzłowy umożliwiający budowanie dowolnie głębokich drzew pochodzenia oraz relacji sieciowych:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     DRZEWO POCHODZENIA (LOCATION TREE)                      │
│                                                                             │
│  [ REGION: Polska ]                                                         │
│    └── [ SUBREGION: Woj. Pomorskie ]                                        │
│          └── [ CITY: Starogard Gdanski ]                                    │
│                └── [ ORG: ZSE im. Noblistow Polskich ]                      │
│                      ├── [ PERSON: Jakub Lis ] ──► (Lead Dev)               │
│                      └── [ PERSON: Damian ]    ──► (Gamer / Modder)         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. HARMONOGRAM ROZWOJU (FAZY IMPLEMENTACJI)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FAZY ROZWOJU (FAZA 1 - 4)                          │
│                                                                             │
│  FAZA 1: Model Danych SQLite WAL & Indeksy Drzewiaste (Nodes & Paths)       │
│     │                                                                       │
│     ▼                                                                       │
│  FAZA 2: Silnik Ekstrakcji OSINT & Parser Hierarchii Pochodzenia            │
│     │                                                                       │
│     ▼                                                                       │
│  FAZA 3: Tool Calling Agenta AI, Autorejestracja i Policy Engine            │
│     │                                                                       │
│     ▼                                                                       │
│  FAZA 4: Interfejs UI Glassmorphism (Tree View & Entity Explorer)           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### FAZA 1: Baza Danych SQLite WAL & Schema Drzewa
**Priorytet:** KRYTYCZNY (Fundament struktury danych)  
**Pliki docelowe:** `modules/database.js`, `modules/services/entitiesService.js`, `tests/entities_tree.test.js`

1. **Tabela `entities` (Węzły drzewa):**
   - `id` (TEXT PRIMARY KEY) – Unikalny identyfikator UUID v4 / slug.
   - `parent_id` (TEXT NULL) – ID węzła nadrzędnego (np. ID Miasta dla Organizacji).
   - `type` (`COUNTRY`, `REGION`, `CITY`, `ORGANIZATION`, `PERSON`, `ASSET`).
   - `name` (TEXT NOT NULL) – Nazwa lub imię i nazwisko.
   - `tree_path` (TEXT) – Znormalizowana ścieżka hierarchiczna (np. `/polska/pomorskie/starogard_gdanski/zse/`).
   - `attributes_json` (TEXT JSON DEFAULT '{}') – Dane dodatkowe (rola, wiek, PESEL/NIP, notatki, aliasy, kontakty).
   - `created_at`, `updated_at` (DATETIME DEFAULT CURRENT_TIMESTAMP).

2. **Tabela `entity_relations` (Krawędzie grafu relacji):**
   - `id` (TEXT PRIMARY KEY) – UUID v4.
   - `source_id` (TEXT NOT NULL) – Identyfikator podmiotu źródłowego.
   - `target_id` (TEXT NOT NULL) – Identyfikator podmiotu docelowego.
   - `relation_type` (`EMPLOYED_AT`, `FRIEND_OF`, `OWNER_OF`, `ASSOCIATED_WITH`, `STUDENT_OF`).
   - `metadata_json` (TEXT JSON DEFAULT '{}') – Właściwości relacji (okres, stanowisko, siła powiązania).
   - `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP).

3. **Indeksy wydajnościowe:**
   - `idx_entities_parent` (`parent_id`)
   - `idx_entities_tree_path` (`tree_path`)
   - `idx_entities_type` (`type`)
   - `idx_entity_relations_source` (`source_id`), `idx_entity_relations_target` (`target_id`)

4. **Operacje CRUD i budowa drzewa (`entitiesService.js`):**
   - `createEntity({ name, type, parent_id, attributes })` z auto-kalkulacją `tree_path`.
   - `getEntityById(id)`, `getEntityTree(rootIdOrPath)`, `getAncestors(id)`, `getDescendants(id)`.
   - `createRelation({ source_id, target_id, relation_type, metadata })`.
   - `formatTreeAscii(rootIdOrPath)` – bezpośrednie formatowanie drzewa ASCII dla terminala.

---

### FAZA 2: Silnik OSINT, Geokodowanie & Parser Pochodzenia
**Priorytet:** WYSOKI (Pozyskiwanie i dopasowywanie do drzewa)  
**Pliki docelowe:** `modules/services/osintService.js`, `modules/routes/entities.js`, `core.server.js`

1. **Automatyczne mapowanie geolokalizacyjne:**
   - Przekształcanie surowych danych lokalizacji na łańcuch nadrzędny (`Kraj ➔ Województwo / Stan ➔ Miasto`).
   - Słownik standaryzacji polskich województw i głównych miast (np. "Starogard" ➔ "Starogard Gdański" ➔ woj. Pomorskie ➔ Polska).
2. **Kojarzenie Podmiotów i Rejestrów:**
   - Łączenie danych OSINT (domeny, e-maile, powiązania) z istniejącymi węzłami organizacji i osób w drzewie.
3. **API REST Endpoints:**
   - `GET /api/entities/tree` – pobieranie pełnego drzewa lub poddrzewa.
   - `GET /api/entities/:id` – szczegóły podmiotu wraz z relacjami.
   - `POST /api/entities` – dodanie węzła.
   - `POST /api/entities/relations` – dodanie relacji.
   - `GET /api/entities/export/ascii` – podgląd tekstowy drzewa.

---

### FAZA 3: Tool Calling Agenta AI & Policy Engine Zero-Trust
**Priorytet:** WYSOKI (Autonomia Agenta)  
**Pliki docelowe:** `modules/ai/tools.js`, `modules/agent.js`, `modules/services/clientAiDispatcher.js`

1. **Definicje Narzędzi:**
   - `ADD_TREE_ENTITY(parent_id, type, name, attributes)` – tworzenie węzła w drzewie pochodzenia.
   - `GET_ENTITY_TREE(root_id_or_path)` – pobieranie sformatowanego drzewa od wskazanego poziomu.
   - `SEARCH_PUBLIC_ENTITY(query, location_context)` – wyszukiwanie danych osób/organizacji z uwzględnieniem kontekstu lokalizacji.
   - `LINK_ENTITIES(source_id, target_id, relation_type, metadata)` – tworzenie relacji grafowej między podmiotami.
2. **Policy Engine & Bezpieczeństwo:**
   - Twarda blokada skanowania adresów RFC1918 i link-local (SSRF Shield).
   - Wymóg parametru `confirmed: true` przy modyfikacjach węzłów nadrzędnych poziomu COUNTRY / REGION.

---

### FAZA 4: Interfejs UI Glassmorphism & Tree View
**Priorytet:** ŚREDNI (Wizualizacja)  
**Pliki docelowe:** `modules/components/EntityTreeView.jsx`, `modules/components/EntityDetailsModal.jsx`, `modules/pages/OSINTPage.jsx`

1. **Interaktywne Drzewo (Tree View):**
   - Rozwijanie i zwijanie gałęzi w stylu Dark-Tech Glassmorphism.
   - Wskaźniki liczby podmiotów zależnych.
   - Oznaczenia typów: `[COUNTRY]`, `[REGION]`, `[CITY]`, `[ORG]`, `[PERSON]`.
2. **Panel Szczegółów (Entity Details Panel):**
   - Podgląd atrybutów, ról, powiązań sieciowych, bezpośrednich rodziców i dzieci.
3. **Eksport i Podgląd Terminalowy:**
   - Przełącznik widoku: Drzewo Graficzne vs Terminal ASCII vs Struktura JSON.

---

## 3. FORMAT PODGLĄDU TERMINALOWEGO (ASCII TREE RENDERER)

```text
================================================================================
  OMNIDASH :: ENTITY TREE EXPLORER [v2.31.0]
================================================================================

[ROOT]
└── [COUNTRY] POLSKA
    ├── [REGION] Województwo Pomorskie
    │   └── [CITY] Starogard Gdański
    │       └── [ORG] ZSE im. Noblistów Polskich
    │           ├── [PERSON] Jakub Lis [Lead Dev / Technik Informatyk]
    │           └── [PERSON] Damian [Gamer / Modder]
    └── [REGION] Województwo Mazowieckie
        └── [CITY] Warszawa
            └── [PERSON] Michał Nowak [Backend Dev]

--------------------------------------------------------------------------------
Suma podmiotów w gałęzi: 3 osoby, 1 organizacja, 2 miasta, 2 regiony, 1 kraj
================================================================================
```
