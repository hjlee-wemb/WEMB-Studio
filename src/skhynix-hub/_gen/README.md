# src/skhynix-hub — 생성 자료 (Figma 64:3367 → HTML/CSS)

`src/skhynix-hub.js`(스튜디오 화면 모듈)와 `src/skhynix-hub/preview.html`(단독 미리보기)은
**손으로 쓰지 않고 이 폴더의 스크립트로 생성**한다. 고칠 일이 생기면 `conv.js`를 고치고 다시 돌린다.

```bash
node src/skhynix-hub/_gen/conv.js     # → src/skhynix-hub.js · src/skhynix-hub/preview.html 재생성
```

## 원본

- Figma 파일 `0R04sQR7srWuzezhRPzkMW`, 페이지 `Light-시안02`, 노드 **64:3367 `Screen/FMS Hub`** (1920×1080)
- `figma-design-context.jsx.txt` — Figma MCP `get_design_context` 출력(React+Tailwind + 레이어명/노드id).
  좌표·색·폰트·오토레이아웃이 전부 들어 있는 **레이아웃의 원본**이다.
- `figma-node-sizes.json` — `get_metadata` 에서 뽑은 노드별 실제 상자 크기(id → 이름/w/h).
  브라우저 폰트 메트릭이 Figma 와 미세하게 달라 글자 상자가 1~2px 어긋나고 그게 오토레이아웃을 타고
  위젯 위치까지 밀어내므로, 텍스트 노드에 이 값(폭·줄높이)을 박아 레이아웃을 고정한다.
- `figma-64-3367.png` — Figma 렌더 원본(1920×1080). 픽셀 대조용 기준 이미지.
- 아이콘·이미지는 `download_assets` 로 받은 개별 파일(`src/skhynix-hub/*.svg|png`, 62개) 그대로 쓴다.
  **손으로 그리지 않는다.**

## conv.js 가 하는 일

1. Tailwind 유틸리티 → 실제 CSS 선언 1:1 번역(미지원 클래스가 있으면 콘솔에 리포트하고 멈추지 않음).
2. 레이어명 보존: `id="skh-<레이어명>"`(중복은 `_2`), `class="skh-<레이어명> n<노드id>"`, `data-name`/`data-node-id`.
   스타일은 노드 id 기반 유일 클래스(`.n64_3367`)에만 건다.
3. 텍스트 상자 고정(위 `figma-node-sizes.json`).
4. Figma 코드 출력이 못 담은 값 2건 보정 — 원본 SVG export 에서 읽어 되살린다.
   - `Header`(64:3855): 프레임 stroke 가 실제로는 **가로 그라디언트**(투명→#788188 60%→#EDECED→투명).
     이미지 위에 그려지는 선이라 오버레이 `div`(`skh-Header/Stroke`)로 얹는다.
     헤더 배경 이미지도 패턴 변환이 비균등 스케일이라 원본 값(-67.5, 1, 2055×58)을 직접 준다.
   - `Event List`(64:3894): 4px 테두리가 흰 단색이 아니라 **가로 그라디언트**.
     패널이 반투명(흰 10%)이라 배경 2겹 기법은 못 쓰고, `::before` + 마스크 링으로 재현한다(라운드 코너 유지).
5. Figma 의 이미지 채우기는 **border box** 기준인데 CSS 절대배치는 padding box 기준이라,
   테두리가 있는 부모 안의 `inset:0` 자식은 음수 위치 + `calc(100% + 2×테두리)` 로 되돌린다.

## 검증(2026-09-01)

- 노드 상자 대조: 487개 중 9개만 차이(전부 Figma "바깥 stroke" 표기 차이 — 실제 렌더는 픽셀 일치 확인).
- Figma 렌더 대비 픽셀 차이 2.38%(모두 글자 안티에일리어싱·1px 경계). 구조적 어긋남 없음.
- 스튜디오에 얹은 뒤에도 같은 수치 → 앱 전역 CSS 가 새어 들어오지 않음. 콘솔 오류 0.
