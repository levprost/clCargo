const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setViewportSize({ width: 1280, height: 900 });
  for (const [lang, url] of [['uk','http://localhost:8881/'],['ru','http://localhost:8881/ru/home/']]) {
    console.log('--- ' + lang + ' ' + url);
    await p.goto(url, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.querySelector('#form')?.scrollIntoView({ block: 'start' }));
    await p.waitForTimeout(400);
    const info = await p.evaluate(() => {
      const form = document.querySelector('.forminator-custom-form');
      const labels = [...document.querySelectorAll('.forminator-custom-form label, .forminator-label')].map(l => l.textContent.trim()).filter(Boolean);
      const submit = document.querySelector('.forminator-custom-form button[type=submit]');
      const options = [...document.querySelectorAll('.forminator-custom-form option')].map(o => o.textContent.trim()).filter(Boolean);
      return {
        hasForm: !!form, formId: form?.getAttribute('data-form-id'),
        labelsCount: labels.length,
        firstLabels: labels.slice(0, 15),
        submitText: submit?.textContent.trim(),
        options: options.slice(0, 15),
      };
    });
    console.log(JSON.stringify(info, null, 2));
    const file = path.resolve(__dirname, 'shots', `form-${lang}.png`);
    await p.screenshot({ path: file, clip: { x: 0, y: 0, width: 1280, height: 900 }});
    console.log('shot:', file);
  }
  await b.close();
})();
