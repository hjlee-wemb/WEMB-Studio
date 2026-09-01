# src/icheon-assets — 이천 FMS 에셋 라이브러리 등록 자료

두 화면(메인 `Screen/FMS Hub` 64:3367 · 항온항습기 상세 `Screen/HVAC Detail` 64:4059)에서 **실제로 쓰인 에셋**을
스튜디오 '에셋 라이브러리'(차트·심볼·아이콘·패널 탭)에 올리기 위한 목록이다.

```bash
node src/icheon-assets/_gen/mk-assets.js   # → src/icheon-assets.js · src/icheon-assets/panel-*.svg 재생성
```

## 원칙

- **그림을 새로 그리지 않는다.** Figma 가 내보낸 원본 파일(`src/skhynix-hub/*`, `src/skhynix-hvac/*`)을
  경로로 그대로 참조한다. 복사도 하지 않으므로 화면과 라이브러리가 항상 같은 파일을 본다.
- 분류·이름은 **Figma 레이어명과 부모 사슬**에서 뽑는다(파일명이 아니라). 내비 심볼은 화면에 찍힌
  한글 라벨(`화재`·`누수`…)을 그대로 쓴다 — 사용자가 화면에서 보는 이름과 라이브러리 이름이 같아야 한다.
- 같은 내용(md5)이 두 화면에 겹치면 한 번만 등록한다. 이름까지 같아지면(크기만 다른 같은 그림)
  앞의 것 하나만 남긴다 — 라이브러리에 똑같아 보이는 항목이 두 개씩 뜨지 않게.

## 분류 규칙 (mk-assets.js `classify`)

| 탭 | 무엇이 들어가나 |
| --- | --- |
| 차트 | `Arc`·`Needle`·`Lines`·`Line Series`·`Chart01~03`·`Mini Chart`·`Grid Line`·`Divider`·`Line`·`Leader Lines`·`Marker`·`Point`·`Pointer` |
| 심볼 | `Nav Item/*` 안의 `Visual`(내비 디스크) + 배경·장식(`Base`·`Overlay`·`Glow`·`Floor Glow`·`Particle`·`Group`·`Header`·`Hero Image`) |
| 아이콘 | `Icon/*`·헤더 `Icon`·`Radio`·`Status Dot`·`Dot`·`Ring`·`Shadow`·`Background`·`logo` |
| 패널 | 아래 '패널' 참고(원본에 파일이 없어 새로 만든다) |

**이름 짓기 요령 — 색이 곧 의미인 에셋**은 파일에서 대표 색을 읽어 이름에 넣는다.
등급 점 20개가 사실은 5색(위험·중대·경미·주의·정보)뿐이라 이 규칙 하나로 5개로 줄었고,
`꺾은선 계열(금일)/(전일)`·`포화도 링(보라/분홍/노랑)`처럼 구별이 필요한 것만 남는다.

**함정**: Figma 가 내보낸 이미지가 이름 없는 `<div>` 래퍼 안에 있으면 조상 이름(`Bar Chart` 같은 컨테이너)을
집는다. 파일명은 Figma 가 레이어명에서 만든 것이라 더 정확하므로, 아는 종류면 파일명 쪽을 먼저 믿는다.

## 패널

원본에 파일이 없다 — 화면에서 CSS 로 그린 '빈 컨테이너'라서. 그래서 **화면 CSS 의 실제 값**
(면색·테두리·radius·그림자)을 그대로 옮긴 SVG 를 `src/icheon-assets/` 에 만들어 등록한다.
`mk-assets.js` 의 `PANELS` 에 출처 노드까지 적어 뒀다.

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

## 등록 결과 (2026-09-02)

차트 19 · 심볼 19 · 아이콘 22 · 패널 7 — **전체 67개**. 네 탭 모두 깨진 이미지 0건, 콘솔 오류 0.
