/* 무선망 통합관리 대시보드 — 재구축 화면 8장의 인터랙션 · 라이브 · 반응형 레이어.
   window.initWnms(root) / window.disposeWnms(root)

   화면(DOM·CSS)은 생성기(src/wnms/_gen/conv.js)가 Figma(WdpL1qGqIo76WQavOsDvp6) 그대로 만든다.
   이 파일은 그 위에 '움직이는 것'만 얹는다 — 정지 상태(?live=0) = Figma 원본.

   · 반응형 — 1920x1080 좌표계 + 균일 배율 S. 남는 폭 · 높이는 패널 · 바탕이 나눠 갖는다(여백 없음). 정확히 16:9 면 Figma 그대로
   · 실시간 시계(헤더 날짜 · 시각)
   · 최근 시각 — 이벤트 현황의 발생시간을 열 때마다 '지금' 기준으로 다시 찍고, 시간이 흐르면 새 이벤트가 위에 쌓인다
   · 라이브 데이터 — 서버 CPU · 메모리 막대, Top Traffic, 장애 표시 깜빡임
   · 마우스 오버 — GNB 메뉴 · 장비 메뉴 타일 · 단추 · 표 줄 · 항목 · 계통도 장비 · 라벨 · 랙 라벨 · 로그인
   · 접기 — 이벤트 현황의 Fold Button(원본 아이콘 type-drop-close.svg), 펼친 GNB 의 메뉴 묶음
   · 화면 잇기 — GNB 메뉴 · 장비 메뉴 · 로그인/로그아웃 · 랙 라벨(시점 전환)
   · 차트 바꾸기(패널편집 중) — 패널마다 이 시스템에 맞는 추천 차트. '원본 그대로'로 되돌린다
   · 패널 옮기기(패널편집 중) — 옆 열 패널은 놓는 자리와 맞바꾸고(크기는 자리를 따른다), 가운데 열은 위/아래를 바꾼다

   src/wnms-live.js 는 생성물이다. 이 파일을 고쳐 `node mk-live.js`. 고친 뒤 js/core/tpl-modules.js 의 ?v= 를 올릴 것. */
