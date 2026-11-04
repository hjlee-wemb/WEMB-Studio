/* Playwright filename — 라이브 켠 미리보기: 오류 · 첫 화면 캡처 · 반응형 여백 */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/statcom/_gen/';
  const errs = [];
  const onErr = (e) => errs.push(String(e).slice(0, 200));
  const onCon = (m) => { if (m.type() === 'warning' || m.type() === 'error') { const t = m.text(); if (!/favicon|ERR_|Fetch API/.test(t)) errs.push(m.type() + ': ' + t.slice(0, 200)); } };
  page.on('pageerror', onErr); page.on('console', onCon);
  const out = {};
  const P = [['login', '1-426'], ['main', '1-313'], ['statcom', '1-187'], ['power', '1-271'], ['valve', '1-194'], ['cooling', '1-278'], ['supply', '1-286'], ['safety', '1-293'], ['simulation', '1-300'], ['alarm', '1-307'], ['cards', '1-457']];
  for (const [pg, key] of P) {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:5542/src/statcom/' + pg + '.html?t=dark&r=' + Date.now());
    await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    await page.goto('http://localhost:5542/src/statcom/' + pg + '.html?t=dark&r=' + Date.now());
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1250);
    await page.screenshot({ path: GEN + 'live-' + key + '.png' });
    const res = {};
    for (const [w, h] of [[1248, 852], [2400, 1000]]) {
      await page.setViewportSize({ width: w, height: h });
      await page.waitForTimeout(300);
      res[w] = await page.evaluate(() => {
        const root = document.querySelector('.tc-root'), r = root.getBoundingClientRect();
        const f = root.querySelector(':scope > [data-node-id]').getBoundingClientRect();
        return [f.left - r.left, f.top - r.top, r.right - f.right, r.bottom - f.bottom].map((v) => +v.toFixed(1));
      });
    }
    out[pg] = res;
  }
  await page.setViewportSize({ width: 1248, height: 852 });
  await page.goto('http://localhost:5542/src/statcom/valve.html?t=dark&r=' + Date.now());
  await page.waitForTimeout(1200);
  await page.screenshot({ path: GEN + 'resp-valve-1248.png' });
  await page.setViewportSize({ width: 2400, height: 1000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: GEN + 'resp-valve-2400.png' });
  page.off('pageerror', onErr); page.off('console', onCon);
  await page.setViewportSize({ width: 1920, height: 1080 });
  return { errs: errs.slice(0, 20), out };
}
