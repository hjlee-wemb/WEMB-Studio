# 스마트 산단 디지털 트윈 — 생성기

원본 파일은 Figma `xzZQdVDkaDM1hve8Vc88GC` 입니다. REM 페이지의 9화면을 재구축했고, `original` 페이지는 대상에서 뺐습니다.
스튜디오 템플릿 이름은 **`Digital Twin: Smart Industrial Complex`**(tpl `indpark`)입니다.
화면 안 글자는 가상 데이터만 씁니다(청해 산단 · 가온케미칼 · 누리정밀 · 해솔소재 · 다온테크 · 한결화성).

| 장면 | 접두어 | Figma | 모듈 |
|---|---|---|---|
| main 종합 운영현황 | ipm | 2208:2033 | src/indpark-main.js |
| menu 전체 메뉴 | ipn | 2208:2117 | src/indpark-menu.js |
| site 사업장 3D | ips | 2208:2220 | src/indpark-site.js |
| forklift 지게차 충돌감시 | ipf | 2208:2306 | src/indpark-forklift.js |
| vibration 진동센서 정보 | ipv | 2208:2393 | src/indpark-vibration.js |
| heat 온도센서 정보 | iph | 2208:2792 | src/indpark-heat.js |
| event 이벤트 현황 | ipe | 2208:3187 | src/indpark-event.js |
| history 이벤트 히스토리 | ipy | 2208:3552 | src/indpark-history.js |
| sensor 센서현황 | ipt | 2208:3926 | src/indpark-sensor.js |

