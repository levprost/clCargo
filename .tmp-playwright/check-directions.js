const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  for (const w of [400, 599, 600, 900, 1099, 1100, 1280, 1440]) {
    await p.setViewportSize({ width: w, height: 900 });
    await p.goto('http://localhost:8881/', { waitUntil: 'networkidle' });
    await p.evaluate(() => document.querySelector('#directions')?.scrollIntoView({ block: 'start' }));
    await p.waitForTimeout(400);
    const file = path.resolve(__dirname, 'shots', `dir-${String(w).padStart(4,'0')}.png`);
    const info = await p.evaluate(() => {
      const sec = document.querySelector('#directions');
      const cards = [...document.querySelectorAll('#directions .clcargo-direction-card')];
      return {
        sectionInnerPaddingLeft: sec && getComputedStyle(sec.querySelector('.wp-block-group')).paddingLeft,
        sectionInnerPaddingRight: sec && getComputedStyle(sec.querySelector('.wp-block-group')).paddingRight,
        cards: cards.map(c => {
          const r = c.getBoundingClientRect();
          return { w: Math.round(r.width), h: Math.round(r.height) };
        }),
      };
    });
    console.log('w=', w, JSON.stringify(info));
    await p.screenshot({ path: file, fullPage: false });
  }
  await b.close();
})();
