const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setViewportSize({ width: 1280, height: 900 });
  await p.goto('http://localhost:8881/', { waitUntil: 'networkidle' });
  const html = await p.evaluate(() => {
    const sec = document.querySelector('#form');
    return sec ? sec.outerHTML : null;
  });
  console.log(html?.slice(0, 5000));
  console.log('---');
  console.log('full length:', html?.length);
  await b.close();
})();
