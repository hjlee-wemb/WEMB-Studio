# 복합화력 설비정보 디지털트윈 — 생성기 (tpl `ccpp`)

스튜디오 템플릿 **Digital Twin: Combined Cycle Power Plant**. Figma `r7V2rTKcUto2Yd1qL4XSfZ`(REM 섹션, 가상 데이터 반영본)의 화면을 순수 HTML/CSS DOM 으로 재구축한다.
발전소 방재 생성기(`src/plantdp/_gen`)를 복사해 `retarget.js` 로 이름 · 키 · 포트(5575)를 바꿨고, 라이브(`live-src.js`)는 이 화면에 맞게 새로 썼다.

| 장면 | 접두어 | Figma | 카드 라벨 |
|---|---|---|---|
| main(첫 화면) | ccm | 427:674 | 설비 맵 |
| library | ccl | 427:725 | 도서관리 |
| diagram | ccd | 427:959 | 계통도 |
| detail | cce | 427:1003 | 태그 · 상세정보 |
| file-open | ccf | 427:1364 | 파일 열기 |

탭 조각(src/ccpp-tabs.js, window.CC_TABS): 설계 = 427:1536(화면 5 숨은 팝업의 설계정보 패널) · 설비 = 427:4038 · 자재 = 427:4307(Component 섹션 Popup/Detail 변형의 Content). 접두어 ccta · cctb · cctc.
태블릿 화면(427:1781, 1366x1024)은 Figma 에서 내용이 90° 돌아간 좌표라 빼고, 상세 화면이 반응형으로 그 비율을 맡는다.

## 파이프라인 (원본이 **라이트**, 다크는 파생)

1. get_design_context(큰 화면은 excludeScreenshot) · use_figma 상자 덤프(`@@meta <key> A`) → `node save-dc.js <세션 id>` → `dc-<key>.txt` · `meta-<key>.xml`
2. `node dl.js` → `node strip-gama.js <png…>` (에셋 → `src/ccpp/`)
3. 한 번만: `node retarget.js` · `node patch-conv.js` · `node patch-dark.js`
4. `powershell -ExecutionPolicy Bypass -File mk-dark-diagram.ps1` (계통도 다크 사본) · `node mk-dark-svgs.js` (`*-dk.svg` + `dark-assets.json`)
5. `node conv.js` → `src/ccpp-<장면>.js` · `src/ccpp-tabs.js` · 미리보기 `src/ccpp/<장면>.html`
6. `node mk-live.js` → `src/ccpp-live.js` (차트 부품은 src/plant-live.js makeChart 이식, pf- → cc-, 색상각 213°)
7. `node patch-studio.js` → 스튜디오 연결(이미 있으면 건너뜀, `js/templates/ccpp.js` 는 plantdp.js 에서 매번 다시 뜸)
8. `node pw.js cap.js live` → `powershell -ExecutionPolicy Bypass -File mk-thumb.ps1` → `src/templates/ccpp-*.jpg`
9. 고친 뒤엔 `js/core/tpl-modules.js` 의 `?v=` 를 올린다.

검증 서버 `node serve.js 5575`(WEMB Studio 루트). 점검: `node pw.js cap.js` → `node diff-all.js`(정적 대조, 1~5%: 대부분 글꼴 Pretendard 차이), `node pw.js cap-ratio.js W H`(화면비별 여백), **`node pw.js ctl-cc.js`**(진짜 클릭 + 가린 판 검사), **`node pw.js studio-check.js`**(스튜디오 열기 → 여백 · 시계 · 레일 이동 · 스크롤 · 탭 · 접기 · 다크 · 색 · 패널편집 글자/차트/옮기기 · 새로고침 · 배치 초기화).

## 함정

