/* 라이트가 다크와 '모양'이 같은지 — 화면마다 보이는 요소의 상자 · border-radius · display · 숨김(opacity 0) 을 다크/라이트로 재서 다른 것만 센다.
   색 · 그림자 색은 비교하지 않는다(라이트는 색만 바꿔야 한다). node pw.js shape-diff.js */
async (page) => {
  const P = ['main', 'overview2', 'transactions', 'was', 'waspopup', 'tp', 'system', 'system2', 'detail', 'network', 'event'];
  const out = {};
  const snap = (t, pg) => page.goto('http://localhost:5590/src/oneview/' + pg + '.html?live=0&t=' + t + '&r=' + Date.now())
    .then(() => page.waitForLoadState('networkidle').catch(() => {}))
    .then(() => page.evaluate(() => [...document.querySelectorAll('.ov-root *')].map((e) => {
      const cs = getComputedStyle(e), r = e.getBoundingClientRect();
      return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height), cs.borderTopLeftRadius, cs.display, +cs.opacity === 0 ? 0 : 1, cs.visibility].join('|');
    })));
  for (const pg of P) {
    const d = await snap('dark', pg), l = await snap('light', pg);
    const diff = [];
    for (let i = 0; i < Math.max(d.length, l.length); i++) if (d[i] !== l[i]) diff.push(i + ': ' + d[i] + ' → ' + l[i]);
    out[pg] = { n: d.length === l.length ? diff.length : 'count ' + d.length + '/' + l.length, ex: diff.slice(0, 3) };
  }
  return out;
}
