# 스마트 플랜트 가스 모니터링 — Figma → 순수 HTML/CSS 재구축

Figma 파일 `CbbEsxxZo3vBcBprsiUhJm`(REM 페이지)의 화면 2장 + 팝업 3장을 **순수 HTML/CSS DOM** 으로 다시 지은 것과 그 생성기.
`origimal`(3059:1787) 페이지는 사용자 지시로 뺐다. 스튜디오 템플릿 이름은 **`Dashboard: Smart Plant Gas Monitoring`**
(제조·안전 · tpl `gasmon`, 슬러그 `dashboard-smart-plant-gas-monitoring`). 파일 · 안쪽 글자에 고객사 이름은 쓰지 않았다(가상 데이터).

| 장면 | Figma 프레임 | node | 생성물 | 접두어 |
|---|---|---|---|---|
| main | Screen/Main | `3059:3083` | `src/gasmon-main.js` | `gmm` |
| gas | Screen/Gas Main | `3059:3990` | `src/gasmon-gas.js` | `gmg` |
| worksite | Popup/Work Site Detail | `3059:4943` | `src/gasmon-worksite.js` | `gmw` |
| alarm | Popup/Gas Concentration Alarm | `3059:5211` | `src/gasmon-alarm.js` | `gma` |
| confirm | Popup/Send Confirm | `3050:2030` | `src/gasmon-confirm.js` | `gmc` |

- 글자는 전부 실제 텍스트(`<p>`), Pretendard Variable CDN. 그래픽은 Figma 가 내보낸 개별 파일(`src/gasmon/*.svg|png|jpg`).
- Figma 레이어명을 `id`(`gmg-<레이어명>`) · `class` · `data-name` 에 보존. 레이어명 정리는 메모리 `hyundai-steel-gas-figma-layer-naming`.
- **`src/gasmon-<장면>.js` 와 `src/gasmon-live.js` 는 손으로 고치지 말 것.** 화면은 `conv.js`, 라이브는 `live-src.js` 를 고쳐 `node mk-live.js`
  (차트 부품 makeChart · KIND_ICON · syncChartHue 는 `src/plant-live.js` 에서 떠 온다). 고치면 `js/core/tpl-modules.js` 의 `?v=`, 그 목록을 바꾸면 `studio.html` 의 `tpl-modules.js?v=` 를 올린다.
- 스튜디오 쪽 붙이기: `js/templates/gasmon.js`(장면 표 · 테마 · 장면 전환) + `node patch-studio.js`(tpl-modules · studio.html · templates.js · home/project/projects/main · image.js 색 정하기 · dt-edit.js · atom-swap.js, 한 번만. 이미 적용됨).

## 파이프라인

STATCOM(`src/statcom/_gen/`) 도구를 복사해 `prep.js` 로 맞췄다(한 번만. 이미 적용됨).

```
1) get_design_context(forceCode, disableCodeConnect) → extract-dc.js → dc-<key>.txt
   가스 메인은 10만 자에서 잘려 와 자식(센서 패널 2 · 3, 공장도면, 헤더)을 따로 받아 node compose.js 로 합친다(원본은 dc-3059-3990.raw.txt)
2) node dl.js → node strip-gama.js                      에셋 103개(고유 81). 주소는 7일이면 만료
3) node mk-meta.js                                      use_figma 로 덤프한 '@@meta' 줄 → meta-<key>.xml (48KB 반환 한도라 반씩)
4) node mk-light-gasmon.js · mk-light-images.exe .. · node mk-light-floor.js   라이트 SVG 사본(-lt.svg 50개) · 바탕(screen-main-lt.jpg) · 평면도(floor-plan-lt.png)
5) node conv.js → node leak-check.js                    → src/gasmon-*.js + 미리보기 src/gasmon/*.html (?t=light · ?live=0)
6) node mk-live.js                                      → src/gasmon-live.js
7) node serve.js 5546 → Playwright cap.js → node diff-all.js           다크 픽셀 대조(figma-<key>.png ↔ dom-<key>.png)
   Playwright cap-contrast.js → node contrast.js lfull-<장면>.png lboxes-<장면>.json 4.5   라이트 글자 대비
8) Playwright 로 thumb-<장면>.png(1920×1080, live=0) → mk-thumb.ps1 → src/templates/gasmon-*.jpg
```

