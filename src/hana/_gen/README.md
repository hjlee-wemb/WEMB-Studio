# HANA Bank H.I.T — Figma → 순수 HTML/CSS 재구축

Figma 파일 `H3S2M7DUCvuJgi75oBqg6W` (page `Page 1`)의 화면 **14장**을
**순수 HTML/CSS DOM** 으로 다시 지은 것과, 그걸 만드는 생성기가 이 폴더에 있다.
스튜디오 템플릿 이름은 **`Dashbord:HANA Bank-H.I.T`** (2D 대시보드 · 서비스·거래 · June 30, 2025).

| 화면 | Figma node | 생성물 | 접두어 |
|---|---|---|---|
| Screen/Overview 02 | `1:7175` | `src/hana-overview-02.js` · `overview-02.html` | `hno2` |
| Screen/Cloud Status 01 | `1:18455` | `src/hana-cloud-01.js` · `cloud-01.html` | `hnc1` |
| Screen/Cloud Status 02 | `1:18154` | `src/hana-cloud-02.js` · `cloud-02.html` | `hnc2` |
| Screen/Middleware Status | `1:18697` | `src/hana-middleware.js` · `middleware.html` | `hnm` |
| Screen/Infrastructure Main | `1:21965` | `src/hana-infra-main.js` · `infra-main.html` | `hni1` |
| Screen/Infrastructure Detail | `1:21682` | `src/hana-infra-detail.js` · `infra-detail.html` | `hni2` |
| Screen/Event Status | `1:19018` | `src/hana-event.js` · `event.html` | `hne` |
| Screen/Network Status 01 | `1:19299` | `src/hana-network-01.js` · `network-01.html` | `hnn1` |
| Screen/Network Status 02 | `1:19968` | `src/hana-network-02.js` · `network-02.html` | `hnn2` |
| Screen/Network Status 03 | `1:19085` | `src/hana-network-03.js` · `network-03.html` | `hnn3` |
| Screen/Facility Management | `1:22870` | `src/hana-facility.js` · `facility.html` | `hnf` |
| Screen/Security System 01 | `1:23148` | `src/hana-security-01.js` · `security-01.html` | `hns1` |
| Screen/Security System 02 | `1:23799` | `src/hana-security-02.js` · `security-02.html` | `hns2` |
| Screen/Login | `1:4904` | `src/hana-login.js` · `login.html` | `hnl` |

원칙(한진 시안과 같다)
- **글자는 전부 편집 가능한 실제 텍스트**(`<p>`, Pretendard CDN). SVG 로 구워진 글자는 없다.
- **아이콘·그래픽만** Figma 가 내보낸 개별 파일(`src/hana/*.svg|png`, 392장)을 그대로 쓴다. 손으로 그린 벡터는 없다.
- 좌표·크기·색은 Figma 값 그대로. 근사·단순화 없음.
- Figma 레이어명을 `id="<접두어>-<레이어명>"` · `class="<접두어>-<레이어명>"` · `data-name` 에 보존하고,
  스타일 훅은 노드 id 기반 유일 클래스(`n1_5326`)로 건다.

---

## 파이프라인

```
1) Figma MCP 로 원본을 받아 둔다 (받아 둔 결과가 이 폴더에 있다)
   get_design_context(forceCode) → dc-<node>.txt   (React+Tailwind 참조 코드 + 에셋 URL)
   get_metadata(0:1)             → meta-page.xml   (화면 통짜 — 텍스트 상자 고정·검증 기준)
   get_metadata(1:61879)         → meta-1-61879.xml(공용 Header 컴포넌트 안쪽)

   ※ MCP 응답이 커서 JSON 배열로 저장된다 → `node unwrap.js <in.json> <out>` 로 평문으로 편다.
   ※ 화면이 크면 get_design_context 가 코드 대신 메타데이터만 준다 → `forceCode: true` 필수.

2) node dl.js              dc-*.txt 의 에셋 URL 516개를 내려받아 src/hana/ 에 저장
                           (내용 해시로 중복 제거 → 고유 392장, asset-map.json)
3) node mk-nodes.js        meta-page.xml → nodes.json (브라우저 노드 상자 대조용, 6,510개)
4) node mk-light-assets.js 어두운 바탕 전제 벡터 → *-lt.svg (라이트 사본 318장)
5) node conv.js            ★ 본체 — dc-*.txt → src/hana-*.js + src/hana/*.html
6) node check-assets.js    생성물이 가리키는 에셋이 다 있는지 확인(404 잡기)
```

