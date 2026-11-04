/* 글자 굵기 — 브라우저(Windows Chrome)는 어두운 판의 밝은 글자를 Figma 보다 두껍게 그린다.
   같은 CDN 의 Pretendard Variable 을 쓰고 굵기를 60 내려 눈으로 Figma 와 맞춘다(재 본 값: font-test.js, d=40~80 이 가장 가깝다).
   실행: node patch-font.js → node conv.js */
'use strict';
const fs = require('fs'), path = require('path');
const p = path.join(__dirname, 'conv.js');
let s = fs.readFileSync(p, 'utf8');
if (s.includes('WEIGHT_TRIM')) { console.log('이미 고침'); process.exit(0); }
const rep = (a, b) => { if (!s.includes(a)) throw new Error('못 찾음: ' + a.slice(0, 90)); s = s.split(a).join(b); };
rep("  Pretendard: '\"Pretendard\",\"Pretendard Variable\",\"Malgun Gothic\",-apple-system,system-ui,sans-serif',",
  "  Pretendard: '\"Pretendard Variable\",\"Pretendard\",\"Malgun Gothic\",-apple-system,system-ui,sans-serif',");
rep("      set('font-weight', String(WEIGHT[style] || 400));",
  "      /* WEIGHT_TRIM — Pretendard 만 굵기를 내린다(patch-font.js). Tomorrow 는 400 한 벌뿐이다 */\n" +
  "      set('font-weight', String((WEIGHT[style] || 400) - (fam === 'Pretendard' ? 60 : 0)));");
rep("+ 'font-family:\"Pretendard\",\"Pretendard Variable\",\"Malgun Gothic\",-apple-system,system-ui,sans-serif;'",
  "+ 'font-family:\"Pretendard Variable\",\"Pretendard\",\"Malgun Gothic\",-apple-system,system-ui,sans-serif;'");
rep("dist/web/static/pretendard.css", "dist/web/variable/pretendardvariable.min.css");
fs.writeFileSync(p, s);
console.log('conv.js 고침');
