# 스마트팩토리 에너지관리 디지털트윈 — 생성기 (tpl `fems`)

스튜디오 템플릿 **Digital Twin: Smart Factory Energy Management**. Figma `FwLj96v9IlQSHRPURiJouD`(REM 섹션, 익명화 · 가상 데이터 반영본, 가상 사업장 '누리 스마트팩토리')의 화면을 순수 HTML/CSS DOM 으로 재구축한다.
복합화력 생성기(`src/ccpp/_gen`)를 복사해 `retarget.js` 로 이름 · 키 · 포트(5580)를 바꿨고, 라이브(`live-src.js`)는 이 화면에 맞게 새로 썼다.

| 장면 | 접두어 | Figma | 카드 라벨 | 얹는 자리(종합 현황 위, left · top · w · h) |
|---|---|---|---|---|
| main(첫 화면) | fmm | 2141:505 | 종합 현황 | — |
| diagram | fmd | 2142:296 | 계통도 | 10 · 5 · 1900 · 1070 |
| event | fme | 2143:549 | 이벤트 브라우저 | 305 · 310 · 1310 · 460 |
| solar | fms | 2144:543 | 태양광 PV | 251 · 317 · 1417 · 445 |
| equipment | fmq | 2144:1312 | 장비 상세 | 420 · 137 · 1080 · 805 |

조각(src/fems-frags.js, window.FM_FRAGS): 펼친 이벤트 로그 = 2141:967 (접두어 fmx). 접힌 바의 Expand 를 누르면 Event Log 안에 끼워 아래에서 펼친다.

## 구조의 핵심 — 팝업은 종합 현황 위에 얹힌 화면
* 팝업 4장은 Figma 에서 종합 현황 캡처 위에 떠 있는 화면이다. 그래서 **장면 뿌리는 언제나 `.fmm-root`**, 팝업은 그 안 `.sh-popmount > .fm?-root.sh-pop` 로 들어간다(`build_fmm_<장면>`, 팝업 모듈이 바탕 빌더 `build_fmm` 를 부른다).
* 그래서 tpl-modules 는 장면을 나누지 않고 다섯 모듈을 다 싣는다(합쳐 약 0.7MB). `js/templates/fems.js` 의 `FM_SCREENS[*].sheets` 가 바탕 시트 + 팝업 시트를 함께 꽂는다.
* 겹친 화면의 클래스 충돌 — 팝업 · 조각의 `x12` · `n123_45` 클래스는 `<접두어>_` 를 붙였다(conv.js 스코핑). 안 붙이면 바탕 규칙이 팝업으로 새서 글자가 겹치고 기호가 커졌다.
* 테마 — 스튜디오는 바깥 뿌리 data-theme 만 바꾼다. 라이브가 안쪽 `.sh-pop` 과 펼친 로그도 따라가게 한다(MutationObserver).

## 파이프라인 (원본이 **라이트**, 다크는 파생)