`conv.js` 를 고쳐 다시 돌리는 게 정석이다. **생성물(`src/hana-*.js`)을 손으로 고치지 말 것.**

`conv.js` · `light.js` · `dl.js` 등은 한진(`src/hanjin/_gen/`)에서 복사한 뒤
`patch-*.js` 로 이 파일에 맞게 넓힌 것이다. 다시 만들 일이 생기면 한진 것을 복사한 뒤 patch 를 순서대로 돌리면 된다.

| patch | 무엇을 고치나 |
|---|---|
| `patch-branches.js` | 컴포넌트가 `if (status === "hover") { return (…) }` 꼴로 **상태마다 일찍 돌려보내는** 형태까지 파싱 |
| `patch-takeelement.js` | 태그 끝(`>`) 찾기를 따옴표·`{}` 를 존중하게 — **속성 안의 인라인 SVG** 때문에 형제가 삼켜지던 버그 |
| `patch-classes.js` | 이 파일에만 나오는 Tailwind 유틸(`rotate-30` `skew-x-30` `scale-y-87` `mix-blend-color-burn` …) |
| `patch-light.js` | 라이트 대응표를 이 시안 팔레트(짙은 초록)로 교체, 무채색 기준 색상 218° → 168° |
| `patch-live.js` / `patch-live2.js` | 시계 표기·이벤트 접기·라이브 연출·헤더 메뉴를 이 시안에 맞게 |
| `patch-studio.js` / `patch-studio2.js` | index.html 연결(템플릿 카드·화면 14장·테마·색·패널편집) |

### 이 파일에서 새로 배운 함정

- **태그 끝을 '첫 `>`' 로 찾으면 안 된다.** Figma 는 그라디언트를
  `style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 …'>…\")" }}` 로 낸다.
  속성 안의 `>` 를 태그 끝으로 보면 `<div … />` 의 자기닫힘 판정이 틀어져 **형제 노드가 자식으로 빨려 들어간다.**
  그 결과 `Content`(1:5329)가 `Header`(1:5328) 안으로 들어가 `top: calc(20% + 35px)` 가 80px 기준으로 풀리면서
  화면 전체가 200px 위로 올라갔다. → `tagEnd()` 가 따옴표·`{}` 를 건너뛰며 진짜 `>` 를 찾는다.
- **컴포넌트가 상태마다 일찍 돌려보낸다.** 한진은 컴포넌트당 `return (…)` 하나였는데
  이 파일은 `if (status === "hover") { return (…) } if (status === "active") { return (…) } return (…)` 꼴이다.
  가지를 전부 모아 두고 펼칠 때 props 로 조건을 **실제로 평가**해 고른다.
- **인스턴스 안쪽에는 `data-name` 이 안 붙는 자리가 있다.** 헤더의 날짜·시간이 그렇다
  → 노드 id 로도 찾는다(`[data-node-id$="1:61838"]`).
- **이벤트 현황 패널이 삐져나온 양이 화면마다 다르다.** 한진처럼 -269px 로 고정하면 안 되고
  판이 화면 아래로 나간 만큼을 **재서** `--hn-lift` 로 올린다. 올릴 때는 `transform` 이 아니라
  CSS `translate` 속성을 쓴다 — 원본의 `translateX(-50%)` 를 덮어쓰지 않으려고.
- **원격 라이브러리 컴포넌트가 많다.** 화면 노드의 약 79%가 인스턴스 안쪽이라 Figma 에서 레이어명을 못 바꾼다
  (플로우 서버 아이콘·상단 헤더의 GNB 버튼·이벤트 행 등). 그래서 DOM 에도 원본 컴포넌트의 옛 이름
  (`item`, `list`, `row`, `txt`)이 그대로 남아 있다. 라이브러리 파일을 받으면 그쪽에서 고쳐야 한다.

