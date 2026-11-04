/* Playwright filename — 11화면을 라이브 없이 1920x1080 으로 찍는다(dom-<key>.png) → node diff-all.js */
async (page) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/statcom/_gen/';
  const P = [['login', '1-426'], ['main', '1-313'], ['statcom', '1-187'], ['power', '1-271'], ['valve', '1-194'], ['cooling', '1-278'], ['supply', '1-286'], ['safety', '1-293'], ['simulation', '1-300'], ['alarm', '1-307'], ['cards', '1-457']];
  const out = {};
  for (const [pg, key] of P) {
    await page.goto('http://localhost:5542/src/statcom/' + pg + '.html?live=0&t=dark&r=' + Date.now());
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);
    await page.screenshot({ path: GEN + 'dom-' + key + '.png' });
    out[pg] = await page.evaluate(() => { const bad = []; document.querySelectorAll('img').forEach((i) => { if (!i.naturalWidth) bad.push(i.getAttribute('src')); }); return bad.length; });
  }
  return out;
}
