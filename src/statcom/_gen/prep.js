/* 공장 전력설비 생성기를 이 시안(TPC STATCOM HMI 11화면)에 맞춘다 — 한 번만 돌린다.
   실행: node prep.js */
'use strict';
const fs = require('fs'), path = require('path');
const p = path.join(__dirname, 'conv.js');
let s = fs.readFileSync(p, 'utf8');
if (s.includes("px: 'tcs'")) { console.log('이미 고침'); process.exit(0); }
const rep = (a, b) => { if (!s.includes(a)) throw new Error('못 찾음: ' + a.slice(0, 90)); s = s.split(a).join(b); };
const between = (start, end, body) => {
  const a = s.indexOf(start); if (a < 0) throw new Error('시작 표지 없음: ' + start);
  const b = s.indexOf(end, a); if (b < 0) throw new Error('끝 표지 없음: ' + end);
  s = s.slice(0, a) + body + s.slice(b);
};
rep('/* 공장 전력설비 디지털 트윈 — Figma get_design_context(React+Tailwind) → 순수 HTML/CSS 변환기\n   · 화면 1장(Screen/Facility Overview 1:2)을 만든다.\n   · 한진 → POSCO → LS Electric → 신한카드 → 우리은행 생성기를 그대로 이어 받았다(src/plant/_gen/README.md).',
  '/* STATCOM HMI 디지털 트윈 — Figma get_design_context(React+Tailwind) → 순수 HTML/CSS 변환기\n   · 화면 11장을 한 번에 만든다.\n   · 한진 → POSCO → LS Electric → 신한카드 → 우리은행 → 공장 전력설비 생성기를 이어 받았다(src/statcom/_gen/README.md).');
rep('node src/plant/_gen/conv.js', 'node src/statcom/_gen/conv.js');
rep('/* src/plant — 내려받은 에셋이 있는 곳 */', '/* src/statcom — 내려받은 에셋이 있는 곳 */');
const M = "meta: ['meta-page.xml']";
between('const SCREENS = [', '/* ══════════════════ 1. JSX 파서', [
  'const SCREENS = [',
  `  { key: '1-426', node: '1:426', px: 'tcl', name: '1_로그인', out: 'statcom-login', page: 'login', ${M} },`,
  `  { key: '1-313', node: '1:313', px: 'tcm', name: '2_메인화면_close', out: 'statcom-main', page: 'main', ${M} },`,
  `  { key: '1-187', node: '1:187', px: 'tcs', name: '3_STATCOM', out: 'statcom-statcom', page: 'statcom', ${M} },`,
  `  { key: '1-271', node: '1:271', px: 'tcp', name: '4_전력설비', out: 'statcom-power', page: 'power', ${M} },`,
  `  { key: '1-194', node: '1:194', px: 'tcv', name: '5_VSC 밸브실', out: 'statcom-valve', page: 'valve', ${M} },`,
  `  { key: '1-278', node: '1:278', px: 'tcc', name: '6_VSC 냉각실', out: 'statcom-cooling', page: 'cooling', ${M} },`,
  `  { key: '1-286', node: '1:286', px: 'tce', name: '7_전원 설비', out: 'statcom-supply', page: 'supply', ${M} },`,
  `  { key: '1-293', node: '1:293', px: 'tcn', name: '8_제어 안전', out: 'statcom-safety', page: 'safety', ${M} },`,
  `  { key: '1-300', node: '1:300', px: 'tcu', name: '9_시뮬레이션 (3D 공정 애니메이션)', out: 'statcom-simulation', page: 'simulation', ${M} },`,
  `  { key: '1-307', node: '1:307', px: 'tca', name: '10_알람 메세지', out: 'statcom-alarm', page: 'alarm', ${M} },`,
  `  { key: '1-457', node: '1:457', px: 'tcq', name: '11_설비 요약 정보 카드 컨셉', out: 'statcom-cards', page: 'cards', ${M} },`,
  '];', '', ''].join('\n'));
between('const INLINE_SVG = [', '/* ── 헤더 탭 상태 바로잡기', "const INLINE_SVG = [];\nconst INLINE_RE = /^$/;\n\n");
s = s.replace(/const LIGHT_KEEP = .*;/, () => 'const LIGHT_KEEP = /^(Hero Image|Scene Image|Map Image|Logo Image|Equipment Image|Thumbnail)$/;');
/* 화면 틀 — 이 시안은 프레임 이름이 '5_VSC 밸브실' 꼴이라 Screen/ 접두어가 없다 */
rep(`'.' + PX + '-root > [data-name^="Screen/"]{will-change:transform;}'`, `'.' + PX + '-root > [data-node-id]{will-change:transform;}'`);
rep("path.join(GEN, '..', '..', 'plant-live.js')", "path.join(GEN, '..', '..', 'statcom-live.js')");
rep("'/* 공장 전력설비 디지털 트윈 — ' + r.S.name,", "'/* STATCOM HMI 디지털 트윈 — ' + r.S.name,");
rep("'   원본: Figma hHans6kNFlTP98CO1O431o / node '", "'   원본: Figma lyDJkcOlrznLKWo7mD7C2n / node '");
rep("'   생성기: src/plant/_gen/conv.js — 손으로 고치지 말 것. */',", "'   생성기: src/statcom/_gen/conv.js — 손으로 고치지 말 것. */',");
rep("\"  var A = 'src/plant/';\",", "\"  var A = 'src/statcom/';\",");
rep("fs.writeFileSync(path.join(STUDIO, 'src', 'plant', r.S.page + '.html'), PREVIEW);", "fs.writeFileSync(path.join(STUDIO, 'src', 'statcom', r.S.page + '.html'), PREVIEW);");
rep("'<script src=\"../plant-live.js?v=' + liveStamp() + '\"></script>',", "'<script src=\"../statcom-live.js?v=' + liveStamp() + '\"></script>',");
rep("window.initPlant && window.initPlant(", "window.initStatcom && window.initStatcom(");
fs.writeFileSync(p, s);

/* dl.js — 폴더 · 화면 표 */
const dp = path.join(__dirname, 'dl.js');
let d = fs.readFileSync(dp, 'utf8');
d = d.replace("/* src/plant/ */", "/* src/statcom/ */");
d = d.replace("const SCREENS = { '1-2': 'dc-1-2.txt' };", "const SCREENS = Object.fromEntries(['1-426','1-313','1-187','1-271','1-194','1-278','1-286','1-293','1-300','1-307','1-457'].map((k) => [k, 'dc-' + k + '.txt']));");
fs.writeFileSync(dp, d);

/* meta-abs.js — 화면 전체 */
const mp = path.join(__dirname, 'meta-abs.js');
let m = fs.readFileSync(mp, 'utf8');
m = m.replace("for (const f of ['dc-1-2.txt'])", "for (const f of fs.readdirSync(GEN).filter((x) => /^dc-.*\\.txt$/.test(x)))");
fs.writeFileSync(mp, m);

/* screen-css.json 은 mk-screen-css.js 가 만든다 — 처음엔 빈 표 */
fs.writeFileSync(path.join(__dirname, 'screen-css.json'), '{}');
console.log('conv.js · dl.js · meta-abs.js 고침');