---

## 검증

### ① 노드 상자 대조 (기하)
```
node src/hana/_gen/serve.js 5510      # http://localhost:5510/src/hana/overview-02.html
```
```js
// 1920x1080 으로 띄운 뒤
const N = await (await fetch('/src/hana/_gen/nodes.json')).json();
[...document.querySelectorAll('[data-node-id]')].filter(el => {
  const m = N[el.dataset.nodeId]; if (!m) return false;
  if (getComputedStyle(el).display === 'contents') return false;
  const r = el.getBoundingClientRect();
  return Math.abs(r.width - m[1]) > 1.2 || Math.abs(r.height - m[2]) > 1.2;
});
```
Overview 01(제외 전 측정) 기준 잴 수 있는 610노드 중 83개가 1.2px 초과 — 대부분 ±1.3~2.7px 로
브라우저 글꼴 메트릭 차이다(Figma 렌더러 vs Chrome). 판·표·차트의 자리와 크기는 원본과 같다.

### ② 라이트 대비
`?t=light` 로 열어 글자/바탕 대비를 재면 Overview 01(제외 전 측정) 의 글자 300개 중 3:1 미만은 5개인데
전부 반투명 오버레이 위에 놓인 글자라 실제로는 흰 판 위에서 읽힌다(측정 방식의 한계).

---

## 스튜디오 연결 (`index.html`)

- 템플릿 `Dashbord:HANA Bank-H.I.T` → `tpl:'hana'`, 슬라이드 14장이 화면 14개(`tplScene` = 화면 키)로 만들어진다.
- `applyHanaDT(key)` 가 `#dtStage` 에 `.<접두어>-root` 를 얹고 `initHana` 를 부른다.
- 화면 안 **헤더 메뉴**(종합현황·클라우드·미들웨어·인프라·이벤트·네트워크·상면관리)를 누르면
  실제로 그 화면으로 이동한다(`hana-live.js` 의 `installHanaMenu` → `window.__openHanaScreen`).
  아직 시안이 없는 `운영관리` 는 막고 마우스를 올렸을 때만 흐려진다.
- **화면 테마** 다크/라이트 → `TPLTINT.icheonTint(…, HANA_OPT)` 가 `data-theme` 을 바꾼다(`wemb-hana-mode`).
- **색 정하기** → 같은 함수가 시트의 색을 팔레트로 옮긴다. 시작값(`#009178`)이 그대로인 동안은
  원본 색을 그대로 보여 주고, 색을 바꾸는 순간부터 따라온다.
- **패널편집** → `DTSEL` 에 14개 접두어의 `p` 가 들어 있어 화면의 모든 글자를 그 자리에서 고칠 수 있다
  (종합현황02 기준 307개).
- **반응형** — 1920x1080 기준을 유지한 채 캔버스만 넓혀 여백 없이 채운다(통짜 축소 아님).
  작업 영역 1568x1032 에서 루트가 정확히 그 크기를 채운다.

## 인터랙션·라이브 (`src/hana-live.js`)

한진 엔진(`src/hanjin-live.js`)을 이식(`hj`→`hn`)한 뒤 이 시안 몫을 얹었다.
- **실시간 시계** — `2026-09-08(화)` + `09:00:00` 매초 갱신
- **마우스 오버/눌림** — 메뉴·탭·버튼·옵션·아이템(31곳/화면)
- **이벤트 현황 접기·펼치기** — ▲/▼ 를 누르면 서랍처럼 올라온다(올릴 양은 재서 정한다)
- **라이브 연출** — KPI·게이지·도넛·측정값이 원본 값 언저리에서 흔들리고, 꺾은선은 데이터 층이 흐르며
  툴팁이 가로로 훑는다. 실린더 게이지는 쌓인 원판 수가 바뀐다. 전부 CSS transition/rAF 라
  패널편집·테마 전환과 충돌하지 않는다(`editing()` 중에는 멈춘다).

