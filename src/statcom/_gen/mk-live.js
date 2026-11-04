/* live-src.js + 공장 전력설비 라이브의 검증된 차트 부품(스타일 · makeChart) → src/statcom-live.js
   차트 부품은 src/plant-live.js 에서 그대로 떠 온다(이름표 pf- → tc-). 실행: node mk-live.js */
'use strict';
const fs = require('fs'), path = require('path');
const SRC = fs.readFileSync(path.join(__dirname, '..', '..', 'plant-live.js'), 'utf8').replace(/\r\n/g, '\n');
let out = fs.readFileSync(path.join(__dirname, 'live-src.js'), 'utf8').replace(/\r\n/g, '\n');
const rn = (s) => s.replace(/pf-/g, 'tc-').replace(/--tc-acc/g, '--tc-acc').replace(/pfc'/g, "tcc'").replace(/pfg/g, 'tcg');

/* 스타일 — 차트 · 메뉴 줄만 */
const lines = SRC.split('\n');
const css = lines.filter((l) => /^\s*'/.test(l) && /pf-chart|pf-chartmenu|pf-chartbtn/.test(l) && !/data-theme="light"/.test(l));
/* 한 규칙이 여러 줄로 이어지는 것(+ 로 시작)은 없다고 보고, 문장 끝 ',' 를 확인한다 */
css.forEach((l) => { if (!/,\s*$/.test(l)) throw new Error('이어진 줄: ' + l.slice(0, 80)); });
out = out.replace('/*@CHART_CSS*/', () => css.map((l) => rn(l.trim())).join('\n    '));

/* makeChart · 아이콘 · 색 동기화 */
const a = SRC.indexOf('  var KIND_ICON = {');
const b = SRC.indexOf('  var chartUid = 0;');
const c = SRC.indexOf('  function syncChartHue(root, probe) {');
const d = SRC.indexOf('  function installChartSwap(root, st) {');
if (a < 0 || b < 0 || c < 0 || d < 0) throw new Error('표지 없음');
const chart = rn(SRC.slice(a, b)) + rn(SRC.slice(c, d)).replace('h - 200 + 540', 'h - 194 + 540');
out = out.replace('/*@MAKECHART*/', () => chart.trim());
fs.writeFileSync(path.join(__dirname, '..', '..', 'statcom-live.js'), out);
console.log('statcom-live.js', out.length);
