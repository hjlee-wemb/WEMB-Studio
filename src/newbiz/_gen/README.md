# 신사업 관리 대시보드 — Figma → 순수 HTML/CSS 재구축

Figma 파일 `cES6X45zHjsaabaXL1cdrt`(page `Dark-시안01`)의 화면 11장을 **순수 HTML/CSS DOM** 으로 다시 지은 것과 그 생성기.
스튜디오 템플릿 이름은 **`Dashboard: New Business Management`** (2D 대시보드 · 발전·에너지 · tpl `newbiz`, 슬러그 `dashboard-new-business-management`). 사용자가 "(프로젝트 이름)" 자리표시자로 보내 파일 제목 '신사업관리시스템'에서 정했다(고객사 이름은 안 씀).

| 장면 | Figma 프레임 | node | 생성물 | 접두어 |
|---|---|---|---|---|
| wind | Screen/Renewable Status - Wind | `1:2634` | `src/newbiz-wind.js` | `nbw` |
| solar | … - Solar | `1:3482` | `src/newbiz-solar.js` | `nbs` |
| energy | … - Energy | `1:4335` | `src/newbiz-energy.js` | `nbe` |
| wind-input | … - Wind (Tooltip, Input) | `1:52` | `src/newbiz-wind-input.js` | `nbk` |
| solar-input | … - Solar (Tooltip, Input) | `1:912` | `src/newbiz-solar-input.js` | `nbl` |
| energy-input | … - Energy (Tooltip, Input) | `1:1773` | `src/newbiz-energy-input.js` | `nbg` |
| measure | Screen/Measurement Status | `1:6841` | `src/newbiz-measure.js` | `nbm` |
| measure-wind | … - Wind Tooltip | `1:5184` | `src/newbiz-measure-wind.js` | `nbt` |
| measure-solar | … - Solar Tooltip | `1:6013` | `src/newbiz-measure-solar.js` | `nbu` |
| measure-popup | … - Project Popup | `1:7644` | `src/newbiz-measure-popup.js` | `nbp` |
| overseas | Screen/Overseas Business | `1:8494` | `src/newbiz-overseas.js` | `nbo` |

- 글자는 전부 실제 텍스트(`<p>`), Pretendard Variable CDN(시안 글꼴은 SUIT). 그래픽은 Figma 가 내보낸 개별 파일(`src/newbiz/*.svg|png`).
- Figma 레이어명을 `id` · `class`(`nbw-<레이어명>`) · `data-name` 에 보존. 레이어명 정리는 메모리 `koen-newbiz-figma`.
- **`src/newbiz-<장면>.js` 와 `src/newbiz-live.js` 는 손으로 고치지 말 것.** 화면은 conv.js, 라이브는 `live-src.js` 를 고쳐 `node mk-live.js`(차트 부품은 plant-live.js 에서 떠 온다). 고치면 `js/core/tpl-modules.js` 의 `?v=` 를 올린다.

## 파이프라인

STATCOM(`src/statcom/_gen/`) 도구를 `prep.js` · `patch-conv1~4.js` · `patch-light1~2.js` 로 옮겼다(한 번만. 이미 적용됨).

```
1) get_design_context(forceCode, disableCodeConnect, excludeScreenshot) → save-all-dc.js · 작은 응답은 extract-dc.js → dc-<key>.txt
2) node dl.js → node strip-gama.js                에셋(주소는 7일이면 만료)
3) download_assets(지도 묶음 1:2640 · 1:7109, png @2x) → mk-map-alpha.js   통째 지도 + 바탕색 빼기
4) node mk-light-newbiz.js → node mk-screen-css.js → node conv.js           → src/newbiz-*.js + 미리보기 src/newbiz/*.html
5) node mk-live.js                                → src/newbiz-live.js
6) Playwright cap.js → node diff-all.js · cap-light.js · live-check.js · studio-check.js
7) thumb-*.png → mk-thumb.ps1 → src/templates/newbiz-*.jpg
8) node patch-studio.js                           스튜디오 연결(이미 있으면 건너뛴다. js/templates/newbiz.js 는 statcom.js 에서 매번 다시 뜬다)
```
검증 서버 `node serve.js 5543`(루트 = WEMB Studio). 미리보기 `src/newbiz/wind.html` — `?live=0` 라이브 없이, `?t=light|dark`, `?edit=1`.