---

## 종합현황01 제외 (2026-09-08)

`Screen/Overview 01`(`1:5326` · 접두어 `hno1`)은 사용자 요청으로 템플릿에서 뺐다.
- 생성기 `conv.js`/`dl.js`/`patch-studio.js` 의 SCREENS 에서 제거 → 다시 돌려도 안 만들어진다.
- 생성물 `src/hana-overview-01.js` · `src/hana/overview-01.html` · 썸네일 `src/templates/hana-overview-01.jpg` 삭제.
- index.html 은 `node src/hana/_gen/patch-drop-overview01.js` 로 정리했다(스크립트 태그·HN_SCREENS·
  루트 목록·색 정하기 접두어·패널편집 대상·슬라이드·대표 썸네일·'스튜디오 열기' 화면 목록).
- 빠진 자리의 **대표 화면은 종합현황02**(`overview-02`)다 — 기본 화면, 카드 썸네일, 헤더 메뉴 `종합현황` 목적지가 모두 그쪽으로 간다.
- **원본은 남겨 뒀다**: `_gen/dc-1-5326.txt` 와 `meta-page.xml` 안의 노드. 되살리려면 `conv.js` 의 SCREENS 에
  그 줄을 다시 넣고 `patch-studio.js` 를 다시 돌리면 된다(Figma 프레임도 그대로 있다).

## 조건식이 글자로 새던 버그 (2026-09-08)

종합현황 **주요거래 플로우**의 서버 심볼 뒤에 `status === "Default" &&` 라는 글씨가 겹쳐 보였다.

원본이 `{type === "server" && status === "Default" && <img … />}` 처럼 **조건을 이어 붙인** 형태인데,
`splitAnd` 가 **첫** `&&` 에서 잘라 `cond="type === \"server\""` / `body="status === \"Default\" && <img/>"` 를 만들었다.
그 body 를 JSX 로 파싱하니 앞의 조건식이 **텍스트 노드**가 되어 화면에 찍혔고,
동시에 `<img>` 가 status 와 무관하게 **항상** 깔렸다(엉뚱한 상태 그림이 겹쳐 있었다).

→ `patch-splitand.js`: 오른쪽이 JSX(`<` 또는 `(`)인 **마지막** `&&` 에서 자르고, 왼쪽(`A && B`)을 통째로 평가한다.
`scan-leaks.js` 로 14화면 전부 재검사 — 조건식·비교식·삼항·`undefined`·템플릿 리터럴이 텍스트로 샌 곳 0건.
해당 조건식은 `dc-1-5326.txt`(제외된 종합현황01)와 `dc-1-7175.txt`(종합현황02)에만 있었고,
02 는 다시 뽑고 썸네일도 다시 찍었다.

## 위험 상태 심볼 깜빡임 (2026-09-08)

"변화가 있다(위험 감지)"를 알리기 위해, 평상 상태가 아닌 심볼만 숨 쉬듯 깜빡이게 했다.

- **상태를 DOM 에 남긴다** — `patch-status-attr.js` 가 conv.js 를 넓혀, 컴포넌트를 펼칠 때 그 자리의
  `status`(오타 prop `stauts` 포함)·`type` 을 `data-hn-status` / `data-hn-type` 으로 붙인다.
  원본 시안은 상태가 '어떤 그림을 쓰느냐'로만 박제돼 있어 DOM 만 보고는 정상/위험을 구분할 수 없었다.
- **깜빡이는 대상** — `warning` · `major` · `critical` 뿐(전 화면 36개).
  `normal`(153) · `default`(73+1) · `basic`(165) · `정상` · `green` · `active` 등 평상 상태는 원본 그대로 가만히 있는다.
  이벤트 로그의 한글 등급(`심각`·`주의`·`경계`)과 표 안 색점(`red`·`yellow`)도 건드리지 않는다 — 표가 소란스러워진다.
- **어떻게** — `patch-risk-blink.js` 가 `hana-live.js` 에 `@keyframes hnRisk` 를 넣는다.
  투명도와 아주 약간의 크기만 오간다. **색·형상·자리는 원본 그대로다.**
  크기는 `transform` 이 아니라 CSS `scale` 속성이라 원본 transform 을 덮지 않는다.
