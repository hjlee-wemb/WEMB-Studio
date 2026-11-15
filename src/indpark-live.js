/* 스마트 산단 디지털 트윈 — 재구축 화면 9장의 인터랙션 · 라이브 · 반응형 레이어.
   window.initIndpark(root) / window.disposeIndpark(root)

   화면(DOM·CSS)은 생성기(src/indpark/_gen/conv.js)가 Figma(xzZQdVDkaDM1hve8Vc88GC, REM 페이지) 그대로 만든다.
   이 파일은 그 위에 '움직이는 것'만 얹는다 — 정지 상태(?live=0) = Figma 원본.

   · 반응형 — 1920x1080 좌표계 + 균일 배율 S. 남는 폭 · 높이는 헤더 · 지도 · 이벤트 로그 · 패널이 나눠 갖는다(여백 없음). 정확히 16:9 면 Figma 와 같다.
   · 실시간 시계, 이벤트 발생시각 = 열 때마다 최근(recent-time.js), 새 이벤트가 맨 위로 흘러 들어온다
   · 마우스 오버 · 눌림 — 메뉴 · 단추 · 칩 · 체크 · 사업장 · 지도 라벨 · 표 줄 · 범례 · 값 칸
   · Event Log Fold Button(파란 화살표) — 접고 펴기, 화면마다 기억
   · 라이브 차트 — 센서 팝업 · 센서현황 추이선이 실시간 데이터처럼 흐르고, 오른쪽 값 칸이 같이 바뀐다
   · 화면 잇기 — 헤더 메뉴 · 전체 메뉴 · 지도 라벨 · 사업장 · 설비 표 · 이벤트 줄 · 실시간/히스토리 · 닫기
   · 차트 바꾸기(패널편집 중) — 패널마다 산단 관제에 맞춘 추천 차트. 첫 항목 = 추천, '원본 그대로'로 되돌린다.
   · 패널 옮기기(패널편집 중) — 왼쪽 두 패널은 위아래로 자리를 바꾸며 다시 쌓이고, 나머지는 4px 격자로 옮긴다.

   손으로 쓴 파일이다(생성물 아님). 고친 뒤 node mk-live.js → js/core/tpl-modules.js 의 ?v= 를 올릴 것. */
