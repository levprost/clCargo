const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:8881';
const PAGES = { uk: BASE + '/', ru: BASE + '/ru/home/' };
const WIDTHS = [320, 360, 390, 430, 768, 1029, 1030, 1031, 1280, 1440];
const CONTENT_UK = require('../CL-CARGO-Hero-Claude/cl-cargo-hero-kit/content.json').uk;
const CONTENT_RU = require('../CL-CARGO-Hero-Claude/cl-cargo-hero-kit/content.json').ru;

const SHOT_DIR = path.resolve(__dirname, 'shots');
if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true });

function ok(flag, msg, extra) {
  const tag = flag ? ' ok ' : 'FAIL';
  console.log('[' + tag + '] ' + msg + (extra ? '  ' + extra : ''));
  return flag ? 0 : 1;
}

async function viewportAudit(page, lang, w) {
  await page.setViewportSize({ width: w, height: Math.max(900, 2200) });
  await page.goto(PAGES[lang], { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  const report = await page.evaluate((cnt) => {
    const hero = document.querySelector('.clcargo-hero');
    if (!hero) return { error: 'no hero' };

    const bannerEl = document.querySelector('.clcargo-hero__banner');
    const photoEl  = document.querySelector('.clcargo-hero__photo');
    const bannerCs = bannerEl ? getComputedStyle(bannerEl) : null;
    const photoCs  = photoEl  ? getComputedStyle(photoEl)  : null;
    const bannerVisible = bannerCs && bannerCs.display !== 'none';
    const photoVisible  = photoCs  && photoCs.display  !== 'none';

    // DOM visual order (by top)
    const picks = [['banner','.clcargo-hero__banner'],['badge','.clcargo-hero__badge'],['h1','.clcargo-hero__title'],['lead','.clcargo-hero__lead'],['dest','.clcargo-hero__destinations'],['details','.clcargo-hero__details'],['calc','.clcargo-hero__cta--primary'],['call','.clcargo-hero__cta--secondary'],['photo','.clcargo-hero__photo'],['motto','.clcargo-hero__motto'],['highlights','.clcargo-hero__highlights']];
    const boxes = picks.map(([name, sel]) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || r.width === 0) return null;
      return { name, top: Math.round(r.top), left: Math.round(r.left), right: Math.round(r.right), bottom: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) };
    }).filter(Boolean);

    const visualOrder = boxes.slice().sort((a, b) => a.top - b.top || a.left - b.left).map(b => b.name);

    // Overlaps among visible boxes
    const overlaps = [];
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      const xo = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
      const yo = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      if (xo > 3 && yo > 3) overlaps.push(a.name + '∩' + b.name);
    }

    const hScroll = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;

    // Banner integrity
    let bannerInfo = null;
    if (bannerEl && bannerVisible) {
      const img = bannerEl.querySelector('img');
      const r = bannerEl.getBoundingClientRect();
      bannerInfo = {
        w: Math.round(r.width),
        h: Math.round(r.height),
        ratio: (r.height / r.width).toFixed(3),
        objectFit: img ? getComputedStyle(img).objectFit : null,
        currentSrc: img ? (img.currentSrc || '').substring((img.currentSrc || '').lastIndexOf('/') + 1).substring(0, 40) : null,
        intrinsicW: img ? img.getAttribute('width') : null,
      };
    }

    // H1 count across page
    const h1Count = document.querySelectorAll('h1').length;
    const heroH1 = document.querySelector('.clcargo-hero h1.clcargo-hero__title');
    const h1Text = heroH1 ? heroH1.textContent.replace(/\s+/g, ' ').trim() : null;

    // Text equality checks — strip apostrophe variants and whitespace
    const norm = s => (s || '').replace(/[’‘']/g, "'").replace(/\s+/g, ' ').trim();

    const badge = document.querySelector('.clcargo-hero__badge');
    const badgeText = badge ? norm(badge.textContent) : null;
    const lead = document.querySelector('.clcargo-hero__lead');
    const leadText = lead ? norm(lead.textContent) : null;
    const details = document.querySelector('.clcargo-hero__details');
    const detailsText = details ? norm(details.textContent) : null;
    const mottoTitle = document.querySelector('.clcargo-hero__motto-title');
    const mottoTitleText = mottoTitle ? norm(mottoTitle.textContent) : null;
    const mottoSub = document.querySelector('.clcargo-hero__motto-sub');
    const mottoSubText = mottoSub ? norm(mottoSub.textContent) : null;

    const destNames = Array.from(document.querySelectorAll('.clcargo-hero__dest-name')).map(e => norm(e.textContent));
    const highlightTexts = Array.from(document.querySelectorAll('.clcargo-hero__highlight-text')).map(e => norm(e.textContent));
    const btnCalc = norm(document.querySelector('.clcargo-hero__cta--primary').textContent);
    const btnCall = norm(document.querySelector('.clcargo-hero__cta--secondary').textContent);

    const bannerAriaLabel = bannerEl ? bannerEl.getAttribute('aria-label') : null;
    const bannerImg = bannerEl ? bannerEl.querySelector('img') : null;
    const bannerAlt = bannerImg ? bannerImg.getAttribute('alt') : null;

    // Keyboard affordance — buttons/links focusable + visible outline on focus
    const focusables = Array.from(document.querySelectorAll('.clcargo-hero a, .clcargo-hero button')).map(el => ({ tag: el.tagName, tabIndex: el.tabIndex, label: (el.getAttribute('aria-label') || norm(el.textContent) || '').substring(0, 40) }));

    // Decorative SVGs — should have aria-hidden
    const svgs = Array.from(document.querySelectorAll('.clcargo-hero svg'));
    const svgsWithoutAriaHidden = svgs.filter(s => s.getAttribute('aria-hidden') !== 'true').length;

    // Nested anchors
    const nestedAnchors = document.querySelectorAll('.clcargo-hero a a').length;

    // Banner link target
    const bannerHref = bannerEl ? bannerEl.getAttribute('href') : null;
    const calcHref = document.querySelector('.clcargo-hero__cta--primary').getAttribute('href');
    const callAttr = document.querySelector('.clcargo-hero__cta--secondary').getAttribute('data-clcargo-contact-open');

    return {
      hScroll, overlaps, visualOrder,
      bannerVisible, photoVisible, bannerInfo,
      h1Count, h1Text,
      badgeText, leadText, detailsText, mottoTitleText, mottoSubText,
      destNames, highlightTexts, btnCalc, btnCall,
      bannerAriaLabel, bannerAlt, bannerHref, calcHref, callAttr,
      focusables, svgsWithoutAriaHidden, nestedAnchors,
    };
  });

  return report;
}

