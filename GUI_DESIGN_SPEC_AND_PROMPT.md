# OMNIDASH REBORN (v4.0.0) — DOKUMENT STYLU I DESIGN BRIEF DLA AI
> Przeznaczenie: Dokumentacja projektowa interfejsu oraz gotowy Prompt do wklejenia do narzędzi AI do projektowania (v0.dev, Figma AI, Cursor, Midjourney, Claude 3.7 Sonnet).  
> Lokalizacja: `C:\Users\Jakub Lis\Desktop\01_PROJEKTY\OmniDash\GUI_DESIGN_SPEC_AND_PROMPT.md`  
> Standard: Apple Human Interface Guidelines + Linear Minimal Dark + Mobile-First  

---

## 1. WIZJA I JĘZYK WZORNICTWA (DESIGN SYSTEM)

Interfejs **OmniDash Reborn** to połączenie **Apple macOS Sonoma / iOS 18 Glassmorphism** z surowym, technicznym minimalizmem narzędzi inżynierskich takich jak **Linear** czy **Vercel**. 

### Kluczowe Założenia Stylistyczne:
1. **Hyper-Clean Dark Canvas:** Głębokie, aksamitne tło zamiast płaskiego czarnego (`#090d16` / `#05080e`), z subtelnymi radialnymi gradientami w kolorze akcentu o kryciu 3–7%.
2. **Apple Frosted Glass (Szkło Akrylowe):**
   - Karty i arkusze wykorzystują efekt rozmycia `backdrop-blur-2xl`.
   - Wypełnienie: `rgba(15, 23, 42, 0.65)` (Surface Container Low) do `rgba(30, 41, 59, 0.5)` (Surface Container High).
   - Obramowania (Borders): Ultra-cienkie `1px solid rgba(255, 255, 255, 0.08)`, a w stanie hover/aktywnym `rgba(56, 189, 248, 0.3)`.
3. **Płynna Ergonomia Dotykowa (Thumb-Zone & Fluidity):**
   - Interfejs projektowany w pierwszej kolejności na smartfon (Mobile-First 375–430px), z płynną adaptacją do tabletów (768–1024px) i desktopów (1280px+).
   - Minimalne cele dotykowe na telefonie: **48px × 48px**.
   - Brak centralnych modali na telefonie — wszystkie okna otwierają się jako **Bottom Sheets** (arkusze wysuwane z dołu ekranu z uchwytem przeciągania Drag Pill i gestem zamknięcia w dół).

---

## 2. PALETA KOLORÓW I TOKENY DESIGNU

```css
:root {
  /* Tła i Powierzchnie */
  --bg-app: #080c14;                    /* Główny canvas aplikacji */
  --surface-lowest: rgba(10, 15, 26, 0.95);
  --surface-low: rgba(15, 23, 42, 0.65);   /* Kafelki, karty widżetów */
  --surface-card: rgba(22, 33, 56, 0.55);  /* Aktywne kapsuły */
  --surface-glass-border: rgba(255, 255, 255, 0.08);
  --surface-glass-highlight: rgba(255, 255, 255, 0.14);

  /* Kolory Akcentu i Brandu */
  --accent-cyan: #38bdf8;               /* Główny akcent Omni (Sky/Cyan) */
  --accent-cyan-glow: rgba(56, 189, 248, 0.25);
  --accent-purple: #c084fc;             /* AI Mentor & Intelligence */
  --accent-emerald: #34d399;            /* Sukces, Finanse Needs, Status OK */
  --accent-amber: #fbbf24;              /* Ostrzeżenia, Zastępstwa Librus, Alerty drogowe */
  --accent-rose: #f87171;               /* Odwołane lekcje, błędy, wydatki */

  /* Typografia */
  --text-primary: #f8fafc;              /* Główny tekst (95% kontrastu) */
  --text-secondary: #94a3b8;            /* Podpisy, labele */
  --text-muted: #64748b;                /* Pomocnicze znaczniki, metadane */
  --text-accent: #38bdf8;
}
```

