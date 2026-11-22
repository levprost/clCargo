/* Inspect color/background of both selects' selected display AND the
 * Forminator dropdown panel (which uses .forminator-select-dropdown). */
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:8881/', { waitUntil: 'load' });
  await page.waitForSelector('.clcargo-form-section .forminator-custom-form', { timeout: 15000 });

  // Pick a value so each selection span has text
  await page.evaluate(() => {
    for (const name of ['select-1', 'select-2']) {
      const s = document.querySelector('.clcargo-form-section select[name="' + name + '"]');
      if (!s) continue;
      const first = s.querySelector('option[value]:not([value=""])');
      if (first) {
        s.value = first.value;
        s.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  });
  await page.waitForTimeout(400);

  // Dump computed styles for both selected spans
  const closed = await page.evaluate(() => {
    const result = {};
    for (const name of ['select-1', 'select-2']) {
      const col = document.querySelector('.clcargo-form-section select[name="' + name + '"]')
        .closest('.forminator-col, .forminator-field');
      const rendered = col.querySelector('.select2-selection__rendered, .select2-selection__placeholder');
      const combo = col.querySelector('[role="combobox"]');
      const outer = col.querySelector('.forminator-select, .select2-container');
      const cs = (el) => el ? {
        color: getComputedStyle(el).color,
        bg: getComputedStyle(el).backgroundColor,
        text: el.textContent.trim().slice(0, 40),
      } : null;
      result[name] = {
        rendered: cs(rendered),
        combo:    cs(combo),
        outer:    cs(outer),
      };
    }
    return result;
  });
  console.log('--- closed selected display ---');
  console.log(JSON.stringify(closed, null, 2));

  // Open the direction dropdown and probe its panel
  await page.click('.clcargo-form-section select[name="select-1"] + .forminator-select .selection');
  await page.waitForTimeout(400);
  const open = await page.evaluate(() => {
    // Forminator renders dropdown outside the field as .forminator-select-dropdown[...]
    const panel = document.querySelector('.forminator-select-dropdown, .forminator-select.forminator-select-dropdown-container--open .forminator-select-dropdown');
    const list = panel ? panel.querySelector('.select2-results__options') : null;
    const first = list ? list.querySelector('.select2-results__option') : null;
    const highlighted = list ? list.querySelector('.select2-results__option--highlighted') : null;
    const cs = (el) => el ? {
      color: getComputedStyle(el).color,
      bg: getComputedStyle(el).backgroundColor,
      border: getComputedStyle(el).border,
      text: el.textContent.trim().slice(0, 60),
    } : null;
    return {
      panelCount: document.querySelectorAll('.forminator-select-dropdown').length,
      panelVisible: panel ? getComputedStyle(panel).display : 'absent',
      panel: cs(panel),
      first: cs(first),
      highlighted: cs(highlighted),
    };
  });
  console.log('--- open dropdown panel ---');
  console.log(JSON.stringify(open, null, 2));

  await browser.close();
})();
