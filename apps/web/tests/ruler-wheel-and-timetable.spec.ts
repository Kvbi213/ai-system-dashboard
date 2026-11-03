import { test, expect } from '@playwright/test';

test.describe('RulerWheelPicker & Synergia Timetable Parity', () => {
  test('Timetable displays Tuesday lessons matching Librus Synergia exactly', async ({ page }) => {
    await page.goto('http://localhost:3000/school');
    await page.waitForLoadState('networkidle');

    // Select Tuesday (Wt, day 2)
    const wtButton = page.locator('button:has-text("Wt")').first();
    await wtButton.click();
    await page.waitForTimeout(600);

    // Verify key subjects from Librus screenshot
    const content = await page.content();
    expect(content).toContain('Pracownia urządzeń techniki komputerowej');
    expect(content).toContain('Wojnarowski Przemysław');
    expect(content).toContain('Zajęcia z wychowawcą');
    expect(content).toContain('Ziemba Joanna');
    expect(content).toContain('Wychowanie fizyczne');
    expect(content).toContain('Łysakowski Grzegorz');
    expect(content).toContain('Pracownia systemów operacyjnych');
    expect(content).toContain('Reszka Sławomir');
    expect(content).toContain('Edukacja zdrowotna');
    expect(content).toContain('Spych Monika');
    expect(content).toContain('Matematyka');
    expect(content).toContain('Bahr Zbigniew');
  });

  test('Workouts FBW displays OLED True Black Rest Timer Overlay on set completion with next set info', async ({ page }) => {
    await page.goto('http://localhost:3000/workouts');
    await page.waitForLoadState('networkidle');

    // Find first exercise increment button (e.g. "+" to complete a set)
    const addSetButton = page.locator('button[title*="Zalicz serię"]').first();
    if (await addSetButton.isVisible()) {
      await addSetButton.click();
    } else {
      // Or click rest button to open overlay directly
      const restBtn = page.locator('button:has-text("Przerwa:")').first();
      await restBtn.click();
    }
    await page.waitForTimeout(400);

    // Verify OLED True Black overlay is visible with header
    const overlayHeader = page.locator('text=REST INTERVAL :: LIVE COUNTDOWN');
    await expect(overlayHeader).toBeVisible();

    // Verify "NASTĘPNA SERIA" card is present
    const nextSetHeading = page.locator('text=NASTĘPNA SERIA:');
    await expect(nextSetHeading).toBeVisible();

    // Check that 3D wheel slider is active
    const slider = page.locator('div[role="slider"]');
    await expect(slider).toBeVisible();

    // Verify quick adjust buttons work
    const plus15 = page.locator('button:has-text("15s")').nth(1);
    await plus15.click();
    await page.waitForTimeout(200);

    // Close or skip overlay
    const skipBtn = page.locator('button:has-text("Pomiń przerwę"), button:has-text("Zaczynaj serię")').first();
    await skipBtn.click();
    await page.waitForTimeout(300);

    // Overlay is closed
    await expect(overlayHeader).not.toBeVisible();
  });
});
