/* 데이터센터 에셋 생성기 사본을 스마트 빌딩 에너지 관리(bems, 장면 main · floor)로 돌린다 — 한 번만. */
'use strict';
const fs = require('fs'), path = require('path');
const G = __dirname;
function patch(f, pairs) {
  let s = fs.readFileSync(path.join(G, f), 'utf8');
  for (const [a, b] of pairs) {
    const hit = a instanceof RegExp ? a.test(s) : s.indexOf(a) >= 0;
    if (!hit) console.log('  !! no match', f, String(a).slice(0, 70));
    s = a instanceof RegExp ? s.replace(a, b) : s.split(a).join(b);
  }
  fs.writeFileSync(path.join(G, f), s);
  console.log('patched', f);
}
const common = [['src/datacenter-assets/_gen', 'src/bems-assets/_gen'], ['localhost:5600', 'localhost:5610'], ['src/datacenter/_gen/serve.js 5600', 'src/bems/_gen/serve.js 5610']];
patch('measure.js', common.concat([
  ["'http://localhost:5610/src/datacenter/' + sc", "'http://localhost:5610/src/bems/' + sc"],
  ['src/datacenter/_gen/asset-sizes.json', 'src/bems/_gen/asset-sizes.json'],
]));
patch('mk-assets.js', [
  ["path.join(ROOT, 'src', 'datacenter-assets.js')", "path.join(ROOT, 'src', 'bems-assets.js')"],
  ["const BASE = 'src/datacenter/';", "const BASE = 'src/bems/';"],
  [/const SCREEN = \{[\s\S]*?\n\};/, "const SCREEN = {\n  main: { px: 'bem', title: '메인' },\n  floor: { px: 'bef', title: '층별 현황' },\n};"],
  ["'datacenter-' + sc + '.js'", "'bems-' + sc + '.js'"],
  ["'dc_' + px", "'be_' + px"], ["'dc_' + file", "'be_' + file"],
  ["f !== 'datacenter-assets.js'", "f !== 'bems-assets.js'"],
  ["rootClass: 'tc-asset dw-asset dc-asset'", "rootClass: 'tc-asset dw-asset be-asset'"],
  ["'데이터센터 통합 모니터링 — ' + SCREEN[sc].title", "'스마트 빌딩 에너지 관리 — ' + SCREEN[sc].title"],
  ["'/* 자동 생성물 — 데이터센터 통합 모니터링 8장면(Figma HzfsAmSQbpqIhAYebEkOWr)의 에셋 라이브러리 등록 목록.\\n'", "'/* 자동 생성물 — 스마트 빌딩 에너지 관리 2장면(Figma CKnzs0z7gCSTPybhRZme1P)의 에셋 라이브러리 등록 목록.\\n'"],
  ["'   마크업도 CSS 도 복사해 두지 않는다 — build_dmX 의 DOM 에서 노드 id 로 잘라 쓴다.\\n'", "'   마크업도 CSS 도 복사해 두지 않는다 — build_bem · build_bef 의 DOM 에서 노드 id 로 잘라 쓴다.\\n'"],
  ["'   생성기: src/datacenter-assets/_gen/mk-assets.js — 손으로 고치지 말고 다시 돌릴 것. */\\n'", "'   생성기: src/bems-assets/_gen/mk-assets.js — 손으로 고치지 말고 다시 돌릴 것. */\\n'"],
  ["'window.__DATACENTER_ASSETS = '", "'window.__BEMS_ASSETS = '"],
  ["'\\nsrc/datacenter-assets.js — 차트 '", "'\\nsrc/bems-assets.js — 차트 '"],
]);
patch('patch-library.js', [
  ["const PX = ['dmm', 'dmp', 'dmw', 'dma', 'dme', 'dmc', 'dmi', 'dms', 'dmx'];", "const PX = ['bem', 'bef'];"],
  ["edit('js/studio/layout-editor.js', '__DATACENTER_ASSETS', (s) => {\n  const prev = 'FM';", "edit('js/studio/layout-editor.js', '__BEMS_ASSETS', (s) => {\n  const prev = 'DC';"],
  ["'\\n    const DC = window.__DATACENTER_ASSETS || { screens: {}, charts: [], symbols: [], icons: [], panels: [], events: [] };\\n' + decl[1] + ', DC.screens || {});'", "'\\n    const BE = window.__BEMS_ASSETS || { screens: {}, charts: [], symbols: [], icons: [], panels: [], events: [] };\\n' + decl[1] + ', BE.screens || {});'"],
  ["\"\\n        .concat(hjItems(DC.panels, 'panel'))\"", "\"\\n        .concat(hjItems(BE.panels, 'panel'))\""],
  ["\"\\n        .concat(hjItems(DC.events, 'event'))\"", "\"\\n        .concat(hjItems(BE.events, 'event'))\""],
  ["\"\\n        .concat(hjItems(DC.symbols, 'symbol'))\"", "\"\\n        .concat(hjItems(BE.symbols, 'symbol'))\""],
  ["\"\\n        .concat(hjIcons(DC.icons, 'icon').filter(isIconNamed))\"", "\"\\n        .concat(hjIcons(BE.icons, 'icon').filter(isIconNamed))\""],
  ["\"\\n      hjItems(DC.charts, 'chart').forEach((a) => items.push(a));\"", "\"\\n      hjItems(BE.charts, 'chart').forEach((a) => items.push(a));\""],
  ["edit('css/studio/authoring.css', '.hj-asset.dmm-root', (s) => rep(s, '.hj-asset.dwl-root {'", "edit('css/studio/authoring.css', '.hj-asset.bem-root', (s) => rep(s, '.hj-asset.dwl-root {'"],
  ["edit('studio.html', 'src/datacenter-assets.js', (s) => {\n  const m = /<script src=\"src\\/fems-assets\\.js\\?v=\\d+\"><\\/script>/.exec(s);", "edit('studio.html', 'src/bems-assets.js', (s) => {\n  const m = /<script src=\"src\\/datacenter-assets\\.js\\?v=\\d+\"><\\/script>/.exec(s);"],
  ["'\\n    <script src=\"src/datacenter-assets.js?v=1\"></script>'", "'\\n    <script src=\"src/bems-assets.js?v=1\"></script>'"],
]);
