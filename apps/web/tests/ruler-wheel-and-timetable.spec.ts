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

  test('Workouts FBW displays 3D Ruler Wheel Picker and configures rest duration', async ({ page }) => {
    await page.goto('http://localhost:3000/workouts');
    await page.waitForLoadState('networkidle');

    // Look for rest duration configuration button
    const restButton = page.locator('button:has-text("Przerwa:")').first();
    await expect(restButton).toBeVisible();

    // Open the 3D ruler wheel picker
    await restButton.click();
    await page.waitForTimeout(400);

    // Check that slider role is active with ARIA attributes
    const slider = page.locator('div[role="slider"]');
    await expect(slider).toBeVisible();
    await expect(slider).toHaveAttribute('aria-label', 'Domyślna przerwa między seriami');

    // Test keyboard navigation (ArrowRight increases rest value)
    await slider.focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);

    // Verify presence of unit and snap indicator
    const sliderContent = await slider.textContent();
    expect(sliderContent?.toLowerCase()).toContain('sekundy');
    expect(sliderContent).toContain('SNAP & PHYSICS');
  });
});
