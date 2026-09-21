/* 스튜디오 연결 — LS Electric STATCOM 템플릿(tpl 'lselectric', 장면 statcom · datacenter)을
   POSCO 와 같은 자리에 등록한다(한 번만 돌린다. 이미 들어가 있으면 건너뛴다).
   실행: node src/lselectric/_gen/patch-studio.js */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
let changed = 0;
function edit(file, marker, fn) {
  const p = path.join(ROOT, file);
  const before = fs.readFileSync(p, 'utf8');
  if (before.indexOf(marker) >= 0) { console.log('  (이미 있음)', file, '·', marker.slice(0, 40)); return; }
  const crlf = before.indexOf('\r\n') >= 0;
  let s = crlf ? before.replace(/\r\n/g, '\n') : before;
  s = fn(s);
  if (crlf) s = s.replace(/\n/g, '\r\n');
  fs.writeFileSync(p, s);
  changed++;
  console.log('  patched', file);
}
function rep(s, find, val) {
  if (s.indexOf(find) < 0) throw new Error('앵커 없음: ' + find.slice(0, 80));
  return s.replace(find, () => val);
}

/* ── studio.html — 화면 모듈 · 라이브 · 연결 스크립트, 바뀐 파일의 ?v= ── */
edit('studio.html', 'src/lselectric-statcom.js', (s) => {
  s = rep(s, '    <script src="js/data/symbols.js?v=1"></script>',
    '    <!-- LS Electric STATCOM — Figma KkmCQi05F7eSb3tHO7ZW0Q 의 화면 2장(STATCOM 3:5 · Data Center 33:748)을\n' +
    '         순수 HTML/CSS DOM 으로 재구축한 것. 글자는 편집 가능한 실제 텍스트,\n' +
    '         아이콘·그래픽만 원본에서 내려받은 개별 에셋(src/lselectric/). 생성기: src/lselectric/_gen/. -->\n' +
    '    <script src="src/lselectric-statcom.js?v=1"></script>\n' +
    '    <script src="src/lselectric-datacenter.js?v=1"></script>\n' +
    '    <script src="src/lselectric-live.js?v=1"></script>\n\n' +
    '    <script src="js/data/symbols.js?v=1"></script>');
  s = rep(s, '    <script src="js/templates/posco.js?v=6"></script>',
    '    <script src="js/templates/posco.js?v=6"></script>\n    <script src="js/templates/lselectric.js?v=1"></script>');
  s = rep(s, 'js/templates/image.js?v=5', 'js/templates/image.js?v=6');
  s = rep(s, 'js/studio/dt-edit.js?v=4', 'js/studio/dt-edit.js?v=5');
  s = rep(s, 'js/main.js?v=4', 'js/main.js?v=5');
  s = rep(s, 'js/studio/project.js?v=6', 'js/studio/project.js?v=7');
  s = rep(s, 'js/core/projects.js?v=3', 'js/core/projects.js?v=4');
  return s;
});

/* ── index.html — 홈이 쓰는 파일의 ?v= ── */
edit('index.html', 'js/launcher/templates.js?v=4', (s) => {
  s = rep(s, 'js/core/projects.js?v=3', 'js/core/projects.js?v=4');
  s = rep(s, 'js/launcher/templates.js?v=3', 'js/launcher/templates.js?v=4');
  s = rep(s, 'js/launcher/home.js?v=7', 'js/launcher/home.js?v=8');
  return s;
});

