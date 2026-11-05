/* 신사업 관리 11화면(Figma cES6X45zHjsaabaXL1cdrt)의 에셋을
   스튜디오 '에셋 라이브러리' 등록 목록(src/newbiz-assets.js)으로 만든다. STATCOM HMI 생성기와 같은 규칙이다.

   · 등록 단위는 컴포넌트 — 그 자체로 뜻이 서는 덩어리만 올린다. 같은 그림이 여러 화면에 겹치면 한 번만 올린다.
   · 마크업도 CSS 도 복사하지 않는다 — 라이브러리가 build_nbX 의 DOM 에서 노드 id 로 잘라 쓴다.
     글자는 실제 텍스트라 패널편집 · 다크/라이트 · 색 정하기가 썸네일까지 따라온다.
   · 묶음(display:contents)과 절대 배치 노드는 화면 좌표라 ox · oy 를 적는다 — 라이브러리 hjDom 이 1920x1080 판을 그만큼 당긴다.
   · 이름은 화면 글자대로. 고객사 이름은 쓰지 않는다. 로고 · 캐릭터 그림은 올리지 않는다.
   · 차트 · 이벤트 탭은 비어 있다 — 이 시안에 없다. 패널편집 추천 차트는 라이브가 그때그때 그리는 것이라 노드가 아니다.
   · w · h · ox · oy 는 브라우저에서 잰 값(sizes.json, measure.js)이다.

   사용법: node src/newbiz-assets/_gen/mk-assets.js */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const OUT = path.join(ROOT, 'src', 'newbiz-assets.js');
const BASE = 'src/newbiz/';

const SCREEN = {
  nbw: { out: 'wind', title: '재생에너지 · 풍향' },
  nbs: { out: 'solar', title: '재생에너지 · 태양광' },
  nbe: { out: 'energy', title: '재생에너지 · 에너지' },
  nbk: { out: 'wind-input', title: '풍향 · 툴팁 인풋' },
  nbm: { out: 'measure', title: '계측현황' },
  nbt: { out: 'measure-wind', title: '계측현황 · 풍력 툴팁' },
  nbu: { out: 'measure-solar', title: '계측현황 · 태양광 툴팁' },
  nbp: { out: 'measure-popup', title: '계측현황 · 사업 팝업' },
  nbo: { out: 'overseas', title: '해외사업' },
};

global.window = {};
Object.keys(SCREEN).forEach((px) => require(path.join(ROOT, 'src', 'newbiz-' + SCREEN[px].out + '.js')));
const W = global.window;
const HTML = {};
Object.keys(SCREEN).forEach((px) => { HTML[px] = W['build_' + px](BASE); });
const hasNode = (px, nid) => HTML[px].indexOf('data-node-id="' + nid + '"') >= 0;

