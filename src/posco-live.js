/* POSCO KDB CCTV 관제 — 재구축 화면(Screen/Control Main)의 인터랙션·라이브 레이어
   대상: src/posco-main.js (접두어 pkm)

   이 파일은 '형상'을 만들지 않는다. 형상·좌표·색은 전부 conv.js 가 뽑은 Figma 원본 그대로이고,
   여기서는 그 위에 다음만 얹는다.
     ① 반응형   — 1920x1080 기준을 유지한 채 캔버스를 넓혀 여백 없이 꽉 채운다(통짜 축소 아님)
     ② 실시간 시계
     ③ 마우스 오버 / 눌림 / 고르기
     ④ 접기·펴기 — 이벤트 현황(Fold) · 층 선택 패널 · 자산정보현황
     ⑤ 알림 티커 흐르기, 등급 카운트·자산 수치의 라이브 연출, 이벤트 표 피드
   전부 CSS transition/rAF 로만 움직이므로 글자 편집(패널편집)·테마 전환과 충돌하지 않는다.

   ★ 생성물이다 — 손으로 고치지 말고 `node src/posco/_gen/mk-live.js` 를 다시 돌릴 것.
     반응형 엔진·고르기 장치는 검증된 src/hana-live.js 에서 그대로 떠 온다(접두어만 hn→pk).

   window.initPosco(root)    — 화면 하나를 살린다(여러 번 불러도 안전)
   window.disposePosco(root) — 타이머·리스너 정리 */
