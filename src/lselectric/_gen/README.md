# LS Electric STATCOM — Figma → 순수 HTML/CSS 재구축

Figma 파일 `KkmCQi05F7eSb3tHO7ZW0Q`(240226-LS-Electric-statcom, page `Dark-시안01`)의 화면 2장을
**순수 HTML/CSS DOM** 으로 다시 지은 것과 그 생성기. 스튜디오 템플릿 이름은
**`Digital Twin: LS Electric STATCOM`** (3D 디지털트윈 · 발전·에너지 · February 26, 2024).

| 화면 | Figma node | 생성물 | 접두어 | 장면 키 |
|---|---|---|---|---|
| Screen/STATCOM Overview | `3:5` | `src/lselectric-statcom.js` · `src/lselectric/statcom.html` | `lsm` | `statcom` |
| Screen/Data Center Overview | `33:748` | `src/lselectric-datacenter.js` · `src/lselectric/datacenter.html` | `lsd` | `datacenter` |

원칙(POSCO · 한진 · HANA 와 같다)
- 글자는 전부 편집 가능한 실제 텍스트(`<p>`, Pretendard CDN · 시계만 원본대로 Tomorrow 로컬 ttf) — STATCOM 118 · Data Center 111개.
- 아이콘·그래픽만 Figma 가 내보낸 개별 파일(`src/lselectric/*.svg|png`, 57장 + 라이트 사본 44장). 손으로 그린 벡터 없음.
- Figma 레이어명을 `id="lsm-<레이어명>"` · `class="lsm-<레이어명>"` · `data-name` 에 보존, 스타일 훅은 노드 id 유일 클래스(`n3_5`).
  레이어명은 SK하이닉스 기준으로 먼저 통일해 두었다(메모리 `lselectric-statcom-figma-layer-naming`).
- **생성물(`src/lselectric-statcom.js` · `-datacenter.js`)은 손으로 고치지 말 것.** conv.js 를 고쳐 다시 돌린다.
  `src/lselectric-live.js` 는 손으로 쓴 파일이다(생성물 아님).

## 파이프라인

POSCO(`src/posco/_gen/`)의 conv.js · light.js · dl.js · dedupe · mk-light-assets 등을 복사한 뒤 patch 로 이 시안에 맞췄다.

```
1) get_design_context(3:5 · 33:748, forceCode) → dc-3-5.txt · dc-33-748.txt
     · 파일로 떨어진 응답: save-dc.js <tool-result> <key>
     · 대화로 온 응답: extract-dc.js <세션.jsonl> <node> <key>   ← 세션 기록에서 원문 그대로 꺼낸다(손으로 옮기지 않는다)
   get_metadata(0:1) → meta-page.xml (페이지 하나에 두 화면 · 글자 상자 고정용)
   get_screenshot(1920) → figma-3-5.png · figma-33-748.png (픽셀 대조 기준)
2) node patch-config.js      화면 목록 · 경로 · 이름(posco → lselectric), posco 전용 장치(GRAFT·VARIANT·NODE_CSS) 비우기
   node patch-classes.js     -rotate-180/-75/-105 · Tomorrow @font-face
   node patch-node-css.js    센서 격자 여백 · 알림 바 그라디언트 테두리(아래 함정 ②③)
3) node splice-right.js      3:5 dc 의 잘린 우측 패널을 따로 받은 33:746 로 갈아 끼운다(함정 ①)
4) node dl.js → node dedupe-assets.js → node mk-light-assets.js
5) node conv.js              → src/lselectric-*.js + 미리보기 html
6) 미리보기 캡처(thumb-*.png) → powershell -File mk-thumb.ps1 → src/templates/lselectric-*.jpg
7) 스튜디오 연결: node patch-studio.js (한 번만 · 이미 있으면 건너뛴다)
```

## 이 파일에서 밟은 함정

① **3:5 의 design context 가 끝에서 잘린 채 파일로 떨어졌다**(101KB, Navigator 의 Rotate Left 중간에서 끊겨 Site Selector ·
   닫는 태그가 없다). conv.js 가 뿌리를 못 찾아 `Cannot read properties of undefined (reading 'tag')` 로 죽는다.
   → 우측 패널(33:746)만 따로 받아(rp-3-5.txt) `splice-right.js` 가 통째로 갈아 끼운다. 받은 쪽 에셋 상수는
   화면 dc 와 이름이 겹쳐도 다른 그림일 수 있어 전부 `imgR…` 로 바꿔 붙인다. 원본은 `dc-3-5.raw.txt` 로 남는다.
   **tail 로 닫는 괄호가 있는지 먼저 볼 것.** 33:748 은 반대로 응답이 대화로 와서 파일이 없었다 → extract-dc.js.
