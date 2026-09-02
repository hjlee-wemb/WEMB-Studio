# src/icheon-assets — 이천 FMS 에셋 라이브러리 등록 자료

두 화면(메인 `Screen/FMS Hub` 64:3367 · 항온항습기 상세 `Screen/HVAC Detail` 64:4059)의 에셋을
스튜디오 '에셋 라이브러리'(차트·심볼·아이콘·패널 탭)에 올리기 위한 목록이다.

```bash
node src/icheon-assets/_gen/mk-assets.js   # → src/icheon-assets.js · src/icheon-assets/panel-*.svg 재생성
```

## 등록 단위는 '컴포넌트'

눈금선·배지 그림자·파티클·꺾은선 한 줄 같은 **부품은 등록하지 않는다.**
라이브러리에서 꺼내 쓸 수 있는 최소 단위는 위젯·칩·콜아웃·내비 심볼처럼 **그 자체로 뜻이 서는 덩어리**다.

| 출처 | 무엇 | 어떻게 |
| --- | --- | --- |
| Figma 컴포넌트 프레임 | 위젯 6 · 차트 5 · 콜아웃 3 · 칩/토글/버튼/배지 9 · 이벤트 목록 1 = **24** | 프레임을 통째로 SVG 로 내보내 `src/icheon-assets/comp-*.svg` 로 둔다 |
| 화면 폴더의 원본 파일 | 내비 심볼 10 · 3D 렌더 2 · 아이콘 12 · 상태 점 5 | 이미 최소 단위라 경로만 참조(복사 안 함) |
| 화면 CSS 값 | 패널(빈 컨테이너) 7 | 원본에 파일이 없어 새로 만든다 |

**Figma SVG 내보내기는 글자를 path 로 바꾼다**(확인: 이벤트 목록 export 에 `<text>` 0개 · `<path>` 166개).
그래서 폰트가 없어도 원본 그대로 그려진다 — 라이브러리 에셋으로는 오히려 이쪽이 안전하다.
대신 글자를 고칠 수는 없다(화면 쪽은 편집 가능한 실제 텍스트를 그대로 쓰므로 영향 없다).

### components.json

내보낸 컴포넌트의 노드 id·이름·파일명을 적어 둔 표. `url` 은 내려받을 때만 쓴 임시 주소(7일 만료)라 기록용이고,
파일은 이미 저장소에 있다. 다시 받아야 하면 `download_assets(nodeId, format:svg)` 로 새 url 을 얻는다.

## 이름 짓기

- 컴포넌트는 `components.json` 에 적은 한글 이름을 쓴다(Figma 레이어명은 `fig` 에 노드 id 와 함께 남긴다).
- 내비 심볼은 **화면에 찍힌 한글 라벨**을 그대로 쓴다 — 사용자가 화면에서 보는 이름과 같아야 한다.
- 색이 곧 의미인 상태 점은 파일에서 대표 색을 읽어 이름을 붙인다(위험·중대·경미·주의·정보).
  같은 색이면 크기만 다른 중복이라 하나만 남는다 — 이 규칙으로 점 20개가 5개로 줄었다.

## 패널

원본에 파일이 없다 — 화면에서 CSS 로 그린 '빈 컨테이너'라서. **화면 CSS 의 실제 값**
(면색·테두리·radius·그림자)을 그대로 옮긴 SVG 를 만들어 등록한다. `mk-assets.js` 의 `PANELS` 에 출처 노드까지 적어 뒀다.

| 이름 | 출처 |
| --- | --- |
| 위젯 카드 | 64:4188 `Line Chart` / 64:4240 `Body` |
| 지표 카드 | 64:3400 `Body` |
| 요약 카드 | 64:3401 `Summary Card`(모서리 반지름이 24/6/24/6 로 비대칭 → path 로 그린다) |
| 유리 목록 패널 | 64:3894 / 64:4370 `Event List`(4px 가로 그라디언트 테두리) |
| 측정값 알약 | 64:4155 `Measurement` |
| 스위치 알약 | 64:4120 `Mode Switch` |
| 라벨 알약 | 64:3577 `Label` |

그림자가 잘리지 않게 사방 14px 여백을 두고 그린다.

## 스튜디오 연결 (index.html)

- `<script src="src/icheon-assets.js">` → `window.__ICHEON_ASSETS = {charts, symbols, icons, panels}`.
- `initAssetLibrary` 의 `CATS` 에 `ichItems()` 로 붙인다. 차트는 렌더 시점에 채워지므로 `buildChartItems()` 에서 붙인다.
- 라이브러리는 원래 인라인 SVG(`it.html`)만 그릴 줄 알았다 → **`it.src`(파일 경로)** 도 그리도록
  `thumbHtml`·`panelHtml`·`assetVisual`·`rawVisual` 네 곳에 분기를 넣었다(`.figimg` / `.figimg-embed`).
  '카드 컨테이너'로 삽입되는 패널은 `addPanelItem` 이 프레임을 `<img>` 로 깔고,
  원본 비율을 패널 기본 `aspect-ratio` 로 잡는다(인라인 SVG 는 viewBox, 파일은 naturalWidth/Height).
- `rawVisual` 이 `src` 를 지원하므로 `__wembFindAsset()`(패널 콘텐츠 자동 생성)도 이 에셋을 찾아 쓴다.

## 추가한 패널이 시안 위에 뜨게

두 화면의 루트는 자식이 전부 절대배치인데 **화면 프레임만 100% 높이의 흐름 요소**라,
`.dt-added`(콘텐츠 추가 레이어)를 그냥 두면 그 프레임 아래 — 즉 화면 밖 하단 — 으로 밀려나 보이지 않았다.
index.html 에 `.skh-root > .dt-added` · `.skv-root > .dt-added` 규칙을 넣어 시안 한가운데에 절대배치로
띄운다(z-index 30). 빈 영역은 `pointer-events:none` 이라 클릭이 시안으로 통과하고, 카드만 클릭을 받는다.
카드는 밝은 유리(원본이 라이트 시안), `[data-theme="dark"]` 이면 어두운 유리로 바뀐다.

## 등록 결과 (2026-09-02)

차트 11 · 심볼 15 · 아이콘 27 · 패널 8 — **전체 61개**(그중 컴포넌트 24개).
네 탭 모두 깨진 이미지 0건, 콘솔 오류 0.
