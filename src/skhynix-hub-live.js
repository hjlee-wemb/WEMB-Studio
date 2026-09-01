/* SK하이닉스 이천 FMS Hub 시안 — 인터랙션 · 라이브 데이터 레이어
   화면 자체(src/skhynix-hub.js)는 Figma 에서 생성한 산출물이라 손대지 않고, 상태·움직임만 여기서 얹는다.

   ── 무엇을 넣었나 ──
   1) Event List 접기/펴기 — Figma 두 프레임 대조로 나온 값 그대로:
      64:3367(펼침) top 752  ↔  138:291(접힘) top 1026  →  차이 274px 만 translateY 로 움직인다.
      화살표(#skh-Asset_61)는 펼쳐져 있을 때 180도 돌아 '내리기'를 가리키고, 접히면 원래 방향으로 돌아온다.
   2) 헤더 시계 — 실시간(초 경계에 맞춰 갱신). 자릿수가 같고 tabular-nums 라 글자가 흔들리지 않는다.
   3) 마우스 오버 — 폴드/AUTO 버튼, 등급 칩, 헤더 액션, 사이트 배지, 내비 심볼, 이벤트 행, 범례.
      전부 transform/색만 건드려 '가만히 있을 때의 그림'은 Figma 원본 그대로 유지된다.
   4) 라이브 데이터 — 전력량·사용량(추세 아이콘 포함)·게이지 바늘·센터 온도 꺾은선·컨테인먼트 막대·
      이벤트 카운트가 실제 연동된 것처럼 움직이고, AUTO 가 켜져 있으면 이벤트 행이 위에서 흘러든다.
      모든 수치는 자릿수를 유지하고, 막대/텍스트 상자 크기를 고정해 레이아웃이 밀리지 않는다.

   접근성·성능: prefers-reduced-motion 이면 데이터 루프를 돌리지 않고 전환도 끈다.
   탭이 숨겨지면 타이머를 멈추고, 화면이 DOM 에서 빠지면 스스로 정리한다. */
