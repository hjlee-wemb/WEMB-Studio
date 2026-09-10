/* 스튜디오(index.html)에 HANA 에셋 라이브러리를 물린다.
   ─────────────────────────────────────────────────────────────────────────────
   한진이 쓰던 '화면 DOM 을 잘라 쓰는' 장치를 그대로 재사용한다(.hj-asset / hjDom / hjFit).
   그 장치는 화면 접두어만 알면 되는 일반 코드라, HANA 화면 registry 를 합쳐 주면 그대로 듣는다.
   · 썸네일 배경 투명 — 화면 뿌리(.hnXX-root)가 갖는 '화면 전체를 덮는' 성질(배경·절대배치)을 끈다.
   · index.html 은 전부 CRLF 다 — LF 로 펴서 다루고 쓸 때 되돌린다.                        */
const fs = require('fs');
const path = require('path');
const F = path.join(__dirname, '..', '..', '..', 'index.html');
let s = fs.readFileSync(F, 'utf8');
const CR = String.fromCharCode(13);
const NL = String.fromCharCode(10);
s = s.split(CR + NL).join(NL);
const put = (find, val) => { s = s.replace(find, () => val); };

if (s.indexOf('__HANA_ASSETS') >= 0) { console.log('already patched'); process.exit(0); }

const PX = ['hno2', 'hnc1', 'hnc2', 'hnm', 'hni1', 'hni2', 'hne', 'hnn1', 'hnn2', 'hnn3', 'hnf', 'hns1', 'hns2', 'hnl'];

/* ── ① 등록 목록 스크립트 ── */
const TAG = '    <script src="src/hana-overview-02.js?v=2"></script>';
if (s.indexOf(TAG) < 0) { console.error('script anchor not found'); process.exit(1); }
put(TAG, [
  '    <!-- HANA Bank H.I.T 에셋 라이브러리 등록 목록(차트·심볼·아이콘·패널·이벤트 패널).',
  '         마크업도 CSS 도 담지 않는다 — 아래 화면 빌더의 DOM 에서 노드 id 로 잘라 쓴다.',
  '         생성기: src/hana-assets/_gen/mk-assets.js -->',
  '    <script src="src/hana-assets.js?v=1"></script>',
  TAG,
].join('\n'));

/* ── ② 썸네일 배경을 투명하게 ── */
const CSS_OLD = [
  '      .hj-asset.hjc-root,',
  '      .hj-asset.hjg-root,',
  '      .hj-asset.hju-root {',
].join('\n');
if (s.indexOf(CSS_OLD) < 0) { console.error('css anchor not found'); process.exit(1); }
put(CSS_OLD, [
  '      .hj-asset.hjc-root,',
  '      .hj-asset.hjg-root,',
  '      .hj-asset.hju-root,',
].concat(PX.map((p, i) => '      .hj-asset.' + p + '-root' + (i === PX.length - 1 ? ' {' : ','))).join('\n'));

/* 화면 뿌리 밑에 배경 층(Background)을 따로 둔 시안이 있다 — 썸네일에서는 그것도 걷어낸다.
   (한진은 뿌리에만 배경이 있어 필요 없었다) */
const CSS_TAIL = '      /* 컴포넌트 뿌리는 화면 좌표에 절대배치돼 있다 — 그 자리 지정만 풀고 속은 그대로 둔다 */';
if (s.indexOf(CSS_TAIL) < 0) { console.error('css tail anchor not found'); process.exit(1); }
put(CSS_TAIL, [
  '      /* 화면 전체를 덮는 배경 층은 썸네일에서 걷어낸다 — 바탕은 무조건 투명해야 한다.',
  '         (컴포넌트 자신의 면색·테두리는 그대로 남는다) */',
  '      .hj-asset > [data-name="Background"],',
  '      .hj-asset > [data-name="Base"] {',
  '        display: none !important;',
  '      }',
  CSS_TAIL,
].join('\n'));

