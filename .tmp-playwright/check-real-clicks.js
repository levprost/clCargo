/* End-to-end test using real Select2 clicks (not programmatic .value). */
const { chromium, devices } = require('playwright');

const CASES = [
  { substr: /7–10 дней/,  valueRu: 'turkey',    etaRu: '7–10 дней' },
  { substr: /Китай.*авиа/,valueRu: 'china_air', etaRu: '12–15 дней' },
  { substr: /Китай.*море/,valueRu: 'china_sea', etaRu: '52–60 дней' },
  { substr: /Европа/,     valueRu: 'europe',    etaRu: '7 дней' },
  { substr: /Индия.*авиа/,valueRu: 'india_air', etaRu: '14–16 дней' },
  { substr: /Индия.*море/,valueRu: 'india_sea', etaRu: '52–60 дней' },
];

async function run(browser, viewport, label) {
  const ctx = viewport.mobile
    ? await browser.newContext({ ...devices['Pixel 5'] })
    : await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  console.log('\n--- ' + label + ' ---');
  await page.goto('http://localhost:8881/ru/', { waitUntil: 'load' });
  await page.waitForSelector('.clcargo-form-section .forminator-custom-form', { timeout: 15000 });
  await page.waitForSelector('.clcargo-eta', { timeout: 15000 });
  await page.locator('#form').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  for (const c of CASES) {
    // Open the select
    await page.click('.clcargo-form-section select[name="select-1"] + .forminator-select .selection');
    await page.waitForTimeout(200);
    // Click the option whose text includes substr
    const opt = page.locator('.forminator-select-dropdown .select2-results__option', { hasText: c.substr }).first();
    await opt.click();
    await page.waitForTimeout(300);

    const eta = (await page.locator('.clcargo-eta__value').textContent()).trim();
    const value = await page.evaluate(() => document.querySelector('.clcargo-form-section select[name="select-1"]').value);
    const ok = eta === c.etaRu && value === c.valueRu;
    console.log('  ' + (ok ? 'OK  ' : 'FAIL') + '  click "' + c.substr + '" → value=' + value + '  eta="' + eta + '" (want "' + c.etaRu + '")');
  }

  await ctx.close();
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  await run(browser, { mobile: false }, 'DESKTOP, real Select2 clicks');
  await run(browser, { mobile: true  }, 'MOBILE Pixel 5, real Select2 clicks');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
