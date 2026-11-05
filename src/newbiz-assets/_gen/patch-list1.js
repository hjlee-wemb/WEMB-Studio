/* 썸네일 고침 — ① 절대 배치 노드의 ox · oy 는 화면이 아니라 자기 기준 상자 안 자리(표 안 호버 단추) ② 메뉴 바 · 헤더는 통째로 ③ 어두운 선택 탭 아이콘은 뺀다. 한 번만. */
'use strict';
const fs = require('fs');
const rep = (s, a, b) => { if (!s.includes(a)) throw new Error('없음 ' + a); return s.replace(a, b); };
let m = fs.readFileSync('measure.js', 'utf8');
m = rep(m, "if (cs.position === 'absolute') { out[key] = { w: Math.ceil(r.width), h: Math.ceil(r.height), group: true, ox: Math.floor(r.left), oy: Math.floor(r.top) }; return; }",
  "if (cs.position === 'absolute') { const op = el.offsetParent, pr = op ? op.getBoundingClientRect() : { left: 0, top: 0 }; out[key] = { w: Math.ceil(r.width), h: Math.ceil(r.height), group: true, ox: Math.floor(r.left - pr.left), oy: Math.floor(r.top - pr.top) }; return; }");
fs.writeFileSync('measure.js', m);
let a = fs.readFileSync('mk-assets.js', 'utf8');
a = rep(a, "name: '메뉴 바 (신사업)', fig: 'Nav Bar' }", "name: '메뉴 바 (신사업)', fig: 'Nav Bar', fit: 1 }");
a = rep(a, "name: '헤더 (신사업)', fig: 'Header' }", "name: '헤더 (신사업)', fig: 'Header', fit: 1 }");
a = rep(a, "if (cat === 'symbols') a.fit = 1;", "if (cat === 'symbols' || it.fit) a.fit = 1;");
a = rep(a, "  ['type-wind-status-select.svg', '풍향 탭 아이콘 (선택)', 'Icon Type=Wind, Status=Select'],\n", '');
fs.writeFileSync('mk-assets.js', a);
console.log('ok');
