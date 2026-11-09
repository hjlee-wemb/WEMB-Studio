# 스마트 도면관리 — 에셋 라이브러리 등록 목록

스튜디오 '에셋 라이브러리'(심볼 · 아이콘 · 패널 탭)에 도면관리 화면의 컴포넌트를 올린다.
결과물은 `src/drawing-assets.js`(window.`__DRAWING_ASSETS`) 하나 — **손으로 고치지 말고 다시 돌린다.**

```
node src/drawing-assets/_gen/mk-assets.js
```

지금 목록: 차트 0 · 심볼 72 · 아이콘 44 · 패널 32 · 이벤트 0.

| 파일 | 하는 일 |
|---|---|
| `mk-assets.js` | 등록 목록(ITEMS · ICONS) → `src/drawing-assets.js`. 이름 중복 · 다른 시안과 겹침 · 아이콘 파일 사용 여부를 검사 |
| `sizes.json` | 등록물마다 브라우저에서 잰 w · h |
| `measure.js` | `sizes.json` 을 다시 잰다(`LIST_ONLY=1 node mk-assets.js` → `node src/drawing/_gen/serve.js 5544` → Playwright. 결과는 `src/drawing/_gen/asset-sizes.json` → `sizes.json` 으로 옮긴다) |
| `mk-transparent.js` | 흰 판이 박힌 일러스트의 투명 사본(`icon-image-tp.png`, `icon-image-1-tp.png`). 결과를 `src/drawing/` 로 옮긴다 |
| `lib-check.js` | 탭마다 이 시안 것만 남겨 다크 · 라이트로 찍는다. **카드 바탕을 자홍으로 칠해** 투명이 아닌 곳이 바로 보인다 |
| `drop-check.js` | 패널 · 심볼 · 아이콘을 화면으로 끌어 넣어 본다 |
| `patch-library.js` | 처음 연결할 때 한 번 돌린 것(studio.html · layout-editor.js · authoring.css). 이미 적용됨 |

## 썸네일 바탕은 무조건 투명 (사용자 지시 2026-11-09)

- 화면 바탕 · Dim 은 올리지 않는다. `.hj-asset` 뿌리와 직계 `Background` 는 authoring.css 가 끈다.
- `dark.js` 의 화면 판 색(`#0e0f12`)은 `:not(.hj-asset)` — 안 그러면 다크 썸네일마다 검은 네모가 깔린다.
- 공지사항 · Help Desk 일러스트는 흰 판이 그림에 박힌 불투명 PNG 다. 라이브러리만 투명 사본을 쓰고 화면은 원본 그대로다.
- 단추 · 입력칸 · 패널 자신의 면색은 컴포넌트의 일부라 남는다.

## 이 시안만의 장치

1. **뿌리가 등록 크기를 채운다** — `rootClass: 'tc-asset dw-asset'`. `dw-asset` 은 가운데 정렬 판의 `translate` 까지 푼다.
2. **절대 배치 노드는 크기만 잰다** — 이 시안은 `left:50%` + margin 이라 화면 좌표(ox · oy)로 당기면 어긋난다. 자리 지정은 authoring.css 가 푼다. `display:contents` 묶음만 ox · oy 를 쓴다.
3. **전부 통째로(`fit`)** — 가로로 긴 판이 많아 기본 규칙이면 왼쪽만 잘려 빈 면이 보인다.
4. **어두운 무채색 아이콘은 `light`** — 다크 칸에서 라이브러리가 색을 뒤집어 보여 준다(기존 figimg-light 장치, `hjIcons` 가 `light` 를 넘기게 고쳤다).
5. **썸네일 `content-visibility:auto`** — 패널 탭 썸네일이 190개라 다시 그리는 데 14초가 걸렸다(도면관리 추가 전 8.8초). 화면 밖 칸을 건너뛰게 해 2.3초가 됐다(`.libitem .thumb.domhost`, 모든 시안 공통).

## 밟은 함정

- **`Login Card` 는 빈 유리판이다** — 폼은 그 형제다. `Form`(1:76)을 로그인 폼으로 올렸다.
- **이름이 겹치면 검색 · 점검이 다른 시안 것을 잡는다** — `조회 단추` 가 신한카드 것과 겹쳐 `(도면관리)` 를 붙였다. `mk-assets.js` 의 `?? 이름 겹침` 을 꼭 볼 것.
- **점검이 중간에 죽으면 브라우저 컨텍스트가 남아 PC 를 잡는다** — 다음 점검이 이유 없이 멈춘다. 먼저 닫을 것.

## 일부러 뺀 것

- **차트 · 이벤트 탭** — 시안에 없다. 패널편집 추천 차트는 라이브가 그때그때 그리는 것이라 노드가 아니다.
- **로고** — 헤더 안의 로고는 사본에서도 스튜디오 로고로 바뀐다.
- **흰색 전용 아이콘**(헤더 활성 아이콘 · 단추 안 흰 돋보기 등) — 라이트 칸에서 안 보이고, 같은 모양의 회색 · 파랑 판이 등록되어 있다.

## 화면을 다시 만들었을 때

`src/drawing/_gen/conv.js` 로 화면을 다시 만들면 노드 id 는 그대로라 목록은 맞는다. 크기가 바뀌었으면 `measure.js` 로 다시 재고 `studio.html` 의 `src/drawing-assets.js?v=` 를 올린다. 분자 라이브러리는 별도 등록(`wemb-atomic`) — 화면을 다시 만들면 `src/drawing-*.js` · `src/drawing/` 을 `wemb-atomic/sources/WEMB-Studio/src/` 로 다시 복사하고 build → 서버 재시작 → 측정 → export.
