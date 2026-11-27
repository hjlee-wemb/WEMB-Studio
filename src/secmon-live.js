/* 증권 통합관제 — 재구축 화면 6장면(통합관제현황 · 채널 · 마이크로 서비스 · 메시지큐 · 인프라 · 이벤트) + 팝업 조각 3의
   인터랙션 · 라이브 · 반응형 레이어.  window.initSecmon(root) / window.disposeSecmon(root)

   화면(DOM·CSS)은 생성기(src/secmon/_gen/conv.js)가 Figma 그대로 만든다. 이 파일은 그 위에 '움직이는 것'만 얹는다 — 정지 상태(?live=0) = Figma 원본.
   · 반응형 — 1920x1080 좌표계 + 균일 배율. 남는 폭 · 높이는 패널마다 자리(왼 · 가운데 · 오른)에 따라 나눠 갖고 바탕 · 헤더 · 이벤트 바 띠는 늘어난다(여백 없음)
   · 실시간 시계(헤더 2026/11/26 THU · 13:42:18 꼴), 이벤트 발생시각은 열 때마다 '지금' 기준 최근으로(Figma 기준 13:42:18 과의 간격 유지)
   · 헤더 메뉴 — 장면 잇기(NKS현황은 시안에 없어 알림), 사이트 고르기, 로그아웃 · 로고
   · 마우스 오버 — 모든 단추(Figma 의 (Hover) 변형 레이어를 오버 때만 보인다) · 표 줄 · 카드 · 노드
   · 이벤트 바 — Expand(^) 를 누르면 '이벤트 현황(펼침)' 판이 아래에서 미끄러져 올라오고 Collapse 로 접힌다(기억),
     등급 수(CR …)를 누르면 이벤트 알림 팝업, Auto 점을 누르면 실시간 멈춤 · 재개, 가끔 새 이벤트가 들어와 수가 는다
   · 통합관제현황 아래 차트 판 — 오른쪽 손잡이로 왼쪽으로 접고, 왼쪽 탭으로 다시 편다(기억)
   · 차트 — 막대 · 게이지 칸 · 선(svg 를 글자로 들여와 길을 움직인다) · 표 숫자가 실시간처럼 움직인다
   · 스크롤 — 가로 스크롤 막대가 있는 표(디비 수신확인 · 로그조회)는 열이 더 있어 끌거나 휠로 넘기고, 이벤트 표는 지난 이벤트를 세로로 본다
   · 차트 바꾸기(패널편집 중) — 패널마다 증권 IT 관제에 맞춘 추천 차트. 첫 항목 = 추천, '원본 그대로'로 되돌린다
   · 패널 옮기기(패널편집 중) — 패널을 4px 격자로 옮긴다, '배치 초기화'로 되돌린다
   손으로 쓴 파일이다(생성물 아님). 고친 뒤 node mk-live.js → js/core/tpl-modules.js 의 secmon-live.js ?v= 를 올릴 것. */
