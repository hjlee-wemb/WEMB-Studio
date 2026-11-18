/* 스튜디오 연결 — 발전소 디지털트윈 방재 템플릿(tpl 'plantdp', 10장면)을 등록한다.
   이미 들어가 있으면 건너뛴다. 고객사 이름은 카드 · 화면에 쓰지 않는다. 실행: node src/plantdp/_gen/patch-studio.js
   (무선망 통합관리 patch-studio.js 를 바탕으로 — js/templates/plantdp.js 는 newbiz.js 에서 매번 다시 뜬다) */
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
const PD = [
  ['main', 'pdm', '종합 방재현황'], ['weather', 'pdw', '기상 상세 분석'], ['seismic', 'pds', '지진계측 상세 파형'],
  ['event', 'pde', '이벤트 현황'], ['sop-popup', 'pdp', 'SOP 진행 팝업'], ['building', 'pdb', '건물 캐러셀'],
  ['floor', 'pdf', '층 캐러셀'], ['sop', 'pdo', 'SOP 진행 현황'], ['sop-standby', 'pdy', 'SOP 대기'], ['login', 'pdl', '로그인'],
];
const PXS = PD.map((x) => x[1]);
const IMG = (x) => 'src/templates/plantdp-' + x[0] + '.jpg';
const TITLE = 'Digital Twin: Power Plant Disaster Prevention';

/* ── js/templates/plantdp.js — 신사업 관리 연결(newbiz.js)을 매번 떠서 만든다 ── */
{
  const dst = path.join(ROOT, 'js/templates/plantdp.js');
  let s = fs.readFileSync(path.join(ROOT, 'js/templates/newbiz.js'), 'utf8').replace(/\r\n/g, '\n');
  const a = s.indexOf('const NB_SCREENS = {'), b = s.indexOf('const NB_ROOTS');
  s = s.slice(0, a) + 'const PD_SCREENS = {\n'
    + PD.map((x) => "  '" + x[0] + "': { px: '" + x[1] + "', build: 'build_" + x[1] + "', css: '" + x[1].toUpperCase() + "_CSS', light: '" + x[1].toUpperCase() + "_LIGHT_CSS', title: '발전소 방재 — " + x[2] + "' },").join('\n')
    + '\n};\n' + s.slice(b);
  s = s.replace(/^\/\* ── 신사업 관리 대시보드 템플릿 연결 ── \*\/\n/, '/* ── 발전소 디지털트윈 방재 템플릿 연결 ── */\n');
  s = s.replace(/\/\* ── Dashboard: New Business Management[\s\S]*?window\.initNewbiz\)\. \*\//,
    '/* ── ' + TITLE + ' — Figma 화면 10장을 순수 HTML/CSS DOM 으로 재구축한 것을 얹는다 ──\n   원본: Figma QVCXpLxrGKG7Id7s9SSszf (REM 섹션) · 생성기 src/plantdp/_gen.\n   글자는 전부 편집 가능한 실제 텍스트(Pretendard CDN), 아이콘 · 그래픽만 Figma 가 내보낸 개별 svg/png(src/plantdp/).\n   원본이 라이트 시안이라 처음엔 라이트로 연다(다크는 생성기가 파생, _gen/dark.js · mk-dark-svgs.js).\n   인터랙션 · 라이브 · 반응형 · 차트 바꾸기 · 패널 옮기기는 src/plantdp-live.js(window.initPlantdp). */');
  s = s.replace(/const NB_ROOTS = [^\n]*/, "const PD_ROOTS = '" + PXS.map((p) => '.' + p + '-root').join(', ') + "';");
  s = s.replace(/\/\* 시안 자신의 주조색[^\n]*\nconst NB_SEED = '#7FD3FA';/, "/* 시안 자신의 주조색 — 파랑(#2A74F4). '색 정하기'의 시작값 */\nconst PD_SEED = '#2A74F4';");
  s = s.split('wemb-newbiz').join('wemb-plantdp').split('NB_').join('PD_').split('Newbiz').join('Plantdp').split("'newbiz'").join("'plantdp'").split('__newbizSceneOf').join('__plantdpSceneOf');
  s = s.split("|| 'wind'").join("|| 'main'").split("'wind'").join("'main'").split('PD_SCREENS.wind').join('PD_SCREENS.main');
  s = s.replace(/src\/newbiz-live\.js/g, 'src/plantdp-live.js').replace('헤더 메뉴 · 탭이', '상세보기 · 레일 · 이벤트 줄이');
  /* 라이트가 원본 — 고른 적 없으면 라이트로 */
  s = rep(s, "const mode = c.mode === 'light' ? 'light' : 'dark';", "const mode = c.mode === 'dark' ? 'dark' : 'light';");
  s = rep(s, "const want = localStorage.getItem('wemb-plantdp-mode') === 'light' ? 'light' : 'dark';", "const want = localStorage.getItem('wemb-plantdp-mode') === 'dark' ? 'dark' : 'light';");
  fs.writeFileSync(dst, s);
  if (/newbiz|nbw|initNewbiz/i.test(s)) console.log('  ! plantdp.js 에 newbiz 흔적', s.match(/.{20}(newbiz|nbw).{20}/i)[0]);
  console.log('  wrote js/templates/plantdp.js');
}

