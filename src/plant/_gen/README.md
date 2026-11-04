# 공장 전력설비 디지털 트윈 — Figma → 순수 HTML/CSS 재구축

Figma 파일 `hHans6kNFlTP98CO1O431o`(page `Dark-시안01`)의 화면 한 장을 **순수 HTML/CSS DOM** 으로 다시 지은 것과 그 생성기.
스튜디오 템플릿 이름은 **`Digital Twin: Plant Power Facility`** (3D 디지털트윈 · 발전·에너지 · tpl `plant`). 파일 이름에 고객사 흔적이 있어 템플릿 이름에는 쓰지 않는다.

| 화면 | Figma node | 생성물 | 접두어 |
|---|---|---|---|
| Screen/Facility Overview | `1:2` | `src/plant-overview.js` · `src/plant/overview.html` | `pfo` |

- 글자는 전부 실제 텍스트(`<p>`). Pretendard Variable CDN, 시계만 원본 글꼴 Tomorrow(`src/fonts`). 그래픽은 Figma 가 내보낸 개별 파일(`src/plant/*.svg|png`).
- Figma 레이어명을 `id` · `class`(`pfo-<레이어명>`) · `data-name` 에 보존한다. 레이어명 정리는 메모리 `plant-facility-figma`.
- **`src/plant-overview.js` 는 손으로 고치지 말 것.** conv.js 를 고쳐 다시 돌린다. `src/plant-live.js` 는 손으로 쓴 파일이다(고치면 `js/core/tpl-modules.js` 의 `?v=` 를 올린다).

## 파이프라인

우리은행(`src/woori/_gen/`) 도구를 복사해 `prep.js` 로 이 시안에 맞췄다(한 번만).

```
1) get_design_context(forceCode) → extract-dc.js → dc-1-2.txt / get_metadata → meta-page.xml → node meta-abs.js
2) node prep.js · patch-font.js · patch-font2.js     (이미 적용됨)
3) node dl.js → node strip-gama.js                   에셋(주소는 7일이면 만료)
4) node mk-light-plant.js                            라이트 그림 사본(파일별 색표)
5) node mk-screen-css.js                             선 · 효과 · 라이트 규칙(screen-css.json)
6) node conv.js                                      → src/plant-overview.js + overview.html
7) mk-snap.js(Playwright) → snap-1-2.json → node conv.js   그림 소수 좌표 보정
8) 캡처 thumb-overview.png → mk-thumb.ps1 → src/templates/plant-overview.jpg
9) node patch-studio.js                              스튜디오 연결(한 번만)
```
검증 서버 `node serve.js 5541`(루트 = WEMB Studio). 미리보기 `src/plant/overview.html` — `?live=0` 라이브 없이, `?t=light|dark` 테마 고정, `?edit=1` 편집 모습.
Playwright: `cap.js`(캡처 + 상자 대조) · `live-check.js`(반응형 여백) · `studio-check.js` · `studio-check2.js` · `studio-check3.js`(스튜디오에서 실제로 누르기).

에셋 라이브러리는 `src/plant-assets/_gen/` — `mk-assets.js`(목록) · `measure.js`(크기) · `patch-library.js`(연결) · `lib-shot.js`(썸네일 사진).

## 밟은 함정

