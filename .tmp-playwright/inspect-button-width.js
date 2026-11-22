const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setViewportSize({ width: 1440, height: 900 });
  await p.goto('http://localhost:8881/', { waitUntil: 'load' });
  await p.waitForSelector('.clcargo-eta', { timeout: 15000 });
  const info = await p.evaluate(() => {
    const card   = document.querySelector('.clcargo-form-section > .wp-block-group');
    const eta    = document.querySelector('.clcargo-eta');
    const etaRow = document.querySelector('.clcargo-eta-row');
    const btn    = document.querySelector('.clcargo-form-section .forminator-button-submit');
    const btnRow = btn.closest('.forminator-row');
    const btnCol = btn.closest('.forminator-col');
    const r = (el) => el ? { w: Math.round(el.getBoundingClientRect().width), pL: getComputedStyle(el).paddingLeft, pR: getComputedStyle(el).paddingRight, mL: getComputedStyle(el).marginLeft, mR: getComputedStyle(el).marginRight, cls: el.className.slice(0,80) } : null;
    return {
      card: r(card),
      eta: r(eta),
      etaRow: r(etaRow),
      btn: r(btn),
      btnRow: r(btnRow),
      btnCol: r(btnCol),
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await b.close();
})();
