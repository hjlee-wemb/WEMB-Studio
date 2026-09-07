/* 한진 SMART 통합관제 3화면(Figma A11hAZefK5FSuEE9MagOgj)의 에셋을
   스튜디오 '에셋 라이브러리' 등록 목록(src/hanjin-assets.js)으로 만든다.

   ── 등록 단위는 '컴포넌트' 다 ──
   눈금선·막대 한 줄·배지 그림자 같은 **부품은 등록하지 않는다.** 라이브러리에서 꺼내 쓸 수 있는
   최소 단위는 위젯·차트·칩·심볼처럼 그 자체로 뜻이 서는 덩어리다.

   ── 왜 Figma 내보내기가 아니라 화면 DOM 에서 뽑나 ──
   1. 이 시안의 `Event Log`(이벤트 현황)는 화면 프레임 밖으로 269px 나가 있어(서랍처럼 올라오는 판)
      Figma 내보내기가 **보이는 61px 만 잘라서** 준다. 컴포넌트 정의는 라이브러리에 게시돼 있지 않다.
   2. 화면 재구축본(src/hanjin-*.js)에는 같은 컴포넌트가 **온전한 DOM 으로** 들어 있다.
      글자는 실제 텍스트라 '패널편집'으로 고칠 수 있고, 라이트 테마·'색 정하기'도 그대로 따라온다.
   그래서 이 파일은 **마크업을 복사해 두지 않는다.** 화면 빌더(window.build_hjc/hjg/hju)가 이미
   index.html 에 로드돼 있으므로, 등록 목록에는 노드 id 만 적고 라이브러리가 그때그때 잘라 쓴다.

   ── CSS 도 담지 않는다 ──
   화면 시트(window.HJC_CSS 등)는 index.html 이 이미 들고 있다. 등록 목록에는 어느 시트가 필요한지만
   적고, 라이브러리가 스튜디오와 같은 style#hjX-style 로 한 번만 붙인다.

   사용법:  node src/hanjin-assets/_gen/mk-assets.js
*/
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..', '..');
const OUT = path.join(ROOT, 'src', 'hanjin-assets.js');
const GEN = path.join(ROOT, 'src', 'hanjin', '_gen');

global.window = {};
require(path.join(ROOT, 'src', 'hanjin-control.js'));
require(path.join(ROOT, 'src', 'hanjin-gate.js'));
require(path.join(ROOT, 'src', 'hanjin-unload.js'));
const W = global.window;

const BASE = 'src/hanjin/';
const SCREEN = {
  hjc: { build: 'build_hjc', css: 'HJC_CSS', light: 'HJC_LIGHT_CSS', nodes: 'nodes-65-429.json', title: '통합관제' },
  hjg: { build: 'build_hjg', css: 'HJG_CSS', light: 'HJG_LIGHT_CSS', nodes: 'nodes-65-943.json', title: '입/출문현황' },
  hju: { build: 'build_hju', css: 'HJU_CSS', light: 'HJU_LIGHT_CSS', nodes: 'nodes-65-2243.json', title: '하차현황' },
};
const HTML = {}, NODES = {};
Object.keys(SCREEN).forEach((px) => {
  HTML[px] = W[SCREEN[px].build](BASE);
  NODES[px] = JSON.parse(fs.readFileSync(path.join(GEN, SCREEN[px].nodes), 'utf8'));
});

/* ── 화면 DOM 에서 노드 하나의 서브트리를 잘라 낸다(여는/닫는 태그 짝 세기) ── */
function sub(html, nid) {
  const at = html.indexOf('data-node-id="' + nid + '"');
  if (at < 0) return null;
  const start = html.lastIndexOf('<', at);
  const tag = /^<([a-zA-Z0-9]+)/.exec(html.slice(start, start + 20))[1];
  const open = new RegExp('<' + tag + '(?=[\\s>])', 'g');
  const close = new RegExp('</' + tag + '>', 'g');
  let depth = 0, i = start;
  while (i < html.length) {
    open.lastIndex = i; close.lastIndex = i;
    const o = open.exec(html), c = close.exec(html);
    if (!c) return null;
    if (o && o.index < c.index) { depth++; i = o.index + 1; continue; }
    depth--; i = c.index + 1;
    if (depth === 0) return html.slice(start, c.index + c[0].length);
  }
  return null;
}

