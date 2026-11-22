const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });

  async function shot(ctx, url, outPrefix, directionValue) {
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForSelector('.clcargo-eta', { timeout: 15000 });
    await page.locator('#form').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    await page.evaluate((v) => {
      const sel = document.querySelector('.clcargo-form-section select[name="select-1"]');
      sel.value = v;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }, directionValue);
    await page.waitForTimeout(300);

    const el = page.locator('.clcargo-form-section').first();
    await el.screenshot({ path: outPrefix + '.png' });
    console.log('saved', outPrefix + '.png');

    // Also capture the open dropdown
    await page.click('.clcargo-form-section select[name="select-1"] + .forminator-select .selection');
    await page.waitForTimeout(300);
    await el.screenshot({ path: outPrefix + '-open.png' });
    console.log('saved', outPrefix + '-open.png');

    await page.close();
  }

  const m = await browser.newContext({ ...devices['Pixel 5'] });
  await shot(m, 'http://localhost:8881/',    'shots/calc-mobile-uk',  'china_sea');
  await shot(m, 'http://localhost:8881/ru/', 'shots/calc-mobile-ru',  'china_sea');
  await m.close();

  const d = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await shot(d, 'http://localhost:8881/',    'shots/calc-desktop-uk', 'china_sea');
  await shot(d, 'http://localhost:8881/ru/', 'shots/calc-desktop-ru', 'china_sea');
  await d.close();

  await browser.close();
})();
