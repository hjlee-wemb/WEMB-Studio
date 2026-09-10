/* 팝업 닫기 — 상면관리의 자산 상세 팝업(#hnf-Popup/Asset Detail).
   ─────────────────────────────────────────────────────────────────────────────
   · 닫기 단추(Button/Close)를 누르면 살짝 작아지며 사라진다. Esc 로도 닫힌다.
   · 다 사라진 뒤에는 display:none 으로 빼서 뒤에 있는 도면을 가리지 않게 한다.
   · 한 번 닫으면 되돌릴 길이 없으면 곤란하므로, 위치 트리의 층·방을 누르면 다시 열린다
     (그 자리에서 자산 상세를 다시 부르는 것이 이 화면의 자연스러운 동선이다).
   · 팝업에는 원본이 가운데 정렬용 transform(translate(-50%,-50%))을 걸어 뒀다.
     그래서 transform 을 덮지 않고 **CSS scale·opacity 속성**으로만 움직인다.
   · 편집 중(패널편집)에는 글자를 고치려다 닫히면 안 되므로 동작하지 않는다. */
const fs = require('fs');
const path = require('path');
const F = path.join(__dirname, '..', '..', 'hana-live.js');
let s = fs.readFileSync(F, 'utf8');
const CR = String.fromCharCode(13);
const NL = String.fromCharCode(10);
s = s.split(CR + NL).join(NL);
const put = (find, val) => { s = s.replace(find, () => val); };

if (s.indexOf('installPopupClose') >= 0) { console.log('already patched'); process.exit(0); }

/* ── ① 스타일 ── */
const CSS_ANCHOR = "    '.hn-root .hn-bar-live{transition:background-color .5s cubic-bezier(.4,.1,.3,1);}',";
if (s.indexOf(CSS_ANCHOR) < 0) { console.error('css anchor not found'); process.exit(1); }
put(CSS_ANCHOR, [
  CSS_ANCHOR,
  '    /* 팝업 — transform 은 원본(가운데 정렬)이 쓰므로 건드리지 않고 scale·opacity 로만 여닫는다 */',
  "    '.hn-root .hn-popup{transition:opacity .2s ease,scale .22s cubic-bezier(.32,.72,.36,1);'",
  "    + 'will-change:opacity,scale;transform-origin:center;}',",
  "    '.hn-root .hn-popup.hn-popup-out{opacity:0;scale:.975;pointer-events:none;}',",
  "    '.hn-root .hn-popup.hn-popup-gone{display:none!important;}',",
  '    /* 닫기 단추는 올리면 또렷해진다(자리·크기는 원본 그대로) */',
  "    '.hn-root .hn-close{cursor:pointer;transition:opacity .16s ease,scale .16s ease;}',",
  "    '.hn-root .hn-close:hover{opacity:1;scale:1.12;}',",
  "    '.hn-root .hn-popup-open{cursor:pointer;}',",
].join('\n'));

/* ── ② 설치 함수 ── */
const INS = '  /* ══════════════════ 7. 설치 ══════════════════ */';
if (s.indexOf(INS) < 0) { console.error('install anchor not found'); process.exit(1); }

put(INS, [
  '  /* ══════════════════ 6-w. 팝업 닫기 — 닫기 단추·Esc, 위치 트리로 다시 열기 ══════════════════ */',
  '  function installPopupClose(root, st) {',
  '    all(root, \'[data-name^="Popup"]\').forEach(function (pop) {',
  '      var btn = one(pop, \'[data-name="Button/Close"]\')',
  '        || one(pop, \'[data-name^="Icon/Action/Close"]\');',
  '      if (!btn) return;',
  "      pop.classList.add('hn-popup');",
  "      btn.classList.add('hn-close');",
  '      var timer = null;',
  '',
  '      var close = function () {',
  '        if (editing()) return;',
  '        if (timer) { clearTimeout(timer); timer = null; }',
  "        pop.classList.add('hn-popup-out');",
  "        timer = setTimeout(function () { pop.classList.add('hn-popup-gone'); timer = null; }, 260);",
  '      };',
  '      var open = function () {',
  '        if (editing()) return;',
  "        if (!pop.classList.contains('hn-popup-gone') && !pop.classList.contains('hn-popup-out')) return;",
  '        if (timer) { clearTimeout(timer); timer = null; }',
  "        pop.classList.remove('hn-popup-gone');",
  '        void pop.getBoundingClientRect();                 /* 자리를 잡은 뒤에 스며들게 한다 */',
  "        pop.classList.remove('hn-popup-out');",
  '      };',
  '',
  '      var onBtn = function (e) { e.stopPropagation(); close(); };',
  "      btn.addEventListener('click', onBtn);",
  '      var onKey = function (e) {',
  "        if (e.key !== 'Escape') return;",
  "        if (pop.classList.contains('hn-popup-gone')) return;",
  '        close();',
  '      };',
  "      document.addEventListener('keydown', onKey);",
  '',
  '      /* 다시 열기 — 위치 트리의 층·방을 누르면 그 자산 상세가 돌아온다 */',
  '      var openers = all(root, \'[data-name^="Node/Level"]\');',
  '      openers.forEach(function (o) {',
  "        o.classList.add('hn-popup-open');",
  "        o.addEventListener('click', open);",
  '      });',
  '',
  '      st.cleanup.push(function () {',
  '        if (timer) clearTimeout(timer);',
  "        btn.removeEventListener('click', onBtn);",
  "        document.removeEventListener('keydown', onKey);",
  '        openers.forEach(function (o) {',
  "          o.classList.remove('hn-popup-open');",
  "          o.removeEventListener('click', open);",
  '        });',
  "        btn.classList.remove('hn-close');",
  "        pop.classList.remove('hn-popup', 'hn-popup-out', 'hn-popup-gone');",
  '      });',
  '    });',
  '  }',
  '',
  INS,
].join('\n'));

/* ── ③ 설치 목록 ── */
const CALL = '    try { installRankList(root, st); } catch (e) { }';
if (s.indexOf(CALL) < 0) { console.error('install call anchor not found'); process.exit(1); }
put(CALL, CALL + '\n    try { installPopupClose(root, st); } catch (e) { }');

fs.writeFileSync(F, s.split(NL).join(CR + NL));
console.log('patched: popup close button (+ Esc, reopen from location tree)');
