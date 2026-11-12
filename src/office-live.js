/* 스마트 오피스 — 재구축 화면 54장의 인터랙션 · 라이브 · 반응형 레이어.
   window.initOffice(root) / window.disposeOffice(root)

   화면(DOM·CSS)은 생성기(src/office/_gen/conv.js)가 Figma(WUxDt6yorbRlc8V1py86HM) 그대로 만든다.
   이 파일은 그 위에 '움직이는 것'만 얹는다 — 정지 상태(?live=0) = Figma 원본.

   · 반응형 — 1920x1080 좌표계 + 균일 배율 S. 남는 폭 · 높이는 바탕 · 사이드바 · 본문 판이 나눠 갖는다(여백 없음)
   · 실시간 시계(현황 현재시각 · 업데이트) · 최근 시각(알림 · RAW DATA · 관리 이력 · 조회 기간을 열 때마다 '지금' 기준으로)
   · 마우스 오버 — 헤더 메뉴 · 유틸 단추 · 단추 · 탭 · 도크 · 트리 · 방 · 표 줄 · 카드 · 입력칸
   · 접기 — 사이드바 시간필터 · 공간필터 묶음, 트리, 홈 알림(이벤트 목록) 판
   · 화면 잇기 — 헤더 메뉴 · 유틸 단추 · 도크 · 방 · 팝업 닫기 · 관리정보 단추
   · 움직이는 차트 — 막대는 값이 바뀌며 길이가 흐르고, 선 차트는 계열마다 숨 쉬듯 오르내리고, 숫자는 흘러간다
   · 차트 바꾸기(패널편집 중) — 패널마다 이 시스템(공간 · 재실 분석)에 맞는 추천 차트. '원본 그대로'로 되돌린다
   · 패널 옮기기(패널편집 중) — 같은 크기 패널은 맞바꾸고, 나머지는 4px 격자 자유 이동

   src/office-live.js 는 생성물이다. 이 파일을 고쳐 `node mk-live.js`. 고친 뒤 js/core/tpl-modules.js 의 ?v= 를 올릴 것. */
