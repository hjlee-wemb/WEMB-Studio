/* 신사업 관리 대시보드 — 재구축 화면 11장의 인터랙션 · 라이브 · 반응형 레이어.
   window.initNewbiz(root) / window.disposeNewbiz(root)

   화면(DOM·CSS)은 생성기(src/newbiz/_gen/conv.js)가 Figma(cES6X45zHjsaabaXL1cdrt) 그대로 만든다.
   이 파일은 그 위에 '움직이는 것'만 얹는다 — 정지 상태(?live=0) = Figma 원본.

   · 반응형 — 1920x1080 좌표계 + 균일 배율 S. 남는 폭 · 높이는 패널 · 표 · 격자 바탕이 나눠 갖는다. 정확히 16:9 면 Figma 그대로
   · 실시간 시계
   · 마우스 오버 — 메뉴 · 탭 · 표 줄 · 편집/삭제 단추(시안의 Hover 모양과 말풍선) · 말풍선 · 카드
   · 화면 잇기 — 메뉴 · 탭 · 편집(인풋 화면) · 저장/취소 · 지도 말풍선(계측 화면) · 닫기
   · 접기 — 2040 목표 패널(제목을 누른다). 시안에 Event List · Fold Button 이 없어 이 자리에만 둔다
   · 차트 바꾸기(패널편집 중) — 패널마다 추천 차트, 값은 표의 수치와 그 근처 샘플. '원본 그대로'로 되돌린다
   · 패널 옮기기(패널편집 중) — 지도 · 표는 자리를 맞바꾸고, 타임라인은 위/아래로 흐른다. 나머지는 4px 격자 자유 이동

   src/newbiz-live.js 는 생성물이다. 이 파일을 고쳐 `node mk-live.js`. 고친 뒤 js/core/tpl-modules.js 의 ?v= 를 올릴 것. */
