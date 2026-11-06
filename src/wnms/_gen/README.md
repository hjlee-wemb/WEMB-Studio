# 무선망 통합관리 대시보드 — Figma → 순수 HTML/CSS 재구축

Figma 파일 `WdpL1qGqIo76WQavOsDvp6`(page `Light-시안01`)의 화면 8장을 **순수 HTML/CSS DOM** 으로 다시 지은 것과 그 생성기.
스튜디오 템플릿 이름은 **`Dashboard: Wireless Network Management`** (2D 대시보드 · 에너지·환경 · tpl `wnms`, 슬러그 `dashboard-wireless-network-management`).
같은 분야의 옛 그림 템플릿 `Dashboard: Hanbit` 은 이 템플릿으로 바꾸면서 지웠다(카드 · lib 그림 2장 · 로고 자리표).

| 장면 | Figma 프레임 | node | 생성물 | 접두어 |
|---|---|---|---|---|
| main | Screen/Main - Landscape | `1:1602` | `src/wnms-main.js` | `wnm` |
| main-open | … (Menu Open) | `1:1977` | `src/wnms-main-open.js` | `wno` |
| main-expanded | … (Menu Expanded) | `1:2352` | `src/wnms-main-expanded.js` | `wnx` |
| room-top | Screen/3D Comm Room - Top View | `1:3690` | `src/wnms-room-top.js` | `wnt` |
| room-view | … - Perspective View | `1:3708` | `src/wnms-room-view.js` | `wnv` |
| equipment | Screen/NMS Equipment Diagram | `1:3797` | `src/wnms-equipment.js` | `wne` |
| detail | Screen/NMS Detail Diagram | `1:3943` | `src/wnms-detail.js` | `wnd` |
| login | Screen/Login | `1:2727` | `src/wnms-login.js` | `wnl` |

- 세로형 3장(1080x1920, `Screen/Main - Portrait*`)은 스튜디오가 1920x1080 이라 넣지 않았다.
- 글자는 전부 실제 텍스트(`<p>`), Pretendard Variable CDN. 그래픽은 Figma 가 내보낸 개별 파일(`src/wnms/*.svg|png`).
- Figma 레이어명을 `id` · `class`(`wnm-<레이어명>`) · `data-name` 에 보존. 레이어명 정리 · 익명화 · 가상 데이터는 메모리 `shinhanul-nms-figma-layer-naming`.
- **`src/wnms-<장면>.js` 와 `src/wnms-live.js` 는 손으로 고치지 말 것.** 화면은 conv.js, 라이브는 `live-src.js` 를 고쳐 `node mk-live.js`(차트 부품은 plant-live.js 에서 떠 온다). 고치면 `js/core/tpl-modules.js` 의 `?v=` 를 올린다.

## 파이프라인

신사업 관리(`src/newbiz/_gen/`) 도구를 복사해 `prep.js` · `patch-conv1~3.js` 로 옮겼다(한 번만. 이미 적용됨).

```
1) get_design_context(forceCode, disableCodeConnect, excludeScreenshot) → node save-all-dc.js → dc-<key>.txt
   (큰 응답은 tool-results 파일, 작은 응답은 세션 jsonl 에서 꺼낸다)
2) get_metadata(0:1) → meta-page.xml       인스턴스 레이어명 · 상자 크기
3) node dl.js → node strip-gama.js → node fix-softlight.js   에셋(주소는 7일이면 만료) · 장비 안쪽 그림자
4) powershell mk-dark-images.ps1             바탕 그림 다크 사본(*-dk.*) + dark-assets.json
   Playwright mk-dark-login.js → node mk-dark-login-move.js   로그인 사진의 밤 사본
5) node conv.js                              → src/wnms-*.js + 미리보기 src/wnms/*.html
6) node mk-live.js                           → src/wnms-live.js
7) Playwright cap.js → node diff-all.js · cap-dark.js · cap-live.js · studio-check.js
8) mk-thumb.ps1                              → src/templates/wnms-*.jpg
9) node patch-studio.js                      스튜디오 연결(이미 있으면 건너뛴다. js/templates/wnms.js 는 newbiz.js 에서 매번 다시 뜬다)
```
검증 서버 `node serve.js 5544`(루트 = WEMB Studio). 미리보기 `src/wnms/main.html` — `?live=0` 라이브 없이, `?t=light|dark`, `?edit=1`.

## 이 시안이 다른 시안과 다른 점

