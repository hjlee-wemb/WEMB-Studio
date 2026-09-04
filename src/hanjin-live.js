/* 한진 SMART 통합관제 — 재구축 화면 3장의 인터랙션·라이브 데이터 레이어
   대상: src/hanjin-control.js(hjc) · hanjin-gate.js(hjg) · hanjin-unload.js(hju)

   이 파일은 '형상'을 만들지 않는다. 형상·좌표·색은 전부 conv.js 가 뽑은 Figma 원본 그대로이고,
   여기서는 그 위에 다음만 얹는다.
     ① 반응형   — 1920x1080 기준을 유지한 채 캔버스를 넓혀 여백 없이 꽉 채운다(통짜 축소 아님).
     ② 실시간 시계
     ③ 마우스 오버 / 눌림 / 선택 상태
     ④ 이벤트 현황 Fold 버튼(자연스러운 펼침·접힘)
     ⑤ 차트·수치의 실시간 연동 연출(게이지·막대·도넛·단계별 현황·이벤트 카운트)
   전부 CSS transition/rAF 로만 움직이므로 텍스트 편집(패널편집)·테마 전환과 충돌하지 않는다.

   window.initHanjin(root)  — 화면 하나를 살린다(여러 번 불러도 안전)
   window.disposeHanjin(root) — 타이머·리스너 정리 */
