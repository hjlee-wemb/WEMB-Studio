/* sizes.json 을 잰다 — Playwright filename. 미리보기(라이브 없이)에서 화면을 차례로 열어 노드 상자를 잰다.
   먼저 LIST_ONLY=1 node mk-assets.js 로 nodes.json 을 만들고, 검증 서버(node src/statcom/_gen/serve.js 5542)를 켠다.
   상자가 없는 노드(display:contents)는 보이는 자식의 합집합과 화면 안 자리(ox · oy)를 적는다. 결과는 돌려준다. */
async (page) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  const nodes = await page.evaluate(async () => (await fetch('http://localhost:5542/src/statcom-assets/_gen/nodes.json?' + Date.now())).json()).catch(() => null);
  let list = nodes;
  if (!list) {
    await page.goto('http://localhost:5542/src/statcom-assets/_gen/nodes.json');
    list = JSON.parse(await page.evaluate(() => document.body.innerText));
  }
  const scenes = {};
  list.forEach((n) => { (scenes[n.scene] = scenes[n.scene] || []).push(n); });
  const res = {};
  const lost = [];
  for (const scene of Object.keys(scenes)) {
    await page.goto('http://localhost:5542/src/statcom/' + scene + '.html?live=0&t=dark&r=' + Date.now());
    await page.waitForTimeout(700);
    const got = await page.evaluate((arr) => {
      const out = {};
      arr.forEach((n) => {
        const el = document.querySelector('[data-node-id="' + n.nid + '"]');
        if (!el) { out[n.px + '|' + n.nid] = null; return; }
        if (getComputedStyle(el).display !== 'contents') {
          const r = el.getBoundingClientRect();
          out[n.px + '|' + n.nid] = { w: +r.width.toFixed(2), h: +r.height.toFixed(2) };
          return;
        }
        let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
        el.querySelectorAll('*').forEach((c) => {
          if (getComputedStyle(c).display === 'contents' || c.ownerSVGElement) return;
          const b = c.getBoundingClientRect();
          if (!b.width || !b.height) return;
          x0 = Math.min(x0, b.left); y0 = Math.min(y0, b.top); x1 = Math.max(x1, b.right); y1 = Math.max(y1, b.bottom);
        });
        out[n.px + '|' + n.nid] = { w: Math.ceil(x1 - x0), h: Math.ceil(y1 - y0), group: true, ox: Math.floor(x0), oy: Math.floor(y0) };
      });
      return out;
    }, scenes[scene]);
    Object.keys(got).forEach((k) => { if (got[k]) res[k] = got[k]; else lost.push(k); });
  }
  return { res, lost };
}
