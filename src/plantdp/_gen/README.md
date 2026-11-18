# 발전소 디지털트윈 방재 — 생성기 (tpl `plantdp`)

스튜디오 템플릿 **Digital Twin: Power Plant Disaster Prevention**. Figma `QVCXpLxrGKG7Id7s9SSszf`(REM 섹션, 익명화 · 가상 데이터 반영본)의 화면 10장을 순수 HTML/CSS DOM 으로 재구축한다.
무선망 통합관리 생성기(`src/wnms/_gen`)를 복사해 `retarget.js` 로 이름 · 키 · 포트를 바꿨다(스마트 산단 것은 `_indpark/` · `README.indpark.md`).

| 장면 | 접두어 | Figma | 카드 라벨 |
|---|---|---|---|
| main(첫 화면) | pdm | 3302:4796 | 종합 방재현황 |
| weather | pdw | 3301:4796 | 기상 상세 분석 |
| seismic | pds | 3300:4796 | 지진계측 상세 파형 |
| event | pde | 3302:5372 | 이벤트 현황 |
| sop-popup | pdp | 3293:5251 | SOP 진행 팝업 |
| building | pdb | 3292:5597 | 건물 캐러셀 |
| floor | pdf | 3287:4796 | 층 캐러셀 |
| sop | pdo | 3293:4796 | SOP 진행 현황 |
| sop-standby | pdy | 3289:5423 | SOP 대기 |
| login | pdl | 3286:4796 | 로그인 |

## 파이프라인 (원본이 **라이트**, 다크는 파생)

1. `save-dc.js` / `extract-dc.js` → `dc-<key>.txt` (메인은 `excludeScreenshot` 로 받아야 100KB 에서 안 잘린다)
2. `mk-meta.js` → `meta-<key>.xml` (get_metadata 가 한 화면만 펼치면 use_figma 압축 덤프)
3. `dl.js` → `strip-gama.js` (에셋 → `src/plantdp/`)
4. `node patch-dark.js`(한 번) · `node fix-dark-mask.js`(한 번) — dark.js 색 대응표 · 층 규칙
5. `node mk-dark-svgs.js` → `*-dk.svg` + `dark-assets.json`
6. `node conv.js` → `src/plantdp-<장면>.js` + 미리보기 `src/plantdp/<장면>.html`
7. `node mk-live.js` → `src/plantdp-live.js` (원본 `live-src.js`, 차트 부품은 공장 템플릿 makeChart 이식)
8. `node patch-studio.js` → 스튜디오 연결(이미 있으면 건너뜀, `js/templates/plantdp.js` 는 newbiz.js 에서 매번 다시 뜸)
9. `powershell -ExecutionPolicy Bypass -File mk-thumb.ps1` → `src/templates/plantdp-*.jpg` (캡처는 `node pw.js cap.js`)
10. 고친 뒤엔 `js/core/tpl-modules.js` 의 `?v=` 를 올린다.

### 필터 패널 변형 8벌(src/plantdp-nav.js)

Figma `Navigation` 세트(layer1 카테고리별 · layer2 건물별 · building · senser · fire · earthquake · weather · cctv)를 조각으로 만든다 — conv SCREENS 의 `frag:` 항목(접두어 pdna~pdnh).
- layer1 · earthquake · weather = 화면 인스턴스(3302:5343 · 3293:5444 · 3292:5621), building · fire = original 페이지 인스턴스(581:26097 · 841:46085).
- senser · cctv · layer2 = 라이브러리 마스터라 design context 가 안 열린다 → original 페이지에 **임시 인스턴스**를 놓고 읽은 뒤 지웠다(파일은 그대로).
- 순서: `extract-dc.js` → `node pre-nav.js`(조건식 JSX · 합집합 타입 · Navigation1 감싸기 풀기) → `node dl.js nav-…` → `node conv.js`.
- live 의 installFilterPanel 이 탭 · 카테고리별/건물별 · 센서 유형(ALL…) · 레일 센서 종류를 누르면 Filter Panel 안에 갈아 끼운다(패널 상자 · 옮긴 자리는 그대로).

검증: `node pw.js ctl-test.js`(진짜 클릭 — 탭 · 센서 · 건물 묶음 · 검색 · 체크 · 기간 · 범례 · 등급 칩 · 위젯 접기 · SOP 고르기 · 로그인), `node pw.js studio-nav.js`(스튜디오에서 화면 잇기 18길), `node pw.js hit-test.js [W H]`(눌러야 할 것의 가운데가 다른 판에 막히는지), `node pw.js audit-ui.js`(눌릴 것처럼 생긴 레이어 중 안 이은 것).

