/* Playwright filename — VR 4장을 원래 프레임 크기로 찍는다(dom-<key>.png). 라이브 없이. */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/statcom/_gen/';
  const P = [['vr-topic', '1-4858', 755], ['vr-menu', '1-4877', 752], ['vr-step', '1-4916', 752], ['vr-overview', '1-4943', 750]];
  const out = {};
  for (const [pg, key, w] of P) {
    await page.setViewportSize({ width: w, height: 788 });
    await page.goto('http://localhost:5542/src/statcom/' + pg + '.html?live=0&t=dark&r=' + Date.now());
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);
    await page.screenshot({ path: GEN + 'dom-' + key + '.png' });
    out[pg] = await page.evaluate(() => { const bad = []; document.querySelectorAll('img').forEach((i) => { if (!i.naturalWidth) bad.push(i.getAttribute('src')); }); return bad.length; });
  }
  await page.setViewportSize({ width: 1920, height: 1080 });
  return out;
}