/* ══════════════════ 등록 목록 ══════════════════
   px=화면 · nid=Figma 노드 id · name=스튜디오 표기(화면에 찍힌 한글 그대로)
   fig=Figma 레이어명(추적용). 이름 뒤에 화면을 덧붙이지 않는다 — 같은 이름이 겹칠 때만 구분한다. */
const ITEMS = {
  /* 그래프·계기 — 위젯 껍데기 없이 그림만 */
  charts: [
    { px: 'hjg', nid: '65:948', name: '작업현황 도넛', fig: 'Donut Chart < Widget/Unload Work' },
    { px: 'hju', nid: '65:2662', name: '진척률 게이지', fig: 'Gauge < Widget/Unload Progress' },
    { px: 'hju', nid: '65:2665', name: '진척률 미터', fig: 'Meter < Gauge' },
    { px: 'hju', nid: '65:2728', name: '요일별 막대차트', fig: 'Bar Chart < Widget/Daily Unload Volume' },
    { px: 'hju', nid: '65:2766', name: '층별 가로막대', fig: 'Bars < Widget/Vehicles by Floor' },
    { px: 'hjc', nid: '65:533', name: '방위 나침반', fig: 'Compass < Screen/Control Main' },
  ],
  /* 그 자체로 뜻이 서는 덩어리 — 칩·선택기·목록·단계 배지 */
  symbols: [
    { px: 'hjc', nid: '65:515', name: '기본위치 액션', fig: 'Map Action/Default View' },
    { px: 'hjc', nid: '65:524', name: 'RAMP숨김 액션', fig: 'Map Action/Hide Ramp' },
    { px: 'hjc', nid: '65:478', name: '차량 필터', fig: 'Vehicle Filter' },
    { px: 'hjc', nid: '65:644', name: '시점 프리셋', fig: 'View Presets(층 선택기+카메라 프리셋)' },
    { px: 'hjc', nid: '65:646', name: '카메라 프리셋', fig: 'Camera Presets < View Presets' },
    { px: 'hjc', nid: '65:650', name: '미니맵', fig: 'Minimap < Camera Presets' },
    { px: 'hju', nid: '65:2917', name: '대기 도크 그룹', fig: 'Dock Group/Waiting' },
    { px: 'hju', nid: '65:2947', name: '하차 도크 그룹', fig: 'Dock Group/Unload' },
    { px: 'hju', nid: '65:2970', name: '상차 도크 그룹', fig: 'Dock Group/Load' },
    { px: 'hjc', nid: '65:727', name: '단계 SUB미출발', fig: 'Stage/SUB Not Departed' },
    { px: 'hjc', nid: '65:737', name: '단계 간선', fig: 'Stage/Linehaul' },
    { px: 'hjc', nid: '65:747', name: '단계 허브인근', fig: 'Stage/Near Hub' },
    { px: 'hjc', nid: '65:757', name: '단계 입문', fig: 'Stage/Gate In' },
    { px: 'hjc', nid: '65:767', name: '단계 대기', fig: 'Stage/Waiting' },
    { px: 'hjc', nid: '65:777', name: '단계 접안', fig: 'Stage/Docking' },
    { px: 'hjc', nid: '65:787', name: '단계 하차중', fig: 'Stage/Unloading' },
    { px: 'hjc', nid: '65:797', name: '단계 하차예정', fig: 'Stage/Unload Due' },
    { px: 'hjc', nid: '65:807', name: '단계 하차완료', fig: 'Stage/Unload Done' },
    { px: 'hjg', nid: '65:2140', name: '단계 상차예정', fig: 'Stage/Load Due' },
    { px: 'hjg', nid: '65:2150', name: '단계 상차완료', fig: 'Stage/Load Done' },
    { px: 'hjg', nid: '65:2181', name: '단계 출문완료', fig: 'Stage/Gate Out Done' },
  ],
  /* 위젯 카드(머리글+본문) 통째로 */
  panels: [
    { px: 'hjc', nid: '65:555', name: '허브 인접 차량 목록', fig: 'Widget/Nearby Vehicles' },
    { px: 'hjc', nid: '65:706', name: '단계별 차량현황', fig: 'Widget/Stage Status' },
    { px: 'hjg', nid: '65:946', name: '하차작업 현황', fig: 'Widget/Unload Work' },
    { px: 'hjg', nid: '65:999', name: '상차작업 현황', fig: 'Widget/Load Work' },
    { px: 'hjg', nid: '65:1052', name: '입문 화물구성', fig: 'Widget/Gate In Cargo Mix' },
    { px: 'hjg', nid: '65:1089', name: '입문 차량구성', fig: 'Widget/Gate In Mix' },
    { px: 'hjg', nid: '65:1135', name: '입문 현황', fig: 'Widget/Gate In' },
    { px: 'hjg', nid: '65:1680', name: '출문 현황', fig: 'Widget/Gate Out' },
    { px: 'hjg', nid: '65:2064', name: '차량 단계현황', fig: 'Widget/Vehicle Stage' },
    { px: 'hjg', nid: '65:2121', name: '단계별 작업현황', fig: 'Widget/Work Stage' },
    { px: 'hju', nid: '65:2354', name: '도크 상세현황', fig: 'Dock Board' },
    { px: 'hju', nid: '65:2649', name: '하차진척률 증감현황', fig: 'Widget/Unload Progress' },
    { px: 'hju', nid: '65:2710', name: '요일별 하차물량', fig: 'Widget/Daily Unload Volume' },
    { px: 'hju', nid: '65:2832', name: '층별 차량현황', fig: 'Widget/Vehicles by Floor' },
    { px: 'hju', nid: '65:2911', name: '층별 도크 운영현황', fig: 'Widget/Dock Operation' },
  ],
  /* 이벤트 패널 — 판 전체와 그 안에서 따로 쓸 수 있는 덩어리들 */
  events: [
    { px: 'hjc', nid: '65:818', name: '이벤트 현황 패널', fig: 'Event Log', w: 1840, h: 330 },
    { px: 'hjc', nid: '65:819', name: '이벤트 헤더', fig: 'Header < Event Log' },
    { px: 'hjc', nid: '65:831', name: '이벤트 카운트', fig: 'Count Group < Event Log' },
    { px: 'hjc', nid: '65:838', name: '이벤트 표', fig: 'Table < Event Log' },
    { px: 'hjc', nid: '65:859', name: '이벤트 행', fig: 'Row < Body < Table' },
    { px: 'hjc', nid: '65:832', name: '이벤트 카운트 전체', fig: 'Count/All' },
    { px: 'hjc', nid: '65:833', name: '이벤트 카운트 위험', fig: 'Count/Critical' },
    { px: 'hjc', nid: '65:861', name: '이벤트 등급 위험', fig: 'Badge(Critical) < Row' },
    { px: 'hjc', nid: '65:875', name: '이벤트 등급 중대', fig: 'Badge(Major) < Row' },
    { px: 'hjc', nid: '65:889', name: '이벤트 등급 경미', fig: 'Badge(Minor) < Row' },
    { px: 'hjc', nid: '65:903', name: '이벤트 등급 주의', fig: 'Badge(Warning) < Row' },
    { px: 'hjc', nid: '65:917', name: '이벤트 등급 정상', fig: 'Badge(Normal) < Row' },
    { px: 'hjc', nid: '65:827', name: '이벤트 Auto 토글', fig: 'Auto Toggle < Header' },
    { px: 'hjc', nid: '65:3129', name: '이벤트 접기 버튼', fig: 'Fold Button < Header (변형 펼친 노드)', w: 39, h: 28 },
  ],
};

