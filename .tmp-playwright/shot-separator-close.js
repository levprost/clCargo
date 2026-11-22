/* Close-up of just the hero/form boundary so the gold separator is obvious. */
const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });

  async function close(ctx, url, out) {
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForSelector('.clcargo-form-section', { timeout: 15000 });
    await page.evaluate(() => {
      const form = document.querySelector('.clcargo-form-section');
      const top = form.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top - 60, behavior: 'instant' });
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: out, clip: { x: 0, y: 0, width: page.viewportSize().width, height: 160 } });
    console.log('saved', out);
    await page.close();
  }

  const d = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await close(d, 'http://localhost:8881/',    'shots/sep-desktop-uk.png');
  await close(d, 'http://localhost:8881/ru/', 'shots/sep-desktop-ru.png');
  await d.close();

  const m = await browser.newContext({ ...devices['Pixel 5'] });
  await close(m, 'http://localhost:8881/',    'shots/sep-mobile-uk.png');
  await close(m, 'http://localhost:8881/ru/', 'shots/sep-mobile-ru.png');
  await m.close();

  await browser.close();
})();
