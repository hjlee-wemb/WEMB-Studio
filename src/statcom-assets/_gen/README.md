# STATCOM HMI — 에셋 라이브러리 등록 목록

스튜디오 '에셋 라이브러리'(차트 · 심볼 · 아이콘 · 패널 · 이벤트 패널 탭)에 STATCOM HMI 15화면의 컴포넌트를 올린다.
결과물은 `src/statcom-assets.js`(window.`__STATCOM_ASSETS`) 하나 — **손으로 고치지 말고 다시 돌린다.**

```
node src/statcom-assets/_gen/mk-assets.js
```

지금 목록: 차트 2 · 심볼 59 · 아이콘 21 · 패널 42 · 이벤트 2.

| 파일 | 하는 일 |
|---|---|
| `mk-assets.js` | 등록 목록(ITEMS · ICONS) → `src/statcom-assets.js`. 이름 중복 · 다른 시안과 이름 겹침 · 아이콘 파일 사용 여부를 검사 |
| `sizes.json` | 등록물마다 브라우저에서 잰 w · h |
| `measure.js` | `sizes.json` 을 다시 잰다(`LIST_ONLY=1 node mk-assets.js` 로 `nodes.json` 을 만들고, `node src/statcom/_gen/serve.js 5542`). 결과의 `res` 가 `sizes.json` |
| `survey.js` | 화면 DOM 의 노드 이름 · 글자를 훑는다 — 등록 이름을 화면 글자대로 짓기 위해 |
| `lib-check.js` | 스튜디오에서 탭마다 다크 · 라이트로 썸네일 크기 · 깨진 그림을 재고 찍는다 |
| `drop-check.js` | 패널 · 심볼을 화면으로 끌어 넣어 본다 |
| `patch-library.js` | 처음 연결할 때 한 번 돌린 것(studio.html · layout-editor.js · authoring.css). 이미 적용됨 |

## 이 시안만의 장치

1. **뿌리가 등록 크기를 채운다(`rootClass: 'tc-asset'`)** — 화면에서는 부모의 flex 가 늘려 주던 칸이 많아, 잘라 오면 폭 · 높이가 줄어든다
   (스파크라인 1px, 알림 메세지 51px, 사이드 메뉴 828px). `authoring.css` 의 `.hj-asset.tc-asset > :not(.hj-ofs)` 가 잰 크기대로 채운다.
2. **작은 부품은 통째로(`fit: 1`)** — 라이브러리 기본은 가로로 긴 것을 왼쪽부터 잘라 크게 보여 주는데, 단추 · 줄은 글자가 가운데라 빈 면만 남는다.
   심볼 · 차트에 `fit` 을 달아 작아도 통째로 보인다(`data-hjfit`, `hjFit`). 판 · 창은 기본 그대로다.
3. **로고** — `TPLLOGO.DOM` 이 `.tcX-root [data-name="Logo Image"]` 를 잡으므로 사본도 스튜디오 로고로 바뀐다. 그릴 때만 돌면 나중에 그린 사본이
   원본 로고로 남아 `hjFit` · `hjEmbedFit` 에서도 부른다.
4. **VR 고글 아이콘** — 시안에 없어 새로 그린 것이라 화면 모듈이 아니라 라이브 층이 쓴다. 사용 검사에서 뺀다(`LIVE_ONLY`).

## 일부러 뺀 것

- **미니맵 지도 · 층 표시** — 지도 그림 크기가 `Minimap` 조상 규칙에 달려 있어 혼자 잘라 오면 칸 밖으로 나간다. `미니맵 패널` 에 이미 들어 있다.
- **로고 그림 · 3D 장면 그림** — 고객사 표시가 구워져 있다. 파일 이름의 고객사 이름도 등록 이름에 쓰지 않는다.
- **패널편집 추천 차트** — 라이브가 그때그때 그리는 것이라 노드가 아니다.

## 화면을 다시 만들었을 때

`src/statcom/_gen/conv.js` 로 화면을 다시 만들면 노드 id 는 그대로라 목록은 맞는다. 크기가 바뀌었으면 `measure.js` 로 다시 재고,
`studio.html` 의 `src/statcom-assets.js?v=` 를 올린다. 분자 라이브러리(wemb-atomic)는 따로 — `wemb-atomic/README.md` '새 템플릿 넣기'. 아직 등록하지 않았다.
