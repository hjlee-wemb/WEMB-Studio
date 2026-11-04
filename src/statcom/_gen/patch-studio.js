/* 스튜디오 연결 — STATCOM HMI 템플릿(tpl 'statcom', 11장면)을 등록한다(한 번만 돌린다. 이미 들어가 있으면 건너뛴다).
   고객사 이름은 카드에 쓰지 않는다. js/templates/statcom.js 는 woori.js 에서 떠 만든다.
   실행: node src/statcom/_gen/patch-studio.js */
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
const SC = [
  ['main', 'tcm', '메인 화면', 'statcom-main'], ['statcom', 'tcs', 'STATCOM', 'statcom-statcom'], ['power', 'tcp', '전력설비', 'statcom-power'],
  ['valve', 'tcv', 'VSC 밸브실', 'statcom-valve'], ['cooling', 'tcc', 'VSC 냉각실', 'statcom-cooling'], ['supply', 'tce', '전원 설비', 'statcom-supply'],
  ['safety', 'tcn', '제어 안전', 'statcom-safety'], ['simulation', 'tcu', '시뮬레이션', 'statcom-simulation'], ['alarm', 'tca', '알람 메세지', 'statcom-alarm'],
  ['cards', 'tcq', '설비 요약 정보', 'statcom-cards'], ['login', 'tcl', '로그인', 'statcom-login'],
];
const PXS = SC.map((x) => x[1]);
const IMG = (x) => 'src/templates/' + x[3] + '.jpg';

/* ── js/templates/statcom.js ── */
{
  const dst = path.join(ROOT, 'js/templates/statcom.js');
  if (!fs.existsSync(dst)) {
    let s = fs.readFileSync(path.join(ROOT, 'js/templates/woori.js'), 'utf8').replace(/\r\n/g, '\n');
    const a = s.indexOf('const WR_SCREENS = {'), b = s.indexOf('const WR_ROOTS');
    s = s.slice(0, a) + 'const SC_SCREENS = {\n'
      + SC.map((x) => "  '" + x[0] + "': { px: '" + x[1] + "', build: 'build_" + x[1] + "', css: '" + x[1].toUpperCase() + "_CSS', light: '" + x[1].toUpperCase() + "_LIGHT_CSS', title: 'STATCOM HMI — " + x[2] + "' },").join('\n')
      + '\n};\n' + s.slice(b);
    s = s.replace(/^\/\* ── 우리은행[^\n]*\n/, '/* ── STATCOM HMI 디지털 트윈 템플릿 연결 ── */\n');
    s = s.replace(/\/\* ── Dashboard: Woori Bank[\s\S]*?window\.initWoori\)\. \*\//,
      '/* ── Digital Twin: STATCOM HMI — Figma 화면 11장을 순수 HTML/CSS DOM 으로 재구축한 것을 얹는다 ──\n   원본: Figma lyDJkcOlrznLKWo7mD7C2n (page "Dark-시안01") · 생성기 src/statcom/_gen.\n   글자는 전부 편집 가능한 실제 텍스트(Pretendard CDN), 아이콘 · 그래픽만 Figma 가 내보낸 개별 svg/png(src/statcom/).\n   인터랙션 · 라이브 · 반응형 · 차트 바꾸기 · 패널 옮기기는 src/statcom-live.js(window.initStatcom). */');
    s = s.replace(/const WR_ROOTS = [^\n]*/, "const SC_ROOTS = '" + PXS.map((p) => '.' + p + '-root').join(', ') + "';");
    s = s.replace(/\/\* 시안 자신의 주조색[^\n]*\nconst WR_SEED = '#09B6FB';/, "/* 시안 자신의 주조색 — 시안 파랑(#00B9F0). '색 정하기'의 시작값 */\nconst SC_SEED = '#00B9F0';");
    s = s.split('wemb-woori').join('wemb-statcom').split('WR_').join('SC_').split('Woori').join('Statcom').split("'woori'").join("'statcom'").split('__wooriSceneOf').join('__statcomSceneOf');
    s = s.split("|| 'transaction'").join("|| 'main'").split("'transaction'").join("'main'").split('SC_SCREENS.transaction').join('SC_SCREENS.main');
    s = s.replace(/헤더 메뉴\(거래현황 · 성능현황 · 이벤트현황\)/, '사이드 메뉴').replace('src/woori-live.js 의 installNav', 'src/statcom-live.js 의 installNav').replace('src/woori-live.js 의 installFit', 'src/statcom-live.js 의 installFit');
    fs.writeFileSync(dst, s);
    console.log('  wrote js/templates/statcom.js');
  }
}

