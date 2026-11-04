/* STATCOM HMI 디지털 트윈 — 재구축 화면 11장의 인터랙션 · 라이브 · 반응형 레이어.
   window.initStatcom(root) / window.disposeStatcom(root)

   화면(DOM·CSS)은 생성기(src/statcom/_gen/conv.js)가 Figma(lyDJkcOlrznLKWo7mD7C2n) 그대로 만든다.
   이 파일은 그 위에 '움직이는 것'만 얹는다 — 정지 상태(?live=0) = Figma 원본.

   · 반응형 — 1920x1080 좌표계 + 균일 배율 S. 남는 폭 · 높이는 헤더 · 사이드 메뉴 · 장면 그림이 나눠 갖는다. 정확히 16:9 면 Figma 와 같다.
   · 실시간 시계 · 알림 메세지는 열 때마다 최근 시각
   · 마우스 오버 · 눌림 — Icon Button 은 Figma 변형(Hover · Pressed) 값 그대로
   · 접기 — 왼쪽 패널 · 미니맵의 Panel Toggle
   · 라이브 — 수치 · 진행 막대 · 운전점 · 스파크라인 · 서브모듈 상태 · 공정 재생 · 새 알림. 사람이 고친 글자는 덮지 않는다.
   · 차트 바꾸기(패널편집 중) — 위젯마다 STATCOM 설비에 맞춘 추천 차트. 첫 항목 = 추천, '원본 그대로'로 되돌린다.
   · 패널 옮기기(패널편집 중) — 왼쪽 패널 위젯은 위아래로 흐르며 다시 쌓이고, 설비 카드는 자리끼리, 미니맵 · 호버 카드는 4px 격자로 옮긴다.

   손으로 쓴 파일이다(생성물 아님). 고친 뒤 js/core/tpl-modules.js 의 ?v= 를 올릴 것. */