/* ── 템플릿 카탈로그 ── */
edit('js/launcher/templates.js', 'LS Electric STATCOM', (s) => {
  s = rep(s, "    { title: 'Digital Twin: POSCO KDB CCTV 관제', area: '물리보안', date: 'January 20, 2025', slides: [\n      { img: 'src/templates/posco-main.jpg', label: '메인' }] },",
    "    { title: 'Digital Twin: POSCO KDB CCTV 관제', area: '물리보안', date: 'January 20, 2025', slides: [\n      { img: 'src/templates/posco-main.jpg', label: '메인' }] },\n" +
    "    { title: 'Digital Twin: LS Electric STATCOM', area: '발전·에너지', date: 'February 26, 2024', slides: [\n" +
    "      { img: 'src/templates/lselectric-statcom.jpg', label: 'STATCOM' }] },");
  s = rep(s, '  /* 실제 화면이 붙어 있는 템플릿인지',
    "  /* LS Electric STATCOM — '스튜디오 열기' 시 Figma(KkmCQi05F7eSb3tHO7ZW0Q) 화면 2장을\n" +
    "     순수 HTML/CSS DOM 으로 재구축한 것(src/lselectric-*.js)으로 연다. 상세 미리보기도 그 화면을 그대로 캡처한 것이다. */\n" +
    "  (function () {\n" +
    "    const ls = TEMPLATES.find((t) => t.title === 'Digital Twin: LS Electric STATCOM');\n" +
    "    if (ls) {\n" +
    "      ls.tpl = 'lselectric';\n" +
    "      ls.img = 'src/templates/lselectric-statcom.jpg';\n" +
    "      /* 화면 2장 — 슬라이드 순서가 곧 프로젝트 안의 화면 순서다(home.js 의 tplScene 표와 짝) */\n" +
    "      ls.slides = [\n" +
    "        { img: 'src/templates/lselectric-statcom.jpg', label: 'STATCOM' },\n" +
    "        { img: 'src/templates/lselectric-datacenter.jpg', label: 'Data Center' },\n" +
    "      ];\n" +
    "    }\n" +
    "  })();\n" +
    '  /* 실제 화면이 붙어 있는 템플릿인지');
  s = rep(s, "const tplIsLive = (t) => !!t && (t.tpl === 'posco' ||", "const tplIsLive = (t) => !!t && (t.tpl === 'lselectric' || t.tpl === 'posco' ||");
  return s;
});

/* ── 홈 — 템플릿으로 새 프로젝트 만들기 ── */
edit('js/launcher/home.js', "'lselectric'", (s) => {
  s = rep(s, "const isDT = t.tpl === 'posco' ||", "const isDT = t.tpl === 'lselectric' || t.tpl === 'posco' ||");
  s = rep(s, "      : pending.tpl === 'posco' ? 'src/templates/posco-main.jpg' : null;",
    "      : pending.tpl === 'posco' ? 'src/templates/posco-main.jpg'\n      : pending.tpl === 'lselectric' ? 'src/templates/lselectric-statcom.jpg' : null;");
  s = rep(s, "                  : proj.tpl === 'posco' ? ['sop', 'ack', 'overview', 'route', 'floors', 'detail'][i]",
    "                  : proj.tpl === 'posco' ? ['sop', 'ack', 'overview', 'route', 'floors', 'detail'][i]\n" +
    "                  : proj.tpl === 'lselectric' ? ['datacenter'][i]");
  s = rep(s, "      : openProj.tpl === 'posco' ? (openProj.tplScene || 'main')",
    "      : openProj.tpl === 'posco' ? (openProj.tplScene || 'main')\n      : openProj.tpl === 'lselectric' ? (openProj.tplScene || 'statcom')");
  s = rep(s, "      if (openProj.tpl === 'posco') localStorage.setItem('wemb-posco-screen', openScene);",
    "      if (openProj.tpl === 'posco') localStorage.setItem('wemb-posco-screen', openScene);\n" +
    "      if (openProj.tpl === 'lselectric') localStorage.setItem('wemb-lselectric-screen', openScene);");
  return s;
});

/* ── 작업공간 — 새로 연 템플릿 프로젝트 ── */
edit('js/studio/project.js', "'lselectric'", (s) => rep(s,
  "        else if (f.tpl === 'hana') {",
  "        else if (f.tpl === 'lselectric') {\n" +
  "          localStorage.setItem('wemb-tpl-dt', 'lselectric'); localStorage.removeItem('wemb-tpl-img');\n" +
  "          /* 템플릿 상세에서 고른 장면(STATCOM · Data Center)을 그대로 연다 */\n" +
  "          const wantLs = (typeof LS_SCREENS !== 'undefined' && LS_SCREENS[f.scene]) ? f.scene\n" +
  "            : (localStorage.getItem('wemb-lselectric-screen') || 'statcom');\n" +
  "          try { localStorage.setItem('wemb-lselectric-screen', wantLs); } catch (e3) {}\n" +
  "          if (typeof applyLsElectricDT === 'function') applyLsElectricDT(wantLs);\n" +
  "        }\n" +
  "        else if (f.tpl === 'hana') {"));