## 밟은 함정

① **첫 응답이 100,000자에서 잘린다** — 스크린샷을 함께 받으면 잘렸다. `excludeScreenshot` 으로 받으면 끝까지 온다.
② **지도 효과가 design context 에 없다** — 노이즈 · 안쪽 그림자 · 채우기 soft-light 가 빠져 위성사진처럼 나왔다. 지도 묶음을 통째 PNG 로 내보냈는데, **내보내기에 화면 바탕 #06101c 가 구워져** 카드 위에 네모가 보였다 → mk-map-alpha.js 로 바탕과의 차이를 알파로.
③ **표 줄의 흰 안쪽 그림자는 soft-light 효과**다. 그대로 두면 흰 줄 → `mix-blend-mode:soft-light`.
④ **`L()` 쉼표** — 쉼표로 이은 선택자 뒤쪽에 테마 조건이 안 붙어 **라이트 규칙이 다크에도 먹었다**(스튜디오에서 판이 하얗게). L() 이 선택자마다 붙인다.
⑤ **테두리는 안쪽 링(`::after`)** — border-image 를 판에 주면 안 먹는다. 링에 준다.
⑥ **글자 위치** — SUIT → Pretendard 메트릭 차이. text-rects + `text-fit.js` 로 글자 크기 · trim 별 어긋남을 재 `translate` 로 되돌린다(text-fit.json). 글자 노드에만(묶음에 주면 메뉴가 통째로 밀린다). 굵기는 14px↑ -80, 13px↓ -100.
⑦ **묶음이 `display:contents`** 라 상자가 없고 안쪽 좌표는 % · bottom 이 섞여 있다 → 라이브 `realize()` 가 기준 크기에서 재어 px 로 굳히고 패널을 진짜 상자로 만든다(옮기기 · 늘리기 · 차트 자리).
⑧ **화면 폭이 1922**(해외사업만 1920). 굳히기는 1922 기준으로 하고 스테이지는 1920 좌표계.
⑨ **Figma 글꼴을 사용자가 SUIT 로 되돌렸는데 자간 -2.67 · 줄 높이 31 이 그대로** — `풍력터빈선정` 이 눌리고 묶음이 8px 밀려 있다. 화면 규칙으로 옆 글자와 같게 · 원래 자리(가운데 1143)로 되돌렸다. Figma 쪽은 SUIT 로드 불가라 못 고침.
⑩ **밝은 판에서 흰 터빈 날개 · 아이콘이 사라진다** — CSS 필터로 어둡게 하면 탁하다(사용자가 라이트를 어색하다고 함). `mk-light-newbiz.js` 가 라이트 사본을 만든다: 지도 `korea-map-lt.svg`(Regions 경로 143개 그대로, 노이즈 걷고 옅은 하늘색 면 · 흰 경계 · 해안선), 터빈 `*-lt.png`(청회색 범위), 네온 svg `*-lt.svg`(light-assets.json 으로 바꿔 끼운다).
⑪ **태양광 아이콘이 네모로 잘려 보였다(사용자 지적)** — design context 의 box-shadow 는 투명 PNG 의 네모 상자를 따라 그려지고 Visual 의 overflow:clip 이 빛을 자른다. 빛은 img 의 drop-shadow(그림 모양을 따른다), Visual 은 overflow:visible. 터빈 선택 빛도 같다.

## 검증 (2026-11-05 · Playwright)

