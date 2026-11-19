/* 스튜디오 연결 — 스마트팩토리 에너지관리 디지털트윈 템플릿(tpl 'fems', 5장면)을 등록한다.
   이미 들어가 있으면 건너뛴다. 고객사 이름은 카드 · 화면 · 파일에 쓰지 않는다. 실행: node src/fems/_gen/patch-studio.js
   훅은 가장 최근 템플릿(ccpp) 훅 바로 앞에 넣는다 — 최신 템플릿이 tplIsLive · isDT · projects 목록 맨 앞이다.
   js/templates/fems.js 는 js/templates/ccpp.js 에서 매번 다시 뜬다.

   이 시안의 특징 — 팝업 4장(계통도 · 이벤트 브라우저 · 태양광 PV · 장비 상세)은 종합 현황 위에 얹힌 화면이다.
   그래서 장면 뿌리는 언제나 종합 현황(.fmm-root)이고, 팝업은 그 안의 .sh-popmount > .fm?-root 로 들어간다.
   장면을 그릴 때 바탕 시트(FMM_*) + 팝업 시트(FMD_* …)를 함께 꽂는다(S.sheets).
   모듈은 팝업이 바탕 빌더(build_fmm)를 부르므로 장면별로 나누지 않고 다섯 장을 다 싣는다(합쳐 약 0.7MB). */
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
/* [장면, 팝업 접두어(없으면 바탕만), 이름, 모듈 파일] */
const FM = [['main', '', '종합 현황', 'main'], ['diagram', 'fmd', '계통도', 'diagram'], ['event', 'fme', '이벤트 브라우저', 'event'], ['solar', 'fms', '태양광 PV', 'solar'], ['equipment', 'fmq', '장비 상세', 'equipment']];
const PXS = ['fmm', 'fmd', 'fme', 'fms', 'fmq'];
const FRAG_PXS = ['fmx'];
const IMG = (x) => 'src/templates/fems-' + x[0] + '.jpg';
const TITLE = 'Digital Twin: Smart Factory Energy Management';
const SEED = '#009DFF';

/* ── js/templates/fems.js — ccpp.js 를 떠서 만든다 ── */
{
  const dst = path.join(ROOT, 'js/templates/fems.js');
  let s = fs.readFileSync(path.join(ROOT, 'js/templates/ccpp.js'), 'utf8').replace(/\r\n/g, '\n');
  const a = s.indexOf('const CC_SCREENS = {'), b = s.indexOf('const CC_ROOTS');
  const sheet = (px) => "['" + px.toUpperCase() + "_CSS', '" + px + "-style'], ['" + px.toUpperCase() + "_LIGHT_CSS', '" + px + "-light-style']";
  s = s.slice(0, a) + '/* px = 장면 뿌리(팝업도 종합 현황 뿌리 .fmm-root 안에 얹힌다) · sheets = 꽂을 시트 [전역 이름, 시트 id] */\nconst FM_SCREENS = {\n'
    + FM.map((x) => "  '" + x[0] + "': { px: 'fmm', build: '" + (x[1] ? 'build_fmm_' + x[0] : 'build_fmm') + "', sheets: [" + sheet('fmm') + (x[1] ? ', ' + sheet(x[1]) : '') + "], title: '스마트팩토리 에너지관리 — " + x[2] + "' },").join('\n')
    + '\n};\n' + s.slice(b);
  s = s.replace(/^\/\* ── 복합화력 설비정보 디지털트윈 템플릿 연결 ── \*\/\n/, '/* ── 스마트팩토리 에너지관리 디지털트윈 템플릿 연결 ── */\n');
  s = s.replace(/\/\* ── Digital Twin: Combined Cycle Power Plant[\s\S]*?window\.initCcpp\)\. \*\//,
    '/* ── ' + TITLE + ' — Figma 화면 5장(종합 현황 + 그 위 팝업 4장)을 순수 HTML/CSS DOM 으로 재구축한 것을 얹는다 ──\n   원본: Figma FwLj96v9IlQSHRPURiJouD (REM 섹션, 가상 데이터 반영본) · 생성기 src/fems/_gen.\n   글자는 전부 편집 가능한 실제 텍스트(Pretendard CDN), 아이콘 · 그래픽만 Figma 가 내보낸 개별 svg/png(src/fems/).\n   원본이 라이트 시안이라 처음엔 라이트로 연다(다크는 생성기가 파생, _gen/dark.js · mk-dark-svgs.js · mk-dark-png.ps1 · mk-dark-scene.ps1).\n   인터랙션 · 라이브 · 반응형 · 이벤트 로그 펼침 · 차트 바꾸기 · 패널 옮기기는 src/fems-live.js(window.initFems). */');
  s = s.replace(/const CC_ROOTS = [^\n]*/, "const FM_ROOTS = '" + PXS.concat(FRAG_PXS).map((p) => '.' + p + '-root').join(', ') + "';");
  s = s.replace(/\/\* 시안 자신의 주조색[^\n]*\nconst CC_SEED = '#0073FF';/, "/* 시안 자신의 주조색 — 하늘 파랑(" + SEED + "). '색 정하기'의 시작값 */\nconst FM_SEED = '" + SEED + "';");
  /* 시트 꽂기 — 바탕 + 팝업 두 벌 */
  s = rep(s, "  [[S.css, S.px + '-style'], [S.light, S.px + '-light-style']].forEach(function (a) {", '  S.sheets.forEach(function (a) {');
  s = s.split('wemb-ccpp').join('wemb-fems').split('CC_').join('FM_').split('Ccpp').join('Fems').split("'ccpp'").join("'fems'").split('__ccppSceneOf').join('__femsSceneOf');
  s = s.replace(/src\/ccpp-live\.js/g, 'src/fems-live.js').split('src/ccpp/').join('src/fems/');
  fs.writeFileSync(dst, s);
  if (/ccpp|initCcpp|CC_/i.test(s)) console.log('  ! fems.js 에 ccpp 흔적', (s.match(/.{20}(ccpp|CC_).{20}/i) || [''])[0]);
  console.log('  wrote js/templates/fems.js');
}

