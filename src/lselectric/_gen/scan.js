/* 두 그림의 한 줄(가로/세로)을 나란히 찍어 본다 — 테두리가 안/밖 어디로 그려졌는지 같은 눈으로 보려고.
   실행: node scan.js <a.png> <b.png> h|v <고정좌표> <시작> <끝> */
'use strict';
const fs = require('fs');
const PNG = require('./png.js');
const [, , fa, fb, dir, fixArg, fromArg, toArg] = process.argv;
const A = PNG.decode(fs.readFileSync(fa)), B = PNG.decode(fs.readFileSync(fb));
const fix = +fixArg, from = +fromArg, to = +toArg;
const px = (img, x, y) => {
  const i = (y * img.w + x) * 4;
  return [img.data[i], img.data[i + 1], img.data[i + 2]];
};
for (let v = from; v <= to; v++) {
  const x = dir === 'h' ? v : fix, y = dir === 'h' ? fix : v;
  const a = px(A, x, y), b = px(B, x, y);
  const same = Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) <= 24;
  console.log(String(v).padStart(5), 'A', a.join(',').padEnd(13), 'B', b.join(',').padEnd(13), same ? '' : '  <-- 다름');
}
