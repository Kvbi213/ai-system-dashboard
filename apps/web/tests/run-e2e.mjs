import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function runE2ETest() {
  console.log('[*] INFO :: Inicjalizacja testu E2E w Playwright Chromium...');
  
  // Use installed Google Chrome or Edge
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();

  console.log('[>] EXEC :: Nawigacja do http://localhost:3000/chat ...');
  await page.goto('http://localhost:3000/chat', { waitUntil: 'networkidle' });

  // 1. Verify Page & Layout Structure
  console.log('[>] EXEC :: Weryfikacja struktury DOM i braku scrolla strony głównej...');
  
  const scrollMetrics = await page.evaluate(() => {
    const mainEl = document.getElementById('main-content');
    const docEl = document.scrollingElement || document.documentElement;
    
    // Attempt to scroll outer window and main container
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

  console.log('[*] INFO :: Pomiary scrolla strony głównej:', JSON.stringify(scrollMetrics, null, 2));

  if (scrollMetrics.windowScrollY !== 0) {
    throw new Error(`FAIL: window.scrollY wynosi ${scrollMetrics.windowScrollY}, strona główna nie powinna się scrollować!`);
  }
  if (scrollMetrics.mainScrollTop !== 0) {
    throw new Error(`FAIL: main.scrollTop wynosi ${scrollMetrics.mainScrollTop}, kontener główny nie powinien się scrollować!`);
  }
  if (scrollMetrics.mainOverflowY !== 'hidden') {
    throw new Error(`FAIL: main.overflowY wynosi '${scrollMetrics.mainOverflowY}', oczekiwano 'hidden'!`);
  }
  console.log('[+] SUCCESS :: Strona główna nie posiada paska przewijania (overflow-hidden potwierdzone).');

  // 2. Interact as a real user: Click Prompt Chip
  console.log('[>] EXEC :: Użytkownik klika w prompt chip: "Jaki mam dzisiaj plan lekcji?" ...');
  const chipButton = page.locator('button:has-text("Jaki mam dzisiaj plan lekcji?")');
  await chipButton.click();

  // Wait for assistant response
  console.log('[~] PENDING :: Oczekiwanie na odpowiedź asystenta AI...');
  await page.waitForSelector('text=Dzisiaj w ZSE masz jeszcze 2 lekcje', { timeout: 5000 });
  console.log('[+] SUCCESS :: Odpowiedź na chip odebrana i wyświetlona.');

  // 3. User types into input and presses Enter
  console.log('[>] EXEC :: Użytkownik wpisuje zapytanie: "Czy na trasie DK22 są aktywne radary?" ...');
  const inputLocator = page.locator('input[placeholder*="Zapytaj asystenta"]');
  await inputLocator.fill('Czy na trasie DK22 są aktywne radary?');
  await inputLocator.press('Enter');

  // Wait for the second assistant reply
  console.log('[~] PENDING :: Oczekiwanie na odpowiedź asystenta o fotoradarach...');
  await page.waitForSelector('text=Sprawdziłem dane CANARD dla Starogardu Gdańskiego', { timeout: 5000 });
  console.log('[+] SUCCESS :: Druga odpowiedź asystenta pomyślnie wyrenderowana.');

  // 4. Verify that only the inner messages container is scrollable and has scrolled
  console.log('[>] EXEC :: Weryfikacja wewnętrznego przewijania kontenera wiadomości...');
  const messagesScrollMetrics = await page.evaluate(() => {
    const scrollArea = document.querySelector('[data-testid="chat-messages-scroll-area"]');
    if (!scrollArea) return null;
    return {
      scrollHeight: scrollArea.scrollHeight,
      clientHeight: scrollArea.clientHeight,
      scrollTop: scrollArea.scrollTop,
      canScroll: scrollArea.scrollHeight > scrollArea.clientHeight
    };
  });

  console.log('[*] INFO :: Pomiary kontenera wiadomości chatu:', JSON.stringify(messagesScrollMetrics, null, 2));

  if (!messagesScrollMetrics) {
    throw new Error('FAIL: Nie znaleziono kontenera [data-testid="chat-messages-scroll-area"]');
  }

  if (!messagesScrollMetrics.canScroll) {
    throw new Error(`FAIL: Kontener wiadomości ma scrollHeight (${messagesScrollMetrics.scrollHeight}) <= clientHeight (${messagesScrollMetrics.clientHeight})`);
  }

  // Attempt to scroll the messages area to the top and bottom
  await page.evaluate(() => {
    const scrollArea = document.querySelector('[data-testid="chat-messages-scroll-area"]');
    if (scrollArea) scrollArea.scrollTop = 0;
  });
  
  const scrolledTop = await page.evaluate(() => {
    const scrollArea = document.querySelector('[data-testid="chat-messages-scroll-area"]');
    return scrollArea ? scrollArea.scrollTop : -1;
  });

  if (scrolledTop !== 0) {
    throw new Error('FAIL: Kontener wiadomości nie pozwolił na przewinięcie w górę!');
  }

  console.log('[+] SUCCESS :: Kontener wiadomości jest niezależnie przewijalny i reaguje na scrollowanie.');

  // 5. Test input bar remains pinned and visible at the bottom
  const inputBarVisible = await inputLocator.isVisible();
  if (!inputBarVisible) {
    throw new Error('FAIL: Pasek wprowadzania zniknął lub został przewinięty poza ekran!');
  }

  // 6. Capture E2E Screenshot to verify visual fidelity
  const screenshotPath = 'C:\\Users\\Jakub Lis\\Desktop\\01_PROJEKTY\\OmniDash\\apps\\web\\e2e-chat-verified.png';
  await page.screenshot({ path: screenshotPath });
  console.log(`[+] SUCCESS :: Zrzut ekranu weryfikacyjnego zapisany: ${screenshotPath}`);

  await browser.close();
  console.log('[+] SUCCESS :: Pełny test End-2-End zakończony powodzeniem (0 defektów).');
}

runE2ETest().catch((err) => {
  console.error('[!] ALERT :: Błąd podczas testu E2E:', err);
  process.exit(1);
});