/* 아이콘 — 화면이 쓰는 원본 파일이 이미 최소 단위다(다시 그리지 않고 경로만 참조).
   파일은 배경 없는 투명 SVG 라 썸네일도 그대로 투명하다. */
const ICONS = [
  ['icon.svg', '위치 아이콘', 'Icon/Map/Location'],
  ['icon-map-ramp.svg', 'RAMP 아이콘', 'Icon/Map/Ramp'],
  ['icon-action-view-off.svg', '숨김 아이콘', 'Icon/Action/View Off'],
  ['icon-action-collapse.svg', '접기 아이콘', 'Icon/Action/Collapse'],
  ['icon-action-search.svg', '검색 아이콘', 'Icon/Action/Search'],
  ['icon-action-calendar.svg', '달력 아이콘', 'Icon/Action/Calendar'],
  ['icon-action-close.svg', '닫기 아이콘', 'Icon/Action/Close'],
  ['icon-system-clock.svg', '시계 아이콘', 'Icon/System/Clock'],
  ['icon-dock-waiting.svg', '도크 대기 아이콘', 'Icon/Dock/Waiting'],
  ['icon-dock-unload.svg', '도크 하차 아이콘', 'Icon/Dock/Unload'],
  ['icon-dock-load.svg', '도크 상차 아이콘', 'Icon/Dock/Load'],
  ['icon-stage-sub-not-departed.svg', 'SUB미출발 아이콘', 'Icon/Stage/SUB Not Departed'],
  ['icon-stage-linehaul.svg', '간선 아이콘', 'Icon/Stage/Linehaul'],
  ['icon-stage-near-hub.svg', '허브인근 아이콘', 'Icon/Stage/Near Hub'],
  ['icon-stage-gate-in.svg', '입문 아이콘', 'Icon/Stage/Gate In'],
  ['icon-stage-waiting.svg', '대기 아이콘', 'Icon/Stage/Waiting'],
  ['icon-stage-unloading.svg', '하차중 아이콘', 'Icon/Stage/Unloading'],
  ['icon-stage-unload-due.svg', '하차예정 아이콘', 'Icon/Stage/Unload Due'],
  ['icon-stage-unload-done.svg', '하차완료 아이콘', 'Icon/Stage/Unload Done'],
  ['icon-stage-load-due.svg', '상차예정 아이콘', 'Icon/Stage/Load Due'],
  ['icon-stage-load-done.svg', '상차완료 아이콘', 'Icon/Stage/Load Done'],
  ['icon-stage-gate-out-done.svg', '출문완료 아이콘', 'Icon/Stage/Gate Out Done'],
];

