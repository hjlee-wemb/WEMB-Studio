/* 에셋 라이브러리 연결 — studio.html(목록 script · ?v) · layout-editor.js(DC 선언 · 탭 5곳) · authoring.css(.hj-asset.dmX-root).
   한 번만 돌린다(두 번째부터는 '이미 있음'). 앞 시안(스마트팩토리 에너지관리 FM) 바로 뒤에 붙인다.
   실행: node src/datacenter-assets/_gen/patch-library.js */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const PX = ['dmm', 'dmp', 'dmw', 'dma', 'dme', 'dmc', 'dmi', 'dms', 'dmx'];
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

edit('js/studio/layout-editor.js', '__DATACENTER_ASSETS', (s) => {
  const prev = 'FM';
  const decl = /\n(    const DOM_SCREENS = Object\.assign\(\{\}, [^\n]*?)\);/.exec(s);
  if (!decl) throw new Error('DOM_SCREENS 없음');
  s = s.replace(decl[0], '\n    const DC = window.__DATACENTER_ASSETS || { screens: {}, charts: [], symbols: [], icons: [], panels: [], events: [] };\n' + decl[1] + ', DC.screens || {});');
  const after = (re, add) => { const m = re.exec(s); if (!m) throw new Error('앵커 없음: ' + re); s = s.slice(0, m.index + m[0].length) + add + s.slice(m.index + m[0].length); };
  after(new RegExp('\\.concat\\(hjItems\\(' + prev + "\\.panels, 'panel'\\)\\)"), "\n        .concat(hjItems(DC.panels, 'panel'))");
  after(new RegExp('\\.concat\\(hjItems\\(' + prev + "\\.events, 'event'\\)\\)"), "\n        .concat(hjItems(DC.events, 'event'))");
  after(new RegExp('\\.concat\\(hjItems\\(' + prev + "\\.symbols, 'symbol'\\)\\)"), "\n        .concat(hjItems(DC.symbols, 'symbol'))");
  after(new RegExp('\\.concat\\(hjIcons\\(' + prev + "\\.icons, 'icon'\\)\\.filter\\(isIconNamed\\)\\)"), "\n        .concat(hjIcons(DC.icons, 'icon').filter(isIconNamed))");
  after(new RegExp('      hjItems\\(' + prev + "\\.charts, 'chart'\\)\\.forEach\\(\\(a\\) => items\\.push\\(a\\)\\);"), "\n      hjItems(DC.charts, 'chart').forEach((a) => items.push(a));");
  return s;
});
edit('css/studio/authoring.css', '.hj-asset.dmm-root', (s) => rep(s, '.hj-asset.dwl-root {', PX.map((p) => '.hj-asset.' + p + '-root').join(',\n') + ',\n.hj-asset.dwl-root {'));
edit('studio.html', 'src/datacenter-assets.js', (s) => {
  const m = /<script src="src\/fems-assets\.js\?v=\d+"><\/script>/.exec(s);
  if (!m) throw new Error('앞 시안 목록 자리 없음');
  s = s.replace(m[0], m[0] + '\n    <script src="src/datacenter-assets.js?v=1"></script>');
  s = bump(s, 'js/studio/layout-editor.js');
  s = bump(s, 'css/studio/authoring.css');
  return s;
});
console.log('done');
