/* Playwright filename — 라이브 켠 화면 캡처(live-<장면>-<폭>.png) + 여백 · 콘솔 오류 점검 */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/drawing/_gen/';
  const errs = [];
  page.on('pageerror', (e) => errs.push('PAGEERR ' + e.message.slice(0, 160)));
  page.on('console', (m) => { if (m.type() === 'error' && !/recent-time/.test(m.text())) errs.push(m.text().slice(0, 160)); });
  const out = {};
  for (const sc of ['main', 'main-open', 'main-expanded', 'room-top', 'room-view', 'equipment', 'detail', 'login']) {
    for (const [w, h] of [[1920, 1080], [2560, 1080], [1248, 852]]) {
      await page.setViewportSize({ width: w, height: h });
      await page.goto('http://localhost:5544/src/drawing/' + sc + '.html?t=light&r=' + Date.now());
      await page.waitForTimeout(1900);
      await page.screenshot({ path: GEN + 'live-' + sc + '-' + w + '.png' });
    }
  }
  return { errs: errs.slice(0, 15) };
}
