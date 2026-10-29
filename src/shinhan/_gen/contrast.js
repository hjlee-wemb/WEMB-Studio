/* 글자 대비 실측 — 캡처(png)와 글자 상자 목록(json: [{t,x,y,w,h,c}] · c 는 글자색 rgb)을 받아
   상자 안 픽셀 중 글자색에서 먼 쪽(=바탕)의 중앙값을 바탕색으로 보고 WCAG 대비를 잰다.
   바탕이 그림·그라디언트·반투명이 겹쳐 DOM 만으로는 못 재서 픽셀로 잰다(README '검증 ③').
   실행: node contrast.js <shot.png> <boxes.json> [기준=4.5] */
'use strict';
const fs = require('fs'), PNG = require('./png.js');
const [, , shot, boxesF, minArg] = process.argv;
const MIN = +(minArg || 4.5);
const img = PNG.decode(fs.readFileSync(shot));
const boxes = JSON.parse(fs.readFileSync(boxesF, 'utf8'));
const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const L = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
const bad = [];
for (const bx of boxes) {
  const [cr, cg, cb] = bx.c;
  const Lt = L(cr, cg, cb);
  const px = [];
  for (let y = Math.max(0, Math.floor(bx.y)); y < Math.min(img.h, Math.ceil(bx.y + bx.h)); y++) {
    for (let x = Math.max(0, Math.floor(bx.x)); x < Math.min(img.w, Math.ceil(bx.x + bx.w)); x++) {
      const i = (y * img.w + x) * 4;
      const d = Math.abs(img.data[i] - cr) + Math.abs(img.data[i + 1] - cg) + Math.abs(img.data[i + 2] - cb);
      px.push([d, L(img.data[i], img.data[i + 1], img.data[i + 2])]);
    }
  }
  if (px.length < 4) continue;
  px.sort((a, b) => b[0] - a[0]);
  const far = px.slice(0, Math.max(1, Math.floor(px.length * 0.5)));   /* 글자색에서 먼 절반 = 바탕 */
  far.sort((a, b) => a[1] - b[1]);
  const Lb = far[Math.floor(far.length / 2)][1];
  const r = ratio(Lt, Lb);
  if (r < MIN) bad.push({ t: bx.t, r: +r.toFixed(2), x: Math.round(bx.x), y: Math.round(bx.y) });
}
bad.sort((a, b) => a.r - b.r);
console.log(shot.split(/[\\/]/).pop(), '글자', boxes.length, '·', MIN + ':1 미만', bad.length);
bad.slice(0, 40).forEach((b) => console.log('  ', b.r, JSON.stringify(b.t), '@' + b.x + ',' + b.y));