검증 서버 `node serve.js 5570`(WEMB Studio 루트). 점검: `node pw.js cap.js` → `node diff-all.js`, `node pw.js live-test.js W H [장면]`, **`node pw.js studio-check.js`**(열기 → 여백 · 시계 · 펼치기/접기 · 다크/라이트 이어짐 · 색 · 패널편집 글자/차트/옮기기 · 새로고침), `node pw.js studio-sweep.js`(10장면 × 라이트/다크 여백 · 오류).

## 함정

1. **`text-[color:…]`** 를 못 바꿔 글자가 안 보였다 → conv `color:` 접두어 처리.
2. **justify-between + gap** 이 겹쳐 Y축 눈금이 벌어졌다 → space-between 이면 gap 제거.
3. **그라디언트 정지점 순서**가 섞여 CR 칩이 빨간 판이 됐다 → 위치순 정렬(sortGradStops).
4. 크기 다른 span 의 `vertical-align:top` 이 단위를 위첨자로 띄웠다 → 기준선. `{` `}` 공백 span 도 살린다.
5. 이름 없는 에셋 상수(`img`)가 `.svg` 파일이 됐다 → dl.js 가 `asset`.
6. **헤더 시계**: 팝업 안 Header 를 먼저 잡았고 인스턴스 헤더 글자엔 이름이 없다 → 글자 모양(`YYYY-MM-DD DOW`, `HH:MM:SS`)으로 찾는다.
7. **필터 패널**은 인스턴스 % 위치라 판 높이를 바꾸면 겹친다 → 자식 없는 바탕 판만 늘린다. 레일 단추 `__top0` 은 init 때 잰다.
8. 다크 SVG 색 규칙이 **mask 안 경로**까지 바꿔 검은 대각선이 생겼다 → `:not(mask *)`.
9. **이벤트 로그 접기 단추 이름이 장면마다 다르다** — `Button/Expand|Collapse`(event) · `Group 291|292`(floor) · `btn-show|hide`(main · weather · seismic) · 이름 없는 `arrow`(sop-popup · building). live 가 `.pd-foldbtn` 을 붙인다.
10. 캐러셀 `Icon/Arrow` 핸들러가 **event 의 접기 단추 안 Icon/Arrow** 를 잡아 클릭을 삼켰다(stopPropagation) → Event Log 안은 제외.
11. 접기 화살표 글리프는 요소 상자보다 19px 위에 그려진다(뒤집힌 아이콘) — 테스트는 상자 가운데가 아니라 `img` 를 누른다(상자 가운데는 표 머리줄).
12. 남회색 글리프 `#303A46`(채도 0.19)이 무채색 기준(0.16)을 넘어 다크 사본이 안 생겨 다크에서 묻혔다 → 짙은 선은 0.22 까지.
13. 스튜디오 다크 캡처를 축소해 보면 밝아 보인다 — 판단은 픽셀 샘플로(System.Drawing GetPixel).
14. **투명한 묶음 판이 단추를 덮었다**(Tooltip Group Wrap → 레일 SOP, Event Log 칸 → 레일 아래 단추, Carousel Arrows → 층 선택, Tooltip Group → SOP 단추). 1920 검증은 장면 함수로 이동해서 못 봤다 → live `passThrough`: 그리는 것 없는 판 = none.
15. pointer-events 는 **물려받는다** — 묶음 판만 none 이면 안쪽 단추도 꺼진다. 모든 요소에 값을 직접(none/auto). 원래 none 인 것을 적을 때는 뿌리를 잠시 auto 로(바깥 none 을 물려받은 것까지 '원래 none'으로 잡아 조각 전체가 안 눌렸다). 옮기는 판(.pd-mv)도 투명하면 넘긴다.
16. 조각의 그림 클래스(x12 …)가 화면의 같은 이름 규칙과 겹쳐 아이콘이 흰 네모가 됐다 → 조각은 `x<접두어>_12`(class 속성 · CSS 선택자만).
17. 이벤트 현황의 등급 칩은 `display:contents` — 선택 · 흐림 모양은 자식에 준다.
18. 활성 탭의 흰 글리프(broadcast)가 다크 사본에서 검게 바뀌어 사라졌다 → mk-dark-svgs: 32px 이하 흰색뿐인 아이콘은 그대로. 탭 호버는 바탕색 대신 덮개(그라디언트) — 바탕색을 바꾸면 활성 탭 색까지 지운다.
19. 건물 목록(block2)은 grid 겹쳐 쌓기라 숨기면 구멍 — 검색은 흐리게, 센서 목록(flex)은 접는다. 기간 단추는 같은 크기 flex 라 Figma 스타일 클래스(n…)를 맞바꿔 선택 모양을 옮긴다.
20. Figma 에 프로토타입 연결은 없다(reactions 0) — 화면 잇기는 화면 내용으로 정했다(아래).
22. 이벤트 현황 접기 — 내려갈 거리를 180 으로 못 박아 접힌 머리 줄이 다른 화면 막대보다 한참 위에 서고 그 밑에 빈 흰 판이 드러났다(사용자 지적 "접고 열면 에러"). 거리 = 로그 높이 − 표 위까지(slideOf), 화면 크기가 바뀌면 다시 잰다. 검증 `node pw.js fold-test.js [W H]`(제목 아래 여백이 main 막대와 같아야 한다: 1920 → 8 vs 10, 1024 → 5 vs 6).
23. 이벤트 표 글자 정렬(사용자 지적) — 줄 칸 글자는 원래 글자 길이로 잡힌 고정 폭 · 왼쪽 정렬 상자라 가상 데이터로 바꾼 뒤 칸마다 어긋났다. live installAlign 이 칸마다 머리 칸(등급 · 발생시간 · 설비명 · 설비타입 · 메시지) 가운데에 맞춘다(발생시간은 날짜 + 시각 묶음, 등급 구슬은 이름 없는 그림도). 반응형이 준 가로 몫(__fx)을 덮지 않게 __sx + place() 로 얹고, 글자가 바뀌면(새 이벤트 · 편집 · 크기 변경 · 등급 거름) MutationObserver 로 다시 잰다.
    **함정: 상자가 아니라 글자를 잰다(Range).** 처음엔 p 상자 가운데로 맞추고 같은 상자로 검증해 '0px' 로 끝냈는데, 상자가 고정 폭 · 왼쪽 정렬이라 눈에는 짧은 글자는 왼쪽, 긴 글자는 오른쪽으로 비껴 보였다(사용자가 두 번 지적). 머리 칸도 재는 동안 transition 을 꺼 최종 자리에서 잰다.
    **함정 2: 화면이 16:9 보다 넓으면(이벤트 막대가 옆으로 늘어남) 줄 칸은 비율로 늘어나고 머리 칸은 Figma 고정 폭이라 줄 구분선이 머리 구분선보다 오른쪽으로 밀렸다**(1920x820 에서 158.5 → 176.6 · 사용자가 세 번째로 지적, 내 1920x1080 검증엔 안 보였다). → 머리 구분선을 줄 구분선 자리로 옮기고(구분선 = 가는 판 + 안쪽 가는 그림, **바깥 판만** 옮긴다 · 머리 줄 높이에 있는 것만 — 건물 화면은 조상이 줄까지 품는다), 칸 가운데도 같은 비율로 옮긴다. 양쪽에 구분선이 있는 칸은 두 선의 한가운데.
    검증은 `align-verify.js`(16:9 · 1920x820 · 2560x1080 · 1600x900 · 1366x768 · 1024x768 · 1280x1024 × 이벤트 · 건물: 구분선 일치 · 글자 = 머리 · 칸 한가운데 — 모두 0~0.1px)를 꼭 돌릴 것.
    검증 `align-repro.js`(5570 · 5510, 5가지 크기 · 크기 바꾼 직후/1.5초 뒤, 글자 기준 최대 차이) · `probe-elog2.js [W H]`(4화면 글자 기준 0) · `align-shot.js W H`(머리 칸 가운데 기준선 그림).
