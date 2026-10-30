import { chromium } from 'playwright';

async function runRegression() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 700 } });

  // Test Dashboard
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  const dashOverflow = await page.evaluate(() => {
    const mainEl = document.getElementById('main-content');
    return mainEl ? window.getComputedStyle(mainEl).overflowY : '';
  });
  console.log('[*] Dashboard main overflowY:', dashOverflow);
  if (dashOverflow !== 'auto') throw new Error('Dashboard should have overflowY: auto!');

  // Test Timetable
  await page.goto('http://localhost:3000/timetable', { waitUntil: 'networkidle' });
  const timetableOverflow = await page.evaluate(() => {
    const mainEl = document.getElementById('main-content');
    return mainEl ? window.getComputedStyle(mainEl).overflowY : '';
  });
  console.log('[*] Timetable main overflowY:', timetableOverflow);
  if (timetableOverflow !== 'auto') throw new Error('Timetable should have overflowY: auto!');

  await browser.close();
  console.log('[+] Multi-page regression check: PASS (Other views retain normal scrolling)!');
}

runRegression().catch((err) => {
  console.error('[!] Regression failed:', err);
  process.exit(1);
});
