/* ════════════════════════════════════════════════════════════════════════
   src/posco-live.js 를 만든다 — 재구축 화면(Screen/Control Main)의 인터랙션·라이브 레이어.

   왜 생성기인가 — 반응형(캔버스 넓히기) 엔진은 한진→HANA 로 이어지며 실측으로 다듬어진
   코드다. 손으로 옮겨 적으면 그 사이에 고쳐 둔 함정들이 도로 살아난다. 그래서
   `src/hana-live.js` 에서 **검증된 함수만 이름 그대로 떠 와서**(hn→pk 로 접두어만 바꿔)
   싣고, 이 시안 몫(시계·접기·호버·라이브)만 여기에 적는다.

   실행: node src/posco/_gen/mk-live.js
   ════════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs');
const path = require('path');
const GEN = __dirname;
const STUDIO = path.join(GEN, '..', '..', '..');
const SRC = fs.readFileSync(path.join(STUDIO, 'src', 'hana-live.js'), 'utf8');

/* ── hana-live.js 에서 함수 하나를 통째로 떠 온다(중괄호 짝을 세어 끝을 찾는다) ── */
function take(name) {
  const re = new RegExp('\\n(  )function ' + name + '\\s*\\(');
  const m = re.exec(SRC);
  if (!m) throw new Error('함수를 못 찾았다: ' + name);
  let i = SRC.indexOf('{', m.index + m[0].length - 1);
  let d = 0, j = i;
  for (; j < SRC.length; j++) {
    const c = SRC[j];
    if (c === '"' || c === "'" || c === '`') {            /* 문자열 건너뛰기 */
      const q = c; j++;
      while (j < SRC.length && SRC[j] !== q) { if (SRC[j] === '\\') j++; j++; }
      continue;
    }
    if (c === '/' && SRC[j + 1] === '*') { j = SRC.indexOf('*/', j) + 1; continue; }
    if (c === '/' && SRC[j + 1] === '/') { j = SRC.indexOf('\n', j); continue; }
    if (c === '{') d++;
    else if (c === '}') { d--; if (!d) break; }
  }
  return SRC.slice(m.index + 1, j + 1);
}
/* `var NAME = …;` 한 줄(또는 여러 줄) 떠 오기 */
function takeVar(name) {
  const re = new RegExp('\\n  var ' + name + ' = ');
  const m = re.exec(SRC);
  if (!m) throw new Error('변수를 못 찾았다: ' + name);
  let j = m.index + m[0].length, d = 0;
  for (; j < SRC.length; j++) {
    const c = SRC[j];
    if (c === '"' || c === "'") { const q = c; j++; while (j < SRC.length && SRC[j] !== q) { if (SRC[j] === '\\') j++; j++; } continue; }
    if ('[{('.indexOf(c) >= 0) d++;
    else if (']})'.indexOf(c) >= 0) d--;
    else if (c === ';' && d === 0) break;
  }
  return SRC.slice(m.index + 1, j + 1);
}

/* 떠 온 코드의 접두어만 바꾼다(형상·로직은 한 글자도 안 건드린다) */
const rename = (s) => s
  .split('hn-').join('pk-')
  .split('__hnLive').join('__pkLive')
  .split('data-hn-').join('data-pk-')
  .split('hnGenCls').join('pkGenCls')
  .split('hnSat').join('pkSat');

/* 이 시안에 맞춰 두 군데만 손본다(그 밖의 로직은 그대로 쓴다) */
function tweak(s) {
  /* ① '전면 배경' 판정 — 세로·가로 **둘 다** 캔버스를 덮을 때만.
        원래는 `||` 라 폭 1920 짜리 줄(헤더·브레드크럼·이벤트 현황 바)까지 전면 배경으로 보고
        세로로 늘려 버렸다(헤더 56 → 240). 이 시안은 그런 줄이 셋이라 그대로 두면 화면이 무너진다. */
  s = s.split("var full = o.h >= BASE_H * 0.85 || o.w >= BASE_W * 0.99;   /* 전면 배경(별자리 판·건물 판) */")
    .join("var full = o.h >= BASE_H * 0.85 && o.w >= BASE_W * 0.99;   /* 전면 배경 — 세로·가로 둘 다 덮을 때만 */");
  /* ② 잰 앵커 위에 이 시안의 표를 덮는다(아래 ANCHOR 참고) */
  s = s.split("        if (cs.display === 'contents') { walk(c, gid == null ? groups.length : gid); continue; }")
    .join("        if (cs.display === 'contents') { walk(c, gid == null && c.getAttribute('data-name') !== 'Base Screen' ? groups.length : gid); continue; }   /* SOP: 배경 화면 그룹은 풀어서 센다 */");
  s = s.split("    if (!st.anchors) st.anchors = measureAnchors(root);")
    .join("    if (!st.anchors) { st.anchors = measureAnchors(root); applyAnchorOverrides(st.anchors); }");
  return s;
}

/* ── 떠 올 것 ── */
const UTIL = ['editing', 'idle', 'every', 'all', 'one', 'numOf', 'setNum', 'tween'];
const ENGINE = ['collectBlocks', 'pick', 'boxOf', 'setW', 'measureStretch', 'applyStretch',
  'measureDockBoard', 'applyDockBoard', 'alignDropdown', 'unionBox', 'unhideVariants',
  'measureAnchors', 'applyFit', 'installFit'];
const SELECT = ['findSelected', 'sat', 'swapLook', 'swapPair', 'lookOf', 'applyLook',
  'swapSrc', 'swapNodeClass', 'groupSiblings', 'installSelect'];

const borrowed = []
  .concat(UTIL.map(take))
  .concat([takeVar('rnd'), takeVar('clamp')])
  .concat(ENGINE.map(take))
  .concat(SELECT.map(take))
  .map(rename)
  .map(tweak)
  .join('\n\n');

/* ════════════════ 이 시안 몫 ════════════════ */

