# 신한카드 정보보호 대시보드 — Figma → 순수 HTML/CSS 재구축

Figma 파일 `zXb8i3nonD9Hpu5kdZQs6t`(202303 신한카드 정보보호 대시보드, page `Dark-시안01`)의 화면 4장을
**순수 HTML/CSS DOM** 으로 다시 지은 것과 그 생성기. 스튜디오 템플릿 이름은
**`Dashboard: Shinhan Card Security`** (2D 대시보드 · 안전·보안 · tpl `shinhan`).

| 화면 | Figma node | 생성물 | 접두어 | 장면 키 |
|---|---|---|---|---|
| Screen/Security Overview (보안 현황) | `2:2` | `src/shinhan-overview.js` · `overview.html` | `shm` | `overview` |
| 보안 현황 + Dim + Dialog/Anomaly Registration | `62:5` (창 `66:1026`) | `src/shinhan-register.js` · `register.html` | `sha` (층 1, 뿌리는 `shm`) | `register` |
| Screen/Security Data Entry (정보보호 현황 입력) | `67:1067` | `src/shinhan-entry.js` · `entry.html` | `shi` | `entry` |
| Screen/Anomaly Detection (이상징후 탐지) | `71:2243` | `src/shinhan-anomaly.js` · `anomaly.html` | `shd` | `anomaly` |

원칙(LS Electric · POSCO · 한진 · HANA 와 같다)
- 글자는 전부 편집 가능한 실제 텍스트(`<p>`, Pretendard CDN). 아이콘·그래픽만 Figma 가 내보낸 개별 파일(`src/shinhan/*.svg|png`, 52장 + 라이트 사본 35장). 손으로 그린 벡터 없음.
- Figma 레이어명을 `id` · `class`(`shm-<레이어명>`) · `data-name` 에 보존. 레이어명은 먼저 SK하이닉스 기준 어휘로 정리했다(메모리 `shinhancard-security-figma`).
- **생성물(`src/shinhan-*.js` 4개)은 손으로 고치지 말 것.** conv.js 를 고쳐 다시 돌린다. `src/shinhan-live.js` 는 손으로 쓴 파일이다.

## 파이프라인

LS Electric(`src/lselectric/_gen/`)의 conv.js · light.js · dl.js · dedupe · mk-light-assets 등을 복사한 뒤 `patch-config.js` 로 이 시안에 맞췄다.

```
1) get_design_context(forceCode) → 파일로 떨어진 응답은 save-dc.js, 대화로 온 응답은 extract-dc.js(세션 jsonl)
     dc-2-2.txt(잘림) · dc-rc-2-2.txt(우측 열 80:21) · dc-66-1026.txt · dc-67-1067.txt · dc-71-2243.txt
   get_metadata(0:1) → meta-page.xml · get_screenshot(1920) → figma-*.png (strip-gama.js)
2) node patch-config.js       화면 목록 · 경로 · 이름 · 그라디언트 선(SCREEN_CSS) · Dim
3) node splice-right.js       2:2 의 잘린 우측 열을 따로 받은 80:21 로 갈아 끼운다(함정 ①)
4) node dl.js → node strip-gama.js → node dedupe-assets.js → node mk-light-assets.js
5) node patch-glass.js        유리(배경 흐림) 그림을 인라인 SVG 로(함정 ②) — 한 번만
6) node conv.js               → src/shinhan-*.js + 미리보기 html
7) 미리보기 캡처(thumb-*.png, ?live=0&t=dark) → powershell -File mk-thumb.ps1 → src/templates/shinhan-*.jpg
8) node patch-studio.js       스튜디오 연결(한 번만 · 이미 있으면 건너뛴다)
```
검증 서버: `node serve.js 5521` (루트 = WEMB Studio). 미리보기 `src/shinhan/<page>.html` — `?live=0` 이면 라이브 없이(픽셀 대조),
`?t=light|dark` 테마 고정, `?edit=1` 편집 모습(차트 단추 · 옮기기).

## 밟은 함정

① **2:2 의 design context 가 100KB 에서 잘렸다** — 좌측 열까지는 온전하고 우측 열 여는 줄 바로 뒤에서 끊긴다.
   우측 열(80:21)만 따로 받아 `splice-right.js` 가 갈아 끼운다(받은 쪽 에셋 상수는 `imgR…`). 우측 열 뒤 형제 `Marker (Stray)`(19:18)도
   잘려 나가 같은 자리 · 같은 그림인 입력 화면 67:1690 그림으로 붙였다(패널에 가려 안 보이는 떠 있는 조각).
