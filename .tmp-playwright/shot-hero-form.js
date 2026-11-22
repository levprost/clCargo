/* Capture the hero → form transition area so we can see the white gap
 * and the final layout once a separator is added. */
const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });

  async function grab(ctx, url, out) {
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForSelector('.clcargo-form-section', { timeout: 15000 });
    // Scroll so that hero bottom + form top are both visible
    await page.evaluate(() => {
      const hero = document.querySelector('.clcargo-section--hero');
      const form = document.querySelector('.clcargo-form-section');
      if (hero && form) {
        const heroBottom = hero.getBoundingClientRect().bottom + window.scrollY;
        window.scrollTo({ top: heroBottom - window.innerHeight * 0.55, behavior: 'instant' });
      }
    });
    await page.waitForTimeout(400);
    await page.screenshot({ path: out });
    console.log('saved', out);
    await page.close();
  }

  const m = await browser.newContext({ ...devices['Pixel 5'] });
  await grab(m, 'http://localhost:8881/',    'shots/hero-form-mobile-uk.png');
  await grab(m, 'http://localhost:8881/ru/', 'shots/hero-form-mobile-ru.png');
  await m.close();

  const d = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await grab(d, 'http://localhost:8881/',    'shots/hero-form-desktop-uk.png');
  await grab(d, 'http://localhost:8881/ru/', 'shots/hero-form-desktop-ru.png');
  await d.close();

  await browser.close();
})();
