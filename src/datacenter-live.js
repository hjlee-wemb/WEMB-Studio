/* 데이터센터 통합 모니터링 — 재구축 화면(4장 + 전력 계통도 위 팝업 5장)의 인터랙션 · 라이브 · 반응형 레이어.
   window.initDatacenter(root) / window.disposeDatacenter(root)

   화면(DOM·CSS)은 생성기(src/datacenter/_gen/conv.js)가 Figma 그대로 만든다. 이 파일은 그 위에 '움직이는 것'만 얹는다 — 정지 상태(?live=0) = Figma 원본.
   · 반응형 — 1920x1080 좌표계 + 균일 배율 S. 남는 폭 · 높이는 첫 단 묶음(옆 판 · 무대 · 이벤트 목록 · 팝업)이 왼/가운데/오른, 위/가운데/아래 자리에 따라 나눠 갖고,
     바탕 그라디언트 · 헤더 띠는 늘어나 여백이 없다. 정확히 16:9 면 Figma 와 같다.
   · 실시간 시계(헤더 날짜 · 시각, 알림 폰 시각) · 이벤트 발생시각 · 작업 시작시각을 '지금' 기준으로(열 때마다 최근), 새 이벤트가 맨 위로 흘러 들어온다
   · Event List 접기 단추 — 아래 이벤트 목록을 접고 펼치고(화면마다 기억), 작업리스트 바는 위로 펼친다
   · 숫자 지표(건수 칩 · 층별 작업 · 전체 작업자수)가 조금씩 움직이고, 차트 바꾸기로 고른 차트는 실시간처럼 흐른다
   · 마우스 오버 · 눌림 — 메뉴 · 단추 · 아이콘 단추 · 목록 항목 · 표 줄 · 칩 · 체크박스 · 닫기
   · 스크롤 — 시나리오 단계(스크롤 막대가 그려진 칸)는 휠 · 막대 끌기로 넘긴다
   · 화면 잇기 — 헤더 메뉴 · 옆 판 단추 · 계통도 · 팝업 단추가 그 장면으로 간다
   · 차트 바꾸기(패널편집 중) — 패널마다 데이터센터 관제에 맞춘 추천 차트. 첫 항목 = 추천, '원본 그대로'로 되돌린다
   · 패널 옮기기(패널편집 중) — 판을 4px 격자로 옮긴다, '배치 초기화'로 되돌린다
   손으로 쓴 파일이다(생성물 아님). 고친 뒤 node mk-live.js → js/core/tpl-modules.js 의 datacenter-live.js ?v= 를 올릴 것. */