/* ── 컴포넌트가 실제로 쓰는 클래스만 모은다 ── */
const used = { hjc: new Set(), hjg: new Set(), hju: new Set() };
const report = [];
const out = { charts: [], symbols: [], panels: [], events: [], icons: [] };
let miss = 0;

Object.keys(ITEMS).forEach((cat) => {
  ITEMS[cat].forEach((it) => {
    const html = sub(HTML[it.px], it.nid);
    if (!html) { console.error('  !! 못 찾음: ' + it.px + ' ' + it.nid + ' (' + it.name + ')'); miss++; return; }
    [...html.matchAll(/class="([^"]*)"/g)].forEach((m) => m[1].split(/\s+/).forEach((c) => c && used[it.px].add(c)));
    const meta = NODES[it.px][it.nid] || [];
    out[cat].push({
      id: 'hj_' + it.nid.replace(':', '_'),
      name: it.name,
      fig: it.fig + ' (' + it.nid + ')',
      px: it.px,
      nid: it.nid,
      w: it.w || Math.round(meta[1] || 0),
      h: it.h || Math.round(meta[2] || 0),
    });
    report.push([cat, it.px, it.nid, (it.w || Math.round(meta[1] || 0)) + 'x' + (it.h || Math.round(meta[2] || 0)), String(html.length), it.name]);
  });
});

