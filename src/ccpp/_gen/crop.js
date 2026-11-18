/* 두 PNG 의 같은 영역을 잘라 나란히 붙인다(확대 비교용). 실행: node crop.js a.png b.png x y w h out.png [scale] */
'use strict';
const fs = require('fs'), PNG = require('./png.js');
const [, , fa, fb, xs, ys, ws, hs, out, sc] = process.argv;
const A = PNG.decode(fs.readFileSync(fa)), B = PNG.decode(fs.readFileSync(fb));
const x0 = +xs, y0 = +ys, w = +ws, h = +hs, S = +(sc || 2);
const W = (w * 2 + 8) * S, H = h * S;
const o = Buffer.alloc(W * H * 4, 255);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const side = x < w * S ? 0 : x >= (w + 8) * S ? 1 : -1;
  if (side < 0) continue;
  const I = side ? B : A, sx = x0 + Math.floor((side ? x - (w + 8) * S : x) / S), sy = y0 + Math.floor(y / S);
  const i = (sy * I.w + sx) * 4, j = (y * W + x) * 4;
  o[j] = I.data[i]; o[j + 1] = I.data[i + 1]; o[j + 2] = I.data[i + 2]; o[j + 3] = 255;
}
fs.writeFileSync(out, PNG.encode(W, H, o));
console.log('wrote', out, W + 'x' + H);
