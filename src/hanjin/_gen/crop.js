/* 두 이미지의 같은 영역을 위아래로 붙여 저장(육안 대조용). 인자: x y w h out [scale] */
const fs = require('fs'), PNG = require('./png.js');
const [, , fa, fb, X, Y, W, H, out, sc] = process.argv;
const A = PNG.decode(fs.readFileSync(fa)), B = PNG.decode(fs.readFileSync(fb));
const x = +X, y = +Y, w = +W, h = +H, s = +(sc || 1);
const ow = w * s, oh = h * s * 2 + 4;
const o = Buffer.alloc(ow * oh * 4, 0);
const put = (img, dy) => {
  for (let j = 0; j < h * s; j++) for (let i = 0; i < ow; i++) {
    const sx = x + ((i / s) | 0), sy = y + ((j / s) | 0);
    if (sx >= img.w || sy >= img.h) continue;
    const si = (sy * img.w + sx) * 4, di = ((j + dy) * ow + i) * 4;
    o[di] = img.data[si]; o[di + 1] = img.data[si + 1]; o[di + 2] = img.data[si + 2]; o[di + 3] = 255;
  }
};
put(A, 0);
for (let i = 0; i < ow; i++) for (let j = 0; j < 4; j++) { const di = ((h * s + j) * ow + i) * 4; o[di] = 255; o[di + 1] = 80; o[di + 2] = 0; o[di + 3] = 255; }
put(B, h * s + 4);
fs.writeFileSync(out, PNG.encode(ow, oh, o));
console.log('wrote', out, ow + 'x' + oh, '(위: ' + fa + ' / 아래: ' + fb + ')');