- **다크 = 중성 그래파이트(2026-11-06 사용자 지시)** — 남색 다크는 "칙칙해" → "파란 빛 말고 현대적으로". 바탕 · 면 · 선 · 글자는 거의 무채색(색상각 220, 채도 5%), 파랑은 배너 · 단추 · 시각 · 차트 같은 강조에만. 층: 바탕 #0e0f12 < GNB · 헤더 띠 #131519 < 패널 #17191e(1px 흰 테두리 7% · 부드러운 그림자) > 값 칸 #111316. 글자 #eceef2 / 보조 #a7acb6. 바탕 그림 사본도 그래파이트(mk-dark-images.ps1), 3D 렌더는 살짝 누른다(조감도 .88 · 통신실 .74). 라이브의 다크 호버 · 버튼 · 아이콘도 무채색. 요약 배너(Summary Banner)는 다크에서 파란 판 대신 그래파이트 판 + 위 테두리 2px 브랜드 파랑, 값 칸은 들어간 면 + 파란 숫자(#8fb6ff), 장비 타일 초록은 한 톤 깊은 그라데이션, 받침대 · 반사광은 낮춘다(사용자 지시).
- **원본이 라이트다.** `dark.js` 가 light.js 와 같은 모양으로 다크를 파생하고, conv 는 셀렉터의 테마만 `[data-theme="dark"]` 로 쓴다. 스튜디오에서도 처음엔 라이트로 연다(`wemb-wnms-mode` 기본 light). 차트 부품은 공장(다크 원본)의 라이트 규칙을 `:not([data-theme="dark"])` 로 옮겨 쓴다(mk-live.js).
- **Figma 쪽 임시 글꼴** — Pretendard 를 플러그인이 못 불러 Inter · Gothic A1(94% · 자간 -2%)로 넣어 둔 글자가 있다. conv 의 `normFonts` 가 원래 값(Pretendard, 크기 ÷0.94, 자간 0, 라벨 SemiBold 15)으로 되돌린다.

## 밟은 함정

① **아이콘 안쪽 교체를 design context 가 놓친다** — 로그아웃 · 메뉴 화살표(Drop · Drop Close)가 사용자 · 햄버거 그림으로 왔다. 원본 컴포넌트를 download_assets 로 받아 24px 판에 원래 자리로 넣었다(type-logout · type-drop · type-drop-close.svg, conv `normFonts` 의 SWAP).
② **마스크로 잘린 3D 뷰(962x481)** 를 inline-grid 가 자식 크기(1033x730)로 키워 이벤트 표가 눌렸다 → FIX_SIZE(metadata 의 `Widget/3D View`).
③ **인스턴스 이름** — design context 가 변형 이름(`Device=…`, `Type=Firewall`, `Step=Collapsed`)을 준다. conv `realNames` 가 노드 id → 화면 좌표 → 규칙 순으로 실제 레이어명(`Label/…`, `Device/…`, `GNB (…)`)을 되찾는다. `node -e` 로 정규식을 넣으면 백슬래시가 빠진다(`\d` → `d`) — Edit 로 고칠 것.
④ **헤더 가운데 정렬이 `margin-left:-926px`** — 넓힐 때 left 만 바꾸면 왼쪽으로 밀린다. 라이브가 margin 을 0 으로, 제목 · 시계 사이 간격을 다시 잰다.
⑤ **열 높이가 791 로 박혀 있다** — 세로로 긴 창에서 가운데 열이 안 늘었다 → 라이브가 100%.
⑥ **GNB 뿌리는 화면마다 다르다** — 메인은 감싸개(`GNB (…)` > `GNB/Landscape`), 통신실 · 계통도는 판 자체. 판의 Body · Footer 까지 늘이면 로그아웃이 화면 밖으로 나간다.
⑦ **`display:contents` 묶음**(통합관리 서버 2대)은 translate 가 안 먹는다 → 자식으로 내려가 옮긴다.
⑨ **장비 옆면의 검은 그림자(사용자 지적)** — Figma 는 장비 면의 안쪽 그림자를 검정 + `soft-light` 로 내보내는데, SVG 필터의 in2="shape" 는 반투명 한 겹뿐이라 검정이 거의 그대로 남았다(백본스위치 · 방화벽 · IPS · 자료연계 12장). `fix-softlight.js`(dl.js 다음)가 같은 그림자를 장비 주조색의 짙은 색 · 불투명도 ×0.16 의 보통 합성으로 바꾼다. 원인으로 의심했던 변형 순서(scale · skew)도 Tailwind v4 순서로 바로잡았다.
⑩ **영역 상자 점선의 모서리가 끊겼다(사용자 지적)** — 점선을 네 변 그라디언트로 그려 둥근 모서리(12px)가 비었다. 둥근 점선 상자는 Figma 크기 그대로의 SVG 사각형(rx, stroke-dasharray 4 2) 하나로 그린다(conv `roundDash`). ::after 는 투명 테두리 안쪽이 기준이라 inset 을 -테두리 두께로 둬야 원본과 같은 픽셀에 선이 온다. 색은 rgb() 로 적어 다크 · 색 정하기가 닿는다.
⑪ **다크에서 계통도 격자 바탕이 사라졌다(사용자 지적)** — 바탕 그림(background.png)의 밝기 폭이 232~246 뿐이라 일반 다크 변환(뒤집기)으로는 14~18 로 뭉개졌다. mk-dark-images.ps1 이 이 그림만 대비를 늘인다(gain 2.6, 밝은 끝 0.965 기준 → 8~56). 다크 사본은 같은 이름으로 다시 만들어지므로 dark.js 가 url 에 내용 해시(?v=)를 붙인다. PowerShell 변수는 대소문자를 안 가린다 — `$G` 가 그래픽스 `$g` 를 덮어 그림이 전부 검게 나왔었다.
⑫ **다크 로그인 바탕(사용자 지적 "안 보인다" → "더 심미성 있게")** — 사진이라 뒤집으면 큐브가 죽는다. `mk-dark-login.js` 가 브라우저 캔버스에서 밤 사진으로 다시 칠한다: 방은 그래파이트 톤 곡선 + 큐브 쪽 살짝 밝게 · 가장자리 비네트, 빛줄기는 은빛, 큐브 · 원자는 살짝 흐린 사본(필름 결 제거)의 원래 파랑 + 두 겹 블룸(36 · 10px, lighter). 빛남은 큐브 자리(가운데 64% · 70%) 안에서만 — 밖의 푸른 벽까지 잡으면 오른쪽 위에 얼룩이 진다. 하이라이트 문턱(L>0.86)을 낮추면 빛줄기가 큐브 뒤에서 둥근 얼룩이 된다.
⑧ **SVG 선 · 회색 아이콘은 CSS 색이 안 닿는다** — 다크에서 표 구분선 · 눈금선은 밝기를 낮추고 GNB 아이콘은 뒤집는다(라이브 CSS).