const ITEMS = {
  charts: [],
  events: [],
  panels: [
    /* 공통 */
    { px: 'nbw', nid: '1:3143', name: '메뉴 바 (신사업)', fig: 'Nav Bar', fit: 1 },
    { px: 'nbw', nid: '1:3416', name: '헤더 (신사업)', fig: 'Header', fit: 1 },
    /* 재생에너지 */
    { px: 'nbw', nid: '1:3429', name: '사업 단계 타임라인 (풍향)', fig: 'Widget/Project Timeline' },
    { px: 'nbs', nid: '1:4277', name: '사업 단계 타임라인 (태양광)', fig: 'Widget/Project Timeline' },
    { px: 'nbe', nid: '1:5130', name: '사업 단계 타임라인 (에너지)', fig: 'Widget/Project Timeline' },
    { px: 'nbw', nid: '1:2635', name: '재생에너지 지도 패널', fig: 'Widget/Project Map' },
    { px: 'nbw', nid: '1:3151', name: '재생에너지 사업현황 표', fig: 'Widget/Project Status' },
    /* 계측현황 */
    { px: 'nbm', nid: '1:7108', name: '계측현황 지도', fig: 'Map Stage' },
    { px: 'nbt', nid: '1:5959', name: '풍력 계측 팝업', fig: 'Popup/Incheon (In-house)' },
    { px: 'nbu', nid: '1:6787', name: '태양광 계측 팝업', fig: 'Popup/Sandan (Solar)' },
    { px: 'nbp', nid: '1:8427', name: '사업 정보 팝업', fig: 'Popup/Haenam (Solar)' },
    /* 해외사업 */
    { px: 'nbo', nid: '1:8858', name: '해외사업 항로 지도', fig: 'Content' },
    { px: 'nbo', nid: '1:8859', name: '세계 지도', fig: 'World Map' },
    { px: 'nbo', nid: '1:8760', name: '2040 목표 패널', fig: 'Widget/2040 Target' },
  ],
  symbols: [
    /* 지도 표지 */
    { px: 'nbw', nid: '1:3044', name: '풍향계', fig: 'Visual < Callout/Tongyeong (Yokjido)' },
    { px: 'nbw', nid: '1:3071', name: '태양광 패널', fig: 'Visual < Callout/Haenam (Solar)' },
    { px: 'nbw', nid: '1:3116', name: '풍향계 말풍선 (빨강)', fig: 'Callout/Incheon (Orsted)' },
    { px: 'nbw', nid: '1:3043', name: '풍향계 말풍선 (주황)', fig: 'Callout/Tongyeong (Yokjido)' },
    { px: 'nbw', nid: '1:3134', name: '풍향계 말풍선 (하늘)', fig: 'Callout/Wando Geumil' },
    { px: 'nbw', nid: '1:3070', name: '태양광 말풍선', fig: 'Callout/Haenam (Solar)' },
    { px: 'nbt', nid: '1:5948', name: '풍향계 말풍선 (선택)', fig: 'Callout/Incheon (In-house) (Selected)' },
    { px: 'nbp', nid: '16:124', name: '태양광 말풍선 (선택)', fig: 'Callout/Haenam (Solar) (Selected)' },
    /* 타임라인 */
    { px: 'nbw', nid: '1:3478', name: '에너지원 탭', fig: 'Tabs' },
    { px: 'nbw', nid: '1:3480', name: '에너지원 탭 항목', fig: 'Tab/Solar' },
    { px: 'nbw', nid: '1:3433', name: '사업 단계 표지', fig: 'Step/Wind Measurement' },
    { px: 'nbw', nid: '1:3432', name: '타임라인 막대', fig: 'Track' },
    { px: 'nbk', nid: '1:857', name: '타임라인 사업 칩', fig: 'Tooltip/Yeonsu Yeondo' },
    /* 표 */
    { px: 'nbw', nid: '1:3154', name: '사업현황 표 머리줄', fig: 'Header Row' },
    { px: 'nbw', nid: '1:3171', name: '사업현황 표 줄 (운영중)', fig: 'Row/Tamra' },
    { px: 'nbw', nid: '1:3196', name: '사업현황 표 줄 (개발중)', fig: 'Row/Wando Geumil' },
    { px: 'nbw', nid: '1:3408', name: '사업현황 합계 줄', fig: 'Row/Total' },
    { px: 'nbw', nid: '1:3200', name: '사업 번호 배지', fig: 'Badge' },
    { px: 'nbw', nid: '1:3180', name: '편집 · 삭제 단추 묶음', fig: 'Actions' },
    { px: 'nbw', nid: '1:3401', name: '편집 단추 (호버)', fig: 'Button/Edit (Hover)' },
    { px: 'nbk', nid: '1:597', name: '현황 입력칸', fig: 'Input' },
    { px: 'nbk', nid: '1:600', name: '저장 단추', fig: 'Button/Save' },
    { px: 'nbk', nid: '1:602', name: '취소 단추', fig: 'Button/Cancel' },
    /* 헤더 · 제목 */
    { px: 'nbw', nid: '1:3423', name: '날짜 · 시계 (신사업)', fig: 'Timestamp' },
    { px: 'nbm', nid: '1:7621', name: '구역 제목', fig: 'Title' },
    /* 팝업 */
    { px: 'nbt', nid: '1:5967', name: '계측 지표 표', fig: 'Table/Metrics' },
    { px: 'nbt', nid: '1:5978', name: 'P75 기준 범례', fig: 'Legend' },
    { px: 'nbp', nid: '1:8434', name: '사업 정보 표', fig: 'Table/Project Info' },
    /* 해외사업 */
    { px: 'nbo', nid: '1:8920', name: '항로 라벨 (대륙)', fig: 'Route Label/Continental' },
    { px: 'nbo', nid: '1:8922', name: '항로 라벨 (태평양)', fig: 'Route Label/Pacific' },
    { px: 'nbo', nid: '1:8924', name: '항로 라벨 (남방)', fig: 'Route Label/Southern' },
    { px: 'nbo', nid: '1:8939', name: '국가 태그 (주황)', fig: 'Tag/Poland' },
    { px: 'nbo', nid: '1:8927', name: '국가 태그 (파랑)', fig: 'Tag/Indonesia' },
    { px: 'nbo', nid: '1:8943', name: '국가 태그 (초록)', fig: 'Tag/USA' },
    { px: 'nbo', nid: '1:8905', name: '거점 표지', fig: 'Hotspot' },
    { px: 'nbo', nid: '1:10561', name: '해외 사업 카드 (주황)', fig: 'Card/Poland' },
    { px: 'nbo', nid: '1:10546', name: '해외 사업 카드 (초록)', fig: 'Card/Eastern Northern Europe Renewable' },
    { px: 'nbo', nid: '1:10520', name: '해외 사업 카드 (파랑)', fig: 'Card/Bulgaria Solar' },
    { px: 'nbo', nid: '1:9014', name: '해외 사업 항목', fig: 'Item/Chile Solar' },
    { px: 'nbo', nid: '1:8802', name: '목표 연도 머리줄', fig: 'Header Row < Widget/2040 Target' },
    { px: 'nbo', nid: '1:8819', name: '목표 수치 열', fig: 'Column/2025' },
    { px: 'nbo', nid: '1:10606', name: '흐름 화살표', fig: 'Flow Arrows' },
  ],
};

