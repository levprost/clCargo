/* Check that after optimisation the page still works end-to-end:
 * - Hero renders.
 * - Burger menu opens/closes on mobile.
 * - Lang switcher labels are UA/RU and clicking RU loads the RU page.
 * - Contact modal opens on CTA click and closes on backdrop click.
 * - Form renders, Forminator JS initialised, checkbox toggles weight/volume rows.
 *
 * Collects coarse timing info: navigation + resource requests. Not a Lighthouse
 * replacement but good enough to see whether blocking is gone.
 */
const { chromium, devices } = require('playwright');

const BASE = 'http://localhost:8881/';
const UA = 'Mozilla/5.0 Playwright';

async function profile(page, url) {
  const resources = [];
  page.on('response', async (resp) => {
    try {
      const req = resp.request();
      const url = req.url();
      const type = req.resourceType();
      if (!['script', 'stylesheet', 'document', 'font', 'image'].includes(type)) return;
      const headers = resp.headers();
      const cl = parseInt(headers['content-length'] || '0', 10) || 0;
      resources.push({ type, url, status: resp.status(), size: cl });
    } catch (_) {}
  });
  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'load' });
  const loadMs = Date.now() - t0;
  const nav = await page.evaluate(() => {
    const e = performance.getEntriesByType('navigation')[0] || {};
    return {
      dcl: Math.round(e.domContentLoadedEventEnd || 0),
      load: Math.round(e.loadEventEnd || 0),
      tti: Math.round(e.domInteractive || 0),
      responseEnd: Math.round(e.responseEnd || 0),
    };
  });
  return { resources, nav, loadMs };
}

function summarise(resources, label) {
  const groups = {};
  for (const r of resources) {
    groups[r.type] = groups[r.type] || { count: 0, size: 0 };
    groups[r.type].count++;
    groups[r.type].size += r.size;
  }
  console.log(`\n--- ${label} ---`);
  for (const k of Object.keys(groups)) {
    console.log(`${k.padEnd(11)} ${String(groups[k].count).padStart(3)} files   ${(groups[k].size/1024).toFixed(1)} KB (Content-Length sum, 0=chunked)`);
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  // ---------- MOBILE ----------
  const mctx = await browser.newContext({ ...devices['Pixel 5'], userAgent: UA });
  const mpage = await mctx.newPage();

  const home = await profile(mpage, BASE);
  summarise(home.resources, 'MOBILE — home');
  console.log('Nav timing:', home.nav);

  // Burger
  const burgerVisible = await mpage.locator('.clcargo-header__burger').isVisible();
  console.log('Burger visible on mobile:', burgerVisible);
  await mpage.locator('.clcargo-header__burger').click();
  const menuOpen = await mpage.evaluate(() => document.querySelector('.clcargo-header').classList.contains('is-open'));
  console.log('Burger opened menu:', menuOpen);
  await mpage.locator('.clcargo-header__burger').click();
  const menuClosed = await mpage.evaluate(() => !document.querySelector('.clcargo-header').classList.contains('is-open'));
  console.log('Burger closed menu:', menuClosed);

  // Lang switcher labels
  const langLabels = await mpage.locator('.wp-block-polylang-language-switcher a').allTextContents();
  console.log('Lang switcher labels:', langLabels);

  // Modal — click hero CTA "Позвонить/Зателефонувати"
  await mpage.locator('[data-clcargo-contact-open]').first().click();
  await mpage.waitForTimeout(300);
  const modalOpen = await mpage.evaluate(() => {
    const m = document.getElementById('clcargo-contact-modal');
    return !!(m && (m.open || m.hasAttribute('open')));
  });
  console.log('Contact modal opens on CTA:', modalOpen);
  await mpage.keyboard.press('Escape');
  await mpage.waitForTimeout(200);
  const modalClosed = await mpage.evaluate(() => {
    const m = document.getElementById('clcargo-contact-modal');
    return !(m.open || m.hasAttribute('open'));
  });
  console.log('Contact modal closes on Escape:', modalClosed);

  // Form — scroll to #form, verify Forminator initialised
  await mpage.locator('#form').scrollIntoViewIfNeeded();
  await mpage.waitForTimeout(1500);
  const formInit = await mpage.evaluate(() => {
    const form = document.querySelector('.forminator-custom-form');
    if (!form) return { rendered: false };
    return {
      rendered: true,
      initialised: form.classList.contains('forminator-initialized'),
      hasNameInput: !!form.querySelector('input[name="name-1"]'),
      hasPhone: !!form.querySelector('input[type="tel"], input[name^="phone-"]'),
      numInputs: form.querySelectorAll('input, select, textarea').length,
    };
  });
  console.log('Form state:', formInit);

  // Toggle "Точні параметри уточню" checkbox and check weight row hides
  const hasCheckbox = await mpage.locator('.forminator-custom-form input[value="yes"][type="checkbox"]').count();
  if (hasCheckbox) {
    const beforeHidden = await mpage.locator('.forminator-custom-form input[name="number-1"]').first().isVisible();
    // Click the visual checkbox label (native input is hidden behind .forminator-checkbox-box)
    await mpage.evaluate(() => {
      const cb = document.querySelector('.forminator-custom-form input[value="yes"][type="checkbox"]');
      cb.checked = true;
      cb.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await mpage.waitForTimeout(300);
    const afterVisible = await mpage.locator('.forminator-custom-form input[name="number-1"]').first().isVisible();
    console.log('Checkbox toggle: weight visible before=', beforeHidden, ' after=', afterVisible);
  }

  await mctx.close();

  // ---------- DESKTOP ----------
  const dctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, userAgent: UA });
  const dpage = await dctx.newPage();
  const dhome = await profile(dpage, BASE);
  summarise(dhome.resources, 'DESKTOP — home');
  console.log('Nav timing:', dhome.nav);

  // Lang switch -- navigate to RU
  const ruLink = dpage.locator('.wp-block-polylang-language-switcher a:has-text("RU")');
  if (await ruLink.count()) {
    await Promise.all([
      dpage.waitForLoadState('load'),
      ruLink.first().click(),
    ]);
    await dpage.waitForTimeout(400);
    const htmlLang = await dpage.evaluate(() => document.documentElement.lang);
    console.log('After RU switch, html lang =', htmlLang);
  }

  await dctx.close();
  await browser.close();
})();
