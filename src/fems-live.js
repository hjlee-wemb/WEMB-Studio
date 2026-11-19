/* 스마트팩토리 에너지관리 디지털트윈 — 재구축 화면 5장(종합 현황 + 팝업 4)의 인터랙션 · 라이브 · 반응형 레이어.
   window.initFems(root) / window.disposeFems(root)   — root 는 늘 종합 현황 뿌리(.fmm-root). 팝업 장면은 그 안에 .sh-popmount 로 얹혀 있다.

   화면(DOM·CSS)은 생성기(src/fems/_gen/conv.js)가 Figma(FwLj96v9IlQSHRPURiJouD, REM 페이지) 그대로 만든다.
   이 파일은 그 위에 '움직이는 것'만 얹는다 — 정지 상태(?live=0) = Figma 원본.

   · 반응형 — 1920x1080 좌표계 + 균일 배율 S, 남는 몫은 캔버스를 넓혀 판을 가장자리에 다시 붙인다(여백 없음).
   · 날짜 — 표의 날짜는 열 때마다 오늘 기준으로 옮긴다(시안 기준일 2026-11-18 → 오늘, 날짜 사이 간격 그대로). 시안에 시계 자리가 없어 시계는 넣지 않았다.
   · 이벤트 로그 — 바(Bar (Collapsed))의 펼침 단추 ↔ 펼친 판(Figma Event Log (Expanded), src/fems-frags.js)의 접기 단추. 도구줄이 위로 미끄러지며 줄이 펼쳐진다.
   · 등급 칩(ALL · 고위험 …)을 누르면 그 등급 줄만 남기고 나머지는 흐려진다. 확인 단추는 알람 확인.
   · 화면 잇기 — 계통도 · 태양광 · 전력장비 단추, 3D 건물 이름표 · 이벤트 줄 → 팝업 장면, 팝업 닫기 → 종합 현황.
   · 3D 조작 — 방향 패드(상하좌우 · 회전 · 확대/축소) · 집(처음 시점) · 확대 단추, 나침반 바늘이 회전을 따라간다. 좌우 판 접기(« · »).
   · 라이브 — 전력 사용량 · 실시간 발전량 · 기상 · 건물별 발전량 막대 · 주간 막대(오늘) · 3D 이름표 kWh · 태양광 인버터 표 · 계통 지표 · 미터 카드, S·P·Q 곡선(인라인 SVG 로 다시 그려 숨 쉬듯 움직인다).
   · 차트 바꾸기(패널편집 중) — 위젯마다 에너지관리에 맞춘 추천 차트. 첫 항목 = 추천, '원본 그대로'로 되돌린다.
   · 패널 옮기기(패널편집 중) — 위젯 · 판 · 팝업을 4px 격자로.

   손으로 쓴 파일이다(생성물 아님). 고친 뒤 node mk-live.js → js/core/tpl-modules.js 의 ?v= 를 올릴 것. */
