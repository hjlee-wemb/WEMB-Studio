/* LS Electric STATCOM — 재구축 화면(Screen/STATCOM Overview 3:5 · Screen/Data Center Overview 33:748)의
   인터랙션 · 라이브 · 반응형 레이어.  window.initLsElectric(root) / window.disposeLsElectric(root)

   화면(DOM·CSS)은 생성기(src/lselectric/_gen/conv.js)가 Figma 그대로 만든다. 이 파일은 그 위에
   '움직이는 것'만 얹는다 — 형상·색·자리는 건드리지 않는다(정지 상태 = Figma 원본).

   · 반응형 — 1920x1080 좌표계는 그대로 두고 균일 배율 S 로 키운 뒤, 남는 폭·높이(exW·exH)를
     블록에 나눠 준다(헤더·알림 목록은 폭까지, 좌측 판은 제자리, 우측 판은 오른쪽 끝, 판 바탕은 아래로 늘림).
     통짜 축소가 아니라서 여백이 남지 않고, 비율을 무시하고 늘이지 않아 원형이 타원이 되지 않는다.
     정확히 16:9 면 늘어난 몫이 0 이라 Figma 와 같은 그림이다.
   · 실시간 시계 · 날씨 갱신 시각 · 알림 목록 발생시각(열 때마다 최근으로) · 알림 피드
   · 마우스 오버 · 눌림(헤더 액션 · 접기 · 검색 · 자산 필터 · 상태 배지 · 보기 모드 · 내비 · 등급 칩 · 표 줄)
   · 접기/펴기 — 알림 목록(Btn) · 좌측/우측 판(Fold Button)
   · 라이브 수치 — 전압 · 전류 · 배터리 · 날씨(원본 값 언저리에서 흔들린다)
   · 차트 바꾸기(패널편집 중) — 위젯마다 이 프로젝트(변전·STATCOM·전원)에 맞는 차트를 추천하고 바꾼다
   · 패널 옮기기(패널편집 중) — 좌측 위젯은 끌어 놓으면 순서가 바뀌며 나머지가 흘러 자리를 잡고,
     우측 위젯은 자유롭게 옮긴다(4px 격자). 장면별로 저장, '배치 초기화'로 되돌린다.
   · 라이트 테마 — 원본은 다크. 형상은 그대로, 판·글자 색만 밝은 판에 맞게 다시 적는다(대비 확인).

   손으로 쓴 파일이다(생성물 아님). 고친 뒤 studio.html 의 ?v= 를 올릴 것. */