24. **다크 바탕 그림(사용자 지적 "너무 밝다, 건물은 많이 건들지 말고")** — 바탕은 건물과 따로인 두 장(낮 하늘 screen-main-2 · 흰 바탕 시안 격자 screen-main-1)과 로그인 사진(background)이다(3D 섬 · 건물은 투명 PNG).
    `node pw.js mk-night.js` 가 원본에서 캔버스로 밤 사본(-dk)을 만든다 → `_gen` 에 저장 → `cp *-dk.* ..` → dark.js 가 다크에서만 content:url 로 갈아 끼운다(라이트 · 색 정하기 영향 없음, keep 정규식에 걸림).
    밤하늘(구름은 은은하게 — 진하면 붓자국), 격자는 투명 바탕에 시안 선 · 점만(위쪽 둥근 빛은 뺀다), 로그인은 하늘만 밤 + 땅 · 건물은 저녁 톤. 3D 섬 · 건물 그림은 다크 누름을 줄였다(.74/.62 → .9/.86).
    **함정: 격자는 Figma 가 mix-blend-mode:darken 으로 얹는다 — 밤하늘에선 남색이 이겨 빛이 사라진다 → 다크는 screen, 불투명도 .2(라이트와 같은 은은함).**
25. **여러 줄 글자 상자의 줄 간격(사용자 지적 "단계 진행이 어긋났다")** — conv 는 높이 48px 이하 글자 상자의 line-height 를 상자 높이로 바꾼다(한 줄 글자 세로 맞춤).
    SOP 단계 카드 설명(상자 40px · 줄 간격 20px, 두 줄)까지 40px 가 돼 둘째 줄이 아래 '완료 · 진행중' 칸으로 내려가 겹쳤다.
    → 원래 px 줄 간격의 1.8배 이상 높은 상자는 여러 줄로 보고 줄 간격을 지킨다. 바뀐 규칙은 sop 의 4곳뿐이었다(다른 화면 0).