(function () {
  'use strict';

  /* ══════════════════ 0. 공통 스타일 ══════════════════
     주의: 화면 CSS 의 리셋이 `.hjX-root *`(특이도 0,1,0)라 여기서는 최소 0,2,0 이상으로 건다. */
  var STYLE_ID = 'hanjin-live-style';
  var CSS = [
    /* 호버 틴트 — 레이아웃·자식에 영향을 주지 않도록 ::before 오버레이로만 칠한다
       (conv.js 는 ::after 만 쓰므로 ::before 는 비어 있다) */
    '.hj-root .hj-hot{cursor:pointer;}',
    '.hj-root .hj-hot::before{content:"";position:absolute;inset:0;border-radius:inherit;',
    'background:#ffffff;opacity:0;pointer-events:none;transition:opacity .18s ease;z-index:2;}',
    '.hj-root .hj-hot:hover::before{opacity:.10;}',
    '.hj-root .hj-hot:active::before{opacity:.17;transition-duration:.06s;}',
    '.hj-root[data-theme="light"] .hj-hot::before{background:#1b2a4a;}',
    '.hj-root[data-theme="light"] .hj-hot:hover::before{opacity:.075;}',
    '.hj-root[data-theme="light"] .hj-hot:active::before{opacity:.13;}',
    /* 표의 행은 살짝만 — 글자가 많아 강한 틴트는 읽기를 방해한다 */
    '.hj-root .hj-hot.hj-row:hover::before{opacity:.055;}',
    '.hj-root[data-theme="light"] .hj-hot.hj-row:hover::before{opacity:.045;}',
    /* 선택 가능한 묶음은 상태가 바뀔 때 색·테두리가 부드럽게 넘어가도록 */
    '.hj-root .hj-swap{transition:background-color .22s ease,border-color .22s ease,color .22s ease,box-shadow .22s ease;}',
    '.hj-root .hj-swap p{transition:color .22s ease;}',
    /* 이벤트 현황 패널 펼침/접힘 —
       원본은 패널(1840x330)이 bottom:-269px 로 내려가 머리글만 보이는 '접힌' 상태다.
       펼치면 단계별 차량현황 위로 올라오므로, 서랍처럼 읽히도록 그때만 위로 올리고 뒤를 흐린다
       (접힌 상태의 그림은 Figma 원본 그대로 두기 위해 .hj-open 에만 건다). */
    '.hj-root .hj-eventlog{transition:transform .42s cubic-bezier(.22,.9,.24,1);will-change:transform;}',
    '.hj-root .hj-eventlog.hj-open{transform:translate(-50%,-269px);z-index:40;'
    + '-webkit-backdrop-filter:blur(14px) saturate(1.1);backdrop-filter:blur(14px) saturate(1.1);'
    + 'box-shadow:0 -18px 40px rgba(0,0,0,.45);}',
    '.hj-root[data-theme="light"] .hj-eventlog.hj-open{box-shadow:0 -18px 40px rgba(30,45,80,.18);}',
    '.hj-root .hj-foldbtn{transition:transform .42s cubic-bezier(.22,.9,.24,1);}',
    '.hj-root .hj-foldbtn.hj-open{transform:rotate(180deg);}',
    /* 라이브 수치 — 값이 바뀔 때 아주 짧게 밝아졌다 돌아온다(깜빡임이 아니라 숨결) */
    '.hj-root .hj-tick{animation:hjTick .5s ease-out;}',
    '@keyframes hjTick{0%{filter:brightness(1.9)}100%{filter:brightness(1)}}',
    '.hj-root[data-theme="light"] .hj-tick{animation-name:hjTickL;}',
    '@keyframes hjTickL{0%{filter:brightness(.55)}100%{filter:brightness(1)}}',
    /* 차트 전환 — 실시간 데이터가 들어온 것처럼 부드럽게 */
    '.hj-root .hj-bar{transition:transform 1.1s cubic-bezier(.32,.72,.28,1);}',
    '.hj-root .hj-hbar{transition:transform 1.1s cubic-bezier(.32,.72,.28,1);}',
    '.hj-root .hj-donut{transition:transform 1.6s cubic-bezier(.4,.5,.25,1);}',
    '.hj-root .hj-meterfill{transition:-webkit-mask-image .9s linear,mask-image .9s linear;}',
    '.hj-root .hj-callout{transition:transform .9s cubic-bezier(.32,.72,.28,1);}',
    /* 이벤트 피드 새 줄 */
    '.hj-root .hj-newrow{animation:hjRow .55s cubic-bezier(.22,.9,.24,1);}',
    '@keyframes hjRow{0%{opacity:0;transform:translateY(-6px)}100%{opacity:1;transform:none}}',
    /* 헤더 드롭다운 — 마우스를 올리면 '선택됨' 모습(Menu Item/Unload Status (Selected))이 된다.
       원본의 선택 상태 그대로: 파란 테두리 + 반투명 파란 판 + 안쪽 파란 광. 눌러서 고르면 그 상태로 굳는다.
       (색은 스튜디오 '색 정하기'가 이 시트도 함께 칠하므로 팔레트를 따라간다) */
    /* 메뉴는 언제나 화면 위에 떠야 한다 — 원본 DOM 차례로는 뒤에 오는 위젯이 덮어 버린다
       (옮겨 심은 하위 화면에서 층별 차량현황 판이 드롭다운을 가렸다) */
    '.hj-root [data-name="Menu/Dropdown"]{z-index:60;}',
    '.hj-root [data-name="Menu/Dropdown"] [data-name^="Menu Item/"]{'
    + 'transition:background-color .18s ease,border-color .18s ease,box-shadow .18s ease;}',
    '.hj-root [data-name="Menu/Dropdown"] [data-name^="Menu Item/"]:not(.hj-off):hover{'
    + 'background-color:rgba(0,84,169,0.3);border-color:#2861ff;'
    + 'box-shadow:inset 0px 0px 13px 0px rgba(1,53,201,0.7);}',
    '.hj-root [data-name="Menu/Dropdown"] [data-name^="Menu Item/"]:not(.hj-off):hover p{color:#fff;}',
    /* 드롭다운은 위의 선택 모습으로 반응하므로 공통 흰색 틴트는 끈다 */
    '.hj-root [data-name="Menu/Dropdown"] .hj-hot::before{display:none;}',
    /* 지금 보고 있는 화면의 항목 — 원본의 '선택됨' 모습 그대로.
       옮겨 심은 드롭다운은 메인 화면 것이라 선택 표시가 '하차현황'에 박혀 있어서 여기로 옮겨 준다. */
    '.hj-root [data-name="Menu/Dropdown"] .hj-cur{'
    + 'background-color:rgba(0,84,169,0.3);border-color:#2861ff;'
    + 'box-shadow:inset 0px 0px 13px 0px rgba(1,53,201,0.7);}',
    '.hj-root [data-name="Menu/Dropdown"] .hj-cur p{color:#fff;}',
    /* 박제된 선택 표시를 되돌린 항목 — 판·테두리·글자를 '기본' 항목과 같게 하고 덧칠 레이어를 감춘다 */
    '.hj-root [data-name="Menu/Dropdown"] .hj-uncur{'
    + 'background-color:#222737;border-color:#3f4656;box-shadow:none;}',
    '.hj-root [data-name="Menu/Dropdown"] .hj-uncur p{color:#ccc;}',
    '.hj-root [data-name="Menu/Dropdown"] .hj-uncur > div:empty{display:none;}',
    /* 라이트에서는 값을 그대로 쓰면 안 된다 — 위 색은 어두운 판 전제다.
       생성기(light.js)가 같은 자리에 내는 값과 똑같이 맞춘다(선택 #517aec/파란 틴트/어두운 글자,
       기본 #eef1f8/#d1d7e4/#3f4859). */
    '.hj-root[data-theme="light"] [data-name="Menu/Dropdown"] [data-name^="Menu Item/"]:not(.hj-off):hover,'
    + '.hj-root[data-theme="light"] [data-name="Menu/Dropdown"] .hj-cur{'
    + 'background-color:rgba(40,97,255,0.18);border-color:#517aec;'
    + 'box-shadow:inset 0px 0px 13px 0px rgba(1,53,201,0.35);}',
    '.hj-root[data-theme="light"] [data-name="Menu/Dropdown"] [data-name^="Menu Item/"]:not(.hj-off):hover p,'
    + '.hj-root[data-theme="light"] [data-name="Menu/Dropdown"] .hj-cur p{color:#141a28;}',
    '.hj-root[data-theme="light"] [data-name="Menu/Dropdown"] .hj-uncur{'
    + 'background-color:#eef1f8;border-color:#d1d7e4;box-shadow:none;}',
    '.hj-root[data-theme="light"] [data-name="Menu/Dropdown"] .hj-uncur p{color:#3f4859;}',
    /* 아직 시안이 없어 갈 수 없는 항목 — 가만히 있을 때의 그림은 원본 그대로 두고
       (메인 화면은 원본과 픽셀 동일해야 한다) 마우스를 올렸을 때만 '못 간다'고 알린다. */
    '.hj-root .hj-off{cursor:not-allowed;transition:opacity .18s ease;}',
    '.hj-root .hj-off::before{display:none!important;}',
    '.hj-root .hj-off:hover{opacity:.5;}',
    /* 도크 슬롯 호버는 살짝 떠오르게 */
    '.hj-root .hj-hot.hj-slot{transition:filter .18s ease;}',
    '.hj-root .hj-hot.hj-slot:hover{filter:brightness(1.14);}',
    '.hj-root[data-theme="light"] .hj-hot.hj-slot:hover{filter:brightness(.94) saturate(1.1);}',
    /* 네모 판이 없는 것들(핀·색점·라디오처럼 그림만 있는 자리)은 사각형 틴트를 씌우면
       그림 밖까지 네모나게 칠해지고 모서리에서 잘려 보인다 → 밝기로만 반응한다. */
    '.hj-root .hj-hot.hj-soft::before{display:none;}',
    '.hj-root .hj-hot.hj-soft{transition:filter .18s ease;}',
    '.hj-root .hj-hot.hj-soft:hover{filter:brightness(1.35) saturate(1.1);}',
    '.hj-root .hj-hot.hj-soft:active{filter:brightness(1.6) saturate(1.15);}',
    '.hj-root[data-theme="light"] .hj-hot.hj-soft:hover{filter:brightness(.86) saturate(1.15);}',
    '.hj-root[data-theme="light"] .hj-hot.hj-soft:active{filter:brightness(.74) saturate(1.2);}',
    /* 검색창 — 원본 <p> 를 그대로 칠 수 있게 만든다. 빈칸일 때만 원본의 안내 문구를 그린다
       (::before 라 글꼴·자간·색이 원본 그대로다). */
    '.hj-root .hj-input{outline:none;min-width:4px;cursor:text;white-space:pre;}',
    '.hj-root .hj-input:empty::before{content:attr(data-hj-hint);}',
    '.hj-root .hj-searchbox{transition:box-shadow .18s ease;}',
    '.hj-root .hj-searchbox.hj-on{box-shadow:0 0 0 1px rgba(40,97,255,.85);}',
    '.hj-root .hj-searchbox.hj-nohit{box-shadow:0 0 0 1px rgba(244,54,121,.85);}',
    /* 검색 결과 — 맞는 것만 남기고 나머지는 뒤로 물린다 */
    '.hj-root .hj-dim{opacity:.2;transition:opacity .22s ease;}',
    '.hj-root .hj-find{animation:hjFind 1.2s ease-out 2;}',
    '@keyframes hjFind{0%,100%{filter:none}50%{filter:brightness(1.45) drop-shadow(0 0 7px rgba(64,150,255,.95))}}',
    /* 프로토타입 상태 전환 — 갈아 끼울 때 톡 튀지 않게 */
    '.hj-root [data-hj-vset]{transition:opacity .22s ease;}',
    /* 접근성 — 움직임을 줄이도록 설정한 환경에서는 전환만 끈다(값은 계속 갱신) */
    '@media (prefers-reduced-motion:reduce){.hj-root *{animation-duration:.001s!important;transition-duration:.001s!important;}}',
  ].join('\n');

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ══════════════════ 1. 잔손 도구 ══════════════════ */
  /* '패널편집'(글자 수정) 중에는 라이브 갱신을 멈춘다 —
     고치는 동안 숫자가 계속 바뀌면 편집이 방해되고, 지나간 값이 편집 내용으로 굳을 수 있다. */
  function editing() {
    return !!document.querySelector('.dtstage.dt-content-editing, .dtstage.dt-editing');
  }
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  function all(root, sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }
  function one(root, sel) { return root.querySelector(sel); }
  /* 숫자 텍스트 → 값/서식(1,240 · 65% · 806 을 원래 모양 그대로 되돌리기 위해) */
  function numOf(t) {
    var m = String(t).replace(/,/g, '').match(/-?\d+(\.\d+)?/);
    return m ? parseFloat(m[0]) : null;
  }
  function setNum(el, v, srcText) {
    var t = srcText == null ? el.textContent : srcText;
    var raw = String(t);
    var m = raw.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
    if (!m) return;
    var dec = m[1] ? m[1].length - 1 : 0;
    var fixed = v.toFixed(dec);
    var grouped = raw.indexOf(',') >= 0 || Math.abs(v) >= 1000;
    if (grouped) {
      var p = fixed.split('.');
      p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      fixed = p.join('.');
    }
    var next = raw.replace(/-?[\d,]+(\.\d+)?/, fixed);
    if (next === el.textContent) return;
    el.textContent = next;
    el.classList.remove('hj-tick');
    void el.offsetWidth;                       /* 애니메이션 재시작 */
    el.classList.add('hj-tick');
  }

  /* 값 하나를 목표까지 부드럽게 옮긴다(rAF).
     글자 수정 중에 들어가면 그 자리에서 멈춘다 — 이미 시작된 전환이 편집 중인 숫자를 덮어쓰지 않게. */
  function tween(ms, from, to, step, done) {
    var t0 = performance.now();
    var id = requestAnimationFrame(function tick(now) {
      if (editing()) return;
      var k = clamp((now - t0) / ms, 0, 1);
      var e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;   /* easeInOutCubic */
      step(from + (to - from) * e);
      if (k < 1) id = requestAnimationFrame(tick); else if (done) done();
    });
    return function () { cancelAnimationFrame(id); };
  }

  /* ══════════════════ 2. 반응형 — 캔버스 넓히기 ══════════════════
     통짜로 줄이면(=contain) 위아래·좌우에 여백이 남는다. 그래서
       · 배율 S = min(W/1920, H/1080) 로 '글자·위젯 크기'는 균일하게 유지하고
       · 캔버스를 W/S x H/S 로 넓혀 남는 공간을 없앤 뒤
       · 늘어난 폭·높이를 블록에 나눠 준다(가장자리 블록은 가장자리에 붙고 가운데는 비례 이동).
     블록이 top/bottom/left/right 중 무엇으로 붙어 있는지는 표로 적지 않고 '한 번 재서' 알아낸다
     — 캔버스를 100px 늘려 보고 스스로 얼마나 움직이는지 관찰한다(화면 3장에 같은 코드가 통한다). */
  var BASE_W = 1920, BASE_H = 1080;

  /* 화면 최상위 '덩어리'를 모은다.
     주의: Figma 가 그룹을 display:contents 로 내보내서, 그냥 자식만 훑으면 한 덩어리(예: 마감시간 칩)가
     여러 조각으로 흩어진다 → contents 로 묶인 것은 하나의 그룹으로 보고 같은 양만큼 옮긴다. */
  function collectBlocks(root) {
    var frame = root.firstElementChild;
    if (!frame) return [];
    var groups = [];
    (function walk(el, gid) {
      for (var i = 0; i < el.children.length; i++) {
        var c = el.children[i];
        var cs = getComputedStyle(c);
        if (cs.display === 'contents') { walk(c, gid == null ? groups.length : gid); continue; }
        if (cs.position !== 'absolute') continue;
        var g = gid == null ? groups.length : gid;
        (groups[g] || (groups[g] = [])).push(c);
      }
    })(frame, null);
    return groups.filter(Boolean);
  }

  /* ── 넓어진 폭을 판 '안쪽'까지 전달할 자리 ──
     캔버스를 넓히면 판(1840)은 따라 넓어지지만, 그 안의 내용은 Figma 가 준 px 폭 그대로라 오른쪽이 빈다.
     아래 자리들은 폭을 같이 늘린다. 칸(단계 카드·표의 열) 크기는 그대로 두고 '사이'가 벌어지므로
     글자 크기나 비율이 왜곡되지 않는다. */
  var STRETCH = [
    {
      host: '[data-name="Widget/Stage Status"]',          /* 단계별 차량현황(메인·하차현황) */
      /* Background 는 '판 바로 밑의 것'만 — 단계 카드 하나하나에도 같은 이름의 배경이 있다 */
      parts: ':scope > [data-name="Body"], :scope > [data-name="Body"] > [data-name="Background"],'
        + '[data-name="Stage Flow"], [data-name="Stages"], [data-name="Track"], [data-name="List"]',
      spread: '[data-name="List"]',                       /* 9개 단계 카드가 고르게 벌어진다 */
    },
    {
      /* 하차현황 화면의 단계별 차량현황은 판(Widget) 없이 화면에 바로 놓여 있다(같은 위젯, 다른 구조) */
      host: '[data-name="Screen/Unload Status"]',
      parts: '[data-name="Stage Flow"] > [data-name="Stages"], [data-name="Stage Flow"] [data-name="Track"], [data-name="Stage Flow"] [data-name="List"]',
      spread: '[data-name="Stage Flow"] [data-name="List"]',
    },
    {
      host: '[data-name="Event Log"]',                    /* 이벤트 현황 — 머리글 줄과 표 */
      parts: ':scope > [data-name="Header"], [data-name="Table"], [data-name="Grid"], [data-name="Header Row"], [data-name="Grid"] > [data-name="Body"], [data-name="Row"]',
      grow: '[data-name="Th/Message"], [data-name="list06"]', /* 남는 폭은 메시지 칸이 먹는다 */
    },
    {
      /* 입출문현황 — 입문/출문 표 두 판. 판을 감싼 자리가 space-between 이라
         두 판의 폭만 '폭 비율대로' 키우면 가운데 틈은 원본 그대로 남는다. */
      host: '[data-name="Section/Gate Tables"]',
      share: ':scope > [data-name^="Widget/"]',
      parts: ':scope > [data-name="Header"], [data-name="Table"], [data-name="Header Row"],'
        + '[data-name="Body"], [data-name="Row"]',
      spread: '[data-name="Header Row"], [data-name="Row"]',   /* 머리글과 줄의 칸이 같이 벌어진다 */
    },
    {
      /* 입출문현황 — 단계별 차량현황·작업현황 두 판(역시 space-between) */
      host: '[data-name="Section/Stage Summary"]',
      share: ':scope > [data-name^="Widget/"]',
      parts: '[data-name="Stage Flow"], [data-name="Stages"], [data-name="Track"], [data-name="List"]',
      spread: '[data-name="List"]',
    },
    {
      /* 하차현황 위쪽 요약 4판(하차진척률 · 요일별 하차물량 · 층별 차량현황 · 층별 도크 운영현황).
         감싼 자리가 space-between 이라 판 폭만 '폭 비율대로' 키우면 사이 간격은 원본 그대로 남는다.
         판 안쪽은 차트 구조가 판마다 달라 자리를 하나씩 짚는다:
           · 하차진척률   — 머리글·본문만. 게이지는 가운데 정렬이라 저절로 가운데로 간다(늘리면 찌그러진다).
           · 요일별 하차물량 — 판·격자·기준선·막대칸·가로축. 막대는 margin-left 로 놓여 있어 `slide` 로 벌린다.
           · 층별 차량현황 — 판·층별 줄·막대줄·가로축. 값 막대는 가로축 길이에 맞춰 `scale` 로 늘린다.
           · 층별 도크 운영현황 — 묶음·목록·줄. 줄은 space-between 으로 이름표와 수치가 양끝으로 간다. */
      host: '[data-name="Section/Overview"]',
      share: ':scope > [data-name^="Widget/"]',
      /* 차트 안쪽 이름(Plot·Grid·Data…)은 게이지에도 똑같이 있다 → 반드시 Bar Chart 밑으로 좁힌다
         (안 좁혔더니 게이지 원호가 268 → 392 로 늘어나 찌그러졌다) */
      parts: ':scope > [data-name="Header"], :scope > [data-name="Title"], :scope > [data-name="Body"],'
        + '[data-name="Legend"], [data-name="Bar Chart"], [data-name="Bar Chart"] [data-name="X Axis"],'
        /* 요일별 하차물량 */
        + '[data-name="Bar Chart"] [data-name="Plot"], [data-name="Bar Chart"] [data-name="Plot"] > [data-name="Base"],'
        + '[data-name="Bar Chart"] [data-name="Grid"], [data-name="Bar Chart"] [data-name="Grid Line"],'
        + '[data-name="Bar Chart"] [data-name="Data"], [data-name="Bar Chart"] [data-name="Bars"],'
        + '[data-name="Bar Chart"] [data-name="Average Line"],'
        /* 층별 차량현황 */
        + '[data-name="Bar Chart"] [data-name^="Row/"], [data-name="Bar Chart"] [data-name^="Row/"] [data-name="Base"],'
        + '[data-name="Bar Chart"] [data-name="Content"], [data-name="Bar Chart"] [data-name="Bar Row"],'
        /* 층별 도크 운영현황 */
        + '[data-name^="Dock Group/"], [data-name^="Dock Group/"] [data-name="List"],'
        + '[data-name^="Dock Group/"] [data-name="Item"]',
      spread: '[data-name="Bar Chart"] [data-name="X Axis"]',
      /* 도크 운영현황의 줄은 이름표+수치 두 칸이 줄을 꽉 채우는 구조다 → 두 칸이 폭 비율대로 같이 커진다
         (space-between 으로 벌리면 가운데가 휑하게 비어 원본과 다른 표처럼 보인다) */
      fill: '[data-name^="Dock Group/"] [data-name="Item"]',
      slide: '[data-name="Bar Chart"] [data-name="Bars"]',
      scale: '[data-name="Bar Chart"] [data-name="Bar Row"] > [data-name="Bar"]',
      track: '[data-name="Bar Chart"] [data-name="X Axis"]',
    },
  ];

  /* `:scope > …` 도 되는 선택자 — 쉼표로 나눠서 하나씩 돌린다(옛 브라우저에서 :scope 가 섞이면 던진다) */
  function pick(host, sel) {
    var out = [];
    if (!sel) return out;
    sel.split(',').forEach(function (q) {
      q = q.trim(); if (!q) return;
      var list;
      try { list = Array.prototype.slice.call(host.querySelectorAll(q)); } catch (e) { return; }
      list.forEach(function (el) { if (out.indexOf(el) < 0) out.push(el); });
    });
    return out;
  }
  function boxOf(el) {
    var cs = getComputedStyle(el), cols = cs.gridTemplateColumns;
    var w = el.getBoundingClientRect().width;
    return {
      el: el, w: w,
      /* 한 칸짜리 그리드는 폭이 열 정의에도 박혀 있어 같이 고쳐야 한다 */
      grid: (cs.display.indexOf('grid') >= 0 && /^[\d.]+px$/.test(cols)) ? parseFloat(cols) : null,
      /* 이 자리를 통째로 덮는 그림(판 배경·기준선)도 같이 늘려야 한다.
         '폭이 똑같은 것'만 고른다 — 안에 든 작은 아이콘까지 늘리면 그림이 무너진다. */
      arts: all(el, 'img, svg').filter(function (a) {
        return Math.abs(a.getBoundingClientRect().width - w) < 1.5;
      }),
    };
  }
  function setW(o, ex) {
    o.el.style.width = (o.w + ex) + 'px';
    if (o.grid != null) o.el.style.gridTemplateColumns = (o.grid + ex) + 'px';
    if (o.arts) o.arts.forEach(function (a) { a.style.width = (o.w + ex) + 'px'; });
  }

  /* 1920 기준(배율 없음) 상태에서 폭을 기억해 둔다 — measureAnchors 안에서 부른다 */
  function measureStretch(root) {
    var groups = [];
    STRETCH.forEach(function (S) {
      all(root, S.host).forEach(function (host) {
        /* share 가 있으면 형제끼리 늘어난 폭을 나눠 갖는다 — 각 조각의 안쪽은 '자기 몫'만큼만 넓힌다 */
        var scopes = S.share ? pick(host, S.share) : [host];
        var g = { share: !!S.share, members: [] };
        scopes.forEach(function (sc) {
          var m = S.share ? boxOf(sc) : null;
          var track = S.track ? one(sc, S.track) : null;
          g.members.push({
            self: m,
            parts: pick(sc, S.parts).map(boxOf),
            spread: pick(sc, S.spread),
            grow: pick(sc, S.grow).map(boxOf),
            /* margin-left 로 늘어놓은 칸(요일별 막대) — 마지막 칸이 새 오른쪽 끝에 닿도록 간격을 다시 잰다 */
            slide: pick(sc, S.slide).map(function (el) {
              return {
                w: el.getBoundingClientRect().width,
                kids: Array.prototype.map.call(el.children, function (k) {
                  return { el: k, ml: parseFloat(getComputedStyle(k).marginLeft) || 0, w: k.getBoundingClientRect().width };
                }),
              };
            }),
            /* 값 막대 — 눈금자(가로축)가 길어진 비율만큼 같이 길어진다(값 대비 길이가 그대로 유지된다) */
            scale: track ? { t: track.getBoundingClientRect().width, els: pick(sc, S.scale).map(boxOf) } : null,
            /* 줄을 꽉 채우는 칸들 — 그 줄이 받은 몫을 칸끼리 폭 비율대로 다시 나눈다 */
            fill: pick(sc, S.fill).map(function (el) {
              return { kids: Array.prototype.map.call(el.children, boxOf) };
            }),
          });
        });
        if (g.members.length) groups.push(g);
      });
    });
    return { groups: groups, dock: measureDockBoard(root) };
  }

  function applyStretch(m, exW) {
    if (!m) return;
    m.groups.forEach(function (g) {
      var total = 0;
      if (g.share) g.members.forEach(function (x) { total += x.self.w; });
      g.members.forEach(function (x) {
        var ex = g.share ? (total ? exW * x.self.w / total : 0) : exW;
        if (x.self) setW(x.self, ex);
        x.parts.concat(x.grow).forEach(function (o) { setW(o, ex); });
        x.spread.forEach(function (el) { el.style.justifyContent = ex > 1 ? 'space-between' : ''; });
        (x.slide || []).forEach(function (s) {
          s.kids.forEach(function (k) {
            var run = s.w - k.w;                       /* 첫 칸 왼쪽 끝 ~ 마지막 칸 왼쪽 끝까지의 거리 */
            k.el.style.marginLeft = (run > 0 ? k.ml * (run + ex) / run : k.ml) + 'px';
          });
        });
        if (x.scale && x.scale.t > 0) {
          var r = (x.scale.t + ex) / x.scale.t;
          x.scale.els.forEach(function (o) { o.el.style.width = (o.w * r) + 'px'; });
        }
        (x.fill || []).forEach(function (f) {
          var sum = 0;
          f.kids.forEach(function (k) { sum += k.w; });
          if (!sum) return;
          f.kids.forEach(function (k) { setW(k, ex * k.w / sum); });
        });
      });
    });
    applyDockBoard(m.dock, exW);
  }

  /* ── 도크 상세현황 판 ──
     판은 한 칸짜리 grid 라 조각이 전부 margin-left 로 놓여 있다 → 폭과 margin-left 만 고치면 된다.
     왼쪽(A·B존)과 오른쪽(D·C존)이 늘어난 폭을 절반씩 나눠 갖고, 가운데 통로는 원본 간격 그대로 둔다.
     도크 칸(32px)은 그대로 두고 칸 '사이'만 벌어지므로 글자 크기·비율이 왜곡되지 않는다. */
  function measureDockBoard(root) {
    var board = one(root, '[data-name="Dock Board"]');
    if (!board) return null;
    var bw = board.getBoundingClientRect().width;
    if (!bw) return null;
    var zoneL = null, zoneR = null;
    var kids = [];
    Array.prototype.forEach.call(board.children, function (el) {
      var cs = getComputedStyle(el);
      var w = el.getBoundingClientRect().width;
      var ml = parseFloat(cs.marginLeft) || 0;
      var o = { el: el, w: w, ml: ml, full: w > bw * 0.95, wide: w > bw * 0.2 && w <= bw * 0.95 };
      o.right = !o.full && ml + w / 2 > bw / 2;
      kids.push(o);
      if (o.wide && !o.right && (!zoneL || w > zoneL.w)) zoneL = o;   /* 가장 넓은 조각 = 존 배경 */
      if (o.wide && o.right && (!zoneR || w > zoneR.w)) zoneR = o;
    });
    if (!zoneL || !zoneR) return null;
    kids.forEach(function (o) {
      if (o.full || o.wide) return;
      /* 좁은 조각(존 이름표·왼쪽 끝 도크 칸)은 넓히지 않고 '자기가 속한 존 안에서의 자리'만큼만 민다 */
      var z = o.right ? zoneR : zoneL;
      o.t = clamp((o.ml - z.ml) / (z.w || 1), 0, 1);
    });
    /* 줄 안쪽 — Slots 가 있으면 그쪽이, 없으면 줄 자체가 벌어진다 */
    var rows = [];
    kids.forEach(function (o) {
      if (!o.wide || (o.el.dataset.name || '').indexOf('Dock Row') !== 0) return;
      var slots = one(o.el, '[data-name="Slots"]');
      rows.push({ row: o.el, spread: slots || o.el, inner: slots ? boxOf(slots) : null });
    });
    /* 판·존 배경 안쪽의 그림(absolute, px 폭)도 같이 늘려야 한다.
       단 '판을 통째로 덮는 그림'만 — 도크 칸 안의 작은 아이콘(∞ 표시)까지 늘리면 화면을 가로지른다. */
    var arts = kids.filter(function (o) { return o.full || o.wide; }).map(function (o) {
      return { host: o, els: all(o.el, '*').map(boxOf).filter(function (a) { return a.w > o.w * 0.9; }) };
    }).filter(function (a) { return a.els.length; });
    return { board: boxOf(board), bw: bw, kids: kids, rows: rows, arts: arts };
  }

  function applyDockBoard(m, exW) {
    if (!m) return;
    var h = exW / 2;
    m.board.el.style.width = (m.board.w + exW) + 'px';
    if (m.board.grid != null) m.board.el.style.gridTemplateColumns = (m.board.grid + exW) + 'px';
    m.kids.forEach(function (o) {
      if (o.full) { o.el.style.width = (o.w + exW) + 'px'; return; }
      if (o.wide) {
        o.el.style.width = (o.w + h) + 'px';
        o.el.style.marginLeft = (o.ml + (o.right ? h : 0)) + 'px';
        return;
      }
      o.el.style.marginLeft = (o.ml + (o.right ? h : 0) + h * (o.t || 0)) + 'px';
    });
    m.arts.forEach(function (a) {
      var ex = a.host.full ? exW : h;
      a.els.forEach(function (o) { o.el.style.width = (o.w + ex) + 'px'; });
    });
    m.rows.forEach(function (r) {
      if (r.inner) r.inner.el.style.width = (r.inner.w + h) + 'px';
      r.spread.style.justifyContent = exW > 1 ? 'space-between' : '';
    });
  }

  /* 헤더 드롭다운은 언제나 '통합관제' 탭 바로 아래 일직선으로 붙어 있어야 한다.
     탭은 헤더 가운데 정렬이라 캔버스가 넓어지면 오른쪽으로 밀리는데, 드롭다운은 원본이 left 고정이라
     그대로 남아 어긋난다 → 매번 탭 위치를 재서 x 를 맞춘다(원본 1920 에서의 미세한 차이는 그대로 보존). */
  function alignDropdown(root, S) {
    var dd = one(root, '[data-name="Menu/Dropdown"]');
    var tab = one(root, '[data-name^="Menu Item/Control Tower"]');
    if (!dd || !tab) return;
    var rb = root.getBoundingClientRect();
    var cx = function (el) { var r = el.getBoundingClientRect(); return (r.left - rb.left + r.width / 2) / S; };
    if (dd.__hjBaseGap == null) return;                  /* 기준 간격을 아직 못 쟀다 */
    var want = cx(tab) + dd.__hjBaseGap;                 /* 탭 중심 + 원본에서의 차이 */
    var cur = cx(dd);
    var t = (dd.style.translate || '').split(' ');
    var x = parseFloat(t[0]) || 0, y = t[1] || '0px';
    var nx = x + (want - cur);
    if (Math.abs(nx - x) < 0.05) return;
    dd.style.translate = nx.toFixed(2) + 'px ' + y;
  }

  function unionBox(els, rb) {
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    els.forEach(function (e) {
      var r = e.getBoundingClientRect();
      x0 = Math.min(x0, r.left - rb.left); y0 = Math.min(y0, r.top - rb.top);
      x1 = Math.max(x1, r.right - rb.left); y1 = Math.max(y1, r.bottom - rb.top);
    });
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  /* 프로토타입 변형 세트(층 선택 · 카메라 프리셋)는 대기 중인 상태까지 DOM 에 들어 있다.
     감춘 상태는 재 봐야 0x0 이라 보정을 못 받고, 나중에 드러나는 순간 퍼센트 inset 그대로 부풀어
     자리와 비율이 어긋난다(2560 폭에서 층 선택이 270 → 361 로 늘어났다).
     그래서 재는 동안만 잠깐 드러낸다 — 단, 흐름에 참여하는(절대배치가 아닌) 상태는 도로 감춘다.
     그런 상태까지 펼치면 형제가 아래로 밀려 다른 조각의 기준 위치가 틀어지기 때문이다. */
  function unhideVariants(root) {
    var kept = [];
    all(root, '[data-hj-vset][hidden], [data-hj-graft][hidden]').forEach(function (el) {
      el.removeAttribute('hidden');
      if (getComputedStyle(el).position === 'absolute') kept.push(el);
      else el.setAttribute('hidden', '');
    });
    return function () { kept.forEach(function (el) { el.setAttribute('hidden', ''); }); };
  }

  function measureAnchors(root) {
    var rehide = unhideVariants(root);
    var groups = collectBlocks(root);
    if (!groups.length) { rehide(); return null; }
    /* 재는 동안은 배율을 끄고 캔버스를 정확히 1920x1080 으로 되돌린다 —
       축소된 상태로 재면 폭 1840 이 1196 으로 읽혀 '가로를 꽉 쓰는 판'을 못 알아본다. */
    var s0 = root.style.transform, w0 = root.style.width, h0 = root.style.height;
    root.style.transform = 'none';
    root.style.width = BASE_W + 'px';
    root.style.height = BASE_H + 'px';
    var eBox = function (g, rb) { return g.map(function (e) { var r = e.getBoundingClientRect(); return { x: r.left - rb.left, y: r.top - rb.top, w: r.width, h: r.height }; }); };
    var rb1 = root.getBoundingClientRect();
    var base = groups.map(function (g) { return unionBox(g, rb1); });
    var baseEl = groups.map(function (g) { return eBox(g, rb1); });
    /* 판 안쪽으로 폭을 전달할 자리와, 드롭다운↔탭의 원본 간격도 이 상태(1920, 배율 없음)에서 잰다 */
    var stretch = measureStretch(root);
    (function () {
      var dd = one(root, '[data-name="Menu/Dropdown"]');
      var tab = one(root, '[data-name^="Menu Item/Control Tower"]');
      if (!dd || !tab) return;
      var c = function (el) { var r = el.getBoundingClientRect(); return r.left - rb1.left + r.width / 2; };
      /* 옮겨 심은 드롭다운은 메인 화면의 left 좌표를 그대로 물고 왔다 → 탭 중심에 그냥 맞춘다.
         원본에 있던 메인 화면 것은 원본에서의 미세한 차이(약 1px)를 그대로 보존한다. */
      dd.__hjBaseGap = dd.dataset.hjGraft ? 0 : c(dd) - c(tab);
    })();
    /* 캔버스를 100px 넓혀 보고 각 조각이 '스스로' 얼마나 따라오는지 잰다.
       조각마다 붙는 방식이 다르다 — px top(안 움직임) · bottom(전부 따라옴) · left-1/2(반) ·
       퍼센트 inset(비율만큼). 그래서 덩어리 단위가 아니라 '조각 단위'로 재야 흩어지지 않는다. */
    root.style.width = (BASE_W + 100) + 'px';
    root.style.height = (BASE_H + 100) + 'px';
    var rb2 = root.getBoundingClientRect();
    var probed = groups.map(function (g) { return unionBox(g, rb2); });
    var probedEl = groups.map(function (g) { return eBox(g, rb2); });
    root.style.transform = s0; root.style.width = w0; root.style.height = h0;
    rehide();

    /* 세로 배분 기준선 — 덩어리들이 실제로 놓인 범위(전면 배경은 뺀다) */
    var t0 = Infinity, t1 = -Infinity;
    base.forEach(function (b) {
      if (b.h >= BASE_H * 0.85) return;
      t0 = Math.min(t0, b.y); t1 = Math.max(t1, b.y + b.h);
    });
    if (!isFinite(t0)) { t0 = 0; t1 = BASE_H; }
    var span = Math.max(1, t1 - t0);

    var anchors = groups.map(function (els, i) {
      var o = base[i], p = probed[i];
      var full = o.h >= BASE_H * 0.85 || o.w >= BASE_W * 0.99;   /* 전면 배경(별자리 판·건물 판) */
      var wide = !full && o.w >= 1780;                            /* 폭을 꽉 쓰는 판 */
      var selfDX = (p.x - o.x) / 100, selfDY = (p.y - o.y) / 100;
      /* 목표: 세로는 '놓인 위치에 비례해' 내려간다(맨 위 그대로 · 맨 아래는 전부) */
      var wantDY = full ? 0 : clamp((o.y + o.h / 2 - t0) / span, 0, 1);
      /* 가로는 중심 위치로 — 왼쪽 고정 / 가운데 반 / 오른쪽 전부 */
      var cx = (o.x + o.w / 2) / BASE_W;
      var wantDX = wide || full ? 0 : cx > 0.62 ? 1 : cx > 0.38 ? 0.5 : 0;
      /* 원본이 아예 아래(오른쪽) 가장자리에 매달아 놓은 덩어리는 계속 가장자리에 붙인다 —
         이벤트 현황 패널은 절반이 화면 밖이라 '가운데 기준' 으로 재면 바닥에서 떠 버린다. */
      var selfDYmax = 0, selfDXmax = 0;
      probedEl[i].forEach(function (p, k) {
        selfDYmax = Math.max(selfDYmax, (p.y - baseEl[i][k].y) / 100);
        selfDXmax = Math.max(selfDXmax, (p.x - baseEl[i][k].x) / 100);
      });
      if (selfDYmax > 0.9) wantDY = 1;
      if (selfDXmax > 0.9) wantDX = 1;
      /* 가장자리에 딱 붙은 덩어리는 0/1 로 스냅 — 1~2px 씩 어긋나면
         헤더처럼 같은 자리에 겹쳐 그린 조각이 이중으로 보인다. */
      if (wantDY < 0.06) wantDY = 0; else if (wantDY > 0.94) wantDY = 1;
      if (wantDX < 0.06) wantDX = 0; else if (wantDX > 0.94) wantDX = 1;
      return {
        els: els, base: o, full: full, wide: wide,
        selfDX: selfDX, selfDY: selfDY, wantDX: wantDX, wantDY: wantDY,
        /* 조각별 기준 상자와 '스스로 따라오는 양' */
        eBase: baseEl[i],
        eSelf: baseEl[i].map(function (b, k) {
          var p = probedEl[i][k];
          return { dx: (p.x - b.x) / 100, dy: (p.y - b.y) / 100, sw: (p.w - b.w) / 100, sh: (p.h - b.h) / 100 };
        }),
      };
    });
    anchors.stretch = stretch;
    return anchors;
  }

  function applyFit(root, st) {
    var host = root.parentElement;
    if (!host) return;
    var W = host.clientWidth || BASE_W, H = host.clientHeight || BASE_H;
    if (!W || !H) return;
    var S = Math.min(W / BASE_W, H / BASE_H);
    var VW = W / S, VH = H / S;
    var exW = Math.max(0, VW - BASE_W), exH = Math.max(0, VH - BASE_H);

    root.style.transformOrigin = '0 0';
    root.style.transform = 'scale(' + S + ')';
    root.style.left = '0'; root.style.top = '0';
    root.style.right = 'auto'; root.style.bottom = 'auto';
    root.style.width = VW + 'px';
    root.style.height = VH + 'px';

    if (!st.anchors) st.anchors = measureAnchors(root);
    var A = st.anchors;
    if (!A) return;
    A.forEach(function (a) {
      a.els.forEach(function (el, i) {
        var b = a.eBase[i], s = a.eSelf[i];
        if (a.full) {                                   /* 전면 배경은 늘려서 덮는다 */
          if (s.sw < 0.9) el.style.width = (b.w + exW) + 'px';
          if (s.sh < 0.9) el.style.height = (b.h + exH) + 'px';
          el.style.translate = '';
          return;
        }
        /* 폭을 넓히는 건 '스스로 폭을 꽉 쓰는 조각'에만 — 같은 덩어리라도 트럭 아이콘 같은 작은 조각에
           px 폭을 박으면 원래 유동 폭이던 자리가 어긋난다. */
        var widen = a.wide && b.w >= 1780;
        if (widen) { if (s.sw < 0.9) el.style.width = (b.w + exW) + 'px'; }
        /* 퍼센트 inset 으로 크기가 정해진 조각은 캔버스를 넓히면 같이 부풀어 오른다
           (마감시간 칩 배경이 50px → 61px 이 되어 아래로 삐져나왔다) → 기준 크기로 못 박는다.
           width/height 를 직접 주면 CSS 규칙상 right/bottom 이 무시되므로 안전하다. */
        if (!widen && s.sw > 0.01) el.style.width = b.w.toFixed(2) + 'px';
        if (s.sh > 0.01) el.style.height = b.h.toFixed(2) + 'px';
        /* 조각이 스스로 따라오는 만큼을 빼고 나머지만 보정한다 —
           px top / bottom / left-1/2 / 퍼센트 inset 이 섞여 있어도 같은 자리로 모인다. */
        var dx = widen ? 0 : (a.wantDX - s.dx) * exW;
        var dy = (a.wantDY - s.dy) * exH;
        el.style.translate = (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05)
          ? dx.toFixed(2) + 'px ' + dy.toFixed(2) + 'px' : '';
      });
    });
    /* 판 안쪽까지 폭을 전달하고(단계별 차량현황·이벤트 표), 드롭다운을 탭 아래로 다시 맞춘다 */
    applyStretch(A.stretch, exW);
    alignDropdown(root, S);
  }

  function installFit(root, st) {
    var run = function () { applyFit(root, st); };
    st.fit = run;
    run();
    if (window.ResizeObserver && root.parentElement) {
      st.ro = new ResizeObserver(function () { run(); });
      st.ro.observe(root.parentElement);
    }
    window.addEventListener('resize', run);
    st.cleanup.push(function () { window.removeEventListener('resize', run); if (st.ro) st.ro.disconnect(); });
  }

  /* ══════════════════ 3. 실시간 시계 ══════════════════
     헤더의 06 : 40 / 49 / am / 6 - 7 [수] 를 지금 시각으로 채운다(원본 서식 그대로). */
  var DOW = ['일', '월', '화', '수', '목', '금', '토'];
  function installClock(root, st) {
    var time = one(root, '[data-name="Time"] p') || one(root, '[data-name="Timestamp"] [data-name="Time"] p');
    var sec = one(root, '[data-name="Second"] [data-name="Value"] p') || one(root, '[data-name="Second"] p');
    var mer = one(root, '[data-name="Meridiem"] p') || one(root, '[data-name="Meridiem"]');
    var date = one(root, '[data-name="Date"] p');
    if (!time && !sec && !date) return;
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var tick = function () {
      if (editing()) return;
      var d = new Date();
      var h = d.getHours(), am = h < 12;
      var h12 = h % 12 || 12;
      if (time) { var t = pad(h12) + ' : ' + pad(d.getMinutes()); if (time.textContent !== t) time.textContent = t; }
      if (sec) { var s = pad(d.getSeconds()); if (sec.textContent !== s) sec.textContent = s; }
      if (mer && mer.textContent.trim().length <= 2) mer.textContent = am ? 'am' : 'pm';
      if (date) {
        var nd = (d.getMonth() + 1) + ' - ' + d.getDate() + ' [' + DOW[d.getDay()] + ']';
        if (date.textContent !== nd) date.textContent = nd;
      }
    };
    tick();
    var id = setInterval(tick, 1000);
    st.cleanup.push(function () { clearInterval(id); });
  }

  /* ══════════════════ 4. 마우스 오버 · 선택 ══════════════════ */
  var HOT = [
    '[data-name^="Menu Item/"]', '[data-name^="Tab/"]', '[data-name^="Button/"]',
    '[data-name^="Map Action/"]', '[data-name^="Option/"]', '[data-name^="Count/"]',
    '[data-name="Chip"]', '[data-name="Badge"]', '[data-name^="Queue Item/"]',
    '[data-name="Floor"]', '[data-name^="Item/"]', '[data-name="Field"]',
    '[data-name="Checkbox/GS Vehicle"]', '[data-name="Auto Toggle"]', '[data-name="Radio"]',
    '[data-name^="Btn "]', '[data-name="Search"]',
  ].join(',');

  /* 사각형 틴트가 어울리지 않는 자리 — 판 없이 그림만 놓인 것들 */
  var SOFT = [
    '[data-name^="Map Action/"]',     /* 기본위치·RAMP숨김 — 칩 아래 지도 핀이 판 밖으로 나와 있다 */
    '[data-name^="Option/"]',         /* 차량 필터 — 색점 + 글자뿐 */
    '[data-name="Auto Toggle"]',      /* 라디오 + 구분선 + 글자 */
    '[data-name="Radio"]',
    '[data-name="Checkbox/GS Vehicle"]',
  ].join(',');

  function markHot(root) {
    all(root, HOT).forEach(function (el) {
      if (el.classList.contains('hj-hot')) return;
      /* 아이콘 조각(::before 를 얹을 자리가 없는 것)은 건너뛴다 */
      var r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) return;
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      el.classList.add('hj-hot');
    });
    /* 표의 행 — 이벤트 로그·차량 목록·도크 표 */
    all(root, '[data-name="Row"],[data-name^="Row/"]').forEach(function (el) {
      if (el.classList.contains('hj-hot')) return;
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      el.classList.add('hj-hot', 'hj-row');
    });
    /* 도크 슬롯은 밝기로만 반응(칸이 좁아 오버레이보다 또렷하다) */
    all(root, '[data-name="Dock Slot"]').forEach(function (el) {
      el.classList.add('hj-hot', 'hj-slot');
    });
    /* 판 없이 그림만 있는 자리 — 사각형 틴트 대신 밝기로 반응 */
    all(root, SOFT).forEach(function (el) { el.classList.add('hj-hot', 'hj-soft'); });
  }

  /* 같은 묶음 안에서 '선택된 것'을 찾는다.
     ① 레이어명에 "(Selected)" 가 있으면 그게 정답(Figma 가 그렇게 이름 지었다).
     ② 없으면 계산된 색의 '소수파' 하나 — 나머지가 서로 같은 모습일 때만 인정한다.
        신호는 거친 것부터 본다: 배경 그라디언트까지 넣으면 항목마다 값이 달라(층 버튼이 그렇다)
        전부 유일해져서 소수파를 못 고른다. */
  function findSelected(items) {
    for (var i = 0; i < items.length; i++) {
      if (/\(Selected\)/.test(items[i].dataset.name || '')) return i;
    }
    /* 신호는 '그 덩어리 안의 앞쪽 몇 요소'를 함께 본다 — 선택 표시가 자기 상자가 아니라
       한 겹 안쪽(또는 감싼 래퍼)에 칠해져 있는 경우가 있다(층 선택 버튼이 그렇다). */
    var pack = function (el, deep) {
      var list = [el].concat(all(el, '*').slice(0, deep));
      return list.map(function (x) {
        var cs = getComputedStyle(x);
        return cs.backgroundColor + ',' + cs.borderTopColor + ',' + cs.color;
      }).join('|');
    };
    var sigs = [
      function (el) { return pack(el, 0); },
      function (el) { return pack(el, 4); },
      function (el) { return pack(el, 4) + '|' + getComputedStyle(el).backgroundImage.slice(0, 60); },
    ];
    for (var s = 0; s < sigs.length; s++) {
      var list = items.map(sigs[s]);
      var count = {};
      list.forEach(function (v) { count[v] = (count[v] || 0) + 1; });
      var lone = [], major = 0;
      list.forEach(function (v, k) { if (count[v] === 1) lone.push(k); else major = Math.max(major, count[v]); });
      if (!lone.length || major < 2) continue;
      if (lone.length === 1) return lone[0];
      /* 혼자인 것이 둘 이상이면(예: 카메라 프리셋 6번은 통짜 그림이라 구조부터 다르다)
         '강조색을 입은 쪽'을 선택으로 본다 — 선택 표시는 늘 채도가 높은 테두리·배경으로 되어 있다. */
      var best = -1, bestS = 0.25;
      lone.forEach(function (k) {
        var cs = getComputedStyle(items[k]);
        var v = Math.max(sat(cs.borderTopColor), sat(cs.backgroundColor));
        if (v > bestS) { bestS = v; best = k; }
      });
      if (best >= 0) return best;
    }
    return -1;
  }
  /* rgb()/rgba() 문자열의 채도(0~1) — 투명하면 0 */
  function sat(v) {
    var m = /rgba?\(([^)]+)\)/.exec(v || '');
    if (!m) return 0;
    var p = m[1].split(',').map(parseFloat);
    if (p.length > 3 && p[3] < 0.15) return 0;
    var mx = Math.max(p[0], p[1], p[2]) / 255, mn = Math.min(p[0], p[1], p[2]) / 255;
    var l = (mx + mn) / 2;
    return (mx === mn) ? 0 : (mx - mn) / (1 - Math.abs(2 * l - 1));
  }

  /* 두 형제의 '겉모습'만 맞바꾼다 — 노드별 유일 클래스(nXXXX)와 이미지 src 를 짝지어 교환.
     글자·id·data-name 은 그대로라 패널편집으로 고친 문구도 유지된다. */
  function swapLook(a, b) {
    swapNodeClass(a, b);
    var A = all(a, '*'), B = all(b, '*');
    if (A.length === B.length) {                       /* 구조가 같으면 통째로 짝지어 바꾼다 */
      for (var i = 0; i < A.length; i++) swapPair(A[i], B[i]);
      return;
    }
    /* 구조가 다르면(선택 상태에만 있는 덧칠 레이어 등) 뜻이 있는 것만 골라서 옮긴다:
       ① 같은 레이어명끼리 — 선택 표시가 한 겹 안쪽 프레임에 칠해진 경우(층 선택 버튼)
       ② 글자 색 — <p> 끼리 짝지어 클래스 교환
       ③ 이미지 — <img> 끼리 src 교환
       ④ 글자가 없는 '장식 전용' 직계 자식(선택 표시용 오버레이·안쪽 그림자)은 통째로 옮긴다 */
    var done = [];
    var mark = function (x, y) { done.push(x, y); };
    var named = {};
    all(a, '[data-name]').forEach(function (x) { var n = x.dataset.name; if (!named[n]) named[n] = x; });
    all(b, '[data-name]').forEach(function (y) {
      var n = y.dataset.name;
      if (named[n]) { swapPair(named[n], y); mark(named[n], y); named[n] = null; }
    });
    var free = function (list) { return list.filter(function (x) { return done.indexOf(x) < 0; }); };
    var pa = free(all(a, 'p')), pb = free(all(b, 'p'));
    var n = Math.min(pa.length, pb.length);
    for (var j = 0; j < n; j++) { swapPair(pa[j], pb[j]); mark(pa[j], pb[j]); }
    var ia = free(all(a, 'img')), ib = free(all(b, 'img'));
    var m = Math.min(ia.length, ib.length);
    for (var k = 0; k < m; k++) swapSrc(ia[k], ib[k]);
    var deco = function (el) {
      return Array.prototype.filter.call(el.children, function (c) {
        return !(c.textContent || '').trim() && !c.querySelector('img');
      });
    };
    var da = deco(a), db = deco(b);
    da.forEach(function (c) { b.appendChild(c); });
    db.forEach(function (c) { a.appendChild(c); });
  }
  function swapPair(x, y) {
    swapNodeClass(x, y);
    swapSrc(x, y);
    var sa = x.getAttribute('style'), sb = y.getAttribute('style');
    if (sa || sb) {
      if (sb) x.setAttribute('style', sb); else x.removeAttribute('style');
      if (sa) y.setAttribute('style', sa); else y.removeAttribute('style');
    }
  }
  /* 강조/보통 '색만' 기억하고 입히는 대비책 — 구조가 다른 묶음에서 쓴다 */
  function lookOf(el) {
    var cs = getComputedStyle(el);
    return { bg: cs.backgroundColor, bgi: cs.backgroundImage, bc: cs.borderTopColor, bw: cs.borderTopWidth, bs: cs.borderTopStyle };
  }
  function applyLook(el, L) {
    if (!L) { ['background-color', 'background-image', 'border-color', 'border-width', 'border-style'].forEach(function (p) { el.style.removeProperty(p); }); return; }
    el.style.backgroundColor = L.bg;
    el.style.backgroundImage = L.bgi;
    el.style.borderColor = L.bc;
    el.style.borderWidth = L.bw;
    el.style.borderStyle = L.bs;
  }
  function swapSrc(x, y) {
    if (x.tagName !== 'IMG' || y.tagName !== 'IMG') return;
    var s = x.getAttribute('src');
    x.setAttribute('src', y.getAttribute('src'));
    y.setAttribute('src', s);
  }
  function swapNodeClass(a, b) {
    var ra = [], rb = [];
    a.classList.forEach(function (c) { if (/^n[\dA-Za-z_]+$/.test(c) || /^x\d+$/.test(c)) ra.push(c); });
    b.classList.forEach(function (c) { if (/^n[\dA-Za-z_]+$/.test(c) || /^x\d+$/.test(c)) rb.push(c); });
    ra.forEach(function (c) { a.classList.remove(c); });
    rb.forEach(function (c) { b.classList.remove(c); });
    rb.forEach(function (c) { a.classList.add(c); });
    ra.forEach(function (c) { b.classList.add(c); });
    a.classList.add('hj-swap'); b.classList.add('hj-swap');
  }

  /* 하나만 고를 수 있는 묶음 — 같은 부모 아래 나란히 놓인 것끼리 한 조로 본다
     (Figma 구조가 화면마다 달라서 '담는 프레임 이름'을 표로 적기보다 형제 관계로 묶는 편이 튼튼하다) */
  var GROUP_ITEMS = [
    '[data-name^="Menu Item/"]',      /* 헤더 대시보드/통합관제 · 드롭다운 4항목 */
    '[data-name^="Tab/"]',            /* 단계별 차량현황(하차/상차) · 허브 근접/도착지연 TOP10 */
    '[data-name^="Queue Item/"]',     /* 우선순위 대기열 1~8 */
    /* 층 선택·카메라 프리셋은 Figma 원본이 상태를 통째로 그려 두었다 → installVariants 가 맡는다 */
  ];
  /* 하나만 고르는 게 아니라 '켜고 끄는' 것들 — 원본에 꺼진 모습이 없어 흐리기로 표현한다 */
  var TOGGLE_ITEMS = [
    '[data-name^="Option/"]',         /* 차량 필터(전체차량·접안중·작업중·배정됨·마감임박) */
    '[data-name^="Map Action/"]',     /* 기본위치 · RAMP숨김 */
    /* GS 차량은 '흐리기'가 아니라 라디오 표시로 켜고 끈다 → installRadioChip 이 맡는다 */
  ];

  /* 형제 묶기 — '같은 종류를 둘 이상 담고 있는 가장 가까운 조상'을 묶음으로 삼고,
     맞바꿀 단위는 그 묶음의 '직계 자식'으로 잡는다.
     층 선택 버튼처럼 선택 표시가 항목이 아니라 감싼 래퍼에 칠해져 있는 경우까지 함께 옮기기 위해서다. */
  function groupSiblings(root, sel) {
    var items = all(root, sel);
    var map = new Map();
    items.forEach(function (el) {
      var a = el.parentElement;
      while (a && a !== root && a.querySelectorAll(sel).length < 2) a = a.parentElement;
      if (!a) a = root;
      var unit = el;
      while (unit.parentElement && unit.parentElement !== a) unit = unit.parentElement;
      if (!map.has(a)) map.set(a, []);
      if (map.get(a).indexOf(unit) < 0) map.get(a).push(unit);
    });
    return map;
  }

  function installSelect(root, st) {
    GROUP_ITEMS.forEach(function (sel) {
      groupSiblings(root, sel).forEach(function (items) {
        if (items.length < 2) return;
        var si = findSelected(items);
        if (si < 0) return;                            /* 선택 상태를 못 가리면 호버만 남긴다 */
        var cur = items[si];
        /* 선택 상태를 옮기는 방법은 '겉모습 맞바꾸기' 하나뿐이다 — Figma 원본의 두 상태가 그대로 오간다.
           단, 두 상태가 아예 다른 프레임으로 그려진 묶음(층 선택 버튼)은 맞바꾸면 안쪽 글자가 무너진다.
           그런 묶음은 고르기를 붙이지 않고 마우스 오버 반응만 남긴다 — 잘못된 선택 표시를 보여 주느니
           원본 그대로 두는 편이 낫다. */
        /* 안전 장치 — 두 상태의 '속 구조'가 똑같을 때만 맞바꾼다.
           층 선택 버튼처럼 선택 상태가 아예 다른 프레임으로 그려진 자리는 맞바꾸면 안쪽 글자가 무너지므로
           그 클릭은 무시하고 마우스 오버 반응만 남긴다(잘못된 선택 표시를 보여 주느니 원본 그대로가 낫다). */
        var shape = function (el) {
          /* ① 자기 자신이 이름 있는 프레임인가(층 선택은 선택 상태만 이름 없는 래퍼로 한 겹 더 싸여 있다)
             ② 흐름에 참여하는 자손 수(절대배치 덧칠 레이어는 겉모습일 뿐 구조가 아니다)
             ③ 자손 레이어명 목록 */
          return (el.dataset.name ? 'N' : '-') + '|'
            + all(el, '*').filter(function (x) { return getComputedStyle(x).position !== 'absolute'; }).length + '#'
            + all(el, '[data-name]').map(function (x) { return x.dataset.name; }).sort().join(',');
        };
        items.forEach(function (el) {
          var h = function () {
            if (el === cur || shape(el) !== shape(cur)) return;
            swapLook(el, cur);
            cur = el;
          };
          el.addEventListener('click', h);
          st.cleanup.push(function () { el.removeEventListener('click', h); });
        });
      });
    });
    /* 켜고 끄기 — 끄면 흐려지고, 다시 누르면 돌아온다 */
    TOGGLE_ITEMS.forEach(function (sel) {
      all(root, sel).forEach(function (el) {
        el.style.transition = 'opacity .2s ease, filter .2s ease';
        var on = true;
        var h = function () {
          on = !on;
          el.style.opacity = on ? '' : '.4';
          el.style.filter = on ? '' : 'grayscale(.7)';
          el.setAttribute('aria-pressed', on ? 'true' : 'false');
        };
        el.addEventListener('click', h);
        st.cleanup.push(function () { el.removeEventListener('click', h); el.style.opacity = ''; el.style.filter = ''; });
      });
    });
  }

  /* ══════════════════ 4-b. 프로토타입 상태 전환(변형 세트) ══════════════════
     층 선택(Map=1F~5F)과 카메라 프리셋(Step=00~06)은 Figma 원본이 상태마다 그림을 따로 갖고 있다.
     conv.js 가 그 상태들을 전부 심어 두고 하나만 보이게 해 두었으므로(data-hj-vset/​-variant),
     여기서는 '어느 것을 보일지'만 바꾼다 — 색이나 테두리를 흉내 내지 않으니 원본과 어긋날 일이 없다. */
  function installVariants(root, st) {
    var sets = {};
    all(root, '[data-hj-vset]').forEach(function (el) {
      (sets[el.dataset.hjVset] || (sets[el.dataset.hjVset] = [])).push(el);
    });

    /* 상태를 갈아 끼울 때 사람이 고친 글자는 따라가야 한다 — 같은 자리끼리 옮겨 준다 */
    var carryText = function (from, to) {
      if (!from || !to) return;
      var pick = function (el) {
        var list = one(el, '[data-name="List"]');
        return list ? Array.prototype.slice.call(list.children) : [];
      };
      var a = pick(from), b = pick(to);
      for (var i = 0; i < a.length && i < b.length; i++) {
        var pa = all(a[i], 'p'), pb = all(b[i], 'p');
        for (var j = 0; j < pa.length && j < pb.length; j++) pb[j].textContent = pa[j].textContent;
      }
    };

    var show = function (key, value) {
      var list = sets[key];
      if (!list) return;
      var cur = list.filter(function (e) { return !e.hasAttribute('hidden'); })[0];
      var next = list.filter(function (e) { return e.dataset.hjVariant === value; })[0];
      if (!next || next === cur) return;
      carryText(cur, next);
      next.removeAttribute('hidden');
      if (cur) cur.setAttribute('hidden', '');
      /* 새로 드러난 상태에도 호버·툴팁을 다시 걸어 준다 */
      try { markHot(root); } catch (e) { }
    };
    st.showVariant = show;

    /* 층 선택 — 줄을 누르면 그 층 상태로. 어느 층인지는 줄 안의 층 표시(5F/4F/…)에서 읽는다 */
    (sets.floor || []).forEach(function (v) {
      var list = one(v, '[data-name="List"]');
      if (!list) return;
      Array.prototype.forEach.call(list.children, function (row) {
        var chip = one(row, '[data-name="Floor"] p') || row.querySelector('p');
        var f = chip ? chip.textContent.trim() : '';
        if (!/^\d+F$/.test(f)) return;
        row.classList.add('hj-hot');
        if (getComputedStyle(row).position === 'static') row.style.position = 'relative';
        row.setAttribute('role', 'button');
        var h = function () { show('floor', f); };
        row.addEventListener('click', h);
        st.cleanup.push(function () { row.removeEventListener('click', h); });
      });
    });

    /* 카메라 프리셋 — 1~6번 버튼을 누르면 Step=01~06 */
    (sets.view || []).forEach(function (v) {
      all(v, '[data-name^="Button/View "]').forEach(function (btn) {
        var m = /Button\/View (\d)/.exec(btn.dataset.name || '');
        if (!m) return;
        btn.classList.add('hj-hot');
        if (getComputedStyle(btn).position === 'static') btn.style.position = 'relative';
        btn.setAttribute('role', 'button');
        var h = function () { show('view', '0' + m[1]); };
        btn.addEventListener('click', h);
        st.cleanup.push(function () { btn.removeEventListener('click', h); });
      });
    });
  }

  /* ══════════════════ 5. 이벤트 현황 접기/펼치기 ══════════════════
     원본은 패널(1840x330)이 bottom:-269px 로 내려가 머리글만 보이는 '접힌' 상태다.
     Fold 버튼을 누르면 269px 만큼 올라오며 표가 드러난다(화살표도 같이 뒤집힌다). */
  function installFold(root, st) {
    var panel = one(root, '[data-name="Event Log"]');
    if (!panel) return;
    panel.classList.add('hj-eventlog');
    var btn = one(root, '[data-name="Toolbar"] [data-node-id="65:3129"]')
      || one(root, '[data-name="Event Log"] [data-node-id="65:3129"]');
    if (!btn) {
      var img = one(panel, 'img[src*="property-1-up"]');
      btn = img && img.closest('div');
    }
    if (!btn) return;
    btn.classList.add('hj-hot', 'hj-foldbtn');
    if (getComputedStyle(btn).position === 'static') btn.style.position = 'relative';
    btn.setAttribute('role', 'button');
    btn.setAttribute('tabindex', '0');
    btn.setAttribute('aria-expanded', 'false');
    var toggle = function () {
      var open = panel.classList.toggle('hj-open');
      btn.classList.toggle('hj-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    var key = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } };
    btn.addEventListener('click', toggle);
    btn.addEventListener('keydown', key);
    st.cleanup.push(function () { btn.removeEventListener('click', toggle); btn.removeEventListener('keydown', key); });
  }

  /* ══════════════════ 6. 라이브 데이터 ══════════════════ */

  /* 6-a. 단계별 차량현황 / 도크 운영현황 등 '숫자 카드'
     원본 값을 기준으로 ±작은 폭으로만 흔든다(합계가 크게 어긋나 보이지 않게). */
  function collectCounters(root) {
    var out = [];
    var push = function (el, spread, min) {
      if (!el) return;
      var v = numOf(el.textContent);
      if (v == null) return;
      out.push({ el: el, base: v, cur: v, spread: spread, min: min == null ? 0 : min, src: el.textContent });
    };
    all(root, '[data-name^="Stage/"] [data-name="Value"] p, [data-name^="Stage/"] p[data-name="Value"]').forEach(function (el) { push(el, 0.16); });
    all(root, '[data-name^="Stage/"]').forEach(function (s) {
      var ps = all(s, 'p');
      if (ps.length >= 2) push(ps[ps.length - 1], 0.16);
    });
    all(root, '[data-name="Count Group"] [data-name="txt"] p').forEach(function (el, i) {
      if (numOf(el.textContent) != null) push(el, 6, 0);
    });
    all(root, '[data-name="Widget/Dock Operation"] [data-name="Value"] p').forEach(function (el) { push(el, 0.1); });
    all(root, '[data-name^="Item/"] [data-name="Measurement"] p').forEach(function (el) { push(el, 0.14); });
    /* 같은 요소가 두 번 잡히는 것 정리 */
    var seen = [];
    return out.filter(function (c) { if (seen.indexOf(c.el) >= 0) return false; seen.push(c.el); return true; });
  }

  function installCounters(root, st) {
    var cs = collectCounters(root);
    if (!cs.length) return;
    var step = function () {
      if (editing()) return;
      cs.forEach(function (c) {
        if (Math.random() > 0.35) return;
        var span = c.spread < 1 ? Math.max(1, c.base * c.spread) : c.spread;
        var target = clamp(c.base + rnd(-span, span), c.min, c.base + span * 1.6);
        if (c.base >= 1 && Math.abs(target - c.cur) < 0.5) return;
        var from = c.cur;
        c.cur = target;
        tween(900, from, target, function (v) { setNum(c.el, v, c.src); });
      });
    };
    var id = setInterval(step, 3200);
    setTimeout(step, 900);
    st.cleanup.push(function () { clearInterval(id); });
  }

  /* 6-b. 게이지(하차진척률) — 배경 호와 채움 호를 갈라 채움만 원뿔 마스크로 가린다.
     원본 meter.svg 의 호 중심은 뷰박스의 (47.59%, 50.41%), 9시 → 3시 180도 스윕. */
  var GAUGE_CX = 47.59, GAUGE_CY = 50.41, GAUGE_SWEEP = 180;
  function installGauge(root, st) {
    var meter = one(root, '[data-name="Meter"]');
    if (!meter) return;
    var img = meter.querySelector('img[src*="meter"]');
    if (!img) return;
    var box = img.parentElement;
    var base = img.getAttribute('src');
    var dir = base.slice(0, base.lastIndexOf('/') + 1);
    /* 원본 한 장 → 배경 호 + 채움 호 두 장으로(파일은 _gen/mk-gauge-assets.js 가 원본에서 떼어냈다) */
    var track = img;
    track.setAttribute('src', dir + 'meter-track.svg');
    var fill = img.cloneNode(false);
    fill.setAttribute('src', dir + 'meter-fill.svg');
    fill.id = (img.id || 'hj-meter') + '-fill';
    fill.classList.add('hj-meterfill');
    fill.style.position = 'absolute';
    fill.style.left = '0'; fill.style.top = '0';
    fill.style.width = '100%'; fill.style.height = '100%';
    if (getComputedStyle(box).position === 'static') box.style.position = 'relative';
    box.appendChild(fill);

    /* 값 표시: 콜아웃 65% · 오늘 806/1,240 65% */
    var callout = one(root, '[data-name="Callout"]');
    var coVal = callout && callout.querySelector('[data-name="Value"] p, p');
    var todayRow = one(root, '[data-name="Compare"] [data-name="List"]');
    var todayNums = todayRow ? all(todayRow, 'p').filter(function (p) { return numOf(p.textContent) != null; }) : [];
    if (callout) {
      callout.classList.add('hj-callout');
      st.calloutBase = { x: callout.offsetLeft, y: callout.offsetTop };
    }

    var v0 = coVal ? (numOf(coVal.textContent) || 65) / 100 : 0.65;
    var cur = v0;
    var setV = function (v) {
      var deg = GAUGE_SWEEP * clamp(v, 0, 1) + 3;    /* +3deg 여유 — 정지 상태에서 원본 호가 잘리지 않게 */
      var m = 'conic-gradient(from 270deg at ' + GAUGE_CX + '% ' + GAUGE_CY + '%,#000 0deg,#000 '
        + deg.toFixed(2) + 'deg,transparent ' + deg.toFixed(2) + 'deg,transparent 360deg)';
      fill.style.webkitMaskImage = m;
      fill.style.maskImage = m;
      if (coVal) setNum(coVal, v * 100, coVal.dataset.hjSrc || (coVal.dataset.hjSrc = coVal.textContent));
      if (callout && st.calloutBase) {
        /* 콜아웃은 호 끝을 따라간다 — 기준값(v0)일 때의 자리에서 각도 차이만큼 돌린다 */
        var mb = meter.getBoundingClientRect();
        var R = mb.width * 0.46;
        var a0 = Math.PI * (1 + v0), a1 = Math.PI * (1 + clamp(v, 0, 1));
        var dx = R * (Math.cos(a1) - Math.cos(a0)), dy = R * (Math.sin(a1) - Math.sin(a0));
        callout.style.translate = dx.toFixed(1) + 'px ' + dy.toFixed(1) + 'px';
      }
      if (todayNums.length >= 2) {
        var total = numOf(todayNums[1].textContent) || 1240;
        setNum(todayNums[0], Math.round(total * v), todayNums[0].dataset.hjSrc || (todayNums[0].dataset.hjSrc = todayNums[0].textContent));
        if (todayNums[2]) setNum(todayNums[2], v * 100, todayNums[2].dataset.hjSrc || (todayNums[2].dataset.hjSrc = todayNums[2].textContent));
      }
    };
    setV(v0);
    var step = function () {
      if (editing()) return;
      var to = clamp(v0 + rnd(-0.06, 0.09), 0.12, 0.97);
      var from = cur; cur = to;
      tween(1600, from, to, setV);
    };
    var id = setInterval(step, 5200);
    setTimeout(step, 1800);
    st.cleanup.push(function () { clearInterval(id); });
  }

  /* 6-c. 요일별 하차물량(세로 막대) · 층별 차량현황(가로 막대) */
  function installBars(root, st) {
    var vbars = all(root, '[data-name^="Bar/"]');
    vbars.forEach(function (b) { b.classList.add('hj-bar'); b.style.transformOrigin = 'bottom center'; });
    var hbars = all(root, '[data-name="Bar Row"] [data-name="Bar"]');
    hbars.forEach(function (b) { b.classList.add('hj-hbar'); b.style.transformOrigin = 'left center'; });
    if (!vbars.length && !hbars.length) return;
    var step = function () {
      if (editing()) return;
      vbars.forEach(function (b) {
        if (Math.random() > 0.55) return;
        b.style.transform = 'scaleY(' + rnd(0.86, 1.13).toFixed(3) + ')';
      });
      hbars.forEach(function (b) {
        if (Math.random() > 0.5) return;
        b.style.transform = 'scaleX(' + rnd(0.88, 1.1).toFixed(3) + ')';
      });
    };
    var id = setInterval(step, 3600);
    setTimeout(step, 1400);
    st.cleanup.push(function () {
      clearInterval(id);
      vbars.concat(hbars).forEach(function (b) { b.style.transform = ''; });
    });
  }

  /* 6-d. 도넛 차트 — 조각 그림(원본 SVG)은 그대로 두고 각도만 아주 조금 돌린다.
     모양을 다시 그리지 않으므로 원본 색·굵기가 유지되면서 '값이 갱신된' 느낌만 난다. */
  function installDonuts(root, st) {
    var plots = all(root, '[data-name="Donut Chart"] [data-name="Data"]');
    if (!plots.length) return;
    plots.forEach(function (p) { p.classList.add('hj-donut'); p.style.transformOrigin = '50% 50%'; });
    var step = function () {
      if (editing()) return;
      plots.forEach(function (p) {
        if (Math.random() > 0.6) return;
        p.style.transform = 'rotate(' + rnd(-9, 9).toFixed(2) + 'deg)';
      });
    };
    var id = setInterval(step, 4200);
    setTimeout(step, 2200);
    st.cleanup.push(function () { clearInterval(id); plots.forEach(function (p) { p.style.transform = ''; }); });
  }

  /* 6-e. 나침반(통합관제) — 방위 숫자와 바늘이 함께 돈다 */
  function installCompass(root, st) {
    var box = one(root, '[data-name="Compass"]');
    if (!box) return;
    var val = all(box, 'p').filter(function (p) { return numOf(p.textContent) != null; })[0];
    var needle = one(box, '[data-name="Needle"]') || one(box, '[data-name="Pointer"]');
    if (!val) return;
    var base = numOf(val.textContent) || 273, cur = base;
    var src = val.textContent;
    var setA = function (a) {
      setNum(val, Math.round((a % 360 + 360) % 360), src);
      if (needle) needle.style.rotate = (a - base).toFixed(2) + 'deg';
    };
    if (needle) needle.style.transition = 'rotate 1.4s cubic-bezier(.32,.72,.28,1)';
    var step = function () {
      if (editing()) return;
      var to = base + rnd(-14, 14);
      var from = cur; cur = to;
      tween(1400, from, to, setA);
    };
    var id = setInterval(step, 6000);
    st.cleanup.push(function () { clearInterval(id); if (needle) needle.style.rotate = ''; });
  }

  /* 6-f. 이벤트 피드 — Auto 가 켜져 있을 때만 표에 새 줄이 흘러든다 */
  var SYSTEMS = ['DMS', 'WMS', 'TMS', 'PLC', 'AGV', 'SCADA', 'DOCK', 'GATE'];
  var TYPES = ['통신', '설비', '작업', '지연', '온도', '진동', '적재'];
  var MSGS = [
    '하차도크 A-{n} 접안 완료', '간선차량 {v} 허브 인접', '{d} 도크 작업 지연 감지',
    '{v} 입문 처리 완료', '상차도크 B-{n} 대기 전환', '{d} 통신 재연결', '{v} 마감시간 임박',
    '5층 대기장 잔여 {n}대', '램프 구간 혼잡 해소', '{d} 센서 값 정상 복귀',
  ];
  var PLATES = ['대전87아3669', '경기91아9122', '대전88아8539', '서울98바7682', '경기99사8783'];
  function installFeed(root, st) {
    var body = one(root, '[data-name="Event Log"] [data-name="Body"]');
    var rows = body ? all(body, '[data-name="Row"]') : [];
    if (rows.length < 2) return;
    var auto = one(root, '[data-name="Auto Toggle"]');
    var radio = auto && one(auto, '[data-name="Radio"]');
    var on = true;
    if (auto) {
      auto.classList.add('hj-hot');
      if (getComputedStyle(auto).position === 'static') auto.style.position = 'relative';
      auto.setAttribute('role', 'switch');
      /* 라디오는 Figma 원본 컴포넌트(65:3214)의 boolean=off / boolean=on 두 그림을 그대로 바꿔 끼운다.
         밝기로 흉내 내지 않으므로 켜짐 표시(가운데 파란 점)가 원본과 같다. */
      var img = radio && radio.querySelector('img');
      var offSrc = img && img.getAttribute('src');
      var onSrc = offSrc && offSrc.replace(/radio(-lt)?\.svg/, 'radio-on$1.svg');
      var label = one(auto, '[data-name="Label"]') || all(auto, 'p').slice(-1)[0];
      var paint = function () {
        auto.setAttribute('aria-checked', on ? 'true' : 'false');
        if (img && onSrc) img.setAttribute('src', on ? onSrc : offSrc);
        if (label) { label.style.transition = 'opacity .2s ease'; label.style.opacity = on ? '1' : '.55'; }
      };
      var t = function () { on = !on; paint(); };
      auto.addEventListener('click', t);
      paint();
      st.cleanup.push(function () {
        auto.removeEventListener('click', t);
        if (img && offSrc) img.setAttribute('src', offSrc);
        if (label) label.style.opacity = '';
      });
    }
    /* 각 행의 칸: list01(등급 배지) list02(시간) list02(건수) list03(시스템) list04(유형) list06(메시지) */
    var cells = function (row) { return all(row, '[data-name^="list"]'); };
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var fill = function (row, ev) {
      var c = cells(row);
      var put = function (i, txt) {
        var p = c[i] && c[i].querySelector('p');
        if (p) p.textContent = txt;
      };
      put(1, ev.time); put(2, ev.count); put(3, ev.sys); put(4, ev.type); put(5, ev.msg);
      var badge = c[0] && c[0].querySelector('p');
      if (badge) badge.textContent = ev.grade;
      row.classList.remove('hj-newrow');
      void row.offsetWidth;
      row.classList.add('hj-newrow');
    };
    /* 표 머리글 — 원본 Figma 는 아직 'txt' 자리표시자다. 레이어명(Th/Time·Th/Count·Th/System·Th/Type)이
       각 칸의 뜻을 그대로 담고 있으므로, 라이브를 켤 때 그 이름대로 채운다(지어내지 않는다).
       재구축 자체는 원본 그대로 두고, 이 치환은 인터랙션 레이어에서만 일어난다. */
    var HEAD = { 'Th/Time': '발생시각', 'Th/Count': '발생건수', 'Th/System': '시스템', 'Th/Type': '유형' };
    var head = one(root, '[data-name="Event Log"] [data-name="Header Row"]');
    if (head) {
      Object.keys(HEAD).forEach(function (k) {
        var cell = head.querySelector('[data-name="' + k + '"] p');
        if (cell && cell.textContent.trim() === 'txt') cell.textContent = HEAD[k];
      });
    }
    var seq = 0;
    var make = function () {
      var d = new Date();
      var grades = ['Critical', 'Major', 'Minor', 'Warning', 'Normal', 'Normal', 'Normal'];
      return {
        grade: grades[(Math.random() * grades.length) | 0],
        time: pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()),
        count: String(1 + ((Math.random() * 9) | 0)),
        sys: SYSTEMS[(Math.random() * SYSTEMS.length) | 0],
        type: TYPES[(Math.random() * TYPES.length) | 0],
        msg: MSGS[(Math.random() * MSGS.length) | 0]
          .replace('{n}', String(1 + ((Math.random() * 20) | 0)))
          .replace('{v}', PLATES[(Math.random() * PLATES.length) | 0])
          .replace('{d}', 'D-' + (10 + ((Math.random() * 40) | 0))),
      };
    };
    var push = function () {
      if (!on || editing()) return;
      /* 아래로 한 칸씩 밀고 맨 위에 새 이벤트 */
      for (var i = rows.length - 1; i > 0; i--) {
        var from = cells(rows[i - 1]), to = cells(rows[i]);
        for (var j = 0; j < to.length && j < from.length; j++) {
          var pf = from[j].querySelector('p'), pt = to[j].querySelector('p');
          if (pf && pt) pt.textContent = pf.textContent;
        }
      }
      fill(rows[0], make());
      seq++;
    };
    /* 켜져 있으면 여섯 줄을 한 번에 채워 두고(빈 표로 시작하면 미완성처럼 보인다),
       그 뒤로는 위에서부터 한 줄씩 흘러든다 */
    var seed = function () {
      if (!on || editing()) return;
      for (var i = rows.length - 1; i >= 0; i--) {
        var ev = make();
        var back = new Date(Date.now() - (i + 1) * 37000);
        ev.time = pad(back.getHours()) + ':' + pad(back.getMinutes()) + ':' + pad(back.getSeconds());
        fill(rows[i], ev);
      }
    };
    var id = setInterval(push, 4800);
    setTimeout(seed, 700);
    st.cleanup.push(function () { clearInterval(id); });
  }

  /* 6-g. 도크 상세현황 — 슬롯 위에 올리면 툴팁이 그 자리로 따라간다 */
  function installDockTooltip(root, st) {
    var tip = one(root, '[data-name="Tooltip/Dock Info"]');
    var slots = all(root, '[data-name="Dock Slot"]');
    if (!tip || !slots.length) return;
    tip.style.transition = 'left .28s cubic-bezier(.32,.72,.28,1),top .28s cubic-bezier(.32,.72,.28,1),opacity .2s ease';
    var rows = all(tip, '[data-name^="Row/"]');
    var setRow = function (i, txt) {
      var ps = rows[i] ? all(rows[i], 'p') : [];
      if (ps.length >= 2) ps[1].textContent = txt;
    };
    var close = one(tip, '[data-name="Button/Close"]');
    if (close) {
      close.classList.add('hj-hot');
      var hide = function (e) { e.stopPropagation(); tip.style.opacity = '0'; tip.style.pointerEvents = 'none'; };
      close.addEventListener('click', hide);
      st.cleanup.push(function () { close.removeEventListener('click', hide); });
    }
    /* 칸마다 차량·샤시번호를 '한 번만' 정해 둔다 — 올릴 때마다 새로 뽑으면 같은 칸인데 번호가 달라지고,
       검색창이 찾을 대상도 없어진다(번호는 시안용 표본이라 칸 순서로 고르게 나눈다). */
    slots.forEach(function (s, i) {
      if (s.dataset.hjPlate) return;
      s.dataset.hjPlate = PLATES[i % PLATES.length];
      s.dataset.hjChassis = '충남' + (10 + (i * 7) % 80) + '아' + (1000 + (i * 613) % 8000);
      s.dataset.hjNext = PLATES[(i + 2) % PLATES.length];
    });
    slots.forEach(function (s) {
      var enter = function () {
        var rb = root.getBoundingClientRect(), r = s.getBoundingClientRect();
        var sc = rb.width ? (root.offsetWidth / rb.width) : 1;
        var x = (r.left - rb.left) * sc + 18, y = (r.top - rb.top) * sc - 8;
        tip.style.opacity = '1'; tip.style.pointerEvents = '';
        tip.style.left = clamp(x, 8, root.offsetWidth - tip.offsetWidth - 8) + 'px';
        tip.style.top = clamp(y - tip.offsetHeight, 8, root.offsetHeight - tip.offsetHeight - 8) + 'px';
        var nm = s.querySelector('[data-name="Num"] p');
        var label = all(s, 'p').slice(-1)[0];
        setRow(0, '하차 ' + (nm ? nm.textContent.trim() : '-'));
        setRow(1, s.dataset.hjPlate || '-');
        setRow(2, s.dataset.hjChassis || '-');
        setRow(3, s.dataset.hjNext || '-');
        if (label) { /* 라벨은 참고용 — 표시 문구는 위에서 채운다 */ }
      };
      s.addEventListener('mouseenter', enter);
      st.cleanup.push(function () { s.removeEventListener('mouseenter', enter); });
    });
  }

  /* ══════════════════ 6-h. 헤더 메뉴 — 화면 이동 ══════════════════
     · `대시보드` → 통합관제(메인) 화면
     · `통합관제` → 드롭다운 펼치기/접기. 하위 화면에는 원본에 드롭다운이 없어 conv.js 가 메인 것을
       그대로 옮겨 심어 두었다(`data-hj-graft="dropdown"`), 메인 화면 것은 원본대로 늘 펼쳐 둔다.
     · 드롭다운 항목 → 그 화면으로. 아직 시안이 없는 `상차현황`·`차량관제` 는 눌러도 안 움직인다.
     스튜디오 안에서는 window.__openHanjinScreen 이, 낱장으로 열었을 때는 파일 이동이 맡는다. */
  var PAGE = { main: 'control.html', gate: 'gate.html', unload: 'unload.html' };
  var MENU_LINKS = [
    { t: '하차현황', to: 'unload', tip: '하차현황 대시보드로 이동' },
    { t: '입문현황', to: 'gate', tip: '입/출문현황 대시보드로 이동' },
    { t: '상차현황', to: null, tip: '상차현황 대시보드는 아직 준비 중입니다' },
    { t: '차량관제', to: null, tip: '차량관제 대시보드는 아직 준비 중입니다' },
  ];

  function screenOf(root) {
    var s = one(root, '[data-name^="Screen/"]');
    var n = (s && s.dataset.name) || '';
    return n.indexOf('Gate') >= 0 ? 'gate' : n.indexOf('Unload') >= 0 ? 'unload' : 'main';
  }
  function navigate(to, cur) {
    if (!to || to === cur) return;
    if (typeof window.__openHanjinScreen === 'function') { window.__openHanjinScreen(to); return; }
    if (PAGE[to]) window.location.href = './' + PAGE[to];
  }

  function installMenu(root, st) {
    var cur = screenOf(root);
    var dd = one(root, '[data-name="Menu/Dropdown"]');
    var graft = !!(dd && dd.dataset.hjGraft === 'dropdown');
    var bind = function (el, ev, fn) {
      el.addEventListener(ev, fn);
      st.cleanup.push(function () { el.removeEventListener(ev, fn); });
    };

    /* 통합관제 — 옮겨 심은 드롭다운을 펼쳤다 접는다 */
    var tab = one(root, '[data-name^="Menu Item/Control Tower"]');
    if (tab && dd && graft) {
      tab.classList.add('hj-hot', 'hj-soft');
      tab.setAttribute('role', 'button');
      tab.setAttribute('tabindex', '0');
      tab.setAttribute('aria-expanded', 'false');
      tab.title = '통합관제 메뉴';
      if (getComputedStyle(tab).position === 'static') tab.style.position = 'relative';
      var toggle = function (e) {
        if (e) e.stopPropagation();
        var open = dd.hasAttribute('hidden');
        if (open) dd.removeAttribute('hidden'); else dd.setAttribute('hidden', '');
        tab.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open && st.fit) st.fit();          /* 펼치는 순간 탭 바로 아래로 자리를 맞춘다 */
      };
      bind(tab, 'click', toggle);
      bind(tab, 'keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
      var away = function (e) {
        if (dd.hasAttribute('hidden') || dd.contains(e.target) || tab.contains(e.target)) return;
        dd.setAttribute('hidden', ''); tab.setAttribute('aria-expanded', 'false');
      };
      document.addEventListener('click', away);
      st.cleanup.push(function () { document.removeEventListener('click', away); });
    }

    /* 대시보드 — 통합관제(메인) 화면으로 */
    var home = one(root, '[data-name="Menu Item/Dashboard"]');
    if (home && cur !== 'main') {
      home.classList.add('hj-hot', 'hj-soft');
      home.setAttribute('role', 'button');
      home.setAttribute('tabindex', '0');
      home.title = '통합관제 대시보드로 이동';
      if (getComputedStyle(home).position === 'static') home.style.position = 'relative';
      var go = function (e) { if (e) { e.preventDefault(); e.stopPropagation(); } navigate('main', cur); };
      bind(home, 'click', go);
      bind(home, 'keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    }

    if (!dd) return;
    /* 드롭다운 항목 — 갈 수 있는 곳만 연결하고, 아직 없는 화면은 막는다 */
    var items = all(dd, '[data-name^="Menu Item/"]');
    items.forEach(function (it) {
      var txt = (it.textContent || '').replace(/\s/g, '');
      var L = null;
      MENU_LINKS.forEach(function (m) { if (txt.indexOf(m.t) >= 0) L = m; });
      if (!L) return;
      it.title = L.tip;
      it.__hjTo = L.to;
      if (!L.to) {                                   /* 준비 중 — 눌러도 안 움직인다 */
        it.classList.add('hj-off');
        it.setAttribute('aria-disabled', 'true');
        bind(it, 'click', function (e) { e.preventDefault(); e.stopPropagation(); });
        return;
      }
      it.classList.add('hj-hot');
      it.setAttribute('role', 'button');
      bind(it, 'click', function (e) { e.preventDefault(); e.stopPropagation(); navigate(L.to, cur); });
    });

    /* 옮겨 심은 드롭다운은 메인 화면 것이라 '하차현황'에 선택 표시가 박혀 있다 →
       지금 보고 있는 화면의 항목으로 옮긴다(표시 모습은 원본 그대로). */
    if (!graft) return;
    var want = null;
    items.forEach(function (it) { if (it.__hjTo === cur) want = it; });
    if (!want) return;
    items.forEach(function (it) {
      var baked = (it.dataset.name || '').indexOf('(Selected)') >= 0;
      if (it === want) it.classList.add('hj-cur');
      else if (baked) it.classList.add('hj-uncur');
    });
  }

  /* ══════════════════ 6-i. 검색창 ══════════════════
     원본의 Field 는 글자를 그려 둔 자리다. 그 <p> 를 그대로 칠 수 있게 만든다
     (<input> 을 새로 얹으면 글꼴·자간·정렬이 원본과 어긋난다).
     안내 문구는 ::before 로 그리므로 빈칸일 때의 그림은 Figma 원본과 같다.
       · 표가 있는 판(입출문현황) : 안 맞는 줄을 감춘다
       · 도크 판(하차현황)        : 맞는 칸·대기 순번을 밝히고 나머지를 뒤로 물린다 */
  function installSearch(root, st) {
    all(root, '[data-name="Field"]').forEach(function (field) {
      var ph = one(field, '[data-name="Placeholder"]');
      if (!ph) return;
      var box = ph.parentElement;                    /* Input — 글자가 들어갈 칸 */
      var hint = (ph.textContent || '').trim();
      var baseW = ph.getBoundingClientRect().width;
      ph.dataset.hjHint = hint;
      ph.textContent = '';
      ph.classList.add('hj-input');
      ph.setAttribute('role', 'searchbox');
      ph.setAttribute('spellcheck', 'false');
      ph.setAttribute('aria-label', hint);
      try { ph.setAttribute('contenteditable', 'plaintext-only'); } catch (e) { ph.setAttribute('contenteditable', 'true'); }
      field.classList.add('hj-searchbox');

      /* 칸이 90px 로 박혀 있어 긴 번호를 치면 넘친다 → 치는 동안만 Input 안쪽만큼 넓힌다
         (빈칸으로 돌아오면 원본 크기 그대로 — 가만히 있을 때의 그림은 Figma 와 픽셀 동일) */
      var fit = function () {
        var room = box ? box.clientWidth - 12 : baseW;
        ph.style.width = ph.textContent ? Math.max(baseW, room) + 'px' : '';
      };

      var scope = field.closest('[data-name^="Widget/"]') || field.closest('[data-name^="Section/"]') || root;
      var rows = all(scope, '[data-name="Body"] > [data-name="Row"]');
      var marks = rows.length ? [] : all(root, '[data-name="Dock Slot"]')
        .concat(all(root, '[data-name="Priority Queue"] [data-name="List"] > *'));

      var run = function () {
        var q = (ph.textContent || '').replace(/\s/g, '');
        field.classList.toggle('hj-on', !!q);
        var hit = 0;
        if (rows.length) {                           /* 표 — 안 맞는 줄을 감춘다 */
          rows.forEach(function (r) {
            var ok = !q || (r.textContent || '').replace(/\s/g, '').indexOf(q) >= 0;
            r.style.display = ok ? '' : 'none';
            if (ok && q) hit++;
          });
        } else {                                     /* 도크 판 — 맞는 칸을 밝힌다 */
          marks.forEach(function (el) {
            var hay = (el.dataset.hjPlate || '') + (el.dataset.hjChassis || '')
              + (el.textContent || '').replace(/\s/g, '');
            var ok = !q || hay.indexOf(q) >= 0;
            el.classList.toggle('hj-dim', !!q && !ok);
            if (q && ok) { hit++; el.classList.remove('hj-find'); void el.offsetWidth; el.classList.add('hj-find'); }
            else el.classList.remove('hj-find');
          });
        }
        field.classList.toggle('hj-nohit', !!q && !hit);
      };

      var timer = null;
      var later = function () { clearTimeout(timer); timer = setTimeout(function () { fit(); run(); }, 160); };
      var now = function (e) { if (e) e.preventDefault(); clearTimeout(timer); fit(); run(); };
      var focus = function () { ph.focus(); };
      var keys = function (e) {
        if (e.key === 'Enter') { e.preventDefault(); now(); ph.blur(); return; }
        if (e.key === 'Escape') { ph.textContent = ''; now(); ph.blur(); }
      };
      var btn = one(field, '[data-name^="Button/Search"]');
      if (btn) { btn.classList.add('hj-hot'); btn.setAttribute('role', 'button'); btn.title = '검색'; }
      ph.addEventListener('input', later);
      ph.addEventListener('keydown', keys);
      field.addEventListener('click', focus);
      if (btn) btn.addEventListener('click', now);
      st.cleanup.push(function () {
        clearTimeout(timer);
        ph.removeEventListener('input', later); ph.removeEventListener('keydown', keys);
        field.removeEventListener('click', focus); if (btn) btn.removeEventListener('click', now);
        ph.removeAttribute('contenteditable'); ph.classList.remove('hj-input');
        ph.style.width = ''; if (!ph.textContent) ph.textContent = hint;
      });
    });
  }

  /* ══════════════════ 6-j. GS 차량 — 라디오처럼 켜고 끈다 ══════════════════
     원본에 '켜짐' 그림이 없어 같은 파일이 이미 쓰는 라디오 표시를 그대로 얹었다
     (box-on.svg = box.svg + 가운데 점, 메인 화면의 radio-on.svg 와 같은 색·같은 비율). */
  function installRadioChip(root, st) {
    all(root, '[data-name="Checkbox/GS Vehicle"]').forEach(function (chip) {
      var img = one(chip, '[data-name="Box"] img');
      if (!img) return;
      var off = img.getAttribute('src');
      var on = off.replace(/box(-lt)?\.svg$/, 'box-on$1.svg');
      if (on === off) return;
      chip.classList.add('hj-hot', 'hj-soft');
      chip.setAttribute('role', 'radio');
      chip.setAttribute('tabindex', '0');
      chip.setAttribute('aria-checked', 'false');
      chip.title = 'GS 차량만 보기';
      if (getComputedStyle(chip).position === 'static') chip.style.position = 'relative';
      var flip = function (e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        var next = chip.getAttribute('aria-checked') !== 'true';
        chip.setAttribute('aria-checked', next ? 'true' : 'false');
        img.setAttribute('src', next ? on : off);
      };
      chip.addEventListener('click', flip);
      var key = function (e) { if (e.key === 'Enter' || e.key === ' ') flip(e); };
      chip.addEventListener('keydown', key);
      st.cleanup.push(function () {
        chip.removeEventListener('click', flip); chip.removeEventListener('keydown', key);
        img.setAttribute('src', off);
      });
    });
  }

  /* ══════════════════ 7. 설치 ══════════════════ */
  function initHanjin(root) {
    if (!root) return;
    if (root.__hjLive) disposeHanjin(root);
    injectStyle();
    root.classList.add('hj-root');
    var st = { cleanup: [] };
    root.__hjLive = st;
    try { installFit(root, st); } catch (e) { }
    try { markHot(root); } catch (e) { }
    try { installClock(root, st); } catch (e) { }
    try { installSelect(root, st); } catch (e) { }
    try { installVariants(root, st); } catch (e) { }
    try { installFold(root, st); } catch (e) { }
    try { installCounters(root, st); } catch (e) { }
    try { installGauge(root, st); } catch (e) { }
    try { installBars(root, st); } catch (e) { }
    try { installDonuts(root, st); } catch (e) { }
    try { installCompass(root, st); } catch (e) { }
    try { installFeed(root, st); } catch (e) { }
    try { installDockTooltip(root, st); } catch (e) { }
    try { installMenu(root, st); } catch (e) { }
    try { installSearch(root, st); } catch (e) { }
    try { installRadioChip(root, st); } catch (e) { }
    return st;
  }

  function disposeHanjin(root) {
    var st = root && root.__hjLive;
    if (!st) return;
    st.cleanup.forEach(function (f) { try { f(); } catch (e) { } });
    root.__hjLive = null;
  }

  window.initHanjin = initHanjin;
  window.disposeHanjin = disposeHanjin;
  /* 스튜디오가 창 크기를 바꾼 뒤 다시 맞추라고 부를 수 있게 */
  window.refitHanjin = function (root) { var st = root && root.__hjLive; if (st && st.fit) st.fit(); };
})();