/* ── 화면 모듈 표 — 장면을 나누지 않는다(팝업 모듈이 바탕 빌더를 부른다) ── */
edit('js/core/tpl-modules.js', 'fems-main.js', (s) => rep(s, '    ccpp: [\n',
  '    /* 스마트팩토리 에너지관리 디지털트윈 — Figma FwLj96v9IlQSHRPURiJouD. 종합 현황 + 그 위에 얹는 팝업 4장(바탕 빌더를 같이 쓴다) */\n    fems: [\n'
  + FM.map((x) => "      { src: 'src/fems-" + x[3] + ".js?v=1', build: ['" + (x[1] ? 'build_' + x[1] + "', 'build_fmm_" + x[0] : 'build_fmm') + "'] },").join('\n')
  + "\n      { src: 'src/fems-frags.js?v=1', part: 'base', build: ['build_fmx'] },\n      { src: 'src/fems-live.js?v=1', part: 'base' },\n    ],\n    ccpp: [\n"));

edit('studio.html', 'js/templates/fems.js', (s) => {
  s = rep(s, '    <script src="js/templates/ccpp.js?v=',
    '    <!-- 스마트팩토리 에너지관리 디지털트윈 — Figma FwLj96v9IlQSHRPURiJouD 화면 5장을 순수 HTML/CSS DOM 으로 재구축.\n' +
    '         화면 모듈은 js/core/tpl-modules.js 가 싣는다. 생성기: src/fems/_gen/. -->\n' +
    '    <script src="js/templates/fems.js?v=1"></script>\n' +
    '    <script src="js/templates/ccpp.js?v=');
  ['js/core/tpl-modules.js', 'js/templates/image.js', 'js/studio/dt-edit.js', 'js/main.js', 'js/studio/project.js', 'js/core/projects.js', 'js/studio/atom-swap.js', 'js/core/meeting.js'].forEach((f) => { s = bump(s, f); });
  return s;
});
edit('index.html', '<!-- fems -->', (s) => {
  ['js/core/projects.js', 'js/core/meeting.js', 'js/launcher/templates.js', 'js/launcher/home.js'].forEach((f) => { s = bump(s, f); });
  return s.replace('</head>', '<!-- fems -->\n</head>');
});
edit('present.html', '<!-- fems -->', (s) => {
  ['js/core/projects.js', 'js/core/meeting.js'].forEach((f) => { s = bump(s, f); });
  return s.replace('</head>', '<!-- fems -->\n</head>');
});

