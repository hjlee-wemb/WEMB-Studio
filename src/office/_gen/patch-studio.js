/* 스튜디오 연결 — 스마트 오피스 템플릿(tpl 'office', 54장면)을 등록한다.
   이미 들어가 있으면 건너뛴다. 고객사 이름은 카드 · 화면에 쓰지 않는다. 실행: node src/office/_gen/patch-studio.js
   js/templates/office.js 는 도면관리 연결(drawing.js)을 매번 떠서 만든다. */
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
const OF = require('./screens.json').map((x) => [x[4], x[2], x[3]]);
const PXS = OF.map((x) => x[1]);
const IMG = (x) => 'src/templates/office-' + x[0] + '.jpg';
const TITLE = 'Dashboard: Smart Office';
const KEY = 'WUxDt6yorbRlc8V1py86HM';
const N = OF.length;

/* ── js/templates/office.js ── */
{
  const dst = path.join(ROOT, 'js/templates/office.js');
  let s = fs.readFileSync(path.join(ROOT, 'js/templates/drawing.js'), 'utf8').replace(/\r\n/g, '\n');
  const a = s.indexOf('const DG_SCREENS = {'), b = s.indexOf('const DG_ROOTS');
  s = s.slice(0, a) + 'const DG_SCREENS = {\n'
    + OF.map((x) => "  '" + x[0] + "': { px: '" + x[1] + "', build: 'build_" + x[1] + "', css: '" + x[1].toUpperCase() + "_CSS', light: '" + x[1].toUpperCase() + "_LIGHT_CSS', title: '스마트 오피스 — " + x[2] + "' },").join('\n')
    + '\n};\n' + s.slice(b);
  s = s.replace(/^\/\* ── 스마트 도면관리 템플릿 연결 ── \*\/\n/, '/* ── 스마트 오피스 템플릿 연결 ── */\n');
  s = s.replace(/\/\* ── Dashboard: Smart Drawing Management[\s\S]*?window\.initDrawing\)\. \*\//,
    '/* ── ' + TITLE + ' — Figma 화면 ' + N + '장을 순수 HTML/CSS DOM 으로 재구축한 것을 얹는다 ──\n   원본: Figma ' + KEY + ' (홈 · 현황 · 분석 · 관리정보) · 생성기 src/office/_gen.\n   글자는 전부 편집 가능한 실제 텍스트(Pretendard CDN · 영문 숫자는 KRAFTON_Font 가 있으면 그것), 아이콘 · 그래픽만 Figma 가 내보낸 개별 svg/png(src/office/).\n   원본이 라이트 시안이라 처음엔 라이트로 연다(다크는 생성기가 파생, _gen/dark.js).\n   인터랙션 · 라이브 · 반응형 · 차트 바꾸기 · 패널 옮기기는 src/office-live.js(window.initOffice). */');
  s = s.replace(/const DG_ROOTS = [^\n]*/, "const DG_ROOTS = '" + PXS.map((p) => '.' + p + '-root').join(', ') + "';");
  s = s.replace(/\/\* 시안 자신의 주조색[^\n]*\nconst DG_SEED = '#3967FD';/, "/* 시안 자신의 주조색 — 파랑보라(#657AFF). '색 정하기'의 시작값 */\nconst DG_SEED = '#657AFF';");
  s = s.split("'main'").join("'home'").split('DG_SCREENS.main').join('DG_SCREENS.home').split("DG_SCREENS['main']").join("DG_SCREENS['home']");
  s = s.split('wemb-drawing').join('wemb-office').split('DG_').join('OF_').split('Drawing').join('Office').split("'drawing'").join("'office'").split('__drawingSceneOf').join('__officeSceneOf');
  s = s.replace(/src\/drawing-live\.js/g, 'src/office-live.js').replace(/src\/drawing\//g, 'src/office/');
  fs.writeFileSync(dst, s);
  if (/drawing|도면/i.test(s)) console.log('  ! office.js 에 drawing 흔적', s.match(/.{30}(drawing|도면).{30}/i)[0]);
  console.log('  wrote js/templates/office.js');
}

/* ── 화면 모듈 표 ── */
edit('js/core/tpl-modules.js', 'office-home.js', (s) => {
  s = rep(s, '    drawing: [\n',
    '    /* 스마트 오피스 — Figma ' + KEY + '. 화면 ' + N + '장, 장면마다 따로 싣는다 */\n    office: [\n'
    + OF.map((x) => "      { src: 'src/office-" + x[0] + ".js?v=1', build: ['build_" + x[1] + "'], scene: '" + x[0] + "' },").join('\n')
    + "\n      { src: 'src/office-live.js?v=1', part: 'base' },\n    ],\n    drawing: [\n");
  s = rep(s, "    drawing: { key: 'wemb-drawing-screen', def: 'main' },\n", "    drawing: { key: 'wemb-drawing-screen', def: 'main' },\n    office: { key: 'wemb-office-screen', def: 'home' },\n");
  return s;
});

