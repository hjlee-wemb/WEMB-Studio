/* 스마트 도면관리 시스템 — 재구축 화면 19장의 인터랙션 · 라이브 · 반응형 레이어.
   window.initDrawing(root) / window.disposeDrawing(root)

   화면(DOM·CSS)은 생성기(src/drawing/_gen/conv.js)가 Figma(hfgGjtOuOsX3wdxk33ldyv) 그대로 만든다.
   이 파일은 그 위에 '움직이는 것'만 얹는다 — 정지 상태(?live=0) = Figma 원본.

   · 반응형 — 1920x1080 좌표계 + 균일 배율 S. 남는 폭 · 높이는 바탕 · 표 · 폼이 나눠 갖는다(여백 없음). 정확히 16:9 면 Figma 그대로
   · 실시간 시계(CCTV 화면 시각) · 최근 시각(공지 · 문의 · 체크인 날짜를 열 때마다 '지금' 기준으로)
   · 마우스 오버 — 메뉴 · 단추 · 표 줄 · 트리 · 카드 · 탭 · 칩 · 입력칸 · 목록
   · 접기 — 도면조회 상세검색(Advanced Filters), 왼쪽 트리 묶음
   · 화면 잇기 — 헤더 메뉴 · 검색 · 도움말 · 등록/목록 단추 · 로그인 · 팝업 닫기
   · 차트 바꾸기(패널편집 중) — 메인 패널마다 이 시스템에 맞는 추천 차트. '원본 그대로'로 되돌린다
   · 패널 옮기기(패널편집 중) — 같은 크기 패널은 맞바꾸고, 나머지는 4px 격자 자유 이동

   src/drawing-live.js 는 생성물이다. 이 파일을 고쳐 `node mk-live.js`. 고친 뒤 js/core/tpl-modules.js 의 ?v= 를 올릴 것. */
