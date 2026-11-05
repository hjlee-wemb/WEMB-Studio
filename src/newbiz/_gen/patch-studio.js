/* 스튜디오 연결 — 신사업 관리 템플릿(tpl 'newbiz', 11장면)을 등록한다(이미 들어가 있으면 건너뛴다).
   고객사 이름은 카드에 쓰지 않는다. 실행: node src/newbiz/_gen/patch-studio.js */
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
const NB = [
  ['wind', 'nbw', '재생에너지 · 풍향'], ['solar', 'nbs', '재생에너지 · 태양광'], ['energy', 'nbe', '재생에너지 · 에너지'],
  ['wind-input', 'nbk', '풍향 · 툴팁 인풋'], ['solar-input', 'nbl', '태양광 · 툴팁 인풋'], ['energy-input', 'nbg', '에너지 · 툴팁 인풋'],
  ['measure', 'nbm', '계측현황'], ['measure-wind', 'nbt', '계측현황 · 풍력 툴팁'], ['measure-solar', 'nbu', '계측현황 · 태양광 툴팁'], ['measure-popup', 'nbp', '계측현황 · 사업 팝업'],
  ['overseas', 'nbo', '해외사업'],
];
const PXS = NB.map((x) => x[1]);
const IMG = (x) => 'src/templates/newbiz-' + x[0] + '.jpg';
const TITLE = 'Dashboard: New Business Management';

/* ── js/templates/newbiz.js ── */
{
  const dst = path.join(ROOT, 'js/templates/newbiz.js');
  let s = fs.readFileSync(path.join(ROOT, 'js/templates/statcom.js'), 'utf8').replace(/\r\n/g, '\n');
  const a = s.indexOf('const SC_SCREENS = {'), b = s.indexOf('const SC_ROOTS');
  s = s.slice(0, a) + 'const NB_SCREENS = {\n'
    + NB.map((x) => "  '" + x[0] + "': { px: '" + x[1] + "', build: 'build_" + x[1] + "', css: '" + x[1].toUpperCase() + "_CSS', light: '" + x[1].toUpperCase() + "_LIGHT_CSS', title: '신사업 관리 — " + x[2] + "' },").join('\n')
    + '\n};\n' + s.slice(b);
  s = s.replace(/^\/\* ── STATCOM HMI[^\n]*\n/, '/* ── 신사업 관리 대시보드 템플릿 연결 ── */\n');
  s = s.replace(/\/\* ── Digital Twin: STATCOM HMI[\s\S]*?window\.initStatcom\)\. \*\//,
    '/* ── ' + TITLE + ' — Figma 화면 11장을 순수 HTML/CSS DOM 으로 재구축한 것을 얹는다 ──\n   원본: Figma cES6X45zHjsaabaXL1cdrt (page "Dark-시안01") · 생성기 src/newbiz/_gen.\n   글자는 전부 편집 가능한 실제 텍스트(Pretendard CDN), 아이콘 · 그래픽만 Figma 가 내보낸 개별 svg/png(src/newbiz/).\n   인터랙션 · 라이브 · 반응형 · 차트 바꾸기 · 패널 옮기기는 src/newbiz-live.js(window.initNewbiz). */');
  s = s.replace(/const SC_ROOTS = [^\n]*/, "const NB_ROOTS = '" + PXS.map((p) => '.' + p + '-root').join(', ') + "';");
  s = s.replace(/\/\* 시안 자신의 주조색[^\n]*\nconst SC_SEED = '#00B9F0';/, "/* 시안 자신의 주조색 — 시안 하늘색(#7FD3FA). '색 정하기'의 시작값 */\nconst NB_SEED = '#7FD3FA';");
  s = s.split('wemb-statcom').join('wemb-newbiz').split('SC_').join('NB_').split('Statcom').join('Newbiz').split("'statcom'").join("'newbiz'").split('__statcomSceneOf').join('__newbizSceneOf');
  s = s.split("|| 'main'").join("|| 'wind'").split("'main'").join("'wind'").split('NB_SCREENS.main').join('NB_SCREENS.wind').split("NB_SCREENS['wind']").join("NB_SCREENS['wind']");
  s = s.replace(/src\/statcom-live\.js/g, 'src/newbiz-live.js').replace('사이드 메뉴가', '헤더 메뉴 · 탭이');
  fs.writeFileSync(dst, s);
  if (/statcom/i.test(s)) console.log('  ! newbiz.js 에 statcom 흔적', s.match(/.{20}statcom.{20}/i)[0]);
  console.log('  wrote js/templates/newbiz.js');
}

