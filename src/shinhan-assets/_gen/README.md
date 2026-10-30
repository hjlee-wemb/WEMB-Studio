# 신한카드 정보보호 — 에셋 라이브러리 등록 목록

스튜디오 '에셋 라이브러리'(차트 · 심볼 · 아이콘 · 패널 탭)에 신한카드 4화면의 컴포넌트를 올린다.
결과물은 `src/shinhan-assets.js`(window.`__SHINHAN_ASSETS` + `SHINHAN_ASSET_CSS`) 하나 — **손으로 고치지 말고 다시 돌린다.**

```
node src/shinhan-assets/_gen/mk-assets.js
```

| 파일 | 하는 일 |
|---|---|
| `mk-assets.js` | 등록 목록(ITEMS · ICONS) → `src/shinhan-assets.js`. 이름 중복 · 다른 시안과 이름 겹침 · 아이콘 파일 사용 여부를 검사 |
| `sizes.json` | 등록물마다 브라우저에서 잰 w · h (GROUP 은 화면 안 자리 ox · oy 도) |
| `measure.js` | `sizes.json` 을 다시 재는 브라우저 코드를 찍어 준다(`node src/shinhan/_gen/serve.js 5521` 을 켜고, 창 1920x1080) |
| `survey.js` | 화면 DOM 의 노드 이름 · 글자를 훑는다 — 등록 이름을 화면 글자대로 짓기 위해 |
| `sheet.js` | 점검 시트 — 스튜디오 콘솔에서 `shSheet('dark' \| 'light')` 로 등록물 전부를 한 장에 펼친다 |

지금 목록: 차트 2 · 심볼 48 · 아이콘 5 · 패널 16 · 이벤트 0 (이 시안에는 이벤트 목록이 없다).

## 이 시안만의 장치 세 가지

1. **GROUP 위젯(상자 없음)** — 종합현황(2:2)의 위젯 · 표 · KPI 묶음은 Figma GROUP 이라 DOM 에서 `display:contents`, 자식은 화면 좌표다.
   그대로 자르면 0x0 이라 등록물에 `ox · oy` 를 적고, 라이브러리 `hjDom`(js/studio/layout-editor.js)이 1920x1080 판(`.hj-ofs`)을
   그만큼 당겨 그 안에 서브트리를 놓는다. 판이 위젯보다 커서 패널에 넣으면 넘치므로 뿌리(`.hj-grp`)는 `overflow:clip`(여유 24px).
2. **사본마다 SVG id 바꾸기** — 유리 아이콘은 인라인 SVG 라 `url(#g19-6)` 같은 참조 id 가 있다. 썸네일 · 삽입본 · 살아 있는 화면이
   같은 id 를 쓰면 문서의 첫 번째(숨은 사본일 수 있다)를 가리켜 clip-path 가 풀리고, 유리 흐림이 이름표까지 덮는다.
   → `hjUniqIds` 가 사본마다 참조 id 에 꼬리를 붙인다(모든 DOM 에셋에 적용, 참조가 없으면 그대로).
3. **라이트 테마 규칙 옮기기** — 이 시안의 라이트(흰 카드 · 짙은 글자 · 짙은 KPI 타일)는 화면 시트가 아니라 라이브 층
   (`src/shinhan-live.js`, `.sh-root[data-theme="light"] …`)이 칠한다. 생성기가 `window.SHINHAN_LIVE_CSS` 에서 라이트 규칙만 골라
   에셋 뿌리(`.sh-asset`)용으로 옮긴다: 실행 중 표시 클래스 `.sh-cur · .sh-sel · .sh-on` → `[data-name*="(Selected)"]`,
   `p.sh-offplate` → 두 줄 이름표의 아랫줄, `.sh-gtext` → 화면 시트에서 `background-clip:text` 인 글자, `.sh-wl > Background` → GROUP 위젯의 판.
   라이브러리는 화면 registry 의 `extra`(시트) · `rootClass`(뿌리 클래스)를 보고 붙인다.
   **`shinhan-live.js` 의 라이트 규칙을 고치면 이 생성기도 다시 돌릴 것.**

## 화면을 다시 만들었을 때

`src/shinhan/_gen/conv.js` 로 화면을 다시 만들면 노드 id 는 그대로라 목록은 맞는다. 크기가 바뀌었으면 `measure.js` 로 다시 재고,
`studio.html` 의 `src/shinhan-assets.js?v=` 를 올린다. 분자 라이브러리(wemb-atomic)는 따로 — `wemb-atomic/README.md` '새 템플릿 넣기'.
