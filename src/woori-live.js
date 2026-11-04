/* 우리은행 통합 대시보드 — 재구축 화면 세 장(거래현황 · 성능현황 · 이벤트현황)의 인터랙션 · 라이브 · 반응형 레이어.
   window.initWoori(root) / window.disposeWoori(root)

   화면(DOM·CSS)은 생성기(src/woori/_gen/conv.js)가 Figma(qln8qMsqzCt918dZOQOWOS) 그대로 만든다.
   이 파일은 그 위에 '움직이는 것'만 얹는다 — 정지 상태(?live=0) = Figma 원본.

   · 반응형 — 1920x1080 좌표계 + 균일 배율 S. 남는 폭 · 높이(exW · exH)는 패널이 나눠 갖는다. 정확히 16:9 면 늘어난 몫이 0 이라 Figma 와 같다.
   · 실시간 시계 · 열 때마다 최근 시각(이벤트 발생일시 · 시간축)
   · 마우스 오버 · 눌림(헤더 메뉴 · 아이콘 · 네트워크 칩 · 구성도 · 표 줄 · 조회 · 초기화 · ACK · 등급 칩 · 드롭다운)
   · 라이브 — 막대 · 꺾은선이 실시간처럼 움직이고(t=0 = 원본) 숫자가 따라 바뀐다. 사람이 고친 글자는 덮지 않는다.
   · 이벤트 목록 — Fold Button 으로 접고 펴기, 등급 칩 거르기, 조회 · 초기화, 자동고침(새 이벤트가 맨 위로), 줄 고르기 · ACK
   · 차트 바꾸기(패널편집 중) — 패널마다 이 프로젝트(거래 · 성능 · 이벤트)에 맞춘 추천 차트
   · 패널 옮기기(패널편집 중) — 다른 자리에 놓으면 나머지가 흘러 빈틈 없이 다시 놓인다

   손으로 쓴 파일이다(생성물 아님). 고친 뒤 js/core/tpl-modules.js 의 ?v= 를 올릴 것. */
