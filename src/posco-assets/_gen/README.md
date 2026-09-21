# src/posco-assets — POSCO KDB CCTV 관제 에셋 라이브러리 등록 자료

`Digital Twin: POSCO KDB CCTV 관제` 템플릿(Figma `dj0SONcO5BySCm7yDdZrNc`)의 컴포넌트를
스튜디오 '에셋 라이브러리'(차트·심볼·아이콘·패널·이벤트 패널)에 올리기 위한 목록이다.
화면 재구축 자체는 `src/posco/_gen/` 이 한다 — **그쪽 README 를 먼저 읽을 것.**

```bash
node src/posco-assets/_gen/mk-assets.js       # → src/posco-assets.js 재생성 (-v 로 상세)
node src/posco-assets/_gen/survey.js [px]     # 등록 후보(레이어명·계층) 훑어보기
node src/posco-assets/_gen/where.js '^icon'   # 이 에셋 파일이 어느 레이어 밑에 쓰이나
node src/posco-assets/_gen/measure.js <px>    # 크기를 브라우저에서 다시 재는 코드 조각
```

## 등록 단위는 '컴포넌트'

눈금선·배지 바탕·글자 한 줄 같은 **부품은 등록하지 않는다.** 꺼내 쓸 수 있는 최소 단위는
위젯·판·팝업·표 행·칩·타일처럼 **그 자체로 뜻이 서는 덩어리**다.
그리고 **같은 그림이 여러 화면에 겹쳐 나오면 한 번만 올린다** — 헤더·브레드크럼·이벤트 현황 판은
여섯 화면에 다 있고, SOP STEP 1·2·3 의 단계 목록은 같은 목록의 진행 상태만 다르다.

| 탭 | 무엇 | 개수 |
| --- | --- | --- |
| 차트 | **없다** — 관제 화면이라 그래프가 한 장도 없다(표·도면·상태 타일이 본체) | 0 |
| 심볼 | 표 행·등급 배지·건수 칩·내비 타일·상태 칸·범례·필터·도면·분류 타일·SOP 조각 | 69 |
| 아이콘 | 화면이 쓰는 원본 SVG 파일(경로만 참조) | 27 |
| 패널 | 위젯·판·팝업 17장 | 17 |
| 이벤트 패널 | 이벤트 현황 판 · 이벤트 표 · 이벤트 리스트 팝업 | 3 |
| | | **116** |

## 만드는 법은 한진·HANA 와 같다 — 화면 DOM 에서 잘라 쓴다

그림 파일을 복사해 두지 않고, 화면 빌더(`window.build_pkm` …)가 만든 DOM 에서 노드 id
(`data-node-id`)로 그때그때 잘라 온다.

- 글자가 **편집 가능한 실제 텍스트**라 라이브러리에서 꺼낸 뒤에도 '패널편집'으로 고칠 수 있다.
- 화면 테마(다크/라이트)와 '색 정하기'가 **라이브러리 썸네일까지** 똑같이 따라온다.
  라이트는 시트가 `content:url(…-lt.svg)` 로 그림까지 갈아 끼우고, 색 정하기는 같은
  `style#pkXX-style` 을 다시 칠하므로 썸네일도 함께 바뀐다(실측 확인).
- 그래서 `src/posco-assets.js` 는 **마크업도 CSS 도 담지 않는다** — 20KB 짜리 목록뿐이다.

시트도 담지 않는다. `window.PKM_CSS` 등은 이미 studio.html 이 들고 있고, 라이브러리가
스튜디오와 **같은 `style#pkXX-style` id** 로 한 번만 붙인다(`.pkXX-root` 안으로 스코프돼 있다).

## w·h 는 브라우저에서 잰 값이다 (이 시안의 차이점)

HANA 는 Figma 메타(`nodes.json`)에서 크기를 가져왔지만 **이 시안에는 그 메타가 없다**
(`src/posco/_gen/meta-*.xml` 은 TEXT 상자뿐이다). 그래서 재구축 화면을 1920x1080 으로 펴 놓고
`getBoundingClientRect` 로 재서 `mk-assets.js` 의 표에 적어 두었다. 다시 잴 때는 `measure.js`.

## 라이브러리 쪽에서 하는 일

한진이 쓰던 함수를 그대로 재사용한다 — `hjScreenHtml`/`hjSub`/`hjDom`/`hjFit`/`hjEmbedFit`
(`js/studio/layout-editor.js`). 접두어만 알면 되는 일반 코드라 화면 registry 만 합치면 된다.