① **글자가 Figma 보다 두껍다** — Windows Chrome 이 어두운 판의 밝은 글자를 두껍게 그린다. 같은 CDN 의 Variable 판으로 굵기를 내렸다(14px 이상 -60, 13px 이하 -100). 눈으로 맞춘 값이라 다른 OS 에서는 조금 가늘 수 있다.
② **`[data-name="Background"]` · `Marker` 는 `<div>` 이고 그림은 안의 `<img>`** — 처음에 div 의 src 를 바꿔 호버 · 선택 그림이 조용히 안 바뀌었다(swapSrc 가 안의 img 를 찾는다).
③ **줄 전체를 덮는 묶음이 클릭을 가로챈다** — `Header` 가 Fold Button 위에 있어 경보 목록 접기가 안 눌렸다. 묶음은 pointer-events:none, 안의 칩만 받는다.
④ **`R()` 은 첫 선택자에만 테마를 붙인다** — 쉼표로 이으면 나머지가 다크에도 먹는다(등급 숫자 칸이 다크에서 하얘졌다). id 마다 R() 을 씌운다.
⑤ **가운데 정렬 선** — Body · Header Row · 표 줄은 테두리를 걷고 안팎 1px 을 절반 농도로(오토레이아웃 크기에 안 들어간다). Tree Line 은 x 1685.5 라 2px 절반 농도.
⑥ **말풍선은 사진을 따라간다** — 화면 비율이 바뀌면 사진이 cover 로 커지므로 Callouts 층에 같은 배율 · 이동을 준다. 안 그러면 이끎선 끝이 건물에서 떨어진다.
⑦ **에셋 크기** — 절대 배치 노드는 % inset 이라 화면 판 없이 자르면 빈 칸이 된다(전기실 지도). measure.js 가 GROUP 처럼 ox · oy 를 적는다. 합집합은 잘린 몫을 뺀다(지도 원본이 칸보다 크다).
⑧ **audit.js 의 `text` 는 미달 목록뿐이다** — 복제한 줄(6~12)은 잘려서 사진 위로 재지므로 오탐이 난다. 잴 때는 지우고 잰다.
⑩ **표 칸 글자가 가운데에서 벗어난다(사용자 지적 2026-11-04)** — conv.js 는 글자 상자를 Figma 폭으로 못 박는데 왼쪽 정렬이라, 글꼴 폭이 다르거나(Variable 굵기) 라이브가 새 시각을 쓰면 1~3px 쏠리고 긴 글자는 넘쳤다. 표 칸(flex 가운데)의 글자는 width:auto(mk-screen-css). 고친 뒤 최대 0.5px(= Figma 의 칸 오른쪽 선 몫).
⑨ **Bash heredoc 은 `\\` 를 하나로 줄인다** — 정규식 패치는 Write 로.

## 안내 티커(사용자 요청 2026-11-04, 라이브만 · ?live=0 은 원본)

`installTicker`(src/plant-live.js) — 띠 그림을 마스크로 쓴 빛줄기(6초) · 테두리 빛 숨쉬기(3.8초) · 문구는 8초마다 원본 안내문과 최신 경보(`[등급] 위치 · 디바이스 · 내용`, 표에 있는 글자만, 등급 칩 색)를 번갈아 왼쪽으로 빠지고 오른쪽에서 들어온다. 패널편집을 켜면 0.3초 안에 안내문으로 돌아와 멈춘다.

## 시안에 없어서 정한 것(사용자에게 알릴 것)

- **차트가 없다.** 패널에 차트 판이 없어 패널편집에서 넣는 추천 차트(패널마다 3~4종)가 실시간으로 움직인다. 기본은 원본 그대로. 값은 표의 기준값 근처 샘플이다.
- **등급 칸이 표에 없다.** 칩으로 거르려고 안쪽에만 줄별 등급을 두었다(화면에 안 보인다). 새 경보 글자는 원본 5줄 중 하나를 쓴다.
- **메뉴는 화면 이동이 없다.** 화면이 한 장이라 켜짐 표시만 옮겨 간다.
- 템플릿 날짜 `January 15, 2025` — 파일 이름의 202501 에서 왔고 일은 임의다.

## 분자 라이브러리(2026-11-04)

`node src/plant-assets/_gen/patch-atomic.js`(추출기 화이트리스트 `plant-overview` · 라이브 `plant-live.js` · 이름 '공장 전력설비' · 테스트 44 → 45) 뒤
wemb-atomic 에서 `npm run build` → `npm test`(19 통과) → 서버 재시작 · 라이브러리 새로 열어 45장 측정 → `npm run export`.
`sources/WEMB-Studio/src/` 에 `plant-overview.js` 와 `plant/` 그림을 복사했다 — **화면을 다시 만들면 이 사본도 다시 복사**하고 위 순서를 다시 돈다.
결과: 페이지 45 · 원자 530 · 분자 239 · 유기체 348 · 템플릿 30, 이 시안 분자 9종(이름은 '제안' 상태, 관리 → 이름 정리에서 확정). 기존 확정 이름 238개 소실 0.