(function () {
  'use strict';

  var BASE_W = 1920, BASE_H = 1080;
  var K_LAYOUT = 'wemb-woori-layout', K_CHART = 'wemb-woori-chart', K_FOLD = 'wemb-woori-fold';
  var STYLE_ID = 'woori-live-style';
  var EASE = 'cubic-bezier(.22,.8,.24,1)';

  /* ══════════════════ 스타일 ══════════════════ */
  var CSS = [
    /* 강조 빛 — 다크는 원본 하늘 네온, 라이트는 아래에서 값만 바꾼다 */
    '.wr-root{--wr-acc:41,226,255;--wr-acc2:9,182,251;--wr-hi:#fff;overflow:clip!important;}',
    '.wr-root [data-name^="Screen/"]{background:transparent!important;}',
    '.wr-root .wr-bgimg{object-fit:cover;}',
    /* 블록 이동은 CSS translate 속성 하나로 — --wr-tx/ty = 반응형 · 재배치, --wr-dx/dy = 끄는 중 */
    '.wr-root .wr-blk,.wr-root .wr-wl,.wr-root .wr-abs{translate:calc(var(--wr-tx,0px) + var(--wr-dx,0px)) calc(var(--wr-ty,0px) + var(--wr-dy,0px));}',
    '.wr-root.wr-live .wr-blk,.wr-root.wr-live .wr-wl,.wr-root.wr-live .wr-abs{transition:translate .55s ' + EASE + ',opacity .4s ease;}',
    '.wr-root.wr-live .wr-anim{transition:width .55s ' + EASE + ',height .55s ' + EASE + ',translate .55s ' + EASE + ',margin .55s ' + EASE + ',gap .55s ' + EASE + ',left .55s ' + EASE + ',top .55s ' + EASE + ';}',
    '.wr-root.wr-resizing *,.wr-root .wr-dragging,.wr-root .wr-dragging *{transition:none!important;}',
    /* Figma GROUP 위젯(display:contents)을 화면 크기 투명 층으로 세운다 — 안쪽 좌표는 그대로라 그림이 같다 */
    '.wr-root .wr-wl{display:block!important;position:absolute!important;left:0!important;top:0!important;right:auto!important;bottom:auto!important;margin:0!important;transform:none!important;width:1920px;height:1080px;pointer-events:none;}',
    '.wr-root .wr-wl > *{pointer-events:auto;}',
    /* 오토레이아웃 줄 — 자식을 화면 좌표로 꺼낸다(자리 값은 라이브가 재서 준다) */
    '.wr-root .wr-flat{display:block!important;position:absolute!important;left:0!important;top:0!important;right:auto!important;bottom:auto!important;width:1920px!important;height:1080px!important;margin:0!important;transform:none!important;pointer-events:none;}',
    '.wr-root .wr-abs{position:absolute!important;margin:0!important;pointer-events:auto;}',

    /* ── '여기 눌린다' ── */
    '.wr-root .wr-click{cursor:pointer;}',
    '.wr-root .wr-click *{cursor:inherit;}',
    '.dt-content-editing .wr-root .wr-click,.dt-content-editing .wr-root .wr-click *{cursor:text;}',
    '.wr-root .wr-click:focus-visible{outline:2px solid rgb(var(--wr-acc));outline-offset:2px;}',

    /* 헤더 메뉴 */
    '.wr-root [data-name^="Nav Item/"]{transition:background-color .2s ease,box-shadow .2s ease,translate .2s ease;}',
    '.wr-root [data-name^="Nav Item/"]:not([data-name$="(Active)"]):hover{background-color:#0a4a74!important;translate:0 -1px;box-shadow:0 0 0 1px rgba(9,182,251,.6),inset 0 0 0 1px rgba(9,182,251,.6),0 0 14px rgba(9,182,251,.45)!important;}',
    '.wr-root [data-name^="Nav Item/"]:not([data-name$="(Active)"]):hover p{color:#fff!important;}',
    '.wr-root [data-name^="Nav Item/"]:not([data-name$="(Active)"]):active{translate:0 1px;}',
    '.wr-root [data-name$="(Active)"] > [data-name="Content"]{transition:box-shadow .2s ease;}',
    '.wr-root [data-name$="(Active)"]:hover > [data-name="Content"]{box-shadow:0 0 0 1px rgba(9,182,251,.6),inset 0 0 0 1px rgba(9,182,251,.6),0 0 14px rgba(9,182,251,.5)!important;}',
    '.wr-root [data-name$="(Active)"] > [data-name="Indicator"]{animation:wrBob 1.8s ease-in-out infinite;}',
    '@keyframes wrBob{0%,100%{translate:0 0;}50%{translate:0 2px;}}',
    /* 헤더 아이콘 · 브랜드 */
    '.wr-root [data-name^="Icon/Action/User"],.wr-root [data-name^="Icon/Action/Logout"]{transition:scale .2s ease,filter .2s ease;}',
    '.wr-root [data-name^="Icon/Action/User"]:hover,.wr-root [data-name^="Icon/Action/Logout"]:hover{scale:1.16;filter:brightness(1.3) drop-shadow(0 0 6px rgba(var(--wr-acc),.7));}',
    '.wr-root [data-name="Brand"] [data-name="Logo Mark"]{transition:scale .2s ease;}',
    '.wr-root [data-name="Brand"]:hover [data-name="Logo Mark"]{scale:1.08;}',
    /* 네트워크 칩 */
    '.wr-root [data-name^="Option/"]{transition:filter .2s ease,translate .2s ease,box-shadow .2s ease,border-color .2s ease;}',
    '.wr-root [data-name^="Option/"]:hover{filter:brightness(1.35);translate:0 -1px;}',
    '.wr-root [data-name^="Option/"]:active{translate:0 1px;}',
    '.wr-root [data-name^="Option/"].wr-on{border-color:rgb(var(--wr-acc))!important;box-shadow:0 0 12px rgba(var(--wr-acc),.55);}',
    /* 구성도 — 장비가 살짝 떠 있고, 올리면 커지며 빛난다 */
    '.wr-root [data-name^="Node/"] [data-name="Visual"]{transition:scale .3s ' + EASE + ',filter .3s ease;animation:wrFloat 5.2s ease-in-out infinite;}',
    '.wr-root [data-name^="Node/"]:nth-of-type(2n) [data-name="Visual"]{animation-delay:-2.1s;}',
    '.wr-root [data-name^="Node/"]:hover [data-name="Visual"]{scale:1.06;filter:brightness(1.12) drop-shadow(0 6px 14px rgba(var(--wr-acc),.45));}',
    '@keyframes wrFloat{0%,100%{translate:0 0;}50%{translate:0 -3px;}}',
    '.wr-root [data-name="Chip"]{transition:filter .2s ease;}',
    '.wr-root [data-name^="Node/"]:hover [data-name="Chip"],.wr-root [data-name^="Node Group/"]:hover [data-name="Chip"]{filter:brightness(1.25);}',
    '.wr-root [data-name="Glow"]{animation:wrGlow 4.6s ease-in-out infinite;}',
    '@keyframes wrGlow{0%,100%{opacity:1;}50%{opacity:.62;}}',
    '.wr-root [data-name^="Cube "],.wr-root [data-name^="Building "]{animation:wrFloat 4.4s ease-in-out infinite;}',
    '.wr-root [data-name="Counter"]::after{animation:wrSpin 46s linear infinite;}',
    '@keyframes wrSpin{to{rotate:360deg;}}',
    /* 연결선의 세 화살표 — 차례로 밝아진다 */
    '.wr-root svg [data-name^="Arrow"]{animation:wrArrow 1.8s ease-in-out infinite;}',
    '.wr-root svg [data-name="Arrow_3"]{animation-delay:0s;}.wr-root svg [data-name="Arrow_2"]{animation-delay:.28s;}.wr-root svg [data-name="Arrow"]{animation-delay:.56s;}',
    '@keyframes wrArrow{0%,100%{opacity:.55;}40%{opacity:1;}}',
    /* 표 · 수치 칸 · 카드 */
    '.wr-root [data-name="Stats"] [data-name^="Td/"],.wr-root [data-name="Stats"] [data-name^="Th/"]{transition:background-color .18s ease;}',
    '.wr-root [data-name="Stats"] [data-name^="Td/"]:hover{background-color:rgba(var(--wr-acc),.14)!important;}',
    '.wr-root [data-name="Card BG"]{transition:box-shadow .22s ease;}',
    '.wr-root [data-name^="Widget/"]:hover > [data-name="Card BG"]{box-shadow:0 0 0 1px rgba(42,124,160,.8),inset 0 0 0 1px rgba(42,124,160,.8),0 0 14px rgba(var(--wr-acc2),.22)!important;}',
    '.wr-root [data-name^="Metric/"] p:last-child,.wr-root .wr-num{font-variant-numeric:tabular-nums;}',
    '.wr-root .wr-num:not(.wr-keepw){width:auto!important;}',
    '.wr-root .wr-tick{animation:wrTick .5s ease;}',
    '@keyframes wrTick{from{filter:brightness(1.7);}to{filter:none;}}',
    '.wr-root [data-name^="Table/"] [data-name^="Row/"]{transition:background-color .16s ease,opacity .26s ease;}',
    '.wr-root [data-name^="Table/"] [data-name^="Row/"]:hover{background-color:rgba(var(--wr-acc),.1);}',
    '.wr-root [data-name="Table/Event List"] [data-name^="Row/"]{cursor:pointer;}',
    '.wr-root [data-name^="Table/"] [data-name^="Row/"].wr-sel{background-color:rgba(var(--wr-acc),.2);}',
    '.wr-root [data-name^="Table/"] [data-name^="Row/"].wr-dim{opacity:.22;}',
    '.wr-root [data-name^="Row/"].wr-new{animation:wrNew 1.1s ease;}',
    '@keyframes wrNew{from{background-color:rgba(var(--wr-acc),.42);}to{background-color:transparent;}}',
    /* 상태 표지 — 그림의 안쪽 그림자 필터가 가장자리를 계단지게 만들어 작게 그려지면 네모처럼 보인다 → 둥글게 잘라 매끈하게 */
    '.wr-root [data-name^="Marker ("],.wr-root [data-name^="Count/"] [data-name="Marker"]{border-radius:50%;overflow:hidden;}',
    /* 범례 — 눌러 시리즈 끄고 켜기 */
    '.wr-root [data-name^="Item/"]{transition:opacity .2s ease,translate .2s ease;}',
    '.wr-root [data-name^="Item/"]:hover{translate:0 -1px;}',
    '.wr-root [data-name^="Item/"].wr-off{opacity:.38;}',
    '.wr-root svg [data-name^="Data/"],.wr-root svg [data-name^="Line/"]{transition:opacity .25s ease;}',
    '.wr-root svg .wr-off{opacity:0!important;}',
    /* 이벤트 — 버튼 · 칩 · 드롭다운 · 입력칸 */
    '.wr-root [data-name^="Button/"]{transition:filter .18s ease,translate .18s ease,box-shadow .18s ease;}',
    '.wr-root [data-name^="Button/"]:hover{filter:brightness(1.3);translate:0 -1px;box-shadow:0 3px 10px rgba(var(--wr-acc2),.4);}',
    '.wr-root [data-name^="Button/"]:active{translate:0 1px;filter:brightness(.95);box-shadow:none;}',
    '.wr-root [data-name^="Count/"]{transition:filter .18s ease,translate .18s ease;}',
    '.wr-root [data-name^="Count/"]:hover{filter:brightness(1.3);translate:0 -1px;}',
    '.wr-root [data-name^="Count/"]:active{translate:0 1px;}',
    '.wr-root [data-name^="Count/"].wr-off{filter:brightness(.72);}',
    '.wr-root [data-name^="Count/"].wr-on{filter:brightness(1.12);}',
    '.wr-root [data-name^="Count/"].wr-on::after{opacity:1!important;}',
    '.wr-root [data-name="Dropdown"]{transition:box-shadow .18s ease;}',
    '.wr-root [data-name="Dropdown"]:hover,.wr-root [data-name="Dropdown"].wr-open{box-shadow:0 0 0 1px rgb(var(--wr-acc)),inset 0 0 0 1px rgb(var(--wr-acc))!important;}',
    '.wr-root [data-name="Dropdown"] [data-name="Icon/Action/Expand"]{transition:rotate .25s ease;}',
    '.wr-root [data-name="Dropdown"].wr-open [data-name="Icon/Action/Expand"]{rotate:180deg;}',
    '.wr-root .wr-menu{position:absolute;left:-1px;right:-1px;top:calc(100% + 3px);z-index:60;padding:3px;background:#030517;border:1px solid #2a7ca0;box-shadow:0 10px 24px rgba(0,0,0,.45);opacity:0;translate:0 -4px;pointer-events:none;transition:opacity .16s ease,translate .16s ease;}',
    '.wr-root .wr-open > .wr-menu{opacity:1;translate:0 0;pointer-events:auto;}',
    '.wr-root .wr-menu div{padding:5px 8px;color:#ccc;font-size:14px;font-weight:500;line-height:17px;cursor:pointer;white-space:nowrap;}',
    '.wr-root .wr-menu div:hover{background:rgba(var(--wr-acc),.16);color:#fff;}',
    '.wr-root .wr-menu div.cur{color:rgb(var(--wr-acc));}',
    '.wr-root [data-name="Input"]{cursor:text;transition:filter .18s ease;}',
    '.wr-root [data-name="Input"]:hover,.wr-root [data-name="Input"]:focus-within{filter:brightness(1.5) drop-shadow(0 0 4px rgba(var(--wr-acc),.5));}',
    '.wr-root .wr-input{position:absolute;inset:0;width:100%;height:100%;padding:0 10px;background:transparent;border:0;outline:0;color:#e2f2ff;font:500 14px/28px Pretendard,system-ui,sans-serif;}',
    '.wr-root [data-name="Icon/Action/Refresh"]{transition:scale .2s ease;}',
    '.wr-root [data-name="Icon/Action/Refresh"]:hover{scale:1.12;}',
    '.wr-root [data-name="Icon/Action/Refresh"].wr-spin{animation:wrSpin .8s ' + EASE + ';}',
    /* Fold Button — 원본 드롭다운의 펼침 그림을 쓴다 */
    '.wr-root .wr-fold{position:absolute;right:0;top:-3px;width:26px;height:24px;display:grid;place-items:center;background:#030517;border:1px solid #2a7ca0;cursor:pointer;transition:box-shadow .18s ease,translate .18s ease;}',
    '.wr-root .wr-fold img{width:10.1px;height:8px;transition:rotate .4s ' + EASE + ';}',
    '.wr-root .wr-fold:hover{box-shadow:0 0 0 1px rgb(var(--wr-acc)),0 0 10px rgba(var(--wr-acc),.45);}',
    '.wr-root .wr-fold:active{translate:0 1px;}',
    '.wr-root .wr-isfolded .wr-fold img{rotate:180deg;}',
    '.wr-root [data-name="Widget/Event List"] > [data-name="Title"]{cursor:pointer;}',
    '.wr-root .wr-folding > [data-name="Body"],.wr-root .wr-isfolded > [data-name="Body"]{overflow:hidden;}',
    '.wr-root .wr-isfolded > [data-name="Body"]{opacity:0;}',
    '.wr-root [data-name="Widget/Event List"] > [data-name="Body"]{transition:height .55s ' + EASE + ',opacity .35s ease;}',
    /* 도넛 — 열 때 시계 방향으로 그려진다 */
    '@property --wr-sweep{syntax:"<angle>";inherits:false;initial-value:360deg;}',
    '.wr-root [data-name="Donut"] [data-name="Arc"]{--wr-sweep:360deg;-webkit-mask:conic-gradient(#000 var(--wr-sweep),transparent 0);mask:conic-gradient(#000 var(--wr-sweep),transparent 0);animation:wrSweep 1.3s ' + EASE + ' backwards;}',
    '@keyframes wrSweep{from{--wr-sweep:0deg;}to{--wr-sweep:360deg;}}',

    /* ── 패널편집 — 옮기기 ── */
    '.dt-editing .wr-root .wr-mv > [data-name="Card BG"],.wr-root.wr-edit-layout .wr-mv > [data-name="Card BG"]{outline:1px dashed rgba(var(--wr-acc),0);outline-offset:3px;transition:outline-color .2s ease;}',
    '.dt-editing .wr-root .wr-mv:has(:hover) > [data-name="Card BG"],.wr-root.wr-edit-layout .wr-mv:has(:hover) > [data-name="Card BG"]{outline-color:rgba(var(--wr-acc),.9);}',
    '.dt-editing .wr-root .wr-mv,.dt-editing .wr-root .wr-mv *,.wr-root.wr-edit-layout .wr-mv,.wr-root.wr-edit-layout .wr-mv *{cursor:grab!important;}',
    '.dt-editing .wr-root [data-name^="Table/"].wr-mv,.dt-editing .wr-root [data-name="Widget/Event List"].wr-mv,.wr-root.wr-edit-layout [data-name^="Table/"].wr-mv,.wr-root.wr-edit-layout [data-name="Widget/Event List"].wr-mv{outline:1px dashed rgba(var(--wr-acc),.0);outline-offset:3px;}',
    '.dt-editing .wr-root [data-name^="Table/"].wr-mv:hover,.dt-editing .wr-root [data-name="Widget/Event List"].wr-mv:hover,.wr-root.wr-edit-layout [data-name^="Table/"].wr-mv:hover,.wr-root.wr-edit-layout [data-name="Widget/Event List"].wr-mv:hover{outline-color:rgba(var(--wr-acc),.9);}',
    '.dt-editing .wr-root .wr-fmv,.dt-editing .wr-root .wr-fmv *,.wr-root.wr-edit-layout .wr-fmv,.wr-root.wr-edit-layout .wr-fmv *{cursor:grab!important;}',
    '.dt-content-editing .wr-root p[contenteditable="true"]{cursor:text!important;}',
    '.dt-content-editing .wr-root p[contenteditable="true"]:hover{outline:1px dashed rgba(var(--wr-acc),.7);outline-offset:1px;}',
    '.dt-content-editing .wr-root p[contenteditable="true"]:focus{outline:1px solid rgb(var(--wr-acc));outline-offset:1px;}',
    '.wr-root .wr-mv.wr-dragging,.wr-root .wr-fmv.wr-dragging{z-index:30;filter:drop-shadow(0 14px 22px rgba(0,0,0,.5));}',
    '.wr-root .wr-resetbtn{position:absolute;left:30px;top:72px;z-index:45;display:none;height:24px;padding:0 10px;border:1px solid rgb(var(--wr-acc));background:#06264a;color:#e6f7ff;font:500 12px/1 Pretendard,system-ui,sans-serif;cursor:pointer!important;white-space:nowrap;}',
    '.wr-root .wr-resetbtn:hover{filter:brightness(1.25);box-shadow:0 0 12px rgba(var(--wr-acc),.6);}',
    '.dt-editing .wr-root .wr-resetbtn,.wr-root.wr-edit-layout .wr-resetbtn{display:block;}',
    '.wr-root[data-theme="light"] .wr-resetbtn{background:#fff;color:#06365c;}',
    '.wr-root .wr-ghost{position:absolute;z-index:4;border:2px dashed rgba(var(--wr-acc),.85);background:rgba(var(--wr-acc),.08);pointer-events:none;transition:left .22s ' + EASE + ',top .22s ' + EASE + ',width .22s ' + EASE + ',height .22s ' + EASE + ';}',
    '.dt-editing .wr-root [data-name]{animation-play-state:paused!important;}',

    /* ── 패널편집 — 차트 바꾸기 ── */
    '.wr-root .wr-chost{position:absolute;z-index:6;pointer-events:none;}',
    '.wr-root .wr-chost > *{pointer-events:auto;}',
    '.wr-root.wr-live .wr-chost{transition:left .55s ' + EASE + ',top .55s ' + EASE + ',width .55s ' + EASE + ',height .55s ' + EASE + ';}',
    '.wr-root .wr-chartbtn{position:absolute;top:-11px;right:14px;z-index:25;display:none;align-items:center;gap:4px;height:22px;padding:0 9px;border:1px solid rgb(var(--wr-acc));background:#06264a;color:#e6f7ff;font:500 12px/1 Pretendard,system-ui,sans-serif;cursor:pointer;white-space:nowrap;}',
    /* 막대 위젯은 판 위쪽이 이름표 · 범례로 차 있다 — 단추를 그 아래로 */
    '.wr-root [data-name$=" Transactions"] .wr-chartbtn{top:37px;}',
    '.wr-root [data-name$=" Transactions"] .wr-chartmenu{top:63px;}',
    '.wr-root .wr-chartbtn:hover{filter:brightness(1.25);box-shadow:0 0 12px rgba(var(--wr-acc),.6);}',
    '.dt-editing .wr-root .wr-chartbtn,.dt-content-editing .wr-root .wr-chartbtn,.wr-root.wr-edit-layout .wr-chartbtn{display:inline-flex;}',
    '.wr-root .wr-chartmenu{position:absolute;top:14px;right:14px;z-index:40;min-width:208px;padding:5px;border:1px solid #2a7ca0;background:#071a30;color:#c7ecf4;font:400 13px/1.35 Pretendard,system-ui,sans-serif;box-shadow:0 12px 28px rgba(0,0,0,.5);opacity:0;translate:0 -4px;pointer-events:none!important;transition:opacity .16s ease,translate .16s ease;}',
    '.wr-root .wr-chartmenu.open{opacity:1;translate:0 0;pointer-events:auto!important;}',
    '.wr-root .wr-chartmenu .hd{padding:4px 8px 6px;font-size:11px;color:#8ea6b3;white-space:nowrap;}',
    '.wr-root .wr-chartmenu button{display:flex;align-items:center;gap:8px;width:100%;padding:6px 8px;border:0;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer!important;white-space:nowrap;}',
    '.wr-root .wr-chartmenu button:hover{background:rgba(var(--wr-acc),.14);color:#fff;}',
    '.wr-root .wr-chartmenu button.cur{background:rgba(9,182,251,.26);color:#fff;}',
    '.wr-root .wr-chartmenu .ic{width:18px;height:14px;flex:none;}',
    '.wr-root .wr-chartmenu .rec{margin-left:auto;padding:1px 6px;background:rgb(var(--wr-acc));color:#03202e;font-size:10px;font-weight:700;}',
    '.wr-root .wr-chartmenu .sep{height:1px;margin:4px 2px;background:rgba(199,236,244,.16);}',
    '.wr-root .wr-swapped > :not(.wr-chost):not([data-name="Card BG"]){visibility:hidden;}',
    '.wr-root .wr-hide{visibility:hidden!important;}',
    '.wr-root .wr-chart{position:absolute;inset:0;display:flex;flex-direction:column;padding:10px 14px 8px;background:linear-gradient(180deg,rgba(14,32,54,.97),rgba(12,26,46,.97));box-shadow:inset 0 0 0 1px rgba(42,124,160,.75);color:#c7ecf4;font:400 12px/1.3 Pretendard,system-ui,sans-serif;animation:wrIn .35s ease;}',
    '@keyframes wrIn{from{opacity:0;}to{opacity:1;}}',
    '.wr-root .wr-chart .pl,.wr-root .wr-chart .lg,.wr-root .wr-chart .ct i,.wr-root .wr-chart .ct b{filter:hue-rotate(var(--wr-chue,0deg));}',
    '.wr-root .wr-chart .ct{display:flex;align-items:center;gap:6px;font-weight:500;font-size:15px;color:#fff;white-space:nowrap;}',
    '.wr-root .wr-chart .ct i{display:block;width:8px;height:8px;background:#2a7ca0;flex:none;}',
    '.wr-root .wr-chart .ct b{margin-left:auto;font-family:Tomorrow,Pretendard,sans-serif;font-weight:400;font-size:18px;color:#00ffd2;}',
    '.wr-root .wr-chart .ct b small{font:400 11px Pretendard,sans-serif;color:#8ea6b3;margin-left:3px;}',
    '.wr-root .wr-chart .lg{display:flex;gap:10px;margin-top:3px;font-size:11px;color:#8ea6b3;white-space:nowrap;}',
    '.wr-root .wr-chart .lg span{display:inline-flex;align-items:center;gap:4px;}',
    '.wr-root .wr-chart .lg span:before{content:"";width:9px;height:3px;background:var(--c);}',
    '.wr-root .wr-chart .pl{position:relative;flex:1;min-height:0;margin-top:6px;}',
    '.wr-root .wr-chart svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;}',
    '.wr-root .wr-chart .ax{fill:#8ea6b3;font-size:11px;font-family:Pretendard,system-ui,sans-serif;}',
    '.wr-root .wr-chart .gl{stroke:rgba(142,166,179,.16);stroke-width:1;shape-rendering:crispEdges;}',
    '.wr-root .wr-chart .bars{position:absolute;inset:0 0 16px;display:flex;align-items:flex-end;justify-content:space-around;gap:8px;}',
    '.wr-root .wr-chart .bars > div{position:relative;flex:1;max-width:34px;height:100%;display:flex;align-items:flex-end;}',
    '.wr-root .wr-chart .bars i{display:block;width:100%;background:linear-gradient(180deg,var(--c),rgba(9,182,251,.18));transition:height .9s ' + EASE + ';}',
    '.wr-root .wr-chart .bars em{position:absolute;left:50%;translate:-50% 0;bottom:calc(var(--h) + 2px);font-style:normal;font-size:11px;color:#e6f7ff;white-space:nowrap;transition:bottom .9s ' + EASE + ';}',
    '.wr-root .wr-chart .bars u{position:absolute;left:50%;translate:-50% 0;bottom:-16px;text-decoration:none;font-size:11px;color:#8ea6b3;white-space:nowrap;}',
    '.wr-root .wr-chart .hb{display:flex;flex-direction:column;justify-content:space-around;height:100%;gap:3px;}',
    '.wr-root .wr-chart .hb > div{display:grid;grid-template-columns:72px 1fr 50px;align-items:center;gap:8px;font-size:12px;}',
    '.wr-root .wr-chart .hb s{position:relative;display:block;height:8px;background:rgba(142,166,179,.16);overflow:hidden;text-decoration:none;}',
    '.wr-root .wr-chart .hb s i{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,rgba(9,182,251,.5),var(--c));transition:width .9s ' + EASE + ';}',
    '.wr-root .wr-chart .hb b{text-align:right;color:#fff;font-weight:500;font-variant-numeric:tabular-nums;}',
    '.wr-root .wr-chart .arc{transition:stroke-dasharray .9s ' + EASE + ',stroke-dashoffset .9s ' + EASE + ';}',
    '.wr-root .wr-chart .gv{position:absolute;left:0;right:0;bottom:0;text-align:center;font-family:Tomorrow,Pretendard,sans-serif;font-size:22px;color:#00ffd2;}',
    '.wr-root .wr-chart .gv small{font:400 12px Pretendard,sans-serif;color:#8ea6b3;margin-left:2px;}',
    '.wr-root .wr-chart .dn{display:flex;align-items:center;gap:16px;height:100%;}',
    '.wr-root .wr-chart .dn .ring{position:relative;height:100%;aspect-ratio:1;flex:none;}',
    '.wr-root .wr-chart .dn .ring b{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Tomorrow,Pretendard,sans-serif;font-weight:400;font-size:17px;color:#fff;}',
    '.wr-root .wr-chart .dn .ring b small{font:400 10px Pretendard,sans-serif;color:#8ea6b3;}',
    '.wr-root .wr-chart .dn ul{list-style:none;display:flex;flex-direction:column;gap:4px;font-size:12px;min-width:0;flex:1;}',
    '.wr-root .wr-chart .dn li{display:flex;align-items:center;gap:6px;white-space:nowrap;}',
    '.wr-root .wr-chart .dn li:before{content:"";width:9px;height:3px;background:var(--c);flex:none;}',
    '.wr-root .wr-chart .dn li b{margin-left:auto;color:#fff;font-weight:500;font-variant-numeric:tabular-nums;}',
    '@media (prefers-reduced-motion:reduce){.wr-root *{animation:none!important;}}',

    /* ══ 라이트 테마 ══ 형상은 그대로, 판 · 글자 · 빛만 밝은 판에 맞게(mk-light-woori.js 와 짝) */
    '.wr-root[data-theme="light"]{--wr-acc:0,112,178;--wr-acc2:0,98,168;--wr-hi:#0a2740;}',
    '.wr-root[data-theme="light"] [data-name^="Nav Item/"]:not([data-name$="(Active)"]):hover{background-color:#d3e9f8!important;box-shadow:0 0 0 1px rgba(0,112,178,.6),inset 0 0 0 1px rgba(0,112,178,.6),0 3px 10px rgba(0,80,140,.2)!important;}',
    '.wr-root[data-theme="light"] [data-name^="Nav Item/"]:not([data-name$="(Active)"]):hover p{color:#06365c!important;}',
    '.wr-root[data-theme="light"] [data-name$="(Active)"]:hover > [data-name="Content"]{box-shadow:0 0 0 1px rgba(0,112,178,.7),inset 0 0 0 1px rgba(0,112,178,.7),0 3px 10px rgba(0,80,140,.3)!important;}',
    '.wr-root[data-theme="light"] [data-name^="Widget/"]:hover > [data-name="Card BG"]{box-shadow:0 0 0 1px rgba(0,112,178,.45),inset 0 0 0 1px rgba(0,112,178,.45),0 6px 18px rgba(20,70,120,.18)!important;}',
    '.wr-root[data-theme="light"] [data-name^="Node/"]:hover [data-name="Visual"]{filter:brightness(1.02) drop-shadow(0 6px 12px rgba(0,80,140,.3));}',
    '.wr-root[data-theme="light"] [data-name^="Option/"]:hover,.wr-root[data-theme="light"] [data-name^="Button/"]:hover,.wr-root[data-theme="light"] [data-name^="Count/"]:hover{filter:brightness(1.03) drop-shadow(0 2px 5px rgba(20,70,120,.3));}',
    '.wr-root[data-theme="light"] .wr-menu,.wr-root[data-theme="light"] .wr-fold{background:#fff;border-color:#9dbdd2;box-shadow:0 6px 16px rgba(20,60,100,.18);}',
    '.wr-root[data-theme="light"] .wr-menu div{color:#20405a;}',
    '.wr-root[data-theme="light"] .wr-menu div:hover{background:rgba(0,112,178,.12);color:#06365c;}',
    '.wr-root[data-theme="light"] .wr-input{color:#10324d;}',
    '.wr-root[data-theme="light"] .wr-chartbtn{background:#fff;color:#06365c;}',
    '.wr-root[data-theme="light"] .wr-chartmenu{background:#fff;color:#20405a;border-color:#9dbdd2;box-shadow:0 12px 28px rgba(30,60,100,.25);}',
    '.wr-root[data-theme="light"] .wr-chartmenu button:hover{background:rgba(0,112,178,.1);color:#06365c;}',
    '.wr-root[data-theme="light"] .wr-chartmenu button.cur{background:rgba(0,112,178,.16);color:#06365c;}',
    '.wr-root[data-theme="light"] .wr-chart{background:#fff;box-shadow:inset 0 0 0 1px #c5d9e6;color:#20405a;}',
    '.wr-root[data-theme="light"] .wr-chart .ct{color:#0e2c47;}',
    '.wr-root[data-theme="light"] .wr-chart .ct b,.wr-root[data-theme="light"] .wr-chart .gv{color:#00786a;}',
    '.wr-root[data-theme="light"] .wr-chart .lg,.wr-root[data-theme="light"] .wr-chart .bars u,.wr-root[data-theme="light"] .wr-chart .ct b small,.wr-root[data-theme="light"] .wr-chart .gv small,.wr-root[data-theme="light"] .wr-chart .dn .ring b small{color:#55707f;}',
    '.wr-root[data-theme="light"] .wr-chart .ax{fill:#55707f;}',
    '.wr-root[data-theme="light"] .wr-chart .gl{stroke:rgba(40,80,110,.14);}',
    '.wr-root[data-theme="light"] .wr-chart .bars em,.wr-root[data-theme="light"] .wr-chart .hb b,.wr-root[data-theme="light"] .wr-chart .dn li b,.wr-root[data-theme="light"] .wr-chart .dn .ring b{color:#0e2c47;}',
    '.wr-root[data-theme="light"] .wr-chart .hb s{background:rgba(40,80,110,.1);}',
  ].join('\n');
  window.WOORI_LIVE_CSS = CSS;

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
  function kids(el, sel) { return Array.prototype.filter.call(el.children, function (c) { return !sel || c.matches(sel); }); }
  function kid(el, name) { return kids(el, '[data-name="' + name + '"]')[0]; }
  function nameOf(el) { return (el && el.getAttribute && el.getAttribute('data-name')) || ''; }
  function editing() { return !!document.querySelector('.dtstage.dt-content-editing, .dtstage.dt-editing, .wr-root.wr-edit-layout'); }
  function layoutEditing(root) { return !!(root.closest('.dt-editing') || root.classList.contains('wr-edit-layout')); }
  function idle() { return typeof window.__wembIdle === 'function' ? window.__wembIdle() : document.hidden; }
  function load(k) { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function comma(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function numOf(p) { var m = /-?\d+(\.\d+)?/.exec(p ? p.textContent.replace(/,/g, '') : ''); return m ? +m[0] : NaN; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function clickable(el, title, fn) {
    if (!el) return;
    el.classList.add('wr-click');
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    if (title) el.setAttribute('title', title);
    if (fn) {
      el.addEventListener('click', function (e) { if (editing()) return; fn(e); });
      el.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && !editing()) { e.preventDefault(); fn(e); } });
    }
  }
  /* 라이브가 쓴 값과 지금 글자가 다르면 사람이 고친 것 — 덮지 않는다 */
  function claimed(p) { return p.__wrLast != null && p.textContent !== p.__wrLast; }
  function write(p, s, flash) {
    if (!p || claimed(p)) return;
    if (p.textContent === s) { p.__wrLast = s; return; }
    p.textContent = s;
    p.__wrLast = s;
    p.classList.add('wr-num');
    if (flash) { p.classList.remove('wr-tick'); void p.offsetWidth; p.classList.add('wr-tick'); }
  }
  function tween(p, from, to, fmt, dur) {
    if (!p || claimed(p)) return;
    var t0 = performance.now(); dur = dur || 900;
    if (p.__wrTw) cancelAnimationFrame(p.__wrTw);
    (function step(t) {
      if (claimed(p)) return;
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      write(p, fmt(from + (to - from) * e), false);
      if (k < 1) p.__wrTw = requestAnimationFrame(step);
      else write(p, fmt(to), false);
    })(t0);
  }

  function sceneOf(root) {
    if (root.classList.contains('wrp-root')) return 'performance';
    if (root.classList.contains('wre-root')) return 'event';
    return 'transaction';
  }
  function frameOf(root) { return root.querySelector(':scope > [data-name^="Screen/"]'); }
  /* 다른 장면으로 — 스튜디오에서는 같은 프로젝트의 형제 화면으로(js/templates/woori.js), 낱장 미리보기에서는 그 페이지로 */
  function goScene(to) {
    if (typeof window.__gotoWooriScene === 'function') { window.__gotoWooriScene(to); return; }
    location.href = './' + to + '.html' + location.search;
  }

  /* ══════════════════ 1. 반응형 · 자리 ══════════════════
     항목(item) = 옮길 수 있는 패널. 묶음(group)마다 '자리' 목록이 있고 항목은 차례대로 자리에 앉는다.
     자리를 바꾸면 나머지가 흘러 빈틈 없이 다시 앉는다(패널 옮기기). */
  function setT(el, x, y) {
    el.style.setProperty('--wr-tx', x.toFixed(2) + 'px');
    el.style.setProperty('--wr-ty', y.toFixed(2) + 'px');
  }
  function rectIn(st, el) {
    var f = st.frame.getBoundingClientRect(), r = el.getBoundingClientRect(), s = (f.width / BASE_W) || 1;
    return { x: (r.left - f.left) / s, y: (r.top - f.top) / s, w: r.width / s, h: r.height / s };
  }
  function lift(el) { el.classList.add('wr-wl'); return el; }
  /* 오토레이아웃 줄의 자식을 화면 좌표로 꺼낸다 */
  function hoist(st, parent, children, keepSize) {
    var rs = children.map(function (c) { return rectIn(st, c); });
    parent.classList.add('wr-flat');
    children.forEach(function (c, i) {
      c.classList.add('wr-abs');
      c.style.left = rs[i].x + 'px';
      c.style.top = rs[i].y + 'px';
      if (keepSize) { c.style.width = rs[i].w + 'px'; c.style.height = rs[i].h + 'px'; }
    });
    return rs;
  }
  function item(el, r, resize, extra) {
    var it = { el: el, name: nameOf(el), x0: r.x, y0: r.y, w0: r.w, h0: r.h, resize: resize || function () { } };
    if (extra) Object.keys(extra).forEach(function (k) { it[k] = extra[k]; });
    el.__wr = it;
    el.classList.add('wr-mv');
    /* 층(.wr-wl) · 꺼낸 자식(.wr-abs)이 아니면 블록으로 — translate 규칙이 걸려야 자리를 찾아 간다 */
    if (!el.classList.contains('wr-wl') && !el.classList.contains('wr-abs')) el.classList.add('wr-blk');
    return it;
  }
  function anim() { for (var i = 0; i < arguments.length; i++) if (arguments[i]) arguments[i].classList.add('wr-anim'); }
  function applyGroup(st, g) {
    var slots = g.slots(g.order);
    g.order.forEach(function (name, i) {
      var it = g.byName[name], s = slots[i];
      if (!it || !s) return;
      it.tx = s.x - it.x0; it.ty = s.y - it.y0; it.idx = i;
      setT(it.el, it.tx, it.ty);
      it.dw = s.w - it.w0; it.dh = s.h - it.h0;
      it.resize(it.dw, it.dh, i, s, it);
      if (it.onPlaced) it.onPlaced();
    });
  }
  function addGroup(st, key, items, slots) {
    var g = { key: key, items: items, byName: {}, order: items.map(function (i) { return i.name; }), order0: items.map(function (i) { return i.name; }), slots: slots };
    items.forEach(function (i) { g.byName[i.name] = i; i.group = g; });
    var saved = ((load(K_LAYOUT)[st.sc] || {}).order || {})[key];
    if (Array.isArray(saved) && saved.length === g.order.length && saved.every(function (n) { return g.byName[n]; })) g.order = saved.slice();
    st.groups[key] = g;
    return g;
  }
  function addFree(st, el, name, fn) {
    el.__wrFree = { name: name };
    el.classList.add('wr-fmv');
    var o = ((load(K_LAYOUT)[st.sc] || {}).free || {})[name];
    if (o) { el.style.setProperty('--wr-dx', o[0] + 'px'); el.style.setProperty('--wr-dy', o[1] + 'px'); el.__wrMove = o; }
    st.blocks.push({ el: el, fn: fn });
  }

  /* 꺾은선 위젯 — 판 · 읽음 칸 · 차트 폭과 격자 높이 */
  function lineWidgetResizer(w, base) {
    var card = kid(w, 'Card BG'), chart = kid(w, 'Line Chart'), head = kid(w, 'Header'), readout = kid(w, 'Readout');
    var grids = all(w, '[data-name="Grid Line"]');
    anim.apply(null, [card, chart, head, readout].concat(grids));
    return function (dw, dh) {
      card.style.width = (base.cardW + dw) + 'px';
      card.style.height = (base.cardH + dh) + 'px';
      if (chart) chart.style.width = (base.chartW + dw) + 'px';
      if (head) head.style.width = (base.headW + dw) + 'px';
      if (readout) readout.style.marginLeft = (238 + dw) + 'px';
      grids.forEach(function (g) { g.style.height = (46 + dh / 2) + 'px'; });
    };
  }

  /* ── 거래현황 ── */
  function buildTransaction(st) {
    var f = st.frame;
    /* KPI 두 장 */
    var kpiRow = kid(f, 'KPI Row'), kpis = kids(kpiRow);
    var rk = hoist(st, kpiRow, kpis);
    addGroup(st, 'kpi', kpis.map(function (w, i) { return item(w, rk[i]); }), function (order) {
      return order.map(function (_, i) { return { x: rk[i].x + st.exW / 2, y: rk[i].y, w: rk[i].w, h: rk[i].h }; });
    });
    /* 막대 위젯 두 장 — Figma GROUP. 이름표(Title Tab)는 자리를 따라 왼쪽/오른쪽 바깥에 붙는다 */
    var bars = [kid(f, 'Widget/Core Banking Transactions'), kid(f, 'Widget/Bank Banking Transactions')];
    var legend = kid(f, 'Legend');
    var barItems = bars.map(function (w) {
      lift(w);
      var card = kid(w, 'Card BG'), tab = kid(w, 'Title Tab'), chart = kid(w, 'Bar Chart');
      var plot = one(chart, '[data-name="Plot"]'), yax = one(chart, '[data-name="Y Axis"]'), xax = one(chart, '[data-name="X Axis"]');
      var tabKids = kids(tab);
      var cr = rectIn(st, card), tabX0 = rectIn(st, tabKids[0]).x;
      anim.apply(null, [card, chart, plot, yax, xax].concat(tabKids));
      return item(w, { x: cr.x, y: 629, w: cr.w, h: 231 }, function (dw, dh, i, s, it) {
        card.style.width = (920 + dw) + 'px';
        card.style.height = (218 + dh) + 'px';
        chart.style.width = (892 + dw) + 'px';
        plot.style.width = (843 + dw) + 'px';
        plot.style.height = (125 + dh) + 'px';
        yax.style.gap = (15 + dh / 4) + 'px';
        xax.style.width = (844 + dw) + 'px';
        /* 이름표 — 왼쪽 자리는 왼쪽 끝(30), 오른쪽 자리는 오른쪽 끝(1673 + 폭) */
        var target = i === 0 ? 30 : 1673 + st.exW;
        var dx = target - tabX0 - it.tx;
        tabKids.forEach(function (k) { k.style.translate = dx.toFixed(2) + 'px 0'; });
      }, { card: card });
    });
    addGroup(st, 'bars', barItems, function (order) {
      return order.map(function (_, i) {
        return { x: i === 0 ? 30 : 970 + st.exW / 2, y: 629 + st.exH * 0.3, w: 920 + st.exW / 2, h: 231 + st.exH * 0.35 };
      });
    });
    /* 꺾은선 위젯 네 장 */
    var row = kid(f, 'Widget Row'), lines = kids(row);
    var rl = hoist(st, row, lines);
    addGroup(st, 'lines', lines.map(function (w, i) {
      return item(w, rl[i], lineWidgetResizer(w, { cardW: 450, cardH: 180, chartW: 430 }), { card: kid(w, 'Card BG') });
    }), function (order) {
      var w = 450 + st.exW / 4, h = 180 + st.exH * 0.35;
      return order.map(function (_, i) { return { x: 29 + i * (w + 20), y: 880 + st.exH * 0.65, w: w, h: h }; });
    });
    /* 구성도 · 네트워크 거르기 · 범례 */
    var topo = lift(kid(f, 'Topology')), filter = lift(kid(f, 'Network Filter'));
    addFree(st, topo, 'Topology', function () { setT(topo, st.exW / 2, st.exH * 0.15); });
    addFree(st, filter, 'Network Filter', function () { setT(filter, st.exW / 2, st.exH * 0.3); });
    if (legend) { legend.classList.add('wr-blk'); st.blocks.push({ el: legend, fn: function () { setT(legend, st.exW / 2, st.exH * 0.3); } }); }
    all(f, ':scope > [data-name^="Empty Shape"]').forEach(function (e) { e.style.pointerEvents = 'none'; });
  }

  /* ── 성능현황 ── */
  function buildPerformance(st) {
    var f = st.frame;
    var chartRow = kid(f, 'Chart Row'), cols = kids(chartRow);
    var widgets = [];
    cols.forEach(function (c) { widgets = widgets.concat(kids(c, '[data-name^="Widget/"]')); });
    var rs = widgets.map(function (w) { return rectIn(st, w); });
    chartRow.classList.add('wr-flat');
    cols.forEach(function (c) { c.classList.add('wr-flat'); });
    widgets.forEach(function (w, i) { w.classList.add('wr-abs'); w.style.left = rs[i].x + 'px'; w.style.top = rs[i].y + 'px'; });
    addGroup(st, 'charts', widgets.map(function (w, i) {
      return item(w, rs[i], lineWidgetResizer(w, { cardW: 606, cardH: 163, chartW: 579, headW: 586 }), { card: kid(w, 'Card BG') });
    }), function (order) {
      var w = 606 + st.exW / 3, h = 163 + st.exH * 0.2;
      return order.map(function (_, i) {
        var col = Math.floor(i / 2), r = i % 2;
        return { x: 31 + col * (w + 20), y: 84 + r * h, w: w, h: h };
      });
    });
    var tableRow = kid(f, 'Table Row'), tables = kids(tableRow);
    var rt = hoist(st, tableRow, tables, true);
    addGroup(st, 'tables', tables.map(function (t, i) {
      anim(t);
      return item(t, rt[i], function (dw, dh) { t.style.width = (606 + dw) + 'px'; t.style.height = (240 + dh) + 'px'; });
    }), function (order) {
      var w = 606 + st.exW / 3, h = 240 + st.exH * 0.3;
      return order.map(function (_, i) { return { x: 31 + i * (w + 20), y: 820 + st.exH * 0.7, w: w, h: h }; });
    });
    var topo = lift(kid(f, 'Topology'));
    addFree(st, topo, 'Topology', function () { setT(topo, st.exW / 2, st.exH * 0.55); });
    all(f, ':scope > [data-name^="Empty Shape"]').forEach(function (e) { e.style.pointerEvents = 'none'; });
  }

  /* ── 이벤트현황 ── */
  function buildEvent(st) {
    var f = st.frame;
    /* 구성도 — 바탕은 폭을 채우고 장비들은 가운데에 */
    var topo = lift(kid(f, 'Topology')), tbg = kid(topo, 'Background'), dia = lift(kid(topo, 'Diagram'));
    var rb = rectIn(st, tbg);
    tbg.style.inset = 'auto'; tbg.style.left = rb.x + 'px'; tbg.style.top = rb.y + 'px'; tbg.style.width = rb.w + 'px'; tbg.style.height = rb.h + 'px';
    anim(tbg);
    st.blocks.push({ el: topo, fn: function () { tbg.style.width = (rb.w + st.exW) + 'px'; setT(dia, st.exW / 2, 0); } });
    /* 현재시간 현황 · 시간별 발생 */
    var ov = lift(kid(f, 'Widget/Event Overview'));
    var card = kid(ov, 'Card BG'), cur = kid(ov, 'Current Status'), chart = kid(ov, 'Line Chart');
    var divWrap = one(ov, '[data-node-id="25:4128"]'), divLine = divWrap && one(divWrap, '[data-name="Divider"]');
    var grids = all(chart, '[data-name="Grid Line"]'), gh0 = grids.map(function (g) { return g.offsetHeight; });
    var linesHost = all(chart, 'div[data-name^="Line/"]').map(function (l) { return { el: l, l: l.offsetLeft, t: l.offsetTop, w: l.offsetWidth, h: l.offsetHeight }; });
    linesHost.forEach(function (l) { l.el.style.inset = 'auto'; l.el.style.left = l.l + 'px'; l.el.style.top = l.t + 'px'; l.el.style.width = l.w + 'px'; l.el.style.height = l.h + 'px'; anim(l.el); });
    var plotW = 1377, plotH = gh0.reduce(function (a, b) { return a + b; }, 0) - 2;
    anim.apply(null, [card, cur, divWrap, divLine].concat(grids));
    var itOv = item(ov, { x: 30, y: 284, w: 1860, h: 190 }, function (dw, dh) {
      card.style.width = (1860 + dw) + 'px';
      card.style.height = (190 + dh) + 'px';
      cur.style.translate = '0 ' + (dh / 2).toFixed(2) + 'px';
      if (divWrap) divWrap.style.height = (176 + dh) + 'px';
      if (divLine) divLine.style.width = (176 + dh) + 'px';
      grids.forEach(function (g, i) { g.style.width = (plotW + dw) + 'px'; g.style.height = (gh0[i] + dh / 4) + 'px'; });
      var kx = (plotW + dw) / plotW, ky = (plotH + dh) / plotH;
      linesHost.forEach(function (l) {
        l.el.style.left = (l.l * kx) + 'px'; l.el.style.top = (l.t * ky) + 'px';
        l.el.style.width = (l.w * kx) + 'px'; l.el.style.height = (l.h * ky) + 'px';
      });
    }, { card: card });
    /* 이벤트 목록 */
    var list = kid(f, 'Widget/Event List'), body = kid(list, 'Body');
    var sb = kid(body, 'Search Bar'), sbC = kid(sb, 'Content'), msgField = one(sb, '[data-name="Field/Message"]');
    var tb = kid(body, 'Toolbar'), tbl = kid(body, 'Table/Event List'), head = kid(tbl, 'Header Row'), tbody = kid(tbl, 'Body');
    var rows = kids(tbody, '[data-name^="Row/"]'), rh0 = rows.map(function (r) { return r.offsetHeight; });
    var thMsg = one(tbl, '[data-name="Th/Message"]');
    st.foldEl = list; st.foldBody = body;
    anim.apply(null, [list, sbC, msgField, tb, tbl, head, tbody, thMsg].concat(rows));
    list.style.height = 'auto';
    var itList = item(list, { x: 30, y: 504, w: 1860, h: 557 }, function (dw, dh, i, s) {
      list.style.width = (1860 + dw) + 'px';
      sbC.style.width = (1819 + dw) + 'px';
      if (msgField) msgField.style.width = (435 + dw) + 'px';
      tb.style.width = (1860 + dw) + 'px';
      tbl.style.width = (1860 + dw) + 'px';
      head.style.width = (1860 + dw) + 'px';
      tbody.style.width = (1860 + dw) + 'px';
      if (thMsg) thMsg.style.width = (580 + dw) + 'px';
      if (st.folded) { body.style.height = '0px'; return; }
      var extra = Math.max(0, s.h - 557);
      body.style.height = (528 + extra) + 'px';
      rows.forEach(function (r, k) { r.style.height = (rh0[k] + extra / rows.length) + 'px'; });
    });
    st.folded = !!load(K_FOLD)[st.sc];
    list.classList.toggle('wr-isfolded', st.folded);
    addGroup(st, 'stack', [itOv, itList], function (order) {
      /* 위아래 차례대로 쌓는다. 남는 높이는 목록이 더 많이 갖는다. 접으면 목록은 제목 줄만 남고 현황 판이 그 자리를 채운다 */
      var GAP = 30, TOP = 284, H = 777 + st.exH, W = 1860 + st.exW;
      var hL = st.folded ? 19 : 557 + st.exH * 0.7;
      var hO = H - GAP - hL;
      var y = TOP;
      return order.map(function (n) {
        var h = n === itOv.name ? hO : hL, s = { x: 30, y: y, w: W, h: h };
        y += h + GAP;
        return s;
      });
    });
  }

  function installFit(root, st) {
    var frame = frameOf(root);
    if (!frame) return;
    frame.style.position = 'absolute';
    frame.style.left = '0';
    frame.style.top = '0';
    frame.style.width = BASE_W + 'px';
    frame.style.height = BASE_H + 'px';
    frame.style.transformOrigin = '0 0';
    st.frame = frame;
    st.groups = {}; st.blocks = []; st.exW = 0; st.exH = 0; st.S = 1;
    var bg = kid(frame, 'Background');
    if (bg) { var im = bg.querySelector('img'); if (im) im.classList.add('wr-bgimg'); }
    var header = kid(frame, 'Header');
    var deco = header && kid(header, 'Background');
    var bar = header && kid(header, 'Header Bar');
    if (deco) { lift(deco); deco.style.transformOrigin = '0 0'; }
    var barW = bar ? bar.offsetWidth : BASE_W;
    if (st.sc === 'transaction') buildTransaction(st);
    else if (st.sc === 'performance') buildPerformance(st);
    else buildEvent(st);

    function layout() {
      var W = root.clientWidth, H = root.clientHeight;
      if (!W || !H) return;
      var S = Math.min(W / BASE_W, H / BASE_H);
      var VW = W / S, VH = H / S, exW = Math.max(0, VW - BASE_W), exH = Math.max(0, VH - BASE_H);
      if (exW < 0.01) exW = 0;
      if (exH < 0.01) exH = 0;
      st.S = S; st.exW = exW; st.exH = exH; st.VW = VW; st.VH = VH;
      frame.style.transform = 'scale(' + S + ')';
      /* 정확히 1:1 일 때만 별도 층 — 배율이 바뀌면 층이 옛 해상도에 묶여 글자가 흐려진다 */
      frame.style.willChange = Math.abs(S - 1) < 1e-4 ? 'transform' : 'auto';
      if (bg) {
        var s = bg.style;
        s.left = '0px'; s.top = '0px'; s.inset = 'auto'; s.left = '0px'; s.top = '0px'; s.margin = '0'; s.width = VW + 'px'; s.height = VH + 'px'; s.transform = 'none';
      }
      if (deco) deco.style.scale = (VW / BASE_W).toFixed(5) + ' 1';
      if (bar) bar.style.width = (barW + exW) + 'px';
      Object.keys(st.groups).forEach(function (k) { applyGroup(st, st.groups[k]); });
      st.blocks.forEach(function (b) { b.fn(); });
      if (st.onLayout) st.onLayout();
    }
    var rsT = 0;
    function relayout() {
      root.classList.add('wr-resizing');
      layout();
      clearTimeout(rsT);
      rsT = setTimeout(function () { root.classList.remove('wr-resizing'); }, 140);
    }
    layout();
    st.relayout = relayout;
    st.layout = layout;
    if (window.ResizeObserver) { st.ro = new ResizeObserver(relayout); st.ro.observe(root); }
    else { st.onResize = relayout; window.addEventListener('resize', relayout); }
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('wr-live'); }); });
  }

  /* ══════════════════ 2. 시계 · 최근 시각 ══════════════════ */
  var WD_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function installClock(root, st) {
    var ts = one(root, '[data-name="Timestamp"]');
    if (!ts) return;
    var ps = all(ts, 'p');
    function tick() {
      var d = new Date();
      write(ps[0], d.getFullYear() + '.' + p2(d.getMonth() + 1) + '.' + p2(d.getDate()) + ' ' + WD_EN[d.getDay()]);   /* 원본 서식 '2023.05.30 Tue' */
      write(ps[1], p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds()));
    }
    tick();
    st.timers.push(setInterval(function () { if (!editing()) tick(); }, 1000));
  }
  /* 시간축 — 끝 눈금을 지금(10분 단위로 내림)으로. 칸 간격은 원본(10분) 그대로 */
  function installRecent(root, st) {
    var now = new Date(), end = Math.floor(now.getTime() / 600000) * 600000;
    all(root, '[data-name="X Axis"]').forEach(function (ax) {
      var ps = all(ax, 'p');
      if (!ps.length || !/:/.test(ps[0].textContent)) return;
      ps.forEach(function (p, i) {
        var d = new Date(end - (ps.length - 1 - i) * 600000);
        write(p, p2(d.getHours()) + ':' + p2(d.getMinutes()));
      });
    });
  }

  /* ══════════════════ 3. 눌리는 자리 ══════════════════ */
  var NAV_TO = { 'Transaction Status': 'transaction', 'Performance Status': 'performance', 'Event Status': 'event' };
  function installNav(root, st) {
    all(root, '[data-name^="Nav Item/"]').forEach(function (m) {
      var key = nameOf(m).replace('Nav Item/', '').replace(' (Active)', '');
      var to = NAV_TO[key];
      if (!to) return;
      clickable(m, m.textContent.trim(), function () { if (to !== st.sc) goScene(to); });
    });
    if (st.sc !== 'transaction') clickable(one(root, '[data-name="Brand"]'), '거래현황으로', function () { goScene('transaction'); });
    clickable(one(root, '[data-name="Icon/Action/User"]'), '사용자');
    clickable(one(root, '[data-name="Icon/Action/Logout"]'), '로그아웃');
    /* 네트워크 칩 — 하나만 켜진다. 다시 누르면 꺼진다 */
    var opts = all(root, '[data-name^="Option/"]');
    opts.forEach(function (o) {
      clickable(o, o.textContent.trim(), function () {
        var on = !o.classList.contains('wr-on');
        opts.forEach(function (x) { x.classList.remove('wr-on'); });
        o.classList.toggle('wr-on', on);
      });
    });
    /* 범례 — 눌러서 그 시리즈를 끄고 켠다 */
    all(root, '[data-name^="Item/"]').forEach(function (it) {
      var key = nameOf(it).replace('Item/', '');
      var scope = it.closest('[data-name^="Widget/"]') || root;
      var targets = [];
      if (/^(Today|Peak Day) \(/.test(key)) targets = all(root, 'svg [data-name="Data/' + key + '"]');
      else targets = all(scope, 'svg g[data-name="Line/' + key + '"]');
      if (!targets.length) return;
      clickable(it, it.textContent.trim() + ' 끄기/켜기', function () {
        var off = !it.classList.contains('wr-off');
        it.classList.toggle('wr-off', off);
        targets.forEach(function (t) { t.classList.toggle('wr-off', off); });
      });
    });
    /* 위젯 제목 눌러 성능현황으로 — 거래현황 KPI */
    if (st.sc === 'transaction') all(root, '[data-name$=" Summary"] > [data-name="Title"]').forEach(function (t) { clickable(t, '성능현황 보기', function () { goScene('performance'); }); });
  }

  /* ══════════════════ 4. 라이브 — 차트 ══════════════════
     Figma 가 내보낸 선 · 막대를 그대로 인라인으로 심어 두었다(conv.js). t = 0 이면 원본과 한 점도 다르지 않다. */
  function parseD(d) {
    var re = /([MLHVCZ])([^MLHVCZ]*)/gi, segs = [], x = 0, y = 0, m;
    while ((m = re.exec(d))) {
      var c = m[1].toUpperCase(), n = (m[2].match(/-?\d*\.?\d+(?:e-?\d+)?/gi) || []).map(Number), i;
      if (c === 'Z') { segs.push({ c: 'Z' }); continue; }
      if (c === 'M' || c === 'L') { for (i = 0; i + 1 < n.length; i += 2) { x = n[i]; y = n[i + 1]; segs.push({ c: i === 0 ? c : 'L', x: x, y: y }); } }
      else if (c === 'H') { n.forEach(function (v) { x = v; segs.push({ c: 'L', x: x, y: y }); }); }
      else if (c === 'V') { n.forEach(function (v) { y = v; segs.push({ c: 'L', x: x, y: y }); }); }
      else if (c === 'C') { for (i = 0; i + 5 < n.length; i += 6) { x = n[i + 4]; y = n[i + 5]; segs.push({ c: 'C', x1: n[i], y1: n[i + 1], x2: n[i + 2], y2: n[i + 3], x: x, y: y }); } }
    }
    return segs;
  }
  function buildD(segs, off) {
    var s = '';
    for (var i = 0; i < segs.length; i++) {
      var g = segs[i];
      if (g.c === 'Z') { s += 'Z'; continue; }
      if (g.c === 'C') s += 'C' + g.x1.toFixed(2) + ' ' + off(g.x1, g.y1).toFixed(2) + ' ' + g.x2.toFixed(2) + ' ' + off(g.x2, g.y2).toFixed(2) + ' ' + g.x.toFixed(2) + ' ' + off(g.x, g.y).toFixed(2);
      else s += g.c + g.x.toFixed(2) + ' ' + off(g.x, g.y).toFixed(2);
    }
    return s;
  }
  /* 막대 하나하나 — 부분 경로마다 상자로 읽는다 */
  function parseBars(d) {
    return d.split(/Z/i).map(function (sub) {
      if (!sub.trim()) return null;
      var segs = parseD(sub);
      var xs = segs.map(function (g) { return g.x; }), ys = segs.map(function (g) { return g.y; });
      return { x0: Math.min.apply(null, xs), x1: Math.max.apply(null, xs), t: Math.min.apply(null, ys), b: Math.max.apply(null, ys) };
    }).filter(Boolean);
  }
  function installCharts(root, st) {
    var lines = [], bars = [], li = 0;
    /* 꺾은선 — 거래현황(Line 1~8) · 성능현황(Today/Baseline) · 이벤트현황(시스템별) */
    all(root, 'svg path[data-name^="Line "], svg path[data-name="Line"]').forEach(function (p) {
      var g = p.parentNode, gn = nameOf(g);
      /* 연결선 그림의 선도 이름이 Line 이다 — 차트 시리즈(Line/… 묶음 · Line n)만 움직인다 */
      if (nameOf(p) === 'Line' && gn.indexOf('Line/') !== 0) return;
      if (gn === 'Line/Baseline') return;   /* 기준선은 움직이지 않는다 */
      var svg = p.ownerSVGElement, vb = svg.viewBox.baseVal;
      var segs = parseD(p.getAttribute('d'));
      var area = nameOf(p) === 'Line' ? one(g, '[data-name="Area"]') : null;
      var keys = {};
      segs.forEach(function (s) { if (s.c !== 'Z') keys[s.x.toFixed(2) + ',' + s.y.toFixed(2)] = 1; });
      var A = st.sc === 'event' ? 1.8 + (li % 5) * 0.5 : st.sc === 'performance' ? 3.2 : 1.6 + (li % 4) * 0.45;
      lines.push({
        p: p, segs: segs, area: area, aSegs: area ? parseD(area.getAttribute('d')) : null, keys: keys, H: vb.height,
        A: A, k: 0.016 + (li % 7) * 0.003, w: 0.00085 + (li % 5) * 0.00018, ph: li * 1.7,
      });
      li++;
    });
    /* 막대 — 금일만 움직인다(피크일 선은 지난 기록) */
    all(root, 'svg [data-name^="Data/Today"]').forEach(function (g, gi) {
      all(g, 'path').forEach(function (p, pi) {
        var rects = parseBars(p.getAttribute('d'));
        rects.forEach(function (r, ri) {
          r.ph = (gi * 2.1 + pi * 0.73 + ri * 1.31);
          r.w = 0.0007 + ((pi + ri) % 5) * 0.00016;
          r.a = Math.min(9, (r.b - r.t) * 0.16);
        });
        bars.push({ p: p, rects: rects });
      });
    });
    if (!lines.length && !bars.length) return;
    var t0 = performance.now(), last = 0;
    function frame(t) {
      st.raf.chart = requestAnimationFrame(frame);
      if (idle() || editing()) { t0 += t - (st.lastT || t); st.lastT = t; return; }
      st.lastT = t;
      if (t - last < 42) return;      /* 24fps 면 충분하다 */
      last = t;
      var tt = t - t0;
      lines.forEach(function (L) {
        var dy = function (x, y) {
          var v = y + L.A * (Math.sin(L.k * x - L.w * tt + L.ph) - Math.sin(L.k * x + L.ph));
          return clamp(v, 0, L.H);
        };
        L.p.setAttribute('d', buildD(L.segs, dy));
        if (L.area) L.area.setAttribute('d', buildD(L.aSegs, function (x, y) { return L.keys[x.toFixed(2) + ',' + y.toFixed(2)] ? dy(x, y) : y; }));
      });
      bars.forEach(function (B) {
        var s = '';
        B.rects.forEach(function (r) {
          var y = Math.min(r.b - 1, r.t + r.a * (Math.sin(r.ph - r.w * tt) - Math.sin(r.ph)));
          s += 'M' + r.x0.toFixed(2) + ' ' + y.toFixed(2) + 'H' + r.x1.toFixed(2) + 'V' + r.b.toFixed(2) + 'H' + r.x0.toFixed(2) + 'Z';
        });
        B.p.setAttribute('d', s);
      });
    }
    st.raf.chart = requestAnimationFrame(frame);
  }

  /* ══════════════════ 5. 라이브 — 숫자 ══════════════════ */
  function installNumbers(root, st) {
    var sc = st.sc;
    if (sc === 'transaction') {
      var kpis = all(root, '[data-name$=" Summary"]').map(function (w) {
        var get = function (n) { var m = one(w, '[data-name="Metric/' + n + '"]'); return m ? kids(m, 'p')[1] : null; };
        var tr = get('Transactions'), rs = get('Response Time'), tp = get('TPS');
        return { tr: tr, rs: rs, tp: tp, trV: numOf(tr), rs0: numOf(rs), tp0: numOf(tp), core: /Core/.test(nameOf(w)) };
      });
      /* 열 때 0 에서 차오른다 */
      kpis.forEach(function (k) {
        tween(k.tr, k.trV * 0.985, k.trV, comma, 1200);
        tween(k.tp, 0, k.tp0, comma, 1100);
      });
      /* 읽음 칸(응답 · 초당) — 같은 숫자를 나눠 보여 준다 */
      var ro = all(root, '[data-name="Readout"]').map(function (r) {
        var ps = all(r, 'p');
        ps.forEach(function (p) { p.classList.add('wr-keepw'); });
        return { ps: ps, v0: ps.map(function (p) { return p.textContent; }), w: r.closest('[data-name^="Widget/"]') };
      });
      var stats = all(root, '[data-name="Measurement"]').map(function (m) {
        var ps = kids(m, 'p');
        return { v: ps[0], r: ps[2], v0: numOf(ps[0]), r0: numOf(ps[2]) };
      });
      var counters = all(root, '[data-name="Counter"] p').map(function (p) { return { p: p, v0: numOf(p) }; });
      st.timers.push(setInterval(function () {
        if (idle() || editing()) return;
        kpis.forEach(function (k) {
          var tp = Math.round(k.tp0 * (1 + rnd(-0.035, 0.035)));
          k.trV += tp * 1.6;
          write(k.tr, comma(k.trV), false);
          write(k.tp, comma(tp), true);
          write(k.rs, (k.rs0 + rnd(-0.008, 0.008)).toFixed(3), true);
          k.tpNow = tp;
        });
        ro.forEach(function (o) {
          var isTps = /TPS/.test(nameOf(o.w)), core = /Core/.test(nameOf(o.w));
          var base = kpis.filter(function (k) { return k.core === core; })[0];
          if (isTps && base) {
            write(o.ps[0], comma(base.tpNow), true);
            write(o.ps[1], comma(numOf(o.ps[1]) + Math.round(rnd(-5, 6))), false);
          } else {
            o.ps.forEach(function (p, i) {
              var parts = o.v0[i].split(',').map(function (s) { return (parseFloat(s) + rnd(-0.006, 0.006)).toFixed(3); });
              write(p, parts.join(', '), false);
            });
          }
        });
        stats.forEach(function (s) {
          if (!s.v) return;
          var v = Math.max(0, Math.round(s.v0 * (1 + rnd(-0.05, 0.05))));
          write(s.v, comma(v), false);
        });
        counters.forEach(function (c) { if (Math.random() < 0.2) write(c.p, comma(c.v0 + Math.round(rnd(-2, 3))), true); });
      }, 1800));
    }
    if (sc === 'performance') {
      var cells = all(root, '[data-name^="Td/TPS Current"] p, [data-name^="Td/Response Time Current"] p').filter(function (p) { return !isNaN(numOf(p)); })
        .map(function (p) { return { p: p, v0: numOf(p), dec: /\./.test(p.textContent) ? 3 : 0 }; });
      var nodeStats = all(root, '[data-name="Stats"] [data-name="Measurement"] p').map(function (p) { return { p: p, v0: numOf(p), dec: /\./.test(p.textContent) ? 3 : 0 }; });
      st.timers.push(setInterval(function () {
        if (idle() || editing()) return;
        cells.forEach(function (c) { if (Math.random() < 0.45) write(c.p, c.dec ? (c.v0 * (1 + rnd(-0.03, 0.03))).toFixed(3) : comma(c.v0 * (1 + rnd(-0.04, 0.04))), true); });
        nodeStats.forEach(function (c) { write(c.p, c.dec ? (c.v0 * (1 + rnd(-0.02, 0.02))).toFixed(3) : comma(c.v0 * (1 + rnd(-0.03, 0.03))), true); });
      }, 2000));
    }
  }

  /* ══════════════════ 6. 이벤트 목록 ══════════════════ */
  var SEV = { CR: 'Critical', MA: 'Major', MI: 'Minor', WA: 'Warning', NO: 'Normal' };
  var COLS = ['Time', 'Company', 'Business System', 'Server', 'Event ID', 'Process Status', 'Collection', 'Message'];
  function installEvent(root, st) {
    if (st.sc !== 'event') return;
    var list = st.foldEl, body = st.foldBody;
    if (!list) return;
    var table = one(list, '[data-name="Table/Event List"]');
    var rows = all(table, '[data-name^="Row/"]');
    function cell(r, c) { var td = one(r, '[data-name="Td/' + c + '"]'); return td && one(td, 'p'); }
    function sevOf(r) { var m = /Marker \((\w+)\)/.exec(nameOf(one(r, '[data-name^="Marker ("]') || null)); return m ? m[1] : ''; }
    /* 표지 그림 본보기 — 등급마다 한 벌 */
    var markers = {};
    rows.forEach(function (r) { var mk = one(r, '[data-name^="Marker ("]'), s = sevOf(r); if (s && !markers[s]) markers[s] = mk.cloneNode(true); });
    function rowData(r) {
      var d = { sev: sevOf(r) };
      COLS.forEach(function (c) { var p = cell(r, c); d[c] = p ? p.textContent : ''; });
      return d;
    }
    function setRow(r, d) {
      COLS.forEach(function (c) { var p = cell(r, c); if (p && !claimed(p)) { p.textContent = d[c]; p.__wrLast = d[c]; } });
      var td = one(r, '[data-name="Td/Severity"]'), mk = td && one(td, '[data-name^="Marker ("]');
      if (mk && markers[d.sev] && sevOf(r) !== d.sev) { var n = markers[d.sev].cloneNode(true); n.removeAttribute('id'); mk.replaceWith(n); }
    }
    /* ── 등급 칩 ── */
    var counts = all(list, '[data-name^="Count/"]');
    var cur = 'All';
    function paintChips() {
      counts.forEach(function (c) {
        var k = nameOf(c).replace('Count/', '');
        c.classList.toggle('wr-on', st.chipTouched && k === cur);
        /* 원본은 CR 칩이 켜진 모습 — 다른 칩을 고르면 그 모습을 내려놓는다 */
        c.classList.toggle('wr-off', st.chipTouched && k !== cur && k === 'Critical');
      });
    }
    /* ── 거르기 — 지우면 0줄일 때 표가 텅 비어 흐리게만 한다 ── */
    var filters = { 'Business System': '', Server: '', 'Event ID': '', 'Process Status': '전체', Collection: '전체', Message: '' };
    function applyFilter() {
      rows.forEach(function (r) {
        var ok = cur === 'All' || sevOf(r) === cur;
        Object.keys(filters).forEach(function (k) {
          var v = filters[k];
          if (!v || v === '전체') return;
          var p = cell(r, k);
          if (!p || p.textContent.toLowerCase().indexOf(v.toLowerCase()) < 0) ok = false;
        });
        r.classList.toggle('wr-dim', !ok);
      });
    }
    counts.forEach(function (c) {
      var k = nameOf(c).replace('Count/', '');
      clickable(c, c.textContent.replace(/\s+/g, ' ').trim() + ' 거르기', function () {
        st.chipTouched = true;
        cur = k === cur ? 'All' : k;
        paintChips();
        applyFilter();
      });
    });
    /* ── 입력칸 — 눌러서 바로 입력 ── */
    var inputs = {};
    [['Field/Business System', 'Business System'], ['Field/Server', 'Server'], ['Field/Event ID', 'Event ID'], ['Field/Message', 'Message']].forEach(function (a) {
      var f = one(list, '[data-name="' + a[0] + '"] [data-name="Input"]');
      if (!f) return;
      var inp = document.createElement('input');
      inp.className = 'wr-input';
      inp.type = 'text';
      inp.setAttribute('aria-label', a[1]);
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { pullInputs(); applyFilter(); } });
      f.appendChild(inp);
      inputs[a[1]] = inp;
    });
    function pullInputs() { Object.keys(inputs).forEach(function (k) { filters[k] = inputs[k].value.trim(); }); }
    /* ── 드롭다운 ── */
    function openMenu(dd, opts, value, onPick) {
      var menu = document.createElement('div');
      menu.className = 'wr-menu';
      function render(v) { menu.innerHTML = opts.map(function (o) { return '<div data-v="' + esc(o) + '"' + (o === v ? ' class="cur"' : '') + '>' + esc(o) + '</div>'; }).join(''); }
      render(value);
      dd.appendChild(menu);
      dd.classList.add('wr-click');
      dd.style.cursor = 'pointer';
      dd.setAttribute('role', 'button');
      dd.setAttribute('tabindex', '0');
      dd.addEventListener('click', function (e) {
        if (editing()) return;
        var it = e.target.closest('.wr-menu div');
        if (it) {
          var v = it.getAttribute('data-v');
          var p = one(dd, '[data-name="Value"]') || one(dd, 'p');
          if (p) { p.textContent = v; p.classList.add('wr-num'); p.__wrLast = v; }
          render(v);
          dd.classList.remove('wr-open');
          onPick(v);
          return;
        }
        all(list, '.wr-open').forEach(function (x) { if (x !== dd) x.classList.remove('wr-open'); });
        dd.classList.toggle('wr-open');
      });
    }
    var uniq = function (c) { var seen = {}, a = ['전체']; rows.forEach(function (r) { var p = cell(r, c); if (p && !seen[p.textContent]) { seen[p.textContent] = 1; a.push(p.textContent); } }); return a; };
    var ddCat = one(list, '[data-name="Field/Category"] [data-name="Dropdown"]');
    var ddCol = one(list, '[data-name="Field/Collection"] [data-name="Dropdown"]');
    if (ddCat) openMenu(ddCat, uniq('Process Status'), '전체', function (v) { filters['Process Status'] = v; applyFilter(); });
    if (ddCol) openMenu(ddCol, uniq('Collection'), '전체', function (v) { filters.Collection = v; applyFilter(); });
    /* ── 조회 · 초기화 ── */
    clickable(one(list, '[data-name="Button/Search"]'), '조회', function () { pullInputs(); applyFilter(); });
    clickable(one(list, '[data-name="Button/Reset"]'), '초기화', function () {
      Object.keys(inputs).forEach(function (k) { inputs[k].value = ''; });
      Object.keys(filters).forEach(function (k) { filters[k] = /Process|Collection/.test(k) ? '전체' : ''; });
      [ddCat, ddCol].forEach(function (d) { var p = d && (one(d, '[data-name="Value"]') || one(d, 'p')); if (p) { p.textContent = '전체'; p.__wrLast = '전체'; } });
      cur = 'All'; st.chipTouched = false;
      paintChips();
      rows.forEach(function (r) { r.classList.remove('wr-sel'); });
      applyFilter();
    });
    /* ── 줄 고르기 · ACK ── */
    rows.forEach(function (r) {
      r.addEventListener('click', function () { if (!editing()) r.classList.toggle('wr-sel'); });
    });
    clickable(one(list, '[data-name="Button/ACK"]'), '고른 줄 확인(ACK)', function () {
      rows.forEach(function (r) {
        if (!r.classList.contains('wr-sel')) return;
        var p = cell(r, 'Process Status');
        if (p && p.textContent === '미처리') write(p, '처리중', true);
        else if (p && p.textContent === '처리중') write(p, '처리완료', true);
        r.classList.remove('wr-sel');
      });
    });
    /* ── 자동고침 — 고른 간격마다 새 이벤트가 맨 위로. 내용은 표에 있는 이벤트 유형을 그대로 쓴다 ── */
    var pool = rows.map(rowData);
    var ref = one(list, '[data-name="Icon/Action/Refresh"]');
    var ddRef = one(list, '[data-name="Auto Refresh"] [data-name="Dropdown"]');
    var refreshSec = 30;
    var fmtNow = function () { var d = new Date(); return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds()); };
    var countOf = function (k) { var c = counts.filter(function (x) { return nameOf(x) === 'Count/' + k; })[0]; return c ? all(c, 'p').pop() : null; };
    function pushEvent() {
      var data = rows.map(rowData);
      var src = pool[Math.floor(Math.random() * pool.length)];
      var d = {}; Object.keys(src).forEach(function (k) { d[k] = src[k]; });
      d.Time = fmtNow();
      d['Process Status'] = '미처리';
      data.unshift(d); data.pop();
      rows.forEach(function (r, i) { setRow(r, data[i]); });
      rows[0].classList.remove('wr-new'); void rows[0].offsetWidth; rows[0].classList.add('wr-new');
      /* 등급 칩 · 도넛 범례 숫자도 함께 */
      var a = countOf('All'), s = countOf(d.sev);
      if (a) write(a, comma(numOf(a) + 1), true);
      if (s) write(s, comma(numOf(s) + 1), true);
      all(root, '[data-name^="Item/"]').forEach(function (it) {
        if (it.textContent.indexOf(d['Business System']) < 0) return;
        var ps = all(it, 'p'), v = ps[ps.length - 1];
        write(v, comma(numOf(v) + 1), true);
      });
      applyFilter();
    }
    function refreshNow() {
      if (ref) { ref.classList.remove('wr-spin'); void ref.offsetWidth; ref.classList.add('wr-spin'); }
      pushEvent();
    }
    if (ref) clickable(ref, '지금 고치기', refreshNow);
    function armRefresh() {
      if (st.refTimer) clearInterval(st.refTimer);
      st.refTimer = null;
      if (refreshSec > 0) st.refTimer = setInterval(function () { if (!idle() && !editing()) refreshNow(); }, refreshSec * 1000);
    }
    if (ddRef) openMenu(ddRef, ['10초 마다', '30초 마다', '60초 마다', '끄기'], '30초 마다', function (v) { var m = /\d+/.exec(v); refreshSec = m ? +m[0] : 0; armRefresh(); });
    armRefresh();
    st.onDocClick = function (e) { if (!e.target.closest || !e.target.closest('[data-name="Dropdown"]')) all(list, '.wr-open').forEach(function (x) { x.classList.remove('wr-open'); }); };
    document.addEventListener('click', st.onDocClick);
    /* 발생일시 — 열 때마다 최근으로(맨 윗줄이 방금 · 줄 사이 간격은 원본 그대로) */
    var times = rows.map(function (r) { return cell(r, 'Time'); }).filter(Boolean);
    if (window.wembRestampTimes) window.wembRestampTimes(times);
    pool = rows.map(rowData);

    /* ── Fold Button — 원본에 없는 단추라 드롭다운의 펼침 그림을 그대로 쓴다 ── */
    var title = kid(list, 'Title');
    var src0 = one(list, '[data-name="Dropdown"] [data-name="Icon/Action/Expand"] img');
    var fold = document.createElement('div');
    fold.className = 'wr-fold';
    fold.setAttribute('data-name', 'Fold Button');
    if (src0) { var im = document.createElement('img'); im.alt = ''; im.src = src0.getAttribute('src'); fold.appendChild(im); }
    list.appendChild(fold);
    var toggle = function () {
      st.folded = !st.folded;
      var m = load(K_FOLD); if (st.folded) m[st.sc] = 1; else delete m[st.sc]; save(K_FOLD, m);
      list.classList.add('wr-folding');
      list.classList.toggle('wr-isfolded', st.folded);
      fold.setAttribute('title', st.folded ? '이벤트 목록 펼치기' : '이벤트 목록 접기');
      applyGroup(st, st.groups.stack);
      setTimeout(function () { list.classList.remove('wr-folding'); }, 620);
    };
    clickable(fold, st.folded ? '이벤트 목록 펼치기' : '이벤트 목록 접기', function (e) { e.stopPropagation(); toggle(); });
    clickable(title, null, toggle);
  }

  /* ══════════════════ 7. 차트 바꾸기(패널편집) ══════════════════
     패널마다 이 프로젝트에 맞춘 차트(첫 항목 = 추천). 값은 화면의 표 · KPI 와 같은 크기로 잡았다. */
  var C = { cy: '#29e2ff', tl: '#02d6b1', mint: '#00ffd2', red: '#f33131', yl: '#e4ff00', pu: '#c989ff', sk: '#45cde6', bl: '#487af8', pk: '#ec696d', gn: '#3ad59d', or: '#f7a93c' };
  var CAT = {
    core: ['여신계정', '전자금융', '여신지원', '재무회계', '마케팅', '업무공통'], coreT: [574, 531, 211, 142, 87, 317], coreR: [0.138, 0.147, 0.09, 0.163, 0.176, 0.124],
    bank: ['스마트뱅킹', '개인뱅킹', '기업뱅킹', '간편뱅킹', '인터넷뱅킹', '스피드뱅킹'], bankT: [186, 88, 57, 81, 42, 19], bankR: [0.226, 0.198, 0.18, 0.205, 0.247, 0.172],
    fep: ['타행이체', '카드승인', 'CD공동망', '대외조회'], fepT: [148, 113, 62, 33], fepR: [0.287, 0.262, 0.21, 0.301],
  };
  function txSpecs(sys, k, hi) {
    return [
      { k: 'area', t: sys + ' 거래 추이', unit: '만 건', series: [['금일(상암)', C.cy, hi * 0.62, hi * 0.05], ['금일(분당)', C.tl, hi * 0.36, hi * 0.04]], lo: 0, hi: hi },
      { k: 'bar', t: sys + ' 업무별 초당처리', unit: '건', cats: CAT[k], vals: CAT[k + 'T'], max: Math.max.apply(null, CAT[k + 'T']) * 1.3, c: C.cy },
      { k: 'donut', t: '센터별 처리 비중', parts: [['상암', C.cy, 62], ['분당', C.tl, 38]] },
      { k: 'gauge', t: '피크일 대비 금일', unit: '%', v: [71, 3], max: 100, c: C.tl },
    ];
  }
  function rtSpecs(sys, k) {
    var r = CAT[k + 'R'], m = r.reduce(function (a, b) { return a + b; }, 0) / r.length;
    return [
      { k: 'line', t: sys + ' 응답 추이', unit: '초', dec: 3, series: [['금일', C.cy, m, m * 0.08], ['기준', C.pu, m * 1.08, m * 0.04]], lo: 0, hi: m * 1.8 },
      { k: 'gauge', t: sys + ' 평균 응답', unit: '초', v: [m, m * 0.06], max: +(m * 2).toFixed(2), c: C.cy, dec: 3 },
      { k: 'hbar', t: '업무별 응답', unit: '초', cats: CAT[k], vals: r, max: Math.max.apply(null, r) * 1.25, c: C.cy, dec: 3 },
    ];
  }
  function tpsSpecs(sys, k) {
    var v = CAT[k + 'T'], s = v.reduce(function (a, b) { return a + b; }, 0);
    return [
      { k: 'area', t: sys + ' 초당처리 추이', unit: '건', series: [['금일', C.tl, s, s * 0.05], ['기준', C.pu, s * 1.06, s * 0.03]], lo: 0, hi: s * 1.5 },
      { k: 'bar', t: '업무별 초당처리', unit: '건', cats: CAT[k], vals: v, max: Math.max.apply(null, v) * 1.3, c: C.tl },
      { k: 'gauge', t: '처리 여유율', unit: '%', v: [66, 4], max: 100, c: C.tl },
      { k: 'donut', t: '업무별 처리 비중', parts: CAT[k].map(function (n, i) { return [n, [C.cy, C.tl, C.pu, C.or, C.pk, C.bl][i], v[i]]; }) },
    ];
  }
  function tableSpecs(sys, k) {
    var v = CAT[k + 'T'], r = CAT[k + 'R'];
    return [
      { k: 'hbar', t: sys + ' 매체별 초당처리', unit: '건', cats: CAT[k], vals: v, max: Math.max.apply(null, v) * 1.25, c: C.cy },
      { k: 'bar', t: sys + ' 매체별 응답', unit: '초', cats: CAT[k], vals: r, max: Math.max.apply(null, r) * 1.3, c: C.pu, dec: 3 },
      { k: 'donut', t: sys + ' 매체별 비중', parts: CAT[k].map(function (n, i) { return [n, [C.cy, C.tl, C.pu, C.or, C.pk, C.bl][i], v[i]]; }) },
    ];
  }
  var SYS_EVT = [['MCA', C.bl, 45], ['뱅크뱅킹', C.pk, 15], ['코아뱅킹', C.gn, 8], ['EAI', C.or, 2], ['FEP', C.sk, 1]];
  var CHARTS = {
    'Widget/Core Banking Transactions': txSpecs('코아뱅킹', 'core', 4000),
    'Widget/Bank Banking Transactions': txSpecs('뱅크뱅킹', 'bank', 400),
    'Widget/Core Banking Response Time': rtSpecs('코아뱅킹', 'core'),
    'Widget/Core Banking TPS': tpsSpecs('코아뱅킹', 'core'),
    'Widget/Bank Banking Response Time': rtSpecs('뱅크뱅킹', 'bank'),
    'Widget/Bank Banking TPS': tpsSpecs('뱅크뱅킹', 'bank'),
    'Widget/FEP TPS': tpsSpecs('FEP', 'fep'),
    'Widget/FEP Response Time': rtSpecs('FEP', 'fep'),
    'Table/Bank Banking': tableSpecs('뱅크뱅킹', 'bank'),
    'Table/Core Banking': tableSpecs('코아뱅킹', 'core'),
    'Table/FEP': tableSpecs('FEP', 'fep'),
    'Current Status': [
      { k: 'hbar', t: '업무시스템별 현재 이벤트', unit: '건', cats: SYS_EVT.map(function (s) { return s[0]; }), vals: SYS_EVT.map(function (s) { return s[2]; }), max: 60, c: C.cy },
      { k: 'bar', t: '업무시스템별 현재 이벤트', unit: '건', cats: SYS_EVT.map(function (s) { return s[0]; }), vals: SYS_EVT.map(function (s) { return s[2]; }), max: 60, c: C.bl },
      { k: 'gauge', t: '이벤트 처리율', unit: '%', v: [78, 3], max: 100, c: C.tl },
    ],
    'Hourly Events': [
      { k: 'area', t: '시간별 발생', unit: '건', series: SYS_EVT.slice(0, 3).map(function (s) { return [s[0], s[1], s[2] * 0.4 + 6, 3]; }), lo: 0, hi: 40 },
      { k: 'bar', t: '시간대별 발생 건수', unit: '건', cats: ['13시', '14시', '15시', '16시', '17시', '18시'], v: [24, 9], max: 40, c: C.bl },
      { k: 'line', t: '등급별 발생 추이', unit: '건', series: [['CR', '#f43230', 6, 2], ['MA', '#fc7f01', 14, 3], ['MI', '#fdd01f', 20, 3]], lo: 0, hi: 40 },
    ],
  };
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
    el.className = 'wr-chart';
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
        s += '<clipPath id="wrc' + spec.uid + '"><rect x="' + L + '" y="0" width="' + (w - L - R) + '" height="' + h + '"/></clipPath><g clip-path="url(#wrc' + spec.uid + ')">';
        data.forEach(function (a, si) {
          var col = spec.series[si][1];
          var pts = a.map(function (v, i) { return X(i).toFixed(1) + ',' + Y(v).toFixed(1); }).join(' ');
          if (spec.k === 'area' || si === 0) {
            s += '<defs><linearGradient id="wrg' + spec.uid + si + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + col + '" stop-opacity="' + (spec.k === 'area' ? .4 : .18) + '"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></linearGradient></defs>';
            s += '<polygon fill="url(#wrg' + spec.uid + si + ')" points="' + X(0).toFixed(1) + ',' + (h - B) + ' ' + pts + ' ' + X(N - 1).toFixed(1) + ',' + (h - B) + '"/>';
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
        + '<defs><linearGradient id="wrgg' + spec.uid + '" x1="0" x2="1"><stop offset="0" stop-color="#2a7ca0"/><stop offset="1" stop-color="' + spec.c + '"/></linearGradient></defs>'
        + '<path d="M8 52a42 42 0 0 1 84 0" fill="none" stroke="rgba(142,166,179,.2)" stroke-width="8"/>'
        + '<path class="arc" d="M8 52a42 42 0 0 1 84 0" fill="none" stroke="url(#wrgg' + spec.uid + ')" stroke-width="8" stroke-dasharray="0 ' + LEN.toFixed(1) + '"/>'
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
  /* 바꿔 넣은 차트는 시트 밖에서 그리므로 '색 정하기'가 안 닿는다 — 칠해진 활성 메뉴 색에서 회전각을 읽어 같이 돌린다(원본 색상각 198°) */
  function syncChartHue(root) {
    var c = root.querySelector('[data-name$="(Active)"] [data-name="Content"]');
    var m = c && /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(getComputedStyle(c).backgroundColor);
    if (!m) return;
    var r = +m[1], g = +m[2], b = +m[3], mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    if (!d) return;
    var h = (mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60;
    var rot = ((h - 198 + 540) % 360) - 180;
    root.style.setProperty('--wr-chue', (Math.abs(rot) < 3 ? 0 : Math.round(rot)) + 'deg');
  }
  function installChartSwap(root, st) {
    var sc = st.sc;
    var saved = load(K_CHART)[sc] || {};
    st.charts = {}; st.chartApply = {}; st.hostFns = [];
    var targets = [];
    Object.keys(CHARTS).forEach(function (wn) {
      if (wn === 'Current Status' || wn === 'Hourly Events') return;
      all(root, '[data-name="' + wn + '"]').forEach(function (el) { targets.push({ key: wn, w: el, card: kid(el, 'Card BG') }); });
    });
    if (sc === 'event') {
      var ov = one(root, '[data-name="Widget/Event Overview"]');
      if (ov) {
        var card = kid(ov, 'Card BG');
        targets.push({ key: 'Current Status', w: ov, card: card, part: [kid(ov, 'Current Status'), kid(ov, 'Title/Current Status')], rect: function () { return { l: 30, t: card.offsetTop, w: 418, h: parseFloat(card.style.height) || card.offsetHeight }; } });
        targets.push({ key: 'Hourly Events', w: ov, card: card, part: [kid(ov, 'Line Chart'), kid(ov, 'Title/Hourly Events')], rect: function () { return { l: 450, t: card.offsetTop, w: (parseFloat(card.style.width) || card.offsetWidth) - 420, h: parseFloat(card.style.height) || card.offsetHeight }; } });
      }
    }
    targets.forEach(function (tg) {
      var w = tg.w, key = tg.key;
      var host = document.createElement('div');
      host.className = 'wr-chost';
      if (getComputedStyle(w).position === 'static') w.style.position = 'relative';
      w.appendChild(host);
      var place = function () {
        if (tg.rect) { var r = tg.rect(); host.style.left = r.l + 'px'; host.style.top = r.t + 'px'; host.style.width = r.w + 'px'; host.style.height = r.h + 'px'; return; }
        if (tg.card) {
          host.style.left = tg.card.offsetLeft + 'px';
          host.style.top = tg.card.offsetTop + 'px';
          host.style.width = (tg.card.style.width || tg.card.offsetWidth + 'px');
          host.style.height = (tg.card.style.height || tg.card.offsetHeight + 'px');
        } else host.style.inset = '0';
      };
      place();
      st.hostFns.push(place);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'wr-chartbtn';
      btn.innerHTML = KIND_ICON.bar.replace('class="ic"', 'class="ic" style="width:13px;height:11px"') + '차트';
      btn.title = '이 패널의 차트 바꾸기';
      var menu = document.createElement('div');
      menu.className = 'wr-chartmenu';
      host.appendChild(btn); host.appendChild(menu);
      var cur = saved[key] != null ? saved[key] : -1;
      function render() {
        var list = CHARTS[key];
        menu.innerHTML = '<div class="hd">추천 차트</div>'
          + list.map(function (s, i) {
            return '<button type="button" data-i="' + i + '"' + (i === cur ? ' class="cur"' : '') + '>' + KIND_ICON[s.k] + esc(s.t) + ' · ' + KIND_NAME[s.k]
              + (i === 0 ? '<span class="rec">추천</span>' : '') + '</button>';
          }).join('')
          + '<div class="sep"></div><button type="button" data-i="-1"' + (cur < 0 ? ' class="cur"' : '') + '>' + KIND_ICON.orig + '원본 그대로</button>';
      }
      function apply(i) {
        cur = i;
        if (st.charts[key]) { st.charts[key].dispose(); delete st.charts[key]; }
        if (tg.part) tg.part.forEach(function (n) { if (n) n.classList.toggle('wr-hide', i >= 0); });
        else w.classList.toggle('wr-swapped', i >= 0);
        if (i >= 0 && CHARTS[key][i]) {
          st.charts[key] = makeChart(host, Object.assign({ uid: ++chartUid }, CHARTS[key][i]));
          host.appendChild(btn); host.appendChild(menu);
        }
        var m = load(K_CHART); m[sc] = m[sc] || {};
        if (i >= 0) m[sc][key] = i; else delete m[sc][key];
        save(K_CHART, m);
        render();
      }
      render();
      var stop = function (e) { e.stopPropagation(); };
      btn.addEventListener('pointerdown', stop);
      menu.addEventListener('pointerdown', stop);
      btn.addEventListener('pointerup', function (e) {
        e.stopPropagation(); e.preventDefault();
        all(root, '.wr-chartmenu.open').forEach(function (m) { if (m !== menu) m.classList.remove('open'); });
        menu.classList.toggle('open');
      });
      menu.addEventListener('pointerup', function (e) {
        var b = e.target.closest('button[data-i]');
        e.stopPropagation(); e.preventDefault();
        if (!b) return;
        apply(+b.getAttribute('data-i'));
        menu.classList.remove('open');
      });
      st.chartApply[key] = apply;
      if (cur >= 0) apply(cur);
    });
    syncChartHue(root);
    st.timers.push(setInterval(function () { syncChartHue(root); }, 1200));
    st.onLayout = function () { st.hostFns.forEach(function (f) { f(); }); };
    st.onDocDown = function (e) {
      if (e.target.closest && e.target.closest('.wr-chartmenu, .wr-chartbtn')) return;
      all(root, '.wr-chartmenu.open').forEach(function (m) { m.classList.remove('open'); });
    };
    document.addEventListener('pointerdown', st.onDocDown, true);
  }

  /* ══════════════════ 8. 패널 옮기기(패널편집) ══════════════════
     같은 묶음의 다른 자리에 놓으면 그 차례에 끼어들고, 나머지가 흘러 빈틈 없이 다시 앉는다(점선이 들어갈 곳을 미리 보여 준다).
     구성도 · 네트워크 거르기는 4px 격자로 자유 이동. 장면별로 저장, '배치 초기화'로 되돌린다. */
  function installPanelMove(root, st) {
    var sc = st.sc;
    var L = load(K_LAYOUT); L[sc] = L[sc] || {};
    function persist() { var m = load(K_LAYOUT); m[sc] = L[sc]; save(K_LAYOUT, m); }
    var drag = null, ghost = null;
    var scale = function () { return st.S || 1; };
    function ghostAt(s) {
      if (!ghost) { ghost = document.createElement('div'); ghost.className = 'wr-ghost'; st.frame.appendChild(ghost); }
      ghost.style.left = s.x + 'px'; ghost.style.top = s.y + 'px'; ghost.style.width = s.w + 'px'; ghost.style.height = s.h + 'px';
    }
    function spotOf(e, g, name) {
      var fr = st.frame.getBoundingClientRect(), S = scale();
      var x = (e.clientX - fr.left) / S, y = (e.clientY - fr.top) / S;
      var slots = g.slots(g.order), best = 0, bd = Infinity;
      slots.forEach(function (s, i) {
        var d = Math.hypot(x - (s.x + s.w / 2), y - (s.y + s.h / 2));
        if (d < bd) { bd = d; best = i; }
      });
      return { idx: best, slot: slots[best] };
    }
    st.onDown = function (e) {
      if (!layoutEditing(root) || e.button !== 0) return;
      if (e.target.closest('.wr-chartbtn, .wr-chartmenu, .wr-fold')) return;
      /* 패널편집은 글자 수정과 함께 켜진다 — 글자 위에서 시작한 끌기는 글자 고르기로 둔다 */
      if (e.target.closest('[contenteditable="true"]')) return;
      var w = e.target.closest('.wr-mv, .wr-fmv');
      if (!w || !root.contains(w)) return;
      e.preventDefault(); e.stopPropagation();
      var o = w.__wrMove || [0, 0];
      drag = { w: w, it: w.__wr, free: w.__wrFree, sx: e.clientX, sy: e.clientY, ox: o[0], oy: o[1], moved: false };
    };
    st.onMove = function (e) {
      if (!drag) return;
      var dx = (e.clientX - drag.sx) / scale(), dy = (e.clientY - drag.sy) / scale();
      if (!drag.moved) {
        if (Math.hypot(dx, dy) < 3) return;
        drag.moved = true;
        drag.w.classList.add('wr-dragging');
      }
      if (drag.it) {
        drag.w.style.setProperty('--wr-dx', dx + 'px');
        drag.w.style.setProperty('--wr-dy', dy + 'px');
        var sp = spotOf(e, drag.it.group, drag.it.name);
        drag.spot = sp;
        ghostAt(sp.slot);
      } else {
        var g = 4, x = Math.round((drag.ox + dx) / g) * g, y = Math.round((drag.oy + dy) / g) * g;
        drag.w.style.setProperty('--wr-dx', x + 'px'); drag.w.style.setProperty('--wr-dy', y + 'px');
        drag.w.__wrMove = [x, y];
      }
    };
    st.onUp = function () {
      if (!drag) return;
      var d = drag; drag = null;
      if (ghost) { ghost.remove(); ghost = null; }
      if (!d.moved) { d.w.classList.remove('wr-dragging'); return; }
      if (d.it) {
        var g = d.it.group, info = d.it;
        /* 놓은 자리에서 새 자리로 미끄러져 들어간다 */
        var bx = info.tx + (parseFloat(d.w.style.getPropertyValue('--wr-dx')) || 0), by = info.ty + (parseFloat(d.w.style.getPropertyValue('--wr-dy')) || 0);
        d.w.style.setProperty('--wr-dx', '0px'); d.w.style.setProperty('--wr-dy', '0px');
        setT(d.w, bx, by);
        void d.w.offsetWidth;
        d.w.classList.remove('wr-dragging');
        var list = g.order.filter(function (n) { return n !== info.name; });
        var idx = d.spot ? d.spot.idx : info.idx;
        list.splice(idx, 0, info.name);
        g.order = list;
        applyGroup(st, g);
        L[sc].order = L[sc].order || {};
        L[sc].order[g.key] = g.order.slice();
        persist();
        if (st.onLayout) st.onLayout();
      } else {
        d.w.classList.remove('wr-dragging');
        L[sc].free = L[sc].free || {};
        L[sc].free[d.free.name] = d.w.__wrMove;
        persist();
      }
    };
    root.addEventListener('pointerdown', st.onDown, true);
    window.addEventListener('pointermove', st.onMove);
    window.addEventListener('pointerup', st.onUp);
    window.addEventListener('pointercancel', st.onUp);
    st.onDragStart = function (e) { if (layoutEditing(root) && e.target.closest && e.target.closest('.wr-mv, .wr-fmv')) e.preventDefault(); };
    root.addEventListener('dragstart', st.onDragStart);
    /* 편집 중 — 패널을 끄는 중에 표 줄 · 칩이 눌리지 않게 */
    st.onClickCap = function (e) { if (layoutEditing(root) && !e.target.closest('.wr-chartbtn, .wr-chartmenu, .wr-resetbtn')) { e.stopPropagation(); e.preventDefault(); } };
    root.addEventListener('click', st.onClickCap, true);
    /* 스튜디오 '배치 초기화' — 자리 · 이동 · 차트를 원본으로 */
    st.resetLayout = function () {
      var m = load(K_LAYOUT); delete m[sc]; save(K_LAYOUT, m); L[sc] = {};
      Object.keys(st.groups).forEach(function (k) { var g = st.groups[k]; g.order = g.order0.slice(); applyGroup(st, g); });
      st.blocks.forEach(function (b) { if (b.el && b.el.__wrFree) { b.el.style.setProperty('--wr-dx', '0px'); b.el.style.setProperty('--wr-dy', '0px'); b.el.__wrMove = null; } });
      var c = load(K_CHART); delete c[sc]; save(K_CHART, c);
      Object.keys(st.chartApply || {}).forEach(function (k) { st.chartApply[k](-1); });
      if (st.onLayout) st.onLayout();
    };
    /* 작업공간에 '배치 초기화' 단추(#layoutReset)가 없는 화면이 있어 편집 중에 화면 위에 하나 둔다 */
    var rb = document.createElement('button');
    rb.type = 'button';
    rb.className = 'wr-resetbtn';
    rb.textContent = '배치 초기화';
    rb.title = '패널 자리 · 바꾼 차트를 원본으로';
    st.frame.appendChild(rb);
    rb.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    /* 편집 중 클릭은 dt-edit.js 가 캡처 단계에서 막는다 — 차트 단추처럼 pointerup 으로 받는다 */
    rb.addEventListener('pointerup', function (e) { e.stopPropagation(); e.preventDefault(); st.resetLayout(); });
    st.onReset = function (e) { if (e.target.closest && e.target.closest('#layoutReset')) st.resetLayout(); };
    document.addEventListener('click', st.onReset, true);
  }

  /* ══════════════════ 살리기 ══════════════════ */
  function start(root, st) {
    try { installFit(root, st); } catch (e) { console.warn('[wr] fit', e); }
    try { installClock(root, st); } catch (e) { console.warn('[wr] clock', e); }
    try { installRecent(root, st); } catch (e) { console.warn('[wr] recent', e); }
    try { installNav(root, st); } catch (e) { console.warn('[wr] nav', e); }
    try { installCharts(root, st); } catch (e) { console.warn('[wr] charts', e); }
    try { installNumbers(root, st); } catch (e) { console.warn('[wr] numbers', e); }
    try { installEvent(root, st); } catch (e) { console.warn('[wr] event', e); }
    try { installChartSwap(root, st); } catch (e) { console.warn('[wr] swap', e); }
    try { installPanelMove(root, st); } catch (e) { console.warn('[wr] move', e); }
  }
  function initWoori(root) {
    if (!root || root.__wr) return;
    injectStyle();
    root.classList.add('wr-root');
    var st = root.__wr = { timers: [], raf: {}, sc: sceneOf(root) };
    if (/[?&]edit=1/.test(location.search)) root.classList.add('wr-edit-layout');
    /* 화면이 아직 크기를 못 받았으면(가려진 채 그릴 때) 받은 뒤에 잰다 — 0 으로 재면 자리가 다 틀어진다 */
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
  function disposeWoori(root) {
    var st = root && root.__wr;
    if (!st) return;
    if (st.wait) st.wait.disconnect();
    st.timers.forEach(function (t) { clearInterval(t); clearTimeout(t); });
    if (st.refTimer) clearInterval(st.refTimer);
    Object.keys(st.raf).forEach(function (k) { cancelAnimationFrame(st.raf[k]); });
    if (st.ro) st.ro.disconnect();
    if (st.onResize) window.removeEventListener('resize', st.onResize);
    Object.keys(st.charts || {}).forEach(function (k) { st.charts[k].dispose(); });
    if (st.onDocDown) document.removeEventListener('pointerdown', st.onDocDown, true);
    if (st.onDocClick) document.removeEventListener('click', st.onDocClick);
    if (st.onMove) { window.removeEventListener('pointermove', st.onMove); window.removeEventListener('pointerup', st.onUp); window.removeEventListener('pointercancel', st.onUp); }
    if (st.onReset) document.removeEventListener('click', st.onReset, true);
    root.__wr = null;
  }
  window.initWoori = initWoori;
  window.disposeWoori = disposeWoori;
})();
