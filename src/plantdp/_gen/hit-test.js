/* 눌러야 할 것(.pd-click · .pd-tab 등)이 실제로 눌리는가 — 가운데 점을 다른 판이 덮으면 실패. 실행: node pw.js hit-test.js [W H ...] */
async (page, args) => {
  const SIZES = args.length ? args.map(Number).reduce((a, v, i, s) => (i % 2 ? a : a.concat([[v, s[i + 1]]])), []) : [[1568, 1032], [672, 720], [1920, 1080]];
  const SC = ['main', 'weather', 'seismic', 'event', 'sop-popup', 'building', 'floor', 'sop', 'sop-standby', 'login'];
  const out = {};
  for (const [w, h] of SIZES) {
    for (const sc of SC) {
      await page.setViewportSize({ width: w, height: h });
      await page.goto('http://localhost:5570/src/plantdp/' + sc + '.html?t=light&r=' + Date.now());
      await page.waitForTimeout(1300);
      const bad = await page.evaluate(() => {
        const r = [];
        document.querySelectorAll('.pd-click').forEach((e) => {
          const b = e.getBoundingClientRect();
          if (b.width < 2 || b.height < 2 || b.right < 0 || b.bottom < 0 || b.left > innerWidth || b.top > innerHeight) return;
          if (getComputedStyle(e).visibility === 'hidden') return;
          /* 보이는 그림 기준 — 자식 중 가장 큰 보이는 것의 가운데 */
          const pts = [[b.left + b.width / 2, b.top + b.height / 2]];
          const ok = pts.some(([x, y]) => { const t = document.elementFromPoint(x, y); return t && (t === e || e.contains(t) || t.closest('.pd-click') === e); });
          if (!ok) { const t = document.elementFromPoint(pts[0][0], pts[0][1]); r.push(e.dataset.name + ' ← ' + (t ? (t.closest('[data-name]') || t).dataset.name : 'none')); }
        });
        return [...new Set(r)];
      });
      if (bad.length) out[w + 'x' + h + ' ' + sc] = bad;
    }
  }
  return out;
}