② **유리(BACKGROUND_BLUR) 그림** — Figma 는 `<foreignObject>` 안 `backdrop-filter` div 로 내보낸다. `<img>` 로 넣으면 브라우저가
   foreignObject 를 안 그려 유리판 뒤가 안 흐려진다(아이콘 배지 · KPI 카드 · 판 테두리). `patch-glass.js` 가 conv.js 에 `glassSvg` 를 넣어
   그런 파일은 **원본 SVG 그대로 인라인**(id 만 자리마다 새로) — 라이트 사본은 형제로 두고 `[data-sh-theme]` 로 하나만 보인다.
   `ls-inl` · `data-src` 를 달아 '색 정하기'(image.js)가 `<img>` 와 같은 규칙으로 칠한다.
   **Bash heredoc 으로 패치 스크립트를 쓰면 백슬래시가 빠진다** — 처음 시도에서 정규식이 깨져 Edit 로 고쳐 넣었다.
③ **그라디언트 선** — design context 는 단색으로 뭉갠다. use_figma 로 stroke · gradientTransform 을 읽어 `patch-config.js` 의 `cssGrad()` 로
   계산해 `SCREEN_CSS` 에 적었다: 표 줄 Row BG(#355d8f→#4664af) · 진척율 줄 · 보안등급 배지(6:298) · 등록 창 입력칸 · 입력 단추 · 조회 단추.
   등록 창(66:1026)은 **3px OUTSIDE** 대각 그라디언트 — CSS border(안쪽)를 걷고 상자 밖 링(`::after`)으로.
④ **헤더 바 가운데 정렬** — 생성기가 `translateX(-50%)` 를 고정 margin 으로 바꿔 둔다(LS ⑭). 폭을 늘려도 왼쪽 끝이 제자리라
   live 가 반을 더 밀면 오른쪽 시계가 화면 밖으로 나갔다 → margin 이 있으면 밀지 않는다.
⑤ **열린 창 애니메이션이 `translate` 를 덮었다** — 반응형 자리(`--sh-tx/ty`)가 translate 속성을 쓰므로 여는 움직임은 transform 으로만.
⑥ Playwright 캡처에서 CSS 전환(transition)이 0초에 멈춘 채 찍히는 때가 있다(테마 바꾼 직후 메뉴 글자가 흐리게) — 실사용과 무관.

## 검증 (2026-10-29 · Playwright 1920x1080)

| 화면 | 픽셀차(tol 24, `?live=0`) |
|---|---|
| 보안 현황 2:2 | 5.66% |
| 이상징후 탐지 등록 62:5 | 3.89% |
| 정보보호 현황 입력 67:1067 | 1.11% |
| 이상징후 탐지 71:2243 | 3.97% |

차이는 거의 전부 글자 가장자리(Figma 렌더가 글자를 더 가늘게 그린다) — pair.js 로 자리 · 크기 일치를 눈으로 확인.
라이브 켠 화면 = 정적 화면(입력 · 이상징후 0.05%). 반응형 1248x952 · 2400x1000 바탕 여백 `[0,0,0,0]`, 스튜디오 #dtStage 여백 `[0,0,0,0]`, 등록 창 정확히 가운데.
대비 3:1 미만: 라이트 — 빈 일정(목 · 금, 원본도 흐린 '비어 있음') 2개뿐 · 다크 — 원본의 흐린 시나리오 막대 수치 8개(원본 그대로).

## 인터랙션 · 라이브 (`src/shinhan-live.js`)

- **반응형** — 1920x1080 좌표계 + 균일 배율 S. 보안 현황 위젯(Figma GROUP · display:contents)은 화면 크기 투명 층(`.sh-wl`)으로 세워
  translate 하나로 옮긴다. 남는 높이는 열마다 위젯 판(Background)이 나눠 갖고 내용은 판 가운데 — 여백 없이 꽉 찬다. 남는 폭은 두 열이 반씩.
  이상징후 표는 남는 높이를 표 줄이 나눠 갖는다(`--sh-rowh`).
- 실시간 시계(`2026/10/29 Thu` · `14:30:45`). **열 때마다 최근** — 트래픽 날짜 칩 · 연도, 경보 공지일시(이틀 전), 주요 일정(이번 주 월~금),
  이상징후 기준일자, 입력 화면 기준 월, 등록 창 기준일자.
- 헤더 메뉴 — Main화면 → 보안 현황, 이상징후탐지 → 이상징후 탐지, 정보보호점검 · 내부통제검토 → 정보보호 현황 입력(같은 프로젝트의 형제 화면),
  주요일정 → 주요 일정 위젯 반짝. 하위 화면의 브랜드 → 보안 현황.
- 라이브 — 트래픽 선 네 줄이 흐른다(Figma 선 그림을 인라인으로, 모든 점에 `A·(sin(kx−ωt+φ) − sin(kx+φ))`, t=0 = 원본),
  시나리오 막대가 열 때 자라 오르고 3.2초마다 오르내린다, 금일 건수가 이따금 +1(그 줄의 당월 누적도), KPI 숫자 차오름,
  방패 링 회전 · 경보 배지 빛 · 하이라이트 숨쉬기 · 타임라인 점 차례로. 사람이 고친 글자는 덮지 않는다.
- 시나리오 막대 — 마우스를 올리면 하이라이트가 그 시나리오로 미끄러지고 글자가 원본 '선택' 색으로.
- 이상징후 표 — 줄 누르기(원본 '선택 줄' 모습을 옮긴다 · 체크), 체크박스, **두 번 누르면 그 줄 값으로 '이상징후 탐지 등록' 창**을 지금 화면 위에
  겹쳐 띄운다(Esc · 닫기 · 등록 · 바깥 누르면 닫힘, 새로고침 = 값 되돌리기), 대분류 칸을 누를 때마다 다음 분류로 거르기, 조회 = 다시 그리기.
- 입력 화면 — '입력' 을 누르면 그 표의 값 칸을 바로 고친다(Enter 다음 칸 · Esc 끝 · 끝내면 저장 `wemb-shinhan-entry`).
- **차트 바꾸기(패널편집 중)** — 위젯마다 추천 차트(첫 항목 = 추천): 트래픽 · 탐지 유형 · 점검 상태 · 일정 · 시나리오 · 정보반출 승인 · 심의/검토 · 협력사 진척.
  원본 팔레트(#00baff · #7e41ff · #4571ff · #00f6ff · #60ed8e)로 그리고 실시간처럼 흐른다. '원본 그대로'로 되돌린다. 장면별 저장 `wemb-shinhan-chart`.
- **패널 옮기기(패널편집 중)** — 보안 현황 위젯은 다른 열 · 다른 자리에 놓으면(점선 자리표시) 두 열이 14px 간격으로 다시 쌓인다.
  넘치면 놓은 자리의 위젯과 자리를 바꾼다. 입력 화면 위젯은 줄 속 순서 바꾸기(FLIP), 이상징후 검색줄 · 표 · 등록 창은 4px 격자 자유 이동.
  장면별 저장 `wemb-shinhan-layout`, 스튜디오 '배치 초기화'(#layoutReset)가 있으면 되돌린다.
- 호버 — 메뉴 · 액션 아이콘(시계 한 바퀴) · 버튼 · 입력칸 · 소제목 단추 · 표 줄 · 지표 칩 · KPI · 일정 카드 · 배지 · 체크박스.
- **라이트 테마** — light.js 파생 위에 live 시트가 역할별로 다시 적는다(그라디언트 제목 · 표 줄 · KPI · 지표 칩 · 일정 · 거르기 칸 · 등록 창 · 차트).

## 스튜디오 연결

`js/templates/shinhan.js`(SH_SCREENS · applyShinhanDT · __gotoShinhanScene · 시드 #4571FF) ·
`js/core/tpl-modules.js`(모듈 4 + live — **?v= 는 여기서 올린다**) · `studio.html`(연결 스크립트) · `js/launcher/templates.js`(카드 → 실제 화면 4장) ·
`js/launcher/home.js`(tplScene register · entry · anomaly) · `js/studio/project.js` · `js/core/projects.js` · `js/main.js`(새로고침 복원 · 밝기 `wemb-shinhan-mode`) ·
`js/templates/image.js`(`SHINHAN_OPT` — 로고는 색 유지, 바탕 사진은 픽셀 재도색) · `js/studio/dt-edit.js`(DTSEL) · `js/studio/atom-swap.js`(PXS). 전부 `patch-studio.js`.

아직 안 한 것: 분자 라이브러리(wemb-atomic) 추출기 화이트리스트 · 에셋 라이브러리 등록.
