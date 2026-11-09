/* 에셋 라이브러리 연결 — studio.html(목록 script · ?v) · layout-editor.js(DW 선언 · 탭 5곳 · 아이콘 light) · authoring.css(.hj-asset.dwX-root). 한 번만 돌린다.
   실행: node src/drawing-assets/_gen/patch-library.js */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const PX = ['dwm', 'dwn', 'dws', 'dwp', 'dwa', 'dwb', 'dwv', 'dwo', 'dwr', 'dwe', 'dwh', 'dwi', 'dwc', 'dwk', 'dww', 'dwd', 'dwt', 'dwu', 'dwl'];
function edit(file, marker, fn) {
  const p = path.join(ROOT, file);
  const before = fs.readFileSync(p, 'utf8');
  if (before.indexOf(marker) >= 0) { console.log('  (이미 있음)', file); return; }
  const crlf = before.indexOf('\r\n') >= 0;
  let s = crlf ? before.replace(/\r\n/g, '\n') : before;
  s = fn(s);
  if (crlf) s = s.replace(/\n/g, '\r\n');
  fs.writeFileSync(p, s);
  console.log('  patched', file);
}
const rep = (s, a, b) => { if (s.indexOf(a) < 0) throw new Error('앵커 없음: ' + a.slice(0, 80)); return s.replace(a, () => b); };
const bump = (s, f) => { const at = s.indexOf(f + '?v='); if (at < 0) throw new Error('판 번호 없음: ' + f); const from = at + f.length + 3; let to = from; while (/[0-9]/.test(s[to])) to++; return s.slice(0, from) + (+s.slice(from, to) + 1) + s.slice(to); };

edit('js/studio/layout-editor.js', '__DRAWING_ASSETS', (s) => {
  s = rep(s, "    const DOM_SCREENS = Object.assign({}, HJ.screens || {}, HN.screens || {}, PK.screens || {}, SH.screens || {}, PF.screens || {}, SC.screens || {}, NB.screens || {});",
    "    const DW = window.__DRAWING_ASSETS || { screens: {}, charts: [], symbols: [], icons: [], panels: [], events: [] };\n" +
    "    const DOM_SCREENS = Object.assign({}, HJ.screens || {}, HN.screens || {}, PK.screens || {}, SH.screens || {}, PF.screens || {}, SC.screens || {}, NB.screens || {}, DW.screens || {});");
  s = rep(s, ".concat(hjItems(NB.panels, 'panel'))", ".concat(hjItems(NB.panels, 'panel'))\n        .concat(hjItems(DW.panels, 'panel'))");
  s = rep(s, ".concat(hjItems(NB.events, 'event'))", ".concat(hjItems(NB.events, 'event'))\n        .concat(hjItems(DW.events, 'event'))");
  s = rep(s, ".concat(hjItems(NB.symbols, 'symbol'))", ".concat(hjItems(NB.symbols, 'symbol'))\n        .concat(hjItems(DW.symbols, 'symbol'))");
  s = rep(s, ".concat(hjIcons(NB.icons, 'icon').filter(isIconNamed))", ".concat(hjIcons(NB.icons, 'icon').filter(isIconNamed))\n        .concat(hjIcons(DW.icons, 'icon').filter(isIconNamed))");
  s = rep(s, "      hjItems(NB.charts, 'chart').forEach((a) => items.push(a));", "      hjItems(NB.charts, 'chart').forEach((a) => items.push(a));\n      hjItems(DW.charts, 'chart').forEach((a) => items.push(a));");
  /* 어두운 무채색 아이콘 — 다크 칸에서 색을 뒤집어 보여 준다(기존 figimg-light 장치) */
  s = rep(s, "const hjIcons = (arr, cat) => (arr || []).map((a) => ({ cat: cat, id: a.id, name: a.name, fig: a.fig, src: a.src }));", "const hjIcons = (arr, cat) => (arr || []).map((a) => ({ cat: cat, id: a.id, name: a.name, fig: a.fig, src: a.src, light: a.light }));");
  return s;
});
edit('css/studio/authoring.css', '.hj-asset.dwm-root', (s) => {
  s = rep(s, '.hj-asset.nbo-root {', '.hj-asset.nbo-root,\n' + PX.map((p) => '.hj-asset.' + p + '-root').join(',\n') + ' {');
  s = rep(s, '/* GROUP 등록물(신한카드 종합현황 위젯)', '/* 도면관리 등록물 — 가운데 정렬 판의 translate 도 자리 지정이다 */\n.hj-asset.dw-asset > :not(.hj-ofs) {\n  translate: none !important;\n}\n/* GROUP 등록물(신한카드 종합현황 위젯)');
  return s;
});
edit('studio.html', 'src/drawing-assets.js', (s) => {
  s = rep(s, '<script src="src/newbiz-assets.js?v=4"></script>', '<script src="src/newbiz-assets.js?v=4"></script>\n    <script src="src/drawing-assets.js?v=1"></script>');
  s = bump(s, 'js/studio/layout-editor.js');
  s = bump(s, 'css/studio/authoring.css');
  return s;
});
console.log('done');
