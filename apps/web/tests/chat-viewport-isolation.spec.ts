import { test, expect } from '@playwright/test';

test.describe('Chat Viewport Isolation & E2E User Flow', () => {
  test('Outer page has zero scroll and only chat messages scroll on Desktop & Mobile', async ({ page }) => {
    // 1. Navigate to /chat
    await page.goto('/chat', { waitUntil: 'networkidle' });

    // 2. Check layout isolation: document and main container must not scroll
    const outerScrollMetrics = await page.evaluate(() => {
      const mainEl = document.getElementById('main-content');
      const docEl = document.scrollingElement || document.documentElement;

      // Force-attempt scroll
      window.scrollTo(0, 500);
      if (mainEl) mainEl.scrollTop = 500;

      return {
        windowScrollY: window.scrollY,
        mainScrollTop: mainEl ? mainEl.scrollTop : 0,
        mainOverflowY: mainEl ? window.getComputedStyle(mainEl).overflowY : '',
        docScrollHeight: docEl.scrollHeight,
        docClientHeight: docEl.clientHeight
      };
    });

    expect(outerScrollMetrics.windowScrollY).toBe(0);
    expect(outerScrollMetrics.mainScrollTop).toBe(0);
    expect(outerScrollMetrics.mainOverflowY).toBe('hidden');

    // 3. Header & Input Bar fixed visibility
    const headerTitle = page.locator('header h1');
    await expect(headerTitle).toBeVisible();

    const inputField = page.locator('input[placeholder*="Zapytaj asystenta"]');
    await expect(inputField).toBeVisible();

    // 4. User Interaction: Click prompt chip
    const chipButton = page.locator('button:has-text("Jaki mam dzisiaj plan lekcji?")');
    await expect(chipButton).toBeVisible();
    await chipButton.click();

    // Verify AI response arrives
    const timetableReply = page.locator('text=Dzisiaj w ZSE masz jeszcze 2 lekcje');
    await expect(timetableReply).toBeVisible({ timeout: 5000 });

    // 5. User Interaction: Type custom query and submit
    await inputField.fill('Sprawdź radar na trasie DK22');
    await inputField.press('Enter');

    // Verify AI response arrives with tool calling
    const radarReply = page.locator('text=Sprawdziłem dane CANARD dla Starogardu Gdańskiego');
    await expect(radarReply).toBeVisible({ timeout: 5000 });

    // 6. Verify that ONLY the chat messages list is scrollable
    const scrollArea = page.locator('[data-testid="chat-messages-scroll-area"]');
    await expect(scrollArea).toBeVisible();

    const messagesMetrics = await scrollArea.evaluate((el) => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      scrollTop: el.scrollTop,
      canScroll: el.scrollHeight > el.clientHeight
    }));

    expect(messagesMetrics.canScroll).toBe(true);
    expect(messagesMetrics.scrollTop).toBeGreaterThan(0);

    // Verify outer page still has 0 scroll after all interactions
    const finalPageScrollY = await page.evaluate(() => window.scrollY);
    expect(finalPageScrollY).toBe(0);
  });

  test('Other pages retain standard auto-scroll', async ({ page }) => {
    // Dashboard check
    await page.goto('/', { waitUntil: 'networkidle' });
    const dashOverflow = await page.locator('#main-content').evaluate((el) =>
      window.getComputedStyle(el).overflowY
    );
    expect(dashOverflow).toBe('auto');

    // Timetable check
    await page.goto('/timetable', { waitUntil: 'networkidle' });
    const timetableOverflow = await page.locator('#main-content').evaluate((el) =>
      window.getComputedStyle(el).overflowY
    );
    expect(timetableOverflow).toBe('auto');
  });
});