const CSS = `  var STYLE_ID = 'posco-live-style';
  var CSS = [
    /* 호버 — 레이아웃에 영향을 주지 않도록 ::before 오버레이로만 칠한다
       (conv.js 가 만드는 규칙은 ::after 만 쓰므로 ::before 는 비어 있다) */
    /* ── '여기 눌린다'는 표시 ──
       ① 호버 틴트가 붙은 자리(pk-hot) ② 라이브가 클릭을 붙인 자리(pk-click, clickable() 참고).
       커서는 상속되므로 안쪽 글자·아이콘 위에서도 그대로 손가락이다.
       원본이 글자를 <p> 로 두어 브라우저가 기본으로 I-빔(글자 고르기) 커서를 띄우는데,
       그러면 '누르는 자리'가 아니라 '글을 고르는 자리'처럼 보인다 → 눌리는 자리 안에서는 손가락으로 덮는다. */
    '.pk-root .pk-hot,.pk-root .pk-click{cursor:pointer;}',
    '.pk-root .pk-hot p,.pk-root .pk-click p,.pk-root .pk-hot img,.pk-root .pk-click img{cursor:inherit;}',
    /* 틴트도 그라디언트도 없던 자리(팝업 X · 알림의 확인 …) — 밝아지는 것으로 눌림을 알린다 */
    '.pk-root .pk-lit{transition:filter .18s ease;}',
    '.pk-root .pk-lit:hover{filter:brightness(1.3);}',
    '.pk-root .pk-lit:active{filter:brightness(1.5);}',
    '.pk-root[data-theme="light"] .pk-lit:hover{filter:brightness(.85);}',
    '.pk-root[data-theme="light"] .pk-lit:active{filter:brightness(.75);}',
    /* 글자를 고치는 동안(패널편집)에는 글자 커서가 맞다 — 그때는 이 표시를 걷는다 */
    '.dt-content-editing .pk-root .pk-hot,.dt-content-editing .pk-root .pk-click,',
    '.dt-editing .pk-root .pk-hot,.dt-editing .pk-root .pk-click{cursor:auto;}',
    '.dt-content-editing .pk-root .pk-hot p,.dt-content-editing .pk-root .pk-click p{cursor:text;}',
    '.pk-root .pk-hot::before{content:"";position:absolute;inset:0;border-radius:inherit;',
    'background:#ffffff;opacity:0;pointer-events:none;transition:opacity .18s ease;z-index:3;}',
    '.pk-root .pk-hot:hover::before{opacity:.10;}',
    '.pk-root .pk-hot:active::before{opacity:.17;transition-duration:.06s;}',
    '.pk-root[data-theme="light"] .pk-hot::before{background:#0d2444;}',
    '.pk-root[data-theme="light"] .pk-hot:hover::before{opacity:.075;}',
    '.pk-root[data-theme="light"] .pk-hot:active::before{opacity:.13;}',
    /* 표의 줄은 살짝만 — 글자가 빽빽해 강한 틴트는 읽기를 방해한다 */
    '.pk-root .pk-hot.pk-row:hover::before{opacity:.055;}',
    '.pk-root[data-theme="light"] .pk-hot.pk-row:hover::before{opacity:.045;}',
    /* 판 없이 그림만 있는 자리 — 사각형 틴트 대신 밝기로 반응 */
    '.pk-root .pk-hot.pk-soft::before{display:none;}',
    '.pk-root .pk-hot.pk-soft{transition:filter .18s ease,opacity .18s ease;}',
    '.pk-root .pk-hot.pk-soft:hover{filter:brightness(1.35);}',
    '.pk-root .pk-hot.pk-soft:active{filter:brightness(1.55);}',
    '.pk-root[data-theme="light"] .pk-hot.pk-soft:hover{filter:brightness(.72);}',
    /* ── 틴트의 모양을 그림에 맞춘다 ──
       원본의 판·칩은 그림(svg)이 둥글고 상자 자체는 각져 있다. border-radius:inherit 만
       믿으면 네모 틴트가 둥근 그림 밖으로 삐져나와 '효과가 잘린' 것처럼 보인다. */
    '.pk-root [data-name^="Count/"]::before,.pk-root [data-name="Button/Ack"]::before{border-radius:999px;}',
    '.pk-root [data-name^="group0"]::before{border-radius:4px;}',           /* 자산정보현황 타일(group-bg.svg 와 같은 4px) */
    '.pk-root [data-name="Nav Bar"] > *::before,.pk-root [data-name^="item0"]::before{border-radius:6px;}',
    '.pk-root [data-name^="item-"]::before{border-radius:6px;}',           /* 분류 바(CCTV · 출입 · 소방 · 도청) */
    /* 글자만 있는 자리(브레드크럼) — 글자에 딱 붙은 네모는 선택 블록처럼 보인다.
       조금 넓히고 모서리를 깎아 '누를 수 있는 자리'로 읽히게 한다. */
    '.pk-root [data-name^="Item/"]::before{inset:-3px -6px;border-radius:4px;}',
    /* 고르기 — 상태가 바뀔 때 색·테두리가 부드럽게 넘어간다 */
    '.pk-root .pk-swap{transition:background-color .22s ease,border-color .22s ease,color .22s ease,box-shadow .22s ease;}',
    '.pk-root .pk-swap p{transition:color .22s ease;}',

    /* ── 층 선택 버튼의 호버·고름 ──
       색을 새로 짓지 않는다. Figma btn-floor 컴포넌트 세트의 Status=hover(16:9160) ·
       Status=active(16:9161) 에 designer 가 넣어 둔 값 그대로다. */
    /* 층 버튼의 이름은 화면마다 다르다 — 메인 3장은 로컬 마스터라 'Floor Item',
       전체층·단층은 원격(라이브러리) 마스터라 'btn-list-category-floor' 로 나온다. */
    '.pk-root [data-name="Floor Item"],.pk-root [data-name="btn-list-category-floor"]{transition:background .2s ease,border-color .2s ease,box-shadow .2s ease;}',
    '.pk-root [data-name="Floor Item"]:hover,.pk-root [data-name="btn-list-category-floor"]:hover{background:linear-gradient(180deg,#016eeb 0%,#013e85 100%);border-color:#016eeb;}',
    '.pk-root [data-name="Floor Item"]:hover p,.pk-root [data-name="btn-list-category-floor"]:hover p{color:#ffffff;}',
    '.pk-root [data-name="Floor Item"].pk-on,.pk-root [data-name="btn-list-category-floor"].pk-on{background:linear-gradient(180deg,#016eeb 0%,#0051ad 100%);border-color:transparent;',
    'box-shadow:inset 0 0 4px 0 rgba(255,255,255,.45);}',
    '.pk-root [data-name="Floor Item"].pk-on p,.pk-root [data-name="btn-list-category-floor"].pk-on p{color:#ffffff;}',

    /* ── 팝업 여닫기 ──
       크기는 transform 이 아니라 CSS scale 속성으로 준다 — 원본이 걸어 둔 transform 을 안 덮게.
       (이 묶음은 템플릿 문자열 안이라 역따옴표를 쓰면 안 된다.) */
    '.pk-root .pk-pop{transition:opacity .2s ease,scale .2s cubic-bezier(.22,.9,.24,1);}',
    '.pk-root .pk-pop-off{opacity:0;scale:.97;pointer-events:none;visibility:hidden;}',

    /* ── 아이콘 타일 고르기(좌상단 나브 · 분류 바) ──
       켜진 모습이 그림째 따로 있어 맞바꿀 수 없다 → 시안의 파랑(#016eeb)으로 빛만 얹는다. */
    '.pk-root .pk-pick{transition:filter .2s ease;}',
    '.pk-root .pk-pick.pk-picked img{filter:drop-shadow(0 0 5px rgba(1,110,235,.85)) brightness(1.18);}',
    '.pk-root .pk-pick.pk-picked p{color:#ffffff;}',
    '.pk-root[data-theme="light"] .pk-pick.pk-picked p{color:#0b2f66;}',

    /* ── 자산리스트 분류 접기 ── */
    '.pk-root .pk-fold-list{overflow:hidden;transition:height .3s cubic-bezier(.22,.9,.24,1);}',
    /* 날짜 고르기 — 원본 날짜 칸 위에 투명하게 덮는 진짜 <input type="date">.
       보이는 것은 시안 그대로이고, 열리는 달력은 브라우저(OS) 것이다. */
    /* **opacity 로 감추지 않는다** — 흐려 둔 입력에는 브라우저가 달력을 띄워 주지 않는다(그래서 한 번 안 열렸다).
       글자 · 배경 · 기본 겉모습만 지우고, 달력 단추는 자리를 지킨 채 투명하게 둔다(눌리는 자리는 그대로다). */
    '.pk-root .pk-datepick{position:absolute;inset:0;width:100%;height:100%;margin:0;padding:0;border:0;',
    'background:transparent;color:transparent;cursor:pointer;font:inherit;}',
    /* 날짜 칸에는 appearance:none 을 **주지 않는다** — 겉모습을 지우면 달력 단추의 기본 동작까지 사라져
       눌러도 달력이 안 열린다(그렇게 만들었다가 고쳤다). 겉모습은 아래 투명 처리만으로 충분히 지워진다. */
    /* 브라우저의 **달력 단추를 칸 전체로 늘려** 투명하게 깐다 — 그러면 어디를 눌러도 브라우저가
       스스로 달력을 연다. showPicker() 에 기대지 않는 이유: 그건 '사용자가 직접 누른 것'을 요구해
       자리에 따라(그리고 자동 시험에서) 거부된다. 여기서는 열어 주는 쪽이 브라우저다. */
    '.pk-root .pk-datepick::-webkit-calendar-picker-indicator{position:absolute;inset:0;width:100%;height:100%;',
    'margin:0;padding:0;opacity:0;cursor:pointer;}',
    /* 날짜 글자 영역은 **자리는 두고 안 보이게**(opacity) 한다. 투명 글자만으로는 초점이 간 조각의
       파란 선택 블록이 시안 위로 비치고, 반대로 display:none 으로 없애면 브라우저가 달력을 안 띄운다
       — 둘 다 만들어 본 뒤 고른 가운데 값이다. */
    '.pk-root .pk-datepick::-webkit-datetime-edit{opacity:0;}',
    '.pk-root .pk-datepick{color-scheme:dark;}',
    '.pk-root[data-theme="light"] .pk-datepick{color-scheme:light;}',
    /* 초점은 **칸**에 테두리로 보인다 — 덮어 둔 입력을 드러내면(opacity:1) 브라우저 기본 날짜칸이
       시안 위에 그대로 뜬다(한 번 그렇게 만들었다). 보이는 것은 끝까지 원본이어야 한다. */
    '.pk-root .pk-datepick:focus{outline:none;}',
    '.pk-root [data-name="Date Field"]:focus-within{outline:2px solid #016eeb;outline-offset:2px;border-radius:3px;}',
    /* 건물 고르기 — 날짜와 같은 방법(원본 칸 위에 투명한 진짜 <select>) */
    /* 닫혀 있을 때는 아무것도 안 그린다(투명 글자 · 배경 없음 · 화살표 없음) — 보이는 건 시안 글자다.
       **펼친 목록은 별개다**: option 은 투명 글자색을 물려받아 글자가 통째로 사라진다(그렇게 만들었다가 고쳤다).
       그래서 항목 색은 **따로 못 박고**, 목록 판은 화면 테마를 따르게 color-scheme 을 준다.
       opacity 로 감추지 않는 이유 — 브라우저에 따라 펼친 목록까지 같이 흐려진다. */
    '.pk-root .pk-buildpick{position:absolute;inset:0;width:100%;height:100%;margin:0;padding:0;border:0;',
    'background:transparent;color:transparent;cursor:pointer;font:inherit;-webkit-appearance:none;appearance:none;}',
    /* 다크가 기본이고 라이트만 속성으로 켠다(시트 규칙과 같다 — 미리보기는 속성이 아예 없다) */
    '.pk-root .pk-buildpick{color-scheme:dark;}',
    '.pk-root .pk-buildpick option{color:#e8eef7;background:#1b2430;}',
    '.pk-root[data-theme="light"] .pk-buildpick{color-scheme:light;}',
    '.pk-root[data-theme="light"] .pk-buildpick option{color:#0e1a2b;background:#ffffff;}',
    '.pk-root .pk-buildpick:focus{outline:none;}',
    '.pk-root [data-name="Building Selector"]:focus-within{outline:2px solid #016eeb;outline-offset:2px;border-radius:4px;}',
    '.pk-root .pk-rowhide{display:none !important;}',
    /* 글자를 고치는 동안(패널편집)에는 클릭이 글자에 닿아야 한다 */
    '.dt-content-editing .pk-root .pk-datepick,.dt-editing .pk-root .pk-datepick,',
    '.dt-content-editing .pk-root .pk-buildpick,.dt-editing .pk-root .pk-buildpick{pointer-events:none;}',
    '.pk-root .pk-chev{transition:transform .3s ease;}',
    '.pk-root .pk-chev.pk-chev-off{transform:rotate(-90deg);}',

    /* ── 접기·펴기 ──
       Figma 원본의 접힌 모습(content01 Status=close)과 같은 자리로 간다. */
    '.pk-root .pk-eventlog{transition:translate .42s cubic-bezier(.22,.9,.24,1);translate:0 var(--pk-lift,0px);}',
    '.pk-root .pk-collapsible{transition:height .38s cubic-bezier(.22,.9,.24,1);overflow:hidden;}',
    '.pk-root .pk-collapsible .pk-fadeout{transition:opacity .22s ease;opacity:1;}',
    '.pk-root .pk-collapsed .pk-fadeout{opacity:0;pointer-events:none;}',
    '.pk-root .pk-foldbtn{transition:transform .42s cubic-bezier(.22,.9,.24,1);}',
    '.pk-root .pk-foldbtn.pk-flip{transform:rotate(180deg);}',
    /* Figma 가 인스턴스에 걸린 회전(-90°)을 컴포넌트 출력에 안 실어 준다 →
       원본과 같게 세워 준다(층 선택 패널의 접기 단추). */
    '.pk-root .pk-rot90{transform:rotate(90deg);}',
    '.pk-root .pk-rot90.pk-flip{transform:rotate(270deg);}',

    /* ── 라이브 ── */
    '@keyframes pkTick{0%{opacity:.35;}100%{opacity:1;}}',
    '.pk-root .pk-tick{animation:pkTick .5s ease;}',
    '.pk-root .pk-num{white-space:nowrap;}',
    '@keyframes pkNewRow{0%{opacity:0;transform:translateY(-6px);}100%{opacity:1;transform:translateY(0);}}',
    '.pk-root .pk-newrow{animation:pkNewRow .45s cubic-bezier(.22,.9,.24,1) both;}',
    /* ── 알림 티커 ──
       원본 글자 그대로, **흐르기만** 한다(내용은 지어내지 않는다).
       자리를 옮길 때 transform 대신 CSS \`translate\` 속성을 쓴다 — 원본이 걸어 둔
       transform: translateY(-50%) 를 덮어쓰지 않으려고. */
    '.pk-root .pk-marquee{will-change:translate;}',
    /* 알림 바 전체가 숨 쉬듯 — 밝기만 오간다(형상·색은 원본 그대로) */
    '@keyframes pkTickerPulse{0%,100%{filter:brightness(1);}50%{filter:brightness(1.2);}}',
    '.pk-root .pk-tickerbar{animation:pkTickerPulse 2.4s ease-in-out infinite;}',
    /* 왼쪽 경고 심볼 — 커졌다 작아지고, 경보등처럼 링이 퍼져 나간다.
       크기는 transform 이 아니라 CSS \`scale\` 속성이라 원본 transform 을 건드리지 않는다.
       링 색은 시안이 쓰는 위험색(rgb(244,48,80) — 전구 critical 그라디언트 시작색) 그대로다. */
    '@keyframes pkBeacon{0%,100%{scale:1;}50%{scale:1.13;}}',
    '@keyframes pkBeaconRing{0%{transform:scale(.86);opacity:.7;}70%{transform:scale(1.75);opacity:0;}100%{opacity:0;}}',
    '.pk-root .pk-beacon{animation:pkBeacon 2.4s ease-in-out infinite;}',
    '.pk-root .pk-beacon::after{content:"";position:absolute;inset:0;border-radius:50%;',
    'border:1.5px solid rgba(244,48,80,.55);animation:pkBeaconRing 2.4s ease-out infinite;pointer-events:none;}',
    '.pk-root[data-theme="light"] .pk-beacon::after{border-color:rgba(197,26,52,.5);}',
    /* 글자를 고치는 동안에는 멈춘다 — 시선이 튀지 않게 */
    '.dt-content-editing .pk-root .pk-beacon,.dt-content-editing .pk-root .pk-beacon::after,',
    '.dt-content-editing .pk-root .pk-tickerbar{animation-play-state:paused;}',
    '@media (prefers-reduced-motion:reduce){.pk-root *{animation-duration:.001s!important;transition-duration:.001s!important;}}',
  ].concat(SOP_CSS).join('\\n');

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = CSS;
    document.head.appendChild(st);
  }
`;

const STRETCH = `  /* 기준 좌표계 — 1920x1080 을 유지한 채 캔버스만 넓힌다(통짜 축소 아님) */
  var BASE_W = 1920, BASE_H = 1080;

  /* ── 넓어진 폭을 판 '안쪽'까지 전달할 자리 ──
     캔버스를 넓히면 판은 따라 넓어지지만 그 안의 내용은 Figma 가 준 px 폭 그대로라 오른쪽이 빈다.
     이벤트 현황 표만 해당한다(다른 판은 좌·우 가장자리에 붙은 고정폭 위젯이다).
     칸 크기는 그대로 두고 '이벤트 내용' 칸이 남는 폭을 먹는다. */
  var STRETCH = [
    {
      host: '[data-name^="Event Panel"]',
      parts: ':scope > [data-name="Body"], [data-name="Background"], [data-name="Content"],'
        + '[data-name="Header"], [data-name="Table"], [data-name="Header Row"], [data-name="Cells"],'
        + '[data-name="Rows"], [data-name="Row"]',
      grow: '[data-name="Th/Message"], [data-name="Td/Message"]',
    },
  ];
`;

