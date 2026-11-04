/* 분자 라이브러리(wemb-atomic)에 공장 전력설비 화면(build_pfo)을 넣는다 — 추출기 화이트리스트 · 라이브 파일 · 프로젝트 이름 · 테스트 페이지 수(44 → 45).
   한 번만 돌린다. 실행: node src/plant-assets/_gen/patch-atomic.js  (그 뒤 wemb-atomic 에서 npm run build → npm test) */
'use strict';
const fs = require('fs'), path = require('path');
const A = path.join(__dirname, '..', '..', '..', 'wemb-atomic');
function edit(rel, marker, fn) {
  const p = path.join(A, rel);
  const s = fs.readFileSync(p, 'utf8');
  if (s.indexOf(marker) >= 0) { console.log('  (이미 있음)', rel); return; }
  fs.writeFileSync(p, fn(s));
  console.log('  patched', rel);
}
const rep = (s, a, b) => { if (s.indexOf(a) < 0) throw new Error('앵커 없음: ' + a.slice(0, 80)); return s.split(a).join(b); };
edit('lib/extract/atomic-catalog.mjs', 'plant-overview', (s) => {
  s = rep(s, '|hanjin-(?:control|gate|unload)', '|hanjin-(?:control|gate|unload)|plant-overview');
  s = rep(s, "shinhan: 'shinhan-live.js' };", "shinhan: 'shinhan-live.js', plant: 'plant-live.js' };");
  return s;
});
edit('lib/library.mjs', "plant: '", (s) => s.replace(/export const FAMILY_LABELS = \{([^}]*)\}/, (m, body) => 'export const FAMILY_LABELS = {' + body.replace(/\s*$/, '') + ", plant: '공장 전력설비' }"));
edit('test/atomic.test.mjs', "'plant'", (s) => {
  s = rep(s, "  assert.equal(catalog.templates.length, 44);", "  /* 2026-11-04 공장 전력설비(Screen/Facility Overview) 한 장 추가 — 44 → 45 */\n  assert.equal(catalog.templates.length, 45);");
  s = rep(s, "['hana', 'hanjin', 'lselectric', 'posco', 'shinhan', 'skhynix']", "['hana', 'hanjin', 'lselectric', 'plant', 'posco', 'shinhan', 'skhynix']");
  s = rep(s, '  assert.equal(Object.keys(L.pages).length, 44);', '  assert.equal(Object.keys(L.pages).length, 45);');
  s = rep(s, '  assert.equal(L.layouts.reduce((s, l) => s + l.pages.length, 0), 44);', '  assert.equal(L.layouts.reduce((s, l) => s + l.pages.length, 0), 45);');
  return s;
});
console.log('done');
