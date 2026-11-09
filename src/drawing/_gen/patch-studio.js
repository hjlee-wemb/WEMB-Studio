/* 스튜디오 연결 — 스마트 도면관리 템플릿(tpl 'drawing', 19장면)을 등록한다.
   이미 들어가 있으면 건너뛴다. 고객사 이름은 카드 · 화면에 쓰지 않는다. 실행: node src/drawing/_gen/patch-studio.js */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
let changed = 0;
function edit(file, marker, fn) {
  const p = path.join(ROOT, file);
  const before = fs.readFileSync(p, 'utf8');
  if (before.indexOf(marker) >= 0) { console.log('  (이미 있음)', file); return; }
  const crlf = before.indexOf('\r\n') >= 0;
  let s = crlf ? before.replace(/\r\n/g, '\n') : before;
  s = fn(s);
  if (crlf) s = s.replace(/\n/g, '\r\n');
  fs.writeFileSync(p, s);
  changed++;
  console.log('  patched', file);
}
function rep(s, find, val) {
  if (s.indexOf(find) < 0) throw new Error('앵커 없음: ' + find.slice(0, 90));
  return s.replace(find, () => val);
}
function repAll(s, find, val) {
  if (s.indexOf(find) < 0) throw new Error('앵커 없음: ' + find.slice(0, 90));
  return s.split(find).join(val);
}
function bump(s, file) {
  const re = new RegExp(file.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&') + '\\?v=(\\d+)');
  if (!re.test(s)) throw new Error('판 번호 없음: ' + file);
  return s.replace(re, (m, n) => file + '?v=' + (+n + 1));
}
const DG = require('./screens.json').map((x) => [x[4], x[2], x[3]]);
const PXS = DG.map((x) => x[1]);
const IMG = (x) => 'src/templates/drawing-' + x[0] + '.jpg';
const TITLE = 'Dashboard: Smart Drawing Management';
const KEY = 'hfgGjtOuOsX3wdxk33ldyv';

/* ── js/templates/drawing.js — 무선망 연결(wnms.js)을 매번 떠서 만든다 ── */
{
  const dst = path.join(ROOT, 'js/templates/drawing.js');
  let s = fs.readFileSync(path.join(ROOT, 'js/templates/wnms.js'), 'utf8').replace(/\r\n/g, '\n');
  const a = s.indexOf('const WN_SCREENS = {'), b = s.indexOf('const WN_ROOTS');
  s = s.slice(0, a) + 'const DG_SCREENS = {\n'
    + DG.map((x) => "  '" + x[0] + "': { px: '" + x[1] + "', build: 'build_" + x[1] + "', css: '" + x[1].toUpperCase() + "_CSS', light: '" + x[1].toUpperCase() + "_LIGHT_CSS', title: '스마트 도면관리 — " + x[2] + "' },").join('\n')
    + '\n};\n' + s.slice(b);
  s = s.replace(/^\/\* ── 무선망 통합관리 대시보드 템플릿 연결 ── \*\/\n/, '/* ── 스마트 도면관리 템플릿 연결 ── */\n');
  s = s.replace(/\/\* ── Dashboard: Wireless Network Management[\s\S]*?window\.initWnms\)\. \*\//,
    '/* ── ' + TITLE + ' — Figma 화면 19장을 순수 HTML/CSS DOM 으로 재구축한 것을 얹는다 ──\n   원본: Figma ' + KEY + ' (page "Light-시안01") · 생성기 src/drawing/_gen.\n   글자는 전부 편집 가능한 실제 텍스트(Pretendard CDN), 아이콘 · 그래픽만 Figma 가 내보낸 개별 svg/png(src/drawing/).\n   원본이 라이트 시안이라 처음엔 라이트로 연다(다크는 생성기가 파생, _gen/dark.js).\n   인터랙션 · 라이브 · 반응형 · 차트 바꾸기 · 패널 옮기기는 src/drawing-live.js(window.initDrawing). */');
  s = s.replace(/const WN_ROOTS = [^\n]*/, "const WN_ROOTS = '" + PXS.map((p) => '.' + p + '-root').join(', ') + "';");
  s = s.replace(/\/\* 시안 자신의 주조색[^\n]*\nconst WN_SEED = '#0C4DA1';/, "/* 시안 자신의 주조색 — 파랑(#3967FD). '색 정하기'의 시작값 */\nconst WN_SEED = '#3967FD';");
  s = s.split('wemb-wnms').join('wemb-drawing').split('WN_').join('DG_').split('Wnms').join('Drawing').split("'wnms'").join("'drawing'").split('__wnmsSceneOf').join('__drawingSceneOf');
  s = s.replace(/src\/wnms-live\.js/g, 'src/drawing-live.js').replace('GNB 메뉴 · 장비 타일이', '헤더 메뉴 · 단추가');
  fs.writeFileSync(dst, s);
  if (/wnms|initWnms/i.test(s)) console.log('  ! drawing.js 에 wnms 흔적', s.match(/.{30}(wnms).{30}/i)[0]);
  console.log('  wrote js/templates/drawing.js');
}

