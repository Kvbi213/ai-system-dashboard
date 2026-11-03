import { test, expect } from '@playwright/test';

test.describe('Theme & Dark Mode E2E Verification', () => {
  test('Header quick toggle switches between Light and Dark mode', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const html = page.locator('html');
    const toggleBtn = page.locator('button[aria-label="Przełącz motyw"]');
    await expect(toggleBtn).toBeVisible();

    // Check initial state
    const initialIsDark = await html.evaluate((el) => el.classList.contains('dark'));

    // Toggle
    await toggleBtn.click();
    if (initialIsDark) {
      await expect(html).not.toHaveClass(/dark/);
    } else {
      await expect(html).toHaveClass(/dark/);
    }

    // Check localStorage persistence
    const savedTheme = await page.evaluate(() => localStorage.getItem('omnidash_theme'));
    expect(savedTheme).toBeTruthy();

    // Toggle back
    await toggleBtn.click();
    if (initialIsDark) {
      await expect(html).toHaveClass(/dark/);
    } else {
      await expect(html).not.toHaveClass(/dark/);
    }
  });

  test('Settings Kernel tab switches theme to Obsidian Dark Mode', async ({ page }) => {
    await page.goto('/settings', { waitUntil: 'networkidle' });

    // Click Kernel tab
    const kernelTab = page.locator('button[role="tab"]:has-text("Kernel")');
    if (await kernelTab.isVisible()) {
      await kernelTab.click();
    }

    const html = page.locator('html');
    const darkBtn = page.locator('button:has-text("Obsidian Dark Mode")');
    const lightBtn = page.locator('button:has-text("Liquid Glass Light")');

    await expect(darkBtn).toBeVisible();
    await darkBtn.click();
    await expect(html).toHaveClass(/dark/);

    const savedTheme = await page.evaluate(() => localStorage.getItem('omnidash_theme'));
    expect(savedTheme).toBe('dark');

    // Switch back to light
    await lightBtn.click();
    await expect(html).not.toHaveClass(/dark/);
    const savedThemeLight = await page.evaluate(() => localStorage.getItem('omnidash_theme'));
    expect(savedThemeLight).toBe('light');
  });
});