/* ── 화면 모듈 표 ── */
edit('js/core/tpl-modules.js', 'newbiz-wind.js', (s) => {
  s = rep(s, '    /* STATCOM HMI 디지털 트윈 — Figma lyDJkcOlrznLKWo7mD7C2n. 화면 11장, 장면마다 따로 싣는다 */\n',
    '    /* 신사업 관리 대시보드 — Figma cES6X45zHjsaabaXL1cdrt. 화면 11장, 장면마다 따로 싣는다 */\n    newbiz: [\n'
    + NB.map((x) => "      { src: 'src/newbiz-" + x[0] + ".js?v=1', build: ['build_" + x[1] + "'], scene: '" + x[0] + "' },").join('\n')
    + "\n      { src: 'src/newbiz-live.js?v=1', part: 'base' },\n    ],\n"
    + '    /* STATCOM HMI 디지털 트윈 — Figma lyDJkcOlrznLKWo7mD7C2n. 화면 11장, 장면마다 따로 싣는다 */\n');
  s = rep(s, "    statcom: { key: 'wemb-statcom-screen', def: 'main' },\n", "    statcom: { key: 'wemb-statcom-screen', def: 'main' },\n    newbiz: { key: 'wemb-newbiz-screen', def: 'wind' },\n");
  return s;
});

if (!fs.readFileSync(path.join(ROOT, 'js/launcher/templates.js'), 'utf8').includes("w.tpl = 'newbiz'")) {
  edit('studio.html', 'js/templates/newbiz.js', (s) => {
    s = rep(s, '    <!-- STATCOM HMI 디지털 트윈 — Figma lyDJkcOlrznLKWo7mD7C2n',
      '    <!-- 신사업 관리 대시보드 — Figma cES6X45zHjsaabaXL1cdrt 화면 11장을 순수 HTML/CSS DOM 으로 재구축.\n' +
      '         화면 모듈은 js/core/tpl-modules.js 가 싣는다. 생성기: src/newbiz/_gen/. -->\n' +
      '    <script src="js/templates/newbiz.js?v=1"></script>\n' +
      '    <!-- STATCOM HMI 디지털 트윈 — Figma lyDJkcOlrznLKWo7mD7C2n');
    ['js/core/tpl-modules.js', 'js/templates/image.js', 'js/studio/dt-edit.js', 'js/main.js', 'js/studio/project.js', 'js/core/projects.js', 'js/studio/atom-swap.js', 'js/core/meeting.js'].forEach((f) => { s = bump(s, f); });
    s = s.replace(/css\/preview\/digital-twin\.css\?v=(\d+)/, (m, n) => 'css/preview/digital-twin.css?v=' + (+n + 1));
    return s;
  });
  const P1 = path.join(ROOT, 'index.html'), P2 = path.join(ROOT, 'present.html');
  let i1 = fs.readFileSync(P1, 'utf8');
  ['js/core/projects.js', 'js/core/meeting.js', 'js/launcher/templates.js', 'js/launcher/home.js'].forEach((f) => { i1 = bump(i1, f); });
  fs.writeFileSync(P1, i1);
  let i2 = fs.readFileSync(P2, 'utf8');
  ['js/core/projects.js', 'js/core/meeting.js'].forEach((f) => { i2 = bump(i2, f); });
  fs.writeFileSync(P2, i2);
}

/* ── 템플릿 카탈로그 ── */
edit('js/launcher/templates.js', "w.tpl = 'newbiz'", (s) => {
  const m = /\n  \];\n(\s*)(?:\/\/[^\n]*\n\s*|\/\*[\s\S]*?\*\/\s*)*(?:const|var|let) TEMPLATES/.exec(s);
  if (!m) throw new Error('TPL_DEFS 끝을 못 찾음');
  s = s.slice(0, m.index) +
    "\n    { title: '" + TITLE + "', area: '발전·에너지', date: 'January 15, 2026', slides: [\n" +
    NB.map((x) => "      { img: '" + IMG(x) + "', label: '" + x[2] + "' }").join(',\n') + '] },' + s.slice(m.index);
  s = rep(s, "  /* STATCOM HMI 디지털 트윈 — '스튜디오 열기' 시",
    "  /* 신사업 관리 대시보드 — '스튜디오 열기' 시 Figma(cES6X45zHjsaabaXL1cdrt) 화면 11장을\n" +
    "     순수 HTML/CSS DOM 으로 재구축한 것(src/newbiz-*.js)으로 연다. */\n" +
    "  (function () {\n" +
    "    const w = TEMPLATES.find((t) => t.title === '" + TITLE + "');\n" +
    "    if (w) w.tpl = 'newbiz';\n" +
    "  })();\n" +
    "  /* STATCOM HMI 디지털 트윈 — '스튜디오 열기' 시");
  s = rep(s, "const tplIsLive = (t) => !!t && (t.tpl === 'statcom' ||", "const tplIsLive = (t) => !!t && (t.tpl === 'newbiz' || t.tpl === 'statcom' ||");
  return s;
});

