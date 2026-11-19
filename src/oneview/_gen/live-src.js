/* 통합 운영 원뷰 — 재구축 화면 11장의 인터랙션 · 라이브 · 반응형 레이어.
   window.initOneview(root) / window.disposeOneview(root)

   화면(DOM·CSS)은 생성기(src/oneview/_gen/conv.js)가 Figma 그대로 만든다. 이 파일은 그 위에 '움직이는 것'만 얹는다 — 정지 상태(?live=0) = Figma 원본.
   · 반응형 — 1920x1080 좌표계 + 균일 배율 S. 남는 폭 · 높이는 화면 첫 단 묶음(헤더 · 열 · 판)이 왼/가운데/오른, 위/가운데/아래 자리에 따라 나눠 갖는다(바탕은 꽉 채움). 정확히 16:9 면 Figma 와 같다.
   · 실시간 시계 · 이벤트 발생시각을 지금 기준으로(열 때마다 최근), 새 이벤트가 맨 위로 흘러 들어온다 · 차트 X축 시각도 지금 기준
   · Event Log 접기 단추 — 아래 바처럼 붙은 로그는 위로 펼치고, 열린 로그는 바로 접는다(화면마다 기억)
   · 라이브 차트 — Figma 선 · 면적 그림을 그대로 인라인으로 바꿔 한 칸씩 흐르게 하고, 범례 값 · 막대 · 숫자 지표가 같이 바뀐다
   · 마우스 오버 · 눌림 — 메뉴 · 단추 · 탭 · 칩 · 카드 · 노드 · 표 줄 · 범례 · 페이지
   · 스크롤 — 칸보다 긴 표(이벤트 로그 · 시스템 목록 · 그룹 목록)는 휠 · 끌기로 넘긴다
   · 차트 바꾸기(패널편집 중) — 패널마다 관제 화면에 맞춘 추천 차트. 첫 항목 = 추천, '원본 그대로'로 되돌린다
   · 패널 옮기기(패널편집 중) — 판을 4px 격자로 옮긴다, '배치 초기화'로 되돌린다
   손으로 쓴 파일이다(생성물 아님). 고친 뒤 node mk-live.js → js/core/tpl-modules.js 의 ?v= 를 올릴 것. */
