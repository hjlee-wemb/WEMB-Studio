/* 성능 TOP10 — 값이 들어오고, 막대가 차고 빠지고, 순위가 바뀐다.
   ─────────────────────────────────────────────────────────────────────────────
   · 숫자   : 호스트마다 원본 값에서 출발해 조금씩 흔들린다(31~99).
   · 막대   : 50칸짜리 네모 띠. 원본이 칸마다 다른 클래스를 쓰므로 **색을 직접 칠하지 않고**
              가운데 칸의 '켠 클래스'/'끈 클래스' 를 서로 바꿔 끼운다 → 라이트 테마도 그대로 따라온다.
              칸 수는 그 호스트의 원본 칸 수를 기준으로 값 변화만큼 움직인다(처음 그림은 Figma 그대로).
   · 순위   : 값으로 다시 줄 세우고, 줄이 바뀌면 FLIP 으로 미끄러뜨린 뒤 번호를 다시 매긴다.
   편집 중에는 멈춘다. */
const fs = require('fs');
const path = require('path');
const F = path.join(__dirname, '..', '..', 'hana-live.js');
let s = fs.readFileSync(F, 'utf8');
const CR = String.fromCharCode(13);
const NL = String.fromCharCode(10);
s = s.split(CR + NL).join(NL);
const put = (find, val) => { s = s.replace(find, () => val); };

if (s.indexOf('installRankList') >= 0) { console.log('already patched'); process.exit(0); }

/* ── ① 스타일 ── */
const CSS_ANCHOR = "    '.hn-root .hn-chart{cursor:crosshair;}',";
if (s.indexOf(CSS_ANCHOR) < 0) { console.error('css anchor not found'); process.exit(1); }
put(CSS_ANCHOR, [
  '    /* 성능 순위표 — 막대 칸은 색이 스미듯 차고 빠지고, 줄은 자리를 옮길 때만 미끄러진다 */',
  "    '.hn-root .hn-bar-live{transition:background-color .5s cubic-bezier(.4,.1,.3,1);}',",
  '    /* 자리 옮김은 WAAPI 로만 그린다(요소 스타일은 그대로) — 여기선 준비만 알려 준다 */',
  "    '.hn-root .hn-rank-row{will-change:transform;}',",
  CSS_ANCHOR,
].join('\n'));

/* ── ② 설치 함수 ── */
const INS = '  /* ══════════════════ 7. 설치 ══════════════════ */';
if (s.indexOf(INS) < 0) { console.error('install anchor not found'); process.exit(1); }

