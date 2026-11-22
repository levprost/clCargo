/* Measure Web Vitals under Lighthouse-mobile-ish conditions.
 *
 * Applies via Chrome DevTools Protocol:
 *   - Mobile viewport (Pixel 5)
 *   - Slow 4G network (1.6 Mbps down, 750 Kbps up, 150 ms RTT) — matches
 *     Lighthouse "mobile" default.
 *   - 4x CPU throttling — matches Lighthouse mobile preset.
 *
 * Captures: FCP, LCP, CLS, TBT (long tasks over 50 ms during load), DCL,
 * load event. Also counts render-blocking requests (resource type stylesheet
 * or script in the document before load, excluding async/defer) and their
 * total transferSize.
 *
 * Usage: node web-vitals.js [url]  (default http://localhost:8881/)
 */
const { chromium, devices } = require('playwright');

const URL = process.argv[2] || 'http://localhost:8881/';
const RUNS = 3;

async function runOnce({ mobile }) {
  const browser = await chromium.launch({ headless: true });
  const ctx = mobile
    ? await browser.newContext({ ...devices['Pixel 5'] })
    : await browser.newContext({ viewport: { width: 1350, height: 940 } });
  const page = await ctx.newPage();
  const client = await ctx.newCDPSession(page);

  // Apply Lighthouse mobile throttle; desktop uses Lighthouse desktop preset.
  await client.send('Network.enable');
  if (mobile) {
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 150,
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
    });
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  } else {
    // Lighthouse desktop: no network throttle, 1x CPU.
    await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  }

  // Track blocking + total transfer.
  const requests = [];
  page.on('response', async (resp) => {
    try {
      const req = resp.request();
      let size = 0;
      try { size = (await resp.body()).length; } catch (_) {}
      requests.push({
        url: req.url(),
        type: req.resourceType(),
        status: resp.status(),
        size,
        timing: resp.timing(),
      });
    } catch (_) {}
  });

  // Inject Web Vitals collector BEFORE the page scripts run.
  await page.addInitScript(() => {
    window.__vitals = { fcp: null, lcp: null, cls: 0, longTasks: [], tbt: 0 };
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          if (e.name === 'first-contentful-paint') window.__vitals.fcp = e.startTime;
        }
      }).observe({ type: 'paint', buffered: true });

      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) window.__vitals.lcp = last.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });

      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          if (!e.hadRecentInput) window.__vitals.cls += e.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });

      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          window.__vitals.longTasks.push({ start: e.startTime, duration: e.duration });
          if (e.duration > 50) window.__vitals.tbt += e.duration - 50;
        }
      }).observe({ type: 'longtask', buffered: true });
    } catch (_) {}
  });

  const t0 = Date.now();
  await page.goto(URL, { waitUntil: 'load', timeout: 60000 });
  // Allow a tick for LCP / late long tasks.
  await page.waitForTimeout(2500);
  const loadMs = Date.now() - t0;

  const vitals = await page.evaluate(() => {
    const e = performance.getEntriesByType('navigation')[0] || {};
    return {
      fcp: Math.round(window.__vitals.fcp || 0),
      lcp: Math.round(window.__vitals.lcp || 0),
      cls: Number((window.__vitals.cls || 0).toFixed(3)),
      tbt: Math.round(window.__vitals.tbt || 0),
      longTasks: window.__vitals.longTasks.length,
      dcl: Math.round(e.domContentLoadedEventEnd || 0),
      load: Math.round(e.loadEventEnd || 0),
      ttfb: Math.round(e.responseStart || 0),
    };
  });

  // Count render-blocking: resources that completed before FCP and were in
  // critical path (stylesheets without media=print, non-deferred scripts in
  // head). This is a crude approximation; Lighthouse is more precise.
  const html = await (await fetch(URL)).text();
  const blockingStyles = (html.match(/<link[^>]+rel=["']stylesheet["'][^>]+>/g) || [])
    .filter(l => !/media=["']print["']/.test(l));
  const blockingScriptsInHead = (() => {
    const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    if (!headMatch) return [];
    const head = headMatch[1];
    return (head.match(/<script[^>]+src=[^>]+>/g) || [])
      .filter(s => !/\s(defer|async|type=["']module["'])\b/i.test(s));
  })();
  const blockingBytes = requests
    .filter(r => {
      if (r.type !== 'stylesheet' && r.type !== 'script') return false;
      // Only count things requested on initial document, roughly:
      return r.status === 200;
    })
    .reduce((s, r) => s + (r.size || 0), 0);

  await browser.close();
  return {
    vitals,
    loadMs,
    blockingStyles: blockingStyles.length,
    blockingScriptsInHead: blockingScriptsInHead.length,
    totalBytes: requests.reduce((s, r) => s + (r.size || 0), 0),
    totalRequests: requests.length,
  };
}

async function averageRuns(name, opts) {
  const results = [];
  for (let i = 0; i < RUNS; i++) {
    const r = await runOnce(opts);
    results.push(r);
    console.log(`  run ${i + 1}: fcp=${r.vitals.fcp}ms  lcp=${r.vitals.lcp}ms  cls=${r.vitals.cls}  tbt=${r.vitals.tbt}ms  load=${r.vitals.load}ms`);
  }
  const avg = (key) => Math.round(
    results.reduce((s, r) => s + (r.vitals[key] || 0), 0) / results.length
  );
  const avgCls = Number((results.reduce((s, r) => s + r.vitals.cls, 0) / results.length).toFixed(3));
  const last = results[results.length - 1];
  console.log(`\n[${name}] averages over ${RUNS} runs:`);
  console.log(`  FCP: ${avg('fcp')} ms`);
  console.log(`  LCP: ${avg('lcp')} ms`);
  console.log(`  CLS: ${avgCls}`);
  console.log(`  TBT: ${avg('tbt')} ms`);
  console.log(`  TTFB: ${avg('ttfb')} ms`);
  console.log(`  DCL:  ${avg('dcl')} ms`);
  console.log(`  load: ${avg('load')} ms`);
  console.log(`  Render-blocking stylesheets in HTML (media != print): ${last.blockingStyles}`);
  console.log(`  Non-defer scripts in <head>: ${last.blockingScriptsInHead}`);
  console.log(`  Total transferred: ${(last.totalBytes / 1024).toFixed(1)} KB across ${last.totalRequests} requests`);
}

(async () => {
  console.log(`URL: ${URL}\n`);
  console.log('=== MOBILE (Slow 4G + 4x CPU, Pixel 5 viewport) ===');
  await averageRuns('MOBILE', { mobile: true });
  console.log('\n=== DESKTOP (no throttle, 1350x940) ===');
  await averageRuns('DESKTOP', { mobile: false });
})().catch(e => { console.error(e); process.exit(1); });