(async () => {
  const browser = await chromium.launch();
  let failures = 0;
  let checked = 0;

  for (const lang of ['uk', 'ru']) {
    const cnt = lang === 'uk' ? CONTENT_UK : CONTENT_RU;
    const norm = s => (s || '').replace(/[’‘']/g, "'").replace(/\s+/g, ' ').trim();

    for (const w of WIDTHS) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 2200 } });
      const page = await ctx.newPage();
      const r = await viewportAudit(page, lang, w);
      await ctx.close();
      checked++;
      console.log('\n--- ' + lang + ' @ ' + w + 'px ---');

      // 1 & 2. Visibility & layout
      if (w <= 1030) {
        failures += ok(r.bannerVisible, 'banner visible (≤1030)');
        failures += ok(!r.photoVisible,   'desktop photo hidden');
      } else {
        failures += ok(!r.bannerVisible, 'banner hidden (>1030)');
        failures += ok(r.photoVisible,   'desktop photo visible');
      }

      // 3. Mobile order
      if (w <= 1030) {
        const visible = r.visualOrder.filter(n => ['banner','badge','h1','lead','dest','details','calc','call','motto','highlights'].includes(n));
        const expected = ['banner','badge','h1','lead','dest','details','calc','call','motto','highlights'];
        failures += ok(JSON.stringify(visible) === JSON.stringify(expected), 'mobile order', JSON.stringify(visible));
      } else {
        // Desktop: banner absent, photo visible at right of text column
        const expectedDesk = ['badge','h1','lead','dest','details','calc','call','photo','motto','highlights'];
        // Order may vary because photo is in right column parallel to text; just check banner not in order
        failures += ok(!r.visualOrder.includes('banner'), 'desktop: no banner in visual order');
      }

      // 4. No overlaps, no h-scroll
      failures += ok(!r.hScroll,            'no horizontal scroll');
      failures += ok(r.overlaps.length === 0, 'no overlaps', r.overlaps.join(','));

      // 5. Banner integrity (≤1030)
      if (w <= 1030) {
        const info = r.bannerInfo;
        failures += ok(info && Math.abs(parseFloat(info.ratio) - 1) < 0.02, 'banner 1:1', info ? (info.w + '×' + info.h + ' r=' + info.ratio) : 'no info');
        failures += ok(info && info.objectFit !== 'cover', 'banner object-fit !== cover', info ? info.objectFit : '');
        failures += ok(info && info.intrinsicW === '1254', 'banner intrinsic reserved 1254×1254');
      }

      // 6. Single H1 + content localization
      failures += ok(r.h1Count === 1, 'single H1 on page', 'got ' + r.h1Count);
      const expectedH1 = norm(cnt.heroTitle + ' ' + cnt.heroTitleAccent);
      failures += ok(norm(r.h1Text) === expectedH1, 'H1 text matches content.json', norm(r.h1Text));
      failures += ok(r.badgeText === norm(cnt.expBadge), 'badge text', r.badgeText);
      failures += ok(r.leadText === norm(cnt.heroLead + ' ' + cnt.heroWeight), 'lead text', r.leadText);
      failures += ok(r.detailsText === norm(cnt.heroDetails), 'details text');
      failures += ok(r.mottoTitleText === norm(cnt.mottoTitle), 'motto title');
      failures += ok(r.mottoSubText === norm(cnt.mottoSub), 'motto sub');
      failures += ok(JSON.stringify(r.destNames) === JSON.stringify(cnt.destinations), 'destinations list', JSON.stringify(r.destNames));
      failures += ok(JSON.stringify(r.highlightTexts) === JSON.stringify(cnt.highlights), 'highlights list');
      failures += ok(r.btnCalc === norm(cnt.btnCalc), 'btnCalc text');
      failures += ok(r.btnCall === norm(cnt.btnCall), 'btnCall text');

      // Banner alt/aria-label (always from current lang content)
      if (w <= 1030) {
        failures += ok(r.bannerAlt === cnt.bannerAlt, 'banner alt localized');
        failures += ok(r.bannerAriaLabel === cnt.bannerLinkLabel, 'banner aria-label localized');
      }

      // 7. Actions preserved
      failures += ok(r.calcHref === '#form', 'calc CTA → #form');
      failures += ok(r.callAttr !== null, 'call CTA has data-clcargo-contact-open');
      if (w <= 1030) {
        failures += ok(r.bannerHref === '#form', 'banner link → #form');
      }

      // 8. A11y basics: no nested <a>, decorative SVGs aria-hidden
      failures += ok(r.nestedAnchors === 0, 'no nested <a>');
      failures += ok(r.svgsWithoutAriaHidden === 0, 'all hero SVGs aria-hidden');
    }
  }

  // --- Network loads: no desktop dupe on mobile, correct srcset picks ---
  console.log('\n--- Network: image loads ---');
  for (const [w, dpr, lang, expectBanner, expectDesktop] of [
    [360, 1, 'uk', true, false],
    [390, 2, 'uk', true, false],
    [390, 3, 'uk', true, false],
    [1030, 1, 'uk', true, false],
    [1031, 1, 'uk', false, true],
    [1440, 2, 'uk', false, true],
  ]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 800 }, deviceScaleFactor: dpr });
    const p = await ctx.newPage();
    const got = { banner: [], desktop: [] };
    p.on('response', r => {
      const u = r.url();
      if (u.includes('cl-cargo-mobile-')) got.banner.push(u.substring(u.lastIndexOf('/') + 1));
      else if (u.includes('unsplash') && u.includes('photo-')) got.desktop.push(u.substring(u.lastIndexOf('/') + 1).substring(0, 40));
    });
    await p.goto(PAGES[lang], { waitUntil: 'networkidle' });
    await p.waitForTimeout(500);
    const banOk = expectBanner ? got.banner.length === 1 : got.banner.length === 0;
    const deskOk = expectDesktop ? got.desktop.length >= 1 : got.desktop.length === 0;
    failures += ok(banOk && deskOk, w + 'x' + dpr + ' loads: banner=' + got.banner.length + '[' + got.banner[0] + '] desktop=' + got.desktop.length);
    await ctx.close();
  }

  // --- Keyboard focus visibility ---
  console.log('\n--- Keyboard focus ---');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const p = await ctx.newPage();
    await p.goto(PAGES.uk, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(300);
    // Tab into hero CTA primary
    const result = await p.evaluate(async () => {
      const btn = document.querySelector('.clcargo-hero__cta--primary');
      btn.focus();
      const cs = getComputedStyle(btn);
      const outline = cs.outlineWidth !== '0px' || cs.boxShadow !== 'none';
      return { focused: document.activeElement === btn, outline, outlineWidth: cs.outlineWidth, outlineColor: cs.outlineColor };
    });
    failures += ok(result.focused && result.outline, 'hero primary CTA focusable + visible focus', JSON.stringify(result));
    await ctx.close();
  }

  // --- UA default for first visit ---
  console.log('\n--- Lang default + persistence ---');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'ru-RU' });
    const p = await ctx.newPage();
    await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    const lang = await p.evaluate(() => document.documentElement.getAttribute('lang'));
    failures += ok(lang && lang.startsWith('uk'), 'UA default on first visit (locale=ru-RU)', 'lang=' + lang);
    await ctx.close();
  }

  // --- Required screenshots per spec ---
  console.log('\n--- Spec screenshots ---');
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    await p.goto(PAGES.uk, { waitUntil: 'networkidle' });
    await p.waitForTimeout(400);
    const file = path.join(SHOT_DIR, 'spec-desktop-1440.png');
    await p.screenshot({ path: file });
    console.log('desktop 1440 (hero top): ' + path.relative(process.cwd(), file));
    await ctx.close();
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const p = await ctx.newPage();
    await p.goto(PAGES.uk, { waitUntil: 'networkidle' });
    await p.waitForTimeout(400);
    const heroH = await p.evaluate(() => Math.round(document.querySelector('.clcargo-hero').getBoundingClientRect().height));
    await p.setViewportSize({ width: 390, height: Math.max(844, heroH + 150) });
    await p.waitForTimeout(200);
    const file = path.join(SHOT_DIR, 'spec-mobile-390-full.png');
    await p.screenshot({ path: file, fullPage: false, clip: { x: 0, y: 0, width: 390, height: heroH + 100 } });
    console.log('mobile 390 (full hero): ' + path.relative(process.cwd(), file));
    await ctx.close();
  }

  console.log('\n=== Done — checks: ' + checked + ' viewports, ' + failures + ' failed assertions ===');
  await browser.close();
  process.exit(failures ? 1 : 0);
})().catch(err => { console.error(err); process.exit(2); });
