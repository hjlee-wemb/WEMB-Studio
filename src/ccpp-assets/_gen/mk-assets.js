/* 복합화력 설비정보 디지털트윈 5화면 + 상세 팝업 탭 조각의 에셋을 스튜디오 '에셋 라이브러리' 등록 목록(src/ccpp-assets.js)으로 만든다.
   발전소 방재(src/plantdp-assets/_gen)와 같은 규칙이다. 원본이 라이트, 다크는 파생(.ccX-root[data-theme="dark"]) — 썸네일 루트의 data-theme 가 고른다.

   · 등록 단위는 컴포넌트 — 그 자체로 뜻이 서는 덩어리만 올린다. 같은 그림이 여러 화면에 겹치면 한 번만(spec.json).
   · 마크업도 CSS 도 복사하지 않는다 — 라이브러리가 build_ccX 의 DOM 에서 노드 id 로 잘라 쓴다.
     글자는 실제 텍스트라 패널편집 · 다크/라이트 · 색 정하기가 썸네일까지 따라온다.
   · 썸네일 바탕은 무조건 투명 — 화면 바탕(Background · 3D Scene)은 올리지 않는다(뿌리 · 직계 Background 는 authoring.css 가 끈다).
   · 장면 DOM 이 아닌 것도 올린다:
       - 상세 팝업 탭 조각(설계 · 설비 · 자재) = src/ccpp-tabs.js 의 build_ccta · build_cctb · build_cctc
       - 운전정보 탭 실시간 차트 카드 = src/ccpp-oper.js 의 build_ccto(라이브가 그린 DOM 을 mk-oper.js 가 떠 둔 정적 사본)
   · 아이콘은 파일 하나 = 아이콘 하나. 색을 읽어
       - 어두운 무채색 → light(다크 칸에서 라이브러리가 색을 뒤집어 보여 준다)
       - 흰 무채색만 → <이름>-lib.svg(명도만 뒤집음) + light
   · w · h 는 브라우저에서 잰 값(measure.js → src/ccpp/_gen/asset-sizes.json)

   사용법: node src/ccpp-assets/_gen/mk-assets.js */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const OUT = path.join(ROOT, 'src', 'ccpp-assets.js');
const BASE = 'src/ccpp/';
const SPEC = JSON.parse(fs.readFileSync(path.join(__dirname, 'spec.json'), 'utf8'));
const SIZES = JSON.parse(fs.readFileSync(path.join(ROOT, BASE, '_gen', 'asset-sizes.json'), 'utf8'));

const SCREEN = {
  main: { px: 'ccm', title: '설비 맵', file: 'ccpp-main' },
  library: { px: 'ccl', title: '도서관리', file: 'ccpp-library' },
  diagram: { px: 'ccd', title: '계통도', file: 'ccpp-diagram' },
  detail: { px: 'cce', title: '태그 · 상세정보', file: 'ccpp-detail' },
  'file-open': { px: 'ccf', title: '파일 열기', file: 'ccpp-file-open' },
  'tab-design': { px: 'ccta', title: '상세 팝업 설계 탭', file: 'ccpp-tabs' },
  'tab-equipment': { px: 'cctb', title: '상세 팝업 설비 탭', file: 'ccpp-tabs' },
  'tab-materials': { px: 'cctc', title: '상세 팝업 자재 탭', file: 'ccpp-tabs' },
  oper: { px: 'ccto', title: '상세 팝업 운전정보 탭', file: 'ccpp-oper' },
};
global.window = {};
[...new Set(Object.values(SCREEN).map((x) => x.file))].forEach((f) => require(path.join(ROOT, 'src', f + '.js')));
const W = global.window;
const HTML = {};
Object.keys(SCREEN).forEach((sc) => { HTML[sc] = W['build_' + SCREEN[sc].px](BASE); });
const hasNode = (sc, nid) => HTML[sc].indexOf('data-node-id="' + nid + '"') >= 0;

