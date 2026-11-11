# 스마트 플랜트 가스 모니터링 — 에셋 라이브러리 등록 목록

스튜디오 '에셋 라이브러리'(차트 · 심볼 · 아이콘 · 패널 · 이벤트 패널 탭)에 가스 모니터링 5화면의 컴포넌트를 올린다.
결과물은 `src/gasmon-assets.js`(window.`__GASMON_ASSETS`) 하나 — **손으로 고치지 말고 다시 돌린다.**

지금 목록(2026-11-12): 차트 2 · 패널 12 · 이벤트 2 · 심볼 33 · 아이콘 3.

| 파일 | 하는 일 |
|---|---|
| `spec.json` | 등록 목록. 컴포넌트는 `{sc, nid, name, fig}`(sc = main · gas · worksite · alarm · confirm), 아이콘은 `[파일, 이름, Figma 이름]` |
| `measure.js` | Playwright filename — 미리보기(`src/gasmon/<장면>.html?live=0`)에서 노드를 찾고 크기를 잰다 → `src/gasmon/_gen/asset-sizes.json` (서버 `node src/gasmon/_gen/serve.js 5546`) |
| `mk-assets.js` | spec + 크기 → `src/gasmon-assets.js`. 같은 노드 두 번 · 이름 중복 · 다른 시안과 이름 겹침 · 파일 사용 여부를 검사 |
| `patch-library.js` | 처음 연결할 때 한 번(layout-editor.js `GM` · authoring.css `.hj-asset.gmX-root` · studio.html · tpl-modules.js ?v). 이미 적용됨 |
| `lib-check.js` | 탭마다 이 시안 것만 남겨 다크 · 라이트로 찍는다. **카드 바탕을 자홍으로** 칠해 투명이 아닌 곳이 바로 보인다 |
| `drop-check.js` | 패널 · 심볼 · 아이콘을 화면으로 끌어 넣어 본다 |

순서: `measure.js` → `node src/gasmon-assets/_gen/mk-assets.js` → `lib-check.js` · `drop-check.js`. 목록을 바꾸면 studio.html 의 `src/gasmon-assets.js?v=` 를 올린다.

검증(2026-11-12): 다크 · 라이트 모두 깨진 그림 0 · 빈 칸 0 · 불투명 바탕 0, 끌어 넣은 사본 크기 = 등록 크기, 콘솔 오류 0.

## 무엇을 올렸나

- **패널** — 헤더, 메인 메뉴 카드 묶음, 이벤트 현황 패널, 센서현황 패널, 공장도면 패널, 팝업 3장(작업개소 상세 · 가스농도 이상 · 전송 확인)과 그 안의 위젯 4개(가스 감지기 Data · 작업 상세 정보 · 작업개소 목록 · 작업자 감지 표).
- **이벤트 패널** — 이벤트 목록 표, 이벤트 줄.
- **차트** — 시안에 차트가 없어 미터 두 가지(센서현황의 좌우 비교 미터 줄, 팝업의 가스 농도 미터 줄). 패널편집 추천 차트는 라이브가 그때그때 그리는 것이라 노드가 아니다.
- **심볼** — 날짜 · 시계, 상단 메뉴, 메뉴 카드 3종 · 메뉴 그림 2종, 이벤트 툴바 부품(제목 · Auto 드롭다운 · Ack · 건수 칩 3), 등급 배지 5, 표 머리줄, 센서 표지 2, 공장도면 제목 배지, 팝업 부품(구역 제목 줄 · 정보 줄 · 표 머리줄 · 표 줄 · 머리줄 · 닫기 · 가스 농도 배지 · 사유 입력칸 · 완료 · 보내기 · 취소).
- **아이콘** — 시계 · 로그아웃 · 알림음 켜짐. 메뉴 그림의 조각(구름 · 렌즈 · 몸통 …)은 따로 뜻이 없어 그림째 심볼로 올렸다.

## 이 시안만의 장치

1. **팝업은 창만** — 팝업 모듈에는 가스 메인 위에 얹는 장면(`build_gmX_scene`)과 창만 그리는 `build_gmX` 가 함께 있다. 라이브러리는 `build_gmX` 에서 자른다.
2. **라이트 화면 판 색** — `light.js` 의 뿌리 바탕(`#eef3f7`)은 `:not(.hj-asset)` 로 썼다. 안 그러면 라이트 썸네일마다 밝은 네모가 깔린다(라이트 시트가 authoring.css 보다 뒤에 실려 같은 우선순위로 이긴다).
3. **overlay 섞기 층** — Ack 단추 판(인라인 SVG)의 윗면 빛은 `mix-blend-mode:overlay` 라 화면에선 패널 바탕과 섞이지만, 사본은 배율(transform)로 따로 떨어진 층이라 흰 반쪽이 된다 → authoring.css `.hj-asset.gm-asset use[style*="mix-blend-mode"]` 를 옅은 흰빛으로.
4. **흰 아이콘** — 알림음 아이콘은 흰색 전용이라 라이트 테마 사본(`boolean-true-lt.svg`)을 쓰고 `light`. 사본이 없을 때만 `<이름>-lib.svg` 를 만든다 — `-lt.svg` 는 테마가 쓰는 파일이라 덮어쓰지 않는다.

## 밟은 함정

- **이름이 POSCO 와 겹친다** — 이벤트 현황 부품(등급 배지 · 건수 칩 · Ack)이 POSCO KDB 와 같은 이름이라 `(가스 모니터링)` 을 붙였다. `mk-assets.js` 의 `!! 다른 시안과 이름 겹침` 을 꼭 볼 것.
- **라이트 Warning 배지가 두 줄** — 라이트에서 등급 글자를 굵게(600) 하자 'Warning' 이 칸(38px)을 넘었다. 라이브러리 점검에서 찾았고 화면에도 있던 버그라 `conv.js` NODE_CSS 에 `white-space:nowrap` 을 넣었다.
- **같은 노드 id 가 여러 줄에 있다** — 이벤트 표의 배지는 컴포넌트를 되풀이해 `34:992`(Normal) 가 두 줄에 있다. 라이브러리는 첫 번째를 자른다.

## 화면을 다시 만들었을 때

`src/gasmon/_gen/conv.js` 로 화면을 다시 만들면 노드 id 는 그대로라 목록은 맞는다. 크기가 바뀌었으면 `measure.js` 로 다시 재고 `studio.html` 의 `src/gasmon-assets.js?v=` 를 올린다.
분자 라이브러리는 따로(`wemb-atomic`) — `src/gasmon-*.js` · `src/gasmon/`(미리보기 html · `_gen` 빼고)를 `wemb-atomic/sources/WEMB-Studio/src/` 로 다시 복사하고 `npm run build` → `npm test` → 서버 재시작 → 분자 라이브러리를 새로 열어 측정 → `npm run export`.
