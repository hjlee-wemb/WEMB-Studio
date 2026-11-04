/* Playwright filename — 라이브 켠 미리보기: 오류 · 1920x1080 정지 첫 화면 대조 · 반응형 여백 */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/woori/_gen/';
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'warning' || m.type() === 'error') { const t = m.text(); if (!/favicon|ERR_/.test(t)) errs.push(m.type() + ': ' + t.slice(0, 200)); } });
  const out = {};
  for (const pg of ['transaction', 'performance', 'event']) {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:5531/src/woori/' + pg + '.html?t=dark&r=' + Date.now());
    await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    await page.goto('http://localhost:5531/src/woori/' + pg + '.html?t=dark&r=' + Date.now());
    await page.waitForTimeout(1600);
    await page.screenshot({ path: GEN + 'live-' + pg + '.png' });
    const vp = [];
    for (const [w, h] of [[1248, 852], [2400, 1000]]) {
      await page.setViewportSize({ width: w, height: h });
      await page.waitForTimeout(900);
      await page.screenshot({ path: GEN + 'resp-' + pg + '-' + w + '.png' });
      vp.push(await page.evaluate(() => {
        const root = document.querySelector('.wr-root'), fr = root.querySelector(':scope > [data-name^="Screen/"]');
        const bg = fr.querySelector(':scope > [data-name="Background"]');
        const r = root.getBoundingClientRect(), b = bg.getBoundingClientRect();
        return { s: root.__wr.S.toFixed(3), exW: Math.round(root.__wr.exW), exH: Math.round(root.__wr.exH), gaps: [b.left - r.left, b.top - r.top, r.right - b.right, r.bottom - b.bottom].map((x) => +x.toFixed(1)) };
      }));
    }
    out[pg] = vp;
  }
  return { errs: errs.slice(0, 12), out };
}
