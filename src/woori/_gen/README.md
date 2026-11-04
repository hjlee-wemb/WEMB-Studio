# 우리은행 통합 대시보드 — Figma → 순수 HTML/CSS 재구축

Figma 파일 `qln8qMsqzCt918dZOQOWOS`(202304-우리은행, page `Dark-시안01`)의 화면 3장을
**순수 HTML/CSS DOM** 으로 다시 지은 것과 그 생성기. 스튜디오 템플릿 이름은
**`Dashboard: Woori Bank`** (2D 대시보드 · 서비스·거래 · tpl `woori`).

| 화면 | Figma node | 생성물 | 접두어 | 장면 키 |
|---|---|---|---|---|
| Screen/Transaction Status (거래현황) | `11:946` | `src/woori-transaction.js` · `transaction.html` | `wrt` | `transaction` |
| Screen/Performance Status (성능현황) | `15:2` | `src/woori-performance.js` · `performance.html` | `wrp` | `performance` |
| Screen/Event Status (이벤트현황) | `19:2533` | `src/woori-event.js` · `event.html` | `wre` | `event` |

원칙(한진 · POSCO · LS Electric · 신한카드와 같다)
- 글자는 전부 편집 가능한 실제 텍스트(`<p>`). Pretendard CDN, 숫자는 원본 글꼴 Tomorrow(`src/fonts`). 아이콘 · 그래픽만 Figma 가 내보낸 개별 파일(`src/woori/*.svg|png`).
- Figma 레이어명을 `id` · `class`(`wrt-<레이어명>`) · `data-name` 에 보존. 레이어명은 먼저 SK하이닉스 기준 어휘로 정리했다(메모리 `woori-bank-figma`).
- **생성물(`src/woori-*.js` 3개)은 손으로 고치지 말 것.** conv.js 를 고쳐 다시 돌린다. `src/woori-live.js` 는 손으로 쓴 파일이다.

## 파이프라인

신한카드(`src/shinhan/_gen/`)의 도구를 복사한 뒤 `patch-*.js` 로 이 시안에 맞췄다.

```
1) get_design_context(forceCode) → extract-dc.js(대화로 온 응답) · save-dc.js(파일로 떨어진 응답)
     dc-11-946.txt · dc-15-2.raw.txt(잘림) · dc-19-2533.raw.txt(잘림) · dc-part-*.txt(잘린 자리를 따로 받은 것)
   get_metadata(0:1) → meta-page.xml · get_screenshot(1920) → figma-*.png
2) node splice-dc.js          잘린 화면 dc 를 이어 붙인다(함정 ①)
3) node patch-config.js       화면 목록 · 경로 · 이름 · Tomorrow · 인라인 SVG 목록
   node patch-svg-class.js · patch-fidelity.js · patch-line-width.js · patch-snap.js · patch-connectors.js · patch-light-tables.js
4) node dl.js → node strip-gama.js → node dedupe-assets.js
5) node mk-light-assets.js → node mk-light-woori.js      라이트 그림 사본(자동 → 파일별 색표)
6) node mk-screen-css.js      선 규칙 · 라이트 규칙(screen-css.json)
7) node conv.js               → src/woori-*.js + 미리보기 html
8) (mk-snap.js 를 Playwright 로) snap-*.json 측정 → node conv.js 다시
9) 미리보기 캡처(thumb-*.png, ?live=0&t=dark) → powershell -File mk-thumb.ps1 → src/templates/woori-*.jpg
10) node patch-studio.js      스튜디오 연결(한 번만 · 이미 있으면 건너뛴다)
```
검증 서버: `node serve.js 5531` (루트 = WEMB Studio). 미리보기 `src/woori/<page>.html` — `?live=0` 이면 라이브 없이(픽셀 대조),
`?t=light|dark` 테마 고정, `?edit=1` 편집 모습(차트 단추 · 옮기기). Playwright 스크립트: `cap.js`(캡처 + Figma 상자 대조) · `live-check.js`(반응형 여백) · `cap-light.js`.

## 밟은 함정

