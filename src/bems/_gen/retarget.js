/* 데이터센터 생성기 사본을 스마트 빌딩 에너지(bems) 두 화면으로 돌린다 — 한 번만 실행.
   dl.js · conv.js · mk-live.js 의 화면 표 · 경로 · 이름을 바꾼다. */
'use strict';
const fs = require('fs'), path = require('path');
const G = __dirname;
function patch(f, pairs) {
  let s = fs.readFileSync(path.join(G, f), 'utf8');
  for (const [a, b] of pairs) {
    if (a instanceof RegExp) { if (!a.test(s)) console.log('  !! no match', f, a); s = s.replace(a, b); }
    else { if (s.indexOf(a) < 0) console.log('  !! no match', f, a.slice(0, 60)); s = s.split(a).join(b); }
  }
  fs.writeFileSync(path.join(G, f), s);
  console.log('patched', f);
}
patch('dl.js', [
  [/\["2857-2053"[^\]]*\]/, '["1-3","7-472"]'],
  ['src/datacenter/', 'src/bems/'],
]);
patch('conv.js', [
  [/const SCREENS = \[[\s\S]*?\n\];/, "const SCREENS = [\n"
    + "  { key: '1-3', node: '1:3', px: 'bem', name: 'Screen/Main', out: 'bems-main', page: 'main', meta: ['meta-1-3.xml'] },\n"
    + "  { key: '7-472', node: '7:472', px: 'bef', name: 'Screen/Floor', out: 'bems-floor', page: 'floor', meta: ['meta-7-472.xml'] },\n"
    + "];"],
  ["'datacenter-live.js'", "'bems-live.js'"],
  ['../datacenter-live.js', '../bems-live.js'],
  ["var A = 'src/datacenter/';", "var A = 'src/bems/';"],
  ["path.join(STUDIO, 'src', 'datacenter', r.S.page + '.html')", "path.join(STUDIO, 'src', 'bems', r.S.page + '.html')"],
  ['window.initDatacenter && window.initDatacenter(', 'window.initBems && window.initBems('],
  ["'/* 데이터센터 통합 모니터링 — '", "'/* 스마트 빌딩 에너지 관리 — '"],
  ["'   원본: Figma HzfsAmSQbpqIhAYebEkOWr / node ' + r.S.node + ' (REM 페이지)'", "'   원본: Figma CKnzs0z7gCSTPybhRZme1P / node ' + r.S.node + ' (Dark-시안01 페이지)'"],
  ["'   생성기: src/datacenter/_gen/conv.js — 손으로 고치지 말 것. */'", "'   생성기: src/bems/_gen/conv.js — 손으로 고치지 말 것. */'"],
]);
