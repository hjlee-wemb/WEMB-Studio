/* 스마트 플랜트 가스 모니터링 — 재구축 화면 5장(메인 · 가스 메인 · 팝업 3장)의 인터랙션 · 라이브 · 반응형 레이어.
   window.initGasmon(root) / window.disposeGasmon(root)

   화면(DOM·CSS)은 생성기(src/gasmon/_gen/conv.js)가 Figma(CbbEsxxZo3vBcBprsiUhJm, REM 페이지) 그대로 만든다.
   이 파일은 그 위에 '움직이는 것'만 얹는다 — 정지 상태(?live=0) = Figma 원본.

   · 반응형 — 1920x1080 좌표계 + 균일 배율 S. 남는 폭 · 높이는 헤더 · 이벤트 로그 · 센서 패널 간격 · 도면 자리가 나눠 갖는다. 정확히 16:9 면 Figma 와 같다.
   · 실시간 시계, 이벤트 로그 발생일시 = 열 때마다 최근(recent-time.js), 새 이벤트가 맨 위로 흘러 들어온다
   · 마우스 오버 · 눌림 — 메뉴 · 메뉴 카드 · 센서 표지 · 표 줄 · 단추 · 칩
   · 이벤트 로그 Fold Button(접기 화살표) — 접고 펴기, 화면마다 기억
   · 라이브 — 센서 수치 · 미터(값 % 까지 채움 + 안쪽 빛), 가스 농도 배지. 사람이 고친 글자는 덮지 않는다.
   · 화면 잇기 — 헤더 메뉴(메인 · 가스) · 메뉴 카드(가스) · 도면 센서 표지 → 작업개소 상세 / 가스농도 이상 · 완료 → 전송 확인 · 닫기
   · 차트 바꾸기(패널편집 중) — 센서현황 · 이벤트 현황 · 팝업 위젯마다 가스 관제에 맞춘 추천 차트. 첫 항목 = 추천, '원본 그대로'로 되돌린다.
   · 패널 옮기기(패널편집 중) — 센서현황 세 장은 위아래로 흐르며 다시 쌓이고, 메뉴 카드는 여섯 자리끼리, 도면 · 팝업 위젯은 4px 격자로 옮긴다.

   손으로 쓴 파일이다(생성물 아님). 고친 뒤 node mk-live.js → js/core/tpl-modules.js 의 ?v= 를 올릴 것. */
