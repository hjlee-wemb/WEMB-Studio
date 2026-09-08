/* 구간별 성능현황의 실린더 게이지
   ① 원판이 중력 있게 떨어져 착지하며 살짝 눌렸다 펴진다(스쿼시·바운스).
   ② 옆 숫자(Count)가 바뀌면 쌓인 원판 수도 따라 바뀐다 — 줄면 위 칸이 사그라들고, 늘면 그만큼 새로 떨어진다.
   (conv.js 가 이 실린더를 인라인 <svg> 로 심어 두어야 안쪽 <g id="Disk…"> 를 만질 수 있다 — patch-inline-gauge.js)

   같이 고치는 것: 라이브로 값이 바뀌는 숫자는 줄바꿈되지 않게 한다.
   #hno2-Value_39(거래건수 55,045,697)는 상자 폭이 Figma 값(271px)으로 박혀 있어서
   값이 조금만 길어져도 아랫줄로 흘러내렸다 → 그 숫자들만 nowrap. */
const fs = require('fs');
const path = require('path');
const F = path.join(__dirname, '..', '..', 'hana-live.js');
let s = fs.readFileSync(F, 'utf8');
/* 이 파일은 CRLF 와 LF 가 섞여 있다(한진에서 가져온 뒤 패치로 LF 줄이 끼었다).
   다룰 때는 LF 로 펴고, 쓸 때 CRLF 로 통일한다 — 여러 줄 앵커가 어긋나지 않게. */
const CR = String.fromCharCode(13);
const NL = String.fromCharCode(10);
s = s.split(CR + NL).join(NL);
/* 치환 문자열에 `$&` 같은 특수 패턴이 들어 있으면 String.replace 가 그걸 '찾은 문자열'로 바꿔 버린다
   → 항상 함수 치환자로 넣는다(이 실수로 conv.js 가 한 번 깨졌다). */
const put = (find, val) => { s = s.replace(find, () => val); };

if (s.indexOf('hnDisk') >= 0) { console.log('already patched'); process.exit(0); }

/* ── ① 스타일 ── */
const A = "    '@media (prefers-reduced-motion:reduce)";
if (s.indexOf(A) < 0) { console.error('style anchor not found'); process.exit(1); }
put(A, [
  "    /* ── 실린더 게이지 — 원판이 위에서 떨어져 쌓인다 ──",
  "       가속해서 내려오다(ease-in) 바닥에서 눌리고(scaleY .84) 한 번 튕긴 뒤 가라앉는다.",
  "       transform-origin 은 각 원판 자신의 아래쪽(fill-box) — 위 칸까지 같이 눌리지 않게. */",
  "    '@keyframes hnDisk{'",
  "    + '0%{transform:translateY(-26px) scaleY(1);opacity:0;animation-timing-function:cubic-bezier(.5,0,.75,0)}'",
  "    + '12%{opacity:1;animation-timing-function:cubic-bezier(.5,0,.75,0)}'",
  "    + '56%{transform:translateY(0) scaleY(.84);animation-timing-function:cubic-bezier(.15,.75,.4,1)}'",
  "    + '70%{transform:translateY(-4.5px) scaleY(1.05);animation-timing-function:cubic-bezier(.5,0,.75,0)}'",
  "    + '84%{transform:translateY(0) scaleY(.94);animation-timing-function:cubic-bezier(.15,.75,.4,1)}'",
  "    + '93%{transform:translateY(-1.4px) scaleY(1.02)}'",
  "    + '100%{transform:translateY(0) scaleY(1);opacity:1}}',",
  "    /* 칸 수가 그대로일 때 — **맨 위 칸 하나만** 톡 하고 다시 앉는다('데이터가 들어왔다'는 표시).",
  "       투명도는 건드리지 않는다: 사라졌다 나타나면 깜빡임처럼 보인다. */",
  "    '@keyframes hnDiskRe{'",
  "    + '0%{transform:translateY(-10px) scaleY(1);animation-timing-function:cubic-bezier(.5,0,.75,0)}'",
  "    + '50%{transform:translateY(0) scaleY(.88);animation-timing-function:cubic-bezier(.15,.75,.4,1)}'",
  "    + '68%{transform:translateY(-2.6px) scaleY(1.03);animation-timing-function:cubic-bezier(.5,0,.75,0)}'",
  "    + '85%{transform:translateY(0) scaleY(.96);animation-timing-function:cubic-bezier(.15,.75,.4,1)}'",
  "    + '94%{transform:translateY(-0.8px) scaleY(1.01)}'",
  "    + '100%{transform:translateY(0) scaleY(1)}}',",
  "    /* 값이 줄어 사라지는 칸 — 제자리에서 사그라든다 */",
  "    '@keyframes hnDiskOut{0%{opacity:1;transform:scaleY(1)}100%{opacity:0;transform:translateY(3px) scaleY(.55)}}',",
  "    '.hn-root .hn-cyl g[id^=\"Disk\"]{transform-origin:50% 100%;transform-box:fill-box;}',",
  "    '.hn-root .hn-cyl g[id^=\"Disk\"].hn-fall{animation:hnDisk .62s both;animation-delay:calc(var(--hn-i,0) * 70ms);}',",
  "    '.hn-root .hn-cyl g[id^=\"Disk\"].hn-refall{animation:hnDiskRe .5s both;animation-delay:calc(var(--hn-i,0) * 55ms);}',",
  "    '.hn-root .hn-cyl g[id^=\"Disk\"].hn-fade{animation:hnDiskOut .34s cubic-bezier(.5,0,.75,0) both;}',",
  "    '.hn-root .hn-cyl g[id^=\"Disk\"].hn-hide{opacity:0;}',",
  "    /* 라이브로 바뀌는 숫자 — 값이 길어져도 아랫줄로 흘러내리지 않게(상자 폭은 Figma 값 그대로) */",
  "    '.hn-root .hn-num{white-space:nowrap;}',",
  A,
].join('\n'));