## 검증 결과 (2026-11-11)

- 다크 픽셀 차이(허용 24): main 2.73% · gas 3.91% · worksite 7.82%(Figma 가 822×538 로 렌더) · alarm 5.54% · confirm 5.74% — 나머지는 글자 안티에일리어싱.
- 라이트 글자 대비 4.5:1 미만: 등급 배지 · 건수 칩(흰 글자 + 상태색 판, 3.95~4.29 — 색이 곧 뜻이라 원본 유지)과 표 아래에 잘려 안 보이는 14번째 줄뿐.
- 스튜디오: `#dtStage` 여백 0(1248×852 · 1568×1032), 장면 이동 0.2~0.6초, 콘솔 오류 없음.

## 함정

1. **`var(--4.0625rem,65px)`** — Figma 변수 이름에 점이 있어 CSS 로 무효 → 크기 · 간격이 통째로 빠져 37% 어긋났다. `arb()` 안 `unVar()` 가 대체값만 남긴다.
2. **팝업 익명 클래스 충돌** — 팝업(`x22` …)과 바탕 `.gmg-root` 규칙이 겹쳤다 → `SCREENS` 의 `layer: 1/2/3`.
3. **mix-blend-mode SVG** — `<img>` 안에선 섞이지 않아 Auto · Ack 에 흰 번짐 → 그 SVG 만 인라인. `shadow.svg` 는 인라인하면 메뉴 아이콘 밑에 흰 타원 → 제외.
4. **미터 안쪽 빛** — 빈 트랙까지 덮었다 → `*Meter` 의 빛 자식 너비를 값 % 로 자른다('Meter Fill' · 'Meter Glow' 이름은 conv.js 가 붙인다).
5. **`Tab/GAS#1 (Active)` 두 겹** — 원본 복제 잔재, 글자가 굵어 보여 뒤 것을 감춘다(NODE_CSS).
6. **센서 패널 1 의 이름이 없다** — 컴포넌트 함수 호출이라 뿌리에 data-name 이 없고 마스터 id(47:1045)가 붙었다 → compose.js 가 `Widget/Sensor Status 1 · 3096:4290` 으로 되살린다(차트 바꾸기 · 패널 이동이 이름으로 찾는다).
7. **가스 화면 레이어 순서** — Figma 에서 Content(평면도)가 Event Log 위라 접기 화살표가 안 눌리고 펼친 목록이 가렸다 → 라이브에서 Event Log `z-index:2`, 팝업 Dim 3 · 창 4(닫힌 상태 픽셀 차이 65px).
8. **차트 메뉴가 아래 패널에 가림** — 메뉴를 연 패널을 `:has(> .gm-chartmenu.open)` 로 z-index 50.
9. **라이트 LIGHT_KEEP 의 `Background`** — 화면 바탕만 지키려던 것이 팝업 표 행 · 머리 판까지 지켜 표가 남색, 머리 글자가 묻혔다 → `Screen/` · `Button/` · `Badge/` 바로 아래 Background 만 지킨다.
10. **라이트 글자를 흰색으로 남길 곳** — 등급 배지 · 건수 칩 · `Badge/…`(가스농도 52 ppm 포함) · 팝업 단추(Close · Ack 제외). Ack 는 인라인 SVG 판이 라이트에서 흰색이라 원래 글자색.
11. **mk-light 건너뛰기 목록** — `base-3`(전송 확인 판) · `meter*`(가스 감지기 트랙)이 잘못 빠져 라이트에서 검게 남았다 → 뺐다.
12. **'색 정하기' 와 인라인 색** — 라이브가 칠하는 미터 그라디언트는 icheonTint 가 못 바꾼다 → 시안일 때만 `--gm-chue` 만큼 `hue-rotate`(경고 노랑은 상태색이라 그대로).
13. **검증 함정** — 같은 주소로 `page.goto` 하면 해시만 바뀌어 다시 싣지 않는다(옛 모듈로 검증하게 됨) → `reload()` 또는 `&r=`. cap.js 는 페이지를 미리보기로 옮겨 둔다.
15. **라이트 평면도** — 픽셀 종류별(글자 · 판 · 선 · 빛)로 다시 칠하던 방식은 건물 윤곽이 사라지고 이름판 위로 선이 그어지고 글자가 번졌다(사용자 지적) → `mk-light-floor.js`: 다크 바탕 위 합성색을 Lab 에서 밝기만 뒤집고(색상 유지, a* 0.45 로 보랏빛 억제), 국소 톤 매핑(반경 14 흐림의 큰 결만 0.55 배)으로 스포트라이트 빛 무리가 얼룩이 되지 않게. 사본 이름이 같아 브라우저가 옛 그림을 쥐므로 light.js 가 `?v=<수정시각>` 을 붙인다.
16. **라이트 유리 구(orb)** — 회색을 거의 흰색으로 옮겨 사라졌다 → PEDESTAL 표에서 회청으로 한 단 짙게, 테두리 #7f98b3.
17. **라이트 등급 · 건수 칩** — 다크 칩(검은 속 + 색 테두리 빛)을 그대로 두면 라이트에서 탁한 알약이 된다 → mk-light-gasmon.js 가 status-*-bg · btn-event-status-bg* 를 흰 속 + 옅은 등급색 + 또렷한 테두리로 사본을 만들고(검은 정지점은 offset 이 0.500291 · 0.605 등 여러 개라 offset 무관하게), conv.js NODE_CSS 가 글자를 등급색 짙은 톤(Critical #ad152d · Major #ad4d00 · Minor #856000 · Warning #1356b3 · Normal #4b5868)으로. 라이브가 새로 넣는 줄도 같은 규칙을 탄다.
18. **라이트 바탕(screen-main-lt.jpg)** — 원본 위 띠의 경계(y≈218)가 가로줄로 보였다 → 경계 위아래 밝기 차를 열마다 재서 위쪽에서 빼고, 결 세기 상한 0.42(렌즈 빛 · 빛줄기 점이 얼룩이 되지 않게), 바탕은 위 #e8eef5 → 아래 #f3f6fa.
14. **셸 편집** — sed/heredoc 이 역슬래시를 망가뜨린 적이 있다(`\n` → `|`). 여러 줄 · 따옴표가 많은 편집은 Edit 도구로.
19. **라이트 화면 판 색과 에셋 라이브러리** — 뿌리 바탕 `#eef3f7` 을 `:not(.hj-asset)` 로(라이트 썸네일에 밝은 네모가 깔렸다). 에셋 등록은 `src/gasmon-assets/_gen`.
20. **라이트 Warning 배지 두 줄** — 등급 글자를 굵게(600) 하면 'Warning' 이 38px 칸을 넘어 꺾였다 → 등급 글자 규칙에 `white-space:nowrap`.

## 라이브러리 등록 (2026-11-12)

- 에셋 라이브러리: `src/gasmon-assets/_gen`(README) → `src/gasmon-assets.js`. 차트 2 · 패널 12 · 이벤트 2 · 심볼 33 · 아이콘 3.
- 분자 라이브러리: `wemb-atomic`(family `gasmon`, 페이지 5장 — 팝업 장면 `build_gmX_scene` 은 합성이라 뺐다). 화면을 다시 만들면 sources 로 다시 복사 → build → 서버 재시작 → 측정 → export.

## 원본에 없어 정한 것

- 팝업 3장은 가스 메인 위 가운데에 Dim 과 함께 얹는다(Figma 에선 단독 프레임). 센서 표지 Minor → 가스농도 이상, 나머지 → 작업개소 상세. 완료 → 전송 확인, 취소 → 가스농도 이상, 보내기 → 토스트 후 가스 메인.
- 헤더 로고 자리는 업로드한 로고가 있을 때만 보인다(TPLLOGO.DOM_CUSTOM).
- AI CCTV · 관리자페이지 · 로그아웃 · CCTV 메뉴 카드는 화면이 없어 토스트.
- 이벤트 로그: 메인은 펼친 채, 가스는 접힌 채 시작(접기 상태는 화면마다 기억, 화살표는 기본 대비 회전). 16~30초마다 새 이벤트 한 줄(10줄 유지), 열 때마다 발생일시를 최근 시각으로(`wembRestampTimes`).
- 차트 바꾸기 추천: 센서현황 패널마다 가스 농도 추이(라인) · 경보 기준 대비(막대) · CO 게이지 · O2 추이(영역) · 감지기 상태(도넛), 이벤트 로그는 등급 도넛 · 막대 · 라인. '원본 그대로' 로 되돌린다.