(function () {
  'use strict';

  var BASE_W = 1920, BASE_H = 1080;
  var K_LAYOUT = 'wemb-fems-layout', K_CHART = 'wemb-fems-chart', K_FOLD = 'wemb-fems-fold';
  var STYLE_ID = 'fems-live-style';
  var EASE = 'cubic-bezier(.22,.8,.24,1)';
  var ORIG_DAY = Date.UTC(2026, 10, 18);              /* 시안 기준일(가상 데이터 2026-11-18) */

  /* ══════════════════ 스타일 ══════════════════ */
  var BTN = '[data-name="Button/System Diagram"],[data-name="Button/Report"],[data-name="Button/Solar"],[data-name="Button/Power Equipment"]';
  var CSS = [
    '.fe-root{--fe-acc:0,157,255;overflow:clip!important;}',
    '.fe-root.fe-resizing *,.fe-root .fe-dragging,.fe-root .fe-dragging *{transition:none!important;}',
    '.fe-root.fe-live .fe-place{transition:translate .55s ' + EASE + ',opacity .3s ease;}',
    '.fe-root .fe-probe{position:absolute;width:0;height:0;overflow:hidden;color:#009dff;}',
    '.fe-root .fe-click{cursor:pointer;}',
    '.fe-root .fe-click *{cursor:inherit;}',
    '.dt-content-editing .fe-root .fe-click,.dt-content-editing .fe-root .fe-click *{cursor:text;}',
    '@keyframes feIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}}',
    '@keyframes feFade{from{opacity:0;}to{opacity:1;}}',
    '@keyframes fePop{from{opacity:0;transform:translateY(16px) scale(.985);}to{opacity:1;transform:none;}}',
    '@keyframes feLeft{from{opacity:0;transform:translateX(-26px);}to{opacity:1;transform:none;}}',
    '@keyframes feRight{from{opacity:0;transform:translateX(26px);}to{opacity:1;transform:none;}}',
    '@keyframes feDown{from{opacity:0;transform:translateY(-12px);}to{opacity:1;transform:none;}}',
    '@keyframes feUp{from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:none;}}',
    '.fe-root.fe-enter [data-name="3D Scene"],.fe-root.fe-enter [data-name="Building Labels"]{animation:feFade .8s ease both;}',
    '.fe-root.fe-enter [data-name="Header"],.fe-root.fe-enter [data-name="Top Bar"]{animation:feDown .55s ' + EASE + ' both;}',
    '.fe-root.fe-enter [data-name="Side Panel (Left)"]{animation:feLeft .6s ' + EASE + ' both;}',
    '.fe-root.fe-enter [data-name="Side Panel (Right)"]{animation:feRight .6s ' + EASE + ' both;}',
    '.fe-root.fe-enter [data-name="Event Log"]{animation:feUp .6s ' + EASE + ' both;animation-delay:.1s;}',
    '.fe-root.fe-enter [data-name^="Label/"]{animation:feIn .5s ' + EASE + ' both;animation-delay:calc(var(--i,0) * 70ms + 250ms);}',
    '.fe-root.fe-enter .sh-popmount{animation:fePop .5s ' + EASE + ' both;}',

    /* 실시간 시계 — 헤더 오른쪽 아이콘 묶음(사용자 · 로그아웃) 오른쪽(사용자 지시 11-19). 원본 상단 알약 단추(#eff8ff · 둥근 20 · 높이 30 · 12px 500)와 같은 모양 */
    '.fe-root .fe-clock{position:absolute;left:calc(100% + 26px);top:50%;translate:0 -50%;height:30px;display:flex;align-items:center;gap:10px;padding:0 14px 0 12px;border-radius:20px;background:#eff8ff;box-shadow:inset 0 0 0 1px rgba(0,157,255,.12);white-space:nowrap;pointer-events:none;font-family:"Pretendard Variable","Pretendard","Malgun Gothic",sans-serif;font-variant-numeric:tabular-nums;}',
    '.fe-root .fe-clock i{width:6px;height:6px;border-radius:50%;background:#43d18d;box-shadow:0 0 0 3px rgba(67,209,141,.18);animation:feBeat 2s ease-in-out infinite;}',
    '.fe-root .fe-clock .fe-cd{font-size:12px;font-weight:500;line-height:14px;color:#3f4052;}',
    '.fe-root .fe-clock b{width:1px;height:12px;background:#d9d9d9;}',
    '.fe-root .fe-clock .fe-ct{font-size:15px;font-weight:620;line-height:18px;color:#1359da;letter-spacing:.2px;min-width:62px;}',
    '@keyframes feBeat{0%,100%{opacity:1;}50%{opacity:.35;}}',
    '.fe-root[data-theme="dark"] .fe-clock{background:#1b2029;box-shadow:inset 0 0 0 1px rgba(255,255,255,.07);}',
    '.fe-root[data-theme="dark"] .fe-clock .fe-cd{color:#c3cad6;}',
    '.fe-root[data-theme="dark"] .fe-clock b{background:rgba(255,255,255,.14);}',
    '.fe-root[data-theme="dark"] .fe-clock .fe-ct{color:#6aa8ff;}',
    /* 팝업 뒤 막(검정 70%, 생성기 overlay.dim) — 부드럽게 깔리고 누르면 닫힌다 */
    '.fe-root .sh-dim{animation:feFade .35s ease both;cursor:pointer;}',
    /* 팝업 받침 — 팝업 제목줄 · 몸체 유리는 반투명이라 Figma 에선 뒤의 밝은 화면이 비쳐 제목줄이 #e5e5e5 쯤이었다.
       막(검정 70%)이 깔리면 제목줄이 회색(#919296)이 되고 3D 라벨 · 로고 · KPI 가 비쳐 제목이 묻혔다.
       팝업 상자 밑에 Figma 에서 비치던 밝은 바탕을 받친다(다크는 그래파이트) — 1920 에서 Figma 색으로 돌아간다 */
    /* 받침은 팝업 카드(Background · Background Glow) 크기에 맞춘다 — Figma 프레임은 카드보다 넓을 수 있다(태양광 PV: 프레임 1417 · 카드 1380,
       프레임 크기로 깔면 카드 오른쪽에 흰 띠가 삐져나왔다) */
    '.fe-root .fe-popbed{position:absolute;background:#fff;pointer-events:none;}',
    '.fe-root[data-theme="dark"] .fe-popbed{background:#161a21;}',
    /* 다크 팝업 띄우기(11-19 "다크에서 팝업이 잘 안 보인다") — 팝업 유리(#13161c)가 막 아래 화면(#0a0c10)과 밝기가 거의 같았다.
       ① 카드 유리 그림만 한 단계 밝힌다(설비 그림 · 아이콘은 그대로) ② 받침 바깥에 옅은 파란 테두리 + 넓은 빛 + 깊은 그림자 */
    '.fe-root[data-theme="dark"] .sh-pop > [data-node-id] > :is([data-name="Background"],[data-name="Background Glow"]) img,.fe-root[data-theme="dark"] .sh-pop > [data-node-id] > :is([data-name="Background"],[data-name="Background Glow"]) > [data-name="Base"] img,.fe-root[data-theme="dark"] .sh-pop > [data-node-id] > [data-name="Base"] img{filter:brightness(1.5) saturate(1.05);}',
    '.fe-root[data-theme="dark"] .fe-popbed{box-shadow:0 0 0 1px rgba(124,170,240,.42),0 0 0 5px rgba(59,130,234,.10),0 0 46px rgba(59,130,234,.18),0 30px 80px rgba(0,0,0,.75);}',
    '.fe-root[data-theme="dark"] .sh-pop [data-name="Button/Close"]{filter:drop-shadow(0 0 6px rgba(124,170,240,.35));}',
    /* 알림 띠(Ticker) — 띠 가운데에 '알림 메시지'처럼: 등급 공 아이콘 · 메시지 · 시각. 시스템 상태와 최근 경보가 번갈아 올라온다 */
    '.fe-root [data-name="Ticker"] > [data-name="Message Wrap"]{position:absolute!important;left:21px;top:0;width:810px;height:44px;padding:0!important;display:block!important;overflow:hidden;}',
    '.fe-root .fe-tk{position:absolute;left:0;right:0;top:0;height:42px;display:flex;align-items:center;justify-content:center;gap:8px;translate:0 70%;opacity:0;transition:translate .6s ' + EASE + ',opacity .45s ease;white-space:nowrap;font-family:"Pretendard Variable","Pretendard","Malgun Gothic",sans-serif;}',
    '.fe-root .fe-tk.fe-on{translate:0 0;opacity:1;}',
    '.fe-root .fe-tk.fe-out{translate:0 -70%;opacity:0;}',
    '.fe-root .fe-tk > img{width:14px;height:14px;display:block;flex:none;}',
    '.fe-root .fe-tk > p{width:auto!important;color:#3f4052!important;font-weight:600!important;}',
    '.fe-root .fe-tk .fe-tk-lv{font-size:12px;font-weight:600;line-height:20px;padding:0 8px;border-radius:10px;background:rgba(243,49,47,.1);color:#e0302e;}',
    '.fe-root .fe-tk .fe-tk-lv.wa{background:rgba(0,157,255,.1);color:#0a7fd0;}',
    '.fe-root .fe-tk .fe-tk-tx{font-size:15px;font-weight:600;line-height:18px;color:#3f4052;}',
    '.fe-root .fe-tk .fe-tk-tm{font-size:12px;font-weight:500;line-height:14px;color:#8a8c90;font-variant-numeric:tabular-nums;padding-left:8px;border-left:1px solid #d9d9d9;}',
    '.fe-root[data-theme="dark"] .fe-tk > p,.fe-root[data-theme="dark"] .fe-tk .fe-tk-tx{color:#e6e9ef!important;}',
    '.fe-root[data-theme="dark"] .fe-tk .fe-tk-tm{color:#8d95a3;border-left-color:rgba(255,255,255,.14);}',
    '.fe-root[data-theme="dark"] .fe-tk .fe-tk-lv{background:rgba(243,49,47,.18);color:#ff7a78;}',
    '.fe-root[data-theme="dark"] .fe-tk .fe-tk-lv.wa{background:rgba(94,196,255,.16);color:#7fd0ff;}',
    '.fe-root[data-theme="dark"] .sh-popmount [data-name="Title Group"] p{color:#eef1f6!important;}',

    /* 상단 단추(계통도 · 리포트 · 태양광 · 전력장비) */
    '.fe-root :is(' + BTN + '):not([data-name="Button Group"] *){transition:translate .22s ' + EASE + ',box-shadow .25s ease,filter .2s ease;}',
    '.fe-root [data-name^="Button Group ("] > :is(' + BTN + '):hover{translate:0 -2px;box-shadow:0 6px 14px rgba(var(--fe-acc),.28),inset 0 0 0 1px rgba(var(--fe-acc),.55);}',
    '.fe-root [data-name^="Button Group ("] > :is(' + BTN + '):active{translate:0 1px;filter:brightness(.96);}',
    '.fe-root [data-name^="Button Group ("] > :is(' + BTN + ') p{transition:color .2s ease;}',
    '.fe-root [data-name^="Button Group ("] > :is(' + BTN + '):hover p{color:rgb(0,122,214)!important;}',
    /* 알람 이벤트 바로가기 */
    '.fe-root [data-name="Widget/Alarm Event"] [data-name="Button Group"] > *{transition:translate .25s ' + EASE + ',filter .25s ease;}',
    '.fe-root [data-name="Widget/Alarm Event"] [data-name="Button Group"] > *:hover{translate:0 -2px;filter:brightness(1.08) drop-shadow(0 6px 10px rgba(var(--fe-acc),.35));}',
    '.fe-root [data-name="Widget/Alarm Event"] [data-name="Button Group"] > *:active{translate:0 1px;}',
    /* 헤더 아이콘 */
    '.fe-root [data-name="Button/User"],.fe-root [data-name="Button/Logout"]{transition:translate .2s ' + EASE + ',filter .2s ease;}',
    '.fe-root [data-name="Button/User"]:hover,.fe-root [data-name="Button/Logout"]:hover{translate:0 -1px;filter:drop-shadow(0 2px 5px rgba(var(--fe-acc),.55)) brightness(1.05);}',
    /* 3D 이름표 */
    '.fe-root [data-name^="Label/"]{transition:translate .25s ' + EASE + ',filter .25s ease,box-shadow .25s ease;}',
    '.fe-root [data-name^="Label/"]:hover{translate:0 -2px;filter:brightness(1.18);box-shadow:0 0 0 1px rgba(120,190,255,.9),0 8px 16px rgba(10,30,80,.35);z-index:3;}',
    '.fe-root [data-name="3D Scene"],.fe-root [data-name="Building Labels"]{transform-origin:50% 50%;transition:transform .7s ' + EASE + ';}',
    /* 지도 조작 */
    '.fe-root [data-name="Direction Pad"] [data-name^="Button/"],.fe-root [data-name="Icon Group"] > *{transition:filter .2s ease,scale .2s ' + EASE + ';}',
    '.fe-root [data-name="Direction Pad"] [data-name^="Button/"]:hover{filter:brightness(1.6) drop-shadow(0 0 4px rgba(120,200,255,.9));scale:1.15;}',
    '.fe-root [data-name="Direction Pad"] [data-name^="Button/"]:active{scale:.92;}',
    '.fe-root [data-name="Icon Group"] > *:hover{filter:brightness(1.06) drop-shadow(0 4px 8px rgba(var(--fe-acc),.45));scale:1.06;}',
    '.fe-root [data-name="Needle"]{transition:rotate .7s ' + EASE + ';}',
    /* 판 접기(« ») */
    '.fe-root [data-name="Button/Collapse"],.fe-root [data-name="Button/Expand"]{transition:filter .2s ease,scale .2s ' + EASE + ',translate .6s ' + EASE + ',rotate .6s ' + EASE + ';}',
    '.fe-root [data-name="Button/Collapse"]:hover,.fe-root [data-name="Button/Expand"]:hover{filter:brightness(1.35) drop-shadow(0 3px 6px rgba(0,0,0,.25));scale:1.08;}',
    '.fe-root .fe-panel{transition:translate .6s ' + EASE + ',opacity .45s ease;}',
    '.fe-root .fe-panel.fe-shut > *:not([data-name="Button/Collapse"]){opacity:0;transition:opacity .35s ease;}',
    /* 접기 단추 — 판과 같은 시간 · 곡선으로 움직이고 화살표는 그동안 돌아선다(따로 놀지 않게) */
    '.fe-root.fe-live .fe-panel > .fe-foldbtn.fe-place{transition:translate .55s ' + EASE + ',rotate .55s ' + EASE + ',filter .2s ease,box-shadow .2s ease;}',
    /* 이벤트 로그 펼침 */
    '.fe-root [data-name="Event Log"]{overflow:visible!important;}',
    '.fe-root .fe-evx{position:absolute;left:0;right:auto;top:auto!important;bottom:0!important;width:100%;height:405px;z-index:4;transition:translate .6s ' + EASE + ',clip-path .6s ' + EASE + ',opacity .25s ease;}',
    '.fe-root .fe-evx.fe-off{translate:0 347px;clip-path:inset(0 0 347px 0);pointer-events:none;}',
    '.fe-root .fe-evx.fe-gone{opacity:0;}',
    '.fe-root [data-name="Bar (Collapsed)"]{transition:opacity .2s ease;}',
    '.fe-root .fe-evopen > [data-name="Bar (Collapsed)"]{opacity:0;pointer-events:none;}',
    /* 등급 칩 · 확인 단추 · 표 줄 */
    '.fe-root [data-name^="Count/"]{cursor:pointer;transition:translate .2s ' + EASE + ',box-shadow .2s ease,filter .2s ease;}',
    '.fe-root [data-name^="Count/"]:hover{translate:0 -1px;filter:drop-shadow(0 3px 6px rgba(var(--fe-acc),.3));}',
    '.fe-root [data-name^="Count/"].fe-on{box-shadow:0 0 0 2px rgba(var(--fe-acc),.85);border-radius:3px;}',
    '.fe-root [data-name="Button/Ack"]{cursor:pointer;transition:translate .2s ' + EASE + ',filter .2s ease;}',
    '.fe-root [data-name="Button/Ack"]:hover{translate:0 -1px;filter:brightness(1.04) drop-shadow(0 4px 8px rgba(var(--fe-acc),.35));}',
    '.fe-root [data-name="Button/Ack"]:hover > [data-name="Background"]{background-color:#6baafe!important;}',
    '.fe-root [data-name="Button/Ack"]:active{translate:0 1px;}',
    '.fe-root .fe-row{transition:opacity .3s ease,background-color .2s ease;}',
    '.fe-root .fe-dim{opacity:.18!important;}',
    '.fe-root .fe-rowhit{position:absolute;z-index:2;cursor:pointer;border-radius:4px;transition:background-color .2s ease;}',
    '.fe-root .fe-rowhit:hover{background-color:rgba(var(--fe-acc),.07);}',
    '.fe-root .fe-acked [data-name^="Badge/"]{filter:saturate(.35);opacity:.8;transition:filter .4s ease,opacity .4s ease;}',
    /* 닫기 · 고르기 */
    '.fe-root [data-name="Button/Close"]{cursor:pointer;transition:rotate .35s ' + EASE + ',filter .2s ease,scale .2s ' + EASE + ';}',
    '.fe-root [data-name="Button/Close"]:hover{rotate:90deg;filter:brightness(1.35);scale:1.06;}',
    '.fe-root [data-name="Select"]{cursor:pointer;transition:box-shadow .2s ease;border-radius:30px;}',
    '.fe-root [data-name="Select"]:hover,.fe-root [data-name="Select"].fe-open{box-shadow:0 0 0 2px rgba(42,87,237,.35);}',
    '.fe-root [data-name="Select"] [data-name="Chevron Wrap"]{transition:rotate .25s ' + EASE + ';}',
    '.fe-root [data-name="Select"].fe-open [data-name="Chevron Wrap"]{rotate:180deg;}',
    '.fe-root .fe-selmenu{position:absolute;left:0;top:calc(100% + 4px);z-index:60;min-width:100%;display:none;flex-direction:column;gap:2px;padding:4px;border-radius:12px;background:#fff;border:1px solid rgba(42,87,237,.25);box-shadow:0 10px 24px rgba(30,40,70,.16);}',
    '.fe-root .fe-selmenu.open{display:flex;animation:feIn .2s ' + EASE + ' both;}',
    '.fe-root .fe-selmenu button{all:unset;box-sizing:border-box;padding:6px 12px;border-radius:8px;font:600 12px/1.2 "Pretendard Variable",Pretendard,sans-serif;color:#464d5c;cursor:pointer;white-space:nowrap;}',
    '.fe-root .fe-selmenu button:hover{background:rgba(var(--fe-acc),.1);}',
    '.fe-root .fe-selmenu button.cur{color:#2a57ed;font-weight:700;}',
    '.fe-root :has(> .fe-selmenu.open){z-index:55!important;overflow:visible!important;}',
    /* 계통도 심볼 · 미터 카드 · 태그 */
    '.fe-root [data-name^="Symbol/"]:not([data-name$=" Wrap"]){transition:filter .25s ease,scale .25s ' + EASE + ';}',
    '.fe-root [data-name^="Symbol/"]:not([data-name$=" Wrap"]):hover{filter:drop-shadow(0 0 5px rgba(79,158,255,.95)) brightness(1.15);scale:1.12;cursor:pointer;}',
    '.fe-root [data-name^="Meter Card/"]{transition:translate .25s ' + EASE + ',filter .25s ease;}',
    '.fe-root [data-name^="Meter Card/"]:hover{translate:0 -3px;filter:drop-shadow(0 8px 12px rgba(30,40,70,.18));}',
    '.fe-root [data-name^="Tag/"]:not([data-name$=" Wrap"]){transition:box-shadow .2s ease;}',
    '.fe-root [data-name^="Tag/"]:not([data-name$=" Wrap"]):hover{box-shadow:0 0 0 2px rgba(var(--fe-acc),.45);}',
    '.fe-root [data-name^="Metric/"]{transition:translate .25s ' + EASE + ',filter .25s ease;}',
    '.fe-root [data-name^="Metric/"]:hover{translate:0 -2px;filter:drop-shadow(0 6px 10px rgba(30,40,70,.14));}',
    '.fe-root [data-name^="Item/"][data-name*="Power"]{cursor:pointer;transition:opacity .25s ease;}',
    '.fe-root [data-name^="Item/"][data-name*="Power"].fe-off{opacity:.35;}',
    '.fe-root .fe-spq path{transition:opacity .35s ease;}',
    '.fe-root .fe-spq .fe-hide{opacity:0;}',
    /* 숫자가 바뀔 때 살짝 반짝 */
    '.fe-root .fe-tick{animation:feTick .6s ease;}',
    '@keyframes feTick{0%{filter:brightness(1.35);}100%{filter:none;}}',
    '.fe-root [data-name="Data"] > *,.fe-root .fe-bar{transition:scale 1.2s ' + EASE + ';}',
    /* 토스트 */
    '.fe-root .fe-toast{position:absolute;left:50%;top:150px;z-index:90;translate:-50% -8px;opacity:0;padding:11px 20px;border:1px solid rgba(var(--fe-acc),.45);border-radius:12px;background:rgba(255,255,255,.96);color:#303842;font:600 15px/1 "Pretendard Variable",Pretendard,sans-serif;pointer-events:none;transition:opacity .25s ease,translate .3s ' + EASE + ';white-space:nowrap;box-shadow:0 10px 24px rgba(30,40,70,.16);}',
    '.fe-root .fe-toast.on{opacity:1;translate:-50% 0;}',
    /* 패널편집 */
    '.dt-editing .fe-root .fe-mv,.fe-root.fe-edit-layout .fe-mv{cursor:grab!important;}',
    '.dt-editing .fe-root .fe-mv *,.fe-root.fe-edit-layout .fe-mv *{cursor:grab!important;}',
    '.dt-editing .fe-root .fe-mv:hover,.fe-root.fe-edit-layout .fe-mv:hover{outline:1px dashed rgba(var(--fe-acc),.85);outline-offset:3px;}',
    '.fe-root .fe-mv.fe-front{z-index:20;}',
    '.fe-root .fe-mv.fe-dragging{z-index:30;filter:drop-shadow(0 16px 26px rgba(30,40,70,.28));cursor:grabbing!important;}',
    '.fe-root .fe-resetbtn{position:absolute;left:520px;top:20px;z-index:45;display:none;height:30px;padding:0 12px;border:1px solid rgb(var(--fe-acc));border-radius:8px;background:#fff;color:#303842;font:600 13px/1 "Pretendard Variable",Pretendard,sans-serif;cursor:pointer;}',
    '.fe-root .fe-resetbtn:hover{box-shadow:0 0 12px rgba(var(--fe-acc),.45);}',
    '.dt-editing .fe-root .fe-resetbtn,.fe-root.fe-edit-layout .fe-resetbtn{display:block;}',
    '.dt-editing .fe-root [data-name]{animation-play-state:paused!important;}',
    '.fe-root .fe-chost{position:absolute;z-index:6;pointer-events:auto;}',
    '.fe-root .fe-hidekids > *:not(.fe-chost):not(.fe-chartbtn):not(.fe-chartmenu):not([data-name="Header"]){visibility:hidden!important;}',
    '.fe-root .fe-chart{border-radius:inherit;z-index:2;}',
    '.fe-root .fe-chartbtn{position:absolute;top:10px;right:12px;z-index:46;}',
    '.fe-root .fe-chartmenu{top:36px;right:10px;z-index:47;}',
    '.fe-root :has(> .fe-chartmenu.open){z-index:50!important;}',
    '.fe-root .fe-chartbtn{position:absolute;top:-11px;right:14px;z-index:25;display:none;align-items:center;gap:4px;height:22px;padding:0 9px;border:1px solid rgb(var(--fe-acc));background:#06264a;color:#e6f7ff;font:500 12px/1 Pretendard,system-ui,sans-serif;cursor:pointer;white-space:nowrap;}',
    '.fe-root .fe-chartbtn:hover{filter:brightness(1.25);box-shadow:0 0 12px rgba(var(--fe-acc),.6);}',
    '.dt-editing .fe-root .fe-chartbtn,.dt-content-editing .fe-root .fe-chartbtn,.fe-root.fe-edit-layout .fe-chartbtn{display:inline-flex;}',
    '.fe-root .fe-chartmenu{position:absolute;top:14px;right:14px;z-index:40;min-width:208px;padding:5px;border:1px solid #2a7ca0;background:#071a30;color:#c7ecf4;font:400 13px/1.35 Pretendard,system-ui,sans-serif;box-shadow:0 12px 28px rgba(0,0,0,.5);opacity:0;translate:0 -4px;pointer-events:none!important;transition:opacity .16s ease,translate .16s ease;}',
    '.fe-root .fe-chartmenu.open{opacity:1;translate:0 0;pointer-events:auto!important;}',
    '.fe-root .fe-chartmenu .hd{padding:4px 8px 6px;font-size:11px;color:#8ea6b3;white-space:nowrap;}',
    '.fe-root .fe-chartmenu button{display:flex;align-items:center;gap:8px;width:100%;padding:6px 8px;border:0;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer!important;white-space:nowrap;}',
    '.fe-root .fe-chartmenu button:hover{background:rgba(var(--fe-acc),.14);color:#fff;}',
    '.fe-root .fe-chartmenu button.cur{background:rgba(9,182,251,.26);color:#fff;}',
    '.fe-root .fe-chartmenu .ic{width:18px;height:14px;flex:none;}',
    '.fe-root .fe-chartmenu .rec{margin-left:auto;padding:1px 6px;background:rgb(var(--fe-acc));color:#03202e;font-size:10px;font-weight:700;}',
    '.fe-root .fe-chartmenu .sep{height:1px;margin:4px 2px;background:rgba(199,236,244,.16);}',
    '.fe-root .fe-chart{position:absolute;inset:0;display:flex;flex-direction:column;padding:10px 14px 8px;background:linear-gradient(180deg,rgba(14,32,54,.97),rgba(12,26,46,.97));box-shadow:inset 0 0 0 1px rgba(42,124,160,.75);color:#c7ecf4;font:400 12px/1.3 Pretendard,system-ui,sans-serif;animation:feChartIn .35s ease;}',
    '.fe-root .fe-chart .pl,.fe-root .fe-chart .lg,.fe-root .fe-chart .ct i,.fe-root .fe-chart .ct b{filter:hue-rotate(var(--fe-chue,0deg));}',
    '.fe-root .fe-chart .ct{display:flex;align-items:center;gap:6px;font-weight:500;font-size:15px;color:#fff;white-space:nowrap;}',
    '.fe-root .fe-chart .ct i{display:block;width:8px;height:8px;background:#2a7ca0;flex:none;}',
    '.fe-root .fe-chart .ct b{margin-left:auto;font-family:Tomorrow,Pretendard,sans-serif;font-weight:400;font-size:18px;color:#00ffd2;}',
    '.fe-root .fe-chart .ct b small{font:400 11px Pretendard,sans-serif;color:#8ea6b3;margin-left:3px;}',
    '.fe-root .fe-chart .lg{display:flex;gap:10px;margin-top:3px;font-size:11px;color:#8ea6b3;white-space:nowrap;}',
    '.fe-root .fe-chart .lg span{display:inline-flex;align-items:center;gap:4px;}',
    '.fe-root .fe-chart .lg span:before{content:"";width:9px;height:3px;background:var(--c);}',
    '.fe-root .fe-chart .pl{position:relative;flex:1;min-height:0;margin-top:6px;}',
    '.fe-root .fe-chart svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;}',
    '.fe-root .fe-chart .ax{fill:#8ea6b3;font-size:11px;font-family:Pretendard,system-ui,sans-serif;}',
    '.fe-root .fe-chart .gl{stroke:rgba(142,166,179,.16);stroke-width:1;shape-rendering:crispEdges;}',
    '.fe-root .fe-chart .bars{position:absolute;inset:0 0 16px;display:flex;align-items:flex-end;justify-content:space-around;gap:8px;}',
    '.fe-root .fe-chart .bars > div{position:relative;flex:1;max-width:34px;height:100%;display:flex;align-items:flex-end;}',
    '.fe-root .fe-chart .bars i{display:block;width:100%;background:linear-gradient(180deg,var(--c),rgba(9,182,251,.18));transition:height .9s ' + EASE + ';}',
    '.fe-root .fe-chart .bars em{position:absolute;left:50%;translate:-50% 0;bottom:calc(var(--h) + 2px);font-style:normal;font-size:11px;color:#e6f7ff;white-space:nowrap;transition:bottom .9s ' + EASE + ';}',
    '.fe-root .fe-chart .bars u{position:absolute;left:50%;translate:-50% 0;bottom:-16px;text-decoration:none;font-size:11px;color:#8ea6b3;white-space:nowrap;}',
    '.fe-root .fe-chart .hb{display:flex;flex-direction:column;justify-content:space-around;height:100%;gap:3px;}',
    '.fe-root .fe-chart .hb > div{display:grid;grid-template-columns:72px 1fr 50px;align-items:center;gap:8px;font-size:12px;}',
    '.fe-root .fe-chart .hb s{position:relative;display:block;height:8px;background:rgba(142,166,179,.16);overflow:hidden;text-decoration:none;}',
    '.fe-root .fe-chart .hb s i{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,rgba(9,182,251,.5),var(--c));transition:width .9s ' + EASE + ';}',
    '.fe-root .fe-chart .hb b{text-align:right;color:#fff;font-weight:500;font-variant-numeric:tabular-nums;}',
    '.fe-root .fe-chart .arc{transition:stroke-dasharray .9s ' + EASE + ',stroke-dashoffset .9s ' + EASE + ';}',
    '.fe-root .fe-chart .gv{position:absolute;left:0;right:0;bottom:0;text-align:center;font-family:Tomorrow,Pretendard,sans-serif;font-size:22px;color:#00ffd2;}',
    '.fe-root .fe-chart .gv small{font:400 12px Pretendard,sans-serif;color:#8ea6b3;margin-left:2px;}',
    '.fe-root .fe-chart .dn{display:flex;align-items:center;gap:16px;height:100%;}',
    '.fe-root .fe-chart .dn .ring{position:relative;height:100%;aspect-ratio:1;flex:none;}',
    '.fe-root .fe-chart .dn .ring b{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Tomorrow,Pretendard,sans-serif;font-weight:400;font-size:17px;color:#fff;}',
    '.fe-root .fe-chart .dn .ring b small{font:400 10px Pretendard,sans-serif;color:#8ea6b3;}',
    '.fe-root .fe-chart .dn ul{list-style:none;display:flex;flex-direction:column;gap:4px;font-size:12px;min-width:0;flex:1;}',
    '.fe-root .fe-chart .dn li{display:flex;align-items:center;gap:6px;white-space:nowrap;}',
    '.fe-root .fe-chart .dn li:before{content:"";width:9px;height:3px;background:var(--c);flex:none;}',
    '.fe-root .fe-chart .dn li b{margin-left:auto;color:#fff;font-weight:500;font-variant-numeric:tabular-nums;}',
    '@keyframes feChartIn{from{opacity:0;}to{opacity:1;}}',
    '.fe-root:not([data-theme="dark"]) .fe-chartbtn{background:#fff;color:#06365c;}',
    '.fe-root:not([data-theme="dark"]) .fe-chartmenu{background:#fff;color:#20405a;border-color:#9dbdd2;box-shadow:0 12px 28px rgba(30,60,100,.25);}',
    '.fe-root:not([data-theme="dark"]) .fe-chartmenu button:hover{background:rgba(0,112,178,.1);color:#06365c;}',
    '.fe-root:not([data-theme="dark"]) .fe-chartmenu button.cur{background:rgba(0,112,178,.16);color:#06365c;}',
    '.fe-root:not([data-theme="dark"]) .fe-chart{background:#fff;box-shadow:inset 0 0 0 1px #c5d9e6;color:#20405a;}',
    '.fe-root:not([data-theme="dark"]) .fe-chart .ct{color:#0e2c47;}',
    '.fe-root:not([data-theme="dark"]) .fe-chart .ct b,.fe-root:not([data-theme="dark"]) .fe-chart .gv{color:#00786a;}',
    '.fe-root:not([data-theme="dark"]) .fe-chart .lg,.fe-root:not([data-theme="dark"]) .fe-chart .bars u,.fe-root:not([data-theme="dark"]) .fe-chart .ct b small,.fe-root:not([data-theme="dark"]) .fe-chart .gv small,.fe-root:not([data-theme="dark"]) .fe-chart .dn .ring b small{color:#55707f;}',
    '.fe-root:not([data-theme="dark"]) .fe-chart .ax{fill:#55707f;}',
    '.fe-root:not([data-theme="dark"]) .fe-chart .gl{stroke:rgba(40,80,110,.14);}',
    '.fe-root:not([data-theme="dark"]) .fe-chart .bars em,.fe-root:not([data-theme="dark"]) .fe-chart .hb b,.fe-root:not([data-theme="dark"]) .fe-chart .dn li b,.fe-root:not([data-theme="dark"]) .fe-chart .dn .ring b{color:#0e2c47;}',
    '.fe-root:not([data-theme="dark"]) .fe-chart .hb s{background:rgba(40,80,110,.1);}',
    /* 다크 */
    '.fe-root[data-theme="dark"] .fe-toast{background:rgba(22,26,33,.96);color:#e8eef7;border-color:rgba(110,170,255,.45);box-shadow:0 10px 24px rgba(0,0,0,.5);}',
    '.fe-root[data-theme="dark"] .fe-resetbtn{background:#1b2029;color:#e8eef7;}',
    '.fe-root[data-theme="dark"] .fe-selmenu{background:#1b2029;border-color:#2a3340;box-shadow:0 10px 24px rgba(0,0,0,.5);}',
    '.fe-root[data-theme="dark"] .fe-selmenu button{color:#c3cad6;}',
    '.fe-root[data-theme="dark"] .fe-selmenu button.cur{color:#7fb2ff;}',
    '.fe-root[data-theme="dark"] [data-name^="Button Group ("] > :is(' + BTN + '):hover p{color:#9fd2ff!important;}',
    '.fe-root[data-theme="dark"] [data-name="Button/Ack"]:hover > [data-name="Background"]{background-color:#2f6fd6!important;}',
    '@media (prefers-reduced-motion:reduce){.fe-root *{animation:none!important;transition:none!important;}}',
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
  function byName(scope, n) { return one(scope, '[data-name="' + n + '"]'); }
  function editing() { return !!document.querySelector('.dtstage.dt-content-editing, .dtstage.dt-editing, .dt-content-editing, .dt-editing'); }
  function idle() { return typeof window.__wembIdle === 'function' ? window.__wembIdle() : document.hidden; }
  function layoutEditing(root) { return !!(root.closest('.dt-editing') || root.classList.contains('fe-edit-layout')); }
  function load(k) { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function comma(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function fx(n, d) { var s = n.toFixed(d), i = s.indexOf('.'); var a = i < 0 ? s : s.slice(0, i), b = i < 0 ? '' : s.slice(i); return a.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + b; }
  function txt(el) { return (el && el.textContent || '').replace(/\s+/g, ' ').trim(); }
  function num(s) { return parseFloat(String(s).replace(/,/g, '')); }
  /* 사람이 고친 글자는 덮지 않는다 */
  function claimed(p) { return p.__feLast != null && p.textContent !== p.__feLast; }
  function write(p, s, flash) {
    if (!p || p === document.activeElement || claimed(p) || editing()) return;
    if (p.textContent !== s) {
      p.textContent = s;
      if (flash) { p.classList.remove('fe-tick'); void p.offsetWidth; p.classList.add('fe-tick'); }
    }
    p.__feLast = p.textContent;
  }
  function clickable(el, fn) {
    if (!el || el.__feClick) return;
    el.__feClick = 1;
    el.classList.add('fe-click');
    el.addEventListener('click', function (e) {
      if (editing()) return;
      e.stopPropagation();
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
  function placed(el) { if (el) el.classList.add('fe-place'); return el; }
  function goto(scene) {
    if (window.__gotoFemsScene) { window.__gotoFemsScene(scene); return; }
    location.href = scene + '.html' + location.search;
  }
  function toast(st, msg) {
    var t = st.toast;
    if (!t) { t = st.toast = document.createElement('div'); t.className = 'fe-toast'; st.frame.appendChild(t); }
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(st.toastT);
    st.toastT = setTimeout(function () { t.classList.remove('on'); }, 1900);
  }
  function baseOf(root) {
    var im = one(root, 'img[src]'), s = im ? im.getAttribute('src') : '';
    var i = s.lastIndexOf('/');
    return i >= 0 ? s.slice(0, i + 1) : 'src/fems/';
  }
  function flatKids(el) {
    var out = [];
    kids(el).forEach(function (c) { if (getComputedStyle(c).display === 'contents') out = out.concat(flatKids(c)); else out.push(c); });
    return out;
  }

  /* ══════════════════ 1. 화면 맞추기 ══════════════════
     좌표계는 1920x1080 그대로, 판 비율만큼 캔버스를 넓힌다(exW · exH). 화면 맨 위 판의 처음 자리를 px 로 굳힌 뒤:
     바탕 · 헤더 · 상단 막대 · 이벤트 로그는 폭을 늘리고 안쪽 부품을 제자리(왼 · 가운데 · 오른)에 붙인다,
     3D 장면 · 이름표는 가운데, 오른쪽 판은 오른쪽 끝, 좌우 판은 아래로 늘어난다, 이벤트 로그는 바닥, 팝업은 한가운데. */
  function stretchRow(el, w0, ex) {
    /* 폭을 늘리고, 안쪽 부품은 처음 가운데 위치로 왼(0) · 가운데(ex/2) · 오른(ex) 에 붙인다. 폭을 거의 다 덮는 판은 같이 늘린다 */
    if (!el.__row) {
      el.__row = flatKids(el).map(function (c) {
        var cx = c.offsetLeft + c.offsetWidth / 2;
        return { el: placed(c), w: c.offsetWidth, k: c.offsetWidth >= w0 * 0.9 ? 'fill' : cx < w0 / 3 ? 'l' : cx > w0 * 2 / 3 ? 'r' : 'c' };
      });
    }
    el.style.width = (w0 + ex) + 'px';
    el.__row.forEach(function (r) {
      if (r.k === 'fill') { r.el.style.width = (r.w + ex) + 'px'; if (r.el.__sub) stretchRow(r.el, r.w, ex); }
      else { r.el.__fx = r.k === 'r' ? ex : r.k === 'c' ? ex / 2 : 0; place(r.el); }
    });
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
    st.S = 1; st.exW = 0; st.exH = 0;
    var tops = flatKids(frame);
    var rects = tops.map(function (c) { return { el: c, x: c.offsetLeft, y: c.offsetTop, w: c.offsetWidth, h: c.offsetHeight }; });
    rects.forEach(function (r) {
      var cs = getComputedStyle(r.el);
      var s = r.el.style;
      if (cs.position !== 'absolute') { s.position = 'absolute'; }
      s.left = r.x + 'px'; s.top = r.y + 'px'; s.right = 'auto'; s.bottom = 'auto'; s.margin = '0'; s.translate = ''; s.transform = 'none';
      s.width = r.w + 'px'; s.height = r.h + 'px';
    });
    st.boxes = rects;
    var acts = [];
    rects.forEach(function (r) {
      var n = nm(r.el), el = r.el;
      if (n === 'Background') {
        acts.push({ el: el, k: 'bg', w0: r.w, h0: r.h, parts: flatKids(el).map(function (c) { return { el: c, n: nm(c), w: c.offsetWidth, h: c.offsetHeight }; }) });
      } else if (n === 'Header' || n === 'Top Bar') acts.push({ el: el, k: 'row', w0: r.w });
      else if (n === 'Side Panel (Right)') acts.push({ el: placed(el), k: 'rightTall', h0: r.h });
      else if (n === 'Side Panel (Left)') acts.push({ el: el, k: 'tall', h0: r.h });
      else if (n === 'Event Log') acts.push({ el: placed(el), k: 'log', w0: r.w });
      else if (el.classList.contains('sh-popmount')) acts.push({ el: placed(el), k: 'center' });
      /* 팝업 뒤 막 — 넓힌 캔버스 전체(아래 이벤트 로그 줄까지)를 덮는다 */
      else if (el.classList.contains('sh-dim')) acts.push({ el: el, k: 'dim' });
    });
    /* 좌우 판 — 판 몸체와 그 안의 마지막(가장 긴) 위젯만 아래로 늘린다 */
    acts.forEach(function (a) {
      if (a.k !== 'tall' && a.k !== 'rightTall') return;
      a.grow = all(a.el, '[data-name="Panel Body"], [data-name="Column"], [data-name="Widget Column"]').map(function (d) { return { el: d, h0: d.offsetHeight }; });
      var mm = byName(a.el, 'Widget/Mini Map');
      if (mm) {
        a.grow.push({ el: mm, h0: mm.offsetHeight });
        var b = byName(mm, 'Body'), ic = byName(mm, 'Info Card');
        if (b) a.grow.push({ el: b, h0: b.offsetHeight });
        if (ic) a.grow.push({ el: ic, h0: ic.offsetHeight });
      }
    });
    st.acts = acts;
    function layoutFn() {
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
      acts.forEach(function (a) {
        var el = a.el;
        if (a.k === 'bg') {
          el.style.width = (a.w0 + exW) + 'px'; el.style.height = (a.h0 + exH) + 'px';
          a.parts.forEach(function (p) {
            if (p.n === 'Base') { p.el.style.width = (p.w + exW) + 'px'; p.el.style.height = (p.h + exH) + 'px'; }
            else { p.el.__fx = exW / 2; p.el.__fy = exH / 2; place(p.el); }
          });
        } else if (a.k === 'row') stretchRow(el, a.w0, exW);
        else if (a.k === 'rightTall') { el.__fx = exW; place(el); el.style.height = (a.h0 + exH) + 'px'; }
        else if (a.k === 'tall') el.style.height = (a.h0 + exH) + 'px';
        else if (a.k === 'log') {
          el.__fy = exH; place(el);
          stretchRow(el, a.w0, exW);
          var bar = byName(el, 'Bar (Collapsed)');
          if (bar) stretchRow(bar, a.w0, exW);
          var x = one(el, '.fe-evx > [data-node-id]');
          if (x) { stretchRow(x, a.w0, exW); var tb = byName(x, 'Toolbar'); if (tb) stretchRow(tb, a.w0, exW); }
        } else if (a.k === 'center') { el.__fx = exW / 2; el.__fy = exH / 2; place(el); }
        else if (a.k === 'dim') { el.style.left = '0'; el.style.top = '0'; el.style.width = VW + 'px'; el.style.height = VH + 'px'; }
        (a.grow || []).forEach(function (g) { g.el.style.height = (g.h0 + exH) + 'px'; });
      });
      (st.onLayout || []).forEach(function (f) { try { f(); } catch (e) { } });
    }
    var rsT = 0;
    function relayout() {
      root.classList.add('fe-resizing');
      layoutFn();
      clearTimeout(rsT);
      rsT = setTimeout(function () { root.classList.remove('fe-resizing'); }, 140);
    }
    st.onLayout = [];
    layoutFn();
    st.layout = layoutFn;
    if (window.ResizeObserver) { st.ro = new ResizeObserver(relayout); st.ro.observe(root); }
    else { st.onResize = relayout; window.addEventListener('resize', relayout); }
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('fe-live'); }); });
  }

  /* ══════════════════ 2. 오늘 기준 날짜 ══════════════════
     표의 날짜(YYYY-MM-DD)를 시안 기준일 2026-11-18 이 오늘이 되게 하루 단위로 옮긴다(날짜 사이 간격 그대로).
     주간 차트의 'N일' 눈금도 오늘로 끝나게, 장비 설치일은 그대로 둔다. */
  function dayShift() {
    var n = new Date();
    return Math.round((Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()) - ORIG_DAY) / 86400000);
  }
  function shiftDates(scope) {
    var k = dayShift();
    all(scope, 'p').forEach(function (p) {
      if (p.__feShift || p.closest('[data-name="Asset Info"]')) return;
      var s = p.textContent;
      if (!/\b20\d\d-\d\d-\d\d\b/.test(s)) return;
      p.__feShift = 1;
      if (!k) return;
      var o = s.replace(/\b(20\d\d)-(\d\d)-(\d\d)\b/g, function (m, y, mo, dd) {
        var x = new Date(Date.UTC(+y, +mo - 1, +dd) + k * 86400000);
        return x.getUTCFullYear() + '-' + p2(x.getUTCMonth() + 1) + '-' + p2(x.getUTCDate());
      });
      if (o !== s) { p.textContent = o; p.__feLast = o; }
    });
    var ax = one(scope, '[data-name="Widget/Weekly Solar Generation"] [data-name="X Axis"]');
    if (ax && k) {
      var ticks = all(ax, 'p'), today = new Date();
      ticks.forEach(function (p, i) {
        if (p.__feShift) return;
        p.__feShift = 1;
        var d = new Date(today.getTime() - (ticks.length - 1 - i) * 86400000);
        p.textContent = d.getDate() + '일'; p.__feLast = p.textContent;
      });
    }
  }

  /* ══════════════════ 3. 화면 잇기 · 팝업 ══════════════════ */
  var BTN_TO = { 'Button/System Diagram': 'diagram', 'Button/Solar': 'solar', 'Button/Power Equipment': 'event' };
  function installNav(root, st) {
    var hdr = byName(st.frame, 'Top Bar');
    all(hdr, '[data-name^="Button/"]').forEach(function (b) {
      var to = BTN_TO[nm(b)];
      if (to) clickable(b, function () { goto(to); });
      else if (nm(b) === 'Button/Report') clickable(b, function () { toast(st, '에너지 리포트를 만드는 중입니다 — 오늘 06:00 기준'); });
    });
    all(st.frame, '[data-name="Widget/Alarm Event"] [data-name="Button Group"] > *').forEach(function (b) {
      var to = BTN_TO[nm(b)];
      if (to) clickable(b, function () { goto(to); });
    });
    clickable(byName(st.frame, 'Button/User'), function () { toast(st, '운영자 · 에너지관리팀'); });
    clickable(byName(st.frame, 'Button/Logout'), function () { toast(st, '로그아웃은 시연 화면에서 막혀 있습니다'); });
    all(st.frame, '[data-name^="Label/"]').forEach(function (l, i) {
      l.style.setProperty('--i', i);
      clickable(l, function () { goto('equipment'); });
    });
    /* 팝업 닫기 → 종합 현황 */
    all(st.frame, '.sh-popmount [data-name="Button/Close"]').forEach(function (b) { clickable(b, function () { goto('main'); }); });
    /* 막을 눌러도 닫힌다(패널편집 중엔 막지 않게 clickable 이 알아서 건너뛴다) */
    all(st.frame, '.sh-dim').forEach(function (d) { clickable(d, function () { goto('main'); }); });
  }

  /* ══════════════════ 3-1. 실시간 시계 ══════════════════ */
  var WD = ['일', '월', '화', '수', '목', '금', '토'];
  function installClock(root, st) {
    var hdr = byName(st.frame, 'Header'), grp = hdr && one(hdr, ':scope > [data-name="Button Group"]');
    if (!grp || one(grp, '.fe-clock')) return;
    var c = document.createElement('div');
    c.className = 'fe-clock';
    c.setAttribute('data-name', 'Clock');
    c.innerHTML = '<i></i><span class="fe-cd"></span><b></b><span class="fe-ct"></span>';
    grp.appendChild(c);
    var cd = c.children[1], ct = c.children[3];
    function draw() {
      var d = new Date();
      cd.textContent = d.getFullYear() + '.' + p2(d.getMonth() + 1) + '.' + p2(d.getDate()) + ' (' + WD[d.getDay()] + ')';
      ct.textContent = p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds());
    }
    draw();
    /* 묶음 오른쪽엔 시계 들어갈 자리가 없다(묶음 끝 1737 → 헤더 안쪽 끝 1890).
       시계 오른끝이 헤더 오른쪽 여백 30px 에 닿도록 묶음을 그만큼 왼쪽으로 민다(__sx 는 stretchRow 의 오른쪽 붙임 __fx 와 더해진다) */
    function fitClock() {
      var room = BASE_W - 30 - (grp.offsetLeft + grp.offsetWidth + 26);
      grp.__sx = Math.min(0, room - c.offsetWidth);
      place(grp);
    }
    fitClock();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitClock);
    /* 초가 바뀌는 순간에 맞춘다 */
    st.timers.push(setTimeout(function () { draw(); st.timers.push(setInterval(draw, 1000)); }, 1000 - Date.now() % 1000));
  }

  /* ══════════════════ 3-2. 알림 띠(Ticker) ══════════════════
     원본은 띠 오른쪽에 치우친 본문 글자 한 줄이었다(Message Wrap padding-left 167). 띠 가운데에 메시지처럼 놓고
     시스템 상태(원본 글자 — 패널편집으로 고칠 수 있음)와 최근 경보(이벤트 표와 같은 값)를 6초마다 번갈아 올린다. */
  var TK_ALARMS = [
    { ic: 'indicator.svg', lv: '고위험', cls: '', tx: 'Z동 INV-Z03 (125kW) · 계통 과전압으로 운전 정지', ago: 2 },
    { ic: 'indicator-3.svg', lv: '경미', cls: 'wa', tx: 'A동 STR-A12 · 스트링 전류 편차 15% 초과', ago: 9 },
    { ic: 'indicator-3.svg', lv: '경미', cls: 'wa', tx: 'I동 MTR-I01 · 역률 0.85 미만 지속', ago: 23 },
  ];
  function installTicker(root, st) {
    var wrap = one(st.frame, '[data-name="Ticker"] > [data-name="Message Wrap"]');
    var p = wrap && one(wrap, ':scope > p');
    if (!p || one(wrap, '.fe-tk')) return;
    var B = baseOf(root), born = Date.now();
    var hm = function (d) { return p2(d.getHours()) + ':' + p2(d.getMinutes()); };
    var s0 = document.createElement('div');
    s0.className = 'fe-tk fe-on';
    s0.innerHTML = '<img alt="" src="' + B + 'indicator-4.svg">';
    s0.appendChild(p);
    var t0 = document.createElement('span'); t0.className = 'fe-tk-tm'; s0.appendChild(t0);
    wrap.appendChild(s0);
    var slides = [s0];
    TK_ALARMS.forEach(function (a) {
      var s = document.createElement('div');
      s.className = 'fe-tk';
      s.innerHTML = '<img alt="" src="' + B + a.ic + '"><span class="fe-tk-lv ' + a.cls + '">' + a.lv + '</span><span class="fe-tk-tx">' + a.tx + '</span><span class="fe-tk-tm"></span>';
      s.__ago = a.ago;
      wrap.appendChild(s);
      slides.push(s);
    });
    function stamp() {
      var now = new Date();
      t0.textContent = hm(now) + ' 기준';
      slides.slice(1).forEach(function (s) { s.lastChild.textContent = hm(new Date(born - s.__ago * 60000)); });
    }
    stamp();
    var cur = 0;
    function show(i) {
      if (i === cur) return;
      var a = slides[cur], b = slides[i];
      a.classList.remove('fe-on'); a.classList.add('fe-out');
      b.style.transition = 'none'; b.classList.remove('fe-out'); void b.offsetWidth; b.style.transition = '';
      b.classList.add('fe-on');
      st.timers.push(setTimeout(function () { a.classList.remove('fe-out'); }, 650));
      cur = i;
    }
    st.timers.push(setInterval(function () {
      stamp();
      /* 패널편집 중엔 원본 글자(상태 메시지)에 멈춰 고칠 수 있게 한다 */
      if (root.closest('.dt-content-editing') || document.querySelector('.dt-content-editing')) { show(0); return; }
      if (idle()) return;
      show((cur + 1) % slides.length);
    }, 6000));
  }

  /* ══════════════════ 3-3. 팝업 받침 ══════════════════ */
  function installPopBed(root, st) {
    var S0 = st.S || 1;
    all(st.frame, '.sh-popmount').forEach(function (m) {
      if (one(m, ':scope > .fe-popbed')) return;
      var f = one(m, '.sh-pop > [data-node-id]');
      var card = f && (one(f, ':scope > [data-name="Background Glow"]') || one(f, ':scope > [data-name="Background"]'));
      if (!card) return;
      var mr = m.getBoundingClientRect(), cr = card.getBoundingClientRect();
      var base = one(card, ':scope > [data-name="Base"]');
      var rad = parseFloat(getComputedStyle(card).borderTopLeftRadius) || (base && parseFloat(getComputedStyle(base).borderTopLeftRadius)) || 18;
      var bed = document.createElement('div');
      bed.className = 'fe-popbed';
      bed.style.left = ((cr.left - mr.left) / S0) + 'px'; bed.style.top = ((cr.top - mr.top) / S0) + 'px';
      bed.style.width = (cr.width / S0) + 'px'; bed.style.height = (cr.height / S0) + 'px';
      bed.style.borderRadius = rad + 'px';
      m.insertBefore(bed, m.firstChild);
    });
  }

  /* ══════════════════ 4. 3D 조작 · 판 접기 ══════════════════ */
  function installView(root, st) {
    var sc = byName(st.frame, '3D Scene'), lb = byName(st.frame, 'Building Labels');
    if (!sc) return;
    var v = st.view = { x: 0, y: 0, z: 1, r: 0 };
    var needle = byName(st.frame, 'Needle');
    function apply() {
      var t = 'translate(' + v.x + 'px,' + v.y + 'px) scale(' + v.z + ') rotate(' + v.r + 'deg)';
      sc.style.transform = t;
      if (lb) { lb.style.transform = t; lb.style.transition = 'transform .7s ' + EASE; }
      if (needle) needle.style.rotate = (-v.r) + 'deg';
    }
    var ACT = {
      'Button/Up': function () { v.y += 40; }, 'Button/Down': function () { v.y -= 40; },
      'Button/Left': function () { v.x += 50; }, 'Button/Right': function () { v.x -= 50; },
      'Button/Zoom In': function () { v.z = clamp(+(v.z + 0.12).toFixed(2), 0.7, 1.6); }, 'Button/Zoom Out': function () { v.z = clamp(+(v.z - 0.12).toFixed(2), 0.7, 1.6); },
      'Button/Rotate Left': function () { v.r = clamp(v.r - 6, -18, 18); }, 'Button/Rotate Right': function () { v.r = clamp(v.r + 6, -18, 18); },
      'Button/Home': function () { v.x = 0; v.y = 0; v.z = 1; v.r = 0; },
      'Button/Zoom': function () { v.z = v.z > 1.05 ? 1 : 1.25; v.x = 0; v.y = 0; },
    };
    Object.keys(ACT).forEach(function (k) {
      all(st.frame, '[data-name="' + k + '"]').forEach(function (b) { clickable(b, function () { ACT[k](); apply(); }); });
    });
  }
  function installFold(root, st) {
    var saved = load(K_FOLD);
    [['Side Panel (Left)', -1], ['Side Panel (Right)', 1]].forEach(function (d) {
      var p = byName(st.frame, d[0]);
      if (!p) return;
      var btn = one(p, '[data-name="Button/Collapse"]');
      if (!btn) return;
      p.classList.add('fe-panel'); placed(p); placed(btn);
      btn.classList.add('fe-foldbtn');
      /* 판 기준 단추 자리(1920 좌표) — 펼친 상태에서 한 번 잰다 */
      var S0 = st.S || 1, pr = p.getBoundingClientRect(), br = btn.getBoundingClientRect(), EDGE = 12;
      var geo = { bl: (br.left - pr.left) / S0 - (btn.__sx || 0), bw: br.width / S0 };
      function set(shut, quick) {
        var w = p.offsetWidth;
        if (quick) { p.style.transition = 'none'; btn.style.transition = 'none'; }
        p.classList.toggle('fe-shut', shut);
        p.__sx = shut ? d[1] * w : 0;
        /* 단추는 판과 함께 밀려 나가다가 화면 가장자리 12px 안쪽에서 멈춘다(판 끝에 붙어 따라간다 — 예전엔 제자리에 혼자 남았다).
           왼쪽 판: 단추 왼끝 = bl - w + sx = 12 → sx = 12 + w - bl · 오른쪽 판: 단추 오른끝 = w + bl + bw + sx = w - 12 → sx = -12 - bl - bw */
        btn.__sx = !shut ? 0 : d[1] < 0 ? EDGE + w - geo.bl : -EDGE - geo.bl - geo.bw;
        /* 화살표 = 누르면 판이 갈 방향. 원본 그림은 왼쪽 판 », 오른쪽 판 « (판 안쪽을 가리켜 거꾸로 읽혔다, 사용자 지시 11-19)
           → 펼침: 왼쪽 « · 오른쪽 » (접으러 바깥으로) / 접힘: 왼쪽 » · 오른쪽 « (펴러 안쪽으로) */
        btn.style.rotate = shut ? '' : '180deg';
        place(p); place(btn);
        if (quick) requestAnimationFrame(function () { p.style.transition = ''; btn.style.transition = ''; });
        saved[d[0]] = shut; save(K_FOLD, saved);
      }
      clickable(btn, function () { set(!p.classList.contains('fe-shut')); });
      set(!!saved[d[0]], true);
    });
  }

  /* ══════════════════ 5. 이벤트 로그 펼침 · 등급 칩 · 확인 ══════════════════ */
  function rowsOf(scope) {
    /* 표 줄 = 등급 배지 하나 + 칸 줄 하나. 배지와 칸 줄은 다른 칸(열)에 쌓여 있어 위치(세로)로 짝을 짓는다 */
    var badges = all(scope, '[data-name^="Badge/"]:not([data-name$=" Wrap"])').filter(function (b) { return !b.closest('.fe-chartmenu') && b.offsetHeight; });
    var cells = all(scope, '[data-name^="Row/"]:not([data-name$=" Wrap"]), [data-name="Cells"]').filter(function (c) { return c.offsetHeight && c.offsetHeight < 30; });
    var out = [];
    badges.forEach(function (b) {
      var br = b.getBoundingClientRect(), cy = br.top + br.height / 2, best = null, bd = 1e9;
      cells.forEach(function (c) { var r = c.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - cy); if (d < bd) { bd = d; best = c; } });
      var g = nm(b).split('/')[1] || '';
      out.push({ badge: b, cells: bd < 24 ? best : null, grade: g });
    });
    return out;
  }
  var GRADE_OF = { 'Count/All': '', 'Count/Critical': 'Critical', 'Count/Major': 'Major', 'Count/Minor': 'Minor', 'Count/Warning': 'Warning', 'Count/Normal': 'Normal' };
  function installGrades(st, scope) {
    var counts = all(scope, '[data-name^="Count/"]').filter(function (c) { return GRADE_OF[nm(c)] != null; });
    if (!counts.length) return;
    var cur = null;
    counts.forEach(function (c) {
      clickable(c, function () {
        var g = GRADE_OF[nm(c)];
        cur = (cur === g || g === '') ? null : g;
        counts.forEach(function (x) { x.classList.toggle('fe-on', cur != null && GRADE_OF[nm(x)] === cur); });
        rowsOf(scope).forEach(function (r) {
          var on = cur == null || r.grade === cur;
          [r.badge, r.cells].forEach(function (e) { if (e) { e.classList.add('fe-row'); e.classList.toggle('fe-dim', !on); } });
        });
        if (cur) { var n = rowsOf(scope).filter(function (r) { return r.grade === cur; }).length; toast(st, (txt(one(c, '[data-name="Label"]')) || cur) + ' ' + n + '건'); }
      });
    });
    var ack = one(scope, '[data-name="Button/Ack"]');
    clickable(ack, function () {
      scope.classList.add('fe-acked');
      var all1 = one(scope, '[data-name="Count/All"] [data-name="Value"]');
      toast(st, '알람 ' + (all1 ? txt(all1) : '') + '건을 확인했습니다');
    });
    /* 표 줄 누르기 → 장비 상세(장비 상세 팝업 안의 줄은 그대로) */
    if (!scope.closest('[data-name^="Popup/Equipment"]')) {
      rowsOf(scope).forEach(function (r) { if (r.cells) clickable(r.cells, function () { goto('equipment'); }); });
    }
  }
  function installEventLog(root, st) {
    var log = byName(st.frame, 'Event Log');
    if (!log) return;
    var bar = byName(log, 'Bar (Collapsed)');
    var F = window.FM_FRAGS && window.FM_FRAGS['event-log'];
    if (!bar || !F) return;
    if (!document.getElementById('fmx-frag-style')) {
      var s1 = document.createElement('style'); s1.id = 'fmx-frag-style'; var B0 = baseOf(root); s1.textContent = F.cssRaw ? F.cssRaw.split('{{B}}').join(B0) : F.css; document.head.appendChild(s1);
      var s2 = document.createElement('style'); s2.id = 'fmx-frag-light-style'; s2.textContent = F.lightRaw ? F.lightRaw.split('{{B}}').join(B0) : F.light; document.head.appendChild(s2);
    }
    var host = document.createElement('div');
    host.className = 'fe-evx fe-off fe-gone fmx-root';
    host.setAttribute('data-name', 'Event Log (Expanded)');
    host.dataset.theme = root.dataset.theme || 'light';
    host.innerHTML = F.build(baseOf(root));
    log.appendChild(host);
    st.evx = host;
    /* 펼친 판 뿌리는 Figma 에서 1850x405 — 담는 칸을 꽉 채우게 */
    var fr = one(host, ':scope > [data-node-id]');
    if (fr) { fr.style.width = '100%'; fr.style.height = '405px'; fr.style.position = 'relative'; }
    st.themeSync = function () { host.dataset.theme = root.dataset.theme || 'light'; };
    shiftDates(host);
    var open = false;
    function set(v) {
      open = v;
      log.classList.toggle('fe-evopen', v);
      if (v) { host.classList.remove('fe-gone'); requestAnimationFrame(function () { host.classList.remove('fe-off'); }); }
      else { host.classList.add('fe-off'); setTimeout(function () { if (!open) host.classList.add('fe-gone'); }, 600); }
    }
    clickable(one(bar, '[data-name="Button/Expand"]'), function () { set(true); });
    clickable(one(host, '[data-name="Button/Collapse"]'), function () { set(false); });
    installGrades(st, bar);
    installGrades(st, host);
    if (st.layout) st.layout();
  }

  /* ══════════════════ 6. 계통도 고르기 ══════════════════ */
  function installSelect(root, st) {
    var sel = one(st.frame, '.sh-popmount [data-name="Select"]');
    if (!sel) return;
    var val = byName(sel, 'Value'), title = one(st.frame, '.sh-popmount [data-name="Title Group"] p');
    var opts = ['I동', 'F동', 'Z동', 'B동', 'Q동'];
    if (getComputedStyle(sel).position === 'static') sel.style.position = 'relative';
    var menu = document.createElement('div');
    menu.className = 'fe-selmenu';
    sel.appendChild(menu);
    function render() { var c = txt(val); menu.innerHTML = opts.map(function (o) { return '<button type="button"' + (o === c ? ' class="cur"' : '') + '>' + esc(o) + '</button>'; }).join(''); }
    sel.addEventListener('click', function (e) {
      if (editing()) return;
      e.stopPropagation();
      var b = e.target.closest('.fe-selmenu button');
      if (b) {
        val.textContent = b.textContent; val.__feLast = val.textContent;
        if (title) { title.textContent = title.textContent.replace(/\[[^\]]*\]/, '[' + b.textContent + ']'); title.__feLast = title.textContent; }
        menu.classList.remove('open'); sel.classList.remove('fe-open');
        toast(st, b.textContent + ' 계통도를 불러왔습니다');
        return;
      }
      render();
      sel.classList.toggle('fe-open', !menu.classList.contains('open'));
      menu.classList.toggle('open');
    });
    sel.classList.add('fe-click');
    st.onSelDoc = function (e) { if (!sel.contains(e.target)) { menu.classList.remove('open'); sel.classList.remove('fe-open'); } };
    document.addEventListener('pointerdown', st.onSelDoc, true);
    all(st.frame, '.sh-popmount [data-name^="Symbol/"]:not([data-name$=" Wrap"])').forEach(function (s) {
      clickable(s, function () { toast(st, nm(s).replace('Symbol/', '') + ' · 상태 정상'); });
    });
  }

  /* ══════════════════ 7. 라이브 값 ══════════════════ */
  function installLive(root, st) {
    var F = st.frame;
    /* 전력 사용량 · 실시간 발전량 — 오늘 사용량은 조금씩 쌓이고, 금월은 따라 오른다 */
    var today = byName(F, 'Value/Today'), month = byName(F, 'Value/This Month'), gen = one(byName(F, 'Widget/Realtime Generation'), '[data-name="Value"]');
    var u = { t: today ? num(txt(today)) : 0, m: month ? num(txt(month)) : 0, g: gen ? num(txt(gen)) : 0 };
    /* 기상 */
    var W = all(F, '[data-name^="Measurement/"]').map(function (m) {
      var p = one(m, '[data-name="Value"]'); if (!p) return null;
      var s = txt(p), d = (s.split('.')[1] || '').length, v0 = num(s);
      var amp = /Humidity/.test(nm(m)) ? 0.6 : /Temperature/.test(nm(m)) ? 0.25 : /Wind/.test(nm(m)) ? 0.4 : 9;
      return { p: p, v0: v0, v: v0, d: d, amp: amp };
    }).filter(Boolean);
    /* 건물별 발전량 막대(가로) · 주간 막대(오늘) */
    var plant = all(F, '[data-name="Widget/Plant Generation"] [data-name="Data"] > *');
    plant.forEach(function (b) { b.classList.add('fe-bar'); b.style.transformOrigin = '0 50%'; });
    var week = flatKids(one(F, '[data-name="Widget/Weekly Solar Generation"] [data-name="Data"]') || document.createElement('i'));
    var todayBar = week[week.length - 1];
    if (todayBar) { todayBar.classList.add('fe-bar'); todayBar.style.transformOrigin = '50% 100%'; }
    var leg = one(F, '[data-name="Widget/Weekly Solar Generation"] [data-name="Measurement"] [data-name="Value"]');
    /* 3D 이름표 kWh */
    var labels = all(F, '[data-name^="Label/"] p').map(function (p) {
      var m = /^(.*?)(\d+)kWh$/.exec(txt(p)); return m ? { p: p, head: m[1], v: +m[2] } : null;
    }).filter(Boolean);
    var gen0 = labels.reduce(function (a, l) { return a + l.v; }, 0) || 1;
    function tick() {
      if (idle() || editing()) return;
      var dg = rnd(-12, 12);
      u.g = clamp(u.g + dg, 540, 640);
      if (gen) write(gen, comma(u.g), true);
      var inc = rnd(1.5, 4.5);
      u.t += inc; u.m += inc / 1000;
      if (today) write(today, comma(u.t), true);
      if (month) write(month, u.m.toFixed(1));
      W.forEach(function (w) { w.v = clamp(w.v + rnd(-w.amp, w.amp) * 0.5, w.v0 - w.amp * 2, w.v0 + w.amp * 2); write(w.p, w.d ? w.v.toFixed(w.d) : String(Math.round(w.v))); });
      /* 이름표 — 실시간 발전량에 비례해 조금씩 쌓인다 */
      var add = u.g / 3600 * 4;
      labels.forEach(function (l) { l.v += add * l.v / gen0 * rnd(0.7, 1.3); write(l.p, l.head + Math.round(l.v) + 'kWh'); });
      var sum = labels.reduce(function (a, l) { return a + l.v; }, 0);
      if (leg) write(leg, comma(sum) + ' ', false);
      if (leg && leg.firstChild && leg.firstChild.nodeType === 3) { /* 글자 구간(숫자 + kWh)을 지키려고 첫 구간만 바꾼다 */ }
      plant.forEach(function (b) { b.style.scale = rnd(0.97, 1.03).toFixed(3) + ' 1'; });
      if (todayBar) todayBar.style.scale = '1 ' + clamp(sum / gen0, 1, 1.25).toFixed(3);
    }
    /* 주간 범례 값은 '2,481 kWh' 처럼 크기가 다른 두 구간 — 숫자만 갈아 끼운다 */
    if (leg) {
      var spans = leg.querySelectorAll('span');
      if (spans.length) leg = spans[0];
    }
    st.timers.push(setInterval(tick, 3000));
    /* 태양광 인버터 표 · 계통 지표 · 미터 카드 — 숫자 칸만 살짝 흔들린다 */
    var jitter = [];
    all(F, '.sh-popmount p').forEach(function (p) {
      var s = txt(p);
      if (p.closest('[data-name^="Th/"], [data-name="Header Row"], [data-name="Header Labels"], [data-name="X Axis Labels Wrap"], [data-name="Y Tick Row"], [data-name^="Count/"], [data-name="Asset Info"], [data-name^="Tag/"]')) return;
      var t = p.closest('[data-name^="Td/"]') ? nm(p.closest('[data-name^="Td/"]')) : nm(p);
      if (/Plant|No$|Status|Frequency|Power Factor|Occurred|Building|Device|Type|Message|Title|Label|Key/.test(t)) return;
      if (!/^[\d.,]+(V|A| W)?$/.test(s)) return;
      var unit = (/(V|A| W)$/.exec(s) || [''])[0], body = s.slice(0, s.length - unit.length);
      if (body.indexOf(',') >= 0 && body.split(',').length === 3 && body.indexOf('.') < 0 && !/^\d{1,3}(,\d{3})+$/.test(body)) {
        jitter.push({ p: p, kind: 'trio', v0: body.split(',').map(Number), unit: unit }); return;
      }
      var d = (body.split('.')[1] || '').length, v0 = num(body);
      if (!isFinite(v0) || v0 === 0) return;
      var isTotal = /Total Generation|Daily Generation/.test(t);
      jitter.push({ p: p, kind: isTotal ? 'grow' : 'jit', v0: v0, v: v0, d: d, unit: unit, comma: /,/.test(body) || v0 >= 1000 });
    });
    function jtick() {
      if (idle() || editing()) return;
      jitter.forEach(function (j) {
        if (j.kind === 'trio') { write(j.p, j.v0.map(function (v) { return Math.round(v + rnd(-1.4, 1.4)); }).join(',') + j.unit); return; }
        if (j.kind === 'grow') j.v += j.v0 * rnd(0.00002, 0.00008) + (j.d ? 0.02 : 0);
        else j.v = clamp(j.v + j.v0 * rnd(-0.006, 0.006), j.v0 * 0.97, j.v0 * 1.03);
        var s = j.comma ? fx(j.v, j.d) : j.v.toFixed(j.d);
        write(j.p, s + j.unit);
      });
    }
    st.timers.push(setInterval(jtick, 2400));
  }

  /* ══════════════════ 8. S·P·Q 전력현황 — 인라인 SVG 로 다시 그린다 ══════════════════
     Figma 가 내보낸 곡선 그림(img 6장)과 같은 자리 · 같은 색(유효 #F81538 · 무효 #0DFF00 · 피상 #FFBC04, 아래로 옅어지는 영역).
     24시간 값이 숨 쉬듯 조금씩 바뀌고, 범례(피상 · 유효 · 무효)를 누르면 그 곡선을 끄고 켠다. */
  var SPQ_P = [182, 176, 171, 169, 174, 196, 248, 342, 468, 512, 528, 534, 486, 521, 538, 529, 516, 498, 402, 318, 262, 228, 204, 191];
  var SPQ_Q = [62, 60, 58, 58, 60, 66, 82, 112, 146, 158, 162, 165, 151, 160, 166, 163, 159, 154, 128, 104, 88, 77, 70, 65];
  function installSpq(root, st) {
    var wd = one(st.frame, '[data-name="Widget/SPQ Power Status"]');
    if (!wd) return;
    var imgs = all(wd, '[data-name^="Data/"]');
    if (!imgs.length) return;
    /* 곡선 자리 — 0 눈금 ~ 600 눈금 */
    var lc = byName(wd, 'Line Chart');
    var t600 = one(lc, '[data-name="Y Tick Row"] p'), rows = all(lc, '[data-name="Y Tick Row"]'), t0 = rows.length ? one(rows[rows.length - 1], 'p') : null;
    if (!t600 || !t0) return;
    function boxIn(el) { var r = el.getBoundingClientRect(), w = wd.getBoundingClientRect(), S = (w.width / wd.offsetWidth) || 1; return { x: (r.left - w.left) / S, y: (r.top - w.top) / S, w: r.width / S, h: r.height / S }; }
    var b6 = boxIn(t600), b0 = boxIn(t0), x0 = boxIn(imgs[0]);
    var Y600 = b6.y + b6.h / 2, Y0 = b0.y + b0.h / 2, X0 = x0.x, XW = x0.w;
    if (getComputedStyle(wd).position === 'static') wd.style.position = 'relative';
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'fe-spq');
    svg.setAttribute('width', String(wd.offsetWidth)); svg.setAttribute('height', String(wd.offsetHeight));
    svg.setAttribute('viewBox', '0 0 ' + wd.offsetWidth + ' ' + wd.offsetHeight);
    svg.style.cssText = 'position:absolute;left:0;top:0;overflow:visible;pointer-events:none;z-index:1;';
    var uid = 'fespq' + Math.random().toString(36).slice(2, 7);
    svg.innerHTML = '<defs>'
      + '<linearGradient id="' + uid + 's" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#FFE6A2"/><stop offset="1" stop-color="#FFE6A1" stop-opacity="0"/></linearGradient>'
      + '<linearGradient id="' + uid + 'p" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#FFA2A2"/><stop offset="1" stop-color="#FFA1A1" stop-opacity="0"/></linearGradient>'
      + '<linearGradient id="' + uid + 'q" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#C1FFC5"/><stop offset="1" stop-color="#C1FFC5" stop-opacity="0"/></linearGradient>'
      + '</defs>'
      + '<path data-k="S" class="a" fill="url(#' + uid + 's)"/><path data-k="P" class="a" fill="url(#' + uid + 'p)"/><path data-k="Q" class="a" fill="url(#' + uid + 'q)"/>'
      + '<path data-k="S" class="l" fill="none" stroke="#FFBC04" stroke-width="2"/><path data-k="P" class="l" fill="none" stroke="#F81538" stroke-width="2"/><path data-k="Q" class="l" fill="none" stroke="#0DFF00" stroke-width="2"/>';
    wd.appendChild(svg);
    imgs.forEach(function (im) { im.style.visibility = 'hidden'; });
    var P = SPQ_P.slice(), Q = SPQ_Q.slice();
    function X(i) { return X0 + i * XW / 23; }
    function Y(v) { return Y0 - v / 600 * (Y0 - Y600); }
    function smooth(pts) {
      var d = 'M' + pts[0][0].toFixed(2) + ' ' + pts[0][1].toFixed(2);
      for (var i = 0; i < pts.length - 1; i++) {
        var a = pts[i - 1] || pts[i], b = pts[i], c = pts[i + 1], e = pts[i + 2] || c;
        d += ' C' + (b[0] + (c[0] - a[0]) / 6).toFixed(2) + ' ' + (b[1] + (c[1] - a[1]) / 6).toFixed(2) + ' ' + (c[0] - (e[0] - b[0]) / 6).toFixed(2) + ' ' + (c[1] - (e[1] - b[1]) / 6).toFixed(2) + ' ' + c[0].toFixed(2) + ' ' + c[1].toFixed(2);
      }
      return d;
    }
    var shown = { S: true, P: true, Q: true };
    function draw() {
      var S = P.map(function (p, i) { return Math.sqrt(p * p + Q[i] * Q[i]); });
      var V = { S: S, P: P, Q: Q };
      ['S', 'P', 'Q'].forEach(function (k) {
        var pts = V[k].map(function (v, i) { return [X(i), Y(v)]; });
        var line = smooth(pts);
        svg.querySelector('path.l[data-k="' + k + '"]').setAttribute('d', line);
        svg.querySelector('path.a[data-k="' + k + '"]').setAttribute('d', line + ' L' + X(23).toFixed(2) + ' ' + Y0.toFixed(2) + ' L' + X(0).toFixed(2) + ' ' + Y0.toFixed(2) + ' Z');
        all(svg, '[data-k="' + k + '"]').forEach(function (p) { p.classList.toggle('fe-hide', !shown[k]); });
      });
    }
    draw();
    /* 숨 쉬듯 — 목표값으로 천천히 다가간다 */
    var tgtP = P.slice(), tgtQ = Q.slice(), raf = 0, last = 0;
    function retarget() { tgtP = SPQ_P.map(function (v) { return v * rnd(0.95, 1.05); }); tgtQ = SPQ_Q.map(function (v) { return v * rnd(0.93, 1.07); }); }
    function loop(t) {
      raf = requestAnimationFrame(loop);
      if (t - last < 60) return;
      last = t;
      if (idle() || editing()) return;
      var moved = false;
      for (var i = 0; i < 24; i++) {
        var dp = (tgtP[i] - P[i]) * 0.06, dq = (tgtQ[i] - Q[i]) * 0.06;
        if (Math.abs(dp) > 0.05 || Math.abs(dq) > 0.05) moved = true;
        P[i] += dp; Q[i] += dq;
      }
      if (moved) draw();
    }
    raf = requestAnimationFrame(loop);
    st.timers.push(setInterval(retarget, 3200));
    st.spqStop = function () { cancelAnimationFrame(raf); };
    var KEY = { 'Item/Apparent Power S': 'S', 'Item/Active Power P': 'P', 'Item/Reactive Power Q': 'Q' };
    Object.keys(KEY).forEach(function (n) {
      var it = byName(st.frame, n);
      clickable(it, function () { var k = KEY[n]; shown[k] = !shown[k]; it.classList.toggle('fe-off', !shown[k]); draw(); });
    });
  }

  /* ══════════════════ 9. 눌리게 — 투명한 묶음 판은 클릭을 아래로 넘긴다 ══════════════════ */
  function transparentBox(e) {
    var tag = e.tagName;
    if (tag === 'IMG' || tag === 'P' || tag === 'SPAN' || tag === 'INPUT' || tag === 'BUTTON' || tag === 'CANVAS' || tag === 'svg' || tag === 'TEXTAREA') return false;
    if (e.classList.contains('fe-click') || e.classList.contains('fe-chartbtn') || e.classList.contains('fe-chartmenu') || e.classList.contains('fe-selmenu') || e.classList.contains('fe-resetbtn') || e.classList.contains('fe-mv') || e.classList.contains('fe-evx')) return false;
    var c = getComputedStyle(e);
    var bg = c.backgroundColor;
    if (c.backgroundImage !== 'none' || (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent')) return false;
    if (parseFloat(c.borderTopWidth) || parseFloat(c.borderLeftWidth) || parseFloat(c.borderRightWidth) || parseFloat(c.borderBottomWidth)) return false;
    if (c.boxShadow !== 'none' || (c.backdropFilter && c.backdropFilter !== 'none')) return false;
    return true;
  }
  function passThrough(scope) {
    if (!scope) return;
    var els = all(scope, '*').filter(function (e) { return !e.__pt; });
    var prev = scope.style.pointerEvents;
    scope.style.pointerEvents = 'auto';
    var keep = els.filter(function (e) { return getComputedStyle(e).pointerEvents === 'none'; });
    els.forEach(function (e) {
      e.__pt = 1;
      if (keep.indexOf(e) >= 0 || e.closest('svg, .fe-chost, .fe-chartmenu, .fe-selmenu')) return;
      e.style.pointerEvents = transparentBox(e) ? 'none' : 'auto';
    });
    scope.style.pointerEvents = prev;
  }

  /* ══════════════════ 10. 차트 바꾸기(패널편집) ══════════════════ */
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
    el.className = 'fe-chart';
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
        var cw = w - L - R, NT = cw > 300 ? 4 : cw > 150 ? 3 : 2, SEC = cw > 300;
        for (var tl = 0; tl < NT; tl++) {
          var tx = L + cw * (tl + 0.5) / NT;
          var tt = new Date(d0.getTime() - (NT - 1 - tl) * (N / NT) * STEP);
          s += '<text class="ax" x="' + tx.toFixed(1) + '" y="' + (h - 1) + '" text-anchor="middle">' + p2(tt.getHours()) + ':' + p2(tt.getMinutes()) + (SEC ? ':' + p2(tt.getSeconds()) : '') + '</text>';
        }
        s += '<clipPath id="fec' + spec.uid + '"><rect x="' + L + '" y="0" width="' + (w - L - R) + '" height="' + h + '"/></clipPath><g clip-path="url(#fec' + spec.uid + ')">';
        data.forEach(function (a, si) {
          var col = spec.series[si][1];
          var pts = a.map(function (v, i) { return X(i).toFixed(1) + ',' + Y(v).toFixed(1); }).join(' ');
          if (spec.k === 'area' || si === 0) {
            s += '<defs><linearGradient id="feg' + spec.uid + si + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + col + '" stop-opacity="' + (spec.k === 'area' ? .4 : .18) + '"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></linearGradient></defs>';
            s += '<polygon fill="url(#feg' + spec.uid + si + ')" points="' + X(0).toFixed(1) + ',' + (h - B) + ' ' + pts + ' ' + X(N - 1).toFixed(1) + ',' + (h - B) + '"/>';
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
        + '<defs><linearGradient id="fegg' + spec.uid + '" x1="0" x2="1"><stop offset="0" stop-color="#2a7ca0"/><stop offset="1" stop-color="' + spec.c + '"/></linearGradient></defs>'
        + '<path d="M8 52a42 42 0 0 1 84 0" fill="none" stroke="rgba(142,166,179,.2)" stroke-width="8"/>'
        + '<path class="arc" d="M8 52a42 42 0 0 1 84 0" fill="none" stroke="url(#fegg' + spec.uid + ')" stroke-width="8" stroke-dasharray="0 ' + LEN.toFixed(1) + '"/>'
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
    var rot = ((h - 203 + 540) % 360) - 180;
    root.style.setProperty('--fe-chue', (Math.abs(rot) < 3 ? 0 : Math.round(rot)) + 'deg');
  }
  var FC = { bl: '#3d8bff', cy: '#29c4f0', gn: '#34d28d', ye: '#ffbc04', or: '#fd8004', re: '#f81538', gr: '#8f9cb4', vi: '#7b61ff' };
  function specsFor() {
    return {
      'Widget/Plant Generation': [
        { k: 'hbar', t: '건물별 금일 발전량', unit: 'kWh', cats: ['생산1동', '생산2동', '본관', '물류동'], vals: [799, 274, 615, 793], max: 900, c: FC.bl },
        { k: 'donut', t: '건물별 발전 비율', parts: [['생산1동', FC.bl, 799], ['생산2동', FC.cy, 274], ['본관', FC.vi, 615], ['물류동', FC.gn, 793]] },
        { k: 'gauge', t: '금일 발전 목표 달성률', unit: '%', v: [78.4, 0.6], max: 100, c: FC.gn, dec: 1 },
      ],
      'Widget/Weekly Solar Generation': [
        { k: 'bar', t: '일별 태양광 발전량', unit: 'kWh', cats: ['월', '화', '수', '목', '금', '토', '오늘'], vals: [2712, 1184, 2935, 2804, 2598, 2867, 2481], max: 3000, c: FC.bl },
        { k: 'line', t: '실시간 발전 출력', unit: 'kW', dec: 0, series: [['출력', FC.bl, 598, 10], ['예측', FC.gr, 610, 4]], lo: 400, hi: 800 },
        { k: 'area', t: '수평 일사량 추이', unit: 'W/m²', dec: 0, series: [['수평일사', FC.ye, 412, 9], ['경사일사', FC.or, 528, 9]], lo: 200, hi: 700 },
      ],
      'Widget/Weather': [
        { k: 'line', t: '모듈 · 대기 온도', unit: '℃', dec: 1, series: [['모듈온도', FC.or, 27.6, 0.3], ['대기온도', FC.cy, 12.4, 0.2]], lo: 0, hi: 40 },
        { k: 'gauge', t: '모듈 온도', unit: '℃', v: [27.6, 0.3], max: 80, c: FC.or, dec: 1 },
        { k: 'area', t: '일사량 추이', unit: 'W/m²', dec: 0, series: [['경사일사', FC.ye, 528, 10]], lo: 200, hi: 800 },
      ],
      'Widget/Power Usage': [
        { k: 'line', t: '시간대별 전력 사용량', unit: 'kWh', dec: 0, series: [['금일', FC.bl, 520, 22], ['전일', FC.gr, 560, 8]], lo: 300, hi: 800 },
        { k: 'bar', t: '최근 7일 전력 사용량', unit: 'MWh', cats: ['월', '화', '수', '목', '금', '토', '일'], vals: [9.1, 9.4, 8.8, 9.3, 9.0, 5.2, 4.8], max: 12, c: FC.bl, dec: 1 },
      ],
      'Widget/Realtime Generation': [
        { k: 'gauge', t: '실시간 발전량', unit: 'kW', v: [598, 10], max: 875, c: FC.gn },
        { k: 'line', t: '발전 출력 추이', unit: 'kW', dec: 0, series: [['출력', FC.gn, 598, 10]], lo: 400, hi: 800 },
      ],
      'Widget/SPQ Power Status': [
        { k: 'line', t: 'S · P · Q 전력 추이', unit: 'kW', dec: 0, series: [['피상전력S', FC.ye, 560, 8], ['유효전력P', FC.re, 535, 8], ['무효전력Q', FC.gn, 165, 4]], lo: 0, hi: 600 },
        { k: 'gauge', t: '종합 역률', unit: 'PF', v: [0.96, 0.004], max: 1, c: FC.bl, dec: 2 },
        { k: 'bar', t: '시간대별 유효전력', unit: 'kW', cats: ['00', '04', '08', '12', '16', '20'], vals: [182, 174, 468, 486, 516, 262], max: 600, c: FC.re },
      ],
      'Widget/Alarm List': [
        { k: 'donut', t: '등급별 알람 비율', parts: [['고위험', FC.re, 1], ['위험', FC.or, 0], ['경고', FC.ye, 0], ['경미', FC.cy, 0], ['정상', FC.gn, 3]] },
        { k: 'bar', t: '최근 7일 알람 건수', unit: '건', cats: ['월', '화', '수', '목', '금', '토', '오늘'], vals: [2, 1, 0, 3, 1, 0, 4], max: 6, c: FC.or },
      ],
    };
  }
  function installChartSwap(root, st) {
    if (typeof makeChart !== 'function') return;
    var savedAll = load(K_CHART), saved = savedAll[st.scene] || {};
    st.charts = {}; st.chartApply = {};
    var probe = document.createElement('i');
    probe.className = 'fe-probe';
    st.frame.appendChild(probe);
    var spec = specsFor(st.scene);
    var TG = [];
    Object.keys(spec).forEach(function (name) {
      all(st.frame, '[data-name="' + name + '"]').filter(function (x) { return getComputedStyle(x).display !== 'contents' && x.offsetWidth > 100 && x.offsetHeight > 60; })
        .forEach(function (x, i) {
          var area = /KPI|Usage|Realtime/.test(name) ? { l: 6, t: 26, r: 6, b: 4 } : { l: 12, t: 34, r: 12, b: 12 };
          TG.push({ key: name + (i ? '#' + i : ''), w: x, area: area, list: spec[name] });
        });
    });
    TG.forEach(function (tg) {
      if (getComputedStyle(tg.w).position === 'static') tg.w.style.position = 'relative';
      var body = document.createElement('div');
      body.className = 'fe-chost';
      var a = tg.area;
      body.style.left = a.l + 'px'; body.style.top = a.t + 'px'; body.style.right = a.r + 'px'; body.style.bottom = a.b + 'px';
      body.style.display = 'none';
      tg.w.appendChild(body);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'fe-chartbtn';
      btn.innerHTML = KIND_ICON.bar.replace('class="ic"', 'class="ic" style="width:13px;height:11px"') + '차트';
      btn.title = '이 패널의 차트 바꾸기';
      var menu = document.createElement('div');
      menu.className = 'fe-chartmenu';
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
        body.style.display = i >= 0 ? 'block' : 'none';
        tg.w.classList.toggle('fe-hidekids', i >= 0);
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
      btn.addEventListener('pointerup', function (e) {
        e.stopPropagation(); e.preventDefault();
        all(root, '.fe-chartmenu.open').forEach(function (m) { if (m !== menu) m.classList.remove('open'); });
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
      if (e.target.closest && e.target.closest('.fe-chartmenu, .fe-chartbtn')) return;
      all(root, '.fe-chartmenu.open').forEach(function (m) { m.classList.remove('open'); });
    };
    document.addEventListener('pointerdown', st.onDocDown, true);
  }

  /* ══════════════════ 11. 패널 옮기기(패널편집) — 4px 격자 ══════════════════ */
  function installPanelMove(root, st) {
    var L = load(K_LAYOUT), me = L[st.scene] = L[st.scene] || {};
    me.free = me.free || {};
    function persist() { var a = load(K_LAYOUT); a[st.scene] = me; save(K_LAYOUT, a); }
    var frees = [];
    /* 위젯(좌우 판 · 상단 KPI) · 이벤트 로그 · 팝업 */
    all(st.frame, '[data-name^="Widget/"], [data-name="Event Log"], [data-name="Map Controls"], [data-name="Button Group (Left)"], [data-name="Button Group (Right)"]').forEach(function (f) {
      if (f.closest('.sh-popmount') && !/^Widget\//.test(nm(f))) return;
      if (frees.indexOf(f) < 0 && f.offsetWidth > 40) frees.push(f);
    });
    all(st.frame, '.sh-popmount').forEach(function (m) { frees.push(m); });
    var keyOf = function (f) { var n = nm(f) || 'Popup', same = frees.filter(function (x) { return (nm(x) || 'Popup') === n; }); return same.length > 1 ? n + '#' + same.indexOf(f) : n; };
    frees.forEach(function (f) {
      f.classList.add('fe-mv'); placed(f);
      var s = me.free[keyOf(f)];
      if (s) { f.__ux = s[0]; f.__uy = s[1]; place(f); if (s[0] || s[1]) f.classList.add('fe-front'); }
    });
    var drag = null;
    st.onDown = function (e) {
      if (!layoutEditing(root) || e.button !== 0) return;
      if (e.target.closest('.fe-chartbtn, .fe-chartmenu, .fe-resetbtn')) return;
      if (e.target.closest('[contenteditable="true"]')) return;
      var w = e.target.closest('.fe-mv');
      if (!w || !root.contains(w)) return;
      e.preventDefault(); e.stopPropagation();
      drag = { w: w, sx: e.clientX, sy: e.clientY, moved: false };
    };
    st.onMove = function (e) {
      if (!drag) return;
      var S = (st.frame.getBoundingClientRect().width / st.frame.offsetWidth) || st.S || 1;
      var dx = (e.clientX - drag.sx) / S, dy = (e.clientY - drag.sy) / S;
      if (!drag.moved) { if (Math.hypot(dx, dy) < 3) return; drag.moved = true; drag.w.classList.add('fe-dragging'); }
      drag.w.__dx = dx; drag.w.__dy = dy; place(drag.w);
    };
    st.onUp = function () {
      if (!drag) return;
      var d = drag; drag = null;
      var w = d.w;
      w.classList.remove('fe-dragging');
      if (!d.moved) return;
      var snap = function (v) { return Math.round(v / 4) * 4; };
      w.__ux = snap((w.__ux || 0) + (w.__dx || 0)); w.__uy = snap((w.__uy || 0) + (w.__dy || 0));
      w.__dx = 0; w.__dy = 0;
      place(w);
      me.free[keyOf(w)] = [w.__ux, w.__uy];
      all(root, '.fe-front').forEach(function (x) { if (x !== w) x.classList.remove('fe-front'); });
      w.classList.toggle('fe-front', !!(w.__ux || w.__uy));
      persist();
    };
    root.addEventListener('pointerdown', st.onDown, true);
    window.addEventListener('pointermove', st.onMove);
    window.addEventListener('pointerup', st.onUp);
    window.addEventListener('pointercancel', st.onUp);
    st.onDragStart = function (e) { if (layoutEditing(root) && e.target.closest && e.target.closest('.fe-mv')) e.preventDefault(); };
    root.addEventListener('dragstart', st.onDragStart);
    st.resetLayout = function () {
      me = { free: {} };
      var a = load(K_LAYOUT); a[st.scene] = me; save(K_LAYOUT, a);
      frees.forEach(function (f) { f.__ux = 0; f.__uy = 0; place(f); f.classList.remove('fe-front'); });
      Object.keys(st.chartApply || {}).forEach(function (k) { st.chartApply[k](-1); });
    };
    var rb = document.createElement('button');
    rb.type = 'button';
    rb.className = 'fe-resetbtn';
    rb.textContent = '배치 초기화';
    rb.title = '패널 자리 · 바꾼 차트를 원본으로';
    st.frame.appendChild(rb);
    rb.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    rb.addEventListener('pointerup', function (e) { e.stopPropagation(); e.preventDefault(); st.resetLayout(); });
    st.onReset = function (e) { if (e.target.closest && e.target.closest('#layoutReset')) st.resetLayout(); };
    document.addEventListener('click', st.onReset, true);
  }

  /* ══════════════════ 살리기 ══════════════════ */
  var SCENE_OF = { fmd: 'diagram', fme: 'event', fms: 'solar', fmq: 'equipment' };
  function sceneOf(root) {
    var m = root.querySelector('.sh-popmount');
    var k = m ? (/\b(fm[a-z])-mount\b/.exec(m.className) || [])[1] : null;
    return { px: k || 'fmm', scene: k && SCENE_OF[k] ? SCENE_OF[k] : 'main' };
  }
  function start(root, st) {
    var steps = [['fit', installFit], ['dates', function (r, s) { shiftDates(s.frame); }], ['eventlog', installEventLog], ['grades', function (r, s) { all(s.frame, '.sh-popmount [data-name="Toolbar"]').forEach(function (t) { installGrades(s, t.parentElement); }); }],
      ['nav', installNav], ['clock', installClock], ['ticker', installTicker], ['popbed', installPopBed], ['view', installView], ['fold', installFold], ['select', installSelect], ['live', installLive], ['spq', installSpq],
      ['swap', installChartSwap], ['move', installPanelMove], ['through', function (r, s) { passThrough(s.frame); }]];
    steps.forEach(function (s) { try { s[1](root, st); } catch (e) { console.warn('[fe] ' + s[0], e); } });
    /* 테마가 바뀌면 이벤트 로그 펼친 판(조각)도 같이 */
    /* 팝업 뿌리(.sh-pop = .fmd-root …)는 종합 현황 뿌리 안에 있다 — 스튜디오는 바깥 뿌리의 data-theme 만 바꾸므로 안쪽도 따라가게 한다 */
    function syncTheme() {
      var t = root.dataset.theme || 'light';
      all(root, '.sh-pop').forEach(function (p) { if (p.dataset.theme !== t) p.dataset.theme = t; });
      if (st.themeSync) st.themeSync();
    }
    syncTheme();
    if (window.MutationObserver) { st.themeMO = new MutationObserver(syncTheme); st.themeMO.observe(root, { attributes: true, attributeFilter: ['data-theme'] }); }
    root.classList.add('fe-enter');
    st.timers.push(setTimeout(function () { root.classList.remove('fe-enter'); }, 1600));
  }
  function initFems(root) {
    if (!root || root.__fe) return;
    injectStyle();
    root.classList.add('fe-root');
    var so = sceneOf(root);
    var st = root.__fe = { timers: [], scene: so.scene, px: so.px, onLayout: [] };
    if (/[?&]edit=1/.test(location.search)) root.classList.add('fe-edit-layout');
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
  function disposeFems(root) {
    var st = root && root.__fe;
    if (!st) return;
    if (st.wait) st.wait.disconnect();
    st.timers.forEach(function (t) { clearInterval(t); clearTimeout(t); });
    clearTimeout(st.toastT);
    if (st.spqStop) st.spqStop();
    if (st.ro) st.ro.disconnect();
    if (st.themeMO) st.themeMO.disconnect();
    if (st.onResize) window.removeEventListener('resize', st.onResize);
    Object.keys(st.charts || {}).forEach(function (k) { st.charts[k].dispose(); });
    if (st.onDocDown) document.removeEventListener('pointerdown', st.onDocDown, true);
    if (st.onSelDoc) document.removeEventListener('pointerdown', st.onSelDoc, true);
    if (st.onDown) root.removeEventListener('pointerdown', st.onDown, true);
    if (st.onMove) window.removeEventListener('pointermove', st.onMove);
    if (st.onUp) { window.removeEventListener('pointerup', st.onUp); window.removeEventListener('pointercancel', st.onUp); }
    if (st.onDragStart) root.removeEventListener('dragstart', st.onDragStart);
    if (st.onReset) document.removeEventListener('click', st.onReset, true);
    root.__fe = null;
  }
  window.initFems = initFems;
  window.disposeFems = disposeFems;
})();