const SCREEN = `  /* ══════════════════ 이 시안 — 앵커 표 ══════════════════
     블록이 캔버스의 어디에 붙는지. 일반 추정(measureAnchors)은 '세로로 놓인 위치에 비례해'
     내려보내는데, 이 시안은 헤더 바로 밑에 브레드크럼이 붙어 있어 비례 배분을 하면 그 사이가 벌어진다.
     그래서 여기서는 표로 못 박는다 — dy 0=위 · 0.5=가운데 · 1=아래, dx 0=왼쪽 · 0.5=가운데 · 1=오른쪽. */
  var ANCHOR = [
    { m: '[data-name="Dialog/SOP"] > *', dx: 1, dy: 0.5 },          /* SOP 대화상자 — 오른쪽, 세로 가운데 */
    { m: '[data-name="Background"]', dx: 0, dy: 0 },                 /* 바탕 사진 — full 로 잡혀 늘어난다 */
    { m: '[data-name="Building Image"], [data-name="Floor Plan"]', dx: 0.5, dy: 0.5 },   /* 3D 건물 · 도면 — 캔버스 가운데 */
    { m: '[data-name="Header"]', dx: 0, dy: 0 },
    { m: '[data-name="Breadcrumb"]', dx: 0, dy: 0 },                 /* 헤더에 붙어 있어야 한다 */
    { m: '[data-name="Nav Bar"], [data-name="Sidebar"], [data-name="Toolbar"], [data-node-id="17:9544"]', dx: 0, dy: 0 },   /* 왼쪽 위 — 나브 · 층 선택 */
    { m: '[data-name="Alert Ticker"]', dx: 0.5, dy: 0 },
    { m: '[data-name^="Widget/"], [data-name^="Panel/"], [data-name="Category Bar"]', dx: 1, dy: 0 },   /* 오른쪽 위 판 */
    { m: '[data-name^="Event Panel"]', dx: 0, dy: 1 },               /* 이벤트 현황 — 바닥 */
    /* 팝업은 표에 넣지 않는다 — 원본이 '가운데 띄운 것'(Ack 알림 · 자산 상세)과
       '왼쪽 목록에 붙여 둔 것'(종합현황 · 이벤트 리스트)으로 갈리는데, 한 줄로 0.5 를 박으면
       왼쪽에 붙어 있던 판이 넓힐수록 목록에서 떨어져 나간다(2560 에서 좌156 → 476 으로 벌어졌다).
       잰 값(measureAnchors)이 이미 제자리를 맞힌다 — 가운데 것은 0.5, 왼쪽 것은 0 으로. */
  ];
  /* 왜 레이어명으로 잡나 — 화면 6장이 같은 골격(헤더·브레드크럼·이벤트 현황·좌측 목록·우측 판)을
     쓰지만 node id 는 화면마다 다르다. 이름은 Figma 에서 여섯 장을 같은 어휘로 통일해 두었다. */
  function applyAnchorOverrides(anchors) {
    if (!anchors) return;
    anchors.forEach(function (a) {
      for (var i = 0; i < ANCHOR.length; i++) {
        var sel = ANCHOR[i].m;
        var hit = a.els.some(function (el) { try { return el.matches(sel); } catch (e) { return false; } });
        if (!hit) continue;
        a.wantDX = ANCHOR[i].dx;
        a.wantDY = ANCHOR[i].dy;
        break;
      }
    });
  }

  /* ══════════════════ 이 시안 — 마우스 오버 ══════════════════ */
  var HOT = [
    '[data-name^="Menu Item/"]', '[data-name^="Nav Item/"]', '[data-name="Nav Bar"] > *',
    '[data-name^="Button/"]', '[data-name^="Count/"]', '[data-name="Building Label"]',
    '[data-name="Logo"]', '[data-name^="Item/"]', '[data-name^="group0"]',
    /* 나머지 다섯 화면 몫 */
    '[data-name^="Category/"]',        /* 자산리스트의 분류 줄(CCTV · 소방센서) */
    '[data-name^="item-"]',            /* 분류 바(CCTV · 출입 · 소방 · 도청) */
    '[data-name^="item0"]',            /* 좌상단 나브(부지이동 · 전체보기 · 기본위치) */
    '[data-name="Search Field"]',
  ].join(',');
  /* 왜 이 선택자인가
     · 'Nav Bar > *'  — 둘째 나브(출입동선)에는 Figma 가 data-name 을 안 실어 줬다.
                        하나만 반응하면 '고장 난 것'처럼 보여 형제까지 함께 잡는다.
     · 'group0*'      — 자산정보현황은 타일(group01…04)이 눌리는 자리다. 안쪽 글자 묶음(item)에
                        얹으면 틴트가 타일보다 6px 씩 작아 가장자리가 잘린 것처럼 보였다.
     · 'Auto Toggle' 없음 — 그 상자는 Auto 알약과 펼침 단추를 담기만 한다. 같이 잡으면
                        알약 위에 네모 한 겹이 더 깔려 '효과가 잘린' 것처럼 보였다. */
  /* 판 없이 그림만 놓인 자리 — 사각형 틴트 대신 밝기로 반응 */
  var SOFT = ['[data-name^="Button/Collapse"]', '[data-name="Button/Dropdown"]', '[data-name="Logo"]',
    '[data-name="Button/Close"]', '[data-name="btn-arrow"]'].join(',');
  /* 한 묶음 안에서 하나만 고르는 것 — 겉모습을 **원본의 두 상태끼리 맞바꿔** 표시한다.
     이름에 (Selected) 가 박힌 것이 있으면 그것이 곧 '켜진 모습'이다(표의 줄 · 자산리스트 항목). */
  var GROUP_ITEMS = ['[data-name^="Nav Item/"]', '[data-name^="Menu Item/"]',
    '[data-name="Row"],[data-name="Row (Selected)"]',
    '[data-name="Item"],[data-name="Item (Selected)"]',
    '[data-name="Item/Unauthorized"],[data-name="Item/General"]'];
  var TOGGLE_ITEMS = [];

  function markHot(root) {
    all(root, HOT).forEach(function (el) {
      if (el.classList.contains('pk-hot')) return;
      var r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) return;
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      el.classList.add('pk-hot');
    });
    all(root, SOFT).forEach(function (el) { el.classList.add('pk-hot', 'pk-soft'); });
    /* 겹쳐 얹지 않는다 — 안쪽이 이미 반응하는데 바깥 상자까지 칠하면 틴트가 두 겹이 되고,
       바깥 상자는 대개 각진 네모라 안쪽 알약 옆으로 삐져나와 '잘린' 것처럼 보인다. */
    all(root, '.pk-hot').forEach(function (el) {
      if (el.querySelector('.pk-hot')) el.classList.remove('pk-hot', 'pk-soft');
    });
    markRowsHot(root);
  }

  /* 이벤트 표의 줄 — 판(overflow:clip) 안에 **통째로** 들어온 줄에만 호버를 얹는다.
     원본(Figma)부터 표가 판보다 길어 마지막 줄은 반쯤 잘려 있다. 거기에 틴트를 칠하면
     반쪽짜리 띠가 생겨 '효과가 잘렸다'고 읽힌다 — 그런 줄은 아예 반응시키지 않는다.
     줄은 피드가 돌리고 판은 접기·창 크기로 높이가 바뀌니 그때마다 다시 잰다. */
  /* 줄처럼 늘어선 것들 — 이벤트 표 · 출입내역 표 · 자산리스트 항목 */
  var ROWS = ['[data-name="Rows"] > [data-name^="Row"]',
    '[data-name="Item"]', '[data-name="Item (Selected)"]'].join(',');
  /* 이 줄을 잘라 내는 조상(overflow) — 화면마다 판이 다르다(이벤트 현황 · 출입내역 · 자산리스트) */
  function clipperOf(el, root) {
    var p = el.parentElement;
    while (p && p !== root) {
      var cs = getComputedStyle(p);
      if (/hidden|clip|auto|scroll/.test(cs.overflow + cs.overflowX + cs.overflowY)) return p;
      p = p.parentElement;
    }
    return null;
  }
  function markRowsHot(root) {
    var rows = all(root, ROWS);
    if (!rows.length) return;
    rows.forEach(function (el) {
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      var clip = clipperOf(el, root);
      var r = el.getBoundingClientRect();
      var c = clip && clip.getBoundingClientRect();
      var whole = !c || (r.top >= c.top - 0.5 && r.bottom <= c.bottom + 0.5);
      el.classList.toggle('pk-hot', whole);
      el.classList.toggle('pk-row', whole);
    });
  }

  /* 판 높이가 바뀌면(창 크기 · 접기) 잘리는 줄도 바뀐다 — 다시 잰다 */
  function installRowHot(root, st) {
    var run = function () { try { markRowsHot(root); } catch (e) { } };
    var queued = 0;
    var later = function () { if (queued) return; queued = requestAnimationFrame(function () { queued = 0; run(); }); };
    window.addEventListener('resize', later);
    var ro = null;
    if (window.ResizeObserver) {
      var panel = one(root, '[data-name^="Event Panel"]');
      if (panel) { ro = new ResizeObserver(later); ro.observe(panel); }
    }
    st.rowHot = run;
    st.cleanup.push(function () {
      window.removeEventListener('resize', later);
      if (queued) cancelAnimationFrame(queued);
      if (ro) ro.disconnect();
    });
  }

  /* ══════════════════ 실시간 시계 ══════════════════
     헤더의 2024/12/01 · 15:16:49 를 지금 시각으로 채운다(원본 서식 그대로).
     헤더는 인스턴스라 안쪽 글자에 data-name 이 없다 → 노드 id 로 찾는다. */
  function installClock(root, st) {
    var date = one(root, '[data-node-id$="1:3080"]') || one(root, '[data-name="Date"] p');
    var time = one(root, '[data-node-id$="1:3081"]') || one(root, '[data-name="Time"]');
    if (!date && !time) return;
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var tick = function () {
      if (editing()) return;
      var d = new Date();
      if (date) {
        var nd = d.getFullYear() + '/' + pad(d.getMonth() + 1) + '/' + pad(d.getDate());
        if (date.textContent !== nd) date.textContent = nd;
      }
      if (time) {
        var nt = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
        if (time.textContent !== nt) time.textContent = nt;
      }
    };
    tick();
    var id = every(1000, tick);
    st.cleanup.push(function () { clearInterval(id); });
  }

  /* ══════════════════ 가로를 꽉 쓰는 판 안쪽의 '1920 고정' 조각 펴기 ══════════════════
     캔버스를 넓히면 판(헤더·브레드크럼·이벤트 현황)은 따라 넓어지는데, 그 **안쪽** 조각 중
     Figma 가 1920px 로 못 박아 준 것은 그대로 남아 좌우가 빈다.
     실제로 헤더가 그랬다 — Header > Background(+Fill·Accent Line)와 Header > Content 가
     2560 폭에서 가운데 1920 만 칠해져, 좌우 320px 씩 맨바닥이 드러났다(6화면 공통).

     폭을 매번 다시 재지 않고 **한 번 '고정'을 푼다** — 그러면 부모(판)를 그냥 따라간다:
       · absolute 조각 → left:0 / right:0 / width:auto
         (가운데 맞추려고 걸어 둔 translate 는 걷는다 — 안 걷으면 푼 뒤 왼쪽으로 밀린다)
       · 흐름 안의 조각 → width:100%
     기준 크기(1920)에서는 결과가 원본과 한 픽셀도 다르지 않다(그때는 부모도 1920 이다).
     그래서 '넓어졌을 때만' 이 아니라 늘 걸어 둬도 안전하다. */
  function installWideFit(root, st) {
    var frame = root.firstElementChild;
    if (!frame) return;
    /* 재는 동안은 배율을 끄고 캔버스를 정확히 1920 으로 되돌린다(measureAnchors 와 같은 방식) */
    var s0 = root.style.transform, w0 = root.style.width, h0 = root.style.height;
    root.style.transform = 'none';
    root.style.width = BASE_W + 'px';
    root.style.height = BASE_H + 'px';
    var picks = [];
    /* SOP 화면은 배경 화면 전체가 Figma 그룹(Base Screen, display:contents)에 들어 있다 — 그 안의 판도 같은 줄로 본다
       (안 그러면 넓은 창에서 SOP 화면의 헤더 바탕만 가운데 1920 에 남는다) */
    var blocks = [];
    Array.prototype.forEach.call(frame.children, function (b) {
      if (b.getAttribute('data-name') === 'Base Screen') Array.prototype.forEach.call(b.children, function (c) { blocks.push(c); });
      else blocks.push(b);
    });
    blocks.forEach(function (block) {
      if (block.offsetWidth < BASE_W - 2) return;            /* 가로를 꽉 쓰는 판만 */
      all(block, '*').forEach(function (el) {
        if (!(el instanceof HTMLElement)) return;            /* svg 속은 건드리지 않는다 */
        if (Math.abs(el.offsetWidth - BASE_W) > 1) return;    /* 판을 꽉 채우던 조각만 */
        var cs = getComputedStyle(el);
        /* 정규식을 쓰지 않는다 — 이 묶음은 생성기의 템플릿 문자열 안이라 역슬래시가 한 겹 벗겨져
           괄호를 이스케이프한 정규식이 조용히 안 맞는다(README 함정 ⑫. 여기서 한 번 당했다). */
        var tr = cs.transform || '';
        var mid = false;
        if (tr.slice(0, 7) === 'matrix(') {
          var v = tr.slice(7, tr.length - 1).split(',').map(parseFloat);
          /* 가운데 맞추기 = 기울기·배율 없이 제 폭의 절반만큼 왼쪽으로 민 것 */
          mid = v.length >= 6 && v[0] === 1 && v[1] === 0 && v[2] === 0 && v[3] === 1
            && Math.abs(v[4] + el.offsetWidth / 2) < 2;
        }
        picks.push({ el: el, abs: cs.position === 'absolute', mid: mid });
      });
    });
    root.style.transform = s0; root.style.width = w0; root.style.height = h0;
    if (!picks.length) return;

    picks.forEach(function (p) {
      if (p.abs) {
        p.el.style.left = '0px';
        p.el.style.right = '0px';
        p.el.style.width = 'auto';
        if (p.mid) p.el.style.transform = 'none';
      } else {
        p.el.style.width = '100%';
      }
    });
    st.cleanup.push(function () {
      picks.forEach(function (p) {
        ['left', 'right', 'width', 'transform'].forEach(function (k) { p.el.style.removeProperty(k); });
      });
    });
    st.wideFit = picks.length;
  }

  /* ══════════════════ '여기 눌린다'는 표시 ══════════════════
     클릭을 붙이는 장치는 전부 이 함수를 통과한다 — 손가락 커서 · 키보드 초점 · 스크린리더 역할을
     한 자리에서 준다. 호버 틴트(pk-hot)가 없는 자리(층 버튼 · 팝업 X · 분류 머리글 …)도 커서는 바뀐다.
     새 장치를 더할 때도 여기만 부르면 표시가 빠지지 않는다. */
  function clickable(el, title, role) {
    if (!el) return el;
    el.classList.add('pk-click');
    if (!el.getAttribute('role')) el.setAttribute('role', role || 'button');
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    if (title && !el.title) el.title = title;
    /* 눌림 반응이 **이미 있는** 자리는 그대로 둔다 — 호버 틴트(pk-hot 안쪽 포함)와
       층 버튼(원본 btn-floor 의 파란 그라디언트). 아무 반응도 없던 자리에만 '밝아짐'을 준다
       (팝업 X · 알림의 확인 단추처럼 커서만 바뀌면 눌리는지 확신이 안 선다). */
    try {
      var own = el.matches('[data-name="Floor Item"],[data-name="btn-list-category-floor"]');
      if (!own && !el.closest('.pk-hot')) el.classList.add('pk-lit');
    } catch (e) {}
    return el;
  }
  /* 되돌리기 — dispose 때 원래대로 */
  function unclickable(el) {
    if (!el) return;
    el.classList.remove('pk-click', 'pk-lit');
    ['role', 'tabindex', 'title', 'aria-expanded', 'aria-checked'].forEach(function (a) { el.removeAttribute(a); });
  }

  /* ══════════════════ 층 고르기 ══════════════════
     원본에는 '선택된 층'이 박혀 있지 않다(전부 defalut 상태). 그래서 고른 층에는
     Figma btn-floor Status=active 의 겉모습을 CSS 로 입힌다(위 스타일 묶음 참고). */
  function installFloorPick(root, st) {
    var items = all(root, '[data-name="Floor Item"],[data-name="btn-list-category-floor"]');
    if (!items.length) return;
    var cur = null;
    items.forEach(function (el) {
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      clickable(el, '이 층 보기');
      var h = function (e) {
        if (e) e.preventDefault();
        if (editing()) return;
        if (cur) cur.classList.remove('pk-on');
        cur = el === cur ? null : el;
        if (cur) cur.classList.add('pk-on');
      };
      var key = function (e) { if (e.key === 'Enter' || e.key === ' ') h(e); };
      el.addEventListener('click', h);
      el.addEventListener('keydown', key);
      st.cleanup.push(function () {
        el.removeEventListener('click', h); el.removeEventListener('keydown', key);
        el.classList.remove('pk-on'); unclickable(el);
      });
    });
  }

  /* ══════════════════ 화면끼리 잇기 ══════════════════
     여섯 장은 한 시스템의 여섯 화면이다. 원본에 이미 '옮겨 간다'는 뜻으로 그려 둔 자리가 있으므로
     **새 단추를 만들지 않고** 그 자리를 실제 이동에 잇는다.
       · 왼쪽 나브 — **글자로 잡는다**. 레이어 이름이 화면마다 다르다
         (Nav Item/Overview (Selected) · item01_on · item02_off · item01_off …) — 이름으로 잡으면 새 화면에서 어긋난다.
         종합현황 → overview · 출입동선 → route · 부지이동 → main · 전체보기 → floors.
         '기본위치'는 시점 되돌리기라 이동이 아니다 — 고르기(installPick)만 남긴다.
       · 브레드크럼 — 'KDB 부지' → main(부지) · 'KDB 본관' → floors(그 건물의 전체 층)
       · 헤더 로고 → main
       · Ack 단추 → ack. 단 그 화면에 알림창이 **없을 때만** — 있으면 그 자리에서 팝업이 뜨는 게 맞다.
       · 층 항목 → detail(단층) · 건물 라벨 → floors(전체층)
     **지금 화면과 같은 곳으로는 잇지 않는다** — 그래야 종합현황 화면의 나브가 '팝업 열기'로 남고,
     전체층 화면의 '본관'이 제자리 이동으로 깜빡이지 않는다.
     스튜디오 안에서는 window.__gotoPoscoScene(형제 화면이 있으면 그 화면으로, 없으면 제자리 교체)이,
     낱장 미리보기로 열었을 때는 파일 이동이 맡는다. */
  var PAGE = { main: 'main.html', ack: 'ack.html', overview: 'overview.html', route: 'route.html', floors: 'floors.html', detail: 'detail.html', sop: 'sop.html' };
  var SCENE_NAME = { main: '메인', ack: 'Ack 알림', overview: '종합현황', route: '출입동선', floors: '전체층', detail: '단층', sop: 'SOP' };
  var NAV_TO = [['종합현황', 'overview'], ['출입동선', 'route'], ['부지이동', 'main'], ['전체보기', 'floors']];

  function sceneOf(root) {
    var s = one(root, '[data-name^="Screen/"]');
    var n = (s && s.dataset.name) || '';
    if (n.indexOf('SOP') >= 0) return 'sop';
    if (n.indexOf('Ack') >= 0) return 'ack';
    if (n.indexOf('Overview') >= 0) return 'overview';
    if (n.indexOf('Access Route') >= 0) return 'route';
    if (n.indexOf('All Floors') >= 0) return 'floors';
    if (n.indexOf('Floor Detail') >= 0) return 'detail';
    return 'main';
  }
  function goScene(to) {
    if (typeof window.__gotoPoscoScene === 'function') { window.__gotoPoscoScene(to); return; }
    if (typeof window.__openPoscoScreen === 'function') { window.__openPoscoScreen(to); return; }
    if (PAGE[to]) window.location.href = './' + PAGE[to] + (window.location.search || '');
  }

  function installGo(root, st) {
    var cur = sceneOf(root);
    var bind = function (el, to) {
      if (!el || !to || to === cur || el.__pkGo) return;
      el.__pkGo = 1;
      var had = el.classList.contains('pk-click');   /* 다른 장치가 이미 잡은 자리면 표시를 도로 걷지 않는다 */
      clickable(el, SCENE_NAME[to] + ' 화면으로 이동');
      var h = function (e) {
        if (editing()) return;                       /* 글자 고치는 중에는 안 옮긴다 */
        if (e) e.preventDefault();
        goScene(to);
      };
      var key = function (e) { if (e.key === 'Enter' || e.key === ' ') h(e); };
      el.addEventListener('click', h);
      el.addEventListener('keydown', key);
      st.cleanup.push(function () {
        el.removeEventListener('click', h); el.removeEventListener('keydown', key);
        el.__pkGo = 0; if (!had) unclickable(el);
      });
    };

    all(root, '[data-name="Nav Bar"] > *').forEach(function (el) {
      var t = el.textContent || '';
      for (var i = 0; i < NAV_TO.length; i++) if (t.indexOf(NAV_TO[i][0]) >= 0) { bind(el, NAV_TO[i][1]); return; }
    });
    bind(one(root, '[data-name="Item/Site"]'), 'main');
    bind(one(root, '[data-name="Item/Building"]'), 'floors');
    bind(one(root, '[data-name="Logo"]'), 'main');
    if (!one(root, '[data-name="ack-popup"]')) all(root, '[data-name="Button/Ack"]').forEach(function (el) { bind(el, 'ack'); });
    all(root, '[data-name="Floor Item"],[data-name="btn-list-category-floor"]').forEach(function (el) { bind(el, 'detail'); });
    all(root, '[data-name="Building Label"]').forEach(function (el) { bind(el, 'floors'); });
    /* 헤더 SOP 메뉴 → SOP 대응 절차 화면(STEP 1~3) */
    all(root, '[data-name^="Menu Item/"]').forEach(function (el) { if ((el.textContent || '').trim() === 'SOP') bind(el, 'sop'); });
  }

  /* ══════════════════ 팝업 여닫기 ══════════════════
     X(닫기)를 누르면 닫히고, 그 팝업을 불러내는 자리를 누르면 다시 열린다.
     '닫기'만 있고 '열기'가 없으면 시안에서 판 하나가 영영 사라진다 — 그래서 짝을 반드시 적는다.
     지우지 않고 **감춘다**(opacity/scale). 글자 편집(패널편집)은 감춘 판의 글자를 못 잡으므로,
     편집을 켜면 전부 도로 펴 준다(아래 every(600) 참고). */
  var POPUPS = [
    {
      name: '종합현황',
      sel: '[data-name="Popup/Overview"]',
      close: '[data-name="Button/Close"]',
      /* 왼쪽 위 나브의 **종합현황 항목**을 누르면 다시 열린다.
         예전엔 나브 전체(Nav Bar > *)로 잡아 두어 옆의 '출입동선'을 눌러도 종합현황이 떴다
         — 화면 이동(installGo)을 붙이면서 드러났다. 팝업은 제 이름이 붙은 자리에만 맨다. */
      open: ['[data-name^="Nav Item/Overview"]'],
    },
    {
      name: '이벤트 리스트',
      sel: '[data-name="Popup/Event List"]',
      close: '[data-name="Button/Close"]',
      /* 종합현황 표의 줄(층)을 누르면 그 층의 이벤트 목록이 뜬다 */
      open: ['[data-name="Popup/Overview"] [data-name="Rows"] > [data-name="Row"]'],
    },
    {
      name: '자산 상세',
      sel: '[data-name="Popup/Asset Detail"]',
      /* 이 팝업의 X 는 원격 마스터라 이름이 그냥 Icon 이다(제목 줄 안) */
      close: '[data-name="popup01-title"] [data-name="Icon"]',
      open: ['[data-name="Item"]', '[data-name="Item (Selected)"]'],
      /* 연 자산의 이름을 제목과 '자산명' 칸에 넣는다 — 시계와 같은 '살아 있는 글자' */
      onOpen: function (pop, from) {
        var name = (from.textContent || '').trim();
        if (!name) return;
        /* 반드시 **글자 노드(p)** 를 집을 것 — 같은 이름(popup01-txt)의 래퍼 div 가 하나 더 있는데
           거기에 textContent 를 쓰면 안쪽 p 가 통째로 날아가(편집 대상도 사라진다). */
        /* 대괄호 안만 갈아 끼운다. 정규식을 쓰지 않는 이유 — 이 묶음은 생성기의 템플릿 문자열 안이라
           역슬래시가 한 겹 벗겨져, 대괄호를 이스케이프한 정규식이 엉뚱한 문자군으로 나간다
           (그래서 한 번 조용히 안 먹었다. 이 묶음 안에서는 역따옴표도 쓰면 안 된다). */
        var t = one(pop, 'p[data-name="popup01-txt"]');
        var s = t ? t.textContent : '';
        var i = s.indexOf('['), j = s.lastIndexOf(']');
        if (t && i >= 0 && j > i) t.textContent = s.slice(0, i + 1) + name + s.slice(j);
        var v = one(pop, 'p[data-node-id$="352:14355;241:78269;241:78234"]');
        if (v) v.textContent = name;
      },
    },
    {
      name: 'Ack 알림',
      sel: '[data-name="ack-popup"]',
      /* '확인' 단추가 닫기다(X 가 없는 알림창) */
      close: '[data-name="btn"]',
      open: ['[data-name="Button/Ack"]'],
    },
  ];

  function installPopups(root, st) {
    var pops = [];
    POPUPS.forEach(function (P) {
      var pop = one(root, P.sel);
      if (!pop) return;
      pop.classList.add('pk-pop');
      var set = function (on) {
        pop.classList.toggle('pk-pop-off', !on);
        pop.setAttribute('aria-hidden', on ? 'false' : 'true');
      };
      pops.push({ pop: pop, set: set, isOpen: function () { return !pop.classList.contains('pk-pop-off'); } });

      all(pop, P.close).forEach(function (btn) {
        clickable(btn, P.name + ' 닫기');
        var h = function (e) {
          if (e) { e.preventDefault(); e.stopPropagation(); }
          if (editing()) return;               /* 글자 고치는 중에는 닫지 않는다 */
          set(false);
        };
        var key = function (e) { if (e.key === 'Enter' || e.key === ' ') h(e); };
        btn.addEventListener('click', h);
        btn.addEventListener('keydown', key);
        st.cleanup.push(function () { btn.removeEventListener('click', h); btn.removeEventListener('keydown', key); unclickable(btn); });
      });

      (P.open || []).forEach(function (sel) {
        all(root, sel).forEach(function (el) {
          if (pop.contains(el)) return;        /* 자기 안에서 여는 일은 없다 */
          clickable(el, P.name + ' 열기');
          var h = function () {
            if (editing()) return;
            set(true);
            if (P.onOpen) { try { P.onOpen(pop, el); } catch (e) {} }
          };
          el.addEventListener('click', h);
          st.cleanup.push(function () { el.removeEventListener('click', h); unclickable(el); });
        });
      });
    });
    if (!pops.length) return;

    /* Esc — 열려 있는 것 중 맨 나중 것을 닫는다 */
    var esc = function (e) {
      if (e.key !== 'Escape' || editing()) return;
      for (var i = pops.length - 1; i >= 0; i--) if (pops[i].isOpen()) { pops[i].set(false); return; }
    };
    document.addEventListener('keydown', esc);

    /* 패널편집을 켜면 감춰 둔 판도 도로 펴 준다 — 안 그러면 그 안의 글자를 고칠 수 없다 */
    var id = every(600, function () { if (editing()) pops.forEach(function (p) { p.set(true); }); });

    st.cleanup.push(function () {
      document.removeEventListener('keydown', esc);
      clearInterval(id);
      pops.forEach(function (p) { p.set(true); p.pop.classList.remove('pk-pop'); });
    });
  }

  /* ══════════════════ 아이콘 타일 고르기 ══════════════════
     좌상단 나브(부지이동·전체보기·기본위치 / 종합현황·출입동선)와 분류 바(CCTV·출입·소방·도청).
     이 자리들은 원본에 '켜진 모습'이 **그림째** 따로 그려져 있어(chart.svg ↔ group-28.svg) 겉모습을
     맞바꿀 수 없다 — 그림을 바꾸면 다른 기능의 아이콘이 되어 버린다. 그래서 켜진 자리에는
     시안이 쓰는 파랑(#016eeb — btn-floor Status=hover 값)으로 빛만 얹는다. */
  var PICK_GROUPS = ['[data-name^="item0"]', '[data-name^="item-"]', '[data-name="Nav Bar"] > *'];
  /* 이 타일이 어느 화면을 뜻하는가 — 왼쪽 나브에 한해서(글자로 잡는다, installGo 와 같은 표) */
  function navSceneOf(el) {
    var p = el.parentElement;
    if (!p || (p.dataset.name || '') !== 'Nav Bar') return null;
    var t = el.textContent || '';
    for (var i = 0; i < NAV_TO.length; i++) if (t.indexOf(NAV_TO[i][0]) >= 0) return NAV_TO[i][1];
    return null;
  }

  function installPick(root, st) {
    var cur0 = sceneOf(root);
    st.picks = [];
    PICK_GROUPS.forEach(function (sel) {
      groupSiblings(root, sel).forEach(function (items) {
        if (items.length < 2) return;
        var cur = null;
        /* 고르기를 **밖에서도** 부를 수 있게 따로 뺀다 — 분류 탭 바는 자산리스트와 짝이라
           목록에서 분류를 펴면 탭도 따라 움직여야 한다(installTree 가 st.setPick 으로 부른다). */
        var pick = function (el) {
          if (cur) cur.classList.remove('pk-picked');
          cur = el || null;
          if (cur) cur.classList.add('pk-picked');
        };
        var mine = [];
        items.forEach(function (el) {
          if (el.classList.contains('pk-pick')) return;   /* 다른 묶음에서 이미 잡았다(나브는 두 선택자에 걸린다) */
          mine.push(el);
          el.classList.add('pk-pick');
          clickable(el);
          var h = function (e) {
            if (e) e.preventDefault();
            if (editing()) return;
            pick(el === cur ? null : el);
            if (st.onPick) { try { st.onPick(el); } catch (err) {} }
          };
          var key = function (e) { if (e.key === 'Enter' || e.key === ' ') h(e); };
          el.addEventListener('click', h);
          el.addEventListener('keydown', key);
          st.cleanup.push(function () {
            el.removeEventListener('click', h); el.removeEventListener('keydown', key);
            el.classList.remove('pk-pick', 'pk-picked'); unclickable(el);
          });
        });
        if (!mine.length) return;
        st.picks.push({ items: mine, pick: pick });
        /* **지금 보고 있는 화면**과 짝인 나브 타일은 처음부터 골라 둔 것으로 — 원본 그림에는
           '켜진 출입동선'이 없어(그림째 따로다) 어느 화면에 있는지 알 길이 없었다.
           색을 새로 짓지 않고, 누를 때 쓰는 그 파란 빛을 그대로 미리 얹는다. */
        mine.forEach(function (el) { if (navSceneOf(el) === cur0) pick(el); });
      });
    });
    /* 밖에서 고르기 — 그 타일이 든 묶음을 찾아 그 묶음의 방식으로 고른다 */
    st.setPick = function (el) {
      for (var i = 0; i < st.picks.length; i++) {
        if (st.picks[i].items.indexOf(el) >= 0) { st.picks[i].pick(el); return true; }
      }
      return false;
    };
    st.clearPick = function (list) {
      for (var i = 0; i < st.picks.length; i++) {
        if (st.picks[i].items.indexOf(list) >= 0) { st.picks[i].pick(null); return true; }
      }
      return false;
    };
  }

  /* ══════════════════ 헤더 메뉴 고르기 ══════════════════
     SOP · 운영현황 · 에디터 · 관리자 · 로그아웃. 켜진 것(SOP)과 꺼진 것의 **속 구조가 달라**
     겉모습 맞바꾸기(installSelect)가 거부한다. 그래서 색을 새로 짓지 않고 **이 화면에서 읽어 둔**
     켜짐/꺼짐 값(판 색 · 글자색)을 그대로 옮긴다. */
  function installMenuPick(root, st) {
    var items = all(root, '[data-name^="Menu Item/"]');
    if (items.length < 2) return;
    var look = function (el) {
      var p = one(el, 'p');
      return { bg: getComputedStyle(el).backgroundColor, fg: p ? getComputedStyle(p).color : null };
    };
    /* 켜진 것 = 판 색이 가장 선명한 것(원본은 SOP) */
    var onIdx = 0, best = -1;
    items.forEach(function (el, i) { var s = sat(getComputedStyle(el).backgroundColor); if (s > best) { best = s; onIdx = i; } });
    var ON = look(items[onIdx]);
    var OFF = look(items[(onIdx + 1) % items.length]);
    if (!ON.fg || !OFF.fg || ON.bg === OFF.bg && ON.fg === OFF.fg) return;   /* 구분이 없으면 건드리지 않는다 */
    var paint = function (el, L) {
      el.style.backgroundColor = L.bg;
      all(el, 'p').forEach(function (p) { p.style.color = L.fg; });
    };
    var cur = items[onIdx];
    items.forEach(function (el) {
      var h = function (e) {
        if (e) e.preventDefault();
        if (editing() || el === cur) return;
        paint(cur, OFF);
        paint(el, ON);
        cur = el;
      };
      var key = function (e) { if (e.key === 'Enter' || e.key === ' ') h(e); };
      clickable(el);
      el.addEventListener('click', h);
      el.addEventListener('keydown', key);
      st.cleanup.push(function () {
        el.removeEventListener('click', h); el.removeEventListener('keydown', key);
        el.style.removeProperty('background-color');
        all(el, 'p').forEach(function (p) { p.style.removeProperty('color'); });
        unclickable(el);
      });
    });
  }

  /* ══════════════════ 표의 줄 고르기 ══════════════════
     원본 출입동선 표에는 '고른 줄'이 그려져 있다 — 칸(Td)마다 rgba(25,78,214,.3) 이 깔린다.
     색을 새로 짓지 않고 그 값을 그대로 쓴다(화면에 그 줄이 있으면 실측해서, 없으면 아래 기본값).
     installSelect(겉모습 맞바꾸기)로는 안 된다 — 출입동선 표의 나머지 줄은 '빈 줄'이라
     맞바꾸면 내용이 딸려 옮겨 간다. 그래서 칸 색만 옮긴다. */
  var ROW_ON = 'rgba(25, 78, 214, 0.3)';       /* Figma: Row (Selected) 의 Td 배경 */
  function installRowSelect(root, st) {
    var ref = one(root, '[data-name="Row (Selected)"]');
    var refCell = ref && one(ref, '[data-name^="Td/"]');
    var ON = refCell ? getComputedStyle(refCell).backgroundColor : ROW_ON;
    var cells = function (row) { return all(row, '[data-name^="Td/"]'); };
    all(root, '[data-name="Rows"]').forEach(function (rows) {
      var items = Array.prototype.filter.call(rows.children, function (c) { return /^Row/.test(c.dataset.name || ''); });
      if (items.length < 2) return;
      /* 빈 줄만 있는 표(출입동선)는 고를 것이 없다 — 글자가 있는 줄이 둘 이상일 때만 붙인다 */
      var filled = items.filter(function (r) { return (r.textContent || '').trim().length > 0; });
      if (filled.length < 2) return;
      var off = null;
      var plain = filled.find(function (r) { return !/\(Selected\)/.test(r.dataset.name || ''); });
      var plainCell = plain && one(plain, '[data-name^="Td/"]');
      if (plainCell) off = getComputedStyle(plainCell).backgroundColor;
      var cur = items.find(function (r) { return /\(Selected\)/.test(r.dataset.name || ''); }) || null;
      var paint = function (row, color) {
        cells(row).forEach(function (td) {
          if (color) td.style.backgroundColor = color; else td.style.removeProperty('background-color');
        });
      };
      filled.forEach(function (row) {
        var h = function () {
          if (editing() || row === cur) return;
          if (cur) paint(cur, off);            /* 앞서 골라 둔 줄은 보통 줄 색으로 */
          paint(row, ON);
          cur = row;
        };
        row.addEventListener('click', h);
        st.cleanup.push(function () { row.removeEventListener('click', h); paint(row, null); });
      });
    });
  }

  /* ══════════════════ 라디오(비인가 · 일반) ══════════════════
     두 항목은 판 색이 똑같고 **점 그림만** 다르다(켜진 점 ↔ 빈 점). 그래서 겉모습 비교로는
     어느 쪽이 켜졌는지 못 가린다 → 점 그림을 서로 맞바꾼다(원본 두 그림 그대로). */
  var RADIOS = [['[data-name="Item/Unauthorized"]', '[data-name="Item/General"]']];
  function installRadio(root, st) {
    RADIOS.forEach(function (pair) {
      var els = pair.map(function (s) { return one(root, s); }).filter(Boolean);
      if (els.length < 2) return;
      var cur = els[0];
      els.forEach(function (el) {
        var h = function (e) {
          if (e) e.preventDefault();
          if (editing() || el === cur) return;
          var a = one(el, 'img'), b = one(cur, 'img');
          if (a && b) swapSrc(a, b);
          el.setAttribute('aria-checked', 'true');
          cur.setAttribute('aria-checked', 'false');
          cur = el;
        };
        var key = function (e) { if (e.key === 'Enter' || e.key === ' ') h(e); };
        clickable(el, null, 'radio');
        el.addEventListener('click', h);
        el.addEventListener('keydown', key);
        st.cleanup.push(function () { el.removeEventListener('click', h); el.removeEventListener('keydown', key); unclickable(el); });
      });
    });
  }

  /* ══════════════════ 자산리스트 — 분류를 한 번에 하나씩 ══════════════════
     자산리스트 판(Widget/Asset List)은 **위의 분류 탭 바(CCTV · 출입 · 소방 · 도청)와 한 벌**인데
     둘이 이어져 있지 않았다 — 탭은 파란 빛만 얹히고 목록은 늘 소방센서(20) 그대로였고,
     목록의 'CCTV(97)' 은 마우스만 반응하고 눌러도 아무 일이 없었다(목록이 딸린 분류만 접혔다).
     이제 셋을 한 벌로 묶는다.
       · 분류는 **한 번에 하나만 펴진다** — 하나를 열면 같은 판의 나머지는 접힌다(탭처럼 한 단씩).
       · 목록이 없는 분류도 **눌리는 자리**다(줄 전체가 머리글, 초점 · 손가락 커서 · aria-expanded).
       · 탭 바를 누르면 그 분류로 들어가고, 목록에서 분류를 열면 탭 바가 따라 움직인다.
     원본에 목록이 있는 분류는 CCTV · 소방 둘뿐이다. 출입 · 도청 탭에는 보여 줄 목록이 없으므로
     **없는 목록을 지어내지 않고** 분류를 전부 접는다. */
  /* 분류 이름의 뒷자락 — Category/Fire Sensor (Expanded) → 'fire sensor (expanded)' */
  function catKey(cat) {
    var n = cat.dataset.name || '';
    var k = n.indexOf('/');
    return (k >= 0 ? n.slice(k + 1) : n).toLowerCase();
  }
  /* 분류 탭 타일의 이름 — item-cctv_off → 'cctv' (원본이 붙여 둔 이름을 그대로 쓴다) */
  function tabKey(tile) {
    var inner = one(tile, '[data-name^="item-"]');
    var n = inner ? (inner.dataset.name || '') : '';
    n = n.split('item-').join('');
    var u = n.indexOf('_');
    if (u >= 0) n = n.slice(0, u);
    return n.toLowerCase();
  }

  function installTree(root, st) {
    var cats = all(root, '[data-name^="Category/"]');
    if (!cats.length) return;
    var reg = [];
    cats.forEach(function (cat) {
      /* 머리글이 따로 없는 분류(접힌 CCTV)는 **그 줄 전체**가 머리글이다 — 안 그러면
         글자 위를 눌렀을 때 바탕(Background)까지 클릭이 안 내려가 '눌리지 않는 분류'가 된다. */
      var head = one(cat, '[data-name="Header"]') || cat;
      var items = Array.prototype.filter.call(cat.children, function (c) { return /^Item/.test(c.dataset.name || ''); });
      var chev = one(cat, '[data-name="Icon/Action/Chevron"]');
      if (chev) chev.classList.add('pk-chev');
      /* 높이는 배율을 안 타는 offsetHeight 로 잰다(화면이 축소돼 있어도 같은 값) */
      var full = cat.offsetHeight, shut = head === cat ? full : head.offsetHeight;
      if (items.length) { cat.classList.add('pk-fold-list'); cat.style.height = full + 'px'; }
      var e = { cat: cat, head: head, chev: chev, items: items, full: full, shut: shut, key: catKey(cat), open: !!items.length };
      e.apply = function () {
        if (e.items.length) {
          e.cat.style.height = (e.open ? e.full : e.shut) + 'px';
          e.items.forEach(function (x) { x.classList.toggle('pk-fadeout', !e.open); });
        }
        if (e.chev) e.chev.classList.toggle('pk-chev-off', !e.open);
        e.head.setAttribute('aria-expanded', e.open ? 'true' : 'false');
      };
      reg.push(e);
    });
    if (!reg.length) return;

    /* 분류 탭 바(CCTV · 출입 · 소방 · 도청) — 원본 이름으로 목록의 분류와 짝을 맞춘다.
       'cctv' ↔ Category/CCTV, 'fire' ↔ Category/Fire Sensor. 짝이 없는 탭(출입 · 도청)은
       원본에 목록이 아예 없다 — 없는 목록을 지어내지 않고, 고르면 분류를 전부 접는다. */
    var bar = all(root, '[data-name="Category Bar"] > *');
    var tabOf = function (key) {
      if (!key) return null;
      for (var i = 0; i < bar.length; i++) if (key.indexOf(tabKey(bar[i])) === 0 && tabKey(bar[i])) return bar[i];
      return null;
    };
    var catOfTab = function (tile) {
      var k = tabKey(tile);
      if (!k) return null;
      for (var i = 0; i < reg.length; i++) if (reg[i].key.indexOf(k) === 0) return reg[i];
      return null;
    };
    var syncBar = function (e) {
      if (!st.setPick || !bar.length) return;
      var tile = e ? tabOf(e.key) : null;
      if (tile) st.setPick(tile);
      else if (st.clearPick && bar[0]) st.clearPick(bar[0]);
    };

    /* **한 번에 하나만 편다** — 한 판(Body) 안의 분류는 탭처럼 서로를 밀어낸다.
       예전엔 각 분류가 따로 놀아, 열려 있는 분류 위에 또 열려 '어디로 들어간 건지' 알 수 없었다. */
    var show = function (e) {
      reg.forEach(function (x) { if (x.cat.parentElement === e.cat.parentElement) x.open = (x === e); });
      reg.forEach(function (x) { x.apply(); });
      syncBar(e);
      if (st.rowHot) setTimeout(st.rowHot, 340);         /* 접히면 잘리는 줄도 바뀐다 */
    };
    var shutAll = function (p) {
      reg.forEach(function (x) { if (!p || x.cat.parentElement === p) x.open = false; });
      reg.forEach(function (x) { x.apply(); });
      if (st.rowHot) setTimeout(st.rowHot, 340);
    };

    /* 처음 모습을 한 번 찍어 둔다 — 셰브론 방향과 aria-expanded 가 목록 상태와 맞아야
       읽는 기계도 '지금 펴진 분류'를 안다(예전엔 누르기 전까지 둘이 어긋나 있었다). */
    reg.forEach(function (x) { x.apply(); });

    reg.forEach(function (e) {
      var h = function (ev) {
        if (ev) ev.preventDefault();
        if (editing()) return;
        if (e.open) { e.open = false; e.apply(); syncBar(null); if (st.rowHot) setTimeout(st.rowHot, 340); }
        else show(e);
      };
      var key = function (ev) { if (ev.key === 'Enter' || ev.key === ' ') h(ev); };
      clickable(e.head, '이 분류 열기 / 닫기');
      e.head.addEventListener('click', h);
      e.head.addEventListener('keydown', key);
      st.cleanup.push(function () {
        e.head.removeEventListener('click', h); e.head.removeEventListener('keydown', key);
        unclickable(e.head);
        e.cat.classList.remove('pk-fold-list'); e.cat.style.removeProperty('height');
        e.items.forEach(function (x) { x.classList.remove('pk-fadeout'); });
        if (e.chev) e.chev.classList.remove('pk-chev', 'pk-chev-off');
      });
    });

    /* 탭 바를 누르면 그 분류로 들어간다(installPick 이 고른 뒤에 불러 준다) */
    if (bar.length) {
      var prev = st.onPick;
      st.onPick = function (el) {
        if (prev) { try { prev(el); } catch (err) {} }
        if (bar.indexOf(el) < 0) return;
        var e = catOfTab(el);
        if (e) show(e);
        else shutAll(reg[0].cat.parentElement);          /* 그 분류의 목록이 원본에 없다 */
      };
      st.cleanup.push(function () { st.onPick = prev; });
      /* 처음 화면에서 펴져 있는 분류(소방센서)에 탭 바를 맞춰 둔다 — 원본은 넷 다 꺼진 그림이라
         목록은 소방센서를 보여 주는데 탭은 아무것도 안 골라진 상태였다. */
      var open0 = null;
      reg.forEach(function (x) { if (x.open && !open0) open0 = x; });
      if (open0) syncBar(open0);
    }
  }

  /* ══════════════════ 접기·펴기 ══════════════════ */

  /* ① 이벤트 현황(하단 바) — Fold 단추를 누르면 머리글만 남기고 서랍처럼 내려간다.
     내려갈 양은 '재서' 정한다(머리글 아래부터 판 끝까지). */
  function installFold(root, st) {
    var panel = one(root, '[data-name^="Event Panel"]');
    if (!panel) return;
    var btn = one(panel, '[data-name="Button/Dropdown"]');
    if (!btn) return;
    panel.classList.add('pk-eventlog');
    var head = one(panel, '[data-name="Header"]');
    var lift = function () {
      var pr = panel.getBoundingClientRect(), k = pr.height / (panel.offsetHeight || 1) || 1;
      if (!head) return Math.round(panel.offsetHeight * 0.72);
      var hr = head.getBoundingClientRect();
      return Math.max(0, Math.round(panel.offsetHeight - ((hr.bottom - pr.top) / k + 18)));
    };
    var open = true;
    var apply = function () {
      panel.style.setProperty('--pk-lift', (open ? 0 : lift()) + 'px');
      btn.classList.toggle('pk-flip', !open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.title = open ? '이벤트 현황 접기' : '이벤트 현황 펼치기';
    };
    btn.classList.add('pk-foldbtn');
    clickable(btn);
    var toggle = function (e) {
      if (e) e.preventDefault();
      if (editing()) return;
      open = !open;
      apply();
      /* 서랍이 다 내려간 뒤 — 판 밖으로 나간 줄에서 호버를 걷는다(위 markRowsHot) */
      if (st.rowHot) setTimeout(st.rowHot, 460);
    };
    var key = function (e) { if (e.key === 'Enter' || e.key === ' ') toggle(e); };
    btn.addEventListener('click', toggle);
    btn.addEventListener('keydown', key);
    apply();
    st.cleanup.push(function () {
      btn.removeEventListener('click', toggle); btn.removeEventListener('keydown', key);
      panel.classList.remove('pk-eventlog'); panel.style.removeProperty('--pk-lift'); unclickable(btn);
    });
    st.refold = apply;
  }

  /* ② 좌측 층 선택 패널 · 우측 자산정보현황 — 접기 단추를 누르면 제목만 남는다
        (Figma 의 content01 Status=close 와 같은 모습). 높이는 재서 정한다. */
  function installCollapse(root, st) {
    /* 접기 단추는 Figma 컴포넌트(Button/Collapse)라 뿌리에 data-name 이 없다 → 노드 id 로 찾는다.
       층 선택 쪽은 인스턴스에 걸린 회전(-90°)이 design context 에 안 실려 있어 rot 로 세워 준다. */
    [
      { host: '[data-node-id$="17:9544"]', btn: '[data-node-id$="17:13303"]', body: '[data-node-id$="17:9453"]',
        keep: '[data-name="Widget Title"]', hide: '[data-name="Groups"]', rot: true },
      { host: '[data-name="Widget/Asset Summary"]', btn: '[data-name="btn-arrow"]', body: '[data-name="section"]',
        keep: '[data-name="title"]', hide: null, rot: false },
    ].forEach(function (S) {
      var host = one(root, S.host);
      if (!host) return;
      var btn = one(host, S.btn) || one(host, '[data-name="Button/Collapse"]');
      var body = one(host, S.body) || host.firstElementChild;
      var keep = S.keep ? one(host, S.keep) : null;
      if (!btn || !body || !keep) return;
      if (S.rot) btn.classList.add('pk-rot90');
      btn.classList.add('pk-foldbtn');
      var full = body.offsetHeight;
      var hostFull = host.offsetHeight;
      /* 접었을 때의 높이 = 제목 아래까지 + 원본 패딩 */
      var pr = body.getBoundingClientRect(), kr = keep.getBoundingClientRect();
      var k = pr.height / (body.offsetHeight || 1) || 1;
      var shut = Math.max(28, Math.round((kr.bottom - pr.top) / k + 12));
      /* 접었을 때 감출 것 — 표에 적힌 자리가 있으면 그것, 없으면 '제목이 아닌 본문 묶음' */
      var hidden = S.hide ? all(host, S.hide)
        : Array.prototype.filter.call(body.children, function (el) { return el !== keep && !el.contains(keep); });
      hidden.forEach(function (el) { el.classList.add('pk-fadeout'); });
      body.classList.add('pk-collapsible');
      body.style.height = full + 'px';
      var open = true;
      var apply = function () {
        body.style.height = (open ? full : shut) + 'px';
        host.classList.toggle('pk-collapsed', !open);
        body.classList.toggle('pk-collapsed', !open);
        btn.classList.toggle('pk-flip', !open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (!S.rot) host.style.height = (open ? hostFull : shut) + 'px';
      };
      clickable(btn, '접기 / 펴기');
      var toggle = function (e) { if (e) e.preventDefault(); if (editing()) return; open = !open; apply(); };
      var key = function (e) { if (e.key === 'Enter' || e.key === ' ') toggle(e); };
      btn.addEventListener('click', toggle);
      btn.addEventListener('keydown', key);
      st.cleanup.push(function () {
        btn.removeEventListener('click', toggle); btn.removeEventListener('keydown', key);
        body.classList.remove('pk-collapsible', 'pk-collapsed'); body.style.height = '';
        host.classList.remove('pk-collapsed'); host.style.height = '';
        hidden.forEach(function (el) { el.classList.remove('pk-fadeout'); });
        unclickable(btn);
      });
    });
  }

  /* ══════════════════ 알림 티커 ══════════════════
     이 판은 원본 설계상 '티커'다(상자가 overflow:clip 이고 글자는 nowrap).
     그래서 글자는 **늘 흐른다** — 오른쪽에서 들어와 왼쪽으로 빠지고 다시 들어온다.
     · 내용은 지어내지 않는다. 원본 한 줄을 그대로 돌린다.
     · 자리는 transform 이 아니라 CSS translate 속성으로 옮긴다 —
       원본이 걸어 둔 transform: translateY(-50%) 를 덮어쓰면 글자가 위로 튄다.
     · 글자 폭은 conv.js 가 Figma 값(367px)으로 못 박아 두었다. 실제 글자 길이는
       그 안의 <p> 의 scrollWidth 로 잰다(상자와 같아 보여도 실제로는 더 길 수 있다). */
  var TICKER_SPEED = 42;        /* px/초 — 읽히는 속도 */
  var TICKER_GAP = 64;          /* 한 바퀴 사이의 여백 */
  function installTicker(root, st) {
    var box = one(root, '[data-name="ticker_txt"]');
    if (!box) return;
    var txt = box.firstElementChild;
    if (!txt) return;
    var p = txt.querySelector('p') || txt;
    /* 화면이 축소돼 있어도 배치 좌표로 재야 한다 — offset* 은 배율을 타지 않는다 */
    var bw = box.offsetWidth || 0;
    var tw = Math.max(p.scrollWidth || 0, txt.offsetWidth || 0);
    if (!bw || !tw) return;
    txt.classList.add('pk-marquee');
    /* 처음에는 원래 자리에서 시작해 읽히게 두고, 그대로 왼쪽으로 흘러 나간다 */
    var x = 0, raf = 0, last = 0;
    var step = function (now) {
      raf = requestAnimationFrame(step);
      if (!last) { last = now; return; }
      var dt = Math.min(64, now - last); last = now;
      if (editing() || idle()) return;
      x -= dt * TICKER_SPEED / 1000;
      if (x < -(tw + TICKER_GAP)) x = bw;      /* 다 빠지면 오른쪽 끝에서 다시 들어온다 */
      txt.style.translate = x.toFixed(1) + 'px 0';
    };
    raf = requestAnimationFrame(step);
    /* 판 전체도 경보처럼 숨 쉰다(밝기만) */
    var bar = one(root, '[data-name="Alert Ticker"]');
    if (bar) bar.classList.add('pk-tickerbar');
    st.cleanup.push(function () {
      cancelAnimationFrame(raf);
      txt.style.translate = '';
      txt.classList.remove('pk-marquee');
      if (bar) bar.classList.remove('pk-tickerbar');
    });
  }

  /* 알림 티커 왼쪽의 경고 심볼 — 커졌다 작아지고 링이 퍼진다(경보등).
     크기·링만 움직이고 그림·색·자리는 원본 그대로다. */
  function installBeacon(root, st) {
    var sym = one(root, '[data-node-id="1:454"]') || one(root, '[data-name="Alert Ticker"] [data-node-id$="1:454"]');
    if (!sym) return;
    if (getComputedStyle(sym).position === 'static') sym.style.position = 'relative';
    sym.classList.add('pk-beacon');
    st.cleanup.push(function () { sym.classList.remove('pk-beacon'); });
  }

  /* ══════════════════ 라이브 데이터 ══════════════════
     원본 값을 기준으로 작은 폭으로만 흔든다 — 합계가 원본과 크게 어긋나 보이지 않게. */
  function collectCounters(root) {
    var out = [];
    var push = function (el, spread, min) {
      if (!el) return;
      var v = numOf(el.textContent);
      if (v == null) return;
      el.classList.add('pk-num');
      out.push({ el: el, base: v, cur: v, spread: spread, min: min == null ? 0 : min, src: el.textContent });
    };
    /* 이벤트 등급 카운트(CR·MA·MI·WA·NO) — 칩 안의 둘째 글자가 숫자다 */
    all(root, '[data-name^="Count/"]').forEach(function (chip) {
      var ps = all(chip, 'p').filter(function (p) { return numOf(p.textContent) != null; });
      if (ps.length) push(ps[ps.length - 1], 6, 0);
    });
    /* 자산정보현황 — 위 칸이 '이상', 아래 칸이 '전체'. 이상만 흔들고 전체는 거의 그대로 둔다 */
    all(root, '[data-name="Widget/Asset Summary"] [data-name="txt"]').forEach(function (t) {
      var ps = all(t, 'p');
      if (ps[0]) push(ps[0], 4, 0);
      if (ps[1]) push(ps[1], 0.01);
    });
    var seen = [];
    return out.filter(function (c) { if (seen.indexOf(c.el) >= 0) return false; seen.push(c.el); return true; });
  }

  function installCounters(root, st) {
    var cs = collectCounters(root);
    if (!cs.length) return;
    var step = function () {
      if (editing()) return;
      cs.forEach(function (c) {
        if (Math.random() > 0.4) return;
        var span = c.spread < 1 ? Math.max(1, c.base * c.spread) : c.spread;
        var target = clamp(Math.round(c.base + rnd(-span, span)), c.min, c.base + span * 1.6);
        if (Math.abs(target - c.cur) < 0.5) return;
        var from = c.cur;
        c.cur = target;
        tween(900, from, target, function (v) { setNum(c.el, v, c.src); });
      });
    };
    var id = every(3200, step);
    setTimeout(step, 1200);
    st.cleanup.push(function () { clearInterval(id); });
  }

  /* 이벤트 표 — 새 줄이 위로 들어오는 것처럼 보이게 한다.
     줄을 지어내지 않는다: 맨 아래 줄을 맨 위로 옮기고 발생시각만 '지금'으로 다시 찍는다. */
  function installFeed(root, st) {
    var rows = one(root, '[data-name="Rows"]');
    if (!rows) return;
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var stamp = function (row) {
      var cell = one(row, '[data-name="Td/Time"] p') || one(row, '[data-name="Td/Time"]');
      if (!cell) return;
      var d = new Date();
      cell.textContent = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
        + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    };
    var step = function () {
      if (editing()) return;
      var kids = Array.prototype.filter.call(rows.children, function (el) { return el.nodeType === 1; });
      if (kids.length < 2) return;
      var last = kids[kids.length - 1];
      rows.insertBefore(last, rows.firstElementChild);
      stamp(last);
      last.classList.remove('pk-newrow');
      void last.offsetWidth;
      last.classList.add('pk-newrow');
      /* 자리가 한 칸씩 밀렸다 — 이제 어느 줄이 판 밖으로 잘리는지 다시 잰다 */
      if (st.rowHot) st.rowHot();
    };
    var id = every(7000, step);
    st.cleanup.push(function () { clearInterval(id); });
  }

  /* ══════════════════ 날짜 고르기(출입동선 필터) ══════════════════
     시안의 날짜 칸은 '11/15/2024' 라는 **글자**일 뿐이었다 — 달력 아이콘이 그려져 있는데 눌러도
     아무 일이 없고, 날짜는 시안을 만든 날에 멈춰 있었다. 둘 다 고친다.
       ① 열 때마다 **오늘**로 다시 찍는다(이벤트 시각을 다시 찍는 것과 같은 뜻).
          그리고 그 판의 표(출입동선 · 출입내역)도 같은 날로 옮긴다 — 필터가 오늘인데
          목록만 보름 전이면 화면이 앞뒤가 안 맞는다. 줄 사이 간격은 원본 그대로 둔다.
       ② 달력은 **브라우저가 가진 날짜 선택기**를 쓴다. 시안에 달력 판이 그려져 있지 않으므로
          없는 형상을 지어내지 않는다 — 날짜 칸 위에 투명한 input[type=date] 를 덮으면
          누르는 자리는 원본 그대로이고, 키보드로도 열린다.
     글자 모양은 원본을 따른다(구분자 · 연/월/일 차례 · 두 자리 채움까지). */
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function readDate(s) {
    var t = (s || '').trim();
    var sep = t.indexOf('/') >= 0 ? '/' : t.indexOf('-') >= 0 ? '-' : t.indexOf('.') >= 0 ? '.' : null;
    if (!sep) return null;
    var a = t.split(sep);
    if (a.length !== 3) return null;
    var n0 = +a[0], n1 = +a[1], n2 = +a[2];
    if (n0 !== n0 || n1 !== n1 || n2 !== n2) return null;            /* 숫자가 아니다 */
    var ymd = a[0].length === 4;                                     /* 앞이 네 자리면 연도부터 */
    return { y: ymd ? n0 : n2, m: ymd ? n1 : n0, d: ymd ? n2 : n1, sep: sep, ymd: ymd };
  }
  function writeDate(f, y, m, d) {
    return f.ymd ? y + f.sep + pad2(m) + f.sep + pad2(d)
      : pad2(m) + f.sep + pad2(d) + f.sep + y;
  }
  /* 글자를 담은 맨 안쪽 <p> 만 고른다 — 같은 이름의 껍데기에 쓰면 안쪽이 통째로 날아간다
     (팝업 제목에서 한 번 겪었다). */
  function leafText(el) {
    var out = [];
    all(el, 'p').forEach(function (p) { if (!one(p, 'p') && (p.textContent || '').trim()) out.push(p); });
    return out;
  }

  function installDate(root, st) {
    var field = one(root, '[data-name="Date Field"]');
    if (!field) return;
    var txt = leafText(field)[0];
    if (!txt) return;
    var fmt = readDate(txt.textContent);
    if (!fmt) return;

    /* 이 날짜가 다스리는 표 — 날짜 칸이 든 판 안의 시각 칸만(아래 이벤트 현황은 제 시각을 따른다) */
    var panel = field.closest('[data-name^="Panel/"]') || field.closest('[data-name^="Widget/"]');
    var cells = function () {
      if (!panel) return [];
      var out = [];
      all(panel, '[data-name="Td/Time"]').forEach(function (td) {
        leafText(td).forEach(function (p) { out.push(p); });
      });
      return out;
    };
    var moveRows = function (when) {
      if (typeof window.wembRestampTimes !== 'function') return;
      var list = cells();
      if (!list.length) return;
      try { window.wembRestampTimes(list, { now: when.getTime() }); } catch (e) {}
    };

    var apply = function (y, m, d, moveTable) {
      txt.textContent = writeDate(fmt, y, m, d);
      if (moveTable) {
        var t = new Date();
        moveRows(new Date(y, m - 1, d, t.getHours(), t.getMinutes(), t.getSeconds()));
      }
    };

    var now = new Date();
    apply(now.getFullYear(), now.getMonth() + 1, now.getDate(), true);

    var inp = document.createElement('input');
    inp.type = 'date';
    inp.className = 'pk-datepick';
    inp.setAttribute('aria-label', '날짜 고르기');
    inp.value = now.getFullYear() + '-' + pad2(now.getMonth() + 1) + '-' + pad2(now.getDate());
    if (getComputedStyle(field).position === 'static') field.style.position = 'relative';
    field.classList.add('pk-click', 'pk-lit');
    if (!field.title) field.title = '날짜 고르기';
    field.appendChild(inp);

    var onChange = function () {
      if (editing()) return;
      var a = (inp.value || '').split('-');
      if (a.length !== 3) return;
      apply(+a[0], +a[1], +a[2], true);
      if (st.rowHot) setTimeout(st.rowHot, 60);
    };
    /* 덮어 둔 입력은 눌러도 달력이 저절로 열리지 않는다(브라우저는 제 아이콘만 연다)
       — 누르면 우리가 연다. showPicker 가 없는 브라우저에서는 초점만 준다. */
    var onClick = function () {
      if (editing()) return;
      /* preventDefault 는 걸지 않는다 — 막으면 showPicker 가 없는 브라우저에서 제 동작(초점)까지 막힌다 */
      try { inp.showPicker(); } catch (err) { inp.focus(); }
    };
    inp.addEventListener('change', onChange);
    inp.addEventListener('click', onClick);
    st.cleanup.push(function () {
      inp.removeEventListener('change', onChange);
      inp.removeEventListener('click', onClick);
      if (inp.parentNode) inp.parentNode.removeChild(inp);
      field.classList.remove('pk-click', 'pk-lit');
      field.removeAttribute('title');
      field.style.removeProperty('position');
    });
  }

  /* ══════════════════ 건물 고르기(종합현황의 '본관') ══════════════════
     원본의 건물 칸은 글자 '본관' + 셰브론뿐이고 **펼칠 목록이 그려져 있지 않다**. 날짜 칸과 같은 방법으로
     칸 위에 투명한 진짜 <select> 를 덮는다 — 보이는 것은 시안 그대로, 열리는 목록은 브라우저 것이다.
     **건물 이름을 지어내지 않는다.** 전체층 화면 사이드바에 건물이 둘 그려져 있고(list01 본관 · list02 별관)
     각자의 층 목록까지 있다 — 본관 지하1층·1~13층, 별관 지하1층·1~4층. 그 둘만 쓴다.
     종합현황 표는 본관 것(PH · 8~1층 · B1~B4층)이라
       · 본관을 고르면 **원본 그대로** 두고,
       · 별관을 고르면 **별관이 가진 층만 남기고** 이름의 건물만 바꾼다(없는 층을 지어내지 않는다).
     두 화면이 본관의 층을 서로 다르게 그려 두었으므로(전체층엔 13층까지, 종합현황엔 PH·지하4층까지)
     **본관 쪽은 건드리지 않는 것**이 맞다 — 고르기 전 모습이 곧 원본이다. */
  var BUILDINGS = [
    { name: '본관', floors: null },                                   /* null = 원본 그대로 */
    { name: '별관', floors: ['1층', '2층', '3층', '4층', 'B1층'] },   /* 지하1층 = 표의 B1층 */
  ];

  function installBuilding(root, st) {
    var box = one(root, '[data-name="Building Selector"]');
    if (!box) return;
    var txt = leafText(box)[0];
    if (!txt) return;
    var base = (txt.textContent || '').trim();
    if (!base) return;

    /* 이 칸이 다스리는 표 — 같은 판(팝업) 안의 줄들 */
    var panel = box.closest('[data-name^="Popup/"]') || box.closest('[data-name^="Widget/"]') || root;
    var rows = all(panel, '[data-name="Rows"] > [data-name="Row"]');
    /* 원본 글자를 적어 둔다 — 본관으로 되돌리면 한 글자도 안 달라져야 한다 */
    var labels = [];
    rows.forEach(function (r) {
      var p = leafText(r)[0];
      if (p) labels.push({ row: r, p: p, was: p.textContent });
    });

    var pick = function (name) {
      var b = null;
      for (var i = 0; i < BUILDINGS.length; i++) if (BUILDINGS[i].name === name) b = BUILDINGS[i];
      if (!b) return;
      txt.textContent = b.name;
      labels.forEach(function (L) {
        var rest = L.was.indexOf(base) === 0 ? L.was.slice(base.length) : null;
        if (rest === null) return;                       /* 건물 이름으로 시작하지 않는 줄은 그대로 */
        if (!b.floors) {                                 /* 원본 그대로 */
          L.p.textContent = L.was;
          L.row.classList.remove('pk-rowhide');
          return;
        }
        var floor = rest.replace(' ', '');               /* '본관 B1층' → 'B1층' */
        var has = b.floors.indexOf(floor) >= 0;
        L.row.classList.toggle('pk-rowhide', !has);
        if (has) L.p.textContent = b.name + rest;
      });
      if (st.rowHot) setTimeout(st.rowHot, 60);
    };

    var sel = document.createElement('select');
    sel.className = 'pk-buildpick';
    sel.setAttribute('aria-label', '건물 고르기');
    BUILDINGS.forEach(function (b) {
      var o = document.createElement('option');
      o.value = b.name; o.textContent = b.name;
      if (b.name === base) o.selected = true;
      sel.appendChild(o);
    });
    if (getComputedStyle(box).position === 'static') box.style.position = 'relative';
    box.classList.add('pk-click', 'pk-lit');
    if (!box.title) box.title = '건물 고르기';
    box.appendChild(sel);

    var onChange = function () { if (editing()) return; pick(sel.value); };
    sel.addEventListener('change', onChange);
    st.cleanup.push(function () {
      sel.removeEventListener('change', onChange);
      if (sel.parentNode) sel.parentNode.removeChild(sel);
      txt.textContent = base;
      labels.forEach(function (L) { L.p.textContent = L.was; L.row.classList.remove('pk-rowhide'); });
      box.classList.remove('pk-click', 'pk-lit');
      box.removeAttribute('title');
      box.style.removeProperty('position');
    });
  }

  /* 시안에 박힌 발생시각을 열 때마다 최근으로 다시 찍는다(공용 src/recent-time.js).
     시계·가로축은 건드리지 않는다 — 이벤트 표의 '시간' 칸만 넘긴다. */
  function installRestamp(root) {
    if (typeof window.wembRestampTimes !== 'function') return;
    var cells = all(root, '[data-name="Td/Time"] p');
    if (!cells.length) return;
    try { window.wembRestampTimes(cells, {}); } catch (e) { }
  }

  /* ══════════════════ 살리기 ══════════════════ */
  function initPosco(root) {
    if (!root) return;
    if (root.__pkLive) disposePosco(root);
    injectStyle();
    root.classList.add('pk-root');
    var st = { cleanup: [] };
    root.__pkLive = st;
    try { installFit(root, st); } catch (e) { }
    try { installWideFit(root, st); } catch (e) { }   /* 판 안쪽 1920 고정 풀기 — 맞추기(fit) 뒤에 */
    try { installSop(root, st); } catch (e) { }       /* SOP STEP 1~3 겹치기 · 컨트롤 바 — 호버 표시(markHot) 전에 */
    try { markHot(root); } catch (e) { }
    try { installRowHot(root, st); } catch (e) { }
    try { installRestamp(root); } catch (e) { }
    try { installClock(root, st); } catch (e) { }
    try { installDate(root, st); } catch (e) { }     /* 날짜 필터 — installRestamp 뒤에(그 판만 다시 맞춘다) */
    try { installBuilding(root, st); } catch (e) { }
    try { installSelect(root, st); } catch (e) { }
    try { installFloorPick(root, st); } catch (e) { }
    try { installPick(root, st); } catch (e) { }
    try { installHeaderMenu(root, st); } catch (e) { }   /* 헤더 메뉴 — Figma btn-menu(17:13398) default / active(=마우스오버) */
    try { installRowSelect(root, st); } catch (e) { }
    try { installRadio(root, st); } catch (e) { }
    try { installTree(root, st); } catch (e) { }
    try { installPopups(root, st); } catch (e) { }
    try { installGo(root, st); } catch (e) { }       /* 화면 이동 — 다른 장치가 잡은 뒤에(제자리 팝업이 우선) */
    try { installFold(root, st); } catch (e) { }
    try { installCollapse(root, st); } catch (e) { }
    try { installTicker(root, st); } catch (e) { }
    try { installBeacon(root, st); } catch (e) { }
    try { installCounters(root, st); } catch (e) { }
    try { installFeed(root, st); } catch (e) { }
    try { installPanelMove(root, st); } catch (e) { }   /* 패널편집 — 판 끌어 옮기기 */
    return st;
  }

  function disposePosco(root) {
    var st = root && root.__pkLive;
    if (!st) return;
    st.cleanup.forEach(function (f) { try { f(); } catch (e) { } });
    root.__pkLive = null;
  }

  window.initPosco = initPosco;
  window.disposePosco = disposePosco;
  /* 스튜디오가 창 크기를 바꾼 뒤 다시 맞추라고 부를 수 있게 */
  window.refitPosco = function (root) { var st = root && root.__pkLive; if (st && st.fit) st.fit(); };
`;

