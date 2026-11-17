const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setViewportSize({ width: 1440, height: 900 });
  await p.goto('http://localhost:8881/', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.querySelector('#directions')?.scrollIntoView({ block: 'start' }));
  await p.waitForTimeout(400);
  const data = await p.evaluate(() => {
    return [...document.querySelectorAll('#directions .clcargo-direction-card')].map(c => {
      const card = c.getBoundingClientRect();
      const lastP = c.querySelector('p:last-child');
      const lastPRect = lastP ? lastP.getBoundingClientRect() : null;
      const ul = c.querySelector('ul');
      const ulRect = ul ? ul.getBoundingClientRect() : null;
      const h3 = c.querySelector('h3')?.textContent?.trim();
      return {
        card: h3,
        cardBottom: Math.round(card.bottom),
        lastPText: lastP?.textContent?.trim().slice(0, 40),
        lastPBottom: lastPRect ? Math.round(lastPRect.bottom) : null,
        gapToCardBottom: lastPRect ? Math.round(card.bottom - lastPRect.bottom) : null,
        ulBottom: ulRect ? Math.round(ulRect.bottom) : null,
        gapUlToLastP: (ulRect && lastPRect) ? Math.round(lastPRect.top - ulRect.bottom) : null,
      };
    });
  });
  console.log(JSON.stringify(data, null, 2));
  await b.close();
})();
