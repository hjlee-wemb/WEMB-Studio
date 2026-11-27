# 증권 통합관제(secmon) 생성기

`Dashboard: Securities Integrated Monitoring` — Figma `CWWIdHGJ2LlEolp3hCe6Gk`(REM 페이지, 익명화 · 가상 데이터 · Pretendard 반영본)를
순수 HTML/CSS DOM 으로 재구축한다. 장면 6 + 팝업 장면 3.

| 장면 | 노드 | px | 모듈 |
|---|---|---|---|
| 통합관제현황(open) | 4041:8351 | smm | src/secmon-main.js |
| 채널현황 | 4039:2211 | smc | src/secmon-channel.js |
| 마이크로 서비스현황 | 4039:3717 | sms | src/secmon-micro.js |
| 메시지큐현황 | 4039:5908 | smq | src/secmon-mq.js |
| 인프라현황 | 4039:10484 | smi | src/secmon-infra.js |
| 이벤트현황 | 4038:2699 | sme | src/secmon-event.js |
| 이벤트 판(펼침) | 4041:7220 | smx | src/secmon-eventpanel.js (통합관제 위 40,778) |
| 이벤트 알림 | 4041:7319 | sma | src/secmon-alert.js (660,350 · dim) |
| 사운드 설정 가이드 | 4041:7360 | smg | src/secmon-sound.js (360,240 · dim) |

NKS현황은 메뉴에만 있고 화면이 없다(라이브가 알림).

## 순서

1. `dc-<key>.txt` · `meta-<key>.xml` — design context / metadata(bems 생성기에서 복사, `retarget-secmon.js` 로 표 바꿈)
2. `node dl.js` — 에셋(src/secmon/, 220개)
3. `node mk-secmon-strokes.js` — 그라데이션 선 · 굳은 그라데이션 채움 → screen-css.json
4. `node mk-light-secmon.js` · `node pw.js lt-raster.js` — 라이트 그림 사본(svg 13 · 바탕 png 3) + 라이트 글자색 → light-assets.json · screen-css.json
5. `node conv.js` — 모듈 9 + 미리보기 src/secmon/<page>.html
6. `node mk-live.js` — live-src.js + plant-live 차트 부품 → src/secmon-live.js (고치면 js/core/tpl-modules.js 의 `secmon-live.js?v=` 올림)
7. 스튜디오: `node mk-template.js --force`(js/templates/secmon.js, 이후 손으로) · `node patch-studio.js`(한 번) · `node pw.js cap-thumb.js`

서버: `node serve.js 5620`(WEMB Studio 루트). 검증: `node pw.js cap.js` → `node diff-all.js`(Figma 대조), `live-test.js`, `studio-test.js`, `studio-edit-test.js`,
`cap-contrast.js` → `contrast.js`(라이트 4.5:1), `dark-imgs.js`(라이트에서 짙게 남는 그림 찾기).

## 함정(이 파일에서 새로 만난 것)

