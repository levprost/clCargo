/* Reproduce the bug: user clicks a direction in the Forminator Select2
 * dropdown and the ETA block doesn't update.
 *
 * Suspicion: Select2 triggers 'change' via jQuery.trigger('change'),
 * which fires jQuery handlers but NOT native addEventListener('change')
 * in jQuery 3.x. My form-logic.js uses only addEventListener.
 */
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  p.on('console', msg => console.log('BROWSER:', msg.text()));

  await p.goto('http://localhost:8881/', { waitUntil: 'load' });
  await p.waitForSelector('.clcargo-form-section .forminator-custom-form', { timeout: 15000 });
  await p.waitForSelector('.clcargo-eta', { timeout: 15000 });
  await p.locator('#form').scrollIntoViewIfNeeded();
  await p.waitForTimeout(600);

  // Instrument: watch both native and jQuery change dispatch counts
  await p.evaluate(() => {
    window.__nativeChangeCount = 0;
    window.__jqChangeCount = 0;
    const sel = document.querySelector('.clcargo-form-section select[name="select-1"]');
    sel.addEventListener('change', () => window.__nativeChangeCount++);
    if (window.jQuery) {
      window.jQuery(sel).on('change.probe', () => window.__jqChangeCount++);
    }
    console.log('has jQuery:', !!window.jQuery, 'jQuery version:', window.jQuery ? window.jQuery.fn.jquery : null);
  });

  const beforeEta = (await p.locator('.clcargo-eta__value').textContent()).trim();
  console.log('Before click, ETA:', JSON.stringify(beforeEta));

  // Real user flow: click the Select2 widget, then a dropdown option
  await p.click('.clcargo-form-section select[name="select-1"] + .forminator-select .selection');
  await p.waitForTimeout(300);

  // Pick the china_air option by text
  const opt = p.locator('.forminator-select-dropdown .select2-results__option', { hasText: 'авіа — 12–15 днів' }).first();
  await opt.click();
  await p.waitForTimeout(400);

  const counts = await p.evaluate(() => ({
    native: window.__nativeChangeCount,
    jq: window.__jqChangeCount,
    value: document.querySelector('.clcargo-form-section select[name="select-1"]').value,
  }));
  console.log('After click, counts:', counts);
  const afterEta = (await p.locator('.clcargo-eta__value').textContent()).trim();
  console.log('After click, ETA:', JSON.stringify(afterEta));

  await b.close();
})();
