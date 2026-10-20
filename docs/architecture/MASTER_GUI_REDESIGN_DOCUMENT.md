# MASTER SYSTEM DOCUMENT :: ARCHITEKTURA REDESIGNU GUI & MOBILE-FIRST (v3.0)
> Dokument Nadrzędny Inżynierii Interfejsu: Kompleksowy Audyt, Standard Designu, Architektura Mobilna oraz Specyfikacja Unifikacji GUI Ekosystemu OmniDash.

- **Identyfikator Wersji:** `v3.0.0-PROPOSAL` (Baza produkcyjna: `v2.34.2`)
- **Data Opracowania:** Październik 2026
- **Status Operacyjny:** `[~] AWAITING_DESIGN_SPEC` (Oczekiwanie na wytyczne estetyczne operatora przed modyfikacją kodu)
- **Standard Inżynieryjny:** Protokół Antigravity (NANO v3.2) | Zero-Emoji Policy | Zero-Trust Architecture
- **Repozytorium:** `https://github.com/Kvbi213/ai-system-dashboard`
- **Instancja Chmurowa:** `https://void-potato-7721.web.app`

---

## 1. WPROWADZENIE I CEL STRATEGICZNY

System OmniDash rozrósł się z prostego dashboardu telemetrycznego do rozbudowanego, wielomodułowego systemu operacyjnego z 12+ podstronami, integracjami zewnętrznymi (Librus, Pushbullet, Groq AI, SQLite, Firestore), asystentem głosowym oraz bazami wiedzy.

W toku szybkiego przyrostu funkcjonalności powstał **znaczący dług techniczny w warstwie prezentacji**:
1. **Degradacja doświadczenia mobilnego:** Aplikacja na smartfonach wykazuje wady ergonomiczne, zakleszczenia gestów przewijania (scroll-jacking), nakładanie się elementów nawigacji na treść oraz nieoptymalne strefy dotykowe.
2. **Architektoniczna niespójność podstron:** Poszczególne moduły (np. `/workouts` vs `/timetable` vs `/finances`) powstawały w różnych etapach, przez co posiadają niejednorodne nagłówki, odmienne style kart, mieszane palety kolorów i niespójne zachowania kontenerów.
3. **Nieoptymalny design wybranych modułów:** Kluczowe moduły, takie jak Treningi (`WorkoutsPage.jsx`), prezentują surowy tekst Markdown zamiast nowoczesnego, interaktywnego narzędzia do rejestracji powtórzeń, serii i progresu obciążeń na strychu.

**Cel niniejszego Master Documentu:** Zdefiniowanie twardych fundamentów architektonicznych nowego GUI, eliminacja anomalii mobilnych, ustanowienie uniwersalnego systemu Design Tokens i przygotowanie precyzyjnych specyfikacji dla każdej podstrony przed rozpoczęciem prac implementacyjnych.

---

## 2. KATALOG ANOMALII UI/UX I AUDYT STANU BIEŻĄCEGO

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          AUDYT ANOMALII GUI & MOBILE                        │
│                                                                             │
│  [ MOBILE VIEWPORT ] ─────────► [ SCROLL COLLISION ] ───────► [ SUBPAGE ]   │
│  ├── Sztywne 100dvh             ├── Zagnieżdżony overflow     ├── Markdown  │
│  ├── Kolizja klawiatury         ├── Trapping dotyku           ├── Brak serii│
│  └── Zakryty bottom-bar         └── Podwójny padding          └── Chaos CSS │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.1. Anatomia anomalii mobilnych (Mobile Breakdown Analysis)