/* ── 템플릿 카탈로그 — 새 카드 ── */
edit('js/launcher/templates.js', "w.tpl = 'fems'", (s) => {
  s = rep(s, "    { title: 'Digital Twin: Combined Cycle Power Plant', area:",
    "    { title: '" + TITLE + "', area: '에너지·환경', date: 'November 18, 2026', slides: [\n" +
    FM.map((x) => "      { img: '" + IMG(x) + "?v=1', label: '" + x[2] + "' }").join(',\n') + '] },\n' +
    "    { title: 'Digital Twin: Combined Cycle Power Plant', area:");
  s = rep(s, "  /* 복합화력 설비정보 디지털트윈 — '스튜디오 열기' 시",
    "  /* 스마트팩토리 에너지관리 디지털트윈 — '스튜디오 열기' 시 Figma(FwLj96v9IlQSHRPURiJouD) 화면 5장을\n" +
    "     순수 HTML/CSS DOM 으로 재구축한 것(src/fems-*.js)으로 연다. */\n" +
    "  (function () {\n" +
    "    const w = TEMPLATES.find((t) => t.title === '" + TITLE + "');\n" +
    "    if (w) w.tpl = 'fems';\n" +
    "  })();\n" +
    "  /* 복합화력 설비정보 디지털트윈 — '스튜디오 열기' 시");
  s = rep(s, "const tplIsLive = (t) => !!t && (t.tpl === 'ccpp' ||", "const tplIsLive = (t) => !!t && (t.tpl === 'fems' || t.tpl === 'ccpp' ||");
  return s;
});

/* ── 홈 ── */
edit('js/launcher/home.js', "t.tpl === 'fems'", (s) => {
  s = rep(s, "const isDT = t.tpl === 'ccpp' ||", "const isDT = t.tpl === 'fems' || t.tpl === 'ccpp' ||");
  s = rep(s, "      : pending.tpl === 'ccpp' ? 'src/templates/ccpp-main.jpg",
    "      : pending.tpl === 'fems' ? 'src/templates/fems-main.jpg?v=1'\n      : pending.tpl === 'ccpp' ? 'src/templates/ccpp-main.jpg");
  s = rep(s, "                  : proj.tpl === 'ccpp' ? [",
    "                  : proj.tpl === 'fems' ? [" + FM.slice(1).map((x) => "'" + x[0] + "'").join(', ') + "][i]\n                  : proj.tpl === 'ccpp' ? [");
  s = rep(s, "      : openProj.tpl === 'ccpp' ? (openProj.tplScene || 'main')",
    "      : openProj.tpl === 'fems' ? (openProj.tplScene || 'main')\n      : openProj.tpl === 'ccpp' ? (openProj.tplScene || 'main')");
  s = rep(s, "      if (openProj.tpl === 'ccpp') localStorage.setItem('wemb-ccpp-screen', openScene);",
    "      if (openProj.tpl === 'fems') localStorage.setItem('wemb-fems-screen', openScene);\n      if (openProj.tpl === 'ccpp') localStorage.setItem('wemb-ccpp-screen', openScene);");
  return s;
});

/* ── 작업공간 ── */
edit('js/studio/project.js', "f.tpl === 'fems'", (s) => rep(s,
  "        else if (f.tpl === 'ccpp') {",
  "        else if (f.tpl === 'fems') {\n" +
  "          localStorage.setItem('wemb-tpl-dt', 'fems'); localStorage.removeItem('wemb-tpl-img');\n" +
  "          const wantFm = (typeof FM_SCREENS !== 'undefined' && FM_SCREENS[f.scene]) ? f.scene : (localStorage.getItem('wemb-fems-screen') || 'main');\n" +
  "          try { localStorage.setItem('wemb-fems-screen', wantFm); } catch (e3) {}\n" +
  "          if (typeof applyFemsDT === 'function') applyFemsDT(wantFm);\n" +
  "        }\n" +
  "        else if (f.tpl === 'ccpp') {"));

/* ── 저장된 화면 열기 ── */
edit('js/core/projects.js', "t.tpl === 'fems'", (s) => {
  s = rep(s, "    try { if (t.tpl === 'ccpp') localStorage.setItem('wemb-ccpp-screen', t.tplScene || 'main'); } catch (e) {}",
    "    try { if (t.tpl === 'fems') localStorage.setItem('wemb-fems-screen', t.tplScene || 'main'); } catch (e) {}\n" +
    "    try { if (t.tpl === 'ccpp') localStorage.setItem('wemb-ccpp-screen', t.tplScene || 'main'); } catch (e) {}");
  return repAll(s, "if (t.tpl === 'ccpp' || t.tpl === 'plantdp'", "if (t.tpl === 'fems' || t.tpl === 'ccpp' || t.tpl === 'plantdp'");
});

