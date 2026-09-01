/* SK하이닉스 이천 FMS — Screen/HVAC Detail(항온항습기 상세) 인터랙션 · 라이브 데이터 레이어
   화면 자체(src/skhynix-hvac.js)는 Figma 64:4059 에서 만든 산출물이라 손대지 않고, 상태·움직임만 여기서 얹는다.

   ── 무엇을 넣었나 ──
   1) 반응형 — 1920x1080 기준을 유지한 채 캔버스를 작업 영역 비율만큼 넓히고 블록을 가장자리에 다시 붙인다.
      글자·위젯은 균일 배율로만 커지므로 왜곡이 없고, 정확히 16:9 면 Figma 원본과 같은 그림이 된다.
   2) Event List 접기/펴기 — 표가 아코디언처럼 닫히고 패널이 헤더 높이까지 줄어든다(화살표 180도).
   3) 실시간 시계(초 경계에 맞춰 갱신, tabular-nums 라 글자가 흔들리지 않는다).
   4) 마우스 오버 — 모드 스위치·내비 심볼·헤더 액션/배지·폴드/AUTO·등급 칩·표의 행·도넛 범례·콜아웃 배지.
   5) 클릭 동작 — 모드 전환(공냉/수냉/냉수), AUTO 토글, 등급 필터, 도넛 범례 강조.
   6) 라이브 데이터 — 온도·습도·운전상태, 꺾은선 4계열 + 툴팁, 도넛 비율, 이벤트 카운트와 AUTO 피드.
   7) 테마 — root.dataset.theme('light'|'dark')만 바꾸면 색이 통째로 전환된다(시트는 skhynix-hvac.js 가 들고 있다).

   접근성·성능: prefers-reduced-motion 이면 데이터 루프를 돌리지 않고 전환도 끈다.
   탭이 숨겨지면 타이머가 쉬고, 화면이 DOM 에서 빠지면 스스로 정리한다. */
