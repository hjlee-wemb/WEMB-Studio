/* Playwright filename — 라이브를 켠 화면 · 반응형 여백 · 콘솔 오류 */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/newbiz/_gen/';
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text().slice(0, 160)); });
  page.on('pageerror', (e) => errs.push('PAGEERR ' + e.message.slice(0, 200)));
  const out = {};
  for (const [pg, w, h] of [['wind', 1920, 1080], ['wind', 1248, 852], ['solar-input', 2400, 1000], ['measure-popup', 1248, 852], ['overseas', 1248, 852], ['overseas', 1920, 1080]]) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('http://localhost:5543/src/newbiz/' + pg + '.html?t=dark&r=' + Date.now());
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1700);
    await page.screenshot({ path: GEN + 'live-' + pg + '-' + w + '.png' });
    out[pg + '-' + w] = await page.evaluate(() => {
      const r = document.querySelector('#lsroot'), f = r.querySelector(':scope > [data-node-id]').getBoundingClientRect(), R = r.getBoundingClientRect();
      const t = (document.querySelector('[data-name="Time"]') || {}).textContent;
      const box = (n) => { const e = document.querySelector('[data-name="' + n + '"]'); if (!e) return null; const b = e.getBoundingClientRect(); return [b.x, b.y, b.right, b.bottom].map((v) => Math.round(v)); };
      return { gaps: [f.x - R.x, f.y - R.y, R.right - f.right, R.bottom - f.bottom].map((v) => +v.toFixed(1)), time: t, map: box('Widget/Project Map'), status: box('Widget/Project Status'), rows: box('Rows') };
    });
  }
  return { out, errs: [...new Set(errs)].slice(0, 12) };
}
