/* 브라우저는 그림(<img> · <svg>)을 정수 픽셀에 맞춰 그린다 — Figma 는 소수 좌표 그대로 그려서 그림 가장자리 · 차트 선이 0.5px 씩 어긋났다.
   재서(mk-snap) 생긴 차이만큼 transform 으로 되돌린다. 글자는 Figma 처럼 흑백 안티에일리어싱으로(LCD 색 번짐 때문에 글자가 굵어 보였다).
   실행: node patch-snap.js */
'use strict';
const fs = require('fs'), path = require('path');
const p = path.join(__dirname, 'conv.js');
let s = fs.readFileSync(p, 'utf8');
if (s.includes('snap-')) { console.log('이미 고침'); process.exit(0); }
const rep = (a, b) => { if (!s.includes(a)) throw new Error('못 찾음: ' + a.slice(0, 90)); s = s.split(a).join(b); };
rep(`  '.' + PX + '-root img{display:block;border:0;max-width:none;}',`,
  `  '.' + PX + '-root img{display:block;border:0;max-width:none;}',
  /* 화면 틀을 별도 층으로 — Figma 렌더처럼 글자가 흑백 안티에일리어싱으로 그려진다 */
  '.' + PX + '-root > [data-name^="Screen/"]{will-change:transform;}',`);
rep(`  const CSS0 = BASE_CSS(PX) + '\\n' + r.rules.join('\\n');`,
  `  /* 그림 소수 좌표 보정(mk-snap) */
  const snapFile = path.join(GEN, 'snap-' + r.S.key + '.json');
  const SNAP = fs.existsSync(snapFile) ? JSON.parse(fs.readFileSync(snapFile, 'utf8')) : {};
  const SNAP_RULES = Object.keys(SNAP).map(function (u) { return '.' + PX + '-root .' + u + '{transform:' + SNAP[u] + ';transform-origin:0 0;}'; });
  const CSS0 = BASE_CSS(PX) + '\\n' + r.rules.concat(SNAP_RULES).join('\\n');`);
fs.writeFileSync(p, s);
console.log('conv.js 고침');
