/* 스튜디오 연결 — 공장 전력설비 템플릿(tpl 'plant', 장면 overview)을 우리은행과 같은 자리에 등록한다(한 번만 돌린다. 이미 들어가 있으면 건너뛴다).
   카탈로그에 새 카드 'Digital Twin: Plant Power Facility' 를 넣는다 — 고객사 이름은 쓰지 않는다.
   실행: node src/plant/_gen/patch-studio.js */
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

/* ── 화면 모듈 표 ── */
edit('js/core/tpl-modules.js', 'plant-overview.js', (s) => rep(s,
  "    woori: [\n",
  '    /* 공장 전력설비 디지털 트윈 — Figma hHans6kNFlTP98CO1O431o. 화면 한 장 */\n' +
  '    plant: [\n' +
  "      { src: 'src/plant-overview.js?v=1', build: ['build_pfo'] },\n" +
  "      { src: 'src/plant-live.js?v=1', part: 'base' },\n" +
  '    ],\n' +
  '    woori: [\n'));

/* ── 바꾼 파일의 ?v= 를 문서 셋에서 먼저 올린다(표지: 카탈로그에 아직 안 들어갔을 때만) ── */
const already = fs.readFileSync(path.join(ROOT, 'js/launcher/templates.js'), 'utf8').includes("w.tpl = 'plant'");
if (!already) {
  edit('studio.html', 'js/templates/plant.js', (s) => {
    s = rep(s, '    <script src="js/templates/woori.js',
      '    <!-- 공장 전력설비 디지털 트윈 — Figma hHans6kNFlTP98CO1O431o 화면을 순수 HTML/CSS DOM 으로 재구축.\n' +
      '         화면 모듈은 js/core/tpl-modules.js 가 싣는다. 생성기: src/plant/_gen/. -->\n' +
      '    <script src="js/templates/plant.js?v=1"></script>\n' +
      '    <script src="js/templates/woori.js');
    ['js/core/tpl-modules.js', 'js/templates/image.js', 'js/studio/dt-edit.js', 'js/main.js', 'js/studio/project.js', 'js/core/projects.js', 'js/studio/atom-swap.js'].forEach((f) => { s = bump(s, f); });
    s = s.replace(/css\/preview\/digital-twin\.css\?v=(\d+)/, (m, n) => 'css/preview/digital-twin.css?v=' + (+n + 1));
    return s;
  });
  edit('index.html', '@@plant-never@@', (s) => {
    ['js/core/projects.js', 'js/launcher/templates.js', 'js/launcher/home.js'].forEach((f) => { s = bump(s, f); });
    return s;
  });
  edit('present.html', '@@plant-never@@', (s) => {
    s = bump(s, 'js/core/projects.js');
    return s;
  });
}

/* ── 템플릿 카탈로그 — 배열 맨 뒤에 넣는다(앞에 끼우면 다른 카드의 인기순 값이 밀린다) ── */
edit('js/launcher/templates.js', "w.tpl = 'plant'", (s) => {
  const m = /\n  \];\n(\s*)(?:\/\/[^\n]*\n\s*|\/\*[\s\S]*?\*\/\s*)*(?:const|var|let) TEMPLATES/.exec(s);
  if (!m) throw new Error('TPL_DEFS 끝을 못 찾음');
  s = s.slice(0, m.index) +
    "\n    { title: 'Digital Twin: Plant Power Facility', area: '발전·에너지', date: 'January 15, 2025', slides: [\n" +
    "      { img: 'src/templates/plant-overview.jpg', label: '설비현황' }] }," + s.slice(m.index);
  s = rep(s, '  /* 실제 화면이 붙어 있는 템플릿인지',
    "  /* 공장 전력설비 디지털 트윈 — '스튜디오 열기' 시 Figma(hHans6kNFlTP98CO1O431o) 화면을\n" +
    "     순수 HTML/CSS DOM 으로 재구축한 것(src/plant-overview.js)으로 연다. */\n" +
    "  (function () {\n" +
    "    const w = TEMPLATES.find((t) => t.title === 'Digital Twin: Plant Power Facility');\n" +
    "    if (w) w.tpl = 'plant';\n" +
    "  })();\n" +
    '  /* 실제 화면이 붙어 있는 템플릿인지');
  s = rep(s, "const tplIsLive = (t) => !!t && (t.tpl === 'woori' ||", "const tplIsLive = (t) => !!t && (t.tpl === 'plant' || t.tpl === 'woori' ||");
  return s;
});

/* ── 홈 — 템플릿으로 새 프로젝트 만들기 ── */
edit('js/launcher/home.js', "'plant'", (s) => {
  s = rep(s, "const isDT = t.tpl === 'woori' ||", "const isDT = t.tpl === 'plant' || t.tpl === 'woori' ||");
  s = rep(s, "      : pending.tpl === 'woori' ? 'src/templates/woori-transaction.jpg' : null;",
    "      : pending.tpl === 'woori' ? 'src/templates/woori-transaction.jpg'\n      : pending.tpl === 'plant' ? 'src/templates/plant-overview.jpg' : null;");
  return s;
});

