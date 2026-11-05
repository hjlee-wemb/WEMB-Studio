/* 라이트 전용 그림 — 형상은 원본 파일 그대로, 색만 역할대로 옮긴 사본을 만든다(손으로 그리지 않는다).
   ① korea-map-lt.svg : Regions 벡터 143개 경로 그대로. 노이즈 필터를 걷고 옅은 하늘색 면 · 흰 경계 · 바깥 해안선으로
   ② turbine-image-lt.png : 풍향·풍속계. 원본 음영 그대로, 흰 컵이 흰 판에 묻히지 않게 밝은 쪽만 누른다
   ③ *-lt.svg : 네온색을 밝은 판에서 읽히는 색으로(light-assets.json → conv.js 가 content:url 로 바꿔 끼운다)
   실행: node mk-light-newbiz.js → node conv.js */
'use strict';
const fs = require('fs'), path = require('path'), PNG = require('./png.js');
const ART = path.join(__dirname, '..');

/* ── ① 지도 ── */
{
  const src = fs.readdirSync(ART).find((f) => /^regions(-\d+)?\.svg$/.test(f));
  const raw = fs.readFileSync(path.join(ART, src), 'utf8');
  const vb = /viewBox="([^"]+)"/.exec(raw)[1];
  const ds = [...raw.matchAll(/<path\b[^>]*?\sd="([^"]+)"/g)].map((m) => m[1]);
  const bbox = (d) => {
    const n = (d.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (let i = 0; i + 1 < n.length; i += 2) { x0 = Math.min(x0, n[i]); x1 = Math.max(x1, n[i]); y0 = Math.min(y0, n[i + 1]); y1 = Math.max(y1, n[i + 1]); }
    return { w: x1 - x0, h: y1 - y0, area: (x1 - x0) * (y1 - y0) };
  };
  /* 큰 땅(시 · 도)만 면을 번갈아 — 옆 칸과 또렷이 갈린다. 작은 섬은 해안선과 같은 계열로 조금 짙게 */
  const TONES = ['url(#a)', 'url(#b)', 'url(#c)', 'url(#d)', 'url(#e)'];
  let big = 0;
  const fills = ds.map((d) => { const b = bbox(d); return b.area > 1500 ? TONES[big++ % TONES.length] : 'url(#s)'; });
  const paths = ds.map((d) => '<path d="' + d + '"/>').join('');
  const grad = (id, c0, c1) => '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c0 + '"/><stop offset="1" stop-color="' + c1 + '"/></linearGradient>';
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="' + vb + '"><defs>'
    + grad('a', '#c6e5f9', '#9dd0f0') + grad('b', '#b6ddf6', '#8cc6ec') + grad('c', '#d0ebfb', '#a9d7f3') + grad('d', '#bbe2f5', '#8fcbe8') + grad('e', '#c1e2f8', '#98cdf0') + grad('s', '#8fcaee', '#6db3e2')
    + '</defs>'
    /* 바깥 해안선 — 같은 경로를 두꺼운 선으로 먼저 깐다 */
    + '<g fill="none" stroke="#5da6d6" stroke-width="2.6" stroke-linejoin="round">' + paths + '</g>'
    /* 면 + 흰 경계 */
    + '<g stroke="#ffffff" stroke-width="1" stroke-linejoin="round">' + ds.map((d, i) => '<path d="' + d + '" fill="' + fills[i] + '"/>').join('') + '</g>'
    + '</svg>';
  fs.writeFileSync(path.join(ART, 'korea-map-lt.svg'), svg);
  console.log('korea-map-lt.svg', Math.round(svg.length / 1024) + 'KB', '경로', ds.length, '큰 땅', big);
}

/* ── ② 풍향·풍속계 ──
   윗부분(컵 · 기둥) = 흰색. 형태가 남도록 음영은 아주 옅게만(사용자 지시 2026-11-05).
   받침(금속) = 어두운 쪽을 끌어올린 밝은 은청색. 경계는 원본에서 잰 줄(BASE_Y), 40px 에 걸쳐 잇는다 */
