const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  for (const w of [390, 768, 1440]) {
    await p.setViewportSize({ width: w, height: 900 });
    await p.goto('http://localhost:8881/', { waitUntil: 'networkidle' });
    await p.waitForTimeout(300);
    const file = path.resolve(__dirname, 'shots', `hero-${w}.png`);
    await p.screenshot({ path: file, fullPage: false });
    console.log('shot:', file);
  }
  await b.close();
})();
