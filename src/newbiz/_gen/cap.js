/* Playwright filename — 11화면을 라이브 없이 찍는다(dom-<key>.png) → node diff-all.js */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/newbiz/_gen/';
  const P = [['wind', '1-2634'], ['solar', '1-3482'], ['energy', '1-4335'], ['wind-input', '1-52'], ['solar-input', '1-912'], ['energy-input', '1-1773'], ['measure', '1-6841'], ['measure-wind', '1-5184'], ['measure-solar', '1-6013'], ['measure-popup', '1-7644'], ['overseas', '1-8494']];
  const out = {};
  for (const [pg, key] of P) {
    await page.setViewportSize({ width: key === '1-8494' ? 1920 : 1922, height: 1080 });
    await page.goto('http://localhost:5543/src/newbiz/' + pg + '.html?live=0&t=dark&r=' + Date.now());
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);
    await page.screenshot({ path: GEN + 'dom-' + key + '.png' });
    out[pg] = await page.evaluate(() => { const bad = []; document.querySelectorAll('img').forEach((i) => { if (!i.naturalWidth) bad.push(i.getAttribute('src')); }); return bad.length; });
  }
  return out;
}
