/* 다크 그림 사본 — src/ccpp/*.svg 의 밝은 무채색(흰 판 · 옅은 회색 격자 · 금속 원판)을 그래파이트로, 짙은 회색 아이콘 선을 밝은 회백으로 바꾼 *-dk.svg 를 만들고
   dark-assets.json(원본 → 사본)을 쓴다. conv(dark.js lightExtra)가 다크에서 img 를 content:url 로 갈아 끼운다.
   · 채도 있는 색(브랜드 파랑 · 상태색 · 그라디언트 광원)은 의미라서 그대로 둔다.
   · 색 있는 배지(파란 원 + 흰 화살표처럼 채도 높은 면이 있는 그림)는 흰색을 지킨다 — 흰 글리프가 배지 위에 얹힌 것이라서.
   · 차트 판(graph* · grid*)은 언제나 판 · 격자를 어둡게 한다.
   실행: node mk-dark-svgs.js  → 그 다음 node conv.js */
'use strict';
const fs = require('fs'), path = require('path');
const ART = path.join(__dirname, '..');
const D = require('./dark.js');
const hsl = (o) => { const r = o.r / 255, g = o.g / 255, b = o.b / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 2; return { s: d ? d / (1 - Math.abs(2 * l - 1)) : 0, l }; };
const hex = (v) => '#' + [v, v, v].map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
const tint = (l) => { const base = Math.round(l * 255); return '#' + [base - 3, base - 1, base + 4].map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0')).join(''); };
const COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|\bwhite\b|\bblack\b/g;
const map = {};
let made = 0;
for (const f of fs.readdirSync(ART)) {
  if (!/\.svg$/i.test(f) || /-dk\.svg$/i.test(f)) continue;
  const src = fs.readFileSync(path.join(ART, f), 'utf8');
  const chart = /^(graph|grid)/i.test(f);
  /* 흰색뿐인 작은 아이콘(32px 이하) — 라이트에서도 흰 판 위에선 안 보이니 늘 색 단추(활성 탭 · 배지) 위의 글리프다. 다크에서도 그대로 둔다
     (활성 센서 탭의 broadcast 아이콘이 검게 바뀌어 파란 알약 위에서 사라졌다) */
  const wAttr = /<svg[^>]*\swidth="([\d.]+)"/.exec(src), hAttr = /<svg[^>]*\sheight="([\d.]+)"/.exec(src);
  const cols = [...src.matchAll(/(?:fill|stroke)="(#[0-9a-fA-F]{3,8}|white)"/g)].map((m) => D.parse(m[1])).filter(Boolean);
  if (wAttr && hAttr && +wAttr[1] <= 32 && +hAttr[1] <= 32 && cols.length && cols.every((o) => hsl(o).l >= 0.95)) continue;
  /* 채도 높은 면이 있는가 */
  let badge = false;
  for (const m of src.matchAll(/(?:fill|stop-color)="(#[0-9a-fA-F]{6})"/g)) { const o = D.parse(m[1]); const h = hsl(o); if (h.s > 0.45 && h.l > 0.25 && h.l < 0.8) { badge = true; break; } }
  let changed = false;
  const out = src.replace(/(fill|stroke|stop-color|flood-color)="([^"]+)"/g, (all, attr, val) => {
    if (/^url\(|^none$|^currentColor$/i.test(val)) return all;
    const o = D.parse(val);
    if (!o) return all;
    const h = hsl(o);
    let n = null;
    if (h.s < 0.16 || (h.l > 0.9 && h.s < 0.6)) {
      if (h.l >= 0.78) { if (!badge || chart || attr === 'stop-color') n = tint(0.08 + (1 - h.l) * 0.55); }
      else if (h.l <= 0.42 && !chart) n = hex(255 * Math.min(0.92, 0.94 - h.l * 0.55));
    }
    /* 남회색 글리프(#303A46 · 채도 0.19)도 다크에선 묻힌다 — 짙은 선만 0.22 까지 */
    else if (h.s < 0.22 && h.l <= 0.42 && !chart && !badge) n = hex(255 * Math.min(0.92, 0.94 - h.l * 0.55));
    /* 짙은 남색 글리프(#072549 · 채도 0.82 · 명도 0.16)도 다크에선 묻힌다 — 아주 어두운 색은 채도와 상관없이 밝은 회청으로 */
    else if (h.l <= 0.25 && !chart && !badge) n = '#d3dcea';
    if (!n) return all;
    changed = true;
    return attr + '="' + n + '"';
  });
  if (!changed) continue;
  const dk = f.replace(/\.svg$/i, '-dk.svg');
  fs.writeFileSync(path.join(ART, dk), out);
  map[f] = dk; made++;
}
fs.writeFileSync(path.join(__dirname, 'dark-assets.json'), JSON.stringify(map, null, 1));
console.log('다크 사본', made, '장 →', 'dark-assets.json');
