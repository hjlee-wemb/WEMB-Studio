/* 복합화력 설비정보 디지털트윈 — 재구축 화면 5장의 인터랙션 · 라이브 · 반응형 레이어.
   window.initCcpp(root) / window.disposeCcpp(root)

   화면(DOM·CSS)은 생성기(src/ccpp/_gen/conv.js)가 Figma(r7V2rTKcUto2Yd1qL4XSfZ, REM 섹션) 그대로 만든다.
   이 파일은 그 위에 '움직이는 것'만 얹는다 — 정지 상태(?live=0) = Figma 원본.

   · 반응형 — 1920x1080 좌표계 + 균일 배율 S. 남는 폭은 3D 장면 · 오른쪽 부품이, 남는 높이는 레일 · 판이 나눠 갖는다(여백 없음).
   · 실시간 시계, 날짜 글자는 열 때마다 오늘 기준으로 옮긴다(시안 기준일 2026-11-17 → 오늘, 날짜 사이 간격은 그대로).
   · 마우스 오버 · 눌림 — 레일 · 탭 · 표 줄 · 레이어 토글 · 검색 · 고르기 · 파일 링크 · 선택지 카드 · 접기 · ePnID
   · 화면 잇기 — 레일(홈 · 맵 → 설비 맵, 태그관리 → 상세, 도서관리, 계통도), ePnID → 파일 열기, 파일 열기 카드 → 3D · 계통도 · 도서관리
   · 접기(Fold) — 상세 팝업 Button/Hide 가 팝업을 오른쪽으로 접고 편다, 왼쪽 판(맵 · 태그 · 도서)은 가장자리 단추 · 켜진 레일 메뉴로 레일 뒤로 닫힌다, 맵 구역(가스터빈 · 스팀터빈) 머리를 누르면 목록이 접힌다.
   · 탭 — 설계 · 설비 · 자재는 Figma 의 같은 팝업 변형(src/ccpp-tabs.js)으로 갈아 끼우고, 운전정보는 시안에 없어 실시간 운전 차트를 얹는다.
   · 스크롤 — 도서 목록 · 태그 목록 · 정비상세 · 설비 · 자재 목록(Figma 스크롤 막대 그대로, 내용만 움직인다).
   · 차트 바꾸기(패널편집 중) — 패널마다 복합화력 설비정보에 맞춘 추천 차트. 첫 항목 = 추천, '원본 그대로'로 되돌린다.
   · 패널 옮기기(패널편집 중) — 4px 격자로 자유롭게.

   손으로 쓴 파일이다(생성물 아님). 고친 뒤 node mk-live.js → js/core/tpl-modules.js 의 ?v= 를 올릴 것. */