(function () {
  'use strict';

  var DES_W = 1920, DES_H = 1080;
  var COL_W = 1059;        /* Content Column(113:293) 원본 폭 */
  var COL_H = 947;         /* Content Column 원본 높이 */
  var TOOLBAR_TOP = 950;   /* Toolbar(113:294) 원본 top */
  var EASE_FOLD = 'cubic-bezier(.22,.61,.36,1)';
  var EASE_UI = 'cubic-bezier(.4,0,.2,1)';

  /* 값에 따라 움직여야 하는 에셋만 인라인으로 바꿔 넣는다(원본 파일 그대로 박아 둔 문자열).
     file:// 에서는 fetch 가 막히므로 참조가 아니라 내용을 들고 있어야 한다. */
  /* SVG-INLINE-START */
  var SVG = {
    radio: "<svg preserveAspectRatio=\"none\" overflow=\"visible\" style=\"display: block;\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g id=\"Radio\">\n<rect width=\"16\" height=\"16\" rx=\"8\" fill=\"#EFF4F6\" fill-opacity=\"0.5\"/>\n<rect x=\"0.75\" y=\"0.75\" width=\"14.5\" height=\"14.5\" rx=\"7.25\" stroke=\"#828EA4\" stroke-opacity=\"0.5\" stroke-width=\"1.5\"/>\n<circle id=\"Dot\" cx=\"8\" cy=\"8\" r=\"3\" fill=\"#313131\"/>\n</g>\n</svg>",
    lines: "<svg preserveAspectRatio=\"none\" overflow=\"visible\" style=\"display: block;\" width=\"352.389\" height=\"53.0741\" viewBox=\"0 0 352.389 53.0741\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g id=\"Lines\">\n<g id=\"Line\" opacity=\"0.902\" filter=\"url(#filter0_d_0_43)\">\n<path d=\"M2.18407 23.5644L58.7791 16.5664L116.685 20.5644L174.087 33.5594L233.91 26.5624L289.9 27.5624L350.026 28.5614\" stroke=\"#FF8628\" stroke-width=\"3\"/>\n</g>\n<g id=\"Line_2\" opacity=\"0.902\" filter=\"url(#filter1_d_0_43)\">\n<path d=\"M2.18407 37.5664L58.7791 32.5684L116.685 41.5644L174.087 47.5624L233.91 38.5664L289.9 41.5644L350.026 37.5664\" stroke=\"#FF285D\" stroke-width=\"3\"/>\n</g>\n<g id=\"Line_3\" filter=\"url(#filter2_d_0_43)\">\n<path d=\"M2.18407 6.56439L58.7791 11.5664L116.685 11.5644L174.087 16.5594L233.91 1.56239L289.9 20.5624L350.026 5.56138\" stroke=\"#50A9FF\" stroke-width=\"3\"/>\n</g>\n<g id=\"Line_4\" filter=\"url(#filter3_d_0_43)\">\n<path d=\"M2.18407 25.5664L58.7791 30.5684L116.685 29.5654L174.087 35.5624L233.91 16.5664L289.9 9.56538L350.026 15.5664\" stroke=\"#FAC800\" stroke-width=\"3\"/>\n</g>\n</g>\n<defs>\n<filter id=\"filter0_d_0_43\" x=\"1.49012e-08\" y=\"15.06\" width=\"352.051\" height=\"24.0191\" filterUnits=\"userSpaceOnUse\" color-interpolation-filters=\"sRGB\">\n<feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/>\n<feColorMatrix in=\"SourceAlpha\" type=\"matrix\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\" result=\"hardAlpha\"/>\n<feOffset dy=\"2\"/>\n<feGaussianBlur stdDeviation=\"1\"/>\n<feColorMatrix type=\"matrix\" values=\"0 0 0 0 0.964706 0 0 0 0 0.505882 0 0 0 0 0.0313726 0 0 0 0.3 0\"/>\n<feBlend mode=\"normal\" in2=\"BackgroundImageFix\" result=\"effect1_dropShadow_0_43\"/>\n<feBlend mode=\"normal\" in=\"SourceGraphic\" in2=\"effect1_dropShadow_0_43\" result=\"shape\"/>\n</filter>\n<filter id=\"filter1_d_0_43\" x=\"0.0521199\" y=\"31.0582\" width=\"352.073\" height=\"22.016\" filterUnits=\"userSpaceOnUse\" color-interpolation-filters=\"sRGB\">\n<feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/>\n<feColorMatrix in=\"SourceAlpha\" type=\"matrix\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\" result=\"hardAlpha\"/>\n<feOffset dy=\"2\"/>\n<feGaussianBlur stdDeviation=\"1\"/>\n<feColorMatrix type=\"matrix\" values=\"0 0 0 0 0.956863 0 0 0 0 0.188235 0 0 0 0 0.188235 0 0 0 0.3 0\"/>\n<feBlend mode=\"normal\" in2=\"BackgroundImageFix\" result=\"effect1_dropShadow_0_43\"/>\n<feBlend mode=\"normal\" in=\"SourceGraphic\" in2=\"effect1_dropShadow_0_43\" result=\"shape\"/>\n</filter>\n<filter id=\"filter2_d_0_43\" x=\"0.0520152\" y=\"0\" width=\"352.337\" height=\"26.1245\" filterUnits=\"userSpaceOnUse\" color-interpolation-filters=\"sRGB\">\n<feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/>\n<feColorMatrix in=\"SourceAlpha\" type=\"matrix\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\" result=\"hardAlpha\"/>\n<feOffset dy=\"2\"/>\n<feGaussianBlur stdDeviation=\"1\"/>\n<feColorMatrix type=\"matrix\" values=\"0 0 0 0 0.313726 0 0 0 0 0.662745 0 0 0 0 1 0 0 0 0.3 0\"/>\n<feBlend mode=\"normal\" in2=\"BackgroundImageFix\" result=\"effect1_dropShadow_0_43\"/>\n<feBlend mode=\"normal\" in=\"SourceGraphic\" in2=\"effect1_dropShadow_0_43\" result=\"shape\"/>\n</filter>\n<filter id=\"filter3_d_0_43\" x=\"0.0520152\" y=\"8.05605\" width=\"352.123\" height=\"33.0308\" filterUnits=\"userSpaceOnUse\" color-interpolation-filters=\"sRGB\">\n<feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/>\n<feColorMatrix in=\"SourceAlpha\" type=\"matrix\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\" result=\"hardAlpha\"/>\n<feOffset dy=\"2\"/>\n<feGaussianBlur stdDeviation=\"1\"/>\n<feColorMatrix type=\"matrix\" values=\"0 0 0 0 0.94902 0 0 0 0 0.760784 0 0 0 0 0.0156863 0 0 0 0.3 0\"/>\n<feBlend mode=\"normal\" in2=\"BackgroundImageFix\" result=\"effect1_dropShadow_0_43\"/>\n<feBlend mode=\"normal\" in=\"SourceGraphic\" in2=\"effect1_dropShadow_0_43\" result=\"shape\"/>\n</filter>\n</defs>\n</svg>",
    arc: "<svg preserveAspectRatio=\"none\" overflow=\"visible\" style=\"display: block;\" width=\"108\" height=\"108\" viewBox=\"0 0 108 108\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<g id=\"Arc\">\n<path id=\"Segment\" d=\"M76.5729 98.615C77.5702 100.586 76.7855 103.007 74.7461 103.856C68.0513 106.642 60.8504 108.056 53.572 107.998C44.9578 107.93 36.4848 105.802 28.8607 101.791C21.2366 97.781 14.6827 92.0047 9.74606 84.9449C5.575 78.98 2.66087 72.245 1.16363 65.1499C0.707535 62.9885 2.25809 60.9703 4.44726 60.6754V60.6754C6.63643 60.3805 8.63274 61.9218 9.11664 64.0771C10.4259 69.9086 12.8621 75.4421 16.3016 80.3609C20.5069 86.3749 26.09 91.2955 32.5847 94.7118C39.0794 98.1282 46.2972 99.9411 53.6354 99.9993C59.6374 100.047 65.5774 98.9194 71.1244 96.6945C73.1746 95.8722 75.5757 96.644 76.5729 98.615V98.615Z\" fill=\"#FAC800\"/>\n<path id=\"Segment_2\" d=\"M88.2985 17.6181C89.8138 16.0108 92.3575 15.9267 93.8483 17.5567C98.9753 23.1627 102.872 29.7994 105.268 37.0403C108.083 45.5497 108.735 54.626 107.167 63.4505C105.598 72.2751 101.858 80.5705 96.2825 87.5885C91.5385 93.5604 85.5931 98.4476 78.8483 101.943C76.8871 102.96 74.5282 102.004 73.6597 99.9732V99.9732C72.7911 97.9422 73.7437 95.6068 75.6917 94.5652C81.2213 91.6083 86.1011 87.5448 90.019 82.6129C94.7681 76.6345 97.9545 69.5679 99.2907 62.0506C100.627 54.5332 100.071 46.8015 97.6731 39.5527C95.6948 33.5727 92.5143 28.0764 88.3424 23.395C86.8727 21.7459 86.7833 19.2254 88.2985 17.6181V17.6181Z\" fill=\"#FF8628\"/>\n<path id=\"Segment_3\" d=\"M5.31843 65.4079C3.16774 65.9119 1.00015 64.5781 0.656693 62.396C-0.457353 55.3181 -0.153646 48.0752 1.56544 41.092C3.60385 32.8116 7.57433 25.1318 13.1518 18.6811C18.7293 12.2304 25.7552 7.1924 33.6544 3.97946C40.3161 1.26984 47.4392 -0.0767433 54.6038 0.00338378C56.8126 0.0280865 58.4454 1.98033 58.2574 4.18125V4.18125C58.0693 6.38218 56.1308 7.99563 53.9218 7.99938C48.0187 8.00941 42.1595 9.15575 36.6683 11.3893C29.9393 14.1263 23.9542 18.418 19.2029 23.9131C14.4516 29.4082 11.0693 35.9504 9.33285 43.0041C7.91582 48.7604 7.62772 54.7237 8.47037 60.5664C8.78569 62.7527 7.46912 64.9039 5.31843 65.4079V65.4079Z\" fill=\"#50A9FF\"/>\n<path id=\"Segment_4\" d=\"M48.112 4.34757C47.8519 2.15399 49.4199 0.149269 51.6267 0.0521797C59.5398 -0.295954 67.45 1.10056 74.7902 4.1626C82.1304 7.22464 88.688 11.8635 94.0078 17.7319C95.4914 19.3684 95.1699 21.8932 93.428 23.2516V23.2516C91.6862 24.61 89.185 24.2854 87.6805 22.6681C83.2218 17.8752 77.7802 14.0774 71.7104 11.5453C65.6406 9.01321 59.1133 7.81808 52.5704 8.02153C50.3625 8.09019 48.3721 6.54115 48.112 4.34757V4.34757Z\" fill=\"#FF285D\"/>\n</g>\n</svg>",
  };
  /* SVG-INLINE-END */

  var CSS = [
    /* ── 접기/펴기 ── */
    '.skv-root.skv-live .n64_4415{overflow:hidden;transition:height .48s ' + EASE_FOLD + ',opacity .34s ' + EASE_UI + ';}',
    /* 시작값을 none 이 아니라 rotate(0deg) 로 못박아 둔다 — 크롬은 none → rotate 전환에서
       가끔 옛 계산값을 붙들고 애니메이션을 건너뛴다(같은 함정을 skx 시안에서도 겪었다). */
    '.skv-root.skv-live .n64_4383 img{transform:rotate(0deg);transition:transform .46s ' + EASE_FOLD + ';transform-origin:50% 50%;}',
    '.skv-root.skv-live.skv-ev-closed .n64_4383 img{transform:rotate(180deg);}',
    '.skv-root.skv-live .n64_4382{transition:background-color .18s ' + EASE_UI + ',transform .18s ' + EASE_UI + ',filter .18s ' + EASE_UI + ';}',
    '.skv-root.skv-live .n64_4382:hover{transform:translateY(-1px);filter:drop-shadow(0px 5px 6px rgba(21,31,42,.2));}',
    '.skv-root.skv-live .n64_4382:active{transform:translateY(0) scale(.93);}',

    /* ── 공통: 누를 수 있는 것 ── */
    '.skv-root.skv-live .n64_4382,.skv-root.skv-live .n64_4376,',
    '.skv-root.skv-live .skv-chip,.skv-root.skv-live .n64_4090,',
    '.skv-root.skv-live .n64_4102,.skv-root.skv-live .n64_4104,',
    '.skv-root.skv-live .n64_4128,.skv-root.skv-live .skv-opt,',
    '.skv-root.skv-live .skv-evrow,.skv-root.skv-live .skv-legend,',
    '.skv-root.skv-live .skv-marker{cursor:pointer;}',
    '.skv-root.skv-live [tabindex]:focus-visible{outline:2px solid #7b78ff;outline-offset:3px;border-radius:8px;}',

    /* ── 모드 스위치(공냉식·수냉식·냉수식) ── */
    '.skv-root.skv-live .skv-opt{transition:background-image .28s ' + EASE_UI + ',filter .28s ' + EASE_UI + ',transform .18s ' + EASE_UI + ';}',
    '.skv-root.skv-live .skv-opt p{transition:color .28s ' + EASE_UI + ';}',
    '.skv-root.skv-live .skv-opt:not(.skv-on):hover{background-image:linear-gradient(to top,rgba(166,137,240,.16),rgba(77,119,197,.16));}',
    '.skv-root.skv-live .skv-opt:active{transform:scale(.96);}',
    '.skv-root.skv-live .skv-opt.skv-on{background-image:linear-gradient(to top,#a689f0,#4d77c5);filter:drop-shadow(0px 5px 2.5px rgba(82,76,194,0.3));}',
    '.skv-root.skv-live .skv-opt.skv-on p{color:#fff;}',
    '.skv-root.skv-live .n64_4120{transition:box-shadow .2s ' + EASE_UI + ';}',
    '.skv-root.skv-live .n64_4120:hover{box-shadow:0px 4px 10px 0px rgba(82,76,194,.18);}',

    /* ── 내비 심볼(항온항습기) — 떠오르듯 ── */
    '.skv-root.skv-live .n64_4128{transition:transform .28s ' + EASE_FOLD + ',filter .28s ' + EASE_UI + ';}',
    '.skv-root.skv-live .n64_4128:hover{transform:translateY(-6px) scale(1.03);filter:drop-shadow(0 14px 18px rgba(60,52,120,.22));}',
    '.skv-root.skv-live .n64_4128:active{transform:translateY(-1px) scale(.99);}',

    /* ── 콜아웃 배지(운전상태·온도·습도) ── */
    '.skv-root.skv-live .skv-marker{transition:transform .3s ' + EASE_FOLD + ';}',
    '.skv-root.skv-live .skv-marker:hover{transform:scale(1.06);}',
    '.skv-root.skv-live .skv-measure{transition:box-shadow .25s ' + EASE_UI + ';}',
    '.skv-root.skv-live .skv-marker:hover ~ .skv-measurewrap .skv-measure,',
    '.skv-root.skv-live .skv-measure:hover{box-shadow:0 6px 16px rgba(82,76,194,.18);}',

    /* ── 헤더 ── */
    '.skv-root.skv-live .n64_4102,.skv-root.skv-live .n64_4104{transition:transform .18s ' + EASE_UI + ',opacity .18s ' + EASE_UI + ';opacity:.9;}',
    '.skv-root.skv-live .n64_4102:hover,.skv-root.skv-live .n64_4104:hover{transform:scale(1.15);opacity:1;}',
    '.skv-root.skv-live .n64_4102:active,.skv-root.skv-live .n64_4104:active{transform:scale(.9);}',
    '.skv-root.skv-live .n64_4090{transition:background-color .2s ' + EASE_UI + ';}',
    '.skv-root.skv-live .n64_4090:hover{background-color:rgba(255,255,255,.18);}',
    '.skv-root.skv-live .n64_4097,.skv-root.skv-live .n64_4099{font-variant-numeric:tabular-nums;}',

    /* ── AUTO 토글 ── */
    '.skv-root.skv-live .n64_4376{border-radius:15px;transition:background-color .18s ' + EASE_UI + ';}',
    '.skv-root.skv-live .n64_4376:hover{filter:brightness(1.04);}',
    '.skv-root.skv-live .skv-radio-dot{transition:opacity .2s ' + EASE_UI + ',transform .2s ' + EASE_UI + ';transform-box:fill-box;transform-origin:center;}',
    '.skv-root.skv-live.skv-auto-off .skv-radio-dot{opacity:0;transform:scale(.4);}',

    /* ── 등급 칩 ── */
    '.skv-root.skv-live .skv-chip{transition:transform .18s ' + EASE_UI + ',filter .18s ' + EASE_UI + ';}',
    '.skv-root.skv-live .skv-chip:hover{transform:translateY(-1px);filter:drop-shadow(1px 3px 4px rgba(6,1,7,.22));}',
    '.skv-root.skv-live .skv-chip.skv-chip-on{box-shadow:0 0 0 1.5px #7b78ff;border-radius:14.5px;}',

    /* ── 이벤트 표 ── */
    '.skv-root.skv-live .skv-evrow{transition:background-color .18s ' + EASE_UI + ',opacity .28s ' + EASE_UI + ',filter .28s ' + EASE_UI + ';}',
    '.skv-root.skv-live .skv-evrow:hover{background-color:#f2f5ff;}',
    '.skv-root[data-theme="dark"].skv-live .skv-evrow:hover{background-color:#1e2440;}',
    '.skv-root.skv-live .skv-evrow.skv-dim{opacity:.26;filter:grayscale(.55);}',
    '.skv-root.skv-live .skv-evrow.skv-anim{transition:height .42s ' + EASE_FOLD + ',opacity .42s ' + EASE_UI + ';overflow:hidden;}',

    /* ── 차트 ── */
    '.skv-root.skv-live .skv-lines path{transition:d .95s ' + EASE_UI + ';}',
    '.skv-root.skv-live .skv-lines g{transition:opacity .3s ' + EASE_UI + ';}',
    '.skv-root.skv-live .skv-tip{transition:transform .95s ' + EASE_UI + ';}',
    '.skv-root.skv-live .skv-arc path{transition:transform 1.2s ' + EASE_UI + ';transform-box:view-box;transform-origin:54px 54px;}',
    '.skv-root.skv-live .skv-legend{transition:opacity .18s ' + EASE_UI + ',transform .18s ' + EASE_UI + ';}',
    '.skv-root.skv-live .skv-legend:hover{opacity:.7;transform:translateX(2px);}',
    '.skv-root.skv-live .skv-legend.skv-off{opacity:.28;}',

    /* ── 바닥 기류 글로우 — 아주 천천히 숨 쉰다(정지 상태의 그림은 원본 그대로에서 출발한다) ── */
    '@keyframes skvBreathe{0%,100%{opacity:1;}50%{opacity:.86;}}',
    '.skv-root.skv-live .n64_4110{animation:skvBreathe 5.2s ease-in-out infinite;}',

    '@media (prefers-reduced-motion:reduce){.skv-root.skv-live *{animation:none !important;transition-duration:.01ms !important;}}',
  ].join('\n');

  /* ───────── 유틸 ───────── */
  function txt(root, nodeId) { return root.querySelector('[data-node-id="' + nodeId + '"]'); }
  function comma(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches; } catch (e) {}

  /* 사용자가 '패널편집'으로 고친 글자는 라이브 값이 덮지 않는다 */
  function claimed(el) {
    if (!el) return true;
    if (el.dataset.skvEdited === '1') return true;
    if (el.__skvLast != null && el.textContent !== el.__skvLast) { el.dataset.skvEdited = '1'; return true; }
    return false;
  }
  function put(el, s) { el.textContent = s; el.__skvLast = s; }
  function typing(e) { return !!(e.target && e.target.closest && e.target.closest('[contenteditable="true"]')); }

  function tween(el, from, to, dur, fmt) {
    if (!el || claimed(el)) return;
    if (reduce) { put(el, fmt(to)); return; }
    if (el.__raf) cancelAnimationFrame(el.__raf);
    var t0 = performance.now();
    (function step(t) {
      if (el.dataset.skvEdited === '1') { el.__raf = 0; return; }
      var k = clamp((t - t0) / dur, 0, 1);
      var e = 1 - Math.pow(1 - k, 3);
      put(el, fmt(from + (to - from) * e));
      if (k < 1) el.__raf = requestAnimationFrame(step); else el.__raf = 0;
    })(t0);
  }

  /* <img src="…svg"> 를 같은 자리 인라인 SVG 로 바꾼다(안쪽을 움직여야 하는 것만).
     에셋 안의 id 는 문서 전체에서 유일해야 하므로 호스트별 접두사를 붙이고 url(#…) 도 같이 고친다. */
  function inlineFrom(host, source, prefix) {
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
    svg.setAttribute('class', (img.getAttribute('class') || '') + ' skv-inline');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.display = 'block';
    svg.style.overflow = 'visible';
    img.replaceWith(svg);
    return svg;
  }

  /* 인라인 전환은 전부 위의 SVG 상수(원본 파일을 그대로 박아 둔 것)로 한다 — file:// 에서도 동작한다.
     _gen/mk-live-assets.js 가 src/skhynix-hvac/*.svg 에서 그 블록을 다시 만든다. */

  /* ───────── 본체 ───────── */
  window.initSkhynixHvac = function (root) {
    if (!root || root.__skvLive) return;
    root.__skvLive = true;

    if (!document.getElementById('skv-live-style')) {
      var st = document.createElement('style');
      st.id = 'skv-live-style';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    root.classList.add('skv-live');
    if (!root.dataset.theme) root.dataset.theme = 'light';   /* Figma 원본이 Light 시안 */

    var timers = [];
    var every = function (ms, fn) { var id = setInterval(function () { if (!root.isConnected) return stop(); if (!document.hidden) fn(); }, ms); timers.push(id); return id; };
    function stop() { timers.forEach(clearInterval); timers.length = 0; }

    /* ── 0. 반응형 — 영역을 꽉 채운다(잘림·왜곡 없음) ── */
    (function fluid() {
      var screen = txt(root, '64:4059');
      var base = txt(root, '64:4061');
      var header = txt(root, '64:4067');
      var col = txt(root, '113:293');
      var wrow = txt(root, '113:292');
      var toolbar = txt(root, '113:294');
      if (!screen || !col) return;

      root.__relayout = function () {
        var W = root.clientWidth, H = root.clientHeight;   /* 레이아웃 픽셀 — 바깥 scale 에 영향받지 않는다 */
        if (!W || !H) return;
        var S = Math.min(W / DES_W, H / DES_H);
        var VW = W / S, VH = H / S;
        var exW = VW - DES_W, exH = VH - DES_H;

        screen.style.width = VW + 'px';
        screen.style.height = VH + 'px';
        screen.style.transformOrigin = 'top left';
        screen.style.transform = 'scale(' + S + ')';

        /* 바탕은 캔버스 전체를 덮는다(가장자리에 빈 띠가 남지 않게) */
        if (base) { base.style.width = VW + 'px'; base.style.height = VH + 'px'; }
        /* 헤더는 가로 전체 — 브랜드/시계/액션이 양 끝과 가운데로 벌어지고 메시 배경도 같은 비율로 늘어난다 */
        if (header) {
          header.style.width = VW + 'px';
          header.style.justifyContent = 'space-between';
          var hImg = header.querySelector('img');
          if (hImg) { var k = VW / DES_W; hImg.style.width = (2055 * k) + 'px'; hImg.style.left = (-67.5 * k) + 'px'; }
        }
        /* 오른쪽 열 — 폭은 남는 만큼 넓어지고(오른쪽 여백 51px 유지), 높이는 위젯 줄과 이벤트 목록 사이가 벌어진다 */
        col.style.width = (COL_W + exW) + 'px';
        col.style.height = (COL_H + exH) + 'px';
        col.style.justifyContent = 'space-between';
        if (wrow) wrow.style.justifyContent = 'space-between';
        /* 장비 아래 툴바(내비 심볼 + 모드 스위치)는 캔버스 아래에 붙는다 */
        if (toolbar) toolbar.style.top = (TOOLBAR_TOP + exH) + 'px';
      };
      root.__relayout();
      try {
        var ro = new ResizeObserver(function () { root.__relayout(); });
        ro.observe(root);
        root.__skvRO = ro;
      } catch (e) { window.addEventListener('resize', root.__relayout); }
    })();

    /* ── 0-b. 글자 편집('패널편집' > 내용 수정)과 라이브 데이터의 공존 ── */
    root.addEventListener('input', function (e) {
      var p = e.target && e.target.closest && e.target.closest('p');
      if (p) p.dataset.skvEdited = '1';
    });
    var host = root.parentElement;
    var editingMode = function () { return !!(host && host.classList.contains('dt-content-editing')); };
    var syncEditable = function () {
      var on = editingMode();
      [].slice.call(root.querySelectorAll('p')).forEach(function (p) {
        if (on) {
          if (p.getAttribute('contenteditable') !== 'true') { p.setAttribute('contenteditable', 'true'); p.dataset.skvCe = '1'; }
        } else if (p.dataset.skvCe) { p.removeAttribute('contenteditable'); delete p.dataset.skvCe; }
      });
    };
    if (host) {
      try {
        var mo = new MutationObserver(syncEditable);
        mo.observe(host, { attributes: true, attributeFilter: ['class'] });
        root.__skvMO = mo;
      } catch (e) {}
      syncEditable();
    }
    document.addEventListener('click', function (e) {
      if (!e.target.closest || !e.target.closest('#resetAll, #layoutReset')) return;
      setTimeout(function () {
        [].slice.call(root.querySelectorAll('p')).forEach(function (p) { delete p.dataset.skvEdited; delete p.__skvLast; });
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

    /* ── 1. Event List 접기/펴기(표가 아코디언처럼 닫힌다) ── */
    (function foldInit() {
      var table = txt(root, '64:4415');
      var btn = txt(root, '64:4382');
      if (!table || !btn) return;
      var open = true;
      btn.setAttribute('role', 'button');
      btn.setAttribute('tabindex', '0');
      btn.setAttribute('aria-label', '이벤트 목록 접기/펴기');
      var apply = function (animate) {
        var h = table.scrollHeight;
        root.classList.toggle('skv-ev-closed', !open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (!animate) { table.style.height = open ? '' : '0px'; table.style.opacity = open ? '' : '0'; return; }
        if (open) {
          table.style.height = '0px';
          requestAnimationFrame(function () { table.style.height = h + 'px'; table.style.opacity = '1'; });
          setTimeout(function () { if (open) table.style.height = ''; }, 520);
        } else {
          table.style.height = h + 'px';
          requestAnimationFrame(function () { table.style.height = '0px'; table.style.opacity = '0'; });
        }
      };
      apply(false);
      var toggle = function () { open = !open; apply(true); };
      btn.addEventListener('click', function (e) { if (typing(e)) return; e.stopPropagation(); toggle(); });
      btn.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); toggle(); }
      });
    })();

    /* ── 2. 실시간 시계 ── */
    (function clock() {
      var d = txt(root, '64:4097'), t = txt(root, '64:4099');
      if (!d || !t) return;
      var p2 = function (n) { return n < 10 ? '0' + n : '' + n; };
      var draw = function () {
        var n = new Date();
        if (!claimed(d)) put(d, n.getFullYear() + '-' + p2(n.getMonth() + 1) + '-' + p2(n.getDate()));
        if (!claimed(t)) put(t, p2(n.getHours()) + ':' + p2(n.getMinutes()) + ':' + p2(n.getSeconds()));
      };
      draw();
      setTimeout(function () { draw(); every(1000, draw); }, 1000 - (Date.now() % 1000));
    })();

    /* ── 3. 모드 스위치 — 공냉식 / 수냉식 / 냉수식 ── */
    var mode = { id: '64:4124' };
    (function modeSwitch() {
      var ids = ['64:4122', '64:4124', '64:4126'];
      ids.forEach(function (id) {
        var el = txt(root, id);
        if (!el) return;
        el.classList.add('skv-opt');
        el.setAttribute('role', 'radio');
        el.setAttribute('tabindex', '0');
        /* 원본에서 활성 알약에만 박혀 있던 그라디언트·그림자를 클래스로 옮긴다(정지 그림은 그대로) */
        if (id === mode.id) el.classList.add('skv-on');
        el.style.backgroundImage = '';
        el.style.filter = '';
        var pick = function () {
          mode.id = id;
          ids.forEach(function (k) {
            var e2 = txt(root, k);
            if (e2) { e2.classList.toggle('skv-on', k === id); e2.setAttribute('aria-checked', k === id ? 'true' : 'false'); }
          });
        };
        el.addEventListener('click', function (e) { if (!typing(e)) pick(); });
        el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
      });
    })();

    /* ── 4. 헤더 액션 · 사이트 배지 · 내비 심볼 — 오버/포커스(목업이라 실제 동작은 없다) ── */
    ['64:4090', '64:4102', '64:4104', '64:4128'].forEach(function (id) {
      var el = txt(root, id);
      if (!el) return;
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
    });
    /* 콜아웃 배지(운전상태·습도·온도) */
    ['64:4145', '64:4158', '64:4172'].forEach(function (id) {
      var el = txt(root, id);
      if (el) el.classList.add('skv-marker');
    });
    ['64:4155', '64:4168', '64:4182'].forEach(function (id) {
      var el = txt(root, id);
      if (el) el.classList.add('skv-measure');
    });

    /* ── 5. AUTO 토글(라디오 점) ── */
    var auto = { on: true };
    (function autoToggle() {
      var wrap = txt(root, '64:4376');
      var radio = txt(root, '64:4377');
      if (!wrap) return;
      var svg = inlineFrom(radio, SVG.radio, 'skv-radio');
      var dot = svg && svg.querySelector('[id$="-Dot"]');
      if (dot) dot.setAttribute('class', 'skv-radio-dot');
      wrap.setAttribute('role', 'switch');
      wrap.setAttribute('tabindex', '0');
      var apply = function () {
        root.classList.toggle('skv-auto-off', !auto.on);
        wrap.setAttribute('aria-checked', auto.on ? 'true' : 'false');
      };
      var toggle = function () { auto.on = !auto.on; apply(); };
      apply();
      wrap.addEventListener('click', function (e) { if (!typing(e)) toggle(); });
      wrap.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    })();

    /* 이벤트 목록 안쪽 범위 — 화면에는 같은 이름("Body"·"Row")의 위젯이 여럿 있다 */
    var evBody = txt(root, '64:4434');

    /* ── 6. 등급 칩 — 오버 + 클릭하면 해당 등급만 남기고 흐리게 ── */
    var filter = { grade: '' };
    (function chips() {
      var rows = evBody ? [].slice.call(evBody.children) : [];
      rows.forEach(function (r) {
        r.classList.add('skv-evrow');
        var b = r.querySelector('[data-name="Badge"] p');
        r.dataset.grade = b ? b.textContent.trim() : '';
      });
      var map = { '64:4386': '', '64:4391': 'CR', '64:4397': 'MA', '64:4403': 'MI', '64:4409': 'WA' };
      Object.keys(map).forEach(function (id) {
        var chip = txt(root, id);
        if (!chip) return;
        chip.classList.add('skv-chip');
        chip.setAttribute('role', 'button');
        chip.setAttribute('tabindex', '0');
        var pick = function () {
          filter.grade = (filter.grade === map[id]) ? '' : map[id];
          Object.keys(map).forEach(function (k) {
            var c = txt(root, k);
            if (c) c.classList.toggle('skv-chip-on', !!filter.grade && map[k] === filter.grade);
          });
          [].slice.call(root.querySelectorAll('.skv-evrow')).forEach(function (r) {
            r.classList.toggle('skv-dim', !!filter.grade && r.dataset.grade !== filter.grade);
          });
        };
        chip.addEventListener('click', function (e) { if (!typing(e)) pick(); });
        chip.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
      });
    })();

    /* ── 7. 콜아웃 라이브 값 — 온도 · 습도 · 운전상태 ── */
    var callout = (function () {
      var temp = txt(root, '64:4183'), hum = txt(root, '64:4169'), op = txt(root, '64:4156');
      var t = parseFloat(temp && temp.textContent) || 20, h = parseFloat(hum && hum.textContent) || 58;
      return {
        step: function () {
          var nt = clamp(t + rnd(-.35, .35), 18.4, 22.6);
          var nh = clamp(h + rnd(-.9, .9), 52, 63);
          tween(temp, t, nt, 900, function (x) { return x.toFixed(1); });
          tween(hum, h, nh, 900, function (x) { return x.toFixed(1); });
          t = nt; h = nh;
          /* 운전상태는 대부분 '가동' — 아주 가끔만 '대기'로 바뀐다(경보색은 건드리지 않는다) */
          if (op && !claimed(op) && Math.random() < .06) put(op, op.textContent === '가동' ? '대기' : '가동');
        },
      };
    })();

    /* ── 8. 시간대별 이벤트 — 꺾은선 4계열 + 툴팁 ── */
    var chart = (function () {
      var host = txt(root, '64:4204');
      var tip = txt(root, '64:4209');
      var tipVal = txt(root, '64:4213');
      var state = { svg: null, series: [], val: parseFloat(tipVal && tipVal.textContent) || 60 };
      (function () {
        var svg = inlineFrom(host, SVG.lines, 'skv-lines');
        if (!svg) return;
        svg.classList.add('skv-lines');
        state.svg = svg;
        [].slice.call(svg.querySelectorAll('path[stroke]')).forEach(function (p) {
          var d = p.getAttribute('d') || '';
          var pts = [];
          d.replace(/([ML])\s*([\d.]+)\s+([\d.]+)/g, function (m, c, x, y) { pts.push([parseFloat(x), parseFloat(y)]); return m; });
          if (pts.length < 3) return;
          var ys = pts.map(function (q) { return q[1]; });
          state.series.push({
            path: p, xs: pts.map(function (q) { return q[0]; }), ys: ys,
            mean: ys.reduce(function (a, b) { return a + b; }, 0) / ys.length,
          });
        });
      })();
      var draw = function (s) {
        var d = s.ys.map(function (y, i) { return (i ? 'L' : 'M') + s.xs[i].toFixed(4) + ' ' + y.toFixed(3); }).join('');
        s.path.style.d = 'path("' + d + '")';
      };
      return {
        step: function () {
          state.series.forEach(function (s) {
            /* 왼쪽 하나를 버리고 오른쪽에 새 값을 붙인다(평균으로 되돌아오려는 성질을 줘야 원본처럼 출렁인다) */
            var prev = s.ys[s.ys.length - 1];
            var nv = clamp(prev + rnd(-6, 6) + (s.mean - prev) * .3, 1.5, 50);
            s.ys.shift(); s.ys.push(nv);
            draw(s);
          });
          /* 툴팁 숫자도 함께 — 값이 커지면 말풍선이 조금 위로 올라간다 */
          var nv = Math.round(clamp(state.val + rnd(-9, 9), 22, 88));
          tween(tipVal, state.val, nv, 900, function (x) { return String(Math.round(x)); });
          if (tip) { tip.classList.add('skv-tip'); tip.style.transform = 'translateY(' + ((60 - nv) * 0.28).toFixed(2) + 'px)'; }
          state.val = nv;
        },
      };
    })();

    /* ── 9. 센터별 이벤트 — 도넛 4개(조각은 원본 그대로, 비율만 살짝 돌아간다) + 범례 ── */
    var donuts = (function () {
      var defs = [
        { arc: '64:4269', nums: ['64:4249', '64:4254', '64:4259', '64:4264'], items: ['64:4246', '64:4251', '64:4256', '64:4261'] },
        { arc: '64:4301', nums: ['64:4281', '64:4286', '64:4291', '64:4296'], items: ['64:4278', '64:4283', '64:4288', '64:4293'] },
        { arc: '64:4333', nums: ['64:4313', '64:4318', '64:4323', '64:4328'], items: ['64:4310', '64:4315', '64:4320', '64:4325'] },
        { arc: '64:4365', nums: ['64:4345', '64:4350', '64:4355', '64:4360'], items: ['64:4342', '64:4347', '64:4352', '64:4357'] },
      ];
      var out = [];
      defs.forEach(function (d, di) {
        var arcHost = txt(root, d.arc);
        var o = { segs: [], nums: [], vals: [] };
        var arcSvg = inlineFrom(arcHost, SVG.arc, 'skv-arc' + di);
        if (arcSvg) {
          arcSvg.classList.add('skv-arc');
          o.segs = [].slice.call(arcSvg.querySelectorAll('path'));
        }
        d.nums.forEach(function (id, i) {
          var el = txt(root, id);
          o.nums.push(el);
          o.vals.push(parseFloat(el && el.textContent) || 25);
          var item = txt(root, d.items[i]);
          if (item) {
            item.classList.add('skv-legend');
            item.setAttribute('role', 'button');
            item.setAttribute('tabindex', '0');
            var t = function () {
              item.classList.toggle('skv-off');
              if (o.segs[i]) o.segs[i].style.opacity = item.classList.contains('skv-off') ? '.15' : '';
            };
            item.addEventListener('click', function (e) { if (!typing(e)) t(); });
            item.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); t(); } });
          }
        });
        out.push(o);
      });
      return {
        step: function () {
          out.forEach(function (o) {
            /* 합이 100 을 유지하도록 한 칸에서 덜어 다른 칸에 준다 */
            var i = (Math.random() * o.vals.length) | 0, j = (i + 1 + ((Math.random() * (o.vals.length - 1)) | 0)) % o.vals.length;
            var d = Math.min(2, Math.max(0, o.vals[i] - 6));
            if (d <= 0) return;
            var ni = o.vals[i] - d, nj = o.vals[j] + d;
            tween(o.nums[i], o.vals[i], ni, 900, function (x) { return String(Math.round(x)); });
            tween(o.nums[j], o.vals[j], nj, 900, function (x) { return String(Math.round(x)); });
            o.vals[i] = ni; o.vals[j] = nj;
            /* 조각은 모양을 바꾸지 않고(원본 픽셀 유지) 각도만 아주 조금 돌려 '값이 움직였다'를 보여 준다 */
            o.segs.forEach(function (p, k) {
              var a = (o.vals[k] - 25) * .8;
              p.style.transform = 'rotate(' + a.toFixed(2) + 'deg)';
            });
          });
        },
      };
    })();

    /* ── 10. 이벤트 카운트 + AUTO 피드 ── */
    var events = (function () {
      var counts = {
        All: { el: txt(root, '64:4390'), v: 1230 },
        CR: { el: txt(root, '64:4395'), v: 32 },
        MA: { el: txt(root, '64:4401'), v: 32 },
        MI: { el: txt(root, '64:4407'), v: 32 },
        /* WA 칸은 원본 값이 숫자가 아니라('3DD2') 그대로 둔다 — 시안의 글자를 임의로 고치지 않는다 */
      };
      var body = evBody;
      var rows = body ? [].slice.call(body.children) : [];
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
          /* 복제본은 id 를 떼어 낸다 — 화면 전체가 'Figma 레이어명 = 고유 id' 규칙이다 */
          row.removeAttribute('id');
          [].slice.call(row.querySelectorAll('[id]')).forEach(function (n) { n.removeAttribute('id'); });
          row.dataset.liveRow = '1';
          var cell = function (name) { return row.querySelector('[data-name="' + name + '"] p'); };
          var n = new Date();
          var hostc = cell('Td/Host'), type = cell('Td/Event Type'), when = cell('Td/Time'), msg = cell('Td/Message'), dup = cell('Td/Count');
          if (hostc) hostc.textContent = pick(HOSTS[grade]);
          if (type) type.textContent = TYPES[grade];
          if (when) when.textContent = String(n.getFullYear()).slice(2) + '-' + p2(n.getMonth() + 1) + '-' + p2(n.getDate()) + ' ' + p2(n.getHours()) + ':' + p2(n.getMinutes()) + ':' + p2(n.getSeconds());
          if (msg) msg.textContent = pick(MSGS[grade]);
          if (dup) dup.textContent = Math.random() < .8 ? '-' : String(2 + ((Math.random() * 7) | 0));
          row.classList.add('skv-evrow', 'skv-anim');
          row.dataset.grade = grade;
          if (filter.grade && grade !== filter.grade) row.classList.add('skv-dim');

          var h = ROW_H;
          var last = body.lastElementChild;
          row.style.height = '0px';
          row.style.opacity = '0';
          body.insertBefore(row, body.firstElementChild);
          requestAnimationFrame(function () {
            row.style.height = h + 'px';
            row.style.opacity = '1';
            if (last) { last.classList.add('skv-anim'); last.style.height = h + 'px'; requestAnimationFrame(function () { last.style.height = '0px'; last.style.opacity = '0'; }); }
          });
          setTimeout(function () {
            if (last && last.parentNode) last.remove();
            row.style.height = '';
            row.classList.remove('skv-anim');
          }, 460);

          [counts.All, counts[grade]].forEach(function (c) {
            if (!c || !c.el) return;
            var nv = c.v + 1;
            tween(c.el, c.v, nv, 600, function (x) { return comma(Math.round(x)); });
            c.v = nv;
          });
        },
      };
    })();

    /* ── 11. 루프 — 값이 한꺼번에 튀지 않게 주기를 어긋나게 둔다 ── */
    if (!reduce) {
      every(3400, function () { callout.step(); });
      every(5200, function () { chart.step(); });
      every(6400, function () { donuts.step(); });
      every(7000, function () { if (auto.on && !editingMode()) events.feed(); });
    }

    root.__skvStop = stop;
  };
})();
