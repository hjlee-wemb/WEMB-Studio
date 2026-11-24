# 데이터센터 통합 모니터링 — 생성기

원본은 Figma `HzfsAmSQbpqIhAYebEkOWr`(LG CNS 부산 통합모니터링, 익명화 · 가상 데이터본)의 REM 페이지입니다. `original` 페이지는 대상에서 뺐습니다.
스튜디오 템플릿 이름은 **`Digital Twin: Data Center Integrated Monitoring`**(tpl `datacenter`)입니다.
화면 안 글자는 가상 데이터만 씁니다(해람 스마트 클라우드 데이터 센터, 기준 시각 2026-11-24 14:27:35).

| 장면 | 접두어 | Figma | 모듈 | 비고 |
|---|---|---|---|---|
| main 통합모니터링 | dmm | 2857:2053 | src/datacenter-main.js | design context 가 잘려 compose-main.js 로 이어 붙임 |
| power 통합전력계통도 | dmp | 2857:2156 | src/datacenter-power.js | 아래 팝업들의 바탕 |
| worker 작업자안전관리 | dmw | 2857:2443 | src/datacenter-worker.js | |
| asset 자산관리 | dma | 2857:2664 | src/datacenter-asset.js | |
| equipment 설비정보 | dme | 2857:3044 | src/datacenter-equipment.js | dmp 위 팝업 |
| card 설비 카드 | dmc + dmi | 3378(뿌리 729:4229) + 3379 | src/datacenter-card.js · compact.js | 카드 + 간이 설비정보 창 두 장을 함께(build_dmp_cardset) |
| search 설비정보팝업 | dms | 2857:3670 | src/datacenter-search.js | dmp 위 팝업 |
| scenario 시나리오설명 | dmx | 2857:3672 | src/datacenter-scenario.js | dmp 위 팝업 |

