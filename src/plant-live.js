/* 공장 전력설비 디지털 트윈 — 재구축 화면(Screen/Facility Overview)의 인터랙션 · 라이브 · 반응형 레이어.
   window.initPlant(root) / window.disposePlant(root)

   화면(DOM·CSS)은 생성기(src/plant/_gen/conv.js)가 Figma(hHans6kNFlTP98CO1O431o) 그대로 만든다.
   이 파일은 그 위에 '움직이는 것'만 얹는다 — 정지 상태(?live=0) = Figma 원본.

   · 반응형 — 1920x1080 좌표계 + 균일 배율 S. 남는 폭은 헤더 · 경보 목록이, 남는 높이는 목록 줄과 바탕 사진이 나눠 갖는다. 정확히 16:9 면 Figma 와 같다.
   · 실시간 시계 · 열 때마다 최근 시각(경보 일시 — 줄 사이 간격은 원본 그대로)
   · 마우스 오버 · 눌림(메뉴 · 아이콘 · 말풍선 · 등급 칩 · 트리 · 전기실 · 표 줄 · 접기 단추)
   · 접기 — 세 패널의 Fold Button
   · 라이브 — 새 경보가 맨 위로 들어오고 등급 숫자가 따라 오른다. 이 시안에는 차트가 없어 바꿔 넣은 차트가 실시간으로 움직인다. 사람이 고친 글자는 덮지 않는다.
   · 차트 바꾸기(패널편집 중) — 패널마다 이 프로젝트(전력설비)에 맞춘 추천 차트. 첫 항목 = 추천, '원본 그대로'로 되돌린다.
   · 패널 옮기기(패널편집 중) — 왼쪽 · 오른쪽 · 위 · 아래 자리에 놓으면 나머지가 흘러 빈틈 없이 다시 앉는다.

   손으로 쓴 파일이다(생성물 아님). 고친 뒤 js/core/tpl-modules.js 의 ?v= 를 올릴 것. */