/* ── 화면 모듈 표 ── */
edit('js/core/tpl-modules.js', 'plantdp-main.js', (s) => {
  s = rep(s, '    /* 신사업 관리 대시보드 — Figma cES6X45zHjsaabaXL1cdrt. 화면 11장, 장면마다 따로 싣는다 */\n',
    '    /* 발전소 디지털트윈 방재 — Figma QVCXpLxrGKG7Id7s9SSszf. 화면 10장, 장면마다 따로 싣는다 */\n    plantdp: [\n'
    + PD.map((x) => "      { src: 'src/plantdp-" + x[0] + ".js?v=1', build: ['build_" + x[1] + "'], scene: '" + x[0] + "' },").join('\n')
    + "\n      { src: 'src/plantdp-live.js?v=1', part: 'base' },\n    ],\n"
    + '    /* 신사업 관리 대시보드 — Figma cES6X45zHjsaabaXL1cdrt. 화면 11장, 장면마다 따로 싣는다 */\n');
  s = rep(s, "    newbiz: { key: 'wemb-newbiz-screen', def: 'wind' },\n", "    newbiz: { key: 'wemb-newbiz-screen', def: 'wind' },\n    plantdp: { key: 'wemb-plantdp-screen', def: 'main' },\n");
  return s;
});

