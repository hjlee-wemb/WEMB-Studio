/* live-src.js + 공장 전력설비 라이브의 검증된 차트 부품(스타일 · makeChart) → src/fems-live.js
   차트 부품은 src/plant-live.js 에서 그대로 떠 온다(이름표 pf- → wn-). 실행: node mk-live.js
   테마 방향이 반대다: 공장 시안은 다크가 기본이고 라이트가 덧씌움 → 이 시안은 라이트가 기본.
   그래서 공장의 '라이트' 규칙을 '다크가 아닐 때'로 옮긴다(.wn-root:not([data-theme="dark"])). */
'use strict';
const fs = require('fs'), path = require('path');
const SRC = fs.readFileSync(path.join(__dirname, '..', '..', 'plant-live.js'), 'utf8').replace(/\r\n/g, '\n');
let out = fs.readFileSync(path.join(__dirname, 'live-src.js'), 'utf8').replace(/\r\n/g, '\n');
const rn = (s) => s.replace(/pf-/g, 'fe-').replace(/pfc'/g, "fec'").replace(/pfg/g, 'feg').replace(/pfIn/g, 'feChartIn');
const isChart = (l) => /^\s*'/.test(l) && /pf-chart|pf-chartmenu|pf-chartbtn|@keyframes pfIn/.test(l);
const css = SRC.split('\n').filter((l) => isChart(l) && !/data-theme="light"/.test(l));
css.forEach((l) => { if (!/,\s*$/.test(l)) throw new Error('이어진 줄: ' + l.slice(0, 80)); });
const lightCss = SRC.split('\n').filter((l) => isChart(l) && /data-theme="light"/.test(l) && /,\s*$/.test(l))
  .map((l) => l.split('.pf-root[data-theme="light"]').join('.pf-root:not([data-theme="dark"])'));
out = out.replace('/*@CHART_CSS*/', () => css.concat(lightCss).map((l) => rn(l.trim())).join('\n    '));
const a = SRC.indexOf('  var KIND_ICON = {'), b = SRC.indexOf('  var chartUid = 0;'), c = SRC.indexOf('  function syncChartHue(root, probe) {'), d = SRC.indexOf('  function installChartSwap(root, st) {');
if (a < 0 || b < 0 || c < 0 || d < 0) throw new Error('표지 없음');
/* 색 맞춤 기준 색상각 — 이 시안의 주조색(#009dff, 203°) */
const chart = rn(SRC.slice(a, b)) + '  var chartUid = 0;\n' + rn(SRC.slice(c, d)).replace('h - 200 + 540', 'h - 203 + 540');
/* 시간 축 — 이 시안의 차트 칸은 좁다(주간 발전량 카드 ≈ 190px). 시:분:초 4개가 겹쳐서, 폭이 모자라면 시:분 3개 → 2개로 줄인다 */
const TL_FROM = "        for (var tl = 0; tl < 4; tl++) {\n          var tx = L + (w - L - R) * (tl + 0.5) / 4;\n          var tt = new Date(d0.getTime() - (3 - tl) * (N / 4) * STEP);\n          s += '<text class=\"ax\" x=\"' + tx.toFixed(1) + '\" y=\"' + (h - 1) + '\" text-anchor=\"middle\">' + p2(tt.getHours()) + ':' + p2(tt.getMinutes()) + ':' + p2(tt.getSeconds()) + '</text>';";
const TL_TO = "        var cw = w - L - R, NT = cw > 300 ? 4 : cw > 150 ? 3 : 2, SEC = cw > 300;\n        for (var tl = 0; tl < NT; tl++) {\n          var tx = L + cw * (tl + 0.5) / NT;\n          var tt = new Date(d0.getTime() - (NT - 1 - tl) * (N / NT) * STEP);\n          s += '<text class=\"ax\" x=\"' + tx.toFixed(1) + '\" y=\"' + (h - 1) + '\" text-anchor=\"middle\">' + p2(tt.getHours()) + ':' + p2(tt.getMinutes()) + (SEC ? ':' + p2(tt.getSeconds()) : '') + '</text>';";
const chart2 = chart.split(TL_FROM);
if (chart2.length < 2) throw new Error('시간 축 표지 없음');
out = out.replace('/*@MAKECHART*/', () => chart2.join(TL_TO).trim());
if (/pf-|pfc|pfg/.test(out)) throw new Error('pf 흔적이 남았다');
fs.writeFileSync(path.join(__dirname, '..', '..', 'fems-live.js'), out);
console.log('fems-live.js', out.length, '· 차트 규칙', css.length, '+ 라이트', lightCss.length);