1. get_design_context(excludeScreenshot · forceCode) · use_figma 상자 덤프(`@@meta <key> A`) · 인스턴스 자식 이름(`@@kids {…}`) → `node save-dc.js <세션 id>` · `node extract-kids.js <세션 id>` → `dc-<key>.txt` · `meta-<key>.xml` · `kids.json`
2. `node dl.js [키…]` → `node strip-gama.js` (에셋 → `src/fems/`)
3. 다크 그림 사본
   * `node mk-dark-svgs.js` → `*-dk.svg` + `dark-assets.json` (원래 어두운 다이얼 · 링 · 접기 화살표는 뺀다, `<mask>` 안 흰색은 건드리지 않는다, 아주 옅은 틴트 #F8FEFF 는 흰 판으로 본다)
   * PNG(바탕 보케 · 옆 판 유리 · 팝업 머리 유리) → `mk-dark-png.ps1 <원본> <사본> bg2|glass` → `base-dk.png` · `panel-body(-1)-dk.png` · `base-2-dk.png` · `background-glow-dk.png`
   * 3D 장면 → `mk-dark-scene.ps1 <3-dscene> <base> <출력> 305 183 <k>` — k=1 → `3-dscene-a.png`(라이트, 하늘만 투명), k=0.86 → `3-dscene-dk.png`
   * **GDI+ 는 한글 경로에 저장을 못 한다** — 임시 폴더에 복사해 돌리고 결과를 `src/fems/` 로 옮긴다.
4. `node conv.js` → `src/fems-<장면>.js` · `src/fems-frags.js` · 미리보기 `src/fems/<장면>.html`
5. `node mk-live.js` → `src/fems-live.js` (차트 부품은 src/plant-live.js makeChart 이식, pf- → fe-, 색상각 203°, 좁은 칸 시간 축은 2~3개 · 시:분)
6. `node patch-studio.js` → 스튜디오 연결(이미 있으면 건너뜀, `js/templates/fems.js` 는 ccpp.js 에서 매번 다시 뜸)
7. `node pw.js cap-thumb.js` → `src/templates/fems-*.jpg` (Playwright jpeg q82 — PowerShell 로는 한글 경로 저장 실패)
8. 고친 뒤엔 `js/core/tpl-modules.js` 의 `?v=` 를 올린다.

검증 서버 `node serve.js 5580`(WEMB Studio 루트). 점검:
* `node pw.js cap.js [dark]` → `node diff-all.js` (정적 대조, 종합 현황 2.22% — 대부분 글꼴 래스터 차이)
* `node pw.js ctl-fe.js [dark]` — 진짜 클릭 + 가린 판 검사(펼침 · 칩 · 접기 · 줌 · 회전 · 판 접기 · 홈 · 화면비 3종 · 장비 닫기)
* `node pw.js studio-check.js` — 스튜디오 열기 → 여백 0 · 판 접기 · 호버 · 계통도 이동/닫기 · 로그 펼침/칩 · 3D 라벨 → 장비 상세 · 다크 · 색 정하기 · 패널편집 글자/차트/옮기기 · 새로고침 · 배치 초기화

## 함정
1. **Figma 자체가 글자를 잘랐다** — 행 마스터 Td/Type · Td/Message 폭이 좁아 '인버터' · 긴 메시지가 Figma 렌더에서도 잘렸다. Figma 앱 개발 플러그인(글자 폭 조정 기능)으로 마스터 폭을 60 · 240 으로 넓히고 2141:967 을 다시 받았다.
2. **가로 SPST 스위치** — 인스턴스 90° 회전이 design context 에서 빠진다 → conv NODE_CSS 에서 Glyph 를 돌린다.
3. **이름 없는 인스턴스** — design context 가 data-name 을 안 준다(master id 만). `realNames` 가 '<이름> Wrap' 부모 · kids.json 순서로 채운다.
4. **펼친 로그 위치** — `.fmx-root{inset:0}` 기본 규칙 때문에 화면 아래로 열렸다 → `.fe-evx` 에 `top:auto!important;bottom:0!important`.
5. **등급 칩 필터 짝** — '… Wrap' 프레임도 `Badge/` 로 시작해 짝이 밀렸다 → `:not([data-name$=" Wrap"])`.
6. **3D 라벨** — 3D JPG 에 옛 라벨이 구워져 있고 가상 라벨이 위를 덮는다. 회전할 때 덮개를 숨기면 옛 라벨이 드러난다 → 덮개도 장면과 같이 돌린다(숨기지 않는다).
7. **3D 장면 이음매** — JPG 에 하늘이 구워져 화면비가 바뀌면 사각형이 보였다 → 하늘을 투명하게 뺀 사본을 늘 쓴다(1920 에선 픽셀 동일).
8. **조각 CSS 경로** — fems-frags.js 의 CSS 는 'src/fems/' 로 풀려 미리보기(/src/fems/)에서 두 번 붙었다 → 라이브가 `cssRaw` 를 페이지 기준 경로로 푼다.
9. **다크 확인 단추** — 파란 알약(Hover 변형)만 글자를 짙게. 기본 Button/Ack 까지 짙게 하면 어두운 알약 위에서 사라진다.

## 원본에 없던 것 — 사용자 요청으로 더함(11-19)
* **실시간 시계** — 헤더 오른쪽 아이콘 묶음(Header > Button Group: 사용자 · 로그아웃) 오른쪽 26px — 자리가 모자라 묶음을 왼쪽으로 밀어 시계 오른끝을 헤더 여백 30px 에 맞춘다(fitClock, __sx). 원본 상단 알약 단추(#eff8ff · 둥근 20 · 높이 30 · 12px 500 #3f4052)와 같은 모양에 초록 점 · 날짜(요일) · 구분선 · 시각(15px 620, 로고 파랑 #1359da). 다크는 #1b2029 알약 · 밝은 파랑 시각. live-src.js installClock(초 경계에 맞춰 1초마다), 글자는 span 이라 패널편집 대상이 아니다.
* **팝업 뒤 막(검정 70%)** — conv.js SCREENS 의 overlay.dim = 'rgba(0,0,0,0.7)' → 팝업 모듈이 '.fm?-dim.sh-dim'(z 59, 팝업 60 아래)을 깐다. installFit 이 막을 넓힌 캔버스 전체로 늘린다(안 늘리면 스튜디오 화면비에서 아래 이벤트 로그 줄이 안 덮였다). 막을 누르면 종합 현황으로 닫힌다.
* 함정: 보기 도구로 캡처를 보면 막이 옅어 보였다 — 실제 픽셀은 229 → 68(정확히 70%). 의심되면 png.js 로 픽셀을 잰다.
* **팝업 받침** — 팝업 제목줄 · 유리는 반투명이라 막이 깔리면 회색(145)이 되고 3D 라벨 · 로고가 비쳐 제목이 묻혔다. `.sh-popmount::before` 에 흰 받침(다크 #161a21)을 깔아 Figma 의 제목줄 색(229 → 지금 226)으로 되돌렸다. 다크 제목 글자는 #eef1f6.
* **판 접기 단추** — 예전엔 판만 밀려 나가고 단추는 제자리에 남았다. 이제 판과 같은 .55s 곡선으로 따라 나가 화면 가장자리 12px 안쪽에서 멈추고 화살표가 그동안 돈다(installFold geo · EDGE). 화살표 = 누르면 판이 갈 방향: 펼침 왼쪽 « · 오른쪽 », 접힘 왼쪽 » · 오른쪽 « — 원본 그림(왼 » · 오른 «)은 거꾸로 읽혀 펼침 상태에서 180° 돌려 둔다(사용자 지시).
* 스크롤 영역은 원본에 없다(표 줄 수가 칸에 다 들어간다).
* **팝업 받침 크기** — 받침은 팝업 카드(`Background Glow` · `Background`) 크기로 깐다(installPopBed, `.fe-popbed`). Figma 프레임이 카드보다 넓은 팝업이 있어(태양광 PV 프레임 1417 · 카드 1380) 프레임 크기로 깔면 오른쪽에 흰 띠가 삐져나왔다.
* **알림 띠(Ticker)** — 원본은 띠 오른쪽에 치우친 본문 글자였다(Message Wrap padding-left 167). 띠 가운데에 '등급 공 아이콘(원본 indicator-*.svg) · 메시지 · 시각'으로 놓고, 시스템 상태(원본 글자, 패널편집 가능)와 최근 경보 3건(이벤트 표 값, 고위험/경미 배지)을 6초마다 위로 밀어 올린다(installTicker). 패널편집 중엔 상태 메시지에 멈춘다.
* **다크 가독성(11-19)** — `node pw.js dk-contrast.js` → `node dk-contrast-an.js` 가 다크 6장(종합 · 팝업 4 · 펼친 로그)의 보이는 글자마다 둘레 바탕과의 대비비를 재서 4.5:1(큰 글자 3:1) 미달을 찍는다(3D 라벨 · 막 아래 요소는 측정상 걸리는 것이라 무시). 53곳 → 실제 미달 0.
  dark.js lightExtra 에 역할별로: 면 세 층(바탕 < 판 유리 + 1px 테두리 < 카드 #1f252e + 테두리 · 그림자, 카드 안 칸은 #161a21), 위젯 제목 알약 · 바로가기 · 장비 키는 짙은 파랑 그라디언트, 나침반 글자는 짙은 남색(원판이 밝다), 계측기 카드 머리 글자는 짙게, 장비 값 · 띠 시각 · CR 빨강 밝게, 표 배지 면 · 테두리. 제목 알약 규칙은 원래 알약이던 위젯 4개만 — 넓히면 'S. P. Q 전력현황' 같은 글자 제목까지 알약이 됐다.
* **다크 팝업 옆 사각 띠** — dark.js 의 밤 바탕 규칙(`뿌리{background}` · `뿌리 > 프레임{gradient}`)이 팝업 뿌리에도 걸려, 카드보다 넓은 Figma 프레임(태양광 PV 1417 · 카드 1380)이 모서리 없는 어두운 사각형으로 칠해졌다 → `:not(.sh-pop)` 으로 화면 뿌리에만.
* **다크 팝업 띄우기** — 다크 팝업 유리(#13161c)가 막 아래 화면(#0a0c10)과 밝기가 거의 같아 경계가 흐렸다. 다크에서만 카드 유리 그림(Background · Background Glow · Base 의 img)을 brightness(1.5), 받침(.fe-popbed) 바깥에 옅은 파란 1px 테두리 + 5px 빛 + 넓은 그림자. 설비 그림 · 아이콘은 건드리지 않는다.
* **다크 로고 = 흰색(사용자 지시 11-19)** — dark.js: `Frame 8 > logo chip img{filter:brightness(0) invert(1)}` (칩은 W 를 뚫은 Exclude 모양이라 흰 칩에 W 가 바탕색) + `WEMB Studio` 글자 #fff. 라이트는 원본 파란 로고. 색 정하기로 바꿔도 흰색 유지.