(function () {
  'use strict';

  /* ══════════════════ SOP 스텝 플레이어 · 패널 이동 — 스타일 ══════════════════
     (mk-live.js 가 이 파일을 **그대로** posco-live.js 에 싣는다 — 템플릿 문자열 밖이라 정규식·역따옴표 제약이 없다)
     색은 전부 hex/rgba 로 적는다 — '색 정하기'(TPLTINT)가 posco-live-style 시트의 색을 팔레트로 옮겨 칠하므로
     컨트롤 바도 시안 색과 함께 따라간다. 기준 색은 시안의 것만 쓴다:
       #14e6db  활성 카드 테두리(rgba(20,230,219,.8))      #4475ed  기본 카드 테두리
       #dbf4fd  칩 글자                                    #0b1224  판 바탕(대화상자 남색) */
  var SOP_CSS = [
    /* ── 세 단계 겹치기 ──
       STEP 1 은 원본 자리(Step List 의 자식들), STEP 2·3 은 같은 자리에 겹쳐 얹은 층이다.
       새 단계가 **위에서** 떠오르거나, 위에 있던 층이 걷히며 아래 단계가 드러난다 —
       두 층을 동시에 반투명으로 섞으면 같은 카드가 겹쳐 순간 어두워진다(그래서 한쪽만 움직인다). */
    '.pk-root .pk-sophost{position:relative;}',
    '.pk-root .pk-soplayer{position:absolute;left:0;top:0;right:auto;bottom:auto;width:100%;height:100%;inset:auto;',
    'background:none;overflow:visible;z-index:auto;opacity:1;transition:opacity .3s cubic-bezier(.2,0,.2,1);}',
    '.pk-root .pk-soplayer > [data-name="Step List"]{position:relative;left:0;top:0;margin:0;}',
    '.pk-root .pk-sopitem{transition:opacity .3s cubic-bezier(.2,0,.2,1);}',
    '.pk-root .pk-sopoff{opacity:0;visibility:hidden;pointer-events:none;}',
    '.pk-root .pk-sopfade{opacity:0;}',

    /* ── 체계도 보기(대화상자 왼쪽 메뉴) ── 체계도 화면의 본문·메뉴를 얹은 판. 판 자체는 화면을 덮기만 하고 누르지 않는다 */
    '.pk-root .pk-sopview{position:absolute;left:0;top:0;right:auto;bottom:auto;width:100%;height:100%;inset:0;',
    'background:none;overflow:visible;z-index:auto;pointer-events:none;opacity:1;}',
    '.pk-root .pk-sopview > *{pointer-events:auto;}',
    /* 라이트 시트는 화면 뿌리에 바탕색을 칠한다(.pks4-root[data-theme=light]{background:#eef2f7}) — 겹친 판은 뿌리 이름을 빌려 쓰므로
       그 바탕이 헤더·단계 카드를 덮었다. 겹친 판은 늘 투명하게(우선순위를 한 단계 올린다). */
    '.pk-root .pk-sopview[data-theme],.pk-root .pk-soplayer[data-theme]{background:none;}',
    '.pk-root .pk-sopview.pk-sopoff > *{pointer-events:none;}',
    /* 상황종료 뒤 대화상자가 닫힌다 — 크기는 scale 속성(원본 transform 을 덮지 않게) */
    '.pk-root .pk-sopclosing{opacity:0!important;visibility:hidden;scale:.985;pointer-events:none!important;',
    'transition:opacity .4s ease,scale .4s cubic-bezier(.4,0,.2,1),visibility 0s linear .4s;}',
    /* 메뉴 전환 — 이전 보기는 **바로** 감추고 새 보기만 0.2초 떠오른다.
       (예전엔 새 보기가 0.45초 떠오르는 동안 이전 보기가 그대로 있다가 다시 0.45초 사라져 약 0.9초 두 화면이 겹쳐 보였다 — 실측) */
    '@keyframes pkSopIn{0%{opacity:0;}100%{opacity:1;}}',
    '.pk-root .pk-sopin{animation:pkSopIn .2s cubic-bezier(.2,0,.2,1) both;}',
    '.pk-root[data-theme="light"] .pk-sopview [data-name="Background"] > img{filter:none;opacity:1;}',

    /* ── 상황인지 전파 체계도 — 번호 순서 연출(installSopDiagram) ── */
    '.pk-root .pk-sopview [data-name^="Connector/"]{transition:opacity .45s ease,filter .45s ease;}',
    '.pk-root .pk-dg-dim{opacity:.22;}',
    '.pk-root .pk-dg-done{opacity:.6;}',
    /* 지금 연결 — 불이 들어오듯 번쩍였다 은은하게 남는다 */
    '@keyframes pkDgOn{0%{opacity:.22;filter:drop-shadow(0 0 0 rgba(20,230,219,0)) brightness(1);}35%{opacity:1;filter:drop-shadow(0 0 7px rgba(20,230,219,.95)) brightness(1.5);}100%{opacity:1;filter:drop-shadow(0 0 3px rgba(20,230,219,.55)) brightness(1.15);}}',
    '.pk-root .pk-dg-on{opacity:1;animation:pkDgOn .9s cubic-bezier(.2,0,.2,1) both;}',
    /* 번호 배지 — 톡 튀었다 앉는다(scale 속성: 원본 transform 을 덮지 않게) */
    '@keyframes pkDgPop{0%{scale:1;}40%{scale:1.32;}70%{scale:.94;}100%{scale:1;}}',
    '.pk-root .pk-dg-pop{animation:pkDgPop .55s cubic-bezier(.3,1.4,.5,1) both;box-shadow:0 0 0 3px rgba(20,230,219,.28),0 0 10px rgba(20,230,219,.6);transition:background-color .3s ease;}',
    /* 오가는 노드 — 빛이 숨 쉰다 */
    '@keyframes pkDgNode{0%,100%{filter:drop-shadow(0 0 0 rgba(20,230,219,0));}50%{filter:drop-shadow(0 0 8px rgba(20,230,219,.85));}}',
    '.pk-root .pk-sopview [data-name="Flow Node"]{transition:filter .3s ease;}',
    '.pk-root .pk-dg-node{animation:pkDgNode 1.1s ease-in-out infinite;}',
    /* 지금 처리 단계 — 원 아래 빛(Glow)과 함께 맥박 */
    '@keyframes pkDgCur{0%,100%{filter:brightness(1) drop-shadow(0 0 0 rgba(75,119,225,0));}50%{filter:brightness(1.18) drop-shadow(0 0 12px rgba(75,119,225,.9));}}',
    '.pk-root .pk-dg-cur{animation:pkDgCur 1.1s ease-in-out infinite;}',
    '.pk-root .pk-sopview [data-name="Process Node"] img{transition:filter .3s ease;}',
    /* 연락처 표 — 통보가 한 줄씩 나간다(원본 Row (Selected) 색 rgba(25,78,214,.3) 로 번졌다가 사라진다) */
    /* 칸마다 배경이 깔려 있어 줄 자체에 칠하면 칸 밑에 묻힌다(실측으로 안 보였다) → 줄 위에 덮는 막으로 */
    '@keyframes pkDgRow{0%{opacity:0;}20%{opacity:1;}100%{opacity:0;}}',
    '.pk-root .pk-sopview [data-name="Contact Table"] [data-name="Body"] > *{position:relative;}',
    '.pk-root .pk-dg-row::after{content:"";position:absolute;inset:0;border-radius:4px;pointer-events:none;z-index:2;',
    'background:linear-gradient(90deg,rgba(20,230,219,.32) 0%,rgba(25,78,214,.34) 45%,rgba(25,78,214,.12) 100%);box-shadow:inset 3px 0 0 0 #14e6db;',
    'animation:pkDgRow 1.3s ease-out both;}',
    '.pk-root[data-theme="light"] .pk-dg-dim{opacity:.3;}',
    '.dt-content-editing .pk-root .pk-dg-node,.dt-content-editing .pk-root .pk-dg-cur{animation-play-state:paused;}',

    /* ── 상황 경보 — 헤더의 붉은 판(Header > Background) ──
       판 그림은 원본 그대로 두고 ① 둘레의 붉은 빛이 맥박 치고 ② 판 모양(그림 자체를 마스크로)대로 붉은 막이 번졌다 사그라들며
       ③ 붉은 스캔 빛이 판을 가로지른다. 경고 배지는 경보등처럼 링이 퍼지고, 제목 글자는 붉게 발광한다.
       색은 시안의 위험색 rgb(244,48,80)(알림 티커 경보등과 같은 값). 상황종료를 누르면 모두 가라앉는다. */
    '@keyframes pkSopAlert{0%,100%{filter:drop-shadow(0 0 2px rgba(244,48,80,.35)) brightness(1);}50%{filter:drop-shadow(0 0 16px rgba(244,48,80,.9)) brightness(1.14);}}',
    '.pk-root .pk-sopalert{animation:pkSopAlert 1.6s ease-in-out infinite;}',
    /* 붉은 막 · 스캔 빛은 **판 그림의 사본**을 붉게 물들여 겹친다 — 판 모양을 그대로 따르면서 CSS 마스크를 안 쓴다.
       (마스크 그림은 CORS 요청이라 파일로 열면(file://) 막혀 효과가 통째로 사라졌다 — 헤더 아이콘과 같은 함정) */
    '.pk-root .pk-alertwash,.pk-root .pk-alertscan{position:absolute;inset:0;pointer-events:none;overflow:hidden;}',
    '.pk-root .pk-alertwash img,.pk-root .pk-alertscan img{position:absolute;inset:0;width:100%;height:100%;',
    'filter:brightness(.55) sepia(1) saturate(14) hue-rotate(-18deg);}',
    '@keyframes pkSopWash{0%,100%{opacity:0;}50%{opacity:.5;}}',
    '.pk-root .pk-alertwash{animation:pkSopWash 1.6s ease-in-out infinite;}',
    '@keyframes pkSopScan{0%{clip-path:inset(0 100% 0 -25%);}100%{clip-path:inset(0 -25% 0 100%);}}',
    '.pk-root .pk-alertscan{opacity:.55;animation:pkSopScan 2.6s linear infinite;}',
    '@keyframes pkSopBadge{0%,100%{scale:1;}50%{scale:1.08;}}',
    '@keyframes pkSopBadgeRing{0%{transform:scale(.9);opacity:.85;}75%{transform:scale(1.7);opacity:0;}100%{opacity:0;}}',
    '.pk-root .pk-sopbadge{position:relative;animation:pkSopBadge 1.6s ease-in-out infinite;}',
    '.pk-root .pk-sopbadge::after{content:"";position:absolute;inset:0;border-radius:8px;border:2px solid rgba(244,48,80,.75);pointer-events:none;animation:pkSopBadgeRing 1.6s ease-out infinite;}',
    '@keyframes pkSopTitle{0%,100%{text-shadow:0 0 0 rgba(244,48,80,0);}50%{text-shadow:0 0 12px rgba(244,48,80,.9),0 0 2px rgba(255,120,140,.8);}}',
    '.pk-root .pk-soptitle{animation:pkSopTitle 1.6s ease-in-out infinite;}',
    '.pk-root[data-theme="light"] .pk-sopalert{animation-name:pkSopAlertLt;}',
    '@keyframes pkSopAlertLt{0%,100%{filter:drop-shadow(0 0 2px rgba(210,30,60,.25));}50%{filter:drop-shadow(0 0 14px rgba(210,30,60,.6));}}',
    '.pk-root[data-theme="light"] .pk-soptitle{animation-name:pkSopTitleLt;}',
    '@keyframes pkSopTitleLt{0%,100%{text-shadow:0 0 0 rgba(210,30,60,0);}50%{text-shadow:0 0 8px rgba(210,30,60,.45);}}',
    '.dt-content-editing .pk-root .pk-sopalert,.dt-content-editing .pk-root .pk-alertwash,.dt-content-editing .pk-root .pk-alertscan,',
    '.dt-content-editing .pk-root .pk-sopbadge,.dt-content-editing .pk-root .pk-sopbadge::after,.dt-content-editing .pk-root .pk-soptitle{animation-play-state:paused;}',
    '@media (prefers-reduced-motion:reduce){.pk-root .pk-alertscan{animation:none;opacity:0;}}',

    /* ── 지금 단계의 카드 ── 들어올 때 한 번 빛이 훑고 지나간다(원본 카드 위, 레이아웃 영향 없음) */
    '@keyframes pkSopSweep{0%{transform:translateX(-120%);opacity:0;}15%{opacity:1;}100%{transform:translateX(120%);opacity:0;}}',
    '.pk-root .pk-sopsweep{position:absolute;inset:0;overflow:hidden;pointer-events:none;border-radius:inherit;z-index:4;}',
    '.pk-root .pk-sopsweep::before{content:"";position:absolute;top:0;bottom:0;left:0;width:60%;',
    'background:linear-gradient(90deg,rgba(20,230,219,0) 0%,rgba(20,230,219,.16) 50%,rgba(20,230,219,0) 100%);',
    'animation:pkSopSweep 1.1s cubic-bezier(.4,0,.2,1) .15s both;}',
    '.pk-root[data-theme="light"] .pk-sopsweep::before{background:linear-gradient(90deg,rgba(10,140,150,0) 0%,rgba(10,140,150,.14) 50%,rgba(10,140,150,0) 100%);}',
    /* 카드 테두리가 숨 쉬듯 — 밝기만(형상·색은 원본 그대로) */
    '@keyframes pkSopBreath{0%,100%{filter:drop-shadow(0 0 0 rgba(20,230,219,0));}50%{filter:drop-shadow(0 0 7px rgba(20,230,219,.45));}}',
    '.pk-root .pk-sopcur [data-name="Card"]{animation:pkSopBreath 2.4s ease-in-out infinite;}',
    /* 배지 아래 빛(Glow)이 뛰는 박자 */
    '@keyframes pkSopGlow{0%,100%{opacity:.55;}50%{opacity:1;}}',
    '.pk-root .pk-sopcur [data-name="Badge"] > [data-name="Glow"]{animation:pkSopGlow 1.2s ease-in-out infinite;}',
    /* 제목 옆 ▸▸▸ 와 헤더 'SOP 가동중' ▸▸▸ — 빛이 왼쪽에서 오른쪽으로 흐른다(그림은 원본, 마스크만 움직인다) */
    '@keyframes pkSopFlow{0%{-webkit-mask-position:150% 0;mask-position:150% 0;}100%{-webkit-mask-position:-50% 0;mask-position:-50% 0;}}',
    '.pk-root .pk-sopflow{-webkit-mask-image:linear-gradient(90deg,rgba(0,0,0,.25) 0%,#000 40%,#000 60%,rgba(0,0,0,.25) 100%);',
    'mask-image:linear-gradient(90deg,rgba(0,0,0,.25) 0%,#000 40%,#000 60%,rgba(0,0,0,.25) 100%);',
    '-webkit-mask-size:200% 100%;mask-size:200% 100%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;',
    'animation:pkSopFlow 1.1s linear infinite;}',

    /* ── 컨트롤 바 ── 대화상자 아래 줄(상황종료 단추 왼쪽 빈자리). 높이는 단추와 같은 34px. */
    '.pk-root .pk-sopbar{position:absolute;left:0;top:0;right:125px;height:34px;display:flex;align-items:center;gap:10px;',
    'padding:0 12px 0 5px;border-radius:8px;background:rgba(11,18,36,.82);box-shadow:inset 0 0 0 1px rgba(68,117,237,.55),0 0 14px rgba(0,0,0,.35);',
    'font-family:inherit;color:#dbf4fd;user-select:none;-webkit-user-select:none;z-index:6;}',
    /* 단추 초기화는 :where 로 우선순위를 낮춘다 — 안 그러면 (0,2,1) 이 단계 칩의 색·바탕 규칙(0,2,0)을 이겨 글자·판이 사라진다 */
    '.pk-root .pk-sopbar :where(button){font:inherit;color:inherit;background:none;border:0;margin:0;padding:0;cursor:pointer;-webkit-appearance:none;appearance:none;}',
    /* 재생/멈춤 — 원형 단추. 아이콘은 CSS 도형(막대 둘 / 삼각형)이라 테마·색을 그대로 따른다 */
    '.pk-root .pk-sopbar-toggle{position:relative;flex:none;width:26px;height:26px;border-radius:50%;',
    'background:linear-gradient(180deg,rgba(20,230,219,.28) 0%,rgba(20,230,219,.08) 100%);box-shadow:inset 0 0 0 1px rgba(20,230,219,.75);',
    'transition:background .18s ease,box-shadow .18s ease,transform .12s ease;}',
    '.pk-root .pk-sopbar-toggle:hover{background:linear-gradient(180deg,rgba(20,230,219,.45) 0%,rgba(20,230,219,.18) 100%);box-shadow:inset 0 0 0 1px #14e6db,0 0 10px rgba(20,230,219,.5);}',
    '.pk-root .pk-sopbar-toggle:active{transform:scale(.92);}',
    '.pk-root .pk-sopbar-toggle:focus-visible,.pk-root .pk-sopbar-step:focus-visible{outline:2px solid #14e6db;outline-offset:2px;}',
    '.pk-root .pk-sopbar-toggle::before,.pk-root .pk-sopbar-toggle::after{content:"";position:absolute;top:8px;width:3px;height:10px;border-radius:1px;background:#dbf4fd;transition:all .18s ease;}',
    '.pk-root .pk-sopbar-toggle::before{left:9px;}',
    '.pk-root .pk-sopbar-toggle::after{left:14px;}',
    /* 멈춘 상태 = 재생 삼각형 */
    '.pk-root .pk-soppaused .pk-sopbar-toggle::before{left:10px;top:7px;width:0;height:0;border-radius:0;background:none;',
    'border-style:solid;border-width:6px 0 6px 9px;border-color:transparent transparent transparent #dbf4fd;}',
    '.pk-root .pk-soppaused .pk-sopbar-toggle::after{opacity:0;}',
    /* 단계 트랙 — 번호 + 이름 + 진행 막대 */
    '.pk-root .pk-sopbar-steps{flex:1;min-width:0;display:flex;align-items:center;gap:6px;}',
    '.pk-root .pk-sopbar-step{position:relative;flex:1;min-width:0;display:flex;align-items:center;gap:7px;height:24px;padding:0 10px 0 4px;border-radius:6px;',
    'background:rgba(19,24,30,.45);box-shadow:inset 0 0 0 1px rgba(68,117,237,.35);overflow:hidden;white-space:nowrap;',
    'transition:background .25s ease,box-shadow .25s ease,color .25s ease;color:rgba(219,244,253,.78);}',
    '.pk-root .pk-sopbar-step:hover{background:rgba(68,117,237,.22);color:#dbf4fd;box-shadow:inset 0 0 0 1px rgba(68,117,237,.8);}',
    '.pk-root .pk-sopbar-no{position:relative;z-index:1;flex:none;width:17px;height:17px;border-radius:50%;display:flex;align-items:center;justify-content:center;',
    'font-size:10px;font-weight:700;line-height:1;background:rgba(68,117,237,.35);color:#dbf4fd;transition:background .25s ease,color .25s ease;}',
    '.pk-root .pk-sopbar-lbl{position:relative;z-index:1;overflow:hidden;text-overflow:ellipsis;font-size:12px;font-weight:500;line-height:1;letter-spacing:-.01em;}',
    /* 진행 막대 — 칸 바닥을 따라 차오른다(폭은 JS 가 매 프레임 적는다) */
    '.pk-root .pk-sopbar-fill{position:absolute;left:0;bottom:0;height:2px;width:0;background:linear-gradient(90deg,#4475ed 0%,#14e6db 100%);',
    'box-shadow:0 0 6px rgba(20,230,219,.8);transition:width .12s linear;}',
    '.pk-root .pk-sopbar-step.pk-sopdone{color:rgba(219,244,253,.82);}',
    '.pk-root .pk-sopbar-step.pk-sopdone .pk-sopbar-no{background:rgba(68,117,237,.75);}',
    '.pk-root .pk-sopbar-step.pk-sopdone .pk-sopbar-fill{width:100%!important;background:rgba(68,117,237,.9);box-shadow:none;}',
    '.pk-root .pk-sopbar-step.pk-sopnow{color:#ffffff;background:linear-gradient(90deg,rgba(20,230,219,.16) 0%,rgba(68,117,237,.12) 100%);box-shadow:inset 0 0 0 1px rgba(20,230,219,.8);}',
    '.pk-root .pk-sopbar-step.pk-sopnow .pk-sopbar-no{background:#14e6db;color:#062a2e;}',
    /* 지금 칸 위로 빛이 흐른다 — 흐르는 중이라는 표시(멈추면 같이 멈춘다) */
    '@keyframes pkSopShine{0%{transform:translateX(-100%);}100%{transform:translateX(260%);}}',
    '.pk-root .pk-sopbar-step.pk-sopnow::after{content:"";position:absolute;top:0;bottom:0;left:0;width:40%;pointer-events:none;',
    'background:linear-gradient(90deg,rgba(20,230,219,0) 0%,rgba(20,230,219,.22) 50%,rgba(20,230,219,0) 100%);animation:pkSopShine 1.8s linear infinite;}',
    '.pk-root .pk-sopbar-sep{flex:none;width:8px;height:8px;opacity:.5;border-style:solid;border-width:4px 0 4px 6px;border-color:transparent transparent transparent #4475ed;}',
    /* 상태 — 점 + 글 + 남은 초 */
    '.pk-root .pk-sopbar-state{flex:none;display:flex;align-items:center;gap:6px;margin-left:2px;font-size:12px;line-height:1;white-space:nowrap;}',
    '@keyframes pkSopDot{0%,100%{box-shadow:0 0 0 0 rgba(20,230,219,.7);}70%{box-shadow:0 0 0 6px rgba(20,230,219,0);}}',
    '.pk-root .pk-sopbar-dot{flex:none;width:7px;height:7px;border-radius:50%;background:#14e6db;animation:pkSopDot 1.4s ease-out infinite;}',
    '.pk-root .pk-sopbar-mode{font-weight:600;color:#14e6db;}',
    '.pk-root .pk-sopbar-time{min-width:26px;font-weight:500;color:rgba(219,244,253,.75);font-variant-numeric:tabular-nums;}',
    '.pk-root .pk-soppaused .pk-sopbar-dot{background:#e6a414;animation:none;}',
    '.pk-root .pk-soppaused .pk-sopbar-mode{color:#e6a414;}',

    /* 멈추면(또는 글자를 고치는 동안) 흐르는 연출도 멈춘다 — 상태가 눈에 보이게 */
    '.pk-root.pk-soppaused .pk-sopflow,.pk-root.pk-soppaused .pk-sopcur [data-name="Card"],',
    '.pk-root.pk-soppaused .pk-sopcur [data-name="Badge"] > [data-name="Glow"],.pk-root.pk-soppaused .pk-sopbar-step.pk-sopnow::after,',
    '.dt-content-editing .pk-root .pk-sopflow,.dt-content-editing .pk-root .pk-sopcur [data-name="Card"],',
    '.dt-content-editing .pk-root .pk-sopbar-step.pk-sopnow::after{animation-play-state:paused;}',

    /* ── 라이트 ── 흰 판 위에서 글자가 묻히지 않게(대비 4.5:1 이상 색) */
    '.pk-root[data-theme="light"] .pk-sopbar{background:rgba(255,255,255,.92);box-shadow:inset 0 0 0 1px rgba(38,84,196,.35),0 2px 10px rgba(16,36,80,.12);color:#12233d;}',
    '.pk-root[data-theme="light"] .pk-sopbar-toggle{background:linear-gradient(180deg,rgba(0,122,128,.16) 0%,rgba(0,122,128,.05) 100%);box-shadow:inset 0 0 0 1px rgba(0,122,128,.7);}',
    '.pk-root[data-theme="light"] .pk-sopbar-toggle:hover{background:linear-gradient(180deg,rgba(0,122,128,.28) 0%,rgba(0,122,128,.12) 100%);box-shadow:inset 0 0 0 1px #007a80,0 0 8px rgba(0,122,128,.35);}',
    '.pk-root[data-theme="light"] .pk-sopbar-toggle::before,.pk-root[data-theme="light"] .pk-sopbar-toggle::after{background:#0b4f53;}',
    '.pk-root[data-theme="light"] .pk-soppaused .pk-sopbar-toggle::before{background:none;border-color:transparent transparent transparent #0b4f53;}',
    '.pk-root[data-theme="light"] .pk-sopbar-step{background:rgba(236,242,252,.9);box-shadow:inset 0 0 0 1px rgba(38,84,196,.25);color:#4d5d75;}',
    '.pk-root[data-theme="light"] .pk-sopbar-step:hover{background:rgba(38,84,196,.1);color:#12233d;box-shadow:inset 0 0 0 1px rgba(38,84,196,.6);}',
    '.pk-root[data-theme="light"] .pk-sopbar-no{background:rgba(38,84,196,.18);color:#1c3f95;}',
    '.pk-root[data-theme="light"] .pk-sopbar-step.pk-sopdone{color:#2c3e5c;}',
    '.pk-root[data-theme="light"] .pk-sopbar-step.pk-sopdone .pk-sopbar-no{background:#2654c4;color:#ffffff;}',
    '.pk-root[data-theme="light"] .pk-sopbar-step.pk-sopdone .pk-sopbar-fill{background:#2654c4;}',
    '.pk-root[data-theme="light"] .pk-sopbar-step.pk-sopnow{color:#063b3f;background:linear-gradient(90deg,rgba(0,122,128,.12) 0%,rgba(38,84,196,.08) 100%);box-shadow:inset 0 0 0 1px rgba(0,122,128,.75);}',
    '.pk-root[data-theme="light"] .pk-sopbar-step.pk-sopnow .pk-sopbar-no{background:#007a80;color:#ffffff;}',
    '.pk-root[data-theme="light"] .pk-sopbar-fill{background:linear-gradient(90deg,#2654c4 0%,#007a80 100%);box-shadow:none;}',
    '.pk-root[data-theme="light"] .pk-sopbar-step.pk-sopnow::after{background:linear-gradient(90deg,rgba(0,122,128,0) 0%,rgba(0,122,128,.16) 50%,rgba(0,122,128,0) 100%);}',
    '.pk-root[data-theme="light"] .pk-sopbar-sep{border-color:transparent transparent transparent #2654c4;}',
    '.pk-root[data-theme="light"] .pk-sopbar-dot{background:#007a80;}',
    '.pk-root[data-theme="light"] .pk-sopbar-mode{color:#006a70;}',
    '.pk-root[data-theme="light"] .pk-sopbar-time{color:#4d5d75;}',
    '.pk-root[data-theme="light"] .pk-soppaused .pk-sopbar-dot{background:#b35c00;}',
    '.pk-root[data-theme="light"] .pk-soppaused .pk-sopbar-mode{color:#9a4f00;}',
    '.pk-root[data-theme="light"] .pk-sopcur [data-name="Card"]{animation-name:pkSopBreathLt;}',
    '@keyframes pkSopBreathLt{0%,100%{filter:drop-shadow(0 0 0 rgba(0,122,128,0));}50%{filter:drop-shadow(0 0 6px rgba(0,122,128,.35));}}',

    /* 라이트 — 화면 배경 사진용 규칙([data-name="Background"] > img : 반전 + 반투명)이 SOP 대화상자의 판
       (Dialog/SOP > Background, 불투명 남색 판)에도 걸려 뒤의 건물이 비치고 글자가 겹쳤다 → 판은 되돌린다
       (그림은 라이트 사본 background-*-lt.svg 가 그대로 밝은 판으로 그린다) */
    '.pk-root[data-theme="light"] [data-name="Dialog/SOP"] [data-name="Background"] > img{filter:none;opacity:1;}',   /* 대화상자 판 · 헤더 칸 · 경과시간 칸 모두 */
    /* 단계 배지 글리프(#8AFFF9 · #B0C7FF)와 정보 단추(#ADEAFF)는 옅은 파스텔이라 밝은 판에서 사라진다.
       그림 파일을 새로 그리지 않고 **감싼 상자**에 어둡게 하는 필터를 준다 — img 에 주면 '색 정하기'가
       img 에 거는 hue-rotate 인라인 필터를 덮어 버린다(상자 필터는 그 위에 겹쳐진다). */
    '.pk-root[data-theme="light"] [data-name="Step List"] [data-name="Badge"] > div:last-child{filter:brightness(.42) saturate(1.8);}',
    '.pk-root[data-theme="light"] [data-name="Step List"] [data-name="Button/Info"]{filter:brightness(.6) saturate(1.5);}',

    /* ── 헤더 메뉴(SOP · 운영현황 · 에디터 · 관리자 · 로그아웃) — Figma btn-menu(17:13398) ──
       기본값 = Property 1=default : 바탕 #CFD1D4 10% · 글자·아이콘 #CFD1D4
       마우스오버 · 활성화 = Property 1=active : 바탕 #5C9DFF 20% · 글자·아이콘 #5C9DFF
       아이콘은 원본 SVG 의 채움색만 바꾼 사본(menu/*-off|on|off-lt|on-lt.svg, mk-menu-icons.js)을 상태마다 갈아 끼운다.
       (CSS 마스크로 칠했더니 파일로 열 때 CORS 로 막혀 아이콘이 사라졌다 — img content 는 그 제약이 없다)
       라이트는 라이트 시트가 대비를 맞춰 옮겨 둔 값 그대로(기본 #33353A · #3c4846 아이콘, 활성 #0446A9). */
    '.pk-root .pk-menu{transition:background-color .18s ease;}',
    '.pk-root .pk-menu p{transition:color .18s ease;}',
    '.pk-root .pk-menu.pk-hot::before{display:none;}',
    '.pk-root .pk-menu .pk-menu-ico img{content:var(--pk-ico-off);}',
    '.pk-root .pk-menu.pk-menu-on .pk-menu-ico img,.pk-root .pk-menu:hover .pk-menu-ico img{content:var(--pk-ico-on);}',
    '.pk-root[data-theme="light"] .pk-menu .pk-menu-ico img{content:var(--pk-ico-off-lt);}',
    '.pk-root[data-theme="light"] .pk-menu.pk-menu-on .pk-menu-ico img,.pk-root[data-theme="light"] .pk-menu:hover .pk-menu-ico img{content:var(--pk-ico-on-lt);}',
    '.pk-root .pk-menu:not(.pk-menu-on):not(:hover){background-color:rgba(207,209,212,.1);}',
    '.pk-root .pk-menu:not(.pk-menu-on):not(:hover) p{color:#cfd1d4;}',
    '.pk-root .pk-menu.pk-menu-on,.pk-root .pk-menu:hover{background-color:rgba(92,157,255,.2);}',
    '.pk-root .pk-menu.pk-menu-on p,.pk-root .pk-menu:hover p{color:#5c9dff;}',
    '.pk-root .pk-menu:active{filter:brightness(.9);}',
    '.pk-root .pk-menu:focus-visible{outline:2px solid #5c9dff;outline-offset:2px;}',
    '.pk-root[data-theme="light"] .pk-menu:not(.pk-menu-on):not(:hover){background-color:rgba(116,123,134,.1);}',
    '.pk-root[data-theme="light"] .pk-menu:not(.pk-menu-on):not(:hover) p{color:#33353a;}',
    '.pk-root[data-theme="light"] .pk-menu.pk-menu-on p,.pk-root[data-theme="light"] .pk-menu:hover p{color:#0446a9;}',
    '.dt-content-editing .pk-root .pk-menu:hover:not(.pk-menu-on){background-color:rgba(207,209,212,.1);}',

    /* ── 패널 이동(패널편집 · 배치) ── 옮길 수 있는 판에 점선 테두리와 손 커서 */
    '.dt-editing .pk-root .pk-movable{cursor:move;}',
    '.dt-editing .pk-root .pk-movable:hover{outline:1px dashed rgba(88,160,255,.85);outline-offset:2px;}',
    '.dt-editing .pk-root .pk-moving{outline:1px solid rgba(88,160,255,1);outline-offset:2px;opacity:.92;}',
    '.pk-root[data-theme="light"] .pk-movable:hover{outline-color:rgba(38,84,196,.8);}',
  ];

  var STYLE_ID = 'posco-live-style';
  var CSS = [
    /* 호버 — 레이아웃에 영향을 주지 않도록 ::before 오버레이로만 칠한다
       (conv.js 가 만드는 규칙은 ::after 만 쓰므로 ::before 는 비어 있다) */
    /* ── '여기 눌린다'는 표시 ──
       ① 호버 틴트가 붙은 자리(pk-hot) ② 라이브가 클릭을 붙인 자리(pk-click, clickable() 참고).
       커서는 상속되므로 안쪽 글자·아이콘 위에서도 그대로 손가락이다.
       원본이 글자를 <p> 로 두어 브라우저가 기본으로 I-빔(글자 고르기) 커서를 띄우는데,
       그러면 '누르는 자리'가 아니라 '글을 고르는 자리'처럼 보인다 → 눌리는 자리 안에서는 손가락으로 덮는다. */
    '.pk-root .pk-hot,.pk-root .pk-click{cursor:pointer;}',
    '.pk-root .pk-hot p,.pk-root .pk-click p,.pk-root .pk-hot img,.pk-root .pk-click img{cursor:inherit;}',
    /* 틴트도 그라디언트도 없던 자리(팝업 X · 알림의 확인 …) — 밝아지는 것으로 눌림을 알린다 */
    '.pk-root .pk-lit{transition:filter .18s ease;}',
    '.pk-root .pk-lit:hover{filter:brightness(1.3);}',
    '.pk-root .pk-lit:active{filter:brightness(1.5);}',
    '.pk-root[data-theme="light"] .pk-lit:hover{filter:brightness(.85);}',
    '.pk-root[data-theme="light"] .pk-lit:active{filter:brightness(.75);}',
    /* 글자를 고치는 동안(패널편집)에는 글자 커서가 맞다 — 그때는 이 표시를 걷는다 */
    '.dt-content-editing .pk-root .pk-hot,.dt-content-editing .pk-root .pk-click,',
    '.dt-editing .pk-root .pk-hot,.dt-editing .pk-root .pk-click{cursor:auto;}',
    '.dt-content-editing .pk-root .pk-hot p,.dt-content-editing .pk-root .pk-click p{cursor:text;}',
    '.pk-root .pk-hot::before{content:"";position:absolute;inset:0;border-radius:inherit;',
    'background:#ffffff;opacity:0;pointer-events:none;transition:opacity .18s ease;z-index:3;}',
    '.pk-root .pk-hot:hover::before{opacity:.10;}',
    '.pk-root .pk-hot:active::before{opacity:.17;transition-duration:.06s;}',
    '.pk-root[data-theme="light"] .pk-hot::before{background:#0d2444;}',
    '.pk-root[data-theme="light"] .pk-hot:hover::before{opacity:.075;}',
    '.pk-root[data-theme="light"] .pk-hot:active::before{opacity:.13;}',
    /* 표의 줄은 살짝만 — 글자가 빽빽해 강한 틴트는 읽기를 방해한다 */
    '.pk-root .pk-hot.pk-row:hover::before{opacity:.055;}',
    '.pk-root[data-theme="light"] .pk-hot.pk-row:hover::before{opacity:.045;}',
    /* 판 없이 그림만 있는 자리 — 사각형 틴트 대신 밝기로 반응 */
    '.pk-root .pk-hot.pk-soft::before{display:none;}',
    '.pk-root .pk-hot.pk-soft{transition:filter .18s ease,opacity .18s ease;}',
    '.pk-root .pk-hot.pk-soft:hover{filter:brightness(1.35);}',
    '.pk-root .pk-hot.pk-soft:active{filter:brightness(1.55);}',
    '.pk-root[data-theme="light"] .pk-hot.pk-soft:hover{filter:brightness(.72);}',
    /* ── 틴트의 모양을 그림에 맞춘다 ──
       원본의 판·칩은 그림(svg)이 둥글고 상자 자체는 각져 있다. border-radius:inherit 만
       믿으면 네모 틴트가 둥근 그림 밖으로 삐져나와 '효과가 잘린' 것처럼 보인다. */
    '.pk-root [data-name^="Count/"]::before,.pk-root [data-name="Button/Ack"]::before{border-radius:999px;}',
    '.pk-root [data-name^="group0"]::before{border-radius:4px;}',           /* 자산정보현황 타일(group-bg.svg 와 같은 4px) */
    '.pk-root [data-name="Nav Bar"] > *::before,.pk-root [data-name^="item0"]::before{border-radius:6px;}',
    '.pk-root [data-name^="item-"]::before{border-radius:6px;}',           /* 분류 바(CCTV · 출입 · 소방 · 도청) */
    /* 글자만 있는 자리(브레드크럼) — 글자에 딱 붙은 네모는 선택 블록처럼 보인다.
       조금 넓히고 모서리를 깎아 '누를 수 있는 자리'로 읽히게 한다. */
    '.pk-root [data-name^="Item/"]::before{inset:-3px -6px;border-radius:4px;}',
    /* 고르기 — 상태가 바뀔 때 색·테두리가 부드럽게 넘어간다 */
    '.pk-root .pk-swap{transition:background-color .22s ease,border-color .22s ease,color .22s ease,box-shadow .22s ease;}',
    '.pk-root .pk-swap p{transition:color .22s ease;}',

    /* ── 층 선택 버튼의 호버·고름 ──
       색을 새로 짓지 않는다. Figma btn-floor 컴포넌트 세트의 Status=hover(16:9160) ·
       Status=active(16:9161) 에 designer 가 넣어 둔 값 그대로다. */
    /* 층 버튼의 이름은 화면마다 다르다 — 메인 3장은 로컬 마스터라 'Floor Item',
       전체층·단층은 원격(라이브러리) 마스터라 'btn-list-category-floor' 로 나온다. */
    '.pk-root [data-name="Floor Item"],.pk-root [data-name="btn-list-category-floor"]{transition:background .2s ease,border-color .2s ease,box-shadow .2s ease;}',
    '.pk-root [data-name="Floor Item"]:hover,.pk-root [data-name="btn-list-category-floor"]:hover{background:linear-gradient(180deg,#016eeb 0%,#013e85 100%);border-color:#016eeb;}',
    '.pk-root [data-name="Floor Item"]:hover p,.pk-root [data-name="btn-list-category-floor"]:hover p{color:#ffffff;}',
    '.pk-root [data-name="Floor Item"].pk-on,.pk-root [data-name="btn-list-category-floor"].pk-on{background:linear-gradient(180deg,#016eeb 0%,#0051ad 100%);border-color:transparent;',
    'box-shadow:inset 0 0 4px 0 rgba(255,255,255,.45);}',
    '.pk-root [data-name="Floor Item"].pk-on p,.pk-root [data-name="btn-list-category-floor"].pk-on p{color:#ffffff;}',

    /* ── 팝업 여닫기 ──
       크기는 transform 이 아니라 CSS scale 속성으로 준다 — 원본이 걸어 둔 transform 을 안 덮게.
       (이 묶음은 템플릿 문자열 안이라 역따옴표를 쓰면 안 된다.) */
    '.pk-root .pk-pop{transition:opacity .2s ease,scale .2s cubic-bezier(.22,.9,.24,1);}',
    '.pk-root .pk-pop-off{opacity:0;scale:.97;pointer-events:none;visibility:hidden;}',

    /* ── 아이콘 타일 고르기(좌상단 나브 · 분류 바) ──
       켜진 모습이 그림째 따로 있어 맞바꿀 수 없다 → 시안의 파랑(#016eeb)으로 빛만 얹는다. */
    '.pk-root .pk-pick{transition:filter .2s ease;}',
    '.pk-root .pk-pick.pk-picked img{filter:drop-shadow(0 0 5px rgba(1,110,235,.85)) brightness(1.18);}',
    '.pk-root .pk-pick.pk-picked p{color:#ffffff;}',
    '.pk-root[data-theme="light"] .pk-pick.pk-picked p{color:#0b2f66;}',

    /* ── 자산리스트 분류 접기 ── */
    '.pk-root .pk-fold-list{overflow:hidden;transition:height .3s cubic-bezier(.22,.9,.24,1);}',
    /* 날짜 고르기 — 원본 날짜 칸 위에 투명하게 덮는 진짜 <input type="date">.
       보이는 것은 시안 그대로이고, 열리는 달력은 브라우저(OS) 것이다. */
    /* **opacity 로 감추지 않는다** — 흐려 둔 입력에는 브라우저가 달력을 띄워 주지 않는다(그래서 한 번 안 열렸다).
       글자 · 배경 · 기본 겉모습만 지우고, 달력 단추는 자리를 지킨 채 투명하게 둔다(눌리는 자리는 그대로다). */
    '.pk-root .pk-datepick{position:absolute;inset:0;width:100%;height:100%;margin:0;padding:0;border:0;',
    'background:transparent;color:transparent;cursor:pointer;font:inherit;}',
    /* 날짜 칸에는 appearance:none 을 **주지 않는다** — 겉모습을 지우면 달력 단추의 기본 동작까지 사라져
       눌러도 달력이 안 열린다(그렇게 만들었다가 고쳤다). 겉모습은 아래 투명 처리만으로 충분히 지워진다. */
    /* 브라우저의 **달력 단추를 칸 전체로 늘려** 투명하게 깐다 — 그러면 어디를 눌러도 브라우저가
       스스로 달력을 연다. showPicker() 에 기대지 않는 이유: 그건 '사용자가 직접 누른 것'을 요구해
       자리에 따라(그리고 자동 시험에서) 거부된다. 여기서는 열어 주는 쪽이 브라우저다. */
    '.pk-root .pk-datepick::-webkit-calendar-picker-indicator{position:absolute;inset:0;width:100%;height:100%;',
    'margin:0;padding:0;opacity:0;cursor:pointer;}',
    /* 날짜 글자 영역은 **자리는 두고 안 보이게**(opacity) 한다. 투명 글자만으로는 초점이 간 조각의
       파란 선택 블록이 시안 위로 비치고, 반대로 display:none 으로 없애면 브라우저가 달력을 안 띄운다
       — 둘 다 만들어 본 뒤 고른 가운데 값이다. */
    '.pk-root .pk-datepick::-webkit-datetime-edit{opacity:0;}',
    '.pk-root .pk-datepick{color-scheme:dark;}',
    '.pk-root[data-theme="light"] .pk-datepick{color-scheme:light;}',
    /* 초점은 **칸**에 테두리로 보인다 — 덮어 둔 입력을 드러내면(opacity:1) 브라우저 기본 날짜칸이
       시안 위에 그대로 뜬다(한 번 그렇게 만들었다). 보이는 것은 끝까지 원본이어야 한다. */
    '.pk-root .pk-datepick:focus{outline:none;}',
    '.pk-root [data-name="Date Field"]:focus-within{outline:2px solid #016eeb;outline-offset:2px;border-radius:3px;}',
    /* 건물 고르기 — 날짜와 같은 방법(원본 칸 위에 투명한 진짜 <select>) */
    /* 닫혀 있을 때는 아무것도 안 그린다(투명 글자 · 배경 없음 · 화살표 없음) — 보이는 건 시안 글자다.
       **펼친 목록은 별개다**: option 은 투명 글자색을 물려받아 글자가 통째로 사라진다(그렇게 만들었다가 고쳤다).
       그래서 항목 색은 **따로 못 박고**, 목록 판은 화면 테마를 따르게 color-scheme 을 준다.
       opacity 로 감추지 않는 이유 — 브라우저에 따라 펼친 목록까지 같이 흐려진다. */
    '.pk-root .pk-buildpick{position:absolute;inset:0;width:100%;height:100%;margin:0;padding:0;border:0;',
    'background:transparent;color:transparent;cursor:pointer;font:inherit;-webkit-appearance:none;appearance:none;}',
    /* 다크가 기본이고 라이트만 속성으로 켠다(시트 규칙과 같다 — 미리보기는 속성이 아예 없다) */
    '.pk-root .pk-buildpick{color-scheme:dark;}',
    '.pk-root .pk-buildpick option{color:#e8eef7;background:#1b2430;}',
    '.pk-root[data-theme="light"] .pk-buildpick{color-scheme:light;}',
    '.pk-root[data-theme="light"] .pk-buildpick option{color:#0e1a2b;background:#ffffff;}',
    '.pk-root .pk-buildpick:focus{outline:none;}',
    '.pk-root [data-name="Building Selector"]:focus-within{outline:2px solid #016eeb;outline-offset:2px;border-radius:4px;}',
    '.pk-root .pk-rowhide{display:none !important;}',
    /* 글자를 고치는 동안(패널편집)에는 클릭이 글자에 닿아야 한다 */
    '.dt-content-editing .pk-root .pk-datepick,.dt-editing .pk-root .pk-datepick,',
    '.dt-content-editing .pk-root .pk-buildpick,.dt-editing .pk-root .pk-buildpick{pointer-events:none;}',
    '.pk-root .pk-chev{transition:transform .3s ease;}',
    '.pk-root .pk-chev.pk-chev-off{transform:rotate(-90deg);}',

    /* ── 접기·펴기 ──
       Figma 원본의 접힌 모습(content01 Status=close)과 같은 자리로 간다. */
    '.pk-root .pk-eventlog{transition:translate .42s cubic-bezier(.22,.9,.24,1);translate:0 var(--pk-lift,0px);}',
    '.pk-root .pk-collapsible{transition:height .38s cubic-bezier(.22,.9,.24,1);overflow:hidden;}',
    '.pk-root .pk-collapsible .pk-fadeout{transition:opacity .22s ease;opacity:1;}',
    '.pk-root .pk-collapsed .pk-fadeout{opacity:0;pointer-events:none;}',
    '.pk-root .pk-foldbtn{transition:transform .42s cubic-bezier(.22,.9,.24,1);}',
    '.pk-root .pk-foldbtn.pk-flip{transform:rotate(180deg);}',
    /* Figma 가 인스턴스에 걸린 회전(-90°)을 컴포넌트 출력에 안 실어 준다 →
       원본과 같게 세워 준다(층 선택 패널의 접기 단추). */
    '.pk-root .pk-rot90{transform:rotate(90deg);}',
    '.pk-root .pk-rot90.pk-flip{transform:rotate(270deg);}',

    /* ── 라이브 ── */
    '@keyframes pkTick{0%{opacity:.35;}100%{opacity:1;}}',
    '.pk-root .pk-tick{animation:pkTick .5s ease;}',
    '.pk-root .pk-num{white-space:nowrap;}',
    '@keyframes pkNewRow{0%{opacity:0;transform:translateY(-6px);}100%{opacity:1;transform:translateY(0);}}',
    '.pk-root .pk-newrow{animation:pkNewRow .45s cubic-bezier(.22,.9,.24,1) both;}',
    /* ── 알림 티커 ──
       원본 글자 그대로, **흐르기만** 한다(내용은 지어내지 않는다).
       자리를 옮길 때 transform 대신 CSS `translate` 속성을 쓴다 — 원본이 걸어 둔
       transform: translateY(-50%) 를 덮어쓰지 않으려고. */
    '.pk-root .pk-marquee{will-change:translate;}',
    /* 알림 바 전체가 숨 쉬듯 — 밝기만 오간다(형상·색은 원본 그대로) */
    '@keyframes pkTickerPulse{0%,100%{filter:brightness(1);}50%{filter:brightness(1.2);}}',
    '.pk-root .pk-tickerbar{animation:pkTickerPulse 2.4s ease-in-out infinite;}',
    /* 왼쪽 경고 심볼 — 커졌다 작아지고, 경보등처럼 링이 퍼져 나간다.
       크기는 transform 이 아니라 CSS `scale` 속성이라 원본 transform 을 건드리지 않는다.
       링 색은 시안이 쓰는 위험색(rgb(244,48,80) — 전구 critical 그라디언트 시작색) 그대로다. */
    '@keyframes pkBeacon{0%,100%{scale:1;}50%{scale:1.13;}}',
    '@keyframes pkBeaconRing{0%{transform:scale(.86);opacity:.7;}70%{transform:scale(1.75);opacity:0;}100%{opacity:0;}}',
    '.pk-root .pk-beacon{animation:pkBeacon 2.4s ease-in-out infinite;}',
    '.pk-root .pk-beacon::after{content:"";position:absolute;inset:0;border-radius:50%;',
    'border:1.5px solid rgba(244,48,80,.55);animation:pkBeaconRing 2.4s ease-out infinite;pointer-events:none;}',
    '.pk-root[data-theme="light"] .pk-beacon::after{border-color:rgba(197,26,52,.5);}',
    /* 글자를 고치는 동안에는 멈춘다 — 시선이 튀지 않게 */
    '.dt-content-editing .pk-root .pk-beacon,.dt-content-editing .pk-root .pk-beacon::after,',
    '.dt-content-editing .pk-root .pk-tickerbar{animation-play-state:paused;}',
    '@media (prefers-reduced-motion:reduce){.pk-root *{animation-duration:.001s!important;transition-duration:.001s!important;}}',
  ].concat(SOP_CSS).join('\n');

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function editing() {
    return !!document.querySelector('.dtstage.dt-content-editing, .dtstage.dt-editing');
  }

  function idle() { return typeof window.__wembIdle === "function" ? window.__wembIdle() : document.hidden; }

  function every(ms, fn) { return setInterval(function () { if (!idle()) fn(); }, ms); }

  function all(root, sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }

  function one(root, sel) { return root.querySelector(sel); }

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
    el.classList.remove('pk-tick');
    void el.offsetWidth;                       /* 애니메이션 재시작 */
    el.classList.add('pk-tick');
  }

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

  var rnd = function (a, b) { return a + Math.random() * (b - a); };

  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  function collectBlocks(root) {
    var frame = root.firstElementChild;
    if (!frame) return [];
    var groups = [];
    (function walk(el, gid) {
      for (var i = 0; i < el.children.length; i++) {
        var c = el.children[i];
        var cs = getComputedStyle(c);
        if (cs.display === 'contents') { walk(c, gid == null && c.getAttribute('data-name') !== 'Base Screen' ? groups.length : gid); continue; }   /* SOP: 배경 화면 그룹은 풀어서 센다 */
        if (cs.position !== 'absolute') continue;
        var g = gid == null ? groups.length : gid;
        (groups[g] || (groups[g] = [])).push(c);
      }
    })(frame, null);
    return groups.filter(Boolean);
  }

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

  function alignDropdown(root, S) {
    var dd = one(root, '[data-name="Menu/Dropdown"]');
    var tab = one(root, '[data-name^="Menu Item/Control Tower"]');
    if (!dd || !tab) return;
    var rb = root.getBoundingClientRect();
    var cx = function (el) { var r = el.getBoundingClientRect(); return (r.left - rb.left + r.width / 2) / S; };
    if (dd.__hnBaseGap == null) return;                  /* 기준 간격을 아직 못 쟀다 */
    var want = cx(tab) + dd.__hnBaseGap;                 /* 탭 중심 + 원본에서의 차이 */
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

  function unhideVariants(root) {
    var kept = [];
    all(root, '[data-pk-vset][hidden], [data-pk-graft][hidden]').forEach(function (el) {
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
      dd.__hnBaseGap = dd.dataset.hnGraft ? 0 : c(dd) - c(tab);
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
      var full = o.h >= BASE_H * 0.85 && o.w >= BASE_W * 0.99;   /* 전면 배경 — 세로·가로 둘 다 덮을 때만 */
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

    if (!st.anchors) { st.anchors = measureAnchors(root); applyAnchorOverrides(st.anchors); }
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

  function sat(v) {
    var m = /rgba?\(([^)]+)\)/.exec(v || '');
    if (!m) return 0;
    var p = m[1].split(',').map(parseFloat);
    if (p.length > 3 && p[3] < 0.15) return 0;
    var mx = Math.max(p[0], p[1], p[2]) / 255, mn = Math.min(p[0], p[1], p[2]) / 255;
    var l = (mx + mn) / 2;
    return (mx === mn) ? 0 : (mx - mn) / (1 - Math.abs(2 * l - 1));
  }

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
    a.classList.add('pk-swap'); b.classList.add('pk-swap');
  }

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

  /* 기준 좌표계 — 1920x1080 을 유지한 채 캔버스만 넓힌다(통짜 축소 아님) */
  var BASE_W = 1920, BASE_H = 1080;

  /* ── 넓어진 폭을 판 '안쪽'까지 전달할 자리 ──
     캔버스를 넓히면 판은 따라 넓어지지만 그 안의 내용은 Figma 가 준 px 폭 그대로라 오른쪽이 빈다.
     이벤트 현황 표만 해당한다(다른 판은 좌·우 가장자리에 붙은 고정폭 위젯이다).
     칸 크기는 그대로 두고 '이벤트 내용' 칸이 남는 폭을 먹는다. */
  var STRETCH = [
    {
      host: '[data-name^="Event Panel"]',
      parts: ':scope > [data-name="Body"], [data-name="Background"], [data-name="Content"],'
        + '[data-name="Header"], [data-name="Table"], [data-name="Header Row"], [data-name="Cells"],'
        + '[data-name="Rows"], [data-name="Row"]',
      grow: '[data-name="Th/Message"], [data-name="Td/Message"]',
    },
  ];

  /* ══════════════════ 이 시안 — 앵커 표 ══════════════════
     블록이 캔버스의 어디에 붙는지. 일반 추정(measureAnchors)은 '세로로 놓인 위치에 비례해'
     내려보내는데, 이 시안은 헤더 바로 밑에 브레드크럼이 붙어 있어 비례 배분을 하면 그 사이가 벌어진다.
     그래서 여기서는 표로 못 박는다 — dy 0=위 · 0.5=가운데 · 1=아래, dx 0=왼쪽 · 0.5=가운데 · 1=오른쪽. */
  var ANCHOR = [
    { m: '[data-name="Dialog/SOP"] > *', dx: 1, dy: 0.5 },          /* SOP 대화상자 — 오른쪽, 세로 가운데 */
    { m: '[data-name="Background"]', dx: 0, dy: 0 },                 /* 바탕 사진 — full 로 잡혀 늘어난다 */
    { m: '[data-name="Building Image"], [data-name="Floor Plan"]', dx: 0.5, dy: 0.5 },   /* 3D 건물 · 도면 — 캔버스 가운데 */
    { m: '[data-name="Header"]', dx: 0, dy: 0 },
    { m: '[data-name="Breadcrumb"]', dx: 0, dy: 0 },                 /* 헤더에 붙어 있어야 한다 */
    { m: '[data-name="Nav Bar"], [data-name="Sidebar"], [data-name="Toolbar"], [data-node-id="17:9544"]', dx: 0, dy: 0 },   /* 왼쪽 위 — 나브 · 층 선택 */
    { m: '[data-name="Alert Ticker"]', dx: 0.5, dy: 0 },
    { m: '[data-name^="Widget/"], [data-name^="Panel/"], [data-name="Category Bar"]', dx: 1, dy: 0 },   /* 오른쪽 위 판 */
    { m: '[data-name^="Event Panel"]', dx: 0, dy: 1 },               /* 이벤트 현황 — 바닥 */
    /* 팝업은 표에 넣지 않는다 — 원본이 '가운데 띄운 것'(Ack 알림 · 자산 상세)과
       '왼쪽 목록에 붙여 둔 것'(종합현황 · 이벤트 리스트)으로 갈리는데, 한 줄로 0.5 를 박으면
       왼쪽에 붙어 있던 판이 넓힐수록 목록에서 떨어져 나간다(2560 에서 좌156 → 476 으로 벌어졌다).
       잰 값(measureAnchors)이 이미 제자리를 맞힌다 — 가운데 것은 0.5, 왼쪽 것은 0 으로. */
  ];
  /* 왜 레이어명으로 잡나 — 화면 6장이 같은 골격(헤더·브레드크럼·이벤트 현황·좌측 목록·우측 판)을
     쓰지만 node id 는 화면마다 다르다. 이름은 Figma 에서 여섯 장을 같은 어휘로 통일해 두었다. */
  function applyAnchorOverrides(anchors) {
    if (!anchors) return;
    anchors.forEach(function (a) {
      for (var i = 0; i < ANCHOR.length; i++) {
        var sel = ANCHOR[i].m;
        var hit = a.els.some(function (el) { try { return el.matches(sel); } catch (e) { return false; } });
        if (!hit) continue;
        a.wantDX = ANCHOR[i].dx;
        a.wantDY = ANCHOR[i].dy;
        break;
      }
    });
  }

  /* ══════════════════ 이 시안 — 마우스 오버 ══════════════════ */
  var HOT = [
    '[data-name^="Menu Item/"]', '[data-name^="Nav Item/"]', '[data-name="Nav Bar"] > *',
    '[data-name^="Button/"]', '[data-name^="Count/"]', '[data-name="Building Label"]',
    '[data-name="Logo"]', '[data-name^="Item/"]', '[data-name^="group0"]',
    /* 나머지 다섯 화면 몫 */
    '[data-name^="Category/"]',        /* 자산리스트의 분류 줄(CCTV · 소방센서) */
    '[data-name^="item-"]',            /* 분류 바(CCTV · 출입 · 소방 · 도청) */
    '[data-name^="item0"]',            /* 좌상단 나브(부지이동 · 전체보기 · 기본위치) */
    '[data-name="Search Field"]',
  ].join(',');
  /* 왜 이 선택자인가
     · 'Nav Bar > *'  — 둘째 나브(출입동선)에는 Figma 가 data-name 을 안 실어 줬다.
                        하나만 반응하면 '고장 난 것'처럼 보여 형제까지 함께 잡는다.
     · 'group0*'      — 자산정보현황은 타일(group01…04)이 눌리는 자리다. 안쪽 글자 묶음(item)에
                        얹으면 틴트가 타일보다 6px 씩 작아 가장자리가 잘린 것처럼 보였다.
     · 'Auto Toggle' 없음 — 그 상자는 Auto 알약과 펼침 단추를 담기만 한다. 같이 잡으면
                        알약 위에 네모 한 겹이 더 깔려 '효과가 잘린' 것처럼 보였다. */
  /* 판 없이 그림만 놓인 자리 — 사각형 틴트 대신 밝기로 반응 */
  var SOFT = ['[data-name^="Button/Collapse"]', '[data-name="Button/Dropdown"]', '[data-name="Logo"]',
    '[data-name="Button/Close"]', '[data-name="btn-arrow"]'].join(',');
  /* 한 묶음 안에서 하나만 고르는 것 — 겉모습을 **원본의 두 상태끼리 맞바꿔** 표시한다.
     이름에 (Selected) 가 박힌 것이 있으면 그것이 곧 '켜진 모습'이다(표의 줄 · 자산리스트 항목). */
  var GROUP_ITEMS = ['[data-name^="Nav Item/"]', '[data-name^="Menu Item/"]',
    '[data-name="Row"],[data-name="Row (Selected)"]',
    '[data-name="Item"],[data-name="Item (Selected)"]',
    '[data-name="Item/Unauthorized"],[data-name="Item/General"]'];
  var TOGGLE_ITEMS = [];

  function markHot(root) {
    all(root, HOT).forEach(function (el) {
      if (el.classList.contains('pk-hot')) return;
      var r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) return;
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      el.classList.add('pk-hot');
    });
    all(root, SOFT).forEach(function (el) { el.classList.add('pk-hot', 'pk-soft'); });
    /* 겹쳐 얹지 않는다 — 안쪽이 이미 반응하는데 바깥 상자까지 칠하면 틴트가 두 겹이 되고,
       바깥 상자는 대개 각진 네모라 안쪽 알약 옆으로 삐져나와 '잘린' 것처럼 보인다. */
    all(root, '.pk-hot').forEach(function (el) {
      if (el.querySelector('.pk-hot')) el.classList.remove('pk-hot', 'pk-soft');
    });
    markRowsHot(root);
  }

  /* 이벤트 표의 줄 — 판(overflow:clip) 안에 **통째로** 들어온 줄에만 호버를 얹는다.
     원본(Figma)부터 표가 판보다 길어 마지막 줄은 반쯤 잘려 있다. 거기에 틴트를 칠하면
     반쪽짜리 띠가 생겨 '효과가 잘렸다'고 읽힌다 — 그런 줄은 아예 반응시키지 않는다.
     줄은 피드가 돌리고 판은 접기·창 크기로 높이가 바뀌니 그때마다 다시 잰다. */
  /* 줄처럼 늘어선 것들 — 이벤트 표 · 출입내역 표 · 자산리스트 항목 */
  var ROWS = ['[data-name="Rows"] > [data-name^="Row"]',
    '[data-name="Item"]', '[data-name="Item (Selected)"]'].join(',');
  /* 이 줄을 잘라 내는 조상(overflow) — 화면마다 판이 다르다(이벤트 현황 · 출입내역 · 자산리스트) */
  function clipperOf(el, root) {
    var p = el.parentElement;
    while (p && p !== root) {
      var cs = getComputedStyle(p);
      if (/hidden|clip|auto|scroll/.test(cs.overflow + cs.overflowX + cs.overflowY)) return p;
      p = p.parentElement;
    }
    return null;
  }
  function markRowsHot(root) {
    var rows = all(root, ROWS);
    if (!rows.length) return;
    rows.forEach(function (el) {
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      var clip = clipperOf(el, root);
      var r = el.getBoundingClientRect();
      var c = clip && clip.getBoundingClientRect();
      var whole = !c || (r.top >= c.top - 0.5 && r.bottom <= c.bottom + 0.5);
      el.classList.toggle('pk-hot', whole);
      el.classList.toggle('pk-row', whole);
    });
  }

  /* 판 높이가 바뀌면(창 크기 · 접기) 잘리는 줄도 바뀐다 — 다시 잰다 */
  function installRowHot(root, st) {
    var run = function () { try { markRowsHot(root); } catch (e) { } };
    var queued = 0;
    var later = function () { if (queued) return; queued = requestAnimationFrame(function () { queued = 0; run(); }); };
    window.addEventListener('resize', later);
    var ro = null;
    if (window.ResizeObserver) {
      var panel = one(root, '[data-name^="Event Panel"]');
      if (panel) { ro = new ResizeObserver(later); ro.observe(panel); }
    }
    st.rowHot = run;
    st.cleanup.push(function () {
      window.removeEventListener('resize', later);
      if (queued) cancelAnimationFrame(queued);
      if (ro) ro.disconnect();
    });
  }

  /* ══════════════════ 실시간 시계 ══════════════════
     헤더의 2024/12/01 · 15:16:49 를 지금 시각으로 채운다(원본 서식 그대로).
     헤더는 인스턴스라 안쪽 글자에 data-name 이 없다 → 노드 id 로 찾는다. */
  function installClock(root, st) {
    var date = one(root, '[data-node-id$="1:3080"]') || one(root, '[data-name="Date"] p');
    var time = one(root, '[data-node-id$="1:3081"]') || one(root, '[data-name="Time"]');
    if (!date && !time) return;
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var tick = function () {
      if (editing()) return;
      var d = new Date();
      if (date) {
        var nd = d.getFullYear() + '/' + pad(d.getMonth() + 1) + '/' + pad(d.getDate());
        if (date.textContent !== nd) date.textContent = nd;
      }
      if (time) {
        var nt = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
        if (time.textContent !== nt) time.textContent = nt;
      }
    };
    tick();
    var id = every(1000, tick);
    st.cleanup.push(function () { clearInterval(id); });
  }

  /* ══════════════════ 가로를 꽉 쓰는 판 안쪽의 '1920 고정' 조각 펴기 ══════════════════
     캔버스를 넓히면 판(헤더·브레드크럼·이벤트 현황)은 따라 넓어지는데, 그 **안쪽** 조각 중
     Figma 가 1920px 로 못 박아 준 것은 그대로 남아 좌우가 빈다.
     실제로 헤더가 그랬다 — Header > Background(+Fill·Accent Line)와 Header > Content 가
     2560 폭에서 가운데 1920 만 칠해져, 좌우 320px 씩 맨바닥이 드러났다(6화면 공통).

     폭을 매번 다시 재지 않고 **한 번 '고정'을 푼다** — 그러면 부모(판)를 그냥 따라간다:
       · absolute 조각 → left:0 / right:0 / width:auto
         (가운데 맞추려고 걸어 둔 translate 는 걷는다 — 안 걷으면 푼 뒤 왼쪽으로 밀린다)
       · 흐름 안의 조각 → width:100%
     기준 크기(1920)에서는 결과가 원본과 한 픽셀도 다르지 않다(그때는 부모도 1920 이다).
     그래서 '넓어졌을 때만' 이 아니라 늘 걸어 둬도 안전하다. */
  function installWideFit(root, st) {
    var frame = root.firstElementChild;
    if (!frame) return;
    /* 재는 동안은 배율을 끄고 캔버스를 정확히 1920 으로 되돌린다(measureAnchors 와 같은 방식) */
    var s0 = root.style.transform, w0 = root.style.width, h0 = root.style.height;
    root.style.transform = 'none';
    root.style.width = BASE_W + 'px';
    root.style.height = BASE_H + 'px';
    var picks = [];
    /* SOP 화면은 배경 화면 전체가 Figma 그룹(Base Screen, display:contents)에 들어 있다 — 그 안의 판도 같은 줄로 본다
       (안 그러면 넓은 창에서 SOP 화면의 헤더 바탕만 가운데 1920 에 남는다) */
    var blocks = [];
    Array.prototype.forEach.call(frame.children, function (b) {
      if (b.getAttribute('data-name') === 'Base Screen') Array.prototype.forEach.call(b.children, function (c) { blocks.push(c); });
      else blocks.push(b);
    });
    blocks.forEach(function (block) {
      if (block.offsetWidth < BASE_W - 2) return;            /* 가로를 꽉 쓰는 판만 */
      all(block, '*').forEach(function (el) {
        if (!(el instanceof HTMLElement)) return;            /* svg 속은 건드리지 않는다 */
        if (Math.abs(el.offsetWidth - BASE_W) > 1) return;    /* 판을 꽉 채우던 조각만 */
        var cs = getComputedStyle(el);
        /* 정규식을 쓰지 않는다 — 이 묶음은 생성기의 템플릿 문자열 안이라 역슬래시가 한 겹 벗겨져
           괄호를 이스케이프한 정규식이 조용히 안 맞는다(README 함정 ⑫. 여기서 한 번 당했다). */
        var tr = cs.transform || '';
        var mid = false;
        if (tr.slice(0, 7) === 'matrix(') {
          var v = tr.slice(7, tr.length - 1).split(',').map(parseFloat);
          /* 가운데 맞추기 = 기울기·배율 없이 제 폭의 절반만큼 왼쪽으로 민 것 */
          mid = v.length >= 6 && v[0] === 1 && v[1] === 0 && v[2] === 0 && v[3] === 1
            && Math.abs(v[4] + el.offsetWidth / 2) < 2;
        }
        picks.push({ el: el, abs: cs.position === 'absolute', mid: mid });
      });
    });
    root.style.transform = s0; root.style.width = w0; root.style.height = h0;
    if (!picks.length) return;

    picks.forEach(function (p) {
      if (p.abs) {
        p.el.style.left = '0px';
        p.el.style.right = '0px';
        p.el.style.width = 'auto';
        if (p.mid) p.el.style.transform = 'none';
      } else {
        p.el.style.width = '100%';
      }
    });
    st.cleanup.push(function () {
      picks.forEach(function (p) {
        ['left', 'right', 'width', 'transform'].forEach(function (k) { p.el.style.removeProperty(k); });
      });
    });
    st.wideFit = picks.length;
  }

  /* ══════════════════ '여기 눌린다'는 표시 ══════════════════
     클릭을 붙이는 장치는 전부 이 함수를 통과한다 — 손가락 커서 · 키보드 초점 · 스크린리더 역할을
     한 자리에서 준다. 호버 틴트(pk-hot)가 없는 자리(층 버튼 · 팝업 X · 분류 머리글 …)도 커서는 바뀐다.
     새 장치를 더할 때도 여기만 부르면 표시가 빠지지 않는다. */
  function clickable(el, title, role) {
    if (!el) return el;
    el.classList.add('pk-click');
    if (!el.getAttribute('role')) el.setAttribute('role', role || 'button');
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    if (title && !el.title) el.title = title;
    /* 눌림 반응이 **이미 있는** 자리는 그대로 둔다 — 호버 틴트(pk-hot 안쪽 포함)와
       층 버튼(원본 btn-floor 의 파란 그라디언트). 아무 반응도 없던 자리에만 '밝아짐'을 준다
       (팝업 X · 알림의 확인 단추처럼 커서만 바뀌면 눌리는지 확신이 안 선다). */
    try {
      var own = el.matches('[data-name="Floor Item"],[data-name="btn-list-category-floor"]');
      if (!own && !el.closest('.pk-hot')) el.classList.add('pk-lit');
    } catch (e) {}
    return el;
  }
  /* 되돌리기 — dispose 때 원래대로 */
  function unclickable(el) {
    if (!el) return;
    el.classList.remove('pk-click', 'pk-lit');
    ['role', 'tabindex', 'title', 'aria-expanded', 'aria-checked'].forEach(function (a) { el.removeAttribute(a); });
  }

  /* ══════════════════ 층 고르기 ══════════════════
     원본에는 '선택된 층'이 박혀 있지 않다(전부 defalut 상태). 그래서 고른 층에는
     Figma btn-floor Status=active 의 겉모습을 CSS 로 입힌다(위 스타일 묶음 참고). */
  function installFloorPick(root, st) {
    var items = all(root, '[data-name="Floor Item"],[data-name="btn-list-category-floor"]');
    if (!items.length) return;
    var cur = null;
    items.forEach(function (el) {
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      clickable(el, '이 층 보기');
      var h = function (e) {
        if (e) e.preventDefault();
        if (editing()) return;
        if (cur) cur.classList.remove('pk-on');
        cur = el === cur ? null : el;
        if (cur) cur.classList.add('pk-on');
      };
      var key = function (e) { if (e.key === 'Enter' || e.key === ' ') h(e); };
      el.addEventListener('click', h);
      el.addEventListener('keydown', key);
      st.cleanup.push(function () {
        el.removeEventListener('click', h); el.removeEventListener('keydown', key);
        el.classList.remove('pk-on'); unclickable(el);
      });
    });
  }

  /* ══════════════════ 화면끼리 잇기 ══════════════════
     여섯 장은 한 시스템의 여섯 화면이다. 원본에 이미 '옮겨 간다'는 뜻으로 그려 둔 자리가 있으므로
     **새 단추를 만들지 않고** 그 자리를 실제 이동에 잇는다.
       · 왼쪽 나브 — **글자로 잡는다**. 레이어 이름이 화면마다 다르다
         (Nav Item/Overview (Selected) · item01_on · item02_off · item01_off …) — 이름으로 잡으면 새 화면에서 어긋난다.
         종합현황 → overview · 출입동선 → route · 부지이동 → main · 전체보기 → floors.
         '기본위치'는 시점 되돌리기라 이동이 아니다 — 고르기(installPick)만 남긴다.
       · 브레드크럼 — 'KDB 부지' → main(부지) · 'KDB 본관' → floors(그 건물의 전체 층)
       · 헤더 로고 → main
       · Ack 단추 → ack. 단 그 화면에 알림창이 **없을 때만** — 있으면 그 자리에서 팝업이 뜨는 게 맞다.
       · 층 항목 → detail(단층) · 건물 라벨 → floors(전체층)
     **지금 화면과 같은 곳으로는 잇지 않는다** — 그래야 종합현황 화면의 나브가 '팝업 열기'로 남고,
     전체층 화면의 '본관'이 제자리 이동으로 깜빡이지 않는다.
     스튜디오 안에서는 window.__gotoPoscoScene(형제 화면이 있으면 그 화면으로, 없으면 제자리 교체)이,
     낱장 미리보기로 열었을 때는 파일 이동이 맡는다. */
  var PAGE = { main: 'main.html', ack: 'ack.html', overview: 'overview.html', route: 'route.html', floors: 'floors.html', detail: 'detail.html', sop: 'sop.html' };
  var SCENE_NAME = { main: '메인', ack: 'Ack 알림', overview: '종합현황', route: '출입동선', floors: '전체층', detail: '단층', sop: 'SOP' };
  var NAV_TO = [['종합현황', 'overview'], ['출입동선', 'route'], ['부지이동', 'main'], ['전체보기', 'floors']];

  function sceneOf(root) {
    var s = one(root, '[data-name^="Screen/"]');
    var n = (s && s.dataset.name) || '';
    if (n.indexOf('SOP') >= 0) return 'sop';
    if (n.indexOf('Ack') >= 0) return 'ack';
    if (n.indexOf('Overview') >= 0) return 'overview';
    if (n.indexOf('Access Route') >= 0) return 'route';
    if (n.indexOf('All Floors') >= 0) return 'floors';
    if (n.indexOf('Floor Detail') >= 0) return 'detail';
    return 'main';
  }
  function goScene(to) {
    if (typeof window.__gotoPoscoScene === 'function') { window.__gotoPoscoScene(to); return; }
    if (typeof window.__openPoscoScreen === 'function') { window.__openPoscoScreen(to); return; }
    if (PAGE[to]) window.location.href = './' + PAGE[to] + (window.location.search || '');
  }

  function installGo(root, st) {
    var cur = sceneOf(root);
    var bind = function (el, to) {
      if (!el || !to || to === cur || el.__pkGo) return;
      el.__pkGo = 1;
      var had = el.classList.contains('pk-click');   /* 다른 장치가 이미 잡은 자리면 표시를 도로 걷지 않는다 */
      clickable(el, SCENE_NAME[to] + ' 화면으로 이동');
      var h = function (e) {
        if (editing()) return;                       /* 글자 고치는 중에는 안 옮긴다 */
        if (e) e.preventDefault();
        goScene(to);
      };
      var key = function (e) { if (e.key === 'Enter' || e.key === ' ') h(e); };
      el.addEventListener('click', h);
      el.addEventListener('keydown', key);
      st.cleanup.push(function () {
        el.removeEventListener('click', h); el.removeEventListener('keydown', key);
        el.__pkGo = 0; if (!had) unclickable(el);
      });
    };

    all(root, '[data-name="Nav Bar"] > *').forEach(function (el) {
      var t = el.textContent || '';
      for (var i = 0; i < NAV_TO.length; i++) if (t.indexOf(NAV_TO[i][0]) >= 0) { bind(el, NAV_TO[i][1]); return; }
    });
    bind(one(root, '[data-name="Item/Site"]'), 'main');
    bind(one(root, '[data-name="Item/Building"]'), 'floors');
    bind(one(root, '[data-name="Logo"]'), 'main');
    if (!one(root, '[data-name="ack-popup"]')) all(root, '[data-name="Button/Ack"]').forEach(function (el) { bind(el, 'ack'); });
    all(root, '[data-name="Floor Item"],[data-name="btn-list-category-floor"]').forEach(function (el) { bind(el, 'detail'); });
    all(root, '[data-name="Building Label"]').forEach(function (el) { bind(el, 'floors'); });
    /* 헤더 SOP 메뉴 → SOP 대응 절차 화면(STEP 1~3) */
    all(root, '[data-name^="Menu Item/"]').forEach(function (el) { if ((el.textContent || '').trim() === 'SOP') bind(el, 'sop'); });
  }

  /* ══════════════════ 팝업 여닫기 ══════════════════
     X(닫기)를 누르면 닫히고, 그 팝업을 불러내는 자리를 누르면 다시 열린다.
     '닫기'만 있고 '열기'가 없으면 시안에서 판 하나가 영영 사라진다 — 그래서 짝을 반드시 적는다.
     지우지 않고 **감춘다**(opacity/scale). 글자 편집(패널편집)은 감춘 판의 글자를 못 잡으므로,
     편집을 켜면 전부 도로 펴 준다(아래 every(600) 참고). */
  var POPUPS = [
    {
      name: '종합현황',
      sel: '[data-name="Popup/Overview"]',
      close: '[data-name="Button/Close"]',
      /* 왼쪽 위 나브의 **종합현황 항목**을 누르면 다시 열린다.
         예전엔 나브 전체(Nav Bar > *)로 잡아 두어 옆의 '출입동선'을 눌러도 종합현황이 떴다
         — 화면 이동(installGo)을 붙이면서 드러났다. 팝업은 제 이름이 붙은 자리에만 맨다. */
      open: ['[data-name^="Nav Item/Overview"]'],
    },
    {
      name: '이벤트 리스트',
      sel: '[data-name="Popup/Event List"]',
      close: '[data-name="Button/Close"]',
      /* 종합현황 표의 줄(층)을 누르면 그 층의 이벤트 목록이 뜬다 */
      open: ['[data-name="Popup/Overview"] [data-name="Rows"] > [data-name="Row"]'],
    },
    {
      name: '자산 상세',
      sel: '[data-name="Popup/Asset Detail"]',
      /* 이 팝업의 X 는 원격 마스터라 이름이 그냥 Icon 이다(제목 줄 안) */
      close: '[data-name="popup01-title"] [data-name="Icon"]',
      open: ['[data-name="Item"]', '[data-name="Item (Selected)"]'],
      /* 연 자산의 이름을 제목과 '자산명' 칸에 넣는다 — 시계와 같은 '살아 있는 글자' */
      onOpen: function (pop, from) {
        var name = (from.textContent || '').trim();
        if (!name) return;
        /* 반드시 **글자 노드(p)** 를 집을 것 — 같은 이름(popup01-txt)의 래퍼 div 가 하나 더 있는데
           거기에 textContent 를 쓰면 안쪽 p 가 통째로 날아가(편집 대상도 사라진다). */
        /* 대괄호 안만 갈아 끼운다. 정규식을 쓰지 않는 이유 — 이 묶음은 생성기의 템플릿 문자열 안이라
           역슬래시가 한 겹 벗겨져, 대괄호를 이스케이프한 정규식이 엉뚱한 문자군으로 나간다
           (그래서 한 번 조용히 안 먹었다. 이 묶음 안에서는 역따옴표도 쓰면 안 된다). */
        var t = one(pop, 'p[data-name="popup01-txt"]');
        var s = t ? t.textContent : '';
        var i = s.indexOf('['), j = s.lastIndexOf(']');
        if (t && i >= 0 && j > i) t.textContent = s.slice(0, i + 1) + name + s.slice(j);
        var v = one(pop, 'p[data-node-id$="352:14355;241:78269;241:78234"]');
        if (v) v.textContent = name;
      },
    },
    {
      name: 'Ack 알림',
      sel: '[data-name="ack-popup"]',
      /* '확인' 단추가 닫기다(X 가 없는 알림창) */
      close: '[data-name="btn"]',
      open: ['[data-name="Button/Ack"]'],
    },
  ];

  function installPopups(root, st) {
    var pops = [];
    POPUPS.forEach(function (P) {
      var pop = one(root, P.sel);
      if (!pop) return;
      pop.classList.add('pk-pop');
      var set = function (on) {
        pop.classList.toggle('pk-pop-off', !on);
        pop.setAttribute('aria-hidden', on ? 'false' : 'true');
      };
      pops.push({ pop: pop, set: set, isOpen: function () { return !pop.classList.contains('pk-pop-off'); } });

      all(pop, P.close).forEach(function (btn) {
        clickable(btn, P.name + ' 닫기');
        var h = function (e) {
          if (e) { e.preventDefault(); e.stopPropagation(); }
          if (editing()) return;               /* 글자 고치는 중에는 닫지 않는다 */
          set(false);
        };
        var key = function (e) { if (e.key === 'Enter' || e.key === ' ') h(e); };
        btn.addEventListener('click', h);
        btn.addEventListener('keydown', key);
        st.cleanup.push(function () { btn.removeEventListener('click', h); btn.removeEventListener('keydown', key); unclickable(btn); });
      });

      (P.open || []).forEach(function (sel) {
        all(root, sel).forEach(function (el) {
          if (pop.contains(el)) return;        /* 자기 안에서 여는 일은 없다 */
          clickable(el, P.name + ' 열기');
          var h = function () {
            if (editing()) return;
            set(true);
            if (P.onOpen) { try { P.onOpen(pop, el); } catch (e) {} }
          };
          el.addEventListener('click', h);
          st.cleanup.push(function () { el.removeEventListener('click', h); unclickable(el); });
        });
      });
    });
    if (!pops.length) return;

    /* Esc — 열려 있는 것 중 맨 나중 것을 닫는다 */
    var esc = function (e) {
      if (e.key !== 'Escape' || editing()) return;
      for (var i = pops.length - 1; i >= 0; i--) if (pops[i].isOpen()) { pops[i].set(false); return; }
    };
    document.addEventListener('keydown', esc);

    /* 패널편집을 켜면 감춰 둔 판도 도로 펴 준다 — 안 그러면 그 안의 글자를 고칠 수 없다 */
    var id = every(600, function () { if (editing()) pops.forEach(function (p) { p.set(true); }); });

    st.cleanup.push(function () {
      document.removeEventListener('keydown', esc);
      clearInterval(id);
      pops.forEach(function (p) { p.set(true); p.pop.classList.remove('pk-pop'); });
    });
  }

  /* ══════════════════ 아이콘 타일 고르기 ══════════════════
     좌상단 나브(부지이동·전체보기·기본위치 / 종합현황·출입동선)와 분류 바(CCTV·출입·소방·도청).
     이 자리들은 원본에 '켜진 모습'이 **그림째** 따로 그려져 있어(chart.svg ↔ group-28.svg) 겉모습을
     맞바꿀 수 없다 — 그림을 바꾸면 다른 기능의 아이콘이 되어 버린다. 그래서 켜진 자리에는
     시안이 쓰는 파랑(#016eeb — btn-floor Status=hover 값)으로 빛만 얹는다. */
  var PICK_GROUPS = ['[data-name^="item0"]', '[data-name^="item-"]', '[data-name="Nav Bar"] > *'];
  /* 이 타일이 어느 화면을 뜻하는가 — 왼쪽 나브에 한해서(글자로 잡는다, installGo 와 같은 표) */
  function navSceneOf(el) {
    var p = el.parentElement;
    if (!p || (p.dataset.name || '') !== 'Nav Bar') return null;
    var t = el.textContent || '';
    for (var i = 0; i < NAV_TO.length; i++) if (t.indexOf(NAV_TO[i][0]) >= 0) return NAV_TO[i][1];
    return null;
  }

  function installPick(root, st) {
    var cur0 = sceneOf(root);
    st.picks = [];
    PICK_GROUPS.forEach(function (sel) {
      groupSiblings(root, sel).forEach(function (items) {
        if (items.length < 2) return;
        var cur = null;
        /* 고르기를 **밖에서도** 부를 수 있게 따로 뺀다 — 분류 탭 바는 자산리스트와 짝이라
           목록에서 분류를 펴면 탭도 따라 움직여야 한다(installTree 가 st.setPick 으로 부른다). */
        var pick = function (el) {
          if (cur) cur.classList.remove('pk-picked');
          cur = el || null;
          if (cur) cur.classList.add('pk-picked');
        };
        var mine = [];
        items.forEach(function (el) {
          if (el.classList.contains('pk-pick')) return;   /* 다른 묶음에서 이미 잡았다(나브는 두 선택자에 걸린다) */
          mine.push(el);
          el.classList.add('pk-pick');
          clickable(el);
          var h = function (e) {
            if (e) e.preventDefault();
            if (editing()) return;
            pick(el === cur ? null : el);
            if (st.onPick) { try { st.onPick(el); } catch (err) {} }
          };
          var key = function (e) { if (e.key === 'Enter' || e.key === ' ') h(e); };
          el.addEventListener('click', h);
          el.addEventListener('keydown', key);
          st.cleanup.push(function () {
            el.removeEventListener('click', h); el.removeEventListener('keydown', key);
            el.classList.remove('pk-pick', 'pk-picked'); unclickable(el);
          });
        });
        if (!mine.length) return;
        st.picks.push({ items: mine, pick: pick });
        /* **지금 보고 있는 화면**과 짝인 나브 타일은 처음부터 골라 둔 것으로 — 원본 그림에는
           '켜진 출입동선'이 없어(그림째 따로다) 어느 화면에 있는지 알 길이 없었다.
           색을 새로 짓지 않고, 누를 때 쓰는 그 파란 빛을 그대로 미리 얹는다. */
        mine.forEach(function (el) { if (navSceneOf(el) === cur0) pick(el); });
      });
    });
    /* 밖에서 고르기 — 그 타일이 든 묶음을 찾아 그 묶음의 방식으로 고른다 */
    st.setPick = function (el) {
      for (var i = 0; i < st.picks.length; i++) {
        if (st.picks[i].items.indexOf(el) >= 0) { st.picks[i].pick(el); return true; }
      }
      return false;
    };
    st.clearPick = function (list) {
      for (var i = 0; i < st.picks.length; i++) {
        if (st.picks[i].items.indexOf(list) >= 0) { st.picks[i].pick(null); return true; }
      }
      return false;
    };
  }

  /* ══════════════════ 헤더 메뉴 고르기 ══════════════════
     SOP · 운영현황 · 에디터 · 관리자 · 로그아웃. 켜진 것(SOP)과 꺼진 것의 **속 구조가 달라**
     겉모습 맞바꾸기(installSelect)가 거부한다. 그래서 색을 새로 짓지 않고 **이 화면에서 읽어 둔**
     켜짐/꺼짐 값(판 색 · 글자색)을 그대로 옮긴다. */
  function installMenuPick(root, st) {
    var items = all(root, '[data-name^="Menu Item/"]');
    if (items.length < 2) return;
    var look = function (el) {
      var p = one(el, 'p');
      return { bg: getComputedStyle(el).backgroundColor, fg: p ? getComputedStyle(p).color : null };
    };
    /* 켜진 것 = 판 색이 가장 선명한 것(원본은 SOP) */
    var onIdx = 0, best = -1;
    items.forEach(function (el, i) { var s = sat(getComputedStyle(el).backgroundColor); if (s > best) { best = s; onIdx = i; } });
    var ON = look(items[onIdx]);
    var OFF = look(items[(onIdx + 1) % items.length]);
    if (!ON.fg || !OFF.fg || ON.bg === OFF.bg && ON.fg === OFF.fg) return;   /* 구분이 없으면 건드리지 않는다 */
    var paint = function (el, L) {
      el.style.backgroundColor = L.bg;
      all(el, 'p').forEach(function (p) { p.style.color = L.fg; });
    };
    var cur = items[onIdx];
    items.forEach(function (el) {
      var h = function (e) {
        if (e) e.preventDefault();
        if (editing() || el === cur) return;
        paint(cur, OFF);
        paint(el, ON);
        cur = el;
      };
      var key = function (e) { if (e.key === 'Enter' || e.key === ' ') h(e); };
      clickable(el);
      el.addEventListener('click', h);
      el.addEventListener('keydown', key);
      st.cleanup.push(function () {
        el.removeEventListener('click', h); el.removeEventListener('keydown', key);
        el.style.removeProperty('background-color');
        all(el, 'p').forEach(function (p) { p.style.removeProperty('color'); });
        unclickable(el);
      });
    });
  }

  /* ══════════════════ 표의 줄 고르기 ══════════════════
     원본 출입동선 표에는 '고른 줄'이 그려져 있다 — 칸(Td)마다 rgba(25,78,214,.3) 이 깔린다.
     색을 새로 짓지 않고 그 값을 그대로 쓴다(화면에 그 줄이 있으면 실측해서, 없으면 아래 기본값).
     installSelect(겉모습 맞바꾸기)로는 안 된다 — 출입동선 표의 나머지 줄은 '빈 줄'이라
     맞바꾸면 내용이 딸려 옮겨 간다. 그래서 칸 색만 옮긴다. */
  var ROW_ON = 'rgba(25, 78, 214, 0.3)';       /* Figma: Row (Selected) 의 Td 배경 */
  function installRowSelect(root, st) {
    var ref = one(root, '[data-name="Row (Selected)"]');
    var refCell = ref && one(ref, '[data-name^="Td/"]');
    var ON = refCell ? getComputedStyle(refCell).backgroundColor : ROW_ON;
    var cells = function (row) { return all(row, '[data-name^="Td/"]'); };
    all(root, '[data-name="Rows"]').forEach(function (rows) {
      var items = Array.prototype.filter.call(rows.children, function (c) { return /^Row/.test(c.dataset.name || ''); });
      if (items.length < 2) return;
      /* 빈 줄만 있는 표(출입동선)는 고를 것이 없다 — 글자가 있는 줄이 둘 이상일 때만 붙인다 */
      var filled = items.filter(function (r) { return (r.textContent || '').trim().length > 0; });
      if (filled.length < 2) return;
      var off = null;
      var plain = filled.find(function (r) { return !/(Selected)/.test(r.dataset.name || ''); });
      var plainCell = plain && one(plain, '[data-name^="Td/"]');
      if (plainCell) off = getComputedStyle(plainCell).backgroundColor;
      var cur = items.find(function (r) { return /(Selected)/.test(r.dataset.name || ''); }) || null;
      var paint = function (row, color) {
        cells(row).forEach(function (td) {
          if (color) td.style.backgroundColor = color; else td.style.removeProperty('background-color');
        });
      };
      filled.forEach(function (row) {
        var h = function () {
          if (editing() || row === cur) return;
          if (cur) paint(cur, off);            /* 앞서 골라 둔 줄은 보통 줄 색으로 */
          paint(row, ON);
          cur = row;
        };
        row.addEventListener('click', h);
        st.cleanup.push(function () { row.removeEventListener('click', h); paint(row, null); });
      });
    });
  }

  /* ══════════════════ 라디오(비인가 · 일반) ══════════════════
     두 항목은 판 색이 똑같고 **점 그림만** 다르다(켜진 점 ↔ 빈 점). 그래서 겉모습 비교로는
     어느 쪽이 켜졌는지 못 가린다 → 점 그림을 서로 맞바꾼다(원본 두 그림 그대로). */
  var RADIOS = [['[data-name="Item/Unauthorized"]', '[data-name="Item/General"]']];
  function installRadio(root, st) {
    RADIOS.forEach(function (pair) {
      var els = pair.map(function (s) { return one(root, s); }).filter(Boolean);
      if (els.length < 2) return;
      var cur = els[0];
      els.forEach(function (el) {
        var h = function (e) {
          if (e) e.preventDefault();
          if (editing() || el === cur) return;
          var a = one(el, 'img'), b = one(cur, 'img');
          if (a && b) swapSrc(a, b);
          el.setAttribute('aria-checked', 'true');
          cur.setAttribute('aria-checked', 'false');
          cur = el;
        };
        var key = function (e) { if (e.key === 'Enter' || e.key === ' ') h(e); };
        clickable(el, null, 'radio');
        el.addEventListener('click', h);
        el.addEventListener('keydown', key);
        st.cleanup.push(function () { el.removeEventListener('click', h); el.removeEventListener('keydown', key); unclickable(el); });
      });
    });
  }

  /* ══════════════════ 자산리스트 — 분류를 한 번에 하나씩 ══════════════════
     자산리스트 판(Widget/Asset List)은 **위의 분류 탭 바(CCTV · 출입 · 소방 · 도청)와 한 벌**인데
     둘이 이어져 있지 않았다 — 탭은 파란 빛만 얹히고 목록은 늘 소방센서(20) 그대로였고,
     목록의 'CCTV(97)' 은 마우스만 반응하고 눌러도 아무 일이 없었다(목록이 딸린 분류만 접혔다).
     이제 셋을 한 벌로 묶는다.
       · 분류는 **한 번에 하나만 펴진다** — 하나를 열면 같은 판의 나머지는 접힌다(탭처럼 한 단씩).
       · 목록이 없는 분류도 **눌리는 자리**다(줄 전체가 머리글, 초점 · 손가락 커서 · aria-expanded).
       · 탭 바를 누르면 그 분류로 들어가고, 목록에서 분류를 열면 탭 바가 따라 움직인다.
     원본에 목록이 있는 분류는 CCTV · 소방 둘뿐이다. 출입 · 도청 탭에는 보여 줄 목록이 없으므로
     **없는 목록을 지어내지 않고** 분류를 전부 접는다. */
  /* 분류 이름의 뒷자락 — Category/Fire Sensor (Expanded) → 'fire sensor (expanded)' */
  function catKey(cat) {
    var n = cat.dataset.name || '';
    var k = n.indexOf('/');
    return (k >= 0 ? n.slice(k + 1) : n).toLowerCase();
  }
  /* 분류 탭 타일의 이름 — item-cctv_off → 'cctv' (원본이 붙여 둔 이름을 그대로 쓴다) */
  function tabKey(tile) {
    var inner = one(tile, '[data-name^="item-"]');
    var n = inner ? (inner.dataset.name || '') : '';
    n = n.split('item-').join('');
    var u = n.indexOf('_');
    if (u >= 0) n = n.slice(0, u);
    return n.toLowerCase();
  }

  function installTree(root, st) {
    var cats = all(root, '[data-name^="Category/"]');
    if (!cats.length) return;
    var reg = [];
    cats.forEach(function (cat) {
      /* 머리글이 따로 없는 분류(접힌 CCTV)는 **그 줄 전체**가 머리글이다 — 안 그러면
         글자 위를 눌렀을 때 바탕(Background)까지 클릭이 안 내려가 '눌리지 않는 분류'가 된다. */
      var head = one(cat, '[data-name="Header"]') || cat;
      var items = Array.prototype.filter.call(cat.children, function (c) { return /^Item/.test(c.dataset.name || ''); });
      var chev = one(cat, '[data-name="Icon/Action/Chevron"]');
      if (chev) chev.classList.add('pk-chev');
      /* 높이는 배율을 안 타는 offsetHeight 로 잰다(화면이 축소돼 있어도 같은 값) */
      var full = cat.offsetHeight, shut = head === cat ? full : head.offsetHeight;
      if (items.length) { cat.classList.add('pk-fold-list'); cat.style.height = full + 'px'; }
      var e = { cat: cat, head: head, chev: chev, items: items, full: full, shut: shut, key: catKey(cat), open: !!items.length };
      e.apply = function () {
        if (e.items.length) {
          e.cat.style.height = (e.open ? e.full : e.shut) + 'px';
          e.items.forEach(function (x) { x.classList.toggle('pk-fadeout', !e.open); });
        }
        if (e.chev) e.chev.classList.toggle('pk-chev-off', !e.open);
        e.head.setAttribute('aria-expanded', e.open ? 'true' : 'false');
      };
      reg.push(e);
    });
    if (!reg.length) return;

    /* 분류 탭 바(CCTV · 출입 · 소방 · 도청) — 원본 이름으로 목록의 분류와 짝을 맞춘다.
       'cctv' ↔ Category/CCTV, 'fire' ↔ Category/Fire Sensor. 짝이 없는 탭(출입 · 도청)은
       원본에 목록이 아예 없다 — 없는 목록을 지어내지 않고, 고르면 분류를 전부 접는다. */
    var bar = all(root, '[data-name="Category Bar"] > *');
    var tabOf = function (key) {
      if (!key) return null;
      for (var i = 0; i < bar.length; i++) if (key.indexOf(tabKey(bar[i])) === 0 && tabKey(bar[i])) return bar[i];
      return null;
    };
    var catOfTab = function (tile) {
      var k = tabKey(tile);
      if (!k) return null;
      for (var i = 0; i < reg.length; i++) if (reg[i].key.indexOf(k) === 0) return reg[i];
      return null;
    };
    var syncBar = function (e) {
      if (!st.setPick || !bar.length) return;
      var tile = e ? tabOf(e.key) : null;
      if (tile) st.setPick(tile);
      else if (st.clearPick && bar[0]) st.clearPick(bar[0]);
    };

    /* **한 번에 하나만 편다** — 한 판(Body) 안의 분류는 탭처럼 서로를 밀어낸다.
       예전엔 각 분류가 따로 놀아, 열려 있는 분류 위에 또 열려 '어디로 들어간 건지' 알 수 없었다. */
    var show = function (e) {
      reg.forEach(function (x) { if (x.cat.parentElement === e.cat.parentElement) x.open = (x === e); });
      reg.forEach(function (x) { x.apply(); });
      syncBar(e);
      if (st.rowHot) setTimeout(st.rowHot, 340);         /* 접히면 잘리는 줄도 바뀐다 */
    };
    var shutAll = function (p) {
      reg.forEach(function (x) { if (!p || x.cat.parentElement === p) x.open = false; });
      reg.forEach(function (x) { x.apply(); });
      if (st.rowHot) setTimeout(st.rowHot, 340);
    };

    /* 처음 모습을 한 번 찍어 둔다 — 셰브론 방향과 aria-expanded 가 목록 상태와 맞아야
       읽는 기계도 '지금 펴진 분류'를 안다(예전엔 누르기 전까지 둘이 어긋나 있었다). */
    reg.forEach(function (x) { x.apply(); });

    reg.forEach(function (e) {
      var h = function (ev) {
        if (ev) ev.preventDefault();
        if (editing()) return;
        if (e.open) { e.open = false; e.apply(); syncBar(null); if (st.rowHot) setTimeout(st.rowHot, 340); }
        else show(e);
      };
      var key = function (ev) { if (ev.key === 'Enter' || ev.key === ' ') h(ev); };
      clickable(e.head, '이 분류 열기 / 닫기');
      e.head.addEventListener('click', h);
      e.head.addEventListener('keydown', key);
      st.cleanup.push(function () {
        e.head.removeEventListener('click', h); e.head.removeEventListener('keydown', key);
        unclickable(e.head);
        e.cat.classList.remove('pk-fold-list'); e.cat.style.removeProperty('height');
        e.items.forEach(function (x) { x.classList.remove('pk-fadeout'); });
        if (e.chev) e.chev.classList.remove('pk-chev', 'pk-chev-off');
      });
    });

    /* 탭 바를 누르면 그 분류로 들어간다(installPick 이 고른 뒤에 불러 준다) */
    if (bar.length) {
      var prev = st.onPick;
      st.onPick = function (el) {
        if (prev) { try { prev(el); } catch (err) {} }
        if (bar.indexOf(el) < 0) return;
        var e = catOfTab(el);
        if (e) show(e);
        else shutAll(reg[0].cat.parentElement);          /* 그 분류의 목록이 원본에 없다 */
      };
      st.cleanup.push(function () { st.onPick = prev; });
      /* 처음 화면에서 펴져 있는 분류(소방센서)에 탭 바를 맞춰 둔다 — 원본은 넷 다 꺼진 그림이라
         목록은 소방센서를 보여 주는데 탭은 아무것도 안 골라진 상태였다. */
      var open0 = null;
      reg.forEach(function (x) { if (x.open && !open0) open0 = x; });
      if (open0) syncBar(open0);
    }
  }

  /* ══════════════════ 접기·펴기 ══════════════════ */

  /* ① 이벤트 현황(하단 바) — Fold 단추를 누르면 머리글만 남기고 서랍처럼 내려간다.
     내려갈 양은 '재서' 정한다(머리글 아래부터 판 끝까지). */
  function installFold(root, st) {
    var panel = one(root, '[data-name^="Event Panel"]');
    if (!panel) return;
    var btn = one(panel, '[data-name="Button/Dropdown"]');
    if (!btn) return;
    panel.classList.add('pk-eventlog');
    var head = one(panel, '[data-name="Header"]');
    var lift = function () {
      var pr = panel.getBoundingClientRect(), k = pr.height / (panel.offsetHeight || 1) || 1;
      if (!head) return Math.round(panel.offsetHeight * 0.72);
      var hr = head.getBoundingClientRect();
      return Math.max(0, Math.round(panel.offsetHeight - ((hr.bottom - pr.top) / k + 18)));
    };
    var open = true;
    var apply = function () {
      panel.style.setProperty('--pk-lift', (open ? 0 : lift()) + 'px');
      btn.classList.toggle('pk-flip', !open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.title = open ? '이벤트 현황 접기' : '이벤트 현황 펼치기';
    };
    btn.classList.add('pk-foldbtn');
    clickable(btn);
    var toggle = function (e) {
      if (e) e.preventDefault();
      if (editing()) return;
      open = !open;
      apply();
      /* 서랍이 다 내려간 뒤 — 판 밖으로 나간 줄에서 호버를 걷는다(위 markRowsHot) */
      if (st.rowHot) setTimeout(st.rowHot, 460);
    };
    var key = function (e) { if (e.key === 'Enter' || e.key === ' ') toggle(e); };
    btn.addEventListener('click', toggle);
    btn.addEventListener('keydown', key);
    apply();
    st.cleanup.push(function () {
      btn.removeEventListener('click', toggle); btn.removeEventListener('keydown', key);
      panel.classList.remove('pk-eventlog'); panel.style.removeProperty('--pk-lift'); unclickable(btn);
    });
    st.refold = apply;
  }

  /* ② 좌측 층 선택 패널 · 우측 자산정보현황 — 접기 단추를 누르면 제목만 남는다
        (Figma 의 content01 Status=close 와 같은 모습). 높이는 재서 정한다. */
  function installCollapse(root, st) {
    /* 접기 단추는 Figma 컴포넌트(Button/Collapse)라 뿌리에 data-name 이 없다 → 노드 id 로 찾는다.
       층 선택 쪽은 인스턴스에 걸린 회전(-90°)이 design context 에 안 실려 있어 rot 로 세워 준다. */
    [
      { host: '[data-node-id$="17:9544"]', btn: '[data-node-id$="17:13303"]', body: '[data-node-id$="17:9453"]',
        keep: '[data-name="Widget Title"]', hide: '[data-name="Groups"]', rot: true },
      { host: '[data-name="Widget/Asset Summary"]', btn: '[data-name="btn-arrow"]', body: '[data-name="section"]',
        keep: '[data-name="title"]', hide: null, rot: false },
    ].forEach(function (S) {
      var host = one(root, S.host);
      if (!host) return;
      var btn = one(host, S.btn) || one(host, '[data-name="Button/Collapse"]');
      var body = one(host, S.body) || host.firstElementChild;
      var keep = S.keep ? one(host, S.keep) : null;
      if (!btn || !body || !keep) return;
      if (S.rot) btn.classList.add('pk-rot90');
      btn.classList.add('pk-foldbtn');
      var full = body.offsetHeight;
      var hostFull = host.offsetHeight;
      /* 접었을 때의 높이 = 제목 아래까지 + 원본 패딩 */
      var pr = body.getBoundingClientRect(), kr = keep.getBoundingClientRect();
      var k = pr.height / (body.offsetHeight || 1) || 1;
      var shut = Math.max(28, Math.round((kr.bottom - pr.top) / k + 12));
      /* 접었을 때 감출 것 — 표에 적힌 자리가 있으면 그것, 없으면 '제목이 아닌 본문 묶음' */
      var hidden = S.hide ? all(host, S.hide)
        : Array.prototype.filter.call(body.children, function (el) { return el !== keep && !el.contains(keep); });
      hidden.forEach(function (el) { el.classList.add('pk-fadeout'); });
      body.classList.add('pk-collapsible');
      body.style.height = full + 'px';
      var open = true;
      var apply = function () {
        body.style.height = (open ? full : shut) + 'px';
        host.classList.toggle('pk-collapsed', !open);
        body.classList.toggle('pk-collapsed', !open);
        btn.classList.toggle('pk-flip', !open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (!S.rot) host.style.height = (open ? hostFull : shut) + 'px';
      };
      clickable(btn, '접기 / 펴기');
      var toggle = function (e) { if (e) e.preventDefault(); if (editing()) return; open = !open; apply(); };
      var key = function (e) { if (e.key === 'Enter' || e.key === ' ') toggle(e); };
      btn.addEventListener('click', toggle);
      btn.addEventListener('keydown', key);
      st.cleanup.push(function () {
        btn.removeEventListener('click', toggle); btn.removeEventListener('keydown', key);
        body.classList.remove('pk-collapsible', 'pk-collapsed'); body.style.height = '';
        host.classList.remove('pk-collapsed'); host.style.height = '';
        hidden.forEach(function (el) { el.classList.remove('pk-fadeout'); });
        unclickable(btn);
      });
    });
  }

  /* ══════════════════ 알림 티커 ══════════════════
     이 판은 원본 설계상 '티커'다(상자가 overflow:clip 이고 글자는 nowrap).
     그래서 글자는 **늘 흐른다** — 오른쪽에서 들어와 왼쪽으로 빠지고 다시 들어온다.
     · 내용은 지어내지 않는다. 원본 한 줄을 그대로 돌린다.
     · 자리는 transform 이 아니라 CSS translate 속성으로 옮긴다 —
       원본이 걸어 둔 transform: translateY(-50%) 를 덮어쓰면 글자가 위로 튄다.
     · 글자 폭은 conv.js 가 Figma 값(367px)으로 못 박아 두었다. 실제 글자 길이는
       그 안의 <p> 의 scrollWidth 로 잰다(상자와 같아 보여도 실제로는 더 길 수 있다). */
  var TICKER_SPEED = 42;        /* px/초 — 읽히는 속도 */
  var TICKER_GAP = 64;          /* 한 바퀴 사이의 여백 */
  function installTicker(root, st) {
    var box = one(root, '[data-name="ticker_txt"]');
    if (!box) return;
    var txt = box.firstElementChild;
    if (!txt) return;
    var p = txt.querySelector('p') || txt;
    /* 화면이 축소돼 있어도 배치 좌표로 재야 한다 — offset* 은 배율을 타지 않는다 */
    var bw = box.offsetWidth || 0;
    var tw = Math.max(p.scrollWidth || 0, txt.offsetWidth || 0);
    if (!bw || !tw) return;
    txt.classList.add('pk-marquee');
    /* 처음에는 원래 자리에서 시작해 읽히게 두고, 그대로 왼쪽으로 흘러 나간다 */
    var x = 0, raf = 0, last = 0;
    var step = function (now) {
      raf = requestAnimationFrame(step);
      if (!last) { last = now; return; }
      var dt = Math.min(64, now - last); last = now;
      if (editing() || idle()) return;
      x -= dt * TICKER_SPEED / 1000;
      if (x < -(tw + TICKER_GAP)) x = bw;      /* 다 빠지면 오른쪽 끝에서 다시 들어온다 */
      txt.style.translate = x.toFixed(1) + 'px 0';
    };
    raf = requestAnimationFrame(step);
    /* 판 전체도 경보처럼 숨 쉰다(밝기만) */
    var bar = one(root, '[data-name="Alert Ticker"]');
    if (bar) bar.classList.add('pk-tickerbar');
    st.cleanup.push(function () {
      cancelAnimationFrame(raf);
      txt.style.translate = '';
      txt.classList.remove('pk-marquee');
      if (bar) bar.classList.remove('pk-tickerbar');
    });
  }

  /* 알림 티커 왼쪽의 경고 심볼 — 커졌다 작아지고 링이 퍼진다(경보등).
     크기·링만 움직이고 그림·색·자리는 원본 그대로다. */
  function installBeacon(root, st) {
    var sym = one(root, '[data-node-id="1:454"]') || one(root, '[data-name="Alert Ticker"] [data-node-id$="1:454"]');
    if (!sym) return;
    if (getComputedStyle(sym).position === 'static') sym.style.position = 'relative';
    sym.classList.add('pk-beacon');
    st.cleanup.push(function () { sym.classList.remove('pk-beacon'); });
  }

  /* ══════════════════ 라이브 데이터 ══════════════════
     원본 값을 기준으로 작은 폭으로만 흔든다 — 합계가 원본과 크게 어긋나 보이지 않게. */
  function collectCounters(root) {
    var out = [];
    var push = function (el, spread, min) {
      if (!el) return;
      var v = numOf(el.textContent);
      if (v == null) return;
      el.classList.add('pk-num');
      out.push({ el: el, base: v, cur: v, spread: spread, min: min == null ? 0 : min, src: el.textContent });
    };
    /* 이벤트 등급 카운트(CR·MA·MI·WA·NO) — 칩 안의 둘째 글자가 숫자다 */
    all(root, '[data-name^="Count/"]').forEach(function (chip) {
      var ps = all(chip, 'p').filter(function (p) { return numOf(p.textContent) != null; });
      if (ps.length) push(ps[ps.length - 1], 6, 0);
    });
    /* 자산정보현황 — 위 칸이 '이상', 아래 칸이 '전체'. 이상만 흔들고 전체는 거의 그대로 둔다 */
    all(root, '[data-name="Widget/Asset Summary"] [data-name="txt"]').forEach(function (t) {
      var ps = all(t, 'p');
      if (ps[0]) push(ps[0], 4, 0);
      if (ps[1]) push(ps[1], 0.01);
    });
    var seen = [];
    return out.filter(function (c) { if (seen.indexOf(c.el) >= 0) return false; seen.push(c.el); return true; });
  }

  function installCounters(root, st) {
    var cs = collectCounters(root);
    if (!cs.length) return;
    var step = function () {
      if (editing()) return;
      cs.forEach(function (c) {
        if (Math.random() > 0.4) return;
        var span = c.spread < 1 ? Math.max(1, c.base * c.spread) : c.spread;
        var target = clamp(Math.round(c.base + rnd(-span, span)), c.min, c.base + span * 1.6);
        if (Math.abs(target - c.cur) < 0.5) return;
        var from = c.cur;
        c.cur = target;
        tween(900, from, target, function (v) { setNum(c.el, v, c.src); });
      });
    };
    var id = every(3200, step);
    setTimeout(step, 1200);
    st.cleanup.push(function () { clearInterval(id); });
  }

  /* 이벤트 표 — 새 줄이 위로 들어오는 것처럼 보이게 한다.
     줄을 지어내지 않는다: 맨 아래 줄을 맨 위로 옮기고 발생시각만 '지금'으로 다시 찍는다. */
  function installFeed(root, st) {
    var rows = one(root, '[data-name="Rows"]');
    if (!rows) return;
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var stamp = function (row) {
      var cell = one(row, '[data-name="Td/Time"] p') || one(row, '[data-name="Td/Time"]');
      if (!cell) return;
      var d = new Date();
      cell.textContent = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
        + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    };
    var step = function () {
      if (editing()) return;
      var kids = Array.prototype.filter.call(rows.children, function (el) { return el.nodeType === 1; });
      if (kids.length < 2) return;
      var last = kids[kids.length - 1];
      rows.insertBefore(last, rows.firstElementChild);
      stamp(last);
      last.classList.remove('pk-newrow');
      void last.offsetWidth;
      last.classList.add('pk-newrow');
      /* 자리가 한 칸씩 밀렸다 — 이제 어느 줄이 판 밖으로 잘리는지 다시 잰다 */
      if (st.rowHot) st.rowHot();
    };
    var id = every(7000, step);
    st.cleanup.push(function () { clearInterval(id); });
  }

  /* ══════════════════ 날짜 고르기(출입동선 필터) ══════════════════
     시안의 날짜 칸은 '11/15/2024' 라는 **글자**일 뿐이었다 — 달력 아이콘이 그려져 있는데 눌러도
     아무 일이 없고, 날짜는 시안을 만든 날에 멈춰 있었다. 둘 다 고친다.
       ① 열 때마다 **오늘**로 다시 찍는다(이벤트 시각을 다시 찍는 것과 같은 뜻).
          그리고 그 판의 표(출입동선 · 출입내역)도 같은 날로 옮긴다 — 필터가 오늘인데
          목록만 보름 전이면 화면이 앞뒤가 안 맞는다. 줄 사이 간격은 원본 그대로 둔다.
       ② 달력은 **브라우저가 가진 날짜 선택기**를 쓴다. 시안에 달력 판이 그려져 있지 않으므로
          없는 형상을 지어내지 않는다 — 날짜 칸 위에 투명한 input[type=date] 를 덮으면
          누르는 자리는 원본 그대로이고, 키보드로도 열린다.
     글자 모양은 원본을 따른다(구분자 · 연/월/일 차례 · 두 자리 채움까지). */
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function readDate(s) {
    var t = (s || '').trim();
    var sep = t.indexOf('/') >= 0 ? '/' : t.indexOf('-') >= 0 ? '-' : t.indexOf('.') >= 0 ? '.' : null;
    if (!sep) return null;
    var a = t.split(sep);
    if (a.length !== 3) return null;
    var n0 = +a[0], n1 = +a[1], n2 = +a[2];
    if (n0 !== n0 || n1 !== n1 || n2 !== n2) return null;            /* 숫자가 아니다 */
    var ymd = a[0].length === 4;                                     /* 앞이 네 자리면 연도부터 */
    return { y: ymd ? n0 : n2, m: ymd ? n1 : n0, d: ymd ? n2 : n1, sep: sep, ymd: ymd };
  }
  function writeDate(f, y, m, d) {
    return f.ymd ? y + f.sep + pad2(m) + f.sep + pad2(d)
      : pad2(m) + f.sep + pad2(d) + f.sep + y;
  }
  /* 글자를 담은 맨 안쪽 <p> 만 고른다 — 같은 이름의 껍데기에 쓰면 안쪽이 통째로 날아간다
     (팝업 제목에서 한 번 겪었다). */
  function leafText(el) {
    var out = [];
    all(el, 'p').forEach(function (p) { if (!one(p, 'p') && (p.textContent || '').trim()) out.push(p); });
    return out;
  }

  function installDate(root, st) {
    var field = one(root, '[data-name="Date Field"]');
    if (!field) return;
    var txt = leafText(field)[0];
    if (!txt) return;
    var fmt = readDate(txt.textContent);
    if (!fmt) return;

    /* 이 날짜가 다스리는 표 — 날짜 칸이 든 판 안의 시각 칸만(아래 이벤트 현황은 제 시각을 따른다) */
    var panel = field.closest('[data-name^="Panel/"]') || field.closest('[data-name^="Widget/"]');
    var cells = function () {
      if (!panel) return [];
      var out = [];
      all(panel, '[data-name="Td/Time"]').forEach(function (td) {
        leafText(td).forEach(function (p) { out.push(p); });
      });
      return out;
    };
    var moveRows = function (when) {
      if (typeof window.wembRestampTimes !== 'function') return;
      var list = cells();
      if (!list.length) return;
      try { window.wembRestampTimes(list, { now: when.getTime() }); } catch (e) {}
    };

    var apply = function (y, m, d, moveTable) {
      txt.textContent = writeDate(fmt, y, m, d);
      if (moveTable) {
        var t = new Date();
        moveRows(new Date(y, m - 1, d, t.getHours(), t.getMinutes(), t.getSeconds()));
      }
    };

    var now = new Date();
    apply(now.getFullYear(), now.getMonth() + 1, now.getDate(), true);

    var inp = document.createElement('input');
    inp.type = 'date';
    inp.className = 'pk-datepick';
    inp.setAttribute('aria-label', '날짜 고르기');
    inp.value = now.getFullYear() + '-' + pad2(now.getMonth() + 1) + '-' + pad2(now.getDate());
    if (getComputedStyle(field).position === 'static') field.style.position = 'relative';
    field.classList.add('pk-click', 'pk-lit');
    if (!field.title) field.title = '날짜 고르기';
    field.appendChild(inp);

    var onChange = function () {
      if (editing()) return;
      var a = (inp.value || '').split('-');
      if (a.length !== 3) return;
      apply(+a[0], +a[1], +a[2], true);
      if (st.rowHot) setTimeout(st.rowHot, 60);
    };
    /* 덮어 둔 입력은 눌러도 달력이 저절로 열리지 않는다(브라우저는 제 아이콘만 연다)
       — 누르면 우리가 연다. showPicker 가 없는 브라우저에서는 초점만 준다. */
    var onClick = function () {
      if (editing()) return;
      /* preventDefault 는 걸지 않는다 — 막으면 showPicker 가 없는 브라우저에서 제 동작(초점)까지 막힌다 */
      try { inp.showPicker(); } catch (err) { inp.focus(); }
    };
    inp.addEventListener('change', onChange);
    inp.addEventListener('click', onClick);
    st.cleanup.push(function () {
      inp.removeEventListener('change', onChange);
      inp.removeEventListener('click', onClick);
      if (inp.parentNode) inp.parentNode.removeChild(inp);
      field.classList.remove('pk-click', 'pk-lit');
      field.removeAttribute('title');
      field.style.removeProperty('position');
    });
  }

  /* ══════════════════ 건물 고르기(종합현황의 '본관') ══════════════════
     원본의 건물 칸은 글자 '본관' + 셰브론뿐이고 **펼칠 목록이 그려져 있지 않다**. 날짜 칸과 같은 방법으로
     칸 위에 투명한 진짜 <select> 를 덮는다 — 보이는 것은 시안 그대로, 열리는 목록은 브라우저 것이다.
     **건물 이름을 지어내지 않는다.** 전체층 화면 사이드바에 건물이 둘 그려져 있고(list01 본관 · list02 별관)
     각자의 층 목록까지 있다 — 본관 지하1층·1~13층, 별관 지하1층·1~4층. 그 둘만 쓴다.
     종합현황 표는 본관 것(PH · 8~1층 · B1~B4층)이라
       · 본관을 고르면 **원본 그대로** 두고,
       · 별관을 고르면 **별관이 가진 층만 남기고** 이름의 건물만 바꾼다(없는 층을 지어내지 않는다).
     두 화면이 본관의 층을 서로 다르게 그려 두었으므로(전체층엔 13층까지, 종합현황엔 PH·지하4층까지)
     **본관 쪽은 건드리지 않는 것**이 맞다 — 고르기 전 모습이 곧 원본이다. */
  var BUILDINGS = [
    { name: '본관', floors: null },                                   /* null = 원본 그대로 */
    { name: '별관', floors: ['1층', '2층', '3층', '4층', 'B1층'] },   /* 지하1층 = 표의 B1층 */
  ];

  function installBuilding(root, st) {
    var box = one(root, '[data-name="Building Selector"]');
    if (!box) return;
    var txt = leafText(box)[0];
    if (!txt) return;
    var base = (txt.textContent || '').trim();
    if (!base) return;

    /* 이 칸이 다스리는 표 — 같은 판(팝업) 안의 줄들 */
    var panel = box.closest('[data-name^="Popup/"]') || box.closest('[data-name^="Widget/"]') || root;
    var rows = all(panel, '[data-name="Rows"] > [data-name="Row"]');
    /* 원본 글자를 적어 둔다 — 본관으로 되돌리면 한 글자도 안 달라져야 한다 */
    var labels = [];
    rows.forEach(function (r) {
      var p = leafText(r)[0];
      if (p) labels.push({ row: r, p: p, was: p.textContent });
    });

    var pick = function (name) {
      var b = null;
      for (var i = 0; i < BUILDINGS.length; i++) if (BUILDINGS[i].name === name) b = BUILDINGS[i];
      if (!b) return;
      txt.textContent = b.name;
      labels.forEach(function (L) {
        var rest = L.was.indexOf(base) === 0 ? L.was.slice(base.length) : null;
        if (rest === null) return;                       /* 건물 이름으로 시작하지 않는 줄은 그대로 */
        if (!b.floors) {                                 /* 원본 그대로 */
          L.p.textContent = L.was;
          L.row.classList.remove('pk-rowhide');
          return;
        }
        var floor = rest.replace(' ', '');               /* '본관 B1층' → 'B1층' */
        var has = b.floors.indexOf(floor) >= 0;
        L.row.classList.toggle('pk-rowhide', !has);
        if (has) L.p.textContent = b.name + rest;
      });
      if (st.rowHot) setTimeout(st.rowHot, 60);
    };

    var sel = document.createElement('select');
    sel.className = 'pk-buildpick';
    sel.setAttribute('aria-label', '건물 고르기');
    BUILDINGS.forEach(function (b) {
      var o = document.createElement('option');
      o.value = b.name; o.textContent = b.name;
      if (b.name === base) o.selected = true;
      sel.appendChild(o);
    });
    if (getComputedStyle(box).position === 'static') box.style.position = 'relative';
    box.classList.add('pk-click', 'pk-lit');
    if (!box.title) box.title = '건물 고르기';
    box.appendChild(sel);

    var onChange = function () { if (editing()) return; pick(sel.value); };
    sel.addEventListener('change', onChange);
    st.cleanup.push(function () {
      sel.removeEventListener('change', onChange);
      if (sel.parentNode) sel.parentNode.removeChild(sel);
      txt.textContent = base;
      labels.forEach(function (L) { L.p.textContent = L.was; L.row.classList.remove('pk-rowhide'); });
      box.classList.remove('pk-click', 'pk-lit');
      box.removeAttribute('title');
      box.style.removeProperty('position');
    });
  }

  /* 시안에 박힌 발생시각을 열 때마다 최근으로 다시 찍는다(공용 src/recent-time.js).
     시계·가로축은 건드리지 않는다 — 이벤트 표의 '시간' 칸만 넘긴다. */
  function installRestamp(root) {
    if (typeof window.wembRestampTimes !== 'function') return;
    var cells = all(root, '[data-name="Td/Time"] p');
    if (!cells.length) return;
    try { window.wembRestampTimes(cells, {}); } catch (e) { }
  }

  /* ══════════════════ 살리기 ══════════════════ */
  function initPosco(root) {
    if (!root) return;
    if (root.__pkLive) disposePosco(root);
    injectStyle();
    root.classList.add('pk-root');
    var st = { cleanup: [] };
    root.__pkLive = st;
    try { installFit(root, st); } catch (e) { }
    try { installWideFit(root, st); } catch (e) { }   /* 판 안쪽 1920 고정 풀기 — 맞추기(fit) 뒤에 */
    try { installSop(root, st); } catch (e) { }       /* SOP STEP 1~3 겹치기 · 컨트롤 바 — 호버 표시(markHot) 전에 */
    try { markHot(root); } catch (e) { }
    try { installRowHot(root, st); } catch (e) { }
    try { installRestamp(root); } catch (e) { }
    try { installClock(root, st); } catch (e) { }
    try { installDate(root, st); } catch (e) { }     /* 날짜 필터 — installRestamp 뒤에(그 판만 다시 맞춘다) */
    try { installBuilding(root, st); } catch (e) { }
    try { installSelect(root, st); } catch (e) { }
    try { installFloorPick(root, st); } catch (e) { }
    try { installPick(root, st); } catch (e) { }
    try { installHeaderMenu(root, st); } catch (e) { }   /* 헤더 메뉴 — Figma btn-menu(17:13398) default / active(=마우스오버) */
    try { installRowSelect(root, st); } catch (e) { }
    try { installRadio(root, st); } catch (e) { }
    try { installTree(root, st); } catch (e) { }
    try { installPopups(root, st); } catch (e) { }
    try { installGo(root, st); } catch (e) { }       /* 화면 이동 — 다른 장치가 잡은 뒤에(제자리 팝업이 우선) */
    try { installFold(root, st); } catch (e) { }
    try { installCollapse(root, st); } catch (e) { }
    try { installTicker(root, st); } catch (e) { }
    try { installBeacon(root, st); } catch (e) { }
    try { installCounters(root, st); } catch (e) { }
    try { installFeed(root, st); } catch (e) { }
    try { installPanelMove(root, st); } catch (e) { }   /* 패널편집 — 판 끌어 옮기기 */
    return st;
  }

  function disposePosco(root) {
    var st = root && root.__pkLive;
    if (!st) return;
    st.cleanup.forEach(function (f) { try { f(); } catch (e) { } });
    root.__pkLive = null;
  }

  window.initPosco = initPosco;
  window.disposePosco = disposePosco;
  /* 스튜디오가 창 크기를 바꾼 뒤 다시 맞추라고 부를 수 있게 */
  window.refitPosco = function (root) { var st = root && root.__pkLive; if (st && st.fit) st.fit(); };

  /* ══════════════════ SOP 대응 절차 — STEP 1~3 자동 진행 ══════════════════
     Figma 에는 같은 SOP 화면이 세 장 있다 — 상황인지(1:9688) · 상황전파(1:9770) · 상황실 추적(1:9852).
     세 장은 **Step List 안의 카드 상태만** 다르다(나머지 헤더·이벤트 현황·배경은 같은 조각).
     그래서 화면을 통째로 갈아 끼우지 않고(시계·피드가 매번 처음으로 돌아간다) STEP 1 화면을 그대로 두고
     STEP 2·3 화면의 Step List 를 **원본 그대로** 떠 와 같은 자리에 겹쳐 얹는다 — 겹친 층도 conv.js 가 만든
     그 화면의 DOM·CSS 이므로 형상은 Figma 세 장과 같다.
       · 한 단계에 10초 머문 뒤 다음 단계로(3 다음은 1)
       · 컨트롤 바(새로 만든 것 — 원본에는 없다)로 멈춤/재생, 단계 바로 가기
       · 카드를 눌러도 그 단계로 간다
       · 글자를 고치면(패널편집) 세 층의 같은 자리 글자가 함께 바뀐다
       · 패널편집 중에는 넘기지 않는다 */
  var SOP_HOLD = 10000;                        /* 한 단계에 머무는 시간(ms) */
  var SOP_PLAY_KEY = 'wemb-posco-sop-play';    /* 멈춤 상태는 새로고침해도 남는다 */

  function sopBase() {
    /* 낱장 미리보기(src/posco/*.html)는 <base href="../../"> 로 스튜디오와 같은 경로를 쓴다 */
    return 'src/posco/';
  }
  function sopEnsureStyle(px) {
    var G = px.toUpperCase();
    [[px + '-style', window[G + '_CSS']], [px + '-light-style', window[G + '_LIGHT_CSS']]].forEach(function (p) {
      if (!p[1] || document.getElementById(p[0])) return;
      var el = document.createElement('style');
      el.id = p[0];
      el.textContent = p[1];
      document.head.appendChild(el);
    });
  }
  /* 숨은 층(STEP 2·3 · 체계도 보기)의 그림은 **첫 화면이 뜬 뒤에** 받는다.
     스튜디오의 '여는 막'은 페이지의 그림이 다 받아질 때(load) 걷히는데, 처음엔 안 보이는 층의 그림까지 기다리느라
     SOP 화면만 약 0.5초 늦게 열렸다(Ack 0.96초 · SOP 1.47초 실측). src 를 잠시 data-pk-src 로 비켜 두었다가 load 뒤에 되돌린다. */
  function sopHtml(html) {
    return document.readyState === 'complete' ? html : html.split(' src="').join(' data-pk-src="');
  }
  function sopRestoreSrc(scope) {
    var run = function () {
      all(scope, 'img[data-pk-src]').forEach(function (im) { im.setAttribute('src', im.getAttribute('data-pk-src')); im.removeAttribute('data-pk-src'); });
      /* 색 정하기가 그림에 거는 색상 회전도 다시 입힌다(비켜 둔 동안엔 src 가 없어 못 걸었다) */
      try { if (window.__refreshTpl) window.__refreshTpl(); } catch (e) {}
    };
    if (document.readyState === 'complete') setTimeout(run, 0);
    else window.addEventListener('load', function () { setTimeout(run, 0); }, { once: true });
  }
  /* ══════════════════ 상황인지 전파 체계도 — 번호 순서대로 흐르는 연출 ══════════════════
     체계도 화면(1:9443)의 번호 1~5 가 곧 순서다. 단계마다
       · 다이어그램: 그 번호의 연결(Connector/N · 2 는 Connector/Link 도)이 켜지고 오가는 노드가 빛난다.
         아직 안 온 연결은 흐리게, 지나간 연결은 반쯤 켜 둔다.
       · 처리 단계(Process Step/N): 그 단계 원이 **원본의 active 모습**으로 바뀐다 — 색·그림을 새로 짓지 않고
         이미 active 로 그려져 있는 1번 원의 그림(바깥 링 · 안쪽 링 · 하이라이트)과 번호 배지 색을 옮겨 입힌다.
         들어오는 화살표도 원본 active 화살표 그림으로.
       · 2단계(보고·전파)에서는 연락처 표의 줄이 위에서부터 차례로 통보되는 것처럼 강조된다.
     마지막 단계 뒤 잠깐 머물렀다 처음부터 다시. 체계도 보기일 때만 돌고, 패널편집 중에는 원본 모습으로 멈춘다. */
  var DG_STEP = 1700, DG_HOLD = 1900;
  var DG_FLOW = [
    { links: ['Connector/1'], nodes: ['상황인지자', '상황실(경비본부)', '경비관리팀'] },
    { links: ['Connector/2', 'Connector/Link'], nodes: ['상황실(경비본부)', '안전관리부장', '관련부서 및 기관'] },
    { links: ['Connector/3'], nodes: ['경비관리팀', '관련부서 및 기관'] },
    { links: ['Connector/4'], nodes: ['상황실(경비본부)', '경비관리팀'] },
    { links: ['Connector/5'], nodes: ['경비관리팀', '상황실(경비본부)'] },
  ];
  function installSopDiagram(scope) {
    var canvas = one(scope, '[data-name="Canvas"]');
    var flow = one(scope, '[data-name="Process Flow"]');
    if (!canvas || !flow) return null;
    var links = all(canvas, '[data-name^="Connector/"]');
    var nodes = all(canvas, '[data-name="Flow Node"]');
    var nodeOf = function (label) { for (var i = 0; i < nodes.length; i++) if ((nodes[i].textContent || '').trim() === label) return nodes[i]; return null; };
    var steps = {};
    all(flow, '[data-name^="Process Step/"]').forEach(function (el) {
      var n = (el.getAttribute('data-name') || '').split('/')[1] || '';
      if (n.indexOf('-') < 0) steps[n] = el;
    });
    /* 원본 active 모습 — 1번 원과 1↔2 사이 화살표에서 읽는다 */
    var refNode = steps['1'] && one(steps['1'], '[data-name="Process Node"]');
    if (!refNode) return null;
    var refImgs = function (node) {
      var kids = Array.prototype.filter.call(node.children, function (c) { return c.nodeType === 1; });
      var ring = one(node, '[data-name="Inner Ring"]');
      var hl = one(node, '[data-name="Highlight"]');
      return {
        outer: kids[0] && kids[0].tagName === 'IMG' ? kids[0] : null,
        ring: ring, ringImg: ring && one(ring, 'img'),
        hlBox: hl ? kids.filter(function (c) { return c.contains(hl) && c !== hl; })[0] : null, hlImg: hl && one(hl, 'img'),
        num: one(node, '[data-name="Number"]'),
        label: all(node, '[data-name="Text"] p').filter(function (p) { return !p.closest('[data-name="Number"]'); }),
      };
    };
    var REF = refImgs(refNode);
    var arrows = {};                       /* 단계 k 로 들어오는 화살표 = DOM 에서 Process Step/k 바로 뒤 */
    var refArrow = null;
    Object.keys(steps).forEach(function (k) {
      var nx = steps[k].nextElementSibling;
      if (nx && !nx.getAttribute('data-name') && one(nx, 'img')) {
        arrows[k] = nx;
        if (k === '2') refArrow = one(nx, 'img');   /* 원본에서 1→2 화살표만 active 다 */
      }
    });
    /* 그림 주소는 켜는 순간에 읽는다 — 스튜디오에서는 숨은 층 그림을 load 뒤에 받으므로(sopRestoreSrc) 설치 때엔 비어 있다 */
    var activeArrow = function () { return refArrow ? (refArrow.getAttribute('src') || refArrow.getAttribute('data-pk-src')) : null; };
    var numBadges = all(canvas, '[data-name="Step Number"]');
    var activeNumBg = null;
    all(canvas, '[data-name="Connector/1"] [data-name="Step Number"]').some(function (b) { activeNumBg = getComputedStyle(b).backgroundColor; return true; });
    var rows = all(scope, '[data-name="Contact Table"] [data-name="Body"] > *');

    /* 되돌리기 위한 원래 값 */
    var saved = [];
    var remember = function (el, prop, attr) {
      if (!el) return;
      for (var i = 0; i < saved.length; i++) if (saved[i].el === el && saved[i].prop === prop) return;
      saved.push({ el: el, prop: prop, attr: attr, v: attr ? el.getAttribute(prop) : el.style[prop] });
    };
    var restoreAll = function () {
      saved.forEach(function (s) { if (s.attr) { if (s.v == null) s.el.removeAttribute(s.prop); else s.el.setAttribute(s.prop, s.v); } else s.el.style[s.prop] = s.v; });
      saved = [];
    };
    var activateStep = function (k) {
      var targets = [steps[k]];
      if (k === 2) targets = all(steps['2'], '[data-name="Process Node"]');
      targets.forEach(function (t) {
        /* 원을 찾는다 — 인스턴스는 이름이 Process Node 지만, 원본 글자를 그대로 쓴 3번은 마스터 뿌리째 들어와 이름이 없다 → 첫 그림이 링인 상자 */
        var node = t && (t.matches('[data-name="Process Node"]') ? t : one(t, '[data-name="Process Node"]'));
        if (!node && t) node = Array.prototype.filter.call(t.children, function (c) { return c.firstElementChild && c.firstElementChild.tagName === 'IMG' && one(c, '[data-name="Inner Ring"]'); })[0] || null;
        if (!node || node === refNode) return;
        var me = refImgs(node);
        var cs = function (el) { return getComputedStyle(el); };
        if (me.outer && REF.outer) { remember(me.outer, 'src', true); me.outer.setAttribute('src', REF.outer.getAttribute('src')); }
        if (me.ring && REF.ring) {
          var rc = cs(REF.ring);
          ['top', 'right', 'bottom', 'left'].forEach(function (p) { remember(me.ring, p); me.ring.style[p] = rc[p]; });
          if (me.ringImg && REF.ringImg) { remember(me.ringImg, 'src', true); me.ringImg.setAttribute('src', REF.ringImg.getAttribute('src')); }
        }
        if (me.hlBox && REF.hlBox) {
          var hc = cs(REF.hlBox);
          ['top', 'right', 'bottom', 'left'].forEach(function (p) { remember(me.hlBox, p); me.hlBox.style[p] = hc[p]; });
          if (me.hlImg && REF.hlImg) { remember(me.hlImg, 'src', true); me.hlImg.setAttribute('src', REF.hlImg.getAttribute('src')); }
        }
        if (me.num && REF.num) { remember(me.num, 'backgroundColor'); me.num.style.backgroundColor = cs(REF.num).backgroundColor; }
        me.label.forEach(function (p) { remember(p, 'fontWeight'); p.style.fontWeight = '600'; });
      });
      if (k === 2) {
        var b2 = one(steps['2'], '[data-name="Step Number"]') || one(steps['2'], ':scope > div:not([data-name])');
        if (b2 && REF.num) { remember(b2, 'backgroundColor'); b2.style.backgroundColor = getComputedStyle(REF.num).backgroundColor; }
      }
      var ar = arrows[String(k)];
      var arImg = ar && one(ar, 'img');
      if (arImg && activeArrow()) { remember(arImg, 'src', true); arImg.setAttribute('src', activeArrow()); }
    };

    var timers = [], running = false, cls = ['pk-dg-dim', 'pk-dg-done', 'pk-dg-on', 'pk-dg-node', 'pk-dg-cur', 'pk-dg-row', 'pk-dg-pop'];
    var clearCls = function () {
      all(scope, '.' + cls.join(',.')).forEach(function (el) { cls.forEach(function (c) { el.classList.remove(c); }); });
    };
    var manual = false;   /* show(k) — 한 단계를 고정해 보여 줄 때(검증용)는 다음 단계를 예약하지 않는다 */
    var later = function (ms, fn) { if (manual) return; timers.push(setTimeout(function () { if (!running) return; if (editing()) { stop(); return; } fn(); }, ms)); };
    var runStep = function (i) {
      var S = DG_FLOW[i];
      /* 연결 — 지금 것은 켜고, 지나간 것은 반쯤, 나머지는 흐리게 */
      links.forEach(function (l) {
        var name = l.getAttribute('data-name');
        var idx = -1;
        DG_FLOW.forEach(function (f, j) { if (f.links.indexOf(name) >= 0) idx = j; });
        l.classList.remove('pk-dg-on', 'pk-dg-done', 'pk-dg-dim');
        l.classList.add(idx === i ? 'pk-dg-on' : idx >= 0 && idx < i ? 'pk-dg-done' : 'pk-dg-dim');
      });
      all(canvas, '.pk-dg-pop').forEach(function (b) { b.classList.remove('pk-dg-pop'); });
      S.links.forEach(function (name) {
        all(canvas, '[data-name="' + name + '"] [data-name="Step Number"]').forEach(function (b) {
          remember(b, 'backgroundColor');
          if (activeNumBg) b.style.backgroundColor = activeNumBg;
          void b.offsetWidth; b.classList.add('pk-dg-pop');
        });
      });
      nodes.forEach(function (n) { n.classList.toggle('pk-dg-node', S.nodes.indexOf((n.textContent || '').trim()) >= 0); });
      /* 처리 단계 */
      activateStep(i + 1);
      Object.keys(steps).forEach(function (k) { steps[k].classList.toggle('pk-dg-cur', +k === i + 1); });
      if (i === 1) rows.forEach(function (r, j) { later(120 + j * 190, function () { r.classList.remove('pk-dg-row'); void r.offsetWidth; r.classList.add('pk-dg-row'); }); });
      if (i + 1 < DG_FLOW.length) later(DG_STEP, function () { runStep(i + 1); });
      else later(DG_STEP + DG_HOLD, function () { reset(); later(260, function () { runStep(0); }); });
    };
    var reset = function () { clearCls(); restoreAll(); };
    var start = function () {
      stop();
      running = true;
      /* 시작 — 전부 흐린 상태에서 1번부터 */
      links.forEach(function (l) { l.classList.add('pk-dg-dim'); });
      later(350, function () { runStep(0); });
    };
    var stop = function () {
      running = false;
      timers.forEach(clearTimeout); timers = [];
      reset();
    };
    var show = function (k) {
      stop(); running = true; manual = true;
      for (var j = 0; j < k; j++) runStep(j);
      manual = false;
    };
    return { start: start, stop: stop, show: show, running: function () { return running; } };
  }

  function sopStepsOf(list) {
    return Array.prototype.filter.call(list.children, function (c) {
      return c.nodeType === 1 && !c.classList.contains('pk-soplayer') && !c.classList.contains('pk-sopsweep');
    });
  }

  function installSop(root, st) {
    var dlg = one(root, '[data-name="Dialog/SOP"]');
    var host = dlg && one(dlg, '[data-name="Step List"]');
    if (!host || typeof window.build_pks2 !== 'function' || typeof window.build_pks3 !== 'function') return;

    /* ① STEP 2·3 층 — 그 화면의 Step List 를 잘라 같은 자리에 얹는다 */
    var theme = root.dataset.theme || 'dark';
    var layers = [{ k: 1, list: host, items: sopStepsOf(host) }];
    host.classList.add('pk-sophost');
    layers[0].items.forEach(function (el) { el.classList.add('pk-sopitem'); });
    [2, 3].forEach(function (k) {
      var px = 'pks' + k;
      sopEnsureStyle(px);
      var tmp = document.createElement('div');
      tmp.innerHTML = sopHtml(window['build_' + px](sopBase()));
      var list = one(tmp, '[data-name="Dialog/SOP"] [data-name="Step List"]');
      if (!list) return;
      var wrap = document.createElement('div');
      wrap.className = px + '-root pk-soplayer pk-sopoff';
      wrap.dataset.step = String(k);
      wrap.dataset.theme = theme;
      wrap.setAttribute('aria-hidden', 'true');
      wrap.appendChild(list);
      host.appendChild(wrap);
      layers.push({ k: k, list: list, items: sopStepsOf(list), wrap: wrap });
      sopRestoreSrc(wrap);
    });
    if (layers.length < 3) return;

    /* 단계 이름 — 각 층에서 '켜진' 카드의 제목(원본 글자를 그대로 읽는다. 고치면 따라온다) */
    var titleOf = function (k) {
      var L = layers[k - 1];
      var card = L.items[k - 1];
      var p = card && one(card, '[data-name="Title"] p');
      return p ? (p.textContent || '').trim() : 'STEP ' + k;
    };

    /* ② 컨트롤 바 — 대화상자 아래 줄의 빈자리(상황종료 단추 왼쪽) */
    var footer = one(dlg, '[data-name="Footer"]');
    var bar = document.createElement('div');
    bar.className = 'pk-sopbar';
    bar.setAttribute('data-name', 'SOP Player');
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'SOP 단계 진행');
    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'pk-sopbar-toggle';
    toggle.setAttribute('data-name', 'Player Toggle');
    bar.appendChild(toggle);
    var track = document.createElement('div');
    track.className = 'pk-sopbar-steps';
    track.setAttribute('data-name', 'Step Track');
    var segs = [];
    [1, 2, 3].forEach(function (k) {
      if (k > 1) { var sep = document.createElement('span'); sep.className = 'pk-sopbar-sep'; sep.setAttribute('aria-hidden', 'true'); track.appendChild(sep); }
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'pk-sopbar-step';
      b.dataset.step = String(k);
      b.setAttribute('data-name', 'Step Chip/' + k);
      b.innerHTML = '<span class="pk-sopbar-no">' + k + '</span><span class="pk-sopbar-lbl"></span><span class="pk-sopbar-fill"></span>';
      track.appendChild(b);
      segs.push({ btn: b, lbl: one(b, '.pk-sopbar-lbl'), fill: one(b, '.pk-sopbar-fill') });
    });
    bar.appendChild(track);
    var state = document.createElement('div');
    state.className = 'pk-sopbar-state';
    state.setAttribute('aria-live', 'polite');
    state.innerHTML = '<span class="pk-sopbar-dot"></span><span class="pk-sopbar-mode"></span><span class="pk-sopbar-time"></span>';
    bar.appendChild(state);
    var modeEl = one(state, '.pk-sopbar-mode'), timeEl = one(state, '.pk-sopbar-time');
    if (footer) {
      if (getComputedStyle(footer).position === 'static') footer.style.position = 'relative';
      footer.appendChild(bar);
    } else dlg.appendChild(bar);

    var syncLabels = function () {
      segs.forEach(function (s, i) {
        var t = titleOf(i + 1);
        if (s.lbl.textContent !== t) s.lbl.textContent = t;
        s.btn.title = 'STEP ' + (i + 1) + ' · ' + t + ' 로 이동';
      });
    };
    syncLabels();

    /* ③ 흐름 연출을 걸 자리 — 지금 단계 카드의 ▸▸▸ · 헤더 'SOP 가동중' 의 ▸▸▸ */
    /* 'SOP 가동중' 글자 옆의 화살표 묶음(헤더 Title Row > SOP Status > Badge 안, 원본 이름 Indicator) */
    /* SOP Status 는 01·02·03·end 네 상태가 모두 심겨 있다(conv.js VARIANT_SETS) — 각 상태의 ▸▸▸ 에 흐름을 건다 */
    var headInds = all(dlg, '[data-name="Header"] [data-name="Title Row"] [data-name="Indicator"]');
    headInds.forEach(function (el) { el.classList.add('pk-sopflow'); });
    /* 헤더 SOP Status — 지금 단계(01·02·03) 또는 상황종료(end)의 **원본 변형**만 보이게 */
    var statusVars = all(dlg, '[data-name="Header"] [data-hj-vset="sop-status"]');
    var setStatus = function (v) {
      statusVars.forEach(function (el) { if (el.getAttribute('data-hj-variant') === v) el.removeAttribute('hidden'); else el.setAttribute('hidden', ''); });
    };

    /* ④ 단계 바꾸기 */
    var cur = 1, prev = 0, elapsed = 0;
    var playing = true;
    try { playing = localStorage.getItem(SOP_PLAY_KEY) !== 'off'; } catch (e) {}
    var hideTimer = 0, sweep = null;
    var view = 'procedure', ended = false;   /* 대화상자 왼쪽 메뉴의 보기 · 상황종료 여부 */

    var layerEls = function (k) { return k === 1 ? layers[0].items : [layers[k - 1].wrap]; };
    var setVisible = function (k, on) {
      layerEls(k).forEach(function (el) {
        el.classList.toggle('pk-sopoff', !on);
        el.classList.remove('pk-sopfade');
        if (k > 1) el.setAttribute('aria-hidden', on ? 'false' : 'true');
      });
    };
    var markCurrent = function (k) {
      layers.forEach(function (L) {
        L.items.forEach(function (it, i) {
          var on = L.k === k && i === k - 1;
          it.classList.toggle('pk-sopcur', on);
          var ind = one(it, '[data-name="Indicator"]');
          if (ind) ind.classList.toggle('pk-sopflow', on);
        });
      });
    };
    var sweepCard = function (k) {
      if (sweep && sweep.parentNode) sweep.parentNode.removeChild(sweep);
      var it = layers[k - 1].items[k - 1];
      var card = it && one(it, '[data-name="Card"]');
      if (!card) return;
      if (getComputedStyle(card).position === 'static') card.style.position = 'relative';
      sweep = document.createElement('span');
      sweep.className = 'pk-sopsweep';
      sweep.setAttribute('aria-hidden', 'true');
      card.appendChild(sweep);
    };
    var paintBar = function () {
      segs.forEach(function (s, i) {
        var k = i + 1;
        s.btn.classList.toggle('pk-sopnow', k === cur);
        s.btn.classList.toggle('pk-sopdone', k < cur);
        s.btn.setAttribute('aria-current', k === cur ? 'step' : 'false');
        if (k > cur) s.fill.style.width = '0%';
      });
      bar.classList.toggle('pk-soppaused', !playing);
      root.classList.toggle('pk-soppaused', !playing);
      toggle.setAttribute('aria-label', playing ? '단계 넘기기 멈춤' : '단계 넘기기 재생');
      toggle.title = playing ? '멈춤 — 지금 단계에 머뭅니다' : '재생 — 10초마다 다음 단계로';
      modeEl.textContent = ended ? '상황종료' : playing ? '자동 진행' : '일시정지';
    };
    var paintTime = function () {
      var p = Math.max(0, Math.min(1, elapsed / SOP_HOLD));
      segs[cur - 1].fill.style.width = (p * 100).toFixed(2) + '%';
      var left = Math.max(0, Math.ceil((SOP_HOLD - elapsed) / 1000));
      var t = playing && !ended ? left + '초' : '';
      if (timeEl.textContent !== t) timeEl.textContent = t;
    };

    var go = function (k, animate) {
      if (k === cur && prev) { elapsed = 0; paintTime(); return; }
      clearTimeout(hideTimer);
      /* 직전 전환이 아직 안 끝났으면 그 층을 먼저 정리한다 */
      [1, 2, 3].forEach(function (j) { if (j !== cur && j !== k) setVisible(j, false); });
      prev = cur; cur = k; elapsed = 0;
      if (!animate) {
        [1, 2, 3].forEach(function (j) { setVisible(j, j === k); });
      } else if (k > prev) {
        /* 새 단계가 위층 — 떠오른 뒤 아래(이전) 층을 감춘다 */
        setVisible(k, true);
        layerEls(k).forEach(function (el) { el.classList.add('pk-sopfade'); void el.offsetWidth; el.classList.remove('pk-sopfade'); });
        hideTimer = setTimeout(function () { setVisible(prev, false); }, 320);
      } else {
        /* 이전 단계가 위층 — 아래 단계를 먼저 펴 두고 위층을 걷는다 */
        setVisible(k, true);
        layerEls(prev).forEach(function (el) { el.classList.add('pk-sopfade'); });
        hideTimer = setTimeout(function () { setVisible(prev, false); }, 320);
      }
      markCurrent(k);
      if (!ended) setStatus('0' + k);
      sweepCard(k);
      paintBar();
      paintTime();
    };

    /* 처음 — STEP 1(원본 첫 장 그대로) */
    cur = 1;
    [2, 3].forEach(function (j) { setVisible(j, false); });
    markCurrent(1);
    setStatus('01');
    paintBar();
    paintTime();

    /* ⑤ 시간 — 100ms 마다 흐르고(프레임을 안 내는 창에서도 멈추지 않게 rAF 에 기대지 않는다),
       멈춤·패널편집·탭 가림 동안은 쉰다. 막대는 CSS 전환(.12s)으로 매끄럽게 찬다. */
    var last = Date.now();
    var tick = function () {
      var now = Date.now();
      var dt = Math.min(1000, now - last); last = now;
      if (!playing || ended || view !== 'procedure' || editing() || idle()) return;
      elapsed += dt;
      if (elapsed >= SOP_HOLD) { go(cur % 3 + 1, true); return; }
      paintTime();
    };
    var clock = setInterval(tick, 100);

    /* ⑥ 조작 — 재생/멈춤 · 단계 칩 · 카드 */
    var onToggle = function (e) {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      if (editing()) return;
      playing = !playing;
      try { localStorage.setItem(SOP_PLAY_KEY, playing ? 'on' : 'off'); } catch (err) {}
      paintBar();
      paintTime();
    };
    toggle.addEventListener('click', onToggle);
    var segHandlers = segs.map(function (s, i) {
      var h = function (e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        if (editing()) return;
        go(i + 1, true);
      };
      s.btn.addEventListener('click', h);
      return h;
    });
    /* 카드 — 어느 층에 있든 같은 순번이면 같은 단계. 카드 안 단추(정보)는 제 할 일을 한다 */
    var cardHandlers = [];
    layers.forEach(function (L) {
      L.items.forEach(function (it, i) {
        var body = one(it, '[data-name="Card"]') || it;
        clickable(body, 'STEP ' + (i + 1) + ' 보기');
        var h = function (e) {
          if (editing()) return;
          if (e && e.target && e.target.closest && e.target.closest('[data-name^="Button/"]')) return;
          go(i + 1, true);
        };
        var key = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); h(e); } };
        body.addEventListener('click', h);
        body.addEventListener('keydown', key);
        cardHandlers.push([body, h, key]);
      });
    });
    /* 키보드 — 컨트롤 바에 초점이 있을 때 ← → 로 단계 이동 */
    var onKey = function (e) {
      if (editing()) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); go(cur % 3 + 1, true); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go((cur + 1) % 3 + 1, true); }
    };
    bar.addEventListener('keydown', onKey);

    /* ⑦ 글자 고치기 — 세 층의 같은 자리 글자를 함께 바꾼다(dt-edit 가 저장하도록 input 을 다시 흘린다) */
    var mirroring = false;
    var pathOf = function (p) {
      for (var li = 0; li < layers.length; li++) {
        var its = layers[li].items;
        for (var si = 0; si < its.length; si++) {
          if (its[si].contains(p)) return { li: li, si: si, pi: all(its[si], 'p').indexOf(p) };
        }
      }
      return null;
    };
    var onInput = function (e) {
      if (mirroring) return;
      var p = e.target && e.target.closest && e.target.closest('p');
      if (!p || !host.contains(p)) return;
      var at = pathOf(p);
      if (!at || at.pi < 0) return;
      mirroring = true;
      try {
        layers.forEach(function (L, li) {
          if (li === at.li) return;
          var q = L.items[at.si] && all(L.items[at.si], 'p')[at.pi];
          if (!q || q.innerHTML === p.innerHTML) return;
          q.innerHTML = p.innerHTML;
          try { q.dispatchEvent(new Event('input', { bubbles: true })); } catch (err) {}
        });
      } finally { mirroring = false; }
      syncLabels();
    };
    root.addEventListener('input', onInput);
    /* 저장된 편집이 되살아난 뒤(스튜디오가 글자를 다시 입힌다) 이름도 다시 읽는다 */
    var labelTimer = every(1500, syncLabels);

    /* ⑧ 대화상자 왼쪽 메뉴 — 대응 절차(Tab/Procedure) ↔ 상황인지 전파 체계도(Tab/Diagram)
       Figma 에는 두 보기가 따로 그려져 있다: 절차 = 지금 화면(1:9688, 절차 켜짐), 체계도 = 1:9443(체계도 켜짐).
       메뉴의 켜짐/꺼짐 모습도 두 화면에 **원본 그대로** 반대로 들어 있으므로 색을 새로 짓지 않고
       체계도 화면의 본문(Body)과 메뉴(Tab Bar)를 통째로 같은 자리에 얹어 맞바꾼다. */
    var frame = root.firstElementChild;
    var hostBody = one(dlg, ':scope > [data-name="Body"]');
    var hostTabs = one(dlg, ':scope > [data-name="Tab Bar"]');
    var viewWrap = null, viewBody = null, viewTabs = null;
    if (typeof window.build_pks4 === 'function' && hostBody && hostTabs && frame) {
      sopEnsureStyle('pks4');
      var tmp4 = document.createElement('div');
      tmp4.innerHTML = sopHtml(window.build_pks4(sopBase()));
      var dlg4 = one(tmp4, '[data-name="Dialog/SOP"]');
      viewBody = dlg4 && one(dlg4, ':scope > [data-name="Body"]');
      viewTabs = dlg4 && one(dlg4, ':scope > [data-name="Tab Bar"]');
      if (viewBody && viewTabs) {
        viewWrap = document.createElement('div');
        viewWrap.className = 'pks4-root pk-sopview pk-sopoff';
        viewWrap.dataset.theme = theme;
        viewWrap.setAttribute('data-name', 'SOP Diagram View');
        viewWrap.setAttribute('aria-hidden', 'true');
        viewWrap.appendChild(viewBody);
        viewWrap.appendChild(viewTabs);
        frame.insertBefore(viewWrap, dlg.nextSibling);
        sopRestoreSrc(viewWrap);
      }
    }
    /* 반응형(translate) · 패널 이동(margin)은 원래 본문·메뉴에 걸린다 — 얹은 것도 같은 자리를 따라가게 옮겨 적는다 */
    /* 체계도 보기의 단계 연출(installSopDiagram) — 보기가 체계도일 때만 돈다 */
    var dg = viewBody ? installSopDiagram(viewBody) : null;
    var syncView = function () {
      if (!viewWrap) return;
      [[hostBody, viewBody], [hostTabs, viewTabs]].forEach(function (p) {
        ['translate', 'marginLeft', 'marginTop'].forEach(function (k) { if (p[1].style[k] !== p[0].style[k]) p[1].style[k] = p[0].style[k]; });
      });
    };
    syncView();
    var viewSync = every(250, syncView);
    var viewTimer = 0;
    var setView = function (v) {
      if (!viewWrap || v === view) return;
      clearTimeout(viewTimer);
      view = v;
      syncView();
      var showEls = v === 'diagram' ? [viewWrap] : [hostBody, hostTabs];
      var hideEls = v === 'diagram' ? [hostBody, hostTabs] : [viewWrap];
      /* 이전 보기는 바로 감춘다 — 두 보기가 겹쳐 보이는 틈을 두지 않는다 */
      hideEls.forEach(function (el) { el.classList.remove('pk-sopin', 'pk-sopfade'); el.classList.add('pk-sopoff'); });
      showEls.forEach(function (el) { el.classList.remove('pk-sopoff', 'pk-sopfade', 'pk-sopin'); void el.offsetWidth; el.classList.add('pk-sopin'); });
      viewWrap.setAttribute('aria-hidden', v === 'diagram' ? 'false' : 'true');
      viewTimer = setTimeout(function () { showEls.forEach(function (el) { el.classList.remove('pk-sopin'); }); }, 260);
      if (dg) { if (v === 'diagram') dg.start(); else dg.stop(); }
      paintTime();
    };
    var tabBinds = [];
    var bindTab = function (el, to, title) {
      if (!el) return;
      clickable(el, title, 'tab');
      var h = function (e) { if (e) { e.preventDefault(); e.stopPropagation(); } if (editing()) return; setView(to); };
      var key = function (e) { if (e.key === 'Enter' || e.key === ' ') h(e); };
      el.addEventListener('click', h);
      el.addEventListener('keydown', key);
      tabBinds.push([el, h, key]);
    };
    if (viewWrap) {
      /* 메뉴 순서는 원본 그대로 — [0] 대응 절차 · [1] 상황인지 전파 체계도 */
      bindTab(hostTabs.children[1], 'diagram', '상황인지 전파 체계도 보기');
      bindTab(viewTabs.children[0], 'procedure', '대응 절차 및 행동요령 보기');
      hostTabs.children[0].setAttribute('aria-selected', 'true');
      viewTabs.children[1] && viewTabs.children[1].setAttribute('aria-selected', 'true');
    }

    /* ⑨ 상황종료 단추 — 마우스를 올리면 Figma 의 hover 변형(1:10443)으로, 누르면 상황종료.
       두 변형이 같은 자리에 심겨 있어(conv.js VARIANT_SETS) 보이는 것만 바꾼다. 절차 · 체계도 두 본문에 하나씩 있다. */
    var endBinds = [];
    [hostBody, viewBody].forEach(function (body) {
      var foot = body && one(body, '[data-name="Footer"]');
      var vars = foot ? all(foot, '[data-hj-vset="btn-end"]') : [];
      if (vars.length < 2) return;
      var showHover = function (on) {
        vars.forEach(function (el) {
          var want = el.getAttribute('data-hj-variant') === (on ? 'hover' : 'default');
          if (want) el.removeAttribute('hidden'); else el.setAttribute('hidden', '');
        });
      };
      var inside = function (e) {
        var vis = vars.filter(function (el) { return !el.hasAttribute('hidden'); })[0];
        if (!vis) return false;
        var r = vis.getBoundingClientRect();
        return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      };
      var move = function (e) { if (!editing()) showHover(inside(e)); };
      var leave = function () { showHover(false); };
      var click = function (e) {
        if (!e.target.closest || !e.target.closest('[data-hj-vset="btn-end"]')) return;
        e.preventDefault(); e.stopPropagation();
        if (editing()) return;
        endSituation();
      };
      vars.forEach(function (el) { clickable(el, '상황종료'); el.classList.remove('pk-lit'); });
      foot.addEventListener('pointermove', move);
      foot.addEventListener('pointerleave', leave);
      foot.addEventListener('click', click);
      endBinds.push({ foot: foot, move: move, leave: leave, click: click, vars: vars, reset: leave });
    });

    /* ⑩ 발생일시 · 경과시간 — 지금 벌어지고 있는 상황처럼.
       원본 경과시간(00:03:37)만큼 **지금보다 앞선 시각**을 발생일시로 찍고, 경과시간은 1초마다 늘어난다.
       글자 모양은 원본 그대로(YYYY-MM-DD HH:MM:SS · HH:MM:SS). 상황종료를 누르면 그 자리에서 멈춘다. */
    var occP = one(dlg, '[data-name="Field/Time"] [data-name="Value"] p');
    var elaP = one(dlg, '[data-name="Field/Elapsed Time"] [data-name="Value"] p');
    var p2 = function (n) { return (n < 10 ? '0' : '') + n; };
    var baseSec = 217;
    (function () {
      var t = elaP ? (elaP.textContent || '').trim().split(':') : [];
      if (t.length === 3 && t.every(function (x) { return x !== '' && !isNaN(+x); })) baseSec = (+t[0]) * 3600 + (+t[1]) * 60 + (+t[2]);
    })();
    var occAt = Date.now() - baseSec * 1000, frozenAt = 0;
    var paintIncident = function () {
      if (editing()) return;
      if (occP) {
        var d = new Date(occAt);
        var s = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds());
        if (occP.textContent !== s) occP.textContent = s;
      }
      if (elaP) {
        var sec = Math.max(0, Math.floor(((frozenAt || Date.now()) - occAt) / 1000));
        var e2 = p2(Math.floor(sec / 3600)) + ':' + p2(Math.floor(sec / 60) % 60) + ':' + p2(sec % 60);
        if (elaP.textContent !== e2) elaP.textContent = e2;
      }
    };
    [occP, elaP].forEach(function (p) { if (p) p.classList.add('pk-num'); });
    paintIncident();
    var incidentClock = setInterval(paintIncident, 1000);

    /* ⑪ 상황종료 · 다시 열기
       누르면: SOP Status 가 원본의 '상황종료' 변형으로 바뀌고, 경과시간 · 단계 넘기기가 멈춘 뒤 대화상자가 닫힌다.
       헤더 SOP 메뉴를 다시 누르면 새 상황으로 대화상자가 열린다(STEP 1 · 경과시간 처음부터 · 절차 보기). */
    var closeTimer = 0;
    /* 상황 경보 — 헤더의 붉은 판 · 경고 배지 · 제목(스타일 SOP_CSS '상황 경보') */
    var alertBg = one(dlg, '[data-name="Header"] > [data-name="Background"] > *');
    var alertBadge = one(dlg, '[data-name="Header"] [data-name="Title Row"] > [data-name="Title"] > [data-name="Badge"]');
    var alertTitle = one(dlg, '[data-name="Header"] [data-name="Title Row"] > [data-name="Title"] > p');
    var alertFx = [];
    var setAlert = function (on) {
      if (alertBg) {
        alertBg.classList.toggle('pk-sopalert', on);
        /* 판 모양대로 번지는 붉은 막 · 스캔 빛 — 판 그림을 그대로 복사해 붉게 물들인 두 겹(CSS 마스크는 file:// 에서 막힌다) */
        if (on && !alertFx.length) {
          var im = one(alertBg, 'img');
          if (im) {
            ['pk-alertwash', 'pk-alertscan'].forEach(function (cls) {
              var box = document.createElement('span');
              box.className = cls;
              box.setAttribute('aria-hidden', 'true');
              var copy = im.cloneNode(false);
              copy.removeAttribute('id');
              copy.className = '';
              box.appendChild(copy);
              alertBg.appendChild(box);
              alertFx.push(box);
            });
          }
        }
        if (!on) { alertFx.forEach(function (el) { if (el.parentNode) el.parentNode.removeChild(el); }); alertFx = []; }
      }
      if (alertBadge) alertBadge.classList.toggle('pk-sopbadge', on);
      if (alertTitle) alertTitle.classList.toggle('pk-soptitle', on);
    };
    setAlert(true);
    var dlgParts = function () {
      var list = Array.prototype.filter.call(dlg.children, function (el) { return el.nodeType === 1; });
      if (viewWrap) list.push(viewWrap);
      return list;
    };
    var endSituation = function () {
      if (ended) return;
      ended = true;
      frozenAt = Date.now();
      if (dg) dg.stop();
      setAlert(false);
      setStatus('end');
      paintIncident();
      paintBar();
      paintTime();
      clearTimeout(closeTimer);
      closeTimer = setTimeout(function () {
        dlgParts().forEach(function (el) { el.classList.add('pk-sopclosing'); });
        dlg.setAttribute('aria-hidden', 'true');
      }, 1300);
    };
    var reopen = function () {
      clearTimeout(closeTimer);
      endBinds.forEach(function (b) { b.reset(); });
      ended = false; frozenAt = 0;
      occAt = Date.now() - baseSec * 1000;
      setView('procedure');
      go(1, false);
      elapsed = 0;
      setStatus('01');
      setAlert(true);
      dlgParts().forEach(function (el) { if (el.classList.contains('pk-sopclosing')) { el.classList.remove('pk-sopclosing'); if (!el.classList.contains('pk-sopoff')) { void el.offsetWidth; el.classList.add('pk-sopin'); setTimeout(function () { el.classList.remove('pk-sopin'); }, 260); } } });
      dlg.setAttribute('aria-hidden', 'false');
      paintIncident();
      paintBar();
      paintTime();
    };
    var menuBinds = [];
    all(root, '[data-name^="Menu Item/"]').forEach(function (el) {
      if ((el.textContent || '').trim() !== 'SOP') return;
      var h = function () { if (editing()) return; if (ended) reopen(); };
      el.addEventListener('click', h);
      menuBinds.push([el, h]);
    });
    /* 패널편집을 켜면 닫힌 대화상자도 도로 펴 준다 — 안 그러면 그 안의 글자를 고칠 수 없다 */
    var editOpen = every(300, function () {
      if (editing() && ended) reopen();
      /* 패널편집을 끝내면 체계도 연출을 다시 튼다(편집 중에는 원본 모습으로 멈춰 있다) */
      if (dg && editing() && dg.running()) dg.stop();   /* 편집을 켜면 곧바로 원본 모습으로 */
      if (dg && view === 'diagram' && !ended && !editing() && !dg.running()) dg.start();
    });

    st.sop = {
      go: go, cur: function () { return cur; }, playing: function () { return playing; },
      view: function (v) { if (v) setView(v); return view; }, end: endSituation, reopen: reopen,
      ended: function () { return ended; }, status: setStatus, diagram: dg,
    };
    st.cleanup.push(function () {
      clearInterval(clock);
      clearTimeout(hideTimer);
      clearInterval(labelTimer);
      toggle.removeEventListener('click', onToggle);
      segs.forEach(function (s, i) { s.btn.removeEventListener('click', segHandlers[i]); });
      cardHandlers.forEach(function (c) { c[0].removeEventListener('click', c[1]); c[0].removeEventListener('keydown', c[2]); unclickable(c[0]); });
      bar.removeEventListener('keydown', onKey);
      root.removeEventListener('input', onInput);
      if (bar.parentNode) bar.parentNode.removeChild(bar);
      if (sweep && sweep.parentNode) sweep.parentNode.removeChild(sweep);
      layers.forEach(function (L) { if (L.wrap && L.wrap.parentNode) L.wrap.parentNode.removeChild(L.wrap); });
      layers[0].items.forEach(function (el) { el.classList.remove('pk-sopitem', 'pk-sopoff', 'pk-sopfade', 'pk-sopcur'); });
      host.classList.remove('pk-sophost');
      root.classList.remove('pk-soppaused');
      headInds.forEach(function (el) { el.classList.remove('pk-sopflow'); });
      setAlert(false);
      setStatus('01');
      if (dg) dg.stop();
      clearInterval(viewSync); clearTimeout(viewTimer); clearInterval(incidentClock); clearTimeout(closeTimer); clearInterval(editOpen);
      tabBinds.forEach(function (t) { t[0].removeEventListener('click', t[1]); t[0].removeEventListener('keydown', t[2]); unclickable(t[0]); });
      endBinds.forEach(function (b) {
        b.foot.removeEventListener('pointermove', b.move); b.foot.removeEventListener('pointerleave', b.leave); b.foot.removeEventListener('click', b.click);
        b.reset(); b.vars.forEach(function (el) { unclickable(el); });
      });
      menuBinds.forEach(function (m) { m[0].removeEventListener('click', m[1]); });
      dlgParts().forEach(function (el) { el.classList.remove('pk-sopclosing'); });
      [hostBody, hostTabs].forEach(function (el) { if (el) el.classList.remove('pk-sopoff'); });
      if (viewWrap && viewWrap.parentNode) viewWrap.parentNode.removeChild(viewWrap);
    });
  }

  /* ══════════════════ 헤더 메뉴 — 기본 / 마우스오버 · 활성 ══════════════════
     Figma btn-menu(17:13398)에는 default · active 두 상태만 있다 → 마우스오버와 활성화는 active 값, 나머지는 default 값.
     모양은 스타일(SOP_CSS '헤더 메뉴')이 정하고 여기서는 ① 켜진 메뉴 표시(pk-menu-on) ② 아이콘 마스크 주소만 건다.
     처음 켜진 메뉴는 원본 그대로(판 색이 가장 선명한 것 = SOP). 누르면 그 메뉴로 옮겨 간다. */
  function installHeaderMenu(root, st) {
    var items = all(root, '[data-name^="Menu Item/"]');
    if (items.length < 2) return;
    var onIdx = 0, best = -1;
    items.forEach(function (el, i) { var s = sat(getComputedStyle(el).backgroundColor); if (s > best) { best = s; onIdx = i; } });
    var cur = null;
    var setOn = function (el) {
      if (cur) { cur.classList.remove('pk-menu-on'); cur.setAttribute('aria-current', 'false'); }
      cur = el;
      if (cur) { cur.classList.add('pk-menu-on'); cur.setAttribute('aria-current', 'page'); }
    };
    var binds = [];
    items.forEach(function (el, i) {
      el.classList.add('pk-menu');
      var img = one(el, 'img');
      var box = img && img.parentElement;
      var src = img && (img.getAttribute('src') || img.getAttribute('data-pk-src'));
      if (box && src && box !== el) {
        /* 상태별 사본은 원본 옆 menu/ 폴더에 있다(mk-menu-icons.js) — 이름: icon-nav-<이름>-{off,on,off-lt,on-lt}.svg */
        var dot = src.lastIndexOf('.'), slash = src.lastIndexOf('/');
        var dir = src.slice(0, slash + 1), stem = src.slice(slash + 1, dot);
        ['off', 'on', 'off-lt', 'on-lt'].forEach(function (s) {
          try { box.style.setProperty('--pk-ico-' + s, 'url("' + new URL(dir + 'menu/' + stem + '-' + s + '.svg', document.baseURI).href + '")'); } catch (e) {}
        });
        box.classList.add('pk-menu-ico');
      }
      clickable(el);
      el.classList.remove('pk-lit');
      var h = function (e) { if (e) e.preventDefault(); if (editing()) return; setOn(el); };
      var key = function (e) { if (e.key === 'Enter' || e.key === ' ') h(e); };
      el.addEventListener('click', h);
      el.addEventListener('keydown', key);
      binds.push([el, h, key, box]);
    });
    setOn(items[onIdx]);
    st.cleanup.push(function () {
      binds.forEach(function (b) {
        b[0].removeEventListener('click', b[1]); b[0].removeEventListener('keydown', b[2]);
        b[0].classList.remove('pk-menu', 'pk-menu-on'); b[0].removeAttribute('aria-current'); unclickable(b[0]);
        if (b[3]) { b[3].classList.remove('pk-menu-ico'); ['off', 'on', 'off-lt', 'on-lt'].forEach(function (s) { b[3].style.removeProperty('--pk-ico-' + s); }); }
      });
    });
  }

  /* ══════════════════ 패널 이동(패널편집 · 배치) ══════════════════
     '패널편집'을 켜면 화면의 판(헤더 · 이벤트 현황 · 층 선택 · 자산정보현황 · SOP 대화상자 …)을 끌어 옮길 수 있다.
     덩어리 단위는 반응형 엔진과 같다(collectBlocks — Figma 그룹이면 통째로 움직인다).
     옮기는 값은 **margin** 에 싣는다 — 반응형 엔진이 translate 속성을, 원본이 transform(가운데 맞추기)을 이미
     쓰고 있어서 둘 중 어느 것을 덮어도 판이 튄다. 절대배치 판의 margin 은 다른 판을 밀지 않는다.
     화면(장면)마다 따로 저장하고, 스튜디오의 '배치 초기화'를 누르면 함께 되돌린다. */
  var MOVE_KEY = 'wemb-posco-move';
  var MOVE_SKIP = ['Background', 'Stage', 'Building Image', 'Floor Plan'];

  function installPanelMove(root, st) {
    var groups = collectBlocks(root).filter(function (g) {
      if (g.some(function (el) { return el.classList.contains('pk-sopview'); })) return false;   /* 체계도 보기는 절차 본문을 따라간다(syncView) */
      return !g.every(function (el) {
        var n = el.dataset.name || '';
        return MOVE_SKIP.indexOf(n) >= 0 || n.indexOf('(Unused)') >= 0;
      });
    });
    if (!groups.length) return;
    var scene = sceneOf(root);
    var load = function () { try { return (JSON.parse(localStorage.getItem(MOVE_KEY) || '{}') || {})[scene] || {}; } catch (e) { return {}; } };
    var save = function (m) {
      try {
        var all0 = JSON.parse(localStorage.getItem(MOVE_KEY) || '{}') || {};
        all0[scene] = m;
        localStorage.setItem(MOVE_KEY, JSON.stringify(all0));
      } catch (e) {}
    };
    var keyOf = function (g, i) { return (g[0].dataset.name || g[0].dataset.nodeId || 'block') + '#' + i; };
    var P = groups.map(function (g, i) {
      var base = g.map(function (el) { var cs = getComputedStyle(el); return [parseFloat(cs.marginLeft) || 0, parseFloat(cs.marginTop) || 0]; });
      g.forEach(function (el) { el.classList.add('pk-movable'); });
      return { els: g, base: base, key: keyOf(g, i), off: [0, 0] };
    });
    var put = function (p) {
      p.els.forEach(function (el, i) {
        if (!p.off[0] && !p.off[1]) { el.style.removeProperty('margin-left'); el.style.removeProperty('margin-top'); return; }
        el.style.marginLeft = (p.base[i][0] + p.off[0]) + 'px';
        el.style.marginTop = (p.base[i][1] + p.off[1]) + 'px';
      });
    };
    var restore = function () {
      var m = load();
      P.forEach(function (p) { var o = m[p.key]; p.off = o ? [o[0], o[1]] : [0, 0]; put(p); });
    };
    restore();

    var layoutOn = function () { return !!document.querySelector('.dtstage.dt-editing'); };
    var drag = null;
    var groupOf = function (t) {
      for (var i = 0; i < P.length; i++) for (var j = 0; j < P[i].els.length; j++) if (P[i].els[j].contains(t)) return P[i];
      return null;
    };
    var onDown = function (e) {
      if (!layoutOn() || e.button !== 0) return;
      if (e.target.closest && e.target.closest('.pk-sopbar, .dt-added')) return;
      var p = groupOf(e.target);
      if (!p) return;
      var k = root.getBoundingClientRect().width / (root.offsetWidth || 1) || 1;   /* 화면 → 배치 좌표 */
      drag = { p: p, sx: e.clientX, sy: e.clientY, ox: p.off[0], oy: p.off[1], k: k, moved: false, id: e.pointerId };
    };
    var onMove = function (e) {
      if (!drag) return;
      var dx = (e.clientX - drag.sx) / drag.k, dy = (e.clientY - drag.sy) / drag.k;
      if (!drag.moved) {
        if (Math.abs(dx) + Math.abs(dy) < 3) return;          /* 손떨림은 클릭(글자 고치기)으로 둔다 */
        drag.moved = true;
        drag.p.els.forEach(function (el) { el.classList.add('pk-moving'); });
        try { root.setPointerCapture(drag.id); } catch (err) {}
      }
      e.preventDefault();
      drag.p.off = [Math.round(drag.ox + dx), Math.round(drag.oy + dy)];
      put(drag.p);
    };
    var onUp = function () {
      if (!drag) return;
      var d = drag; drag = null;
      d.p.els.forEach(function (el) { el.classList.remove('pk-moving'); });
      try { root.releasePointerCapture(d.id); } catch (err) {}
      if (!d.moved) return;
      var m = load();
      if (d.p.off[0] || d.p.off[1]) m[d.p.key] = d.p.off; else delete m[d.p.key];
      save(m);
      /* 방금 끈 자리의 클릭이 카드 이동·팝업 열기로 번지지 않게 한 번 삼킨다 */
      var swallow = function (ev) { ev.stopPropagation(); ev.preventDefault(); root.removeEventListener('click', swallow, true); };
      root.addEventListener('click', swallow, true);
      setTimeout(function () { root.removeEventListener('click', swallow, true); }, 0);
    };
    /* 판 안의 그림(img)을 누른 채 끌면 브라우저가 '그림 끌어 놓기'를 시작하고 포인터를 취소해 버린다
       (pointercancel — 5px 만 움직이고 멈췄다). 배치 모드에서는 그 기본 동작과 글자 고르기를 막는다.
       글자 고치기는 dt-edit 와 같이 두 번 눌러서 한다. */
    var onMouseDown = function (e) { if (layoutOn() && groupOf(e.target) && !(e.target.closest && e.target.closest('.pk-sopbar'))) e.preventDefault(); };
    var onDragStart = function (e) { if (layoutOn()) e.preventDefault(); };
    root.addEventListener('mousedown', onMouseDown);
    root.addEventListener('dragstart', onDragStart);
    root.addEventListener('pointerdown', onDown);
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerup', onUp);
    root.addEventListener('pointercancel', onUp);
    /* 스튜디오의 '배치 초기화' — 이 화면의 이동도 되돌린다 */
    var reset = document.getElementById('layoutReset');
    var onReset = function () { save({}); P.forEach(function (p) { p.off = [0, 0]; put(p); }); };
    if (reset) reset.addEventListener('click', onReset);
    st.cleanup.push(function () {
      root.removeEventListener('mousedown', onMouseDown);
      root.removeEventListener('dragstart', onDragStart);
      root.removeEventListener('pointerdown', onDown);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerup', onUp);
      root.removeEventListener('pointercancel', onUp);
      if (reset) reset.removeEventListener('click', onReset);
      P.forEach(function (p) { p.off = [0, 0]; put(p); p.els.forEach(function (el) { el.classList.remove('pk-movable', 'pk-moving'); }); });
    });
  }
})();
