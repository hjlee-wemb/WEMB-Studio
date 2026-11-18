/* 스튜디오 연결 — 복합화력 설비정보 디지털트윈 템플릿(tpl 'ccpp', 5장면)을 등록한다.
   이미 들어가 있으면 건너뛴다. 고객사 이름은 카드 · 화면 · 파일에 쓰지 않는다. 실행: node src/ccpp/_gen/patch-studio.js
   훅은 가장 최근 템플릿(plantdp) 훅 바로 앞에 넣는다 — 최신 템플릿이 tplIsLive · isDT · projects 목록 맨 앞이다.
   js/templates/ccpp.js 는 js/templates/plantdp.js 에서 매번 다시 뜬다. */
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
  if (s.indexOf(find) < 0) throw new Error('앵커 없음: ' + find.slice(0, 100));
  return s.replace(find, () => val);
}
function repAll(s, find, val) {
  if (s.indexOf(find) < 0) throw new Error('앵커 없음: ' + find.slice(0, 100));
  return s.split(find).join(val);
}
function bump(s, file) {
  const re = new RegExp(file.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&') + '\\?v=(\\d+)');
  if (!re.test(s)) throw new Error('판 번호 없음: ' + file);
  return s.replace(re, (m, n) => file + '?v=' + (+n + 1));
}
const CC = [['main', 'ccm', '설비 맵'], ['library', 'ccl', '도서관리'], ['diagram', 'ccd', '계통도'], ['detail', 'cce', '태그 · 상세정보'], ['file-open', 'ccf', '파일 열기']];
const PXS = CC.map((x) => x[1]);
const FRAG_PXS = ['ccta', 'cctb', 'cctc'];
const IMG = (x) => 'src/templates/ccpp-' + x[0] + '.jpg';
const TITLE = 'Digital Twin: Combined Cycle Power Plant';
const SEED = '#0073FF';

/* ── js/templates/ccpp.js — plantdp.js 를 떠서 만든다 ── */
{
  const dst = path.join(ROOT, 'js/templates/ccpp.js');
  let s = fs.readFileSync(path.join(ROOT, 'js/templates/plantdp.js'), 'utf8').replace(/\r\n/g, '\n');
  const a = s.indexOf('const PD_SCREENS = {'), b = s.indexOf('const PD_ROOTS');
  s = s.slice(0, a) + 'const CC_SCREENS = {\n'
    + CC.map((x) => "  '" + x[0] + "': { px: '" + x[1] + "', build: 'build_" + x[1] + "', css: '" + x[1].toUpperCase() + "_CSS', light: '" + x[1].toUpperCase() + "_LIGHT_CSS', title: '복합화력 설비정보 — " + x[2] + "' },").join('\n')
    + '\n};\n' + s.slice(b);
  s = s.replace(/^\/\* ── 발전소 디지털트윈 방재 템플릿 연결 ── \*\/\n/, '/* ── 복합화력 설비정보 디지털트윈 템플릿 연결 ── */\n');
  s = s.replace(/\/\* ── Digital Twin: Power Plant Disaster Prevention[\s\S]*?window\.initPlantdp\)\. \*\//,
    '/* ── ' + TITLE + ' — Figma 화면 5장을 순수 HTML/CSS DOM 으로 재구축한 것을 얹는다 ──\n   원본: Figma r7V2rTKcUto2Yd1qL4XSfZ (REM 섹션, 가상 데이터 반영본) · 생성기 src/ccpp/_gen.\n   글자는 전부 편집 가능한 실제 텍스트(Pretendard CDN), 아이콘 · 그래픽만 Figma 가 내보낸 개별 svg/png(src/ccpp/).\n   원본이 라이트 시안이라 처음엔 라이트로 연다(다크는 생성기가 파생, _gen/dark.js · mk-dark-svgs.js · mk-dark-diagram.ps1).\n   인터랙션 · 라이브 · 반응형 · 탭 조각 · 차트 바꾸기 · 패널 옮기기는 src/ccpp-live.js(window.initCcpp). */');
  s = s.replace(/const PD_ROOTS = [^\n]*/, "const CC_ROOTS = '" + PXS.map((p) => '.' + p + '-root').join(', ') + "';");
  s = s.replace(/\/\* 시안 자신의 주조색[^\n]*\nconst PD_SEED = '#2A74F4';/, "/* 시안 자신의 주조색 — 파랑(" + SEED + "). '색 정하기'의 시작값 */\nconst CC_SEED = '" + SEED + "';");
  s = s.split('wemb-plantdp').join('wemb-ccpp').split('PD_').join('CC_').split('Plantdp').join('Ccpp').split("'plantdp'").join("'ccpp'").split('__plantdpSceneOf').join('__ccppSceneOf');
  s = s.replace(/src\/plantdp-live\.js/g, 'src/ccpp-live.js').split('src/plantdp/').join('src/ccpp/');
  fs.writeFileSync(dst, s);
  if (/plantdp|initPlantdp|PD_/i.test(s)) console.log('  ! ccpp.js 에 plantdp 흔적', (s.match(/.{20}(plantdp|PD_).{20}/i) || [''])[0]);
  console.log('  wrote js/templates/ccpp.js');
}