/* ── ② 숫자에 nowrap 클래스 ── */
const B = [
  '      seen.push(p);',
  '      nums.push({ el: p, base: v, cur: v, src: p.textContent });',
].join('\n');
if (s.indexOf(B) < 0) { console.error('nums anchor not found'); process.exit(1); }
put(B, [
  '      seen.push(p);',
  "      p.classList.add('hn-num');",
  '      nums.push({ el: p, base: v, cur: v, src: p.textContent });',
].join('\n'));

const B2 = "      st.cleanup.push(function () { clearInterval(nid); nums.forEach(function (c) { c.el.textContent = c.src; }); });";
if (s.indexOf(B2) < 0) { console.error('nums cleanup anchor not found'); process.exit(1); }
put(B2, "      st.cleanup.push(function () { clearInterval(nid); nums.forEach(function (c) { c.el.textContent = c.src; c.el.classList.remove('hn-num'); }); });");

/* ── ③ 실린더 연출 교체 ── */
const lines = s.split('\n');
const a = lines.findIndex((l) => l.includes('/* (5) 실린더 게이지(종합현황)'));
if (a < 0) { console.error('cylinder block not found'); process.exit(1); }
let b = a;
while (b < lines.length && lines[b] !== '  }') b++;   /* installHanaLive 를 닫는 2칸 들여쓴 } */
const NEW = [
  '    /* (5) 실린더 게이지(구간별 성능현황) — 원판이 위에서 떨어져 쌓이고, 옆 숫자를 따라 개수가 바뀐다.',
  '       실린더는 인라인 <svg> 라 원판(<g id="Disk…">) 하나하나가 DOM 이다(conv.js 의 INLINE_SVG).',
  '       형상·색은 원본 그대로고, 떨어지고 사그라드는 동안만 위치·투명도·세로 눌림이 오간다.',
  '       가만히 있을 때는 원판이 전부 보이는 원본 그림 그대로다. */',
  "    var cyls = all(root, '[data-name^=\"Gauge/\"]').map(function (g) {",
  "      var svg = one(g, 'svg');",
  '      if (!svg) return null;',
  "      var disks = all(svg, 'g[id^=\"Disk\"]');",
  '      if (!disks.length) return null;',
  "      svg.classList.add('hn-cyl');",
  "      var cnt = one(g, '[data-name=\"Count\"]');",
  "      if (cnt && cnt.tagName !== 'P') cnt = one(cnt, 'p') || cnt;",
  '      var base = cnt ? numOf(cnt.textContent) : null;',
  '      /* 이 게이지에 딸린 숫자 전부 — 개수·TPS·응답시간. 어느 하나라도 바뀌면 원판이 다시 떨어진다. */',
  "      var nums = ['Count', 'TPS Value', 'Response Value'].map(function (nm) {",
  "        var el = one(g, '[data-name=\"' + nm + '\"]');",
  "        return el && el.tagName !== 'P' ? (one(el, 'p') || el) : el;",
  '      }).filter(Boolean);',
  '      return {',
  '        svg: svg, disks: disks, n: disks.length, shown: disks.length,',
  '        cnt: cnt, base: base, nums: nums, sig: null, dirty: false,',
  '        /* 숫자가 흔들리는 폭 — installHanaLive 의 수치 연출과 같은 기준(±3.5%, 최소 1) */',
  '        span: base == null ? null : Math.max(Math.abs(base) * 0.035, 1),',
  '      };',
  '    }).filter(Boolean);',
  '',
  '    if (cyls.length) {',
  '      /* 보이는 칸 수를 정한다.',
  '         cascade(첫 진입) 면 빈 실린더에 전부 쏟아붓고,',
  '         그 뒤로는 **맨 위 칸만** 만진다 — 늘면 그만큼 새로 얹히고, 줄면 위에서부터 사그라든다.',
  '         칸 수가 그대로면 맨 위 칸 하나만 톡 하고 다시 앉아 데이터가 들어온 걸 알린다. */',
  '      var setShown = function (c, want, cascade) {',
  '        var n = Math.max(1, Math.min(c.n, want));',
  '        var prev = c.shown;',
  '        c.shown = n;',
  "        c.disks.forEach(function (d) { d.classList.remove('hn-fall', 'hn-refall', 'hn-fade'); });",
  '        void c.svg.getBoundingClientRect();      /* 애니메이션을 처음부터 다시 재생시키려고 한 번 재게 한다 */',
  '        c.disks.forEach(function (d, i) {',
  '          if (i < n) {',
  "            d.classList.remove('hn-hide');",
  '            if (cascade) {                       /* 첫 진입 — 아래부터 차례로 다 떨어진다 */',
  "              d.style.setProperty('--hn-i', i);",
  "              d.classList.add('hn-fall');",
  '            } else if (i >= prev) {              /* 새로 얹히는 맨 위 칸들만 */',
  "              d.style.setProperty('--hn-i', i - prev);",
  "              d.classList.add('hn-fall');",
  '            }',
  '          } else {',
  "            if (i < prev) d.classList.add('hn-fade');   /* 위에서부터 사그라드는 칸 */",
  "            d.classList.add('hn-hide');",
  '          }',
  '        });',
  '        /* 칸 수가 그대로면 맨 위 칸 하나만 다시 앉힌다 */',
  '        if (!cascade && n === prev) {',
  '          var top = c.disks[n - 1];',
  "          if (top) { top.style.setProperty('--hn-i', 0); top.classList.add('hn-refall'); }",
  '        }',
  '      };',
  '      /* 처음 한 번 — 왼쪽 게이지부터 촥촥 이어서 쏟아진다(빈 실린더에 차오르는 연출) */',
  '      var cascadeAll = function () {',
  '        if (editing()) return;',
  "        cyls.forEach(function (c, k) { setTimeout(function () { c.shown = 0; setShown(c, c.n, true); }, k * 85); });",
  '      };',
  '      /* 이 게이지에 딸린 숫자(개수·TPS·응답시간) 중 하나라도 바뀌면 원판을 다시 떨어뜨린다.',
  '         값이 흐르는 동안(tween)에는 글자가 매 프레임 달라지므로, **멎은 뒤 한 번만** 친다',
  '         — 바뀌는 중이면 dirty 로만 표시해 두고, 다음 번에 같은 값이면 그때 떨어뜨린다.',
  '         쌓인 칸 수는 개수 값이 기준보다 내려간 만큼 비우되, 비우는 최대 칸 수는',
  '         그 실린더가 가진 칸 수에 비례한다(8칸이면 3 · 6칸이면 2 · 2~3칸이면 1).',
  '         칸이 적은 실린더까지 같은 수만큼 비우면 절반이 사라져 원본과 너무 달라 보인다. */',
  '      var sigOf = function (c) {',
  "        return c.nums.map(function (el) { return el.textContent; }).join('|');",
  '      };',
  '      var syncToNumbers = function () {',
  '        if (editing()) return;',
  '        cyls.forEach(function (c) {',
  '          if (!c.nums.length) return;',
  '          var sig = sigOf(c);',
  '          if (sig !== c.sig) { c.sig = sig; c.dirty = true; return; }   /* 아직 값이 흐르는 중 */',
  '          if (!c.dirty) return;',
  '          c.dirty = false;',
  '          var want = c.n;',
  '          if (c.cnt && c.base != null) {',
  '            var cur = numOf(c.cnt.textContent);',
  '            if (cur != null) {',
  '              var ratio = Math.max(0, Math.min(1, (c.base - cur) / c.span));   /* 0(기준 이상) ~ 1(가장 많이 내려감) */',
  '              var maxDown = Math.max(1, Math.round(c.n * 0.34));               /* 8→3 · 6→2 · 3→1 · 2→1 */',
  '              want = c.n - Math.round(ratio * maxDown);',
  '            }',
  '          }',
  '          /* 첫 진입이 아니므로 cascade 는 끈다 — 맨 위 칸만 움직인다.',
  '             늘면 새 칸이 얹히고, 줄면 위에서부터 사그라들고, 그대로면 맨 위 칸만 다시 앉는다. */',
  '          setShown(c, want, false);',
  '        });',
  '      };',
  '      setTimeout(cascadeAll, 260);',
  '      var did = every(600, syncToNumbers);',
  '      st.cleanup.push(function () {',
  '        clearInterval(did);',
  '        cyls.forEach(function (c) {',
  "          c.svg.classList.remove('hn-cyl');",
  '          c.disks.forEach(function (d) {',
  "            d.classList.remove('hn-fall', 'hn-refall', 'hn-fade', 'hn-hide');",
  "            d.style.removeProperty('--hn-i');",
  '          });',
  '        });',
  '      });',
  '    }',
];
lines.splice(a, b - a, ...NEW);
s = lines.join('\n');

fs.writeFileSync(F, s.split(NL).join(CR + NL));
console.log('patched: disk drop (gravity + count-linked) + nowrap numbers');