## 검증 (2026-11-06 · Playwright)

픽셀차(tol 24, `?live=0`, 라이트): 메인 3장 3.7~4.3% · 통신실 0.1~0.4% · 계통도 4.0~6.4% · 로그인 0.65%. 차이는 거의 글자(Figma 쪽 임시 글꼴 ↔ Pretendard).
스튜디오 #dtStage 여백 `[0,0,0,0]`, 열기 약 0.9초, GNB 이동 0.25~0.72초, 글자 106/106 편집 가능, 콘솔 오류 0.

## 시안에 없어서 정한 것(사용자에게 알릴 것)

- **Event List Fold Button** — 시안에 없다. 이벤트 현황 제목 줄 오른쪽에 원본 아이콘(Drop Close)으로 넣었다. 접으면 3D 뷰가 남는 높이를 채운다. 펼친 GNB 의 메뉴 묶음도 머리를 누르면 접힌다.
- **최근 시각** — 이벤트 발생시간은 원본 간격 그대로 '지금'에서 거꾸로 찍고, 40~60초마다 새 이벤트가 위에 쌓인다(문구는 live-src.js 의 EV_POOL, 가상).
- **라이브 데이터** — 서버 CPU · 메모리 막대 · Top Traffic 이 움직인다. 패널편집 추천 차트 값은 화면 수치와 그 근처 샘플.
- **화면 잇기** — GNB: 햄버거 → 메뉴 열림, 묶음 머리 → 펼침, `<` → 메인, 무선망통합관리시스템 → 메인, 3D통신실 구성도 → 통신실, NMS 설비/세부 계통도 → 계통도, 로그아웃 → 로그인. `3D건물뷰 구성도` 는 화면이 없어 호버만. 장비 타일 → 설비 계통도, DU → 세부 계통도, 랙 라벨 → 다른 시점, LOGIN → 메인.
- **패널 옮기기** — 메인의 옆 열 위젯 4개는 놓는 자리와 맞바꾸고(크기는 자리를 따른다), 가운데 열은 3D 뷰와 이벤트의 위/아래를 바꾼다. 통신실 랙 라벨은 4px 격자 자유 이동. 편집 중엔 글자가 편집 칸이라 패널 여백을 잡아 끈다.
- **심각 장비 경보** — 계통도 장비 상태는 Figma 인스턴스의 Status 변형을 `status.json` 에 옮겨 두고 conv 가 `data-status` 로 심는다(Figma 에서 상태를 바꾸면 이 표도 고칠 것). 라이브가 Critical 장비에 붉은 빛(최대 11px) · 살짝 밝아짐 · 바닥 파동 한 겹 · 이름표 테두리와 옅은 빛을 모든 장비 같은 2.2초 박자로 건다(마우스를 올리면 멈춤). 세기는 사용자와 맞춘 값이다: 1.8초 · 파동 두 겹 · 14px 는 "너무 정신없이 커", 2.6초 · 7px · 옅은 파동은 "너무 줄었어" — 지금이 그 사이. 경고(Warning) 장비는 장비는 그대로 두고 이름표만 같은 빨강으로 알린다(사용자 지시). 지금 심각은 설비 계통도의 백본스위치 · NVR · 무선망관리 시스템 3대, 세부 계통도에는 없다. 경보 빨강은 색 정하기에도 바뀌지 않는다.
- **로그인 로고(2026-11-06 Figma 변경)** — 왼쪽 위 · 카드 머리가 WEMB Studio 칩 + 글자로 바뀌었다(`black.svg` · `logo-chip.svg`, 글꼴 Pretendard GOV → Pretendard). 새 묶음 레이어명이 Figma 에서 `Frame 7` 이라 class 도 `wnl-Frame-7` 이다. 메타데이터는 meta-page.xml 끝에 덧붙였다. 다크에서는 검은 칩에 옅은 테두리를 준다.
- 템플릿 날짜 `May 20, 2026` — 파일 이름 202605 에서, 일은 임의. 에셋 · 분자 라이브러리는 미등록.