const CATS = ['charts', 'panels', 'events', 'symbols'];
const out = { charts: [], symbols: [], panels: [], events: [], icons: [] };
const report = [];
const seenNode = {};
let miss = 0;
CATS.forEach((cat) => {
  (SPEC[cat] || []).forEach((it, i) => {
    const z = SIZES[cat + ':' + i];
    if (!z) { console.error('  !! 못 찾음(측정): ' + it.sc + ' ' + (it.nid || it.q.join('/')) + ' (' + it.name + ')'); miss++; return; }
    const nid = z.nid, px = SCREEN[it.sc].px;
    if (!hasNode(it.sc, nid)) { console.error('  !! 모듈에 없음: ' + it.sc + ' ' + nid + ' (' + it.name + ')'); miss++; return; }
    if (seenNode[px + nid]) { console.error('  -- 같은 노드 두 번(건너뜀): ' + it.name + ' = ' + seenNode[px + nid]); return; }
    seenNode[px + nid] = it.name;
    const a = { id: 'cc_' + px + '_' + nid.replace(/[:;]/g, '_'), name: it.name, fig: it.fig + ' (' + nid + ')', px, nid, w: z.w, h: z.h, fit: 1 };
    if (z.group) { a.ox = z.ox; a.oy = z.oy; }
    out[cat].push(a);
    report.push([cat, px, nid, z.w + 'x' + z.h, it.name]);
  });
});

/* 아이콘 색 읽기 */
function rgb(c) {
  c = c.trim().toLowerCase();
  if (c === 'white') return [255, 255, 255]; if (c === 'black') return [0, 0, 0];
  const m = /^#([0-9a-f]{3,8})$/.exec(c); if (!m) return null;
  let h = m[1]; if (h.length <= 4) h = h.split('').map((x) => x + x).join('');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function colors(svg) {
  /* clipPath 안의 흰 사각형은 그림이 아니다 */
  const body = svg.replace(/<clipPath[\s\S]*?<\/clipPath>/g, '').replace(/<mask[\s\S]*?<\/mask>/g, '');
  const cs = [];
  body.replace(/\b(fill|stroke|stop-color)="([^"]+)"/g, (m, k, v) => { if (!/^(none|url)/.test(v)) { const a = rgb(v); if (a) cs.push(a); } return m; });
  return cs;
}
const lum = (a) => (Math.max(...a) + Math.min(...a)) / 510, chroma = (a) => Math.max(...a) - Math.min(...a);
const hex = (a) => '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
function invertNeutral(svg) {
  return svg.replace(/\b(fill|stroke|stop-color)="(#[0-9a-fA-F]{3,8}|white|black)"/g, (m, k, v) => {
    const a = rgb(v); if (!a || chroma(a) > 40) return m;
    const L = 1 - lum(a), g = 30 + L * 200;
    return k + '="' + hex([g - 2, g, g + 4]) + '"';
  });
}
const seenIcon = {};
SPEC.icons.forEach(([file, name, fig]) => {
  const p = path.join(ROOT, BASE, file);
  if (!fs.existsSync(p)) { console.error('  !! 파일 없음: ' + file); miss++; return; }
  /* 화면이 그림을 img 로도, 인라인 svg(data-src)로도, CSS 배경(url)으로도 쓴다 — 다 본다 */
  if (!Object.keys(HTML).some((sc) => HTML[sc].indexOf('/' + file + '"') >= 0 || HTML[sc].indexOf('data-src="' + file + '"') >= 0 || String(W[SCREEN[sc].px.toUpperCase() + '_CSS'] || '').indexOf(file) >= 0)) { console.error('  !! 화면이 안 쓰는 파일: ' + file); miss++; return; }
  const svg = fs.readFileSync(p, 'utf8');
  const cs = colors(svg);
  if (!cs.length) { console.error('  !! 색 없음: ' + file + ' ' + name); miss++; return; }
  const neutral = cs.filter((a) => chroma(a) <= 40);
  const darkN = neutral.some((a) => lum(a) < 0.5), lightN = neutral.length && neutral.every((a) => lum(a) >= 0.6);
  const colored = cs.some((a) => chroma(a) > 40);
  const a = { id: 'cc_' + file.replace(/\.(svg|png)$/, '').replace(/-/g, '_'), name, fig, src: BASE + file };
  if (lightN && !colored) {
    const lt = file.replace(/\.svg$/, '-lt.svg'), lib = file.replace(/\.svg$/, '-lib.svg');
    if (fs.existsSync(path.join(ROOT, BASE, lt))) a.src = BASE + lt;
    else { fs.writeFileSync(path.join(ROOT, BASE, lib), invertNeutral(svg)); a.src = BASE + lib; }
    a.light = 1;
  } else if (darkN) a.light = 1;
  if (seenIcon[name]) { console.error('  !! 아이콘 이름 중복: ' + name); miss++; }
  seenIcon[name] = 1;
  out.icons.push(a);
});

