/* 같은 자리를 Figma · DOM 두 장에서 잘라 위아래로 붙이고 N 배 키운다(눈으로 1px 어긋남을 보려고).
   실행: node pair.js <figma.png> <dom.png> x y w h scale out.png */
'use strict';
const fs = require('fs'), PNG = require('./png.js');
const [fa, fb, xs, ys, ws, hs, ss, out] = process.argv.slice(2);
const A = PNG.decode(fs.readFileSync(fa)), B = PNG.decode(fs.readFileSync(fb));
const x0 = +xs, y0 = +ys, w = +ws, h = +hs, k = +ss || 4;
const W = w * k, H = (h * 2 + 2) * k;
const buf = Buffer.alloc(W * H * 4, 255);
function put(img, oy) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const si = ((y0 + y) * img.w + (x0 + x)) * 4;
    for (let dy = 0; dy < k; dy++) for (let dx = 0; dx < k; dx++) {
      const di = (((oy + y) * k + dy) * W + x * k + dx) * 4;
      img.data.copy(buf, di, si, si + 4);
    }
  }
}
put(A, 0); put(B, h + 2);
fs.writeFileSync(out, PNG.encode(W, H, buf));
console.log('wrote', out, W + 'x' + H);
