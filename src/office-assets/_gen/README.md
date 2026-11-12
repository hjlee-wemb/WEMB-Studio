# 스마트 오피스 — 에셋 라이브러리 등록 목록

스튜디오 '에셋 라이브러리'(차트 · 심볼 · 아이콘 · 패널 탭)에 스마트 오피스 54화면의 컴포넌트를 올린다.
결과물은 `src/office-assets.js`(window.`__OFFICE_ASSETS`) 하나 — **손으로 고치지 말고 다시 돌린다.**

지금 목록: 차트 26 · 패널 54 · 심볼 59 · 아이콘 97(밝은 아이콘 라이브러리 사본 14) · 이벤트 0.

| 파일 | 하는 일 |
|---|---|
| `spec.json` | 등록 목록. 컴포넌트는 `{sc, nid}` 또는 `{sc, q:[레이어명, 순번, 크기?]}`, 이름 `auto` = 그 차트의 제목 줄 글자. 아이콘은 `[파일, 이름, Figma 이름]` |
| `measure.js` | Playwright filename — 노드를 찾고 크기를 잰다 → `src/office/_gen/asset-sizes.json` (서버 `node src/office/_gen/serve.js 5546`) |
| `mk-assets.js` | spec + 크기 → `src/office-assets.js`. 같은 노드 두 번 · 이름 중복 · 다른 시안과 이름 겹침 · 파일 사용 여부를 검사 |
| `patch-library.js` | 처음 연결할 때 한 번(layout-editor.js `OF` · authoring.css `.hj-asset.ofXX-root` · studio.html). 이미 적용됨 |
| `lib-check.js` | 탭마다 이 시안 것만 남겨 다크 · 라이트로 찍는다. **카드 바탕을 자홍으로** 칠해 투명이 아닌 곳이 바로 보인다 |
| `drop-check.js` | 패널 · 심볼 · 아이콘을 화면으로 끌어 넣어 본다 |

순서: `measure.js` → `node src/office-assets/_gen/mk-assets.js` → `lib-check.js` · `drop-check.js`. 목록을 바꾸면 studio.html 의 `src/office-assets.js?v=` 를 올린다.

## 썸네일 바탕은 무조건 투명

- 화면 바탕 · Dim 은 올리지 않는다. `.hj-asset` 뿌리와 직계 `Background` 는 authoring.css 가 끈다(54개 접두어를 등록).
- 다크의 화면 판 색은 `:not(.hj-asset)` (office/_gen/dark.js) — 썸네일에 검은 네모가 안 깔린다.
- 단추 · 카드 · 팝업 자신의 면색은 컴포넌트의 일부라 남는다.

## 아이콘 규칙

- 같은 그림이 화면마다 다른 파일명으로 반복된다(층 표시 15벌 · 확대 18벌 …) — 경로 · 색 · viewBox 가 같은 것은 한 번만.
- 아이콘이 아닌 조각(히트맵 얼룩 · 격자선 · 범례 점 · 말풍선 꼬리 · 스크롤 화살표)은 뺐다.
- 색 원 위의 흰 그림(공간 아이콘 단추 · 검색 단추 안)은 단추째 심볼로 올렸다.
- 색을 읽어 자동으로: 어두운 무채색 → `light`(다크 칸에서 라이브러리가 뒤집어 보여 준다).
  사이드바 · 헤더용 흰 · 밝은 무채색 → 라이브러리용 사본 `<이름>-lt.svg`(명도만 뒤집음) + `light`. 화면은 원본 그대로.

## 밟은 함정

- **이름이 다른 시안과 겹치면 검색 · 점검이 그쪽 것을 잡는다** — `위치 아이콘` · `펼침 화살표 아이콘` · `팝업 닫기 아이콘` · `새로고침 단추` 에 `(스마트 오피스)` 를 붙였다.
- **흰색 판정에 clipPath 의 흰 사각형이 섞인다** — 색은 clipPath · mask 를 걷어내고 읽는다.
- **메뉴 접기 아이콘은 아래 화살표 파일이다** — 화면은 90° 돌려 '<' 로 쓴다. 이름은 파일 모양대로.
- 방 상태 심볼 6개는 글자 · 그림 없이 색 면 + 테두리라 lib-check 의 '빈 칸'에 잡히지만 정상이다.