```js
const PK = window.__POSCO_ASSETS || …;
const DOM_SCREENS = Object.assign({}, HJ.screens, HN.screens, PK.screens);
```

연결 지점 네 곳:

| 파일 | 무엇 |
| --- | --- |
| `studio.html` | `<script src="src/posco-assets.js">` (화면 모듈보다 앞) · `?v=` 올리기 |
| `js/studio/layout-editor.js` | `PK` 선언 · `DOM_SCREENS` 합치기 · CATS(panel·event·symbol·icon) · `buildChartItems` |
| `css/studio/authoring.css` | `.hj-asset.pkXX-root` 를 '화면 뿌리 성질 끄기' 목록에 추가(8개 접두어) |

## 썸네일 바탕은 무조건 투명하다

`.hj-asset.pkXX-root` 가 화면 뿌리의 '화면 전체를 덮는' 성질(절대배치·`inset`·**배경**·`z-index`)을
끄고, `.hj-asset > [data-name="Background"|"Base"]` 가 뿌리 밑 배경 층을 걷어낸다.
실측: 등록물 전부 `background-color: rgba(0,0,0,0)`.

## 함정

- **`display:contents` 인 래퍼는 등록하지 못한다.** `Panel/Asset Summary`(1:2503) ·
  `Panel/Asset List`(1:2422) · `Dialog/SOP`(1:9703) 는 상자가 0x0 이라 `hjFit` 이 배율을 못 잡고,
  속의 절대배치 자식이 화면 좌표 그대로 튄다(`.hj-asset > *` 는 **직계 자식**만 풀어 준다).
  → 그 안의 실제 위젯(`Widget/Asset Summary` · `Widget/Asset List` · `Step List`)을 올린다.
- **넓고 낮은 판은 왼쪽만 보인다.** `hjFit` 이 상자와 비율이 크게 어긋나면 채워서 자른다(cover).
  `Footer`(794x35)처럼 **오른쪽 끝에만 내용이 있는 바**는 썸네일이 빈 칸으로 보인다
  → 바 대신 그 안의 단추(`상황종료 단추`)를 올렸다.
- **아이콘은 파일명으로 고르면 안 된다.** `icon-13.svg` 는 이름만 보면 자산 상세 아이콘 같지만
  팝업 제목 **뒤쪽의 ✕** 다(자산 아이콘은 제목 앞의 `popup-01-icon.svg`). `where.js` 로 계층을
  확인하고, 그래도 애매하면 라이브러리에 띄워 **그림을 눈으로 보고** 이름을 붙인다.
- **상태 변형은 한 벌만.** 같은 설비 아이콘이 상태 색만 달리해 여러 파일로 내보내져 있다
  (CCTV `icon-11`/`icon-5-2`, 출입 `icon-9`/`icon-6`, 소방 `icon-12`/`icon-7`, 도청 `icon-10`/`icon-8`).
  무채색(기본) 쪽 한 장만 올린다.
- **다른 시안과 이름이 겹치면 못 알아본다.** 라이브러리 한 탭에 한진·HANA·이천·SK하이닉스가 함께 산다.
  `mk-assets.js` 가 그 목록들을 읽어 겹침을 경고한다 → 이쪽 이름에 `(KDB)` 를 붙였다
  (`자산 상세 팝업 (KDB)` · `이벤트 표 (KDB)`). 아이콘은 원래 일반명이라 겹쳐도 그대로 둔다.
- **`?v=` 를 안 올리면 옛 파일을 문다** — `layout-editor.js`·`authoring.css` 를 고쳤으면
  `studio.html` 의 `?v=` 도 같이 올린다.

## 이름 짓기

**화면에 찍힌 한글을 그대로** 쓴다(`자산정보현황` · `출입내역` · `자산리스트` · `상황인지 전파 체계도`).
제목이 없는 부품은 Figma 레이어명을 곧이곧대로 옮긴다(`Nav Item` → 내비 타일).
Figma 레이어명과 노드 id 는 `fig` 에 남겨 두어 되짚을 수 있게 했다.
이름 뒤에 화면을 덧붙이지 않는다 — 같은 이름이 겹칠 때만 괄호로 구분한다
(`자산정보현황 (요약)` · `자산정보현황 (층별)`).
**아이콘 탭은 이름이 '…아이콘'인 것만 올라간다**(`js/studio/layout-editor.js` 의 `isIconNamed`) —
생성기가 규칙을 어긴 이름을 잡아낸다.
