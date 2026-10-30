/* 신한카드 정보보호 대시보드 — 재구축 화면 네 장의 인터랙션 · 라이브 · 반응형 레이어.
   window.initShinhan(root) / window.disposeShinhan(root)

   화면(DOM·CSS)은 생성기(src/shinhan/_gen/conv.js)가 Figma(zXb8i3nonD9Hpu5kdZQs6t) 그대로 만든다.
   이 파일은 그 위에 '움직이는 것'만 얹는다 — 형상·색·자리는 건드리지 않는다(정지 상태 = Figma 원본).

   · 반응형 — 1920x1080 좌표계는 그대로 두고 균일 배율 S 로 키운 뒤, 남는 폭·높이(exW·exH)를 블록에 나눈다.
     보안 현황은 두 열의 위젯 판(Background)이 남는 높이를 나눠 갖고 내용은 판 가운데에 선다 — 여백 없이 꽉 찬다.
     정확히 16:9 면 늘어난 몫이 0 이라 Figma 와 같은 그림이다.
   · 실시간 시계 · 열 때마다 최근 날짜(차트 날짜 · 공지일시 · 이번 주 일정 · 기준일자 · 기준 월)
   · 마우스 오버 · 눌림(헤더 메뉴 · 액션 아이콘 · 표 줄 · KPI · 일정 카드 · 배지 · 버튼 · 체크박스 · 시나리오 막대)
   · 라이브 — 트래픽 선이 흐르고, 시나리오 막대 · 금일 건수가 실시간처럼 바뀐다(사람이 고친 글자는 덮지 않는다)
   · 이상징후 탐지 표 — 줄 고르기 · 체크 · 대분류 거르기 · 조회 · 더블클릭하면 그 줄로 '이상징후 탐지 등록' 창
   · 차트 바꾸기(패널편집 중) — 위젯마다 이 프로젝트(정보보호 · 이상징후 · 정보반출 · 내부통제)에 맞춘 추천 차트
   · 패널 옮기기(패널편집 중) — 보안 현황 위젯은 다른 열 · 다른 자리에 놓으면 나머지가 흘러 빈틈 없이 다시 쌓인다
   · 라이트 테마 — 원본은 다크. 형상은 그대로, 판 · 글자 색만 밝은 판에 맞게 다시 적는다(대비 확인).

   손으로 쓴 파일이다(생성물 아님). 고친 뒤 js/core/tpl-modules.js 의 ?v= 를 올릴 것. */
