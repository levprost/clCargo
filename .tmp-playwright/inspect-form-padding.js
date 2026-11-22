const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setViewportSize({ width: 1440, height: 900 });
  await p.goto('http://localhost:8881/', { waitUntil: 'load' });
  await p.waitForSelector('.clcargo-form-section', { timeout: 15000 });
  const data = await p.evaluate(() => {
    const form = document.querySelector('.clcargo-form-section');
    return {
      inlineStyle: form.getAttribute('style'),
      className: form.className,
      cs_paddingTop: getComputedStyle(form).paddingTop,
      cs_paddingBottom: getComputedStyle(form).paddingBottom,
      cs_marginTop: getComputedStyle(form).marginTop,
      cs_marginBottom: getComputedStyle(form).marginBottom,
    };
  });
  console.log(JSON.stringify(data, null, 2));
  await b.close();
})();
