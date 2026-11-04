import { test, expect } from '@playwright/test';

test.describe('OmniDash Reborn - Comprehensive Full GUI E2E Audit', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error(`[BROWSER ERROR] ${msg.text()}`);
      }
    });
  });

  test('1. Dashboard (Pulpit) - Viewport-fit Decluttered Layout without old chat & services widgets', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Verify main components are rendered
    await expect(page.locator('[data-testid="current-lesson-hero"]').first()).toBeVisible();
    await expect(page.locator('text=CANARD Radary').first()).toBeVisible();
    await expect(page.locator('[data-testid="dashboard-kpi-deck"]').first()).toBeVisible();
    await expect(page.locator('text=Oś Czasu Dnia (Timeline)').first()).toBeVisible();
    await expect(page.locator('a[href="/chat"]:visible').first()).toBeVisible();

    // Verify obsolete widgets were removed for viewport-fit
    await expect(page.locator('text=Szybki Czat Omni AI')).toHaveCount(0);
    await expect(page.locator('text=Usługi i Węzły Operacyjne')).toHaveCount(0);
    await expect(page.locator('text=Telemetria & LPU')).toHaveCount(0);

    // Test IT News Ticker click
    const nextTickerBtn = page.locator('button[title="Następny news"]');
    await expect(nextTickerBtn).toBeVisible();
    await nextTickerBtn.click();

    // Test Todo Drawer: open drawer via KPI deck, add a new task
    const openDrawerBtn = page.locator('button:has-text("Zarządzaj")').first();
    await openDrawerBtn.click();

    const drawerTitle = page.locator('h3:has-text("Zadania Wykonawcze")');
    await expect(drawerTitle).toBeVisible();

    const taskInput = page.locator('input[placeholder*="Dodaj nowe zadanie"]');
    await taskInput.fill('Przetestować architekturę E2E v4.0');
    await page.locator('button:has-text("Dodaj")').click();

    await expect(page.locator('text=Przetestować architekturę E2E v4.0').first()).toBeVisible();

    // Close drawer
    await page.keyboard.press('Escape');
    await expect(drawerTitle).toBeHidden();
  });

  test('2. School Hub (/school) - Timetable, Grades, Attendance, and Exams', async ({ page }) => {
    await page.goto('/school', { waitUntil: 'networkidle' });

    // Default tab: Plan lekcji
    await expect(page.locator('button:has-text("Plan lekcji")')).toBeVisible();
    await expect(page.locator('button:has-text("Oceny i Średnie")')).toBeVisible();
    await expect(page.locator('button:has-text("Frekwencja i Terminarz")')).toBeVisible();

    // Test day switching in timetable (click Wt - Wtorek)
    const wtorekBtn = page.locator('button:has-text("Wt")');
    await wtorekBtn.click();
    await expect(page.locator('text=/Pracownia urządzeń|Matematyka/').first()).toBeVisible();

    // Switch to Oceny tab
    await page.locator('button:has-text("Oceny i Średnie")').click();
    await expect(page.locator('text=Średnia ocen').first()).toBeVisible();
    await expect(page.locator('text=3.38').first()).toBeVisible();
    await expect(page.locator('text=Szczęśliwy nr').first()).toBeVisible();

    // Test semester switch
    await page.locator('button:has-text("Semestr 1")').click();
    await page.locator('button:has-text("Semestr 2")').click();

    // Switch to Frekwencja & Terminarz tab
    await page.locator('button:has-text("Frekwencja i Terminarz")').click();
    await expect(page.locator('text=Wskaźnik Frekwencji').first()).toBeVisible();
    await expect(page.locator('text=95.4%')).toBeVisible();
    await expect(page.locator('text=Terminarz Sprawdzianów').first()).toBeVisible();
  });

  test('3. Finance Hub (/finance) - Envelopes, Transactions, Subscriptions, Goals', async ({ page }) => {
    await page.goto('/finance', { waitUntil: 'networkidle' });

    // Verify sub-tabs
    await expect(page.locator('button:has-text("Koperty 50/30/20")')).toBeVisible();
    await expect(page.locator('button:has-text("Wydatki i Rejestr")')).toBeVisible();
    await expect(page.locator('button:has-text("Abonamenty")')).toBeVisible();
    await expect(page.locator('button:has-text("Cele i Oszczędności")')).toBeVisible();

    // Verify Envelopes Overview
    await expect(page.locator('text=Koperty Budżetowe 50/30/20').first()).toBeVisible();

    // Switch to Transactions and add a transaction
    await page.locator('button:has-text("Wydatki i Rejestr")').click();
    await page.locator('button:has-text("Dodaj wydatek")').click();

    const titleInput = page.locator('input[placeholder="Tytuł wydatku..."]');
    const amountInput = page.locator('input[placeholder="Kwota (PLN)..."]');
    await titleInput.fill('Kawa speciality i książka');
    await amountInput.fill('38.50');
    await page.locator('button:has-text("Zapisz transakcję")').click();

    await expect(page.locator('text=Kawa speciality i książka').first()).toBeVisible();

    // Switch to Subscriptions
    await page.locator('button:has-text("Abonamenty")').click();
    await expect(page.locator('text=Hosting Chmurowy VPS (LXC)').first()).toBeVisible();
    await expect(page.locator('text=Narzędzia Asystenta Dev / AI').first()).toBeVisible();

    // Switch to Goals
    await page.locator('button:has-text("Cele i Oszczędności")').click();
    await expect(page.locator('text=Fundusz Awaryjny').first()).toBeVisible();
  });

  test('4. Workouts & Habits (/workouts) - FBW, Daily Streaks, Records', async ({ page }) => {
    await page.goto('/workouts', { waitUntil: 'networkidle' });

    // Default tab: FBW
    await expect(page.getByRole('heading', { name: 'Trening Siłowy FBW (Kalistenika)' })).toBeVisible();
    await expect(page.locator('text=Podciąganie na drążku').first()).toBeVisible();

    // Test incrementing set
    const incrementBtn = page.locator('button[title*="Zalicz serię"]').first();
    await incrementBtn.click();
    // Rest timer overlay should activate
    await expect(page.locator('text=PRZERWA MIĘDZY SERIAMI').first()).toBeVisible();

    // Close or skip rest overlay so tabs become accessible
    const skipBtn = page.locator('button:has-text("Pomiń przerwę"), button:has-text("Zaczynaj serię"), button[title="Zamknij nakładkę"]').first();
    await skipBtn.click();
    await page.waitForTimeout(300);

    // Switch to Habits
    await page.locator('button:has-text("Nawyki i Streaki")').click();
    await expect(page.locator('text=Nawyki Codzienne i Serie').first()).toBeVisible();
    const habitItem = page.locator('text=Woda minimum 2.5 Litra').first();
    await expect(habitItem).toBeVisible();
    await habitItem.click(); // toggle habit

    // Switch to Records
    await page.locator('button:has-text("Rekordy Osobiste")').click();
    await expect(page.locator('text=Rekordy Siłowe i Osiągnięcia').first()).toBeVisible();
    await expect(page.locator('text=14 powtórzeń').first()).toBeVisible();
  });

  test('5. Traffic Hub (/traffic) - Cameras, CANARD Radars, Routes', async ({ page }) => {
    await page.goto('/traffic', { waitUntil: 'networkidle' });

    // Default tab: Cameras
    await expect(page.locator('text=Węzeł Miejski Północ').first()).toBeVisible();
    await expect(page.locator('text=Węzeł Wschodni').first()).toBeVisible();

    // Switch to Radars
    await page.locator('button:has-text("Radary CANARD")').click();
    await expect(page.locator('text=Rejestr Fotoradarów CANARD').first()).toBeVisible();
    await expect(page.locator('text=Mesta Fusion RN').first()).toBeVisible();

    // Switch to Routes
    await page.locator('button:has-text("Trasy i Utrudnienia")').click();
    await expect(page.locator('text=Status Tras i Utrudnienia GDDKiA').first()).toBeVisible();
    await expect(page.locator('text=Jezdnia: 12.5°C').first()).toBeVisible();
  });

  test('6. Server & Infrastructure (/server) - Docker, Mikrus LXC, Backup', async ({ page }) => {
    await page.goto('/server', { waitUntil: 'networkidle' });

    // Default tab: Docker
    await expect(page.locator('text=Kontenery Docker Compose').first()).toBeVisible();
    await expect(page.locator('text=omnidash-web').first()).toBeVisible();
    await expect(page.locator('text=omnidash-api').first()).toBeVisible();
    await expect(page.locator('text=omnidash-db').first()).toBeVisible();

    // Switch to Mikrus LXC
    await page.locator('button:has-text("Węzeł Mikr.us LXC")').click();
    await expect(page.locator('text=Węzeł VPS Mikr.us (Kontener LXC)').first()).toBeVisible();
    await expect(page.locator('text=Cloudflare Tunnel').first()).toBeVisible();

    // Switch to Backup
    await page.locator('button:has-text("Kopia i Baza Danych")').click();
    await expect(page.locator('text=Kopia Zapasowa i Eksport Danych').first()).toBeVisible();
    await expect(page.locator('button:has-text("Eksportuj JSON")')).toBeVisible();
  });

  test('7. Settings (/settings) - Full 7-Tab Legacy Parity', async ({ page }) => {
    await page.goto('/settings', { waitUntil: 'networkidle' });

    // Verify 7 navigation tabs exist
    await expect(page.locator('button:has-text("Kernel & Motyw")')).toBeVisible();
    await expect(page.locator('button:has-text("Asystent TTS")')).toBeVisible();
    await expect(page.locator('button:has-text("Modele AI")')).toBeVisible();
    await expect(page.locator('button:has-text("Geo & Radary")')).toBeVisible();
    await expect(page.locator('button:has-text("Powiadomienia")')).toBeVisible();
    await expect(page.locator('button:has-text("Ergonomia UI")')).toBeVisible();
    await expect(page.locator('button:has-text("Baza & Audyt")')).toBeVisible();

    // Default tab: Kernel
    await expect(page.locator('text=Kernel & Jądro Systemu').first()).toBeVisible();
    await expect(page.locator('text=Liquid Glass Light').first()).toBeVisible();

    // Switch to TTS
    await page.locator('button:has-text("Asystent TTS")').click();
    await expect(page.locator('text=Synteza Mowy (TTS)').first()).toBeVisible();
    await expect(page.locator('text=Web Speech API').first()).toBeVisible();

    // Switch to AI Models
    await page.locator('button:has-text("Modele AI")').click();
    await expect(page.locator('text=Architektura Modeli AI & LPU').first()).toBeVisible();
    await expect(page.locator('text=Llama 3.3 70B').first()).toBeVisible();

    // Switch to Baza & Audyt
    await page.locator('button:has-text("Baza & Audyt")').click();
    await expect(page.locator('text=Bezpieczeństwo Zero-Trust & Baza Danych').first()).toBeVisible();
    await expect(page.locator('main p:has-text("Polityka CSP Level 3")').first()).toBeVisible();
  });

  test('8. Mobile Navigation & More Drawer Sheet on Mobile (Pixel 7)', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Ten test dotyczy wyłącznie urządzeń mobilnych');

    await page.goto('/', { waitUntil: 'networkidle' });

    // Bottom Tab Bar should be visible
    const bottomNav = page.locator('nav.glass-dock');
    await expect(bottomNav).toBeVisible();

    // Click "Więcej" button on bottom bar
    const moreBtn = page.locator('button:has-text("Więcej")');
    await moreBtn.click();

    // Sheet should slide up
    const sheetTitle = page.locator('h3:has-text("Więcej narzędzi")');
    await expect(sheetTitle).toBeVisible();

    // Navigate to Trening & Nawyki from sheet
    const workoutsLink = page.locator('.glass-panel-elevated a[href="/workouts"]');
    await workoutsLink.click();

    // Should navigate to /workouts and sheet should close
    await expect(page).toHaveURL('/workouts');
    await expect(sheetTitle).toBeHidden();
    await expect(page.getByRole('heading', { name: 'Trening Siłowy FBW (Kalistenika)' })).toBeVisible();
  });

  test('9. Collapsible Sidebar Categories on Desktop', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Ten test dotyczy wyłącznie urządzeń stacjonarnych z panelem bocznym');

    await page.goto('/', { waitUntil: 'networkidle' });

    // Verify collapsible category headers exist
    const categoryBtn = page.locator('button:has-text("Harmonogram i Finanse")');
    await expect(categoryBtn).toBeVisible();

    // Target link inside this category
    const financeLink = page.locator('aside a:has-text("Budżet 50/30/20")');
    await expect(financeLink).toBeVisible();

    // Click to collapse category
    await categoryBtn.click();
    await expect(categoryBtn).toHaveAttribute('aria-expanded', 'false');

    // Click to expand category again
    await categoryBtn.click();
    await expect(categoryBtn).toHaveAttribute('aria-expanded', 'true');
    await expect(financeLink).toBeVisible();

    // Test global collapse toggle button
    const toggleAllBtn = page.locator('button[title*="Zwiń / Rozwiń"]');
    await expect(toggleAllBtn).toBeVisible();
    await toggleAllBtn.click();
  });

  test('10. OSINT & Telemetry (/osint) - DNS, ASN, SSL and Threat Score', async ({ page }) => {
    await page.goto('/osint', { waitUntil: 'networkidle' });

    // Verify search bar and input
    const searchInput = page.locator('input[placeholder*="Wpisz domenę"]');
    await expect(searchInput).toBeVisible();

    // Verify KPI indicators
    await expect(page.locator('text=Adres IPv4 / Anycast').first()).toBeVisible();
    await expect(page.locator('text=Threat Score').first()).toBeVisible();
    await expect(page.locator('text=Certyfikat SSL / TLS').first()).toBeVisible();

    // Verify DNS records
    await expect(page.locator('text=Rekordy Strefy DNS').first()).toBeVisible();
    await expect(page.locator('text=Rekordy A (IPv4):').first()).toBeVisible();

    // Perform lookup
    await searchInput.fill('github.com');
    await page.locator('button:has-text("Skanuj")').click();
  });

  test('11. Widgets & Modular Tools Hub (/widgets)', async ({ page }) => {
    await page.goto('/widgets', { waitUntil: 'networkidle' });

    // Verify main page and category pills
    await expect(page.locator('[data-testid="widgets-hub-page"]')).toBeVisible();
    await expect(page.locator('button:has-text("Wszystkie Widżety")')).toBeVisible();
    await expect(page.locator('button:has-text("Hardware & Sieć")')).toBeVisible();
    await expect(page.locator('button:has-text("Rynek & Krypto")')).toBeVisible();

    // Verify hardware monitor & crypto
    await expect(page.locator('text=Monitor Sprzętowy (Hardware)').first()).toBeVisible();
    await expect(page.locator('text=Kondycja Sieci & Zero-Trust').first()).toBeVisible();
    await expect(page.locator('text=Rynek Krypto & Walut (FX)').first()).toBeVisible();

    // Test scratchpad typing & auto-save
    const textarea = page.locator('textarea[placeholder*="Wpisz dowolne notatki"]');
    await expect(textarea).toBeVisible();
    await textarea.fill('Nowa notatka inżynieryjna w scratchpadzie');
    await expect(page.locator('text=Zapisano').first()).toBeVisible();

    // Test prompt vault copy
    const copyBtn = page.locator('button:has-text("Kopiuj prompt")').first();
    await expect(copyBtn).toBeVisible();
  });

  test('12. AI Cognitive Memory & Directives Hub (/memory)', async ({ page }) => {
    await page.goto('/memory', { waitUntil: 'networkidle' });

    // Verify main page
    await expect(page.locator('[data-testid="memory-hub-page"]')).toBeVisible();

    // Verify system directives
    await expect(page.locator('text=Dyrektywy Systemowe Kognitywne').first()).toBeVisible();
    await expect(page.locator('text=PROTOKÓŁ ANTIGRAVITY v4.0').first()).toBeVisible();
    await expect(page.locator('text=100% Zgodności').first()).toBeVisible();

    // Switch to facts tab
    const factsTabBtn = page.locator('button:has-text("Baza Faktów & Pamięć AI")');
    await factsTabBtn.click();

    // Verify facts list
    await expect(page.locator('text=Pamięć Długoterminowa (Fakty)').first()).toBeVisible();
    await expect(page.locator('text=Apple Liquid Glass').first()).toBeVisible();

    // Add new fact
    const addFactBtn = page.locator('button:has-text("Dodaj fakt")');
    await addFactBtn.click();
    const factInput = page.locator('input[placeholder*="Treść faktu"]');
    await factInput.fill('Fakt E2E: Wszystkie testy automatyczne są zielone');
    await page.locator('button:has-text("Zapisz fakt w pamięci")').click();

    await expect(page.locator('text=Fakt E2E: Wszystkie testy automatyczne są zielone').first()).toBeVisible();
  });

  test('13. Private Hub (/private) - Routines, Goals, and Journal', async ({ page }) => {
    await page.goto('/private', { waitUntil: 'networkidle' });

    // Verify sub-tabs
    await expect(page.locator('button:has-text("Rutyny i Nawyki Dnia")')).toBeVisible();
    await expect(page.locator('button:has-text("Cele i Projekty Osobiste")')).toBeVisible();
    await expect(page.locator('button:has-text("Dziennik i Refleksje")')).toBeVisible();

    // Default tab: Routines
    await expect(page.locator('text=Rutyny Dnia & Higiena Kognitywna').first()).toBeVisible();
    await expect(page.locator('text=/Szklanka wody/').first()).toBeVisible();

    // Switch to Goals
    await page.locator('button:has-text("Cele i Projekty Osobiste")').click();
    await expect(page.locator('text=Cele Osobiste & Projekty Rozwojowe').first()).toBeVisible();
    await expect(page.locator('text=Certyfikat AWS Solutions Architect').first()).toBeVisible();

    // Switch to Journal
    await page.locator('button:has-text("Dziennik i Refleksje")').click();
    await expect(page.locator('text=Dziennik Osobisty & Refleksje').first()).toBeVisible();
    await expect(page.locator('button:has-text("Nowy wpis")')).toBeVisible();
  });

  test('14. Sub-Tab Bars Zero-Scroll Verification across all pages', async ({ page }) => {
    const pagesToCheck = ['/settings', '/finance', '/widgets', '/workouts', '/school', '/traffic', '/server', '/private', '/memory'];
    for (const path of pagesToCheck) {
      await page.goto(path, { waitUntil: 'networkidle' });
      const subTabs = page.locator('.glass-panel:has(button)');
      const count = await subTabs.count();
      if (count > 0) {
        const isNotHorizontallyScrolled = await subTabs.first().evaluate((el) => {
          return el.scrollWidth <= el.clientWidth + 2;
        });
        expect(isNotHorizontallyScrolled).toBe(true);
      }
    }
  });
});