ICONS.forEach(([file, name, fig]) => {
  const p = path.join(ROOT, BASE, file);
  if (!fs.existsSync(p)) { console.error('  !! 파일 없음: ' + BASE + file); miss++; return; }
  out.icons.push({ id: 'hj_' + file.replace(/\.svg$/, '').replace(/-/g, '_'), name, fig, src: BASE + file });
});
/* ── CSS 는 담지 않는다 ──
   화면 CSS 세 벌은 이미 index.html 이 <script>(src/hanjin-*.js)로 들고 있다(window.HJC_CSS 등).
   여기에 또 담으면 같은 800KB 를 한 벌 더 지고 다니는 꼴이라, 등록 목록에는 **어느 화면 시트가
   필요한지만** 적고 라이브러리가 그때 붙인다(스튜디오가 시안을 얹을 때 쓰는 style#hjX-style 과
   같은 id 라 두 번 붙지 않는다). 시트는 `.hjX-root` 안으로 스코프돼 있어 라이브러리 밖으로 새지 않는다. */
const head =
  '/* 자동 생성물 — 한진 SMART 통합관제 3화면(Figma A11hAZefK5FSuEE9MagOgj)의 에셋 라이브러리 등록 목록.\n' +
  '   등록 단위는 컴포넌트다(부품은 넣지 않는다).\n' +
  '   마크업도 CSS 도 복사해 두지 않는다 — 화면 빌더(build_hjc/hjg/hju)의 DOM 에서 노드 id 로 그때그때\n' +
  '   잘라 쓰고, 시트는 window.HJC_CSS 등 이미 로드된 것을 붙인다. 그래서 글자는 실제 텍스트 그대로고\n' +
  "   ('패널편집'으로 고칠 수 있다) 라이트 테마·'색 정하기'도 화면과 똑같이 따라온다.\n" +
  '   생성기: src/hanjin-assets/_gen/mk-assets.js — 손으로 고치지 말고 다시 돌릴 것. */\n';

const js =
  head +
  'window.__HANJIN_ASSETS = ' +
  JSON.stringify({
    base: BASE,
    /* px → 화면 빌더·시트의 전역 이름. 라이브러리가 이 이름으로 DOM 과 CSS 를 가져간다. */
    screens: {
      hjc: { build: 'build_hjc', css: 'HJC_CSS', light: 'HJC_LIGHT_CSS', title: SCREEN.hjc.title },
      hjg: { build: 'build_hjg', css: 'HJG_CSS', light: 'HJG_LIGHT_CSS', title: SCREEN.hjg.title },
      hju: { build: 'build_hju', css: 'HJU_CSS', light: 'HJU_LIGHT_CSS', title: SCREEN.hju.title },
    },
    charts: out.charts,
    symbols: out.symbols,
    icons: out.icons,
    panels: out.panels,
    events: out.events,
  }, null, 1) + ';\n';

fs.writeFileSync(OUT, js, 'utf8');

const kb = (n) => (n / 1024).toFixed(1) + 'KB';
console.log('등록: 차트 ' + out.charts.length + ' · 심볼 ' + out.symbols.length + ' · 아이콘 ' + out.icons.length +
  ' · 패널 ' + out.panels.length + ' · 이벤트 패널 ' + out.events.length + (miss ? '  (실패 ' + miss + ')' : ''));
console.log('파일: src/hanjin-assets.js ' + kb(js.length) + ' (마크업·CSS 를 안 담아 목록만)');
console.log('\ncat      px   node        size        markup  name');
report.forEach((r) => console.log(r[0].padEnd(8) + r[1] + '  ' + r[2].padEnd(10) + r[3].padEnd(12) + r[4].padStart(7) + '  ' + r[5]));