/* ── ③ 화면 registry 합치기 — 한진 장치가 HANA 접두어도 알아보게 ── */
const REG_OLD = "          const HJ = window.__HANJIN_ASSETS || { screens: {}, charts: [], symbols: [], icons: [], panels: [], events: [] };";
if (s.indexOf(REG_OLD) < 0) { console.error('registry anchor not found'); process.exit(1); }
put(REG_OLD, [
  REG_OLD,
  '          /* ── HANA Bank H.I.T 14화면의 컴포넌트 에셋 ──',
  '             한진과 같은 장치를 쓴다(화면 DOM 에서 노드 id 로 잘라 쓰기) — 등록 목록만 다르다.',
  '             화면 registry 를 합쳐 두면 hjScreenHtml/hjDom 이 접두어만 보고 그대로 처리한다. */',
  '          const HN = window.__HANA_ASSETS || { screens: {}, charts: [], symbols: [], icons: [], panels: [], events: [] };',
  '          const DOM_SCREENS = Object.assign({}, HJ.screens || {}, HN.screens || {});',
].join('\n'));

/* hjScreenHtml 이 합친 registry 와 화면별 base 를 보게 한다 */
const SH_OLD = [
  '            const S = (HJ.screens || {})[px];',
].join('\n');
if (s.indexOf(SH_OLD) < 0) { console.error('screenHtml anchor not found'); process.exit(1); }
put(SH_OLD, '            const S = DOM_SCREENS[px];');

const BUILD_OLD = "            return (hjHtmlCache[px] = build(HJ.base || 'src/hanjin/'));";
if (s.indexOf(BUILD_OLD) < 0) { console.error('build anchor not found'); process.exit(1); }
put(BUILD_OLD, "            return (hjHtmlCache[px] = build(S.base || HJ.base || 'src/hanjin/'));");

/* ── ④ 탭에 등록 ── */
const P_OLD = "              .concat(hjItems(HJ.panels, 'panel')),";
if (s.indexOf(P_OLD) < 0) { console.error('panel cat anchor not found'); process.exit(1); }
put(P_OLD, [
  "              .concat(hjItems(HJ.panels, 'panel'))",
  "              .concat(hjItems(HN.panels, 'panel')),",
].join('\n'));

const E_OLD = "            event: hjItems(HJ.events, 'event')";
if (s.indexOf(E_OLD) < 0) { console.error('event cat anchor not found'); process.exit(1); }
put(E_OLD, "            event: hjItems(HJ.events, 'event')\n              .concat(hjItems(HN.events, 'event'))");

const S_OLD = "              .concat(hjItems(HJ.symbols, 'symbol')),";
if (s.indexOf(S_OLD) < 0) { console.error('symbol cat anchor not found'); process.exit(1); }
put(S_OLD, [
  "              .concat(hjItems(HJ.symbols, 'symbol'))",
  "              .concat(hjItems(HN.symbols, 'symbol')),",
].join('\n'));

const I_OLD = "              .concat(hjIcons(HJ.icons, 'icon').filter(isIconNamed)),";
if (s.indexOf(I_OLD) < 0) { console.error('icon cat anchor not found'); process.exit(1); }
put(I_OLD, [
  "              .concat(hjIcons(HJ.icons, 'icon').filter(isIconNamed))",
  "              .concat(hjIcons(HN.icons, 'icon').filter(isIconNamed)),",
].join('\n'));

/* ── ⑤ 차트 탭 — 여기는 CATS 가 아니라 buildChartItems() 가 모은다 ── */
const C_OLD = [
  "            /* 한진 통합관제 3화면의 차트 — 화면 DOM 그대로 */",
  "            hjItems(HJ.charts, 'chart').forEach((a) => items.push(a));",
].join('\n');
if (s.indexOf(C_OLD) < 0) { console.error('chart list anchor not found'); process.exit(1); }
put(C_OLD, [
  C_OLD,
  '            /* HANA H.I.T 14화면의 차트 — 같은 방식 */',
  "            hjItems(HN.charts, 'chart').forEach((a) => items.push(a));",
].join('\n'));

fs.writeFileSync(F, s.split(NL).join(CR + NL));
console.log('patched index.html: HANA assets registered in the library');
