/* Playwright filename — 라이트 15화면 캡처 + 글자 대비 점검(audit.js) */
async (page) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/statcom/_gen/';
  const P = [['login', '1-426'], ['main', '1-313'], ['statcom', '1-187'], ['power', '1-271'], ['valve', '1-194'], ['cooling', '1-278'], ['supply', '1-286'], ['safety', '1-293'], ['simulation', '1-300'], ['alarm', '1-307'], ['cards', '1-457'], ['vr-topic', '1-4858'], ['vr-overview', '1-4943'], ['vr-step', '1-4916'], ['vr-menu', '1-4877']];
  const out = {};
  for (const [pg, key] of P) {
    await page.goto('http://localhost:5542/src/statcom/' + pg + '.html?live=0&t=light&r=' + Date.now());
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);
    const shot = (await page.screenshot({ path: GEN + 'light-' + key + '.png' })).toString('base64');
    await page.addScriptTag({ url: '/src/statcom/_gen/audit.js' });
    const r = await page.evaluate((s) => window.__shAudit(s), shot);
    const fails = (r.text || []);
    out[pg] = { n: fails.length, sample: fails.slice(0, 8).map((x) => typeof x === 'string' ? x.slice(0, 90) : JSON.stringify(x).slice(0, 110)) };
  }
  return out;
}
