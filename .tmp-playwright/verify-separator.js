const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setViewportSize({ width: 1440, height: 900 });
  await p.goto('http://localhost:8881/', { waitUntil: 'load' });
  await p.waitForSelector('.clcargo-form-section', { timeout: 15000 });
  const info = await p.evaluate(() => {
    const hero = document.querySelector('.clcargo-section--hero');
    const form = document.querySelector('.clcargo-form-section');
    const r1 = hero.getBoundingClientRect();
    const r2 = form.getBoundingClientRect();
    const cs = getComputedStyle(form);
    return {
      gap: r2.top - r1.bottom,
      heroBg: getComputedStyle(hero).backgroundColor,
      formBg: cs.backgroundColor,
      formBorderTop: cs.borderTopWidth + ' ' + cs.borderTopStyle + ' ' + cs.borderTopColor,
      formPaddingTop: cs.paddingTop,
      formMarginTop: cs.marginTop,
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await b.close();
})();
