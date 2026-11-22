const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setViewportSize({ width: 1440, height: 900 });
  await p.goto('http://localhost:8881/', { waitUntil: 'load' });
  await p.waitForSelector('.clcargo-form-section', { timeout: 15000 });
  const client = await p.context().newCDPSession(p);
  await client.send('DOM.enable');
  await client.send('CSS.enable');
  const { root } = await client.send('DOM.getDocument');
  const { nodeId } = await client.send('DOM.querySelector', { nodeId: root.nodeId, selector: '.clcargo-form-section' });
  const { matchedCSSRules } = await client.send('CSS.getMatchedStylesForNode', { nodeId });
  const relevant = matchedCSSRules.filter(r => {
    const t = r.rule.style.cssText || '';
    return /margin-top|padding-top|padding-bottom|margin|padding/.test(t);
  });
  for (const r of relevant) {
    console.log('selector:', r.rule.selectorList.text);
    console.log('  from:', r.rule.origin, r.rule.styleSheetId);
    console.log('  text:', r.rule.style.cssText.trim());
    console.log();
  }
  await b.close();
})();