/* ── 화면 모듈 표 ── */
edit('js/core/tpl-modules.js', 'drawing-main.js', (s) => {
  s = rep(s, '    wnms: [\n',
    '    /* 스마트 도면관리 — Figma ' + KEY + '. 화면 19장, 장면마다 따로 싣는다 */\n    drawing: [\n'
    + DG.map((x) => "      { src: 'src/drawing-" + x[0] + ".js?v=1', build: ['build_" + x[1] + "'], scene: '" + x[0] + "' },").join('\n')
    + "\n      { src: 'src/drawing-live.js?v=1', part: 'base' },\n    ],\n    wnms: [\n");
  s = rep(s, "    wnms: { key: 'wemb-wnms-screen', def: 'main' },\n", "    wnms: { key: 'wemb-wnms-screen', def: 'main' },\n    drawing: { key: 'wemb-drawing-screen', def: 'main' },\n");
  return s;
});

if (!fs.readFileSync(path.join(ROOT, 'studio.html'), 'utf8').includes('js/templates/drawing.js')) {
  edit('studio.html', 'js/templates/drawing.js', (s) => {
    s = rep(s, '    <script src="js/templates/wnms.js?v=',
      '    <!-- 스마트 도면관리 — Figma ' + KEY + ' 화면 19장을 순수 HTML/CSS DOM 으로 재구축.\n' +
      '         화면 모듈은 js/core/tpl-modules.js 가 싣는다. 생성기: src/drawing/_gen/. -->\n' +
      '    <script src="js/templates/drawing.js?v=1"></script>\n' +
      '    <script src="js/templates/wnms.js?v=');
    ['js/core/tpl-modules.js', 'js/templates/image.js', 'js/studio/dt-edit.js', 'js/main.js', 'js/studio/project.js', 'js/core/projects.js', 'js/studio/atom-swap.js'].forEach((f) => { s = bump(s, f); });
    return s;
  });
  const P1 = path.join(ROOT, 'index.html');
  let i1 = fs.readFileSync(P1, 'utf8');
  ['js/core/projects.js', 'js/launcher/templates.js', 'js/launcher/home.js'].forEach((f) => { i1 = bump(i1, f); });
  fs.writeFileSync(P1, i1);
  const P2 = path.join(ROOT, 'present.html');
  let i2 = fs.readFileSync(P2, 'utf8');
  i2 = bump(i2, 'js/core/projects.js');
  fs.writeFileSync(P2, i2);
}