- **등급이 올라갈수록 빠르고 깊게** — warning 2.3s/0.64, major 1.7s/0.55, critical 1.25s/0.45.
  라이트 테마는 바탕이 밝아 같은 투명도면 덜 보이므로 조금 더 깊게 준다(0.5/0.42/0.34).
- **패널편집 중에는 멈춘다**(`installRiskEditGuard` → `.hn-editing`) — 글자를 고치는 동안 시선이 튀지 않게.
- 움직임 줄이기 설정(`prefers-reduced-motion`)에서는 기존 규칙이 애니메이션을 그대로 끈다.

화면별 위험 심볼: 인프라상세 9 · 보안시스템02 8 · 보안시스템01 6 · 미들웨어 5 · 네트워크03 5 · 인프라메인 2 · 종합현황02 1.

## 실린더 게이지 원판 낙하 + 숫자 줄바꿈 (2026-09-08)

### 원판이 위에서 떨어져 쌓인다
구간별 성능현황의 실린더는 통짜 `<img>`(visual-*.svg) 라 안쪽 원판을 만질 수 없었다.
→ `patch-inline-gauge.js` 가 그 5종(`visual-5 · 1-2 · 2-2 · 3-2 · 4-2`)을 `INLINE_SVG` 에 넣어 인라인 `<svg>` 로 심는다.
Figma 레이어명이 SVG `id` 로 살아 있어서 `<g id="Disk">…<g id="Disk_8">` 를 그대로 집을 수 있다(화면당 47개).

- `patch-disk-drop.js` 가 `@keyframes hnDisk` 를 넣는다. **중력처럼 가속해서 내려오다**(구간별 `ease-in`)
  바닥에서 눌리고(`scaleY .84`) 한 번 튕긴 뒤 가라앉는다 — 낙하 0.62s.
  `transform-origin` 은 `50% 100%` + `transform-box: fill-box` 라 **각 원판이 자기 아래쪽을 축으로** 눌린다
  (fill-box 를 빼면 뷰박스 기준이 되어 위 칸까지 같이 찌그러진다).
- **전체가 쏟아지는 건 첫 진입 때 한 번뿐이다.** 원판마다 `--hn-i` 를 매겨
  `animation-delay: var(--hn-i) * 70ms` 로 아래부터 차례로 닿고, 게이지끼리도 85ms 씩 밀려
  9개가 왼쪽부터 촥촥 이어진다(빈 실린더에 차오르는 연출).
- **그 뒤로는 맨 위 칸만 만진다** — 데이터가 들어오는 모습처럼. 0.6초마다 그 게이지의 숫자 셋
  (개수·TPS·응답시간)을 읽고, 하나라도 바뀌면:
  - 칸이 **늘면** 그만큼 맨 위에 새로 얹힌다(`hnDisk`, 스며들며 떨어짐)
  - 칸이 **줄면** 위에서부터 사그라든다(`hnDiskOut`)
  - 칸 수가 **그대로면** 맨 위 칸 하나만 톡 하고 다시 앉는다(`hnDiskRe`)
  값이 흐르는 동안(tween)에는 글자가 매 프레임 달라지므로 `dirty` 로만 표시해 두고, **멎은 뒤 한 번만** 친다
  (안 그러면 0.6초마다 애니메이션이 끊겨 다시 시작된다).
- **재낙하는 투명도를 건드리지 않는다**(`hnDiskRe`) — 매번 `opacity 0` 에서 시작하게 했더니
  숫자가 바뀔 때마다 실린더가 잠깐 비어 **깜빡임처럼** 보였다. 새로 얹히는 칸만 스며든다.
- 실측(18초): 원판 애니메이션 48회(맨 위 칸 나감 16 · 새 칸 9 · 맨 위 톡 23) 중 **83% 가 위 2칸 안**,
  254회 표본에서 **빈 게이지 0회**. 첫 진입 때만 43~47칸이 한꺼번에 떨어진다.
