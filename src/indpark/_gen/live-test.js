/* 라이브 켠 미리보기를 찍는다 — 판 크기(기본 1568x1032)에서 여백 · 콘솔 오류 · 라이브 차트를 본다. node pw.js live-test.js [w] [h] [page…] */
async (page, args) => {
  const W = +(args[0] || 1568), H = +(args[1] || 1032);
  const pages = args.slice(2).length ? args.slice(2) : ['main', 'menu', 'site', 'forklift', 'vibration', 'heat', 'event', 'history', 'sensor'];
  await page.setViewportSize({ width: W, height: H });
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/indpark/_gen/';
  const out = {};
  for (const pg of pages) {
    const T = process.env.IP_THEME || '';
    await page.goto('http://localhost:5560/src/indpark/' + pg + '.html?' + (T ? 't=' + T + '&' : '') + 'r=' + Date.now());
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => { const b = document.getElementById('tt'); if (b) b.style.display = 'none'; });
    await page.waitForTimeout(2600);
    await page.screenshot({ path: GEN + 'live-' + pg + '-' + W + (process.env.IP_THEME ? '-' + process.env.IP_THEME : '') + '.png' });
    out[pg] = await page.evaluate(() => {
      const r = document.querySelector('[class*="-root"]'), f = r && r.querySelector(':scope > [data-node-id]');
      const fr = f.getBoundingClientRect();
      return { live: !!(r && r.__ip), frame: [Math.round(fr.width), Math.round(fr.height)], lines: document.querySelectorAll('.ip-live-data polyline').length };
    });
  }
  return out;
}