(function () {
  'use strict';

  var BASE_W = 1920, BASE_H = 1080;
  var K_LAYOUT = 'wemb-shinhan-layout';
  var K_CHART = 'wemb-shinhan-chart';
  var K_ENTRY = 'wemb-shinhan-entry';
  var COL_X = { L: 25, R: 970 }, COL_TOP = 83, COL_GAP = 14, COL_H = 972, COL_W = 925;

  /* ══════════════════ 스타일 ══════════════════ */
  var STYLE_ID = 'shinhan-live-style';
  var EASE = 'cubic-bezier(.22,.8,.24,1)';
  var CSS = [
    /* 강조 · 빛 색 — 다크는 원본 네온, 라이트는 흰 판에 맞는 차분한 파랑(아래 라이트 절에서 값만 바꾼다) */
    '.sh-root{--sh-acc:104,212,255;--sh-acc2:104,140,255;--sh-acc3:0,186,255;}',
    /* 블록 · 위젯 이동은 CSS translate 속성 하나로 — 원본 transform(translateX(-50%) 등)을 덮지 않으려고.
       --sh-tx/ty = 반응형 · 열 재배치, --sh-dx/dy = 끄는 중 */
    '.sh-root .sh-blk,.sh-root .sh-wl{translate:calc(var(--sh-tx,0px) + var(--sh-dx,0px)) calc(var(--sh-ty,0px) + var(--sh-dy,0px));}',
    '.sh-root.sh-live .sh-blk,.sh-root.sh-live .sh-wl{transition:translate .55s ' + EASE + ',opacity .4s ease;}',
    '.sh-root.sh-live .sh-wl [data-name="Background"]{transition:top .55s ' + EASE + ',height .55s ' + EASE + ',left .55s ' + EASE + ',width .55s ' + EASE + ';}',
    '.sh-root.sh-resizing .sh-blk,.sh-root.sh-resizing .sh-wl,.sh-root.sh-resizing .sh-wl [data-name="Background"],.sh-root .sh-dragging,.sh-root .sh-dragging [data-name="Background"]{transition:none!important;}',
    '.sh-root{overflow:clip!important;}',
    '.sh-root [data-name^="Screen/"]{background:transparent!important;}',
    '.sh-root .sh-bgimg{object-fit:cover;}',
    /* Figma GROUP 위젯(display:contents)을 화면 크기 투명 층으로 세운다 — 안쪽 좌표는 그대로라 그림은 같다 */
    /* 원래 그룹에 붙어 있던 자리 값(left/top · translateX(-50%))은 상자가 없을 때만 뜻이 없었다 — 상자를 세우면 걷어야 한다 */
    '.sh-root .sh-wl{display:block!important;position:absolute!important;left:0!important;top:0!important;right:auto!important;bottom:auto!important;margin:0!important;transform:none!important;width:1920px!important;height:1080px!important;pointer-events:none;}',
    '.sh-root .sh-wl > *{pointer-events:auto;}',

    /* ── '여기 눌린다' ── */
    '.sh-root .sh-click{cursor:pointer;}',
    '.sh-root .sh-click *{cursor:inherit;}',
    '.dt-content-editing .sh-root .sh-click,.dt-content-editing .sh-root .sh-click *{cursor:text;}',
    '.sh-root .sh-click:focus-visible{outline:2px solid rgb(var(--sh-acc));outline-offset:2px;}',

    /* 헤더 메뉴 */
    '.sh-root [data-name^="Menu Item/"]{transition:color .2s ease,text-shadow .2s ease,translate .2s ease;}',
    '.sh-root [data-name^="Menu Item/"]:not(.sh-cur):hover{color:#fff!important;text-shadow:0 0 10px rgba(var(--sh-acc),.85);translate:0 -1px;}',
    '.sh-root [data-name^="Menu Item/"]:active{translate:0 1px;}',
    /* 헤더 액션 아이콘 · 브랜드 */
    '.sh-root [data-name^="Icon/Action/"]{transition:scale .2s ease,filter .2s ease,rotate .45s ' + EASE + ';}',
    '.sh-root [data-name="Time Group"] > [data-name^="Icon/Action/"]:hover,.sh-root [data-name="Close Button"]:hover [data-name^="Icon/Action/"]{scale:1.14;filter:brightness(1.3) drop-shadow(0 0 6px rgba(var(--sh-acc),.85));}',
    '.sh-root [data-name="Time"]:hover [data-name="Icon/Action/Clock"]{rotate:360deg;filter:drop-shadow(0 0 6px rgba(var(--sh-acc),.85));}',
    '.sh-root [data-name="Brand"]{transition:filter .2s ease;}',
    '.sh-root [data-name="Brand"].sh-click:hover{filter:brightness(1.2) drop-shadow(0 0 8px rgba(var(--sh-acc),.5));}',

    /* 버튼 — 밝아지고 빛이 번진다 */
    '.sh-root [data-name^="Button/"],.sh-root [data-name="Close Button"]{transition:filter .2s ease,box-shadow .2s ease,scale .15s ease;}',
    '.sh-root [data-name^="Button/"]:hover,.sh-root [data-name="Close Button"]:hover{filter:brightness(1.22);box-shadow:0 0 14px rgba(var(--sh-acc2),.6);}',
    '.sh-root [data-name^="Button/"]:active,.sh-root [data-name="Close Button"]:active{scale:.96;filter:brightness(.95);}',
    '.sh-root [data-name="Close Button"]:hover [data-name="Icon/Action/Close"]{rotate:90deg;}',
    /* 입력칸 · 거르기 칸 */
    '.sh-root [data-name="Input"]{transition:box-shadow .2s ease,filter .2s ease;}',
    '.sh-root [data-name="Input"]:hover{box-shadow:0 0 0 1px rgba(156,151,226,.8),0 0 12px rgba(120,130,255,.35);}',
    '.sh-root [data-name="Field/Category"] [data-name="Box"],.sh-root [data-name="Field/Base Date"] [data-name="Input"]{transition:box-shadow .2s ease,filter .2s ease;}',
    '.sh-root [data-name="Field/Category"]:hover [data-name="Box"],.sh-root [data-name="Field/Base Date"]:hover [data-name="Input"]{filter:brightness(1.3);box-shadow:0 0 10px rgba(var(--sh-acc2),.55);}',

    /* 소제목 단추(점검대상부서 등) · 표 머리 칩 · 연도 칩 */
    '.sh-root [data-name^="Section Label/"] [data-name="Chip"],.sh-root [data-name="Chip"],.sh-root [data-name^="Chip/"]{transition:filter .2s ease;}',
    '.sh-root [data-name^="Section Label/"]:hover [data-name="Chip"],.sh-root [data-name^="Th/"]:hover [data-name="Chip"],.sh-root [data-name^="Chip/"]:hover{filter:brightness(1.3) drop-shadow(0 0 8px rgba(var(--sh-acc),.5));}',
    '.sh-root [data-name^="Section Label/"] [data-name="Line"]{transition:filter .3s ease;}',
    '.sh-root [data-name^="Section Label/"]:hover [data-name="Line"]{filter:brightness(1.6) drop-shadow(0 0 4px rgb(var(--sh-acc)));}',

    /* 표 줄(보안 현황) */
    '.sh-root [data-name^="Row/"] > [data-name="Row BG"],.sh-root [data-name^="Row/"] [data-name="Cells BG"],.sh-root [data-name^="Row/"] [data-name^="Cell BG/"]{transition:filter .2s ease,box-shadow .2s ease;}',
    '.sh-root [data-name^="Row/"]:hover > [data-name="Row BG"]{filter:brightness(1.35);box-shadow:0 0 10px rgba(var(--sh-acc2),.45);}',
    '.sh-root [data-name^="Row/"]:hover [data-name="Cells BG"],.sh-root [data-name^="Row/"]:hover [data-name^="Cell BG/"]{filter:brightness(2.2);}',
    /* 지표 칩 · KPI · 일정 카드 · 배지 */
    '.sh-root [data-name="Value Box"]{transition:box-shadow .2s ease,filter .2s ease;}',
    '.sh-root [data-name^="Metric/"]:hover [data-name="Value Box"]{filter:brightness(1.35);box-shadow:0 0 14px rgba(var(--sh-acc3),.45);}',
    '.sh-root [data-name^="KPI/"] > *{transition:translate .3s ' + EASE + ',filter .3s ease;}',
    '.sh-root [data-name^="KPI/"]:hover > :not([data-name="Caption"]){translate:0 -5px;filter:brightness(1.18) drop-shadow(0 8px 12px rgba(80,90,255,.35));}',
    '.sh-root [data-name^="Schedule Card/"] > *{transition:translate .3s ' + EASE + ',filter .3s ease;}',
    '.sh-root [data-name^="Schedule Card/"]:hover > *{translate:0 -4px;filter:brightness(1.22) drop-shadow(0 6px 10px rgba(120,90,255,.35));}',
    '.sh-root [data-name="Icon Badge"],.sh-root [data-name="Category Badge"] > *{transition:translate .3s ' + EASE + ',filter .3s ease;}',
    '.sh-root [data-name="Icon Badge"]:hover,.sh-root [data-name="Category Badge"]:hover > *{translate:0 -3px;filter:brightness(1.2) drop-shadow(0 0 10px rgba(var(--sh-acc2),.6));}',
    /* 시나리오 막대 — 하이라이트가 고른 시나리오로 미끄러진다 */
    '.sh-root [data-name="Highlight"]{transition:translate .45s ' + EASE + ';}',
    '.sh-root [data-name="Fill"]{transition:height .9s ' + EASE + ',top .9s ' + EASE + ';}',
    '.sh-root [data-name^="Bar Group/"] p{transition:color .3s ease;}',
    '.sh-root [data-name^="Bar Group/"]:hover [data-name="Fill"]{filter:brightness(1.25) drop-shadow(0 0 6px rgba(0,246,255,.6));}',
    /* 이상징후 탐지 표 */
    '.sh-root [data-name="Table/Anomaly Detection"] [data-name^="Row/"]{transition:filter .15s ease;}',
    '.sh-root [data-name="Table/Anomaly Detection"] [data-name^="Row/"]:hover{filter:brightness(1.28);}',
    '.sh-root [data-name="Table/Anomaly Detection"] [data-name^="Row/"].sh-hide{display:none!important;}',
    '.sh-root [data-name="Table/Anomaly Detection"] [data-name="Body"] > [data-name^="Row/"] > *{height:var(--sh-rowh,30px)!important;}',
    '@keyframes shRowIn{from{opacity:0;translate:0 -6px}to{opacity:1;translate:0 0}}',
    '.sh-root .sh-rowin{animation:shRowIn .45s ' + EASE + ' both;}',
    '.sh-root [data-name="Td/Visible"]{cursor:pointer;}',
    '.sh-root [data-name="Td/Visible"] > *{transition:scale .15s ease,filter .15s ease;}',
    '.sh-root [data-name="Td/Visible"]:hover > *{scale:1.15;filter:brightness(1.5) drop-shadow(0 0 4px rgb(var(--sh-acc)));}',
    /* 입력 화면 — '입력' 을 누르면 그 표의 값 칸을 바로 고친다 */
    '.sh-root .sh-entry-on [data-name^="Td/"]:not([data-name="Td/Category"]){box-shadow:inset 0 0 0 1px rgba(95,173,204,.75);}',
    '.sh-root .sh-entry-on [data-name^="Td/"] p[contenteditable]{outline:none;min-width:24px;text-align:center;cursor:text;}',
    '.sh-root .sh-entry-on [data-name^="Td/"]:focus-within{box-shadow:inset 0 0 0 2px rgb(var(--sh-acc));}',
    '.sh-root .sh-entry-on [data-name="Button/Input"]{filter:brightness(1.35);box-shadow:0 0 14px rgba(95,173,204,.8);}',

    /* ── 늘 움직이는 것 ── */
    /* 방패 링(Visual) — Figma 가 링 · 방패를 한 장의 그림으로 내보냈다(층이 따로 없다). 그림 통째로 은은하게 숨쉰다 */
    '@keyframes shPulse{0%,100%{filter:drop-shadow(0 0 0 rgba(var(--sh-acc),0))}50%{filter:drop-shadow(0 0 10px rgba(var(--sh-acc),.85))}}',
    '.sh-root.sh-live [data-name="Visual"]{animation:shPulse 2.6s ease-in-out infinite;}',
    '.sh-root.sh-live [data-name="Badge/Threat Level"]{animation:shPulse 3.2s ease-in-out infinite;}',
    '@keyframes shBreath{0%,100%{opacity:1}50%{opacity:.72}}',
    '.sh-root.sh-live [data-name="Highlight"]{animation:shBreath 3.4s ease-in-out infinite;}',
    '@keyframes shDot{0%,70%,100%{scale:1;filter:none}35%{scale:1.6;filter:drop-shadow(0 0 4px rgb(var(--sh-acc)))}}',
    '.sh-root.sh-live [data-name="Timeline"] > [data-name="Dot"]{animation:shDot 3s ease-in-out infinite;}',
    '.sh-root.sh-live [data-name="Timeline"] > [data-name="Dot"]:nth-child(3){animation-delay:.4s}',
    '.sh-root.sh-live [data-name="Timeline"] > [data-name="Dot"]:nth-child(4){animation-delay:.8s}',
    '.sh-root.sh-live [data-name="Timeline"] > [data-name="Dot"]:nth-child(5){animation-delay:1.2s}',
    '.sh-root.sh-live [data-name="Timeline"] > [data-name="Dot"]:nth-child(6){animation-delay:1.6s}',
    '@keyframes shGlow{0%,100%{opacity:.75}50%{opacity:1}}',
    '.sh-root.sh-live [data-name="Pedestal"] > [data-name="Glow"]{animation:shGlow 2.8s ease-in-out infinite;}',
    '@keyframes shTick{0%{text-shadow:0 0 10px rgba(var(--sh-acc),.95)}100%{text-shadow:0 0 0 rgba(var(--sh-acc),0)}}',
    '.sh-root .sh-tick{animation:shTick .9s ease-out;}',
    '.sh-root .sh-num{white-space:nowrap;}',
    '@keyframes shFlash{0%{box-shadow:0 0 0 2px rgba(var(--sh-acc),.95),0 0 26px rgba(var(--sh-acc),.7)}100%{box-shadow:0 0 0 2px rgba(var(--sh-acc),0),0 0 26px rgba(var(--sh-acc),0)}}',
    '.sh-root .sh-flash{animation:shFlash 1.4s ease-out;border-radius:20px;}',

    /* ── 겹쳐 뜬 '이상징후 탐지 등록' 창 ── */
    '.sh-root .sh-ovl{position:absolute;left:0;top:0;width:1920px;height:1080px;z-index:70;}',
    '.sh-root .sh-ovl .sh-dim{position:absolute;inset:0;background:rgba(0,0,0,.5);animation:shFade .3s ease both;}',
    '.sh-root .sh-ovl.sh-out .sh-dim{animation:shFadeOut .25s ease both;}',
    '.sh-root .sh-popmount{animation:shPopIn .42s ' + EASE + ' both;}',
    '.sh-root .sh-ovl.sh-out .sh-popmount{animation:shPopOut .25s ease both;}',
    '@keyframes shFade{from{opacity:0}to{opacity:1}}',
    '@keyframes shFadeOut{from{opacity:1}to{opacity:0}}',
    /* translate 속성은 반응형 자리(--sh-tx/ty)가 쓰므로 여는 움직임은 transform 으로만 — 애니메이션이 translate 를 덮으면 창이 한가운데를 벗어난다 */
    '@keyframes shPopIn{from{opacity:0;transform:translateY(8px) scale(.97)}to{opacity:1;transform:none}}',
    '@keyframes shPopOut{from{opacity:1;transform:none}to{opacity:0;transform:scale(.98)}}',

    /* ── 패널편집: 옮기기 ── */
    '.dt-editing .sh-root .sh-mv > [data-name="Background"],.sh-root.sh-edit-layout .sh-mv > [data-name="Background"]{outline:1px dashed rgba(var(--sh-acc),0);outline-offset:3px;transition:outline-color .2s ease;}',
    '.dt-editing .sh-root .sh-mv:has(:hover) > [data-name="Background"],.sh-root.sh-edit-layout .sh-mv:has(:hover) > [data-name="Background"]{outline-color:rgba(var(--sh-acc),.9);}',
    '.dt-editing .sh-root .sh-mv > *,.sh-root.sh-edit-layout .sh-mv > *{cursor:grab;}',
    '.sh-root .sh-mv.sh-dragging{z-index:30;filter:drop-shadow(0 14px 22px rgba(0,0,0,.5));}',
    '.sh-root .sh-mv.sh-dragging > *{cursor:grabbing;}',
    '.sh-root .sh-mv.sh-dragging > [data-name="Background"]{outline:1px solid rgb(var(--sh-acc))!important;}',
    '.sh-root .sh-ghost{position:absolute;z-index:4;border:2px dashed rgba(var(--sh-acc),.85);border-radius:20px;background:rgba(var(--sh-acc),.08);pointer-events:none;transition:left .25s ' + EASE + ',top .25s ' + EASE + ',height .25s ' + EASE + ';}',
    '.dt-editing .sh-root .sh-fmv,.sh-root.sh-edit-layout .sh-fmv{cursor:grab;outline:1px dashed rgba(var(--sh-acc),0);outline-offset:4px;transition:outline-color .2s ease;}',
    '.dt-editing .sh-root .sh-fmv:hover,.sh-root.sh-edit-layout .sh-fmv:hover{outline-color:rgba(var(--sh-acc),.9);}',
    '.sh-root .sh-fmv.sh-dragging{cursor:grabbing;outline:1px solid rgb(var(--sh-acc))!important;}',
    '.sh-root .sh-fmv.sh-droptarget{outline:2px solid rgb(var(--sh-acc))!important;}',

    /* ── 차트 바꾸기 ── */
    '.sh-root .sh-chost{position:absolute;z-index:6;pointer-events:none;}',
    '.sh-root .sh-chost > *{pointer-events:auto;}',
    '.sh-root.sh-live .sh-chost{transition:left .55s ' + EASE + ',top .55s ' + EASE + ',width .55s ' + EASE + ',height .55s ' + EASE + ';}',
    /* 단추는 판 테두리 위에 걸친다 — 차트 제목 줄의 값과 겹치지 않게 */
    '.sh-root .sh-chartbtn{position:absolute;top:-12px;right:22px;z-index:25;display:none;align-items:center;gap:4px;height:24px;padding:0 10px;border:1px solid rgb(var(--sh-acc));border-radius:12px;'
      + 'background:linear-gradient(102deg,#370daf,#3e49bb 50%,#5d36e0);color:#fff;font:600 12px/22px Pretendard,system-ui,sans-serif;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.4);white-space:nowrap;}',
    '.sh-root .sh-chartbtn:hover{filter:brightness(1.2);box-shadow:0 0 12px rgba(var(--sh-acc2),.7);}',
    '.dt-editing .sh-root .sh-chartbtn,.dt-content-editing .sh-root .sh-chartbtn,.sh-root.sh-edit-layout .sh-chartbtn{display:inline-flex;}',
    '.sh-root .sh-chartmenu{position:absolute;top:16px;right:22px;z-index:40;min-width:216px;padding:6px;border:1px solid #8fb1ff;border-radius:10px;'
      + 'background:rgba(1,13,53,.97);box-shadow:0 12px 28px rgba(0,0,0,.55);font:500 12px/1.35 Pretendard,system-ui,sans-serif;color:#cad1e2;'
      + 'opacity:0;translate:0 -6px;pointer-events:none!important;transition:opacity .18s ease,translate .18s ease;}',
    '.sh-root .sh-chartmenu.open{opacity:1;translate:0 0;pointer-events:auto!important;}',
    '.sh-root .sh-chartmenu .hd{padding:4px 8px 6px;font-size:11px;color:#8693b3;}',
    '.sh-root .sh-chartmenu button{display:flex;align-items:center;gap:8px;width:100%;padding:7px 8px;border:0;border-radius:6px;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer;}',
    '.sh-root .sh-chartmenu button:hover{background:rgba(var(--sh-acc),.14);color:#fff;}',
    '.sh-root .sh-chartmenu button.cur{background:rgba(87,104,217,.4);color:#fff;}',
    '.sh-root .sh-chartmenu .ic{width:18px;height:14px;flex:none;}',
    '.sh-root .sh-chartmenu .rec{margin-left:auto;padding:1px 6px;border-radius:8px;background:#00baff;color:#001227;font-size:10px;font-weight:700;}',
    '.sh-root .sh-chartmenu .sep{height:1px;margin:4px 2px;background:rgba(202,209,226,.16);}',
    '.sh-root .sh-swapped > :not(.sh-chost):not([data-name="Background"]){visibility:hidden;}',
    '.sh-root .sh-chart{position:absolute;inset:0;display:flex;flex-direction:column;padding:18px 26px 16px;border-radius:inherit;'
      + 'font:500 12px/1.2 Pretendard,system-ui,sans-serif;color:#cad1e2;overflow:hidden;animation:shChartIn .45s ' + EASE + ';}',
    '.sh-root .sh-chart.sh-solid{background:linear-gradient(180deg,rgba(30,41,78,.98),rgba(24,33,64,.98));border:1px solid rgba(143,177,255,.35);border-radius:20px;}',
    '@keyframes shChartIn{from{opacity:0;scale:.98}to{opacity:1;scale:1}}',
    '.sh-root .sh-chart .ct{display:flex;align-items:center;gap:8px;font-weight:500;font-size:18px;color:#c9def7;white-space:nowrap;}',
    '.sh-root .sh-chart .ct i{display:block;width:7px;height:5px;background:#00d1ff;clip-path:polygon(0 0,100% 0,60% 100%,0 100%);}',
    '.sh-root .sh-chart .ct b{margin-left:auto;font-weight:600;font-size:20px;color:#fff;font-variant-numeric:tabular-nums;}',
    '.sh-root .sh-chart .ct b small{font-size:12px;color:#8693b3;margin-left:3px;font-weight:500;}',
    '.sh-root .sh-chart .lg{display:flex;gap:12px;margin-top:6px;font-size:11px;color:#8693b3;white-space:nowrap;}',
    '.sh-root .sh-chart .lg span{display:inline-flex;align-items:center;gap:5px;}',
    '.sh-root .sh-chart .lg span:before{content:"";width:10px;height:4px;border-radius:2px;background:var(--c);}',
    '.sh-root .sh-chart .pl{position:relative;flex:1;min-height:0;margin-top:10px;}',
    '.sh-root .sh-chart svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;}',
    '.sh-root .sh-chart .ax{fill:#8693b3;font-size:11px;font-family:Pretendard,system-ui,sans-serif;}',
    '.sh-root .sh-chart .gl{stroke:rgba(202,209,226,.12);stroke-width:1;shape-rendering:crispEdges;}',
    '.sh-root .sh-chart .bars{position:absolute;inset:0 0 18px;display:flex;align-items:flex-end;justify-content:space-around;gap:10px;}',
    '.sh-root .sh-chart .bars > div{position:relative;flex:1;max-width:38px;height:100%;display:flex;align-items:flex-end;}',
    '.sh-root .sh-chart .bars i{display:block;width:100%;border-radius:8px 8px 0 0;background:linear-gradient(180deg,var(--c),rgba(126,65,255,.35));'
      + 'box-shadow:0 0 10px rgba(var(--sh-acc3),.3);transition:height .9s ' + EASE + ';}',
    '.sh-root .sh-chart .bars em{position:absolute;left:50%;translate:-50% 0;bottom:calc(var(--h) + 3px);font-style:normal;font-size:11px;color:#fff;white-space:nowrap;transition:bottom .9s ' + EASE + ';}',
    '.sh-root .sh-chart .bars u{position:absolute;left:50%;translate:-50% 0;bottom:-18px;text-decoration:none;font-size:11px;color:#8693b3;white-space:nowrap;}',
    '.sh-root .sh-chart .hb{display:flex;flex-direction:column;justify-content:space-around;height:100%;gap:6px;}',
    '.sh-root .sh-chart .hb > div{display:grid;grid-template-columns:96px 1fr 52px;align-items:center;gap:10px;font-size:12px;}',
    '.sh-root .sh-chart .hb s{position:relative;display:block;height:10px;border-radius:5px;background:rgba(202,209,226,.1);overflow:hidden;text-decoration:none;}',
    '.sh-root .sh-chart .hb s i{position:absolute;inset:0 auto 0 0;border-radius:5px;background:linear-gradient(90deg,#5768d9,var(--c));transition:width .9s ' + EASE + ';}',
    '.sh-root .sh-chart .hb b{text-align:right;color:#fff;font-weight:600;font-variant-numeric:tabular-nums;}',
    '.sh-root .sh-chart .arc{transition:stroke-dasharray .9s ' + EASE + ',stroke-dashoffset .9s ' + EASE + ';}',
    '.sh-root .sh-chart .gv{position:absolute;left:0;right:0;bottom:2px;text-align:center;font-size:26px;font-weight:700;color:#fff;font-variant-numeric:tabular-nums;}',
    '.sh-root .sh-chart .gv small{font-size:13px;color:#8693b3;margin-left:2px;font-weight:500;}',
    '.sh-root .sh-chart .dn{display:flex;align-items:center;gap:22px;height:100%;}',
    '.sh-root .sh-chart .dn .ring{position:relative;height:100%;aspect-ratio:1;flex:none;}',
    '.sh-root .sh-chart .dn .ring b{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:22px;color:#fff;font-weight:700;}',
    '.sh-root .sh-chart .dn .ring b small{font-size:11px;color:#8693b3;font-weight:500;}',
    '.sh-root .sh-chart .dn ul{list-style:none;display:flex;flex-direction:column;gap:7px;font-size:12px;}',
    '.sh-root .sh-chart .dn li{display:flex;align-items:center;gap:8px;white-space:nowrap;min-width:150px;}',
    '.sh-root .sh-chart .dn li:before{content:"";width:9px;height:9px;border-radius:3px;background:var(--c);}',
    '.sh-root .sh-chart .dn li b{margin-left:auto;padding-left:10px;color:#fff;font-variant-numeric:tabular-nums;}',

    /* ══════════ 라이트 테마 — 형상은 그대로, 판 · 글자 색만 다시 ══════════
       원본 다크의 역할별 색을 밝은 판에 맞는 짝으로 옮긴다: 본문 #1d2b4a · 보조 #4a5a78 · 값 파랑 #1b5fd1 · 강조 보라 #5a3fd6.
       짙은 판(칩 · 버튼 · 등록 단추) 위 글자는 흰색을 지킨다. */
    /* 바탕 · 카드 패널 — 다크의 짙은 남색 카드(#1a2541 · 그림자 #081024)는 라이트에서 '흰 카드 + 옅은 선 + 부드러운 그림자'.
       바탕은 옅은 회청 그라디언트, 원본 바탕 사진은 무늬만 아주 옅게 남긴다 */
    /* 강조 · 빛 색(다크 = 네온 하늘) → 라이트 = 차분한 파랑. 호버 빛 · 숫자 반짝임 · 초점 테두리 · 편집 윤곽이 함께 바뀐다 */
    '.sh-root[data-theme="light"]{background:#eef2f8!important;--sh-acc:47,111,224;--sh-acc2:40,70,160;--sh-acc3:27,110,210;}',
    /* 호버 — 다크의 '밝아지며 둘레가 빛나는' 움직임은 흰 판에서 번진 얼룩처럼 보인다 → 라이트는 '살짝 들리며 그림자' */
    '.sh-root[data-theme="light"] [data-name="Time Group"] > [data-name^="Icon/Action/"]:hover,.sh-root[data-theme="light"] [data-name="Close Button"]:hover [data-name^="Icon/Action/"],'
      + '.sh-root[data-theme="light"] [data-name="Time"]:hover [data-name="Icon/Action/Clock"]{filter:drop-shadow(0 2px 4px rgba(40,70,160,.35));}',
    '.sh-root[data-theme="light"] [data-name="Brand"].sh-click:hover{filter:drop-shadow(0 2px 6px rgba(40,70,160,.22));}',
    '.sh-root[data-theme="light"] [data-name^="Button/"]:hover,.sh-root[data-theme="light"] [data-name="Close Button"]:hover{filter:brightness(1.06);box-shadow:0 4px 12px rgba(40,70,160,.25);}',
    '.sh-root[data-theme="light"] [data-name="Input"]:hover{box-shadow:0 0 0 1px #8fa6e6,0 4px 10px rgba(40,70,160,.12);}',
    '.sh-root[data-theme="light"] [data-name="Field/Category"]:hover [data-name="Box"],.sh-root[data-theme="light"] [data-name="Field/Base Date"]:hover [data-name="Input"]{filter:none;box-shadow:0 0 0 1px #7f9de0,0 4px 10px rgba(40,70,160,.15)!important;}',
    '.sh-root[data-theme="light"] [data-name^="Section Label/"]:hover [data-name="Chip"],.sh-root[data-theme="light"] [data-name^="Th/"]:hover [data-name="Chip"],.sh-root[data-theme="light"] [data-name^="Chip/"]:hover{filter:drop-shadow(0 3px 6px rgba(40,70,160,.22));}',
    '.sh-root[data-theme="light"] [data-name^="Metric/"]:hover [data-name="Value Box"]{filter:none;box-shadow:0 4px 12px rgba(27,110,210,.22);}',
    '.sh-root[data-theme="light"] [data-name^="Schedule Card/"]:hover > *{filter:drop-shadow(0 6px 10px rgba(40,70,160,.18));}',
    '.sh-root[data-theme="light"] [data-name="Icon Badge"]:hover,.sh-root[data-theme="light"] [data-name="Category Badge"]:hover > *{filter:drop-shadow(0 6px 10px rgba(40,70,160,.25));}',
    '.sh-root[data-theme="light"] [data-name="Td/Visible"]:hover > *{filter:drop-shadow(0 0 3px rgba(47,111,224,.6));}',
    '.sh-root[data-theme="light"] [data-name="Table/Anomaly Detection"] [data-name^="Row/"]:hover{filter:none;}',
    '.sh-root.shd-root[data-theme="light"] [data-name="Body"] > [data-name^="Row/"]:not(.sh-on):hover > [data-name^="Td/"]{background-color:#eaf1fe!important;}',
    /* 늘 움직이는 빛(방패 · 보안등급 배지) — 라이트는 은은하게 */
    '@keyframes shPulseLt{0%,100%{filter:drop-shadow(0 0 0 rgba(47,111,224,0))}50%{filter:drop-shadow(0 2px 8px rgba(47,111,224,.4))}}',
    '.sh-root[data-theme="light"].sh-live [data-name="Visual"],.sh-root[data-theme="light"].sh-live [data-name="Badge/Threat Level"]{animation-name:shPulseLt;}',
    '.sh-root[data-theme="light"] [data-name^="Screen/"] > [data-name="Background"]{background:linear-gradient(180deg,#f4f7fc 0%,#e9eef7 100%)!important;}',
    '.sh-root[data-theme="light"] [data-name^="Screen/"] > [data-name="Background"] > img{filter:invert(1) hue-rotate(180deg) saturate(.25) brightness(1.1)!important;opacity:.22!important;}',
    '.sh-root[data-theme="light"] .sh-wl > [data-name="Background"]{background:#ffffff!important;border:1px solid #e0e7f3!important;'
      + 'box-shadow:0 1px 2px rgba(22,40,90,.05),0 6px 20px rgba(22,40,90,.07)!important;}',
    '.sh-root[data-theme="light"] .sh-chart.sh-solid{background:#ffffff;border-color:#e0e7f3;}',
    /* 입력 · 이상징후 화면의 표 — 흰 칸 · 옅은 줄무늬 · 옅은 칸 선(머리줄 색 띠는 원본 색 그대로), 고른 줄은 옅은 파랑 */
    '.sh-root[data-theme="light"] .shi-root [data-name="Body"] > [data-name^="Row/"] > [data-name^="Td/"],.sh-root.shi-root[data-theme="light"] [data-name="Body"] > [data-name^="Row/"] > [data-name^="Td/"],'
      + '.sh-root.shd-root[data-theme="light"] [data-name="Body"] > [data-name^="Row/"] > [data-name^="Td/"]{background-color:#ffffff!important;background-image:none!important;border-color:#e3e9f3!important;}',
    '.sh-root.shi-root[data-theme="light"] [data-name="Body"] > [data-name^="Row/"]:nth-child(even) > [data-name^="Td/"],'
      + '.sh-root.shd-root[data-theme="light"] [data-name="Body"] > [data-name^="Row/"]:nth-child(even) > [data-name^="Td/"]{background-color:#f3f6fc!important;}',
    '.sh-root.shd-root[data-theme="light"] [data-name="Body"] > [data-name^="Row/"].sh-on > [data-name^="Td/"]{background-color:#dbe7fd!important;}',
    '.sh-root.shi-root[data-theme="light"] [data-name="Body"] [data-name^="Td/"] p,.sh-root.shd-root[data-theme="light"] [data-name="Body"] [data-name^="Td/"] p{color:#3a4a6c!important;}',
    '.sh-root.shd-root[data-theme="light"] [data-name="Body"] > [data-name^="Row/"].sh-on [data-name^="Td/"] p{color:#123a8a!important;}',
    '.sh-root.shd-root[data-theme="light"] [data-name="Td/Visible"] [data-name="Checkbox"]{border-color:#9aa8c6!important;background:#fff!important;}',
    /* KPI 색 타일 — 원본은 반투명 그라디언트라 흰 카드 위에서 옅게 바랜다. 한 톤 짙게 눌러 흰 숫자가 산다 */
    /* KPI 타일 — 원본은 반투명 그라디언트(다크 판 위에서 진해진다). 흰 카드 위에서는 같은 색상 계열의 불투명 그라디언트로,
       흰 숫자가 4.5:1 이상 나오는 명도까지(파랑 = 전월 누적 · 현장 실태점검, 보라 = 당월 누적 · 금일 현황 · 정보보호 교육) */
    '.sh-root[data-theme="light"] [data-name^="KPI/"] > [data-name="Background"]{background-image:linear-gradient(to top,#3a2c9a,#7546dc)!important;}',
    '.sh-root[data-theme="light"] [data-name="KPI/Last Month"] > [data-name="Background"],.sh-root[data-theme="light"] [data-name="KPI/On-site Inspection"] > [data-name="Background"]{background-image:linear-gradient(to top,#3b67d4,#3346b6)!important;}',
    /* 유리 테두리는 뒤를 흐려 비추는데, 라이트에서는 뒤가 흰 카드라 타일이 하얗게 뜬다 — 유리를 옅게 */
    '.sh-root[data-theme="light"] [data-name^="KPI/"] > [data-name="Border"]{opacity:.35;}',
    /* 빈 요일 배지(목 · 금) — 옅은 회청 배지 위 글자는 짙은 회청 */
    '.sh-root[data-theme="light"] [data-name^="Schedule Card/"][data-name$="(Empty)"] [data-name="Day Badge"] p{color:#3f4b68!important;}',
    '.sh-root[data-theme="light"] [data-name^="KPI/"] [data-name="Measurement"] [data-name="Value"]{text-shadow:0 1px 3px rgba(20,30,90,.45);}',
    '.sh-root[data-theme="light"] [data-name="Header Row"] > [data-name^="Th/"]{border-color:rgba(255,255,255,.25)!important;}',
    '.sh-root[data-theme="light"] .sh-gtext{background-image:linear-gradient(180deg,#1f3f86,#3a62b8)!important;}',
    '.sh-root[data-theme="light"] [data-name="Page Title"]{background-image:linear-gradient(0deg,#1d3a78,#3b5fae)!important;}',
    '.sh-root[data-theme="light"] [data-name^="Menu Item/"]:not(.sh-cur){color:#3a4a6c!important;}',
    '.sh-root[data-theme="light"] [data-name^="Menu Item/"]:not(.sh-cur):hover{color:#1b5fd1!important;text-shadow:none;}',
    '.sh-root[data-theme="light"] [data-name="Toolbar"] p{color:#2c3c5e!important;}',
    '.sh-root[data-theme="light"] [data-name="Product Title"]{color:#16233b!important;}',
    /* 보안 현황 표 줄 */
    '.sh-root[data-theme="light"] [data-name^="Row/"] > [data-name="Row BG"]{background:linear-gradient(90deg,#dfe7f7,#e8edfa)!important;}',
    '.sh-root[data-theme="light"] [data-name^="Row/"] > [data-name="Row BG"]::after{background:linear-gradient(90deg,#9fb4e0,#b8c5ea)!important;}',
    '.sh-root[data-theme="light"] [data-name^="Row/"] > [data-name="Label"]{color:#24324f!important;}',
    '.sh-root[data-theme="light"] [data-name^="Row/"] [data-name="Cells BG"],.sh-root[data-theme="light"] [data-name^="Row/"] [data-name^="Cell BG/"]{background:#f7f9fe!important;opacity:1!important;box-shadow:inset 0 0 0 1px #c9d4ee;}',
    '.sh-root[data-theme="light"] [data-name^="Row/"] [data-name^="Td/"]{text-shadow:none;}',
    '.sh-root[data-theme="light"] [data-name^="Row/"]:hover [data-name="Cells BG"],.sh-root[data-theme="light"] [data-name^="Row/"]:hover [data-name^="Cell BG/"]{filter:brightness(.96);}',
    '.sh-root[data-theme="light"] [data-name^="Row/"]:hover > [data-name="Row BG"]{filter:brightness(.97);box-shadow:0 0 0 1px #7f9de0;}',
    /* KPI 카드 */
    '.sh-root[data-theme="light"] [data-name^="KPI/"] [data-name="Unit"]{color:#4a5a78!important;}',
    /* KPI — 색 타일 · 유리 테두리 · 흰 숫자는 원본 그대로(생성기 LIGHT_KEEP), 이름표만 흰 이름표 + 짙은 글자 */
    '.sh-root[data-theme="light"] [data-name^="KPI/"] [data-name="Caption"] [data-name="Label"],.sh-root[data-theme="light"] [data-name^="KPI/"] [data-name="Caption"] p{color:#24324f!important;}',
    /* 지표 칩 — 원본의 하늘 · 보라 · 흰 값을 밝은 칩 위에서 읽히는 짙은 짝으로 */
    '.sh-root[data-theme="light"] [data-name="Metric/Malware"] [data-name="Value Box"] p{color:#0a5fc0!important;}',
    '.sh-root[data-theme="light"] [data-name="Metric/APT Attack"] [data-name="Value Box"] p{color:#4733c2!important;}',
    '.sh-root[data-theme="light"] [data-name="Metric/Intrusion"] [data-name="Value Box"] p{color:#16233b!important;}',
    /* 시나리오 막대 — 고른 시나리오 글자(원본 흰색)는 밝은 하이라이트 위라 짙은 보라로 */
    '.sh-root[data-theme="light"] [data-name^="Bar Group/"].sh-sel > [data-name="Label"],.sh-root[data-theme="light"] [data-name^="Bar Group/"].sh-sel [data-name="Value"]{color:#3a2ca8!important;}',
    /* 심의 배지 — 받침(짙은 원기둥 그림)은 두 테마 모두 짙다. 글자는 흰색을 지키고, 받침 밖으로 나온 아랫줄도
       밝은 바탕에서 읽히게 짙은 테두리 빛을 두른다 */
    '.sh-root[data-theme="light"] [data-name="Category Badge"] p{color:#fff!important;background:none!important;-webkit-text-fill-color:#fff;text-shadow:0 0 1px #16233b,0 0 2px #16233b,0 0 3px #16233b,0 1px 5px rgba(22,35,59,.95);}',
    /* 빈 일정(목 · 금)은 원본도 흐린 '비어 있음' 표시 — 라이트에서도 흐리되 읽히게 */
    '.sh-root[data-theme="light"] [data-name^="Schedule Card/"][data-name$="(Empty)"] [data-name="Date"]{color:#5c6987!important;}',
    /* 두 줄 심의 이름표(정보보호 / 내부통제 검토) — 윗줄은 짙은 받침 위, 받침 아래로 나온 아랫줄은 흰 카드 위다 */
    '.sh-root[data-theme="light"] [data-name="Category Badge"] p.sh-offplate{color:#1d2b4a!important;-webkit-text-fill-color:#1d2b4a!important;text-shadow:none!important;}',
    /* 등록 단추 — 밝은 판에서 그라디언트 밝은 쪽이 흰 글자를 묻지 않게 한 톤 짙게 */
    '.sh-root[data-theme="light"] .sha-root [data-name="Button/Register"],.sh-root .sha-root[data-theme="light"] [data-name="Button/Register"]{background-image:linear-gradient(102.4deg,#4a1fc4 0%,#3e49bb 50.4%,#5d36e0 95.2%)!important;}',
    '.sh-root[data-theme="light"] .sha-root [data-name="Button/Register"] p,.sh-root .sha-root[data-theme="light"] [data-name="Button/Register"] p,'
      + '.sh-root[data-theme="light"] .sha-root [data-name="Title Bar"] p,.sh-root .sha-root[data-theme="light"] [data-name="Title Bar"] p{color:#fff!important;}',
    /* 지표 칩 */
    '.sh-root[data-theme="light"] [data-name^="Metric/"] > [data-name="Label"]{color:#4a5a78!important;}',
    '.sh-root[data-theme="light"] [data-name^="Metric/"] [data-name="Unit"]{color:#4a5a78!important;}',
    /* 소제목 단추 */
    '.sh-root[data-theme="light"] [data-name^="Section Label/"] [data-name="Chip"] p{color:#1d2b4a!important;}',
    /* 일정 카드 */
    '.sh-root[data-theme="light"] [data-name^="Schedule Card/"] [data-name="Event"]{color:#2c3c5e!important;}',
    '.sh-root[data-theme="light"] [data-name^="Schedule Card/"] [data-name="Date"]{color:#1b4fb8!important;}',
    '.sh-root[data-theme="light"] [data-name="Day Badge"] p{color:#fff!important;}',
    /* 막대 차트 */
    '.sh-root[data-theme="light"] [data-name^="Bar Group/"] > [data-name="Label"]{color:#3a4a6c!important;}',
    '.sh-root[data-theme="light"] [data-name^="Bar Group/"] [data-name="Value"]{color:#4a5a78!important;}',
    /* 배지 · 경보 문구 */
    '.sh-root[data-theme="light"] [data-name="Alert Ticker"] [data-name="Message"]{color:#24324f!important;}',
    /* 이상징후 탐지 — 거르기 칸 */
    '.sh-root[data-theme="light"] [data-name="Field/Category"] [data-name="Box"],.sh-root[data-theme="light"] [data-name="Field/Base Date"] [data-name="Input"]{background:#fff!important;box-shadow:inset 0 0 0 1px #b7c4e3;}',
    '.sh-root[data-theme="light"] [data-name="Field/Category"] [data-name="Value"],.sh-root[data-theme="light"] [data-name="Field/Base Date"] [data-name="Value"]{color:#1d2b4a!important;}',
    '.sh-root[data-theme="light"] [data-name^="Field/"] > [data-name="Label"]{color:#2c4a8a!important;}',
    /* 입력 화면 · 이상징후 표 머리 글자는 짙은 판 위라 흰색 그대로 */
    '.sh-root[data-theme="light"] [data-name="Button/Input"] p{color:#fff!important;}',
    '.sh-root[data-theme="light"] [data-name="Button/Input"]{background-image:linear-gradient(137.9deg,rgba(255,255,255,.12) 47.7%,rgba(110,168,208,0) 47.7%),linear-gradient(90deg,#2b4a8a,#2b4a8a)!important;}',
    /* 이상징후 탐지 등록 창 */
    '.sh-root[data-theme="light"] .sha-root [data-name="Body"],.sh-root .sha-root[data-theme="light"] [data-name="Body"]{background:#f3f6fd!important;}',
    '.sh-root[data-theme="light"] .sha-root [data-name="Label Box"],.sh-root .sha-root[data-theme="light"] [data-name="Label Box"]{background-image:linear-gradient(130.4deg,rgba(255,255,255,.5) 50.7%,rgba(255,255,255,0) 50.7%),linear-gradient(90deg,#dfe6f6,#dfe6f6)!important;border-color:#9aa5f0!important;}',
    '.sh-root[data-theme="light"] .sha-root [data-name="Label Box"] p,.sh-root .sha-root[data-theme="light"] [data-name="Label Box"] p{color:#2c3c66!important;}',
    '.sh-root[data-theme="light"] .sha-root [data-name="Input"],.sh-root .sha-root[data-theme="light"] [data-name="Input"]{background:#fff!important;}',
    '.sh-root[data-theme="light"] .sha-root [data-name="Input"] p,.sh-root .sha-root[data-theme="light"] [data-name="Input"] p{color:#1d2b4a!important;}',
    '.sh-root[data-theme="light"] .sha-root [data-name="Button/Reset"],.sh-root .sha-root[data-theme="light"] [data-name="Button/Reset"]{background-image:linear-gradient(141.8deg,rgba(255,255,255,.4) 47.7%,rgba(110,168,208,0) 47.7%),linear-gradient(90deg,#d5ddef,#d5ddef)!important;}',
    '.sh-root[data-theme="light"] .sha-root [data-name="Button/Reset"] p,.sh-root .sha-root[data-theme="light"] [data-name="Button/Reset"] p{color:#2c3c66!important;}',
    '.sh-root[data-theme="light"] .sha-root [data-name="Icon/Field/Calendar"] img,.sh-root .sha-root[data-theme="light"] [data-name="Icon/Field/Calendar"] img{filter:brightness(.35) sepia(1) hue-rotate(185deg) saturate(3);}',
    /* 차트 */
    '.sh-root[data-theme="light"] .sh-chart{color:#2c3c5e;}',
    '.sh-root[data-theme="light"] .sh-chart.sh-solid{background:linear-gradient(180deg,#f7f9fe,#eef2fb);border-color:#b9c6ea;}',
    '.sh-root[data-theme="light"] .sh-chart .ct{color:#1f3f86;}',
    '.sh-root[data-theme="light"] .sh-chart .ct b,.sh-root[data-theme="light"] .sh-chart .gv,.sh-root[data-theme="light"] .sh-chart .dn .ring b,'
      + '.sh-root[data-theme="light"] .sh-chart .hb b,.sh-root[data-theme="light"] .sh-chart .dn li b,.sh-root[data-theme="light"] .sh-chart .bars em{color:#16233b;}',
    '.sh-root[data-theme="light"] .sh-chart .ax{fill:#5b6781;}',
    '.sh-root[data-theme="light"] .sh-chart .gl{stroke:rgba(40,60,110,.14);}',
    '.sh-root[data-theme="light"] .sh-chart .bars u,.sh-root[data-theme="light"] .sh-chart .lg,.sh-root[data-theme="light"] .sh-chart .ct b small,.sh-root[data-theme="light"] .sh-chart .gv small{color:#5b6781;}',
    '.sh-root[data-theme="light"] .sh-chart .hb s{background:rgba(40,60,110,.1);}',
    '.sh-root[data-theme="light"] .sh-chartmenu{background:#fff;color:#24324f;border-color:#7f9de0;box-shadow:0 12px 28px rgba(30,50,100,.25);}',
    '.sh-root[data-theme="light"] .sh-chartmenu button:hover{background:rgba(27,95,209,.1);color:#16233b;}',
    '.sh-root[data-theme="light"] .sh-chartmenu button.cur{background:rgba(87,104,217,.18);color:#16233b;}',
  ].join('\n');
  /* 에셋 라이브러리 등록 목록 생성기(src/shinhan-assets/_gen/mk-assets.js)가 라이트 규칙을 옮겨 쓴다 — 고치면 생성기도 다시 돌릴 것 */
  window.SHINHAN_LIVE_CSS = CSS;

  function injectStyle() {
    var st = document.getElementById(STYLE_ID);
    if (st) return;
    st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ══════════════════ 도구 ══════════════════ */
  function all(root, sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }
  function one(root, sel) { return root.querySelector(sel); }
  function editing() { return !!document.querySelector('.dtstage.dt-content-editing, .dtstage.dt-editing, .sh-root.sh-edit-layout'); }
  function layoutEditing(root) { return !!(root.closest('.dt-editing') || root.classList.contains('sh-edit-layout')); }
  function idle() { return typeof window.__wembIdle === 'function' ? window.__wembIdle() : document.hidden; }
  function load(k) { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function nameOf(el) { return (el && el.getAttribute && el.getAttribute('data-name')) || ''; }
  function kids(el, sel) { return Array.prototype.filter.call(el.children, function (c) { return !sel || c.matches(sel); }); }

  function clickable(el, title, fn) {
    if (!el) return;
    el.classList.add('sh-click');
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    if (title) el.setAttribute('title', title);
    if (fn) {
      el.addEventListener('click', function (e) { if (editing()) return; fn(e); });
      el.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && !editing()) { e.preventDefault(); fn(e); } });
    }
  }
  /* 라이브가 쓴 값과 지금 글자가 다르면 사람이 고친 것 — 덮지 않는다 */
  function claimed(p) { return p.__shLast != null && p.textContent !== p.__shLast; }
  function write(p, s, flash) {
    if (!p || claimed(p)) return;
    if (p.textContent === s) { p.__shLast = s; return; }
    p.textContent = s;
    p.__shLast = s;
    p.classList.add('sh-num');
    if (flash) { p.classList.remove('sh-tick'); void p.offsetWidth; p.classList.add('sh-tick'); }
  }
  function tween(p, from, to, fmt, dur) {
    if (!p || claimed(p)) return;
    var t0 = performance.now(); dur = dur || 900;
    if (p.__shTw) cancelAnimationFrame(p.__shTw);
    (function step(t) {
      if (claimed(p)) return;
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      write(p, fmt(from + (to - from) * e), false);
      if (k < 1) p.__shTw = requestAnimationFrame(step);
      else write(p, fmt(to), false);
    })(t0);
  }

  function sceneOf(root) {
    if (root.classList.contains('shd-root')) return 'anomaly';
    if (root.classList.contains('shi-root')) return 'entry';
    var pop = Array.prototype.filter.call(root.querySelectorAll('.sh-pop'), function (p) { return !p.closest('.sh-ovl'); })[0];
    return pop ? 'register' : 'overview';
  }
  function frameOf(root) { return root.querySelector(':scope > [data-name^="Screen/"]'); }
  /* 다른 장면으로 — 스튜디오에서는 같은 프로젝트의 형제 화면으로(js/templates/shinhan.js), 낱장 미리보기에서는 그 페이지로 */
  var PAGE = { overview: 'overview', register: 'register', entry: 'entry', anomaly: 'anomaly' };
  function goScene(to) {
    if (typeof window.__gotoShinhanScene === 'function') { window.__gotoShinhanScene(to); return; }
    location.href = './' + PAGE[to] + '.html' + location.search;
  }

  /* ══════════════════ 1. 반응형 ══════════════════ */
  /* 보안 현황 위젯(Figma GROUP · display:contents)을 화면 크기 투명 층으로 세운다 — 안쪽 좌표가 그대로라 그림은 같고,
     translate 하나로 위젯 통째 옮길 수 있다(반응형 · 열 재배치 · 패널 옮기기). */
  function liftLayer(el) {
    el.classList.add('sh-wl');
    return el;
  }
  function widgetInfo(w) {
    var bg = kids(w, '[data-name="Background"]')[0];
    var r = { el: w, name: nameOf(w), bg: bg };
    if (bg) { r.left = bg.offsetLeft; r.top = bg.offsetTop; r.w = bg.offsetWidth; r.h = bg.offsetHeight; }
    return r;
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
    var sc = sceneOf(root);
    var bg = kids(frame, '[data-name="Background"]')[0];
    if (bg) { var im = bg.querySelector('img'); if (im) im.classList.add('sh-bgimg'); }
    var header = kids(frame, '[data-name="Header"]')[0];
    var deco = header && one(header, '[data-name="Header Deco"]');
    var bar = header && one(header, '[data-name="Header Bar"]');
    if (deco) { liftLayer(deco); }
    if (bar) bar.classList.add('sh-blk');
    var barW = bar ? bar.offsetWidth : 0;
    /* 생성기가 가운데 정렬(translateX(-50%))을 반 픽셀 방지용 고정 margin 으로 바꿔 두었다(LS README ⑭).
       그러면 폭을 늘려도 왼쪽 끝이 그대로라 옮길 필요가 없다 — transform 으로 남아 있을 때만 절반을 민다. */
    var barShift = bar && parseFloat(getComputedStyle(bar).marginLeft) ? 0 : 0.5;

    /* 보안 현황 — 두 열의 위젯 */
    st.cols = null;
    if (sc === 'overview' || sc === 'register') {
      var cols = { L: [], R: [] };
      ['L', 'R'].forEach(function (c) {
        var g = kids(frame, '[data-name="' + (c === 'L' ? 'Left Column' : 'Right Column') + '"]')[0];
        if (!g) return;
        kids(g, '[data-name^="Widget/"]').forEach(function (w) { liftLayer(w); w.classList.add('sh-mv'); cols[c].push(widgetInfo(w)); });
        /* 원래 쌓인 차례(위→아래) */
        cols[c].sort(function (a, b) { return a.top - b.top; });
      });
      st.widgets = cols.L.concat(cols.R);
      st.byName = {};
      st.widgets.forEach(function (i) { st.byName[i.name] = i; });
      st.cols0 = { L: cols.L.map(function (i) { return i.name; }), R: cols.R.map(function (i) { return i.name; }) };
      var saved = (load(K_LAYOUT)[sc] || {}).cols;
      st.cols = valid(saved) ? saved : JSON.parse(JSON.stringify(st.cols0));
    }
    function valid(c) {
      if (!c || !Array.isArray(c.L) || !Array.isArray(c.R)) return false;
      var names = c.L.concat(c.R);
      return names.length === st.widgets.length && st.widgets.every(function (i) { return names.indexOf(i.name) >= 0; });
    }
    /* 그 밖의 블록 — 입력 화면 Content · 이상징후 검색줄 · 표 · 등록 창 */
    var content = kids(frame, '[data-name="Content"]')[0];
    if (content) content.classList.add('sh-blk');
    var search = kids(frame, '[data-name="Search Bar"]')[0];
    if (search) liftLayer(search);
    var table = kids(frame, '[data-name^="Table/"]')[0];
    if (table) table.classList.add('sh-blk');
    var dim = kids(frame, '.sh-dim')[0];
    var mount = kids(frame, '.sh-popmount')[0];
    if (mount) mount.classList.add('sh-blk');

    function layout() {
      var W = root.clientWidth, H = root.clientHeight;
      if (!W || !H) return;
      var S = Math.min(W / BASE_W, H / BASE_H);
      var VW = W / S, VH = H / S, exW = Math.max(0, VW - BASE_W), exH = Math.max(0, VH - BASE_H);
      st.S = S; st.exW = exW; st.exH = exH; st.VW = VW; st.VH = VH;
      frame.style.transform = 'scale(' + S + ')';
      if (bg) {
        var s = bg.style;
        s.left = '0px'; s.top = '0px'; s.margin = '0'; s.width = VW + 'px'; s.height = VH + 'px'; s.transform = 'none';
      }
      if (deco) setT(deco, exW / 2, 0);
      if (bar) { bar.style.width = (barW + exW) + 'px'; setT(bar, exW * barShift, 0); }
      if (content) setT(content, exW / 2, exH / 2 > 0 ? 0 : 0);
      if (search) setT(search, exW, 0);
      if (table) {
        setT(table, exW / 2, 0);
        /* 남는 높이는 표 줄이 나눠 갖는다 — 표 아래가 비지 않게(정확히 16:9 면 원본 30px 그대로) */
        if (!st.rows0) st.rows0 = all(table, '[data-name="Body"] > *').length || 1;
        table.style.setProperty('--sh-rowh', (30 + exH / st.rows0).toFixed(2) + 'px');
      }
      if (dim) { dim.style.width = VW + 'px'; dim.style.height = VH + 'px'; }
      if (mount) setT(mount, exW / 2, exH / 2);
      if (st.ovl) placeOverlay(st);
      if (st.cols) layoutCols(st);
      if (st.onLayout) st.onLayout();
    }
    var rsT = 0;
    function relayout() {
      root.classList.add('sh-resizing');
      layout();
      clearTimeout(rsT);
      rsT = setTimeout(function () { root.classList.remove('sh-resizing'); }, 140);
    }
    layout();
    st.relayout = relayout;
    st.layout = layout;
    if (window.ResizeObserver) {
      st.ro = new ResizeObserver(relayout);
      st.ro.observe(root);
    } else {
      st.onResize = relayout;
      window.addEventListener('resize', relayout);
    }
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('sh-live'); }); });
  }
  function setT(el, x, y) {
    el.style.setProperty('--sh-tx', x.toFixed(2) + 'px');
    el.style.setProperty('--sh-ty', y.toFixed(2) + 'px');
  }
  /* 두 열 쌓기 — 위젯 판(Background)이 남는 높이를 나눠 갖고, 내용은 판 가운데에 선다.
     열을 옮긴 위젯은 그 열의 x 로, 차례대로 14px 간격으로 쌓인다(빈틈 없음). */
  function layoutCols(st) {
    var exW = st.exW || 0, exH = st.exH || 0;
    ['L', 'R'].forEach(function (c) {
      var list = st.cols[c].map(function (n) { return st.byName[n]; }).filter(Boolean);
      if (!list.length) return;
      var total = list.reduce(function (s, i) { return s + i.h; }, 0) + COL_GAP * (list.length - 1);
      var share = Math.max(0, (COL_H + exH - total) / list.length);
      var x0 = COL_X[c] + (c === 'R' ? exW / 2 : 0);
      var y = COL_TOP;
      list.forEach(function (i) {
        var tx = x0 - i.left + exW / 4, ty = y - i.top + share / 2;
        i.col = c; i.slotY = y; i.slotH = i.h + share;
        setT(i.el, tx, ty);
        i.tx = tx; i.ty = ty;
        if (i.bg) {
          var s = i.bg.style;
          s.right = 'auto'; s.bottom = 'auto'; s.inset = '';
          s.left = (i.left - exW / 4) + 'px';
          s.top = (i.top - share / 2) + 'px';
          s.width = (i.w + exW / 2) + 'px';
          s.height = (i.h + share) + 'px';
        }
        if (i.chost) placeHost(i);
        y += i.h + share + COL_GAP;
      });
    });
  }

  /* ══════════════════ 2. 시계 · 최근 날짜 ══════════════════ */
  var WD_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var WD_KO = ['일', '월', '화', '수', '목', '금', '토'];
  var MON_EN = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  function ymd(d, sep) { return d.getFullYear() + sep + p2(d.getMonth() + 1) + sep + p2(d.getDate()); }
  function installClock(root, st) {
    var tb = one(root, '[data-name="Toolbar"]');
    if (!tb) return;
    var dp = kids(tb, 'p')[0], tp = one(tb, '[data-name="Time"] p');
    function tick() {
      var d = new Date();
      if (dp) write(dp, ymd(d, '/') + ' ' + WD_EN[d.getDay()]);          /* 원본 서식 '2026/10/29 Thu' */
      if (tp) write(tp, p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds()));
    }
    tick();
    st.timers.push(setInterval(function () { if (!editing()) tick(); }, 1000));
  }
  /* 화면을 열 때마다 '최근' — 시안에 박힌 날짜는 만든 날에 멈춰 있어 오래된 스크린샷처럼 보인다.
     읽은 모양(구분자 · 자릿수 · 요일 표기) 그대로 다시 쓴다. */
  function installRecent(root, st) {
    var now = new Date();
    /* 트래픽 차트의 날짜 칩 'THU OCT 29' · 연도 '2026' */
    var df = one(root, '[data-name="Date Filter"] [data-name="Date"]');
    if (df) write(df, WD_EN[now.getDay()].toUpperCase() + ' ' + MON_EN[now.getMonth()] + ' ' + now.getDate());
    var yr = one(root, '[data-name="Date Filter"] [data-name="Chip/Year"] p');
    if (yr) write(yr, String(now.getFullYear()));
    /* 경보 공지 — '(공지일시: 2026.10.27(화))' 는 이틀 전 */
    var msg = one(root, '[data-name="Alert Ticker"] [data-name="Message"]');
    if (msg) {
      var d2 = new Date(now.getTime() - 2 * 86400000);
      var s = msg.textContent.replace(/\d{4}\.\d{1,2}\.\d{1,2}\([^)]\)/, ymd(d2, '.') + '(' + WD_KO[d2.getDay()] + ')');
      write(msg, s);
    }
    /* 주요 일정 — 이번 주 월~금 */
    var mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    all(root, '[data-name^="Schedule Card/"]').forEach(function (card, i) {
      var p = one(card, '[data-name="Date"]');
      var d = new Date(mon); d.setDate(mon.getDate() + i);
      if (p) write(p, d.getDate() + ' 일');
    });
    /* 이상징후 탐지 — 기준일자 칸 · 거르기 기준일자 */
    all(root, '[data-name="Td/Base Date"] [data-name="Value"]').forEach(function (p) { write(p, ymd(now, '-')); });
    /* 기준일자 칸 — 이상징후 거르기는 '2026-10-29', 등록 창은 '2026년 10월 29일' */
    all(root, '[data-name="Field/Base Date"] [data-name="Value"]').forEach(function (p) {
      if (/년/.test(p.textContent)) write(p, now.getFullYear() + '년 ' + (now.getMonth() + 1) + '월 ' + now.getDate() + '일');
      else write(p, ymd(now, '-'));
    });
    /* 입력 화면 — 기준 월 */
    all(root, '[data-name="Td/Base Month"] [data-name="Value"]').forEach(function (p) { write(p, now.getFullYear() + '-' + p2(now.getMonth() + 1)); });
  }

  /* ══════════════════ 3. 눌리는 자리 ══════════════════ */
  var MENU_TO = { 'Main': 'overview', 'Anomaly Detection': 'anomaly', 'Security Audit': 'entry', 'Internal Control': 'entry' };
  function installNav(root, st) {
    var sc = sceneOf(root);
    all(root, '[data-name^="Menu Item/"]').forEach(function (m) {
      var key = nameOf(m).replace('Menu Item/', '').replace(' (Selected)', '');
      if (/\(Selected\)/.test(nameOf(m))) m.classList.add('sh-cur');
      if (key === 'Key Schedule') {
        clickable(m, '주요 일정 보기', function () {
          var w = one(root, '[data-name="Widget/Key Schedule"] > [data-name="Background"]');
          if (w) { w.classList.remove('sh-flash'); void w.offsetWidth; w.classList.add('sh-flash'); }
        });
        return;
      }
      var to = MENU_TO[key];
      if (!to) return;
      clickable(m, m.textContent.trim(), function () { if (to !== sc) goScene(to); });
    });
    /* 브랜드 — 하위 화면에서는 보안 현황(메인)으로 */
    if (sc !== 'overview') clickable(one(root, '[data-name="Brand"]'), '보안 현황(메인)으로', function () { goScene('overview'); });
    clickable(one(root, '[data-name="Icon/Action/Logout"]'), '로그아웃');
  }

  /* ══════════════════ 4. 라이브 — 보안 현황 ══════════════════ */
  function num(p) { var m = /-?\d+(\.\d+)?/.exec(p ? p.textContent.replace(/,/g, '') : ''); return m ? +m[0] : NaN; }
  function installLive(root, st) {
    var sc = sceneOf(root);
    if (sc !== 'overview' && sc !== 'register') return;
    /* KPI 숫자 — 열 때 0 에서 차오른다 */
    all(root, '[data-name^="KPI/"] [data-name="Measurement"] [data-name="Value"]').forEach(function (p) {
      var v = num(p); if (isNaN(v)) return;
      tween(p, 0, v, function (x) { return String(Math.round(x)); }, 1100);
    });
    /* 시나리오 막대 — 열 때 자라 오르고, 실시간처럼 오르내린다(첫 그림 = 원본) */
    var bars = all(root, '[data-name^="Bar/"]').map(function (b) {
      var fill = one(b, '[data-name="Fill"]'), track = one(b, '[data-name="Track"]'), val = one(b, '[data-name="Value"]');
      if (!fill || !val) return null;
      return { fill: fill, track: track, val: val, v0: num(val), h0: fill.offsetHeight, t0: fill.offsetTop, tH: track ? track.offsetHeight : 112 };
    }).filter(Boolean);
    bars.forEach(function (b) {
      var bottom = b.t0 + b.h0;
      b.bottom = bottom;
      b.fill.style.top = bottom + 'px'; b.fill.style.height = '0px'; b.fill.style.bottom = 'auto';
    });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        bars.forEach(function (b) { b.fill.style.top = b.t0 + 'px'; b.fill.style.height = b.h0 + 'px'; });
      });
    });
    function tickBars() {
      bars.forEach(function (b) {
        if (claimed(b.val)) return;
        var v = clamp(Math.round(b.v0 * (1 + rnd(-0.14, 0.14))), 1, 99);
        var h = clamp(b.h0 * v / b.v0, 4, b.tH - 2);
        b.fill.style.top = (b.bottom - h) + 'px'; b.fill.style.height = h + 'px';
        write(b.val, String(v), true);
      });
    }
    st.timers.push(setInterval(function () { if (!editing() && !idle()) tickBars(); }, 3200));

    /* 시나리오 고르기 — 하이라이트가 그 시나리오로 미끄러지고 글자가 원본 '선택' 색으로 */
    var hl = one(root, '[data-name="Highlight"]');
    var groups = all(root, '[data-name^="Bar Group/"]');
    var selG = groups.filter(function (g) { return /\(Selected\)/.test(nameOf(g)); })[0];
    if (hl && selG && groups.length) {
      var lab0 = one(selG, ':scope > [data-name="Label"]'), other = groups.filter(function (g) { return g !== selG; })[0];
      var labN = other && one(other, ':scope > [data-name="Label"]');
      var cs = getComputedStyle(lab0), cn = labN ? getComputedStyle(labN) : cs;
      var valSel = one(selG, '[data-name="Value"]'), valN = other && one(other, '[data-name="Value"]');
      var vs = valSel ? getComputedStyle(valSel).color : '', vn = valN ? getComputedStyle(valN).color : '';
      var SEL = { c: cs.color, w: cs.fontWeight }, NOR = { c: cn.color, w: cn.fontWeight };
      var cx = function (g) { var lb = one(g, ':scope > [data-name="Label"]'); return lb.offsetLeft + lb.offsetWidth / 2; };
      var hx0 = hl.offsetLeft + hl.offsetWidth / 2;
      var cur = selG;
      var mark = function (g) {
        groups.forEach(function (x) {
          var on = x === g, lb = one(x, ':scope > [data-name="Label"]');
          x.classList.toggle('sh-sel', on);
          if (lb) { lb.style.color = on ? SEL.c : NOR.c; lb.style.fontWeight = on ? SEL.w : NOR.w; }
          all(x, '[data-name="Value"]').forEach(function (v) { v.style.color = on ? vs : vn; });
        });
        hl.style.translate = (cx(g) - hx0).toFixed(1) + 'px 0';
      };
      groups.forEach(function (g) {
        g.addEventListener('mouseenter', function () { if (!editing()) mark(g); });
        clickable(g, nameOf(g).replace('Bar Group/', '').replace(' (Selected)', ''), function () { cur = g; mark(g); });
      });
      var bc = one(root, '[data-name="Bar Chart"]');
      if (bc) bc.addEventListener('mouseleave', function () { mark(cur); });
      mark(cur);
    }

    /* 금일 건수 — 이따금 한 건씩 올라간다(그 줄의 당월 누적도 같이). 'X / Y' 는 앞 숫자만. */
    var counters = [];
    all(root, '[data-name^="Row/"]').forEach(function (r) {
      var today = one(r, '[data-name="Td/Today"]'), month = one(r, '[data-name="Td/This Month"]');
      if (today) counters.push({ p: today, link: month, w: 1 });
    });
    all(root, '[data-name^="Metric/"] [data-name="Value"]').forEach(function (p) { counters.push({ p: p, w: 0.6 }); });
    function bump() {
      var c = counters[Math.floor(Math.random() * counters.length)];
      if (!c || claimed(c.p)) return;
      var t = c.p.textContent;
      if (/\//.test(t)) {
        var parts = t.split('/');
        var a = parseInt(parts[0], 10), b = parseInt(parts[1], 10);
        if (isNaN(a)) return;
        write(c.p, (a + 1) + ' / ' + (isNaN(b) ? parts[1].trim() : b), true);
      } else {
        var v = num(c.p); if (isNaN(v)) return;
        write(c.p, String(v + 1), true);
        if (c.link && !claimed(c.link)) { var m = num(c.link); if (!isNaN(m)) write(c.link, String(m + 1), true); }
      }
    }
    (function loop() {
      var t = setTimeout(function () { if (!editing() && !idle()) bump(); loop(); }, rnd(9000, 16000));
      st.timers.push(t);
    })();

    /* 트래픽 선 — Figma 가 내보낸 선 그림을 인라인으로 바꿔 '흐르게' 한다(그림은 새로 그리지 않는다).
       선(Path)의 모든 점과 표지점(Point)에 y + A·(sin(kx − ωt + φ) − sin(kx + φ)) — t = 0 이면 원본과 한 점도 다르지 않다. */
    all(root, '[data-name^="Line/"]').forEach(function (ln, li) {
      var img = ln.querySelector('img');
      if (!img || !window.fetch) return;
      var src = img.getAttribute('src');
      /* 라이트 사본(-lt.svg · 표지점 속이 밝다)도 같이 심고 테마로 하나만 보인다(유리 그림과 같은 장치) */
      var get = function (u) { return fetch(u).then(function (r) { return r.ok ? r.text() : ''; }).catch(function () { return ''; }); };
      Promise.all([get(src), get(src.replace(/\.svg(\?|$)/, '-lt.svg$1'))]).then(function (txts) {
        if (!root.__sh || !txts[0]) return;
        var A = 3 + li * 0.6, k = 0.011 + li * 0.002, w = 0.0011 + li * 0.00015, ph = li * 1.7;
        var dy = function (x, t) { return A * (Math.sin(k * x - w * t + ph) - Math.sin(k * x + ph)); };
        var parts = [];
        txts.forEach(function (txt, vi) {
          if (!txt) return;
          var holder = document.createElement('div');
          holder.innerHTML = txt;
          var svg = holder.querySelector('svg');
          if (!svg) return;
          /* 같은 그림을 다른 자리에도 심을 수 있어 id 는 새로 짓는다 */
          var tag = 'shl' + li + vi + '-' + Math.floor(Math.random() * 1e6);
          all(svg, '[id]').forEach(function (e) {
            var old = e.id, nid = tag + '-' + old.replace(/[^\w-]/g, '_');
            e.id = nid;
            all(svg, '[filter="url(#' + old + ')"]').forEach(function (x) { x.setAttribute('filter', 'url(#' + nid + ')'); });
          });
          /* ls-inl · data-src — '색 정하기'가 <img> 와 같은 규칙으로 칠한다(js/templates/image.js) */
          svg.setAttribute('class', 'ls-inl ' + (img.getAttribute('class') || ''));
          svg.setAttribute('data-src', src);
          svg.style.cssText = img.style.cssText;
          svg.style.overflow = 'visible';
          if (txts[1]) svg.setAttribute('data-sh-theme', vi ? 'light' : 'dark');
          img.parentNode.insertBefore(svg, img);
          var main = one(svg, '[id$="-Path"] path') || one(svg, 'path');
          var pts = all(svg, '[id*="-Point"]');
          parts.push({
            main: main, d0: main ? main.getAttribute('d') : '', pts: pts,
            cxs: pts.map(function (p) { var m = /M\s*([\d.]+)\s+([\d.]+)/.exec(p.getAttribute('d') || ''); return m ? +m[1] - 3.25 : 0; }),
          });
        });
        if (!parts.length) return;
        img.remove();
        try { window.__applyTplTint && window.__applyTplTint(); } catch (e) { }   /* 바꿔 넣은 그림에도 지금 색을 */
        var t0 = performance.now();
        function frame(t) {
          st.raf[li] = requestAnimationFrame(frame);
          if (idle() || editing()) { t0 += 16; return; }
          var tt = t - t0;
          parts.forEach(function (pa) {
            if (pa.main) {
              var i = 0, x = 0;
              pa.main.setAttribute('d', pa.d0.replace(/(-?\d*\.?\d+(?:e-?\d+)?)/gi, function (n) {
                if (i++ % 2 === 0) { x = +n; return n; }
                return (+n + dy(x, tt)).toFixed(2);
              }));
            }
            pa.pts.forEach(function (p, j) { p.setAttribute('transform', 'translate(0 ' + dy(pa.cxs[j], tt).toFixed(2) + ')'); });
          });
        }
        st.raf[li] = requestAnimationFrame(frame);
      });
    });
  }

  /* ══════════════════ 5. 이상징후 탐지 표 ══════════════════ */
  var CATS = ['전체', '정보유출', '개인정보', '접근통제', '내부통제', '부정사용', '시스템'];
  function installAnomaly(root, st) {
    var table = one(root, '[data-name="Table/Anomaly Detection"]');
    if (!table) return;
    var rows = all(table, '[data-name="Body"] > [data-name^="Row/"]');
    if (!rows.length) return;
    var selRow = rows.filter(function (r) { return /\(Selected\)/.test(nameOf(r)); })[0];
    /* 원본에 그려진 두 모습(고른 줄 · 보통 줄 짝/홀)을 **클래스째** 옮겨 쓴다 — 색을 인라인으로 굳히면
       테마를 바꿨을 때 다크 색이 남는다. 칸 · 글자의 생성 클래스(다크 · 라이트 규칙이 함께 걸려 있다)를 바꿔 끼운다. */
    var classesOf = function (r) {
      return kids(r).map(function (c) { var p = c.querySelector('p'); return { c: c.className, p: p ? p.className : null }; });
    };
    var SEL = selRow ? classesOf(selRow) : null;
    var NORM = [classesOf(rows[0]), classesOf(rows[1] || rows[0])];   /* 짝 · 홀 */
    var box = function (r) { return one(r, '[data-name="Td/Visible"]'); };
    var ON = selRow ? box(selRow).innerHTML : '', OFF = box(rows[0]).innerHTML;
    function paint(r, on) {
      var i = rows.indexOf(r), S = on ? SEL : NORM[i % 2];
      r.classList.toggle('sh-on', !!on);
      if (!S) return;
      kids(r).forEach(function (c, k) {
        if (!S[k]) return;
        var keep = Array.prototype.filter.call(c.classList, function (x) { return /^sh-/.test(x); });
        c.className = S[k].c; keep.forEach(function (x) { c.classList.add(x); });
        var p = c.querySelector('p'); if (p && S[k].p) { var kp = Array.prototype.filter.call(p.classList, function (x) { return /^sh-/.test(x); }); p.className = S[k].p; kp.forEach(function (x) { p.classList.add(x); }); }
      });
    }
    if (selRow) selRow.classList.add('sh-on');
    function check(r, on) { var b = box(r); if (b) b.innerHTML = on ? ON : OFF; r.__on = on; }
    rows.forEach(function (r) {
      r.__on = r === selRow;
      var b = box(r);
      if (b) clickable(b, '표시', function (e) { e.stopPropagation(); check(r, !r.__on); });
      r.classList.add('sh-click');
      r.title = '눌러서 고르기 · 두 번 누르면 이상징후 탐지 등록';
      r.addEventListener('click', function (e) {
        if (editing() || e.target.closest('[data-name="Td/Visible"]')) return;
        rows.forEach(function (x) { if (x.__sel) { x.__sel = false; paint(x, false); } });
        if (selRow && !selRow.__sel) paint(selRow, false);
        r.__sel = true; paint(r, true); check(r, true);
      });
      r.addEventListener('dblclick', function () { if (!editing()) openRegister(root, st, valuesOf(r)); });
    });
    if (selRow) selRow.__sel = true;
    function valuesOf(r) {
      var v = function (n) { var p = one(r, '[data-name="' + n + '"] p'); return p ? p.textContent.trim() : ''; };
      return { 'Category': v('Td/Category'), 'Scenario No': v('Td/Scenario No'), 'Scenario Name': v('Td/Scenario Name'), 'Detected': v('Td/Detected'), 'Handled': v('Td/Handled') };
    }
    /* 대분류 거르기 — 누를 때마다 다음 분류(원본 표에 있는 분류만) */
    var catP = one(root, '[data-name="Field/Category"] [data-name="Value"]');
    var ci = Math.max(0, CATS.indexOf(catP ? catP.textContent.trim() : '전체'));
    function filter(animate) {
      var c = CATS[ci], n = 0;
      rows.forEach(function (r) {
        var v = (one(r, '[data-name="Td/Category"] p') || {}).textContent;
        var show = c === '전체' || (v && v.trim() === c);
        r.classList.toggle('sh-hide', !show);
        if (show && animate) { r.classList.remove('sh-rowin'); r.style.animationDelay = (n * 0.025) + 's'; void r.offsetWidth; r.classList.add('sh-rowin'); n++; }
      });
    }
    var fc = one(root, '[data-name="Field/Category"]');
    if (fc && catP) clickable(fc, '대분류 바꾸기', function () { ci = (ci + 1) % CATS.length; write(catP, CATS[ci]); filter(true); });
    clickable(one(root, '[data-name="Button/Search"]'), '조회', function () { filter(true); });
    clickable(one(root, '[data-name="Field/Base Date"]'), '기준일자');
  }

  /* 이상징후 탐지 등록 창 — 지금 화면 위에 겹쳐 띄운다(바탕은 그대로, Esc · 닫기 · 등록 · 바깥 누르면 닫힘) */
  function openRegister(root, st, vals) {
    if (st.ovl) closeRegister(st, true);
    if (typeof window.build_sha !== 'function') { goScene('register'); return; }
    if (!document.getElementById('sha-style') && window.SHA_CSS) {
      var s1 = document.createElement('style'); s1.id = 'sha-style'; s1.textContent = window.SHA_CSS; document.head.appendChild(s1);
    }
    if (!document.getElementById('sha-light-style') && window.SHA_LIGHT_CSS) {
      var s2 = document.createElement('style'); s2.id = 'sha-light-style'; s2.textContent = window.SHA_LIGHT_CSS; document.head.appendChild(s2);
    }
    var ovl = document.createElement('div');
    ovl.className = 'sh-ovl';
    ovl.innerHTML = '<div class="sh-dim" data-name="Dim"></div><div class="sha-mount sh-popmount" data-name="Dialog/Anomaly Registration">'
      + '<div class="sha-root sh-pop"></div></div>';
    var pop = one(ovl, '.sha-root');
    pop.innerHTML = window.build_sha();
    pop.dataset.theme = root.dataset.theme || 'dark';
    st.frame.appendChild(ovl);
    st.ovl = ovl;
    placeOverlay(st);
    fillRegister(pop, vals);
    installRegisterControls(root, st, pop, function () { closeRegister(st); });
    try { window.__applyTplTint && window.__applyTplTint(); } catch (e) { }
  }
  function placeOverlay(st) {
    var o = st.ovl; if (!o) return;
    var d = one(o, '.sh-dim'), m = one(o, '.sh-popmount');
    d.style.width = (st.VW || BASE_W) + 'px'; d.style.height = (st.VH || BASE_H) + 'px';
    m.style.translate = ((st.exW || 0) / 2) + 'px ' + ((st.exH || 0) / 2) + 'px';
  }
  function closeRegister(st, now) {
    var o = st.ovl; if (!o) return;
    st.ovl = null;
    if (now) { o.remove(); return; }
    o.classList.add('sh-out');
    setTimeout(function () { o.remove(); }, 260);
  }
  function fillRegister(pop, vals) {
    if (!vals) return;
    Object.keys(vals).forEach(function (k) {
      var p = one(pop, '[data-name="Field/' + k + '"] [data-name="Value"]');
      if (p && vals[k]) { p.textContent = vals[k]; p.__shLast = vals[k]; }
    });
    var now = new Date(), bd = one(pop, '[data-name="Field/Base Date"] [data-name="Value"]');
    if (bd) bd.textContent = now.getFullYear() + '년 ' + (now.getMonth() + 1) + '월 ' + now.getDate() + '일';
  }
  function installRegisterControls(root, st, pop, onClose) {
    var dlg = one(pop, '[data-name="Dialog/Anomaly Registration"]') || pop;
    var close = function () { onClose(); };
    clickable(one(dlg, '[data-name="Close Button"]'), '닫기', close);
    clickable(one(dlg, '[data-name="Button/Register"]'), '등록', function () {
      var b = one(dlg, '[data-name="Button/Register"]');
      b.classList.remove('sh-flash'); void b.offsetWidth; b.classList.add('sh-flash');
      setTimeout(close, 380);
    });
    var vals0 = {};
    all(dlg, '[data-name^="Field/"]').forEach(function (f) { var p = one(f, '[data-name="Value"]'); if (p) vals0[nameOf(f)] = p.textContent; });
    clickable(one(dlg, '[data-name="Button/Reset"]'), '새로고침', function () {
      all(dlg, '[data-name^="Field/"]').forEach(function (f, i) {
        var p = one(f, '[data-name="Value"]'), inp = one(f, '[data-name="Input"]');
        if (p && vals0[nameOf(f)] != null) p.textContent = vals0[nameOf(f)];
        if (inp) { inp.classList.remove('sh-flash'); inp.style.animationDelay = (i * 0.05) + 's'; void inp.offsetWidth; inp.classList.add('sh-flash'); }
      });
    });
    all(dlg, '[data-name="Input"]').forEach(function (inp) { inp.classList.add('sh-click'); });
    if (st.ovl) {
      one(st.ovl, '.sh-dim').addEventListener('click', close);
      st.onKey = function (e) { if (e.key === 'Escape' && st.ovl) close(); };
      document.addEventListener('keydown', st.onKey);
    }
  }
  /* 등록 화면(62:5) 자체 — 닫기 · 등록은 보안 현황으로 */
  function installRegisterPage(root, st) {
    if (sceneOf(root) !== 'register') return;
    var pop = one(root, '.sh-pop');
    if (pop) installRegisterControls(root, st, pop, function () { goScene('overview'); });
  }

  /* ══════════════════ 6. 입력 화면 — '입력' 을 누르면 그 표의 값을 바로 고친다 ══════════════════ */
  function installEntry(root, st) {
    if (sceneOf(root) !== 'entry') return;
    var saved = load(K_ENTRY);
    all(root, '[data-name^="Widget/"]').forEach(function (w) {
      var cells = all(w, '[data-name="Body"] [data-name^="Td/"]:not([data-name="Td/Category"]):not([data-name="Td/Base Month"]) p');
      cells.forEach(function (p) {
        var k = nameOf(w) + '|' + nameOf(p.closest('[data-name^="Row/"]')) + '|' + nameOf(p.parentElement);
        p.__shKey = k;
        if (saved[k] != null) write(p, saved[k]);
      });
      var btn = one(w, '[data-name="Button/Input"]');
      var on = false;
      function setOn(v) {
        on = v;
        w.classList.toggle('sh-entry-on', on);
        cells.forEach(function (p) { if (on) p.setAttribute('contenteditable', 'plaintext-only'); else p.removeAttribute('contenteditable'); });
        if (on && cells[0]) { cells[0].focus(); try { document.getSelection().selectAllChildren(cells[0]); } catch (e) { } }
        if (!on) {
          var m = load(K_ENTRY);
          cells.forEach(function (p) { m[p.__shKey] = p.textContent.trim(); p.__shLast = p.textContent; });
          save(K_ENTRY, m);
        }
      }
      clickable(btn, '값 입력', function () { setOn(!on); });
      cells.forEach(function (p, i) {
        p.addEventListener('keydown', function (e) {
          if (!on) return;
          if (e.key === 'Enter') { e.preventDefault(); var nx = cells[i + 1]; if (nx) { nx.focus(); try { document.getSelection().selectAllChildren(nx); } catch (er) { } } else setOn(false); }
          if (e.key === 'Escape') setOn(false);
        });
      });
    });
  }

  /* ══════════════════ 7. 차트 바꾸기 ══════════════════
     위젯마다 이 프로젝트(정보보호 · 이상징후 탐지 · 정보반출 · 내부통제)에 맞는 차트를 '추천 순'으로 둔다. 첫 항목이 추천.
     값은 화면에 이미 있는 수치에서 잇는다. 색은 원본 팔레트 — 하늘 #00baff · 보라 #7e41ff · 파랑 #4571ff · 청록 #00f6ff · 연두 #60ed8e. */
  var C = { sky: '#00baff', purple: '#7e41ff', blue: '#4571ff', cyan: '#00f6ff', green: '#60ed8e', lime: '#88d780', violet: '#9c97e2', red: '#ff6b7a', orange: '#ffb35c' };
  var CHARTS = {
    'Widget/Threat Level': [
      { k: 'line', t: '전체 트래픽 용량', unit: 'Mbps', series: [['금일 IN', C.purple, 172, 9], ['금일 OUT', C.blue, 158, 8], ['전주 IN', C.cyan, 118, 10], ['전주 OUT', C.green, 104, 9]], lo: 60, hi: 220 },
      { k: 'area', t: '금일 트래픽(IN)', unit: 'Mbps', series: [['금일 IN', C.purple, 172, 10]], lo: 100, hi: 220 },
      { k: 'gauge', t: '회선 사용률', unit: '%', v: [64, 5], max: 100, c: C.sky },
    ],
    'Widget/Threat Status': [
      { k: 'bar', t: '유형별 탐지 건수', unit: '건', cats: ['악성코드', 'APT공격', '침입탐지'], v: [9, 6], max: 24, c: C.sky },
      { k: 'donut', t: '탐지 처리 현황', parts: [['처리완료', C.sky, 20], ['처리중', C.purple, 4], ['미처리', C.red, 1]] },
      { k: 'line', t: '시간대별 탐지 추이', unit: '건', series: [['탐지', C.sky, 6, 2], ['처리', C.purple, 5, 2]], lo: 0, hi: 14 },
    ],
    'Widget/Department Audit': [
      { k: 'hbar', t: '상태별 점검 건수(당월)', unit: '건', cats: ['점검 진행 중', '지연 처리중', '자체 점검 완료', '결재 진행중', '점검 완료'], v: [16, 10], max: 40, c: C.sky },
      { k: 'donut', t: '당월 점검 진행 구성', parts: [['점검 완료', C.sky, 28], ['자체 점검 완료', C.purple, 22], ['점검 진행 중', C.blue, 12], ['결재 진행중', C.violet, 7], ['지연 처리중', C.red, 2]] },
      { k: 'bar', t: '월별 점검 완료 건수', unit: '건', cats: ['5월', '6월', '7월', '8월', '9월', '10월'], v: [38, 10], max: 60, c: C.purple },
    ],
    'Widget/Key Schedule': [
      { k: 'bar', t: '요일별 일정 건수', unit: '건', cats: ['월', '화', '수', '목', '금'], v: [2, 1.2], max: 5, c: C.purple },
      { k: 'donut', t: '일정 유형', parts: [['기술P', C.sky, 2], ['점검P', C.purple, 1]] },
    ],
    'Widget/Anomaly Detection': [
      { k: 'bar', t: '시나리오별 탐지 건수', unit: '건', cats: ['시나리오1', '시나리오2', '시나리오3', '시나리오4', '시나리오5'], v: [62, 22], max: 100, c: C.cyan },
      { k: 'donut', t: '대분류별 탐지 현황', parts: [['정보유출', C.sky, 150], ['개인정보', C.purple, 170], ['접근통제', C.blue, 238], ['내부통제', C.violet, 40], ['부정사용', C.cyan, 62], ['시스템', C.green, 136]] },
      { k: 'line', t: '이상징후 탐지 추이', unit: '건', series: [['탐지', C.cyan, 64, 8], ['처리', C.purple, 58, 8]], lo: 20, hi: 100 },
    ],
    'Widget/Data Export Approval': [
      { k: 'donut', t: '정보반출 승인 상태(당월)', parts: [['승인 완료', C.sky, 462], ['승인 대기', C.purple, 26], ['반려', C.red, 29]] },
      { k: 'bar', t: '일별 정보반출 요청', unit: '건', cats: ['월', '화', '수', '목', '금'], v: [24, 9], max: 50, c: C.blue },
      { k: 'gauge', t: '승인 처리율', unit: '%', v: [94, 1.5], max: 100, min: 60, c: C.sky },
    ],
    'Widget/Security Review': [
      { k: 'bar', t: '심의 · 검토 요청 대비 완료', unit: '건', cats: ['보안성 요청', '보안성 완료', '내부통제 요청', '내부통제 완료'], v: [9, 3], max: 20, c: C.purple },
      { k: 'gauge', t: '보안성 심의 완료율', unit: '%', v: [75, 4], max: 100, c: C.sky },
      { k: 'donut', t: '검토 진행 구성', parts: [['완료', C.sky, 15], ['진행', C.purple, 5]] },
    ],
    'Widget/Partner Security': [
      { k: 'gauge', t: '현장실태점검 진척율', unit: '%', v: [63, 3], max: 100, c: C.sky },
      { k: 'hbar', t: '항목별 진척율', unit: '%', cats: ['현장실태점검', '정보보호 교육'], v: [67, 6], max: 100, c: C.purple },
      { k: 'donut', t: '협력사 점검 상태', parts: [['점검 완료', C.sky, 60], ['점검 진행 중', C.purple, 27]] },
    ],
    /* 입력 화면 · 이상징후 탐지 화면의 표 */
    'Widget/Internal Control': [
      { k: 'bar', t: '내부 통제 요청 · 완료', unit: '건', cats: ['당월 요청', '당월 완료', '전월 요청', '전월 완료'], v: [14, 7], max: 30, c: C.violet },
    ],
    'Table/Anomaly Detection': [
      { k: 'bar', t: '대분류별 탐지 건수', unit: '건', cats: ['정보유출', '개인정보', '접근통제', '내부통제', '부정사용', '시스템'], v: [120, 70], max: 260, c: C.cyan },
      { k: 'line', t: '이상징후 탐지 · 처리 추이', unit: '건', series: [['탐지', C.cyan, 64, 8], ['처리', C.purple, 58, 8]], lo: 20, hi: 100 },
      { k: 'donut', t: '처리 현황', parts: [['처리', C.sky, 676], ['미처리', C.red, 92]] },
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
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function makeChart(host, spec, solid) {
    var el = document.createElement('div');
    el.className = 'sh-chart' + (solid ? ' sh-solid' : '');
    var timers = [], raf = 0;
    var title = '<div class="ct"><i></i>' + esc(spec.t) + '<b class="cv"></b></div>';
    function fmt(x, d) { return (d != null ? x.toFixed(d) : (Math.abs(x) < 10 && x % 1 ? x.toFixed(1) : String(Math.round(x)))); }
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
        var L = 30, R = 4, T = 4, B = 16;
        var X = function (i) { return L + (i - shift) * (w - L - R) / (N - 2); };
        var Y = function (v) { return T + (1 - (v - spec.lo) / (spec.hi - spec.lo)) * (h - T - B); };
        var s = '';
        for (var g = 0; g <= 3; g++) {
          var gv = spec.lo + (spec.hi - spec.lo) * g / 3, gy = Y(gv);
          s += '<line class="gl" x1="' + L + '" x2="' + (w - R) + '" y1="' + gy.toFixed(1) + '" y2="' + gy.toFixed(1) + '"/>';
          s += '<text class="ax" x="' + (L - 6) + '" y="' + (gy + 4).toFixed(1) + '" text-anchor="end">' + Math.round(gv) + '</text>';
        }
        var d0 = new Date();
        for (var tl = 0; tl < 4; tl++) {
          var tx = L + (w - L - R) * (tl + 0.5) / 4;
          var tt = new Date(d0.getTime() - (3 - tl) * (N / 4) * STEP);
          s += '<text class="ax" x="' + tx.toFixed(1) + '" y="' + (h - 1) + '" text-anchor="middle">' + p2(tt.getHours()) + ':' + p2(tt.getMinutes()) + ':' + p2(tt.getSeconds()) + '</text>';
        }
        s += '<clipPath id="shc' + spec.uid + '"><rect x="' + L + '" y="0" width="' + (w - L - R) + '" height="' + h + '"/></clipPath><g clip-path="url(#shc' + spec.uid + ')">';
        data.forEach(function (a, si) {
          var col = spec.series[si][1];
          var pts = a.map(function (v, i) { return X(i).toFixed(1) + ',' + Y(v).toFixed(1); }).join(' ');
          if (spec.k === 'area' || si === 0) {
            s += '<defs><linearGradient id="shg' + spec.uid + si + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + col + '" stop-opacity="' + (spec.k === 'area' ? .45 : .2) + '"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></linearGradient></defs>';
            s += '<polygon fill="url(#shg' + spec.uid + si + ')" points="' + X(0).toFixed(1) + ',' + (h - B) + ' ' + pts + ' ' + X(N - 1).toFixed(1) + ',' + (h - B) + '"/>';
          }
          s += '<polyline fill="none" stroke="' + col + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" points="' + pts + '" style="filter:drop-shadow(0 0 3px ' + col + ')"/>';
          s += '<circle cx="' + X(N - 1).toFixed(1) + '" cy="' + Y(a[N - 1]).toFixed(1) + '" r="3" fill="#08253c" stroke="' + col + '" stroke-width="1.5"/>';
        });
        s += '</g>';
        svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
        svg.innerHTML = s;
        cv.innerHTML = fmt(data[0][N - 1]) + (spec.unit ? '<small>' + esc(spec.unit) + '</small>' : '');
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
        bars.forEach(function (b) {
          var v = clamp(spec.v[0] + rnd(-spec.v[1], spec.v[1]), 0, spec.max);
          sum += v;
          var hpc = (v / spec.max * 100).toFixed(1) + '%';
          b.querySelector('i').style.height = hpc;
          b.style.setProperty('--h', hpc);
          b.querySelector('em').textContent = fmt(v, spec.dec != null ? spec.dec : 0);
        });
        cv2.innerHTML = fmt(sum, 0) + '<small>' + esc(spec.unit) + ' 합계</small>';
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
        rowsH.forEach(function (r) {
          var v = clamp(spec.v[0] + rnd(-spec.v[1], spec.v[1]) * 1.2, 0, spec.max);
          sum += v;
          r.querySelector('i').style.width = (v / spec.max * 100).toFixed(1) + '%';
          r.querySelector('b').textContent = Math.round(v) + spec.unit;
        });
        cv3.innerHTML = (spec.unit === '%' ? Math.round(sum / rowsH.length) + '<small>% 평균</small>' : Math.round(sum) + '<small>' + esc(spec.unit) + ' 합계</small>');
      };
      requestAnimationFrame(function () { requestAnimationFrame(tickH); });
      timers.push(setInterval(function () { if (!idle()) tickH(); }, 2800));
    } else if (spec.k === 'gauge') {
      var mn = spec.min || 0, R0 = 42, LEN = Math.PI * R0;
      el.innerHTML = title + '<div class="pl"><svg viewBox="0 0 100 58" preserveAspectRatio="xMidYMid meet">'
        + '<defs><linearGradient id="shgg' + spec.uid + '" x1="0" x2="1"><stop offset="0" stop-color="#7e41ff"/><stop offset="1" stop-color="' + spec.c + '"/></linearGradient></defs>'
        + '<path d="M8 52a42 42 0 0 1 84 0" fill="none" stroke="rgba(202,209,226,.12)" stroke-width="8" stroke-linecap="round"/>'
        + '<path class="arc" d="M8 52a42 42 0 0 1 84 0" fill="none" stroke="url(#shgg' + spec.uid + ')" stroke-width="8" stroke-linecap="round" stroke-dasharray="0 ' + LEN.toFixed(1) + '" style="filter:drop-shadow(0 0 4px ' + spec.c + ')"/>'
        + '<text class="ax" style="font-size:5.5px" x="8" y="58" text-anchor="middle">' + mn + '</text><text class="ax" style="font-size:5.5px" x="92" y="58" text-anchor="middle">' + spec.max + '</text>'
        + '</svg><div class="gv"></div></div>';
      var arc = el.querySelector('.arc'), gv = el.querySelector('.gv');
      var cur = spec.v[0];
      var tickG = function () {
        cur = clamp(cur + rnd(-spec.v[1], spec.v[1]) * 0.6, spec.v[0] - spec.v[1] * 2, spec.v[0] + spec.v[1] * 2);
        var k = clamp((cur - mn) / (spec.max - mn), 0, 1);
        arc.setAttribute('stroke-dasharray', (LEN * k).toFixed(1) + ' ' + LEN.toFixed(1));
        gv.innerHTML = fmt(cur) + '<small>' + esc(spec.unit) + '</small>';
      };
      requestAnimationFrame(function () { requestAnimationFrame(tickG); });
      timers.push(setInterval(function () { if (!idle()) tickG(); }, 2200));
    } else if (spec.k === 'donut') {
      var RR = 15.9155, CIRC = 100;
      el.innerHTML = title + '<div class="pl"><div class="dn"><div class="ring"><svg viewBox="0 0 42 42">'
        + '<circle cx="21" cy="21" r="' + RR + '" fill="none" stroke="rgba(202,209,226,.12)" stroke-width="6"/>'
        + spec.parts.map(function (p) { return '<circle class="arc" cx="21" cy="21" r="' + RR + '" fill="none" stroke="' + p[1] + '" stroke-width="6" stroke-dasharray="0 100" transform="rotate(-90 21 21)"/>'; }).join('')
        + '</svg><b></b></div><ul>' + spec.parts.map(function (p) { return '<li style="--c:' + p[1] + '">' + esc(p[0]) + '<b></b></li>'; }).join('') + '</ul></div></div>';
      var arcs = Array.prototype.slice.call(el.querySelectorAll('.arc')), lis = Array.prototype.slice.call(el.querySelectorAll('li b')), center = el.querySelector('.ring b');
      var vals = spec.parts.map(function (p) { return p[2]; });
      var tickD = function () {
        vals = vals.map(function (v, i) { return i === 0 ? v + Math.round(rnd(0, 1.4)) : Math.max(0, Math.round(v + rnd(-1, 1))); });
        var t = vals.reduce(function (s, v) { return s + v; }, 0) || 1, off = 0;
        arcs.forEach(function (a, i) {
          var len = vals[i] / t * CIRC;
          a.setAttribute('stroke-dasharray', Math.max(0, len - 0.8).toFixed(2) + ' ' + (CIRC - Math.max(0, len - 0.8)).toFixed(2));
          a.setAttribute('stroke-dashoffset', (-off).toFixed(2));
          off += len;
          lis[i].textContent = vals[i];
        });
        center.innerHTML = Math.round(vals[0] / t * 100) + '%<small>' + esc(spec.parts[0][0]) + '</small>';
      };
      requestAnimationFrame(function () { requestAnimationFrame(tickD); });
      timers.push(setInterval(function () { if (!idle()) tickD(); }, 3400));
    }
    host.appendChild(el);
    return { el: el, dispose: function () { cancelAnimationFrame(raf); timers.forEach(clearInterval); el.remove(); } };
  }

  /* 차트가 서는 자리 — 보안 현황 위젯은 판(Background) 위, 입력 화면 위젯 · 이상징후 표는 그 상자 위 */
  function placeHost(i) {
    var h = i.chost, bg = i.bg;
    if (!h || !bg) return;
    h.style.left = bg.style.left || (bg.offsetLeft + 'px');
    h.style.top = bg.style.top || (bg.offsetTop + 'px');
    h.style.width = bg.style.width || (bg.offsetWidth + 'px');
    h.style.height = bg.style.height || (bg.offsetHeight + 'px');
    h.style.borderRadius = getComputedStyle(bg).borderRadius;
  }
  var chartUid = 0;
  function installCharts(root, st) {
    var sc = sceneOf(root);
    var saved = load(K_CHART)[sc] || {};
    st.charts = {}; st.chartApply = {};
    var targets = [];
    Object.keys(CHARTS).forEach(function (wn) {
      all(root, '[data-name="' + wn + '"]').forEach(function (el) { if (!el.closest('.sh-ovl')) targets.push([wn, el]); });
    });
    targets.forEach(function (tg) {
      var wn = tg[0], w = tg[1], key = wn;
      var info = st.byName && st.byName[wn];
      var host, solid = true;
      if (info && info.bg) {
        host = document.createElement('div');
        host.className = 'sh-chost';
        w.appendChild(host);
        info.chost = host;
        placeHost(info);
        solid = true;
      } else {
        if (getComputedStyle(w).position === 'static') w.style.position = 'relative';
        host = document.createElement('div');
        host.className = 'sh-chost';
        host.style.inset = '0';
        w.appendChild(host);
      }
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sh-chartbtn';
      btn.innerHTML = KIND_ICON.bar.replace('class="ic"', 'class="ic" style="width:13px;height:11px"') + '차트';
      btn.title = '이 패널의 차트 바꾸기';
      var menu = document.createElement('div');
      menu.className = 'sh-chartmenu';
      host.appendChild(btn); host.appendChild(menu);
      var cur = saved[key] != null ? saved[key] : -1;
      function render() {
        var list = CHARTS[wn];
        menu.innerHTML = '<div class="hd">' + esc(wn.replace(/^(Widget|Table)\//, '')) + ' — 추천 차트</div>'
          + list.map(function (s, i) {
            return '<button type="button" data-i="' + i + '"' + (i === cur ? ' class="cur"' : '') + '>' + KIND_ICON[s.k] + esc(s.t) + ' · ' + KIND_NAME[s.k]
              + (i === 0 ? '<span class="rec">추천</span>' : '') + '</button>';
          }).join('')
          + '<div class="sep"></div><button type="button" data-i="-1"' + (cur < 0 ? ' class="cur"' : '') + '>' + KIND_ICON.orig + '원본 그대로</button>';
      }
      function apply(i) {
        cur = i;
        if (st.charts[key]) { st.charts[key].dispose(); delete st.charts[key]; }
        w.classList.toggle('sh-swapped', i >= 0);
        if (i >= 0 && CHARTS[wn][i]) {
          st.charts[key] = makeChart(host, Object.assign({ uid: ++chartUid }, CHARTS[wn][i]), solid);
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
        all(root, '.sh-chartmenu.open').forEach(function (m) { if (m !== menu) m.classList.remove('open'); });
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
    st.onDocDown = function (e) {
      if (e.target.closest && e.target.closest('.sh-chartmenu, .sh-chartbtn')) return;
      all(root, '.sh-chartmenu.open').forEach(function (m) { m.classList.remove('open'); });
    };
    document.addEventListener('pointerdown', st.onDocDown, true);
  }

  /* ══════════════════ 8. 패널 옮기기(패널편집) ══════════════════
     보안 현황 — 위젯을 끌어 다른 열 · 다른 자리에 놓으면 그 열의 차례에 끼어들고, 두 열 모두 14px 간격으로 다시 쌓인다
                (자리표시 점선이 들어갈 곳을 미리 보여 준다). 판 높이는 열마다 남는 높이를 나눠 가져 빈틈이 없다.
     입력 화면 — 세 위젯은 줄(flex) 속에 있다. 다른 위젯 위에 놓으면 순서가 바뀌고 나머지가 흘러 자리를 잡는다.
     이상징후 탐지 · 등록 창 — 검색줄 · 표 · 창은 4px 격자로 자유 이동. 장면별로 저장, '배치 초기화'로 되돌린다. */
  function installPanelMove(root, st) {
    var sc = sceneOf(root);
    var L = load(K_LAYOUT); L[sc] = L[sc] || {};
    function persist() { var m = load(K_LAYOUT); m[sc] = L[sc]; save(K_LAYOUT, m); }
    var drag = null;
    var scale = function () { return st.S || 1; };

    /* 자유 이동 대상 */
    var free = [];
    if (sc === 'anomaly') free = [one(root, '[data-name="Search Bar"]'), one(root, '[data-name="Table/Anomaly Detection"]')];
    if (sc === 'register') free = [one(root, '.sh-popmount')];
    free = free.filter(Boolean);
    free.forEach(function (el) {
      el.classList.add('sh-fmv');
      var o = (L[sc].free || {})[nameOf(el)];
      if (o) { el.style.setProperty('--sh-dx', o[0] + 'px'); el.style.setProperty('--sh-dy', o[1] + 'px'); el.__shMove = o; }
    });
    /* 입력 화면 — 줄 속 순서 */
    var row = sc === 'entry' ? one(root, '[data-name="Content"]') : null;
    var rowW = row ? kids(row, '[data-name^="Widget/"]') : [];
    rowW.forEach(function (w) { w.classList.add('sh-fmv'); w.setAttribute('data-sh-flow', '1'); });
    st.rowOrder0 = rowW.slice();
    if (row && Array.isArray(L[sc].order)) L[sc].order.forEach(function (n) { var w = rowW.filter(function (x) { return nameOf(x) === n; })[0]; if (w) row.appendChild(w); });

    var ghost = null;
    function ghostAt(col, idx, h) {
      if (!ghost) { ghost = document.createElement('div'); ghost.className = 'sh-ghost'; st.frame.appendChild(ghost); }
      var list = st.cols[col].filter(function (n) { return n !== drag.name; }).map(function (n) { return st.byName[n]; });
      var y = COL_TOP;
      for (var i = 0; i < idx && i < list.length; i++) y += list[i].h + COL_GAP;
      ghost.style.left = (COL_X[col] + (col === 'R' ? (st.exW || 0) / 2 : 0)) + 'px';
      ghost.style.top = y + 'px';
      ghost.style.width = (COL_W + (st.exW || 0) / 2) + 'px';
      ghost.style.height = h + 'px';
    }
    function dropSpot(e) {
      var fr = st.frame.getBoundingClientRect(), S = scale();
      var x = (e.clientX - fr.left) / S, y = (e.clientY - fr.top) / S;
      var col = x < (st.VW || BASE_W) / 2 ? 'L' : 'R';
      var list = st.cols[col].filter(function (n) { return n !== drag.name; }).map(function (n) { return st.byName[n]; });
      var idx = list.length;
      for (var i = 0; i < list.length; i++) { if (y < list[i].slotY + list[i].slotH / 2) { idx = i; break; } }
      return { col: col, idx: idx };
    }
    st.onDown = function (e) {
      if (!layoutEditing(root) || e.button !== 0) return;
      if (e.target.closest('.sh-chartbtn, .sh-chartmenu')) return;
      var w = e.target.closest('.sh-mv, .sh-fmv');
      if (!w || !root.contains(w)) return;
      e.preventDefault(); e.stopPropagation();
      var o = w.__shMove || [0, 0];
      drag = { w: w, name: nameOf(w), kind: w.classList.contains('sh-mv') ? 'col' : (w.hasAttribute('data-sh-flow') ? 'flow' : 'free'), sx: e.clientX, sy: e.clientY, ox: o[0], oy: o[1], moved: false };
    };
    st.onMove = function (e) {
      if (!drag) return;
      var dx = (e.clientX - drag.sx) / scale(), dy = (e.clientY - drag.sy) / scale();
      if (!drag.moved) {
        if (Math.hypot(dx, dy) < 3) return;
        drag.moved = true;
        drag.w.classList.add('sh-dragging');
      }
      if (drag.kind === 'col') {
        drag.w.style.setProperty('--sh-dx', dx + 'px');
        drag.w.style.setProperty('--sh-dy', dy + 'px');
        var sp = dropSpot(e);
        drag.spot = sp;
        ghostAt(sp.col, sp.idx, st.byName[drag.name].h);
      } else if (drag.kind === 'flow') {
        drag.w.style.setProperty('--sh-dx', dx + 'px');
        drag.w.style.setProperty('--sh-dy', dy + 'px');
        var tgt = null;
        rowW.forEach(function (x) { if (x === drag.w) return; var r = x.getBoundingClientRect(); if (e.clientX >= r.left && e.clientX <= r.right) tgt = x; });
        if (tgt !== drag.target) { if (drag.target) drag.target.classList.remove('sh-droptarget'); drag.target = tgt; if (tgt) tgt.classList.add('sh-droptarget'); }
      } else {
        var g = 4, x = Math.round((drag.ox + dx) / g) * g, y = Math.round((drag.oy + dy) / g) * g;
        drag.w.style.setProperty('--sh-dx', x + 'px'); drag.w.style.setProperty('--sh-dy', y + 'px');
        drag.w.__shMove = [x, y];
      }
    };
    st.onUp = function () {
      if (!drag) return;
      var d = drag; drag = null;
      d.w.classList.remove('sh-dragging');
      if (ghost) { ghost.remove(); ghost = null; }
      if (!d.moved) return;
      if (d.kind === 'col') {
        var sp = d.spot;
        /* 놓은 자리에서 새 자리로 미끄러져 들어간다 — 끄는 이동(--sh-dx/dy)을 0 으로 풀면 translate 전환이 받아 준다 */
        var info = st.byName[d.name];
        var before = { x: info.tx + (parseFloat(d.w.style.getPropertyValue('--sh-dx')) || 0), y: info.ty + (parseFloat(d.w.style.getPropertyValue('--sh-dy')) || 0) };
        var fromCol = info.col, fromIdx = st.cols[fromCol].indexOf(d.name);
        ['L', 'R'].forEach(function (c) { st.cols[c] = st.cols[c].filter(function (n) { return n !== d.name; }); });
        if (sp) st.cols[sp.col].splice(sp.idx, 0, d.name);
        else st.cols[fromCol].push(d.name);
        /* 다른 열로 옮겨 그 열이 화면 높이를 넘치면, 놓은 자리의 위젯과 서로 자리를 바꾼다(두 열 모두 화면 안에 남는다) */
        if (sp && sp.col !== fromCol) {
          var hOf = function (c) { return st.cols[c].reduce(function (s, n) { return s + st.byName[n].h; }, 0) + COL_GAP * (st.cols[c].length - 1); };
          if (hOf(sp.col) > COL_H + (st.exH || 0) + 0.5) {
            var list = st.cols[sp.col];
            var swap = list[sp.idx + 1] || list[sp.idx - 1];
            if (swap) {
              st.cols[sp.col] = list.filter(function (n) { return n !== swap; });
              st.cols[fromCol].splice(Math.max(0, fromIdx), 0, swap);
            }
          }
        }
        layoutCols(st);
        setT(d.w, before.x, before.y);
        d.w.style.setProperty('--sh-dx', '0px'); d.w.style.setProperty('--sh-dy', '0px');
        void d.w.offsetWidth;
        setT(d.w, info.tx, info.ty);
        L[sc].cols = JSON.parse(JSON.stringify(st.cols));
        persist();
      } else if (d.kind === 'flow') {
        if (d.target) {
          d.target.classList.remove('sh-droptarget');
          var before2 = rowW.map(function (w) { return [w, w.getBoundingClientRect().left]; });
          var ks = kids(row), a = ks.indexOf(d.w), b = ks.indexOf(d.target);
          if (a < b) row.insertBefore(d.w, d.target.nextSibling); else row.insertBefore(d.w, d.target);
          before2.forEach(function (bf) {
            var dx2 = (bf[1] - bf[0].getBoundingClientRect().left) / scale();
            if (!dx2 || bf[0] === d.w) return;
            bf[0].animate([{ translate: dx2 + 'px 0' }, { translate: '0 0' }], { duration: 420, easing: 'cubic-bezier(.22,.8,.24,1)' });
          });
          L[sc].order = kids(row, '[data-name^="Widget/"]').map(nameOf);
          persist();
        }
        var r0 = d.w.getBoundingClientRect();
        d.w.style.setProperty('--sh-dx', '0px'); d.w.style.setProperty('--sh-dy', '0px');
        var r1 = d.w.getBoundingClientRect();
        d.w.animate([{ translate: ((r0.left - r1.left) / scale()) + 'px ' + ((r0.top - r1.top) / scale()) + 'px' }, { translate: '0 0' }], { duration: 420, easing: 'cubic-bezier(.22,.8,.24,1)' });
      } else {
        L[sc].free = L[sc].free || {};
        L[sc].free[d.name] = d.w.__shMove;
        persist();
      }
    };
    root.addEventListener('pointerdown', st.onDown, true);
    window.addEventListener('pointermove', st.onMove);
    window.addEventListener('pointerup', st.onUp);
    window.addEventListener('pointercancel', st.onUp);
    st.onDragStart = function (e) { if (layoutEditing(root) && e.target.closest && e.target.closest('.sh-mv, .sh-fmv')) e.preventDefault(); };
    root.addEventListener('dragstart', st.onDragStart);
    /* 스튜디오 '배치 초기화' — 열 · 순서 · 이동 · 차트를 원본으로 */
    st.resetLayout = function () {
      var m = load(K_LAYOUT); delete m[sc]; save(K_LAYOUT, m); L[sc] = {};
      if (st.cols0) { st.cols = JSON.parse(JSON.stringify(st.cols0)); layoutCols(st); }
      if (row) st.rowOrder0.forEach(function (w) { row.appendChild(w); });
      free.forEach(function (el) { el.style.setProperty('--sh-dx', '0px'); el.style.setProperty('--sh-dy', '0px'); el.__shMove = null; });
      var c = load(K_CHART); delete c[sc]; save(K_CHART, c);
      Object.keys(st.chartApply || {}).forEach(function (k) { st.chartApply[k](-1); });
    };
    st.onReset = function (e) { if (e.target.closest && e.target.closest('#layoutReset')) st.resetLayout(); };
    document.addEventListener('click', st.onReset, true);
  }

  /* ══════════════════ 9. 그라디언트 글자 표시 ══════════════════
     제목 글자 중 배경을 글자 모양으로 자른 것(background-clip:text)은 라이트에서 그라디언트만 짙게 바꾼다 */
  function markGradientText(root) {
    all(root, 'p').forEach(function (p) {
      var cs = getComputedStyle(p);
      if (cs.webkitBackgroundClip === 'text' || cs.backgroundClip === 'text') p.classList.add('sh-gtext');
    });
    /* 심의 이름표 중 받침(Plate 판) 아래로 나온 줄 — 라이트에서는 흰 카드 위라 짙은 글자로(윗줄은 짙은 받침 위라 흰색 그대로) */
    all(root, '[data-name="Category Badge"]').forEach(function (b) {
      var plate = one(b, '[data-name="Plate"] > [data-name="Background"]');
      if (!plate) return;
      var pb = plate.getBoundingClientRect().bottom;
      all(b, 'p').forEach(function (p) { if (p.getBoundingClientRect().top >= pb - 3) p.classList.add('sh-offplate'); });
    });
  }

  /* ══════════════════ 살리기 ══════════════════ */
  function initShinhan(root) {
    if (!root || root.__sh) return;
    injectStyle();
    root.classList.add('sh-root');
    var st = root.__sh = { timers: [], raf: [] };
    if (/[?&]edit=1/.test(location.search)) root.classList.add('sh-edit-layout');
    try { markGradientText(root); } catch (e) { console.warn('[sh] gtext', e); }
    try { installFit(root, st); } catch (e) { console.warn('[sh] fit', e); }
    try { installClock(root, st); } catch (e) { console.warn('[sh] clock', e); }
    try { installRecent(root, st); } catch (e) { console.warn('[sh] recent', e); }
    try { installNav(root, st); } catch (e) { console.warn('[sh] nav', e); }
    try { installLive(root, st); } catch (e) { console.warn('[sh] live', e); }
    try { installAnomaly(root, st); } catch (e) { console.warn('[sh] anomaly', e); }
    try { installRegisterPage(root, st); } catch (e) { console.warn('[sh] register', e); }
    try { installEntry(root, st); } catch (e) { console.warn('[sh] entry', e); }
    try { installCharts(root, st); } catch (e) { console.warn('[sh] charts', e); }
    try { installPanelMove(root, st); } catch (e) { console.warn('[sh] move', e); }
  }
  function disposeShinhan(root) {
    var st = root && root.__sh;
    if (!st) return;
    st.timers.forEach(function (t) { clearInterval(t); clearTimeout(t); });
    (st.raf || []).forEach(function (r) { cancelAnimationFrame(r); });
    if (st.ro) st.ro.disconnect();
    if (st.onResize) window.removeEventListener('resize', st.onResize);
    Object.keys(st.charts || {}).forEach(function (k) { st.charts[k].dispose(); });
    if (st.onDocDown) document.removeEventListener('pointerdown', st.onDocDown, true);
    if (st.onMove) { window.removeEventListener('pointermove', st.onMove); window.removeEventListener('pointerup', st.onUp); window.removeEventListener('pointercancel', st.onUp); }
    if (st.onReset) document.removeEventListener('click', st.onReset, true);
    if (st.onKey) document.removeEventListener('keydown', st.onKey);
    root.__sh = null;
  }
  window.initShinhan = initShinhan;
  window.disposeShinhan = disposeShinhan;
})();