(function () {
  'use strict';

  var BASE_W = 1920, BASE_H = 1080;
  var K_LAYOUT = 'wemb-newbiz-layout', K_CHART = 'wemb-newbiz-chart', K_FOLD = 'wemb-newbiz-fold';
  var STYLE_ID = 'newbiz-live-style';
  var EASE = 'cubic-bezier(.22,.8,.24,1)';
  var SCENES = { nbw: 'wind', nbs: 'solar', nbe: 'energy', nbk: 'wind-input', nbl: 'solar-input', nbg: 'energy-input', nbm: 'measure', nbt: 'measure-wind', nbu: 'measure-solar', nbp: 'measure-popup', nbo: 'overseas' };
  var PANEL = { Map: 'Widget/Project Map', Status: 'Widget/Project Status', Time: 'Widget/Project Timeline' };

  var CSS = [
    '.nb-root{--nb-acc:127,211,250;overflow:clip!important;}',
    '.nb-root.nb-resizing *,.nb-root .nb-dragging,.nb-root .nb-dragging *{transition:none!important;}',
    '.nb-root.nb-live .nb-panel{transition:left .5s ' + EASE + ',top .5s ' + EASE + ',width .5s ' + EASE + ',height .5s ' + EASE + ',translate .5s ' + EASE + ';}',
    '.nb-root .nb-place{transition:translate .5s ' + EASE + ';}',
    '.nb-root .nb-probe{position:absolute;width:0;height:0;overflow:hidden;color:#7fd3fa;}',
    '.nb-root .nb-click{cursor:pointer;}',
    '.nb-root .nb-click *{cursor:inherit;}',
    '.dt-content-editing .nb-root .nb-click,.dt-content-editing .nb-root .nb-click *{cursor:text;}',
    /* 들어올 때 */
    '@keyframes nbIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}}',
    '@keyframes nbFade{from{opacity:0;}to{opacity:1;}}',
    '.nb-root.nb-enter .nb-panel{animation:nbFade .5s ease both;}',
    '.nb-root.nb-enter [data-name^="Callout/"],.nb-root.nb-enter [data-name^="Row/"],.nb-root.nb-enter [data-name^="Card/"],.nb-root.nb-enter [data-name^="Step/"]{animation:nbIn .46s ' + EASE + ' both;animation-delay:calc(var(--i,0) * 26ms);}',
    '.nb-root.nb-enter [data-name^="Popup/"]{animation:nbIn .46s ' + EASE + ' .18s both;}',
    /* 메뉴 */
    '.nb-root [data-name^="Nav Item/"]{transition:color .2s ease,text-shadow .2s ease;cursor:pointer;}',
    '.nb-root [data-name^="Nav Item/"]:hover,.nb-root [data-name="Nav Group"] > p:hover{color:#7fd3fa!important;text-shadow:0 0 12px rgba(var(--nb-acc),.55);}',
    '.nb-root [data-name="Nav Group"] > p{transition:color .2s ease,text-shadow .2s ease;cursor:pointer;}',
    '.nb-root [data-name="Nav Group"] > p:active{translate:0 1px;}',
    /* 탭 */
    '.nb-root [data-name="Tabs"] > *{transition:filter .18s ease,translate .18s ease;cursor:pointer;}',
    '.nb-root [data-name="Tabs"] > *:hover{filter:brightness(1.35);translate:0 -1px;}',
    '.nb-root [data-name="Tabs"] > *:active{translate:0 0;filter:brightness(.92);}',
    /* 표 */
    '.nb-root [data-name="Rows"] > [data-name^="Row/"]{transition:filter .18s ease,opacity .28s ease,height .32s ' + EASE + ',min-height .32s ' + EASE + ';}',
    '.nb-root [data-name="Rows"] > [data-name^="Row/"]:hover{filter:brightness(1.3);}',
    '.nb-root .nb-gone{opacity:0;height:0!important;min-height:0!important;overflow:hidden;}',
    '.nb-root [data-name="Rows"]{scroll-behavior:smooth;}',
    '.nb-root [data-name^="Button/Edit"],.nb-root [data-name^="Button/Delete"],.nb-root [data-name="Button/Save"],.nb-root [data-name="Button/Cancel"]{cursor:pointer;transition:filter .18s ease;}',
    '.nb-root [data-name="Button/Save"]:hover,.nb-root [data-name="Button/Cancel"]:hover{filter:brightness(1.35);}',
    '.nb-root [data-name="Button/Save"]:active,.nb-root [data-name="Button/Cancel"]:active{filter:brightness(.9);}',
    '.nb-root [data-name$="(Hover)"]{pointer-events:none;opacity:0;transition:opacity .14s ease;}',
    '.nb-root [data-name$="(Hover)"].nb-on{opacity:1;}',
    '.nb-root [data-name="Input"]{transition:box-shadow .18s ease;}',
    '.nb-root [data-name="Input"]:hover,.nb-root [data-name="Input"]:focus-within{box-shadow:0 0 0 1px rgba(var(--nb-acc),.7);}',
    /* 지도 말풍선 */
    '.nb-root [data-name^="Callout/"]{transition:filter .2s ease,scale .2s ease;transform-origin:50% 100%;}',
    '.nb-root [data-name^="Callout/"]:hover{filter:brightness(1.22) drop-shadow(0 0 8px rgba(var(--nb-acc),.5));scale:1.04;z-index:3;}',
    '.nb-root.nb-live [data-name="Callouts (Dim 30)"] [data-name^="Callout/"]:hover{filter:brightness(2);}',
    '@keyframes nbFloat{0%,100%{translate:0 0;}50%{translate:0 -2px;}}',
    '.nb-root [data-name="Solar Panel Image"]{animation:nbFloat 4.2s ease-in-out infinite;animation-delay:calc(var(--i,0) * -.6s);}',
    /* 타임라인 */
    '@keyframes nbGlow{0%,100%{filter:none;}50%{filter:drop-shadow(0 0 6px rgba(var(--nb-acc),.95));}}',
    '.nb-root [data-name^="Step/"] [data-name="Marker"]{animation:nbGlow 3s ease-in-out infinite;animation-delay:calc(var(--i,0) * .32s);}',
    '.nb-root [data-name^="Step/"]{transition:filter .2s ease;}',
    '.nb-root [data-name^="Step/"]:hover{filter:brightness(1.3);}',
    '.nb-root .nb-sweep{position:absolute;overflow:hidden;border-radius:10px;pointer-events:none;}',
    '.nb-root .nb-sweep::after{content:"";position:absolute;inset:0;width:22%;background:linear-gradient(90deg,rgba(var(--nb-acc),0),rgba(var(--nb-acc),.42),rgba(var(--nb-acc),0));animation:nbSweep 6.5s linear infinite;}',
    '@keyframes nbSweep{from{translate:-110% 0;}to{translate:560% 0;}}',
    /* 해외 */
    '.nb-root [data-name^="Card/"] [data-name^="Item/"],.nb-root [data-name^="Route Label/"],.nb-root [data-name^="Tag/"]{transition:filter .2s ease,translate .2s ease;}',
    '.nb-root [data-name^="Card/"] [data-name^="Item/"]:hover{filter:brightness(1.3);translate:2px 0;}',
    '.nb-root [data-name^="Route Label/"]:hover,.nb-root [data-name^="Tag/"]:hover{filter:brightness(1.3);translate:0 -1px;}',
    '@keyframes nbPulse{0%,100%{opacity:.82;scale:1;}50%{opacity:1;scale:1.06;}}',
    '.nb-root [data-name="Hotspot"] [data-name="Pattern"]{animation:nbPulse 3.4s ease-in-out infinite;animation-delay:calc(var(--i,0) * .4s);}',
    '@keyframes nbArrow{0%,100%{opacity:.35;}50%{opacity:1;}}',
    '.nb-root [data-name="Arrow"]{animation:nbArrow 1.8s ease-in-out infinite;animation-delay:calc(var(--i,0) * .16s);}',
    '@keyframes nbBreathe{0%,100%{opacity:.55;}50%{opacity:1;}}',
    '.nb-root [data-name="Detail Callout"] > [data-name="Leader"]{animation:nbBreathe 2.6s ease-in-out infinite;}',
    '.nb-root [data-name="Detail Callout"] > [data-name="Leader"] img{filter:brightness(1.7);}',
    /* 2040 목표 접기 */
    '.nb-root [data-name="Widget/2040 Target"]{overflow:hidden;transition:height .45s ' + EASE + ',translate .45s ' + EASE + ';}',
    '.nb-root [data-name="Widget/2040 Target"] > [data-name="Title"]{cursor:pointer;}',
    '.nb-root [data-name="Widget/2040 Target"] > [data-name="Title"]:hover{filter:brightness(1.25);}',
    '.nb-root [data-name="Widget/2040 Target"] > [data-name="Body"]{transition:opacity .3s ease;}',
    '.nb-root .nb-folded > [data-name="Body"]{opacity:0;pointer-events:none;}',
    /* 닫기 */
    '.nb-root [data-name="Icon/Action/Close"]{cursor:pointer;transition:rotate .25s ease,filter .2s ease;}',
    '.nb-root [data-name="Icon/Action/Close"]:hover{rotate:90deg;filter:brightness(1.5);}',
    /* 패널 편집 */
    '.dt-editing .nb-root [data-name]{animation:none!important;}',
    '.dt-editing .nb-root .nb-mv{cursor:move;outline:1px dashed rgba(var(--nb-acc),.55);outline-offset:2px;}',
    '.nb-root.nb-edit-layout .nb-mv{cursor:move;outline:1px dashed rgba(var(--nb-acc),.55);outline-offset:2px;}',
    '.nb-root .nb-dragging{z-index:9;opacity:.9;}',
    '.nb-root .nb-host{position:absolute;z-index:2;display:none;}',
    '.nb-root .nb-swapped > .nb-host{display:block;}',
    '.nb-root .nb-resetbtn{display:none;position:absolute;right:300px;top:78px;z-index:30;height:32px;padding:0 14px;border-radius:8px;border:1px solid rgba(var(--nb-acc),.6);background:rgba(10,24,40,.92);color:#e2f6ff;font:600 14px "Pretendard Variable",Pretendard,sans-serif;cursor:pointer;}',
    '.dt-editing .nb-root .nb-resetbtn,.nb-root.nb-edit-layout .nb-resetbtn{display:block;}',
    '.nb-root[data-theme="light"] .nb-resetbtn{background:#fff;color:#15253a;}',
    '.nb-root[data-theme="light"] [data-name="Rows"] > [data-name^="Row/"]:hover{filter:brightness(.97);}',
    '.nb-root[data-theme="light"] [data-name^="Callout/"]:hover{filter:brightness(1.03) drop-shadow(0 2px 8px rgba(30,70,110,.3));}',
    '.nb-root[data-theme="light"] [data-name="Nav Group"] > p:hover{color:#0a6fa8!important;text-shadow:none;}',
    '.nb-root[data-theme="light"] [data-name="Tabs"] > *:hover{filter:brightness(.96);}',
    '.nb-root[data-theme="light"] [data-name^="Card/"] [data-name^="Item/"]:hover,.nb-root[data-theme="light"] [data-name^="Step/"]:hover,.nb-root[data-theme="light"] [data-name^="Route Label/"]:hover,.nb-root[data-theme="light"] [data-name^="Tag/"]:hover{filter:brightness(.92);}',
    '@media (prefers-reduced-motion:reduce){.nb-root *{animation:none!important;}}',
    '.nb-root .nb-chartbtn{position:absolute;top:-11px;right:14px;z-index:25;display:none;align-items:center;gap:4px;height:22px;padding:0 9px;border:1px solid rgb(var(--nb-acc));background:#06264a;color:#e6f7ff;font:500 12px/1 Pretendard,system-ui,sans-serif;cursor:pointer;white-space:nowrap;}',
    '.nb-root .nb-chartbtn:hover{filter:brightness(1.25);box-shadow:0 0 12px rgba(var(--nb-acc),.6);}',
    '.dt-editing .nb-root .nb-chartbtn,.dt-content-editing .nb-root .nb-chartbtn,.nb-root.nb-edit-layout .nb-chartbtn{display:inline-flex;}',
    '.nb-root .nb-chartmenu{position:absolute;top:14px;right:14px;z-index:40;min-width:208px;padding:5px;border:1px solid #2a7ca0;background:#071a30;color:#c7ecf4;font:400 13px/1.35 Pretendard,system-ui,sans-serif;box-shadow:0 12px 28px rgba(0,0,0,.5);opacity:0;translate:0 -4px;pointer-events:none!important;transition:opacity .16s ease,translate .16s ease;}',
    '.nb-root .nb-chartmenu.open{opacity:1;translate:0 0;pointer-events:auto!important;}',
    '.nb-root .nb-chartmenu .hd{padding:4px 8px 6px;font-size:11px;color:#8ea6b3;white-space:nowrap;}',
    '.nb-root .nb-chartmenu button{display:flex;align-items:center;gap:8px;width:100%;padding:6px 8px;border:0;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer!important;white-space:nowrap;}',
    '.nb-root .nb-chartmenu button:hover{background:rgba(var(--nb-acc),.14);color:#fff;}',
    '.nb-root .nb-chartmenu button.cur{background:rgba(9,182,251,.26);color:#fff;}',
    '.nb-root .nb-chartmenu .ic{width:18px;height:14px;flex:none;}',
    '.nb-root .nb-chartmenu .rec{margin-left:auto;padding:1px 6px;background:rgb(var(--nb-acc));color:#03202e;font-size:10px;font-weight:700;}',
    '.nb-root .nb-chartmenu .sep{height:1px;margin:4px 2px;background:rgba(199,236,244,.16);}',
    '.nb-root .nb-chart{position:absolute;inset:0;display:flex;flex-direction:column;padding:10px 14px 8px;background:linear-gradient(180deg,rgba(14,32,54,.97),rgba(12,26,46,.97));box-shadow:inset 0 0 0 1px rgba(42,124,160,.75);color:#c7ecf4;font:400 12px/1.3 Pretendard,system-ui,sans-serif;animation:pfIn .35s ease;}',
    '.nb-root .nb-chart .pl,.nb-root .nb-chart .lg,.nb-root .nb-chart .ct i,.nb-root .nb-chart .ct b{filter:hue-rotate(var(--nb-chue,0deg));}',
    '.nb-root .nb-chart .ct{display:flex;align-items:center;gap:6px;font-weight:500;font-size:15px;color:#fff;white-space:nowrap;}',
    '.nb-root .nb-chart .ct i{display:block;width:8px;height:8px;background:#2a7ca0;flex:none;}',
    '.nb-root .nb-chart .ct b{margin-left:auto;font-family:Tomorrow,Pretendard,sans-serif;font-weight:400;font-size:18px;color:#00ffd2;}',
    '.nb-root .nb-chart .ct b small{font:400 11px Pretendard,sans-serif;color:#8ea6b3;margin-left:3px;}',
    '.nb-root .nb-chart .lg{display:flex;gap:10px;margin-top:3px;font-size:11px;color:#8ea6b3;white-space:nowrap;}',
    '.nb-root .nb-chart .lg span{display:inline-flex;align-items:center;gap:4px;}',
    '.nb-root .nb-chart .lg span:before{content:"";width:9px;height:3px;background:var(--c);}',
    '.nb-root .nb-chart .pl{position:relative;flex:1;min-height:0;margin-top:6px;}',
    '.nb-root .nb-chart svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;}',
    '.nb-root .nb-chart .ax{fill:#8ea6b3;font-size:11px;font-family:Pretendard,system-ui,sans-serif;}',
    '.nb-root .nb-chart .gl{stroke:rgba(142,166,179,.16);stroke-width:1;shape-rendering:crispEdges;}',
    '.nb-root .nb-chart .bars{position:absolute;inset:0 0 16px;display:flex;align-items:flex-end;justify-content:space-around;gap:8px;}',
    '.nb-root .nb-chart .bars > div{position:relative;flex:1;max-width:34px;height:100%;display:flex;align-items:flex-end;}',
    '.nb-root .nb-chart .bars i{display:block;width:100%;background:linear-gradient(180deg,var(--c),rgba(9,182,251,.18));transition:height .9s ' + EASE + ';}',
    '.nb-root .nb-chart .bars em{position:absolute;left:50%;translate:-50% 0;bottom:calc(var(--h) + 2px);font-style:normal;font-size:11px;color:#e6f7ff;white-space:nowrap;transition:bottom .9s ' + EASE + ';}',
    '.nb-root .nb-chart .bars u{position:absolute;left:50%;translate:-50% 0;bottom:-16px;text-decoration:none;font-size:11px;color:#8ea6b3;white-space:nowrap;}',
    '.nb-root .nb-chart .hb{display:flex;flex-direction:column;justify-content:space-around;height:100%;gap:3px;}',
    '.nb-root .nb-chart .hb > div{display:grid;grid-template-columns:72px 1fr 50px;align-items:center;gap:8px;font-size:12px;}',
    '.nb-root .nb-chart .hb s{position:relative;display:block;height:8px;background:rgba(142,166,179,.16);overflow:hidden;text-decoration:none;}',
    '.nb-root .nb-chart .hb s i{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,rgba(9,182,251,.5),var(--c));transition:width .9s ' + EASE + ';}',
    '.nb-root .nb-chart .hb b{text-align:right;color:#fff;font-weight:500;font-variant-numeric:tabular-nums;}',
    '.nb-root .nb-chart .arc{transition:stroke-dasharray .9s ' + EASE + ',stroke-dashoffset .9s ' + EASE + ';}',
    '.nb-root .nb-chart .gv{position:absolute;left:0;right:0;bottom:0;text-align:center;font-family:Tomorrow,Pretendard,sans-serif;font-size:22px;color:#00ffd2;}',
    '.nb-root .nb-chart .gv small{font:400 12px Pretendard,sans-serif;color:#8ea6b3;margin-left:2px;}',
    '.nb-root .nb-chart .dn{display:flex;align-items:center;gap:16px;height:100%;}',
    '.nb-root .nb-chart .dn .ring{position:relative;height:100%;aspect-ratio:1;flex:none;}',
    '.nb-root .nb-chart .dn .ring b{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Tomorrow,Pretendard,sans-serif;font-weight:400;font-size:17px;color:#fff;}',
    '.nb-root .nb-chart .dn .ring b small{font:400 10px Pretendard,sans-serif;color:#8ea6b3;}',
    '.nb-root .nb-chart .dn ul{list-style:none;display:flex;flex-direction:column;gap:4px;font-size:12px;min-width:0;flex:1;}',
    '.nb-root .nb-chart .dn li{display:flex;align-items:center;gap:6px;white-space:nowrap;}',
    '.nb-root .nb-chart .dn li:before{content:"";width:9px;height:3px;background:var(--c);flex:none;}',
    '.nb-root .nb-chart .dn li b{margin-left:auto;color:#fff;font-weight:500;font-variant-numeric:tabular-nums;}',
    '.nb-root[data-theme="light"] .nb-chartbtn{background:#fff;color:#06365c;}',
    '.nb-root[data-theme="light"] .nb-chartmenu{background:#fff;color:#20405a;border-color:#9dbdd2;box-shadow:0 12px 28px rgba(30,60,100,.25);}',
    '.nb-root[data-theme="light"] .nb-chartmenu button:hover{background:rgba(0,112,178,.1);color:#06365c;}',
    '.nb-root[data-theme="light"] .nb-chartmenu button.cur{background:rgba(0,112,178,.16);color:#06365c;}',
    '.nb-root[data-theme="light"] .nb-chart{background:#fff;box-shadow:inset 0 0 0 1px #c5d9e6;color:#20405a;}',
    '.nb-root[data-theme="light"] .nb-chart .ct{color:#0e2c47;}',
    '.nb-root[data-theme="light"] .nb-chart .ct b,.nb-root[data-theme="light"] .nb-chart .gv{color:#00786a;}',
    '.nb-root[data-theme="light"] .nb-chart .lg,.nb-root[data-theme="light"] .nb-chart .bars u,.nb-root[data-theme="light"] .nb-chart .ct b small,.nb-root[data-theme="light"] .nb-chart .gv small,.nb-root[data-theme="light"] .nb-chart .dn .ring b small{color:#55707f;}',
    '.nb-root[data-theme="light"] .nb-chart .ax{fill:#55707f;}',
    '.nb-root[data-theme="light"] .nb-chart .gl{stroke:rgba(40,80,110,.14);}',
    '.nb-root[data-theme="light"] .nb-chart .bars em,.nb-root[data-theme="light"] .nb-chart .hb b,.nb-root[data-theme="light"] .nb-chart .dn li b,.nb-root[data-theme="light"] .nb-chart .dn .ring b{color:#0e2c47;}',
    '.nb-root[data-theme="light"] .nb-chart .hb s{background:rgba(40,80,110,.1);}',
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
  function layoutEditing(root) { return !!(root.closest('.dt-editing') || root.classList.contains('nb-edit-layout')); }
  function idle() { return typeof window.__wembIdle === 'function' ? window.__wembIdle() : document.hidden; }
  function load(k) { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function comma(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function claimed(p) { return p.__nbLast != null && p.textContent !== p.__nbLast; }
  function write(p, s) {
    if (!p || p === document.activeElement || claimed(p)) return;
    if (p.textContent !== s) p.textContent = s;
    p.__nbLast = p.textContent;
  }
  function clickable(el, fn) {
    if (!el) return;
    el.classList.add('nb-click');
    el.addEventListener('click', function (e) { if (editing()) return; fn(e); });
  }
  function frameOf(root) { return root.querySelector(':scope > [data-node-id]'); }
  function imp(el, p, v) { el.style.setProperty(p, v, 'important'); }
  function place(el) {
    if (!el) return;
    var x = (el.__fx || 0) + (el.__ux || 0) + (el.__dx || 0), y = (el.__fy || 0) + (el.__uy || 0) + (el.__dy || 0);
    el.style.translate = (x || y) ? x.toFixed(2) + 'px ' + y.toFixed(2) + 'px' : '';
  }
  function goto(scene) {
    if (window.__gotoNewbizScene) { window.__gotoNewbizScene(scene); return; }
    location.href = scene + '.html' + location.search;
  }
  function isRenew(sc) { return /^(wind|solar|energy)(-input)?$/.test(sc); }
  function isMeasure(sc) { return /^measure/.test(sc); }

  /* ══════════════════ 1. 화면 맞추기 ══════════════════
     design context 의 묶음은 display:contents 라 상자가 없고, 안쪽 좌표는 % · bottom 이 섞여 있다.
     처음에 기준 크기에서 재어 px 로 굳히고, 패널을 진짜 상자로 만든다(옮기기 · 늘리기 · 차트 자리). */
  function flat(n, out) {
    Array.prototype.forEach.call(n.children, function (c) {
      if (getComputedStyle(c).display === 'contents') flat(c, out); else out.push(c);
    });
    return out;
  }
  function realize(g, r) {
    var list = flat(g, []).map(function (c) {
      return { c: c, abs: getComputedStyle(c).position === 'absolute', l: c.offsetLeft, t: c.offsetTop, w: c.offsetWidth, h: c.offsetHeight };
    });
    g.style.display = 'block';
    g.style.position = 'absolute';
    g.style.left = r.x + 'px'; g.style.top = r.y + 'px'; g.style.width = r.w + 'px'; g.style.height = r.h + 'px';
    list.forEach(function (o) {
      if (!o.abs) return;
      imp(o.c, 'inset', 'auto');
      imp(o.c, 'left', (o.l - r.x) + 'px'); imp(o.c, 'top', (o.t - r.y) + 'px');
      imp(o.c, 'width', o.w + 'px'); imp(o.c, 'height', o.h + 'px');
      imp(o.c, 'margin', '0');
      o.c.__l = o.l - r.x; o.c.__t = o.t - r.y; o.c.__w = o.w; o.c.__h = o.h;
    });
    g.classList.add('nb-panel');
    g.__r = r;
    return g;
  }
  function setW(el, v) { imp(el, 'width', v.toFixed(2) + 'px'); }
  function setH(el, v) { imp(el, 'height', v.toFixed(2) + 'px'); }
  function setBox(g, x, y, w, h) { g.style.left = x.toFixed(2) + 'px'; g.style.top = y.toFixed(2) + 'px'; g.style.width = w.toFixed(2) + 'px'; g.style.height = h.toFixed(2) + 'px'; }

  /* 격자 바탕 — 격자 칸은 그대로 두고(점이 타원이 되지 않게) 균일 배율로 덮고 판 모양으로 자른다 */
  function clipGrid(panel, st) {
    var mask = one(panel, '[data-name="Grid Mask"]');
    if (!mask) return null;
    var clip = document.createElement('div'), inner = document.createElement('div');
    clip.className = 'nb-gridclip';
    clip.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;overflow:hidden;border-radius:16px;pointer-events:none;';
    inner.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;transform-origin:0 0;';
    mask.parentNode.insertBefore(clip, mask);
    clip.appendChild(inner);
    inner.appendChild(mask);
    return inner;
  }

  function installFit(root, st) {
    var frame = frameOf(root);
    st.frame = frame;
    var baseW = st.scene === 'overseas' ? 1920 : 1922;
    frame.style.position = 'absolute'; frame.style.left = '0'; frame.style.top = '0';
    frame.style.transformOrigin = '0 0'; frame.style.transform = 'none';
    frame.style.width = baseW + 'px'; frame.style.height = BASE_H + 'px';
    var nav = kid(frame, 'Nav Bar'), header = kid(frame, 'Header');
    if (nav) { imp(nav, 'transform', 'none'); imp(nav, 'left', '-1px'); imp(nav, 'margin', '0'); }
    st.S = 1;
    var L = st.layoutState = load(K_LAYOUT)[st.scene] || {};
    var layout;
    if (isRenew(st.scene)) {
      var pMap = realize(kid(frame, PANEL.Map), { x: 36, y: 286, w: 796, h: 764 });
      var pSt = realize(kid(frame, PANEL.Status), { x: 848, y: 286, w: 1037, h: 764 });
      var pTi = realize(kid(frame, PANEL.Time), { x: 36, y: 136, w: 1849, h: 134 });
      st.panels = { map: pMap, status: pSt, time: pTi };
      var mapBg = flat(kid(pMap, 'Card BG'), []);
      var mapKids = flat(kid(pMap, 'Map Stage'), []);
      mapKids.forEach(function (c) { c.classList.add('nb-place'); });
      var stBg = kid(pSt, 'Card BG'), table = one(pSt, '[data-name="Table/Project Status"]');
      var divider = Array.prototype.filter.call(pSt.children, function (c) { return c !== stBg && c !== table; });
      var tiKids = flat(pTi, []);
      var tiBg = kid(pTi, 'Card BG');
      var tabs = kid(pTi, 'Tabs');
      var track = tiKids.filter(function (c) { return c.getAttribute('data-name') === 'Track'; })[0];
      var movers = tiKids.filter(function (c) { return c !== tiBg && c !== tabs && c !== track; });
      movers.forEach(function (c) { c.classList.add('nb-place'); });
      var body = one(table, '[data-name="Body"]'), rowsEl = one(table, '[data-name="Rows"]');
      var rows = rowsEl ? Array.prototype.slice.call(rowsEl.children) : [];
      rows.forEach(function (r) { r.__h0 = r.offsetHeight; });
      var total = kid(body, 'Row/Total');
      var thSt = one(table, '[data-name="Th/Status"]');
      var thKids = thSt ? flat(thSt, []) : [];
      thKids.forEach(function (c) { c.__l0 = c.offsetLeft; c.__w0 = c.offsetWidth; });
      var tdSt = all(table, '[data-name="Td/Status"]');
      tdSt.forEach(function (td) { td.__w0 = td.offsetWidth; td.__acts = Array.prototype.filter.call(td.children, function (c) { return /^(Actions|Button\/)/.test(c.getAttribute('data-name') || '') && getComputedStyle(c).position === 'absolute'; }); });
      var inputs = all(table, '[data-name="Input"]'), inW = inputs.map(function (i) { return i.offsetWidth; });
      var GAP = 16, X0 = 36, Y0 = 136, TH = 134;
      layout = function (VW, VH, exW, exH) {
        var w = VW - 71, h = 764 + exH;
        var share = w - GAP - (796 + 1037), mapW = 796 + share * 796 / 1833, stW = 1037 + share * 1037 / 1833;
        var swap = L.swap, tb = L.timeBottom;
        var rowY = tb ? Y0 : Y0 + 150, tiY = tb ? Y0 + h + 16 - 26 + 26 : Y0;
        setBox(swap ? pSt : pMap, X0, rowY, swap ? stW : mapW, h);
        setBox(swap ? pMap : pSt, X0 + (swap ? stW : mapW) + GAP, rowY, swap ? mapW : stW, h);
        setBox(pTi, X0, tiY, w, TH);
        /* 지도 */
        mapBg.forEach(function (c) { setW(c, mapW); setH(c, h); });
        var mdx = (mapW - 796) / 2, mdy = (h - 764) / 2;
        mapKids.forEach(function (c) { c.__fx = mdx; c.__fy = mdy; place(c); });
        /* 표 */
        var ex = stW - 1037;
        setW(stBg, stW); setH(stBg, h);
        setW(table, 974 + ex); setH(table, 700 + (h - 764));
        divider.forEach(function (d) { d.style.translate = ex ? (ex).toFixed(2) + 'px 0' : ''; });
        thKids.forEach(function (c) {
          if (c.tagName === 'P' || !/Background/.test(c.getAttribute('data-name') || '')) c.style.translate = ex ? (ex / 2).toFixed(2) + 'px 0' : '';
          else setW(c, c.__w0 + ex);
        });
        if (thSt && getComputedStyle(thSt).display !== 'contents') setW(thSt, thSt.__w00 || (thSt.__w00 = thSt.offsetWidth) + ex);
        tdSt.forEach(function (td) {
          setW(td, td.__w0 + ex);
          td.__acts.forEach(function (a) { a.style.translate = ex ? ex.toFixed(2) + 'px 0' : ''; });
        });
        inputs.forEach(function (el, i) { setW(el, inW[i] + ex); });
        if (rowsEl) {
          var view = 612 + (h - 764);
          setH(rowsEl, view);
          var live = rows.filter(function (r) { return !r.classList.contains('nb-gone'); });
          var need = live.reduce(function (a, r) { return a + r.__h0; }, 0) + 4 * (live.length - 1);
          /* 넓어진 높이는 줄이 나눠 갖는다 — 전부 들어오면 스크롤 없이 표가 판을 채운다 */
          var extra = exH > 0 && view > need ? (view - need) / live.length : 0;
          rows.forEach(function (r) { if (!r.classList.contains('nb-gone')) setH(r, r.__h0 + extra); });
        }
        if (total) setW(total, 974 + ex);
        /* 타임라인 */
        setW(tiBg, w);
        if (track) setW(track, track.__w + (w - 1849));
        var kx = (w - 62) / (1849 - 62);
        movers.forEach(function (c) { var cx = (c.__l || 0) + (c.__w || 0) / 2; c.__fx = (cx - 31) * (kx - 1); place(c); });
      };
    } else if (isMeasure(st.scene)) {
      var stage = realize(kid(frame, 'Stage'), { x: 21, y: 140, w: 1878, h: 919 });
      st.panels = { stage: stage };
      var inner = clipGrid(stage, st);
      var base = kid(kid(stage, 'Background'), 'Base');
      var mapStage = kid(stage, 'Map Stage'), det = kid(stage, 'Detail Callout');
      var ms = flat(mapStage, []).concat(det ? flat(det, []) : []);
      ms.forEach(function (c) { c.classList.add('nb-place'); });
      var title = kid(frame, 'Title');
      if (title) st.panels.title = realize(title, { x: 59.5, y: 179, w: 459, h: 54 });
      layout = function (VW, VH, exW, exH) {
        var w = 1878 + (VW - 1920), h = 919 + (VH - 1080);
        setBox(stage, 21, 140, w, h);
        setW(base, w); setH(base, h);
        if (inner) inner.style.transform = 'scale(' + Math.max(w / 1878, h / 919).toFixed(4) + ')';
        var dx = (w - 1878) / 2, dy = (h - 919) / 2;
        ms.forEach(function (c) { c.__fx = dx; c.__fy = dy; place(c); });
      };
    } else {
      var bgP = realize(kid(frame, 'Background'), { x: 21, y: 140, w: 1878, h: 919 });
      st.panels = { bg: bgP };
      var inner2 = clipGrid(bgP, st);
      var base2 = kid(bgP, 'Base');
      var comp = realize(kid(frame, 'Content'), { x: 0, y: 0, w: 1920, h: 1080 });
      var arrows = kid(frame, 'Flow Arrows') ? realize(kid(frame, 'Flow Arrows'), { x: 0, y: 0, w: 1920, h: 1080 }) : null;
      var tg = kid(frame, 'Widget/2040 Target');
      if (tg) tg.classList.add('nb-place');
      var accents = Array.prototype.filter.call(frame.children, function (c) { return !c.getAttribute('data-name') && getComputedStyle(c).position === 'absolute'; });
      accents.forEach(function (c) { c.classList.add('nb-place'); });
      st.panels.target = tg;
      comp.style.pointerEvents = 'none';
      all(comp, '[data-name^="Item/"],[data-name^="Route Label/"],[data-name^="Tag/"]').forEach(function (c) { c.style.pointerEvents = 'auto'; });
      if (arrows) arrows.style.pointerEvents = 'none';
      layout = function (VW, VH, exW, exH) {
        var w = 1878 + (VW - 1920), h = 919 + (VH - 1080);
        setBox(bgP, 21, 140, w, h);
        setW(base2, w); setH(base2, h);
        if (inner2) inner2.style.transform = 'scale(' + Math.max(w / 1878, h / 919).toFixed(4) + ')';
        var dx = (VW - 1920) / 2, dy = (VH - 1080) / 2;
        comp.style.translate = (dx || dy) ? dx.toFixed(2) + 'px ' + dy.toFixed(2) + 'px' : '';
        if (arrows) arrows.style.translate = comp.style.translate;
        if (tg) { tg.__fx = dx; tg.__fy = dy; place(tg); }
        accents.forEach(function (c) { c.__fx = dx; c.__fy = dy; place(c); });
      };
    }
    function fit() {
      var W = root.clientWidth, H = root.clientHeight;
      if (!W || !H) return;
      var S = Math.min(W / BASE_W, H / BASE_H), VW = W / S, VH = H / S;
      var exW = Math.max(0, VW - BASE_W), exH = Math.max(0, VH - BASE_H);
      if (exW < 0.01) exW = 0;
      if (exH < 0.01) exH = 0;
      st.S = S; st.exW = exW; st.exH = exH; st.VW = VW; st.VH = VH;
      frame.style.width = VW + 'px'; frame.style.height = VH + 'px';
      frame.style.transform = S === 1 ? 'none' : 'scale(' + S + ')';
      frame.style.willChange = Math.abs(S - 1) < 1e-4 ? 'transform' : 'auto';
      if (nav) setW(nav, VW + 1);
      if (header) setW(header, VW);
      layout(BASE_W + exW, BASE_H + exH, exW, exH);
    }
    var rsT = 0;
    function relayout() {
      root.classList.add('nb-resizing');
      fit();
      clearTimeout(rsT);
      rsT = setTimeout(function () { root.classList.remove('nb-resizing'); }, 140);
    }
    st.fit = fit;
    fit();
    if (window.ResizeObserver) { st.ro = new ResizeObserver(relayout); st.ro.observe(root); }
    else { st.onResize = relayout; window.addEventListener('resize', relayout); }
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('nb-live'); }); });
  }

  /* ══════════════════ 2. 시계 ══════════════════ */
  function installClock(root, st) {
    var d = one(root, '[data-name="Date"]') , t = one(root, '[data-name="Time"]');
    if (!d || !t) { var c = one(root, '[data-name="Timestamp"] [data-name="Content"]'); if (c) { d = c.children[0]; t = c.children[1]; } }
    function tick() {
      var n = new Date();
      write(d, n.getFullYear() + '-' + p2(n.getMonth() + 1) + '-' + p2(n.getDate()));
      write(t, p2(n.getHours()) + ':' + p2(n.getMinutes()) + ':' + p2(n.getSeconds()));
    }
    tick();
    st.timers.push(setInterval(tick, 1000));
  }

  /* ══════════════════ 3. 화면 잇기 ══════════════════ */
  var TAB_SCENE = ['wind', 'solar', 'energy'];
  function installNav(root, st) {
    var g = one(root, '[data-name="Nav Group"]');
    if (g) Array.prototype.forEach.call(g.children, function (p) {
      var t = p.textContent.trim();
      if (t === '재생에너지사업') clickable(p, function () { goto('wind'); });
      if (t === '해외사업') clickable(p, function () { goto('overseas'); });
    });
    var input = /-input$/.test(st.scene);
    var tabs = one(root, '[data-name="Tabs"]');
    if (tabs) Array.prototype.forEach.call(tabs.children, function (t, i) {
      clickable(t, function () { goto(TAB_SCENE[i] + (input ? '-input' : '')); });
    });
    if (isRenew(st.scene)) {
      var base = st.scene.replace('-input', '');
      all(root, '[data-name^="Button/Edit"]:not([data-name$="(Hover)"])').forEach(function (b) { clickable(b, function () { goto(base + '-input'); }); });
      all(root, '[data-name="Button/Save"],[data-name="Button/Cancel"]').forEach(function (b) { clickable(b, function () { goto(base); }); });
      /* 지도 말풍선 → 계측현황 */
      all(root, '[data-name^="Callout/"]').forEach(function (c) {
        var n = c.getAttribute('data-name');
        clickable(c, function () { goto(/Incheon \(In-house\)/.test(n) ? 'measure-wind' : /Sandan/.test(n) ? 'measure-solar' : /Haenam/.test(n) ? 'measure-popup' : 'measure'); });
      });
    }
    if (isMeasure(st.scene)) {
      all(root, '[data-name^="Callout/"]').forEach(function (c) {
        var n = c.getAttribute('data-name');
        var to = /Incheon \(In-house\)/.test(n) ? 'measure-wind' : /Sandan/.test(n) ? 'measure-solar' : /Haenam/.test(n) ? 'measure-popup' : null;
        if (to && to !== st.scene) clickable(c, function () { goto(to); });
      });
      var cl = one(root, '[data-name="Icon/Action/Close"]');
      if (cl) clickable(cl, function () { goto('measure'); });
      var tt = one(root, '[data-name="Title"] > p');
      if (tt) clickable(tt, function () { goto('wind'); });
    }
    all(root, '[data-name^="Callout/"],[data-name^="Row/"],[data-name^="Card/"],[data-name^="Step/"],[data-name="Hotspot"],[data-name="Arrow"],[data-name="Solar Panel Image"]').forEach(function (c, i) { c.style.setProperty('--i', i % 24); });
  }

  /* ══════════════════ 4. 표 — 호버 단추 · 삭제 · 입력 ══════════════════ */
  function installTable(root, st) {
    if (!isRenew(st.scene)) return;
    var body = one(root, '[data-name="Table/Project Status"] [data-name="Body"]');
    if (!body) return;
    var hE = kid(body, 'Button/Edit (Hover)'), hD = kid(body, 'Button/Delete (Hover)');
    if (hE && hD) {
      /* 삭제 말풍선 — 시안에서 숨겨진 칸이라 편집 말풍선을 떠서 쓴다 */
      var tip = kid(hE, 'Tooltip');
      if (tip && !kid(hD, 'Tooltip')) {
        var cp = tip.cloneNode(true);
        cp.removeAttribute('id');
        Array.prototype.forEach.call(cp.querySelectorAll('[id]'), function (n) { n.removeAttribute('id'); });
        var tx = cp.querySelector('p');
        if (tx) tx.textContent = '삭제';
        hD.appendChild(cp);
      }
    }
    function show(b, on) {
      var kind = /Delete/.test(b.getAttribute('data-name')) ? hD : hE;
      if (!kind) return;
      if (!on) { kind.classList.remove('nb-on'); return; }
      var S = st.S || 1, ic = b.querySelector('img') || b, rb = ic.closest('[data-name^="Icon/"]') || b, rr = (rb.parentElement && rb.parentElement !== b.parentElement ? rb.parentElement : b).getBoundingClientRect();
      var pr = body.getBoundingClientRect();
      imp(kind, 'left', ((rr.left - pr.left) / S - 7).toFixed(2) + 'px');
      imp(kind, 'top', ((rr.top - pr.top) / S).toFixed(2) + 'px');
      imp(kind, 'right', 'auto'); imp(kind, 'bottom', 'auto'); imp(kind, 'z-index', '4');
      kind.classList.add('nb-on');
    }
    all(body, '[data-name="Button/Edit"],[data-name="Button/Delete"]').forEach(function (b) {
      b.addEventListener('pointerenter', function () { if (!editing()) show(b, true); });
      b.addEventListener('pointerleave', function () { show(b, false); });
    });
    /* 삭제 — 줄이 접히고 합계가 따라간다(화면을 다시 열면 원본으로 돌아온다) */
    var tot = one(body, '[data-name="Row/Total"] [data-name="Td/Capacity"] p');
    function recount() {
      var sum = 0;
      all(body, '[data-name="Rows"] > [data-name^="Row/"]:not(.nb-gone) [data-name="Td/Capacity"] p').forEach(function (p) { sum += parseFloat(p.textContent.replace(/,/g, '')) || 0; });
      write(tot, comma(sum));
    }
    all(body, '[data-name="Button/Delete"]').forEach(function (b) {
      clickable(b, function () {
        var r = b.closest('[data-name^="Row/"]');
        if (!r) return;
        show(b, false);
        r.classList.add('nb-gone');
        imp(r, 'height', '0');
        recount();
      });
    });
    /* 인풋 화면 — 칸을 누르면 바로 고친다 */
    all(body, '[data-name="Input"] p').forEach(function (p) {
      p.parentElement.classList.add('nb-click');
      p.setAttribute('contenteditable', 'true');
      p.setAttribute('spellcheck', 'false');
      p.style.outline = 'none';
    });
    /* 합계가 처음 들어올 때 차오른다 */
    if (tot) {
      var goal = parseFloat(tot.textContent.replace(/,/g, '')) || 0, t0 = performance.now();
      var step = function (now) {
        if (!root.isConnected) return;
        var k = clamp((now - t0) / 900, 0, 1), e = 1 - Math.pow(1 - k, 3);
        write(tot, comma(goal * e));
        if (k < 1) st.raf = requestAnimationFrame(step);
      };
      st.raf = requestAnimationFrame(step);
    }
  }

  /* ══════════════════ 5. 타임라인 빛줄기 · 접기 ══════════════════ */
  function installMotion(root, st) {
    var track = one(root, '[data-name="Widget/Project Timeline"] [data-name="Track"]');
    if (track) {
      var sw = document.createElement('i');
      sw.className = 'nb-sweep';
      sw.style.cssText = 'left:0;top:0;width:100%;height:100%;';
      track.appendChild(sw);
    }
    var tg = one(root, '[data-name="Widget/2040 Target"]');
    if (tg) {
      var title = kid(tg, 'Title'), H = tg.offsetHeight, by0 = tg.offsetTop;
      var f = load(K_FOLD);
      var set = function (on) {
        tg.classList.toggle('nb-folded', on);
        setH(tg, on ? 88 : H);
        tg.__fyFold = on ? H - 88 : 0;
        tg.style.marginTop = on ? (H - 88) + 'px' : '';
      };
      if (f.target) set(true);
      clickable(title, function () {
        var on = !tg.classList.contains('nb-folded');
        set(on);
        var m = load(K_FOLD); m.target = on; save(K_FOLD, m);
      });
      st.resetFold = function () { set(false); var m = load(K_FOLD); delete m.target; save(K_FOLD, m); };
    }
  }

  /* ══════════════════ 6. 차트 바꾸기 ══════════════════ */
  var CC = { cy: '#7fd3fa', te: '#1ec9a0', ye: '#ffb742', re: '#ff6a6a', bl: '#575fff', gn: '#3ad59d' };
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
    el.className = 'nb-chart';
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
        s += '<clipPath id="nbc' + spec.uid + '"><rect x="' + L + '" y="0" width="' + (w - L - R) + '" height="' + h + '"/></clipPath><g clip-path="url(#nbc' + spec.uid + ')">';
        data.forEach(function (a, si) {
          var col = spec.series[si][1];
          var pts = a.map(function (v, i) { return X(i).toFixed(1) + ',' + Y(v).toFixed(1); }).join(' ');
          if (spec.k === 'area' || si === 0) {
            s += '<defs><linearGradient id="nbg' + spec.uid + si + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + col + '" stop-opacity="' + (spec.k === 'area' ? .4 : .18) + '"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></linearGradient></defs>';
            s += '<polygon fill="url(#nbg' + spec.uid + si + ')" points="' + X(0).toFixed(1) + ',' + (h - B) + ' ' + pts + ' ' + X(N - 1).toFixed(1) + ',' + (h - B) + '"/>';
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
        + '<defs><linearGradient id="nbgg' + spec.uid + '" x1="0" x2="1"><stop offset="0" stop-color="#2a7ca0"/><stop offset="1" stop-color="' + spec.c + '"/></linearGradient></defs>'
        + '<path d="M8 52a42 42 0 0 1 84 0" fill="none" stroke="rgba(142,166,179,.2)" stroke-width="8"/>'
        + '<path class="arc" d="M8 52a42 42 0 0 1 84 0" fill="none" stroke="url(#nbgg' + spec.uid + ')" stroke-width="8" stroke-dasharray="0 ' + LEN.toFixed(1) + '"/>'
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
    var rot = ((h - 199 + 540) % 360) - 180;
    root.style.setProperty('--nb-chue', (Math.abs(rot) < 3 ? 0 : Math.round(rot)) + 'deg');
  }
  var PJ = [['완도금일', 600], ['천사우이', 390], ['탐라 2단계', 72], ['인천용유', 320], ['인천덕적', 320], ['신안대광', 400], ['임자', 200], ['연수연도', 900], ['통영', 400], ['산단', 600], ['해남', 400]];
  var RENEW = {
    map: [
      { k: 'hbar', t: '사업별 용량', unit: 'MW', cats: PJ.slice().sort(function (a, b) { return b[1] - a[1]; }).slice(0, 8).map(function (p) { return p[0]; }), vals: PJ.slice().sort(function (a, b) { return b[1] - a[1]; }).slice(0, 8).map(function (p) { return p[1]; }), max: 1000, c: CC.cy },
      { k: 'donut', t: '에너지원별 용량', unit: 'MW', parts: [['풍력', CC.cy, 3692], ['태양광', CC.ye, 1000]] },
      { k: 'bar', t: '사업별 용량', unit: 'MW', cats: PJ.map(function (p) { return p[0]; }), vals: PJ.map(function (p) { return p[1]; }), max: 1000, c: CC.te },
    ],
    status: [
      { k: 'bar', t: '사업별 용량', unit: 'MW', cats: PJ.map(function (p) { return p[0]; }), vals: PJ.map(function (p) { return p[1]; }), max: 1000, c: CC.cy },
      { k: 'donut', t: '단계별 용량', unit: 'MW', parts: [['운영중', CC.ye, 90], ['개발중', CC.te, 4602]] },
      { k: 'area', t: '합계 용량 추이', unit: 'MW', series: [['합계', CC.cy, 4692, 6]], lo: 4660, hi: 4724 },
    ],
    time: [
      { k: 'area', t: '합계 용량 추이', unit: 'MW', series: [['합계', CC.cy, 4692, 6]], lo: 4660, hi: 4724 },
      { k: 'line', t: '에너지원별 용량 추이', unit: 'MW', series: [['풍력', CC.cy, 3692, 8], ['태양광', CC.ye, 1000, 6]], lo: 800, hi: 3900 },
    ],
  };
  var OVER = [
    { k: 'bar', t: '용량 목표', unit: 'MW', cats: ['2025', '2032', '2040'], vals: [460, 2800, 5000], max: 5500, c: CC.cy },
    { k: 'bar', t: '매출액 목표', unit: '억원', cats: ['2025', '2032', '2040'], vals: [2000, 10000, 20000], max: 22000, c: CC.ye },
    { k: 'hbar', t: '순이익 목표', unit: '억원', cats: ['2025', '2032', '2040'], vals: [580, 1800, 3600], max: 4000, c: CC.te },
  ];
  var POP = {
    'measure-wind': [
      { k: 'gauge', t: '이용률', unit: '%', v: [25, .6], max: 100, c: CC.cy, dec: 1 },
      { k: 'line', t: '풍속 추이', unit: 'm/s', dec: 1, series: [['풍속', CC.cy, 7, .35]], lo: 5, hi: 9 },
    ],
    'measure-solar': [
      { k: 'gauge', t: '이용률', unit: '%', v: [15, .5], max: 100, c: CC.ye, dec: 1 },
      { k: 'area', t: '일사량 추이', unit: 'MJ/m²', series: [['일사량', CC.ye, 200, 4]], lo: 180, hi: 220 },
    ],
    'measure-popup': [
      { k: 'gauge', t: '용량', unit: 'MW', v: [400, 2], max: 600, c: CC.cy },
      { k: 'area', t: '용량 추이', unit: 'MW', series: [['용량', CC.cy, 400, 3]], lo: 385, hi: 415 },
    ],
  };
  var MEASURE = [
    { k: 'hbar', t: '사업별 용량', unit: 'MW', cats: ['연수연도', '완도금일', '통영', '천사우이', '인천(자체)', '인천(오스테드)', '서남해', '대광임자'], vals: [900, 600, 400, 390, 320, 320, 200, 200], max: 1000, c: CC.cy },
    { k: 'donut', t: '에너지원별 용량', unit: 'MW', parts: [['풍력', CC.cy, 3692], ['태양광', CC.ye, 1000]] },
  ];
  function targets(root, st) {
    var T = [], P = st.panels || {};
    if (isRenew(st.scene)) {
      T.push({ key: 'time', w: P.time, hide: [kid(P.time, 'Timeline') || kid(P.time, 'Steps'), kid(P.time, 'Visuals'), kid(P.time, 'Tooltips')], list: RENEW.time, box: { l: 24, t: 34, r: 24, b: 8 }, hideRest: true });
      T.push({ key: 'map', w: P.map, hide: [kid(P.map, 'Map Stage')], list: RENEW.map, box: { l: 28, t: 28, r: 28, b: 28 } });
      T.push({ key: 'status', w: P.status, hide: [one(P.status, '[data-name="Table/Project Status"]')].concat(Array.prototype.filter.call(P.status.children, function (c) { return !c.getAttribute('data-name') || c.getAttribute('data-name') === 'Divider'; })), list: RENEW.status, box: { l: 32, t: 32, r: 32, b: 32 } });
    } else if (st.scene === 'overseas') {
      if (P.target) T.push({ key: 'target', w: P.target, hide: [kid(P.target, 'Body')], list: OVER, box: { l: 20, t: 72, r: 20, b: 16 } });
    } else if (POP[st.scene]) {
      var pop = one(root, '[data-name^="Popup/"]');
      if (pop) T.push({ key: 'popup', w: pop, hide: [one(pop, '[data-name^="Table/"]') && one(pop, '[data-name^="Table/"]').parentElement === pop ? one(pop, '[data-name^="Table/"]') : kid(pop, 'Body')], list: POP[st.scene], box: { l: 14, t: 48, r: 14, b: 12 } });
    } else if (st.scene === 'measure') {
      T.push({ key: 'stage', w: P.stage, hide: [kid(P.stage, 'Map Stage')], list: MEASURE, box: { l: 520, t: 90, r: 520, b: 90 } });
    }
    return T.filter(function (t) { return t.w; });
  }
  function installChartSwap(root, st) {
    var savedAll = load(K_CHART), saved = savedAll[st.scene] || {};
    st.charts = {}; st.chartApply = {};
    var probe = document.createElement('i');
    probe.className = 'nb-probe';
    st.frame.appendChild(probe);
    targets(root, st).forEach(function (tg) {
      if (getComputedStyle(tg.w).position === 'static') tg.w.style.position = 'relative';
      var host = document.createElement('div');
      host.className = 'nb-host';
      host.style.left = tg.box.l + 'px'; host.style.top = tg.box.t + 'px'; host.style.right = tg.box.r + 'px'; host.style.bottom = tg.box.b + 'px';
      tg.w.appendChild(host);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nb-chartbtn';
      btn.innerHTML = KIND_ICON.bar.replace('class="ic"', 'class="ic" style="width:13px;height:11px"') + '차트';
      btn.title = '이 패널의 차트 바꾸기';
      var menu = document.createElement('div');
      menu.className = 'nb-chartmenu';
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
        tg.w.classList.toggle('nb-swapped', i >= 0);
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
        all(root, '.nb-chartmenu.open').forEach(function (m) { if (m !== menu) m.classList.remove('open'); });
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
      if (e.target.closest && e.target.closest('.nb-chartmenu, .nb-chartbtn')) return;
      all(root, '.nb-chartmenu.open').forEach(function (m) { m.classList.remove('open'); });
    };
    document.addEventListener('pointerdown', st.onDocDown, true);
  }

  /* ══════════════════ 7. 패널 옮기기 ══════════════════
     재생에너지 — 지도와 표는 놓는 쪽으로 자리를 맞바꾸고(폭이 그 자리에 맞게 바뀐다), 타임라인은 위/아래로 흐른다.
     계측 · 해외 — 제목 · 팝업 · 2040 목표는 4px 격자 자유 이동. */
  function installPanelMove(root, st) {
    var LS = load(K_LAYOUT), me = LS[st.scene] = st.layoutState || {};
    function persist() { var a = load(K_LAYOUT); a[st.scene] = me; save(K_LAYOUT, a); }
    var P = st.panels || {}, mv = [];
    if (isRenew(st.scene)) {
      [P.map, P.status, P.time].forEach(function (w) { w.classList.add('nb-mv'); w.setAttribute('data-nb-kind', 'slot'); mv.push(w); });
    }
    var frees = [];
    if (P.title) frees.push(P.title);
    if (P.target) frees.push(P.target);
    var pop = one(root, '[data-name^="Popup/"]');
    if (pop) frees.push(pop);
    me.free = me.free || {};
    frees.forEach(function (f) {
      f.classList.add('nb-mv', 'nb-place'); f.setAttribute('data-nb-kind', 'free');
      var s = me.free[f.getAttribute('data-name')];
      if (s) { f.__ux = s[0]; f.__uy = s[1]; place(f); }
    });
    var drag = null;
    st.onDown = function (e) {
      if (!layoutEditing(root) || e.button !== 0) return;
      if (e.target.closest('.nb-chartbtn, .nb-chartmenu, .nb-resetbtn')) return;
      if (e.target.closest('[contenteditable="true"]')) return;
      var w = e.target.closest('.nb-mv');
      if (!w || !root.contains(w)) return;
      e.preventDefault(); e.stopPropagation();
      drag = { w: w, kind: w.getAttribute('data-nb-kind'), sx: e.clientX, sy: e.clientY, moved: false };
    };
    st.onMove = function (e) {
      if (!drag) return;
      var S = st.S || 1, dx = (e.clientX - drag.sx) / S, dy = (e.clientY - drag.sy) / S;
      if (!drag.moved) {
        if (Math.hypot(dx, dy) < 3) return;
        drag.moved = true;
        drag.w.classList.add('nb-dragging');
      }
      drag.w.__dx = dx; drag.w.__dy = dy;
      if (drag.kind === 'slot') drag.w.style.translate = dx.toFixed(1) + 'px ' + dy.toFixed(1) + 'px';
      else place(drag.w);
    };
    st.onUp = function () {
      if (!drag) return;
      var d = drag; drag = null;
      var w = d.w;
      if (!d.moved) { w.classList.remove('nb-dragging'); return; }
      var dx = w.__dx || 0, dy = w.__dy || 0;
      w.__dx = 0; w.__dy = 0;
      void w.offsetWidth;
      w.classList.remove('nb-dragging');
      if (d.kind === 'slot') {
        w.style.translate = '';
        var cx = w.offsetLeft + w.offsetWidth / 2 + dx, cy = w.offsetTop + w.offsetHeight / 2 + dy;
        if (w === P.time) {
          me.timeBottom = cy > (st.VH || 1080) * 0.55;
        } else {
          var other = w === P.map ? P.status : P.map;
          var oc = other.offsetLeft + other.offsetWidth / 2, mine = w.offsetLeft + w.offsetWidth / 2;
          if (Math.abs(cx - oc) < Math.abs(cx - mine)) me.swap = !me.swap;
          var tbNow = Math.abs(cy - (P.time.offsetTop + 67)) < 120;
          if (tbNow) me.timeBottom = !me.timeBottom;
        }
        st.layoutState.swap = me.swap; st.layoutState.timeBottom = me.timeBottom;
        st.fit();
      } else {
        var snap = function (v) { return Math.round(v / 4) * 4; };
        w.__ux = snap((w.__ux || 0) + dx); w.__uy = snap((w.__uy || 0) + dy);
        place(w);
        me.free[w.getAttribute('data-name')] = [w.__ux, w.__uy];
      }
      persist();
    };
    root.addEventListener('pointerdown', st.onDown, true);
    window.addEventListener('pointermove', st.onMove);
    window.addEventListener('pointerup', st.onUp);
    window.addEventListener('pointercancel', st.onUp);
    st.onDragStart = function (e) { if (layoutEditing(root) && e.target.closest && e.target.closest('.nb-mv')) e.preventDefault(); };
    root.addEventListener('dragstart', st.onDragStart);
    st.resetLayout = function () {
      me = { free: {} };
      st.layoutState.swap = false; st.layoutState.timeBottom = false;
      var a = load(K_LAYOUT); a[st.scene] = me; save(K_LAYOUT, a);
      frees.forEach(function (f) { f.__ux = 0; f.__uy = 0; place(f); });
      if (st.resetFold) st.resetFold();
      Object.keys(st.chartApply || {}).forEach(function (k) { st.chartApply[k](-1); });
      st.fit();
    };
    var rb = document.createElement('button');
    rb.type = 'button';
    rb.className = 'nb-resetbtn';
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
    [['fit', installFit], ['clock', installClock], ['nav', installNav], ['table', installTable], ['motion', installMotion], ['swap', installChartSwap], ['move', installPanelMove]]
      .forEach(function (s) { try { s[1](root, st); } catch (e) { console.warn('[nb] ' + s[0], e); } });
    root.classList.add('nb-enter');
    st.timers.push(setTimeout(function () { root.classList.remove('nb-enter'); }, 1200));
  }
  function initNewbiz(root) {
    if (!root || root.__nb) return;
    injectStyle();
    root.classList.add('nb-root');
    var px = /(nb[a-z])-root/.exec(root.className);
    var st = root.__nb = { timers: [], px: px ? px[1] : 'nbw', scene: px ? SCENES[px[1]] : 'wind' };
    if (/[?&]edit=1/.test(location.search)) root.classList.add('nb-edit-layout');
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
  function disposeNewbiz(root) {
    var st = root && root.__nb;
    if (!st) return;
    if (st.wait) st.wait.disconnect();
    st.timers.forEach(function (t) { clearInterval(t); clearTimeout(t); });
    cancelAnimationFrame(st.raf);
    if (st.ro) st.ro.disconnect();
    if (st.onResize) window.removeEventListener('resize', st.onResize);
    Object.keys(st.charts || {}).forEach(function (k) { st.charts[k].dispose(); });
    if (st.onDocDown) document.removeEventListener('pointerdown', st.onDocDown, true);
    if (st.onDown) root.removeEventListener('pointerdown', st.onDown, true);
    if (st.onMove) window.removeEventListener('pointermove', st.onMove);
    if (st.onUp) { window.removeEventListener('pointerup', st.onUp); window.removeEventListener('pointercancel', st.onUp); }
    if (st.onDragStart) root.removeEventListener('dragstart', st.onDragStart);
    if (st.onReset) document.removeEventListener('click', st.onReset, true);
    root.__nb = null;
  }
  window.initNewbiz = initNewbiz;
  window.disposeNewbiz = disposeNewbiz;
})();
