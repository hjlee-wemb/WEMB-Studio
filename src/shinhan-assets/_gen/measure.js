/* 등록물 크기(w · h)와 GROUP 자리(ox · oy)를 **브라우저에서 재는 코드**를 뽑아 준다.
   1) node src/shinhan/_gen/serve.js 5521
   2) node src/shinhan-assets/_gen/measure.js
      → 화면마다 'URL + 붙일 코드' 가 나온다. 창 크기 1920x1080 에서 그 URL 을 열고 코드를 콘솔에 붙인다.
   3) 나온 객체들을 합쳐 sizes.json 에 저장하고 mk-assets.js 를 다시 돌린다.

   GROUP(display:contents)은 상자가 없어 자식들 상자의 합집합으로 잰다. 그 자리는 가장 가까운 '상자 있는'
   조상(= 화면 프레임)에서 잰 값이어야 한다 — 다른 조상이면 frame 에 그 이름을 적어 알린다. */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'mk-assets.js'), 'utf8');
const PAGE = { shm: 'overview', sha: 'register', shi: 'entry', shd: 'anomaly' };
const want = {};
src.replace(/px: '(\w+)', nid: '([^']+)'/g, (m, px, nid) => { (want[px] = want[px] || []).push(nid); });

const FN = function (px, ids) {
  /* 화면 프레임(Screen/…) 기준 — 등록창 미리보기는 종합현황 위에 창을 겹친 것이라 창 뿌리가 아니라 화면으로 잰다 */
  const scr = document.querySelector('[data-name^="Screen/"]') || document.querySelector('[data-node-id]');
  const R = scr.getBoundingClientRect();
  const k = R.width / 1920;
  const out = {};
  ids.forEach((id) => {
    const el = document.querySelector('[data-node-id="' + id + '"]');
    if (!el) { out[px + '|' + id] = { missing: true }; return; }
    const group = getComputedStyle(el).display === 'contents';
    let r = el.getBoundingClientRect();
    if (group) {
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      el.querySelectorAll('*').forEach((c) => {
        if (getComputedStyle(c).display === 'contents') return;
        const q = c.getBoundingClientRect();
        if (!q.width || !q.height) return;
        x0 = Math.min(x0, q.left); y0 = Math.min(y0, q.top); x1 = Math.max(x1, q.right); y1 = Math.max(y1, q.bottom);
      });
      r = { left: x0, top: y0, width: x1 - x0, height: y1 - y0 };
    }
    const o = { w: Math.round(r.width / k), h: Math.round(r.height / k) };
    if (group) {
      let p = el.parentElement;
      while (p && getComputedStyle(p).display === 'contents') p = p.parentElement;
      const P = p.getBoundingClientRect();
      o.group = true;
      o.ox = Math.round((r.left - P.left) / k);
      o.oy = Math.round((r.top - P.top) / k);
      if (p !== scr) o.frame = p.dataset.name || p.className;
    }
    out[px + '|' + id] = o;
  });
  return out;
};

Object.keys(want).forEach((px) => {
  console.log('/* ' + px + ' — http://localhost:5521/src/shinhan/' + PAGE[px] + '.html?live=0&t=dark */');
  console.log('(' + FN.toString() + ')(' + JSON.stringify(px) + ',' + JSON.stringify(want[px]) + ')\n');
});
