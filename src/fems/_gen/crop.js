/* node crop.js <in.png> <out.png> x y w h [배율] — 캡처 확대 자르기 */
const P = require('./png.js'), fs = require('fs');
const [i, o, x0, y0, w, h, s0] = process.argv.slice(2); const s = +(s0 || 2);
const im = P.decode(fs.readFileSync(i)); const W = w * s, H = h * s, d = Buffer.alloc(W * H * 4);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const si = ((+y0 + Math.floor(y / s)) * im.w + (+x0) + Math.floor(x / s)) * 4; im.data.copy(d, (y * W + x) * 4, si, si + 4); }
fs.writeFileSync(o, P.encode(W, H, d));