/* 파일 하나 = 아이콘 하나. 이름에 '아이콘' 이 있어야 아이콘 탭에 뜬다(isIconNamed). 고객사 로고 logo-mark.svg 는 뺀다 */
const USE_LT = /^(icon-action-close|type-wind-status-default|icon|icon-1)\.svg$/;   /* 흰색이라 라이트 칸에서 안 보이는 것 */
const ICONS = [
  ['icon-action-edit.svg', '편집 아이콘', 'Icon/Action/Edit'],
  ['icon-action-delete.svg', '삭제 아이콘', 'Icon/Action/Delete'],
  ['icon-action-close.svg', '닫기 아이콘 (신사업)', 'Icon/Action/Close'],
  ['icon-timestamp-clock.svg', '시계 아이콘 (신사업)', 'Icon/Timestamp/Clock'],
  ['type-wind-status-default.svg', '풍향 탭 아이콘', 'Icon Type=Wind, Status=Default'],
  ['icon.svg', '태양광 탭 아이콘', 'Icon < Tab/Solar'],
  ['icon-1.svg', '에너지 탭 아이콘', 'Icon < Tab/Energy'],
  ['marker.svg', '단계 표지 아이콘', 'Marker < Step/Wind Measurement'],
  ['flag-australia.svg', '호주 국기 아이콘', 'Flag/Australia'],
  ['flag-bulgaria.svg', '불가리아 국기 아이콘', 'Flag/Bulgaria'],
  ['flag-canada.svg', '캐나다 국기 아이콘', 'Flag/Canada'],
  ['flag-chile.svg', '칠레 국기 아이콘', 'Flag/Chile'],
  ['flag-congo.svg', '콩고 국기 아이콘', 'Flag/Congo'],
  ['flag-indonesia.svg', '인도네시아 국기 아이콘', 'Flag/Indonesia'],
  ['flag-nepal.svg', '네팔 국기 아이콘', 'Flag/Nepal'],
  ['flag-nicaragua.svg', '니카라과 국기 아이콘', 'Flag/Nicaragua'],
  ['flag-poland.svg', '폴란드 국기 아이콘', 'Flag/Poland'],
  ['flag-taiwan.svg', '대만 국기 아이콘', 'Flag/Taiwan'],
  ['flag-ukraine.svg', '우크라이나 국기 아이콘', 'Flag/Ukraine'],
  ['flag-vietnam.svg', '베트남 국기 아이콘', 'Flag/Vietnam'],
  ['flag-middle-east.svg', '중동 표지 아이콘', 'Flag/Middle East'],
  ['flag-north-america.svg', '북미 표지 아이콘', 'Flag/North America'],
  ['flag-south-america.svg', '남미 표지 아이콘', 'Flag/South America'],
  ['flag-south-asia.svg', '남아시아 표지 아이콘', 'Flag/South Asia'],
];

const sizePath = path.join(__dirname, 'sizes.json');
const SIZES = fs.existsSync(sizePath) ? JSON.parse(fs.readFileSync(sizePath, 'utf8')) : {};
/* measure.js 가 읽는 목록 */
const CATS = ['charts', 'panels', 'events', 'symbols'];
fs.writeFileSync(path.join(__dirname, 'nodes.json'), JSON.stringify(CATS.reduce((a, c) => a.concat(ITEMS[c].map((x) => ({ px: x.px, scene: SCREEN[x.px].out, nid: x.nid }))), [])));