1. `border-b-3`(Tailwind v4 숫자 폭) — 활성 탭 밑줄. conv 에 추가.
2. 에셋 없는 조각(탭)은 응답이 `export default function` 으로 바로 시작하고 안내문이 같은 글 뒤에 붙는다 → save-dc 가 잘라서 받는다. conv 는 `ASSETMAP[key] || {}`.
3. Figma SVG 남색 글리프(#072549, 채도 0.82)는 '무채색만' 다크 규칙에 안 걸려 다크에서 묻혔다 → 명도 0.25 이하는 채도와 상관없이 밝게(mk-dark-svgs).
4. 계통도 그림(흰 종이 JPG)은 다크에서 눈부시다 → 무채색(바탕 · 검은 글씨)만 명도를 뒤집고 색 선은 색상각 유지(mk-dark-diagram.ps1, C# LockBits).
5. 화면 맨 위 판이 `left:50%` · `calc(50% - …)` 라 캔버스를 넓히면 저절로 움직인다 → installFit 이 처음 자리를 px 로 굳힌 뒤 이름으로 붙인다.
6. 켜진 탭 밑줄은 탭 요소가 아니라 conv 의 `::after` 안쪽 링 → 켜진 탭은 글자색으로 찾고, 원래 탭 `::after` 는 끄고 새 탭엔 같은 색 안쪽 그림자.
7. 태그 목록(GROUP)은 inline-grid 한 칸에 줄을 margin-top 으로 겹쳐 쌓는다 → 순서를 바꾸거나 거르면 `restack` 으로 margin-top 을 다시 매긴다(DOM 순서만 바꾸면 화면이 그대로).
8. 정비상세 왼쪽 열(427:1317)이 높이 150 고정인데 항목 6개(306)라 '작업내용' 줄과 겹쳤다(1080 에선 팝업 아래로 잘려 안 보임) → Figma 도 Hug 로 고침 + conv NODE_CSS.
9. 세로로 남는 몫은 판 안의 큰 표 · 막대도 같이 늘린다(GROW) — 묶음 그리드 `List` 는 늘리면 안쪽이 겹친다(빼 둠).
10. 패널편집 중엔 글자가 편집 칸이라 글자 위를 끌면 옮기기 대신 글자 편집 — 판의 빈 곳을 잡아 끈다(검증도 그렇게).

## 화면 잇기(정한 것 — Figma reactions 없음)

레일 홈 · 맵 → main, 태그관리 → detail, 도서관리 → library, 계통도 → diagram, 로그아웃 → 알림(로그인 시안 없음). 상세 팝업 ePnID → file-open, 파일 열기 카드 3D 화면 → main · P&ID 공정도 → diagram · 도면파일 열기 → library. 파일 링크 → 알림.

## 시안에 없어서 정한 것

- 왼쪽 판 접기(11-18 사용자 요청 "왼쪽 메뉴도 닫히게"): 맵 · 태그 · 도서 판 오른쪽 가장자리, 판 제목(Map · Tag · 도서관리) 글자와 한 줄(세로 가운데 맞춤, 11-18 사용자 지시)에 접기 단추(상세 팝업 Button/Hide 와 같은 44px 원 · glyph-10.svg 화살표, `Button/Collapse Panel`). 레일에서 켜진 메뉴를 다시 눌러도 접힌다. 판은 레일 뒤로 미끄러지고 흐려진다, 닫힌 상태는 장면을 옮겨도 이어진다(localStorage `wemb-ccpp-leftfold`). 검증 `node pw.js fold-left.js`. 움직임(11-18 사용자 "화살표가 허겁지겁 뒤따라간다"): 판 · 단추 · 화살표가 같은 곡선 cubic-bezier(.45,0,.2,1) · 같은 시간(0.5 + 판 폭×0.00025 s, --ccl-dur), 닫을 땐 판이 마지막 40% 에서만 흐려진다 — 표본 검증 `node pw.js fold-motion.js main|library`.
- 운전정보 탭: 같은 카드 모양(Tab Panels 색 · 둥글기) 안에 실시간 차트(배기압력 PT-412A/B/C · 출력 · 회전수 · 배기 온도).
- 스크롤이 움직이게 가상 줄 추가: 도서 6건(-013~-018) · 태그 6건(복제 줄, `data-cc-clone`).
- 날짜: 시안 기준일 2026-11-17 → 오늘로 하루 단위 이동(날짜 사이 간격 유지). 시계는 실시간. 이벤트 목록은 시안에 없다.
- 색 정하기: 주조색 #0073FF(213°). 그대로 둘 것 = 3D 설비 그림 · 계통도 그림(다크 사본 포함) · W 로고 · 로고.
- 추천 차트(specsFor): 가스터빈 · 스팀터빈 구역, 도서 판, 태그 판, 정비이력 · 정비상세 패널, 파일 열기.
- 회의 모드 가림 이름: 고성 · Goseong · goseong (KOEN 은 이미 있음).

## 에셋 · 분자 라이브러리 (11-18, 생성기 `src/ccpp-assets/_gen`)

1. `spec.json`(컴포넌트 목록, 같은 그림은 한 번만) → `node pw.js ../../ccpp-assets/_gen/measure.js` → `node src/ccpp-assets/_gen/mk-assets.js` → `src/ccpp-assets.js`. 연결은 `patch-library.js`(한 번). 점검 `lib-check.js`(자홍 바탕 = 투명 확인) · `zoom-check.js`.
2. 장면 DOM 밖도 등록: 탭 조각(conv 가 `build_ccta/b/c` · `CCTx_CSS` 전역도 내보냄), 운전정보 차트 카드 `mk-oper.js` → `src/ccpp-oper.js`(라이브 DOM 정적 사본, 테마 규칙은 `CCTO_LIGHT_CSS`). 둘 다 tpl-modules 에 build 로 등록.
3. 분자 라이브러리 사본: `node src/ccpp-assets/_gen/mk-atomic-src.js`(탭 조각을 파일 3개로 나누고 창 크기를 사본에서만 못 박음) → wemb-atomic README '새 템플릿 넣기' 순서(build · test · names 대조 · 서버 재시작 · `atomic-measure.js` · export). 검증 `atomic-verify3.js`(문제 항목을 페이지 · 변형까지).
