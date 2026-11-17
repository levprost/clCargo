const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setViewportSize({ width: 1440, height: 800 });
  for (const url of ['http://localhost:8881/', 'http://localhost:8881/ru/home/']) {
    await p.goto(url, { waitUntil: 'domcontentloaded' });
    const info = await p.evaluate(() => {
      const el = document.querySelector('.clcargo-header__lang');
      if (!el) return { err: 'no .clcargo-header__lang' };
      const ul = el.querySelector('ul');
      const items = [...(ul ? ul.children : [])].map(li => ({
        className: li.className,
        text: li.textContent.trim(),
        linkClass: li.querySelector('a')?.className || '',
        linkText: li.querySelector('a')?.textContent.trim() || '',
      }));
      return {
        outerHTML: el.outerHTML.slice(0, 800),
        ulDisplay: ul ? getComputedStyle(ul).display : null,
        ulFlexDir: ul ? getComputedStyle(ul).flexDirection : null,
        items,
      };
    });
    console.log('=== ' + url);
    console.log(JSON.stringify(info, null, 2));
  }
  await b.close();
})();