if (!fs.readFileSync(path.join(ROOT, 'studio.html'), 'utf8').includes('js/templates/plantdp.js')) {
  edit('studio.html', 'js/templates/plantdp.js', (s) => {
    s = rep(s, '    <!-- 신사업 관리 대시보드 — Figma cES6X45zHjsaabaXL1cdrt',
      '    <!-- 발전소 디지털트윈 방재 — Figma QVCXpLxrGKG7Id7s9SSszf 화면 10장을 순수 HTML/CSS DOM 으로 재구축.\n' +
      '         화면 모듈은 js/core/tpl-modules.js 가 싣는다. 생성기: src/plantdp/_gen/. -->\n' +
      '    <script src="js/templates/plantdp.js?v=1"></script>\n' +
      '    <!-- 신사업 관리 대시보드 — Figma cES6X45zHjsaabaXL1cdrt');
    ['js/core/tpl-modules.js', 'js/templates/image.js', 'js/studio/dt-edit.js', 'js/main.js', 'js/studio/project.js', 'js/core/projects.js', 'js/studio/atom-swap.js', 'js/core/meeting.js'].forEach((f) => { s = bump(s, f); });
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

/* ── 템플릿 카탈로그 — 새 카드 ── */
edit('js/launcher/templates.js', "w.tpl = 'plantdp'", (s) => {
  const m = /\n  \];\n(\s*)(?:\/\/[^\n]*\n\s*|\/\*[\s\S]*?\*\/\s*)*(?:const|var|let) TEMPLATES/.exec(s);
  if (!m) throw new Error('TPL_DEFS 끝을 못 찾음');
  s = s.slice(0, m.index) +
    "\n    { title: '" + TITLE + "', area: '에너지·환경', date: 'November 16, 2026', slides: [\n" +
    PD.map((x) => "      { img: '" + IMG(x) + "', label: '" + x[2] + "' }").join(',\n') + '] },' + s.slice(m.index);
  s = rep(s, "  /* 신사업 관리 대시보드 — '스튜디오 열기' 시",
    "  /* 발전소 디지털트윈 방재 — '스튜디오 열기' 시 Figma(QVCXpLxrGKG7Id7s9SSszf) 화면 10장을\n" +
    "     순수 HTML/CSS DOM 으로 재구축한 것(src/plantdp-*.js)으로 연다. */\n" +
    "  (function () {\n" +
    "    const w = TEMPLATES.find((t) => t.title === '" + TITLE + "');\n" +
    "    if (w) w.tpl = 'plantdp';\n" +
    "  })();\n" +
    "  /* 신사업 관리 대시보드 — '스튜디오 열기' 시");
  s = rep(s, "const tplIsLive = (t) => !!t && (t.tpl === 'indpark' ||", "const tplIsLive = (t) => !!t && (t.tpl === 'plantdp' || t.tpl === 'indpark' ||");
  return s;
});

/* ── 홈 ── */
edit('js/launcher/home.js', "t.tpl === 'plantdp'", (s) => {
  s = rep(s, "const isDT = t.tpl === 'indpark' ||", "const isDT = t.tpl === 'plantdp' || t.tpl === 'indpark' ||");
  s = rep(s, "      : pending.tpl === 'newbiz' ? 'src/templates/newbiz-wind.jpg'",
    "      : pending.tpl === 'plantdp' ? 'src/templates/plantdp-main.jpg'\n      : pending.tpl === 'newbiz' ? 'src/templates/newbiz-wind.jpg'");
  s = rep(s, "                  : proj.tpl === 'newbiz' ? [",
    "                  : proj.tpl === 'plantdp' ? [" + PD.slice(1).map((x) => "'" + x[0] + "'").join(', ') + "][i]\n                  : proj.tpl === 'newbiz' ? [");
  s = rep(s, "      : openProj.tpl === 'newbiz' ? (openProj.tplScene || 'wind')",
    "      : openProj.tpl === 'plantdp' ? (openProj.tplScene || 'main')\n      : openProj.tpl === 'newbiz' ? (openProj.tplScene || 'wind')");
  s = rep(s, "      if (openProj.tpl === 'newbiz') localStorage.setItem('wemb-newbiz-screen', openScene);",
    "      if (openProj.tpl === 'plantdp') localStorage.setItem('wemb-plantdp-screen', openScene);\n      if (openProj.tpl === 'newbiz') localStorage.setItem('wemb-newbiz-screen', openScene);");
  return s;
});

/* ── 작업공간 ── */
edit('js/studio/project.js', "f.tpl === 'plantdp'", (s) => rep(s,
  "        else if (f.tpl === 'newbiz') {",
  "        else if (f.tpl === 'plantdp') {\n" +
  "          localStorage.setItem('wemb-tpl-dt', 'plantdp'); localStorage.removeItem('wemb-tpl-img');\n" +
  "          const wantPd = (typeof PD_SCREENS !== 'undefined' && PD_SCREENS[f.scene]) ? f.scene : (localStorage.getItem('wemb-plantdp-screen') || 'main');\n" +
  "          try { localStorage.setItem('wemb-plantdp-screen', wantPd); } catch (e3) {}\n" +
  "          if (typeof applyPlantdpDT === 'function') applyPlantdpDT(wantPd);\n" +
  "        }\n" +
  "        else if (f.tpl === 'newbiz') {"));

/* ── 저장된 화면 열기 ── */
edit('js/core/projects.js', "t.tpl === 'plantdp'", (s) => {
  s = rep(s, "    try { if (t.tpl === 'newbiz') localStorage.setItem('wemb-newbiz-screen', t.tplScene || 'wind'); } catch (e) {}",
    "    try { if (t.tpl === 'plantdp') localStorage.setItem('wemb-plantdp-screen', t.tplScene || 'main'); } catch (e) {}\n" +
    "    try { if (t.tpl === 'newbiz') localStorage.setItem('wemb-newbiz-screen', t.tplScene || 'wind'); } catch (e) {}");
  return repAll(s, "if (t.tpl === 'indpark' || t.tpl === 'office'", "if (t.tpl === 'plantdp' || t.tpl === 'indpark' || t.tpl === 'office'");
});

/* ── 새로고침 복원 · 밝기 복원 ── */
edit('js/main.js', "'plantdp'", (s) => {
  s = rep(s, "    else if (__tdt === 'newbiz' && typeof applyNewbizDT === 'function') {",
    "    else if (__tdt === 'plantdp' && typeof applyPlantdpDT === 'function') {\n" +
    "      applyPlantdpDT(window.__plantdpSceneOf ? window.__plantdpSceneOf() : localStorage.getItem('wemb-plantdp-screen'));\n" +
    "    }\n" +
    "    else if (__tdt === 'newbiz' && typeof applyNewbizDT === 'function') {");
  s = rep(s, "  /* 신사업 관리도 Dark 가 원본 — 고른 밝기(wemb-newbiz-mode)는 그대로 되살아난다 */",
    "  /* 발전소 방재는 Light 가 원본 — 고른 밝기(wemb-plantdp-mode)는 그대로 되살아난다 */\n" +
    "  if (state.screen === 'dt' && localStorage.getItem('wemb-tpl-dt') === 'plantdp') {\n" +
    "    const want = localStorage.getItem('wemb-plantdp-mode') === 'dark' ? 'dark' : 'light';\n" +
    "    if (state.mode !== want) {\n" +
    "      state.mode = want;\n" +
    "      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));\n" +
    "    }\n" +
    "  }\n" +
    "  /* 신사업 관리도 Dark 가 원본 — 고른 밝기(wemb-newbiz-mode)는 그대로 되살아난다 */");
  return s;
});

/* ── 색 정하기 · 화면 테마 · 헤더 로고 ── */
edit('js/templates/image.js', 'PLANTDP_OPT', (s) => {
  s = rep(s, '  NEWBIZ_OPT: {',
    "  /* 발전소 디지털트윈 방재 — 주조색은 파랑(#2A74F4, 색상각 218°). 색을 그대로 둘 것: 3D 장면 · 건물 그림 · 로그인 사진 · 바탕 그림 · 화재 표지 · 등급 · 경보 색.\n" +
    "     판 · 선 · 글자 · 아이콘 · 차트는 따라간다 */\n" +
    "  PLANTDP_OPT: {\n" +
    "    seed: '#2A74F4', seededKey: 'wemb-plantdp-seeded', refHue: 218,\n" +
    "    keep: /(^|\\/)(stage-|screen-|background|fire-marker|vector-2|divider-1|ellipse|disability)[-\\w]*\\.(svg|png|jpg)(\\?|$)/i,\n" +
    "    raster: /$^/,\n" +
    "  },\n" +
    '  NEWBIZ_OPT: {');
  s = rep(s, "    /* 신사업 관리 화면 11장 — 같은 방식. 열린 장면만 칠한다 */",
    "    /* 발전소 방재 화면 10장 — 같은 방식. 열린 장면만 칠한다 */\n" +
    "    [" + PXS.map((p) => "'" + p + "'").join(', ') + "].forEach((px) => {\n" +
    "      if (document.querySelector('.' + px + '-root')) this.icheonTint(t, mode, '.' + px + '-root', [px + '-style', px + '-light-style', 'plantdp-live-style'], 'wemb-plantdp-mode', this.PLANTDP_OPT);\n" +
    "    });\n" +
    "    /* 신사업 관리 화면 11장 — 같은 방식. 열린 장면만 칠한다 */");
  /* 헤더가 이미 WEMB Studio — 업로드한 로고가 있을 때만 바꾼다(DOM_CUSTOM) */
  s = rep(s, "  DOM_CUSTOM: '", "  DOM_CUSTOM: '" + PXS.map((p) => '.' + p + '-root [data-name="Header"] :has(> [data-name="logo chip"])').join(', ') + ', .pdl-root [data-name="Brand"] > [data-name="Logo"]' + ", ");
  return s;
});

/* ── 패널편집(내용 수정) — 모든 글자 ── */
edit('js/studio/dt-edit.js', '.pdm-root p', (s) => rep(s, ".nbw-root p, ", PXS.map((p) => '.' + p + '-root p').join(', ') + ", .nbw-root p, "));

/* ── '원자 변경' 창 ── */
edit('js/studio/atom-swap.js', "'pdm'", (s) => rep(s, "'nbw', ", PXS.map((p) => "'" + p + "'").join(', ') + ", 'nbw', "));

/* ── 회의 모드 — 원본 고객사 이름(Figma 파일 이름 · 옛 데이터에 남을 수 있다) ── */
edit('js/core/meeting.js', "'서부발전'", (s) => rep(s, "'KOEN', ", "'한국서부발전', '서부발전', 'KOWEPO', 'kowepo', '구미 천연가스', 'KOEN', "));

console.log('done ·', changed, '파일');
