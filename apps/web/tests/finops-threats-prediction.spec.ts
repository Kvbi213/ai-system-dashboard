import { test, expect } from '@playwright/test';

test.describe('FinOps, Threat Monitoring, Prediction & Timeline Upgrades', () => {
  test('Dashboard Timeline allows jumping to now and filtering upcoming events', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Verify "Skocz do teraz" button exists
    const jumpBtn = page.locator('button:has-text("Skocz do teraz")');
    await expect(jumpBtn).toBeVisible();
    await jumpBtn.click();

    // Verify filter buttons
    const odTerazBtn = page.locator('button:has-text("Od teraz")');
    await expect(odTerazBtn).toBeVisible();
    await odTerazBtn.click();
    await page.waitForTimeout(300);

    // Verify timeline content
    const timelineCard = page.locator('text=Oś Czasu Dnia (Timeline)');
    await expect(timelineCard).toBeVisible();
  });

  test('Finance Hub displays Budget Prediction 50/30/20 and supports inline Write-Back', async ({ page }) => {
    await page.goto('http://localhost:3000/finance');
    await page.waitForLoadState('networkidle');

    // Verify Prediction Card is visible
    const predictionHeading = page.locator('text=Analityka Predykcyjna 50/30/20 & Write-Back');
    await expect(predictionHeading).toBeVisible();

    // Click write-back button
    const writeBackBtn = page.locator('button:has-text("Dostosuj limit")');
    await expect(writeBackBtn).toBeVisible();
    await writeBackBtn.click();

    // Change limit input
    const limitInput = page.locator('input[placeholder="Limit"]');
    await expect(limitInput).toBeVisible();
    await limitInput.fill('6000');

    // Save
    const saveBtn = page.locator('button:has-text("Zapisz")');
    await saveBtn.click();
    await page.waitForTimeout(400);

    // Check toast or updated text
    const toastMsg = page.locator('text=Zaktualizowano limit budżetu');
    await expect(toastMsg).toBeVisible();
  });

  test('OSINT Hub displays Threat Monitoring Timeline and active SSRF Guard', async ({ page }) => {
    await page.goto('http://localhost:3000/osint');
    await page.waitForLoadState('networkidle');

    // Verify Threat Timeline
    const threatHeading = page.locator('text=Tarcza Cyberbezpieczeństwa & Oś Incydentów');
    await expect(threatHeading).toBeVisible();

    const ssrfBadge = page.locator('text=SSRF GUARD AKTYWNY');
    await expect(ssrfBadge).toBeVisible();

    // Click simulate probe test
    const probeBtn = page.locator('button:has-text("Test tarczy (SSRF Probe)")');
    await expect(probeBtn).toBeVisible();
    await probeBtn.click();
    await page.waitForTimeout(400);

    // Verify alert toast
    const alertToast = page.locator('text=ALERT BEZPIECZEŃSTWA: Tarcza SSRF przechwyciła');
    await expect(alertToast).toBeVisible();
  });

  test('Settings Hub displays FinOps and Semantic Memory with interactive recall', async ({ page }) => {
    await page.goto('http://localhost:3000/settings');
    await page.waitForLoadState('networkidle');

    // Click FinOps & Pamięć tab
    const tabBtn = page.locator('button[role="tab"]:has-text("FinOps & Pamięć")');
    await expect(tabBtn).toBeVisible();
    await tabBtn.click();
    await page.waitForTimeout(400);

    // Verify FinOps card
    const finOpsHeading = page.locator('text=Obserwowalność Kosztowa & FinOps');
    await expect(finOpsHeading).toBeVisible();

    // Verify Semantic Memory card
    const memoryHeading = page.locator('text=Lokalna Pamięć Semantyczna (Wzorzec Lab-Zero)');
    await expect(memoryHeading).toBeVisible();

    // Perform a test recall query
    const recallInput = page.locator('input[placeholder*="Wpisz pytanie"]');
    await expect(recallInput).toBeVisible();
    await recallInput.fill('o której posiłek przed snem');

    const recallBtn = page.locator('button:has-text("Przywołaj")');
    await recallBtn.click();
    await page.waitForTimeout(400);

    const toastRecall = page.locator('text=Lab-Zero Recall');
    await expect(toastRecall).toBeVisible();
  });
});
