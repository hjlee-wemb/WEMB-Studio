/* 꺾은선 차트
   · 평소   — 툴팁은 원본 자리에 가만히 있고, **데이터 층만** 흐르며 실시간처럼 보인다.
   · 마우스를 올리면 — 그때만 툴팁(기준선·표시점·말풍선)이 커서를 따라 좌우로 움직이고,
                       손을 떼면 원본 자리로 돌아간다.
   기존에는 툴팁이 2.6초마다 제멋대로 훑고 다녀서(hn-sweep) 가만히 볼 수가 없었다. */
const fs = require('fs');
const path = require('path');
const F = path.join(__dirname, '..', '..', 'hana-live.js');
let s = fs.readFileSync(F, 'utf8');
const CR = String.fromCharCode(13);
const NL = String.fromCharCode(10);
s = s.split(CR + NL).join(NL);
const put = (find, val) => { s = s.replace(find, () => val); };

if (s.indexOf('installChartHover') >= 0) { console.log('already patched'); process.exit(0); }

/* ── ① 자동으로 훑던 툴팁을 뗀다(데이터 층 흐름은 그대로) ── */
const OLD = [
  '    /* (2) 꺾은선 — 데이터 층이 흐르고 툴팁이 훑는다 */',
  '    var charts = all(root, \'[data-name="Line Chart"]\').map(function (ch) {',
  '      var data = one(ch, \'[data-name="Data"]\');',
  '      var tip = one(ch, \'[data-name="Tooltip"]\');',
  '      var plot = one(ch, \'[data-name="Plot"]\') || ch;',
  "      if (data) { data.classList.add('hn-flow'); data.style.transformOrigin = 'left bottom'; }",
  "      if (tip) tip.classList.add('hn-sweep');",
  '      return { data: data, tip: tip, plot: plot, x0: tip ? tip.offsetLeft : 0 };',
  '    }).filter(function (c) { return c.data || c.tip; });',
  '    if (charts.length) {',
  '      var chStep = function () {',
  '        if (editing()) return;',
  '        charts.forEach(function (c) {',
  "          if (c.data) c.data.style.transform = 'translateX(' + rnd(-6, 0).toFixed(1) + 'px) scaleY(' + rnd(0.97, 1.04).toFixed(3) + ')';",
  '          if (c.tip) {',
  '            var w = (c.plot.offsetWidth || 400);',
  "            c.tip.style.transform = 'translateX(' + rnd(-w * 0.34, w * 0.3).toFixed(0) + 'px)';",
  '          }',
  '        });',
  '      };',
  '      var cid = every(2600, chStep);',
  '      setTimeout(chStep, 800);',
  '      st.cleanup.push(function () {',
  '        clearInterval(cid);',
  "        charts.forEach(function (c) { if (c.data) c.data.style.transform = ''; if (c.tip) c.tip.style.transform = ''; });",
  '      });',
  '    }',
].join('\n');

const NEW = [
  '    /* (2) 꺾은선 — 데이터 층만 흐른다(실시간처럼).',
  '       툴팁은 여기서 건드리지 않는다 — 마우스를 올렸을 때만 움직인다(installChartHover). */',
  '    var charts = all(root, \'[data-name="Line Chart"]\').map(function (ch) {',
  '      var data = one(ch, \'[data-name="Data"]\');',
  '      if (!data) return null;',
  "      data.classList.add('hn-flow');",
  "      data.style.transformOrigin = 'left bottom';",
  '      return data;',
  '    }).filter(Boolean);',
  '    if (charts.length) {',
  '      var chStep = function () {',
  '        if (editing()) return;',
  '        charts.forEach(function (d) {',
  "          d.style.transform = 'translateX(' + rnd(-6, 0).toFixed(1) + 'px) scaleY(' + rnd(0.97, 1.04).toFixed(3) + ')';",
  '        });',
  '      };',
  '      var cid = every(2600, chStep);',
  '      setTimeout(chStep, 800);',
  '      st.cleanup.push(function () {',
  '        clearInterval(cid);',
  "        charts.forEach(function (d) { d.style.transform = ''; });",
  '      });',
  '    }',
].join('\n');

if (s.indexOf(OLD) < 0) { console.error('chart block anchor not found'); process.exit(1); }
put(OLD, NEW);

