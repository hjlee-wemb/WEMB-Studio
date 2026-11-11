/* 에셋 라이브러리 연결 — studio.html(목록 script · ?v) · layout-editor.js(GM 선언 · 탭 5곳) · authoring.css(.hj-asset.gmX-root)
   · tpl-modules.js(화면 모듈 ?v — light.js 가 화면 판 색을 :not(.hj-asset) 로 바꿔서). 한 번만 돌린다.
   실행: node src/gasmon-assets/_gen/patch-library.js */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const PX = ['gmm', 'gmg', 'gmw', 'gma', 'gmc'];
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

/* 바로 앞 시안(스마트 오피스)이 있으면 그 뒤에, 없으면 도면관리 뒤에 붙인다 */
edit('js/studio/layout-editor.js', '__GASMON_ASSETS', (s) => {
  const prev = s.indexOf('__OFFICE_ASSETS') >= 0 ? 'OF' : 'DW';
  const decl = /\n(    const DOM_SCREENS = Object\.assign\(\{\}, [^\n]*?)\);/.exec(s);
  if (!decl) throw new Error('DOM_SCREENS 없음');
  s = s.replace(decl[0], '\n    const GM = window.__GASMON_ASSETS || { screens: {}, charts: [], symbols: [], icons: [], panels: [], events: [] };\n' + decl[1] + ', GM.screens || {});');
  const after = (re, add) => { const m = re.exec(s); if (!m) throw new Error('앵커 없음: ' + re); s = s.slice(0, m.index + m[0].length) + add + s.slice(m.index + m[0].length); };
  after(new RegExp("\\.concat\\(hjItems\\(" + prev + "\\.panels, 'panel'\\)\\)"), "\n        .concat(hjItems(GM.panels, 'panel'))");
  after(new RegExp("\\.concat\\(hjItems\\(" + prev + "\\.events, 'event'\\)\\)"), "\n        .concat(hjItems(GM.events, 'event'))");
  after(new RegExp("\\.concat\\(hjItems\\(" + prev + "\\.symbols, 'symbol'\\)\\)"), "\n        .concat(hjItems(GM.symbols, 'symbol'))");
  after(new RegExp("\\.concat\\(hjIcons\\(" + prev + "\\.icons, 'icon'\\)\\.filter\\(isIconNamed\\)\\)"), "\n        .concat(hjIcons(GM.icons, 'icon').filter(isIconNamed))");
  after(new RegExp("      hjItems\\(" + prev + "\\.charts, 'chart'\\)\\.forEach\\(\\(a\\) => items\\.push\\(a\\)\\);"), "\n      hjItems(GM.charts, 'chart').forEach((a) => items.push(a));");
  return s;
});
edit('css/studio/authoring.css', '.hj-asset.gmm-root', (s) => rep(s, '.hj-asset.dwl-root {', PX.map((p) => '.hj-asset.' + p + '-root').join(',\n') + ',\n.hj-asset.dwl-root {'));
edit('studio.html', 'src/gasmon-assets.js', (s) => {
  const m = /<script src="src\/(office|drawing)-assets\.js\?v=\d+"><\/script>/.exec(s);
  if (!m) throw new Error('앞 시안 목록 자리 없음');
  s = s.replace(m[0], m[0] + '\n    <script src="src/gasmon-assets.js?v=1"></script>');
  s = bump(s, 'js/studio/layout-editor.js');
  s = bump(s, 'css/studio/authoring.css');
  s = bump(s, 'js/core/tpl-modules.js');
  return s;
});
edit('js/core/tpl-modules.js', "src/gasmon-main.js?v=6", (s) => {
  ['main', 'gas', 'worksite', 'alarm', 'confirm'].forEach((k) => { s = bump(s, 'src/gasmon-' + k + '.js'); });
  return s;
});
console.log('done');
