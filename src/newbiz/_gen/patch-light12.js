/* 풍향·풍속계(라이트) 윗부분에 옅은 회색 외곽선 — 사용자 지시. 그림 칸에 끝이 닿아 바깥 선은 잘리므로 안쪽 선. 한 번만. */
'use strict';
const fs = require('fs');
const rep = (s, a, b) => { if (!s.includes(a)) throw new Error('없음 ' + a); return s.replace(a, b); };
let m = fs.readFileSync('mk-light-newbiz.js', 'utf8');
m = rep(m, `  const BASE_Y = 3010, FEATHER = 40;\n`, `  const BASE_Y = 3010, FEATHER = 40;
  /* 안쪽 외곽선 — 알파 가장자리까지의 거리(체임퍼 2패스). 그림 39px 표시 기준 1 CSS px = 76 원본 px */
  const STROKE = 48, STROKE_C = [0.66, 0.73, 0.79];
  const W = I.w, H = I.h, dist = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const q = y * W + x;
    if (D[q * 4 + 3] < 128) { dist[q] = 0; continue; }
    let d = Math.min(x + 1, y + 1);
    if (x) d = Math.min(d, dist[q - 1] + 1);
    if (y) { d = Math.min(d, dist[q - W] + 1); if (x) d = Math.min(d, dist[q - W - 1] + 1.414); if (x < W - 1) d = Math.min(d, dist[q - W + 1] + 1.414); }
    dist[q] = d;
  }
  for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) {
    const q = y * W + x;
    if (!dist[q]) continue;
    let d = Math.min(dist[q], W - x, H - y);
    if (x < W - 1) d = Math.min(d, dist[q + 1] + 1);
    if (y < H - 1) { d = Math.min(d, dist[q + W] + 1); if (x < W - 1) d = Math.min(d, dist[q + W + 1] + 1.414); if (x) d = Math.min(d, dist[q + W - 1] + 1.414); }
    dist[q] = d;
  }
`);
m = rep(m, `const up = 0.8 + 0.2 * Math.pow(t, 0.9);`, `const up = 0.8 + 0.2 * Math.pow(t, 0.9);
      const line = Math.max(0, Math.min(1, (STROKE - dist[y * W + x]) / 6));`);
m = rep(m, `D[i + k] = Math.min(255, Math.round(255 * (up * (1 - w) + lo * w)));`, `const top = up * (1 - line) + STROKE_C[k] * line;
        D[i + k] = Math.min(255, Math.round(255 * (top * (1 - w) + lo * w)));`);
fs.writeFileSync('mk-light-newbiz.js', m);
let r = fs.readFileSync('README.md', 'utf8');
r = r.trimEnd() + '\n\n풍향·풍속계 윗부분에 옅은 회색 안쪽 외곽선을 그림에 구웠다(STROKE 48 원본 px ≒ 0.6 CSS px, mk-light-newbiz.js ②). 그림자 아님.\n';
fs.writeFileSync('README.md', r);
console.log('ok');
