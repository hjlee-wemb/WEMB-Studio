/* 스마트 빌딩 에너지 관리 — 재구축 화면(메인 · 층별 현황)의 인터랙션 · 라이브 · 반응형 레이어.
   window.initBems(root) / window.disposeBems(root)

   화면(DOM·CSS)은 생성기(src/bems/_gen/conv.js)가 Figma 그대로 만든다. 이 파일은 그 위에 '움직이는 것'만 얹는다 — 정지 상태(?live=0) = Figma 원본.
   · 반응형 — 1920x1080 좌표계 + 균일 배율. 남는 폭 · 높이는 첫 단 묶음(왼쪽 열 · 3D · 오른쪽 열 · 필터 · 자산 목록)이 자리에 따라 나눠 갖고,
     바탕 · 헤더 띠는 늘어나 여백이 없다(데이터센터 생성기의 installFit 그대로).
   · 실시간 시계(헤더 YY-MM-DD · HH:MM), 이벤트 발생시각을 '지금' 기준으로(열 때마다 최근), 새 이벤트가 맨 위로 흘러 들어온다
   · 헤더 탭(MAIN · FLOOR) · 층 선택(B3~17) — 장면 잇기 · 고른 층 표시(마커가 미끄러진다), 층을 바꾸면 층별 현황 글자 · 차트가 그 층으로
   · 마우스 오버 · 눌림 — 탭 · 층 · 아이콘 단추 · 설비 목록 · 상태 카드 · 이벤트 줄 · 필터 · 트리 항목
   · 필터 바 — 고른 설비가 켜지고 자산 목록에서 그 무리가 펼쳐진다
   · 자산 목록 — 접기 단추(»)로 판을 밀어 넣고 빼고, 무리(Tree Item)를 누르면 펼치고 접는다, 넘치면 스크롤
   · 이벤트 목록 — 접기 단추로 펼치고 접고(기억), 지난 이벤트는 스크롤로 본다
   · 차트 — KW · KWH 막대가 실시간처럼 움직이고(요약 · 헤더 값도 따라간다), 급수 면적 차트도 흐른다
   · 차트 바꾸기(패널편집 중) — 패널마다 빌딩 에너지 관제에 맞춘 추천 차트. 첫 항목 = 추천, '원본 그대로'로 되돌린다
   · 패널 옮기기(패널편집 중) — 패널을 4px 격자로 옮긴다, '배치 초기화'로 되돌린다
   손으로 쓴 파일이다(생성물 아님). 고친 뒤 node mk-live.js → js/core/tpl-modules.js 의 bems-live.js ?v= 를 올릴 것. */
