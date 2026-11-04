# STATCOM HMI 디지털 트윈 — Figma → 순수 HTML/CSS 재구축

Figma 파일 `lyDJkcOlrznLKWo7mD7C2n`(page `Dark-시안01`)의 화면 11장과 `VR-시안` 4장을 **순수 HTML/CSS DOM** 으로 다시 지은 것과 그 생성기.
스튜디오 템플릿 이름은 **`Digital Twin: STATCOM HMI`** (3D 디지털트윈 · 발전·에너지 · tpl `statcom`, 슬러그 `digital-twin-statcom-hmi`). 파일 이름의 고객사 이름은 쓰지 않았다.

| 장면 | Figma 프레임 | node | 생성물 | 접두어 |
|---|---|---|---|---|
| main | 2_메인화면_close | `1:313` | `src/statcom-main.js` | `tcm` |
| statcom | 3_STATCOM | `1:187` | `src/statcom-statcom.js` | `tcs` |
| power | 4_전력설비 | `1:271` | `src/statcom-power.js` | `tcp` |
| valve | 5_VSC 밸브실 | `1:194` | `src/statcom-valve.js` | `tcv` |
| cooling | 6_VSC 냉각실 | `1:278` | `src/statcom-cooling.js` | `tcc` |
| supply | 7_전원 설비 | `1:286` | `src/statcom-supply.js` | `tce` |
| safety | 8_제어 안전 | `1:293` | `src/statcom-safety.js` | `tcn` |
| simulation | 9_시뮬레이션 | `1:300` | `src/statcom-simulation.js` | `tcu` |
| alarm | 10_알람 메세지 | `1:307` | `src/statcom-alarm.js` | `tca` |
| cards | 11_설비 요약 정보 카드 컨셉 | `1:457` | `src/statcom-cards.js` | `tcq` |
| vr-topic | 1_VR 교육 주제 선택 | `1:4858` | `src/statcom-vr-topic.js` | `tvt` |
| vr-overview | 4_VR 교육 개요 | `1:4943` | `src/statcom-vr-overview.js` | `tvo` |
| vr-step | 3_VR 교육 단계 안내 | `1:4916` | `src/statcom-vr-step.js` | `tvs` |
| vr-menu | 2_VR 교육 메뉴 | `1:4877` | `src/statcom-vr-menu.js` | `tvm` |
| login | 1_로그인 | `1:426` | `src/statcom-login.js` | `tcl` |

- 슬라이드 순서는 메인이 맨 앞, 로그인이 맨 뒤다(프로젝트를 열면 메인부터 보이게. 메인 헤더의 로그아웃 → 로그인, SIGN UP → 메인).
- 글자는 전부 실제 텍스트(`<p>`), Pretendard Variable CDN. 그래픽은 Figma 가 내보낸 개별 파일(`src/statcom/*.svg|png`).
- Figma 레이어명을 `id` · `class`(`tcm-<레이어명>`) · `data-name` 에 보존. 레이어명 정리는 메모리 `tpc-fenglin-figma-layer-naming`.
- **`src/statcom-<장면>.js` 와 `src/statcom-live.js` 는 손으로 고치지 말 것.** 화면은 conv.js, 라이브는 `live-src.js` 를 고쳐 `node mk-live.js`(차트 부품은 plant-live.js 에서 떠 온다). 라이브를 고치면 `js/core/tpl-modules.js` 의 `?v=` 를 올린다.

## 파이프라인

공장 전력설비(`src/plant/_gen/`) 도구를 복사해 `prep.js` · `patch-conv1~3.js` · `patch-fix4~5.js` 로 맞췄다(한 번만. 이미 적용됨).

```
1) get_design_context(forceCode, disableCodeConnect) → 큰 응답 save-dc.js · 작은 응답 extract-dc.js → dc-<key>.txt
2) node dl.js → node strip-gama.js                    에셋(주소는 7일이면 만료)
3) node mk-meta.js                                    글자 상자 · 이름표(인스턴스 안은 metadata 에 안 나와 use_figma 로 읽었다)
4) node mk-light-assets.js → node mk-screen-css.js    라이트 그림 · 화면별 규칙
5) node conv.js                                       → src/statcom-*.js + 미리보기 src/statcom/*.html
6) node mk-live.js                                    → src/statcom-live.js
7) Playwright cap.js → node diff-all.js → mk-thumb.ps1
8) node patch-studio.js                               스튜디오 연결(한 번만)
```
검증 서버 `node serve.js 5542`(루트 = WEMB Studio). 미리보기 `src/statcom/valve.html` — `?live=0` 라이브 없이, `?t=light|dark` 테마 고정, `?edit=1` 편집 모습.
Playwright: `cap.js` · `live-check.js`(반응형 여백) · `light-check.js`(대비) · `studio-check.js`(스튜디오에서 실제로 누르기).