const HEAD = `/* POSCO KDB CCTV 관제 — 재구축 화면(Screen/Control Main)의 인터랙션·라이브 레이어
   대상: src/posco-main.js (접두어 pkm)

   이 파일은 '형상'을 만들지 않는다. 형상·좌표·색은 전부 conv.js 가 뽑은 Figma 원본 그대로이고,
   여기서는 그 위에 다음만 얹는다.
     ① 반응형   — 1920x1080 기준을 유지한 채 캔버스를 넓혀 여백 없이 꽉 채운다(통짜 축소 아님)
     ② 실시간 시계
     ③ 마우스 오버 / 눌림 / 고르기
     ④ 접기·펴기 — 이벤트 현황(Fold) · 층 선택 패널 · 자산정보현황
     ⑤ 알림 티커 흐르기, 등급 카운트·자산 수치의 라이브 연출, 이벤트 표 피드
   전부 CSS transition/rAF 로만 움직이므로 글자 편집(패널편집)·테마 전환과 충돌하지 않는다.

   ★ 생성물이다 — 손으로 고치지 말고 \`node src/posco/_gen/mk-live.js\` 를 다시 돌릴 것.
     반응형 엔진·고르기 장치는 검증된 src/hana-live.js 에서 그대로 떠 온다(접두어만 hn→pk).

   window.initPosco(root)    — 화면 하나를 살린다(여러 번 불러도 안전)
   window.disposePosco(root) — 타이머·리스너 정리 */
(function () {
  'use strict';

`;