(function () {
  'use strict';

  var BASE_W = 1920, BASE_H = 1080;
  var K_LAYOUT = 'wemb-oneview-layout', K_CHART = 'wemb-oneview-chart', K_FOLD = 'wemb-oneview-fold';
  var STYLE_ID = 'oneview-live-style';
  var EASE = 'cubic-bezier(.22,.8,.24,1)';
  var BASE_TIME = new Date(2026, 11, 10, 9, 2, 30).getTime();   /* Figma 화면에 찍힌 기준 시각 */

  /* ══════════════════ 스타일 ══════════════════ */
  var CSS = [
    '.ov-root{--ov-acc:0,136,255;overflow:clip!important;}',
    '.ov-root.ov-resizing *,.ov-root .ov-dragging,.ov-root .ov-dragging *{transition:none!important;}',
    '.ov-root.ov-live .ov-place{transition:translate .5s ' + EASE + ',opacity .3s ease;}',
    '.ov-root .ov-probe{position:absolute;width:0;height:0;overflow:hidden;color:#0088ff;}',
    '.ov-root .ov-click{cursor:pointer;}',
    '.ov-root .ov-click *{cursor:inherit;}',
    '.dt-content-editing .ov-root .ov-click,.dt-content-editing .ov-root .ov-click *{cursor:text;}',
    '@keyframes ovIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}}',
    '@keyframes ovFade{from{opacity:0;}to{opacity:1;}}',
    '@keyframes ovPop{from{opacity:0;transform:translateY(12px) scale(.985);}to{opacity:1;transform:none;}}',
    '.ov-root.ov-enter .ov-unit{animation:ovIn .55s ' + EASE + ' both;animation-delay:calc(var(--i,0) * 45ms);}',
    '.ov-root.ov-enter [data-name^="Popup/"]{animation:ovPop .45s ' + EASE + ' both;}',
    /* 헤더 */
    '.ov-root [data-name="Nav"] [data-name^="Nav Item/"]{cursor:pointer;transition:filter .2s ease,text-shadow .25s ease,translate .2s ' + EASE + ';}',
    '.ov-root [data-name="Nav"] [data-name^="Nav Item/"]:hover{filter:brightness(1.35);text-shadow:0 0 10px rgba(0,229,255,.75);translate:0 -1px;}',
    '.ov-root [data-name="Nav"] [data-name^="Nav Item/"]:active{translate:0 1px;}',
    '.ov-root [data-name="Sub Nav"] [data-name^="Nav Item"],.ov-root [data-name="Sub Nav"] [data-name^="Text Wrap"]{cursor:pointer;transition:filter .2s ease;}',
    '.ov-root [data-name="Button/User"]{cursor:pointer;transition:filter .2s ease,scale .2s ' + EASE + ';}',
    '.ov-root [data-name="Button/User"]:hover{filter:brightness(1.35) drop-shadow(0 0 6px rgba(0,229,255,.6));scale:1.05;}',
    '.ov-root [data-name="Button/User"]:active{scale:.95;}',
    '.ov-root [data-name="Logo Group"]{cursor:pointer;}',
    '.ov-root [data-name="Header"] [data-name="Logo"] .tpl-studio-logo{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;object-position:left center;}',
    /* 단추 · 탭 · 필터 · 건수 · 페이지 */
    '.ov-root [data-name^="Button/"]:not([data-name="Button/User"]):not([data-name="Button/Close"]),.ov-root [data-name^="Tab/"],.ov-root [data-name^="Filter/"],.ov-root [data-name^="Count/"],.ov-root [data-name^="Page/"],.ov-root [data-name="Select"],.ov-root [data-name="Search Field"]{cursor:pointer;transition:filter .2s ease,translate .2s ' + EASE + ',box-shadow .25s ease,opacity .25s ease;}',
    '.ov-root [data-name^="Button/"]:not([data-name="Button/User"]):not([data-name="Button/Close"]):hover,.ov-root [data-name^="Tab/"]:hover,.ov-root [data-name^="Filter/"]:hover,.ov-root [data-name^="Count/"]:hover,.ov-root [data-name^="Page/"]:hover,.ov-root [data-name="Select"]:hover{filter:brightness(1.3) drop-shadow(0 0 6px rgba(0,160,255,.55));translate:0 -1px;}',
    '.ov-root [data-name^="Button/"]:not([data-name="Button/User"]):not([data-name="Button/Close"]):active,.ov-root [data-name^="Tab/"]:active,.ov-root [data-name^="Filter/"]:active,.ov-root [data-name^="Count/"]:active,.ov-root [data-name^="Page/"]:active{filter:brightness(.9);translate:0 1px;}',
    '.ov-root [data-name="Search Field"]:hover{box-shadow:0 0 10px rgba(0,180,255,.45);}',
    '.ov-root .ov-on{filter:brightness(1.35) drop-shadow(0 0 7px rgba(0,180,255,.7))!important;}',
    '.ov-root [data-name^="Count/"].ov-dim{opacity:.38;filter:saturate(.3);}',
    '.ov-root [data-name="Button/Close"]{cursor:pointer;transition:filter .2s ease,rotate .3s ' + EASE + ';}',
    '.ov-root [data-name="Button/Close"]:hover{filter:brightness(1.4) drop-shadow(0 0 6px rgba(120,200,255,.8));rotate:90deg;}',
    '.ov-root [data-name="Pagination"] .ov-cur{filter:brightness(1.5) drop-shadow(0 0 6px rgba(0,180,255,.8));}',
    /* 카드 · 노드 · 아이템 */
    '.ov-root [data-name^="Card/"]{transition:translate .25s ' + EASE + ',filter .25s ease;}',
    '.ov-root [data-name^="Card/"]:hover{translate:0 -3px;filter:brightness(1.18) drop-shadow(0 6px 12px rgba(0,0,0,.35));}',
    '.ov-root [data-name^="Node/"],.ov-root [data-name^="Item/"]:has(> [data-name="Graphic"]){cursor:pointer;transition:translate .3s ' + EASE + ',filter .3s ease;}',
    '.ov-root [data-name^="Node/"]:hover,.ov-root [data-name^="Item/"]:has(> [data-name="Graphic"]):hover{translate:0 -4px;filter:brightness(1.25) drop-shadow(0 0 10px rgba(0,200,255,.55));}',
    '.ov-root [data-name^="Server Cube"],.ov-root [data-name="Network Device"]{cursor:pointer;transition:translate .3s ' + EASE + ',filter .3s ease;}',
    '.ov-root [data-name^="Server Cube"]:hover,.ov-root [data-name="Network Device"]:hover{translate:0 -4px;filter:brightness(1.25) drop-shadow(0 0 10px rgba(0,200,255,.55));}',
    '.ov-root [data-name="Legend"] [data-name^="Item/"]{cursor:pointer;transition:opacity .25s ease,filter .2s ease;}',
    '.ov-root [data-name="Legend"] [data-name^="Item/"]:hover{filter:brightness(1.3);}',
    '.ov-root [data-name="Legend"] [data-name^="Item/"].ov-mute{opacity:.35;}',
    '.ov-root .ov-line.ov-mute{opacity:0;}',
    '.ov-root .ov-line{transition:opacity .3s ease;}',
    /* 표 줄 */
    '.ov-root [data-name^="Row/"]{transition:background-color .2s ease,filter .2s ease;}',
    '.ov-root [data-name="Body"] > [data-name^="Row/"]:hover,.ov-root [data-name="Table"] [data-name^="Row/"]:hover{filter:brightness(1.35);cursor:pointer;}',
    '.ov-root .ov-new{animation:ovNew 1.8s ease;}',
    '@keyframes ovNew{0%{filter:brightness(1.9);}100%{filter:none;}}',
    '@keyframes ovBlink{0%,100%{opacity:1;}50%{opacity:.35;}}',
    '.ov-root [data-name="Event Log"] [data-name="Td/Event Grade"] .ov-cri{animation:ovBlink 1.6s ease-in-out infinite;}',
    /* 이벤트 로그 접기 */
    '.ov-root [data-name="Event Log"]{transition:translate .55s ' + EASE + ';}',
    '.ov-root .ov-fold{position:absolute;z-index:5;width:26px;height:26px;border-radius:6px;border:1px solid rgba(80,170,255,.55);background:linear-gradient(180deg,rgba(18,52,120,.95),rgba(10,26,70,.95));display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 0 8px rgba(0,140,255,.35);transition:filter .2s ease,box-shadow .2s ease,translate .2s ' + EASE + ';}',
    '.ov-root .ov-fold:hover{filter:brightness(1.35);box-shadow:0 0 12px rgba(0,180,255,.7);translate:0 -1px;}',
    '.ov-root .ov-fold svg{width:12px;height:12px;transition:rotate .45s ' + EASE + ';}',
    '.ov-root .ov-fold.ov-up svg{rotate:180deg;}',
    /* 스크롤 */
    '.ov-root .ov-scroll{overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:rgba(90,150,240,.65) transparent;}',
    '.ov-root .ov-scroll::-webkit-scrollbar{width:6px;}',
    '.ov-root .ov-scroll::-webkit-scrollbar-thumb{background:rgba(90,150,240,.65);border-radius:3px;}',
    '.ov-root .ov-scroll::-webkit-scrollbar-track{background:transparent;}',
    /* 숫자 지표 바뀜 */
    '.ov-root .ov-tick{animation:ovTick .6s ease;}',
    '@keyframes ovTick{0%{filter:brightness(1.8);}100%{filter:none;}}',
    '.ov-root .ov-toast{position:absolute;left:50%;top:86px;z-index:80;translate:-50% -8px;opacity:0;padding:10px 20px;border:1px solid rgba(0,229,255,.6);border-radius:10px;background:rgba(6,14,48,.94);color:#e6f6ff;font:600 15px/1 "Pretendard Variable",Pretendard,sans-serif;pointer-events:none;transition:opacity .25s ease,translate .3s ' + EASE + ';white-space:nowrap;box-shadow:0 0 12px rgba(0,229,255,.3);}',
    '.ov-root .ov-toast.on{opacity:1;translate:-50% 0;}',
    /* 패널편집 */
    '.dt-editing .ov-root .ov-mv,.ov-root.ov-edit-layout .ov-mv{cursor:grab!important;}',
    '.dt-editing .ov-root .ov-mv *,.ov-root.ov-edit-layout .ov-mv *{cursor:grab!important;}',
    '.dt-editing .ov-root .ov-mv:hover,.ov-root.ov-edit-layout .ov-mv:hover{outline:1px dashed rgba(var(--ov-acc),.85);outline-offset:3px;}',
    '.ov-root .ov-mv{transition:translate .35s ' + EASE + ';}',
    '.ov-root .ov-front{z-index:20;}',
    '.ov-root .ov-dragging{z-index:30;filter:drop-shadow(0 14px 22px rgba(0,0,0,.5));cursor:grabbing!important;transition:none!important;}',
    '.ov-root .ov-resetbtn{position:absolute;left:196px;top:66px;z-index:45;display:none;height:26px;padding:0 14px;border:1px solid rgb(var(--ov-acc));border-radius:8px;background:#0a1640;color:#e6f7ff;font:500 13px/1 "Pretendard Variable",Pretendard,sans-serif;cursor:pointer;}',
    '.ov-root .ov-resetbtn:hover{filter:brightness(1.25);box-shadow:0 0 12px rgba(var(--ov-acc),.6);}',
    '.dt-editing .ov-root .ov-resetbtn,.ov-root.ov-edit-layout .ov-resetbtn{display:block;}',
    '.dt-editing .ov-root [data-name]{animation-play-state:paused!important;}',
    '.ov-root .ov-chost{position:absolute;z-index:6;pointer-events:auto;}',
    '.ov-root .ov-hid{visibility:hidden!important;}',
    '.ov-root .ov-chart{border-radius:8px;z-index:2;}',
    '.ov-root .ov-chartbtn.ov-chartbtn{position:absolute;z-index:46;right:auto;width:auto;}',
    '.ov-root .ov-chartmenu.ov-chartmenu{position:absolute;z-index:47;right:auto;}',
    '.ov-root :has(> .ov-chartmenu.open){z-index:50!important;}',
    /* 실제 조작 — 글자 단추 · 셀렉트 · 입력 · 체크 · 줄 선택 */
    '.ov-root .ov-line{pointer-events:none;}',
    '.ov-root .ov-btn{cursor:pointer;transition:filter .18s ease,translate .18s ' + EASE + ',box-shadow .22s ease;}',
    '.ov-root .ov-btn:hover{filter:brightness(1.3) drop-shadow(0 0 6px rgba(0,170,255,.6));translate:0 -1px;}',
    '.ov-root .ov-btn:active{filter:brightness(.88);translate:0 1px;transition-duration:.06s;}',
    '.ov-root .ov-btn *{cursor:inherit;}',
    '.ov-root .ov-tabhit{animation:ovTab .35s ' + EASE + ';}',
    '@keyframes ovTab{0%{filter:brightness(1.7);}100%{filter:none;}}',
    '.ov-root .ov-dd{cursor:pointer;transition:box-shadow .2s ease,filter .2s ease;}',
    '.ov-root .ov-dd:hover{box-shadow:inset 0 0 0 1px rgba(63,140,255,.85),0 0 8px rgba(0,150,255,.35);}',
    '.ov-root .ov-dd.ov-open{box-shadow:inset 0 0 0 1px #3f8cff,0 0 10px rgba(0,150,255,.45);}',
    '.ov-root .ov-dd > [data-name="Icon"]{transition:rotate .3s ' + EASE + ';}',
    '.ov-root .ov-dd.ov-open > [data-name="Icon"]{rotate:180deg;}',
    '.ov-root .ov-ddmenu{position:absolute;z-index:70;display:flex;flex-direction:column;padding:3px 0;background:rgb(14,18,42);border:1px solid rgba(63,140,255,.55);border-radius:2px;box-shadow:0 10px 24px rgba(0,0,0,.55);opacity:0;translate:0 -6px;scale:1 .96;transform-origin:50% 0;pointer-events:none;transition:opacity .18s ease,translate .22s ' + EASE + ',scale .22s ' + EASE + ';max-height:220px;overflow:auto;}',
    '.ov-root .ov-ddmenu.on{opacity:1;translate:0 0;scale:1 1;pointer-events:auto;}',
    '.ov-root .ov-ddmenu button{all:unset;box-sizing:border-box;display:block;height:20px;padding:0 13px;font:400 12px/20px "Pretendard Variable",Pretendard,sans-serif;color:rgb(202,231,251);cursor:pointer;white-space:nowrap;transition:background-color .12s ease,color .12s ease;}',
    '.ov-root .ov-ddmenu button:hover{background:rgba(33,131,185,.55);color:#fff;}',
    '.ov-root .ov-ddmenu button.cur{background:rgba(63,140,255,.32);color:#fff;}',
    '.ov-root .ov-field{transition:box-shadow .2s ease;}',
    '.ov-root .ov-field:hover{box-shadow:0 0 0 1px rgba(63,140,255,.7);}',
    '.ov-root .ov-field:focus-within{box-shadow:0 0 0 1px #3f8cff,0 0 10px rgba(0,150,255,.45);}',
    '.ov-root .ov-input{all:unset;position:absolute;inset:0;box-sizing:border-box;padding:0 10px;font:400 12px/1 "Pretendard Variable",Pretendard,sans-serif;color:rgb(202,231,251);caret-color:#00e5ff;cursor:text;}',
    '.ov-root .ov-input::placeholder{color:rgba(202,231,251,.38);}',
    '.dt-content-editing .ov-root .ov-input,.dt-editing .ov-root .ov-input{pointer-events:none;}',
    '.ov-root .ov-chk{cursor:pointer;transition:filter .15s ease,scale .15s ' + EASE + ';}',
    '.ov-root .ov-chk:hover{filter:brightness(1.35) drop-shadow(0 0 4px rgba(0,183,238,.7));}',
    '.ov-root .ov-chk:active{scale:.88;}',
    '.ov-root .ov-chkoff{position:absolute;left:2px;top:2px;right:2px;bottom:2px;border-radius:2px;background:#222953;scale:0;transition:scale .18s ' + EASE + ';pointer-events:none;}',
    '.ov-root .ov-chkoff.k10{background:#010d35;}',
    '.ov-root .ov-chk.off .ov-chkoff{scale:1;}',
    '.ov-root .ov-row{cursor:pointer;transition:filter .15s ease,box-shadow .2s ease;}',
    '.ov-root .ov-row:hover{filter:brightness(1.3);}',
    '.ov-root .ov-sel,.ov-root [data-name^="Row/"].ov-sel{box-shadow:inset 0 0 0 999px rgba(0,140,255,.24),inset 3px 0 0 #00c8ff;}',
    '.ov-root .ov-arrows{position:absolute;}',
    '.ov-root .ov-arrow-hit{position:absolute;left:-6px;width:28px;height:26px;cursor:pointer;border-radius:4px;transition:background-color .15s ease,box-shadow .15s ease;}',
    '.ov-root .ov-arrow-hit.up{top:-4px;}',
    '.ov-root .ov-arrow-hit.dn{top:35px;}',
    '.ov-root .ov-arrow-hit:hover{background:rgba(0,228,255,.14);box-shadow:0 0 10px rgba(0,228,255,.45);}',
    '.ov-root .ov-arrow-hit:active{background:rgba(0,228,255,.3);}',
    '.ov-root .ov-pulse{animation:ovPulse .5s ease;}',
    '@keyframes ovPulse{0%{filter:brightness(1.45);}100%{filter:none;}}',
    '.ov-root .ov-tip{position:absolute;z-index:75;min-width:120px;padding:7px 10px;border:1px solid rgba(0,200,255,.55);border-radius:6px;background:rgba(6,14,48,.94);box-shadow:0 8px 20px rgba(0,0,0,.45);color:#d8ecff;font:500 12px/1.5 "Pretendard Variable",Pretendard,sans-serif;pointer-events:none;opacity:0;translate:0 4px;transition:opacity .15s ease,translate .2s ' + EASE + ';white-space:nowrap;}',
    '.ov-root .ov-tip.on{opacity:1;translate:0 0;}',
    '.ov-root .ov-tip b{display:block;margin-bottom:3px;color:#fff;font-weight:600;font-variant-numeric:tabular-nums;}',
    '.ov-root .ov-tip span{display:flex;align-items:center;gap:6px;}',
    '.ov-root .ov-tip span i{width:8px;height:8px;border-radius:50%;flex:none;}',
    '.ov-root .ov-tip em{margin-left:auto;padding-left:14px;font-style:normal;font-weight:600;color:#fff;font-variant-numeric:tabular-nums;}',
    '.ov-root .ov-vline{position:absolute;z-index:74;width:1px;background:linear-gradient(180deg,rgba(0,229,255,0),rgba(0,229,255,.75),rgba(0,229,255,0));pointer-events:none;opacity:0;transition:opacity .15s ease;}',
    '.ov-root .ov-vline.on{opacity:1;}',
    '.ov-root .ov-dot{position:absolute;z-index:75;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;border:2px solid #fff;box-sizing:border-box;pointer-events:none;opacity:0;transition:opacity .15s ease;box-shadow:0 0 6px rgba(0,0,0,.5);}',
    '.ov-root[data-theme="light"] .ov-btn:hover{filter:brightness(.92) drop-shadow(0 2px 5px rgba(0,80,180,.28));}',
    '.ov-root[data-theme="light"] .ov-ddmenu{background:#fff;border-color:#9dbbe6;box-shadow:0 10px 24px rgba(30,60,120,.18);}',
    '.ov-root[data-theme="light"] .ov-ddmenu button{color:#2c3e54;}',
    '.ov-root[data-theme="light"] .ov-ddmenu button:hover{background:#e3eefc;color:#0b3d82;}',
    '.ov-root[data-theme="light"] .ov-ddmenu button.cur{background:#d2e4fb;color:#0b3d82;}',
    '.ov-root[data-theme="light"] .ov-input{color:#1d2c42;caret-color:#0a6ed1;}',
    '.ov-root[data-theme="light"] .ov-input::placeholder{color:rgba(40,60,90,.42);}',
    '.ov-root[data-theme="light"] .ov-chkoff{background:#f0f0f5;}',
    '.ov-root[data-theme="light"] .ov-chkoff.k10{background:#ebedf5;}',
    '.ov-root[data-theme="light"] .ov-row:hover{filter:brightness(.95);}',
    '.ov-root[data-theme="light"] .ov-sel,.ov-root[data-theme="light"] [data-name^="Row/"].ov-sel{box-shadow:inset 0 0 0 999px rgba(30,120,230,.13),inset 3px 0 0 #1e78e6;}',
    '.ov-root[data-theme="light"] .ov-tip{background:#fff;color:#2c3e54;border-color:#9dbbe6;box-shadow:0 8px 20px rgba(30,60,120,.16);}',
    '.ov-root[data-theme="light"] .ov-tip b,.ov-root[data-theme="light"] .ov-tip em{color:#15253a;}',
    '.ov-root[data-theme="light"] .ov-vline{background:linear-gradient(180deg,rgba(30,120,230,0),rgba(30,120,230,.6),rgba(30,120,230,0));}',
    /*@CHART_CSS*/
    /* 라이트 */
    '.ov-root[data-theme="light"] [data-name="Nav"] [data-name^="Nav Item/"]:hover{filter:brightness(.8);text-shadow:0 0 8px rgba(0,110,220,.35);}',
    '.ov-root[data-theme="light"] [data-name^="Button/"]:not([data-name="Button/User"]):not([data-name="Button/Close"]):hover,.ov-root[data-theme="light"] [data-name^="Tab/"]:hover,.ov-root[data-theme="light"] [data-name^="Filter/"]:hover,.ov-root[data-theme="light"] [data-name^="Count/"]:hover,.ov-root[data-theme="light"] [data-name^="Page/"]:hover,.ov-root[data-theme="light"] [data-name="Select"]:hover{filter:brightness(.93) drop-shadow(0 2px 5px rgba(0,80,180,.25));}',
    '.ov-root[data-theme="light"] [data-name="Body"] > [data-name^="Row/"]:hover,.ov-root[data-theme="light"] [data-name="Table"] [data-name^="Row/"]:hover{filter:brightness(.95);}',
    '.ov-root[data-theme="light"] [data-name^="Card/"]:hover{filter:brightness(1.02) drop-shadow(0 6px 12px rgba(30,60,120,.18));}',
    '.ov-root[data-theme="light"] .ov-fold{background:linear-gradient(180deg,#ffffff,#e8f0fb);border-color:#7fa6dd;box-shadow:0 1px 4px rgba(30,60,120,.18);}',
    '.ov-root[data-theme="light"] .ov-fold svg path{stroke:#1d5fc4;}',
    '.ov-root[data-theme="light"] .ov-scroll{scrollbar-color:rgba(60,110,190,.45) transparent;}',
    '.ov-root[data-theme="light"] .ov-toast{background:#fff;color:#15253a;border-color:#3b9be0;box-shadow:0 8px 22px rgba(30,60,100,.16);}',
    '.ov-root[data-theme="light"] .ov-dragging{filter:drop-shadow(0 14px 22px rgba(30,60,100,.22));}',
    '.ov-root[data-theme="light"] .ov-resetbtn{background:#fff;color:#15253a;}',
    '.ov-root[data-theme="light"] .ov-chart{background:#fff;box-shadow:inset 0 0 0 1px #d9e2ea;color:#2c3e54;}',
    '.ov-root[data-theme="light"] .ov-chart .ct{color:#15253a;}',
    '.ov-root[data-theme="light"] .ov-chartbtn{background:#fff;color:#0a6ea8;box-shadow:0 2px 6px rgba(30,60,100,.14);}',
    '.ov-root[data-theme="light"] .ov-chart .ct b,.ov-root[data-theme="light"] .ov-chart .gv{color:#0060b0;}',
    '.ov-root[data-theme="light"] .ov-chart .ct b small,.ov-root[data-theme="light"] .ov-chart .gv small,.ov-root[data-theme="light"] .ov-chart .lg,.ov-root[data-theme="light"] .ov-chart .bars u{color:#5a6c82;}',
    '.ov-root[data-theme="light"] .ov-chart .ax{fill:#5a6c82;}',
    '.ov-root[data-theme="light"] .ov-chart .bars em,.ov-root[data-theme="light"] .ov-chart .hb b,.ov-root[data-theme="light"] .ov-chart .dn b{color:#15253a;}',
    '.ov-root[data-theme="light"] .ov-chart .gl{stroke:#e4ebf1;}',
    '.ov-root[data-theme="light"] .ov-chartmenu{background:#fff;color:#2c3e54;border-color:#d9e2ea;box-shadow:0 8px 22px rgba(30,60,100,.14);}',
    '.ov-root[data-theme="light"] .ov-chartmenu button:hover,.ov-root[data-theme="light"] .ov-chartmenu button.cur{color:#15253a;}',
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
  function nm(el) { return (el && el.getAttribute && el.getAttribute('data-name')) || ''; }
  function editing() { return !!document.querySelector('.dtstage.dt-content-editing, .dtstage.dt-editing, .dt-content-editing, .dt-editing'); }
  function layoutEditing(root) { return !!(root.closest('.dt-editing') || root.classList.contains('ov-edit-layout')); }
  function idle() { return typeof window.__wembIdle === 'function' ? window.__wembIdle() : document.hidden; }
  function load(k) { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function comma(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function isContents(el) { return getComputedStyle(el).display === 'contents'; }
  /* 사람이 고친 글자는 덮지 않는다 */
  function claimed(p) { return p.__ovLast != null && p.textContent !== p.__ovLast; }
  function write(p, s) {
    if (!p || p === document.activeElement || claimed(p)) return false;
    if (p.textContent !== s) p.textContent = s;
    p.__ovLast = p.textContent;
    return true;
  }
  function clickable(el, fn) {
    if (!el) return;
    el.classList.add('ov-click');
    el.addEventListener('click', function (e) {
      if (editing()) return;
      e.stopPropagation();
      fn(e);
    });
  }
  function frameOf(root) { return root.querySelector(':scope > [data-node-id]'); }
  /* 상자가 있는 요소들 — 'contents' 묶음은 자식으로 내려간다 */
  function boxes(el) {
    if (!el || el.nodeType !== 1) return [];
    if (!isContents(el)) return [el];
    var out = [];
    kids(el).forEach(function (c) { out = out.concat(boxes(c)); });
    return out;
  }
  /* 자리 = 반응형(fx,fy) + 사용자가 옮긴 몫(ux,uy) + 끄는 중(dx,dy) */
  function place(el) {
    var x = (el.__fx || 0) + (el.__ux || 0) + (el.__dx || 0);
    var y = (el.__fy || 0) + (el.__sy || 0) + (el.__uy || 0) + (el.__dy || 0);
    el.style.translate = (x || y) ? x.toFixed(2) + 'px ' + y.toFixed(2) + 'px' : '';
  }
  function unitSet(u, k, v) { u.els.forEach(function (e) { e[k] = v; place(e); }); }
  /* 프레임 기준 상자(배율 무시) */
  /* 프레임 기준 레이아웃 상자 — offset 사슬로 잰다(변형 · 배율 · 끄는 중 이동과 무관) */
  function rectIn(el, st) {
    if (el.offsetParent !== undefined && el.offsetWidth !== undefined) {
      var x = 0, y = 0, e = el;
      while (e && e !== st.frame) { x += e.offsetLeft || 0; y += e.offsetTop || 0; e = e.offsetParent; }
      if (e === st.frame) return { x: x, y: y, w: el.offsetWidth, h: el.offsetHeight };
    }
    var r = el.getBoundingClientRect(), f = st.frame.getBoundingClientRect(), S = st.S || 1;
    return { x: (r.left - f.left) / S, y: (r.top - f.top) / S, w: r.width / S, h: r.height / S };
  }
  function unionRect(els, st) {
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    els.forEach(function (e) { var r = rectIn(e, st); if (!r.w && !r.h) return; x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y); x1 = Math.max(x1, r.x + r.w); y1 = Math.max(y1, r.y + r.h); });
    return x0 > x1 ? null : { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  function goto(scene) {
    if (window.__gotoOneviewScene) { window.__gotoOneviewScene(scene); return; }
    location.href = scene + '.html' + location.search;
  }
  function toast(st, msg) {
    var t = st.toast;
    if (!t) { t = st.toast = document.createElement('div'); t.className = 'ov-toast'; st.frame.appendChild(t); }
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(st.toastT);
    st.toastT = setTimeout(function () { t.classList.remove('on'); }, 1900);
  }
  /* 지금 시각 — 화면에 찍힌 기준 시각과의 차이로 모든 시각을 옮긴다 */
  function shiftMs() { return Date.now() - BASE_TIME; }

  /* ══════════════════ 1. 화면 맞추기 ══════════════════
     판이 16:9 보다 넓으면 exW, 높으면 exH 가 남는다. 프레임 첫 단 묶음마다 하나의 단위로 왼/가운데/오른 · 위/가운데/아래에 따라
     0 · ½ · 1 만큼 옮긴다(묶음 안의 판 · 글자는 같이 움직여 어긋나지 않는다). 바탕 · 헤더 바는 폭을 늘려 여백이 없다. */
  function installFit(root, st) {
    var frame = frameOf(root);
    frame.style.position = 'absolute';
    frame.style.left = '0';
    frame.style.top = '0';
    frame.style.transformOrigin = '0 0';
    /* 재기 전에 원본 크기로 — 판이 좁으면 가운데 정렬(left 50%) 요소의 좌표가 틀어진다 */
    frame.style.width = BASE_W + 'px';
    frame.style.height = BASE_H + 'px';
    st.frame = frame;
    st.S = 1; st.exW = 0; st.exH = 0;
    var units = [];
    kids(frame).forEach(function (c, i) {
      var n = nm(c);
      var els = boxes(c);
      if (!els.length) return;
      var r = unionRect(els, st) || { x: 0, y: 0, w: 0, h: 0 };
      var u = { name: n, el: c, els: els, r: r, i: i };
      if (n === 'Background' || (r.w >= 1900 && r.h >= 1000)) u.kind = 'bg';
      else if (n === 'Header') u.kind = 'header';
      else {
        var cx = r.x + r.w / 2, cy = r.y + r.h / 2;
        /* 자기 자리 비율만큼 — 위 · 왼쪽일수록 덜, 아래 · 오른쪽일수록 더(겹침 없이 사이만 고르게 벌어진다).
           화면 아래에 붙은 이벤트 로그는 끝까지(1), 화면 폭을 거의 다 쓰는 띠는 가운데(½) */
        u.ax = r.w >= 1500 ? 0.5 : cx < 520 ? 0 : cx > 1400 ? 1 : 0.5;
        /* 세로 — 위 띠(KPI 바 · 화면 제목)는 그대로, 아래 이벤트 로그는 끝까지, 본문은 한 덩어리로 가운데(판끼리 어긋나지 않는다) */
        u.ay = (n === 'Event Log' && r.h < 500) || r.y >= BASE_H - 60 ? 1 : (r.y + r.h <= 140 && r.w >= 900) ? 0 : 0.5;
        u.kind = 'move';
      }
      els.forEach(function (e) { e.classList.add('ov-place'); });
      if (u.kind === 'move') els.forEach(function (e) { e.classList.add('ov-unit'); e.style.setProperty('--i', i); });
      units.push(u);
    });
    st.units = units;
    var hdr = units.filter(function (u) { return u.kind === 'header'; })[0];
    var hBar = hdr && one(hdr.el, '[data-name="Header Bar"]');
    var hNav = hBar && one(hBar, '[data-name="Nav"]'), hUtil = hBar && one(hBar, '[data-name="Utility"]');
    var hInd = hdr && one(hdr.el, '[data-name="Active Indicator"]');
    var bgW0 = {};
    function layoutFn() {
      var W = root.clientWidth, H = root.clientHeight;
      if (!W || !H) return;
      var S = Math.min(W / BASE_W, H / BASE_H);
      var VW = W / S, VH = H / S, exW = Math.max(0, VW - BASE_W), exH = Math.max(0, VH - BASE_H);
      if (exW < 0.01) exW = 0;
      if (exH < 0.01) exH = 0;
      st.S = S; st.exW = exW; st.exH = exH; st.VW = VW; st.VH = VH;
      /* 프레임은 1920x1080 그대로 — 넓히면 퍼센트로 놓인 묶음(인프라 노드)이 프레임 높이를 따라 더 내려갔다.
         남는 자리는 바탕 · 헤더 띠가 프레임 밖으로 늘어나 채우고(뿌리가 잘라 준다), 판들은 이동으로 나눠 갖는다 */
      frame.style.width = BASE_W + 'px';
      frame.style.height = BASE_H + 'px';
      frame.style.overflow = 'visible';
      frame.style.transform = S === 1 ? 'none' : 'scale(' + S + ')';
      units.forEach(function (u) {
        if (u.kind === 'bg') {
          u.els.forEach(function (e, k) {
            if (bgW0[k + u.name] == null) bgW0[k + u.name] = [e.offsetWidth, e.offsetHeight];
            var w0 = bgW0[k + u.name];
            if (w0[0] >= 1800) e.style.width = (w0[0] + exW) + 'px';
            if (w0[1] >= 1000) e.style.height = (w0[1] + exH) + 'px';
            all(e, 'img').forEach(function (im) { im.style.objectFit = 'cover'; });
          });
        } else if (u.kind === 'header') {
          if (hBar) hBar.style.width = (1920 + exW) + 'px';
          if (hNav) { hNav.__fx = exW / 2; hNav.classList.add('ov-place'); place(hNav); }
          if (hUtil) { hUtil.__fx = exW; hUtil.classList.add('ov-place'); place(hUtil); }
          if (hInd) { hInd.__fx = exW / 2; place(hInd); }
        } else {
          u.els.forEach(function (e) { e.__fx = exW * u.ax; e.__fy = exH * u.ay; place(e); });
        }
      });
      (st.onLayout || []).forEach(function (f) { try { f(); } catch (e) { } });
    }
    var rsT = 0;
    function relayout() {
      root.classList.add('ov-resizing');
      layoutFn();
      clearTimeout(rsT);
      rsT = setTimeout(function () { root.classList.remove('ov-resizing'); }, 140);
    }
    st.onLayout = [];
    layoutFn();
    st.layout = layoutFn;
    if (window.ResizeObserver) { st.ro = new ResizeObserver(relayout); st.ro.observe(root); }
    else { st.onResize = relayout; window.addEventListener('resize', relayout); }
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('ov-live'); }); });
  }

  /* ══════════════════ 2. 시계 · 최근 시각 ══════════════════ */
  var WD = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function installClock(root, st) {
    var d = one(root, '[data-name="Clock"] [data-name="Date"]'), t = one(root, '[data-name="Clock"] [data-name="Time"]');
    if (!d && !t) return;
    function tick() {
      var n = new Date();
      write(d, n.getFullYear() + '/' + p2(n.getMonth() + 1) + '/' + p2(n.getDate()) + ' ' + WD[n.getDay()]);
      write(t, p2(n.getHours()) + ':' + p2(n.getMinutes()) + ':' + p2(n.getSeconds()));
    }
    tick();
    var wait = 1000 - (Date.now() % 1000);
    st.timers.push(setTimeout(function () { tick(); st.timers.push(setInterval(tick, 1000)); }, wait));
  }
  /* 화면 글자 속 시각을 '기준 시각 → 지금'만큼 옮긴다. 형식: 2026-12-10 / 08:45:11 · 2026-12-10 08:45:11 · Dec 10 08:57:23 · 축 눈금 HH:MM(:SS) */
  var RE_FULL = /(\d{4})-(\d{2})-(\d{2})( \/ | )(\d{2}):(\d{2}):(\d{2})/;
  var RE_LOG = /^([A-Z][a-z]{2}) (\d{1,2}) (\d{2}):(\d{2}):(\d{2})/;
  var RE_TICK = /^(\d{2}):(\d{2})(:(\d{2}))?$/;
  function fmtFull(ms, sep) { var d = new Date(ms); return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) + sep + p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds()); }
  function restamp(p, sh) {
    var s = p.__ovOrig != null ? p.__ovOrig : (p.__ovOrig = p.textContent);
    var m;
    if ((m = RE_FULL.exec(s))) {
      var ms = new Date(+m[1], +m[2] - 1, +m[3], +m[5], +m[6], +m[7]).getTime() + sh;
      return write(p, s.replace(RE_FULL, fmtFull(ms, m[4])));
    }
    if ((m = RE_LOG.exec(s))) {
      var d0 = new Date(2026, MON.indexOf(m[1]), +m[2], +m[3], +m[4], +m[5]).getTime() + sh, d = new Date(d0);
      return write(p, s.replace(RE_LOG, MON[d.getMonth()] + ' ' + d.getDate() + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds())));
    }
    return false;
  }
  function installRecent(root, st) {
    var sh = shiftMs();
    all(root, 'p').forEach(function (p) { if (RE_FULL.test(p.textContent) || RE_LOG.test(p.textContent)) restamp(p, sh); });
    /* 차트 X축 시각 — 오늘 기준 시각으로 끝나는 눈금 */
    all(root, '[data-name="X Axis"]').forEach(function (ax) {
      var ps = all(ax, 'p').filter(function (p) { return RE_TICK.test(p.textContent.trim()); });
      if (ps.length < 2) return;
      ps.forEach(function (p) {
        var m = RE_TICK.exec(p.__ovOrig != null ? p.__ovOrig : (p.__ovOrig = p.textContent.trim()));
        var ms = new Date(2026, 11, 10, +m[1], +m[2], m[4] ? +m[4] : 0).getTime() + sh, d = new Date(ms);
        write(p, p2(d.getHours()) + ':' + p2(d.getMinutes()) + (m[3] ? ':' + p2(d.getSeconds()) : ''));
      });
    });
  }

  /* ══════════════════ 3. 이벤트 로그 — 새 이벤트 · 등급 칩 · 접기 ══════════════════ */
  var NEW_EV = [
    ['War', '[운영]채널 DB1', 'chndb01', '김철수', 'AP', 'MCI', '[DB] 세션 수 임계치 85% 초과 (CH_SESSION)'],
    ['Min', '콜센터 통합통계', 'ccsts11p', '정수연', 'AP', 'CC', '[OS] 메모리 사용률 78% 초과 (5분 평균)'],
    ['Nor', '배치 서버', 'batch02p', '정수연', 'BAT', 'BATCH', '[BATCH] 정시 집계 작업 정상 종료 (JOB_H_SUM)'],
    ['Maj', '대외계 FEP', 'fep01p', '최지훈', 'AP', 'FEP', '[FEP] 대외기관 응답 지연 (평균 2.4s)'],
    ['War', 'OpenAPI GW', 'apigw01p', '박민수', 'AP', 'API', '[API] 호출량 급증 (분당 3,812건)'],
    ['War', '전자금융 WAS', 'efwas02p', '이영희', 'AP', 'EF', '[WAS] 스레드 풀 사용률 80% 초과'],
  ];
  function rowsOf(log) { var b = one(log, '[data-name="Table"] > [data-name="Body"]'); return b ? kids(b).filter(function (r) { return /^Row\//.test(nm(r)); }) : []; }
  function cellP(row, i) { var c = kids(row)[i]; return c ? (c.tagName === 'P' ? c : one(c, 'p')) : null; }
  /* 이벤트 줄 거르기 — 등급 칩 · 구분(메시지그룹) · 검색어를 함께 */
  function applyLogFilter(log) {
    var f = log.__flt || (log.__flt = {}), q = (f.q || '').trim().toLowerCase(), n = 0;
    rowsOf(log).forEach(function (r) {
      var g = cellP(r, 0), mg = cellP(r, 7);
      var ok = (!f.grade || (g && g.textContent.indexOf(f.grade) >= 0))
        && (!f.cat || f.cat === 'ALL' || (mg && mg.textContent.trim() === f.cat))
        && (!q || r.textContent.toLowerCase().indexOf(q) >= 0);
      if (ok && r.style.display === 'none') { r.classList.remove('ov-new'); void r.offsetWidth; r.classList.add('ov-new'); }
      r.style.display = ok ? '' : 'none';
      if (ok) n++;
    });
    return n;
  }
  function markGrades(log) {
    rowsOf(log).forEach(function (r) {
      var g = one(r, '[data-name="Td/Event Grade"]');
      if (!g) return;
      var p = one(g, 'p');
      var lab = p && p.parentNode;
      if (lab) lab.classList.toggle('ov-cri', /Cri/.test(p.textContent));
    });
  }
  function installEventLog(root, st) {
    var logs = all(root, '[data-name="Event Log"]');
    logs.forEach(function (log) {
      markGrades(log);
      /* 등급 칩 — 누르면 그 등급만 · 다시 누르면 전체 */
      var counts = all(log, '[data-name^="Count/"]');
      var on = null;
      counts.forEach(function (c) {
        clickable(c, function () {
          var g = nm(c).replace('Count/', '');
          on = on === g || g === 'All' ? null : g;
          counts.forEach(function (x) { x.classList.toggle('ov-dim', !!on && nm(x) !== 'Count/' + on && nm(x) !== 'Count/All'); });
          (log.__flt = log.__flt || {}).grade = { CR: 'Cri', MA: 'Maj', MI: 'Min', WA: 'War', NO: 'Nor', OW: 'Own' }[on] || null;
          applyLogFilter(log);
        });
      });
      all(log, '[data-name="Button/Stop"]').forEach(function (b) { clickable(b, function () { st.paused = !st.paused; b.classList.toggle('ov-on', st.paused); toast(st, st.paused ? '실시간 수신을 멈췄습니다' : '실시간 수신을 다시 시작합니다'); }); });
      all(log, '[data-name="Button/Own"],[data-name="Button/Ack"]').forEach(function (b) { clickable(b, function () { toast(st, nm(b).replace('Button/', '') + ' 처리했습니다'); }); });
    });
    /* 새 이벤트 — 맨 위로 흘러 들어오고 맨 아래 줄은 빠진다(25~40초마다) */
    var main = logs[0];
    if (!main) return;
    var k = 0;
    function feed() {
      st.feed = setTimeout(feed, rnd(25000, 40000));
      if (idle() || editing() || st.paused) return;
      logs.forEach(function (log) {
        var rows = rowsOf(log);
        if (rows.length < 3) return;
        var tpl = rows[0], last = rows[rows.length - 1], ev = NEW_EV[k % NEW_EV.length];
        var srcRow = rows.filter(function (r) { var p = cellP(r, 0); return p && p.textContent.trim() === ev[0]; })[0] || tpl;
        var nr = srcRow.cloneNode(true);
        nr.style.display = '';
        var nowS = fmtFull(Date.now(), ' / '), dup = String(1 + Math.floor(Math.random() * 3));
        var vals = [ev[0], dup, ev[1], ev[2], ev[3], fmtFull(Date.now() - rnd(60, 300) * 1000, ' / '), nowS, ev[4], ev[5], ev[6]];
        kids(nr).forEach(function (c, i) { var p = c.tagName === 'P' ? c : one(c, 'p'); if (p && vals[i] != null) { p.textContent = vals[i]; p.__ovLast = vals[i]; p.__ovOrig = null; } });
        last.parentNode.insertBefore(nr, tpl);
        last.remove();
        nr.classList.add('ov-new');
      });
      logs.forEach(markGrades);
      logs.forEach(function (log) { if (log.__flt) applyLogFilter(log); });
      /* 건수 칩 */
      var cc = all(main, '[data-name^="Count/"]');
      var key = { War: 'WA', Min: 'MI', Nor: 'NO', Maj: 'MA', Cri: 'CR', Own: 'OW' }[NEW_EV[k % NEW_EV.length][0]];
      all(root, '[data-name="Event Log"] [data-name="Count/' + key + '"],[data-name="Event Log"] [data-name="Count/All"]').forEach(function (c) {
        var ps = all(c, 'p'), v = ps[ps.length - 1];
        if (v) { var n0 = +v.textContent.replace(/,/g, '') || 0; if (write(v, comma(n0 + 1))) { c.classList.remove('ov-tick'); void c.offsetWidth; c.classList.add('ov-tick'); } }
      });
      k++;
    }
    st.feed = setTimeout(feed, rnd(9000, 14000));
  }
  /* 접기 — 화면 아래에 툴바만 보이는 로그(종합현황)는 위로 펼치고, 열린 로그는 툴바만 남기고 접는다 */
  var CHEV = '<svg viewBox="0 0 12 12" fill="none"><path d="M2.5 7.5 6 4l3.5 3.5" stroke="#bfe3ff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function installFold(root, st) {
    if (st.scene === 'event') return;
    var mem = load(K_FOLD);
    all(root, '[data-name="Event Log"]').forEach(function (log, li) {
      var tb = one(log, ':scope > [data-name="Toolbar"]');
      if (!tb) return;
      var r = rectIn(log, st), tbH = tb.offsetHeight || 44;
      var visible = Math.min(r.h, BASE_H - r.y);
      var docked = visible < tbH + 20;                       /* 바처럼 붙은 로그 */
      var OPEN_H = docked ? 520 : r.h;                       /* 펼쳤을 때 보이는 높이 */
      var key = st.scene + '#' + li;
      var title = one(tb, '[data-name="Title Bar"]');
      var btn = document.createElement('div');
      btn.className = 'ov-fold';
      btn.title = '이벤트 로그 접기 / 펼치기';
      btn.innerHTML = CHEV;
      tb.style.position = tb.style.position || 'relative';
      var tr = title ? title.getBoundingClientRect() : null, tbr = tb.getBoundingClientRect();
      var S = st.S || 1;
      btn.style.left = ((tr ? tr.right - tbr.left : 140) / S + 14) + 'px';
      btn.style.top = ((tbH - 26) / 2) + 'px';
      tb.appendChild(btn);
      var body = one(log, '[data-name="Table"] > [data-name="Body"]');
      var head = one(log, '[data-name="Table"] > [data-name="Header Row"]');
      function setOpen(open, quiet) {
        log.__open = open;
        var dy = docked ? (open ? -(OPEN_H - tbH) : 0) : (open ? 0 : (r.h - tbH));
        log.__sy = dy;
        place(log);
        btn.classList.toggle('ov-up', docked ? !open : open);
        if (body) {
          var vis = (docked ? OPEN_H : r.h) - tbH - (head ? head.offsetHeight : 32) - 6;
          body.style.maxHeight = vis + 'px';
          body.classList.add('ov-scroll');
        }
        if (!quiet) { var m = load(K_FOLD); m[key] = open ? 1 : 0; save(K_FOLD, m); }
      }
      var open0 = mem[key] != null ? !!mem[key] : !docked;
      setOpen(open0, true);
      btn.addEventListener('click', function (e) { if (editing()) return; e.stopPropagation(); setOpen(!log.__open); });
      if (title) clickable(title, function () { setOpen(!log.__open); });
      log.__applyFold = function () { place(log); };
    });
  }

  /* ══════════════════ 4. 스크롤 ══════════════════ */
  function installScroll(root, st) {
    /* 표 몸통이 칸보다 길면 — 시스템 목록 · 그룹 목록 · 페이지 목록 */
    all(root, '[data-name="Table"] > [data-name="Body"],[data-name="Table Wrap"] [data-name="Body"]').forEach(function (b) {
      if (b.closest('[data-name="Event Log"]')) return;
      var host = b.closest('[data-name^="Widget/"],[data-name^="Popup/"],[data-name="Table Wrap"]');
      if (!host) return;
      var hb = host.getBoundingClientRect(), bb = b.getBoundingClientRect();
      var room = (hb.bottom - bb.top) / (st.S || 1) - 4;
      if (b.scrollHeight > room + 2 && room > 40) { b.style.maxHeight = room + 'px'; b.classList.add('ov-scroll'); }
    });
    /* 시스템 목록 — 끝까지 내리면 다시 위로 천천히 돈다 */
    all(root, '.ov-scroll').forEach(function (b) {
      if (b.closest('[data-name="Event Log"]')) return;
      var dir = 1, hold = 0;
      st.timers.push(setInterval(function () {
        if (idle() || editing() || b.matches(':hover')) return;
        if (hold > 0) { hold--; return; }
        var max = b.scrollHeight - b.clientHeight;
        if (max <= 0) return;
        b.scrollTop = clamp(b.scrollTop + dir * 28, 0, max);
        if (b.scrollTop >= max - 1 || b.scrollTop <= 0) { dir = -dir; hold = 4; }
      }, 2600));
    });
  }

  /* ══════════════════ 5. 라이브 차트 — Figma 선 · 면적 그림을 인라인으로 흐르게 ══════════════════ */
  var svgCache = {};
  function fetchSvg(src) {
    if (!svgCache[src]) svgCache[src] = fetch(src).then(function (r) { return r.ok ? r.text() : ''; }).catch(function () { return ''; });
    return svgCache[src];
  }
  /* 경로 → 점(M L H V C Q, 절대 좌표만) */
  function parsePts(d) {
    var t = d.replace(/([MLHVCQZmlhvcqz])/g, ' $1 ').replace(/(\d)-/g, '$1 -').trim().split(/[\s,]+/), p = [], i = 0, x = 0, y = 0, c = 'M';
    while (i < t.length) {
      if (/^[A-Za-z]$/.test(t[i])) { c = t[i]; i++; if (c === 'Z' || c === 'z') continue; }
      if (/^[a-z]$/.test(c)) return null;
      if (c === 'M' || c === 'L') { x = +t[i]; y = +t[i + 1]; i += 2; }
      else if (c === 'H') { x = +t[i]; i += 1; }
      else if (c === 'V') { y = +t[i]; i += 1; }
      else if (c === 'C') { x = +t[i + 4]; y = +t[i + 5]; i += 6; }
      else if (c === 'Q') { x = +t[i + 2]; y = +t[i + 3]; i += 4; }
      else { i++; continue; }
      if (isNaN(x) || isNaN(y)) return null;
      p.push([x, y]);
    }
    return p;
  }
  /* 차트 묶음 — 그 안의 svg 그림마다: 선(stroke · 열린 경로 · 점 5개 이상) + 같은 그림 안의 짝 면적(채운 닫힌 경로) */
  function chartGroups(root) {
    var sel = '[data-name="Line Chart"],[data-name="Chart"],[data-name^="Widget/Transactions by"],[data-name="Widget/Key TP Monitoring"],[data-name="Widget/TPS by Channel Group"]';
    var out = [];
    all(root, sel).forEach(function (g) { if (!g.parentNode.closest(sel) && out.indexOf(g) < 0) out.push(g); });
    return out;
  }
  function installLiveCharts(root, st) {
    st.lines = [];
    chartGroups(root).forEach(function (g) {
      var imgs = all(g, 'img').filter(function (im) { return /\.svg(\?|$)/.test(im.getAttribute('src') || ''); });
      imgs.forEach(function (im) {
        fetchSvg(im.src).then(function (txt) {
          if (!root.__ov || !txt || !im.parentNode) return;
          var doc = new DOMParser().parseFromString(txt, 'image/svg+xml');
          var lines = [], areas = [];
          Array.prototype.forEach.call(doc.querySelectorAll('path'), function (pa) {
            var d = pa.getAttribute('d') || '', pts = parsePts(d);
            if (!pts || pts.length < 5) return;
            var stroke = pa.getAttribute('stroke'), fill = pa.getAttribute('fill');
            if (stroke && stroke !== 'none' && !/Z/i.test(d)) lines.push({ pa: pa, pts: pts });
            else if (fill && fill !== 'none' && /Z/i.test(d)) areas.push({ pa: pa, pts: pts });
          });
          if (!lines.length) return;
          var svg = document.importNode(doc.documentElement, true);
          svg.setAttribute('class', (im.getAttribute('class') || '') + ' ov-line');
          svg.style.cssText = im.style.cssText;
          im.parentNode.replaceChild(svg, im);
          var P = svg.querySelectorAll('path'), idx = Array.prototype.indexOf.bind(doc.querySelectorAll('path'));
          lines.forEach(function (L, li) {
            var A = areas[li] || (lines.length === 1 ? areas[0] : null);
            var f = makeFlow(svg, P[idx(L.pa)], L.pts, A ? P[idx(A.pa)] : null, A ? A.pts : null, g);
            if (f) { st.lines.push(f); bindLegendValue(root, st, f); }
          });
        });
      });
    });
    st.timers.push(setInterval(function () {
      if (idle() || editing()) return;
      (st.lines || []).forEach(function (f) { if (f) f.step(); });
    }, 2200));
  }
  /* 한 선의 흐름 — svg 좌표 그대로. 면적은 선 아래로 같은 깊이의 띠 */
  function makeFlow(svg, path, pts, apath, apts, group) {
    var order = pts.map(function (p, i) { return i; }).sort(function (a, b) { return pts[a][0] - pts[b][0]; });
    var xs = order.map(function (i) { return pts[i][0]; }), ys = order.map(function (i) { return pts[i][1]; });
    var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys), span = Math.max(4, y1 - y0);
    var vb = (svg.getAttribute('viewBox') || '0 0 100 100').split(/[\s,]+/).map(Number);
    var lo = Math.max(vb[1], y0 - span * 0.4), hi = Math.min(vb[1] + vb[3], y1 + span * 0.4);
    var depth = apts ? Math.max(4, Math.max.apply(null, apts.map(function (p) { return p[1]; })) - y1) : 0;
    function render(Y) {
      path.setAttribute('d', Y.map(function (y, i) { return (i ? 'L' : 'M') + xs[i].toFixed(2) + ' ' + y.toFixed(2); }).join(' '));
      if (apath) {
        var top = Y.map(function (y, i) { return xs[i].toFixed(2) + ' ' + y.toFixed(2); });
        var bot = Y.slice().reverse().map(function (y, j) { var i = Y.length - 1 - j; return xs[i].toFixed(2) + ' ' + (y + depth).toFixed(2); });
        apath.setAttribute('d', 'M' + top.join(' L') + ' L' + bot.join(' L') + ' Z');
      }
    }
    var cur = ys.slice(), raf = 0;
    render(cur);
    var f = {
      svg: svg, color: path.getAttribute('stroke') || '', group: group, vb: vb,
      lastFrac: function () { return 1 - (cur[cur.length - 1] - y0) / (span || 1); },
      /* 툴팁용 — svg x 에서 지금 선의 y(선형 보간), 그리고 x 범위 */
      yAtX: function (sx) {
        if (sx <= xs[0]) return cur[0];
        for (var i = 1; i < xs.length; i++) if (sx <= xs[i]) { var k = (sx - xs[i - 1]) / ((xs[i] - xs[i - 1]) || 1); return cur[i - 1] + (cur[i] - cur[i - 1]) * k; }
        return cur[cur.length - 1];
      },
      xRange: function () { return [xs[0], xs[xs.length - 1]]; },
      step: function () {
        var nxt = cur.slice(1), v = cur[cur.length - 1];
        v = clamp(v + rnd(-span * 0.25, span * 0.25) + ((y0 + y1) / 2 - v) * 0.18, lo, hi);
        nxt.push(v);
        var from = cur.slice(), t0 = performance.now(), D = 700;
        cancelAnimationFrame(raf);
        var anim = function (tt) {
          var k = Math.min(1, (tt - t0) / D), e = 1 - Math.pow(1 - k, 3);
          render(from.map(function (y, i) { return y + (nxt[i] - y) * e; }));
          if (k < 1) raf = requestAnimationFrame(anim);
        };
        raf = requestAnimationFrame(anim);
        cur = nxt;
        if (f.onStep) f.onStep();
      },
      dispose: function () { cancelAnimationFrame(raf); },
    };
    return f;
  }
  function rgbOf(c) {
    var m = /^#([0-9a-f]{6})$/i.exec(c || '');
    if (m) { var n = parseInt(m[1], 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
    m = /rgba?\(([^)]+)\)/.exec(c || '');
    return m ? m[1].split(',').slice(0, 3).map(Number) : null;
  }
  function bindLegendValue(root, st, f) {
    var c0 = rgbOf(f.color);
    if (!c0) return;
    var scope = f.group.closest('[data-name^="Widget/"]') || f.group.parentNode;
    var items = all(scope, '[data-name^="Item/"]').filter(function (it) { var p = one(it, 'p'); return p && /^[\d,.]+$/.test(p.textContent.trim()); });
    if (!items.length) {
      /* TP 화면 — 범례 묶음이 차트 옆 형제 */
      items = all(f.group, '[data-name^="Item/"]').filter(function (it) { var p = one(it, 'p'); return p && /^[\d,.]+$/.test(p.textContent.trim()); });
    }
    var best = null, bd = 1e9;
    items.forEach(function (it) {
      var key = one(it, '[data-name="Key"]') || one(it, '[data-name="Dot"]');
      if (!key) return;
      var c1 = rgbOf(getComputedStyle(key).backgroundColor) || rgbOf(getComputedStyle(key).fill);
      if (!c1) { var im = key.tagName === 'IMG' ? key : one(key, 'img'); if (!im) return; }
      if (!c1) return;
      var dd = Math.abs(c0[0] - c1[0]) + Math.abs(c0[1] - c1[1]) + Math.abs(c0[2] - c1[2]);
      if (dd < bd) { bd = dd; best = it; }
    });
    if (!best || bd > 160) return;
    f.item = best;
    var p = one(best, 'p'), base = +p.textContent.replace(/,/g, '') || 0, dec = (p.textContent.split('.')[1] || '').length;
    f.onStep = function () {
      var k = 0.88 + f.lastFrac() * 0.24;
      var v = base * k;
      write(p, dec ? v.toFixed(dec) : comma(v));
    };
  }
  /* 숫자 지표 — KPI · 카드 · 활성 트랜잭션 · 유량 · 동접자 값이 실시간처럼 조금씩 바뀐다 */
  function installJitter(root, st) {
    var sel = ['[data-name="KPI Group"] [data-name="Value Box"] p', '[data-name="KPI Group"] p[data-name="Value"]',
      '[data-name="Widget/EtoE"] [data-name^="Card/"] p:not([data-name="Label"])', '[data-name^="Card Row"] [data-name^="Metric/"] p',
      '[data-name="Widget/Active Transactions"] p[data-name="Value"]', '[data-name="Widget/Channel KPIs"] p[data-name="Value"]',
      '[data-name="Widget/Bank No-Response"] p[data-name="Value"]', '[data-name="Metric/UMS Delivery"] p[data-name="Value"]'];
    var ps = [];
    sel.forEach(function (s) { all(root, s).forEach(function (p) { if (ps.indexOf(p) < 0 && /^[\d,.]+(\(.*\))?%?$/.test(p.textContent.trim())) ps.push(p); }); });
    ps.forEach(function (p) { p.__ovBase = p.textContent.trim(); });
    st.timers.push(setInterval(function () {
      if (idle() || editing()) return;
      for (var i = 0; i < Math.max(2, ps.length / 5); i++) {
        var p = ps[Math.floor(Math.random() * ps.length)];
        if (!p || claimed(p)) continue;
        var s = p.__ovBase, m = /^([\d,]+)(\.\d+)?(.*)$/.exec(s);
        if (!m) continue;
        var n = +(m[1].replace(/,/g, '') + (m[2] || '')), dec = m[2] ? m[2].length - 1 : 0;
        if (n === 0 && !dec) continue;
        var v = n * (1 + rnd(-0.04, 0.04));
        if (!dec && n < 20) v = Math.max(0, Math.round(n + rnd(-1.2, 1.2)));
        var txt = (dec ? v.toFixed(dec) : comma(v)) + (m[3] || '');
        if (write(p, txt)) { p.classList.remove('ov-tick'); void p.offsetWidth; p.classList.add('ov-tick'); }
      }
    }, 2600));
    /* 막대(등급별 이벤트 비교) — 금일 막대가 숨쉬듯 */
    all(root, '[data-name="Line Chart"] [data-name="Graphic"] > [data-name="Part"]').forEach(function (p, i) {
      var b = kids(p)[1];
      if (!b) return;
      b.style.transformOrigin = '50% 100%';
      b.style.transition = 'scale .9s ' + EASE;
      st.timers.push(setInterval(function () { if (!idle() && !editing()) b.style.scale = '1 ' + rnd(0.86, 1.12).toFixed(3); }, 3000 + i * 250));
    });
  }

  /* ══════════════════ 6. 클릭 · 이동 ══════════════════ */
  var NAV_TO = { 'Nav Item/Situation Board': 'main', 'Nav Item/Application': 'was', 'Nav Item/Infrastructure by Part': 'system', 'Nav Item/Operations Management': 'event' };
  function installNav(root, st) {
    all(root, '[data-name="Nav"] [data-name^="Nav Item/"]').forEach(function (n) { var to = NAV_TO[nm(n)]; if (to) clickable(n, function () { goto(to === st.scene && to === 'main' ? 'overview2' : to); }); });
    all(root, '[data-name="Logo Group"]').forEach(function (l) { clickable(l, function () { goto('main'); }); });
    /* 범례 — 누르면 그 선을 껐다 켠다 */
    all(root, '[data-name="Legend"] [data-name^="Item/"]').forEach(function (it) {
      clickable(it, function () {
        it.classList.toggle('ov-mute');
        var key = one(it, '[data-name="Key"]') || one(it, '[data-name="Dot"]');
        var c1 = key && rgbOf(getComputedStyle(key).backgroundColor);
        if (!c1) return;
        var scope = it.closest('[data-name^="Widget/"]') || it.closest('[data-name="Line Chart"]') || it.parentNode.parentNode;
        (st.lines || []).forEach(function (f) {
          if (!f || !scope.contains(f.svg)) return;
          var c0 = rgbOf(f.color); if (!c0) return;
          if (Math.abs(c0[0] - c1[0]) + Math.abs(c0[1] - c1[1]) + Math.abs(c0[2] - c1[2]) < 90) { f.svg.classList.toggle('ov-mute', it.classList.contains('ov-mute')); if (f.asvg) f.asvg.classList.toggle('ov-mute', it.classList.contains('ov-mute')); }
        });
      });
    });
    /* 3D 노드 · 서버 큐브 · 네트워크 장비 → 시스템 상세 */
    all(root, '[data-name^="Node/"],[data-name^="Server Cube"],[data-name="Network Device"],[data-name="Node Group/Level 1"] > [data-name^="Item/"],[data-name="Node Group/Level 2"] > [data-name^="Item/"]').forEach(function (n) {
      clickable(n, function () { goto(st.scene === 'detail' ? 'detail' : 'detail'); });
    });
    /* 이벤트 줄 → 이벤트 현황 */
    all(root, '[data-name="Event Log"] [data-name="Body"] > [data-name^="Row/"]').forEach(function (r) { if (st.scene !== 'event') clickable(r, function () { goto('event'); }); });
    /* 팝업 닫기(X) — 단추 글자로 된 닫기 · 취소 · 확인은 installControls */
    all(root, '[data-name="Button/Close"]').forEach(function (b) {
      clickable(b, function () { var pop = b.closest('[data-name^="Popup/"]'); if (pop) closePopup(root, st, pop); });
    });
    all(root, '[data-name="Button/Settings"]').forEach(function (b) { clickable(b, function () { goto('waspopup'); }); });
    /* 탭 · 필터 · 저장 · 추가 등 */
    all(root, '[data-name^="Tab/"]').forEach(function (t) {
      clickable(t, function () { all(t.parentNode, '[data-name^="Tab/"]').forEach(function (x) { x.classList.toggle('ov-on', x === t); }); });
    });
    all(root, '[data-name="Button/Save"],[data-name="Button/Add"],[data-name="Button/Delete"],[data-name="Button/Check All"],[data-name="Button/Uncheck All"],[data-name="Button/Ack"]').forEach(function (b) {
      if (b.closest('[data-name="Event Log"]')) return;
      clickable(b, function () {
        var n = nm(b).replace('Button/', '');
        if (n === 'Check All' || n === 'Uncheck All') { var pop = b.closest('[data-name^="Popup/"]') || root; all(pop, '[data-name="Body"] > [data-name^="Row/"]').forEach(function (r) { r.style.opacity = n === 'Uncheck All' ? '.55' : ''; }); }
        toast(st, { Save: '저장했습니다', Add: '추가했습니다', Delete: '삭제했습니다', 'Check All': '전체 선택', 'Uncheck All': '전체 선택 해제', Select: '조회했습니다', Ack: '확인 처리했습니다' }[n] || n);
      });
    });
    /* 페이지 — WAS 카드판 */
    var pg = all(root, '[data-name="Pagination"] [data-name^="Page/"]');
    pg.forEach(function (p, i) {
      if (i === 0) p.classList.add('ov-cur');
      clickable(p, function () {
        pg.forEach(function (x) { x.classList.toggle('ov-cur', x === p); });
        var cards = all(root, '[data-name^="Card Row"] [data-name^="Metric/"] p');
        cards.forEach(function (c) { if (c.__ovBase == null) c.__ovBase = c.textContent.trim(); var m = /^([\d,]+)(\.\d+)?$/.exec(c.__ovBase); if (!m) return; var n = +(m[1].replace(/,/g, '') + (m[2] || '')); var v = n * (0.7 + ((i * 7 + c.textContent.length) % 7) / 10); write(c, m[2] ? v.toFixed(m[2].length - 1) : comma(v)); });
        all(root, '[data-name^="Card Row"]').forEach(function (r) { r.style.animation = 'none'; void r.offsetWidth; r.style.animation = 'ovIn .45s ' + EASE + ' both'; });
      });
    });
  }

  /* ══════════════════ 6-2. 실제 조작 — 단추 · 셀렉트 · 입력 · 체크 · 탭 · 옮기기 · 행 선택 ══════════════════
     레이어 이름이 'Key Box · Value Box · Metric · Graphic' 같은 그림 이름이라 모양(글자 · 크기 · 배경)으로 알아본다. */
  var ACT_RX = /^(저장|닫기|추가|삭제|전체체크|전체체크 해지|확인|취소|ACK|선택|그룹설정|페이지 설정)$/;
  function hasFill(e) {
    var cs = getComputedStyle(e);
    if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.backgroundImage !== 'none' || parseFloat(cs.borderTopWidth)) return true;
    return kids(e).some(function (c) { if (c.tagName !== 'DIV' || c.getAttribute('data-name')) return false; var s = getComputedStyle(c); return s.backgroundColor !== 'rgba(0, 0, 0, 0)' || s.backgroundImage !== 'none'; });
  }
  function popEls(pop) { return boxes(pop); }
  function closePopup(root, st, pop) {
    var els = popEls(pop);
    els.forEach(function (e) { e.style.transition = 'opacity .28s ease,scale .3s ' + EASE; e.style.opacity = '0'; e.style.scale = '.985'; });
    if (st.scene === 'waspopup') { setTimeout(function () { goto('was'); }, 260); return; }
    setTimeout(function () { els.forEach(function (e) { e.style.visibility = 'hidden'; e.style.pointerEvents = 'none'; }); }, 290);
    pop.__closed = true;
  }
  function openPopup(root, st, pop) {
    if (!pop) return;
    var els = popEls(pop);
    pop.__closed = false;
    els.forEach(function (e) { e.style.transition = 'none'; e.style.visibility = ''; e.style.pointerEvents = ''; e.style.opacity = '0'; e.style.scale = '.985'; });
    void document.body.offsetWidth;
    els.forEach(function (e) { e.style.transition = 'opacity .3s ease,scale .35s ' + EASE; e.style.opacity = ''; e.style.scale = ''; });
  }
  function flash(p) { if (!p) return; p.classList.remove('ov-tick'); void p.offsetWidth; p.classList.add('ov-tick'); }
  function setText(p, s) { if (p && write(p, s)) flash(p); }
  /* 글자 이름표 → 같은 칸의 값 글자 */
  function kvP(scope, label) {
    var lp = all(scope, 'p').filter(function (p) { return p.textContent.trim() === label; })[0];
    if (!lp) return null;
    for (var e = lp.parentElement; e && e !== scope; e = e.parentElement) {
      var ps = all(e, 'p').filter(function (p) { return p !== lp; });
      if (ps.length) return ps[ps.length - 1];
    }
    return null;
  }
  function labelFor(el, root) {
    for (var e = el, k = 0; k < 3 && e && e !== root; k++, e = e.parentElement) {
      for (var s = e.previousElementSibling; s; s = s.previousElementSibling) {
        var p = s.tagName === 'P' ? s : one(s, 'p');
        if (p && p.textContent.trim()) return p.textContent.trim();
      }
    }
    return '';
  }
  function frameXY(st, el) {
    var r = el.getBoundingClientRect(), f = st.frame.getBoundingClientRect(), S = st.S || 1;
    return { x: (r.left - f.left) / S, y: (r.top - f.top) / S, w: r.width / S, h: r.height / S };
  }
  var DD_OPTS = {
    '구분': ['ALL', 'AP', 'MMS', 'BAT'],
    '대그룹': ['ALL', '채널계', '정보계', '대외계'],
    '중그룹': ['ALL', '운영', '개발', '테스트', 'DR', '최소중단'],
  };
  function installControls(root, st) {
    var popups = all(root, '[data-name^="Popup/"]');
    /* 원본에 열린 채 그려진 드롭다운 목록(장비 선택 · 중그룹)은 닫아 두고 진짜 목록으로 연다 */
    popups.forEach(function (pop) { all(pop, '[data-name="List"]').forEach(function (l) { if (all(l, '[data-name="Text Wrap"] p').some(function (p) { return p.textContent.trim() === '최소중단'; })) l.style.display = 'none'; }); });

    /* ── 셀렉트(드롭다운) — 글자 + 오른쪽 아이콘이 든 입력 상자 ── */
    var menu = document.createElement('div');
    menu.className = 'ov-ddmenu';
    st.frame.appendChild(menu);
    var openDd = null;
    function closeMenu() { if (!openDd) return; openDd.classList.remove('ov-open'); openDd = null; menu.classList.remove('on'); }
    st.closeMenu = closeMenu;
    function openMenu(dd, opts, onPick) {
      if (openDd === dd) { closeMenu(); return; }
      closeMenu();
      var lab = one(dd, ':scope > p'), cur = lab ? lab.textContent.trim() : '';
      menu.innerHTML = opts.map(function (o) { return '<button type="button"' + (o === cur ? ' class="cur"' : '') + '>' + esc(o) + '</button>'; }).join('');
      var r = frameXY(st, dd);
      menu.style.left = r.x + 'px'; menu.style.top = (r.y + r.h + 2) + 'px'; menu.style.width = r.w + 'px';
      menu.__pick = function (o) { if (lab) setText(lab, o); closeMenu(); onPick(o); };
      openDd = dd; dd.classList.add('ov-open');
      void menu.offsetWidth; menu.classList.add('on');
    }
    menu.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    menu.addEventListener('click', function (e) { var b = e.target.closest('button'); e.stopPropagation(); if (b && menu.__pick) menu.__pick(b.textContent); });
    st.onMenuDoc = function (e) { if (openDd && !openDd.contains(e.target) && !menu.contains(e.target)) closeMenu(); };
    document.addEventListener('pointerdown', st.onMenuDoc, true);
    st.onMenuKey = function (e) { if (e.key === 'Escape') closeMenu(); };
    document.addEventListener('keydown', st.onMenuKey);

    var dds = all(root, '[data-name]').filter(function (e) {
      if (/^(Button|Count|Nav Item)/.test(nm(e))) return false;
      var p = one(e, ':scope > p'), ic = one(e, ':scope > [data-name="Icon"]');
      if (!p || !ic) return false;
      var h = e.offsetHeight, w = e.offsetWidth;
      if (h < 18 || h > 32 || w < 70 || w > 230) return false;
      var r = e.getBoundingClientRect(), ri = ic.getBoundingClientRect();
      return ri.right > r.right - 34 && ri.left > r.left + r.width / 2 && hasFill(e);
    });
    dds.forEach(function (dd) {
      var lab = one(dd, ':scope > p'), v0 = lab.textContent.trim(), key = labelFor(dd, root);
      var opts = /^\d+페이지$/.test(v0) ? ['1페이지', '2페이지', '3페이지', '4페이지', '5페이지'] : (DD_OPTS[key] || ['ALL', v0].filter(function (x, i, a) { return a.indexOf(x) === i; }));
      dd.classList.add('ov-dd');
      clickable(dd, function () {
        openMenu(dd, opts, function (o) {
          var log = dd.closest('[data-name="Event Log"]');
          if (log) { (log.__flt = log.__flt || {}).cat = o; var n = applyLogFilter(log); toast(st, '구분 ' + o + ' — ' + n + '건'); return; }
          var pop = dd.closest('[data-name^="Popup/"]');
          if (pop && key === '대그룹') { var n2 = filterPopRows(pop); toast(st, '대그룹 ' + o + ' — ' + n2 + '대'); return; }
          toast(st, (key && !/페이지/.test(o) ? key + ' ' : '') + o + ' 선택');
        });
      });
    });
    /* TP 서버선택 — 같은 목록으로 */
    all(root, '[data-name="Button/Server Select"]').forEach(function (b) {
      b.classList.add('ov-btn');
      clickable(b, function () {
        var opts = ['전체 서버', 'TP01', 'TP02', 'TP03', 'TP04', 'TP05', 'TP06', 'TP07', 'TP08'];
        if (openDd === b) { closeMenu(); return; }
        closeMenu();
        menu.innerHTML = opts.map(function (o) { return '<button type="button"' + (o === (b.__sel || '전체 서버') ? ' class="cur"' : '') + '>' + esc(o) + '</button>'; }).join('');
        var r = frameXY(st, b);
        menu.style.width = '120px'; menu.style.left = (r.x + r.w - 120) + 'px'; menu.style.top = (r.y + r.h + 2) + 'px';
        menu.__pick = function (o) { b.__sel = o; closeMenu(); toast(st, '서버 ' + o + ' 기준으로 표시합니다'); (st.lines || []).forEach(function (f) { if (f) f.step(); }); };
        openDd = b; void menu.offsetWidth; menu.classList.add('on');
      });
    });

    /* ── 입력칸 — 검색 · 장비명. 진짜 <input> 을 상자 안에 ── */
    function filterPopRows(pop) {
      var q = ((pop.__q || '') + '').trim().toLowerCase();
      var majDd = dds.filter(function (d) { return pop.contains(d) && labelFor(d, root) === '대그룹'; })[0];
      var maj = majDd ? one(majDd, ':scope > p').textContent.trim() : 'ALL';
      var n = 0;
      all(pop, '[data-name="Body"] > [data-name^="Row/"]').forEach(function (r) {
        var c0 = cellP(r, 0);
        var ok = (maj === 'ALL' || (c0 && c0.textContent.trim() === maj)) && (!q || r.textContent.toLowerCase().indexOf(q) >= 0);
        r.style.display = ok ? '' : 'none';
        if (ok) n++;
      });
      return n;
    }
    var fields = all(root, '[data-name="Search Field"] > [data-name="Shape"]');
    all(root, '[data-name="Graphic"],[data-name="Shape"]').forEach(function (e) {
      if (fields.indexOf(e) >= 0 || one(e, 'p')) return;
      var h = e.offsetHeight, w = e.offsetWidth;
      if (h < 18 || h > 32 || w < 90 || w > 240 || !hasFill(e)) return;
      var prev = e.previousElementSibling;
      if (prev && nm(prev) === 'Metric' && one(prev, '[data-name="Shape"]') && one(prev, 'p')) fields.push(e);
    });
    fields.forEach(function (box) {
      var isSearch = nm(box.parentElement) === 'Search Field';
      var host = isSearch ? box.parentElement : box;
      host.classList.add('ov-field');
      var inp = document.createElement('input');
      inp.type = 'text';
      inp.className = 'ov-input';
      inp.placeholder = isSearch ? '검색어' : (labelFor(box, root) || '') + ' 입력';
      inp.spellcheck = false;
      if (getComputedStyle(box).position === 'static') box.style.position = 'relative';
      var icL = one(box, '[data-name="Icon"]');
      if (icL && icL.getBoundingClientRect().left < box.getBoundingClientRect().left + 20) inp.style.paddingLeft = '28px';
      box.appendChild(inp);
      var log = box.closest('[data-name="Event Log"]'), pop = box.closest('[data-name^="Popup/"]');
      var tmr = 0;
      function run(say) {
        if (log) { (log.__flt = log.__flt || {}).q = inp.value; var n = applyLogFilter(log); if (say) toast(st, (inp.value ? '"' + inp.value + '" ' : '') + n + '건 조회'); }
        else if (pop) { pop.__q = inp.value; var n2 = filterPopRows(pop); if (say) toast(st, n2 + '대 조회'); }
      }
      inp.__run = run;
      ['keydown', 'keyup', 'keypress'].forEach(function (t) { inp.addEventListener(t, function (e) { e.stopPropagation(); if (t === 'keydown' && e.key === 'Enter') run(true); if (t === 'keydown' && e.key === 'Escape') { inp.value = ''; run(false); inp.blur(); } }); });
      inp.addEventListener('input', function () { clearTimeout(tmr); tmr = setTimeout(function () { run(false); }, 140); });
      inp.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
      host.__input = inp;
    });
    /* 검색 아이콘 — 이벤트 화면에서는 장비 선택 창을 연다, 그 밖에는 검색 실행 */
    all(root, '[data-name="Search Field"] > [data-name="Icon"]').forEach(function (ic) {
      ic.classList.add('ov-btn');
      clickable(ic, function () {
        var dev = one(root, '[data-name="Popup/Device Select"]');
        if (st.scene === 'event' && dev) { openPopup(root, st, dev); return; }
        var inp = ic.parentElement.__input; if (inp) { inp.focus(); inp.__run(true); }
      });
    });

    /* ── 체크박스 — 팝업 표 첫 칸의 16px 상자. 꺼진 상태는 안쪽을 상자 바탕으로 덮는다(펴지며 체크가 나타남) ── */
    all(root, '[data-name^="Popup/"] [data-name="Body"] > [data-name^="Row/"] > [data-name^="Td/"]:first-child > [data-name="Icon"]').forEach(function (ic) {
      var im = one(ic, 'img');
      if (!im || ic.offsetWidth > 20) return;
      var cover = document.createElement('i');
      cover.className = 'ov-chkoff' + (/10-2/.test(im.getAttribute('src') || '') ? ' k10' : '');
      ic.style.position = ic.style.position || 'relative';
      ic.appendChild(cover);
      ic.classList.add('ov-chk');
      ic.__on = true;
      ic.__set = function (on) { ic.__on = on; ic.classList.toggle('off', !on); };
      clickable(ic, function () { ic.__set(!ic.__on); });
    });
    function checks(scope) { return all(scope, '.ov-chk'); }

    /* ── 줄 선택 — 팝업 표 · 목록 줄은 눌러서 고른다 ── */
    function selectable(rows, multi) {
      rows.forEach(function (r) {
        r.classList.add('ov-row');
        clickable(r, function (e) {
          if (!multi && !(e && (e.ctrlKey || e.metaKey))) rows.forEach(function (x) { if (x !== r) x.classList.remove('ov-sel'); });
          r.classList.toggle('ov-sel');
        });
      });
    }
    popups.forEach(function (pop) {
      var bodyRows = all(pop, '[data-name="Body"] > [data-name^="Row/"]');
      if (bodyRows.length) selectable(bodyRows, false);
      /* 오른쪽 선택 목록(그룹 선택) */
      var lists = all(pop, '[data-name="Content"] > [data-name="Content"]');
      lists.forEach(function (c) { selectable(kids(c), false); });
    });

    /* ── 그룹 선택 옮기기 — ▶ 고른 그룹을 오른쪽으로, ◀ 오른쪽에서 뺀다 ── */
    all(root, '[data-name="Transfer Arrows"]').forEach(function (ta) {
      var pop = ta.closest('[data-name^="Popup/"]');
      var list = one(pop, '[data-name="Content"] > [data-name="Content"]');
      var cnt = kvP(pop, '선택');
      if (!list) return;
      var tpl = kids(list)[0];
      ta.classList.add('ov-arrows');
      ['up', 'dn'].forEach(function (k) {
        var hit = document.createElement('i');
        hit.className = 'ov-arrow-hit ' + k;
        ta.appendChild(hit);
        hit.addEventListener('click', function (e) {
          if (editing()) return;
          e.stopPropagation();
          var filled = kids(list).filter(function (r) { return one(r, 'p'); });
          if (k === 'up') {
            var picks = all(pop, '[data-name="Body"] > [data-name^="Row/"].ov-sel');
            if (!picks.length) { toast(st, '왼쪽에서 그룹을 먼저 고르세요'); return; }
            picks.forEach(function (src) {
              var maj = cellP(src, 0), mid = cellP(src, 1);
              var names = kids(list).filter(function (r) { return one(r, 'p'); }).map(function (r) { var ps = all(r, 'p'); return ps[2] && ps[2].textContent.trim(); });
              if (mid && names.indexOf(mid.textContent.trim()) >= 0) return;
              var empty = kids(list).filter(function (r) { return !one(r, 'p'); })[0];
              if (!empty) { toast(st, '그룹 선택은 최대 40개입니다'); return; }
              var nr = tpl.cloneNode(true);
              var ps = all(nr, 'p');
              var vals = [String(kids(list).filter(function (r) { return one(r, 'p'); }).length + 1), maj ? maj.textContent.trim() : '', mid ? mid.textContent.trim() : ''];
              ps.forEach(function (p, i) { if (vals[i] != null) { p.textContent = vals[i]; p.__ovLast = vals[i]; } });
              nr.className = empty.className; nr.classList.add('ov-row');
              nr.style.backgroundColor = getComputedStyle(empty).backgroundColor;
              list.replaceChild(nr, empty);
              nr.classList.remove('ov-sel');
              selectable([nr], false);
              nr.classList.add('ov-new');
              src.classList.remove('ov-sel');
            });
          } else {
            var rm = kids(list).filter(function (r) { return r.classList.contains('ov-sel') && one(r, 'p'); });
            if (!rm.length) { toast(st, '오른쪽에서 뺄 그룹을 고르세요'); return; }
            rm.forEach(function (r) { var em = kids(list).filter(function (x) { return !one(x, 'p'); })[0]; var blank = (em || r).cloneNode(true); all(blank, 'p').forEach(function (p) { p.remove(); }); blank.classList.remove('ov-sel', 'ov-new'); list.appendChild(blank); r.remove(); });
            kids(list).filter(function (r) { return one(r, 'p'); }).forEach(function (r, i) { var p = all(r, 'p')[0]; if (p) { p.textContent = String(i + 1); p.__ovLast = p.textContent; } });
            /* 줄무늬 다시 */
            var c1 = getComputedStyle(kids(list)[0]).backgroundColor;
            kids(list).forEach(function (r, i) { r.style.backgroundColor = ''; });
          }
          if (cnt) setText(cnt, String(kids(list).filter(function (r) { return one(r, 'p'); }).length));
        });
      });
    });

    /* ── 탭(그룹설정 | 페이지 설정) — 바탕 그림 class 를 맞바꿔 켠 탭이 바뀐다(라이트 시트도 같이 따라온다) ── */
    all(root, '[data-name="Field/Group Settings"]').forEach(function (fld) {
      var a = one(fld, ':scope > [data-name="Key Box"]'), b = one(fld, ':scope > [data-name="Value Box"]');
      if (!a || !b) return;
      var bgA = kids(a).filter(function (c) { return c.tagName === 'DIV' && !c.getAttribute('data-name'); })[0];
      var bgB = kids(b).filter(function (c) { return c.tagName === 'DIV' && !c.getAttribute('data-name'); })[0];
      if (!bgA || !bgB) return;
      var on = a;
      [a, b].forEach(function (t) {
        t.classList.add('ov-btn', 'ov-tab');
        clickable(t, function () {
          if (on === t) return;
          var ca = bgA.className; bgA.className = bgB.className; bgB.className = ca;
          on = t;
          [a, b].forEach(function (x) { x.classList.remove('ov-tabhit'); void x.offsetWidth; });
          t.classList.add('ov-tabhit');
          var pop = t.closest('[data-name^="Popup/"]');
          var body = pop && one(pop, '[data-name="Body"] > [data-name="Column"] > [data-name="Column"]') || (pop && one(pop, '[data-name="Body"] > [data-name="Column"]'));
          if (body) { body.style.animation = 'none'; void body.offsetWidth; body.style.animation = 'ovIn .4s ' + EASE + ' both'; }
        });
      });
    });

    /* ── 글자 단추 — 저장 · 닫기 · 추가 · 삭제 · 전체체크 · 확인 · 취소 · ACK · 선택 ── */
    all(root, 'p').forEach(function (p) {
      var t = p.textContent.trim();
      if (!ACT_RX.test(t) || /^(그룹설정|페이지 설정)$/.test(t)) return;
      var box = null;
      for (var e = p.parentElement; e && e !== root; e = e.parentElement) {
        var w = e.offsetWidth, h = e.offsetHeight;
        if (w >= 24 && w <= 240 && h >= 16 && h <= 40 && hasFill(e)) { box = e; break; }
        if (w > 240 || h > 40) break;
      }
      if (!box || all(box, 'p').length > 1) return;
      box.classList.add('ov-btn');
      if (box.classList.contains('ov-click')) return;
      var pop = box.closest('[data-name^="Popup/"]'), log = box.closest('[data-name="Event Log"]');
      clickable(box, function () {
        if (t === '닫기' || t === '취소') { if (pop) closePopup(root, st, pop); return; }
        if (t === '저장') { toast(st, '설정을 저장했습니다'); if (pop) closePopup(root, st, pop); return; }
        if (t === '확인') { var n = pop ? checks(pop).filter(function (c) { return c.__on && c.offsetParent !== null; }).length : 0; toast(st, '장비 ' + n + '대를 선택했습니다'); if (pop) closePopup(root, st, pop); return; }
        if (t === 'ACK') { var ack = pop && kvP(pop, 'Ack 처리자'), own = pop && kvP(pop, 'OWN 처리자'); if (ack) setText(ack, own ? own.textContent.trim() : '운영자'); toast(st, 'ACK 처리했습니다'); return; }
        if (t === '전체체크' || t === '전체체크 해지') { checks(pop || root).forEach(function (c) { c.__set(t === '전체체크'); }); toast(st, t === '전체체크' ? '전체 선택' : '전체 선택 해제'); return; }
        if (t === '선택') {
          if (log) { var inp = one(log, '.ov-input'); if (inp) { log.__flt = log.__flt || {}; log.__flt.q = inp.value; } var n2 = applyLogFilter(log); toast(st, n2 + '건 조회'); return; }
          if (pop) { var i2 = one(pop, '.ov-input'); pop.__q = i2 ? i2.value : ''; var n3 = filterPopRows(pop); toast(st, n3 + '대 조회'); }
          return;
        }
        var body = pop && one(pop, '[data-name="Body"] [data-name="Table"] > [data-name="Body"]');
        if (t === '추가' && body) {
          var rows = kids(body).filter(function (r) { return /^Row\//.test(nm(r)); });
          var last = rows[rows.length - 1];
          if (!last) return;
          var nr = last.cloneNode(true), n4 = rows.length;
          var ps = all(nr, 'p');
          if (ps[0]) { ps[0].textContent = 'PG-01' + p2(n4); ps[0].__ovLast = ps[0].textContent; }
          if (ps[1]) { ps[1].textContent = '새 페이지 ' + (n4 - 9 > 0 ? n4 - 9 : 1); ps[1].__ovLast = ps[1].textContent; }
          nr.style.backgroundColor = getComputedStyle(rows[rows.length - 2] || last).backgroundColor;
          nr.classList.remove('ov-sel');
          body.appendChild(nr);
          body.classList.add('ov-scroll');
          selectable([nr], false);
          var ic = one(nr, '.ov-chk');
          if (ic) { var cv = one(ic, '.ov-chkoff'); ic.__on = true; ic.__set = function (on) { ic.__on = on; ic.classList.toggle('off', !on); }; ic.classList.remove('off'); clickable(ic, function () { ic.__set(!ic.__on); }); void cv; }
          nr.classList.add('ov-new');
          body.scrollTop = body.scrollHeight;
          toast(st, '페이지를 추가했습니다');
          return;
        }
        if (t === '삭제' && body) {
          var sel = kids(body).filter(function (r) { return r.classList.contains('ov-sel'); });
          if (!sel.length) { toast(st, '삭제할 줄을 먼저 고르세요'); return; }
          sel.forEach(function (r) { r.style.transition = 'opacity .25s ease'; r.style.opacity = '0'; setTimeout(function () { r.remove(); }, 260); });
          toast(st, sel.length + '개 삭제했습니다');
        }
      });
    });

    /* ── 이벤트 화면 — 줄을 누르면 상세정보 창이 그 이벤트로 바뀐다 ── */
    var det = one(root, '[data-name="Popup/Server Detail"]');
    if (det && st.scene === 'event') {
      var POL = {
        DB: ['Oracle', 'TABLESPACE', 'DB_TS_USAGE', 'TS_WARNING'], WAS: ['Linux', 'JVM', 'WAS_HEAP_UTIL', 'HEAP_WARNING'], NW: ['Network', 'VPN', 'NW_VPN_LINK', 'LINK_FLAP'],
        API: ['Linux', 'API_GW', 'API_LATENCY', 'RESP_DELAY'], OS: ['Linux', 'CPU', 'OS_CPU_UTIL', 'CPU_WARNING'], APP: ['Linux', 'SESSION', 'APP_SESSION', 'SESSION_TREND'],
        UMS: ['Linux', 'UMS_QUEUE', 'UMS_SEND_WAIT', 'QUEUE_WARNING'], BATCH: ['Linux', 'BATCH_JOB', 'BATCH_JOB_END', 'JOB_DONE'], FEP: ['Linux', 'FEP', 'FEP_RESP_TIME', 'RESP_DELAY'],
      };
      var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      var title = one(det, '[data-name="Title"]');
      var gradeP = (function () { var g = kvP(det, '장애등급'); return g; })();
      var evMsg = [kvP(det, '이벤트 메시지'), kvP(det, '오리지널 메시지')];
      var showDetail = function (r) {
        var cs = kids(r);
        (function () {
          var v = cs.map(function (c, i) { var p = cellP(r, i); return p ? p.textContent.trim() : ''; });
          all(root, '.ov-row.ov-sel').forEach(function (x) { if (!x.closest('[data-name^="Popup/"]')) x.classList.remove('ov-sel'); });
          r.classList.add('ov-sel');
          var dev = v[3], tag = (/^\[([A-Z]+)\]/.exec(v[9]) || [])[1] || 'WAS', pol = POL[tag] || POL.WAS;
          var h = 0; for (var i = 0; i < dev.length; i++) h = (h * 31 + dev.charCodeAt(i)) % 997;
          var first = v[5].replace(' / ', ' '), last = v[6].replace(' / ', ' ');
          if (title) setText(title, dev + ' 상세정보');
          setText(kvP(det, '발생장비'), dev);
          setText(kvP(det, '최초발생시간'), first);
          setText(kvP(det, '마지막발생시간'), last);
          if (gradeP) setText(gradeP, v[0]);
          setText(kvP(det, '메시지그룹'), v[7]);
          setText(kvP(det, 'Application'), pol[0]);
          setText(kvP(det, 'Object'), pol[1]);
          setText(kvP(det, '정책명'), pol[2]);
          setText(kvP(det, '컨디션명'), pol[3]);
          setText(kvP(det, 'OWN 처리자'), v[4]);
          setText(kvP(det, 'Ack 처리자'), '-');
          setText(kvP(det, 'IP Address'), '10.20.' + (40 + h % 8) + '.' + (10 + h % 230));
          if (evMsg[0]) setText(evMsg[0], v[9]);
          if (evMsg[1]) { var d = new Date(last.replace(' ', 'T')); var stamp = isNaN(d) ? last : MON[d.getMonth()] + ' ' + p2(d.getDate()) + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds()); setText(evMsg[1], stamp + ' ' + dev + ' ' + pol[1].toLowerCase() + 'mon[' + (1000 + h * 7) + ']: ' + pol[3] + ' ' + v[9].replace(/^\[[A-Z]+\]\s*/, '')); }
          if (det.__closed) openPopup(root, st, det);
          else boxes(det).forEach(function (e) { e.classList.remove('ov-pulse'); void e.offsetWidth; e.classList.add('ov-pulse'); });
        })();
      };
      st.onRowClick = function (e) {
        if (editing()) return;
        var r = e.target.closest && e.target.closest('[data-name="Body"] > [data-name^="Row/"]');
        if (!r || !root.contains(r) || r.closest('[data-name^="Popup/"]') || kids(r).length < 10) return;
        showDetail(r);
      };
      root.addEventListener('click', st.onRowClick);
    }
  }

  /* ══════════════════ 6-3. 차트 툴팁 — 선 차트 위에서 십자선 · 점 · 시각 · 값 ══════════════════ */
  function installTooltip(root, st) {
    var tip = document.createElement('div'), vl = document.createElement('div');
    tip.className = 'ov-tip'; vl.className = 'ov-vline';
    st.frame.appendChild(vl); st.frame.appendChild(tip);
    var dots = [];
    /* 범례 점이 그림(svg)인 경우 — 그 색을 읽어 둔다(계열 이름 찾기용) */
    all(root, '[data-name="Legend"] [data-name="Key"] img, [data-name="Legend"] [data-name="Dot"] img').forEach(function (im) {
      fetchSvg(im.src).then(function (t) { var m = /fill="(#[0-9A-Fa-f]{6})"/.exec(t || ''); if (m) im.__fill = m[1]; });
    });
    /* 축 묶음 — 묶음(차트)마다 Y · X 축 글자의 값과 화면 위치. 0.8초 동안은 다시 재지 않는다 */
    function axesOf(g) {
      var now = performance.now();
      if (g.__ax && now - g.__ax.t < 800) return g.__ax;
      function grab(name, numeric) {
        return all(g, '[data-name="' + name + '"]').map(function (a) {
          var ps = all(a, 'p').map(function (p) {
            var t = p.textContent.trim(), r = p.getBoundingClientRect();
            if (!r.width) return null;
            if (numeric) { var n = +t.replace(/,/g, ''); return t === '' || isNaN(n) ? null : { v: n, c: r.top + r.height / 2, r: r }; }
            var m = /(\d\d):(\d\d)(?::(\d\d))?/.exec(t); return m ? { v: +m[1] * 3600 + +m[2] * 60 + +(m[3] || 0), c: r.left + r.width / 2, r: r } : null;
          }).filter(Boolean);
          if (ps.length < 2) return null;
          ps.sort(function (x, y) { return x.c - y.c; });
          return { ps: ps, top: Math.min.apply(null, ps.map(function (q) { return q.r.top; })), bottom: Math.max.apply(null, ps.map(function (q) { return q.r.bottom; })),
            left: Math.min.apply(null, ps.map(function (q) { return q.r.left; })), right: Math.max.apply(null, ps.map(function (q) { return q.r.right; })) };
        }).filter(Boolean);
      }
      g.__ax = { t: now, y: grab('Y Axis', true), x: grab('X Axis', false) };
      return g.__ax;
    }
    /* 선 하나가 놓인 차트 칸 — 가장 가까운 Y 축의 높이 × 선 그림의 폭 */
    function plotOf(f) {
      var r = f.svg.getBoundingClientRect(), ax = axesOf(f.group), cy = (r.top + r.bottom) / 2, best = null, bd = 1e9;
      ax.y.forEach(function (a) { var d = cy < a.top ? a.top - cy : cy > a.bottom ? cy - a.bottom : 0; d += Math.max(0, a.left - r.left) * 2; if (d < bd) { bd = d; best = a; } });
      if (!best || bd > 60) return { left: r.left, right: r.right, top: r.top - 16, bottom: r.bottom + 16, y: null, x: null, r: r };
      var xb = null, xd = 1e9;
      ax.x.forEach(function (a) { if (a.top < best.top) return; var d = a.top - best.bottom + Math.abs((a.left + a.right) / 2 - (r.left + r.right) / 2) * 0.2; if (d < xd) { xd = d; xb = a; } });
      return { left: r.left, right: r.right, top: best.top, bottom: best.bottom, y: best, x: xd < 80 ? xb : null, r: r };
    }
    function interp(ps, c) {
      if (!ps || ps.length < 2) return null;
      var i = 1; while (i < ps.length - 1 && c > ps[i].c) i++;
      var a = ps[i - 1], b = ps[i];
      return a.v + (b.v - a.v) * (c - a.c) / ((b.c - a.c) || 1);
    }
    function nameOf(f, i) {
      if (f.item) { var lab = all(f.item, 'p').map(function (p) { return p.textContent.trim(); }).filter(function (t) { return t && !/^[\d,.]+$/.test(t); })[0]; if (lab) return lab; var n = nm(f.item).replace('Item/', ''); return /^\d+$/.test(n) ? 'TP' + p2(+n) : n; }
      if (!f.__name) {
        /* 이름만 있는 범례(NEXT · 코어뱅킹 …) — 색이 가장 가까운 항목 */
        var scope = f.group.closest('[data-name^="Widget/"]') || f.group, c0 = rgbOf(f.color), best = '', bd = 130;
        all(scope, '[data-name="Legend"] [data-name^="Item/"]').forEach(function (it) {
          var key = one(it, '[data-name="Key"]') || one(it, '[data-name="Dot"]') || one(it, '[data-name="Shape"]');
          var kim = key && (key.tagName === 'IMG' ? key : one(key, 'img'));
          var kbg = key && getComputedStyle(key).backgroundColor, c1 = key && ((kbg && kbg !== 'rgba(0, 0, 0, 0)' && rgbOf(kbg)) || (kim && rgbOf(kim.__fill)));
          if (!c0 || !c1) return;
          var dd = Math.abs(c0[0] - c1[0]) + Math.abs(c0[1] - c1[1]) + Math.abs(c0[2] - c1[2]);
          var lab = all(it, 'p').map(function (p) { return p.textContent.trim(); }).filter(function (t) { return t && !/^[\d,.]+$/.test(t); })[0];
          if (dd < bd && lab) { bd = dd; best = lab; }
        });
        f.__name = best;
      }
      if (f.__name) return f.__name;
      return st.scene === 'tp' ? 'TP' + p2(i + 1) : '계열 ' + (i + 1);
    }
    var raf = 0, lastE = null;
    function hide() { tip.classList.remove('on'); vl.classList.remove('on'); dots.forEach(function (d) { d.style.opacity = '0'; }); }
    function onMove(e) {
      lastE = e;
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        var ev = lastE;
        if (editing() || !st.lines || !st.lines.length) { hide(); return; }
        var hit = null, hp = null;
        for (var i = 0; i < st.lines.length && !hit; i++) {
          var f = st.lines[i]; if (!f || !f.svg.isConnected || f.svg.classList.contains('ov-hid') || f.svg.closest('.ov-hid')) continue;
          var r0 = f.svg.getBoundingClientRect();
          if (r0.width < 20 || ev.clientX < r0.left || ev.clientX > r0.right) continue;
          var pl = plotOf(f);
          if (ev.clientY >= pl.top - 6 && ev.clientY <= pl.bottom + 6) { hit = f; hp = pl; }
        }
        if (!hit) { hide(); return; }
        var fs = st.lines.filter(function (f) { if (!f || f.group !== hit.group || !f.svg.isConnected || f.svg.classList.contains('ov-mute')) return false; var r0 = f.svg.getBoundingClientRect(); return r0.width > 20 && plotOf(f).y === hp.y && (hp.y || f === hit); });
        var fr = st.frame.getBoundingClientRect(), S = st.S || 1;
        var yAx = hp.y ? hp.y.ps : null, xAx = hp.x ? hp.x.ps : null;
        var rows = [], top = hp.top, bot = hp.bottom;
        while (dots.length < fs.length) { var d = document.createElement('i'); d.className = 'ov-dot'; st.frame.appendChild(d); dots.push(d); }
        dots.forEach(function (d) { d.style.opacity = '0'; });
        fs.forEach(function (f, k) {
          var r = f.svg.getBoundingClientRect(), vb = f.vb;
          var sx = vb[0] + (ev.clientX - r.left) / r.width * vb[2];
          var xr = f.xRange(); sx = clamp(sx, xr[0], xr[1]);
          var sy = f.yAtX(sx), cy = r.top + (sy - vb[1]) / vb[3] * r.height, cx = r.left + (sx - vb[0]) / vb[2] * r.width;
          var val = interp(yAx, cy);
          var d = dots[k]; d.style.left = ((cx - fr.left) / S) + 'px'; d.style.top = ((cy - fr.top) / S) + 'px'; d.style.background = f.color; d.style.opacity = '1';
          rows.push({ c: f.color, n: nameOf(f, k), v: val, y: cy });
        });
        rows.sort(function (a, b) { return a.y - b.y; });
        if (rows.some(function (x) { return !/^계열 /.test(x.n); })) rows = rows.filter(function (x) { return !/^계열 /.test(x.n); });
        var tsec = interp(xAx, ev.clientX), tlab = '';
        if (tsec != null) { tsec = ((Math.round(tsec) % 86400) + 86400) % 86400; tlab = p2(Math.floor(tsec / 3600)) + ':' + p2(Math.floor(tsec / 60) % 60) + ':' + p2(tsec % 60); }
        tip.innerHTML = (tlab ? '<b>' + tlab + '</b>' : '') + rows.map(function (x) { return '<span><i style="background:' + x.c + '"></i>' + esc(x.n) + '<em>' + (x.v == null ? '' : x.v >= 100 ? comma(Math.max(0, x.v)) : Math.max(0, x.v).toFixed(1)) + '</em></span>'; }).join('');
        var lx = (ev.clientX - fr.left) / S;
        vl.style.left = lx + 'px'; vl.style.top = ((top - fr.top) / S) + 'px'; vl.style.height = ((bot - top) / S) + 'px';
        vl.classList.add('on');
        var tw = tip.offsetWidth || 140;
        var tx = lx + 14; if (tx + tw > BASE_W + (st.exW || 0) - 8) tx = lx - tw - 14;
        tip.style.left = tx + 'px'; tip.style.top = (((ev.clientY - fr.top) / S) - 20) + 'px';
        tip.classList.add('on');
      });
    }
    st.onTipMove = onMove; st.onTipLeave = hide;
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerleave', hide);
  }

  /* ══════════════════ 6-4. 마우스 길 트기 — 단추 · 범례 · 줄을 덮은 그림 판은 마우스를 통과시킨다 ══════════════════ */
  function installUnblock(root, st) {
    function pass() {
      if (!root.isConnected) return;
      var ts = all(root, '.ov-click,.ov-btn,.ov-dd,.ov-field,.ov-chk,[data-name="Legend"] [data-name^="Item/"],[data-name^="Row/"],[data-name^="Card/"],[data-name^="Nav Item/"]');
      var vw = window.innerWidth, vh = window.innerHeight;
      ts.forEach(function (t) {
        for (var k = 0; k < 4; k++) {
          var r = t.getBoundingClientRect();
          if (!r.width || !r.height) return;
          var x = r.left + r.width / 2, y = r.top + r.height / 2;
          if (x < 0 || y < 0 || x > vw || y > vh) return;
          var h = document.elementFromPoint(x, y);
          if (!h || t.contains(h) || h.contains(t) || !root.contains(h)) return;
          var blk = h.closest('svg') || h;
          if (blk.closest('[data-name^="Popup/"]') !== t.closest('[data-name^="Popup/"]')) return;   /* 팝업이 덮은 것은 그대로 */
          if (blk.closest('.ov-click,.ov-btn,.ov-dd,.ov-field,.ov-chk,.ov-input,.ov-chost,.ov-chartbtn,.ov-chartmenu,.ov-ddmenu,.ov-fold') || one(blk, 'p') || blk.tagName === 'P') return;
          blk.style.pointerEvents = 'none';
        }
      });
    }
    [700, 1800, 4200].forEach(function (ms) { st.timers.push(setTimeout(pass, ms)); });
    st.onLayout.push(function () { setTimeout(pass, 650); });
  }

  /* ══════════════════ 7. 차트 바꾸기(패널편집) ══════════════════ */
  /*@MAKECHART*/

  var CC = { cy: '#00e5ff', bl: '#2f8bff', gn: '#34d28d', ye: '#e8c819', or: '#ff8a00', re: '#f43130', gr: '#8e9aa8', vi: '#8a5cff', pk: '#ff6fa8' };
  var GRADE = { k: 'donut', t: '등급별 이벤트', parts: [['Critical', CC.re, 2], ['Major', CC.or, 9], ['Minor', CC.ye, 4], ['Warning', CC.cy, 35], ['Normal', CC.gr, 174], ['Own', CC.vi, 12]] };
  var CH_BAR = { k: 'hbar', t: '채널별 초당 처리건수', unit: 'TPS', cats: ['스마트뱅킹', '대외', '인터넷뱅킹', '단말', '자동화기기', 'C/C', '기타'], vals: [1184, 438, 312, 271, 96, 58, 41], max: 1400, c: CC.bl };
  var BZ_BAR = { k: 'hbar', t: '업무별 초당 처리건수', unit: 'TPS', cats: ['수신', '전자금융', '고객', '여신', '대외계', '외환', '자동이체', '기타'], vals: [642, 512, 405, 318, 296, 87, 74, 66], max: 800, c: CC.cy };
  var TPS_LINE = { k: 'area', t: '초당 처리건수 추이', unit: 'TPS', dec: 0, series: [['전체', CC.bl, 2400, 90], ['스마트뱅킹', CC.cy, 1184, 50]], lo: 0, hi: 3200 };
  function specsFor(scene, root) {
    var S = {};
    S['Event Log'] = [GRADE, { k: 'bar', t: '업무별 이벤트 건수', unit: '건', cats: ['채널 DB', 'OpenAPI', '전자금융', '대외계', '콜센터', '배치'], vals: [8, 6, 5, 4, 3, 2], max: 10, c: CC.or }, { k: 'line', t: '시간대별 이벤트 추이', unit: '건', dec: 0, series: [['Warning', CC.cy, 6, 2], ['Major', CC.or, 2, 1]], lo: 0, hi: 12 }];
    if (scene === 'main') {
      S['Widget/Transactions by Business'] = [BZ_BAR, { k: 'donut', t: '업무별 누적 비율', parts: [['수신', CC.bl, 27], ['전자금융', CC.cy, 21], ['고객', CC.gn, 17], ['여신', CC.vi, 13], ['대외계', CC.or, 12], ['기타', CC.gr, 10]] }];
      S['Widget/Transactions by Channel'] = [CH_BAR, { k: 'donut', t: '채널별 누적 비율', parts: [['스마트뱅킹', CC.bl, 49], ['대외', CC.cy, 18], ['인터넷뱅킹', CC.gn, 13], ['단말', CC.vi, 11], ['기타', CC.gr, 9]] }];
      S['Widget/Bank No-Response'] = [{ k: 'bar', t: '기관별 무응답 건수', unit: '건', cats: ['가람', '누리', '다온', '마루', '바다', '자람'], vals: [0.2, 3, 1, 2, 1, 1], max: 5, c: CC.or }, { k: 'gauge', t: '무응답 비율', unit: '%', v: [0.4, 0.05], max: 5, c: CC.ye, dec: 2 }];
      S['Widget/Key TP Monitoring'] = [TPS_LINE, { k: 'line', t: '응답시간 추이', unit: 'ms', dec: 0, series: [['NEXT', CC.bl, 128, 12], ['코어뱅킹', CC.cy, 96, 10]], lo: 0, hi: 250 }, { k: 'gauge', t: '평균 응답시간', unit: 'ms', v: [128, 6], max: 300, c: CC.gn }];
      S['Widget/EtoE'] = [{ k: 'hbar', t: '채널별 평균 수행시간', unit: 'ms', cats: ['[N]비대면', '통합단말', '슈퍼WAVE', '[N]대외', '글로벌', '폰뱅킹'], vals: [148.9, 66.1, 46.2, 263, 162, 174], max: 300, c: CC.vi, dec: 1 }, TPS_LINE];
      S['Widget/Key WAS Monitoring'] = [{ k: 'bar', t: 'WAS별 동시접속자', unit: '명', cats: ['[N]WAVE', '개인뱅킹', '기업뱅킹', '슈퍼WAVE', '레포트', 'OpenAPI'], vals: [2212, 3605, 3403, 3430, 1936, 4485], max: 5000, c: CC.bl }, { k: 'area', t: '전체 WAS 초당 처리량', unit: 'TPS', dec: 0, series: [['처리량', CC.cy, 4300, 160]], lo: 0, hi: 6000 }];
    } else if (scene === 'overview2') {
      S['Widget/TP Queuing'] = [{ k: 'line', t: 'TP 큐잉 추이', unit: '건', dec: 0, series: [['코어', CC.bl, 6400, 300], ['채널', CC.cy, 3900, 240], ['대외', CC.or, 1600, 160]], lo: 0, hi: 9100 }, { k: 'bar', t: '서버별 큐잉 건수', unit: '건', cats: ['TP01', 'TP02', 'TP03', 'TP04', 'TP05'], vals: [2362, 2960, 1599, 1073, 6433], max: 9100, c: CC.bl }];
      S['Widget/TPS by Channel Group'] = [TPS_LINE, CH_BAR, { k: 'donut', t: '채널 그룹 비중', parts: [['스마트뱅킹', CC.bl, 1184], ['대외', CC.cy, 438], ['인터넷뱅킹', CC.gn, 312], ['단말', CC.vi, 271], ['기타', CC.gr, 195]] }];
      S['Widget/Concurrent Users'] = [{ k: 'area', t: '동시 사용자 추이', unit: '명', dec: 0, series: [['금일', CC.bl, 63482, 2400], ['특정일', CC.gr, 58210, 2000]], lo: 0, hi: 100000 }, { k: 'gauge', t: '동시 사용자', unit: '명', v: [63482, 900], max: 100000, c: CC.cy }];
      S['Widget/Transactions by Bank'] = [{ k: 'hbar', t: '기관별 3초 이내 처리', unit: '건', cats: ['다온은행', '가람은행', '누리은행', '마루은행', '새봄은행', '라온은행'], vals: [21907, 18420, 15238, 12655, 11730, 9814], max: 25000, c: CC.bl }, { k: 'bar', t: '기관별 무응답', unit: '건', cats: ['누리', '마루', '자람', '가람', '다온'], vals: [1, 1, 2, 0.2, 0.2], max: 3, c: CC.or }];
      S['Widget/Flow Control'] = [{ k: 'bar', t: '채널별 유량 사용률', unit: '%', cats: ['WAVE', '기업뱅킹', '개인뱅킹', '오픈뱅킹', '슈퍼 WAVE'], vals: [41, 64, 21, 96, 55], max: 100, c: CC.cy }, { k: 'gauge', t: '오픈뱅킹 유량', unit: '%', v: [96, 1.5], max: 100, c: CC.re }];
      S['Widget/Backup Batch Status'] = [{ k: 'donut', t: '배치 상태', parts: [['정상종료', CC.gn, 74], ['대기', CC.cy, 41], ['비정상종료', CC.re, 12], ['임계위반', CC.or, 6]] }, { k: 'bar', t: '백업 진행', unit: '%', cats: ['성공', '백업중', '실패'], vals: [82, 27, 5], max: 100, c: CC.bl }];
      S['Widget/Network Bandwidth'] = [{ k: 'bar', t: '회선 사용률', unit: '%', cats: ['인터넷 입력', '인터넷 출력', '모바일 입력', '모바일 출력'], vals: [34, 41, 47, 52], max: 100, c: CC.cy }];
      S['Widget/Active Transactions'] = [{ k: 'bar', t: '서비스별 액티브 트랜잭션', unit: '건', cats: ['[N]WAVE', '개인뱅킹', '[N]기업', '기업뱅킹', 'OpenAPI', '[N]WAVE 기타'], vals: [18, 26, 44, 312, 12, 5], max: 350, c: CC.bl }];
      S['Widget/Channel KPIs'] = [{ k: 'hbar', t: '채널별 동접자', unit: '명', cats: ['[N]WAVE', '슈퍼 WAVE', '[N]개인뱅킹', '개인뱅킹'], vals: [18642, 9874, 6215, 2083], max: 20000, c: CC.cy }];
    } else if (scene === 'transactions') {
      S['Widget/Transactions by Channel'] = [TPS_LINE, CH_BAR];
      S['Widget/Channel Group Transactions'] = [CH_BAR, { k: 'donut', t: '채널 그룹 누적 비율', parts: [['스마트뱅킹', CC.bl, 49], ['대외', CC.cy, 18], ['인터넷뱅킹', CC.gn, 13], ['단말', CC.vi, 11], ['기타', CC.gr, 9]] }];
      S['Widget/Other Channel Group Detail'] = [{ k: 'hbar', t: '기타 채널 유형별 TPS', unit: 'TPS', cats: ['SWIFT', '코아', 'EDI', 'EZI', '국외점포', 'EAI'], vals: [9, 6, 5, 4, 4, 4], max: 10, c: CC.vi }];
    } else if (scene === 'system' || scene === 'system2') {
      S['Donut Chart'] = [GRADE, { k: 'bar', t: '등급별 금일 건수', unit: '건', cats: ['Critical', 'Major', 'Minor', 'Warning'], vals: [2, 9, 4, 35], max: 50, c: CC.or }];
    } else if (scene === 'detail') {
      S['Widget/CPU Memory Usage'] = [{ k: 'area', t: 'CPU · 메모리 사용률', unit: '%', dec: 0, series: [['CPU', CC.cy, 41, 6], ['Memory', CC.vi, 66, 2]], lo: 0, hi: 100 }, { k: 'gauge', t: 'CPU 사용률', unit: '%', v: [41, 4], max: 100, c: CC.cy }];
      S['Widget/File System List'] = [{ k: 'hbar', t: '파일시스템 사용률', unit: '%', cats: ['/', '/var', '/app', '/log', '/backup'], vals: [38, 52, 67, 71, 44], max: 100, c: CC.or }];
      S['Widget/Process Top 5'] = [{ k: 'bar', t: '프로세스별 CPU', unit: '%', cats: ['java', 'java', 'ccagent', 'ora_lgwr', 'syslogd'], vals: [23.4, 11.8, 4.2, 2.9, 1.1], max: 30, c: CC.bl, dec: 1 }];
    } else if (scene === 'was') {
      var WC = ['[N]WAVE', '[N]개인뱅킹', '[N]기업뱅킹 (+모바일)', '슈퍼 WAVE', '슈퍼 WAVE & 알리미', '슈퍼 WAVE(은행)', '[N]검색&챗봇', '[N]레포트', '[N]OpenAPI GW', '[N]폰뱅킹'];
      S['Widget/Services'] = [
        { k: 'bar', t: '서비스별 초당처리량', unit: 'TPS', cats: WC, vals: [299, 357, 525, 415, 209, 127, 262, 210, 186, 375], max: 600, c: CC.bl },
        { k: 'hbar', t: '서비스별 평균수행시간', unit: 'ms', cats: WC, vals: [118.83, 158.82, 194.82, 178.01, 113.98, 89.74, 95.66, 101.8, 92.53, 164.22], max: 250, c: CC.vi, dec: 1 },
        { k: 'area', t: '전체 초당처리량 추이', unit: 'TPS', dec: 0, series: [['초당처리량', CC.cy, 2965, 120], ['액티브트랜잭션', CC.or, 1251, 60]], lo: 0, hi: 4000 }];
    } else if (scene === 'tp') {
      /* TP 성능현황 — 같은 이름(Line Chart · Chart)인 칸 15개. 행(코어 … EAI) × 열(처리건수 · 큐잉 · 응답속도)을 위치로 가린다 */
      var cells = all(root, '[data-name="Line Chart"],[data-name="Chart"]').filter(function (e) { return /^Screen\//.test(nm(e.parentElement)); });
      var pos = cells.map(function (e) {
        var l = Infinity, t = Infinity;
        boxes(e).forEach(function (b) { var q = b.getBoundingClientRect(); if (q.width && q.height) { l = Math.min(l, q.left); t = Math.min(t, q.top); } });
        return [l, t];
      });
      var xs = pos.map(function (p) { return p[0]; }).filter(isFinite), ys = pos.map(function (p) { return p[1]; }).filter(isFinite);
      var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
      var ROWN = ['코어', '전자금융', '대외', '채널', 'EAI'];
      var TPV = [[4091, 4413, 2883, 2318, 7186, 6730, 6327, 5122], [482, 298, 759, 722], [482, 298, 759, 722], [482, 298, 759, 722], [482, 298]];
      var QUV = [[118, 202, 136, 52, 298, 282, 256, 196], [779, 703, 814, 842], [779, 703, 814, 842], [779, 703, 814, 842], [814, 842]];
      var RSV = [[69, 71, 66, 60, 139, 108, 102, 100], [8, 6, 7, 7], [8, 6, 7, 7], [8, 6, 7, 7], [8, 6]];
      var C8 = [CC.bl, CC.cy, CC.re, CC.or, CC.pk, CC.ye, CC.gn, CC.vi], CQ = [CC.pk, CC.ye, CC.gn, CC.vi];
      var els = {};
      var tpName = function (n) { return 'TP' + (n < 9 ? '0' : '') + (n + 1); };
      var nice = function (v) { var m = Math.max.apply(null, v) * 1.25, p = Math.pow(10, Math.floor(Math.log(m) / Math.LN10)); return Math.ceil(m / p) * p; };
      cells.forEach(function (e, i) {
        if (!isFinite(pos[i][0])) return;
        var col = x1 > x0 ? Math.round((pos[i][0] - x0) / (x1 - x0) * 2) : 0, row = y1 > y0 ? Math.round((pos[i][1] - y0) / (y1 - y0) * 4) : 0;
        var rn = ROWN[row], key = 'TP ' + rn + ' ' + ['처리건수', '큐잉', '응답속도'][col], v, cs, list;
        if (col === 0) {
          v = TPV[row]; cs = row ? C8.slice(0, v.length) : C8;
          list = [{ k: 'area', t: rn + ' 서비스 초당 처리건수', unit: 'TPS', dec: 0, series: v.slice(0, 4).map(function (x, j) { return [tpName(j), cs[j], x, x * 0.05]; }), lo: 0, hi: nice(v) },
            { k: 'bar', t: rn + ' 서버별 처리건수', unit: 'TPS', cats: v.map(function (x, j) { return tpName(j); }), vals: v, max: nice(v), c: CC.bl },
            { k: 'donut', t: rn + ' 서버별 처리 비중', parts: v.map(function (x, j) { return [tpName(j), cs[j], x]; }) }];
        } else if (col === 1) {
          v = QUV[row]; cs = row ? (v.length === 2 ? [CC.gn, CC.vi] : CQ) : C8;
          list = [{ k: 'bar', t: rn + ' 서버별 큐잉', unit: '건', cats: v.map(function (x, j) { return tpName(j); }), vals: v, max: nice(v), c: CC.cy },
            { k: 'line', t: rn + ' 큐잉 추이', unit: '건', dec: 0, series: v.slice(0, 4).map(function (x, j) { return [tpName(j), cs[j], x, x * 0.06]; }), lo: 0, hi: nice(v) },
            { k: 'gauge', t: rn + ' 최대 큐잉', unit: '건', v: [Math.max.apply(null, v), 12], max: nice(v), c: CC.or }];
        } else {
          v = RSV[row]; cs = C8;
          var avg = v.reduce(function (a, b) { return a + b; }, 0) / v.length;
          list = [{ k: 'line', t: rn + ' 서비스 평균응답속도', unit: 'ms', dec: 0, series: v.slice(0, 4).map(function (x, j) { return [tpName(j), cs[j], x, Math.max(1, x * 0.08)]; }), lo: 0, hi: nice(v) },
            { k: 'gauge', t: rn + ' 평균 응답속도', unit: 'ms', v: [Math.round(avg * 10) / 10, Math.max(0.5, avg * 0.05)], max: nice(v), c: CC.gn, dec: avg < 20 ? 1 : 0 },
            { k: 'hbar', t: rn + ' 서버별 응답속도', unit: 'ms', cats: v.map(function (x, j) { return tpName(j); }), vals: v, max: nice(v), c: CC.vi }];
        }
        S[key] = list; els[key] = e;
      });
      Object.defineProperty(S, '__els', { value: els, enumerable: false });
    } else if (scene === 'network') {
      all(root, '[data-name^="Widget/"][data-name*="Line Usage"]').forEach(function (w, i) {
        S[nm(w)] = [{ k: 'area', t: '회선 사용률', unit: '%', dec: 0, series: [['송신', CC.cy, 42 + i * 2, 5], ['수신', CC.vi, 31 + i, 4]], lo: 0, hi: 100 }, { k: 'gauge', t: '현재 사용률', unit: '%', v: [44 + i * 2, 3], max: 100, c: CC.cy }];
      });
    }
    return S;
  }
  var chartUid = 0;
  function installChartSwap(root, st) {
    var savedAll = load(K_CHART), saved = savedAll[st.scene] || {};
    st.charts = {}; st.chartApply = {};
    var probe = document.createElement('i');
    probe.className = 'ov-probe';
    st.frame.appendChild(probe);
    var spec = specsFor(st.scene, root);
    Object.keys(spec).forEach(function (name) {
      var w = (spec.__els && spec.__els[name]) || one(root, '[data-name="' + name + '"]');
      if (!w) return;
      var els = boxes(w);
      var r = unionRect(els, st);
      if (!r || r.w < 120 || r.h < 60) return;
      var isLog = name === 'Event Log';
      var top = isLog ? 50 : st.scene === 'tp' ? 6 : 40;
      var host = document.createElement('div');
      host.className = 'ov-chost';
      host.style.left = (r.x + 8) + 'px'; host.style.top = (r.y + top) + 'px';
      host.style.width = Math.max(100, r.w - (st.scene === 'tp' ? 92 : 16)) + 'px'; host.style.height = Math.max(50, r.h - top - 8) + 'px';
      host.style.display = 'none';
      var mover = isContents(w) ? null : w;
      (mover || st.frame).appendChild(host);
      if (mover) { host.style.left = '8px'; host.style.top = top + 'px'; }
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ov-chartbtn';
      btn.innerHTML = KIND_ICON.bar.replace('class="ic"', 'class="ic" style="width:13px;height:11px"') + '차트';
      btn.title = '이 패널의 차트 바꾸기';
      var menu = document.createElement('div');
      menu.className = 'ov-chartmenu';
      var bx = mover ? r.w - 74 : r.x + r.w - 74, by = mover ? 8 : r.y + 8;
      btn.style.left = bx + 'px'; btn.style.top = by + 'px';
      menu.style.left = Math.max(0, bx - 190) + 'px'; menu.style.top = (by + 26) + 'px';
      (mover || st.frame).appendChild(btn); (mover || st.frame).appendChild(menu);
      w.__chartBits = [host, btn, menu];
      var hideEls = isLog ? [one(w, ':scope > [data-name="Table"]')].filter(Boolean) : els.filter(function (e) { return nm(e) !== 'Title Bar' && !one(e, ':scope > [data-name="Title Bar"]') || mover; });
      var list = spec[name];
      var cur = saved[name] != null ? saved[name] : -1;
      function render() {
        menu.innerHTML = '<div class="hd">추천 차트</div>'
          + list.map(function (s, i) {
            return '<button type="button" data-i="' + i + '"' + (i === cur ? ' class="cur"' : '') + '>' + KIND_ICON[s.k] + esc(s.t) + ' · ' + KIND_NAME[s.k]
              + (i === 0 ? '<span class="rec">추천</span>' : '') + '</button>';
          }).join('')
          + '<div class="sep"></div><button type="button" data-i="-1"' + (cur < 0 ? ' class="cur"' : '') + '>' + KIND_ICON.orig + '원본 그대로</button>';
      }
      function hideOrig(on) {
        if (mover) {
          kids(mover).forEach(function (c) { if (c === host || c === btn || c === menu || nm(c) === 'Title Bar' || nm(c) === 'Toolbar' || (nm(c) === 'Header' && one(c, '[data-name="Title Bar"]'))) return; c.classList.toggle('ov-hid', on); });
        } else {
          els.forEach(function (e) { if (nm(e) === 'Title Bar' || nm(e) === 'Header' || /Background/.test(nm(e))) return; e.classList.toggle('ov-hid', on); });
        }
      }
      function apply(i) {
        cur = i;
        if (st.charts[name]) { st.charts[name].dispose(); delete st.charts[name]; }
        host.style.display = i >= 0 ? 'block' : 'none';
        hideOrig(i >= 0);
        if (i >= 0 && list[i]) st.charts[name] = makeChart(host, Object.assign({ uid: ++chartUid }, list[i]));
        var m = load(K_CHART);
        m[st.scene] = m[st.scene] || {};
        if (i >= 0) m[st.scene][name] = i; else delete m[st.scene][name];
        save(K_CHART, m);
        render();
      }
      render();
      var stop = function (e) { e.stopPropagation(); };
      btn.addEventListener('pointerdown', stop);
      menu.addEventListener('pointerdown', stop);
      btn.addEventListener('pointerup', function (e) {
        e.stopPropagation(); e.preventDefault();
        all(root, '.ov-chartmenu.open').forEach(function (m) { if (m !== menu) m.classList.remove('open'); });
        menu.classList.toggle('open');
      });
      menu.addEventListener('pointerup', function (e) {
        var b = e.target.closest('button[data-i]');
        e.stopPropagation(); e.preventDefault();
        if (!b) return;
        apply(+b.getAttribute('data-i'));
        menu.classList.remove('open');
      });
      st.chartApply[name] = apply;
      if (cur >= 0) apply(cur);
      /* 묶음(contents) 판은 옮길 때 같이 따라가도록 */
      if (!mover) {
        w.__extra = [host, btn, menu];
        /* 화면 맞추기 단위에도 넣는다 — 판이 16:9 가 아니면 위젯이 옮겨지는데 단추 · 차트가 제자리에 남았다 */
        var fu = (st.units || []).filter(function (u) { return u.kind === 'move' && (u.el === w || u.el.contains(w)); })[0];
        if (fu) w.__extra.forEach(function (b) { fu.els.push(b); b.classList.add('ov-place'); b.__fx = (st.exW || 0) * fu.ax; b.__fy = (st.exH || 0) * fu.ay; place(b); });
      }
    });
    syncChartHue(root, probe);
    st.timers.push(setInterval(function () { syncChartHue(root, probe); }, 1200));
    st.onDocDown = function (e) {
      if (e.target.closest && e.target.closest('.ov-chartmenu, .ov-chartbtn')) return;
      all(root, '.ov-chartmenu.open').forEach(function (m) { m.classList.remove('open'); });
    };
    document.addEventListener('pointerdown', st.onDocDown, true);
  }

  /* ══════════════════ 8. 패널 옮기기(패널편집) ══════════════════ */
  function installPanelMove(root, st) {
    var L = load(K_LAYOUT), me = L[st.scene] = L[st.scene] || {};
    me.free = me.free || {};
    function persist() { var a = load(K_LAYOUT); a[st.scene] = me; save(K_LAYOUT, a); }
    var MOVE = /^(Widget\/|Popup\/|Event Log$|KPI Bar$|Column\/|Node Group|Zone\/|Row Panel\/|Donut Chart$|Line Chart$|Chart$|WAS Status Board$|Notice$|Toolbar$|Server Info$|Legend$|Title Bar$)/;
    var units = [];
    (st.units || []).forEach(function (u) {
      if (u.kind !== 'move') return;
      /* 열(Column) · 카드판은 안의 위젯을 따로 옮긴다 */
      var list = /^(Column\/|WAS Status Board)/.test(u.name) ? kids(u.el).map(function (c) { return { name: u.name + ' > ' + nm(c), els: boxes(c), el: c }; }) : [{ name: u.name + '#' + u.i, els: u.els, el: u.el }];
      list.forEach(function (x) { if (x.els.length && (MOVE.test(nm(x.el)) || /^(Column\/|WAS Status Board)/.test(u.name))) units.push(x); });
    });
    units.forEach(function (x) {
      var extra = x.el.__extra || [];
      x.els = x.els.concat(extra);
      x.els.forEach(function (e) { e.classList.add('ov-mv'); e.__unit = x; });
      var s = me.free[x.name];
      if (s) { x.els.forEach(function (e) { e.__ux = s[0]; e.__uy = s[1]; place(e); if (e.__applyFold) e.__applyFold(); }); }
    });
    var drag = null;
    st.onDown = function (e) {
      if (!layoutEditing(root) || e.button !== 0) return;
      if (e.target.closest('.ov-chartbtn, .ov-chartmenu, .ov-resetbtn, .ov-fold')) return;
      if (e.target.closest('[contenteditable="true"]') && e.target.closest('p')) return;
      var w = e.target.closest('.ov-mv');
      if (!w || !root.contains(w) || !w.__unit) return;
      e.preventDefault(); e.stopPropagation();
      drag = { u: w.__unit, sx: e.clientX, sy: e.clientY, moved: false };
    };
    st.onMove = function (e) {
      if (!drag) return;
      var S = (st.frame.getBoundingClientRect().width / st.frame.offsetWidth) || st.S || 1;
      var dx = (e.clientX - drag.sx) / S, dy = (e.clientY - drag.sy) / S;
      if (!drag.moved) { if (Math.hypot(dx, dy) < 3) return; drag.moved = true; drag.u.els.forEach(function (x) { x.classList.add('ov-dragging'); }); }
      drag.u.els.forEach(function (x) { x.__dx = dx; x.__dy = dy; place(x); if (x.__applyFold) { x.__uy = (x.__uy || 0); } });
    };
    st.onUp = function () {
      if (!drag) return;
      var d = drag; drag = null;
      d.u.els.forEach(function (x) { x.classList.remove('ov-dragging'); });
      if (!d.moved) return;
      var snap = function (v) { return Math.round(v / 4) * 4; };
      var e0 = d.u.els[0];
      var ux = snap((e0.__ux || 0) + (e0.__dx || 0)), uy = snap((e0.__uy || 0) + (e0.__dy || 0));
      all(root, '.ov-front').forEach(function (x) { x.classList.remove('ov-front'); });
      d.u.els.forEach(function (x) { x.__ux = ux; x.__uy = uy; x.__dx = 0; x.__dy = 0; place(x); x.classList.toggle('ov-front', !!(ux || uy)); if (x.__applyFold) x.__applyFold(); });
      me.free[d.u.name] = [ux, uy];
      persist();
    };
    root.addEventListener('pointerdown', st.onDown, true);
    window.addEventListener('pointermove', st.onMove);
    window.addEventListener('pointerup', st.onUp);
    window.addEventListener('pointercancel', st.onUp);
    st.onDragStart = function (e) { if (layoutEditing(root) && e.target.closest && e.target.closest('.ov-mv')) e.preventDefault(); };
    root.addEventListener('dragstart', st.onDragStart);
    st.resetLayout = function () {
      me = { free: {} };
      var a = load(K_LAYOUT); a[st.scene] = me; save(K_LAYOUT, a);
      units.forEach(function (x) { x.els.forEach(function (e) { e.__ux = 0; e.__uy = 0; place(e); e.classList.remove('ov-front'); if (e.__applyFold) e.__applyFold(); }); });
      Object.keys(st.chartApply || {}).forEach(function (k) { st.chartApply[k](-1); });
    };
    var rb = document.createElement('button');
    rb.type = 'button';
    rb.className = 'ov-resetbtn';
    rb.textContent = '배치 초기화';
    rb.title = '패널 자리 · 바꾼 차트를 원본으로';
    st.frame.appendChild(rb);
    rb.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    rb.addEventListener('pointerup', function (e) { e.stopPropagation(); e.preventDefault(); st.resetLayout(); });
    st.onReset = function (e) { if (e.target.closest && e.target.closest('#layoutReset')) st.resetLayout(); };
    document.addEventListener('click', st.onReset, true);
  }

  /* ══════════════════ 살리기 ══════════════════ */
  var SCENE_OF = { ovm: 'main', ovn: 'overview2', ovt: 'transactions', ovw: 'was', ovp: 'waspopup', ovq: 'tp', ovs: 'system', ovr: 'system2', ovd: 'detail', ovk: 'network', ove: 'event' };
  function sceneOf(root) {
    var m = /\b(ov[a-z])-root\b/.exec(root.className);
    return { px: m ? m[1] : 'ovm', scene: m && SCENE_OF[m[1]] ? SCENE_OF[m[1]] : 'main' };
  }
  function start(root, st) {
    var steps = [['fit', installFit], ['clock', installClock], ['recent', installRecent], ['nav', installNav], ['elog', installEventLog], ['controls', installControls], ['fold', installFold],
      ['scroll', installScroll], ['charts', installLiveCharts], ['tip', installTooltip], ['jitter', installJitter], ['swap', installChartSwap], ['move', installPanelMove], ['unblock', installUnblock]];
    steps.forEach(function (s) { try { s[1](root, st); } catch (e) { console.warn('[ov] ' + s[0], e); } });
    root.classList.add('ov-enter');
    st.timers.push(setTimeout(function () { root.classList.remove('ov-enter'); }, 1600));
    /* 테마 — 스튜디오가 바깥 뿌리 data-theme 를 바꾸면 그대로(안쪽 팝업은 같은 뿌리라 따로 할 일 없음) */
  }
  function initOneview(root) {
    if (!root || root.__ov) return;
    injectStyle();
    root.classList.add('ov-root');
    var so = sceneOf(root);
    var st = root.__ov = { timers: [], scene: so.scene, px: so.px, onLayout: [] };
    if (/[?&]edit=1/.test(location.search)) root.classList.add('ov-edit-layout');
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
  function disposeOneview(root) {
    var st = root && root.__ov;
    if (!st) return;
    if (st.wait) st.wait.disconnect();
    st.timers.forEach(function (t) { clearInterval(t); clearTimeout(t); });
    clearTimeout(st.feed); clearTimeout(st.toastT);
    if (st.ro) st.ro.disconnect();
    if (st.onResize) window.removeEventListener('resize', st.onResize);
    (st.lines || []).forEach(function (l) { if (l) l.dispose(); });
    Object.keys(st.charts || {}).forEach(function (k) { st.charts[k].dispose(); });
    if (st.onDocDown) document.removeEventListener('pointerdown', st.onDocDown, true);
    if (st.onDown) root.removeEventListener('pointerdown', st.onDown, true);
    if (st.onMove) window.removeEventListener('pointermove', st.onMove);
    if (st.onUp) { window.removeEventListener('pointerup', st.onUp); window.removeEventListener('pointercancel', st.onUp); }
    if (st.onDragStart) root.removeEventListener('dragstart', st.onDragStart);
    if (st.onReset) document.removeEventListener('click', st.onReset, true);
    if (st.onMenuDoc) document.removeEventListener('pointerdown', st.onMenuDoc, true);
    if (st.onMenuKey) document.removeEventListener('keydown', st.onMenuKey);
    if (st.onTipMove) { root.removeEventListener('pointermove', st.onTipMove); root.removeEventListener('pointerleave', st.onTipLeave); }
    if (st.onRowClick) root.removeEventListener('click', st.onRowClick);
    root.__ov = null;
  }
  window.initOneview = initOneview;
  window.disposeOneview = disposeOneview;
})();
