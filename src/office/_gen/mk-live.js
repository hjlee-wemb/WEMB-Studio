/* live-src.js + 공장 전력설비 라이브의 검증된 차트 부품(스타일 · makeChart) → src/office-live.js
   차트 부품은 src/plant-live.js 에서 그대로 떠 온다(이름표 pf- → of-). 실행: node mk-live.js
   테마 방향: 공장 시안은 다크가 기본 → 이 시안은 라이트가 기본이라 '라이트' 규칙을 '다크가 아닐 때'로 옮긴다. */
'use strict';
const fs = require('fs'), path = require('path');
const SRC = fs.readFileSync(path.join(__dirname, '..', '..', 'plant-live.js'), 'utf8').replace(/\r\n/g, '\n');
let out = fs.readFileSync(path.join(__dirname, 'live-src.js'), 'utf8').replace(/\r\n/g, '\n');
const rn = (s) => s.replace(/pf-/g, 'of-').replace(/pfc'/g, "ofc'").replace(/pfg/g, 'ofg').replace(/pfIn/g, 'ofChartIn');
const isChart = (l) => /^\s*'/.test(l) && /pf-chart|pf-chartmenu|pf-chartbtn|@keyframes pfIn/.test(l);
const css = SRC.split('\n').filter((l) => isChart(l) && !/data-theme="light"/.test(l));
css.forEach((l) => { if (!/,\s*$/.test(l)) throw new Error('이어진 줄: ' + l.slice(0, 80)); });
const lightCss = SRC.split('\n').filter((l) => isChart(l) && /data-theme="light"/.test(l) && /,\s*$/.test(l))
  .map((l) => l.split('.pf-root[data-theme="light"]').join('.pf-root:not([data-theme="dark"])'));
out = out.replace('/*@CHART_CSS*/', () => css.concat(lightCss).map((l) => rn(l.trim())).join('\n    '));
const a = SRC.indexOf('  var KIND_ICON = {'), b = SRC.indexOf('  var chartUid = 0;'), c = SRC.indexOf('  function syncChartHue(root, probe) {'), d = SRC.indexOf('  function installChartSwap(root, st) {');
if (a < 0 || b < 0 || c < 0 || d < 0) throw new Error('표지 없음');
/* 색 맞춤 기준 색상각 — 이 시안의 주조색(#657aff, 232°) */
const chart = rn(SRC.slice(a, b)) + '  var chartUid = 0;\n' + rn(SRC.slice(c, d)).replace('h - 200 + 540', 'h - 232 + 540');
out = out.replace('/*@MAKECHART*/', () => chart.trim());
const scenes = {};
JSON.parse(fs.readFileSync(path.join(__dirname, 'screens.json'), 'utf8')).forEach((r) => { scenes[r[2]] = r[4]; });
out = out.replace('/*@SCENES*/{}', () => JSON.stringify(scenes));
if (/pf-|pfc|pfg/.test(out)) throw new Error('pf 흔적이 남았다');
fs.writeFileSync(path.join(__dirname, '..', '..', 'office-live.js'), out);
console.log('office-live.js', out.length, '· 차트 규칙', css.length, '+ 라이트', lightCss.length);
