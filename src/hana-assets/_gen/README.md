# src/hana-assets — HANA Bank H.I.T 에셋 라이브러리 등록 자료

14화면(Figma `H3S2M7DUCvuJgi75oBqg6W`)의 컴포넌트를 스튜디오 '에셋 라이브러리'
(차트·심볼·아이콘·패널·이벤트 패널)에 올리기 위한 목록이다.

```bash
node src/hana-assets/_gen/mk-assets.js        # → src/hana-assets.js 재생성
node src/hana-assets/_gen/patch-studio-assets.js   # → index.html 에 물리기(한 번만)
```

## 등록 단위는 '컴포넌트'

눈금선·막대 한 줄·배지 그림자 같은 **부품은 등록하지 않는다.** 꺼내 쓸 수 있는 최소 단위는
위젯·차트·구역·노드·칩처럼 **그 자체로 뜻이 서는 덩어리**다.
그리고 **같은 그림이 여러 화면에 겹쳐 나오면 한 번만 올린다** — 네트워크01/02 는 같은 구성도를
두 벌 갖고 있고, 보안01/02 도 판이 같다. 훑어보면 후보가 291개지만 실제로 다른 것은 그중 일부다.

| 탭 | 무엇 | 개수 |
| --- | --- | --- |
| 차트 | 꺾은선 5(크기·맥락별) · 도넛 5 · 실린더 게이지 1 | 11 |
| 심볼 | 플로우 구역 11 · 플로우 노드 4 · 클라우드 6 · 네트워크 7 · 상면 4 · 목록 항목/칩 8 · 헤더 메뉴 2 | 43 |
| 아이콘 | 화면이 쓰는 원본 SVG 파일(경로만 참조) | 29 |
| 패널 | 위젯 카드 40장 + 자산 상세 팝업 | 41 |
| 이벤트 패널 | 이벤트 로그 3종(전체화면·하단 바·상면) | 3 |
| | | **127** |

## 만드는 법은 한진과 같다 — 화면 DOM 에서 잘라 쓴다

`src/hanjin-assets` 와 **똑같은 장치**를 쓴다. 그림 파일을 복사해 두지 않고, 화면 빌더
(`window.build_hno2` …)가 만든 DOM 에서 노드 id 로 그때그때 잘라 온다.

- 글자가 **편집 가능한 실제 텍스트**라 라이브러리에서 꺼낸 뒤에도 '패널편집'으로 고칠 수 있다.
- 화면 테마(다크/라이트)와 '색 정하기'가 **라이브러리 썸네일까지** 똑같이 따라온다.
  (SVG 로 내보내면 글자가 path 로 굳어 이 둘이 죽는다.)
- 그래서 `src/hana-assets.js` 는 **마크업도 CSS 도 담지 않는다** — 23KB 짜리 목록뿐이다.
  마크업까지 담았다면 수 MB 다.

시트도 담지 않는다. `window.HNO2_CSS` 등은 이미 index.html 이 들고 있고, 라이브러리가
스튜디오와 **같은 `style#hnXX-style` id** 로 한 번만 붙인다(`.hnXX-root` 안으로 스코프돼 있다).

## 썸네일 바탕은 무조건 투명하다

두 겹으로 막는다.

1. `.hj-asset.hnXX-root` — 화면 뿌리가 갖는 '화면 전체를 덮는' 성질(절대배치·`inset`·**배경**·
   `z-index`)을 끈다. 그래서 컴포넌트 **자신의 면색만** 보이고 시안 바탕은 따라오지 않는다.
2. `.hj-asset > [data-name="Background"|"Base"]` — 뿌리 밑에 배경 층을 따로 둔 시안이 있어
   그것도 걷어낸다(한진은 뿌리에만 배경이 있어 필요 없던 안전장치다).

실측: 등록물 127개 전부 `background-color: rgba(0,0,0,0)`, 화면 배경층을 달고 온 것 0개.

## 라이브러리 쪽에서 하는 일 (index.html)

한진이 쓰던 함수를 그대로 재사용한다 — `hjScreenHtml` / `hjSub` / `hjDom` / `hjFit` / `hjEmbedFit`.
접두어만 알면 되는 일반 코드라, 화면 registry 만 합쳐 주면 HANA 도 그대로 처리된다.

```js
const DOM_SCREENS = Object.assign({}, HJ.screens, HN.screens);   // 한진 + HANA
```

화면마다 에셋 폴더가 달라(`src/hanjin/` vs `src/hana/`) registry 항목에 `base` 를 함께 적고
`build(S.base)` 로 부른다.

## 훑어보기 도구

등록 목록을 손으로 고를 때 쓴 것들이다. 화면이 바뀌면 다시 돌려 후보를 확인한다.

```bash
node src/hana-assets/_gen/survey.js [panel|chart|symbol]   # 후보와 크기
node src/hana-assets/_gen/survey-titles.js panel           # 화면에 찍힌 한글 제목까지
node src/hana-assets/_gen/survey-icons.js                  # icon-*.svg ↔ Figma Icon/ 이름
node src/hana-assets/_gen/where.js icon-5.svg              # 이 파일이 어느 레이어 밑에 쓰이나
```

## 이름 짓기

화면에 찍힌 한글을 그대로 쓴다(`구간별 성능현황`, `주요거래 플로우`, `성능 TOP10` …).
Figma 레이어명과 노드 id 는 `fig` 에 남겨 두어 되짚을 수 있게 했다.
**이름 뒤에 화면을 덧붙이지 않는다** — 같은 이름이 겹칠 때만 구분한다
(`TPS/Active Thread (미들웨어)` · `(인프라메인)` · `(인프라상세)`).

## 함정

- **아이콘 파일 이름만 보고 고르면 안 된다.** `icon-1·2·3·8.svg`, `icon.svg`,
  `icon-trend-product.svg` 는 화면에서 **쓰이지 않는다**(Figma 가 내보내기만 한 것) → 등록 제외.
  `icon-4/5/6/7/9.svg` 는 `Icon/` 래퍼 밖(헤더 단추·메뉴 화살표)에 있어 이름을 따로 붙여 줬다.
- **`fill="none"` 확인.** 생성기가 아이콘 뿌리 `<svg>` 에 `fill="none"` 이 있는지 보고 없으면
  경고한다 — 배경이 깔린 파일은 썸네일이 투명하지 않다.
- **차트는 위젯 껍데기 없이 그림만** 등록한다. 위젯째 쓰고 싶으면 '패널' 탭에 같은 것이 있다.
