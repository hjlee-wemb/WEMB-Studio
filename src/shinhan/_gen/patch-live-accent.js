/* src/shinhan-live.js 의 호버 · 빛 · 반짝임 색을 테마 변수로 바꾼다 — 한 번만.
   다크는 원본 네온(하늘 104,212,255 · 파랑 104,140,255 · 시안 0,186,255), 라이트는 흰 판에 맞는 차분한 파랑 그림자.
   CSS 배열(라이트 절 앞까지)의 rgba(104,212,255,a) → rgba(var(--sh-acc),a) · rgba(104,140,255,a) → rgba(var(--sh-acc2),a) ·
   rgba(0,186,255,a) → rgba(var(--sh-acc3),a) · #68d4ff → rgb(var(--sh-acc)). 실행: node patch-live-accent.js */
'use strict';
const fs = require('fs'), path = require('path');
const p = path.join(__dirname, '..', '..', 'shinhan-live.js');
let s = fs.readFileSync(p, 'utf8');
if (s.includes('--sh-acc:')) { console.log('이미 있음'); process.exit(0); }
const a = s.indexOf('  var CSS = [');
const b = s.indexOf('/* ══════════ 라이트 테마', a);
if (a < 0 || b < 0) throw new Error('CSS 구간을 못 찾음');
let mid = s.slice(a, b);
const before = mid.length;
let n = 0;
mid = mid.replace(/rgba\(104,212,255,/g, () => { n++; return 'rgba(var(--sh-acc),'; })
  .replace(/rgba\(104,140,255,/g, () => { n++; return 'rgba(var(--sh-acc2),'; })
  .replace(/rgba\(0,186,255,/g, () => { n++; return 'rgba(var(--sh-acc3),'; })
  .replace(/#68d4ff/gi, () => { n++; return 'rgb(var(--sh-acc))'; });
mid = mid.replace("  var CSS = [\n",
  "  var CSS = [\n"
  + "    /* 강조 · 빛 색 — 다크는 원본 네온, 라이트는 흰 판에 맞는 차분한 파랑(아래 라이트 절에서 값만 바꾼다) */\n"
  + "    '.sh-root{--sh-acc:104,212,255;--sh-acc2:104,140,255;--sh-acc3:0,186,255;}',\n");
s = s.slice(0, a) + mid + s.slice(b);
fs.writeFileSync(p, s);
console.log('바꾼 색', n, '곳 ·', before, '→', mid.length);
