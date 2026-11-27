/* 두 그림의 같은 상자에서 밝은 글자 픽셀(ink)의 위·아래·왼·오 끝을 잰다 — node ink.js x y w h [임계 200] */
'use strict';
const fs = require('fs'), PNG = require('./png.js');
const [x0, y0, w, h, th] = process.argv.slice(2).map(Number);
const T = th || 200;
for (const f of process.argv.slice(7).length ? process.argv.slice(7) : ['figma-event.png', 'dom-event.png']) {
  const I = PNG.decode(fs.readFileSync(f));
  let t = 1e9, b = -1, l = 1e9, r = -1, sx = 0, sy = 0, n = 0;
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const i = (y * I.w + x) * 4; const v = (I.data[i] + I.data[i + 1] + I.data[i + 2]) / 3;
    if (v >= T) { t = Math.min(t, y); b = Math.max(b, y); l = Math.min(l, x); r = Math.max(r, x); sx += x * v; sy += y * v; n += v; }
  }
  console.log(f.padEnd(22), 'top', t, 'bottom', b, 'left', l, 'right', r, 'cx', (sx / n).toFixed(2), 'cy', (sy / n).toFixed(2));
}