---

## 3. SPECYFIKACJA EKRANÓW I WIDOKÓW MOBILNYCH

### Ekran 1: Smartfon — Dolny Dok Nawigacyjny (Bottom Tab Bar)
- **Umiejscowienie:** `fixed bottom-0 left-0 right-0 z-50`.
- **Wygląd:** Płynny, pływający lub osadzony pasek z rozmyciem szkła `backdrop-blur-2xl bg-black/50 border-t border-white/10`.
- **Ikony:**
  1. `Pulpit` (LayoutGrid)
  2. `Czat AI` (Bot / Sparkles)
  3. `Plan Dnia` (Clock / CalendarDays)
  4. `Oceny` (GraduationCap)
  5. `Więcej` (SlidersHorizontal) — otwiera Bottom Sheet z Finansami, Treningiem FBW, Radarem drogowym i Ustawieniami.
- **Bezpieczeństwo:** `pb-[max(0.75rem,env(safe-area-inset-bottom))]` (ochrona paska domowego iOS).

### Ekran 2: Smartfon — Pulpit Operacyjny (Dashboard)
- **Góra:** Kompaktowy nagłówek z datą, zlokalizowaną godziną w Warszawie, awatarem profilu i wskaźnikiem telemetrii (pulsująca zielona dioda SSE).
- **Karta 1: Dynamic Glance Card:**
  - Temperatura i pogoda dla Starogardu Gdańskiego.
  - Odcinkowy pomiar prędkości CANARD / alerty GDDKiA (np. „Trasa do Gdańska: 9 punktów CANARD, brak utrudnień”).
- **Karta 2: Hero Bieżącej Lekcji / Rutyny:**
  - Duża, czytelna kapsuła pokazująca aktualnie trwającą lekcję (np. „10:35 – 11:20 Informatyka [sala 204]”), z paskiem postępu i odliczaniem minut do dzwonka.
- **Karta 3: Zadania To-Do (Executive Capsule):**
  - Wykres kołowy postępu (SVG Ring), licznik zadań i 2 najbliższe zadania z checkboxami. Przycisk „Wszystkie zadania” wysuwa arkusz z dołu.

### Ekran 3: Smartfon — Terminal Czat AI (ChatPage)
- **Pojedyncza przestrzeń przewijania (100dvh):** Brak podwójnego scrolla.
- **Dymki wiadomości:**
  - Użytkownik: Wyrównany do prawej, ciemny akcent `bg-sky-500/15 border border-sky-400/20 text-white`.
  - Asystent: Wyrównany do lewej, subtelne szkło `bg-white/[0.04] border border-white/10 text-slate-200`.
- **Tool Calling Accordion:** Zamiast blokujących ekran logów — eleganckie, składane pigułki akordeonu z ikoną spinnera: `[>] Wykonano: GET_LIBRUS_GRADES (320ms)` rozwijane kliknięciem.
- **Dolne pole wejściowe (Chat Input Bar):**
  - Przyklejone do dołu, odporne na wirtualną klawiaturę (`window.visualViewport`).
  - Przycisk mikrofonu (Groq Whisper STT) z pulsującym pierścieniem fali dźwiękowej (Visualizer HUD).

### Ekran 4: Smartfon — Plan Dnia & Zastępstwa (TimetablePage)
- **Segmented Day Bar:** Horyzontalny pasek dni: `Pn`, `Wt`, `Śr`, `Czw`, `Pt`, `Wszystkie` — możliwość przełączania tapnięciem lub gestem przesunięcia palcem (Swipe).
- **Karty Lekcji:**
  - Czas trwania (np. `08:00 - 08:45`).
  - Przedmiot, sala, nazwisko nauczyciela.
  - **Zastępstwo:** Bursztynowa pigułka `[~] Zastępstwo (Joanna Ziemba)`.
  - **Odwołane:** Przekreślony temat z czerwoną pigułką `[-] Odwołane`.
  - **Okienka:** Elegancka szara kapsuła informująca o wolnej godzinie.