/* ── 화면 모듈 표 ── */
edit('js/core/tpl-modules.js', 'ccpp-main.js', (s) => {
  s = rep(s, '    plantdp: [\n',
    '    /* 복합화력 설비정보 디지털트윈 — Figma r7V2rTKcUto2Yd1qL4XSfZ. 화면 5장, 장면마다 따로 싣는다(탭 조각 · 라이브는 공통) */\n    ccpp: [\n'
    + CC.map((x) => "      { src: 'src/ccpp-" + x[0] + ".js?v=1', build: ['build_" + x[1] + "'], scene: '" + x[0] + "' },").join('\n')
    + "\n      { src: 'src/ccpp-tabs.js?v=1', part: 'base' },\n      { src: 'src/ccpp-live.js?v=1', part: 'base' },\n    ],\n    plantdp: [\n");
  s = rep(s, "    plantdp: { key: 'wemb-plantdp-screen', def: 'main' },\n", "    ccpp: { key: 'wemb-ccpp-screen', def: 'main' },\n    plantdp: { key: 'wemb-plantdp-screen', def: 'main' },\n");
  return s;
});

edit('studio.html', 'js/templates/ccpp.js', (s) => {
  s = rep(s, '    <script src="js/templates/plantdp.js?v=',
    '    <!-- 복합화력 설비정보 디지털트윈 — Figma r7V2rTKcUto2Yd1qL4XSfZ 화면 5장을 순수 HTML/CSS DOM 으로 재구축.\n' +
    '         화면 모듈은 js/core/tpl-modules.js 가 싣는다. 생성기: src/ccpp/_gen/. -->\n' +
    '    <script src="js/templates/ccpp.js?v=1"></script>\n' +
    '    <script src="js/templates/plantdp.js?v=');
  ['js/core/tpl-modules.js', 'js/templates/image.js', 'js/studio/dt-edit.js', 'js/main.js', 'js/studio/project.js', 'js/core/projects.js', 'js/studio/atom-swap.js', 'js/core/meeting.js'].forEach((f) => { s = bump(s, f); });
  return s;
});
edit('index.html', '<!-- ccpp -->', (s) => {
  ['js/core/projects.js', 'js/core/meeting.js', 'js/launcher/templates.js', 'js/launcher/home.js'].forEach((f) => { s = bump(s, f); });
  return s.replace('</head>', '<!-- ccpp -->\n</head>');
});
edit('present.html', '<!-- ccpp -->', (s) => {
  ['js/core/projects.js', 'js/core/meeting.js'].forEach((f) => { s = bump(s, f); });
  return s.replace('</head>', '<!-- ccpp -->\n</head>');
});

/* ── 템플릿 카탈로그 — 새 카드 ── */
edit('js/launcher/templates.js', "w.tpl = 'ccpp'", (s) => {
  s = rep(s, "    { title: 'Digital Twin: Power Plant Disaster Prevention', area:",
    "    { title: '" + TITLE + "', area: '에너지·환경', date: 'November 17, 2026', slides: [\n" +
    CC.map((x) => "      { img: '" + IMG(x) + "?v=1', label: '" + x[2] + "' }").join(',\n') + '] },\n' +
    "    { title: 'Digital Twin: Power Plant Disaster Prevention', area:");
  s = rep(s, "  /* 발전소 디지털트윈 방재 — '스튜디오 열기' 시",
    "  /* 복합화력 설비정보 디지털트윈 — '스튜디오 열기' 시 Figma(r7V2rTKcUto2Yd1qL4XSfZ) 화면 5장을\n" +
    "     순수 HTML/CSS DOM 으로 재구축한 것(src/ccpp-*.js)으로 연다. */\n" +
    "  (function () {\n" +
    "    const w = TEMPLATES.find((t) => t.title === '" + TITLE + "');\n" +
    "    if (w) w.tpl = 'ccpp';\n" +
    "  })();\n" +
    "  /* 발전소 디지털트윈 방재 — '스튜디오 열기' 시");
  s = rep(s, "const tplIsLive = (t) => !!t && (t.tpl === 'plantdp' ||", "const tplIsLive = (t) => !!t && (t.tpl === 'ccpp' || t.tpl === 'plantdp' ||");
  return s;
});

