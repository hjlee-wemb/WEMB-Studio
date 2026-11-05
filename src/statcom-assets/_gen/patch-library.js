/* 에셋 라이브러리 연결 — studio.html(목록 script · ?v) · layout-editor.js(SC 선언 · 탭 5곳) · authoring.css(.hj-asset.tcX-root 15개). 한 번만 돌린다.
   실행: node src/statcom-assets/_gen/patch-library.js */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const PX = ['tcm', 'tcs', 'tcp', 'tcv', 'tcc', 'tce', 'tcn', 'tcu', 'tca', 'tcq', 'tvt', 'tvo', 'tvs', 'tvm', 'tcl'];
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

edit('js/studio/layout-editor.js', '__STATCOM_ASSETS', (s) => {
  s = rep(s, "    const DOM_SCREENS = Object.assign({}, HJ.screens || {}, HN.screens || {}, PK.screens || {}, SH.screens || {}, PF.screens || {});",
    "    const SC = window.__STATCOM_ASSETS || { screens: {}, charts: [], symbols: [], icons: [], panels: [], events: [] };\n" +
    "    const DOM_SCREENS = Object.assign({}, HJ.screens || {}, HN.screens || {}, PK.screens || {}, SH.screens || {}, PF.screens || {}, SC.screens || {});");
  s = rep(s, ".concat(hjItems(PF.panels, 'panel'))", ".concat(hjItems(PF.panels, 'panel'))\n        .concat(hjItems(SC.panels, 'panel'))");
  s = rep(s, ".concat(hjItems(PF.events, 'event'))", ".concat(hjItems(PF.events, 'event'))\n        .concat(hjItems(SC.events, 'event'))");
  s = rep(s, ".concat(hjItems(PF.symbols, 'symbol'))", ".concat(hjItems(PF.symbols, 'symbol'))\n        .concat(hjItems(SC.symbols, 'symbol'))");
  s = rep(s, ".concat(hjIcons(PF.icons, 'icon').filter(isIconNamed))", ".concat(hjIcons(PF.icons, 'icon').filter(isIconNamed))\n        .concat(hjIcons(SC.icons, 'icon').filter(isIconNamed))");
  s = rep(s, "      hjItems(PF.charts, 'chart').forEach((a) => items.push(a));", "      hjItems(PF.charts, 'chart').forEach((a) => items.push(a));\n      hjItems(SC.charts, 'chart').forEach((a) => items.push(a));");
  return s;
});
edit('css/studio/authoring.css', '.hj-asset.tcm-root', (s) => rep(s, '.hj-asset.pfo-root {', '.hj-asset.pfo-root,\n' + PX.map((p) => '.hj-asset.' + p + '-root').join(',\n') + ' {'));
edit('studio.html', 'src/statcom-assets.js', (s) => {
  s = rep(s, '    <script src="src/plant-assets.js?v=1"></script>', '    <script src="src/plant-assets.js?v=1"></script>\n    <script src="src/statcom-assets.js?v=1"></script>');
  s = bump(s, 'js/studio/layout-editor.js');
  s = bump(s, 'css/studio/authoring.css');
  return s;
});
console.log('done');