/* ── 템플릿 카탈로그 ── */
edit('js/launcher/templates.js', "w.tpl = 'drawing'", (s) => {
  const m = /\n  \];\n(\s*)(?:\/\/[^\n]*\n\s*|\/\*[\s\S]*?\*\/\s*)*(?:const|var|let) TEMPLATES/.exec(s);
  if (!m) throw new Error('TPL_DEFS 끝을 못 찾음');
  s = s.slice(0, m.index) +
    "\n    { title: '" + TITLE + "', area: '에너지·환경', date: 'May 20, 2026', slides: [\n" +
    DG.map((x) => "      { img: '" + IMG(x) + "', label: '" + x[2] + "' }").join(',\n') + '] },' + s.slice(m.index);
  s = rep(s, "  /* 무선망 통합관리 대시보드 — '스튜디오 열기' 시",
    "  /* 스마트 도면관리 — '스튜디오 열기' 시 Figma(" + KEY + ") 화면 19장을\n" +
    "     순수 HTML/CSS DOM 으로 재구축한 것(src/drawing-*.js)으로 연다. */\n" +
    "  (function () {\n" +
    "    const w = TEMPLATES.find((t) => t.title === '" + TITLE + "');\n" +
    "    if (w) w.tpl = 'drawing';\n" +
    "  })();\n" +
    "  /* 무선망 통합관리 대시보드 — '스튜디오 열기' 시");
  s = rep(s, "const tplIsLive = (t) => !!t && (t.tpl === 'wnms' ||", "const tplIsLive = (t) => !!t && (t.tpl === 'drawing' || t.tpl === 'wnms' ||");
  return s;
});

/* ── 홈 ── */
edit('js/launcher/home.js', "t.tpl === 'drawing'", (s) => {
  s = rep(s, "const isDT = t.tpl === 'wnms' ||", "const isDT = t.tpl === 'drawing' || t.tpl === 'wnms' ||");
  s = rep(s, "      : pending.tpl === 'wnms' ? 'src/templates/wnms-main.jpg' : null;",
    "      : pending.tpl === 'wnms' ? 'src/templates/wnms-main.jpg'\n      : pending.tpl === 'drawing' ? 'src/templates/drawing-main.jpg' : null;");
  s = rep(s, "                  : proj.tpl === 'wnms' ? [",
    "                  : proj.tpl === 'drawing' ? [" + DG.slice(1).map((x) => "'" + x[0] + "'").join(', ') + "][i]\n                  : proj.tpl === 'wnms' ? [");
  s = rep(s, "      : openProj.tpl === 'wnms' ? (openProj.tplScene || 'main')",
    "      : openProj.tpl === 'drawing' ? (openProj.tplScene || 'main')\n      : openProj.tpl === 'wnms' ? (openProj.tplScene || 'main')");
  s = rep(s, "      if (openProj.tpl === 'wnms') localStorage.setItem('wemb-wnms-screen', openScene);",
    "      if (openProj.tpl === 'drawing') localStorage.setItem('wemb-drawing-screen', openScene);\n      if (openProj.tpl === 'wnms') localStorage.setItem('wemb-wnms-screen', openScene);");
  return s;
});

/* ── 작업공간 ── */
edit('js/studio/project.js', "f.tpl === 'drawing'", (s) => rep(s,
  "        else if (f.tpl === 'wnms') {",
  "        else if (f.tpl === 'drawing') {\n" +
  "          localStorage.setItem('wemb-tpl-dt', 'drawing'); localStorage.removeItem('wemb-tpl-img');\n" +
  "          const wantDg = (typeof DG_SCREENS !== 'undefined' && DG_SCREENS[f.scene]) ? f.scene : (localStorage.getItem('wemb-drawing-screen') || 'main');\n" +
  "          try { localStorage.setItem('wemb-drawing-screen', wantDg); } catch (e3) {}\n" +
  "          if (typeof applyDrawingDT === 'function') applyDrawingDT(wantDg);\n" +
  "        }\n" +
  "        else if (f.tpl === 'wnms') {"));

/* ── 저장된 화면 열기 ── */
edit('js/core/projects.js', "t.tpl === 'drawing'", (s) => {
  s = rep(s, "    try { if (t.tpl === 'wnms') localStorage.setItem('wemb-wnms-screen', t.tplScene || 'main'); } catch (e) {}",
    "    try { if (t.tpl === 'drawing') localStorage.setItem('wemb-drawing-screen', t.tplScene || 'main'); } catch (e) {}\n" +
    "    try { if (t.tpl === 'wnms') localStorage.setItem('wemb-wnms-screen', t.tplScene || 'main'); } catch (e) {}");
  return repAll(s, "if (t.tpl === 'wnms' || t.tpl === 'newbiz'", "if (t.tpl === 'drawing' || t.tpl === 'wnms' || t.tpl === 'newbiz'");
});