/* ── 홈 ── */
edit('js/launcher/home.js', "t.tpl === 'ccpp'", (s) => {
  s = rep(s, "const isDT = t.tpl === 'plantdp' ||", "const isDT = t.tpl === 'ccpp' || t.tpl === 'plantdp' ||");
  s = rep(s, "      : pending.tpl === 'plantdp' ? 'src/templates/plantdp-main.jpg",
    "      : pending.tpl === 'ccpp' ? 'src/templates/ccpp-main.jpg?v=1'\n      : pending.tpl === 'plantdp' ? 'src/templates/plantdp-main.jpg");
  s = rep(s, "                  : proj.tpl === 'plantdp' ? [",
    "                  : proj.tpl === 'ccpp' ? [" + CC.slice(1).map((x) => "'" + x[0] + "'").join(', ') + "][i]\n                  : proj.tpl === 'plantdp' ? [");
  s = rep(s, "      : openProj.tpl === 'plantdp' ? (openProj.tplScene || 'main')",
    "      : openProj.tpl === 'ccpp' ? (openProj.tplScene || 'main')\n      : openProj.tpl === 'plantdp' ? (openProj.tplScene || 'main')");
  s = rep(s, "      if (openProj.tpl === 'plantdp') localStorage.setItem('wemb-plantdp-screen', openScene);",
    "      if (openProj.tpl === 'ccpp') localStorage.setItem('wemb-ccpp-screen', openScene);\n      if (openProj.tpl === 'plantdp') localStorage.setItem('wemb-plantdp-screen', openScene);");
  return s;
});

/* ── 작업공간 ── */
edit('js/studio/project.js', "f.tpl === 'ccpp'", (s) => rep(s,
  "        else if (f.tpl === 'plantdp') {",
  "        else if (f.tpl === 'ccpp') {\n" +
  "          localStorage.setItem('wemb-tpl-dt', 'ccpp'); localStorage.removeItem('wemb-tpl-img');\n" +
  "          const wantCc = (typeof CC_SCREENS !== 'undefined' && CC_SCREENS[f.scene]) ? f.scene : (localStorage.getItem('wemb-ccpp-screen') || 'main');\n" +
  "          try { localStorage.setItem('wemb-ccpp-screen', wantCc); } catch (e3) {}\n" +
  "          if (typeof applyCcppDT === 'function') applyCcppDT(wantCc);\n" +
  "        }\n" +
  "        else if (f.tpl === 'plantdp') {"));

/* ── 저장된 화면 열기 ── */
edit('js/core/projects.js', "t.tpl === 'ccpp'", (s) => {
  s = rep(s, "    try { if (t.tpl === 'plantdp') localStorage.setItem('wemb-plantdp-screen', t.tplScene || 'main'); } catch (e) {}",
    "    try { if (t.tpl === 'ccpp') localStorage.setItem('wemb-ccpp-screen', t.tplScene || 'main'); } catch (e) {}\n" +
    "    try { if (t.tpl === 'plantdp') localStorage.setItem('wemb-plantdp-screen', t.tplScene || 'main'); } catch (e) {}");
  return repAll(s, "if (t.tpl === 'plantdp' || t.tpl === 'indpark'", "if (t.tpl === 'ccpp' || t.tpl === 'plantdp' || t.tpl === 'indpark'");
});

