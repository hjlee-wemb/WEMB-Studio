/* 글자마다 Figma 와 DOM 을 ±3px 로 맞대어 어긋남을 재고, 글자 크기 · trim 별 중앙값으로 묶는다.
   기존 text-fit.json 에 더해 넣는다(반복 실행 가능). 실행: node text-fit.js [--write] */
'use strict';
const fs = require('fs'), path = require('path'), PNG = require('./png.js');
const R = JSON.parse(fs.readFileSync(path.join(__dirname, 'text-rects.json'), 'utf8'));
const buf = (I) => I.d || I.data || I.px;
const lum = (I, x, y) => { const i = (y * I.w + x) * 4, D = buf(I); return (D[i] * 2 + D[i + 1] * 5 + D[i + 2]) / 8; };
const group = {};
for (const k of Object.keys(R)) {
  const A = PNG.decode(fs.readFileSync(path.join(__dirname, 'figma-' + k + '.png'))), B = PNG.decode(fs.readFileSync(path.join(__dirname, 'dom-' + k + '.png')));
  for (const t of R[k]) {
    const x0 = Math.max(4, Math.floor(t.x)), x1 = Math.min(A.w - 5, Math.ceil(t.x + t.w)), y0 = Math.max(4, Math.floor(t.y)), y1 = Math.min(A.h - 5, Math.ceil(t.y + t.h));
    if (x1 - x0 < 5 || y1 - y0 < 5) continue;
    let best = null;
    for (let dy = -3; dy <= 3; dy++) for (let dx = -2; dx <= 2; dx++) {
      let s = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) s += Math.abs(lum(A, x + dx, y + dy) - lum(B, x, y));
      if (!best || s < best.s) best = { s, dx, dy };
    }
    const key = t.fs + (t.cls === 'trim-both' ? 't' : '');
    (group[key] = group[key] || []).push(best);
  }
}
const med = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };
const prev = fs.existsSync(path.join(__dirname, 'text-fit.json')) ? JSON.parse(fs.readFileSync(path.join(__dirname, 'text-fit.json'), 'utf8')) : {};
const out = Object.assign({}, prev);
Object.keys(group).sort((a, b) => parseFloat(a) - parseFloat(b)).forEach((k) => {
  const g = group[k], dy = med(g.map((v) => v.dy)), dx = med(g.map((v) => v.dx));
  const hist = {}; g.forEach((v) => { hist[v.dy] = (hist[v.dy] || 0) + 1; });
  console.log(k.padEnd(8), 'n', String(g.length).padStart(4), 'dy', dy, 'dx', dx, JSON.stringify(hist));
  const p = prev[k] || [0, 0];
  out[k] = [p[0], p[1] + dy];
});
if (process.argv.includes('--write')) { fs.writeFileSync(path.join(__dirname, 'text-fit.json'), JSON.stringify(out)); console.log('written', JSON.stringify(out)); }
