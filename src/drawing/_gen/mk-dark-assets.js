/* 다크용 SVG 사본 — 어두운 무채색 선 · 글자(로고 글자 · 서비스 이름 · 회색 아이콘)는 밝게, 유리판 그림의 흰 면은 그래파이트로.
   파랑 · 빨강 같은 색은 그대로. <이름>-dk.svg 를 만들고 dark-assets.json 에 적는다. 실행: node mk-dark-assets.js */
'use strict';
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '..');
function rgb(c) {
  c = c.trim().toLowerCase();
  if (c === 'white') return [255, 255, 255]; if (c === 'black') return [0, 0, 0];
  let m = /^#([0-9a-f]{3,8})$/.exec(c); if (!m) return null;
  let h = m[1]; if (h.length <= 4) h = h.split('').map((x) => x + x).join('');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
const hex = (a) => '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
function hs(a) { const mx = Math.max(...a) / 255, mn = Math.min(...a) / 255, l = (mx + mn) / 2, d = mx - mn; return { l, s: d ? d / (1 - Math.abs(2 * l - 1)) : 0 }; }
function mapColor(c, glass, divider) {
  const a = rgb(c); if (!a) return c;
  const { l, s } = hs(a);
  /* 구분선 — 밝은 선이 그대로 남으면 다크에서 튄다. 진한 선(헤더 세로선)은 조금 더 보이게 */
  if (divider && s < 0.6) return l < 0.5 ? '#6a6f7a' : '#343842';
  if (glass && l > 0.8) return '#1b1d23';
  if (s > 0.32) return c;                     /* 색 있는 것은 그대로 */
  if (l < 0.62) { const L = Math.min(0.93, 0.95 - l * 0.45); const v = L * 255; return hex([v - 2, v, v + 4]); }
  return c;
}
/* 사진 위에 얹는 조작 막대 · 상태 아이콘은 테마와 상관없이 원본 그대로(검은 막대 + 흰 아이콘) — 뒤집으면 막대가 밝아져 아이콘이 묻힌다 */
const KEEP_ORIGINAL = /^(control-icons|status-icons)/;
/* 칸이 있는 아이콘 — 일반 규칙은 밝은 칸을 그대로 두고, 파랑은 어두운 면에서 가라앉는다. 색 정하기는 hue-rotate 라 이 사본에도 그대로 닿는다 */
const OVERRIDE = {
  'icon-12.svg': (s) => s.replace('fill="#EEEFF6"', 'fill="#262a32"').replace(/fill="#adafb3"/g, 'fill="#c3c7d0"'),
  'icon-1-8.svg': (s) => s.replace('fill="#3967FD" fill-opacity="0.1"', 'fill="#3967FD" fill-opacity="0.26"').replace(/fill="#3967FD"(?! fill-opacity)/g, 'fill="#a3b9ff"'),
};
const map = {}; let n = 0;
for (const f of fs.readdirSync(DIR)) {
  if (!/\.svg$/.test(f) || /-dk\.svg$/.test(f)) continue;
  if (KEEP_ORIGINAL.test(f)) { fs.rmSync(path.join(DIR, f.replace(/\.svg$/, '-dk.svg')), { force: true }); continue; }
  const src = fs.readFileSync(path.join(DIR, f), 'utf8');
  const glass = /^background-1/.test(f);
  const divider = /^divider/.test(f);
  const out = src.replace(/\b(fill|stroke|stop-color|flood-color)="([^"]+)"/g, (m, k, v) => k + '="' + (/^(none|url)/.test(v) ? v : mapColor(v, glass, divider)) + '"');
  /* 유리판의 흰 안쪽 빛(feColorMatrix)도 그래파이트로 — 안 바꾸면 다크에서 판 전체가 뿌옇게 밝다 */
  let out2 = glass ? out.replace(/values="0 0 0 0 ([\d.]+) 0 0 0 0 ([\d.]+) 0 0 0 0 ([\d.]+) 0 0 0 ([\d.]+) 0"/g, (m, r, g, b, a) => (+r > 0.6 ? 'values="0 0 0 0 0.11 0 0 0 0 0.12 0 0 0 0 0.14 0 0 0 ' + (+a * 0.55).toFixed(3) + ' 0"' : m)) : out;
  if (OVERRIDE[f]) out2 = OVERRIDE[f](out2);
  if (out2 === src) continue;
  const dk = f.replace(/\.svg$/, '-dk.svg');
  fs.writeFileSync(path.join(DIR, dk), out2);
  map[f] = dk; n++;
}
/* 사진 — mk-dark-photos.js 가 만든 밤 사본 */
for (const [a, b] of [['background.png', 'background-dk.jpg'], ['background-2.png', 'background-2-dk.jpg'], ['icon-image.png', 'icon-image-dk.jpg'], ['icon-image-1.png', 'icon-image-1-dk.jpg']]) if (fs.existsSync(path.join(DIR, b))) map[a] = b;
fs.writeFileSync(path.join(__dirname, 'dark-assets.json'), JSON.stringify(map));
console.log('다크 SVG', n, '· 표', Object.keys(map).length);