(function () {
  'use strict';

  var BASE_W = 1920, BASE_H = 1080;
  var K_LAYOUT = 'wemb-office-layout', K_CHART = 'wemb-office-chart', K_SNB = 'wemb-office-snb-mode';
  /* 키 끝이 -mode 라야 스튜디오가 화면을 옮길 때 이어 준다(js/core/screen-switch.js KEEP) */
  var SNB_W = 380;   /* 사이드바 폭 — 접으면 이만큼 왼쪽으로 빠진다 */
  var SNB_GAIN = 320; /* 접었을 때 본문이 더 받는 폭 — 왼쪽 끝 단추(20~60px) 옆 80px 에서 본문이 시작한다 */
  var SNB_BTN_X = 20;
  function loadSnb() { try { return localStorage.getItem(K_SNB) === 'closed'; } catch (e) { return false; } }
  function saveSnb(closed) { try { localStorage.setItem(K_SNB, closed ? 'closed' : 'open'); } catch (e) { } }
  var STYLE_ID = 'office-live-style';
  var EASE = 'cubic-bezier(.22,.8,.24,1)';
  var SCENES = {"ofha":"home","ofhb":"home-alert","ofhc":"home-setting","ofhd":"home-account","ofhe":"home-privacy","ofla":"live-work","oflb":"live-work-zoom","oflc":"live-after","ofld":"live-used","ofle":"live-used-zoom","oflf":"live-used-popup","oflg":"live-free","oflh":"live-free-popup","ofli":"live-ghost","oflj":"live-ghost-busy","oflk":"live-ghost-free","ofoa":"occ-map","ofob":"occ-popup","ofoc":"occ-area","ofod":"occ-group","ofoe":"occ-matrix","ofof":"occ-matrix-hover","ofog":"occ-raw","ofba":"bridge","ofbb":"bridge-node","ofbc":"bridge-link","ofbd":"bridge-chart","ofbe":"bridge-raw","ofpa":"pattern-main","ofpb":"pattern-meeting","ofpc":"pattern-desk","ofpd":"pattern-collab","ofpe":"pattern-raw","ofra":"room-main","ofrb":"room-chart","ofrc":"room-usage","ofrd":"room-raw","ofca":"count-main","ofcb":"count-single","ofcc":"count-multi","ofcd":"count-gate","ofce":"count-floor","ofcf":"count-building","ofcg":"count-toilet","ofch":"count-brush","ofci":"count-raw","ofma":"admin-home","ofmb":"admin-home-popup","ofmc":"admin-time","ofmd":"admin-space","ofme":"admin-space-popup","ofmf":"admin-sensor","ofmg":"admin-sensor-popup","ofmh":"admin-account"};
  var PAGE_H = { 'admin-space': 2891, 'admin-space-popup': 2891, 'admin-account': 2286 };
  /* 시안의 '지금' — 현황 화면 시계(2026.11.10. 10:32:15). 화면을 열 때 이만큼을 '지금'으로 옮긴다 */
  var REF = new Date(2026, 10, 10, 10, 32, 15).getTime();
  function sec(sc) { return sc.split('-')[0]; }

  var CSS = [
    '.of-root{--of-acc:101,122,255;overflow:clip!important;}',
    '.of-root[data-theme="dark"]{--of-acc:140,156,255;}',
    '.of-root.of-scroll{overflow-x:hidden!important;overflow-y:auto!important;scrollbar-width:thin;}',
    '.of-root.of-scroll[data-theme="dark"]{scrollbar-color:#343842 #0e0f12;}',
    '.of-root.of-resizing *,.of-root .of-dragging,.of-root .of-dragging *{transition:none!important;}',
    '.of-root .of-probe{position:absolute;width:0;height:0;overflow:hidden;color:#657aff;}',
    '.of-root .of-click{cursor:pointer;}',
    '.of-root .of-click *{cursor:inherit;}',
    '.dt-content-editing .of-root .of-click,.dt-content-editing .of-root .of-click *{cursor:text;}',
    /* 들어올 때 */
    '@keyframes ofIn{from{opacity:0;translate:0 12px;}to{opacity:1;translate:0 0;}}',
    '@keyframes ofFade{from{opacity:0;}to{opacity:1;}}',
    '@keyframes ofPop{from{opacity:0;scale:.97;}to{opacity:1;scale:1;}}',
    '@keyframes ofDraw{from{clip-path:inset(0 100% 0 0);}to{clip-path:inset(0 0 0 0);}}',
    '.of-root.of-enter [data-name^="Widget/"],.of-root.of-enter .of-panel,.of-root.of-enter [data-name="Floor Plan"],.of-root.of-enter [data-name^="Card/"]{animation:ofIn .55s ' + EASE + ' both;}',
    '.of-root.of-enter [data-name^="Popup"],.of-root.of-enter [data-name="Dropdown Panel"]{animation:ofPop .32s ' + EASE + ' both;}',
    '.of-root.of-enter .of-line{animation:ofDraw 1.1s ' + EASE + ' both;}',
    /* 헤더 */
    '.of-root .of-nav{cursor:pointer;transition:background-color .2s ease;}',
    '.of-root .of-nav p{transition:color .2s ease,translate .2s ease;}',
    '.of-root .of-nav:hover{background-color:rgba(255,255,255,.06);}',
    '.of-root .of-nav:hover p{color:#c7cfff;}',
    '.of-root .of-nav:active p{translate:0 1px;}',
    '.of-root .of-util{cursor:pointer;border-radius:50%;transition:translate .2s ease,filter .2s ease,background-color .2s ease;}',
    '.of-root .of-util:hover{translate:0 -2px;filter:brightness(1.25) drop-shadow(0 3px 8px rgba(var(--of-acc),.55));}',
    '.of-root .of-logo{cursor:pointer;transition:opacity .2s ease;}',
    '.of-root .of-logo:hover{opacity:.78;}',
    /* 단추 */
    '.of-root [data-name="Button"],.of-root [data-name^="Button/"],.of-root .of-btn{cursor:pointer;transition:filter .18s ease,translate .18s ease,box-shadow .18s ease,background-color .18s ease,border-color .18s ease;}',
    '.of-root [data-name="Button"]:hover,.of-root [data-name^="Button/"]:hover,.of-root .of-btn:hover{translate:0 -1px;filter:brightness(1.06);box-shadow:0 6px 14px rgba(var(--of-acc),.22);}',
    '.of-root [data-name="Button"]:active,.of-root [data-name^="Button/"]:active,.of-root .of-btn:active{translate:0 0;filter:brightness(.94);box-shadow:none;}',
    /* 도크 */
    '.of-root .of-dock{cursor:pointer;border-radius:10px;transition:background-color .18s ease,translate .18s ease,box-shadow .18s ease;}',
    '.of-root .of-dock:hover{background-color:rgba(var(--of-acc),.14);translate:0 -2px;}',
    '.of-root .of-dock:active{translate:0 0;}',
    /* 탭 · 선택 */
    '.of-root [data-name="Tab"]{cursor:pointer;transition:background-color .2s ease,color .2s ease;}',
    '.of-root [data-name="Tab"]:hover{background-color:rgba(var(--of-acc),.12);}',
    '.of-root [data-name="Tab"].of-tab-on{background-color:#fff!important;}',
    '.of-root[data-theme="dark"] [data-name="Tab"].of-tab-on{background-color:#1d2027!important;}',
    '.of-root [data-name="Tab"].of-tab-on p{color:#272727!important;}',
    '.of-root[data-theme="dark"] [data-name="Tab"].of-tab-on p{color:#eceef2!important;}',
    '.of-root [data-name="Tab"].of-tab-off{background-color:#eeeff1!important;}',
    '.of-root[data-theme="dark"] [data-name="Tab"].of-tab-off{background-color:#15171c!important;}',
    '.of-root [data-name="Tab"].of-tab-off p{color:#999!important;}',
    '.of-root [data-name="Select"],.of-root [data-name^="Dropdown/"],.of-root [data-name="Input"]{transition:box-shadow .18s ease;}',
    '.of-root [data-name="Select"]:hover,.of-root [data-name^="Dropdown/Select"]:hover,.of-root [data-name="Input"]:hover{box-shadow:0 0 0 1px rgba(var(--of-acc),.55),0 2px 8px rgba(var(--of-acc),.14);}',
    '.of-root [data-name="Checkbox"],.of-root [data-name="Radio"]{cursor:pointer;transition:filter .16s ease;}',
    '.of-root [data-name="Checkbox"]:hover,.of-root [data-name="Radio"]:hover{filter:brightness(1.12);}',
    /* 트리 · 사이드바 */
    '.of-root [data-name="Tree Item"],.of-root [data-name="TreeSNB"],.of-root [data-name="Tree"]>[data-name="Item"]{cursor:pointer;border-radius:4px;transition:background-color .16s ease;}',
    '.of-root [data-name="Tree Item"]:hover,.of-root [data-name="TreeSNB"]:hover{background-color:rgba(255,255,255,.06);}',
    '.of-root .of-fold-head{cursor:pointer;border-radius:8px;transition:background-color .18s ease;}',
    '.of-root .of-fold-head:hover{background-color:rgba(255,255,255,.05);}',
    '.of-root .of-fold-head .of-arrow{transition:rotate .35s ' + EASE + ';}',
    '.of-root .of-fold-head.of-closed .of-arrow{rotate:180deg;}',
    '.of-root .of-fold-body{overflow:hidden;transition:max-height .42s ' + EASE + ',opacity .3s ease,margin .42s ' + EASE + ',padding .42s ' + EASE + ';}',
    '.of-root .of-fold-body.of-gone{max-height:0!important;opacity:0;margin-top:0!important;margin-bottom:0!important;padding-top:0!important;padding-bottom:0!important;pointer-events:none;}',
    '.of-root .of-tree-closed>[data-name] img{transition:rotate .28s ' + EASE + ';}',
    '.of-root .of-tree-gone{display:none!important;}',
    /* 사이드바 접기 단추 — 현황 원본 단추와 같은 모양(분석 화면은 같은 것을 붙인다) */
    '.of-root .of-snbadd{position:absolute;left:351px;top:17px;width:40px;height:40px;border-radius:12px;background:#292936;display:flex;align-items:center;justify-content:center;z-index:6;}',
    '.of-root .of-snbadd img{width:23px;height:23px;}',
    '.of-root .of-snbbtn{cursor:pointer;z-index:6;transition:filter .2s ease,box-shadow .25s ease,translate .5s ' + EASE + ';}',
    '.of-root .of-snbbtn:hover{filter:brightness(1.3);box-shadow:0 4px 14px rgba(0,0,0,.28);}',
    '.of-root .of-snbbtn:active{filter:brightness(.95);}',
    '.of-root .of-snbbtn img{transition:rotate .5s ' + EASE + ';}',
    '.of-root.of-snb-closed .of-snbbtn{box-shadow:0 6px 18px rgba(0,0,0,.22);}',
    '.of-root.of-snb-closed .of-snbbtn img{rotate:180deg;}',
    '.of-root.of-snbanim [data-node-id],.of-root.of-snbanim img,.of-root.of-snbanim .of-snbbtn{transition:left .5s ' + EASE + ',width .5s ' + EASE + ',top .5s ' + EASE + ',translate .5s ' + EASE + ',transform .5s ' + EASE + '!important;}',
    /* 방 · 도면 */
    '.of-root [data-name^="Room/"],.of-root [data-name="Room"],.of-root [data-name^="Icon/Space"],.of-root [data-name="Floor"]{cursor:pointer;transition:filter .2s ease,scale .2s ease;}',
    '.of-root [data-name^="Room/"]:hover,.of-root [data-name="Room"]:hover{filter:brightness(.92) saturate(1.4) drop-shadow(0 4px 10px rgba(var(--of-acc),.35));}',
    '.of-root [data-name^="Icon/Space"]:hover{scale:1.1;filter:drop-shadow(0 6px 12px rgba(var(--of-acc),.45));}',
    '.of-root [data-name="Floor Plan"]{transition:scale .45s ' + EASE + ';transform-origin:50% 50%;}',
    /* 표 · 카드 */
    '.of-root .of-row{transition:background-color .16s ease;}',
    '.of-root .of-row:hover{background-color:rgba(var(--of-acc),.07);}',
    '.of-root .of-row:hover>*{background-color:rgba(var(--of-acc),.05);}',
    '.of-root [data-name^="Card/"]{transition:translate .22s ease,box-shadow .22s ease;}',
    '.of-root [data-name^="Card/"]:hover{translate:0 -2px;box-shadow:0 8px 18px rgba(var(--of-acc),.16);}',
    '.of-root [data-name="List Item/Alert"]{cursor:pointer;transition:background-color .18s ease,translate .18s ease;}',
    '.of-root [data-name="List Item/Alert"]:hover{background-color:rgba(var(--of-acc),.08);translate:2px 0;}',
    '.of-root [data-name="Pagination/Page"],.of-root [data-name="Pagination/Arrow"]{cursor:pointer;transition:background-color .16s ease;border-radius:4px;}',
    '.of-root [data-name="Pagination/Page"]:hover,.of-root [data-name="Pagination/Arrow"]:hover{background-color:rgba(var(--of-acc),.12);}',
    /* 알림 판 접기 */
    '.of-root [data-name="Dropdown Panel"]{transform-origin:100% 0;transition:opacity .28s ease,scale .32s ' + EASE + ',translate .32s ' + EASE + ';}',
    '.of-root [data-name="Dropdown Panel"].of-shut{opacity:0;scale:.96;translate:0 -6px;pointer-events:none;}',
    /* 움직이는 차트 */
    '.of-root .of-bar{transition:width 1.6s ' + EASE + ',height 1.6s ' + EASE + ',left 1.6s ' + EASE + ',top 1.6s ' + EASE + '!important;}',
    '.of-root .of-line{transform-origin:50% 100%;transition:scale 2.6s cubic-bezier(.45,0,.25,1),translate 2.6s cubic-bezier(.45,0,.25,1);}',
    '.of-root .of-num{transition:color .4s ease;}',
    '.of-root .of-tick{color:#657aff!important;}',
    '.of-root[data-theme="dark"] .of-tick{color:#a9b6ff!important;}',
    '.of-root .of-livedot{position:absolute;width:7px;height:7px;border-radius:50%;background:#2fd37a;box-shadow:0 0 0 0 rgba(47,211,122,.6);animation:ofLive 2s ease-out infinite;z-index:3;pointer-events:none;}',
    '@keyframes ofLive{0%{box-shadow:0 0 0 0 rgba(47,211,122,.55);}80%,100%{box-shadow:0 0 0 7px rgba(47,211,122,0);}}',
    /* 패널 편집 */
    '.dt-editing .of-root [data-name]{animation:none!important;}',
    '.dt-editing .of-root .of-mv,.of-root.of-edit-layout .of-mv{cursor:move;outline:1px dashed rgba(var(--of-acc),.6);outline-offset:3px;}',
    '.of-root .of-dragging{z-index:9;opacity:.92;box-shadow:0 18px 40px rgba(0,0,0,.25);}',
    '.of-root .of-drop{outline:2px solid rgba(var(--of-acc),.85)!important;outline-offset:3px;}',
    '.of-root .of-host{position:absolute;z-index:2;display:none;border-radius:inherit;overflow:hidden;}',
    '.of-root .of-swapped>.of-host{display:block;}',
    '.of-root .of-resetbtn{display:none;position:absolute;right:244px;top:70px;z-index:30;height:30px;padding:0 14px;border-radius:8px;border:1px solid rgba(var(--of-acc),.5);background:#fff;color:#657aff;font:600 13px "Pretendard Variable",Pretendard,sans-serif;cursor:pointer;}',
    '.dt-editing .of-root .of-resetbtn,.of-root.of-edit-layout .of-resetbtn{display:block;}',
    '.of-root[data-theme="dark"] .of-resetbtn{background:#1b1d23;color:#eceef2;border-color:rgba(255,255,255,.14);}',
    '@media (prefers-reduced-motion:reduce){.of-root *{animation:none!important;transition:none!important;}}',
    '.of-root .of-chartbtn{position:absolute;top:-11px;right:14px;z-index:25;display:none;align-items:center;gap:4px;height:22px;padding:0 9px;border:1px solid rgb(var(--of-acc));background:#06264a;color:#e6f7ff;font:500 12px/1 Pretendard,system-ui,sans-serif;cursor:pointer;white-space:nowrap;}',
    '.of-root .of-chartbtn:hover{filter:brightness(1.25);box-shadow:0 0 12px rgba(var(--of-acc),.6);}',
    '.dt-editing .of-root .of-chartbtn,.dt-content-editing .of-root .of-chartbtn,.of-root.of-edit-layout .of-chartbtn{display:inline-flex;}',
    '.of-root .of-chartmenu{position:absolute;top:14px;right:14px;z-index:40;min-width:208px;padding:5px;border:1px solid #2a7ca0;background:#071a30;color:#c7ecf4;font:400 13px/1.35 Pretendard,system-ui,sans-serif;box-shadow:0 12px 28px rgba(0,0,0,.5);opacity:0;translate:0 -4px;pointer-events:none!important;transition:opacity .16s ease,translate .16s ease;}',
    '.of-root .of-chartmenu.open{opacity:1;translate:0 0;pointer-events:auto!important;}',
    '.of-root .of-chartmenu .hd{padding:4px 8px 6px;font-size:11px;color:#8ea6b3;white-space:nowrap;}',
    '.of-root .of-chartmenu button{display:flex;align-items:center;gap:8px;width:100%;padding:6px 8px;border:0;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer!important;white-space:nowrap;}',
    '.of-root .of-chartmenu button:hover{background:rgba(var(--of-acc),.14);color:#fff;}',
    '.of-root .of-chartmenu button.cur{background:rgba(9,182,251,.26);color:#fff;}',
    '.of-root .of-chartmenu .ic{width:18px;height:14px;flex:none;}',
    '.of-root .of-chartmenu .rec{margin-left:auto;padding:1px 6px;background:rgb(var(--of-acc));color:#03202e;font-size:10px;font-weight:700;}',
    '.of-root .of-chartmenu .sep{height:1px;margin:4px 2px;background:rgba(199,236,244,.16);}',
    '.of-root .of-chart{position:absolute;inset:0;display:flex;flex-direction:column;padding:10px 14px 8px;background:linear-gradient(180deg,rgba(14,32,54,.97),rgba(12,26,46,.97));box-shadow:inset 0 0 0 1px rgba(42,124,160,.75);color:#c7ecf4;font:400 12px/1.3 Pretendard,system-ui,sans-serif;animation:ofChartIn .35s ease;}',
    '.of-root .of-chart .pl,.of-root .of-chart .lg,.of-root .of-chart .ct i,.of-root .of-chart .ct b{filter:hue-rotate(var(--of-chue,0deg));}',
    '.of-root .of-chart .ct{display:flex;align-items:center;gap:6px;font-weight:500;font-size:15px;color:#fff;white-space:nowrap;}',
    '.of-root .of-chart .ct i{display:block;width:8px;height:8px;background:#2a7ca0;flex:none;}',
    '.of-root .of-chart .ct b{margin-left:auto;font-family:Tomorrow,Pretendard,sans-serif;font-weight:400;font-size:18px;color:#00ffd2;}',
    '.of-root .of-chart .ct b small{font:400 11px Pretendard,sans-serif;color:#8ea6b3;margin-left:3px;}',
    '.of-root .of-chart .lg{display:flex;gap:10px;margin-top:3px;font-size:11px;color:#8ea6b3;white-space:nowrap;}',
    '.of-root .of-chart .lg span{display:inline-flex;align-items:center;gap:4px;}',
    '.of-root .of-chart .lg span:before{content:"";width:9px;height:3px;background:var(--c);}',
    '.of-root .of-chart .pl{position:relative;flex:1;min-height:0;margin-top:6px;}',
    '.of-root .of-chart svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;}',
    '.of-root .of-chart .ax{fill:#8ea6b3;font-size:11px;font-family:Pretendard,system-ui,sans-serif;}',
    '.of-root .of-chart .gl{stroke:rgba(142,166,179,.16);stroke-width:1;shape-rendering:crispEdges;}',
    '.of-root .of-chart .bars{position:absolute;inset:0 0 16px;display:flex;align-items:flex-end;justify-content:space-around;gap:8px;}',
    '.of-root .of-chart .bars > div{position:relative;flex:1;max-width:34px;height:100%;display:flex;align-items:flex-end;}',
    '.of-root .of-chart .bars i{display:block;width:100%;background:linear-gradient(180deg,var(--c),rgba(9,182,251,.18));transition:height .9s ' + EASE + ';}',
    '.of-root .of-chart .bars em{position:absolute;left:50%;translate:-50% 0;bottom:calc(var(--h) + 2px);font-style:normal;font-size:11px;color:#e6f7ff;white-space:nowrap;transition:bottom .9s ' + EASE + ';}',
    '.of-root .of-chart .bars u{position:absolute;left:50%;translate:-50% 0;bottom:-16px;text-decoration:none;font-size:11px;color:#8ea6b3;white-space:nowrap;}',
    '.of-root .of-chart .hb{display:flex;flex-direction:column;justify-content:space-around;height:100%;gap:3px;}',
    '.of-root .of-chart .hb > div{display:grid;grid-template-columns:72px 1fr 50px;align-items:center;gap:8px;font-size:12px;}',
    '.of-root .of-chart .hb s{position:relative;display:block;height:8px;background:rgba(142,166,179,.16);overflow:hidden;text-decoration:none;}',
    '.of-root .of-chart .hb s i{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,rgba(9,182,251,.5),var(--c));transition:width .9s ' + EASE + ';}',
    '.of-root .of-chart .hb b{text-align:right;color:#fff;font-weight:500;font-variant-numeric:tabular-nums;}',
    '.of-root .of-chart .arc{transition:stroke-dasharray .9s ' + EASE + ',stroke-dashoffset .9s ' + EASE + ';}',
    '.of-root .of-chart .gv{position:absolute;left:0;right:0;bottom:0;text-align:center;font-family:Tomorrow,Pretendard,sans-serif;font-size:22px;color:#00ffd2;}',
    '.of-root .of-chart .gv small{font:400 12px Pretendard,sans-serif;color:#8ea6b3;margin-left:2px;}',
    '.of-root .of-chart .dn{display:flex;align-items:center;gap:16px;height:100%;}',
    '.of-root .of-chart .dn .ring{position:relative;height:100%;aspect-ratio:1;flex:none;}',
    '.of-root .of-chart .dn .ring b{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Tomorrow,Pretendard,sans-serif;font-weight:400;font-size:17px;color:#fff;}',
    '.of-root .of-chart .dn .ring b small{font:400 10px Pretendard,sans-serif;color:#8ea6b3;}',
    '.of-root .of-chart .dn ul{list-style:none;display:flex;flex-direction:column;gap:4px;font-size:12px;min-width:0;flex:1;}',
    '.of-root .of-chart .dn li{display:flex;align-items:center;gap:6px;white-space:nowrap;}',
    '.of-root .of-chart .dn li:before{content:"";width:9px;height:3px;background:var(--c);flex:none;}',
    '.of-root .of-chart .dn li b{margin-left:auto;color:#fff;font-weight:500;font-variant-numeric:tabular-nums;}',
    '@keyframes ofChartIn{from{opacity:0;}to{opacity:1;}}',
    '.of-root:not([data-theme="dark"]) .of-chartbtn{background:#fff;color:#06365c;}',
    '.of-root:not([data-theme="dark"]) .of-chartmenu{background:#fff;color:#20405a;border-color:#9dbdd2;box-shadow:0 12px 28px rgba(30,60,100,.25);}',
    '.of-root:not([data-theme="dark"]) .of-chartmenu button:hover{background:rgba(0,112,178,.1);color:#06365c;}',
    '.of-root:not([data-theme="dark"]) .of-chartmenu button.cur{background:rgba(0,112,178,.16);color:#06365c;}',
    '.of-root:not([data-theme="dark"]) .of-chart{background:#fff;box-shadow:inset 0 0 0 1px #c5d9e6;color:#20405a;}',
    '.of-root:not([data-theme="dark"]) .of-chart .ct{color:#0e2c47;}',
    '.of-root:not([data-theme="dark"]) .of-chart .ct b,.of-root:not([data-theme="dark"]) .of-chart .gv{color:#00786a;}',
    '.of-root:not([data-theme="dark"]) .of-chart .lg,.of-root:not([data-theme="dark"]) .of-chart .bars u,.of-root:not([data-theme="dark"]) .of-chart .ct b small,.of-root:not([data-theme="dark"]) .of-chart .gv small,.of-root:not([data-theme="dark"]) .of-chart .dn .ring b small{color:#55707f;}',
    '.of-root:not([data-theme="dark"]) .of-chart .ax{fill:#55707f;}',
    '.of-root:not([data-theme="dark"]) .of-chart .gl{stroke:rgba(40,80,110,.14);}',
    '.of-root:not([data-theme="dark"]) .of-chart .bars em,.of-root:not([data-theme="dark"]) .of-chart .hb b,.of-root:not([data-theme="dark"]) .of-chart .dn li b,.of-root:not([data-theme="dark"]) .of-chart .dn .ring b{color:#0e2c47;}',
    '.of-root:not([data-theme="dark"]) .of-chart .hb s{background:rgba(40,80,110,.1);}',
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
  function nameOf(el) { return (el && el.getAttribute && el.getAttribute('data-name')) || ''; }
  function kid(el, name) { return el ? Array.prototype.filter.call(el.children, function (c) { return nameOf(c) === name; })[0] : null; }
  function editing() { return !!document.querySelector('.dtstage.dt-content-editing, .dtstage.dt-editing, .dt-content-editing, .dt-editing'); }
  function layoutEditing(root) { return !!(root.closest('.dt-editing') || root.classList.contains('of-edit-layout')); }
  function load(k) { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function idle() { return typeof window.__wembIdle === 'function' ? window.__wembIdle() : document.hidden; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function comma(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function txt(el) { return (el && el.textContent || '').replace(/\s+/g, ' ').trim(); }
  /* 사용자가 고친 글자는 라이브가 덮지 않는다 */
  function claimed(p) { return p.__ofLast != null && p.textContent !== p.__ofLast; }
  function write(p, s) {
    if (!p || p === document.activeElement || claimed(p)) return;
    if (p.textContent !== s) p.textContent = s;
    p.__ofLast = p.textContent;
  }
  function clickable(el, fn) {
    if (!el || el.__ofClick) return;
    el.__ofClick = 1;
    el.classList.add('of-click');
    el.addEventListener('click', function (e) { if (editing()) return; e.stopPropagation(); fn(e); });
  }
  function frameOf(root) { return root.querySelector(':scope > [data-node-id]'); }
  function imp(el, p, v) { if (el) el.style.setProperty(p, v, 'important'); }
  function goto(scene) {
    if (window.__gotoOfficeScene) { window.__gotoOfficeScene(scene); return; }
    location.href = scene + '.html' + location.search;
  }
  function leaves(el, out) {
    out = out || [];
    Array.prototype.forEach.call(el.children, function (c) {
      if (getComputedStyle(c).display === 'contents') leaves(c, out); else out.push(c);
    });
    return out;
  }
  function base(el) {
    if (!el) return null;
    if (el.__ofB) return el.__ofB;
    var cs = getComputedStyle(el);
    return (el.__ofB = { l: parseFloat(cs.left) || 0, t: parseFloat(cs.top) || 0, w: el.offsetWidth, h: el.offsetHeight });
  }
  function setH(el, dh) { if (el) { var b = base(el); imp(el, 'height', (b.h + dh) + 'px'); } }
  function setW(el, dw) { if (el) { var b = base(el); imp(el, 'width', (b.w + dw) + 'px'); } }
  function setPos(el, dx, dy) { if (el) { var b = base(el); imp(el, 'left', (b.l + dx) + 'px'); imp(el, 'top', (b.t + dy) + 'px'); } }

  /* ══════════════════ 1. 화면 맞추기 ══════════════════
     좌표계는 1920x1080 그대로, 화면 비율만큼 캔버스를 넓혀(VW x VH) 균일 배율 S 로 그린다 — 늘어나는 왜곡도 여백도 없다.
     헤더 · 바탕은 넓어지고, 사이드바 · 본문 판은 남는 높이를 받고, 도크는 바닥에, 오른쪽 덩어리는 오른쪽에 붙는다. */
  function planLayer(frame) {
    var plan = [];
    leaves(frame).forEach(function (el) {
      var cs = getComputedStyle(el);
      if (cs.position !== 'absolute') return;
      var b = base(el), n = nameOf(el);
      if (b.w >= 1880 && b.h >= 900) { plan.push({ el: el, k: 'full' }); return; }
      if (b.w >= 1880 && b.t <= 2) { plan.push({ el: el, k: 'wide' }); return; }
      if (b.w >= 1880) { plan.push({ el: el, k: 'centerX' }); return; }   /* 본문 한 줄(홈) — 늘리면 왼쪽에 몰린다 → 가운데로 */
      if (b.l <= 1 && b.h >= 900) { plan.push({ el: el, k: 'snb' }); return; }
      if (b.h >= 880 && b.w >= 1000) {
        /* 본문 판 안에서 판 폭을 따라가는 것(안쪽 판 · 차트 판 · 선 그림 · 축) — 같이 넓힌다. 퍼센트로 이미 따라가는 것은 둔다 */
        var spread = all(el, '*').filter(function (d) {
          if (d.tagName === 'IMG' || d.closest('[data-name="Legend"]')) return false;
          var w = d.offsetWidth;
          if (w < b.w * 0.55 || getComputedStyle(d).display === 'contents') return false;
          return true;
        }).map(function (d) { base(d); return d; });
        var pr = el.getBoundingClientRect(), k0 = pr.width / b.w || 1;
        spread.forEach(function (d) { d.__ofX = (d.getBoundingClientRect().left - pr.left) / k0; d.__ofW0 = d.getBoundingClientRect().width / k0; });
        /* 선 그림 — 판이 넓어진 만큼 그림 영역 안에서 같은 비율로 늘린다 */
        var lines = all(el, 'img').filter(function (im) { return im.offsetWidth > 200 && !im.closest('[data-name="Legend"]'); }).map(function (im) {
          var a = im.parentElement; while (a && a !== el && spread.indexOf(a) < 0) a = a.parentElement;
          var ir = im.getBoundingClientRect();
          return { im: im, a: a, x: (ir.left - pr.left) / k0, w: ir.width / k0, g: im.closest('[data-name="Chart"]') || el };
        });
        /* 같은 차트의 선들 — 그림 영역 왼쪽 끝(P0)과 폭(PW)을 같이 쓴다 */
        lines.forEach(function (L) {
          var mates = lines.filter(function (m) { return m.g === L.g; });
          L.p0 = Math.min.apply(null, mates.map(function (m) { return m.x; }));
          L.pw = Math.max.apply(null, mates.map(function (m) { return m.x + m.w; })) - L.p0;
        });
        plan.push({ el: el, k: 'panel', spread: spread, lines: lines }); return;
      }
      if (n === 'Dock' || b.t >= 940) { plan.push({ el: el, k: 'bottomC' }); return; }
      if (/^Popup/.test(n) || n === 'Dim') { plan.push({ el: el, k: 'center' }); return; }
      if (b.l + b.w / 2 > 1480) { plan.push({ el: el, k: 'right' }); return; }
      if (b.t >= 780 && b.l < 640) { plan.push({ el: el, k: 'bottomL' }); return; }
      /* 본문 판 위쪽의 줄(층 탭 · 상태 단추 · 건물 선택 · 제목) — 판 왼쪽 끝에 붙어 다닌다 */
      if (b.l >= 380 && b.l < 760 && b.t < 230 && b.h < 60) { plan.push({ el: el, k: 'leftC' }); return; }
      if (b.l >= 380) { plan.push({ el: el, k: 'centerX' }); return; }
    });
    return plan;
  }
  /* D — 사이드바를 접어 본문이 더 받는 폭(접으면 380, 펴면 0). 본문 판은 왼쪽으로 D 만큼 옮겨 가며 D 만큼 넓어진다 */
  function applyPlan(plan, exW, exH, D) {
    D = D || 0;
    var gw = exW + D;
    plan.forEach(function (it) {
      var el = it.el;
      switch (it.k) {
        case 'full': setW(el, exW); setH(el, exH); break;
        case 'wide': setW(el, exW); break;
        case 'snb':
          setH(el, exH); all(el, ':scope > [data-name="Sidebar - Open"]').forEach(function (s) { setH(s, exH); });
          el.style.translate = D ? (-SNB_W) + 'px 0' : '';
          break;
        case 'panel':
          setW(el, gw); setH(el, exH); setPos(el, -D, 0);
          if (gw > 0 && !it.fixed) {
            it.spread.forEach(function (d) { d.style.removeProperty('width'); });
            it.fixed = it.spread.filter(function (d) { return Math.abs(d.offsetWidth - base(d).w) < 1; });
          }
          (it.fixed || []).forEach(function (d) { setW(d, gw); });
          /* 오른쪽에 붙은 것은 넓히면 왼쪽으로 자란다 — 원래 왼쪽 자리로 되돌린다.
             뒤집힌(scaleX -1) 부모 안에서는 left 가 반대로 움직이므로 재 보고 방향을 고른다 */
          if (gw > 0) {
            var pr2 = el.getBoundingClientRect(), k2 = pr2.width / (base(el).w + gw) || 1;
            var offX = function (d) { return (d.getBoundingClientRect().left - pr2.left) / k2; };
            it.spread.forEach(function (d) {
              var dx = d.__ofX - offX(d);
              if (Math.abs(dx) <= 1 || getComputedStyle(d).position !== 'absolute') return;
              var l0 = parseFloat(getComputedStyle(d).left) || 0;
              imp(d, 'right', 'auto'); imp(d, 'left', (l0 + dx) + 'px');
              if (Math.abs(d.__ofX - offX(d)) > Math.abs(dx) * 0.5) imp(d, 'left', (l0 - dx) + 'px');
            });
          }
          /* 선 그림 — 그림 영역(가장 가까운 넓힌 조상) 안에서 같은 비율 자리 · 폭으로. 이동 방향은 재서 정한다 */
          it.lines.forEach(function (L) {
            L.im.style.transform = '';
            if (!gw) return;
            var pr3 = el.getBoundingClientRect(), k3 = pr3.width / (base(el).w + gw) || 1;
            var rel = function () { var r = L.im.getBoundingClientRect(); return { x: (r.left - pr3.left) / k3, w: r.width / k3 }; };
            var kk = (L.pw + gw) / L.pw, wantX = L.p0 + (L.x - L.p0) * kk, wantW = L.w * kk;
            var c0 = rel();
            if (!c0.w) return;
            var sx = wantW / c0.w;
            L.im.style.transformOrigin = '0 0';
            L.im.style.transform = 'scaleX(' + sx.toFixed(4) + ')';
            var c1 = rel();
            L.im.style.transform = 'translateX(10px) scaleX(' + sx.toFixed(4) + ')';
            var f = (rel().x - c1.x) / 10 || 1;
            L.im.style.transform = 'translateX(' + ((wantX - c1.x) / f).toFixed(2) + 'px) scaleX(' + sx.toFixed(4) + ')';
          });
          break;
        case 'bottomC': setPos(el, (exW - D) / 2, exH); break;
        case 'center': setPos(el, (exW - D) / 2, exH / 2); break;
        case 'right': setPos(el, exW, 0); break;
        case 'bottomL': setPos(el, -D, exH); break;
        case 'leftC': setPos(el, -D, 0); break;
        case 'centerX': setPos(el, (exW - D) / 2, exH / 2); break;
      }
    });
  }
  function installFit(root, st) {
    var frame = frameOf(root);
    st.frame = frame;
    var pageH = PAGE_H[st.scene] || 0;
    frame.style.position = 'absolute'; frame.style.left = '0'; frame.style.top = '0';
    frame.style.transformOrigin = '0 0';
    frame.style.width = BASE_W + 'px'; frame.style.height = (pageH || BASE_H) + 'px';
    var plans = planLayer(frame);
    st.plans = plans;
    st.hasSnb = plans.some(function (it) { return it.k === 'snb'; });
    st.D = st.hasSnb && loadSnb() ? SNB_GAIN : 0;
    if (pageH) root.classList.add('of-scroll');
    var header = kid(frame, 'Header');
    function fit() {
      var W = root.clientWidth, H = root.clientHeight;
      if (!W || !H) return;
      var S = Math.min(W / BASE_W, H / BASE_H), VW = W / S, VH = H / S;
      if (pageH) { S = W / BASE_W; VW = BASE_W; VH = H / S; }
      var exW = Math.max(0, VW - BASE_W), exH = Math.max(0, VH - BASE_H);
      if (exW < 0.01) exW = 0;
      if (exH < 0.01) exH = 0;
      st.S = S; st.exW = exW; st.exH = exH; st.VW = BASE_W + exW; st.VH = BASE_H + exH;
      frame.style.width = st.VW + 'px'; frame.style.height = Math.max(st.VH, pageH) + 'px';
      frame.style.transform = S === 1 ? 'none' : 'scale(' + S + ')';
      if (!pageH) applyPlan(plans, exW, exH, st.D);
      if (st.afterFit) st.afterFit();
      else plans.forEach(function (it) { if (it.k === 'full' && base(it.el).h >= pageH - 4) setH(it.el, Math.max(0, VH - pageH)); });
    }
    /* 사이드바를 접고 펼 때 — 끝 모양을 먼저(전환 없이) 재서 정해 두고, 처음 모양으로 되돌린 뒤 전환을 켜고 끝 모양을 입힌다.
       선 차트처럼 '재서 맞추는' 것도 끝 값 그대로 미끄러진다 */
    st.animLayout = function (change, extra) {
      var els = [];
      plans.forEach(function (it) {
        els.push(it.el);
        (it.spread || []).forEach(function (d) { els.push(d); });
        (it.lines || []).forEach(function (L) { els.push(L.im); });
      });
      (extra || []).concat(st.barEls || []).forEach(function (e) { if (e) els.push(e); });
      var before = els.map(function (e) { return e.style.cssText; });
      root.classList.add('of-resizing');
      change();
      fit();
      var after = els.map(function (e) { return e.style.cssText; });
      els.forEach(function (e, i) { e.style.cssText = before[i]; });
      void root.offsetWidth;
      root.classList.remove('of-resizing');
      root.classList.add('of-snbanim');
      void root.offsetWidth;
      els.forEach(function (e, i) { e.style.cssText = after[i]; });
      clearTimeout(st.animT);
      st.animT = setTimeout(function () { root.classList.remove('of-snbanim'); }, 620);
    };
    var rsT = 0;
    function relayout() {
      root.classList.add('of-resizing');
      fit();
      clearTimeout(rsT);
      rsT = setTimeout(function () { root.classList.remove('of-resizing'); }, 140);
    }
    st.fit = fit;
    fit();
    if (pageH && header) {
      header.style.zIndex = '20';
      st.onScroll = function () { header.style.transform = 'translateY(' + (root.scrollTop / (st.S || 1)) + 'px)'; };
      root.addEventListener('scroll', st.onScroll, { passive: true });
    }
    if (window.ResizeObserver) { st.ro = new ResizeObserver(relayout); st.ro.observe(root); }
    else { st.onResize = relayout; window.addEventListener('resize', relayout); }
  }

  /* ══════════════════ 1-2. 사이드바 접기 · 펴기 ══════════════════
     현황 사이드바의 '<' 단추(40x40, #292936, 모서리 12, icon-chevron.svg)를 그대로 쓴다. 필터 사이드바(분석)에는 원본에 단추가 없어
     같은 단추를 같은 자리(사이드바 오른쪽 끝, 위 17px)에 붙인다. 접으면 사이드바가 왼쪽으로 빠지고 본문 판이 그 폭만큼 넓어진다.
     단추는 화면 왼쪽 끝에 남아 화살표가 '>' 로 돈다. 고른 상태는 화면을 옮겨도 이어진다. */
  function installSnb(root, st) {
    var it = (st.plans || []).filter(function (p) { return p.k === 'snb'; })[0];
    if (!it) return;
    var sb = one(it.el, '[data-name="Sidebar - Open"]') || it.el;
    var btn = Array.prototype.filter.call(sb.children, function (c) { return nameOf(c) === 'Button' && c.offsetWidth === 40; })[0];
    if (!btn) {
      var src = (one(st.frame, 'img[src]') || { getAttribute: function () { return './x'; } }).getAttribute('src').replace(/[^/]*$/, '') + 'icon-chevron.svg';
      btn = document.createElement('div');
      btn.className = 'of-snbadd';
      btn.setAttribute('data-name', 'Button');
      /* 원본 단추도 아래 화살표 그림을 90° 돌려 '<' 로 쓴다 */
      btn.innerHTML = '<span style="display:flex;rotate:90deg"><img alt="" src="' + esc(src) + '" width="23" height="23"></span>';
      if (getComputedStyle(sb).position === 'static') sb.style.position = 'relative';
      sb.appendChild(btn);
    }
    btn.classList.add('of-snbbtn');
    btn.title = '메뉴 접기 · 펼치기';
    var left0 = btn.offsetLeft;
    function sync() {
      root.classList.toggle('of-snb-closed', !!st.D);
      /* 사이드바가 통째로 빠지므로 단추는 그만큼 되돌려 왼쪽 끝 20px 에 남긴다 */
      btn.style.translate = st.D ? (SNB_W - left0 + SNB_BTN_X) + 'px 0' : '';
    }
    sync();
    st.onSnb = function (e) {
      e.stopPropagation(); e.preventDefault();
      st.animLayout(function () { st.D = st.D ? 0 : SNB_GAIN; saveSnb(!!st.D); sync(); }, [btn]);
    };
    btn.addEventListener('click', st.onSnb);
    st.snbBtn = btn;
  }

  /* ══════════════════ 2. 시각 ══════════════════
     시안의 날짜 · 시각을 기준 시각(REF)에서 '지금'으로 옮긴다 — 열 때마다 최근 내용처럼 보인다.
     현황의 현재시각은 초 단위로 흐르고, 업데이트 시각은 1분 주기로 바뀐다. 알림 목록 시각은 지금 바로 앞부터 거꾸로 흐른다. */
  function dot(d) { return d.getFullYear() + '.' + p2(d.getMonth() + 1) + '.' + p2(d.getDate()); }
  function hms(d) { return p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds()); }
  function installClock(root, st) {
    var now = Date.now(), shift = now - REF;
    var DAY = 864e5, dayShift = Math.round(shift / DAY) * DAY;
    var texts = all(st.frame, 'p').filter(function (p) { return !p.children.length; });
    /* 현황: '현재시각' · '업데이트' 묶음 — 날짜 줄과 시각 줄이 따로 있다 */
    var clocks = [];
    all(st.frame, 'p').forEach(function (p) {
      var t = txt(p);
      if (t !== '현재시각' && t !== '업데이트') return;
      var box = p.closest('[data-name]');
      for (var i = 0; i < 4 && box; i++) {
        var ps = all(box, 'p').filter(function (q) { return q !== p && /^\d{4}\.\d{2}\.\d{2}\.?$|^\d{2}:\d{2}:\d{2}$/.test(txt(q)); });
        if (ps.length >= 2) { clocks.push({ kind: t, d: ps[0], t: ps[1] }); ps.forEach(function (q) { q.__ofClock = 1; }); break; }
        box = box.parentElement && box.parentElement.closest('[data-name]');
      }
    });
    /* 알림 목록 — 가장 최근 것이 2분 전 */
    var alerts = texts.filter(function (p) { return /^\d{2}:\d{2}$/.test(txt(p)) && p.closest('[data-name^="List Item/Alert"]'); });
    if (alerts.length) {
      var mins = alerts.map(function (p) { var m = txt(p).split(':'); return +m[0] * 60 + +m[1]; });
      var top = Math.max.apply(null, mins), cur = new Date(now - 2 * 6e4);
      alerts.forEach(function (p, i) { var d = new Date(cur.getTime() - (top - mins[i]) * 6e4); write(p, p2(d.getHours()) + ':' + p2(d.getMinutes())); });
    }
    texts.forEach(function (p) {
      if (p.__ofClock) return;
      var t = p.textContent, m;
      if ((m = /^(\d{4})(\d{2})(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(t.trim()))) {
        var d = new Date(new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]).getTime() + dayShift);
        write(p, d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + ' ' + m[4] + ':' + m[5] + ':' + m[6]);
      } else if ((m = /^(\d{4})\.(\d{2})\.(\d{2})( \d{2}:\d{2}:\d{2})?(\.)?$/.exec(t.trim()))) {
        var d2 = new Date(new Date(+m[1], +m[2] - 1, +m[3]).getTime() + dayShift);
        write(p, dot(d2) + (m[4] || '') + (m[5] || ''));
      } else if (/\d{4}년 \d{2}월 \d{2}일/.test(t)) {
        write(p, t.replace(/(\d{4})년 (\d{2})월 (\d{2})일/g, function (a, y, mo, da) { var d3 = new Date(new Date(+y, +mo - 1, +da).getTime() + dayShift); return d3.getFullYear() + '년 ' + p2(d3.getMonth() + 1) + '월 ' + p2(d3.getDate()) + '일'; }));
      }
    });
    if (clocks.length) {
      var tick = function () {
        var d = new Date();
        clocks.forEach(function (c) {
          var at = c.kind === '업데이트' ? new Date(Math.floor(d.getTime() / 6e4) * 6e4) : d;
          write(c.d, dot(at) + '.'); write(c.t, hms(at));
        });
      };
      tick();
      st.timers.push(setInterval(tick, 1000));
    }
  }

  /* ══════════════════ 3. 화면 잇기 · 마우스 오버 표시 ══════════════════ */
  var NAV_TO = { '현황': 'live-work', '분석': 'occ-map', '관리정보': 'admin-home' };
  var DOCK = {
    occ: ['occ-map', 'occ-area', 'occ-group', 'occ-matrix', 'occ-raw'],
    bridge: ['bridge', 'bridge-chart', 'bridge-raw'],
    pattern: ['pattern-main', 'pattern-meeting', 'pattern-desk', 'pattern-collab', 'pattern-raw'],
    room: ['room-main', 'room-chart', 'room-usage', 'room-raw'],
    count: ['count-main', 'count-gate', 'count-floor', 'count-building', 'count-toilet', 'count-brush', 'count-raw'],
  };
  var POPUP_OF = { 'live-work': 'live-used-popup', 'live-work-zoom': 'live-used-popup', 'live-used': 'live-used-popup', 'live-used-zoom': 'live-used-popup', 'live-free': 'live-free-popup', 'live-ghost': 'live-ghost-busy', 'live-after': 'live-free-popup', 'occ-map': 'occ-popup', 'count-main': 'count-single', 'count-single': 'count-multi', bridge: 'bridge-node', 'occ-matrix': 'occ-matrix-hover' };
  var CLOSE_TO = { 'live-used-popup': 'live-used', 'live-free-popup': 'live-free', 'live-ghost-busy': 'live-ghost', 'live-ghost-free': 'live-ghost', 'occ-popup': 'occ-map', 'count-single': 'count-main', 'count-multi': 'count-main', 'bridge-node': 'bridge', 'bridge-link': 'bridge', 'occ-matrix-hover': 'occ-matrix', 'admin-home-popup': 'admin-home', 'admin-space-popup': 'admin-space', 'admin-sensor-popup': 'admin-sensor', 'home-alert': 'home', 'home-setting': 'home', 'home-account': 'home', 'home-privacy': 'home-account' };
  var ZOOM = { 'live-work': 'live-work-zoom', 'live-used': 'live-used-zoom', 'live-work-zoom': 'live-work', 'live-used-zoom': 'live-used' };
  var STATUS_TO = { '사용중': 'live-used', '사용가능': 'live-free', '고스트룸': 'live-ghost' };
  var ADMIN_TO = { '홈 화면 관리': 'admin-home', '시간 설정': 'admin-time', '공간 설정': 'admin-space', '센서 관리': 'admin-sensor', '관리자 계정 목록': 'admin-account', '계정 관리': 'admin-account' };
  function installNav(root, st) {
    var sc = st.scene, fr = st.frame;
    var header = kid(fr, 'Header');
    if (header) {
      all(header, 'p').forEach(function (p) {
        var t = txt(p);
        if (NAV_TO[t]) {
          var item = p.parentElement;
          while (item.parentElement && item.parentElement !== header && item.parentElement.offsetWidth < 400) item = item.parentElement;
          item.classList.add('of-nav');
          clickable(item, function () { goto(NAV_TO[t]); });
        } else if (t === 'SMART OFFICE') { p.classList.add('of-logo'); clickable(p, function () { goto('home'); }); }
      });
      var utils = all(header, '[data-name="Row"] > *');
      var UT = ['home-alert', 'home-setting', 'home-account'];
      utils.forEach(function (u, i) {
        u.classList.add('of-util');
        clickable(u, function () {
          var to = UT[i];
          if (sc === to) { var dp = one(fr, '[data-name="Dropdown Panel"]'); if (dp) { dp.classList.add('of-shut'); setTimeout(function () { goto('home'); }, 260); return; } goto('home'); return; }
          goto(to);
        });
      });
    }
    /* 도크 — 단추 순서대로 같은 묶음의 화면 */
    var dock = one(fr, '[data-name="Dock"]');
    if (dock && DOCK[sec(sc)]) {
      var btns = all(dock, '*').filter(function (e) { return e.offsetWidth === 40 && e.offsetHeight === 40; });
      btns.forEach(function (b, i) { var to = DOCK[sec(sc)][i]; if (!to) return; b.classList.add('of-dock'); clickable(b, function () { goto(to); }); });
    }
    /* 탭(층) */
    var tabs = all(fr, '[data-name="Tab"]').filter(function (t) { return t.offsetWidth > 150; });
    tabs.forEach(function (t) { clickable(t, function () { tabs.forEach(function (x) { x.classList.toggle('of-tab-on', x === t); x.classList.toggle('of-tab-off', x !== t); }); }); });
    /* 방 · 아이콘 → 팝업 화면 */
    if (POPUP_OF[sc]) all(fr, '[data-name^="Room"],[data-name^="Icon/Space"],[data-name="Node"],[data-name="Point"]').forEach(function (r) { if (r.closest('[data-name^="Popup"]')) return; clickable(r, function () { goto(POPUP_OF[sc]); }); });
    /* 상태 필터(사용중 · 사용가능 · 고스트룸) */
    all(fr, '[data-name="Label"],[data-name^="Label/"]').forEach(function (l) { var t = txt(l); if (STATUS_TO[t] && l.offsetWidth < 140 && sec(sc) === 'live') clickable(l, function () { goto(STATUS_TO[t]); }); });
    /* 확대 · 축소 */
    var zb = all(fr, '[data-name="Button/Icon"]').filter(function (b) { return b.offsetWidth === 40 && b.closest('[data-name="Action"]'); });
    zb.forEach(function (b, i) {
      if (ZOOM[sc] && ((i === 0) === !/zoom/.test(sc))) clickable(b, function () { goto(ZOOM[sc]); });
      else clickable(b, function () { var plan = one(fr, '[data-name="Floor Plan"]'); if (!plan) return; st.zoom = clamp((st.zoom || 1) * (i === 0 ? 1.12 : 1 / 1.12), .7, 1.8); plan.style.scale = String(st.zoom); });
    });
    /* 닫기 단추 */
    if (CLOSE_TO[sc]) all(fr, '[data-name^="Button/Icon/Close"],[data-name="Button/Icon"],[data-name="Close"]').forEach(function (b) {
      if (!b.closest('[data-name^="Popup"],[data-name="Dropdown Panel"],[data-name="Title"],[data-name="Header"]')) return;
      if (b.offsetWidth > 32) return;
      clickable(b, function () { goto(CLOSE_TO[sc]); });
    });
    /* 관리정보 — 단추 글자로 */
    all(fr, '[data-name="Button"],[data-name^="Button/"],[data-name="Item"]').forEach(function (b) {
      var t = txt(b);
      if (sec(sc) === 'admin') {
        if (t === '정보보기') clickable(b, function () { goto('admin-home-popup'); });
        if (/^영역 태그 편집$|^편집$/.test(t)) clickable(b, function () { goto('admin-space-popup'); });
        if (t === '상세보기' || t === '센서 정보') clickable(b, function () { goto('admin-sensor-popup'); });
        if ((t === '저장' || t === '취소') && CLOSE_TO[sc]) clickable(b, function () { goto(CLOSE_TO[sc]); });
      }
      if (t === '개인정보처리방침') clickable(b, function () { goto('home-privacy'); });
      if (t === '로그아웃') clickable(b, function () { goto('home'); });
    });
    all(fr, 'p').forEach(function (p) { var t = txt(p); if (ADMIN_TO[t] && p.closest('[data-name="Breadcrumb"],[data-name="Box"]') && p.closest('[data-name="Block"],[data-name="Breadcrumb"]')) { /* 경로 표시 — 그대로 */ } });
    /* 표 줄 */
    all(fr, '[data-name="Data"],[data-name="Row"],[data-name^="Table Row/"]').forEach(function (r) { if (r.children.length >= 4 && r.offsetHeight <= 60) r.classList.add('of-row'); });
    all(fr, '[data-name="Tab"]').forEach(function () {});
  }

  /* ══════════════════ 4. 접기 ══════════════════
     사이드바 — 시간필터 · 공간필터 제목을 누르면 다음 구분선까지의 내용이 부드럽게 접힌다(화살표가 돈다).
     트리 — 화살표가 있는 항목을 누르면 더 안쪽 항목들이 접힌다.
     알림 판(이벤트 목록) — 종 단추로 펴고 접는다(위 화면 잇기). */
  function installFold(root, st) {
    function fold(head, body, arrow) {
      if (!body.length || head.__ofFold) return;
      head.__ofFold = 1;
      head.classList.add('of-fold-head');
      if (arrow) arrow.classList.add('of-arrow');
      body.forEach(function (b) { b.classList.add('of-fold-body'); b.style.maxHeight = (b.offsetHeight + 40) + 'px'; });
      clickable(head, function () {
        var close = !head.classList.contains('of-closed');
        head.classList.toggle('of-closed', close);
        body.forEach(function (b) { if (!close) b.style.maxHeight = (b.scrollHeight + 40) + 'px'; b.classList.toggle('of-gone', close); });
      });
    }
    function after(el) { var o = [], n = el.nextElementSibling; for (; n; n = n.nextElementSibling) o.push(n); return o; }
    all(st.frame, '[data-name="Sidebar - Open"]').forEach(function (sb) {
      /* 묶음 제목(시간필터 · 공간필터) — 같은 부모 안의 뒤 형제들이 내용 */
      all(sb, '[data-name="Title"],[data-name="TItle"]').forEach(function (h) {
        if (h.offsetHeight > 50 || !h.querySelector('p')) return;
        var ic = all(h, '[data-name="Icon"]'), arrow = ic.length > 1 ? ic[ic.length - 1].parentElement : null;
        fold(h, after(h), arrow);
      });
      /* 트리 묶음 — 1단 항목 아래 하위 트리 */
      all(sb, '[data-name="Block"]').forEach(function (b) {
        var h = b.firstElementChild;
        if (!h || nameOf(h) !== 'Tree Item') return;
        fold(h, after(h), h.querySelector('img') && h.querySelector('img').parentElement);
      });
      /* 조건 묶음(기간선택 등) — 제목 줄 아래 입력 */
      all(sb, '[data-name="TreeFilter"]').forEach(function (t) {
        var h = t.firstElementChild;
        if (!h || nameOf(h) !== 'Item') return;
        fold(h, after(h), null);
      });
    });
  }

  /* ══════════════════ 5. 움직이는 차트 · 흐르는 숫자 ══════════════════
     원본 형상은 그대로 두고 값만 흐르게 한다 — 막대는 길이가, 선은 계열마다 높이가 천천히 오르내린다.
     패널 제목 옆에 실시간 점을 찍는다. */
  function panels(fr) {
    return all(fr, '[data-name="Chart"],[data-name^="Widget/"],[data-name^="Card/"]').filter(function (el) {
      if (el.offsetWidth < 280 || el.offsetHeight < 150 || el.offsetWidth > 1460) return false;
      return !all(el, '[data-name="Chart"]').some(function (c) { return c.offsetWidth > 400 && c.offsetHeight > 150; });
    });
  }
  function installLive(root, st) {
    var fr = st.frame;
    st.panels = panels(fr);
    st.panels.forEach(function (p) { p.classList.add('of-panel'); });
    /* 선 차트 — 넓은 선 그림 */
    var lines = [];
    st.panels.forEach(function (p) {
      all(p, 'img').forEach(function (im) {
        var w = im.offsetWidth, h = im.offsetHeight;
        if (w > 200 && h > 40 && h < 420 && !im.closest('[data-name="Legend"]')) { var host = im.parentElement; host.classList.add('of-line'); lines.push(host); }
      });
    });
    /* 막대 — 사각형 · 바 이름 */
    var bars = [];
    all(fr, '[data-name="Graphic"],[data-name="Graph"],[data-name="OUT"],[data-name="IN"],[data-name="Bar Height"],[data-name="Bars"]').forEach(function (g) {
      Array.prototype.forEach.call(g.children, function (c) {
        var w = c.offsetWidth, h = c.offsetHeight;
        if ((w > 6 && h > 6) && !c.querySelector('p, img') && c.tagName !== 'IMG') { c.classList.add('of-bar'); bars.push({ el: c, w: w, h: h, l: c.offsetLeft, horiz: w > h, g: g }); }
      });
    });
    /* 실시간 점 — 패널 제목 오른쪽 */
    st.panels.forEach(function (p) {
      if (!lines.some(function (l) { return p.contains(l); }) && !bars.some(function (b) { return p.contains(b.el); })) return;
      var dotEl = document.createElement('i'); dotEl.className = 'of-livedot';
      dotEl.style.right = '14px'; dotEl.style.top = '14px';
      if (getComputedStyle(p).position === 'static') p.style.position = 'relative';
      p.appendChild(dotEl);
    });
    /* 숫자 — 퍼센트 · 명 · 회 */
    var nums = [];
    all(fr, 'p').forEach(function (p) {
      if (p.children.length) return;
      var t = txt(p);
      if (!/^\d{1,3}(\.\d)?%$|^\d{1,4}$|^\d{1,3}\.\d{2}$/.test(t)) return;
      if (p.closest('[data-name="Header"],[data-name^="Tab"],[data-name="Dock"],[data-name^="Pagination"],[data-name="Axis"],[data-name^="Y"],[data-name="Scale"],[data-name="Ticks"],[data-name="Data"],[data-name^="Th"],[data-name^="Td"],[data-name="Input"],[data-name="Sidebar - Open"],[data-name^="SNB"],[data-name="Tree"],[data-name="Floor"]')) return;
      if (!p.closest('[data-name="Measurement"],[data-name="Value"],[data-name="Count"],[data-name^="Card/"],[data-name="Floor"],[data-name="Item"],[data-name="Legend"],[data-name="Label"],[data-name="Text Wrap"],[data-name="Highlight"],[data-name="Content"],[data-name="Box"]')) return;
      nums.push({ p: p, v0: parseFloat(t), dec: (t.split('.')[1] || '').replace('%', '').length, pct: /%$/.test(t) });
    });
    var step = function () {
      if (idle() || editing()) return;
      lines.forEach(function (l, i) { l.style.scale = '1 ' + rnd(.9, 1.06).toFixed(3); l.style.translate = '0 ' + rnd(-3, 3).toFixed(1) + 'px'; });
      var byG = new Map();
      bars.forEach(function (b) { if (!byG.has(b.g)) byG.set(b.g, []); byG.get(b.g).push(b); });
      byG.forEach(function (list) {
        list.forEach(function (b) { b.k = rnd(.88, 1.1); });
        /* 한 줄에 이어 붙은 가로 막대(쌓은 막대) — 합이 원래 칸을 넘으면 옆 글자를 덮는다 → 넘친 만큼 같이 줄인다 */
        var hz = list.filter(function (b) { return b.horiz; });
        var sum0 = hz.reduce(function (s, b) { return s + b.w; }, 0), sum1 = hz.reduce(function (s, b) { return s + b.w * b.k; }, 0);
        if (hz.length > 1 && sum1 > sum0) hz.forEach(function (b) { b.k *= sum0 / sum1; });
        list.forEach(function (b) {
          var k = b.k;
          if (b.horiz) b.el.style.width = Math.max(4, b.w * barRatio(b) * k).toFixed(1) + 'px';
          else { var nh = Math.max(4, b.h * k); b.el.style.height = nh.toFixed(1) + 'px'; }
        });
      });
      nums.forEach(function (n) {
        if (Math.random() < .55) return;
        var v = n.v0 * rnd(.93, 1.07);
        if (n.pct) v = clamp(v, 0, 100);
        var s = n.dec ? v.toFixed(n.dec) : String(Math.round(v));
        if (n.pct) s += '%';
        write(n.p, s);
        n.p.classList.add('of-tick');
        setTimeout(function () { n.p.classList.remove('of-tick'); }, 700);
      });
    };
    /* 가로 막대 — 그림 칸(Graphic)이 판을 따라 넓어지면 막대 길이도 같은 비율로(사이드바를 접어도 · 화면이 넓어도) */
    function barRatio(b) { var B = base(b.g); return B.w ? b.g.offsetWidth / B.w : 1; }
    st.barEls = bars.map(function (b) { return b.el; });
    st.afterFit = function () { bars.forEach(function (b) { if (b.horiz) b.el.style.width = Math.max(4, b.w * barRatio(b) * (b.k || 1)).toFixed(1) + 'px'; }); };
    st.afterFit();
    st.timers.push(setTimeout(step, 1400));
    st.timers.push(setInterval(step, 3200));
    /* 현황 — 실시간 출입 정보(In · Out · Now) */
    all(fr, '[data-name="Card/Live Info"]').forEach(function (card) {
      var ps = all(card, 'p').filter(function (p) { return /^\d+$/.test(txt(p)); });
      if (ps.length < 3) return;
      var ins = +txt(ps[0]), out = +txt(ps[1]);
      st.timers.push(setInterval(function () {
        if (idle() || editing()) return;
        var a = Math.random() < .6 ? Math.round(rnd(0, 3)) : 0, b = Math.random() < .5 ? Math.round(rnd(0, 2)) : 0;
        ins += a; out = Math.min(ins, out + b);
        write(ps[0], String(ins)); write(ps[1], String(out)); write(ps[2], String(ins - out));
      }, 4000));
    });
  }

  /* ══════════════════ 6. 차트 바꾸기(패널편집 중) ══════════════════ */
  var CC = { bl: '#657aff', vi: '#8e5cff', sk: '#3db2ff', gn: '#2fc27a', am: '#ffb547', re: '#ff5d73', pk: '#ff7ac6' };
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
    el.className = 'of-chart';
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
        s += '<clipPath id="ofc' + spec.uid + '"><rect x="' + L + '" y="0" width="' + (w - L - R) + '" height="' + h + '"/></clipPath><g clip-path="url(#ofc' + spec.uid + ')">';
        data.forEach(function (a, si) {
          var col = spec.series[si][1];
          var pts = a.map(function (v, i) { return X(i).toFixed(1) + ',' + Y(v).toFixed(1); }).join(' ');
          if (spec.k === 'area' || si === 0) {
            s += '<defs><linearGradient id="ofg' + spec.uid + si + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + col + '" stop-opacity="' + (spec.k === 'area' ? .4 : .18) + '"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></linearGradient></defs>';
            s += '<polygon fill="url(#ofg' + spec.uid + si + ')" points="' + X(0).toFixed(1) + ',' + (h - B) + ' ' + pts + ' ' + X(N - 1).toFixed(1) + ',' + (h - B) + '"/>';
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
        + '<defs><linearGradient id="ofgg' + spec.uid + '" x1="0" x2="1"><stop offset="0" stop-color="#2a7ca0"/><stop offset="1" stop-color="' + spec.c + '"/></linearGradient></defs>'
        + '<path d="M8 52a42 42 0 0 1 84 0" fill="none" stroke="rgba(142,166,179,.2)" stroke-width="8"/>'
        + '<path class="arc" d="M8 52a42 42 0 0 1 84 0" fill="none" stroke="url(#ofgg' + spec.uid + ')" stroke-width="8" stroke-dasharray="0 ' + LEN.toFixed(1) + '"/>'
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
    var rot = ((h - 232 + 540) % 360) - 180;
    root.style.setProperty('--of-chue', (Math.abs(rot) < 3 ? 0 : Math.round(rot)) + 'deg');
  }
  var HOURS = ['09시', '10시', '11시', '12시', '13시', '14시', '15시', '16시', '17시', '18시'];
  var DAYS = ['월', '화', '수', '목', '금'];
  var ROOMS = ['N01', 'N03', 'N04', 'E05', 'E06', 'S07', 'S09'];
  var FLOORS = ['13F', '14F', '30F', '31F', '32F', '33F'];
  var SPACE = [['업무공간', CC.bl, 30], ['몰입공간', CC.pk, 20], ['협업공간', CC.gn, 18], ['교류공간', CC.am, 11], ['기타', CC.re, 21]];
  var LIB = {
    occ: [
      { k: 'line', t: '시간대별 평균 점유율', unit: '%', series: [['회의실', CC.vi, 58, 14], ['업무공간', CC.am, 64, 10], ['포커스룸', CC.sk, 41, 12]], lo: 0, hi: 100 },
      { k: 'bar', t: '영역별 평균 점유율', unit: '%', cats: ROOMS, vals: [67, 73, 49, 39, 73, 79, 52], max: 100, c: CC.bl },
      { k: 'donut', t: '공간 유형별 점유 비중', unit: '%', parts: SPACE },
      { k: 'gauge', t: '층 평균 점유율', unit: '%', v: [55, 4], max: 100, c: CC.bl, dec: 0 },
    ],
    count: [
      { k: 'line', t: '시간대별 IN/OUT', unit: '명', series: [['IN', CC.bl, 420, 160], ['OUT', CC.am, 360, 140]], lo: 0, hi: 1000 },
      { k: 'hbar', t: '층별 평균 IN', unit: '명', cats: FLOORS, vals: [42, 76, 63, 79, 58, 44], max: 90, c: CC.bl },
      { k: 'bar', t: '출입구별 평균 IN', unit: '명', cats: ['MAIN N01', 'MAIN S02', 'E/V N01', 'E/V S01', 'ST N01'], vals: [80, 64, 38, 31, 12], max: 100, c: CC.vi },
      { k: 'donut', t: '남녀 이용 비율', unit: '%', parts: [['남', CC.bl, 54], ['여', CC.pk, 46]] },
    ],
    room: [
      { k: 'hbar', t: '회의실별 실사용률', unit: '%', cats: ROOMS, vals: [67, 73, 49, 39, 73, 79, 52], max: 100, c: CC.bl },
      { k: 'bar', t: '시간대별 자동 반환 횟수', unit: '회', cats: HOURS, vals: [2, 4, 6, 3, 1, 5, 7, 4, 2, 1], max: 8, c: CC.vi },
      { k: 'donut', t: '회의실 시간 구성', unit: '%', parts: [['예약 사용', CC.bl, 58], ['미예약 사용', CC.sk, 9], ['고스트룸', CC.vi, 18], ['대기', CC.am, 15]] },
      { k: 'gauge', t: '예약 대비 실사용률', unit: '%', v: [67, 4], max: 100, c: CC.gn, dec: 0 },
    ],
    pattern: [
      { k: 'bar', t: '요일별 세렌디피티 발생', unit: '회', cats: DAYS, vals: [8, 7, 11, 9, 7], max: 14, c: CC.vi },
      { k: 'line', t: '시간대별 협업 횟수', unit: '회', series: [['계획된 협업', CC.bl, 6, 3], ['세렌디피티', CC.pk, 4, 2]], lo: 0, hi: 14 },
      { k: 'donut', t: '협업 발생 장소', unit: '%', parts: [['회의실', CC.bl, 46], ['팀워크룸', CC.vi, 18], ['업무공간', CC.am, 14], ['팀테이블', CC.gn, 12], ['복도', CC.re, 10]] },
      { k: 'gauge', t: '스탠딩데스크 사용률', unit: '%', v: [42, 5], max: 100, c: CC.gn, dec: 0 },
    ],
    bridge: [
      { k: 'line', t: '시간대별 작용 횟수 합계', unit: '회', series: [['작용', CC.bl, 360, 140]], lo: 0, hi: 1000 },
      { k: 'hbar', t: '링크 횟수 상위 영역', unit: '회', cats: ['N01↔N03', 'N03↔E05', 'N01↔캔틴', 'E05↔S09', 'S07↔N04'], vals: [86, 72, 58, 41, 33], max: 100, c: CC.vi },
      { k: 'donut', t: '공간 유형별 링크 비중', unit: '%', parts: SPACE },
    ],
    home: [
      { k: 'donut', t: '공간 유형별 재실 비중', unit: '%', parts: SPACE },
      { k: 'line', t: '시간대별 평균 재실 인원', unit: '명', series: [['재실', CC.bl, 150, 40]], lo: 0, hi: 260 },
      { k: 'bar', t: '층별 평균 재실 인원', unit: '명', cats: FLOORS, vals: [64, 118, 186, 142, 97, 71], max: 220, c: CC.bl },
      { k: 'gauge', t: '업무 좌석 평균 사용률', unit: '%', v: [68, 4], max: 100, c: CC.gn, dec: 0 },
    ],
    live: [
      { k: 'donut', t: '실시간 재실 정보', unit: '%', parts: SPACE },
      { k: 'line', t: '실시간 IN/OUT', unit: '명', series: [['IN', CC.bl, 18, 8], ['OUT', CC.am, 12, 6]], lo: 0, hi: 40 },
      { k: 'gauge', t: '층 재실률', unit: '%', v: [64, 6], max: 100, c: CC.bl, dec: 0 },
    ],
    admin: [
      { k: 'donut', t: '센서 상태', unit: '대', parts: [['Online', CC.gn, 18], ['Offline', CC.am, 3], ['Error', CC.re, 1], ['Disconnected', CC.vi, 2]] },
      { k: 'bar', t: '층별 좌석 수', unit: '석', cats: FLOORS, vals: [150, 164, 142, 158, 136, 148], max: 180, c: CC.bl },
    ],
  };
  function targets(root, st) {
    var list = LIB[sec(st.scene)] || LIB.home;
    return (st.panels || []).filter(function (p) { return p.offsetWidth >= 280 && p.offsetHeight >= 150; }).map(function (p, i) {
      var title = null;
      for (var k = 0; k < p.children.length; k++) { var c = p.children[k]; if (c.querySelector('p') && c.offsetHeight <= 60) { title = c; break; } }
      var hide = Array.prototype.filter.call(p.children, function (c) { return !c.classList.contains('of-livedot'); });
      var S = st.S || 1, tH = title ? (title.getBoundingClientRect().bottom - p.getBoundingClientRect().top) / S + 10 : 18;
      var t0 = title ? txt(title) : '';
      /* 제목에 맞는 차트를 앞으로 — 추천 */
      var ordered = list.slice().sort(function (a, b) { return score(b, t0) - score(a, t0); });
      return { key: nameOf(p) + '#' + (p.getAttribute('data-node-id') || i), w: p, hide: hide, list: ordered, box: { l: 0, t: 0, r: 0, b: 0 } };
    });
  }
  function score(s, t) {
    var sc = 0;
    if (/비율|비중|구성|유형/.test(t) && s.k === 'donut') sc += 3;
    if (/시간대|추이|IN\/OUT|횟수 합계/.test(t) && s.k === 'line') sc += 3;
    if (/별|층|회의실|출입구/.test(t) && (s.k === 'bar' || s.k === 'hbar')) sc += 2;
    if (/률|율/.test(t) && s.k === 'gauge') sc += 1;
    return sc;
  }
  function installChartSwap(root, st) {
    var saved = load(K_CHART)[st.scene] || {};
    st.charts = {}; st.chartApply = {};
    var probe = document.createElement('i');
    probe.className = 'of-probe';
    st.frame.appendChild(probe);
    targets(root, st).forEach(function (tg) {
      if (getComputedStyle(tg.w).position === 'static') tg.w.style.position = 'relative';
      var host = document.createElement('div');
      host.className = 'of-host';
      host.style.left = tg.box.l + 'px'; host.style.top = tg.box.t + 'px'; host.style.right = tg.box.r + 'px'; host.style.bottom = tg.box.b + 'px';
      tg.w.appendChild(host);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'of-chartbtn';
      btn.innerHTML = KIND_ICON.bar.replace('class="ic"', 'class="ic" style="width:13px;height:11px"') + '차트';
      btn.title = '이 패널의 차트 바꾸기';
      var menu = document.createElement('div');
      menu.className = 'of-chartmenu';
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
        tg.w.classList.toggle('of-swapped', i >= 0);
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
        all(root, '.of-chartmenu.open').forEach(function (m) { if (m !== menu) m.classList.remove('open'); });
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
      if (e.target.closest && e.target.closest('.of-chartmenu, .of-chartbtn')) return;
      all(root, '.of-chartmenu.open').forEach(function (m) { m.classList.remove('open'); });
    };
    document.addEventListener('pointerdown', st.onDocDown, true);
  }

  /* ══════════════════ 7. 패널 옮기기 ══════════════════
     같은 부모 안의 같은 크기 패널은 놓는 자리와 맞바꾼다 — FLIP 으로 미끄러진다. 그 밖의 패널은 4px 격자 자유 이동. */
  function installPanelMove(root, st) {
    var LS = load(K_LAYOUT), me = LS[st.scene] = LS[st.scene] || {};
    function persist() { var a = load(K_LAYOUT); a[st.scene] = me; save(K_LAYOUT, a); }
    me.free = me.free || {};
    var list = (st.panels || []).slice();
    all(st.frame, '[data-name="Floor Plan"],[data-name="Dropdown Panel"]').forEach(function (e) { if (e.offsetWidth > 200) list.push(e); });
    function sid(el) { return nameOf(el) + '#' + el.getAttribute('data-node-id'); }
    list.forEach(function (el) {
      el.classList.add('of-mv');
      var s = me.free[sid(el)];
      if (s) { el.__ux = s[0]; el.__uy = s[1]; el.style.translate = s[0] + 'px ' + s[1] + 'px'; }
    });
    var drag = null, over = null;
    function sameSize(a, b) { return a !== b && a.parentElement === b.parentElement && Math.abs(a.offsetWidth - b.offsetWidth) < 4 && Math.abs(a.offsetHeight - b.offsetHeight) < 4; }
    st.onDown = function (e) {
      if (!layoutEditing(root) || e.button !== 0) return;
      if (e.target.closest('.of-chartbtn, .of-chartmenu, .of-resetbtn')) return;
      if (e.target.closest('[contenteditable="true"]')) return;
      var w = e.target.closest('.of-mv');
      if (!w || !root.contains(w)) return;
      e.preventDefault(); e.stopPropagation();
      drag = { w: w, sx: e.clientX, sy: e.clientY, moved: false, dx: 0, dy: 0 };
    };
    st.onMove = function (e) {
      if (!drag) return;
      var S = st.S || 1, dx = (e.clientX - drag.sx) / S, dy = (e.clientY - drag.sy) / S;
      if (!drag.moved) { if (Math.hypot(dx, dy) < 3) return; drag.moved = true; drag.w.classList.add('of-dragging'); }
      drag.dx = dx; drag.dy = dy;
      drag.w.style.translate = ((drag.w.__ux || 0) + dx).toFixed(1) + 'px ' + ((drag.w.__uy || 0) + dy).toFixed(1) + 'px';
      var hit = null;
      list.forEach(function (o) {
        if (!sameSize(o, drag.w)) return;
        var r = o.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) hit = o;
      });
      if (over && over !== hit) over.classList.remove('of-drop');
      over = hit; if (over) over.classList.add('of-drop');
    };
    st.onUp = function () {
      if (!drag) return;
      var d = drag; drag = null;
      d.w.classList.remove('of-dragging');
      if (!d.moved) return;
      if (over) {
        /* 같은 크기 — 문서 순서를 맞바꾸고 FLIP 으로 미끄러뜨린다 */
        var a = d.w, b = over; over.classList.remove('of-drop'); over = null;
        a.style.translate = ''; a.__ux = a.__uy = 0; delete me.free[sid(a)];
        var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        var pa = a.parentElement, na = a.nextSibling === b ? a : a.nextSibling;
        pa.insertBefore(a, b); pa.insertBefore(b, na);
        [[a, ra], [b, rb]].forEach(function (x) {
          var el = x[0], r0 = x[1], r1 = el.getBoundingClientRect(), S = st.S || 1;
          el.style.transition = 'none'; el.style.translate = ((r0.left - r1.left) / S).toFixed(1) + 'px ' + ((r0.top - r1.top) / S).toFixed(1) + 'px';
          void el.offsetWidth; el.style.transition = 'translate .5s ' + EASE; el.style.translate = '';
          setTimeout(function () { el.style.transition = ''; }, 560);
        });
        me.order = me.order || {}; me.order[sid(a)] = sid(b);
        persist();
        return;
      }
      var snap = function (v) { return Math.round(v / 4) * 4; };
      var nx = snap((d.w.__ux || 0) + d.dx), ny = snap((d.w.__uy || 0) + d.dy);
      d.w.__ux = nx; d.w.__uy = ny; d.w.style.translate = nx + 'px ' + ny + 'px';
      me.free[sid(d.w)] = [nx, ny];
      persist();
    };
    root.addEventListener('pointerdown', st.onDown, true);
    window.addEventListener('pointermove', st.onMove);
    window.addEventListener('pointerup', st.onUp);
    window.addEventListener('pointercancel', st.onUp);
    st.onDragStart = function (e) { if (layoutEditing(root) && e.target.closest && e.target.closest('.of-mv')) e.preventDefault(); };
    root.addEventListener('dragstart', st.onDragStart);
    st.resetLayout = function () {
      me = { free: {} };
      var a = load(K_LAYOUT); a[st.scene] = me; save(K_LAYOUT, a);
      list.forEach(function (e) { e.__ux = 0; e.__uy = 0; e.style.translate = ''; });
      Object.keys(st.chartApply || {}).forEach(function (k) { st.chartApply[k](-1); });
      st.fit();
    };
    if (!list.length) return;
    var rb = document.createElement('button');
    rb.type = 'button';
    rb.className = 'of-resetbtn';
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
    [['fit', installFit], ['snb', installSnb], ['clock', installClock], ['nav', installNav], ['fold', installFold], ['live', installLive], ['swap', installChartSwap], ['move', installPanelMove]]
      .forEach(function (s) { try { s[1](root, st); } catch (e) { console.warn('[of] ' + s[0], e); } });
    if (st.fit) st.fit();
    root.classList.add('of-enter');
    st.timers.push(setTimeout(function () { root.classList.remove('of-enter'); }, 1400));
  }
  function initOffice(root) {
    if (!root || root.__of) return;
    injectStyle();
    root.classList.add('of-root');
    var px = /(of[a-z]{2})-root/.exec(root.className);
    var st = root.__of = { timers: [], px: px ? px[1] : 'ofha', scene: px ? SCENES[px[1]] : 'home' };
    if (/[?&]edit=1/.test(location.search)) root.classList.add('of-edit-layout');
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
  function disposeOffice(root) {
    var st = root && root.__of;
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
    if (st.onSnb && st.snbBtn) st.snbBtn.removeEventListener('click', st.onSnb);
    clearTimeout(st.animT);
    root.__of = null;
  }
  window.initOffice = initOffice;
  window.disposeOffice = disposeOffice;
})();
