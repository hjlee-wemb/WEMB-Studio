/* 생성기 설정을 이 시안(POSCO KDB CCTV 관제 · Figma dj0SONcO5BySCm7yDdZrNc / 2:18441)에 맞춘다.
   hana(_gen) 에서 복사해 온 dl.js · conv.js · mk-nodes.js 의 화면 목록만 갈아 끼운다. */
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

/* ── dl.js — 내려받을 화면 목록 ── */
edit('dl.js', (s) =>
  s.replace(/const SCREENS = \{[\s\S]*?\};/, () => "const SCREENS = {\n  '2-18441': 'dc-2-18441.txt',\n};")
   .replace('/* src/hana/ */', '/* src/posco/ */'));

/* ── conv.js — 화면 한 장 ── */
edit('conv.js', (s) =>
  s.replace(/const SCREENS = \[[\s\S]*?\n\];/, () =>
    "const SCREENS = [\n" +
    "  { key: '2-18441', node: '2:18441', px: 'pkm', name: 'Screen/Control Main', out: 'posco-main', meta: ['meta-2-18441.xml'] },\n" +
    "];")
   .replace("/* src/hanjin — 내려받은 에셋이 있는 곳 */", "/* src/posco — 내려받은 에셋이 있는 곳 */")
   .replace(/node src\/hana\/_gen\/conv\.js/g, 'node src/posco/_gen/conv.js'));

console.log('done');