/* ── 화면 모듈 표 ── */
edit('js/core/tpl-modules.js', 'statcom-main.js', (s) => {
  s = rep(s, "    /* 공장 전력설비 디지털 트윈 — Figma hHans6kNFlTP98CO1O431o. 화면 한 장 */\n",
    '    /* STATCOM HMI 디지털 트윈 — Figma lyDJkcOlrznLKWo7mD7C2n. 화면 11장, 장면마다 따로 싣는다 */\n    statcom: [\n'
    + SC.map((x) => "      { src: 'src/" + x[3] + ".js?v=1', build: ['build_" + x[1] + "'], scene: '" + x[0] + "' },").join('\n')
    + "\n      { src: 'src/statcom-live.js?v=1', part: 'base' },\n    ],\n"
    + "    /* 공장 전력설비 디지털 트윈 — Figma hHans6kNFlTP98CO1O431o. 화면 한 장 */\n");
  s = rep(s, "    hanjin: { key: 'wemb-hanjin-screen', def: 'main' },\n", "    hanjin: { key: 'wemb-hanjin-screen', def: 'main' },\n    statcom: { key: 'wemb-statcom-screen', def: 'main' },\n");
  return s;
});

const already = fs.readFileSync(path.join(ROOT, 'js/launcher/templates.js'), 'utf8').includes("w.tpl = 'statcom'");
if (!already) {
  edit('studio.html', 'js/templates/statcom.js', (s) => {
    s = rep(s, '    <script src="js/templates/plant.js?v=1"></script>',
      '    <script src="js/templates/plant.js?v=1"></script>\n' +
      '    <!-- STATCOM HMI 디지털 트윈 — Figma lyDJkcOlrznLKWo7mD7C2n 화면 11장을 순수 HTML/CSS DOM 으로 재구축.\n' +
      '         화면 모듈은 js/core/tpl-modules.js 가 싣는다. 생성기: src/statcom/_gen/. -->\n' +
      '    <script src="js/templates/statcom.js?v=1"></script>');
    ['js/core/tpl-modules.js', 'js/templates/image.js', 'js/studio/dt-edit.js', 'js/main.js', 'js/studio/project.js', 'js/core/projects.js', 'js/studio/atom-swap.js', 'js/core/meeting.js'].forEach((f) => { s = bump(s, f); });
    s = s.replace(/css\/preview\/digital-twin\.css\?v=(\d+)/, (m, n) => 'css/preview/digital-twin.css?v=' + (+n + 1));
    return s;
  });
  edit('index.html', '@@statcom-never@@', (s) => {
    ['js/core/projects.js', 'js/core/meeting.js', 'js/launcher/templates.js', 'js/launcher/home.js'].forEach((f) => { s = bump(s, f); });
    return s;
  });
  edit('present.html', '@@statcom-never@@', (s) => {
    ['js/core/projects.js', 'js/core/meeting.js'].forEach((f) => { s = bump(s, f); });
    return s;
  });
}

/* ── 템플릿 카탈로그 — 배열 맨 뒤에 ── */
edit('js/launcher/templates.js', "w.tpl = 'statcom'", (s) => {
  const m = /\n  \];\n(\s*)(?:\/\/[^\n]*\n\s*|\/\*[\s\S]*?\*\/\s*)*(?:const|var|let) TEMPLATES/.exec(s);
  if (!m) throw new Error('TPL_DEFS 끝을 못 찾음');
  s = s.slice(0, m.index) +
    "\n    { title: 'Digital Twin: STATCOM HMI', area: '발전·에너지', date: 'June 15, 2026', slides: [\n" +
    SC.map((x) => "      { img: '" + IMG(x) + "', label: '" + x[2] + "' }").join(',\n') + '] },' + s.slice(m.index);
  s = rep(s, '  /* 실제 화면이 붙어 있는 템플릿인지',
    "  /* STATCOM HMI 디지털 트윈 — '스튜디오 열기' 시 Figma(lyDJkcOlrznLKWo7mD7C2n) 화면 11장을\n" +
    "     순수 HTML/CSS DOM 으로 재구축한 것(src/statcom-*.js)으로 연다. */\n" +
    "  (function () {\n" +
    "    const w = TEMPLATES.find((t) => t.title === 'Digital Twin: STATCOM HMI');\n" +
    "    if (w) w.tpl = 'statcom';\n" +
    "  })();\n" +
    '  /* 실제 화면이 붙어 있는 템플릿인지');
  s = rep(s, "const tplIsLive = (t) => !!t && (t.tpl === 'plant' ||", "const tplIsLive = (t) => !!t && (t.tpl === 'statcom' || t.tpl === 'plant' ||");
  return s;
});

