/* 12 · 13px 글자는 Windows Chrome 에서 더 두껍게 나온다(재 본 값: d=120 에서야 Figma 에 가깝다) → 작은 글자만 40 더 내린다.
   실행: node patch-font2.js → node conv.js */
'use strict';
const fs = require('fs'), path = require('path');
const p = path.join(__dirname, 'conv.js');
let s = fs.readFileSync(p, 'utf8');
if (s.includes('SMALL_TRIM')) { console.log('이미 고침'); process.exit(0); }
const a = "    const fsOwn = decls.find((x) => x[0] === 'font-size');";
if (!s.includes(a)) throw new Error('자리 못 찾음');
s = s.replace(a, () => a + "\n" +
  "    /* SMALL_TRIM — patch-font2.js */\n" +
  "    if (fsOwn) {\n" +
  "      const pxm = /(\\d+(?:\\.\\d+)?)px/.exec(String(fsOwn[1]));\n" +
  "      const wi = decls.findIndex((x) => x[0] === 'font-weight');\n" +
  "      const fam = decls.find((x) => x[0] === 'font-family');\n" +
  "      if (pxm && +pxm[1] <= 13 && wi >= 0 && fam && /Pretendard Variable/.test(fam[1]) && !/Tomorrow/.test(fam[1])) decls[wi][1] = String(+decls[wi][1] - 40);\n" +
  "    }");
fs.writeFileSync(p, s);
console.log('conv.js 고침');