- **쌓인 칸 수**는 개수 값이 기준보다 내려간 비율(`(base-cur)/span`, 0~1)만큼 위 칸이 빈다.
  비우는 최대 칸 수는 그 실린더가 가진 칸 수에 비례한다(`round(n × 0.34)` → 8칸 3 · 6칸 2 · 2~3칸 1).
  칸이 적은 실린더까지 같은 수를 비우면 절반이 사라져 원본과 너무 달라 보인다.
  빠지는 칸은 그 자리에서 사그라들고(`hnDiskOut`), **남아 보이는 칸은 전부 다시 떨어진다**.
- 가만히 있을 때(값이 기준 이상)는 원판이 전부 보이는 **원본 그림 그대로**다.
- 형상·색·자리는 원본 그대로 — 떨어지고 사그라드는 동안만 위치·투명도·세로 눌림이 오간다.

인라인하면서 같이 처리한 것
- **참조 id 고유화** — `visual-5` 는 3개 게이지가 나눠 쓴다. 그대로 심으면 `filter0_i_0_4820` 이 겹쳐
  두 번째 게이지가 첫 번째의 필터를 가리킨다 → 인라인마다 `i1-`, `i2-` … 접두어를 붙인다(한 화면 65개 전부 고유).
- **이름 색도 CSS 로** — 이 그림은 `fill="white"` · `fill="black"` 을 쓴다. hex 만 보던 `grab()` 을 넓혀
  라이트 대응이 생기게 했다(원래 `-lt` 사본이 하던 일을 인라인이 이어받는다).
- 통 이미지일 때와 인라인일 때 `backdrop-blur` 계열 필터가 미세하게 다르게 앉는다(인라인은 페이지 뒤를 샘플링).
  나란히 놓고 대조한 결과 육안 차이는 없다.

### 숫자가 아랫줄로 흘러내리던 것
`#hno2-Value_39`(거래건수)는 텍스트 상자 폭이 Figma 값(271px)으로 박혀 있어, 라이브로 값이 조금만 길어져도
`white-space:normal` 때문에 두 줄이 되면서 아래로 밀렸다. → 라이브가 값을 바꾸는 숫자에만 `.hn-num{white-space:nowrap}`.
상자 폭은 원본 그대로 두고 줄만 안 넘긴다.

## 꺾은선 툴팁 — 마우스를 올렸을 때만 (2026-09-08)

종합현황02 `#hno2-Content_3`(툴팁 말풍선)가 2.6초마다 저 혼자 좌우로 훑고 다녀서(`hn-sweep`)
가만히 볼 수가 없었다. → `patch-chart-hover.js` 가 그 자동 이동을 걷어낸다.

- **평소** — 툴팁은 Figma 원본이 그려 둔 자리에 **완전히 멈춰 있다**(실측 10초, 이동량 0px).
  실시간처럼 보이는 건 `[data-name="Data"]` 층뿐이다(`hn-flow`, 2.6초마다 `translateX(-6~0px) scaleY(.97~1.04)`).
- **마우스를 올리면** `installChartHover` 가 기준선(`Guide Line`)을 커서 x 에 붙인다. 손을 떼면 원래 자리로 돌아간다.
- **자리는 들어올 때 한 번만 잰다** — `transition` 을 잠깐 `none` 으로 두고 `transform` 을 비운 뒤 재고 되돌린다.
  매번 재면 되돌아가는 0.12초 전환 도중의 값을 읽어 손을 따라가는 위치가 흔들린다.
- **시안이 축소돼 있어도 손에 붙는다** — 화면 픽셀을 `k = plot rect폭 / offsetWidth` 로 나눠 배치 좌표로 옮긴다.
  실측: 미리보기(k=0.823) 오차 0~1px, 스튜디오 `#dtStage`(k=0.778) 오차 0px, 손 뗀 뒤 원래 자리 복귀 정확.
- 커서는 `crosshair`, 따라올 때만 `transform .12s` 로 미끄러진다(평소엔 전환할 일 자체가 없다).
- 편집 중(`editing()`)에는 따라가지 않는다.

