# 스마트 도면관리시스템 — Figma → 순수 HTML/CSS 재구축

Figma 파일 `hfgGjtOuOsX3wdxk33ldyv`(page `Light-시안01`)의 화면 19장을 **순수 HTML/CSS DOM** 으로 다시 지은 것과 그 생성기.
스튜디오 템플릿 이름은 **`Dashboard: Smart Drawing Management`** (2D 대시보드 · 에너지·환경 · tpl `drawing`, 슬러그 `dashboard-smart-drawing-management`).

| 장면 | Figma 프레임 | node | 접두어 |
|---|---|---|---|
| main | 메인 | `1:105` | `dwm` |
| main-menu | 메인-메뉴 | `1:199` | `dwn` |
| main-select | 메인-메뉴-셀렉 | `1:298` | `dws` |
| main-popup | 메인-메뉴-팝업 | `1:393` | `dwp` |
| search | 3_도면조회01 | `1:1890` | `dwa` |
| search-detail | 3_도면조회02 | `1:2550` | `dwb` |
| preview | 도면조회 추가UI_02_미리보기 | `1:7737` | `dwv` |
| preview-popup | 팝업 | `1:9189` | `dwo` |
| register | 1_도면 등록 | `1:3119` | `dwr` |
| equipment | 2_팝업(설비 마스터) | `1:2787` | `dwe` |
| help | 0_팝업(도움말) | `1:2950` | `dwh` |
| checkin | 8_도면수정(체크인) | `1:3909` | `dwi` |
| cctv | 4_CCTV 조회(관리자) | `1:3471` | `dwc` |
| desk | 5_Help Desk 조회 | `1:3738` | `dwk` |
| desk-write | 6_등록 | `1:3648` | `dww` |
| desk-detail | 7_상세보기 | `1:3597` | `dwd` |
| total-search | 통합검색 | `1:6530` | `dwt` |
| total-result | 통합검색_상세 | `1:6934` | `dwu` |
| login | 로그인 | `1:73` | `dwl` |

- 글자는 전부 실제 텍스트(`<p>`), Pretendard Variable CDN. 그래픽은 Figma 가 내보낸 개별 파일(`src/drawing/*.svg|png`, 164개).
- Figma 레이어명을 `id` · `class`(`dwm-<레이어명>`) · `data-name` 에 보존. 레이어명 · 가상 데이터는 Figma 파일에서 정리했다.
- **`src/drawing-<장면>.js` 와 `src/drawing-live.js` 는 손으로 고치지 말 것.** 화면은 conv.js · dark.js, 라이브는 `live-src.js` 를 고쳐 `node conv.js` · `node mk-live.js`.

## 파이프라인

무선망 통합관리(`src/wnms/_gen/`) 도구를 복사해 `prep.js` · `patch-conv-*.js` 로 옮겼다(한 번만. 이미 적용됨).

```
1) get_design_context(forceCode, disableCodeConnect, excludeScreenshot) → node save-all-dc.js → dc-<key>.txt
2) get_metadata → meta-page.xml             인스턴스 레이어명 · 상자 크기
3) node dl.js → node strip-gama.js          에셋(주소는 7일이면 만료)
   powershell mk-small-images.ps1           무거운 사진 축소
4) node text-measure.js → node font-fit.js  font-fit.json — Figma 쪽 옛 글자 폭 맞춤(47곳)
5) Playwright mk-dark-photos.js → *-dk.jpg 를 src/drawing/ 로 옮김 → node mk-dark-assets.js   다크 사진 · 아이콘 칸 · SVG 사본, dark-assets.json
6) node conv.js                             → src/drawing-*.js + 미리보기 src/drawing/*.html
7) node mk-live.js                          → src/drawing-live.js
8) Playwright cap.js → node diff-all.js · studio-check.js
9) powershell mk-thumb.ps1                  → src/templates/drawing-*.jpg
10) node patch-studio.js                    스튜디오 연결(이미 적용됨)
```
검증 서버 `node serve.js 5544`(루트 = WEMB Studio). 미리보기 `src/drawing/main.html` — `?live=0` 라이브 없이, `?t=light|dark`, `?edit=1`.

## 이 시안이 다른 시안과 다른 점

