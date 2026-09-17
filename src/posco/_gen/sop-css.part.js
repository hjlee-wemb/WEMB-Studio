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
    '.pk-root .pk-sopalert::before,.pk-root .pk-sopalert::after{content:"";position:absolute;inset:0;pointer-events:none;',
    '-webkit-mask-image:var(--pk-alert-mask);mask-image:var(--pk-alert-mask);-webkit-mask-size:100% 100%;mask-size:100% 100%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;}',
    '@keyframes pkSopWash{0%,100%{opacity:0;}50%{opacity:1;}}',
    '.pk-root .pk-sopalert::before{background:radial-gradient(120% 140% at 50% 50%,rgba(244,48,80,.05) 30%,rgba(244,48,80,.32) 100%);animation:pkSopWash 1.6s ease-in-out infinite;}',
    '@keyframes pkSopScan{0%{background-position:160% 0;}100%{background-position:-60% 0;}}',
    '.pk-root .pk-sopalert::after{background:linear-gradient(100deg,rgba(255,70,100,0) 35%,rgba(255,90,115,.30) 50%,rgba(255,70,100,0) 65%);background-size:250% 100%;background-repeat:no-repeat;animation:pkSopScan 2.6s linear infinite;}',
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
    '.dt-content-editing .pk-root .pk-sopalert,.dt-content-editing .pk-root .pk-sopalert::before,.dt-content-editing .pk-root .pk-sopalert::after,',
    '.dt-content-editing .pk-root .pk-sopbadge,.dt-content-editing .pk-root .pk-sopbadge::after,.dt-content-editing .pk-root .pk-soptitle{animation-play-state:paused;}',
    '@media (prefers-reduced-motion:reduce){.pk-root .pk-sopalert::after{animation:none;opacity:0;}}',

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

    /* ── 패널 이동(패널편집 · 배치) ── 옮길 수 있는 판에 점선 테두리와 손 커서 */
    '.dt-editing .pk-root .pk-movable{cursor:move;}',
    '.dt-editing .pk-root .pk-movable:hover{outline:1px dashed rgba(88,160,255,.85);outline-offset:2px;}',
    '.dt-editing .pk-root .pk-moving{outline:1px solid rgba(88,160,255,1);outline-offset:2px;opacity:.92;}',
    '.pk-root[data-theme="light"] .pk-movable:hover{outline-color:rgba(38,84,196,.8);}',
  ];

