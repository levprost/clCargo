const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('http://localhost:8881/', { waitUntil: 'load' });
  await p.waitForSelector('.clcargo-form-section .forminator-custom-form', { timeout: 15000 });
  await p.evaluate(() => {
    const sel = document.querySelector('.clcargo-form-section select[name="select-1"]');
    sel.value = 'china';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await p.waitForTimeout(500);
  const info = await p.evaluate(() => {
    // Get the entire select2 container near select-1
    const sel = document.querySelector('.clcargo-form-section select[name="select-1"]');
    const col = sel.closest('.forminator-col, .forminator-field');
    const combo = col ? col.querySelector('[role="combobox"]') : null;
    const rendered = col ? col.querySelector('.select2-selection__rendered, .select2-selection__placeholder') : null;
    return {
      col_html: col ? col.innerHTML.substr(0, 2000) : null,
      rendered_text: rendered ? rendered.textContent : null,
      rendered_color: rendered ? getComputedStyle(rendered).color : null,
      rendered_bg: rendered ? getComputedStyle(rendered).backgroundColor : null,
      rendered_cls: rendered ? rendered.className : null,
      combo_color: combo ? getComputedStyle(combo).color : null,
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await b.close();
})();