/* ── 저장된 화면 열기 ── */
edit('js/core/projects.js', "'lselectric'", (s) => {
  s = rep(s, "    try { if (t.tpl === 'posco') localStorage.setItem('wemb-posco-screen', t.tplScene || 'main'); } catch (e) {}",
    "    try { if (t.tpl === 'posco') localStorage.setItem('wemb-posco-screen', t.tplScene || 'main'); } catch (e) {}\n" +
    "    try { if (t.tpl === 'lselectric') localStorage.setItem('wemb-lselectric-screen', t.tplScene || 'statcom'); } catch (e) {}");
  s = s.split("if (t.tpl === 'posco' || t.tpl === 'hanjin'").join("if (t.tpl === 'lselectric' || t.tpl === 'posco' || t.tpl === 'hanjin'");
  s = s.split("else if (t.tpl === 'posco' || t.tpl === 'hanjin'").join("else if (t.tpl === 'lselectric' || t.tpl === 'posco' || t.tpl === 'hanjin'");
  return s;
});

/* ── 새로고침 복원 · 밝기 복원 ── */
edit('js/main.js', "'lselectric'", (s) => {
  s = rep(s, "    if (__tdt === 'posco' && typeof applyPoscoDT === 'function') {",
    "    if (__tdt === 'lselectric' && typeof applyLsElectricDT === 'function') {\n" +
    "      /* 두 장 중 어느 화면인지는 열려 있는 프로젝트의 tplScene 이 정답 */\n" +
    "      applyLsElectricDT(window.__lsElectricSceneOf ? window.__lsElectricSceneOf() : localStorage.getItem('wemb-lselectric-screen'));\n" +
    "    }\n" +
    "    else if (__tdt === 'posco' && typeof applyPoscoDT === 'function') {");
  s = rep(s, "  if (state.screen === 'dt' && localStorage.getItem('wemb-tpl-dt') === 'hana') {",
    "  /* LS Electric STATCOM 도 Dark 가 원본 — 고른 밝기(wemb-lselectric-mode)는 그대로 되살아난다 */\n" +
    "  if (state.screen === 'dt' && localStorage.getItem('wemb-tpl-dt') === 'lselectric') {\n" +
    "    const want = localStorage.getItem('wemb-lselectric-mode') === 'light' ? 'light' : 'dark';\n" +
    "    if (state.mode !== want) {\n" +
    "      state.mode = want;\n" +
    "      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));\n" +
    "    }\n" +
    "  }\n" +
    "  if (state.screen === 'dt' && localStorage.getItem('wemb-tpl-dt') === 'hana') {");
  return s;
});

/* ── 색 정하기 · 화면 테마 ── */
edit('js/templates/image.js', 'LSELECTRIC_OPT', (s) => {
  s = rep(s, '  HANJIN_OPT: {',
    "  /* ── LS Electric STATCOM 시안 ──\n" +
    "     주조색은 브랜드 파랑(#2861FF, 색상각 224°). 색을 그대로 둘 것:\n" +
    "       · 상태·등급 색이 곧 의미인 것(상태 표지 marker · 등급 점 ellipse · 토글 손잡이 knob · 로고)\n" +
    "       · 바탕 사진과 3D 미니맵 렌더(사진이라 색상만 돌리면 어색하다 → 픽셀을 다시 칠한다) */\n" +
    "  LSELECTRIC_OPT: {\n" +
    "    seed: '#2861FF', seededKey: 'wemb-lselectric-seeded', refHue: 224,\n" +
    "    keep: /(marker[-\\d]*|ellipse[-\\d]*|knob[-\\d]*|logo-mark[-\\d]*|battery|plug)(-lt)?\\.svg(\\?|$)/i,\n" +
    "    raster: /(background|map-image)\\.(png|jpg)(\\?|$)/i,\n" +
    "  },\n" +
    '  HANJIN_OPT: {');
  s = rep(s, "    ['hjc', 'hjg', 'hju'].forEach((px) => {",
    "    /* LS Electric STATCOM 화면 2장 — 같은 방식. 두 장이 같은 밝기를 공유한다(wemb-lselectric-mode) */\n" +
    "    ['lsm', 'lsd'].forEach((px) => {\n" +
    "      this.icheonTint(t, mode, '.' + px + '-root',\n" +
    "        [px + '-style', px + '-light-style', 'lselectric-live-style'], 'wemb-lselectric-mode', this.LSELECTRIC_OPT);\n" +
    "    });\n" +
    "    ['hjc', 'hjg', 'hju'].forEach((px) => {");
  return s;
});

/* ── 패널편집(내용 수정) — 두 화면의 모든 글자 ── */
edit('js/studio/dt-edit.js', '.lsm-root p', (s) => rep(s, ".pks1-root p, ", ".pks1-root p, .lsm-root p, .lsd-root p, "));

console.log('done ·', changed, '파일');
