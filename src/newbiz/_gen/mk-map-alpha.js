/* Figma 내보내기는 지도 뒤에 화면 바탕색(#06101c)이 구워져 있다 — 카드 무늬가 가려져 네모가 보인다.
   바탕과의 차이로 알파를 만든다. 지도 안쪽은 불투명 그대로, 빛 번짐만 서서히 투명해진다.
   바탕 위에 다시 합성하면 원래 픽셀과 같다. 실행: node mk-map-alpha.js (원본은 *-raw.png 로 _gen 에 둔다) */
'use strict';
const fs = require('fs'), path = require('path'), PNG = require('./png.js');
const BG = [6, 16, 28], T = 40;
for (const f of ['korea-map.png', 'korea-map-lg.png']) {
  const raw = path.join(__dirname, f.replace('.png', '-raw.png')), out = path.join(__dirname, '..', f);
  if (!fs.existsSync(raw)) fs.copyFileSync(out, raw);
  const I = PNG.decode(fs.readFileSync(raw)), D = I.data;
  for (let i = 0; i < D.length; i += 4) {
    const d = Math.max(Math.abs(D[i] - BG[0]), Math.abs(D[i + 1] - BG[1]), Math.abs(D[i + 2] - BG[2]));
    const a = Math.min(1, d / T);
    if (a >= 1) continue;
    if (a <= 0) { D[i + 3] = 0; continue; }
    for (let k = 0; k < 3; k++) D[i + k] = Math.max(0, Math.min(255, Math.round((D[i + k] - (1 - a) * BG[k]) / a)));
    D[i + 3] = Math.round(a * 255);
  }
  fs.writeFileSync(out, PNG.encode(I.w, I.h, D));
  console.log(f, fs.statSync(out).size);
}
