/* 공장 전력설비 화면(Figma hHans6kNFlTP98CO1O431o, Screen/Facility Overview)의 에셋을
   스튜디오 '에셋 라이브러리' 등록 목록(src/plant-assets.js)으로 만든다. 신한카드 생성기와 같은 규칙이다.

   · 등록 단위는 컴포넌트 — 그 자체로 뜻이 서는 덩어리만 올린다. 글자 한 줄 · 바탕 조각 같은 부품은 안 올린다.
   · 마크업도 CSS 도 복사하지 않는다 — 라이브러리가 build_pfo 의 DOM 에서 노드 id 로 잘라 쓴다.
     글자는 실제 텍스트라 패널편집 · 다크/라이트 · 색 정하기가 썸네일까지 따라온다.
   · GROUP(display:contents)은 상자가 없어 ox · oy 를 적는다 — 라이브러리 hjDom 이 1920x1080 판을 그만큼 당긴다.
   · 차트 탭은 비어 있다 — 이 시안에 차트가 없다. 패널편집의 추천 차트는 라이브가 그때그때 그리는 것이라 노드가 아니다.
   · w · h · ox · oy 는 브라우저에서 잰 값(sizes.json, measure.js)이다. 그림자까지 포함한 상자다.

   사용법: node src/plant-assets/_gen/mk-assets.js */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const OUT = path.join(ROOT, 'src', 'plant-assets.js');
const BASE = 'src/plant/';

global.window = {};
require(path.join(ROOT, 'src', 'plant-overview.js'));
const HTML = global.window.build_pfo(BASE);
const hasNode = (nid) => HTML.indexOf('data-node-id="' + nid + '"') >= 0;

const ITEMS = {
  charts: [],
  panels: [
    { nid: '16:4', name: '헤더 (전력설비)', fig: 'Header' },
    { nid: '7:457', name: '경보 목록 (전력설비)', fig: 'Widget/Event List' },
    { nid: '13:806', name: '설비현황 패널', fig: 'Widget/Equipment Status' },
    { nid: '13:894', name: '전기실 선택 패널', fig: 'Widget/Room Selector' },
    { nid: '13:1011', name: '안내 티커 (전력설비)', fig: 'Ticker' },
  ],
  events: [
    { nid: '6:250', name: '경보 표', fig: 'Table/Event List' },
    { nid: '6:266', name: '경보 표 줄', fig: 'Row/1' },
  ],
  symbols: [
    /* 3D 위 표지 */
    { nid: '9:490', name: '전기실 말풍선', fig: 'Callout/Electrical Room 1' },
    { nid: '9:491', name: '서버실 말풍선', fig: 'Callout/Server Room 1' },
    { nid: '9:489', name: '전기실 이름표', fig: 'Tag < Callout/Electrical Room 1' },
    { nid: '9:496', name: '서버실 이름표', fig: 'Tag < Callout/Server Room 1' },
    { nid: '9:533', name: '층 칩', fig: 'Chip/Floor Level' },
    /* 헤더 */
    { nid: '13:929', name: '브랜드 (전력설비)', fig: 'Brand' },
    { nid: '13:947', name: '날짜 · 시계', fig: 'Timestamp' },
    { nid: '13:901', name: '헤더 동작 아이콘 묶음', fig: 'Actions' },
    { nid: '13:956', name: '메뉴 항목 (전력설비)', fig: 'Nav Item/Electrical Room Status' },
    { nid: '13:957', name: '메뉴 항목 (켜짐)', fig: 'Nav Item/Switchgear Status (Hover)' },
    /* 경보 등급 */
    { nid: '7:456', name: '등급 건수 묶음', fig: 'Counts' },
    { nid: '7:440', name: '등급 칩 ALL (켜짐)', fig: 'Count/All (Selected)' },
    { nid: '7:432', name: '등급 칩 CR', fig: 'Count/Critical' },
    { nid: '7:424', name: '등급 칩 MA', fig: 'Count/Major' },
    { nid: '7:416', name: '등급 칩 MI', fig: 'Count/Minor' },
    { nid: '7:375', name: '등급 칩 WA', fig: 'Count/Warning' },
    { nid: '6:251', name: '경보 표 머리줄', fig: 'Header Row' },
    /* 트리 · 전기실 */
    { nid: '11:614', name: '배전반 항목 (선택)', fig: 'Tree Item/Panel 1 (Selected)' },
    { nid: '11:615', name: '배전반 항목', fig: 'Tree Item/Panel 2' },
    { nid: '12:784', name: '디바이스 하위 목록', fig: 'Sub List' },
    { nid: '13:869', name: '전기실 항목 (선택)', fig: 'Option/Electrical Room 1 (Selected)' },
    { nid: '13:873', name: '전기실 항목', fig: 'Option/Electrical Room 2' },
    { nid: '13:867', name: '전기실 지도', fig: 'Map Image' },
    /* 접기 */
    { nid: '7:351', name: '접기 단추 (가로)', fig: 'Fold Button < Widget/Event List' },
    { nid: '13:801', name: '접기 단추 (세로)', fig: 'Fold Button < Widget/Equipment Status' },
    { nid: '13:893', name: '접기 탭', fig: 'Fold Button < Widget/Room Selector' },
  ],
};