const SOP_CSS_PART = fs.readFileSync(path.join(GEN, 'sop-css.part.js'), 'utf8');
const SOP_LIVE_PART = fs.readFileSync(path.join(GEN, 'sop-live.part.js'), 'utf8');   /* SOP 스텝 플레이어 · 패널 이동 */
const OUT = HEAD + SOP_CSS_PART + CSS + '\n' + borrowed + '\n\n' + STRETCH + '\n' + SCREEN + SOP_LIVE_PART + '})();\n';

/* ── 내보내기 전 점검: 템플릿 문자열에서 역슬래시가 벗겨진 정규식 찾기 ──
   이 파일의 '이 시안 몫'은 통째로 백틱 문자열이라, 정규식 안의 \( \[ \] 가 한 겹 벗겨져 나간다.
   문법 오류가 아니라 **조용히 안 맞는** 정규식이 되어 두 번이나 한참 헤맸다
   (팝업 제목의 대괄호 치환 · 헤더 바탕의 matrix 판독). 대표적인 망가짐 모양을 미리 잡는다. */
const SUSPECT = [
  /* 앞에 역슬래시가 없는 `(([^)` — 성한 정규식은 `\(([^)` 라서 안 걸린다 */
  [/(^|[^\\])\(\(\[\^\)/, '괄호 이스케이프가 벗겨진 정규식 — /^matrix\\(([^)]+)\\)$/ 가 /^matrix(([^)]+))$/ 로'],
  /* 성한 것은 `[[^\]` 이므로 `[[^]` 는 벗겨진 것 */
  [/\[\[\^\]/, '대괄호 이스케이프가 벗겨진 정규식 — /\\[[^\\]]*\\]/ 가 /[[^]]*]/ 로'],
];
const bad = SUSPECT.filter(function (s) { return s[0].test(OUT); });
if (bad.length) {
  console.error('!! 생성물에 깨진 정규식이 있다 — 백틱 문자열 안에서는 정규식 대신 indexOf/slice 를 쓸 것');
  bad.forEach(function (b) { console.error('   ·', b[1]); });
  process.exitCode = 1;
}

fs.writeFileSync(path.join(STUDIO, 'src', 'posco-live.js'), OUT);
console.log('wrote src/posco-live.js', OUT.length, 'chars · 떠 온 함수',
  UTIL.length + ENGINE.length + SELECT.length, '개', bad.length ? '· ⚠ 깨진 정규식 ' + bad.length + '군데' : '');
