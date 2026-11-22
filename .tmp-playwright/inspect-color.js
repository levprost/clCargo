const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('http://localhost:8881/', { waitUntil: 'load' });
  await p.waitForSelector('.clcargo-form-section .forminator-custom-form', { timeout: 15000 });
  await p.evaluate(() => {
    const sel = document.querySelector('.clcargo-form-section select[name="select-1"]');
    sel.value = 'china';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await p.waitForTimeout(400);
  const info = await p.evaluate(() => {
    // Find all elements that display "Китай"
    const all = Array.from(document.querySelectorAll('.clcargo-form-section *'));
    const matches = all.filter(el => el.children.length === 0 && el.textContent.trim().startsWith('Китай'));
    return matches.map(el => {
      const cs = getComputedStyle(el);
      return {
        tag: el.tagName,
        cls: el.className,
        text: el.textContent.trim().slice(0,30),
        color: cs.color,
        bg: cs.backgroundColor,
        parentClass: el.parentElement ? el.parentElement.className : '',
        parentColor: el.parentElement ? getComputedStyle(el.parentElement).color : '',
      };
    });
  });
  console.log(JSON.stringify(info, null, 2));
  await b.close();
})();
