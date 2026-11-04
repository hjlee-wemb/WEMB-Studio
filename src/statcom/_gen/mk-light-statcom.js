/* 라이트 그림 사본 — src/statcom/*.svg → *-lt.svg + light-assets.json
   자동 뒤집기 대신 파일 역할별 색 표로 옮긴다(형상은 한 점도 안 건드린다).
   <mask>/<clipPath> 안의 색은 알파라서 그대로 둔다. 장면 그림 -lt.jpg 는 mk-light-scenes.ps1 이 만든다.
   실행: node mk-light-statcom.js */
'use strict';
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '..');

const ICON = '#5a6c82', BLUE = '#0a6ea8';
const COMMON = {
  /* 왼쪽 메뉴 · 화살표 · 입력칸 아이콘 */
  '#8596ac': ICON, '#7086a0': ICON, '#d5dee9': ICON, '#c2d3e7': '#4f6279',
  /* 헤더 단추 아이콘 */
  '#91d3ff': BLUE, '#77c8ff': BLUE,
  /* 선 */
  '#92a9c4': '#8fa1b3',
  /* 화면 바탕 — 장면 그림 바탕색과 같은 쪽 */
  '#111111': '#eef3f7', '#0e1438': '#e8eef3',
  /* 그림 안의 어두운 칸 */
  '#252525': '#ffffff', '#081528': '#ffffff',
  /* VR 머리띠 */
  '#414147': '#c9d4de', '#212124': '#e6edf3', '#8a8e9c': '#7f8c9b', '#00ffd8': '#00b8a0', '#2db2ff': '#1f95dc', '#279aff': '#1f85dc',
};
/* 선택된 메뉴: 남색 칩 → 옅은 하늘색 칩 + 파란 그림 */
const NAV_ON = { '#05396c': '#e3f0f9', '#f1f1f1': BLUE, '#91d3ff': '#2b9bd8', '#0e60a0': '#9fd0ee' };
/* VR 단추 판 — 무늬까지 그대로 밝은 쪽으로 */
const BTN = { '#474747': '#eef2f6', '#5f5f5f': '#dde4eb', '#5d5d5d': '#dde4eb', '#919191': '#b6c2ce' };
const BTN_ON = { '#2f6f82': '#d7edf5', '#2f6882': '#d7edf5', '#00fffc': '#25b5d6', '#00bbdc': '#1aa3c6' };

function tableFor(f) {
  if (f === 'tooltip-bg.svg') return Object.assign({}, COMMON, { '#7086a0': '#dfe7ee' });
  if (/^icon-nav-.*-\d+\.svg$/.test(f)) return Object.assign({}, COMMON, NAV_ON);
  if (/^button-bg-[23]\.svg$/.test(f)) return BTN_ON;
  if (/^button-bg(-1)?\.svg$/.test(f)) return BTN;
  return COMMON;
}
/* 흰색으로 칠한 것 — 판 위의 선 · 글리프만 짙게 */
const WHITE = { 'icon-action-close.svg': '#4a5d73', 'tick-line.svg': '#8fa1b3' };
function whiteFor(f) { return WHITE[f] || (/^line-group/.test(f) ? '#5f7186' : null); }
/* 재생 손잡이 — 다크에서는 검은 점, 라이트에서는 흰 점 */
const blackFor = (f) => (/^handle/.test(f) ? '#ffffff' : null);

function maskRanges(s) {
  const r = [];
  for (const tag of ['mask', 'clipPath']) {
    const re = new RegExp('<' + tag + '[\\s>][\\s\\S]*?</' + tag + '>', 'g');
    let m; while ((m = re.exec(s))) r.push([m.index, m.index + m[0].length]);
  }
  return r;
}

const map = {};
for (const f of fs.readdirSync(DIR)) {
  if (/-lt\.svg$/.test(f)) { fs.unlinkSync(path.join(DIR, f)); continue; }
  if (!/\.svg$/.test(f)) continue;
  const s = fs.readFileSync(path.join(DIR, f), 'utf8');
  const mr = maskRanges(s), inMask = (i) => mr.some(([a, b]) => i >= a && i < b);
  const t = tableFor(f), w = whiteFor(f);
  let n = 0;
  /* `&#132;` 같은 문자 참조의 숫자를 색으로 착각하지 않는다 */
  let o = s.replace(/(?<!&)#[0-9a-fA-F]{6}\b|(?<!&)#[0-9a-fA-F]{3}\b/g, (hex, i) => {
    if (inMask(i)) return hex;
    const v = t[hex.toLowerCase()];
    if (v) { n++; return v; }
    return hex;
  });
  if (w) o = o.replace(/(fill|stroke|stop-color)="(white|#fff|#ffffff)"/gi, (all, p, _k, i) => (inMask(i) ? all : (n++, p + '="' + w + '"')));
  const bk = blackFor(f);
  if (bk) o = o.replace(/(fill|stroke)="black"/g, (all, p, i) => (inMask(i) ? all : (n++, p + '="' + bk + '"')));
  if (!n) continue;
  const lt = f.replace(/\.svg$/, '-lt.svg');
  fs.writeFileSync(path.join(DIR, lt), o);
  map[f] = lt;
}
/* 장면 그림 — 그림 안에 어두운 바탕이 구워져 있어 사본이 필요하다 */
for (const f of fs.readdirSync(DIR)) {
  const m = /^(.+)-lt\.jpg$/.exec(f);
  if (m) map[m[1] + '.png'] = f;
}
fs.writeFileSync(path.join(__dirname, 'light-assets.json'), JSON.stringify(map, null, 1));
console.log('light variants:', Object.keys(map).length);