/* ── ② 마우스를 올렸을 때만 따라오는 툴팁 ── */
const INS = '  /* ══════════════════ 7. 설치 ══════════════════ */';
if (s.indexOf(INS) < 0) { console.error('install anchor not found'); process.exit(1); }
put(INS, [
  '  /* ══════════════════ 6-x. 꺾은선 툴팁 — 마우스를 올렸을 때만 따라온다 ══════════════════',
  '     평소에는 원본이 그려 둔 자리에 그대로 있다(가만히 있을 때의 그림은 Figma 와 같다).',
  '     차트 위에 마우스를 올리면 기준선이 커서 아래로 붙고, 손을 떼면 제자리로 돌아간다.',
  '     시안이 통째로 늘어나 있어도 손에 딱 붙도록, 움직인 화면 픽셀을 배치 좌표로 환산해서 옮긴다. */',
  '  function installChartHover(root, st) {',
  '    all(root, \'[data-name="Line Chart"]\').forEach(function (ch) {',
  '      var tip = one(ch, \'[data-name="Tooltip"]\');',
  '      if (!tip) return;',
  '      var plot = one(ch, \'[data-name="Plot"]\') || ch;',
  '      var guide = one(tip, \'[data-name="Guide Line"]\') || tip;',
  "      ch.classList.add('hn-chart');",
  '      var base = null;                       /* 원래 자리 — 손이 들어올 때 한 번만 잰다 */',
  '      var measure = function () {',
  '        var tr = tip.style.transition, keep = tip.style.transform;',
  "        tip.style.transition = 'none';       /* 제자리로 돌아가는 도중에 재면 값이 흔들린다 */",
  "        tip.style.transform = '';",
  '        var pr = plot.getBoundingClientRect();',
  '        var gr = guide.getBoundingClientRect();',
  '        tip.style.transform = keep;',
  '        void tip.offsetWidth;',
  '        tip.style.transition = tr;',
  '        if (!pr.width) return null;',
  '        return {',
  '          gx: gr.left + gr.width / 2,                    /* 기준선의 원래 화면 x */',
  '          k: pr.width / (plot.offsetWidth || pr.width),  /* 화면 픽셀 → 배치 좌표 */',
  '          l: pr.left, r: pr.right',
  '        };',
  '      };',
  '      var move = function (e) {',
  '        if (editing()) return;',
  '        if (!base) base = measure();',
  '        if (!base) return;',
  '        var x = Math.min(Math.max(e.clientX, base.l), base.r);',
  "        tip.style.transform = 'translateX(' + ((x - base.gx) / base.k).toFixed(1) + 'px)';",
  '      };',
  '      var enter = function () { base = null; };',
  "      var leave = function () { base = null; tip.style.transform = ''; };",
  "      ch.addEventListener('pointerenter', enter);",
  "      ch.addEventListener('pointermove', move);",
  "      ch.addEventListener('pointerleave', leave);",
  '      st.cleanup.push(function () {',
  "        ch.removeEventListener('pointerenter', enter);",
  "        ch.removeEventListener('pointermove', move);",
  "        ch.removeEventListener('pointerleave', leave);",
  "        ch.classList.remove('hn-chart');",
  "        tip.style.transform = '';",
  '      });',
  '    });',
  '  }',
  '',
  INS,
].join('\n'));

/* 설치 목록에 더한다 */
const CALL = '    try { installHanaMenu(root, st); } catch (e) { }';
if (s.indexOf(CALL) < 0) { console.error('install call anchor not found'); process.exit(1); }
put(CALL, CALL + '\n    try { installChartHover(root, st); } catch (e) { }');

/* ── ③ 스타일 — 훑던 전환은 빼고, 손을 따라올 때만 부드럽게 ── */
const CSS_OLD = "    '.hn-root .hn-sweep{transition:transform 2.2s cubic-bezier(.45,.1,.35,1);}',";
if (s.indexOf(CSS_OLD) < 0) { console.error('sweep css anchor not found'); process.exit(1); }
put(CSS_OLD, [
  "    /* 툴팁 — 커서를 따라올 때만 살짝 미끄러진다(평소에는 아예 움직이지 않는다) */",
  "    '.hn-root .hn-chart{cursor:crosshair;}',",
  "    '.hn-root .hn-chart [data-name=\"Tooltip\"]{transition:transform .12s cubic-bezier(.2,.7,.3,1);}',",
].join('\n'));

/* ── ④ 툴팁이 훑는다고 적힌 옛 설명을 지금 동작에 맞춘다 ── */
put('/* 꺾은선 데이터·툴팁 — 실시간처럼 부드럽게 흐른다 */',
  '/* 꺾은선 데이터 층 — 실시간처럼 부드럽게 흐른다 */');
put('· 꺾은선: 데이터 층이 아주 조금 옆으로 흐르고, 툴팁 표시가 가로로 훑는다',
  '· 꺾은선: 데이터 층이 아주 조금 옆으로 흐른다(툴팁은 마우스를 올렸을 때만 움직인다)');

fs.writeFileSync(F, s.split(NL).join(CR + NL));
console.log('patched: chart tooltip follows pointer only on hover');