① **design context 가 100,000자에서 잘린다** — 15:2 는 Table Row 안, 19:2533 은 Event List 안에서 끊긴다. 잘린 위젯을 따로 받아 `splice-dc.js` 가 이어 붙인다. 받은 쪽 에셋 상수는 접두어(`imgTP…` `imgEL…`)로 겹치지 않게.
② **가운데 정렬 선(1.055px)** — design context 는 CSS border(안쪽)로 준다. 오토레이아웃 폭까지 밀려(메뉴 줄 2px) 상자가 어긋났다. 테두리를 걷고 상자 안팎 1px 을 절반 농도로 칠한다(`mk-screen-css.js center()` — Figma 렌더 값과 같다). 값은 `use_figma` strokeAlign 으로 읽었다.
③ **점선 간격** — CSS dashed 는 간격을 못 정한다. 원본 4,2 · 4,4 · 2.11,2.11 을 `::after` 배경(repeating-linear-gradient)으로(conv.js `dashGroups`). 투명 테두리가 자리를 지킨다.
④ **그라디언트 선** — 단색으로 뭉개져 온다. 칩 · 제목 알약 · 등급 칩 · 범례 아래 선을 `use_figma` gradientTransform 으로 `cssGrad()` 계산. 원형 카운터(13:1425)는 둥근 끝 3,6 점선 + 대각 그라디언트라 SVG 데이터 URI.
⑤ **낡은 묶음 크기** — `Data` · `Line/*` GROUP 메타데이터가 405 · 552 로 멈춰 있고 안쪽 벡터는 판 폭(391 · 401 · 540~555)이다. 100% 로 펴면 선이 늘어난다 → SVG 원래 폭 기준으로 보정(`patch-line-width.js`, mk-screen-css 의 9:667 · 9:847).
⑥ **그림은 정수 픽셀에 그려진다** — 브라우저가 `<img>` · 인라인 `<svg>` 자리를 반올림해 Figma 와 0.5px 씩 어긋났다. `mk-snap.js` 로 재서 transform 으로 되돌린다(snap-*.json). 글자는 틀을 별도 층(will-change)으로 올려 흑백 안티에일리어싱으로(LCD 색 번짐 제거) — 배율이 1 이 아니면 라이브가 끈다(옛 해상도에 묶여 흐려진다).
⑦ **인라인 SVG 클래스** — 도형 id 가 모두 `Line` 이라 클래스가 겹쳐 시간별 발생 다섯 줄이 한 색이 됐다 → 파일 이름을 넣었다(`patch-svg-class.js`). 그라디언트 정지색도 클래스로 빼서 라이트 · 색 정하기가 닿게 했다.
⑧ **원본 그림 해상도** — 3D 장비 PNG 원본이 106x84 다(download_assets 로 확인). Figma 와 브라우저의 확대 보간 차이는 남는다.
⑨ **연결선 그림의 선도 이름이 `Line`** — 라이브가 차트 선으로 잡아 흔들었다. `Line/…` 묶음 안의 것만 차트다.
⑩ **`.dt-editing *` 애니메이션 멈춤** 이 바꿔 넣은 차트의 나타나기까지 멈춰 빈 판이 됐다 → `[data-name]` 오브젝트만 멈춘다.
⑪ **편집 중 클릭은 dt-edit.js 가 캡처 단계에서 막는다** — 편집 중 단추는 pointerup 으로 받는다(차트 단추 · 배치 초기화).
⑫ **테마는 화면마다 따로 저장되고 main.js 가 그린 뒤에 복원한다** — 메뉴로 넘어가면 밝기 · 색이 초기화됐다. `wemb-woori-carry`(sessionStorage)로 넘기고 복원이 끝난 다음 차례에 입힌다(js/templates/woori.js).
⑬ **Bash heredoc 은 `\\` 를 하나로 줄인다** — 정규식이 든 패치는 Write 로 파일을 만들거나 Edit 로.

## 검증 (2026-11-03 · Playwright 1920x1080)