(function () {
  'use strict';

  var BASE_W = 1920, BASE_H = 1080;
  var K_LAYOUT = 'wemb-gasmon-layout', K_CHART = 'wemb-gasmon-chart', K_FOLD = 'wemb-gasmon-fold';
  var STYLE_ID = 'gasmon-live-style';
  var EASE = 'cubic-bezier(.22,.8,.24,1)';
  var EL_OPEN = 297, EL_SHUT = 88;               /* 이벤트 로그 높이 — 메인(펼침) · 가스 메인(접힘) Figma 값 */

  /* ══════════════════ 스타일 ══════════════════ */
  var CSS = [
    '.gm-root{--gm-acc:0,187,255;overflow:clip!important;}',
    '.gm-root.gm-resizing *,.gm-root .gm-dragging,.gm-root .gm-dragging *{transition:none!important;}',
    '.gm-root.gm-live .gm-place{transition:translate .5s ' + EASE + ',opacity .3s ease;}',
    '.gm-root .gm-probe{position:absolute;width:0;height:0;overflow:hidden;color:#00bbff;}',
    '.gm-root .gm-click{cursor:pointer;}',
    '.gm-root .gm-click *{cursor:inherit;}',
    '.dt-content-editing .gm-root .gm-click,.dt-content-editing .gm-root .gm-click *{cursor:text;}',
    '@keyframes gmIn{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}',
    '@keyframes gmPop{from{opacity:0;transform:translateY(10px) scale(.985);}to{opacity:1;transform:none;}}',
    '@keyframes gmDim{from{opacity:0;}to{opacity:1;}}',
    '.gm-root.gm-enter [data-name="Column/Left"] > *{animation:gmIn .45s ' + EASE + ' both;animation-delay:calc(var(--i,0) * 70ms);}',
    '.gm-root.gm-enter [data-name^="Row/"] > [data-name^="Menu Card/"]{animation:gmIn .45s ' + EASE + ' both;animation-delay:calc(var(--i,0) * 55ms);}',
    '.gm-root.gm-enter .sh-popmount{animation:gmPop .38s ' + EASE + ' both;}',
    '.gm-root.gm-enter .sh-dim{animation:gmDim .3s ease both;}',

    /* 헤더 메뉴 */
    '.gm-root [data-name^="Nav Item"]{transition:background-color .2s ease,filter .2s ease;}',
    '.gm-root [data-name^="Nav Item"] p{transition:color .2s ease,translate .2s ease;}',
    '.gm-root [data-name^="Nav Item"]:not(.gm-sel):hover{background-image:radial-gradient(60% 110% at 50% 100%,rgba(0,187,255,.42),rgba(0,187,255,0) 72%)!important;}',
    '.gm-root [data-name^="Nav Item"]:not(.gm-sel):hover p{color:#fff!important;}',
    '.gm-root [data-name^="Nav Item"]:not(.gm-sel):active p{translate:0 1px;}',
    '.gm-root [data-name="Header"] > [data-name="Logo"]{position:absolute;left:22px;top:9px;width:66px;height:32px;pointer-events:none;}',
    '.gm-root [data-name="Header"] > [data-name="Logo"] .tpl-studio-logo{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;object-position:left center;}',
    '.gm-root [data-name="Icon/Header/Logout"]{cursor:pointer;transition:filter .18s ease,translate .18s ease;}',
    '.gm-root [data-name="Icon/Header/Logout"]:hover{filter:brightness(1.6) drop-shadow(0 0 4px rgba(var(--gm-acc),.7));translate:2px 0;}',
    /* 메뉴 카드 */
    '.gm-root [data-name^="Menu Card/"]{transition:translate .35s ' + EASE + ',filter .3s ease;}',
    '.gm-root [data-name^="Menu Card/"] [data-name="Orb"]{transition:filter .3s ease,translate .35s ' + EASE + ';}',
    '.gm-root [data-name^="Menu Card/"] [data-name^="Icon/Menu/"]{transition:translate .35s ' + EASE + ',filter .3s ease;}',
    '.gm-root [data-name^="Menu Card/"]:hover{filter:drop-shadow(0 0 22px rgba(0,170,255,.35));}',
    '.gm-root [data-name^="Menu Card/"]:hover [data-name="Orb"]{filter:brightness(1.25);translate:0 -6px;}',
    '.gm-root [data-name^="Menu Card/"]:hover [data-name^="Icon/Menu/"]{translate:0 -10px;filter:brightness(1.15);}',
    '.gm-root [data-name^="Menu Card/"].gm-click:active [data-name^="Icon/Menu/"]{translate:0 -6px;}',
    '@keyframes gmFloat{0%,100%{translate:0 0;}50%{translate:0 -4px;}}',
    '.gm-root.gm-live [data-name^="Menu Card/"]:not(:hover) [data-name^="Icon/Menu/"]{animation:gmFloat 3.6s ease-in-out infinite;}',
    '.gm-root [data-name="Menu Card/CCTV"] [data-name^="Icon/Menu/"]{animation-delay:-1.8s!important;}',
    /* 이벤트 로그 */
    '.gm-root [data-name="Event Log"],.gm-root.gm-live [data-name="Event Log"].gm-place{transition:height .5s ' + EASE + ',translate .5s ' + EASE + ';}',
    /* 가스 화면은 Figma 레이어 순서상 Content(평면도)가 Event Log 위 → 접기 화살표가 눌리지 않고 펼친 목록이 평면도에 가린다.
       닫힌 상태 픽셀 차이 65px 뿐이라 Event Log 를 위로, 팝업 Dim · 창은 그보다 위로. */
    '.gm-root [data-name="Event Log"]{z-index:2;}',
    '.gm-root .sh-dim{z-index:3;}.gm-root .sh-popmount{z-index:4;}',
    /* 차트 메뉴가 아래 패널에 가려 눌리지 않던 것 — 메뉴를 연 패널을 형제들 위로 */
    '.gm-root :has(> .gm-chartmenu.open){z-index:50!important;}',
    '.gm-root [data-name="Meter Fill"].gm-mtint{filter:hue-rotate(var(--gm-chue,0deg));}',
    '.gm-root [data-name="Icon/Event/Arrow Drop"],.gm-root [data-name="Button/Ack"],.gm-root [data-name^="Count/"],.gm-root [data-name="Icon/Event/Audio"]{cursor:pointer;transition:filter .18s ease,translate .18s ease,opacity .2s ease;}',
    '.gm-root [data-name="Icon/Event/Arrow Drop"]:hover,.gm-root [data-name="Button/Ack"]:hover,.gm-root [data-name^="Count/"]:hover,.gm-root [data-name="Icon/Event/Audio"]:hover{filter:brightness(1.3);}',
    '.gm-root [data-name="Icon/Event/Arrow Drop"]:active,.gm-root [data-name="Button/Ack"]:active,.gm-root [data-name^="Count/"]:active{translate:0 1px;filter:brightness(.92);}',
    '.gm-root .gm-fold{transition:rotate .45s ' + EASE + ';}',
    '.gm-root .gm-fold.gm-turn{rotate:180deg;}',
    '.gm-root [data-name^="Count/"].gm-off{opacity:.4;filter:saturate(.3);}',
    '.gm-root [data-name="List"] > [data-name^="Row/"]{transition:background-color .2s ease,opacity .3s ease;}',
    '.gm-root [data-name="Event Log"] [data-name="List"] > [data-name^="Row/"]:hover{background-color:rgba(0,187,255,.08);}',
    '.gm-root [data-name="Event Log"] [data-name="List"] > [data-name^="Row/"].gm-hide{display:none;}',
    '.gm-root [data-name="Event Log"] [data-name="List"] > [data-name^="Row/"].gm-new{overflow:hidden;animation:gmNew 1.6s ease;}',
    '@keyframes gmNew{0%{background-color:rgba(0,187,255,.28);}100%{background-color:rgba(0,187,255,0);}}',
    '.gm-root .gm-acked{opacity:.55;}',
    '@keyframes gmBlink{0%,100%{opacity:1;}50%{opacity:.35;}}',
    '.gm-root [data-name^="Count/Critical"] [data-name="status"]{animation:gmBlink 1.8s ease-in-out infinite;}',
    /* 도면 */
    '.gm-root [data-name^="Marker/Sensor"]{cursor:pointer;transition:scale .2s ' + EASE + ',filter .2s ease;}',
    '.gm-root [data-name^="Marker/Sensor"]:hover{scale:1.35;filter:drop-shadow(0 0 6px rgba(255,255,255,.85));z-index:3;}',
    '@keyframes gmPulse{0%{box-shadow:0 0 0 0 rgba(227,220,9,.65);}70%{box-shadow:0 0 0 12px rgba(227,220,9,0);}100%{box-shadow:0 0 0 0 rgba(227,220,9,0);}}',
    '.gm-root [data-name$="(Minor)"][data-name^="Marker/Sensor"]{border-radius:50%;animation:gmPulse 2s ease-out infinite;}',
    /* 센서현황 */
    '.gm-root [data-name^="Widget/Sensor Status"] [data-name^="Row/"]{transition:filter .2s ease;}',
    '.gm-root [data-name^="Widget/Sensor Status"] [data-name^="Row/"]:hover{filter:brightness(1.22);}',
    '.gm-root [data-name^="Tab/GAS#"]{cursor:pointer;}',
    '.gm-root [data-name^="Tab/GAS#"] p{transition:color .2s ease;}',
    '.gm-root [data-name^="Tab/GAS#"]:hover p{color:#56eefa!important;}',
    /* 팝업 */
    '.gm-root [data-name="Button/Close"]{cursor:pointer;transition:filter .18s ease;}',
    '.gm-root [data-name="Button/Close"]:hover{filter:brightness(1.5) drop-shadow(0 0 5px rgba(136,208,254,.6));}',
    '.gm-root [data-name="Button/Done"],.gm-root [data-name="Button/Send"],.gm-root [data-name="Button/Cancel"]{cursor:pointer;transition:filter .18s ease,translate .18s ease;}',
    '.gm-root [data-name="Button/Done"]:hover,.gm-root [data-name="Button/Send"]:hover,.gm-root [data-name="Button/Cancel"]:hover{filter:brightness(1.18);translate:0 -1px;}',
    '.gm-root [data-name="Button/Done"]:active,.gm-root [data-name="Button/Send"]:active,.gm-root [data-name="Button/Cancel"]:active{filter:brightness(.92);translate:0 1px;}',
    '.gm-root [data-name^="Row/Odd"],.gm-root [data-name^="Row/Even"]{cursor:pointer;}',
    '.gm-root [data-name^="Row/Odd"]:hover > [data-name="Background"],.gm-root [data-name^="Row/Even"]:hover > [data-name="Background"]{filter:brightness(1.35);}',
    '.gm-root .gm-rowsel > [data-name="Background"]{background-image:linear-gradient(90deg,rgba(0,136,255,.5),rgba(0,136,255,.5)),linear-gradient(90deg,#09182e,#09182e)!important;}',
    '.gm-root .gm-rowunsel > [data-name="Background"]{background-image:none!important;background-color:#09182e!important;}',
    '.gm-root[data-theme="light"] .gm-rowsel > [data-name="Background"]{background-image:linear-gradient(90deg,rgba(0,128,240,.16),rgba(0,128,240,.16)),linear-gradient(90deg,#fff,#fff)!important;}',
    '.gm-root[data-theme="light"] .gm-rowunsel > [data-name="Background"]{background-color:#fff!important;}',
    '.gm-root [data-name^="Field/"]{transition:filter .2s ease;}',
    '.gm-root [data-name^="Field/"]:hover{filter:brightness(1.25);}',
    '.gm-root [data-name^="Metric/"]{transition:filter .2s ease;}',
    '.gm-root [data-name^="Metric/"]:hover{filter:brightness(1.2);}',
    '.gm-root .sh-popmount{transition:translate .5s ' + EASE + ';}',
    '.gm-root .gm-toast{position:absolute;left:50%;top:76px;z-index:80;translate:-50% -8px;opacity:0;padding:9px 18px;border:1px solid rgba(136,208,254,.7);background:rgba(12,16,21,.94);color:#ddedff;font:600 14px/1 "Pretendard Variable",Pretendard,sans-serif;pointer-events:none;transition:opacity .25s ease,translate .3s ' + EASE + ';white-space:nowrap;}',
    '.gm-root .gm-toast.on{opacity:1;translate:-50% 0;}',
    '.gm-root[data-theme="light"] .gm-toast{background:#fff;color:#15253a;border-color:#3b9be0;box-shadow:0 6px 18px rgba(30,60,100,.16);}',

    /* 패널편집 */
    '.dt-editing .gm-root .gm-mv,.gm-root.gm-edit-layout .gm-mv{cursor:grab!important;}',
    '.dt-editing .gm-root .gm-mv *,.gm-root.gm-edit-layout .gm-mv *{cursor:grab!important;}',
    '.dt-editing .gm-root .gm-mv:hover,.gm-root.gm-edit-layout .gm-mv:hover{outline:1px dashed rgba(var(--gm-acc),.75);outline-offset:3px;}',
    '.gm-root .gm-mv{transition:translate .3s ' + EASE + ';}',
    '.gm-root .gm-mv.gm-dragging{z-index:30;filter:drop-shadow(0 14px 22px rgba(0,0,0,.5));cursor:grabbing!important;}',
    '.gm-root .gm-resetbtn{position:absolute;left:420px;top:60px;z-index:45;display:none;height:30px;padding:0 12px;border:1px solid rgb(var(--gm-acc));border-radius:6px;background:#0c1d33;color:#e6f7ff;font:500 13px/1 "Pretendard Variable",Pretendard,sans-serif;cursor:pointer;}',
    '.gm-root .gm-resetbtn:hover{filter:brightness(1.25);box-shadow:0 0 12px rgba(var(--gm-acc),.6);}',
    '.dt-editing .gm-root .gm-resetbtn,.gm-root.gm-edit-layout .gm-resetbtn{display:block;}',
    '.gm-root[data-theme="light"] .gm-resetbtn{background:#fff;color:#15253a;}',
    '.dt-editing .gm-root [data-name]{animation-play-state:paused!important;}',
    '.gm-root .gm-swapped > *:not(.gm-chart):not(.gm-chartbtn):not(.gm-chartmenu){visibility:hidden!important;}',
    '.gm-root .gm-chost{position:absolute;z-index:6;pointer-events:auto;}',
    '.gm-root .gm-rows-off > [data-name^="Row/"]{visibility:hidden;}',
    '.gm-root .gm-chart{border-radius:inherit;z-index:2;}',
    '.gm-root .gm-chartbtn{position:absolute;top:8px;right:46px;}',
    '.gm-root .gm-chartmenu{top:32px;right:14px;}',
    '.gm-root [data-name="Event Log"] .gm-chartbtn{top:2px;right:420px;}',
    '.gm-root [data-name="Event Log"] .gm-chartmenu{top:26px;right:420px;}',
    '.gm-root .gm-chartbtn{position:absolute;top:-11px;right:14px;z-index:25;display:none;align-items:center;gap:4px;height:22px;padding:0 9px;border:1px solid rgb(var(--gm-acc));background:#06264a;color:#e6f7ff;font:500 12px/1 Pretendard,system-ui,sans-serif;cursor:pointer;white-space:nowrap;}',
    '.gm-root .gm-chartbtn:hover{filter:brightness(1.25);box-shadow:0 0 12px rgba(var(--gm-acc),.6);}',
    '.dt-editing .gm-root .gm-chartbtn,.dt-content-editing .gm-root .gm-chartbtn,.gm-root.gm-edit-layout .gm-chartbtn{display:inline-flex;}',
    '.gm-root .gm-chartmenu{position:absolute;top:14px;right:14px;z-index:40;min-width:208px;padding:5px;border:1px solid #2a7ca0;background:#071a30;color:#c7ecf4;font:400 13px/1.35 Pretendard,system-ui,sans-serif;box-shadow:0 12px 28px rgba(0,0,0,.5);opacity:0;translate:0 -4px;pointer-events:none!important;transition:opacity .16s ease,translate .16s ease;}',
    '.gm-root .gm-chartmenu.open{opacity:1;translate:0 0;pointer-events:auto!important;}',
    '.gm-root .gm-chartmenu .hd{padding:4px 8px 6px;font-size:11px;color:#8ea6b3;white-space:nowrap;}',
    '.gm-root .gm-chartmenu button{display:flex;align-items:center;gap:8px;width:100%;padding:6px 8px;border:0;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer!important;white-space:nowrap;}',
    '.gm-root .gm-chartmenu button:hover{background:rgba(var(--gm-acc),.14);color:#fff;}',
    '.gm-root .gm-chartmenu button.cur{background:rgba(9,182,251,.26);color:#fff;}',
    '.gm-root .gm-chartmenu .ic{width:18px;height:14px;flex:none;}',
    '.gm-root .gm-chartmenu .rec{margin-left:auto;padding:1px 6px;background:rgb(var(--gm-acc));color:#03202e;font-size:10px;font-weight:700;}',
    '.gm-root .gm-chartmenu .sep{height:1px;margin:4px 2px;background:rgba(199,236,244,.16);}',
    '.gm-root .gm-chart{position:absolute;inset:0;display:flex;flex-direction:column;padding:10px 14px 8px;background:linear-gradient(180deg,rgba(14,32,54,.97),rgba(12,26,46,.97));box-shadow:inset 0 0 0 1px rgba(42,124,160,.75);color:#c7ecf4;font:400 12px/1.3 Pretendard,system-ui,sans-serif;animation:gmIn .35s ease;}',
    '.gm-root .gm-chart .pl,.gm-root .gm-chart .lg,.gm-root .gm-chart .ct i,.gm-root .gm-chart .ct b{filter:hue-rotate(var(--gm-chue,0deg));}',
    '.gm-root .gm-chart .ct{display:flex;align-items:center;gap:6px;font-weight:500;font-size:15px;color:#fff;white-space:nowrap;}',
    '.gm-root .gm-chart .ct i{display:block;width:8px;height:8px;background:#2a7ca0;flex:none;}',
    '.gm-root .gm-chart .ct b{margin-left:auto;font-family:Tomorrow,Pretendard,sans-serif;font-weight:400;font-size:18px;color:#00ffd2;}',
    '.gm-root .gm-chart .ct b small{font:400 11px Pretendard,sans-serif;color:#8ea6b3;margin-left:3px;}',
    '.gm-root .gm-chart .lg{display:flex;gap:10px;margin-top:3px;font-size:11px;color:#8ea6b3;white-space:nowrap;}',
    '.gm-root .gm-chart .lg span{display:inline-flex;align-items:center;gap:4px;}',
    '.gm-root .gm-chart .lg span:before{content:"";width:9px;height:3px;background:var(--c);}',
    '.gm-root .gm-chart .pl{position:relative;flex:1;min-height:0;margin-top:6px;}',
    '.gm-root .gm-chart svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;}',
    '.gm-root .gm-chart .ax{fill:#8ea6b3;font-size:11px;font-family:Pretendard,system-ui,sans-serif;}',
    '.gm-root .gm-chart .gl{stroke:rgba(142,166,179,.16);stroke-width:1;shape-rendering:crispEdges;}',
    '.gm-root .gm-chart .bars{position:absolute;inset:0 0 16px;display:flex;align-items:flex-end;justify-content:space-around;gap:8px;}',
    '.gm-root .gm-chart .bars > div{position:relative;flex:1;max-width:34px;height:100%;display:flex;align-items:flex-end;}',
    '.gm-root .gm-chart .bars i{display:block;width:100%;background:linear-gradient(180deg,var(--c),rgba(9,182,251,.18));transition:height .9s ' + EASE + ';}',
    '.gm-root .gm-chart .bars em{position:absolute;left:50%;translate:-50% 0;bottom:calc(var(--h) + 2px);font-style:normal;font-size:11px;color:#e6f7ff;white-space:nowrap;transition:bottom .9s ' + EASE + ';}',
    '.gm-root .gm-chart .bars u{position:absolute;left:50%;translate:-50% 0;bottom:-16px;text-decoration:none;font-size:11px;color:#8ea6b3;white-space:nowrap;}',
    '.gm-root .gm-chart .hb{display:flex;flex-direction:column;justify-content:space-around;height:100%;gap:3px;}',
    '.gm-root .gm-chart .hb > div{display:grid;grid-template-columns:72px 1fr 50px;align-items:center;gap:8px;font-size:12px;}',
    '.gm-root .gm-chart .hb s{position:relative;display:block;height:8px;background:rgba(142,166,179,.16);overflow:hidden;text-decoration:none;}',
    '.gm-root .gm-chart .hb s i{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,rgba(9,182,251,.5),var(--c));transition:width .9s ' + EASE + ';}',
    '.gm-root .gm-chart .hb b{text-align:right;color:#fff;font-weight:500;font-variant-numeric:tabular-nums;}',
    '.gm-root .gm-chart .arc{transition:stroke-dasharray .9s ' + EASE + ',stroke-dashoffset .9s ' + EASE + ';}',
    '.gm-root .gm-chart .gv{position:absolute;left:0;right:0;bottom:0;text-align:center;font-family:Tomorrow,Pretendard,sans-serif;font-size:22px;color:#00ffd2;}',
    '.gm-root .gm-chart .gv small{font:400 12px Pretendard,sans-serif;color:#8ea6b3;margin-left:2px;}',
    '.gm-root .gm-chart .dn{display:flex;align-items:center;gap:16px;height:100%;}',
    '.gm-root .gm-chart .dn .ring{position:relative;height:100%;aspect-ratio:1;flex:none;}',
    '.gm-root .gm-chart .dn .ring b{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Tomorrow,Pretendard,sans-serif;font-weight:400;font-size:17px;color:#fff;}',
    '.gm-root .gm-chart .dn .ring b small{font:400 10px Pretendard,sans-serif;color:#8ea6b3;}',
    '.gm-root .gm-chart .dn ul{list-style:none;display:flex;flex-direction:column;gap:4px;font-size:12px;min-width:0;flex:1;}',
    '.gm-root .gm-chart .dn li{display:flex;align-items:center;gap:6px;white-space:nowrap;}',
    '.gm-root .gm-chart .dn li:before{content:"";width:9px;height:3px;background:var(--c);flex:none;}',
    '.gm-root .gm-chart .dn li b{margin-left:auto;color:#fff;font-weight:500;font-variant-numeric:tabular-nums;}',
    /* 라이트 호버 — 흰 판은 brightness 를 올려도 변화가 없어 살짝 눌러 보이게 한다 */
    '.gm-root[data-theme="light"] [data-name^="Nav Item"]:not(.gm-sel):hover p{color:#0a5fa8!important;}',
    '.gm-root[data-theme="light"] [data-name^="Nav Item"]:not(.gm-sel):hover{background-image:radial-gradient(60% 110% at 50% 100%,rgba(0,140,230,.22),rgba(0,140,230,0) 72%)!important;}',
    '.gm-root[data-theme="light"] [data-name="Icon/Header/Logout"]:hover{filter:brightness(.7);}',
    '.gm-root[data-theme="light"] [data-name^="Menu Card/"]:hover{filter:drop-shadow(0 10px 22px rgba(30,110,190,.22));}',
    '.gm-root[data-theme="light"] [data-name^="Menu Card/"]:hover [data-name="Orb"]{filter:brightness(1.04);}',
    '.gm-root[data-theme="light"] [data-name="Icon/Event/Arrow Drop"]:hover,.gm-root[data-theme="light"] [data-name="Button/Ack"]:hover,.gm-root[data-theme="light"] [data-name^="Count/"]:hover,.gm-root[data-theme="light"] [data-name="Icon/Event/Audio"]:hover{filter:brightness(.9);}',
    '.gm-root[data-theme="light"] [data-name="Event Log"] [data-name="List"] > [data-name^="Row/"]:hover{background-color:rgba(0,120,220,.06);}',
    '.gm-root[data-theme="light"] [data-name^="Marker/Sensor"]:hover{filter:drop-shadow(0 0 5px rgba(20,80,150,.55));}',
    '.gm-root[data-theme="light"] [data-name^="Widget/Sensor Status"] [data-name^="Row/"]:hover,.gm-root[data-theme="light"] [data-name^="Field/"]:hover,.gm-root[data-theme="light"] [data-name^="Metric/"]:hover{filter:brightness(.97);}',
    '.gm-root[data-theme="light"] [data-name^="Tab/GAS#"]:hover p{color:#0a7c96!important;}',
    '.gm-root[data-theme="light"] [data-name="Button/Close"]:hover{filter:brightness(.8);}',
    '.gm-root[data-theme="light"] [data-name^="Row/Odd"]:hover > [data-name="Background"],.gm-root[data-theme="light"] [data-name^="Row/Even"]:hover > [data-name="Background"]{filter:brightness(.96);}',
    '.gm-root[data-theme="light"] .gm-mv.gm-dragging{filter:drop-shadow(0 14px 22px rgba(30,60,100,.22));}',
    '.gm-root[data-theme="light"] .gm-chart{background:#fff;box-shadow:inset 0 0 0 1px #d9e2ea;color:#2c3e54;}',
    '.gm-root[data-theme="light"] .gm-chart .ct{color:#15253a;}',
    '.gm-root[data-theme="light"] .gm-chartbtn{background:#fff;color:#0a6ea8;box-shadow:0 2px 6px rgba(30,60,100,.14);}',
    '.gm-root[data-theme="light"] .gm-chart .ct b,.gm-root[data-theme="light"] .gm-chart .gv{color:#006a96;}',
    '.gm-root[data-theme="light"] .gm-chart .ct b small,.gm-root[data-theme="light"] .gm-chart .gv small,.gm-root[data-theme="light"] .gm-chart .lg,.gm-root[data-theme="light"] .gm-chart .bars u{color:#5a6c82;}',
    '.gm-root[data-theme="light"] .gm-chart .ax{fill:#5a6c82;}',
    '.gm-root[data-theme="light"] .gm-chart .bars em,.gm-root[data-theme="light"] .gm-chart .hb b,.gm-root[data-theme="light"] .gm-chart .dn b{color:#15253a;}',
    '.gm-root[data-theme="light"] .gm-chart .gl{stroke:#e4ebf1;}',
    '.gm-root[data-theme="light"] .gm-chartmenu{background:#fff;color:#2c3e54;border-color:#d9e2ea;box-shadow:0 8px 22px rgba(30,60,100,.14);}',
    '.gm-root[data-theme="light"] .gm-chartmenu button:hover,.gm-root[data-theme="light"] .gm-chartmenu button.cur{color:#15253a;}',
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
  function kid(el, name) { return el ? Array.prototype.filter.call(el.children, function (c) { return c.getAttribute('data-name') === name; })[0] : null; }
  function editing() { return !!document.querySelector('.dtstage.dt-content-editing, .dtstage.dt-editing, .dt-content-editing, .dt-editing'); }
  function layoutEditing(root) { return !!(root.closest('.dt-editing') || root.classList.contains('gm-edit-layout')); }
  function idle() { return typeof window.__wembIdle === 'function' ? window.__wembIdle() : document.hidden; }
  function load(k) { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function comma(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  /* 사람이 고친 글자는 덮지 않는다 */
  function claimed(p) { return p.__gmLast != null && p.textContent !== p.__gmLast; }
  function write(p, s) {
    if (!p || p === document.activeElement || claimed(p)) return;
    if (p.textContent !== s) p.textContent = s;
    p.__gmLast = p.textContent;
  }
  function clickable(el, fn) {
    if (!el) return;
    el.classList.add('gm-click');
    el.addEventListener('click', function (e) {
      if (editing()) return;
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
  function placed(el) { if (el) el.classList.add('gm-place'); return el; }
  function goto(scene) {
    if (window.__gotoGasmonScene) { window.__gotoGasmonScene(scene); return; }
    location.href = scene + '.html' + location.search;
  }
  function toast(st, msg) {
    var t = st.toast;
    if (!t) { t = st.toast = document.createElement('div'); t.className = 'gm-toast'; st.frame.appendChild(t); }
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(st.toastT);
    st.toastT = setTimeout(function () { t.classList.remove('on'); }, 1800);
  }

  /* ══════════════════ 1. 화면 맞추기 ══════════════════ */
  function installFit(root, st) {
    var frame = frameOf(root);
    frame.style.position = 'absolute';
    frame.style.left = '0';
    frame.style.top = '0';
    frame.style.transformOrigin = '0 0';
    st.frame = frame;
    st.S = 1; st.exW = 0; st.exH = 0;
    var layoutEl = kid(frame, 'Layout');                         /* 메인 — 세로 흐름 판 */
    var host = layoutEl || frame;
    var header = kid(host, 'Header'), elog = kid(host, 'Event Log'), content = kid(host, 'Content');
    var col = content && kid(content, 'Column/Left'), stage = content && kid(content, 'Stage/Plant Map');
    var tool = header && one(header, '[data-name="Toolbar"]'), nav = header && one(header, '[data-name="Nav"]');
    var mounts = all(frame, ':scope > .sh-popmount');
    [content, stage, col, tool, nav, elog].concat(mounts).forEach(placed);
    if (layoutEl) { [content].forEach(placed); }
    var wide = elog ? all(elog, '[data-name="Td/Message"],[data-name="Th/Message"],[data-name="Header Row"],[data-name="Header Row"] > [data-name="Background"],[data-name="Table"],[data-name="List"],[data-name="Body"],[data-name^="Row/"],[data-name="Cells"],[data-name="Toolbar"]') : [];
    wide.forEach(function (w) { w.__w0 = w.offsetWidth; });
    var colH0 = col ? col.offsetHeight : 0, contH0 = content ? content.offsetHeight : 0;
    st.elog = elog;
    function layout() {
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
      /* 정확히 1:1 일 때만 별도 층 — 배율이 바뀌면 층이 옛 해상도에 묶여 글자가 흐려진다 */
      frame.style.willChange = Math.abs(S - 1) < 1e-4 ? 'transform' : 'auto';
      if (layoutEl) { layoutEl.style.width = VW + 'px'; layoutEl.style.height = VH + 'px'; }
      if (header) header.style.width = (1919.262 + exW) + 'px';
      if (tool) { tool.__fx = exW / 2; place(tool); }
      if (nav) { nav.__fx = exW / 2; place(nav); }
      if (elog) {
        elog.style.width = VW + 'px';
        wide.forEach(function (w) { w.style.width = (w.__w0 + exW) + 'px'; w.style.maxWidth = 'none'; });
        elog.__fy = layoutEl ? exH : exH; place(elog);
      }
      if (layoutEl && content) { content.__fy = exH / 2; place(content); }
      if (!layoutEl && content) {
        content.style.width = (1860 + exW) + 'px';
        content.style.height = (contH0 + exH) + 'px';
        if (col) {
          col.__fx = exW; place(col);
          col.style.height = (colH0 + exH) + 'px';
          col.style.gap = ((colH0 + exH - 903) / 2).toFixed(2) + 'px';
        }
        if (stage) { stage.__fx = exW / 2; stage.__fy = exH / 2; place(stage); }
      }
      mounts.forEach(function (m) { m.__fx = exW / 2; m.__fy = exH / 2; place(m); });
    }
    var rsT = 0;
    function relayout() {
      root.classList.add('gm-resizing');
      layout();
      clearTimeout(rsT);
      rsT = setTimeout(function () { root.classList.remove('gm-resizing'); }, 140);
    }
    layout();
    st.layout = layout;
    if (window.ResizeObserver) { st.ro = new ResizeObserver(relayout); st.ro.observe(root); }
    else { st.onResize = relayout; window.addEventListener('resize', relayout); }
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('gm-live'); }); });
  }

  /* ══════════════════ 2. 시계 · 최근 시각 ══════════════════ */
  function installClock(root, st) {
    var tb = one(root, '[data-name="Header"] [data-name="Toolbar"]');
    if (!tb) return;
    var d = one(tb, '[data-name="Date"] p'), t = Array.prototype.filter.call(tb.children, function (c) { return c.tagName === 'P'; })[0];
    function tick() {
      var n = new Date();
      write(d, n.getFullYear() + '-' + p2(n.getMonth() + 1) + '-' + p2(n.getDate()));
      write(t, p2(n.getHours()) + ':' + p2(n.getMinutes()) + ':' + p2(n.getSeconds()));
    }
    tick();
    st.timers.push(setInterval(tick, 1000));
  }
  function installRecent(root, st) {
    var cells = all(root, '[data-name="Event Log"] [data-name="Td/Occurred At"] p');
    if (window.wembRestampTimes) window.wembRestampTimes(cells);
    cells.forEach(function (p) { p.__gmLast = p.textContent; });
    /* 작업 상세 일시 — 오늘 아침으로(시각은 원본 그대로) */
    var dt = one(root, '[data-name="Field/Date Time"] [data-name="Value"]') || one(root, '[data-name="Field/Date Time"] p:last-of-type');
    if (dt) {
      var m = /(\d{2}:\d{2})\s*$/.exec(dt.textContent), n = new Date();
      if (m) write(dt, n.getFullYear() + '-' + p2(n.getMonth() + 1) + '-' + p2(n.getDate()) + ' ' + m[1]);
    }
  }

  /* ══════════════════ 3. 화면 잇기 ══════════════════ */
  function installNav(root, st) {
    /* 로고 자리 — 시안 헤더에는 로고 그림이 없고 서비스 이름만 있다. '색 정하기'에서 로고를 올렸을 때만 이 칸에 뜬다
       (js/templates/image.js TPLLOGO.DOM_CUSTOM). 비어 있으면 아무것도 안 그린다 — 정지 화면 = Figma 원본 */
    all(root, '[data-name="Header"]').forEach(function (h) {
      if (kid(h, 'Logo')) return;
      var s = document.createElement('div');
      s.setAttribute('data-name', 'Logo');
      s.className = 'gm-logo';
      h.appendChild(s);
    });
    try { if (typeof TPLLOGO !== 'undefined' && TPLLOGO.apply) TPLLOGO.apply(); } catch (e) { }
    all(root, '[data-name="Header"] [data-name^="Nav Item"]').forEach(function (n) {
      var bg = getComputedStyle(n).backgroundImage;
      if (bg && bg !== 'none') n.classList.add('gm-sel');
      var label = (n.textContent || '').trim();
      var to = label === '메인' ? 'main' : label === '가스' ? 'gas' : null;
      if (to) clickable(n, function () { if (to !== st.scene) goto(to); });
      else clickable(n, function () { toast(st, label + ' 화면은 이 시안에 없습니다'); });
    });
    clickable(one(root, '[data-name="Icon/Header/Logout"]'), function () { toast(st, '로그아웃 — 시안에 로그인 화면이 없습니다'); });
    clickable(one(root, '[data-name="Menu Card/Gas"]'), function () { goto('gas'); });
    clickable(one(root, '[data-name="Menu Card/CCTV"]'), function () { toast(st, 'AI CCTV 화면은 이 시안에 없습니다'); });
    all(root, '[data-name="Row/1"] > [data-name^="Menu Card/"],[data-name="Row/2"] > [data-name^="Menu Card/"]').forEach(function (c, i) { c.style.setProperty('--i', i); });
    /* 도면 센서 표지 — 정상 → 작업개소 상세, 주의(Minor) → 가스농도 이상 */
    all(root, '[data-name^="Marker/Sensor"]').forEach(function (m) {
      var minor = /\(Minor\)/.test(m.getAttribute('data-name'));
      clickable(m, function () { goto(minor ? 'alarm' : 'worksite'); });
    });
    /* 팝업 */
    all(root, '.sh-popmount [data-name="Button/Close"]').forEach(function (b) { clickable(b, function () { goto('gas'); }); });
    clickable(one(root, '.sh-popmount [data-name="Button/Done"]'), function () { goto('confirm'); });
    clickable(one(root, '.sh-popmount [data-name="Button/Cancel"]'), function () { goto('alarm'); });
    clickable(one(root, '.sh-popmount [data-name="Button/Send"]'), function () { toast(st, '메시지를 전송했습니다'); setTimeout(function () { goto('gas'); }, 900); });
    if (st.dim) clickable(st.dim, function () { goto('gas'); });
    /* 표 줄 고르기(작업개소 · 작업자) */
    all(root, '.sh-popmount [data-name="Table"]').forEach(function (tb) {
      var rows = all(tb, '[data-name="Row/Odd"],[data-name="Row/Even"]');
      var cur0 = rows.filter(function (r) { var b = kid(r, 'Background'); return b && /linear-gradient/.test(getComputedStyle(b).backgroundImage); })[0];
      rows.forEach(function (r) {
        r.addEventListener('click', function () {
          if (editing()) return;
          rows.forEach(function (x) { x.classList.remove('gm-rowsel'); });
          if (cur0) cur0.classList.toggle('gm-rowunsel', r !== cur0);
          if (r !== cur0) r.classList.add('gm-rowsel');
        });
      });
    });
    /* 센서현황 탭 */
    all(root, '[data-name^="Widget/Sensor Status"]').forEach(function (w) {
      var tabs = all(w, '[data-name^="Tab/GAS#"]'), ind = one(w, '[data-name^="Tab/GAS#1"] [data-name="Indicator"]');
      tabs.forEach(function (tb) {
        var p = one(tb, 'p');
        if (!p) return;
        p.classList.add('gm-click');
        p.addEventListener('click', function () {
          if (editing() || !ind) return;
          var dx = p.offsetLeft + p.offsetWidth / 2 - (ind.offsetLeft + ind.offsetWidth / 2) - (ind.__off || 0);
          ind.__off = (ind.__off || 0) + dx;
          ind.style.transition = 'translate .35s ' + EASE;
          ind.style.translate = ind.__off.toFixed(1) + 'px 0';
          shake(w, 0.35);
        });
      });
    });
  }

  /* ══════════════════ 4. 이벤트 로그 — 접기 · 필터 · 소리 · 새 이벤트 ══════════════════ */
  function installEventLog(root, st) {
    var el = st.elog;
    if (!el) return;
    var fold = load(K_FOLD);
    var defOpen = el.offsetHeight > 200;                          /* 메인은 펼침, 가스 메인은 접힘이 원본 */
    var btn = all(el, '[data-name="Icon/Event/Arrow Drop"]').filter(function (b) { return b.offsetWidth < 30; })[0];
    if (btn) btn.classList.add('gm-fold');
    function setOpen(open, quiet) {
      el.style.height = (open ? EL_OPEN : EL_SHUT) + 'px';
      el.__sy = defOpen ? (open ? 0 : EL_OPEN - EL_SHUT) : (open ? -(EL_OPEN - EL_SHUT) : 0);
      place(el);
      if (btn) btn.classList.toggle('gm-turn', open !== defOpen);
      st.open = open;
      if (!quiet) { fold[st.scene] = open; save(K_FOLD, fold); }
    }
    setOpen(fold[st.scene] != null ? !!fold[st.scene] : defOpen, true);
    clickable(btn, function () { setOpen(!st.open); });
    /* 소리 켜기 · 끄기 — 원본 변형(Boolean true/false) 그림을 그대로 바꾼다 */
    var au = one(el, '[data-name="Icon/Event/Audio"] img') || one(el, '[data-name="Icon/Event/Audio"]');
    clickable(one(el, '[data-name="Icon/Event/Audio"]'), function () {
      if (!au || au.tagName !== 'IMG') return;
      var s = au.getAttribute('src');
      au.setAttribute('src', /boolean-true/.test(s) ? s.replace('boolean-true', 'boolean-false') : s.replace('boolean-false', 'boolean-true'));
    });
    /* 등급 칩 — 누른 등급만 보이게(다시 누르면 전체) */
    var list = one(el, '[data-name="List"]');
    var rows = function () { return all(list, ':scope > [data-name^="Row/"]'); };
    var gradeOf = function (r) { var b = one(r, '[data-name^="Badge/"],[data-name^="status-"]'); var n = b ? b.getAttribute('data-name') : ''; return /critical/i.test(n) ? 'Critical' : /major/i.test(n) ? 'Major' : /minor/i.test(n) ? 'Minor' : /warning/i.test(n) ? 'Warning' : 'Normal'; };
    var chips = all(el, '[data-name^="Count/"]'), want = null;
    function filter() {
      rows().forEach(function (r) { r.classList.toggle('gm-hide', !!want && gradeOf(r) !== want); });
      chips.forEach(function (c) { c.classList.toggle('gm-off', !!want && c.getAttribute('data-name') !== 'Count/' + want); });
    }
    chips.forEach(function (c) {
      clickable(c, function () { var g = c.getAttribute('data-name').replace('Count/', ''); want = want === g ? null : g; filter(); });
    });
    clickable(one(el, '[data-name="Button/Ack"]'), function () { rows().forEach(function (r) { r.classList.add('gm-acked'); }); toast(st, '이벤트를 모두 확인 처리했습니다'); });
    /* 가스 농도 · 경보 줄 → 가스농도 이상 팝업 */
    if (st.scene === 'gas' || st.scene === 'main') {
      list && list.addEventListener('click', function (e) {
        if (editing()) return;
        var r = e.target.closest('[data-name^="Row/"]');
        if (!r) return;
        r.classList.remove('gm-acked');
        if (/가스 농도/.test(r.textContent) && /Critical|Minor|Major/.test(gradeOf(r))) goto('alarm');
      });
    }
    /* 건수 칩 숫자 */
    var cnt = function (g) { var c = one(el, '[data-name="Count/' + g + '"]'); var ps = c ? all(c, 'p') : []; return ps[ps.length - 1]; };
    function counts() {
      var n = { Critical: 0, Minor: 0, Normal: 0 };
      rows().forEach(function (r) { var g = gradeOf(r); if (g === 'Critical' || g === 'Major') n.Critical++; else if (g === 'Minor' || g === 'Warning') n.Minor++; else n.Normal++; });
      ['Critical', 'Minor', 'Normal'].forEach(function (g) { var p = cnt(g); if (p) write(p, String(n[g])); });
    }
    /* 새 이벤트 — 원본 줄을 복제해 맨 위에, 발생일시는 지금 */
    function feed() {
      st.feed = setTimeout(feed, rnd(16000, 30000));
      if (idle() || editing() || !list) return;
      var rs = rows();
      var src = rs[Math.floor(Math.random() * Math.min(rs.length, 8))];
      if (!src || claimed(src)) return;
      var r = src.cloneNode(true);
      r.classList.remove('gm-hide', 'gm-acked');
      r.removeAttribute('id');
      all(r, '[id]').forEach(function (x) { x.removeAttribute('id'); });
      var tm = one(r, '[data-name="Td/Occurred At"] p'), n = new Date();
      if (tm) { tm.textContent = n.getFullYear() + '-' + p2(n.getMonth() + 1) + '-' + p2(n.getDate()) + ' ' + p2(n.getHours()) + ':' + p2(n.getMinutes()) + ':' + p2(n.getSeconds()); tm.__gmLast = tm.textContent; }
      list.insertBefore(r, list.firstChild);
      r.classList.add('gm-new');
      setTimeout(function () { r.classList.remove('gm-new'); }, 1700);
      var ls = rows();
      if (ls.length > 10) ls[ls.length - 1].remove();
      filter(); counts();
    }
    st.feed = setTimeout(feed, rnd(9000, 15000));
  }

  /* ══════════════════ 5. 라이브 수치 · 미터 ══════════════════ */
  var GAS = {
    LEL: { max: 20, amp: 0.6, dec: 0, warn: function (v) { return v >= 10; } },
    CO: { max: 100, amp: 1.6, dec: 0, warn: function (v) { return v >= 50; } },
    H25: { max: 10, amp: 0.08, dec: 1, warn: function (v) { return v >= 5; } },
    H2S: { max: 10, amp: 0.08, dec: 1, warn: function (v) { return v >= 5; } },
    O2: { max: 25, amp: 0.06, dec: 1, warn: function (v) { return v < 19.5; } },
    CO2: { max: 1500, amp: 14, dec: 0, warn: function (v) { return v >= 1000; } },
  };
  var CYAN = '0,187,255', YELLOW = '232,200,25';
  function meterPaint(m, pct, rgb) {
    var f = one(m, '[data-name="Meter Fill"]'), g = one(m, '[data-name="Meter Glow"]');
    var p = clamp(pct, 2.5, 100).toFixed(2);
    if (f) {
      f.style.backgroundImage = 'linear-gradient(90deg, rgb(' + rgb + ') 0%, rgb(' + rgb + ') ' + p + '%, rgba(' + rgb + ', 0) ' + p + '%, rgba(' + rgb + ', 0) 100%)';
      /* 인라인 색은 '색 정하기' 가 못 바꾼다 → 주조색(시안)일 때만 차트와 같은 색상각 회전을 건다. 경고 노랑은 상태색이라 그대로 */
      f.classList.toggle('gm-mtint', rgb !== YELLOW);
    }
    if (g) g.style.right = (100 - p) + '%';
  }
  function installLive(root, st) {
    var cells = [];
    all(root, '[data-name^="Widget/Sensor Status"] [data-name^="Row/"]').forEach(function (row) {
      var gas = row.getAttribute('data-name').replace('Row/', ''), G = GAS[gas];
      if (!G) return;
      ['Left', 'Right'].forEach(function (side) {
        var p = one(row, '[data-name="' + side + ' Value"]'), m = one(row, '[data-name="' + side + ' Meter"]');
        if (!p || !m) return;
        var v = parseFloat(p.textContent);
        if (!isFinite(v)) return;
        var f = one(m, '[data-name="Meter Fill"]');
        var c0 = f ? /rgb\(([^)]+)\)/.exec(f.style.backgroundImage || getComputedStyle(f).backgroundImage) : null;
        cells.push({ p: p, m: m, G: G, base: v, v: v, shown: v / G.max * 100, rgb: c0 ? c0[1].replace(/\s/g, '') : CYAN });
      });
    });
    st.cells = cells;
    function tick() {
      if (idle() || editing()) return;
      cells.forEach(function (c) {
        if (Math.random() > 0.55 || claimed(c.p)) return;
        var a = c.G.amp;
        c.v = clamp(c.v + rnd(-a, a), Math.max(0, c.base - a * 4), c.base + a * 4);
        var s = c.v.toFixed(c.G.dec);
        write(c.p, s);
        var to = parseFloat(s) / c.G.max * 100, from = c.shown, t0 = performance.now();
        var rgb = c.G.warn(parseFloat(s)) ? YELLOW : (c.rgb === YELLOW ? CYAN : c.rgb);
        (function step(now) {
          var k = Math.min(1, (now - t0) / 700), e = 1 - Math.pow(1 - k, 3);
          c.shown = from + (to - from) * e;
          meterPaint(c.m, c.shown, rgb);
          if (k < 1) requestAnimationFrame(step);
        })(t0);
      });
    }
    st.timers.push(setInterval(tick, 2000));
    /* 가스농도 이상 배지 · 작업개소 가스 수치 */
    var badge = one(root, '[data-name="Badge/Gas Level"] p');
    var b0 = badge ? parseFloat(badge.textContent) : 0;
    var metrics = all(root, '[data-name^="Metric/"]').map(function (mt) {
      var ps = all(mt, 'p'), vp = ps[ps.length - 1];
      var m = vp && /^([\d.]+)(\S*)\s*(.*)$/.exec(vp.textContent.trim());
      return m ? { p: vp, base: parseFloat(m[1]), unit: m[2], tail: m[3] ? ' ' + m[3] : '', dec: (m[1].split('.')[1] || '').length } : null;
    }).filter(Boolean);
    st.timers.push(setInterval(function () {
      if (idle() || editing()) return;
      if (badge && b0) write(badge, Math.round(clamp(b0 + rnd(-4, 4), b0 - 6, b0 + 6)) + ' ppm');
      metrics.forEach(function (x) { var a = Math.max(x.base * 0.03, Math.pow(10, -x.dec)); write(x.p, clamp(x.base + rnd(-a, a), 0, 1e9).toFixed(x.dec) + x.unit + x.tail); });
    }, 2600));
  }
  function shake(w, s) { /* 탭을 바꾸면 수치가 잠깐 다시 들어온다 */
    all(w, '[data-name$=" Value"]').forEach(function (p) { p.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: s * 1000, easing: 'ease-out' }); });
  }

  /* ══════════════════ 6. 차트 바꾸기(패널편집) ══════════════════ */
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
    el.className = 'gm-chart';
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
        s += '<clipPath id="gmc' + spec.uid + '"><rect x="' + L + '" y="0" width="' + (w - L - R) + '" height="' + h + '"/></clipPath><g clip-path="url(#gmc' + spec.uid + ')">';
        data.forEach(function (a, si) {
          var col = spec.series[si][1];
          var pts = a.map(function (v, i) { return X(i).toFixed(1) + ',' + Y(v).toFixed(1); }).join(' ');
          if (spec.k === 'area' || si === 0) {
            s += '<defs><linearGradient id="gmg' + spec.uid + si + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + col + '" stop-opacity="' + (spec.k === 'area' ? .4 : .18) + '"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></linearGradient></defs>';
            s += '<polygon fill="url(#gmg' + spec.uid + si + ')" points="' + X(0).toFixed(1) + ',' + (h - B) + ' ' + pts + ' ' + X(N - 1).toFixed(1) + ',' + (h - B) + '"/>';
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
        + '<defs><linearGradient id="gmgg' + spec.uid + '" x1="0" x2="1"><stop offset="0" stop-color="#2a7ca0"/><stop offset="1" stop-color="' + spec.c + '"/></linearGradient></defs>'
        + '<path d="M8 52a42 42 0 0 1 84 0" fill="none" stroke="rgba(142,166,179,.2)" stroke-width="8"/>'
        + '<path class="arc" d="M8 52a42 42 0 0 1 84 0" fill="none" stroke="url(#gmgg' + spec.uid + ')" stroke-width="8" stroke-dasharray="0 ' + LEN.toFixed(1) + '"/>'
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
    var rot = ((h - 196 + 540) % 360) - 180;
    root.style.setProperty('--gm-chue', (Math.abs(rot) < 3 ? 0 : Math.round(rot)) + 'deg');
  }

  var CC = { cy: '#00bbff', te: '#56eefa', gn: '#19c877', ye: '#e8c819', or: '#fc7f01', re: '#f43050', bl: '#0a7cff', gr: '#8e9aa8', vi: '#9a5fff' };
  function sensorSpecs(i) {
    var V = [[2, 12, 0.4, 20.9, 520], [1, 9, 0.2, 20.9, 480], [0, 52, 0.3, 20.6, 560]][i] || [2, 12, 0.4, 20.9, 520];
    return [
      { k: 'line', t: '가스 농도 추이 (GAS#' + (i + 1) + ')', unit: 'ppm', dec: 1, series: [['CO', V[1] >= 50 ? CC.ye : CC.cy, V[1], 1.6], ['H2S', CC.te, V[2] * 10, 0.6]], lo: 0, hi: Math.max(30, V[1] * 1.6) },
      { k: 'bar', t: '측정 대비 경보 기준(%)', unit: '%', cats: ['LEL', 'CO', 'H2S', 'O2', 'CO2'], vals: [V[0] / 20 * 100, V[1], V[2] * 10, V[3] / 25 * 100, V[4] / 15], max: 100, c: CC.cy, dec: 0 },
      { k: 'gauge', t: 'CO 농도', unit: 'ppm', v: [V[1], 1.4], max: 100, c: V[1] >= 50 ? CC.ye : CC.cy, dec: 0 },
      { k: 'area', t: '산소(O2) 추이', unit: '%', dec: 1, series: [['O2', CC.gn, V[3], 0.08]], lo: 19, hi: 22 },
      { k: 'donut', t: '감지기 상태', parts: [['정상', CC.gn, 8], ['주의', CC.ye, i === 2 ? 2 : 1], ['통신 이상', CC.gr, 1]] },
    ];
  }
  var SPECS = {
    main: {
      'Event Log': [
        { k: 'donut', t: '등급별 이벤트', parts: [['Critical', CC.re, 2], ['Major', CC.or, 1], ['Minor', CC.ye, 3], ['Warning', CC.bl, 1], ['Normal', CC.gr, 3]] },
        { k: 'bar', t: '시간대별 이벤트 건수', unit: '건', cats: ['10시', '11시', '12시', '13시', '14시'], vals: [3, 5, 2, 6, 4], max: 8, c: CC.cy },
        { k: 'line', t: '최근 경보 발생 추이', unit: '건', dec: 0, series: [['경보', CC.re, 3, 1], ['주의', CC.ye, 5, 1.2]], lo: 0, hi: 10 },
      ],
    },
    worksite: {
      'Widget/Gas Detector Data': [
        { k: 'line', t: '작업개소 가스 농도 추이', unit: 'ppm', dec: 1, series: [['CO', CC.cy, 18, 1.2], ['H2S', CC.te, 6, 0.5]], lo: 0, hi: 30 },
        { k: 'gauge', t: '산소(O2) 농도', unit: '%', v: [20.8, 0.1], max: 25, c: CC.gn, dec: 1 },
      ],
      'Widget/Work Site List': [
        { k: 'hbar', t: '작업개소별 배치감지기', unit: '대', cats: ['배관랙', '집진덕트', '폐수 피트', '펌프실', '보일러', '배기구'], vals: [3, 2, 2, 2, 2, 1], max: 4, c: CC.cy },
        { k: 'donut', t: '감지기 배치 비중', parts: [['종합 01~05', CC.cy, 8], ['종합 06~10', CC.te, 9], ['종합 11~14', CC.gn, 5]] },
      ],
    },
    alarm: {
      'Table': [
        { k: 'hbar', t: '작업자별 감지 횟수', unit: '회', cats: ['김정혁', '박성태', '성미현', '이경민', '박준후', '문서영'], vals: [2, 1, 1, 0.2, 0.2, 0.2], max: 3, c: CC.ye, dec: 0 },
        { k: 'line', t: '해당 구역 가스 농도 추이', unit: 'ppm', dec: 0, series: [['CO', CC.ye, 52, 3]], lo: 0, hi: 100 },
      ],
    },
  };

  var chartUid = 0;
  function installChartSwap(root, st) {
    var savedAll = load(K_CHART), saved = savedAll[st.scene] || {};
    st.charts = {}; st.chartApply = {};
    var probe = document.createElement('i');
    probe.className = 'gm-probe';
    st.frame.appendChild(probe);
    var TG = [];
    if (st.scene === 'gas') {
      all(root, '[data-name^="Widget/Sensor Status"]').forEach(function (w, i) {
        TG.push({ key: w.getAttribute('data-name'), w: w, area: [11, 52, 11, 12], rows: true, list: sensorSpecs(i) });
      });
    }
    var spec = SPECS[st.scene] || {};
    Object.keys(spec).forEach(function (name) {
      var scope = st.scene === 'main' ? root : (one(root, '.sh-pop') || root);
      var w = one(scope, '[data-name="' + name + '"]');
      if (!w) return;
      if (name === 'Event Log') { var tb = one(w, '[data-name="Table"]'); TG.push({ key: name, w: w, body: tb, list: spec[name] }); return; }
      TG.push({ key: name, w: w, body: name === 'Table' ? w : null, area: name === 'Table' ? null : [0, name === 'Widget/Gas Detector Data' ? 19 : 42, 0, 0], list: spec[name] });
    });
    TG.forEach(function (tg) {
      if (getComputedStyle(tg.w).position === 'static') tg.w.style.position = 'relative';
      var body = tg.body;
      if (!body) {
        body = document.createElement('div');
        body.className = 'gm-chost';
        var a = tg.area;
        body.style.left = a[0] + 'px'; body.style.top = a[1] + 'px'; body.style.right = a[2] + 'px'; body.style.bottom = a[3] + 'px';
        body.style.display = 'none';
        tg.w.appendChild(body);
        tg.own = true;
      }
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'gm-chartbtn';
      btn.innerHTML = KIND_ICON.bar.replace('class="ic"', 'class="ic" style="width:13px;height:11px"') + '차트';
      btn.title = '이 패널의 차트 바꾸기';
      var menu = document.createElement('div');
      menu.className = 'gm-chartmenu';
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
        if (tg.own) { body.style.display = i >= 0 ? 'block' : 'none'; if (tg.rows) tg.w.classList.toggle('gm-rows-off', i >= 0); }
        else body.classList.toggle('gm-swapped', i >= 0);
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
        all(root, '.gm-chartmenu.open').forEach(function (m) { if (m !== menu) m.classList.remove('open'); });
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
      if (e.target.closest && e.target.closest('.gm-chartmenu, .gm-chartbtn')) return;
      all(root, '.gm-chartmenu.open').forEach(function (m) { m.classList.remove('open'); });
    };
    document.addEventListener('pointerdown', st.onDocDown, true);
  }

  /* ══════════════════ 7. 패널 옮기기(패널편집) ══════════════════
     센서현황 세 장 — 끌면 위아래로 자리를 바꾸며 나머지가 흘러 다시 쌓인다.
     메뉴 카드 여섯 장 — 자리끼리 맞바꾼다. 공장도면 · 팝업 위젯 — 4px 격자 자유 이동. */
  function rel(el, frame, S) { var a = el.getBoundingClientRect(), b = frame.getBoundingClientRect(); return { x: (a.left - b.left) / S, y: (a.top - b.top) / S }; }
  function installPanelMove(root, st) {
    var L = load(K_LAYOUT), me = L[st.scene] = L[st.scene] || {};
    function persist() { var a = load(K_LAYOUT); a[st.scene] = me; save(K_LAYOUT, a); }
    var panel = one(root, '[data-name="Column/Left"]');
    var widgets = panel ? Array.prototype.slice.call(panel.children) : [];
    widgets.forEach(function (w, i) { w.classList.add('gm-mv'); w.setAttribute('data-gm-kind', 'stack'); w.style.setProperty('--i', i); });
    var origOrder = widgets.slice();
    if (me.order && panel) {
      me.order.forEach(function (n) { var w = widgets.filter(function (x) { return x.getAttribute('data-name') === n; })[0]; if (w) panel.appendChild(w); });
    }
    var frees = all(root, '[data-name="Stage/Plant Map"],.sh-pop [data-name^="Widget/"],.sh-pop [data-name="Table"],.sh-pop [data-name^="Field/Reason"]');
    me.free = me.free || {};
    frees.forEach(function (f) {
      f.classList.add('gm-mv'); f.setAttribute('data-gm-kind', 'free');
      var s = me.free[f.getAttribute('data-name')];
      if (s) { f.__ux = s[0]; f.__uy = s[1]; place(f); }
    });
    /* 메뉴 카드 자리 */
    var cards = all(root, '[data-name="Row/1"] > [data-name^="Menu Card/"],[data-name="Row/2"] > [data-name^="Menu Card/"]');
    var S0 = st.S || 1;
    var slots = cards.map(function (c) { return rel(c, st.frame, S0); });
    cards.forEach(function (c, i) { c.__home = slots[i]; c.classList.add('gm-mv'); c.setAttribute('data-gm-kind', 'slot'); });
    var slotOrder = cards.slice();
    if (me.slots) {
      var by = {};
      cards.forEach(function (c, i) { by[i] = c; });
      var so = me.slots.map(function (n) { return by[n]; }).filter(Boolean);
      if (so.length === cards.length) slotOrder = so;
    }
    function placeSlots() {
      slotOrder.forEach(function (c, i) { c.__ux = slots[i].x - c.__home.x; c.__uy = slots[i].y - c.__home.y; place(c); });
    }
    if (cards.length) placeSlots();

    var drag = null;
    st.onDown = function (e) {
      if (!layoutEditing(root) || e.button !== 0) return;
      if (e.target.closest('.gm-chartbtn, .gm-chartmenu, .gm-resetbtn')) return;
      /* 패널편집은 글자 수정과 함께 켜진다 — 글자 위에서 시작한 끌기는 글자 고르기로 둔다 */
      if (e.target.closest('[contenteditable="true"]')) return;
      var w = e.target.closest('.gm-mv');
      if (!w || !root.contains(w)) return;
      e.preventDefault(); e.stopPropagation();
      drag = { w: w, kind: w.getAttribute('data-gm-kind'), sx: e.clientX, sy: e.clientY, moved: false, top: w.offsetTop };
    };
    function flip(fn, list) {
      var before = list.map(function (x) { return x.offsetTop; });
      fn();
      list.forEach(function (x, i) {
        if (x === drag.w) return;
        var d = before[i] - x.offsetTop;
        if (!d) return;
        x.style.transition = 'none';
        x.style.translate = '0 ' + d + 'px';
        void x.offsetWidth;
        x.style.transition = '';
        x.style.translate = '';
      });
    }
    st.onMove = function (e) {
      if (!drag) return;
      var S = (st.frame.getBoundingClientRect().width / st.frame.offsetWidth) || st.S || 1;   /* 끌기 배율은 읽지 말고 잰다 */
      var dx = (e.clientX - drag.sx) / S, dy = (e.clientY - drag.sy) / S;
      if (!drag.moved) {
        if (Math.hypot(dx, dy) < 3) return;
        drag.moved = true;
        drag.w.classList.add('gm-dragging');
      }
      if (drag.kind === 'stack') {
        var off = drag.top - drag.w.offsetTop;
        drag.w.style.translate = '0px ' + (dy + off).toFixed(1) + 'px';
        var sib = Array.prototype.slice.call(panel.children).filter(function (x) { return x !== drag.w; });
        var cy = drag.top + dy + drag.w.offsetHeight / 2;
        var before = null;
        for (var i = 0; i < sib.length; i++) { if (cy < sib[i].offsetTop + sib[i].offsetHeight / 2) { before = sib[i]; break; } }
        if (drag.w.nextElementSibling !== before) {
          flip(function () { panel.insertBefore(drag.w, before); }, sib);
          off = drag.top - drag.w.offsetTop;
          drag.w.style.translate = '0px ' + (dy + off).toFixed(1) + 'px';
        }
      } else {
        drag.w.__dx = dx; drag.w.__dy = dy;
        place(drag.w);
        if (drag.kind === 'slot') {
          var bx = drag.w.__home.x + (drag.w.__ux || 0) + dx, by2 = drag.w.__home.y + (drag.w.__uy || 0) + dy;
          var best = 0, bd = 1e9;
          slots.forEach(function (s, k) { var d = Math.hypot(s.x - bx, s.y - by2); if (d < bd) { bd = d; best = k; } });
          var at = slotOrder.indexOf(drag.w);
          if (best !== at) {
            slotOrder.splice(at, 1);
            slotOrder.splice(best, 0, drag.w);
            var keep = { ux: drag.w.__ux, uy: drag.w.__uy };
            slotOrder.forEach(function (c, k) { if (c !== drag.w) { c.__ux = slots[k].x - c.__home.x; c.__uy = slots[k].y - c.__home.y; place(c); } });
            drag.w.__ux = keep.ux; drag.w.__uy = keep.uy;
          }
        }
      }
    };
    st.onUp = function () {
      if (!drag) return;
      var d = drag; drag = null;
      var w = d.w;
      if (!d.moved) { w.classList.remove('gm-dragging'); return; }
      void w.offsetWidth;
      w.classList.remove('gm-dragging');
      if (d.kind === 'stack') {
        w.style.translate = '';
        me.order = Array.prototype.map.call(panel.children, function (x) { return x.getAttribute('data-name'); });
      } else if (d.kind === 'free') {
        var snap = function (v) { return Math.round(v / 4) * 4; };
        w.__ux = snap((w.__ux || 0) + (w.__dx || 0)); w.__uy = snap((w.__uy || 0) + (w.__dy || 0));
        w.__dx = 0; w.__dy = 0;
        place(w);
        me.free[w.getAttribute('data-name')] = [w.__ux, w.__uy];
      } else {
        w.__dx = 0; w.__dy = 0;
        placeSlots();
        me.slots = slotOrder.map(function (c) { return cards.indexOf(c); });
      }
      persist();
    };
    root.addEventListener('pointerdown', st.onDown, true);
    window.addEventListener('pointermove', st.onMove);
    window.addEventListener('pointerup', st.onUp);
    window.addEventListener('pointercancel', st.onUp);
    st.onDragStart = function (e) { if (layoutEditing(root) && e.target.closest && e.target.closest('.gm-mv')) e.preventDefault(); };
    root.addEventListener('dragstart', st.onDragStart);
    st.resetLayout = function () {
      me = { free: {} };
      var a = load(K_LAYOUT); a[st.scene] = me; save(K_LAYOUT, a);
      origOrder.forEach(function (w) { panel && panel.appendChild(w); });
      frees.forEach(function (f) { f.__ux = 0; f.__uy = 0; place(f); });
      if (cards.length) { slotOrder = cards.slice(); placeSlots(); }
      Object.keys(st.chartApply || {}).forEach(function (k) { st.chartApply[k](-1); });
    };
    var rb = document.createElement('button');
    rb.type = 'button';
    rb.className = 'gm-resetbtn';
    rb.textContent = '배치 초기화';
    rb.title = '패널 자리 · 바꾼 차트를 원본으로';
    st.frame.appendChild(rb);
    rb.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    rb.addEventListener('pointerup', function (e) { e.stopPropagation(); e.preventDefault(); st.resetLayout(); });
    st.onReset = function (e) { if (e.target.closest && e.target.closest('#layoutReset')) st.resetLayout(); };
    document.addEventListener('click', st.onReset, true);
  }

  /* ══════════════════ 8. 팝업 밝기 잇기 ══════════════════
     얹힌 팝업 뿌리(.gmw-root 등)는 시트가 따로라 data-theme 도 따로 갖는다 — 바탕 뿌리 테마를 따라가게 한다. */
  function installThemeSync(root, st) {
    var pops = all(root, '.sh-pop');
    st.dim = one(root, '.sh-dim');
    if (!pops.length) return;
    var sync = function () { pops.forEach(function (p) { if (p.dataset.theme !== root.dataset.theme) p.dataset.theme = root.dataset.theme || 'dark'; }); };
    sync();
    st.obs = new MutationObserver(sync);
    st.obs.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  }

  /* ══════════════════ 살리기 ══════════════════ */
  function sceneOf(root) {
    if (/\bgmm-root\b/.test(root.className)) return 'main';
    if (one(root, '.gmw-root')) return 'worksite';
    if (one(root, '.gma-root')) return 'alarm';
    if (one(root, '.gmc-root')) return 'confirm';
    return 'gas';
  }
  function start(root, st) {
    var steps = [['theme', installThemeSync], ['fit', installFit], ['clock', installClock], ['recent', installRecent], ['nav', installNav], ['elog', installEventLog],
      ['live', installLive], ['swap', installChartSwap], ['move', installPanelMove]];
    steps.forEach(function (s) { try { s[1](root, st); } catch (e) { console.warn('[gm] ' + s[0], e); } });
    all(root, '[data-name="Column/Left"] > *').forEach(function (c, i) { c.style.setProperty('--i', i); });
    root.classList.add('gm-enter');
    st.timers.push(setTimeout(function () { root.classList.remove('gm-enter'); }, 1200));
  }
  function initGasmon(root) {
    if (!root || root.__gm) return;
    injectStyle();
    root.classList.add('gm-root');
    var st = root.__gm = { timers: [], scene: sceneOf(root) };
    if (/[?&]edit=1/.test(location.search)) root.classList.add('gm-edit-layout');
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
  function disposeGasmon(root) {
    var st = root && root.__gm;
    if (!st) return;
    if (st.wait) st.wait.disconnect();
    st.timers.forEach(function (t) { clearInterval(t); clearTimeout(t); });
    clearTimeout(st.feed); clearTimeout(st.toastT);
    if (st.ro) st.ro.disconnect();
    if (st.obs) st.obs.disconnect();
    if (st.onResize) window.removeEventListener('resize', st.onResize);
    Object.keys(st.charts || {}).forEach(function (k) { st.charts[k].dispose(); });
    if (st.onDocDown) document.removeEventListener('pointerdown', st.onDocDown, true);
    if (st.onDown) root.removeEventListener('pointerdown', st.onDown, true);
    if (st.onMove) window.removeEventListener('pointermove', st.onMove);
    if (st.onUp) { window.removeEventListener('pointerup', st.onUp); window.removeEventListener('pointercancel', st.onUp); }
    if (st.onDragStart) root.removeEventListener('dragstart', st.onDragStart);
    if (st.onReset) document.removeEventListener('click', st.onReset, true);
    root.__gm = null;
  }
  window.initGasmon = initGasmon;
  window.disposeGasmon = disposeGasmon;
})();