| Identyfikator | Lokalizacja w Kodzie | Symptom i Wpływ na Doświadczenie Użytkownika | Poziom Krytyczności |
|---|---|---|---|
| `ANOM-MOB-01` | `core.client.jsx:307` vs `WorkoutsPage.jsx:125` | **Konflikt podwójnego paddingu dolnego:** Główny kontener routera nakłada `pb-20 md:pb-0`, a poszczególne podstrony dodają własne `pb-24 md:pb-8`. Skutek: gigantyczna martwa przestrzeń na dole lub obcinanie przycisków akcji pod dolnym paskiem nawigacji. | `[!] KRYTYCZNY` |
| `ANOM-MOB-02` | `WorkoutsPage.jsx:242` & `TimetablePage.jsx` | **Zagnieżdżony Scroll-Jacking:** Wewnętrzny kontener posiada `overflow-y-auto max-h-[700px]` wewnątrz rodzica `overflow-y-auto custom-scrollbar`. Na ekranach dotykowych iOS/Android gest scrolla zostaje uwięziony w wewnętrznym bloku, uniemożliwiając płynne przewijanie całego ekranu. | `[!] KRYTYCZNY` |
| `ANOM-MOB-03` | `core.client.jsx:297` | **Kolizja wirtualnej klawiatury:** Użycie sztywnego kontenera `h-[100dvh]` bez obsługi `InteractiveWidget` powoduje, że wysunięcie klawiatury na Androidzie/iOS zgniata całą strukturę aplikacji, zasłania pola formularzy i modalów. | `[!] WYSOKI` |
| `ANOM-MOB-04` | `Sidebar.jsx:266` | **Kolizja Z-Index dolnego paska:** Dolny pasek nawigacji (`fixed bottom-0 z-40`) przykrywa pływające przyciski akcji (FAB), przyciski zapisu w modalu oraz powiadomienia Toast. | `[!] WYSOKI` |
| `ANOM-MOB-05` | `Sidebar.jsx:375-406` | **Ciasna siatka szuflady mobilnej:** Siatka 2-kolumnowa w `Mobile Drawer` przy 12 modułach powoduje ścisk tekstu, obcinanie etykiet i trudność w precyzyjnym kliknięciu kciukiem. | `[*] ŚREDNI` |
| `ANOM-MOB-06` | Globalnie | **Naruszenie strefy trafień (Touch Target < 44px):** Przyciski filtrów, usuwania czy przełączania mają wymiary rzędu 28x28px do 32x32px, co powoduje pomyłkowe kliknięcia podczas obsługi jedną ręką. | `[*] ŚREDNI` |

### 2.2. Studium przypadku: Degradacja modułu Treningów (`/workouts`)

Adres produkcyjny: `https://void-potato-7721.web.app/workouts`  
Plik źródłowy: `modules/pages/WorkoutsPage.jsx`

1. **Brak interaktywnego modelu treningowego:** Trening wyświetlany jest jako statyczny blok tekstu w komponencie `<ReactMarkdown>`. Użytkownik wykonujący sesję na strychu nie może zaznaczyć zrobionej serii, wpisać podniesionego ciężaru ani uruchomić stopera odpoczynku.
2. **Brak predefiniowanego schematu FBW (Strych):** Stały plan użytkownika (Podciąganie na drążku, Dipy/Pompki, Wiosłowanie hantlem, Wyciskanie OHP, Goblet Squat, Wznosy kolan) wymaga ręcznego wklejania tekstu zamiast dedykowanych kart ćwiczeń ze stepperem powtórzeń (8–12) i serii (2 serie robocze).
3. **Hardcodowane tokeny stylów:** Występują twardo wpisane wartości w CSS, np. `shadow-[0_0_15px_rgba(0,229,255,0.15)]`, ignorujące aktualnie wybrany motyw systemowy (np. Retro Amber, Matrix Green, Nordic Frost).
4. **Płaskie, generyczne karty:** Karty treningów w liście zlewają się z tłem, brak wyraźnego podziału na sekcje, brak wskaźnika objętości (tonażu) czy sumarycznego czasu sesji.

### 2.3. Niespójność stylistyczna podstron (Cross-Subpage Discrepancies)

