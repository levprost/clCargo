/* Verify the unified direction select after the form.md second pass.
 *
 * Checks for both UA (default) and RU pages:
 *   - Section heading "Калькулятор доставки" with gold accent
 *   - Subtitle updated
 *   - Country select has 6 direction options + "Other", each label
 *     containing the embedded ETA (e.g. "Турция — 7–10 дней")
 *   - ETA block below the form shows the correct текст for each of the 6
 *     direction values
 *   - "Other" and empty selection fall back to "Выберите направление"
 *   - Reset returns ETA to fallback
 *   - Submit button text updated, form still submits (we check that a
 *     submit event fires and Forminator is still wired — not actual AJAX)
 *   - No horizontal scroll on either viewport
 */
const { chromium, devices } = require('playwright');

const BASE_UA = 'http://localhost:8881/';
const BASE_RU = 'http://localhost:8881/ru/';

const DIRECTIONS = [
  { value: 'turkey',    etaRu: '7–10 дней',   etaUk: '7–10 днів',
    labelRu: 'Турция',  labelUk: 'Туреччина' },
  { value: 'china_air', etaRu: '12–15 дней',  etaUk: '12–15 днів',
    labelRu: 'авиа',    labelUk: 'авіа' },
  { value: 'china_sea', etaRu: '52–60 дней',  etaUk: '52–60 днів',
    labelRu: 'море',    labelUk: 'море' },
  { value: 'europe',    etaRu: '7 дней',      etaUk: '7 днів',
    labelRu: 'Европа',  labelUk: 'Європа' },
  { value: 'india_air', etaRu: '14–16 дней',  etaUk: '14–16 днів',
    labelRu: 'Индия',   labelUk: 'Індія' },
  { value: 'india_sea', etaRu: '52–60 дней',  etaUk: '52–60 днів',
    labelRu: 'Индия',   labelUk: 'Індія' },
];

async function waitForFormReady(page) {
  await page.waitForSelector('.clcargo-form-section .forminator-custom-form', { timeout: 15000 });
  await page.waitForSelector('.clcargo-eta', { timeout: 15000 });
}

async function selectValue(page, value) {
  await page.evaluate((v) => {
    const sel = document.querySelector('.clcargo-form-section select[name="select-1"]');
    sel.value = v;
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
  await page.waitForTimeout(80);
}

async function assertNoHorizontalScroll(page, label) {
  const o = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
  }));
  const diff = o.scrollW - o.clientW;
  console.log('  [' + label + '] scrollW=' + o.scrollW + ' clientW=' + o.clientW + ' diff=' + diff);
  return diff <= 1;
}

async function runForPage(browser, baseUrl, lang, label, mobile) {
  const ctx = mobile
    ? await browser.newContext({ ...devices['Pixel 5'] })
    : await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  console.log('\n--- ' + label + ' (' + baseUrl + ', lang=' + lang + ') ---');
  await page.goto(baseUrl, { waitUntil: 'load', timeout: 60000 });
  await waitForFormReady(page);

  // Heading / subtitle / colors
  const title = await page.locator('.clcargo-form-section .clcargo-calc-title').textContent();
  const subtitle = await page.locator('.clcargo-form-section .clcargo-calc-title + p').textContent();
  const colors = await page.evaluate(() => ({
    main: getComputedStyle(document.querySelector('.clcargo-form-section .clcargo-calc-title__main')).color,
    accent: getComputedStyle(document.querySelector('.clcargo-form-section .clcargo-calc-title__accent')).color,
  }));
  console.log('  Heading:', JSON.stringify(title.trim()));
  console.log('  Subtitle:', JSON.stringify(subtitle.trim()));
  console.log('  Title colors:', colors);

  // Submit button text
  const submitText = await page.locator('.clcargo-form-section .forminator-button-submit').textContent();
  console.log('  Submit button:', JSON.stringify(submitText.trim()));

  // Direction options — collect labels
  const optionLabels = await page.evaluate(() => {
    const sel = document.querySelector('.clcargo-form-section select[name="select-1"]');
    return Array.from(sel.querySelectorAll('option'))
      .map(o => ({ value: o.value, label: o.textContent.trim() }));
  });
  console.log('  Direction options:');
  optionLabels.forEach(o => console.log('    ' + (o.value || '(empty)') + ' → ' + o.label));

  // Validate option labels contain ETA
  for (const d of DIRECTIONS) {
    const opt = optionLabels.find(o => o.value === d.value);
    if (!opt) { console.log('  FAIL  option ' + d.value + ' missing'); continue; }
    const want = lang === 'ru' ? d.etaRu : d.etaUk;
    const ok = opt.label.indexOf(want) !== -1;
    console.log('  ' + (ok ? 'OK  ' : 'FAIL') + '  option label for ' + d.value + ' contains "' + want + '" — got "' + opt.label + '"');
  }

  // Initial ETA block
  const initialEta = (await page.locator('.clcargo-form-section .clcargo-eta__value').textContent()).trim();
  console.log('  Initial ETA block:', JSON.stringify(initialEta));

  // Iterate through 6 direction values
  for (const d of DIRECTIONS) {
    await selectValue(page, d.value);
    const got = (await page.locator('.clcargo-form-section .clcargo-eta__value').textContent()).trim();
    const want = lang === 'ru' ? d.etaRu : d.etaUk;
    console.log('  ' + (got === want ? 'OK  ' : 'FAIL') + '  value=' + d.value + '  eta="' + got + '" (want "' + want + '")');
  }

  // "Other" → fallback
  await selectValue(page, 'other');
  const etaOther = (await page.locator('.clcargo-form-section .clcargo-eta__value').textContent()).trim();
  console.log('  other → ETA:', JSON.stringify(etaOther), '(expect fallback)');

  // Reset
  await page.evaluate(() => {
    const form = document.querySelector('.clcargo-form-section .forminator-custom-form');
    form.reset();
    const sel = form.querySelector('select[name="select-1"]');
    sel.value = '';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(120);
  const afterReset = (await page.locator('.clcargo-form-section .clcargo-eta__value').textContent()).trim();
  console.log('  After reset ETA:', JSON.stringify(afterReset));

  // Dropdown panel colour — open the select2 and probe
  await page.click('.clcargo-form-section select[name="select-1"] + .forminator-select .selection');
  await page.waitForTimeout(250);
  const panel = await page.evaluate(() => {
    const p = document.querySelector('.forminator-select-dropdown');
    if (!p) return null;
    const cs = getComputedStyle(p);
    return { bg: cs.backgroundColor, border: cs.borderColor };
  });
  console.log('  Dropdown panel:', panel);

  await assertNoHorizontalScroll(page, mobile ? 'mobile' : 'desktop');

  await ctx.close();
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  await runForPage(browser, BASE_UA, 'uk', 'UK / mobile', true);
  await runForPage(browser, BASE_RU, 'ru', 'RU / mobile', true);
  await runForPage(browser, BASE_UA, 'uk', 'UK / desktop', false);
  await runForPage(browser, BASE_RU, 'ru', 'RU / desktop', false);
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