(function () {
  'use strict';

  var BASE_W = 1920, BASE_H = 1080;
  var K_LAYOUT = 'wemb-bems-layout', K_CHART = 'wemb-bems-chart', K_FOLD = 'wemb-bems-fold';
  var STYLE_ID = 'bems-live-style';
  var EASE = 'cubic-bezier(.22,.8,.24,1)';
  var BASE_TIME = new Date(2026, 11, 9, 19, 42, 0).getTime();   /* Figma 화면에 찍힌 기준 시각 26-12-09 19:42 */

  /* ══════════════════ 스타일 ══════════════════ */
  var CSS = [
    '.be-root{--be-acc:86,141,255;overflow:clip!important;}',
    '.be-root.be-resizing *,.be-root .be-dragging,.be-root .be-dragging *{transition:none!important;}',
    '.be-root.be-live .be-place{transition:translate .5s ' + EASE + ',opacity .3s ease;}',
    '.be-root .be-bgfill{position:absolute;left:0;top:0;z-index:-1;pointer-events:none;}',
    '.be-root .be-probe{position:absolute;width:0;height:0;overflow:hidden;color:#568dff;}',
    '.be-root .be-refbox{position:absolute!important;left:-9999px!important;top:0!important;visibility:hidden;pointer-events:none;}',
    '.be-root .be-click{cursor:pointer;}',
    '.be-root .be-click *{cursor:inherit;}',
    '.be-root img{pointer-events:none;}',
    '.dt-content-editing .be-root .be-click,.dt-content-editing .be-root .be-click *{cursor:text;}',
    '@keyframes beIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}}',
    '@keyframes beRowIn{from{opacity:0;transform:translateX(-18px);background-color:rgba(86,141,255,.35);}to{opacity:1;transform:none;}}',
    '@keyframes beBlink{0%,100%{opacity:1;}50%{opacity:.35;}}',
    '@keyframes beDraw{from{clip-path:inset(0 100% 0 0);}to{clip-path:inset(0 0 0 0);}}',
    '.be-root.be-enter .be-unit{animation:beIn .55s ' + EASE + ' both;animation-delay:calc(var(--i,0) * 60ms);}',
    '.be-root.be-enter [data-name="Line/Yesterday"]{animation:beDraw 1.2s ' + EASE + ' .25s both;}',
    '.be-root .be-rowin{animation:beRowIn .7s ' + EASE + ' both;}',
    '.be-root .be-blink{animation:beBlink 1.4s ease-in-out 3;}',
    /* 헤더 탭 — 지금 화면만 흰 글자, 올리면 밝아진다 */
    '.be-root .be-tab{cursor:pointer;transition:color .2s ease,text-shadow .25s ease;}',
    '.be-root .be-tab:not(.be-act):hover{color:#c8d6f0!important;text-shadow:0 0 10px rgba(86,141,255,.65);}',
    '.be-root .be-tab::after{content:"";position:absolute;inset:-12px -20px;}',
    /* 층 선택 */
    '.be-root .be-floor{cursor:pointer;transition:color .2s ease,text-shadow .25s ease,scale .2s ' + EASE + ';}',
    '.be-root .be-floor:hover{color:#e8efff!important;text-shadow:0 0 8px rgba(120,170,255,.8);scale:1.12;}',
    '.be-root [data-name="List"] > p.be-floor:not(.be-act){color:#6880a4!important;}',
    '.be-root [data-name="List"] > p.be-floor.be-act{color:#ccc!important;}',
    '.be-root[data-theme="light"] [data-name="Floor Selector"] [data-name="List"] > p.be-floor:not(.be-act){color:#536480!important;font-weight:400;}',
    '.be-root[data-theme="light"] [data-name="Floor Selector"] [data-name="List"] > p.be-floor.be-act{color:#2457c5!important;font-weight:600;}',
    '.be-root .be-floor::after{content:"";position:absolute;inset:-12px -8px;}',
    '.be-root .be-marker{transition:translate .45s ' + EASE + ';}',
    '.dt-content-editing .be-root .be-tab::after,.dt-editing .be-root .be-tab::after,.dt-content-editing .be-root .be-floor::after,.dt-editing .be-root .be-floor::after{display:none;}',
    /* 단추 · 아이콘 단추 */
    '.be-root .be-btn{cursor:pointer;transition:filter .2s ease,translate .2s ' + EASE + ',box-shadow .25s ease;}',
    '.be-root .be-btn:hover{filter:brightness(1.35) drop-shadow(0 0 7px rgba(86,141,255,.75));translate:0 -1px;}',
    '.be-root .be-btn:active{filter:brightness(.9);translate:0 1px;}',
    /* 설비 목록 · 상태 카드 · 이벤트 줄 · 필터 */
    '.be-root .be-item{cursor:pointer;transition:background-color .25s ease,filter .2s ease,translate .25s ' + EASE + ',box-shadow .25s ease;}',
    '.be-root .be-item:hover{filter:brightness(1.18);translate:3px 0;box-shadow:inset 3px 0 0 rgb(var(--be-acc));}',
    '.be-root .be-card{cursor:pointer;transition:filter .2s ease,translate .25s ' + EASE + ',box-shadow .25s ease;}',
    '.be-root .be-card:hover{filter:brightness(1.2);translate:0 -3px;box-shadow:0 8px 18px rgba(0,0,0,.35),0 0 0 1px rgba(var(--be-acc),.6);}',
    '.be-root .be-ev{cursor:pointer;transition:background-color .25s ease,box-shadow .25s ease;}',
    '.be-root .be-ev:hover{background-color:rgba(86,141,255,.12);box-shadow:inset 3px 0 0 rgb(var(--be-acc));}',
    '.be-root .be-filter{cursor:pointer;}',
    '.be-root .be-filter > [data-name="Badge"]{transition:filter .2s ease,translate .2s ' + EASE + ',box-shadow .25s ease;}',
    '.be-root .be-filter:hover > [data-name="Badge"]{filter:brightness(1.35);translate:0 -2px;box-shadow:0 0 0 1px rgba(var(--be-acc),.8),0 6px 14px rgba(0,0,0,.35);}',
    '.be-root .be-filter:hover > p,.be-root .be-filter:hover > div:not([data-name="Badge"]){color:#e6edf8!important;}',
    '.be-root .be-filter.be-fact > p,.be-root .be-filter.be-fact > div:not([data-name="Badge"]){color:#fff!important;}',
    /* 자산 목록 — 트리 스크롤 · 접기 */
    '.be-root .be-tree{position:absolute;overflow-x:hidden;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#5c5e64 transparent;overscroll-behavior:contain;}',
    '.be-root .be-tree::-webkit-scrollbar{width:4px;}',
    '.be-root .be-tree::-webkit-scrollbar-thumb{background:#5c5e64;border-radius:2px;}',
    '.be-root .be-tree > *{position:relative!important;left:auto!important;top:auto!important;height:auto!important;}',
    /* 무리 상자는 Figma 높이(고정)라 펼친 목록이 끼면 flex 가 줄여 버렸다 → 줄이지 않는다(넘치면 트리가 스크롤) */
    '.be-root .be-tree > * > *{flex-shrink:0;}',
    '.be-root .be-tnode{cursor:pointer;transition:background-color .2s ease,filter .2s ease;}',
    '.be-root .be-tnode:hover{filter:brightness(1.25);}',
    '.be-root .be-tnode [data-name="Toggle"]{transition:rotate .35s ' + EASE + ',background-color .2s ease;}',
    '.be-root .be-tnode.be-open [data-name="Toggle"]{rotate:90deg;}',
    '.be-root .be-tnode.be-pdu [data-name="Toggle"]{rotate:-90deg;}',
    '.be-root .be-tnode.be-pdu.be-open [data-name="Toggle"]{rotate:0deg;}',
    '.be-root .be-sub{overflow:hidden;transition:height .38s ' + EASE + ',opacity .3s ease;}',
    '.be-root .be-leaf{cursor:pointer;transition:background-color .18s ease;}',
    '.be-root .be-leaf:not(.be-lsel):hover{background-color:#000!important;}',
    '.be-root .be-leaf.be-lclr:not(.be-lsel){background-color:transparent!important;}',
    '.be-root .be-leaf.be-lsel{background-color:#4c556c!important;}',
    '.be-root .be-leaf.be-lsel p{color:#fff!important;}',
    '.be-root .be-leaf.be-lunsel{background-color:transparent!important;}',
    '.be-root .be-leaf.be-lunsel p{color:#acacac!important;}',
    '.be-root .be-slide{transition:transform .55s ' + EASE + ',opacity .4s ease;}',
    '.be-root .be-folded .be-slide{transform:translateX(262px);opacity:0;pointer-events:none;}',
    '.be-root .be-foldbtn{transition:transform .55s ' + EASE + ',filter .2s ease;}',
    '.be-root .be-folded .be-foldbtn{transform:translateX(252px);}',
    '.be-root .be-foldbtn [data-name="Icon/Action/Collapse"]{transition:rotate .45s ' + EASE + ';}',
    '.be-root .be-folded .be-foldbtn [data-name="Icon/Action/Collapse"]{rotate:180deg;}',
    /* 이벤트 목록 — 접기 · 스크롤 */
    '.be-root .be-evlist{overflow-y:auto!important;overflow-x:hidden;justify-content:flex-start!important;padding:12px 0!important;scrollbar-width:none;overscroll-behavior:contain;transition:height .5s ' + EASE + ',opacity .35s ease,padding .5s ' + EASE + ',border-color .3s ease;}',
    '.be-root .be-evlist::-webkit-scrollbar{display:none;}',
    '.be-root .be-evlist > *{flex-shrink:0;}',
    '.be-root .be-evfold .be-evlist{height:0!important;opacity:0;padding:0!important;border-color:transparent!important;}',
    '.be-root .be-cardbg{transition:height .5s ' + EASE + ';}',
    '.be-root .be-evtoggle{position:relative;width:20px;height:20px;border-radius:10px;background:#5c5e64;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;transition:filter .2s ease,box-shadow .25s ease;}',
    '.be-root .be-evtoggle:hover{filter:brightness(1.3);box-shadow:0 0 0 1px rgba(var(--be-acc),.9),0 0 8px rgba(var(--be-acc),.6);}',
    '.be-root .be-evtoggle img{width:12px;height:12px;display:block;transition:rotate .45s ' + EASE + ';}',
    '.be-root .be-evfold .be-evtoggle img{rotate:-90deg;}',
    '.be-root .be-evtoggle::after{content:"";position:absolute;inset:-8px;}',
    /* 차트 */
    '.be-root [data-name="Bar"]{transition:height .9s ' + EASE + ';}',
    '.be-root.be-enter [data-name="Bar"]{transition-delay:calc(var(--bi,0) * 14ms);}',
    '.be-root .be-flash{transition:text-shadow .4s ease;text-shadow:0 0 10px rgba(74,255,255,.9);}',
    '.be-root .be-water path{transition:none;}',
    /* 툴팁 · 토스트 */
    '.be-root .be-tip{position:absolute;left:0;top:0;z-index:90;max-width:280px;padding:7px 11px;border:1px solid rgba(86,141,255,.7);border-radius:7px;background:rgba(6,10,24,.95);color:#e6eeff;font:500 13px/1.35 "Pretendard Variable",Pretendard,sans-serif;pointer-events:none;opacity:0;translate:0 4px;transition:opacity .16s ease,translate .2s ' + EASE + ';box-shadow:0 6px 18px rgba(0,0,0,.35);width:max-content;word-break:keep-all;}',
    '.be-root .be-tip.on{opacity:1;translate:0 0;}',
    '.be-root .be-toast{position:absolute;left:50%;top:96px;z-index:80;translate:-50% -8px;opacity:0;padding:10px 20px;border:1px solid rgba(86,141,255,.7);border-radius:10px;background:rgba(6,10,24,.94);color:#e6eeff;font:600 15px/1 "Pretendard Variable",Pretendard,sans-serif;pointer-events:none;transition:opacity .25s ease,translate .3s ' + EASE + ';white-space:nowrap;box-shadow:0 0 14px rgba(86,141,255,.35);}',
    '.be-root .be-toast.on{opacity:1;translate:-50% 0;}',
    /* 패널 옮기기 · 차트 바꾸기 */
    '.dt-editing .be-root .be-mv,.be-root.be-edit-layout .be-mv{cursor:grab!important;}',
    '.dt-editing .be-root .be-mv *,.be-root.be-edit-layout .be-mv *{cursor:grab!important;}',
    '.dt-editing .be-root .be-mv:hover,.be-root.be-edit-layout .be-mv:hover{outline:1px dashed rgba(var(--be-acc),.9);outline-offset:3px;}',
    '.be-root .be-mv{transition:translate .35s ' + EASE + ';}',
    '.be-root .be-front{z-index:20;}',
    '.be-root .be-dragging{filter:drop-shadow(0 14px 22px rgba(0,0,0,.45));z-index:30!important;}',
    '.be-root .be-resetbtn{position:absolute;left:660px;top:58px;z-index:45;display:none;height:26px;padding:0 14px;border:1px solid rgb(var(--be-acc));border-radius:8px;background:#0b1530;color:#e6f0ff;font:500 13px/1 "Pretendard Variable",Pretendard,sans-serif;cursor:pointer;}',
    '.be-root .be-resetbtn:hover{filter:brightness(1.25);box-shadow:0 0 12px rgba(var(--be-acc),.6);}',
    '.dt-editing .be-root .be-resetbtn,.be-root.be-edit-layout .be-resetbtn{display:block;}',
    '.dt-editing .be-root [data-name]{animation-play-state:paused!important;}',
    '.be-root .be-chost{position:absolute;z-index:6;pointer-events:auto;}',
    '.be-root .be-hid{visibility:hidden!important;}',
    '.be-root .be-chartbtn.be-chartbtn{position:absolute;z-index:46;right:auto;width:auto;}',
    '.be-root .be-chartmenu.be-chartmenu{position:absolute;z-index:47;right:auto;}',
    '.be-root :has(> .be-chartmenu.open){z-index:50!important;}',
    /*@CHART_CSS*/
    /* 라이트 */
    '.be-root[data-theme="light"] .be-tab:not(.be-act):hover{color:#0f2a55!important;text-shadow:0 0 8px rgba(30,100,230,.3);}',
    '.be-root[data-theme="light"] .be-floor:hover{color:#0f2a55!important;text-shadow:0 0 6px rgba(30,100,230,.35);}',
    '.be-root[data-theme="light"] .be-btn:hover{filter:brightness(.95) drop-shadow(0 2px 6px rgba(30,90,200,.3));}',
    '.be-root[data-theme="light"] .be-item:hover{filter:none;background-color:rgba(60,110,230,.08);}',
    '.be-root[data-theme="light"] .be-card:hover{filter:none;box-shadow:0 8px 18px rgba(30,60,120,.16),0 0 0 1px rgba(60,110,230,.55);}',
    '.be-root[data-theme="light"] .be-ev:hover{background-color:rgba(60,110,230,.08);}',
    '.be-root[data-theme="light"] .be-filter:hover > [data-name="Badge"]{filter:none;box-shadow:0 0 0 1px rgba(60,110,230,.7),0 6px 14px rgba(30,60,120,.16);}',
    '.be-root[data-theme="light"] .be-filter:hover > p,.be-root[data-theme="light"] .be-filter:hover > div:not([data-name="Badge"]),.be-root[data-theme="light"] .be-filter.be-fact > p,.be-root[data-theme="light"] .be-filter.be-fact > div:not([data-name="Badge"]){color:#0f2a55!important;}',
    '.be-root[data-theme="light"] .be-tnode:hover{filter:brightness(.96);}',
    '.be-root[data-theme="light"] .be-leaf:not(.be-lsel):hover{background-color:#e3ebf7!important;}',
    '.be-root[data-theme="light"] .be-leaf.be-lsel{background-color:#cfdcf2!important;}',
    '.be-root[data-theme="light"] .be-leaf.be-lsel p{color:#0b2a55!important;}',
    '.be-root[data-theme="light"] .be-leaf.be-lunsel p{color:#4a5568!important;}',
    '.be-root[data-theme="light"] .be-tree{scrollbar-color:#b9c4d4 transparent;}',
    '.be-root[data-theme="light"] .be-tree::-webkit-scrollbar-thumb{background:#b9c4d4;}',
    '.be-root[data-theme="light"] .be-evtoggle{background:#d9e1ec;}',
    '.be-root[data-theme="light"] .be-evtoggle img{filter:invert(.55);}',
    '.be-root[data-theme="light"] .be-flash{text-shadow:0 0 8px rgba(30,110,230,.45);}',
    '.be-root[data-theme="light"] .be-tip,.be-root[data-theme="light"] .be-toast{background:#fff;color:#15253a;border-color:#8fb0e8;box-shadow:0 8px 22px rgba(30,60,100,.16);}',
    '.be-root[data-theme="light"] .be-dragging{filter:drop-shadow(0 14px 22px rgba(30,60,100,.22));}',
    '.be-root[data-theme="light"] .be-resetbtn{background:#fff;color:#15253a;}',
    '.be-root[data-theme="light"] .be-chart{background:#fff;box-shadow:inset 0 0 0 1px #d9e2ea;color:#2c3e54;}',
    '.be-root[data-theme="light"] .be-chart .ct{color:#15253a;}',
    '.be-root[data-theme="light"] .be-chartbtn{background:#fff;color:#2457c5;box-shadow:0 2px 6px rgba(30,60,100,.14);}',
    '.be-root[data-theme="light"] .be-chart .ct b,.be-root[data-theme="light"] .be-chart .gv{color:#1d4fc0;}',
    '.be-root[data-theme="light"] .be-chart .ct b small,.be-root[data-theme="light"] .be-chart .gv small,.be-root[data-theme="light"] .be-chart .lg,.be-root[data-theme="light"] .be-chart .bars u{color:#5a6c82;}',
    '.be-root[data-theme="light"] .be-chart .ax{fill:#5a6c82;}',
    '.be-root[data-theme="light"] .be-chart .bars em,.be-root[data-theme="light"] .be-chart .hb b,.be-root[data-theme="light"] .be-chart .dn b{color:#15253a;}',
    '.be-root[data-theme="light"] .be-chart .gl{stroke:#e4ebf1;}',
    '.be-root[data-theme="light"] .be-chartmenu{background:#fff;color:#2c3e54;border-color:#d9e2ea;box-shadow:0 8px 22px rgba(30,60,100,.14);}',
    '.be-root[data-theme="light"] .be-chartmenu button:hover,.be-root[data-theme="light"] .be-chartmenu button.cur{color:#15253a;}',
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
  function layoutEditing(root) { return !!(root.closest('.dt-editing') || root.classList.contains('be-edit-layout')); }
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
  function claimed(p) { return p.__beLast != null && p.textContent !== p.__beLast; }
  function write(p, s) {
    if (!p || p === document.activeElement || claimed(p)) return false;
    if (p.textContent !== s) p.textContent = s;
    p.__beLast = p.textContent;
    return true;
  }
  function flash(p) {
    if (!p) return;
    p.classList.add('be-flash');
    setTimeout(function () { p.classList.remove('be-flash'); }, 700);
  }
  function clickable(el, fn, cls) {
    if (!el || el.__beClick) return;
    el.__beClick = true;
    el.classList.add('be-click');
    if (cls) el.classList.add(cls);
    el.addEventListener('click', function (e) {
      if (editing()) return;
      e.stopPropagation();
      fn(e);
    });
  }
  function tip(el, s) { if (el && s && !el.getAttribute('data-be-tip')) el.setAttribute('data-be-tip', s); }
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
    if (window.__gotoBemsScene) { window.__gotoBemsScene(scene); return; }
    location.href = scene + '.html' + location.search;
  }
  function toast(st, msg) {
    var t = st.toast;
    if (!t) { t = st.toast = document.createElement('div'); t.className = 'be-toast'; st.frame.appendChild(t); }
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(st.toastT);
    st.toastT = setTimeout(function () { t.classList.remove('on'); }, 1900);
  }
  function shiftMs() { return Date.now() - BASE_TIME; }
  function fmtEv(d) { return d.getFullYear() + '.' + p2(d.getMonth() + 1) + '.' + p2(d.getDate()) + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds()); }
  var DT_RE = /^(\d{4})[-.](\d{2})[-.](\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/;
  function parseDT(s) { var m = DT_RE.exec(s); return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]) : null; }
  function headerOf(root) { return one(root, '[data-name="Header"]'); }
  /* 고른 층 — 메인에서 층을 누르면 층별 현황으로 넘어가며 이어진다 */
  var FLOORS = ['B3', 'B2', 'B1', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17'];
  function floorCode(f) { return /^B/.test(f) ? f : f + 'F'; }
  function getFloor() { try { var f = sessionStorage.getItem('wemb-bems-floor'); return FLOORS.indexOf(f) >= 0 ? f : '2'; } catch (e) { return '2'; } }
  function setFloorPref(f) { try { sessionStorage.setItem('wemb-bems-floor', f); } catch (e) { } }
  /* 층마다 다르지만 매번 같은 값(씨앗) */
  function seeded(seed) { var s = seed * 9301 + 49297; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

  /* ══════════════════ 1. 화면 맞추기 ══════════════════
     판이 16:9 보다 넓으면 exW, 높으면 exH 가 남는다. 프레임 첫 단 묶음마다 하나의 단위로
     왼/가운데/오른 · 위/가운데/아래에 따라 0 · ½ · 1 만큼 옮긴다. 바탕은 늘어난 판 전체를 칠하고 헤더 띠는 폭을 늘린다. */
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
    var fill = document.createElement('div');
    fill.className = 'be-bgfill';
    var fcs = getComputedStyle(frame);
    fill.style.backgroundImage = fcs.backgroundImage;
    fill.style.backgroundColor = fcs.backgroundColor;
    frame.insertBefore(fill, frame.firstChild);
    st.bgfill = fill;
    var units = [];
    var idx = 0;
    function addUnit(c) {
      var n = nm(c);
      if (c === fill || c.classList.contains('be-toast')) return;
      var els = boxes(c);
      if (!els.length) return;
      var r = unionRect(els, st) || { x: 0, y: 0, w: 0, h: 0 };
      var u = { name: n, el: c, els: els, r: r, i: idx++ };
      if (n === 'Background' || (r.w >= 1900 && r.h >= 1000)) u.kind = 'bg';
      else if (n === 'Header') u.kind = 'header';
      else {
        var cx = r.x + r.w / 2;
        u.ax = r.w >= 1500 ? 0.5 : cx < 560 ? 0 : cx > 1400 ? 1 : 0.5;
        /* 위에 붙은 판(필터 바)은 위에, 키 큰 열 · 3D 는 가운데 */
        u.ay = r.y < 200 && r.h < 300 ? 0 : 0.5;
        u.kind = 'move';
      }
      els.forEach(function (e) { e.classList.add('be-place'); });
      if (u.kind === 'move') els.forEach(function (e) { e.classList.add('be-unit'); e.style.setProperty('--i', u.i); });
      units.push(u);
    }
    kids(frame).forEach(addUnit);
    st.units = units;
    /* 헤더 — 1800 이상 띠는 폭을 늘리고, 그 밖의 조각은 자리(왼 · 가운데 · 오른)에 따라 옮긴다 */
    var hdr = units.filter(function (u) { return u.kind === 'header'; })[0];
    var bars = [], movers = [];
    function hwalk(el) {
      kids(el).forEach(function (c) {
        if (isContents(c)) { hwalk(c); return; }
        var w = c.offsetWidth;
        if (w >= 1800) { bars.push({ el: c, w0: w }); return; }
        var r = rectIn(c, st);
        var cx = r.x + r.w / 2;
        movers.push({ el: c, k: cx < 640 ? 0 : cx > 1300 ? 1 : 0.5 });
      });
    }
    if (hdr) hwalk(hdr.el);
    movers.forEach(function (m) { m.el.classList.add('be-place'); });
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
          });
        } else if (u.kind === 'header') {
          bars.forEach(function (b) { b.el.style.width = (b.w0 + exW) + 'px'; });
          movers.forEach(function (m) { m.el.__fx = exW * m.k; place(m.el); });
        } else {
          u.els.forEach(function (e) { e.__fx = exW * u.ax; e.__fy = exH * u.ay; place(e); });
        }
      });
      (st.onLayout || []).forEach(function (f) { try { f(); } catch (e) { } });
    }
    var rsT = 0;
    function relayout() {
      root.classList.add('be-resizing');
      layoutFn();
      clearTimeout(rsT);
      rsT = setTimeout(function () { root.classList.remove('be-resizing'); }, 140);
    }
    st.onLayout = [];
    layoutFn();
    st.layout = layoutFn;
    if (window.ResizeObserver) { st.ro = new ResizeObserver(relayout); st.ro.observe(root); }
    else { st.onResize = relayout; window.addEventListener('resize', relayout); }
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('be-live'); }); });
  }

  /* ══════════════════ 2. 시계 · 최근 시각 ══════════════════ */
  function installClock(root, st) {
    var dt = one(headerOf(root), '[data-name="Date Time"]');
    if (!dt) return;
    var ps = all(dt, 'p');
    function tick() {
      var d = new Date();
      write(ps[0], String(d.getFullYear()).slice(2) + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()));
      write(ps[1], p2(d.getHours()) + ':' + p2(d.getMinutes()));
    }
    tick();
    st.timers.push(setInterval(tick, 1000));
  }
  /* 이벤트 발생시각 — Figma 기준 시각과의 간격을 그대로 두고 '지금' 쪽으로 옮긴다(열 때마다 최근) */
  function installRecent(root, st) {
    var sh = shiftMs();
    all(root, '[data-name="Event List"] [data-name="Content"] > p').forEach(function (p) {
      var d = parseDT(txt(p));
      if (d) write(p, fmtEv(new Date(d.getTime() + sh)));
    });
  }

  /* ══════════════════ 3. 헤더 — 탭 · 층 선택 · 단추 ══════════════════ */
  function installNav(root, st) {
    var hdr = headerOf(root);
    if (!hdr) return;
    all(hdr, '[data-name^="Nav Item/"]').forEach(function (p) {
      var key = /Main/.test(nm(p)) ? 'main' : /Floor/.test(nm(p)) ? 'floor' : 'overview';
      p.classList.add('be-tab');
      if (key === st.scene) p.classList.add('be-act');
      tip(p, key === 'main' ? '메인 — 건물 전체 전력 · 설비 현황' : key === 'floor' ? '층별 현황 — 고른 층의 급수 · 설비 · 자산' : '개요 — 이 시안에 없는 화면');
      clickable(p, function () {
        if (key === st.scene) return;
        if (key === 'overview') { toast(st, '개요 화면은 이 시안에 없습니다'); return; }
        goto(key);
      });
    });
    /* 층 선택 — 마커가 그 층 아래로 미끄러진다 */
    var list = one(hdr, '[data-name="Floor Selector"] [data-name="List"]');
    var marker = one(hdr, '[data-name="Marker (Active)"]');
    if (!list || !marker) return;
    marker.classList.add('be-marker');
    var items = all(list, 'p');
    var act0 = items.filter(function (p) { return /\(Active\)/.test(nm(p)); })[0] || items[0];
    var cx0 = act0.offsetLeft + act0.offsetWidth / 2;
    act0.classList.add('be-act');
    /* 고른 층 색은 클래스로만(테마를 바꿔도 따라가게) — 다크 #ccc / #6880a4, 라이트는 아래 시트 */
    st.setFloorUI = function (f) {
      var p = items.filter(function (x) { return txt(x) === f; })[0];
      if (!p) return;
      items.forEach(function (x) { x.classList.toggle('be-act', x === p); });
      marker.__ox = (p.offsetLeft + p.offsetWidth / 2) - cx0;
      place(marker);
    };
    items.forEach(function (p) {
      p.classList.add('be-floor');
      var f = txt(p);
      tip(p, floorCode(f) + ' 층별 현황 보기');
      clickable(p, function () {
        setFloorPref(f);
        st.setFloorUI(f);
        if (st.scene !== 'floor') { setTimeout(function () { goto('floor'); }, 260); return; }
        if (st.applyFloor) st.applyFloor(f, true);
      });
    });
    if (st.scene === 'floor') st.setFloorUI(getFloor());
    /* 아이콘 단추 */
    var alert = one(hdr, '[data-name="Icon Button/Alert"]');
    var close = one(hdr, '[data-name="Icon Button/Close"]');
    if (alert) {
      alert.classList.add('be-btn');
      tip(alert, '최근 경보 보기');
      clickable(alert, function () {
        toast(st, st.lastEvent || '새 경보가 없습니다');
        alert.classList.remove('be-blink'); void alert.offsetWidth; alert.classList.add('be-blink');
      });
    }
    if (close) {
      close.classList.add('be-btn');
      tip(close, '경보 알림 끄기 · 켜기');
      clickable(close, function () {
        st.mute = !st.mute;
        close.style.opacity = st.mute ? '.55' : '';
        toast(st, st.mute ? '경보 알림을 껐습니다' : '경보 알림을 켰습니다');
      });
    }
    var logo = one(hdr, '[data-name="Logo"]');
    if (logo) { logo.style.cursor = 'pointer'; tip(logo, '메인으로'); clickable(logo, function () { if (st.scene !== 'main') goto('main'); }); }
  }

  /* ══════════════════ 4. 메인 — 설비 목록 · 지표 ══════════════════ */
  var EQ_FILTER = { 'PDU': 'PDU', 'Metering Unit': 'PDU', 'Aircon': 'Aircon', 'MeterWater': 'Meter Water', 'Leakage': 'Leakage', 'Elevator': 'Elevator', 'Escalator': 'Escalator', 'EVCharger': 'EV Charger', 'SolarPanel': 'Solar Panel' };
  function installMain(root, st) {
    if (st.scene !== 'main') return;
    all(root, '[data-name="Equipment List"] > [data-name^="Item/"]').forEach(function (it) {
      it.classList.add('be-item');
      var lab = txt(one(it, '[data-name="Label"]'));
      tip(it, lab + ' — 층별 현황에서 보기');
      clickable(it, function () {
        try { sessionStorage.setItem('wemb-bems-filter', EQ_FILTER[lab] || 'View All'); } catch (e) { }
        goto('floor');
      });
    });
    /* 경보 수가 가끔 바뀐다 — 늘면 Event Count 오늘 · 이달도 함께 */
    var alerts = all(root, '[data-name="Equipment List"] [data-name="Value/Alert"]');
    var evc = one(root, '[data-name="Widget/Event Count"]');
    var evToday = evc && one(evc, '[data-name="Metric/Today"] [data-name="Value"]');
    var evMonth = evc && one(evc, '[data-name="Metric/This Month"] [data-name="Value"]');
    if (alerts.length) st.timers.push(setInterval(function () {
      if (editing() || idle()) return;
      var p = pick(alerts), n = parseInt(txt(p), 10) || 0;
      var nn = clamp(n + (n === 0 ? 1 : Math.random() < 0.45 ? 1 : -1), 0, 3);
      if (nn === n || !write(p, String(nn))) return;
      flash(p);
      if (nn > n) {
        [evToday, evMonth].forEach(function (q) { if (q && write(q, String((parseInt(txt(q), 10) || 0) + 1))) flash(q); });
        st.lastEvent = txt(one(p.closest('[data-name^="Item/"]'), '[data-name="Label"]')) + ' 경보 발생 · ' + p2(new Date().getHours()) + ':' + p2(new Date().getMinutes());
      }
    }, 9000));
    /* 오른쪽 위젯 Top3 행 — 오버 */
    all(root, '[data-name^="Table/"] > [data-name^="Row/"]').forEach(function (r) { r.classList.add('be-ev'); });
  }

  /* ══════════════════ 5. 차트 — 막대 · 선 · 요약이 실시간처럼 ══════════════════ */
  function vFromH(h) { return 1.5 + h / 294; }
  function hFromV(v) { return clamp((v - 1.5) * 294, 1, 146); }
  function installBars(root, st) {
    var widgets = all(root, '[data-name="Widget/KW"], [data-name="Widget/KWH"]');
    if (!widgets.length) return;
    var total = one(root, '[data-name="Widget/Total Energy"] [data-name="Metric/Today"] [data-name="Value"]');
    var totalM = one(root, '[data-name="Widget/Total Energy"] [data-name="Metric/This Month"] [data-name="Value"]');
    var W = widgets.map(function (w) {
      var bars = all(w, '[data-name="Bars/Real Time"] > [data-name="Bar"]');
      var hs = bars.map(function (b) { return b.offsetHeight; });
      bars.forEach(function (b, i) { b.style.setProperty('--bi', i); b.style.height = '0px'; });
      return {
        w: w, kwh: nm(w) === 'Widget/KWH', bars: bars, hs: hs,
        head: one(w, '[data-name="Header"] > [data-name="Value"]'),
        cur: one(w, '[data-name="Stat/Current"] [data-name="Value"]'),
        avg: one(w, '[data-name="Stat/Avg"] [data-name="Value"]'),
        max: one(w, '[data-name="Stat/Max"] [data-name="Value"]'),
      };
    });
    /* 들어올 때 막대가 자라 오른다 */
    requestAnimationFrame(function () { requestAnimationFrame(function () { W.forEach(function (x) { x.bars.forEach(function (b, i) { b.style.height = x.hs[i] + 'px'; }); }); }); });
    var kwhAcc = null;
    function paint(x) {
      x.bars.forEach(function (b, i) { b.style.height = x.hs[i].toFixed(1) + 'px'; });
      var vs = x.hs.map(vFromH), last = vs[vs.length - 1];
      var avg = vs.reduce(function (a, b) { return a + b; }, 0) / vs.length;
      write(x.cur, last.toFixed(2));
      write(x.avg, avg.toFixed(2));
      var mx = Math.max.apply(null, vs);
      if (x.max && mx > parseFloat(txt(x.max))) write(x.max, mx.toFixed(2));
      if (!x.kwh && x.head) write(x.head, comma(last * 1000));
    }
    st.timers.push(setInterval(function () {
      if (editing() || idle()) return;
      W.forEach(function (x) {
        var n = x.hs.length, h = x.hs[n - 1];
        x.hs[n - 1] = clamp(h + rnd(-4, 4), 20, 140);
        paint(x);
        if (x.kwh && x.head) {
          if (kwhAcc == null) kwhAcc = parseFloat(txt(x.head).replace(/,/g, '')) || 0;
          kwhAcc += vFromH(x.hs[n - 1]) * 1000 * 3 / 3600;
          write(x.head, comma(kwhAcc));
          if (total) write(total, (kwhAcc / 1000).toFixed(1));
        }
      });
    }, 3000));
    /* 새 구간 — 맨 앞 막대가 빠지고 새 값이 뒤에 붙는다(흐르는 시간) */
    st.timers.push(setInterval(function () {
      if (editing() || idle()) return;
      W.forEach(function (x) {
        var n = x.hs.length, prev = x.hs[n - 1];
        x.hs.shift();
        x.hs.push(clamp(prev + rnd(-10, 8), 20, 140));
        paint(x);
      });
      if (totalM && total) { var m = parseFloat(txt(totalM)) || 0; if (write(totalM, (m + 0.1).toFixed(1))) flash(totalM); }
    }, 20000));
  }
  /* 급수 면적 차트(Data 그림) — 같은 SVG 를 글자로 들여와 길을 조금씩 움직인다(색 · 그라디언트는 원본 그대로) */
  function parsePath(d) { var pts = []; d.replace(/([ML])\s*(-?[\d.]+)\s+(-?[\d.]+)/g, function (m, c, x, y) { pts.push([+x, +y]); return m; }); return pts; }
  function lineD(pts) { return 'M' + pts.map(function (p) { return p[0].toFixed(2) + ' ' + p[1].toFixed(2); }).join(' L'); }
  function areaD(pts, base) { return 'M' + pts[0][0].toFixed(2) + ' ' + base + ' L' + pts.map(function (p) { return p[0].toFixed(2) + ' ' + p[1].toFixed(2); }).join(' L') + ' L' + pts[pts.length - 1][0].toFixed(2) + ' ' + base + ' Z'; }
  function installWater(root, st) {
    var host = one(root, '[data-name="Widget/Meter Water"] [data-name="Data"]');
    var img = host && one(host, 'img');
    if (!img || !window.fetch) return;
    var val = one(root, '[data-name="Widget/Meter Water"] [data-name="Measurement"] > p');
    var trend = one(root, '[data-name="Widget/Meter Water"] [data-name="Icon/Trend/Down"]');
    fetch(img.getAttribute('src')).then(function (r) { return r.text(); }).then(function (svgTxt) {
      if (!root.__be) return;
      var uid = 'bew' + Math.random().toString(36).slice(2, 7);
      svgTxt = svgTxt.replace(/id="(paint\d_linear_\w+|clip\w+)"/g, function (m, id) { return 'id="' + uid + id + '"'; })
        .replace(/url\(#(paint\d_linear_\w+|clip\w+)\)/g, function (m, id) { return 'url(#' + uid + id + ')'; });
      var wrap = document.createElement('div');
      wrap.innerHTML = svgTxt;
      var svg = wrap.querySelector('svg');
      if (!svg) return;
      svg.setAttribute('class', (img.getAttribute('class') || '') + ' be-water');
      svg.style.cssText = img.style.cssText;
      svg.style.position = 'absolute'; svg.style.inset = '0'; svg.style.width = '100%'; svg.style.height = '100%';
      img.replaceWith(svg);
      var pAvgA = svg.querySelector('[id="Area/Floor Average"]'), pAvgL = svg.querySelector('[id="Line/Floor Average"]'), pThis = svg.querySelector('[id="Area/This Floor"]');
      if (!pAvgA || !pAvgL || !pThis) return;
      var BASE = 148.5;
      var avg0 = parsePath(pAvgL.getAttribute('d'));
      var this0 = parsePath(pThis.getAttribute('d')).filter(function (p) { return Math.abs(p[1] - BASE) > 0.01; });
      var cur = { avg: avg0.map(function (p) { return p.slice(); }), th: this0.map(function (p) { return p.slice(); }) };
      var animT = null;
      function draw(tgt, ms) {
        var from = { avg: cur.avg.map(function (p) { return p.slice(); }), th: cur.th.map(function (p) { return p.slice(); }) };
        var t0 = performance.now();
        cancelAnimationFrame(animT);
        function step(t) {
          var k = Math.min(1, (t - t0) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
          cur.avg = from.avg.map(function (p, i) { return [p[0], p[1] + (tgt.avg[i][1] - p[1]) * e]; });
          cur.th = from.th.map(function (p, i) { return [p[0], p[1] + (tgt.th[i][1] - p[1]) * e]; });
          pAvgA.setAttribute('d', areaD(cur.avg, BASE));
          pAvgL.setAttribute('d', lineD(cur.avg));
          pThis.setAttribute('d', areaD(cur.th, BASE));
          if (k < 1) animT = requestAnimationFrame(step);
        }
        animT = requestAnimationFrame(step);
      }
      function yOf(v) { return 1.5 + (40 - v) / 40 * 147; }
      function vOf(y) { return 40 - (y - 1.5) / 147 * 40; }
      /* 층을 바꾸면 그 층 값(씨앗)으로 다시 그린다 */
      st.waterFloor = function (f) {
        var r = seeded(FLOORS.indexOf(f) + 3), k = 0.6 + r() * 0.8;
        var tgt = {
          avg: avg0.map(function (p) { return p.slice(); }),
          th: this0.map(function (p) { var v = vOf(p[1]); return [p[0], yOf(clamp(v * k + (r() - .5) * 2, 0.5, 38))]; }),
        };
        draw(tgt, 900);
        setTimeout(updVal, 950);
      };
      function updVal() {
        var last = cur.th[cur.th.length - 1], v = vOf(last[1]);
        var ai = cur.avg.reduce(function (b, p, i) { return Math.abs(p[0] - last[0]) < Math.abs(cur.avg[b][0] - last[0]) ? i : b; }, 0);
        if (write(val, v.toFixed(1))) flash(val);
        if (trend) trend.style.rotate = v > vOf(cur.avg[ai][1]) ? '180deg' : '';
      }
      st.timers.push(setInterval(function () {
        if (editing() || idle()) return;
        var tgt = { avg: cur.avg.map(function (p) { return p.slice(); }), th: cur.th.map(function (p, i) {
          var n = cur.th.length;
          /* 최근 몇 시간만 흔들린다 — 지난 값은 그대로 */
          if (i < n - 4) return p.slice();
          return [p[0], yOf(clamp(vOf(p[1]) + rnd(-1.2, 1.2), 0.5, 38))];
        }) };
        draw(tgt, 700);
        setTimeout(updVal, 720);
      }, 4000));
      if (st.floor && st.floor !== '2') st.waterFloor(st.floor);
    }).catch(function () { });
  }

  /* ══════════════════ 6. 층별 현황 — 필터 · 자산 트리 · 이벤트 목록 ══════════════════ */
  var TREE_PREFIX = { 'PDU': 'PDU', 'Meter Water': 'WM', 'Aircon': 'AHU', 'Leakage': 'LK', 'Elevator': 'EL', 'Escalator': 'ES', 'EV Charger': 'EV', 'EVCharger': 'EV', 'Solar Panel': 'PV', 'SolarPanel': 'PV' };
  var TREE_N = { 'Meter Water': 3, 'Aircon': 4, 'Leakage': 2, 'Elevator': 2, 'Escalator': 2, 'EV Charger': 3, 'EVCharger': 3, 'Solar Panel': 4, 'SolarPanel': 4 };
  function normName(s) { return s.replace(/\s+/g, '').toLowerCase(); }
  function installFloor(root, st) {
    if (st.scene !== 'floor') return;
    st.floor = getFloor();
    /* ── 자산 트리 — 두 무리(PDU 펼침 · 나머지 접힘)를 스크롤 상자 하나로 묶는다 ── */
    var aw = one(root, '[data-name="Widget/Asset List"]');
    var gPdu = one(root, '[data-name="Tree Group/PDU"]'), gRest = one(root, '[data-name="Tree Items"]');
    var tree = null;
    if (aw && gPdu && gRest) {
      var r1 = rectIn(gPdu, st), bodyBg = one(aw, '[data-name="Body Background"]'), rb = bodyBg ? rectIn(bodyBg, st) : { y: 348, h: 481 };
      tree = document.createElement('div');
      tree.className = 'be-tree';
      tree.setAttribute('data-name', 'Tree');
      tree.style.left = r1.x + 'px'; tree.style.top = r1.y + 'px';
      tree.style.width = (r1.w + 2) + 'px'; tree.style.height = (rb.y + rb.h - r1.y - 6) + 'px';
      gPdu.parentNode.insertBefore(tree, gPdu);
      tree.appendChild(gPdu); tree.appendChild(gRest);
      gRest.style.marginTop = '4px';
      /* 화면 맞추기가 두 무리에 준 자리 이동은 이제 트리 상자가 받는다(안에서 또 밀리면 잘린다) */
      tree.classList.add('be-place', 'be-unit');
      tree.__fx = gPdu.__fx || 0; tree.__fy = gPdu.__fy || 0; place(tree);
      [gPdu, gRest].forEach(function (g) { g.__fx = 0; g.__fy = 0; g.classList.remove('be-place', 'be-unit'); place(g); });
      (st.units || []).forEach(function (u) { if (u.el === aw) u.els = u.els.filter(function (e) { return e !== gPdu && e !== gRest; }).concat([tree]); });
      var pduHead = one(gPdu, '[data-name^="Tree Item/PDU"]'), pduList = one(gPdu, '[data-name="List"]');
      var leafTpl = all(pduList, '[data-name^="Item/"]').filter(function (x) { return !/\((Active|Hover)\)/.test(nm(x)); })[0];
      var selTpl = all(pduList, '[data-name^="Item/"]').filter(function (x) { return /\(Active\)/.test(nm(x)); })[0];
      var bulletOn = selTpl && one(selTpl, 'img') ? one(selTpl, 'img').getAttribute('src') : null;
      var bulletOff = leafTpl && one(leafTpl, 'img') ? one(leafTpl, 'img').getAttribute('src') : null;
      function selectLeaf(leaf) {
        all(tree, '.be-leaf').forEach(function (l) {
          var on = l === leaf;
          l.classList.toggle('be-lsel', on);
          l.classList.toggle('be-lunsel', !on);
          var im = one(l, 'img'); if (im && bulletOn && bulletOff) im.setAttribute('src', on ? bulletOn : bulletOff);
        });
        st.lastEvent = txt(leaf) + ' 선택 · 3D 층 평면에서 위치 확인';
      }
      function wireLeaf(l) {
        l.classList.add('be-leaf');
        tip(l, txt(l) + ' — 선택');
        clickable(l, function () { selectLeaf(l); toast(st, txt(l) + ' 선택'); });
        l.addEventListener('pointerenter', function () { all(tree, '.be-leaf').forEach(function (x) { x.classList.add('be-lclr'); }); });
      }
      all(pduList, '[data-name^="Item/"]').forEach(wireLeaf);
      /* 펼치기 · 접기 — 높이를 재어 부드럽게 */
      function setOpen(head, sub, open, quick) {
        head.classList.toggle('be-open', open);
        if (quick) { sub.style.height = open ? 'auto' : '0px'; sub.style.opacity = open ? '1' : '0'; return; }
        var h = sub.scrollHeight;
        sub.style.height = open ? '0px' : h + 'px';
        void sub.offsetHeight;
        sub.style.height = open ? h + 'px' : '0px';
        sub.style.opacity = open ? '1' : '0';
        clearTimeout(sub.__t);
        if (open) sub.__t = setTimeout(function () { sub.style.height = 'auto'; }, 400);
      }
      if (pduHead && pduList) {
        pduHead.classList.add('be-tnode', 'be-pdu', 'be-open');
        pduList.classList.add('be-sub');
        tip(pduHead, 'PDU 자산 펼치기 · 접기');
        clickable(pduHead, function () { setOpen(pduHead, pduList, !pduHead.classList.contains('be-open')); });
      }
      var groups = {};
      if (pduHead) groups[normName('PDU')] = { head: pduHead, sub: pduList };
      kids(gRest).forEach(function (head) {
        var name = txt(one(head, 'p'));
        head.classList.add('be-tnode');
        var sub = document.createElement('div');
        sub.className = 'be-sub';
        sub.setAttribute('data-name', 'List');
        sub.style.display = 'flex'; sub.style.flexDirection = 'column'; sub.style.gap = '1px'; sub.style.height = '0px'; sub.style.opacity = '0';
        var n = TREE_N[name] || 2, pre = TREE_PREFIX[name] || name.slice(0, 2).toUpperCase();
        for (var i = 1; i <= n && leafTpl; i++) {
          var c = leafTpl.cloneNode(true);
          c.removeAttribute('id');
          all(c, '[id]').forEach(function (x) { x.removeAttribute('id'); });
          c.setAttribute('data-name', 'Item/' + pre + '-' + p2(i));
          var lp = one(c, 'p');
          if (lp) { lp.textContent = pre + '-' + floorCode(st.floor) + '-' + p2(i); lp.setAttribute('data-be-asset', pre + '|' + p2(i)); }
          sub.appendChild(c);
          wireLeaf(c);
        }
        head.parentNode.insertBefore(sub, head.nextSibling);
        groups[normName(name)] = { head: head, sub: sub };
        tip(head, name + ' 자산 펼치기 · 접기');
        clickable(head, function () { setOpen(head, sub, !head.classList.contains('be-open')); });
      });
      all(pduList, 'p').forEach(function (p) { var m = /^(\w+)-[\w]+-(\d+)$/.exec(txt(p)); if (m) p.setAttribute('data-be-asset', m[1] + '|' + m[2]); });
      st.openGroup = function (name) {
        var g = groups[normName(name)];
        if (!g) return;
        if (!g.head.classList.contains('be-open')) setOpen(g.head, g.sub, true);
        setTimeout(function () { tree.scrollTo({ top: Math.max(0, g.head.offsetTop - 4), behavior: 'smooth' }); }, 60);
        g.head.classList.remove('be-blink'); void g.head.offsetWidth; g.head.classList.add('be-blink');
      };
      /* 판 접기(») — 판이 오른쪽 끝으로 밀려 들어가고 단추만 남는다 */
      var foldBtn = one(aw, '[data-name="Icon Button/Collapse"]');
      if (foldBtn) {
        foldBtn.classList.add('be-foldbtn', 'be-btn');
        boxes(aw).forEach(function (b) { if (b !== foldBtn) b.classList.add('be-slide'); });
        tree.classList.add('be-slide');
        var fold = load(K_FOLD);
        var holder = st.frame;
        if (fold.asset) holder.classList.add('be-folded');
        tip(foldBtn, '자산 목록 접기 · 펼치기');
        clickable(foldBtn, function () {
          var on = !holder.classList.contains('be-folded');
          holder.classList.toggle('be-folded', on);
          var f2 = load(K_FOLD); f2.asset = on; save(K_FOLD, f2);
        });
      }
      /* 검색칸 — 누르면 그 자리에서 거르기 */
      var search = one(aw, '[data-name="Input/Search"]');
      if (search) {
        var ph = one(search, '[data-name="Placeholder"]');
        search.style.cursor = 'text';
        tip(search, '자산 이름으로 거르기(예: PDU-2F-03)');
        clickable(search, function () {
          var q = window.prompt('자산 이름 검색', '');
          if (q == null) return;
          q = q.trim().toLowerCase();
          var hit = null;
          all(tree, '.be-leaf').forEach(function (l) { var ok = !q || txt(l).toLowerCase().indexOf(q) >= 0; l.style.display = ok ? '' : 'none'; if (ok && q && !hit) hit = l; });
          if (ph) write(ph, q || 'search');
          if (hit) { var g = hit.closest('.be-sub'); var head = g && g.previousElementSibling; if (head && !head.classList.contains('be-open')) setOpen(head, g, true); selectLeaf(hit); }
        });
      }
    }
    /* ── 필터 바 — 고른 설비가 켜지고 트리에서 그 무리가 펼쳐진다 ── */
    var fbar = one(root, '[data-name="Filter Bar"]');
    if (fbar) {
      var fs = kids(fbar);
      var actEl = fs.filter(function (f) { return /\(Active\)/.test(nm(f)); })[0];
      var normEl = fs.filter(function (f) { return f !== actEl; })[0];
      var refOn = null, refOff = null;
      if (actEl && normEl) {
        refOn = one(actEl, '[data-name="Badge"]').cloneNode(false); refOn.classList.add('be-refbox');
        refOff = one(normEl, '[data-name="Badge"]').cloneNode(false); refOff.classList.add('be-refbox');
        [refOn, refOff].forEach(function (r) { r.removeAttribute('id'); fbar.appendChild(r); });
      }
      var chosen = actEl;
      function paintFilters() {
        if (!refOn) return;
        var on = getComputedStyle(refOn), off = getComputedStyle(refOff);
        fs.forEach(function (f) {
          var b = one(f, '[data-name="Badge"]');
          f.classList.toggle('be-fact', f === chosen);
          if (f === chosen && f !== actEl) { b.style.backgroundImage = on.backgroundImage; b.style.backgroundColor = on.backgroundColor; }
          else if (f !== chosen && f === actEl) { b.style.backgroundImage = 'none'; b.style.backgroundColor = off.backgroundColor; }
          else { b.style.backgroundImage = ''; b.style.backgroundColor = ''; }
        });
      }
      st.paintFilters = paintFilters;
      fs.forEach(function (f) {
        f.classList.add('be-filter');
        var name = nm(f).replace(/^Filter\//, '').replace(/\s*\(Active\)$/, '');
        tip(f, name === 'View All' ? '전체 설비 보기' : name + ' 만 보기');
        clickable(f, function () {
          chosen = f; paintFilters();
          if (st.openGroup && name !== 'View All') st.openGroup(name);
          toast(st, (name === 'View All' ? '전체 설비' : name) + ' · ' + floorCode(st.floor));
        });
      });
      var want = null;
      try { want = sessionStorage.getItem('wemb-bems-filter'); sessionStorage.removeItem('wemb-bems-filter'); } catch (e) { }
      if (want) {
        var hitF = fs.filter(function (f) { return nm(f).replace(/^Filter\//, '').replace(/\s*\(Active\)$/, '') === want; })[0];
        if (hitF) { chosen = hitF; setTimeout(function () { paintFilters(); if (st.openGroup && want !== 'View All') st.openGroup(want); }, 400); }
      }
    }
    /* ── 상태 카드 · 이벤트 목록 ── */
    all(root, '[data-name^="Status Card/"]').forEach(function (c) {
      c.classList.add('be-card');
      tip(c, txt(one(c, '[data-name="Label"]')) + ' — 경보 / 전체');
      clickable(c, function () { if (st.openGroup) st.openGroup('Aircon'); });
    });
    installEventList(root, st);
    /* 층 바꾸기 — 글자(층 이름 · 자산 이름)와 차트를 그 층으로 */
    st.applyFloor = function (f, anim) {
      var prev = st.floor;
      st.floor = f;
      var code = floorCode(f);
      all(root, '[data-name="Meta"] [data-name="Floor"]').forEach(function (p) { write(p, code); });
      all(root, '[data-be-asset]').forEach(function (p) { var a = p.getAttribute('data-be-asset').split('|'); write(p, a[0] + '-' + code + '-' + a[1]); });
      /* 상태 카드 — 층마다 다른 수(씨앗) */
      var r = seeded(FLOORS.indexOf(f) + 11);
      all(root, '[data-name^="Status Card/"] [data-name="Values"]').forEach(function (v, i) {
        var ps = all(v, 'p');
        if (ps.length < 3) return;
        if (f === '2' && !anim) return;
        var tot = 8 + Math.round(r() * 24), al = i === 0 ? Math.round(r() * 2) : (r() < 0.15 ? 1 : 0);
        if (write(ps[2], String(tot))) flash(ps[2]);
        write(ps[0], String(al));
      });
      if (st.waterFloor && (anim || f !== '2')) st.waterFloor(f);
      if (anim && prev !== f) toast(st, code + ' 층별 현황');
    };
    if (st.floor !== '2') st.applyFloor(st.floor, false);
  }
  /* 이벤트 목록 — 접기 단추 · 스크롤 · 새 이벤트 유입 */
  var EV_POOL = [
    ['WA', 'FCU', '필터 차압 높음'], ['CR', 'AHU', '급기팬 과부하'], ['WA', 'PDU', '부하율 85% 초과'], ['WA', 'LK', '누수 센서 감지'],
    ['CR', 'EL', '운행 중 정지'], ['WA', 'WM', '급수량 급증'], ['WA', 'AHU', '환기 온도 편차'], ['CR', 'PDU', '차단기 트립'],
  ];
  function installEventList(root, st) {
    var list = one(root, '[data-name="Event List"]');
    if (!list) return;
    var card = list.closest('[data-name="Widget/Key Equipment Status"]');
    var items = kids(list);
    items.forEach(function (it) { it.classList.add('be-ev'); clickable(it, function () { toast(st, txt(it).replace(/\s+/g, ' ')); }); });
    list.classList.add('be-evlist');
    var tplCR = items.filter(function (x) { return /\/CR$/.test(nm(x)); })[0];
    var tplWA = items.filter(function (x) { return /\/WA$/.test(nm(x)); })[0];
    if (items[0]) st.lastEvent = txt(one(items[0], '[data-name="Meta"]')).replace(/\s+/g, ' ');
    function mkEvent(g, eq, msg, when, prepend) {
      var tpl = g === 'CR' ? tplCR : tplWA;
      if (!tpl) return null;
      var c = tpl.cloneNode(true);
      c.removeAttribute('id'); all(c, '[id]').forEach(function (x) { x.removeAttribute('id'); });
      var ps = all(c, 'p');
      var ts = one(c, '[data-name="Content"] > p');
      var id = one(c, '[data-name="Equipment ID"]'), fl = one(c, '[data-name="Floor"]'), ms = one(c, '[data-name="Message"]');
      var code = floorCode(st.floor || '2');
      var num = eq + '_' + (st.floor || '2').replace(/^B/, '0') + p2(1 + ((Math.random() * 12) | 0));
      if (ts) ts.textContent = fmtEv(when);
      if (id) id.textContent = num;
      if (fl) fl.textContent = code;
      if (ms) ms.textContent = num + ' ' + msg;
      ps.forEach(function (p) { p.__beLast = p.textContent; });
      c.classList.add('be-ev');
      clickable(c, function () { toast(st, txt(c).replace(/\s+/g, ' ')); });
      if (prepend) { list.insertBefore(c, list.firstChild); c.classList.add('be-rowin'); }
      else list.appendChild(c);
      return c;
    }
    /* 지난 이벤트(스크롤로 본다) — 원본 두 줄 아래로 */
    var lastT = parseDT(txt(one(items[items.length - 1], '[data-name="Content"] > p'))) || new Date();
    for (var i = 0; i < 4; i++) {
      var e = EV_POOL[(i * 3 + 2) % EV_POOL.length];
      lastT = new Date(lastT.getTime() - (35 + i * 22) * 60000);
      mkEvent(e[0], e[1], e[2], lastT, false);
    }
    /* 접기 단추 — 범례 줄 끝(오늘 이벤트 옆) */
    var legendItems = card && one(card, '[data-name="Legend"] > [data-name="Items"]');
    var bg = card && one(card, '[data-name="Card"] > [data-name="Background"]');
    var chev = one(root, '[data-name="Icon/Action/Chevron Down"] img');
    if (legendItems) {
      var tb = document.createElement('div');
      tb.className = 'be-evtoggle';
      tb.setAttribute('data-name', 'Fold Button');
      tb.innerHTML = chev ? '<img alt="" src="' + chev.getAttribute('src') + '">' : '';
      legendItems.style.gap = '12px';
      legendItems.appendChild(tb);
      var h0 = bg ? bg.offsetHeight : 0, lh = list.offsetHeight;
      if (bg) bg.classList.add('be-cardbg');
      function setFold(on, quick) {
        card.classList.toggle('be-evfold', on);
        if (bg) { if (quick) bg.style.transition = 'none'; bg.style.height = on ? (h0 - lh - 6) + 'px' : h0 + 'px'; if (quick) { void bg.offsetHeight; bg.style.transition = ''; } }
      }
      tip(tb, '이벤트 목록 접기 · 펼치기');
      var f0 = load(K_FOLD);
      if (f0.events) setFold(true, true);
      tb.addEventListener('click', function (e) {
        if (editing()) return;
        e.stopPropagation();
        var on = !card.classList.contains('be-evfold');
        setFold(on);
        var f2 = load(K_FOLD); f2.events = on; save(K_FOLD, f2);
      });
    }
    /* 새 이벤트 — 가끔 맨 위로 흘러 들어온다 */
    st.timers.push(setInterval(function () {
      if (editing() || idle() || st.mute) return;
      var e = pick(EV_POOL);
      var c = mkEvent(e[0], e[1], e[2], new Date(), true);
      if (!c) return;
      list.scrollTo({ top: 0, behavior: 'smooth' });
      st.lastEvent = e[0] + ' · ' + txt(one(c, '[data-name="Meta"]')).replace(/\s+/g, ' ');
      while (list.children.length > 12) list.removeChild(list.lastChild);
      if (e[0] === 'CR' || e[1] === 'AHU') {
        var v = one(root, '[data-name^="Status Card/"] [data-name="Values"] p');
        if (v && write(v, String((parseInt(txt(v), 10) || 0) + 1))) flash(v);
      }
    }, 28000));
  }
  /* 테마 — 바깥 뿌리 data-theme 이 바뀌면 바탕 · 필터 칠을 다시 */
  function installTheme(root, st) {
    var sync = function () {
      if (st.bgfill && st.frame) { var cs = getComputedStyle(st.frame); st.bgfill.style.backgroundImage = cs.backgroundImage; st.bgfill.style.backgroundColor = cs.backgroundColor; }
      if (st.paintFilters) setTimeout(st.paintFilters, 0);
    };
    sync();
    if (window.MutationObserver) { st.mo = new MutationObserver(sync); st.mo.observe(root, { attributes: true, attributeFilter: ['data-theme'] }); }
  }
  /* 툴팁 — 잠시 올리면 이 단추가 하는 일 */
  function installTips(root, st) {
    var el = document.createElement('div');
    el.className = 'be-tip';
    st.frame.appendChild(el);
    st.tipEl = el;
    var cur = null, t = 0;
    st.onTipOver = function (e) {
      var h = e.target.closest && e.target.closest('[data-be-tip]');
      if (h === cur) return;
      cur = h; clearTimeout(t); el.classList.remove('on');
      if (!h || editing()) return;
      t = setTimeout(function () {
        if (!cur || editing()) return;
        el.textContent = cur.getAttribute('data-be-tip');
        var r = rectIn(cur, st), w = el.offsetWidth;
        var x = clamp(r.x + r.w / 2 - w / 2, 8 + (st.frame.__fx || 0), BASE_W + (st.exW || 0) - w - 8);
        var y = r.y + r.h + 10 + (cur.__fy || 0);
        if (y + 40 > BASE_H + (st.exH || 0)) y = r.y - 40;
        el.style.left = (x + (cur.__fx || 0)) + 'px'; el.style.top = y + 'px';
        el.classList.add('on');
      }, 380);
    };
    st.onTipOut = function () { cur = null; clearTimeout(t); el.classList.remove('on'); };
    root.addEventListener('pointerover', st.onTipOver);
    root.addEventListener('pointerleave', st.onTipOut);
    root.addEventListener('pointerdown', st.onTipOut);
  }

  /* ══════════════════ 7. 차트 바꾸기(패널편집) ══════════════════ */
  /*@MAKECHART*/
  var chartUid = 0;
  var CC = { bl: '#568dff', cy: '#4affff', gn: '#34d28d', or: '#ff9f43', re: '#f43031', vi: '#9ba9ff', ye: '#f5c542', gr: '#8b8b8c' };
  function specsFor(scene) {
    var S = {};
    if (scene === 'main') {
      S['Widget/KW'] = [
        { k: 'line', t: '실시간 전력 수요 · 어제 대비', unit: 'kW', dec: 0, series: [['실시간', CC.cy, 1800, 30], ['어제', CC.vi, 1860, 22]], lo: 1500, hi: 2000 },
        { k: 'gauge', t: '계약전력(2,000kW) 대비 피크', unit: '%', v: [98, 0.6], max: 100, c: CC.cy },
        { k: 'hbar', t: '층군별 전력 사용', unit: 'kW', cats: ['B3~B1 기계실', '1~5F 실험동', '6~11F 연구실', '12~17F 사무', '옥상 냉동기'], vals: [412, 538, 366, 214, 270], max: 600, c: CC.cy },
      ];
      S['Widget/KWH'] = [
        { k: 'bar', t: '일별 전력량(12월)', unit: 'MWh', cats: ['1', '2', '3', '4', '5', '6', '7', '8', '9'], vals: [41.8, 42.3, 41.5, 42.9, 38.4, 38.1, 42.2, 42.0, 34.6], max: 50, c: CC.bl },
        { k: 'donut', t: '용도별 전력량', parts: [['공조', CC.cy, 38], ['실험장비', CC.vi, 27], ['조명', CC.ye, 14], ['동력', CC.bl, 13], ['기타', CC.gr, 8]] },
        { k: 'area', t: '시간대별 전력량', unit: 'kWh', dec: 0, series: [['오늘', CC.cy, 1760, 26]], lo: 1400, hi: 2100 },
      ];
      S['Widget/Total Energy'] = [
        { k: 'gauge', t: '일 목표 대비 사용', unit: '%', v: [82, 0.4], max: 100, c: CC.cy },
        { k: 'donut', t: '수전 · 태양광', parts: [['수전', CC.bl, 93], ['태양광', CC.ye, 7]] },
      ];
      S['Widget/Event Count'] = [
        { k: 'bar', t: '일별 이벤트', unit: '건', cats: ['5', '6', '7', '8', '9'], vals: [6, 4, 9, 7, 7], max: 12, c: CC.bl },
        { k: 'donut', t: '등급별 이벤트', parts: [['CR', CC.re, 2], ['WA', CC.cy, 5]] },
      ];
    } else {
      S['Widget/Meter Water'] = [
        { k: 'area', t: '급수 사용량 · 층 평균', unit: 'm³', dec: 1, series: [['이 층', CC.cy, 18, 2.5], ['층 평균', CC.vi, 14, 1.5]], lo: 0, hi: 40 },
        { k: 'bar', t: '층별 오늘 급수량', unit: 'm³', cats: ['B1', '1F', '2F', '3F', '5F', '8F', '12F', '17F'], vals: [42, 188, 236, 174, 152, 131, 96, 64], max: 260, c: CC.cy },
        { k: 'gauge', t: '일 급수 목표 대비', unit: '%', v: [71, 0.8], max: 100, c: CC.cy },
      ];
      S['Widget/Key Equipment Status'] = [
        { k: 'hbar', t: '설비별 경보 / 전체', unit: '대', cats: ['AHU', 'FCU', 'VAV', 'EHP'], vals: [24, 18, 12, 22], max: 30, c: CC.bl },
        { k: 'donut', t: '오늘 이벤트 등급', parts: [['CR', CC.re, 1], ['WA', CC.cy, 1], ['정상', CC.gn, 74]] },
        { k: 'line', t: '시간대별 이벤트', unit: '건', dec: 0, series: [['WA', CC.cy, 2, 1], ['CR', CC.re, 0.6, 0.5]], lo: 0, hi: 6 },
      ];
    }
    return S;
  }
  var KEEP = /^(Background|Header|Title Plate|Icon\/Widget\/.*)$/;
  function installChartSwap(root, st) {
    var savedAll = load(K_CHART), saved = savedAll[st.scene] || {};
    st.charts = {}; st.chartApply = {};
    var probe = document.createElement('i');
    probe.className = 'be-probe';
    st.frame.appendChild(probe);
    var spec = specsFor(st.scene);
    Object.keys(spec).forEach(function (name) {
      var w = one(root, '[data-name="' + name + '"]');
      if (!w || isContents(w)) return;
      var r = rectIn(w, st);
      if (!r || r.w < 120 || r.h < 60) return;
      var top = /^Widget\/(KW|KWH|Meter Water|Key Equipment Status)$/.test(name) ? 62 : name === 'Widget/Total Energy' ? 46 : 34;
      var host = document.createElement('div');
      host.className = 'be-chost';
      host.style.display = 'none';
      var hw = Math.max(100, r.w - 16), hh = Math.max(50, r.h - top - 10);
      host.style.width = hw + 'px'; host.style.height = hh + 'px';
      host.style.left = '8px'; host.style.top = top + 'px';
      w.appendChild(host);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'be-chartbtn';
      btn.innerHTML = KIND_ICON.bar.replace('class="ic"', 'class="ic" style="width:13px;height:11px"') + '차트';
      btn.title = '이 패널의 차트 바꾸기';
      var menu = document.createElement('div');
      menu.className = 'be-chartmenu';
      /* 왼쪽 작은 판(193px)은 제목 줄이 좁아 단추가 글자를 덮었다 → 판 바로 위에 띄운다 */
      var small = name === 'Widget/Total Energy' || name === 'Widget/Event Count';
      var bx = r.w - 74, by = small ? -24 : 20;
      btn.style.left = bx + 'px'; btn.style.top = by + 'px';
      menu.style.left = Math.max(0, bx - 190) + 'px'; menu.style.top = (by + 26) + 'px';
      w.appendChild(btn); w.appendChild(menu);
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
      /* 숨기는 것 — 바탕 · 제목 · 아이콘은 남기고 내용만(카드 묶음은 안으로 들어가 고른다) */
      function hideOrig(on) {
        (function walk(el) {
          kids(el).forEach(function (c) {
            if (c === host || c === btn || c === menu) return;
            var n = nm(c);
            if (KEEP.test(n)) return;
            if (n === 'Card' || n === 'Header') { walk(c); return; }
            c.classList.toggle('be-hid', on);
          });
        })(w);
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
        all(root, '.be-chartmenu.open').forEach(function (m) { if (m !== menu) m.classList.remove('open'); });
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
    });
    syncChartHue(root, probe);
    st.timers.push(setInterval(function () { syncChartHue(root, probe); }, 1200));
    st.onDocDown = function (e) {
      if (e.target.closest && e.target.closest('.be-chartmenu, .be-chartbtn')) return;
      all(root, '.be-chartmenu.open').forEach(function (m) { m.classList.remove('open'); });
    };
    document.addEventListener('pointerdown', st.onDocDown, true);
  }

  /* ══════════════════ 8. 패널 옮기기(패널편집) ══════════════════ */
  function installPanelMove(root, st) {
    var L = load(K_LAYOUT), me = L[st.scene] = L[st.scene] || {};
    me.free = me.free || {};
    function persist() { var a = load(K_LAYOUT); a[st.scene] = me; save(K_LAYOUT, a); }
    /* 위젯 하나하나가 패널 — 열(Column) 안에 있어도 따로 옮긴다. 3D · 필터 바 · 자산 목록도 */
    var units = [];
    all(root, '[data-name^="Widget/"], [data-name="Equipment List"], [data-name="Filter Bar"], [data-name^="View/3D"]').forEach(function (w, i) {
      var els = boxes(w);
      units.push({ name: nm(w) + '#' + i, els: els });
    });
    units.forEach(function (x) {
      x.els.forEach(function (e) { e.classList.add('be-mv'); e.__unit = x; });
      var s = me.free[x.name];
      if (s) x.els.forEach(function (e) { e.__ux = s[0]; e.__uy = s[1]; place(e); e.classList.add('be-front'); });
    });
    var drag = null;
    st.onDown = function (e) {
      if (!layoutEditing(root) || e.button !== 0) return;
      if (e.target.closest('.be-chartbtn, .be-chartmenu, .be-resetbtn')) return;
      if (e.target.closest('[contenteditable="true"]') && e.target.closest('p')) return;
      var w = e.target.closest('.be-mv');
      if (!w || !root.contains(w) || !w.__unit) return;
      e.preventDefault(); e.stopPropagation();
      drag = { u: w.__unit, sx: e.clientX, sy: e.clientY, moved: false };
    };
    st.onMove = function (e) {
      if (!drag) return;
      var S = (st.frame.getBoundingClientRect().width / st.frame.offsetWidth) || st.S || 1;
      var dx = (e.clientX - drag.sx) / S, dy = (e.clientY - drag.sy) / S;
      if (!drag.moved) { if (Math.hypot(dx, dy) < 3) return; drag.moved = true; drag.u.els.forEach(function (x) { x.classList.add('be-dragging'); }); }
      drag.u.els.forEach(function (x) { x.__dx = dx; x.__dy = dy; place(x); });
    };
    st.onUp = function () {
      if (!drag) return;
      var d = drag; drag = null;
      d.u.els.forEach(function (x) { x.classList.remove('be-dragging'); });
      if (!d.moved) return;
      var snap = function (v) { return Math.round(v / 4) * 4; };
      var e0 = d.u.els[0];
      var ux = snap((e0.__ux || 0) + (e0.__dx || 0)), uy = snap((e0.__uy || 0) + (e0.__dy || 0));
      all(root, '.be-front').forEach(function (x) { x.classList.remove('be-front'); });
      d.u.els.forEach(function (x) { x.__ux = ux; x.__uy = uy; x.__dx = 0; x.__dy = 0; place(x); x.classList.toggle('be-front', !!(ux || uy)); });
      me.free[d.u.name] = [ux, uy];
      persist();
    };
    root.addEventListener('pointerdown', st.onDown, true);
    window.addEventListener('pointermove', st.onMove);
    window.addEventListener('pointerup', st.onUp);
    window.addEventListener('pointercancel', st.onUp);
    st.onDragStart = function (e) { if (layoutEditing(root) && e.target.closest && e.target.closest('.be-mv')) e.preventDefault(); };
    root.addEventListener('dragstart', st.onDragStart);
    st.resetLayout = function () {
      me = { free: {} };
      var a = load(K_LAYOUT); a[st.scene] = me; save(K_LAYOUT, a);
      units.forEach(function (x) { x.els.forEach(function (e) { e.__ux = 0; e.__uy = 0; place(e); e.classList.remove('be-front'); }); });
      Object.keys(st.chartApply || {}).forEach(function (k) { st.chartApply[k](-1); });
    };
    var rb = document.createElement('button');
    rb.type = 'button';
    rb.className = 'be-resetbtn';
    rb.textContent = '배치 초기화';
    rb.title = '패널 자리 · 바꾼 차트를 원본으로';
    st.frame.appendChild(rb);
    rb.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    rb.addEventListener('pointerup', function (e) { e.stopPropagation(); e.preventDefault(); st.resetLayout(); });
    st.onReset = function (e) { if (e.target.closest && e.target.closest('#layoutReset')) st.resetLayout(); };
    document.addEventListener('click', st.onReset, true);
  }

  /* ══════════════════ 살리기 ══════════════════ */
  function sceneOf(root) { return /\bbef-root\b/.test(root.className) ? 'floor' : 'main'; }
  function start(root, st) {
    var steps = [['fit', installFit], ['clock', installClock], ['recent', installRecent], ['nav', installNav], ['main', installMain],
      ['bars', installBars], ['floor', installFloor], ['water', installWater], ['theme', installTheme], ['swap', installChartSwap], ['move', installPanelMove], ['tips', installTips]];
    steps.forEach(function (s) { try { s[1](root, st); } catch (e) { console.warn('[bems] ' + s[0], e); } });
    root.classList.add('be-enter');
    st.timers.push(setTimeout(function () { root.classList.remove('be-enter'); }, 1800));
  }
  function initBems(root) {
    if (!root || root.__be) return;
    injectStyle();
    root.classList.add('be-root');
    var st = root.__be = { timers: [], scene: sceneOf(root), onLayout: [] };
    if (/[?&]edit=1/.test(location.search)) root.classList.add('be-edit-layout');
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
  function disposeBems(root) {
    var st = root && root.__be;
    if (!st) return;
    if (st.wait) st.wait.disconnect();
    st.timers.forEach(function (t) { clearInterval(t); clearTimeout(t); });
    clearTimeout(st.toastT);
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
    if (st.onTipOver) { root.removeEventListener('pointerover', st.onTipOver); root.removeEventListener('pointerleave', st.onTipOut); root.removeEventListener('pointerdown', st.onTipOut); }
    root.__be = null;
  }
  window.initBems = initBems;
  window.disposeBems = disposeBems;
})();
