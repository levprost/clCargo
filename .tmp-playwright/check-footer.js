const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setViewportSize({ width: 1280, height: 900 });
  for (const [lang, url] of [['uk','http://localhost:8881/'],['ru','http://localhost:8881/ru/home/']]) {
    await p.goto(url, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.querySelector('.clcargo-footer')?.scrollIntoView({ block: 'end' }));
    await p.waitForTimeout(300);
    const txt = await p.evaluate(() => document.querySelector('.clcargo-footer')?.innerText);
    console.log('---', lang);
    console.log(txt);
    try {
      const file = path.resolve(__dirname, 'shots', `footer-${lang}.png`);
      await p.locator('.clcargo-footer').screenshot({ path: file });
      console.log('shot:', file);
    } catch (e) { console.log('shot err:', e.message); }
  }
  await b.close();
})();
