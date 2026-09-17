/* 두 이미지가 어디서 다른지 **그림으로** 본다 — 다른 픽셀만 빨갛게 찍은 마스크를 낸다.
   히트맵 숫자는 '얼마나' 는 알려 줘도 '어디가' 는 안 알려 준다(글자 안티에일리어싱인지,
   자리가 밀린 것인지 눈으로 봐야 갈린다).

   실행: node src/posco/_gen/diff-mask.js <a.png> <b.png> <out.png> [tol] */
'use strict';
const fs = require('fs');
const PNG = require('./png.js');

const [, , fa, fb, out, tolArg] = process.argv;
if (!fa || !fb || !out) { console.error('사용법: node diff-mask.js a.png b.png out.png [tol]'); process.exit(1); }
const TOL = +(tolArg || 24);
const A = PNG.decode(fs.readFileSync(fa));
const B = PNG.decode(fs.readFileSync(fb));
const w = Math.min(A.w, B.w), h = Math.min(A.h, B.h);
const data = Buffer.alloc(w * h * 4);
let bad = 0;
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const ia = (y * A.w + x) * 4, ib = (y * B.w + x) * 4, io = (y * w + x) * 4;
    const d = Math.abs(A.data[ia] - B.data[ib]) + Math.abs(A.data[ia + 1] - B.data[ib + 1]) + Math.abs(A.data[ia + 2] - B.data[ib + 2]);
    if (d > TOL) { data[io] = 255; data[io + 1] = 0; data[io + 2] = 0; data[io + 3] = 255; bad++; }
    else {                                    /* 같은 곳은 원본을 어둡게 깔아 둔다(위치를 알아보게) */
      data[io] = A.data[ia] >> 2; data[io + 1] = A.data[ia + 1] >> 2; data[io + 2] = A.data[ia + 2] >> 2; data[io + 3] = 255;
    }
  }
}
fs.writeFileSync(out, PNG.encode(w, h, data));
console.log('wrote', out, '· 다른 픽셀', (bad * 100 / (w * h)).toFixed(2) + '%');
