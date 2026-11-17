const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setViewportSize({ width: 1280, height: 900 });
  for (const url of ['http://localhost:8881/', 'http://localhost:8881/ru/home/']) {
    console.log('--- ' + url);
    await p.goto(url, { waitUntil: 'networkidle' });
    await p.waitForTimeout(500);

    const info = await p.evaluate(() => {
      const sec = document.querySelector('#form');
      const form = document.querySelector('.forminator-custom-form');
      const inputs = document.querySelectorAll('.forminator-custom-form input, .forminator-custom-form select, .forminator-custom-form textarea').length;
      const btn = document.querySelector('.forminator-custom-form button[type=submit], .forminator-button-submit');
      const secCs = sec ? getComputedStyle(sec) : null;
      const formCs = form ? getComputedStyle(form) : null;
      const rect = form ? form.getBoundingClientRect() : null;
      return {
        hasSection: !!sec,
        hasForm: !!form,
        inputs,
        hasSubmit: !!btn,
        secDisplay: secCs?.display,
        secVisibility: secCs?.visibility,
        formDisplay: formCs?.display,
        formVisibility: formCs?.visibility,
        formOpacity: formCs?.opacity,
        formHeight: rect?.height,
        formTop: rect?.top,
      };
    });
    console.log(info);

    // Scroll to form and screenshot
    await p.evaluate(() => document.querySelector('#form')?.scrollIntoView({ block: 'start' }));
    await p.waitForTimeout(400);
    const file = path.resolve(__dirname, 'shots', `formcheck-${url.includes('ru') ? 'ru' : 'uk'}.png`);
    await p.screenshot({ path: file, fullPage: false });
    console.log('shot:', file);
  }
  await b.close();
})();