(function () {
  'use strict';

  /* Figma 64:3367 ↔ 138:291 대조값 */
  var FOLD_DY = 274;                                   /* 1026 - 752 */

  /* ── 반응형(꽉 채우기) 기준값 — 전부 Figma 원본 좌표에서 뽑았다 ──
     시안은 1920x1080 으로 그려졌지만 작업 영역은 16:9 가 아닐 때가 많다.
     잘라내거나 늘여서(비율 왜곡) 채우는 대신, '캔버스를 영역 비율만큼 넓혀 두고 블록을 가장자리에 다시 붙인다'.
     글자·위젯은 균일 배율(S)로만 커지므로 왜곡이 없고, 정확히 16:9 일 때는 원본과 완전히 같은 그림이 된다. */
  var DES_W = 1920, DES_H = 1080;
  var COL_L_H = 916.5;              /* 좌측 Column(64:3396) 원본 높이 */
  var COL_R_H = 906.52392578125;    /* 우측 Column(64:3570) 원본 높이 */
  var GRID_W = 1846;                /* Dashboard Grid(64:3395)·Event List 원본 폭 */
  var EV_BOTTOM = 328;              /* 1080 - 752  : 펼침 상태에서 캔버스 아래끝까지 */
  var EASE_FOLD = 'cubic-bezier(.22,.61,.36,1)';       /* 미끄러지듯 멈추는 감속 */
  var EASE_UI = 'cubic-bezier(.4,0,.2,1)';

  /* 인라인으로 바꿔 넣을 원본 에셋(값에 따라 움직여야 하는 것만).
     _gen/mk-live-assets.js 가 src/skhynix-hub/*.svg 에서 그대로 박아 넣는다. */
  /* SVG-INLINE-START */
  var SVG = {
    radio: "<svg preserveAspectRatio=\"none\" overflow=\"visible\" style=\"display: block;\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g id=\"Radio\">\n<rect width=\"16\" height=\"16\" rx=\"8\" fill=\"#EFF4F6\" fill-opacity=\"0.5\"/>\n<rect x=\"0.75\" y=\"0.75\" width=\"14.5\" height=\"14.5\" rx=\"7.25\" stroke=\"#828EA4\" stroke-opacity=\"0.5\" stroke-width=\"1.5\"/>\n<circle id=\"Dot\" cx=\"8\" cy=\"8\" r=\"3\" fill=\"#313131\"/>\n</g>\n</svg>",
    needle: "<svg preserveAspectRatio=\"none\" overflow=\"visible\" style=\"display: block;\" width=\"98.011\" height=\"58.499\" viewBox=\"0 0 98.011 58.499\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g id=\"Needle\">\n<g id=\"Vector\" filter=\"url(#filter0_d_0_197)\">\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M10 57.824C10 36.935 27.463 20 49.005 20C70.547 20 88.011 36.935 88.011 57.824\" fill=\"url(#paint0_linear_0_197)\"/>\n</g>\n<g id=\"Vector_2\" filter=\"url(#filter1_d_0_197)\">\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M35.0121 58.475C35.0121 58.438 34.1121 58.401 34.1121 58.364C34.1121 50.698 41.2801 44.484 49.0121 44.484C56.7441 44.484 63.0121 50.698 63.0121 58.364C63.0121 58.409 62.1121 58.454 63.0111 58.499\" fill=\"#313131\"/>\n</g>\n<path id=\"Vector_3\" d=\"M42.012 13.749L49.012 55.749\" stroke=\"#313131\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n</g>\n<defs>\n<filter id=\"filter0_d_0_197\" x=\"0\" y=\"0\" width=\"98.011\" height=\"57.824\" filterUnits=\"userSpaceOnUse\" color-interpolation-filters=\"sRGB\">\n<feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/>\n<feColorMatrix in=\"SourceAlpha\" type=\"matrix\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\" result=\"hardAlpha\"/>\n<feOffset dy=\"-10\"/>\n<feGaussianBlur stdDeviation=\"5\"/>\n<feColorMatrix type=\"matrix\" values=\"0 0 0 0 0.188235 0 0 0 0 0.243137 0 0 0 0 0.384314 0 0 0 0.12 0\"/>\n<feBlend mode=\"normal\" in2=\"BackgroundImageFix\" result=\"effect1_dropShadow_0_197\"/>\n<feBlend mode=\"normal\" in=\"SourceGraphic\" in2=\"effect1_dropShadow_0_197\" result=\"shape\"/>\n</filter>\n<filter id=\"filter1_d_0_197\" x=\"24.1121\" y=\"24.484\" width=\"48.9\" height=\"34.015\" filterUnits=\"userSpaceOnUse\" color-interpolation-filters=\"sRGB\">\n<feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/>\n<feColorMatrix in=\"SourceAlpha\" type=\"matrix\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\" result=\"hardAlpha\"/>\n<feOffset dy=\"-10\"/>\n<feGaussianBlur stdDeviation=\"5\"/>\n<feColorMatrix type=\"matrix\" values=\"0 0 0 0 0.188235 0 0 0 0 0.243137 0 0 0 0 0.384314 0 0 0 0.2 0\"/>\n<feBlend mode=\"normal\" in2=\"BackgroundImageFix\" result=\"effect1_dropShadow_0_197\"/>\n<feBlend mode=\"normal\" in=\"SourceGraphic\" in2=\"effect1_dropShadow_0_197\" result=\"shape\"/>\n</filter>\n<linearGradient id=\"paint0_linear_0_197\" x1=\"10\" y1=\"57.824\" x2=\"10\" y2=\"20\" gradientUnits=\"userSpaceOnUse\">\n<stop stop-color=\"#EEF1F5\"/>\n<stop offset=\"1\" stop-color=\"white\"/>\n</linearGradient>\n</defs>\n</svg>",
    lineYesterday: "<svg preserveAspectRatio=\"none\" overflow=\"visible\" style=\"display: block;\" width=\"197.02\" height=\"24\" viewBox=\"0 0 197.02 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g id=\"Line Series\">\n<path id=\"Plot Line\" opacity=\"0.5\" d=\"M5.70319 10.5L36.2932 4.5L66.8831 8L98.51 19.5L130.137 13L161.245 13.5L192.354 14.5\" stroke=\"#7D7C7D\" stroke-width=\"2\"/>\n<g id=\"Plot Point\">\n<ellipse id=\"Point\" cx=\"5.18474\" cy=\"10\" rx=\"5.18474\" ry=\"5\" fill=\"#7D7C7D\"/>\n<ellipse id=\"Point_2\" cx=\"36.2933\" cy=\"5\" rx=\"5.18474\" ry=\"5\" fill=\"#7D7C7D\"/>\n<ellipse id=\"Point_3\" cx=\"67.4017\" cy=\"8\" rx=\"5.18474\" ry=\"5\" fill=\"#7D7C7D\"/>\n<ellipse id=\"Point_4\" cx=\"98.5101\" cy=\"19\" rx=\"5.18474\" ry=\"5\" fill=\"#7D7C7D\"/>\n<ellipse id=\"Point_5\" cx=\"129.619\" cy=\"13\" rx=\"5.18474\" ry=\"5\" fill=\"#7D7C7D\"/>\n<ellipse id=\"Point_6\" cx=\"160.727\" cy=\"13\" rx=\"5.18474\" ry=\"5\" fill=\"#7D7C7D\"/>\n<ellipse id=\"Point_7\" cx=\"191.835\" cy=\"14\" rx=\"5.18474\" ry=\"5\" fill=\"#7D7C7D\"/>\n</g>\n</g>\n</svg>",
    lineToday: "<svg preserveAspectRatio=\"none\" overflow=\"visible\" style=\"display: block;\" width=\"197.02\" height=\"23\" viewBox=\"0 0 197.02 23\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g id=\"Line Series\">\n<path id=\"Plot Line\" opacity=\"0.5\" d=\"M5.70319 10.5L36.2932 4.5L67.4016 13.5L98.51 18.5L130.137 11.5L161.245 13.5L192.354 9.5\" stroke=\"#FF698E\" stroke-width=\"2\"/>\n<g id=\"Plot Point\">\n<ellipse id=\"Point\" cx=\"5.18474\" cy=\"10\" rx=\"5.18474\" ry=\"5\" fill=\"#FF698E\"/>\n<ellipse id=\"Point_2\" cx=\"36.2933\" cy=\"5\" rx=\"5.18474\" ry=\"5\" fill=\"#FF698E\"/>\n<ellipse id=\"Point_3\" cx=\"67.4017\" cy=\"13\" rx=\"5.18474\" ry=\"5\" fill=\"#FF698E\"/>\n<ellipse id=\"Point_4\" cx=\"98.5101\" cy=\"18\" rx=\"5.18474\" ry=\"5\" fill=\"#FF698E\"/>\n<ellipse id=\"Point_5\" cx=\"129.619\" cy=\"11\" rx=\"5.18474\" ry=\"5\" fill=\"#FF698E\"/>\n<ellipse id=\"Point_6\" cx=\"160.727\" cy=\"13\" rx=\"5.18474\" ry=\"5\" fill=\"#FF698E\"/>\n<ellipse id=\"Point_7\" cx=\"191.835\" cy=\"9\" rx=\"5.18474\" ry=\"5\" fill=\"#FF698E\"/>\n</g>\n</g>\n</svg>",
  };
  /* SVG-INLINE-END */

  var CSS = [
    /* ── 접기/펴기 ── */
    /* 이동값은 JS 가 인라인 transform 으로 직접 쓴다 — CSS 변수만 바꾸면 크롬이 옛 계산값을 붙들고
       전환을 다시 돌리지 않는 경우가 있다(같은 함정을 skx 시안에서도 겪었다). */
    '.skh-root.skh-live .n64_3894{transition:transform .48s ' + EASE_FOLD + ';will-change:transform;}',
    '.skh-root.skh-live .n64_3907{transition:transform .32s ' + EASE_UI + ';}',
    '.skh-root.skh-live .skh-nudge-down .n64_3907{transform:translateY(3px);}',
    '.skh-root.skh-live .skh-nudge-up .n64_3907{transform:translateY(-3px);}',
    /* 펼쳐져 있으면 화살표(#skh-Asset_61)가 180도 돌아 '내리기'를 가리킨다. 접히면 원래 방향으로 돌아온다. */
    '.skh-root.skh-live .n64_3907 img{transition:transform .46s ' + EASE_FOLD + ';transform-origin:50% 50%;}',
    '.skh-root.skh-live.skh-ev-open .n64_3907 img{transform:rotate(180deg);}',

    /* 배경·내비 묶음은 상자로 바뀌면서 화면 전체를 덮으므로 클릭을 통과시키고, 내비 심볼만 다시 받는다 */
    '.skh-root.skh-live [id="skh-Nav Cluster"] > *{pointer-events:auto;}',

    /* ── 공통: 누를 수 있는 것 ── */
    '.skh-root.skh-live [id="skh-Fold Button"],.skh-root.skh-live [id="skh-Auto Toggle"],',
    '.skh-root.skh-live [id^="skh-Chip/"],.skh-root.skh-live [id="skh-Btn"],',
    '.skh-root.skh-live [id="skh-Icon_2"],.skh-root.skh-live [id="skh-Icon_3"],',
    '.skh-root.skh-live [id^="skh-Nav Item/"],.skh-root.skh-live .skh-evrow,',
    '.skh-root.skh-live .skh-legend{cursor:pointer;}',
    '.skh-root.skh-live [tabindex]:focus-visible{outline:2px solid #6c5ce7;outline-offset:2px;border-radius:6px;}',

    /* 폴드 버튼 · AUTO */
    '.skh-root.skh-live [id="skh-Fold Button"]{transition:background-color .18s ' + EASE_UI + ',transform .18s ' + EASE_UI + ',filter .18s ' + EASE_UI + ';}',
    '.skh-root.skh-live [id="skh-Fold Button"]:hover{background-color:#f3f6fd;transform:translateY(-1px);filter:drop-shadow(0px 5px 6px rgba(21,31,42,0.18));}',
    '.skh-root.skh-live [id="skh-Fold Button"]:active{transform:translateY(0) scale(.93);}',
    '.skh-root.skh-live [id="skh-Auto Toggle"]{border-radius:15px;transition:background-color .18s ' + EASE_UI + ';}',
    '.skh-root.skh-live [id="skh-Auto Toggle"]:hover{background-color:rgba(255,255,255,.55);}',
    '.skh-root.skh-live .skh-radio-dot{transition:opacity .2s ' + EASE_UI + ',transform .2s ' + EASE_UI + ';transform-box:fill-box;transform-origin:center;}',
    '.skh-root.skh-live.skh-auto-off .skh-radio-dot{opacity:0;transform:scale(.4);}',

    /* 등급 칩 */
    '.skh-root.skh-live [id^="skh-Chip/"]{transition:transform .18s ' + EASE_UI + ',filter .18s ' + EASE_UI + ',background-color .18s ' + EASE_UI + ';}',
    '.skh-root.skh-live [id^="skh-Chip/"]:hover{transform:translateY(-1px);filter:drop-shadow(1px 3px 4px rgba(6,1,7,0.22));}',
    '.skh-root.skh-live [id^="skh-Chip/"].skh-chip-on{box-shadow:0 0 0 1.5px #6c5ce7;}',

    /* 헤더 */
    '.skh-root.skh-live [id="skh-Icon_2"],.skh-root.skh-live [id="skh-Icon_3"]{transition:transform .18s ' + EASE_UI + ',opacity .18s ' + EASE_UI + ';opacity:.9;}',
    '.skh-root.skh-live [id="skh-Icon_2"]:hover,.skh-root.skh-live [id="skh-Icon_3"]:hover{transform:scale(1.15);opacity:1;}',
    '.skh-root.skh-live [id="skh-Icon_2"]:active,.skh-root.skh-live [id="skh-Icon_3"]:active{transform:scale(.9);}',
    '.skh-root.skh-live [id="skh-Btn"]{transition:background-color .2s ' + EASE_UI + ',border-color .2s ' + EASE_UI + ';}',
    '.skh-root.skh-live [id="skh-Btn"]:hover{background-color:rgba(255,255,255,.18);border-color:rgba(200,206,214,.9);}',
    '.skh-root.skh-live [id="skh-64:3885"],.skh-root.skh-live [id="skh-64:3887"]{font-variant-numeric:tabular-nums;}',

    /* 내비 심볼 — 떠오르듯 */
    '.skh-root.skh-live [id^="skh-Nav Item/"]{transition:transform .28s ' + EASE_FOLD + ',filter .28s ' + EASE_UI + ';}',
    '.skh-root.skh-live [id^="skh-Nav Item/"]:hover{transform:translateY(-7px) scale(1.035);filter:drop-shadow(0 14px 18px rgba(60,52,120,.22));}',
    '.skh-root.skh-live [id^="skh-Nav Item/"]:active{transform:translateY(-2px) scale(.99);}',
    /* 화재(Active) 심볼에 상시 호흡 애니메이션도 넣어 봤지만, 가만히 있을 때의 그림이 Figma 와 달라져서 뺐다.
       다시 켜고 싶으면 아래 두 줄의 주석을 풀면 된다.
       '@keyframes skhBreathe{0%,100%{transform:translateY(0) scale(1);}50%{transform:translateY(-3px) scale(1.015);}}',
       '.skh-root.skh-live [id="skh-Nav Item/Fire (Active)"]{animation:skhBreathe 3.4s ease-in-out infinite;}', */

    /* 이벤트 표 */
    '.skh-root.skh-live .skh-evrow{transition:background-color .18s ' + EASE_UI + ',opacity .28s ' + EASE_UI + ',filter .28s ' + EASE_UI + ';}',
    '.skh-root.skh-live .skh-evrow:hover{background-color:#f5f7ff;}',
    '.skh-root.skh-live .skh-evrow.skh-dim{opacity:.28;filter:grayscale(.5);}',
    '.skh-root.skh-live .skh-evrow.skh-anim{transition:height .42s ' + EASE_FOLD + ',opacity .42s ' + EASE_UI + ';overflow:hidden;}',

    /* 범례 · 탭 */
    '.skh-root.skh-live .skh-legend{transition:opacity .18s ' + EASE_UI + ';}',
    '.skh-root.skh-live .skh-legend:hover{opacity:.72;}',
    '.skh-root.skh-live .skh-series-off{opacity:.12;}',
    '.skh-root.skh-live [id^="skh-Line Series"],.skh-root.skh-live [id^="skh-Today"],.skh-root.skh-live [id^="skh-Yesterday"]{transition:opacity .3s ' + EASE_UI + ';}',

    /* 차트 — 값이 바뀔 때의 전환 */
    '.skh-root.skh-live .skh-series path{transition:d .9s ' + EASE_UI + ';}',
    '.skh-root.skh-live .skh-series ellipse{transition:cy .9s ' + EASE_UI + ';}',
    '.skh-root.skh-live .skh-needle-pointer{transition:transform 1.1s ' + EASE_FOLD + ';transform-box:view-box;transform-origin:49.012px 55.749px;}',
    '.skh-root.skh-live [id^="skh-Today"]{transition:height .9s ' + EASE_UI + ',opacity .3s ' + EASE_UI + ';}',
    '.skh-root.skh-live [id^="skh-Icon/Trend/"] img{transition:opacity .25s ' + EASE_UI + ';}',

    /* 움직임을 줄이도록 설정한 환경에서는 전부 정지 */
    '@media (prefers-reduced-motion:reduce){.skh-root.skh-live *{animation:none !important;transition-duration:.01ms !important;}}',
  ].join('\n');

  /* ───────── 유틸 ───────── */
  function $(root, id) { return root.querySelector('[id="' + id + '"]'); }
  function txt(root, nodeId) { return root.querySelector('[data-node-id="' + nodeId + '"]'); }
  function comma(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches; } catch (e) {}

  /* 사용자가 '패널편집'으로 고친 글자인가? — 라이브 데이터가 남의 편집을 덮어쓰지 않게 한다.
     (직접 타이핑한 것도, 저장해 둔 수정분이 되살아난 것도 '내가 마지막에 쓴 값과 다르다'로 함께 잡힌다) */
  function claimed(el) {
    if (!el) return true;
    if (el.dataset.skhEdited === '1') return true;
    if (el.__skhLast != null && el.textContent !== el.__skhLast) { el.dataset.skhEdited = '1'; return true; }
    return false;
  }
  function put(el, s) { el.textContent = s; el.__skhLast = s; }

  /* 글자를 고치는 중(내용 수정 모드)에 누른 것은 버튼 동작으로 보지 않는다 — 캐럿을 놓으려던 클릭이니까 */
  function typing(e) { return !!(e.target && e.target.closest && e.target.closest('[contenteditable="true"]')); }

  /* 숫자를 목표값까지 부드럽게 굴린다(레이아웃이 안 밀리게 자릿수는 그대로 둔다) */
  function tween(el, from, to, dur, fmt) {
    if (claimed(el)) return;
    if (reduce) { put(el, fmt(to)); return; }
    if (el.__raf) cancelAnimationFrame(el.__raf);
    var t0 = performance.now();
    (function step(t) {
      /* 굴리는 도중에 사용자가 그 글자를 고치면 즉시 손을 뗀다(안 그러면 남은 프레임이 편집을 덮어쓴다) */
      if (el.dataset.skhEdited === '1') { el.__raf = 0; return; }
      var k = clamp((t - t0) / dur, 0, 1);
      var e = 1 - Math.pow(1 - k, 3);                   /* easeOutCubic */
      put(el, fmt(from + (to - from) * e));
      if (k < 1) el.__raf = requestAnimationFrame(step); else el.__raf = 0;
    })(t0);
  }

  /* <img src="…svg"> 를 같은 크기의 인라인 SVG 로 바꾼다(안쪽 요소를 움직여야 하는 것만).
     에셋 안의 id(Figma 가 붙인 Point·Vector·filter…)는 문서로 그대로 들어오면 서로 겹치므로
     호스트별 접두사를 붙이고 url(#…) 참조도 같이 고친다 — 화면 전체가 'id 는 유일' 규칙이다. */
  function inline(root, hostId, source, prefix) {
    var host = $(root, hostId);
    if (!host) return null;
    var img = host.querySelector('img');
    if (!img) return host.querySelector('svg');
    if (prefix) {
      source = source
        .replace(/\bid="([^"]+)"/g, function (m, id) { return 'id="' + prefix + '-' + id + '"'; })
        .replace(/url\(#([^)]+)\)/g, function (m, id) { return 'url(#' + prefix + '-' + id + ')'; });
    }
    var box = document.createElement('div');
    box.innerHTML = source;
    var svg = box.firstElementChild;
    if (!svg) return null;
    svg.setAttribute('class', (img.getAttribute('class') || '') + ' skh-inline');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.display = 'block';
    svg.style.overflow = 'visible';
    img.replaceWith(svg);
    return svg;
  }

  /* ───────── 본체 ───────── */
  window.initSkhynixHub = function (root) {
    if (!root || root.__skhLive) return;
    root.__skhLive = true;

    if (!document.getElementById('skh-live-style')) {
      var st = document.createElement('style');
      st.id = 'skh-live-style';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    root.classList.add('skh-live');

    var timers = [];
    var every = function (ms, fn) { var id = setInterval(function () { if (!root.isConnected) return stop(); if (!document.hidden) fn(); }, ms); timers.push(id); return id; };
    function stop() { timers.forEach(clearInterval); timers.length = 0; }

    /* ── 0. 반응형 배치 — 영역을 꽉 채운다(잘림·왜곡 없음) ── */
    (function fluid() {
      var screen = txt(root, '64:3367');
      var bgWrap = txt(root, '64:3368'), base = txt(root, '64:3369'), navWrap = txt(root, '64:3737');
      var grid = txt(root, '64:3395'), colL = txt(root, '64:3396'), colR = txt(root, '64:3570');
      var header = txt(root, '64:3855'), ev = txt(root, '64:3894');
      if (!screen || !grid) return;
      /* display:contents 였던 묶음(배경·내비)을 실제 상자로 바꿔 통째로 옮길 수 있게 한다.
         자식 좌표계는 그대로 1920x1080 이라 그림은 변하지 않는다. */
      [bgWrap, navWrap].forEach(function (w) {
        if (!w) return;
        w.style.display = 'block';
        w.style.position = 'absolute';
        w.style.width = DES_W + 'px';
        w.style.height = DES_H + 'px';
        w.style.pointerEvents = 'none';
      });

      root.__relayout = function () {
        var W = root.clientWidth, H = root.clientHeight;   /* 레이아웃 픽셀 — 바깥 scale 에 영향받지 않는다 */
        if (!W || !H) return;
        var S = Math.min(W / DES_W, H / DES_H);            /* 균일 배율(왜곡 없음) */
        var VW = W / S, VH = H / S;                        /* 디자인 단위로 환산한 캔버스 = 영역을 정확히 덮는다 */
        var exW = VW - DES_W, exH = VH - DES_H;            /* 남는 만큼만 캔버스가 넓어진다(둘 중 하나는 0) */
        var dx = exW / 2, dy = exH / 2;

        screen.style.width = VW + 'px';
        screen.style.height = VH + 'px';
        screen.style.transformOrigin = 'top left';
        screen.style.transform = 'scale(' + S + ')';

        /* 배경·내비(3D 칩과 그 둘레의 심볼)는 캔버스 한가운데를 유지한다 */
        if (bgWrap) { bgWrap.style.left = dx + 'px'; bgWrap.style.top = dy + 'px'; }
        if (navWrap) { navWrap.style.left = dx + 'px'; navWrap.style.top = dy + 'px'; }
        /* 바탕 이미지만 캔버스 전체를 덮는다(가장자리에 빈 띠가 남지 않게) */
        if (base) {
          base.style.left = -dx + 'px'; base.style.top = -dy + 'px';
          base.style.width = VW + 'px'; base.style.height = VH + 'px';
        }
        /* 헤더는 가로 전체 — 브랜드/시계/액션이 양 끝과 가운데로 벌어지고(간격 381px 은 최소값으로 유지),
           헤더 배경 메시 이미지도 같은 비율로 늘려 끝까지 덮는다(원본 배치 -67.5, 2055x58 을 VW 비율로). */
        if (header) {
          header.style.width = VW + 'px';
          header.style.justifyContent = 'space-between';
          var hImg = header.querySelector('img');
          if (hImg) {
            var k = VW / DES_W;
            hImg.style.width = (2055 * k) + 'px';
            hImg.style.left = (-67.5 * k - 2) + 'px';
          }
        }
        grid.style.width = (GRID_W + exW) + 'px';
        if (colL) { colL.style.height = (COL_L_H + exH) + 'px'; colL.style.justifyContent = 'space-between'; }
        if (colR) { colR.style.height = (COL_R_H + exH) + 'px'; colR.style.justifyContent = 'space-between'; }
        /* 이벤트 목록은 아래에 붙는다(접힘/펼침 이동량 274px 은 그대로) */
        if (ev) {
          ev.style.width = (GRID_W + exW) + 'px';
          ev.style.top = (VH - EV_BOTTOM) + 'px';
        }
      };
      root.__relayout();
      try {
        var ro = new ResizeObserver(function () { root.__relayout(); });
        ro.observe(root);
        root.__skhRO = ro;
      } catch (e) { window.addEventListener('resize', root.__relayout); }
    })();

    /* ── 0-b. 글자 편집('패널편집' > 내용 수정)과 라이브 데이터의 공존 ──
       스튜디오가 이 화면의 <p> 에 contenteditable 을 걸면 모든 글자를 그 자리에서 고칠 수 있다.
       고친 글자는 라이브 값이 다시 덮지 않고(claimed), 한 줄 텍스트라 줄바꿈은 막고 붙여넣기는 서식 없이 받는다. */
    root.addEventListener('input', function (e) {
      var p = e.target && e.target.closest && e.target.closest('p');
      if (p) p.dataset.skhEdited = '1';
    });
    /* 스튜디오의 '패널편집' 은 등록해 둔 글자 목록에만 contenteditable 을 건다 →
       라이브 피드로 새로 들어온 이벤트 행처럼 나중에 생긴 글자도 함께 고칠 수 있게 맞춰 준다.
       (편집 중에는 피드를 멈춘다 — 고치는 중에 행이 갈리면 편집이 날아간다) */
    var host = root.parentElement;
    var editingMode = function () { return !!(host && host.classList.contains('dt-content-editing')); };
    var syncEditable = function () {
      var on = editingMode();
      [].slice.call(root.querySelectorAll('p')).forEach(function (p) {
        if (on) {
          if (p.getAttribute('contenteditable') !== 'true') { p.setAttribute('contenteditable', 'true'); p.dataset.skhCe = '1'; }
        } else if (p.dataset.skhCe) { p.removeAttribute('contenteditable'); delete p.dataset.skhCe; }
      });
    };
    if (host) {
      try {
        var mo = new MutationObserver(syncEditable);
        mo.observe(host, { attributes: true, attributeFilter: ['class'] });
        root.__skhMO = mo;
      } catch (e) {}
      syncEditable();
    }
    /* '전체 기본값으로 되돌리기'·'배치 초기화' 로 글자가 원래대로 돌아가면 라이브 값도 다시 흐르게 한다 */
    document.addEventListener('click', function (e) {
      if (!e.target.closest || !e.target.closest('#resetAll, #layoutReset')) return;
      setTimeout(function () {
        [].slice.call(root.querySelectorAll('p')).forEach(function (p) { delete p.dataset.skhEdited; delete p.__skhLast; });
      }, 0);
    }, true);
    root.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      if (e.target && e.target.closest && e.target.closest('[contenteditable="true"]')) e.preventDefault();
    });
    root.addEventListener('paste', function (e) {
      var el = e.target && e.target.closest && e.target.closest('[contenteditable="true"]');
      if (!el) return;
      e.preventDefault();
      var t = ((e.clipboardData || window.clipboardData).getData('text') || '').replace(/\s+/g, ' ');
      try { document.execCommand('insertText', false, t); } catch (err) { el.textContent = t; }
    });

    /* ── 1. Event List 접기/펴기 ── */
    (function foldInit() {
      var panel = txt(root, '64:3894');
      var btn = $(root, 'skh-Fold Button');
      if (!panel || !btn) return;
      var open = true;                                  /* 기본값 = Figma 64:3367(펼침) */
      btn.setAttribute('role', 'button');
      btn.setAttribute('tabindex', '0');
      btn.setAttribute('aria-label', '이벤트 목록 접기/펴기');
      var nudge = function (cls) {
        btn.classList.remove('skh-nudge-up', 'skh-nudge-down');
        void btn.offsetWidth;
        btn.classList.add(cls);
        setTimeout(function () { btn.classList.remove(cls); }, 260);
      };
      var apply = function () {
        panel.style.transform = 'translateX(-50%) translateY(' + (open ? 0 : FOLD_DY) + 'px)';
        root.classList.toggle('skh-ev-open', open);     /* 펼침 = 화살표 180도 */
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      };
      var toggle = function () { open = !open; nudge(open ? 'skh-nudge-up' : 'skh-nudge-down'); apply(); };
      apply();
      btn.addEventListener('click', function (e) { if (typing(e)) return; e.stopPropagation(); toggle(); });
      btn.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); toggle(); }
      });
    })();

    /* ── 2. 실시간 시계 ── */
    (function clock() {
      var d = txt(root, '64:3885'), t = txt(root, '64:3887');
      if (!d || !t) return;
      var p2 = function (n) { return n < 10 ? '0' + n : '' + n; };
      var draw = function () {
        var n = new Date();
        if (!claimed(d)) put(d, n.getFullYear() + '-' + p2(n.getMonth() + 1) + '-' + p2(n.getDate()));
        if (!claimed(t)) put(t, p2(n.getHours()) + ':' + p2(n.getMinutes()) + ':' + p2(n.getSeconds()));
      };
      draw();
      /* 초 경계에 맞춰 시작해야 1초가 고르게 흐른다 */
      setTimeout(function () { draw(); every(1000, draw); }, 1000 - (Date.now() % 1000));
    })();

    /* ── 3. AUTO 토글(라디오 점) ── */
    var auto = { on: true };
    (function autoToggle() {
      var wrap = $(root, 'skh-Auto Toggle');
      if (!wrap) return;
      var radioSvg = inline(root, 'skh-Radio', SVG.radio, 'skh-radio');
      var dot = radioSvg && radioSvg.querySelector('[id$="-Dot"]');
      if (dot) dot.setAttribute('class', 'skh-radio-dot');
      wrap.setAttribute('role', 'switch');
      wrap.setAttribute('tabindex', '0');
      var apply = function () {
        root.classList.toggle('skh-auto-off', !auto.on);
        wrap.setAttribute('aria-checked', auto.on ? 'true' : 'false');
      };
      var toggle = function () { auto.on = !auto.on; apply(); };
      apply();
      wrap.addEventListener('click', function (e) { if (!typing(e)) toggle(); });
      wrap.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); toggle(); }
      });
    })();

    /* 이벤트 목록 안쪽만 다루도록 범위를 잡아 둔다 — 화면에는 같은 이름("Body"·"Row")의 위젯이 여럿 있다 */
    var evPanel = txt(root, '64:3894');
    var evBody = evPanel && evPanel.querySelector('[data-name="Body"]');

    /* ── 4. 등급 칩 — 오버 + 클릭하면 해당 등급만 남기고 흐리게 ── */
    var filter = { grade: '' };                          /* 새로 흘러드는 행에도 같은 필터를 적용해야 한다 */
    (function chips() {
      var rows = evBody ? [].slice.call(evBody.children) : [];
      rows.forEach(function (r) {
        r.classList.add('skh-evrow');
        var b = r.querySelector('[data-name="Badge"] p');
        r.dataset.grade = b ? b.textContent.trim() : '';
      });
      var map = { 'skh-Chip/All': '', 'skh-Chip/Critical': 'CR', 'skh-Chip/Major': 'MA', 'skh-Chip/Minor': 'MI', 'skh-Chip/Warning': 'WA' };
      Object.keys(map).forEach(function (id) {
        var chip = $(root, id);
        if (!chip) return;
        chip.setAttribute('role', 'button');
        chip.setAttribute('tabindex', '0');
        var pick = function () {
          filter.grade = (filter.grade === map[id]) ? '' : map[id];
          Object.keys(map).forEach(function (k) {
            var c = $(root, k);
            if (c) c.classList.toggle('skh-chip-on', !!filter.grade && map[k] === filter.grade);
          });
          [].slice.call(root.querySelectorAll('.skh-evrow')).forEach(function (r) {
            r.classList.toggle('skh-dim', !!filter.grade && r.dataset.grade !== filter.grade);
          });
        };
        chip.addEventListener('click', function (e) { if (!typing(e)) pick(); });
        chip.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
      });
    })();

    /* ── 5. 헤더 액션 · 사이트 배지 — 오버/포커스만(목업이라 실제 동작은 없다) ── */
    ['skh-Icon_2', 'skh-Icon_3', 'skh-Btn'].forEach(function (id) {
      var el = $(root, id);
      if (!el) return;
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
    });

    /* ── 6. 센터 온도: 게이지 + 꺾은선 ── */
    var gauge = (function () {
      var svg = inline(root, 'skh-Needle', SVG.needle, 'skh-gauge');
      var val = txt(root, '64:3593');
      var v = 22.0;
      var pointer = svg && svg.querySelector('[id$="-Vector_3"]');
      if (pointer) pointer.setAttribute('class', 'skh-needle-pointer');
      return {
        set: function (nv) {
          v = clamp(nv, 18, 28);
          if (pointer) pointer.style.transform = 'rotate(' + ((v - 22) * 3.6).toFixed(2) + 'deg)';
          if (val) tween(val, parseFloat(val.textContent) || 22, v, 900, function (x) { return x.toFixed(1); });
        },
        get: function () { return v; },
      };
    })();

    var lines = (function () {
      /* 꺾은선 2종을 인라인으로 바꾸고, 원본 y 값을 시작점으로 삼는다(가만히 있을 때 그림이 원본과 같다) */
      function build(hostId, source) {
        var svg = inline(root, hostId, source, hostId === 'skh-Line Series' ? 'skh-ly' : 'skh-lt');
        if (!svg) return null;
        svg.classList.add('skh-series');
        var path = svg.querySelector('path');
        var pts = [].slice.call(svg.querySelectorAll('ellipse'));
        var xs = pts.map(function (p) { return parseFloat(p.getAttribute('cx')); });
        var ys = pts.map(function (p) { return parseFloat(p.getAttribute('cy')); });
        var mean = ys.reduce(function (a, b) { return a + b; }, 0) / ys.length;
        return {
          xs: xs, ys: ys, path: path, pts: pts, mean: mean,
          draw: function () {
            var d = this.ys.map(function (y, i) {
              /* 원본 path 는 점보다 살짝 안쪽(±0.5)에서 그려진다 — 같은 규칙을 유지한다 */
              return (i ? 'L' : 'M') + (this.xs[i] + 0.5).toFixed(3) + ' ' + (y + 0.5).toFixed(2);
            }, this).join('');
            if (this.path) this.path.style.d = 'path("' + d + '")';
            this.pts.forEach(function (p, i) { p.setAttribute('cy', this.ys[i].toFixed(2)); }, this);
          },
          /* 새 값 하나를 오른쪽에 붙이고 왼쪽 하나를 버린다(피드가 흘러가는 모양).
             원래 대역으로 되돌아오려는 성질(평균 회귀)을 줘야 시간이 지나도 원본처럼 출렁인다 —
             그냥 누적 난수만 더하면 선이 한쪽으로 흘러가 밋밋해진다. */
          next: function () {
            var prev = this.ys[this.ys.length - 1];
            return clamp(prev + rnd(-4.5, 4.5) + (this.mean - prev) * 0.25, 3.5, 20.5);
          },
          push: function (y) { this.ys.shift(); this.ys.push(clamp(y, 3.5, 20.5)); this.draw(); },
        };
      }
      return { today: build('skh-Line Series_2', SVG.lineToday), yst: build('skh-Line Series', SVG.lineYesterday) };
    })();

    /* 범례(Today/Yesterday) 클릭 → 해당 계열 숨김/표시 */
    (function legend() {
      var pairs = [
        [txt(root, '64:3608'), txt(root, '64:3632')],   /* Today  → 회색 계열(첫 번째) */
        [txt(root, '64:3614'), txt(root, '64:3642')],   /* Yesterday */
      ];
      pairs.forEach(function (p) {
        var item = p[0], series = p[1];
        if (!item || !series) return;
        item.classList.add('skh-legend');
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        var t = function () { series.classList.toggle('skh-series-off'); };
        item.addEventListener('click', function (e) { if (!typing(e)) t(); });
        item.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); t(); } });
      });
    })();

    /* ── 7. 컨테인먼트 온도 막대 — 오늘 값만 움직인다(어제 데이터는 고정) ── */
    var bars = (function () {
      var out = [];
      [['64:3707', '64:3702'], ['64:3720', '64:3715'], ['64:3733', '64:3728']].forEach(function (p) {
        var bar = txt(root, p[0]), val = txt(root, p[1]);
        if (!bar || !val) return;
        var pair = bar.parentElement;
        /* 막대가 자라도 아래 기준선이 밀리지 않게 부모 높이를 지금 값으로 고정한다.
           스튜디오에서는 화면 전체가 transform: scale 로 축소돼 있으므로 getBoundingClientRect(화면 픽셀)이 아니라
           offsetHeight(레이아웃 픽셀)로 재야 한다 — 안 그러면 축소 배율만큼 작게 잡힌다. */
        if (pair && !pair.style.height) pair.style.height = pair.offsetHeight + 'px';
        out.push({ bar: bar, val: val, v: parseFloat(val.textContent) || 22 });
      });
      return out;
    })();

    /* ── 8. UPS 전력 · 사용량 — 값 + 추세 아이콘 ── */
    var power = (function () {
      var base = 'src/skhynix-hub/';
      try {
        var any = root.querySelector('img[src*="icon-trend-"]');
        if (any) base = any.getAttribute('src').replace(/icon-trend-.*$/, '');
      } catch (e) {}
      var rows = [
        { val: txt(root, '64:3424'), icon: null, v: 2999, lo: 2820, hi: 3080 },               /* 전력량 */
        { val: txt(root, '64:3439'), icon: txt(root, '64:3442'), v: 2999, lo: 2820, hi: 3080 }, /* TC(전체) */
        { val: txt(root, '64:3452'), icon: txt(root, '64:3455'), v: 2420, lo: 2280, hi: 2560 }, /* M14(7F) */
        { val: txt(root, '64:3465'), icon: txt(root, '64:3468'), v: 2210, lo: 2080, hi: 2340 }, /* M16(7F) */
        { val: txt(root, '64:3478'), icon: txt(root, '64:3481'), v: 2860, lo: 2700, hi: 3000 }, /* P&T4(4F) */
      ].filter(function (r) { return r.val; });
      return {
        rows: rows,
        step: function () {
          rows.forEach(function (r) {
            var nv = Math.round(clamp(r.v + rnd(-70, 70), r.lo, r.hi));
            var up = nv > r.v;
            if (nv !== r.v) {
              tween(r.val, r.v, nv, 900, function (x) { return comma(Math.round(x)); });
              if (r.icon) {
                var img = r.icon.querySelector('img');
                if (img) {
                  var want = base + (up ? 'icon-trend-up.svg' : 'icon-trend-down.svg');
                  if (img.getAttribute('src') !== want) {
                    img.style.opacity = '0';
                    setTimeout(function () { img.setAttribute('src', want); img.style.opacity = '1'; }, 180);
                  }
                }
              }
              r.v = nv;
            }
          });
        },
      };
    })();

    /* ── 9. 이벤트 카운트 + AUTO 피드 ── */
    var events = (function () {
      var counts = {
        All: { el: txt(root, '64:3914'), v: 1230 },
        CR: { el: txt(root, '64:3919'), v: 32 },
        MA: { el: txt(root, '64:3925'), v: 32 },
        MI: { el: txt(root, '64:3931'), v: 32 },
      };
      var body = evBody;
      var rows = body ? [].slice.call(body.children) : [];
      /* 등급별 '틀'은 지금 화면에 있는 행을 떼어 낸 복제본으로 들고 있는다 —
         원본 행을 그대로 참조하면 나중에 목록에서 빠진 뒤 offsetHeight 가 0 이 돼 새 행이 납작해진다. */
      var tmpl = {};
      var ROW_H = rows.length ? rows[0].offsetHeight : 42;
      rows.forEach(function (r) { if (r.dataset.grade && !tmpl[r.dataset.grade]) tmpl[r.dataset.grade] = r.cloneNode(true); });
      var HOSTS = {
        CR: ['IT누수#1', 'IT누수#2', 'UPS#3'], MA: ['항온항습기#1', '항온항습기#3', 'RACK#7'],
        MI: ['항온항습기#2', '온습도센서#4', 'RACK#2'], WA: ['UPS#1', '화재#1', '풍속계#1'],
      };
      var TYPES = { CR: '누수감지기', MA: '항온항습센서', MI: '항온항습센서', WA: 'UPS전압기' };
      var MSGS = {
        CR: ['A Leak was detected at 80cm', '건물 누수 감지(2구역)'],
        MA: ['건물 항온항습기 온습도 이상(22이상)', '항온항습기 급기온도 이상'],
        MI: ['건물 항온항습기 온습도 이상(22이상)', 'RACK 온도 주의(28이상)'],
        WA: ['UPS 전압 정상', '건물화재감지(12구역 - 4번)'],
      };
      var p2 = function (n) { return n < 10 ? '0' + n : '' + n; };
      var pick = function (a) { return a[(Math.random() * a.length) | 0]; };

      return {
        feed: function () {
          if (!body || !rows.length) return;
          var grade = pick(['CR', 'MA', 'MI', 'WA']);
          var src = tmpl[grade] || body.firstElementChild;
          if (!src) return;
          var row = src.cloneNode(true);
          /* 복제본은 id 를 떼어 낸다 — 화면 전체가 'Figma 레이어명 = 고유 id' 규칙이라 중복되면 안 된다 */
          row.removeAttribute('id');
          [].slice.call(row.querySelectorAll('[id]')).forEach(function (n) { n.removeAttribute('id'); });
          row.dataset.liveRow = '1';
          var cell = function (name) { var c = row.querySelector('[data-name="' + name + '"] p'); return c; };
          var n = new Date();
          var host = cell('Td/Host'), type = cell('Td/Event Type'), when = cell('Td/Time'), msg = cell('Td/Message'), dup = cell('Td/Count');
          if (host) host.textContent = pick(HOSTS[grade]);
          if (type) type.textContent = TYPES[grade];
          if (when) when.textContent = String(n.getFullYear()).slice(2) + '-' + p2(n.getMonth() + 1) + '-' + p2(n.getDate()) + ' ' + p2(n.getHours()) + ':' + p2(n.getMinutes()) + ':' + p2(n.getSeconds());
          if (msg) msg.textContent = pick(MSGS[grade]);
          if (dup) dup.textContent = Math.random() < .8 ? '-' : String(2 + ((Math.random() * 7) | 0));
          row.classList.add('skh-evrow', 'skh-anim');
          row.dataset.grade = grade;
          if (filter.grade && grade !== filter.grade) row.classList.add('skh-dim'); /* 등급 필터 중이면 새 행도 같이 흐리게 */

          var h = ROW_H;                                 /* 처음 잰 레이아웃 높이(축소 배율에 영향받지 않는다) */
          var last = body.lastElementChild;
          row.style.height = '0px';
          row.style.opacity = '0';
          body.insertBefore(row, body.firstElementChild);
          requestAnimationFrame(function () {
            row.style.height = h + 'px';
            row.style.opacity = '1';
            if (last) { last.classList.add('skh-anim'); last.style.height = h + 'px'; requestAnimationFrame(function () { last.style.height = '0px'; last.style.opacity = '0'; }); }
          });
          setTimeout(function () {
            if (last && last.parentNode) last.remove();
            row.style.height = '';
            row.classList.remove('skh-anim');
          }, 460);

          /* 카운트도 같이 올라간다 */
          [counts.All, counts[grade]].forEach(function (c) {
            if (!c || !c.el) return;
            var nv = c.v + 1;
            tween(c.el, c.v, nv, 600, function (x) { return comma(Math.round(x)); });
            c.v = nv;
          });
        },
      };
    })();

    /* ── 10. 루프 ── */
    if (!reduce) {
      /* 값이 한꺼번에 튀지 않게 주기를 어긋나게 둔다 */
      every(3200, function () {
        power.step();
        gauge.set(clamp(gauge.get() + rnd(-.35, .35), 20.6, 23.6));
        bars.forEach(function (b) {
          var nv = clamp(b.v + rnd(-.4, .4), 20.4, 23.8);
          tween(b.val, b.v, nv, 900, function (x) { return x.toFixed(1); });
          b.bar.style.height = (nv * 2.8).toFixed(1) + 'px';   /* 눈금 50 = 140px */
          b.v = nv;
        });
      });
      every(6000, function () {
        if (lines.today) lines.today.push(lines.today.next());
        /* '어제' 계열은 천천히만 흔들린다 — 지난 데이터가 매번 요동치면 오히려 가짜처럼 보인다 */
        if (lines.yst && Math.random() < .4) lines.yst.push(lines.yst.next());
      });
      every(7000, function () { if (auto.on && !editingMode()) events.feed(); });
    }

    root.__skhStop = stop;
  };
})();
