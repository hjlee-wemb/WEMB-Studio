/* 성능현황 선 그림 — Figma 메타데이터의 묶음 폭은 552 로 낡았고 안쪽 그림은 판마다 폭이 다르다(540 · 550 · 554 · 555).
   늘 100% 로 펴면 그림이 1~2% 늘어나 꺾이는 자리가 어긋난다 → 그림 원래 폭만큼 보정한다(판이 늘어나면 그만큼 같이 늘어난다).
   실행: node patch-line-width.js */
'use strict';
const fs = require('fs'), path = require('path');
const p = path.join(__dirname, 'conv.js');
let s = fs.readFileSync(p, 'utf8');
if (s.includes('LINE_BASE_W')) { console.log('이미 고침'); process.exit(0); }
const A = "      if (INLINE_SVG.indexOf(f) >= 0 || INLINE_RE.test(f)) {                    /* 통짜 그림 대신 DOM 으로 심는다 */";
if (!s.includes(A)) throw new Error('자리를 못 찾았다');
s = s.split(A).join(A + `
        if (LINE_BASE_W[S.key] && /^line-(today|baseline)/.test(f)) {
          const nat = /<svg[^>]*\\swidth="([\\d.]+)"/.exec(fs.readFileSync(path.join(ART, f), 'utf8'));
          const dW = nat ? +(parseFloat(nat[1]) - LINE_BASE_W[S.key]).toFixed(3) : 0;
          if (Math.abs(dW) > 0.3) rules.push(ROOT + ' .' + uc + '{width:calc(100% + ' + dW + 'px)}');
        }`);
s = s.split('const RING_STROKE = [];').join("const RING_STROKE = [];\nconst LINE_BASE_W = { '15-2': 552 };");
fs.writeFileSync(p, s);
console.log('conv.js 고침');
