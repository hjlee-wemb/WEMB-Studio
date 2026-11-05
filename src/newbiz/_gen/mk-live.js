/* live-src.js + 공장 전력설비 라이브의 검증된 차트 부품(스타일 · makeChart) → src/newbiz-live.js
   차트 부품은 src/plant-live.js 에서 그대로 떠 온다(이름표 pf- → nb-). 실행: node mk-live.js */
'use strict';
const fs = require('fs'), path = require('path');
const SRC = fs.readFileSync(path.join(__dirname, '..', '..', 'plant-live.js'), 'utf8').replace(/\r\n/g, '\n');
let out = fs.readFileSync(path.join(__dirname, 'live-src.js'), 'utf8').replace(/\r\n/g, '\n');
const rn = (s) => s.replace(/pf-/g, 'nb-').replace(/pfc'/g, "nbc'").replace(/pfg/g, 'nbg');
const css = SRC.split('\n').filter((l) => /^\s*'/.test(l) && /pf-chart|pf-chartmenu|pf-chartbtn/.test(l) && !/data-theme="light"/.test(l));
css.forEach((l) => { if (!/,\s*$/.test(l)) throw new Error('이어진 줄: ' + l.slice(0, 80)); });
const lightCss = SRC.split('\n').filter((l) => /^\s*'/.test(l) && /pf-chart|pf-chartmenu|pf-chartbtn/.test(l) && /data-theme="light"/.test(l) && /,\s*$/.test(l));
out = out.replace('/*@CHART_CSS*/', () => css.concat(lightCss).map((l) => rn(l.trim())).join('\n    '));
const a = SRC.indexOf('  var KIND_ICON = {'), b = SRC.indexOf('  var chartUid = 0;'), c = SRC.indexOf('  function syncChartHue(root, probe) {'), d = SRC.indexOf('  function installChartSwap(root, st) {');
if (a < 0 || b < 0 || c < 0 || d < 0) throw new Error('표지 없음');
const chart = rn(SRC.slice(a, b)) + '  var chartUid = 0;\n' + rn(SRC.slice(c, d)).replace('h - 200 + 540', 'h - 199 + 540');
out = out.replace('/*@MAKECHART*/', () => chart.trim());
fs.writeFileSync(path.join(__dirname, '..', '..', 'newbiz-live.js'), out);
console.log('newbiz-live.js', out.length);
