/* 에셋 라이브러리 연결 — studio.html(목록 script · ?v) · layout-editor.js(PF 선언 · 탭 5곳) · authoring.css(.hj-asset.pfo-root). 한 번만 돌린다.
   실행: node src/plant-assets/_gen/patch-library.js */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
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
const bump = (s, f) => { const re = new RegExp(f.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&') + '\\?v=(\\d+)'); if (!re.test(s)) throw new Error('판 번호 없음: ' + f); return s.replace(re, (m, n) => f + '?v=' + (+n + 1)); };

edit('js/studio/layout-editor.js', '__PLANT_ASSETS', (s) => {
  s = rep(s, "    const DOM_SCREENS = Object.assign({}, HJ.screens || {}, HN.screens || {}, PK.screens || {}, SH.screens || {});",
    "    const PF = window.__PLANT_ASSETS || { screens: {}, charts: [], symbols: [], icons: [], panels: [], events: [] };\n" +
    "    const DOM_SCREENS = Object.assign({}, HJ.screens || {}, HN.screens || {}, PK.screens || {}, SH.screens || {}, PF.screens || {});");
  s = rep(s, ".concat(hjItems(SH.panels, 'panel'))", ".concat(hjItems(SH.panels, 'panel'))\n        .concat(hjItems(PF.panels, 'panel'))");
  s = rep(s, ".concat(hjItems(SH.events, 'event'))", ".concat(hjItems(SH.events, 'event'))\n        .concat(hjItems(PF.events, 'event'))");
  s = rep(s, ".concat(hjItems(SH.symbols, 'symbol'))", ".concat(hjItems(SH.symbols, 'symbol'))\n        .concat(hjItems(PF.symbols, 'symbol'))");
  s = rep(s, ".concat(hjIcons(SH.icons, 'icon').filter(isIconNamed))", ".concat(hjIcons(SH.icons, 'icon').filter(isIconNamed))\n        .concat(hjIcons(PF.icons, 'icon').filter(isIconNamed))");
  s = rep(s, "      hjItems(SH.charts, 'chart').forEach((a) => items.push(a));", "      hjItems(SH.charts, 'chart').forEach((a) => items.push(a));\n      hjItems(PF.charts, 'chart').forEach((a) => items.push(a));");
  return s;
});
edit('css/studio/authoring.css', '.hj-asset.pfo-root', (s) => rep(s, '.hj-asset.shd-root {', '.hj-asset.shd-root,\n.hj-asset.pfo-root {'));
edit('studio.html', 'src/plant-assets.js', (s) => {
  s = rep(s, '    <script src="src/shinhan-assets.js?v=1"></script>', '    <script src="src/shinhan-assets.js?v=1"></script>\n    <script src="src/plant-assets.js?v=1"></script>');
  s = bump(s, 'js/studio/layout-editor.js');
  s = bump(s, 'css/studio/authoring.css');
  return s;
});
console.log('done');