- **Nagłówki stron:** W `TimetablePage` nagłówek ma podział na zakładki i rozbudowany pasek filtrów; w `WorkoutsPage` to prosta belka z przyciskiem; w `FinancePage` rozbudowane metryki z kalkulatorem kopertowym; w `OSINTPage` stylizowany terminal. Brak wspólnego komponentu bazowego `<PageHeader>`.
- **Typografia i fonty:** Mieszanie klas `font-mono` i `font-sans` na tych samych poziomach hierarchii (np. nagłówek `font-bold font-mono` z podtytułem `font-sans text-xs`).
- **Karty metryk:** Różne proporcje ikon, grubości obramowań (`border-border`, `border-border/60`, `border-white/10`) oraz różne paddingi wewnętrzne (`p-3`, `p-4`, `p-5`).
- **Stany załadunku:** Niektóre podstrony używają spinnera, inne szkieletów (`skeleton`), a jeszcze inne nie mają żadnego feedbacku wizualnego przy pobieraniu danych z chmury.

---

## 3. UNIFIED DESIGN SYSTEM V3.0 (FUNDAMENTY WIZUALNE)

Nowy styl wizualny oparty zostaje o spójny, deterministyczny system tokenów CSS, gwarantujący 100% spójność na każdej podstronie i we wszystkich 7 motywach systemowych.

### 3.1. Semantyczna hierarchia warstw (Elevation & Surfaces)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       WARSTWY ELEWACJI I POWIERZCHNI                        │
│                                                                             │
│  [ Level 0: Canvas ]    var(--color-bg)              Tło bazowe systemu     │
│         │                                                                   │
│  [ Level 1: Surface ]   var(--color-surface)         Panele, sekcje, paski  │
│         │                                                                   │
│  [ Level 2: Card ]      var(--color-surface-raised)  Karty interaktywne     │
│         │                                                                   │
│  [ Level 3: Overlay ]   var(--color-surface-overlay) Modale, Bottom-Sheets  │
│         │                                                                   │
│  [ Level 4: Popover ]   var(--color-surface-popover) Tooltipy, dropdowny    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2. Nowe Tokeny Kolorystyczne (Zgodne z Tailwind & Motywami)

Wszystkie kolory bazują na zmiennych zadeklarowanych w `:root` i klasach motywów (`.theme-*`):

| Token CSS | Zastosowanie Semantyczne | Wartość Default (Cyber Dark) |
|---|---|---|
| `--color-bg` | Tło bazowe ekranu aplikacji | `#0D0E12` (Ultra-Deep Dark) |
| `--color-surface` | Główne kontenery i panele robocze | `#15171E` |
| `--color-surface-raised` | Karty obiektów, kafelki funkcyjne | `#1C1F28` |
| `--color-surface-hover` | Stan najechania / aktywacji karty | `#232733` |
| `--color-border-subtle` | Delikatne linie oddzielające | `rgba(255, 255, 255, 0.05)` |
| `--color-border-medium` | Granice kart, obramowania kontenerów | `rgba(255, 255, 255, 0.10)` |
| `--color-border-active` | Granice aktywne, fokus, akcent | `rgba(var(--color-accent-primary), 0.45)` |
| `--color-text-primary` | Nagłówki, kluczowe dane, tytuły | `#F8FAFC` |
| `--color-text-secondary` | Etykiety, opisy, treść drugorzędna | `#94A3B8` |
| `--color-text-muted` | Metadane, timestampy, podpowiedzi | `#64748B` |
| `--color-accent-primary` | Główny kolor operacyjny / akcji | `0 255 102` (Neon Matrix) / Motyw |
| `--color-accent-glow` | Cienie rozmyte wokół elementów | `rgba(var(--color-accent-primary), 0.18)` |

### 3.3. Skala Zaokrągleń i Odstępów (Radius & Spacing Standard)

- **Promienie Zaokrągleń (Corner Radii):**
  - Małe elementy (Badge, Tag, Checkbox, Pigułka): `rounded-md` (`6px`) lub `rounded-full`.
  - Średnie elementy (Przyciski, Inputy, Filtry): `rounded-xl` (`10px`).
  - Duże elementy (Karty, Panele, Sekcje): `rounded-2xl` (`16px`).
  - Kontenery nadrzędne i Bottom-Sheety: `rounded-3xl` (`24px`).
