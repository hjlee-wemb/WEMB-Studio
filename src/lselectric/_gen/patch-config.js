/* 생성기 설정을 이 시안(LS Electric STATCOM · Figma KkmCQi05F7eSb3tHO7ZW0Q)에 맞춘다.
   posco(_gen) 에서 복사해 온 dl.js · conv.js 의 화면 목록 · 경로 · 이름만 갈아 끼운다(한 번만 돌린다).
   실행: node src/lselectric/_gen/patch-config.js */
'use strict';
const fs = require('fs');
const path = require('path');
const GEN = __dirname;

function edit(file, fn) {
  const p = path.join(GEN, file);
  const before = fs.readFileSync(p, 'utf8');
  const after = fn(before);
  if (before === after) { console.log('  (변화 없음)', file); return; }
  fs.writeFileSync(p, after);
  console.log('  patched', file);
}
const must = (s, find, val) => {
  if (typeof find === 'string' ? s.indexOf(find) < 0 : !find.test(s)) throw new Error('앵커 없음: ' + find);
  return s.replace(find, () => val);
};

/* ── dl.js — 내려받을 화면 목록 ── */
edit('dl.js', (s) => {
  s = must(s, /const SCREENS = \{[\s\S]*?\};/, "const SCREENS = {\n  '3-5': 'dc-3-5.txt',\n  '33-748': 'dc-33-748.txt',\n};");
  return s.replace('/* src/posco/ */', '/* src/lselectric/ */');
});

/* ── conv.js ── */
edit('conv.js', (s) => {
  s = must(s, /const SCREENS = \[[\s\S]*?\n\];/,
    "const SCREENS = [\n" +
    "  { key: '3-5', node: '3:5', px: 'lsm', name: 'Screen/STATCOM Overview', out: 'lselectric-statcom', page: 'statcom', meta: ['meta-page.xml'] },\n" +
    "  { key: '33-748', node: '33:748', px: 'lsd', name: 'Screen/Data Center Overview', out: 'lselectric-datacenter', page: 'datacenter', meta: ['meta-page.xml'] },\n" +
    "];");
  s = s.replace("/* src/posco — 내려받은 에셋이 있는 곳 */", "/* src/lselectric — 내려받은 에셋이 있는 곳 */");
  s = s.replace(/node src\/posco\/_gen\/conv\.js/g, 'node src/lselectric/_gen/conv.js');
  /* posco 전용 장치는 비운다 — 이 시안에는 떠다 심기 · 변형 세트 · 캔버스 교체 그림이 없다 */
  s = must(s, /const GRAFT = \{[\s\S]*?\n\};/, 'const GRAFT = {};');
  s = must(s, /const VARIANT_SETS = \{[\s\S]*?\n\};/, 'const VARIANT_SETS = {};');
  s = must(s, "const INLINE_SVG = ['btn-ack-bg.svg'];", 'const INLINE_SVG = [];');
  s = must(s, /const NODE_CSS = \[[\s\S]*?\n\];/, 'const NODE_CSS = [];');
  /* 모듈 머리말 · 에셋 폴더 · 라이브 스크립트 · 미리보기 출력 */
  s = must(s, "'/* POSCO KDB CCTV 관제 — ' + r.S.name,", "'/* LS Electric STATCOM — ' + r.S.name,");
  s = must(s, "'   원본: Figma dj0SONcO5BySCm7yDdZrNc / node ' + r.S.node + ' (1920x1080, page Page 1)',",
    "'   원본: Figma KkmCQi05F7eSb3tHO7ZW0Q / node ' + r.S.node + ' (1920x1080, page Dark-시안01)',");
  s = must(s, "'   생성기: src/lselectric/_gen/conv.js — 손으로 고치지 말 것. */',", "'   생성기: src/lselectric/_gen/conv.js — 손으로 고치지 말 것. */',");
  s = must(s, "\"  var A = 'src/posco/';\",", "\"  var A = 'src/lselectric/';\",");
  s = must(s, "path.join(GEN, '..', '..', 'posco-live.js')", "path.join(GEN, '..', '..', 'lselectric-live.js')");
  s = must(s, "'<script src=\"../posco-live.js?v=' + liveStamp() + '\"></script>',", "'<script src=\"../lselectric-live.js?v=' + liveStamp() + '\"></script>',");
  s = must(s, "window.initPosco && window.initPosco(", "window.initLsElectric && window.initLsElectric(");
  s = must(s, "fs.writeFileSync(path.join(STUDIO, 'src', 'posco', r.S.out.replace('posco-', '') + '.html'), PREVIEW);",
    "fs.writeFileSync(path.join(STUDIO, 'src', 'lselectric', r.S.page + '.html'), PREVIEW);");
  return s;
});

console.log('done');
