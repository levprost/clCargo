const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:8881';
const URLS = {
  uk: BASE + '/',
  ru: BASE + '/ru/home/',
};

const WIDTHS = [320, 390, 768, 1029, 1030, 1031, 1100, 1280, 1440];
const SHOT_WIDTHS = [390, 1030, 1031, 1440];

const OUT_DIR = path.resolve(__dirname, 'shots');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

/** Check that header element rects don't overlap and don't produce h-scroll. */
async function inspect(page, label) {
  return await page.evaluate(() => {
    const header = document.querySelector('.clcargo-header');
    if (!header) return { error: 'no header' };

    const scrollWidth = document.documentElement.scrollWidth;
    const clientWidth = document.documentElement.clientWidth;
    const hScroll = scrollWidth > clientWidth + 1;

    const sels = [
      ['brand',  '.clcargo-header__brand'],
      ['nav',    '.clcargo-header__nav'],
      ['phone',  '.clcargo-header__phone'],
      ['lang',   '.clcargo-header__lang'],
      ['cta',    '.clcargo-header__cta-wrap'],
      ['burger', '.clcargo-header__burger'],
    ];
    const rects = {};
    for (const [name, sel] of sels) {
      const el = header.querySelector(sel);
      if (!el) { rects[name] = null; continue; }
      const r = el.getBoundingClientRect();
      const visible = el.offsetParent !== null && r.width > 0 && r.height > 0;
      rects[name] = {
        visible,
        x: Math.round(r.x), y: Math.round(r.y),
        w: Math.round(r.width), h: Math.round(r.height),
        right: Math.round(r.right), bottom: Math.round(r.bottom),
      };
    }

    // Check overlaps among visible elements (ignoring burger/dropdown items on
    // mobile – they live on different grid rows, which is fine).
    const visibleEntries = Object.entries(rects).filter(([, r]) => r && r.visible);
    const overlaps = [];
    for (let i = 0; i < visibleEntries.length; i++) {
      for (let j = i + 1; j < visibleEntries.length; j++) {
        const [an, ar] = visibleEntries[i];
        const [bn, br] = visibleEntries[j];
        const xOverlap = Math.max(0, Math.min(ar.right, br.right) - Math.max(ar.x, br.x));
        const yOverlap = Math.max(0, Math.min(ar.bottom, br.bottom) - Math.max(ar.y, br.y));
        if (xOverlap > 1 && yOverlap > 1) {
          overlaps.push({ a: an, b: bn, xOverlap, yOverlap });
        }
      }
    }

    const headerRect = header.getBoundingClientRect();
    const outOfBounds = [];
    for (const [name, r] of visibleEntries) {
      if (r.right > clientWidth + 1) outOfBounds.push({ name, right: r.right, vw: clientWidth });
      if (r.x < -1) outOfBounds.push({ name, x: r.x });
    }

    return {
      scrollWidth, clientWidth, hScroll,
      headerHeight: Math.round(headerRect.height),
      rects, overlaps, outOfBounds,
    };
  });
}

async function check(page, url, lang, width, takeShot = false, openBurger = false) {
  await page.setViewportSize({ width, height: 800 });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  // Small settle
  await page.waitForTimeout(250);

  if (openBurger) {
    const btn = page.locator('.clcargo-header__burger');
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(250);
    }
  }

  const report = await inspect(page, `${lang}@${width}${openBurger ? '+open' : ''}`);

  if (takeShot) {
    const suffix = openBurger ? '-open' : '';
    const file = path.join(OUT_DIR, `${lang}-${width}${suffix}.png`);
    const h = openBurger ? 900 : Math.max(120, (report.headerHeight || 100) + 20);
    await page.screenshot({ path: file, clip: { x: 0, y: 0, width, height: h } });
    report.shot = path.relative(process.cwd(), file);
  }

  return { lang, width, openBurger, report };
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const results = [];

  for (const [lang, url] of Object.entries(URLS)) {
    for (const w of WIDTHS) {
      const takeShot = SHOT_WIDTHS.includes(w);
      results.push(await check(page, url, lang, w, takeShot, false));
      // Also capture an "open" shot at 390 (mobile dropdown)
      if (w === 390 && takeShot) {
        results.push(await check(page, url, lang, w, true, true));
      }
    }
  }

  // Print concise report
  let failures = 0;
  for (const r of results) {
    const flag = (r.report.hScroll || r.report.overlaps.length || r.report.outOfBounds.length) ? 'FAIL' : 'ok';
    if (flag === 'FAIL') failures++;
    const o = r.report.overlaps.map(x => `${x.a}∩${x.b}`).join(',') || '-';
    const b = r.report.outOfBounds.map(x => `${x.name}>${x.right}`).join(',') || '-';
    console.log(
      `[${flag}] ${r.lang.padEnd(2)} w=${String(r.width).padStart(4)} ${r.openBurger ? '(open) ' : '       '} ` +
      `hScroll=${r.report.hScroll} headerH=${r.report.headerHeight} overlaps=${o} oob=${b}` +
      (r.report.shot ? ` shot=${r.report.shot}` : '')
    );
  }
  console.log(`\nTotal: ${results.length}, failures: ${failures}`);
  await browser.close();
  process.exit(failures ? 1 : 0);
})().catch(err => { console.error(err); process.exit(2); });