(function () {
  'use strict';

  var BASE_W = 1920, BASE_H = 1080;
  var K_LAYOUT = 'wemb-plant-layout', K_CHART = 'wemb-plant-chart', K_FOLD = 'wemb-plant-fold';
  var STYLE_ID = 'plant-live-style';
  var EASE = 'cubic-bezier(.22,.8,.24,1)';

  /* ══════════════════ 스타일 ══════════════════ */
  var CSS = [
    '.pf-root{--pf-acc:72,176,229;--pf-hi:0,255,255;overflow:clip!important;}',
    '.pf-root [data-name^="Screen/"]{background:transparent!important;}',
    /* Figma GROUP(display:contents)을 화면 크기 투명 층으로 세운다 — 안쪽 좌표는 그대로라 그림이 같다 */
    '.pf-root .pf-wl{display:block!important;position:absolute!important;left:0!important;top:0!important;right:auto!important;bottom:auto!important;margin:0!important;width:1920px;height:1080px;pointer-events:none;translate:calc(var(--pf-tx,0px) + var(--pf-dx,0px)) calc(var(--pf-ty,0px) + var(--pf-dy,0px));}',
    '.pf-root .pf-wl > *{pointer-events:auto;}',
    '.pf-root [data-name="Callouts"].pf-wl{transform-origin:0 0;}',
    '.pf-root.pf-live .pf-wl{transition:translate .55s ' + EASE + ';}',
    '.pf-root.pf-live .pf-anim{transition:width .55s ' + EASE + ',height .55s ' + EASE + ',left .55s ' + EASE + ',translate .55s ' + EASE + ',opacity .3s ease;}',
    '.pf-root.pf-resizing *,.pf-root .pf-dragging,.pf-root .pf-dragging *{transition:none!important;}',
    '.pf-root .pf-probe{position:absolute;width:0;height:0;overflow:hidden;color:#48b0e5;}',

    /* ── '여기 눌린다' ── */
    '.pf-root .pf-click{cursor:pointer;}',
    '.pf-root .pf-click *{cursor:inherit;}',
    '.dt-content-editing .pf-root .pf-click,.dt-content-editing .pf-root .pf-click *{cursor:text;}',
    '.pf-root .pf-click:focus-visible{outline:2px solid rgb(var(--pf-acc));outline-offset:2px;}',

    /* 헤더 메뉴 */
    '.pf-root [data-name^="Nav Item/"]{transition:translate .2s ease,filter .2s ease;}',
    '.pf-root [data-name^="Nav Item/"]:hover{translate:0 -1px;filter:brightness(1.15) drop-shadow(0 0 8px rgba(0,253,254,.45));}',
    '.pf-root [data-name^="Nav Item/"]:active{translate:0 1px;}',
    /* 헤더 아이콘 */
    '.pf-root [data-name^="Icon/Action/User"],.pf-root [data-name^="Icon/Action/Logout"]{transition:scale .2s ease,filter .2s ease;}',
    '.pf-root [data-name^="Icon/Action/User"]:hover,.pf-root [data-name^="Icon/Action/Logout"]:hover{scale:1.16;filter:brightness(1.35) drop-shadow(0 0 6px rgba(var(--pf-acc),.8));}',
    /* 로고 빛 · 안내문 — 천천히 숨쉰다 */
    '.pf-root [data-name="Glow 6"],.pf-root [data-name="Glow 10"]{animation:pfGlow 4.6s ease-in-out infinite;}',
    '@keyframes pfGlow{0%,100%{opacity:1;}50%{opacity:.62;}}',
    '.pf-root [data-name="Ticker"] > [data-name="Background"]{transition:filter .25s ease;}',
    '.pf-root [data-name="Ticker"]:hover > [data-name="Background"]{filter:brightness(1.2);}',
    /* 티커 — 띠 모양 안을 지나가는 빛줄기(원본 그림을 마스크로 써서 띠 밖으로 안 샌다) · 테두리 빛 숨쉬기 · 문구가 흘러 바뀐다 */
    '.pf-root .pf-tk-holder{animation:pfTkGlow 3.8s ease-in-out infinite;}',
    '@keyframes pfTkGlow{0%,100%{filter:drop-shadow(0 0 0 rgba(0,170,255,0));}50%{filter:drop-shadow(0 0 9px rgba(0,180,255,.5));}}',
    '.pf-root .pf-tk-shine{position:absolute;inset:0;pointer-events:none;-webkit-mask-size:100% 100%;mask-size:100% 100%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;'
      + 'background:linear-gradient(100deg,rgba(255,255,255,0) 0%,rgba(255,255,255,.16) 38%,rgba(170,240,255,.5) 50%,rgba(255,255,255,.16) 62%,rgba(255,255,255,0) 100%) no-repeat;'
      + 'background-size:22% 100%;background-position:-30% 0;mix-blend-mode:screen;animation:pfTkShine 6s cubic-bezier(.45,.05,.35,1) infinite;}',
    '@keyframes pfTkShine{0%{background-position:-30% 0;}42%,100%{background-position:130% 0;}}',
    '.pf-root .pf-tk-win{position:absolute;overflow:hidden;pointer-events:none;'
      + '-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 9%,#000 91%,transparent 100%);mask-image:linear-gradient(90deg,transparent 0,#000 9%,#000 91%,transparent 100%);}',
    '.pf-root .pf-tk-win > p{pointer-events:auto;will-change:transform;}',
    '.pf-root .pf-tk-win > p.pf-tk-move{transition:transform .9s cubic-bezier(.55,0,.35,1),opacity .9s ease;}',
    '.pf-root .pf-tk-win > p.pf-tk-cr{color:#f68989!important;}',
    '.pf-root .pf-tk-win > p.pf-tk-ma{color:#fcb267!important;}',
    '.pf-root .pf-tk-win > p.pf-tk-mi{color:#fce380!important;}',
    '.pf-root .pf-tk-win > p.pf-tk-wa{color:#29e2ff!important;}',
    /* 말풍선 — 이끎선 끝이 숨쉬고, 올리면 떠오른다 */
    '.pf-root svg [data-name="Marker"]{transform-box:fill-box;transform-origin:center;animation:pfPulse 2.6s ease-in-out infinite;}',
    '@keyframes pfPulse{0%,100%{transform:scale(1);}50%{transform:scale(1.14);}}',
    '.pf-root [data-name^="Callout/"] [data-name="Tag"] > *{transition:translate .22s ' + EASE + ',filter .22s ease;}',
    '.pf-root [data-name^="Callout/"] [data-name="Label"] > *,.pf-root [data-name^="Callout/"] [data-name="Badge"]{transition:translate .22s ' + EASE + ',filter .22s ease;}',
    '.pf-root [data-name^="Callout/"].pf-hot [data-name="Label"] > *,.pf-root [data-name^="Callout/"].pf-hot [data-name="Badge"]{translate:0 -3px;filter:brightness(1.25) drop-shadow(0 4px 10px rgba(0,253,254,.5));}',
    '.pf-root [data-name^="Callout/"].pf-on [data-name="Badge"]{filter:brightness(1.2) drop-shadow(0 0 8px rgba(0,253,254,.75));}',
    '.pf-root [data-name="Chip/Floor Level"] > *{transition:translate .22s ' + EASE + ',filter .22s ease;}',
    '.pf-root [data-name="Chip/Floor Level"].pf-hot > *{translate:0 -3px;filter:brightness(1.2);}',
    /* 등급 칩 */
    '.pf-root [data-name^="Count/"]{transition:translate .18s ease,filter .18s ease;}',
    '.pf-root [data-name^="Count/"]:hover{translate:0 -1px;filter:brightness(1.25) drop-shadow(0 0 6px rgba(69,197,255,.55));}',
    '.pf-root [data-name^="Count/"]:active{translate:0 1px;}',
    '.pf-root .pf-tick{animation:pfTick .6s ease;}',
    '@keyframes pfTick{from{filter:brightness(1.9);}to{filter:none;}}',
    '.pf-root [data-name="Value"]{font-variant-numeric:tabular-nums;}',
    /* 트리 · 전기실 */
    '.pf-root [data-name^="Tree Item/"]{transition:background-color .18s ease,translate .5s ' + EASE + ';}',
    '.pf-root [data-name^="Tree Item/"]:hover{background-color:rgba(72,150,214,.72)!important;}',
    '.pf-root [data-name="Sub List"],.pf-root [data-name="Branch Line"]{transition:translate .5s ' + EASE + ';}',
    '.pf-root [data-name^="Sub Item/"]{transition:translate .18s ease,filter .18s ease;}',
    '.pf-root [data-name^="Sub Item/"]:hover{translate:3px 0;filter:brightness(1.3);}',
    '.pf-root [data-name^="Option/"]{transition:translate .18s ease,filter .18s ease;}',
    '.pf-root [data-name^="Option/"]:hover{translate:3px 0;filter:brightness(1.25);}',
    '.pf-root .pf-sel p{color:#0ff!important;}',
    '.pf-root .pf-unsel p{color:#f8f8f8!important;}',
    /* 표 */
    '.pf-root [data-name^="Row/"]{transition:background-color .16s ease;}',
    '.pf-root [data-name^="Row/"]:hover{background-color:rgba(var(--pf-acc),.16);}',
    '.pf-root [data-name^="Row/"].pf-rowsel{background-color:rgba(var(--pf-acc),.28);}',
    '.pf-root [data-name^="Row/"].pf-empty{visibility:hidden;}',
    '.pf-root [data-name^="Row/"].pf-new{animation:pfNew 1.3s ease;}',
    '@keyframes pfNew{from{background-color:rgba(0,253,254,.42);}to{background-color:transparent;}}',
    '.pf-root [data-name="Table/Event List"] [data-name^="Row/"]{cursor:pointer;}',
    /* 줄 전체를 덮는 묶음이 아래 단추의 클릭을 가로채지 않게 — 안의 칩 · 메뉴만 받는다 */
    '.pf-root [data-name="Widget/Event List"] > [data-name="Header"],.pf-root [data-name="Nav Bar"]{pointer-events:none;}',
    '.pf-root [data-name="Widget/Event List"] > [data-name="Header"] > *,.pf-root [data-name="Nav Bar"] > *{pointer-events:auto;}',
    /* 접기 단추 */
    '.pf-root [data-name="Fold Button"],.pf-root [data-node-id="13:801"]{transition:filter .18s ease,scale .45s ' + EASE + ',translate .45s ' + EASE + ';cursor:pointer;}',
    '.pf-root [data-name="Fold Button"]:hover,.pf-root [data-node-id="13:801"]:hover{filter:brightness(1.35) drop-shadow(0 0 7px rgba(118,208,252,.8));}',
    '.pf-root .pf-folded [data-node-id="7:351"]{scale:1 -1;}',
    '.pf-root .pf-folded [data-node-id="13:801"],.pf-root .pf-folded [data-node-id="13:893"] [data-name="Icon/Action/Fold"]{scale:-1 1;}',
    '.pf-root [data-node-id="13:893"] [data-name="Icon/Action/Fold"]{transition:scale .45s ' + EASE + ';}',
    '.pf-root [data-name="Widget/Room Selector"].pf-folded > [data-name="Body"],.pf-root [data-name="Widget/Equipment Status"].pf-folded > :not([data-node-id="13:801"]){opacity:0;pointer-events:none;}',
    '.pf-root [data-name="Widget/Equipment Status"] > *{transition:opacity .3s ease;}',
    /* 자리를 바꾸면 접기 단추가 바깥쪽으로 — 오른쪽의 전기실 패널 · 왼쪽의 설비 패널 */
    '.pf-root .pf-flip [data-node-id="13:893"]{translate:-274px 0;scale:-1 1;}',
    '.pf-root .pf-flip[data-name="Widget/Equipment Status"] [data-node-id="13:801"]{translate:220.5px 0;scale:-1 1;}',
    '.pf-root .pf-flip.pf-folded[data-name="Widget/Equipment Status"] [data-node-id="13:801"]{scale:1 1;}',

    /* ── 패널편집 — 옮기기 ── */
    '.dt-editing .pf-root .pf-mv > *,.dt-editing .pf-root .pf-mv > * *,.pf-root.pf-edit-layout .pf-mv > *,.pf-root.pf-edit-layout .pf-mv > * *{cursor:grab!important;}',
    '.dt-editing .pf-root .pf-mv:hover > [data-name="Card BG"],.dt-editing .pf-root .pf-mv:hover > [data-name="Body"],.pf-root.pf-edit-layout .pf-mv:hover > [data-name="Card BG"],.pf-root.pf-edit-layout .pf-mv:hover > [data-name="Body"]{outline:1px dashed rgba(var(--pf-acc),.95);outline-offset:3px;}',
    '.dt-content-editing .pf-root p[contenteditable="true"]{cursor:text!important;}',
    '.dt-content-editing .pf-root p[contenteditable="true"]:hover{outline:1px dashed rgba(var(--pf-acc),.8);outline-offset:1px;}',
    '.dt-content-editing .pf-root p[contenteditable="true"]:focus{outline:1px solid rgb(var(--pf-acc));outline-offset:1px;}',
    '.pf-root .pf-mv.pf-dragging{z-index:30;filter:drop-shadow(0 14px 22px rgba(0,0,0,.5));}',
    '.pf-root .pf-ghost{position:absolute;z-index:4;border:2px dashed rgba(var(--pf-acc),.9);background:rgba(var(--pf-acc),.1);pointer-events:none;transition:left .22s ' + EASE + ',top .22s ' + EASE + ',width .22s ' + EASE + ',height .22s ' + EASE + ';}',
    '.pf-root .pf-resetbtn{position:absolute;left:190px;top:84px;z-index:45;display:none;height:26px;padding:0 10px;border:1px solid rgb(var(--pf-acc));background:#102a48;color:#e6f7ff;font:500 12px/1 "Pretendard Variable",Pretendard,system-ui,sans-serif;cursor:pointer!important;white-space:nowrap;}',
    '.pf-root .pf-resetbtn:hover{filter:brightness(1.25);box-shadow:0 0 12px rgba(var(--pf-acc),.6);}',
    '.dt-editing .pf-root .pf-resetbtn,.pf-root.pf-edit-layout .pf-resetbtn{display:block;}',
    '.pf-root[data-theme="light"] .pf-resetbtn{background:#fff;color:#10324d;}',
    '.dt-editing .pf-root [data-name]{animation-play-state:paused!important;}',

    /* ── 패널편집 — 차트 바꾸기(우리은행과 같은 판) ── */
    '.pf-root .pf-chost{position:absolute;z-index:6;pointer-events:none;}',
    '.pf-root .pf-chost > *{pointer-events:auto;}',
    '.pf-root .pf-swap-hide{visibility:hidden!important;}',
    '.pf-root .pf-chartbtn{position:absolute;top:-11px;right:14px;z-index:25;display:none;align-items:center;gap:4px;height:22px;padding:0 9px;border:1px solid rgb(var(--pf-acc));background:#06264a;color:#e6f7ff;font:500 12px/1 Pretendard,system-ui,sans-serif;cursor:pointer;white-space:nowrap;}',
    '.pf-root .pf-chartbtn:hover{filter:brightness(1.25);box-shadow:0 0 12px rgba(var(--pf-acc),.6);}',
    '.dt-editing .pf-root .pf-chartbtn,.dt-content-editing .pf-root .pf-chartbtn,.pf-root.pf-edit-layout .pf-chartbtn{display:inline-flex;}',
    '.pf-root .pf-chartmenu{position:absolute;top:14px;right:14px;z-index:40;min-width:208px;padding:5px;border:1px solid #2a7ca0;background:#071a30;color:#c7ecf4;font:400 13px/1.35 Pretendard,system-ui,sans-serif;box-shadow:0 12px 28px rgba(0,0,0,.5);opacity:0;translate:0 -4px;pointer-events:none!important;transition:opacity .16s ease,translate .16s ease;}',
    '.pf-root .pf-chartmenu.open{opacity:1;translate:0 0;pointer-events:auto!important;}',
    '.pf-root .pf-chartmenu .hd{padding:4px 8px 6px;font-size:11px;color:#8ea6b3;white-space:nowrap;}',
    '.pf-root .pf-chartmenu button{display:flex;align-items:center;gap:8px;width:100%;padding:6px 8px;border:0;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer!important;white-space:nowrap;}',
    '.pf-root .pf-chartmenu button:hover{background:rgba(var(--pf-acc),.14);color:#fff;}',
    '.pf-root .pf-chartmenu button.cur{background:rgba(9,182,251,.26);color:#fff;}',
    '.pf-root .pf-chartmenu .ic{width:18px;height:14px;flex:none;}',
    '.pf-root .pf-chartmenu .rec{margin-left:auto;padding:1px 6px;background:rgb(var(--pf-acc));color:#03202e;font-size:10px;font-weight:700;}',
    '.pf-root .pf-chartmenu .sep{height:1px;margin:4px 2px;background:rgba(199,236,244,.16);}',
    '.pf-root .pf-chart{position:absolute;inset:0;display:flex;flex-direction:column;padding:10px 14px 8px;background:linear-gradient(180deg,rgba(14,32,54,.97),rgba(12,26,46,.97));box-shadow:inset 0 0 0 1px rgba(42,124,160,.75);color:#c7ecf4;font:400 12px/1.3 Pretendard,system-ui,sans-serif;animation:pfIn .35s ease;}',
    '.pf-root .pf-chart .pl,.pf-root .pf-chart .lg,.pf-root .pf-chart .ct i,.pf-root .pf-chart .ct b{filter:hue-rotate(var(--pf-chue,0deg));}',
    '.pf-root .pf-chart .ct{display:flex;align-items:center;gap:6px;font-weight:500;font-size:15px;color:#fff;white-space:nowrap;}',
    '.pf-root .pf-chart .ct i{display:block;width:8px;height:8px;background:#2a7ca0;flex:none;}',
    '.pf-root .pf-chart .ct b{margin-left:auto;font-family:Tomorrow,Pretendard,sans-serif;font-weight:400;font-size:18px;color:#00ffd2;}',
    '.pf-root .pf-chart .ct b small{font:400 11px Pretendard,sans-serif;color:#8ea6b3;margin-left:3px;}',
    '.pf-root .pf-chart .lg{display:flex;gap:10px;margin-top:3px;font-size:11px;color:#8ea6b3;white-space:nowrap;}',
    '.pf-root .pf-chart .lg span{display:inline-flex;align-items:center;gap:4px;}',
    '.pf-root .pf-chart .lg span:before{content:"";width:9px;height:3px;background:var(--c);}',
    '.pf-root .pf-chart .pl{position:relative;flex:1;min-height:0;margin-top:6px;}',
    '.pf-root .pf-chart svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;}',
    '.pf-root .pf-chart .ax{fill:#8ea6b3;font-size:11px;font-family:Pretendard,system-ui,sans-serif;}',
    '.pf-root .pf-chart .gl{stroke:rgba(142,166,179,.16);stroke-width:1;shape-rendering:crispEdges;}',
    '.pf-root .pf-chart .bars{position:absolute;inset:0 0 16px;display:flex;align-items:flex-end;justify-content:space-around;gap:8px;}',
    '.pf-root .pf-chart .bars > div{position:relative;flex:1;max-width:34px;height:100%;display:flex;align-items:flex-end;}',
    '.pf-root .pf-chart .bars i{display:block;width:100%;background:linear-gradient(180deg,var(--c),rgba(9,182,251,.18));transition:height .9s ' + EASE + ';}',
    '.pf-root .pf-chart .bars em{position:absolute;left:50%;translate:-50% 0;bottom:calc(var(--h) + 2px);font-style:normal;font-size:11px;color:#e6f7ff;white-space:nowrap;transition:bottom .9s ' + EASE + ';}',
    '.pf-root .pf-chart .bars u{position:absolute;left:50%;translate:-50% 0;bottom:-16px;text-decoration:none;font-size:11px;color:#8ea6b3;white-space:nowrap;}',
    '.pf-root .pf-chart .hb{display:flex;flex-direction:column;justify-content:space-around;height:100%;gap:3px;}',
    '.pf-root .pf-chart .hb > div{display:grid;grid-template-columns:72px 1fr 50px;align-items:center;gap:8px;font-size:12px;}',
    '.pf-root .pf-chart .hb s{position:relative;display:block;height:8px;background:rgba(142,166,179,.16);overflow:hidden;text-decoration:none;}',
    '.pf-root .pf-chart .hb s i{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,rgba(9,182,251,.5),var(--c));transition:width .9s ' + EASE + ';}',
    '.pf-root .pf-chart .hb b{text-align:right;color:#fff;font-weight:500;font-variant-numeric:tabular-nums;}',
    '.pf-root .pf-chart .arc{transition:stroke-dasharray .9s ' + EASE + ',stroke-dashoffset .9s ' + EASE + ';}',
    '.pf-root .pf-chart .gv{position:absolute;left:0;right:0;bottom:0;text-align:center;font-family:Tomorrow,Pretendard,sans-serif;font-size:22px;color:#00ffd2;}',
    '.pf-root .pf-chart .gv small{font:400 12px Pretendard,sans-serif;color:#8ea6b3;margin-left:2px;}',
    '.pf-root .pf-chart .dn{display:flex;align-items:center;gap:16px;height:100%;}',
    '.pf-root .pf-chart .dn .ring{position:relative;height:100%;aspect-ratio:1;flex:none;}',
    '.pf-root .pf-chart .dn .ring b{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Tomorrow,Pretendard,sans-serif;font-weight:400;font-size:17px;color:#fff;}',
    '.pf-root .pf-chart .dn .ring b small{font:400 10px Pretendard,sans-serif;color:#8ea6b3;}',
    '.pf-root .pf-chart .dn ul{list-style:none;display:flex;flex-direction:column;gap:4px;font-size:12px;min-width:0;flex:1;}',
    '.pf-root .pf-chart .dn li{display:flex;align-items:center;gap:6px;white-space:nowrap;}',
    '.pf-root .pf-chart .dn li:before{content:"";width:9px;height:3px;background:var(--c);flex:none;}',
    '.pf-root .pf-chart .dn li b{margin-left:auto;color:#fff;font-weight:500;font-variant-numeric:tabular-nums;}',
    '.pf-root[data-theme="light"] .pf-chartbtn{background:#fff;color:#06365c;}',
    '.pf-root[data-theme="light"] .pf-chartmenu{background:#fff;color:#20405a;border-color:#9dbdd2;box-shadow:0 12px 28px rgba(30,60,100,.25);}',
    '.pf-root[data-theme="light"] .pf-chartmenu button:hover{background:rgba(0,112,178,.1);color:#06365c;}',
    '.pf-root[data-theme="light"] .pf-chartmenu button.cur{background:rgba(0,112,178,.16);color:#06365c;}',
    '.pf-root[data-theme="light"] .pf-chart{background:#fff;box-shadow:inset 0 0 0 1px #c5d9e6;color:#20405a;}',
    '.pf-root[data-theme="light"] .pf-chart .ct{color:#0e2c47;}',
    '.pf-root[data-theme="light"] .pf-chart .ct b,.pf-root[data-theme="light"] .pf-chart .gv{color:#00786a;}',
    '.pf-root[data-theme="light"] .pf-chart .lg,.pf-root[data-theme="light"] .pf-chart .bars u,.pf-root[data-theme="light"] .pf-chart .ct b small,.pf-root[data-theme="light"] .pf-chart .gv small,.pf-root[data-theme="light"] .pf-chart .dn .ring b small{color:#55707f;}',
    '.pf-root[data-theme="light"] .pf-chart .ax{fill:#55707f;}',
    '.pf-root[data-theme="light"] .pf-chart .gl{stroke:rgba(40,80,110,.14);}',
    '.pf-root[data-theme="light"] .pf-chart .bars em,.pf-root[data-theme="light"] .pf-chart .hb b,.pf-root[data-theme="light"] .pf-chart .dn li b,.pf-root[data-theme="light"] .pf-chart .dn .ring b{color:#0e2c47;}',
    '.pf-root[data-theme="light"] .pf-chart .hb s{background:rgba(40,80,110,.1);}',
    '@keyframes pfIn{from{opacity:0;}to{opacity:1;}}',
    '@media (prefers-reduced-motion:reduce){.pf-root *{animation:none!important;}}',

    /* ══ 라이트 테마 ══ 형상은 그대로, 판 · 글자 · 빛만 밝은 판에 맞게(mk-light-plant.js · mk-screen-css.js 와 짝) */
    '.pf-root[data-theme="light"]{--pf-acc:43,110,168;--pf-hi:0,112,138;}',
    '.pf-root[data-theme="light"] .pf-sel p{color:#00708a!important;}',
    '.pf-root[data-theme="light"] .pf-unsel p{color:#10324d!important;}',
    '.pf-root[data-theme="light"] [data-name^="Tree Item/"]:hover{background-color:rgba(160,205,240,.95)!important;}',
    '.pf-root[data-theme="light"] [data-name^="Nav Item/"]:hover{filter:brightness(1.02) drop-shadow(0 2px 6px rgba(20,70,120,.35));}',
    '.pf-root[data-theme="light"] [data-name^="Nav Item/"].pf-navon p{color:#fff!important;}',
    '.pf-root[data-theme="light"] [data-name^="Nav Item/"]:not(.pf-navon) p{color:#10324d!important;}',
    '.pf-root[data-theme="light"] [data-name^="Count/"]:hover{filter:brightness(1.02) drop-shadow(0 2px 5px rgba(20,70,120,.3));}',
    '.pf-root[data-theme="light"] [data-name="Fold Button"]:hover,.pf-root[data-theme="light"] [data-node-id="13:801"]:hover{filter:brightness(1.02) drop-shadow(0 2px 6px rgba(20,70,120,.4));}',
    '.pf-root[data-theme="light"] [data-name^="Callout/"].pf-hot [data-name="Label"] > *,.pf-root[data-theme="light"] [data-name^="Callout/"].pf-hot [data-name="Badge"]{filter:drop-shadow(0 4px 8px rgba(20,70,120,.4));}',
    '.pf-root[data-theme="light"] svg [data-name="Line"]{stroke:#10324d;}',
    /* 티커 — 흰 띠에서는 빛줄기를 푸른 그림자처럼, 등급 글자는 짙게 */
    '.pf-root[data-theme="light"] .pf-tk-shine{mix-blend-mode:multiply;background-image:linear-gradient(100deg,rgba(72,176,229,0) 0%,rgba(72,176,229,.14) 38%,rgba(43,110,168,.32) 50%,rgba(72,176,229,.14) 62%,rgba(72,176,229,0) 100%);}',
    '@keyframes pfTkGlowLt{0%,100%{filter:drop-shadow(0 0 0 rgba(20,90,150,0));}50%{filter:drop-shadow(0 2px 8px rgba(20,90,150,.35));}}',
    '.pf-root[data-theme="light"] .pf-tk-holder{animation-name:pfTkGlowLt;}',
    '.pf-root[data-theme="light"] .pf-tk-win > p.pf-tk-cr{color:#c21f1f!important;}',
    '.pf-root[data-theme="light"] .pf-tk-win > p.pf-tk-ma{color:#b35400!important;}',
    '.pf-root[data-theme="light"] .pf-tk-win > p.pf-tk-mi{color:#8a6a00!important;}',
    '.pf-root[data-theme="light"] .pf-tk-win > p.pf-tk-wa{color:#00708a!important;}',
  ].join('\n');
  window.PLANT_LIVE_CSS = CSS;

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
  function kid(el, name) { return Array.prototype.filter.call(el.children, function (c) { return c.getAttribute('data-name') === name; })[0]; }
  function editing() { return !!document.querySelector('.dtstage.dt-content-editing, .dtstage.dt-editing, .pf-root.pf-edit-layout'); }
  function layoutEditing(root) { return !!(root.closest('.dt-editing') || root.classList.contains('pf-edit-layout')); }
  function idle() { return typeof window.__wembIdle === 'function' ? window.__wembIdle() : document.hidden; }
  function load(k) { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function comma(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  /* 그림 갈아 끼우기 — 폴더는 그대로, 파일 이름만. TPLTINT 가 칠한 그림은 원본 주소를 __origSrc 로 들고 있다 */
  function swapSrc(img, file) {
    /* 레이어(Background · Marker)는 <div> 이고 그림은 그 안의 <img> 다 */
    if (img && img.tagName !== 'IMG') img = img.querySelector('img');
    if (!img) return;
    var cur = img.__origSrc || img.getAttribute('src') || '';
    var next = cur.replace(/[^/]+$/, file);
    if (cur === next) return;
    if (img.__origSrc) img.__origSrc = next;
    img.setAttribute('src', next);
  }

  function clickable(el, title, fn) {
    if (!el) return;
    el.classList.add('pf-click');
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    if (title) el.setAttribute('title', title);
    if (fn) {
      el.addEventListener('click', function (e) { if (editing()) return; fn(e); });
      el.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && !editing()) { e.preventDefault(); fn(e); } });
    }
  }
  /* 라이브가 쓴 값과 지금 글자가 다르면 사람이 고친 것 — 덮지 않는다 */
  function claimed(p) { return p.__pfLast != null && p.textContent !== p.__pfLast; }
  function write(p, s, flash) {
    if (!p || claimed(p)) return;
    p.__pfLast = s;
    if (p.textContent === s) return;
    p.textContent = s;
    p.__pfLast = p.textContent;
    if (flash) { p.classList.remove('pf-tick'); void p.offsetWidth; p.classList.add('pf-tick'); }
  }
  function frameOf(root) { return root.querySelector(':scope > [data-name^="Screen/"]'); }
  function lift(el) { if (el) el.classList.add('pf-wl'); return el; }
  function setT(el, x, y) {
    el.style.setProperty('--pf-tx', x.toFixed(2) + 'px');
    el.style.setProperty('--pf-ty', y.toFixed(2) + 'px');
  }

  /* ══════════════════ 1. 반응형 · 자리 ══════════════════
     배율 S 로 1920x1080 을 키우고, 남는 몫 exW · exH 는 — 헤더는 폭으로, 목록은 폭 · 줄 수로, 사진은 cover 로 받는다.
     사진이 커지는 만큼 말풍선 층도 같은 비율로 움직여 이끎선 끝이 건물에서 안 떨어진다.
     패널 자리는 st.lay — room · equip: dock(left/right) + 그 안의 차례, event: dock(bottom/top). */
  var EV_FOLD = 193.23;              /* 목록을 접을 때 제목 띠만 남기려고 내리는 거리(1056 - 862.77) */
  var ROOM_W = 250, EQUIP_W = 250, COL_GAP = 36;

  function dockSlots(st, name) {
    /* 같은 쪽에 둘이면 가장자리부터 나란히 — 세로로 쌓으면 목록과 겹친다 */
    var L = st.lay, order = L.order[L[name]];
    var i = Math.max(0, order.indexOf(name));
    var w = name === 'room' ? ROOM_W : EQUIP_W;
    return L[name] === 'left' ? 30 + i * (ROOM_W + COL_GAP) : 1890 + st.exW - w - i * (EQUIP_W + COL_GAP);
  }
  function placeAll(st) {
    var L = st.lay;
    /* 경보 목록 */
    var evTop = L.event === 'top';
    var evH = 230 + st.evExtra;      /* 띠 + 본문 */
    var evTy = evTop ? (120 - 826) : (st.exH - st.evExtra);
    if (st.fold.event) evTy = evTop ? evTy - evH - 12 : evTy + EV_FOLD + st.evExtra;
    setT(st.ev, 0, evTy);
    /* 옆 패널 — 목록을 위로 올리면 그 아래로 */
    var py = evTop && !st.fold.event ? (120 + evH + 14) - 220 : 0;
    var rx = dockSlots(st, 'room'), ex = dockSlots(st, 'equip');
    var rTx = rx - 30, eTx = ex - 1640;
    if (st.fold.room) rTx += L.room === 'left' ? -280 : (1920 + st.exW - rx - 25 + 0);
    if (st.fold.equip) eTx += L.equip === 'right' ? 251 + (1890 + st.exW - ex - 250) : -(ex + 216);
    setT(st.room, rTx, py);
    setT(st.equip, eTx, py);
    st.room.classList.toggle('pf-flip', L.room === 'right');
    st.equip.classList.toggle('pf-flip', L.equip === 'left');
    st.ev.classList.toggle('pf-folded', !!st.fold.event);
    st.room.classList.toggle('pf-folded', !!st.fold.room);
    st.equip.classList.toggle('pf-folded', !!st.fold.equip);
  }
  function installFit(root, st) {
    var frame = frameOf(root);
    frame.style.position = 'absolute';
    frame.style.left = '0';
    frame.style.top = '0';
    frame.style.width = BASE_W + 'px';
    frame.style.height = BASE_H + 'px';
    frame.style.transformOrigin = '0 0';
    st.frame = frame;
    st.exW = 0; st.exH = 0; st.S = 1; st.evExtra = 0;
    var base = one(frame, '[data-name="Base"]'), hero = one(frame, '[data-name="Hero Image"]');
    var callouts = lift(kid(frame, 'Callouts'));
    var header = kid(frame, 'Header');
    var actions = kid(header, 'Actions');
    var line = kid(header, 'Header Line'), nav = kid(header, 'Nav Bar');
    var glow = lift(kid(header, 'Logo Glow')), brand = lift(kid(header, 'Brand')), ticker = lift(kid(header, 'Ticker'));
    st.ev = lift(kid(frame, 'Widget/Event List'));
    st.room = lift(kid(frame, 'Widget/Room Selector'));
    st.equip = lift(kid(frame, 'Widget/Equipment Status'));
    [st.ev, st.room, st.equip].forEach(function (w) { w.classList.add('pf-mv'); });
    var evBody = kid(st.ev, 'Body'), titleBg = kid(st.ev, 'Title BG'), foldBtn = kid(st.ev, 'Fold Button'), evHead = kid(st.ev, 'Header');
    st.evBody = evBody;

    function layout() {
      var W = root.clientWidth, H = root.clientHeight;
      if (!W || !H) return;
      var S = Math.min(W / BASE_W, H / BASE_H);
      var VW = W / S, VH = H / S, exW = Math.max(0, VW - BASE_W), exH = Math.max(0, VH - BASE_H);
      if (exW < 0.01) exW = 0;
      if (exH < 0.01) exH = 0;
      st.S = S; st.exW = exW; st.exH = exH; st.VW = VW; st.VH = VH;
      frame.style.transform = S === 1 ? 'none' : 'scale(' + S + ')';
      /* 정확히 1:1 일 때만 별도 층 — 배율이 바뀌면 층이 옛 해상도에 묶여 글자가 흐려진다 */
      frame.style.willChange = Math.abs(S - 1) < 1e-4 ? 'transform' : 'auto';
      /* 바탕 — Base 는 판 전체, 사진은 cover. 말풍선 층이 사진을 따라간다 */
      var bs = base.style;
      bs.left = '0px'; bs.top = '0px'; bs.margin = '0'; bs.width = VW + 'px'; bs.height = VH + 'px';
      var k = Math.max(VW / 1920, (VH - 93) / 987), hw = 1920 * k, hh = 987 * k;
      var hl = (VW - hw) / 2, ht = 93 + (VH - 93 - hh) / 2;
      var hs = hero.style;
      hs.left = hl.toFixed(2) + 'px'; hs.top = ht.toFixed(2) + 'px'; hs.bottom = 'auto'; hs.margin = '0'; hs.width = hw.toFixed(2) + 'px'; hs.height = hh.toFixed(2) + 'px';
      callouts.style.transform = k === 1 ? 'none' : 'translate(' + hl.toFixed(2) + 'px,' + (ht - 93 * k).toFixed(2) + 'px) scale(' + k.toFixed(5) + ')';
      /* 헤더 */
      setT(actions, exW, 0);
      actions.style.translate = exW ? exW.toFixed(2) + 'px 0' : '';
      line.style.width = (1842.856 + exW).toFixed(2) + 'px';
      nav.style.width = (1788.2 + exW).toFixed(2) + 'px';
      [glow, brand, ticker].forEach(function (g) { setT(g, exW / 2, 0); });
      /* 경보 목록 — 남는 높이의 62% 를 줄로(나머지는 사진) */
      st.evExtra = Math.round(exH * 0.62);
      evBody.style.width = (1860 + exW).toFixed(2) + 'px';
      evBody.style.height = (187 + st.evExtra) + 'px';
      titleBg.style.left = '30px'; titleBg.style.right = 'auto'; titleBg.style.width = (1859.975 + exW).toFixed(2) + 'px';
      foldBtn.style.translate = exW ? (exW / 2).toFixed(2) + 'px 0' : '';
      evHead.style.width = (1781 + exW).toFixed(2) + 'px';
      placeAll(st);
      if (st.onLayout) st.onLayout();
    }
    var rsT = 0;
    function relayout() {
      root.classList.add('pf-resizing');
      layout();
      clearTimeout(rsT);
      rsT = setTimeout(function () { root.classList.remove('pf-resizing'); }, 140);
    }
    st.lay = { room: 'left', equip: 'right', event: 'bottom', order: { left: ['room'], right: ['equip'] } };
    var sv = load(K_LAYOUT);
    if (sv && sv.order && sv.order.left && sv.order.right) st.lay = sv;
    st.fold = load(K_FOLD);
    layout();
    st.relayout = relayout;
    st.layout = layout;
    if (window.ResizeObserver) { st.ro = new ResizeObserver(relayout); st.ro.observe(root); }
    else { st.onResize = relayout; window.addEventListener('resize', relayout); }
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('pf-live'); }); });
  }

  /* ══════════════════ 2. 시계 ══════════════════ */
  var WD_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function installClock(root, st) {
    var ts = one(root, '[data-name="Timestamp"]');
    if (!ts) return;
    var ps = all(ts, 'p');
    function tick() {
      var d = new Date();
      write(ps[0], d.getFullYear() + '. ' + p2(d.getMonth() + 1) + '.' + p2(d.getDate()));   /* 원본 서식 '2026. 11.03' */
      write(ps[1], WD_EN[d.getDay()]);
      write(ps[2], p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds()));
    }
    tick();
    st.timers.push(setInterval(function () { if (!editing()) tick(); }, 1000));
  }

  /* ══════════════════ 3. 눌리는 자리 ══════════════════ */
  function installNav(root, st) {
    var items = all(root, '[data-name^="Nav Item/"]');
    var ON = 'background-6.svg', OFF = 'background-5.svg';
    var bgOf = function (m) { return kid(m, 'Background'); };
    var cur = items.filter(function (m) { return /\(Hover\)/.test(m.getAttribute('data-name')); })[0];
    function paint() {
      items.forEach(function (m) {
        var on = m === cur || m.classList.contains('pf-navhot');
        swapSrc(bgOf(m), on ? ON : OFF);
        m.classList.toggle('pf-navon', on);
      });
    }
    items.forEach(function (m) {
      clickable(m, m.textContent.trim(), function () { cur = m; paint(); });
      m.addEventListener('mouseenter', function () { m.classList.add('pf-navhot'); paint(); });
      m.addEventListener('mouseleave', function () { m.classList.remove('pf-navhot'); paint(); });
    });
    paint();
    clickable(one(root, '[data-name="Icon/Action/User"]'), 'User');
    clickable(one(root, '[data-name="Icon/Action/Logout"]'), 'Logout');
    /* 말풍선 — 묶음이 display:contents 라 :hover 가 안 걸린다. 눈에 보이는 조각에서 받아 묶음에 표시한다 */
    all(root, '[data-name^="Callout/"], [data-name="Chip/Floor Level"]').forEach(function (c) {
      all(c, '[data-name="Background"], [data-name="Badge"], p').forEach(function (part) {
        part.style.pointerEvents = 'auto';
        part.addEventListener('mouseenter', function () { c.classList.add('pf-hot'); });
        part.addEventListener('mouseleave', function () { c.classList.remove('pf-hot'); });
      });
    });
    all(root, '[data-name="Leader"]').forEach(function (l) { l.style.pointerEvents = 'none'; });
  }

  /* 전기실 고르기 — 표지 · 글자색 · 설비현황 제목 · 말풍선이 함께 간다 */
  function installRoom(root, st) {
    var opts = ['1 (Selected)', '2', '3'].map(function (s) { return one(root, '[data-name="Option/Electrical Room ' + s + '"]'); });
    var title = one(st.equip, ':scope > p');
    var callout = one(root, '[data-name="Callout/Electrical Room 1"]');
    function pick(i) {
      opts.forEach(function (o, k) {
        swapSrc(kid(o, 'Marker'), k === i ? 'marker-4.svg' : 'marker-5.svg');
        o.classList.toggle('pf-sel', k === i);
        o.classList.toggle('pf-unsel', k !== i);
      });
      if (st.roomInit) write(title, opts[i].textContent.trim() + ' 설비현황', true);
      if (callout) callout.classList.toggle('pf-on', i === 0);
      st.roomInit = true;
    }
    opts.forEach(function (o, i) { clickable(o, o.textContent.trim(), function () { pick(i); }); });
    pick(0);
    if (callout) all(callout, '[data-name="Background"], [data-name="Badge"], p').forEach(function (p) {
      p.addEventListener('click', function () { if (!editing()) pick(0); });
      p.style.cursor = 'pointer';
    });
  }
  /* 배전반 트리 — 고른 줄 밑으로 하위 목록이 옮겨 간다. 원본 자리: 1번 274, 2번부터 438 + 33(n-2), 하위 318 */
  function installTree(root, st) {
    var first = one(root, '[data-name="Tree Item/Panel 1 (Selected)"]');
    var list = kid(st.equip, 'List');
    var rest = Array.prototype.slice.call(list.children);
    var items = [first].concat(rest);
    var sub = kid(st.equip, 'Sub List'), branch = kid(st.equip, 'Branch Line');
    function pick(k) {
      items.forEach(function (it, i) {
        var dy = i === 0 ? 0 : (i <= k ? -131 : 0);
        it.style.translate = dy ? '0 ' + dy + 'px' : '';
        var c = kid(it, 'Content');
        swapSrc(c && kid(c, 'Marker'), i === k ? 'marker-4.svg' : 'marker-5.svg');
        it.classList.toggle('pf-sel', i === k);
        it.classList.toggle('pf-unsel', i !== k);
      });
      var dy2 = 33 * k;
      sub.style.translate = dy2 ? '0 ' + dy2 + 'px' : '';
      branch.style.translate = dy2 ? '0 ' + dy2 + 'px' : '';
    }
    items.forEach(function (it, i) { clickable(it, it.textContent.trim(), function () { pick(i); }); });
    pick(0);
    all(sub, '[data-name^="Sub Item/"]').forEach(function (s) { s.classList.add('pf-click'); });
  }
  /* 접기 */
  function installFold(root, st) {
    function toggle(key) {
      st.fold[key] = !st.fold[key];
      save(K_FOLD, st.fold);
      placeAll(st);
    }
    clickable(one(st.ev, '[data-node-id="7:351"]'), 'Fold', function () { toggle('event'); });
    clickable(one(st.equip, '[data-node-id="13:801"]'), 'Fold', function () { toggle('equip'); });
    clickable(one(st.room, '[data-node-id="13:893"]'), 'Fold', function () { toggle('room'); });
  }

  /* ══════════════════ 4. 경보 목록 ══════════════════
     원본 5줄을 바탕으로 건수(ALL 28 = CR2 + MA5 + MI9 + WA12)만큼 목록을 잇는다 — 글자는 원본 줄의 것만 쓴다.
     열 때마다 맨 윗줄이 몇십 초 전이 되고 줄 사이 간격은 원본 그대로다. 등급은 표에 칸이 없어 안쪽에만 둔다(칩으로 거르기용). */
  var COLS = ['Time', 'Location', 'Device', 'Item', 'Message'];
  var ROW_GRADE = ['Critical', 'Warning', 'Major', 'Minor', 'Warning'];
  var GRADE_N = { Critical: 2, Major: 5, Minor: 9, Warning: 12 };
  var ROW_MAX = 12;
  function fmtStamp(t) {
    var d = new Date(t);
    return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) + ' / ' + p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds());
  }
  function parseStamp(s) {
    var m = /(\d{4})-(\d{2})-(\d{2}) \/ (\d{2}):(\d{2}):(\d{2})/.exec(s);
    return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]).getTime() : 0;
  }
  function installEvent(root, st) {
    var body = one(st.evBody, '[data-name="Table/Event List"] > [data-name="Body"]');
    var rows = Array.prototype.slice.call(body.children);
    var cell = function (r, c) { var td = one(r, '[data-name="Td/' + c + '"]'); return td && td.querySelector('p'); };
    var noOf = function (r) { var td = one(r, '[data-name="Td/No"]'); return td && td.querySelector('p'); };
    /* 원본 줄 → 자료 */
    var pool = rows.map(function (r, i) {
      var d = { grade: ROW_GRADE[i] };
      COLS.forEach(function (c) { d[c] = cell(r, c).textContent; });
      return d;
    });
    var t0 = pool.map(function (d) { return parseStamp(d.Time); });
    var gaps = [];
    for (var g = 1; g < t0.length; g++) gaps.push(Math.max(30000, t0[g - 1] - t0[g]));
    /* 넓어진 화면용 줄 — 마지막 줄을 복제(같은 클래스라 모양이 같다). 기준 화면에서는 잘려 안 보인다 */
    var last = rows[rows.length - 1];
    for (var n = rows.length + 1; n <= ROW_MAX; n++) {
      var c = last.cloneNode(true);
      c.setAttribute('data-name', 'Row/' + n);
      c.removeAttribute('data-node-id');
      if (c.id) c.id = c.id + '_c' + n;
      all(c, '[id]').forEach(function (e) { e.id = e.id + '_c' + n; });
      body.appendChild(c);
      rows.push(c);
    }
    /* 건수만큼 목록 — 처음 5줄은 원본 그대로, 그다음은 남은 등급을 번갈아 */
    var left = {}; Object.keys(GRADE_N).forEach(function (k) { left[k] = GRADE_N[k]; });
    pool.forEach(function (d) { left[d.grade]--; });
    var data = pool.map(function (d) { var o = {}; Object.keys(d).forEach(function (k) { o[k] = d[k]; }); return o; });
    var byGrade = function (gr) { return pool.filter(function (d) { return d.grade === gr; }); };
    var keys = Object.keys(left), ki = 0, seq = 0, guard = 0;
    while (keys.some(function (k) { return left[k] > 0; }) && guard++ < 200) {
      var kk = keys[ki++ % keys.length];
      if (left[kk] <= 0) continue;
      left[kk]--;
      var src = byGrade(kk); src = src[seq++ % src.length];
      var o2 = {}; Object.keys(src).forEach(function (k) { o2[k] = src[k]; });
      data.push(o2);
    }
    /* 열 때마다 최근으로 — 맨 윗줄 = 지금 몇십 초 전 */
    var t = Date.now() - Math.round(rnd(25, 55)) * 1000;
    data.forEach(function (d, i) { d.t = t; d.Time = fmtStamp(t); t -= gaps[i % gaps.length]; });

    var filter = null;   /* null = ALL */
    function render(flashTop) {
      var list = filter ? data.filter(function (d) { return d.grade === filter; }) : data;
      rows.forEach(function (r, i) {
        var d = list[i];
        r.classList.toggle('pf-empty', !d);
        r.classList.remove('pf-new');
        if (!d) return;
        COLS.forEach(function (c) { write(cell(r, c), d[c]); });
        write(noOf(r), String(i + 1));
      });
      if (flashTop && rows[0]) { void rows[0].offsetWidth; rows[0].classList.add('pf-new'); }
    }
    /* 원본 글자와 같으면 쓰지 않으므로, 처음 한 번은 사람이 고친 것으로 오인하지 않게 기준을 잡아 둔다 */
    rows.forEach(function (r) { COLS.forEach(function (c) { var p = cell(r, c); p.__pfLast = p.textContent; }); var q = noOf(r); q.__pfLast = q.textContent; });
    render(false);

    /* 등급 칩 — 고른 칩이 켜진 그림(background-2)을 가져가고 표를 거른다 */
    var chips = all(st.ev, '[data-name^="Count/"]');
    var gradeOf = function (ch) { var m = /Count\/(\w+)/.exec(ch.getAttribute('data-name')); return m && m[1] !== 'All' ? m[1] : null; };
    var valOf = function (ch) { return one(ch, '[data-name="Value Box"] p'); };
    var curChip = chips[0];
    function paintChips() {
      chips.forEach(function (ch) { swapSrc(kid(ch, 'Background'), ch === curChip ? 'background-2.svg' : 'background-3.svg'); });
    }
    chips.forEach(function (ch) {
      clickable(ch, ch.textContent.replace(/\s+/g, ' ').trim(), function () {
        curChip = ch; filter = gradeOf(ch);
        paintChips(); render(false);
      });
      var v = valOf(ch); if (v) v.__pfLast = v.textContent;
    });
    paintChips();
    rows.forEach(function (r) {
      r.addEventListener('click', function () {
        if (editing()) return;
        var was = r.classList.contains('pf-rowsel');
        rows.forEach(function (x) { x.classList.remove('pf-rowsel'); });
        if (!was) r.classList.add('pf-rowsel');
      });
    });
    /* 라이브 — 새 경보(원본 줄 중 하나)가 맨 위로 */
    var bump = function (ch) { var v = valOf(ch); if (!v || claimed(v)) return; write(v, String((parseInt(v.textContent, 10) || 0) + 1), true); };
    function push() {
      if (editing() || idle()) return;
      var src = pool[Math.floor(Math.random() * pool.length)];
      var d = {}; Object.keys(src).forEach(function (k) { d[k] = src[k]; });
      d.t = Date.now(); d.Time = fmtStamp(d.t);
      data.unshift(d);
      if (data.length > 60) data.pop();
      render(!filter || filter === d.grade);
      if (st.onAlarm) st.onAlarm(d);
      bump(chips[0]);
      chips.forEach(function (ch) { if (gradeOf(ch) === d.grade) bump(ch); });
    }
    (function arm() {
      st.feed = setTimeout(function () { push(); arm(); }, rnd(9000, 16000));
    })();
  }

  /* ══════════════════ 4-2. 안내 티커 ══════════════════
     띠 그림(background-7.svg)은 그대로 두고 그 모양을 마스크로 쓴 빛줄기가 지나간다. 테두리 빛이 숨쉰다.
     문구는 원본 안내문과 표의 최신 경보(등급 색 · 표에 있는 글자만)를 번갈아 — 7초 머물다 왼쪽으로 빠지고 오른쪽에서 들어온다.
     처음 7초는 원본 그대로다. 패널편집 중에는 멈추고 원본 안내문으로 되돌린다(고칠 글자는 안내문). 사람이 고친 안내문은 덮지 않는다. */
  var GRADE_TAG = { Critical: ['CR', 'pf-tk-cr'], Major: ['MA', 'pf-tk-ma'], Minor: ['MI', 'pf-tk-mi'], Warning: ['WA', 'pf-tk-wa'] };
  function installTicker(root, st) {
    var tk = one(root, '[data-name="Ticker"]');
    if (!tk) return;
    var bg = kid(tk, 'Background'), msg = kid(tk, 'Message');
    var holder = bg && bg.firstElementChild, img = holder && holder.querySelector('img');
    if (!holder || !img || !msg) return;
    holder.classList.add('pf-tk-holder');
    var sh = document.createElement('i');
    sh.className = 'pf-tk-shine';
    sh.setAttribute('aria-hidden', 'true');
    var url = 'url("' + (img.__origSrc || img.getAttribute('src')) + '")';
    sh.style.webkitMaskImage = url; sh.style.maskImage = url;
    holder.appendChild(sh);
    /* 문구 창 — 띠 안쪽(비스듬한 양끝을 뺀 720px). 글자는 창 가운데 = 원래 가운데라 처음 모습이 원본과 같다 */
    var W = 720, cx = msg.offsetLeft + msg.offsetWidth / 2, top = msg.offsetTop;
    var win = document.createElement('div');
    win.className = 'pf-tk-win';
    win.style.left = (cx - W / 2) + 'px'; win.style.top = '66px'; win.style.width = W + 'px'; win.style.height = '45px';
    tk.appendChild(win);
    win.appendChild(msg);
    var ms = msg.style;
    ms.left = '0px'; ms.top = (top - 66) + 'px'; ms.bottom = 'auto'; ms.margin = '0'; ms.width = W + 'px';
    var base = msg.textContent, latest = null, showing = 'base';
    if (msg.__pfLast == null) msg.__pfLast = base;
    st.onAlarm = function (d) { latest = d; };
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    function setText(kind) {
      Object.keys(GRADE_TAG).forEach(function (k) { msg.classList.remove(GRADE_TAG[k][1]); });
      if (kind === 'alarm' && latest) {
        var g = GRADE_TAG[latest.grade] || ['', ''];
        write(msg, '[' + g[0] + '] ' + latest.Location + ' · ' + latest.Device + ' · ' + latest.Message);
        if (g[1]) msg.classList.add(g[1]);
      } else write(msg, base);
      showing = kind;
    }
    function slide(next) {
      msg.classList.add('pf-tk-move');
      msg.style.transform = 'translateX(' + (-W) + 'px)'; msg.style.opacity = '0';
      st.tkT = setTimeout(function () {
        msg.classList.remove('pf-tk-move');
        setText(editing() ? 'base' : next);
        msg.style.transform = 'translateX(' + W + 'px)';
        void msg.offsetWidth;
        msg.classList.add('pf-tk-move');
        msg.style.transform = 'translateX(0)'; msg.style.opacity = '1';
      }, 900);
    }
    /* 패널편집을 켜면 곧바로 안내문으로 — 경보 글자를 고쳐 버리지 않게 */
    st.timers.push(setInterval(function () {
      if (!editing() || claimed(msg)) return;
      if (showing === 'base' && !msg.style.transform) return;
      clearTimeout(st.tkT);
      msg.classList.remove('pf-tk-move');
      msg.style.transform = ''; msg.style.opacity = '';
      setText('base');
    }, 300));
    function tick() {
      if (claimed(msg)) return;                           /* 사람이 고친 안내문 — 그대로 둔다 */
      if (editing() || idle() || reduce) return;
      var next = showing === 'base' && latest ? 'alarm' : 'base';
      if (next === showing) return;
      slide(next);
    }
    /* 처음 경보 = 표 맨 윗줄(열 때 최근으로 찍힌 것) */
    var row = one(root, '[data-name="Row/1"]');
    if (row) {
      var c = function (n) { var p = one(row, '[data-name="Td/' + n + '"] p'); return p ? p.textContent : ''; };
      latest = { grade: 'Critical', Location: c('Location'), Device: c('Device'), Message: c('Message') };
    }
    st.timers.push(setInterval(tick, 8000));
  }

  /* ══════════════════ 5. 차트 바꾸기(패널편집) ══════════════════
     이 시안의 패널에는 차트가 없다 — 패널 안쪽 자리에 전력설비에 맞는 차트를 넣을 수 있게 한다(첫 항목 = 추천, 기본은 원본 그대로).
     이름은 화면에 있는 것만 쓴다(배전반 · 디바이스 · 항목 · 위치 · 등급). 값은 표의 기준값(접점 75.0°C · 내부 60.0°C · 습도 60.0 %RH) 근처의 샘플이다. */
  var C = { cy: '#29e2ff', bl: '#48b0e5', teal: '#00fdfe', gn: '#35ad38', cr: '#f33131', ma: '#fc7f01', mi: '#fdd01f', wa: '#29e2ff' };
  var PANELS = ['HV-01', 'HV-02', 'HV-03', 'LV-01', 'LV-02', 'SC-01', 'GP-01', 'AT-01'];
  var CHARTS = {
    equip: [
      { k: 'hbar', t: '배전반별 접점온도', unit: '°C', cats: PANELS, vals: [78.4, 71.2, 69.8, 62.5, 64.1, 58.7, 66.3, 55.9], max: 100, c: C.cy, dec: 1 },
      { k: 'line', t: '접점온도 추이', unit: '°C', dec: 1, series: [['접점온도', C.cy, 72, 2.4], ['기준', C.cr, 75, 0.01]], lo: 50, hi: 90 },
      { k: 'gauge', t: '내부온도', unit: '°C', v: [62.1, 1.4], max: 100, c: C.teal, dec: 1 },
      { k: 'bar', t: '디바이스별 경보', unit: '건', cats: ['VCB', 'ACB', '센서', 'GW'], vals: [9, 6, 8, 5], max: 14, c: C.bl },
    ],
    room: [
      { k: 'donut', t: '위치별 경보 비중', parts: [['전기실1', C.cy, 12], ['전기실2', C.bl, 7], ['전기실3', C.gn, 5], ['서버실1', C.mi, 4]] },
      { k: 'gauge', t: '실내 습도', unit: '%RH', v: [58.2, 1.6], max: 100, c: C.cy, dec: 1 },
      { k: 'area', t: '내부온도 추이', unit: '°C', dec: 1, series: [['내부온도', C.teal, 60, 1.6]], lo: 40, hi: 80 },
    ],
    event: [
      { k: 'area', t: '등급별 경보 추이', unit: '건', series: [['CR', C.cr, 2, 1], ['MA', C.ma, 5, 1.4], ['MI', C.mi, 9, 1.8], ['WA', C.wa, 12, 2]], lo: 0, hi: 20 },
      { k: 'bar', t: '등급별 경보 건수', unit: '건', cats: ['CR', 'MA', 'MI', 'WA'], vals: [2, 5, 9, 12], max: 16, c: C.cy },
      { k: 'hbar', t: '위치별 경보 건수', unit: '건', cats: ['전기실1', '전기실2', '전기실3', '서버실1'], vals: [12, 7, 5, 4], max: 16, c: C.bl },
      { k: 'donut', t: '등급별 비중', parts: [['CR', C.cr, 2], ['MA', C.ma, 5], ['MI', C.mi, 9], ['WA', C.wa, 12]] },
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
    el.className = 'pf-chart';
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
        s += '<clipPath id="pfc' + spec.uid + '"><rect x="' + L + '" y="0" width="' + (w - L - R) + '" height="' + h + '"/></clipPath><g clip-path="url(#pfc' + spec.uid + ')">';
        data.forEach(function (a, si) {
          var col = spec.series[si][1];
          var pts = a.map(function (v, i) { return X(i).toFixed(1) + ',' + Y(v).toFixed(1); }).join(' ');
          if (spec.k === 'area' || si === 0) {
            s += '<defs><linearGradient id="pfg' + spec.uid + si + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + col + '" stop-opacity="' + (spec.k === 'area' ? .4 : .18) + '"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></linearGradient></defs>';
            s += '<polygon fill="url(#pfg' + spec.uid + si + ')" points="' + X(0).toFixed(1) + ',' + (h - B) + ' ' + pts + ' ' + X(N - 1).toFixed(1) + ',' + (h - B) + '"/>';
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
        + '<defs><linearGradient id="pfgg' + spec.uid + '" x1="0" x2="1"><stop offset="0" stop-color="#2a7ca0"/><stop offset="1" stop-color="' + spec.c + '"/></linearGradient></defs>'
        + '<path d="M8 52a42 42 0 0 1 84 0" fill="none" stroke="rgba(142,166,179,.2)" stroke-width="8"/>'
        + '<path class="arc" d="M8 52a42 42 0 0 1 84 0" fill="none" stroke="url(#pfgg' + spec.uid + ')" stroke-width="8" stroke-dasharray="0 ' + LEN.toFixed(1) + '"/>'
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
  /* 바꿔 넣은 차트는 시트 밖에서 그리므로 '색 정하기'가 안 닿는다 — 칠해진 표지 색에서 회전각을 읽어 같이 돌린다(원본 색상각 200°) */
  function syncChartHue(root, probe) {
    var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(getComputedStyle(probe).color);
    if (!m) return;
    var r = +m[1], g = +m[2], b = +m[3], mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    if (!d) return;
    var h = (mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60;
    var rot = ((h - 200 + 540) % 360) - 180;
    root.style.setProperty('--pf-chue', (Math.abs(rot) < 3 ? 0 : Math.round(rot)) + 'deg');
  }
  function installChartSwap(root, st) {
    var saved = load(K_CHART);
    st.charts = {}; st.chartApply = {};
    var probe = document.createElement('i');
    probe.className = 'pf-probe';
    st.frame.appendChild(probe);
    var TG = [
      { key: 'equip', w: st.equip, box: { l: 1650, t: 261, w: 240, h: 429 }, hide: ['Tree Line', 'Tree Item/Panel 1 (Selected)', 'List', 'Branch Line', 'Sub List'] },
      { key: 'room', w: st.room, box: { l: 40, t: 379.5, w: 240, h: 130 }, hide: [], hideIn: 'List' },
      { key: 'event', w: st.ev, box: function () { return { l: 30, t: 869, w: 1860 + st.exW, h: 187 + st.evExtra }; }, hideEv: true },
    ];
    var places = [];
    TG.forEach(function (tg) {
      var host = document.createElement('div');
      host.className = 'pf-chost';
      tg.w.appendChild(host);
      var place = function () {
        var b = typeof tg.box === 'function' ? tg.box() : tg.box;
        host.style.left = b.l + 'px'; host.style.top = b.t + 'px'; host.style.width = b.w + 'px'; host.style.height = b.h + 'px';
      };
      place(); places.push(place);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pf-chartbtn';
      btn.innerHTML = KIND_ICON.bar.replace('class="ic"', 'class="ic" style="width:13px;height:11px"') + '차트';
      btn.title = '이 패널의 차트 바꾸기';
      var menu = document.createElement('div');
      menu.className = 'pf-chartmenu';
      host.appendChild(btn); host.appendChild(menu);
      var cur = saved[tg.key] != null ? saved[tg.key] : -1;
      var hideEls = function () {
        if (tg.hideEv) return [one(st.evBody, '[data-name="Table/Event List"]')];
        if (tg.hideIn) return [one(tg.w, '[data-name="' + tg.hideIn + '"]')];
        return tg.hide.map(function (n) { return kid(tg.w, n); });
      };
      function render() {
        var list = CHARTS[tg.key];
        menu.innerHTML = '<div class="hd">추천 차트</div>'
          + list.map(function (s, i) {
            return '<button type="button" data-i="' + i + '"' + (i === cur ? ' class="cur"' : '') + '>' + KIND_ICON[s.k] + esc(s.t) + ' · ' + KIND_NAME[s.k]
              + (i === 0 ? '<span class="rec">추천</span>' : '') + '</button>';
          }).join('')
          + '<div class="sep"></div><button type="button" data-i="-1"' + (cur < 0 ? ' class="cur"' : '') + '>' + KIND_ICON.orig + '원본 그대로</button>';
      }
      function apply(i) {
        cur = i;
        if (st.charts[tg.key]) { st.charts[tg.key].dispose(); delete st.charts[tg.key]; }
        hideEls().forEach(function (n) { if (n) n.classList.toggle('pf-swap-hide', i >= 0); });
        if (i >= 0 && CHARTS[tg.key][i]) {
          st.charts[tg.key] = makeChart(host, Object.assign({ uid: ++chartUid }, CHARTS[tg.key][i]));
          host.appendChild(btn); host.appendChild(menu);
        }
        var m = load(K_CHART);
        if (i >= 0) m[tg.key] = i; else delete m[tg.key];
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
        all(root, '.pf-chartmenu.open').forEach(function (m) { if (m !== menu) m.classList.remove('open'); });
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
    st.onLayout = function () { places.forEach(function (f) { f(); }); };
    st.onDocDown = function (e) {
      if (e.target.closest && e.target.closest('.pf-chartmenu, .pf-chartbtn')) return;
      all(root, '.pf-chartmenu.open').forEach(function (m) { m.classList.remove('open'); });
    };
    document.addEventListener('pointerdown', st.onDocDown, true);
  }

  /* ══════════════════ 6. 패널 옮기기(패널편집) ══════════════════
     전기실 · 설비 패널 — 왼쪽 · 오른쪽 자리, 같은 쪽이면 가장자리부터 나란히. 경보 목록 — 아래 · 위(옆 패널이 그 아래로 내려온다).
     점선이 들어갈 곳을 미리 보여 주고, 놓으면 나머지가 흘러 다시 앉는다. 저장 후 '배치 초기화'로 되돌린다. */
  function installPanelMove(root, st) {
    var drag = null, ghost = null;
    var nameOfPanel = function (w) { return w === st.room ? 'room' : w === st.equip ? 'equip' : 'event'; };
    function persist() { save(K_LAYOUT, st.lay); }
    function ghostAt(s) {
      if (!ghost) { ghost = document.createElement('div'); ghost.className = 'pf-ghost'; st.frame.appendChild(ghost); }
      ghost.style.left = s.x + 'px'; ghost.style.top = s.y + 'px'; ghost.style.width = s.w + 'px'; ghost.style.height = s.h + 'px';
    }
    function spotOf(e, name) {
      var fr = st.frame.getBoundingClientRect(), S = st.S || 1;
      var x = (e.clientX - fr.left) / S, y = (e.clientY - fr.top) / S;
      var evH = 230 + st.evExtra;
      if (name === 'event') {
        var top = y < (st.VH || 1080) / 2;
        return { dock: top ? 'top' : 'bottom', slot: { x: 30, y: top ? 120 : 826 + st.exH - st.evExtra, w: 1860 + st.exW, h: evH } };
      }
      var left = x < (st.VW || 1920) / 2;
      var other = name === 'room' ? 'equip' : 'room';
      var w = 250, h = name === 'room' ? 289.5 : 469;
      /* 같은 쪽에 다른 패널이 있으면 안쪽 · 바깥쪽 중 가까운 자리 */
      var dock = left ? 'left' : 'right';
      var shared = st.lay[other] === dock;
      var idx = 0;
      if (shared) {
        var edgeD = left ? x - 30 : (1890 + st.exW) - x;
        idx = edgeD < w + COL_GAP / 2 ? 0 : 1;
      }
      var sx = left ? 30 + idx * (250 + COL_GAP) : 1890 + st.exW - w - idx * (250 + COL_GAP);
      var py = st.lay.event === 'top' && !st.fold.event ? (120 + evH + 14) : 220;
      return { dock: dock, idx: idx, slot: { x: sx, y: py, w: w, h: h } };
    }
    st.onDown = function (e) {
      if (!layoutEditing(root) || e.button !== 0) return;
      if (e.target.closest('.pf-chartbtn, .pf-chartmenu, .pf-resetbtn')) return;
      /* 패널편집은 글자 수정과 함께 켜진다 — 글자 위에서 시작한 끌기는 글자 고르기로 둔다 */
      if (e.target.closest('[contenteditable="true"]')) return;
      var w = e.target.closest('.pf-mv');
      if (!w || !root.contains(w)) return;
      e.preventDefault(); e.stopPropagation();
      drag = { w: w, name: nameOfPanel(w), sx: e.clientX, sy: e.clientY, moved: false };
    };
    st.onMove = function (e) {
      if (!drag) return;
      var S = st.S || 1, dx = (e.clientX - drag.sx) / S, dy = (e.clientY - drag.sy) / S;
      if (!drag.moved) {
        if (Math.hypot(dx, dy) < 3) return;
        drag.moved = true;
        drag.w.classList.add('pf-dragging');
      }
      drag.w.style.setProperty('--pf-dx', dx + 'px');
      drag.w.style.setProperty('--pf-dy', dy + 'px');
      drag.spot = spotOf(e, drag.name);
      ghostAt(drag.spot.slot);
    };
    st.onUp = function () {
      if (!drag) return;
      var d = drag; drag = null;
      if (ghost) { ghost.remove(); ghost = null; }
      var w = d.w;
      if (!d.moved) { w.classList.remove('pf-dragging'); return; }
      /* 놓은 자리에서 새 자리로 미끄러져 들어간다 */
      var tx = parseFloat(w.style.getPropertyValue('--pf-tx')) || 0, ty = parseFloat(w.style.getPropertyValue('--pf-ty')) || 0;
      var ddx = parseFloat(w.style.getPropertyValue('--pf-dx')) || 0, ddy = parseFloat(w.style.getPropertyValue('--pf-dy')) || 0;
      w.style.setProperty('--pf-dx', '0px'); w.style.setProperty('--pf-dy', '0px');
      setT(w, tx + ddx, ty + ddy);
      void w.offsetWidth;
      w.classList.remove('pf-dragging');
      var L = st.lay;
      if (d.spot) {
        if (d.name === 'event') L.event = d.spot.dock;
        else {
          L.order.left = L.order.left.filter(function (n) { return n !== d.name; });
          L.order.right = L.order.right.filter(function (n) { return n !== d.name; });
          L.order[d.spot.dock].splice(Math.min(d.spot.idx, L.order[d.spot.dock].length), 0, d.name);
          L[d.name] = d.spot.dock;
        }
      }
      placeAll(st);
      persist();
      if (st.onLayout) st.onLayout();
    };
    root.addEventListener('pointerdown', st.onDown, true);
    window.addEventListener('pointermove', st.onMove);
    window.addEventListener('pointerup', st.onUp);
    window.addEventListener('pointercancel', st.onUp);
    st.onDragStart = function (e) { if (layoutEditing(root) && e.target.closest && e.target.closest('.pf-mv')) e.preventDefault(); };
    root.addEventListener('dragstart', st.onDragStart);
    /* 스튜디오 '배치 초기화' — 자리 · 차트를 원본으로 */
    st.resetLayout = function () {
      save(K_LAYOUT, {});
      st.lay = { room: 'left', equip: 'right', event: 'bottom', order: { left: ['room'], right: ['equip'] } };
      placeAll(st);
      save(K_CHART, {});
      Object.keys(st.chartApply || {}).forEach(function (k) { st.chartApply[k](-1); });
      if (st.onLayout) st.onLayout();
    };
    var rb = document.createElement('button');
    rb.type = 'button';
    rb.className = 'pf-resetbtn';
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
    try { installFit(root, st); } catch (e) { console.warn('[pf] fit', e); }
    try { installClock(root, st); } catch (e) { console.warn('[pf] clock', e); }
    try { installNav(root, st); } catch (e) { console.warn('[pf] nav', e); }
    try { installRoom(root, st); } catch (e) { console.warn('[pf] room', e); }
    try { installTree(root, st); } catch (e) { console.warn('[pf] tree', e); }
    try { installFold(root, st); } catch (e) { console.warn('[pf] fold', e); }
    try { installEvent(root, st); } catch (e) { console.warn('[pf] event', e); }
    try { installTicker(root, st); } catch (e) { console.warn('[pf] ticker', e); }
    try { installChartSwap(root, st); } catch (e) { console.warn('[pf] swap', e); }
    try { installPanelMove(root, st); } catch (e) { console.warn('[pf] move', e); }
  }
  function initPlant(root) {
    if (!root || root.__pf) return;
    injectStyle();
    root.classList.add('pf-root');
    var st = root.__pf = { timers: [] };
    if (/[?&]edit=1/.test(location.search)) root.classList.add('pf-edit-layout');
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
  function disposePlant(root) {
    var st = root && root.__pf;
    if (!st) return;
    if (st.wait) st.wait.disconnect();
    st.timers.forEach(function (t) { clearInterval(t); clearTimeout(t); });
    clearTimeout(st.feed);
    clearTimeout(st.tkT);
    if (st.ro) st.ro.disconnect();
    if (st.onResize) window.removeEventListener('resize', st.onResize);
    Object.keys(st.charts || {}).forEach(function (k) { st.charts[k].dispose(); });
    if (st.onDocDown) document.removeEventListener('pointerdown', st.onDocDown, true);
    if (st.onMove) { window.removeEventListener('pointermove', st.onMove); window.removeEventListener('pointerup', st.onUp); window.removeEventListener('pointercancel', st.onUp); }
    if (st.onReset) document.removeEventListener('click', st.onReset, true);
    root.__pf = null;
  }
  window.initPlant = initPlant;
  window.disposePlant = disposePlant;
})();
