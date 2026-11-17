const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setViewportSize({ width: 1280, height: 900 });
  for (const url of ['http://localhost:8881/', 'http://localhost:8881/ru/home/']) {
    console.log('--- ' + url);
    await p.goto(url, { waitUntil: 'networkidle' });
    await p.waitForTimeout(500);
    const data = await p.evaluate(() => {
      return [...document.querySelectorAll('.forminator-custom-form select')].map(sel => {
        const next = sel.closest('.forminator-field, .forminator-col, div')?.querySelector('.select2');
        const ph = document.querySelector('.select2-selection__placeholder');
        return {
          name: sel.name,
          firstOption: sel.querySelector('option')?.textContent,
          select2Sibling: !!next,
        };
      });
    });
    console.log(JSON.stringify(data, null, 2));
    const phs = await p.evaluate(() => {
      return [...document.querySelectorAll('.select2-selection__placeholder')].map(x => ({
        text: x.textContent,
        parentLabelId: x.closest('.select2')?.getAttribute('aria-labelledby') || null,
      }));
    });
    console.log('placeholders:', JSON.stringify(phs, null, 2));
  }
  await b.close();
})();