(function () {
  'use strict';

  var BASE_W = 1920, BASE_H = 1080;
  var K_LAYOUT = 'wemb-drawing-layout', K_CHART = 'wemb-drawing-chart';
  var STYLE_ID = 'drawing-live-style';
  var EASE = 'cubic-bezier(.22,.8,.24,1)';
  var SCENES = { dwm: 'main', dwn: 'main-menu', dws: 'main-select', dwp: 'main-popup', dwa: 'search', dwb: 'search-detail', dwv: 'preview', dwo: 'preview-popup', dwr: 'register', dwe: 'equipment', dwh: 'help', dwi: 'checkin', dwc: 'cctv', dwk: 'desk', dww: 'desk-write', dwd: 'desk-detail', dwt: 'total-search', dwu: 'total-result', dwl: 'login' };
  var PAGE_H = { checkin: 1174, 'total-result': 1576 };
  /* 시안의 날짜 기준 시각 — 화면을 열 때 이만큼을 '지금'으로 옮긴다 */
  var REF = new Date(2026, 10, 6, 14, 20, 0).getTime();
  function isMain(sc) { return /^main/.test(sc); }

  var CSS = [
    '.dg-root{--dg-acc:57,103,253;overflow:clip!important;}',
    '.dg-root[data-theme="dark"]{--dg-acc:127,157,255;}',
    '.dg-root.dg-scroll{overflow-x:hidden!important;overflow-y:auto!important;scrollbar-width:thin;}',
    '.dg-root.dg-scroll[data-theme="dark"]{scrollbar-color:#343842 #0e0f12;}',
    '.dg-root.dg-resizing *,.dg-root .dg-dragging,.dg-root .dg-dragging *{transition:none!important;}',
    '.dg-root .dg-probe{position:absolute;width:0;height:0;overflow:hidden;color:#3967fd;}',
    '.dg-root .dg-click{cursor:pointer;}',
    '.dg-root .dg-click *{cursor:inherit;}',
    '.dt-content-editing .dg-root .dg-click,.dt-content-editing .dg-root .dg-click *{cursor:text;}',
    '.dg-root [data-name="Viewer"] img{object-fit:cover;}',
    /* 들어올 때 */
    '@keyframes dgIn{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:none;}}',
    '@keyframes dgIn2{from{opacity:0;translate:0 12px;}to{opacity:1;translate:0 0;}}',
    '@keyframes dgFade{from{opacity:0;}to{opacity:1;}}',
    '@keyframes dgPop{from{opacity:0;scale:.97;}to{opacity:1;scale:1;}}',
    '.dg-root.dg-enter [data-name^="Widget/Notice"],.dg-root.dg-enter [data-name^="Widget/Help"],.dg-root.dg-enter [data-name="Panel"],.dg-root.dg-enter [data-name="Tree Panel"],.dg-root.dg-enter [data-name^="Section/"],.dg-root.dg-enter [data-name="Search Panel"],.dg-root.dg-enter [data-name="Result Panel"],.dg-root.dg-enter [data-name="Article"],.dg-root.dg-enter [data-name="Filter Panel"],.dg-root.dg-enter [data-name^="CCTV View/"],.dg-root.dg-enter [data-name="Site List"],.dg-root.dg-enter [data-name="Login Card"]{animation:dgIn2 .5s ' + EASE + ' both;}',
    '.dg-root.dg-enter [data-name^="Popup"]{animation:dgPop .32s ' + EASE + ' both;}',
    '.dg-root.dg-enter [data-name="Dim"]{animation:dgFade .3s ease both;}',
    /* 헤더 메뉴 */
    '.dg-root [data-name^="Nav Item/"]{cursor:pointer;transition:background-color .2s ease,translate .2s ease;}',
    '.dg-root [data-name^="Nav Item/"] p{transition:color .2s ease;}',
    '.dg-root [data-name^="Nav Item/"]:hover{background-color:rgba(var(--dg-acc),.08);}',
    '.dg-root [data-name^="Nav Item/"]:hover p{color:#3967fd;}',
    '.dg-root[data-theme="dark"] [data-name^="Nav Item/"]:hover p{color:#9db4ff;}',
    '.dg-root [data-name^="Nav Item/"]:active{translate:0 1px;}',
    '.dg-root [data-name="Home Link"]{cursor:pointer;transition:opacity .2s ease;}',
    '.dg-root [data-name="Home Link"]:hover{opacity:.72;}',
    '.dg-root [data-name="Search Bar"]{cursor:pointer;}',
    '.dg-root [data-name="Search Bar"] > [data-name="Background"]{transition:background-color .2s ease,box-shadow .2s ease;}',
    '.dg-root [data-name="Search Bar"]:hover > [data-name="Background"]{box-shadow:0 0 0 1px rgba(var(--dg-acc),.5),0 4px 12px rgba(var(--dg-acc),.14);}',
    '.dg-root [data-name="Search Bar"] [data-name="Actions"] img{transition:scale .2s ease;}',
    '.dg-root [data-name="Search Bar"]:hover [data-name="Actions"] img{scale:1.08;}',
    '.dg-root [data-name="Icon/Header"],.dg-root [data-name="User"]{cursor:pointer;transition:translate .2s ease,filter .2s ease;}',
    '.dg-root [data-name="Icon/Header"]:hover{translate:0 -2px;filter:drop-shadow(0 3px 6px rgba(var(--dg-acc),.4));}',
    '.dg-root [data-name="User"]:hover{filter:brightness(1.1);}',
    '.dg-root [data-name="Select/Office"]{cursor:pointer;transition:box-shadow .2s ease,background-color .2s ease;}',
    '.dg-root [data-name="Select/Office"]:hover{box-shadow:0 0 0 1px rgba(var(--dg-acc),.5),0 4px 12px rgba(var(--dg-acc),.14);}',
    '.dg-root [data-name="Nav Item/LNB"],.dg-root [data-name="Option/Office"],.dg-root [data-name="List Item/Office"]{cursor:pointer;transition:background-color .18s ease;}',
    '.dg-root [data-name="Nav Item/LNB"]:hover,.dg-root [data-name="Option/Office"]:hover,.dg-root [data-name="List Item/Office"]:hover{background-color:rgba(var(--dg-acc),.1);}',
    /* 단추 */
    '.dg-root [data-name^="Button/"]{cursor:pointer;transition:filter .18s ease,translate .18s ease,box-shadow .18s ease,background-color .18s ease;}',
    '.dg-root [data-name^="Button/"]:hover{translate:0 -1px;filter:brightness(1.08);box-shadow:0 6px 14px rgba(var(--dg-acc),.26);}',
    '.dg-root [data-name^="Button/"]:active{translate:0 0;filter:brightness(.93);box-shadow:none;}',
    '.dg-root [data-name="Button/Input"]:hover,.dg-root [data-name="Button/Input Small"]:hover{background-color:rgba(var(--dg-acc),.1);box-shadow:0 0 0 1px rgba(var(--dg-acc),.5);}',
    '.dg-root [data-name^="Button/Help"]:hover{background-color:rgba(var(--dg-acc),.08);}',
    '.dg-root [data-name="Button/Advanced Search"] > img,.dg-root [data-name="Button/Advanced Search"] > [data-name="Icon/Arrow"]{transition:rotate .35s ' + EASE + ';}',
    '.dg-root.dg-folded [data-name="Button/Advanced Search"] > [data-name="Icon/Arrow"]{rotate:180deg;}',
    '.dg-root [data-name="Toolbar"]:has(> [data-name="Button/Advanced Search"]){position:relative;z-index:3;pointer-events:none;}',
    '.dg-root [data-name="Button/Advanced Search"]{position:relative;z-index:3;pointer-events:auto;}',
    '.dg-root [data-name="Actions"] [data-name^="Icon/"]{cursor:pointer;}',
    /* 표 · 목록 */
    '.dg-root [data-name="Row"],.dg-root [data-name="Table Row/Equipment"],.dg-root [data-name="Result Item"],.dg-root [data-name="File Item"],.dg-root [data-name^="List Item/"]{transition:background-color .16s ease,box-shadow .16s ease,translate .16s ease;}',
    '.dg-root [data-name="Rows"] > [data-name="Row"]:hover,.dg-root [data-name^="Table/"] > [data-name="Row"]:hover,.dg-root [data-name="Table Row/Equipment"]:hover{background-color:rgba(var(--dg-acc),.06);}',
    '.dg-root [data-name^="Table/"] [data-name^="Td/"]{transition:background-color .16s ease;}',
    '.dg-root [data-name^="Table/"] > [data-name="Row"]:hover > [data-name^="Td/"],.dg-root [data-name^="Table/"] > [data-name="Rows"] > [data-name="Row"]:hover > [data-name^="Td/"],.dg-root [data-name="Table Row/Equipment"]:hover > [data-name^="Td/"]{background-color:rgba(var(--dg-acc),.08);}',
    '.dg-root [data-name="Row"],.dg-root [data-name="Table Row/Equipment"]{cursor:pointer;}',
    '.dg-root [data-name="List Item/Drawing"],.dg-root [data-name="List Item/Post"]{cursor:pointer;}',
    '.dg-root [data-name="List Item/Drawing"]:hover{background-color:rgba(var(--dg-acc),.1);translate:2px 0;}',
    '.dg-root [data-name="List Item/Post"]:hover{box-shadow:0 0 0 1px rgba(var(--dg-acc),.6);}',
    '.dg-root [data-name="Result Item"]{cursor:pointer;}',
    '.dg-root [data-name="Result Item"]:hover{translate:4px 0;}',
    '.dg-root [data-name="File Item"]{cursor:pointer;}',
    '.dg-root [data-name="File Item"]:hover{background-color:rgba(var(--dg-acc),.08);}',
    '.dg-root [data-name="File Link"]{cursor:pointer;transition:opacity .18s ease;}',
    '.dg-root [data-name="File Link"]:hover{opacity:.7;}',
    '.dg-root [data-name="Post Link"]{cursor:pointer;transition:translate .18s ease;}',
    '.dg-root [data-name="Post Link"]:hover{translate:4px 0;}',
    '.dg-root [data-name="Bookmark"]{cursor:pointer;transition:scale .18s ease;}',
    '.dg-root [data-name="Bookmark"]:hover{scale:1.25;}',
    '.dg-root [data-name^="Page/"]{cursor:pointer;transition:background-color .16s ease;border-radius:4px 4px 0 0;}',
    '.dg-root [data-name^="Page/"]:hover{background-color:rgba(var(--dg-acc),.1);}',
    '.dg-root [data-name^="Step/"]{cursor:pointer;transition:translate .2s ease,filter .2s ease;}',
    '.dg-root [data-name^="Step/"]:hover{translate:0 -2px;filter:brightness(1.06);}',
    '.dg-root [data-name^="Chip/"]{cursor:pointer;transition:background-color .18s ease,translate .18s ease;}',
    '.dg-root [data-name^="Chip/"]:hover{background-color:rgba(var(--dg-acc),.1);translate:0 -1px;}',
    '.dg-root [data-name^="Tab/"]{cursor:pointer;transition:background-color .2s ease,border-color .2s ease,color .2s ease;}',
    '.dg-root [data-name^="Tab/"]:hover{background-color:rgba(var(--dg-acc),.1);}',
    '.dg-root [data-name^="Tab/"].dg-tab-on{background-color:#3967fd!important;border-color:#3967fd!important;}',
    '.dg-root [data-name^="Tab/"].dg-tab-on p{color:#fff!important;}',
    '.dg-root [data-name^="Tab/"].dg-tab-off{background-color:transparent!important;border:1px solid #d5d6dd!important;}',
    '.dg-root [data-name^="Tab/"].dg-tab-off p:first-child{color:#171d25!important;}',
    '.dg-root [data-name^="Tab/"].dg-tab-off p:last-child{color:#767676!important;}',
    '.dg-root[data-theme="dark"] [data-name^="Tab/"].dg-tab-off{border-color:#31343c!important;}',
    '.dg-root[data-theme="dark"] [data-name^="Tab/"].dg-tab-off p:first-child{color:#eceef2!important;}',
    '.dg-root[data-theme="dark"] [data-name^="Tab/"].dg-tab-off p:last-child{color:#a7acb6!important;}',
    '.dg-root [data-name^="Result Section/"]{transition:opacity .25s ease;}',
    '.dg-root .dg-hide{display:none!important;}',
    /* 입력칸 */
    '.dg-root [data-name="Input"],.dg-root [data-name="Select"]{transition:box-shadow .18s ease;}',
    '.dg-root [data-name^="Field/"] [data-name="Input"]:hover,.dg-root [data-name^="Field/"] [data-name="Select"]:hover,.dg-root [data-name^="Select/Title"]:hover{box-shadow:0 0 0 1px rgba(var(--dg-acc),.55),0 2px 8px rgba(var(--dg-acc),.14);}',
    '.dg-root [data-name="Drop Zone"]{cursor:pointer;transition:background-color .2s ease;}',
    '.dg-root [data-name="Drop Zone"]:hover{background-color:rgba(var(--dg-acc),.06);}',
    /* 카드 · CCTV */
    '.dg-root [data-name^="Card/"]{cursor:pointer;transition:translate .22s ease,box-shadow .22s ease,border-color .22s ease,background-color .22s ease;}',
    '.dg-root [data-name^="Card/"]:hover{translate:0 -2px;box-shadow:0 8px 18px rgba(var(--dg-acc),.14);}',
    '.dg-root [data-name="List Item/CCTV Room"]{cursor:pointer;}',
    '.dg-root [data-name="List Item/CCTV Room"] p{transition:color .18s ease;}',
    '.dg-root [data-name="List Item/CCTV Room"]:hover p{color:#3967fd!important;}',
    '.dg-root[data-theme="dark"] [data-name="List Item/CCTV Room"]:hover p{color:#9db4ff!important;}',
    '.dg-root [data-name^="CCTV View/"]{cursor:pointer;transition:translate .22s ease,box-shadow .22s ease;}',
    '.dg-root [data-name^="CCTV View/"]:hover{translate:0 -2px;box-shadow:0 10px 24px rgba(0,0,0,.22);}',
    '.dg-root [data-name="Caption"]{transition:background-color .22s ease;}',
    '.dg-root [data-name^="CCTV View/"].dg-on > [data-name="Caption"]{background-color:#3967fd!important;}',
    '.dg-root [data-name^="CCTV View/"].dg-off > [data-name="Caption"]{background-color:#171d25!important;}',
    '.dg-root[data-theme="dark"] [data-name^="CCTV View/"].dg-off > [data-name="Caption"]{background-color:#23262d!important;}',
    /* 위젯 */
    '.dg-root [data-name^="Widget/"]:not([data-name="Widget/My Drawings"]),.dg-root [data-name="Panel"]{transition:translate .25s ' + EASE + ',box-shadow .25s ease;}',
    /* 트리 */
    '.dg-root [data-name="Tree Item"]{cursor:pointer;border-radius:4px;transition:background-color .16s ease,height .28s ' + EASE + ',opacity .22s ease;overflow:visible;}',
    '.dg-root [data-name="Tree Item"]:hover{background-color:rgba(var(--dg-acc),.08);}',
    '.dg-root [data-name="Tree Item"] > [data-name="Icon/Tree"]:first-child img{transition:rotate .28s ' + EASE + ';}',
    '.dg-root .dg-tree-closed > [data-name="Icon/Tree"]:first-child img{rotate:-90deg;}',
    '.dg-root .dg-tree-gone{height:0!important;min-height:0!important;margin:0!important;opacity:0;overflow:hidden!important;pointer-events:none;}',
    /* 상세검색 접기 */
    '.dg-root [data-name="Advanced Filters"]{overflow:hidden;transition:height .42s ' + EASE + ',opacity .3s ease;}',
    '.dg-root [data-name="Form"] > [data-name="Divider"]{transition:height .42s ' + EASE + ',opacity .3s ease;overflow:hidden;}',
    '.dg-root.dg-live [data-name="Search Panel"],.dg-root.dg-live [data-name="Form"],.dg-root.dg-live [data-name="Result Panel"],.dg-root.dg-live [data-name="Table Viewport"]{transition:height .42s ' + EASE + ';}',
    '.dg-root.dg-live [data-name="Search Panel"] > [data-name="Body"]{transition:height .42s ' + EASE + ';}',
    '.dg-root.dg-folded [data-name="Advanced Filters"],.dg-root.dg-folded [data-name="Form"] > [data-name="Divider"]{opacity:0;pointer-events:none;}',
    /* 다크 — 그림 선 · 이미지 위 글자 */
    '.dg-root[data-theme="dark"] [data-name^="Nav Item/"]:hover{background-color:rgba(255,255,255,.06);}',
    '.dg-root[data-theme="dark"] [data-name="Viewer"] img:not([src$="-icons.svg"]){filter:brightness(.92);}',
    /* 패널 편집 */
    '.dt-editing .dg-root [data-name]{animation:none!important;}',
    '.dt-editing .dg-root .dg-mv,.dg-root.dg-edit-layout .dg-mv{cursor:move;outline:1px dashed rgba(var(--dg-acc),.6);outline-offset:3px;}',
    '.dg-root .dg-dragging{z-index:9;opacity:.92;box-shadow:0 18px 40px rgba(0,0,0,.25);}',
    '.dg-root .dg-drop{outline:2px solid rgba(var(--dg-acc),.85)!important;outline-offset:3px;}',
    '.dg-root .dg-host{position:absolute;z-index:2;display:none;}',
    '.dg-root .dg-swapped > .dg-host{display:block;}',
    '.dg-root .dg-resetbtn{display:none;position:absolute;right:24px;top:84px;z-index:30;height:32px;padding:0 14px;border-radius:8px;border:1px solid rgba(var(--dg-acc),.5);background:#fff;color:#3967fd;font:600 13px "Pretendard Variable",Pretendard,sans-serif;cursor:pointer;}',
    '.dt-editing .dg-root .dg-resetbtn,.dg-root.dg-edit-layout .dg-resetbtn{display:block;}',
    '.dg-root[data-theme="dark"] .dg-resetbtn{background:#1b1d23;color:#eceef2;border-color:rgba(255,255,255,.14);}',
    '@media (prefers-reduced-motion:reduce){.dg-root *{animation:none!important;transition:none!important;}}',
    '.dg-root .dg-chartbtn{position:absolute;top:-11px;right:14px;z-index:25;display:none;align-items:center;gap:4px;height:22px;padding:0 9px;border:1px solid rgb(var(--dg-acc));background:#06264a;color:#e6f7ff;font:500 12px/1 Pretendard,system-ui,sans-serif;cursor:pointer;white-space:nowrap;}',
    '.dg-root .dg-chartbtn:hover{filter:brightness(1.25);box-shadow:0 0 12px rgba(var(--dg-acc),.6);}',
    '.dt-editing .dg-root .dg-chartbtn,.dt-content-editing .dg-root .dg-chartbtn,.dg-root.dg-edit-layout .dg-chartbtn{display:inline-flex;}',
    '.dg-root .dg-chartmenu{position:absolute;top:14px;right:14px;z-index:40;min-width:208px;padding:5px;border:1px solid #2a7ca0;background:#071a30;color:#c7ecf4;font:400 13px/1.35 Pretendard,system-ui,sans-serif;box-shadow:0 12px 28px rgba(0,0,0,.5);opacity:0;translate:0 -4px;pointer-events:none!important;transition:opacity .16s ease,translate .16s ease;}',
    '.dg-root .dg-chartmenu.open{opacity:1;translate:0 0;pointer-events:auto!important;}',
    '.dg-root .dg-chartmenu .hd{padding:4px 8px 6px;font-size:11px;color:#8ea6b3;white-space:nowrap;}',
    '.dg-root .dg-chartmenu button{display:flex;align-items:center;gap:8px;width:100%;padding:6px 8px;border:0;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer!important;white-space:nowrap;}',
    '.dg-root .dg-chartmenu button:hover{background:rgba(var(--dg-acc),.14);color:#fff;}',
    '.dg-root .dg-chartmenu button.cur{background:rgba(9,182,251,.26);color:#fff;}',
    '.dg-root .dg-chartmenu .ic{width:18px;height:14px;flex:none;}',
    '.dg-root .dg-chartmenu .rec{margin-left:auto;padding:1px 6px;background:rgb(var(--dg-acc));color:#03202e;font-size:10px;font-weight:700;}',
    '.dg-root .dg-chartmenu .sep{height:1px;margin:4px 2px;background:rgba(199,236,244,.16);}',
    '.dg-root .dg-chart{position:absolute;inset:0;display:flex;flex-direction:column;padding:10px 14px 8px;background:linear-gradient(180deg,rgba(14,32,54,.97),rgba(12,26,46,.97));box-shadow:inset 0 0 0 1px rgba(42,124,160,.75);color:#c7ecf4;font:400 12px/1.3 Pretendard,system-ui,sans-serif;animation:dgChartIn .35s ease;}',
    '.dg-root .dg-chart .pl,.dg-root .dg-chart .lg,.dg-root .dg-chart .ct i,.dg-root .dg-chart .ct b{filter:hue-rotate(var(--dg-chue,0deg));}',
    '.dg-root .dg-chart .ct{display:flex;align-items:center;gap:6px;font-weight:500;font-size:15px;color:#fff;white-space:nowrap;}',
    '.dg-root .dg-chart .ct i{display:block;width:8px;height:8px;background:#2a7ca0;flex:none;}',
    '.dg-root .dg-chart .ct b{margin-left:auto;font-family:Tomorrow,Pretendard,sans-serif;font-weight:400;font-size:18px;color:#00ffd2;}',
    '.dg-root .dg-chart .ct b small{font:400 11px Pretendard,sans-serif;color:#8ea6b3;margin-left:3px;}',
    '.dg-root .dg-chart .lg{display:flex;gap:10px;margin-top:3px;font-size:11px;color:#8ea6b3;white-space:nowrap;}',
    '.dg-root .dg-chart .lg span{display:inline-flex;align-items:center;gap:4px;}',
    '.dg-root .dg-chart .lg span:before{content:"";width:9px;height:3px;background:var(--c);}',
    '.dg-root .dg-chart .pl{position:relative;flex:1;min-height:0;margin-top:6px;}',
    '.dg-root .dg-chart svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;}',
    '.dg-root .dg-chart .ax{fill:#8ea6b3;font-size:11px;font-family:Pretendard,system-ui,sans-serif;}',
    '.dg-root .dg-chart .gl{stroke:rgba(142,166,179,.16);stroke-width:1;shape-rendering:crispEdges;}',
    '.dg-root .dg-chart .bars{position:absolute;inset:0 0 16px;display:flex;align-items:flex-end;justify-content:space-around;gap:8px;}',
    '.dg-root .dg-chart .bars > div{position:relative;flex:1;max-width:34px;height:100%;display:flex;align-items:flex-end;}',
    '.dg-root .dg-chart .bars i{display:block;width:100%;background:linear-gradient(180deg,var(--c),rgba(9,182,251,.18));transition:height .9s ' + EASE + ';}',
    '.dg-root .dg-chart .bars em{position:absolute;left:50%;translate:-50% 0;bottom:calc(var(--h) + 2px);font-style:normal;font-size:11px;color:#e6f7ff;white-space:nowrap;transition:bottom .9s ' + EASE + ';}',
    '.dg-root .dg-chart .bars u{position:absolute;left:50%;translate:-50% 0;bottom:-16px;text-decoration:none;font-size:11px;color:#8ea6b3;white-space:nowrap;}',
    '.dg-root .dg-chart .hb{display:flex;flex-direction:column;justify-content:space-around;height:100%;gap:3px;}',
    '.dg-root .dg-chart .hb > div{display:grid;grid-template-columns:72px 1fr 50px;align-items:center;gap:8px;font-size:12px;}',
    '.dg-root .dg-chart .hb s{position:relative;display:block;height:8px;background:rgba(142,166,179,.16);overflow:hidden;text-decoration:none;}',
    '.dg-root .dg-chart .hb s i{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,rgba(9,182,251,.5),var(--c));transition:width .9s ' + EASE + ';}',
    '.dg-root .dg-chart .hb b{text-align:right;color:#fff;font-weight:500;font-variant-numeric:tabular-nums;}',
    '.dg-root .dg-chart .arc{transition:stroke-dasharray .9s ' + EASE + ',stroke-dashoffset .9s ' + EASE + ';}',
    '.dg-root .dg-chart .gv{position:absolute;left:0;right:0;bottom:0;text-align:center;font-family:Tomorrow,Pretendard,sans-serif;font-size:22px;color:#00ffd2;}',
    '.dg-root .dg-chart .gv small{font:400 12px Pretendard,sans-serif;color:#8ea6b3;margin-left:2px;}',
    '.dg-root .dg-chart .dn{display:flex;align-items:center;gap:16px;height:100%;}',
    '.dg-root .dg-chart .dn .ring{position:relative;height:100%;aspect-ratio:1;flex:none;}',
    '.dg-root .dg-chart .dn .ring b{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Tomorrow,Pretendard,sans-serif;font-weight:400;font-size:17px;color:#fff;}',
    '.dg-root .dg-chart .dn .ring b small{font:400 10px Pretendard,sans-serif;color:#8ea6b3;}',
    '.dg-root .dg-chart .dn ul{list-style:none;display:flex;flex-direction:column;gap:4px;font-size:12px;min-width:0;flex:1;}',
    '.dg-root .dg-chart .dn li{display:flex;align-items:center;gap:6px;white-space:nowrap;}',
    '.dg-root .dg-chart .dn li:before{content:"";width:9px;height:3px;background:var(--c);flex:none;}',
    '.dg-root .dg-chart .dn li b{margin-left:auto;color:#fff;font-weight:500;font-variant-numeric:tabular-nums;}',
    '@keyframes dgChartIn{from{opacity:0;}to{opacity:1;}}',
    '.dg-root:not([data-theme="dark"]) .dg-chartbtn{background:#fff;color:#06365c;}',
    '.dg-root:not([data-theme="dark"]) .dg-chartmenu{background:#fff;color:#20405a;border-color:#9dbdd2;box-shadow:0 12px 28px rgba(30,60,100,.25);}',
    '.dg-root:not([data-theme="dark"]) .dg-chartmenu button:hover{background:rgba(0,112,178,.1);color:#06365c;}',
    '.dg-root:not([data-theme="dark"]) .dg-chartmenu button.cur{background:rgba(0,112,178,.16);color:#06365c;}',
    '.dg-root:not([data-theme="dark"]) .dg-chart{background:#fff;box-shadow:inset 0 0 0 1px #c5d9e6;color:#20405a;}',
    '.dg-root:not([data-theme="dark"]) .dg-chart .ct{color:#0e2c47;}',
    '.dg-root:not([data-theme="dark"]) .dg-chart .ct b,.dg-root:not([data-theme="dark"]) .dg-chart .gv{color:#00786a;}',
    '.dg-root:not([data-theme="dark"]) .dg-chart .lg,.dg-root:not([data-theme="dark"]) .dg-chart .bars u,.dg-root:not([data-theme="dark"]) .dg-chart .ct b small,.dg-root:not([data-theme="dark"]) .dg-chart .gv small,.dg-root:not([data-theme="dark"]) .dg-chart .dn .ring b small{color:#55707f;}',
    '.dg-root:not([data-theme="dark"]) .dg-chart .ax{fill:#55707f;}',
    '.dg-root:not([data-theme="dark"]) .dg-chart .gl{stroke:rgba(40,80,110,.14);}',
    '.dg-root:not([data-theme="dark"]) .dg-chart .bars em,.dg-root:not([data-theme="dark"]) .dg-chart .hb b,.dg-root:not([data-theme="dark"]) .dg-chart .dn li b,.dg-root:not([data-theme="dark"]) .dg-chart .dn .ring b{color:#0e2c47;}',
    '.dg-root:not([data-theme="dark"]) .dg-chart .hb s{background:rgba(40,80,110,.1);}',
  ].join('\n');

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ══════════════════ 도구 ══════════════════ */
  function all(root, sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }
  function one(root, sel) { return root.querySelector(sel); }
  function nameOf(el) { return el.getAttribute('data-name') || ''; }
  function kid(el, name) { return el ? Array.prototype.filter.call(el.children, function (c) { return nameOf(c) === name; })[0] : null; }
  function editing() { return !!document.querySelector('.dtstage.dt-content-editing, .dtstage.dt-editing, .dt-content-editing, .dt-editing'); }
  function layoutEditing(root) { return !!(root.closest('.dt-editing') || root.classList.contains('dg-edit-layout')); }
  function load(k) { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function comma(n) { return String(Math.round(n)).replace(/B(?=(d{3})+(?!d))/g, ','); }
  function idle() { return typeof window.__wembIdle === 'function' ? window.__wembIdle() : document.hidden; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  /* 사용자가 고친 글자는 라이브가 덮지 않는다 */
  function claimed(p) { return p.__dgLast != null && p.textContent !== p.__dgLast; }
  function write(p, s) {
    if (!p || p === document.activeElement || claimed(p)) return;
    if (p.textContent !== s) p.textContent = s;
    p.__dgLast = p.textContent;
  }
  function clickable(el, fn) {
    if (!el) return;
    el.classList.add('dg-click');
    el.addEventListener('click', function (e) { if (editing()) return; e.stopPropagation(); fn(e); });
  }
  function frameOf(root) { return root.querySelector(':scope > [data-node-id]'); }
  function imp(el, p, v) { if (el) el.style.setProperty(p, v, 'important'); }
  function goto(scene) {
    if (window.__gotoDrawingScene) { window.__gotoDrawingScene(scene); return; }
    location.href = scene + '.html' + location.search;
  }

  /* ══════════════════ 1. 화면 맞추기 ══════════════════
     좌표계는 1920x1080 그대로, 화면 비율만큼 캔버스를 넓혀(VW x VH) 균일 배율 S 로 그린다 — 늘어나는 왜곡도 여백도 없다.
     가운데 정렬 덩어리(left 50%)는 그대로 가운데 남고, 왼쪽 좌표로 놓인 덩어리는 늘어난 폭의 절반만큼 옮긴다.
     남는 높이는 화면 종류에 따라 표 · 폼 · 본문이 나눠 갖는다. */
  function leaves(el, out) {
    out = out || [];
    Array.prototype.forEach.call(el.children, function (c) {
      if (getComputedStyle(c).display === 'contents') leaves(c, out); else out.push(c);
    });
    return out;
  }
  function base(el) {
    if (!el) return null;
    if (el.__dgB) return el.__dgB;
    var cs = getComputedStyle(el);
    return (el.__dgB = { l: parseFloat(cs.left) || 0, t: parseFloat(cs.top) || 0, w: el.offsetWidth, h: el.offsetHeight, ml: 0 });
  }
  function setH(el, dh) { if (el) { var b = base(el); imp(el, 'height', (b.h + dh) + 'px'); } }
  function setW(el, dw) { if (el) { var b = base(el); imp(el, 'width', (b.w + dw) + 'px'); } }
  function setPos(el, dx, dy) { if (el) { var b = base(el); imp(el, 'left', (b.l + dx) + 'px'); imp(el, 'top', (b.t + dy) + 'px'); } }

  /* 한 층(화면 또는 Background Screen)의 배치표를 만든다 */
  function planLayer(container, st) {
    var ls = leaves(container), plan = [];
    var hasMain = !!container.querySelector('[data-name^="Widget/"]');
    ls.forEach(function (el) {
      var n = nameOf(el), cs = getComputedStyle(el);
      if (cs.position !== 'absolute') return;
      base(el);
      if (n === 'Header') { plan.push({ el: el, k: 'header' }); return; }
      if (n === 'Dim') { plan.push({ el: el, k: 'dim' }); return; }
      if (n === 'Background' && (el.offsetWidth >= 1900)) { plan.push({ el: el, k: hasMain ? 'photo' : 'bg' }); return; }
      if (/^Popup/.test(n) || container.closest('[data-name^="Popup/"]') || el.closest('[data-name^="Popup/"]')) { plan.push({ el: el, k: 'center' }); return; }
      if (n === 'LNB') { plan.push({ el: el, k: 'lnb' }); return; }
      if (n === 'Select/Office') { plan.push({ el: el, k: 'right' }); return; }
      if (n === 'Top Bar') { plan.push({ el: el, k: 'wide' }); return; }
      if (hasMain) { plan.push({ el: el, k: 'bottom' }); return; }
      plan.push({ el: el, k: 'page' });
    });
    return plan;
  }
  function applyPlan(plan, st, exW, exH) {
    plan.forEach(function (it) {
      var el = it.el, b = base(el);
      switch (it.k) {
        case 'header': imp(el, 'width', st.VW + 'px'); break;
        case 'dim': imp(el, 'left', '0'); imp(el, 'top', '0'); imp(el, 'margin', '0'); imp(el, 'width', st.VW + 'px'); imp(el, 'height', st.VH + 'px'); break;
        case 'bg': imp(el, 'width', st.VW + 'px'); imp(el, 'height', st.VH + 'px'); break;
        case 'photo': {
          /* 사진은 판의 오른쪽 끝까지 닿지 않는다(가운데에서 오른쪽으로 판 폭의 41%까지) — 그 안에서 창을 덮게 키운다 */
          var wide = b.w > 2000, k = Math.max(st.VH / b.h, wide ? st.VW / 2 / (b.w * 0.4126) : st.VW / b.w);
          imp(el, 'width', (b.w * k) + 'px'); imp(el, 'height', (b.h * k) + 'px');
          imp(el, 'margin', '0'); imp(el, 'left', (wide ? st.VW / 2 - b.w * k / 2 : 0) + 'px');
          break;
        }
        /* setPos 는 left 를 px 로 고정한다 — 가운데 정렬(left 50%)이던 덩어리도 늘어난 폭의 절반만큼 같이 옮겨야 가운데에 남는다 */
        case 'center': setPos(el, exW / 2, exH / 2); break;
        case 'lnb': setPos(el, exW * 0.0349, 0); break;
        case 'right': setPos(el, exW * (1 - 0.012), 0); break;
        case 'wide': imp(el, 'width', st.VW + 'px'); break;
        case 'bottom': setPos(el, exW / 2, exH); break;
        case 'page': setPos(el, exW / 2, 0); break;
      }
    });
  }
  /* 화면별 남는 높이 */
  function pageGrow(frame, st) {
    var sc = st.scene;
    function tree(dh) {
      all(frame, '[data-name="Tree"]').forEach(function (t) { setH(t, dh); });
      all(frame, '[data-name="Tree Panel"]').forEach(function (t) { setH(t, dh); });
      leaves(frame).forEach(function (l) { if (nameOf(l) === 'Background' && l.offsetWidth < 400 && l.offsetHeight > 500) setH(l, dh); if (nameOf(l) === 'Divider' && l.offsetWidth <= 1 && l.offsetHeight > 500) growRotated(l, dh); });
      all(frame, '[data-name="Tree Panel"] [data-name="Body"]').forEach(function (t) { setH(t, dh); });
    }
    /* 세로선은 90도 돌린 가로선 — 바깥은 높이, 안쪽 두 겹은 폭이 늘어난다 */
    function growRotated(l, dh) { setH(l, dh); var inner = l.children[0]; setW(inner, dh); if (inner) setW(inner.children[0], dh); }
    /* 부모 높이는 자식에 따라 변한다 — 늘리기 전에 모두 재 둔다(안 그러면 늘어난 값을 기준으로 또 늘어난다) */
    function primeTable() {
      var parts = all(frame, '[data-name="Tree"],[data-name="Tree Panel"],[data-name="Tree Panel"] [data-name="Body"],[data-name="Table Viewport"],[data-name="Result Panel"],[data-name="Result Panel"] > [data-name="Body"],[data-name^="Table/Drawing"]');
      parts.forEach(base);
      var table = one(frame, '[data-name^="Table/Drawing"]');
      if (table) Array.prototype.forEach.call(table.children, base);
      leaves(frame).forEach(function (l) { if (nameOf(l) === 'Background' && l.offsetWidth < 400 && l.offsetHeight > 500) base(l); if (nameOf(l) === 'Divider' && l.offsetWidth <= 1 && l.offsetHeight > 500) { base(l); var inner = l.children[0]; base(inner); if (inner) base(inner.children[0]); } });
    }
    function drawingTable(dh) {
      var table = one(frame, '[data-name^="Table/Drawing"]');
      if (!table) return;
      var rows = Array.prototype.filter.call(table.children, function (c) { return nameOf(c) !== 'Header Row'; });
      var each = dh / rows.length;
      rows.forEach(function (r) { setH(r, each); });
      setH(table, dh);
      ['Table Viewport'].forEach(function (n) { setH(one(frame, '[data-name="' + n + '"]'), dh); });
      var body = one(frame, '[data-name="Result Panel"] > [data-name="Body"]');
      setH(body, dh);
      setH(one(frame, '[data-name="Result Panel"]'), dh);
    }
    if (/^(search|search-detail|preview|preview-popup)$/.test(sc)) { primeTable(); return function (exW, exH) { tree(exH); drawingTable(exH); }; }
    if (sc === 'register' || sc === 'equipment' || sc === 'help') {
      var form = one(frame, '[data-name="Section/Drawing Meta"] [data-name="Form"]');
      var n = form ? form.children.length : 0;
      var g0 = form ? parseFloat(getComputedStyle(form).rowGap) || 0 : 0;
      return function (exW, exH) { if (form && n > 1) imp(form, 'row-gap', (g0 + exH / (n - 1)) + 'px'); if (form) imp(form, 'height', 'auto'); };
    }
    if (sc === 'desk') {
      var tds = all(frame, '[data-name="Rows"] > [data-name="Row"] > [data-name="Td/No"]');
      return function (exW, exH) { tds.forEach(function (t) { setH(t, exH / tds.length); }); };
    }
    if (sc === 'desk-write') { var box = one(frame, '[data-name="Field/Content"] [data-name="Input"]'); return function (exW, exH) { setH(box, exH); }; }
    if (sc === 'desk-detail') { var art = one(frame, '[data-name="Article"]'); return function (exW, exH) { setH(art, exH); }; }
    if (sc === 'cctv') {
      var vs = all(frame, '[data-name="Viewer"]'), views = all(frame, '[data-name^="CCTV View/"]');
      return function (exW, exH) {
        vs.forEach(function (v) { setH(v, exH / 2); });
        views.forEach(function (v) { var b = base(v); if (b.t > 400) setPos(v, exW / 2, exH / 2); });
      };
    }
    return function () {};
  }
  function installFit(root, st) {
    var frame = frameOf(root);
    st.frame = frame;
    frame.style.position = 'absolute'; frame.style.left = '0'; frame.style.top = '0';
    frame.style.transformOrigin = '0 0';
    /* 재기 전에 Figma 크기로 — 창이 좁으면 퍼센트 좌표(left 50%)가 창 기준으로 재어져 어긋난다 */
    frame.style.width = BASE_W + 'px'; frame.style.height = (PAGE_H[st.scene] || BASE_H) + 'px';
    var plans = planLayer(frame, st);
    all(frame, '[data-name^="Background Screen/"]').forEach(function (bg) { plans = plans.concat(planLayer(bg, st)); });
    var grow = pageGrow(frame, st);
    var pageH = PAGE_H[st.scene] || 0;
    if (pageH) root.classList.add('dg-scroll');
    var header = kid(frame, 'Header');
    function fit() {
      var W = root.clientWidth, H = root.clientHeight;
      if (!W || !H) return;
      var S = Math.min(W / BASE_W, H / BASE_H), VW = W / S, VH = H / S;
      var exW = Math.max(0, VW - BASE_W), exH = Math.max(0, VH - BASE_H);
      if (exW < 0.01) exW = 0;
      if (exH < 0.01) exH = 0;
      st.S = S; st.exW = exW; st.exH = exH; st.VW = BASE_W + exW; st.VH = BASE_H + exH;
      var fullH = Math.max(st.VH, pageH);
      frame.style.width = st.VW + 'px'; frame.style.height = fullH + 'px';
      frame.style.transform = S === 1 ? 'none' : 'scale(' + S + ')';
      applyPlan(plans, st, exW, exH);
      if (!pageH) grow(exW, exH);
    }
    var rsT = 0;
    function relayout() {
      root.classList.add('dg-resizing');
      fit();
      clearTimeout(rsT);
      rsT = setTimeout(function () { root.classList.remove('dg-resizing'); }, 140);
    }
    st.fit = fit;
    fit();
    /* 긴 화면 — 헤더를 위에 고정한다 */
    if (pageH && header) {
      header.style.zIndex = '20';
      st.onScroll = function () { header.style.transform = 'translateY(' + (root.scrollTop / (st.S || 1)) + 'px)'; };
      root.addEventListener('scroll', st.onScroll, { passive: true });
    }
    if (window.ResizeObserver) { st.ro = new ResizeObserver(relayout); st.ro.observe(root); }
    else { st.onResize = relayout; window.addEventListener('resize', relayout); }
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('dg-live'); }); });
  }

  /* ══════════════════ 2. 시각 ══════════════════
     화면의 날짜 · 시각을 시안 기준 시각(REF)에서 '지금'으로 옮긴다 — 열 때마다 최근 내용처럼 보인다.
     CCTV 화면 시각은 초 단위로 흐른다. */
  function fmt(d, secs, timeOn) {
    var s = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
    if (timeOn) s += ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes());
    if (secs) s += ':' + p2(d.getSeconds());
    return s;
  }
  var RE_DATE = /(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2})(?::(\d{2}))?)?/;
  function installClock(root, st) {
    var shift = Date.now() - REF, ticking = [];
    all(root, 'p').forEach(function (p) {
      if (p.children.length) return;
      var t = p.textContent, m = RE_DATE.exec(t);
      if (!m) return;
      if (!/^(날짜 : )?\d{4}-\d{2}-\d{2}( \d{2}:\d{2}(:\d{2})?)?$/.test(t.trim())) return;
      var d = new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 12), +(m[5] || 0), +(m[6] || 0));
      if (st.scene === 'cctv') { ticking.push(p); return; }
      var nd = new Date(d.getTime() + shift);
      write(p, t.replace(m[0], fmt(nd, m[6] != null, m[4] != null)));
    });
    if (ticking.length) {
      var tick = function () { var s = fmt(new Date(), true, true); ticking.forEach(function (p) { write(p, s); }); };
      tick();
      st.timers.push(setInterval(tick, 1000));
    }
  }

  /* ══════════════════ 3. 화면 잇기 ══════════════════ */
  var NAV_TO = { 'Nav Item/MY': 'main', 'Nav Item/Drawing': 'search', 'Nav Item/CCTV': 'cctv', 'Nav Item/Community': 'desk' };
  var CLOSE_TO = { equipment: 'register', help: 'register', 'main-popup': 'main-menu', 'main-select': 'main', 'preview-popup': 'preview', 'total-search': 'main', 'total-result': 'main' };
  function installNav(root, st) {
    var sc = st.scene, real = all(root, '[data-name]').filter(function (el) { return !el.closest('[data-name^="Background Screen/"]'); });
    function each(pred, fn) { real.filter(function (el) { return pred(nameOf(el), el); }).forEach(fn); }
    function to(pred, scene) { each(pred, function (el) { clickable(el, function () { goto(scene); }); }); }
    each(function (n) { return !!NAV_TO[n]; }, function (el) {
      var target = NAV_TO[nameOf(el)];
      clickable(el, function () { goto(target); });
    });
    to(function (n) { return n === 'Home Link'; }, 'main');
    to(function (n) { return n === 'Search Bar'; }, 'total-search');
    to(function (n) { return n === 'Button/Help'; }, 'help');
    to(function (n) { return n === 'Button/Login'; }, 'main');
    to(function (n) { return n === 'Select/Office'; }, sc === 'main-select' ? 'main' : 'main-select');
    to(function (n) { return n === 'Option/Office'; }, 'main');
    to(function (n, el) { return n === 'Icon/Header' && el.parentElement && el.parentElement.children[1] === el; }, 'main-popup');
    to(function (n) { return n === 'List Item/Office'; }, 'main-menu');
    to(function (n) { return n === 'List Item/Drawing'; }, 'search');
    to(function (n) { return n === 'Nav Item/LNB'; }, 'search');
    if (isMain(sc)) {
      each(function (n) { return n === 'Widget/Help Desk'; }, function (w) { all(w, '[data-name="List Item/Post"]').forEach(function (p) { clickable(p, function () { goto('desk-detail'); }); }); });
    }
    if (CLOSE_TO[sc]) to(function (n, el) { return n === 'Button/Close' || n === 'Button/Popup Close' || (n === 'Button/Change' && sc === 'main-popup'); }, CLOSE_TO[sc]);
    if (/^(search|search-detail|preview)$/.test(sc)) {
      to(function (n) { return n === 'Button/Edit Request'; }, 'checkin');
      to(function (n) { return n === 'Button/Preview'; }, sc === 'preview' ? 'search' : 'preview');
      to(function (n) { return n === 'File Item'; }, 'preview-popup');
    }
    if (sc === 'register') {
      to(function (n) { return n === 'Button/Input'; }, 'equipment');
      to(function (n) { return n === 'Button/Register' || n === 'Button/Save Draft'; }, 'search');
    }
    if (sc === 'checkin') to(function (n) { return n === 'Button/Check In' || n === 'Button/Cancel'; }, 'search');
    if (sc === 'desk') {
      to(function (n) { return n === 'Button/Inquiry'; }, 'desk-write');
      all(root, '[data-name="Rows"] > [data-name="Row"]').forEach(function (r) { if ((r.textContent || '').trim()) clickable(r, function () { goto('desk-detail'); }); });
    }
    if (sc === 'desk-write') to(function (n) { return n === 'Button/Register' || n === 'Button/List'; }, 'desk');
    if (sc === 'desk-detail') { to(function (n) { return n === 'Button/List'; }, 'desk'); to(function (n) { return n === 'Post Link'; }, 'desk-detail'); }
    if (sc === 'total-search') to(function (n) { return /^Chip\//.test(n); }, 'total-result');
    /* 즐겨찾기 표시 켜고 끄기 */
    var imgs = all(root, '[data-name="Td/Bookmark"] img');
    var srcs = []; imgs.forEach(function (i) { var s = i.getAttribute('src'); if (srcs.indexOf(s) < 0) srcs.push(s); });
    if (srcs.length >= 2) imgs.forEach(function (i) {
      var b = i.closest('[data-name="Bookmark"]') || i.parentElement;
      clickable(b, function () { i.setAttribute('src', i.getAttribute('src') === srcs[0] ? srcs[1] : srcs[0]); });
    });
    /* 통합검색 결과 탭 */
    if (sc === 'total-result') {
      var tabs = all(root, '[data-name^="Tab/"]'), secs = all(root, '[data-name^="Result Section/"]');
      var select = function (t) {
        tabs.forEach(function (x) { x.classList.toggle('dg-tab-on', x === t); x.classList.toggle('dg-tab-off', x !== t); });
        var nm = nameOf(t).replace('Tab/', '').replace(' (Selected)', '');
        secs.forEach(function (s) { var show = nm === 'All' || nameOf(s) === 'Result Section/' + nm; s.classList.toggle('dg-hide', !show); });
      };
      tabs.forEach(function (t) { clickable(t, function () { select(t); }); });
    }
    /* CCTV — 카드 · 화면 선택 */
    if (sc === 'cctv') {
      var views = all(root, '[data-name^="CCTV View/"]');
      views.forEach(function (v) { clickable(v, function () { views.forEach(function (x) { x.classList.toggle('dg-on', x === v); x.classList.toggle('dg-off', x !== v); }); }); });
    }
  }

  /* ══════════════════ 4. 접기 ══════════════════
     트리 — 화살표가 있는 항목을 누르면 더 안쪽으로 들어간 항목들이 부드럽게 접힌다.
     상세검색 — 조회 조건의 Advanced Filters 를 접고 펴고, 줄어든 만큼 표가 받는다. */
  function installFold(root, st) {
    all(root, '[data-name="Items"]').forEach(function (list) {
      if (list.closest('[data-name^="Background Screen/"]')) return;
      var items = Array.prototype.filter.call(list.children, function (c) { return nameOf(c) === 'Tree Item'; });
      function indent(it) { var ic = it.querySelectorAll('[data-name="Icon/Tree"]'); var last = ic[ic.length - 1]; return last ? last.offsetLeft + last.parentElement.offsetLeft : 0; }
      var ind = items.map(indent);
      items.forEach(function (it) { it.__h = it.offsetHeight; it.style.height = it.__h + 'px'; });
      function kids(i) { var out = []; for (var j = i + 1; j < items.length && ind[j] > ind[i] + 2; j++) out.push(j); return out; }
      items.forEach(function (it, i) {
        var k = kids(i);
        if (it.children.length < 2) return;
        var arrow = nameOf(it.children[0]) === 'Icon/Tree';
        if (!arrow) return;
        clickable(it, function () {
          var close = !it.classList.contains('dg-tree-closed');
          it.classList.toggle('dg-tree-closed', close);
          k.forEach(function (j) { items[j].classList.toggle('dg-tree-gone', close); });
        });
      });
    });
    var btn = all(root, '[data-name="Button/Advanced Search"]').filter(function (b) { return !b.closest('[data-name^="Background Screen/"]'); })[0];
    if (!btn) return;
    if (st.scene === 'search-detail') {
      var adv = one(root, '[data-name="Advanced Filters"]'), div = adv && adv.previousElementSibling;
      var form = adv && adv.parentElement;
      if (!adv) return;
      var A0 = adv.offsetHeight, D0 = div.offsetHeight;
      var delta = A0 + D0;
      var sp = one(root, '[data-name="Search Panel"]'), spBody = sp && kid(sp, 'Body');
      [adv, div, form, sp, spBody].forEach(base);
      var rp = one(root, '[data-name="Result Panel"]'), rbody = rp && kid(rp, 'Body'), tv = one(root, '[data-name="Table Viewport"]');
      var fold = function (on, instant) {
        if (instant) root.classList.add('dg-resizing');
        root.classList.toggle('dg-folded', on);
        var d = on ? delta : 0;
        imp(adv, 'height', (on ? 0 : A0) + 'px'); imp(div, 'height', (on ? 0 : D0) + 'px');
        setH(form, -d); if (sp) setH(sp, -d); if (spBody) setH(spBody, -d);
        var ex = (st.exH || 0) + d;
        setH(tv, ex); setH(rbody, ex); setH(rp, ex);
        if (instant) { void root.offsetWidth; root.classList.remove('dg-resizing'); }
      };
      clickable(btn, function () { fold(!root.classList.contains('dg-folded')); });
      var first = false; try { first = sessionStorage.getItem('wemb-drawing-unfold') === '1'; sessionStorage.removeItem('wemb-drawing-unfold'); } catch (e) { }
      if (first) { fold(true, true); requestAnimationFrame(function () { requestAnimationFrame(function () { fold(false); }); }); }
    } else if (/^(search|preview)$/.test(st.scene)) {
      clickable(btn, function () { try { sessionStorage.setItem('wemb-drawing-unfold', '1'); } catch (e) { } goto('search-detail'); });
    }
  }

  /* ══════════════════ 5. 차트 바꾸기(패널편집 중) ══════════════════ */
  var CC = { bl: '#3967fd', sk: '#2f8cff', gn: '#01ac50', re: '#ff3b3b', am: '#f5a623', vi: '#7b61ff' };
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
    el.className = 'dg-chart';
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
        s += '<clipPath id="dgc' + spec.uid + '"><rect x="' + L + '" y="0" width="' + (w - L - R) + '" height="' + h + '"/></clipPath><g clip-path="url(#dgc' + spec.uid + ')">';
        data.forEach(function (a, si) {
          var col = spec.series[si][1];
          var pts = a.map(function (v, i) { return X(i).toFixed(1) + ',' + Y(v).toFixed(1); }).join(' ');
          if (spec.k === 'area' || si === 0) {
            s += '<defs><linearGradient id="dgg' + spec.uid + si + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + col + '" stop-opacity="' + (spec.k === 'area' ? .4 : .18) + '"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></linearGradient></defs>';
            s += '<polygon fill="url(#dgg' + spec.uid + si + ')" points="' + X(0).toFixed(1) + ',' + (h - B) + ' ' + pts + ' ' + X(N - 1).toFixed(1) + ',' + (h - B) + '"/>';
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
        + '<defs><linearGradient id="dggg' + spec.uid + '" x1="0" x2="1"><stop offset="0" stop-color="#2a7ca0"/><stop offset="1" stop-color="' + spec.c + '"/></linearGradient></defs>'
        + '<path d="M8 52a42 42 0 0 1 84 0" fill="none" stroke="rgba(142,166,179,.2)" stroke-width="8"/>'
        + '<path class="arc" d="M8 52a42 42 0 0 1 84 0" fill="none" stroke="url(#dggg' + spec.uid + ')" stroke-width="8" stroke-dasharray="0 ' + LEN.toFixed(1) + '"/>'
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


  var chartUid = 0;
  function syncChartHue(root, probe) {
    var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(getComputedStyle(probe).color);
    if (!m) return;
    var r = +m[1], g = +m[2], b = +m[3], mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    if (!d) return;
    var h = (mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60;
    var rot = ((h - 226 + 540) % 360) - 180;
    root.style.setProperty('--dg-chue', (Math.abs(rot) < 3 ? 0 : Math.round(rot)) + 'deg');
  }
  var ST = [['승인', CC.bl, 412], ['체크아웃', CC.am, 38], ['검토중', CC.vi, 57], ['등록', CC.gn, 24]];
  var SPEC = {
    'Panel': [
      { k: 'hbar', t: '사업소별 등록 도면', unit: '건', cats: ['청해', '서림', '해솔', '가온', '누리', '한별'], vals: [186, 142, 121, 64, 88, 31], max: 200, c: CC.bl },
      { k: 'donut', t: '도면 상태 비율', unit: '건', parts: ST },
      { k: 'line', t: '주간 체크인 · 등록 추이', unit: '건', series: [['체크인', CC.bl, 18, 4], ['등록', CC.gn, 12, 3]], lo: 0, hi: 34 },
      { k: 'bar', t: '결재 단계별 도면', unit: '건', cats: ['등록', '체크인', '회수', '상신', '승인'], vals: [12, 4, 2, 6, 9], max: 16, c: CC.bl },
    ],
    'Widget/Notice': [
      { k: 'bar', t: '월별 공지 건수', unit: '건', cats: ['6월', '7월', '8월', '9월', '10월', '11월'], vals: [3, 5, 2, 4, 6, 3], max: 8, c: CC.bl },
      { k: 'donut', t: '공지 유형', unit: '건', parts: [['점검', CC.bl, 9], ['안내', CC.sk, 11], ['업데이트', CC.vi, 6]] },
    ],
    'Widget/Help Desk': [
      { k: 'gauge', t: '문의 답변 완료율', unit: '%', v: [92.4, .6], max: 100, c: CC.gn, dec: 1 },
      { k: 'line', t: '일별 문의 추이', unit: '건', series: [['문의', CC.bl, 5, 1.6]], lo: 0, hi: 12 },
      { k: 'donut', t: '문의 유형', unit: '건', parts: [['사용법', CC.bl, 21], ['오류', CC.re, 7], ['권한', CC.am, 9]] },
    ],
  };
  function targets(root, st) {
    if (!isMain(st.scene)) return [];
    return Object.keys(SPEC).map(function (nm) {
      var w = all(root, '[data-name="' + nm + '"]').filter(function (x) { return !x.closest('[data-name^="Background Screen/"]'); })[0];
      if (!w) return null;
      var body = kid(w, 'Body') || w, title = kid(body, 'Header');
      var hide = Array.prototype.filter.call(body.children, function (c) { return c !== title; });
      var S = st.S || 1, tH = title ? (title.getBoundingClientRect().bottom - w.getBoundingClientRect().top) / S + 12 : 60;
      return { key: nm, w: w, hide: hide, list: SPEC[nm], box: { l: 28, t: tH, r: 28, b: 24 } };
    }).filter(Boolean);
  }
  function installChartSwap(root, st) {
    var saved = load(K_CHART)[st.scene] || {};
    st.charts = {}; st.chartApply = {};
    var probe = document.createElement('i');
    probe.className = 'dg-probe';
    st.frame.appendChild(probe);
    targets(root, st).forEach(function (tg) {
      if (getComputedStyle(tg.w).position === 'static') tg.w.style.position = 'relative';
      var host = document.createElement('div');
      host.className = 'dg-host';
      host.style.left = tg.box.l + 'px'; host.style.top = tg.box.t + 'px'; host.style.right = tg.box.r + 'px'; host.style.bottom = tg.box.b + 'px';
      tg.w.appendChild(host);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dg-chartbtn';
      btn.innerHTML = KIND_ICON.bar.replace('class="ic"', 'class="ic" style="width:13px;height:11px"') + '차트';
      btn.title = '이 패널의 차트 바꾸기';
      var menu = document.createElement('div');
      menu.className = 'dg-chartmenu';
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
        host.innerHTML = '';
        tg.w.classList.toggle('dg-swapped', i >= 0);
        tg.hide.forEach(function (h) { if (h) h.style.visibility = i >= 0 ? 'hidden' : ''; });
        if (i >= 0 && tg.list[i]) st.charts[tg.key] = makeChart(host, Object.assign({ uid: ++chartUid }, tg.list[i]));
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
        all(root, '.dg-chartmenu.open').forEach(function (m) { if (m !== menu) m.classList.remove('open'); });
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
      if (e.target.closest && e.target.closest('.dg-chartmenu, .dg-chartbtn')) return;
      all(root, '.dg-chartmenu.open').forEach(function (m) { m.classList.remove('open'); });
    };
    document.addEventListener('pointerdown', st.onDocDown, true);
  }

  /* ══════════════════ 6. 패널 옮기기 ══════════════════
     같은 크기 패널(메인 공지 · Help Desk, CCTV 네 화면)은 놓는 자리와 맞바꾼다 — FLIP 으로 미끄러진다.
     그 밖의 패널은 4px 격자 자유 이동. 묶음(나의 도면현황 = Panel + Workflow)은 함께 움직인다. */
  var SWAP = { main: ['Widget/Notice', 'Widget/Help Desk'], 'main-menu': ['Widget/Notice', 'Widget/Help Desk'], 'main-select': ['Widget/Notice', 'Widget/Help Desk'], 'main-popup': ['Widget/Notice', 'Widget/Help Desk'], cctv: ['CCTV View/'] };
  var FREE = { main: ['Widget/My Drawings'], 'main-menu': ['Widget/My Drawings'], 'main-select': ['Widget/My Drawings'], 'main-popup': ['Widget/My Drawings'], cctv: ['Site List'], search: ['Tree Panel', 'Search Panel', 'Result Panel'], 'search-detail': ['Tree Panel', 'Search Panel', 'Result Panel'], preview: ['Tree Panel', 'Search Panel', 'Result Panel', 'Preview Files'], register: ['Section/'], checkin: ['Section/'], desk: ['Filter Panel', 'Result Panel'], 'desk-write': ['Form Section', 'Actions'], 'desk-detail': ['Article'], 'total-result': ['Search Header', 'Content'], login: ['Login Card', 'Form'] };
  function installPanelMove(root, st) {
    var LS = load(K_LAYOUT), me = LS[st.scene] = LS[st.scene] || {};
    function persist() { var a = load(K_LAYOUT); a[st.scene] = me; save(K_LAYOUT, a); }
    function match(list) { return all(st.frame, '[data-name]').filter(function (el) { var n = nameOf(el); if (el.closest('[data-name^="Background Screen/"]')) return false; return list.some(function (p) { return p.slice(-1) === '/' ? n.indexOf(p) === 0 : n === p; }); }); }
    var swaps = match(SWAP[st.scene] || []), frees = match(FREE[st.scene] || []).filter(function (e) { return !e.parentElement.closest('.dg-mv'); });
    me.pos = me.pos || {};
    me.free = me.free || {};
    function sid(el) { return nameOf(el) + '#' + el.getAttribute('data-node-id'); }
    /* 자리표 */
    var slots = swaps.map(function (w) { var b = base(w); return { w: w, l: b.l, t: b.t }; });
    swaps.forEach(function (w) { w.classList.add('dg-mv'); w.setAttribute('data-dg-kind', 'swap'); });
    function placed(flip) {
      var before = flip ? swaps.map(function (w) { return [w, w.getBoundingClientRect()]; }) : null;
      slots.forEach(function (s) { var at = me.pos[sid(s.w)]; var tgt = at != null ? slots[at] : s; s.w.__dgB.l = tgt.l; s.w.__dgB.t = tgt.t; });
      st.fit();
      if (before) before.forEach(function (x) {
        var w = x[0], a = x[1], b = w.getBoundingClientRect(), S = st.S || 1;
        var dx = (a.left - b.left) / S, dy = (a.top - b.top) / S;
        if (!dx && !dy) return;
        w.style.transition = 'none'; w.style.translate = dx.toFixed(1) + 'px ' + dy.toFixed(1) + 'px';
        void w.offsetWidth;
        w.style.transition = 'translate .5s ' + EASE; w.style.translate = '';
        setTimeout(function () { w.style.transition = ''; }, 560);
      });
    }
    if (Object.keys(me.pos).length) placed(false);
    /* 자유 이동 — display:contents 묶음은 잎들을 함께 옮긴다 */
    var groups = frees.map(function (f) {
      var els = getComputedStyle(f).display === 'contents' ? leaves(f) : [f];
      els.forEach(function (e) { e.classList.add('dg-mv'); e.setAttribute('data-dg-kind', 'free'); e.__dgGroup = els; e.__dgKey = sid(f); });
      var s = me.free[sid(f)];
      if (s) els.forEach(function (e) { e.__ux = s[0]; e.__uy = s[1]; e.style.translate = s[0] + 'px ' + s[1] + 'px'; });
      return els;
    });
    var drag = null, over = null;
    st.onDown = function (e) {
      if (!layoutEditing(root) || e.button !== 0) return;
      if (e.target.closest('.dg-chartbtn, .dg-chartmenu, .dg-resetbtn')) return;
      if (e.target.closest('[contenteditable="true"]')) return;
      var w = e.target.closest('.dg-mv');
      if (!w || !root.contains(w)) return;
      e.preventDefault(); e.stopPropagation();
      drag = { w: w, kind: w.getAttribute('data-dg-kind'), els: w.__dgGroup || [w], sx: e.clientX, sy: e.clientY, moved: false, dx: 0, dy: 0 };
    };
    st.onMove = function (e) {
      if (!drag) return;
      var S = st.S || 1, dx = (e.clientX - drag.sx) / S, dy = (e.clientY - drag.sy) / S;
      if (!drag.moved) {
        if (Math.hypot(dx, dy) < 3) return;
        drag.moved = true;
        drag.els.forEach(function (x) { x.classList.add('dg-dragging'); });
      }
      drag.dx = dx; drag.dy = dy;
      drag.els.forEach(function (x) { x.style.translate = ((x.__ux || 0) + dx).toFixed(1) + 'px ' + ((x.__uy || 0) + dy).toFixed(1) + 'px'; });
      if (drag.kind === 'swap') {
        var hit = null;
        swaps.forEach(function (o) {
          if (o === drag.w) return;
          var r = o.getBoundingClientRect();
          if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) hit = o;
        });
        if (over && over !== hit) over.classList.remove('dg-drop');
        over = hit;
        if (over) over.classList.add('dg-drop');
      }
    };
    st.onUp = function () {
      if (!drag) return;
      var d = drag; drag = null;
      d.els.forEach(function (x) { x.classList.remove('dg-dragging'); });
      if (!d.moved) return;
      if (d.kind === 'free') {
        var snap = function (v) { return Math.round(v / 4) * 4; };
        var nx = snap((d.els[0].__ux || 0) + d.dx), ny = snap((d.els[0].__uy || 0) + d.dy);
        d.els.forEach(function (x) { x.__ux = nx; x.__uy = ny; x.style.translate = nx + 'px ' + ny + 'px'; });
        me.free[d.els[0].__dgKey] = [nx, ny];
        persist();
        return;
      }
      var w = d.w, target = over;
      if (over) over.classList.remove('dg-drop');
      over = null;
      if (!target) { w.style.transition = 'translate .45s ' + EASE; w.style.translate = ''; setTimeout(function () { w.style.transition = ''; }, 480); return; }
      w.style.translate = '';
      var idx = function (el) { var at = me.pos[sid(el)]; return at != null ? at : swaps.indexOf(el); };
      var a = idx(w), b = idx(target);
      me.pos[sid(w)] = b; me.pos[sid(target)] = a;
      placed(true);
      persist();
    };
    root.addEventListener('pointerdown', st.onDown, true);
    window.addEventListener('pointermove', st.onMove);
    window.addEventListener('pointerup', st.onUp);
    window.addEventListener('pointercancel', st.onUp);
    st.onDragStart = function (e) { if (layoutEditing(root) && e.target.closest && e.target.closest('.dg-mv')) e.preventDefault(); };
    root.addEventListener('dragstart', st.onDragStart);
    st.resetLayout = function () {
      me = { pos: {}, free: {} };
      var a = load(K_LAYOUT); a[st.scene] = me; save(K_LAYOUT, a);
      groups.forEach(function (els) { els.forEach(function (e) { e.__ux = 0; e.__uy = 0; e.style.translate = ''; }); });
      if (swaps.length) placed(true);
      Object.keys(st.chartApply || {}).forEach(function (k) { st.chartApply[k](-1); });
      st.fit();
    };
    if (!swaps.length && !groups.length) return;
    var rb = document.createElement('button');
    rb.type = 'button';
    rb.className = 'dg-resetbtn';
    rb.textContent = '배치 초기화';
    rb.title = '패널 자리 · 바꾼 차트를 원본으로';
    st.frame.appendChild(rb);
    rb.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    rb.addEventListener('pointerup', function (e) { e.stopPropagation(); e.preventDefault(); st.resetLayout(); });
    st.onReset = function (e) { if (e.target.closest && e.target.closest('#layoutReset')) st.resetLayout(); };
    document.addEventListener('click', st.onReset, true);
  }

  /* ══════════════════ 살리기 ══════════════════ */
  function start(root, st) {
    [['fit', installFit], ['clock', installClock], ['nav', installNav], ['fold', installFold], ['swap', installChartSwap], ['move', installPanelMove]]
      .forEach(function (s) { try { s[1](root, st); } catch (e) { console.warn('[dg] ' + s[0], e); } });
    if (st.fit) st.fit();
    root.classList.add('dg-enter');
    st.timers.push(setTimeout(function () { root.classList.remove('dg-enter'); }, 1200));
  }
  function initDrawing(root) {
    if (!root || root.__dg) return;
    injectStyle();
    root.classList.add('dg-root');
    var px = /(dw[a-z])-root/.exec(root.className);
    var st = root.__dg = { timers: [], px: px ? px[1] : 'dwm', scene: px ? SCENES[px[1]] : 'main' };
    if (/[?&]edit=1/.test(location.search)) root.classList.add('dg-edit-layout');
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
  function disposeDrawing(root) {
    var st = root && root.__dg;
    if (!st) return;
    if (st.wait) st.wait.disconnect();
    st.timers.forEach(function (t) { clearInterval(t); clearTimeout(t); });
    if (st.ro) st.ro.disconnect();
    if (st.onResize) window.removeEventListener('resize', st.onResize);
    if (st.onScroll) root.removeEventListener('scroll', st.onScroll);
    Object.keys(st.charts || {}).forEach(function (k) { st.charts[k].dispose(); });
    if (st.onDocDown) document.removeEventListener('pointerdown', st.onDocDown, true);
    if (st.onDown) root.removeEventListener('pointerdown', st.onDown, true);
    if (st.onMove) window.removeEventListener('pointermove', st.onMove);
    if (st.onUp) { window.removeEventListener('pointerup', st.onUp); window.removeEventListener('pointercancel', st.onUp); }
    if (st.onDragStart) root.removeEventListener('dragstart', st.onDragStart);
    if (st.onReset) document.removeEventListener('click', st.onReset, true);
    root.__dg = null;
  }
  window.initDrawing = initDrawing;
  window.disposeDrawing = disposeDrawing;
})();
