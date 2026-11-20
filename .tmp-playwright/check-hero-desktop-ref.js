const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:8881';
const WIDTHS = [1030, 1031, 1280, 1440, 1600];
const OUT = path.resolve(__dirname, 'shots');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  for (const w of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 1000 } });
    const p = await ctx.newPage();
    await p.goto(BASE + '/', { waitUntil: 'networkidle' });
    await p.waitForTimeout(300);

    const info = await p.evaluate(() => {
      const hero = document.querySelector('.clcargo-hero');
      if (!hero) return { error: 'no hero' };
      const pick = sel => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return cs.display === 'none' ? null : {
          sel, top: Math.round(r.top), left: Math.round(r.left), right: Math.round(r.right),
          bottom: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height),
        };
      };
      return {
        heroH: Math.round(hero.getBoundingClientRect().height),
        badge: pick('.clcargo-hero__badge'),
        h1: pick('.clcargo-hero__title'),
        lead: pick('.clcargo-hero__lead'),
        dest: pick('.clcargo-hero__destinations'),
        details: pick('.clcargo-hero__details'),
        ctas: pick('.clcargo-hero__ctas'),
        photo: pick('.clcargo-hero__photo'),
        motto: pick('.clcargo-hero__motto'),
        highlights: pick('.clcargo-hero__highlights'),
        banner: pick('.clcargo-hero__banner'),
        grid: pick('.clcargo-hero__grid'),
      };
    });

    const heroH = info.heroH || 1000;
    await p.setViewportSize({ width: w, height: Math.max(900, heroH + 100) });
    await p.waitForTimeout(200);
    const file = path.join(OUT, `hero-desktop-${w}.png`);
    await p.screenshot({ path: file, clip: { x: 0, y: 0, width: w, height: heroH + 50 } });
    console.log(`\n=== ${w}px → ${path.relative(process.cwd(), file)} (heroH=${heroH}) ===`);
    console.log(JSON.stringify(info, null, 2));

    await ctx.close();
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