- **Standard Stref Dotykowych (Touch Targets):**
  - Bezwzględne minimum dla elementów klikalnych na telefonie: **44px × 44px**.
  - Odstępy między elementami klikalnymi na mobile: min. **8px**.

---

## 4. ARCHITEKTURA MOBILE-FIRST (FUNDAMENTY INTERFEJSU)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ARCHITEKTURA ROOT VIEWPORT                          │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Mobile Header (h-14) [Logo + Title + Quick Actions + Avatar]           │  │
│  ├───────────────────────────────────────────────────────────────────────┤  │
│  │                                                                       │  │
│  │ Single Scrollable Viewport (flex-1 overflow-y-auto overscroll-contain)│  │
│  │ ├── Breadcrumb & Status Pill                                          │  │
│  │ ├── Metric KPI Carousel / Grid                                        │  │
│  │ ├── Interactive Segmented Control                                     │  │
│  │ └── Native Touch Cards Feed                                           │  │
│  │                                                                       │  │
│  │ [Spacer dołu: pb-[calc(4.5rem+env(safe-area-inset-bottom))]]          │  │
│  ├───────────────────────────────────────────────────────────────────────┤  │
│  │ Floating Glass Bottom Nav (h-16) + Safe Area Inset                     │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.1. Rozwiązanie problemu Viewportu i Bezpiecznych Stref (Safe Areas)

1. **Eliminacja błędu `100dvh` przy klawiaturze:**
   - Wymiana `h-[100dvh]` na strukturę elastyczną opartą o `fixed inset-0 flex flex-col`.
   - Zastosowanie zmiennych `env(safe-area-inset-top)` oraz `env(safe-area-inset-bottom)` w celu pełnej kompatybilności z iOS (pasek Home, dynamiczna wyspa) oraz gestami systemowymi Android.
2. **Pojedynczy Kontekst Przewijania (Single Scroll Context):**
   - Zakaz stosowania wewnętrznych kontenerów `overflow-y-auto max-h-[Xpx]` wewnątrz podstron.
   - Cała podstrona przewija się w jednym, płynnym kontenerze nadrzędnym z `overscroll-behavior-y: contain` i natywnym pędem (`-webkit-overflow-scrolling: touch`).
3. **Pojedynczy, scentralizowany bufor dolny:**
   - Usunięcie losowych `pb-20`, `pb-24`, `mb-6` z wnętrza komponentów.
   - Zastosowanie jednego zunifikowanego marginesu dolnego w widoku mobilnym:
     `pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))]`.

### 4.2. Ergonomia Nowego Dolnego Paska (Floating Glass Bottom Bar)

- **Układ 5 stref operacyjnych:**
  1. `Pulpit` (Ekran główny / Widgety)
  2. `Plan Dnia` (Zajęcia szkolne i osobiste)
  3. `Trening` (Interaktywny panel ćwiczeń na strychu)
  4. `AI Asystent` (Rozmowa tekstowa / głosowa z Groq)
  5. `Menu / Więcej` (Szuflada dolna do pozostałych modułów)
- **Konstrukcja wizualna:**
  - Ultra-cienka tafla szkła: `backdrop-blur-xl bg-surface/85 border-t border-border-subtle`.
  - Wskaźnik aktywnej karty: miękka mikropoduszka z poświatą akcentu i haptic feedback.
  - Wyraźna separacja od warstwy treści (z-index: 50, z zachowaniem marginesu bezpiecznego dla przycisków formularzy).

### 4.3. Konwersja Modali w Natywne Szuflady Dolne (Bottom Sheets)

- Na ekranach mobilnych (`< 768px`) wszystkie dotychczasowe okna modalne wyśrodkowane na ekranie zostają automatycznie przekształcone w **wysuwane od dołu szuflady (Bottom Sheets)**.
- Uchwyt dotykowy (Drag Handle) na samej górze.
- Możliwość zamknięcia przeciągnięciem w dół (Swipe-down to dismiss).
- Przyciski akcji ("Zapisz", "Anuluj") zawsze zakotwiczone na dole szuflady ponad klawiaturą ekranową.

---

