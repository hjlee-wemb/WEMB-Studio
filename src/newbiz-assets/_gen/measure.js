/* sizes.json 을 잰다 — Playwright filename. 미리보기(라이브 없이)에서 화면을 차례로 열어 노드 상자를 잰다.
   먼저 LIST_ONLY=1 node mk-assets.js 로 nodes.json 을 만들고, 검증 서버(node src/newbiz/_gen/serve.js 5543)를 켠다.
   상자가 없는 묶음(display:contents)과 절대 배치 노드는 화면 좌표라 ox · oy 를 적는다. 잘려서 안 보이는 몫은 뺀다.
   결과는 서버가 src/newbiz/_gen/asset-sizes.json 으로 저장한다 → sizes.json 으로 옮긴다. */
async (page) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5543/src/newbiz-assets/_gen/nodes.json?r=' + Date.now());
  const list = JSON.parse(await page.evaluate(() => document.body.innerText));
  const scenes = {};
  list.forEach((n) => { (scenes[n.scene] = scenes[n.scene] || []).push(n); });
  const res = {}, lost = [];
  for (const scene of Object.keys(scenes)) {
    await page.goto('http://localhost:5543/src/newbiz/' + scene + '.html?live=0&t=dark&r=' + Date.now());
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    const got = await page.evaluate((arr) => {
      const out = {};
      arr.forEach((n) => {
        const key = n.px + '|' + n.nid;
        const el = document.querySelector('[data-node-id="' + n.nid + '"]');
        if (!el) { out[key] = null; return; }
        const cs = getComputedStyle(el);
        if (cs.display !== 'contents') {
          const r = el.getBoundingClientRect();
          if (cs.position === 'absolute') { const op = el.offsetParent, pr = op ? op.getBoundingClientRect() : { left: 0, top: 0 }; out[key] = { w: Math.ceil(r.width), h: Math.ceil(r.height), group: true, ox: Math.floor(r.left - pr.left), oy: Math.floor(r.top - pr.top) }; return; }
          out[key] = { w: +r.width.toFixed(2), h: +r.height.toFixed(2) };
          return;
        }
        let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
        el.querySelectorAll('*').forEach((c) => {
          if (getComputedStyle(c).display === 'contents' || c.ownerSVGElement) return;
          const b = c.getBoundingClientRect();
          const r = { left: b.left, top: b.top, right: b.right, bottom: b.bottom };
          for (let a = c.parentElement; a && a !== el; a = a.parentElement) {
            const ac = getComputedStyle(a);
            if (ac.display === 'contents' || ac.overflow === 'visible') continue;
            const q = a.getBoundingClientRect();
            r.left = Math.max(r.left, q.left); r.top = Math.max(r.top, q.top); r.right = Math.min(r.right, q.right); r.bottom = Math.min(r.bottom, q.bottom);
          }
          if (r.right <= r.left || r.bottom <= r.top) return;
          x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom);
        });
        out[key] = { w: Math.ceil(x1 - x0), h: Math.ceil(y1 - y0), group: true, ox: Math.floor(x0), oy: Math.floor(y0) };
      });
      return out;
    }, scenes[scene]);
    Object.keys(got).forEach((k) => { if (got[k]) res[k] = got[k]; else lost.push(k); });
  }
  await page.evaluate((o) => fetch('/__save?f=asset-sizes.json', { method: 'POST', body: JSON.stringify(o, null, 1) }), res);
  return { n: Object.keys(res).length, lost, res };
}
