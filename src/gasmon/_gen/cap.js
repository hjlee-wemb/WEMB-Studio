/* Playwright filename — 5화면을 라이브 없이 찍는다(dom-<key>.png) → node diff-all.js
   팝업은 얹힌 자리(mount)만 잘라 찍는다(Figma 단독 렌더와 같은 크기). */
async (page) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/gasmon/_gen/';
  const P = [['main', '3059-3083'], ['gas', '3059-3990'], ['worksite', '3059-4943', 'gmw'], ['alarm', '3059-5211', 'gma'], ['confirm', '3050-2030', 'gmc']];
  const T = (typeof process !== 'undefined' && process.env && process.env.GM_THEME) || 'dark';
  const out = {};
  for (const [pg, key, px] of P) {
    await page.goto('http://localhost:5546/src/gasmon/' + pg + '.html?live=0&t=' + T + '&r=' + Date.now());
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    const pre = T === 'dark' ? 'dom-' : 'light-';
    if (px) {
      const b = await page.evaluate((p) => { const r = document.querySelector('.' + p + '-mount').getBoundingClientRect(); return { x: r.x, y: r.y, width: Math.round(r.width), height: Math.round(r.height) }; }, px);
      await page.screenshot({ path: GEN + pre + key + '.png', clip: b });
    } else await page.screenshot({ path: GEN + pre + key + '.png' });
    out[pg] = await page.evaluate(() => { const bad = []; document.querySelectorAll('img').forEach((i) => { if (!i.naturalWidth) bad.push(i.getAttribute('src')); }); return bad; });
  }
  return out;
}
