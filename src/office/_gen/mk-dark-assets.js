/* 다크용 SVG 사본 — 밝은 무채색 선(차트 격자 · 구분선 · 도면 선)은 그래파이트로 가라앉히고,
   어두운 무채색 아이콘 · 글자(다운로드 · 도크 · 도움말 아이콘)는 밝게 올린다. 흰색 · 색 있는 것(차트 계열 · 상태색)은 그대로.
   <이름>-dk.svg 를 만들고 dark-assets.json 에 적는다(dark.js 가 content:url() 로 갈아 끼운다). 실행: node mk-dark-assets.js
   채도는 HSL 대신 '색 폭(최대-최소)'으로 본다 — 아주 밝은 색(#E6EDFF)은 HSL 채도가 90% 로 나와 색으로 오인된다. */
'use strict';
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '..');
function rgb(c) {
  c = c.trim().toLowerCase();
  if (c === 'white') return [255, 255, 255]; if (c === 'black') return [0, 0, 0];
  const m = /^#([0-9a-f]{3,8})$/.exec(c); if (!m) return null;
  let h = m[1]; if (h.length <= 4) h = h.split('').map((x) => x + x).join('');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
const hex = (a) => '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
function mapColor(c) {
  const a = rgb(c); if (!a) return c;
  const mx = Math.max(...a), mn = Math.min(...a), l = (mx + mn) / 510, chroma = mx - mn;
  if (mn >= 250) return c;                                   /* 흰색은 그대로(파랑 단추 위 흰 아이콘) */
  if (l >= 0.8 && chroma <= 48) { const v = 44 + (1 - l) * 60; return hex([v - 2, v, v + 6]); }   /* 밝은 선 → 그래파이트 선 */
  if (l < 0.55 && chroma <= 40) { const v = (0.95 - l * 0.45) * 255; return hex([v - 2, v, v + 4]); } /* 어두운 아이콘 → 밝게 */
  return c;
}
const map = {}; let n = 0;
for (const f of fs.readdirSync(DIR)) {
  if (!/\.svg$/.test(f) || /-dk\.svg$/.test(f)) continue;
  const src = fs.readFileSync(path.join(DIR, f), 'utf8');
  /* 반투명 흰 막(방 강조 도형의 40% 흰색) — 어두운 바탕에서는 회색 상자로 번쩍인다 → 아주 옅게 */
  const src2 = src.replace(/fill="(white|#fff|#ffffff)" fill-opacity="([\d.]+)"/gi, (m, c, o) => 'fill="white" fill-opacity="' + Math.min(+o, 0.06) + '"');
  const out = src2.replace(/\b(fill|stroke|stop-color|flood-color)="([^"]+)"/g, (m, k, v) => k + '="' + (/^(none|url)/.test(v) ? v : mapColor(v)) + '"');
  const dk = f.replace(/\.svg$/, '-dk.svg');
  if (out === src) { fs.rmSync(path.join(DIR, dk), { force: true }); continue; }
  fs.writeFileSync(path.join(DIR, dk), out);
  map[f] = dk; n++;
}
fs.writeFileSync(path.join(__dirname, 'dark-assets.json'), JSON.stringify(map));
console.log('다크 사본', n);