/* ── 홈 ── */
edit('js/launcher/home.js', "t.tpl === 'newbiz'", (s) => {
  s = rep(s, "const isDT = t.tpl === 'statcom' ||", "const isDT = t.tpl === 'newbiz' || t.tpl === 'statcom' ||");
  s = rep(s, "      : pending.tpl === 'statcom' ? 'src/templates/statcom-main.jpg' : null;",
    "      : pending.tpl === 'statcom' ? 'src/templates/statcom-main.jpg'\n      : pending.tpl === 'newbiz' ? 'src/templates/newbiz-wind.jpg' : null;");
  s = rep(s, "                  : proj.tpl === 'statcom' ? [",
    "                  : proj.tpl === 'newbiz' ? [" + NB.slice(1).map((x) => "'" + x[0] + "'").join(', ') + "][i]\n                  : proj.tpl === 'statcom' ? [");
  s = rep(s, "      : openProj.tpl === 'statcom' ? (openProj.tplScene || 'main')",
    "      : openProj.tpl === 'newbiz' ? (openProj.tplScene || 'wind')\n      : openProj.tpl === 'statcom' ? (openProj.tplScene || 'main')");
  s = rep(s, "      if (openProj.tpl === 'statcom') localStorage.setItem('wemb-statcom-screen', openScene);",
    "      if (openProj.tpl === 'newbiz') localStorage.setItem('wemb-newbiz-screen', openScene);\n      if (openProj.tpl === 'statcom') localStorage.setItem('wemb-statcom-screen', openScene);");
  return s;
});

/* ── 작업공간 ── */
edit('js/studio/project.js', "f.tpl === 'newbiz'", (s) => rep(s,
  "        else if (f.tpl === 'statcom') {",
  "        else if (f.tpl === 'newbiz') {\n" +
  "          localStorage.setItem('wemb-tpl-dt', 'newbiz'); localStorage.removeItem('wemb-tpl-img');\n" +
  "          const wantNb = (typeof NB_SCREENS !== 'undefined' && NB_SCREENS[f.scene]) ? f.scene : (localStorage.getItem('wemb-newbiz-screen') || 'wind');\n" +
  "          try { localStorage.setItem('wemb-newbiz-screen', wantNb); } catch (e3) {}\n" +
  "          if (typeof applyNewbizDT === 'function') applyNewbizDT(wantNb);\n" +
  "        }\n" +
  "        else if (f.tpl === 'statcom') {"));

/* ── 저장된 화면 열기 ── */
edit('js/core/projects.js', "t.tpl === 'newbiz'", (s) => {
  s = rep(s, "    try { if (t.tpl === 'statcom') localStorage.setItem('wemb-statcom-screen', t.tplScene || 'main'); } catch (e) {}",
    "    try { if (t.tpl === 'newbiz') localStorage.setItem('wemb-newbiz-screen', t.tplScene || 'wind'); } catch (e) {}\n" +
    "    try { if (t.tpl === 'statcom') localStorage.setItem('wemb-statcom-screen', t.tplScene || 'main'); } catch (e) {}");
  return repAll(s, "if (t.tpl === 'statcom' || t.tpl === 'plant'", "if (t.tpl === 'newbiz' || t.tpl === 'statcom' || t.tpl === 'plant'");
});

/* ── 새로고침 복원 · 밝기 복원 ── */
edit('js/main.js', "'newbiz'", (s) => {
  s = rep(s, "    if (__tdt === 'statcom' && typeof applyStatcomDT === 'function') {",
    "    if (__tdt === 'newbiz' && typeof applyNewbizDT === 'function') {\n" +
    "      applyNewbizDT(window.__newbizSceneOf ? window.__newbizSceneOf() : localStorage.getItem('wemb-newbiz-screen'));\n" +
    "    }\n" +
    "    else if (__tdt === 'statcom' && typeof applyStatcomDT === 'function') {");
  s = rep(s, "  /* STATCOM HMI 도 Dark 가 원본 — 고른 밝기(wemb-statcom-mode)는 그대로 되살아난다 */",
    "  /* 신사업 관리도 Dark 가 원본 — 고른 밝기(wemb-newbiz-mode)는 그대로 되살아난다 */\n" +
    "  if (state.screen === 'dt' && localStorage.getItem('wemb-tpl-dt') === 'newbiz') {\n" +
    "    const want = localStorage.getItem('wemb-newbiz-mode') === 'light' ? 'light' : 'dark';\n" +
    "    if (state.mode !== want) {\n" +
    "      state.mode = want;\n" +
    "      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));\n" +
    "    }\n" +
    "  }\n" +
    "  /* STATCOM HMI 도 Dark 가 원본 — 고른 밝기(wemb-statcom-mode)는 그대로 되살아난다 */");
  return s;
});