## 클라우드현황 바로잡기 + 성능 TOP10 라이브 (2026-09-08)

### ① 아이소메트릭 바닥판이 찌그러져 있었다 (`#hnc1-Node/*`)
두 가지가 겹쳤다. **둘 다 conv.js 의 일반 버그**라 다른 화면에도 같이 듣는다.

- **변환 합성 순서** — Tailwind 의 transform 은 클래스를 적은 순서가 아니라 늘
  `translate → rotate → skewX → skewY → scale` 순으로 합쳐진다. conv.js 는 나온 순서대로
  이어 붙여서 `-skew-x-30 … rotate-30` 이 `skewX(-30) rotate(30)` 이 됐다
  → `matrix(.577,.5,-1,.866)`. 바른 값은 `matrix(.866,.5,-1,.577)` — a·d 가 뒤바뀌어
  판이 눕지 않고 서 버렸다. `patch-transform-order.js` 가 합치기 직전에 정렬한다.
- **hypot() 크기가 6.8% 크다** — Figma 는 회전한 판을 `containerType:size` 상자로 감싸고
  `w-[hypot(56.155cqw,56.155cqh)]` 처럼 낸다. 두 백분율은 판의 가로:세로 비(p:q, p+q=1)이고
  상자는 **회전 후 bbox** 인데, `hypot(W,H)` 는 (w+h) 가 아니라 상자의 대각선이라 늘 크게 나온다.
  되돌리는 배율은 상자 크기를 몰라도 나온다 — 변환 행렬과 두 백분율만 있으면 된다:
  `A=|m11|p+|m12|q`, `B=|m21|p+|m22|q`, 배율 `s = 1/√(A²+B²)`.
  30° 아이소메트릭에서는 0.936475 다. `patch-iso-plate.js` 가 `calc(hypot(…) * s)` 로 적는다.
  실측: 여덟 판 모두 회전 후 bbox 가 컨테이너와 **오차 0.02px** 로 겹친다(원본 스크린샷과도 겹침).

### ② 성능 TOP10 이 아래 카드 위로 침범했다 (`#hnc1-List`)
`text-box-trim` 은 **상속되지 않는다** — 글자를 직접 담은 상자에만 걸린다.
그런데 Figma 는 트림 클래스를 바깥 래퍼(`flex flex-col justify-center`)에 적고 글자는 그 안의
`<p leading-normal>` 에 넣는다. 그대로 옮기면 래퍼에만 걸려 아무 일도 없고, 36px 숫자의 줄상자
43px 가 그대로 남는다 → 줄 높이가 33 이 아니라 43, 열 줄에 **100px** 이 밀렸다.
`patch-textbox-trim.js` 가 트림을 쓴 규칙마다 `>p,>span` 규칙을 함께 낸다.
실측: 줄 33px · 목록 474px · 판 546px — **Figma 메타데이터와 정확히 일치**(1:18684 / 1:18663).

### ③ 순위표가 살아 움직인다 (`patch-cloud-rank.js`)
- **숫자** — 호스트마다 원본 값에서 출발해 2초마다 흔들린다(±3.4, 12% 확률로 ±9, 31~99).
- **막대** — 50칸 띠. 칸마다 클래스가 달라서 색을 직접 칠하지 않고 **가운데 칸의
  '켠 클래스'/'끈 클래스' 를 바꿔 끼운다** → 라이트 테마·색 정하기가 그대로 따라온다
  (실측: 라이트에서 채운 칸 `#5bdcc6`, 빈 칸 `rgba(0,58,46,.09)`, 앞에서부터 한 덩어리).
  칸 수는 **원본 열 줄의 (값, 칸수) 를 이은 한 개의 자**로 정한다. 호스트마다 따로 재면
  아래 줄 막대가 위 줄보다 길어진다(원본 대응이 정비례가 아니다 — 96→42, 44→17, 가운데는 완만).
