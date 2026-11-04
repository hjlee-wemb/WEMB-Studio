/* sizes.json 을 잰다 — Playwright filename. 미리보기(라이브 없이)에서 노드 상자를 재고, GROUP 은 보이는 자식의 합집합(그림자 여백 포함).
   먼저 mk-assets.js 를 한 번 돌려 nodes.json 을 만들고, 검증 서버(node src/plant/_gen/serve.js 5541)를 켠다. */
async (page) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5541/src/plant/overview.html?live=0&t=dark&r=' + Date.now());
  await page.waitForTimeout(1200);
  return await page.evaluate(async () => {
    const ids = await (await fetch('/src/plant-assets/_gen/nodes.json?' + Date.now())).json();
    const res = {};
    ids.forEach((nid) => {
      const el = document.querySelector('[data-node-id="' + nid + '"]');
      if (!el) return;
      if (getComputedStyle(el).display !== 'contents') {
        const r = el.getBoundingClientRect();
        /* 절대 배치 노드는 화면 좌표 · % inset 이라 화면 판 없이 자르면 빈 칸이 된다(전기실 지도) → GROUP 처럼 판째 당긴다 */
        if (getComputedStyle(el).position === 'absolute') { res[nid] = { w: Math.ceil(r.width), h: Math.ceil(r.height), group: true, ox: Math.floor(r.left), oy: Math.floor(r.top) }; return; }
        res[nid] = { w: +r.width.toFixed(2), h: +r.height.toFixed(2) };
        return;
      }
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      el.querySelectorAll('*').forEach((c) => {
        if (getComputedStyle(c).display === 'contents' || c.ownerSVGElement) return;
        const b = c.getBoundingClientRect();
        const r = { left: b.left, top: b.top, right: b.right, bottom: b.bottom };
        /* 잘려서 안 보이는 몫은 빼고 잰다 — 전기실 지도는 원본 그림이 칸보다 크다 */
        for (let a = c.parentElement; a && a !== el; a = a.parentElement) {
          if (getComputedStyle(a).display === 'contents' || getComputedStyle(a).overflow === 'visible') continue;
          const q = a.getBoundingClientRect();
          r.left = Math.max(r.left, q.left); r.top = Math.max(r.top, q.top); r.right = Math.min(r.right, q.right); r.bottom = Math.min(r.bottom, q.bottom);
        }
        if (r.right <= r.left || r.bottom <= r.top) return;
        x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom);
      });
      res[nid] = { w: Math.ceil(x1 - x0), h: Math.ceil(y1 - y0), group: true, ox: Math.floor(x0), oy: Math.floor(y0) };
    });
    await fetch('/__save?f=sizes-assets.json', { method: 'POST', body: JSON.stringify(res, null, 1) });
    return Object.keys(res).length;
  });
}
