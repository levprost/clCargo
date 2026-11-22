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
    const parentOfForm = form.parentElement;
    const r1 = hero.getBoundingClientRect();
    const r2 = form.getBoundingClientRect();
    const cs = (el) => {
      const s = getComputedStyle(el);
      return {
        bg: s.backgroundColor, mT: s.marginTop, mB: s.marginBottom,
        pT: s.paddingTop, pB: s.paddingBottom, display: s.display,
        className: el.className.slice(0, 80),
      };
    };
    return {
      hero_bottom: r1.bottom, form_top: r2.top, gap: r2.top - r1.bottom,
      hero: cs(hero), form: cs(form),
      formParent: cs(parentOfForm),
      formParentTag: parentOfForm.tagName,
      formPrevSibling: form.previousElementSibling ? {
        tag: form.previousElementSibling.tagName,
        cls: form.previousElementSibling.className || '(none)',
        html: (form.previousElementSibling.outerHTML || '').slice(0, 200),
        bgColor: getComputedStyle(form.previousElementSibling).backgroundColor,
        marginBottom: getComputedStyle(form.previousElementSibling).marginBottom,
      } : null,
      bodyBg: getComputedStyle(document.body).backgroundColor,
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await b.close();
})();