/* ── 홈 ── */
edit('js/launcher/home.js', "t.tpl === 'statcom'", (s) => {
  s = rep(s, "const isDT = t.tpl === 'plant' ||", "const isDT = t.tpl === 'statcom' || t.tpl === 'plant' ||");
  s = rep(s, "      : pending.tpl === 'plant' ? 'src/templates/plant-overview.jpg' : null;",
    "      : pending.tpl === 'plant' ? 'src/templates/plant-overview.jpg'\n      : pending.tpl === 'statcom' ? 'src/templates/statcom-main.jpg' : null;");
  s = rep(s, "                  : proj.tpl === 'woori' ? ['performance', 'event'][i]",
    "                  : proj.tpl === 'woori' ? ['performance', 'event'][i]\n" +
    "                  : proj.tpl === 'statcom' ? [" + SC.slice(1).map((x) => "'" + x[0] + "'").join(', ') + "][i]");
  s = rep(s, "      : openProj.tpl === 'woori' ? (openProj.tplScene || 'transaction')",
    "      : openProj.tpl === 'woori' ? (openProj.tplScene || 'transaction')\n      : openProj.tpl === 'statcom' ? (openProj.tplScene || 'main')");
  s = rep(s, "      if (openProj.tpl === 'woori') localStorage.setItem('wemb-woori-screen', openScene);",
    "      if (openProj.tpl === 'woori') localStorage.setItem('wemb-woori-screen', openScene);\n" +
    "      if (openProj.tpl === 'statcom') localStorage.setItem('wemb-statcom-screen', openScene);");
  return s;
});

/* ── 작업공간 ── */
edit('js/studio/project.js', "f.tpl === 'statcom'", (s) => rep(s,
  "        else if (f.tpl === 'plant') {",
  "        else if (f.tpl === 'statcom') {\n" +
  "          localStorage.setItem('wemb-tpl-dt', 'statcom'); localStorage.removeItem('wemb-tpl-img');\n" +
  "          const wantSc = (typeof SC_SCREENS !== 'undefined' && SC_SCREENS[f.scene]) ? f.scene : (localStorage.getItem('wemb-statcom-screen') || 'main');\n" +
  "          try { localStorage.setItem('wemb-statcom-screen', wantSc); } catch (e3) {}\n" +
  "          if (typeof applyStatcomDT === 'function') applyStatcomDT(wantSc);\n" +
  "        }\n" +
  "        else if (f.tpl === 'plant') {"));

/* ── 저장된 화면 열기 ── */
edit('js/core/projects.js', "t.tpl === 'statcom'", (s) => {
  s = rep(s, "    try { if (t.tpl === 'woori') localStorage.setItem('wemb-woori-screen', t.tplScene || 'transaction'); } catch (e) {}",
    "    try { if (t.tpl === 'woori') localStorage.setItem('wemb-woori-screen', t.tplScene || 'transaction'); } catch (e) {}\n" +
    "    try { if (t.tpl === 'statcom') localStorage.setItem('wemb-statcom-screen', t.tplScene || 'main'); } catch (e) {}");
  return repAll(s, "if (t.tpl === 'plant' || t.tpl === 'woori'", "if (t.tpl === 'statcom' || t.tpl === 'plant' || t.tpl === 'woori'");
});

/* ── 새로고침 복원 · 밝기 복원 ── */
edit('js/main.js', "'statcom'", (s) => {
  s = rep(s, "    if (__tdt === 'plant' && typeof applyPlantDT === 'function') {",
    "    if (__tdt === 'statcom' && typeof applyStatcomDT === 'function') {\n" +
    "      applyStatcomDT(window.__statcomSceneOf ? window.__statcomSceneOf() : localStorage.getItem('wemb-statcom-screen'));\n" +
    "    }\n" +
    "    else if (__tdt === 'plant' && typeof applyPlantDT === 'function') {");
  s = rep(s, "  /* 공장 전력설비도 Dark 가 원본 — 고른 밝기(wemb-plant-mode)는 그대로 되살아난다 */",
    "  /* STATCOM HMI 도 Dark 가 원본 — 고른 밝기(wemb-statcom-mode)는 그대로 되살아난다 */\n" +
    "  if (state.screen === 'dt' && localStorage.getItem('wemb-tpl-dt') === 'statcom') {\n" +
    "    const want = localStorage.getItem('wemb-statcom-mode') === 'light' ? 'light' : 'dark';\n" +
    "    if (state.mode !== want) {\n" +
    "      state.mode = want;\n" +
    "      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));\n" +
    "    }\n" +
    "  }\n" +
    "  /* 공장 전력설비도 Dark 가 원본 — 고른 밝기(wemb-plant-mode)는 그대로 되살아난다 */");
  return s;
});