/* 파일 하나 = 아이콘 하나. 이름에 '아이콘' 이 있어야 아이콘 탭에 뜬다 */
const ICONS = [
  ['icon-action-user.svg', '사용자 아이콘', 'Icon/Action/User'],
  ['icon-action-logout.svg', '로그아웃 아이콘', 'Icon/Action/Logout'],
  ['icon-action-fold.svg', '접기 아이콘', 'Icon/Action/Fold'],
  ['badge.svg', '전기실 배지 아이콘', 'Badge < Callout/Electrical Room 1'],
  ['badge-1.svg', '서버실 배지 아이콘', 'Badge < Callout/Server Room 1'],
  ['marker.svg', '등급 CR 표지 아이콘', 'Marker < Count/Critical'],
  ['marker-1.svg', '등급 MA 표지 아이콘', 'Marker < Count/Major'],
  ['marker-2.svg', '등급 MI 표지 아이콘', 'Marker < Count/Minor'],
  ['marker-3.svg', '등급 WA 표지 아이콘', 'Marker < Count/Warning'],
  ['marker-4.svg', '선택 표지 아이콘', 'Marker < Tree Item/Panel 1 (Selected)'],
  ['marker-5.svg', '항목 표지 아이콘', 'Marker < Tree Item/Panel 2'],
  ['logo-mark.svg', 'WEMB 로고 아이콘', 'Logo Mark'],
];

const sizePath = path.join(__dirname, 'sizes.json');
const SIZES = fs.existsSync(sizePath) ? JSON.parse(fs.readFileSync(sizePath, 'utf8')) : {};
/* measure.js 가 읽는 목록 */
fs.writeFileSync(path.join(__dirname, 'nodes.json'), JSON.stringify(['charts', 'panels', 'events', 'symbols'].reduce((a, c) => a.concat(ITEMS[c].map((x) => x.nid)), [])));

const out = { charts: [], symbols: [], panels: [], events: [], icons: [] };
const report = [];
let miss = 0;
['charts', 'symbols', 'panels', 'events'].forEach((cat) => {
  ITEMS[cat].forEach((it) => {
    if (!hasNode(it.nid)) { console.error('  !! 못 찾음: ' + it.nid + ' (' + it.name + ')'); miss++; return; }
    const z = SIZES[it.nid];
    if (!z || !z.w || !z.h) { console.error('  !! 크기 없음: ' + it.nid + ' (' + it.name + ')'); miss++; return; }
    const a = { id: 'pf_pfo_' + it.nid.replace(/[:;]/g, '_'), name: it.name, fig: it.fig + ' (' + it.nid + ')', px: 'pfo', nid: it.nid, w: z.w, h: z.h };
    if (z.group) { a.ox = z.ox; a.oy = z.oy; }
    out[cat].push(a);
    report.push([cat, it.nid, z.w + 'x' + z.h + (z.group ? ' @' + z.ox + ',' + z.oy : ''), it.name]);
  });
});
ICONS.forEach(([file, name, fig]) => {
  if (!fs.existsSync(path.join(ROOT, BASE, file))) { console.error('  !! 파일 없음: ' + file); miss++; return; }
  if (HTML.indexOf('/' + file) < 0 && !/^marker-[45]\.svg$/.test(file)) { console.error('  !! 화면이 안 쓰는 파일: ' + file); miss++; return; }
  out.icons.push({ id: 'pf_' + file.replace(/\.svg$/, '').replace(/-/g, '_'), name, fig, src: BASE + file });
});
/* 이름 중복 · 다른 시안과 겹침 */
['charts', 'symbols', 'panels', 'events'].forEach((cat) => {
  const seen = {};
  out[cat].forEach((a) => { if (seen[a.name]) { console.error('  !! 이름 중복: ' + a.name); miss++; } seen[a.name] = 1; });
});
const TAB = { charts: 'chart', symbols: 'symbol', panels: 'panel', events: 'event' };
['hanjin-assets.js', 'hana-assets.js', 'posco-assets.js', 'icheon-assets.js', 'skhynix-assets.js', 'shinhan-assets.js'].forEach((f) => {
  const p = path.join(ROOT, 'src', f);
  if (!fs.existsSync(p)) return;
  const w = {};
  try { new Function('window', fs.readFileSync(p, 'utf8'))(w); } catch (e) { return; }
  const A = w[Object.keys(w)[0]] || {};
  Object.keys(TAB).forEach((k) => (A[k] || []).forEach((a) => {
    const nm = String(a.name).split('/').pop().trim();
    if (out[k].some((x) => x.name === nm)) console.error('  ?? 이름 겹침: [' + TAB[k] + '] ' + nm + '  ← ' + f);
  }));
});

const js = '/* 자동 생성물 — 공장 전력설비 화면(Figma hHans6kNFlTP98CO1O431o)의 에셋 라이브러리 등록 목록.\n'
  + '   마크업도 CSS 도 복사해 두지 않는다 — build_pfo 의 DOM 에서 노드 id 로 잘라 쓴다. ox · oy = Figma GROUP.\n'
  + '   생성기: src/plant-assets/_gen/mk-assets.js — 손으로 고치지 말고 다시 돌릴 것. */\n'
  + 'window.__PLANT_ASSETS = ' + JSON.stringify({
    base: BASE,
    screens: { pfo: { build: 'build_pfo', css: 'PFO_CSS', light: 'PFO_LIGHT_CSS', title: '설비현황', base: BASE } },
    charts: out.charts, symbols: out.symbols, icons: out.icons, panels: out.panels, events: out.events,
  }, null, 1) + ';\n';
fs.writeFileSync(OUT, js);
report.forEach((r) => console.log('  ' + r[0].padEnd(8) + r[1].padEnd(9) + r[2].padEnd(24) + r[3]));
console.log('\nsrc/plant-assets.js — 차트 ' + out.charts.length + ' · 심볼 ' + out.symbols.length + ' · 아이콘 ' + out.icons.length + ' · 판 ' + out.panels.length + ' · 이벤트 ' + out.events.length + (miss ? '  (문제 ' + miss + '건)' : ''));
if (miss) process.exitCode = 1;