/* ── 새로고침 복원 · 밝기 복원 ── */
edit('js/main.js', "'drawing'", (s) => {
  s = rep(s, "    if (__tdt === 'wnms' && typeof applyWnmsDT === 'function') {",
    "    if (__tdt === 'drawing' && typeof applyDrawingDT === 'function') {\n" +
    "      applyDrawingDT(window.__drawingSceneOf ? window.__drawingSceneOf() : localStorage.getItem('wemb-drawing-screen'));\n" +
    "    }\n" +
    "    else if (__tdt === 'wnms' && typeof applyWnmsDT === 'function') {");
  s = rep(s, "  /* 무선망 통합관리는 Light 가 원본 — 고른 밝기(wemb-wnms-mode)는 그대로 되살아난다 */",
    "  /* 스마트 도면관리도 Light 가 원본 — 고른 밝기(wemb-drawing-mode)는 그대로 되살아난다 */\n" +
    "  if (state.screen === 'dt' && localStorage.getItem('wemb-tpl-dt') === 'drawing') {\n" +
    "    const want = localStorage.getItem('wemb-drawing-mode') === 'dark' ? 'dark' : 'light';\n" +
    "    if (state.mode !== want) {\n" +
    "      state.mode = want;\n" +
    "      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));\n" +
    "    }\n" +
    "  }\n" +
    "  /* 무선망 통합관리는 Light 가 원본 — 고른 밝기(wemb-wnms-mode)는 그대로 되살아난다 */");
  return s;
});

/* ── 색 정하기 · 화면 테마 · 로고 ── */
edit('js/templates/image.js', 'DRAWING_OPT', (s) => {
  s = rep(s, '  WNMS_OPT: {',
    "  /* 스마트 도면관리 시안 — 주조색은 파랑(#3967FD, 색상각 226°). 색을 그대로 둘 것: 바탕 사진 · CCTV 사진 · 유리 아이콘 그림.\n" +
    "     판 · 선 · 글자 · 단추 · 아이콘 · 차트는 따라간다 */\n" +
    "  DRAWING_OPT: {\n" +
    "    seed: '#3967FD', seededKey: 'wemb-drawing-seeded', refHue: 226,\n" +
    "    keep: /(^|\\/)(background[-\\w]*\\.(png|jpg)|viewer[-\\w]*|icon-image[-\\w]*|logo-wemb-studio[-\\w]*|service-name[-\\w]*|required-mark[-\\w]*)(\\.(svg|png|jpg))?(\\?|$)/i,\n" +
    "    raster: /$^/,\n" +
    "  },\n" +
    '  WNMS_OPT: {');
  s = rep(s, "    /* 무선망 통합관리 화면 8장 — 같은 방식. 열린 장면만 칠한다 */",
    "    /* 스마트 도면관리 화면 19장 — 같은 방식. 열린 장면만 칠한다 */\n" +
    "    [" + PXS.map((p) => "'" + p + "'").join(', ') + "].forEach((px) => {\n" +
    "      if (document.querySelector('.' + px + '-root')) this.icheonTint(t, mode, '.' + px + '-root', [px + '-style', px + '-light-style', 'drawing-live-style'], 'wemb-drawing-mode', this.DRAWING_OPT);\n" +
    "    });\n" +
    "    /* 무선망 통합관리 화면 8장 — 같은 방식. 열린 장면만 칠한다 */");
  s = rep(s, "  DOM_CUSTOM: '.shm-root [data-name=\"Brand\"],", "  DOM_CUSTOM: '" + PXS.map((p) => '.' + p + '-root [data-name="Logo/WEMB Studio"]').join(', ') + ", ' +\n    '.shm-root [data-name=\"Brand\"],");
  return s;
});

/* ── 패널편집(내용 수정) — 모든 글자 ── */
edit('js/studio/dt-edit.js', '.dwm-root p', (s) => rep(s, ".wnm-root p, ", PXS.map((p) => '.' + p + '-root p').join(', ') + ", .wnm-root p, "));

/* ── '원자 변경' 창 ── */
edit('js/studio/atom-swap.js', "'dwm'", (s) => rep(s, "'wnm', ", PXS.map((p) => "'" + p + "'").join(', ') + ", 'wnm', "));

console.log('done ·', changed, '파일');