const out = { charts: [], symbols: [], panels: [], events: [], icons: [] };
const report = [];
let miss = 0;
CATS.forEach((cat) => {
  ITEMS[cat].forEach((it) => {
    if (!hasNode(it.px, it.nid)) { console.error('  !! 못 찾음: ' + it.px + ' ' + it.nid + ' (' + it.name + ')'); miss++; return; }
    const z = SIZES[it.px + '|' + it.nid];
    if (process.env.LIST_ONLY) return;
    if (!z || !z.w || !z.h) { console.error('  !! 크기 없음: ' + it.px + ' ' + it.nid + ' (' + it.name + ')'); miss++; return; }
    const a = { id: 'nb_' + it.px + '_' + it.nid.replace(/[:;]/g, '_'), name: it.name, fig: it.fig + ' (' + it.nid + ')', px: it.px, nid: it.nid, w: z.w, h: z.h };
    if (z.group) { a.ox = z.ox; a.oy = z.oy; }
    /* 판은 라이브러리 기본, 작은 부품은 통째로 */
    if (cat === 'symbols' || it.fit) a.fit = 1;
    out[cat].push(a);
    report.push([cat, it.px, it.nid, z.w + 'x' + z.h + (z.group ? ' @' + z.ox + ',' + z.oy : ''), it.name]);
  });
});
ICONS.forEach(([file, name, fig]) => {
  if (!fs.existsSync(path.join(ROOT, BASE, file))) { console.error('  !! 파일 없음: ' + file); miss++; return; }
  if (!Object.keys(HTML).some((px) => HTML[px].indexOf('/' + file) >= 0)) { console.error('  !! 화면이 안 쓰는 파일: ' + file); miss++; return; }
  out.icons.push({ id: 'nb_' + file.replace(/\.svg$/, '').replace(/-/g, '_'), name, fig, src: BASE + (USE_LT.test(file) ? file.replace('.svg', '-lt.svg') : file) });
});
/* 이름 중복 · 다른 시안과 겹침 */
CATS.forEach((cat) => {
  const seen = {};
  out[cat].forEach((a) => { if (seen[a.name]) { console.error('  !! 이름 중복: ' + a.name); miss++; } seen[a.name] = 1; });
});
['hanjin-assets.js', 'hana-assets.js', 'posco-assets.js', 'icheon-assets.js', 'skhynix-assets.js', 'shinhan-assets.js', 'plant-assets.js', 'statcom-assets.js'].forEach((f) => {
  const p = path.join(ROOT, 'src', f);
  if (!fs.existsSync(p)) return;
  const w = {};
  try { new Function('window', fs.readFileSync(p, 'utf8'))(w); } catch (e) { return; }
  const A = w[Object.keys(w)[0]] || {};
  CATS.concat(['icons']).forEach((k) => (A[k] || []).forEach((a) => {
    const nm = String(a.name).split('/').pop().trim();
    if (out[k].some((x) => x.name === nm)) console.error('  ?? 이름 겹침: [' + k + '] ' + nm + '  ← ' + f);
  }));
});

const screens = {};
Object.keys(SCREEN).forEach((px) => {
  screens[px] = { build: 'build_' + px, css: px.toUpperCase() + '_CSS', light: px.toUpperCase() + '_LIGHT_CSS', rootClass: 'tc-asset', title: SCREEN[px].title, base: BASE };
});
const js = '/* 자동 생성물 — 신사업 관리 11화면(Figma cES6X45zHjsaabaXL1cdrt)의 에셋 라이브러리 등록 목록.\n'
  + '   등록 단위는 컴포넌트다. 같은 그림이 여러 화면에 겹치면 한 번만 올린다.\n'
  + '   마크업도 CSS 도 복사해 두지 않는다 — build_nbX 의 DOM 에서 노드 id 로 잘라 쓴다.\n'
  + '   생성기: src/newbiz-assets/_gen/mk-assets.js — 손으로 고치지 말고 다시 돌릴 것. */\n'
  + 'window.__NEWBIZ_ASSETS = ' + JSON.stringify({
    base: BASE, screens,
    charts: out.charts, symbols: out.symbols, icons: out.icons, panels: out.panels, events: out.events,
  }, null, 1) + ';\n';
if (!process.env.LIST_ONLY) fs.writeFileSync(OUT, js);
report.forEach((r) => console.log('  ' + r[0].padEnd(8) + r[1].padEnd(4) + r[2].padEnd(9) + r[3].padEnd(20) + r[4]));
console.log('\nsrc/newbiz-assets.js — 차트 ' + out.charts.length + ' · 심볼 ' + out.symbols.length + ' · 아이콘 ' + out.icons.length + ' · 판 ' + out.panels.length + ' · 이벤트 ' + out.events.length + (miss ? '  (문제 ' + miss + ')' : ''));
if (miss) process.exitCode = 1;
