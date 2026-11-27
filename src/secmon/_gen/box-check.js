/* 상자 대조 — 재구축 DOM(라이브 끔, 1920) 의 노드 자리를 Figma 메타(meta-<key>.xml, 부모 '프레임' 기준 x,y)와 맞춰 본다.
   그룹(group)은 좌표계를 만들지 않으므로 가장 가까운 프레임 조상 기준으로 잰다. 회전 노드는 90° · 180° 후보 자리도 본다.
   실행: node pw.js box-check.js [page…]  → 어긋난 노드(2px 넘게) 목록 */
async (page, args) => {
  const fs = require('fs');
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/secmon/_gen/';
  const P = { main: '4041-8351', channel: '4039-2211', micro: '4039-3717', mq: '4039-5908', infra: '4039-10484', event: '4038-2699' };
  await page.setViewportSize({ width: 1920, height: 1080 });
  const out = {};
  for (const pg of (args.length ? args : Object.keys(P))) {
    const xml = fs.readFileSync(GEN + 'meta-' + P[pg] + '.xml', 'utf8');
    const meta = {};
    for (const m of xml.matchAll(/<(\w+) id="([^"]+)" name="([^"]*)" x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/g)) meta[m[2]] = { t: m[1], n: m[3], x: +m[4], y: +m[5], w: +m[6], h: +m[7] };
    await page.goto('http://localhost:5620/src/secmon/' + pg + '.html?live=0&r=' + Date.now());
    await page.waitForTimeout(700);
    out[pg] = await page.evaluate((meta) => {
      const bad = [];
      const isFrame = (id) => meta[id] && meta[id].t !== 'group';
      document.querySelectorAll('[data-node-id]').forEach((e) => {
        const id = e.getAttribute('data-node-id'), M = meta[id];
        if (!M || M.t === 'group' || M.t === 'text') return;
        const cs = getComputedStyle(e);
        if (cs.display === 'contents' || cs.display === 'none') return;
        let a = e.parentElement;
        while (a && !(a.getAttribute('data-node-id') && isFrame(a.getAttribute('data-node-id')))) a = a.parentElement;
        if (!a) return;
        /* 회전 래퍼(flex + rotate 자식)는 래퍼 상자가 실제 자리 */
        const r = e.getBoundingClientRect(), pr = a.getBoundingClientRect();
        const rx = r.left - pr.left, ry = r.top - pr.top;
        const C = [[M.x, M.y], [M.x, M.y - M.w], [M.x - M.h, M.y], [M.x - M.w, M.y - M.h]];
        const ok = C.some((c) => Math.abs(c[0] - rx) <= 0.6 && Math.abs(c[1] - ry) <= 0.6);
        if (!ok) {
          /* 부모가 그룹(contents) 인지 */
          let gp = e.parentElement, inG = '';
          while (gp && gp !== a) { if (getComputedStyle(gp).display === 'contents') { inG = gp.getAttribute('data-name') || ''; break; } gp = gp.parentElement; }
          bad.push([M.n, id, 'dom ' + Math.round(rx) + ',' + Math.round(ry), 'fig ' + M.x + ',' + M.y, inG ? 'in ' + inG : '']);
        }
      });
      return bad;
    }, meta);
  }
  return out;
}
