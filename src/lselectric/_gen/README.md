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

## 여섯 ~ 열 번째 화면 — 단독 팝업 다섯 장 (2026-10-02)

Figma 페이지 y=2324 줄에 **화면 프레임 없이** 놓인 팝업 다섯 장(popup-3 ~ 7). 레이어명은 먼저 62:1493 기준으로 통일했다
(메모리 `lselectric-statcom-figma-layer-naming` '단독 팝업 popup-3~7'). 놓을 자리는 원본에 없어 ACB 와 같은 규칙 —
STATCOM(3:5) 위 **1920x1080 한가운데**(보이는 상자 기준 · 정수 픽셀)에 얹는다.

| 화면 | Figma node | 생성물 | 접두어(층) | 장면 키 | 자리 |
|---|---|---|---|---|---|
| Popup/Transformer - Status (상태정보) | `118:568` | `src/lselectric-transformer.js` · `transformer.html` | `lst` (4) | `transformer` | 145,282 · 1630x516 |
| Popup/AC Power Room - Electrical Readings | `124:1703` | `src/lselectric-acroom.js` · `acroom.html` | `lsp` (5) | `acroom` | 809,446 · 302x187 |
| Popup/Charger Battery - Status | `124:1942` | `src/lselectric-charger.js` · `charger.html` | `lsb` (6) | `charger` | 539,402 · 842x276 |
| Popup/Cooling System - Status | `124:3340` | `src/lselectric-cooling.js` · `cooling.html` | `lsc` (7) | `cooling` | 205,198 · 1509x684 |
| Popup/Rooms - Alarm | `138:1433` | `src/lselectric-alarm.js` · `alarm.html` | `lsr` (8) | `alarm` | 755,381 · 410x276(바탕 판 318) |

- 순서: get_design_context(forceCode) · get_metadata 는 응답이 대화로 와서 **세션 jsonl 에서 꺼낸다** —
  `extract-dc.js <jsonl> <node> <key>` · `extract-meta.js <jsonl> <node> <key>`(새로 만듦, meta-<key>.xml) →
  `patch-popups.js` → `node dl.js 118-568 124-1703 124-1942 124-3340 138-1433` → strip-gama → dedupe → mk-light-assets → `node conv.js`
  → `patch-studio-popups.js` → 캡처(thumb-<장면>.png, `?live=0&t=dark`) → `mk-thumb-popups.ps1`.
- 픽셀 대조는 Figma 단독 렌더가 **흰 바탕 합성**이라, 미리보기에서 팝업 밖을 감추고 흰 바탕으로 찍어(dom-<key>.png) figma-<key>.png 와 견준다.
  눈으로 볼 땐 `pair.js`(같은 자리를 위아래로 붙여 확대).