- **순위** — 값으로 다시 줄 세우고, 줄이 바뀌면 옮겨 간 만큼 되돌려 놓고 미끄러뜨린다(FLIP).
  **자리 자체는 애니메이션에 기대지 않는다** — 요소 스타일은 건드리지 않고 WAAPI(`fill:none`)로만
  그린다. 인라인 transform 으로 했더니 전환이 진행되지 않는 화면에서 줄이 옛 자리에 얼어붙어
  순위가 뒤죽박죽으로 보였다. 번호표는 옮긴 뒤 1~10 으로 다시 매기고 한 번 깜빡인다.
- 실측(조용한 구간 표본): 화면 순서 오름차순 · 번호 1~10 · 값 내림차순 · 막대 내림차순 **모두 일치**.

### 재는 요령 — 이 환경은 그리지 않으면 애니메이션 시계가 멈춘다
Playwright 세션이 프레임을 내지 않으면 `animate()` 가 `running@0` 에 머문다(재생 대기 상태).
`document.timeline` 은 도는데 애니메이션만 0 이면 그리지 않는 것이다 — 스크린샷을 찍거나
매 프레임 화면을 살짝 건드려 강제로 그리게 한 뒤 재야 한다. 안 그러면 멀쩡한 코드가
"멈춘 것처럼" 보여 엉뚱한 곳을 고치게 된다.

### ④ 한 줄이던 글자가 두 줄로 접히던 것 (`patch-nowrap-text.js`)
네트워크현황 x축 마지막 눈금 `16:00` 이 두 줄이 되어 판이 14px 씩 두꺼워졌다(네 판에 56px).

Figma 의 글자 상자는 글자 폭에 딱 맞게 잡혀 있고, 그 폭이 백분율(`w-[8.84%]`)로 넘어온다.
부모 폭이 원본보다 아주 조금 좁으면 상자가 글자보다 좁아지고, Figma 가 얹어 둔
`word-break: break-word` 가 물려 내려와 **콜론에서도 잘라** 두 줄이 된다.
실측: 필요한 폭 29.97px, 받은 폭 29.89px — **0.08px** 모자랐다(원본 상자 30.08px).

→ 원본에서 **한 줄이던** 글자(상자 높이가 글꼴 한 줄 높이)에는 줄바꿈을 막는다.
Figma 에서 안 접혔으면 여기서도 접히면 안 된다. 여러 줄이던 글자(2.3배쯤)는 걸리지 않는다.
한 줄 판정에 글꼴 크기가 필요한데 대개 조상에서 물려받으므로 `walk` 로 같이 내린다(`parentFont`).

실측: 눈금 36개 전부 14px(Figma 와 동일) · **14화면 텍스트 937개 중 Figma 높이와
4px 넘게 어긋난 것 0개** · 화면 밖으로 넘치는 요소 수는 이 변경 전과 완전히 동일.


### 생성기 재조립
이번에 `conv.js` 를 한 번 깨뜨렸다(치환 문자열의 `$&` 를 `String.replace` 가 '찾은 문자열'로 바꿔 버렸다).
그래서 **설정 단계까지 전부 패치 스크립트로 남겼다.** 이제 다음 순서로 언제든 다시 만들 수 있다.

```
cp ../../hanjin/_gen/conv.js .
node patch-config.js && node patch-branches.js && node patch-takeelement.js \
  && node patch-classes.js && node patch-splitand.js && node patch-status-attr.js \
  && node patch-inline-gauge.js && node patch-transform-order.js \
  && node patch-textbox-trim.js && node patch-iso-plate.js && node patch-nowrap-text.js && node conv.js

node patch-port-live.js && node patch-live.js && node patch-live2.js \
  && node patch-risk-blink.js && node patch-disk-drop.js && node patch-chart-hover.js \
  && node patch-cloud-rank.js
```

**패치를 쓸 때 지킬 것 두 가지**
- 치환은 항상 함수 치환자로: `s.replace(find, () => val)` — 문자열 치환자는 `$&`·`$1` 을 특수 패턴으로 먹는다.
- 여러 줄 앵커는 줄바꿈을 맞출 것 — `index.html` 과 `hanjin-live.js` 는 CRLF 다. LF 로 펴서 다루고 쓸 때 되돌린다.