/* 이름 중복 · 다른 시안과 겹침 */
CATS.forEach((cat) => {
  const seen = {};
  out[cat].forEach((a) => { if (seen[a.name]) { console.error('  !! 이름 중복: [' + cat + '] ' + a.name); miss++; } seen[a.name] = 1; });
});
fs.readdirSync(path.join(ROOT, 'src')).filter((f) => /-assets\.js$/.test(f) && f !== 'ccpp-assets.js').forEach((f) => {
  const w = {};
  try { new Function('window', fs.readFileSync(path.join(ROOT, 'src', f), 'utf8'))(w); } catch (e) { return; }
  const A = w[Object.keys(w)[0]] || {};
  CATS.concat(['icons']).forEach((k) => (A[k] || []).forEach((x) => {
    const nm = String(x.name).split('/').pop().trim();
    if (out[k].some((y) => y.name === nm)) { console.error('  !! 다른 시안과 이름 겹침: [' + k + '] ' + nm + '  ← ' + f); miss++; }
  }));
});

const used = {};
CATS.forEach((c) => out[c].forEach((a) => { used[a.px] = 1; }));
const screens = {};
Object.keys(SCREEN).forEach((sc) => {
  const px = SCREEN[sc].px;
  if (!used[px]) return;
  screens[px] = { build: 'build_' + px, css: px.toUpperCase() + '_CSS', light: px.toUpperCase() + '_LIGHT_CSS', rootClass: 'tc-asset dw-asset cc-asset', title: '복합화력 설비정보 — ' + SCREEN[sc].title, base: BASE };
});
const js = '/* 자동 생성물 — 복합화력 설비정보 디지털트윈 5화면 · 상세 팝업 탭 조각의 에셋 라이브러리 등록 목록.\n'
  + '   등록 단위는 컴포넌트다. 같은 그림이 여러 화면에 겹치면 한 번만 올린다.\n'
  + '   마크업도 CSS 도 복사해 두지 않는다 — build_ccX 의 DOM 에서 노드 id 로 잘라 쓴다.\n'
  + '   생성기: src/ccpp-assets/_gen/mk-assets.js — 손으로 고치지 말고 다시 돌릴 것. */\n'
  + 'window.__CCPP_ASSETS = ' + JSON.stringify({ base: BASE, screens, charts: out.charts, symbols: out.symbols, icons: out.icons, panels: out.panels, events: out.events }, null, 1) + ';\n';
fs.writeFileSync(OUT, js);
report.forEach((r) => console.log('  ' + r[0].padEnd(8) + r[1].padEnd(5) + r[2].padEnd(24) + r[3].padEnd(16) + r[4]));
console.log('\nsrc/ccpp-assets.js — 차트 ' + out.charts.length + ' · 심볼 ' + out.symbols.length + ' · 아이콘 ' + out.icons.length + ' · 판 ' + out.panels.length + ' · 이벤트 ' + out.events.length + (miss ? '  (문제 ' + miss + ')' : ''));
if (miss) process.exitCode = 1;
