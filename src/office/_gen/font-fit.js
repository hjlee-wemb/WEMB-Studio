/* text-rects.json(DOM 글자 상자) + figma-*.png / dom-*.png 로 '실제로 그려진 글자 폭' 비율을 재서 글자 묶음별 보정 크기를 구한다.
   묶음 = 글자 크기 · 굵기 · 소속 부품 이름. 넘치거나 잘린 글자는 뺀다. 실행: node font-fit.js [--write] */
'use strict';
const fs = require('fs'), path = require('path'), PNG = require('./png.js');
const R = JSON.parse(fs.readFileSync(path.join(__dirname, 'text-rects.json'), 'utf8'));
const lum = (I, x, y) => { const i = (y * I.w + x) * 4; return (I.data[i] * 2 + I.data[i + 1] * 5 + I.data[i + 2]) / 8; };
function inkWidth(I, x0, x1, y0, y1) {
  const bg = lum(I, x0, y0); let first = -1, last = -1;
  for (let x = x0; x < x1; x++) {
    let hit = false;
    for (let y = y0; y < y1 && !hit; y++) if (Math.abs(lum(I, x, y) - bg) > 40) hit = true;
    if (hit) { if (first < 0) first = x; last = x; }
  }
  return first < 0 ? null : { first, last, w: last - first + 1 };
}
const groups = {};
for (const k of Object.keys(R)) {
  const A = PNG.decode(fs.readFileSync(path.join(__dirname, 'figma-' + k + '.png'))), B = PNG.decode(fs.readFileSync(path.join(__dirname, 'dom-' + k + '.png')));
  for (const t of R[k]) {
    if (t.w < 40 || !t.id || t.x + t.w + 3 >= t.clip) continue;
    const pad = 14;
    const x0 = Math.max(2, Math.floor(t.x) - 8), x1 = Math.min(A.w - 2, Math.ceil(t.x + t.w) + pad);
    const y0 = Math.max(2, Math.floor(t.y) + 1), y1 = Math.min(A.h - 2, Math.ceil(t.y + t.h) - 1);
    if (y1 - y0 < 6) continue;
    const fa = inkWidth(A, x0, x1, y0, y1), fb = inkWidth(B, x0, x1, y0, y1);
    if (!fa || !fb || fb.w < 30) continue;
    /* 글자 오른쪽에 다른 그림이 붙으면 재지 못한다 */
    if (Math.abs(fb.w - t.w) > 6) continue;
    const key = t.fs + '|' + t.ws + '|' + t.n;
    (groups[key] = groups[key] || []).push({ r: fa.w / fb.w, id: t.id, k });
  }
}
const med = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };
const fit = {}; const rows = [];
for (const key of Object.keys(groups)) {
  const g = groups[key]; if (g.length < 4) continue;
  if (med(g.map((v) => v.r)) < 0.85 || med(g.map((v) => v.r)) > 1.15) continue;
  const m = med(g.map((v) => v.r));
  rows.push([key, g.length, m.toFixed(3)]);
  if (Math.abs(m - 1) >= 0.03) { const fs0 = parseFloat(key); g.forEach((v) => { fit[v.id] = +(fs0 * m).toFixed(2); }); rows[rows.length - 1].push('FIT ' + (fs0 * m).toFixed(2)); }
}
rows.sort((a, b) => Math.abs(b[2] - 1) - Math.abs(a[2] - 1));
rows.slice(0, 30).forEach((r) => console.log(r.join('  ')));
console.log('fit nodes', Object.keys(fit).length);
if (process.argv.includes('--write')) { fs.writeFileSync(path.join(__dirname, 'font-fit.json'), JSON.stringify(fit)); console.log('written'); }