② **센서 상태 2x2 격자** — Figma 가 칸 안 Body · Icon Group 에 '격자 원점 기준' 여백(ml-145 · mt-48)을 그대로 적어 냈다.
   CSS 격자에서는 칸 안에서 한 번 더 먹혀 소화·이상감지가 판 밖(x=338)으로 밀렸다(픽셀차 5.32 → 4.08%).
③ **알림 바 테두리** — 원본 stroke 는 세로 그라디언트(60% 까지 흰색, 아래 #7CCCFF, 급전환)인데 design context 는 흰색으로 뭉갰다.
   use_figma 로 stroke 를 읽어 `border-image` 로 되살렸다.
④ **POSCO 의 라이트 파생표가 이 시안엔 반만 먹었다** — 판 그림(-lt)은 밝아졌는데 그 위 글자가 흰색으로 남고,
   `[data-name=Background] > img` 규칙은 구조가 달라(Background > div > img) 바탕 사진에 안 걸렸다.
   → 라이트는 live 시트에서 **역할별로 다시 적었다**(본문 #16233b · 보조 #4a5a78 · 값 #184aa8 · 짙은 판 위 글자는 흰색 유지).
   Data Center 의 글자 노드 이름이 `Label` 이라 STATCOM 라벨 칩 규칙이 글자에 파란 판을 깔았다 → `Field/ > Label` 로 좁혔다.
⑤ **overflow:hidden 뿌리가 옆으로 스크롤됐다** — 우측 판을 접으면 판이 뿌리 밖으로 나가는데, 그때 초점/scrollIntoView 가
   오면 화면 전체가 322px 밀렸다. 뿌리를 `overflow:clip`(스크롤 상자가 아님)으로.
⑥ 헤드리스 캡처에서는 CSS 애니메이션이 첫 프레임에 멈춘다 — 숫자 '깜빡' 애니메이션이 흰 글자로 굳어 라이트에서 사라져 보였다.
   깜빡임은 글자색을 건드리지 않는 빛(text-shadow)으로만 한다.
⑦ Playwright 의 evaluate(filename) 는 **Playwright 작업 폴더(C:\Users\wemb) 기준**으로 저장한다 — 상대 경로를 쓰면 엉뚱한 곳에 생긴다.

## 검증 (2026-09-18 · Playwright 1920x1080 · `?live=0`)

| 화면 | 픽셀차(tol 24) | 비고 |
|---|---|---|
| STATCOM 3:5 | 4.08% | 차이는 글자·그림 가장자리 안티에일리어싱(mask-3-5.png) |
| Data Center 33:748 | 3.80% | 〃 |

노드 상자: 센서 격자 소화 (192,316) · 도어 (47,364) = Figma 메타데이터 값, 알림 목록 (38,1007,1844x46).
대비(`contrast.js` — 캡처 픽셀에서 글자 상자별 바탕 중앙값으로 잰다): 3:1 미만 — 다크 1(원본 'ON' #33683f/#55b05d, 원본 그대로 둠) · 라이트 0.
반응형: 1920x1080(16:9)에서 늘어난 몫 0 · 1248x852 · 스튜디오 작업영역 1248x952 에서 바탕 여백 `[0,0,0,0]`.

## 인터랙션 · 라이브 (`src/lselectric-live.js`)

- **반응형** — 1920x1080 좌표계 + 균일 배율 S, 남는 폭/높이는 블록에 나눈다: 바탕 사진 = 캔버스 전체(cover) · 헤더 바 · 알림 목록 = 폭까지,
  좌측 판 = 판 바탕 아래로 늘리고 Body 높이를 늘려 위젯 간격이 퍼진다, 우측 판 = 오른쪽 끝 + 위젯이 위치 비율대로 아래로 퍼진다(제목은 짝 위젯과 함께).
  이동은 전부 CSS `translate` 속성(`--ls-tx/ty` 반응형 · `--ls-fx` 접기 · `--ls-mx/my` 패널 이동) — 원본 transform 을 덮지 않는다.
- 실시간 시계(원본 서식 `2026. 09.26` · `TUE` · `09:12:30`), 날씨 '갱신' 시각 = 이번 시 정각.
- **알림 목록** — Btn 누르면 표 높이를 재서 위로 펼치고/접는다(화살표 180° 회전, 장면별 기억). 발생시각은 열 때마다 최근으로
  (원본은 자리표시자 `2026-00--00 00:00:00`), 9~14초마다 맨 아래 줄이 맨 위로 올라오며 '지금'이 찍히고 등급 건수가 오른다.
  등급 칩 호버·고름은 원본 Hover 변형(테두리 #45c5ff + 안쪽 빛) 그대로.
- **좌·우 판 접기**(Fold Button) — 판은 옆으로 빠지고 단추는 가장자리에 남아 화살표가 돈다(장면별 기억).
- 호버·눌림: 헤더 액션 · 접기/검색 · 자산 필터(고름=원본 파란 그라디언트) · 센서 · 상태 배지(빨간 표지는 경보등처럼 숨쉰다) ·
  보기 모드(하나만 켜짐) · 내비(회전 → 나침반 다이얼 회전) · 사이트 선택(다른 화면으로) · 토글(원본 On/Off 두 모습을 서로 옮긴다) · 표 줄.
- 라이브 수치: 전압 154 KV · 전류 250 A · 배터리 128.0V/80A/50.0℃(원본의 `128.` + `0V` 쪼갠 글자 모양 그대로) · 날씨 · 이상감지 건수.
  사람이 고친 글자는 덮지 않는다(`claimed`), 패널편집 중에는 멈춘다.
- **차트 바꾸기(패널편집 중)** — 위젯 9종에 '차트' 단추. 이 프로젝트(변전·STATCOM·전원)에 맞춘 추천 차트 목록(첫 항목=추천) —
  전압·전류 실시간 라인, 변압기 부하율 게이지, 권선 온도 추이, 배터리 SOC 게이지, 셀 전압 막대, 계통 상태 도넛, 모듈 부하율 등.
  원본 팔레트(#4b98ff · #29e2ff · #fcb268 · #55b05d · #f68989)로 그리고 실시간처럼 흐른다. '원본 그대로'로 되돌린다. 장면별 저장.
- **패널 옮기기(패널편집 중)** — 좌측 위젯은 다른 위젯 위에 놓으면 순서가 바뀌고 나머지가 흘러 자리를 잡는다(FLIP),
  우측 위젯·보기 컨트롤은 4px 격자로 자유 이동. 스튜디오 '배치 초기화'가 순서·이동·차트를 되돌린다.
  스튜디오 배치 모드는 click 을 캡처 단계에서 삼키므로 차트 단추는 pointerup 으로 받는다.
- 미리보기 `?edit=1` 로 편집 모습(차트 단추·옮기기)을 스튜디오 없이 볼 수 있다. `?live=0` 이면 라이브를 싣지 않는다(픽셀 대조용).

## 스튜디오 연결

`js/templates/lselectric.js`(LS_SCREENS · applyLsElectricDT · __gotoLsScene · 시드 #2861FF) ·
`studio.html`(모듈 2 + live + 연결 스크립트) · `js/launcher/templates.js`(카드 · 슬라이드 2장) · `js/launcher/home.js`(tplScene `datacenter`) ·
`js/studio/project.js` · `js/core/projects.js` · `js/main.js`(새로고침 복원 · 밝기 `wemb-lselectric-mode`) ·
`js/templates/image.js`(`LSELECTRIC_OPT` — 상태 표지·등급 점·토글 손잡이·로고는 색 유지, 바탕 사진·미니맵은 픽셀 재도색) ·
`js/studio/dt-edit.js`(DTSEL `.lsm-root p, .lsd-root p`). 전부 `patch-studio.js` 로 들어갔다.

## 세 번째 화면 — ACB 진단(1단) (2026-09-21)

| 화면 | Figma node | 생성물 | 접두어 | 장면 키 |
|---|---|---|---|---|
| STATCOM + Popup/ACB - Diagnostics (Stage 1) | `62:1493` (팝업 `76:597`) | `src/lselectric-acb.js` · `src/lselectric/acb.html` | `lsa` (뿌리는 `lsm`) | `acb` |

- 62:1493 은 **STATCOM 화면(3:5) 위에 팝업이 떠 있는 모습**이다. 팝업 밖은 3:5 와 픽셀차 0% → 바탕은 다시 만들지 않고
  팝업(76:597)만 생성해 `build_lsm_acb()` 가 STATCOM 의 `Screen/` 프레임 안에 **DOM 으로** 심는다(33,117 · 1855x846).
  미리보기와 스튜디오가 같은 함수를 쓴다(conv.js `overlay`, patch-overlay.js).
- 순서: `patch-acb.js`(SCREENS·dl.js 합치기) → `node dl.js 76-597`(옛 화면 URL 은 만료라 고른 화면만) → dedupe → mk-light-assets
  → `patch-overlay.js` → `node conv.js` → `patch-studio-acb.js` → mk-thumb.ps1(thumb-acb.png).
- 레이어명은 먼저 SK하이닉스 기준으로 통일해 두었다(메모리 `lselectric-statcom-figma-layer-naming`).

### 밟은 함정
⑧ **겹친 화면의 클래스 충돌** — 익명 클래스 `x63` 이 두 화면에서 뜻이 달라 `.lsm-root .x63` 이 팝업까지 먹었다
   (게이지·센서 사진에 판이 생기고 AC LOAD 글자가 겹침). → SCREENS 에 `layer: 1` (POSCO SOP 와 같은 장치, 7.84 → 5.45%).
⑨ **Figma stroke 정렬은 design context 에 없다** — 단선도 판(65:2105)은 10px **CENTER** 라 5px 씩 밖으로 나가 있었다.
   use_figma 로 정렬·굵기·색을 읽어 `CENTER_STROKE` 표에 적고, 테두리는 투명 + 같은 굵기 outline 을 절반만 안으로(→ 4.70%).
⑩ **PNG 의 gAMA·cHRM** — 브라우저는 적용하고 Figma 렌더는 무시해 바탕 사진이 채널마다 ~8 어두웠다(화면 대부분이라 차이가 부풀었다).
   `strip-gama.js` 로 색 관리 청크만 뗐다(IDAT 무변경). 세 화면 모두 좋아졌다.
⑪ 팝업 제목 바는 반투명 → 팝업 뿌리 배경을 투명으로(OVERLAY_CSS). Figma 단독 렌더(76:597)는 흰 바탕에 합성돼 있어 비교는 62:1493 로 한다.
⑫ 화면용 라이트 규칙이 이름이 같은 팝업 슬롯(Title · Chip · Field/ …)까지 먹는다 → live 시트 끝에 `.lsa-root` 전용 라이트 규칙.
⑬ Figma GROUP 위젯(단선도)은 display:contents 라 옮기기·차트 단추 자리가 없었다(단추가 닫기 위로) → installPopup 이
   부모와 같은 판을 덮는 투명 상자(.ls-grpw)로 세우고 그림 자리에 `.ls-chost` 를 둔다(installCharts 는 `__lsChartHost` 에 붙인다).

### 검증 (Playwright 1920x1080 · `?live=0&t=dark`)
| 화면 | 픽셀차(tol 24) |
|---|---|
| ACB 진단 62:1493 | **3.38%** |
| STATCOM 3:5 | 2.88% (← 4.08, gAMA) |
| Data Center 33:748 | 2.60% (← 3.80) |

대비(가려진 바탕 글자 제외): 3:1 미만 다크 0 · 라이트 0. 반응형: 1088x852 · 2400x1000 바탕 여백 `[0,0,0,0]`, 팝업은 정확히 가운데.
스튜디오: 템플릿 상세 3/3 'ACB 진단' → 스튜디오 열기 → 장면 acb, 패널편집(글자 109 · 차트 7 · 옮기기 7), 배치 초기화, 다크/라이트, 색 정하기.

### 라이브 (installPopup)
닫기(사라진 뒤 STATCOM 장면으로) · 열화상 구간 드롭다운(원본 값 '고압'만) · 표 줄·센서·범례·게이지 호버 ·
게이지/센서/Zone/단선도 수치 흔들림 · **트렌드는 data.svg 를 인라인으로 바꿔 물결 선만 62px 민다**(SVG 안에 viewBox 밖까지
그려진 공통 여유분, 평평한 기준선은 그대로) · 알림 목록은 팝업 위로(z 70) · 요일 상자 폭 풀기(MON 이 시각에 붙던 것).

## 네 · 다섯 번째 화면 — 계통 진단 · 에너지 진단 (2026-09-21)

| 화면 | Figma node | 생성물 | 접두어(층) | 장면 키 |
|---|---|---|---|---|
| Screen/STATCOM Overview - ACB System | `89:2000` (팝업 `76:875`) | `src/lselectric-system.js` · `src/lselectric/system.html` | `lsy` (layer 2) | `system` |
| Screen/STATCOM Overview - ACB Energy | `89:2927` (팝업 `94:5015`) | `src/lselectric-energy.js` · `src/lselectric/energy.html` | `lse` (layer 3) | `energy` |

- 두 화면도 ACB 와 같은 꼴 — 팝업 밖은 62:1493 과 픽셀차 0%, 팝업 자리도 같다(33,117 · 1855x846). 팝업만 생성해 `build_lsm_system()` · `build_lsm_energy()` 가 얹는다.
- 순서: `save-dc.js`(76-875 · 94-5015) → `patch-sys-energy.js` → `node dl.js 76-875 94-5015` → strip-gama → dedupe → mk-light-assets
  → `node conv.js` → `patch-studio-sys-energy.js` → mk-thumb.ps1(thumb-system/energy.png = `?live=0&t=dark` 캡처).
- meta 는 화면 프레임 덤프 `meta-89-2000.xml` · `meta-89-2927.xml`(get_metadata 원문). CENTER stroke 는 use_figma 로 읽어 `CENTER_STROKE` 에 적었다(단선도 판 · 측정 줄 · 범례).
- **겹친 팝업 공통 클래스** — 팝업 뿌리에 `ls-pop`, 자리에 `ls-popmount` 를 단다(conv.js overlay). live.js · lselectric.js 는 이제 `.lsa-root` 대신 이것으로 잡는다.
  `sceneOf` 는 `.lsa-root/.lsy-root/.lse-root` 로 acb/system/energy 를 가른다.

### 밟은 함정
⑭ **반 픽셀 translate** — 계통 · 에너지의 Device Info 는 `top:calc(50%+313.5px)` + `translateY(-50%)`(161px → -80.5px)로 왔다.
   합성 층이 반 픽셀에 그려져 표 줄 테두리가 1px 밀리고 번졌다. 절대배치 + 이동만 있는 노드는 메타 크기로 `margin-top:-h/2` 로 바꾼다(conv.js).
   STATCOM · Data Center 는 값이 정수라 픽셀차 변화 없음(2.89 · 2.60%).
⑮ 라이브 값이 넓어지면(5,851 → 5,838) 글자 상자(메타 폭 고정)를 넘어 단위에 붙었다 → 흔드는 글자는 원본 폭을 min-width 로 두고 width:auto.

### 라이브 (installPopup · installPopCharts)
- 차트 그림(data-*.svg)을 인라인으로 바꿔 **원본 벡터 그대로** 움직인다 — 막대는 하위 경로(사각형)마다 `<rect>` 로 나눠 높이만 바꾸고(바닥 고정, 2.6초),
  곡선은 모든 점에 `A·(sin(kx−ωt+φ) − sin(kx+φ))` 를 더한다(t=0 이면 원본과 같다). 라이트는 `stop[#035B7F]` → `#a0cddf`(= data-2-lt.svg), 색 정하기는 image.js 가 `svg.ls-inl` 에도 hue-rotate.
- 계통 측정표 · 에너지 요약 수치 흔들림(자릿수 · 쉼표 유지), 금일 막대가 금일 값을 따라 늘고 준다.
- 고장 Trip 현황 발생시각 = 열 때마다 최근(4~38분 전). 기간 단추(15분·1시간·1일 / 시간·일별·월별)는 원본 '선택' 그림을 고른 단추로 옮기고 그 판 막대가 다시 자란다.
- 차트 바꾸기 추천: System Readings · Voltage/Current Status · Power Trend · Trip Log · Energy Summary · Daily Peak Load · Rated Load Ratio · Hourly Load Rate · Carbon Emission.

### 검증 (Playwright 1920x1080 · `?live=0&t=dark`)
| 화면 | 픽셀차(tol 24) |
|---|---|
| 계통 진단 89:2000 | **4.66%** |
| 에너지 진단 89:2927 | **5.10%** |
차이는 막대 그라디언트 끝 · 격자선 반 픽셀 · 글자 가장자리. 대비 3:1 미만: 라이트 0(계통 168 · 에너지 209 글자), 다크는 원본 색.
스튜디오: 템플릿 상세 4/5 '계통 진단' · 5/5 '에너지 진단' → 스튜디오 열기(여백 0), 패널편집(글자 168 · 차트 7 · 옮기기 7), 다크/라이트, 색 정하기.
