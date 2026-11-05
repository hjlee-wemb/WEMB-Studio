/* 에셋 라이브러리 연결 — studio.html(목록 script · ?v) · layout-editor.js(NB 선언 · 탭 5곳) · authoring.css(.hj-asset.nbX-root). 한 번만 돌린다.
   실행: node src/newbiz-assets/_gen/patch-library.js */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const PX = ['nbw', 'nbs', 'nbe', 'nbk', 'nbl', 'nbg', 'nbm', 'nbt', 'nbu', 'nbp', 'nbo'];
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

edit('js/studio/layout-editor.js', '__NEWBIZ_ASSETS', (s) => {
  s = rep(s, "    const DOM_SCREENS = Object.assign({}, HJ.screens || {}, HN.screens || {}, PK.screens || {}, SH.screens || {}, PF.screens || {}, SC.screens || {});",
    "    const NB = window.__NEWBIZ_ASSETS || { screens: {}, charts: [], symbols: [], icons: [], panels: [], events: [] };\n" +
    "    const DOM_SCREENS = Object.assign({}, HJ.screens || {}, HN.screens || {}, PK.screens || {}, SH.screens || {}, PF.screens || {}, SC.screens || {}, NB.screens || {});");
  s = rep(s, ".concat(hjItems(SC.panels, 'panel'))", ".concat(hjItems(SC.panels, 'panel'))\n        .concat(hjItems(NB.panels, 'panel'))");
  s = rep(s, ".concat(hjItems(SC.events, 'event'))", ".concat(hjItems(SC.events, 'event'))\n        .concat(hjItems(NB.events, 'event'))");
  s = rep(s, ".concat(hjItems(SC.symbols, 'symbol'))", ".concat(hjItems(SC.symbols, 'symbol'))\n        .concat(hjItems(NB.symbols, 'symbol'))");
  s = rep(s, ".concat(hjIcons(SC.icons, 'icon').filter(isIconNamed))", ".concat(hjIcons(SC.icons, 'icon').filter(isIconNamed))\n        .concat(hjIcons(NB.icons, 'icon').filter(isIconNamed))");
  s = rep(s, "      hjItems(SC.charts, 'chart').forEach((a) => items.push(a));", "      hjItems(SC.charts, 'chart').forEach((a) => items.push(a));\n      hjItems(NB.charts, 'chart').forEach((a) => items.push(a));");
  return s;
});
edit('css/studio/authoring.css', '.hj-asset.nbw-root', (s) => rep(s, '.hj-asset.tcl-root {', '.hj-asset.tcl-root,\n' + PX.map((p) => '.hj-asset.' + p + '-root').join(',\n') + ' {'));
edit('studio.html', 'src/newbiz-assets.js', (s) => {
  s = rep(s, '    <script src="src/statcom-assets.js?v=1"></script>', '    <script src="src/statcom-assets.js?v=1"></script>\n    <script src="src/newbiz-assets.js?v=1"></script>');
  s = bump(s, 'js/studio/layout-editor.js');
  s = bump(s, 'css/studio/authoring.css');
  return s;
});
console.log('done');