## 5. SPECYFIKACJA RE-ARCHITEKTURY GŁÓWNYCH PODSTRON

### 5.1. Nowy Moduł Treningów (`WorkoutsPage.jsx` -> Nowy Standard)

Nowa podstrona Treningów odchodzi od koncepcji notatnika markdown na rzecz **profesjonalnego systemu prowadzenia sesji treningowej**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 ARCHITEKTURA NOWEGO MODUŁU TRENINGOWEGO                     │
│                                                                             │
│  [ Header: Tryb Aktywnego Treningu / Historia / Statystyki ]                │
│  ├── Licznik czasu sesji na żywo (Live Workout Stopwatch)                   │
│  └── Pasek postępu sesji (% ukończonych serii)                              │
│                                                                             │
│  [ Baza Schematu: FBW Strych (Pon / Śr / Pt) ]                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ 1. Podciąganie na drążku (Plecy + Biceps)                             │  │
│  │    Parametry: 2 serie × 8–12 powt. | Ciężar / Guma oporowa            │  │
│  │    [x] Seria 1: [ 10 ] powt. @ [ Guma Czarna ]   [ Odpoczynek: 90s ]  │  │
│  │    [ ] Seria 2: [ -- ] powt. @ [ Guma Czarna ]   [ Oznacz jako gotowe]│  │
│  ├───────────────────────────────────────────────────────────────────────┤  │
│  │ 2. Dipy na poręczach / Pompki klasyczne (Klatka + Barki + Triceps)    │  │
│  │    Parametry: 2 serie × 8–12 powt.                                    │  │
│  │    [ ] Seria 1: [ 12 ] powt. @ [ Masa ciała  ]   [ Gotowe ]           │  │
│  │    [ ] Seria 2: [ -- ] powt. @ [ Masa ciała  ]   [ Gotowe ]           │  │
│  ├───────────────────────────────────────────────────────────────────────┤  │
│  │ 3. Wiosłowanie hantlem w opadzie (Grzbiet + Ramiona)                  │  │
│  │ 4. Wyciskanie hantli nad głowę stojąc - OHP (Barki)                   │  │
│  │ 5. Goblet Squat z hantlem przy klatce (Nogi)                          │  │
│  │ 6. Unoszenie kolan do klatki w wiszeniu (Brzuch / Core)               │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  [ Pływający Stoper Przerw (Rest Timer Overlay): 90s / 120s ]                │
│  [ Szybkie Zapisanie Sesji do Firestore i SQLite ]                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Funkcje Nowego Modułu Treningów:
1. **Tryb "Trening na Żywo" (Live Session Mode):**
   - Duże, dotykowe przyciski checkbox do odznaczania ukończonych serii.
   - Automatyczny stoper przerw (1.5 – 2 minuty) z powiadomieniem dźwiękowym/wizualnym.
   - Szybkie pole modyfikacji ciężaru (hantle kg / grubość gumy oporowej).
2. **Karty Progresji i Rekordów (PR Tracking):**
   - Wykres sumarycznej liczby powtórzeń w podciąganiu i dipach w skali ostatnich 30 dni.
   - Wskaźnik regularności (Streak treningowy: Poniedziałek - Środa - Piątek).
3. **Harmonogram Dnia vs Trening:**
   - Bezpośrednia integracja z `Planem Dnia` – w dni treningowe (Pon/Śr/Pt) blok 17:00–18:00 podświetla się jako aktywny z przyciskiem "Rozpocznij Trening".
4. **Wsparcie dla Treningów Własnych i Cardio:**
   - Możliwość dodania dowolnej sesji (bieganie, rower, rozciąganie) z intuicyjnego kreatora w Bottom-Sheecie.

### 5.2. Podstrona Plan Dnia (`TimetablePage.jsx`)

- **Zunifikowany Przełącznik Segmentowy:**
  - `Wszystkie` | `Szkolne (Librus)` | `Osobiste (Rutyna & Cele)`
  - Płynna animacja przejścia, zapamiętywanie wyboru w `localStorage`.
