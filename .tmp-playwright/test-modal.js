const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:8881';
const URLS = { uk: BASE + '/', ru: BASE + '/ru/home/' };

const OUT_DIR = path.resolve(__dirname, 'shots');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function pass(ok, msg, extra) {
  const label = ok ? 'ok  ' : 'FAIL';
  console.log(`[${label}] ${msg}${extra ? ' ' + extra : ''}`);
  return ok ? 0 : 1;
}

async function runLang(page, lang, url, width = 390) {
  let failures = 0;
  console.log(`\n=== ${lang.toUpperCase()} @ ${width}px ===`);
  await page.setViewportSize({ width, height: 800 });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(250);

  // Initial: modal present but not open
  const initial = await page.evaluate(() => {
    const m = document.getElementById('clcargo-contact-modal');
    return m ? { exists: true, open: m.open, hasOpen: m.hasAttribute('open') } : { exists: false };
  });
  failures += pass(initial.exists, 'modal element present');
  failures += pass(initial.exists && !initial.open && !initial.hasOpen, 'modal is closed initially');

  // Find a trigger (header contact button, visible at this width)
  const trigger = await page.$('[data-clcargo-contact-open]:not([hidden])');
  failures += pass(!!trigger, 'trigger exists');
  if (!trigger) return failures;

  // --- Open via trigger click ---
  await trigger.click();
  await page.waitForTimeout(250);

  const open1 = await page.evaluate(() => {
    const m = document.getElementById('clcargo-contact-modal');
    const bodyLocked = document.body.classList.contains('clcargo-scroll-lock');
    const bodyOverflow = getComputedStyle(document.body).overflow;
    const active = document.activeElement;
    const inside = m.contains(active);
    const titleText = m.querySelector('.clcargo-contact-modal__title').textContent.trim();
    const subText = m.querySelector('.clcargo-contact-modal__subtitle').textContent.trim();
    const closeAria = m.querySelector('.clcargo-contact-modal__close').getAttribute('aria-label');
    const cards = Array.from(m.querySelectorAll('.clcargo-contact-card')).map(card => ({
      name: card.querySelector('.clcargo-contact-card__name').textContent.trim(),
      phoneHref: card.querySelector('.clcargo-contact-card__phone').getAttribute('href'),
      phoneText: card.querySelector('.clcargo-contact-card__phone').textContent.trim(),
      msgs: Array.from(card.querySelectorAll('.clcargo-contact-card__msg')).map(a => ({
        label: a.textContent.trim(),
        href: a.getAttribute('href'),
        target: a.getAttribute('target'),
      })),
    }));
    // Nested <a> check
    const nested = Array.from(m.querySelectorAll('a a'));
    // Messenger icon checks: every msg link should have exactly 1 inline SVG icon
    const msgIcons = Array.from(m.querySelectorAll('.clcargo-contact-card__msg')).map(a => {
      const svg = a.querySelector('svg.clcargo-contact-card__msg-icon');
      const r = svg ? svg.getBoundingClientRect() : null;
      return {
        parentClass: a.getAttribute('class') || '',
        svgCount: a.querySelectorAll('svg').length,
        iconW: r ? Math.round(r.width) : 0,
        iconH: r ? Math.round(r.height) : 0,
        label: a.querySelector('.clcargo-contact-card__msg-label') ? a.querySelector('.clcargo-contact-card__msg-label').textContent.trim() : null,
      };
    });
    // Icon checks (operators)
    const icons = Array.from(m.querySelectorAll('svg.clcargo-contact-card__icon')).map(svg => {
      const r = svg.getBoundingClientRect();
      const cls = svg.getAttribute('class') || '';
      return {
        slug: (cls.match(/clcargo-contact-card__icon--(\S+)/) || [])[1] || null,
        w: Math.round(r.width),
        h: Math.round(r.height),
        hasAriaHidden: svg.getAttribute('aria-hidden') === 'true',
      };
    });
    return { open: m.open, bodyLocked, bodyOverflow, activeTag: active ? active.tagName : null, insideModal: inside, titleText, subText, closeAria, cards, nestedAnchors: nested.length, icons, msgIcons };
  });

  failures += pass(open1.open, 'dialog is open after click');
  failures += pass(open1.bodyLocked, 'body has scroll-lock class');
  failures += pass(open1.bodyOverflow === 'hidden', 'body overflow is hidden', `(got ${open1.bodyOverflow})`);
  failures += pass(open1.insideModal, 'focus moved inside the modal', `(active: ${open1.activeTag})`);
  failures += pass(open1.nestedAnchors === 0, 'no nested <a> anchors', `(found ${open1.nestedAnchors})`);
  failures += pass(open1.cards.length === 3, '3 operator cards', `(got ${open1.cards.length})`);

  // Icons: 3 inline SVGs, correct slugs, 28-32px (not shrunken)
  failures += pass(open1.icons.length === 3, '3 operator SVG icons present', `(got ${open1.icons.length})`);
  const slugs = open1.icons.map(i => i.slug);
  failures += pass(JSON.stringify(slugs) === JSON.stringify(['vodafone', 'lifecell', 'kyivstar']), 'icon order vodafone / lifecell / kyivstar', `(${slugs.join(', ')})`);
  for (const ic of open1.icons) {
    failures += pass(ic.w >= 28 && ic.w <= 32 && ic.h >= 28 && ic.h <= 32, `icon ${ic.slug} within 28-32px`, `(${ic.w}×${ic.h})`);
    failures += pass(ic.hasAriaHidden, `icon ${ic.slug} aria-hidden="true"`);
  }

  // Messenger icons: each of the 9 msg links should have exactly 1 SVG icon at 16x16
  failures += pass(open1.msgIcons.length === 9, '9 messenger links total', `(got ${open1.msgIcons.length})`);
  let msgIconFailures = 0;
  for (const mi of open1.msgIcons) {
    const kind = (mi.parentClass.match(/__msg--(\S+)/) || [])[1] || '?';
    if (mi.svgCount !== 1 || mi.iconW < 14 || mi.iconW > 18) {
      msgIconFailures++;
      pass(false, `messenger ${kind} icon`, `(svgCount=${mi.svgCount}, ${mi.iconW}×${mi.iconH}, label="${mi.label}")`);
    }
  }
  failures += pass(msgIconFailures === 0, 'all 9 messenger icons present at ~16px');

  // Language-specific content checks
  if (lang === 'ru') {
    failures += pass(open1.titleText === 'Связаться с нами', 'RU title', `"${open1.titleText}"`);
    failures += pass(open1.subText === 'Позвоните или напишите в удобный мессенджер.', 'RU subtitle');
    failures += pass(open1.closeAria === 'Закрыть', 'RU close aria-label', `"${open1.closeAria}"`);
    failures += pass(open1.cards[2].name === 'Киевстар', 'RU 3rd card is Киевстар', `"${open1.cards[2].name}"`);
  } else {
    failures += pass(open1.titleText.replace(/’|'/g, "'") === "Зв'язатися з нами", 'UA title', `"${open1.titleText}"`);
    failures += pass(open1.subText === 'Зателефонуйте або напишіть у зручний месенджер.', 'UA subtitle');
    failures += pass(open1.closeAria === 'Закрити', 'UA close aria-label', `"${open1.closeAria}"`);
    failures += pass(open1.cards[2].name === 'Київстар', 'UA 3rd card is Київстар', `"${open1.cards[2].name}"`);
  }

  // Card data assertions (first card: Vodafone)
  failures += pass(open1.cards[0].name === 'Vodafone', 'Vodafone 1st card');
  failures += pass(open1.cards[0].phoneHref === 'tel:+380661718289', 'Vodafone tel link', `(${open1.cards[0].phoneHref})`);
  failures += pass(open1.cards[0].phoneText === '+380 66 171 8289', 'Vodafone phone text', `"${open1.cards[0].phoneText}"`);
  failures += pass(open1.cards[0].msgs.length === 3, 'Vodafone 3 messenger links');
  const viberLink = open1.cards[0].msgs.find(m => m.label === 'Viber');
  failures += pass(viberLink && viberLink.href === 'viber://chat?number=%2B380661718289', 'Viber link preserved', `(${viberLink && viberLink.href})`);
  const waLink = open1.cards[0].msgs.find(m => m.label === 'WhatsApp');
  failures += pass(waLink && waLink.target === '_blank', 'WhatsApp opens in new tab');
  // tel must NOT have target
  const telAnchor = await page.evaluate(() => {
    const a = document.querySelector('.clcargo-contact-card__phone');
    return { target: a.getAttribute('target') };
  });
  failures += pass(telAnchor.target === null, 'tel link has no target attribute');

  // --- Screenshot: open state ---
  const shot1 = path.join(OUT_DIR, `modal-${lang}-${width}-open.png`);
  await page.screenshot({ path: shot1 });
  console.log(`      shot: ${path.relative(process.cwd(), shot1)}`);

  // --- Tab trap: press Tab several times, focus stays inside ---
  const tabCycles = 12;
  for (let i = 0; i < tabCycles; i++) {
    await page.keyboard.press('Tab');
  }
  const afterTabs = await page.evaluate(() => {
    const m = document.getElementById('clcargo-contact-modal');
    return { insideModal: m.contains(document.activeElement), activeTag: document.activeElement.tagName };
  });
  failures += pass(afterTabs.insideModal, `focus stays inside after ${tabCycles} Tabs`, `(active: ${afterTabs.activeTag})`);

  // --- Close via Escape ---
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  const afterEsc = await page.evaluate(() => {
    const m = document.getElementById('clcargo-contact-modal');
    return {
      open: m.open,
      bodyLocked: document.body.classList.contains('clcargo-scroll-lock'),
      focused: document.activeElement && document.activeElement.hasAttribute('data-clcargo-contact-open'),
    };
  });
  failures += pass(!afterEsc.open, 'closes on Escape');
  failures += pass(!afterEsc.bodyLocked, 'body scroll unlocked after Escape');
  failures += pass(afterEsc.focused, 'focus returns to trigger button after Escape');

  // --- Open again, close via backdrop click ---
  await trigger.click();
  await page.waitForTimeout(200);
  // Click at top-left of viewport (outside modal box)
  await page.mouse.click(5, 5);
  await page.waitForTimeout(200);
  const afterBackdrop = await page.evaluate(() => {
    const m = document.getElementById('clcargo-contact-modal');
    return { open: m.open, bodyLocked: document.body.classList.contains('clcargo-scroll-lock') };
  });
  failures += pass(!afterBackdrop.open, 'closes on backdrop click');
  failures += pass(!afterBackdrop.bodyLocked, 'body scroll unlocked after backdrop');

  // --- Open again, click inside modal must NOT close ---
  await trigger.click();
  await page.waitForTimeout(200);
  // Click on the title (inside)
  await page.click('.clcargo-contact-modal__title');
  await page.waitForTimeout(200);
  const afterInsideClick = await page.evaluate(() => document.getElementById('clcargo-contact-modal').open);
  failures += pass(afterInsideClick, 'click inside does NOT close');

  // --- Close via X button ---
  await page.click('.clcargo-contact-modal__close');
  await page.waitForTimeout(200);
  const afterX = await page.evaluate(() => {
    const m = document.getElementById('clcargo-contact-modal');
    return { open: m.open, bodyLocked: document.body.classList.contains('clcargo-scroll-lock') };
  });
  failures += pass(!afterX.open, 'closes on X click');
  failures += pass(!afterX.bodyLocked, 'body scroll unlocked after X');

  // Short viewport screenshot (scrollable body test)
  await page.setViewportSize({ width: 390, height: 400 });
  await trigger.click();
  await page.waitForTimeout(250);
  const scrollable = await page.evaluate(() => {
    const body = document.querySelector('.clcargo-contact-modal__body');
    return { scrollable: body.scrollHeight > body.clientHeight + 1, overflowY: getComputedStyle(body).overflowY };
  });
  failures += pass(scrollable.scrollable, 'modal body is scrollable at short viewport', `(overflow-y: ${scrollable.overflowY})`);
  const shot2 = path.join(OUT_DIR, `modal-${lang}-short-viewport.png`);
  await page.screenshot({ path: shot2 });
  console.log(`      shot: ${path.relative(process.cwd(), shot2)}`);
  await page.keyboard.press('Escape');

  return failures;
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  let totalFail = 0;
  for (const [lang, url] of Object.entries(URLS)) {
    totalFail += await runLang(page, lang, url, 390);
    totalFail += await runLang(page, lang, url, 1280);
  }
  console.log(`\n>>> Total failures: ${totalFail}`);
  await browser.close();
  process.exit(totalFail ? 1 : 0);
})().catch(err => { console.error(err); process.exit(2); });