/* ── 색 정하기 · 화면 테마 · 로고 ── */
edit('js/templates/image.js', 'STATCOM_OPT', (s) => {
  s = rep(s, "    '.ls-root [data-name=\"Brand\"], .skh-root [data-name=\"logo\"], .skv-root [data-name=\"logo\"]',",
    "    '.ls-root [data-name=\"Brand\"], .skh-root [data-name=\"logo\"], .skv-root [data-name=\"logo\"], ' +\n    '" + PXS.map((p) => '.' + p + '-root [data-name=\\"Logo Image\\"]').join(', ').replace(/\\"/g, '"') + "',");
  s = rep(s, '  WOORI_OPT: {',
    "  /* ── STATCOM HMI 시안 ──\n" +
    "     주조색은 시안 파랑(#00B9F0, 색상각 194°). 색을 그대로 둘 것:\n" +
    "       · 로고 · 3D 장면 · 설비 사진 · 미니맵 · 공정 사진 — 그림이라 색을 돌리면 어색하다. 판 · 선 · 글자만 따라간다 */\n" +
    "  STATCOM_OPT: {\n" +
    "    seed: '#00B9F0', seededKey: 'wemb-statcom-seeded', refHue: 194,\n" +
    "    keep: /(^|\\/)(logo-image|scene-image|map-image|equipment-image|thumbnail|hero-image)(-[\\d-]+)?(-lt)?\\.(svg|png)(\\?|$)/i,\n" +
    "    raster: /$^/,\n" +
    "  },\n" +
    '  WOORI_OPT: {');
  s = rep(s, "    /* 우리은행 화면 3장 — 같은 방식.",
    "    /* STATCOM HMI 화면 11장 — 같은 방식. 열린 장면만 칠한다 */\n" +
    "    [" + PXS.map((p) => "'" + p + "'").join(', ') + "].forEach((px) => {\n" +
    "      if (document.querySelector('.' + px + '-root')) this.icheonTint(t, mode, '.' + px + '-root', [px + '-style', px + '-light-style', 'statcom-live-style'], 'wemb-statcom-mode', this.STATCOM_OPT);\n" +
    "    });\n" +
    "    /* 우리은행 화면 3장 — 같은 방식.");
  return s;
});

/* ── 로고 자리 ── */
edit('css/preview/digital-twin.css', '.tcm-root [data-name="Logo Image"] .tpl-studio-logo', (s) => rep(s,
  '/* 라이트 테마 — 헤더가 밝아지는 템플릿만 같은 로고의 짙은 판으로',
  PXS.map((p) => '.' + p + '-root [data-name="Logo Image"] .tpl-studio-logo').join(',\n') + ' {\n  position: absolute;\n  left: 0;\n  top: 0;\n  width: 100%;\n  height: 100%;\n  object-fit: contain;\n  object-position: left center;\n}\n' +
  PXS.map((p) => '.' + p + '-root[data-theme="light"] .tpl-studio-logo').join(',\n') + ' {\n  content: url(../../src/studio-logo-lt.svg);\n}\n' +
  '/* 라이트 테마 — 헤더가 밝아지는 템플릿만 같은 로고의 짙은 판으로'));

/* ── 패널편집(내용 수정) — 모든 글자 ── */
edit('js/studio/dt-edit.js', '.tcm-root p', (s) => rep(s, ".pfo-root p, ", PXS.map((p) => '.' + p + '-root p').join(', ') + ", .pfo-root p, "));

/* ── '원자 변경' 창 ── */
edit('js/studio/atom-swap.js', "'tcm'", (s) => rep(s, "'pfo', ", PXS.map((p) => "'" + p + "'").join(', ') + ", 'pfo', "));

/* ── 회의 모드 — 가릴 이름 ── */
edit('js/core/meeting.js', "'HYOSUNG'", (s) => rep(s, "'Woori Bank',", "'HYOSUNG', 'Hyosung', '효성', 'Woori Bank',"));

console.log('done ·', changed, '파일');