(function () {
  'use strict';

  var BASE_W = 1920, BASE_H = 1080;
  var K_LAYOUT = 'wemb-wnms-layout', K_CHART = 'wemb-wnms-chart', K_FOLD = 'wemb-wnms-fold';
  var STYLE_ID = 'wnms-live-style';
  var EASE = 'cubic-bezier(.22,.8,.24,1)';
  var SCENES = { wnm: 'main', wno: 'main-open', wnx: 'main-expanded', wnt: 'room-top', wnv: 'room-view', wne: 'equipment', wnd: 'detail', wnl: 'login' };
  function isMain(sc) { return /^main/.test(sc); }
  function isRoom(sc) { return /^room/.test(sc); }
  function isDiag(sc) { return sc === 'equipment' || sc === 'detail'; }

  var CSS = [
    '.wn-root{--wn-acc:12,77,161;overflow:clip!important;}',
    '.wn-root[data-theme="dark"]{--wn-acc:111,168,255;}',
    '.wn-root.wn-resizing *,.wn-root .wn-dragging,.wn-root .wn-dragging *{transition:none!important;}',
    '.wn-root .wn-probe{position:absolute;width:0;height:0;overflow:hidden;color:#0c4da1;}',
    '.wn-root .wn-click{cursor:pointer;}',
    '.wn-root .wn-click *{cursor:inherit;}',
    '.dt-content-editing .wn-root .wn-click,.dt-content-editing .wn-root .wn-click *{cursor:text;}',
    /* 들어올 때 */
    '@keyframes wnIn{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:none;}}',
    '@keyframes wnFade{from{opacity:0;}to{opacity:1;}}',
    '.wn-root.wn-enter [data-name^="Widget/"]:not([data-name="Widget/3D View"]),.wn-root.wn-enter [data-name="Summary Banner"]{animation:wnIn .5s ' + EASE + ' both;animation-delay:calc(var(--i,0) * 60ms);}',
    '.wn-root.wn-enter [data-name="Widget/3D View"],.wn-root.wn-enter [data-name="Scene Image"]{animation:wnFade .7s ease both;}',
    '.wn-root.wn-enter [data-name^="Node/"],.wn-root.wn-enter [data-name^="Device/"],.wn-root.wn-enter [data-name^="Label/"],.wn-root.wn-enter [data-name^="Zone Label/"],.wn-root.wn-enter [data-name^="Rack Label/"]{animation:wnIn .45s ' + EASE + ' both;animation-delay:calc(var(--i,0) * 22ms);}',
    '.wn-root.wn-enter [data-name="Login Card"]{animation:wnIn .6s ' + EASE + ' both;}',
    /* GNB */
    '.wn-root [data-name^="Nav Item/"]{transition:background-color .2s ease,translate .2s ease;cursor:pointer;border-radius:10px;}',
    '.wn-root [data-name^="Nav Item/"]:hover{background-color:rgba(var(--wn-acc),.08);}',
    '.wn-root [data-name^="Nav Item/"]:active{translate:0 1px;}',
    '.wn-root [data-name^="Nav Item/"] img,.wn-root [data-name="Toolbar"] img{transition:filter .2s ease,scale .2s ease;}',
    '.wn-root [data-name^="Nav Item/"]:hover img{scale:1.08;}',
    '.wn-root [data-name="Nav Header"],.wn-root [data-name^="Nav Header/"]{cursor:pointer;transition:filter .2s ease,box-shadow .2s ease;}',
    '.wn-root [data-name="Nav Header"]:hover,.wn-root [data-name^="Nav Header/"]:hover{filter:brightness(1.12);box-shadow:0 4px 12px rgba(var(--wn-acc),.28);}',
    '.wn-root [data-name="Nav Header"] [data-name^="Icon/Common/Drop"],.wn-root [data-name^="Nav Header/"] [data-name^="Icon/Common/Drop"]{transition:rotate .35s ' + EASE + ';}',
    '.wn-root .wn-gfold [data-name^="Icon/Common/Drop"]{rotate:-90deg;}',
    '.wn-root [data-name="Nav Items"]{overflow:hidden;transition:height .38s ' + EASE + ',opacity .3s ease;}',
    '.wn-root .wn-gfold > [data-name="Nav Items"]{opacity:0;}',
    '.wn-root [data-name="Toolbar"] [data-name^="Icon/"]{cursor:pointer;}',
    '.wn-root [data-name="Toolbar"] [data-name^="Icon/"]:hover img{scale:1.12;}',
    /* 요약 배너 — 장비 메뉴 타일 · DU */
    '.wn-root [data-name="Widget/Equipment Menu"] [data-name^="Item/"]{transition:translate .28s ' + EASE + ',filter .28s ease;cursor:pointer;}',
    '.wn-root [data-name="Widget/Equipment Menu"] [data-name^="Item/"]:hover{translate:0 -6px;filter:brightness(1.1) drop-shadow(0 8px 10px rgba(0,60,30,.28));}',
    '.wn-root [data-name="Widget/Equipment Menu"] [data-name^="Item/"]:active{translate:0 -2px;}',
    '.wn-root [data-name^="Status/DU"]{transition:scale .2s ease;cursor:pointer;}',
    '.wn-root [data-name^="Status/DU"]:hover{scale:1.1;}',
    '@keyframes wnAlarm{0%,100%{filter:none;}50%{filter:drop-shadow(0 0 6px #ff3b3b) brightness(1.25);}}',
    '.wn-root [data-name$="(Critical)"] [data-name="Marker"]{animation:wnAlarm 1.4s ease-in-out infinite;}',
    '.wn-root [data-name^="Metric/"] [data-name="Value Box"]{transition:box-shadow .2s ease;}',
    '.wn-root [data-name^="Metric/"]:hover [data-name="Value Box"]{box-shadow:0 0 0 1px rgba(255,255,255,.55),0 0 14px rgba(120,190,255,.45);}',
    /* 단추 */
    '.wn-root [data-name^="Button/"]{cursor:pointer;transition:filter .18s ease,translate .18s ease,box-shadow .18s ease;}',
    '.wn-root [data-name^="Button/"]:hover{filter:brightness(1.12);translate:0 -1px;box-shadow:0 6px 14px rgba(var(--wn-acc),.3);}',
    '.wn-root [data-name^="Button/"]:active{translate:0 0;filter:brightness(.92);}',
    '.wn-root [data-name^="Button/"].wn-on{box-shadow:inset 0 0 0 2px rgba(255,255,255,.85);filter:brightness(1.18);}',
    /* 패널 */
    '.wn-root [data-name^="Row/"]{transition:background-color .18s ease;}',
    '.wn-root [data-name="Widget/Equipment Status"] [data-name^="Row/"]:hover,.wn-root [data-name="Widget/Event Status"] [data-name^="Row/"]:hover{background-color:rgba(var(--wn-acc),.06);}',
    '.wn-root [data-name^="Field/"]{transition:box-shadow .2s ease,translate .2s ease;}',
    '.wn-root [data-name^="Field/"]:hover{box-shadow:0 0 0 1px rgba(var(--wn-acc),.45),0 6px 16px rgba(var(--wn-acc),.12);translate:0 -1px;}',
    '.wn-root [data-name="Widget/Status Summary"] [data-name^="Item/"]{transition:translate .25s ' + EASE + ',box-shadow .25s ease;}',
    '.wn-root [data-name="Widget/Status Summary"] [data-name^="Item/"]:hover{translate:0 -4px;box-shadow:0 10px 22px rgba(var(--wn-acc),.16);}',
    '.wn-root [data-name="Widget/Server List"] [data-name="Bar"]{transform-origin:50% 100%;transition:scale 1.1s ' + EASE + ';}',
    '.wn-root [data-name="Widget/Server List"] [data-name="Bar"]:hover{filter:brightness(1.25);}',
    '@keyframes wnNew{from{background-color:rgba(var(--wn-acc),.22);}to{background-color:rgba(var(--wn-acc),0);}}',
    '.wn-root .wn-new{animation:wnNew 2.4s ease both;}',
    '.wn-root .wn-new > *{animation:wnIn .45s ' + EASE + ' both;}',
    /* 이벤트 현황 접기 */
    '.wn-root .wn-fold{position:absolute;right:4px;top:50%;width:28px;height:28px;margin-top:-14px;display:flex;align-items:center;justify-content:center;border-radius:8px;cursor:pointer;transition:background-color .2s ease;z-index:3;}',
    '.wn-root .wn-fold:hover{background-color:rgba(var(--wn-acc),.1);}',
    '.wn-root .wn-fold img{width:24px;height:24px;transition:rotate .4s ' + EASE + ';}',
    '.wn-root .wn-folded .wn-fold img{rotate:180deg;}',
    '.wn-root [data-name="Widget/Event Status"]{transition:height .45s ' + EASE + ';}',
    '.wn-root [data-name="Widget/Event Status"] > [data-name="Table"]{transition:opacity .3s ease;}',
    '.wn-root .wn-folded > [data-name="Table"]{opacity:0;pointer-events:none;}',
    '.wn-root.wn-live [data-name="Widget/3D View"]{transition:height .45s ' + EASE + ';}',
    '.wn-root.wn-live [data-name="Widget/3D View"] > [data-name="Content"]{transition:transform .45s ' + EASE + ';}',
    /* 계통도 */
    '.wn-root [data-name^="Device/"],.wn-root [data-name^="Node/"] > [data-name="Device"]{transition:translate .3s ' + EASE + ',filter .3s ease;}',
    '.wn-root [data-name^="Device/"]:hover,.wn-root [data-name^="Node/"]:hover > [data-name="Device"]{translate:0 -5px;filter:drop-shadow(0 10px 12px rgba(46,106,240,.35)) brightness(1.06);}',
    '.wn-root [data-name^="Label/"],.wn-root [data-name^="Node/"] > [data-name="Label"]{transition:box-shadow .2s ease,filter .2s ease;}',
    '.wn-root [data-name^="Label/"]:hover,.wn-root [data-name^="Node/"]:hover > [data-name="Label"]{box-shadow:0 4px 14px rgba(46,106,240,.3);filter:brightness(1.04);}',
    '.wn-root [data-name^="Zone Label/"]{transition:filter .2s ease,translate .2s ease;}',
    '.wn-root [data-name^="Zone Label/"]:hover{filter:brightness(1.12);translate:0 -2px;}',
    /* 심각 장비 경보 — 처음(1.8초 · 파동 두 겹 · 밝기 깜빡임)은 "너무 정신없이 커", 줄인 판(2.6초 · 7px)은 "너무 줄었어" → 그 사이.
       모든 장비가 같은 2.2초 박자: 붉은 빛(최대 11px) + 살짝 밝아짐 + 바닥 파동 한 겹(뚜렷하게) + 이름표 테두리 · 옅은 빛 */
    '@keyframes wnCrit{0%,100%{filter:drop-shadow(0 0 2px rgba(255,59,59,.3)) brightness(1);}50%{filter:drop-shadow(0 0 11px rgba(255,59,59,.8)) brightness(1.04);}}',
    '.wn-root .wn-crit{animation:wnCrit 2.2s ease-in-out infinite;}',
    '@keyframes wnWave{0%{opacity:0;scale:.55;}20%{opacity:.75;}100%{opacity:0;scale:1.4;}}',
    '.wn-root .wn-wave{position:absolute;left:50%;top:85%;width:108%;aspect-ratio:2.2/1;translate:-50% -50%;border-radius:50%;pointer-events:none;'
      + 'border:2px solid rgba(255,59,59,.8);background:radial-gradient(closest-side,rgba(255,59,59,.22),rgba(255,59,59,0));'
      + 'animation:wnWave 2.2s ease-out infinite;z-index:0;}',
    '@keyframes wnCritLabel{0%,100%{border-color:rgba(255,59,59,.5);box-shadow:0 0 0 0 rgba(255,59,59,0);}50%{border-color:#ff3b3b;box-shadow:0 0 0 2px rgba(255,59,59,.12),0 0 10px rgba(255,59,59,.35);}}',
    '.wn-root .wn-crit-label{animation:wnCritLabel 2.2s ease-in-out infinite;}',
    '.wn-root .wn-crit-label p{color:#d42a2a!important;}',
    '.wn-root[data-theme="dark"] .wn-crit-label p{color:#ff8a8a!important;}',
    /* 마우스를 올리면 흔들림을 멈추고 또렷하게 */
    '.wn-root .wn-crit:hover{animation-play-state:paused;}',
    '.wn-root .wn-crit:hover > .wn-wave{animation-play-state:paused;opacity:0;}',
    /* 통신실 */
    '@keyframes wnFloat{0%,100%{translate:0 0;}50%{translate:0 -3px;}}',
    '.wn-root [data-name^="Rack Label/"]{cursor:pointer;transition:filter .2s ease,scale .2s ease;animation:wnFloat 3.6s ease-in-out infinite;animation-delay:calc(var(--i,0) * -.7s);}',
    '.wn-root [data-name^="Rack Label/"]:hover{filter:brightness(1.18) drop-shadow(0 4px 10px rgba(34,121,255,.55));scale:1.06;}',
    /* 로그인 */
    '.wn-root [data-name="Input"]{transition:box-shadow .2s ease,background-color .2s ease;}',
    '.wn-root [data-name="Input"]:hover,.wn-root [data-name="Input"]:focus-within{box-shadow:0 0 0 2px rgba(var(--wn-acc),.45);}',
    '.wn-root [data-name="Button/Login"]:hover{box-shadow:0 10px 24px rgba(12,77,161,.4);}',
    /* 다크 — SVG 그림 선(표 구분선 · 차트 눈금선)과 회색 메뉴 아이콘은 CSS 색이 안 닿는다 */
    '.wn-root[data-theme="dark"] [data-name="Divider"] img,.wn-root[data-theme="dark"] [data-name="Grid Lines"] img,.wn-root[data-theme="dark"] [data-name="Grid Line"] img{filter:brightness(.36) saturate(0);}',
    '.wn-root[data-theme="dark"] [data-name^="GNB"] [data-name^="Nav Item/"] img,.wn-root[data-theme="dark"] [data-name^="GNB"] [data-name="Toolbar"] img,.wn-root[data-theme="dark"] [data-name^="GNB"] [data-name="Footer"] img{filter:invert(1) brightness(.82) saturate(0);}',
    '.wn-root[data-theme="dark"] .wn-fold img{filter:invert(1) brightness(.88);}',
    /* 로그인 왼쪽 위 로고 칩(검은 판) — 다크 바탕에 묻히지 않게 옅은 테두리 */
    '.wn-root[data-theme="dark"] [data-name="black"]{border-radius:8.31px;box-shadow:0 0 0 1px rgba(255,255,255,.16),0 4px 14px rgba(0,0,0,.35);}',
    '.wn-root[data-theme="dark"] [data-name^="Nav Item/"]:hover{background-color:rgba(255,255,255,.06);}',
    /* 패널 편집 */
    '.dt-editing .wn-root [data-name]{animation:none!important;}',
    '.dt-editing .wn-root .wn-mv,.wn-root.wn-edit-layout .wn-mv{cursor:move;outline:1px dashed rgba(var(--wn-acc),.6);outline-offset:3px;}',
    '.wn-root .wn-dragging{z-index:9;opacity:.92;box-shadow:0 18px 40px rgba(0,0,0,.25);}',
    '.wn-root .wn-drop{outline:2px solid rgba(var(--wn-acc),.85)!important;outline-offset:3px;}',
    '.wn-root .wn-host{position:absolute;z-index:2;display:none;}',
    '.wn-root .wn-swapped > .wn-host{display:block;}',
    '.wn-root .wn-resetbtn{display:none;position:absolute;right:24px;top:76px;z-index:30;height:32px;padding:0 14px;border-radius:8px;border:1px solid rgba(var(--wn-acc),.55);background:#fff;color:#1f2a3d;font:600 14px "Pretendard Variable",Pretendard,sans-serif;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.12);}',
    '.dt-editing .wn-root .wn-resetbtn,.wn-root.wn-edit-layout .wn-resetbtn{display:block;}',
    '.wn-root[data-theme="dark"] .wn-resetbtn{background:#1b1d23;color:#eceef2;border-color:rgba(255,255,255,.14);}',
    '@media (prefers-reduced-motion:reduce){.wn-root *{animation:none!important;transition:none!important;}}',
    /*@CHART_CSS*/
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
  function kidStarts(el, pre) { return el ? Array.prototype.filter.call(el.children, function (c) { return (c.getAttribute('data-name') || '').indexOf(pre) === 0; })[0] : null; }
  function editing() { return !!document.querySelector('.dtstage.dt-content-editing, .dtstage.dt-editing, .dt-content-editing, .dt-editing'); }
  function layoutEditing(root) { return !!(root.closest('.dt-editing') || root.classList.contains('wn-edit-layout')); }
  function idle() { return typeof window.__wembIdle === 'function' ? window.__wembIdle() : document.hidden; }
  function load(k) { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function comma(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  /* 사용자가 고친 글자는 라이브가 덮지 않는다 */
  function claimed(p) { return p.__wnLast != null && p.textContent !== p.__wnLast; }
  function write(p, s) {
    if (!p || p === document.activeElement || claimed(p)) return;
    if (p.textContent !== s) p.textContent = s;
    p.__wnLast = p.textContent;
  }
  function clickable(el, fn) {
    if (!el) return;
    el.classList.add('wn-click');
    el.addEventListener('click', function (e) { if (editing()) return; e.stopPropagation(); fn(e); });
  }
  function frameOf(root) { return root.querySelector(':scope > [data-node-id]'); }
  function imp(el, p, v) { if (el) el.style.setProperty(p, v, 'important'); }
  function goto(scene) {
    if (window.__gotoWnmsScene) { window.__gotoWnmsScene(scene); return; }
    location.href = scene + '.html' + location.search;
  }
  /* 에셋 폴더 — 미리보기는 ./ , 스튜디오는 src/wnms/ */
  function assetBase(root) {
    var img = root.querySelector('img[src*="/"]');
    var s = img ? img.getAttribute('src') : './x.svg';
    return s.slice(0, s.lastIndexOf('/') + 1);
  }
  var DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  function fmtDate(n) { return n.getFullYear() + '. ' + p2(n.getMonth() + 1) + '. ' + p2(n.getDate()) + ' ' + DOW[n.getDay()]; }
  function fmtStamp(n) { return n.getFullYear() + '-' + p2(n.getMonth() + 1) + '-' + p2(n.getDate()) + ' ' + p2(n.getHours()) + ':' + p2(n.getMinutes()) + ':' + p2(n.getSeconds()); }

  /* ══════════════════ 1. 화면 맞추기 ══════════════════
     좌표계는 1920x1080 그대로, 화면 비율만큼 캔버스를 넓혀(VW x VH) 균일 배율 S 로 그린다 — 늘어나는 왜곡도 여백도 없다. */
  function installFit(root, st) {
    var frame = frameOf(root);
    st.frame = frame;
    frame.style.position = 'absolute'; frame.style.left = '0'; frame.style.top = '0';
    frame.style.transformOrigin = '0 0';
    var gnb = Array.prototype.filter.call(frame.children, function (c) { return /^(GNB|Step=|Type=Landscape)/.test(c.getAttribute('data-name') || ''); })[0];
    st.gnb = gnb;
    var layout = function () {};
    if (isMain(st.scene)) layout = mainLayout(frame, st, gnb);
    else if (isRoom(st.scene)) layout = roomLayout(frame, st, gnb);
    else if (isDiag(st.scene)) layout = diagLayout(frame, st, gnb);
    else if (st.scene === 'login') layout = loginLayout(frame, st);
    st.layout = layout;
    function fit() {
      var W = root.clientWidth, H = root.clientHeight;
      if (!W || !H) return;
      var S = Math.min(W / BASE_W, H / BASE_H), VW = W / S, VH = H / S;
      var exW = Math.max(0, VW - BASE_W), exH = Math.max(0, VH - BASE_H);
      if (exW < 0.01) exW = 0;
      if (exH < 0.01) exH = 0;
      st.S = S; st.exW = exW; st.exH = exH; st.VW = BASE_W + exW; st.VH = BASE_H + exH;
      frame.style.width = st.VW + 'px'; frame.style.height = st.VH + 'px';
      frame.style.transform = S === 1 ? 'none' : 'scale(' + S + ')';
      /* GNB 뿌리가 인스턴스 감싸개(GNB/Landscape 를 품은 것)면 안쪽 판도 같이 늘인다 — 판 안의 Body · Footer 는 건드리지 않는다 */
      if (gnb) { imp(gnb, 'height', st.VH + 'px'); Array.prototype.forEach.call(gnb.children, function (c) { if (/^(GNB|Step=)/.test(c.getAttribute('data-name') || '')) imp(c, 'height', st.VH + 'px'); }); }
      layout(st.VW, st.VH, exW, exH);
    }
    var rsT = 0;
    function relayout() {
      root.classList.add('wn-resizing');
      fit();
      clearTimeout(rsT);
      rsT = setTimeout(function () { root.classList.remove('wn-resizing'); }, 140);
    }
    st.fit = fit;
    fit();
    if (window.ResizeObserver) { st.ro = new ResizeObserver(relayout); st.ro.observe(root); }
    else { st.onResize = relayout; window.addEventListener('resize', relayout); }
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('wn-live'); }); });
  }

  /* 메인 — 오토레이아웃 그대로. 내용 폭 · 위젯 줄 높이를 넓히고, 옆 열은 두 번째 패널이, 가운데 열은 3D 뷰와 이벤트가 남는 높이를 나눈다 */
  var SLOT_H = { 'Column/Left': 313, 'Column/Right': 495 };
  function mainLayout(frame, st, gnb) {
    var content = kid(frame, 'Content'), header = kid(frame, 'Header');
    var row = kid(content, 'Widget Row');
    var cols = { L: kid(row, 'Column/Left'), C: kid(row, 'Column/Center'), R: kid(row, 'Column/Right') };
    st.cols = cols;
    var view = one(row, '[data-name="Widget/3D View"]'), ev = one(row, '[data-name="Widget/Event Status"]');
    var inner = view ? kid(view, 'Content') : null;
    st.view = view; st.event = ev;
    if (view) { imp(view, 'overflow', 'hidden'); imp(view, 'flex', 'none'); }
    if (inner) inner.style.transformOrigin = '41px 81px';
    /* 표 줄이 칸을 나눠 갖게(높이가 바뀌어도 줄 간격이 고르게) */
    all(row, '[data-name="Widget/Equipment Status"] [data-name="Table"] > [data-name^="Row/"]').forEach(function (r) { imp(r, 'flex', '1 1 0'); imp(r, 'min-height', '0'); imp(r, 'height', 'auto'); });
    function sizeSide() {
      ['L', 'R'].forEach(function (k) {
        var col = cols[k];
        if (!col) return;
        var w = Array.prototype.filter.call(col.children, function (c) { return /^Widget\//.test(c.getAttribute('data-name') || ''); });
        w.forEach(function (p, i) {
          if (i === 0) { imp(p, 'flex', 'none'); imp(p, 'height', SLOT_H[col.getAttribute('data-name')] + 'px'); }
          else { imp(p, 'flex', '1 1 0'); imp(p, 'height', 'auto'); imp(p, 'min-height', '0'); }
          imp(p, 'overflow', 'hidden');
          /* 제목은 위에 붙이고 내용 칸이 남는 높이를 갖는다(원본은 가운데 정렬이라 늘이면 내용이 아래로 처진다) */
          imp(p, 'justify-content', 'flex-start');
          var body = kid(p, 'Body');
          if (body) {
            imp(body, 'height', '100%'); imp(body, 'display', 'flex'); imp(body, 'flex-direction', 'column');
            var last = body.lastElementChild;
            if (last && last.getAttribute('data-name') !== 'Title') { imp(last, 'flex', '1 1 0'); imp(last, 'min-height', '0'); }
            /* 상태현황 — 카드가 남는 높이를 채운다(가운데 정렬로 아래에 처지지 않게) */
            if (p.getAttribute('data-name') === 'Widget/Status Summary' && last) {
              imp(last, 'align-items', 'stretch');
              Array.prototype.forEach.call(last.children, function (it) { imp(it, 'display', 'flex'); imp(it, 'flex-direction', 'column'); var cd = it.firstElementChild; if (cd) { imp(cd, 'flex', '1 1 0'); imp(cd, 'height', 'auto'); imp(cd, 'justify-content', 'center'); } });
            }
          }
        });
      });
    }
    st.sizeSide = sizeSide;
    sizeSide();
    function sizeCenter() {
      if (!view || !ev || !cols.C) return;
      var cw = cols.C.clientWidth, ch = cols.C.clientHeight;
      /* 3D 뷰는 폭을 따라 커지되 열 높이의 62% 를 넘지 않는다(울트라와이드에서 이벤트 표가 밀려나지 않게) */
      var k = cw / 962, vh = Math.min(481 * k, Math.max(481, ch * 0.62));
      var evFull = ch - 20 - vh;
      var folded = ev.classList.contains('wn-folded');
      var evH = folded ? (st.evTitleH || 66) : evFull;
      var hh = ch - 20 - evH;
      imp(ev, 'flex', 'none'); imp(ev, 'height', evH.toFixed(2) + 'px');
      imp(view, 'width', cw.toFixed(2) + 'px'); imp(view, 'height', hh.toFixed(2) + 'px');
      var k2 = Math.max(cw / 962, hh / 481);
      var tx = (cw - 962 * k2) / 2, ty = (hh - 481 * k2) / 2;
      if (inner) inner.style.transform = 'translate(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px) scale(' + k2.toFixed(5) + ')';
    }
    st.sizeCenter = sizeCenter;
    /* 헤더 — 원본은 오른쪽 정렬 + 제목과 시계 사이 간격 358 로 제목을 내용 가운데(-15px)에 둔다.
       넓어지면 그 간격을 다시 재서 제목은 가운데, 시계는 오른쪽 끝을 지킨다 */
    var hTitle = header ? kid(header, 'Title') : null, hStamp = header ? kid(header, 'Timestamp') : null;
    if (header) { imp(header, 'left', '68px'); imp(header, 'margin-left', '0'); imp(header, 'transform', 'none'); imp(header, 'translate', 'none'); }
    /* 열 높이는 원본이 791 로 박혀 있다 → 위젯 줄을 따라가게 */
    ['L', 'C', 'R'].forEach(function (k) { if (cols[k]) imp(cols[k], 'height', '100%'); });
    return function (VW, VH) {
      imp(content, 'width', (VW - 68) + 'px');
      if (header) {
        var Wc = VW - 68;
        imp(header, 'width', Wc + 'px');
        if (hTitle && hStamp) imp(header, 'gap', Math.max(20, Wc - 50 - hStamp.offsetWidth - (Wc / 2 - 15 + hTitle.offsetWidth / 2)).toFixed(2) + 'px');
      }
      imp(row, 'height', (791 + VH - 1080) + 'px');
      sizeCenter();
    };
  }

  /* display:contents 묶음은 상자가 없어 translate 가 안 먹는다 → 자식으로 내려간다 */
  function boxes(list) {
    var out = [];
    list.forEach(function (c) { if (getComputedStyle(c).display === 'contents') out = out.concat(boxes(Array.prototype.slice.call(c.children))); else out.push(c); });
    return out;
  }

  /* 통신실 — 바탕 층은 화면을 덮고, 장면 그림과 랙 라벨은 가운데를 지킨다 */
  function roomLayout(frame, st, gnb) {
    var bgs = Array.prototype.filter.call(frame.children, function (c) { return /^Background\//.test(c.getAttribute('data-name') || ''); });
    var movers = boxes(Array.prototype.filter.call(frame.children, function (c) { return c !== gnb && bgs.indexOf(c) < 0; }));
    bgs.forEach(function (b) { b.__w0 = b.offsetWidth; b.__l0 = b.offsetLeft; });
    return function (VW, VH, exW, exH) {
      bgs.forEach(function (b) {
        imp(b, 'width', (b.__w0 + exW) + 'px'); imp(b, 'height', VH + 'px');
        if (b.style.right !== '') imp(b, 'right', '0');
      });
      movers.forEach(function (m) { m.style.translate = (exW || exH) ? (exW / 2).toFixed(2) + 'px ' + (exH / 2).toFixed(2) + 'px' : ''; });
    };
  }

  /* 계통도 — 격자 바탕 · 헤더는 폭을, GNB 는 높이를 채우고, 도면은 가운데로 */
  function diagLayout(frame, st, gnb) {
    var bg = kid(frame, 'Background'), header = kid(frame, 'Header');
    var bar = header ? kid(header, 'Header Bar') : null;
    var movers = boxes(Array.prototype.filter.call(frame.children, function (c) { return c !== gnb && c !== bg && c !== header; }));
    return function (VW, VH, exW, exH) {
      if (bg) { imp(bg, 'width', VW + 'px'); imp(bg, 'height', VH + 'px'); Array.prototype.forEach.call(bg.children, function (c) { imp(c, 'width', '100%'); imp(c, 'height', '100%'); }); }
      if (header) imp(header, 'width', VW + 'px');
      if (bar) imp(bar, 'width', VW + 'px');
      movers.forEach(function (m) { m.style.translate = (exW || exH) ? (exW / 2).toFixed(2) + 'px ' + (exH / 2).toFixed(2) + 'px' : ''; });
    };
  }

  /* 로그인 — 바탕 그림은 화면을 덮도록 키우고, 카드는 같은 비율 자리에 */
  function loginLayout(frame, st) {
    var bgs = Array.prototype.filter.call(frame.children, function (c) { return /^Background\//.test(c.getAttribute('data-name') || ''); });
    var card = kid(frame, 'Login Card');
    bgs.forEach(function (b) { b.style.transformOrigin = (960 - b.offsetLeft) + 'px ' + (540 - b.offsetTop) + 'px'; });
    return function (VW, VH, exW, exH) {
      var k = Math.max(VW / 1920, VH / 1080);
      bgs.forEach(function (b) {
        b.style.translate = (exW || exH) ? (exW / 2).toFixed(2) + 'px ' + (exH / 2).toFixed(2) + 'px' : '';
        b.style.scale = k === 1 ? '' : k.toFixed(4);
      });
      if (card) card.style.translate = (exW || exH) ? (512 * (VW / 1920 - 1)).toFixed(2) + 'px ' + (526 * (VH / 1080 - 1)).toFixed(2) + 'px' : '';
    };
  }

  /* ══════════════════ 2. 시계 ══════════════════ */
  function installClock(root, st) {
    var ds = all(root, '[data-name="Date"]'), ts = all(root, '[data-name="Time"]');
    function tick() {
      var n = new Date();
      ds.forEach(function (d) { write(d, fmtDate(n)); });
      ts.forEach(function (t) { write(t, p2(n.getHours()) + ':' + p2(n.getMinutes()) + ':' + p2(n.getSeconds())); });
    }
    tick();
    st.timers.push(setInterval(tick, 1000));
  }

  /* ══════════════════ 3. 최근 시각 · 새 이벤트 ══════════════════
     원본의 발생시간 간격(2분 32초 · 20분 17초 …)을 그대로 두고 '지금'에서 거꾸로 찍는다 → 열 때마다 방금 일어난 일처럼 보인다. */
  var EV_AGO = [152, 1217, 1587, 2573, 4300, 5766];
  var EV_POOL = [
    ['SVR4', 'SVR4 CPU 사용률(91.20%)이 임계치를 초과했습니다.'],
    ['SVR2', 'SVR2 메모리 사용률(74.60%)이 높습니다.'],
    ['DU3', 'DU3 무선 신호 품질이 저하되었습니다.'],
    ['IPS01', 'CCTV 연계 IPS 정책이 갱신되었습니다.'],
    ['WG-SW02', '워크그룹 스위치 포트 링크가 복구되었습니다.'],
    ['FW01', 'A기지 무선망 방화벽 세션 수가 증가했습니다.'],
    ['NMS01', '무선망관리 시스템 응답이 정상화되었습니다.'],
    ['BB-SW01', '백본스위치 업링크 트래픽(682Mbps)이 높습니다.'],
  ];
  function installEvents(root, st) {
    var ev = one(root, '[data-name="Widget/Event Status"]');
    if (!ev) return;
    var table = kid(ev, 'Table');
    var rows = all(table, '[data-name^="Row/"]');
    var cells = function (r) { return all(r, '[data-name^="Td/"] p').length ? all(r, '[data-name^="Td/"] p') : all(r, 'p'); };
    var now = Date.now();
    rows.forEach(function (r, i) {
      var c = cells(r);
      if (c[1]) write(c[1], fmtStamp(new Date(now - (EV_AGO[i] || (i + 1) * 900) * 1000)));
    });
    var pi = 0;
    function push() {
      if (idle() || editing()) return;
      var data = rows.map(function (r) { return cells(r).map(function (p) { return p; }); });
      if (data.some(function (c) { return c.some(claimed); })) return;
      for (var i = rows.length - 1; i > 0; i--) {
        var a = data[i], b = data[i - 1];
        for (var j = 0; j < a.length; j++) write(a[j], b[j].textContent);
      }
      var e = EV_POOL[pi++ % EV_POOL.length];
      write(data[0][0], e[0]); write(data[0][1], fmtStamp(new Date())); write(data[0][2], e[1]);
      rows[0].classList.remove('wn-new'); void rows[0].offsetWidth; rows[0].classList.add('wn-new');
    }
    var next = function () { st.timers.push(setTimeout(function () { push(); next(); }, rnd(38000, 62000))); };
    next();
  }

  /* ══════════════════ 4. 라이브 데이터 ══════════════════ */
  function installData(root, st) {
    /* 서버 CPU · 메모리 막대 — 원본 막대(그림)를 아래 기준으로 늘였다 줄인다 */
    var BASE = { CPU: [42, 68, 35, 91, 57], Memory: [61, 74, 48, 83, 66] };
    var charts = all(root, '[data-name="Widget/Server List"] [data-name^="Bar Chart/"]').map(function (c) {
      var key = c.getAttribute('data-name').split('/')[1];
      return { bars: all(c, '[data-name="Bar"]'), base: BASE[key] || BASE.CPU, cur: (BASE[key] || BASE.CPU).slice() };
    });
    function stepBars() {
      if (idle()) return;
      charts.forEach(function (ch) {
        ch.bars.forEach(function (b, i) {
          var b0 = ch.base[i], v = clamp(ch.cur[i] + rnd(-7, 7), Math.max(8, b0 - 22), Math.min(97, b0 + 14));
          ch.cur[i] = v;
          b.style.scale = '1 ' + (v / b0).toFixed(4);
        });
      });
    }
    if (charts.length) { st.timers.push(setTimeout(stepBars, 900)); st.timers.push(setInterval(stepBars, 2600)); }
    /* Top Traffic — 숫자가 부드럽게 오간다 */
    var traf = all(root, '[data-name^="Metric/Core"] [data-name="Value"]').map(function (p) { var v = parseFloat(p.textContent) || 0; return { p: p, base: v, cur: v }; });
    function stepTraffic() {
      if (idle()) return;
      traf.forEach(function (t) {
        var from = t.cur, to = clamp(t.cur + rnd(-24, 24), t.base * 0.86, t.base * 1.12), t0 = performance.now();
        t.cur = to;
        var anim = function (now) {
          if (!root.isConnected) return;
          var k = clamp((now - t0) / 700, 0, 1), e = 1 - Math.pow(1 - k, 3);
          write(t.p, String(Math.round(from + (to - from) * e)));
          if (k < 1) requestAnimationFrame(anim);
        };
        requestAnimationFrame(anim);
      });
    }
    if (traf.length) st.timers.push(setInterval(stepTraffic, 3200));
    /* 계통도 — 심각(빨강) 장비 경보: 장비가 붉게 숨 쉬고, 바닥에서 경보 파동이 퍼지고, 이름표가 같이 붉게 깜빡인다.
       상태는 Figma 의 Status 변형을 생성기가 data-status 로 심은 것(_gen/status.json) */
    if (isDiag(st.scene)) {
      all(root, '[data-status="Critical"]').forEach(function (d, i) {
        d.classList.add('wn-crit');
        
        for (var k = 0; k < 1; k++) {
          var w = document.createElement('i');
          w.className = 'wn-wave';
          w.setAttribute('aria-hidden', 'true');
          
          d.insertBefore(w, d.firstChild);
        }
        /* 이름표 — 묶음(Node/…) 안의 Label, 아니면 같은 이름의 Label/… */
        var node = d.parentElement && /^Node\//.test(d.parentElement.getAttribute('data-name') || '') ? d.parentElement : null;
        var lab = node ? kid(node, 'Label') : one(root, '[data-name="' + (d.getAttribute('data-name') || '').replace(/^Device\//, 'Label/') + '"]');
        if (lab) { lab.classList.add('wn-crit-label'); lab.style.setProperty('--d', d.style.getPropertyValue('--d')); }
      });
      /* 경고(Warning) 장비 — 장비는 그대로 두고 이름표만 심각과 같은 빨강으로 알린다(사용자 지시 2026-11-06) */
      all(root, '[data-status="Warning"]').forEach(function (d, i) {
        var node = d.parentElement && /^Node\//.test(d.parentElement.getAttribute('data-name') || '') ? d.parentElement : null;
        var lab = node ? kid(node, 'Label') : one(root, '[data-name="' + (d.getAttribute('data-name') || '').replace(/^Device\//, 'Label/') + '"]');
        if (lab) { lab.classList.add('wn-crit-label'); lab.style.setProperty('--d', (i * -0.53).toFixed(2) + 's'); }
      });
    }
  }

  /* ══════════════════ 5. 화면 잇기 ══════════════════ */
  var NAV_TO = {
    'Nav Item/Wireless Management System': 'main', 'Nav Item/3D Comm Room': 'room-top',
    'Nav Item/NMS Equipment Diagram': 'equipment', 'Nav Item/NMS Detail Diagram': 'detail', 'Nav Item/NMS Diagram': 'equipment',
    'Nav Item/Logout': 'login',
  };
  function installNav(root, st) {
    var gnb = st.gnb;
    if (gnb) {
      all(gnb, '[data-name^="Nav Item/"]').forEach(function (n) {
        var to = NAV_TO[n.getAttribute('data-name')];
        if (to && to !== st.scene) clickable(n, function () { goto(to); });
      });
      /* 접힌 GNB — 아이콘을 누르면 메뉴가 열린다 */
      var collapsed = /Collapsed/.test(gnb.getAttribute('data-name') || '') || !!one(gnb, '[data-name="GNB (Collapsed)"]');
      var tb = one(gnb, '[data-name="Toolbar"]');
      if (tb) Array.prototype.forEach.call(tb.querySelectorAll('[data-name^="Icon/"]'), function (ic) {
        if (ic.parentElement && ic.parentElement.closest('[data-name^="Icon/"]') && ic.parentElement.closest('[data-name^="Icon/"]') !== ic) return;
        var nm = ic.getAttribute('data-name') || '';
        if (/Menu Close/.test(nm)) clickable(ic, function () { goto('main'); });
        else clickable(ic, function () { goto('main-open'); });
      });
      if (collapsed) all(gnb, '[data-name="Menu"] > [data-name^="Nav Item/"]').forEach(function (n) { clickable(n, function () { goto('main-expanded'); }); });
      /* 열린 GNB(묶음 머리만) — 머리를 누르면 펼친 화면으로 */
      if (st.scene === 'main-open') all(gnb, '[data-name^="Nav Header"]').forEach(function (h) { clickable(h, function () { goto('main-expanded'); }); });
    }
    /* 장비 메뉴 타일 · DU → 계통도 */
    all(root, '[data-name="Widget/Equipment Menu"] [data-name^="Item/"]').forEach(function (t) { clickable(t, function () { goto('equipment'); }); });
    all(root, '[data-name^="Status/DU"]').forEach(function (t) { clickable(t, function () { goto('detail'); }); });
    /* 3D 뷰 단추 — 한 번 누르면 켜진 모양 */
    all(root, '[data-name="Widget/3D View"] [data-name^="Button/"]').forEach(function (b) { clickable(b, function () { b.classList.toggle('wn-on'); }); });
    /* 통신실 랙 라벨 → 다른 시점 */
    if (isRoom(st.scene)) all(root, '[data-name^="Rack Label/"]').forEach(function (r, i) { r.style.setProperty('--i', i); clickable(r, function () { goto(st.scene === 'room-top' ? 'room-view' : 'room-top'); }); });
    /* 로그인 */
    var lb = one(root, '[data-name="Button/Login"]');
    if (lb) clickable(lb, function () { goto('main'); });
    all(root, '[data-name="Input"] p').forEach(function (p) { p.setAttribute('contenteditable', 'true'); p.setAttribute('spellcheck', 'false'); p.style.outline = 'none'; });
    all(root, '[data-name^="Widget/"],[data-name^="Node/"],[data-name^="Device/"],[data-name^="Label/"],[data-name^="Zone Label/"]').forEach(function (c, i) { c.style.setProperty('--i', i % 28); });
  }

  /* ══════════════════ 6. 접기 ══════════════════ */
  function installFold(root, st) {
    /* 이벤트 현황 Fold Button — 원본 아이콘(Icon/Common Drop Close)을 쓴다 */
    var ev = st.event;
    if (ev) {
      var title = kid(ev, 'Title');
      if (title) {
        if (getComputedStyle(title).position === 'static') title.style.position = 'relative';
        st.evTitleH = title.offsetHeight + parseFloat(getComputedStyle(ev).borderTopWidth || 0);
        var fb = document.createElement('div');
        fb.className = 'wn-fold';
        fb.setAttribute('data-name', 'Fold Button');
        fb.title = '이벤트 현황 접기 · 펼치기';
        fb.innerHTML = '<img alt="" src="' + assetBase(root) + 'type-drop-close.svg">';
        title.appendChild(fb);
        var set = function (on) { ev.classList.toggle('wn-folded', on); if (st.sizeCenter) st.sizeCenter(); };
        if (load(K_FOLD).event) set(true);
        fb.addEventListener('click', function (e) {
          e.stopPropagation();
          if (editing() && !layoutEditing(root)) return;
          var on = !ev.classList.contains('wn-folded');
          set(on);
          var m = load(K_FOLD); m.event = on; save(K_FOLD, m);
        });
        st.resetFold = function () { set(false); var m = load(K_FOLD); delete m.event; save(K_FOLD, m); };
      }
    }
    /* 펼친 GNB — 메뉴 묶음 머리를 누르면 그 묶음이 접히고 펴진다 */
    if (st.scene !== 'main-open') all(root, '[data-name^="Nav Group/"]').forEach(function (g) {
      var head = kidStarts(g, 'Nav Header'), items = kid(g, 'Nav Items');
      if (!head || !items) return;
      var h0 = items.offsetHeight;
      items.style.height = h0 + 'px';
      clickable(head, function () {
        var on = !g.classList.contains('wn-gfold');
        g.classList.toggle('wn-gfold', on);
        items.style.height = on ? '0px' : h0 + 'px';
      });
    });
  }

  /* ══════════════════ 7. 차트 바꾸기 ══════════════════ */
  var CC = { bl: '#0c4da1', sk: '#2f8cff', gn: '#01ac50', re: '#ff3b3b', am: '#f5a623', vi: '#7b61ff' };
  /*@MAKECHART*/
  var EQ = [['스위치', CC.bl, 14], ['기지국', CC.sk, 7], ['서버', CC.gn, 21], ['보안', CC.vi, 9], ['단말장치', CC.am, 48], ['망연계', '#13b5c8', 6], ['지령대PC', '#8a94a6', 4]];
  var SPEC = {
    'Widget/Server List': [
      { k: 'bar', t: '서버별 CPU 사용률', unit: '%', cats: ['SVR1', 'SVR2', 'SVR3', 'SVR4', 'SVR5'], vals: [42, 68, 35, 91, 57], max: 100, c: CC.bl },
      { k: 'line', t: 'CPU · 메모리 추이', unit: '%', series: [['CPU', CC.bl, 58, 5], ['메모리', CC.gn, 66, 3]], lo: 30, hi: 90 },
      { k: 'gauge', t: '평균 CPU 사용률', unit: '%', v: [58.6, 2], max: 100, c: CC.bl, dec: 1 },
      { k: 'area', t: '평균 메모리 사용률 추이', unit: '%', series: [['메모리', CC.sk, 66, 3]], lo: 50, hi: 80 },
    ],
    'Widget/Equipment Status': [
      { k: 'donut', t: '설비 구성', unit: '식', parts: EQ },
      { k: 'hbar', t: '종류별 설비 수', unit: '식', cats: EQ.map(function (e) { return e[0]; }), vals: EQ.map(function (e) { return e[2]; }), max: 50, c: CC.bl },
    ],
    'Widget/Terminal': [
      { k: 'bar', t: '요일별 단말 사용시간', unit: '시간', cats: ['월', '화', '수', '목', '금', '토', '일'], vals: [6.4, 7.2, 6.1, 6.9, 7.5, 2.6, 1.6], max: 10, c: CC.bl, dec: 1 },
      { k: 'line', t: '사용 단말기 추이', unit: '대', series: [['단말기', CC.bl, 41, 2]], lo: 30, hi: 48 },
      { k: 'gauge', t: '단말기 가동률', unit: '%', v: [85.4, 1], max: 100, c: CC.gn, dec: 1 },
    ],
    'Widget/Status Summary': [
      { k: 'donut', t: '설비 상태 비율', unit: '식', parts: [['양호', CC.gn, 105], ['심각', CC.re, 4]] },
      { k: 'gauge', t: '양호율', unit: '%', v: [96.3, .3], max: 100, c: CC.gn, dec: 1 },
    ],
    'Widget/Event Status': [
      { k: 'bar', t: '시간대별 이벤트', unit: '건', cats: ['03시', '04시', '05시', '06시', '07시', '08시', '09시'], vals: [0, 0, 0, 0, 1, 3, 2], max: 4, c: CC.re },
      { k: 'line', t: '이벤트 발생 추이', unit: '건', series: [['이벤트', CC.re, 2, .8]], lo: 0, hi: 6, dec: 1 },
      { k: 'donut', t: '등급별 이벤트', unit: '건', parts: [['심각', CC.re, 4], ['경고', CC.am, 1], ['주의', '#f2c94c', 1]] },
    ],
  };
  function targets(root, st) {
    if (!isMain(st.scene)) return [];
    return Object.keys(SPEC).map(function (nm) {
      var w = one(root, '[data-name="' + nm + '"]');
      if (!w) return null;
      var body = kid(w, 'Body') || w, title = kid(body, 'Title');
      var hide = Array.prototype.filter.call(body.children, function (c) { return c !== title; });
      /* 제목 아래부터 — 화면 배율(S)을 걷어 낸 위젯 기준 좌표 */
      var S = st.S || 1, tH = title ? (title.getBoundingClientRect().bottom - w.getBoundingClientRect().top) / S + 12 : 60;
      return { key: nm, w: w, hide: hide, list: SPEC[nm], box: { l: 20, t: tH, r: 20, b: 18 } };
    }).filter(Boolean);
  }
  function installChartSwap(root, st) {
    var saved = load(K_CHART)[st.scene] || {};
    st.charts = {}; st.chartApply = {};
    var probe = document.createElement('i');
    probe.className = 'wn-probe';
    st.frame.appendChild(probe);
    targets(root, st).forEach(function (tg) {
      if (getComputedStyle(tg.w).position === 'static') tg.w.style.position = 'relative';
      var host = document.createElement('div');
      host.className = 'wn-host';
      host.style.left = tg.box.l + 'px'; host.style.top = tg.box.t + 'px'; host.style.right = tg.box.r + 'px'; host.style.bottom = tg.box.b + 'px';
      tg.w.appendChild(host);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'wn-chartbtn';
      btn.innerHTML = KIND_ICON.bar.replace('class="ic"', 'class="ic" style="width:13px;height:11px"') + '차트';
      btn.title = '이 패널의 차트 바꾸기';
      var menu = document.createElement('div');
      menu.className = 'wn-chartmenu';
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
        tg.w.classList.toggle('wn-swapped', i >= 0);
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
      /* 편집 중 클릭은 dt-edit.js 가 캡처에서 막는다 — pointerup 으로 받는다 */
      btn.addEventListener('pointerup', function (e) {
        e.stopPropagation(); e.preventDefault();
        all(root, '.wn-chartmenu.open').forEach(function (m) { if (m !== menu) m.classList.remove('open'); });
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
      if (e.target.closest && e.target.closest('.wn-chartmenu, .wn-chartbtn')) return;
      all(root, '.wn-chartmenu.open').forEach(function (m) { m.classList.remove('open'); });
    };
    document.addEventListener('pointerdown', st.onDocDown, true);
  }

  /* ══════════════════ 8. 패널 옮기기 ══════════════════
     메인 — 옆 열(왼쪽 · 오른쪽)의 위젯 4개는 놓는 자리의 위젯과 맞바꾼다(크기는 자리를 따른다: 위 칸 고정 높이, 아래 칸 남는 높이).
     가운데 열은 3D 뷰와 이벤트 현황의 위/아래를 바꾼다. 자리를 바꿀 때 FLIP 으로 미끄러진다.
     통신실 — 랙 라벨은 4px 격자 자유 이동. */
  function installPanelMove(root, st) {
    var LS = load(K_LAYOUT), me = LS[st.scene] = LS[st.scene] || {};
    function persist() { var a = load(K_LAYOUT); a[st.scene] = me; save(K_LAYOUT, a); }
    var mv = [];
    if (isMain(st.scene) && st.cols) {
      var SIDE = ['Widget/Server List', 'Widget/Equipment Status', 'Widget/Terminal', 'Widget/Status Summary'];
      var slots = { L: st.cols.L, R: st.cols.R };
      var byName = {};
      SIDE.forEach(function (n) { var w = one(root, '[data-name="' + n + '"]'); if (w) { byName[n] = w; w.classList.add('wn-mv'); w.setAttribute('data-wn-kind', 'side'); mv.push(w); } });
      if (st.view) { st.view.classList.add('wn-mv'); st.view.setAttribute('data-wn-kind', 'center'); mv.push(st.view); }
      if (st.event) { st.event.classList.add('wn-mv'); st.event.setAttribute('data-wn-kind', 'center'); mv.push(st.event); }
      var order0 = { L: ['Widget/Server List', 'Widget/Equipment Status'], R: ['Widget/Terminal', 'Widget/Status Summary'] };
      var arrange = function (ord, flip) {
        var before = flip ? mv.map(function (w) { return [w, w.getBoundingClientRect()]; }) : null;
        ['L', 'R'].forEach(function (k) { (ord[k] || order0[k]).forEach(function (n) { if (byName[n]) slots[k].appendChild(byName[n]); }); });
        if (st.view && st.event) {
          if (me.eventTop) st.cols.C.insertBefore(st.event, st.view); else st.cols.C.insertBefore(st.view, st.event);
        }
        st.sizeSide(); st.fit();
        if (before) before.forEach(function (x) {
          var w = x[0], a = x[1], b = w.getBoundingClientRect(), S = st.S || 1;
          var dx = (a.left - b.left) / S, dy = (a.top - b.top) / S;
          if (!dx && !dy) return;
          w.style.transition = 'none'; w.style.translate = dx.toFixed(1) + 'px ' + dy.toFixed(1) + 'px';
          void w.offsetWidth;
          w.style.transition = 'translate .5s ' + EASE; w.style.translate = '';
          setTimeout(function () { w.style.transition = ''; }, 560);
        });
      };
      st.arrange = arrange;
      if (me.order || me.eventTop) arrange(me.order || order0, false);
    }
    var frees = isRoom(st.scene) ? all(root, '[data-name^="Rack Label/"]') : [];
    me.free = me.free || {};
    frees.forEach(function (f) {
      f.classList.add('wn-mv'); f.setAttribute('data-wn-kind', 'free');
      var s = me.free[f.getAttribute('data-name')];
      if (s) { f.__ux = s[0]; f.__uy = s[1]; f.style.marginLeft = s[0] + 'px'; f.style.marginTop = s[1] + 'px'; }
    });
    var drag = null, over = null;
    function curOrder() {
      var o = {};
      ['L', 'R'].forEach(function (k) { o[k] = Array.prototype.filter.call(st.cols[k].children, function (c) { return c.getAttribute('data-wn-kind') === 'side'; }).map(function (c) { return c.getAttribute('data-name'); }); });
      return o;
    }
    st.onDown = function (e) {
      if (!layoutEditing(root) || e.button !== 0) return;
      if (e.target.closest('.wn-chartbtn, .wn-chartmenu, .wn-resetbtn, .wn-fold')) return;
      if (e.target.closest('[contenteditable="true"]')) return;
      var w = e.target.closest('.wn-mv');
      if (!w || !root.contains(w)) return;
      e.preventDefault(); e.stopPropagation();
      drag = { w: w, kind: w.getAttribute('data-wn-kind'), sx: e.clientX, sy: e.clientY, moved: false };
    };
    st.onMove = function (e) {
      if (!drag) return;
      var S = st.S || 1, dx = (e.clientX - drag.sx) / S, dy = (e.clientY - drag.sy) / S;
      if (!drag.moved) {
        if (Math.hypot(dx, dy) < 3) return;
        drag.moved = true;
        drag.w.classList.add('wn-dragging');
      }
      drag.w.style.translate = dx.toFixed(1) + 'px ' + dy.toFixed(1) + 'px';
      drag.dx = dx; drag.dy = dy;
      if (drag.kind !== 'free') {
        var hit = null;
        mv.forEach(function (o) {
          if (o === drag.w || o.getAttribute('data-wn-kind') !== drag.kind) return;
          var r = o.getBoundingClientRect();
          if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) hit = o;
        });
        if (over && over !== hit) over.classList.remove('wn-drop');
        over = hit;
        if (over) over.classList.add('wn-drop');
      }
    };
    st.onUp = function () {
      if (!drag) return;
      var d = drag; drag = null;
      var w = d.w;
      w.classList.remove('wn-dragging');
      if (!d.moved) return;
      if (d.kind === 'free') {
        w.style.translate = '';
        var snap = function (v) { return Math.round(v / 4) * 4; };
        w.__ux = snap((w.__ux || 0) + (d.dx || 0)); w.__uy = snap((w.__uy || 0) + (d.dy || 0));
        w.style.marginLeft = w.__ux + 'px'; w.style.marginTop = w.__uy + 'px';
        me.free[w.getAttribute('data-name')] = [w.__ux, w.__uy];
        persist();
        return;
      }
      var target = over;
      if (over) over.classList.remove('wn-drop');
      over = null;
      if (!target) { w.style.transition = 'translate .45s ' + EASE; w.style.translate = ''; setTimeout(function () { w.style.transition = ''; }, 480); return; }
      w.style.translate = '';
      if (d.kind === 'center') {
        me.eventTop = !me.eventTop;
        st.arrange(me.order || curOrder(), true);
      } else {
        var o = curOrder(), a = w.getAttribute('data-name'), b = target.getAttribute('data-name');
        ['L', 'R'].forEach(function (k) { o[k] = o[k].map(function (n) { return n === a ? b : n === b ? a : n; }); });
        me.order = o;
        st.arrange(o, true);
      }
      persist();
    };
    root.addEventListener('pointerdown', st.onDown, true);
    window.addEventListener('pointermove', st.onMove);
    window.addEventListener('pointerup', st.onUp);
    window.addEventListener('pointercancel', st.onUp);
    st.onDragStart = function (e) { if (layoutEditing(root) && e.target.closest && e.target.closest('.wn-mv')) e.preventDefault(); };
    root.addEventListener('dragstart', st.onDragStart);
    st.resetLayout = function () {
      me = { free: {} };
      var a = load(K_LAYOUT); a[st.scene] = me; save(K_LAYOUT, a);
      frees.forEach(function (f) { f.__ux = 0; f.__uy = 0; f.style.marginLeft = ''; f.style.marginTop = ''; });
      if (st.arrange) st.arrange({}, true);
      if (st.resetFold) st.resetFold();
      Object.keys(st.chartApply || {}).forEach(function (k) { st.chartApply[k](-1); });
      st.fit();
    };
    if (!mv.length && !frees.length) return;
    var rb = document.createElement('button');
    rb.type = 'button';
    rb.className = 'wn-resetbtn';
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
    [['fit', installFit], ['clock', installClock], ['events', installEvents], ['data', installData], ['nav', installNav], ['fold', installFold], ['swap', installChartSwap], ['move', installPanelMove]]
      .forEach(function (s) { try { s[1](root, st); } catch (e) { console.warn('[wn] ' + s[0], e); } });
    if (st.fit) st.fit();
    root.classList.add('wn-enter');
    st.timers.push(setTimeout(function () { root.classList.remove('wn-enter'); }, 1600));
  }
  function initWnms(root) {
    if (!root || root.__wn) return;
    injectStyle();
    root.classList.add('wn-root');
    var px = /(wn[a-z])-root/.exec(root.className);
    var st = root.__wn = { timers: [], px: px ? px[1] : 'wnm', scene: px ? SCENES[px[1]] : 'main' };
    if (/[?&]edit=1/.test(location.search)) root.classList.add('wn-edit-layout');
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
  function disposeWnms(root) {
    var st = root && root.__wn;
    if (!st) return;
    if (st.wait) st.wait.disconnect();
    st.timers.forEach(function (t) { clearInterval(t); clearTimeout(t); });
    if (st.ro) st.ro.disconnect();
    if (st.onResize) window.removeEventListener('resize', st.onResize);
    Object.keys(st.charts || {}).forEach(function (k) { st.charts[k].dispose(); });
    if (st.onDocDown) document.removeEventListener('pointerdown', st.onDocDown, true);
    if (st.onDown) root.removeEventListener('pointerdown', st.onDown, true);
    if (st.onMove) window.removeEventListener('pointermove', st.onMove);
    if (st.onUp) { window.removeEventListener('pointerup', st.onUp); window.removeEventListener('pointercancel', st.onUp); }
    if (st.onDragStart) root.removeEventListener('dragstart', st.onDragStart);
    if (st.onReset) document.removeEventListener('click', st.onReset, true);
    root.__wn = null;
  }
  window.initWnms = initWnms;
  window.disposeWnms = disposeWnms;
})();