### 밟은 함정
⑯ **design context 가 그라디언트 선을 단색으로 뭉갰다** — 라벨 칩(124:1922 · 124:1931 오른쪽 #5468C0 → 왼쪽 투명),
   표 · 목록 판(137:1081 · 137:1218 · 138:1265 = #4F5880 위에 #9AD8FF 1→0 이 왼쪽 위에서 번짐)을 `#5468c0` · `#9ad8ff` 한 색으로 냈다.
   use_figma 로 stroke 두 겹 · gradientTransform 을 읽어 `patch-popups.js` 의 `cssGrad()` 가 각도 · 정지점을 **계산**하고
   (CSS 그라디언트 0%/100% 선이 모서리를 지나므로 정지점 = (u − u_min)/(u_max − u_min)), 테두리는 투명으로 둔 채 같은 두께 링을 ::after + mask 로 그린다
   (둥근 칩 모서리를 따라간다). conv.js 의 새 표 `SCREEN_CSS`.
⑰ **점선 dash [2,3]** — PUMP 머리칸 구분선. CSS dashed 는 길이가 달라 배경 무늬(2px 칠 · 5px 주기)로 그렸다.
⑱ `border-5`(바탕 판 5px 안쪽 테두리) 번역이 없어 UNKNOWN 이 났다 → conv.js 에 더함.
⑲ **바탕 사진 판이 반 화면 밀려 있었다(이 시안 전체, 09-21 부터)** — ⑭ 의 margin 변환이 바탕 판(left/top 50% + translate(-50%))에도 걸려
   margin -960/-540 이 붙었는데, live 의 installFit 은 left/top 만 0 으로 붙여 사진이 왼쪽 위로 반 화면 밀렸다(스튜디오에서 오른쪽 · 아래 절반이 비어 보임).
   installFit 이 margin 도 0 으로. 미리보기 `?live=0` 은 원래 자리라 픽셀 대조로는 안 잡혔다 — **라이브 켠 화면도 꼭 본다.**
⑳ 같은 이름의 위젯이 바탕 화면과 팝업에 하나씩 있다(Electrical Readings · Charger Battery) — 바탕 화면 라이브가 팝업 글자를 잡고(`one()` 은 첫 것),
   차트 단추 · 옮기기 기억이 하나로 섞였다. measureP 는 팝업 밖만, 차트는 같은 이름 둘째부터 키에 `#2`, 옮기기는 `이름@pop`.
㉑ 팝업 라이트 규칙 '`.ls-pop [Field/] Value` 는 짙은 남색' 이 뜻 있는 값 색(알림발생 빨강 · 안전 하늘 · 질소탱크 빨강)까지 지웠다 → 팝업별로 짙은 짝을 되돌렸다.
㉒ dedupe 가 `card-bg-3-2.svg` 를 새 `card-bg-8.svg`(같은 그림)로 합쳐 지웠다 — 원자 라이브러리(wemb-atomic) 소스 사본이 옛 이름을 가리켜 **파일은 되살려 둔다**(참조는 새 이름).

### 라이브 (installSoloPopup · installPopCharts)
- **냉각팬** — 원본 팬 그림을 인라인으로 바꿔 날개(`Blades`)만 Housing 중심으로 돌린다. 동작 1.6초 · 과부하 0.7초/바퀴 + 주황 빛 · 고장 = 멈춘 채 빨간 빛 · 중지 = 멈춤.
  라이트는 -lt 사본(라이트 시트에 적힌 것만 받는다 — 없는 파일 404 를 안 낸다)으로 다시 그리고 테마가 바뀌면 따라간다(MutationObserver).
- **트렌드** — 상태정보는 Plot 통째 그림(격자 · 기준선 · 선)을 인라인으로 받아 `Line/…` 만 흐르게 한다(격자 · 점선 기준선 고정, 선은 그림 상자 밖으로 안 나간다).
  냉각설비 입력 · 전도도는 Data 그림.
- 절연유 레벨 채움이 바닥을 붙인 채 오르내림 · 펌프 운전 표지 초록 빛 · 알림 난 실 값 글자 빛(색은 그대로) ·
  수치 흔들림(AC전원실 전압/전류 · 모듈 전압/전류/온도 — 배터리는 원본 '128.' + '0V' 모양 유지 · 냉각설비 온도/압력/습도/유량/레벨, 0 · 날짜 · 글자 상태는 그대로).
- 호버: 파란 닫기 단추(빛 + X 회전) · 표 줄 · 펌프 칸 · 그룹 말풍선 · 모듈 카드(들림) · 팬(확대) · 범례.
- 차트 바꾸기 추천: Oil Temperature Trend · Cooling Fan Status(팬 상태 구성 — 원본 범례색) · Oil Temperature Level · System Overview · PLC Status ·
  Input/Conductivity Trend · Pump Status · Temp Humidity · Ion Tank · Nitrogen Tank · Room Alarm Status (Voltage Trend · Electrical Readings · Charger Battery 는 기존 목록).
- 색 정하기: 팬(fan-*) · Plot(기준선 색 = 범례) · 펌프 표지는 색을 지킨다(image.js keep).

### 검증 (2026-10-02 · Playwright 1920x1080)
| 화면 | 픽셀차(tol 24, 흰 바탕 단독) |
|---|---|
| 상태정보 118:568 | 4.03% |
| AC전원실 124:1703 | 5.95% |
| 충전기/배터리 124:1942 | 4.54% |
| 냉각설비 124:3340 | 4.78% |
| 알림 138:1433 | 2.99% |
차이는 거의 전부 글자 가장자리(헤드리스 캡처의 서브픽셀 색 번짐) — pair.js 로 자리 · 크기 일치를 눈으로 확인.
대비 3:1 미만: 다섯 장 206 글자 × 다크/라이트 **0**. 스튜디오: 템플릿 상세 10장 → '상태정보' 스튜디오 열기 → 장면 transformer,
열 장면 모두 바탕 · 뿌리 여백 `[0,0,0,0]`, 팝업 정확히 가운데, 패널편집(팝업 글자 7~114 전부 편집 · 차트 단추 · 옮기기 4px 격자 저장), 다크/라이트, 색 정하기.
열기 시간은 새 모듈 다섯을 뺀 것과 같다(캐시 끈 검증 서버에서 둘 다 2.3~2.6초 — 이 수치 자체는 1.5초 규칙을 넘는다, 기존 상태).
→ 같은 날 아래 '여는 시간' 절에서 고쳤다.

## 페이지 연결 · 팝업 열기 (2026-10-02, live `installPopupLinks`)

- **페이지끼리** — 사이트 선택(STATCOM ↔ Data Center) · 헤더 홈 아이콘(→ STATCOM) · 팝업 페이지의 닫기(→ STATCOM)는 프로젝트의 형제 페이지로 간다(기존 `__gotoLsScene`).
- **팝업** — 지금 보고 있는 페이지 위에 그 자리에서 겹쳐 띄운다(`.ls-overlay`, 페이지 이동 없음 · 바탕은 지금 페이지 · 닫으면 그대로 · Esc 로도 닫힘).
  마크업 · 시트는 생성기 모듈(`window.build_<px>` · `<PX>_CSS`)을 그대로 쓰고, 처음 열 때 시트를 `<px>-style` id 로 붙인 뒤 색 바꾸기를 다시 건다.
  반응형 자리는 installFit 의 블록 목록에 더해 한가운데. 팝업 페이지에서 다른 팝업을 열면 그 페이지의 팝업은 잠시 걷혔다가 닫으면 돌아온다.
  패널편집을 켜면 겹친 팝업은 닫힌다(편집 기록은 글자 id 로 페이지마다 저장되므로 — 팝업 글자 편집은 그 팝업의 페이지에서).
  모듈이 없는 낱장 미리보기에서는 그 팝업의 미리보기 페이지(`./<장면>.html`)로 넘어간다.
- **여는 자리**
  | 팝업 | 여는 자리 | 근거 |
  |---|---|---|
  | 충전기/배터리 운영상태 | Data Center `Widget/Charger Battery` | 위젯 제목 '충전기 / 배터리 운영상태' = 팝업 제목, 같은 모듈 카드 |
  | AC전원실 전압/전류 | STATCOM `Widget/Electrical Readings` | 같은 측정 카드(Metric/Voltage · Current) · 같은 값(154 KV · 250 A) |
  | ACB 진단 · 계통 진단 · 에너지 진단 · 상태정보 · 냉각설비 상태 정보 · 알림 | 헤더 Brand 옆 '팝업' 단추 목록 | 시안에 여는 자리가 없다 — Figma 제목 그대로(줄이지 않음) |
- '팝업' 단추는 이 화면의 다른 메뉴(차트 바꾸기 · 열화상 구간)와 같은 판으로 그렸다(짙은 남색 · #2E61F9 선 · 호버 #45C5FF), 아이콘은 Figma 의
  `Icon/Popup/Diagnostics` · `Icon/Action/Expand` 그대로. 라이트 짝 · 색 정하기(라이브 시트라 같이 칠해진다) · 키보드(Enter/Space · Esc · 초점 테두리).
  템플릿 썸네일(`?live=0`)에는 없다 — 원본 시안 그대로.

## 여는 시간 (2026-10-02 — 페이지 이동 1.5초 규칙)

- **원인** — `studio.html` 이 다섯 템플릿의 화면 모듈을 전부 `<script>` 로 실었다(115개 중 60여 개, 약 17MB). LS 화면 하나를 여는데도
  HANA(9MB) · POSCO · 한진 · SK하이닉스 화면까지 받아 파싱했다. 같은 조건 번갈아 재기(중앙값) LS STATCOM 1.61초 → 1.06초,
  SK하이닉스 1.40 → 1.01, POSCO SOP 2.06 → 1.53.
- **고친 것** — `js/core/tpl-modules.js`(새 파일)가 본문의 그 자리에서 **여는 화면의 모듈만** `document.write` 로 싣는다.
  HANA · POSCO · 한진은 장면마다, LS · SK하이닉스 · Icheon main 은 템플릿 통째로(LS 는 헤더 '팝업' 단추가 다른 장면 팝업을 그 자리에서 띄운다).
  나머지는 필요할 때 — 화면 얹는 함수(`applyXxxDT`)는 `WEMB.tplModules.wait`, 에셋 라이브러리 썸네일 · '원자 변경' 창 썸네일은
  `later`(페이지 로드 뒤), '원자 변경'에 저장된 교체는 `need`(막이 걷히기 전). **모듈을 더하거나 `?v=` 를 올릴 때는 `studio.html` 이 아니라
  `tpl-modules.js` 의 표를 고친다** — 예전 `patch-studio*.js` 는 studio.html 에 `<script>` 를 넣으므로 다시 돌리지 말 것.
- **에셋 라이브러리** — 접혀 있으면(display:none) 썸네일을 그리지 않는다(예전엔 부팅마다 한진 · HANA 화면을 통째로 만들어 그림까지 받았다).
  보이는지는 ResizeObserver 가 알려 준 크기로 판단(getClientRects 로 물으면 부팅 중 레이아웃을 한 번 더 돌린다).
- **막 상한** — `js/shell/routes.js` 의 '로드가 늦어도 걷는' 상한을 2.5초 → 문서 시작부터 1.4초.
- **라이브 레이아웃 몰아 읽기** — 읽기(offsetTop · getComputedStyle · getBBox · offsetWidth)와 쓰기를 번갈아 하던 반복문 넷을
  '다 읽고 → 다 쓰기'로(installFit 블록 표시 · installCharts 단추 · 삼상전압 트렌드 물결 선 · 수치 폭 묶기). ACB 진단 화면 얹기 0.44 → 0.11초.
  POSCO `markHot` 도 같은 식으로(src/posco-live.js).
- **재는 법** — Playwright 의 `locator.click()` 은 버튼이 멈출 때까지 기다려 2초가 덧붙는다 → `element.click()` 을 직접 부르고 그 시각부터 잰다.
  막 감시는 문서 시작부터(DOMContentLoaded 뒤에 붙이면 부하 때 놓친다). 저장소가 빈 새 컨텍스트에서 잰다(테스트로 쌓인 화면 수천 개 · 오래 돈
  자동화 브라우저는 느려진다). PC 에 다른 무거운 작업(Premiere 등)이 돌면 전부 2~3배로 부푼다 — 같은 조건 번갈아 재기로만 비교.
- **결과**(빈 저장소 · 클릭 → 막 걷힘, 3회 중앙값) — LS STATCOM 0.91 · Data Center 0.91 · 계통 진단 1.03 · 상태정보 1.11 · ACB 진단 1.20
  (다시 열기 1.62) · POSCO 메인 0.92 · SOP 1.53(다시 열기 1.49) · HANA 1.16 · SK하이닉스 0.91 · 한진 1.22 · Icheon main 1.08초.
  ACB 진단 · POSCO SOP 는 화면 두 장을 겹쳐 그리는 첫 렌더(스타일 · 레이아웃 · 글자 모양)가 대부분이라 1.5초 언저리에 남아 있다.
