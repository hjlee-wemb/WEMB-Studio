/* Playwright — 6화면을 라이브 없이 찍는다(dom-<key>.png) → node diff-all.js */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/ccpp/_gen/';
  const P = [['main', '427-674', 1920, 1080], ['library', '427-725', 1920, 1080], ['diagram', '427-959', 1920, 1080], ['detail', '427-1003', 1920, 1080], ['file-open', '427-1364', 1920, 1080]];
  const out = {};
  const A = globalThis.__ARGS || []; const live = A.includes('live'); const th = A.includes('dark') ? 'dark' : 'light';
  for (const [pg, key, w, h] of P) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('http://localhost:5575/src/ccpp/' + pg + '.html?' + (live ? '' : 'live=0&') + 't=' + th + '&r=' + Date.now());
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(live ? 1500 : 300);
    await page.screenshot({ path: GEN + (live ? 'live-' : 'dom-') + (th === 'dark' ? 'dk-' : '') + key + '.png' });
    out[pg] = await page.evaluate(() => { const bad = []; document.querySelectorAll('img').forEach((i) => { if (!i.naturalWidth) bad.push(i.getAttribute('src')); }); return bad; });
  }
  return out;
}
