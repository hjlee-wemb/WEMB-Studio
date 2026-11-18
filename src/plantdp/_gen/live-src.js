/* 발전소 디지털트윈 방재 — 재구축 화면 10장의 인터랙션 · 라이브 · 반응형 레이어.
   window.initPlantdp(root) / window.disposePlantdp(root)

   화면(DOM·CSS)은 생성기(src/plantdp/_gen/conv.js)가 Figma(QVCXpLxrGKG7Id7s9SSszf, REM 섹션) 그대로 만든다.
   이 파일은 그 위에 '움직이는 것'만 얹는다 — 정지 상태(?live=0) = Figma 원본.

   · 반응형 — 1920x1080 좌표계 + 균일 배율 S. 남는 폭 · 높이는 3D 장면 · 헤더 · 이벤트 로그 · 패널이 나눠 갖는다(여백 없음).
   · 실시간 시계, 이벤트 발생시각 = 열 때마다 최근, 새 이벤트가 맨 위로 흘러 들어온다. SOP 경과 시간이 1초씩 흐른다.
   · 마우스 오버 · 눌림 — 헤더 · 레일 · 필터 · 상세보기 · 표 줄 · 칩 · 카드 · 층 선택 · 닫기
   · Event List Fold Button — 이벤트 현황 화면은 그 자리에서 접고 펴고, 접힌 화면들은 위 화살표로 펼친 화면으로 부드럽게 넘어간다.
   · 라이브 차트 — 지진 파형이 흐르고, 기상 추이선이 실시간처럼 이어지며 현재값 · 측정값이 같이 바뀐다.
   · 스크롤 — 필터 목록 · 단계별 작업 항목 · 실행 이력(Figma 마스크 창은 그대로, 내용만 움직인다).
   · 차트 바꾸기(패널편집 중) — 패널마다 발전소 방재에 맞춘 추천 차트. 첫 항목 = 추천, '원본 그대로'로 되돌린다.
   · 패널 옮기기(패널편집 중) — 4px 격자로 자유롭게.

   손으로 쓴 파일이다(생성물 아님). 고친 뒤 node mk-live.js → js/core/tpl-modules.js 의 ?v= 를 올릴 것. */