- **Prezentacja Odwołanych Lekcji:**
  - Czerwona etykieta statusowa `[!] ODWOŁANA`.
  - Przekreślona nazwa przedmiotu, wyszarzone tło, informacja o okienku czasowym.
- **Optymalizacja widoku mobilnego:**
  - Zamiast ciasnej 5-kolumnowej tabeli: **Karusela Dni Tygodnia (Pon-Nd)** z dużymi, czytelnymi kartami poszczególnych godzin dla aktualnie wybranego dnia.

### 5.3. Podstrona Oceny (`GradesPage.jsx`)

- **Wizualna hierarchia przedmiotów:**
  - Duża karta średniej ważonej (4.62) z predykcją paska na świadectwie.
  - Karty przedmiotów z kolorystycznym kodowaniem ocen (6 i 5: zielony akcent, 4: niebieski, 3: żółty, 2 i 1: czerwony).
  - Wyraźne oznaczenie wag (waga 1, 2, 3, waga 0 jako diagnostyczna).
- **Proces Odświeżania:**
  - Płynny pasek ładowania (min. 800ms) z realnym statusem komunikacji z serwerem zamiast fałszywej "błyskawicznej" odpowiedzi.

### 5.4. Podstrona Finanse (`FinancePage.jsx`)

- **Mobilne karty kopert 50/30/20:**
  - Paski postępu wydatków dla każdej kategorii (Potrzeby, Zachcianki, Oszczędności).
  - Szybki FAB (Floating Action Button) do dodania wydatku jednym kliknięciem z telefonu.

---

## 6. STANDARYZACJA KOMPONENTÓW BAZOWYCH (COMPONENT PRIMITIVES)

Przed rozpoczęciem refaktoryzacji powstanie zestaw reużywalnych, ustandaryzowanych komponentów bazowych w katalogu `modules/components/ui/`:

| Komponent | Rola Architektoniczna | Główne Cechy i Parametry |
|---|---|---|
| `<PageHeader>` | Uniwersalny nagłówek podstrony | Tytuł, podtytuł, breadcrumb, slot na przyciski akcji, responsywny wrap |
| `<MetricCard>` | Kafelki kluczowych wskaźników (KPI) | Ikona w otoczce, etykieta, wartość główna, trend/delta, obsługa hover |
| `<SegmentedControl>` | Przełącznik zakładek / filtrów | Styl pigułkowy, animowane tło aktywne, pełna obsługa dotykowa |
| `<TouchCard>` | Bazowy kontener dla wpisów | Spójne obramowanie, stan hover, stan active, menu kontekstowe akcji |
| `<AdaptiveModal>` | Uniwersalny kontener dialogowy | Desktop: wycentrowany modal; Mobile: wysuwany Bottom-Sheet z uchwytem |
| `<EmptyState>` | Ekran braku danych | Ikona z poświatą, czytelny komunikat, przycisk wezwania do akcji (CTA) |
| `<SkeletonLoader>` | Feedback podczas ładowania | Płynna animacja shimmer dopasowana do geometrii kart |

---

