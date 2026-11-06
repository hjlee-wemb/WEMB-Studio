/* Playwright filename — 11화면을 라이브 없이 찍는다(dom-<key>.png) → node diff-all.js */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/wnms/_gen/';
  const P = [["main","1-1602"],["main-open","1-1977"],["main-expanded","1-2352"],["room-top","1-3690"],["room-view","1-3708"],["equipment","1-3797"],["detail","1-3943"],["login","1-2727"]];
  const out = {};
  for (const [pg, key] of P) {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:5544/src/wnms/' + pg + '.html?live=0&t=light&r=' + Date.now());
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);
    await page.screenshot({ path: GEN + 'dom-' + key + '.png' });
    out[pg] = await page.evaluate(() => { const bad = []; document.querySelectorAll('img').forEach((i) => { if (!i.naturalWidth) bad.push(i.getAttribute('src')); }); return bad.length; });
  }
  return out;
}