(function () {
  'use strict';

  var BASE_W = 1920, BASE_H = 1080;
  var LS_MOVE = 'wemb-lselectric-move';
  var LS_ORDER = 'wemb-lselectric-order';
  var LS_CHART = 'wemb-lselectric-chart';
  var LS_FOLD = 'wemb-lselectric-fold';

  /* ══════════════════ 스타일 ══════════════════ */
  var STYLE_ID = 'lselectric-live-style';
  var CSS = [
    /* 블록 이동은 전부 CSS translate 속성 하나로 모은다 — 원본 transform(translateX(-50%) 등)을 덮지 않으려고.
       --ls-tx/ty = 반응형, --ls-fx = 판 접기, --ls-mx/my = 패널편집 이동 */
    '.ls-root .ls-blk{translate:calc(var(--ls-tx,0px) + var(--ls-fx,0px) + var(--ls-mx,0px)) calc(var(--ls-ty,0px) + var(--ls-my,0px));}',
    '.ls-root .ls-mv:not(.ls-blk){translate:var(--ls-mx,0px) var(--ls-my,0px);}',
    '.ls-root.ls-live .ls-blk,.ls-root.ls-live .ls-mv{transition:translate .55s cubic-bezier(.22,.8,.24,1),opacity .4s ease,width .45s cubic-bezier(.22,.8,.24,1),height .45s cubic-bezier(.22,.8,.24,1),bottom .45s cubic-bezier(.22,.8,.24,1);}',
    '.ls-root.ls-resizing .ls-blk,.ls-root.ls-resizing .ls-mv,.ls-root .ls-dragging{transition:none!important;}',
    '.ls-root [data-name^="Screen/"]{background:transparent!important;}',
    /* overflow:hidden 은 스크립트 스크롤을 받는다 — 접힌 판이 밖으로 나간 채 초점·scrollIntoView 가 오면
       화면 전체가 옆으로 밀렸다(실측 322px). clip 은 스크롤 상자가 아니라서 밀리지 않는다. */
    '.ls-root{overflow:clip!important;}',
    '.ls-root .ls-bgimg{object-fit:cover;}',

    /* ── 판 접기 ── */
    '.ls-root.ls-fold-L .ls-blk[data-ls-grp="L"]:not(.ls-foldbtn){--ls-fx:-360px;opacity:0;pointer-events:none;}',
    '.ls-root.ls-fold-L .ls-foldbtn[data-ls-grp="L"]{--ls-fx:-268px;}',
    '.ls-root.ls-fold-R .ls-blk[data-ls-grp="R"]:not(.ls-foldbtn):not(.ls-keep){--ls-fx:360px;opacity:0;pointer-events:none;}',
    '.ls-root.ls-fold-R .ls-foldbtn[data-ls-grp="R"]{--ls-fx:268px;}',
    '.ls-root .ls-foldbtn [data-name="Icon/Action/Fold"]{transition:rotate .45s cubic-bezier(.22,.8,.24,1);}',
    '.ls-root.ls-fold-L .ls-foldbtn[data-ls-grp="L"] [data-name="Icon/Action/Fold"],.ls-root.ls-fold-R .ls-foldbtn[data-ls-grp="R"] [data-name="Icon/Action/Fold"]{rotate:180deg;}',

    /* ── '여기 눌린다' ── */
    '.ls-root .ls-click{cursor:pointer;}',
    '.ls-root .ls-click *{cursor:inherit;}',
    '.dt-content-editing .ls-root .ls-click,.dt-content-editing .ls-root .ls-click *{cursor:text;}',
    '.ls-root .ls-click:focus-visible{outline:2px solid #45c5ff;outline-offset:2px;}',

    /* 헤더 액션 아이콘 */
    '.ls-root [data-name="Actions"] > [data-name^="Icon/Action/"]{transition:scale .2s ease,filter .2s ease;}',
    '.ls-root [data-name="Actions"] > [data-name^="Icon/Action/"]:hover{scale:1.14;filter:brightness(1.25) drop-shadow(0 0 6px rgba(69,197,255,.85));}',
    '.ls-root [data-name="Actions"] > [data-name^="Icon/Action/"]:active{scale:.94;}',
    /* 접기 · 검색 단추(원본 파란 그라디언트) — 밝아지고 빛이 번진다 */
    '.ls-root [data-name="Fold Button"],.ls-root [data-name="Search Button"]{transition:filter .2s ease,box-shadow .2s ease;}',
    '.ls-root .ls-foldbtn:hover [data-name="Fold Button"],.ls-root [data-name="Search Button"]:hover{filter:brightness(1.22);box-shadow:0 0 12px rgba(69,140,255,.75);}',
    '.ls-root .ls-foldbtn:active [data-name="Fold Button"],.ls-root [data-name="Search Button"]:active{filter:brightness(.92);}',
    /* 자산 필터 단추 — 테두리가 #45c5ff(원본 알림 칩 호버색)로, 누르면 원본 파란 그라디언트로 켜진다 */
    '.ls-root [data-name^="Button/"]{transition:border-color .2s ease,box-shadow .2s ease;}',
    '.ls-root [data-name^="Button/"] > div{transition:background .25s ease,box-shadow .25s ease;}',
    '.ls-root [data-name^="Button/"]:hover{border-color:#45c5ff;box-shadow:0 0 10px rgba(69,197,255,.35);}',
    '.ls-root [data-name^="Button/"]:hover > div:last-child{box-shadow:inset 0 0 10px 0 rgba(69,197,255,.55);}',
    '.ls-root [data-name^="Button/"].ls-on{border-color:#45c5ff;}',
    '.ls-root [data-name^="Button/"].ls-on > div:first-child{background:linear-gradient(90deg,#2861ff 0%,#455ddb 100%);}',
    /* 센서 · 상태 배지 */
    '.ls-root [data-name="Widget/Sensor Status"] [data-name="Body"],.ls-root [data-name^="Status/"]{transition:border-color .2s ease,box-shadow .2s ease,filter .2s ease;}',
    '.ls-root [data-name^="Item/"]:hover > [data-name="Body"],.ls-root [data-name^="Status/"]:hover{border-color:#45c5ff;box-shadow:0 0 8px rgba(69,197,255,.45);}',
    '.ls-root [data-name^="Status/"].ls-on{border-color:#45c5ff;box-shadow:inset 0 0 8px rgba(69,197,255,.6);}',
    /* 이상 상태 표시(빨간 표지)는 경보등처럼 숨을 쉰다 */
    '@keyframes lsAlarm{0%,100%{opacity:1;filter:none}50%{opacity:.45;filter:drop-shadow(0 0 4px rgba(246,70,70,.9))}}',
    '.ls-root.ls-live .ls-alarm{animation:lsAlarm 1.8s ease-in-out infinite;}',
    /* 보기 모드 아이콘 */
    '.ls-root [data-name^="Icon/View/"]{transition:translate .25s cubic-bezier(.22,.8,.24,1),filter .25s ease;}',
    '.ls-root [data-name^="Icon/View/"]:hover{translate:0 -4px;filter:brightness(1.25) drop-shadow(0 4px 8px rgba(69,197,255,.55));}',
    '.ls-root [data-name^="Icon/View/"].ls-on{filter:brightness(1.35) drop-shadow(0 0 10px rgba(69,197,255,.95));}',
    /* 내비 */
    '.ls-root [data-name^="Icon/Nav/"]{transition:scale .2s ease,filter .2s ease;}',
    '.ls-root [data-name^="Icon/Nav/"]:hover{scale:1.25;filter:brightness(1.3) drop-shadow(0 0 6px rgba(69,197,255,.9));}',
    '.ls-root [data-name^="Icon/Nav/"]:active{scale:.9;}',
    '.ls-root [data-name="Pad"]{transition:filter .25s ease;}',
    '.ls-root [data-name="Pad"]:hover{filter:brightness(1.18) drop-shadow(0 0 10px rgba(69,140,255,.6));}',
    '@keyframes lsNeedle{0%,100%{rotate:-7deg}50%{rotate:7deg}}',
    '.ls-root.ls-live [data-name="Needle"]{animation:lsNeedle 7s ease-in-out infinite;transform-origin:50% 50%;}',
    '.ls-root.ls-live .ls-spin{transition:rotate .8s cubic-bezier(.22,.8,.24,1);}',
    /* 날씨 아이콘 — 살짝 떠 있다 */
    '@keyframes lsBob{0%,100%{translate:0 0}50%{translate:0 -3px}}',
    '.ls-root.ls-live [data-name="Icon/Weather/Rain"]{animation:lsBob 3.6s ease-in-out infinite;}',
    /* 사이트 선택(라디오) */
    '.ls-root [data-name^="Option/"] p{transition:color .2s ease;}',
    '.ls-root [data-name^="Option/"]:hover p{color:#f8f8f8;}',
    '.ls-root [data-name^="Option/"] [data-name="Radio"]{transition:scale .2s ease,filter .2s ease;}',
    '.ls-root [data-name^="Option/"]:hover [data-name="Radio"]{scale:1.12;filter:drop-shadow(0 0 5px rgba(69,197,255,.8));}',
    /* 토글(CB상태 · ATS 운전상태) */
    '.ls-root [data-name^="Toggle"] [data-name="Knob"]{transition:margin-left .32s cubic-bezier(.3,1.4,.5,1);}',
    '.ls-root [data-name^="Toggle"] [data-name="Track"] > div{transition:background-color .3s ease,box-shadow .3s ease;}',
    '.ls-root [data-name^="Toggle"] p{transition:margin-left .32s ease,color .3s ease,opacity .2s ease;}',
    '.ls-root [data-name^="Toggle"]:hover{filter:brightness(1.12);}',
    /* 알림 목록 — 등급 칩(원본 Hover 변형 = 테두리 #45c5ff + 안쪽 빛) · 접기 단추 · 표 줄 */
    '.ls-root .ls-chip{transition:border-color .2s ease,box-shadow .2s ease;}',
    '.ls-root .ls-chip:hover,.ls-root .ls-chip.ls-on{border-color:#45c5ff;box-shadow:inset 0 0 8px 0 #45c5ff;}',
    '.ls-root .ls-evbtn{transition:filter .2s ease,translate .2s ease;}',
    '.ls-root .ls-evbtn:hover{filter:brightness(1.3) drop-shadow(0 0 8px rgba(124,204,255,.9));translate:0 -2px;}',
    '.ls-root .ls-evarrow{transition:rotate .45s cubic-bezier(.22,.8,.24,1);}',
    '.ls-root.ls-ev-open .ls-evarrow{rotate:180deg;}',
    '.ls-root [data-name="Event List"]{z-index:6;}',
    '.ls-root [data-name="Event List"] [data-name="Row"]{transition:background-color .2s ease;}',
    '.ls-root [data-name="Event List"] [data-name="Row"]:hover{background-color:rgba(69,197,255,.12);}',
    '.ls-root [data-name="Event List"] [data-name="Row"].ls-on{background-color:rgba(40,97,255,.3);}',
    '@keyframes lsRowIn{from{opacity:0;translate:0 -10px;background-color:rgba(69,197,255,.35)}to{opacity:1;translate:0 0;background-color:transparent}}',
    '.ls-root [data-name="Event List"] [data-name="Row"].ls-new{animation:lsRowIn .7s cubic-bezier(.22,.8,.24,1);}',
    '@keyframes lsTick{0%{text-shadow:0 0 8px rgba(69,197,255,.95)}100%{text-shadow:0 0 0 rgba(69,197,255,0)}}',
    '.ls-root .ls-tick{animation:lsTick .9s ease-out;}',
    '.ls-root .ls-num{white-space:nowrap;}',

    /* ── 패널편집: 옮기기 ── */
    '.dt-editing .ls-root .ls-mv,.ls-root.ls-edit-layout .ls-mv{cursor:grab;outline:1px dashed rgba(69,197,255,.0);outline-offset:3px;transition:outline-color .2s ease,translate .4s cubic-bezier(.22,.8,.24,1);}',
    '.dt-editing .ls-root .ls-mv:hover,.ls-root.ls-edit-layout .ls-mv:hover{outline-color:rgba(69,197,255,.9);}',
    '.ls-root .ls-mv.ls-dragging{cursor:grabbing;outline:1px solid #45c5ff!important;z-index:30;filter:drop-shadow(0 10px 18px rgba(0,0,0,.45));}',
    '.ls-root .ls-mv.ls-droptarget{outline:2px solid #45c5ff!important;}',
    '.ls-root .ls-contents-mv{display:contents;}',
    /* Figma GROUP 이라 상자가 없던 위젯(display:contents) — 부모와 같은 판을 덮는 투명 상자로 세워 옮길 수 있게 하고,
       단추·차트·윤곽은 실제 그림이 있는 자리(.ls-chost)에 건다. 투명 상자는 눌림을 통과시킨다. */
    '.ls-root .ls-grpw{pointer-events:none;}',
    '.ls-root .ls-grpw > *{pointer-events:auto;}',
    '.ls-root .ls-chost{position:absolute;pointer-events:none;}',
    '.ls-root .ls-chost > *{pointer-events:auto;}',
    '.dt-editing .ls-root .ls-mv.ls-grpw,.ls-root.ls-edit-layout .ls-mv.ls-grpw,.ls-root .ls-mv.ls-grpw.ls-dragging{outline:none!important;filter:none;}',
    '.dt-editing .ls-root .ls-grpw > .ls-chost,.ls-root.ls-edit-layout .ls-grpw > .ls-chost{outline:1px dashed rgba(69,197,255,0);outline-offset:3px;transition:outline-color .2s ease;}',
    '.dt-editing .ls-root .ls-grpw:has(:hover) > .ls-chost,.ls-root.ls-edit-layout .ls-grpw:has(:hover) > .ls-chost{outline-color:rgba(69,197,255,.9);}',
    '.ls-root .ls-grpw.ls-dragging > .ls-chost{outline:1px solid #45c5ff!important;}',

    /* ── 차트 바꾸기 ── */
    '.ls-root .ls-chartbtn{position:absolute;top:-10px;right:-6px;z-index:25;display:none;align-items:center;gap:4px;height:22px;padding:0 8px;border:1px solid #45c5ff;border-radius:11px;'
      + 'background:linear-gradient(90deg,#2861ff,#455ddb);color:#fff;font:600 11px/20px Pretendard,system-ui,sans-serif;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.4);white-space:nowrap;}',
    '.ls-root .ls-chartbtn:hover{filter:brightness(1.18);}',
    '.dt-editing .ls-root .ls-chartbtn,.dt-content-editing .ls-root .ls-chartbtn,.ls-root.ls-edit-layout .ls-chartbtn{display:inline-flex;}',
    '.ls-root .ls-chartmenu{position:absolute;top:16px;right:-6px;z-index:40;min-width:196px;padding:6px;border:1px solid #2e61f9;border-radius:6px;'
      + 'background:rgba(6,21,46,.97);box-shadow:inset 0 0 3px rgba(106,242,244,.5),0 12px 28px rgba(0,0,0,.55);font:500 12px/1.35 Pretendard,system-ui,sans-serif;color:#c6d4fa;'
      + 'opacity:0;translate:0 -6px;pointer-events:none;transition:opacity .18s ease,translate .18s ease;}',
    '.ls-root .ls-chartmenu.open{opacity:1;translate:0 0;pointer-events:auto;}',
    '.ls-root .ls-chartmenu .hd{padding:4px 8px 6px;font-size:11px;color:#8ea3d6;}',
    '.ls-root .ls-chartmenu button{display:flex;align-items:center;gap:8px;width:100%;padding:7px 8px;border:0;border-radius:4px;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer;}',
    '.ls-root .ls-chartmenu button:hover{background:rgba(69,197,255,.14);color:#fff;}',
    '.ls-root .ls-chartmenu button.cur{background:rgba(40,97,255,.32);color:#fff;}',
    '.ls-root .ls-chartmenu .ic{width:18px;height:14px;flex:none;}',
    '.ls-root .ls-chartmenu .rec{margin-left:auto;padding:1px 6px;border-radius:8px;background:#29e2ff;color:#001227;font-size:10px;font-weight:700;}',
    '.ls-root .ls-chartmenu .sep{height:1px;margin:4px 2px;background:rgba(198,212,250,.16);}',
    '.ls-root .ls-swapped > :not(.ls-chart):not(.ls-chartbtn):not(.ls-chartmenu):not(.ls-chost){visibility:hidden;}',
    /* 키가 낮은 위젯(전압·전류 카드 98px)에서는 그래프가 납작해진다 — 아래를 붙인 채 150px 까지 위로 자란다 */
    '.ls-root .ls-chart{position:absolute;left:0;right:0;bottom:0;height:max(100%,150px);z-index:3;display:flex;flex-direction:column;padding:10px 12px 10px;border:1px solid #2e61f9;'
      + 'background:linear-gradient(180deg,rgba(10,28,62,.92),rgba(6,21,46,.94));box-shadow:inset 0 0 3px rgba(106,242,244,.5);'
      + 'font:500 11px/1.2 Pretendard,system-ui,sans-serif;color:#c6d4fa;line-height:1.2;overflow:hidden;animation:lsChartIn .45s cubic-bezier(.22,.8,.24,1);}',
    '@keyframes lsChartIn{from{opacity:0;scale:.97}to{opacity:1;scale:1}}',
    '.ls-root .ls-chart .ct{display:flex;align-items:center;gap:6px;font-weight:600;font-size:13px;color:#c6d4fa;white-space:nowrap;}',
    '.ls-root .ls-chart .ct i{display:block;width:2px;height:13px;background:linear-gradient(0deg,rgba(255,255,255,0),#fff 52%,rgba(255,255,255,0));}',
    '.ls-root .ls-chart .ct b{margin-left:auto;font-weight:600;font-size:15px;color:#fff;font-variant-numeric:tabular-nums;}',
    '.ls-root .ls-chart .ct b small{font-size:11px;color:#c6d4fa;margin-left:2px;font-weight:500;}',
    '.ls-root .ls-chart .lg{display:flex;gap:10px;margin-top:4px;font-size:10px;color:#8ea3d6;white-space:nowrap;}',
    '.ls-root .ls-chart .lg span{display:inline-flex;align-items:center;gap:4px;}',
    '.ls-root .ls-chart .lg span:before{content:"";width:8px;height:3px;border-radius:2px;background:var(--c);}',
    '.ls-root .ls-chart .pl{position:relative;flex:1;min-height:0;margin-top:6px;}',
    '.ls-root .ls-chart svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;}',
    '.ls-root .ls-chart .ax{fill:#8ea3d6;font-size:9px;font-family:Pretendard,system-ui,sans-serif;}',
    '.ls-root .ls-chart .gl{stroke:rgba(198,212,250,.12);stroke-width:1;shape-rendering:crispEdges;}',
    '.ls-root .ls-chart .bars{position:absolute;inset:0 0 14px;display:flex;align-items:flex-end;justify-content:space-around;gap:6px;}',
    '.ls-root .ls-chart .bars > div{position:relative;flex:1;max-width:30px;height:100%;display:flex;align-items:flex-end;}',
    '.ls-root .ls-chart .bars i{display:block;width:100%;border-radius:2px 2px 0 0;background:linear-gradient(180deg,var(--c),rgba(40,97,255,.25));'
      + 'box-shadow:0 0 8px rgba(69,197,255,.35);transition:height .9s cubic-bezier(.22,.8,.24,1);}',
    '.ls-root .ls-chart .bars em{position:absolute;left:50%;translate:-50% 0;bottom:calc(var(--h) + 2px);font-style:normal;font-size:9px;color:#fff;white-space:nowrap;transition:bottom .9s cubic-bezier(.22,.8,.24,1);}',
    '.ls-root .ls-chart .bars u{position:absolute;left:50%;translate:-50% 0;bottom:-14px;text-decoration:none;font-size:9px;color:#8ea3d6;white-space:nowrap;}',
    '.ls-root .ls-chart .hb{display:flex;flex-direction:column;justify-content:space-around;height:100%;gap:4px;}',
    '.ls-root .ls-chart .hb > div{display:grid;grid-template-columns:44px 1fr 36px;align-items:center;gap:6px;font-size:10px;}',
    '.ls-root .ls-chart .hb s{position:relative;display:block;height:7px;border-radius:4px;background:rgba(198,212,250,.1);overflow:hidden;text-decoration:none;}',
    '.ls-root .ls-chart .hb s i{position:absolute;inset:0 auto 0 0;border-radius:4px;background:linear-gradient(90deg,#2861ff,var(--c));transition:width .9s cubic-bezier(.22,.8,.24,1);}',
    '.ls-root .ls-chart .hb b{text-align:right;color:#fff;font-weight:600;font-variant-numeric:tabular-nums;}',
    '.ls-root .ls-chart .arc{transition:stroke-dasharray .9s cubic-bezier(.22,.8,.24,1);}',
    '.ls-root .ls-chart .gv{position:absolute;left:0;right:0;bottom:4px;text-align:center;font-size:22px;font-weight:700;color:#fff;font-variant-numeric:tabular-nums;}',
    '.ls-root .ls-chart .gv small{font-size:12px;color:#c6d4fa;margin-left:2px;font-weight:500;}',
    '.ls-root .ls-chart .dn{display:flex;align-items:center;gap:12px;height:100%;}',
    '.ls-root .ls-chart .dn .ring{position:relative;height:100%;aspect-ratio:1;flex:none;}',
    '.ls-root .ls-chart .dn .ring b{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:17px;color:#fff;font-weight:700;}',
    '.ls-root .ls-chart .dn .ring b small{font-size:9px;color:#8ea3d6;font-weight:500;}',
    '.ls-root .ls-chart .dn ul{list-style:none;display:flex;flex-direction:column;gap:5px;font-size:10px;}',
    '.ls-root .ls-chart .dn li{display:flex;align-items:center;gap:6px;white-space:nowrap;}',
    '.ls-root .ls-chart .dn li:before{content:"";width:8px;height:8px;border-radius:2px;background:var(--c);}',
    '.ls-root .ls-chart .dn li b{margin-left:auto;padding-left:8px;color:#fff;font-variant-numeric:tabular-nums;}',

    /* ══════════ ACB 진단 팝업(STATCOM 화면 위에 겹쳐 뜬 판) ══════════
       형상·색·자리는 생성기가 만든 그대로 두고 '움직이는 것'만 얹는다. */
    '.ls-root .ls-popmount{animation:lsPopIn .42s cubic-bezier(.22,.8,.24,1);}',
    '@keyframes lsPopIn{from{opacity:0;scale:.99}to{opacity:1;scale:1}}',
    '.ls-root .ls-popmount.ls-pop-out{opacity:0;scale:.99;pointer-events:none;transition:opacity .26s ease,scale .26s ease;}',
    /* 알림 목록은 펼치면 위로 자란다 — 팝업(z 60)에 가려지지 않게 그 위로 */
    '.ls-root:has(.ls-popmount) [data-name="Event List"]{z-index:70;}',
    /* 닫기 */
    '.ls-root .ls-pop [data-name="Icon/Action/Close"]{border-radius:4px;transition:background-color .18s ease,scale .18s ease;}',
    '.ls-root .ls-pop [data-name="Icon/Action/Close"]:hover{background-color:rgba(124,204,255,.22);scale:1.08;}',
    '.ls-root .ls-pop [data-name="Icon/Action/Close"]:active{scale:.94;}',
    /* 열화상 구간 드롭다운 */
    '.ls-root .ls-pop [data-name="Dropdown"]{transition:border-color .18s ease,background-color .18s ease;}',
    '.ls-root .ls-pop [data-name="Dropdown"]:hover{border-color:#45c5ff!important;}',
    '.ls-root .ls-pop [data-name="Icon/Action/Expand"]{transition:rotate .3s cubic-bezier(.22,.8,.24,1);}',
    '.ls-root .ls-pop [data-name="Dropdown"].ls-open [data-name="Icon/Action/Expand"]{rotate:180deg;}',
    '.ls-root .ls-ddmenu{position:absolute;left:0;top:calc(100% + 4px);min-width:100%;z-index:20;padding:4px;'
      + 'border:1px solid #2e61f9;background:linear-gradient(180deg,rgba(10,28,62,.97),rgba(6,21,46,.98));box-shadow:0 8px 20px rgba(0,0,0,.45);'
      + 'opacity:0;translate:0 -4px;pointer-events:none;transition:opacity .18s ease,translate .18s ease;}',
    '.ls-root [data-name="Dropdown"].ls-open .ls-ddmenu{opacity:1;translate:0 0;pointer-events:auto;}',
    '.ls-root .ls-ddmenu button{display:flex;width:100%;align-items:center;gap:8px;padding:6px 8px;border:0;background:none;'
      + 'color:#c6d4fa;font:500 13px/1 Pretendard,system-ui,sans-serif;text-align:left;cursor:pointer;}',
    '.ls-root .ls-ddmenu button:hover{background:rgba(69,197,255,.16);color:#fff;}',
    '.ls-root .ls-ddmenu button.cur{color:#fff;}',
    '.ls-root .ls-ddmenu button.cur::after{content:"";margin-left:auto;width:6px;height:6px;border-radius:50%;background:#45c5ff;}',
    /* 표 줄 · 센서 · 범례 */
    '.ls-root .ls-pop .ls-rowhi{transition:filter .18s ease;}',
    '.ls-root .ls-pop .ls-rowhi:hover{filter:brightness(1.35);}',
    '.ls-root .ls-pop [data-name="List"] > [data-name^="Item/"]{transition:translate .22s cubic-bezier(.22,.8,.24,1),filter .22s ease;}',
    '.ls-root .ls-pop [data-name="List"] > [data-name^="Item/"]:hover{translate:0 -3px;filter:brightness(1.1) drop-shadow(0 6px 14px rgba(69,197,255,.35));}',
    '.ls-root .ls-pop [data-name="Items"] > [data-name^="Item/"]{transition:opacity .2s ease,scale .2s ease;}',
    '.ls-root .ls-pop [data-name="Items"]:hover > [data-name^="Item/"]{opacity:.45;}',
    '.ls-root .ls-pop [data-name="Items"] > [data-name^="Item/"]:hover{opacity:1;scale:1.05;}',
    '.ls-root .ls-pop [data-name^="Gauge/"],.ls-root .ls-pop [data-name^="Card/"]{transition:filter .25s ease;}',
    '.ls-root .ls-pop [data-name^="Gauge/"]:hover,.ls-root .ls-pop [data-name^="Card/"]:hover{filter:brightness(1.12);}',
    /* 삼상전원전압 트렌드 — 원본 벡터를 그대로 두고 잘린 상자 안에서 천천히 민다(실시간으로 흐르는 것처럼).
       민 거리(62px)는 선 세 줄이 상자 밖으로 안 빠지는 공통 여유분이다. 되돌아갈 때만 잠깐 흐려진다. */
    '.ls-root.ls-live .ls-pop .ls-trendsvg .ls-wave{animation:lsTrend 18s linear infinite;}',
    '.dt-editing .ls-root .ls-pop .ls-wave,.dt-content-editing .ls-root .ls-pop .ls-wave,'
      + '.ls-root.ls-edit-layout .ls-pop .ls-wave{animation-play-state:paused;}',
    '@keyframes lsTrend{0%{translate:0 0;opacity:1}86%{translate:-62px 0;opacity:1}94%{translate:-62px 0;opacity:0}'
      + '94.01%{translate:0 0;opacity:0}100%{translate:0 0;opacity:1}}',
    /* 계통 · 에너지 팝업 — 기간 단추 · 측정표 · 요약 지표 · Trip 줄 */
    '.ls-root .ls-pop [data-name="Toolbar"] > [data-name^="Option/"]{transition:filter .18s ease,translate .18s ease;}',
    '.ls-root .ls-pop [data-name="Toolbar"] > [data-name^="Option/"]:hover{filter:brightness(1.3) drop-shadow(0 0 6px rgba(69,197,255,.65));translate:0 -1px;}',
    '.ls-root .ls-pop [data-name="Toolbar"] > [data-name^="Option/"]:active{translate:0 1px;filter:brightness(.95);}',
    '.ls-root .ls-pop [data-name="Toolbar"] > [data-name^="Option/"].ls-on{filter:drop-shadow(0 0 5px rgba(177,250,255,.45));}',
    '.ls-root .ls-pop [data-name^="Metric/"]{transition:filter .22s ease;}',
    '.ls-root .ls-pop [data-name^="Metric/"]:hover{filter:brightness(1.16) drop-shadow(0 0 10px rgba(69,197,255,.28));}',
    '.ls-root .ls-pop [data-name^="Metric/"] [data-name^="Td"]{transition:background-color .2s ease;}',
    '.ls-root .ls-pop [data-name^="Metric/"] [data-name^="Td"]:hover{background-color:rgba(69,197,255,.1);}',
    '.ls-root .ls-pop [data-name^="Bar/"]{will-change:scale;}',
    '.ls-root .ls-pop [data-name^="Widget/"] > [data-name="Card"],.ls-root .ls-pop [data-name^="Widget/"] > [data-name="Body"]{transition:filter .25s ease;}',
    '.ls-root .ls-pop [data-name="Charts"] [data-name^="Widget/"]:hover > [data-name="Card"]{filter:brightness(1.08);}',

    /* ── 단독 팝업 다섯 장(상태정보 · AC전원실 · 충전기 · 냉각설비 · 알림) ── */
    /* 파란 닫기 단추 — 단추가 밝아지며 빛이 번지고 X 가 돈다(안쪽 아이콘에는 판을 깔지 않는다) */
    '.ls-root .ls-pop [data-name="Close Button"]{transition:filter .2s ease,box-shadow .2s ease;}',
    '.ls-root .ls-pop [data-name="Close Button"]:hover{filter:brightness(1.2);box-shadow:0 0 12px rgba(69,140,255,.8);}',
    '.ls-root .ls-pop [data-name="Close Button"]:active{filter:brightness(.9);}',
    '.ls-root .ls-pop [data-name="Close Button"] [data-name="Icon/Action/Close"]{transition:rotate .3s cubic-bezier(.22,.8,.24,1);}',
    '.ls-root .ls-pop [data-name="Close Button"] [data-name="Icon/Action/Close"]:hover{background-color:transparent;scale:1;}',
    '.ls-root .ls-pop [data-name="Close Button"]:hover [data-name="Icon/Action/Close"]{rotate:90deg;}',
    /* 차트 판 · 측정 카드 · 모듈 카드 */
    '.ls-root .ls-pop [data-name="Content"] [data-name^="Widget/"]:hover > [data-name="Card"]{filter:brightness(1.08);}',
    '.ls-root .ls-pop [data-name^="Card/"]{transition:filter .25s ease,translate .25s cubic-bezier(.22,.8,.24,1);}',
    '.ls-root .ls-pop [data-name^="Card/"]:hover{translate:0 -3px;filter:brightness(1.12) drop-shadow(0 6px 14px rgba(69,197,255,.28));}',
    /* 펌프 칸 · 그룹 말풍선 */
    '.ls-root .ls-pop [data-name="Cells"] > [data-name^="Td/"]{transition:filter .2s ease;}',
    '.ls-root .ls-pop [data-name="Cells"] > [data-name^="Td/"]:hover{filter:brightness(1.45);}',
    '.ls-root .ls-pop [data-name^="Callout/"]{transition:translate .22s cubic-bezier(.22,.8,.24,1),filter .22s ease;}',
    '.ls-root .ls-pop [data-name^="Callout/"]:hover{translate:3px 0;filter:brightness(1.35) drop-shadow(0 0 6px rgba(124,204,255,.55));}',
    /* 냉각팬 — 날개만 돈다(원본 Blades). 동작 1.6초 · 과부하 0.7초에 한 바퀴, 고장은 멈춘 채 빨간 빛, 중지는 그대로 */
    '@keyframes lsSpin{to{transform:rotate(360deg)}}',
    '@keyframes lsFanOver{0%,100%{filter:none}50%{filter:drop-shadow(0 0 7px rgba(253,128,4,.9))}}',
    '@keyframes lsFanFault{0%,100%{filter:none}50%{filter:drop-shadow(0 0 9px rgba(244,49,48,.95))}}',
    '.ls-root .ls-pop .ls-fan{transition:scale .22s cubic-bezier(.22,.8,.24,1);}',
    '.ls-root .ls-pop .ls-fan:hover{scale:1.08;}',
    '.ls-root .ls-pop .ls-blades{transform-box:view-box;}',
    '.ls-root.ls-live .ls-pop .ls-fan-run .ls-blades{animation:lsSpin 1.6s linear infinite;}',
    '.ls-root.ls-live .ls-pop .ls-fan-over .ls-blades{animation:lsSpin .7s linear infinite;}',
    '.ls-root.ls-live .ls-pop .ls-fan-over{animation:lsFanOver 1.4s ease-in-out infinite;}',
    '.ls-root.ls-live .ls-pop .ls-fan-fault{animation:lsFanFault 1.1s ease-in-out infinite;}',
    /* 펌프 운전 표지 · 알림 난 실 */
    '@keyframes lsRunGlow{0%,100%{filter:none}50%{filter:drop-shadow(0 0 5px rgba(67,209,141,.95))}}',
    '.ls-root.ls-live .ls-pop .ls-run{animation:lsRunGlow 1.8s ease-in-out infinite;}',
    '@keyframes lsAlarmTxt{0%,100%{text-shadow:0 0 0 rgba(255,75,75,0)}50%{text-shadow:0 0 9px rgba(255,75,75,.95)}}',
    '.ls-root.ls-live .ls-pop .ls-alarmrow [data-name="Td"] p{animation:lsAlarmTxt 1.6s ease-in-out infinite;}',
    /* ── 팝업 열기(페이지 연결) ──
       헤더 Brand 옆 '팝업' 단추 — 이 화면의 다른 메뉴(차트 바꾸기 · 열화상 구간)와 같은 판: 짙은 남색 판 · #2E61F9 선 · 안쪽 하늘 빛,
       호버/열림은 알림 칩과 같은 #45C5FF 테두리 + 안쪽 빛, 개수 표지는 접기 단추의 파란 그라디언트 */
    '.ls-root .ls-launch{position:absolute;top:50%;translate:0 -50%;z-index:2;font-family:Pretendard,"Pretendard Variable",system-ui,sans-serif;}',
    '.ls-root [data-name="Header Bar"].ls-launch-open{z-index:90;}',
    '.ls-root .ls-launch-btn{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 9px 0 8px;border:1px solid rgba(46,97,249,.9);border-radius:4px;'
      + 'background:linear-gradient(180deg,rgba(10,28,62,.9),rgba(6,21,46,.94));box-shadow:inset 0 0 3px rgba(106,242,244,.5);'
      + 'color:#c6d4fa;font:600 13px/1 Pretendard,"Pretendard Variable",system-ui,sans-serif;white-space:nowrap;cursor:pointer;'
      + 'transition:border-color .2s ease,box-shadow .2s ease,color .2s ease,translate .2s ease;}',
    '.ls-root .ls-launch-btn:hover,.ls-root .ls-launch.open .ls-launch-btn{border-color:#45c5ff;color:#fff;box-shadow:inset 0 0 8px rgba(69,197,255,.6),0 0 10px rgba(69,197,255,.28);}',
    '.ls-root .ls-launch-btn:active{translate:0 1px;}',
    '.ls-root .ls-launch-btn:focus-visible,.ls-root .ls-launch-menu button:focus-visible{outline:2px solid #45c5ff;outline-offset:2px;}',
    /* 팝업 제목 바 아이콘(Icon/Popup/Diagnostics) 그대로 — 17x28 판의 위쪽에 그려진 모서리라 10x10 창으로 잘라 보인다 */
    '.ls-root .ls-launch .ic{position:relative;display:inline-block;width:10px;height:10px;overflow:hidden;flex:none;}',
    '.ls-root .ls-launch .ic img{position:absolute;left:0;top:0;width:10.2px;height:16.8px;max-width:none;}',
    '.ls-root .ls-launch-btn b{min-width:18px;height:16px;padding:0 5px;border-radius:8px;background:linear-gradient(90deg,#2861ff,#455ddb);'
      + 'color:#fff;font-size:10px;font-weight:700;line-height:16px;text-align:center;}',
    '.ls-root .ls-launch-btn .chev{width:8px;height:8px;transition:rotate .3s cubic-bezier(.22,.8,.24,1);}',
    '.ls-root .ls-launch.open .ls-launch-btn .chev{rotate:180deg;}',
    '.ls-root .ls-launch-menu{position:absolute;left:0;top:calc(100% + 6px);min-width:212px;padding:6px;border:1px solid #2e61f9;border-radius:6px;'
      + 'background:rgba(6,21,46,.97);box-shadow:inset 0 0 3px rgba(106,242,244,.5),0 12px 28px rgba(0,0,0,.55);'
      + 'opacity:0;translate:0 -6px;pointer-events:none;transition:opacity .18s ease,translate .18s ease;}',
    '.ls-root .ls-launch.open .ls-launch-menu{opacity:1;translate:0 0;pointer-events:auto;}',
    '.ls-root .ls-launch-menu .hd{padding:4px 8px 6px;font-size:11px;font-weight:600;color:#8ea3d6;}',
    '.ls-root .ls-launch-menu .sep{height:1px;margin:4px 2px;background:rgba(198,212,250,.16);}',
    '.ls-root .ls-launch-menu button{display:flex;align-items:center;gap:8px;width:100%;padding:8px;border:0;border-radius:4px;background:none;'
      + 'color:#c6d4fa;font:500 13px/1.2 Pretendard,"Pretendard Variable",system-ui,sans-serif;text-align:left;white-space:nowrap;cursor:pointer;transition:background-color .15s ease,color .15s ease;}',
    '.ls-root .ls-launch-menu button:hover{background:rgba(69,197,255,.14);color:#fff;}',
    '.ls-root .ls-launch-menu button.cur{background:rgba(40,97,255,.32);color:#fff;}',
    '.ls-root .ls-launch-menu button.cur::after{content:"";margin-left:auto;width:6px;height:6px;border-radius:50%;background:#45c5ff;box-shadow:0 0 6px #45c5ff;}',
    '.dt-editing .ls-root .ls-launch,.dt-content-editing .ls-root .ls-launch{opacity:.45;pointer-events:none;}',
    /* 화면 안의 '여는 자리'(측정 카드 · 충전기 카드) — 누를 수 있음을 알린다 */
    '.ls-root .ls-poptrig{transition:filter .22s ease;}',
    '.ls-root .ls-poptrig:hover,.ls-root .ls-poptrig.ls-on{filter:brightness(1.14) drop-shadow(0 0 10px rgba(69,197,255,.35));}',
    '.dt-editing .ls-root .ls-poptrig:hover,.dt-content-editing .ls-root .ls-poptrig:hover{filter:none;}',
    /* 이 페이지 자체의 팝업 — 다른 팝업을 겹쳐 띄우는 동안 잠시 걷어 두고, 닫으면 다시 떠오른다 */
    '.ls-root .ls-popmount.ls-pop-hide{opacity:0;scale:.99;visibility:hidden;pointer-events:none;transition:opacity .22s ease,scale .22s ease,visibility 0s linear .22s;}',
    '.ls-root .ls-popmount.ls-pop-back{animation:lsPopIn .42s cubic-bezier(.22,.8,.24,1);}',
    /* 패널편집 중에는 움직임을 멈춘다 */
    '.dt-editing .ls-root .ls-pop .ls-blades,.dt-content-editing .ls-root .ls-pop .ls-blades,.ls-root.ls-edit-layout .ls-pop .ls-blades,'
      + '.dt-editing .ls-root .ls-pop .ls-fan,.dt-content-editing .ls-root .ls-pop .ls-fan,.ls-root.ls-edit-layout .ls-pop .ls-fan,'
      + '.dt-editing .ls-root .ls-pop .ls-run,.dt-content-editing .ls-root .ls-pop .ls-run,'
      + '.dt-editing .ls-root .ls-pop .ls-alarmrow p,.dt-content-editing .ls-root .ls-pop .ls-alarmrow p{animation-play-state:paused;}',

    /* ══════════ 라이트 테마 ══════════
       원본은 다크. 형상·자리는 그대로 두고 판과 글자만 밝은 판에 맞게 다시 적는다.
       · 바탕 사진은 색을 뒤집어 옅게(밤 → 새벽빛) · 판 그림은 생성기가 만든 -lt 사본(밝은 판 · 짙은 선)
       · 본문 글자 #16233b / 보조 #4a5a78 / 값 강조 #184aa8(원본 #4b98ff · #98c4ff · #bac1fa 의 짙은 짝)
       · 원본 그대로 짙은 색을 지키는 판(제목 칩 · 자산 필터 단추 · 접기 단추 · 라벨 칩) 위 글자는 흰색 그대로
       대비 기준: 본문 4.5:1 이상. */
    '.ls-root[data-theme="light"]{background:#e8eef7;}',
    '.ls-root[data-theme="light"] .ls-bgimg{filter:invert(1) hue-rotate(180deg) saturate(.55) brightness(1.12) contrast(.9);opacity:.5;}',
    '.ls-root[data-theme="light"] [data-name="Header Bar"] p,.ls-root[data-theme="light"] [data-name="Header Bar"] [data-name="Date"],'
      + '.ls-root[data-theme="light"] [data-name="Ticker"] p{color:#16233b!important;}',
    '.ls-root[data-theme="light"] [data-name="Header Bar"] [data-name="Date"] p{color:#27406a!important;}',
    '.ls-root[data-theme="light"] [data-name="Actions"] img,.ls-root[data-theme="light"] [data-name="Logo Mark"] img{filter:brightness(.25) sepia(1) hue-rotate(185deg) saturate(3);}',
    /* 판 안 글자 — 기본은 짙은 남색 */
    '.ls-root[data-theme="light"] [data-name="Left Panel"] p,.ls-root[data-theme="light"] [data-name="Right Panel"] p{color:#16233b;}',
    '.ls-root[data-theme="light"] [data-name="Widget/Weather"] [data-name="Label"] p{color:#4a5a78;}',
    '.ls-root[data-theme="light"] [data-name="Widget/Weather"] [data-name="Measurement"] p{color:#184aa8;}',
    '.ls-root[data-theme="light"] [data-name="Widget/Weather"] [data-name="Text Wrap"] p:last-child{color:#5b6781;}',
    '.ls-root[data-theme="light"] [data-name="Widget/Weather"] [data-name="Timestamp"]{background:linear-gradient(0deg,#dbe6fb,#eef3fd)!important;border-color:#7fa3e6!important;}',
    '.ls-root[data-theme="light"] [data-name="Widget/Weather"] [data-name="Timestamp"] p{color:#16233b;}',
    '.ls-root[data-theme="light"] [data-name="Widget/Weather"] [data-name="Label"] img,.ls-root[data-theme="light"] [data-name^="Icon/Weather/"] img{filter:brightness(.55) saturate(1.4);}',
    '.ls-root[data-theme="light"] [data-name="Widget/Sensor Status"] [data-name="Body"]{background-color:#f6f8fc!important;border-color:#7d97d8!important;}',
    '.ls-root[data-theme="light"] [data-name="Widget/Sensor Status"] [data-name="Measurement"] p:first-child{color:#184aa8;}',
    '.ls-root[data-theme="light"] [data-name="Widget/Sensor Status"] p{color:#26375a;}',
    '.ls-root[data-theme="light"] [data-name="Widget/Sensor Status"] [data-name="Icon Group"]{background-image:linear-gradient(90deg,#2861ff,#455ddb)!important;}',
    '.ls-root[data-theme="light"] [data-name="Widget/Sensor Status"] [data-name="Icon Group"] img{filter:brightness(2.4) saturate(0);}',
    /* 자산 필터 · 제목 칩 · 라벨 칩 · 접기 — 원본의 짙은 판을 지킨다(흰 글자) */
    '.ls-root[data-theme="light"] [data-name^="Button/"] > div:first-child{background-color:#1a3aa8!important;}',
    '.ls-root[data-theme="light"] [data-name^="Button/"] p{color:#fff!important;}',
    '.ls-root[data-theme="light"] [data-name="Title"] > div:first-child{background-image:linear-gradient(-58deg,rgba(255,255,255,0) 51%,rgba(255,255,255,.14) 51%),linear-gradient(90deg,#15306e,#15306e)!important;}',
    '.ls-root[data-theme="light"] [data-name="Title"] p{color:#eef3ff!important;}',
    '.ls-root[data-theme="light"] [data-name^="Status/"]{background-image:linear-gradient(90deg,#f7f9fd,#f7f9fd)!important;border-color:#8aa1d6!important;}',
    '.ls-root[data-theme="light"] [data-name^="Status/"] p{color:#26375a;}',
    '.ls-root[data-theme="light"] [data-name="Status/ES2"] ~ [data-name="Status/ES2"] p{color:transparent;}',
    '.ls-root[data-theme="light"] [data-name="Widget/Mini Map"] [data-name="Card BG"]{background-color:#f4f7fc!important;border-color:#9aabd0!important;}',
    /* 우측 */
    '.ls-root[data-theme="light"] [data-name="Site Selector"] [data-name$="(Selected)"] p{color:#16233b!important;}',
    '.ls-root[data-theme="light"] [data-name="Site Selector"] p{color:#5b6781!important;}',
    '.ls-root[data-theme="light"] [data-name="Site Selector"] [data-name^="Option/"]:hover p{color:#16233b!important;}',
    '.ls-root[data-theme="light"] [data-name="Directions"] p{color:#16233b!important;}',
    '.ls-root[data-theme="light"] [data-name^="Field/"] [data-name="Value Box"] p,.ls-root[data-theme="light"] [data-name^="Field/"] [data-name="Row"] p{color:#184aa8!important;}',
    '.ls-root[data-theme="light"] [data-name^="Field/"] > [data-name="Label"] p{color:#fff!important;}',
    '.ls-root[data-theme="light"] [data-name^="Field/"] > [data-name="Label"]{background-image:linear-gradient(180deg,#2d5fe0,#2448b8 51%,#2d5fe0)!important;}',
    '.ls-root[data-theme="light"] [data-name^="Field/"] [data-name="Icon Group"] > div:first-child{background-color:#1a3aa8!important;}',
    '.ls-root[data-theme="light"] [data-name="Chip"]{background-color:#eef3fd!important;border-color:#4d72cd!important;}',
    '.ls-root[data-theme="light"] [data-name="Chip"] p{color:#1b3a86!important;}',
    '.ls-root[data-theme="light"] [data-name="Widget/Charger Battery"] > [data-name="Chip"]{background-color:transparent!important;background-image:linear-gradient(180deg,#204ac2,#151b39 51%,#204ac2)!important;}',
    '.ls-root[data-theme="light"] [data-name="Widget/Charger Battery"] > [data-name="Chip"] p{color:#fff!important;}',
    '.ls-root[data-theme="light"] [data-name="Widget/Charger Battery"] > [data-name="Chip"] [data-name="Marker"]{background-image:linear-gradient(0deg,rgba(255,255,255,0),#fff 52%,rgba(255,255,255,0))!important;}',
    /* 토글 손잡이는 흰 원 그대로(라이트 사본으로 바꾸지 않는다) · 등급 건수는 원본 색의 짙은 짝 */
    '.ls-root[data-theme="light"] [data-name="Knob"] img{content:normal!important;}',
    '.ls-root[data-theme="light"] .ls-chip:nth-child(2) [data-name="Value"] p{color:#c62828!important;}',
    '.ls-root[data-theme="light"] .ls-chip:nth-child(3) [data-name="Value"] p{color:#b85a00!important;}',
    '.ls-root[data-theme="light"] .ls-chip:nth-child(4) [data-name="Value"] p{color:#8a6d00!important;}',
    '.ls-root[data-theme="light"] .ls-chip:nth-child(5) [data-name="Value"] p{color:#0a7c99!important;}',
    '.ls-root[data-theme="light"] [data-name="Widget/Transformer Health"] [data-name="Card"]{background-color:#f7f9fd!important;border-color:#9aa6c2!important;}',
    '.ls-root[data-theme="light"] [data-name="Widget/Transformer Health"] [data-name="Label"] p{color:#16233b!important;}',
    '.ls-root[data-theme="light"] [data-name="Widget/Transformer Health"] [data-name="Marker"],.ls-root[data-theme="light"] [data-name="Chip"] [data-name="Marker"]{background-image:linear-gradient(0deg,rgba(22,35,59,0),#16233b 52%,rgba(22,35,59,0))!important;}',
    '.ls-root[data-theme="light"] [data-name^="Metric/"] [data-name="Measurement"] p{color:#16233b!important;}',
    '.ls-root[data-theme="light"] [data-name^="Metric/"] [data-name="Label"]{background-image:linear-gradient(to left,#1f3f9e,rgba(31,63,158,.62))!important;}',
    '.ls-root[data-theme="light"] [data-name^="Metric/"] [data-name="Label"] p{color:#fff!important;}',
    '.ls-root[data-theme="light"] [data-name="Widget/Charger Battery"] [data-name="Measurement"] p:first-child{color:#16233b!important;}',
    '.ls-root[data-theme="light"] [data-name="Widget/Charger Battery"] [data-name="Measurement"] p:last-child,.ls-root[data-theme="light"] [data-name="Widget/Charger Battery"] [data-name="Label"] p{color:#27406a!important;}',
    '.ls-root[data-theme="light"] [data-name="Widget/Power Status"] p{color:#184aa8!important;}',
    /* 알림 목록 */
    '.ls-root[data-theme="light"] [data-name="Event List"] > div:first-child > div:first-child{background-image:linear-gradient(180deg,rgba(247,250,254,.94),rgba(222,233,250,.94))!important;border-image:linear-gradient(to bottom,#7fa3e6 60%,#2861ff 60%) 1!important;}',
    '.ls-root[data-theme="light"] [data-name="Event List"] > div:first-child > p{color:#16233b!important;}',
    '.ls-root[data-theme="light"] .ls-chip{background-color:#eef3fd!important;border-color:#7d97d8!important;}',
    '.ls-root[data-theme="light"] .ls-chip:hover,.ls-root[data-theme="light"] .ls-chip.ls-on{border-color:#2861ff!important;box-shadow:inset 0 0 6px 0 rgba(40,97,255,.55)!important;}',
    '.ls-root[data-theme="light"] .ls-chip > div:not([data-name]) ,.ls-root[data-theme="light"] .ls-chip [data-name="Label"] p,.ls-root[data-theme="light"] .ls-chip > p{color:#27406a!important;}',
    '.ls-root[data-theme="light"] .ls-chip [data-name="Value"]{background-color:#fff!important;border-color:#9aabd0!important;}',
    '.ls-root[data-theme="light"] .ls-chip:first-child [data-name="Value"] p{color:#16233b!important;}',
    '.ls-root[data-theme="light"] [data-name="Event List"] > div:last-child{background-color:rgba(244,247,252,.97)!important;border-color:#9aabd0!important;}',
    '.ls-root[data-theme="light"] [data-name="Header Row"]{background-color:#dde6f7!important;border-color:#7fa3e6!important;}',
    '.ls-root[data-theme="light"] [data-name="Event List"] > div:last-child p{color:#16233b!important;}',
    '.ls-root[data-theme="light"] [data-name="Event List"] [data-name="Row"]{border-color:#c3cde2!important;}',
    /* 라이트 차트 */
    '.ls-root[data-theme="light"] .ls-chart{background:linear-gradient(180deg,#f7faff,#eaf0fb);border-color:#7fa3e6;box-shadow:inset 0 0 3px rgba(40,97,255,.25);color:#26375a;}',
    '.ls-root[data-theme="light"] .ls-chart .ct{color:#16233b;}',
    '.ls-root[data-theme="light"] .ls-chart .ct i{background:linear-gradient(0deg,rgba(22,35,59,0),#16233b 52%,rgba(22,35,59,0));}',
    '.ls-root[data-theme="light"] .ls-chart .ct b,.ls-root[data-theme="light"] .ls-chart .gv,.ls-root[data-theme="light"] .ls-chart .dn .ring b,'
      + '.ls-root[data-theme="light"] .ls-chart .hb b,.ls-root[data-theme="light"] .ls-chart .dn li b,.ls-root[data-theme="light"] .ls-chart .bars em{color:#16233b;}',
    '.ls-root[data-theme="light"] .ls-chart .ct b small,.ls-root[data-theme="light"] .ls-chart .gv small{color:#4a5a78;}',
    '.ls-root[data-theme="light"] .ls-chart .ax{fill:#4a5a78;}',
    '.ls-root[data-theme="light"] .ls-chart .lg,.ls-root[data-theme="light"] .ls-chart .bars u,.ls-root[data-theme="light"] .ls-chart .dn .ring b small{color:#4a5a78;}',
    '.ls-root[data-theme="light"] .ls-chart .gl{stroke:rgba(22,35,59,.12);}',
    '.ls-root[data-theme="light"] .ls-chart .hb s{background:rgba(22,35,59,.1);}',
    '.ls-root[data-theme="light"] .ls-chart .trk{stroke:rgba(22,35,59,.1)!important;}',

    /* ── 라이트: ACB 진단 팝업 ──
       팝업은 화면(.lsm-root) **안에** 겹쳐 들어가서, 이름이 같은 슬롯(Title · Chip · Field/ · Header Row …)에는
       화면용 라이트 규칙이 그대로 먹는다. 팝업 안에서는 그 규칙을 끊고 역할대로 다시 적는다. */
    '.ls-root[data-theme="light"] .ls-pop [data-name="Title"] p{color:#16233b!important;}',          /* 섹션 소제목 */
    '.ls-root[data-theme="light"] .ls-pop [data-name="Title"] > div:first-child{background-image:none!important;}',
    /* 팝업 제목 바 — 원본은 반투명 남색 판. 라이트에서는 옅은 판 + 짙은 글자 */
    '.ls-root[data-theme="light"] .ls-pop [data-name="Title Bar"]{background-color:rgba(205,219,238,.92)!important;}',
    '.ls-root[data-theme="light"] .ls-pop [data-name="Title Bar"] p{color:#16233b!important;}',
    '.ls-root[data-theme="light"] .ls-pop [data-name="Title Bar"] img{filter:brightness(.3) saturate(1.6);}',
    /* 닫기 단추 — 라이트에서 판까지 뒤집혀 '어두운 판 + 어두운 글리프'가 됐다. 옅은 판 + 짙은 글리프로 */
    '.ls-root[data-theme="light"] .ls-pop [data-name="Icon/Action/Close"]{background-color:rgba(22,35,59,.07)!important;'
      + 'border-color:rgba(22,35,59,.28)!important;background-image:none!important;}',
    '.ls-root[data-theme="light"] .ls-pop [data-name="Icon/Action/Close"]:hover{background-color:rgba(40,97,255,.16)!important;}',
    /* 게이지 — 계기판 그림은 원본(어두운 판)을 그대로 쓴다. 색이 곧 값(청록 진행 호)이라 뒤집으면 뜻이 사라진다.
       그 위 라벨 칩도 원본 짙은 판 그대로 두고 글자는 흰색을 지킨다. */
    '.ls-root[data-theme="light"] .ls-pop [data-name="Gauge Visual"] img{content:normal!important;}',
    '.ls-root[data-theme="light"] .ls-pop [data-name="Readout"] [data-name="Chip"]{background-color:transparent!important;border-color:transparent!important;}',
    '.ls-root[data-theme="light"] .ls-pop [data-name="Readout"] [data-name="Chip"] p{color:#fff!important;}',
    /* 설비 정보 표 — 라벨 칸 판이 라이트에서 옅어지므로 글자도 짙게 간다(흰 글자면 1.84:1 로 묻힌다) */
    '.ls-root[data-theme="light"] .ls-pop [data-name^="Field/"] [data-name="Label"]{color:#16233b!important;}',
    '.ls-root[data-theme="light"] .ls-pop [data-name^="Field/"] [data-name="Value"]{color:#16233b!important;}',
    /* 게이지 단위 — 계기판을 원본(어두운 판)으로 두었으니 그 위 글자는 밝게 */
    '.ls-root[data-theme="light"] .ls-pop [data-name="Readout"] [data-name="Unit"]{color:#cfd8ea!important;}',
    /* Zone 표 최고/최저 — 원본의 빨강·파랑을 밝은 판에서도 읽히는 짙은 짝으로 */
    '.ls-root[data-theme="light"] .ls-pop [data-name="Td/Max"] p{color:#c62828!important;}',
    '.ls-root[data-theme="light"] .ls-pop [data-name="Td/Min"] p{color:#184aa8!important;}',
    /* 열화상 Zone 표 · 범례 · 축 글자 */
    '.ls-root[data-theme="light"] .ls-pop [data-name="Table"] [data-name="Label"]{color:#16233b!important;}',
    '.ls-root[data-theme="light"] .ls-pop [data-name="Legend"] [data-name="Label"]{color:#26375a!important;}',
    '.ls-root[data-theme="light"] .ls-pop [data-name$="Axis"] p{color:#4a5a78!important;}',
    /* 닫기 단추 — 라이트 사본(-lt)은 판의 아래 절반이 검게 뒤집혀 '검은 네모'가 됐다. 원본 단추(남색 판 + 하늘색 X)를 그대로 쓴다 */
    '.ls-root[data-theme="light"] .ls-pop [data-name="Icon/Action/Close"] img{content:normal!important;}',
    /* 단선도 판 테두리(가운데 정렬 10px 선, 원본 #121829) — 라이트에서 짙은 남색 굵은 틀로 남았다. 옅은 판 선으로 */
    '.ls-root[data-theme="light"] .ls-pop [data-name="Widget/Single Line Diagram"] [data-name="Card BG"]{outline-color:#c3d2ec!important;}',
    /* 계통 측정표 · 에너지 요약의 칸 머리(A상 · B상 · C상 / 금일 …) — 화면용 'Metric/ 라벨 칩' 규칙이 글자에 파란 판을 깔았다.
       칸 머리는 판 없이 짙은 글자로 */
    '.ls-root[data-theme="light"] .ls-pop [data-name^="Th"] [data-name="Label"]{background-image:none!important;background-color:transparent!important;color:#26375a!important;}',
    /* B상 값은 원본 초록(#55d1a0 계열) — 밝은 판에서 2:1 로 묻힌다. 같은 초록의 짙은 짝으로 */
    '.ls-root[data-theme="light"] .ls-pop [data-name="Td/Phase B"] [data-name="Value"],'
      + '.ls-root[data-theme="light"] .ls-pop [data-name="Metric/Today"] [data-name="Value"],'
      + '.ls-root[data-theme="light"] .ls-pop [data-name="Metric/Today Peak"] [data-name="Value"]{color:#0b7d52!important;}',   /* 에너지 금일 · 금일 피크도 같은 초록 */
    '.ls-root[data-theme="light"] .ls-pop [data-name^="Metric/"] [data-name="Unit"]{color:#4a5a78!important;}',
    /* 계통 · 에너지 막대 — 인라인으로 바꾼 원본 막대 그림도 라이트 사본(data-2-lt.svg)과 같은 색으로(바닥 #035B7F → #a0cddf) */
    '.ls-root[data-theme="light"] .ls-pop .ls-datasvg stop[stop-color="#035B7F"]{stop-color:#a0cddf;}',
    /* ── 라이트: 단독 팝업 다섯 장 ──
       위의 '팝업 Field 값은 짙은 남색' 규칙이 뜻이 있는 값 색까지 지웠다(알림발생 빨강 · 안전 하늘 · 질소탱크 빨강 · 이온탱크 하늘).
       같은 색의 짙은 짝으로 되돌린다(밝은 판 위 4.5:1 이상). */
    '.ls-root[data-theme="light"] .lsr-root [data-name$="(Safe)"] [data-name="Value"],'
      + '.ls-root[data-theme="light"] .lsc-root [data-name="Widget/Ion Tank"] [data-name="Value"]{color:#0a6f8a!important;}',
    '.ls-root[data-theme="light"] .lsr-root [data-name$="(Alarm)"] [data-name="Value"],'
      + '.ls-root[data-theme="light"] .lsc-root [data-name="Widget/Nitrogen Tank"] [data-name="Value"]{color:#c62828!important;}',
    /* 모듈 칩(모듈 A · B · 배터리) — 원본의 짙은 파란 칩과 흰 글자를 지킨다(밝게 뒤집히면 파란 글자가 파란 판에 묻힌다) */
    '.ls-root[data-theme="light"] .ls-pop [data-name^="Card/"] > [data-name="Chip"]{background-color:transparent!important;border-color:transparent!important;'
      + 'background-image:linear-gradient(180deg,#204ac2,#151b39 51%,#204ac2)!important;}',
    '.ls-root[data-theme="light"] .ls-pop [data-name^="Card/"] > [data-name="Chip"] p{color:#fff!important;}',
    '.ls-root[data-theme="light"] .ls-pop [data-name^="Card/"] > [data-name="Chip"] [data-name="Marker"]{background-image:linear-gradient(0deg,rgba(255,255,255,0),#fff 52%,rgba(255,255,255,0))!important;}',
    /* 파란 닫기 단추 — 원본 그대로(파란 판 + 흰 X). 팝업 제목 바 아이콘 규칙(어둡게)과 아이콘 판 규칙을 끊는다 */
    '.ls-root[data-theme="light"] .ls-pop [data-name="Close Button"] img{filter:none!important;content:normal!important;}',
    '.ls-root[data-theme="light"] .ls-pop [data-name="Close Button"] [data-name="Icon/Action/Close"]{background:none!important;border-color:transparent!important;}',
    /* 상태정보 · 냉각설비 차트 선 — 원본 #52B4FF 는 밝은 판에서 옅다. 같은 파랑의 짙은 짝으로 */
    '.ls-root[data-theme="light"] .lst-root .ls-datasvg [id^="Line/"],.ls-root[data-theme="light"] .lsc-root .ls-datasvg [id^="Line/"]{stroke:#1f6fd6;}',
    /* '팝업' 단추 · 목록(라이트) — 이 화면 라이트 판(#f7faff → #eaf0fb, 선 #7fa3e6)과 짙은 남색 글자 */
    '.ls-root[data-theme="light"] .ls-launch-btn{background:linear-gradient(180deg,#f7faff,#eaf0fb);border-color:#7fa3e6;box-shadow:inset 0 0 3px rgba(40,97,255,.22);color:#26375a;}',
    '.ls-root[data-theme="light"] .ls-launch-btn:hover,.ls-root[data-theme="light"] .ls-launch.open .ls-launch-btn{border-color:#2861ff;color:#16233b;box-shadow:inset 0 0 6px rgba(40,97,255,.35),0 0 8px rgba(40,97,255,.18);}',
    '.ls-root[data-theme="light"] .ls-launch-menu{border-color:#7fa3e6;background:linear-gradient(180deg,#f7faff,#eaf0fb);box-shadow:0 10px 24px rgba(22,35,59,.18);}',
    '.ls-root[data-theme="light"] .ls-launch-menu .hd{color:#4a5a78;}',
    '.ls-root[data-theme="light"] .ls-launch-menu .sep{background:rgba(22,35,59,.14);}',
    '.ls-root[data-theme="light"] .ls-launch-menu button{color:#26375a;}',
    '.ls-root[data-theme="light"] .ls-launch-menu button:hover{background:rgba(40,97,255,.12);color:#16233b;}',
    '.ls-root[data-theme="light"] .ls-launch-menu button.cur{background:rgba(40,97,255,.18);color:#16233b;}',
    '.ls-root[data-theme="light"] .ls-launch-menu button.cur::after{background:#2861ff;box-shadow:none;}',
    '.ls-root[data-theme="light"] .ls-poptrig:hover,.ls-root[data-theme="light"] .ls-poptrig.ls-on{filter:brightness(1.03) drop-shadow(0 0 8px rgba(40,97,255,.3));}',
    /* 펌프 · 알림 빛(라이트에서는 조금 짙게) */
    '.ls-root[data-theme="light"].ls-live .ls-pop .ls-alarmrow [data-name="Td"] p{animation-name:lsAlarmTxtLt;}',
    '@keyframes lsAlarmTxtLt{0%,100%{text-shadow:0 0 0 rgba(198,40,40,0)}50%{text-shadow:0 0 8px rgba(198,40,40,.55)}}',
    /* 드롭다운 메뉴(라이트) */
    '.ls-root[data-theme="light"] .ls-ddmenu{border-color:#7fa3e6;background:linear-gradient(180deg,#f7faff,#eaf0fb);box-shadow:0 8px 20px rgba(22,35,59,.18);}',
    '.ls-root[data-theme="light"] .ls-ddmenu button{color:#26375a;}',
    '.ls-root[data-theme="light"] .ls-ddmenu button:hover{background:rgba(40,97,255,.12);color:#16233b;}',
    '.ls-root[data-theme="light"] .ls-ddmenu button.cur{color:#16233b;}',
  ].join('\n');

  function injectStyle() {
    var st = document.getElementById(STYLE_ID);
    if (st) return;
    st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ══════════════════ 도구 ══════════════════ */
  function all(root, sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }
  function one(root, sel) { return root.querySelector(sel); }
  function editing() { return !!document.querySelector('.dtstage.dt-content-editing, .dtstage.dt-editing, .ls-root.ls-edit-layout'); }
  function layoutEditing(root) { return !!(root.closest('.dt-editing') || root.classList.contains('ls-edit-layout')); }
  function idle() { return typeof window.__wembIdle === 'function' ? window.__wembIdle() : document.hidden; }
  function load(k) { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function nameOf(el) { return el.getAttribute('data-name') || ''; }

  /* 원본에서 '누르는 자리'임을 알린다 — 손가락 커서 · 키보드 초점 · 역할 · 툴팁 */
  function clickable(el, title, fn) {
    if (!el) return;
    el.classList.add('ls-click');
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    if (title) el.setAttribute('title', title);
    if (fn) {
      /* 패널편집(배치) 중에는 스튜디오가 click 을 캡처 단계에서 삼킨다 — 기능 동작은 그때 쉬는 게 맞다 */
      el.addEventListener('click', function (e) { if (editing()) return; fn(e); });
      el.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && !editing()) { e.preventDefault(); fn(e); } });
    }
  }

  /* 라이브가 쓴 값과 지금 글자가 다르면 사람이 고친 것 — 덮지 않는다 */
  function claimed(p) { return p.__lsLast != null && p.textContent !== p.__lsLast; }
  function write(p, s, flash) {
    if (!p || claimed(p)) return;
    if (p.textContent === s) { p.__lsLast = s; return; }
    p.textContent = s;
    p.__lsLast = s;
    p.classList.add('ls-num');
    if (flash) { p.classList.remove('ls-tick'); void p.offsetWidth; p.classList.add('ls-tick'); }
  }
  /* 숫자를 부드럽게 옮긴다(0.8초) */
  function tween(p, from, to, fmt, st) {
    if (!p || claimed(p)) return;
    var t0 = performance.now(), dur = 800;
    if (p.__lsTw) cancelAnimationFrame(p.__lsTw);
    (function step(t) {
      if (claimed(p)) return;
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      write(p, fmt(from + (to - from) * e), false);
      if (k < 1) p.__lsTw = requestAnimationFrame(step);
      else { write(p, fmt(to), false); p.classList.remove('ls-tick'); void p.offsetWidth; p.classList.add('ls-tick'); }
    })(t0);
  }

  /* 장면 이름 — ACB·계통·에너지 진단 화면은 STATCOM 화면(.lsm-root) **위에** 팝업을 얹은 것이라 뿌리 클래스가 같다.
     겹친 팝업(공통 클래스 .ls-pop)의 종류로 장면을 가른다(접기·차트·배치 기억이 섞이지 않게). */
  var POP_SCENE = {
    lsa: 'acb', lsy: 'system', lse: 'energy',
    /* 단독 팝업 다섯 장(Figma popup-3 ~ 7) — 상태정보 · AC전원실 · 충전기/배터리 · 냉각설비 · 알림 */
    lst: 'transformer', lsp: 'acroom', lsb: 'charger', lsc: 'cooling', lsr: 'alarm',
  };
  /* 이 화면(페이지) 자체의 팝업 — 런처로 겹쳐 띄운 팝업(.ls-overlay)은 빼고 본다(장면 이름 · 기억이 섞이지 않게) */
  function pagePop(root) {
    return Array.prototype.filter.call(root.querySelectorAll('.ls-pop'), function (p) { return !p.closest('.ls-overlay'); })[0] || null;
  }
  function sceneOf(root) {
    var pop = pagePop(root);
    if (pop) for (var px in POP_SCENE) if (pop.classList.contains(px + '-root')) return POP_SCENE[px];
    return root.classList.contains('lsd-root') ? 'datacenter' : 'statcom';
  }
  /* 바탕 화면(팝업 밖) 노드만 — 팝업에 같은 이름의 위젯(Electrical Readings · Charger Battery)이 있어
     바탕 화면용 라이브가 팝업 글자를 잡지 않게 한다 */
  function outsidePop(el) { return !el.closest('.ls-pop'); }
  function frameOf(root) { return root.querySelector(':scope > [data-name^="Screen/"]'); }

  /* ══════════════════ 1. 반응형 ══════════════════ */
  /* 블록 = 화면 뿌리에서 display:contents 사슬을 따라 내려가다 처음 만나는 '자리를 가진' 상자.
     그룹은 화면 바로 아래 조각 이름(Header · Event List · Left Panel · Right Panel · Background). */
  function collectBlocks(frame) {
    var out = [];
    function walk(el, grp) {
      Array.prototype.forEach.call(el.children, function (c) {
        if (c.classList.contains('dt-added')) return;
        var cs = getComputedStyle(c);
        if (cs.display === 'contents') { walk(c, grp); return; }
        if (cs.position === 'absolute' || cs.position === 'fixed') out.push({ el: c, grp: grp });
      });
    }
    Array.prototype.forEach.call(frame.children, function (top) {
      var n = nameOf(top);
      var grp = n === 'Left Panel' ? 'L' : n === 'Right Panel' ? 'R' : n === 'Event List' ? 'E' : n === 'Header' ? 'H' : n === 'Background' ? 'B' : 'X';
      var cs = getComputedStyle(top);
      if (cs.display === 'contents') walk(top, grp);
      else out.push({ el: top, grp: grp });
    });
    return out;
  }

  function installFit(root, st) {
    var frame = frameOf(root);
    if (!frame) return;
    frame.style.position = 'absolute';
    frame.style.left = '0';
    frame.style.top = '0';
    frame.style.width = BASE_W + 'px';
    frame.style.height = BASE_H + 'px';
    frame.style.transformOrigin = '0 0';
    var blocks = collectBlocks(frame);
    /* 표시(쓰기)를 다 붙인 뒤에 자리(offsetTop)를 읽는다 — 블록마다 붙이고 읽으면 그때마다 레이아웃을 다시 한다.
       블록은 모두 절대 위치라 다른 블록의 표시가 제 자리를 바꾸지 않는다(결과는 같다) */
    blocks.forEach(function (b) {
      b.el.classList.add('ls-blk');
      b.el.setAttribute('data-ls-grp', b.grp);
    });
    blocks.forEach(function (b) {
      b.top = b.el.offsetTop;
      b.name = nameOf(b.el);
      if (b.el.querySelector('[data-name="Fold Button"]') || b.name === 'Fold Button') b.el.classList.add('ls-foldbtn');
      if (b.name === 'Site Selector') b.el.classList.add('ls-keep');
    });
    var bg = blocks.filter(function (b) { return b.grp === 'B'; })[0];
    if (bg) { var im = bg.el.querySelector('img'); if (im) im.classList.add('ls-bgimg'); }
    /* 우측 판 위젯의 세로 퍼짐 — 제목(Title)은 바로 아래 위젯과 짝을 맺어 같이 움직인다 */
    var R = blocks.filter(function (b) { return b.grp === 'R'; });
    var rw = R.filter(function (b) { return /^Widget\//.test(b.name); });
    var t0 = Math.min.apply(null, rw.map(function (b) { return b.top; }));
    var t1 = Math.max.apply(null, rw.map(function (b) { return b.top; }));
    rw.forEach(function (b) { b.spread = t1 > t0 ? (b.top - t0) / (t1 - t0) : 0; });
    R.forEach(function (b) {
      if (b.name !== 'Title') return;
      var below = rw.filter(function (w) { return w.top >= b.top && w.top - b.top < 70; })[0];
      b.spread = below ? below.spread : 0;
      if (below) { b.el.__lsPair = below.el; below.el.__lsPair = b.el; }
    });
    st.blocks = blocks;
    st.frame = frame;

    function layout() {
      var W = root.clientWidth, H = root.clientHeight;
      if (!W || !H) return;
      var S = Math.min(W / BASE_W, H / BASE_H);
      var VW = W / S, VH = H / S, exW = Math.max(0, VW - BASE_W), exH = Math.max(0, VH - BASE_H);
      st.S = S; st.exW = exW; st.exH = exH;
      frame.style.transform = 'scale(' + S + ')';
      blocks.forEach(function (b) {
        var s = b.el.style, n = b.name, tx = 0, ty = 0;
        if (b.grp === 'B') {
          /* 바탕 사진 판은 원본이 가운데 정렬(left/top 50% + translate(-50%))이고, 생성기가 그 이동을 반 픽셀 방지용
             margin(-960/-540)으로 바꿨다(README ⑭). 여기서 left/top 을 0 으로 붙일 때 margin 도 함께 걷어야 한다 —
             안 그러면 판이 왼쪽 위로 반 화면 밀려 오른쪽 · 아래 절반에 사진이 비었다(2026-10-02 발견, 모든 LS 장면). */
          s.left = '0px'; s.top = '0px'; s.margin = '0'; s.width = VW + 'px'; s.height = VH + 'px'; s.transform = 'none';
          return;
        }
        if (b.grp === 'H') {
          tx = exW / 2;
          if (n === 'Header Bar') s.width = (1800 + exW) + 'px';
        } else if (b.grp === 'E') {
          tx = exW / 2; ty = exH;
          s.width = (1844 + exW) + 'px';
        } else if (b.grp === 'L') {
          if (n === 'Panel BG') s.bottom = 'calc(7.41% - ' + exH + 'px)';
          if (n === 'Body') s.height = (874.185 + exH) + 'px';
        } else if (b.grp === 'R') {
          tx = exW;
          if (b.el.querySelector(':scope > * > [data-name="Panel BG"]') || n === 'Panel BG') s.bottom = 'calc(7.41% - ' + exH + 'px)';
          if (n === 'Card BG') s.height = (655 + exH) + 'px';
          if (b.spread != null) ty = exH * b.spread;
        } else if (/^Popup\//.test(n)) {
          /* 겹쳐 뜬 팝업 — 원본에서 화면 한가운데(33..1888 · 117..963, 가운데가 960,540)에 놓였다.
             늘어난 몫을 절반씩 나눠 받아 어떤 창 비율에서도 가운데에 그대로 있는다. */
          tx = exW / 2; ty = exH / 2;
        } else {
          tx = exW / 2;
        }
        s.setProperty('--ls-tx', tx.toFixed(2) + 'px');
        s.setProperty('--ls-ty', ty.toFixed(2) + 'px');
      });
      if (st.onLayout) st.onLayout();
    }
    var rsT = 0;
    function relayout() {
      root.classList.add('ls-resizing');
      layout();
      clearTimeout(rsT);
      rsT = setTimeout(function () { root.classList.remove('ls-resizing'); }, 120);
    }
    layout();
    st.relayout = relayout;
    if (window.ResizeObserver) {
      st.ro = new ResizeObserver(relayout);
      st.ro.observe(root);
    } else {
      st.onResize = relayout;
      window.addEventListener('resize', relayout);
    }
    /* 첫 배치가 끝난 다음부터 움직임을 켠다(열자마자 블록이 미끄러져 들어오지 않게) */
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('ls-live'); }); });
  }

  /* ══════════════════ 2. 시계 · 갱신 시각 ══════════════════ */
  var WD_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  var WD_KO = ['일', '월', '화', '수', '목', '금', '토'];
  function installClock(root, st) {
    var tb = one(root, '[data-name="Toolbar"]');
    if (!tb) return;
    var dp = all(tb, '[data-name="Date"] > p'), tp = one(tb, '[data-name="Time"] p');
    var wx = one(root, '[data-name="Widget/Weather"] [data-name="Timestamp"] p');
    /* 요일 글자 상자는 원본 'TUE' 폭으로 고정돼 있다 — 'MON'·'WED' 처럼 넓은 요일이면 시각에 붙어 버렸다.
       폭을 글자에 맞게 풀어 원본의 요일-시각 간격을 지킨다. */
    [dp[1], tp].forEach(function (p) { if (p) { p.style.width = 'auto'; p.style.whiteSpace = 'nowrap'; } });
    function tick() {
      var d = new Date();
      if (dp[0]) write(dp[0], d.getFullYear() + '. ' + p2(d.getMonth() + 1) + '.' + p2(d.getDate()));   /* 원본 서식 '2026. 09.26' */
      if (dp[1]) write(dp[1], WD_EN[d.getDay()]);
      if (tp) write(tp, p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds()));
      /* 날씨 — 정시마다 갱신되는 예보처럼 '이번 시 정각' */
      if (wx) write(wx, p2(d.getMonth() + 1) + '.' + p2(d.getDate()) + ' (' + WD_KO[d.getDay()] + ') ' + p2(d.getHours()) + ':00 갱신');
    }
    tick();
    st.timers.push(setInterval(function () { if (!editing()) tick(); }, 1000));
  }

  /* ══════════════════ 3. 알림 목록 ══════════════════ */
  function stamp(d) {
    return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds());
  }
  function installEventList(root, st) {
    var ev = one(root, '[data-name="Event List"]');
    if (!ev) return;
    var head = ev.firstElementChild, table = ev.lastElementChild;
    var btn = one(ev, '[data-name="Btn"]');
    var body = one(ev, '[data-name="Body"]');
    var rows = body ? all(body, ':scope > [data-name="Row"]') : [];

    /* 발생시각 — 원본은 자리표시자('2026-00--00 00:00:00')라 열 때마다 최근 시각으로 흐르는 표를 만든다.
       맨 윗줄은 '방금'이 아니라 몇십 초 전, 아래로 갈수록 몇 분씩 벌어진다(초 단위까지 흩어 만든 티를 줄인다). */
    var GAPS = [37, 214, 689, 1537];
    var now = Date.now();
    rows.forEach(function (r, i) {
      var c = r.children[1] && r.children[1].querySelector('p');
      if (c) write(c, stamp(new Date(now - (GAPS[i] != null ? GAPS[i] : 1537 + i * 611) * 1000)));
      var no = r.children[0] && r.children[0].querySelector('p');
      if (no) write(no, String(i + 1));
    });

    /* 등급 칩 — 원본 Hover 변형(테두리 #45c5ff + 안쪽 빛)을 호버 · 고름에 쓴다. 처음 고름 = ALL(원본 그대로) */
    var list = one(head, '[data-name="List"]');
    var chips = list ? Array.prototype.slice.call(list.children) : [];
    chips.forEach(function (c, i) {
      c.classList.add('ls-chip');
      /* ALL 은 원본에서 이미 Hover 모습 — 겉모습을 idle 칩과 맞춘 뒤 '고름'으로 다시 켠다 */
      if (i === 0) { c.style.backgroundColor = '#193058'; c.classList.add('ls-on'); }
      clickable(c, ['전체', '위험(Critical)', '주요(Major)', '경미(Minor)', '경고(Warning)'][i] || '', function () {
        chips.forEach(function (x) { x.classList.toggle('ls-on', x === c); });
      });
    });
    var counts = chips.map(function (c) { return one(c, '[data-name="Value"] p'); });
    var cnt = counts.map(function (p) { return p ? (parseInt(p.textContent, 10) || 0) : 0; });

    /* 펼치기/접기 — 원본 상자(높이 46 · overflow clip) 아래에 표가 숨어 있다. 표 높이를 재서 편다(아래가 붙어 있어 위로 자란다) */
    if (btn) {
      btn.classList.add('ls-evbtn');
      var arrow = btn.querySelector('[data-node-id$=";13:278"]') || btn.lastElementChild;
      if (arrow) arrow.classList.add('ls-evarrow');
      var closedH = ev.offsetHeight || 46;
      var open = load(LS_FOLD)[sceneOf(root) + ':ev'] === 1;
      var set = function (o, instant) {
        open = o;
        var h = o ? closedH + 1 + table.offsetHeight : closedH;
        if (instant) { ev.style.transition = 'none'; ev.style.height = h + 'px'; void ev.offsetHeight; ev.style.transition = ''; }
        else ev.style.height = h + 'px';
        root.classList.toggle('ls-ev-open', o);
        btn.setAttribute('aria-expanded', o ? 'true' : 'false');
        btn.setAttribute('title', o ? '알림 목록 접기' : '알림 목록 펼치기');
        var m = load(LS_FOLD); m[sceneOf(root) + ':ev'] = o ? 1 : 0; save(LS_FOLD, m);
      };
      clickable(btn, '알림 목록 펼치기', function () { set(!open); });
      set(open, true);
    }

    /* 표 줄 고르기 */
    function wireRow(r) {
      r.addEventListener('click', function () {
        if (editing()) return;
        var on = !r.classList.contains('ls-on');
        all(body, '[data-name="Row"]').forEach(function (x) { x.classList.remove('ls-on'); });
        r.classList.toggle('ls-on', on);
      });
      r.style.cursor = 'pointer';
    }
    rows.forEach(wireRow);

    /* 피드 — 9~14초마다 맨 아래 줄이 맨 위로 올라오며 '지금'이 찍힌다. 칩의 건수도 함께 는다. */
    function feed() {
      if (editing() || idle() || !body) return;
      var rs = all(body, ':scope > [data-name="Row"]');
      if (!rs.length) return;
      var last = rs[rs.length - 1];
      body.insertBefore(last, rs[0]);
      var c = last.children[1] && last.children[1].querySelector('p');
      if (c) { c.__lsLast = c.textContent; write(c, stamp(new Date(Date.now() - 2000))); }
      all(body, ':scope > [data-name="Row"]').forEach(function (r, i) {
        var no = r.children[0] && r.children[0].querySelector('p');
        if (no) { no.__lsLast = no.textContent; write(no, String(i + 1)); }
      });
      last.classList.remove('ls-new'); void last.offsetWidth; last.classList.add('ls-new');
      var g = 1 + Math.floor(Math.random() * 4);
      [0, g].forEach(function (k) {
        var p = counts[k]; if (!p) return;
        var from = cnt[k]; cnt[k] += 1;
        tween(p, from, cnt[k], function (v) { return String(Math.round(v)); });
      });
    }
    (function loop() {
      st.timers.push(setTimeout(function () { feed(); loop(); }, 9000 + Math.random() * 5000));
    })();
  }

  /* ══════════════════ 4. 판 접기 ══════════════════ */
  function installFold(root, st) {
    var fold = load(LS_FOLD), sc = sceneOf(root);
    all(root, '.ls-foldbtn').forEach(function (b) {
      var side = b.getAttribute('data-ls-grp');
      if (side !== 'L' && side !== 'R') return;
      var cls = 'ls-fold-' + side;
      var upd = function () {
        var on = root.classList.contains(cls);
        b.setAttribute('aria-expanded', on ? 'false' : 'true');
        b.setAttribute('title', (side === 'L' ? '좌측' : '우측') + ' 판 ' + (on ? '펼치기' : '접기'));
      };
      clickable(b, '', function () {
        root.classList.toggle(cls);
        var m = load(LS_FOLD); m[sc + ':' + side] = root.classList.contains(cls) ? 1 : 0; save(LS_FOLD, m);
        upd();
      });
      if (fold[sc + ':' + side] === 1) root.classList.add(cls);
      upd();
    });
  }

  /* ══════════════════ 5. 눌리는 자리 · 고르기 ══════════════════ */
  function goScene(to) {
    if (typeof window.__gotoLsScene === 'function') { window.__gotoLsScene(to); return; }
    /* 낱장 미리보기 — 같은 폴더의 다른 화면 파일로(쿼리 유지) */
    location.href = './' + to + '.html' + location.search;
  }
  function installPicks(root, st) {
    all(root, '[data-name="Actions"] > [data-name^="Icon/Action/"]').forEach(function (el) {
      var n = nameOf(el).split('/').pop();
      clickable(el, { Home: '홈', User: '사용자', Logout: '로그아웃' }[n] || n, n === 'Home' ? function () { goScene('statcom'); } : null);
    });
    all(root, '[data-name="Search Button"]').forEach(function (el) { clickable(el, 'STATCOM 시스템 검색'); });
    /* 자산 필터 — 하나씩 켜고 끈다 */
    var fbtn = all(root, '[data-name^="Button/"]');
    fbtn.forEach(function (el) {
      clickable(el, (el.textContent || '').trim() + ' 보기', function () {
        var on = !el.classList.contains('ls-on');
        fbtn.forEach(function (x) { x.classList.remove('ls-on'); });
        el.classList.toggle('ls-on', on);
      });
    });
    /* STATCOM 시스템 상태 배지 — 고르기 + 이상 표지 숨쉬기 */
    var badges = all(root, '[data-name^="Status/"]');
    badges.forEach(function (el) {
      clickable(el, (el.textContent || '').trim() || nameOf(el).split('/').pop(), function () {
        var on = !el.classList.contains('ls-on');
        badges.forEach(function (x) { x.classList.remove('ls-on'); });
        el.classList.toggle('ls-on', on);
      });
      var mk = one(el, '[data-name="Marker"] img');
      /* 빨간 표지(marker-2 · marker-3)만 — 파일 이름이 곧 상태다 */
      if (mk && /marker-(2|3)(-lt)?\.svg/.test(mk.getAttribute('src') || '')) el.querySelector('[data-name="Marker"]').classList.add('ls-alarm');
    });
    all(root, '[data-name="Widget/Sensor Status"] > [data-name^="Item/"]').forEach(function (el) {
      clickable(el, (el.textContent || '').trim().split(/\s+/)[0] + ' 센서 현황');
    });
    /* 보기 모드 — 하나만 켜진다 */
    var views = all(root, '[data-name^="Icon/View/"]');
    var VT = { Home: '홈 시점', Fit: '전체 맞춤', Fullscreen: '전체 화면', Walkthrough: '워크스루' };
    views.forEach(function (el) {
      clickable(el, VT[nameOf(el).split('/').pop()] || '', function () {
        var on = !el.classList.contains('ls-on');
        views.forEach(function (x) { x.classList.remove('ls-on'); });
        el.classList.toggle('ls-on', on);
      });
    });
    /* 내비 — 확대/축소/회전. 나침반 바늘이 회전을 따라간다 */
    var needle = one(root, '[data-name="Needle"]');
    var dial = one(root, '[data-name="Dial"]');
    var ang = 0;
    var NT = { 'Zoom In': '확대', 'Zoom Out': '축소', 'Rotate Left': '왼쪽 회전', 'Rotate Right': '오른쪽 회전' };
    all(root, '[data-name^="Icon/Nav/"]').forEach(function (el) {
      var k = nameOf(el).split('/').pop();
      clickable(el, NT[k] || k, function () {
        if (!dial) return;
        if (k === 'Rotate Left') ang -= 30; else if (k === 'Rotate Right') ang += 30; else return;
        dial.classList.add('ls-spin');
        dial.style.rotate = ang + 'deg';
      });
    });
    clickable(one(root, '[data-name="Pad"]'), '시점 이동');
    /* 사이트 선택 — 다른 화면으로 */
    all(root, '[data-name="Site Selector"] > [data-name^="Option/"]').forEach(function (el) {
      var n = nameOf(el);
      var to = /Data Center/.test(n) ? 'datacenter' : 'statcom';
      var self = /\(Selected\)/.test(n);
      el.setAttribute('role', 'radio');
      el.setAttribute('aria-checked', self ? 'true' : 'false');
      clickable(el, self ? '지금 보고 있는 화면' : (to === 'datacenter' ? 'Data Center 화면으로' : 'STATCOM 화면으로'), self ? null : function () { goScene(to); });
      el.setAttribute('role', 'radio');
    });
  }

  /* ══════════════════ 6. 토글(원본 On/Off 두 모습을 서로 옮긴다) ══════════════════ */
  function installToggles(root, st) {
    var tg = all(root, '[data-name="Toggle (On)"], [data-name="Toggle (Off)"]');
    if (!tg.length) return;
    function read(t) {
      var tr = one(t, '[data-name="Track"]'), kn = one(t, '[data-name="Knob"]'), p = one(t, ':scope > p');
      var fill = tr && tr.firstElementChild, sh = tr && tr.lastElementChild;
      return {
        fill: fill && getComputedStyle(fill).backgroundColor, sh: sh && getComputedStyle(sh).boxShadow,
        ml: kn && getComputedStyle(kn).marginLeft, img: kn && one(kn, 'img') && one(kn, 'img').getAttribute('src'),
        pml: p && getComputedStyle(p).marginLeft, pc: p && getComputedStyle(p).color, txt: p && p.textContent.trim(),
        ta: p && getComputedStyle(p).textAlign,
      };
    }
    var ON = null, OFF = null;
    tg.forEach(function (t) { if (/\(On\)/.test(nameOf(t))) ON = ON || read(t); else OFF = OFF || read(t); });
    if (!ON || !OFF) return;
    function paint(t, v) {
      var L = v ? ON : OFF;
      var tr = one(t, '[data-name="Track"]'), kn = one(t, '[data-name="Knob"]'), p = one(t, ':scope > p');
      if (tr && tr.firstElementChild) tr.firstElementChild.style.backgroundColor = L.fill;
      if (tr && tr.lastElementChild) tr.lastElementChild.style.boxShadow = L.sh;
      if (kn) { kn.style.marginLeft = L.ml; var im = one(kn, 'img'); if (im && L.img) im.setAttribute('src', L.img); }
      if (p) { p.style.marginLeft = L.pml; p.style.color = L.pc; p.style.textAlign = L.ta; write(p, L.txt); }
      t.setAttribute('aria-checked', v ? 'true' : 'false');
    }
    tg.forEach(function (t) {
      var v = /\(On\)/.test(nameOf(t));
      t.setAttribute('role', 'switch');
      clickable(t, '', function () { v = !v; paint(t, v); });
      t.setAttribute('role', 'switch');
      t.setAttribute('aria-checked', v ? 'true' : 'false');
    });
  }

  /* ══════════════════ 7. 라이브 수치 ══════════════════ */
  function measureP(root, sel) { var m = all(root, sel).filter(outsidePop)[0]; return m ? all(m, ':scope > p') : []; }
  function installLive(root, st) {
    var jobs = [];
    /* 전압 · 전류(STATCOM) — 원본 154 KV · 250 A 언저리 */
    var v = measureP(root, '[data-name="Metric/Voltage"] [data-name="Measurement"]')[0];
    var a = measureP(root, '[data-name="Metric/Current"] [data-name="Measurement"]')[0];
    if (v) jobs.push({ p: v, base: 154, dev: 1.6, fmt: function (x) { return String(Math.round(x)); }, ms: 2200 });
    if (a) jobs.push({ p: a, base: 250, dev: 6, fmt: function (x) { return String(Math.round(x)); }, ms: 1800 });
    /* 충전기/배터리(Data Center) — 원본 글자가 '128.' + '0V' 로 쪼개져 있다(그 모양 그대로 쓴다) */
    var bv = measureP(root, '[data-name="Row/Voltage"] [data-name="Measurement"]');
    if (bv.length === 2) jobs.push({ pair: bv, base: 128.0, dev: 0.8, ms: 2600,
      put: function (x) { var s = x.toFixed(1).split('.'); write(bv[0], s[0] + '.'); write(bv[1], s[1] + 'V'); } });
    var bc = measureP(root, '[data-name="Row/Current"] [data-name="Measurement"]')[0];
    if (bc) jobs.push({ p: bc, base: 80, dev: 3, fmt: function (x) { return String(Math.round(x)); }, ms: 2000 });
    var bt = measureP(root, '[data-name="Row/Temp"] [data-name="Measurement"]')[0];
    if (bt) jobs.push({ p: bt, base: 50.0, dev: 0.9, fmt: function (x) { return x.toFixed(1); }, ms: 3400 });
    /* 날씨 — 천천히 */
    var hum = measureP(root, '[data-name="Item/Humidity"] [data-name="Measurement"]')[0];
    if (hum) jobs.push({ p: hum, base: 79, dev: 2.4, fmt: function (x) { return String(Math.round(x)); }, ms: 9000 });
    var wind = measureP(root, '[data-name="Item/Wind"] [data-name="Measurement"]')[1];
    if (wind) jobs.push({ p: wind, base: 1.1, dev: 0.5, fmt: function (x) { return Math.max(0, x).toFixed(1); }, ms: 5000 });
    var temp = one(root, '[data-name="Temperature"] [data-name="Text Wrap"] > p');
    if (temp) jobs.push({ p: temp, base: 21.9, dev: 0.5, fmt: function (x) { return x.toFixed(1) + ' °C'; }, ms: 12000 });
    var anom = measureP(root, '[data-name="Item/Anomaly"] [data-name="Measurement"]')[0];
    if (anom) jobs.push({ p: anom, base: 2, dev: 1, fmt: function (x) { return String(Math.max(0, Math.round(x))); }, ms: 15000 });

    jobs.forEach(function (j) {
      var cur = j.base;
      j.p && (j.p.__lsLast = j.p.textContent);
      j.pair && j.pair.forEach(function (p) { p.__lsLast = p.textContent; });
      var go = function () {
        if (editing() || idle()) return;
        var nx = clamp(cur + rnd(-j.dev, j.dev) * 0.6, j.base - j.dev, j.base + j.dev);
        if (j.put) { if (j.pair.some(claimed)) return; j.put(nx); j.pair.forEach(function (p) { p.classList.remove('ls-tick'); void p.offsetWidth; p.classList.add('ls-tick'); }); }
        else tween(j.p, cur, nx, j.fmt);
        cur = nx;
      };
      st.timers.push(setInterval(go, j.ms + Math.random() * 400));
    });
  }

  /* ══════════════════ 8. 차트 바꾸기 ══════════════════
     위젯마다 이 프로젝트(변전소 · STATCOM · 데이터센터 전원)에 맞는 차트를 '추천 순'으로 둔다.
     첫 항목이 추천이다. 고른 차트는 위젯 자리에 겹쳐 그려지고(원본은 그대로 밑에 남는다) 실시간처럼 흐른다.
     색은 원본 팔레트 — #4b98ff(값 파랑) · #29e2ff(WA 하늘) · #fcb268(MA 주황) · #55b05d(ON 초록) · #f68989(CR 빨강). */
  var C = { blue: '#4b98ff', cyan: '#29e2ff', orange: '#fcb268', green: '#55b05d', red: '#f68989', yellow: '#fce380', brand: '#2861ff' };
  var CHARTS = {
    'Widget/Weather': [
      { k: 'line', t: '기온 추이', unit: '°C', series: [['기온', C.cyan, 21.9, 0.6]], lo: 18, hi: 26 },
      { k: 'gauge', t: '습도', unit: '%', v: [79, 3], max: 100, c: C.blue },
      { k: 'bar', t: '시간대별 강수량', unit: 'mm', cats: ['06', '09', '12', '15', '18', '21'], v: [1.5, 1.2], max: 4, c: C.cyan },
    ],
    'Widget/Sensor Status': [
      { k: 'bar', t: '센서 이벤트', unit: '건', cats: ['화재', '소화', '도어', '이상감지'], v: [2, 1.4], max: 6, c: C.blue },
      { k: 'donut', t: '센서 상태', parts: [['정상', C.blue, 368], ['주의', C.yellow, 2], ['이상', C.red, 2]] },
    ],
    'Widget/STATCOM System': [
      { k: 'donut', t: '계통 상태', parts: [['정상', C.green, 6], ['주의', C.orange, 1], ['이상', C.red, 3]] },
      { k: 'hbar', t: '모듈 부하율', unit: '%', cats: ['BUS1', 'BUS2', 'DS1', 'DS2', 'ES0', 'ES1'], v: [62, 14], max: 100, c: C.cyan },
      { k: 'line', t: '무효전력 보상량', unit: 'MVar', series: [['Q', C.blue, 48, 5], ['목표', C.orange, 50, 0.4]], lo: 30, hi: 65 },
    ],
    'Widget/Mini Map': [
      { k: 'donut', t: '설비 가동 현황', parts: [['가동', C.blue, 42], ['대기', C.cyan, 6], ['점검', C.orange, 2]] },
    ],
    'Widget/Transformer Info': [
      { k: 'gauge', t: '변압기 부하율', unit: '%', v: [68, 6], max: 100, c: C.cyan },
      { k: 'line', t: '권선 온도 추이', unit: '°C', series: [['권선', C.orange, 62, 1.6], ['유온', C.blue, 48, 1.1]], lo: 35, hi: 80 },
    ],
    'Widget/Transformer Health': [
      { k: 'bar', t: '건전도 지수', unit: '점', cats: ['변압기A', '변압기B'], v: [92, 3], max: 100, c: C.green },
      { k: 'line', t: '부분방전 추이', unit: 'pC', series: [['A', C.cyan, 12, 2.2], ['B', C.orange, 18, 3]], lo: 0, hi: 32 },
    ],
    'Widget/Electrical Readings': [
      { k: 'line', t: '전압 · 전류 실시간', unit: '', series: [['전압(kV)', C.cyan, 154, 1.2], ['전류(A/2)', C.orange, 125, 3]], lo: 110, hi: 165 },
      { k: 'gauge', t: '전압', unit: 'kV', v: [154, 1.4], min: 140, max: 170, c: C.cyan },
      { k: 'bar', t: '상별 전류', unit: 'A', cats: ['R상', 'S상', 'T상'], v: [250, 8], max: 320, c: C.orange },
    ],
    'Widget/Power Status': [
      { k: 'area', t: '입력 전력 추이', unit: 'kW', series: [['AC 입력', C.blue, 412, 14]], lo: 340, hi: 470 },
      { k: 'gauge', t: '운전 효율', unit: '%', v: [96.4, 0.8], max: 100, min: 80, c: C.green },
    ],
    'Widget/Charger Battery': [
      { k: 'gauge', t: '배터리 충전율(SOC)', unit: '%', v: [87, 2], max: 100, c: C.green },
      { k: 'line', t: '충방전 전류', unit: 'A', series: [['충전', C.green, 80, 3], ['방전', C.red, 12, 4]], lo: 0, hi: 100 },
      { k: 'bar', t: '셀 전압', unit: 'V', cats: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'], v: [3.55, 0.05], max: 4.2, c: C.cyan, dec: 2 },
    ],
    /* ── ACB 진단 팝업의 위젯 — 화면에 이미 있는 값(단선도 220V/1~5A · 권선 24° · Zone 32~49° · PD)에서 이어 붙인다 ── */
    'Widget/Single Line Diagram': [
      { k: 'hbar', t: '회로별 부하율', unit: '%', cats: ['TR A', 'TR B', 'LOAD #1', 'LOAD #2'], v: [64, 16], max: 100, c: C.cyan },
      { k: 'line', t: '모선 전압 추이', unit: 'V', series: [['TR A', C.blue, 220, 1.2], ['TR B', C.cyan, 220, 1.2]], lo: 210, hi: 230 },
      { k: 'bar', t: '상별 전류', unit: 'A', cats: ['R상', 'S상', 'T상'], v: [3, 1.2], max: 8, c: C.orange, dec: 1 },
    ],
    'Widget/Device Info': [
      { k: 'donut', t: '설비 상태 구성', parts: [['정상', C.green, 3], ['주의', C.orange, 1], ['이상', C.red, 1]] },
      { k: 'gauge', t: '가동률', unit: '%', v: [98.2, 0.6], max: 100, min: 90, c: C.green },
    ],
    'Widget/Equipment Sensors': [
      { k: 'hbar', t: '센서별 측정값', unit: '', cats: ['냉각팬 °C', '온습도 %', '권선 °C'], v: [30, 10], max: 60, c: C.cyan },
      { k: 'line', t: '권선 온도 추이', unit: '°C', series: [['권선', C.orange, 24, 1.1], ['냉각팬', C.cyan, 34, 1.4]], lo: 15, hi: 45 },
      { k: 'donut', t: '센서 상태 구성', parts: [['정상', C.green, 4], ['점검', C.orange, 1], ['미검출', C.blue, 1]] },
    ],
    'Widget/Voltage Trend': [
      { k: 'line', t: '삼상 전원전압 rms', unit: 'V', series: [['R상', C.blue, 250, 2.2], ['S상', C.green, 250, 2.2], ['T상', C.orange, 250, 2.2]], lo: 235, hi: 265 },
      { k: 'area', t: '전압 불평형률', unit: '%', series: [['불평형', C.cyan, 1.2, 0.35]], lo: 0, hi: 3 },
      { k: 'bar', t: '상별 전압 평균', unit: 'V', cats: ['R상', 'S상', 'T상'], v: [250, 3], max: 280, c: C.blue },
    ],
    'Widget/Power Gauge': [
      { k: 'gauge', t: '전원 게이지', unit: 'KW', v: [123, 4], max: 200, c: C.cyan },
      { k: 'line', t: '전력 · 전압 추이', unit: '', series: [['전력(KW)', C.cyan, 123, 3], ['전압(V)', C.blue, 123, 2]], lo: 100, hi: 150 },
      { k: 'donut', t: '전원 계통 상태', parts: [['정상', C.green, 8], ['주의', C.orange, 1], ['이상', C.red, 1]] },
    ],
    'Widget/Thermal Imaging': [
      { k: 'line', t: 'Zone 온도 추이', unit: '°C', series: [['Zone1', C.red, 49, 1.4], ['Zone2', C.orange, 45, 1.2], ['Zone3', C.cyan, 32, 1]], lo: 20, hi: 60 },
      { k: 'bar', t: 'Zone 최고 온도', unit: '°C', cats: ['Zone1', 'Zone2', 'Zone3'], v: [47, 3], max: 70, c: C.orange },
      { k: 'gauge', t: '최고 온도', unit: '°C', v: [49, 1.5], max: 80, c: C.red },
    ],
    'Widget/PD Diagnostics': [
      { k: 'line', t: '부분방전 추이', unit: 'pC', series: [['1차측', C.cyan, 14, 2.4], ['2차측', C.orange, 9, 2]], lo: 0, hi: 34 },
      { k: 'bar', t: '위상별 방전 강도', unit: 'pC', cats: ['0°', '90°', '180°', '270°'], v: [12, 5], max: 40, c: C.blue },
      { k: 'gauge', t: '방전 레벨', unit: 'pC', v: [14, 2.5], max: 50, c: C.green },
    ],
    /* ── 계통 진단 팝업(76:875) — 화면의 값(A/B/C상 전압 · 유효전력 · 역률 · 부하율, 막대 0~250, S·P·Q 0~100)에서 잇는다 ── */
    'Widget/System Readings': [
      { k: 'bar', t: '상별 유효전력', unit: 'kW', cats: ['A상', 'B상', 'C상'], v: [2456, 380], max: 3600, c: C.blue },
      { k: 'hbar', t: '상별 부하율', unit: '%', cats: ['A상', 'B상', 'C상'], v: [70, 24], max: 100, c: C.cyan },
      { k: 'line', t: '상별 전압 추이', unit: 'kV', series: [['A상', C.blue, 234, 1.2], ['B상', C.green, 132, 1.2], ['C상', C.orange, 221, 1.2]], lo: 110, hi: 250 },
    ],
    'Widget/Voltage Status': [
      { k: 'line', t: '전압 실시간 추이', unit: 'V', series: [['main', C.cyan, 150, 18]], lo: 0, hi: 250 },
      { k: 'bar', t: '시간대별 전압', unit: 'V', cats: ['00', '04', '08', '12', '16', '20'], v: [140, 60], max: 250, c: C.cyan },
      { k: 'gauge', t: '현재 전압', unit: 'V', v: [150, 12], max: 250, c: C.cyan },
    ],
    'Widget/Current Status': [
      { k: 'line', t: '전류 실시간 추이', unit: 'A', series: [['main', C.cyan, 150, 18]], lo: 0, hi: 250 },
      { k: 'bar', t: '시간대별 전류', unit: 'A', cats: ['00', '04', '08', '12', '16', '20'], v: [140, 60], max: 250, c: C.cyan },
      { k: 'gauge', t: '현재 전류', unit: 'A', v: [150, 12], max: 250, c: C.orange },
    ],
    'Widget/Power Trend': [
      { k: 'line', t: '유효 · 무효 전력 추이', unit: '', series: [['유효전력 P', '#43d28d', 50, 6], ['무효전력 Q', '#e17048', 55, 6], ['피상전력 S', '#876fff', 68, 5]], lo: 0, hi: 100 },
      { k: 'area', t: '유효전력 추이', unit: '', series: [['유효전력 P', '#43d28d', 50, 6]], lo: 0, hi: 100 },
      { k: 'gauge', t: '역률', unit: '%', v: [92, 2], max: 100, min: 70, c: C.green },
    ],
    'Widget/Trip Log': [
      { k: 'bar', t: '월별 트립 건수', unit: '건', cats: ['4월', '5월', '6월', '7월', '8월', '9월'], v: [2, 1.6], max: 6, c: C.red },
      { k: 'donut', t: '트립 원인 분포', parts: [['과부하', C.red, 5], ['지락', C.orange, 2], ['단락', C.yellow, 1]] },
    ],
    /* ── 에너지 진단 팝업(94:5015) — 금일 5,851 · 금일 피크 6,423 · 전일 평균 5,989 · 전일 피크 6,651 kW, 막대 0~200 ── */
    'Widget/Energy Summary': [
      { k: 'bar', t: '금일 · 전일 사용량', unit: 'kW', cats: ['금일', '금일 피크', '전일 평균', '전일 피크'], v: [6200, 420], max: 7000, c: C.cyan },
      { k: 'gauge', t: '전일 대비 사용률', unit: '%', v: [97.7, 1.5], max: 120, c: C.cyan },
      { k: 'area', t: '금일 누적 사용량', unit: 'kW', series: [['금일', C.cyan, 5851, 60]], lo: 5400, hi: 6700 },
    ],
    'Widget/Daily Peak Load': [
      { k: 'area', t: '1일 최대 부하 추이', unit: 'kW', series: [['최대 부하', C.cyan, 110, 22]], lo: 0, hi: 200 },
      { k: 'bar', t: '시간대별 최대 부하', unit: 'kW', cats: ['00', '04', '08', '12', '16', '20'], v: [110, 60], max: 200, c: C.cyan },
      { k: 'gauge', t: '현재 부하', unit: 'kW', v: [128, 10], max: 200, c: C.cyan },
    ],
    'Widget/Rated Load Ratio': [
      { k: 'gauge', t: '정격 대비 부하율', unit: '%', v: [64, 6], max: 100, c: C.cyan },
      { k: 'hbar', t: '설비별 부하율', unit: '%', cats: ['TR A', 'TR B', 'LOAD #1', 'LOAD #2'], v: [62, 18], max: 100, c: C.cyan },
      { k: 'line', t: '부하율 추이', unit: '%', series: [['부하율', C.cyan, 64, 5]], lo: 0, hi: 100 },
    ],
    'Widget/Hourly Load Rate': [
      { k: 'bar', t: '시간대별 부하율', unit: '%', cats: ['00', '04', '08', '12', '16', '20'], v: [55, 30], max: 100, c: C.cyan },
      { k: 'line', t: '부하율 실시간', unit: '%', series: [['부하율', C.cyan, 58, 6]], lo: 0, hi: 100 },
      { k: 'donut', t: '부하 구간 분포', parts: [['경부하', C.green, 9], ['중간부하', C.cyan, 10], ['최대부하', C.orange, 5]] },
    ],
    'Widget/Carbon Emission': [
      { k: 'bar', t: '시간대별 탄소 배출량', unit: 'tCO₂', cats: ['00', '04', '08', '12', '16', '20'], v: [2.4, 1.2], max: 5, c: C.green, dec: 1 },
      { k: 'area', t: '탄소 배출 누적', unit: 'tCO₂', series: [['배출량', C.green, 2.7, 0.3]], lo: 0, hi: 5 },
      { k: 'gauge', t: '감축 목표 달성률', unit: '%', v: [82, 3], max: 100, c: C.green },
    ],
    /* ── 상태정보 팝업(118:568) — 절연유 온도(축 0~100 · 기준선 85) · 냉각팬 8대(동작 1 · 중지 5 · 과부하 1 · 고장 1) ──
       팬 상태 색은 원본 범례색(#34d28d · #e2e3e5 · #fd8004 · #f43130) 그대로. 삼상전원전압 트렌드는 위 'Widget/Voltage Trend' 를 같이 쓴다. */
    'Widget/Oil Temperature Trend': [
      { k: 'line', t: '절연유 온도 추이', unit: '°C', series: [['절연유', '#52b4ff', 72, 6], ['기준선', C.red, 85, 0.1]], lo: 0, hi: 100 },
      { k: 'gauge', t: '현재 절연유 온도', unit: '°C', v: [72, 4], max: 100, c: C.orange },
      { k: 'bar', t: '일별 최고 유온', unit: '°C', cats: ['02/27', '02/28', '02/29', '03/01', '03/02', '03/03', '03/04'], v: [74, 14], max: 100, c: C.orange },
    ],
    'Widget/Cooling Fan Status': [
      { k: 'donut', t: '냉각팬 상태 구성', parts: [['동작', '#34d28d', 1], ['중지', '#e2e3e5', 5], ['과부하', '#fd8004', 1], ['고장', '#f43130', 1]] },
      { k: 'hbar', t: '그룹별 가동률', unit: '%', cats: ['GROUP1', 'GROUP2', 'GROUP3', 'GROUP4'], v: [46, 30], max: 100, c: C.cyan },
      { k: 'bar', t: '그룹별 팬 회전수', unit: 'rpm', cats: ['GROUP1', 'GROUP2', 'GROUP3', 'GROUP4'], v: [900, 420], max: 1800, c: '#34d28d' },
    ],
    'Widget/Oil Temperature Level': [
      { k: 'gauge', t: '절연유 온도 레벨', unit: '%', v: [76, 4], max: 100, c: C.cyan },
      { k: 'area', t: '레벨 추이', unit: '%', series: [['레벨', C.cyan, 76, 3]], lo: 0, hi: 100 },
    ],
    /* ── 냉각설비 팝업(124:3340) — 입력 · 전도도(축 0~250, 01~24시) · 펌프 3대 · 온습도 · 이온/질소 탱크 ── */
    'Widget/System Overview': [
      { k: 'gauge', t: '냉각 계통 효율', unit: '%', v: [94, 1.5], max: 100, min: 70, c: C.green },
      { k: 'line', t: 'Inlet · Outlet 온도', unit: '℃', series: [['Inlet', C.cyan, 20, 0.6], ['Outlet', C.orange, 26, 0.7]], lo: 10, hi: 35 },
    ],
    'Widget/PLC Status': [
      { k: 'hbar', t: 'PLC CPU 부하율', unit: '%', cats: ['PLC1', 'PLC2'], v: [42, 18], max: 100, c: C.cyan },
      { k: 'line', t: 'PLC 스캔 타임', unit: 'ms', series: [['PLC1', C.cyan, 12, 1.2], ['PLC2', C.orange, 14, 1.2]], lo: 0, hi: 25 },
    ],
    'Widget/Input Trend': [
      { k: 'line', t: '입력 실시간', unit: '', series: [['입력', '#52b4ff', 120, 26]], lo: 0, hi: 250 },
      { k: 'area', t: '입력 누적 추이', unit: '', series: [['입력', C.cyan, 120, 22]], lo: 0, hi: 250 },
      { k: 'bar', t: '시간대별 입력', unit: '', cats: ['00', '04', '08', '12', '16', '20'], v: [120, 80], max: 250, c: C.blue },
    ],
    'Widget/Conductivity Trend': [
      { k: 'line', t: '전도도 실시간', unit: 'μS/cm', series: [['전도도', '#52b4ff', 120, 26]], lo: 0, hi: 250 },
      { k: 'gauge', t: '현재 전도도', unit: 'μS/cm', v: [118, 14], max: 250, c: C.cyan },
      { k: 'bar', t: '시간대별 전도도', unit: 'μS/cm', cats: ['00', '04', '08', '12', '16', '20'], v: [120, 70], max: 250, c: C.cyan },
    ],
    'Widget/Pump Status': [
      { k: 'hbar', t: '펌프별 속도', unit: '%', cats: ['PUMP1', 'PUMP2', 'PUMP3'], v: [56, 24], max: 100, c: C.green },
      { k: 'line', t: 'Inlet · Outlet 압력', unit: 'barg', series: [['Inlet', C.cyan, 30, 0.8], ['Outlet', C.orange, 30, 0.8]], lo: 20, hi: 40 },
      { k: 'bar', t: '펌프별 운전 시간', unit: 'h', cats: ['PUMP1', 'PUMP2', 'PUMP3'], v: [16, 6], max: 24, c: C.blue },
    ],
    'Widget/Temp Humidity': [
      { k: 'line', t: '온 · 습도 추이', unit: '', series: [['온도(℃)', C.orange, 20, 0.6], ['습도(%RH)', C.cyan, 10, 0.9]], lo: 0, hi: 35 },
      { k: 'gauge', t: '습도', unit: '%RH', v: [10, 1.5], max: 100, c: C.cyan },
    ],
    'Widget/Ion Tank': [
      { k: 'line', t: '이온탱크 Inlet 압력', unit: 'barg', series: [['Inlet 압력', C.cyan, 30, 0.8]], lo: 20, hi: 40 },
      { k: 'gauge', t: '이온탱크 유량', unit: 'L/min', v: [70, 4], max: 120, c: C.cyan },
    ],
    'Widget/Nitrogen Tank': [
      { k: 'hbar', t: 'Vessel 레벨', unit: 'mm', cats: ['Vessel#1', 'Vessel#2', 'Vessel#3'], v: [50, 8], max: 100, c: C.red },
      { k: 'line', t: '질소탱크 압력', unit: 'barg', series: [['압력', C.red, 30, 0.8]], lo: 20, hi: 40 },
      { k: 'area', t: 'Total Flow', unit: 'L/min', series: [['Flow', C.cyan, 70, 4]], lo: 40, hi: 100 },
    ],
    /* ── 알림 팝업(138:1433) — 실 여섯 곳(안전 5 · 알림발생 1) ── */
    'Widget/Room Alarm Status': [
      { k: 'donut', t: '실별 알림 현황', parts: [['안전', '#28e3ff', 5], ['알림발생', '#ff4b4b', 1]] },
      { k: 'bar', t: '실별 알림 건수', unit: '건', cats: ['밸브실', '냉각실', '소내변압기실', 'AC전원실', 'DC전원실', 'C&P'], v: [1, 1], max: 5, c: C.red },
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

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* 차트 한 장 — 위젯 자리에 겹쳐 그리고, 스스로 흐른다. dispose() 로 멈춘다. */
  function makeChart(host, spec) {
    var el = document.createElement('div');
    el.className = 'ls-chart';
    var timers = [], raf = 0;
    var title = '<div class="ct"><i></i>' + esc(spec.t) + '<b class="cv"></b></div>';
    function fmt(x, d) { return (d != null ? x.toFixed(d) : (Math.abs(x) < 10 ? x.toFixed(1) : String(Math.round(x)))); }

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
        var box = svg.getBoundingClientRect();
        var w = svg.clientWidth || 200, h = svg.clientHeight || 80;
        var L = 24, R = 2, T = 4, B = 12;
        var X = function (i) { return L + (i - shift) * (w - L - R) / (N - 2); };
        var Y = function (v) { return T + (1 - (v - spec.lo) / (spec.hi - spec.lo)) * (h - T - B); };
        var s = '';
        for (var g = 0; g <= 3; g++) {
          var gv = spec.lo + (spec.hi - spec.lo) * g / 3, gy = Y(gv);
          s += '<line class="gl" x1="' + L + '" x2="' + (w - R) + '" y1="' + gy.toFixed(1) + '" y2="' + gy.toFixed(1) + '"/>';
          s += '<text class="ax" x="' + (L - 4) + '" y="' + (gy + 3).toFixed(1) + '" text-anchor="end">' + Math.round(gv) + '</text>';
        }
        var d0 = new Date();
        for (var tl = 0; tl < 3; tl++) {
          var tx = L + (w - L - R) * (tl + 0.5) / 3;
          var tt = new Date(d0.getTime() - (2 - tl) * (N / 3) * STEP);
          s += '<text class="ax" x="' + tx.toFixed(1) + '" y="' + (h - 1) + '" text-anchor="middle">' + p2(tt.getHours()) + ':' + p2(tt.getMinutes()) + ':' + p2(tt.getSeconds()) + '</text>';
        }
        s += '<clipPath id="lsc' + spec.uid + '"><rect x="' + L + '" y="0" width="' + (w - L - R) + '" height="' + h + '"/></clipPath>';
        s += '<g clip-path="url(#lsc' + spec.uid + ')">';
        data.forEach(function (a, si) {
          var col = spec.series[si][1];
          var pts = a.map(function (v, i) { return X(i).toFixed(1) + ',' + Y(v).toFixed(1); }).join(' ');
          if (spec.k === 'area' || si === 0) {
            s += '<defs><linearGradient id="lsg' + spec.uid + si + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + col + '" stop-opacity="' + (spec.k === 'area' ? .45 : .22) + '"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></linearGradient></defs>';
            s += '<polygon fill="url(#lsg' + spec.uid + si + ')" points="' + X(0).toFixed(1) + ',' + (h - B) + ' ' + pts + ' ' + X(N - 1).toFixed(1) + ',' + (h - B) + '"/>';
          }
          s += '<polyline fill="none" stroke="' + col + '" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" points="' + pts + '" style="filter:drop-shadow(0 0 3px ' + col + ')"/>';
          var lx = X(N - 1), ly = Y(a[N - 1]);
          s += '<circle cx="' + lx.toFixed(1) + '" cy="' + ly.toFixed(1) + '" r="2.6" fill="#fff" stroke="' + col + '" stroke-width="1.5"/>';
        });
        s += '</g>';
        svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
        svg.innerHTML = s;
        var lv = data[0][N - 1];
        cv.innerHTML = fmt(lv) + (spec.unit ? '<small>' + esc(spec.unit) + '</small>' : '');
      };
      var frame = function (t) {
        raf = requestAnimationFrame(frame);
        if (idle()) { last = t; return; }
        shift = Math.min(1, (t - last) / STEP);
        if (t - last >= STEP) {
          last = t; shift = 0;
          data.forEach(function (a, si) {
            var s = spec.series[si];
            a.shift();
            a.push(clamp(a[a.length - 1] + rnd(-s[3], s[3]), s[2] - s[3] * 3, s[2] + s[3] * 3));
          });
        }
        draw();
      };
      raf = requestAnimationFrame(frame);
    } else if (spec.k === 'bar') {
      el.innerHTML = title + '<div class="pl"><div class="bars">' + spec.cats.map(function (c) {
        return '<div><i style="--c:' + spec.c + '"></i><em></em><u>' + esc(c) + '</u></div>';
      }).join('') + '</div></div>';
      var bars = Array.prototype.slice.call(el.querySelectorAll('.bars > div'));
      var cv2 = el.querySelector('.cv');
      var tickB = function () {
        var sum = 0;
        bars.forEach(function (b) {
          var v = clamp(spec.v[0] + rnd(-spec.v[1], spec.v[1]), 0, spec.max);
          sum += v;
          var hpc = (v / spec.max * 100).toFixed(1) + '%';
          b.querySelector('i').style.height = hpc;
          b.style.setProperty('--h', hpc);
          b.querySelector('em').textContent = fmt(v, spec.dec);
        });
        cv2.innerHTML = fmt(sum / bars.length, spec.dec) + '<small>' + esc(spec.unit) + ' 평균</small>';
      };
      requestAnimationFrame(tickB);
      timers.push(setInterval(function () { if (!idle()) tickB(); }, 2200));
    } else if (spec.k === 'hbar') {
      el.innerHTML = title + '<div class="pl"><div class="hb">' + spec.cats.map(function (c) {
        return '<div><span>' + esc(c) + '</span><s><i style="--c:' + spec.c + ';width:0"></i></s><b></b></div>';
      }).join('') + '</div></div>';
      var rowsH = Array.prototype.slice.call(el.querySelectorAll('.hb > div'));
      var cv3 = el.querySelector('.cv');
      var tickH = function () {
        var mx = 0;
        rowsH.forEach(function (r) {
          var v = clamp(spec.v[0] + rnd(-spec.v[1], spec.v[1]) * 1.4, 0, spec.max);
          mx = Math.max(mx, v);
          r.querySelector('i').style.width = (v / spec.max * 100).toFixed(1) + '%';
          r.querySelector('b').textContent = Math.round(v) + spec.unit;
        });
        cv3.innerHTML = Math.round(mx) + '<small>' + esc(spec.unit) + ' 최대</small>';
      };
      requestAnimationFrame(tickH);
      timers.push(setInterval(function () { if (!idle()) tickH(); }, 2400));
    } else if (spec.k === 'gauge') {
      var mn = spec.min || 0, R0 = 42, LEN = Math.PI * R0;
      el.innerHTML = title + '<div class="pl"><svg viewBox="0 0 100 58" preserveAspectRatio="xMidYMid meet">'
        + '<defs><linearGradient id="lsgg' + spec.uid + '" x1="0" x2="1"><stop offset="0" stop-color="#2861ff"/><stop offset="1" stop-color="' + spec.c + '"/></linearGradient></defs>'
        + '<path class="trk" d="M8 52a42 42 0 0 1 84 0" fill="none" stroke="rgba(198,212,250,.12)" stroke-width="8" stroke-linecap="round"/>'
        + '<path class="arc" d="M8 52a42 42 0 0 1 84 0" fill="none" stroke="url(#lsgg' + spec.uid + ')" stroke-width="8" stroke-linecap="round" stroke-dasharray="0 ' + LEN.toFixed(1) + '" style="filter:drop-shadow(0 0 4px ' + spec.c + ')"/>'
        + '<text class="ax" style="font-size:5.5px" x="8" y="58" text-anchor="middle">' + mn + '</text><text class="ax" style="font-size:5.5px" x="92" y="58" text-anchor="middle">' + spec.max + '</text>'
        + '</svg><div class="gv"></div></div>';
      var arc = el.querySelector('.arc'), gv = el.querySelector('.gv'), cvg = el.querySelector('.cv');
      var cur = spec.v[0];
      var tickG = function () {
        cur = clamp(cur + rnd(-spec.v[1], spec.v[1]) * 0.6, spec.v[0] - spec.v[1] * 2, spec.v[0] + spec.v[1] * 2);
        var k = clamp((cur - mn) / (spec.max - mn), 0, 1);
        arc.setAttribute('stroke-dasharray', (LEN * k).toFixed(1) + ' ' + LEN.toFixed(1));
        gv.innerHTML = fmt(cur) + '<small>' + esc(spec.unit) + '</small>';
        cvg.textContent = '';
      };
      requestAnimationFrame(function () { requestAnimationFrame(tickG); });
      timers.push(setInterval(function () { if (!idle()) tickG(); }, 2000));
    } else if (spec.k === 'donut') {
      var tot = spec.parts.reduce(function (s, p) { return s + p[2]; }, 0);
      var RR = 15.9155, CIRC = 100;
      el.innerHTML = title + '<div class="pl"><div class="dn"><div class="ring"><svg viewBox="0 0 42 42">'
        + '<circle class="trk" cx="21" cy="21" r="' + RR + '" fill="none" stroke="rgba(198,212,250,.12)" stroke-width="6"/>'
        + spec.parts.map(function (p) { return '<circle class="arc" cx="21" cy="21" r="' + RR + '" fill="none" stroke="' + p[1] + '" stroke-width="6" stroke-dasharray="0 100" transform="rotate(-90 21 21)"/>'; }).join('')
        + '</svg><b></b></div><ul>' + spec.parts.map(function (p) { return '<li style="--c:' + p[1] + '">' + esc(p[0]) + '<b></b></li>'; }).join('') + '</ul></div></div>';
      var arcs = Array.prototype.slice.call(el.querySelectorAll('.arc'));
      var lis = Array.prototype.slice.call(el.querySelectorAll('li b'));
      var center = el.querySelector('.ring b');
      var vals = spec.parts.map(function (p) { return p[2]; });
      var tickD = function () {
        vals = vals.map(function (v, i) { return i === 0 ? v : Math.max(0, Math.round(v + rnd(-1, 1))); });
        var t = vals.reduce(function (s, v) { return s + v; }, 0) || 1, off = 0;
        arcs.forEach(function (a, i) {
          var len = vals[i] / t * CIRC;
          a.setAttribute('stroke-dasharray', Math.max(0, len - 0.8).toFixed(2) + ' ' + (CIRC - Math.max(0, len - 0.8)).toFixed(2));
          a.setAttribute('stroke-dashoffset', (-off).toFixed(2));
          off += len;
          lis[i].textContent = vals[i];
        });
        center.innerHTML = Math.round(vals[0] / t * 100) + '%<small>' + esc(spec.parts[0][0]) + '</small>';
      };
      requestAnimationFrame(function () { requestAnimationFrame(tickD); });
      timers.push(setInterval(function () { if (!idle()) tickD(); }, 3200));
    }
    host.appendChild(el);
    return { el: el, dispose: function () { cancelAnimationFrame(raf); timers.forEach(clearInterval); el.remove(); } };
  }

  var chartUid = 0;
  function installCharts(root, st) {
    var sc = sceneOf(root);
    var saved = load(LS_CHART)[sc] || {};
    st.charts = {};
    /* 같은 이름의 위젯이 바탕 화면과 팝업에 하나씩 있을 수 있다(AC전원실 팝업의 Electrical Readings ·
       충전기 팝업의 Charger Battery). 둘 다 단추를 달고, 두 번째부터는 키에 '#2' 를 붙여 따로 기억한다. */
    var targets = [];
    Object.keys(CHARTS).forEach(function (wn) {
      all(root, '[data-name="' + wn + '"]').forEach(function (el, i) { targets.push([wn, el, i ? wn + '#' + (i + 1) : wn]); });
    });
    /* 그룹 위젯은 그림이 있는 자리(.ls-chost)에 단추·차트를 건다(installPopup).
       위치(position)는 단추를 붙이기 전에 한꺼번에 읽는다 — 붙이면서 하나씩 읽으면 매번 스타일을 다시 계산한다 */
    var statics = targets.map(function (tg) { return getComputedStyle(tg[1].__lsChartHost || tg[1]).position === 'static'; });
    targets.forEach(function (tg, ti) {
      var wn = tg[0], w0 = tg[1], key = tg[2];
      var w = w0.__lsChartHost || w0;
      if (statics[ti]) w.style.position = 'relative';
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ls-chartbtn ct-btn';
      btn.innerHTML = KIND_ICON.bar.replace('class="ic"', 'class="ic" style="width:13px;height:11px"') + '차트';
      btn.title = '이 패널의 차트 바꾸기';
      var menu = document.createElement('div');
      menu.className = 'ls-chartmenu ct-btn';
      w.appendChild(btn);
      w.appendChild(menu);
      var cur = saved[key] != null ? saved[key] : -1;
      function render() {
        var list = CHARTS[wn];
        menu.innerHTML = '<div class="hd">' + esc(wn.replace('Widget/', '')) + ' — 추천 차트</div>'
          + list.map(function (s, i) {
            return '<button type="button" data-i="' + i + '"' + (i === cur ? ' class="cur"' : '') + '>' + KIND_ICON[s.k] + esc(s.t) + ' · ' + KIND_NAME[s.k]
              + (i === 0 ? '<span class="rec">추천</span>' : '') + '</button>';
          }).join('')
          + '<div class="sep"></div><button type="button" data-i="-1"' + (cur < 0 ? ' class="cur"' : '') + '>' + KIND_ICON.orig + '원본 그대로</button>';
      }
      function apply(i) {
        cur = i;
        if (st.charts[key]) { st.charts[key].dispose(); delete st.charts[key]; }
        w0.classList.toggle('ls-swapped', i >= 0);
        if (i >= 0 && CHARTS[wn][i]) {
          var spec = Object.assign({ uid: ++chartUid }, CHARTS[wn][i]);
          st.charts[key] = makeChart(w, spec);
          w.appendChild(btn); w.appendChild(menu);           /* 단추·메뉴는 차트 위에 */
        }
        var m = load(LS_CHART); m[sc] = m[sc] || {};
        if (i >= 0) m[sc][key] = i; else delete m[sc][key];
        save(LS_CHART, m);
        render();
      }
      render();
      /* 스튜디오의 배치 편집은 click 을 캡처 단계에서 삼킨다 → 누름(pointerup)으로 받는다 */
      var stop = function (e) { e.stopPropagation(); };
      btn.addEventListener('pointerdown', stop);
      menu.addEventListener('pointerdown', stop);
      btn.addEventListener('pointerup', function (e) {
        e.stopPropagation(); e.preventDefault();
        all(root, '.ls-chartmenu.open').forEach(function (m) { if (m !== menu) m.classList.remove('open'); });
        menu.classList.toggle('open');
      });
      menu.addEventListener('pointerup', function (e) {
        var b = e.target.closest('button[data-i]');
        e.stopPropagation(); e.preventDefault();
        if (!b) return;
        apply(+b.getAttribute('data-i'));
        menu.classList.remove('open');
      });
      st.chartApply = st.chartApply || {};
      st.chartApply[key] = apply;
      if (cur >= 0) apply(cur);
    });
    st.onDocDown = function (e) {
      if (e.target.closest && e.target.closest('.ls-chartmenu, .ls-chartbtn')) return;
      all(root, '.ls-chartmenu.open').forEach(function (m) { m.classList.remove('open'); });
    };
    document.addEventListener('pointerdown', st.onDocDown, true);
  }

  /* ══════════════════ 9. 패널 옮기기(패널편집 · 배치) ══════════════════
     좌측 — Body 안 위젯은 흐름(flex) 속에 있다. 끌어서 다른 위젯 위에 놓으면 **순서가 바뀌고**
            나머지 위젯이 흘러 새 자리를 잡는다(FLIP 으로 미끄러진다). 반응형처럼 빈틈이 생기지 않는다.
     우측 — 절대배치 위젯은 끄는 만큼 옮긴다(4px 격자). 제목(Title)은 짝 위젯과 같이 움직인다.
     값은 CSS 변수(--ls-mx/my)로만 싣는다 — 원본 transform · 반응형 translate 를 건드리지 않는다. */
  function installPanelMove(root, st) {
    var sc = sceneOf(root);
    var body = one(root, '[data-name="Left Panel"] [data-name="Body"]');
    var leftW = body ? Array.prototype.slice.call(body.children).filter(function (c) { return /^Widget\//.test(nameOf(c)); }) : [];
    var rightU = all(root, '[data-name="Right Panel"] > [data-name^="Widget/"], [data-name="Right Panel"] > [data-name="View Controls"]')
      /* ACB 진단 팝업의 위젯도 같은 방식으로 자유롭게 옮긴다(4px 격자 · 장면별 저장) */
      /* 계통·에너지 팝업은 위젯이 Charts > Row 안에 한 겹 더 들어 있다 — 위젯 안의 위젯만 빼고 모두 */
      .concat(all(root, '.ls-pop [data-name^="Widget/"]').filter(function (w) {
        var p = w.parentElement.closest('[data-name^="Widget/"], .ls-pop');
        return p && p.classList.contains('ls-pop');
      }));
    leftW.forEach(function (w) { w.classList.add('ls-mv'); w.setAttribute('data-ls-mv', 'L'); });
    rightU.forEach(function (w) { w.classList.add('ls-mv'); w.setAttribute('data-ls-mv', 'R'); });
    /* 저장 키 — 팝업 위젯이 바탕 화면 위젯과 이름이 같으면(Electrical Readings 등) 따로 기억한다 */
    var baseNames = rightU.filter(outsidePop).map(nameOf);
    function mvKey(w) { var n = nameOf(w); return !outsidePop(w) && baseNames.indexOf(n) >= 0 ? n + '@pop' : n; }

    /* 저장된 순서 · 이동 되살리기 */
    function restore() {
      var ord = load(LS_ORDER)[sc];
      if (body && Array.isArray(ord)) {
        ord.forEach(function (n) { var w = leftW.filter(function (x) { return nameOf(x) === n; })[0]; if (w) body.appendChild(w); });
      }
      var mv = load(LS_MOVE)[sc] || {};
      rightU.forEach(function (w) {
        var o = mv[mvKey(w)] || [0, 0];
        setMove(w, o[0], o[1]);
      });
    }
    function setMove(w, x, y) {
      [w, w.__lsPair].forEach(function (e) {
        if (!e) return;
        e.style.setProperty('--ls-mx', x + 'px');
        e.style.setProperty('--ls-my', y + 'px');
      });
      w.__lsMove = [x, y];
    }
    restore();
    st.resetMove = function () {
      var o = load(LS_ORDER); delete o[sc]; save(LS_ORDER, o);
      var m = load(LS_MOVE); delete m[sc]; save(LS_MOVE, m);
      /* 원래 순서(생성 순서)로 */
      if (body) st.leftOrder0.forEach(function (w) { body.appendChild(w); });
      rightU.forEach(function (w) { setMove(w, 0, 0); });
    };
    st.leftOrder0 = leftW.slice();
    if (body) {
      var o0 = load(LS_ORDER)[sc];
      if (Array.isArray(o0)) st.leftOrder0 = leftW.slice();   /* leftW 는 생성 순서 그대로다 */
    }

    var drag = null;
    function scale() { return st.S || 1; }
    function flip(fn) {
      var before = leftW.map(function (w) { return [w, w.getBoundingClientRect().top]; });
      fn();
      before.forEach(function (b) {
        var dy = (b[1] - b[0].getBoundingClientRect().top) / scale();
        if (!dy || b[0] === (drag && drag.w)) return;
        b[0].animate([{ translate: '0 ' + dy + 'px' }, { translate: '0 0' }], { duration: 380, easing: 'cubic-bezier(.22,.8,.24,1)' });
      });
    }
    st.onDown = function (e) {
      if (!layoutEditing(root) || e.button !== 0) return;
      if (e.target.closest('.ls-chartbtn, .ls-chartmenu')) return;
      var w = e.target.closest('.ls-mv');
      if (!w || !root.contains(w)) return;
      e.preventDefault();
      e.stopPropagation();
      var o = w.__lsMove || [0, 0];
      drag = { w: w, side: w.getAttribute('data-ls-mv'), sx: e.clientX, sy: e.clientY, ox: o[0], oy: o[1], pid: e.pointerId, moved: false, target: null };
    };
    st.onMove = function (e) {
      if (!drag) return;
      var dx = (e.clientX - drag.sx) / scale(), dy = (e.clientY - drag.sy) / scale();
      if (!drag.moved) {
        if (Math.hypot(dx, dy) < 3) return;
        drag.moved = true;
        drag.w.classList.add('ls-dragging');
        if (drag.w.__lsPair) drag.w.__lsPair.classList.add('ls-dragging');
      }
      if (drag.side === 'L') {
        drag.w.style.setProperty('--ls-mx', dx + 'px');
        drag.w.style.setProperty('--ls-my', dy + 'px');
        var tgt = null;
        leftW.forEach(function (x) {
          if (x === drag.w) return;
          var r = x.getBoundingClientRect();
          if (e.clientY >= r.top && e.clientY <= r.bottom) tgt = x;
        });
        if (tgt !== drag.target) {
          if (drag.target) drag.target.classList.remove('ls-droptarget');
          drag.target = tgt;
          if (tgt) tgt.classList.add('ls-droptarget');
        }
      } else {
        var g = 4;
        setMove(drag.w, Math.round((drag.ox + dx) / g) * g, Math.round((drag.oy + dy) / g) * g);
      }
    };
    st.onUp = function () {
      if (!drag) return;
      var d = drag; drag = null;
      d.w.classList.remove('ls-dragging');
      if (d.w.__lsPair) d.w.__lsPair.classList.remove('ls-dragging');
      if (!d.moved) return;
      if (d.side === 'L') {
        if (d.target) d.target.classList.remove('ls-droptarget');
        var r0 = d.w.getBoundingClientRect();
        if (d.target) {
          flip(function () {
            var kids = Array.prototype.slice.call(body.children);
            var a = kids.indexOf(d.w), b = kids.indexOf(d.target);
            if (a < b) body.insertBefore(d.w, d.target.nextSibling); else body.insertBefore(d.w, d.target);
          });
          var o = load(LS_ORDER);
          o[sc] = Array.prototype.slice.call(body.children).filter(function (c) { return c.classList.contains('ls-mv'); }).map(nameOf);
          save(LS_ORDER, o);
        }
        /* 끌던 위젯은 새 자리로 미끄러져 들어간다 */
        var r1 = d.w.getBoundingClientRect();
        d.w.style.setProperty('--ls-mx', '0px');
        d.w.style.setProperty('--ls-my', '0px');
        d.w.animate([{ translate: ((r0.left - r1.left) / scale()) + 'px ' + ((r0.top - r1.top) / scale()) + 'px' }, { translate: '0 0' }],
          { duration: 380, easing: 'cubic-bezier(.22,.8,.24,1)' });
      } else {
        var m = load(LS_MOVE); m[sc] = m[sc] || {};
        m[sc][mvKey(d.w)] = d.w.__lsMove;
        save(LS_MOVE, m);
      }
    };
    root.addEventListener('pointerdown', st.onDown, true);
    window.addEventListener('pointermove', st.onMove);
    window.addEventListener('pointerup', st.onUp);
    window.addEventListener('pointercancel', st.onUp);
    /* 배치 모드에서 그림을 끌면 브라우저가 이미지 끌기를 시작해 pointercancel 이 난다 */
    st.onDragStart = function (e) { if (layoutEditing(root) && e.target.closest && e.target.closest('.ls-mv')) e.preventDefault(); };
    root.addEventListener('dragstart', st.onDragStart);
    /* 스튜디오 '배치 초기화' */
    st.onReset = function (e) {
      if (!e.target.closest || !e.target.closest('#layoutReset')) return;
      st.resetMove();
      var m = load(LS_CHART); delete m[sc]; save(LS_CHART, m);
      Object.keys(st.chartApply || {}).forEach(function (k) { st.chartApply[k](-1); });
    };
    document.addEventListener('click', st.onReset, true);
  }

  /* ══════════════════ 10-1. 계통 · 에너지 팝업의 차트 ══════════════════
     Figma 가 내보낸 차트 그림(data-*.svg)을 그대로 인라인으로 바꿔 넣고 '살아 있게' 만든다. 그림은 새로 그리지 않는다.
     · 막대 — 막대 24개가 한 path 의 하위 경로(사각형)로 들어 있다. 하위 경로마다 같은 좌표의 <rect> 로 나누고
             높이만 바꾼다(바닥 고정). 그라디언트가 userSpaceOnUse 라 원본과 같은 빛깔로 자라고 준다.
     · 곡선 — 곡선의 모든 점에 시간이 흐르는 물결을 더한다: y + A·(sin(kx − ωt + φ) − sin(kx + φ)).
             t = 0 에서 더하는 값이 0 이라 첫 그림은 원본과 한 점도 다르지 않다.
     패널편집 중 · 화면이 쉬는 동안에는 멈춘다. */
  var svgCache = {};
  function fetchSvg(src) {
    if (!svgCache[src]) svgCache[src] = fetch(src).then(function (r) { return r.ok ? r.text() : ''; }).catch(function () { return ''; });
    return svgCache[src];
  }
  var inlUid = 0;
  function pathBoxes(d) {
    /* 절대 좌표 M/L/H/V/Z 로만 된 사각형 하위 경로들 → [{x,y,w,h}] (곡선 · 상대 좌표가 섞이면 null) */
    if (/[a-y]|[CSQTA]/.test(d.replace(/e[-+]?\d/gi, ''))) return null;
    var out = [];
    d.split(/(?=M)/).forEach(function (sp) {
      var tk = sp.match(/[MLHVZ]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) || [];
      var x = 0, y = 0, xs = [], ys = [], cmd = '', i = 0;
      while (i < tk.length) {
        var t = tk[i];
        if (/^[MLHVZ]$/i.test(t)) { cmd = t.toUpperCase(); i++; if (cmd === 'Z') continue; else continue; }
        if (cmd === 'M' || cmd === 'L') { x = +tk[i]; y = +tk[i + 1]; i += 2; }
        else if (cmd === 'H') { x = +tk[i]; i++; }
        else if (cmd === 'V') { y = +tk[i]; i++; }
        else { i++; continue; }
        xs.push(x); ys.push(y);
      }
      if (xs.length < 3) return;
      var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
      out.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0, b: y1 });
    });
    return out.length ? out : null;
  }
  function installPopCharts(pop, st) {
    if (!window.fetch || !window.DOMParser) return;
    /* 상태정보 팝업은 Figma 가 Plot 통째(격자선 · 기준선 · 데이터 선)를 한 그림으로 냈다 — 그것도 받는다.
       격자선 · 점선 기준선은 그대로 두고 데이터 선(id 'Line/…')만 흐르게 한다(아래 skip). */
    all(pop, '[data-name="Data"] img, [data-name="Plot"] > div:not([data-name]) > img').forEach(function (im) {
      var src = im.getAttribute('src');
      fetchSvg(src).then(function (txt) {
        if (!txt || !im.parentNode) return;
        var doc = new DOMParser().parseFromString(txt, 'image/svg+xml');
        var svg = doc.documentElement;
        if (!svg || svg.nodeName.toLowerCase() !== 'svg') return;
        svg = document.importNode(svg, true);
        /* 같은 그림이 여러 판에 들어간다 — 그라디언트 id 를 판마다 따로 둔다 */
        var u = '-ls' + (++inlUid);
        all(svg, '[id]').forEach(function (e) { e.setAttribute('id', e.getAttribute('id') + u); });
        all(svg, '[fill^="url(#"],[stroke^="url(#"]').forEach(function (e) {
          ['fill', 'stroke'].forEach(function (a) {
            var v = e.getAttribute(a);
            if (v && v.indexOf('url(#') === 0) e.setAttribute(a, v.replace(/\)$/, u + ')'));
          });
        });
        svg.setAttribute('class', (im.getAttribute('class') || '') + ' ls-inl ls-datasvg');
        svg.setAttribute('data-src', src);
        if (im.id) svg.id = im.id;
        if (im.style.filter) svg.style.filter = im.style.filter;
        im.parentNode.replaceChild(svg, im);

        var widget = svg.closest('[data-name^="Widget/"]');
        var bars = [], lines = [];
        all(svg, 'path').forEach(function (p) {
          var d = p.getAttribute('d') || '';
          /* 격자선 · 기준선(점선)은 화면의 자 — 움직이지 않는다 */
          if (/^(Grid|Threshold)/.test(p.getAttribute('id') || '') || p.hasAttribute('stroke-dasharray')) return;
          if (p.getAttribute('stroke') && !p.getAttribute('fill')) {
            /* 곡선 — 점 좌표를 숫자 배열로(x,y 짝). 절대 좌표 M/C/L 만 다룬다 */
            if (/[a-z]/.test(d.replace(/e[-+]?\d/gi, ''))) return;
            var parts = d.match(/[MLCSQT]|-?\d*\.?\d+(?:e[-+]?\d+)?/g);
            if (!parts) return;
            lines.push({ p: p, parts: parts, ph: lines.length * 1.9 + rnd(0, 1) });
            return;
          }
          var boxes = pathBoxes(d);
          if (!boxes) return;
          var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          boxes.forEach(function (b) {
            var r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            r.setAttribute('x', b.x); r.setAttribute('y', b.y);
            r.setAttribute('width', b.w); r.setAttribute('height', b.h);
            r.setAttribute('fill', p.getAttribute('fill'));
            g.appendChild(r);
            bars.push({ r: r, h: b.h, b: b.b, f: 1, max: Math.min(1.3, b.b / Math.max(b.h, 0.01)) });
          });
          p.parentNode.replaceChild(g, p);
        });

        /* 막대 — 2.6초마다 새 값으로 자란다 */
        if (bars.length) {
          var setF = function (bar, f) {
            bar.f = f;
            var h = bar.h * f;
            bar.r.setAttribute('y', (bar.b - h).toFixed(3));
            bar.r.setAttribute('height', h.toFixed(3));
          };
          var animate = function (targets, dur) {
            var from = bars.map(function (b) { return b.f; }), t0 = performance.now();
            (function step(t) {
              var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
              bars.forEach(function (b, i) { setF(b, from[i] + (targets[i] - from[i]) * e); });
              if (k < 1) requestAnimationFrame(step);
            })(t0);
          };
          var next = function () {
            return bars.map(function (b) { return clamp(b.f * (1 + rnd(-0.16, 0.16)), 0.6, b.max); });
          };
          st.timers.push(setInterval(function () {
            if (editing() || idle()) return;
            animate(next(), 900);
          }, 2600 + Math.random() * 500));
          if (widget) {
            var prev = widget.__lsReplay;
            widget.__lsReplay = function () {
              if (prev) prev();
              bars.forEach(function (b) { setF(b, 0.02); });
              animate(bars.map(function () { return rnd(0.7, 1.1); }).map(function (v, i) { return Math.min(v, bars[i].max); }), 1100);
            };
          }
        }

        /* 곡선 — 물결이 오른쪽에서 왼쪽으로 흐른다(초당 20번 그린다) */
        if (lines.length) {
          var vb = (svg.getAttribute('viewBox') || '0 0 100 40').split(/\s+/).map(Number);
          var A = vb[3] * 0.09, K = 2 * Math.PI / (vb[2] / 2.3), W = 2 * Math.PI / 9000;
          var t0 = performance.now(), lastT = 0, paused = 0, pausedAt = 0;
          var draw = function (t) {
            lines.forEach(function (ln) {
              var out = [], cmd = '', xy = 0, x = 0;
              ln.parts.forEach(function (tk) {
                if (/^[A-Z]$/.test(tk)) { out.push(tk); cmd = tk; xy = 0; return; }
                var v = +tk;
                if (xy % 2 === 0) { x = v; out.push(tk); }
                else {
                  var y = v + A * (Math.sin(K * x - W * t + ln.ph) - Math.sin(K * x + ln.ph));
                  /* 그림 상자(축 0 ~ 최댓값) 밖으로는 나가지 않는다 — 꼭대기에 닿으면 거기서 머문다 */
                  y = clamp(y, 0.5, vb[3] - 0.5);
                  out.push(y.toFixed(3));
                }
                xy++;
              });
              ln.p.setAttribute('d', out.join(' '));
            });
          };
          (function loop(now) {
            if (!svg.isConnected || !pop.isConnected) return;
            requestAnimationFrame(loop);
            if (editing() || idle()) { if (!pausedAt) pausedAt = now; return; }
            if (pausedAt) { paused += now - pausedAt; pausedAt = 0; }
            if (now - lastT < 50) return;
            lastT = now;
            draw(now - t0 - paused);
          })(t0);
          if (widget) {
            var prevL = widget.__lsReplay;
            widget.__lsReplay = function () {
              if (prevL) prevL();
              svg.animate([{ opacity: 0.25, clipPath: 'inset(0 100% 0 0)' }, { opacity: 1, clipPath: 'inset(0 0 0 0)' }],
                { duration: 900, easing: 'cubic-bezier(.22,.8,.24,1)' });
            };
          }
        }
      });
    });
  }

  /* ══════════════════ 10. ACB 진단 팝업 ══════════════════
     STATCOM 화면(3:5) 위에 ACB 진단 팝업(76:597)이 떠 있는 화면(Figma 62:1493).
     팝업은 생성기가 만든 DOM 그대로이고 여기서는 닫기 · 드롭다운 · 호버 · 라이브 수치만 얹는다. */
  /* pop · onClose 를 주면 런처가 겹쳐 띄운 팝업(.ls-overlay)이다 — 닫기는 그 자리에서 걷기만 한다(페이지 이동 없음).
     안 주면 이 페이지 자체의 팝업이고 닫기는 STATCOM 페이지로 간다(페이지 연결). */
  function installPopup(root, st, popArg, onClose) {
    var pop = popArg || pagePop(root);
    if (!pop) return;
    var mount = pop.parentElement;

    /* Figma GROUP 으로 된 위젯(단선도)은 display:contents 라 상자가 없다 — 옮기기(translate)도,
       차트 단추 자리도 잡히지 않는다(단추가 팝업 오른쪽 위 닫기 단추 위로 갔다).
       부모와 같은 판을 덮는 투명 상자로 세우면 자식 좌표(부모 기준 %)는 그대로이고,
       그림이 실제로 있는 자리에 .ls-chost 를 두어 단추·차트를 거기 붙인다. */
    all(pop, '[data-name^="Widget/"]').forEach(function (w) {
      if (getComputedStyle(w).display !== 'contents') return;
      w.style.display = 'block';
      w.style.position = 'absolute';
      w.style.inset = '0';
      w.classList.add('ls-grpw');
      var wr = w.getBoundingClientRect(), k = w.offsetWidth ? wr.width / w.offsetWidth : 1, u = null;
      Array.prototype.forEach.call(w.children, function (c) {
        var q = c.getBoundingClientRect();
        if (!q.width || !q.height) return;
        u = u ? { l: Math.min(u.l, q.left), t: Math.min(u.t, q.top), r: Math.max(u.r, q.right), b: Math.max(u.b, q.bottom) }
          : { l: q.left, t: q.top, r: q.right, b: q.bottom };
      });
      if (!u) return;
      var h = document.createElement('div');
      h.className = 'ls-chost';
      h.style.left = ((u.l - wr.left) / k) + 'px';
      h.style.top = ((u.t - wr.top) / k) + 'px';
      h.style.width = ((u.r - u.l) / k) + 'px';
      h.style.height = ((u.b - u.t) / k) + 'px';
      w.appendChild(h);
      w.__lsChartHost = h;
    });

    /* 닫기 — 팝업이 사라지고 바탕의 STATCOM 화면으로 간다(형제 화면이 있으면 그 화면을 연다) */
    /* 단독 팝업(AC전원실 · 충전기 · 알림)은 파란 단추(Close Button) 안에 X 아이콘이 있다 — 단추 전체가 눌리게 */
    var cl = one(pop, '[data-name="Close Button"]') || one(pop, '[data-name="Icon/Action/Close"]');
    clickable(cl, '닫기', function () {
      if (onClose) { onClose(); return; }
      mount.classList.add('ls-pop-out');
      st.timers.push(setTimeout(function () { goScene('statcom'); }, 270));
    });

    /* 열화상 구간 드롭다운 — 원본에 적힌 값(고압)만 담는다(없는 값을 지어내지 않는다) */
    var dd = one(pop, '[data-name="Dropdown"]');
    if (dd) {
      var lb = one(dd, '[data-name="Label"]');
      var cur = (lb && lb.textContent.trim()) || '고압';
      var menu = document.createElement('div');
      menu.className = 'ls-ddmenu';
      menu.innerHTML = '<button type="button" class="cur" data-v="' + esc(cur) + '">' + esc(cur) + '</button>';
      dd.appendChild(menu);
      clickable(dd, '열화상 구간 고르기', function () { dd.classList.toggle('ls-open'); });
      menu.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-v]');
        if (!b) return;
        e.stopPropagation();
        all(menu, 'button').forEach(function (x) { x.classList.toggle('cur', x === b); });
        if (lb) write(lb, b.getAttribute('data-v'));
        dd.classList.remove('ls-open');
      });
      st.onPopDown = function (e) {
        if (e.target.closest && e.target.closest('[data-name="Dropdown"]')) return;
        dd.classList.remove('ls-open');
      };
      document.addEventListener('pointerdown', st.onPopDown, true);
    }

    /* 눌리는 자리 — 설비 정보 줄 · Zone 줄 · 센서 · 범례 */
    var txt = function (el, sel) { var x = el && one(el, sel); return x ? x.textContent.trim() : ''; };
    all(pop, '[data-name="Widget/Device Info"] > [data-name^="Field/"]').forEach(function (r) {
      r.classList.add('ls-rowhi');
      clickable(r, txt(r, '[data-name="Label"]') + ' 상세');
    });
    all(pop, '[data-name="Rows"] > [data-name^="Row/"]').forEach(function (r) {
      r.classList.add('ls-rowhi');
      clickable(r, txt(r, '[data-name="Td/Zone"] [data-name="Label"]') + ' 열화상 상세');
    });
    all(pop, '[data-name="List"] > [data-name^="Item/"]').forEach(function (it) {
      clickable(it, txt(it, '[data-name="Text"]') + ' 현황');
    });
    all(pop, '[data-name="Items"] > [data-name^="Item/"]').forEach(function (it) {
      clickable(it, txt(it, '[data-name="Label"]') + ' 계열');
    });
    all(pop, '[data-name^="Gauge/"]').forEach(function (g) {
      clickable(g, txt(g, '[data-name="Chip"] [data-name="Label"]') + ' 상세');
    });
    all(pop, '[data-name="Breakers"] [data-name^="Breaker "]').forEach(function (b) {
      clickable(b, '차단기 ' + nameOf(b).replace('Breaker ', '') + ' 상태');
    });

    /* 삼상전원전압 rms 트렌드 — 원본 그림을 손대지 않고 '흐르게' 만든다.
       Figma 가 내보낸 data.svg 안에는 물결 선이 잘린 상자(viewBox 618) **밖까지** 그려져 있다
       (Line 1 은 763, Line 4 는 710, Line 3 은 680 까지 — 공통 여유분 62px).
       그래서 그 SVG 를 그대로 인라인으로 바꿔 넣고 물결 선만 왼쪽으로 민다. 그림은 한 점도 바뀌지 않는다.
       평평한 기준선은 밀지 않는다 — 밀면 오른쪽 끝에 빈 자리가 생긴다. */
    var dimg = pop.classList.contains('lsa-root') ? one(pop, '[data-name="Data"] img') : null;
    if (!pop.classList.contains('lsa-root')) installPopCharts(pop, st);     /* 계통 · 에너지 — 막대 · 곡선 */
    if (dimg && window.fetch && !pop.querySelector('.ls-trendsvg')) {
      fetch(dimg.getAttribute('src')).then(function (r) { return r.ok ? r.text() : ''; }).then(function (t) {
        if (!t || !dimg.parentNode) return;
        var box = document.createElement('div');
        box.innerHTML = t;
        var svg = box.querySelector('svg');
        if (!svg) return;
        svg.setAttribute('class', dimg.getAttribute('class') + ' ls-trendsvg');
        svg.setAttribute('id', dimg.getAttribute('id') || '');
        if (dimg.getAttribute('data-name')) svg.setAttribute('data-name', dimg.getAttribute('data-name'));
        dimg.parentNode.replaceChild(svg, dimg);
        /* 높이를 먼저 다 재고 나서 표시한다 — 표시하며 재면 선마다 레이아웃을 다시 한다 */
        var paths = all(svg, 'path');
        var hs = paths.map(function (p) { try { return p.getBBox().height; } catch (e) { return 99; } });
        paths.forEach(function (p, i) { if (hs[i] > 4) p.classList.add('ls-wave'); });   /* 평평한 선(높이 ≈ 0)은 그대로 둔다 */
      }).catch(function () { });
    }

    /* 라이브 수치 — 원본 값 언저리에서 흔들린다(사람이 고친 글자는 덮지 않는다) */
    var jobs = [];
    var fixW = [];   /* 폭을 원본으로 묶을 글자 — 다 모은 뒤 한꺼번에 재고 묶는다(아래 jobs 앞) */
    var R0 = function (x) { return String(Math.round(x)); };
    var R1 = function (x) { return x.toFixed(1); };
    var DEG = function (x) { return Math.round(x) + '°'; };
    var PCT = function (x) { return Math.round(x) + '%'; };
    function num(p, dev, fmt, ms, base) {
      if (!p) return;
      var b = base != null ? base : parseFloat(String(p.textContent).replace(/[^\d.-]/g, ''));
      if (!isFinite(b)) return;
      /* 글자 상자는 원본 글자 폭으로 고정돼 있다(Figma 메타) — 숫자 폭이 달라지면(5,851 → 5,838) 단위에 붙는다.
         원본 폭은 최소로 지키고 넓어질 때만 자란다(첫 그림은 그대로). 재고 묶는 일은 아래에서 한꺼번에 —
         글자마다 재고(offsetWidth) 바로 고치면 그때마다 레이아웃을 다시 한다 */
      fixW.push(p);
      jobs.push({ p: p, base: b, dev: dev, fmt: fmt, ms: ms });
    }
    /* 게이지 두 짝 */
    num(one(pop, '[data-name="Gauge/Power"] [data-name="Measurement"] > [data-name="Value"]'), 4, R0, 2400);
    num(one(pop, '[data-name="Gauge/Voltage"] [data-name="Measurement"] > [data-name="Value"]'), 3, R0, 2900);
    /* 주요 기기 · 센서(값이 숫자인 것만 — '정상' · '-' 는 그대로 둔다) */
    num(one(pop, '[data-name="Item/Cooling Fan"] [data-name="Value"]'), 1.6, DEG, 4200);
    num(one(pop, '[data-name="Item/Temp Humidity Sensor"] [data-name="Value"]'), 2.5, PCT, 6400);
    num(one(pop, '[data-name="Item/Winding Temp"] [data-name="Value"]'), 1.2, DEG, 5200);
    /* 열화상 Zone 표 */
    all(pop, '[data-name="Rows"] > [data-name^="Row/"]').forEach(function (r, i) {
      num(one(r, '[data-name="Td/Max"] [data-name="Value"]'), 1.4, R0, 3600 + i * 420);
      num(one(r, '[data-name="Td/Min"] [data-name="Value"]'), 0.9, R0, 4400 + i * 420);
    });
    /* 단선도 전압 · 전류 */
    all(pop, '[data-name="Measurements/Voltage"] [data-name="Measurement"] > [data-name="Value"]').forEach(function (p, i) {
      num(p, 0.7, R1, 5200 + i * 300);
    });
    all(pop, '[data-name="Measurements/Current"] [data-name="Measurement"] > [data-name="Value"]').forEach(function (p, i) {
      num(p, 0.3, R1, 4600 + i * 300);
    });

    /* ── 계통 · 에너지 팝업 ──
       원본 값의 자릿수 · 천 단위 쉼표를 그대로 지키며 흔든다(234.1 → 234.6, 5,851 → 5,874). */
    var like = function (s) {
      var d = (String(s).split('.')[1] || '').replace(/\D/g, '').length, comma = /,/.test(s);
      return function (x) {
        var t = x.toFixed(d);
        if (comma) { var q = t.split('.'); q[0] = q[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); t = q.join('.'); }
        return t;
      };
    };
    all(pop, '[data-name="Widget/System Readings"] [data-name^="Td/"] [data-name="Value"]').forEach(function (p, i) {
      var b = parseFloat(p.textContent.replace(/[^\d.-]/g, ''));
      if (isFinite(b)) num(p, Math.max(b * 0.004, 0.3), like(p.textContent), 3000 + (i % 6) * 380);
    });
    var metricP = {};
    all(pop, '[data-name="Metrics"] > [data-name^="Metric/"]').forEach(function (m, i) {
      var p = one(m, '[data-name="Td"] [data-name="Value"]');
      if (!p) return;
      metricP[nameOf(m)] = p;
      num(p, parseFloat(p.textContent.replace(/[^\d.-]/g, '')) * 0.006, like(p.textContent), 3400 + i * 520);
    });
    /* 금일 · 전일 막대 — 금일 값이 흔들리면 금일 막대도 따라 늘고 준다(원본 길이 = 원본 값) */
    var barT = one(pop, '[data-name="Bar/Today"]'), pT = metricP['Metric/Today'];
    if (barT && pT) {
      var b0 = parseFloat(pT.textContent.replace(/[^\d.-]/g, ''));
      barT.style.transformOrigin = '0 50%';
      barT.style.transition = 'scale .8s cubic-bezier(.22,.8,.24,1)';
      st.timers.push(setInterval(function () {
        if (editing() || idle()) return;
        var v = parseFloat(pT.textContent.replace(/[^\d.-]/g, ''));
        if (isFinite(v) && b0) barT.style.scale = (v / b0).toFixed(4) + ' 1';
      }, 1000));
    }

    /* 고장 Trip 현황 — 발생시각을 열 때마다 최근으로(원본은 2022년 자리표시자). 문구 나머지는 그대로 */
    all(pop, '[data-name="Widget/Trip Log"] [data-name="Message"]').forEach(function (p) {
      var m = /^\s*\[[^\]]*\]/.exec(p.textContent);
      if (!m || claimed(p)) return;
      var d = new Date(Date.now() - Math.round(rnd(4, 38)) * 60000 - Math.round(rnd(0, 59)) * 1000);
      var stamp = '[' + d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월 ' + d.getDate() + '일 '
        + p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds()) + ']';
      write(p, stamp + p.textContent.slice(m[0].length));
      p.__lsLast = p.textContent;
    });
    all(pop, '[data-name="Widget/Trip Log"] [data-name="Body"]').forEach(function (b) {
      b.classList.add('ls-rowhi');
      clickable(b, '고장 Trip 상세');
    });

    /* 기간 단추(15분 · 1시간 · 1일 / 시간 · 일별 · 월별) — 원본은 가운데가 '선택' 모습(테두리 #b1faff 그림).
       고른 단추로 그 그림(Background 안의 원본 이미지)을 옮긴다 — 새로 그리지 않는다. 그 판의 막대는 다시 자란다. */
    all(pop, '[data-name="Toolbar"]').forEach(function (tb) {
      var opts = all(tb, ':scope > [data-name^="Option/"]');
      var sel = opts.filter(function (o) { return /\(Selected\)$/.test(nameOf(o)); })[0];
      if (!sel || opts.length < 2) return;
      var art = function (o) { var bg = one(o, '[data-name="Background"]'); return bg && bg.firstElementChild; };
      var widget = tb.closest('[data-name^="Widget/"]');
      opts.forEach(function (o) {
        o.classList.toggle('ls-on', o === sel);
        clickable(o, (one(o, '[data-name="Label"]') || o).textContent.trim() + ' 단위로 보기', function () {
          if (o === sel) return;
          var a = art(o), b = art(sel);
          if (!a || !b) return;
          var pa = a.parentNode, pb = b.parentNode;
          pa.appendChild(b); pb.appendChild(a);
          sel.classList.remove('ls-on'); o.classList.add('ls-on');
          sel = o;
          if (widget && widget.__lsReplay) widget.__lsReplay();
        });
      });
    });

    installSoloPopup(root, pop, st, num);

    var fixWs = fixW.map(function (p) { return p.offsetWidth; });
    fixW.forEach(function (p, i) { if (fixWs[i]) { p.style.minWidth = fixWs[i] + 'px'; p.style.width = 'auto'; } });

    jobs.forEach(function (j) {
      var cur2 = j.base;
      j.p.__lsLast = j.p.textContent;
      st.timers.push(setInterval(function () {
        if (editing() || idle()) return;
        var nx = clamp(cur2 + rnd(-j.dev, j.dev) * 0.6, j.base - j.dev, j.base + j.dev);
        tween(j.p, cur2, nx, j.fmt);
        cur2 = nx;
      }, j.ms + Math.random() * 400));
    });
  }

  /* ══════════════════ 10-2. 단독 팝업 다섯 장(Figma popup-3 ~ 7) ══════════════════
     상태정보(변압기) · AC전원실 전압/전류 · 충전기/배터리 운영상태 · 냉각설비 상태 정보 · 알림.
     STATCOM 화면 한가운데에 얹힌다. 형상은 생성기 그대로 두고 '살아 있는 것'만 얹는다. */
  function liveFmt(s) {
    /* '20 ℃' · '30 barg' · '10% RH' · '70 L/min' · '154' — 숫자 자릿수와 앞뒤 글자를 그대로 지킨다 */
    var m = /^(\D*?)(-?\d+(?:\.\d+)?)(.*)$/.exec(String(s).trim());
    if (!m) return null;
    var d = (m[2].split('.')[1] || '').length;
    return { base: +m[2], fmt: function (x) { return m[1] + x.toFixed(d) + m[3]; } };
  }
  function popKey(pop) {
    for (var px in POP_SCENE) if (pop && pop.classList.contains(px + '-root')) return POP_SCENE[px];
    return '';
  }
  function installSoloPopup(root, pop, st, num) {
    var sc = popKey(pop);          /* 겹쳐 띄운 팝업도 같은 장치를 쓴다 — 장면이 아니라 팝업 종류로 가른다 */
    if (['transformer', 'acroom', 'charger', 'cooling', 'alarm'].indexOf(sc) < 0) return;
    var txt = function (el, sel) { var x = el && one(el, sel); return x ? x.textContent.trim() : ''; };

    /* 눌리는 자리 — 표 줄(설비 · 실별 상태) · 펌프 칸 · 그룹 말풍선 · 모듈 카드 · 측정 카드 */
    all(pop, '[data-name^="Field/"]').forEach(function (r) {
      r.classList.add('ls-rowhi');
      clickable(r, txt(r, '[data-name="Th"]') + ' 상세');
    });
    all(pop, '[data-name="Cells"] > [data-name^="Td/"]').forEach(function (c) { clickable(c, nameOf(c).replace('Td/', '') + ' 운전 상태'); });
    all(pop, '[data-name^="Callout/"]').forEach(function (c) { clickable(c, txt(c, '[data-name="Label"]') + ' 냉각팬'); });
    all(pop, '[data-name^="Card/"]').forEach(function (c) { clickable(c, txt(c, '[data-name="Chip"]') + ' 상세'); });
    all(pop, '[data-name^="Metric/"]').forEach(function (c) { clickable(c, txt(c, '[data-name="Label"]') + ' 추이'); });

    /* 알림 난 실 — 값 글자에 빛이 숨쉰다(글자색은 원본 그대로 · 헤드리스 캡처에서도 색이 안 바뀐다) */
    all(pop, '[data-name$="(Alarm)"]').forEach(function (r) { r.classList.add('ls-alarmrow'); });
    /* 펌프 운전 표지 — 운전 중인 것만 초록 빛이 돈다 */
    all(pop, '[data-name="Marker (Running)"]').forEach(function (m) { m.classList.add('ls-run'); });

    /* 냉각팬 — 원본 팬 그림(Housing · Blades · Hub)을 인라인으로 바꿔 날개(Blades)만 돌린다. 새로 그리지 않는다.
       상태는 레이어 이름 그대로: 동작 = 돈다 · 과부하 = 빨리 돌며 주황 빛 · 고장 = 멈춘 채 빨간 빛 · 중지 = 멈춤.
       라이트 테마는 생성기가 만든 -lt 그림(짙은 회색 팬)으로 다시 그린다 — 테마가 바뀌면 따라간다. */
    var themeOf = function () { return (pop.dataset.theme || root.dataset.theme) === 'light' ? 'light' : 'dark'; };
    all(pop, '[data-name^="Fan/"]').forEach(function (f) {
      var n = nameOf(f);
      var state = /\(Running\)/.test(n) ? 'run' : /\(Overload\)/.test(n) ? 'over' : /\(Fault\)/.test(n) ? 'fault' : 'stop';
      f.classList.add('ls-fan', 'ls-fan-' + state);
      clickable(f, n.replace('Fan/', '').replace(/\s*\(.*\)$/, '') + ' 냉각팬 · ' + { run: '동작', over: '과부하', fault: '고장', stop: '중지' }[state]);
      var im = one(f, 'img');
      if (!im || !window.fetch || !window.DOMParser) return;
      var src = im.getAttribute('src');
      /* 라이트 사본은 생성기가 색을 바꿀 게 있던 그림에만 만든다(중지 팬) — 라이트 시트에 적힌 것만 받는다(없는 파일 404 를 내지 않게) */
      var ltName = src.split('/').pop().replace(/\.svg$/, '-lt.svg');
      var hasLt = Array.prototype.some.call(document.querySelectorAll('style'), function (x) { return x.textContent.indexOf(ltName) >= 0; });
      Promise.all([fetchSvg(src), hasLt ? fetchSvg(src.replace(/\.svg$/, '-lt.svg')) : Promise.resolve('')]).then(function (tx) {
        var cur = im, u = '-lsf' + (++inlUid), shown = '';
        var paint = function () {
          var want = themeOf();
          var t = want === 'light' && /<svg/.test(tx[1] || '') ? tx[1] : tx[0];
          if (!t || shown === want || !cur.parentNode) return;
          var s = new DOMParser().parseFromString(t, 'image/svg+xml').documentElement;
          if (!s || s.nodeName.toLowerCase() !== 'svg') return;
          s = document.importNode(s, true);
          all(s, '[id]').forEach(function (e) { e.setAttribute('id', e.getAttribute('id') + u); });
          all(s, '[fill^="url(#"],[stroke^="url(#"]').forEach(function (e) {
            ['fill', 'stroke'].forEach(function (a) { var v = e.getAttribute(a); if (v && v.indexOf('url(#') === 0) e.setAttribute(a, v.replace(/\)$/, u + ')')); });
          });
          var hs = one(s, 'ellipse'), bl = one(s, '[id^="Blades"]');      /* Housing 의 중심 = 날개 축 */
          if (bl && hs) { bl.classList.add('ls-blades'); bl.style.transformOrigin = hs.getAttribute('cx') + 'px ' + hs.getAttribute('cy') + 'px'; }
          s.setAttribute('class', (im.getAttribute('class') || '') + ' ls-inl ls-fansvg');
          s.setAttribute('data-src', src);       /* 색 정하기(image.js)가 원래 파일 이름으로 '색 유지' 여부를 가른다 */
          if (im.id) s.id = im.id;
          cur.parentNode.replaceChild(s, cur);
          cur = s; shown = want;
        };
        paint();
        var mo = new MutationObserver(paint);
        mo.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
        mo.observe(pop, { attributes: true, attributeFilter: ['data-theme'] });
        (st.observers = st.observers || []).push(mo);
      });
    });

    /* 절연유 온도 레벨 — 채움(Fill)이 바닥을 붙인 채 오르내린다(원본 높이 245 언저리) */
    var fill = one(pop, '[data-name="Level Bar"] [data-name="Fill"]'), track = one(pop, '[data-name="Level Bar"] [data-name="Track"]');
    if (fill && track && fill.offsetHeight) {
      var bottom = track.offsetTop + track.offsetHeight, h0 = fill.offsetHeight, lv = h0;
      fill.style.transition = 'top 1.2s cubic-bezier(.22,.8,.24,1),height 1.2s cubic-bezier(.22,.8,.24,1)';
      st.timers.push(setInterval(function () {
        if (editing() || idle()) return;
        lv = clamp(lv + rnd(-16, 16), h0 - 44, Math.min(h0 + 44, track.offsetHeight - 6));
        fill.style.height = lv.toFixed(1) + 'px';
        fill.style.top = (bottom - lv).toFixed(1) + 'px';
      }, 2800 + Math.random() * 400));
    }

    /* 수치 — 원본 값 언저리에서 흔들린다(자릿수 · 단위 그대로). 0 · 날짜 · 글자 상태(정상 · Healthy …)는 그대로 둔다 */
    var liveP = function (p, rel, ms, min) {
      if (!p) return;
      var t = p.textContent.trim();
      if (/^\d{4}\.\d{1,2}\.\d{1,2}$/.test(t)) return;
      var f = liveFmt(t);
      if (!f || !f.base) return;
      num(p, Math.max(Math.abs(f.base) * rel, min || 0), f.fmt, ms, f.base);
    };
    /* AC전원실 전압 · 전류 */
    liveP(one(pop, '[data-name="Metric/Voltage"] [data-name="Measurement"] > [data-name="Value"]'), 0.0104, 2200);
    liveP(one(pop, '[data-name="Metric/Current"] [data-name="Measurement"] > [data-name="Value"]'), 0.024, 1800);
    /* 충전기 · 배터리 — 전압은 카드마다 원본 글자 모양을 지킨다(모듈 A·B '128' + 'V', 배터리 '128.' + '0V') */
    all(pop, '[data-name="Row/Voltage"] [data-name="Measurement"]').forEach(function (m, i) {
      var mp = all(m, ':scope > p');
      if (mp.length !== 2) return;
      if (!/\.$/.test(mp[0].textContent.trim())) { liveP(mp[0], 0.0063, 2600 + i * 300, 0.8); return; }
      var ut = mp[1].textContent.trim(), dig = /^\d+/.exec(ut), unit = ut.replace(/^\d+/, '');
      var b = parseFloat(mp[0].textContent.trim() + (dig ? dig[0] : '0')), dd = dig ? dig[0].length : 1, curB = b;
      mp.forEach(function (p) { p.__lsLast = p.textContent; if (p.offsetWidth) { p.style.minWidth = p.offsetWidth + 'px'; p.style.width = 'auto'; } });
      st.timers.push(setInterval(function () {
        if (editing() || idle() || mp.some(claimed)) return;
        curB = clamp(curB + rnd(-0.8, 0.8) * 0.6, b - 0.8, b + 0.8);
        var s = curB.toFixed(dd).split('.');
        write(mp[0], s[0] + '.', true);
        write(mp[1], s[1] + unit, true);
      }, 2600 + Math.random() * 400));
    });
    all(pop, '[data-name="Row/Current"] [data-name="Measurement"] > [data-name="Value"]').forEach(function (p, i) { liveP(p, 0.0375, 2000 + i * 260); });
    all(pop, '[data-name="Row/Temp"] [data-name="Measurement"] > [data-name="Value"]').forEach(function (p, i) { liveP(p, 0.018, 3400 + i * 300); });
    /* 냉각설비 — 온도 · 압력 · 습도 · 유량 · 레벨(값 칸 Td 의 글자) */
    /* 원본 값이 정수라(20 ℃ · 30 barg · 50 mm) 흔들림이 1 이상이어야 눈에 띈다 */
    all(pop, '[data-name^="Field/"] [data-name="Td"] [data-name="Value"]').forEach(function (p, i) { liveP(p, 0.04, 3000 + (i % 7) * 370, 1); });
  }

  /* ══════════════════ 11. 팝업 열기 — 페이지 연결 ══════════════════
     이 프로젝트의 팝업 여덟 장을 지금 보고 있는 페이지 위에 그대로 겹쳐 띄운다(바탕은 지금 페이지 · 닫으면 그 페이지로).
     · 화면에 '여는 자리'가 분명한 것 — 같은 부품 · 같은 문구가 화면에 있다:
         충전기/배터리 운영상태 ← Data Center 의 Widget/Charger Battery(제목 '충전기 / 배터리 운영상태' 가 팝업 제목과 같고 같은 카드다)
         AC전원실 전압/전류   ← STATCOM 의 Widget/Electrical Readings(전압 154 KV · 전류 250 A 같은 측정 카드 — 팝업이 이 카드를 키운 것)
     · 여는 자리를 시안에서 알 수 없는 것 — 헤더 Brand 옆 '팝업' 단추의 목록에 Figma 제목 그대로 둔다
         ACB 진단 · 계통 진단 · 에너지 진단(ACB 진단 1단 팝업 세 장) · 상태정보 · 냉각설비 상태 정보 · 알림
     팝업 마크업 · 시트는 생성기 모듈(window.build_<접두어> · <접두어>_CSS)을 그대로 쓴다. 모듈이 없는 낱장 미리보기에서는
     그 팝업의 미리보기 페이지로 넘어간다. 패널편집 중에는 열리지 않고, 편집을 켜면 겹친 팝업은 닫힌다(편집은 그 팝업의 페이지에서). */
  var POPUPS = [
    { key: 'acb', px: 'lsa', label: 'ACB 진단', group: 'ACB' },
    { key: 'system', px: 'lsy', label: '계통 진단', group: 'ACB' },
    { key: 'energy', px: 'lse', label: '에너지 진단', group: 'ACB' },
    { key: 'transformer', px: 'lst', label: '상태정보' },
    { key: 'acroom', px: 'lsp', label: 'AC전원실 전압/전류', trigger: { base: 'lsm', sel: '[data-name="Widget/Electrical Readings"]' } },
    { key: 'charger', px: 'lsb', label: '충전기/배터리 운영상태', trigger: { base: 'lsd', sel: '[data-name="Widget/Charger Battery"]' } },
    { key: 'cooling', px: 'lsc', label: '냉각설비 상태 정보' },
    { key: 'alarm', px: 'lsr', label: '알림' },
  ];
  function popupOf(key) { return POPUPS.filter(function (p) { return p.key === key; })[0]; }
  function ensurePopSheets(px) {
    var G = px.toUpperCase();
    [[G + '_CSS', px + '-style'], [G + '_LIGHT_CSS', px + '-light-style']].forEach(function (x) {
      if (document.getElementById(x[1]) || typeof window[x[0]] !== 'string') return;
      var s = document.createElement('style');
      s.id = x[1];                                   /* 스튜디오(js/templates/lselectric.js)와 같은 id — 색 바꾸기가 이 id 로 찾는다 */
      s.textContent = window[x[0]];
      document.head.appendChild(s);
    });
  }
  function installPopupLinks(root, st) {
    var frame = st.frame || frameOf(root);
    if (!frame) return;
    var base = root.classList.contains('lsd-root') ? 'lsd' : 'lsm';
    var anyImg = one(root, '[data-name="Logo Mark"] img') || one(root, 'img[src]');
    var A = anyImg ? anyImg.getAttribute('src').replace(/[^\/]*$/, '') : 'src/lselectric/';
    var page = pagePop(root), pageKey = page ? popKey(page) : '';
    var ov = null;                                   /* 지금 겹쳐 띄운 팝업 { key, mount, st } */

    function visibleKey() { return ov ? ov.key : (page && !page.parentElement.classList.contains('ls-pop-hide') ? pageKey : ''); }
    function sync() {
      var k = visibleKey();
      if (st.launch) all(st.launch, '.ls-launch-menu button[data-k]').forEach(function (b) {
        var on = b.getAttribute('data-k') === k;
        b.classList.toggle('cur', on);
        b.setAttribute('aria-checked', on ? 'true' : 'false');
      });
      all(root, '.ls-poptrig').forEach(function (t) { t.classList.toggle('ls-on', t.getAttribute('data-ls-pop') === k); });
    }
    function showPage(on) {
      if (!page) return;
      var m = page.parentElement;
      if (on && m.classList.contains('ls-pop-hide')) {
        m.classList.remove('ls-pop-hide');
        m.classList.remove('ls-pop-back'); void m.offsetWidth; m.classList.add('ls-pop-back');
      } else if (!on) m.classList.add('ls-pop-hide');
    }
    function disposeOv(o) {
      o.st.timers.forEach(function (t) { clearInterval(t); clearTimeout(t); });
      (o.st.observers || []).forEach(function (x) { x.disconnect(); });
      if (o.st.onPopDown) document.removeEventListener('pointerdown', o.st.onPopDown, true);
      if (st.blocks) st.blocks = st.blocks.filter(function (b) { return b.el !== o.mount; });
    }
    function closeOverlay(instant) {
      if (!ov) return;
      var o = ov; ov = null;
      disposeOv(o);
      if (instant) o.mount.remove();
      else {
        o.mount.classList.add('ls-pop-out');
        setTimeout(function () { o.mount.remove(); }, 270);
      }
      showPage(true);
      sync();
    }
    function open(key) {
      var P = popupOf(key);
      if (!P || editing()) return;
      if (key === pageKey) { closeOverlay(); showPage(true); sync(); return; }   /* 이 페이지 자체의 팝업 — 다시 보이게 */
      if (ov && ov.key === key) return;
      if (typeof window['build_' + P.px] !== 'function') { goScene(key); return; }   /* 낱장 미리보기 — 그 팝업의 페이지로 */
      closeOverlay(true);
      showPage(false);
      ensurePopSheets(P.px);
      var holder = document.createElement('div');
      holder.innerHTML = window['build_' + P.px](A);
      var name = (holder.firstElementChild && holder.firstElementChild.getAttribute('data-name')) || ('Popup/' + key);
      var m = document.createElement('div');
      m.className = P.px + '-mount ls-popmount ls-overlay ls-blk';
      m.setAttribute('data-name', name);
      m.setAttribute('data-ls-grp', 'X');
      m.setAttribute('role', 'dialog');
      m.setAttribute('aria-label', P.label);
      var pop = document.createElement('div');
      pop.className = P.px + '-root ls-pop';
      pop.dataset.theme = root.dataset.theme || 'dark';
      while (holder.firstChild) pop.appendChild(holder.firstChild);
      m.appendChild(pop);
      /* 반응형 자리(한가운데) — 붙이기 전에 이동값을 먼저 넣어 미끄러져 들어오지 않게 */
      m.style.setProperty('--ls-tx', ((st.exW || 0) / 2).toFixed(2) + 'px');
      m.style.setProperty('--ls-ty', ((st.exH || 0) / 2).toFixed(2) + 'px');
      frame.appendChild(m);
      if (st.blocks) st.blocks.push({ el: m, grp: 'X', name: name, top: 0 });
      var pst = { timers: [], S: st.S };
      ov = { key: key, mount: m, st: pst };
      try { installPopup(root, pst, pop, function () { closeOverlay(); }); } catch (e) { console.warn('[ls] overlay', e); }
      /* 바탕과 같은 색(테마 · 색 정하기)으로 — 새로 붙인 팝업 시트에도 색 바꾸기를 다시 건다 */
      try { window.__applyTplTint && window.__applyTplTint(); } catch (e) { }
      sync();
    }
    st.openPopup = open;
    st.closePopup = function () { closeOverlay(); };

    /* 화면에 여는 자리가 있는 팝업 — 그 부품을 누르면 열린다 */
    POPUPS.forEach(function (P) {
      if (!P.trigger || P.trigger.base !== base) return;
      all(root, P.trigger.sel).filter(outsidePop).forEach(function (t) {
        t.classList.add('ls-poptrig');
        t.setAttribute('data-ls-pop', P.key);
        t.setAttribute('aria-haspopup', 'dialog');
        clickable(t, P.label + ' 열기', function () { open(P.key); });
      });
    });

    /* 헤더 Brand 옆 '팝업' 단추 — 여는 자리를 시안에서 알 수 없는 팝업들(Figma 제목 그대로) */
    var brand = one(root, '[data-name="Header Bar"] > [data-name="Brand"]');
    var bar = brand && brand.parentElement;
    var list = POPUPS.filter(function (P) { return !P.trigger; });
    if (bar && list.length) {
      var L = document.createElement('div');
      L.className = 'ls-launch';
      L.setAttribute('data-name', 'Popup Launcher');
      L.style.left = (brand.offsetLeft + brand.offsetWidth + 22) + 'px';
      var item = function (P) {
        return '<button type="button" role="menuitemradio" aria-checked="false" data-k="' + P.key + '">'
          + '<span class="ic"><img src="' + A + 'icon-popup-diagnostics.svg" alt=""></span>' + esc(P.label) + '</button>';
      };
      var acb = list.filter(function (P) { return P.group === 'ACB'; }), etc = list.filter(function (P) { return P.group !== 'ACB'; });
      L.innerHTML = '<button type="button" class="ls-launch-btn" aria-haspopup="menu" aria-expanded="false" title="팝업 열기">'
        + '<span class="ic"><img src="' + A + 'icon-popup-diagnostics.svg" alt=""></span><span class="tx">팝업</span><b>' + list.length + '</b>'
        + '<img class="chev" src="' + A + 'icon-action-expand.svg" alt=""></button>'
        + '<div class="ls-launch-menu" role="menu" aria-label="팝업 열기">'
        + (acb.length ? '<div class="hd">ACB 진단(1단)</div>' + acb.map(item).join('') : '')
        + (acb.length && etc.length ? '<div class="sep"></div>' : '')
        + etc.map(item).join('')
        + '</div>';
      bar.appendChild(L);
      st.launch = L;
      var btn = one(L, '.ls-launch-btn');
      var setOpen = function (o) {
        L.classList.toggle('open', o);
        bar.classList.toggle('ls-launch-open', o);
        btn.setAttribute('aria-expanded', o ? 'true' : 'false');
      };
      btn.addEventListener('click', function (e) { e.stopPropagation(); if (editing()) return; setOpen(!L.classList.contains('open')); });
      all(L, '.ls-launch-menu button[data-k]').forEach(function (b) {
        b.addEventListener('click', function (e) {
          e.stopPropagation();
          setOpen(false);
          var k = b.getAttribute('data-k');
          if (k === visibleKey() && ov) { closeOverlay(); return; }   /* 열려 있는 것을 다시 누르면 닫는다 */
          open(k);
        });
      });
      st.onLaunchDown = function (e) { if (!L.contains(e.target)) setOpen(false); };
      document.addEventListener('pointerdown', st.onLaunchDown, true);
    }
    /* Esc — 목록이 열려 있으면 목록을, 아니면 겹친 팝업을 닫는다 */
    st.onPopKey = function (e) {
      if (e.key !== 'Escape' || !root.isConnected) return;
      if (st.launch && st.launch.classList.contains('open')) { st.launch.classList.remove('open'); if (bar) bar.classList.remove('ls-launch-open'); return; }
      if (ov) closeOverlay();
    };
    document.addEventListener('keydown', st.onPopKey);
    /* 패널편집을 켜면 겹친 팝업은 닫는다 — 편집 기록이 이 페이지 글자에 섞이지 않게(팝업 편집은 그 팝업의 페이지에서) */
    st.timers.push(setInterval(function () { if (ov && editing()) closeOverlay(true); }, 400));
    st.disposePopups = function () { if (ov) { disposeOv(ov); ov = null; } };
    sync();
  }

  /* ══════════════════ 살리기 ══════════════════ */
  function initLsElectric(root) {
    if (!root || root.__ls) return;
    injectStyle();
    root.classList.add('ls-root');
    var st = root.__ls = { timers: [] };
    if (/[?&]edit=1/.test(location.search)) root.classList.add('ls-edit-layout');   /* 낱장 미리보기에서 편집 모습 확인용 */
    try { installFit(root, st); } catch (e) { console.warn('[ls] fit', e); }
    try { installClock(root, st); } catch (e) { console.warn('[ls] clock', e); }
    try { installEventList(root, st); } catch (e) { console.warn('[ls] events', e); }
    try { installFold(root, st); } catch (e) { console.warn('[ls] fold', e); }
    try { installPicks(root, st); } catch (e) { console.warn('[ls] picks', e); }
    try { installToggles(root, st); } catch (e) { console.warn('[ls] toggles', e); }
    try { installLive(root, st); } catch (e) { console.warn('[ls] live', e); }
    try { installPopup(root, st); } catch (e) { console.warn('[ls] popup', e); }
    try { installPopupLinks(root, st); } catch (e) { console.warn('[ls] popup links', e); }
    try { installCharts(root, st); } catch (e) { console.warn('[ls] charts', e); }
    try { installPanelMove(root, st); } catch (e) { console.warn('[ls] move', e); }
  }
  function disposeLsElectric(root) {
    var st = root && root.__ls;
    if (!st) return;
    st.timers.forEach(function (t) { clearInterval(t); clearTimeout(t); });
    if (st.ro) st.ro.disconnect();
    (st.observers || []).forEach(function (o) { o.disconnect(); });
    if (st.onResize) window.removeEventListener('resize', st.onResize);
    Object.keys(st.charts || {}).forEach(function (k) { st.charts[k].dispose(); });
    if (st.onDocDown) document.removeEventListener('pointerdown', st.onDocDown, true);
    if (st.onPopDown) document.removeEventListener('pointerdown', st.onPopDown, true);
    if (st.onMove) { window.removeEventListener('pointermove', st.onMove); window.removeEventListener('pointerup', st.onUp); window.removeEventListener('pointercancel', st.onUp); }
    if (st.onReset) document.removeEventListener('click', st.onReset, true);
    if (st.onLaunchDown) document.removeEventListener('pointerdown', st.onLaunchDown, true);
    if (st.onPopKey) document.removeEventListener('keydown', st.onPopKey);
    if (st.disposePopups) st.disposePopups();
    root.__ls = null;
  }
  window.initLsElectric = initLsElectric;
  window.disposeLsElectric = disposeLsElectric;
})();
