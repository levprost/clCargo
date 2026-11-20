const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:8881';
const URLS = {
  uk: BASE + '/',
  ru: BASE + '/ru/home/',
};

const WIDTHS = [320, 390, 768, 1029, 1030, 1031, 1100, 1280, 1440];
const SHOT_WIDTHS = [320, 390, 768, 1030, 1031, 1440];

const OUT_DIR = path.resolve(__dirname, 'shots');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

async function inspect(page) {
  return await page.evaluate(() => {
    const header = document.querySelector('.clcargo-header');
    if (!header) return { error: 'no header' };

    const scrollWidth = document.documentElement.scrollWidth;
    const clientWidth = document.documentElement.clientWidth;
    const hScroll = scrollWidth > clientWidth + 1;

    const sels = [
      ['brand',    '.clcargo-brand'],
      ['badge',    '.clcargo-brand__badge'],
      ['name',     '.clcargo-brand__name'],
      ['nav',      '.clcargo-header__nav'],
      ['contact',  '.clcargo-header__contact'],
      ['lang',     '.clcargo-header__lang'],
      ['cta',      '.clcargo-header__cta-wrap'],
      ['burger',   '.clcargo-header__burger'],
    ];
    const rects = {};
    for (const [name, sel] of sels) {
      const el = header.querySelector(sel);
      if (!el) { rects[name] = null; continue; }
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      const visible =
        el.offsetParent !== null &&
        r.width > 0 && r.height > 0 &&
        style.visibility !== 'hidden' &&
        style.display !== 'none';
      rects[name] = {
        visible,
        x: Math.round(r.x), y: Math.round(r.y),
        w: Math.round(r.width), h: Math.round(r.height),
        right: Math.round(r.right), bottom: Math.round(r.bottom),
        display: style.display,
      };
    }

    // Overlap check among visible top-level entries only
    const topEntries = Object.entries(rects).filter(([n, r]) => r && r.visible && n !== 'badge' && n !== 'name');
    const overlaps = [];
    for (let i = 0; i < topEntries.length; i++) {
      for (let j = i + 1; j < topEntries.length; j++) {
        const [an, ar] = topEntries[i];
        const [bn, br] = topEntries[j];
        const xOverlap = Math.max(0, Math.min(ar.right, br.right) - Math.max(ar.x, br.x));
        const yOverlap = Math.max(0, Math.min(ar.bottom, br.bottom) - Math.max(ar.y, br.y));
        if (xOverlap > 1 && yOverlap > 1) {
          overlaps.push({ a: an, b: bn, xOverlap, yOverlap });
        }
      }
    }

    const outOfBounds = [];
    for (const [name, r] of Object.entries(rects)) {
      if (!r || !r.visible) continue;
      if (r.right > clientWidth + 1) outOfBounds.push({ name, right: r.right, vw: clientWidth });
      if (r.x < -1) outOfBounds.push({ name, x: r.x });
    }

    // Language switcher order (UA then RU)
    const langLinks = Array.from(header.querySelectorAll('.clcargo-header__lang li a'));
    const langOrder = langLinks.map(a => ({
      text: a.textContent.trim(),
      lang: a.getAttribute('lang') || '',
      x: Math.round(a.getBoundingClientRect().x),
    })).sort((a, b) => a.x - b.x).map(o => `${o.lang}:${o.text}`);

    // Brand link href
    const brand = header.querySelector('.clcargo-brand');
    const brandHref = brand ? brand.getAttribute('href') : null;

    // Contact button present / label
    const contactBtn = header.querySelector('.clcargo-header__contact');
    const contactText = contactBtn ? contactBtn.textContent.trim() : null;

    const headerRect = header.getBoundingClientRect();
    return {
      scrollWidth, clientWidth, hScroll,
      headerHeight: Math.round(headerRect.height),
      rects, overlaps, outOfBounds,
      langOrder, brandHref, contactText,
    };
  });
}

async function check(page, url, lang, width, takeShot = false, openBurger = false) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(250);

  if (openBurger) {
    const btn = page.locator('.clcargo-header__burger');
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(350);
    }
  }

  const report = await inspect(page);

  if (takeShot) {
    const suffix = openBurger ? '-open' : '';
    const file = path.join(OUT_DIR, `new-${lang}-${width}${suffix}.png`);
    const h = openBurger ? 700 : Math.max(120, (report.headerHeight || 100) + 30);
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
      if (w === 390 && takeShot) {
        results.push(await check(page, url, lang, w, true, true));
      }
    }
  }

  let failures = 0;
  for (const r of results) {
    const rep = r.report;
    const fail = rep.hScroll || rep.overlaps.length || rep.outOfBounds.length;
    if (fail) failures++;
    const o = rep.overlaps.map(x => `${x.a}∩${x.b}`).join(',') || '-';
    const b = rep.outOfBounds.map(x => `${x.name}>${x.right}`).join(',') || '-';
    const nameVisible = rep.rects.name ? rep.rects.name.visible : 'n/a';
    const phoneVisible = rep.rects.phone ? rep.rects.phone.visible : 'n/a';
    const burgerVisible = rep.rects.burger ? rep.rects.burger.visible : 'n/a';
    const contactVisible = rep.rects.contact ? rep.rects.contact.visible : 'n/a';
    console.log(
      `[${fail ? 'FAIL' : 'ok'}] ${r.lang.padEnd(2)} w=${String(r.width).padStart(4)} ${r.openBurger ? '(open) ' : '       '} ` +
      `hScroll=${rep.hScroll} h=${rep.headerHeight} ` +
      `name=${nameVisible} contact=${contactVisible} burger=${burgerVisible} ` +
      `langs=[${rep.langOrder.join(', ')}] ` +
      `brandHref=${rep.brandHref} ` +
      `contactText="${rep.contactText}" ` +
      `overlaps=${o} oob=${b}` +
      (rep.shot ? ` shot=${rep.shot}` : '')
    );
  }
  console.log(`\nTotal: ${results.length}, failures: ${failures}`);
  await browser.close();
  process.exit(failures ? 1 : 0);
})().catch(err => { console.error(err); process.exit(2); });