/* ── 새로고침 복원 · 밝기 복원 ── */
edit('js/main.js', "'fems'", (s) => {
  s = rep(s, "    else if (__tdt === 'ccpp' && typeof applyCcppDT === 'function') {",
    "    else if (__tdt === 'fems' && typeof applyFemsDT === 'function') {\n" +
    "      applyFemsDT(window.__femsSceneOf ? window.__femsSceneOf() : localStorage.getItem('wemb-fems-screen'));\n" +
    "    }\n" +
    "    else if (__tdt === 'ccpp' && typeof applyCcppDT === 'function') {");
  s = rep(s, "  /* 복합화력 설비정보는 Light 가 원본 — 고른 밝기(wemb-ccpp-mode)는 그대로 되살아난다 */",
    "  /* 스마트팩토리 에너지관리는 Light 가 원본 — 고른 밝기(wemb-fems-mode)는 그대로 되살아난다 */\n" +
    "  if (state.screen === 'dt' && localStorage.getItem('wemb-tpl-dt') === 'fems') {\n" +
    "    const want = localStorage.getItem('wemb-fems-mode') === 'dark' ? 'dark' : 'light';\n" +
    "    if (state.mode !== want) {\n" +
    "      state.mode = want;\n" +
    "      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));\n" +
    "    }\n" +
    "  }\n" +
    "  /* 복합화력 설비정보는 Light 가 원본 — 고른 밝기(wemb-ccpp-mode)는 그대로 되살아난다 */");
  return s;
});

/* ── 색 정하기 · 화면 테마 ── */
edit('js/templates/image.js', 'FEMS_OPT', (s) => {
  s = rep(s, '  CCPP_OPT: {',
    "  /* 스마트팩토리 에너지관리 디지털트윈 — 주조색은 하늘 파랑(" + SEED + ", 색상각 203°). 색을 그대로 둘 것: 3D 설비 그림 · 장비 사진 · 미니맵 · 바탕 사진 · 로고(과 그 다크 사본).\n" +
    "     판 · 선 · 글자 · 아이콘 · 차트는 따라간다 */\n" +
    "  FEMS_OPT: {\n" +
    "    seed: '" + SEED + "', seededKey: 'wemb-fems-seeded', refHue: 203,\n" +
    "    keep: /(^|\\/)(3-dscene|equipment-image|map|base|logo)[-\\w]*\\.(svg|png|jpg)(\\?|$)/i,\n" +
    "    raster: /$^/,\n" +
    "  },\n" +
    '  CCPP_OPT: {');
  s = rep(s, "    /* 복합화력 설비정보 화면 5장 — 같은 방식. 열린 장면만 칠한다 */",
    "    /* 스마트팩토리 에너지관리 화면 5장(팝업은 종합 현황 뿌리 안) — 같은 방식. 열린 장면만 칠한다 */\n" +
    "    [" + PXS.map((p) => "'" + p + "'").join(', ') + "].forEach((px) => {\n" +
    "      if (document.querySelector('.' + px + '-root')) this.icheonTint(t, mode, '.' + px + '-root', [px + '-style', px + '-light-style', 'fems-live-style'], 'wemb-fems-mode', this.FEMS_OPT);\n" +
    "    });\n" +
    "    /* 펼친 이벤트 로그 조각(src/fems-frags.js) — 같은 색으로 */\n" +
    "    if (document.querySelector('.fmx-root')) this.icheonTint(t, mode, '.fmx-root', ['fmx-frag-style', 'fmx-frag-light-style'], 'wemb-fems-mode', this.FEMS_OPT);\n" +
    "    /* 복합화력 설비정보 화면 5장 — 같은 방식. 열린 장면만 칠한다 */");
  return s;
});

/* ── 패널편집(내용 수정) — 모든 글자(펼친 이벤트 로그 조각 포함) ── */
edit('js/studio/dt-edit.js', '.fmm-root p', (s) => rep(s, ".ccm-root p, ", PXS.concat(FRAG_PXS).map((p) => '.' + p + '-root p').join(', ') + ", .ccm-root p, "));

/* ── '원자 변경' 창 ── */
edit('js/studio/atom-swap.js', "'fmm'", (s) => rep(s, "'ccm', ", PXS.map((p) => "'" + p + "'").join(', ') + ", 'ccm', "));

/* ── 회의 모드 — 원본 고객사 이름(Figma 파일 이름 · 3D 그림에 남아 있다) ── */
edit('js/core/meeting.js', "'조흥'", (s) => rep(s, "'KOEN', ", "'KOEN', '조흥', 'Choheung', 'choheung', 'CHOHEUNG', "));

console.log('done ·', changed, '파일');
