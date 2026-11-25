# 스마트 빌딩 에너지 관리 — 생성기

원본은 Figma `CKnzs0z7gCSTPybhRZme1P`(202403-대만 Bio-Tech, 익명화 · 가상 데이터본)의 `Dark-시안01` 페이지입니다.
스튜디오 템플릿 이름은 **`Digital Twin: Smart Building Energy Management`**(tpl `bems`)입니다.
화면 안 글자는 가상 데이터만 씁니다(기준 시각 2026-12-09 19:42, 계약전력 2,000kW 가정).

| 장면 | 접두어 | Figma | 모듈 | 비고 |
|---|---|---|---|---|
| main 메인 | bem | 1:3 | src/bems-main.js | design context 가 10만 자에서 잘려 compose-main.js 로 Widget/KWH(7:279)를 이어 붙임 |
| floor 층별 현황 | bef | 7:472 | src/bems-floor.js | |

## 만드는 순서
1. get_design_context(1:3 · 7:472 · 7:279) → `node pull-dc.js <세션 jsonl> <tool-results 폴더>` 로 dc-*.txt(손으로 옮기지 않는다 — 대화로만 온 응답도 jsonl 에 있다). 메인은 `node compose-main.js`.
   get_metadata(0:1) 결과로 meta-1-3.xml · meta-7-472.xml(같은 페이지 목록).
2. `node dl.js` → `node strip-gama.js` 로 에셋 68개를 src/bems/ 에 받습니다.
3. 라이트 그림 사본 `node mk-light-bems.js`(svg 29장 → *-lt.svg + light-assets.json), 라이트 손규칙은 screen-css.json(`키:light`).
   깊이감 규칙은 `node mk-light-depth.js` 가 screen-css.json 에 `/*DEPTH*/` 줄로 넣는다(다시 돌리면 그 줄만 바뀐다):
   판 = 흰 면 + 옅은 세로 그라디언트 + 선 rgba(112,138,180,.24) + 겹친 부드러운 그림자, 칸 = 옅은 회청 면 + 윗면 하이라이트 + 선 .2,
   강조(Top3 칩 · 헤더 단추 · CR/WA · 고른 필터) = 색 선 35~50% + 작은 그림자, 막대 · 범례 하늘 → 짙은 청록 #10aacd. 모양 · 선 두께는 그대로.
   대비는 `node pw.js cap-contrast.js` → `node contrast.js lfull-<장면>.png lboxes-<장면>.json 4.5`(main 0 · floor 0, 스크롤 밖에 가려진 이벤트 줄 5개는 오탐).
4. `node conv.js` 로 모듈 2개와 미리보기(src/bems/main.html · floor.html)를 만듭니다.
5. 라이브 `node mk-live.js`(live-src.js + src/plant-live.js 의 차트 부품 → src/bems-live.js). 고치면 js/core/tpl-modules.js 의 `?v=` 를 올립니다.
6. 스튜디오 연결: js/templates/bems.js(mk-template.js 가 데이터센터 연결 파일로 처음 만든 뒤 손으로) · `node patch-studio.js`(이미 적용).
7. 썸네일 `node pw.js cap-thumb.js` → src/templates/bems-main.jpg · bems-floor.jpg(1920x1080).

## 라이브(live-src.js)에서 하는 일
- 반응형: 1920x1080 + 균일 배율, 남는 폭 · 높이는 첫 단 묶음이 자리에 따라 나눠 갖는다(헤더 띠는 늘림, 층 선택 판 · 탭은 자리 비율대로).
- 실시간 시계(YY-MM-DD · HH:MM), 이벤트 발생시각을 '지금' 기준으로(열 때마다 최근), 새 이벤트가 28초마다 맨 위로(알림 끄기 = 헤더 ✕).
- 탭 MAIN · FLOOR = 장면 이동(OVERVIEW 는 시안에 없어 안내만). 층 선택: 마커가 미끄러지고, 메인에서 누르면 층별 현황으로 넘어가며(sessionStorage wemb-bems-floor)
  층별 현황에서는 이벤트 층 · 자산 이름 · 상태 카드 수 · 급수 차트가 그 층으로 바뀐다.
