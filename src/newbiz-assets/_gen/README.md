# 신사업 관리 — 에셋 라이브러리 등록 목록

스튜디오 '에셋 라이브러리'(심볼 · 아이콘 · 패널 탭)에 신사업 관리 화면의 컴포넌트를 올린다.
결과물은 `src/newbiz-assets.js`(window.`__NEWBIZ_ASSETS`) 하나 — **손으로 고치지 말고 다시 돌린다.**

```
node src/newbiz-assets/_gen/mk-assets.js
```

지금 목록: 차트 0 · 심볼 42 · 아이콘 24 · 패널 14 · 이벤트 0.

| 파일 | 하는 일 |
|---|---|
| `mk-assets.js` | 등록 목록(ITEMS · ICONS) → `src/newbiz-assets.js`. 이름 중복 · 다른 시안과 겹침 · 아이콘 파일 사용 여부를 검사 |
| `sizes.json` | 등록물마다 브라우저에서 잰 w · h · ox · oy |
| `measure.js` | `sizes.json` 을 다시 잰다(`LIST_ONLY=1 node mk-assets.js` → `node src/newbiz/_gen/serve.js 5543` → Playwright. 결과는 `src/newbiz/_gen/asset-sizes.json` 에 저장되니 `sizes.json` 으로 옮긴다) |
| `lib-check.js` | 탭마다 이 시안 것만 남겨 다크 · 라이트로 찍고 깨진 그림 · 빈 칸을 잰다 |
| `drop-check.js` | 패널 · 심볼 · 아이콘을 화면으로 끌어 넣어 본다 |
| `patch-library.js` | 처음 연결할 때 한 번 돌린 것(studio.html · layout-editor.js · authoring.css). 이미 적용됨 |

## 이 시안만의 장치

1. **뿌리가 등록 크기를 채운다** — STATCOM 의 `rootClass: 'tc-asset'` 규칙을 함께 쓴다.
2. **절대 배치 노드는 판째 당긴다(ox · oy)** — 값은 화면 좌표가 아니라 **자기 기준 상자 안 자리**다. 표 안의 호버 단추는 기준이 표 Body 라, 화면 좌표로 재면 썸네일이 빈 칸이 된다.
3. **라이트 바탕은 화면에만** — `light.js` 의 `:not(.hj-asset)`, `mk-screen-css.js` 의 화면 틀 규칙. 안 그러면 넣은 심볼 뒤에 회색 네모가 깔린다. STATCOM `light.js` 에도 같은 줄이 있는데 확인하지 않았다.
4. **메뉴 바 · 헤더는 통째로(`fit`)** — 기본은 왼쪽부터 잘라 메뉴 글자가 안 보였다.
5. **흰 아이콘 4개는 라이트 사본으로 등록(`USE_LT`)** — 닫기 · 풍향 탭 · 태양광 탭 · 에너지 탭. 아이콘 탭은 그림 한 장이라 테마를 안 따라가, 흰색이면 라이트 칸에서 안 보인다. 다크에서도 회청색으로 보인다.

## 일부러 뺀 것

- **로고(`logo-mark.svg`) · 에너지 화면 캐릭터** — 고객사 표시다. 헤더 · 브랜드는 사본에서도 스튜디오 로고로 바뀐다.
- **차트 · 이벤트 탭** — 시안에 없다. 패널편집 추천 차트는 라이브가 그때그때 그리는 것이라 노드가 아니다.
- **툴팁 · 인풋 태양광 · 에너지(`nbl` · `nbg`)** — 풍향 인풋(`nbk`)과 같은 부품이다.
- **풍향 탭 선택 아이콘** — 어두운 선이라 다크 칸에서 안 보인다. `에너지원 탭` 심볼에 들어 있다.

## 넣은 뒤 글자 고치기

패널편집에서 **넣은 패널의 제목 줄을 눌러 선택**하면 안의 글자를 고칠 수 있다(다른 시안과 같다). 글자 위를 바로 눌러서는 선택되지 않는다 — 사본이 슬롯(`.assetslot`) 안이라 `dt-edit.js` 가 건너뛴다.

## 화면을 다시 만들었을 때

`src/newbiz/_gen/conv.js` 로 화면을 다시 만들면 노드 id 는 그대로라 목록은 맞는다. 크기가 바뀌었으면 `measure.js` 로 다시 재고 `studio.html` 의 `src/newbiz-assets.js?v=` 를 올린다. 분자 라이브러리(wemb-atomic)는 따로이며 아직 등록하지 않았다.
