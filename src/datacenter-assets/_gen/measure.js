/* 등록 목록(spec.json)의 노드를 화면에서 찾고 크기를 잰다 — Playwright filename. 검증 서버: node src/datacenter/_gen/serve.js 5600
   · nid 가 있으면 그 노드, q:[레이어명, 순번, 크기?] 면 그 화면에서 그 이름의 n 번째(크기가 주어지면 그 크기만)
   · 이름이 'auto' 인 차트는 차트 안 제목 줄(Th Group) 글자 — 없으면 첫 글자 — 를 그대로 쓴다(지어내지 않는다)
   · 상자가 없는 묶음(display:contents)만 화면 좌표(ox · oy)를 적는다
   결과는 서버가 src/datacenter/_gen/asset-sizes.json 으로 저장한다 → node src/datacenter-assets/_gen/mk-assets.js */
async (page) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5600/src/datacenter-assets/_gen/spec.json?r=' + Date.now());
  const spec = JSON.parse(await page.evaluate(() => document.body.innerText));
  const all = [];
  ['charts', 'panels', 'events', 'symbols'].forEach((cat) => spec[cat].forEach((it, i) => all.push(Object.assign({ cat, i }, it))));
  const scenes = {};
  all.forEach((n) => { (scenes[n.sc] = scenes[n.sc] || []).push(n); });
  const res = {}, lost = [];
  for (const sc of Object.keys(scenes)) {
    await page.goto('http://localhost:5600/src/datacenter/' + sc + '.html?live=0&r=' + Date.now());
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);
    const got = await page.evaluate((arr) => arr.map((n) => {
      let el = null;
      if (n.nid) el = document.querySelector('[data-node-id="' + n.nid + '"]');
      else {
        const [nm, idx, size] = n.q;
        const L = [...document.querySelectorAll('[data-name="' + nm + '"]')].filter((x) => {
          const b = x.getBoundingClientRect();
          if (!b.width || !b.height) return false;
          return !size || Math.round(b.width) + 'x' + Math.round(b.height) === size;
        });
        el = L[idx] || null;
      }
      if (!el) return { key: n.cat + ':' + n.i, miss: true };
      const nid = el.getAttribute('data-node-id');
      let title = '';
      if (n.name === 'auto') {
        const th = el.querySelector('[data-name="Th Group"] p, [data-name="Title"] p');
        title = ((th || el.querySelector('p') || {}).textContent || '').replace(/\s+/g, ' ').trim();
      }
      const cs = getComputedStyle(el);
      if (cs.display !== 'contents') {
        const r = el.getBoundingClientRect();
        return { key: n.cat + ':' + n.i, nid, title, w: +r.width.toFixed(2), h: +r.height.toFixed(2) };
      }
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      el.querySelectorAll('*').forEach((c) => {
        if (getComputedStyle(c).display === 'contents' || c.ownerSVGElement) return;
        const b = c.getBoundingClientRect();
        if (!b.width || !b.height) return;
        x0 = Math.min(x0, b.left); y0 = Math.min(y0, b.top); x1 = Math.max(x1, b.right); y1 = Math.max(y1, b.bottom);
      });
      /* 묶음 조각의 좌표 기준은 화면이 아니라 조각의 위치 기준 상자(offsetParent)다 — 전력계통도 무대(256,64) · 팝업 창 안 묶음은
         화면 좌표로 적으면 잘라 붙일 때 그만큼 어긋났다(평면전력계통도 단추가 귀퉁이만 보임) */
      const first = [...el.querySelectorAll('*')].find((c) => getComputedStyle(c).display !== 'contents' && !c.ownerSVGElement && c.getBoundingClientRect().width);
      const op = first && first.offsetParent;
      const pr = op ? op.getBoundingClientRect() : { left: 0, top: 0 };
      const bx = op ? op.clientLeft : 0, by = op ? op.clientTop : 0;
      return { key: n.cat + ':' + n.i, nid, title, w: Math.ceil(x1 - x0), h: Math.ceil(y1 - y0), group: true, ox: Math.floor(x0 - pr.left - bx), oy: Math.floor(y0 - pr.top - by),
        /* 자식 위치가 부모 대비 %(calc)로 적힌 곳이 있다 — 잘라 붙일 판도 부모 크기여야 같은 자리에 온다 */
        pw: op ? op.clientWidth : 1920, ph: op ? op.clientHeight : 1080 };
    }), scenes[sc]);
    got.forEach((g) => { if (g.miss) lost.push(g.key); else res[g.key] = g; });
  }
  await page.evaluate((o) => fetch('/__save?f=asset-sizes.json', { method: 'POST', body: JSON.stringify(o, null, 1) }), res);
  return { n: Object.keys(res).length, lost, groups: Object.keys(res).filter((k) => res[k].group), auto: Object.values(res).filter((r) => r.title).map((r) => r.title) };
}
