# 스마트 빌딩 에너지 관리 — 에셋 · 분자 라이브러리 등록

템플릿 'Digital Twin: Smart Building Energy Management'(src/bems-*.js)의 컴포넌트를 스튜디오 **에셋 라이브러리**와 홈 **분자 라이브러리**(wemb-atomic)에 올린다.
데이터센터 통합 모니터링(src/datacenter-assets/_gen) 생성기를 retarget.js 로 돌린 것이라 규칙이 같다.

## 에셋 라이브러리 (src/bems-assets.js)
- 등록 단위는 컴포넌트, 목록은 `spec.json`(차트 3 · 판 17 · 이벤트 5 · 심볼 31 · 아이콘 22 = 78). 마크업 · CSS 는 복사하지 않고 build_bem · build_bef DOM 에서 노드 id 로 잘라 쓴다
  — 글자는 실제 텍스트라 패널편집 · 다크/라이트 · 색 정하기가 썸네일까지 따라온다.
- 썸네일 바탕은 무조건 투명 — 화면 바탕 · 3D 바닥 빛은 올리지 않는다(authoring.css 의 `.hj-asset.bem-root` · `.bef-root`, 라이트 화면 판 색은 light.js 가 `:not(.hj-asset)` 로 뺀다).
- 아이콘 이름에는 '아이콘'이 들어간다(layout-editor isIconNamed). 흰 글리프는 라이트 사본(-lt.svg)을 쓴다. 다른 시안 아이콘 · 컴포넌트 이름과 겹침 0.
- 묶음(display:contents) 등록물 4개(헤더 · 화면 탭 · 층 선택 바 · 자산 목록 판)는 measure 가 ox · oy 를 잰다.
- 순서: 서버 `node src/bems/_gen/serve.js 5610` → `node src/bems/_gen/pw.js ../../bems-assets/_gen/measure.js`(src/bems/_gen/asset-sizes.json) → `node mk-assets.js` → (처음 한 번) `node patch-library.js` → studio.html 의 `bems-assets.js?v=` 올림.
- 점검: `lib-check.js`(탭마다 다크 · 라이트, 깨진 그림 · 빈 칸 · 불투명 0 — 11-26 통과), `lib-cards.js <탭> <테마>` + `node sheet.js <테마> <탭> 6 <개수>`(카드 3배 · 자홍 바탕 = 투명 확인).
- 함정: 점검 스크립트의 '이 시안 그림' 판별 정규식(`src\/datacenter\/`)은 sed · node -e 로 바꾸면 역슬래시가 먹힌다 → fix-paths.js 처럼 파일로.
  처음엔 아이콘 탭에 데이터센터 아이콘 27개가 잡혔다.

## 분자 라이브러리 (wemb-atomic)
1. `node mk-atomic-src.js` — 빌더 3개(main · floor · live) · 그림 97장을 wemb-atomic/sources 로 복사 + 등록(atomic-catalog.mjs generatedPattern `bems-(?:main|floor)` · familyRuntime `bems-live.js`, library.mjs FAMILY_LABELS '스마트 빌딩 에너지 관리', test 페이지 수 179 · family 목록). 합성 장면 없음.
2. `npm run build`(분자 534 → 545) → `npm test`(19/19) → 확정 이름 소실 대조(514 중 0) → 5510 서버 재시작(Startup 'WEMB Studio 서버.vbs') → `atomic-measure.js`(179장, 90초)
   → `node atomic-names.js`(bems 전용 새 분자 11개 제안대로 확정, names 525) → `atomic-verify3.js`(4,031건, 문제 2 = SK하이닉스 기존) → `npm run export`(src/atomic 78.9MB) → `atomic-check.js`(페이지 2장).
3. 스튜디오 원자 변경 창 접두어(js/studio/atom-swap.js PXS)는 템플릿 등록 때 이미 넣었다.