1. **선이 레이아웃에 안 들어간다** — `strokesIncludedInLayout=false`(13/13, 제목줄이 패널 0,0). conv.js `SECMON_RING`: 모든 선을 안쪽 링(::after inset:0)으로. CSS border 로 두면 안쪽이 1~2px 밀렸다.
2. **그라데이션 선이 투명으로 나온다** — design context 가 `border-[rgba(...,0)]`. use_figma 로 gradientTransform 을 읽어 노드 크기 기준 CSS 각도 · 정지 위치로 환산(grad-strokes.json, 115곳). 인스턴스 안쪽은 `[data-node-id$=";<꼬리>"]`.
3. **그라데이션 사각형이 1024×21 PNG 로 굳었다**(이벤트 표 행 바탕) — 정지색 그대로 CSS 로(mk-secmon-strokes.js FILLS).
4. **인스턴스 안쪽 레이어명이 낡았다** — 컴포넌트 재정립 뒤 이름이 바뀌었는데 dc · meta 는 옛 이름('1,197' · '<ZAA>…'). names.json(꼬리 id → 지금 이름)을 conv 가 우선(`SECMON_NAMES`).
5. **글자 1~2px 차이로 보이는 것** — 픽셀 확대 대조는 잘못 읽기 쉽다. `ink.js` 로 글자 잉크 위치를 재면 같다(남은 diff 는 안티에일리어싱).
6. **펼친 이벤트 판의 글자 줄(40px)과 줄선 · 등급 점(30px) 간격이 다르다** — Figma 원본 그대로(정적 렌더도 같음). 스크롤은 글자 열만, 줄선은 제자리.
7. **열 단위 표 스크롤** — 열(Cells …)을 잘림 상자 안으로 옮길 때 안쪽 판 크기를 원래 기준 상자(offsetParent) 크기로. 1920 판으로 두면 inset 으로 크기가 정해진 열이 늘어났다.
8. **세로가 긴 스테이지(스튜디오 1216×984)** — 패널마다 0·½·1 로 나누면 KPI 줄과 판 사이가 찢어졌다 → 패널은 헤더 바로 아래(ay 0), 이벤트 바 · 통합관제 차트 판 · 접힘 탭만 아래(ay 1). 띠(KPI Bar 블록)는 자식 패널이 따로 움직이므로 세로 이동 없음.
9. **패널 소속** — 위젯 묶음 밖 조각은 판 안(가운데 점)이면 그 판으로. 표 줄 바탕 · 구분선도 포함(전체 화면 바탕만 제외) — 빼면 옮길 때 줄 바탕이 남았다. 제목줄뿐인 위젯(N-POD 판)은 그 제목을 품은 큰 Shape 를 판 바탕으로.
10. **라이트** — 자동 변환만으로는 바탕 사진 · 판 그림(svg)이 짙게 남아 글자가 묻혔다. HSL(색상 유지, L' = 0.965 − 0.42L, 채도 ½)로 밝은 사본. Redis 카드 C/M 은 색 점 위 흰 글자 원본 유지(회색 점 위 대비 2.5 는 다크 원본과 같음).
11. **Figma (Hover) 변형 레이어**(Button/All · Ack (Hover))는 정지 화면에서는 보이고(=Figma), 라이브에서는 오버 때만.
12. **라이트 아이콘 · 심볼(11-27 사용자 지적)** — `icon-vis.js` 로 그림을 숨긴 화면과의 픽셀 차이(= 바탕에서 드러나는 정도)를 다크 · 라이트 둘 다 재고, 라이트 < 다크 60% 인 66종을 `mk-light-icons.js` 로: svg 는 역할별 색(ICON 짙은 남청 · RING 중간 회청 · STRIP 옅은 청회 · DEEP 옅은 남청 원판), 흰 3D 렌더 png(큐브 · DB · TPQ · 서버)는 명도 · 대비 · 짙은 윤곽 그림자 필터, 로그아웃 png 는 남청 글리프. 남은 11건은 장식 빛 번짐 · 연한 강조 띠(충분히 보임). 순서: mk-light-secmon.js → mk-light-icons.js → conv.js.
13. **svg 다시 칠할 때** — `<mask>` · `<clipPath>` 는 알파라 칠하면 모양이 가려진다(빈 즐겨찾기 별이 사라짐), `&#235;` 같은 문자 참조를 3자리 색으로 읽으면 그림이 깨진다(선 차트) → 둘 다 건너뛴다.
14. **라이트 2차(11-27 사용자: "아이콘을 어둡게 하지 말고 배경을 조절, 칙칙하다")** — 아이콘 짙게 칠하기를 버렸다. 원색은 명도 그대로(채도만 ↑), 흰 글리프는 밝은 브랜드 파랑, 3D 렌더는 밝기 그대로 + 얇은 파랑 윤곽 · 그림자. 바탕은 lt-raster · mk-light-secmon 을 더 밝고 채도 있는 청백으로, 종합상황판 원판 · 도넛 바탕 원은 한 단 진한 하늘색(흰 큐브가 떠 보이게). 헤더 · 이벤트 바는 브랜드 파랑 띠(#1e40af→#2563eb, 흰 글자 ≥ 5:1)로 바꾸고 그 위 흰 로고 · 아이콘은 다크 원본 그대로(content:normal). conv.js `SECMON_FRESH`: 라이트 CSS 의 밝은 무채색(잿빛)을 같은 밝기의 맑은 청백(216°)으로. 이벤트 바 바탕 위 덮개 조각 2개는 칠을 뺀다(파랑 띠를 가렸다).
15. **라이트 3차(11-27 사용자: "배경 색과 아이콘 색이 비슷해 구분이 안 된다")** — 2차의 하늘색 원판 + 파란 윤곽이 반투명 유리 큐브를 같은 파랑으로 물들였다. 흰 · 은색 3D 심볼 아래 판(종합상황판 원판 background.svg · circle.png)은 다크처럼 깊은 남색(명도 차), 3D 윤곽은 중립 짙은 회색 1px(심볼 밝기는 그대로), 판 · 바탕의 파란 기운은 거의 무채색 흰색으로 줄여 파랑은 아이콘에만(conv SECMON_FRESH 채도 0.26/0.2). Max/Min 은 원색 + 얇은 짙은 글자 윤곽(남색 원판 · 흰 바탕 둘 다), Redis 빈 별 칸은 채워진 별과 같은 남색 칸, 도넛 안 원판은 거의 흰색(하늘색 링과 구분).
16. **라이트 4차(11-27 사용자: "그림자 가장 연하게, 배경 동그라미 엄청 연하게")** — 원판(background.svg · circle.png) = 옅은 청백(L ≈ 0.96, 채도 0.3), 3D 그림자 = 0.5px rgba(30,41,59,.22) 하나, 작은 아이콘 윤곽 .18, Max/Min = 그림자 없는 원색(#c026d3 · #0891b2). 대가: 투명 유리 큐브는 흰 바탕에서 옅게 보인다.
17. **라이트 5차(11-27 사용자: "큐브는 어둡게 해서가 아니라 주변 색과 어울리게 해서 보이게")** — lt-raster.js GLASS: 3D 유리 png 의 무채색 픽셀만 브랜드 파랑 유리(217° · 채도 0.86 · 명도 0.34 + L·0.48, 흰 면 0.82)로 물들이고 유리 결 불투명도 1.45배, 원래 색 있는 픽셀(TPQ 분홍 막대 등)은 그대로. 그림자는 4차대로 0.5px 아주 옅게, 원판도 아주 연하게 유지.
18. **라이트 6차(11-27)** — 유리 색 조금 더 진하게(명도 0.3 + L·0.48 · 채도 0.92 · 불투명도 1.6배), 그림자 최대한 연하게(3D 0.5px rgba(30,41,59,.1), 아이콘 .08) — "보이지만 거슬리지 않게".
19. **쌓임 순서(11-27 사용자)** — 통합관제현황의 채널 접속회선 차트 판(Chart Row + 접힘 탭)은 펼친 이벤트 현황 판(z 60)보다 위: `.sl-abovepanel{z-index:62}`(팝업 · 덮는 막 70~71 보다는 아래). 얹힌 팝업 상자(`*-mount`)는 패널 소속에서 뺀다 — 이벤트 판 장면에서 판 상자가 위치상 차트 판으로 들어가 같이 z 62 가 됐다. 함정: `node -e` 안에 `\b` 를 쓰면 백스페이스 문자로 들어가 정규식이 조용히 안 맞는다 → 손으로 고칠 땐 Edit 도구.
20. **라이트 = 참고 이미지(Nexus 대시보드) 체계(11-27 사용자 제공)** — `mk-light-nexus.js`(마지막에 걸리는 꼬리표 nx 규칙): 바탕 단색 #f3f4f7(바탕 사진 감춤) · 판 흰 카드 + 1px #e5e7eb · 헤더 흰색 + 아래 경계선 · 메뉴 회색/고른 메뉴 #111827 · KPI 라벨 = 인디고 옅은 배지(#eef0ff/#4f46e5) · 제목 탭 흰색 + 테두리 · 표 머리줄 #f8f9fb · 이벤트 바 흰 카드 + 등급 배지(옅은 색 + 같은 계열 글자) · 그라데이션 선 → 경계선 하나. conv.js freshenLight 는 무채색을 Nexus 단(#fff · #f6f7f9 · #eef0f3 · #e4e7ec · #cfd4dc · #9aa1ad · #6b7280 · #4b5563 · #111827)으로 스냅(원색 강조색은 그대로). UI 글리프 = 중간 회색, 로고 칩 = 인디고, 유리 심볼 = 인디고 유리(232°). 순서: lt-raster → mk-light-secmon → mk-light-icons → mk-light-nexus → conv. 대비 미달은 장식 '/' 구분자 · 원본 회색 점 위 흰 M 뿐.
21. **마이크로 서비스현황 서비스명(11-27)** — 서비스명 칸 왼쪽 띠(Shape, 꼬리 id 4039:4191)가 다크용 진한 파랑 그라디언트 그대로라 라이트에서 짙은 글자와 겹쳐 안 읽혔다 → 같은 모양의 옅은 인디고 띠(#dfe3ff → 투명) + 서비스명 #111827.
