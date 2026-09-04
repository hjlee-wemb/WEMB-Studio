/* Figma 렌더 ↔ 재구축 DOM 캡처 픽셀 대조 (그리드 히트맵 + 최악 영역 목록) */
const fs = require('fs'), path = require('path'), PNG = require('./png.js');
const [, , fa, fb, colsArg, rowsArg, tolArg] = process.argv;
const A = PNG.decode(fs.readFileSync(fa)), B = PNG.decode(fs.readFileSync(fb));
const COLS = +(colsArg || 16), ROWS = +(rowsArg || 9), TOL = +(tolArg || 24);
const w = Math.min(A.w, B.w), h = Math.min(A.h, B.h);
const cell = new Float64Array(COLS * ROWS), cnt = new Float64Array(COLS * ROWS);
let bad = 0, all = 0, sumd = 0;
for (let y = 0; y < h; y++) {
  const cy = (y * ROWS / h) | 0;
  for (let x = 0; x < w; x++) {
    const ia = (y * A.w + x) * 4, ib = (y * B.w + x) * 4;
    const d = Math.abs(A.data[ia] - B.data[ib]) + Math.abs(A.data[ia + 1] - B.data[ib + 1]) + Math.abs(A.data[ia + 2] - B.data[ib + 2]);
    const c = cy * COLS + ((x * COLS / w) | 0);
    all++; cnt[c]++; sumd += d;
    if (d > TOL) { bad++; cell[c]++; }
  }
}
console.log('size ' + A.w + 'x' + A.h + ' vs ' + B.w + 'x' + B.h + '  diff ' + (bad * 100 / all).toFixed(2) + '%  mean|d| ' + (sumd / all / 3).toFixed(2) + '  (tol ' + TOL + ')');
const worst = [];
for (let r = 0; r < ROWS; r++) {
  let line = '';
  for (let c = 0; c < COLS; c++) {
    const v = cnt[r * COLS + c] ? cell[r * COLS + c] * 100 / cnt[r * COLS + c] : 0;
    line += String(v.toFixed(1)).padStart(6);
    worst.push({ v, r, c, x: Math.round(c * w / COLS), y: Math.round(r * h / ROWS), w: Math.round(w / COLS), h: Math.round(h / ROWS) });
  }
  console.log(line);
}
worst.sort((a, b) => b.v - a.v);
console.log('worst cells:', worst.slice(0, 8).map((o) => o.v.toFixed(1) + '% @' + o.x + ',' + o.y).join('  '));
/* 차이 지도 PNG — 다른 픽셀만 빨갛게 */
if (process.env.MAP) {
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ia = (y * A.w + x) * 4, ib = (y * B.w + x) * 4, o = (y * w + x) * 4;
    const d = Math.abs(A.data[ia] - B.data[ib]) + Math.abs(A.data[ia + 1] - B.data[ib + 1]) + Math.abs(A.data[ia + 2] - B.data[ib + 2]);
    if (d > TOL) { out[o] = 255; out[o + 1] = 0; out[o + 2] = 0; out[o + 3] = 255; }
    else { const g = (A.data[ia] * 0.3 + A.data[ia + 1] * 0.6 + A.data[ia + 2] * 0.1) * 0.35 | 0; out[o] = out[o + 1] = out[o + 2] = g; out[o + 3] = 255; }
  }
  fs.writeFileSync(process.env.MAP, PNG.encode(w, h, out));
  console.log('map →', process.env.MAP);
}
