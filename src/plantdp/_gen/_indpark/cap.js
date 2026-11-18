/* Playwright — 9화면을 라이브 없이 찍는다(dom-<key>.png · 라이트면 light-<key>.png) → node diff-all.js */
async (page) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/indpark/_gen/';
  const P = [['main', '2208-2033'], ['menu', '2208-2117'], ['site', '2208-2220'], ['forklift', '2208-2306'], ['vibration', '2208-2393'], ['heat', '2208-2792'], ['event', '2208-3187'], ['history', '2208-3552'], ['sensor', '2208-3926']];
  const T = globalThis.__IP_THEME || 'dark';
  const out = {};
  for (const [pg, key] of P) {
    await page.goto('http://localhost:5560/src/indpark/' + pg + '.html?live=0&t=' + T + '&r=' + Date.now());
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    await page.screenshot({ path: GEN + (T === 'dark' ? 'dom-' : 'light-') + key + '.png' });
    out[pg] = await page.evaluate(() => { const bad = []; document.querySelectorAll('img').forEach((i) => { if (!i.naturalWidth) bad.push(i.getAttribute('src')); }); return bad; });
  }
  return out;
}