(function () {
  'use strict';

  var BASE_W = 1920, BASE_H = 1080;
  var K_LAYOUT = 'wemb-secmon-layout', K_CHART = 'wemb-secmon-chart', K_FOLD = 'wemb-secmon-fold', K_SITE = 'wemb-secmon-site';
  var STYLE_ID = 'secmon-live-style';
  var EASE = 'cubic-bezier(.22,.8,.24,1)';
  var BASE_TIME = new Date(2026, 10, 26, 13, 42, 18).getTime();   /* Figma 화면에 찍힌 기준 시각 2026/11/26 13:42:18 */
  var DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  /* ══════════════════ 스타일 ══════════════════ */
  var CSS = [
    '.sl-root{--sl-acc:87,162,254;overflow:clip!important;}',
    '.sl-root.sl-resizing *,.sl-root .sl-dragging,.sl-root .sl-dragging *{transition:none!important;}',
    '.sl-root.sl-live .sl-place{transition:translate .5s ' + EASE + ',opacity .35s ease;}',
    '.sl-root .sl-bgfill{position:absolute;left:0;top:0;z-index:-1;pointer-events:none;}',
    '.sl-root .sl-probe{position:absolute;width:0;height:0;overflow:hidden;color:#57a2fe;}',
    '.sl-root .sl-click{cursor:pointer;}',
    '.sl-root .sl-click *{cursor:inherit;}',
    '.sl-root img{pointer-events:none;}',
    '.dt-content-editing .sl-root .sl-click,.dt-content-editing .sl-root .sl-click *{cursor:text;}',
    '@keyframes slIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}}',
    '@keyframes slRowIn{from{opacity:0;transform:translateX(-18px);filter:brightness(1.8);}to{opacity:1;transform:none;filter:none;}}',
    '@keyframes slBlink{0%,100%{opacity:1;}50%{opacity:.35;}}',
    '@keyframes slPulse{0%{box-shadow:0 0 0 0 rgba(244,48,49,.7);}100%{box-shadow:0 0 0 12px rgba(244,48,49,0);}}',
    '.sl-root.sl-enter .sl-unit{animation:slIn .55s ' + EASE + ' both;animation-delay:calc(var(--i,0) * 55ms);}',
    '.sl-root .sl-rowin{animation:slRowIn .7s ' + EASE + ' both;}',
    '.sl-root .sl-blink{animation:slBlink 1.2s ease-in-out 3;}',
    '.sl-root .sl-flash{transition:text-shadow .4s ease,color .4s ease;text-shadow:0 0 10px rgba(113,226,255,.95);}',
    /* 헤더 메뉴 */
    '.sl-root .sl-tab{cursor:pointer;transition:color .2s ease,text-shadow .25s ease;}',
    '.sl-root .sl-tab:not(.sl-act):hover{color:#fff!important;text-shadow:0 0 10px rgba(87,162,254,.85);}',
    '.sl-root .sl-tab::after{content:"";position:absolute;inset:-10px -8px;}',
    '.dt-content-editing .sl-root .sl-tab::after,.dt-editing .sl-root .sl-tab::after{display:none;}',
    /* 단추 */
    '.sl-root .sl-btn{cursor:pointer;transition:filter .2s ease,translate .2s ' + EASE + ',box-shadow .25s ease;}',
    '.sl-root .sl-btn:hover{filter:brightness(1.35) drop-shadow(0 0 6px rgba(87,162,254,.8));}',
    '.sl-root .sl-btn:active{filter:brightness(.9);}',
    /* Figma (Hover) 변형 — 오버 때만 */
    '.sl-root .sl-hv{opacity:0;transition:opacity .18s ease;pointer-events:none;}',
    '.sl-root .sl-hv.sl-on{opacity:1;}',
    '.sl-root .sl-press{cursor:pointer;}',
    '.sl-root .sl-press.sl-down{filter:brightness(1.3);}',
    /* 표 줄 · 카드 · 노드 */
    '.sl-root .sl-row{cursor:pointer;transition:filter .2s ease,box-shadow .25s ease;}',
    '.sl-root .sl-row.sl-on{filter:brightness(1.35);}',
    '.sl-root .sl-card{cursor:pointer;transition:filter .2s ease,translate .25s ' + EASE + ';}',
    '.sl-root .sl-card.sl-on{filter:brightness(1.22) drop-shadow(0 6px 12px rgba(0,0,0,.35));}',
    '.sl-root .sl-node{cursor:pointer;transition:filter .2s ease,scale .25s ' + EASE + ';}',
    '.sl-root .sl-node.sl-on{filter:brightness(1.3) drop-shadow(0 0 8px rgba(87,162,254,.7));}',
    /* 막대 · 칸 */
    '.sl-root .sl-bar{transition:scale .9s ' + EASE + ',background-color .5s ease;}',
    '.sl-root .sl-barx{transform-origin:left center;}',
    '.sl-root .sl-bary{transform-origin:center bottom;}',
    '.sl-root .sl-seg{transition:opacity .45s ease,filter .45s ease;}',
    '.sl-root .sl-seg.sl-off{opacity:0;}',
    '.sl-root .sl-gbar{transition:background-image .8s ease;}',
    /* 이벤트 판(펼침) · 팝업 */
    '.sl-root .sl-evmount{position:absolute;left:40px;top:778px;width:1840px;height:308px;z-index:60;transform:translateY(105%);opacity:0;pointer-events:none;transition:transform .55s ' + EASE + ',opacity .35s ease;}',
    '.sl-root .sl-evmount.sl-open{transform:none;opacity:1;pointer-events:auto;}',
    '.sl-root .sl-evmount .smx-root{position:absolute;inset:0;background:none;}',
    '.sl-root .sl-dim{position:absolute;left:0;top:0;width:100%;height:100%;z-index:70;background:rgba(0,0,0,.7);opacity:0;pointer-events:none;transition:opacity .3s ease;}',
    '.sl-root .sl-dim.sl-open{opacity:1;pointer-events:auto;}',
    '.sl-root .sl-pop{position:absolute;z-index:71;opacity:0;scale:.96;pointer-events:none;transition:opacity .28s ease,scale .35s ' + EASE + ';}',
    '.sl-root .sl-pop.sl-open{opacity:1;scale:1;pointer-events:auto;}',
    '.sl-root .sl-pop > [class$="-root"]{position:absolute;inset:0;background:none;}',
    '.sl-root .sl-alarm{animation:slPulse 1.2s ease-out 3;border-radius:6px;}',
    /* 차트 판 접기(통합관제현황) */
    '.sl-root .sl-slide{transition:translate .6s ' + EASE + ',opacity .45s ease;}',
    '.sl-root .sl-folded .sl-slide{opacity:0;pointer-events:none;}',
    '.sl-root .sl-abovepanel{z-index:62!important;}',
    '.sl-root .sl-tabopen{transition:filter .2s ease,opacity .4s ease;}',
    /* 스크롤 표 */
    '.sl-root .sl-clip{position:absolute;overflow:hidden;z-index:1;}',
    '.sl-root .sl-clip > .sl-inner{position:absolute;width:' + BASE_W + 'px;height:' + BASE_H + 'px;transition:transform .35s ' + EASE + ';}',
    '.sl-root .sl-clip.sl-drag > .sl-inner{transition:none;}',
    '.sl-root .sl-thumb{cursor:grab;transition:transform .35s ' + EASE + ',filter .2s ease;}',
    '.sl-root .sl-thumb:hover{filter:brightness(1.4);}',
    '.sl-root .sl-clip.sl-drag ~ * .sl-thumb,.sl-root .sl-thumb.sl-drag{transition:none;cursor:grabbing;}',
    '.sl-root .sl-vbar{position:absolute;width:4px;border-radius:2px;background:rgba(150,170,220,.18);z-index:3;opacity:0;transition:opacity .3s ease;}',
    '.sl-root .sl-vbar i{position:absolute;left:0;right:0;border-radius:2px;background:rgba(150,180,255,.55);}',
    '.sl-root .sl-vscroll:hover ~ .sl-vbar,.sl-root .sl-vbar.sl-on{opacity:1;}',
    /* 드롭다운(사이트) */
    '.sl-root .sl-menu{position:absolute;z-index:80;min-width:142px;padding:4px 0;border:1px solid #57a2fe;border-radius:6px;background:rgba(14,18,52,.97);box-shadow:0 10px 24px rgba(0,0,0,.45);opacity:0;translate:0 -6px;pointer-events:none;transition:opacity .2s ease,translate .25s ' + EASE + ';font:500 14px/1 "Pretendard Variable",Pretendard,sans-serif;color:#dfe6ff;}',
    '.sl-root .sl-menu.sl-open{opacity:1;translate:0 0;pointer-events:auto;}',
    '.sl-root .sl-menu button{display:block;width:100%;padding:9px 14px;border:0;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer;}',
    '.sl-root .sl-menu button:hover{background:rgba(87,162,254,.18);color:#fff;}',
    '.sl-root .sl-menu button.cur{color:#71e2ff;}',
    /* 툴팁 · 토스트 */
    '.sl-root .sl-tip{position:absolute;left:0;top:0;z-index:90;max-width:300px;padding:7px 11px;border:1px solid rgba(87,162,254,.75);border-radius:7px;background:rgba(10,12,40,.95);color:#e6eeff;font:500 13px/1.35 "Pretendard Variable",Pretendard,sans-serif;pointer-events:none;opacity:0;translate:0 4px;transition:opacity .16s ease,translate .2s ' + EASE + ';box-shadow:0 6px 18px rgba(0,0,0,.35);width:max-content;word-break:keep-all;}',
    '.sl-root .sl-tip.on{opacity:1;translate:0 0;}',
    '.sl-root .sl-toast{position:absolute;left:50%;top:84px;z-index:95;translate:-50% -8px;opacity:0;padding:10px 20px;border:1px solid rgba(87,162,254,.75);border-radius:10px;background:rgba(10,12,40,.95);color:#e6eeff;font:600 15px/1 "Pretendard Variable",Pretendard,sans-serif;pointer-events:none;transition:opacity .25s ease,translate .3s ' + EASE + ';white-space:nowrap;box-shadow:0 0 14px rgba(87,162,254,.35);}',
    '.sl-root .sl-toast.on{opacity:1;translate:-50% 0;}',
    /* 패널 옮기기 · 차트 바꾸기 */
    '.dt-editing .sl-root .sl-mv,.sl-root.sl-edit-layout .sl-mv{cursor:grab!important;}',
    '.dt-editing .sl-root .sl-mv *,.sl-root.sl-edit-layout .sl-mv *{cursor:grab!important;}',
    '.dt-editing .sl-root .sl-mvbg:hover,.sl-root.sl-edit-layout .sl-mvbg:hover{outline:1px dashed rgba(var(--sl-acc),.9);outline-offset:3px;}',
    '.sl-root .sl-front{z-index:20;}',
    '.sl-root .sl-dragging{filter:drop-shadow(0 14px 22px rgba(0,0,0,.45));z-index:30!important;}',
    '.sl-root .sl-resetbtn{position:absolute;left:300px;top:66px;z-index:45;display:none;height:26px;padding:0 14px;border:1px solid rgb(var(--sl-acc));border-radius:8px;background:#0e1234;color:#e6f0ff;font:500 13px/1 "Pretendard Variable",Pretendard,sans-serif;cursor:pointer;}',
    '.sl-root .sl-resetbtn:hover{filter:brightness(1.25);box-shadow:0 0 12px rgba(var(--sl-acc),.6);}',
    '.dt-editing .sl-root .sl-resetbtn,.sl-root.sl-edit-layout .sl-resetbtn{display:block;}',
    '.dt-editing .sl-root [data-name]{animation-play-state:paused!important;}',
    '.sl-root .sl-chost{position:absolute;z-index:6;pointer-events:auto;}',
    '.sl-root .sl-hid{visibility:hidden!important;}',
    '.sl-root .sl-chartbtn.sl-chartbtn{position:absolute;z-index:46;right:auto;width:auto;}',
    '.sl-root .sl-chartmenu.sl-chartmenu{position:absolute;z-index:47;right:auto;}',
    '.sl-root .sl-chartbtn{position:absolute;top:-11px;right:14px;z-index:25;display:none;align-items:center;gap:4px;height:22px;padding:0 9px;border:1px solid rgb(var(--sl-acc));background:#06264a;color:#e6f7ff;font:500 12px/1 Pretendard,system-ui,sans-serif;cursor:pointer;white-space:nowrap;}',
    '.sl-root .sl-chartbtn:hover{filter:brightness(1.25);box-shadow:0 0 12px rgba(var(--sl-acc),.6);}',
    '.dt-editing .sl-root .sl-chartbtn,.dt-content-editing .sl-root .sl-chartbtn,.sl-root.sl-edit-layout .sl-chartbtn{display:inline-flex;}',
    '.sl-root .sl-chartmenu{position:absolute;top:14px;right:14px;z-index:40;min-width:208px;padding:5px;border:1px solid #2a7ca0;background:#071a30;color:#c7ecf4;font:400 13px/1.35 Pretendard,system-ui,sans-serif;box-shadow:0 12px 28px rgba(0,0,0,.5);opacity:0;translate:0 -4px;pointer-events:none!important;transition:opacity .16s ease,translate .16s ease;}',
    '.sl-root .sl-chartmenu.open{opacity:1;translate:0 0;pointer-events:auto!important;}',
    '.sl-root .sl-chartmenu .hd{padding:4px 8px 6px;font-size:11px;color:#8ea6b3;white-space:nowrap;}',
    '.sl-root .sl-chartmenu button{display:flex;align-items:center;gap:8px;width:100%;padding:6px 8px;border:0;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer!important;white-space:nowrap;}',
    '.sl-root .sl-chartmenu button:hover{background:rgba(var(--sl-acc),.14);color:#fff;}',
    '.sl-root .sl-chartmenu button.cur{background:rgba(9,182,251,.26);color:#fff;}',
    '.sl-root .sl-chartmenu .ic{width:18px;height:14px;flex:none;}',
    '.sl-root .sl-chartmenu .rec{margin-left:auto;padding:1px 6px;background:rgb(var(--sl-acc));color:#03202e;font-size:10px;font-weight:700;}',
    '.sl-root .sl-chartmenu .sep{height:1px;margin:4px 2px;background:rgba(199,236,244,.16);}',
    '.sl-root .sl-chart{position:absolute;inset:0;display:flex;flex-direction:column;padding:10px 14px 8px;background:linear-gradient(180deg,rgba(14,32,54,.97),rgba(12,26,46,.97));box-shadow:inset 0 0 0 1px rgba(42,124,160,.75);color:#c7ecf4;font:400 12px/1.3 Pretendard,system-ui,sans-serif;animation:slIn2 .35s ease;}',
    '.sl-root .sl-chart .pl,.sl-root .sl-chart .lg,.sl-root .sl-chart .ct i,.sl-root .sl-chart .ct b{filter:hue-rotate(var(--sl-chue,0deg));}',
    '.sl-root .sl-chart .ct{display:flex;align-items:center;gap:6px;font-weight:500;font-size:15px;color:#fff;white-space:nowrap;}',
    '.sl-root .sl-chart .ct i{display:block;width:8px;height:8px;background:#2a7ca0;flex:none;}',
    '.sl-root .sl-chart .ct b{margin-left:auto;font-family:Tomorrow,Pretendard,sans-serif;font-weight:400;font-size:18px;color:#00ffd2;}',
    '.sl-root .sl-chart .ct b small{font:400 11px Pretendard,sans-serif;color:#8ea6b3;margin-left:3px;}',
    '.sl-root .sl-chart .lg{display:flex;gap:10px;margin-top:3px;font-size:11px;color:#8ea6b3;white-space:nowrap;}',
    '.sl-root .sl-chart .lg span{display:inline-flex;align-items:center;gap:4px;}',
    '.sl-root .sl-chart .lg span:before{content:"";width:9px;height:3px;background:var(--c);}',
    '.sl-root .sl-chart .pl{position:relative;flex:1;min-height:0;margin-top:6px;}',
    '.sl-root .sl-chart svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;}',
    '.sl-root .sl-chart .ax{fill:#8ea6b3;font-size:11px;font-family:Pretendard,system-ui,sans-serif;}',
    '.sl-root .sl-chart .gl{stroke:rgba(142,166,179,.16);stroke-width:1;shape-rendering:crispEdges;}',
    '.sl-root .sl-chart .bars{position:absolute;inset:0 0 16px;display:flex;align-items:flex-end;justify-content:space-around;gap:8px;}',
    '.sl-root .sl-chart .bars > div{position:relative;flex:1;max-width:34px;height:100%;display:flex;align-items:flex-end;}',
    '.sl-root .sl-chart .bars i{display:block;width:100%;background:linear-gradient(180deg,var(--c),rgba(9,182,251,.18));transition:height .9s ' + EASE + ';}',
    '.sl-root .sl-chart .bars em{position:absolute;left:50%;translate:-50% 0;bottom:calc(var(--h) + 2px);font-style:normal;font-size:11px;color:#e6f7ff;white-space:nowrap;transition:bottom .9s ' + EASE + ';}',
    '.sl-root .sl-chart .bars u{position:absolute;left:50%;translate:-50% 0;bottom:-16px;text-decoration:none;font-size:11px;color:#8ea6b3;white-space:nowrap;}',
    '.sl-root .sl-chart .hb{display:flex;flex-direction:column;justify-content:space-around;height:100%;gap:3px;}',
    '.sl-root .sl-chart .hb > div{display:grid;grid-template-columns:72px 1fr 50px;align-items:center;gap:8px;font-size:12px;}',
    '.sl-root .sl-chart .hb s{position:relative;display:block;height:8px;background:rgba(142,166,179,.16);overflow:hidden;text-decoration:none;}',
    '.sl-root .sl-chart .hb s i{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,rgba(9,182,251,.5),var(--c));transition:width .9s ' + EASE + ';}',
    '.sl-root .sl-chart .hb b{text-align:right;color:#fff;font-weight:500;font-variant-numeric:tabular-nums;}',
    '.sl-root .sl-chart .arc{transition:stroke-dasharray .9s ' + EASE + ',stroke-dashoffset .9s ' + EASE + ';}',
    '.sl-root .sl-chart .gv{position:absolute;left:0;right:0;bottom:0;text-align:center;font-family:Tomorrow,Pretendard,sans-serif;font-size:22px;color:#00ffd2;}',
    '.sl-root .sl-chart .gv small{font:400 12px Pretendard,sans-serif;color:#8ea6b3;margin-left:2px;}',
    '.sl-root .sl-chart .dn{display:flex;align-items:center;gap:16px;height:100%;}',
    '.sl-root .sl-chart .dn .ring{position:relative;height:100%;aspect-ratio:1;flex:none;}',
    '.sl-root .sl-chart .dn .ring b{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Tomorrow,Pretendard,sans-serif;font-weight:400;font-size:17px;color:#fff;}',
    '.sl-root .sl-chart .dn .ring b small{font:400 10px Pretendard,sans-serif;color:#8ea6b3;}',
    '.sl-root .sl-chart .dn ul{list-style:none;display:flex;flex-direction:column;gap:4px;font-size:12px;min-width:0;flex:1;}',
    '.sl-root .sl-chart .dn li{display:flex;align-items:center;gap:6px;white-space:nowrap;}',
    '.sl-root .sl-chart .dn li:before{content:"";width:9px;height:3px;background:var(--c);flex:none;}',
    '.sl-root .sl-chart .dn li b{margin-left:auto;color:#fff;font-weight:500;font-variant-numeric:tabular-nums;}',
    /* 라이트 */
    '.sl-root[data-theme="light"] .sl-tab:not(.sl-act):hover{color:#0f2a55!important;text-shadow:0 0 8px rgba(30,100,230,.3);}',
    '.sl-root[data-theme="light"] .sl-btn:hover{filter:brightness(.96) drop-shadow(0 2px 6px rgba(30,90,200,.3));}',
    '.sl-root[data-theme="light"] .sl-row.sl-on{filter:brightness(.96);box-shadow:inset 3px 0 0 rgba(60,110,230,.7);}',
    '.sl-root[data-theme="light"] .sl-card.sl-on,.sl-root[data-theme="light"] .sl-node.sl-on{filter:drop-shadow(0 6px 12px rgba(30,60,120,.18));}',
    '.sl-root[data-theme="light"] .sl-flash{text-shadow:0 0 8px rgba(30,110,230,.45);}',
    '.sl-root[data-theme="light"] .sl-dim{background:rgba(20,30,50,.35);}',
    '.sl-root[data-theme="light"] .sl-menu{background:#fff;color:#1c2b45;border-color:#8fb0e8;box-shadow:0 10px 24px rgba(30,60,100,.16);}',
    '.sl-root[data-theme="light"] .sl-menu button:hover{background:#eaf1fc;color:#0f2a55;}',
    '.sl-root[data-theme="light"] .sl-menu button.cur{color:#1d5fd0;}',
    '.sl-root[data-theme="light"] .sl-vbar{background:rgba(60,80,120,.12);}',
    '.sl-root[data-theme="light"] .sl-vbar i{background:rgba(60,100,200,.45);}',
    '.sl-root[data-theme="light"] .sl-tip,.sl-root[data-theme="light"] .sl-toast{background:#fff;color:#15253a;border-color:#8fb0e8;box-shadow:0 8px 22px rgba(30,60,100,.16);}',
    '.sl-root[data-theme="light"] .sl-dragging{filter:drop-shadow(0 14px 22px rgba(30,60,100,.22));}',
    '.sl-root[data-theme="light"] .sl-resetbtn{background:#fff;color:#15253a;}',
    '.sl-root[data-theme="light"] .sl-chart{background:#fff;box-shadow:inset 0 0 0 1px #d9e2ea;color:#2c3e54;}',
    '.sl-root[data-theme="light"] .sl-chart .ct{color:#15253a;}',
    '.sl-root[data-theme="light"] .sl-chartbtn{background:#fff;color:#2457c5;box-shadow:0 2px 6px rgba(30,60,100,.14);}',
    '.sl-root[data-theme="light"] .sl-chart .ct b,.sl-root[data-theme="light"] .sl-chart .gv{color:#1d4fc0;}',
    '.sl-root[data-theme="light"] .sl-chart .ct b small,.sl-root[data-theme="light"] .sl-chart .gv small,.sl-root[data-theme="light"] .sl-chart .lg,.sl-root[data-theme="light"] .sl-chart .bars u{color:#5a6c82;}',
    '.sl-root[data-theme="light"] .sl-chart .ax{fill:#5a6c82;}',
    '.sl-root[data-theme="light"] .sl-chart .bars em,.sl-root[data-theme="light"] .sl-chart .hb b,.sl-root[data-theme="light"] .sl-chart .dn b{color:#15253a;}',
    '.sl-root[data-theme="light"] .sl-chart .gl{stroke:#e4ebf1;}',
    '.sl-root[data-theme="light"] .sl-chartmenu{background:#fff;color:#2c3e54;border-color:#d9e2ea;box-shadow:0 8px 22px rgba(30,60,100,.14);}',
    '.sl-root[data-theme="light"] .sl-chartmenu button:hover,.sl-root[data-theme="light"] .sl-chartmenu button.cur{color:#15253a;}',
  ].join('\n');

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  /* 팝업 조각 시트 — 미리보기 페이지에는 없으니 모듈이 실려 있으면 직접 꽂는다(스튜디오는 secmon.js 가 꽂아 둔다) */
  function injectSheet(name, id) {
    if (!window[name] || document.getElementById(id)) return;
    var st = document.createElement('style');
    st.id = id;
    st.textContent = window[name];
    document.head.appendChild(st);
  }

  /* ══════════════════ 도구 ══════════════════ */
  function all(root, sel) { return root ? Array.prototype.slice.call(root.querySelectorAll(sel)) : []; }
  function one(root, sel) { return root ? root.querySelector(sel) : null; }
  function kids(el) { return el ? Array.prototype.slice.call(el.children) : []; }
  function nm(el) { return (el && el.getAttribute && el.getAttribute('data-name')) || ''; }
  function txt(el) { return el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : ''; }
  function editing() { return !!document.querySelector('.dtstage.dt-content-editing, .dtstage.dt-editing, .dt-content-editing, .dt-editing'); }
  function layoutEditing(root) { return !!(root.closest('.dt-editing') || root.classList.contains('sl-edit-layout')); }
  function load(k) { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function comma(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function idle() { return typeof window.__wembIdle === 'function' ? window.__wembIdle() : document.hidden; }
  function pick(a) { return a[(Math.random() * a.length) | 0]; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function isContents(el) { return getComputedStyle(el).display === 'contents'; }
  /* 사람이 고친 글자는 덮지 않는다 */
  function claimed(p) { return p.__slLast != null && p.textContent !== p.__slLast; }
  function write(p, s) {
    if (!p || p === document.activeElement || claimed(p)) return false;
    if (p.textContent !== s) p.textContent = s;
    p.__slLast = p.textContent;
    return true;
  }
  function flash(p) {
    if (!p) return;
    p.classList.add('sl-flash');
    setTimeout(function () { p.classList.remove('sl-flash'); }, 700);
  }
  function clickable(el, fn, cls) {
    if (!el || el.__slClick) return;
    el.__slClick = true;
    el.classList.add('sl-click');
    if (cls) el.classList.add(cls);
    el.addEventListener('click', function (e) {
      if (editing()) return;
      e.stopPropagation();
      fn(e);
    });
  }
  function tip(el, s) { if (el && s && !el.getAttribute('data-sl-tip')) el.setAttribute('data-sl-tip', s); }
  function frameOf(root) { return root.querySelector(':scope > [data-node-id]'); }
  function boxes(el) {
    if (!el || el.nodeType !== 1) return [];
    if (!isContents(el)) return [el];
    var out = [];
    kids(el).forEach(function (c) { out = out.concat(boxes(c)); });
    return out;
  }
  /* 무리(contents 묶음 포함) 전체에 같은 동작 — 오버 · 누름은 무리의 모든 상자에서 받는다 */
  function groupHover(els, on, off) {
    var n = 0;
    els.forEach(function (b) {
      b.addEventListener('pointerenter', function () { if (n++ === 0) on(); });
      b.addEventListener('pointerleave', function () { if (--n <= 0) { n = 0; off(); } });
    });
  }
  function place(el) {
    var x = (el.__fx || 0) + (el.__ux || 0) + (el.__dx || 0) + (el.__ox || 0);
    var y = (el.__fy || 0) + (el.__uy || 0) + (el.__dy || 0) + (el.__oy || 0);
    el.style.translate = (x || y) ? x.toFixed(2) + 'px ' + y.toFixed(2) + 'px' : '';
  }
  function rectIn(el, st) {
    var r = el.getBoundingClientRect(), f = st.frame.getBoundingClientRect(), S = (f.width / BASE_W) || st.S || 1;
    var x = (r.left - f.left) / S - (el.__fx || 0) - (el.__ux || 0) - (el.__ox || 0), y = (r.top - f.top) / S - (el.__fy || 0) - (el.__uy || 0) - (el.__oy || 0);
    return { x: x, y: y, w: r.width / S, h: r.height / S };
  }
  function unionRect(els, st) {
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    els.forEach(function (e) { var r = rectIn(e, st); if (!r.w && !r.h) return; x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y); x1 = Math.max(x1, r.x + r.w); y1 = Math.max(y1, r.y + r.h); });
    return x0 > x1 ? null : { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  function inRect(r, R, pad) { var cx = r.x + r.w / 2, cy = r.y + r.h / 2; pad = pad || 0; return cx >= R.x - pad && cx <= R.x + R.w + pad && cy >= R.y - pad && cy <= R.y + R.h + pad; }
  function goto(scene) {
    if (window.__gotoSecmonScene) { window.__gotoSecmonScene(scene); return; }
    location.href = scene + '.html' + location.search;
  }
  function toast(st, msg) {
    var t = st.toast;
    if (!t) { t = st.toast = document.createElement('div'); t.className = 'sl-toast'; st.frame.appendChild(t); }
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(st.toastT);
    st.toastT = setTimeout(function () { t.classList.remove('on'); }, 1900);
  }
  function shiftMs() { return Date.now() - BASE_TIME; }
  function fmtT(d) { return p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds()); }
  function fmtD(d) { return d.getFullYear() + '/' + p2(d.getMonth() + 1) + '/' + p2(d.getDate()) + ' ' + DAYS[d.getDay()]; }
  var T_RE = /^(\d{2}):(\d{2}):(\d{2})$/, DT_RE = /^(\d{4})[-./](\d{2})[-./](\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/;
  /* 숫자 글자를 같은 꼴(쉼표 · 소수 · 앞뒤 글자)로 다시 쓴다 */
  function numOf(s) { var m = /^([^\d-]*)(-?[\d,]*\.?\d+)(.*)$/.exec(s); if (!m) return null; return { pre: m[1], v: parseFloat(m[2].replace(/,/g, '')), dec: (m[2].split('.')[1] || '').length, comma: m[2].indexOf(',') >= 0 || Math.abs(parseFloat(m[2].replace(/,/g, ''))) >= 10000, post: m[3] }; }
  function numStr(o, v) { var s = o.dec ? v.toFixed(o.dec) : String(Math.round(v)); if (o.comma) s = s.replace(/^(-?\d+)/, function (x) { return x.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }); return o.pre + s + o.post; }
  function bump(p, fn) {
    var o = numOf(txt(p));
    if (!o) return false;
    var v = fn(o.v);
    if (v === o.v) return false;
    if (write(p, numStr(o, v))) { flash(p); return true; }
    return false;
  }
  function paused(st) { return st.paused || editing() || idle(); }

  /* ══════════════════ 1. 장면 · 패널 무리 ══════════════════
     패널 = 화면 맞추기 · 패널 옮기기 · 차트 바꾸기의 단위. 대부분 Widget/* 묶음이고(묶음 밖에 떨어진 조각은 그 위젯 판 안에 있으면 같이 간다),
     통합관제현황은 위젯으로 묶이지 않은 판(지연서비스 Top10 · KPI 4칸 · VM 목록)을 따로 정한다. */
  var SCENE_OF = { smm: 'main', smc: 'channel', sms: 'micro', smq: 'mq', smi: 'infra', sme: 'event' };
  var MENU = { '통합관제현황': 'main', '채널현황': 'channel', '마이크로 서비스현황': 'micro', '메시지큐현황': 'mq', 'NKS현황': null, '인프라현황': 'infra', '이벤트현황': 'event' };
  function bgBox(els, st) {
    var best = null, ba = 0;
    els.forEach(function (e) { if (!/^(Background|Shape|Panel)$/.test(nm(e))) return; var r = rectIn(e, st), a = r.w * r.h; if (a > ba) { ba = a; best = r; } });
    return best || unionRect(els, st);
  }
  function buildPanels(root, st) {
    var frame = st.frame, claimed = new Set(), panels = [];
    function add(name, els, rect) {
      els = els.filter(function (e) { return e && !claimed.has(e); });
      if (!els.length) return null;
      els.forEach(function (e) { claimed.add(e); });
      var p = { name: name, els: els, rect: rect || bgBox(els, st) };
      panels.push(p);
      return p;
    }
    if (st.scene === 'main') {
      all(root, '[data-name="KPI Bar"] > [data-name="Content"]').forEach(function (c, i) { add('KPI/' + (i + 1), [c]); });
      var vm = one(root, '[data-name="VM Panel"]');
      add('VM Panel', [vm, one(root, '[data-name="Widget/Overview Board"] > [data-name="Legend"]'), one(root, '[data-name="Widget/Overview Board"] > [data-name="Max Value"]')].reduce(function (a, e) { return a.concat(boxes(e)); }, []), vm ? rectIn(vm, st) : null);
      add('Widget/Key Service Transactions', boxes(one(root, '[data-name="Widget/Key Service Transactions"]')));
      var cr = one(frame, ':scope > [data-name="Chart Row"]');
      if (cr) { st.chartRow = add('Chart Row', boxes(cr), { x: 0, y: 734, w: 1430, h: 290 }); }
      add('Widget/Overview Board', boxes(one(root, '[data-name="Widget/Overview Board"]')), { x: 40, y: 140, w: 1160, h: 590 });
      panels.push({ name: 'Delay Top10', els: [], rect: { x: 1470, y: 150, w: 412, h: 536 }, loose: true });
    } else {
      var seen = {};
      all(frame, '[data-name^="Widget/"]').forEach(function (w) {
        if (w.parentElement && w.parentElement.closest('[data-name^="Widget/"]')) return;
        var n = nm(w); seen[n] = (seen[n] || 0) + 1;
        add(seen[n] > 1 ? n + ' #' + seen[n] : n, boxes(w));
      });
    }
    /* 묶음 밖 조각 — 판 안(가운데 점)에 있으면 그 판으로. 작은 판부터 본다 */
    var order = panels.slice().sort(function (a, b) { return (a.rect.w * a.rect.h) - (b.rect.w * b.rect.h); });
    var loose = [];
    (function walk(el) {
      kids(el).forEach(function (c) {
        if (claimed.has(c) || /^sl-/.test(c.className) || /-mount|-dim/.test(c.className) || nm(c) === 'Button/Open Panel') return;   /* 얹힌 팝업 상자(smx-mount …)는 패널이 아니다 */
        if (isContents(c)) { walk(c); return; }
        loose.push(c);
      });
    })(frame);
    /* 제목줄뿐인 위젯(마이크로 서비스의 N-POD 판) — 그 제목을 품은 큰 바탕 조각(Shape · Background)을 판 바탕으로 */
    loose.forEach(function (c) {
      if (!/^(Shape|Background|Panel)$/.test(nm(c)) || claimed.has(c)) return;
      var r = rectIn(c, st);
      if (r.w * r.h < 40000 || (r.w >= 1800 && r.h >= 1000)) return;
      panels.forEach(function (p) {
        if (claimed.has(c) || p.rect.w * p.rect.h > r.w * r.h * 0.3) return;
        var cx = p.rect.x + p.rect.w / 2, cy = p.rect.y + p.rect.h / 2;
        if (cx >= r.x && cx <= r.x + r.w && cy >= r.y - 30 && cy <= r.y + r.h) { p.rect = { x: Math.min(r.x, p.rect.x), y: Math.min(r.y, p.rect.y), w: Math.max(r.x + r.w, p.rect.x + p.rect.w) - Math.min(r.x, p.rect.x), h: Math.max(r.y + r.h, p.rect.y + p.rect.h) - Math.min(r.y, p.rect.y) }; p.els.push(c); claimed.add(c); }
      });
    });
    order = panels.slice().sort(function (a, b) { return (a.rect.w * a.rect.h) - (b.rect.w * b.rect.h); });
    loose.forEach(function (c) {
      var n = nm(c);
      if (/^(Header|Event Bar|event|Dim)$/.test(n)) return;   /* 표 줄 바탕 · 구분선도 판을 따라간다(전체 화면 바탕만 아래에서 뺀다) */
      if (c.closest('[data-name="Header"], [data-name="Event Bar"]')) return;
      var r = rectIn(c, st);
      if (r.w >= 1800 && r.h >= 1000) return;
      for (var i = 0; i < order.length; i++) {
        if (inRect(r, order[i].rect, 4)) { order[i].els.push(c); claimed.add(c); return; }
      }
    });
    panels = panels.filter(function (p) { return p.els.length; });
    panels.forEach(function (p, i) { p.i = i; });
    st.panels = panels;
    st.claimed = claimed;
  }

  /* ══════════════════ 2. 화면 맞추기 ══════════════════
     판이 16:9 보다 넓으면 exW, 높으면 exH 가 남는다. 패널은 자리(왼 · 가운데 · 오른 / 위 · 가운데 · 아래)에 따라 0 · ½ · 1 만큼,
     바탕 · 헤더 띠 · 이벤트 바 띠는 늘어나고 그 안 조각은 자리에 따라 옮긴다. */
  function installFit(root, st) {
    var frame = st.frame;
    frame.style.position = 'absolute';
    frame.style.left = '0';
    frame.style.top = '0';
    frame.style.transformOrigin = '0 0';
    frame.style.width = BASE_W + 'px';
    frame.style.height = BASE_H + 'px';
    var fill = document.createElement('div');
    fill.className = 'sl-bgfill';
    var fcs = getComputedStyle(frame);
    fill.style.backgroundImage = fcs.backgroundImage;
    fill.style.backgroundColor = fcs.backgroundColor;
    frame.insertBefore(fill, frame.firstChild);
    st.bgfill = fill;
    buildPanels(root, st);
    st.panels.forEach(function (p) {
      var r = p.rect, cx = r.x + r.w / 2, cy = r.y + r.h / 2;
      p.ax = r.w >= 1500 ? 0.5 : cx < 600 ? 0 : cx > 1320 ? 1 : 0.5;
      /* 세로는 패널 묶음을 통째로 헤더 바로 아래에(이벤트 바만 아래로) — 패널마다 0 · ½ · 1 로 나누면 KPI 줄과 판 사이가 찢어졌다 */
      p.ay = p.name === 'Chart Row' ? 1 : 0;   /* 통합관제현황 아래 차트 판은 이벤트 바 바로 위에 */
      p.els.forEach(function (e) { e.classList.add('sl-place', 'sl-unit'); e.style.setProperty('--i', p.i); });
    });
    /* 띠 — 폭 1500 이상(바탕 · 헤더 줄 · 이벤트 바 바탕 · KPI 판)은 늘이고, 그 안의 나머지 조각은 자리대로 */
    var bars = [], movers = [];
    function band(el, ky) {
      (function walk(e) {
        kids(e).forEach(function (c) {
          if (isContents(c)) { walk(c); return; }
          if (st.claimed.has(c)) return;
          var w = c.offsetWidth;
          if (w >= 1500) { bars.push({ el: c, w0: w, h0: c.offsetHeight, ky: ky }); return; }
          var r = rectIn(c, st), cx = r.x + r.w / 2;
          movers.push({ el: c, k: cx < 640 ? 0 : cx > 1100 ? 1 : 0.5, ky: ky == null ? (r.y > 900 ? 1 : 0) : ky });
          c.classList.add('sl-place');
        });
      })(el);
    }
    kids(frame).forEach(function (c) {
      if (c === fill || st.claimed.has(c)) return;
      var n = nm(c);
      if (n === 'Header' || n === 'Event Bar') { if (!isContents(c) && c.offsetWidth >= 1500) bars.push({ el: c, w0: c.offsetWidth, h0: c.offsetHeight, ky: 0, keep: true }); band(c, n === 'Header' ? 0 : 1); }
      else if (nm(c) === 'Button/Open Panel') band(c, 1);   /* 차트 판 접힘 탭 — 조각이 갈라지지 않게 통째로 판과 함께 */
      else if (isContents(c)) band(c, null);
      else {
        var r = rectIn(c, st);
        if (r.w >= 1500) bars.push({ el: c, w0: c.offsetWidth, h0: c.offsetHeight, ky: r.y > 900 ? 1 : 0, bg: r.h >= 1000 });
        else { movers.push({ el: c, k: (r.x + r.w / 2) < 640 ? 0 : (r.x + r.w / 2) > 1100 ? 1 : 0.5, ky: r.y > 900 ? 1 : 0 }); c.classList.add('sl-place'); }
      }
    });
    function layoutFn() {
      var W = root.clientWidth, H = root.clientHeight;
      if (!W || !H) return;
      var S = Math.min(W / BASE_W, H / BASE_H);
      var VW = W / S, VH = H / S, exW = Math.max(0, VW - BASE_W), exH = Math.max(0, VH - BASE_H);
      if (exW < 0.01) exW = 0;
      if (exH < 0.01) exH = 0;
      st.S = S; st.exW = exW; st.exH = exH;
      frame.style.overflow = 'visible';
      frame.style.transform = S === 1 ? 'none' : 'scale(' + S + ')';
      fill.style.width = (BASE_W + exW) + 'px';
      fill.style.height = (BASE_H + exH) + 'px';
      bars.forEach(function (b) {
        b.el.style.width = (b.w0 + exW) + 'px';
        if (b.bg) b.el.style.height = (b.h0 + exH) + 'px';
        else if (!b.keep) { b.el.__fy = exH * b.ky; place(b.el); }
      });
      movers.forEach(function (m) { m.el.__fx = exW * m.k; m.el.__fy = exH * m.ky; place(m.el); });
      st.panels.forEach(function (p) { p.els.forEach(function (e) { e.__fx = exW * p.ax; e.__fy = exH * p.ay; place(e); }); });
      (st.onLayout || []).forEach(function (f) { try { f(); } catch (e) { } });
    }
    var rsT = 0;
    function relayout() {
      root.classList.add('sl-resizing');
      layoutFn();
      clearTimeout(rsT);
      rsT = setTimeout(function () { root.classList.remove('sl-resizing'); }, 140);
    }
    layoutFn();
    st.layout = layoutFn;
    if (window.ResizeObserver) { st.ro = new ResizeObserver(relayout); st.ro.observe(root); }
    else { st.onResize = relayout; window.addEventListener('resize', relayout); }
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('sl-live'); }); });
  }
  function panelOf(st, el) {
    for (var i = 0; i < st.panels.length; i++) { var p = st.panels[i]; for (var j = 0; j < p.els.length; j++) if (p.els[j] === el || p.els[j].contains(el)) return p; }
    return null;
  }
  /* 새로 만든 상자를 그 판에 넣는다(옮기기 · 맞추기를 같이 받게) */
  function detach(st, el) {
    (st.panels || []).forEach(function (p) { var i = p.els.indexOf(el); if (i >= 0) p.els.splice(i, 1); });
    el.__fx = el.__fy = el.__ux = el.__uy = 0;
    el.classList.remove('sl-place', 'sl-unit', 'sl-mv', 'sl-mvbg');
    place(el);
  }
  function adopt(st, p, el) {
    if (!p) return;
    p.els.push(el);
    el.classList.add('sl-place');
    el.__fx = (st.exW || 0) * p.ax; el.__fy = (st.exH || 0) * p.ay;
    var a = p.els[0]; el.__ux = a.__ux || 0; el.__uy = a.__uy || 0;
    place(el);
  }

  /* ══════════════════ 3. 시계 · 최근 시각 ══════════════════ */
  function installClock(root, st) {
    var ck = one(root, '[data-name="Header"] [data-name="Clock"]');
    if (!ck) return;
    var pd = one(ck, '[data-name="Date"]'), pt = one(ck, '[data-name="Time"]');
    function tick() { var d = new Date(); write(pd, fmtD(d)); write(pt, fmtT(d)); }
    tick();
    st.timers.push(setInterval(tick, 1000));
  }
  /* 이벤트 발생시각 — Figma 기준 시각(13:42:18)과의 간격을 그대로 두고 '지금' 쪽으로(열 때마다 최근) */
  function recentIn(scope) {
    var sh = shiftMs();
    all(scope, 'p').forEach(function (p) {
      if (p.closest('[data-name="Header"]') || p.children.length) return;
      var s = txt(p), m;
      if ((m = T_RE.exec(s))) {
        var base = new Date(BASE_TIME); base.setHours(+m[1], +m[2], +m[3], 0);
        if (base.getTime() > BASE_TIME + 60000) return;
        write(p, fmtT(new Date(base.getTime() + sh)));
      } else if ((m = DT_RE.exec(s))) {
        var d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
        var n = new Date(d.getTime() + sh), sep = s.charAt(4);
        write(p, n.getFullYear() + sep + p2(n.getMonth() + 1) + sep + p2(n.getDate()) + ' ' + fmtT(n));
      }
    });
  }
  function installRecent(root, st) {
    all(root, '[data-name^="Row/"], [data-name="Event List"], [data-name^="Popup/"], [data-name="Event Panel (Expanded)"], [data-name="Widget/Event Status"]').forEach(function (g) { if (!g.parentElement.closest('[data-name^="Row/"]')) recentIn(g); });
  }

  /* ══════════════════ 4. 헤더 ══════════════════ */
  var SITES = ['전체 사이트', '남부 센터', '북부 센터', 'DR 센터'];
  function installNav(root, st) {
    var hdr = one(root, '[data-name="Header"]');
    if (!hdr) return;
    all(hdr, '[data-name="Nav"] > [data-name="Label"]').forEach(function (p) {
      var label = txt(p), key = MENU[label];
      p.classList.add('sl-tab');
      if (key === st.scene) p.classList.add('sl-act');
      tip(p, key ? label + ' 화면으로' : label + ' — 이 시안에 없는 화면');
      clickable(p, function () {
        if (key === undefined) return;
        if (!key) { toast(st, label + ' 화면은 이 시안에 없습니다'); return; }
        if (key !== st.scene) goto(key);
      });
    });
    var logo = one(hdr, '[data-name^="Logo"]');
    if (logo) { logo.style.cursor = 'pointer'; tip(logo, '통합관제현황으로'); clickable(logo, function () { if (st.scene !== 'main') goto('main'); }); }
    var out = one(hdr, '[data-name="Button/Logout"]');
    if (out) { out.classList.add('sl-btn'); tip(out, '로그아웃'); clickable(out, function () { toast(st, '로그아웃은 시안에서 동작하지 않습니다'); }); }
    /* 사이트 고르기 — 드롭다운 */
    var sel = one(hdr, '[data-name="Select Menu"]'), lab = sel && one(sel, '[data-name="Label"]');
    if (sel && lab) {
      sel.classList.add('sl-btn');
      tip(sel, '관제 사이트 고르기');
      var cur = load(K_SITE).site;
      if (cur && SITES.indexOf(cur) >= 0) write(lab, cur);
      var menu = document.createElement('div');
      menu.className = 'sl-menu';
      st.frame.appendChild(menu);
      function render() { var c = txt(lab); menu.innerHTML = SITES.map(function (s) { return '<button type="button"' + (s === c ? ' class="cur"' : '') + '>' + esc(s) + '</button>'; }).join(''); }
      function pos() { var r = rectIn(sel, st); menu.style.left = (r.x + (sel.__fx || 0)) + 'px'; menu.style.top = (r.y + r.h + 6) + 'px'; menu.style.minWidth = r.w + 'px'; }
      clickable(sel, function () { render(); pos(); menu.classList.toggle('sl-open'); });
      menu.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (!b) return;
        e.stopPropagation();
        write(lab, b.textContent);
        save(K_SITE, { site: b.textContent });
        menu.classList.remove('sl-open');
        toast(st, b.textContent + ' 기준으로 봅니다');
      });
      st.onDocClick = function (e) { if (!menu.contains(e.target) && !sel.contains(e.target)) menu.classList.remove('sl-open'); };
      document.addEventListener('pointerdown', st.onDocClick, true);
    }
  }

  /* ══════════════════ 5. 오버 · 단추 ══════════════════ */
  function installHover(root, st) {
    var frame = st.frame;
    /* Figma (Hover) 변형 — 같은 이름 단추 위에 겹쳐 있다. 평소엔 숨기고 그 단추에 올렸을 때만 */
    all(frame, '[data-name$=" (Hover)"]').forEach(function (hv) {
      var baseName = nm(hv).replace(/ \(Hover\)$/, '');
      var scope = hv.parentElement;
      var base = all(scope, ':scope > [data-name="' + baseName + '"]')[0] || all(frame, '[data-name="' + baseName + '"]')[0];
      var hb = boxes(hv);
      hb.forEach(function (b) { b.classList.add('sl-hv'); });
      if (!base) return;
      var bb = boxes(base);
      bb.forEach(function (b) { b.classList.add('sl-press'); });
      groupHover(bb, function () { hb.forEach(function (b) { b.classList.add('sl-on'); }); }, function () { hb.forEach(function (b) { b.classList.remove('sl-on'); }); });
    });
    /* 아이콘 단추 */
    all(frame, '[data-name^="Button/"]').forEach(function (b) {
      if (/\(Hover\)$/.test(nm(b))) return;
      boxes(b).forEach(function (x) { if (!x.classList.contains('sl-press')) x.classList.add('sl-btn'); });
    });
    /* 표 줄 · 목록 · 카드 · 노드 */
    function rowHover(sel, cls) {
      all(frame, sel).forEach(function (r) {
        var bs = boxes(r);
        bs.forEach(function (b) { b.classList.add(cls); });
        groupHover(bs, function () { bs.forEach(function (b) { b.classList.add('sl-on'); }); }, function () { bs.forEach(function (b) { b.classList.remove('sl-on'); }); });
      });
    }
    rowHover('[data-name^="Row/"], [data-name="List Item"], [data-name="VM List"]', 'sl-row');
    rowHover('[data-name="Metric Card"], [data-name="Redis Card"], [data-name^="Status Card/"], [data-name^="Count/"], [data-name="Section Title"]', 'sl-card');
    rowHover('[data-name="Node/POD"], [data-name="Node/DB"], [data-name="Node/TPQ"]', 'sl-node');
    all(frame, '[data-name="Node/POD"], [data-name="Node/DB"]').forEach(function (n) {
      var l = one(n, '[data-name^="Label"]');
      var name = l ? txt(one(l, '[data-name="Label"]') || l) : '';
      var val = l ? txt(one(l, '[data-name="Value"]')) : '';
      tip(boxes(n)[0], name + (val ? ' · POD ' + val + '개' : '') + ' — 게이지는 최근 TPS 부하');
    });
  }

  /* ══════════════════ 6. 이벤트 바 · 이벤트 판(펼침) · 팝업 ══════════════════ */
  var EV_POOL = [
    ['CRITICAL', 'ordap', '응답시간 임계치 초과', 'WASAPM'], ['MAJOR', 'acctdb', 'LOCK_WAIT_SESSION 임계치 초과', 'DBMON'], ['WARNING', 'mktrds', 'Redis 메모리 사용률 81.4%', 'REDIS'],
    ['MINOR', 'fepgw', '제휴은행 응답 지연 2.6초', 'FEPMON'], ['MAJOR', 'kfkbiz', 'Consumer LAG 증가', 'KAFKA'], ['WARNING', 'authap', 'BAD_RESPONSE_TIME_APPLICATION', 'WASAPM'],
    ['MINOR', 'batap', '배치 수행시간 증가', 'BATCH'], ['WARNING', 'mtsgw', '동시접속 세션 임계치 근접', 'CHANNEL'],
  ];
  var GRADE = { CRITICAL: 'CR', MAJOR: 'MA', MINOR: 'MI', WARNING: 'WA', NORMAL: 'NO' };
  function countEl(scope, g) { return scope ? one(scope, '[data-name="Count/' + g + '"] [data-name="Value"]') : null; }
  function installEventBar(root, st) {
    var frame = st.frame;
    var bar = one(frame, ':scope > [data-name="Event Bar"]');
    /* 이벤트 판(펼침) — 모듈이 실려 있으면 이 화면 위에 얹는다(미리보기에선 그 장면 페이지로) */
    var mount = null;
    function ensurePanel() {
      if (mount || typeof window.build_smx !== 'function') return mount;
      injectSheet('SMX_CSS', 'smx-style'); injectSheet('SMX_LIGHT_CSS', 'smx-light-style');
      mount = document.createElement('div');
      mount.className = 'sl-evmount';
      mount.setAttribute('data-name', 'Event Panel (Expanded)');
      mount.innerHTML = '<div class="smx-root" data-theme="' + (root.dataset.theme || 'dark') + '">' + window.build_smx() + '</div>';
      frame.appendChild(mount);
      var inner = one(mount, '.smx-root');
      inner.firstElementChild.style.position = 'absolute';
      inner.firstElementChild.style.left = '0'; inner.firstElementChild.style.top = '0';
      recentIn(mount);
      wireCounts(mount);
      var col = one(mount, '[data-name="Button/Collapse"]');
      if (col) { col.classList.add('sl-btn'); tip(col, '이벤트 판 접기'); clickable(col, function () { setPanel(false); }); }
      installHoverIn(mount);
      evColScroll(mount);
      st.evMount = mount;
      return mount;
    }
    function setPanel(on) {
      if (on && !ensurePanel()) { goto('eventpanel'); return; }
      if (!mount) return;
      mount.style.translate = (st.exW ? (st.exW / 2).toFixed(1) + 'px ' : '0px ') + (st.exH || 0).toFixed(1) + 'px';
      mount.classList.toggle('sl-open', on);
      var f = load(K_FOLD); f.events = on; save(K_FOLD, f);
    }
    st.setPanel = setPanel;
    if (bar) {
      var exp = one(bar, '[data-name="Button/Expand"]') || one(frame, '[data-name="Button/Expand"]');
      if (exp) { tip(exp, '이벤트 판 펼치기'); clickable(exp, function () { setPanel(!(mount && mount.classList.contains('sl-open'))); }); }
      /* Auto — 실시간 멈춤 · 재개 */
      var dots = all(bar, '[data-name="Dot"]').filter(function (d) { return !d.closest('[data-name^="Count/"]'); });
      var auto = all(bar, '[data-name="Label"], [data-name="Title"]').filter(function (p) { return txt(p) === 'Auto'; })[0];
      [auto].concat(dots).forEach(function (d) {
        if (!d) return;
        tip(d, '실시간 갱신 멈춤 · 재개');
        clickable(d, function () {
          st.paused = !st.paused;
          dots.forEach(function (x) { x.style.opacity = st.paused ? '.35' : ''; });
          toast(st, st.paused ? '실시간 갱신을 멈췄습니다' : '실시간 갱신을 다시 켭니다');
        });
      });
      wireCounts(bar);
      var all1 = one(bar, '[data-name="Button/All"]'), ack = one(bar, '[data-name="Button/Ack"]');
      if (all1) { boxes(all1).forEach(function (b) { tip(b, '모든 이벤트 보기'); clickable(b, function () { setPanel(true); toast(st, '전체 이벤트'); }); }); }
      if (ack) { boxes(ack).forEach(function (b) { tip(b, '보이는 이벤트 모두 확인(Ack)'); clickable(b, function () { toast(st, '이벤트를 확인 처리했습니다'); }); }); }
    }
    if (load(K_FOLD).events && st.scene !== 'event') setTimeout(function () { setPanel(true); }, 300);
    /* 새 이벤트 — 가끔 들어와 수가 는다(모든 이벤트 바 · 펼친 판 · 이벤트 표가 같은 수) */
    st.timers.push(setInterval(function () {
      if (paused(st)) return;
      var e = pick(EV_POOL), g = GRADE[e[0]];
      [bar, mount, one(frame, '[data-name="Widget/Event Status"]')].forEach(function (sc) {
        if (!sc) return;
        [countEl(sc, 'All'), countEl(sc, g)].forEach(function (p) { bump(p, function (v) { return v + 1; }); });
      });
      st.lastEvent = e[0] + ' · ' + e[1] + p2(1 + ((Math.random() * 8) | 0)) + ' ' + e[2];
      if (st.addEventRow) st.addEventRow(e);
      if (g === 'CR' && bar) { var c = one(bar, '[data-name="Count/CR"]'); boxes(c).forEach(function (b) { b.classList.remove('sl-blink'); void b.offsetWidth; b.classList.add('sl-blink'); }); }
    }, 26000));
    function wireCounts(scope) {
      all(scope, '[data-name^="Count/"]').forEach(function (c) {
        var g = nm(c).replace('Count/', '');
        boxes(c).forEach(function (b) {
          tip(b, g === 'All' ? '전체 이벤트' : g + ' 등급 이벤트' + (g === 'CR' ? ' — 누르면 이벤트 알림' : ''));
          clickable(b, function () { if (g === 'CR') openPop('alert'); else if (st.scene === 'event') toast(st, g + ' 등급만 보기'); else setPanel(true); });
        });
      });
    }
    function installHoverIn(scope) {
      all(scope, '[data-name^="Row/"]').forEach(function (r) {
        var bs = boxes(r); bs.forEach(function (b) { b.classList.add('sl-row'); });
        groupHover(bs, function () { bs.forEach(function (b) { b.classList.add('sl-on'); }); }, function () { bs.forEach(function (b) { b.classList.remove('sl-on'); }); });
      });
    }
    /* 팝업 — 이벤트 알림 · 사운드 설정 가이드 */
    var POP = { alert: { fn: 'build_sma', css: ['SMA_CSS', 'sma-style', 'SMA_LIGHT_CSS', 'sma-light-style'], px: 'sma', l: 660, t: 350, w: 600, h: 380 },
      sound: { fn: 'build_smg', css: ['SMG_CSS', 'smg-style', 'SMG_LIGHT_CSS', 'smg-light-style'], px: 'smg', l: 360, t: 240, w: 1200, h: 600 } };
    var dim = null, pops = {};
    function openPop(k) {
      var P = POP[k];
      if (typeof window[P.fn] !== 'function') { goto(k); return; }
      injectSheet(P.css[0], P.css[1]); injectSheet(P.css[2], P.css[3]);
      if (!dim) { dim = document.createElement('div'); dim.className = 'sl-dim'; dim.setAttribute('data-name', 'Dim'); frame.appendChild(dim); dim.addEventListener('click', closePop); }
      var m = pops[k];
      if (!m) {
        m = pops[k] = document.createElement('div');
        m.className = 'sl-pop';
        m.style.left = P.l + 'px'; m.style.top = P.t + 'px'; m.style.width = P.w + 'px'; m.style.height = P.h + 'px';
        m.innerHTML = '<div class="' + P.px + '-root" data-theme="' + (root.dataset.theme || 'dark') + '">' + window[P.fn]() + '</div>';
        frame.appendChild(m);
        recentIn(m);
        var cl = one(m, '[data-name="Button/Close"]');
        if (cl) { cl.classList.add('sl-btn'); tip(cl, '닫기'); clickable(cl, closePop); }
        if (k === 'sound') wireSound(m);
        if (k === 'alert') { var bd = one(m, '[data-name="Badge/Critical"]'); boxes(bd).forEach(function (b) { b.classList.add('sl-alarm'); }); }
      }
      var cx = (st.exW || 0) / 2, cy = (st.exH || 0) / 2;
      m.style.translate = cx.toFixed(1) + 'px ' + cy.toFixed(1) + 'px';
      dim.style.width = (BASE_W + (st.exW || 0)) + 'px'; dim.style.height = (BASE_H + (st.exH || 0)) + 'px';
      Object.keys(pops).forEach(function (x) { pops[x].classList.toggle('sl-open', x === k); });
      dim.classList.add('sl-open');
    }
    function closePop() {
      if (st.overlay === 'alert' || st.overlay === 'sound') { goto('main'); return; }
      if (dim) dim.classList.remove('sl-open');
      Object.keys(pops).forEach(function (x) { pops[x].classList.remove('sl-open'); });
    }
    st.openPop = openPop;
    function evColScroll(host) {
      var ep = one(host, '[data-name="Event Panel (Expanded)"]') || host;
      var cols = all(ep, '[data-name="Cells"], [data-name="X Axis Labels"], [data-name="Y Axis Labels"]').filter(function (c) { return kids(c).length >= 3; });
      if (!cols.length) return;
      var bgS = all(ep, '[data-name="Shape"]').map(function (x) { return rectIn(x, st); }).sort(function (a, b) { return b.w * b.h - a.w * a.h; })[0];
      var y0 = Math.min.apply(null, cols.map(function (c) { return rectIn(c, st).y; })) - 3;
      var hd = all(ep, '[data-name="Divider"]').filter(function (d) { var r = rectIn(d, st); return r.h < 2 && r.w > 1000 && r.y > y0; });
      /* 가로 줄선은 제자리(원본도 글자 줄과 줄선 간격이 다르다 — Figma 그대로) */
      vColTable(st, cols, [], { x: bgS ? bgS.x : 50, y: y0, w: bgS ? bgS.w : 1824, h: (bgS ? bgS.y + bgS.h : 1072) - y0 }, null, null, null);
    }
    function wireSound(m) {
      var opts = all(m, '[data-name^="Option/"]');
      opts.forEach(function (o) { boxes(o).forEach(function (b) { tip(b, nm(o).replace('Option/', '') + ' 브라우저 설정 보기'); clickable(b, function () { toast(st, nm(o).replace('Option/', '') + ' — 사이트 설정 › 소리 › 허용'); }); }); });
      var pg = one(m, '[data-name="Pager"]'), pv = one(m, '[data-name="Button/Previous"]'), nx = one(m, '[data-name="Button/Next"]');
      var page = 1;
      function setPage(n) { page = clamp(n, 1, 3); var ps = pg ? all(pg, 'p') : []; if (ps[0]) write(ps[0], String(page)); toast(st, '설정 단계 ' + page + ' / 3'); }
      if (pv) { pv.classList.add('sl-btn'); clickable(pv, function () { setPage(page - 1); }); }
      if (nx) { nx.classList.add('sl-btn'); clickable(nx, function () { setPage(page + 1); }); }
    }
    /* 이벤트 바 '이벤트 현황' 제목 → 사운드 가이드(알림 소리 설정) */
    var ttl = bar && all(bar, '[data-name="Label"], [data-name="Title"]').filter(function (p) { return txt(p) === '이벤트 현황'; })[0];
    if (ttl) { tip(ttl, '이벤트 알림 소리 설정 가이드'); clickable(ttl, function () { openPop('sound'); }); }
    /* 팝업 장면 자체(스튜디오의 팝업 화면) — 닫기 · 접기는 통합관제현황으로 */
    if (st.overlay) {
      var om = one(root, '.' + ({ eventpanel: 'smx', alert: 'sma', sound: 'smg' })[st.overlay] + '-mount');
      if (om) {
        recentIn(om);
        all(om, '[data-name="Button/Close"], [data-name="Button/Collapse"]').forEach(function (b) { b.classList.add('sl-btn'); tip(b, '닫기'); clickable(b, function () { goto('main'); }); });
        if (st.overlay === 'sound') wireSound(om);
        if (st.overlay === 'eventpanel') evColScroll(om);
      }
    }
  }

  /* ══════════════════ 7. 통합관제현황 아래 차트 판 — 접기 · 펴기 ══════════════════ */
  function installChartFold(root, st) {
    if (st.scene !== 'main' || !st.chartRow) return;
    var p = st.chartRow;
    var handle = one(root, '[data-name="Chart Row"] [data-name="Button/Open Panel"]');
    var tab = one(st.frame, ':scope > [data-name="Button/Open Panel"]');
    p.els.forEach(function (e) { e.classList.add('sl-slide'); });
    var tabEls = boxes(tab);
    tabEls.forEach(function (e) { e.classList.add('sl-tabopen', 'sl-btn'); });
    /* 11-27 사용자: 채널 접속회선 차트 판은 펼친 이벤트 현황 판(z 60)보다 위 — z 62(팝업 · 덮는 막 70~71 보다는 아래) */
    p.els.concat(tabEls).forEach(function (e) { e.classList.add('sl-abovepanel'); if (getComputedStyle(e).position === 'static') e.style.position = 'relative'; });
    function set(fold, quick) {
      p.els.forEach(function (e) { e.__ox = fold ? -1440 : 0; if (quick) e.style.transition = 'none'; place(e); if (quick) { void e.offsetWidth; e.style.transition = ''; } });
      root.classList.toggle('sl-folded-root', fold);
      var f = load(K_FOLD); f.chart = fold; save(K_FOLD, f);
    }
    if (handle) boxes(handle).forEach(function (b) { tip(b, '차트 판 접기'); clickable(b, function () { set(true); }); });
    tabEls.forEach(function (b) { tip(b, '채널 접속회선 · 동시접속자 · TPS 추이 펼치기'); clickable(b, function () { set(false); }); });
    if (load(K_FOLD).chart) set(true, true);
  }

  /* ══════════════════ 8. 차트 · 숫자 — 실시간처럼 ══════════════════ */
  /* 게이지 칸(Node/POD · Node/DB) — 켜진 칸 수가 오르내린다 */
  function installSegments(root, st) {
    all(root, '[data-name="Gauge Bar"]').forEach(function (g) {
      /* 켜진 칸 = Figma 에서 색이 있는 칸(회색 칸 위에 겹쳐 있다). 처음엔 원본 그대로, 그 뒤로 켜진 칸 수가 오르내린다 */
      function sat(el) {
        var cs = getComputedStyle(el), m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/.exec(cs.backgroundColor);
        if (m && (m[4] == null || +m[4] > 0.05)) return Math.max(+m[1], +m[2], +m[3]) - Math.min(+m[1], +m[2], +m[3]) > 40;
        if (/gradient/.test(cs.backgroundImage)) return !/\b(\d+),\s*\1,\s*\1\b/.test(cs.backgroundImage);
        var im = one(el, 'img'); return !!(im && !/gray|grey|off/i.test(im.getAttribute('src') || ''));
      }
      var lit = all(g, '[data-name="Segment"]').filter(sat).map(function (s) { return { el: s, y: rectIn(s, st).y }; });
      if (lit.length < 2) return;
      lit.sort(function (a, b) { return b.y - a.y; });   /* 아래 → 위 */
      lit.forEach(function (s) { s.el.classList.add('sl-seg'); });
      var n = lit.length;
      g.__lv = n;
      function paint() { lit.forEach(function (s, i) { s.el.classList.toggle('sl-off', i >= g.__lv); }); }
      st.timers.push(setInterval(function () { if (paused(st)) return; g.__lv = clamp(g.__lv + pick([-1, 0, 1, 1, -1, -2]), Math.max(1, n - 4), n); paint(); }, rnd(1800, 3200)));
    });
  }
  /* 막대 — 가로(VM CPU/MEM · 동시접속자 HTS/MTS/WTS)는 scaleX, 세로(채널 막대 차트)는 scaleY */
  function installBars(root, st) {
    var list = [];
    all(root, '[data-name="Bar/Series 1"], [data-name="Bar/Series 2"]').forEach(function (b) {
      var r = rectIn(b, st);
      if (r.h > r.w * 2) {   /* 세로 막대(채널 GW) — 트랙 높이를 넘지 않게 */
        var tk = all(b.parentElement, ':scope > [data-name="Track"]').map(function (t) { return rectIn(t, st).h; }), th = tk.length ? Math.max.apply(null, tk) : r.h * 1.1;
        list.push({ el: b, ax: 'y', lo: 0.6, hi: Math.max(1, Math.min(1.25, th / r.h)) });
      } else list.push({ el: b, ax: 'x', lo: 0.5, hi: 3.2 });
    });
    all(root, '[data-name="Widget/Concurrent Users"] [data-name="Bar"]').forEach(function (b) { var r = rectIn(b, st); if (r.h <= 24) list.push({ el: b, ax: 'x', lo: 0.78, hi: 1.12 }); });

    list.forEach(function (x, i) {
      x.el.classList.add('sl-bar', x.ax === 'x' ? 'sl-barx' : 'sl-bary');
      x.v = 1;
      x.el.style.scale = x.ax === 'x' ? '0 1' : '1 0';
      setTimeout(function () { x.el.style.scale = ''; }, 60 + i * 12);
    });
    if (!list.length) return;
    st.timers.push(setInterval(function () {
      if (paused(st)) return;
      list.forEach(function (x) {
        if (Math.random() < 0.35) return;
        x.v = clamp(x.v * rnd(0.9, 1.1), x.lo, x.hi);
        x.el.style.scale = x.ax === 'x' ? x.v.toFixed(3) + ' 1' : '1 ' + x.v.toFixed(3);
      });
    }, 2400));
  }
  /* 인프라 — 막대 칠(하드 스톱 그라디언트)과 % 값이 함께 */
  function installGradBars(root, st) {
    all(root, '[data-name="content-chart"]').forEach(function (cc) {
      var bg = one(cc, '[data-name="bg-chart"] > [data-name="Background"]');
      var val = one(cc, '[data-name="list01"] [data-name="Value"], [data-name="list02"] [data-name="Value"]');
      if (!bg || !val) return;
      var g0 = getComputedStyle(bg).backgroundImage;
      var m = /^(linear-gradient\(90deg,\s*)(rgba?\([^)]*\))\s+0%,\s*(rgba?\([^)]*\))\s+([\d.]+)%,\s*(rgba?\([^)]*\))\s+([\d.]+)%,\s*(rgba?\([^)]*\))\s+100%\)$/.exec(g0);
      if (!m) return;
      bg.classList.add('sl-gbar');
      var v = parseFloat(txt(val)) || parseFloat(m[4]);
      function paint(nv) {
        bg.style.backgroundImage = m[1] + m[2] + ' 0%, ' + m[3] + ' ' + (nv - 0.1).toFixed(1) + '%, ' + m[5] + ' ' + nv.toFixed(1) + '%, ' + m[7] + ' 100%)';
        if (write(val, String(Math.round(nv)))) flash(val);
      }
      st.timers.push(setInterval(function () {
        if (paused(st) || Math.random() < 0.4) return;
        v = clamp(v + rnd(-6, 6), 8, 94);
        paint(v);
      }, rnd(2600, 4200)));
    });
  }
  /* 숫자 — 표 · 카드 · KPI 가 조금씩(누적 값은 늘기만) */
  var JIT = [
    ['[data-name^="KPI/"] ~ [data-name="Value"], [data-name="Content"] > [data-name="Value"]', 'kpi'],
    ['[data-name="Td/0-3s"], [data-name="Td/3-8s"], [data-name="Td/Per Second"], [data-name="Td/Response Time"]', 'pct'],
    ['[data-name="Td/Cumulative"]', 'up'],
    ['[data-name="Metric/CPU"] [data-name="Value"], [data-name="Metric/Memory"] [data-name="Value"]', 'pct'],
    ['[data-name="List Item"] p:last-child', 'lag'],
    ['[data-name^="Status Card/"] [data-name="Value"]', 'pct'],
  ];
  function installNumbers(root, st) {
    var items = [];
    JIT.forEach(function (j) {
      all(st.frame, j[0]).forEach(function (p) {
        var tx = txt(p);
        if (p.children.length || !numOf(tx) || tx.indexOf(':') >= 0 || (j[1] === 'lag' && !/^[d,]+$/.test(tx))) return;
        if (items.some(function (x) { return x.p === p; })) return;
        items.push({ p: p, k: j[1] });
      });
    });
    /* KPI — 동시접속자 · App 은 오르내리고, 초당 건수는 흔들리고, 전체 건수는 늘기만 */
    var kpis = all(st.frame, '[data-name="KPI Bar"] [data-name="Content"]');
    kpis.forEach(function (c, i) {
      var p = all(c, 'p').filter(function (x) { return numOf(txt(x)) && txt(x).length > 2; }).pop();
      if (!p) return;
      items = items.filter(function (x) { return x.p !== p; });
      items.push({ p: p, k: i === 3 ? 'total' : i === 2 ? 'tps' : 'users' });
    });
    if (!items.length) return;
    st.timers.push(setInterval(function () {
      if (paused(st)) return;
      items.forEach(function (x) {
        var r = Math.random();
        if (x.k === 'total') { bump(x.p, function (v) { return v + Math.round(rnd(800, 2600)); }); return; }
        if (r < 0.55) return;
        bump(x.p, function (v) {
          if (x.k === 'up') return v + Math.round(rnd(1, Math.max(2, v * 0.002)));
          if (x.k === 'users') return Math.max(0, Math.round(v * rnd(0.985, 1.015)));
          if (x.k === 'tps') return Math.max(0, Math.round(v * rnd(0.93, 1.07)));
          if (x.k === 'lag') return v === 0 ? (Math.random() < 0.15 ? 1 : 0) : Math.max(0, Math.round(v * rnd(0.8, 1.15)));
          var o = numOf(txt(x.p)), d = o && o.dec ? Math.pow(10, -o.dec) : 1;
          return Math.max(0, +(v + rnd(-Math.max(d, v * 0.06), Math.max(d, v * 0.06))).toFixed(o ? o.dec : 0));
        });
      });
    }, 3000));
  }
  /* 선 차트(Data svg) — 같은 svg 를 글자로 들여와 최근 구간의 점이 조금씩 움직인다(색 · 그라디언트는 원본 그대로) */
  function installLines(root, st) {
    if (!window.fetch) return;
    all(root, '[data-name="Data"]').forEach(function (host) {
      var img = one(host, 'img');
      if (!img || !/\.svg(\?|$)/.test(img.getAttribute('src') || '')) return;
      var r = rectIn(host, st);
      if (r.w < 120 || r.h < 40) return;
      fetch(img.getAttribute('src')).then(function (x) { return x.text(); }).then(function (svgTxt) {
        if (!root.__sl) return;
        var uid = 'sll' + Math.random().toString(36).slice(2, 7);
        svgTxt = svgTxt.replace(/id="([^"]+)"/g, function (m0, id) { return 'id="' + uid + id + '"'; }).replace(/url\(#([^)]+)\)/g, function (m0, id) { return 'url(#' + uid + id + ')'; });
        var wrap = document.createElement('div');
        wrap.innerHTML = svgTxt;
        var svg = wrap.querySelector('svg');
        if (!svg) return;
        svg.setAttribute('class', img.getAttribute('class') || '');
        svg.style.cssText = img.style.cssText;
        img.replaceWith(svg);
        var vb = (svg.getAttribute('viewBox') || '0 0 ' + r.w + ' ' + r.h).split(/[\s,]+/).map(Number);
        var paths = all(svg, 'path').filter(function (pp) { var d = pp.getAttribute('d') || ''; return (d.match(/[\d.]+/g) || []).length > 12; });
        if (!paths.length) return;
        var P = paths.map(function (pp) {
          var d = pp.getAttribute('d'), parts = d.split(/(-?[\d.]+(?:e-?\d+)?)/);
          var nums = [], idx = [];
          parts.forEach(function (s, i) { if (/^-?[\d.]/.test(s)) { idx.push(i); nums.push(+s); } });
          return { el: pp, parts: parts, idx: idx, n0: nums.slice(), cur: nums.slice() };
        });
        var x0 = vb[0], W = vb[2], y0 = vb[1], H = vb[3], seed = Math.random() * 10;
        var animT = 0;
        function draw(tgt, ms) {
          var from = P.map(function (p) { return p.cur.slice(); }), t0 = performance.now();
          cancelAnimationFrame(animT);
          (function step(t) {
            var k = Math.min(1, (t - t0) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
            P.forEach(function (p, pi) {
              p.cur = from[pi].map(function (v, i) { return v + (tgt[pi][i] - v) * e; });
              var parts = p.parts.slice();
              p.idx.forEach(function (ix, i) { parts[ix] = p.cur[i].toFixed(2); });
              p.el.setAttribute('d', parts.join(''));
            });
            if (k < 1) animT = requestAnimationFrame(step);
          })(t0);
        }
        /* 최근(오른쪽 35%) 점만, x 에 따라 부드럽게 같은 방향으로 — 닫힌 면의 바닥(가장 아래 y)은 그대로 */
        function target() {
          seed += 0.7;
          return P.map(function (p) {
            var out = p.n0.slice(), maxY = -1e9;
            for (var i = 1; i < out.length; i += 2) maxY = Math.max(maxY, out[i]);
            for (var j = 0; j + 1 < out.length; j += 2) {
              var x = out[j], y = out[j + 1], u = (x - x0) / W;
              if (u < 0.65 || Math.abs(y - maxY) < 0.01) continue;
              var w = (u - 0.65) / 0.35;
              var n = Math.sin(seed + x * 0.09) * 0.5 + Math.sin(seed * 1.7 + x * 0.031) * 0.5;
              out[j + 1] = clamp(y + n * H * 0.12 * w, y0 + 1, maxY);
            }
            return out;
          });
        }
        st.timers.push(setInterval(function () { if (!paused(st)) draw(target(), 900); }, 3200));
      }).catch(function () { });
    });
  }

  /* ══════════════════ 9. 스크롤 ══════════════════ */
  /* 가로 스크롤 표(Scrollbar 가 있는 위젯) — 숨은 열을 더 만들어 끌기 · 휠로 넘긴다 */
  var COL_POOL = { mdb: ['ordb', 'acdb', 'mkdb', 'audb', 'bkdb'], status: ['WARN', 'TIMEOUT', 'RETRY', 'SLOW', 'INFO', 'DEBUG'] };
  function installHScroll(root, st) {
    all(root, '[data-name="Scrollbar"]').forEach(function (sb) {
      var w = sb.parentElement, track = one(sb, '[data-name="Track"]'), thumb = one(sb, '[data-name="Thumb"]');
      var table = one(w, '[data-name="Table"]');
      if (!track || !table) return;
      if (!thumb) thumb = all(sb, '[data-name="Track"]')[1] || null;
      if (!thumb) return;
      var tr = rectIn(track, st), th = rectIn(thumb, st);
      if (tr.w < tr.h * 4) {   /* 세로 — 열(Cells/*)마다 줄을 더 붙인다 */
        var tk = all(sb, '[data-name="Track"]').sort(function (a, b) { return rectIn(b, st).h - rectIn(a, st).h; });
        var tbx = rectIn(one(table, '[data-name="Background"]') || table, st);
        var cs0 = kids(table).filter(function (c) { return /^Cells\//.test(nm(c)); });
        if (!cs0.length) return;
        var cy0 = Math.min.apply(null, cs0.map(function (c) { return rectIn(c, st).y; })) - 4;
        vColTable(st, cs0, kids(table).filter(function (c) { return nm(c) === 'Divider' && rectIn(c, st).h < 2 && rectIn(c, st).w > 200; }),
          { x: tbx.x, y: cy0, w: tbx.w, h: tbx.y + tbx.h - cy0 }, null, { track: tk[0], thumb: tk[1] || thumb }, panelOf(st, one(w, '[data-name="Background"]') || boxes(w)[0]));
        return;
      }
      var cols = kids(table).filter(function (c) { return /^(Th|Cells)\//.test(nm(c)) && !/\/Name$/.test(nm(c)); });
      if (!cols.length) return;
      var nameTh = one(table, '[data-name="Th/Name"]'), bgT = one(table, '[data-name="Background"]');
      var tb = rectIn(bgT || table, st);
      var vdiv = kids(table).filter(function (c) { return nm(c) === 'Divider' && rectIn(c, st).h > 100; }).map(function (d) { return { el: d, x: rectIn(d, st).x }; }).sort(function (a, b) { return a.x - b.x; });
      var x0 = (vdiv[0] ? vdiv[0].x : tb.x + 90) + 1, x1 = tb.x + tb.w;
      var heads = cols.filter(function (c) { return /^Th\//.test(nm(c)); }).map(function (h) { return { h: h, key: nm(h).slice(3), x: rectIn(h, st).x }; }).sort(function (a, b) { return a.x - b.x; });
      if (heads.length < 2) return;
      var pitch = (heads[heads.length - 1].x - heads[0].x) / (heads.length - 1);
      var vis = x1 - x0, frac = clamp(th.w / tr.w, 0.2, 1), total = vis / frac, hidden = Math.max(0, total - vis);
      var pos = tr.w - th.w > 1 ? (th.x - tr.x) / (tr.w - th.w) : 0;
      var nLeft = Math.round(hidden * pos / pitch), nRight = Math.round(hidden * (1 - pos) / pitch);
      /* 잘리는 상자 — 이름 열은 고정, 데이터 열 · 세로선만 안으로 */
      var clip = document.createElement('div');
      clip.className = 'sl-clip';
      clip.setAttribute('data-name', 'Scroll Area');
      clip.style.left = x0 + 'px'; clip.style.top = tb.y + 'px'; clip.style.width = vis + 'px'; clip.style.height = tb.h + 'px';
      var inner = document.createElement('div');
      inner.className = 'sl-inner';
      inner.style.left = -x0 + 'px'; inner.style.top = -tb.y + 'px';
      clip.appendChild(inner);
      st.frame.appendChild(clip);
      var pW = panelOf(st, one(w, '[data-name="Background"]') || boxes(w)[0]);
      cols.concat(vdiv.slice(1).map(function (d) { return d.el; })).forEach(function (c) { detach(st, c); inner.appendChild(c); });
      var numeric = /^([a-z]+)(\d+)$/i.exec(heads[0].key);
      var pool = numeric ? COL_POOL.mdb : COL_POOL.status;
      function cloneCol(src, dx, name) {
        var hEl = src.h, cEl = one(table, '[data-name="Cells/' + src.key + '"]') || one(inner, '[data-name="Cells/' + src.key + '"]');
        [hEl, cEl].forEach(function (el) {
          if (!el) return;
          var c = el.cloneNode(true);
          c.removeAttribute('id'); all(c, '[id]').forEach(function (x) { x.removeAttribute('id'); });
          c.style.transform = 'translateX(' + dx.toFixed(1) + 'px)';
          c.setAttribute('data-name', (el === hEl ? 'Th/' : 'Cells/') + name);
          if (el === hEl) { var p = one(c, 'p') || c; p.textContent = name; }
          else all(c, 'p').forEach(function (p) { var o = numOf(txt(p)); if (o) p.textContent = numStr(o, Math.max(0, o.v * rnd(0.6, 1.4))); });
          all(c, 'p').concat([c]).forEach(function (p) { p.__slLast = p.textContent; });
          inner.appendChild(c);
        });
      }
      var made = 0;
      for (var i = 1; i <= nRight; i++) {
        var s = heads[(i - 1) % heads.length], nmR = numeric ? numeric[1] + p2(+heads[heads.length - 1].key.replace(/\D/g, '') + i) : pool[(i - 1) % pool.length];
        cloneCol(s, heads[heads.length - 1].x + pitch * i - s.x, nmR); made++;
      }
      for (var k = 1; k <= nLeft; k++) {
        var s2 = heads[heads.length - 1 - ((k - 1) % heads.length)], nmL = numeric ? pool[Math.floor((k - 1) / 1) % pool.length] + p2(k) : pool[(k - 1 + nRight) % pool.length];
        cloneCol(s2, heads[0].x - pitch * k - s2.x, nmL); made++;
      }
      var left = heads[0].x - pitch * nLeft, right = heads[heads.length - 1].x + pitch * (nRight + 1);
      var maxS = Math.max(0, right - left - vis), sc = clamp(heads[0].x - left - 0, 0, maxS);
      adopt(st, pW, clip);
      thumb.classList.add('sl-thumb');
      var thumbW = maxS > 0 ? Math.max(24, tr.w * vis / (vis + maxS)) : tr.w;
      thumb.style.width = thumbW + 'px';
      function paint() {
        inner.style.transform = 'translateX(' + (-(sc - (heads[0].x - left))).toFixed(1) + 'px)';
        var k2 = maxS ? sc / maxS : 0;
        thumb.style.transform = 'translateX(' + ((tr.x - th.x) + k2 * (tr.w - thumbW)).toFixed(1) + 'px)';
      }
      paint();
      tip(thumb, '끌어서 열 넘기기');
      [clip, track, thumb].concat(boxes(table)).forEach(function (el) {
        el.addEventListener('wheel', function (e) {
          if (editing() || !maxS) return;
          var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
          var ns = clamp(sc + d * 0.8, 0, maxS);
          if (ns === sc) return;
          e.preventDefault(); sc = ns; paint();
        }, { passive: false });
      });
      var drag = null;
      thumb.addEventListener('pointerdown', function (e) {
        if (editing() || layoutEditing(root)) return;
        e.preventDefault(); e.stopPropagation();
        drag = { x: e.clientX, s: sc };
        thumb.classList.add('sl-drag'); clip.classList.add('sl-drag');
        thumb.setPointerCapture && thumb.setPointerCapture(e.pointerId);
      });
      thumb.addEventListener('pointermove', function (e) {
        if (!drag) return;
        var S = (st.frame.getBoundingClientRect().width / BASE_W) || 1;
        sc = clamp(drag.s + (e.clientX - drag.x) / S * (maxS / Math.max(1, tr.w - thumbW)), 0, maxS); paint();
      });
      function up() { drag = null; thumb.classList.remove('sl-drag'); clip.classList.remove('sl-drag'); }
      thumb.addEventListener('pointerup', up); thumb.addEventListener('pointercancel', up);
      clickable(track, function (e) {
        var S = (st.frame.getBoundingClientRect().width / BASE_W) || 1, fr = st.frame.getBoundingClientRect();
        var x = (e.clientX - fr.left) / S - (track.__fx || 0) - (track.__ux || 0);
        sc = clamp(((x - tr.x) / tr.w) * (maxS + vis) - vis / 2, 0, maxS); paint();
      });
      st.hscroll = (st.hscroll || 0) + made;
    });
  }
  /* 세로 스크롤 — 줄(Row/*)이 쌓인 목록. 지난 줄을 아래에 더 만들고 휠로 내린다(오른쪽 가는 막대) */
  function vScroll(st, scope, rowSel, host) {
    var rows = all(scope, rowSel).filter(function (r) { return !r.parentElement.closest(rowSel); });
    if (rows.length < 3) return null;
    var rs = rows.map(function (r) { return { el: r, r: unionRect(boxes(r), st) }; }).filter(function (x) { return x.r; }).sort(function (a, b) { return a.r.y - b.r.y; });
    if (rs.length < 3) return null;
    var top = rs[0].r.y, bot = rs[rs.length - 1].r.y + rs[rs.length - 1].r.h, pitch = (rs[rs.length - 1].r.y - top) / (rs.length - 1);
    var x0 = Math.min.apply(null, rs.map(function (x) { return x.r.x; })), x1 = Math.max.apply(null, rs.map(function (x) { return x.r.x + x.r.w; }));
    var hostEl = host || st.frame;
    var base = host ? rectIn(host.querySelector('[data-node-id]') || host, st) : { x: 0, y: 0 };
    var clip = document.createElement('div');
    clip.className = 'sl-clip sl-vscroll';
    clip.setAttribute('data-name', 'Scroll Area');
    clip.style.left = (x0 - base.x) + 'px'; clip.style.top = (top - base.y) + 'px'; clip.style.width = (x1 - x0) + 'px'; clip.style.height = (bot - top + 1) + 'px';
    var inner = document.createElement('div');
    inner.className = 'sl-inner';
    inner.style.left = -(x0 - base.x) + 'px'; inner.style.top = -(top - base.y) + 'px';
    clip.appendChild(inner);
    var holder = host ? (host.querySelector('[class$="-root"] > [data-node-id]') || host) : st.frame;
    holder.appendChild(clip);
    var pV = host ? null : (panelOf(st, rs[0].el) || panelOf(st, boxes(rs[0].el)[0]));
    rs.forEach(function (x) { boxes(x.el).concat([x.el]).forEach(function (b) { detach(st, b); }); inner.appendChild(x.el); });
    var vbar = document.createElement('div');
    vbar.className = 'sl-vbar';
    vbar.style.left = (x1 - base.x + 3) + 'px'; vbar.style.top = (top - base.y) + 'px'; vbar.style.height = (bot - top) + 'px';
    vbar.innerHTML = '<i></i>';
    holder.appendChild(vbar);
    var extra = [], sc = 0;
    function maxS() { return Math.max(0, extra.length * pitch); }
    function paint() {
      inner.style.transform = 'translateY(' + (-sc).toFixed(1) + 'px)';
      var vis = bot - top, tot = vis + maxS(), th = Math.max(18, vis * vis / tot);
      var t = vbar.firstChild; t.style.height = th + 'px'; t.style.top = (maxS() ? sc / maxS() * (vis - th) : 0) + 'px';
      vbar.style.display = maxS() ? '' : 'none';
    }
    /* 지난 줄 — 맨 아래 줄을 본떠 더 이른 시각으로 */
    var last = rs[rs.length - 1].el;
    function lastTime() { var t = all(inner, 'p').map(txt).filter(function (s) { return T_RE.test(s); }); return t.length ? t[t.length - 1] : null; }
    function older(n) {
      for (var i = 0; i < n; i++) {
        var src = rs[(i * 5 + 3) % rs.length].el, c = src.cloneNode(true);
        c.removeAttribute('id'); all(c, '[id]').forEach(function (x) { x.removeAttribute('id'); });
        var dy = pitch * (rs.length + extra.length) - (unionRect(boxes(src), st).y - top);
        inner.appendChild(c);
        boxes(c).forEach(function (b) { b.style.transform = 'translateY(' + dy.toFixed(1) + 'px)'; });
        var lt = lastTime(), m = lt && T_RE.exec(lt), base2 = new Date();
        if (m) base2.setHours(+m[1], +m[2], +m[3]);
        var tt = new Date(base2.getTime() - (4 + i * 3 + Math.random() * 6) * 60000);
        all(c, 'p').forEach(function (p) { if (T_RE.test(txt(p))) p.textContent = fmtT(tt); p.__slLast = p.textContent; });
        extra.push(c);
        all(c, '[data-name^="Row/"]').concat([c]).forEach(function (r) { var bs = boxes(r); bs.forEach(function (b) { b.classList.add('sl-row'); }); groupHover(bs, function () { bs.forEach(function (b) { b.classList.add('sl-on'); }); }, function () { bs.forEach(function (b) { b.classList.remove('sl-on'); }); }); });
      }
    }
    older(Math.max(6, Math.round(rs.length * 0.6)));
    paint();
    if (!host) { adopt(st, pV, clip); adopt(st, pV, vbar); }
    clip.addEventListener('wheel', function (e) {
      if (editing()) return;
      var ns = clamp(sc + e.deltaY * 0.6, 0, maxS());
      if (ns === sc) return;
      e.preventDefault(); sc = ns; paint();
      vbar.classList.add('sl-on'); clearTimeout(vbar.__t); vbar.__t = setTimeout(function () { vbar.classList.remove('sl-on'); }, 900);
    }, { passive: false });
    return { inner: inner, rows: rs, top: top, pitch: pitch, toTop: function () { sc = 0; paint(); } };
  }
  /* 열 단위 표의 세로 스크롤 — 열(Cells …)마다 지난 줄을 붙이고, 가로줄도 같이 늘려 휠 · 막대로 내린다 */
  function vColTable(st, cols, hdivs, R, holder, sb, panel) {
    /* 줄 좌표의 기준 = 열의 실제 위치 기준 상자(offsetParent) — 팝업 조각 안이면 그 조각의 판 */
    var op = cols[0] && cols[0].offsetParent;
    if (!holder && op && op !== st.frame && st.frame.contains(op)) holder = op;
    var base = holder ? rectIn(holder, st) : { x: 0, y: 0 };
    var hostEl = holder || st.frame;
    var clip = document.createElement('div');
    clip.className = 'sl-clip sl-vscroll';
    clip.setAttribute('data-name', 'Scroll Area');
    clip.style.left = (R.x - base.x) + 'px'; clip.style.top = (R.y - base.y) + 'px'; clip.style.width = R.w + 'px'; clip.style.height = R.h + 'px';
    var inner = document.createElement('div');
    inner.className = 'sl-inner';
    inner.style.left = -(R.x - base.x) + 'px'; inner.style.top = -(R.y - base.y) + 'px';
    /* 안쪽 판 크기 = 원래 기준 상자 크기(inset 으로 크기가 정해진 열이 늘어나지 않게) */
    if (holder) { inner.style.width = holder.offsetWidth + 'px'; inner.style.height = holder.offsetHeight + 'px'; }
    clip.appendChild(inner);
    hostEl.appendChild(clip);
    var pitch = 0, N = 0;
    cols.forEach(function (c) {
      var ch = kids(c).filter(function (x) { return !isContents(x); });
      if (ch.length < 2) return;
      var ys = ch.map(function (x) { return rectIn(x, st).y; });
      var pt = (Math.max.apply(null, ys) - Math.min.apply(null, ys)) / (ch.length - 1);
      if (!pitch && pt > 4) { pitch = pt; N = Math.max(5, Math.round(ch.length * 0.8)); }
    });
    if (!pitch) { clip.remove(); return null; }
    cols.forEach(function (c) { detach(st, c); inner.appendChild(c); c.style.overflow = 'visible'; });
    hdivs.forEach(function (d) { detach(st, d); inner.appendChild(d); });
    cols.forEach(function (c) {
      var ch = kids(c).filter(function (x) { return !isContents(x); }).sort(function (a, b) { return rectIn(a, st).y - rectIn(b, st).y; });
      if (ch.length < 2) return;
      var last = ch[ch.length - 1], ly = rectIn(last, st).y, lt = null, m;
      ch.forEach(function (x) { if ((m = T_RE.exec(txt(x)))) lt = m; });
      var tBase = new Date(); if (lt) tBase.setHours(+lt[1], +lt[2], +lt[3], 0);
      for (var k = 1; k <= N; k++) {
        var src = ch[(k * 3 + 1) % ch.length], c2 = src.cloneNode(true);
        c2.removeAttribute('id'); all(c2, '[id]').forEach(function (x) { x.removeAttribute('id'); });
        c.appendChild(c2);
        var dy = ly + pitch * k - rectIn(c2, st).y;
        c2.style.transform = 'translateY(' + dy.toFixed(1) + 'px)';
        all(c2, 'p').concat(c2.tagName === 'P' ? [c2] : []).forEach(function (p) {
          var s = txt(p), o;
          if (T_RE.test(s)) p.textContent = fmtT(new Date(tBase.getTime() - k * (3 + Math.random() * 5) * 60000));
          else if (/^[\d,.]+%?$/.test(s) && (o = numOf(s))) p.textContent = numStr(o, Math.max(0, o.v * rnd(0.5, 1.6)));
          p.__slLast = p.textContent;
        });
      }
    });
    if (hdivs.length) {
      var lastD = hdivs.slice().sort(function (a, b) { return rectIn(b, st).y - rectIn(a, st).y; })[0];
      for (var k2 = 1; k2 <= N; k2++) { var d2 = lastD.cloneNode(true); d2.removeAttribute('id'); d2.style.transform = 'translateY(' + (pitch * k2).toFixed(1) + 'px)'; inner.appendChild(d2); }
    }
    var maxS = pitch * N, sc = 0, vis = R.h;
    var thumb = null, tr = null, th0 = null, vbar = null;
    if (sb && sb.track && sb.thumb && sb.thumb !== sb.track) {
      thumb = sb.thumb; tr = rectIn(sb.track, st); th0 = rectIn(thumb, st);
      thumb.classList.add('sl-thumb');
      thumb.style.height = Math.max(20, tr.h * vis / (vis + maxS)) + 'px';
    } else {
      vbar = document.createElement('div');
      vbar.className = 'sl-vbar';
      vbar.style.left = (R.x - base.x + R.w - 6) + 'px'; vbar.style.top = (R.y - base.y) + 'px'; vbar.style.height = R.h + 'px';
      vbar.innerHTML = '<i></i>';
      hostEl.appendChild(vbar);
    }
    function paint() {
      inner.style.transform = 'translateY(' + (-sc).toFixed(1) + 'px)';
      var k = maxS ? sc / maxS : 0;
      if (thumb) { var thH = parseFloat(thumb.style.height); thumb.style.transform = 'translateY(' + ((tr.y - th0.y) + k * (tr.h - thH)).toFixed(1) + 'px)'; }
      if (vbar) { var h2 = Math.max(18, vis * vis / (vis + maxS)), t = vbar.firstChild; t.style.height = h2 + 'px'; t.style.top = (k * (vis - h2)) + 'px'; }
    }
    paint();
    if (panel) { adopt(st, panel, clip); if (vbar) adopt(st, panel, vbar); }
    clip.addEventListener('wheel', function (e) {
      if (editing()) return;
      var ns = clamp(sc + e.deltaY * 0.6, 0, maxS);
      if (ns === sc) return;
      e.preventDefault(); sc = ns; paint();
      if (vbar) { vbar.classList.add('sl-on'); clearTimeout(vbar.__t); vbar.__t = setTimeout(function () { vbar.classList.remove('sl-on'); }, 900); }
    }, { passive: false });
    if (thumb) {
      var drag = null;
      thumb.addEventListener('pointerdown', function (e) { if (editing()) return; e.preventDefault(); e.stopPropagation(); drag = { y: e.clientY, s: sc }; thumb.classList.add('sl-drag'); clip.classList.add('sl-drag'); if (thumb.setPointerCapture) thumb.setPointerCapture(e.pointerId); });
      thumb.addEventListener('pointermove', function (e) { if (!drag) return; var S = (st.frame.getBoundingClientRect().width / BASE_W) || 1, thH = parseFloat(thumb.style.height); sc = clamp(drag.s + (e.clientY - drag.y) / S * (maxS / Math.max(1, tr.h - thH)), 0, maxS); paint(); });
      var up = function () { drag = null; thumb.classList.remove('sl-drag'); clip.classList.remove('sl-drag'); };
      thumb.addEventListener('pointerup', up); thumb.addEventListener('pointercancel', up);
      tip(thumb, '끌어서 지난 줄 보기');
    }
    st.vcols = (st.vcols || 0) + 1;
    return clip;
  }

  function installVScroll(root, st) {
    if (st.scene === 'event' && !st.overlay) {
      var vs = vScroll(st, st.frame, '[data-name^="Row/"]');
      /* 새 이벤트가 맨 위로 — 이벤트 바 수가 늘 때 같이 */
      if (vs) st.addEventRow = function (e) {
        var first = vs.rows[0].el, c = first.cloneNode(true);
        c.removeAttribute('id'); all(c, '[id]').forEach(function (x) { x.removeAttribute('id'); });
        var cells = {};
        all(c, '[data-name^="Td/"]').forEach(function (p) { cells[nm(p)] = p; });
        var now = fmtT(new Date());
        if (cells['Td/First Time']) cells['Td/First Time'].textContent = now;
        if (cells['Td/Last Time']) cells['Td/Last Time'].textContent = now;
        if (cells['Td/Grade']) cells['Td/Grade'].textContent = e[0];
        if (cells['Td/Device Name']) cells['Td/Device Name'].textContent = e[1] + p2(1 + ((Math.random() * 8) | 0));
        if (cells['Td/Message']) cells['Td/Message'].textContent = e[2];
        if (cells['Td/Message Group']) cells['Td/Message Group'].textContent = e[3];
        if (cells['Td/Ack Status']) cells['Td/Ack Status'].textContent = 'N';
        all(c, 'p').forEach(function (p) { p.__slLast = p.textContent; });
        /* 모든 줄을 한 칸 내리고 맨 위에 넣는다 */
        all(vs.inner, ':scope > *').forEach(function (r) {
          var bs = isContents(r) ? kids(r).filter(function (b) { return !isContents(b); }) : [r];
          bs.forEach(function (b) { var m = /translateY\((-?[\d.]+)px\)/.exec(b.style.transform || ''); b.style.transform = 'translateY(' + ((m ? +m[1] : 0) + vs.pitch).toFixed(1) + 'px)'; });
        });
        vs.inner.insertBefore(c, vs.inner.firstChild);
        boxes(c).forEach(function (b) { b.style.transform = ''; b.classList.add('sl-rowin', 'sl-row'); });
        vs.toTop();
      };
    }
  }

  /* ══════════════════ 10. 테마 · 툴팁 ══════════════════ */
  function installTheme(root, st) {
    var sync = function () {
      if (st.bgfill && st.frame) { var cs = getComputedStyle(st.frame); st.bgfill.style.backgroundImage = cs.backgroundImage; st.bgfill.style.backgroundColor = cs.backgroundColor; }
      all(root, '.sl-evmount [class$="-root"], .sl-pop [class$="-root"]').forEach(function (r) { r.dataset.theme = root.dataset.theme || 'dark'; });
    };
    sync();
    st.syncTheme = sync;
    if (window.MutationObserver) { st.mo = new MutationObserver(sync); st.mo.observe(root, { attributes: true, attributeFilter: ['data-theme'] }); }
  }
  function installTips(root, st) {
    var el = document.createElement('div');
    el.className = 'sl-tip';
    st.frame.appendChild(el);
    st.tipEl = el;
    var cur = null, t = 0;
    st.onTipOver = function (e) {
      var h = e.target.closest && e.target.closest('[data-sl-tip]');
      if (h === cur) return;
      cur = h; clearTimeout(t); el.classList.remove('on');
      if (!h || editing()) return;
      t = setTimeout(function () {
        if (!cur || editing()) return;
        el.textContent = cur.getAttribute('data-sl-tip');
        var r = cur.getBoundingClientRect(), f = st.frame.getBoundingClientRect(), S = (f.width / BASE_W) || 1;
        var rx = (r.left - f.left) / S, ry = (r.top - f.top) / S, rw = r.width / S, rh = r.height / S, w = el.offsetWidth;
        var x = clamp(rx + rw / 2 - w / 2, 8, BASE_W + (st.exW || 0) - w - 8);
        var y = ry + rh + 10;
        if (y + 40 > BASE_H + (st.exH || 0)) y = ry - 40;
        el.style.left = x + 'px'; el.style.top = y + 'px';
        el.classList.add('on');
      }, 380);
    };
    st.onTipOut = function () { cur = null; clearTimeout(t); el.classList.remove('on'); };
    root.addEventListener('pointerover', st.onTipOver);
    root.addEventListener('pointerleave', st.onTipOut);
    root.addEventListener('pointerdown', st.onTipOut);
  }

  /* ══════════════════ 11. 차트 바꾸기(패널편집) ══════════════════ */
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
    el.className = 'sl-chart';
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
        s += '<clipPath id="slc' + spec.uid + '"><rect x="' + L + '" y="0" width="' + (w - L - R) + '" height="' + h + '"/></clipPath><g clip-path="url(#slc' + spec.uid + ')">';
        data.forEach(function (a, si) {
          var col = spec.series[si][1];
          var pts = a.map(function (v, i) { return X(i).toFixed(1) + ',' + Y(v).toFixed(1); }).join(' ');
          if (spec.k === 'area' || si === 0) {
            s += '<defs><linearGradient id="slg' + spec.uid + si + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + col + '" stop-opacity="' + (spec.k === 'area' ? .4 : .18) + '"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></linearGradient></defs>';
            s += '<polygon fill="url(#slg' + spec.uid + si + ')" points="' + X(0).toFixed(1) + ',' + (h - B) + ' ' + pts + ' ' + X(N - 1).toFixed(1) + ',' + (h - B) + '"/>';
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
        + '<defs><linearGradient id="slgg' + spec.uid + '" x1="0" x2="1"><stop offset="0" stop-color="#2a7ca0"/><stop offset="1" stop-color="' + spec.c + '"/></linearGradient></defs>'
        + '<path d="M8 52a42 42 0 0 1 84 0" fill="none" stroke="rgba(142,166,179,.2)" stroke-width="8"/>'
        + '<path class="arc" d="M8 52a42 42 0 0 1 84 0" fill="none" stroke="url(#slgg' + spec.uid + ')" stroke-width="8" stroke-dasharray="0 ' + LEN.toFixed(1) + '"/>'
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
    var rot = ((h - 213 + 540) % 360) - 180;
    root.style.setProperty('--sl-chue', (Math.abs(rot) < 3 ? 0 : Math.round(rot)) + 'deg');
  }
  var chartUid = 0;
  var CC = { bl: '#57a2fe', cy: '#71e2ff', vi: '#7a1eeb', pk: '#cc4bcd', ye: '#e8ba30', gn: '#39dde0', re: '#f43031', or: '#ff9f43', gr: '#8b8b8c' };
  var SVC = ['주식주문', '주식체결', '간편인증', '인증서', '예수금'];
  function specsFor(scene) {
    var S = {};
    var infra = [
      { k: 'hbar', t: '서버별 CPU 사용률', unit: '%', cats: ['01', '02', '03', '04', '05', '06'], vals: [42, 58, 36, 64, 51, 47], max: 100, c: CC.vi },
      { k: 'line', t: 'CPU · MEM 추이', unit: '%', dec: 0, series: [['CPU', CC.vi, 46, 6], ['MEM', CC.bl, 63, 4]], lo: 0, hi: 100 },
      { k: 'gauge', t: '평균 CPU 사용률', unit: '%', v: [48, 4], max: 100, c: CC.bl },
    ];
    if (scene === 'main') {
      S['Widget/Key Service Transactions'] = [
        { k: 'hbar', t: '주요서비스 0~3초 거래', unit: '건', cats: SVC, vals: [48215, 41870, 36412, 18904, 16233], max: 60000, c: CC.ye },
        { k: 'bar', t: '서비스별 3~8초 지연', unit: '건', cats: SVC, vals: [6, 4, 3, 2, 1], max: 10, c: CC.bl },
        { k: 'donut', t: '응답시간 구간 비중', parts: [['0~3초', CC.gn, 98.9], ['3~8초', CC.ye, 0.9], ['8초 이상', CC.re, 0.2]] },
      ];
      S['Delay Top10'] = [
        { k: 'bar', t: '지연서비스 Top5 (0~3초)', unit: '건', cats: ['해외시세', '모바일잔고', '관심종목', '신용여부', '연금자산'], vals: [846, 712, 655, 590, 488], max: 1000, c: CC.ye },
        { k: 'line', t: '지연 건수 추이', unit: '건', dec: 0, series: [['0~3초', CC.ye, 620, 60], ['3~8초', CC.bl, 40, 8]], lo: 0, hi: 900 },
        { k: 'hbar', t: '지연서비스 3~8초', unit: '건', cats: ['해외시세', '모바일잔고', '관심종목', '신용여부', '연금자산'], vals: [47, 39, 31, 26, 22], max: 60, c: CC.bl },
      ];
      S['VM Panel'] = [
        { k: 'hbar', t: 'VM CPU 사용률 상위', unit: '%', cats: ['FEP 주문', 'Solace', 'Redis 시세', 'EAI', 'Kafka'], vals: [38, 31, 27, 22, 18], max: 100, c: CC.vi },
        { k: 'gauge', t: 'VM 평균 CPU', unit: '%', v: [24, 3], max: 100, c: CC.vi },
        { k: 'line', t: 'VM CPU · MEM 추이', unit: '%', dec: 0, series: [['CPU', CC.vi, 24, 4], ['MEM', CC.bl, 52, 3]], lo: 0, hi: 100 },
      ];
      S['Chart Row'] = [
        { k: 'line', t: 'TPS 추이 · 전일 대비', unit: 'TPS', dec: 0, series: [['오늘', CC.cy, 1280, 160], ['전일', CC.vi, 1180, 120]], lo: 0, hi: 4000 },
        { k: 'area', t: '회선 사용률(남부 · 북부)', unit: '%', dec: 0, series: [['남부', CC.cy, 38, 5], ['북부', CC.pk, 31, 4]], lo: 0, hi: 100 },
        { k: 'hbar', t: '채널별 동시접속자', unit: '명', cats: ['HTS', 'MTS', 'WTS'], vals: [2840, 5120, 682], max: 6000, c: CC.ye },
      ];
      S['Widget/Overview Board'] = [
        { k: 'bar', t: '업무 영역별 POD 수', unit: '개', cats: ['계좌', '뱅킹', '공통', '파생', '권리', '인증', '자산'], vals: [37, 45, 48, 18, 22, 39, 19], max: 60, c: CC.bl },
        { k: 'donut', t: '업무 영역별 TPS 비중', parts: [['주문 · 체결', CC.ye, 41], ['시세', CC.cy, 27], ['인증', CC.vi, 14], ['계좌 · 자산', CC.bl, 12], ['기타', CC.gr, 6]] },
      ];
    } else if (scene === 'channel') {
      S['Widget/External Receipt'] = [
        { k: 'donut', t: '대외기관 수신 비중', parts: [['제휴은행', CC.bl, 34], ['금융협회', CC.cy, 21], ['예탁기관', CC.vi, 17], ['신용평가사', CC.ye, 15], ['기타', CC.gr, 13]] },
        { k: 'hbar', t: '기관별 수신 건수', unit: '건', cats: ['제휴은행', '금융협회', '예탁기관', '신용평가', '포인트'], vals: [6982, 4310, 3488, 3020, 1240], max: 8000, c: CC.bl },
        { k: 'line', t: '대외 수신 추이', unit: '건', dec: 0, series: [['수신', CC.cy, 420, 60]], lo: 0, hi: 900 },
      ];
      S['Widget/DB Receipt'] = [
        { k: 'bar', t: 'DB별 수신 건수', unit: '건', cats: ['mdb01', 'mdb02', 'mdb03', 'mdb04', 'mdb05'], vals: [1820, 1640, 1710, 1490, 1580], max: 2400, c: CC.bl },
        { k: 'line', t: 'DB 수신 지연(ms)', unit: 'ms', dec: 0, series: [['평균', CC.cy, 38, 6], ['최대', CC.pk, 92, 12]], lo: 0, hi: 160 },
      ];
      S['Widget/Log Search'] = [
        { k: 'bar', t: '로그 상태별 건수', unit: '건', cats: ['DEAD', 'ERROR', 'LONG', 'NORMAL'], vals: [2, 14, 36, 812], max: 1000, c: CC.bl },
        { k: 'donut', t: '로그 상태 비중', parts: [['NORMAL', CC.gn, 94], ['LONG', CC.ye, 4], ['ERROR', CC.or, 1.6], ['DEAD', CC.re, 0.4]] },
      ];
      S['Widget/Concurrent Users & Quote Processing'] = [
        { k: 'line', t: '동시접속자 · 시세 처리', unit: '건', dec: 0, series: [['동시접속', CC.cy, 8600, 240], ['시세 처리', CC.ye, 6200, 300]], lo: 0, hi: 12000 },
        { k: 'bar', t: '시간대별 시세 처리', unit: '천건', cats: ['09', '10', '11', '12', '13'], vals: [182, 164, 141, 98, 126], max: 220, c: CC.ye },
      ];
      S['Widget/File Check'] = [
        { k: 'gauge', t: '파일 수신 완료율', unit: '%', v: [96, 1.2], max: 100, c: CC.gn },
        { k: 'bar', t: '시간대별 파일 수신', unit: '개', cats: ['08', '09', '10', '11', '12', '13'], vals: [42, 68, 51, 39, 33, 47], max: 80, c: CC.bl },
      ];
      ['Widget/Channel GW Resources', 'Widget/Channel GW Resources #2'].forEach(function (n) {
        S[n] = [
          { k: 'line', t: '채널 GW CPU · MEM', unit: '%', dec: 0, series: [['CPU', CC.cy, 42, 6], ['MEM', CC.pk, 61, 3]], lo: 0, hi: 100 },
          { k: 'hbar', t: 'GW별 CPU 사용률', unit: '%', cats: ['htsgw01', 'mtsgw01', 'mtsgw02', 'wtsgw01', 'fepgw01'], vals: [38, 57, 49, 22, 33], max: 100, c: CC.cy },
          { k: 'gauge', t: 'GW 평균 CPU', unit: '%', v: [41, 3], max: 100, c: CC.cy },
        ];
      });
    } else if (scene === 'micro') {
      S['Widget/Key Services'] = [
        { k: 'hbar', t: '초당 처리 상위 서비스', unit: 'TPS', cats: SVC, vals: [412, 366, 241, 188, 152], max: 500, c: CC.bl },
        { k: 'line', t: '응답시간 추이', unit: 'ms', dec: 0, series: [['평균', CC.cy, 84, 10], ['P95', CC.pk, 210, 24]], lo: 0, hi: 400 },
        { k: 'bar', t: '서비스별 누적 거래(만건)', unit: '만건', cats: SVC, vals: [482, 418, 364, 189, 162], max: 600, c: CC.ye },
      ];
      S['Widget/Microservices'] = [
        { k: 'bar', t: 'N-POD 부하율', unit: '%', cats: ['계좌', '뱅킹', '공통', '파생', '권리', '인증', '자산', '해외'], vals: [62, 48, 71, 35, 44, 58, 39, 52], max: 100, c: CC.cy },
        { k: 'gauge', t: '전체 POD 평균 부하', unit: '%', v: [54, 3], max: 100, c: CC.cy },
        { k: 'line', t: 'POD 재기동 · 오류', unit: '건', dec: 0, series: [['오류', CC.re, 3, 1.5], ['재기동', CC.ye, 1, 0.6]], lo: 0, hi: 12 },
      ];
    } else if (scene === 'mq') {
      S['Widget/Solace'] = [
        { k: 'line', t: 'Solace 큐 적재량', unit: '건', dec: 0, series: [['적재', CC.cy, 1200, 180]], lo: 0, hi: 3000 },
        { k: 'bar', t: '큐별 적재량', unit: '건', cats: ['시세', '체결', '주문', '잔고', '공지'], vals: [867, 412, 233, 84, 30], max: 1200, c: CC.bl },
      ];
      S['Widget/Business Kafka'] = [
        { k: 'bar', t: 'Topic별 Consumer LAG', unit: '건', cats: ['계좌', '고객', '주문', '체결', '공통'], vals: [867, 30, 15, 412, 1], max: 1000, c: CC.ye },
        { k: 'line', t: 'Kafka 처리량', unit: 'msg/s', dec: 0, series: [['IN', CC.cy, 2400, 200], ['OUT', CC.vi, 2300, 220]], lo: 0, hi: 4000 },
      ];
      ['Widget/Quote Data Redis', 'Widget/Global Cache Redis', 'Widget/Auth Redis'].forEach(function (n) {
        S[n] = [
          { k: 'gauge', t: 'Redis 메모리 사용률', unit: '%', v: [62, 4], max: 100, c: CC.bl },
          { k: 'line', t: 'Hit Ratio · 지연', unit: '%', dec: 1, series: [['Hit', CC.gn, 98.2, 0.4]], lo: 90, hi: 100 },
          { k: 'donut', t: '노드 상태', parts: [['ON', CC.gn, 11], ['OFF', CC.gr, 1]] },
        ];
      });
    } else if (scene === 'infra') {
      ['Widget/MDB', 'Widget/Auth', 'Widget/Partner Servers', 'Widget/Overseas Derivatives', 'Widget/Blotter', 'Widget/DB'].forEach(function (n) { S[n] = infra; });
    } else if (scene === 'event') {
      S['Widget/Event Status'] = [
        { k: 'bar', t: '시간대별 이벤트', unit: '건', cats: ['09', '10', '11', '12', '13'], vals: [96, 132, 104, 71, 119], max: 160, c: CC.bl },
        { k: 'donut', t: '등급별 이벤트', parts: [['CR', CC.re, 2], ['MA', CC.or, 7], ['MI', CC.ye, 15], ['WA', CC.cy, 186], ['NO', CC.gn, 312]] },
        { k: 'line', t: '이벤트 발생 추이', unit: '건', dec: 0, series: [['WA', CC.cy, 22, 5], ['MA·CR', CC.re, 2, 1]], lo: 0, hi: 40 },
      ];
    }
    return S;
  }
  var KEEP = /^(Background|Title Bar|Title|Header Background|Shape)$/;
  function installChartSwap(root, st) {
    var savedAll = load(K_CHART), saved = savedAll[st.scene] || {};
    st.charts = {}; st.chartApply = {};
    var probe = document.createElement('i');
    probe.className = 'sl-probe';
    st.frame.appendChild(probe);
    var spec = specsFor(st.scene);
    st.panels.forEach(function (p) {
      var list = spec[p.name];
      if (!list) return;
      var r = p.rect;
      if (!r || r.w < 120 || r.h < 80) return;
      var keep = p.els.filter(function (e) { return KEEP.test(nm(e)) && rectIn(e, st).w >= r.w * 0.6 && rectIn(e, st).h >= r.h * 0.6; });
      var tbar = p.els.filter(function (e) { return /^Title/.test(nm(e)) || e.closest('[data-name="Title Bar"]'); });
      var tb = unionRect(tbar, st);
      var top = tb ? tb.y + tb.h - r.y + 6 : 40;
      if (p.name === 'Chart Row') top = 64;
      var host = document.createElement('div');
      host.className = 'sl-chost';
      host.setAttribute('data-name', 'Chart Host');
      host.style.display = 'none';
      host.style.left = (r.x + 10) + 'px'; host.style.top = (r.y + top) + 'px';
      host.style.width = Math.max(100, r.w - 20) + 'px'; host.style.height = Math.max(60, r.h - top - 10) + 'px';
      st.frame.appendChild(host);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sl-chartbtn';
      btn.innerHTML = KIND_ICON.bar.replace('class="ic"', 'class="ic" style="width:13px;height:11px"') + '차트';
      btn.title = '이 패널의 차트 바꾸기';
      var menu = document.createElement('div');
      menu.className = 'sl-chartmenu';
      var bx = r.x + r.w - 78, by = r.y + 8;
      btn.style.left = bx + 'px'; btn.style.top = by + 'px';
      menu.style.left = Math.max(0, bx - 190) + 'px'; menu.style.top = (by + 26) + 'px';
      st.frame.appendChild(btn); st.frame.appendChild(menu);
      [host, btn, menu].forEach(function (x) { adopt(st, p, x); });
      var cur = saved[p.name] != null ? saved[p.name] : -1;
      function render() {
        menu.innerHTML = '<div class="hd">추천 차트</div>'
          + list.map(function (s, i) {
            return '<button type="button" data-i="' + i + '"' + (i === cur ? ' class="cur"' : '') + '>' + KIND_ICON[s.k] + esc(s.t) + ' · ' + KIND_NAME[s.k]
              + (i === 0 ? '<span class="rec">추천</span>' : '') + '</button>';
          }).join('')
          + '<div class="sep"></div><button type="button" data-i="-1"' + (cur < 0 ? ' class="cur"' : '') + '>' + KIND_ICON.orig + '원본 그대로</button>';
      }
      function hideOrig(on) {
        p.els.forEach(function (e) {
          if (e === host || e === btn || e === menu || keep.indexOf(e) >= 0 || tbar.indexOf(e) >= 0) return;
          if (e.classList.contains('sl-tabopen')) return;
          e.classList.toggle('sl-hid', on);
        });
      }
      function apply(i) {
        cur = i;
        if (st.charts[p.name]) { st.charts[p.name].dispose(); delete st.charts[p.name]; }
        host.style.display = i >= 0 ? 'block' : 'none';
        hideOrig(i >= 0);
        if (i >= 0 && list[i]) st.charts[p.name] = makeChart(host, Object.assign({ uid: ++chartUid }, list[i]));
        var m = load(K_CHART);
        m[st.scene] = m[st.scene] || {};
        if (i >= 0) m[st.scene][p.name] = i; else delete m[st.scene][p.name];
        save(K_CHART, m);
        render();
      }
      render();
      var stop = function (e) { e.stopPropagation(); };
      btn.addEventListener('pointerdown', stop);
      menu.addEventListener('pointerdown', stop);
      btn.addEventListener('pointerup', function (e) {
        e.stopPropagation(); e.preventDefault();
        all(root, '.sl-chartmenu.open').forEach(function (m) { if (m !== menu) m.classList.remove('open'); });
        menu.classList.toggle('open');
      });
      menu.addEventListener('pointerup', function (e) {
        var b = e.target.closest('button[data-i]');
        e.stopPropagation(); e.preventDefault();
        if (!b) return;
        apply(+b.getAttribute('data-i'));
        menu.classList.remove('open');
      });
      st.chartApply[p.name] = apply;
      if (cur >= 0) apply(cur);
    });
    syncChartHue(root, probe);
    st.timers.push(setInterval(function () { syncChartHue(root, probe); }, 1200));
    st.onDocDown = function (e) {
      if (e.target.closest && e.target.closest('.sl-chartmenu, .sl-chartbtn')) return;
      all(root, '.sl-chartmenu.open').forEach(function (m) { m.classList.remove('open'); });
    };
    document.addEventListener('pointerdown', st.onDocDown, true);
  }

  /* ══════════════════ 12. 패널 옮기기(패널편집) ══════════════════ */
  function installPanelMove(root, st) {
    var L = load(K_LAYOUT), me = L[st.scene] = L[st.scene] || {};
    me.free = me.free || {};
    function persist() { var a = load(K_LAYOUT); a[st.scene] = me; save(K_LAYOUT, a); }
    st.panels.forEach(function (p) {
      p.els.forEach(function (e) { e.classList.add('sl-mv'); e.__unit = p; });
      var bg = p.els.filter(function (e) { return /^(Background|Shape)$/.test(nm(e)); }).sort(function (a, b) { return rectIn(b, st).w * rectIn(b, st).h - rectIn(a, st).w * rectIn(a, st).h; })[0] || p.els[0];
      if (bg) bg.classList.add('sl-mvbg');
      var s = me.free[p.name];
      if (s) p.els.forEach(function (e) { e.__ux = s[0]; e.__uy = s[1]; place(e); e.classList.add('sl-front'); });
    });
    var drag = null;
    st.onDown = function (e) {
      if (!layoutEditing(root) || e.button !== 0) return;
      if (e.target.closest('.sl-chartbtn, .sl-chartmenu, .sl-resetbtn')) return;
      if (e.target.closest('[contenteditable="true"]') && e.target.closest('p')) return;
      var w = e.target.closest('.sl-mv');
      if (!w || !root.contains(w) || !w.__unit) return;
      e.preventDefault(); e.stopPropagation();
      drag = { u: w.__unit, sx: e.clientX, sy: e.clientY, moved: false };
    };
    st.onMove = function (e) {
      if (!drag) return;
      var S = (st.frame.getBoundingClientRect().width / BASE_W) || st.S || 1;
      var dx = (e.clientX - drag.sx) / S, dy = (e.clientY - drag.sy) / S;
      if (!drag.moved) { if (Math.hypot(dx, dy) < 3) return; drag.moved = true; drag.u.els.forEach(function (x) { x.classList.add('sl-dragging'); }); }
      drag.u.els.forEach(function (x) { x.__dx = dx; x.__dy = dy; place(x); });
    };
    st.onUp = function () {
      if (!drag) return;
      var d = drag; drag = null;
      d.u.els.forEach(function (x) { x.classList.remove('sl-dragging'); });
      if (!d.moved) return;
      var snap = function (v) { return Math.round(v / 4) * 4; };
      var e0 = d.u.els[0];
      var ux = snap((e0.__ux || 0) + (e0.__dx || 0)), uy = snap((e0.__uy || 0) + (e0.__dy || 0));
      all(root, '.sl-front').forEach(function (x) { x.classList.remove('sl-front'); });
      d.u.els.forEach(function (x) { x.__ux = ux; x.__uy = uy; x.__dx = 0; x.__dy = 0; place(x); x.classList.toggle('sl-front', !!(ux || uy)); });
      me.free[d.u.name] = [ux, uy];
      persist();
    };
    root.addEventListener('pointerdown', st.onDown, true);
    window.addEventListener('pointermove', st.onMove);
    window.addEventListener('pointerup', st.onUp);
    window.addEventListener('pointercancel', st.onUp);
    st.onDragStart = function (e) { if (layoutEditing(root) && e.target.closest && e.target.closest('.sl-mv')) e.preventDefault(); };
    root.addEventListener('dragstart', st.onDragStart);
    st.resetLayout = function () {
      me = { free: {} };
      var a = load(K_LAYOUT); a[st.scene] = me; save(K_LAYOUT, a);
      st.panels.forEach(function (p) { p.els.forEach(function (e) { e.__ux = 0; e.__uy = 0; place(e); e.classList.remove('sl-front'); }); });
      Object.keys(st.chartApply || {}).forEach(function (k) { st.chartApply[k](-1); });
    };
    var rb = document.createElement('button');
    rb.type = 'button';
    rb.className = 'sl-resetbtn';
    rb.textContent = '배치 초기화';
    rb.title = '패널 자리 · 바꾼 차트를 원본으로';
    st.frame.appendChild(rb);
    rb.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    rb.addEventListener('pointerup', function (e) { e.stopPropagation(); e.preventDefault(); st.resetLayout(); });
    st.onReset = function (e) { if (e.target.closest && e.target.closest('#layoutReset')) st.resetLayout(); };
    document.addEventListener('click', st.onReset, true);
  }

  /* ══════════════════ 살리기 ══════════════════ */
  var OVER = { 'smx-mount': 'eventpanel', 'sma-mount': 'alert', 'smg-mount': 'sound' };
  function sceneOf(root) {
    var m = /\b(sm[a-z])-root\b/.exec(root.className);
    var px = m ? m[1] : 'smm', scene = SCENE_OF[px] || 'main', overlay = null;
    Object.keys(OVER).forEach(function (k) { if (!overlay && one(root, '.' + k)) overlay = OVER[k]; });
    return { px: px, scene: scene, overlay: overlay };
  }
  function start(root, st) {
    st.frame = frameOf(root);
    if (!st.frame) return;
    st.S = 1; st.exW = 0; st.exH = 0;
    var steps = [['recent', installRecent], ['hscroll0', function () { }], ['fit', installFit], ['clock', installClock], ['nav', installNav], ['hover', installHover],
      ['hscroll', installHScroll], ['vscroll', installVScroll], ['evbar', installEventBar], ['chartfold', installChartFold], ['segments', installSegments], ['bars', installBars],
      ['gbars', installGradBars], ['numbers', installNumbers], ['lines', installLines], ['theme', installTheme], ['swap', installChartSwap], ['move', installPanelMove], ['tips', installTips]];
    steps.forEach(function (s) { try { s[1](root, st); } catch (e) { console.warn('[secmon] ' + s[0], e); } });
    root.classList.add('sl-enter');
    st.timers.push(setTimeout(function () { root.classList.remove('sl-enter'); }, 1600));
  }
  function initSecmon(root) {
    if (!root || root.__sl) return;
    injectStyle();
    root.classList.add('sl-root');
    var so = sceneOf(root);
    var st = root.__sl = { timers: [], scene: so.scene, px: so.px, overlay: so.overlay, onLayout: [] };
    if (/[?&]edit=1/.test(location.search)) root.classList.add('sl-edit-layout');
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
  function disposeSecmon(root) {
    var st = root && root.__sl;
    if (!st) return;
    if (st.wait) st.wait.disconnect();
    st.timers.forEach(function (t) { clearInterval(t); clearTimeout(t); });
    clearTimeout(st.toastT);
    if (st.ro) st.ro.disconnect();
    if (st.mo) st.mo.disconnect();
    if (st.onResize) window.removeEventListener('resize', st.onResize);
    Object.keys(st.charts || {}).forEach(function (k) { st.charts[k].dispose(); });
    if (st.onDocDown) document.removeEventListener('pointerdown', st.onDocDown, true);
    if (st.onDocClick) document.removeEventListener('pointerdown', st.onDocClick, true);
    if (st.onDown) root.removeEventListener('pointerdown', st.onDown, true);
    if (st.onMove) window.removeEventListener('pointermove', st.onMove);
    if (st.onUp) { window.removeEventListener('pointerup', st.onUp); window.removeEventListener('pointercancel', st.onUp); }
    if (st.onDragStart) root.removeEventListener('dragstart', st.onDragStart);
    if (st.onReset) document.removeEventListener('click', st.onReset, true);
    if (st.onTipOver) { root.removeEventListener('pointerover', st.onTipOver); root.removeEventListener('pointerleave', st.onTipOut); root.removeEventListener('pointerdown', st.onTipOut); }
    root.__sl = null;
  }
  window.initSecmon = initSecmon;
  window.disposeSecmon = disposeSecmon;
})();
