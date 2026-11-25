# 데이터센터 통합 모니터링 — 에셋 · 분자 라이브러리 등록

템플릿 'Digital Twin: Data Center Integrated Monitoring'(src/datacenter-*.js)의 컴포넌트를 스튜디오 **에셋 라이브러리**와 홈 **분자 라이브러리**(wemb-atomic)에 올린다.
통합 운영 원뷰(src/oneview-assets/_gen) · 스마트팩토리 에너지관리(src/fems-assets/_gen)와 같은 규칙이다.

## 에셋 라이브러리 (src/datacenter-assets.js)
- 등록 단위는 컴포넌트, 목록은 `spec.json`(차트 2 · 판 21 · 이벤트 5 · 심볼 32 · 아이콘 27). 마크업 · CSS 는 복사하지 않고 build_dmX DOM 에서 노드 id 로 잘라 쓴다.
- 썸네일 바탕은 무조건 투명 — 화면 바탕 · 빛 번짐은 올리지 않는다(authoring.css 의 `.hj-asset.dmX-root`). 팝업은 창만 그리는 빌더(dme · dmc · dmi · dms · dmx)에서 자른다.
- 아이콘 이름에는 '아이콘'이 들어가야 한다(layout-editor isIconNamed). 흰 글리프는 라이트 사본(-lt.svg)이 있으면 그것을 쓴다.
- 순서: 서버 `node src/datacenter/_gen/serve.js 5600` → `node src/datacenter/_gen/pw.js ../../datacenter-assets/_gen/measure.js`(asset-sizes.json) → `node mk-assets.js` → (처음 한 번) `node patch-library.js` → studio.html 의 `datacenter-assets.js?v=` 올림.
- 점검: `lib-check.js`(탭마다 다크 · 라이트, 깨진 그림 · 빈 칸 · 불투명 0), `lib-cards.js <탭> <테마>` + `node sheet.js <테마> <탭> 6 <개수>`(카드 3배 · 자홍 바탕 = 투명 확인).
- **함정(묶음 등록물):** display:contents 묶음은 ox · oy 로 화면 판을 당겨 보이는데, ① 좌표 기준은 화면이 아니라 조각의 offsetParent(전력계통도 무대 256,64 · 옆 판) ② 자식 위치가 부모 대비 % 라 판 크기도 부모 크기여야 한다 → measure 가 pw · ph 를 재고 mk-assets 가 `ow · oh` 로 적으면 layout-editor(hjDom) · authoring.css(`--hjow · --hjoh`, 기본 1920x1080)가 그 크기 판에 놓는다. 다른 템플릿은 기본값이라 영향 없음.

## 분자 라이브러리 (wemb-atomic)
1. `node mk-atomic-src.js` — 빌더 10개(장면 9 + live) · 그림 217장을 wemb-atomic/sources 로 복사.
2. wemb-atomic: atomic-catalog.mjs generatedPattern · familyRuntime · 합성 장면 `build_dmp_(equipment|card|compact|search|scenario)` 제외, library.mjs FAMILY_LABELS, test 페이지 수 177 · family 목록.
3. `npm run build`(분자 534) → `npm test`(19/19) → 확정 이름 소실 대조(0) → 5510 서버 재시작(Startup 'WEMB Studio 서버.vbs') → `atomic-measure.js`(177장, 72초) → `node atomic-names.js`(새 분자 22개 제안대로 확정, names 514) → `atomic-verify3.js`(4,009건, 문제 2 = SK하이닉스 기존) → `npm run export`(src/atomic 78.1MB) → `atomic-check.js`(페이지 9장 확인).
4. 스튜디오 원자 변경 창 접두어(js/studio/atom-swap.js PXS)는 템플릿 등록 때 이미 넣었다.