(function () {
  'use strict';

  var BASE_W = 1920, BASE_H = 1080;
  var K_LAYOUT = 'wemb-ccpp-layout', K_CHART = 'wemb-ccpp-chart';
  var STYLE_ID = 'ccpp-live-style';
  var EASE = 'cubic-bezier(.22,.8,.24,1)';
  var ORIG_DAY = Date.UTC(2026, 10, 17);              /* 시안 기준일(가상 데이터 2026-11-17) */

  /* ══════════════════ 스타일 ══════════════════ */
  var NAV = '[data-name^="Nav Item/"]';
  var CSS = [
    '.cc-root{--cc-acc:0,115,255;--ccl-ease:cubic-bezier(.45,0,.2,1);overflow:clip!important;}',
    '.cc-root.cc-resizing *,.cc-root .cc-dragging,.cc-root .cc-dragging *{transition:none!important;}',
    '.cc-root.cc-live .cc-place{transition:translate .55s ' + EASE + ',opacity .3s ease;}',
    '.cc-root .cc-probe{position:absolute;width:0;height:0;overflow:hidden;color:#0073ff;}',
    '.cc-root .cc-click{cursor:pointer;}',
    '.cc-root .cc-click *{cursor:inherit;}',
    '.dt-content-editing .cc-root .cc-click,.dt-content-editing .cc-root .cc-click *{cursor:text;}',
    '@keyframes ccIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}}',
    '@keyframes ccFade{from{opacity:0;}to{opacity:1;}}',
    '@keyframes ccPop{from{opacity:0;transform:translateY(14px) scale(.985);}to{opacity:1;transform:none;}}',
    '@keyframes ccLeft{from{opacity:0;transform:translateX(-22px);}to{opacity:1;transform:none;}}',
    '@keyframes ccRight{from{opacity:0;transform:translateX(26px);}to{opacity:1;transform:none;}}',
    '.cc-root.cc-enter [data-name^="Panel/"]:not([data-name="Panel/File Open"]){animation:ccLeft .55s ' + EASE + ' both;}',
    '.cc-root.cc-enter [data-name="Panel/Map"] > *{animation:ccIn .5s ' + EASE + ' both;animation-delay:calc(var(--i,0) * 70ms);}',
    '.cc-root.cc-enter [data-name="Popup/Detail"]{animation:ccRight .55s ' + EASE + ' both;}',
    '.cc-root.cc-enter [data-name="Popup/Detail"] [data-name="Content"] > *{animation:ccIn .5s ' + EASE + ' both;animation-delay:calc(var(--i,0) * 80ms + 120ms);}',
    '.cc-root.cc-enter [data-name="Panel/File Open"]{animation:ccPop .5s ' + EASE + ' both;}',
    '.cc-root.cc-enter [data-name="Panel/File Open"] [data-name^="Option/"]{animation:ccIn .5s ' + EASE + ' both;animation-delay:calc(var(--i,0) * 90ms + 120ms);}',
    '.cc-root.cc-enter [data-name="Diagram Image"],.cc-root.cc-enter [data-name="Diagram Title Patch"]{animation:ccFade .6s ease both;}',
    '.cc-root.cc-enter [data-name="Header"]{animation:ccFade .5s ease both;}',
    '.cc-root.cc-enter [data-name="3D Scene"]{animation:ccFade .8s ease both;}',

    /* 레일 — 단추가 살짝 떠오르고 파란 테두리 */
    '.cc-root ' + NAV + ',.cc-root [data-name="Button/Logout"]{cursor:pointer;}',
    '.cc-root [data-name="Icon Button"]{transition:translate .22s ' + EASE + ',box-shadow .25s ease,border-color .2s ease,filter .2s ease;}',
    '.cc-root ' + NAV + ':hover [data-name="Icon Button"],.cc-root [data-name="Button/Logout"]:hover [data-name="Icon Button"]{translate:0 -2px;box-shadow:0 8px 18px rgba(var(--cc-acc),.22);border-color:rgba(var(--cc-acc),.5)!important;}',
    '.cc-root ' + NAV + ':active [data-name="Icon Button"],.cc-root [data-name="Button/Logout"]:active [data-name="Icon Button"]{translate:0 1px;filter:brightness(.96);}',
    '.cc-root ' + NAV + ' > p,.cc-root [data-name="Button/Logout"] > p{transition:color .2s ease;}',
    '.cc-root ' + NAV + ':hover > p,.cc-root [data-name="Button/Logout"]:hover > p{color:rgb(var(--cc-acc))!important;}',
    /* 탭 */
    '.cc-root [data-name^="Tab/"]{cursor:pointer;transition:background-color .2s ease,border-color .25s ease;border-radius:6px 6px 0 0;}',
    '.cc-root [data-name^="Tab/"] p{transition:color .2s ease;}',
    '.cc-root [data-name^="Tab/"]:hover{background-color:rgba(var(--cc-acc),.06);}',
    '.cc-root [data-name^="Tab/"]:hover p{color:rgb(var(--cc-acc))!important;}',
    /* 표 줄 */
    '.cc-root [data-name="List"] > [data-name^="Row/"]:not([data-name*="Expanded"]),.cc-root [data-name="Rows"] > [data-name^="Row/"]{transition:background-color .2s ease,box-shadow .2s ease;border-radius:8px;}',
    '.cc-root [data-name="List"] > [data-name^="Row/"]:not([data-name*="Expanded"]):hover,.cc-root [data-name="Rows"] > [data-name^="Row/"]:hover{background-color:rgba(var(--cc-acc),.06);}',
    '.cc-root [data-name^="Tab/"].cc-taboff::after{opacity:0!important;}',
    '.cc-root .cc-rowsel{background-color:rgba(var(--cc-acc),.09)!important;box-shadow:inset 3px 0 0 rgb(var(--cc-acc));}',
    '.cc-root [data-name="Panel/Document Library"] [data-name="List"] > [data-name^="Row/"]:not([data-name*="Expanded"]),.cc-root [data-name="Panel/Tag"] [data-name="List"] > [data-name^="Row/"],.cc-root [data-name="Tab Panel/Maintenance History"] [data-name^="Row/"]{cursor:pointer;}',
    '.cc-root [data-name*="Expanded"]{transition:opacity .35s ease;}',
    '.cc-root .cc-expin{animation:ccIn .4s ' + EASE + ' both;}',
    /* 맵 — 레이어 줄 · 눈 토글 · 구역 접기 */
    '.cc-root [data-name="Content"] > [data-name^="Row/"]{transition:background-color .2s ease;cursor:pointer;}',
    '.cc-root [data-name="Content"] > [data-name^="Row/"]:hover{background-color:rgba(var(--cc-acc),.07);}',
    '.cc-root [data-name^="Toggle/Visibility"]{transition:scale .2s ' + EASE + ';}',
    '.cc-root [data-name="Content"] > [data-name^="Row/"]:hover [data-name^="Toggle/Visibility"]{scale:1.12;}',
    '.cc-root [data-name="Content"] > [data-name^="Row/"] > p{transition:opacity .3s ease;}',
    '.cc-root .cc-off > p{opacity:.45;}',
    '.cc-root [data-name^="Section/"] > [data-name="Header"]{cursor:pointer;}',
    '.cc-root [data-name^="Section/"] > [data-name="Header"] [data-name="Icon Box"]{transition:rotate .35s ' + EASE + ',background-color .2s ease;}',
    '.cc-root [data-name^="Section/"] > [data-name="Header"]:hover [data-name="Icon Box"]{background-color:rgba(var(--cc-acc),.1);}',
    '.cc-root [data-name^="Section/"].cc-fold > [data-name="Header"] [data-name="Icon Box"]{rotate:-90deg;}',
    '.cc-root [data-name^="Section/"] > [data-name="Body"]{transition:height .45s ' + EASE + ',opacity .3s ease;overflow:hidden;}',
    '.cc-root [data-name^="Section/"].cc-fold > [data-name="Body"]{opacity:0;}',
    /* 검색 · 고르기 · 단추 */
    '.cc-root [data-name^="Search Field"]{cursor:text;transition:box-shadow .2s ease;}',
    '.cc-root [data-name^="Search Field"]:hover,.cc-root .cc-typing{box-shadow:0 0 0 2px rgba(var(--cc-acc),.28);}',
    '.cc-root [data-name="Select"]{cursor:pointer;transition:box-shadow .2s ease;}',
    '.cc-root [data-name="Select"]:hover,.cc-root [data-name="Select"].cc-open{box-shadow:0 0 0 2px rgba(var(--cc-acc),.3);}',
    '.cc-root [data-name="Select"] [data-name^="vuesax/linear/arrow-down"]{transition:rotate .25s ' + EASE + ';}',
    '.cc-root [data-name="Select"].cc-open [data-name^="vuesax/linear/arrow-down"]{rotate:180deg;}',
    '.cc-root [data-name="Button/Search"],.cc-root [data-name="Button/Hide"],.cc-root [data-name="Button/ePnID"]{cursor:pointer;transition:filter .2s ease,translate .2s ' + EASE + ',box-shadow .25s ease;}',
    '.cc-root [data-name="Button/Search"]:hover{filter:brightness(1.1);box-shadow:0 6px 14px rgba(var(--cc-acc),.35);translate:0 -1px;}',
    '.cc-root [data-name="Button/Hide"]:hover{box-shadow:0 0 0 2px rgba(var(--cc-acc),.35);}',
    '.cc-root [data-name="Button/Hide"] [data-name^="Icon/Arrow"]{transition:rotate .45s ' + EASE + ';}',
    '.cc-root .cc-shut [data-name="Button/Hide"] [data-name^="Icon/Arrow"]{rotate:180deg;}',
    '.cc-root [data-name="Button/ePnID"]:hover{filter:drop-shadow(0 2px 6px rgba(var(--cc-acc),.45));translate:0 -1px;}',
    '.cc-root [data-name="Link Box"]{cursor:pointer;transition:background-color .2s ease,box-shadow .2s ease;}',
    '.cc-root [data-name="Link Box"]:hover{background-color:rgba(var(--cc-acc),.12);box-shadow:0 0 0 1px rgba(var(--cc-acc),.5);}',
    '.cc-root [data-name^="Th/"]:is([data-name="Th/Tag"],[data-name="Th/Location"]){cursor:pointer;}',
    '.cc-root [data-name^="Th/"] [data-name^="vuesax/linear/arrow-down"]{transition:rotate .3s ' + EASE + ',opacity .2s ease;}',
    '.cc-root .cc-asc [data-name^="vuesax/linear/arrow-down"]{rotate:180deg;}',
    '.cc-root [data-name^="Option/"]:not([data-name^="Option/"] *){cursor:pointer;transition:translate .25s ' + EASE + ',box-shadow .25s ease,border-color .2s ease;}',
    '.cc-root [data-name="Panel/File Open"] [data-name^="Option/"]:hover{translate:0 -4px;box-shadow:0 14px 28px rgba(var(--cc-acc),.18);border-color:rgba(var(--cc-acc),.55)!important;}',
    '.cc-root [data-name="Panel/File Open"] [data-name^="Option/"] [data-name="Icon Box"]{transition:scale .25s ' + EASE + ';}',
    '.cc-root [data-name="Panel/File Open"] [data-name^="Option/"]:hover [data-name="Icon Box"]{scale:1.08;}',
    /* 왼쪽 판 접기 — 상세 팝업 Button/Hide 와 같은 모양(44px 흰 원 · 같은 화살표 그림) */
    /* 판 · 단추 · 화살표가 한 몸으로 — 같은 곡선(천천히 출발 · 부드럽게 멈춤) · 같은 시간(판 폭에 따라 .6~.77s, --ccl-dur).
       닫을 땐 판이 끝까지 붙어 가다가 마지막 40% 에서만 흐려진다(먼저 사라지면 단추만 혼자 쫓아가 보였다 — 사용자 11-18). 열 땐 바로 보인다 */
    '.cc-root [data-name^="Panel/"].cc-lpanel{transition:translate var(--ccl-dur,.6s) var(--ccl-ease),opacity .22s ease;}',
    '.cc-root [data-name^="Panel/"].cc-lpanel.cc-lshut{opacity:0;pointer-events:none;transition:translate var(--ccl-dur,.6s) var(--ccl-ease),opacity calc(var(--ccl-dur,.6s) * .4) ease calc(var(--ccl-dur,.6s) * .6);}',
    '.cc-root .cc-lfold{position:absolute;z-index:25;width:44px;height:44px;border-radius:40px;background:#fff;box-shadow:inset 0 0 0 1px rgba(5,25,50,.15),0 4px 12px rgba(5,25,50,.12);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:translate var(--ccl-dur,.6s) var(--ccl-ease),box-shadow .25s ease;}',
    '.cc-root.cc-live .cc-lfold.cc-place{transition:translate var(--ccl-dur,.6s) var(--ccl-ease),box-shadow .25s ease;}',
    '.cc-root .cc-lfold:hover{box-shadow:inset 0 0 0 2px rgba(var(--cc-acc),.45),0 6px 16px rgba(var(--cc-acc),.25);}',
    '.cc-root .cc-lfold > i{position:relative;display:block;width:24px;height:24px;rotate:180deg;transition:rotate var(--ccl-dur,.6s) var(--ccl-ease);}',
    '.cc-root .cc-lfold.cc-lclosed > i{rotate:0deg;}',
    '.cc-root .cc-lfold img{position:absolute;inset:12.5% 30.84% 15.25% 33.33%;width:auto;height:auto;}',
    '.cc-root[data-theme="dark"] .cc-lfold{background:#161a21;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14),0 4px 12px rgba(0,0,0,.4);}',
    '.dt-editing .cc-root .cc-lfold,.dt-content-editing .cc-root .cc-lfold{opacity:.35;pointer-events:none;}',
    /* 상세 팝업 접기 · 탭 조각 */
    '.cc-root [data-name="Popup/Detail"]{transition:translate .6s ' + EASE + ';}',
    '.cc-root [data-name="Popup/Detail"] > *:not([data-name="Controls"]){transition:opacity .35s ease;}',
    '.cc-root .cc-shut > *:not([data-name="Controls"]){opacity:0;pointer-events:none;}',
    '.cc-root .cc-shut [data-name="Controls"] > *:not([data-name="Button Group"]),.cc-root .cc-shut [data-name="Button/ePnID"]{opacity:0;pointer-events:none;}',
    '.cc-root .cc-swapped > *:not(.cc-frag){visibility:hidden!important;}',
    '.cc-root .cc-hidepanels > [data-name="Tab Panels"]{visibility:hidden!important;}',
    '.cc-root .cc-frag{position:absolute;left:0;right:0;bottom:0;top:0;animation:ccIn .4s ' + EASE + ' both;}',
    '.cc-root .cc-frag [data-name="Tab Panel/Design Info"] > [data-name="Scroll Area"]{width:100%!important;}',
    '.cc-root .cc-opcard{position:relative;display:flex;flex-direction:column;gap:18px;padding:25px;border-radius:30px;background:#f7fcff;border:1px solid rgba(0,0,0,.05);}',
    '.cc-root .cc-opcard > h4{margin:0;font:700 22px/1.2 "Pretendard Variable",Pretendard,sans-serif;color:#1f222c;}',
    '.cc-root .cc-oprow{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}',
    '.cc-root .cc-ophost{position:relative;height:300px;}',
    '.cc-root .cc-oprow .cc-ophost{height:190px;}',
    '.cc-root[data-theme="dark"] .cc-opcard{background:#1b2029;border-color:rgba(255,255,255,.07);}',
    '.cc-root[data-theme="dark"] .cc-opcard > h4{color:#e6e9ef;}',
    /* 스크롤 */
    '.cc-root .cc-scroller{overscroll-behavior:contain;}',
    '.cc-root .cc-scrollc{transition:translate .12s linear;}',
    '.cc-root .cc-thumb{cursor:grab;transition:filter .2s ease,translate .12s linear;}',
    '.cc-root .cc-thumb:hover{filter:brightness(1.25) drop-shadow(0 0 4px rgba(var(--cc-acc),.5));}',
    '.cc-root .cc-thumb.cc-grab{cursor:grabbing;transition:none;}',
    /* 입력칸 · 고르기 메뉴 */
    '.cc-root .cc-inp{position:absolute;z-index:3;margin:0;padding:0;border:0;outline:none;background:transparent;color:#072549;font-family:"Pretendard Variable",Pretendard,sans-serif;caret-color:#0073ff;}',
    '.cc-root .cc-hasval .cc-inp-src{visibility:hidden;}',
    '.dt-content-editing .cc-root .cc-inp,.dt-editing .cc-root .cc-inp{display:none;}',
    '.cc-root .cc-selmenu{position:absolute;left:0;top:calc(100% + 4px);z-index:60;min-width:100%;display:none;flex-direction:column;gap:2px;padding:4px;border-radius:10px;background:#fff;border:1px solid #d4e6f5;box-shadow:0 10px 24px rgba(5,25,50,.16);}',
    '.cc-root .cc-selmenu.open{display:flex;animation:ccIn .2s ' + EASE + ' both;}',
    '.cc-root .cc-selmenu button{all:unset;box-sizing:border-box;padding:7px 10px;border-radius:6px;font:500 15px/1.2 "Pretendard Variable",Pretendard,sans-serif;color:#434859;cursor:pointer;white-space:nowrap;}',
    '.cc-root .cc-selmenu button:hover{background:rgba(var(--cc-acc),.1);}',
    '.cc-root .cc-selmenu button.cur{color:#0073ff;font-weight:700;}',
    '.cc-root :has(> .cc-selmenu.open){z-index:55!important;overflow:visible!important;}',
    /* 토스트 */
    '.cc-root .cc-toast{position:absolute;left:50%;top:84px;z-index:90;translate:-50% -8px;opacity:0;padding:11px 20px;border:1px solid rgba(var(--cc-acc),.45);border-radius:12px;background:rgba(255,255,255,.96);color:#072549;font:600 15px/1 "Pretendard Variable",Pretendard,sans-serif;pointer-events:none;transition:opacity .25s ease,translate .3s ' + EASE + ';white-space:nowrap;box-shadow:0 10px 24px rgba(5,25,50,.16);}',
    '.cc-root .cc-toast.on{opacity:1;translate:-50% 0;}',
    /* 패널편집 */
    '.dt-editing .cc-root .cc-mv,.cc-root.cc-edit-layout .cc-mv{cursor:grab!important;}',
    '.dt-editing .cc-root .cc-mv *,.cc-root.cc-edit-layout .cc-mv *{cursor:grab!important;}',
    '.dt-editing .cc-root .cc-mv:hover,.cc-root.cc-edit-layout .cc-mv:hover{outline:1px dashed rgba(var(--cc-acc),.85);outline-offset:3px;}',
    '.cc-root .cc-mv.cc-front{z-index:20;}',
    '.cc-root .cc-mv.cc-dragging{z-index:30;filter:drop-shadow(0 16px 26px rgba(5,25,50,.28));cursor:grabbing!important;}',
    '.cc-root .cc-resetbtn{position:absolute;left:560px;top:20px;z-index:45;display:none;height:30px;padding:0 12px;border:1px solid rgb(var(--cc-acc));border-radius:8px;background:#fff;color:#072549;font:600 13px/1 "Pretendard Variable",Pretendard,sans-serif;cursor:pointer;}',
    '.cc-root .cc-resetbtn:hover{box-shadow:0 0 12px rgba(var(--cc-acc),.45);}',
    '.dt-editing .cc-root .cc-resetbtn,.cc-root.cc-edit-layout .cc-resetbtn{display:block;}',
    '.dt-editing .cc-root [data-name]{animation-play-state:paused!important;}',
    '.cc-root .cc-chost{position:absolute;z-index:6;pointer-events:auto;}',
    '.cc-root .cc-hidekids > *:not(.cc-chost):not(.cc-chartbtn):not(.cc-chartmenu){visibility:hidden!important;}',
    '.cc-root .cc-chart{border-radius:inherit;z-index:2;}',
    '.cc-root .cc-chartbtn{position:absolute;top:12px;right:16px;z-index:46;}',
    '.cc-root .cc-chartmenu{top:38px;right:14px;z-index:47;}',
    '.cc-root :has(> .cc-chartmenu.open){z-index:50!important;}',
    /*@CHART_CSS*/
    /* 다크 */
    '.cc-root[data-theme="dark"] .cc-toast{background:rgba(22,26,33,.96);color:#e8eef7;border-color:rgba(110,170,255,.45);box-shadow:0 10px 24px rgba(0,0,0,.5);}',
    '.cc-root[data-theme="dark"] .cc-resetbtn{background:#1b2029;color:#e8eef7;}',
    '.cc-root[data-theme="dark"] .cc-inp{color:#e8eef7;}',
    '.cc-root[data-theme="dark"] .cc-selmenu{background:#1b2029;border-color:#2a3340;box-shadow:0 10px 24px rgba(0,0,0,.5);}',
    '.cc-root[data-theme="dark"] .cc-selmenu button{color:#c3cad6;}',
    '.cc-root[data-theme="dark"] .cc-selmenu button.cur{color:#6aa8ff;}',
    '.cc-root[data-theme="dark"] ' + NAV + ':hover > p,.cc-root[data-theme="dark"] [data-name="Button/Logout"]:hover > p,.cc-root[data-theme="dark"] [data-name^="Tab/"]:hover p{color:#6aa8ff!important;}',
    '.cc-root[data-theme="dark"] [data-name="Panel/File Open"] [data-name^="Option/"]:hover{box-shadow:0 14px 28px rgba(0,0,0,.45);}',
    '@media (prefers-reduced-motion:reduce){.cc-root *{animation:none!important;transition:none!important;}}',
  ].join('\n');

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ══════════════════ 도구 ══════════════════ */
  function all(root, sel) { return root ? Array.prototype.slice.call(root.querySelectorAll(sel)) : []; }
  function one(root, sel) { return root ? root.querySelector(sel) : null; }
  function kids(el) { return el ? Array.prototype.slice.call(el.children) : []; }
  function kid(el, name) { return kids(el).filter(function (c) { return c.getAttribute('data-name') === name; })[0] || null; }
  function nm(el) { return (el && el.getAttribute && el.getAttribute('data-name')) || ''; }
  function editing() { return !!document.querySelector('.dtstage.dt-content-editing, .dtstage.dt-editing, .dt-content-editing, .dt-editing'); }
  function idle() { return typeof window.__wembIdle === 'function' ? window.__wembIdle() : document.hidden; }
  function layoutEditing(root) { return !!(root.closest('.dt-editing') || root.classList.contains('cc-edit-layout')); }
  function load(k) { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function comma(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function txt(el) { return (el && el.textContent || '').replace(/\s+/g, ' ').trim(); }
  /* 사람이 고친 글자는 덮지 않는다 */
  function claimed(p) { return p.__ccLast != null && p.textContent !== p.__ccLast; }
  function write(p, s) {
    if (!p || p === document.activeElement || claimed(p)) return;
    if (p.textContent !== s) p.textContent = s;
    p.__ccLast = p.textContent;
  }
  function clickable(el, fn) {
    if (!el || el.__ccClick) return;
    el.__ccClick = 1;
    el.classList.add('cc-click');
    el.addEventListener('click', function (e) {
      if (editing()) return;
      e.stopPropagation();
      fn(e);
    });
  }
  function frameOf(root) { return root.querySelector(':scope > [data-node-id]'); }
  /* 자리 = 반응형(fx,fy) + 상태(sx,sy) + 사용자가 옮긴 몫(ux,uy) + 끄는 중(dx,dy) */
  function place(el) {
    if (!el) return;
    var x = (el.__fx || 0) + (el.__sx || 0) + (el.__ux || 0) + (el.__dx || 0);
    var y = (el.__fy || 0) + (el.__sy || 0) + (el.__uy || 0) + (el.__dy || 0);
    el.style.translate = (x || y) ? x.toFixed(2) + 'px ' + y.toFixed(2) + 'px' : '';
  }
  function placed(el) { if (el) el.classList.add('cc-place'); return el; }
  function goto(scene) {
    if (window.__gotoCcppScene) { window.__gotoCcppScene(scene); return; }
    location.href = scene + '.html' + location.search;
  }
  function toast(st, msg) {
    var t = st.toast;
    if (!t) { t = st.toast = document.createElement('div'); t.className = 'cc-toast'; st.frame.appendChild(t); }
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(st.toastT);
    st.toastT = setTimeout(function () { t.classList.remove('on'); }, 1900);
  }
  function box(el, st) {
    var r = el.getBoundingClientRect(), f = st.frame.getBoundingClientRect(), S = st.S || 1;
    return { x: (r.left - f.left) / S, y: (r.top - f.top) / S, w: r.width / S, h: r.height / S };
  }
  function baseOf(root) {
    var im = one(root, 'img[src]'), s = im ? im.getAttribute('src') : '';
    var i = s.lastIndexOf('/');
    return i >= 0 ? s.slice(0, i + 1) : 'src/ccpp/';
  }

  /* ══════════════════ 1. 화면 맞추기 ══════════════════
     좌표계는 1920x1080 그대로, 판 비율만큼 캔버스를 넓힌다(exW · exH). 화면 맨 위 판은 % 자리(left:50% …)가 있어
     캔버스를 넓히면 저절로 움직인다 → 처음 자리를 px 로 굳힌 뒤 이름으로 붙일 곳을 정한다:
     3D 장면은 늘어나 채우고, 오른쪽 헤더 · 상세 팝업은 오른쪽 끝, 계통도 그림 · 파일 열기는 가운데, 레일 · 왼쪽 판은 아래로 늘어난다. */
  function installFit(root, st) {
    var frame = frameOf(root);
    frame.style.position = 'absolute';
    frame.style.left = '0';
    frame.style.top = '0';
    frame.style.width = BASE_W + 'px';
    frame.style.height = BASE_H + 'px';
    frame.style.transformOrigin = '0 0';
    st.frame = frame;
    st.S = 1; st.exW = 0; st.exH = 0;
    var tops = [];
    kids(frame).forEach(function (c) {
      if (getComputedStyle(c).display === 'contents') kids(c).forEach(function (g) { tops.push(g); });
      else tops.push(c);
    });
    /* 처음 자리를 px 로 굳힌다 */
    var rects = tops.map(function (c) { return { el: c, x: c.offsetLeft, y: c.offsetTop, w: c.offsetWidth, h: c.offsetHeight }; });
    rects.forEach(function (r) {
      if (getComputedStyle(r.el).position !== 'absolute') return;
      var s = r.el.style;
      s.left = r.x + 'px'; s.top = r.y + 'px'; s.right = 'auto'; s.bottom = 'auto'; s.margin = '0'; s.translate = ''; s.transform = 'none';
      s.width = r.w + 'px'; s.height = r.h + 'px';
    });
    st.boxes = rects;
    var acts = [];
    rects.forEach(function (r) {
      var n = nm(r.el), el = r.el;
      if (n === '3D Scene') acts.push({ el: el, k: 'cover', w0: r.w, h0: r.h });
      else if (n === 'Header') acts.push({ el: placed(el), k: 'right' });
      else if (n === 'Popup/Detail') acts.push({ el: placed(el), k: 'rightTall', h0: r.h });
      else if (n === 'Diagram Image' || n === 'Diagram Title Patch' || n === 'Panel/File Open') acts.push({ el: placed(el), k: 'center' });
      else if (/^Panel\//.test(n) || (n === 'Body' && nm(el.parentElement) === 'Side Rail')) acts.push({ el: el, k: 'tall', h0: r.h });
    });
    /* 세로로 남는 몫은 판 안의 큰 표 · 목록 · 스크롤 막대도 같이 늘린다(왼쪽 태그 · 도서 판, 상세 팝업). 맵 판의 구역은 그대로 */
    var GROW = /^(Table|Content|Grid|Body|Scrollbar|Tab Panels|Tab Panel\/Maintenance Detail|Section)$/;
    acts.forEach(function (a) {
      if (a.k !== 'tall' && a.k !== 'rightTall') return;
      if (nm(a.el) === 'Panel/Map' || nm(a.el) === 'Body') { a.grow = []; return; }
      a.grow = all(a.el, '[data-name]').filter(function (d) {
        if (!GROW.test(nm(d)) || d.closest('[data-name="Header"]')) return false;
        var cs = getComputedStyle(d);
        return cs.display !== 'contents' && d.offsetHeight >= 300;
      }).map(function (d) { return { el: d, h0: d.offsetHeight }; });
    });
    st.acts = acts;
    function layoutFn() {
      var W = root.clientWidth, H = root.clientHeight;
      if (!W || !H) return;
      var S = Math.min(W / BASE_W, H / BASE_H);
      var VW = W / S, VH = H / S, exW = Math.max(0, VW - BASE_W), exH = Math.max(0, VH - BASE_H);
      if (exW < 0.01) exW = 0;
      if (exH < 0.01) exH = 0;
      st.S = S; st.exW = exW; st.exH = exH; st.VW = VW; st.VH = VH;
      frame.style.width = VW + 'px';
      frame.style.height = VH + 'px';
      frame.style.transform = S === 1 ? 'none' : 'scale(' + S + ')';
      acts.forEach(function (a) {
        var el = a.el;
        if (a.k === 'cover') { el.style.width = (a.w0 + exW) + 'px'; el.style.height = (a.h0 + exH) + 'px'; }
        else if (a.k === 'right') { el.__fx = exW; place(el); }
        else if (a.k === 'rightTall') { el.__fx = exW; place(el); el.style.height = (a.h0 + exH) + 'px'; }
        else if (a.k === 'center') { el.__fx = exW / 2; el.__fy = exH / 2; place(el); }
        else if (a.k === 'tall') el.style.height = (a.h0 + exH) + 'px';
        (a.grow || []).forEach(function (g) { g.el.style.height = (g.h0 + exH) + 'px'; });
      });
      (st.onLayout || []).forEach(function (f) { try { f(); } catch (e) { } });
    }
    var rsT = 0;
    function relayout() {
      root.classList.add('cc-resizing');
      layoutFn();
      clearTimeout(rsT);
      rsT = setTimeout(function () { root.classList.remove('cc-resizing'); }, 140);
    }
    st.onLayout = [];
    layoutFn();
    st.layout = layoutFn;
    if (window.ResizeObserver) { st.ro = new ResizeObserver(relayout); st.ro.observe(root); }
    else { st.onResize = relayout; window.addEventListener('resize', relayout); }
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('cc-live'); }); });
  }

  /* ══════════════════ 2. 시계 · 오늘 기준 날짜 ══════════════════ */
  var DOWK = ['일', '월', '화', '수', '목', '금', '토'];
  function installClock(root, st) {
    var d = null, t = null;
    all(st.frame, '[data-name="Header"] p').forEach(function (p) {
      var s = txt(p);
      if (!d && /^\d{4}\/\s*\d{1,2}\/\s*\d{1,2}\s*\S+요일$/.test(s)) d = p;
      if (!t && /^\d{2}:\d{2}:\d{2}$/.test(s)) t = p;
    });
    function tick() {
      var n = new Date();
      if (d) write(d, n.getFullYear() + '/ ' + p2(n.getMonth() + 1) + '/ ' + p2(n.getDate()) + ' ' + DOWK[n.getDay()] + '요일');
      if (t) write(t, p2(n.getHours()) + ':' + p2(n.getMinutes()) + ':' + p2(n.getSeconds()));
    }
    tick();
    st.timers.push(setInterval(tick, 1000));
  }
  /* 날짜 글자(YYYY-MM-DD)를 오늘 기준으로 — 시안 기준일 2026-11-17 이 오늘이 되게 하루 단위로 옮긴다(날짜 사이 간격 그대로) */
  function dayShift() {
    var n = new Date();
    return Math.round((Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()) - ORIG_DAY) / 86400000);
  }
  function shiftDates(scope) {
    var k = dayShift();
    if (!k) return;
    all(scope, 'p').forEach(function (p) {
      if (p.__ccShift || p.closest('[data-name="Header"]') && !p.closest('[data-name="Popup/Detail"], .cc-frag')) return;
      var s = p.textContent;
      if (!/\b20\d\d-\d\d-\d\d\b/.test(s)) return;
      p.__ccShift = 1;
      var o = s.replace(/\b(20\d\d)-(\d\d)-(\d\d)\b/g, function (m, y, mo, dd) {
        var x = new Date(Date.UTC(+y, +mo - 1, +dd) + k * 86400000);
        return x.getUTCFullYear() + '-' + p2(x.getUTCMonth() + 1) + '-' + p2(x.getUTCDate());
      });
      if (o !== s) { p.textContent = o; p.__ccLast = o; }
    });
  }

  /* ══════════════════ 3. 화면 잇기 · 레일 ══════════════════ */
  var NAV_TO = { 'Home': 'main', 'Map': 'main', 'Tag Management': 'detail', 'Document Library': 'library', 'System Diagram': 'diagram' };
  var OPTION_TO = { 'Option/3D View': 'main', 'Option/P&ID Diagram': 'diagram', 'Option/Open Drawing File': 'library' };
  function installNav(root, st) {
    var F = st.frame;
    all(F, NAV).forEach(function (ni) {
      var key = nm(ni).replace('Nav Item/', '').replace(' (Active)', '');
      var to = NAV_TO[key];
      if (!to) return;
      clickable(ni, function () {
        if (to === st.scene) { if (st.leftFold) st.leftFold(); else toast(st, txt(one(ni, 'p')) + ' 화면입니다'); return; }
        goto(to);
      });
    });
    all(F, '[data-name="Button/Logout"]').forEach(function (b) { clickable(b, function () { toast(st, '로그아웃 되었습니다'); }); });
    all(F, '[data-name="Button/ePnID"]').forEach(function (b) { clickable(b, function () { goto('file-open'); }); });
    Object.keys(OPTION_TO).forEach(function (n) {
      all(F, '[data-name="' + n + '"]').forEach(function (o, i) { o.style.setProperty('--i', i); clickable(o, function () { goto(OPTION_TO[n]); }); });
    });
    all(F, '[data-name="Link Box"]').forEach(function (l) { clickable(l, function () { toast(st, txt(l) + ' 파일을 엽니다'); }); });
  }

  /* ══════════════════ 4. 설비 맵 — 레이어 눈 토글 · 구역 접기 ══════════════════ */
  var EYE_ON = { file: 'vuesax-bold-eye.svg', inset: '14.29% 9.52% 14.34% 7.14%' };
  var EYE_OFF = { file: 'vuesax-bold-eye-slash.svg', inset: '7.14% 9.53% 9.54% 7.14%' };
  function installMap(root, st) {
    var F = st.frame, B = baseOf(root);
    all(F, '[data-name^="Toggle/Visibility"]').forEach(function (tg) {
      var row = tg.parentElement;
      var on = /\(On\)/.test(nm(tg));
      var wrap = tg.firstElementChild, img = one(tg, 'img');
      function paint() {
        var v = on ? EYE_ON : EYE_OFF;
        if (img) img.setAttribute('src', B + v.file);
        if (wrap) wrap.style.inset = v.inset;
        tg.setAttribute('data-name', 'Toggle/Visibility (' + (on ? 'On' : 'Off') + ')');
        row.classList.toggle('cc-off', !on);
      }
      paint();
      clickable(row, function () {
        on = !on; paint();
        var label = txt(one(row, 'p')), sec = row.closest('[data-name^="Section/"]');
        var secT = sec ? txt(one(sec, '[data-name="Header"] p')) : '';
        toast(st, secT + ' · ' + label + ' 레이어 ' + (on ? '표시' : '숨김'));
      });
    });
    all(F, '[data-name^="Section/"]').forEach(function (sec, i) {
      sec.style.setProperty('--i', i + 1);
      var hd = kid(sec, 'Header'), body = kid(sec, 'Body');
      if (!hd || !body) return;
      var h0 = 0;
      clickable(hd, function () {
        var shut = !sec.classList.contains('cc-fold');
        if (!h0) h0 = body.offsetHeight;
        body.style.height = (shut ? h0 : 0) + 'px';
        void body.offsetHeight;
        sec.classList.toggle('cc-fold', shut);
        body.style.height = (shut ? 0 : h0) + 'px';
      });
    });
  }

  /* ══════════════════ 4-2. 왼쪽 판 접기 ══════════════════
     레일 옆 판(맵 · 태그 · 도서관리)을 레일 뒤로 밀어 닫는다. 오른쪽 가장자리 단추 또는 레일에서 지금 켜진 메뉴를 다시 누르면 닫고 연다.
     닫힌 상태는 화면을 옮겨도 이어진다(localStorage). 3D 장면 · 헤더 · 상세 팝업은 그대로 */
  var K_LFOLD = 'wemb-ccpp-leftfold';
  function installLeftFold(root, st) {
    var pb = (st.boxes || []).filter(function (r) { return /^Panel\//.test(nm(r.el)) && nm(r.el) !== 'Panel/File Open'; })[0];
    if (!pb) return;
    var panel = pb.el;
    panel.classList.add('cc-lpanel');
    root.style.setProperty('--ccl-dur', (0.5 + pb.w * 0.00025).toFixed(3) + 's');
    var btn = document.createElement('div');
    btn.className = 'cc-lfold cc-place';
    btn.setAttribute('data-name', 'Button/Collapse Panel');
    btn.title = '왼쪽 판 닫기 · 열기';
    btn.innerHTML = '<i><img alt="" src="' + baseOf(root) + 'glyph-10.svg"></i>';
    btn.style.left = (pb.x + pb.w - 22) + 'px';
    st.frame.appendChild(btn);
    /* 세로 자리 = 판 제목(Map · Tag · 도서관리) 글자와 한 줄 — 제목 상자 가운데에 단추 가운데를 맞춘다(사용자 11-18 "map 글자 일직선 옆으로") */
    var tw = one(panel, '[data-name="Title Wrap"]');
    function vpos() {
      /* 들어오는 연출(translateY)에 안 흔들리게 배치 값(offsetTop)으로 잰다 */
      var y = 0, e = tw;
      while (e && e !== st.frame) { y += e.offsetTop; e = e.offsetParent; }
      var cy = tw ? y + tw.offsetHeight / 2 : 45.5;
      btn.style.top = (cy - 22.5) + 'px';
    }
    vpos(); st.onLayout.push(vpos);
    var shut = false;
    function set(v, quiet) {
      shut = v;
      panel.__sx = v ? -pb.w : 0; place(panel);
      btn.__sx = v ? -pb.w + 8 : 0; place(btn);
      panel.classList.toggle('cc-lshut', v);
      btn.classList.toggle('cc-lclosed', v);
      btn.title = v ? '왼쪽 판 열기' : '왼쪽 판 닫기';
      if (!quiet) save(K_LFOLD, { shut: v });
    }
    if (load(K_LFOLD).shut) {
      root.classList.add('cc-resizing'); set(true, true);
      requestAnimationFrame(function () { root.classList.remove('cc-resizing'); });
    }
    clickable(btn, function () { set(!shut); });
    st.leftFold = function () { set(!shut); };
  }
  /* ══════════════════ 5. 스크롤 — Figma 스크롤 막대(Scrollbar > Thumb)와 그 옆 목록 ══════════════════ */
  function installScroll(root, st, scope) {
    all(scope || st.frame, '[data-name="Scrollbar"]').forEach(function (bar) {
      if (bar.__ccScroll) return;
      var thumb = one(bar, '[data-name="Thumb"]');
      var host = bar.parentElement;
      /* 막대 옆에서 가장 긴 형제 = 굴릴 목록 */
      var list = kids(host).filter(function (c) { return c !== bar && getComputedStyle(c).display !== 'contents'; })
        .sort(function (a, b) { return b.scrollHeight - a.scrollHeight; })[0];
      if (!list) return;
      bar.__ccScroll = 1;
      var s = 0;
      function maxOf() { return Math.max(0, list.scrollHeight - bar.offsetHeight); }
      function apply() {
        if (clipped) host.style.maxHeight = (bar.offsetTop + bar.offsetHeight + 20) + 'px';
        var max = maxOf();
        s = clamp(s, 0, max);
        list.style.translate = '0 ' + (-s).toFixed(1) + 'px';
        if (thumb) {
          var travel = Math.max(0, bar.offsetHeight - thumb.offsetHeight);
          thumb.style.translate = '0 ' + (max ? travel * s / max : 0).toFixed(1) + 'px';
        }
      }
      host.style.overflow = 'hidden';
      /* 가상 줄을 더한 목록은 묶음 판이 내용만큼 자란다 — 스크롤 막대 길이에서 자른다 */
      var clipped = !!one(list, '[data-cc-clone]');
      list.classList.add('cc-scrollc');
      host.classList.add('cc-scroller');
      host.addEventListener('wheel', function (e) {
        if (layoutEditing(root)) return;
        var max = maxOf();
        if (max < 2) return;
        e.preventDefault(); e.stopPropagation();
        s = clamp(s + e.deltaY * 0.6, 0, max); apply();
      }, { passive: false });
      if (thumb) {
        thumb.classList.add('cc-thumb');
        var drag = null;
        thumb.addEventListener('pointerdown', function (e) {
          if (layoutEditing(root)) return;
          e.preventDefault(); e.stopPropagation();
          drag = { y: e.clientY, s: s }; thumb.classList.add('cc-grab');
          thumb.setPointerCapture && thumb.setPointerCapture(e.pointerId);
        });
        thumb.addEventListener('pointermove', function (e) {
          if (!drag) return;
          var travel = Math.max(1, bar.offsetHeight - thumb.offsetHeight);
          s = clamp(drag.s + (e.clientY - drag.y) / (st.S || 1) * maxOf() / travel, 0, maxOf()); apply();
        });
        var end = function () { drag = null; thumb.classList.remove('cc-grab'); };
        thumb.addEventListener('pointerup', end); thumb.addEventListener('pointercancel', end);
      }
      (st.scrollResets = st.scrollResets || []).push(function () { s = 0; apply(); });
      (st.onLayout = st.onLayout || []).push(apply);
      apply();
    });
  }

  /* ══════════════════ 6. 표 — 줄 늘리기(가상 데이터) · 검색 · 고르기 · 정렬 · 선택 ══════════════════ */
  function cellsOf(row) { var m = {}; kids(row).forEach(function (c) { var k = nm(c); if (/^Td\//.test(k)) m[k.slice(3)] = c.tagName === 'P' ? c : one(c, 'p'); }); return m; }
  /* 줄 복제 — 같은 모양 그대로(클래스 · 글자 상자), 글자만 가상 데이터 */
  function addRows(list, tmpl, data, cols) {
    var n = kids(list).filter(function (c) { return /^Row\//.test(nm(c)); }).length;
    data.forEach(function (d) {
      var r = tmpl.cloneNode(true);
      r.removeAttribute('id');
      all(r, '[id]').forEach(function (x) { x.removeAttribute('id'); });
      r.setAttribute('data-name', 'Row/' + (++n));
      r.setAttribute('data-cc-clone', '1');
      var c = cellsOf(r);
      cols.forEach(function (k, i) { if (c[k]) c[k].textContent = d[i]; });
      list.appendChild(r);
    });
    restack(list);
  }
  /* Figma 묶음(GROUP) 목록은 inline-grid 한 칸에 줄을 margin-top 으로 겹쳐 쌓는다 — 순서를 바꾸거나 거르면 margin-top 을 다시 매긴다 */
  function restack(list) {
    if (!/grid/.test(getComputedStyle(list).display)) return;
    var rows = kids(list).filter(function (r) { return /^Row\//.test(nm(r)); });
    if (list.__pitch == null) {
      var m = rows.slice(0, 2).map(function (r) { return parseFloat(getComputedStyle(r).marginTop) || 0; });
      list.__pitch = rows.length > 1 ? m[1] - m[0] : rows[0] ? rows[0].offsetHeight : 50;
      list.__mt0 = m[0] || 0;
    }
    var i = 0;
    rows.forEach(function (r) { if (r.style.display === 'none') return; r.style.marginTop = (list.__mt0 + list.__pitch * i++) + 'px'; });
  }
  function inputOver(st, host, p, onInput) {
    if (!host || !p || host.__ccInp) return null;
    host.__ccInp = 1;
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    var cs = getComputedStyle(p);
    var inp = document.createElement('input');
    inp.type = 'text'; inp.className = 'cc-inp'; inp.spellcheck = false;
    inp.setAttribute('aria-label', txt(p));
    inp.style.left = p.offsetLeft + 'px'; inp.style.top = (p.offsetTop - 2) + 'px';
    inp.style.width = Math.max(60, host.offsetWidth - p.offsetLeft - 48) + 'px';
    inp.style.height = (p.offsetHeight + 4) + 'px';
    inp.style.fontSize = cs.fontSize; inp.style.fontWeight = cs.fontWeight;
    p.classList.add('cc-inp-src');
    host.appendChild(inp);
    inp.addEventListener('input', function () { host.classList.toggle('cc-hasval', !!inp.value); onInput(inp.value.trim().toLowerCase()); });
    inp.addEventListener('focus', function () { host.classList.add('cc-typing'); });
    inp.addEventListener('blur', function () { host.classList.remove('cc-typing'); });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Escape') { inp.value = ''; host.classList.remove('cc-hasval'); onInput(''); inp.blur(); } });
    host.addEventListener('click', function () { if (!editing()) inp.focus(); });
    return inp;
  }
  function selectMenu(st, sel, opts, onPick) {
    if (!sel || sel.__ccSel) return;
    sel.__ccSel = 1;
    if (getComputedStyle(sel).position === 'static') sel.style.position = 'relative';
    var val = one(sel, 'p');
    var menu = document.createElement('div');
    menu.className = 'cc-selmenu';
    function render() { var cur = txt(val); menu.innerHTML = opts.map(function (o) { return '<button type="button"' + (o === cur ? ' class="cur"' : '') + '>' + esc(o) + '</button>'; }).join(''); }
    render();
    sel.appendChild(menu);
    clickable(sel, function (e) {
      var b = e.target.closest('.cc-selmenu button');
      if (b) { write(val, b.textContent); menu.classList.remove('open'); sel.classList.remove('cc-open'); render(); onPick(b.textContent); return; }
      all(st.frame, '.cc-selmenu.open').forEach(function (m) { if (m !== menu) { m.classList.remove('open'); m.parentElement.classList.remove('cc-open'); } });
      render();
      menu.classList.toggle('open'); sel.classList.toggle('cc-open', menu.classList.contains('open'));
    });
    (st.menus = st.menus || []).push(menu);
  }
  /* 선택 줄 모양 — 시안에서 골라 둔 줄(테두리 줄)의 모양을 옮긴다 */
  function markSel(rows, row, shape) {
    rows.forEach(function (r) {
      if (r === row) { r.style.border = shape.border; r.style.borderRadius = shape.radius; }
      else { r.style.borderColor = 'transparent'; }
    });
  }

  /* 도서관리 */
  var DOC_MORE = [
    ['S-120-M301-013', 'VD', 'T1', '1-41130-MM-301-013', 'LP TURBINE ROTOR ASSEMBLY DRAWING', 'M', 'DWG'],
    ['S-120-E401-014', 'DE', 'E1', '1-50200-EE-401-014', 'TURBINE BUILDING CABLE TRAY LAYOUT', 'E', 'DWG'],
    ['S-120-J501-015', 'DE', 'C1', '1-41130-JJ-501-015', 'TURBINE SUPERVISORY INSTRUMENT LIST', 'J', 'SPEC'],
    ['S-120-P201-016', 'DE', 'P1', '1-41210-MP-201-016', 'HP BYPASS PIPING STRESS ANALYSIS', 'P', 'CALC'],
    ['S-120-Q801-017', 'VD', 'T1', '1-41130-QQ-801-017', 'LP TURBINE ALIGNMENT RECORD', 'Q', 'QDOC'],
    ['S-120-H601-018', 'DE', 'B1', '1-10100-HH-601-018', 'TURBINE BUILDING SMOKE CONTROL DIAGRAM', 'H', 'DWG'],
  ];
  var DOC_COLS = ['Supplier Doc No', 'Doc Category', 'Pkg No', 'Owner Doc No', 'Title', 'Resp Div', 'Doc Type'];
  var RESP_OPTS = ['전체', 'A', 'C', 'E', 'H', 'J', 'M', 'P', 'Q', 'X'];
  var TYPE_OPTS = ['전체', 'DWG', 'SPEC', 'REPT', 'CALC', 'QDOC', 'OTHER'];
  function installLibrary(root, st) {
    var P = one(st.frame, '[data-name="Panel/Document Library"]');
    if (!P) return;
    var list = one(P, '[data-name="Grid"] [data-name="List"]');
    if (!list) return;
    var exp = kids(list).filter(function (r) { return /Expanded/.test(nm(r)); })[0];
    var rows = function () { return kids(list).filter(function (r) { return /^Row\//.test(nm(r)) && r !== exp; }); };
    var base = rows();
    if (base.length) addRows(list, base[base.length - 1], DOC_MORE, DOC_COLS);
    /* 시안에서 골라 둔 줄 = 테두리가 있는 줄 */
    var selRow = rows().filter(function (r) { return parseFloat(getComputedStyle(r).borderTopWidth) > 0; })[0] || rows()[0];
    var cs = getComputedStyle(selRow);
    var shape = { border: cs.borderTopWidth + ' ' + cs.borderTopStyle + ' ' + cs.borderTopColor, radius: cs.borderTopLeftRadius };
    function fillExp(row) {
      if (!exp) return;
      var c = cellsOf(row), own = c['Owner Doc No'] ? txt(c['Owner Doc No']) : '';
      var pre = own.split('-').slice(0, 2).join('-');
      all(exp, '[data-name="File Group/3D File"] [data-name="Link Box"] p').forEach(function (p, i) { write(p, pre + '-3D-00' + (i + 1)); });
      all(exp, '[data-name="File Group/Doc"] [data-name="Link Box"] p').forEach(function (p) { write(p, own); });
    }
    function select(row) {
      selRow = row;
      markSel(rows(), row, shape);
      if (exp) {
        list.insertBefore(exp, row.nextSibling);
        exp.classList.remove('cc-expin'); void exp.offsetWidth; exp.classList.add('cc-expin');
        exp.style.display = row.style.display === 'none' ? 'none' : '';
      }
      fillExp(row);
    }
    rows().forEach(function (r) { clickable(r, function () { select(r); }); });
    /* 거르기 — 검색어(문서번호 · 제목) · Resp. Div · Doc. Type */
    var q = '', resp = '전체', type = '전체';
    function apply(say) {
      var n = 0;
      rows().forEach(function (r) {
        var c = cellsOf(r);
        var hay = [c['Supplier Doc No'], c['Owner Doc No'], c['Title']].map(function (p) { return p ? txt(p).toLowerCase() : ''; }).join(' ');
        var ok = (!q || hay.indexOf(q) >= 0) && (resp === '전체' || (c['Resp Div'] && txt(c['Resp Div']) === resp)) && (type === '전체' || (c['Doc Type'] && txt(c['Doc Type']) === type));
        r.style.display = ok ? '' : 'none';
        if (ok) n++;
      });
      if (exp) exp.style.display = selRow && selRow.style.display !== 'none' ? '' : 'none';
      (st.scrollResets || []).forEach(function (f) { f(); });
      if (say) toast(st, '도서 ' + n + '건');
    }
    var sf = one(P, '[data-name="Search Field"]');
    inputOver(st, sf, one(sf, '[data-name="Placeholder"]') || one(sf, 'p'), function (v) { q = v; apply(false); });
    selectMenu(st, one(P, '[data-name="Field/Resp Div"] [data-name="Select"]'), RESP_OPTS, function (v) { resp = v; apply(true); });
    selectMenu(st, one(P, '[data-name="Field/Doc Type"] [data-name="Select"]'), TYPE_OPTS, function (v) { type = v; apply(true); });
    all(P, '[data-name="Button/Search"]').forEach(function (b) { clickable(b, function () { apply(true); }); });
  }

  /* 태그 */
  var TAG_MORE = [['1-41310-M-FN-01A', '보조건물 2F'], ['1-41310-M-FN-01B', '보조건물 2F'], ['2-4120-M-CD-03', '가스터빈동 B1'], ['0-46320-M-TK-05', 'HRSG 구역'], ['46410-M-ST-05A', '순환수 펌프실'], ['1-41210-M-PU-03A', '스팀터빈동 1F']];
  function installTag(root, st) {
    var P = one(st.frame, '[data-name="Panel/Tag"]');
    if (!P) return;
    var list = one(P, '[data-name="Body"] > [data-name="List"]') || one(P, '[data-name="List"]');
    if (!list) return;
    var rows = function () { return kids(list).filter(function (r) { return /^Row\//.test(nm(r)); }); };
    var base = rows();
    if (base.length) addRows(list, base[base.length - 1], TAG_MORE, ['Tag', 'Location']);
    var cur = null;
    rows().forEach(function (r) {
      clickable(r, function () {
        if (cur) cur.classList.remove('cc-rowsel');
        cur = r; r.classList.add('cc-rowsel');
        var c = cellsOf(r);
        toast(st, (c.Tag ? txt(c.Tag) : '') + ' · ' + (c.Location ? txt(c.Location) : ''));
        if (st.popupOpen) st.popupOpen();
      });
    });
    var qt = '', ql = '';
    function apply() {
      rows().forEach(function (r) {
        var c = cellsOf(r);
        var ok = (!qt || (c.Tag && txt(c.Tag).toLowerCase().indexOf(qt) >= 0)) && (!ql || (c.Location && txt(c.Location).toLowerCase().indexOf(ql) >= 0));
        r.style.display = ok ? '' : 'none';
      });
      restack(list);
      (st.scrollResets || []).forEach(function (f) { f(); });
    }
    var f1 = one(P, '[data-name="Search Field/Tag"]'), f2 = one(P, '[data-name="Search Field/Location"]');
    inputOver(st, f1, one(f1, 'p'), function (v) { qt = v; apply(); });
    inputOver(st, f2, one(f2, 'p'), function (v) { ql = v; apply(); });
    /* 머리 칸 정렬 — TAG · 위치 */
    [['Th/Tag', 'Tag'], ['Th/Location', 'Location']].forEach(function (x) {
      var th = one(P, '[data-name="' + x[0] + '"]');
      if (!th) return;
      var asc = false;
      clickable(th, function () {
        asc = !asc;
        all(P, '[data-name^="Th/"]').forEach(function (o) { o.classList.remove('cc-asc'); });
        th.classList.toggle('cc-asc', asc);
        rows().sort(function (a, b) {
          var A = cellsOf(a)[x[1]], Bc = cellsOf(b)[x[1]];
          var r = txt(A).localeCompare(txt(Bc), 'ko');
          return asc ? r : -r;
        }).forEach(function (r) { list.appendChild(r); });
        restack(list);
        (st.scrollResets || []).forEach(function (f) { f(); });
      });
    });
  }

  /* ══════════════════ 7. 상세 팝업 — 접기(Fold) · 탭 ══════════════════ */
  var TAB_OF = { 'Tab/Design': 'design', 'Tab/Equipment': 'equipment', 'Tab/Maintenance History': 'maint', 'Tab/Materials': 'materials', 'Tab/Operation Info': 'oper' };
  var TAB_TITLE = { design: '설계정보', oper: '운전정보' };
  function fragCss(k, f) {
    var id = 'ccpp-tab-' + k;
    if (document.getElementById(id)) return;
    var s = document.createElement('style');
    s.id = id; s.textContent = f.css + '\n' + f.light;
    document.head.appendChild(s);
  }
  function installPopup(root, st) {
    var pop = one(st.frame, '[data-name="Popup/Detail"]');
    if (!pop) return;
    var hide = one(pop, '[data-name="Button/Hide"]');
    var shut = false;
    function setShut(v) {
      shut = v;
      pop.__sx = v ? pop.offsetWidth - 70 : 0;
      place(pop);
      pop.classList.toggle('cc-shut', v);
    }
    if (hide) clickable(hide, function () { setShut(!shut); });
    st.popupOpen = function () { if (shut) setShut(false); };
    /* 탭 — 지금 켜진 탭(밑줄 있는 것)의 모양을 기억해 옮긴다 */
    var tabs = all(pop, '[data-name="Tabs"] > [data-name^="Tab/"]');
    if (!tabs.length) return;
    /* 켜진 탭 = 글자가 브랜드 파랑인 탭. 밑줄은 conv 가 ::after(안쪽 링)로 그렸다 → 원래 탭의 ::after 는 끄고 새 탭엔 같은 색 안쪽 그림자 */
    var colOf = function (t) { return getComputedStyle(one(t, 'p')).color; };
    var on = tabs.filter(function (t) { return colOf(t) !== colOf(tabs[0]) || colOf(t) !== colOf(tabs[1]); }).filter(function (t) { return tabs.filter(function (o) { return colOf(o) === colOf(t); }).length === 1; })[0] || tabs[2];
    var off = tabs.filter(function (t) { return t !== on; })[0];
    var af = getComputedStyle(on, '::after');
    var ulW = parseFloat(af.borderBottomWidth) || 3, ulC = af.borderBottomColor && af.borderBottomColor !== 'rgba(0, 0, 0, 0)' ? af.borderBottomColor : colOf(on);
    var look = { on: { c: colOf(on) }, off: { c: colOf(off) } };
    on.classList.add('cc-tab0');
    var content = one(pop, ':scope > [data-name="Content"]') || one(pop, '[data-name="Content"]');
    var head = content && one(content, ':scope > [data-name="Header"] p');
    var head0 = head ? head.textContent : '';
    if (content && getComputedStyle(content).position === 'static') content.style.position = 'relative';
    all(content, ':scope > *').forEach(function (c, i) { c.style.setProperty('--i', i); });
    var frag = null, curKey = TAB_OF[nm(on)];
    function paintTabs(t) {
      tabs.forEach(function (x) {
        var me = x === t, L = me ? look.on : look.off, p = one(x, 'p');
        x.classList.toggle('cc-taboff', !me && x.classList.contains('cc-tab0'));
        x.style.boxShadow = me && !x.classList.contains('cc-tab0') ? 'inset 0 -' + ulW + 'px 0 ' + ulC : '';
        if (p) { p.style.color = L.c; p.__ccLast = p.textContent; }
      });
    }
    function clear() {
      if (st.opCharts) { st.opCharts.forEach(function (c) { c.dispose(); }); st.opCharts = null; }
      if (frag) { frag.remove(); frag = null; }
      content.classList.remove('cc-swapped', 'cc-hidepanels');
      if (head) { head.textContent = head0; head.__ccLast = head0; }
    }
    function show(key) {
      clear();
      curKey = key;
      if (key === 'maint') return;
      var F = window.CC_TABS && window.CC_TABS[key];
      frag = document.createElement('div');
      frag.className = 'cc-frag';
      if (key === 'equipment' || key === 'materials') {
        if (!F) { frag = null; toast(st, '탭 조각을 불러오지 못했습니다'); return; }
        fragCss(key, F);
        frag.innerHTML = '<div class="' + F.px + '-root" data-theme="' + (root.dataset.theme || 'light') + '">' + F.build(baseOf(root)) + '</div>';
        content.classList.add('cc-swapped');
      } else {
        /* 설계 · 운전 — 머리(제목)는 두고 아래 칸만 갈아 끼운다 */
        var hd = one(content, ':scope > [data-name="Header"]');
        frag.style.top = (hd ? hd.offsetHeight + 10 : 48) + 'px';
        if (head) write(head, TAB_TITLE[key]);
        content.classList.add('cc-hidepanels');
        if (key === 'design') {
          if (!F) { frag = null; return; }
          fragCss(key, F);
          frag.innerHTML = '<div class="' + F.px + '-root" data-theme="' + (root.dataset.theme || 'light') + '">' + F.build(baseOf(root)) + '</div>';
        } else frag.innerHTML = opCard();
      }
      content.appendChild(frag);
      shiftDates(frag);
      installScroll(root, st, frag);
      passThrough(frag);
      if (key === 'oper') mountOp(frag);
    }
    tabs.forEach(function (t) {
      clickable(t, function () {
        var key = TAB_OF[nm(t)];
        if (!key || key === curKey) return;
        paintTabs(t);
        show(key);
      });
    });
    /* 테마가 바뀌면 조각도 같이 */
    st.themeMO = new MutationObserver(function () { all(content, '.cc-frag > [data-theme]').forEach(function (x) { x.dataset.theme = root.dataset.theme || 'light'; }); });
    st.themeMO.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    /* 운전정보 — 시안에 없는 탭: 같은 패널 모양(Tab Panels 카드) 안에 실시간 운전 차트 */
    function opCard() {
      return '<div class="cc-opcard"><h4>#1 LP TBN-A 배기압력 트랜스미터</h4><div class="cc-ophost" data-op="0"></div></div>'
        + '<div class="cc-opcard" style="margin-top:10px"><h4>#1 스팀터빈 주요 운전값</h4><div class="cc-oprow"><div class="cc-ophost" data-op="1"></div><div class="cc-ophost" data-op="2"></div><div class="cc-ophost" data-op="3"></div></div></div>';
    }
    function mountOp(f) {
      if (typeof makeChart !== 'function') return;
      var S = [
        { k: 'line', t: '배기압력 (kPa)', unit: 'kPa', dec: 2, series: [['PT-412A', CC.bl, 5.1, 0.05], ['PT-412B', CC.cy, 5.0, 0.05], ['PT-412C', CC.or, 5.25, 0.1]], lo: 4, hi: 6.5 },
        { k: 'gauge', t: '스팀터빈 출력', unit: 'MW', v: [134, 1.6], max: 180, c: CC.bl, dec: 1 },
        { k: 'gauge', t: '터빈 회전수', unit: 'rpm', v: [3600, 2], max: 3800, c: CC.gn, dec: 0 },
        { k: 'gauge', t: '복수기 진공', unit: 'kPa', v: [-93.8, 0.3], max: 0, c: CC.vi, dec: 1 },
      ];
      S[3] = { k: 'gauge', t: '배기 온도', unit: '℃', v: [46.2, 0.4], max: 80, c: CC.or, dec: 1 };
      st.opCharts = all(f, '.cc-ophost').map(function (h) { return makeChart(h, Object.assign({ uid: ++chartUid }, S[+h.getAttribute('data-op')])); });
    }
    /* 정비이력 표 줄 — 고른 줄 표시 */
    var mrows = all(pop, '[data-name="Tab Panel/Maintenance History"] [data-name^="Row/"]');
    mrows.forEach(function (r) { clickable(r, function () { mrows.forEach(function (x) { x.classList.toggle('cc-rowsel', x === r); }); var c = cellsOf(r); toast(st, (c['Order No'] ? txt(c['Order No']) : '') + ' · ' + (c['Order Name'] ? txt(c['Order Name']) : '')); }); });
  }

  /* ══════════════════ 8. 눌리게 — 투명한 묶음 판은 클릭을 아래로 넘긴다 ══════════════════ */
  function transparentBox(e) {
    var tag = e.tagName;
    if (tag === 'IMG' || tag === 'P' || tag === 'SPAN' || tag === 'INPUT' || tag === 'BUTTON' || tag === 'CANVAS' || tag === 'svg' || tag === 'TEXTAREA') return false;
    if (e.classList.contains('cc-click') || e.classList.contains('cc-chartbtn') || e.classList.contains('cc-chartmenu') || e.classList.contains('cc-selmenu') || e.classList.contains('cc-resetbtn') || e.classList.contains('cc-scroller') || e.classList.contains('cc-mv')) return false;
    var c = getComputedStyle(e);
    var bg = c.backgroundColor;
    if (c.backgroundImage !== 'none' || (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent')) return false;
    if (parseFloat(c.borderTopWidth) || parseFloat(c.borderLeftWidth) || parseFloat(c.borderRightWidth) || parseFloat(c.borderBottomWidth)) return false;
    if (c.boxShadow !== 'none' || (c.backdropFilter && c.backdropFilter !== 'none')) return false;
    return true;
  }
  function passThrough(scope) {
    if (!scope) return;
    var els = all(scope, '*').filter(function (e) { return !e.__pt; });
    var prev = scope.style.pointerEvents;
    scope.style.pointerEvents = 'auto';
    var keep = els.filter(function (e) { return getComputedStyle(e).pointerEvents === 'none'; });
    els.forEach(function (e) {
      e.__pt = 1;
      if (keep.indexOf(e) >= 0 || e.closest('svg, .cc-chost, .cc-chartmenu, .cc-selmenu')) return;
      /* 화면 맨 위의 그림(3D 장면 · 계통도)은 바탕이라 넘긴다 */
      e.style.pointerEvents = transparentBox(e) ? 'none' : 'auto';
    });
    scope.style.pointerEvents = prev;
  }

  /* ══════════════════ 9. 차트 바꾸기(패널편집) ══════════════════ */
  /*@MAKECHART*/
  var CC = { bl: '#0073ff', cy: '#2bb6e6', gn: '#22b07d', ye: '#f5b400', or: '#f59a23', re: '#f0453a', gr: '#8e9aa8', vi: '#7b61ff' };
  function specsFor() {
    return {
      'Section/Gas Turbine': [
        { k: 'donut', t: '가스터빈 분야별 설비', parts: [['기계', CC.bl, 412], ['배관', CC.cy, 268], ['전기/계측', CC.vi, 186], ['소방', CC.or, 74], ['토목·건축', CC.gr, 58]] },
        { k: 'gauge', t: '가스터빈 출력', unit: 'MW', v: [268, 2.4], max: 320, c: CC.bl, dec: 1 },
        { k: 'hbar', t: '분야별 정비 오더(이번 달)', unit: '건', cats: ['기계', '배관', '전기/계측', '소방', '토목'], vals: [14, 9, 7, 3, 2], max: 20, c: CC.bl },
      ],
      'Section/Steam Turbine': [
        { k: 'donut', t: '스팀터빈 분야별 설비', parts: [['기계', CC.bl, 356], ['배관', CC.cy, 301], ['전기/계측', CC.vi, 164], ['소방', CC.or, 61], ['토목·건축', CC.gr, 47]] },
        { k: 'gauge', t: '스팀터빈 출력', unit: 'MW', v: [134, 1.6], max: 180, c: CC.bl, dec: 1 },
        { k: 'line', t: '배기압력 추이', unit: 'kPa', dec: 2, series: [['PT-412A', CC.bl, 5.1, 0.05], ['PT-412C', CC.or, 5.25, 0.1]], lo: 4, hi: 6.5 },
      ],
      'Panel/Document Library': [
        { k: 'bar', t: '분야별 도서 현황', unit: '건', cats: ['A', 'C', 'E', 'H', 'J', 'M', 'P', 'Q', 'X'], vals: [38, 24, 31, 12, 27, 46, 52, 9, 6], max: 60, c: CC.bl },
        { k: 'donut', t: '문서 유형 비율', parts: [['DWG', CC.bl, 142], ['SPEC', CC.cy, 38], ['CALC', CC.vi, 21], ['REPT', CC.or, 17], ['기타', CC.gr, 9]] },
        { k: 'line', t: '월별 도서 개정 추이', unit: '건', dec: 0, series: [['개정', CC.bl, 24, 3], ['신규', CC.cy, 9, 2]], lo: 0, hi: 40 },
      ],
      'Panel/Tag': [
        { k: 'hbar', t: '위치별 태그 수', unit: '개', cats: ['스팀터빈동', '가스터빈동', '보조건물', '순환수 펌프실', 'HRSG 구역'], vals: [128, 96, 54, 41, 37], max: 140, c: CC.bl },
        { k: 'donut', t: '설비 종류 비율', parts: [['펌프', CC.bl, 34], ['밸브', CC.cy, 27], ['탱크', CC.vi, 14], ['열교환기', CC.or, 12], ['스트레이너', CC.gr, 13]] },
      ],
      'Tab Panel/Maintenance History': [
        { k: 'line', t: '월별 정비 오더 추이', unit: '건', dec: 0, series: [['경상오더', CC.bl, 18, 2], ['계획오더', CC.cy, 6, 1]], lo: 0, hi: 30 },
        { k: 'donut', t: '진행상태 비율', parts: [['작업완료', CC.gn, 64], ['정산완료', CC.bl, 21], ['진행중', CC.or, 11], ['대기', CC.gr, 4]] },
        { k: 'bar', t: '설비별 정비 횟수', unit: '회', cats: ['HP TBN', 'IP TBN', 'LP TBN-A', 'LP TBN-B', 'MSV'], vals: [6, 4, 9, 5, 3], max: 12, c: CC.bl },
      ],
      'Tab Panel/Maintenance Detail': [
        { k: 'line', t: '#1 LP TBN-A 배기압력 (kPa)', unit: 'kPa', dec: 2, series: [['PT-412A', CC.bl, 5.1, 0.05], ['PT-412B', CC.cy, 5.0, 0.05], ['PT-412C', CC.or, 5.25, 0.1]], lo: 4, hi: 6.5 },
        { k: 'gauge', t: 'PT-412C 편차', unit: 'kPa', v: [0.22, 0.04], max: 1, c: CC.or, dec: 2 },
      ],
      'Panel/File Open': [
        { k: 'bar', t: '최근 7일 파일 열람', unit: '회', cats: ['3D 화면', 'P&ID', '도면파일'], vals: [42, 27, 35], max: 60, c: CC.bl },
      ],
    };
  }
  function installChartSwap(root, st) {
    if (typeof makeChart !== 'function') return;
    var savedAll = load(K_CHART), saved = savedAll[st.scene] || {};
    st.charts = {}; st.chartApply = {};
    var probe = document.createElement('i');
    probe.className = 'cc-probe';
    st.frame.appendChild(probe);
    var spec = specsFor(st.scene);
    var TG = [];
    Object.keys(spec).forEach(function (name) {
      all(st.frame, '[data-name="' + name + '"]').filter(function (x) { return getComputedStyle(x).display !== 'contents' && x.offsetWidth > 100 && x.offsetHeight > 80; })
        .forEach(function (x, i) {
          var area = /^Panel\//.test(name) ? { l: 25, t: 90, r: 25, b: 25 } : { l: 14, t: 50, r: 14, b: 14 };
          TG.push({ key: name + (i ? '#' + i : ''), w: x, area: area, list: spec[name] });
        });
    });
    TG.forEach(function (tg) {
      if (getComputedStyle(tg.w).position === 'static') tg.w.style.position = 'relative';
      var body = document.createElement('div');
      body.className = 'cc-chost';
      var a = tg.area;
      body.style.left = a.l + 'px'; body.style.top = a.t + 'px'; body.style.right = a.r + 'px'; body.style.bottom = a.b + 'px';
      body.style.display = 'none';
      tg.w.appendChild(body);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cc-chartbtn';
      btn.innerHTML = KIND_ICON.bar.replace('class="ic"', 'class="ic" style="width:13px;height:11px"') + '차트';
      btn.title = '이 패널의 차트 바꾸기';
      var menu = document.createElement('div');
      menu.className = 'cc-chartmenu';
      tg.w.appendChild(btn); tg.w.appendChild(menu);
      var cur = saved[tg.key] != null ? saved[tg.key] : -1;
      function render() {
        menu.innerHTML = '<div class="hd">추천 차트</div>'
          + tg.list.map(function (s, i) {
            return '<button type="button" data-i="' + i + '"' + (i === cur ? ' class="cur"' : '') + '>' + KIND_ICON[s.k] + esc(s.t) + ' · ' + KIND_NAME[s.k]
              + (i === 0 ? '<span class="rec">추천</span>' : '') + '</button>';
          }).join('')
          + '<div class="sep"></div><button type="button" data-i="-1"' + (cur < 0 ? ' class="cur"' : '') + '>' + KIND_ICON.orig + '원본 그대로</button>';
      }
      function apply(i) {
        cur = i;
        if (st.charts[tg.key]) { st.charts[tg.key].dispose(); delete st.charts[tg.key]; }
        body.style.display = i >= 0 ? 'block' : 'none';
        tg.w.classList.toggle('cc-hidekids', i >= 0);
        if (i >= 0 && tg.list[i]) st.charts[tg.key] = makeChart(body, Object.assign({ uid: ++chartUid }, tg.list[i]));
        var m = load(K_CHART);
        m[st.scene] = m[st.scene] || {};
        if (i >= 0) m[st.scene][tg.key] = i; else delete m[st.scene][tg.key];
        save(K_CHART, m);
        render();
      }
      render();
      var stop = function (e) { e.stopPropagation(); };
      btn.addEventListener('pointerdown', stop);
      menu.addEventListener('pointerdown', stop);
      btn.addEventListener('pointerup', function (e) {
        e.stopPropagation(); e.preventDefault();
        all(root, '.cc-chartmenu.open').forEach(function (m) { if (m !== menu) m.classList.remove('open'); });
        menu.classList.toggle('open');
      });
      menu.addEventListener('pointerup', function (e) {
        var b = e.target.closest('button[data-i]');
        e.stopPropagation(); e.preventDefault();
        if (!b) return;
        apply(+b.getAttribute('data-i'));
        menu.classList.remove('open');
      });
      st.chartApply[tg.key] = apply;
      if (cur >= 0) apply(cur);
    });
    syncChartHue(root, probe);
    st.timers.push(setInterval(function () { syncChartHue(root, probe); }, 1200));
    st.onDocDown = function (e) {
      if (e.target.closest && e.target.closest('.cc-chartmenu, .cc-chartbtn, .cc-selmenu, [data-name="Select"]')) return;
      all(root, '.cc-chartmenu.open').forEach(function (m) { m.classList.remove('open'); });
      all(root, '.cc-selmenu.open').forEach(function (m) { m.classList.remove('open'); m.parentElement.classList.remove('cc-open'); });
    };
    document.addEventListener('pointerdown', st.onDocDown, true);
  }

  /* ══════════════════ 10. 패널 옮기기(패널편집) — 4px 격자 ══════════════════ */
  function installPanelMove(root, st) {
    var L = load(K_LAYOUT), me = L[st.scene] = L[st.scene] || {};
    me.free = me.free || {};
    function persist() { var a = load(K_LAYOUT); a[st.scene] = me; save(K_LAYOUT, a); }
    var frees = [];
    /* 화면 맨 위 판(계통도 그림 · 제목 덮개 · 3D 장면은 빼고 — 제목 덮개를 옮기면 그림 속 원래 이름이 드러난다) */
    (st.boxes || []).forEach(function (r) { var n = nm(r.el); if (/^(Panel\/|Popup\/Detail$|Header$)/.test(n)) frees.push(r.el); });
    all(st.frame, '[data-name^="Section/"], [data-name="Popup/Detail"] [data-name="Content"] > [data-name="Tab Panels"]').forEach(function (f) { if (frees.indexOf(f) < 0 && f.offsetWidth > 40) frees.push(f); });
    var keyOf = function (f) { var n = nm(f), same = frees.filter(function (x) { return nm(x) === n; }); return same.length > 1 ? n + '#' + same.indexOf(f) : n; };
    frees.forEach(function (f) {
      f.classList.add('cc-mv'); placed(f);
      var s = me.free[keyOf(f)];
      if (s) { f.__ux = s[0]; f.__uy = s[1]; place(f); if (s[0] || s[1]) f.classList.add('cc-front'); }
    });
    var drag = null;
    st.onDown = function (e) {
      if (!layoutEditing(root) || e.button !== 0) return;
      if (e.target.closest('.cc-chartbtn, .cc-chartmenu, .cc-resetbtn')) return;
      if (e.target.closest('[contenteditable="true"]')) return;
      /* 안쪽 판(구역 · 탭 패널)을 먼저 잡는다 */
      var w = e.target.closest('.cc-mv');
      if (!w || !root.contains(w)) return;
      e.preventDefault(); e.stopPropagation();
      drag = { w: w, sx: e.clientX, sy: e.clientY, moved: false };
    };
    st.onMove = function (e) {
      if (!drag) return;
      var S = (st.frame.getBoundingClientRect().width / st.frame.offsetWidth) || st.S || 1;
      var dx = (e.clientX - drag.sx) / S, dy = (e.clientY - drag.sy) / S;
      if (!drag.moved) { if (Math.hypot(dx, dy) < 3) return; drag.moved = true; drag.w.classList.add('cc-dragging'); }
      drag.w.__dx = dx; drag.w.__dy = dy; place(drag.w);
    };
    st.onUp = function () {
      if (!drag) return;
      var d = drag; drag = null;
      var w = d.w;
      w.classList.remove('cc-dragging');
      if (!d.moved) return;
      var snap = function (v) { return Math.round(v / 4) * 4; };
      w.__ux = snap((w.__ux || 0) + (w.__dx || 0)); w.__uy = snap((w.__uy || 0) + (w.__dy || 0));
      w.__dx = 0; w.__dy = 0;
      place(w);
      me.free[keyOf(w)] = [w.__ux, w.__uy];
      all(root, '.cc-front').forEach(function (x) { if (x !== w) x.classList.remove('cc-front'); });
      w.classList.toggle('cc-front', !!(w.__ux || w.__uy));
      persist();
    };
    root.addEventListener('pointerdown', st.onDown, true);
    window.addEventListener('pointermove', st.onMove);
    window.addEventListener('pointerup', st.onUp);
    window.addEventListener('pointercancel', st.onUp);
    st.onDragStart = function (e) { if (layoutEditing(root) && e.target.closest && e.target.closest('.cc-mv')) e.preventDefault(); };
    root.addEventListener('dragstart', st.onDragStart);
    st.resetLayout = function () {
      me = { free: {} };
      var a = load(K_LAYOUT); a[st.scene] = me; save(K_LAYOUT, a);
      frees.forEach(function (f) { f.__ux = 0; f.__uy = 0; place(f); f.classList.remove('cc-front'); });
      Object.keys(st.chartApply || {}).forEach(function (k) { st.chartApply[k](-1); });
    };
    var rb = document.createElement('button');
    rb.type = 'button';
    rb.className = 'cc-resetbtn';
    rb.textContent = '배치 초기화';
    rb.title = '패널 자리 · 바꾼 차트를 원본으로';
    st.frame.appendChild(rb);
    rb.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    rb.addEventListener('pointerup', function (e) { e.stopPropagation(); e.preventDefault(); st.resetLayout(); });
    st.onReset = function (e) { if (e.target.closest && e.target.closest('#layoutReset')) st.resetLayout(); };
    document.addEventListener('click', st.onReset, true);
  }

  /* ══════════════════ 살리기 ══════════════════ */
  var SCENE_OF = { ccm: 'main', ccl: 'library', ccd: 'diagram', cce: 'detail', ccf: 'file-open' };
  function sceneOf(root) {
    var m = /\b(cc[mldef])-root\b/.exec(root.className);
    return { px: m ? m[1] : 'ccm', scene: m && SCENE_OF[m[1]] ? SCENE_OF[m[1]] : 'main' };
  }
  function start(root, st) {
    var steps = [['fit', installFit], ['clock', installClock], ['dates', function (r, s) { shiftDates(s.frame); }], ['leftfold', installLeftFold], ['nav', installNav], ['map', installMap],
      ['library', installLibrary], ['tag', installTag], ['popup', installPopup], ['scroll', function (r, s) { installScroll(r, s); }],
      ['swap', installChartSwap], ['move', installPanelMove], ['through', function (r, s) { passThrough(s.frame); }]];
    steps.forEach(function (s) { try { s[1](root, st); } catch (e) { console.warn('[cc] ' + s[0], e); } });
    all(root, '[data-name="Panel/Map"] > *').forEach(function (c, i) { c.style.setProperty('--i', i); });
    root.classList.add('cc-enter');
    st.timers.push(setTimeout(function () { root.classList.remove('cc-enter'); }, 1500));
  }
  function initCcpp(root) {
    if (!root || root.__cc) return;
    injectStyle();
    root.classList.add('cc-root');
    var so = sceneOf(root);
    var st = root.__cc = { timers: [], scene: so.scene, px: so.px, onLayout: [] };
    if (/[?&]edit=1/.test(location.search)) root.classList.add('cc-edit-layout');
    if (root.clientWidth && root.clientHeight) { start(root, st); return; }
    if (window.ResizeObserver) {
      st.wait = new ResizeObserver(function () {
        if (!root.clientWidth || !root.clientHeight) return;
        st.wait.disconnect(); st.wait = null;
        start(root, st);
      });
      st.wait.observe(root);
    } else start(root, st);
  }
  function disposeCcpp(root) {
    var st = root && root.__cc;
    if (!st) return;
    if (st.wait) st.wait.disconnect();
    st.timers.forEach(function (t) { clearInterval(t); clearTimeout(t); });
    clearTimeout(st.toastT);
    if (st.ro) st.ro.disconnect();
    if (st.themeMO) st.themeMO.disconnect();
    if (st.onResize) window.removeEventListener('resize', st.onResize);
    Object.keys(st.charts || {}).forEach(function (k) { st.charts[k].dispose(); });
    (st.opCharts || []).forEach(function (c) { c.dispose(); });
    if (st.onDocDown) document.removeEventListener('pointerdown', st.onDocDown, true);
    if (st.onDown) root.removeEventListener('pointerdown', st.onDown, true);
    if (st.onMove) window.removeEventListener('pointermove', st.onMove);
    if (st.onUp) { window.removeEventListener('pointerup', st.onUp); window.removeEventListener('pointercancel', st.onUp); }
    if (st.onDragStart) root.removeEventListener('dragstart', st.onDragStart);
    if (st.onReset) document.removeEventListener('click', st.onReset, true);
    root.__cc = null;
  }
  window.initCcpp = initCcpp;
  window.disposeCcpp = disposeCcpp;
})();