26. **SOP 진행 연출(사용자 "좀 더 동적으로, 진행중인 상황이 잘 보이게")** — live `installSop`. 원본 색 · 자리는 두고 `.pd-fx` 층(pointer-events:none)만 얹는다.
    진행 중 단계 카드: 빛 테두리 · 흐르는 빛 · 작업 진행 띠(n/m) · '진행중' 앞 깜빡이는 점. 대기 단계는 옅게(호버 시 원래대로), 진행 중 카드 앞 화살표만 움직인다.
    진행률 칸: 초록 칸이 차례로 켜지고 물결 · 다음 칸 깜빡임, 값은 0 에서 차오른다(값 · % 는 크기 다른 span — writeValue 로 값만).
    진행 중 작업 줄(Task (Active) · 재생 아이콘 · '경과'+완료 단추 줄): 왼쪽 띠 + 숨 쉬는 바탕. '경과' · '진행중' 알약은 퍼지는 고리(알약 테두리가 box-shadow · 이름 Badge… 라 바탕색만 보면 못 찾는다).
    SOP 팝업 · 실행 이력의 진행 중 Stage/n 은 빛 테두리, 단계별 작업 항목 표는 묶음 상자가 스크롤 가림막보다 길어 테두리를 뺐다. prefers-reduced-motion 이면 모두 멈춘다.
21. **툴팁(Tooltip/*)은 시안에 펼쳐 그려 둔 말풍선** — 평소 숨기고 짝 단추 호버 때만 보인다(사용자 지시, installTooltips). 짝은 이름 끝(Tooltip/SOP Status ↔ Button/SOP Status), 안 맞으면 안쪽 알약과 단추의 거리로 **전체에서 가까운 짝부터**(SOP 화면 단추 이름이 fire · earthquake · ALL 로 엉켜 있다: fire = 메뉴얼, earthquake = 문자 발송, ALL = SOP 시작). 패널편집 중엔 모두 보이고 글자를 고칠 수 있다. 검증: `node pw.js tip-test.js` · `studio-tip.js`.

## 화면 잇기(정한 것)

레일 SOP 현황 → sop · 종합재난현황 → main · 이벤트현황 → event(펼쳐짐) / 이름표도 같은 곳 · 헤더 로고 → main · 경보 띠 → event · 상세보기 → weather/seismic · 닫기/Dim → main · 이벤트 줄 SOP → sop-popup · 등급 칩(접힌 화면) → event 에서 그 등급만 · SOP 목록 진행중 → sop, 대기 → sop-standby · 필터 건물 목록 → building(고른 건물 이름) → 건물 이름표 → floor → 건물 목록으로 → building → 전경뷰로 → main · 로그아웃 → login → SIGN UP/Enter → main.

## 시안에 없어서 정한 것

- 헤더 로고 교체(TPLLOGO DOM_CUSTOM): 헤더 안 `logo chip` 의 부모 묶음(`:has(> [data-name="logo chip"])`) · 로그인 `Brand > Logo`.
- 색 정하기: 주조색 #2A74F4(218°). 그대로 둘 것 = `stage-*` · `screen-*` · `background` · `fire-marker` · `vector-2` · `divider-1` · `ellipse*`(등급 구슬) · `disability*`.
- 이벤트 최근 시각: 맨 위 줄 = 25~50초 전, 줄 간격은 원본 유지, 45~75초마다 새 이벤트(EV_POOL). sop · event 의 06~23시 시각은 원본 기준 시각(14:32:08)에서 지금으로 옮긴다.
- 추천 차트(specsFor): 기상 · 지진 가속도 · 자유장 · 온도 · 습도 · 기압 · 풍속 · 강풍 · 풍향 · 단계 진행 · 실행 이력 · 이벤트 로그.
- 회의 모드 가림 이름: 한국서부발전 · 서부발전 · KOWEPO · kowepo · 구미 천연가스.