const VAR = {};
for (const f of ['turbine-image.png']) {
  const I = PNG.decode(fs.readFileSync(path.join(ART, f))), D = I.data;
  const TINT = [0.9, 0.965, 1.03];
  const BASE_Y = 3010, FEATHER = 40;
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
  for (let y = 0; y < I.h; y++) {
    const w = Math.max(0, Math.min(1, (y - BASE_Y + FEATHER / 2) / FEATHER));   /* 0 = 윗부분, 1 = 받침 */
    for (let x = 0; x < I.w; x++) {
      const i = (y * I.w + x) * 4;
      if (!D[i + 3]) continue;
      const L = (D[i] * 0.3 + D[i + 1] * 0.59 + D[i + 2] * 0.11) / 255;
      const t = Math.max(0, Math.min(1, (L - 0.55) / 0.35));
      const up = 0.8 + 0.2 * Math.pow(t, 0.9);
      const line = Math.max(0, Math.min(1, (STROKE - dist[y * W + x]) / 6));
      for (let k = 0; k < 3; k++) {
        const v = D[i + k] / 255;
        const lo = (0.56 + 0.44 * Math.pow(v, 1.1)) * TINT[k];
        const top = up * (1 - line) + STROKE_C[k] * line;
        D[i + k] = Math.min(255, Math.round(255 * (top * (1 - w) + lo * w)));
      }
    }
  }
  const lt = f.replace('.png', '-lt.png');
  fs.writeFileSync(path.join(ART, lt), PNG.encode(I.w, I.h, D));
  VAR[f] = lt;
}

/* ── ③ 벡터 색 ── */
const FAM = [
  [/^outline/, { '#00ff9c': '#12b47e', '#ffb742': '#e49a2c', '#57daff': '#2ba3dc' }],
  [/^leader/, { '#00e7ff': '#18a6cf', '#ff7055': '#d9583c', '#ffce55': '#d8961f', '#55e4ff': '#2ba3dc' }],
  [/^arrow/, { '#57daff': '#2ba3dc', '#ffb742': '#e49a2c', '#00ffdd': '#12b89c', 'white': '#8ea4b6' }],
  [/^marker/, { 'white': '#8ea4b6', '#7fd3fa': '#2f9fd8', '#77839d': '#9fb2c2', '#09d0f5': '#14a8cf', '#00e7ff': '#14a8cf' }],
  [/^type/, { 'white': '#6fa6cc' }],
  [/^track/, { 'white': '#7fb6da' }],
  [/^divider/, { '#242a39': '#d7e2ec', '#394b61': '#c3d2df', 'white': '#c3d2df' }],
  [/^(icon|edit)/, { 'white': '#6fa6cc', '#7fd3fa': '#37a9e2', '#627b8e': '#78a4c4' }],
  [/^(cell)/, { '#074359': '#3f7fa3' }],
  [/^(dot)/, { '#58aec3': '#3f8fb3' }],
];
let n = 0, skipped = 0;
for (const f of fs.readdirSync(ART)) {
  if (!/\.svg$/.test(f) || /-lt\.svg$/.test(f)) continue;
  const fam = FAM.find(([re]) => re.test(f));
  if (!fam) continue;
  const p = path.join(ART, f);
  if (fs.statSync(p).size > 250 * 1024) { skipped++; continue; }   /* 지도 윤곽 같은 큰 파일은 라이트에서 안 쓴다 */
  let s = fs.readFileSync(p, 'utf8'), hit = false;
  s = s.replace(/(fill|stroke|stop-color|flood-color)="(#[0-9a-fA-F]{3,8}|white)"/g, (all, a, c) => {
    const to = fam[1][c.toLowerCase()];
    if (!to) return all;
    hit = true;
    return a + '="' + to + '"';
  });
  if (!hit) continue;
  const lt = f.replace(/\.svg$/, '-lt.svg');
  fs.writeFileSync(path.join(ART, lt), s);
  VAR[f] = lt;
  n++;
}
fs.writeFileSync(path.join(__dirname, 'light-assets.json'), JSON.stringify(VAR, null, 0));
console.log('사본', n, '건너뜀', skipped, '표', Object.keys(VAR).length);