## 만드는 순서
1. `dc-<key>.txt` · `meta-<key>.xml` — get_design_context / use_figma 결과(save-dc.js · extract-dc.js · mk-meta.js).
2. `node dl.js` → `node strip-gama.js`로 에셋을 src/indpark/ 에 받습니다. 3D 렌더 두 장은 고객사 표지를 지운 사본입니다(fix-tower.ps1 · fix-forklift.ps1, 원본은 *.orig.png).
3. `node conv.js`로 9개 모듈과 미리보기(src/indpark/*.html)를 만듭니다. 라이트 시트도 같이 나옵니다(light.js + light-palette.js + light-assets.json).
4. 라이트 그림 사본은 `node mk-light-indpark.js`(svg 47장)와 `powershell -File mk-light-bg.ps1`(screen-main-lt.jpg)로 만듭니다. 사본을 다시 만들면 conv.js 를 다시 돌립니다.
5. 라이브 레이어는 `node mk-live.js`로 만듭니다(live-src.js → src/indpark-live.js). 차트 부품은 src/plant-live.js 에서 떠 오며, 고치면 tpl-modules.js 의 `indpark-live.js?v=` 를 올립니다.
6. 스튜디오 연결은 js/templates/indpark.js 와 `node patch-studio.js`입니다. patch-studio.js 는 한 번만 돌리면 되고, 이미 적용했습니다.
7. 썸네일은 `node pw.js live-test.js 1920 1080` → thumb-*.png → `mk-thumb.ps1` 순서로 만들어 src/templates/indpark-*.jpg 로 냅니다.

## 검증
- 미리보기 서버는 `node serve.js 5560`(WEMB Studio 루트)이고, 브라우저는 `node pw.js <스크립트>`(로컬 Chrome Playwright)로 띄웁니다.
- 다크 픽셀 차이(cap.js → diff-all.js)는 2~6%이며, 대부분 글자 안티앨리어싱입니다.
- 라이트 대비(cap-contrast.js → contrast.js 4.5)는 모든 글자가 4.5:1 이상입니다. 예외는 설비 검색 자리표시 글자 하나(약 4.0)와 모달 가림막 아래 글자입니다.
- 스튜디오(studio-test.js · studio-edit-test.js) 결과:
  - #dtStage 여백 0
  - 장면 이동 0.18~0.27초
  - 라이트가 장면을 옮겨도 이어짐
  - 패널편집에서 글자 74/74 편집, 판 이동, 차트 바꾸기 동작
  - 콘솔 오류 없음

## 스크롤 목록
- Figma 에는 막대만 그려져 있어 live-src.js 의 installScrollFill(installNav 앞) · installScroll(라이브 차트 뒤)이 채운다.
  - 이벤트 로그: 지난 이벤트 5행을 잇는다(시각은 마지막 행보다 이전, 등급 구슬은 같은 등급 건수 칩 그림).
  - 설비 목록: 가상 센서 6행을 잇는다.
  - 센서 팝업 값 칸: 범례의 나머지 센서를 다섯 번째 칸 모양으로 채우고 2초마다 흐른다.
- 막대는 목록 스크롤과 묶었다(휠 · 막대 끌기 · 트랙 누르기, 막대 길이 = 보이는 비율). 온도 팝업은 막대 없이 Value Panel 자체가 휠로 스크롤된다.
- 여섯 번째 값 칸은 Figma 에서 이름이 겹친 사본(Item/Vibration 5)이라 흐린 · 파란 모양이 섞여 있다 → 보통 모양으로 다시 만든다(색은 범례 자리 색).
- 검증: node pw.js scroll-test.js.

## 상자 대조 (2026-11-13 — 제목 띠 강조 막대가 어긋나 전 화면 다시 봄)
- `node pw.js box-check.js` 는 DOM 노드 자리를 메타(프레임 기준 x,y · 회전 후보)와 2px 안으로 대 본다. 지금은 9화면 모두 0건이다.
- conv.js 의 보정 세 가지:
  - **그룹 기준 상자:** 자식 좌표가 그룹 기준으로 나온 contents 그룹(패널 제목 Bullet)을 진짜 상자로 만든다.
  - **여백 > 고정 높이:** 위아래 여백을 0 으로 두고 가운데 정렬한다(범례 칸 h15 + py15 가 30px 로 커져 차트가 15px 밀렸다).
  - **hug 절대 프레임:** 메타 폭을 준다(전체 메뉴 서랍이 388 로 커졌다).
- 그라데이션 선 120곳은 `node mk-grad-strokes.js`(use_figma 로 읽은 값)로 만든다. 칩 · 건수 칸 · 라벨 상자, 검색칸 · 입력칸, 내비 바가 대상이고 screen-css.json 에 들어간다. design context 는 이 선들을 첫 정지색 단색으로 뭉갰다.

## 제목 띠 강조 막대 · 지도 그림 (2026-11-13)
- **강조 막대:** Figma 원본도 막대가 띠(16~48)보다 4px 아래에서 시작해 9px 더 내려가고, 패널 바깥 2~4px 에 붙어 있다. 라이트에서 틀어져 보여서(사용자 지시) conv.js NODE_CSS 로 맞췄다.
  - 띠와 같은 높이로 줄이고 테두리 안쪽에 붙인다(패널 · 팝업).
  - 하단 이벤트 로그 막대는 2px 만 안으로 옮긴다.
  - box-check 에서 Base · Accent 가 조금 어긋나 보이는 것은 의도한 것이다.
- **map.png:** 원본 라벨(실제 기업명)이 박혀 있었다. 덮개 라벨이 들어오는 애니메이션 중에 비쳤다.
  - `mk-map-anon.ps1` 이 덮개 라벨 캡처(map-labeled.png · map-labels.json)를 그 자리에 구워 넣는다. 원본은 map.orig.png 에 둔다.
  - Figma 파일의 지도 그림은 아직 원본 그대로다.

## 팝업 등급 칩 (2026-11-13)
- Figma 원본에서 팝업 '이벤트 현황' 칩은 CR 만 바르고, MA · MI · WA · NO 는 숫자 동그라미가 글자 위로 밀려 겹쳐 있었다.
- 사용자 지시로 `node mk-chip-align.js` 가 CR 기준 배치를 screen-css.json 에 넣는다. 배경 시작점에서 글자는 +19.24px, 숫자 동그라미는 +48px 이고 숫자는 동그라미 가운데다.

## 함정
- **라이트 글자색:** gasmon 에서 가져온 NODE_CSS 의 `[data-name^="Button/"] p{color:#fff}` 때문에 밝은 회색 단추(지게차 충돌감시 · 대피로)의 글자가 1.05:1 로 사라졌습니다. 흰 글자는 파란 단추(Ack · Ack All · Reset)에만 줍니다.
- **꺼진 내비:** `nav-item-operation-overview.svg`는 꺼진 상태인데도 검은 알약이 깔려 있습니다. 다크 바에서는 안 보이지만, 라이트에서 흰 알약으로 바꾸면 켜진 것처럼 보입니다. 이 파일만 거의 투명하게 칠합니다.
- **흰 테두리:** `#fff` 테두리가 표에 없으면 autoLight 가 짙은 회색(#3e4147)으로 만들어 건수 칩 테두리가 시커멓게 됩니다. 표에 넣었습니다.
- **라이브 차트 첫 그림:** 원본 Data svg 의 선 5개를 읽어 시작합니다(교대 단차 · 끝에서 치솟는 경보선). 선은 값 칸 색과 가장 가까운 색끼리 짝짓습니다(계산값이 rgb() 라 hex 와 바로 비교하면 안 맞습니다). fetch 가 끝났을 때 installFit 이 box 를 비워 두었을 수 있으니 다시 잽니다.
- **지도 cover:** 세로로 긴 판(1216×984)에서는 좌우가 크게 잘려 '다온테크' 라벨이 지도 밖으로 나갔습니다. 지도는 라벨 다섯 개가 다 들어오는 쪽으로 object-position 을 옮기고, 라벨도 같은 만큼 옮깁니다.
- **옮긴 판:** 놓으면 z-index 가 사라져 지도 밑으로 숨었습니다. `.ip-front`로 앞에 남깁니다(배치 초기화 때 뺍니다).
- **PowerShell:** 한글 경로가 들어간 인자를 넘기면 System.Drawing 이 파일을 못 엽니다. 자르기는 node crop.js 로 합니다. ps1 주석은 ASCII 로만 씁니다.
