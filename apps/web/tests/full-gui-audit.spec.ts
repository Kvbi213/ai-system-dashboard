import { test, expect } from '@playwright/test';

test.describe('OmniDash Reborn - Comprehensive Full GUI E2E Audit', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error(`[BROWSER ERROR] ${msg.text()}`);
      }
    });
  });

  test('1. Dashboard (Pulpit) - Widgets, Ticker, and Todo Drawer', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Verify main components are rendered
    await expect(page.locator('text=Projektowanie Oprogramowania').first()).toBeVisible();
    await expect(page.locator('text=CANARD Radary').first()).toBeVisible();
    await expect(page.locator('text=Priorytety Dnia').first()).toBeVisible();
    await expect(page.locator('text=Węzeł Produkcyjny').first()).toBeVisible();

    // Test IT News Ticker click
    const nextTickerBtn = page.locator('button[title="Następny news"]');
    await expect(nextTickerBtn).toBeVisible();
    await nextTickerBtn.click();

    // Test Todo Drawer: open drawer, add a new task, toggle it
    const openDrawerBtn = page.locator('button:has-text("Zobacz wszystkie zadania")');
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
    await expect(page.locator('text=Bazy Danych SQL').first()).toBeVisible();

    // Switch to Oceny tab
    await page.locator('button:has-text("Oceny i Średnie")').click();
    await expect(page.locator('text=Średnia ocen').first()).toBeVisible();
    await expect(page.locator('text=4.62')).toBeVisible();
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
    const incrementBtn = page.locator('button:has(svg.lucide-plus)').first();
    await incrementBtn.click();
    // Rest timer should activate
    await expect(page.locator('text=Przerwa: 90s')).toBeVisible();

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

  test('7. Settings (/settings) - Zero-Trust Audit & Session', async ({ page }) => {
    await page.goto('/settings', { waitUntil: 'networkidle' });

    await expect(page.getByRole('heading', { name: 'Audyt Architektury Zero-Trust' })).toBeVisible();
    await expect(page.locator('p.font-bold:has-text("Polityka CSP Level 3")')).toBeVisible();
    await expect(page.locator('p.font-bold:has-text("Autoryzacja Google Identity")')).toBeVisible();
    await expect(page.locator('text=Zalogowano jako Operator Systemu').first()).toBeVisible();
    await expect(page.locator('button:has-text("Wyloguj sesję Zero-Trust")')).toBeVisible();
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
});