/* ── 작업공간 — 새로 연 템플릿 프로젝트 ── */
edit('js/studio/project.js', "'plant'", (s) => rep(s,
  "        else if (f.tpl === 'woori') {",
  "        else if (f.tpl === 'plant') {\n" +
  "          localStorage.setItem('wemb-tpl-dt', 'plant'); localStorage.removeItem('wemb-tpl-img');\n" +
  "          if (typeof applyPlantDT === 'function') applyPlantDT();\n" +
  "        }\n" +
  "        else if (f.tpl === 'woori') {"));

/* ── 저장된 화면 열기 ── */
edit('js/core/projects.js', "'plant'", (s) => repAll(s, "if (t.tpl === 'woori' || t.tpl === 'shinhan'", "if (t.tpl === 'plant' || t.tpl === 'woori' || t.tpl === 'shinhan'"));

/* ── 새로고침 복원 · 밝기 복원 ── */
edit('js/main.js', "'plant'", (s) => {
  s = rep(s, "    if (__tdt === 'woori' && typeof applyWooriDT === 'function') {",
    "    if (__tdt === 'plant' && typeof applyPlantDT === 'function') {\n" +
    "      applyPlantDT();\n" +
    "    }\n" +
    "    else if (__tdt === 'woori' && typeof applyWooriDT === 'function') {");
  s = rep(s, "  /* 우리은행 통합 대시보드도 Dark 가 원본 — 고른 밝기(wemb-woori-mode)는 그대로 되살아난다 */",
    "  /* 공장 전력설비도 Dark 가 원본 — 고른 밝기(wemb-plant-mode)는 그대로 되살아난다 */\n" +
    "  if (state.screen === 'dt' && localStorage.getItem('wemb-tpl-dt') === 'plant') {\n" +
    "    const want = localStorage.getItem('wemb-plant-mode') === 'light' ? 'light' : 'dark';\n" +
    "    if (state.mode !== want) {\n" +
    "      state.mode = want;\n" +
    "      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));\n" +
    "    }\n" +
    "  }\n" +
    "  /* 우리은행 통합 대시보드도 Dark 가 원본 — 고른 밝기(wemb-woori-mode)는 그대로 되살아난다 */");
  return s;
});

/* ── 색 정하기 · 화면 테마 · 로고 ── */
edit('js/templates/image.js', 'PLANT_OPT', (s) => {
  s = rep(s, "    '.wrt-root [data-name=\"Brand\"], .wrp-root [data-name=\"Brand\"], .wre-root [data-name=\"Brand\"]',",
    "    '.wrt-root [data-name=\"Brand\"], .wrp-root [data-name=\"Brand\"], .wre-root [data-name=\"Brand\"], .pfo-root [data-name=\"Brand\"]',");
  s = rep(s, '  WOORI_OPT: {',
    "  /* ── 공장 전력설비 시안 ──\n" +
    "     주조색은 패널 테두리 · 빛의 하늘 파랑(#48B0E5, 색상각 200°). 색을 그대로 둘 것:\n" +
    "       · 로고 · 등급 표지(marker · marker-1~3) — 색이 곧 뜻\n" +
    "       · 3D 렌더(hero-image · map-image) — 숲 · 건물 사진이라 색을 돌리면 어색하다. 판 · 선 · 빛만 따라간다 */\n" +
    "  PLANT_OPT: {\n" +
    "    seed: '#48B0E5', seededKey: 'wemb-plant-seeded', refHue: 200,\n" +
    "    keep: /(^|\\/)(logo-mark|marker(-[123])?|hero-image|map-image)(-lt)?\\.(svg|png)(\\?|$)/i,\n" +
    "    raster: /$^/,\n" +
    "  },\n" +
    '  WOORI_OPT: {');
  s = rep(s, "    /* 우리은행 화면 3장 — 같은 방식.",
    "    /* 공장 전력설비 — 같은 방식 */\n" +
    "    this.icheonTint(t, mode, '.pfo-root', ['pfo-style', 'pfo-light-style', 'plant-live-style'], 'wemb-plant-mode', this.PLANT_OPT);\n" +
    "    /* 우리은행 화면 3장 — 같은 방식.");
  return s;
});

/* ── 업로드한 로고 자리 — Brand 묶음이 화면 크기 층이라 원래 로고 자리에 얹는다 ── */
edit('css/preview/digital-twin.css', '.pfo-root .tpl-studio-logo', (s) => rep(s,
  '/* 라이트 테마 — 헤더가 밝아지는 템플릿만 같은 로고의 짙은 판으로',
  '.pfo-root .tpl-studio-logo {\n' +
  '  position: absolute;\n' +
  '  left: 886px;\n' +
  '  top: 16px;\n' +
  '  width: 148px;\n' +
  '  height: 34px;\n' +
  '  object-fit: contain;\n' +
  '}\n' +
  '/* 라이트 테마 — 헤더가 밝아지는 템플릿만 같은 로고의 짙은 판으로'));

/* ── 패널편집(내용 수정) — 모든 글자 ── */
edit('js/studio/dt-edit.js', '.pfo-root p', (s) => rep(s, ".wrt-root p, ", ".pfo-root p, .wrt-root p, "));

/* ── '원자 변경' 창이 아는 화면 루트 접두어 ── */
edit('js/studio/atom-swap.js', "'pfo'", (s) => rep(s, "'wrt', 'wrp', 'wre',", "'pfo', 'wrt', 'wrp', 'wre',"));

console.log('done ·', changed, '파일');