### Ekran 5: Smartfon — Dziennik Ocen (GradesPage)
- **Karta Główna:** Ogólna średnia ważona (np. **4.62**), szczęśliwy numerek (np. **21**) oraz przełącznik `Semestr 1` / `Semestr 2`.
- **Wykaz Przedmiotów:** Kompaktowe wiersze z nazwą przedmiotu, średnią ważoną i poziomą listą pigułek ocen:
  - Kolory pigułek zależne od wartości (1: czerwona, 2: pomarańczowa, 3: żółta, 4: turkusowa, 5: błękitna, 6: fioletowa).
  - Waga wyświetlana jako indeks górny (np. `5³`, `4²`).
  - Tapnięcie w wiersz wysuwa od dołu **Bottom Sheet** z pełnymi szczegółami każdej oceny (kategoria, data, nauczyciel).

---

## 4. MASTER PROMPT DLA AI DO DESIGNU (GOTOWY DO WKLEJENIA)

Skopiuj poniższy prompt i wklej go do **v0.dev**, **Figma AI**, **Cursor** lub narzędzia generującego interfejsy:

```markdown
Generate a modern, hyper-minimalist Mobile-First web app design for "OmniDash Reborn" — a personal AI operating assistant and student dashboard.

Theme & Aesthetics:
- Deep luxury dark mode (Canvas: #080c14, Surface cards: rgba(15, 23, 42, 0.65) with backdrop-blur-2xl).
- Ultra-thin border styling: 1px solid rgba(255, 255, 255, 0.08) with subtle hover glow.
- Apple Glassmorphism + Linear Dark minimalism. Accent colors: Electric Cyan (#38bdf8), Emerald Green (#34d399), Amber Orange (#fbbf24), and Soft Purple (#c084fc).
- Typography: Inter for clean UI, JetBrains Mono for stats/telemetry/timestamps.
- Zero childish emojis: Use crisp Lucide icons and engineering text badges.

Mobile-First Ergonomics (iPhone 15/16 Pro & Android):
- Bottom Navigation Dock (fixed bottom-0, 48px touch targets, safe-area-inset padding for home indicator). Tabs: Dashboard, AI Chat, Schedule, Grades, More.
- Natural Thumb-Zone: Keep 80% of actionable controls in the bottom 45% of the screen.
- Native Apple-style Bottom Sheets: Replace desktop center modals with swipe-down bottom sheets featuring a top drag-handle pill.
- Viewport resilience: Use 100dvh to prevent virtual keyboards from breaking the layout.

Core Screens to Showcase:
1. Dashboard:
   - Header with Warsaw local time, profile status dot, and live SSE pulse.
   - Road & Weather glance capsule (CANARD speed cameras radar + GDDKiA alerts + temp).
   - "Current Lesson Live Tracker" hero card showing ongoing school class with countdown bar.
   - Executive To-Do card with SVG progress ring and quick check-offs.
2. AI Assistant Terminal:
   - Chat stream with rich markdown speech bubbles.
   - Collapsible spring accordion capsules for Tool Calling (e.g., "[>] GET_LIBRUS_GRADES - 320ms").
   - Floating audio waveform HUD for Fish Audio TTS and Whisper mic input.
   - Sticky bottom keyboard-safe input pill with voice button.
3. School Schedule (Timetable):
   - Horizontal swipeable day selector (Mon, Tue, Wed, Thu, Fri, All-Week).
   - Lesson cards featuring room badges, teacher initials, and prominent substitution/cancellation badges (Amber for substitution, Crimson for cancelled).
4. Grades Hub:
   - Top KPI card with overall weighted GPA (4.62) and today's lucky number.
   - Subject cards with colored grade pills indicating weights (e.g., 5³, 4²).
   - Tap opens bottom sheet showing full grade history with date, teacher and category.

Deliver a production-ready, highly responsive layout with modular component boundaries.
```
