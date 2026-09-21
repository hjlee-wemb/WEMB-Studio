/* 다크 ↔ 라이트 글자 대비를 나란히 재서 '라이트에서만 나빠진 글자'를 찾는다.
   원본이 원래 낮은 것(시안 그대로)과 테마를 만들며 묻힌 것을 갈라 보려고.
   실행: node contrast-cmp.js <dark.png> <dark.json> <light.png> <light.json> [기준=4.5] */
'use strict';
const fs = require('fs');
const PNG = require('./png.js');
const [, , da, dj, la, lj, minArg] = process.argv;
const MIN = +(minArg || 4.5);
const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const L = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

function measure(shot, boxes) {
  const img = PNG.decode(fs.readFileSync(shot));
  return JSON.parse(fs.readFileSync(boxes, 'utf8')).map((bx) => {
    const Lt = L(bx.c[0], bx.c[1], bx.c[2]);
    const px = [];
    for (let y = Math.max(0, Math.floor(bx.y)); y < Math.min(img.h, Math.ceil(bx.y + bx.h)); y++) {
      for (let x = Math.max(0, Math.floor(bx.x)); x < Math.min(img.w, Math.ceil(bx.x + bx.w)); x++) {
        const i = (y * img.w + x) * 4;
        px.push([img.data[i], img.data[i + 1], img.data[i + 2]]);
      }
    }
    if (!px.length) return null;
    /* 글자색에서 먼 쪽 절반의 중앙값을 바탕으로 본다 */
    px.sort((p, q) => Math.abs(L(q[0], q[1], q[2]) - Lt) - Math.abs(L(p[0], p[1], p[2]) - Lt));
    const half = px.slice(0, Math.max(1, Math.floor(px.length / 2)));
    const m = half[Math.floor(half.length / 2)];
    return { t: bx.t, x: Math.round(bx.x), y: Math.round(bx.y), pop: bx.pop, r: ratio(Lt, L(m[0], m[1], m[2])) };
  }).filter(Boolean);
}

const D = measure(da, dj), Lg = measure(la, lj);
const key = (b) => b.t + '@' + b.x + ',' + b.y;
const dm = new Map(D.map((b) => [key(b), b.r]));
const rows = Lg.map((b) => ({ b: b, l: b.r, d: dm.has(key(b)) ? dm.get(key(b)) : null }))
  .filter((r) => r.l < MIN)
  .sort((a, b) => a.l - b.l);
console.log('라이트에서 ' + MIN + ':1 미만 ' + rows.length + '개 (글자 ' + Lg.length + ')');
console.log('  라이트  다크   자리  글자');
for (const r of rows) {
  const worse = r.d != null && r.l < r.d - 0.4 ? '  ← 라이트에서 나빠짐' : (r.d != null && r.d < MIN ? '  (다크도 낮음 = 원본)' : '');
  console.log('  ' + r.l.toFixed(2).padStart(5), (r.d == null ? '  -  ' : r.d.toFixed(2).padStart(5)),
    (r.b.pop ? '팝업' : '화면'), ('@' + r.b.x + ',' + r.b.y).padEnd(11), '"' + r.b.t + '"' + worse);
}
