# 스마트 오피스 — 생성기 (tpl `office`, 'Dashboard: Smart Office')

원본: Figma `WUxDt6yorbRlc8V1py86HM` (홈 · 현황 · 분석 · 관리정보), 화면 54장 — 목록은 `screens.json`
(`[키, 노드, 접두어, 이름, 장면]`, 접두어 `ofh*` 홈 · `ofl*` 현황 · `ofo/ofb/ofp/ofr/ofc*` 분석 · `ofm*` 관리정보).

## 만드는 순서

| 단계 | 파일 | 결과 |
| --- | --- | --- |
| 1 | `save-all-dc.js` | 세션 기록에서 get_design_context 응답 → `dc-<키>.txt` (손으로 옮겨 적지 않는다) |
| 2 | `dl.js` | 에셋 내려받기 → `src/office/*.svg|png`, `asset-map.json` |
| 3 | `mk-dark-assets.js` | 다크용 SVG 사본 `*-dk.svg` + `dark-assets.json` |
| 4 | `conv.js` | `src/office-<장면>.js`(build_<접두어>, CSS · 라이트 기본 · 다크 파생) + 미리보기 `src/office/<장면>.html` |
| 5 | `mk-live.js` | `live-src.js` + 공장 전력설비 차트 부품 → `src/office-live.js` (initOffice / disposeOffice) |
| 6 | `patch-studio.js` | 스튜디오 등록(js/templates/office.js · tpl-modules · 카탈로그 · 홈 · 작업공간 · 색 정하기 · 패널편집) — 이미 있으면 건너뜀 |
| 7 | `mk-thumb.ps1` | 썸네일 `src/templates/office-<장면>.jpg` (캡처 `dom-<키>.png` 필요) |

검증: `node serve.js 5546` → 미리보기 `?live=0`(정지 = Figma), `?t=dark`, `?edit=1`.
스튜디오 점검은 Playwright filename 으로 `studio-check.js`. 글자 대비는 캡처 + `contrast.js`, 원본 대조는 `diff.js figma-<키>.png dom-<키>.png`.

## 함정

1. **괄호 없는 반환** — `function RoomOffice(…) { return <div … />; }` 꼴은 `return (` 만 찾던 파서가 통째로 버렸다
   (현황의 빨간 '선택된 방' 테두리 24개가 빠짐). `OFFICE_RET` 에서 한 줄 반환도 가지로 모은다.
2. **이름 없는 1단 인스턴스** — 현황 · 카운팅 화면의 Header · SNB 는 컴포넌트 정의가 펼쳐져 id 가 원본 것이라 metadata 로 이름을 못 찾았다.
   `OFFICE_NAMES` 가 **이 화면 바로 아래** 인스턴스(metadata 들여쓰기 = 화면 +2칸)에서 같은 크기 · 하나뿐인 이름을 붙인다. 들여쓰기는 페이지마다 다르다(2칸 / 4칸).
3. **다크에서 원본 유지** — 사이드바 · 화면 맨 위 헤더는 원본이 이미 어두운 남색(#20202d)이라 `LIGHT_KEEP`(Header 는 1단만 — 위젯 안 'Header' 제목 줄은 다크로).
   SVG 다크 사본도 이 둘 안에서는 끼우지 않는다(`dark.js` OUT).
4. **연한 색의 채도** — #E6EDFF 같은 아주 밝은 색은 HSL 채도가 90% 로 나와 '색'으로 오인된다. SVG 사본은 색 폭(최대-최소)으로 본다.
5. **방 강조 도형의 40% 흰 막** — 다크에서 회색 상자로 번쩍인다 → 사본에서 6% 로.
6. **도면 PNG** — 흰 바탕 · 회색 선. `invert + hue-rotate + mix-blend-mode:screen` 으로 바탕은 사라지고 선만 남는다(그냥 invert 는 검은 상자).
7. **선 차트를 넓힐 때** — 계열 선마다 감싸는 틀이 다르다(퍼센트 · 오른쪽 붙음 · scaleX(-1) 뒤집힘). 조상 기준으로 맞추면 어긋난다 →
   같은 차트 선들의 그림 영역(P0 · PW)을 한 번 재 두고 `P0 + (x-P0)·k` 로 놓은 뒤, 이동 방향은 **재서** 정한다(translateX 를 10px 넣어 보고).
8. **막대 애니메이션이 선 틀을 건드림** — `Graphic` 아래 자식 중 그림(img)을 품은 것은 막대가 아니다.
9. **사이드바 접기 상태 키는 `-mode` 로 끝나야 한다** (`wemb-office-snb-mode`) — 스튜디오는 화면을 옮길 때 저장값 묶음을 바꿔 끼우고
   `…-mode` · `…-seeded` 같은 키만 잇는다(js/core/screen-switch.js KEEP). 다른 이름이면 옮길 때마다 펼쳐진다.
10. **셸 명령으로 패치하면 역슬래시가 빠진다** (`node -e`, heredoc 모두) — 정규식이 든 수정은 Edit/Write 로.

## 라이브(`live-src.js`)

반응형(1920x1080 + 균일 배율, 남는 폭은 헤더 · 바탕 · 본문 판, 남는 높이는 사이드바 · 본문 판 · 가운데 정렬) ·
현황 실시간 시계 · 열 때마다 최근 시각(알림 · RAW DATA · 조회 기간) · 마우스 오버 · 사이드바 접기(시간필터 · 공간필터 · 트리 묶음 · 조건 묶음) ·
화면 잇기(헤더 메뉴 · 유틸 · 도크 · 방 → 팝업 · 닫기 · 확대) · 움직이는 차트 · 패널편집 중 차트 바꾸기(분석 묶음별 추천) · 패널 옮기기(같은 크기 맞바꾸기 · 자유 이동 · 배치 초기화).