if (!fs.readFileSync(path.join(ROOT, 'studio.html'), 'utf8').includes('js/templates/office.js')) {
  edit('studio.html', 'js/templates/office.js', (s) => {
    s = rep(s, '    <!-- 스마트 도면관리 — Figma',
      '    <!-- 스마트 오피스 — Figma ' + KEY + ' 화면 ' + N + '장을 순수 HTML/CSS DOM 으로 재구축.\n' +
      '         화면 모듈은 js/core/tpl-modules.js 가 싣는다. 생성기: src/office/_gen/. -->\n' +
      '    <script src="js/templates/office.js?v=1"></script>\n' +
      '    <!-- 스마트 도면관리 — Figma');
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
edit('js/launcher/templates.js', "w.tpl = 'office'", (s) => {
  const m = /\n  \];\n(\s*)(?:\/\/[^\n]*\n\s*|\/\*[\s\S]*?\*\/\s*)*(?:const|var|let) TEMPLATES/.exec(s);
  if (!m) throw new Error('TPL_DEFS 끝을 못 찾음');
  s = s.slice(0, m.index) +
    "\n    { title: '" + TITLE + "', area: '부지·건물·층', date: 'Nov 10, 2026', slides: [\n" +
    OF.map((x) => "      { img: '" + IMG(x) + "', label: '" + x[2] + "' }").join(',\n') + '] },' + s.slice(m.index);
  s = rep(s, "  /* 스마트 도면관리 — '스튜디오 열기' 시",
    "  /* 스마트 오피스 — '스튜디오 열기' 시 Figma(" + KEY + ") 화면 " + N + "장을\n" +
    "     순수 HTML/CSS DOM 으로 재구축한 것(src/office-*.js)으로 연다. */\n" +
    "  (function () {\n" +
    "    const w = TEMPLATES.find((t) => t.title === '" + TITLE + "');\n" +
    "    if (w) w.tpl = 'office';\n" +
    "  })();\n" +
    "  /* 스마트 도면관리 — '스튜디오 열기' 시");
  s = rep(s, "const tplIsLive = (t) => !!t && (t.tpl === 'drawing' ||", "const tplIsLive = (t) => !!t && (t.tpl === 'office' || t.tpl === 'drawing' ||");
  return s;
});

/* ── 홈 ── */
edit('js/launcher/home.js', "t.tpl === 'office'", (s) => {
  s = rep(s, "const isDT = t.tpl === 'drawing' ||", "const isDT = t.tpl === 'office' || t.tpl === 'drawing' ||");
  s = rep(s, "      : pending.tpl === 'drawing' ? 'src/templates/drawing-main.jpg' : null;",
    "      : pending.tpl === 'drawing' ? 'src/templates/drawing-main.jpg'\n      : pending.tpl === 'office' ? 'src/templates/office-home.jpg' : null;");
  s = rep(s, "                  : proj.tpl === 'drawing' ? [",
    "                  : proj.tpl === 'office' ? [" + OF.slice(1).map((x) => "'" + x[0] + "'").join(', ') + "][i]\n                  : proj.tpl === 'drawing' ? [");
  s = rep(s, "      : openProj.tpl === 'drawing' ? (openProj.tplScene || 'main')",
    "      : openProj.tpl === 'office' ? (openProj.tplScene || 'home')\n      : openProj.tpl === 'drawing' ? (openProj.tplScene || 'main')");
  s = rep(s, "      if (openProj.tpl === 'drawing') localStorage.setItem('wemb-drawing-screen', openScene);",
    "      if (openProj.tpl === 'office') localStorage.setItem('wemb-office-screen', openScene);\n      if (openProj.tpl === 'drawing') localStorage.setItem('wemb-drawing-screen', openScene);");
  return s;
});

/* ── 작업공간 ── */
edit('js/studio/project.js', "f.tpl === 'office'", (s) => rep(s,
  "        else if (f.tpl === 'drawing') {",
  "        else if (f.tpl === 'office') {\n" +
  "          localStorage.setItem('wemb-tpl-dt', 'office'); localStorage.removeItem('wemb-tpl-img');\n" +
  "          const wantOf = (typeof OF_SCREENS !== 'undefined' && OF_SCREENS[f.scene]) ? f.scene : (localStorage.getItem('wemb-office-screen') || 'home');\n" +
  "          try { localStorage.setItem('wemb-office-screen', wantOf); } catch (e3) {}\n" +
  "          if (typeof applyOfficeDT === 'function') applyOfficeDT(wantOf);\n" +
  "        }\n" +
  "        else if (f.tpl === 'drawing') {"));

/* ── 저장된 화면 열기 ── */
edit('js/core/projects.js', "t.tpl === 'office'", (s) => {
  s = rep(s, "    try { if (t.tpl === 'drawing') localStorage.setItem('wemb-drawing-screen', t.tplScene || 'main'); } catch (e) {}",
    "    try { if (t.tpl === 'office') localStorage.setItem('wemb-office-screen', t.tplScene || 'home'); } catch (e) {}\n" +
    "    try { if (t.tpl === 'drawing') localStorage.setItem('wemb-drawing-screen', t.tplScene || 'main'); } catch (e) {}");
  return repAll(s, "if (t.tpl === 'drawing' || t.tpl === 'wnms'", "if (t.tpl === 'office' || t.tpl === 'drawing' || t.tpl === 'wnms'");
});

/* ── 새로고침 복원 · 밝기 복원 ── */
edit('js/main.js', "'office'", (s) => {
  s = rep(s, "    if (__tdt === 'drawing' && typeof applyDrawingDT === 'function') {",
    "    if (__tdt === 'office' && typeof applyOfficeDT === 'function') {\n" +
    "      applyOfficeDT(window.__officeSceneOf ? window.__officeSceneOf() : localStorage.getItem('wemb-office-screen'));\n" +
    "    }\n" +
    "    else if (__tdt === 'drawing' && typeof applyDrawingDT === 'function') {");
  s = rep(s, "  /* 스마트 도면관리도 Light 가 원본 — 고른 밝기(wemb-drawing-mode)는 그대로 되살아난다 */",
    "  /* 스마트 오피스도 Light 가 원본 — 고른 밝기(wemb-office-mode)는 그대로 되살아난다 */\n" +
    "  if (state.screen === 'dt' && localStorage.getItem('wemb-tpl-dt') === 'office') {\n" +
    "    const want = localStorage.getItem('wemb-office-mode') === 'dark' ? 'dark' : 'light';\n" +
    "    if (state.mode !== want) {\n" +
    "      state.mode = want;\n" +
    "      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));\n" +
    "    }\n" +
    "  }\n" +
    "  /* 스마트 도면관리도 Light 가 원본 — 고른 밝기(wemb-drawing-mode)는 그대로 되살아난다 */");
  return s;
});

/* ── 색 정하기 · 화면 테마 ── */
edit('js/templates/image.js', 'OFFICE_OPT', (s) => {
  s = rep(s, '  DRAWING_OPT: {',
    "  /* 스마트 오피스 시안 — 주조색은 파랑보라(#657AFF, 색상각 232°). 색을 그대로 둘 것: 도면 그림(평면도 · 히트맵).\n" +
    "     판 · 선 · 글자 · 단추 · 아이콘 · 차트는 따라간다 */\n" +
    "  OFFICE_OPT: {\n" +
    "    seed: '#657AFF', seededKey: 'wemb-office-seeded', refHue: 232,\n" +
    "    keep: /(^|\\/)(plan-image[-\\w]*|30-f-012[-\\w]*|heatmap[-\\w]*|floor-plan[-\\w]*)(\\.(svg|png|jpg))?(\\?|$)/i,\n" +
    "    raster: /$^/,\n" +
    "  },\n" +
    '  DRAWING_OPT: {');
  s = rep(s, "    /* 스마트 도면관리 화면 19장 — 같은 방식. 열린 장면만 칠한다 */",
    "    /* 스마트 오피스 화면 " + N + "장 — 같은 방식. 열린 장면만 칠한다 */\n" +
    "    [" + PXS.map((p) => "'" + p + "'").join(', ') + "].forEach((px) => {\n" +
    "      if (document.querySelector('.' + px + '-root')) this.icheonTint(t, mode, '.' + px + '-root', [px + '-style', px + '-light-style', 'office-live-style'], 'wemb-office-mode', this.OFFICE_OPT);\n" +
    "    });\n" +
    "    /* 스마트 도면관리 화면 19장 — 같은 방식. 열린 장면만 칠한다 */");
  return s;
});

/* ── 패널편집(내용 수정) — 모든 글자 ── */
edit('js/studio/dt-edit.js', '.ofha-root p', (s) => rep(s, ".dwm-root p, ", PXS.map((p) => '.' + p + '-root p').join(', ') + ", .dwm-root p, "));

/* ── '원자 변경' 창 ── */
edit('js/studio/atom-swap.js', "'ofha'", (s) => rep(s, "'dwm', ", PXS.map((p) => "'" + p + "'").join(', ') + ", 'dwm', "));

console.log('done ·', changed, '파일');