- **원본이 라이트다.** `dark.js` 가 다크를 파생한다(그래파이트: 바탕 #0e0f12 < 헤더 #131519 < 패널 #17191e > 값 칸 #111316).
- **다크 사진은 필터가 아니라 밤 장면으로 새로 그린다(2026-11-09 사용자 지적 "너무 어색해")** — 색 행렬로 누른 첫 판은 남색 막을 씌운 꼴이라 건물 빛이 죽고 회색 패널과 따로 놀았다. 둘째 판(무채색 방 + 건물만 네온 + 도면선 뒤집기 + 윤곽선 강조)도 "이미지가 이상해, 잘 어우러지게" — 오려 붙인 것처럼 따로 놀았다. 지금 `mk-dark-photos.js`: 메인은 사진 전체를 선형 공간에서 같은 곡선 · 같은 옅은 푸른 기운으로 낮추고, 건물이 내는 빛(채도 · 밝기로 부드럽게, 윤곽 다각형은 24px 흐림)을 넓게 흐려 책상 · 종이의 표면 밝기에 곱한다 — 빛 웅덩이 속에서 도면 선이 원본 그대로 보인다. 로그인도 같은 방식으로 도형 · 무늬 · 구름의 밝기 관계를 그대로 둔다. 영역별로 따로 칠하거나 윤곽을 강조하지 말 것. 저장 전에 미세한 결을 넣어 어두운 면의 계단 · JPEG 네모를 막는다.
- **패널 안쪽 빛** — 원본의 푸른 100px 안쪽 그림자는 어두운 판에서 뿌옇게 뜬다. 다크는 그 칸에 머리카락 테두리 + 윗면 빛 + 바깥 그림자, 판은 위아래 그라데이션 유리. Count 칸 · 공지 행도 검정 대신 흰 5~10% 면.
- **아이콘 칸** — 공지 · Help Desk 아이콘은 흰 판이 그림에 박힌 불투명 PNG 다. 가장자리에서 flood 로 판만 지워 어두운 칸으로(물체의 흰 면은 남긴다).
- **유리 그림은 화면 안에 직접 심는다**(`background-1*.svg`, backdrop-filter 때문). `content:url()` 사본 교체가 안 먹어서 다크 색은 dark.js 의 `DRAWING_GLASS` CSS 가 칠한다.
- **긴 화면** — 체크인 1174 · 통합검색 결과 1576 은 Figma 높이가 1080 보다 커서 스테이지 안에서 세로로 스크롤되고 헤더는 위에 고정된다(`PAGE_H`).

## 밟은 함정

① **가운데 정렬이 `left:50% + margin-left` 인 판** — 판을 넓히며 left 만 바꾸면 밀린다(Dim 이 왼쪽 위 1/4 만 덮고, 넓은 창에서 사진 왼쪽이 비었다). 라이브가 `margin:0` 으로 지우고 left 를 직접 계산한다.
② **`setPos` 는 left 를 px 로 고정한다** — 'left 50% 라 알아서 가운데'라고 안 옮기면 넓은 창에서 로그인 제목이 왼쪽에 남는다. 가운데 정렬도 똑같이 늘어난 폭의 절반을 더한다.
③ **높이 기준은 늘리기 전에 모두 잰다** — 부모 높이가 자식을 따라 자라서, 자식부터 늘리고 부모를 재면 늘어난 값에 또 더해진다(Result Panel 이 1835 까지, 표가 화면 밖으로). `primeTable`.
④ **세로선은 90도 돌린 가로선** — 바깥 상자는 높이, 안쪽 두 겹은 폭을 늘린다(`growRotated`).
⑤ **`Icon/Arrow` 가 두 겹** — 자손 선택자로 180도 돌리면 겹쳐서 360도(제자리). 직계(`>`)만 돌린다.
⑥ **사진은 판의 오른쪽 끝까지 닿지 않는다** — 판 2404 중 가운데에서 오른쪽으로 41%까지만 찍혀 있다. 넓은 창은 그 안에서 덮게 키운다.
⑦ **밝은 회색 구분선 SVG 는 다크 사본에서 안 바뀐다** — 일반 규칙은 어두운 선만 밝히므로, `divider*` 는 mk-dark-assets 에서 따로 #343842 로.
⑧ **dark.js 표는 text / bg 가 따로** — `#fefdfe` 가 글자 표에만 있어 바탕이 자동 변환으로 붉게 나왔다. `includes` 로 '이미 있나' 보면 다른 표의 값에 걸린다.
⑨ **design context 가 변형 기본 상태 인스턴스의 data-name 을 뺀다** — conv 의 `DRAWING_FIX_C` 표가 되찾는다(호버 · 화면 잇기가 이 이름을 쓴다).
⑩ **재기 전에 프레임을 Figma 크기로** — 좁은 창에서 퍼센트 좌표가 창 기준으로 재어져 어긋난다.

## 검증 (2026-11-09 · Playwright)

픽셀차(tol 24, `?live=0`, 라이트): 메인 묶음 2.0~2.1% · 도면조회 · 미리보기 5.2~5.8% · 등록 4.5% · 설비 팝업 4.3% · 도움말 1.2% · 체크인 2.0% · CCTV 5.9% · Help Desk 1.2~2.1% · 통합검색 1.0~1.1% · 로그인 0.4%. 차이는 거의 글자 렌더링.
스튜디오 #dtStage(1568×1032) 여백 `[0,0,0,0]`, 열기 약 1.0초, 메뉴 이동 0.1~0.9초, 메인 글자 41/41 편집 가능, 차트 교체 · 패널 맞바꾸기 · 새로고침 유지, 콘솔 오류 0. 1248×852 · 1920×1080 · 2560×1080 전 화면 여백 0.

## 시안에 없어서 정한 것(사용자에게 알릴 것)

- **Event List · Fold Button** — 시안에 없다. 접기는 도면조회 **상세검색(Advanced Filters)** 과 왼쪽 **트리** 에 넣었다. 상세검색 단추로 접으면 표가 줄어든 만큼 받는다.
- **차트** — 시안에 차트가 없다. 패널편집에서 메인 3패널(나의 도면현황 · 공지사항 · Help Desk)에 추천 차트를 고를 수 있고, 고른 차트는 실시간처럼 움직인다. 값은 가상.
- **시계** — 시안에 헤더 시계가 없다. CCTV 화면의 시각이 초 단위로 흐른다.
- **최근 시각** — 이벤트 로그가 없어 공지 · 문의 · 체크인 등의 날짜를 시안 기준(2026-11-06 14:20)에서 지금으로 옮긴다.
- **화면 잇기** — 상단 메뉴, 팝업 닫기, 상세검색, 통합검색 탭, CCTV 선택. 시안의 화면끼리만 잇는다.
- **패널 옮기기** — 공지 ↔ Help Desk 는 맞바꾸고 나머지는 4px 격자 자유 이동, `배치 초기화` 로 되돌린다.
- 템플릿 날짜 `May 20, 2026` — 파일 이름 202505 에서, 일은 임의. 에셋 라이브러리 등록은 `src/drawing-assets/_gen/`(README), 분자 라이브러리는 `wemb-atomic`(페이지 19장 · family drawing).
