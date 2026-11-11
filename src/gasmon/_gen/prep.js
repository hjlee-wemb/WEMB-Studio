/* STATCOM HMI 생성기(conv.js)를 이 시안(스마트 플랜트 가스 모니터링 5화면)에 맞춘다 — 한 번만 돌린다.
   실행: node prep.js */
'use strict';
const fs = require('fs'), path = require('path');
const p = path.join(__dirname, 'conv.js');
let s = fs.readFileSync(p, 'utf8');
if (s.includes("px: 'gmm'")) { console.log('이미 고침'); process.exit(0); }
const rep = (a, b) => { if (!s.includes(a)) throw new Error('못 찾음: ' + a.slice(0, 90)); s = s.split(a).join(b); };
const between = (start, end, body) => {
  const a = s.indexOf(start); if (a < 0) throw new Error('시작 표지 없음: ' + start);
  const b = s.indexOf(end, a); if (b < 0) throw new Error('끝 표지 없음: ' + end);
  s = s.slice(0, a) + body + s.slice(b);
};
rep('/* STATCOM HMI 디지털 트윈 — Figma get_design_context(React+Tailwind) → 순수 HTML/CSS 변환기\n   · 화면 11장을 한 번에 만든다.\n   · 한진 → POSCO → LS Electric → 신한카드 → 우리은행 → 공장 전력설비 생성기를 이어 받았다(src/statcom/_gen/README.md).',
  '/* 스마트 플랜트 가스 모니터링 — Figma get_design_context(React+Tailwind) → 순수 HTML/CSS 변환기\n   · 화면 2장 + 팝업 3장(가스 메인 위에 얹는다)을 한 번에 만든다.\n   · 한진 → POSCO → LS Electric → 신한카드 → 우리은행 → 공장 전력설비 → STATCOM HMI 생성기를 이어 받았다(src/gasmon/_gen/README.md).');
rep('node src/statcom/_gen/conv.js', 'node src/gasmon/_gen/conv.js');
rep('/* src/statcom — 내려받은 에셋이 있는 곳 */', '/* src/gasmon — 내려받은 에셋이 있는 곳 */');
/* 팝업 자리 — Figma 에는 단독 프레임이라 놓을 자리가 없다. 1920x1080 한가운데(정수 픽셀)에 얹는다 */
const OV = (l, t, w, h, b) => `overlay: { left: ${l}, top: ${t}, w: ${w}, h: ${h}, base: 'gmg', build: '${b}', dim: 'rgba(1,6,18,0.55)' }`;
between('const SCREENS = [', '/* ══════════════════ 1. JSX 파서', [
  'const SCREENS = [',
  "  { key: '3059-3083', node: '3059:3083', px: 'gmm', name: 'Screen/Main', out: 'gasmon-main', page: 'main', meta: ['meta-3059-3083.xml'] },",
  "  { key: '3059-3990', node: '3059:3990', px: 'gmg', name: 'Screen/Gas Main', out: 'gasmon-gas', page: 'gas', meta: ['meta-3059-3990.xml'] },",
  "  { key: '3059-4943', node: '3059:4943', px: 'gmw', name: 'Popup/Work Site Detail', out: 'gasmon-worksite', page: 'worksite', meta: ['meta-3059-4943.xml'], " + OV(549, 271, 821.434, 537.073, 'build_gmw_scene') + ' },',
  "  { key: '3059-5211', node: '3059:5211', px: 'gma', name: 'Popup/Gas Concentration Alarm', out: 'gasmon-alarm', page: 'alarm', meta: ['meta-3059-5211.xml'], " + OV(722, 271, 476.434, 537.073, 'build_gma_scene') + ' },',
  "  { key: '3050-2030', node: '3050:2030', px: 'gmc', name: 'Popup/Send Confirm', out: 'gasmon-confirm', page: 'confirm', meta: ['meta-3050-2030.xml'], " + OV(722, 411, 476.434, 257.073, 'build_gmc_scene') + ' },',
  '];', '', ''].join('\n'));
s = s.replace(/const GRAFT = \{.*\};/, 'const GRAFT = {};');
s = s.replace(/const RING_STROKE = \[[^\]]*\];/, 'const RING_STROKE = [];');
s = s.replace(/const LIGHT_KEEP = .*;/, 'const LIGHT_KEEP = /^(Floor Plan|Menu Card\\/.*|Background|Pedestal|Orb|Icon\\/Menu\\/.*)$/;');
rep("path.join(GEN, '..', '..', 'statcom-live.js')", "path.join(GEN, '..', '..', 'gasmon-live.js')");
rep("'/* STATCOM HMI 디지털 트윈 — ' + r.S.name,", "'/* 스마트 플랜트 가스 모니터링 — ' + r.S.name,");
rep("'   원본: Figma lyDJkcOlrznLKWo7mD7C2n / node ' + r.S.node + ' (1920x1080, page Dark-시안01)',", "'   원본: Figma CbbEsxxZo3vBcBprsiUhJm / node ' + r.S.node + ' (REM 페이지)',");
rep("'   생성기: src/statcom/_gen/conv.js — 손으로 고치지 말 것. */',", "'   생성기: src/gasmon/_gen/conv.js — 손으로 고치지 말 것. */',");
rep("\"  var A = 'src/statcom/';\",", "\"  var A = 'src/gasmon/';\",");
rep("fs.writeFileSync(path.join(STUDIO, 'src', 'statcom', r.S.page + '.html'), PREVIEW);", "fs.writeFileSync(path.join(STUDIO, 'src', 'gasmon', r.S.page + '.html'), PREVIEW);");
rep("'<script src=\"../statcom-live.js?v=' + liveStamp() + '\"></script>',", "'<script src=\"../gasmon-live.js?v=' + liveStamp() + '\"></script>',");
rep("window.initStatcom && window.initStatcom(", "window.initGasmon && window.initGasmon(");
fs.writeFileSync(p, s);
console.log('conv.js 고침');