## 7. PLAN WDROŻENIA I ETAPY PRAC (ROADMAP)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         HARMONOGRAM REALIZACJI                              │
│                                                                             │
│  [ FAZA 0: DECYZJA ] ──► [ FAZA 1: CORE ] ──► [ FAZA 2: NAV & MOBILE ]      │
│  ├── Wytyczne stylu      ├── Design Tokens    ├── Viewport & Safe Areas     │
│  └── Zatwierdzenie       └── Komponenty UI    └── Bottom Bar & Bottom Sheet │
│                                                                             │
│  [ FAZA 3: WORKOUTS ] ─► [ FAZA 4: SUBPAGES] ─► [ FAZA 5: AUDYT & SYNC ]    │
│  ├── FBW Tracker Strych  ├── Plan Dnia, Oceny ├── 221+ Testów Vitest       │
│  └── Stoper & Rejestr    └── Finanse, Pulpit  └── Obsidian Sync & Deploy    │
└─────────────────────────────────────────────────────────────────────────────┘
```

- **Faza 0: Konsultacja i wybór kierunku estetycznego (KROK BIEŻĄCY):**
  - Operator określa preferowany charakter wizualny nowego GUI (patrz Sekcja 8).
  - Blokada edycji kodu źródłowego do momentu zatwierdzenia kierunku przez operatora.
- **Faza 1: Tokeny stylistyczne i baza komponentów (`modules/components/ui/`):**
  - Aktualizacja `assets/styles/index.css` oraz `tailwind.config.js`.
  - Stworzenie uniwersalnych komponentów: `PageHeader`, `MetricCard`, `SegmentedControl`, `AdaptiveModal`.
- **Faza 2: Globalna Architektura Mobilna (`core.client.jsx`, `Sidebar.jsx`):**
  - Przebudowa kontenera głównego routera (usunięcie kolizji paddingów i scroll-jackingu).
  - Nowy, elegancki dolny pasek nawigacji (Floating Glass Bottom Bar).
  - Nowa szuflada dolna z logicznym grupowaniem modułów.
- **Faza 3: Nowy Moduł Treningów (`WorkoutsPage.jsx`):**
  - Wdrożenie interaktywnego rejestratora FBW na strych (6 ćwiczeń, serie, powtórzenia, stoper przerw).
  - Połączenie z bazą Firestore i SQLite.
- **Faza 4: Unifikacja Pozostałych Podstron:**
  - Podstrona Plan Dnia (`TimetablePage.jsx`) – widok karuzelowy na telefonie.
  - Podstrona Oceny (`GradesPage.jsx`) – odświeżony widok kart przedmiotów.
  - Podstrona Finanse (`FinancePage.jsx`) i Pulpit (`Dashboard.jsx`).
- **Faza 5: Testy Integralności, Weryfikacja i Wdrożenie:**
  - Weryfikacja wszystkich pakietów testowych Vitest (`npm test`).
  - Sprawdzenie kompilacji produkcyjnej (`npm run build`).
  - Symetryczna synchronizacja dokumentacji z Obsidianem (Rule 26) i push do repozytorium.

---

## 8. ANKIETA KIERUNKU ESTETYCZNEGO DLA OPERATORA

Przed modyfikacją kodu operator proszony jest o wybór preferowanego stylu wizualnego i wytycznych:

### Proponowane Warianty Stylu:

1. **Wariant A: Cyber-Tactical Stealth (Ewolucja obecnego Dark-Tech)**
   - Dominacja głębokiej czerni (`#0A0B0E`) z technicznymi mikrosiatkami.
   - Ostre, wyraziste akcenty neonowe (Cyber Green, Neon Cyan, Amber).
   - Etykiety i metadane w stylistyce wojskowo-telemetrycznej (`font-mono`).
   - Płaskie panele z subtelną obwódką o wysokim kontraście.

2. **Wariant B: Modern Minimalist Dark (Styl Vercel / Linear / Apple Dark)**
   - Bardzo elegancka, grafitowa czerń (`#121316`) z miękkimi cieniami i brakiem agresywnego neonu.
   - Płynny, głęboki glassmorphism (rozmyte tła paneli `backdrop-blur-xl`).
   - Czysta typografia bezszeryfowa (`Inter / Geist Sans`), czytelna i stonowana.
   - Nowoczesne pigułkowe przełączniki i zaokrąglenia `rounded-2xl`.

3. **Wariant C: Industrial Laboratory Hybrid (Styl Urządzenia Pomiarowego / Deck)**
   - Połączenie dotykowych kart z wyraźnymi krawędziami, imitującymi fizyczny pulpit sterowniczy.
   - Wyraźne podświetlenia stanów aktywnych (LED-like indicators).
   - Wysoka gęstość informacji przy zachowaniu idealnych odstępów dotykowych (44px).

---

> **MELDUNEK KOŃCOWY DOKUMENTU:**  
> Niniejszy dokument stanowi wiążącą bazę architektoniczną dla v3.0.  
> Status wykonawczy: **ZATRZYMANO PRACE KODOWE – OCZEKIWANIE NA WYTYCZNE OPERATORA.**
