/* 에셋 라이브러리 연결 — studio.html(목록 script · ?v) · layout-editor.js(OF 선언 · 탭 5곳) · authoring.css(.hj-asset.ofXX-root). 한 번만 돌린다.
   실행: node src/office-assets/_gen/patch-library.js */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const PX = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/office/_gen/screens.json'), 'utf8')).map((r) => r[2]);
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

edit('js/studio/layout-editor.js', '__OFFICE_ASSETS', (s) => {
  s = rep(s, "    const DOM_SCREENS = Object.assign({}, HJ.screens || {}, HN.screens || {}, PK.screens || {}, SH.screens || {}, PF.screens || {}, SC.screens || {}, NB.screens || {}, DW.screens || {});",
    "    const OF = window.__OFFICE_ASSETS || { screens: {}, charts: [], symbols: [], icons: [], panels: [], events: [] };\n" +
    "    const DOM_SCREENS = Object.assign({}, HJ.screens || {}, HN.screens || {}, PK.screens || {}, SH.screens || {}, PF.screens || {}, SC.screens || {}, NB.screens || {}, DW.screens || {}, OF.screens || {});");
  s = rep(s, ".concat(hjItems(DW.panels, 'panel'))", ".concat(hjItems(DW.panels, 'panel'))\n        .concat(hjItems(OF.panels, 'panel'))");
  s = rep(s, ".concat(hjItems(DW.events, 'event'))", ".concat(hjItems(DW.events, 'event'))\n        .concat(hjItems(OF.events, 'event'))");
  s = rep(s, ".concat(hjItems(DW.symbols, 'symbol'))", ".concat(hjItems(DW.symbols, 'symbol'))\n        .concat(hjItems(OF.symbols, 'symbol'))");
  s = rep(s, ".concat(hjIcons(DW.icons, 'icon').filter(isIconNamed))", ".concat(hjIcons(DW.icons, 'icon').filter(isIconNamed))\n        .concat(hjIcons(OF.icons, 'icon').filter(isIconNamed))");
  s = rep(s, "      hjItems(DW.charts, 'chart').forEach((a) => items.push(a));", "      hjItems(DW.charts, 'chart').forEach((a) => items.push(a));\n      hjItems(OF.charts, 'chart').forEach((a) => items.push(a));");
  return s;
});
edit('css/studio/authoring.css', '.hj-asset.ofha-root', (s) => rep(s, '.hj-asset.dwl-root {', PX.map((p) => '.hj-asset.' + p + '-root').join(',\n') + ',\n.hj-asset.dwl-root {'));
edit('studio.html', 'src/office-assets.js', (s) => {
  const m = /<script src="src\/drawing-assets\.js\?v=\d+"><\/script>/.exec(s);
  if (!m) throw new Error('drawing-assets 자리 없음');
  s = s.replace(m[0], m[0] + '\n    <script src="src/office-assets.js?v=1"></script>');
  s = bump(s, 'js/studio/layout-editor.js');
  s = bump(s, 'css/studio/authoring.css');
  return s;
});
console.log('done');