(function () {
  'use strict';

  var BASE_W = 1920, BASE_H = 1080;
  var K_LAYOUT = 'wemb-indpark-layout', K_CHART = 'wemb-indpark-chart', K_FOLD = 'wemb-indpark-fold';
  var STYLE_ID = 'indpark-live-style';
  var EASE = 'cubic-bezier(.22,.8,.24,1)';
  var EL_SHUT = 71;                                  /* 접은 Event Log 높이 = 위 여백 20 + 툴바 31 + 아래 20 */
  var SEL_GLOW = '0px 0px 10px 0px rgba(33,229,255,0.5)';

  /* ══════════════════ 스타일 ══════════════════ */
  var CSS = [
    '.ip-root{--ip-acc:0,136,255;overflow:clip!important;}',
    '.ip-root.ip-resizing *,.ip-root .ip-dragging,.ip-root .ip-dragging *{transition:none!important;}',
    '.ip-root.ip-live .ip-place{transition:translate .5s ' + EASE + ',opacity .3s ease;}',
    '.ip-root .ip-probe{position:absolute;width:0;height:0;overflow:hidden;color:#0088ff;}',
    '.ip-root .ip-click{cursor:pointer;}',
    '.ip-root .ip-click *{cursor:inherit;}',
    '.dt-content-editing .ip-root .ip-click,.dt-content-editing .ip-root .ip-click *{cursor:text;}',
    /* 화면 바탕 그림 — 판이 16:9 를 벗어나도 늘어나지 않게 */
    '.ip-root > [data-node-id] > div[aria-hidden] img,.ip-root > [data-node-id] > img{object-fit:cover;}',
    '.ip-root [data-name="Map"] > img{object-fit:cover;}',
    '@keyframes ipIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}}',
    '@keyframes ipFade{from{opacity:0;}to{opacity:1;}}',
    '@keyframes ipPop{from{opacity:0;transform:translateY(12px) scale(.985);}to{opacity:1;transform:none;}}',
    '@keyframes ipSlide{from{opacity:.2;transform:translateX(-40px);}to{opacity:1;transform:none;}}',
    '.ip-root.ip-enter [data-name="Side Panel"] > *,.ip-root.ip-enter [data-name="Event Log"],.ip-root.ip-enter [data-name^="Panel/"]{animation:ipIn .5s ' + EASE + ' both;animation-delay:calc(var(--i,0) * 70ms);}',
    '.ip-root.ip-enter [data-name="Map Labels"] > *{animation:ipPop .45s ' + EASE + ' both;animation-delay:calc(240ms + var(--i,0) * 60ms);}',
    '.ip-root.ip-enter [data-name="Dim"]{animation:ipFade .3s ease both;}',
    '.ip-root.ip-enter [data-name="Popup/Sensor Info"]{animation:ipPop .42s ' + EASE + ' both;}',
    '.ip-root.ip-enter [data-name="Drawer/Full Menu"]{animation:ipSlide .42s ' + EASE + ' both;}',

    /* 헤더 */
    '.ip-root [data-name="Header"] [data-name^="Nav Item/"]{transition:filter .2s ease,scale .2s ' + EASE + ';}',
    '.ip-root [data-name="Header"] [data-name^="Nav Item/"]:not([data-name$="(Active)"]):hover{filter:brightness(1.9) drop-shadow(0 0 6px rgba(0,229,255,.55));}',
    '.ip-root [data-name="Header"] [data-name^="Nav Item/"]:not([data-name$="(Active)"]):active{scale:.96;}',
    '.ip-root [data-name="Button/Menu"],.ip-root [data-name="Button/Logout"]{transition:filter .2s ease,scale .2s ' + EASE + ',translate .2s ' + EASE + ';}',
    '.ip-root [data-name="Button/Menu"]:hover,.ip-root [data-name="Button/Logout"]:hover{filter:brightness(1.5) drop-shadow(0 0 6px rgba(0,229,255,.55));}',
    '.ip-root [data-name="Button/Menu"]:active,.ip-root [data-name="Button/Logout"]:active{scale:.94;}',
    '.ip-root [data-name="Header"] [data-name="Logo"] .tpl-studio-logo{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;object-position:left center;}',
    '.ip-root [data-name="Button/Forklift Collision"],.ip-root [data-name="Button/Evacuation Route"]{transition:background-color .2s ease,translate .2s ' + EASE + ',box-shadow .2s ease;}',
    '.ip-root [data-name="Button/Forklift Collision"]:hover,.ip-root [data-name="Button/Evacuation Route"]:hover{background-color:#fff!important;translate:0 -1px;box-shadow:0 6px 14px rgba(0,0,0,.25)!important;}',
    '.ip-root [data-name="Button/Forklift Collision"]:active,.ip-root [data-name="Button/Evacuation Route"]:active{translate:0 1px;}',
    '.ip-root .ip-on[data-name^="Button/"]{background-color:rgba(0,136,255,.9)!important;}',
    '.ip-root .ip-on[data-name^="Button/"] p{color:#fff!important;}',
    '.ip-root .ip-on[data-name^="Button/"] img{filter:brightness(0) invert(1);}',
    /* 왼쪽 패널 */
    '.ip-root [data-name="Search Field"]{transition:box-shadow .25s ease,filter .25s ease;}',
    '.ip-root [data-name="Search Field"]:hover{box-shadow:0 0 12px rgba(138,240,255,.45)!important;}',
    '.ip-root [data-name^="Item/Site"]{transition:background-color .2s ease,box-shadow .25s ease;}',
    '.ip-root [data-name^="Item/Site"]:hover{background-color:rgba(0,136,255,.14);border-radius:6px;}',
    '.ip-root [data-name^="Checkbox/"]{transition:filter .2s ease,translate .2s ' + EASE + ',background-color .2s ease;}',
    '.ip-root [data-name^="Checkbox/"]:hover{filter:brightness(1.12);translate:0 -1px;}',
    '.ip-root [data-name^="Checkbox/"]:active{translate:0 1px;}',
    '.ip-root [data-name="Button/Reset"],.ip-root [data-name="Button/Ack"],.ip-root [data-name="Button/Ack All"]{transition:filter .2s ease,translate .2s ' + EASE + ';}',
    '.ip-root [data-name="Button/Reset"]:hover,.ip-root [data-name="Button/Ack"]:hover,.ip-root [data-name="Button/Ack All"]:hover{filter:brightness(1.18) drop-shadow(0 0 6px rgba(0,136,255,.6));translate:0 -1px;}',
    '.ip-root [data-name="Button/Reset"]:active,.ip-root [data-name="Button/Ack"]:active,.ip-root [data-name="Button/Ack All"]:active{filter:brightness(.92);translate:0 1px;}',
    '.ip-root [data-name="Widget/Equipment Search"] [data-name="List"] > [data-name^="Row/"]{transition:background-color .2s ease;border-radius:4px;}',
    '.ip-root [data-name="Widget/Equipment Search"] [data-name="List"] > [data-name^="Row/"]:hover{background-color:rgba(0,136,255,.16);}',
    /* 지도 */
    '.ip-root [data-name="Map Labels"] > [data-name^="Label/"]{transition:translate .25s ' + EASE + ',box-shadow .25s ease,background-color .2s ease;}',
    '.ip-root [data-name="Map Labels"] > [data-name^="Label/"]:hover{translate:0 -3px;box-shadow:0 8px 18px rgba(0,0,0,.4);background-color:#fff!important;}',
    /* 이벤트 로그 */
    '.ip-root [data-name="Event Log"]{transition:height .5s ' + EASE + ',translate .5s ' + EASE + ';}',
    '.ip-root [data-name="Event Log"] > [data-name="Table"]{transition:opacity .35s ease;}',
    '.ip-root [data-name="Event Log"].ip-shut > [data-name="Table"]{opacity:0;pointer-events:none;}',
    '.ip-root [data-name="Event Log"] [data-name="Icon/Info"]{cursor:pointer;transition:rotate .45s ' + EASE + ',filter .2s ease,scale .2s ' + EASE + ';}',
    '.ip-root [data-name="Event Log"] [data-name="Icon/Info"]:hover{filter:brightness(1.4) drop-shadow(0 0 5px rgba(0,136,255,.9));scale:1.15;}',
    '.ip-root [data-name="Event Log"].ip-shut [data-name="Icon/Info"]{rotate:180deg;}',
    '.ip-root [data-name="Toggle/Auto"]{cursor:pointer;}',
    '.ip-root [data-name="Toggle/Auto"] [data-name="Knob"],.ip-root [data-name="Toggle/Auto"] [data-name="Switch"] > p{transition:translate .3s ' + EASE + ',filter .3s ease;}',
    '.ip-root [data-name="Toggle/Auto"]:hover [data-name="Track"]{filter:brightness(1.3);}',
    '.ip-root [data-name="Toggle/Auto"].ip-off [data-name="Knob"]{translate:42px 0;filter:grayscale(1) brightness(.7);}',
    '.ip-root [data-name="Toggle/Auto"].ip-off [data-name="Switch"] > p{translate:-22px 0;opacity:.6;}',
    '.ip-root [data-name^="Count/"],.ip-root [data-name^="Chip/"]{cursor:pointer;transition:filter .2s ease,opacity .25s ease,translate .2s ' + EASE + ';}',
    '.ip-root [data-name^="Count/"]:hover,.ip-root [data-name^="Chip/"]:hover{filter:brightness(1.3);translate:0 -1px;}',
    '.ip-root [data-name^="Count/"].ip-dim,.ip-root [data-name^="Chip/"].ip-dim{opacity:.38;filter:saturate(.3);}',
    '.ip-root [data-name="List"] > [data-name^="Row/"],.ip-root [data-name="Table"] > [data-name^="Row/"]{transition:background-color .2s ease,opacity .3s ease,filter .2s ease;}',
    '.ip-root [data-name="Event Log"] [data-name="List"] > [data-name^="Row/"]:hover,.ip-root [data-name="Table"] > [data-name^="Row/"]:hover{background-color:rgba(0,136,255,.12);cursor:pointer;}',
    '.ip-root .ip-hide{display:none!important;}',
    '.ip-root .ip-new{animation:ipNew 1.6s ease;}',
    '@keyframes ipNew{0%{background-color:rgba(0,229,255,.32);}100%{background-color:rgba(0,229,255,0);}}',
    '.ip-root .ip-acked{opacity:.5;}',
    '@keyframes ipBlink{0%,100%{opacity:1;}50%{opacity:.35;}}',
    '.ip-root [data-name="Event Log"] [data-name="Td/Grade"] [data-name="Badge/Critical"]{animation:ipBlink 1.8s ease-in-out infinite;}',
    /* 메뉴 */
    '.ip-root [data-name="Drawer/Full Menu"] [data-name^="Nav Item/"]{cursor:pointer;transition:background-color .2s ease;}',
    '.ip-root [data-name="Drawer/Full Menu"] [data-name^="Nav Item/"]:not([data-name$="(Active)"]):hover{background-color:rgba(255,255,255,.08);}',
    '.ip-root [data-name="Drawer/Full Menu"] [data-name^="Nav Item/"] p{transition:translate .2s ' + EASE + ';}',
    '.ip-root [data-name="Drawer/Full Menu"] [data-name^="Nav Item/"]:hover p{translate:4px 0;}',
    '.ip-root [data-name="Button/Close"]{cursor:pointer;transition:filter .2s ease,rotate .3s ' + EASE + ';}',
    '.ip-root [data-name="Button/Close"]:hover{filter:brightness(1.4) drop-shadow(0 0 5px rgba(255,255,255,.6));}',
    '.ip-root [data-name="Popup/Sensor Info"] [data-name="Button/Close"]:hover{rotate:90deg;}',
    '.ip-root [data-name="Dim"]{cursor:pointer;}',
    /* 차트 · 값 칸 · 범례 */
    '.ip-root [data-name="Value Panel"] [data-name^="Item/"],.ip-root [data-name="Legend"] [data-name^="Item/"]{cursor:pointer;transition:background-color .2s ease,opacity .25s ease,box-shadow .25s ease;}',
    '.ip-root [data-name="Value Panel"] [data-name^="Item/"]:hover{background-color:rgba(0,136,255,.12);}',
    '.ip-root [data-name="Legend"] [data-name^="Item/"]:hover{background-color:rgba(255,255,255,.08);}',
    '.ip-root [data-name="Legend"] [data-name^="Item/"].ip-mute{opacity:.35;}',
    '.ip-root .ip-sel{box-shadow:' + SEL_GLOW + '!important;}',
    '.ip-root .ip-sel::after{border-color:#08f!important;}',
    '.ip-root .ip-unsel{box-shadow:none!important;}',
    '.ip-root .ip-unsel::after{border-color:var(--ip-unsel-border,#394555)!important;}',
    '.ip-root [data-name="Value Panel"] .ip-sel > p{color:#fff!important;}',
    '.ip-root [data-name="Value Panel"] .ip-unsel > p{color:rgba(255,255,255,.5)!important;}',
    '.ip-root .ip-live-data{position:absolute;pointer-events:none;overflow:visible;}',
    '.ip-root .ip-live-data polyline{transition:opacity .3s ease,stroke-width .3s ease;}',
    '.ip-root .ip-live-data polyline.ip-mute{opacity:0;}',
    '.ip-root .ip-live-data polyline.ip-focus{stroke-width:3;}',
    '.ip-root .ip-live-data.ip-focusing polyline:not(.ip-focus){opacity:.35;}',
    '.ip-root .ip-src-hidden{visibility:hidden!important;}',
    /* 스크롤 목록 — 기본 막대는 숨기고 Figma 막대를 쓴다 */
    '.ip-root .ip-scroll{overflow-y:auto!important;overflow-x:hidden!important;scrollbar-width:none;overscroll-behavior:contain;}',
    '.ip-root .ip-scroll::-webkit-scrollbar{display:none;}',
    '.ip-root .ip-sb{cursor:pointer;}',
    '.ip-root .ip-sbthumb{cursor:grab;will-change:transform;transition:filter .2s ease,height .25s ' + EASE + ';}',
    '.ip-root .ip-sbthumb:hover{filter:brightness(1.3) drop-shadow(0 0 4px rgba(0,136,255,.6));}',
    '.ip-root .ip-sbthumb.ip-grab{cursor:grabbing;filter:brightness(1.4);transition:none;}',
    /* 이벤트 현황 · 히스토리 · 센서현황 */
    '.ip-root [data-name^="Option/"]{cursor:pointer;transition:background-color .2s ease,filter .2s ease;}',
    '.ip-root [data-name^="Option/"]:not([data-name$="(Active)"]):hover{filter:brightness(1.35);}',
    '.ip-root [data-name="Field/Location"]{cursor:pointer;transition:box-shadow .25s ease;}',
    '.ip-root [data-name="Field/Location"]:hover{box-shadow:0 0 10px rgba(0,229,255,.35);}',
    '.ip-root [data-name^="Field/"] [data-name="Input Box"],.ip-root [data-name^="Input/"]{transition:box-shadow .25s ease;}',
    '.ip-root [data-name^="Field/"]:hover [data-name="Input Box"],.ip-root [data-name^="Input/"]:hover{box-shadow:0 0 10px rgba(138,240,255,.4);}',
    '.ip-root [data-name="Button/Search"],.ip-root [data-name="Icon/Search"]{cursor:pointer;transition:filter .2s ease,scale .2s ' + EASE + ';}',
    '.ip-root [data-name="Button/Search"]:hover,.ip-root [data-name="Icon/Search"]:hover{filter:brightness(1.5);scale:1.08;}',
    '.ip-root [data-name="Pagination"] [data-name^="Page/"],.ip-root [data-name="Pagination"] [data-name^="Button/"]{cursor:pointer;transition:filter .2s ease,background-color .2s ease,scale .2s ' + EASE + ';}',
    '.ip-root [data-name="Pagination"] [data-name^="Page/"]:hover,.ip-root [data-name="Pagination"] [data-name^="Button/"]:hover{filter:brightness(1.6);scale:1.08;}',
    '.ip-root [data-name="Widget/Sensor List"] [data-name="List"] > [data-name^="Row/"]{cursor:pointer;transition:background-color .2s ease,box-shadow .25s ease;}',
    '.ip-root [data-name="Widget/Sensor List"] [data-name="List"] > [data-name^="Row/"]:hover{background-color:rgba(0,136,255,.12)!important;}',
    '.ip-root [data-name="Field/Sensor Name"] [data-name="Value"],.ip-root [data-name="Widget/Sensor Info"] [data-name="Value"]{transition:opacity .25s ease;}',
    '.ip-root .ip-blinkin{animation:ipFade .5s ease;}',
    '.ip-root .ip-toast{position:absolute;left:50%;top:86px;z-index:80;translate:-50% -8px;opacity:0;padding:10px 20px;border:1px solid rgba(0,229,255,.6);border-radius:10px;background:rgba(2,11,29,.92);color:#e6f6ff;font:600 15px/1 "Pretendard Variable",Pretendard,sans-serif;pointer-events:none;transition:opacity .25s ease,translate .3s ' + EASE + ';white-space:nowrap;box-shadow:0 0 12px rgba(0,229,255,.3);}',
    '.ip-root .ip-toast.on{opacity:1;translate:-50% 0;}',
    '.ip-root .ip-ddmenu{position:absolute;z-index:70;min-width:200px;padding:6px;border-radius:12px;background:rgba(2,11,29,.96);border:1px solid rgba(0,229,255,.45);box-shadow:0 10px 24px rgba(0,0,0,.45);opacity:0;translate:0 -6px;pointer-events:none;transition:opacity .2s ease,translate .25s ' + EASE + ';}',
    '.ip-root .ip-ddmenu.open{opacity:1;translate:0 0;pointer-events:auto;}',
    '.ip-root .ip-ddmenu button{display:block;width:100%;padding:9px 12px;border:0;border-radius:8px;background:none;color:#d8e8f5;font:500 15px/1 "Pretendard Variable",Pretendard,sans-serif;text-align:left;cursor:pointer;}',
    '.ip-root .ip-ddmenu button:hover,.ip-root .ip-ddmenu button.cur{background:rgba(0,136,255,.22);color:#fff;}',

    /* 패널편집 */
    '.dt-editing .ip-root .ip-mv,.ip-root.ip-edit-layout .ip-mv{cursor:grab!important;}',
    '.dt-editing .ip-root .ip-mv *,.ip-root.ip-edit-layout .ip-mv *{cursor:grab!important;}',
    '.dt-editing .ip-root .ip-mv:hover,.ip-root.ip-edit-layout .ip-mv:hover{outline:1px dashed rgba(var(--ip-acc),.8);outline-offset:3px;}',
    '.ip-root .ip-mv{transition:translate .35s ' + EASE + ';}',
    '.ip-root .ip-mv.ip-front{z-index:20;}',
    '.ip-root .ip-mv.ip-dragging{z-index:30;filter:drop-shadow(0 14px 22px rgba(0,0,0,.5));cursor:grabbing!important;}',
    '.ip-root .ip-resetbtn{position:absolute;left:380px;top:104px;z-index:45;display:none;height:30px;padding:0 12px;border:1px solid rgb(var(--ip-acc));border-radius:8px;background:#06142c;color:#e6f7ff;font:500 13px/1 "Pretendard Variable",Pretendard,sans-serif;cursor:pointer;}',
    '.ip-root .ip-resetbtn:hover{filter:brightness(1.25);box-shadow:0 0 12px rgba(var(--ip-acc),.6);}',
    '.dt-editing .ip-root .ip-resetbtn,.ip-root.ip-edit-layout .ip-resetbtn{display:block;}',
    '.dt-editing .ip-root [data-name]{animation-play-state:paused!important;}',
    '.ip-root .ip-swapped > *:not(.ip-chart):not(.ip-chartbtn):not(.ip-chartmenu){visibility:hidden!important;}',
    '.ip-root .ip-chost{position:absolute;z-index:6;pointer-events:auto;}',
    '.ip-root .ip-hidekids > *:not(.ip-chost):not(.ip-chartbtn):not(.ip-chartmenu):not([data-name="Header"]):not([data-name="Status"]):not([data-name="Toolbar"]){visibility:hidden!important;}',
    '.ip-root .ip-chart{border-radius:inherit;z-index:2;}',
    '.ip-root .ip-chartbtn{position:absolute;top:10px;right:16px;z-index:46;}',
    '.ip-root .ip-chartmenu{top:36px;right:14px;z-index:47;}',
    '.ip-root [data-name="Event Log"] .ip-chartbtn{top:22px;right:660px;}',
    '.ip-root [data-name="Event Log"] .ip-chartmenu{top:48px;right:660px;}',
    '.ip-root :has(> .ip-chartmenu.open){z-index:50!important;}',
    '.ip-root .ip-chartbtn{position:absolute;top:-11px;right:14px;z-index:25;display:none;align-items:center;gap:4px;height:22px;padding:0 9px;border:1px solid rgb(var(--ip-acc));background:#06264a;color:#e6f7ff;font:500 12px/1 Pretendard,system-ui,sans-serif;cursor:pointer;white-space:nowrap;}',
    '.ip-root .ip-chartbtn:hover{filter:brightness(1.25);box-shadow:0 0 12px rgba(var(--ip-acc),.6);}',
    '.dt-editing .ip-root .ip-chartbtn,.dt-content-editing .ip-root .ip-chartbtn,.ip-root.ip-edit-layout .ip-chartbtn{display:inline-flex;}',
    '.ip-root .ip-chartmenu{position:absolute;top:14px;right:14px;z-index:40;min-width:208px;padding:5px;border:1px solid #2a7ca0;background:#071a30;color:#c7ecf4;font:400 13px/1.35 Pretendard,system-ui,sans-serif;box-shadow:0 12px 28px rgba(0,0,0,.5);opacity:0;translate:0 -4px;pointer-events:none!important;transition:opacity .16s ease,translate .16s ease;}',
    '.ip-root .ip-chartmenu.open{opacity:1;translate:0 0;pointer-events:auto!important;}',
    '.ip-root .ip-chartmenu .hd{padding:4px 8px 6px;font-size:11px;color:#8ea6b3;white-space:nowrap;}',
    '.ip-root .ip-chartmenu button{display:flex;align-items:center;gap:8px;width:100%;padding:6px 8px;border:0;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer!important;white-space:nowrap;}',
    '.ip-root .ip-chartmenu button:hover{background:rgba(var(--ip-acc),.14);color:#fff;}',
    '.ip-root .ip-chartmenu button.cur{background:rgba(9,182,251,.26);color:#fff;}',
    '.ip-root .ip-chartmenu .ic{width:18px;height:14px;flex:none;}',
    '.ip-root .ip-chartmenu .rec{margin-left:auto;padding:1px 6px;background:rgb(var(--ip-acc));color:#03202e;font-size:10px;font-weight:700;}',
    '.ip-root .ip-chartmenu .sep{height:1px;margin:4px 2px;background:rgba(199,236,244,.16);}',
    '.ip-root .ip-chart{position:absolute;inset:0;display:flex;flex-direction:column;padding:10px 14px 8px;background:linear-gradient(180deg,rgba(14,32,54,.97),rgba(12,26,46,.97));box-shadow:inset 0 0 0 1px rgba(42,124,160,.75);color:#c7ecf4;font:400 12px/1.3 Pretendard,system-ui,sans-serif;animation:ipIn .35s ease;}',
    '.ip-root .ip-chart .pl,.ip-root .ip-chart .lg,.ip-root .ip-chart .ct i,.ip-root .ip-chart .ct b{filter:hue-rotate(var(--ip-chue,0deg));}',
    '.ip-root .ip-chart .ct{display:flex;align-items:center;gap:6px;font-weight:500;font-size:15px;color:#fff;white-space:nowrap;}',
    '.ip-root .ip-chart .ct i{display:block;width:8px;height:8px;background:#2a7ca0;flex:none;}',
    '.ip-root .ip-chart .ct b{margin-left:auto;font-family:Tomorrow,Pretendard,sans-serif;font-weight:400;font-size:18px;color:#00ffd2;}',
    '.ip-root .ip-chart .ct b small{font:400 11px Pretendard,sans-serif;color:#8ea6b3;margin-left:3px;}',
    '.ip-root .ip-chart .lg{display:flex;gap:10px;margin-top:3px;font-size:11px;color:#8ea6b3;white-space:nowrap;}',
    '.ip-root .ip-chart .lg span{display:inline-flex;align-items:center;gap:4px;}',
    '.ip-root .ip-chart .lg span:before{content:"";width:9px;height:3px;background:var(--c);}',
    '.ip-root .ip-chart .pl{position:relative;flex:1;min-height:0;margin-top:6px;}',
    '.ip-root .ip-chart svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;}',
    '.ip-root .ip-chart .ax{fill:#8ea6b3;font-size:11px;font-family:Pretendard,system-ui,sans-serif;}',
    '.ip-root .ip-chart .gl{stroke:rgba(142,166,179,.16);stroke-width:1;shape-rendering:crispEdges;}',
    '.ip-root .ip-chart .bars{position:absolute;inset:0 0 16px;display:flex;align-items:flex-end;justify-content:space-around;gap:8px;}',
    '.ip-root .ip-chart .bars > div{position:relative;flex:1;max-width:34px;height:100%;display:flex;align-items:flex-end;}',
    '.ip-root .ip-chart .bars i{display:block;width:100%;background:linear-gradient(180deg,var(--c),rgba(9,182,251,.18));transition:height .9s ' + EASE + ';}',
    '.ip-root .ip-chart .bars em{position:absolute;left:50%;translate:-50% 0;bottom:calc(var(--h) + 2px);font-style:normal;font-size:11px;color:#e6f7ff;white-space:nowrap;transition:bottom .9s ' + EASE + ';}',
    '.ip-root .ip-chart .bars u{position:absolute;left:50%;translate:-50% 0;bottom:-16px;text-decoration:none;font-size:11px;color:#8ea6b3;white-space:nowrap;}',
    '.ip-root .ip-chart .hb{display:flex;flex-direction:column;justify-content:space-around;height:100%;gap:3px;}',
    '.ip-root .ip-chart .hb > div{display:grid;grid-template-columns:72px 1fr 50px;align-items:center;gap:8px;font-size:12px;}',
    '.ip-root .ip-chart .hb s{position:relative;display:block;height:8px;background:rgba(142,166,179,.16);overflow:hidden;text-decoration:none;}',
    '.ip-root .ip-chart .hb s i{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,rgba(9,182,251,.5),var(--c));transition:width .9s ' + EASE + ';}',
    '.ip-root .ip-chart .hb b{text-align:right;color:#fff;font-weight:500;font-variant-numeric:tabular-nums;}',
    '.ip-root .ip-chart .arc{transition:stroke-dasharray .9s ' + EASE + ',stroke-dashoffset .9s ' + EASE + ';}',
    '.ip-root .ip-chart .gv{position:absolute;left:0;right:0;bottom:0;text-align:center;font-family:Tomorrow,Pretendard,sans-serif;font-size:22px;color:#00ffd2;}',
    '.ip-root .ip-chart .gv small{font:400 12px Pretendard,sans-serif;color:#8ea6b3;margin-left:2px;}',
    '.ip-root .ip-chart .dn{display:flex;align-items:center;gap:16px;height:100%;}',
    '.ip-root .ip-chart .dn .ring{position:relative;height:100%;aspect-ratio:1;flex:none;}',
    '.ip-root .ip-chart .dn .ring b{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Tomorrow,Pretendard,sans-serif;font-weight:400;font-size:17px;color:#fff;}',
    '.ip-root .ip-chart .dn .ring b small{font:400 10px Pretendard,sans-serif;color:#8ea6b3;}',
    '.ip-root .ip-chart .dn ul{list-style:none;display:flex;flex-direction:column;gap:4px;font-size:12px;min-width:0;flex:1;}',
    '.ip-root .ip-chart .dn li{display:flex;align-items:center;gap:6px;white-space:nowrap;}',
    '.ip-root .ip-chart .dn li:before{content:"";width:9px;height:3px;background:var(--c);flex:none;}',
    '.ip-root .ip-chart .dn li b{margin-left:auto;color:#fff;font-weight:500;font-variant-numeric:tabular-nums;}',
    /* 라이트 — 흰 판은 brightness 를 올려도 변화가 없어 살짝 눌러 보이게 한다 */
    '.ip-root[data-theme="light"] [data-name="Header"] [data-name^="Nav Item/"]:not([data-name$="(Active)"]):hover{filter:brightness(.85) drop-shadow(0 0 5px rgba(0,110,220,.35));}',
    '.ip-root[data-theme="light"] [data-name="Button/Menu"]:hover,.ip-root[data-theme="light"] [data-name="Button/Logout"]:hover{filter:brightness(.92) drop-shadow(0 0 5px rgba(0,110,220,.35));}',
    '.ip-root[data-theme="light"] [data-name^="Item/Site"]:hover,.ip-root[data-theme="light"] [data-name="Value Panel"] [data-name^="Item/"]:hover{background-color:rgba(0,110,220,.08);}',
    '.ip-root[data-theme="light"] [data-name="Event Log"] [data-name="List"] > [data-name^="Row/"]:hover,.ip-root[data-theme="light"] [data-name="Table"] > [data-name^="Row/"]:hover,.ip-root[data-theme="light"] [data-name="Widget/Sensor List"] [data-name="List"] > [data-name^="Row/"]:hover,.ip-root[data-theme="light"] [data-name="Widget/Equipment Search"] [data-name="List"] > [data-name^="Row/"]:hover{background-color:rgba(0,110,220,.07)!important;}',
    '.ip-root[data-theme="light"] [data-name^="Count/"]:hover,.ip-root[data-theme="light"] [data-name^="Chip/"]:hover,.ip-root[data-theme="light"] [data-name^="Option/"]:not([data-name$="(Active)"]):hover{filter:brightness(.94);}',
    '.ip-root[data-theme="light"] [data-name="Drawer/Full Menu"] [data-name^="Nav Item/"]:not([data-name$="(Active)"]):hover{background-color:rgba(0,60,140,.06);}',
    '.ip-root[data-theme="light"] [data-name="Button/Close"]:hover{filter:brightness(.8);}',
    '.ip-root[data-theme="light"] [data-name="Value Panel"] .ip-sel > p{color:#0b1d33!important;}',
    '.ip-root[data-theme="light"] [data-name="Value Panel"] .ip-unsel > p{color:#5a6c82!important;}',
    '.ip-root[data-theme="light"] .ip-toast,.ip-root[data-theme="light"] .ip-ddmenu{background:#fff;color:#15253a;border-color:#3b9be0;box-shadow:0 8px 22px rgba(30,60,100,.16);}',
    '.ip-root[data-theme="light"] .ip-ddmenu button{color:#2c3e54;}',
    '.ip-root[data-theme="light"] .ip-ddmenu button:hover,.ip-root[data-theme="light"] .ip-ddmenu button.cur{background:rgba(0,110,220,.1);color:#0b1d33;}',
    '.ip-root[data-theme="light"] .ip-mv.ip-dragging{filter:drop-shadow(0 14px 22px rgba(30,60,100,.22));}',
    '.ip-root[data-theme="light"] .ip-resetbtn{background:#fff;color:#15253a;}',
    '.ip-root[data-theme="light"] .ip-chart{background:#fff;box-shadow:inset 0 0 0 1px #d9e2ea;color:#2c3e54;}',
    '.ip-root[data-theme="light"] .ip-chart .ct{color:#15253a;}',
    '.ip-root[data-theme="light"] .ip-chartbtn{background:#fff;color:#0a6ea8;box-shadow:0 2px 6px rgba(30,60,100,.14);}',
    '.ip-root[data-theme="light"] .ip-chart .ct b,.ip-root[data-theme="light"] .ip-chart .gv{color:#0060b0;}',
    '.ip-root[data-theme="light"] .ip-chart .ct b small,.ip-root[data-theme="light"] .ip-chart .gv small,.ip-root[data-theme="light"] .ip-chart .lg,.ip-root[data-theme="light"] .ip-chart .bars u{color:#5a6c82;}',
    '.ip-root[data-theme="light"] .ip-chart .ax{fill:#5a6c82;}',
    '.ip-root[data-theme="light"] .ip-chart .bars em,.ip-root[data-theme="light"] .ip-chart .hb b,.ip-root[data-theme="light"] .ip-chart .dn b{color:#15253a;}',
    '.ip-root[data-theme="light"] .ip-chart .gl{stroke:#e4ebf1;}',
    '.ip-root[data-theme="light"] .ip-chartmenu{background:#fff;color:#2c3e54;border-color:#d9e2ea;box-shadow:0 8px 22px rgba(30,60,100,.14);}',
    '.ip-root[data-theme="light"] .ip-chartmenu button:hover,.ip-root[data-theme="light"] .ip-chartmenu button.cur{color:#15253a;}',
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
  function kid(el, name) { return el ? Array.prototype.filter.call(el.children, function (c) { return c.getAttribute('data-name') === name; })[0] : null; }
  function kidStart(el, pre) { return el ? Array.prototype.filter.call(el.children, function (c) { return (c.getAttribute('data-name') || '').indexOf(pre) === 0; }) : []; }
  function nm(el) { return (el && el.getAttribute('data-name')) || ''; }
  function editing() { return !!document.querySelector('.dtstage.dt-content-editing, .dtstage.dt-editing, .dt-content-editing, .dt-editing'); }
  function layoutEditing(root) { return !!(root.closest('.dt-editing') || root.classList.contains('ip-edit-layout')); }
  function idle() { return typeof window.__wembIdle === 'function' ? window.__wembIdle() : document.hidden; }
  function load(k) { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function comma(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  /* 사람이 고친 글자는 덮지 않는다 */
  function claimed(p) { return p.__ipLast != null && p.textContent !== p.__ipLast; }
  function write(p, s) {
    if (!p || p === document.activeElement || claimed(p)) return;
    if (p.textContent !== s) p.textContent = s;
    p.__ipLast = p.textContent;
  }
  function clickable(el, fn) {
    if (!el) return;
    el.classList.add('ip-click');
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
  function placed(el) { if (el) el.classList.add('ip-place'); return el; }
  function goto(scene) {
    if (window.__gotoIndparkScene) { window.__gotoIndparkScene(scene); return; }
    location.href = scene + '.html' + location.search;
  }
  function toast(st, msg) {
    var t = st.toast;
    if (!t) { t = st.toast = document.createElement('div'); t.className = 'ip-toast'; st.frame.appendChild(t); }
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(st.toastT);
    st.toastT = setTimeout(function () { t.classList.remove('on'); }, 1900);
  }
  function now() { return new Date(); }
  function stamp(d, two) { return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) + (two ? '  ' : ' ') + p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds()); }
  function swatchColor(item) {
    var s = one(item, '[data-name="Swatch"]');
    return s ? getComputedStyle(s).backgroundColor : '#00bbff';
  }

  /* ══════════════════ 1. 화면 맞추기 ══════════════════
     판이 16:9 보다 넓으면 exW, 높으면 exH 가 남는다 — 지도 · 이벤트 로그 · 패널 · 헤더가 나눠 가져 여백이 없다. */
  function installFit(root, st) {
    var frame = frameOf(root);
    frame.style.position = 'absolute';
    frame.style.left = '0';
    frame.style.top = '0';
    frame.style.transformOrigin = '0 0';
    st.frame = frame;
    st.S = 1; st.exW = 0; st.exH = 0;
    var header = kid(frame, 'Header');
    var hGap = header ? parseFloat(getComputedStyle(header).columnGap) || 441 : 0;
    var topBtns = kidStart(frame, 'Button/');
    var layout = kid(frame, 'Layout');
    var elog = layout && kid(layout, 'Event Log');
    var map = layout && kid(layout, 'Map'), labels = layout && kid(layout, 'Map Labels');
    var dim = kid(frame, 'Dim'), drawer = kid(frame, 'Drawer/Full Menu');
    var panel = kidStart(frame, 'Panel/')[0];
    var pHeadBg = panel && one(panel, ':scope > [data-name="Header"] > [data-name="Background"]');
    st.elog = elog; st.map = map; st.labels = labels; st.panel = panel; st.header = header;
    topBtns.forEach(placed);
    /* 이벤트 로그 — 가운데 정렬(left 50% + margin)이라 폭만 늘리면 된다. 메시지 칸은 폭이 박혀 있어 같이 늘린다 */
    var elW0 = elog ? elog.offsetWidth : 0, elM0 = elog ? parseFloat(getComputedStyle(elog).marginLeft) || 0 : 0;
    var wide = elog ? all(elog, '[data-name="List"] > [data-name^="Row/"],[data-name="Td/Message"],[data-name="Th/Message"]') : [];
    /* 패널 화면 — 메시지 칸 · 그 글자 */
    if (panel) wide = wide.concat(all(panel, '[data-name="Td/Message"],[data-name="Td/Message"] > p,[data-name="Th/Message"]'));
    wide.forEach(function (w) { w.__w0 = w.offsetWidth; });
    /* 센서현황 — 세로가 늘면 차트 판 · 눈금 · 격자도 같이 */
    var tall = panel ? all(panel, '[data-name="Widget/Sensor Trend"],[data-name="Widget/Sensor List"],[data-name="Y Axis"],[data-name="Grid"] > [data-name="Background"]') : [];
    tall.forEach(function (t) { t.__h0 = t.offsetHeight; });
    var xAxis = panel ? one(panel, '[data-name="X Axis"]') : null;
    var xMt0 = xAxis ? parseFloat(getComputedStyle(xAxis).marginTop) || 0 : 0;
    var gridLines = panel ? all(panel, '[data-name="Grid"] > [data-name="Grid Line"]').map(function (g) { return { g: g, mt: parseFloat(getComputedStyle(g).marginTop) || 0 }; }) : [];
    var gridBg = panel ? one(panel, '[data-name="Grid"] > [data-name="Background"]') : null;
    var gridH0 = gridBg ? gridBg.offsetHeight : 1;
    var lbls = labels ? kidStart(labels, 'Label/').map(function (l) { return { l: l, x: l.offsetLeft, y: l.offsetTop, w: l.offsetWidth, h: l.offsetHeight }; }) : [];
    lbls.forEach(function (o) { placed(o.l); });
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
      frame.style.willChange = Math.abs(S - 1) < 1e-4 ? 'transform' : 'auto';
      if (header) { header.style.width = (1870 + exW) + 'px'; header.style.columnGap = (hGap + exW / 2) + 'px'; }
      topBtns.forEach(function (b) { b.__fx = exW; place(b); });
      if (dim) { dim.style.width = VW + 'px'; dim.style.height = (VH + 8) + 'px'; }
      if (drawer) drawer.style.height = VH + 'px';
      wide.forEach(function (w) { w.style.width = (w.__w0 + exW) + 'px'; w.style.maxWidth = 'none'; });
      if (elog) { elog.style.width = (elW0 + exW) + 'px'; elog.style.marginLeft = (elM0 - exW / 2) + 'px'; }
      if (map) {
        var mw = 1536 + exW, mh = 720 + exH;
        map.style.width = mw + 'px'; map.style.height = mh + 'px';
        if (labels) {
          labels.style.width = mw + 'px'; labels.style.height = mh + 'px';
          /* 지도 그림은 cover 로 커진다 — 라벨을 그림 속 핀 자리(아래 가운데)에 맞춘다 */
          var k = Math.max(mw / 1536, mh / 720), ox = (mw - 1536 * k) / 2, oy = (mh - 720 * k) / 2;
          /* 판이 세로로 길면 cover 가 좌우를 크게 잘라 가장자리 라벨(다온테크)이 지도 밖으로 나갔다 →
             잘라 낼 자리를 가운데가 아니라 '라벨 다섯 개가 다 들어오는 자리'로 옮긴다(그림도 같은 만큼 옮긴다) */
          if (lbls.length) {
            var PAD = 14;
            var minL = Math.min.apply(null, lbls.map(function (o) { return o.x; })), maxR = Math.max.apply(null, lbls.map(function (o) { return o.x + o.w; }));
            var minT = Math.min.apply(null, lbls.map(function (o) { return o.y; })), maxB = Math.max.apply(null, lbls.map(function (o) { return o.y + o.h; }));
            var fit = function (o0, lo, hi, a0, a1, box) {
              var loL = PAD - a0 * k, hiL = box - PAD - a1 * k;                       /* 라벨 범위가 PAD 안쪽에 드는 o 의 범위 */
              var want = loL <= hiL ? Math.min(Math.max(o0, loL), hiL) : o0;          /* 둘 다는 못 맞추면 가운데 그대로 */
              return Math.min(hi, Math.max(lo, want));
            };
            ox = fit(ox, mw - 1536 * k, 0, minL, maxR, mw);
            oy = fit(oy, mh - 720 * k, 0, minT, maxB, mh);
          }
          var mimg = one(map, 'img');
          if (mimg) mimg.style.objectPosition = ox.toFixed(1) + 'px ' + oy.toFixed(1) + 'px';
          lbls.forEach(function (o) {
            var cx = ox + (o.x + o.w / 2) * k, by = oy + (o.y + o.h) * k;
            o.l.__fx = cx - o.w / 2 - o.x; o.l.__fy = by - o.h - o.y; place(o.l);
            /* 그림 속 라벨도 k 배로 커졌다 — 덮는 라벨도 같은 배율(아래 가운데 = 핀 꼭지 기준) */
            o.l.style.transformOrigin = '50% 100%';
            o.l.style.scale = Math.abs(k - 1) < 1e-3 ? '' : k.toFixed(4);
          });
        }
      }
      if (panel) {
        panel.style.width = (1870 + exW) + 'px';
        panel.style.height = (960 + exH) + 'px';
        if (pHeadBg) pHeadBg.style.width = (1872 + exW) + 'px';
        tall.forEach(function (t) { t.style.height = (t.__h0 + exH) + 'px'; });
        if (xAxis) xAxis.style.marginTop = (xMt0 + exH) + 'px';
        var kk = (gridH0 + exH) / gridH0;
        gridLines.forEach(function (o) { o.g.style.marginTop = (o.mt * kk) + 'px'; });
      }
      (st.onLayout || []).forEach(function (f) { try { f(); } catch (e) { } });
    }
    var rsT = 0;
    function relayout() {
      root.classList.add('ip-resizing');
      layoutFn();
      clearTimeout(rsT);
      rsT = setTimeout(function () { root.classList.remove('ip-resizing'); }, 140);
    }
    st.onLayout = [];
    layoutFn();
    st.layout = layoutFn;
    if (window.ResizeObserver) { st.ro = new ResizeObserver(relayout); st.ro.observe(root); }
    else { st.onResize = relayout; window.addEventListener('resize', relayout); }
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('ip-live'); }); });
  }

  /* ══════════════════ 2. 시계 · 최근 시각 ══════════════════ */
  var WEEK = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  function installClock(root, st) {
    var hd = st.header;
    if (!hd) return;
    var d = one(hd, '[data-name="Date"] [data-name="Value"]'), w = one(hd, '[data-name="Date"] [data-name="Weekday"]'), t = one(hd, '[data-name="Time"]');
    function tick() {
      var n = now();
      write(d, n.getFullYear() + '/ ' + p2(n.getMonth() + 1) + '/ ' + p2(n.getDate()));
      write(w, WEEK[n.getDay()]);
      write(t, p2(n.getHours()) + ':' + p2(n.getMinutes()) + ':' + p2(n.getSeconds()));
    }
    tick();
    st.timers.push(setInterval(tick, 1000));
  }
  /* 발생시각 — 표 전체를 '방금'으로 옮긴다(줄 사이 간격은 원본 그대로). 이 시안은 날짜와 시각 사이가 두 칸이라
     한 칸으로 읽힌 뒤 다시 두 칸으로 돌려놓는다 */
  function restampGroup(cells) {
    if (!cells.length || !window.wembRestampTimes) return;
    var two = cells.map(function (p) { return /\d\s{2}\d/.test(p.textContent); });
    cells.forEach(function (p) { p.textContent = p.textContent.replace(/(\d)\s{2,}(\d)/, '$1 $2'); });
    window.wembRestampTimes(cells);
    cells.forEach(function (p, i) { if (two[i]) p.textContent = p.textContent.replace(/(\d{4}-\d{2}-\d{2}) (\d)/, '$1  $2'); p.__ipLast = p.textContent; });
  }
  function installRecent(root, st) {
    restampGroup(all(root, '[data-name="Event Log"] [data-name="Td/Occurred At"] p'));
    restampGroup(all(root, '[data-name="Widget/Event Status"] [data-name="Td/Occurred At"] p'));
    restampGroup(all(root, '[data-name^="Panel/"] [data-name="Table"] [data-name="Td/Occurred At"] p'));
    /* 히스토리 기간 — 끝 = 오늘, 시작 = 7일 전 */
    var a = one(root, '[data-name="Input/Start"] p'), b = one(root, '[data-name="Input/End"] p');
    if (a && b) {
      var n = now(), s = new Date(n.getTime() - 7 * 86400000);
      write(a, s.getFullYear() + '-' + p2(s.getMonth() + 1) + '-' + p2(s.getDate()));
      write(b, n.getFullYear() + '-' + p2(n.getMonth() + 1) + '-' + p2(n.getDate()));
    }
  }

  /* ══════════════════ 3. 선택 상태 — 원본 두 상태의 모양을 그대로 오간다 ══════════════════ */
  function selectIn(list, target, origSel) {
    list.forEach(function (x) {
      var on = x === target;
      x.classList.toggle('ip-sel', on && x !== origSel);
      x.classList.toggle('ip-unsel', !on && x === origSel);
    });
  }
  function isSel(el) { return /\(Active\)$/.test(nm(el)) || el.classList.contains('ip-sel') || getComputedStyle(el).boxShadow.indexOf('33, 229, 255') >= 0; }
  /* 체크 — 켠 것 · 끈 것 한 장씩에서 판 · 그림을 읽어 두고 그대로 바꾼다 */
  function installChecks(root, st) {
    var cbs = all(root, '[data-name^="Checkbox/"]');
    if (!cbs.length) return;
    var on0 = cbs.filter(function (c) { return /\(Active\)/.test(nm(c)); })[0], off0 = cbs.filter(function (c) { return !/\(Active\)/.test(nm(c)); })[0];
    if (!on0 || !off0) return;
    function look(c) {
      var cs = getComputedStyle(c), box = one(c, '[data-name="Box"] img'), chk = one(c, '[data-name="Check"] img');
      return { bg: cs.backgroundColor, filter: cs.filter, shadow: cs.boxShadow, box: box && box.getAttribute('src'), chk: chk && chk.getAttribute('src') };
    }
    var ON = look(on0), OFF = look(off0);
    function setLook(c, L, on) {
      c.style.backgroundColor = L.bg; c.style.filter = L.filter; c.style.boxShadow = L.shadow;
      c.classList.toggle('ip-cbon', on);
      var box = one(c, '[data-name="Box"] img'), chk = one(c, '[data-name="Check"] img');
      if (box && L.box) box.setAttribute('src', L.box);
      if (chk && L.chk) chk.setAttribute('src', L.chk);
    }
    var state0 = cbs.map(function (c) { return /\(Active\)/.test(nm(c)); });
    cbs.forEach(function (c, i) {
      c.__on = state0[i];
      clickable(c, function () { c.__on = !c.__on; setLook(c, c.__on ? ON : OFF, c.__on); });
    });
    clickable(one(root, '[data-name="Button/Reset"]'), function () {
      cbs.forEach(function (c, i) { c.__on = state0[i]; setLook(c, c.__on ? ON : OFF, c.__on); });
      toast(st, '설비 검색 조건을 초기화했습니다');
    });
    /* 체크 켠 경계는 ::after 테두리 — 끈 것에 켜면 같은 색 테두리를 덧그린다 */
    var bc = getComputedStyle(on0, '::after').borderColor || '#21e5ff';
    st.cbStyle = document.createElement('style');
    st.cbStyle.textContent = '.' + st.px + '-root .ip-cbon:not([data-name$="(Active)"])::after{content:"";position:absolute;inset:0;border:1px solid ' + bc + ';border-radius:16px;pointer-events:none;}'
      + '.' + st.px + '-root [data-name$="(Active)"][data-name^="Checkbox/"]:not(.ip-cbon)::after{border-color:transparent!important;}';
    document.head.appendChild(st.cbStyle);
  }

  /* ══════════════════ 4. 화면 잇기 ══════════════════ */
  var NAV_TO = { 'Operation Overview': 'main', 'Sensor Status': 'sensor', 'Event Status': 'event' };
  function installNav(root, st) {
    /* 로고 자리 — '색 정하기'에서 로고를 올렸을 때만 원래 로고 위에 그 그림이 뜬다(js/templates/image.js TPLLOGO.DOM_CUSTOM) */
    try { if (typeof TPLLOGO !== 'undefined' && TPLLOGO.apply) TPLLOGO.apply(); } catch (e) { }
    all(root, '[data-name="Header"] [data-name="Nav"] > [data-name^="Nav Item/"],[data-name="Drawer/Full Menu"] [data-name^="Nav Item/"]').forEach(function (n) {
      var key = nm(n).replace('Nav Item/', '').replace(' (Active)', '');
      var to = NAV_TO[key];
      clickable(n, function () { if (to && to !== st.scene) goto(to); else if (st.scene === 'menu') goto('main'); });
    });
    clickable(one(root, '[data-name="Button/Menu"]'), function () { goto(st.scene === 'menu' ? 'main' : 'menu'); });
    clickable(one(root, '[data-name="Button/Logout"]'), function () { toast(st, '로그아웃 — 시안에 로그인 화면이 없습니다'); });
    /* 전체 메뉴 · 팝업 닫기 */
    all(root, '[data-name="Drawer/Full Menu"] [data-name="Button/Close"],[data-name="Popup/Sensor Info"] [data-name="Button/Close"]').forEach(function (b) {
      clickable(b, function () { goto('main'); });
    });
    clickable(kid(st.frame, 'Dim'), function () { goto('main'); });
    /* 지도 라벨 → 3D 사업장 */
    all(root, '[data-name="Map Labels"] > [data-name^="Label/"]').forEach(function (l, i) {
      l.style.setProperty('--i', i);
      clickable(l, function () { goto('site'); });
    });
    /* 사업장 목록 — 메인에서는 그 사업장 3D 로, 3D 에서는 고른 칸만 바꾼다 */
    var sites = all(root, '[data-name="Widget/Site List"] [data-name^="Item/Site"]');
    var site0 = sites.filter(function (s) { return /\(Active\)/.test(nm(s)); })[0];
    sites.forEach(function (s) {
      clickable(s, function () {
        selectIn(sites, s, site0);
        if (st.scene === 'main' || st.scene === 'menu') setTimeout(function () { goto('site'); }, 220);
      });
    });
    /* 설비 표 — 진동 · 온도 센서는 센서 정보 팝업, 가스 · 산소는 센서현황 */
    all(root, '[data-name="Widget/Equipment Search"] [data-name="List"] > [data-name^="Row/"]').forEach(function (r) {
      clickable(r, function () {
        var t = r.textContent;
        goto(/진동/.test(t) ? 'vibration' : /온도|열감지/.test(t) ? 'heat' : 'sensor');
      });
    });
    /* 3D — 바탕을 누르면 가까이(지게차 충돌감시) · 다시 누르면 멀리 */
    if (st.scene === 'site' || st.scene === 'forklift') {
      st.frame.addEventListener('click', function (e) {
        if (editing() || e.target !== st.frame && !e.target.closest('[aria-hidden]')) return;
        goto(st.scene === 'site' ? 'forklift' : 'site');
      });
      st.frame.classList.add('ip-click');
      all(st.frame, ':scope > *').forEach(function (c) { if (c.getAttribute('aria-hidden') == null) c.style.cursor = 'auto'; });
    }
    var evac = one(root, '[data-name="Button/Evacuation Route"]'), fk = one(root, '[data-name="Button/Forklift Collision"]');
    clickable(evac, function () { evac.classList.toggle('ip-on'); toast(st, evac.classList.contains('ip-on') ? '대피로를 표시합니다' : '대피로 표시를 껐습니다'); });
    clickable(fk, function () { fk.classList.toggle('ip-on'); toast(st, fk.classList.contains('ip-on') ? '지게차 충돌 감시 구역을 강조합니다' : '지게차 충돌 감시 강조를 껐습니다'); });
    /* 실시간 / 히스토리 */
    all(root, '[data-name="Toggle/Mode"] [data-name^="Option/"]').forEach(function (o) {
      var to = /History/.test(nm(o)) ? 'history' : 'event';
      clickable(o, function () { if (to !== st.scene) goto(to); });
    });
    /* 위치 고르기 */
    var loc = one(root, '[data-name^="Panel/"] [data-name="Field/Location"],[data-name="Widget/Sensor List"] [data-name="Field/Location"]');
    if (loc) installDropdown(root, st, loc);
    /* 검색 */
    all(root, '[data-name="Button/Search"],[data-name="Search Field"] [data-name="Icon/Search"],[data-name="Search"] [data-name="Icon/Search"]').forEach(function (b) {
      clickable(b, function () { toast(st, '검색 조건으로 다시 불러왔습니다'); shakeTable(root); });
    });
    /* 쪽 넘기기 */
    var pg = one(root, '[data-name="Pagination"]');
    if (pg) {
      var pages = all(pg, '[data-name^="Page/"]');
      var go = function (i) {
        pages.forEach(function (p, k) { p.classList.toggle('ip-pgon', k === i); p.classList.toggle('ip-pgoff', k !== i); });
        shakeTable(root);
      };
      st.pgStyle = document.createElement('style');
      var actBg = pages[0] ? getComputedStyle(pages[0]).backgroundColor : '#08f', offBg = pages[1] ? getComputedStyle(pages[1]).backgroundColor : 'transparent';
      st.pgStyle.textContent = '.' + st.px + '-root .ip-pgon{background-color:' + actBg + '!important;}.' + st.px + '-root .ip-pgoff{background-color:' + offBg + '!important;}';
      document.head.appendChild(st.pgStyle);
      pages.forEach(function (p, i) { clickable(p, function () { go(i); }); });
      ['Button/Prev', 'Button/First'].forEach(function (n) { clickable(one(pg, '[data-name="' + n + '"]'), function () { go(0); }); });
      ['Button/Next', 'Button/Last'].forEach(function (n) { clickable(one(pg, '[data-name="' + n + '"]'), function () { go(pages.length - 1); }); });
    }
  }
  function shakeTable(root) {
    all(root, '[data-name^="Panel/"] [data-name="Table"] > [data-name^="Row/"],[data-name="Widget/Sensor List"] [data-name="List"] > [data-name^="Row/"]').forEach(function (r, i) {
      r.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 380, delay: i * 22, easing: 'cubic-bezier(.22,.8,.24,1)', fill: 'backwards' });
    });
  }
  function installDropdown(root, st, field) {
    var val = one(field, '[data-name="Value"]') || one(field, '[data-name="Select"] p');
    if (!val) return;
    var opts = ['전체', '가온케미칼', '누리정밀', '해솔소재', '다온테크', '한결화성'];
    if (st.scene === 'sensor') opts = opts.slice(1);
    var menu = document.createElement('div');
    menu.className = 'ip-ddmenu';
    st.frame.appendChild(menu);
    function render() { menu.innerHTML = opts.map(function (o) { return '<button type="button"' + (o === val.textContent.trim() ? ' class="cur"' : '') + '>' + esc(o) + '</button>'; }).join(''); }
    clickable(field, function () {
      render();
      var a = field.getBoundingClientRect(), b = st.frame.getBoundingClientRect(), S = st.S || 1;
      menu.style.left = ((a.left - b.left) / S + (a.width / S) - 220) + 'px';
      menu.style.top = ((a.bottom - b.top) / S + 6) + 'px';
      menu.style.minWidth = '220px';
      menu.classList.toggle('open');
    });
    menu.addEventListener('click', function (e) {
      var bt = e.target.closest('button');
      if (!bt) return;
      e.stopPropagation();
      val.textContent = bt.textContent; val.__ipLast = val.textContent;
      menu.classList.remove('open');
      shakeTable(root);
      toast(st, '위치: ' + bt.textContent);
    });
    st.onDdDown = function (e) { if (!menu.contains(e.target) && !field.contains(e.target)) menu.classList.remove('open'); };
    document.addEventListener('pointerdown', st.onDdDown, true);
  }

  /* ══════════════════ 5. 이벤트 로그 — 접기 · 자동 · 필터 · 확인 · 새 이벤트 ══════════════════ */
  var POOL = [
    ['진동센서 #212', '누리정밀', '진동센서', '진동 9.8 mm/s, 주의 단계 진입', 'Major'],
    ['온도센서 #031', '해솔소재', '온도센서', '표면 온도 82.1℃, 경보 기준(80℃) 초과', 'Critical'],
    ['가스센서 #104', '가온케미칼', '가스센서', 'H2S 9 ppm, 주의 기준 근접', 'Minor'],
    ['지게차 FL-02', '가온케미칼', '지게차', '보행자 통로 진입 감지', 'Warning'],
    ['산소센서 #118', '다온테크', '산소센서', 'O2 19.4 %, 하한 기준 근접', 'Minor'],
    ['CCTV-B07', '누리정밀', 'CCTV', '안전모 미착용 작업자 감지', 'Warning'],
    ['진동센서 #208', '누리정밀', '진동센서', '진동 7.6 mm/s, 주의 단계', 'Minor'],
    ['가스센서 #112', '한결화성', '가스센서', 'CO 34 ppm, 주의 단계', 'Major'],
  ];
  function gradeOf(r) {
    var b = one(r, '[data-name^="Badge/"]');
    var n = b ? nm(b) : '';
    return /Critical/.test(n) ? 'Critical' : /Major/.test(n) ? 'Major' : /Minor/.test(n) ? 'Minor' : /Warning/.test(n) ? 'Warning' : 'Normal';
  }
  function installEventLog(root, st) {
    var el = st.elog;
    if (el) {
      var fold = load(K_FOLD);
      var h0 = el.offsetHeight;
      var btn = one(el, '[data-name="Icon/Info"]');
      var setOpen = function (open, quiet) {
        el.style.height = (open ? h0 : EL_SHUT) + 'px';
        el.classList.toggle('ip-shut', !open);
        st.open = open;
        if (!quiet) { fold[st.scene] = open; save(K_FOLD, fold); }
      };
      setOpen(fold[st.scene] != null ? !!fold[st.scene] : true, true);
      clickable(btn, function () { setOpen(!st.open); });
      var tg = one(el, '[data-name="Toggle/Auto"]');
      clickable(tg, function () { tg.classList.toggle('ip-off'); st.autoOff = tg.classList.contains('ip-off'); toast(st, st.autoOff ? '자동 갱신을 멈췄습니다' : '자동 갱신을 다시 켭니다'); });
    }
    /* 등급 칩 — 누른 등급만 보이게(다시 누르면 전체). 이벤트 로그 · 팝업 이벤트 현황 · 이벤트 현황 화면 공통 */
    var groups = [];
    if (el) groups.push({ chips: all(el, '[data-name^="Count/"]'), list: one(el, '[data-name="List"]'), rowSel: ':scope > [data-name^="Row/"]', box: el });
    all(root, '[data-name="Widget/Event Status"]').forEach(function (w) { groups.push({ chips: all(w, '[data-name^="Count/"]'), list: one(w, '[data-name="Table"]'), rowSel: ':scope > [data-name^="Row/"]', box: w }); });
    var pt = one(root, '[data-name^="Panel/"] [data-name="Table"]');
    if (pt) groups.push({ chips: all(root, '[data-name="Filter/Fault Grade"] [data-name^="Chip/"]'), list: pt, rowSel: ':scope > [data-name^="Row/"]', box: pt, multi: true });
    groups.forEach(function (g) {
      var want = null, on = {};
      var rows = function () { return all(g.list, g.rowSel); };
      var filter = function () {
        rows().forEach(function (r) {
          var gr = gradeOf(r);
          var hide = g.multi ? (Object.keys(on).length && !on[gr]) : (!!want && gr !== want);
          r.classList.toggle('ip-hide', !!hide);
        });
        g.chips.forEach(function (c) {
          var gname = nm(c).replace(/^(Count|Chip)\//, '');
          c.classList.toggle('ip-dim', g.multi ? (Object.keys(on).length > 0 && !on[gname]) : (!!want && gname !== want && gname !== 'All'));
        });
      };
      g.filter = filter;
      g.chips.forEach(function (c) {
        clickable(c, function () {
          var gname = nm(c).replace(/^(Count|Chip)\//, '');
          if (gname === 'All') want = null;
          else if (g.multi) { if (on[gname]) delete on[gname]; else on[gname] = 1; }
          else want = want === gname ? null : gname;
          filter();
        });
      });
      /* 이벤트 줄 → 그 센서 팝업 */
      if (g.list) g.list.addEventListener('click', function (e) {
        if (editing()) return;
        var r = e.target.closest('[data-name^="Row/"]');
        if (!r || !g.list.contains(r)) return;
        r.classList.remove('ip-acked');
        var t = r.textContent;
        if (g.box === el && /진동/.test(t)) goto('vibration');
        else if (g.box === el && /온도|열감지/.test(t)) goto('heat');
      });
    });
    st.evGroups = groups;
    clickable(el && one(el, '[data-name="Button/Ack"]'), function () {
      var r = all(el, '[data-name="List"] > [data-name^="Row/"]').filter(function (x) { return !x.classList.contains('ip-acked'); })[0];
      if (r) r.classList.add('ip-acked');
      toast(st, '가장 최근 이벤트를 확인 처리했습니다');
    });
    clickable(el && one(el, '[data-name="Button/Ack All"]'), function () {
      all(el, '[data-name="List"] > [data-name^="Row/"]').forEach(function (r) { r.classList.add('ip-acked'); });
      toast(st, '이벤트를 모두 확인 처리했습니다');
    });
    /* 새 이벤트 — 원본 줄을 복제해 맨 위에, 발생시각은 지금 */
    var feedOne = function (list, max) {
      var rs = all(list, ':scope > [data-name^="Row/"]');
      var src = rs[0];
      if (!src || claimed(src)) return;
      var ev = POOL[Math.floor(Math.random() * POOL.length)];
      var r = src.cloneNode(true);
      r.classList.remove('ip-hide', 'ip-acked');
      r.removeAttribute('id');
      all(r, '[id]').forEach(function (x) { x.removeAttribute('id'); });
      var put = function (col, v) { var p = one(r, '[data-name="Td/' + col + '"] p') || one(r, 'p[data-name="Td/' + col + '"]'); if (p) { p.textContent = v; p.__ipLast = v; } };
      var tm = one(r, '[data-name="Td/Occurred At"] p');
      if (tm) { tm.textContent = stamp(now(), /\d\s{2}\d/.test(tm.textContent)); tm.__ipLast = tm.textContent; }
      put('Device', ev[0]); put('Location', ev[1]); put('Device Type', ev[2]); put('Message', ev[3]);
      var no = one(r, '[data-name="Td/No"] p');
      list.insertBefore(r, list.firstChild);
      all(list, ':scope > [data-name^="Row/"]').forEach(function (x, i) { var q = one(x, '[data-name="Td/No"] p'); if (q) { q.textContent = String(i + 1); q.__ipLast = q.textContent; } });
      void no;
      r.classList.add('ip-new');
      setTimeout(function () { r.classList.remove('ip-new'); }, 1700);
      var ls = all(list, ':scope > [data-name^="Row/"]');
      if (ls.length > max) ls[ls.length - 1].remove();
    };
    var lists = [];
    if (el) lists.push({ l: one(el, '[data-name="List"]'), max: 10, counts: el });
    if (pt && st.scene === 'event') lists.push({ l: pt, max: 15 });
    function feed() {
      st.feed = setTimeout(feed, rnd(15000, 28000));
      if (idle() || editing() || st.autoOff) return;
      lists.forEach(function (o) { if (o.l) feedOne(o.l, o.max); });
      groups.forEach(function (g) { g.filter && g.filter(); });
      if (el) bumpCount(el, 'Normal');
    }
    if (lists.length) st.feed = setTimeout(feed, rnd(8000, 14000));
  }
  /* ══════════════════ 5-1. 스크롤 목록 — 막대가 그려진 목록을 실제로 스크롤 ══════════════════
     Figma 에는 막대(Scrollbar · Thumb)만 그려져 있고 목록은 보이는 만큼만 있다(이벤트 로그 3행 · 설비 목록 4행 · 값 칸 6칸).
     ① 넘칠 만큼 같은 꼴의 가상 행을 잇는다(이벤트 로그 = 지난 이벤트, 설비 목록 = 같은 산단 센서, 값 칸 = 범례의 나머지 센서)
     ② 막대를 목록 스크롤과 묶는다 — 휠 · 막대 끌기 · 트랙 누르기, 막대 길이 = 보이는 비율. 브라우저 기본 막대는 숨긴다. */
  var LOG_BACK = [
    ['가스센서 #104', '가온케미칼', '가스센서', 'H2S 8 ppm, 주의 기준 근접', 'Minor'],
    ['지게차 FL-07', '다온테크', '지게차', '보행자 통로 진입 감지', 'Warning'],
    ['진동센서 #208', '누리정밀', '진동센서', '진동 7.9 mm/s, 주의 단계', 'Major'],
    ['산소센서 #118', '다온테크', '산소센서', 'O2 19.2 %, 하한 기준 근접', 'Minor'],
    ['CCTV-C11', '해솔소재', 'CCTV', '출입 제한구역 접근 감지', 'Warning'],
  ];
  var SENSOR_MORE = [['진동센서 #208', '누리정밀'], ['가스센서 #109', '한결화성'], ['온도센서 #027', '해솔소재'], ['산소센서 #121', '다온테크'], ['진동센서 #215', '누리정밀'], ['가스센서 #112', '한결화성']];
  function cleanClone(src) {
    var r = src.cloneNode(true);
    r.removeAttribute('id');
    all(r, '[id]').forEach(function (x) { x.removeAttribute('id'); });
    r.classList.remove('ip-hide', 'ip-acked', 'ip-new', 'ip-sel', 'ip-on');
    return r;
  }
  function setText(p, v) { if (p) { p.textContent = v; p.__ipLast = v; } }
  function parseStamp(s) {
    var m = /(\d{4})-(\d\d)-(\d\d)\s+(\d\d):(\d\d):(\d\d)/.exec(s || '');
    return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]) : null;
  }
  /* 행 채우기 — installNav 보다 먼저(새 행에도 클릭 · 이동이 붙게) */
  function installScrollFill(root, st) {
    var el = st.elog, elist = el && one(el, '[data-name="List"]');
    if (elist) {
      var rs = all(elist, ':scope > [data-name^="Row/"]'), last = rs[rs.length - 1];
      if (last && rs.length < 8) {
        if (!elist.style.height) elist.style.height = elist.offsetHeight + 'px';
        var tp = one(last, '[data-name="Td/Occurred At"] p');
        var two = tp && /\d\s{2}\d/.test(tp.textContent);
        var t = (tp && parseStamp(tp.textContent)) || new Date(Date.now() - 3600e3);
        LOG_BACK.forEach(function (ev) {
          var r = cleanClone(last);
          t = new Date(t.getTime() - rnd(3, 11) * 60e3 - rnd(0, 59) * 1e3);
          setText(one(r, '[data-name="Td/Occurred At"] p'), stamp(t, two));
          [['Device', ev[0]], ['Location', ev[1]], ['Device Type', ev[2]], ['Message', ev[3]]].forEach(function (c) {
            setText(one(r, '[data-name="Td/' + c[0] + '"] p') || one(r, 'p[data-name="Td/' + c[0] + '"]'), c[1]);
          });
          /* 등급 구슬 — 같은 등급 건수 칩의 구슬 그림을 쓴다 */
          var bd = one(r, '[data-name^="Badge/"]'), sw = one(el, '[data-name="Count/' + ev[4] + '"] [data-name="Badge/' + ev[4] + '"] img');
          if (bd && sw) { bd.setAttribute('data-name', 'Badge/' + ev[4]); var bi = one(bd, 'img'); if (bi) bi.src = sw.src; }
          elist.appendChild(r);
        });
        all(elist, ':scope > [data-name^="Row/"]').forEach(function (x, i) { x.setAttribute('data-name', 'Row/' + (i + 1)); setText(one(x, '[data-name="Td/No"] p'), String(i + 1)); });
      }
    }
    var sl = one(root, '[data-name="Widget/Equipment Search"] [data-name="Table"] [data-name="Body"] > [data-name="List"]');
    if (sl) {
      var rows = all(sl, ':scope > [data-name^="Row/"]');
      if (rows.length >= 2 && rows.length < 6) {
        if (!sl.style.height) sl.style.height = sl.offsetHeight + 'px';
        var tmpl = rows[rows.length - 2], tail = rows[rows.length - 1];
        SENSOR_MORE.forEach(function (s) {
          var r = cleanClone(tmpl);
          var ps = all(r, 'p');
          setText(ps[0], s[0]); setText(ps[1], s[1]);
          sl.insertBefore(r, tail);
        });
        all(sl, ':scope > [data-name^="Row/"]').forEach(function (x, i) { x.setAttribute('data-name', 'Row/' + (i + 1)); });
      }
    }
  }
  /* 값 칸 늘리기 · 막대 묶기 — 라이브 차트 다음(차트는 앞의 다섯 칸에만 선을 잇는다) */
  function installScroll(root, st) {
    st.mos = st.mos || [];
    all(root, '[data-name="Widget/Sensor Trend"]').forEach(function (w) {
      /* 진동 팝업은 Value Panel > List + 막대, 온도 팝업은 막대 없이 Value Panel 에 칸이 바로 잘려 있다 → 그 판 자체를 휠로 스크롤 */
      var vp = one(w, '[data-name="Value Panel"]'), vl = vp && (one(vp, '[data-name="List"]') || vp);
      var lg = all(w, '[data-name="Legend"] [data-name^="Item/"]');
      if (!vl || !lg.length) return;
      var items = all(vl, ':scope > [data-name^="Item/"]');
      if (items.length >= lg.length || !items.length) return;
      if (!vl.style.height) vl.style.height = vl.offsetHeight + 'px';
      if (vl === vp) vl.classList.add('ip-scroll');
      /* 복제 원본은 다섯 번째 칸(보통 모양). 여섯 번째 칸은 Figma 에서 이름이 겹친 사본('Item/Vibration 5')이라
         흐린 글자 · 파란 바탕이 섞여 있다 — 스크롤하면 그 칸만 튀어 보여서, 같은 글자로 보통 모양 칸을 새로 만든다 */
      var src = items[Math.min(4, items.length - 1)];
      items.slice(5).forEach(function (old, k) {
        var r = cleanClone(src);
        var lab0 = (one(old, '[data-name="Label"]') || {}).textContent || '';
        var lp0 = one(r, '[data-name="Label"] p') || one(r, 'p[data-name="Label"]') || one(r, '[data-name="Label"]');
        if (lp0) setText(lp0, lab0.trim());
        setText(all(r, 'p').pop(), (all(old, 'p').pop() || {}).textContent || '');
        /* 색은 범례의 같은 자리 색(사본 칸은 다섯 번째 칸 색을 그대로 물고 있었다) */
        var so = one(lg[5 + k] || old, '[data-name="Swatch"]'), sn = one(r, '[data-name="Swatch"]');
        if (so && sn) sn.style.backgroundColor = getComputedStyle(so).backgroundColor;
        old.parentNode.replaceChild(r, old);
      });
      items = all(vl, ':scope > [data-name^="Item/"]');
      var parse = function (it) { var p = all(it, 'p').pop(), m = /^\s*([\d.]+)\s*(.*)$/.exec(p ? p.textContent : ''); return m ? { v: +m[1], u: m[2], d: m[1].indexOf('.') >= 0 ? m[1].split('.')[1].length : 0 } : null; };
      var kind = function (s) { return String(s || '').replace(/\d+\s*$/, '').trim(); };
      var base = {};
      items.forEach(function (it) { var k = kind((one(it, '[data-name="Label"] p') || one(it, '[data-name="Label"]') || {}).textContent); var q = parse(it); if (q) (base[k] = base[k] || []).push(q); });
      var extra = [];
      lg.slice(items.length).forEach(function (li, i) {
        var lab = (one(li, '[data-name="Label"]') || {}).textContent || '';
        lab = lab.trim();
        var k = kind(lab), peers = (base[k] || base[Object.keys(base)[0]] || []).slice().sort(function (a, b) { return a.v - b.v; });
        var med = peers.length ? peers[Math.floor(peers.length / 2)] : { v: 1, u: '', d: 1 };
        var r = cleanClone(src);
        r.setAttribute('data-name', 'Item/' + (lab || ('Sensor ' + (items.length + i + 1))));
        var lp = one(r, '[data-name="Label"] p') || one(r, 'p[data-name="Label"]') || one(r, '[data-name="Label"]');
        if (lp) setText(lp, lab);
        var s0 = one(li, '[data-name="Swatch"]'), s1 = one(r, '[data-name="Swatch"]');
        if (s0 && s1) s1.style.backgroundColor = getComputedStyle(s0).backgroundColor;
        var v = med.v * rnd(0.82, 1.18);
        var vp2 = all(r, 'p').pop();
        var o = { p: vp2, v: v, b: v, u: med.u, d: med.d };
        setText(vp2, v.toFixed(o.d) + (o.u ? ' ' + o.u : ''));
        vl.appendChild(r);
        extra.push(o);
      });
      /* 늘린 칸도 2초마다 조금씩 흐른다(앞 다섯 칸은 라이브 차트가 쓴다) */
      st.timers.push(setInterval(function () {
        if (idle() || editing()) return;
        extra.forEach(function (o) {
          o.v = clamp(o.v + (o.b - o.v) * 0.2 + rnd(-1, 1) * Math.max(o.b * 0.025, Math.pow(10, -o.d)), o.b * 0.8, o.b * 1.2);
          if (o.p && !claimed(o.p)) write(o.p, o.v.toFixed(o.d) + (o.u ? ' ' + o.u : ''));
        });
      }, 2000));
    });
    all(root, '[data-name="Scrollbar"]').forEach(function (sb) {
      var par = sb.parentElement, list = par && kid(par, 'List');
      var th = one(sb, '[data-name="Thumb"]');
      if (!list || !th) return;
      list.classList.add('ip-scroll');
      sb.classList.add('ip-sb'); th.classList.add('ip-sbthumb');
      var cs = getComputedStyle(sb), pt = parseFloat(cs.paddingTop) || 0, pb = parseFloat(cs.paddingBottom) || 0;
      var t0 = th.offsetTop, h0 = th.offsetHeight;
      var geo = function () {
        var inner = sb.clientHeight - pt - pb, sh = list.scrollHeight, ch = list.clientHeight;
        var thH = sh > ch + 1 ? Math.max(18, Math.round(inner * ch / sh)) : h0;
        return { inner: inner, thH: thH, range: Math.max(0, inner - thH), max: Math.max(0, sh - ch) };
      };
      var raf = 0;
      var upd = function () {
        raf = 0;
        var g = geo();
        th.style.height = g.thH + 'px';
        th.style.transform = 'translateY(' + (pt + (g.max ? list.scrollTop / g.max * g.range : 0) - t0).toFixed(1) + 'px)';
        sb.classList.toggle('ip-sb-off', !g.max);
      };
      var req = function () { if (!raf) raf = requestAnimationFrame(upd); };
      list.addEventListener('scroll', req, { passive: true });
      sb.addEventListener('wheel', function (e) { list.scrollTop += e.deltaY; e.preventDefault(); }, { passive: false });
      var scaleOf = function () { return (sb.getBoundingClientRect().height / (sb.offsetHeight || 1)) || 1; };
      th.addEventListener('pointerdown', function (e) {
        if (layoutEditing(root)) return;
        e.preventDefault(); e.stopPropagation();
        var y0 = e.clientY, s0 = list.scrollTop, g = geo(), S = scaleOf();
        th.classList.add('ip-grab');
        try { th.setPointerCapture(e.pointerId); } catch (err) { }
        var mv = function (ev) { list.scrollTop = s0 + (ev.clientY - y0) / S * (g.range ? g.max / g.range : 0); };
        var up = function () { th.classList.remove('ip-grab'); th.removeEventListener('pointermove', mv); th.removeEventListener('pointerup', up); th.removeEventListener('pointercancel', up); };
        th.addEventListener('pointermove', mv); th.addEventListener('pointerup', up); th.addEventListener('pointercancel', up);
      });
      sb.addEventListener('pointerdown', function (e) {
        if (e.target === th || th.contains(e.target) || layoutEditing(root)) return;
        e.preventDefault(); e.stopPropagation();
        var r = th.getBoundingClientRect();
        list.scrollBy({ top: (e.clientY < r.top ? -1 : 1) * list.clientHeight * 0.9, behavior: 'smooth' });
      });
      if (window.MutationObserver) {
        var mo = new MutationObserver(req);
        mo.observe(list, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
        st.mos.push(mo);
      }
      st.onLayout.push(req);
      upd();
    });
  }

  function bumpCount(box, g) {
    var c = one(box, '[data-name="Count/' + g + '"] [data-name="Value"]');
    if (c && !claimed(c)) write(c, String((parseInt(c.textContent, 10) || 0) + 1));
  }

  /* ══════════════════ 6. 라이브 차트 — 센서 추이선 ══════════════════
     Figma 의 'Data' 그림(정지 화면)을 그대로 두고, 같은 자리 · 같은 색 · 같은 눈금으로 흐르는 선을 그 위에 그린다. */
  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  /* 원본 선(Data 그림)과 눈금의 자리 — 화면 맞추기(installFit)가 차트 칸을 늘리기 **전에** 잰다.
     늘린 뒤에 재면 그림(고정 크기)과 눈금(늘어남)이 어긋나, 원본 선이 엉뚱한 값으로 읽히고 끝에서 뚝 떨어졌다(센서현황, 판이 세로로 길 때 · 2026-11-13) */
  function chartGeo(root, st) {
    var fr = frameOf(root), S0 = fr ? ((fr.getBoundingClientRect().width / fr.offsetWidth) || 1) : 1;
    all(root, '[data-name="Line Chart"]').forEach(function (lc) {
      var plot = one(lc, '[data-name="Plot"]'), data = one(lc, '[data-name="Data"]'), ya = one(lc, '[data-name="Y Axis"]');
      var dimg = data && (one(data, 'img') || data), ticks = ya ? all(ya, 'p') : [];
      if (!plot || !dimg || ticks.length < 2) return;
      var pr = plot.getBoundingClientRect(), ir = dimg.getBoundingClientRect();
      var t0 = ticks[0].getBoundingClientRect(), t1 = ticks[ticks.length - 1].getBoundingClientRect();
      lc.__ipGeo = { ib: { x: (ir.left - pr.left) / S0, y: (ir.top - pr.top) / S0, w: ir.width / S0, h: ir.height / S0 },
        yTop: (t0.top + t0.height / 2 - pr.top) / S0, yBot: (t1.top + t1.height / 2 - pr.top) / S0 };
    });
  }
  function installLiveCharts(root, st) {
    st.lines = [];
    all(root, '[data-name="Line Chart"]').forEach(function (lc, ci) {
      var plot = one(lc, '[data-name="Plot"]'), data = one(lc, '[data-name="Data"]');
      var bg = one(lc, '[data-name="Grid"] > [data-name="Background"]'), ya = one(lc, '[data-name="Y Axis"]');
      var area = lc.parentElement;
      while (area && !one(area, '[data-name="Value Panel"]')) area = area.parentElement;
      var vp = area && one(area, '[data-name="Value Panel"]');
      if (!plot || !data || !bg || !ya || !vp) return;
      var items = all(vp, '[data-name^="Item/"]').slice(0, 5);
      var ticks = all(ya, 'p');
      if (ticks.length < 2 || !items.length) return;
      var vTop = parseFloat(ticks[0].textContent), vBot = parseFloat(ticks[ticks.length - 1].textContent);
      var series = items.map(function (it, i) {
        var vt = all(it, 'p').pop(), m = /^\s*([\d.]+)\s*(.*)$/.exec(vt ? vt.textContent : '');
        var v = m ? parseFloat(m[1]) : 0;
        return { it: it, p: vt, unit: m ? m[2] : '', dec: m && m[1].indexOf('.') >= 0 ? m[1].split('.')[1].length : 0, v: v, base: v, col: swatchColor(it), seed: 7000 + ci * 50 + i };
      });
      /* 경보선 — 같은 단위 중 다른 값들 평균의 2.5배를 넘는 것은 최근 몇 시간 동안 올라온 선으로 */
      series.forEach(function (s) {
        var peers = series.filter(function (q) { return q !== s && q.unit === s.unit; });
        var avg = peers.length ? peers.reduce(function (a, q) { return a + q.v; }, 0) / peers.length : s.v;
        s.alarm = peers.length && s.v > avg * 2.2;
        s.base = s.alarm ? avg * 1.15 : s.v;
        s.flat = /%/.test(s.unit) && s.v > 15;
      });
      var N = 145;
      series.forEach(function (s) {
        var R = rng(s.seed), a = [], e = 0, amp = s.flat ? 0.08 : Math.max(s.base * 0.12, 0.2);
        for (var i = 0; i < N; i++) {
          var h = i / (N - 1) * 24, op = (h > 7.5 && h < 19) ? 1 : 0.35;
          e = e * 0.82 + (R() - 0.5) * amp * 1.4;
          var v = s.flat ? s.base + 0.08 * Math.sin(h / 24 * Math.PI * 4) + e * 0.5 : s.base * (0.82 + 0.18 * op) + amp * 0.8 * Math.sin((h - 6) / 24 * 2 * Math.PI) * op + e;
          if (s.alarm && h > 17) v += (s.v - s.base) * Math.pow((h - 17) / 7, 1.6);
          a.push(v);
        }
        var d = s.v - a[N - 1];
        for (var j = N - 12; j < N; j++) a[j] += d * ((j - (N - 12)) / 11);
        s.a = a; s.amp = amp;
      });
      var NS = 'http://www.w3.org/2000/svg';
      var svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('class', 'ip-live-data');
      plot.appendChild(svg);
      var lines = series.map(function (s) {
        var pl = document.createElementNS(NS, 'polyline');
        pl.setAttribute('fill', 'none'); pl.setAttribute('stroke', s.col); pl.setAttribute('stroke-width', '2');
        pl.setAttribute('stroke-linejoin', 'round'); pl.setAttribute('stroke-linecap', 'round');
        svg.appendChild(pl);
        s.pl = pl;
        return pl;
      });
      var box = null;
      function measure() {
        var S = (st.frame.getBoundingClientRect().width / st.frame.offsetWidth) || 1;
        var pr = plot.getBoundingClientRect(), br = bg.getBoundingClientRect();
        var t0 = ticks[0].getBoundingClientRect(), t1 = ticks[ticks.length - 1].getBoundingClientRect();
        box = { x: (br.left - pr.left) / S + 1, y: (br.top - pr.top) / S, w: br.width / S - 2, h: br.height / S,
          yTop: (t0.top + t0.height / 2 - pr.top) / S, yBot: (t1.top + t1.height / 2 - pr.top) / S };
        svg.style.left = '0px'; svg.style.top = '0px';
        svg.setAttribute('width', plot.offsetWidth); svg.setAttribute('height', plot.offsetHeight);
        svg.setAttribute('viewBox', '0 0 ' + plot.offsetWidth + ' ' + plot.offsetHeight);
      }
      var shift = 0, last = performance.now(), STEP = 2000;
      function Y(v) { return box.yBot - (Math.max(0, v) - vBot) / (vTop - vBot) * (box.yBot - box.yTop); }
      function draw() {
        if (!box) measure();
        var dx = box.w / (N - 2);
        series.forEach(function (s) {
          var pts = [];
          for (var i = 0; i < N; i++) { var x = box.x + (i - shift) * dx; if (x < box.x - 0.5) continue; pts.push(x.toFixed(1) + ',' + Y(s.a[i]).toFixed(1)); }
          s.pl.setAttribute('points', pts.join(' '));
        });
      }
      function step() {
        series.forEach(function (s) {
          var lastV = s.a[N - 1];
          var target = s.v + (s.base - s.v) * 0.0;
          var nv = lastV + (target - lastV) * 0.25 + rnd(-1, 1) * s.amp * (s.fromOrig ? 1.6 : s.flat ? 0.5 : 0.9);
          if (s.fromOrig) nv = clamp(nv, s.v - s.amp * 6 - Math.abs(s.v) * 0.04, s.v + s.amp * 6 + Math.abs(s.v) * 0.04);
          else if (s.alarm) nv = clamp(nv, s.v * 0.9, s.v * 1.12);
          else nv = clamp(nv, s.base * 0.6, s.base * 1.45);
          s.a.shift(); s.a.push(nv);
          if (s.p && !claimed(s.p)) write(s.p, nv.toFixed(s.dec) + (s.unit ? ' ' + s.unit.replace(/^\s+/, '') : ''));
        });
      }
      /* 지난 24시간 선은 **원본 그대로** — Figma 'Data' 그림(svg)의 선 5개를 읽어 같은 색 선에 옮긴다
         (교대 시간 07:30 · 19:30 의 단차, 경보선이 끝에서 치솟는 모양까지). 그다음부터 2초마다 한 칸씩 흐른다.
         새 점의 흔들림은 원본 선의 이웃 점 차이(평균)만큼 — 원본보다 더 출렁이거나 납작해지지 않게. */
      var dimg = one(data, 'img') || data;
      var S0 = (st.frame.getBoundingClientRect().width / st.frame.offsetWidth) || 1;
      var pr0 = plot.getBoundingClientRect(), ir0 = dimg.getBoundingClientRect();
      var ib = { x: (ir0.left - pr0.left) / S0, y: (ir0.top - pr0.top) / S0, w: ir0.width / S0, h: ir0.height / S0 };
      var g0 = lc.__ipGeo;
      if (g0) ib = g0.ib;
      var src = dimg.getAttribute && dimg.getAttribute('src');
      data.classList.add('ip-src-hidden');
      measure(); draw();
      if (src && window.fetch && window.DOMParser && ib.w > 0 && ib.h > 0) {
        fetch(src).then(function (r) { return r.ok ? r.text() : ''; }).then(function (txt) {
          if (!txt) return;
          if (!box) measure();
          var doc = new DOMParser().parseFromString(txt, 'image/svg+xml');
          var sv = doc.documentElement, vb = (sv.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number);
          if (vb.length < 4 || !vb[2] || !vb[3]) return;
          var paths = [].slice.call(doc.querySelectorAll('path[stroke]'));
          /* 색 짝짓기 — 값 칸 색(계산값 rgb(…), 라이트 · 색 정하기로 조금 달라질 수 있다)에 가장 가까운 원본 선 */
          var rgbOf = function (c) {
            c = String(c || '').trim();
            var m = /^#([0-9a-f]{6})$/i.exec(c);
            if (m) { var n = parseInt(m[1], 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
            m = /rgba?\(([^)]+)\)/.exec(c);
            return m ? m[1].split(',').slice(0, 3).map(Number) : null;
          };
          var used = [];
          series.forEach(function (s) {
            var want = rgbOf(s.col), p = null, bestD = 1e9;
            if (!want) return;
            paths.forEach(function (q) {
              if (used.indexOf(q) >= 0) return;
              var c = rgbOf(q.getAttribute('stroke')); if (!c) return;
              var dd = Math.pow(c[0] - want[0], 2) + Math.pow(c[1] - want[1], 2) + Math.pow(c[2] - want[2], 2);
              if (dd < bestD) { bestD = dd; p = q; }
            });
            if (!p || bestD > 90 * 90 * 3) return;
            used.push(p);
            /* d 를 점 목록으로(M · L · H · V 만 쓴다 — Figma 선 내보내기 꼴) */
            var tk = (p.getAttribute('d') || '').match(/[MLHVZ]|-?\d*\.?\d+(?:e-?\d+)?/gi) || [];
            var pts = [], cx = 0, cy = 0, cmd = 'M';
            for (var k = 0; k < tk.length;) {
              if (/^[MLHVZ]$/i.test(tk[k])) { cmd = tk[k].toUpperCase(); k++; continue; }
              if (cmd === 'H') { cx = +tk[k++]; } else if (cmd === 'V') { cy = +tk[k++]; } else { cx = +tk[k++]; cy = +tk[k++]; }
              pts.push([cx, cy]);
            }
            if (pts.length < 8) return;
            var x0 = pts[0][0], x1 = pts[pts.length - 1][0];
            var a = [];
            for (var i = 0; i < N; i++) {
              var xs = x0 + (x1 - x0) * i / (N - 1), j = 1;
              while (j < pts.length - 1 && pts[j][0] < xs) j++;
              var A = pts[j - 1], B = pts[j], t = B[0] === A[0] ? 0 : (xs - A[0]) / (B[0] - A[0]);
              var yy = A[1] + (B[1] - A[1]) * Math.max(0, Math.min(1, t));
              var yPlot = ib.y + yy / vb[3] * ib.h;
              var gT = g0 ? g0.yTop : box.yTop, gB = g0 ? g0.yBot : box.yBot;
              a.push(vBot + (gB - yPlot) / (gB - gT) * (vTop - vBot));
            }
            /* 끝점은 값 칸의 숫자와 같게(마지막 열두 칸에 고르게 나눠 맞춘다) */
            var d = s.v - a[N - 1];
            for (var j2 = N - 12; j2 < N; j2++) a[j2] += d * ((j2 - (N - 12)) / 11);
            var diff = 0;
            for (var q = 1; q < N; q++) diff += Math.abs(a[q] - a[q - 1]);
            s.a = a;
            s.amp = Math.max((vTop - vBot) * 0.002, diff / (N - 1) * 1.1);
            s.fromOrig = true;
          });
          draw();
        }).catch(function () {});
      }
      st.onLayout.push(function () { box = null; });
      var raf = 0;
      var frame = function (t) {
        raf = requestAnimationFrame(frame);
        if (idle() || editing()) { last = t; return; }
        shift = Math.min(1, (t - last) / STEP);
        if (t - last >= STEP) { last = t; shift = 0; step(); }
        draw();
      };
      raf = requestAnimationFrame(frame);
      st.lines.push({ dispose: function () { cancelAnimationFrame(raf); svg.remove(); data.classList.remove('ip-src-hidden'); } });
      /* 값 칸 — 누르면 그 선을 강조(원본의 '고른 칸' 모양 그대로) */
      var allItems = all(vp, '[data-name^="Item/"]');
      var sel0 = allItems.filter(isSel)[0];
      allItems.forEach(function (it) {
        clickable(it, function () {
          selectIn(allItems, it, sel0);
          var s = series.filter(function (q) { return q.it === it; })[0];
          svg.classList.toggle('ip-focusing', !!s);
          series.forEach(function (q) { q.pl.classList.toggle('ip-focus', q === s); });
        });
      });
      /* 범례 — 누르면 그 선을 껐다 켠다 */
      var legend = area && one(area, '[data-name="Legend"]');
      all(legend, '[data-name^="Item/"]').forEach(function (li, i) {
        clickable(li, function () {
          li.classList.toggle('ip-mute');
          var s = series[i];
          if (s) s.pl.classList.toggle('ip-mute', li.classList.contains('ip-mute'));
        });
      });
    });
    /* 센서현황 — 왼쪽 센서 줄을 고르면 위 이름 칸이 바뀌고 추이가 새로 들어온다 */
    var list = one(root, '[data-name="Widget/Sensor List"] [data-name="List"]');
    if (list) {
      var rows = all(list, ':scope > [data-name^="Row/"]'), r0 = rows.filter(isSel)[0];
      var name = one(root, '[data-name="Field/Sensor Name"] [data-name="Value"]');
      rows.forEach(function (r, i) {
        clickable(r, function () {
          selectIn(rows, r, r0);
          var id = (one(r, '[data-name="Td/Sensor Name"] p') || r).textContent.trim();
          if (name) { write(name, id + ' (10.21.2.' + (200 + i * 3 + 1) + ')'); name.classList.remove('ip-blinkin'); void name.offsetWidth; name.classList.add('ip-blinkin'); }
          all(root, '.ip-live-data').forEach(function (s) { s.animate([{ opacity: 0.15 }, { opacity: 1 }], { duration: 520, easing: 'ease-out' }); });
        });
      });
    }
  }

  /* ══════════════════ 7. 차트 바꾸기(패널편집) ══════════════════ */
  var KIND_ICON = {
    line: '<svg class="ic" viewBox="0 0 18 14"><polyline points="1,11 5,7 9,9 13,3 17,5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    area: '<svg class="ic" viewBox="0 0 18 14"><path d="M1 11 5 6 9 8 13 3 17 5V13H1Z" fill="currentColor" opacity=".45"/><polyline points="1,11 5,6 9,8 13,3 17,5" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>',
    bar: '<svg class="ic" viewBox="0 0 18 14"><rect x="2" y="6" width="3" height="7" fill="currentColor"/><rect x="7.5" y="2" width="3" height="11" fill="currentColor"/><rect x="13" y="8" width="3" height="5" fill="currentColor"/></svg>',
    hbar: '<svg class="ic" viewBox="0 0 18 14"><rect x="1" y="2" width="14" height="2.6" fill="currentColor"/><rect x="1" y="6" width="9" height="2.6" fill="currentColor"/><rect x="1" y="10" width="12" height="2.6" fill="currentColor"/></svg>',
    gauge: '<svg class="ic" viewBox="0 0 18 14"><path d="M2 12a7 7 0 0 1 14 0" fill="none" stroke="currentColor" stroke-width="2" opacity=".35"/><path d="M2 12a7 7 0 0 1 11-5.7" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    donut: '<svg class="ic" viewBox="0 0 18 14"><circle cx="9" cy="7" r="5" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="20 12" /></svg>',
    orig: '<svg class="ic" viewBox="0 0 18 14"><path d="M4 4h10v7H4z" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M4 4 2 2" stroke="currentColor" stroke-width="1.4"/></svg>',
  };
  var KIND_NAME = { line: '라인', area: '영역', bar: '막대', hbar: '가로 막대', gauge: '게이지', donut: '도넛' };

  function makeChart(host, spec) {
    var el = document.createElement('div');
    el.className = 'ip-chart';
    var timers = [], raf = 0;
    var title = '<div class="ct"><i></i>' + esc(spec.t) + '<b class="cv"></b></div>';
    function fmt(x, d) { return d != null ? x.toFixed(d) : (Math.abs(x) < 10 && x % 1 ? x.toFixed(1) : comma(x)); }
    var baseOf = function (i) { return spec.vals ? spec.vals[i] : spec.v[0]; };
    var jitOf = function (i) { return spec.vals ? Math.max(spec.vals[i] * 0.07, spec.dec ? 0.002 : 1) : spec.v[1]; };
    if (spec.k === 'line' || spec.k === 'area') {
      var N = 32;
      var data = spec.series.map(function (s) {
        var a = [], v = s[2];
        for (var i = 0; i < N; i++) { v = clamp(v + rnd(-s[3], s[3]) * 0.7, s[2] - s[3] * 3, s[2] + s[3] * 3); a.push(v); }
        return a;
      });
      el.innerHTML = title + '<div class="lg">' + spec.series.map(function (s) { return '<span style="--c:' + s[1] + '">' + esc(s[0]) + '</span>'; }).join('') + '</div>'
        + '<div class="pl"><svg preserveAspectRatio="none"></svg></div>';
      var svg = el.querySelector('svg'), cv = el.querySelector('.cv');
      var shift = 0, last = performance.now(), STEP = 1400;
      var draw = function () {
        var w = svg.clientWidth || 200, h = svg.clientHeight || 80;
        var L = 34, R = 4, T = 3, B = 14;
        var X = function (i) { return L + (i - shift) * (w - L - R) / (N - 2); };
        var Y = function (v) { return T + (1 - (v - spec.lo) / (spec.hi - spec.lo)) * (h - T - B); };
        var s = '';
        for (var g = 0; g <= 2; g++) {
          var gv = spec.lo + (spec.hi - spec.lo) * g / 2, gy = Y(gv);
          s += '<line class="gl" x1="' + L + '" x2="' + (w - R) + '" y1="' + gy.toFixed(1) + '" y2="' + gy.toFixed(1) + '"/>';
          s += '<text class="ax" x="' + (L - 5) + '" y="' + (gy + 4).toFixed(1) + '" text-anchor="end">' + (spec.dec ? gv.toFixed(2) : comma(gv)) + '</text>';
        }
        var d0 = new Date();
        for (var tl = 0; tl < 4; tl++) {
          var tx = L + (w - L - R) * (tl + 0.5) / 4;
          var tt = new Date(d0.getTime() - (3 - tl) * (N / 4) * STEP);
          s += '<text class="ax" x="' + tx.toFixed(1) + '" y="' + (h - 1) + '" text-anchor="middle">' + p2(tt.getHours()) + ':' + p2(tt.getMinutes()) + ':' + p2(tt.getSeconds()) + '</text>';
        }
        s += '<clipPath id="ipc' + spec.uid + '"><rect x="' + L + '" y="0" width="' + (w - L - R) + '" height="' + h + '"/></clipPath><g clip-path="url(#ipc' + spec.uid + ')">';
        data.forEach(function (a, si) {
          var col = spec.series[si][1];
          var pts = a.map(function (v, i) { return X(i).toFixed(1) + ',' + Y(v).toFixed(1); }).join(' ');
          if (spec.k === 'area' || si === 0) {
            s += '<defs><linearGradient id="ipg' + spec.uid + si + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + col + '" stop-opacity="' + (spec.k === 'area' ? .4 : .18) + '"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></linearGradient></defs>';
            s += '<polygon fill="url(#ipg' + spec.uid + si + ')" points="' + X(0).toFixed(1) + ',' + (h - B) + ' ' + pts + ' ' + X(N - 1).toFixed(1) + ',' + (h - B) + '"/>';
          }
          s += '<polyline fill="none" stroke="' + col + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" points="' + pts + '"/>';
        });
        s += '</g>';
        svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
        svg.innerHTML = s;
        cv.innerHTML = fmt(data[0][N - 1], spec.dec) + (spec.unit ? '<small>' + esc(spec.unit) + '</small>' : '');
      };
      var frame = function (t) {
        raf = requestAnimationFrame(frame);
        if (idle()) { last = t; return; }
        shift = Math.min(1, (t - last) / STEP);
        if (t - last >= STEP) {
          last = t; shift = 0;
          data.forEach(function (a, si) { var s = spec.series[si]; a.shift(); a.push(clamp(a[a.length - 1] + rnd(-s[3], s[3]), s[2] - s[3] * 3, s[2] + s[3] * 3)); });
        }
        draw();
      };
      raf = requestAnimationFrame(frame);
    } else if (spec.k === 'bar') {
      el.innerHTML = title + '<div class="pl"><div class="bars">' + spec.cats.map(function (c) {
        return '<div><i style="--c:' + spec.c + ';height:0"></i><em></em><u>' + esc(c) + '</u></div>';
      }).join('') + '</div></div>';
      var bars = Array.prototype.slice.call(el.querySelectorAll('.bars > div')), cv2 = el.querySelector('.cv');
      var tickB = function () {
        var sum = 0;
        bars.forEach(function (b, i) {
          var v = clamp(baseOf(i) + rnd(-jitOf(i), jitOf(i)), 0, spec.max);
          sum += v;
          var hpc = (v / spec.max * 100).toFixed(1) + '%';
          b.querySelector('i').style.height = hpc;
          b.style.setProperty('--h', hpc);
          b.querySelector('em').textContent = fmt(v, spec.dec != null ? spec.dec : 0);
        });
        cv2.innerHTML = spec.dec ? fmt(sum / bars.length, spec.dec) + '<small>' + esc(spec.unit) + ' 평균</small>' : comma(sum) + '<small>' + esc(spec.unit) + ' 합계</small>';
      };
      requestAnimationFrame(function () { requestAnimationFrame(tickB); });
      timers.push(setInterval(function () { if (!idle()) tickB(); }, 2600));
    } else if (spec.k === 'hbar') {
      el.innerHTML = title + '<div class="pl"><div class="hb">' + spec.cats.map(function (c) {
        return '<div><span>' + esc(c) + '</span><s><i style="--c:' + spec.c + ';width:0"></i></s><b></b></div>';
      }).join('') + '</div></div>';
      var rowsH = Array.prototype.slice.call(el.querySelectorAll('.hb > div')), cv3 = el.querySelector('.cv');
      var tickH = function () {
        var sum = 0;
        rowsH.forEach(function (r, i) {
          var v = clamp(baseOf(i) + rnd(-jitOf(i), jitOf(i)), 0, spec.max);
          sum += v;
          r.querySelector('i').style.width = (v / spec.max * 100).toFixed(1) + '%';
          r.querySelector('b').textContent = fmt(v, spec.dec != null ? spec.dec : 0);
        });
        cv3.innerHTML = spec.dec ? fmt(sum / rowsH.length, spec.dec) + '<small>' + esc(spec.unit) + ' 평균</small>' : comma(sum) + '<small>' + esc(spec.unit) + ' 합계</small>';
      };
      requestAnimationFrame(function () { requestAnimationFrame(tickH); });
      timers.push(setInterval(function () { if (!idle()) tickH(); }, 2800));
    } else if (spec.k === 'gauge') {
      var mn = spec.min || 0, R0 = 42, LEN = Math.PI * R0;
      el.innerHTML = title + '<div class="pl"><svg viewBox="0 0 100 58" preserveAspectRatio="xMidYMid meet">'
        + '<defs><linearGradient id="ipgg' + spec.uid + '" x1="0" x2="1"><stop offset="0" stop-color="#2a7ca0"/><stop offset="1" stop-color="' + spec.c + '"/></linearGradient></defs>'
        + '<path d="M8 52a42 42 0 0 1 84 0" fill="none" stroke="rgba(142,166,179,.2)" stroke-width="8"/>'
        + '<path class="arc" d="M8 52a42 42 0 0 1 84 0" fill="none" stroke="url(#ipgg' + spec.uid + ')" stroke-width="8" stroke-dasharray="0 ' + LEN.toFixed(1) + '"/>'
        + '</svg><div class="gv"></div></div>';
      var arc = el.querySelector('.arc'), gv = el.querySelector('.gv');
      var cur = spec.v[0];
      var tickG = function () {
        cur = clamp(cur + rnd(-spec.v[1], spec.v[1]) * 0.6, spec.v[0] - spec.v[1] * 2, spec.v[0] + spec.v[1] * 2);
        var k = clamp((cur - mn) / (spec.max - mn), 0, 1);
        arc.setAttribute('stroke-dasharray', (LEN * k).toFixed(1) + ' ' + LEN.toFixed(1));
        gv.innerHTML = fmt(cur, spec.dec) + '<small>' + esc(spec.unit) + '</small>';
      };
      requestAnimationFrame(function () { requestAnimationFrame(tickG); });
      timers.push(setInterval(function () { if (!idle()) tickG(); }, 2200));
    } else if (spec.k === 'donut') {
      var RR = 15.9155, CIRC = 100;
      el.innerHTML = title + '<div class="pl"><div class="dn"><div class="ring"><svg viewBox="0 0 42 42">'
        + '<circle cx="21" cy="21" r="' + RR + '" fill="none" stroke="rgba(142,166,179,.16)" stroke-width="6"/>'
        + spec.parts.map(function (p) { return '<circle class="arc" cx="21" cy="21" r="' + RR + '" fill="none" stroke="' + p[1] + '" stroke-width="6" stroke-dasharray="0 100" transform="rotate(-90 21 21)"/>'; }).join('')
        + '</svg><b></b></div><ul>' + spec.parts.map(function (p) { return '<li style="--c:' + p[1] + '">' + esc(p[0]) + '<b></b></li>'; }).join('') + '</ul></div></div>';
      var arcs = Array.prototype.slice.call(el.querySelectorAll('.arc')), lis = Array.prototype.slice.call(el.querySelectorAll('li b')), center = el.querySelector('.ring b');
      var vals = spec.parts.map(function (p) { return p[2]; });
      var tickD = function () {
        vals = vals.map(function (v) { return Math.max(1, Math.round(v * (1 + rnd(-0.03, 0.03)))); });
        var t = vals.reduce(function (s, v) { return s + v; }, 0) || 1, off = 0;
        arcs.forEach(function (a, i) {
          var len = vals[i] / t * CIRC;
          a.setAttribute('stroke-dasharray', Math.max(0, len - 0.8).toFixed(2) + ' ' + (CIRC - Math.max(0, len - 0.8)).toFixed(2));
          a.setAttribute('stroke-dashoffset', (-off).toFixed(2));
          off += len;
          lis[i].textContent = comma(vals[i]);
        });
        center.innerHTML = Math.round(vals[0] / t * 100) + '%<small>' + esc(spec.parts[0][0]) + '</small>';
      };
      requestAnimationFrame(function () { requestAnimationFrame(tickD); });
      timers.push(setInterval(function () { if (!idle()) tickD(); }, 3400));
    }
    host.appendChild(el);
    return { el: el, dispose: function () { cancelAnimationFrame(raf); timers.forEach(clearInterval); el.remove(); } };
  }


  function syncChartHue(root, probe) {
    var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(getComputedStyle(probe).color);
    if (!m) return;
    var r = +m[1], g = +m[2], b = +m[3], mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    if (!d) return;
    var h = (mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60;
    var rot = ((h - 208 + 540) % 360) - 180;
    root.style.setProperty('--ip-chue', (Math.abs(rot) < 3 ? 0 : Math.round(rot)) + 'deg');
  }

  var CC = { cy: '#00e5ff', bl: '#0088ff', gn: '#34d28d', ye: '#e8c819', or: '#ff8a00', re: '#f43130', gr: '#8e9aa8', vi: '#8a5cff' };
  var EV_SPECS = [
    { k: 'donut', t: '등급별 이벤트', parts: [['Critical', CC.re, 2], ['Major', CC.or, 3], ['Minor', CC.ye, 1], ['Warning', CC.cy, 6], ['Normal', CC.gr, 12]] },
    { k: 'bar', t: '사업장별 이벤트 건수', unit: '건', cats: ['가온케미칼', '누리정밀', '해솔소재', '다온테크', '한결화성'], vals: [4, 6, 5, 3, 2], max: 8, c: CC.bl },
    { k: 'line', t: '시간대별 경보 발생 추이', unit: '건', dec: 0, series: [['경보', CC.re, 3, 1], ['주의', CC.ye, 5, 1.2]], lo: 0, hi: 10 },
  ];
  function specsFor(scene) {
    var vib = scene === 'vibration', heat = scene === 'heat';
    var S = {
      'Event Log': EV_SPECS,
      'Widget/Site List': [
        { k: 'hbar', t: '사업장별 센서 수', unit: '대', cats: ['가온케미칼', '누리정밀', '해솔소재', '다온테크', '한결화성'], vals: [42, 38, 35, 27, 31], max: 50, c: CC.bl },
        { k: 'donut', t: '사업장별 가동 상태', parts: [['정상', CC.gn, 168], ['주의', CC.ye, 4], ['경보', CC.re, 2]] },
      ],
      'Widget/Equipment Search': [
        { k: 'donut', t: '설비 종류별 센서', parts: [['가스', CC.cy, 46], ['진동', CC.bl, 52], ['온도', CC.or, 41], ['산소', CC.gn, 34]] },
        { k: 'hbar', t: '센서 종류별 이상 건수', unit: '건', cats: ['가스센서', '진동센서', '온도센서', '산소센서'], vals: [3, 5, 4, 1], max: 8, c: CC.or },
      ],
    };
    if (vib || heat) {
      S['Widget/Sensor Trend'] = vib ? [
        { k: 'area', t: '진동 RMS 추이 (VB-212)', unit: 'mm/s', dec: 1, series: [['진동3', CC.gn, 12.4, 0.6], ['진동1', CC.bl, 2.4, 0.3]], lo: 0, hi: 16 },
        { k: 'bar', t: '측정점별 현재 진동', unit: 'mm/s', cats: ['진동1', '진동2', '진동3', '진동4', '진동5'], vals: [2.4, 1.9, 12.4, 3.1, 2.7], max: 16, c: CC.bl, dec: 1 },
        { k: 'gauge', t: '진동3 RMS (경보 10.0)', unit: 'mm/s', v: [12.4, 0.5], max: 16, c: CC.re, dec: 1 },
      ] : [
        { k: 'area', t: '표면 온도 추이 (TH-031)', unit: '℃', dec: 1, series: [['온도3', CC.gn, 87.6, 1.6], ['온도1', CC.bl, 41.2, 0.8]], lo: 0, hi: 100 },
        { k: 'bar', t: '측정점별 현재 온도', unit: '℃', cats: ['온도1', '온도2', '온도3'], vals: [41.2, 38.7, 87.6], max: 100, c: CC.or, dec: 1 },
        { k: 'gauge', t: '온도3 (경보 80℃)', unit: '℃', v: [87.6, 1.2], max: 120, c: CC.re, dec: 1 },
      ];
      S['Widget/Event Status'] = [
        { k: 'hbar', t: '설비별 이벤트 건수', unit: '건', cats: vib ? ['펌프 P-201', '펌프 P-202', '냉각팬 F-114', '압축기 C-301'] : ['열감지 TH-031', '열감지 TH-028', '건조기 D-12', '컨베이어 CV-3'], vals: [2, 1, 1, 1], max: 3, c: CC.bl },
        { k: 'donut', t: '등급별 이벤트', parts: [['Critical', CC.re, 1], ['Major', CC.or, 1], ['Minor', CC.ye, 1], ['Warning', CC.cy, 1], ['Normal', CC.gr, 1]] },
      ];
    }
    if (scene === 'event' || scene === 'history') S['Table'] = EV_SPECS.concat([{ k: 'hbar', t: '센서 종류별 경보', unit: '건', cats: ['CCTV', '가스센서', '진동센서', '온도센서', '산소센서', '지게차'], vals: [4, 3, 2, 2, 2, 2], max: 6, c: CC.cy }]);
    if (scene === 'sensor') {
      S['Widget/Sensor Trend'] = [
        { k: 'area', t: '진동 · 산소 추이 (VB-201)', unit: 'mm/s', dec: 1, series: [['진동3', CC.or, 3.4, 0.4], ['진동1', CC.bl, 2.3, 0.3]], lo: 0, hi: 6 },
        { k: 'bar', t: '측정점별 현재값', unit: '', cats: ['진동1', '진동2', '진동3', '산소1', '산소2'], vals: [2.3, 1.9, 3.4, 20.8, 20.6], max: 24, c: CC.bl, dec: 1 },
        { k: 'gauge', t: '산소 농도', unit: '%', v: [20.8, 0.1], max: 25, c: CC.gn, dec: 1 },
      ];
      S['Widget/Sensor List'] = [
        { k: 'donut', t: '센서 상태', parts: [['정상', CC.gn, 5], ['이상', CC.re, 1]] },
        { k: 'hbar', t: '센서별 최근 이상 건수', unit: '건', cats: ['VB-212', 'VB-201', 'VB-202', 'VB-215', 'OX-110', 'OX-111'], vals: [4, 1, 0.2, 1, 0.2, 0.2], max: 5, c: CC.or },
      ];
    }
    return S;
  }
  var chartUid = 0;
  function installChartSwap(root, st) {
    var savedAll = load(K_CHART), saved = savedAll[st.scene] || {};
    st.charts = {}; st.chartApply = {};
    var probe = document.createElement('i');
    probe.className = 'ip-probe';
    st.frame.appendChild(probe);
    var spec = specsFor(st.scene);
    var TG = [];
    Object.keys(spec).forEach(function (name) {
      var scope = name === 'Table' ? (one(root, '[data-name^="Panel/"]') || root) : root;
      var w = one(scope, '[data-name="' + name + '"]');
      if (!w || getComputedStyle(w).display === 'contents') return;
      /* 표 · 이벤트 로그는 그 판 안을 통째로, 위젯은 머리 · 상태 줄 아래만 */
      var area = name === 'Event Log' ? { l: 20, t: 61, r: 20, b: 18, hide: [] }
        : name === 'Table' ? null
          : name === 'Widget/Sensor Trend' ? { l: 15, t: name && st.scene === 'sensor' ? 54 : 54, r: 15, b: 15 }
            : name === 'Widget/Event Status' ? { l: 0, t: 40, r: 0, b: 0 }
              : name === 'Widget/Sensor List' ? { l: 0, t: 74, r: 0, b: 0 }
                : { l: 16, t: 60, r: 16, b: 16 };
      TG.push({ key: name, w: w, area: area, list: spec[name] });
    });
    TG.forEach(function (tg) {
      if (getComputedStyle(tg.w).position === 'static') tg.w.style.position = 'relative';
      var body;
      if (tg.area) {
        body = document.createElement('div');
        body.className = 'ip-chost';
        var a = tg.area;
        body.style.left = a.l + 'px'; body.style.top = a.t + 'px'; body.style.right = a.r + 'px'; body.style.bottom = a.b + 'px';
        body.style.display = 'none';
        tg.w.appendChild(body);
      } else body = tg.w;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ip-chartbtn';
      btn.innerHTML = KIND_ICON.bar.replace('class="ic"', 'class="ic" style="width:13px;height:11px"') + '차트';
      btn.title = '이 패널의 차트 바꾸기';
      var menu = document.createElement('div');
      menu.className = 'ip-chartmenu';
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
        if (tg.area) { body.style.display = i >= 0 ? 'block' : 'none'; tg.w.classList.toggle('ip-hidekids', i >= 0); }
        else body.classList.toggle('ip-swapped', i >= 0);
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
        all(root, '.ip-chartmenu.open').forEach(function (m) { if (m !== menu) m.classList.remove('open'); });
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
      if (e.target.closest && e.target.closest('.ip-chartmenu, .ip-chartbtn')) return;
      all(root, '.ip-chartmenu.open').forEach(function (m) { m.classList.remove('open'); });
    };
    document.addEventListener('pointerdown', st.onDocDown, true);
  }

  /* ══════════════════ 8. 패널 옮기기(패널편집) ══════════════════
     왼쪽 두 패널(사업장 · 설비 검색) — 끌면 위아래로 자리를 바꾸며 다시 쌓인다('3D 레이어' 제목은 설비 검색에 붙어 다닌다).
     나머지(이벤트 로그 · 팝업 · 패널 위젯 · 지도 라벨 묶음) — 4px 격자로 자유롭게. */
  function installPanelMove(root, st) {
    var L = load(K_LAYOUT), me = L[st.scene] = L[st.scene] || {};
    function persist() { var a = load(K_LAYOUT); a[st.scene] = me; save(K_LAYOUT, a); }
    var side = one(root, '[data-name="Side Panel"]');
    var siteW = side && kid(side, 'Widget/Site List'), eqW = side && kid(side, 'Widget/Equipment Search'), title = side && kid(side, 'Section Title');
    var stack = [siteW, eqW].filter(Boolean);
    var top0 = siteW ? siteW.offsetTop : 151, gapS = 16, titleH = eqW && title ? eqW.offsetTop - title.offsetTop : 33;
    stack.forEach(function (w) { w.__top0 = w.offsetTop; w.classList.add('ip-mv'); w.setAttribute('data-ip-kind', 'stack'); placed(w); });
    if (title) { title.__top0 = title.offsetTop; placed(title); }
    var order = stack.slice();
    if (me.order && stack.length === 2) { var o = me.order.map(function (n) { return stack.filter(function (w) { return nm(w) === n; })[0]; }).filter(Boolean); if (o.length === 2) order = o; }
    function placeStack(skip) {
      var y = top0;
      order.forEach(function (w) {
        if (w === eqW) y += titleH;
        if (w !== skip) { w.__uy = y - w.__top0; place(w); }
        if (w === eqW && title) { title.__uy = y - titleH - title.__top0 + (skip === eqW ? (eqW.__dy || 0) : 0); place(title); }
        y += w.offsetHeight + gapS;
      });
    }
    if (stack.length === 2) placeStack();
    var freeSel = ['[data-name="Event Log"]', '[data-name="Popup/Sensor Info"]', '[data-name="Widget/Sensor Trend"]', '[data-name="Widget/Sensor Info"]', '[data-name="Widget/Event Status"]',
      '[data-name^="Panel/"] [data-name="Filter Bar"]', '[data-name="Widget/Sensor List"]', '[data-name="Search Field"]:not([data-name="Body"] *)', '[data-name="Map Labels"]', '[data-name="Button/Forklift Collision"]', '[data-name="Button/Evacuation Route"]'];
    var frees = [];
    freeSel.forEach(function (s) { all(root, s).forEach(function (f) { if (frees.indexOf(f) < 0 && !f.closest('[data-name="Widget/Equipment Search"]') && getComputedStyle(f).display !== 'contents') frees.push(f); }); });
    me.free = me.free || {};
    frees.forEach(function (f) {
      f.classList.add('ip-mv'); f.setAttribute('data-ip-kind', 'free');
      var s = me.free[nm(f)];
      if (s) { f.__ux = s[0]; f.__uy = s[1]; place(f); if (s[0] || s[1]) f.classList.add('ip-front'); }
    });
    var drag = null;
    st.onDown = function (e) {
      if (!layoutEditing(root) || e.button !== 0) return;
      if (e.target.closest('.ip-chartbtn, .ip-chartmenu, .ip-resetbtn')) return;
      /* 패널편집은 글자 수정과 함께 켜진다 — 글자 위에서 시작한 끌기는 글자 고르기로 둔다 */
      if (e.target.closest('[contenteditable="true"]')) return;
      var w = e.target.closest('.ip-mv');
      if (!w || !root.contains(w)) return;
      e.preventDefault(); e.stopPropagation();
      drag = { w: w, kind: w.getAttribute('data-ip-kind'), sx: e.clientX, sy: e.clientY, moved: false };
    };
    st.onMove = function (e) {
      if (!drag) return;
      var S = (st.frame.getBoundingClientRect().width / st.frame.offsetWidth) || st.S || 1;
      var dx = (e.clientX - drag.sx) / S, dy = (e.clientY - drag.sy) / S;
      if (!drag.moved) {
        if (Math.hypot(dx, dy) < 3) return;
        drag.moved = true;
        drag.w.classList.add('ip-dragging');
      }
      if (drag.kind === 'stack') {
        drag.w.__dy = dy; place(drag.w);
        var cy = drag.w.__top0 + (drag.w.__uy || 0) + dy + drag.w.offsetHeight / 2;
        var other = order.filter(function (x) { return x !== drag.w; })[0];
        var oy = other.__top0 + (other.__uy || 0) + other.offsetHeight / 2;
        var wantFirst = cy < oy;
        var isFirst = order[0] === drag.w;
        if (wantFirst !== isFirst) {
          var keep = drag.w.__uy;
          order = wantFirst ? [drag.w, other] : [other, drag.w];
          placeStack(drag.w);
          drag.w.__uy = keep;
        } else if (title && drag.w === eqW) { title.__dy = dy; place(title); }
      } else {
        drag.w.__dx = dx; drag.w.__dy = dy;
        place(drag.w);
      }
    };
    st.onUp = function () {
      if (!drag) return;
      var d = drag; drag = null;
      var w = d.w;
      w.classList.remove('ip-dragging');
      if (!d.moved) return;
      if (d.kind === 'stack') {
        w.__dy = 0; if (title) title.__dy = 0;
        placeStack();
        me.order = order.map(nm);
      } else {
        var snap = function (v) { return Math.round(v / 4) * 4; };
        w.__ux = snap((w.__ux || 0) + (w.__dx || 0)); w.__uy = snap((w.__uy || 0) + (w.__dy || 0));
        w.__dx = 0; w.__dy = 0;
        place(w);
        me.free[nm(w)] = [w.__ux, w.__uy];
        /* 옮긴 판은 맨 앞에 남는다 — 놓자마자 지도 밑으로 숨던 것(이벤트 로그를 위로 끌면 지도에 덮였다) */
        all(root, '.ip-front').forEach(function (x) { if (x !== w) x.classList.remove('ip-front'); });
        w.classList.toggle('ip-front', !!(w.__ux || w.__uy));
      }
      persist();
    };
    root.addEventListener('pointerdown', st.onDown, true);
    window.addEventListener('pointermove', st.onMove);
    window.addEventListener('pointerup', st.onUp);
    window.addEventListener('pointercancel', st.onUp);
    st.onDragStart = function (e) { if (layoutEditing(root) && e.target.closest && e.target.closest('.ip-mv')) e.preventDefault(); };
    root.addEventListener('dragstart', st.onDragStart);
    st.resetLayout = function () {
      me = { free: {} };
      var a = load(K_LAYOUT); a[st.scene] = me; save(K_LAYOUT, a);
      order = stack.slice(); if (stack.length === 2) placeStack();
      frees.forEach(function (f) { f.__ux = 0; f.__uy = 0; place(f); f.classList.remove('ip-front'); });
      Object.keys(st.chartApply || {}).forEach(function (k) { st.chartApply[k](-1); });
    };
    var rb = document.createElement('button');
    rb.type = 'button';
    rb.className = 'ip-resetbtn';
    rb.textContent = '배치 초기화';
    rb.title = '패널 자리 · 바꾼 차트를 원본으로';
    st.frame.appendChild(rb);
    rb.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    rb.addEventListener('pointerup', function (e) { e.stopPropagation(); e.preventDefault(); st.resetLayout(); });
    st.onReset = function (e) { if (e.target.closest && e.target.closest('#layoutReset')) st.resetLayout(); };
    document.addEventListener('click', st.onReset, true);
  }

  /* ══════════════════ 살리기 ══════════════════ */
  var SCENE_OF = { ipm: 'main', ipn: 'menu', ips: 'site', ipf: 'forklift', ipv: 'vibration', iph: 'heat', ipe: 'event', ipy: 'history', ipt: 'sensor' };
  function sceneOf(root) {
    var m = /\b(ip[a-z])-root\b/.exec(root.className);
    return { px: m ? m[1] : 'ipm', scene: m && SCENE_OF[m[1]] ? SCENE_OF[m[1]] : 'main' };
  }
  function start(root, st) {
    var steps = [['chartGeo', chartGeo], ['fit', installFit], ['clock', installClock], ['recent', installRecent], ['checks', installChecks], ['fill', installScrollFill], ['nav', installNav], ['elog', installEventLog],
      ['charts', installLiveCharts], ['scroll', installScroll], ['swap', installChartSwap], ['move', installPanelMove]];
    steps.forEach(function (s) { try { s[1](root, st); } catch (e) { console.warn('[ip] ' + s[0], e); } });
    all(root, '[data-name="Side Panel"] > *').forEach(function (c, i) { c.style.setProperty('--i', i); });
    root.classList.add('ip-enter');
    st.timers.push(setTimeout(function () { root.classList.remove('ip-enter'); }, 1400));
  }
  function initIndpark(root) {
    if (!root || root.__ip) return;
    injectStyle();
    root.classList.add('ip-root');
    var so = sceneOf(root);
    var st = root.__ip = { timers: [], scene: so.scene, px: so.px, onLayout: [] };
    if (/[?&]edit=1/.test(location.search)) root.classList.add('ip-edit-layout');
    /* 화면이 아직 크기를 못 받았으면(가려진 채 그릴 때) 받은 뒤에 잰다 */
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
  function disposeIndpark(root) {
    var st = root && root.__ip;
    if (!st) return;
    if (st.wait) st.wait.disconnect();
    (st.mos || []).forEach(function (m) { m.disconnect(); });
    st.timers.forEach(function (t) { clearInterval(t); clearTimeout(t); });
    clearTimeout(st.feed); clearTimeout(st.toastT);
    if (st.ro) st.ro.disconnect();
    if (st.onResize) window.removeEventListener('resize', st.onResize);
    (st.lines || []).forEach(function (l) { l.dispose(); });
    Object.keys(st.charts || {}).forEach(function (k) { st.charts[k].dispose(); });
    [st.cbStyle, st.pgStyle].forEach(function (s) { if (s) s.remove(); });
    if (st.onDocDown) document.removeEventListener('pointerdown', st.onDocDown, true);
    if (st.onDdDown) document.removeEventListener('pointerdown', st.onDdDown, true);
    if (st.onDown) root.removeEventListener('pointerdown', st.onDown, true);
    if (st.onMove) window.removeEventListener('pointermove', st.onMove);
    if (st.onUp) { window.removeEventListener('pointerup', st.onUp); window.removeEventListener('pointercancel', st.onUp); }
    if (st.onDragStart) root.removeEventListener('dragstart', st.onDragStart);
    if (st.onReset) document.removeEventListener('click', st.onReset, true);
    root.__ip = null;
  }
  window.initIndpark = initIndpark;
  window.disposeIndpark = disposeIndpark;
})();