픽셀차(tol 24, `?live=0`): 재생에너지 6장 5.96~6.36% · 계측현황 4장 2.09~2.65% · 해외사업 10.06%. 차이는 거의 글자(SUIT ↔ Pretendard 글자 모양 · 폭).
스튜디오 #dtStage 여백 `[0,0,0,0]`, 열기 약 1.2초, 탭 이동 0.2초, 메뉴 이동 0.3초, 글자 127/127 편집 가능, 콘솔 오류 0.

## 시안에 없어서 정한 것(사용자에게 알릴 것)

- **Event List · Fold Button 이 없다.** 접기는 해외사업 `2040 목표` 패널(제목 클릭), 최근 시각 찍기는 대상이 없어 시계만 실시간. 이력 표의 2015년 준공 같은 날짜는 사업 정보라 그대로 둔다.
- **차트가 원래 없다.** 패널편집의 추천 차트만 움직인다. 값은 표 · 2040 목표 · 팝업의 수치와 그 근처 샘플(합계 추이 · 풍속 · 일사량 추이는 샘플).
- **재생에너지 줄 삭제 · 입력 칸 글자**는 화면 안에서만 바뀐다(다시 열면 원본).
- **메뉴** — 재생에너지사업 · 해외사업만 화면이 있다. 나머지는 호버만. 계측현황은 지도 말풍선을 눌러 들어간다.
- **호버 단추** — 시안은 2번째 줄에 호버 모양과 말풍선을 박아 두었다. 라이브에서는 평소 숨기고 마우스가 올라간 단추로 옮긴다(`?live=0` 은 시안 그대로).
- **해외사업은 세로로 긴 창에서 카드 묶음이 가운데로 온다.** 카드와 지도를 잇는 선이 한 장 그림이라 벌리면 끊어진다. 격자 바탕이 화면을 채운다.
- 템플릿 날짜 `January 15, 2026` — 파일 이름 202601 에서, 일은 임의. 헤더 로고는 스튜디오 표준(WEMB)으로 바뀐다.
- 에셋 라이브러리는 `src/newbiz-assets/_gen/` 에 등록했다. 분자 라이브러리는 미등록.

## 라이트 아이콘 밝기(2026-11-05 사용자 지적 "아이콘들이 너무 어두워 보여")

터빈 사본 범위를 밝은 청회색으로(mk-light-newbiz.js lo · hi), 편집 · 삭제 · 탭 · 시계 아이콘 색을 한 단계 밝게(FAM icon), 태양광 패널은 brightness 1.32, 2040 터빈 brightness .82. 탭의 진한 테두리 · 단추와 2040 칸의 회색 면도 옅게(mk-screen-css). 다크 규칙은 건드리지 않았다.

## 풍향·풍속계 그림(2026-11-05 사용자 지적 "풍향 아이콘이 이상해")

`turbine-image.png` 는 터빈이 아니라 금속 받침 + 흰 컵의 풍향·풍속계다. 레이어 이름을 `Anemometer Image` 로 고쳤다(파일 이름은 그대로). 라이트 사본은 단색 재칠을 걷고 원본 음영에 곡선만 적용한다(mk-light-newbiz.js ②). 그림을 다시 칠하기 전에 크게 띄워 재질부터 볼 것.

같은 날 "아직 칙칙해" 로 한 번 더 올렸다: 풍향계 톤 곡선 0.56 + 0.44·v^1.1, 차가운 기운 [.9, .965, 1.03], 윤곽은 파란 drop-shadow 두 겹, 태양광 brightness 1.48, 버튼 · 탭 아이콘 #6fa6cc.

사용자 지시로 풍향·풍속계 라이트는 그림자를 뺐고 윗부분(컵 · 기둥)을 흰색으로 바꿨다(받침은 은청색, 경계 BASE_Y 3010). 흰 판 위에서는 윤곽이 옅다. 선택 표시 빛은 유지했다.

풍향·풍속계 윗부분에 옅은 회색 안쪽 외곽선을 그림에 구웠다(STROKE 48 원본 px ≒ 0.6 CSS px, mk-light-newbiz.js ②). 그림자 아님.