## 만드는 순서
1. `dc-<key>.txt` · `meta-<key>.xml` — get_design_context / get_metadata 결과. 메인은 `node compose-main.js`(dc-part-2857-2153 · 2154 를 끼움, 원본은 dc-2857-2053.raw.txt).
2. `node dl.js` → `node strip-gama.js` 로 에셋 159개를 src/datacenter/ 에 받습니다.
3. 라이트 그림 사본 `node mk-light-datacenter.js`(svg 45장 → *-lt.svg + light-assets.json), 라이트 손규칙 · 형상 보정 `node mk-light-rules.js`(screen-css.json).
4. `node conv.js` 로 9개 모듈과 미리보기(src/datacenter/*.html)를 만듭니다. 이어서 `node mk-cardset.js`(cardset.html = 카드 장면 미리보기).
5. 라이브 레이어 `node mk-live.js`(live-src.js + src/plant-live.js 의 차트 부품 → src/datacenter-live.js). 고치면 js/core/tpl-modules.js 의 `?v=` 를 올립니다(모듈 v=2 · 라이브 v=7).
6. 스튜디오 연결은 js/templates/datacenter.js 와 patch-studio.js(이미 적용). 로고 교체 선택자 · 색 정하기 옵션은 js/templates/image.js 의 DOM_CUSTOM · DATACENTER_OPT.
7. 썸네일 `node pw.js cap-thumb.js` → src/templates/datacenter-*.jpg(1920x1080, 카드는 cardset).

## 라이브(live-src.js)에서 하는 일
- 반응형: 1920x1080 + 균일 배율. 첫 단 묶음은 왼/가운데/오른 · 위/가운데/아래에 따라 남는 폭 · 높이를 나눠 갖고, 바탕은 dc-bgfill 이 늘어난 판 전체를 칠합니다.
  화면 폭 띠(이벤트 목록 · 작업리스트)는 폭을 늘리고 안쪽 칸을 자리 비율만큼 옮깁니다 — % · flex 로 저절로 밀리는 칸은 1000px 늘려 재서(auto) 빼야 두 번 밀리지 않습니다. 자산관리는 위에 붙이고 큰 바탕판을 아래로 늘립니다.
- 실시간 시계(헤더 · 알림 폰), 발생 · 작업 시각을 '지금' 기준으로 옮김, 새 이벤트 유입 · 건수 칩 증가, 층별 작업 수 흔들기.
- 이벤트 현황 접기(첫 도구 단추) · 작업리스트 펼치기(이름 없는 화살표 칸) — 화면마다 localStorage 에 기억.
- 시나리오 단계 스크롤: 단계마다 Figma 마스크(mask-image + 위치)가 붙어 있어, 칸을 올린 만큼 mask-position 을 내립니다. 마스크 없는 칸은 clip-path.
- 화면 잇기: 헤더 메뉴 · 옆 판 단추(도면정보 → 전력, 시나리오, 설비정보 → 검색) · 평면/건물 계통도 단추 · 카드 메뉴(상세보기 → 설비정보) · 닫기.
- 패널편집: 차트 바꾸기(메인 이벤트 현황 · 알림 폰, 작업자 금일작업 건수, 자산 표) · 패널 옮기기(이름 있는 판 + 이름 없는 큰 판).

## 헤더 메뉴 · 오버 · 툴팁(installMenu · installTips · passThrough)
- Figma 메인 · 전력 헤더의 'Hover' 묶음(화살표 + Drop Down Default)은 '전력' 오버 상태가 찍힌 것 → 평소엔 숨기고, 지금 화면 메뉴만 밝게 + 그 아래 화살표.
  메뉴에 올리면 화살표가 미끄러지고, '전력'에 올리면 서브메뉴(통합전력계통도 → power, 평면전력계통도 → card)가 내려온다. 작업자 · 자산 헤더엔 같은 치수 · 레이어 이름의 서브메뉴(.dc-ddsolo)를 붙인다.
- 단추마다 data-dc-tip 툴팁(0.38초 뒤, 패널편집 중엔 안 뜸). 묶음(display:contents) 단추는 조각 상자들을 함께 밝힌다(.dc-hovpart).
- 검사: `hit-audit.js`(모든 단추에 실제 마우스가 닿는지) · `hover-audit.js`(올리면 모양이 바뀌는지 — 형제를 밝히는 계통도 칸 · 시나리오 표, 새 이벤트로 복제된 줄은 오탐) · `hover-test.js [dark|light]` · `studio-hover-test.js`.

## 3D 무대 확대(installStageZoom — 메인 '조작 안내' #dmm-List_2)
- Scene Image(1744x704, 층 이름도 그림 안)를 transform(translate + scale, 원점 0 0)으로 키우고, 원래 칸 밖은 clip-path inset 으로 자른다. 반응형 이동(translate 속성 · __fx)과 따로 논다.
- 휠 내리기 = 확대(마우스 자리 고정, 최대 3.2배) · 올리기 = 축소, 더블 클릭 = 부분 확대(2.2배, 그 자리를 가운데로) / 확대 중 더블 클릭 = 되돌아오기, 확대 중 끌기 = 이동.
- 조작하면 안내 줄이 반짝이고(.dc-hintflash), 안내 줄을 눌러도 같은 동작. 층 목록 · Play = 그 층(FLOOR_V, 그림 좌표 v)으로 1.9배, Reset = 처음 시점. 패널편집 중엔 막는다.
- 검사: `zoom-test.js [w h]`, `studio-zoom-test.js`.

## 함정
- 메인 헤더 상자가 1920x190 이라 옆 판 단추 · 조작 안내 · 알림 설정 윗부분을 덮어 마우스가 안 닿았다(스크립트 click 시험은 통과해서 몰랐다) → 헤더 안 빈 큰 묶음은 pointer-events 통과.
- 설비정보 팝업은 투명한 1920x1080 틀이 아래 전력 화면을 막았다 → 팝업 마운트의 화면 크기 투명 틀만 통과(불투명 전체 화면 팝업 = 시나리오 설명은 그대로 막음).
- 계통도 · 3D 그림 상자는 칸 밖까지 뻗어 빈 바탕에서도 눌렸다 → 그림은 통과, 칸 바탕(Background)이 받는다. 3D 칸 이름은 View/3D Scene.
- 메뉴 오버 칸을 넓힌 ::after 는 패널편집 중 글자를 덮는다 → 편집 중엔 끈다.
- 알림 폰(Popup/Alarm Message)은 마스크로 잘린 바깥(이벤트 목록 위)까지 상자가 있어 칩 클릭을 가로챘다 → 폰 안은 단추만 pointer-events.
- 헤더 'Header' 와 이벤트 목록 안 'Header' 가 이름이 같다 → 로그아웃 아이콘이 든 쪽(headerOf)만 헤더.
- 차트 부품(plant-live)은 idle · clamp · comma 도우미를 쓴다 — live-src.js 에 같이 있어야 한다.
- 설비정보 표 값 칸(2857:3067 · 3068)은 줄높이 12/24 가 섞인 글자 하나 — Figma 는 24px 행마다 그린다 → 형상 보정(screen-css.json 2857-3044).
- 라이트: 팝업 뿌리(.sh-pop)에 공통 바탕색이 깔려 전력 화면을 덮었다 → 투명. Normal 배지의 짙은 초록 정지색은 팔레트에서 그대로. 헤더 시계 규칙은 `Header:has(Icon Logout)` 로 좁힌다(이벤트 칩 숫자에 번짐).
- 왼쪽 판 선: 다크에선 판 · 제목 · 구분선이 모두 짙은 보라(#373662)라 Figma 의 1px · 7px 어긋남이 안 보였다. 라이트는 #b9c7d8 한 색(팔레트 BORDER + divider 사본)으로 바꾸고,
  메인 Title Bar 테두리를 판 테두리에 겹치고(left/right -1px), 전력 Divider/Title · Buttons · Section 을 판 폭(부모 기준 left 6.99 · 240.02)에 맞춘다. 검사 `side-lines.js 장면 x0 x1 y0 y1` · `side-cap.js`.
- 평면 계통도 PNG 는 라이트에서 invert + hue-rotate 로 밝기만 뒤집는다. 3D 렌더 · 사진은 그대로.
- Bash heredoc · sed 로 정규식 역슬래시를 넣으면 먹힌다 → 정규식 줄은 Edit 도구로.

## 검증
- 서버 `node serve.js 5600`(WEMB Studio 루트), 브라우저 `node pw.js <스크립트>`.
- `live-test.js [w] [h] 장면…`(IP_THEME=light 로 라이트), `dc-interact.js`(접기 · 필터 · 펼치기 · 스크롤 · 시나리오 줄), `scroll-dc.js`.
- `studio-test.js` — 갤러리 → 스튜디오 열기 → #dtStage 여백 0, 장면 이동 0.3~0.4초(1.5초 규칙), 라이트에서 팝업 뿌리도 따라감, 콘솔 오류 0.
- `studio-edit-test.js` — 패널편집: 글자 100/100 편집 가능, 패널 이동(4px 격자), 차트 바꾸기, 색 정하기(3D 렌더는 원래 색 유지), 라이트.
- 다크 픽셀 차이(cap.js → diff-all.js)는 1~11% 이며 빛 번짐 그라디언트와 글꼴(Pretendard 대체) 차이입니다.