/* ── 새로고침 복원 · 밝기 복원 ── */
edit('js/main.js', "'ccpp'", (s) => {
  s = rep(s, "    else if (__tdt === 'plantdp' && typeof applyPlantdpDT === 'function') {",
    "    else if (__tdt === 'ccpp' && typeof applyCcppDT === 'function') {\n" +
    "      applyCcppDT(window.__ccppSceneOf ? window.__ccppSceneOf() : localStorage.getItem('wemb-ccpp-screen'));\n" +
    "    }\n" +
    "    else if (__tdt === 'plantdp' && typeof applyPlantdpDT === 'function') {");
  s = rep(s, "  /* 발전소 방재는 Light 가 원본 — 고른 밝기(wemb-plantdp-mode)는 그대로 되살아난다 */",
    "  /* 복합화력 설비정보는 Light 가 원본 — 고른 밝기(wemb-ccpp-mode)는 그대로 되살아난다 */\n" +
    "  if (state.screen === 'dt' && localStorage.getItem('wemb-tpl-dt') === 'ccpp') {\n" +
    "    const want = localStorage.getItem('wemb-ccpp-mode') === 'dark' ? 'dark' : 'light';\n" +
    "    if (state.mode !== want) {\n" +
    "      state.mode = want;\n" +
    "      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));\n" +
    "    }\n" +
    "  }\n" +
    "  /* 발전소 방재는 Light 가 원본 — 고른 밝기(wemb-plantdp-mode)는 그대로 되살아난다 */");
  return s;
});

/* ── 색 정하기 · 화면 테마 ── */
edit('js/templates/image.js', 'CCPP_OPT', (s) => {
  s = rep(s, '  PLANTDP_OPT: {',
    "  /* 복합화력 설비정보 디지털트윈 — 주조색은 파랑(" + SEED + ", 색상각 213°). 색을 그대로 둘 것: 3D 설비 그림 · 계통도 그림(과 그 다크 사본) · 로고 · 상태 칩.\n" +
    "     판 · 선 · 글자 · 아이콘 · 차트는 따라간다 */\n" +
    "  CCPP_OPT: {\n" +
    "    seed: '" + SEED + "', seededKey: 'wemb-ccpp-seeded', refHue: 213,\n" +
    "    keep: /(^|\\/)(3-dscene|diagram-image|glyph-dk|glyph\\.svg|logo)[-\\w]*\\.(svg|png|jpg)(\\?|$)/i,\n" +
    "    raster: /$^/,\n" +
    "  },\n" +
    '  PLANTDP_OPT: {');
  s = rep(s, "    /* 발전소 방재 화면 10장 — 같은 방식. 열린 장면만 칠한다 */",
    "    /* 복합화력 설비정보 화면 5장 — 같은 방식. 열린 장면만 칠한다 */\n" +
    "    [" + PXS.map((p) => "'" + p + "'").join(', ') + "].forEach((px) => {\n" +
    "      if (document.querySelector('.' + px + '-root')) this.icheonTint(t, mode, '.' + px + '-root', [px + '-style', px + '-light-style', 'ccpp-live-style'], 'wemb-ccpp-mode', this.CCPP_OPT);\n" +
    "    });\n" +
    "    /* 상세 팝업 탭 조각(src/ccpp-tabs.js) — 갈아 끼운 설계 · 설비 · 자재도 같은 색으로 */\n" +
    "    [" + FRAG_PXS.map((p) => "'" + p + "'").join(', ') + "].forEach((px) => {\n" +
    "      if (document.querySelector('.' + px + '-root')) this.icheonTint(t, mode, '.' + px + '-root', ['ccpp-tab-design', 'ccpp-tab-equipment', 'ccpp-tab-materials'], 'wemb-ccpp-mode', this.CCPP_OPT);\n" +
    "    });\n" +
    "    /* 발전소 방재 화면 10장 — 같은 방식. 열린 장면만 칠한다 */");
  return s;
});

/* ── 패널편집(내용 수정) — 모든 글자(탭 조각 · 운전정보 카드 제목 포함) ── */
edit('js/studio/dt-edit.js', '.ccm-root p', (s) => rep(s, ".pdm-root p, ", PXS.concat(FRAG_PXS).map((p) => '.' + p + '-root p').join(', ') + ", .cc-opcard h4, .pdm-root p, "));

/* ── '원자 변경' 창 ── */
edit('js/studio/atom-swap.js', "'ccm'", (s) => rep(s, "'pdm', ", PXS.map((p) => "'" + p + "'").join(', ') + ", 'pdm', "));

/* ── 회의 모드 — 원본 고객사 · 지명(Figma 파일 이름 · 옛 데이터에 남을 수 있다) ── */
edit('js/core/meeting.js', "'고성'", (s) => rep(s, "'KOEN', ", "'KOEN', '고성', 'Goseong', 'goseong', "));

console.log('done ·', changed, '파일');