put(INS, [
  '  /* ══════════════════ 6-y. 성능 순위표 — 값·막대·순위가 살아 움직인다 ══════════════════ */',
  '  function installRankList(root, st) {',
  '    all(root, \'[data-name="List"]\').forEach(function (list) {',
  '      var rows = [].filter.call(list.children, function (c) {',
  "        return c.dataset && /^Item\\/Rank/.test(c.dataset.name || '');",
  '      });',
  '      if (rows.length < 3) return;',
  '',
  '      var hosts = rows.map(function (row) {',
  '        var obj = one(row, \'[data-name="obj"]\');',
  '        var sq = obj ? [].slice.call(obj.children) : [];',
  '        var numP = one(row, \'[data-name="value"] p\') || one(row, \'[data-name="Value"] p\');',
  '        var badge = one(row, \'[data-name="num"] p\');',
  '        if (!sq.length || !numP) return null;',
  '        var v0 = parseFloat((numP.textContent || \'\').replace(/[^\\d.]/g, \'\'));',
  '        if (!isFinite(v0)) return null;',
  '        /* 원본에서 켜져 있는 칸 수 — 색이 첫 칸과 같은 칸을 앞에서부터 센다 */',
  '        var onCol = getComputedStyle(sq[0]).backgroundColor;',
  '        var on0 = 0;',
  '        while (on0 < sq.length && getComputedStyle(sq[on0]).backgroundColor === onCol) on0++;',
  '        if (on0 < 2 || on0 > sq.length - 2) return null;   /* 앞뒤 한 칸은 모서리라 손대지 않는다 */',
  "        sq.forEach(function (x) { x.classList.add('hn-bar-live'); });",
  "        row.classList.add('hn-rank-row');",
  '        return {',
  '          row: row, sq: sq, numP: numP, badge: badge,',
  '          onCls: sq[1].className, offCls: sq[sq.length - 2].className,',
  '          v0: v0, v: v0, on0: on0, on: on0, txt0: numP.textContent',
  '        };',
  '      }).filter(Boolean);',
  '      if (hosts.length < 3) return;',
  '',
  '      var N = hosts[0].sq.length;',
  '      /* 값→칸수 자 — 원본 10줄이 그려 둔 (값, 칸수) 를 그대로 쓴다.',
  '         원본 대응이 정비례가 아니어서(96→42, 44→17, 가운데는 완만) 호스트마다 따로 재면',
  '         아래 줄 막대가 위 줄보다 길어지는 일이 생긴다 → 열 점을 이은 한 개의 자로 통일한다.',
  '         처음에는 각자 제 값이 들어가므로 첫 그림은 Figma 그대로다. */',
  '      var LADDER = hosts.map(function (h) { return { v: h.v0, on: h.on0 }; })',
  '        .sort(function (a, b) { return a.v - b.v; });',
  '      var fillFor = function (h) {',
  '        var v = h.v, L = LADDER, n;',
  '        if (v <= L[0].v) {',
  '          var s0 = (L[1].on - L[0].on) / Math.max(1e-6, L[1].v - L[0].v);',
  '          n = L[0].on + (v - L[0].v) * s0;',
  '        } else if (v >= L[L.length - 1].v) {',
  '          var e = L.length - 1;',
  '          var s1 = (L[e].on - L[e - 1].on) / Math.max(1e-6, L[e].v - L[e - 1].v);',
  '          n = L[e].on + (v - L[e].v) * s1;',
  '        } else {',
  '          for (var i = 1; i < L.length; i++) {',
  '            if (v <= L[i].v) {',
  '              var t = (v - L[i - 1].v) / Math.max(1e-6, L[i].v - L[i - 1].v);',
  '              n = L[i - 1].on + t * (L[i].on - L[i - 1].on);',
  '              break;',
  '            }',
  '          }',
  '        }',
  '        return Math.max(1, Math.min(N - 1, Math.round(n)));',
  '      };',
  '      var paintBar = function (h, n) {',
  '        if (n === h.on) return;',
  '        h.on = n;',
  '        for (var i = 1; i < h.sq.length - 1; i++) {',
  '          var want = i < n ? h.onCls : h.offCls;',
  '          if (h.sq[i].className !== want) h.sq[i].className = want;',
  '        }',
  '      };',
  '',
  '      var step = function () {',
  '        if (editing()) return;',
  '        hosts.forEach(function (h) {',
  '          var d = rnd(-3.4, 3.4);',
  '          if (Math.random() < 0.12) d = rnd(-9, 9);      /* 가끔 크게 튀어야 순위가 바뀐다 */',
  '          h.v = Math.max(31, Math.min(99, h.v + d));',
  '        });',
  '        var order = hosts.slice().sort(function (a, b) { return b.v - a.v; });',
  '        var moved = order.some(function (h, i) { return h.row !== list.children[i]; });',
  '        var before = moved ? hosts.map(function (h) { return h.row.getBoundingClientRect().top; }) : null;',
  '        if (moved) order.forEach(function (h) { list.appendChild(h.row); });',
  '',
  '        order.forEach(function (h, i) {',
  '          var v = Math.round(h.v);',
  '          if (h.numP.textContent !== String(v)) h.numP.textContent = String(v);',
  '          paintBar(h, fillFor(h));',
  '          if (h.badge && h.badge.textContent !== String(i + 1)) {',
  '            h.badge.textContent = String(i + 1);',
  '            if (h.badge.animate) {',
  '              try {',
  "                h.badge.animate([{ opacity: 1 }, { opacity: .3 }, { opacity: 1 }],",
  "                  { duration: 520, easing: 'ease-out', fill: 'none' });",
  '              } catch (e) { }',
  '            }',
  '          }',
  '        });',
  '',
  '        if (!moved) return;',
  '        /* FLIP — 옮겨 간 만큼 되돌려 놓고 제자리로 미끄러뜨린다.',
  '           **자리 자체는 애니메이션에 기대지 않는다** — 요소 스타일은 건드리지 않고 WAAPI 로만 그린다.',
  '           (인라인 transform 으로 하면 전환이 중간에 끊긴 화면에서 줄이 옛 자리에 얼어붙는다.',
  '            실제로 스튜디오 안에서 줄들이 원래 칸에 멈춰 순위가 뒤죽박죽으로 보였다.)',
  '           시안이 축소돼 있어도 눈에 맞게 화면 픽셀을 배치 좌표로 환산한다. */',
  '        var lb = list.getBoundingClientRect();',
  '        var k = (lb.width / (list.offsetWidth || lb.width)) || 1;',
  '        hosts.forEach(function (h, i) {',
  '          var dy = (before[i] - h.row.getBoundingClientRect().top) / k;',
  '          if (Math.abs(dy) < 0.5 || !h.row.animate) return;',
  '          if (h.anim) { try { h.anim.cancel(); } catch (e) { } }',
  '          try {',
  '            h.anim = h.row.animate(',
  "              [{ transform: 'translateY(' + dy.toFixed(1) + 'px)' }, { transform: 'none' }],",
  "              { duration: 520, easing: 'cubic-bezier(.22,.9,.24,1)', fill: 'none' });",
  '          } catch (e) { }',
  '        });',
  '      };',
  '',
  '      var id = every(2000, step);',
  '      setTimeout(step, 900);',
  '      st.cleanup.push(function () {',
  '        clearInterval(id);',
  '        hosts.forEach(function (h) {',
  '          if (h.anim) { try { h.anim.cancel(); } catch (e) { } }',
  "          h.row.classList.remove('hn-rank-row');",
  '          h.numP.textContent = h.txt0;',
  '          paintBar(h, h.on0);',
  "          h.sq.forEach(function (x) { x.classList.remove('hn-bar-live'); });",
  '        });',
  '      });',
  '    });',
  '  }',
  '',
  INS,
].join('\n'));

/* ── ③ 설치 목록 ── */
const CALL = '    try { installChartHover(root, st); } catch (e) { }';
if (s.indexOf(CALL) < 0) { console.error('install call anchor not found'); process.exit(1); }
put(CALL, CALL + '\n    try { installRankList(root, st); } catch (e) { }');

fs.writeFileSync(F, s.split(NL).join(CR + NL));
console.log('patched: performance top-10 list is live (values, bars, re-ranking)');