## 밟은 함정

① **이 파일은 stroke 가 오토레이아웃 크기에 안 들어간다** — CSS border 로 두면 안쪽이 1px 밀리고 상자가 2px 커져 아래가 줄줄이 밀렸다(1.3%↔3%). 모든 테두리를 안쪽 링(`::after`)으로(patch-conv2). 가운데 정렬 선 두 곳(1:663 · 1:2109)만 절반 밖으로.
② **인스턴스 안 글자 상자** — get_metadata 는 인스턴스를 안 펴고 design context 는 글자 data-name 을 안 준다. use_figma 로 읽어 마스터 id(마지막 토막)로 찾는다(META Proxy).
③ **p 안 span 사이 줄바꿈** — `whitespace-pre-wrap` 칸에서 줄이 깨졌다. span 을 붙여 쓴다.
④ **여러 줄 글자의 줄높이** — 글자 상자 높이가 줄높이로 박혀 두 줄이 벌어졌다(말풍선 · Description, mk-screen-css).
⑤ **`[data-name="Timeline"]` 이 두 군데** — 알림의 왼쪽 열도 Timeline 이다. 장면으로 거른다.
⑥ **lselectric 에 장면 이름 'statcom' 이 있다** — 패치 표지를 `'statcom'` 으로 쓰면 '이미 있음'으로 건너뛴다. `t.tpl === 'statcom'` 으로.
⑦ **TPLLOGO 가 로고 칸 폭을 풀어 폭 0** — 칸 폭을 CSS 로 박았다(digital-twin.css).
⑧ **라이트: 채도 높은 짙은 남색(#060d1e)이 안 밝아진다 · 밝은 청록 글자가 흐리다** — light.js autoLight · darkenText.
⑨ **색 정하기: 상태 점(marker-*.svg)이 hue-rotate 로 뜻이 바뀐다** — STATCOM_OPT.keep 에 넣었다.

## VR 4장(2026-11-04 추가)

- 원본은 약 750×788 프레임이다. 1920×1080 좌표계에서 장면은 cover, 팝업은 가운데 + 원래 프레임 높이 비율만큼 확대(VH/788 = 1.37). 장면 그림 원본이 987×1034 라 전체 화면에선 조금 부드럽다.
- 픽셀 대조는 cap-vr.js(원래 프레임 크기), 흐름 점검은 vr-check.js.
- 글자는 Figma 에 Brand New Hyosung 인데 Pretendard 로 그린다.
- 흐름: 주제 선택 → 개요 → 단계 안내 ⇄(M · Esc) 메뉴. HMI 사이드 메뉴에는 VR 입구가 없어 프로젝트의 화면 목록으로 들어간다.
- **함정:** dc 가 그라디언트 음수 정지점의 부호를 잃는다(`0 25%` → 실제 -25%, 픽셀 샘플로 확인). dc-1-4916 · dc-1-4943 을 고쳐 두었으니 다시 받으면 또 고칠 것. Instruction Card 그림자는 Figma 가 반투명 판 뒤로도 그려 ::before 흐린 판으로 대신했다. 목록 글자는 li 라 dt-edit DTSEL 에 따로 넣었다.
- 원본 오타 '신규 선브모듈' 은 그대로 두었다.

## 시안에 없어서 정한 것(사용자에게 알릴 것)

- **Event List 가 없다.** 접기 · 펴기는 왼쪽 패널과 미니맵의 Panel Toggle, 최근 시각은 알림 메세지에 넣었다(줄 간격은 원본이 전부 같은 시각이라 벌려 찍는다).
- **메인(패널 없음)의 왼쪽 접기 단추**는 패널이 열린 STATCOM 화면으로 간다. 메인 미니맵은 다른 화면의 Minimap 을 감춰 심어 편다(GRAFT).
- **추천 차트 값**은 그 위젯의 원본 수치 근처 샘플이다. 시안에 원래 있는 차트는 설비 카드 스파크라인뿐이라 원본 경로 점을 흔든다.
- 호버 카드의 온도 · 전압은 칸에 올릴 때 지어낸 샘플이다. SM 번호는 칸 위치로 계산한다.
- 총 재생시간 `08:40` — 원본은 칸이 좁아 두 줄로 꺾여 있어 한 줄로 고쳤다.
- 템플릿 날짜 `June 15, 2026` — 파일 이름 202606 에서, 일은 임의.
- 장면 그림 · 썸네일의 바닥 글자 HYOSUNG · 로그인 로고는 원본 그대로다(헤더 로고는 스튜디오에서 WEMB 로 바뀐다).
- 분자 라이브러리 · 에셋 라이브러리는 미등록.