- 메인 설비 목록을 누르면 층별 현황으로 가며 그 필터가 켜진다. 경보 수가 가끔 바뀌고 Event Count 가 따라 는다.
- KW · KWH 막대 — 들어올 때 자라고, 3초마다 마지막 막대가 흔들리고 20초마다 한 칸 흐른다. 오른쪽 현재값 · AVG · MAX · 헤더 kW · 누적 kWh · 總電量 Today 가 따라간다.
- 급수 면적 차트 — Data 그림(data.svg)을 글자 SVG 로 들여와 같은 그라디언트로 최근 4시간 값만 흔든다. 측정값 · 추세 화살표가 따라간다.
- 자산 목록: 두 무리를 스크롤 상자(.be-tree) 하나로 묶고 무리마다 펼치기 · 접기(PDU 외 무리는 자산을 만들어 넣는다), 자산 고르기, 검색, 판 접기(»).
- 이벤트 목록: 범례 줄 끝 Fold Button(트리 꺾쇠 모양) — 목록이 접히고 카드 바탕도 줄어든다(기억), 지난 이벤트 4건은 스크롤로.
- 패널편집: 차트 바꾸기(KW · KWH · 總電量 · Event Count · 급수 · 주요 설비) · 패널 옮기기(위젯 단위, 4px 격자) · 배치 초기화.

## 함정
- 메인 design context 는 서버 한도(10만 자)에서 잘린다 → 잘린 위젯을 따로 받아 끼운다. 따로 받은 응답의 'absolute contents left/top' 묶음은 자식 좌표가 **묶음 기준**이라(메인 응답은 화면 기준) 자리 잡힌 상자로 바꾼다(`top-0` 도 잡을 것 — 건물 아이콘이 8.7px 어긋났다).
- 이 파일은 Figma 가 선을 레이아웃에 넣어 냈다(Top3 칩 69 = 글자 37 + 여백 14×2 + 선 2×2) → 링으로 바꾸면 2px 씩 줄어 옆 표가 밀린다. 그렇다고 CSS border 로 두면 그 위에 까는 채움 층(테두리 밑까지 넓힌 검정 판)이 선을 덮어 헤더 단추 파란 테두리가 사라진다
  → conv.js BEMS_LAYOUT_RING: 투명 border 로 자리를 잡고 같은 굵기 링(::after, inset −선)을 맨 위에 그린다. 넘침을 자르는 상자는 링이 잘리므로 border 그대로.
- 크기가 다른 span 한 글자(98 + 작은 %)는 위에 붙이면 % 가 위첨자처럼 떴다 → 기준선 flex(BEMS_MIXED_SPAN).
- 트리 무리 상자는 Figma 높이(고정)라 펼친 목록을 끼우면 flex 가 줄여 스크롤이 안 생겼다 → 높이 auto · 자식 flex-shrink 0.
- 층 색은 클래스로만(.be-act) — 처음 테마에서 잰 색을 인라인으로 박으면 테마를 바꿔도 안 바뀐다.
- 라이트: 헤더 판 · 탭 판 · 아이콘 · 로고는 SVG 라 글자만 바뀌면 짙은 판 위 짙은 글자가 된다 → 사본(-lt.svg). 바탕 사진은 invert + hue-rotate(180°) 로 밝기만 뒤집는다. 3D 렌더 · 건물 아이콘 · 차트 선/면은 그대로.

## 검증
- 서버 `node serve.js 5610`(WEMB Studio 루트), 브라우저 `node pw.js <스크립트>`.
- `cap.js` → `diff-all.js`(다크 정지 화면 대 Figma): main 3.8% · floor 2.4% — 글꼴 안티에일리어싱 차이.
- `live-check.js [w h light]` — 라이브 · 시계 · 최근 시각 · 트리 · 급수 SVG · 차트 단추.
- `studio-test.js` — 갤러리 → 스튜디오 열기 → #dtStage 여백 0, 탭 이동 0.29~0.34초(1.5초 규칙), 층 5 → 5F 글자, 트리 스크롤 · 필터 · 이벤트 접기, 라이트, 콘솔 오류 0.
- `studio-edit-test.js` — 패널편집: 글자 169/169 편집, 패널 이동, 차트 바꾸기(메인 · 층별), 색 정하기(시드), 라이트.