(function () {
  'use strict';

  var BASE_W = 1920, BASE_H = 1080;
  var K_LAYOUT = 'wemb-statcom-layout', K_CHART = 'wemb-statcom-chart', K_FOLD = 'wemb-statcom-fold';
  var STYLE_ID = 'statcom-live-style';
  var EASE = 'cubic-bezier(.22,.8,.24,1)';
  var SCENES = { tcl: 'login', tcm: 'main', tcs: 'statcom', tcp: 'power', tcv: 'valve', tcc: 'cooling', tce: 'supply', tcn: 'safety', tcu: 'simulation', tca: 'alarm', tcq: 'cards', tvt: 'vr-topic', tvm: 'vr-menu', tvs: 'vr-step', tvo: 'vr-overview' };
  var NAV = { 'STATCOM': 'statcom', 'Power Equipment': 'power', 'VSC Valve Room': 'valve', 'VSC Cooling Room': 'cooling', 'Power Supply': 'supply', 'Control Safety': 'safety', 'Simulation': 'simulation', 'Alarm Message': 'alarm' };
  var CARD_SCENE = { 'STATCOM': 'statcom', 'Cooling System': 'cooling', 'MMC Valve': 'valve', 'Control Panel': 'safety', 'Transformer': 'power', 'DC System': 'supply', 'AC Filter': 'power', 'Protection System': 'safety' };

  /* ══════════════════ 스타일 ══════════════════ */
  var CSS = [
    '.tc-root{--tc-acc:0,185,240;overflow:clip!important;}',
    '.tc-root.tc-resizing *,.tc-root .tc-dragging,.tc-root .tc-dragging *{transition:none!important;}',
    '.tc-root.tc-live .tc-place{transition:translate .5s ' + EASE + ',opacity .3s ease,scale .25s ease;}',
    '.tc-root .tc-probe{position:absolute;width:0;height:0;overflow:hidden;color:#00b9f0;}',
    '.tc-root .tc-click{cursor:pointer;}',
    '.tc-root .tc-click *{cursor:inherit;}',
    '.dt-content-editing .tc-root .tc-click,.dt-content-editing .tc-root .tc-click *{cursor:text;}',
    /* 처음 들어올 때 — 위젯이 차례로 떠오른다 */
    '@keyframes tcIn{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}',
    '.tc-root.tc-enter [data-name="Side Panel"] > *{animation:tcIn .42s ' + EASE + ' both;animation-delay:calc(var(--i,0) * 45ms);}',
    '.tc-root.tc-enter [data-name^="Equipment Card/"]{animation:tcIn .42s ' + EASE + ' both;animation-delay:calc(var(--i,0) * 40ms);}',

    /* 사이드 메뉴 */
    '.tc-root [data-name^="Nav Item"]{transition:translate .18s ease;}',
    '.tc-root [data-name^="Nav Item"] > div:first-child{transition:filter .2s ease,scale .2s ease;}',
    '.tc-root [data-name^="Nav Item/"] > div:last-child p{transition:color .2s ease;}',
    '.tc-root [data-name^="Nav Item/"]:hover > div:first-child{filter:brightness(1.45) drop-shadow(0 0 7px rgba(var(--tc-acc),.65));scale:1.05;}',
    '.tc-root [data-name^="Nav Item/"]:hover > div:last-child{color:#c6dcf5!important;}',
    '.tc-root [data-name^="Nav Item/"]:active{translate:0 1px;}',
    '.tc-root [data-name="Side Menu"]{transition:width .5s ' + EASE + ';}',
    '.tc-root.tc-resizing [data-name="Side Menu"]{transition:none;}',
    '.tc-root [data-name="Side Panel"]{overflow:hidden;transition:width .5s ' + EASE + ',padding .5s ' + EASE + ',opacity .3s ease;}',
    '.tc-root .tc-folded [data-name="Side Panel"]{width:0!important;padding-left:0!important;padding-right:0!important;opacity:0;}',
    '.tc-root [data-name="Side Panel"]{overflow:visible;}',
    '.tc-root .tc-folded [data-name="Side Panel"]{overflow:hidden;}',
    /* 접기 단추 */
    '.tc-root [data-name="Panel Toggle"]{transition:filter .2s ease;cursor:pointer;}',
    '.tc-root [data-name="Panel Toggle"]:hover{filter:brightness(1.45);}',
    '.tc-root [data-name="Panel Toggle"]:active{filter:brightness(.9);}',
    '.tc-root [data-name="Icon/Action/Chevron"]{transition:rotate .45s ' + EASE + ';}',
    '.tc-root .tc-folded [data-name="Icon/Action/Chevron"],.tc-root .tc-mm-closed [data-name="Icon/Action/Chevron"]{rotate:180deg;}',
    '.tc-root .tc-mm-tab{z-index:6;cursor:pointer;transition:translate .5s ' + EASE + ',opacity .3s ease,filter .2s ease;}',
    '.tc-root .tc-mm-tab:hover{filter:brightness(1.25);}',
    '.tc-root .tc-mm-open-state .tc-mm-tab,.tc-root .tc-mm-tab.tc-off{opacity:0;pointer-events:none;}',
    '.tc-root [data-name="Minimap"]{z-index:5;}',
    '.tc-root [data-name="Minimap"] [data-name="Card"] > *{transition:opacity .3s ease;}',
    '.tc-root .tc-mm-closed [data-name="Card"] > *{opacity:0;pointer-events:none;}',
    '.tc-root [data-name^="Dot/"]{cursor:pointer;transition:background-color .3s ease,scale .2s ease;}',
    '.tc-root [data-name^="Dot/"]:hover{scale:1.5;}',

    /* 헤더 단추 — Figma Icon Button 변형 그대로(Idle · Hover · Pressed) */
    '.tc-root [data-name="Actions"] > [data-name^="Button/"]{cursor:pointer;transition:filter .18s ease,box-shadow .18s ease;}',
    '.tc-root [data-name="Actions"] > [data-name^="Button/"]:hover{background-image:linear-gradient(-32.36deg,rgba(145,211,255,0) 55.8%,rgba(145,211,255,.2) 88.6%),linear-gradient(90deg,#05396c,#05396c)!important;}',
    '.tc-root [data-name="Actions"] > [data-name^="Button/"]:active{background-image:linear-gradient(-32.36deg,rgba(145,211,255,.2) 12.55%,rgba(145,211,255,0) 45.35%),linear-gradient(90deg,#002b55,#002b55)!important;box-shadow:inset 0 0 10px rgba(0,0,0,.6);}',

    /* 위젯 안 */
    '.tc-root [data-name^="Metric/"],.tc-root [data-name^="Field/"],.tc-root [data-name^="Option/"],.tc-root [data-name^="Control/"],.tc-root [data-name="Card"],.tc-root [data-name^="Message Item"] [data-name="Bubble"],.tc-root [data-name^="Tab/"],.tc-root [data-name^="Button/"],.tc-root [data-name="Thumbnail"]{transition:translate .2s ease,filter .2s ease,background-color .2s ease;}',
    '.tc-root [data-name^="Metric/"]:hover{translate:0 -1px;filter:brightness(1.18);}',
    '.tc-root [data-name^="Field/"]:hover{filter:brightness(1.22);}',
    '.tc-root [data-name^="Option/"]{cursor:pointer;}',
    '.tc-root [data-name^="Option/"]:hover{filter:brightness(1.28);}',
    '.tc-root [data-name^="Option/"]:active{translate:0 1px;}',
    '.tc-root [data-name^="Control/"]{cursor:pointer;}',
    '.tc-root [data-name^="Control/"]:hover{translate:0 -1px;filter:brightness(1.35);}',
    '.tc-root [data-name^="Control/"]:active{translate:0 1px;filter:brightness(.9);}',
    '.tc-root [data-name^="Control/"].tc-off{filter:saturate(.25) brightness(.85);}',
    '.tc-root [data-name^="Control/"].tc-on{filter:brightness(1.3);box-shadow:inset 0 0 0 1px rgba(var(--tc-acc),.7);}',
    '.tc-root [data-name^="Tab/"]{cursor:pointer;}',
    '.tc-root [data-name^="Tab/"]:hover{filter:brightness(1.25);}',
    '.tc-root [data-name="Button/Confirm All"]{cursor:pointer;transition:filter .2s ease;}',
    '.tc-root [data-name="Button/Confirm All"]:hover{filter:brightness(1.35);}',
    '.tc-root [data-name="Button/Sign Up"],.tc-root [data-name="Button/STATCOM Monitoring"]{cursor:pointer;}',
    '.tc-root [data-name="Button/Sign Up"]:hover,.tc-root [data-name="Button/STATCOM Monitoring"]:hover{filter:brightness(1.14);translate:0 -1px;}',
    '.tc-root [data-name="Button/Sign Up"]:active,.tc-root [data-name="Button/STATCOM Monitoring"]:active{filter:brightness(.92);translate:0 1px;}',
    '.tc-root [data-name="Input"]{transition:filter .2s ease;}',
    '.tc-root [data-name="Input"]:hover{filter:brightness(1.3);}',
    '.tc-root [data-name^="Option/Remember"] [data-name="Radio"]{transition:opacity .2s ease;}',
    '.tc-root [data-name^="Option/Remember"].tc-off [data-name="Radio"]{opacity:.35;}',
    '.tc-root [data-name="Thumbnail"]:hover{filter:brightness(1.18);}',
    '.tc-root [data-name^="Message Item"]{cursor:pointer;transition:height .35s ' + EASE + ',opacity .3s ease;}',
    '.tc-root [data-name^="Message Item"]:hover [data-name="Bubble"]{filter:brightness(1.22);}',
    '.tc-root [data-name^="Message Item"] [data-name="Marker"]{transition:opacity .25s ease;animation:tcPulse 2.2s ease-in-out infinite;}',
    '.tc-root [data-name^="Message Item"].tc-read [data-name="Marker"]{opacity:0;animation:none;}',
    '@keyframes tcPulse{0%,100%{box-shadow:0 0 0 0 rgba(var(--tc-acc),.55);}60%{box-shadow:0 0 0 5px rgba(var(--tc-acc),0);}}',
    '.tc-root [data-name^="Message Item"].tc-new{overflow:hidden;}',
    /* 서브모듈 */
    '.tc-root [data-name^="Submodule/"]{cursor:pointer;transition:background-color .55s ease,scale .16s ease,filter .16s ease;}',
    '.tc-root [data-name^="Submodule/"]:hover{scale:1.45;filter:brightness(1.3);z-index:3;}',
    '.tc-root [data-tc-state="Fault"]{animation:tcBlink 1.5s ease-in-out infinite;}',
    '@keyframes tcBlink{0%,100%{opacity:1;}50%{opacity:.5;}}',
    /* 호버 카드 · 설비 카드 */
    '.tc-root [data-name^="Hover Card"]{z-index:4;}',
    '.tc-root [data-name^="Hover Card"].tc-off{opacity:0;scale:.97;pointer-events:none;}',
    '.tc-root [data-name="Close Button"]{cursor:pointer;transition:scale .18s ease,filter .18s ease;}',
    '.tc-root [data-name="Close Button"]:hover{scale:1.2;filter:brightness(1.5);}',
    '.tc-root [data-name^="Equipment Card/"]{transition:translate .5s ' + EASE + ',filter .22s ease;}',
    '.tc-root [data-name^="Equipment Card/"].tc-link{cursor:pointer;}',
    '.tc-root [data-name^="Equipment Card/"]:hover{filter:brightness(1.1) drop-shadow(0 10px 22px rgba(0,120,200,.28));}',
    '.tc-root [data-name^="Status Chip"] [data-name="Marker"]{animation:tcBreath 2.6s ease-in-out infinite;}',
    '@keyframes tcBreath{0%,100%{opacity:1;}50%{opacity:.55;}}',
    '.tc-root [data-name="Fill"],.tc-root [data-name="Marker"][data-node-id$=";1:668"]{transition:width .85s ' + EASE + ',left .85s ' + EASE + ';}',
    '.tc-root [data-name="Timeline"] [data-name="Fill"],.tc-root [data-name^="Process Step/"] [data-name="Fill"]{transition:width .4s linear;}',
    '.tc-root [data-name="Timeline"] [data-name="Handle"]{transition:margin-left .4s linear;cursor:grab;}',
    '.tc-root [data-name^="Process Step/"] [data-name="Handle"],.tc-root [data-name^="Process Step/"] [data-name="Tooltip BG"],.tc-root [data-name^="Process Step/"] [data-name="Tooltip Label"]{transition:translate .4s linear;}',
    '.tc-root [data-name^="Process Step/"]{cursor:pointer;}',
    '.tc-root [data-name^="Process Step/"]:hover [data-name="Thumbnail"]{filter:brightness(1.2);}',
    /* VR */
    '.tc-root [data-name="Fill Group"]{transition:width .6s linear;}',
    '.tc-root [data-name="Handle"][data-node-id="1:4936"]{animation:tcBreath 2.2s ease-in-out infinite;}',
    '.tc-root .tc-vr-btn{cursor:pointer;transition:translate .16s ease,filter .18s ease;}',
    '.tc-root .tc-vr-btn p{transition:color .18s ease;}',
    '.tc-root .tc-vr-btn:hover{filter:brightness(1.14);}',
    '.tc-root .tc-vr-btn.tc-vr-on p{color:#f1f1f1!important;}',
    '.tc-root[data-theme="light"] .tc-vr-btn.tc-vr-on p{color:#15253a!important;}',
    '.tc-root .tc-vr-btn:active,.tc-root .tc-vr-btn.tc-vr-press{translate:0 1px;filter:brightness(.85);}',
    '.tc-root [data-name^="Popup/"]{transition:translate .5s ' + EASE + ';z-index:3;}',
    /* 인라인 스파크라인 */
    '.tc-root svg.ls-inl{display:block;width:100%;height:100%;overflow:visible;}',

    /* 패널편집 */
    '.dt-editing .tc-root .tc-mv,.tc-root.tc-edit-layout .tc-mv{cursor:grab!important;}',
    '.dt-editing .tc-root .tc-mv *,.tc-root.tc-edit-layout .tc-mv *{cursor:grab!important;}',
    '.dt-editing .tc-root .tc-mv:hover,.tc-root.tc-edit-layout .tc-mv:hover{outline:1px dashed rgba(var(--tc-acc),.75);outline-offset:3px;}',
    '.tc-root .tc-mv{transition:translate .25s ' + EASE + ';}',
    '.tc-root .tc-mv.tc-dragging{z-index:30;filter:drop-shadow(0 14px 22px rgba(0,0,0,.5));cursor:grabbing!important;}',
    '.tc-root .tc-resetbtn{position:absolute;left:300px;top:14px;z-index:45;display:none;height:30px;padding:0 12px;border:1px solid rgb(var(--tc-acc));border-radius:6px;background:#102a48;color:#e6f7ff;font:500 13px/1 "Pretendard Variable",Pretendard,sans-serif;cursor:pointer;}',
    '.tc-root .tc-resetbtn:hover{filter:brightness(1.25);box-shadow:0 0 12px rgba(var(--tc-acc),.6);}',
    '.dt-editing .tc-root .tc-resetbtn,.tc-root.tc-edit-layout .tc-resetbtn{display:block;}',
    '.tc-root[data-theme="light"] .tc-resetbtn{background:#fff;color:#15253a;}',
    '.dt-editing .tc-root [data-name]{animation-play-state:paused!important;}',
    '.tc-root .tc-swapped > *:not(.tc-chart){display:none!important;}',
    '.tc-root .tc-swapped{position:relative;overflow:hidden;}',
    '.tc-root .tc-chart{border-radius:inherit;z-index:2;}',
    '.tc-root .tc-chartbtn{position:absolute;top:-3px;right:0;}',
    '.tc-root [data-name^="Equipment Card/"] .tc-chartbtn{top:19px;right:84px;}',
    '.tc-root [data-name^="Equipment Card/"] .tc-chartmenu{top:44px;right:16px;}',
    '.tc-root .tc-chartmenu{top:22px;right:0;}',
    /*@CHART_CSS*/
    /* 라이트 호버 — 흰 판은 brightness 를 올려도 변화가 없어 살짝 눌러 보이게 한다 */
    '.tc-root[data-theme="light"] [data-name^="Nav Item/"]:hover > div:first-child{filter:brightness(.86) drop-shadow(0 2px 6px rgba(0,110,170,.25));}',
    '.tc-root[data-theme="light"] [data-name^="Nav Item/"]:hover > div:last-child{color:#15253a!important;}',
    '.tc-root[data-theme="light"] [data-name="Panel Toggle"]:hover{filter:brightness(.95);}',
    '.tc-root[data-theme="light"] .tc-mm-tab:hover{filter:brightness(.96);}',
    '.tc-root[data-theme="light"] [data-name="Actions"] > [data-name^="Button/"]:hover{background-image:linear-gradient(90deg,#d0e7f6,#d0e7f6)!important;}',
    '.tc-root[data-theme="light"] [data-name="Actions"] > [data-name^="Button/"]:active{background-image:linear-gradient(90deg,#bcdcf1,#bcdcf1)!important;box-shadow:inset 0 1px 4px rgba(20,70,120,.22);}',
    '.tc-root[data-theme="light"] [data-name^="Metric/"]:hover,.tc-root[data-theme="light"] [data-name^="Field/"]:hover,.tc-root[data-theme="light"] [data-name^="Option/"]:hover,.tc-root[data-theme="light"] [data-name^="Tab/"]:hover,.tc-root[data-theme="light"] [data-name="Input"]:hover,.tc-root[data-theme="light"] [data-name^="Message Item"]:hover [data-name="Bubble"]{filter:brightness(.97);}',
    '.tc-root[data-theme="light"] [data-name^="Control/"]:hover{filter:brightness(.96);}',
    '.tc-root[data-theme="light"] [data-name^="Control/"]:active{filter:brightness(.92);}',
    '.tc-root[data-theme="light"] [data-name^="Control/"].tc-off{filter:saturate(.3) opacity(.55);}',
    '.tc-root[data-theme="light"] [data-name^="Control/"].tc-on{filter:none;}',
    '.tc-root[data-theme="light"] [data-name="Button/Confirm All"]:hover{filter:brightness(.8);}',
    '.tc-root[data-theme="light"] [data-name="Button/Sign Up"]:hover{filter:brightness(1.05);}',
    '.tc-root[data-theme="light"] [data-name="Button/STATCOM Monitoring"]:hover{filter:brightness(.96);}',
    '.tc-root[data-theme="light"] [data-name="Thumbnail"]:hover,.tc-root[data-theme="light"] [data-name^="Process Step/"]:hover [data-name="Thumbnail"]{filter:brightness(1.08);}',
    '.tc-root[data-theme="light"] [data-name^="Submodule/"]:hover{filter:brightness(.92);}',
    '.tc-root[data-theme="light"] [data-name="Close Button"]:hover{filter:brightness(.7);}',
    '.tc-root[data-theme="light"] [data-name^="Equipment Card/"]:hover{filter:drop-shadow(0 8px 18px rgba(30,90,150,.16));}',
    '.tc-root[data-theme="light"] .tc-vr-btn:hover{filter:brightness(.97);}',
    '.tc-root[data-theme="light"] .tc-vr-btn:active,.tc-root[data-theme="light"] .tc-vr-btn.tc-vr-press{filter:brightness(.93);}',
    '.tc-root[data-theme="light"] .tc-mv.tc-dragging{filter:drop-shadow(0 14px 22px rgba(30,60,100,.22));}',
    '.tc-root[data-theme="light"] .tc-resetbtn:hover{filter:brightness(.97);box-shadow:0 2px 10px rgba(30,60,100,.18);}',
    '.tc-root[data-theme="light"] .tc-chart{background:#fff;box-shadow:inset 0 0 0 1px #d9e2ea;color:#2c3e54;}',
    '.tc-root[data-theme="light"] .tc-chart .ct{color:#15253a;}',
    '.tc-root[data-theme="light"] .tc-chartbtn{background:#fff;color:#0a6ea8;box-shadow:0 2px 6px rgba(30,60,100,.14);}',
    '.tc-root[data-theme="light"] .tc-chart .ct b,.tc-root[data-theme="light"] .tc-chart .gv{color:#006a96;}',
    '.tc-root[data-theme="light"] .tc-chart .ct b small,.tc-root[data-theme="light"] .tc-chart .gv small,.tc-root[data-theme="light"] .tc-chart .lg,.tc-root[data-theme="light"] .tc-chart .bars u{color:#5a6c82;}',
    '.tc-root[data-theme="light"] .tc-chart .ax{fill:#5a6c82;}',
    '.tc-root[data-theme="light"] .tc-chart .bars em,.tc-root[data-theme="light"] .tc-chart .hb b,.tc-root[data-theme="light"] .tc-chart .dn b{color:#15253a;}',
    '.tc-root[data-theme="light"] .tc-chart .gl{stroke:#e4ebf1;}',
    '.tc-root[data-theme="light"] .tc-chartmenu{background:#fff;color:#2c3e54;border-color:#d9e2ea;box-shadow:0 8px 22px rgba(30,60,100,.14);}',
    '.tc-root[data-theme="light"] .tc-chartmenu button:hover,.tc-root[data-theme="light"] .tc-chartmenu button.cur{color:#15253a;}',
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
  function layoutEditing(root) { return !!(root.closest('.dt-editing') || root.classList.contains('tc-edit-layout')); }
  function idle() { return typeof window.__wembIdle === 'function' ? window.__wembIdle() : document.hidden; }
  function load(k) { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function comma(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  /* 사람이 고친 글자는 덮지 않는다 */
  function claimed(p) { return p.__tcLast != null && p.textContent !== p.__tcLast; }
  function write(p, s) {
    if (!p || p === document.activeElement || claimed(p)) return;
    if (p.textContent !== s) p.textContent = s;
    p.__tcLast = p.textContent;
  }
  function clickable(el, fn) {
    if (!el) return;
    el.classList.add('tc-click');
    el.addEventListener('click', function (e) {
      if (editing()) return;
      fn(e);
    });
  }
  function frameOf(root) { return root.querySelector(':scope > [data-node-id]'); }
  /* 자리 = 반응형(fx,fy) + 상태(sx) + 사용자가 옮긴 몫(ux,uy) */
  function place(el) {
    if (!el) return;
    var x = (el.__fx || 0) + (el.__sx || 0) + (el.__ux || 0) + (el.__dx || 0);
    var y = (el.__fy || 0) + (el.__uy || 0) + (el.__dy || 0);
    el.style.translate = (x || y) ? x.toFixed(2) + 'px ' + y.toFixed(2) + 'px' : '';
  }
  function placed(el) { if (el) el.classList.add('tc-place'); return el; }
  function goto(scene) {
    if (window.__gotoStatcomScene) { window.__gotoStatcomScene(scene); return; }
    location.href = scene + '.html' + location.search;
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
    var bg = kid(frame, 'Background'), scene = kid(frame, 'Scene Image'), header = kid(frame, 'Header');
    var side = kid(frame, 'Side Menu'), bar = side && one(side, '[data-name="Side Bar"]');
    var mm = placed(kid(frame, 'Minimap'));
    var floats = all(frame, ':scope > [data-name^="Hover Card"]').concat(st.scene === 'cooling' ? all(frame, ':scope > [data-name^="Equipment Card/"]') : []);
    floats.forEach(function (w) { w.__bx = w.offsetLeft; w.__by = w.offsetTop; placed(w); });
    var cards = st.scene === 'cards' ? all(frame, ':scope > [data-name^="Equipment Card/"]') : [];
    var form = placed(kid(frame, 'Login Form')), hero = placed(kid(frame, 'Hero Image'));
    var glow = st.scene === 'login' ? frame.querySelector('[data-node-id="1:427"]') : null;
    var sw = scene ? scene.offsetWidth : 1920;
    var vr = /^vr-/.test(st.scene), popup = vr ? one(frame, '[data-name^="Popup/"]') : null;
    var pop0 = popup ? { x: popup.offsetLeft, y: popup.offsetTop, w: popup.offsetWidth, h: popup.offsetHeight, fw: frame.offsetWidth, fh: frame.offsetHeight } : null;
    if (popup) placed(popup);
    var extras = all(frame, '[data-node-id="1:421"],[data-node-id="1:424"]');
    extras.forEach(placed);
    if (scene) { scene.style.transform = 'none'; scene.style.translate = 'none'; }
    if (header) { header.style.transform = 'none'; header.style.translate = 'none'; header.style.left = '0'; header.style.margin = '0'; }
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
      var kx = VW / BASE_W, ky = VH / BASE_H, k = Math.max(kx, ky);
      if (bg) {
        bg.style.left = (-95 * kx).toFixed(2) + 'px'; bg.style.top = (-206 * ky).toFixed(2) + 'px';
        bg.style.width = (2134.068 * kx).toFixed(2) + 'px'; bg.style.height = (1491.343 * ky).toFixed(2) + 'px';
      }
      var hl = (VW - 1920 * k) / 2, ht = (VH - 1080 * k) / 2;
      if (vr) {
        var vk = Math.max(VW / sw, VH / 788), pk = VH / 788, ss = scene.style;
        ss.margin = '0'; ss.width = (sw * vk).toFixed(2) + 'px'; ss.height = (788 * vk).toFixed(2) + 'px';
        ss.left = ((VW - sw * vk) / 2).toFixed(2) + 'px'; ss.top = ((VH - 788 * vk) / 2).toFixed(2) + 'px';
        var ph = popup.offsetHeight;
        popup.style.left = ((VW - pop0.w) / 2).toFixed(2) + 'px';
        popup.style.top = ((VH - ph) / 2).toFixed(2) + 'px';
        popup.style.transformOrigin = '50% 50%';
        popup.style.transform = 'scale(' + pk.toFixed(4) + ')';
      } else if (scene) {
        var sc = scene.style, w = sw * k, h = 1080 * k;
        sc.left = ((VW - w) / 2).toFixed(2) + 'px'; sc.top = ((VH - h) / 2).toFixed(2) + 'px'; sc.right = 'auto'; sc.bottom = 'auto'; sc.margin = '0';
        sc.width = w.toFixed(2) + 'px'; sc.height = h.toFixed(2) + 'px';
      }
      if (header) header.style.width = VW + 'px';
      if (side) side.style.height = (VH - 60) + 'px';
      if (bar) bar.style.height = (VH - 60) + 'px';
      if (mm) { mm.__fx = exW; place(mm); }
      extras.forEach(function (e) { e.__fx = exW; place(e); });
      floats.forEach(function (w) {
        /* 사진을 따라가되 왼쪽 패널에 가리지 않게 */
        var nx = Math.max(hl + w.__bx * k, Math.min(w.__bx, 452)), ny = clamp(ht + w.__by * k, 70, VH - w.offsetHeight - 10);
        w.__fx = nx - w.__bx; w.__fy = ny - w.__by; place(w);
      });
      cards.forEach(function (c) { c.__fx = exW / 2; c.__fy = exH / 2; place(c); });
      if (form) { form.__fx = exW * 0.25; place(form); }
      if (hero) { hero.__fx = exW * 0.75; hero.__fy = exH / 2; place(hero); }
      if (glow) { glow.style.translate = exW.toFixed(1) + 'px ' + (exH / 2).toFixed(1) + 'px'; }
    }
    var rsT = 0;
    function relayout() {
      root.classList.add('tc-resizing');
      layout();
      clearTimeout(rsT);
      rsT = setTimeout(function () { root.classList.remove('tc-resizing'); }, 140);
    }
    layout();
    st.layout = layout;
    if (window.ResizeObserver) { st.ro = new ResizeObserver(relayout); st.ro.observe(root); }
    else { st.onResize = relayout; window.addEventListener('resize', relayout); }
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('tc-live'); }); });
  }

  /* ══════════════════ 2. 시계 ══════════════════ */
  var WD = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  function installClock(root, st) {
    var tb = one(root, '[data-name="Toolbar"]');
    if (!tb) return;
    var d = one(tb, '[data-name="Date"]'), t = one(tb, '[data-name="Time"]');
    function tick() {
      var n = new Date();
      write(d, n.getFullYear() + '-' + p2(n.getMonth() + 1) + '-' + p2(n.getDate()) + ' ' + WD[n.getDay()]);
      write(t, p2(n.getHours()) + ':' + p2(n.getMinutes()) + ':' + p2(n.getSeconds()));
    }
    tick();
    st.timers.push(setInterval(tick, 1000));
  }

  /* ══════════════════ 3. 메뉴 · 머리 단추 · 로그인 ══════════════════ */
  function installNav(root, st) {
    all(root, '[data-name^="Nav Item"]').forEach(function (n) {
      var ic = one(n, '[data-name^="Icon/Nav/"]');
      var type = ic ? ic.getAttribute('data-name').replace('Icon/Nav/', '') : '';
      var scene = NAV[type];
      if (!scene || scene === st.scene) return;
      clickable(n, function () { goto(scene); });
    });
    clickable(one(root, '[data-name="Actions"] > [data-name="Button/Home"]'), function () { goto('main'); });
    clickable(one(root, '[data-name="Actions"] > [data-name="Button/Logout"]'), function () { goto('login'); });
    clickable(one(root, '[data-name="Button/Sign Up"]'), function () { goto('main'); });
    clickable(one(root, '[data-name="Button/STATCOM Monitoring"]'), function () { goto('statcom'); });
    var rm = one(root, '[data-name^="Option/Remember"]');
    clickable(rm, function () { rm.classList.toggle('tc-off'); });
    if (st.scene === 'cards') {
      all(root, '[data-name^="Equipment Card/"]').forEach(function (c) {
        var s = CARD_SCENE[c.getAttribute('data-name').replace('Equipment Card/', '')];
        if (!s) return;
        c.classList.add('tc-link');
        c.addEventListener('click', function (e) { if (!editing() && !e.target.closest('.tc-chartbtn,.tc-chartmenu')) goto(s); });
      });
    }
  }

  /* ══════════════════ 4. 접기 ══════════════════ */
  function installFold(root, st) {
    var fold = load(K_FOLD), me = fold[st.scene] || {};
    var side = kid(st.frame, 'Side Menu'), layout = side && kid(side, 'Layout');
    var toggle = side && one(side, '[data-name="Panel Toggle"]');
    if (toggle) {
      var wrap = toggle.parentElement.parentElement;
      wrap.style.top = '18px'; wrap.style.bottom = 'auto'; wrap.style.left = 'auto'; wrap.style.right = '0'; wrap.style.width = '22px'; wrap.style.height = '38px'; wrap.style.inset = '18px 0 auto auto';
    }
    if (st.scene === 'main') {
      /* 메뉴만 있는 화면 — 접기 단추는 패널이 열린 화면(STATCOM)으로 */
      if (toggle) toggle.addEventListener('click', function () { if (!editing()) goto('statcom'); });
    } else if (layout && toggle) {
      var panel = kid(layout, 'Side Panel');
      Array.prototype.forEach.call(panel.children, function (c) { c.style.width = '336px'; c.style.flexShrink = '0'; });
      var setPanel = function (on) {
        side.classList.toggle('tc-folded', on);
        side.style.width = on ? '82px' : '442px';
        me.panel = on; fold[st.scene] = me; save(K_FOLD, fold);
      };
      if (me.panel) setPanel(true);
      toggle.addEventListener('click', function () { if (!editing()) setPanel(!side.classList.contains('tc-folded')); });
    }
    /* 미니맵 — 접으면 카드가 오른쪽으로 빠지고 Minimap Tab 만 남는다(Figma 2_메인화면_close 와 같은 자리) */
    var mm = kid(st.frame, 'Minimap');
    if (mm) {
      mm.removeAttribute('hidden');
      var tab = one(st.frame, '[data-node-id="1:424"]');
      var oldToggle = one(st.frame, '[data-node-id="1:421"]');
      if (oldToggle) oldToggle.style.display = 'none';
      if (tab) { tab.removeAttribute('hidden'); tab.classList.add('tc-mm-tab'); }
      var mmT = one(mm, '[data-name="Panel Toggle"]');
      var setMM = function (closed) {
        mm.classList.toggle('tc-mm-closed', closed);
        mm.__sx = closed ? 273 : 0;
        place(mm);
        if (tab) tab.classList.toggle('tc-off', !closed);
        me.mm = closed; fold[st.scene] = me; save(K_FOLD, fold);
      };
      setMM(me.mm != null ? me.mm : st.scene === 'main');
      if (mmT) mmT.addEventListener('click', function () { if (!editing()) setMM(!mm.classList.contains('tc-mm-closed')); });
      if (tab) tab.addEventListener('click', function () { if (!editing()) setMM(false); });
      /* 층 점 — 누른 층이 켜진다 */
      var dots = all(mm, '[data-name^="Dot/"]');
      dots.forEach(function (d, i) {
        d.addEventListener('click', function () {
          if (editing()) return;
          dots.forEach(function (x, j) { x.style.backgroundColor = j === i ? '#00b9f0' : 'rgba(0,185,240,.2)'; });
        });
      });
    }
  }

  /* ══════════════════ 5. 고르는 묶음 — 원본의 켜짐 · 꺼짐 모양을 그대로 옮긴다 ══════════════════ */
  function installChoice(root, st) {
    st.looks = [];
    var holder = document.createElement('div');
    holder.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;pointer-events:none;width:0;height:0;overflow:hidden;';
    st.frame.appendChild(holder);
    function grab(el) { var c = el.cloneNode(true); c.removeAttribute('id'); holder.appendChild(c); return c; }
    function texts(el) { return all(el, 'p'); }
    function paint(el, model, orig) {
      var cs = getComputedStyle(model), a = getComputedStyle(model, '::after');
      el.style.backgroundColor = cs.backgroundColor;
      el.style.backgroundImage = cs.backgroundImage;
      var ov = Array.prototype.filter.call(model.children, function (c) { return !c.getAttribute('data-name') && c.tagName === 'DIV'; });
      el.style.boxShadow = ov.length ? getComputedStyle(ov[ov.length - 1]).boxShadow : cs.boxShadow;
      if (ov.length) el.style.backgroundColor = getComputedStyle(ov[0]).backgroundColor;
      var ring = el.__ringSt;
      if (!ring) { ring = el.__ringSt = document.createElement('style'); document.head.appendChild(ring); st.styles.push(ring); }
      var cl = el.className.split(/\s+/)[0];
      ring.textContent = a.content !== 'none' ? '.' + st.px + '-root .' + cl + '::after{border-color:' + a.borderTopColor + '!important;}' : '';
      var mp = texts(model);
      texts(el).forEach(function (p, i) {
        var m = getComputedStyle(mp[Math.min(i, mp.length - 1)]);
        p.style.color = m.color; p.style.fontWeight = m.fontWeight; p.style.width = 'auto';
      });
      var mc = kid(model, 'Count'), ec = kid(el, 'Count');
      if (mc && ec) { var mcs = getComputedStyle(mc); ec.style.backgroundColor = mcs.backgroundColor; ec.style.padding = mcs.padding; ec.style.width = 'auto'; }
      /* 원본이 켜짐이었던 칸의 덮개는 꺼질 때 숨긴다 */
      if (el === orig) Array.prototype.forEach.call(el.children, function (c) { if (!c.getAttribute('data-name') && c.tagName === 'DIV') c.style.display = model.__isOn ? '' : 'none'; });
    }
    function group(items, onPick) {
      var active = items.filter(function (i) { return /\(Active\)/.test(i.getAttribute('data-name')); })[0];
      var idleEl = items.filter(function (i) { return i !== active; })[0];
      if (!active || !idleEl) return;
      var mOn = grab(active), mOff = grab(idleEl);
      mOn.__isOn = true;
      var cur = active;
      var g = {
        apply: function () { items.forEach(function (i) { paint(i, i === cur ? mOn : mOff, active); }); },
      };
      items.forEach(function (i) {
        i.addEventListener('click', function () {
          if (editing()) return;
          cur = i;
          g.apply();
          if (onPick) onPick(i);
        });
      });
      st.looks.push(g);
    }
    var mode = one(root, '[data-name="Widget/Operation Mode"] [data-name="List"]');
    if (mode) group(Array.prototype.slice.call(mode.children));
    all(root, '[data-name="Options"]').forEach(function (o) {
      group(Array.prototype.slice.call(o.children), function (i) {
        var t = i.getAttribute('data-name');
        var m = /Option\/([\d.]+)x/.exec(t);
        if (m) st.speed = +m[1];
      });
    });
    var seg = one(root, '[data-name="Segmented Control"]');
    if (seg) group(Array.prototype.slice.call(seg.children), function (i) { if (st.onTab) st.onTab(i.getAttribute('data-name')); });
    /* 테마 · 색이 바뀌면 다시 입힌다 — 처음엔 손대지 않는다(원본 그대로) */
    st.reLook = function () { if (st.looked) st.looks.forEach(function (g) { g.apply(); }); };
    st.looks.forEach(function (g) {
      var ap = g.apply;
      g.apply = function () { st.looked = true; ap(); };
    });
    st.obs = new MutationObserver(function () { setTimeout(st.reLook, 260); });
    st.obs.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  }

  /* ══════════════════ 6. 라이브 수치 ══════════════════ */
  var NUM = /^(-?[\d,]*\.?\d+)(\s*[^\d\s].*)?$/;
  function installLive(root, st) {
    var cells = [];
    all(root, '[data-name="Value"]').forEach(function (p) {
      if (p.closest('[data-name="Count"],[data-name="Tooltip"],[data-name^="Tab/"],[data-name^="Count/"],[data-name="Input"],[data-name^="Hover Card"],[data-name="Badge"]')) return;
      var sib = p.parentElement ? kid(p.parentElement, 'Unit') : null;
      var unit = sib ? sib.textContent.trim() : '';
      if (unit === '건' || unit === 'h') return;
      var m = NUM.exec(p.textContent.trim());
      if (!m) return;
      var raw = m[1], v = parseFloat(raw.replace(/,/g, ''));
      if (!isFinite(v) || v === 0) return;
      var dec = (raw.split('.')[1] || '').length, hasComma = raw.indexOf(',') >= 0;
      cells.push({ p: p, base: v, v: v, dec: dec, comma: hasComma, tail: m[2] || '' });
    });
    function fmt(c, v) {
      var s = v.toFixed(c.dec);
      if (c.comma) { var a = s.split('.'); a[0] = a[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); s = a.join('.'); }
      return s + c.tail;
    }
    /* 진행 막대 — 값 ↔ 비율 ↔ 막대가 함께 */
    var bars = [];
    all(root, '[data-name="Progress Bar"]').forEach(function (b) {
      var card = b.closest('[data-name="Card"]'), vp = card && one(card, '[data-name="Value"]');
      var ratio = one(b, '[data-name="Ratio"]'), fill = one(b, '[data-name="Fill"]');
      if (!vp || !ratio || !fill) return;
      var c = cells.filter(function (x) { return x.p === vp; })[0];
      var rv = parseFloat(ratio.textContent);
      if (!c || !rv) return;
      bars.push({ c: c, ratio: ratio, fill: fill, rv: rv, fw: parseFloat(getComputedStyle(fill).width) / parseFloat(getComputedStyle(b).width) * 100, kmax: c.base / rv });
    });
    var marker = one(root, '[data-name="Meter"] [data-name="Track"] [data-name="Marker"]');
    var mBase = marker ? marker.offsetLeft : 0;
    function tick() {
      if (idle() || editing()) return;
      cells.forEach(function (c) {
        if (Math.random() > 0.45) return;
        var amp = Math.max(Math.abs(c.base) * 0.006, Math.pow(10, -c.dec));
        c.v = clamp(c.v + rnd(-amp, amp), c.base - amp * 4, c.base + amp * 4);
        if (c.dec === 0 && c.base < 20) c.v = c.base;
        write(c.p, fmt(c, c.v));
      });
      bars.forEach(function (b) {
        var r = clamp(b.c.v / b.kmax, 1, 100);
        write(b.ratio, Math.round(r) + '%');
        b.fill.style.width = (b.fw * r / b.rv).toFixed(2) + '%';
      });
      if (marker && mBase) marker.style.left = (mBase + rnd(-9, 9)).toFixed(1) + 'px';
    }
    st.timers.push(setInterval(tick, 2200));
  }

  /* ══════════════════ 7. 스파크라인 — 원본 벡터를 인라인으로 두고 점만 흔든다(t=0 = 원본) ══════════════════ */
  function installSpark(root, st) {
    var imgs = all(root, 'img').filter(function (i) { return /line-group/.test(i.getAttribute('src') || ''); });
    if (!imgs.length) return;
    var seq = 0, items = [];
    imgs.forEach(function (img, idx) {
      fetch(img.getAttribute('src')).then(function (r) { return r.text(); }).then(function (txt) {
        if (!img.parentNode) return;
        var tmp = document.createElement('div');
        var uid = 's' + (++seq) + st.px;
        tmp.innerHTML = txt.replace(/(id=")([^"]+)(")/g, function (m, a, b, c) { return a + uid + b.replace(/\s/g, '_') + c; })
          .replace(/url\(#([^)]+)\)/g, function (m, b) { return 'url(#' + uid + b + ')'; });
        var svg = tmp.querySelector('svg');
        if (!svg) return;
        svg.setAttribute('class', (img.getAttribute('class') || '') + ' ls-inl');
        svg.removeAttribute('width'); svg.removeAttribute('height');
        img.parentNode.replaceChild(svg, img);
        var paths = [];
        var line = svg.querySelector('[id$="Line"]');
        var fc = svg.querySelector('[id$="Forecast"] path');
        var pt = svg.querySelector('[id$="Point"]');
        [line, fc].forEach(function (pth) {
          if (!pth) return;
          var d = pth.getAttribute('d'), nums = d.match(/-?\d*\.?\d+/g).map(Number);
          paths.push({ el: pth, cmds: d.match(/[A-Za-z]/g), nums: nums, d: d });
        });
        var endX = line ? (function () { var n = paths[0].nums; return { x: n[n.length - 2], y: n[n.length - 1] }; })() : null;
        items.push({ paths: paths, pt: pt, end: endX, ph: idx * 1.3 });
      }).catch(function () { });
    });
    function shape(x, t, ph) { return 1.7 * (Math.sin(x * 0.055 - t + ph) - Math.sin(x * 0.055 + ph)) + 1.1 * (Math.sin(x * 0.12 + t * 0.7 + ph) - Math.sin(x * 0.12 + ph)); }
    var last = 0, t0 = performance.now();
    function frame(now) {
      st.raf = requestAnimationFrame(frame);
      if (now - last < 50 || idle() || layoutEditing(root)) return;
      last = now;
      var t = (now - t0) / 1600;
      items.forEach(function (it) {
        it.paths.forEach(function (p) {
          var out = '', i = 0, n = p.nums;
          /* M x y C x y x y x y … 절대 좌표 */
          out = 'M' + n[0] + ' ' + (n[1] + shape(n[0], t, it.ph)).toFixed(2) + 'C';
          for (i = 2; i < n.length; i += 2) out += n[i] + ' ' + (n[i + 1] + shape(n[i], t, it.ph)).toFixed(2) + (i + 2 < n.length ? ' ' : '');
          p.el.setAttribute('d', out);
        });
        if (it.pt && it.end) it.pt.setAttribute('transform', 'translate(0 ' + shape(it.end.x, t, it.ph).toFixed(2) + ')');
      });
    }
    st.raf = requestAnimationFrame(frame);
  }

  /* ══════════════════ 8. 밸브실 — 서브모듈 ══════════════════ */
  var CELL = { Fault: '#e83c19', Bypass: '#2a74f4', Alarm: '#e8c819', Run: '#19c877', Standby: 'rgba(110,143,176,.5)' };
  function installValve(root, st) {
    var cells = all(root, '[data-name^="Submodule/"]');
    if (!cells.length) return;
    var items = cells.map(function (c) {
      var m = /R(\d+)C(\d+) \((\w+)\)/.exec(c.getAttribute('data-name'));
      var v = c.closest('[data-name^="Valve/"]'), mod = c.closest('[data-name^="Module/"]');
      c.setAttribute('data-tc-state', m[3]);
      return { el: c, r: +m[1], c: +m[2], state: m[3], valve: v, vName: v.getAttribute('data-name').slice(6), mod: +mod.getAttribute('data-name').slice(7), orig: m[3] };
    });
    var legend = {
      Fault: one(root, '[data-name="Item/Fault Trip"] [data-name="Value"]'), Bypass: one(root, '[data-name="Item/Bypass"] [data-name="Value"]'),
      Alarm: one(root, '[data-name="Item/Alarm Warning"] [data-name="Value"]'), Run: one(root, '[data-name="Item/Run Ready"] [data-name="Value"]'),
      Standby: one(root, '[data-name="Item/Standby Halt"] [data-name="Value"]'),
    };
    function recount() {
      var tot = { Fault: 0, Bypass: 0, Alarm: 0, Run: 0, Standby: 0 }, per = {};
      items.forEach(function (i) { tot[i.state]++; var k = i.vName + i.state; per[k] = (per[k] || 0) + 1; });
      Object.keys(legend).forEach(function (k) { write(legend[k], String(tot[k])); });
      all(root, '[data-name^="Valve/"]').forEach(function (v) {
        var vn = v.getAttribute('data-name').slice(6);
        all(v, '[data-name^="Count/"]').forEach(function (c) {
          var s = c.getAttribute('data-name').slice(6);
          write(one(c, '[data-name="Value"]'), String(per[vn + s] || 0));
        });
      });
    }
    function setState(i, s) {
      i.state = s;
      i.el.setAttribute('data-tc-state', s);
      i.el.style.backgroundColor = CELL[s];
    }
    /* 원본 숫자에 맞게 — 같은 밸브 안에서 이상 칸이 한 칸씩 자리를 옮긴다 */
    function tick() {
      if (idle() || editing()) return;
      var abn = items.filter(function (i) { return i.state !== 'Run'; });
      var a = abn[Math.floor(Math.random() * abn.length)];
      var pool = items.filter(function (i) { return i.state === 'Run' && i.vName === a.vName; });
      var b = pool[Math.floor(Math.random() * pool.length)];
      if (!a || !b) return;
      var s = a.state;
      setState(a, 'Run'); setState(b, s);
      recount();
    }
    st.timers.push(setInterval(tick, 3600));

    /* 호버 카드 */
    var cardN = one(root, '[data-name="Hover Card (Normal)"]'), cardE = one(root, '[data-name="Hover Card (Error)"]');
    var issueN = cardN && one(cardN, '[data-name="Field/Issue"] [data-name="Value"]'), issueE = cardE && one(cardE, '[data-name="Field/Issue"] [data-name="Value"]');
    [cardN, cardE].forEach(function (c) {
      if (!c) return;
      clickable(one(c, '[data-name="Close Button"]'), function () { c.classList.add('tc-off'); });
    });
    function show(i) {
      var bad = i.state === 'Fault' || i.state === 'Alarm' || i.state === 'Bypass';
      var card = bad ? cardE : cardN;
      if (!card) return;
      card.classList.remove('tc-off');
      var no = (i.vName === 'B' ? 72 : 0) + (i.r - 1) * 24 + (i.mod - 1) * 6 + i.c;
      write(one(card, '[data-name="Field/SM No"] [data-name="Value"]'), 'SM #' + no);
      write(one(card, '[data-name="Field/Temperature"] [data-name="Value"]'), (18 + Math.random() * 3).toFixed(1) + ' ℃');
      write(one(card, '[data-name="Field/Voltage"] [data-name="Value"]'), (9.8 + Math.random() * .4).toFixed(1) + 'kV');
    }
    items.forEach(function (i) {
      i.el.addEventListener('pointerenter', function () { if (!editing()) show(i); });
      i.el.addEventListener('click', function () { if (!editing()) show(i); });
    });
    void issueN; void issueE;
  }

  /* ══════════════════ 9. 시뮬레이션 — 공정 재생 ══════════════════ */
  function installSim(root, st) {
    if (st.scene !== 'simulation') return;
    var tl = one(root, '[data-name="Timeline"]');
    if (!tl) return;
    var fill = one(tl, '[data-name="Fill"]'), handle = one(tl, '[data-name="Handle"]');
    var cur = one(tl, '[data-name="Current Time"]');
    var T0 = 135, TOTAL = 520, P0 = 34.71;
    var t = T0, playing = true, repeat = false, activeStep = one(root, '[data-name^="Process Step/"][data-name*="(Active)"]');
    st.speed = 1;
    var hOff = parseFloat(getComputedStyle(handle).marginLeft) / tl.clientWidth * 100 - P0;
    var parts = activeStep ? [one(activeStep, '[data-name="Handle"]'), one(activeStep, '[data-name="Tooltip BG"]'), one(activeStep, '[data-name="Tooltip Label"]')] : [];
    var aFill = activeStep && one(activeStep, '[data-name="Fill"]');
    var aW = aFill ? aFill.offsetWidth : 0, RANGE = 206 * 0.5;
    function pct(x) { return x <= T0 ? x / T0 * P0 : P0 + (x - T0) / (TOTAL - T0) * (100 - P0); }
    function draw(first) {
      var p = pct(t);
      if (!first) {
        fill.style.width = p.toFixed(2) + '%';
        handle.style.marginLeft = (p + hOff).toFixed(2) + '%';
        write(cur, p2(Math.floor(t / 60)) + ':' + p2(Math.floor(t % 60)));
        var dx = (t - T0) / (TOTAL - T0) * RANGE;
        parts.forEach(function (e) { if (e) e.style.translate = dx.toFixed(1) + 'px 0'; });
        if (aFill) aFill.style.width = Math.max(4, aW + dx).toFixed(1) + 'px';
      }
    }
    st.timers.push(setInterval(function () {
      if (!playing || idle() || editing()) return;
      t += 0.4 * (st.speed || 1);
      if (t >= TOTAL) { if (repeat) t = 0; else { t = TOTAL; playing = false; setPlay(); } }
      draw();
    }, 400));
    var play = one(root, '[data-name^="Control/Play Pause"]'), rep = one(root, '[data-name^="Control/Repeat"]');
    function setPlay() { if (play) play.classList.toggle('tc-off', !playing); }
    clickable(play, function () { playing = !playing; if (playing && t >= TOTAL) t = 0; setPlay(); });
    clickable(rep, function () { repeat = !repeat; rep.classList.toggle('tc-on', repeat); });
    clickable(one(root, '[data-name^="Control/First"]'), function () { t = 0; draw(); });
    clickable(one(root, '[data-name^="Control/Previous"]'), function () { t = Math.max(0, t - 30); draw(); });
    clickable(one(root, '[data-name^="Control/Next"]'), function () { t = Math.min(TOTAL, t + 30); draw(); });
    tl.addEventListener('click', function (e) {
      if (editing()) return;
      var r = tl.getBoundingClientRect(), f = clamp((e.clientX - r.left) / r.width, 0, 1) * 100;
      t = f <= P0 ? f / P0 * T0 : T0 + (f - P0) / (100 - P0) * (TOTAL - T0);
      draw();
    });
    tl.style.cursor = 'pointer';
  }

  /* ══════════════════ 10. 알림 메세지 ══════════════════ */
  function installAlarm(root, st) {
    var w = one(root, '[data-name="Widget/Alarm Message"]');
    if (!w) return;
    var list = one(w, '[data-name="Body"] > [data-name="List"]') || one(w, '[data-name="List"]');
    var items = function () { return all(list, ':scope > [data-name^="Message Item"]'); };
    /* 열 때마다 최근 — 줄 사이를 벌려 흐르는 목록으로 */
    var times = all(list, '[data-name="Timestamp"] [data-name="Time"]');
    if (window.wembRestampTimes) window.wembRestampTimes(times);
    var tabCount = function (n) { return one(w, '[data-name^="Tab/' + n + '"] [data-name="Count"] [data-name="Value"]'); };
    var cAll = tabCount('All'), cUn = tabCount('Unread'), cRd = tabCount('Read');
    var nAll = cAll ? parseInt(cAll.textContent, 10) || 0 : 0, nUn = cUn ? parseInt(cUn.textContent, 10) || 0 : 0, nRd = cRd ? parseInt(cRd.textContent, 10) || 0 : 0;
    function counts() { write(cAll, String(nAll)); write(cUn, String(nUn)); write(cRd, String(nRd)); }
    var tab = 'All';
    function visible(it) { return tab === 'All' || (tab === 'Unread' ? !it.classList.contains('tc-read') : it.classList.contains('tc-read')); }
    function filter() {
      items().forEach(function (it) {
        var on = visible(it);
        if (on === (it.style.display !== 'none')) return;
        if (on) {
          it.style.display = ''; it.style.opacity = '0';
          requestAnimationFrame(function () { it.style.opacity = ''; });
        } else it.style.display = 'none';
      });
    }
    st.onTab = function (name) { tab = /Unread/.test(name) ? 'Unread' : /Read/.test(name) ? 'Read' : 'All'; filter(); };
    function markRead(it) {
      if (it.classList.contains('tc-read')) return;
      it.classList.add('tc-read');
      if (nUn > 0) { nUn--; nRd++; }
      counts();
      filter();
    }
    function bind(it) { it.addEventListener('click', function () { if (!editing()) markRead(it); }); }
    items().forEach(bind);
    clickable(one(w, '[data-name="Button/Confirm All"]'), function () { items().forEach(function (it) { it.classList.add('tc-read'); }); nRd += nUn; nUn = 0; counts(); filter(); });
    /* 새 알림 — 원본 알림과 같은 글자로 맨 위에 들어온다 */
    function feed() {
      st.feed = setTimeout(feed, rnd(16000, 28000));
      if (idle() || editing()) return;
      var src = items().filter(function (i) { return !claimed(i); })[Math.floor(Math.random() * 3)];
      if (!src) return;
      var it = src.cloneNode(true);
      it.classList.remove('tc-read');
      it.removeAttribute('id');
      all(it, '[id]').forEach(function (x) { x.removeAttribute('id'); });
      var tm = one(it, '[data-name="Timestamp"] [data-name="Time"]'), n = new Date();
      if (tm) { tm.textContent = p2(n.getHours()) + ':' + p2(n.getMinutes()) + ':' + p2(n.getSeconds()); tm.__tcLast = tm.textContent; }
      bind(it);
      list.insertBefore(it, list.firstChild);
      var h = it.offsetHeight;
      it.classList.add('tc-new');
      it.style.height = '0px'; it.style.opacity = '0';
      void it.offsetHeight;
      it.style.height = h + 'px'; it.style.opacity = '';
      setTimeout(function () { it.classList.remove('tc-new'); it.style.height = ''; }, 420);
      nAll++; nUn++;
      counts();
      filter();
      var ls = items();
      if (ls.length > 14) ls[ls.length - 1].remove();
    }
    st.feed = setTimeout(feed, rnd(9000, 14000));
  }

  /* ══════════════════ 10-2. VR 교육 — 주제 선택 → 개요 → 단계 안내 ⇄ 메뉴 ══════════════════
     단추 호버는 원본의 '켜짐' 단추 그림(첫 단추)으로 바꾼다. M 키로 메뉴, Esc 로 돌아온다(개요 글에 적힌 조작 그대로). */
  function installVR(root, st) {
    var FLOW = { 'Button/MMC Valve Submodule Replacement': 'vr-overview', 'Button/Start Training': 'vr-step', 'Button/Back': 'vr-topic', 'Button/Continue': 'vr-step', 'Button/Restart': 'vr-step', 'Button/Main Menu': 'vr-topic' };
    var btns = all(root, '[data-name^="Button/"]');
    var imgOf = function (b) { return one(b, '[data-name="Button BG"] img'); };
    var labOf = function (b) { return one(b, 'p'); };
    var onSrc = btns[0] && imgOf(btns[0]) ? imgOf(btns[0]).getAttribute('src') : '';
    btns.forEach(function (b, i) {
      var img = imgOf(b), lab = labOf(b), off = img ? img.getAttribute('src') : '';
      b.classList.add('tc-vr-btn');
      if (i > 0 && img && onSrc && off !== onSrc) {
        b.addEventListener('pointerenter', function () { if (editing()) return; img.src = onSrc; img.__origSrc = onSrc; b.classList.add('tc-vr-on'); });
        b.addEventListener('pointerleave', function () { img.src = off; img.__origSrc = off; b.classList.remove('tc-vr-on'); });
      }
      var name = b.getAttribute('data-name');
      clickable(b, function () {
        if (FLOW[name]) { goto(FLOW[name]); return; }
        /* 위치 초기화 — 눌린 표시만 */
        b.classList.add('tc-vr-press');
        setTimeout(function () { b.classList.remove('tc-vr-press'); }, 260);
      });
      void lab;
    });
    /* 단계 안내 — 진행 막대가 Step 1 에서 Step 2 로 차오른다 */
    if (st.scene === 'vr-step') {
      var fg = one(root, '[data-name="Fill Group"]'), s2 = one(root, '[data-name="Step/2"]');
      var s1 = one(root, '[data-name="Step/1"]');
      if (fg) {
        var p = 48.65;
        st.timers.push(setInterval(function () {
          if (idle() || editing()) return;
          p = Math.min(98, p + 0.55);
          fg.style.width = p.toFixed(2) + '%';
          if (s2 && s1 && p >= 97) s2.style.color = getComputedStyle(s1).color;
        }, 600));
      }
    }
    st.onKey = function (e) {
      if (editing() || (e.target && e.target.isContentEditable)) return;
      if (st.scene === 'vr-step' && (e.key === 'm' || e.key === 'M' || e.key === 'ㅡ')) goto('vr-menu');
      else if (st.scene === 'vr-menu' && e.key === 'Escape') goto('vr-step');
    };
    window.addEventListener('keydown', st.onKey);
  }

  /* ══════════════════ 11. 차트 바꾸기 ══════════════════ */
  /*@MAKECHART*/

  var PH = ['Phase A', 'Phase B', 'Phase C'];
  var CC = { cy: '#00b9f0', te: '#00c8dc', gn: '#19c877', ye: '#e8c819', re: '#e83c19', bl: '#2a74f4', vi: '#9486f7', gr: '#6e8fb0' };
  var SPECS = {
    statcom: {
      'Widget/Operating Point': [
        { k: 'line', t: '무효전력 추이', unit: 'Mvar', dec: 1, series: [['161kV Reactive Power', CC.cy, 98.6, 1.6]], lo: 80, hi: 120 },
        { k: 'gauge', t: '무효전력', unit: 'Mvar', v: [98.6, 1.4], max: 200, c: CC.cy, dec: 1 },
      ],
      'Widget/Bus Voltage': [
        { k: 'bar', t: '상별 전압', unit: 'kV', cats: PH, vals: [92, 93, 92], max: 110, c: CC.cy, dec: 1 },
        { k: 'line', t: '연계모선전압 추이', unit: 'kV', dec: 1, series: [['대표 전압', CC.te, 160, 0.8]], lo: 150, hi: 170 },
        { k: 'gauge', t: '대표 전압', unit: 'kV', v: [160, 0.6], max: 200, c: CC.te, dec: 1 },
      ],
      'Widget/Phase Current': [
        { k: 'line', t: '상별 전류 추이', unit: 'A', dec: 1, series: [[PH[0], CC.cy, 182, 1.8], [PH[1], CC.gn, 179, 1.8], [PH[2], CC.vi, 181, 1.8]], lo: 165, hi: 195 },
        { k: 'hbar', t: '상별 전류', unit: 'A', cats: PH, vals: [182, 179, 181], max: 220, c: CC.cy, dec: 1 },
      ],
    },
    power: {
      'Widget/Transformer Status': [
        { k: 'line', t: '권선온도 추이', unit: '℃', dec: 1, series: [['권선온도', CC.ye, 62.1, 0.8]], lo: 50, hi: 75 },
        { k: 'gauge', t: '권선온도', unit: '℃', v: [62.1, 0.6], max: 120, c: CC.ye, dec: 1 },
      ],
      'Widget/Temperature Power Status': [
        { k: 'area', t: '절연유 온도 추이', unit: '℃', dec: 1, series: [['절연유 온도', CC.te, 58.6, 0.7]], lo: 45, hi: 70 },
        { k: 'donut', t: '냉각팬 운전', parts: [['운전', CC.gn, 3], ['정지', CC.gr, 3]] },
      ],
      'Widget/Reactor Switch Status': [
        { k: 'donut', t: '리액터 스위치', parts: [['ON', CC.gn, 2], ['OFF', CC.gr, 1]] },
      ],
    },
    valve: {
      'Widget/Valve Room Environment': [
        { k: 'line', t: '밸브실 온도 추이', unit: '℃', dec: 1, series: [['부스 온도', CC.cy, 28, 0.5], ['냉각수 유입구', CC.gn, 22.1, 0.4], ['냉각수 출구', CC.ye, 27.6, 0.4]], lo: 18, hi: 32 },
        { k: 'bar', t: '밸브실 온도', unit: '℃', cats: ['부스', '유입구', '출구'], vals: [28, 22.1, 27.6], max: 40, c: CC.cy, dec: 1 },
      ],
      'Widget/Submodule Status': [
        { k: 'donut', t: '서브모듈 상태 비중', parts: [['Run / Ready', CC.gn, 133], ['Alarm / Warning', CC.ye, 4], ['Standby / Halt', CC.gr, 4], ['Fault / Trip', CC.re, 2], ['Bypass', CC.bl, 1]] },
        { k: 'hbar', t: '상태별 서브모듈', unit: '개', cats: ['Fault', 'Bypass', 'Alarm', 'Standby'], vals: [2, 1, 4, 4], max: 8, c: CC.ye },
      ],
      'Widget/Trip Alarm Bypass Status': [
        { k: 'bar', t: 'Trip / Alarm / Bypass', unit: '건', cats: ['SM Trip', 'SM Alarm', 'RX Alarm', 'Bypass SW'], vals: [28, 22.1, 27.6, 27.6], max: 40, c: CC.ye, dec: 1 },
        { k: 'donut', t: '현황 비중', parts: [['SM Trip', CC.re, 28], ['SM Alarm', CC.ye, 22], ['RX Alarm', CC.te, 28], ['Bypass SW', CC.bl, 28]] },
      ],
    },
    cooling: {
      'Widget/Cooling Room Readings': [
        { k: 'line', t: '유입 · 출구 온도 추이', unit: '℃', dec: 1, series: [['유입 온도', CC.cy, 22.5, 0.4], ['출구 온도', CC.ye, 28.3, 0.4]], lo: 18, hi: 32 },
        { k: 'gauge', t: '유량', unit: 'L/min', v: [4.8, 0.15], max: 10, c: CC.te, dec: 1 },
        { k: 'area', t: '전도도 추이', unit: 'μS/cm', dec: 1, series: [['전도도', CC.gn, 2.1, 0.08]], lo: 1.5, hi: 2.7 },
      ],
      'Widget/Cooler Pump Status': [
        { k: 'hbar', t: '펌프 누적 가동 시간', unit: 'h', cats: ['P1', 'P2'], vals: [2847, 1203], max: 3500, c: CC.cy },
        { k: 'donut', t: '펌프 가동 비중', parts: [['P1', CC.cy, 2847], ['P2', CC.gr, 1203]] },
      ],
      'Widget/Cooler Status': [
        { k: 'bar', t: '냉각기별 팬 운전', unit: '대', cats: ['냉각기1', '냉각기2'], vals: [8, 6], max: 8, c: CC.gn },
      ],
    },
    supply: {
      'Widget/House Transformer': [
        { k: 'gauge', t: '보호레벨', unit: 'Level', v: [1, 0.01], max: 5, c: CC.te, dec: 0 },
      ],
      'Widget/AC Power Room': [
        { k: 'donut', t: 'MCCB 운전상태', parts: [['운전', CC.gn, 12], ['정지', CC.gr, 1]] },
      ],
      'Widget/DC Power Room': [
        { k: 'line', t: '전원전압 추이', unit: 'V', dec: 1, series: [['전원전압', CC.cy, 125, 0.7]], lo: 118, hi: 132 },
        { k: 'gauge', t: '전원전압', unit: 'V', v: [125, 0.5], max: 150, c: CC.cy, dec: 1 },
      ],
      'Widget/Battery Room': [
        { k: 'area', t: '셀별 충전전압 평균 추이', unit: 'V', dec: 1, series: [['충전전압', CC.cy, 129.6, 0.5]], lo: 125, hi: 134 },
      ],
    },
    safety: {
      'Widget/Controller Status': [
        { k: 'donut', t: '제어기 상태', parts: [['정상', CC.gn, 6], ['점검', CC.ye, 1]] },
      ],
      'Widget/Control Board Status': [
        { k: 'bar', t: '제어 보드 포트', unit: '%', cats: ['Ethernet', 'SRIO', 'SM RX'], vals: [98, 97, 99], max: 100, c: CC.te },
      ],
      'Widget/Room Safety': [
        { k: 'donut', t: '실별 안전 상태', parts: [['정상', CC.gn, 4], ['닫힘', CC.cy, 2]] },
      ],
    },
    simulation: {
      'Widget/3D Process Animation': [
        { k: 'hbar', t: '설치 시퀀스 진행률', unit: '%', cats: ['운송', '반입', '설치', '조립'], vals: [100, 39, 0, 0], max: 100, c: CC.cy },
      ],
    },
    alarm: {
      'Widget/Alarm Message': [
        { k: 'donut', t: '확인 현황', parts: [['미확인', CC.ye, 8], ['확인', CC.gn, 10]] },
      ],
    },
  };
  var CARD_SPECS = {
    'STATCOM': [{ k: 'line', t: '출력 추이', unit: 'Mvar', dec: 1, series: [['출력', CC.cy, 98.6, 1.4]], lo: 85, hi: 112 }, { k: 'gauge', t: '출력', unit: 'Mvar', v: [98.6, 1], max: 200, c: CC.cy, dec: 1 }],
    'Cooling System': [{ k: 'line', t: '출구 온도 추이', unit: '℃', dec: 1, series: [['출구 온도', CC.cy, 29.7, 0.4]], lo: 24, hi: 35 }, { k: 'gauge', t: '출구 온도', unit: '℃', v: [29.7, .3], max: 60, c: CC.cy, dec: 1 }],
    'MMC Valve': [{ k: 'line', t: '밸브 온도 추이', unit: '℃', dec: 1, series: [['밸브 온도', CC.cy, 32.4, 0.4]], lo: 26, hi: 38 }, { k: 'gauge', t: '평균 사용률', unit: '%', v: [41.7, .8], max: 100, c: CC.te, dec: 1 }],
    'Control Panel': [{ k: 'area', t: 'CPU 사용률 추이', unit: '%', dec: 1, series: [['CPU 사용률', CC.cy, 24.6, 1.2]], lo: 10, hi: 40 }, { k: 'gauge', t: 'CPU 사용률', unit: '%', v: [24.6, 1], max: 100, c: CC.cy, dec: 1 }],
    'Transformer': [{ k: 'line', t: '온도 · 유온 추이', unit: '℃', dec: 1, series: [['온도', CC.cy, 58.6, 0.5], ['유온', CC.ye, 56.1, 0.5]], lo: 48, hi: 66 }, { k: 'gauge', t: '부하율', unit: '%', v: [72.3, 1], max: 100, c: CC.te, dec: 1 }],
    'DC System': [{ k: 'line', t: 'DC 전압 추이', unit: 'V', series: [['DC 전압', CC.cy, 6812, 18]], lo: 6750, hi: 6880 }, { k: 'gauge', t: '충전 전류', unit: 'A', v: [12.8, .3], max: 30, c: CC.te, dec: 1 }],
    'AC Filter': [{ k: 'line', t: '온도 추이', unit: '℃', dec: 1, series: [['온도', CC.cy, 34.8, 0.4]], lo: 28, hi: 42 }, { k: 'gauge', t: '전류', unit: 'kV', v: [118.7, 1.2], max: 200, c: CC.te, dec: 1 }],
    'Protection System': [{ k: 'bar', t: '알람 수', unit: '건', cats: ['1h', '6h', '24h'], vals: [0, 1, 2], max: 6, c: CC.ye }],
  };

  var chartUid = 0;
  function installChartSwap(root, st) {
    var savedAll = load(K_CHART), saved = savedAll[st.scene] || {};
    st.charts = {}; st.chartApply = {};
    var probe = document.createElement('i');
    probe.className = 'tc-probe';
    st.frame.appendChild(probe);
    var TG = [];
    var spec = SPECS[st.scene] || {};
    Object.keys(spec).forEach(function (name) {
      var w = one(root, '[data-name="' + name + '"]');
      if (!w) return;
      /* 판 = 제목 다음 칸 */
      var body = kid(w, 'Body') || Array.prototype.filter.call(w.children, function (c) { return c.tagName !== 'P' && c.getAttribute('data-name') !== 'Title' && c.getAttribute('data-name') !== 'Header'; })[0];
      if (body) TG.push({ key: name, w: w, body: body, list: spec[name] });
    });
    if (st.scene === 'cards' || st.scene === 'cooling') {
      all(root, '[data-name^="Equipment Card/"]').forEach(function (c) {
        var n = c.getAttribute('data-name'), list = CARD_SPECS[n.replace('Equipment Card/', '')];
        var body = one(c, '[data-name="List"]');
        if (list && body) TG.push({ key: n, w: c, body: body, list: list });
      });
    }
    TG.forEach(function (tg) {
      if (getComputedStyle(tg.w).position === 'static') tg.w.style.position = 'relative';
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tc-chartbtn';
      btn.innerHTML = KIND_ICON.bar.replace('class="ic"', 'class="ic" style="width:13px;height:11px"') + '차트';
      btn.title = '이 패널의 차트 바꾸기';
      var menu = document.createElement('div');
      menu.className = 'tc-chartmenu';
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
        tg.body.classList.toggle('tc-swapped', i >= 0);
        if (tg.h0 == null) tg.h0 = tg.body.offsetHeight;
        tg.body.style.height = i >= 0 ? clamp(tg.h0, 170, 230) + 'px' : '';
        if (i >= 0 && tg.list[i]) st.charts[tg.key] = makeChart(tg.body, Object.assign({ uid: ++chartUid }, tg.list[i]));
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
        all(root, '.tc-chartmenu.open').forEach(function (m) { if (m !== menu) m.classList.remove('open'); });
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
      if (e.target.closest && e.target.closest('.tc-chartmenu, .tc-chartbtn')) return;
      all(root, '.tc-chartmenu.open').forEach(function (m) { m.classList.remove('open'); });
    };
    document.addEventListener('pointerdown', st.onDocDown, true);
  }

  /* ══════════════════ 12. 패널 옮기기(패널편집) ══════════════════
     왼쪽 패널 위젯 — 끌면 위아래로 자리를 바꾸며 나머지가 흘러 다시 쌓인다.
     설비 카드(11번 화면) — 여덟 자리끼리. 미니맵 · 호버 카드 · 냉각실 설비 카드 — 4px 격자 자유 이동. */
  function installPanelMove(root, st) {
    var L = load(K_LAYOUT), me = L[st.scene] = L[st.scene] || {};
    function persist() { var a = load(K_LAYOUT); a[st.scene] = me; save(K_LAYOUT, a); }
    var panel = one(root, '[data-name="Side Panel"]');
    var widgets = panel ? Array.prototype.slice.call(panel.children) : [];
    widgets.forEach(function (w, i) { w.classList.add('tc-mv'); w.setAttribute('data-tc-kind', 'stack'); w.style.setProperty('--i', i); });
    var origOrder = widgets.slice();
    if (me.order && panel) {
      me.order.forEach(function (n) { var w = widgets.filter(function (x) { return x.getAttribute('data-name') === n; })[0]; if (w) panel.appendChild(w); });
    }
    var frees = all(st.frame, ':scope > [data-name="Minimap"],:scope > [data-name^="Hover Card"],:scope > [data-name^="Popup/"]');
    if (st.scene === 'cooling') frees = frees.concat(all(st.frame, ':scope > [data-name^="Equipment Card/"]'));
    me.free = me.free || {};
    frees.forEach(function (f) {
      f.classList.add('tc-mv'); f.setAttribute('data-tc-kind', 'free');
      var s = me.free[f.getAttribute('data-name')];
      if (s) { f.__ux = s[0]; f.__uy = s[1]; place(f); }
    });
    /* 설비 카드 자리 */
    var cards = st.scene === 'cards' ? all(st.frame, ':scope > [data-name^="Equipment Card/"]') : [];
    var slots = cards.map(function (c) { return { x: c.offsetLeft, y: c.offsetTop }; });
    cards.forEach(function (c, i) { c.__home = slots[i]; c.classList.add('tc-mv'); c.setAttribute('data-tc-kind', 'slot'); c.style.setProperty('--i', i); });
    var slotOrder = cards.slice();
    if (me.slots) {
      var by = {};
      cards.forEach(function (c) { by[c.getAttribute('data-name')] = c; });
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
      if (e.target.closest('.tc-chartbtn, .tc-chartmenu, .tc-resetbtn')) return;
      /* 패널편집은 글자 수정과 함께 켜진다 — 글자 위에서 시작한 끌기는 글자 고르기로 둔다 */
      if (e.target.closest('[contenteditable="true"]')) return;
      var w = e.target.closest('.tc-mv');
      if (!w || !root.contains(w)) return;
      e.preventDefault(); e.stopPropagation();
      drag = { w: w, kind: w.getAttribute('data-tc-kind'), sx: e.clientX, sy: e.clientY, moved: false, top: w.offsetTop, left: w.offsetLeft };
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
      var S = st.S || 1, dx = (e.clientX - drag.sx) / S, dy = (e.clientY - drag.sy) / S;
      if (!drag.moved) {
        if (Math.hypot(dx, dy) < 3) return;
        drag.moved = true;
        drag.w.classList.add('tc-dragging');
      }
      if (drag.kind === 'stack') {
        var off = drag.top - drag.w.offsetTop;
        drag.w.style.translate = dx.toFixed(1) + 'px ' + (dy + off).toFixed(1) + 'px';
        var sib = Array.prototype.slice.call(panel.children).filter(function (x) { return x !== drag.w; });
        var cy = drag.top + dy + drag.w.offsetHeight / 2;
        var before = null;
        for (var i = 0; i < sib.length; i++) { if (cy < sib[i].offsetTop + sib[i].offsetHeight / 2) { before = sib[i]; break; } }
        if (drag.w.nextElementSibling !== before) {
          flip(function () { panel.insertBefore(drag.w, before); }, sib);
          off = drag.top - drag.w.offsetTop;
          drag.w.style.translate = dx.toFixed(1) + 'px ' + (dy + off).toFixed(1) + 'px';
        }
      } else {
        drag.w.__dx = dx; drag.w.__dy = dy;
        place(drag.w);
        if (drag.kind === 'slot') {
          var bx = drag.w.__home.x + (drag.w.__ux || 0) + dx + 164, by2 = drag.w.__home.y + (drag.w.__uy || 0) + dy + 195;
          var best = 0, bd = 1e9;
          slots.forEach(function (s, k) { var d = Math.hypot(s.x + 164 - bx, s.y + 195 - by2); if (d < bd) { bd = d; best = k; } });
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
      if (!d.moved) { w.classList.remove('tc-dragging'); return; }
      void w.offsetWidth;
      w.classList.remove('tc-dragging');
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
        me.slots = slotOrder.map(function (c) { return c.getAttribute('data-name'); });
      }
      persist();
    };
    root.addEventListener('pointerdown', st.onDown, true);
    window.addEventListener('pointermove', st.onMove);
    window.addEventListener('pointerup', st.onUp);
    window.addEventListener('pointercancel', st.onUp);
    st.onDragStart = function (e) { if (layoutEditing(root) && e.target.closest && e.target.closest('.tc-mv')) e.preventDefault(); };
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
    rb.className = 'tc-resetbtn';
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
    var steps = [['fit', installFit], ['clock', installClock], ['nav', installNav], ['fold', installFold], ['choice', installChoice], ['live', installLive], ['spark', installSpark],
      ['valve', installValve], ['sim', installSim], ['alarm', installAlarm], ['swap', installChartSwap], ['move', installPanelMove]];
    if (st.scene === 'login') steps = steps.filter(function (s) { return /fit|nav/.test(s[0]); });
    if (/^vr-/.test(st.scene)) steps = [['fit', installFit], ['vr', installVR], ['move', installPanelMove]];
    steps.forEach(function (s) { try { s[1](root, st); } catch (e) { console.warn('[tc] ' + s[0], e); } });
    all(root, '[data-name^="Equipment Card/"]').forEach(function (c, i) { c.style.setProperty('--i', i); });
    root.classList.add('tc-enter');
    st.timers.push(setTimeout(function () { root.classList.remove('tc-enter'); }, 1100));
  }
  function initStatcom(root) {
    if (!root || root.__tc) return;
    injectStyle();
    root.classList.add('tc-root');
    var px = /(tc[a-z]|tv[a-z])-root/.exec(root.className);
    var st = root.__tc = { timers: [], styles: [], px: px ? px[1] : 'tcs', scene: px ? SCENES[px[1]] : 'statcom' };
    if (/[?&]edit=1/.test(location.search)) root.classList.add('tc-edit-layout');
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
  function disposeStatcom(root) {
    var st = root && root.__tc;
    if (!st) return;
    if (st.wait) st.wait.disconnect();
    st.timers.forEach(function (t) { clearInterval(t); clearTimeout(t); });
    clearTimeout(st.feed);
    cancelAnimationFrame(st.raf);
    if (st.ro) st.ro.disconnect();
    if (st.obs) st.obs.disconnect();
    if (st.onKey) window.removeEventListener('keydown', st.onKey);
    if (st.onResize) window.removeEventListener('resize', st.onResize);
    Object.keys(st.charts || {}).forEach(function (k) { st.charts[k].dispose(); });
    if (st.onDocDown) document.removeEventListener('pointerdown', st.onDocDown, true);
    if (st.onDown) root.removeEventListener('pointerdown', st.onDown, true);
    if (st.onMove) window.removeEventListener('pointermove', st.onMove);
    if (st.onUp) { window.removeEventListener('pointerup', st.onUp); window.removeEventListener('pointercancel', st.onUp); }
    if (st.onDragStart) root.removeEventListener('dragstart', st.onDragStart);
    if (st.onReset) document.removeEventListener('click', st.onReset, true);
    st.styles.forEach(function (s) { s.remove(); });
    root.__tc = null;
  }
  window.initStatcom = initStatcom;
  window.disposeStatcom = disposeStatcom;
})();