(function () {
  'use strict';

  var BASE_W = 1920, BASE_H = 1080;
  var K_LAYOUT = 'wemb-datacenter-layout', K_CHART = 'wemb-datacenter-chart', K_FOLD = 'wemb-datacenter-fold';
  var STYLE_ID = 'datacenter-live-style';
  var EASE = 'cubic-bezier(.22,.8,.24,1)';
  var BASE_TIME = new Date(2026, 10, 24, 14, 27, 35).getTime();   /* Figma 화면에 찍힌 기준 시각 2026-11-24 14:27:35 */

  /* ══════════════════ 스타일 ══════════════════ */
  var CSS = [
    '.dc-root{--dc-acc:37,117,213;overflow:clip!important;}',
    '.dc-root.dc-resizing *,.dc-root .dc-dragging,.dc-root .dc-dragging *{transition:none!important;}',
    '.dc-root.dc-live .dc-place{transition:translate .5s ' + EASE + ',opacity .3s ease;}',
    '.dc-root .dc-bgfill{position:absolute;left:0;top:0;z-index:-1;pointer-events:none;}',
    '.dc-root .dc-probe{position:absolute;width:0;height:0;overflow:hidden;color:#2575d5;}',
    '.dc-root .dc-click{cursor:pointer;}',
    '.dc-root .dc-click *{cursor:inherit;}',
    /* 그림(SVG · PNG)은 상자보다 크게 번져 옆 단추를 덮는다 — 클릭은 그 아래 상자가 받게 */
    '.dc-root img:not(.dc-click),.dc-root [data-name="Path"],.dc-root [data-name="Vector"]{pointer-events:none;}',
    /* 알림 폰은 마스크로 잘린 바깥(이벤트 목록 위)까지 상자가 있다 — 폰 안은 단추만 누른다 */
    '.dc-root [data-name="Popup/Alarm Message"] *:not(.dc-click){pointer-events:none;}',
    '.dt-content-editing .dc-root .dc-click,.dt-content-editing .dc-root .dc-click *{cursor:text;}',
    '@keyframes dcIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}}',
    '@keyframes dcPop{from{opacity:0;transform:translateY(14px) scale(.985);}to{opacity:1;transform:none;}}',
    '@keyframes dcRowIn{from{opacity:0;transform:translateX(-18px);background-color:rgba(37,117,213,.35);}to{opacity:1;transform:none;}}',
    '@keyframes dcBlink{0%,100%{opacity:1;}50%{opacity:.35;}}',
    '.dc-root.dc-enter .dc-unit{animation:dcIn .55s ' + EASE + ' both;animation-delay:calc(var(--i,0) * 45ms);}',
    '.dc-root.dc-enter .sh-popmount{animation:dcPop .45s ' + EASE + ' both;}',
    '.dc-root .dc-rowin{animation:dcRowIn .7s ' + EASE + ' both;}',
    /* 헤더 메뉴 · 드롭다운 · 로그아웃 */
    '.dc-root .dc-nav{cursor:pointer;}',
    /* 헤더 메뉴 — 평소엔 지금 화면만 흰 글자, 올리면 그 메뉴가 밝아지고 화살표가 미끄러져 간다(원본 색: 흰 · 흰 50%) */
    '.dc-root .dc-navlab{color:rgba(255,255,255,.5)!important;transition:color .2s ease,text-shadow .25s ease;}',
    '.dc-root .dc-navlab.dc-act,.dc-root .dc-navlab.dc-hot{color:#fff!important;}',
    '.dc-root .dc-navlab.dc-hot{text-shadow:0 0 10px rgba(46,224,255,.55);}',
    '.dc-root .dc-navhit::after{content:"";position:absolute;inset:-10px -16px -20px;}',
    '.dc-root.dc-live .dc-navarrow{transition:translate .38s ' + EASE + ';}',
    /* 서브메뉴(Drop Down Default) — 마우스를 올렸을 때만 내려온다 */
    '.dc-root .dc-dd{opacity:0;visibility:hidden;transform:translateY(-8px);pointer-events:none;transition:opacity .18s ease,transform .26s ' + EASE + ',visibility 0s linear .26s;}',
    '.dc-root .dc-dd.dc-ddopen{opacity:1;visibility:visible;transform:none;pointer-events:auto;transition:opacity .18s ease,transform .26s ' + EASE + ',visibility 0s;}',
    '.dc-root .dc-dd [data-name="Shape"]{transition:translate .24s ' + EASE + ',border-radius .24s ease;}',
    '.dc-root .dc-dd p{cursor:pointer;transition:color .18s ease;}',
    '.dc-root .dc-dd p::after{content:"";position:absolute;inset:-15px -20px -16px;}',
    /* 패널편집 중엔 넓힌 오버 칸(::after)이 글자 위를 덮어 글자를 못 고쳤다 → 끈다 */
    '.dt-content-editing .dc-root .dc-navhit::after,.dt-editing .dc-root .dc-navhit::after,.dt-content-editing .dc-root .dc-dd p::after,.dt-editing .dc-root .dc-dd p::after{display:none;}',
    '.dc-root .dc-dd p.dc-ddoff{color:#767c7f!important;}',
    '.dc-root .dc-dd p.dc-ddon{color:#fff!important;}',
    /* 작업자 · 자산 헤더에 붙이는 서브메뉴 — 메인 것과 같은 레이어 이름 · 치수 · 색(측정값) */
    '.dc-root .dc-ddsolo{position:absolute;top:67px;width:148px;height:103px;display:grid;grid-template:103px/148px;z-index:5;}',
    '.dc-root .dc-ddsolo > *{grid-area:1/1;position:relative;}',
    '.dc-root .dc-ddsolo > [data-name="Background"]{width:148px;height:103px;background:rgba(0,0,0,.5);border-radius:5px;box-shadow:0 2px 10px rgba(151,119,120,.2);backdrop-filter:blur(2px);}',
    '.dc-root .dc-ddsolo > [data-name="Shape"]{width:146px;height:50px;margin:1.07px 0 0 1px;background:#000;border-radius:4px 4px 0 0;}',
    '.dc-root .dc-ddsolo > [data-name="Divider"]{width:123.609px;height:.8125px;margin:51.09px 0 0 12.19px;background:#809297;}',
    '.dc-root .dc-ddsolo > p{width:106px;height:18px;margin:17.07px 0 0 20.5px;font:700 16px/18px "Nanum Gothic",Pretendard,sans-serif;text-align:center;color:#fff;white-space:nowrap;}',
    '.dc-root .dc-ddsolo > p + p{margin-top:66.33px;color:#767c7f;}',
    /* 묶음(display:contents) 단추 — :hover 가 안 걸리므로 조각마다 함께 밝힌다 */
    '.dc-root .dc-hovpart{transition:filter .2s ease;}',
    '.dc-root .dc-hovpart.dc-hovon{filter:brightness(1.3) drop-shadow(0 0 6px rgba(46,170,255,.55));}',
    /* 기능 툴팁 — 마우스를 잠시 올리면 이 단추가 하는 일 */
    '.dc-root .dc-tip{position:absolute;left:0;top:0;z-index:90;max-width:280px;padding:7px 11px;border:1px solid rgba(46,224,255,.55);border-radius:7px;background:rgba(6,14,30,.95);color:#e6f6ff;font:500 13px/1.35 "Pretendard Variable",Pretendard,sans-serif;pointer-events:none;opacity:0;translate:0 4px;transition:opacity .16s ease,translate .2s ' + EASE + ';box-shadow:0 6px 18px rgba(0,0,0,.35);white-space:normal;width:max-content;word-break:keep-all;}',
    '.dc-root .dc-tip.on{opacity:1;translate:0 0;}',
    '.dc-root [data-name="Icon Logout"]{cursor:pointer;transition:filter .2s ease,rotate .35s ' + EASE + ';}',
    '.dc-root [data-name="Icon Logout"]:hover{filter:brightness(1.3) drop-shadow(0 0 6px rgba(46,224,255,.7));rotate:90deg;}',
    '.dc-root [data-name="Header"] [data-name="Logo"]{cursor:pointer;}',
    /* 단추 · 아이콘 단추 · 칩 · 태그 */
    '.dc-root .dc-btn{cursor:pointer;transition:filter .2s ease,translate .2s ' + EASE + ',box-shadow .25s ease,opacity .25s ease;}',
    '.dc-root .dc-btn:hover{filter:brightness(1.3) drop-shadow(0 0 6px rgba(46,170,255,.55));translate:0 -1px;}',
    '.dc-root .dc-btn:active{filter:brightness(.9);translate:0 1px;}',
    '.dc-root .dc-close{cursor:pointer;transition:filter .2s ease,rotate .3s ' + EASE + ';}',
    '.dc-root .dc-close:hover{filter:brightness(1.4) drop-shadow(0 0 6px rgba(120,200,255,.8));rotate:90deg;}',
    '.dc-root .dc-on{filter:brightness(1.35) drop-shadow(0 0 7px rgba(46,170,255,.75))!important;}',
    '.dc-root .dc-off{opacity:.45;filter:saturate(.35);}',
    '.dc-root .dc-dimchip{opacity:.35;filter:saturate(.25);}',
    /* 목록 항목 · 표 줄 */
    '.dc-root .dc-item{cursor:pointer;transition:background-color .25s ease,filter .2s ease,translate .2s ' + EASE + ';}',
    '.dc-root .dc-item:hover{background-color:rgba(255,255,255,.08);translate:3px 0;}',
    '.dc-root .dc-item.dc-sel{background-color:#35363c;}',
    '.dc-root .dc-item.dc-sel p{color:#fff!important;}',
    /* 원본에서 칠해져 있던 줄은 다른 줄을 고르면 칠을 뺀다 */
    '.dc-root .dc-item.dc-unsel{background:transparent!important;}',
    '.dc-root .dc-item.dc-unsel > [data-name="Background"],.dc-root .dc-item.dc-unsel > [data-name="Selected"],.dc-root .dc-item.dc-unsel > [data-name="Highlight"]{opacity:0;}',
    '.dc-root .dc-row{cursor:pointer;transition:filter .2s ease,box-shadow .25s ease;}',
    /* 표 줄 오버 — 밝기만 올리면 짙은 줄에서 거의 안 보였다 → 하늘 물 한 겹 + 밝기 */
    '.dc-root .dc-row:hover{filter:brightness(1.15);background-image:linear-gradient(rgba(46,170,255,.16),rgba(46,170,255,.16))!important;}',
    '.dc-root .dc-chk{transition:filter .2s ease;}',
    '.dc-root .dc-chk:hover{filter:brightness(1.25) drop-shadow(0 0 5px rgba(46,170,255,.7));}',
    '.dc-root .dc-pick{cursor:pointer;transition:filter .25s ease;}',
    '.dc-root .dc-pickim{transition:filter .25s ease;}',
    '.dc-root .dc-pickim.dc-pickon{filter:brightness(1.14) saturate(1.12);}',
    '.dc-root .dc-rowhov{position:absolute;pointer-events:none;opacity:0;background:rgba(255,255,255,.08);transition:opacity .15s ease,translate .18s ' + EASE + ';}',
    '.dc-root .dc-rowhov.on{opacity:1;}',
    /* 3D 무대 확대(조작 안내) */
    '.dc-root .dc-stage3d{user-select:none;-webkit-user-select:none;}',
    '.dc-root .dc-stage3d.dc-zoomed{cursor:grab;}',
    '.dc-root .dc-stage3d.dc-panning{cursor:grabbing;}',
    '.dc-root .dc-stage3d.dc-stage-anim{transition:transform .55s ' + EASE + ',clip-path .55s ' + EASE + ',translate .5s ' + EASE + ';}',
    '.dc-root .dc-stage3d.dc-stage-wheel{transition:transform .16s ease-out,clip-path .16s ease-out,translate .5s ' + EASE + ';}',
    '.dc-root .dc-hintflash{background-color:rgba(46,224,255,.18)!important;box-shadow:inset 3px 0 0 #2ee0ff;}',
    '.dc-root [data-name^="Item/"].dc-btn{transition:filter .2s ease,background-color .3s ease,box-shadow .3s ease;}',
    '.dc-root .dc-row.dc-sel{box-shadow:inset 0 0 0 999px rgba(37,117,213,.28),inset 3px 0 0 #2ee0ff;}',
    '.dc-root .dc-hl{transition:top .35s ' + EASE + ',translate .35s ' + EASE + ';}',
    '.dc-root .dc-chk{cursor:pointer;}',
    '.dc-root .dc-chk.dc-chkoff [data-name="Path"],.dc-root .dc-chk.dc-chkoff img{opacity:0;transition:opacity .2s ease;}',
    '.dc-root .dc-chk.dc-chkoff [data-name="Shape"]{background:transparent!important;box-shadow:inset 0 0 0 1px #8a95a8;}',
    /* 이벤트 목록 접기 · 작업리스트 펼치기 */
    '.dc-root .dc-foldbox{transition:translate .55s ' + EASE + ';}',
    '.dc-root .dc-foldarrow{transition:rotate .45s ' + EASE + ';}',
    '.dc-root .dc-wl-panel{position:absolute;left:0;top:60px;width:100%;height:260px;background:rgba(0,0,0,.9);border:2px solid rgba(103,103,103,.3);box-sizing:border-box;opacity:0;transition:opacity .45s ease;pointer-events:none;}',
    '.dc-root .dc-wl-open .dc-wl-panel{opacity:1;}',
    '.dc-root .dc-wl-move{transition:translate .55s ' + EASE + ';}',
    /* 알림 설정 접기 · 알림 폰 */
    '.dc-root .dc-acc{transition:translate .45s ' + EASE + ';}',
    '.dc-root .dc-hide{opacity:0!important;pointer-events:none!important;transition:opacity .35s ease;}',
    '.dc-root .dc-blink{animation:dcBlink 1.4s ease-in-out infinite;}',
    /* 스크롤(시나리오 단계) */
    '.dc-root .dc-scrollhost{cursor:ns-resize;}',
    '.dc-root .dc-scrollhost [data-name="Flowchart"] > *{transition:translate .25s ' + EASE + ';}',
    '.dc-root .dc-thumb{cursor:grab;transition:translate .25s ' + EASE + ',filter .2s ease;}',
    '.dc-root .dc-thumb:hover{filter:brightness(1.3);}',
    /* 토스트 */
    '.dc-root .dc-toast{position:absolute;left:50%;top:86px;z-index:80;translate:-50% -8px;opacity:0;padding:10px 20px;border:1px solid rgba(46,224,255,.6);border-radius:10px;background:rgba(6,14,30,.94);color:#e6f6ff;font:600 15px/1 "Pretendard Variable",Pretendard,sans-serif;pointer-events:none;transition:opacity .25s ease,translate .3s ' + EASE + ';white-space:nowrap;box-shadow:0 0 12px rgba(46,224,255,.3);}',
    '.dc-root .dc-toast.on{opacity:1;translate:-50% 0;}',
    /* 패널 옮기기 · 차트 바꾸기 */
    '.dt-editing .dc-root .dc-mv,.dc-root.dc-edit-layout .dc-mv{cursor:grab!important;}',
    '.dt-editing .dc-root .dc-mv *,.dc-root.dc-edit-layout .dc-mv *{cursor:grab!important;}',
    '.dt-editing .dc-root .dc-mv:hover,.dc-root.dc-edit-layout .dc-mv:hover{outline:1px dashed rgba(var(--dc-acc),.85);outline-offset:3px;}',
    '.dc-root .dc-mv{transition:translate .35s ' + EASE + ';}',
    '.dc-root .dc-front{z-index:20;}',
    '.dc-root .dc-dragging{filter:drop-shadow(0 14px 22px rgba(0,0,0,.45));z-index:30!important;}',
    '.dc-root .dc-resetbtn{position:absolute;left:270px;top:66px;z-index:45;display:none;height:26px;padding:0 14px;border:1px solid rgb(var(--dc-acc));border-radius:8px;background:#0b1530;color:#e6f7ff;font:500 13px/1 "Pretendard Variable",Pretendard,sans-serif;cursor:pointer;}',
    '.dc-root .dc-resetbtn:hover{filter:brightness(1.25);box-shadow:0 0 12px rgba(var(--dc-acc),.6);}',
    '.dt-editing .dc-root .dc-resetbtn,.dc-root.dc-edit-layout .dc-resetbtn{display:block;}',
    '.dt-editing .dc-root [data-name]{animation-play-state:paused!important;}',
    '.dc-root .dc-chost{position:absolute;z-index:6;pointer-events:auto;}',
    '.dc-root .dc-hid{visibility:hidden!important;}',
    '.dc-root .dc-chartbtn.dc-chartbtn{position:absolute;z-index:46;right:auto;width:auto;}',
    '.dc-root .dc-chartmenu.dc-chartmenu{position:absolute;z-index:47;right:auto;}',
    '.dc-root :has(> .dc-chartmenu.open){z-index:50!important;}',
    '.dc-root .dc-chartbtn{position:absolute;top:-11px;right:14px;z-index:25;display:none;align-items:center;gap:4px;height:22px;padding:0 9px;border:1px solid rgb(var(--dc-acc));background:#06264a;color:#e6f7ff;font:500 12px/1 Pretendard,system-ui,sans-serif;cursor:pointer;white-space:nowrap;}',
    '.dc-root .dc-chartbtn:hover{filter:brightness(1.25);box-shadow:0 0 12px rgba(var(--dc-acc),.6);}',
    '.dt-editing .dc-root .dc-chartbtn,.dt-content-editing .dc-root .dc-chartbtn,.dc-root.dc-edit-layout .dc-chartbtn{display:inline-flex;}',
    '.dc-root .dc-chartmenu{position:absolute;top:14px;right:14px;z-index:40;min-width:208px;padding:5px;border:1px solid #2a7ca0;background:#071a30;color:#c7ecf4;font:400 13px/1.35 Pretendard,system-ui,sans-serif;box-shadow:0 12px 28px rgba(0,0,0,.5);opacity:0;translate:0 -4px;pointer-events:none!important;transition:opacity .16s ease,translate .16s ease;}',
    '.dc-root .dc-chartmenu.open{opacity:1;translate:0 0;pointer-events:auto!important;}',
    '.dc-root .dc-chartmenu .hd{padding:4px 8px 6px;font-size:11px;color:#8ea6b3;white-space:nowrap;}',
    '.dc-root .dc-chartmenu button{display:flex;align-items:center;gap:8px;width:100%;padding:6px 8px;border:0;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer!important;white-space:nowrap;}',
    '.dc-root .dc-chartmenu button:hover{background:rgba(var(--dc-acc),.14);color:#fff;}',
    '.dc-root .dc-chartmenu button.cur{background:rgba(9,182,251,.26);color:#fff;}',
    '.dc-root .dc-chartmenu .ic{width:18px;height:14px;flex:none;}',
    '.dc-root .dc-chartmenu .rec{margin-left:auto;padding:1px 6px;background:rgb(var(--dc-acc));color:#03202e;font-size:10px;font-weight:700;}',
    '.dc-root .dc-chartmenu .sep{height:1px;margin:4px 2px;background:rgba(199,236,244,.16);}',
    '.dc-root .dc-chart{position:absolute;inset:0;display:flex;flex-direction:column;padding:10px 14px 8px;background:linear-gradient(180deg,rgba(14,32,54,.97),rgba(12,26,46,.97));box-shadow:inset 0 0 0 1px rgba(42,124,160,.75);color:#c7ecf4;font:400 12px/1.3 Pretendard,system-ui,sans-serif;animation:ovIn .35s ease;}',
    '.dc-root .dc-chart .pl,.dc-root .dc-chart .lg,.dc-root .dc-chart .ct i,.dc-root .dc-chart .ct b{filter:hue-rotate(var(--dc-chue,0deg));}',
    '.dc-root .dc-chart .ct{display:flex;align-items:center;gap:6px;font-weight:500;font-size:15px;color:#fff;white-space:nowrap;}',
    '.dc-root .dc-chart .ct i{display:block;width:8px;height:8px;background:#2a7ca0;flex:none;}',
    '.dc-root .dc-chart .ct b{margin-left:auto;font-family:Tomorrow,Pretendard,sans-serif;font-weight:400;font-size:18px;color:#00ffd2;}',
    '.dc-root .dc-chart .ct b small{font:400 11px Pretendard,sans-serif;color:#8ea6b3;margin-left:3px;}',
    '.dc-root .dc-chart .lg{display:flex;gap:10px;margin-top:3px;font-size:11px;color:#8ea6b3;white-space:nowrap;}',
    '.dc-root .dc-chart .lg span{display:inline-flex;align-items:center;gap:4px;}',
    '.dc-root .dc-chart .lg span:before{content:"";width:9px;height:3px;background:var(--c);}',
    '.dc-root .dc-chart .pl{position:relative;flex:1;min-height:0;margin-top:6px;}',
    '.dc-root .dc-chart svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;}',
    '.dc-root .dc-chart .ax{fill:#8ea6b3;font-size:11px;font-family:Pretendard,system-ui,sans-serif;}',
    '.dc-root .dc-chart .gl{stroke:rgba(142,166,179,.16);stroke-width:1;shape-rendering:crispEdges;}',
    '.dc-root .dc-chart .bars{position:absolute;inset:0 0 16px;display:flex;align-items:flex-end;justify-content:space-around;gap:8px;}',
    '.dc-root .dc-chart .bars > div{position:relative;flex:1;max-width:34px;height:100%;display:flex;align-items:flex-end;}',
    '.dc-root .dc-chart .bars i{display:block;width:100%;background:linear-gradient(180deg,var(--c),rgba(9,182,251,.18));transition:height .9s ' + EASE + ';}',
    '.dc-root .dc-chart .bars em{position:absolute;left:50%;translate:-50% 0;bottom:calc(var(--h) + 2px);font-style:normal;font-size:11px;color:#e6f7ff;white-space:nowrap;transition:bottom .9s ' + EASE + ';}',
    '.dc-root .dc-chart .bars u{position:absolute;left:50%;translate:-50% 0;bottom:-16px;text-decoration:none;font-size:11px;color:#8ea6b3;white-space:nowrap;}',
    '.dc-root .dc-chart .hb{display:flex;flex-direction:column;justify-content:space-around;height:100%;gap:3px;}',
    '.dc-root .dc-chart .hb > div{display:grid;grid-template-columns:72px 1fr 50px;align-items:center;gap:8px;font-size:12px;}',
    '.dc-root .dc-chart .hb s{position:relative;display:block;height:8px;background:rgba(142,166,179,.16);overflow:hidden;text-decoration:none;}',
    '.dc-root .dc-chart .hb s i{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,rgba(9,182,251,.5),var(--c));transition:width .9s ' + EASE + ';}',
    '.dc-root .dc-chart .hb b{text-align:right;color:#fff;font-weight:500;font-variant-numeric:tabular-nums;}',
    '.dc-root .dc-chart .arc{transition:stroke-dasharray .9s ' + EASE + ',stroke-dashoffset .9s ' + EASE + ';}',
    '.dc-root .dc-chart .gv{position:absolute;left:0;right:0;bottom:0;text-align:center;font-family:Tomorrow,Pretendard,sans-serif;font-size:22px;color:#00ffd2;}',
    '.dc-root .dc-chart .gv small{font:400 12px Pretendard,sans-serif;color:#8ea6b3;margin-left:2px;}',
    '.dc-root .dc-chart .dn{display:flex;align-items:center;gap:16px;height:100%;}',
    '.dc-root .dc-chart .dn .ring{position:relative;height:100%;aspect-ratio:1;flex:none;}',
    '.dc-root .dc-chart .dn .ring b{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Tomorrow,Pretendard,sans-serif;font-weight:400;font-size:17px;color:#fff;}',
    '.dc-root .dc-chart .dn .ring b small{font:400 10px Pretendard,sans-serif;color:#8ea6b3;}',
    '.dc-root .dc-chart .dn ul{list-style:none;display:flex;flex-direction:column;gap:4px;font-size:12px;min-width:0;flex:1;}',
    '.dc-root .dc-chart .dn li{display:flex;align-items:center;gap:6px;white-space:nowrap;}',
    '.dc-root .dc-chart .dn li:before{content:"";width:9px;height:3px;background:var(--c);flex:none;}',
    '.dc-root .dc-chart .dn li b{margin-left:auto;color:#fff;font-weight:500;font-variant-numeric:tabular-nums;}',
    /* 라이트 */
    '.dc-root[data-theme="light"] .dc-navlab{color:#3d5068!important;}',
    '.dc-root[data-theme="light"] .dc-navlab.dc-act,.dc-root[data-theme="light"] .dc-navlab.dc-hot{color:#0f2238!important;}',
    '.dc-root[data-theme="light"] .dc-navlab.dc-hot{text-shadow:0 0 8px rgba(0,110,220,.3);}',
    /* 라이트 서브메뉴 — 흰 판 위라 옅은 남색 물(7%)로는 아래 화면과 섞였다 → 흰 판 + 그림자, 고른 줄은 옅은 파랑 */
    '.dc-root[data-theme="light"] .dc-dd > [data-name="Background"]{background:rgba(255,255,255,.96)!important;box-shadow:0 8px 22px rgba(30,60,100,.18),inset 0 0 0 1px #d3dde8!important;}',
    '.dc-root[data-theme="light"] .dc-dd > [data-name="Shape"]{background:#e3edf9!important;}',
    '.dc-root[data-theme="light"] .dc-dd > [data-name="Divider"]{background:#c8d5e6!important;}',
    '.dc-root[data-theme="light"] .dc-dd p.dc-ddon{color:#0f2238!important;}',
    '.dc-root[data-theme="light"] .dc-dd p.dc-ddoff{color:#5b6169!important;}',
    '.dc-root[data-theme="light"] .dc-hovpart.dc-hovon{filter:brightness(.94) drop-shadow(0 2px 5px rgba(0,80,180,.25));}',
    '.dc-root[data-theme="light"] .dc-tip{background:#fff;color:#15253a;border-color:#8fb8e0;box-shadow:0 8px 22px rgba(30,60,100,.16);}',
    '.dc-root[data-theme="light"] .dc-btn:hover{filter:brightness(.94) drop-shadow(0 2px 5px rgba(0,80,180,.25));}',
    '.dc-root[data-theme="light"] .dc-item:hover{background-color:rgba(37,117,213,.08);}',
    '.dc-root[data-theme="light"] .dc-item.dc-sel{background-color:#d6e4f6;}',
    '.dc-root[data-theme="light"] .dc-item.dc-sel p{color:#0b2a55!important;}',
    '.dc-root[data-theme="light"] .dc-row:hover{filter:none;background-image:linear-gradient(rgba(30,120,230,.1),rgba(30,120,230,.1))!important;}',
    '.dc-root[data-theme="light"] .dc-chk:hover{filter:brightness(.95) drop-shadow(0 1px 4px rgba(0,90,200,.35));}',
    '.dc-root[data-theme="light"] .dc-pickim.dc-pickon{filter:brightness(.97) saturate(1.2);}',
    '.dc-root[data-theme="light"] .dc-rowhov{background:rgba(30,120,230,.08);}',
    '.dc-root[data-theme="light"] .dc-hintflash{background-color:rgba(30,120,230,.14)!important;box-shadow:inset 3px 0 0 #1e78e6;}',
    '.dc-root[data-theme="light"] .dc-row.dc-sel{box-shadow:inset 0 0 0 999px rgba(30,120,230,.13),inset 3px 0 0 #1e78e6;}',
    '.dc-root[data-theme="light"] .dc-wl-panel{background:rgba(255,255,255,.96);border-color:#c8d5e6;}',
    '.dc-root[data-theme="light"] .dc-toast{background:#fff;color:#15253a;border-color:#3b9be0;box-shadow:0 8px 22px rgba(30,60,100,.16);}',
    '.dc-root[data-theme="light"] .dc-dragging{filter:drop-shadow(0 14px 22px rgba(30,60,100,.22));}',
    '.dc-root[data-theme="light"] .dc-resetbtn{background:#fff;color:#15253a;}',
    '.dc-root[data-theme="light"] .dc-chart{background:#fff;box-shadow:inset 0 0 0 1px #d9e2ea;color:#2c3e54;}',
    '.dc-root[data-theme="light"] .dc-chart .ct{color:#15253a;}',
    '.dc-root[data-theme="light"] .dc-chartbtn{background:#fff;color:#0a6ea8;box-shadow:0 2px 6px rgba(30,60,100,.14);}',
    '.dc-root[data-theme="light"] .dc-chart .ct b,.dc-root[data-theme="light"] .dc-chart .gv{color:#0060b0;}',
    '.dc-root[data-theme="light"] .dc-chart .ct b small,.dc-root[data-theme="light"] .dc-chart .gv small,.dc-root[data-theme="light"] .dc-chart .lg,.dc-root[data-theme="light"] .dc-chart .bars u{color:#5a6c82;}',
    '.dc-root[data-theme="light"] .dc-chart .ax{fill:#5a6c82;}',
    '.dc-root[data-theme="light"] .dc-chart .bars em,.dc-root[data-theme="light"] .dc-chart .hb b,.dc-root[data-theme="light"] .dc-chart .dn b{color:#15253a;}',
    '.dc-root[data-theme="light"] .dc-chart .gl{stroke:#e4ebf1;}',
    '.dc-root[data-theme="light"] .dc-chartmenu{background:#fff;color:#2c3e54;border-color:#d9e2ea;box-shadow:0 8px 22px rgba(30,60,100,.14);}',
    '.dc-root[data-theme="light"] .dc-chartmenu button:hover,.dc-root[data-theme="light"] .dc-chartmenu button.cur{color:#15253a;}',
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
  function txt(el) { return el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : ''; }
  function editing() { return !!document.querySelector('.dtstage.dt-content-editing, .dtstage.dt-editing, .dt-content-editing, .dt-editing'); }
  function layoutEditing(root) { return !!(root.closest('.dt-editing') || root.classList.contains('dc-edit-layout')); }
  function load(k) { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function comma(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  /* 스튜디오가 '쉬는 중'(가린 탭 · 다른 화면)이면 라이브 갱신을 건너뛴다 — 차트 부품(plant-live)도 이 이름을 쓴다 */
  function idle() { return typeof window.__wembIdle === 'function' ? window.__wembIdle() : document.hidden; }
  function pick(a) { return a[(Math.random() * a.length) | 0]; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function isContents(el) { return getComputedStyle(el).display === 'contents'; }
  /* 사람이 고친 글자는 덮지 않는다 */
  function claimed(p) { return p.__dcLast != null && p.textContent !== p.__dcLast; }
  function write(p, s) {
    if (!p || p === document.activeElement || claimed(p)) return false;
    if (p.textContent !== s) p.textContent = s;
    p.__dcLast = p.textContent;
    return true;
  }
  function clickable(el, fn, cls) {
    if (!el || el.__dcClick) return;
    el.__dcClick = true;
    el.classList.add('dc-click');
    if (cls) el.classList.add(cls);
    el.addEventListener('click', function (e) {
      if (editing()) return;
      e.stopPropagation();
      fn(e);
    });
    /* 묶음(display:contents) 단추는 상자가 없어 :hover · filter 가 안 걸린다 → 조각 상자들을 함께 밝힌다 */
    if (isContents(el)) {
      var parts = boxes(el);
      parts.forEach(function (b) {
        b.classList.add('dc-hovpart');
        b.addEventListener('pointerenter', function () { parts.forEach(function (x) { x.classList.add('dc-hovon'); }); });
        b.addEventListener('pointerleave', function () { parts.forEach(function (x) { x.classList.remove('dc-hovon'); }); });
      });
    }
  }
  /* 기능 툴팁 글 — installTips 가 마우스를 잠시 올리면 보여 준다(먼저 붙인 글이 이긴다) */
  function tip(el, s) { if (el && s && !el.getAttribute('data-dc-tip')) el.setAttribute('data-dc-tip', s); }
  function frameOf(root) { return root.querySelector(':scope > [data-node-id]'); }
  function boxes(el) {
    if (!el || el.nodeType !== 1) return [];
    if (!isContents(el)) return [el];
    var out = [];
    kids(el).forEach(function (c) { out = out.concat(boxes(c)); });
    return out;
  }
  function place(el) {
    var x = (el.__fx || 0) + (el.__ux || 0) + (el.__dx || 0) + (el.__ox || 0);
    var y = (el.__fy || 0) + (el.__uy || 0) + (el.__dy || 0) + (el.__oy || 0);
    el.style.translate = (x || y) ? x.toFixed(2) + 'px ' + y.toFixed(2) + 'px' : '';
  }
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
    if (window.__gotoDatacenterScene) { window.__gotoDatacenterScene(scene); return; }
    location.href = scene + '.html' + location.search;
  }
  function toast(st, msg) {
    var t = st.toast;
    if (!t) { t = st.toast = document.createElement('div'); t.className = 'dc-toast'; st.frame.appendChild(t); }
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(st.toastT);
    st.toastT = setTimeout(function () { t.classList.remove('on'); }, 1900);
  }
  function shiftMs() { return Date.now() - BASE_TIME; }
  function fmt(d) { return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds()); }
  var DT_RE = /^(\d{4})[-.](\d{2})[-.](\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/;
  function parseDT(s) { var m = DT_RE.exec(s); return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]) : null; }
  /* 이 화면의 팝업 뿌리(.sh-pop)까지 — 겹친 화면 */
  function roots(root) { return [root].concat(all(root, '.sh-pop')); }
  /* 화면 헤더 — 이벤트 목록 안에도 'Header' 가 있어서 로그아웃 아이콘이 든 쪽을 고른다 */
  function headerOf(root) { return all(root, '[data-name="Header"]').filter(function (h) { return !!one(h, '[data-name="Icon Logout"]'); })[0] || null; }

  /* ══════════════════ 1. 화면 맞추기 ══════════════════
     판이 16:9 보다 넓으면 exW, 높으면 exH 가 남는다. 프레임 첫 단 묶음(Layout · Overlay 같은 묶음은 그 자식)마다 하나의 단위로
     왼/가운데/오른 · 위/가운데/아래에 따라 0 · ½ · 1 만큼 옮긴다. 바탕 그라디언트는 늘어난 판 전체를 칠하고 헤더 띠는 폭을 늘린다. */
  function installFit(root, st) {
    var frame = frameOf(root);
    frame.style.position = 'absolute';
    frame.style.left = '0';
    frame.style.top = '0';
    frame.style.transformOrigin = '0 0';
    frame.style.width = BASE_W + 'px';
    frame.style.height = BASE_H + 'px';
    st.frame = frame;
    st.S = 1; st.exW = 0; st.exH = 0;
    /* 바탕 — 프레임의 그라디언트를 늘어난 판 전체로(프레임은 1920x1080 그대로라 그 밖이 비었다) */
    var fill = document.createElement('div');
    fill.className = 'dc-bgfill';
    var fcs = getComputedStyle(frame);
    fill.style.backgroundImage = fcs.backgroundImage;
    fill.style.backgroundColor = fcs.backgroundColor;
    frame.insertBefore(fill, frame.firstChild);
    st.bgfill = fill;
    var asset = /Asset Management/.test(nm(frame));
    var units = [];
    var idx = 0;
    function addUnit(c) {
      var n = nm(c);
      if (c === fill || c.classList.contains('dc-toast')) return;
      if (isContents(c) && /^(Layout|Overlay)$/.test(n)) { kids(c).forEach(addUnit); return; }
      var els = boxes(c);
      if (!els.length) return;
      var r = unionRect(els, st) || { x: 0, y: 0, w: 0, h: 0 };
      var u = { name: n, el: c, els: els, r: r, i: idx++ };
      if (/^Background/.test(n) || (r.w >= 1900 && r.h >= 1000 && !c.classList.contains('sh-popmount'))) u.kind = 'bg';
      else if (n === 'Header') u.kind = 'header';
      else {
        var cx = r.x + r.w / 2;
        /* 자산관리 화면은 표 · 필터 · 단추가 한 판이라 통째로 가운데(어긋나지 않게) */
        u.ax = asset ? 0.5 : r.w >= 1500 ? 0.5 : cx < 560 ? 0 : cx > 1400 ? 1 : 0.5;
        /* 위에 붙은 판(옆 판 · 안내 · 알림 설정)은 위에, 아래 띠(이벤트 목록 · 작업리스트)와 그 위에 얹힌 알림 폰은 아래에 */
        u.ay = (r.y >= BASE_H - 340 && r.h <= 340) || n === 'Popup/Alarm Message' ? 1 : r.y < 200 && r.h < 700 ? 0 : 0.5;
        /* 자산관리는 한 판 — 위에 붙이고 큰 바탕(내용 판 · 옆 메뉴 · 표 판)은 아래로 늘린다 */
        if (asset) { u.ay = 0; if (r.h >= 600 && n !== 'Table') { u.grow = true; u.h0 = els[0].offsetHeight; } }
        u.kind = 'move';
        if (c.classList.contains('sh-popmount')) { u.ax = 0.5; u.ay = 0.5; }
        /* 화면 폭 띠(이벤트 목록 · 작업리스트) — 왼쪽에 붙이고 폭을 늘린다. 안쪽 칸은 제자리 비율만큼 옮긴다 */
        else if (!asset && r.w >= 1800 && els.length === 1) { u.ax = 0; u.kind = 'bar'; }
      }
      els.forEach(function (e) { e.classList.add('dc-place'); });
      if (u.kind === 'move' || u.kind === 'bar') els.forEach(function (e) { e.classList.add('dc-unit'); e.style.setProperty('--i', u.i); });
      units.push(u);
    }
    kids(frame).forEach(addUnit);
    st.units = units;
    /* 헤더 — 1800 이상 띠는 폭을 늘리고, 그 안 묶음은 자리(왼 · 가운데 · 오른)에 따라 옮긴다 */
    var hdr = units.filter(function (u) { return u.kind === 'header'; })[0];
    var bars = [], movers = [];
    function hwalk(el) {
      kids(el).forEach(function (c) {
        if (isContents(c)) { hwalk(c); return; }
        var w = c.offsetWidth;
        if (w >= 1800) { bars.push({ el: c, w0: w }); hwalk(c); return; }
        if (w >= 1000) { hwalk(c); return; }
        var r = rectIn(c, st);
        var cx = r.x + r.w / 2;
        movers.push({ el: c, k: cx < 300 ? 0 : cx > 1500 ? 1 : 0.5 });
      });
    }
    if (hdr) hwalk(hdr.el);
    movers.forEach(function (m) { m.el.classList.add('dc-place'); });
    /* 띠 안쪽 — 1800 이상 줄은 늘리고(그 안으로 내려간다), 나머지는 띠 안 가운데 자리 비율(0~1)만큼 exW 를 받는다 */
    var bwide = [], bmove = [];
    function bwalk(el, x0, w0) {
      /* 늘린 줄이 flex · grid 면 안쪽은 스스로 다시 놓인다 — 또 옮기면 두 번 밀린다 */
      var flow = /flex|grid/.test(getComputedStyle(el).display);
      kids(el).forEach(function (c) {
        if (flow && !isContents(c)) { if (c.offsetWidth >= 1700) { bwide.push({ el: c, w0: c.offsetWidth }); bwalk(c, x0, w0); } return; }
        if (isContents(c)) { bwalk(c, x0, w0); return; }
        var r = rectIn(c, st);
        if (r.w >= 1700) { bwide.push({ el: c, w0: c.offsetWidth }); bwalk(c, x0, w0); return; }
        var k = Math.max(0, Math.min(1, (r.x + r.w / 2 - x0) / w0));
        if (r.w > 900) k = 0;
        bmove.push({ el: c, k: k < 0.2 ? 0 : k > 0.8 ? 1 : k });
      });
    }
    units.forEach(function (u) {
      if (u.kind !== 'bar') return;
      u.w0 = u.el.offsetWidth;
      bwalk(u.el, u.r.x, u.r.w);
    });
    bmove.forEach(function (m) { m.el.classList.add('dc-place'); });
    /* % · right 로 놓인 칸은 띠를 늘리면 저절로 밀린다 — 1000px 늘려 보고 저절로 밀린 비율(auto)을 재서 그만큼 뺀다 */
    (function () {
      var test = units.filter(function (u) { return u.kind === 'bar'; }).map(function (u) { return { el: u.el, w0: u.w0 }; }).concat(bwide, bars);
      var ms = bmove.concat(movers);
      var x0 = ms.map(function (m) { return rectIn(m.el, st).x; });
      test.forEach(function (b) { b.el.style.width = (b.w0 + 1000) + 'px'; });
      ms.forEach(function (m, i) { m.auto = Math.max(0, Math.min(1, (rectIn(m.el, st).x - x0[i]) / 1000)); if (m.auto < 0.02) m.auto = 0; });
      test.forEach(function (b) { b.el.style.width = ''; });
    })();
    var bgW0 = {};
    function layoutFn() {
      var W = root.clientWidth, H = root.clientHeight;
      if (!W || !H) return;
      var S = Math.min(W / BASE_W, H / BASE_H);
      var VW = W / S, VH = H / S, exW = Math.max(0, VW - BASE_W), exH = Math.max(0, VH - BASE_H);
      if (exW < 0.01) exW = 0;
      if (exH < 0.01) exH = 0;
      st.S = S; st.exW = exW; st.exH = exH; st.VW = VW; st.VH = VH;
      frame.style.overflow = 'visible';
      frame.style.transform = S === 1 ? 'none' : 'scale(' + S + ')';
      fill.style.width = (BASE_W + exW) + 'px';
      fill.style.height = (BASE_H + exH) + 'px';
      units.forEach(function (u) {
        if (u.kind === 'bg') {
          u.els.forEach(function (e, k) {
            var key = u.i + ':' + k;
            if (bgW0[key] == null) bgW0[key] = [e.offsetWidth, e.offsetHeight];
            var w0 = bgW0[key];
            if (w0[0] >= 1800 && w0[0] <= 1960) e.style.width = (w0[0] + exW) + 'px';
            if (w0[1] >= 1000 && w0[1] <= 1100) e.style.height = (w0[1] + exH) + 'px';
            /* 큰 바탕 그림(빛 번짐 · 3D 장면)은 가운데로 */
            if (w0[0] > 1960) { e.__fx = exW / 2; e.__fy = exH / 2; place(e); }
          });
        } else if (u.kind === 'bar') {
          u.el.style.width = (u.w0 + exW) + 'px';
          u.el.__fy = exH * u.ay; place(u.el);
        } else if (u.kind === 'header') {
          bars.forEach(function (b) { b.el.style.width = (b.w0 + exW) + 'px'; });
          movers.forEach(function (m) { m.el.__fx = exW * (m.k - (m.auto || 0)); place(m.el); });
        } else {
          u.els.forEach(function (e) { e.__fx = exW * u.ax; e.__fy = exH * u.ay; place(e); });
          if (u.grow) u.els[0].style.height = (u.h0 + exH) + 'px';
        }
      });
      bwide.forEach(function (b) { b.el.style.width = (b.w0 + exW) + 'px'; });
      bmove.forEach(function (m) { if (m.el.classList.contains('dc-mv') && m.el.__unit) return; m.el.__bx = exW * (m.k - (m.auto || 0)); m.el.__fx = m.el.__bx; place(m.el); });
      (st.onLayout || []).forEach(function (f) { try { f(); } catch (e) { } });
    }
    var rsT = 0;
    function relayout() {
      root.classList.add('dc-resizing');
      layoutFn();
      clearTimeout(rsT);
      rsT = setTimeout(function () { root.classList.remove('dc-resizing'); }, 140);
    }
    st.onLayout = [];
    layoutFn();
    st.layout = layoutFn;
    if (window.ResizeObserver) { st.ro = new ResizeObserver(relayout); st.ro.observe(root); }
    else { st.onResize = relayout; window.addEventListener('resize', relayout); }
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('dc-live'); }); });
  }

  /* ══════════════════ 2. 시계 · 최근 시각 ══════════════════ */
  var WD = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  function installClock(root, st) {
    var hdr = headerOf(root);
    if (!hdr) return;
    var dateEl = null, timeEl = null;
    all(hdr, '[data-node-id]').forEach(function (e) {
      var t = txt(e);
      if (!dateEl && /^\d{4}\/\d{2}\/\d{2}\s*[A-Z]{3}$/.test(t) && all(e, 'p').length === 2) dateEl = e;
      if (!timeEl && e.tagName === 'P' && /^\d{2}:\d{2}:\d{2}$/.test(t)) timeEl = e;
    });
    /* 알림 폰 상태줄 시각(14:27) */
    var phone = one(root, '[data-name="Popup/Alarm Message"]');
    var pClock = phone ? all(phone, 'p').filter(function (p) { return /^\d{2}:\d{2}$/.test(txt(p)); })[0] : null;
    function tick() {
      var d = new Date();
      if (dateEl) { var ps = all(dateEl, 'p'); write(ps[0], d.getFullYear() + '/' + p2(d.getMonth() + 1) + '/' + p2(d.getDate())); write(ps[1], WD[d.getDay()]); }
      if (timeEl) write(timeEl, p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds()));
      if (pClock) write(pClock, p2(d.getHours()) + ':' + p2(d.getMinutes()));
    }
    tick();
    var t0 = setTimeout(function () { tick(); st.timers.push(setInterval(tick, 1000)); }, 1000 - (Date.now() % 1000));
    st.timers.push(t0);
  }
  /* 이벤트 발생시각 · 작업 시작시각 · 알림 발생시각 — 화면에 찍힌 기준 시각과의 차이만큼 '지금'으로 옮긴다(열 때마다 최근) */
  function installRecent(root, st) {
    var off = shiftMs();
    roots(root).forEach(function (r) {
      all(r, 'p').forEach(function (p) {
        var t = txt(p), d = parseDT(t);
        if (d) { write(p, fmt(new Date(d.getTime() + off))); return; }
        var m = /^(\d{4})\.(\d{2})\.(\d{2}) (오전|오후) (\d{2}):(\d{2}):(\d{2})$/.exec(t);
        if (m) {
          var h = +m[5] % 12 + (m[4] === '오후' ? 12 : 0);
          var nd = new Date(new Date(+m[1], +m[2] - 1, +m[3], h, +m[6], +m[7]).getTime() + off);
          var hh = nd.getHours();
          write(p, nd.getFullYear() + '.' + p2(nd.getMonth() + 1) + '.' + p2(nd.getDate()) + ' ' + (hh < 12 ? '오전' : '오후') + ' ' + p2(hh % 12 || 12) + ':' + p2(nd.getMinutes()) + ':' + p2(nd.getSeconds()));
        }
      });
    });
  }

  /* ══════════════════ 3. 이벤트 목록 — 새 이벤트 · 건수 · 등급 칩 필터 · 접기 ══════════════════ */
  var EV_POOL = [
    ['UPS-1A', '2F', 'UPS', 'UPS 배터리 온도 상승(32.1℃)'], ['CRAC-4F-02', '4F', '항온항습기', '환기 온도 편차 발생'], ['PDU-3F-05', '3F', '분전반', '분기 차단기 동작'],
    ['LV-2A-01', '2F', '저압반', '역률 저하(0.86)'], ['TR-1', 'B1F', '변압기', '권선 온도 상승(96℃)'], ['STS-2-01', '2F', 'STS', '절체 동작 완료'],
    ['ATS-1', 'B1F', 'ATS', '상용전원 전압 저하'], ['GEN-1', 'B1F', '발전기', '연료 레벨 70% 이하'], ['MCC-2F-04', '2F', 'MCC', '모터 과부하 경보'], ['BAT-1A', '2F', '축전지', '셀 전압 편차 발생']];
  function installEventLog(root, st) {
    var log = one(root, '[data-name="Event Log"]');
    if (!log) return;
    var group = one(log, '[data-name="Group Row"]');
    var rows = group ? kids(group).filter(function (r) { return nm(r) === 'Row'; }) : [];
    rows.forEach(function (r) { r.classList.add('dc-row'); clickable(r, function () { rows.forEach(function (x) { x.classList.toggle('dc-sel', x === r && !r.classList.contains('dc-sel')); }); }); });
    /* 건수 칩 */
    var chips = {};
    ['ALL', 'CR', 'WA', 'NO'].forEach(function (k) {
      var c = one(log, '[data-name="' + k + '"]');
      if (c) chips[k] = { el: c, v: one(c, '[data-name="Value"]') };
    });
    function gradeOf(r) { var p = one(r, '[data-name="Label"] p'); return txt(p); }
    var GR = { CR: 'Critical', WA: 'Warning', NO: 'Normal' };
    var filt = null;
    function applyFilter() {
      rows = group ? kids(group).filter(function (r) { return nm(r) === 'Row'; }) : rows;
      rows.forEach(function (r) { r.style.opacity = !filt || gradeOf(r) === GR[filt] ? '' : '.18'; });
      Object.keys(chips).forEach(function (k) { chips[k].el.classList.toggle('dc-dimchip', !!filt && k !== filt && k !== 'ALL'); });
    }
    Object.keys(chips).forEach(function (k) {
      chips[k].el.classList.add('dc-btn');
      clickable(chips[k].el, function () { filt = k === 'ALL' || filt === k ? null : k; applyFilter(); });
    });
    /* 확인 · 전체확인 · 소리 */
    var tbs = all(log, '[data-name="Event Log/Toolbar Button (Dark)"]');
    tbs.forEach(function (b) {
      var lab = txt(b);
      b.classList.add('dc-btn');
      if (lab === '확인') clickable(b, function () { var s = one(group, '.dc-sel'); if (s) { s.style.opacity = '.45'; toast(st, '선택한 이벤트를 확인 처리했습니다'); } else toast(st, '확인할 이벤트를 먼저 선택하세요'); });
      else if (lab === '전체확인') clickable(b, function () { rows.forEach(function (r) { r.style.opacity = '.45'; }); toast(st, '이벤트 ' + rows.length + '건을 모두 확인 처리했습니다'); setTimeout(function () { rows.forEach(function (r) { r.style.opacity = ''; }); }, 2400); });
    });
    var snd = tbs.filter(function (b) { return !txt(b); })[1];
    if (snd) tip(snd, '이벤트 알림음 켜기 · 끄기');
    if (snd) clickable(snd, function () { snd.classList.toggle('dc-off'); toast(st, snd.classList.contains('dc-off') ? '이벤트 알림음 끔' : '이벤트 알림음 켬'); });
    /* 새 이벤트 — 같은 등급 줄을 본떠 맨 위에 끼우고 맨 아래 줄은 뺀다(건수 칩도 같이) */
    function feed() {
      st.feed = setTimeout(feed, rnd(16000, 26000));
      if (editing() || idle() || !group) return;
      rows = kids(group).filter(function (r) { return nm(r) === 'Row'; });
      if (rows.length < 2 || getComputedStyle(group).display.indexOf('flex') < 0) return;
      var g = Math.random() < 0.15 ? 'Critical' : Math.random() < 0.6 ? 'Warning' : 'Normal';
      var proto = rows.filter(function (r) { return gradeOf(r) === g; })[0] || rows[0];
      var nr = proto.cloneNode(true);
      nr.__dcClick = false;
      var ev = pick(EV_POOL);
      var ps = all(nr, 'p');
      /* 줄 안 글자 순서: 등급 · 시각 · 설비 · 위치 · 구분 · 메시지 */
      if (ps.length >= 6) { ps[1].textContent = fmt(new Date()); ps[2].textContent = ev[0]; ps[3].textContent = ev[1]; ps[4].textContent = ev[2]; ps[5].textContent = ev[3]; }
      nr.classList.remove('dc-sel');
      nr.style.opacity = '';
      group.insertBefore(nr, rows[0]);
      nr.classList.add('dc-rowin');
      var last = rows[rows.length - 1];
      last.remove();
      nr.classList.add('dc-row');
      clickable(nr, function () { kids(group).forEach(function (x) { x.classList.toggle('dc-sel', x === nr && !nr.classList.contains('dc-sel')); }); });
      var key = g === 'Critical' ? 'CR' : g === 'Warning' ? 'WA' : 'NO';
      [key, 'ALL'].forEach(function (k) { var c = chips[k]; if (c && c.v) { var n = parseInt(txt(c.v).replace(/,/g, ''), 10) || 0; write(c.v, String(n + 1)); } });
      applyFilter();
    }
    st.feed = setTimeout(feed, rnd(9000, 14000));
  }
  /* 이벤트 목록 접기(메인) · 작업리스트 펼치기(작업자안전관리) */
  function installFold(root, st) {
    var F = load(K_FOLD);
    var log = one(root, '[data-name="Event Log"]');
    var btn = log && one(log, '[data-name="Event Log/Toolbar Button (Dark)"]');
    if (log && btn) {
      var box = log;
      box.classList.add('dc-foldbox');
      btn.classList.add('dc-btn');
      var arrow = btn;
      arrow.classList.add('dc-foldarrow');
      var folded = !!F[st.scene];
      var H = log.offsetHeight || 320;
      var apply = function () {
        box.__oy = folded ? H - 56 : 0; place(box);
        arrow.style.rotate = folded ? '180deg' : '';
      };
      box.__applyFold = apply;
      apply();
      clickable(btn, function () { folded = !folded; F = load(K_FOLD); F[st.scene] = folded; save(K_FOLD, F); apply(); });
    }
    var wl = one(root, '[data-name="Widget/Work List"]');
    /* 작업리스트 펼침 단추 — 이름 없는 화살표 칸(Section 1 의 마지막, 아래 화살표 그림) */
    var wbtn = wl && (one(wl, '[data-name="Work List/Toolbar Button"]') || (function () { var s1 = one(wl, '[data-name="Section 1"]'); var k = kids(s1).filter(function (c) { return one(c, 'img[src*="arrow"]'); }); return k[k.length - 1] || null; })());
    if (wl && wbtn) {
      var panel = document.createElement('div');
      panel.className = 'dc-wl-panel';
      var bar = kids(wl);
      wl.insertBefore(panel, wl.firstChild);
      var moving = [];
      bar.forEach(function (c) { moving = moving.concat(boxes(c)); });
      moving.forEach(function (c) { c.classList.add('dc-wl-move'); });
      panel.classList.add('dc-wl-move');
      wbtn.classList.add('dc-btn', 'dc-foldarrow');
      var open = !!F[st.scene + ':wl'];
      var applyW = function () {
        wl.classList.toggle('dc-wl-open', open);
        /* 바(아래 60px)와 목록(아래 바깥)을 260px 올린다 — 목록이 바 바로 아래로 들어온다 */
        moving.forEach(function (c) { c.__oy = open ? -260 : 0; place(c); });
        panel.__oy = open ? -260 : 0; place(panel);
        panel.style.top = '320px';
        wbtn.style.rotate = open ? '180deg' : '';
      };
      wl.__applyFold = applyW;
      applyW();
      clickable(wbtn, function () { open = !open; F = load(K_FOLD); F[st.scene + ':wl'] = open; save(K_FOLD, F); applyW(); });
    }
  }

  /* ══════════════════ 4. 스크롤 — 시나리오 단계 ══════════════════ */
  function installScroll(root, st) {
    all(root, '[data-name="Scenario Steps"]').forEach(function (steps) {
      var panel = steps.closest('[data-name="Side Panel"]') || root;
      var flow = one(steps, '[data-name="Flowchart"]');
      var thumb = one(panel, '[data-name="Scroll Thumb"]');
      if (!flow) return;
      var parts = boxes(flow);
      var host = one(panel, '[data-name="Steps Background"]');
      var r = unionRect(parts, st), vis = (host && rectIn(host, st)) || { y: 640, h: 304 };
      if (!r) return;
      var max = Math.max(0, r.y + r.h - (vis.y + vis.h) + 14);
      if (max < 4) return;
      var trackH = 304, thumbH = thumb ? thumb.offsetHeight : 156, tmax = Math.max(0, trackH - thumbH - 8);
      var pos = 0;
      [host].concat(boxes(steps)).forEach(function (e) { if (e) e.classList.add('dc-scrollhost'); });
      /* 단계마다 Figma 마스크(mask-image + 위치)가 붙어 있다 — 칸을 올린 만큼 마스크는 내려야 창이 제자리에 있다.
         마스크가 없는 칸(진행 선 · 점)은 창 밖을 clip-path 로 자른다 */
      var info = parts.map(function (e) {
        var cs = getComputedStyle(e), mi = cs.maskImage || cs.webkitMaskImage;
        var mp = (cs.maskPosition || cs.webkitMaskPosition || '0px 0px').split(' ');
        return { e: e, mask: mi && mi !== 'none', mx: mp[0], my: parseFloat(mp[1]) || 0, r: rectIn(e, st) };
      });
      function set(v) {
        pos = Math.max(0, Math.min(max, v));
        info.forEach(function (o) {
          o.e.style.translate = pos ? '0 ' + (-pos).toFixed(1) + 'px' : '';
          if (o.mask) { var p = o.mx + ' ' + (o.my + pos).toFixed(2) + 'px'; o.e.style.maskPosition = pos ? p : ''; o.e.style.webkitMaskPosition = pos ? p : ''; }
          else {
            var top = Math.max(0, vis.y - (o.r.y - pos)), bot = Math.max(0, (o.r.y - pos + o.r.h) - (vis.y + vis.h));
            o.e.style.clipPath = pos ? 'inset(' + top.toFixed(1) + 'px -20px ' + bot.toFixed(1) + 'px -20px)' : '';
          }
        });
        if (thumb) { thumb.__oy = tmax * pos / max; place(thumb); }
      }
      var onWheel = function (e) {
        if (editing()) return;
        e.preventDefault();
        set(pos + e.deltaY * 0.6);
      };
      /* 단계 칸 위에 옆 판 바탕(Background)이 덮여 있어 칸에 직접 단 휠이 안 받는 곳이 있다 → 뿌리에서 받고 칸 사각형 안인지 본다 */
      var inSteps = function (e) { var r = host ? host.getBoundingClientRect() : null; return r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; };
      st.onStepsWheel = function (e) { if (inSteps(e) && !e.target.closest('.sh-popmount')) onWheel(e); };
      root.addEventListener('wheel', st.onStepsWheel, { passive: false });
      /* 칸 위 바탕에도 '휠로 넘기기' 툴팁 · 휠 커서 */
      all(panel, '[data-name="Background"]').forEach(function (b) { var r = rectIn(b, st), v = host && rectIn(host, st); if (v && r.x <= v.x + 2 && r.x + r.w >= v.x + v.w - 2 && r.y <= v.y + 2 && r.y + r.h >= v.y + v.h - 2 && r.w < 400 && r.h < 420) { b.classList.add('dc-scrollhost'); tip(b, '마우스 휠로 시나리오 단계 넘기기'); } });
      if (thumb) {
        thumb.classList.add('dc-thumb');
        var drag = null;
        thumb.addEventListener('pointerdown', function (e) { if (editing()) return; e.preventDefault(); e.stopPropagation(); drag = { y: e.clientY, p: pos }; thumb.setPointerCapture(e.pointerId); });
        thumb.addEventListener('pointermove', function (e) { if (!drag) return; var S = st.S || 1; set(drag.p + (e.clientY - drag.y) / S * (max / (tmax || 1))); });
        thumb.addEventListener('pointerup', function () { drag = null; });
      }
    });
  }

  /* ══════════════════ 5. 화면 잇기 · 단추 · 목록 · 표 ══════════════════ */
  /* 헤더 메뉴 → 장면. '전력' 서브메뉴: 통합전력계통도 = 전력 계통도 화면, 평면전력계통도 = 계통도 위 설비 카드 */
  var NAV = { '통합모니터링': 'main', '전력': 'power', '작업자안전관리': 'worker', '운영관리': 'asset', '통합전력계통도': 'power', '평면전력계통도': 'card', '건물통합계통도': 'main', '공조': 'main' };
  function installNav(root, st) {
    var hdr = headerOf(root);
    if (hdr) {
      all(hdr, 'p').forEach(function (p) {
        var t = txt(p), to = NAV[t];
        if (!to) return;
        var host = p.parentElement && nm(p.parentElement) === 'Menu' ? p.parentElement : p;
        host.classList.add('dc-nav');
        clickable(host, function () { if (to === st.scene && !st.overlay) { toast(st, t + ' 화면입니다'); return; } goto(to); });
      });
      var lo = one(hdr, '[data-name="Icon Logout"]');
      if (lo) clickable(lo, function () { toast(st, '로그아웃은 데모에서 막혀 있습니다'); });
      var logo = one(hdr, '[data-name="Logo"]');
      if (logo) { logo.classList.add('dc-btn'); clickable(logo, function () { goto('main'); }); }
    }
    /* 옆 판 단추(도면정보 · 시나리오 · 설비정보) — 버튼 묶음 · 아이콘 단추 · 글자 모두 */
    var SIDE = { 'Drawing Info': 'power', 'Scenario': 'scenario', 'Equipment Info': 'search' };
    all(root, '[data-name^="Button/"],[data-name^="Icon Button/"],[data-name^="Label/"]').forEach(function (b) {
      var key = nm(b).replace(/^(Button|Icon Button|Label)\//, '');
      if (!SIDE[key] || b.closest('.sh-pop')) return;
      /* 글자만 이름이 있는 곳(전력 화면)은 아이콘까지 든 이름 없는 묶음을 누르게 */
      var host = /^Label\//.test(nm(b)) && b.parentElement && !nm(b.parentElement) && b.parentElement.offsetWidth < 140 ? b.parentElement : b;
      host.classList.add('dc-btn');
      clickable(host, function () { goto(SIDE[key]); });
    });
    var map = {
      'Button/Integrated Power Diagram': function () { goto('power'); },
      'Button/Plan Power Diagram': function () { goto('card'); },
      'Button/Building Power Diagram': function () { goto('main'); },
      'Button/Locate on Map': function () { goto('power'); },
      'Button/Reset': function () { if (st.stage) st.stage.reset(true); toast(st, '화면 시점을 처음으로 되돌렸습니다'); },
      'Button/Play': function () { st.playing = !st.playing; toast(st, st.playing ? '층별 순회 재생' : '층별 순회 멈춤'); },
      'Button/Reset Screen': function () { toast(st, '화면을 초기화했습니다'); },
      'Button/Reset Scenario': function () { toast(st, '시나리오를 처음 단계로 되돌렸습니다'); },
      'Button/Search': function () { toast(st, '검색 결과 1건'); },
      'Button/Excel': function () { toast(st, '엑셀로 내려받기를 준비했습니다'); },
      'Button/Register': function () { toast(st, '자산 등록 창은 데모에서 막혀 있습니다'); },
      'Button/Delete': function () { var s = all(root, '.dc-row.dc-sel'); toast(st, s.length ? '선택한 자산 ' + s.length + '건 삭제 대기' : '삭제할 줄을 먼저 고르세요'); },
      'Button/Dark': function (b) { if (/맵이동/.test(txt(b))) goto('power'); else toast(st, '검색 결과 2건'); },
      'Tag/Device ID': function () { toast(st, '설비 태그 G-6'); },
    };
    roots(root).forEach(function (r) {
      all(r, '[data-name]').forEach(function (b) {
        var n = nm(b), f = map[n];
        if (!f) return;
        if (n === 'Button/Search' && b.closest('[data-name="Popup/Scenario Description"]')) f = function () { toast(st, '시나리오 3건'); };
        b.classList.add('dc-btn');
        clickable(b, function () { f(b); });
      });
      /* 닫기 — 팝업이면 전력 계통도로(간이 설비정보 창은 그 창만 닫는다) */
      all(r, '[data-name="Button/Close"],[data-name="Icon Button/Round"],[data-name="Button/Close Small"]').forEach(function (b) {
        b.classList.add('dc-close');
        clickable(b, function () {
          var mount = b.closest('.sh-popmount');
          if (nm(b) === 'Button/Close Small') { var pm = b.closest('[data-name="Popup/Alarm Message"]'); if (pm) pm.classList.add('dc-hide'); return; }
          if (mount && mount.classList.contains('dmi-mount')) { mount.classList.add('dc-hide'); return; }
          goto('power');
        });
      });
      /* 설비 카드 메뉴 — 이름 없는 칸(아이콘 + 글자 'Label') */
      all(r, '[data-name="Button/Equipment Menu"],[data-name="Popup/Equipment Card"] > div:not([data-name])').forEach(function (b) {
        if (!one(b, ':scope > [data-name="Label"]') && nm(b) !== 'Button/Equipment Menu') return;
        b.classList.add('dc-btn');
        var t = txt(b);
        clickable(b, function () {
          if (t === '상세보기') goto('equipment');
          else if (t === '닫기') goto('power');
          else if (t === '매뉴얼') toast(st, 'STS_7SB_5 대응 매뉴얼을 엽니다');
          else { var m = one(root, '.dmi-mount'); if (m) m.classList.toggle('dc-hide'); }
        });
      });
    });
    /* 전력 계통도 — 계통도 · 3D 를 누르면 설비 카드 */
    /* 그림 상자는 칸(816x944) 밖 화면 아래까지 뻗어 빈 바탕에서도 눌렸다 → 그림은 통과, 칸 바탕(Background)이 받고 그림을 밝힌다 */
    [['View/Plan Diagram', 'Diagram Image', '평면 계통도'], ['View/3D Scene', 'Scene Image', '건물 3D']].forEach(function (x) {
      var v = one(root, '[data-name="' + x[0] + '"]');
      if (!v || st.overlay) return;
      var bg = one(v, ':scope > [data-name="Background"]'), im = one(v, '[data-name="' + x[1] + '"]');
      if (!bg || !im) return;
      im.style.pointerEvents = 'none';
      im.classList.add('dc-pickim');
      bg.classList.add('dc-pick');
      bg.addEventListener('pointerenter', function () { im.classList.add('dc-pickon'); });
      bg.addEventListener('pointerleave', function () { im.classList.remove('dc-pickon'); });
      tip(bg, x[2] + ' — 설비를 누르면 설비 카드가 열립니다');
      clickable(bg, function () { goto('card'); });
    });
  }
  /* ══════════════════ 5-1. 헤더 메뉴 — 오버 표시 · 서브메뉴 ══════════════════
     Figma 메인 · 전력 헤더의 'Hover' 묶음(화살표 + Drop Down Default)은 '전력'에 마우스를 올린 상태를 찍어 둔 것이라 늘 떠 있었다.
     평소 = 지금 화면 메뉴만 밝고 그 아래 화살표. 메뉴에 올리면 그 메뉴가 밝아지며 화살표가 미끄러져 가고, '전력'에 올리면 서브메뉴가 내려온다.
     작업자 · 자산 헤더엔 서브메뉴가 없어 메인 것과 같은 레이어 이름 · 치수 · 색으로 만들어 붙인다(.dc-ddsolo). */
  var ACTIVE = { main: '통합모니터링', worker: '작업자안전관리', asset: '운영관리' };
  function makeDropDown() {
    var d = document.createElement('div');
    d.className = 'dc-ddsolo';
    d.setAttribute('data-name', 'Drop Down Default');
    d.innerHTML = '<div data-name="Background"></div><div data-name="Shape"></div><div data-name="Divider"></div>'
      + '<p data-name="Label/Integrated Power Diagram">통합전력계통도</p><p data-name="Label/Plan Power Diagram">평면전력계통도</p>';
    return d;
  }
  function installMenu(root, st) {
    var hdr = headerOf(root);
    if (!hdr) return;
    var items = [];
    all(hdr, 'p[data-name^="Label/"]').forEach(function (p) {
      if (p.closest('[data-name="Drop Down Default"]')) return;
      var t = txt(p);
      if (!NAV[t]) return;
      var host = p.parentElement && nm(p.parentElement) === 'Menu' ? p.parentElement : p;
      if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
      p.classList.add('dc-navlab');
      host.classList.add('dc-navhit');
      items.push({ t: t, p: p, host: host });
    });
    if (!items.length) return;
    var actT = ACTIVE[st.scene] || '전력';
    var act = items.filter(function (x) { return x.t === actT; })[0] || null;
    var power = items.filter(function (x) { return x.t === '전력'; })[0] || null;
    var hover = one(hdr, '[data-name="Hover"]');
    var arrow = hover ? one(hover, '[data-name="Arrow"]') : one(hdr, '[data-name="Arrow"]');
    var mover = hover || arrow;
    var dd = hover ? one(hover, '[data-name="Drop Down Default"]') : null;
    var cx = function (e) { var r = rectIn(e, st); return r.x + r.w / 2; };
    if (!dd && power) {
      dd = makeDropDown();
      dd.style.left = (cx(power.host) - 74) + 'px';
      (arrow ? arrow.parentElement : hdr).appendChild(dd);
      var fitDD = function () { dd.__fx = (st.exW || 0) * 0.5; place(dd); };
      st.onLayout.push(fitDD);
      fitDD();
      all(dd, 'p').forEach(function (p) {
        var to = NAV[txt(p)];
        p.classList.add('dc-nav');
        clickable(p, function () { dd.classList.remove('dc-ddopen'); if (to === st.scene && !st.overlay) { toast(st, txt(p) + ' 화면입니다'); return; } goto(to); });
      });
    }
    var c0 = arrow ? cx(arrow) : 0;
    if (mover) mover.classList.add('dc-navarrow', 'dc-place');
    function aim(it) {
      items.forEach(function (x) { x.p.classList.toggle('dc-act', x === act); x.p.classList.toggle('dc-hot', x === it); });
      var to = it || act;
      if (mover && to) { mover.__ox = cx(to.host) - c0; place(mover); }
      if (mover) mover.style.opacity = to ? '' : '0';
    }
    /* 서브메뉴 안 — 고른 줄을 칠하는 판(Shape)이 따라간다 */
    var ddItems = dd ? all(dd, 'p') : [], shape = dd ? one(dd, '[data-name="Shape"]') : null;
    function ddPick(i) {
      ddItems.forEach(function (p, k) { p.classList.toggle('dc-ddon', k === i); p.classList.toggle('dc-ddoff', k !== i); });
      if (shape) { shape.style.translate = i ? '0 49.26px' : ''; shape.style.borderRadius = i ? '0 0 4px 4px' : ''; }
    }
    var restT = 0, hideT = 0;
    function open(on) {
      if (!dd) return;
      clearTimeout(hideT);
      if (on) { ddPick(0); dd.classList.add('dc-ddopen'); }
      else hideT = setTimeout(function () { dd.classList.remove('dc-ddopen'); }, 170);
    }
    function enter(it) { clearTimeout(restT); aim(it); open(it === power && !!power); }
    function leave() { clearTimeout(restT); restT = setTimeout(function () { aim(null); }, 170); open(false); }
    items.forEach(function (it) {
      it.host.addEventListener('pointerenter', function () { enter(it); });
      it.host.addEventListener('pointerleave', leave);
    });
    if (dd) {
      dd.classList.add('dc-dd');
      dd.addEventListener('pointerenter', function () { clearTimeout(restT); clearTimeout(hideT); aim(power); dd.classList.add('dc-ddopen'); });
      dd.addEventListener('pointerleave', leave);
      ddItems.forEach(function (p, i) { p.addEventListener('pointerenter', function () { ddPick(i); }); });
      dd.addEventListener('pointerleave', function () { ddPick(0); });
    }
    aim(null);
    st.menuAim = aim;
    passThrough(hdr);
  }
  /* 헤더 상자는 1920x190(서브메뉴 자리까지)이라 아래 옆 판 · 조작 안내 · 알림 설정 윗부분을 덮어 마우스가 닿지 않았다.
     빈 큰 묶음(가로 600 이상 · contents · Hover · Arrow)은 마우스를 통과시키고 글자 · 단추 같은 잎만 받는다. 서브메뉴는 열렸을 때만(CSS). */
  function passThrough(box, minW, keepOpaque) {
    minW = minW || 600;
    box.style.pointerEvents = 'none';
    var opaque = function (c) { var cs = getComputedStyle(c); var m = /rgba?\(([^)]*)\)/.exec(cs.backgroundColor); var a = m ? (m[1].split(',')[3] == null ? 1 : parseFloat(m[1].split(',')[3])) : 0; return a >= 0.5 || cs.backgroundImage !== 'none'; };
    (function mark(el) {
      kids(el).forEach(function (c) {
        if (c.classList.contains('dc-dd') || c.classList.contains('dc-tip')) return;
        var big = isContents(c) || c.offsetWidth >= minW || /^(Hover|Arrow)$/.test(nm(c));
        if (big && keepOpaque && !isContents(c) && opaque(c)) big = false;
        if (big) { c.style.pointerEvents = 'none'; mark(c); } else c.style.pointerEvents = 'auto';
      });
    })(box);
  }
  /* 겹친 팝업 — 설비정보 팝업은 투명한 화면 크기 틀(1920x1080) 안에 판이 있어 아래 전력 화면(헤더 메뉴 · 옆 판)을 통째로 막았다.
     화면 크기 투명 틀만 통과시키고, 팝업 판 · 불투명 전체 화면 팝업(시나리오 설명)은 그대로 막는다 */
  function installPopPass(root) {
    all(root, '.sh-popmount').forEach(function (m) { passThrough(m, 1800, true); });
  }

  /* 이름 없는 단추(자산관리 조회 · 엑셀 · 등록 · 삭제 등) — 글자로 찾아 단추 상자에 클릭 · 오버를 붙인다 */
  var TXT_BTN = {
    '조회': function (st) { toast(st, '조건에 맞는 자산 483건'); },
    '엑셀': function (st) { toast(st, '자산 목록을 엑셀로 내려받기 준비했습니다'); },
    '등록': function (st) { toast(st, '자산 등록 창은 데모에서 막혀 있습니다'); },
    '삭제': function (st, root) { var s = all(root, '.dc-row.dc-sel'); toast(st, s.length ? '선택한 자산 ' + s.length + '건 삭제 대기' : '삭제할 줄을 먼저 고르세요'); },
  };
  function installTextButtons(root, st) {
    all(root, 'p').forEach(function (p) {
      var f = TXT_BTN[txt(p)], host = p.parentElement;
      if (!f || !host || host.__dcClick || host.closest('.dc-click')) return;
      if (host.offsetWidth > 160 || host.offsetWidth < 20) return;
      host.classList.add('dc-btn');
      clickable(host, function () { f(st, root); });
    });
  }

  /* ══════════════════ 5-2. 기능 툴팁 ══════════════════
     단추에 마우스를 잠시(0.38초) 올리면 그 단추가 하는 일을 알려 준다. 패널편집 중에는 띄우지 않는다. */
  var TIP_NAME = [
    ['[data-name="Icon Logout"]', '로그아웃'],
    ['[data-name="Header"] [data-name="Logo"],[data-name="Header"] [data-name="Logo/WEMB Studio"]', '통합모니터링 화면으로'],
    ['[data-name="Button/Drawing Info"]', '도면정보 — 통합전력계통도 열기'],
    ['[data-name="Button/Scenario"]', '시나리오 — 시나리오 설명 열기'],
    ['[data-name="Button/Equipment Info"]', '설비정보 — 설비 검색 열기'],
    ['[data-name="Button/Play"]', '층별 순회 재생 · 멈춤'],
    ['[data-name="Button/Reset Scenario"]', '시나리오를 첫 단계로 되돌리기'],
    ['[data-name="Button/Reset"]', '화면 시점을 처음으로 되돌리기'],
    ['[data-name="Button/Integrated Power Diagram"]', '통합전력계통도로 이동'],
    ['[data-name="Button/Plan Power Diagram"]', '평면전력계통도 — 설비 카드 보기'],
    ['[data-name="Button/Building Power Diagram"]', '건물 3D(통합모니터링)로 이동'],
    ['[data-name="Button/Locate on Map"]', '전력 계통도에서 이 설비 위치 보기'],
    ['[data-name="Button/Close Small"]', '이 알림 닫기'],
    ['[data-name="Button/Close All"]', '알림 팝업 모두 닫기 · 다시 보이기'],
    ['[data-name="Button/Close"],[data-name="Icon Button/Round"]', '닫기'],
    ['[data-name="Accordion Button Arrow Down"]', '알림 설정 접기 · 펼치기'],
    ['[data-name="Select/Small"]', '최근 이벤트 팝업 개수 바꾸기(5 · 10 · 20)'],
    ['[data-name="Checkbox/Label"]', '계통도 라벨 보이기 · 숨기기'],
    ['[data-name="Checkbox/Flow"]', '전력 흐름 보이기 · 숨기기'],
    ['[data-name^="Checkbox/Duct"]', '덕트 · 배관 보이기 · 숨기기'],
    ['[data-name="Popup/Alarm Settings"] [data-name="Checkbox"]', '알림 팝업 안 보이기 켜기 · 끄기'],
    ['[data-name="ALL"]', '모든 등급 보기'], ['[data-name="CR"]', 'Critical 만 보기(다시 누르면 전체)'],
    ['[data-name="WA"]', 'Warning 만 보기(다시 누르면 전체)'], ['[data-name="NO"]', 'Normal 만 보기(다시 누르면 전체)'],
    ['[data-name="Event Log"] [data-name="Row"]', '눌러서 이벤트 선택 · 해제'],
    ['[data-name="Scroll Thumb"]', '끌어서 시나리오 단계 넘기기'],
    ['[data-name="Steps Background"]', '마우스 휠로 시나리오 단계 넘기기'],
    ['[data-name^="Floor Plate/"],[data-name^="Worker Icon/"]', '이 층의 금일 작업 보기'],
    ['[data-name^="Row/"]', '눌러서 자산 선택 · 해제'],
    ['[data-name="Side Menu/Item"]', '이 관리 메뉴 열기'],
    ['[data-name="Side Menu/Group"]', '메뉴 묶음'],
    ['[data-name^="Select/"]', '분류 고르기'],
    ['[data-name^="Input/"],[data-name="Input"]', '검색어 입력'],
    ['[data-name="Tag/Device ID"]', '설비 태그'],
  ];
  var TIP_TXT = {
    '확인': '선택한 이벤트 확인 처리', '전체확인': '이벤트 모두 확인 처리', '상세보기': '설비 상세정보 열기', '매뉴얼': '대응 매뉴얼 보기',
    '차트': '간이 설비정보 창 보이기 · 숨기기', '닫기': '설비 카드 닫기', '조회': '조건으로 자산 조회', '엑셀': '자산 목록 엑셀 내려받기',
    '등록': '새 자산 등록', '삭제': '고른 자산 삭제', '검색': '검색', '설비장비 맵이동': '전력 계통도에서 이 설비 위치 보기',
    '화면 초기화': '화면 시점을 처음으로 되돌리기', '시나리오 초기화': '시나리오를 첫 단계로 되돌리기',
  };
  function installTips(root, st) {
    roots(root).forEach(function (r) {
      all(r, '[data-name="Event Log"] .dc-foldarrow').forEach(function (e) { tip(e, '이벤트 목록 접기 · 펼치기'); });
      all(r, '[data-name="Widget/Work List"] .dc-foldarrow').forEach(function (e) { tip(e, '작업리스트 펼치기 · 접기'); });
      TIP_NAME.forEach(function (x) { all(r, x[0]).forEach(function (e) { tip(e, x[1]); }); });
      all(r, '.dc-click').forEach(function (e) {
        if (e.getAttribute('data-dc-tip') || e.classList.contains('dc-nav')) return;
        var t = txt(e);
        if (TIP_TXT[t]) tip(e, TIP_TXT[t]);
        else if (/^(지상|지하)/.test(t)) tip(e, t + ' 설비를 3D 로 보기');
        else if (e.classList.contains('dc-item') && t) tip(e, '시나리오 · ' + t + ' 보기');
      });
    });
    var el = document.createElement('div');
    el.className = 'dc-tip';
    root.appendChild(el);
    st.tipEl = el;
    var cur = null, showT = 0, lx = 0, ly = 0;
    function pos() {
      var rr = root.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight;
      var x = lx - rr.left + 14, y = ly - rr.top + 20;
      if (x + w > rr.width - 6) x = lx - rr.left - w - 10;
      if (y + h > rr.height - 6) y = ly - rr.top - h - 12;
      el.style.left = Math.max(4, x) + 'px';
      el.style.top = Math.max(4, y) + 'px';
    }
    function hide() { clearTimeout(showT); cur = null; el.classList.remove('on'); }
    st.onTipOver = function (e) {
      var t = e.target.closest && e.target.closest('[data-dc-tip]');
      if (!t || editing()) { hide(); return; }
      if (t === cur) return;
      hide();
      cur = t;
      showT = setTimeout(function () {
        if (cur !== t || editing()) return;
        var s = t.getAttribute('data-dc-tip');
        /* 상태가 있는 단추는 지금 상태를 붙인다 */
        if (t.classList.contains('dc-chk')) s += t.classList.contains('dc-chkoff') ? ' (지금: 꺼짐)' : ' (지금: 켜짐)';
        el.textContent = s;
        pos();
        el.classList.add('on');
      }, 380);
    };
    st.onTipMove = function (e) { lx = e.clientX; ly = e.clientY; if (el.classList.contains('on')) pos(); };
    st.onTipOut = hide;
    root.addEventListener('pointerover', st.onTipOver);
    root.addEventListener('pointermove', st.onTipMove);
    root.addEventListener('pointerleave', st.onTipOut);
    root.addEventListener('pointerdown', st.onTipOut);
  }

  /* ══════════════════ 5-3. 3D 무대 — 조작 안내(List: 확대 · 부분 확대 · 되돌아오기) 그대로 ══════════════════
     메인 3D 장면은 그림 한 장(Scene Image 1744x704, 층 이름도 그림 안)이라 카메라처럼 그림을 키우고 옮긴다.
     · 확대 — 마우스 휠 내리기(올리면 축소), 마우스 자리 고정
     · 부분 확대 — 더블 클릭한 자리를 가운데로 2.2배
     · 되돌아오기 — 확대된 상태에서 그 자리 더블 클릭 → 처음 시점
     · 확대 중엔 끌어서 옮긴다. 원래 칸 밖은 clip-path 로 자른다(칸 = 원래 그림 자리)
     조작할 때 안내 판의 해당 줄이 반짝이고, 안내 줄을 눌러도 같은 동작. 옆 판 층 목록 · Play 는 그 층으로, Reset 은 처음 시점으로 */
  var FLOOR_V = { '지상05층': 261, '지상04층': 305, '지상03층': 349, '지상02층': 408, '지상01층': 470, '지하1층': 496 };
  function installStageZoom(root, st) {
    if (st.scene !== 'main') return;
    var view = one(root, '[data-name="View/3D Scene"]');
    var img = view && one(view, '[data-name="Scene Image"]');
    if (!img) return;
    var W = img.offsetWidth, H = img.offsetHeight, CX = 870, MAX = 3.2;
    var hintList = all(root, '[data-name="List"]').filter(function (l) { return one(l, ':scope > [data-name="Item/Zoom"]'); })[0];
    var HI = { zoom: 'Item/Zoom', part: 'Item/Partial Zoom', back: 'Item/Return to View' };
    var z = { s: 1, tx: 0, ty: 0 };
    img.classList.add('dc-stage3d');
    img.style.transformOrigin = '0 0';
    function apply(mode) {
      if (z.s <= 1.001) { z.s = 1; z.tx = 0; z.ty = 0; }
      z.tx = clamp(z.tx, (1 - z.s) * W, 0);
      z.ty = clamp(z.ty, (1 - z.s) * H, 0);
      img.classList.toggle('dc-stage-anim', mode === 'anim');
      img.classList.toggle('dc-stage-wheel', mode === 'wheel');
      var on = z.s > 1;
      img.style.transform = on ? 'translate(' + z.tx.toFixed(2) + 'px,' + z.ty.toFixed(2) + 'px) scale(' + z.s.toFixed(4) + ')' : 'translate(0px,0px) scale(1)';
      /* 원래 칸만 보이게 — 그림 좌표(변형 전)로 자른다 */
      var t = -z.ty / z.s, l = -z.tx / z.s, r = W - (W - z.tx) / z.s, b = H - (H - z.ty) / z.s;
      img.style.clipPath = 'inset(' + t.toFixed(2) + 'px ' + r.toFixed(2) + 'px ' + b.toFixed(2) + 'px ' + l.toFixed(2) + 'px)';
      img.classList.toggle('dc-zoomed', on);
    }
    /* 화면 좌표 → 그림 좌표(변형 전). 반응형 맞추기 이동(__fx …)과 배율 S 를 뺀다 */
    function local(e) {
      var fr = st.frame.getBoundingClientRect(), S = st.S || 1, b = rectIn(img, st);
      var x0 = b.x + (img.__fx || 0) + (img.__ux || 0) + (img.__dx || 0), y0 = b.y + (img.__fy || 0) + (img.__uy || 0) + (img.__dy || 0);
      return { u: ((e.clientX - fr.left) / S - x0 - z.tx) / z.s, v: ((e.clientY - fr.top) / S - y0 - z.ty) / z.s };
    }
    function zoomAt(p, s2, mode) { s2 = clamp(s2, 1, MAX); z.tx += (z.s - s2) * p.u; z.ty += (z.s - s2) * p.v; z.s = s2; apply(mode); }
    function focus(u, v, s2) { z.s = clamp(s2, 1, MAX); z.tx = W / 2 - z.s * u; z.ty = H / 2 - z.s * v; apply('anim'); }
    function reset(anim) { z.s = 1; z.tx = 0; z.ty = 0; apply(anim ? 'anim' : ''); }
    function center() { return { u: (W / 2 - z.tx) / z.s, v: (H / 2 - z.ty) / z.s }; }
    function flash(k) {
      var it = hintList && one(hintList, '[data-name="' + HI[k] + '"]');
      if (!it) return;
      it.classList.add('dc-hintflash');
      clearTimeout(it.__fl);
      it.__fl = setTimeout(function () { it.classList.remove('dc-hintflash'); }, 650);
    }
    var busy = function () { return editing() || layoutEditing(root); };
    img.addEventListener('wheel', function (e) {
      if (busy()) return;
      var p = local(e);
      if (p.u < 0 || p.v < 0 || p.u > W || p.v > H) return;
      e.preventDefault();
      zoomAt(p, z.s * Math.exp(clamp(e.deltaY, -120, 120) * 0.0018), 'wheel');
      flash('zoom');
    }, { passive: false });
    img.addEventListener('dblclick', function (e) {
      if (busy()) return;
      e.preventDefault();
      if (z.s > 1.05) { reset(true); flash('back'); return; }
      var p = local(e);
      focus(p.u, p.v, 2.2);
      flash('part');
    });
    var drag = null;
    img.addEventListener('pointerdown', function (e) {
      if (busy() || z.s <= 1 || e.button !== 0) return;
      drag = { x: e.clientX, y: e.clientY, tx: z.tx, ty: z.ty };
      img.setPointerCapture(e.pointerId);
      img.classList.add('dc-panning');
    });
    img.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var S = st.S || 1;
      z.tx = drag.tx + (e.clientX - drag.x) / S;
      z.ty = drag.ty + (e.clientY - drag.y) / S;
      apply('');
    });
    var endDrag = function () { drag = null; img.classList.remove('dc-panning'); };
    img.addEventListener('pointerup', endDrag);
    img.addEventListener('pointercancel', endDrag);
    tip(img, '휠 내리기 = 확대 · 올리기 = 축소, 더블 클릭 = 부분 확대 · 되돌아오기, 확대 중 끌기 = 이동');
    apply('');
    st.stage = {
      reset: reset,
      hint: function (n) {
        if (n === HI.zoom) { zoomAt(center(), z.s * 1.35, 'anim'); flash('zoom'); }
        else if (n === HI.part) { focus(z.s > 1.05 ? center().u : CX, z.s > 1.05 ? center().v : 330, Math.max(2.2, z.s)); flash('part'); }
        else { reset(true); flash('back'); }
      },
      floor: function (t) { if (FLOOR_V[t] != null) focus(CX, FLOOR_V[t], 1.9); },
      state: function () { return { s: z.s, tx: z.tx, ty: z.ty }; },
    };
  }

  function installControls(root, st) {
    /* 층 · 시나리오 목록 — 하나만 고른다(처음엔 원본에서 칠해진 줄) */
    var groups = [];
    all(root, '[data-name^="Item/"]').forEach(function (it) { if (it.closest('.sh-pop')) return; var p = it.parentElement; if (groups.indexOf(p) < 0) groups.push(p); });
    groups.forEach(function (sp) {
      var items = kids(sp).filter(function (x) { return /^Item\//.test(nm(x)); });
      if (items.some(function (x) { return /Zoom|Return/.test(nm(x)); })) { items.forEach(function (it) { it.classList.add('dc-btn'); clickable(it, function () { if (st.stage) st.stage.hint(nm(it)); else toast(st, txt(one(it, 'p')) + ' — ' + txt(all(it, 'p')[1])); }); }); return; }
      items.forEach(function (it) {
        it.classList.add('dc-item');
        clickable(it, function () {
          items.forEach(function (x) { x.classList.toggle('dc-sel', x === it); x.classList.toggle('dc-unsel', x !== it); });
          var t = txt(it);
          if (/층$/.test(t) && st.stage) st.stage.floor(t);
          else if (/F$|층/.test(t)) toast(st, t + ' 설비를 3D 로 봅니다'); else toast(st, '시나리오 · ' + t);
        });
      });
      if (st.playing == null) st.playing = false;
      var fl = items.filter(function (x) { return /층$/.test(txt(x)); });
      if (fl.length) {
        st.timers.push(setInterval(function () {
          if (!st.playing || editing()) return;
          var cur = fl.findIndex(function (x) { return x.classList.contains('dc-sel'); });
          var nx = fl[(cur + 1) % fl.length];
          fl.forEach(function (x) { x.classList.toggle('dc-sel', x === nx); x.classList.toggle('dc-unsel', x !== nx); });
          if (st.stage) st.stage.floor(txt(nx));
        }, 2200));
      }
    });
    /* 체크박스 */
    roots(root).forEach(function (r) {
      all(r, '[data-name^="Checkbox"]').forEach(function (c) {
        c.classList.add('dc-chk');
        clickable(c, function () { c.classList.toggle('dc-chkoff'); });
      });
      /* 작은 선택 — 알림 팝업 갯수 5 · 10 · 20 */
      all(r, '[data-name="Select/Small"]').forEach(function (s) {
        var v = one(s, 'p');
        s.classList.add('dc-btn');
        clickable(s, function () { var n = { '5': '10', '10': '20', '20': '5' }[txt(v)] || '10'; write(v, n); toast(st, '최근 이벤트 팝업 ' + n + '개'); });
      });
      all(r, '[data-name="Button/Close All"]').forEach(function (b) {
        b.classList.add('dc-btn');
        clickable(b, function () { var pm = one(root, '[data-name="Popup/Alarm Message"]'); if (pm) pm.classList.toggle('dc-hide'); });
      });
    });
    /* 알림 설정 — 왼쪽 화살표 칸으로 접고 편다 */
    var acc = one(root, '[data-name="Popup/Alarm Settings"]');
    var ab = acc && one(acc, '[data-name="Accordion Button Arrow Down"]');
    if (acc && ab) {
      var content = one(acc, ':scope > [data-name="Content"]');
      var icon = one(ab, '[data-name="Icon Right"]');
      var shut = false;
      [content, ab].forEach(function (e) { if (e) e.classList.add('dc-acc'); });
      if (icon) icon.classList.add('dc-foldarrow');
      ab.classList.add('dc-btn');
      clickable(ab, function () {
        shut = !shut;
        if (content) { content.style.translate = shut ? '330px 0' : ''; content.style.opacity = shut ? '0' : ''; content.style.transition = 'translate .45s ' + EASE + ',opacity .35s ease'; }
        ab.style.translate = shut ? '323px 0' : '';
        if (icon) icon.style.rotate = shut ? '180deg' : '';
      });
    }
    /* 알림 폰 — 경고 아이콘 깜박임 */
    var alarm = one(root, '[data-name="Popup/Alarm Message"]');
    var ic = alarm && one(alarm, '[data-name="Icon"] [data-name="Circle"]');
    if (ic) ic.parentElement.classList.add('dc-blink');
    /* 자산 · 검색 표 줄 · 옆 메뉴 */
    roots(root).forEach(function (r) {
      var rows = all(r, '[data-name^="Row/"]');
      rows.forEach(function (row) { row.classList.add('dc-row'); clickable(row, function () { row.classList.toggle('dc-sel'); }); });
      var menuItems = all(r, '[data-name="Side Menu/Item"]');
      menuItems.forEach(function (it) {
        it.classList.add('dc-item');
        clickable(it, function () { menuItems.forEach(function (x) { x.classList.toggle('dc-sel', x === it); }); toast(st, txt(it) + ' 화면은 데모에서 자산관리로 보여 줍니다'); });
      });
      all(r, '[data-name="Side Menu/Group"]').forEach(function (g) { g.classList.add('dc-btn'); clickable(g, function () { toast(st, txt(g)); }); });
      all(r, '[data-name^="Select/"],[data-name^="Input/"],[data-name="Form Field"]').forEach(function (s) { if (nm(s) === 'Select/Small') return; s.classList.add('dc-btn'); });
      all(r, '[data-name="Floor Plate/RF"],[data-name^="Floor Plate/"],[data-name^="Worker Icon/"]').forEach(function (f) { f.classList.add('dc-btn'); clickable(f, function () { toast(st, nm(f).split('/')[1].replace('-', '/') + ' 금일 작업 현황'); }); });
    });
    /* 시나리오 설명 팝업 — 표 줄을 누르면 강조 줄이 옮겨 가고 아래 상세 칸이 바뀐다 */
    var sc = one(root, '[data-name="Popup/Scenario Description"]');
    if (sc) {
      var hl = one(sc, '[data-name="Row Highlight"]');
      var cols = { no: one(sc, '[data-name="Td/No"]'), id: one(sc, '[data-name="Td/Scenario No"]'), name: one(sc, '[data-name="Td/Scenario Name"]'), desc: one(sc, '[data-name="Td/Scenario Description"]') };
      var fName = one(sc, '[data-name="Field/Scenario Name"] [data-name="Value"]');
      var fDesc = one(sc, '[data-name="Field/Scenario Description"] [data-name="Value"]');
      var listItem = one(sc, '[data-name="Item/1"]');
      var table = one(sc, '[data-name="Table"]');
      if (hl && cols.name && table) {
        hl.classList.add('dc-hl');
        var y0 = hl.offsetTop, rowH = 29;
        var select = function (i) {
          var names = all(cols.name, 'p'), descs = all(cols.desc, 'p');
          if (!names[i]) return;
          hl.style.translate = '0 ' + ((i - 1) * rowH) + 'px';
          [cols.no, cols.id, cols.name, cols.desc].forEach(function (c) { all(c, 'p').forEach(function (p, k) { p.style.fontWeight = k === i ? '800' : '400'; }); });
          write(fName, txt(names[i])); write(fDesc, txt(descs[i])); write(listItem, txt(names[i]));
        };
        /* 줄 오버 — 강조 줄과 같은 자리 · 크기의 옅은 막이 마우스 줄을 따라간다 */
        var hov = document.createElement('div');
        hov.className = 'dc-rowhov';
        hov.style.left = hl.offsetLeft + 'px'; hov.style.top = hl.offsetTop + 'px';
        hov.style.width = hl.offsetWidth + 'px'; hov.style.height = hl.offsetHeight + 'px';
        hl.parentElement.insertBefore(hov, hl.nextSibling);
        var rowAt = function (ev) { var tr = cols.name.getBoundingClientRect(), S = st.S || 1; return Math.floor((ev.clientY - tr.top) / (rowH * S)); };
        boxes(table).forEach(function (e) {
          e.addEventListener('pointermove', function (ev) { var i = rowAt(ev); if (i >= 0 && i < 3) { hov.style.translate = '0 ' + ((i - 1) * rowH) + 'px'; hov.classList.add('on'); } else hov.classList.remove('on'); });
          e.addEventListener('pointerleave', function () { hov.classList.remove('on'); });
          tip(e, '눌러서 시나리오 고르기');
        });
        boxes(table).forEach(function (e) {
          e.classList.add('dc-click');
          e.addEventListener('click', function (ev) {
            if (editing()) return;
            var tr = cols.name.getBoundingClientRect(), S = st.S || 1;
            var i = Math.floor((ev.clientY - tr.top) / (rowH * S));
            if (i >= 0 && i < 3) select(i);
          });
        });
      }
    }
  }
  /* 숫자 지표 — 층별 작업 · 전체 작업자수가 가끔 바뀐다(실시간 연동처럼) */
  function installJitter(root, st) {
    var counts = all(root, '[data-name^="Count/"]').filter(function (p) { return p.tagName === 'P' || one(p, 'p'); });
    var total = one(root, '[data-name="Widget/Work List"] [data-name="Value"]');
    if (!counts.length) return;
    st.timers.push(setInterval(function () {
      if (editing() || idle()) return;
      var c = pick(counts), p = c.tagName === 'P' ? c : one(c, 'p');
      var n = parseInt(txt(p), 10) || 0;
      var nn = Math.max(0, n + (Math.random() < 0.55 ? 1 : -1));
      if (write(p, String(nn))) {
        p.style.transition = 'color .4s ease,text-shadow .4s ease';
        p.style.textShadow = '0 0 10px rgba(46,224,255,.9)';
        setTimeout(function () { p.style.textShadow = ''; }, 700);
        if (total) { var t = parseInt(txt(total), 10) || 0; write(total, String(Math.max(0, t + (nn - n) * Math.round(rnd(1, 3))))); }
      }
    }, 6500));
  }
  /* 테마 — 스튜디오는 바깥 뿌리 data-theme 만 바꾼다. 안쪽 팝업 뿌리(.sh-pop)도 따라가게 */
  function installTheme(root, st) {
    var sync = function () {
      var t = root.dataset.theme || 'dark';
      all(root, '.sh-pop').forEach(function (p) { if (p.dataset.theme !== t) p.dataset.theme = t; });
      /* 늘어난 판 바탕(dc-bgfill)은 프레임 바탕을 베낀 것 — 테마가 바뀌면 다시 베낀다 */
      if (st.bgfill && st.frame) { var cs = getComputedStyle(st.frame); st.bgfill.style.backgroundImage = cs.backgroundImage; st.bgfill.style.backgroundColor = cs.backgroundColor; }
    };
    sync();
    if (window.MutationObserver) { st.mo = new MutationObserver(sync); st.mo.observe(root, { attributes: true, attributeFilter: ['data-theme'] }); }
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
    el.className = 'dc-chart';
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
        s += '<clipPath id="ovc' + spec.uid + '"><rect x="' + L + '" y="0" width="' + (w - L - R) + '" height="' + h + '"/></clipPath><g clip-path="url(#ovc' + spec.uid + ')">';
        data.forEach(function (a, si) {
          var col = spec.series[si][1];
          var pts = a.map(function (v, i) { return X(i).toFixed(1) + ',' + Y(v).toFixed(1); }).join(' ');
          if (spec.k === 'area' || si === 0) {
            s += '<defs><linearGradient id="ovg' + spec.uid + si + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + col + '" stop-opacity="' + (spec.k === 'area' ? .4 : .18) + '"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></linearGradient></defs>';
            s += '<polygon fill="url(#ovg' + spec.uid + si + ')" points="' + X(0).toFixed(1) + ',' + (h - B) + ' ' + pts + ' ' + X(N - 1).toFixed(1) + ',' + (h - B) + '"/>';
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
        + '<defs><linearGradient id="ovgg' + spec.uid + '" x1="0" x2="1"><stop offset="0" stop-color="#2a7ca0"/><stop offset="1" stop-color="' + spec.c + '"/></linearGradient></defs>'
        + '<path d="M8 52a42 42 0 0 1 84 0" fill="none" stroke="rgba(142,166,179,.2)" stroke-width="8"/>'
        + '<path class="arc" d="M8 52a42 42 0 0 1 84 0" fill="none" stroke="url(#ovgg' + spec.uid + ')" stroke-width="8" stroke-dasharray="0 ' + LEN.toFixed(1) + '"/>'
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
    root.style.setProperty('--dc-chue', (Math.abs(rot) < 3 ? 0 : Math.round(rot)) + 'deg');
  }
  var chartUid = 0;
  var CC = { bl: '#2575d5', cy: '#2ee0ff', gn: '#34d28d', or: '#ff9f43', re: '#ff2828', vi: '#8f7cff', ye: '#f5c542', gr: '#8b8b8c' };
  function specsFor(scene, root) {
    var S = {};
    var GRADE = { k: 'donut', t: '등급별 이벤트 비중', parts: [['Critical', CC.re, 2], ['Warning', CC.cy, 740], ['Normal', CC.gn, 174]] };
    var LOAD = { k: 'area', t: 'IT 부하 전력 추이', unit: 'kW', dec: 0, series: [['IT 부하', CC.cy, 1840, 40], ['냉방 부하', CC.bl, 820, 26]], lo: 0, hi: 2600 };
    var PUE = { k: 'gauge', t: 'PUE', unit: '', v: [1.42, 0.02], max: 2, c: CC.gn, dec: 2 };
    if (scene === 'main') {
      S['Event Log'] = [{ k: 'line', t: '시간대별 이벤트 추이', unit: '건', dec: 0, series: [['Warning', CC.cy, 8, 2], ['Critical', CC.re, 1, 0.6]], lo: 0, hi: 14 }, GRADE, { k: 'bar', t: '설비 구분별 이벤트', unit: '건', cats: ['UPS', '저압반', 'ATS', '발전기', '항온항습기', '분전반', '변압기'], vals: [6, 4, 2, 2, 5, 3, 2], max: 8, c: CC.bl }];
      S['Side Panel'] = [{ k: 'hbar', t: '층별 전력 사용량', unit: 'kW', cats: ['5F', '4F', '3F', '2F', '1F', 'B1F'], vals: [412, 468, 395, 520, 188, 260], max: 600, c: CC.cy }, LOAD, PUE];
      S['Popup/Alarm Message'] = [{ k: 'gauge', t: 'UPS-2B 부하율', unit: '%', v: [85, 1.2], max: 100, c: CC.or }, { k: 'line', t: 'UPS-2B 부하율 추이', unit: '%', dec: 0, series: [['부하율', CC.or, 82, 2]], lo: 50, hi: 100 }];
    } else if (scene === 'power' || scene === 'equipment' || scene === 'card' || scene === 'search' || scene === 'scenario') {
      S['Side Panel'] = [LOAD, { k: 'bar', t: '수전 계통별 부하', unit: 'kW', cats: ['HV-A', 'HV-B', 'MTR-A', 'MTR-B', 'GEN'], vals: [1260, 1180, 640, 610, 0], max: 1600, c: CC.bl }, PUE];
    } else if (scene === 'worker') {
      S['Widget/Daily Work Count'] = [{ k: 'bar', t: '층별 금일 작업', unit: '건', cats: ['RF', '5F', '4F', '3F', '2F', '1F', 'B1F'], vals: [0, 1, 2, 1, 1, 0, 2], max: 4, c: CC.cy }, { k: 'donut', t: '작업 상태', parts: [['진행중', CC.bl, 3], ['완료', CC.gn, 2], ['대기', CC.gr, 2]] }, { k: 'hbar', t: '작업 유형별 인원', unit: '명', cats: ['정기점검', '부품교체', '필터교체', '부하측정', '절연측정', '시운전'], vals: [5, 2, 2, 3, 4, 2], max: 6, c: CC.vi }];
    } else if (scene === 'asset') {
      S['Table'] = [{ k: 'donut', t: '분류별 자산 비중', parts: [['수변전설비', CC.bl, 118], ['UPS설비', CC.cy, 96], ['분전설비', CC.gn, 142], ['비상전원설비', CC.or, 38], ['저압배전설비', CC.vi, 61], ['동력설비', CC.ye, 28]] }, { k: 'bar', t: '층별 자산 수', unit: '대', cats: ['B1F', '01F', '02F', '03F', '04F', '05F'], vals: [86, 54, 112, 77, 92, 62], max: 120, c: CC.bl }];
    }
    return S;
  }
  function installChartSwap(root, st) {
    var savedAll = load(K_CHART), saved = savedAll[st.scene] || {};
    st.charts = {}; st.chartApply = {};
    var probe = document.createElement('i');
    probe.className = 'dc-probe';
    st.frame.appendChild(probe);
    var spec = specsFor(st.scene, root);
    Object.keys(spec).forEach(function (name) {
      var w = one(root, '[data-name="' + name + '"]');
      if (!w) return;
      var els = boxes(w);
      var r = unionRect(els, st);
      if (!r || r.w < 120 || r.h < 60) return;
      var top = name === 'Event Log' ? 50 : name === 'Side Panel' ? 76 : 34;
      var host = document.createElement('div');
      host.className = 'dc-chost';
      host.style.display = 'none';
      var mover = isContents(w) ? null : w;
      var hw = Math.max(100, r.w - 16), hh = Math.max(50, r.h - top - 8);
      if (name === 'Side Panel') hh = Math.min(hh, 300);
      /* 좁고 높은 칸(금일작업 건수)은 도넛이 높이로 커져 폭을 넘었다 — 높이를 폭 안으로 */
      if (name !== 'Event Log') hh = Math.min(hh, Math.round(hw * 0.9));
      host.style.width = hw + 'px'; host.style.height = hh + 'px';
      if (mover) { host.style.left = '8px'; host.style.top = top + 'px'; mover.appendChild(host); }
      else { host.style.left = (r.x + 8) + 'px'; host.style.top = (r.y + top) + 'px'; st.frame.appendChild(host); }
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dc-chartbtn';
      btn.innerHTML = KIND_ICON.bar.replace('class="ic"', 'class="ic" style="width:13px;height:11px"') + '차트';
      btn.title = '이 패널의 차트 바꾸기';
      var menu = document.createElement('div');
      menu.className = 'dc-chartmenu';
      var bx = mover ? r.w - 74 : r.x + r.w - 74, by = mover ? 8 : r.y + 8;
      btn.style.left = bx + 'px'; btn.style.top = by + 'px';
      menu.style.left = Math.max(0, bx - 190) + 'px'; menu.style.top = (by + 26) + 'px';
      (mover || st.frame).appendChild(btn); (mover || st.frame).appendChild(menu);
      /* 폭이 늘어나는 띠(이벤트 목록) 안이면 차트 칸 · 단추도 따라 늘고 옮긴다 */
      if (mover && r.w >= 1800) {
        var fitBar = function () { var ex = st.exW || 0; host.style.width = (hw + ex) + 'px'; btn.style.left = (bx + ex) + 'px'; menu.style.left = Math.max(0, bx + ex - 190) + 'px'; };
        st.onLayout.push(fitBar); fitBar();
      }
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
      /* 숨기는 것 — 제목 · 바탕 · 머리 띠는 남기고 내용만 */
      var KEEP = /^(Background|Title|Title Bar|Title Background|Header|Header Background|Section 1|Divider\/Title|Box)$/;
      function hideOrig(on) {
        var scope = mover ? kids(mover) : els;
        scope.forEach(function (c) {
          if (c === host || c === btn || c === menu) return;
          if (KEEP.test(nm(c))) return;
          if (name === 'Event Log' && nm(c) === 'Header') return;
          c.classList.toggle('dc-hid', on);
        });
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
        all(root, '.dc-chartmenu.open').forEach(function (m) { if (m !== menu) m.classList.remove('open'); });
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
      if (!mover) {
        w.__extra = (w.__extra || []).concat([host, btn, menu]);
        var fu = (st.units || []).filter(function (u) { return (u.kind === 'move' || u.kind === 'bar') && (u.el === w || u.el.contains(w)); })[0];
        if (fu) [host, btn, menu].forEach(function (b) { fu.els.push(b); b.classList.add('dc-place'); b.__fx = (st.exW || 0) * fu.ax; b.__fy = (st.exH || 0) * fu.ay; place(b); });
      }
    });
    syncChartHue(root, probe);
    st.timers.push(setInterval(function () { syncChartHue(root, probe); }, 1200));
    st.onDocDown = function (e) {
      if (e.target.closest && e.target.closest('.dc-chartmenu, .dc-chartbtn')) return;
      all(root, '.dc-chartmenu.open').forEach(function (m) { m.classList.remove('open'); });
    };
    document.addEventListener('pointerdown', st.onDocDown, true);
  }

  /* ══════════════════ 7. 패널 옮기기(패널편집) ══════════════════ */
  function installPanelMove(root, st) {
    var L = load(K_LAYOUT), me = L[st.scene] = L[st.scene] || {};
    me.free = me.free || {};
    function persist() { var a = load(K_LAYOUT); a[st.scene] = me; save(K_LAYOUT, a); }
    var MOVE = /^(Side Panel|Stage|Hint\/|Event Log|Popup\/|Widget\/|Overlay|Table|Side Menu|Button\/Integrated)/;
    var units = [];
    (st.units || []).forEach(function (u) {
      if (u.kind !== 'move' && u.kind !== 'bar') return;
      var n = u.el.classList.contains('sh-popmount') ? 'Popup' : u.name;
      /* 이름 있는 판 + 이름 없는 큰 판(메인 · 전력 옆 판, 조작 안내 — Figma 에서 이름 없는 묶음). 바탕 판 · 작은 글자 조각은 제외 */
      var big = u.r && u.r.w * u.r.h >= 40000 && !/Background$/.test(n);
      if (!MOVE.test(n) && !big && !u.el.classList.contains('sh-popmount')) return;
      units.push({ name: n + '#' + u.i, els: u.els.slice(), el: u.el });
    });
    units.forEach(function (x) {
      x.els = x.els.concat(x.el.__extra || []);
      x.els.forEach(function (e) { e.classList.add('dc-mv'); e.__unit = x; });
      var s = me.free[x.name];
      if (s) x.els.forEach(function (e) { e.__ux = s[0]; e.__uy = s[1]; place(e); });
    });
    var drag = null;
    st.onDown = function (e) {
      if (!layoutEditing(root) || e.button !== 0) return;
      if (e.target.closest('.dc-chartbtn, .dc-chartmenu, .dc-resetbtn')) return;
      if (e.target.closest('[contenteditable="true"]') && e.target.closest('p')) return;
      var w = e.target.closest('.dc-mv');
      if (!w || !root.contains(w) || !w.__unit) return;
      e.preventDefault(); e.stopPropagation();
      drag = { u: w.__unit, sx: e.clientX, sy: e.clientY, moved: false };
    };
    st.onMove = function (e) {
      if (!drag) return;
      var S = (st.frame.getBoundingClientRect().width / st.frame.offsetWidth) || st.S || 1;
      var dx = (e.clientX - drag.sx) / S, dy = (e.clientY - drag.sy) / S;
      if (!drag.moved) { if (Math.hypot(dx, dy) < 3) return; drag.moved = true; drag.u.els.forEach(function (x) { x.classList.add('dc-dragging'); }); }
      drag.u.els.forEach(function (x) { x.__dx = dx; x.__dy = dy; place(x); });
    };
    st.onUp = function () {
      if (!drag) return;
      var d = drag; drag = null;
      d.u.els.forEach(function (x) { x.classList.remove('dc-dragging'); });
      if (!d.moved) return;
      var snap = function (v) { return Math.round(v / 4) * 4; };
      var e0 = d.u.els[0];
      var ux = snap((e0.__ux || 0) + (e0.__dx || 0)), uy = snap((e0.__uy || 0) + (e0.__dy || 0));
      all(root, '.dc-front').forEach(function (x) { x.classList.remove('dc-front'); });
      d.u.els.forEach(function (x) { x.__ux = ux; x.__uy = uy; x.__dx = 0; x.__dy = 0; place(x); x.classList.toggle('dc-front', !!(ux || uy)); });
      me.free[d.u.name] = [ux, uy];
      persist();
    };
    root.addEventListener('pointerdown', st.onDown, true);
    window.addEventListener('pointermove', st.onMove);
    window.addEventListener('pointerup', st.onUp);
    window.addEventListener('pointercancel', st.onUp);
    st.onDragStart = function (e) { if (layoutEditing(root) && e.target.closest && e.target.closest('.dc-mv')) e.preventDefault(); };
    root.addEventListener('dragstart', st.onDragStart);
    st.resetLayout = function () {
      me = { free: {} };
      var a = load(K_LAYOUT); a[st.scene] = me; save(K_LAYOUT, a);
      units.forEach(function (x) { x.els.forEach(function (e) { e.__ux = 0; e.__uy = 0; place(e); e.classList.remove('dc-front'); }); });
      Object.keys(st.chartApply || {}).forEach(function (k) { st.chartApply[k](-1); });
    };
    var rb = document.createElement('button');
    rb.type = 'button';
    rb.className = 'dc-resetbtn';
    rb.textContent = '배치 초기화';
    rb.title = '패널 자리 · 바꾼 차트를 원본으로';
    st.frame.appendChild(rb);
    rb.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    rb.addEventListener('pointerup', function (e) { e.stopPropagation(); e.preventDefault(); st.resetLayout(); });
    st.onReset = function (e) { if (e.target.closest && e.target.closest('#layoutReset')) st.resetLayout(); };
    document.addEventListener('click', st.onReset, true);
  }

  /* ══════════════════ 살리기 ══════════════════ */
  var OVER = { 'dmc-mount': 'card', 'dme-mount': 'equipment', 'dms-mount': 'search', 'dmx-mount': 'scenario' };
  var SCENE_OF = { dmm: 'main', dmp: 'power', dmw: 'worker', dma: 'asset' };
  function sceneOf(root) {
    var m = /\b(dm[a-z])-root\b/.exec(root.className);
    var px = m ? m[1] : 'dmm', scene = SCENE_OF[px] || 'main', overlay = null;
    Object.keys(OVER).forEach(function (k) { if (!overlay && one(root, '.' + k)) { overlay = k; scene = OVER[k]; } });
    return { px: px, scene: scene, overlay: overlay };
  }
  function start(root, st) {
    var steps = [['fit', installFit], ['theme', installTheme], ['clock', installClock], ['recent', installRecent], ['nav', installNav], ['menu', installMenu], ['elog', installEventLog], ['controls', installControls], ['stage', installStageZoom], ['txtbtn', installTextButtons],
      ['fold', installFold], ['scroll', installScroll], ['jitter', installJitter], ['swap', installChartSwap], ['move', installPanelMove], ['poppass', installPopPass], ['tips', installTips]];
    steps.forEach(function (s) { try { s[1](root, st); } catch (e) { console.warn('[dc] ' + s[0], e); } });
    root.classList.add('dc-enter');
    st.timers.push(setTimeout(function () { root.classList.remove('dc-enter'); }, 1600));
  }
  function initDatacenter(root) {
    if (!root || root.__dc) return;
    injectStyle();
    root.classList.add('dc-root');
    var so = sceneOf(root);
    var st = root.__dc = { timers: [], scene: so.scene, px: so.px, overlay: so.overlay, onLayout: [] };
    if (/[?&]edit=1/.test(location.search)) root.classList.add('dc-edit-layout');
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
  function disposeDatacenter(root) {
    var st = root && root.__dc;
    if (!st) return;
    if (st.wait) st.wait.disconnect();
    st.timers.forEach(function (t) { clearInterval(t); clearTimeout(t); });
    clearTimeout(st.feed); clearTimeout(st.toastT);
    if (st.ro) st.ro.disconnect();
    if (st.mo) st.mo.disconnect();
    if (st.onResize) window.removeEventListener('resize', st.onResize);
    Object.keys(st.charts || {}).forEach(function (k) { st.charts[k].dispose(); });
    if (st.onDocDown) document.removeEventListener('pointerdown', st.onDocDown, true);
    if (st.onDown) root.removeEventListener('pointerdown', st.onDown, true);
    if (st.onMove) window.removeEventListener('pointermove', st.onMove);
    if (st.onUp) { window.removeEventListener('pointerup', st.onUp); window.removeEventListener('pointercancel', st.onUp); }
    if (st.onDragStart) root.removeEventListener('dragstart', st.onDragStart);
    if (st.onReset) document.removeEventListener('click', st.onReset, true);
    if (st.onTipOver) { root.removeEventListener('pointerover', st.onTipOver); root.removeEventListener('pointermove', st.onTipMove); root.removeEventListener('pointerleave', st.onTipOut); root.removeEventListener('pointerdown', st.onTipOut); }
    if (st.tipEl) st.tipEl.remove();
    root.__dc = null;
  }
  window.initDatacenter = initDatacenter;
  window.disposeDatacenter = disposeDatacenter;
})();