| 화면 | 픽셀차(tol 24, `?live=0`) | Figma 상자 대조(±0.6px) |
|---|---|---|
| 거래현황 11:946 | 3.77% | 439개 중 어긋남 4(회전 · 뒤집힌 노드 표기 2 · 낡은 묶음 2) |
| 성능현황 15:2 | 4.48% | 648개 중 4(회전 · 뒤집힌 노드 표기) |
| 이벤트현황 19:2533 | 7.52% | 482개 중 1(회전 노드 표기) |

차이는 거의 전부 글자 가장자리다(Figma 렌더가 글자를 더 가늘게 그린다. 이벤트현황은 표 글자가 많아 수치가 높다).
반응형 1248x852 · 2400x1000 바탕 여백 `[0,0,0,0]`, 스튜디오 #dtStage 여백 `[0,0,0,0]`.
글자 대비(audit.js): 다크 미달 0, 라이트 미달 0(4.5:1).

## 인터랙션 · 라이브 (`src/woori-live.js`)

- **반응형** — 1920x1080 좌표계 + 균일 배율 S. 남는 높이 · 폭은 패널이 나눠 갖는다(차트 판 · 표 줄 · 격자가 늘어난다). 정확히 16:9 면 Figma 와 같다.
- 실시간 시계. **열 때마다 최근** — 이벤트 발생일시(`recent-time.js`, 줄 사이 간격은 원본 그대로) · 시간축(10분 단위로 내림).
- 헤더 메뉴 — 같은 프로젝트의 형제 화면으로. 네트워크 칩 — 하나만 켜진다. 범례 — 눌러 시리즈 끄고 켜기.
- 라이브 — 금일 막대 · 꺾은선이 움직이고(`A·(sin(kx−ωt+φ) − sin(kx+φ))`, t=0 = 원본), 피크일 · 기준선은 그대로. KPI · 읽음 칸 · 표 숫자가 따라 바뀐다. 사람이 고친 글자는 덮지 않는다.
- 움직임 — 도넛 그려지기 · 연결선 화살표 차례로 · 장비 떠 있기 · 카운터 링 회전 · 빛 숨쉬기.
- **이벤트 목록** — Fold Button(원본에 없어 드롭다운의 펼침 그림을 그대로 씀, 제목을 눌러도 된다)으로 접고 펴면 현황 판이 그 자리를 채운다. 등급 칩 · 조회 · 구분 · 수집 · 초기화로 거르기(흐리게), 줄 고르기 · ACK, 자동고침(10 · 30 · 60초 · 끄기 — 새 이벤트가 맨 위로, 등급 칩 · 도넛 범례 숫자도 함께).
- **차트 바꾸기(패널편집 중)** — 패널마다 추천 차트(첫 항목 = 추천), '원본 그대로'로 되돌린다. 장면별 저장 `wemb-woori-chart`.
- **패널 옮기기(패널편집 중)** — 같은 묶음의 다른 자리에 놓으면(점선 자리표시) 나머지가 흘러 빈틈 없이 다시 앉는다. 묶음: KPI · 막대 · 꺾은선 / 차트 · 표 / 현황 · 목록. 구성도 · 네트워크 거르기는 4px 격자 자유 이동. 장면별 저장 `wemb-woori-layout`, 화면 위 '배치 초기화'로 되돌린다.
- 호버 — 메뉴 · 아이콘 · 칩 · 구성도 · 수치 칸 · 카드 · 표 줄 · 버튼 · 등급 칩 · 드롭다운 · 입력칸 · 범례.

## 스튜디오 연결

`js/templates/woori.js`(WR_SCREENS · applyWooriDT · __gotoWooriScene · 시드 #09B6FB) ·
`js/core/tpl-modules.js`(모듈 3 + live — **?v= 는 여기서 올린다**) · `studio.html`(연결 스크립트) · `js/launcher/templates.js`(카드 → 실제 화면 3장) ·
`js/launcher/home.js`(tplScene performance · event) · `js/studio/project.js` · `js/core/projects.js` · `js/main.js`(새로고침 복원 · 밝기 `wemb-woori-mode`) ·
`js/templates/image.js`(`WOORI_OPT`) · `js/studio/dt-edit.js`(DTSEL) · `js/studio/atom-swap.js`(PXS) · `js/core/meeting.js`(가릴 이름). 전부 `patch-studio.js`.