(function () {
  'use strict';

  var BASE_W = 1920, BASE_H = 1080;
  var K_LAYOUT = 'wemb-plantdp-layout', K_CHART = 'wemb-plantdp-chart', K_FOLD = 'wemb-plantdp-fold';
  var STYLE_ID = 'plantdp-live-style';
  var EASE = 'cubic-bezier(.22,.8,.24,1)';
  var EL_SLIDE = 180;                                 /* 펼친 Event Log 의 표 높이(접으면 이만큼 내려간다) */
  var ORIG_NOW = { h: 14, m: 32, s: 8 };              /* 시안의 기준 시각(가상 데이터 14:32:08) — 시각 글자를 지금으로 옮긴다 */

  /* ══════════════════ 스타일 ══════════════════ */
  var B = '[data-name^="Button/"]';
  var CSS = [
    '.pd-root{--pd-acc:42,116,244;overflow:clip!important;}',
    '.pd-root.pd-resizing *,.pd-root .pd-dragging,.pd-root .pd-dragging *{transition:none!important;}',
    '.pd-root.pd-live .pd-place{transition:translate .5s ' + EASE + ',opacity .3s ease;}',
    '.pd-root .pd-probe{position:absolute;width:0;height:0;overflow:hidden;color:#2a74f4;}',
    '.pd-root .pd-click{cursor:pointer;}',
    '.pd-root .pd-click *{cursor:inherit;}',
    '.dt-content-editing .pd-root .pd-click,.dt-content-editing .pd-root .pd-click *{cursor:text;}',
    '.pd-root [data-name^="Stage/"] img{object-fit:cover;}',
    '@keyframes pdIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}}',
    '@keyframes pdFade{from{opacity:0;}to{opacity:1;}}',
    '@keyframes pdPop{from{opacity:0;transform:translateY(14px) scale(.985);}to{opacity:1;transform:none;}}',
    '@keyframes pdLeft{from{opacity:0;transform:translateX(-18px);}to{opacity:1;transform:none;}}',
    '@keyframes pdRight{from{opacity:0;transform:translateX(18px);}to{opacity:1;transform:none;}}',
    '.pd-root.pd-enter [data-name="Side Panel"] > *{animation:pdRight .55s ' + EASE + ' both;animation-delay:calc(var(--i,0) * 70ms);}',
    '.pd-root.pd-enter [data-name="Filter Panel"],.pd-root.pd-enter [data-name="Side Rail"],.pd-root.pd-enter [data-name="Side Panel/SOP List"]{animation:pdLeft .5s ' + EASE + ' both;}',
    '.pd-root.pd-enter [data-name="Side Panel/Execution History"]{animation:pdRight .5s ' + EASE + ' both;}',
    '.pd-root.pd-enter [data-name="Main Panel"] > *{animation:pdIn .5s ' + EASE + ' both;animation-delay:calc(var(--i,0) * 80ms);}',
    '.pd-root.pd-enter [data-name="Dim"]{animation:pdFade .3s ease both;}',
    '.pd-root.pd-enter [data-name^="Popup/"]{animation:pdPop .45s ' + EASE + ' both;}',
    '.pd-root.pd-enter [data-name="Overlay"] > *,.pd-root.pd-enter [data-name="Floor Selector Wrap"]{animation:pdIn .5s ' + EASE + ' both;}',
    '.pd-root.pd-enter [data-name="Login Panel"]{animation:pdRight .55s ' + EASE + ' both;}',

    /* 단추 · 아이콘 단추 — 살짝 떠오르고 빛난다 */
    '.pd-root ' + B + ',.pd-root [data-name^="btn-"],.pd-root [data-name^="Category/"],.pd-root [data-name^="Option/"],.pd-root [data-name^="Tag/"]{transition:filter .2s ease,translate .2s ' + EASE + ',scale .2s ' + EASE + ',box-shadow .25s ease,background-color .2s ease;}',
    '.pd-root ' + B + ':hover,.pd-root [data-name^="btn-"]:hover{filter:brightness(1.06) drop-shadow(0 3px 8px rgba(42,116,244,.28));translate:0 -1px;}',
    '.pd-root ' + B + ':active,.pd-root [data-name^="btn-"]:active{translate:0 1px;filter:brightness(.95);}',
    '.pd-root [data-name^="Category/"]{cursor:pointer;}',
    '.pd-root [data-name^="Category/"]:hover{scale:1.05;filter:drop-shadow(0 4px 10px rgba(42,116,244,.3));}',
    '.pd-root [data-name^="Category/"].pd-on{filter:drop-shadow(0 0 8px rgba(42,116,244,.6));}',
    '.pd-root [data-name="Button/Close"]{cursor:pointer;transition:rotate .3s ' + EASE + ',filter .2s ease;}',
    '.pd-root [data-name="Button/Close"]:hover{rotate:90deg;filter:brightness(.85);translate:none;}',
    '.pd-root [data-name="Dim"]{cursor:pointer;}',
    '.pd-root [data-name="Button/View Details"]:hover p{text-decoration:underline;}',
    /* 필터 패널 */
    '.pd-root [data-name="Filter Panel"] [data-name^="btn-tab"]{cursor:pointer;border-radius:8px;transition:background-color .2s ease;}',
    /* 호버는 덮개만 — 바탕색을 바꾸면 활성 탭(파란 알약)의 색까지 지워졌다 */
    '.pd-root [data-name="Filter Panel"] [data-name^="btn-tab"]:hover{background-image:linear-gradient(rgba(42,116,244,.1),rgba(42,116,244,.1));}',
    '.pd-root [data-name="Filter Panel"] [data-name="row"],.pd-root [data-name="Filter Panel"] [data-name="block3"]{cursor:pointer;transition:filter .2s ease,translate .2s ' + EASE + ';}',
    '.pd-root [data-name="Filter Panel"] [data-name="row"]:hover,.pd-root [data-name="Filter Panel"] [data-name="block3"]:hover{filter:drop-shadow(0 3px 8px rgba(42,116,244,.22));translate:2px 0;}',
    /* 이벤트 로그 */
    '.pd-root [data-name="Event Log"]{transition:translate .55s ' + EASE + ';}',
    '.pd-root [data-name="Event Log"] [data-name="Table"]{transition:opacity .35s ease;}',
    '.pd-root [data-name="Event Log"].pd-shut [data-name="Table"]{opacity:0;pointer-events:none;}',
    '.pd-root [data-name="Event Log"] .pd-foldbtn,.pd-root [data-name="Event Log"] [data-name="Button/Expand"],.pd-root [data-name="Event Log"] [data-name="Button/Collapse"],.pd-root [data-name="Event Log"] [data-name="Group 291"],.pd-root [data-name="Event Log"] [data-name="Group 292"]{cursor:pointer;transition:filter .2s ease,scale .2s ' + EASE + ';}',
    '.pd-root [data-name="Event Log"] .pd-foldbtn:hover,.pd-root [data-name="Event Log"] [data-name="Button/Expand"]:hover,.pd-root [data-name="Event Log"] [data-name="Button/Collapse"]:hover,.pd-root [data-name="Event Log"] [data-name="Group 291"]:hover,.pd-root [data-name="Event Log"] [data-name="Group 292"]:hover{scale:1.15;filter:drop-shadow(0 0 5px rgba(42,116,244,.7));translate:none;}',
    '.pd-root [data-name="Event Log"] [data-name^="Row/"],.pd-root [data-name="Event Log"] [data-name="grid-row"]{transition:filter .2s ease;}',
    '.pd-root [data-name="Event Log"] [data-name^="Row/"]:hover,.pd-root [data-name="Event Log"] [data-name="grid-row"]:hover{filter:brightness(.97) drop-shadow(0 2px 6px rgba(42,116,244,.18));cursor:pointer;}',
    '.pd-root [data-name="Grade Counts"] > *,.pd-root [data-name="Count/All"],.pd-root [data-name="alarm box"] > *{cursor:pointer;transition:filter .2s ease,translate .2s ' + EASE + ',opacity .25s ease;}',
    '.pd-root [data-name="Grade Counts"] > *:hover,.pd-root [data-name="Count/All"]:hover{filter:brightness(1.04) drop-shadow(0 3px 8px rgba(0,0,0,.12));translate:0 -1px;}',
    '.pd-root .pd-new{animation:pdNew 1.8s ease;}',
    '@keyframes pdNew{0%{filter:brightness(1.1) drop-shadow(0 0 10px rgba(42,116,244,.55));}100%{filter:none;}}',
    '@keyframes pdBlink{0%,100%{opacity:1;}50%{opacity:.35;}}',
    '.pd-root [data-name="Header"] [data-name="label"]{animation:pdBlink 1.6s ease-in-out infinite;}',
    '.pd-root.pd-calm [data-name="Header"] [data-name="label"]{animation:none;}',
    /* SOP · 카드 · 목록 */
    '.pd-root [data-name^="Item/"],.pd-root [data-name^="Card/Stage"],.pd-root [data-name^="Task"],.pd-root [data-name^="Row/"]{transition:filter .2s ease,translate .2s ' + EASE + ',box-shadow .25s ease;}',
    '.pd-root [data-name="Side Panel/SOP List"] [data-name^="Item/"]{cursor:pointer;}',
    '.pd-root [data-name="Side Panel/SOP List"] [data-name^="Item/"]:hover,.pd-root [data-name^="Card/Stage"]:hover{filter:drop-shadow(0 6px 14px rgba(42,116,244,.22));translate:0 -2px;}',
    '.pd-root [data-name="Table"] [data-name^="Row/"]:hover,.pd-root [data-name="History"] [data-name^="Task"]:hover{filter:brightness(.97) drop-shadow(0 2px 6px rgba(42,116,244,.16));}',
    '.pd-root [data-name="Floor Selector"] [data-name^="Option/"]{cursor:pointer;}',
    '.pd-root [data-name="Floor Selector"] [data-name^="Option/"]:hover{filter:brightness(1.05) drop-shadow(0 4px 10px rgba(42,116,244,.3));translate:-2px 0;}',
    '.pd-root [data-name="Floor Selector"] .pd-cur{box-shadow:inset 0 0 0 2px rgb(var(--pd-acc));}',
    '.pd-root [data-name="Building Label"]{cursor:pointer;transition:translate .25s ' + EASE + ',filter .25s ease;}',
    '.pd-root [data-name="Building Label"]:hover{translate:0 -3px;filter:drop-shadow(0 8px 16px rgba(0,0,0,.25));}',
    '.pd-root [data-name^="Icon/Arrow"]{cursor:pointer;transition:scale .2s ' + EASE + ',filter .2s ease;}',
    '.pd-root [data-name^="Icon/Arrow"]:hover{scale:1.12;filter:drop-shadow(0 0 6px rgba(42,116,244,.6));}',
    '.pd-root [data-name^="Period Options"] [data-name="btn-3D move"],.pd-root [data-name^="Option/"]{cursor:pointer;}',
    '.pd-root .pd-hidecur{opacity:.0;}',
    /* 라이브 차트 */
    '.pd-root .pd-live-svg{position:absolute;left:0;top:0;pointer-events:none;overflow:visible;}',
    '.pd-root .pd-src-hidden{visibility:hidden!important;}',
    '.pd-root .pd-tick{transition:color .4s ease;}',
    /* 스크롤 */
    '.pd-root .pd-scroller{cursor:ns-resize;}',
    '.pd-root .pd-thumb{cursor:grab;transition:filter .2s ease;}',
    '.pd-root .pd-thumb:hover{filter:brightness(.85) drop-shadow(0 0 4px rgba(42,116,244,.5));}',
    '.pd-root .pd-thumb.pd-grab{cursor:grabbing;}',
    /* 토스트 */
    '.pd-root .pd-toast{position:absolute;left:50%;top:84px;z-index:90;translate:-50% -8px;opacity:0;padding:11px 20px;border:1px solid rgba(42,116,244,.45);border-radius:12px;background:rgba(255,255,255,.96);color:#1f2a44;font:600 15px/1 "Pretendard Variable",Pretendard,sans-serif;pointer-events:none;transition:opacity .25s ease,translate .3s ' + EASE + ';white-space:nowrap;box-shadow:0 10px 24px rgba(30,60,120,.18);}',
    '.pd-root .pd-toast.on{opacity:1;translate:-50% 0;}',
    /* 패널편집 */
    '.dt-editing .pd-root .pd-mv,.pd-root.pd-edit-layout .pd-mv{cursor:grab!important;}',
    '.dt-editing .pd-root .pd-mv *,.pd-root.pd-edit-layout .pd-mv *{cursor:grab!important;}',
    '.dt-editing .pd-root .pd-mv:hover,.pd-root.pd-edit-layout .pd-mv:hover{outline:1px dashed rgba(var(--pd-acc),.85);outline-offset:3px;}',
    '.pd-root .pd-mv.pd-front{z-index:20;}',
    '.pd-root .pd-mv.pd-dragging{z-index:30;filter:drop-shadow(0 16px 26px rgba(30,60,120,.28));cursor:grabbing!important;}',
    '.pd-root .pd-resetbtn{position:absolute;left:430px;top:84px;z-index:45;display:none;height:30px;padding:0 12px;border:1px solid rgb(var(--pd-acc));border-radius:8px;background:#fff;color:#1f2a44;font:600 13px/1 "Pretendard Variable",Pretendard,sans-serif;cursor:pointer;}',
    '.pd-root .pd-resetbtn:hover{box-shadow:0 0 12px rgba(var(--pd-acc),.45);}',
    '.dt-editing .pd-root .pd-resetbtn,.pd-root.pd-edit-layout .pd-resetbtn{display:block;}',
    '.dt-editing .pd-root [data-name]{animation-play-state:paused!important;}',
    '.pd-root .pd-swapped > *:not(.pd-chart):not(.pd-chartbtn):not(.pd-chartmenu){visibility:hidden!important;}',
    '.pd-root .pd-chost{position:absolute;z-index:6;pointer-events:auto;}',
    '.pd-root .pd-hidekids > *:not(.pd-chost):not(.pd-chartbtn):not(.pd-chartmenu):not([data-name="Header"]):not([data-name="Title Group"]):not([data-name="Toolbar"]){visibility:hidden!important;}',
    '.pd-root .pd-chart{border-radius:inherit;z-index:2;}',
    '.pd-root .pd-chartbtn{position:absolute;top:12px;right:16px;z-index:46;}',
    '.pd-root .pd-chartmenu{top:38px;right:14px;z-index:47;}',
    '.pd-root :has(> .pd-chartmenu.open){z-index:50!important;}',
    /* 체크 · 선택 — Figma row(normal/checked) · btn-all check(Default/Variant2) · block2/block3 선택 모양 */
    '.pd-root .pd-chk .pd-rowbg{border-color:#2a74f4!important;box-shadow:inset 0 0 0 1px #2a74f4;}',
    '.pd-root .pd-chk .pd-cbox{background:var(--pd-chk) center/100% 100% no-repeat!important;border-color:transparent!important;}',
    '.pd-root .pd-allchk.pd-chk .pd-cbox{background:var(--pd-chk-all) center/100% 100% no-repeat!important;}',
    '.pd-root .pd-unchk .pd-rowbg{border-color:#d6dde6!important;border-width:1px!important;}',
    '.pd-root .pd-unchk .pd-cbox{background:#fff!important;box-shadow:inset 0 0 0 1px #d7e1f0;border-radius:4px;}',
    '.pd-root .pd-unchk .pd-cbox img{visibility:hidden;}',
    '.pd-root .pd-allchk{cursor:pointer;}',
    '.pd-root .pd-allchk.pd-chk p{color:#2a74f4!important;}',
    '.pd-root .pd-allchk.pd-unchk p{color:#7086a0!important;}',
    '.pd-root [data-name="block1"],.pd-root [data-name="block2"]{cursor:pointer;transition:filter .2s ease,translate .2s ' + EASE + ',box-shadow .2s ease;}',
    '.pd-root [data-name="block2"]:hover{filter:drop-shadow(0 3px 8px rgba(42,116,244,.22));translate:2px 0;}',
    '.pd-root [data-name="block2"].pd-sel{box-shadow:inset 0 0 0 2px #2a74f4;}',
    '.pd-root [data-name="block2"].pd-unsel{border-color:transparent!important;}',
    '.pd-root [data-name="block2"].pd-hit p{color:#2a74f4!important;}',
    '.pd-root [data-name="block3"].pd-sel .pd-rowbg{border-color:#2a74f4!important;box-shadow:inset 0 0 0 1px #2a74f4;}',
    '.pd-root [data-name="block3"].pd-unsel .pd-rowbg{border-color:#d7e1f0!important;border-width:1px!important;}',
    '.pd-root .pd-iconset > [data-name]{cursor:pointer;transition:filter .2s ease,scale .2s ' + EASE + ';}',
    '.pd-root .pd-iconset > [data-name]:hover{scale:1.08;filter:drop-shadow(0 2px 6px rgba(42,116,244,.35));}',
    '.pd-root [data-name="search"],.pd-root [data-name="Search Field"]{cursor:text;}',
    /* 입력칸 */
    '.pd-root .pd-inp{position:absolute;z-index:3;margin:0;padding:0;border:0;outline:none;background:transparent;color:#303a46;font-family:"Pretendard Variable",Pretendard,sans-serif;opacity:0;pointer-events:none;caret-color:#2a74f4;}',
    '.pd-root .pd-typing .pd-inp,.pd-root .pd-hasval .pd-inp{opacity:1;pointer-events:auto;}',
    '.pd-root .pd-typing .pd-inp-src,.pd-root .pd-hasval .pd-inp-src{visibility:hidden;}',
    '.pd-root .pd-typing{box-shadow:0 0 0 2px rgba(42,116,244,.35);border-radius:18px;}',
    '.dt-content-editing .pd-root .pd-inp,.dt-editing .pd-root .pd-inp{display:none;}',
    '.pd-root .pd-dtpick{position:absolute;left:0;bottom:0;width:1px;height:1px;opacity:0;pointer-events:none;border:0;padding:0;}',
    '.pd-root [data-name="Field/Start Date"],.pd-root [data-name="Field/End Date"]{cursor:pointer;}',
    /* 등급 칩 · 표 줄 */
    '.pd-root .pd-chipon{outline:2px solid rgb(var(--pd-acc));outline-offset:1px;border-radius:16px;}',
    '.pd-root .pd-chipdim{opacity:.42;}',
    '.pd-root [data-name="Event Log"] .pd-rowsel{box-shadow:inset 0 0 0 2px rgb(var(--pd-acc));border-radius:6px;}',
    /* 오른쪽 위젯 묶음 접기 */
    '.pd-root [data-name="Side Panel"] > *{transition:opacity .35s ease;}',
    '.pd-root [data-name="Side Panel"].pd-spshut > *:not([data-name^="Button/Collapse"]):not(:has([data-name="Button/Collapse"])){opacity:0;pointer-events:none;}',
    '.pd-root [data-name="Side Panel"] [data-name="Button/Collapse"]{cursor:pointer;transition:rotate .35s ' + EASE + ',filter .2s ease;}',
    '.pd-root [data-name="Side Panel"].pd-spshut [data-name="Button/Collapse"]{rotate:180deg;}',
    /* 고르기(전체 · 진행중 · 대기 · 완료) */
    '.pd-root [data-name="Select"]{cursor:pointer;}',
    '.pd-root .pd-selmenu{position:absolute;left:0;top:calc(100% + 4px);z-index:60;min-width:100%;display:none;flex-direction:column;gap:2px;padding:4px;border-radius:10px;background:#fff;border:1px solid #d7e1f0;box-shadow:0 10px 24px rgba(30,60,120,.18);}',
    '.pd-root .pd-selmenu.open{display:flex;animation:pdIn .2s ' + EASE + ' both;}',
    '.pd-root .pd-selmenu button{all:unset;box-sizing:border-box;padding:6px 10px;border-radius:6px;font:600 13px/1.2 "Pretendard Variable",Pretendard,sans-serif;color:#303a46;cursor:pointer;white-space:nowrap;}',
    '.pd-root .pd-selmenu button:hover{background:rgba(42,116,244,.1);}',
    '.pd-root .pd-selmenu button.cur{color:#2a74f4;}',
    '.pd-root [data-name="Select"] [data-name^="Icon/Chevron"]{transition:rotate .25s ' + EASE + ';}',
    '.pd-root [data-name="Select"].pd-open [data-name^="Icon/Chevron"]{rotate:180deg;}',
    '.pd-root :has(> .pd-selmenu.open),.pd-root :has(> * > .pd-selmenu.open){z-index:55!important;overflow:visible!important;}',
    /* 툴팁 — 제 단추에 올렸을 때만(패널편집 중엔 모두 보여 글자를 고친다) */
    '.pd-root .pd-tip{opacity:0;translate:-6px 0;transition:opacity .18s ease,translate .22s ' + EASE + ';}',
    '.pd-root .pd-tip,.pd-root .pd-tip *{pointer-events:none!important;}',
    '.pd-root .pd-tip.pd-tip-on{opacity:1;translate:0 0;transition-delay:.06s;}',
    '.dt-content-editing .pd-root .pd-tip,.dt-editing .pd-root .pd-tip{opacity:1;translate:0 0;}',
    '.dt-content-editing .pd-root .pd-tip,.dt-content-editing .pd-root .pd-tip *{pointer-events:auto!important;}',
    /* 범례 끄기 */
    '.pd-root [data-name^="Legend"] [data-name^="Item"]{cursor:pointer;transition:opacity .25s ease;}',
    '.pd-root .pd-legoff{opacity:.38;}',
    /* 다크 */
    '.pd-root[data-theme="dark"] .pd-unchk .pd-rowbg{border-color:#2b3039!important;}',
    '.pd-root[data-theme="dark"] .pd-unchk .pd-cbox{background:#171a20!important;box-shadow:inset 0 0 0 1px #2c323d;}',
    '.pd-root[data-theme="dark"] [data-name="block3"].pd-unsel .pd-rowbg{border-color:#2c323d!important;}',
    '.pd-root[data-theme="dark"] .pd-inp{color:#e6ebf2;}',
    '.pd-root[data-theme="dark"] .pd-selmenu{background:#1a1f29;border-color:#2c323d;box-shadow:0 10px 24px rgba(0,0,0,.5);}',
    '.pd-root[data-theme="dark"] .pd-selmenu button{color:#e6ebf2;}',
    '.pd-root[data-theme="dark"] .pd-selmenu button.cur{color:#76a3ff;}',
    /*@CHART_CSS*/
    /* 다크 — 흰 판 대신 그래파이트 판이라 빛 · 그림자를 바꾼다 */
    '.pd-root[data-theme="dark"] .pd-toast{background:rgba(22,26,34,.96);color:#e8edf6;border-color:rgba(120,160,255,.45);box-shadow:0 10px 24px rgba(0,0,0,.5);}',
    '.pd-root[data-theme="dark"] .pd-resetbtn{background:#1a1f29;color:#e8edf6;}',
    '.pd-root[data-theme="dark"] ' + B + ':hover,.pd-root[data-theme="dark"] [data-name^="btn-"]:hover{filter:brightness(1.18) drop-shadow(0 3px 10px rgba(80,140,255,.35));}',
    '.pd-root[data-theme="dark"] [data-name="Filter Panel"] [data-name^="btn-tab"]:hover{background-image:linear-gradient(rgba(120,160,255,.16),rgba(120,160,255,.16));}',
    /* SOP 진행 — 지금 진행 중인 단계 · 작업이 한눈에 보이게(installSop). 덧붙인 층은 .pd-fx(클릭 · 편집에 안 걸림) */
    '.pd-root .pd-fx{position:absolute;pointer-events:none;}',
    '@keyframes pdRing{0%,100%{box-shadow:0 0 0 2px rgba(var(--pd-acc),.95),0 0 0 0 rgba(var(--pd-acc),.45),0 8px 22px rgba(var(--pd-acc),.28);}50%{box-shadow:0 0 0 2px rgba(var(--pd-acc),.95),0 0 0 7px rgba(var(--pd-acc),0),0 10px 28px rgba(var(--pd-acc),.42);}}',
    '@keyframes pdSweep{0%{transform:translateX(-120%) skewX(-18deg);}60%,100%{transform:translateX(320%) skewX(-18deg);}}',
    '@keyframes pdStrip{0%{background-position:0 0;}100%{background-position:28px 0;}}',
    '@keyframes pdDot{0%,100%{opacity:1;transform:translateY(-50%) scale(1);}50%{opacity:.35;transform:translateY(-50%) scale(.7);}}',
    '@keyframes pdNudge{0%,100%{translate:0 0;}50%{translate:4px 0;}}',
    '@keyframes pdSegIn{0%{opacity:0;transform:scaleY(.3);}100%{opacity:1;transform:none;}}',
    '@keyframes pdSegWave{0%,70%,100%{filter:none;}80%{filter:brightness(1.45) drop-shadow(0 0 4px rgba(44,230,185,.8));}}',
    '@keyframes pdSegHead{0%,100%{opacity:.35;}50%{opacity:1;}}',
    '@keyframes pdSpin{to{transform:rotate(360deg);}}',
    '@keyframes pdPulse{0%,100%{transform:scale(1);}50%{transform:scale(1.22);}}',
    '@keyframes pdTask{0%,100%{background:rgba(var(--pd-acc),.07);}50%{background:rgba(var(--pd-acc),.16);}}',
    '@keyframes pdBadge{0%,100%{box-shadow:0 0 0 0 rgba(var(--pd-acc),.55);}60%{box-shadow:0 0 0 5px rgba(var(--pd-acc),0);}}',
    '@keyframes pdBob{0%,100%{translate:0 0;}50%{translate:0 3px;}}',
    '.pd-root .pd-ring{inset:0;border-radius:inherit;animation:pdRing 2s ease-in-out infinite;z-index:3;}',
    '.pd-root .pd-fill{overflow:hidden;}',
    '.pd-root .pd-sweep{top:0;bottom:0;left:0;width:38%;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.34),rgba(255,255,255,0));animation:pdSweep 2.8s ease-in-out infinite;}',
    '.pd-root .pd-strip{left:0;right:0;bottom:0;height:4px;background:rgba(255,255,255,.28);}',
    '.pd-root .pd-strip > i{position:absolute;left:0;top:0;bottom:0;width:var(--w,50%);background:repeating-linear-gradient(-45deg,#fff 0 7px,rgba(255,255,255,.55) 7px 14px);background-size:28px 100%;animation:pdStrip .9s linear infinite;transition:width .8s ' + EASE + ';}',
    '.pd-root .pd-livetxt{overflow:visible!important;}',
    '.pd-root .pd-livetxt::before{content:"";position:absolute;left:-12px;top:50%;width:7px;height:7px;border-radius:50%;background:rgb(var(--pd-acc));box-shadow:0 0 6px rgba(var(--pd-acc),.9);animation:pdDot 1.2s ease-in-out infinite;}',
    '.pd-root .pd-stg-wait{opacity:.62;transition:opacity .25s ease;}',
    '.pd-root .pd-stg-wait:hover{opacity:1;}',
    '.pd-root .pd-stg-done{opacity:.9;}',
    '.pd-root .pd-caret-on{animation:pdNudge 1.1s ease-in-out infinite;}',
    '.pd-root .pd-caret-off{opacity:.45;}',
    '.pd-root .pd-seg-on{transform-origin:50% 100%;animation:pdSegIn .35s ' + EASE + ' both,pdSegWave 2.6s ease-in-out infinite;animation-delay:var(--d1,0s),var(--d2,0s);}',
    '.pd-root .pd-seg-head{background-image:linear-gradient(to right,#2ce6b9,#20a685)!important;animation:pdSegHead 1s ease-in-out infinite;}',
    '.pd-root .pd-spin{animation:pdSpin 1.6s linear infinite;transform-origin:50% 50%;}',
    '.pd-root .pd-pulse{animation:pdPulse 1.2s ease-in-out infinite;transform-origin:50% 50%;}',
    '.pd-root .pd-taskglow{inset:0;border-left:3px solid rgb(var(--pd-acc));animation:pdTask 1.8s ease-in-out infinite;z-index:2;}',
    '.pd-root .pd-badge-live{animation:pdBadge 1.6s ease-out infinite;}',
    '.pd-root .pd-bob{animation:pdBob 1.4s ease-in-out infinite;}',
    '.pd-root[data-theme="dark"] .pd-taskglow{border-left-color:#5b9bff;}',
    '@media (prefers-reduced-motion:reduce){.pd-root .pd-ring,.pd-root .pd-sweep,.pd-root .pd-strip > i,.pd-root .pd-livetxt::before,.pd-root .pd-caret-on,.pd-root .pd-seg-on,.pd-root .pd-seg-head,.pd-root .pd-spin,.pd-root .pd-pulse,.pd-root .pd-taskglow,.pd-root .pd-badge-live,.pd-root .pd-bob{animation:none!important;}}',
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
  function layoutEditing(root) { return !!(root.closest('.dt-editing') || root.classList.contains('pd-edit-layout')); }
  function idle() { return typeof window.__wembIdle === 'function' ? window.__wembIdle() : document.hidden; }
  function load(k) { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  /* 사람이 고친 글자는 덮지 않는다 */
  function claimed(p) { return p.__pdLast != null && p.textContent !== p.__pdLast; }
  function write(p, s) {
    if (!p || p === document.activeElement || claimed(p)) return;
    if (p.textContent !== s) p.textContent = s;
    p.__pdLast = p.textContent;
  }
  /* 크기가 다른 span(값 + 단위)은 값 span 만 바꾼다 */
  function writeValue(p, s) {
    if (!p || p === document.activeElement || claimed(p)) return;
    var sp = p.querySelector('span');
    if (sp) { if (sp.textContent !== s) sp.textContent = s; } else if (p.textContent !== s) p.textContent = s;
    p.__pdLast = p.textContent;
  }
  function clickable(el, fn) {
    if (!el || el.__pdClick) return;
    el.__pdClick = 1;
    el.classList.add('pd-click');
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
  function placed(el) { if (el) el.classList.add('pd-place'); return el; }
  function goto(scene) {
    if (window.__gotoPlantdpScene) { window.__gotoPlantdpScene(scene); return; }
    location.href = scene + '.html' + location.search;
  }
  function toast(st, msg) {
    var t = st.toast;
    if (!t) { t = st.toast = document.createElement('div'); t.className = 'pd-toast'; st.frame.appendChild(t); }
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(st.toastT);
    st.toastT = setTimeout(function () { t.classList.remove('on'); }, 1900);
  }
  function now() { return new Date(); }
  var DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  function ymd(d) { return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); }
  function hms(d) { return p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds()); }
  function ampm(d) { var h = d.getHours(); return (h < 12 ? '오전 ' : '오후 ') + p2(h % 12 === 0 && h >= 12 ? 12 : h % 12) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds()); }
  /* 화면 안 실제 상자(배율을 걷어낸 1920 좌표) */
  function box(el, st) {
    var r = el.getBoundingClientRect(), f = st.frame.getBoundingClientRect(), S = st.S || 1;
    return { x: (r.left - f.left) / S, y: (r.top - f.top) / S, w: r.width / S, h: r.height / S };
  }

  /* ══════════════════ 1. 화면 맞추기 ══════════════════
     좌표계는 1920x1080 그대로, 판 비율만큼 캔버스를 넓힌다(exW · exH) — 3D 장면은 판을 채우고(cover),
     헤더 · 이벤트 로그는 폭을 늘리며 오른쪽 부품은 끝에, 가운데 부품은 가운데에 다시 붙는다. 왼쪽 판은 아래로 늘어난다. */
  function anchorX(el, depth, out) {
    /* 폭을 거의 다 차지하는 자식은 같이 늘리고 그 안으로, 나머지는 가운데 위치로 오른쪽 · 가운데 · 왼쪽을 가른다 */
    var pw = el.__w0 || el.offsetWidth;
    kids(el).forEach(function (c) {
      var cs = getComputedStyle(c);
      if (cs.display === 'contents') { anchorX(Object.assign(c, { __w0: pw, __l0: el.__l0 || 0 }), depth, out); return; }
      var r0 = c.__r0 || (c.__r0 = { l: c.offsetLeft, w: c.offsetWidth });
      if (!r0.w) return;
      var cx = (r0.l + r0.w / 2) / pw;
      if (r0.w >= pw * 0.9) {
        out.push({ el: c, kind: 'w', w0: r0.w });
        if (depth > 0) { c.__w0 = r0.w; anchorX(c, depth - 1, out); }
      } else if (cx > 0.62) out.push({ el: c, kind: 'x', k: 1 });
      else if (cx > 0.4) out.push({ el: c, kind: 'x', k: 0.5 });
    });
  }
  function installFit(root, st) {
    var frame = frameOf(root);
    frame.style.position = 'absolute';
    frame.style.left = '0';
    frame.style.top = '0';
    frame.style.transformOrigin = '0 0';
    st.frame = frame;
    st.S = 1; st.exW = 0; st.exH = 0;
    /* 맨 위 판 · 'Layout' 묶음 안의 판을 이름으로 가른다 */
    var tops = [];
    kids(frame).forEach(function (c) { if (nm(c) === 'Layout') kids(c).forEach(function (g) { tops.push(g); }); tops.push(c); });
    var acts = [];
    var scene = st.scene;
    tops.forEach(function (c) {
      var n = nm(c), r = { x: c.offsetLeft, y: c.offsetTop, w: c.offsetWidth, h: c.offsetHeight };
      if (n === 'Stage/3D Scene') acts.push({ el: c, k: 'cover', w0: r.w, h0: r.h });
      else if (n === 'Stage/Building Image' || n === 'Overlay' || /^Popup\//.test(n)) acts.push({ el: placed(c), k: 'center' });
      else if (n === 'Dim') acts.push({ el: c, k: 'full' });
      else if (n === 'Header') { acts.push({ el: c, k: 'header', w0: r.w }); }
      else if (n === 'Event Log') acts.push({ el: placed(c), k: 'bottom', w0: r.w });
      else if (n === 'Side Panel' || n === 'Side Panel/Execution History' || n === 'Floor Selector Wrap' || n === 'Carousel Arrows' || n === 'Button/SOP Wrap') acts.push({ el: placed(c), k: 'right' });
      else if (n === 'Side Rail' || n === 'Filter Panel' || n === 'Side Panel/SOP List') acts.push({ el: c, k: 'tall', h0: r.h });
      else if (n === 'Main Panel') acts.push({ el: c, k: 'grow', w0: r.w, h0: r.h });
      else if (n === 'Tooltip Group Wrap') acts.push({ el: placed(c), k: /^sop/.test(scene) ? 'right' : 'down' });
      else if (n === 'Hero') acts.push({ el: c, k: 'grow', w0: r.w, h0: r.h });
      else if (n === 'Login Panel') acts.push({ el: placed(c), k: 'right' });
    });
    /* 판 안의 늘어날 부품 — 헤더 · 이벤트 로그는 가로로, 높은 판은 세로로 */
    acts.forEach(function (a) {
      if (a.k === 'header' || a.k === 'bottom') { a.el.__w0 = a.w0; a.sub = []; anchorX(a.el, 3, a.sub); a.sub.forEach(function (s) { if (s.kind === 'x') placed(s.el); }); }
      if (a.k === 'tall' || a.k === 'grow') {
        /* 판 높이를 거의 다 차지하는 자손(배경 판 · 스크롤 막대 길)은 같이 늘린다 */
        /* 판 전체 높이를 덮는 바탕 판(자식 없는 절대 위치 사각형)만 — 자동 배치 묶음을 늘리면 안쪽이 벌어진다 */
        a.tallKids = all(a.el, '*').filter(function (d) {
          var cs = getComputedStyle(d);
          return cs.display !== 'contents' && cs.position === 'absolute' && !d.children.length && d.offsetHeight >= a.h0 - 2 && d.offsetHeight <= a.h0 + 2;
        }).map(function (d) { return { el: d, h0: d.offsetHeight }; });
        /* 바닥에 붙은 단추 묶음(레일 아래 SOP · 재난 · 이벤트, 모의훈련 생성)은 내려간다 */
        a.downKids = kids(a.el).filter(function (d) { return d.offsetTop > a.h0 * 0.6 && d.offsetHeight < a.h0 * 0.4; }).map(function (d) { d.__top0 = d.offsetTop; return placed(d); });
      }
    });
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
      /* 바탕(흰 · 하늘 그라디언트 그림)은 화면 크기를 따라간다 */
      all(frame, ':scope > div[aria-hidden], :scope > div[aria-hidden] > *').forEach(function (b) { b.style.width = VW + 'px'; b.style.height = VH + 'px'; });
      acts.forEach(function (a) {
        var el = a.el;
        if (a.k === 'cover') { el.style.width = (a.w0 + exW) + 'px'; el.style.height = (a.h0 + exH) + 'px'; }
        else if (a.k === 'center') { el.__fx = exW / 2; el.__fy = exH / 2; place(el); }
        else if (a.k === 'full') { el.style.width = VW + 'px'; el.style.height = VH + 'px'; }
        else if (a.k === 'right') { el.__fx = exW; place(el); }
        else if (a.k === 'down') { el.__fy = exH; place(el); }
        else if (a.k === 'header' || a.k === 'bottom') {
          el.style.width = (a.w0 + exW) + 'px';
          if (a.k === 'bottom') { el.__fy = exH; place(el); }
          a.sub.forEach(function (s) {
            if (s.kind === 'w') { s.el.style.width = (s.w0 + exW) + 'px'; s.el.style.maxWidth = 'none'; }
            else { s.el.__fx = exW * s.k; place(s.el); }
          });
        } else if (a.k === 'tall' || a.k === 'grow') {
          /* 인스턴스(필터 패널)는 안쪽 부품이 % 자리라 판 높이를 바꾸면 부품이 같이 움직인다 → 바탕 판만 늘린다 */
          var inst = nm(el) === 'Filter Panel';
          if (!inst) el.style.height = (a.h0 + exH) + 'px';
          if (a.k === 'grow') el.style.width = (a.w0 + exW) + 'px';
          a.tallKids.forEach(function (t) { t.el.style.height = (t.h0 + exH) + 'px'; });
          /* 바닥 묶음 — 자동 배치(space-between)로 이미 내려간 만큼은 빼고 */
          a.downKids.forEach(function (d) {
            if (d.__top0 == null) d.__top0 = d.offsetTop;
            d.__fy = Math.max(0, exH - (d.offsetTop - d.__top0)); place(d);
          });
        }
      });
      (st.onLayout || []).forEach(function (f) { try { f(); } catch (e) { } });
    }
    var rsT = 0;
    function relayout() {
      root.classList.add('pd-resizing');
      layoutFn();
      clearTimeout(rsT);
      rsT = setTimeout(function () { root.classList.remove('pd-resizing'); }, 140);
    }
    st.onLayout = [];
    layoutFn();
    st.layout = layoutFn;
    if (window.ResizeObserver) { st.ro = new ResizeObserver(relayout); st.ro.observe(root); }
    else { st.onResize = relayout; window.addEventListener('resize', relayout); }
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('pd-live'); }); });
  }

  /* ══════════════════ 2. 시계 · 최근 시각 · 경과 시간 ══════════════════ */
  function installClock(root, st) {
    /* 팝업 · 위젯에도 'Header' 가 있다 — 날짜 글자를 가진 화면 머리만 */
    var hd = all(st.frame, '[data-name="Header"]').filter(function (h) { return one(h, '[data-name="Date"]') && one(h, '[data-name="Time"]'); })[0];
    var d, t;
    if (hd) { d = one(hd, '[data-name="Date"]'); t = one(hd, '[data-name="Time"]'); }
    else {
      /* 인스턴스 헤더는 안쪽 글자에 레이어 이름이 없다 — 글자 모양으로 찾는다 */
      all(st.frame, '[data-name="Header"] p').forEach(function (p) {
        var s = p.textContent.trim();
        if (!d && /^\d{4}-\d{2}-\d{2} [A-Z]{3}$/.test(s)) d = p;
        if (!t && /^\d{2}:\d{2}:\d{2}$/.test(s)) t = p;
      });
      if (!d || !t) return;
    }
    if (d && d.tagName !== 'P') d = one(d, 'p') || d;
    if (t && t.tagName !== 'P') t = one(t, 'p') || t;
    function tick() {
      var n = now();
      write(d, ymd(n) + ' ' + DOW[n.getDay()]);
      write(t, hms(n));
    }
    tick();
    st.timers.push(setInterval(tick, 1000));
  }
  function parseHMS(s) { var m = /^(\d{1,2}):(\d{2}):(\d{2})$/.exec(String(s).trim()); return m ? (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]) : null; }
  function parseMS(s) { var m = /^(\d{2}):(\d{2})$/.exec(String(s).trim()); return m ? (+m[1]) * 60 + (+m[2]) : null; }
  function fmtHMS(sec) { sec = Math.max(0, Math.floor(sec)); return p2(Math.floor(sec / 3600)) + ':' + p2(Math.floor(sec / 60) % 60) + ':' + p2(sec % 60); }
  function fmtMS(sec) { sec = Math.max(0, Math.floor(sec)); return p2(Math.floor(sec / 60) % 100) + ':' + p2(sec % 60); }
  function installRecent(root, st) {
    var n = now(), origSec = ORIG_NOW.h * 3600 + ORIG_NOW.m * 60 + ORIG_NOW.s;
    var shift = (n.getHours() * 3600 + n.getMinutes() * 60 + n.getSeconds()) - origSec;
    var dayStr = ymd(n);
    /* SOP 화면 — 시각 글자(시가 06~23)는 지금으로 옮기고, 날짜는 오늘로 */
    all(st.frame, 'p').forEach(function (p) {
      if (p.closest('[data-name="Event Log"]') || p.closest('[data-name="Header"]')) return;
      var s = p.textContent.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) { write(p, dayStr); return; }
      var v = parseHMS(s);
      if (v != null && v >= 6 * 3600 && /^sop|^event/.test(st.scene)) {
        var d = new Date(n.getTime() + (v - origSec) * 1000);
        write(p, hms(d));
      }
    });
    /* 기간 칸 — 끝 = 지금(30분 단위 내림), 시작 = 12시간 전 */
    var end = new Date(n.getTime()); end.setMinutes(end.getMinutes() < 30 ? 0 : 30, 0, 0);
    var beg = new Date(end.getTime() - 12 * 3600000);
    var sd = one(st.frame, '[data-name="Field/Start Date"]'), ed = one(st.frame, '[data-name="Field/End Date"]');
    [[sd, beg], [ed, end]].forEach(function (x) {
      if (!x[0]) return;
      var ps = all(x[0], 'p');
      if (ps[0]) write(ps[0], ymd(x[1]));
      if (ps[1]) write(ps[1], ampm(x[1]));
    });
    var fs = one(st.frame, '[data-name="Field/Start"] p'), fe = one(st.frame, '[data-name="Field/End"] p');
    if (fs) write(fs, ymd(beg) + '  ' + hms(beg));
    if (fe) write(fe, ymd(end) + ' ' + hms(end));
    /* 경과 시간 — 1초씩 */
    var ticking = [];
    all(st.frame, '[data-name="Stat/Elapsed"] [data-name="Value Box"] p, [data-name="Side Panel/SOP List"] p').forEach(function (p) {
      var v = parseHMS(p.textContent);
      if (v != null && v < 6 * 3600) ticking.push({ p: p, v: v, f: fmtHMS });
    });
    /* '경과' 배지 옆의 mm:ss */
    all(st.frame, 'p').forEach(function (p) {
      if (p.textContent.trim() !== '경과') return;
      var host = p.parentElement;
      for (var i = 0; i < 3 && host; i++) {
        var t = all(host, 'p').filter(function (q) { return q !== p && parseMS(q.textContent) != null; })[0];
        if (t) { if (!ticking.some(function (x) { return x.p === t; })) ticking.push({ p: t, v: parseMS(t.textContent), f: fmtMS }); break; }
        host = host.parentElement;
      }
    });
    if (ticking.length) st.timers.push(setInterval(function () {
      if (idle()) return;
      ticking.forEach(function (x) { x.v++; write(x.p, x.f(x.v)); });
    }, 1000));
  }

  /* ══════════════════ 3. 이벤트 로그 — 최근 시각 · 새 이벤트 · 접기 ══════════════════ */
  var EV_POOL = [
    ['CR', '화재센서 18', '센서', '연기 감지 (1차 경보)'],
    ['MA', '출입통제 E2', '출입통제', '비인가 카드 반복 태그'],
    ['MI', '풍속계 01', '센서', '순간 풍속 12m/s 초과'],
    ['WA', 'CCTV 07', 'CCTV', '영상 화질 저하'],
    ['NO', '화재센서 05', '센서', '감지기 자가진단 정상 복귀'],
    ['MI', '지진계 01', '센서', '미소 진동 감지 (0.02 gal)'],
    ['MA', '열감지기 03', '센서', '표면 온도 상승 (54℃)'],
    ['WA', '출입통제 W1', '출입통제', '문 열림 시간 초과'],
  ];
  function rowsOf(elog) {
    return all(elog, '[data-name^="Row/"], [data-name="grid-row"]').filter(function (r) { return !r.parentElement.closest('[data-name^="Row/"], [data-name="grid-row"]'); });
  }
  function rowCells(r) {
    var ps = all(r, 'p').filter(function (p) { return !p.closest('[data-name^="btn-"]'); });
    return { date: ps[0], time: ps[1], dev: ps[2], type: ps[3], msg: ps[4] };
  }
  function installEventLog(root, st) {
    var elog = one(st.frame, '[data-name="Event Log"]');
    if (!elog) return;
    st.elog = elog;
    var rows = rowsOf(elog);
    st.elogRows = rows;
    /* 열 때마다 최근 — 맨 위 줄 = 25~50초 전, 줄 사이 간격은 원본 그대로 */
    var cells = rows.map(rowCells).filter(function (c) { return c.date && c.time; });
    if (cells.length) {
      var t0 = null;
      var base = now().getTime() - rnd(25, 50) * 1000;
      cells.forEach(function (c) {
        var d = new Date(c.date.textContent.trim() + 'T' + c.time.textContent.trim());
        if (isNaN(d)) return;
        if (t0 == null) t0 = d.getTime();
        var nd = new Date(base - (t0 - d.getTime()));
        write(c.date, ymd(nd)); write(c.time, hms(nd));
      });
    }
    /* 등급 구슬 — 줄마다 등급 그림(disability component)을 등급 이름으로 기억해 새 줄에 옮겨 단다 */
    var GRADES = ['CR', 'MA', 'MI', 'WA', 'NO'];
    var gradeOfRow = function (r) {
      var dc = one(r, '[data-name="disability component"]');
      if (!dc) return null;
      var e = one(dc, '[class]'); var col = e ? getComputedStyle(e).backgroundColor : '';
      return { dc: dc, col: col };
    };
    var tmpl = {};
    var gradeList = ['MA', 'CR', 'CR', 'MI', 'MI', 'WA', 'NO'];   /* 시안의 줄 순서 등급(가상 데이터) */
    rows.forEach(function (r, i) { var g = gradeOfRow(r); if (g && gradeList[i] && !tmpl[gradeList[i]]) tmpl[gradeList[i]] = g.dc.innerHTML; r.__grade = gradeList[i]; });
    /* 건수 칩 */
    var counts = {};
    all(elog, 'p').forEach(function (p) {
      var g = p.textContent.trim();
      if (GRADES.indexOf(g) < 0 && g !== 'All') return;
      var host = p.parentElement;
      var num = all(host, 'p').filter(function (q) { return /^\d+$/.test(q.textContent.trim()); })[0];
      if (num) counts[g] = num;
    });
    /* 새 이벤트 — 펼친 표에서만 흘러 들어온다 */
    var visibleRows = rows.filter(function (r) { return r.offsetParent && box(r, st).y < (st.VH || BASE_H); });
    function feed() {
      st.feed = setTimeout(feed, rnd(45, 75) * 1000);
      if (idle() || editing() || !visibleRows.length || elog.classList.contains('pd-shut')) return;
      var ev = EV_POOL[Math.floor(Math.random() * EV_POOL.length)];
      var cs = visibleRows.map(rowCells);
      for (var i = cs.length - 1; i > 0; i--) {
        ['date', 'time', 'dev', 'type', 'msg'].forEach(function (k) { if (cs[i][k] && cs[i - 1][k]) write(cs[i][k], cs[i - 1][k].textContent); });
        var a = one(visibleRows[i], '[data-name="disability component"]'), b = one(visibleRows[i - 1], '[data-name="disability component"]');
        if (a && b) a.innerHTML = b.innerHTML;
        visibleRows[i].__grade = visibleRows[i - 1].__grade;
      }
      var n = now();
      write(cs[0].date, ymd(n)); write(cs[0].time, hms(n));
      write(cs[0].dev, ev[1]); write(cs[0].type, ev[2]); write(cs[0].msg, ev[3]);
      var d0 = one(visibleRows[0], '[data-name="disability component"]');
      if (d0 && tmpl[ev[0]]) d0.innerHTML = tmpl[ev[0]];
      visibleRows[0].__grade = ev[0];
      visibleRows[0].classList.remove('pd-new'); void visibleRows[0].offsetWidth; visibleRows[0].classList.add('pd-new');
      [ev[0], 'All'].forEach(function (g) { var c = counts[g]; if (c) write(c, String((+c.textContent || 0) + 1)); });
      /* 등급으로 거르는 중이면 새 줄에도 같은 거름 */
      if (st.applyGrade && st.grade && st.grade !== 'All') st.applyGrade(st.grade);
    }
    st.feed = setTimeout(feed, rnd(30, 50) * 1000);
    /* 줄 누르기 — SOP 단추는 SOP 화면, CCTV 단추는 알림 */
    rows.forEach(function (r) {
      var sop = one(r, '[data-name="btn-sop2"]'), cc = one(r, '[data-name="btn-cctv2"]');
      clickable(sop, function () { goto('sop-popup'); });
      clickable(cc, function () { var c = rowCells(r); toast(st, (c.dev ? c.dev.textContent : 'CCTV') + ' 주변 CCTV 영상을 엽니다'); });
    });
    /* 확인 · 전체확인 */
    all(elog, '[data-name="Button/Ack"], [data-name="btn-check"]').forEach(function (b) { clickable(b, function () { toast(st, '선택한 이벤트를 확인 처리했습니다'); }); });
    all(elog, '[data-name="Button/Ack All"], [data-name="btn-all check"]').forEach(function (b) { clickable(b, function () { toast(st, '이벤트 ' + (counts.All ? counts.All.textContent : '') + '건을 모두 확인 처리했습니다'); }); });
    installFold(root, st, elog, rows);
    installAlign(root, st, elog, rows);
  }
  /* 표 글자 정렬 — 줄 칸 글자는 Figma 가 원래 글자 길이로 잡은 고정 폭 상자(왼쪽 정렬)라, 가상 데이터로 바꾼 뒤엔 칸마다 제각각 어긋났다
     (설비타입 '센서'가 줄마다 630 · 645, 메시지는 모두 x=1103 에서 오른쪽으로 자라는데 머리 칸 '메시지'는 1183 가운데).
     → 칸마다 머리 칸 글자의 가운데에 맞춘다(발생시간은 날짜 · 시각 한 묶음으로). 글자가 바뀌면(새 이벤트 · 편집 · 크기 변경) 다시 잰다. */
  function installAlign(root, st, elog, rows) {
    var LABELS = ['등급', '발생시간', '설비명', '설비타입', '메시지'];
    var inRow = function (p) { return !!p.closest('[data-name^="Row/"], [data-name="grid-row"]'); };
    var head = {};
    all(elog, 'p').forEach(function (p) { var t = p.textContent.trim(); if (LABELS.indexOf(t) >= 0 && !head[t] && !inRow(p)) head[t] = p; });
    if (!head['설비명'] || !rows.length) return;
    /* 글자 자체의 폭(Range) — 상자는 Figma 가 원래 글자로 잡은 고정 폭 · 왼쪽 정렬이라 상자 가운데 ≠ 글자 가운데였다
       (상자 기준으로 맞춰 '0px' 로 재고 끝냈는데, 눈에는 짧은 글자는 왼쪽 · 긴 글자는 오른쪽으로 비껴 보였다) */
    var inkBox = function (el) {
      var f = st.frame.getBoundingClientRect(), S = st.S || 1, b;
      if (el.tagName === 'P' || el.tagName === 'SPAN') {
        var rg = document.createRange(); rg.selectNodeContents(el); b = rg.getBoundingClientRect();
        if (!b.width) b = el.getBoundingClientRect();
      } else b = el.getBoundingClientRect();
      return { x: (b.left - f.left) / S, w: b.width / S };
    };
    var cx = function (el) { var b = inkBox(el); return b.x + b.w / 2; };
    /* 세로 구분선(폭 2.5 이하 · 높이 10 이상인 판) — 가는 선 두 겹이 붙어 있어 2px 안은 하나로 */
    /* 구분선 하나 = 가는 판 + 그 안의 가는 그림 — 바깥 판만(안쪽까지 옮기면 두 번 움직인다).
       yRef 를 주면 그 줄 높이에 있는 것만(건물 화면은 머리 줄 조상이 줄들까지 품어 줄 구분선이 섞였다) */
    var dividers = function (scope, yRef) {
      var xs = all(scope, '*').filter(function (x) { var b = box(x, st); return b.w > 0 && b.w <= 2.5 && b.h >= 10; });
      xs = xs.filter(function (x) { return xs.indexOf(x.parentElement) < 0; });
      if (yRef != null) xs = xs.filter(function (x) { var b = box(x, st); return Math.abs(b.y + b.h / 2 - yRef) < 14; });
      return xs;
    };
    var groupX = function (els) {
      var g = [];
      els.map(function (e) { var b = box(e, st); return { e: e, x: b.x + b.w / 2 }; }).sort(function (a, b) { return a.x - b.x; }).forEach(function (o) {
        var last = g[g.length - 1];
        if (last && o.x - last.x <= 2) { last.els.push(o.e); last.x = (last.x * (last.els.length - 1) + o.x) / last.els.length; } else g.push({ x: o.x, els: [o.e] });
      });
      return g;
    };
    /* 머리 줄(Header Row · grid 머리) — 머리 칸 글자들과 구분선을 함께 품은 가장 가까운 조상 */
    var hrow = head['설비명'];
    while (hrow && hrow !== elog && !(hrow.contains(head['메시지'] || head['설비명']) && dividers(hrow).length >= 3)) hrow = hrow.parentElement;
    if (hrow === elog) hrow = null;
    var snap = function (els) { els.forEach(function (e) { e.style.transition = 'none'; e.__sx = 0; place(e); }); };
    var unsnap = function (els) { els.forEach(function (e) { place(e); void e.offsetWidth; e.style.transition = ''; }); };
    var raf = 0;
    function alignAll() {
      raf = 0;
      if (!elog.isConnected) return;
      var H = {};
      /* ── 표가 옆으로 늘어나면(화면이 16:9 보다 넓을 때) 줄의 칸은 비율로 늘어나는데 머리 칸은 Figma 고정 폭이라
            줄 구분선이 머리 구분선보다 오른쪽으로 밀렸다(1920x820 에서 158.5 → 176.6). → 머리 구분선을 줄 구분선 자리로 옮기고,
            칸 가운데도 같은 비율(m)로 옮긴 자리에 머리 글자 · 줄 글자를 함께 맞춘다(16:9 면 m 은 그대로). ── */
      var hy = (function () { var b = box(head['설비명'], st); return b.y + b.h / 2; })();
      var hd = hrow ? dividers(hrow, hy) : [];
      var hLabels = LABELS.map(function (k) { return head[k]; }).filter(function (h) { return h && h.getBoundingClientRect().width; });
      snap(hd.concat(hLabels));
      var firstRow = rows.filter(function (r) { return r.getBoundingClientRect().width; })[0];
      var m = function (x) { return x; };
      var rg = [];
      if (hrow && firstRow) {
        var hg = groupX(hd);
        rg = groupX(dividers(firstRow));
        var Lh = box(hrow, st).x, Lr = box(firstRow, st).x;
        if (hg.length >= 2 && hg.length === rg.length) {
          var k = (rg[rg.length - 1].x - Lr) / Math.max(1, hg[hg.length - 1].x - Lh);
          if (Math.abs(k - 1) > 0.002) m = function (x) { return Lr + (x - Lh) * k; };
          /* 머리 구분선 → 줄 구분선 자리 */
          hg.forEach(function (g, i) { var dx = rg[i].x - g.x; g.els.forEach(function (e) { e.__sx = Math.abs(dx) < 0.3 ? 0 : +dx.toFixed(1); }); });
        }
      }
      /* 머리 칸 글자 — Figma 자리(반응형 몫을 뺀 가운데)를 m 으로 옮긴 곳이 그 칸의 가운데 */
      var fxUp = function (el) { var s = 0; for (var a = el; a && a !== hrow && a !== elog; a = a.parentElement) s += (a.__fx || 0); return s; };
      LABELS.forEach(function (key) {
        var h = head[key];
        if (!h || !h.getBoundingClientRect().width) return;
        var cur = cx(h), T = m(cur - fxUp(h));
        /* 양쪽에 구분선이 있는 칸(발생시간 · 설비명 · 설비타입)은 두 선의 한가운데 — 눈에 보이는 칸의 가운데 */
        var j = LABELS.indexOf(key);
        if (rg.length === 4 && j >= 1 && j <= 3) T = (rg[j - 1].x + rg[j].x) / 2;
        h.__sx = Math.abs(T - cur) < 0.3 ? 0 : +(T - cur).toFixed(1);
        H[key] = T;
      });
      unsnap(hd.concat(hLabels));
      rows.forEach(function (r) {
        if (!r.getBoundingClientRect().width) return;
        var c = rowCells(r);
        /* 반응형(installFit)이 이미 칸 글자에 가로 몫(__fx)을 준 경우가 있다(건물 · 층 · 팝업 화면의 메시지) — 덮어쓰지 않고
           정렬 몫은 __sx 로 얹어 place() 가 합친다. 재는 동안만 움직임(transition)을 끈다 */
        var put = function (els, key) {
          els = els.filter(Boolean);
          if (!els.length || H[key] == null) return;
          els.forEach(function (p) { p.style.transition = 'none'; p.__sx = 0; place(p); });
          var bs = els.map(function (p) { return inkBox(p); });
          var l = Math.min.apply(null, bs.map(function (b) { return b.x; })), rr = Math.max.apply(null, bs.map(function (b) { return b.x + b.w; }));
          var d = H[key] - (l + rr) / 2;
          els.forEach(function (p) { p.__sx = Math.abs(d) < 0.4 ? 0 : +d.toFixed(1); place(p); void p.offsetWidth; p.style.transition = ''; });
        };
        put([c.date, c.time], '발생시간');
        put([c.dev], '설비명');
        put([c.type], '설비타입');
        put([c.msg], '메시지');
        /* 등급 구슬 — 줄에 따라 이름 있는 묶음(disability component)이거나 그냥 그림(CR 줄) */
        var dot = one(r, '[data-name="disability component"]');
        if (!dot) { var first = c.date ? box(c.date, st).x : 1e9; dot = all(r, 'img').filter(function (im) { return !im.closest('[data-name^="btn-"]') && box(im, st).x < first; })[0] || null; }
        put([dot], '등급');
      });
    }
    var later = function () { if (!raf) raf = requestAnimationFrame(alignAll); };
    alignAll();
    st.timers.push(setTimeout(alignAll, 400));                /* 글꼴이 늦게 오면 폭이 바뀐다 */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(later);
    if (st.onLayout) st.onLayout.push(later);
    if (window.MutationObserver) {
      st.alignMO = new MutationObserver(later);
      st.alignMO.observe(elog, { characterData: true, childList: true, subtree: true });
    }
    st.realign = later;
  }
  /* Fold Button — 펼친 화면(event)은 그 자리에서 접고 편다. 나머지 화면의 접힌 로그는 위 화살표로 펼친 화면으로 넘어가고,
     넘어간 화면은 접힌 자리에서 미끄러지듯 펼쳐진다. 아래 화살표는 펼친 화면을 다시 접는다. */
  function installFold(root, st, elog, rows) {
    var expanded = st.scene === 'event';
    /* 장면마다 이름이 다르다 — Button/Expand · Group 291 · btn-show(위), Button/Collapse · Group 292 · btn-hide(아래), 이름 없는 arrow 둘(위 · 아래 순) */
    var arrows = all(elog, '[data-name="arrow"]').filter(function (x) { return !x.closest('[data-name="btn-show"], [data-name="btn-hide"], [data-name="Group 291"], [data-name="Group 292"]'); });
    var up = one(elog, '[data-name="Button/Expand"]') || one(elog, '[data-name="Group 291"]') || one(elog, '[data-name="btn-show"]') || arrows[0] || null;
    var down = one(elog, '[data-name="Button/Collapse"]') || one(elog, '[data-name="Group 292"]') || one(elog, '[data-name="btn-hide"]') || arrows[1] || null;
    [up, down].forEach(function (b) { if (b) b.classList.add('pd-foldbtn'); });
    if (!expanded) {
      clickable(up, function () { try { sessionStorage.setItem('pd-elog-open', '1'); } catch (e) { } goto('event'); });
      clickable(down, function () { toast(st, '이벤트 현황이 이미 접혀 있습니다'); });
      return;
    }
    /* 접으면 머리 줄(제목 · 접기 단추 · 등급 칩)만 화면 맨 아래에 남긴다 — 내려갈 거리 = 로그 높이 − 표 위까지의 높이.
       예전엔 180 으로 못 박아 머리 줄이 덜 내려가고 그 밑에 빈 흰 판이 드러났다(다른 화면의 접힌 막대보다 한참 위) */
    function slideOf() {
      var tbl = one(elog, '[data-name="Table"]');
      if (!tbl) return EL_SLIDE;
      var eb = box(elog, st), tb = box(tbl, st);
      return Math.max(0, Math.round(eb.h - (tb.y - eb.y)));
    }
    function set(shut, anim) {
      if (!anim) root.classList.add('pd-resizing');
      elog.classList.toggle('pd-shut', shut);
      elog.__sy = shut ? slideOf() : 0; place(elog);
      if (!anim) { void elog.offsetWidth; root.classList.remove('pd-resizing'); }
      var f = load(K_FOLD); f.event = shut ? 1 : 0; save(K_FOLD, f);
    }
    /* 화면 크기가 바뀌면 접힌 거리도 다시 */
    if (st.onLayout) st.onLayout.push(function () { if (elog.classList.contains('pd-shut')) { elog.__sy = slideOf(); place(elog); } });
    placed(elog);
    var cameFromCollapsed = false;
    try { cameFromCollapsed = sessionStorage.getItem('pd-elog-open') === '1'; sessionStorage.removeItem('pd-elog-open'); } catch (e) { }
    var saved = load(K_FOLD).event === 1;
    if (cameFromCollapsed) {
      set(true, false);
      st.timers.push(setTimeout(function () { set(false, true); }, 60));
    } else set(saved, false);
    clickable(up, function () { set(false, true); });
    clickable(down, function () { set(true, true); });
  }

  /* ══════════════════ 4. 화면 잇기 · 단추 ══════════════════ */
  function installNav(root, st) {
    var F = st.frame;
    var on = function (sel, fn) { all(F, sel).forEach(function (el) { clickable(el, function (e) { fn(el, e); }); }); };
    /* 상세보기 — 기상 → 기상 상세, 지진 → 파형 상세 */
    on('[data-name="Button/View Details"]', function (el) { goto(el.closest('[data-name^="Widget/Weather"]') ? 'weather' : 'seismic'); });
    on('[data-name^="Popup/"] [data-name="Button/Close"]', function () { goto('main'); });
    on('[data-name="Dim"]', function () { goto('main'); });
    /* 헤더 · 레일 */
    on('[data-name="Header"] [data-name="Button/SOP"], [data-name="Button/SOP Wrap"] [data-name="Button/SOP"], [data-name="Button/SOP Status"]', function () { goto('sop'); });
    on('[data-name="Button/Event Status"]', function () { try { sessionStorage.setItem('pd-elog-open', st.scene === 'event' ? '' : '1'); } catch (e) { } goto('event'); });
    on('[data-name="Button/Multi-Hazard Status"]', function () { goto('main'); });
    on('[data-name="Button/Logout"], [data-name="btn-logout"]', function () { goto('login'); });
    on('[data-name="Button/Disaster"], [data-name="btn-disaster"]', function (el) { el.classList.toggle('pd-on'); toast(st, el.classList.contains('pd-on') ? '소방설비 위치를 3D 장면에 표시합니다' : '소방설비 표시를 끕니다'); });
    on('[data-name="Button/Evacuation Route"], [data-name="btn-route"]', function (el) { el.classList.toggle('pd-on'); toast(st, el.classList.contains('pd-on') ? '비상 대피 경로를 표시합니다' : '대피 경로 표시를 끕니다'); });
    /* 레일 센서 종류 — 필터 패널의 센서 탭을 그 종류로 연다(Figma Navigation 변형). 필터 패널이 없는 화면은 알림만 */
    on('[data-name^="Category/"]', function (el) {
      var t = el.getAttribute('data-name').replace('Category/', '').replace(/ Wrap$/, '');
      var KO = { 'Fire': '화재', 'Access Control': '출입통제', 'Earthquake': '지진계측', 'Weather': '기상관측', 'CCTV': 'CCTV' };
      var KEY = { 'Fire': 'fire', 'Access Control': 'senser', 'Earthquake': 'earthquake', 'Weather': 'weather', 'CCTV': 'cctv' };
      all(F, '[data-name^="Category/"]').forEach(function (x) { x.classList.toggle('pd-on', x === el || x.contains(el) || el.contains(x)); });
      if (st.nav && KEY[t]) st.nav.show(KEY[t]);
      else toast(st, (KO[t] || t) + ' 센서를 강조합니다');
    });
    /* 필터 패널(행 체크 · 전체선택 · 저장 · 탭 · 센서 유형 · 검색)은 installControls 가 변형마다 잇는다 */
    /* SOP */
    on('[data-name="Side Panel/SOP List"] [data-name^="Item/"]', function (el) {
      var txt = el.textContent;
      if (/대기/.test(txt) && !/진행중/.test(txt)) goto('sop-standby'); else goto('sop');
    });
    on('[data-name="Button/Create Drill"]', function () { toast(st, '모의훈련 시나리오를 생성합니다'); });
    on('[data-name="Button/Manual"]', function () { toast(st, '대응절차 매뉴얼을 엽니다'); });
    on('[data-name="Button/Send SMS"]', function () { toast(st, '담당자 3명에게 문자를 발송했습니다'); });
    on('[data-name="Button/End SOP"]', function () { toast(st, 'SOP 종료 요청을 보냈습니다'); });
    on('[data-name="Button/Next Stage"]', function () { toast(st, '다음 단계(비상대피)로 넘어갑니다'); });
    on('[data-name="Button/Move 3D"], [data-name="btn-3D move"]', function () { toast(st, '해당 위치로 3D 장면을 이동합니다'); });
    on('[data-name="Button/Complete"]', function () { toast(st, '작업 항목을 완료 처리했습니다'); });
    /* SOP 화면 단추 3개 — 레이어 이름이 fire · earthquake · ALL 로 엉켜 있어 짝 툴팁 글자로 뜻을 정한다 */
    on('[data-name="Action Buttons"] > *', function (el) {
      var pr = (st.tipPairs || []).filter(function (x) { return x.target === el; })[0];
      var t = pr ? textOf(pr.tip) : '';
      toast(st, /메뉴얼|매뉴얼/.test(t) ? '대응절차 매뉴얼을 엽니다' : /문자/.test(t) ? '담당자 3명에게 문자를 발송했습니다' : /시작/.test(t) ? 'SOP를 시작합니다' : /종료/.test(t) ? 'SOP 종료 요청을 보냈습니다' : 'SOP 상태를 바꿉니다');
    });
    /* 캐러셀 */
    var BUILD = ['주제어동', '제1터빈동', '가스압축동', '연료설비동'];
    var bi = 0;
    /* 필터 패널 건물 목록에서 고른 건물로 캐러셀을 연다 */
    var preB = null;
    try { preB = sessionStorage.getItem('pd-building'); sessionStorage.removeItem('pd-building'); } catch (e) { }
    if (preB && st.scene === 'building') {
      if (BUILD.indexOf(preB) < 0) BUILD.unshift(preB);
      bi = BUILD.indexOf(preB);
      all(F, '[data-name="Building Label"] [data-name="Building"]').forEach(function (p) { write(p, preB); });
    }
    on('[data-name="Building Label"]', function () { if (st.scene === 'building') goto('floor'); });
    /* 캐러셀 화살표만 — 이벤트 로그 접기 단추 안의 Icon/Arrow 는 접기 단추가 받는다(여기서 잡으면 클릭을 삼킨다) */
    all(F, '[data-name^="Icon/Arrow"]').filter(function (el) { return !el.closest('[data-name="Event Log"]'); }).forEach(function (el) { clickable(el, function () {
      var dir = /Left|Up/.test(nm(el)) ? -1 : 1;
      if (st.scene === 'building') {
        bi = (bi + dir + BUILD.length) % BUILD.length;
        all(F, '[data-name="Building Label"] [data-name="Building"]').forEach(function (p) { write(p, BUILD[bi]); p.animate([{ opacity: 0, transform: 'translateX(' + (dir * 12) + 'px)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.22,.8,.24,1)' }); });
      } else selFloor(curFloor + dir);
    }); });
    on('[data-name="Button/Back to Overview"]', function () { goto('main'); });
    on('[data-name="Button/Back to Building List"]', function () { goto('building'); });
    var floors = all(F, '[data-name="Floor Selector"] [data-name^="Option/"]');
    var curFloor = Math.max(0, floors.map(function (o) { return nm(o); }).indexOf('Option/2F'));
    function selFloor(i) {
      if (!floors.length) return;
      curFloor = (i + floors.length) % floors.length;
      floors.forEach(function (o, k) { o.classList.toggle('pd-cur', k === curFloor); });
      var fl = nm(floors[curFloor]).replace('Option/', '');
      all(F, '[data-name="Building Label"] [data-name="Floor"]').forEach(function (p) { write(p, fl); });
    }
    floors.forEach(function (o, k) { clickable(o, function () { selFloor(k); }); });
    if (floors.length) selFloor(curFloor);
    /* 로그인 */
    on('[data-name="Button/Sign Up"]', function () { goto('main'); });
    /* 기간 단추 */
    /* (기간 옵션은 installControls — 고른 단추로 Figma 선택 모양이 옮겨 가고 시작 · 종료 시각이 바뀐다) */
    on('[data-name="Button/Search"]', function () { toast(st, '조회 구간의 데이터를 다시 불러왔습니다'); });
  }

  /* ══════════════════ 5. 스크롤 — Figma 마스크 창은 그대로, 내용만 움직인다 ══════════════════
     목록 항목마다 마스크(창 그림)가 걸려 있다 → 항목을 -s 만큼 올리고 마스크 자리를 +s 내려 창이 제자리에 남게 한다. */
  function installScroll(root, st) {
    var F = st.frame;
    var defs = [
      { el: one(F, '[data-name="Widget/Execution History"] [data-name="History"]'), bar: one(F, '[data-name="Widget/Execution History"] > [data-name="Scrollbar"]') },
      { el: one(F, '[data-name="Widget/Stage Tasks"] [data-name="Table Mask"]'), bar: one(F, '[data-name="Widget/Stage Tasks"] [data-name="Scrollbar"]') },
      { el: one(F, '[data-name="Filter Panel"]'), filter: true },
    ];
    /* 필터 목록 막대 — 인스턴스 안 이름이 원본(Group 296)이라 모양으로 찾는다: 폭 8px 이하 · 높이 100px 이상인 두 판(길 · 손잡이) */
    if (defs[2].el) {
      defs[2].parts = thinParts(defs[2].el);
      /* 다른 변형으로 갈아 끼웠으면 원래 내용은 굴리지 않는다 */
      defs[2].active = function () { return !defs[2].el.classList.contains('pd-navswapped'); };
    }
    defs.forEach(function (d) { if (d.el) setupScroll(root, st, d); });
  }
  /* 마스크 창 스크롤 하나 — d = { el, bar?, filter?, parts?, host?, active? }. 갈아 끼운 필터 패널 변형도 이걸로 굴린다 */
  function thinParts(el) {
    var thin = all(el, '*').filter(function (x) { return getComputedStyle(x).display !== 'contents' && x.offsetWidth > 0 && x.offsetWidth <= 8 && x.offsetHeight > 100; });
    return thin.length >= 2 ? thin.sort(function (a, b) { return b.offsetHeight - a.offsetHeight; }).slice(0, 2) : null;
  }
  function setupScroll(root, st, d) {
    var F = st.frame;
    (function () {
      var masked = all(d.el, '*').filter(function (x) { var cs = getComputedStyle(x); return (cs.maskImage && cs.maskImage !== 'none') || (cs.webkitMaskImage && cs.webkitMaskImage !== 'none'); });
      if (!masked.length) return;
      /* 창 = 첫 마스크 그림의 자리 · 크기 */
      var m0 = masked[0], cs0 = getComputedStyle(m0);
      var sz = (cs0.maskSize || cs0.webkitMaskSize || '').split(' ').map(parseFloat);
      var ps = (cs0.maskPosition || cs0.webkitMaskPosition || '0px 0px').split(' ').map(parseFloat);
      var b0 = box(m0, st);
      var winTop = b0.y + (ps[1] || 0), winBot = winTop + (sz[1] || b0.h);
      var maxBot = Math.max.apply(null, masked.map(function (x) { var b = box(x, st); return b.y + b.h; }));
      var max = Math.max(0, maxBot - winBot + 12);
      /* 필터 목록 — 내용이 창에 다 들어가도 Figma 막대(길 526 · 손잡이 463)만큼은 움직인다 */
      if (max < 4 && d.parts) { var trH = d.parts[0].offsetHeight, thH = d.parts[1].offsetHeight; if (trH > thH + 10) max = (trH / thH - 1) * (winBot - winTop); }
      if (max < 4) return;
      masked.forEach(function (x) { var c = getComputedStyle(x); x.__mp = (c.maskPosition || c.webkitMaskPosition || '0px 0px').split(' ').map(parseFloat); });
      var thumb = null, track = null;
      if (d.parts) { track = d.parts[0]; thumb = d.parts[1]; }
      else if (d.bar) {
        var parts = all(d.bar, '*').filter(function (x) { return getComputedStyle(x).display !== 'contents' && x.offsetHeight > 20; });
        if (parts.length >= 2) { parts.sort(function (a, b) { return b.offsetHeight - a.offsetHeight; }); track = parts[0]; thumb = parts[1]; }
        else { track = d.bar; thumb = parts[0] || null; }
      }
      var s = 0;
      function apply() {
        masked.forEach(function (x) {
          x.style.translate = '0 ' + (-s).toFixed(1) + 'px';
          var v = (x.__mp[0] || 0) + 'px ' + ((x.__mp[1] || 0) + s).toFixed(1) + 'px';
          x.style.maskPosition = v; x.style.webkitMaskPosition = v;
        });
        if (thumb && track) {
          var travel = Math.max(0, track.offsetHeight - thumb.offsetHeight);
          thumb.style.translate = '0 ' + (travel * s / max).toFixed(1) + 'px';
        }
      }
      var host = d.host || (d.filter ? one(F, '[data-name="Filter Panel"]') : d.el);
      host.classList.add('pd-scroller');
      host.addEventListener('wheel', function (e) {
        if (layoutEditing(root)) return;
        if (d.active && !d.active()) return;
        var b = box(host, st), y = (e.clientY - st.frame.getBoundingClientRect().top) / (st.S || 1);
        if (d.filter && y < winTop - 40) return;
        e.preventDefault(); e.stopPropagation();
        s = clamp(s + e.deltaY * 0.6, 0, max); apply();
      }, { passive: false });
      if (thumb && track) {
        thumb.classList.add('pd-thumb');
        var drag = null;
        thumb.addEventListener('pointerdown', function (e) {
          if (layoutEditing(root)) return;
          e.preventDefault(); e.stopPropagation();
          drag = { y: e.clientY, s: s }; thumb.classList.add('pd-grab');
          thumb.setPointerCapture && thumb.setPointerCapture(e.pointerId);
        });
        thumb.addEventListener('pointermove', function (e) {
          if (!drag) return;
          var travel = Math.max(1, track.offsetHeight - thumb.offsetHeight);
          s = clamp(drag.s + (e.clientY - drag.y) / (st.S || 1) * max / travel, 0, max); apply();
        });
        var end = function () { drag = null; thumb.classList.remove('pd-grab'); };
        thumb.addEventListener('pointerup', end); thumb.addEventListener('pointercancel', end);
      }
    })();
  }

  /* ══════════════════ 5-2. 눌리게 — 투명한 묶음 판은 클릭을 아래로 넘긴다 ══════════════════
     Figma 의 묶음 프레임(Tooltip Group Wrap · Event Log 칸 · Carousel Arrows · Layout …)은 화면에 아무것도 그리지 않지만
     상자가 단추 위를 덮어 클릭을 가로챘다(레일 'SOP 현황' · 층 선택 · SOP 단추). 그리는 것이 없는 판만 pointer-events:none —
     그림 · 글자 · 배경 · 테두리 · 그림자 · 유리 · 마스크가 있는 판과 눌리는 판(.pd-click) · 옮기는 판(.pd-mv)은 그대로 */
  /* pointer-events 는 물려받는다 — 묶음 판만 none 으로 두면 그 안 단추까지 꺼진다. 그래서 모든 요소에 값을 직접 준다:
     그리는 것 없는 판 = none, 나머지 = auto. 원래부터 none 이던 것(링 덮개 · 숨은 입력칸 · 차트 그림)은 손대지 않는다 */
  function transparentBox(e) {
    var tag = e.tagName;
    if (tag === 'IMG' || tag === 'P' || tag === 'SPAN' || tag === 'INPUT' || tag === 'BUTTON' || tag === 'CANVAS' || tag === 'svg' || tag === 'TEXTAREA') return false;
    /* 옮기는 판(.pd-mv)도 투명하면 넘긴다 — 끌기는 안쪽 그림에서 closest('.pd-mv') 로 잡는다 */
    if (e.classList.contains('pd-click') || e.classList.contains('pd-chartbtn') || e.classList.contains('pd-chartmenu') || e.classList.contains('pd-selmenu') || e.classList.contains('pd-resetbtn')) return false;
    var c = getComputedStyle(e);
    var bg = c.backgroundColor;
    if (c.backgroundImage !== 'none' || (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent')) return false;
    if (parseFloat(c.borderTopWidth) || parseFloat(c.borderLeftWidth) || parseFloat(c.borderRightWidth) || parseFloat(c.borderBottomWidth)) return false;
    if (c.boxShadow !== 'none' || (c.backdropFilter && c.backdropFilter !== 'none') || (c.maskImage && c.maskImage !== 'none') || (c.webkitMaskImage && c.webkitMaskImage !== 'none')) return false;
    var a = getComputedStyle(e, '::after'), b = getComputedStyle(e, '::before');
    if ((a.content && a.content !== 'none') || (b.content && b.content !== 'none')) return false;
    return true;
  }
  function passThrough(scope) {
    if (!scope) return;
    var els = all(scope, '*').filter(function (e) { return !e.__pt; });
    /* 원래 none 인 것 — 먼저 적어 둔다. 바깥 판(이미 none 일 수 있다)에서 물려받은 none 은 빼려고 잠시 뿌리를 auto 로 놓고 잰다
       (갈아 끼운 필터 조각이 투명한 Filter Panel 의 none 을 물려받아 통째로 안 눌렸다) */
    var prev = scope.style.pointerEvents;
    scope.style.pointerEvents = 'auto';
    var keep = els.filter(function (e) { return getComputedStyle(e).pointerEvents === 'none'; });
    els.forEach(function (e) {
      e.__pt = 1;
      if (keep.indexOf(e) >= 0 || e.closest('svg, .pd-chost, .pd-chartmenu, .pd-selmenu')) return;
      e.style.pointerEvents = transparentBox(e) ? 'none' : 'auto';
    });
    scope.style.pointerEvents = prev;
    if (scope.classList.contains('pd-navfrag')) scope.style.pointerEvents = 'none';
  }

  /* ══════════════════ 5-3. 선택 · 옵션 · 탭 · 검색 — Figma 변형 그대로 ══════════════════ */
  /* 필터 패널(Figma Navigation 세트) — 화면마다 처음 변형이 다르다 */
  var NAV_SCENE = { 'sop-popup': 'earthquake', building: 'weather' };
  /* 원본 인스턴스가 746 높이였던 변형 — 판 바탕을 패널 높이로 */
  var NAV_FULL = { building: 'I581:26097;530:35803', fire: 'I841:46085;530:35899', senser: '929:6278', earthquake: 'I3293:5444;929:6315', weather: 'I3292:5621;929:6333', cctv: '929:6351' };
  var SENSOR_OF = { ALL: 'senser', fire: 'fire', earthquake: 'earthquake', weather: 'weather', CCTV: 'cctv' };
  var SENSOR_KO = { senser: '전체 센서', fire: '화재센서', earthquake: '지진계측', weather: '기상관측', cctv: 'CCTV' };
  /* 센서 목록 가상 데이터 — 시안(지진 · 기상 목록)과 같은 동 순서 */
  var SITE = ['제1터빈동', '제1터빈동', '주제어동', '가스압축동', '연료설비동'];
  function baseOf(root) {
    var im = one(root, 'img[src]'), s = im ? im.getAttribute('src') : '';
    var i = s.lastIndexOf('/');
    return i >= 0 ? s.slice(0, i + 1) : 'src/plantdp/';
  }
  function navCss(base) {
    if (!window.PD_NAV) return;
    Object.keys(PD_NAV).forEach(function (k) {
      var f = PD_NAV[k];
      [[f.css, f.px + '-style'], [f.light, f.px + '-light-style']].forEach(function (a) {
        if (document.getElementById(a[1])) return;
        var s = document.createElement('style');
        s.id = a[1];
        s.textContent = base === 'src/plantdp/' ? a[0] : a[0].split('src/plantdp/').join(base);
        document.head.appendChild(s);
      });
    });
    if (document.getElementById('pdn-fix-style')) return;
    var s = document.createElement('style');
    s.id = 'pdn-fix-style';
    s.textContent = Object.keys(NAV_FULL).map(function (k) { return PD_NAV[k] ? '.' + PD_NAV[k].px + '-root [data-node-id="' + NAV_FULL[k] + '"]{height:100%!important;top:0!important;bottom:auto!important;}' : ''; }).join('\n')
      + '\n.pd-navfrag{position:absolute;left:0;top:0;width:100%;}';
    document.head.appendChild(s);
  }
  /* 같은 모양의 두 요소 사이에서 Figma 스타일 클래스(n…)만 맞바꾼다 — 선택 모양이 고른 쪽으로 옮겨 간다(자리 · 크기는 flex 가 정한다) */
  function swapStyle(a, b) {
    var A = [a].concat(all(a, '*')), Bs = [b].concat(all(b, '*'));
    if (A.length !== Bs.length) return false;
    var re = /^nI?\d/;
    A.forEach(function (x, i) {
      var y = Bs[i];
      var xs = (x.getAttribute('class') || '').split(/\s+/).filter(Boolean), ys = (y.getAttribute('class') || '').split(/\s+/).filter(Boolean);
      var xn = xs.filter(function (c) { return re.test(c); }), yn = ys.filter(function (c) { return re.test(c); });
      x.setAttribute('class', xs.filter(function (c) { return !re.test(c); }).concat(yn).join(' '));
      y.setAttribute('class', ys.filter(function (c) { return !re.test(c); }).concat(xn).join(' '));
    });
    return true;
  }
  /* 체크 · 선택 표시 자리 — 바탕 판(테두리 있는 칸)과 18px 체크 칸 */
  function markRow(r) {
    if (r.__mk) return;
    r.__mk = 1;
    var els = all(r, '*');
    var bg = els.filter(function (x) { var c = getComputedStyle(x); return c.display !== 'contents' && parseFloat(c.borderTopWidth) > 0 && x.offsetWidth >= r.offsetWidth - 6; })[0];
    if (bg) { bg.classList.add('pd-rowbg'); r.__bg2 = parseFloat(getComputedStyle(bg).borderTopWidth) >= 2; }
    var cb = els.filter(function (x) { return x.tagName !== 'IMG' && x.offsetWidth >= 16 && x.offsetWidth <= 20 && x.offsetHeight >= 16 && x.offsetHeight <= 20; })[0];
    if (cb) cb.classList.add('pd-cbox');
    r.__design = !!(cb && one(cb, 'img'));
    r.__on = r.__design;
  }
  function setChk(r, on) {
    markRow(r);
    r.__on = on;
    r.classList.toggle('pd-chk', on && !r.__design);
    r.classList.toggle('pd-unchk', !on && r.__design);
  }
  /* 글자 칸 위에 진짜 입력칸 — 누르면 나타나고, 놓으면 글자로 돌아간다(패널편집 중에는 글자를 고칠 수 있게 비켜 준다) */
  function inputOver(st, host, p, opt) {
    if (!host || !p || host.__inp) return null;
    opt = opt || {};
    var cs = getComputedStyle(p);
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    var inp = document.createElement('input');
    inp.type = opt.type || 'text';
    inp.className = 'pd-inp';
    inp.setAttribute('aria-label', opt.label || p.textContent.trim());
    inp.spellcheck = false;
    inp.autocomplete = 'off';
    inp.style.cssText = 'left:' + p.offsetLeft + 'px;top:' + (p.offsetTop - 3) + 'px;height:' + (p.offsetHeight + 6) + 'px;width:' + Math.max(60, host.clientWidth - p.offsetLeft - 10) + 'px;font-size:' + cs.fontSize + ';font-weight:' + cs.fontWeight + ';letter-spacing:' + cs.letterSpacing + ';';
    host.appendChild(inp);
    host.__inp = inp;
    p.classList.add('pd-inp-src');
    var ph = opt.placeholder;      /* 자리 글자(검색칸) — 값이 있으면 숨긴다 */
    if (!ph && !opt.mask) inp.value = p.textContent.trim();
    function open() { if (editing()) return; host.classList.add('pd-typing'); inp.focus(); if (!ph && !opt.mask) inp.select(); }
    host.addEventListener('click', function (e) { if (editing()) return; e.stopPropagation(); open(); });
    inp.addEventListener('click', function (e) { e.stopPropagation(); });
    inp.addEventListener('blur', function () {
      host.classList.remove('pd-typing');
      if (ph) { host.classList.toggle('pd-hasval', !!inp.value); return; }
      if (opt.mask) { if (inp.value) write(p, new Array(Math.min(16, inp.value.length) + 1).join('*')); return; }
      if (inp.value.trim()) write(p, inp.value.trim());
    });
    inp.addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Enter') { inp.blur(); if (opt.enter) opt.enter(inp.value); } if (e.key === 'Escape') { inp.value = ph ? '' : inp.value; inp.blur(); if (opt.input) opt.input(''); } });
    if (opt.input) inp.addEventListener('input', function () { opt.input(inp.value); });
    return inp;
  }
  function textOf(el) { return (el.textContent || '').replace(/\s+/g, ' ').trim(); }

  function installControls(root, st) {
    var F = st.frame;
    var base = baseOf(root);
    root.style.setProperty('--pd-chk', 'url("' + base + 'frame-283.svg")');
    root.style.setProperty('--pd-chk-all', 'url("' + base + 'group-107.svg")');

    /* ── 필터 패널 ── */
    var fp = one(F, '[data-name="Filter Panel"]');
    if (fp) installFilterPanel(root, st, fp, base);

    /* ── 기간 옵션(1시간 · 6시간 · 12시간 · 1일) — Figma 선택 모양(btn_period 변형)이 고른 단추로 옮겨 가고 조회 구간이 바뀐다 ── */
    var opts = all(F, '[data-name="Period Options"] [data-name^="Option/"]');
    if (opts.length) {
      var act = opts.filter(function (o) { var p = one(o, 'p'); return p && /255, 255, 255/.test(getComputedStyle(p).color); })[0] || opts[2];
      var HRS = { 'Option/1H': 1, 'Option/6H': 6, 'Option/12H': 12, 'Option/1D': 24 };
      opts.forEach(function (o) {
        clickable(o, function () {
          if (o !== act && swapStyle(act, o)) act = o;
          var h = HRS[nm(o)] || 12;
          setRange(h);
          var p = one(o, 'p');
          toast(st, '최근 ' + (p ? p.textContent.trim() : h + '시간') + ' 구간으로 다시 조회합니다');
        });
      });
    }
    function setRange(h, end) {
      end = end || new Date(Math.floor(now().getTime() / 1800000) * 1800000);
      var start = new Date(end.getTime() - h * 3600000);
      st.range = { start: start, end: end };
      paintRange();
    }
    function paintRange() {
      if (!st.range) return;
      [['Field/Start Date', st.range.start], ['Field/End Date', st.range.end]].forEach(function (a) {
        all(F, '[data-name="' + a[0] + '"]').forEach(function (f) {
          var ps = all(f, 'p');
          if (ps.length >= 2) { write(ps[0], ymd(a[1])); write(ps[1], ampm(a[1])); } else if (ps[0]) write(ps[0], ymd(a[1]) + ' ' + ampm(a[1]));
        });
      });
      [['Field/Start', st.range.start], ['Field/End', st.range.end]].forEach(function (a) {
        all(F, '[data-name="Range Summary"] [data-name="' + a[0] + '"]').forEach(function (f) { var p = one(f, 'p') || (f.tagName === 'P' ? f : null); write(p, ymd(a[1]) + ' ' + hms(a[1])); });
      });
    }
    /* ── 시작 · 종료 날짜 칸 — 누르면 브라우저 날짜 · 시각 고르기 ── */
    ['Field/Start Date', 'Field/End Date'].forEach(function (n, i) {
      all(F, '[data-name="' + n + '"]').forEach(function (f) {
        clickable(f, function () {
          var inp = f.__dt;
          if (!inp) {
            inp = f.__dt = document.createElement('input');
            inp.type = 'datetime-local';
            inp.className = 'pd-dtpick';
            inp.step = 1;
            f.appendChild(inp);
            inp.addEventListener('click', function (e) { e.stopPropagation(); });
            inp.addEventListener('change', function () {
              var d = new Date(inp.value);
              if (isNaN(d)) return;
              var r = st.range || { start: new Date(now().getTime() - 12 * 3600000), end: now() };
              if (i === 0) r.start = d; else r.end = d;
              if (r.start > r.end) { var t = r.start; r.start = r.end; r.end = t; }
              st.range = r; paintRange();
              toast(st, '조회 구간을 ' + ymd(r.start) + ' ' + hms(r.start) + ' ~ ' + hms(r.end) + ' 로 바꿨습니다');
            });
          }
          var cur = (st.range && (i === 0 ? st.range.start : st.range.end)) || now();
          inp.value = ymd(cur) + 'T' + hms(cur);
          try { inp.showPicker(); } catch (e) { inp.focus(); }
        });
      });
    });

    /* ── 이벤트 등급 칩(All · CR · MA · MI · WA · NO) — 그 등급 줄만 보인다. 접힌 화면에서는 이벤트 현황으로 넘어가 거른다 ── */
    if (st.elog) {
      var GR = ['All', 'CR', 'MA', 'MI', 'WA', 'NO'];
      var chips = [];
      all(st.elog, 'p').forEach(function (p) {
        var g = p.textContent.trim();
        if (GR.indexOf(g) < 0) return;
        var c = p.parentElement;
        if (!c || chips.some(function (x) { return x.el === c; })) return;
        chips.push({ g: g, el: c });
      });
      /* 이벤트 현황의 칩은 display:contents(상자가 없다) — 모양은 자식들에 */
      var visOf = function (el) { return getComputedStyle(el).display === 'contents' ? kids(el) : [el]; };
      var applyGrade = function (g) {
        st.grade = g;
        chips.forEach(function (c) {
          var v = visOf(c.el);
          v.forEach(function (x, i) { x.classList.toggle('pd-chipon', i === 0 && g !== 'All' && c.g === g); x.classList.toggle('pd-chipdim', g !== 'All' && c.g !== g); });
        });
        (st.elogRows || []).forEach(function (r) { r.style.display = (g === 'All' || !r.__grade || r.__grade === g) ? '' : 'none'; });
        if (st.realign) st.realign();
      };
      st.applyGrade = applyGrade;
      chips.forEach(function (c) {
        clickable(c.el, function () {
          if (st.scene !== 'event') {
            try { sessionStorage.setItem('pd-elog-open', '1'); sessionStorage.setItem('pd-elog-grade', c.g); } catch (e) { }
            goto('event');
            return;
          }
          applyGrade(st.grade === c.g ? 'All' : c.g);
          if (c.g !== 'All') toast(st, c.g + ' 등급 이벤트만 표시합니다');
        });
      });
      if (st.scene === 'event') {
        var g0 = null;
        try { g0 = sessionStorage.getItem('pd-elog-grade'); sessionStorage.removeItem('pd-elog-grade'); } catch (e) { }
        if (g0 && g0 !== 'All') applyGrade(g0);
      }
      /* 표 줄 고르기 */
      (st.elogRows || []).forEach(function (r) {
        clickable(r, function () {
          (st.elogRows || []).forEach(function (x) { x.classList.toggle('pd-rowsel', x === r && !x.classList.contains('pd-rowsel')); });
        });
      });
    }

    /* ── 오른쪽 위젯 묶음 접기(Button/Collapse · 파란 화살표) — 패널이 오른쪽으로 비켜나고 화살표가 돌아선다 ── */
    var sp = one(F, '[data-name="Side Panel"]');
    var cbs = sp ? all(sp, '[data-name="Button/Collapse"]').filter(function (b) { return !b.parentElement.closest('[data-name="Button/Collapse"]'); }) : [];
    if (sp && cbs.length) {
      placed(sp);
      var setSide = function (shut, anim) {
        if (!anim) root.classList.add('pd-resizing');
        var bx = cbs.map(function (b) { return b.offsetLeft; }).reduce(function (a, v) { return Math.min(a, v); }, 1e9);
        sp.__sx = shut ? Math.max(0, sp.offsetWidth - Math.max(0, bx) - 44) : 0;
        sp.classList.toggle('pd-spshut', shut);
        place(sp);
        if (!anim) { void sp.offsetWidth; root.classList.remove('pd-resizing'); }
        var f = load(K_FOLD); f.side = shut ? 1 : 0; save(K_FOLD, f);
      };
      cbs.forEach(function (b) { clickable(b, function () { setSide(!sp.classList.contains('pd-spshut'), true); }); });
      if (load(K_FOLD).side === 1) setSide(true, false);
    }

    /* ── SOP 목록 — '전체' 고르기 · 검색 ── */
    var list = one(F, '[data-name="Side Panel/SOP List"]');
    if (list) {
      var items = all(list, '[data-name^="Item/"]').filter(function (x) { return /^Item\/\d+$/.test(nm(x)); });
      var sel = one(list, '[data-name="Select"]'), selP = sel && one(sel, '[data-name="Label"]');
      var stat = '전체', q = '';
      var refilter = function () {
        items.forEach(function (it) {
          var t = textOf(it);
          var ok = (stat === '전체' || t.indexOf(stat) >= 0) && (!q || t.indexOf(q) >= 0);
          it.style.display = ok ? '' : 'none';
        });
      };
      if (sel && selP) {
        var menu = document.createElement('div');
        menu.className = 'pd-selmenu';
        ['전체', '진행중', '대기', '완료'].forEach(function (o) { var b = document.createElement('button'); b.type = 'button'; b.textContent = o; b.dataset.v = o; menu.appendChild(b); });
        sel.appendChild(menu);
        clickable(sel, function (e) {
          var b = e.target.closest && e.target.closest('.pd-selmenu button');
          if (b) {
            stat = b.dataset.v; write(selP, stat); refilter();
            menu.classList.remove('open'); sel.classList.remove('pd-open');
            all(menu, 'button').forEach(function (x) { x.classList.toggle('cur', x === b); });
            return;
          }
          var open = !menu.classList.contains('open');
          menu.classList.toggle('open', open); sel.classList.toggle('pd-open', open);
        });
        all(menu, 'button')[0].classList.add('cur');
        document.addEventListener('pointerdown', st.onSelDoc = function (e) { if (!sel.contains(e.target)) { menu.classList.remove('open'); sel.classList.remove('pd-open'); } }, true);
      }
      var sf = one(list, '[data-name="Search Field"]'), sfp = sf && all(sf, 'p')[0];
      if (sf && sfp) inputOver(st, sf, sfp, { placeholder: true, label: 'SOP 검색', input: function (v) { q = v.trim(); refilter(); } });
    }

    /* ── 차트 범례 — 누르면 그 선을 끄고 켠다(같은 색 선을 찾는다) ── */
    var hex = function (c) { var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c || ''); return m ? '#' + [m[1], m[2], m[3]].map(function (v) { return (+v).toString(16).padStart(2, '0'); }).join('') : String(c || '').toLowerCase(); };
    all(F, '[data-name^="Legend"] [data-name^="Item"], [data-name="Legend"] > [data-name^="Item"]').forEach(function (it) {
      if (it.parentElement.closest('[data-name^="Item"]')) return;
      var sw = all(it, '*').filter(function (x) { var c = getComputedStyle(x); return x.offsetWidth > 0 && x.offsetWidth <= 14 && x.offsetHeight <= 14 && c.backgroundColor !== 'rgba(0, 0, 0, 0)'; })[0];
      if (!sw) return;
      var col = hex(getComputedStyle(sw).backgroundColor);
      var w = it.closest('[data-name^="Widget/"], [data-name="Chart Panel"], [data-name^="Popup/"]') || F;
      clickable(it, function () {
        var off = !it.classList.contains('pd-legoff');
        it.classList.toggle('pd-legoff', off);
        var n = 0;
        all(w, 'svg path, svg polyline').forEach(function (p) {
          var s = (p.getAttribute('stroke') || '').toLowerCase();
          if (s && (s === col || hex(getComputedStyle(p).stroke) === col)) { p.style.opacity = off ? '0' : ''; p.style.transition = 'opacity .3s ease'; n++; }
        });
        if (!n) toast(st, textOf(it).split(' ')[0] + (off ? ' 계열을 숨깁니다' : ' 계열을 다시 표시합니다'));
      });
    });

    /* ── 로그인 — 아이디 · 비밀번호 입력, 아이디 저장 체크, Enter 로 들어간다 ── */
    var fid = one(F, '[data-name="Field/ID"] [data-name="Input"]'), fpw = one(F, '[data-name="Field/Password"] [data-name="Input"]');
    var signIn = function () { goto('main'); };
    if (fid) inputOver(st, fid, one(fid, 'p'), { label: '아이디', enter: function () { if (fpw && fpw.__inp) fpw.__inp.focus(); } });
    if (fpw) inputOver(st, fpw, one(fpw, 'p'), { type: 'password', mask: true, label: '비밀번호', enter: signIn });
    var rem = one(F, '[data-name="Checkbox/Remember ID"]');
    if (rem) { markRow(rem); rem.classList.add('pd-allchk'); clickable(rem, function () { setChk(rem, !rem.__on); }); }
    if (st.scene === 'login') {
      /* 로그인 화면에서 Enter = SIGN UP(입력칸 밖이어도) */
      document.addEventListener('keydown', st.onKey = function (e) {
        if (e.key !== 'Enter' || editing() || !root.isConnected || root.offsetParent === null) return;
        var a = document.activeElement;
        if (a && /INPUT|TEXTAREA/.test(a.tagName) && !a.classList.contains('pd-inp')) return;
        if (a && a.isContentEditable) return;
        signIn();
      });
    }

    /* ── 헤더 — 로고는 종합 방재현황으로, 경보 띠는 이벤트 현황으로 ── */
    all(F, '[data-name="Header"] [data-name="logo chip"]').forEach(function (l) { clickable(l.parentElement, function () { if (st.scene !== 'main') goto('main'); }); });
    all(F, '[data-name="Header"] [data-name="ticker"], [data-name="Header"] [data-name="Ticker Wrap"]').forEach(function (t) { clickable(t, function () { if (st.scene !== 'event') { try { sessionStorage.setItem('pd-elog-open', '1'); } catch (e) { } goto('event'); } }); });
    installTooltips(root, st);
  }

  /* 툴팁(Tooltip/*) — 시안엔 펼쳐 그려 둔 말풍선이다. 평소엔 숨기고, 제 단추에 마우스를 올렸을 때만 보인다.
     짝 = 이름 끝이 같은 단추(Tooltip/SOP Status ↔ Button/SOP Status), 없으면 말풍선에서 가장 가까운 단추.
     패널편집 중에는 글자를 고칠 수 있게 모두 보인다. */
  function installTooltips(root, st) {
    var F = st.frame;
    var tips = all(F, '[data-name^="Tooltip/"]').filter(function (t) { return !t.parentElement.closest('[data-name^="Tooltip/"]'); });
    if (!tips.length) return;
    var center = function (b) { return [b.x + b.w / 2, b.y + b.h / 2]; };
    var cands = all(F, '[data-name^="Button/"], [data-name="Action Buttons"] > [data-name]').filter(function (b) { return !b.closest('[data-name^="Tooltip"]') && b.offsetWidth > 0; });
    st.tipPairs = [];
    /* 1) 이름으로 짝 */
    var named = new Map();
    tips.forEach(function (t) {
      t.classList.add('pd-tip');
      var s = nm(t).replace('Tooltip/', '').replace(/ Wrap$/, '');
      var target = one(F, '[data-name="Button/' + s + '"]') || one(F, '[data-name="Button/' + s + ' Wrap"]');
      if (target) named.set(t, target);
    });
    /* 2) 이름이 안 맞는 것(SOP 화면 단추는 fire · earthquake · ALL 로 이름이 엉켜 있다) — 말풍선 알약(… Wrap 이면 안쪽 Tooltip/*)과
          단추 가운데 거리로, 가까운 짝부터 전체에서 고른다(한 개씩 차례로 고르면 넓은 Wrap 이 옆 단추를 가로챘다) */
    var rest = tips.filter(function (t) { return !named.has(t); });
    var pool = cands.filter(function (c) { var v = false; named.forEach(function (x) { if (x === c) v = true; }); return !v; });
    var dist = [];
    rest.forEach(function (t) {
      var pill = one(t, '[data-name^="Tooltip/"]') || t;
      var tc = center(box(pill, st));
      pool.forEach(function (c) { var cc = center(box(c, st)); dist.push({ t: t, c: c, d: Math.hypot(cc[0] - tc[0], cc[1] - tc[1]) }); });
    });
    dist.sort(function (a, b) { return a.d - b.d; });
    var usedT = new Set(), usedC = new Set();
    dist.forEach(function (x) { if (x.d > 220 || usedT.has(x.t) || usedC.has(x.c)) return; usedT.add(x.t); usedC.add(x.c); named.set(x.t, x.c); });
    tips.forEach(function (t) {
      var target = named.get(t);
      if (!target) return;
      st.tipPairs.push({ tip: t, target: target });
      var hideT = null;
      var on = function () { clearTimeout(hideT); t.classList.add('pd-tip-on'); };
      var off = function () { hideT = setTimeout(function () { t.classList.remove('pd-tip-on'); }, 80); };
      target.addEventListener('pointerenter', on);
      target.addEventListener('pointerleave', off);
      target.addEventListener('focusin', on);
      target.addEventListener('focusout', off);
    });
  }

  /* 필터 패널 — 탭(건물 · 센서 · 레이어) · 카테고리별/건물별 · 센서 유형(ALL · 화재 · 지진 · 기상 · CCTV)을 누르면
     Figma Navigation 세트의 그 변형을 그대로 갈아 끼운다(src/plantdp-nav.js). 패널 상자(옮긴 자리 · 반응형)는 그대로 둔다. */
  function installFilterPanel(root, st, fp, base) {
    var orig = kids(fp);
    var origKey = NAV_SCENE[st.scene] || 'layer1';
    var cur = origKey, cache = {};
    var lastSensor = SENSOR_KO[origKey] && origKey !== 'senser' ? origKey : 'senser', lastLayer = /^layer/.test(origKey) ? origKey : 'layer1';
    if (window.PD_NAV) navCss(base);
    /* 패널 바탕 판 높이(반응형으로 늘어난 값)를 변형에도 */
    var plate = orig.length ? all(fp, '*').filter(function (x) { return getComputedStyle(x).display !== 'contents'; }).sort(function (a, b) { return b.offsetHeight - a.offsetHeight; })[0] : null;
    function fitFrags() { var h = plate ? plate.offsetHeight : fp.offsetHeight; Object.keys(cache).forEach(function (k) { cache[k].style.height = Math.max(h, fp.offsetHeight) + 'px'; }); }
    if (plate && window.ResizeObserver) { st.navRO = new ResizeObserver(fitFrags); st.navRO.observe(plate); }
    function wrapper(k) {
      if (cache[k]) return cache[k];
      var f = window.PD_NAV && PD_NAV[k];
      if (!f) return null;
      var w = document.createElement('div');
      w.className = f.px + '-root pd-navfrag';
      w.setAttribute('data-name', 'Navigation/' + k);
      w.dataset.theme = root.dataset.theme || 'light';
      w.innerHTML = f.build(base);
      fp.appendChild(w);
      cache[k] = w;
      fitFrags();
      normalize(w, k);
      wire(w, k);
      setupScroll(root, st, { el: w, filter: true, host: fp, parts: thinParts(w), active: function () { return cur === k; } });
      passThrough(w);
      /* '색 정하기'로 고른 색을 새로 만든 조각에도(스튜디오) */
      try { if (window.__applyTplTint) window.__applyTplTint(); } catch (e) { }
      return w;
    }
    /* 라이브러리 변형의 자리 글자(#001 반복 · 가스터빈동)를 시안 목록과 같은 가상 데이터로 */
    function normalize(w, k) {
      var cnt = {};
      all(w, '[data-name="block3"]').forEach(function (b) {
        var ps = all(b, 'p');
        if (ps.length < 2) return;
        var m = /^(.*?)\s*#\d+$/.exec(ps[0].textContent.trim());
        if (!m) return;
        var t = k === 'cctv' ? 'CCTV' : m[1];
        cnt[t] = (cnt[t] || 0) + 1;
        ps[0].textContent = t + ' #' + ('00' + cnt[t]).slice(-3);
        ps[1].textContent = SITE[(cnt[t] - 1) % SITE.length];
      });
    }
    function show(k, quiet) {
      if (!k || k === cur) return;
      var w = k === origKey ? null : wrapper(k);
      if (k !== origKey && !w) return;
      orig.forEach(function (c) { c.style.display = k === origKey ? '' : 'none'; });
      Object.keys(cache).forEach(function (x) { cache[x].style.display = x === k ? '' : 'none'; });
      fp.classList.toggle('pd-navswapped', k !== origKey);
      cur = k;
      if (SENSOR_KO[k]) lastSensor = k;
      if (/^layer/.test(k)) lastLayer = k;
      var vis = w || fp;
      if (vis.animate) (w ? [w] : orig).forEach(function (el) { el.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.22,.8,.24,1)' }); });
      if (!quiet && SENSOR_KO[k]) toast(st, SENSOR_KO[k] + ' 목록을 표시합니다');
    }
    st.nav = { show: show, fp: fp, cur: function () { return cur; } };
    /* 테마를 변형 칸에도 */
    if (window.MutationObserver) {
      st.navMO = new MutationObserver(function () { Object.keys(cache).forEach(function (k) { cache[k].dataset.theme = root.dataset.theme || 'light'; }); });
      st.navMO.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    }
    function wire(scope) {
      /* 탭 */
      all(scope, '[data-name="btn-tab_building"]').forEach(function (b) { clickable(b, function () { show('building'); }); });
      all(scope, '[data-name="btn-tab_sencer"]').forEach(function (b) { clickable(b, function () { show(lastSensor); }); });
      all(scope, '[data-name="btn-tab_layer"]').forEach(function (b) {
        var isLayer = /레이어/.test(textOf(b));
        clickable(b, function () {
          if (isLayer) { show(lastLayer); return; }
          /* 새로고침 단추 — 체크 · 선택 · 검색을 처음으로 */
          var ic = one(b, 'img');
          if (ic && ic.animate) ic.animate([{ rotate: '0deg' }, { rotate: '360deg' }], { duration: 600, easing: 'cubic-bezier(.22,.8,.24,1)' });
          var sc = cur === origKey ? fp : cache[cur];
          all(sc, '[data-name="row"], [data-name="btn-all check"]').forEach(function (r) { if (r.__mk) setChk(r, r.__design); });
          all(sc, '.pd-sel, .pd-unsel').forEach(function (x) { x.classList.remove('pd-sel', 'pd-unsel'); });
          all(sc, '.pd-inp').forEach(function (i) { i.value = ''; i.dispatchEvent(new Event('input')); i.parentElement.classList.remove('pd-hasval'); });
          toast(st, '필터를 처음 상태로 되돌렸습니다');
        });
      });
      /* 카테고리별 · 건물별 — 글자와 그 탭 판(위가 둥근 판) */
      var subs = all(scope, 'p').filter(function (p) { return /^(카테고리별|건물별)$/.test(p.textContent.trim()); });
      if (subs.length === 2) {
        var mid = (subs[0].getBoundingClientRect().right + subs[1].getBoundingClientRect().left) / 2;
        var tabsEl = all(scope, '*').filter(function (x) { var c = getComputedStyle(x); return c.borderTopLeftRadius === '12px' && c.borderBottomLeftRadius === '0px' && x.offsetHeight >= 30 && x.offsetHeight <= 60; });
        subs.concat(tabsEl).forEach(function (el) {
          clickable(el, function () {
            var r = el.getBoundingClientRect();
            var right = el.tagName === 'P' ? /건물별/.test(el.textContent) : (r.left + r.width / 2) > mid;
            show(right ? 'layer2' : 'layer1');
          });
        });
      }
      /* 센서 유형 */
      /* 라이브러리 변형은 묶음 이름(icon btn set)이 빠져 온다 — 'ALL' 단추의 부모를 묶음으로 */
      all(scope, '[data-name="ALL"]').map(function (a) { return a.parentElement; }).filter(function (s, i, arr) { return s && arr.indexOf(s) === i; }).forEach(function (set) {
        set.classList.add('pd-iconset');
        kids(set).forEach(function (b) {
          var k = SENSOR_OF[nm(b)];
          if (k) clickable(b, function () { show(k); });
        });
      });
      /* 행 체크 · 전체선택 */
      var rows = all(scope, '[data-name="row"]');
      rows.forEach(function (r) { clickable(r, function () { setChk(r, !(r.__mk ? r.__on : (markRow(r), r.__on))); }); });
      all(scope, '[data-name="btn-all check"]').forEach(function (a) {
        if (a.closest('[data-name="Event Log"]')) return;
        a.classList.add('pd-allchk');
        clickable(a, function () {
          markRow(a);
          var on = !a.__on;
          setChk(a, on);
          rows.forEach(function (r) { markRow(r); setChk(r, on); });
          toast(st, on ? '전체 항목을 선택했습니다' : '전체 선택을 풀었습니다');
        });
      });
      all(scope, '[data-name="btn-save"]').forEach(function (b) { clickable(b, function () { toast(st, '필터 설정을 저장했습니다'); }); });
      /* 건물 목록 — 묶음 접기 · 건물 고르기(건물 캐러셀로) */
      all(scope, '[data-name="block1"]').forEach(function (h) {
        var holder = h.parentElement;
        var listEl = h.nextElementSibling;
        var ar = one(h, 'img'); ar = ar && ar.parentElement;
        if (ar) ar.style.transition = 'rotate .3s cubic-bezier(.22,.8,.24,1)';
        clickable(h, function () {
          h.__shut = !h.__shut;
          if (listEl) listEl.style.display = h.__shut ? 'none' : '';
          if (ar) ar.style.rotate = h.__shut ? '180deg' : '';
          if (!listEl) { var c = one(h, '[data-name="btn-tab"]'); toast(st, textOf(h).replace(/\d+$/, '').trim() + ' · 건물 ' + (c ? textOf(c) : '') + '곳'); }
        });
        void holder;
      });
      var blocks2 = all(scope, '[data-name="block2"]');
      blocks2.forEach(function (b) {
        clickable(b, function () {
          blocks2.forEach(function (x) {
            var c = getComputedStyle(x);
            var design = x.__d2 != null ? x.__d2 : (x.__d2 = parseFloat(c.borderTopWidth) >= 2);
            x.classList.toggle('pd-sel', x === b && !design);
            x.classList.toggle('pd-unsel', x !== b && design);
          });
          var name = textOf(b);
          try { sessionStorage.setItem('pd-building', name); } catch (e) { }
          toast(st, name + ' — 건물 캐러셀로 이동합니다');
          st.timers.push(setTimeout(function () { goto('building'); }, 420));
        });
      });
      /* 센서 목록 — 고르면 테두리, 위치 · 영상 단추 */
      var b3 = all(scope, '[data-name="block3"]');
      b3.forEach(function (b) {
        clickable(b, function (e) {
          var ic2 = e.target.closest && e.target.closest('[data-name="icon2"], [data-name="marker 1"], [data-name="play-circle 1"]');
          b3.forEach(function (x) {
            markRow(x);
            var design = !!x.__bg2;
            x.classList.toggle('pd-sel', x === b && !design);
            x.classList.toggle('pd-unsel', x !== b && design);
          });
          var t = all(b, 'p')[0];
          var cctv = !!one(b, '[data-name="play-circle 1"]');
          toast(st, (t ? t.textContent.trim() : '센서') + (ic2 && cctv ? ' 실시간 영상을 엽니다' : ' 위치로 3D 장면을 옮깁니다'));
        });
      });
      /* 검색 */
      all(scope, '[data-name="search"]').forEach(function (s) {
        var p = one(s, 'p');
        inputOver(st, s, p, { placeholder: true, label: '검색', input: function (v) {
          var q2 = v.trim();
          /* 센서 목록(flex)은 접어서 위로 당기고, 건물 목록은 칸마다 자리가 고정이라(grid 겹쳐 쌓기) 흐리게만 */
          all(scope, '[data-name="block3"]').forEach(function (it) { it.style.display = !q2 || textOf(it).indexOf(q2) >= 0 ? '' : 'none'; });
          all(scope, '[data-name="block2"]').forEach(function (it) { var hit = !q2 || textOf(it).indexOf(q2) >= 0; it.style.opacity = hit ? '' : '.28'; it.classList.toggle('pd-hit', !!q2 && hit); });
          all(scope, '[data-name="block1"]').forEach(function (h) { var l = h.nextElementSibling; if (q2 && l && h.__shut && all(l, '[data-name="block2"]').some(function (b) { return textOf(b).indexOf(q2) >= 0; })) { h.__shut = false; l.style.display = ''; var ar = one(h, 'img'); if (ar) ar.parentElement.style.rotate = ''; } });
        } });
      });
    }
    wire(fp);
  }

  /* ══════════════════ 6. 라이브 차트 ══════════════════ */
  var SVG_NS = 'http://www.w3.org/2000/svg';
  function tickVal(s) { s = String(s).trim().replace(/,/g, ''); var m = /^(-?[\d.]+)\s*k$/i.exec(s); if (m) return +m[1] * 1000; return /^-?[\d.]+$/.test(s) ? +s : null; }
  /* Y 눈금 글자 중심 → 값 회귀(y = a + b·v), 그래프 판 기준 */
  function yMap(plot, graph, st) {
    var ya = one(plot, '[data-name="Y Axis"]'), gb = box(graph, st);
    var pts = ya ? all(ya, 'p').map(function (p) { var v = tickVal(p.textContent), b = box(p, st); return v == null ? null : [v, b.y + b.h / 2 - gb.y]; }).filter(Boolean) : [];
    if (pts.length < 2) return null;
    var n = pts.length, sx = 0, sy = 0, sxx = 0, sxy = 0;
    pts.forEach(function (q) { sx += q[0]; sy += q[1]; sxx += q[0] * q[0]; sxy += q[0] * q[1]; });
    var b = (n * sxy - sx * sy) / (n * sxx - sx * sx), a = (sy - b * sx) / n;
    var vs = pts.map(function (q) { return q[0]; });
    return { y: function (v) { return a + b * v; }, lo: Math.min.apply(null, vs), hi: Math.max.apply(null, vs) };
  }
  function svgColors(url) {
    return fetch(url).then(function (r) { return r.text(); }).then(function (t) {
      var c = [], m, re = /stroke="(#[0-9a-fA-F]{6}|rgb[^"]*)"/g;
      while ((m = re.exec(t))) if (c.indexOf(m[1]) < 0) c.push(m[1]);
      var g = [], re2 = /stop-color="(#[0-9a-fA-F]{6})"/g;
      while ((m = re2.exec(t))) g.push(m[1]);
      return { strokes: c, stops: g };
    }).catch(function () { return { strokes: [], stops: [] }; });
  }
  function mkSvg(w, h) {
    var s = document.createElementNS(SVG_NS, 'svg');
    s.setAttribute('class', 'pd-live-svg');
    s.setAttribute('width', w); s.setAttribute('height', h); s.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    return s;
  }
  function installLiveCharts(root, st) {
    var F = st.frame;
    st.lines = st.lines || [];
    all(F, '[data-name="Plot"]').forEach(function (plot) {
      var w = plot.closest('[data-name^="Widget/"]'), wn = nm(w).replace(/ Wrap$/, '');
      var graph = one(plot, '[data-name="Graph"]');
      if (!graph || !w) return;
      var grid = one(graph, '[data-name="Grid"]');
      var G = box(graph, st), Gr = grid ? box(grid, st) : G;
      var map = yMap(plot, graph, st);
      if (!map) return;
      var ox = Gr.x - G.x, oy = Gr.y - G.y, W = Gr.w, H = Gr.h;
      if (/Seismic/.test(wn)) seismicChart(st, graph, ox, oy, W, H, map, w);
      else if (/Trend$/.test(wn)) trendChart(st, graph, ox, oy, W, H, map, w, wn);
    });
    /* 기상 현재값 — 5초마다 살짝 */
    var wobs = one(F, '[data-name="Widget/Weather Observation"]');
    if (wobs) {
      var V = [['Temperature', 9.8, 0.08, 1], ['Humidity', 58, 0.6, 0], ['Pressure', 1021, 0.25, 0], ['Wind Speed', 3.6, 0.35, 1]];
      var cur = V.map(function (v) { return v[1]; });
      st.timers.push(setInterval(function () {
        if (idle() || editing()) return;
        V.forEach(function (v, i) {
          cur[i] = clamp(cur[i] + rnd(-v[2], v[2]), v[1] - v[2] * 6, v[1] + v[2] * 6);
          var p = one(wobs, '[data-name="Measurement/' + v[0] + '"] [data-name="Value Row"] p') || one(wobs, '[data-name="Measurement/' + v[0] + '"] [data-name="Value"]');
          writeValue(p, cur[i].toFixed(v[3]));
          if (v[0] === 'Wind Speed') { var vane = one(wobs, '[data-name="Wind Vane"]'); var q = vane && all(vane, 'p').filter(function (x) { return /m\/s/.test(x.textContent); })[0]; writeValue(q, cur[i].toFixed(1)); }
        });
      }, 5000));
    }
  }
  /* 지진 파형 — 세 성분이 오른쪽에서 흘러 들어온다(약 7초에 한 판) */
  /* 원본 SVG 그림을 그대로 DOM 으로 심는다 — 경로 id 는 Figma 레이어 이름(Line · Line_2 · Area · Threshold/…) */
  function inlineSvg(img) {
    return fetch(img.getAttribute('src')).then(function (r) { return r.text(); }).then(function (t) {
      var svg = new DOMParser().parseFromString(t, 'image/svg+xml').documentElement;
      if (!svg || svg.nodeName.toLowerCase() !== 'svg') return null;
      svg = document.importNode(svg, true);
      var uid = 'pdt' + Math.random().toString(36).slice(2, 7);
      all(svg, '[id]').forEach(function (e) {
        var o = e.id; e.id = uid + o;
        all(svg, '[fill="url(#' + o + ')"],[stroke="url(#' + o + ')"],[mask="url(#' + o + ')"],[filter="url(#' + o + ')"],[clip-path="url(#' + o + ')"]').forEach(function (u) {
          ['fill', 'stroke', 'mask', 'filter', 'clip-path'].forEach(function (k) { if (u.getAttribute(k) === 'url(#' + o + ')') u.setAttribute(k, 'url(#' + uid + o + ')'); });
        });
      });
      svg.__uid = uid;
      svg.setAttribute('class', img.getAttribute('class') || '');
      svg.style.cssText = img.style.cssText;
      img.parentNode.replaceChild(svg, img);
      return svg;
    }).catch(function () { return null; });
  }
  function idOf(p, uid) { return (p.id || '').slice(uid.length); }
  /* 꺾은선 경로(M · L · H)의 점 */
  function pathPts(d) {
    var pts = [], m, re = /([MLHV])\s*(-?[\d.]+)(?:[\s,]+(-?[\d.]+))?/g, x = 0, y = 0;
    while ((m = re.exec(d))) {
      if (m[1] === 'H') { x = +m[2]; pts.push([x, y]); }
      else if (m[1] === 'V') { y = +m[2]; pts.push([x, y]); if (m[3] != null) re.lastIndex -= m[3].length; }
      else { x = +m[2]; y = +m[3]; pts.push([x, y]); }
    }
    return pts;
  }
  /* 지진 파형 — 원본 선의 중심 · 진폭 그대로, 세 성분이 오른쪽에서 흘러 들어온다 */
  function seismicChart(st, graph, ox, oy, W, H, map, widget) {
    var data = one(graph, '[data-name="Data"]');
    var img = data ? one(data, 'img') : one(graph, 'img');
    if (!img) return;
    inlineSvg(img).then(function (svg) {
      if (!svg) return;
      var lines = all(svg, 'path').filter(function (p) { return /^Line(_\d+)?$/.test(idOf(p, svg.__uid)) || (data && (p.getAttribute('d') || '').length > 400); });
      if (!lines.length) return;
      var L = lines.map(function (p) {
        var pts = pathPts(p.getAttribute('d'));
        var ys = pts.map(function (q) { return q[1]; }).sort(function (a, b) { return a - b; });
        var mid = ys[Math.floor(ys.length / 2)] || 0;
        var amp = Math.max(1, (ys[ys.length - 1] - ys[0]) / 2);
        var x0 = pts.length ? pts[0][0] : 0, x1 = pts.length ? pts[pts.length - 1][0] : 1;
        var N = Math.max(80, pts.length);
        var buf = []; for (var i = 0; i < N; i++) buf.push(noise());
        return { p: p, mid: mid, amp: amp, x0: x0, x1: x1, N: N, buf: buf };
      });
      function noise() { var v = (Math.random() + Math.random() + Math.random() + Math.random() - 2) * 0.55; if (Math.random() < 0.025) v *= 2.2; return clamp(v, -1, 1); }
      function draw() {
        L.forEach(function (l) {
          var d = '';
          for (var i = 0; i < l.N; i++) d += (i ? 'L' : 'M') + (l.x0 + (l.x1 - l.x0) * i / (l.N - 1)).toFixed(2) + ' ' + (l.mid - l.buf[i] * l.amp).toFixed(2);
          l.p.setAttribute('d', d);
        });
      }
      draw();
      var burst = 0;
      st.timers.push(setInterval(function () {
        if (idle() || editing()) return;
        if (Math.random() < 0.004) burst = 40;
        L.forEach(function (l) { l.buf.shift(); var v = noise() * 0.85; if (burst) v = clamp(v * (1 + 1.4 * Math.sin(Math.PI * burst / 40)), -1, 1); l.buf.push(v); });
        if (burst) burst--;
        draw();
      }, 70));
    });
    /* 범례 값(X · Y · Z 와 P) — 2초마다 살짝 */
    var vals = all(widget, '[data-name^="Measurement/"] [data-name="Value"], [data-name^="Measurement/"] [data-name="Value Wrap"] p').filter(function (p) { return /-?\d/.test(p.textContent); });
    vals.forEach(function (p) { var m = /^(\D*?)(-?\d+)(.*)$/.exec(p.textContent); if (m) p.__base = [m[1], +m[2], m[3]]; });
    st.timers.push(setInterval(function () {
      if (idle() || editing()) return;
      vals.forEach(function (p) { if (!p.__base) return; var b = p.__base, v = Math.round(b[1] + rnd(-0.06, 0.06) * Math.max(10, Math.abs(b[1]))); write(p, b[0] + v + b[2]); });
    }, 2000));
  }
  /* 기상 추이 — 원본 마지막 값에서 이어지는 12시간 선, 2초마다 한 칸씩 흐르고 현재값이 따라간다 */
  var TREND = {
    'Widget/Temperature Trend': { v: 9.8, sd: 0.12, lo: -20, hi: 40, dec: 1, kp: [6.1, 5.2, 4.2, 4.9, 7.1, 9.0, 9.9, 10.1, 9.8] },
    'Widget/Humidity Trend': { v: 58.4, sd: 0.5, lo: 0, hi: 100, dec: 1, kp: [78, 81, 84, 82, 72, 63, 59, 57.6, 58.4] },
    'Widget/Pressure Trend': { v: 1021.4, sd: 0.12, lo: 980, hi: 1040, dec: 1, kp: [1018.6, 1018.8, 1019.1, 1019.7, 1020.3, 1020.9, 1021, 1021.2, 1021.4] },
    'Widget/Wind Speed Trend': { v: 3.6, sd: 0.6, lo: 0, hi: 24, dec: 1, kp: [1.8, 1.5, 1.6, 2.2, 3.9, 5.6, 7.4, 8.8, 3.6] },
  };
  /* 그래프가 SVG 한 장(격자 · 경계선 · 선 · 면적)으로 온 경우 — 그 SVG 를 그대로 DOM 으로 심고 선 · 면적 경로만 바꾼다(원본 모양 그대로) */
  function inlineTrend(st, graph, img, map, widget, cfg) {
    var gb = box(img, st), G = box(graph, st);
    inlineSvg(img).then(function (svg) {
      if (!svg) return;
      var uid = svg.__uid, paths = all(svg, 'path');
      /* Figma 레이어 이름이 id 로 남아 있다(Line · Area · Threshold/…) — 긴 점선 경계선을 선으로 잘못 고르지 않게 id 로 고른다 */
      var line = paths.filter(function (p) { return idOf(p, uid) === 'Line'; })[0];
      var area = paths.filter(function (p) { return idOf(p, uid) === 'Area'; })[0];
      if (!line) return;
      var vb = (svg.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number);
      var sy = vb.length === 4 && gb.h ? vb[3] / gb.h : 1;
      var offY = gb.y - G.y, vby = vb[1] || 0;
      /* 선의 가로 범위 = 원본 선의 처음 · 끝 x, 면적 바닥 = 원본 면적의 가장 아래 */
      var lp = pathPts(line.getAttribute('d'));
      var x0 = lp[0][0], x1 = lp[lp.length - 1][0];
      var ap0 = area ? pathPts(area.getAttribute('d')) : [];
      var bottom = ap0.length ? Math.max.apply(null, ap0.map(function (q) { return q[1]; })) : vby + vb[3];
      var N = 145, vals = series(cfg, N);
      var valueP = one(widget, '[data-name="Summary"] [data-name="Measurement"] p') || one(widget, '[data-name="Measurement"] p');
      function Y(v) { return vby + (map.y(v) - offY) * sy; }
      function draw() {
        var d = '';
        for (var i = 0; i < N; i++) d += (i ? 'L' : 'M') + (x0 + (x1 - x0) * i / (N - 1)).toFixed(2) + ' ' + clamp(Y(vals[i]), vby, bottom).toFixed(2);
        line.setAttribute('d', d);
        if (area) area.setAttribute('d', d + 'L' + x1.toFixed(2) + ' ' + bottom + 'L' + x0.toFixed(2) + ' ' + bottom + 'Z');
        writeValue(valueP, vals[N - 1].toFixed(cfg.dec));
      }
      draw();
      st.timers.push(setInterval(function () {
        if (idle() || editing()) return;
        var last = vals[N - 1], v = last + (cfg.v - last) * 0.08 + (Math.random() + Math.random() - 1) * cfg.sd * 1.5;
        vals.shift(); vals.push(clamp(v, cfg.lo, cfg.hi)); draw();
      }, 2000));
    });
  }
  function series(cfg, N) {
    var vals = [];
    for (var i = 0; i < N; i++) {
      var t = i / (N - 1) * (cfg.kp.length - 1), a = Math.floor(t), b = Math.min(cfg.kp.length - 1, a + 1), u = t - a;
      vals.push(cfg.kp[a] + (cfg.kp[b] - cfg.kp[a]) * (u * u * (3 - 2 * u)) + (Math.random() + Math.random() - 1) * cfg.sd);
    }
    vals[N - 1] = cfg.v;
    return vals;
  }
  function trendChart(st, graph, ox, oy, W, H, map, widget, wn) {
    var cfg = TREND[wn];
    if (!cfg) return;
    var line = one(graph, '[data-name="Line"]'), area = one(graph, '[data-name="Area"]');
    if (!line) { var gi = one(graph, 'img'); if (gi) inlineTrend(st, graph, gi, map, widget, cfg); return; }
    var lsrc = one(line, 'img') && one(line, 'img').getAttribute('src');
    var asrc = area && one(area, 'img') && one(area, 'img').getAttribute('src');
    var N = 145, vals = [];
    for (var i = 0; i < N; i++) {
      var t = i / (N - 1) * (cfg.kp.length - 1), a = Math.floor(t), b = Math.min(cfg.kp.length - 1, a + 1), u = t - a;
      vals.push(cfg.kp[a] + (cfg.kp[b] - cfg.kp[a]) * (u * u * (3 - 2 * u)) + (Math.random() + Math.random() - 1) * cfg.sd);
    }
    vals[N - 1] = cfg.v;
    var svg = mkSvg(W, H); svg.style.left = ox + 'px'; svg.style.top = oy + 'px';
    var uid = 'pdg' + Math.random().toString(36).slice(2, 8);
    var defs = document.createElementNS(SVG_NS, 'defs');
    defs.innerHTML = '<linearGradient id="' + uid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a74f4" stop-opacity=".35"/><stop offset="1" stop-color="#2a74f4" stop-opacity="0"/></linearGradient>';
    svg.appendChild(defs);
    var ap = document.createElementNS(SVG_NS, 'path'); ap.setAttribute('fill', 'url(#' + uid + ')');
    var pl = document.createElementNS(SVG_NS, 'polyline'); pl.setAttribute('fill', 'none'); pl.setAttribute('stroke-width', '1.4'); pl.setAttribute('stroke-linejoin', 'round'); pl.setAttribute('stroke', '#2a74f4');
    var dot = document.createElementNS(SVG_NS, 'circle'); dot.setAttribute('r', '3.2'); dot.setAttribute('fill', '#2a74f4'); dot.setAttribute('stroke', '#fff'); dot.setAttribute('stroke-width', '1.4');
    if (area) svg.appendChild(ap);
    svg.appendChild(pl); svg.appendChild(dot);
    Promise.all([lsrc ? svgColors(lsrc) : null, asrc ? svgColors(asrc) : null]).then(function (r) {
      var c = r[0] && r[0].strokes[0];
      if (c) { pl.setAttribute('stroke', c); dot.setAttribute('fill', c); var s = defs.querySelectorAll('stop'); s[0].setAttribute('stop-color', c); s[1].setAttribute('stop-color', (r[1] && r[1].stops[1]) || c); }
    });
    var valueP = one(widget, '[data-name="Summary"] [data-name="Measurement"] p') || one(widget, '[data-name="Measurement"] p');
    function draw() {
      var pts = '', d = '';
      for (var i = 0; i < N; i++) {
        var x = i / (N - 1) * W, y = clamp(map.y(vals[i]) - oy, 0, H);
        pts += x.toFixed(1) + ',' + y.toFixed(1) + ' ';
        d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
      }
      pl.setAttribute('points', pts);
      ap.setAttribute('d', d + 'L' + W + ' ' + H + 'L0 ' + H + 'Z');
      var ly = clamp(map.y(vals[N - 1]) - oy, 0, H);
      dot.setAttribute('cx', W); dot.setAttribute('cy', ly.toFixed(1));
      writeValue(valueP, vals[N - 1].toFixed(cfg.dec));
    }
    draw();
    line.classList.add('pd-src-hidden'); if (area) area.classList.add('pd-src-hidden');
    graph.appendChild(svg);
    st.timers.push(setInterval(function () {
      if (idle() || editing()) return;
      var last = vals[N - 1], v = last + (cfg.v - last) * 0.08 + (Math.random() + Math.random() - 1) * cfg.sd * 1.5;
      vals.shift(); vals.push(clamp(v, cfg.lo, cfg.hi)); draw();
    }, 2000));
  }

  /* ══════════════════ 7. 차트 바꾸기(패널편집) ══════════════════ */
  /*@MAKECHART*/

  var CC = { bl: '#2a74f4', cy: '#34c3e6', gn: '#2fbf71', ye: '#f5b400', or: '#f5a623', re: '#f43130', gr: '#8e9aa8', vi: '#7b61ff' };
  var EV_SPECS = [
    { k: 'donut', t: '등급별 이벤트', parts: [['Critical', CC.re, 2], ['Major', CC.or, 1], ['Minor', CC.ye, 2], ['Warning', CC.cy, 1], ['Normal', CC.gn, 1]] },
    { k: 'bar', t: '설비 유형별 이벤트', unit: '건', cats: ['화재센서', '열감지기', '출입통제', 'CCTV', '지진계', '풍속계'], vals: [2, 1, 1, 1, 1, 1], max: 4, c: CC.bl },
    { k: 'line', t: '시간대별 경보 추이', unit: '건', dec: 0, series: [['경보', CC.re, 2, 1], ['주의', CC.ye, 3, 1.2]], lo: 0, hi: 8 },
  ];
  function specsFor(scene) {
    var S = {
      'Event Log': EV_SPECS,
      'Widget/Weather Observation': [
        { k: 'line', t: '온도 · 습도 추이', unit: '', dec: 1, series: [['온도(℃)', CC.or, 9.8, 0.2], ['습도(%)', CC.bl, 58, 1.2]], lo: 0, hi: 100 },
        { k: 'gauge', t: '현재 풍속 (강풍 14m/s)', unit: 'm/s', v: [3.6, 0.5], max: 24, c: CC.gn, dec: 1 },
        { k: 'bar', t: '기상 요소 현재값', unit: '', cats: ['온도', '습도', '풍속'], vals: [9.8, 58, 3.6], max: 100, c: CC.bl, dec: 1 },
      ],
      'Widget/Seismic Acceleration (Turbine Building)': [
        { k: 'area', t: '층별 가속도 추이 (Count)', unit: '', dec: 0, series: [['최상층 GMT', CC.bl, 214, 60], ['최하층 GMB', CC.or, 42, 18]], lo: 0, hi: 1000 },
        { k: 'bar', t: '성분별 피크 (Count)', unit: '', cats: ['X 상', 'Y 상', 'X 하', 'Y 하', 'Z 하'], vals: [1046, 1562, 768, 705, 893], max: 2000, c: CC.bl },
        { k: 'gauge', t: '층간 응답비', unit: '배', v: [1.0, 0.05], max: 3, c: CC.gn, dec: 2 },
      ],
      'Widget/Seismic Free Field': [
        { k: 'line', t: '자유장 성분별 진폭 (Count)', unit: '', dec: 0, series: [['E(동서)', CC.re, 312, 40], ['N(남북)', CC.bl, 297, 36], ['Z(수직)', CC.gn, 126, 20]], lo: 0, hi: 600 },
        { k: 'bar', t: '성분별 피크 (Count)', unit: '', cats: ['E(동서)', 'N(남북)', 'Z(수직)'], vals: [486, 411, 352], max: 600, c: CC.bl },
      ],
      'Widget/Temperature Trend': [{ k: 'area', t: '온도 추이 (고온 35 · 임계 38)', unit: '℃', dec: 1, series: [['온도', CC.or, 9.8, 0.2]], lo: -20, hi: 40 }, { k: 'gauge', t: '현재 온도', unit: '℃', v: [9.8, 0.2], max: 40, c: CC.or, dec: 1 }],
      'Widget/Humidity Trend': [{ k: 'area', t: '습도 추이 (다습 70 · 임계 85)', unit: '%', dec: 1, series: [['습도', CC.bl, 58.4, 0.8]], lo: 0, hi: 100 }, { k: 'gauge', t: '현재 습도', unit: '%', v: [58.4, 0.6], max: 100, c: CC.bl, dec: 1 }],
      'Widget/Pressure Trend': [{ k: 'line', t: '기압 추이', unit: 'hPa', dec: 1, series: [['기압', CC.cy, 1021.4, 0.2]], lo: 1000, hi: 1040 }, { k: 'gauge', t: '현재 기압', unit: 'hPa', v: [1021.4, 0.2], max: 1040, c: CC.cy, dec: 1 }],
      'Widget/Wind Speed Trend': [{ k: 'area', t: '풍속 추이 (강풍 14 · 임계 20)', unit: 'm/s', dec: 1, series: [['풍속', CC.gn, 3.6, 0.6]], lo: 0, hi: 24 }, { k: 'gauge', t: '현재 풍속', unit: 'm/s', v: [3.6, 0.5], max: 24, c: CC.gn, dec: 1 }],
      'Widget/High Wind Events': [{ k: 'bar', t: '시간대별 강풍 발생', unit: '건', cats: ['11시', '12시', '13시', '14시'], vals: [1, 2, 3, 1], max: 4, c: CC.re }, { k: 'line', t: '시간대별 최대 풍속', unit: 'm/s', dec: 1, series: [['최대 풍속', CC.bl, 11.8, 1.4]], lo: 0, hi: 20 }],
      'Widget/Wind Direction Analysis': [{ k: 'donut', t: '방위별 바람 빈도', parts: [['서남', CC.bl, 46], ['남', CC.cy, 22], ['서', CC.vi, 14], ['기타', CC.gr, 18]] }, { k: 'hbar', t: '풍속 구간별 비율', unit: '%', cats: ['0-2', '2-5', '5-14', '14+'], vals: [38, 41, 19, 2], max: 50, c: CC.bl }],
      'Widget/Stage Progress': [{ k: 'hbar', t: '단계별 진행률', unit: '%', cats: ['STAGE 1', 'STAGE 2', 'STAGE 3', 'STAGE 4', 'STAGE 5'], vals: [100, 75, 0.5, 0.5, 0.5], max: 100, c: CC.bl }, { k: 'gauge', t: '전체 진행률', unit: '%', v: [30, 0.2], max: 100, c: CC.bl, dec: 0 }],
      'Widget/Execution History': [{ k: 'donut', t: '작업 처리 현황', parts: [['완료', CC.gn, 5], ['진행', CC.bl, 2], ['대기', CC.gr, 6]] }, { k: 'bar', t: '단계별 소요 시간', unit: '분', cats: ['STAGE 1', 'STAGE 2'], vals: [1.5, 11.4], max: 15, c: CC.bl, dec: 1 }],
    };
    return S;
  }
  function installChartSwap(root, st) {
    if (typeof makeChart !== 'function') return;
    var savedAll = load(K_CHART), saved = savedAll[st.scene] || {};
    st.charts = {}; st.chartApply = {};
    var probe = document.createElement('i');
    probe.className = 'pd-probe';
    st.frame.appendChild(probe);
    var spec = specsFor(st.scene);
    var TG = [];
    Object.keys(spec).forEach(function (name) {
      var w = all(st.frame, '[data-name="' + name + '"]').filter(function (x) { return getComputedStyle(x).display !== 'contents' && x.offsetWidth > 100 && x.offsetHeight > 80; });
      w.forEach(function (x, i) {
        var area = name === 'Event Log' ? { l: 24, t: 58, r: 24, b: 14 } : { l: 14, t: 50, r: 14, b: 14 };
        if (name === 'Event Log' && st.scene !== 'event') return;
        TG.push({ key: name + (i ? '#' + i : ''), w: x, area: area, list: spec[name] });
      });
    });
    TG.forEach(function (tg) {
      if (getComputedStyle(tg.w).position === 'static') tg.w.style.position = 'relative';
      var body = document.createElement('div');
      body.className = 'pd-chost';
      var a = tg.area;
      body.style.left = a.l + 'px'; body.style.top = a.t + 'px'; body.style.right = a.r + 'px'; body.style.bottom = a.b + 'px';
      body.style.display = 'none';
      tg.w.appendChild(body);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pd-chartbtn';
      btn.innerHTML = KIND_ICON.bar.replace('class="ic"', 'class="ic" style="width:13px;height:11px"') + '차트';
      btn.title = '이 패널의 차트 바꾸기';
      var menu = document.createElement('div');
      menu.className = 'pd-chartmenu';
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
        tg.w.classList.toggle('pd-hidekids', i >= 0);
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
      /* 편집 중 클릭은 dt-edit.js 가 캡처에서 막는다 — pointerup 으로 받는다 */
      btn.addEventListener('pointerup', function (e) {
        e.stopPropagation(); e.preventDefault();
        all(root, '.pd-chartmenu.open').forEach(function (m) { if (m !== menu) m.classList.remove('open'); });
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
      if (e.target.closest && e.target.closest('.pd-chartmenu, .pd-chartbtn')) return;
      all(root, '.pd-chartmenu.open').forEach(function (m) { m.classList.remove('open'); });
    };
    document.addEventListener('pointerdown', st.onDocDown, true);
  }

  /* ══════════════════ 8. 패널 옮기기(패널편집) — 4px 격자 ══════════════════ */
  function installPanelMove(root, st) {
    var L = load(K_LAYOUT), me = L[st.scene] = L[st.scene] || {};
    me.free = me.free || {};
    function persist() { var a = load(K_LAYOUT); a[st.scene] = me; save(K_LAYOUT, a); }
    var sel = ['[data-name="Side Panel"] > [data-name^="Widget/"]', '[data-name="Side Panel"] > [data-name$=" Wrap"]', '[data-name="Filter Panel"]', '[data-name="Side Rail"]', '[data-name="Event Log"]',
      '[data-name^="Popup/"]', '[data-name="Main Panel"] > *', '[data-name="Side Panel/SOP List"]', '[data-name="Side Panel/Execution History"]', '[data-name="Overlay"]', '[data-name="Floor Selector Wrap"]', '[data-name="Login Panel"]',
      '[data-name^="Column/"] > [data-name^="Widget/"]'];
    var frees = [];
    sel.forEach(function (s) { all(st.frame, s).forEach(function (f) { if (frees.indexOf(f) < 0 && getComputedStyle(f).display !== 'contents' && f.offsetWidth > 40) frees.push(f); }); });
    var keyOf = function (f) { var n = nm(f), same = frees.filter(function (x) { return nm(x) === n; }); return same.length > 1 ? n + '#' + same.indexOf(f) : n; };
    frees.forEach(function (f) {
      f.classList.add('pd-mv'); placed(f);
      var s = me.free[keyOf(f)];
      if (s) { f.__ux = s[0]; f.__uy = s[1]; place(f); if (s[0] || s[1]) f.classList.add('pd-front'); }
    });
    var drag = null;
    st.onDown = function (e) {
      if (!layoutEditing(root) || e.button !== 0) return;
      if (e.target.closest('.pd-chartbtn, .pd-chartmenu, .pd-resetbtn')) return;
      if (e.target.closest('[contenteditable="true"]')) return;
      var w = e.target.closest('.pd-mv');
      if (!w || !root.contains(w)) return;
      e.preventDefault(); e.stopPropagation();
      drag = { w: w, sx: e.clientX, sy: e.clientY, moved: false };
    };
    st.onMove = function (e) {
      if (!drag) return;
      var S = (st.frame.getBoundingClientRect().width / st.frame.offsetWidth) || st.S || 1;
      var dx = (e.clientX - drag.sx) / S, dy = (e.clientY - drag.sy) / S;
      if (!drag.moved) { if (Math.hypot(dx, dy) < 3) return; drag.moved = true; drag.w.classList.add('pd-dragging'); }
      drag.w.__dx = dx; drag.w.__dy = dy; place(drag.w);
    };
    st.onUp = function () {
      if (!drag) return;
      var d = drag; drag = null;
      var w = d.w;
      w.classList.remove('pd-dragging');
      if (!d.moved) return;
      var snap = function (v) { return Math.round(v / 4) * 4; };
      w.__ux = snap((w.__ux || 0) + (w.__dx || 0)); w.__uy = snap((w.__uy || 0) + (w.__dy || 0));
      w.__dx = 0; w.__dy = 0;
      place(w);
      me.free[keyOf(w)] = [w.__ux, w.__uy];
      all(root, '.pd-front').forEach(function (x) { if (x !== w) x.classList.remove('pd-front'); });
      w.classList.toggle('pd-front', !!(w.__ux || w.__uy));
      persist();
    };
    root.addEventListener('pointerdown', st.onDown, true);
    window.addEventListener('pointermove', st.onMove);
    window.addEventListener('pointerup', st.onUp);
    window.addEventListener('pointercancel', st.onUp);
    st.onDragStart = function (e) { if (layoutEditing(root) && e.target.closest && e.target.closest('.pd-mv')) e.preventDefault(); };
    root.addEventListener('dragstart', st.onDragStart);
    st.resetLayout = function () {
      me = { free: {} };
      var a = load(K_LAYOUT); a[st.scene] = me; save(K_LAYOUT, a);
      frees.forEach(function (f) { f.__ux = 0; f.__uy = 0; place(f); f.classList.remove('pd-front'); });
      Object.keys(st.chartApply || {}).forEach(function (k) { st.chartApply[k](-1); });
    };
    var rb = document.createElement('button');
    rb.type = 'button';
    rb.className = 'pd-resetbtn';
    rb.textContent = '배치 초기화';
    rb.title = '패널 자리 · 바꾼 차트를 원본으로';
    st.frame.appendChild(rb);
    rb.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    rb.addEventListener('pointerup', function (e) { e.stopPropagation(); e.preventDefault(); st.resetLayout(); });
    st.onReset = function (e) { if (e.target.closest && e.target.closest('#layoutReset')) st.resetLayout(); };
    document.addEventListener('click', st.onReset, true);
  }

  /* ══════════════════ 살리기 ══════════════════ */
  var SCENE_OF = { pdm: 'main', pdw: 'weather', pds: 'seismic', pde: 'event', pdp: 'sop-popup', pdb: 'building', pdf: 'floor', pdo: 'sop', pdy: 'sop-standby', pdl: 'login' };
  function sceneOf(root) {
    var m = /\b(pd[a-z])-root\b/.exec(root.className);
    return { px: m ? m[1] : 'pdm', scene: m && SCENE_OF[m[1]] ? SCENE_OF[m[1]] : 'main' };
  }
  /* ══════════════════ SOP 진행 연출 ══════════════════
     사용자 2026-11-17: "SOP 부분을 좀 더 동적으로, 진행중인 상황 같은 것들 잘 보이게".
     원본 디자인(색 · 자리)은 그대로 두고 그 위에 층만 얹는다 — 진행 중 단계 카드는 빛 테두리 · 흐르는 빛 · 작업 진행 띠,
     대기 단계는 옅게, 진행 중 단계로 가는 화살표는 살짝 움직이고, 진행률 칸은 채워진 칸이 차례로 켜진 뒤 물결이 흐르고 다음 칸이 깜빡인다.
     진행 중 작업 줄은 왼쪽 띠 + 숨 쉬는 바탕, 재생 아이콘은 맥박, '진행중' 배지는 퍼지는 고리. 상태는 글자('완료' · '진행중' · '경과')로 정한다. */
  function installSop(root, st) {
    if (!/^sop/.test(st.scene)) return;
    var F = st.frame;
    function fx(host, cls, inner) {
      if (!host || one(host, ':scope > .' + cls)) return null;
      var cs = getComputedStyle(host);
      if (cs.display === 'contents') return null;
      if (cs.position === 'static') host.style.position = 'relative';
      var i = document.createElement('i');
      i.className = 'pd-fx ' + cls; i.setAttribute('aria-hidden', 'true');
      if (inner) i.appendChild(document.createElement('i'));
      host.appendChild(i);
      return i;
    }
    function txt(el) { return (el.textContent || '').replace(/\s+/g, ' '); }
    function radiusOf(el) { var r = getComputedStyle(el).borderTopLeftRadius; if (r && r !== '0px') return r; var k = el.firstElementChild; return k ? getComputedStyle(k).borderTopLeftRadius : '0px'; }
    /* 알약 배지 안 글자면 배지가 퍼지는 고리, 맨 글자면 앞에 깜빡이는 점 */
    function markLive(p) {
      var b = p.parentElement;
      for (var k = 0; k < 3 && b && b !== F; k++) {
        var cs = getComputedStyle(b);
        if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.borderTopWidth !== '0px' || cs.boxShadow !== 'none' || /^Badge/i.test(nm(b))) break;
        b = b.parentElement;
      }
      var bb = b && b !== F ? b.getBoundingClientRect() : null;
      if (bb && bb.width < 120 && bb.height < 40 && !/^Card\/Stage/.test(nm(b))) {
        b.classList.add('pd-badge-live');
        if (!b.style.borderRadius) b.style.borderRadius = radiusOf(b);
        return;
      }
      if (getComputedStyle(p).position === 'static') p.style.position = 'relative';
      p.classList.add('pd-livetxt');
    }
    function liveText(scope, word) {
      all(scope, 'p').forEach(function (p) { if (p.textContent.trim() === word) markLive(p); });
    }
    /* 작업 진행 비율 — 'n/m' 배지(단계별 작업 항목 · 실행 이력) */
    var ratio = 0.5;
    all(F, 'p').some(function (p) { var m = /^(\d+)\/(\d+)$/.exec(p.textContent.trim()); if (m && +m[2] && +m[1] < +m[2]) { ratio = +m[1] / +m[2]; return true; } return false; });

    /* 1) 단계 진행 카드 */
    var cards = all(F, '[data-name^="Card/Stage"]');
    var onIdx = -1;
    cards.forEach(function (c, i) {
      var t = txt(c);
      if (/진행중/.test(t)) {
        onIdx = i;
        c.classList.add('pd-stg-on');
        var ring = fx(c, 'pd-ring'); if (ring) ring.style.borderRadius = radiusOf(c);
        /* 위쪽 색 판(카드보다 낮은 첫 바탕 칸) — 흐르는 빛 · 진행 띠 */
        var cb = c.getBoundingClientRect();
        var fill = kids(c).filter(function (k) { var b = k.getBoundingClientRect(); var bg = getComputedStyle(k).backgroundColor; return bg !== 'rgba(0, 0, 0, 0)' && b.height < cb.height - 4 && b.width >= cb.width - 2; })[0];
        if (fill) {
          fill.classList.add('pd-fill');
          fx(fill, 'pd-sweep');
          var strip = fx(fill, 'pd-strip', true);
          if (strip) { strip.firstChild.style.setProperty('--w', '0%'); st.timers.push(setTimeout(function () { strip.firstChild.style.setProperty('--w', Math.round(ratio * 100) + '%'); }, 450)); }
        }
        liveText(c, '진행중');
      } else if (/완료/.test(t)) c.classList.add('pd-stg-done');
      else c.classList.add('pd-stg-wait');
    });
    /* 카드 사이 화살표 — 진행 중 카드 바로 앞 것만 움직이고, 그 뒤는 옅게 */
    if (onIdx >= 0) {
      var onX = cards[onIdx].getBoundingClientRect().left;
      all(F, '[data-name="Icon/Caret Right"]').forEach(function (a) {
        var x = a.getBoundingClientRect().left;
        if (x < onX && onX - x < 60) a.classList.add('pd-caret-on');
        else if (x > onX) a.classList.add('pd-caret-off');
      });
    }

    /* 2) 진행률 칸 — 채워진 칸(초록) · 다음 칸 */
    all(F, '[data-name="Gauge"]').forEach(function (g) {
      var segs = all(g, '[data-name="Segment"]');
      var on = segs.filter(function (s) { return /44,\s*230,\s*185|2ce6b9/i.test(getComputedStyle(s).backgroundImage); });
      on.forEach(function (s, i) { s.classList.add('pd-seg-on'); s.style.setProperty('--d1', (i * 0.045).toFixed(3) + 's'); s.style.setProperty('--d2', (0.8 + i * 0.07).toFixed(3) + 's'); });
      var head = segs[segs.indexOf(on[on.length - 1]) + 1];
      if (on.length && head) head.classList.add('pd-seg-head');
      /* 값 글자는 0 에서 차오른다 */
      var gp = g.parentElement && all(g.parentElement, 'p').filter(function (p) { return /^\d+%$/.test(p.textContent.trim()); })[0];
      /* 값(큰 글자)과 % (작은 글자)는 크기가 다른 span — 값 span 만 바꾼다(writeValue) */
      if (gp && one(gp, 'span')) {
        var to = parseInt(gp.textContent, 10), t0 = 0;
        var step = function () { t0 += 1; writeValue(gp, String(Math.round(to * Math.min(1, t0 / 24)))); if (t0 < 24) st.timers.push(setTimeout(step, 30)); };
        writeValue(gp, '0'); st.timers.push(setTimeout(step, 200));
      }
    });

    /* 3) 진행 중 작업 줄 — '경과' 배지가 있고 아직 끝나지 않은 줄 · Task (Active) */
    var rows = all(F, '[data-name="Task (Active)"]');
    all(F, '[data-name^="Row/"]').forEach(function (r) {
      if (one(r, '[data-name="Icon/Play Circle"]') || (one(r, '[data-name="Button/Complete"]') && /경과/.test(txt(r)))) rows.push(r);
    });
    rows.forEach(function (r) { fx(r, 'pd-taskglow'); liveText(r, '경과'); });
    all(F, '[data-name="Icon/Play Circle"]').forEach(function (i) { i.classList.add('pd-pulse'); });
    all(F, '[data-name="Icon/Loading"]').forEach(function (i) { i.classList.add('pd-spin'); });

    /* 4) 진행 중 단계 묶음(SOP 팝업 · 단계별 작업 항목 · 실행 이력) — 머리에 '경과'가 있는 Stage/n */
    all(F, '[data-name^="Stage/"]').forEach(function (s) {
      if (!/^Stage\/\d/.test(nm(s))) return;
      var head = one(s, '[data-name="Header"], [data-name="Header Row"]') || s;
      /* SOP 팝업의 '대기' 단계는 카드처럼 옅게 */
      if (!/경과/.test(txt(head))) { if (s.closest('[data-name="Popup/SOP Progress"]') && /대기/.test(txt(head))) s.classList.add('pd-stg-wait'); return; }
      /* 단계별 작업 항목 표는 파란 머리줄이 이미 강조이고, 묶음 상자가 스크롤 가림막 밖으로 길어 테두리를 두르지 않는다 */
      if (!s.closest('[data-name="Widget/Stage Tasks"]')) { var ring = fx(s, 'pd-ring'); if (ring) ring.style.borderRadius = radiusOf(s); }
      liveText(head, '경과');
    });
    all(F, '[data-name="Connector"]').forEach(function (c) { c.classList.add('pd-bob'); });
    var next = one(F, '[data-name="Button/Next Stage"]');
    if (next) { next.classList.add('pd-fill'); fx(next, 'pd-sweep'); }

    /* 5) '진행중' 배지(SOP 목록 · 요약) — 퍼지는 고리 */
    all(F, 'p').forEach(function (p) {
      if (p.textContent.trim() !== '진행중' || p.closest('[data-name^="Card/Stage"]')) return;
      markLive(p);
    });
  }

  function start(root, st) {
    var steps = [['fit', installFit], ['clock', installClock], ['recent', installRecent], ['sop', installSop], ['elog', installEventLog], ['nav', installNav],
      ['charts', installLiveCharts], ['scroll', installScroll], ['controls', installControls], ['swap', installChartSwap], ['move', installPanelMove],
      ['through', function (r, s) { passThrough(s.frame); }]];
    steps.forEach(function (s) { try { s[1](root, st); } catch (e) { console.warn('[pd] ' + s[0], e); } });
    all(root, '[data-name="Side Panel"] > *, [data-name="Main Panel"] > *').forEach(function (c, i) { c.style.setProperty('--i', i % 6); });
    if (!all(root, '[data-name="Header"] p').some(function (p) { return p.textContent.trim() === '긴급'; })) root.classList.add('pd-calm');
    root.classList.add('pd-enter');
    st.timers.push(setTimeout(function () { root.classList.remove('pd-enter'); }, 1400));
  }
  function initPlantdp(root) {
    if (!root || root.__pd) return;
    injectStyle();
    root.classList.add('pd-root');
    var so = sceneOf(root);
    var st = root.__pd = { timers: [], scene: so.scene, px: so.px, onLayout: [] };
    if (/[?&]edit=1/.test(location.search)) root.classList.add('pd-edit-layout');
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
  function disposePlantdp(root) {
    var st = root && root.__pd;
    if (!st) return;
    if (st.wait) st.wait.disconnect();
    st.timers.forEach(function (t) { clearInterval(t); clearTimeout(t); });
    clearTimeout(st.feed); clearTimeout(st.toastT);
    if (st.ro) st.ro.disconnect();
    if (st.onResize) window.removeEventListener('resize', st.onResize);
    Object.keys(st.charts || {}).forEach(function (k) { st.charts[k].dispose(); });
    if (st.onDocDown) document.removeEventListener('pointerdown', st.onDocDown, true);
    if (st.onSelDoc) document.removeEventListener('pointerdown', st.onSelDoc, true);
    if (st.onKey) document.removeEventListener('keydown', st.onKey);
    if (st.navRO) st.navRO.disconnect();
    if (st.navMO) st.navMO.disconnect();
    if (st.alignMO) st.alignMO.disconnect();
    if (st.onDown) root.removeEventListener('pointerdown', st.onDown, true);
    if (st.onMove) window.removeEventListener('pointermove', st.onMove);
    if (st.onUp) { window.removeEventListener('pointerup', st.onUp); window.removeEventListener('pointercancel', st.onUp); }
    if (st.onDragStart) root.removeEventListener('dragstart', st.onDragStart);
    if (st.onReset) document.removeEventListener('click', st.onReset, true);
    root.__pd = null;
  }
  window.initPlantdp = initPlantdp;
  window.disposePlantdp = disposePlantdp;
})();
