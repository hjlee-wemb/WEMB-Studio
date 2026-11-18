/* 라이트 평면도 — floor-plan.png(반투명) → floor-plan-lt.png
   예전 mk-light-images.cs 의 '픽셀 종류별 다시 칠하기'는 선 · 판 · 글자를 잘못 갈라 건물 윤곽이 사라지고
   이름판 위로 선이 그어지거나 글자가 번졌다(2026-11-11 사용자 지적). → 다크 화면에서 보이던 그대로의 명암 차이를
   라이트에서 같은 크기로 보이게 한다:
   1) 다크 바탕(가스 화면 평면도 자리의 실측 바탕 #03050d) 위에 합성한 색 C
   2) Lab 에서 밝기만 뒤집는다: 다크 바탕 → 라이트 바탕(#ecf0f4), 흰 글자 → 짙은 남색. 색상 · 채도(a, b)는 지킨다
      → 파란 선은 짙은 파랑 선, 남색 건물판은 옅은 회청 판, 흰 글자는 남색 글자
   3) 라이트 바탕(#ecf0f4) 위에서 그 색이 나오도록 알파를 다시 푼다(옅은 곳은 바탕 결이 비친다)
   실행: node mk-light-floor.js */
'use strict';
const fs = require('fs'), path = require('path'), PNG = require('./png.js');
const DIR = path.join(__dirname, '..');
const im = PNG.decode(fs.readFileSync(path.join(DIR, 'floor-plan.png')));
const W = im.w, H = im.h, d = im.data, out = Buffer.alloc(d.length);

const BD = [3, 5, 13], BL = [236, 240, 244];
const toLin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const toS = (v) => { v = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055; return v * 255; };
const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
const fi = (t) => (t * t * t > 216 / 24389 ? t * t * t : (116 * t - 16) / (24389 / 27));
function lab(r, g, b) {
  const R = toLin(r), G = toLin(g), B = toLin(b);
  const x = (0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047, y = 0.2126 * R + 0.7152 * G + 0.0722 * B, z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883;
  const fx = f(x), fy = f(y), fz = f(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
function rgb(L, A, Bb) {
  const fy = (L + 16) / 116, fx = fy + A / 500, fz = fy - Bb / 200;
  const x = fi(fx) * 0.95047, y = fi(fy), z = fi(fz) * 1.08883;
  return [3.2406 * x - 1.5372 * y - 0.4986 * z, -0.9689 * x + 1.8758 * y + 0.0415 * z, 0.0557 * x - 0.2040 * y + 1.0570 * z].map(toS);
}
const LBD = lab(...BD)[0], LBL = lab(...BL)[0];
const INK = 18;                                  /* 흰 글자(L 100) → L 18 (짙은 남색) */
const K = (LBL - INK) / (100 - LBD);
/* 채도 — Lab 에서 파랑을 뒤집으면 a*(붉은 축) 때문에 보랏빛이 돈다 → a* 를 줄여 회청 · 파랑 쪽으로 */
const CA = 0.2, CB = 0.8;
/* 넓은 명암(다크의 스포트라이트 빛 무리 · 건물 판)은 라이트에서 얼룩이 된다 → 국소 톤 매핑:
   밝기 차이 = 큰 결(반경 RAD 상자 흐림) + 잔결(선 · 글자). 잔결은 그대로, 큰 결만 BASE 배로 */
const RAD = 14, BASE = 0.38;
const N = W * H, Lc = new Float32Array(N), Ac = new Float32Array(N), Bc = new Float32Array(N), Al = new Float32Array(N);
for (let p = 0, i = 0; p < N; p++, i += 4) {
  const a = d[i + 3] / 255; Al[p] = a;
  const C = [0, 1, 2].map((k) => a * d[i + k] + (1 - a) * BD[k]);
  const v = lab(C[0], C[1], C[2]); Lc[p] = v[0] - LBD; Ac[p] = v[1]; Bc[p] = v[2];
}
function boxBlur(src) {
  const tmp = new Float32Array(N), dst = new Float32Array(N), w = 2 * RAD + 1;
  for (let y = 0; y < H; y++) { let s = 0; const o = y * W; for (let x = -RAD; x <= RAD; x++) s += src[o + Math.min(W - 1, Math.max(0, x))]; for (let x = 0; x < W; x++) { tmp[o + x] = s / w; s += src[o + Math.min(W - 1, x + RAD + 1)] - src[o + Math.max(0, x - RAD)]; } }
  for (let x = 0; x < W; x++) { let s = 0; for (let y = -RAD; y <= RAD; y++) s += tmp[Math.min(H - 1, Math.max(0, y)) * W + x]; for (let y = 0; y < H; y++) { dst[y * W + x] = s / w; s += tmp[Math.min(H - 1, y + RAD + 1) * W + x] - tmp[Math.max(0, y - RAD) * W + x]; } }
  return dst;
}
const Lb = boxBlur(boxBlur(Lc));                 /* 상자 두 번 ≈ 가우스 */

for (let p = 0, i = 0; p < N; p++, i += 4) {
  const a = Al[p];
  if (!a) continue;
  const dl = (Lc[p] - Lb[p]) + Lb[p] * BASE;
  const T = rgb(LBL - dl * K, Ac[p] * CA, Bc[p] * CB).map((v) => Math.max(0, Math.min(255, v)));
  /* T 가 라이트 바탕 위에 나오도록: o*X + (1-o)*BL = T. 바탕과 가장 먼 채널이 X 를 0~255 안에 두는 최소 o 를 고른다 */
  let o = 0;
  for (let k = 0; k < 3; k++) {
    const diff = T[k] - BL[k];
    if (diff < 0) o = Math.max(o, -diff / BL[k]); else if (diff > 0) o = Math.max(o, diff / (255 - BL[k]));
  }
  o = Math.min(1, Math.max(o, Math.min(1, a * 1.2)));
  for (let k = 0; k < 3; k++) out[i + k] = Math.round(Math.max(0, Math.min(255, (T[k] - (1 - o) * BL[k]) / (o || 1))));
  out[i + 3] = Math.round(o * 255);
}
fs.writeFileSync(path.join(DIR, 'floor-plan-lt.png'), PNG.encode(W, H, out));
console.log('floor-plan-lt.png', W + 'x' + H, 'K', K.toFixed(3));