/* ── 색 정하기 · 화면 테마 · 로고 ── */
edit('js/templates/image.js', 'NEWBIZ_OPT', (s) => {
  s = rep(s, "    '.tcm-root [data-name=\"Logo Image\"], ",
    "    '" + PXS.map((p) => '.' + p + '-root [data-name="Logo Mark"]').join(', ') + ", ' +\n    '.tcm-root [data-name=\"Logo Image\"], ");
  s = rep(s, '  STATCOM_OPT: {',
    "  /* 신사업 관리 시안 — 주조색은 하늘색(#7FD3FA, 색상각 199°). 색을 그대로 둘 것: 로고 · 터빈 · 태양광 패널 사진 · 국기 · 단계 배지.\n" +
    "     지도 그림과 판 · 선 · 글자는 따라간다 */\n" +
    "  NEWBIZ_OPT: {\n" +
    "    seed: '#7FD3FA', seededKey: 'wemb-newbiz-seeded', refHue: 199,\n" +
    "    keep: /(^|\\/)(logo-mark|turbine-image|solar-panel-image|flag|mask-?group|artwork|ellipse|shape|path)[-\\w]*(-lt)?\\.(svg|png)(\\?|$)/i,\n" +
    "    raster: /$^/,\n" +
    "  },\n" +
    '  STATCOM_OPT: {');
  s = rep(s, "    /* STATCOM HMI 화면 11장 — 같은 방식. 열린 장면만 칠한다 */",
    "    /* 신사업 관리 화면 11장 — 같은 방식. 열린 장면만 칠한다 */\n" +
    "    [" + PXS.map((p) => "'" + p + "'").join(', ') + "].forEach((px) => {\n" +
    "      if (document.querySelector('.' + px + '-root')) this.icheonTint(t, mode, '.' + px + '-root', [px + '-style', px + '-light-style', 'newbiz-live-style'], 'wemb-newbiz-mode', this.NEWBIZ_OPT);\n" +
    "    });\n" +
    "    /* STATCOM HMI 화면 11장 — 같은 방식. 열린 장면만 칠한다 */");
  return s;
});

/* ── 로고 자리 ── */
edit('css/preview/digital-twin.css', '.nbw-root [data-name="Logo Mark"]', (s) => rep(s,
  '.tcm-root [data-name="Logo Image"][data-studio-logo],',
  PXS.map((p) => '.' + p + '-root [data-name="Logo Mark"][data-studio-logo]').join(',\n') + ' {\n  width: 190.154px !important;\n  height: 24px !important;\n}\n' +
  PXS.map((p) => '.' + p + '-root [data-name="Logo Mark"] .tpl-studio-logo').join(',\n') + ' {\n  position: absolute;\n  left: 0;\n  top: 0;\n  width: 100%;\n  height: 100%;\n  object-fit: contain;\n  object-position: left center;\n}\n' +
  PXS.map((p) => '.' + p + '-root[data-theme="light"] .tpl-studio-logo').join(',\n') + ' {\n  content: url(../../src/studio-logo-lt.svg);\n}\n' +
  '.tcm-root [data-name="Logo Image"][data-studio-logo],'));

/* ── 패널편집(내용 수정) — 모든 글자 ── */
edit('js/studio/dt-edit.js', '.nbw-root p', (s) => rep(s, ".tcm-root p, ", PXS.map((p) => '.' + p + '-root p').join(', ') + ", .tcm-root p, "));

/* ── '원자 변경' 창 ── */
edit('js/studio/atom-swap.js', "'nbw'", (s) => rep(s, "'tcm', ", PXS.map((p) => "'" + p + "'").join(', ') + ", 'tcm', "));

/* ── 회의 모드 — 가릴 이름 ── */
edit('js/core/meeting.js', "'KOEN'", (s) => rep(s, "'HYOSUNG', ", "'KOEN', '한국남동발전', '남동발전', 'HYOSUNG', "));

console.log('done ·', changed, '파일');
