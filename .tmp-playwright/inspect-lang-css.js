const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setViewportSize({ width: 1440, height: 800 });
  await p.goto('http://localhost:8881/', { waitUntil: 'domcontentloaded' });
  const info = await p.evaluate(() => {
    const items = [...document.querySelectorAll('.clcargo-header__lang li')];
    return items.map(li => {
      const a = li.querySelector('a');
      const cs = getComputedStyle(a);
      return {
        li: li.className,
        text: a.textContent.trim(),
        aBg: cs.backgroundColor,
        aColor: cs.color,
      };
    });
  });
  console.log(JSON.stringify(info, null, 2));
  await b.close();
})();
