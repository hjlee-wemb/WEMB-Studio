/* 스튜디오 연결 — 무선망 통합관리 템플릿(tpl 'wnms', 8장면)을 등록하고 옛 'Dashboard: Hanbit'(그림 템플릿)을 지운다.
   이미 들어가 있으면 건너뛴다. 고객사 이름은 카드 · 화면에 쓰지 않는다. 실행: node src/wnms/_gen/patch-studio.js */
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
const WN = [
  ['main', 'wnm', '무선망 통합관리 메인'], ['main-open', 'wno', '메인 · 메뉴 열림'], ['main-expanded', 'wnx', '메인 · 메뉴 펼침'],
  ['room-top', 'wnt', '3D 통신실 · 평면'], ['room-view', 'wnv', '3D 통신실 · 투시'],
  ['equipment', 'wne', 'NMS 설비 계통도'], ['detail', 'wnd', 'NMS 세부 계통도'], ['login', 'wnl', '로그인'],
];
const PXS = WN.map((x) => x[1]);
const IMG = (x) => 'src/templates/wnms-' + x[0] + '.jpg';
const TITLE = 'Dashboard: Wireless Network Management';

/* ── js/templates/wnms.js — 신사업 관리 연결(newbiz.js)을 매번 떠서 만든다 ── */
{
  const dst = path.join(ROOT, 'js/templates/wnms.js');
  let s = fs.readFileSync(path.join(ROOT, 'js/templates/newbiz.js'), 'utf8').replace(/\r\n/g, '\n');
  const a = s.indexOf('const NB_SCREENS = {'), b = s.indexOf('const NB_ROOTS');
  s = s.slice(0, a) + 'const WN_SCREENS = {\n'
    + WN.map((x) => "  '" + x[0] + "': { px: '" + x[1] + "', build: 'build_" + x[1] + "', css: '" + x[1].toUpperCase() + "_CSS', light: '" + x[1].toUpperCase() + "_LIGHT_CSS', title: '무선망 통합관리 — " + x[2] + "' },").join('\n')
    + '\n};\n' + s.slice(b);
  s = s.replace(/^\/\* ── 신사업 관리 대시보드 템플릿 연결 ── \*\/\n/, '/* ── 무선망 통합관리 대시보드 템플릿 연결 ── */\n');
  s = s.replace(/\/\* ── Dashboard: New Business Management[\s\S]*?window\.initNewbiz\)\. \*\//,
    '/* ── ' + TITLE + ' — Figma 화면 8장을 순수 HTML/CSS DOM 으로 재구축한 것을 얹는다 ──\n   원본: Figma WdpL1qGqIo76WQavOsDvp6 (page "Light-시안01") · 생성기 src/wnms/_gen.\n   글자는 전부 편집 가능한 실제 텍스트(Pretendard CDN), 아이콘 · 그래픽만 Figma 가 내보낸 개별 svg/png(src/wnms/).\n   원본이 라이트 시안이라 처음엔 라이트로 연다(다크는 생성기가 파생, _gen/dark.js).\n   인터랙션 · 라이브 · 반응형 · 차트 바꾸기 · 패널 옮기기는 src/wnms-live.js(window.initWnms). */');
  s = s.replace(/const NB_ROOTS = [^\n]*/, "const WN_ROOTS = '" + PXS.map((p) => '.' + p + '-root').join(', ') + "';");
  s = s.replace(/\/\* 시안 자신의 주조색[^\n]*\nconst NB_SEED = '#7FD3FA';/, "/* 시안 자신의 주조색 — 남색(#0C4DA1). '색 정하기'의 시작값 */\nconst WN_SEED = '#0C4DA1';");
  s = s.split('wemb-newbiz').join('wemb-wnms').split('NB_').join('WN_').split('Newbiz').join('Wnms').split("'newbiz'").join("'wnms'").split('__newbizSceneOf').join('__wnmsSceneOf');
  s = s.split("|| 'wind'").join("|| 'main'").split("'wind'").join("'main'").split('WN_SCREENS.wind').join('WN_SCREENS.main');
  s = s.replace(/src\/newbiz-live\.js/g, 'src/wnms-live.js').replace('헤더 메뉴 · 탭이', 'GNB 메뉴 · 장비 타일이');
  /* 라이트가 원본 — 고른 적 없으면 라이트로 */
  s = rep(s, "const mode = c.mode === 'light' ? 'light' : 'dark';", "const mode = c.mode === 'dark' ? 'dark' : 'light';");
  s = rep(s, "const want = localStorage.getItem('wemb-wnms-mode') === 'light' ? 'light' : 'dark';", "const want = localStorage.getItem('wemb-wnms-mode') === 'dark' ? 'dark' : 'light';");
  fs.writeFileSync(dst, s);
  if (/newbiz|nbw|initNewbiz/i.test(s)) console.log('  ! wnms.js 에 newbiz 흔적', s.match(/.{20}(newbiz|nbw).{20}/i)[0]);
  console.log('  wrote js/templates/wnms.js');
}

/* ── 화면 모듈 표 ── */
edit('js/core/tpl-modules.js', 'wnms-main.js', (s) => {
  s = rep(s, '    /* 신사업 관리 대시보드 — Figma cES6X45zHjsaabaXL1cdrt. 화면 11장, 장면마다 따로 싣는다 */\n',
    '    /* 무선망 통합관리 대시보드 — Figma WdpL1qGqIo76WQavOsDvp6. 화면 8장, 장면마다 따로 싣는다 */\n    wnms: [\n'
    + WN.map((x) => "      { src: 'src/wnms-" + x[0] + ".js?v=1', build: ['build_" + x[1] + "'], scene: '" + x[0] + "' },").join('\n')
    + "\n      { src: 'src/wnms-live.js?v=1', part: 'base' },\n    ],\n"
    + '    /* 신사업 관리 대시보드 — Figma cES6X45zHjsaabaXL1cdrt. 화면 11장, 장면마다 따로 싣는다 */\n');
  s = rep(s, "    newbiz: { key: 'wemb-newbiz-screen', def: 'wind' },\n", "    newbiz: { key: 'wemb-newbiz-screen', def: 'wind' },\n    wnms: { key: 'wemb-wnms-screen', def: 'main' },\n");
  return s;
});

if (!fs.readFileSync(path.join(ROOT, 'studio.html'), 'utf8').includes('js/templates/wnms.js')) {
  edit('studio.html', 'js/templates/wnms.js', (s) => {
    s = rep(s, '    <!-- 신사업 관리 대시보드 — Figma cES6X45zHjsaabaXL1cdrt',
      '    <!-- 무선망 통합관리 대시보드 — Figma WdpL1qGqIo76WQavOsDvp6 화면 8장을 순수 HTML/CSS DOM 으로 재구축.\n' +
      '         화면 모듈은 js/core/tpl-modules.js 가 싣는다. 생성기: src/wnms/_gen/. -->\n' +
      '    <script src="js/templates/wnms.js?v=1"></script>\n' +
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

/* ── 템플릿 카탈로그 — 새 카드 + 옛 Hanbit(그림 템플릿) 삭제 ── */
edit('js/launcher/templates.js', "w.tpl = 'wnms'", (s) => {
  s = rep(s, "    { title: 'Dashboard: Hanbit', area: '에너지·환경', date: 'January 22, 2025', slides: [\n      TL('hanbit', '발전소 현황')] },\n", '');
  const m = /\n  \];\n(\s*)(?:\/\/[^\n]*\n\s*|\/\*[\s\S]*?\*\/\s*)*(?:const|var|let) TEMPLATES/.exec(s);
  if (!m) throw new Error('TPL_DEFS 끝을 못 찾음');
  s = s.slice(0, m.index) +
    "\n    { title: '" + TITLE + "', area: '에너지·환경', date: 'May 20, 2026', slides: [\n" +
    WN.map((x) => "      { img: '" + IMG(x) + "', label: '" + x[2] + "' }").join(',\n') + '] },' + s.slice(m.index);
  s = rep(s, "  /* 신사업 관리 대시보드 — '스튜디오 열기' 시",
    "  /* 무선망 통합관리 대시보드 — '스튜디오 열기' 시 Figma(WdpL1qGqIo76WQavOsDvp6) 화면 8장을\n" +
    "     순수 HTML/CSS DOM 으로 재구축한 것(src/wnms-*.js)으로 연다. */\n" +
    "  (function () {\n" +
    "    const w = TEMPLATES.find((t) => t.title === '" + TITLE + "');\n" +
    "    if (w) w.tpl = 'wnms';\n" +
    "  })();\n" +
    "  /* 신사업 관리 대시보드 — '스튜디오 열기' 시");
  s = rep(s, "const tplIsLive = (t) => !!t && (t.tpl === 'newbiz' ||", "const tplIsLive = (t) => !!t && (t.tpl === 'wnms' || t.tpl === 'newbiz' ||");
  return s;
});

/* ── 홈 ── */
edit('js/launcher/home.js', "t.tpl === 'wnms'", (s) => {
  s = rep(s, "const isDT = t.tpl === 'newbiz' ||", "const isDT = t.tpl === 'wnms' || t.tpl === 'newbiz' ||");
  s = rep(s, "      : pending.tpl === 'newbiz' ? 'src/templates/newbiz-wind.jpg' : null;",
    "      : pending.tpl === 'newbiz' ? 'src/templates/newbiz-wind.jpg'\n      : pending.tpl === 'wnms' ? 'src/templates/wnms-main.jpg' : null;");
  s = rep(s, "                  : proj.tpl === 'newbiz' ? [",
    "                  : proj.tpl === 'wnms' ? [" + WN.slice(1).map((x) => "'" + x[0] + "'").join(', ') + "][i]\n                  : proj.tpl === 'newbiz' ? [");
  s = rep(s, "      : openProj.tpl === 'newbiz' ? (openProj.tplScene || 'wind')",
    "      : openProj.tpl === 'wnms' ? (openProj.tplScene || 'main')\n      : openProj.tpl === 'newbiz' ? (openProj.tplScene || 'wind')");
  s = rep(s, "      if (openProj.tpl === 'newbiz') localStorage.setItem('wemb-newbiz-screen', openScene);",
    "      if (openProj.tpl === 'wnms') localStorage.setItem('wemb-wnms-screen', openScene);\n      if (openProj.tpl === 'newbiz') localStorage.setItem('wemb-newbiz-screen', openScene);");
  return s;
});

/* ── 작업공간 ── */
edit('js/studio/project.js', "f.tpl === 'wnms'", (s) => rep(s,
  "        else if (f.tpl === 'newbiz') {",
  "        else if (f.tpl === 'wnms') {\n" +
  "          localStorage.setItem('wemb-tpl-dt', 'wnms'); localStorage.removeItem('wemb-tpl-img');\n" +
  "          const wantWn = (typeof WN_SCREENS !== 'undefined' && WN_SCREENS[f.scene]) ? f.scene : (localStorage.getItem('wemb-wnms-screen') || 'main');\n" +
  "          try { localStorage.setItem('wemb-wnms-screen', wantWn); } catch (e3) {}\n" +
  "          if (typeof applyWnmsDT === 'function') applyWnmsDT(wantWn);\n" +
  "        }\n" +
  "        else if (f.tpl === 'newbiz') {"));

/* ── 저장된 화면 열기 ── */
edit('js/core/projects.js', "t.tpl === 'wnms'", (s) => {
  s = rep(s, "    try { if (t.tpl === 'newbiz') localStorage.setItem('wemb-newbiz-screen', t.tplScene || 'wind'); } catch (e) {}",
    "    try { if (t.tpl === 'wnms') localStorage.setItem('wemb-wnms-screen', t.tplScene || 'main'); } catch (e) {}\n" +
    "    try { if (t.tpl === 'newbiz') localStorage.setItem('wemb-newbiz-screen', t.tplScene || 'wind'); } catch (e) {}");
  return repAll(s, "if (t.tpl === 'newbiz' || t.tpl === 'statcom'", "if (t.tpl === 'wnms' || t.tpl === 'newbiz' || t.tpl === 'statcom'");
});

/* ── 새로고침 복원 · 밝기 복원 ── */
edit('js/main.js', "'wnms'", (s) => {
  s = rep(s, "    if (__tdt === 'newbiz' && typeof applyNewbizDT === 'function') {",
    "    if (__tdt === 'wnms' && typeof applyWnmsDT === 'function') {\n" +
    "      applyWnmsDT(window.__wnmsSceneOf ? window.__wnmsSceneOf() : localStorage.getItem('wemb-wnms-screen'));\n" +
    "    }\n" +
    "    else if (__tdt === 'newbiz' && typeof applyNewbizDT === 'function') {");
  s = rep(s, "  /* 신사업 관리도 Dark 가 원본 — 고른 밝기(wemb-newbiz-mode)는 그대로 되살아난다 */",
    "  /* 무선망 통합관리는 Light 가 원본 — 고른 밝기(wemb-wnms-mode)는 그대로 되살아난다 */\n" +
    "  if (state.screen === 'dt' && localStorage.getItem('wemb-tpl-dt') === 'wnms') {\n" +
    "    const want = localStorage.getItem('wemb-wnms-mode') === 'dark' ? 'dark' : 'light';\n" +
    "    if (state.mode !== want) {\n" +
    "      state.mode = want;\n" +
    "      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));\n" +
    "    }\n" +
    "  }\n" +
    "  /* 신사업 관리도 Dark 가 원본 — 고른 밝기(wemb-newbiz-mode)는 그대로 되살아난다 */");
  return s;
});

/* ── 색 정하기 · 화면 테마 · 옛 Hanbit 로고 자리 ── */
edit('js/templates/image.js', 'WNMS_OPT', (s) => {
  s = rep(s, "    put('hanbit', [858, 13, 190, 43]);\n", '');
  s = rep(s, '  NEWBIZ_OPT: {',
    "  /* 무선망 통합관리 시안 — 주조색은 남색(#0C4DA1, 색상각 214°). 색을 그대로 둘 것: 3D 조감도 · 통신실 렌더 · 바탕 그림 · 상태 표시(초록 · 빨강) · 장비 그림자.\n" +
    "     판 · 선 · 글자 · 메뉴 아이콘 · 차트는 따라간다 */\n" +
    "  WNMS_OPT: {\n" +
    "    seed: '#0C4DA1', seededKey: 'wemb-wnms-seeded', refHue: 214,\n" +
    "    keep: /(^|\\/)(scene-image|background|marker|icon-status|shadow|highlight|pedestal)[-\\w]*\\.(svg|png|jpg)(\\?|$)/i,\n" +
    "    raster: /$^/,\n" +
    "  },\n" +
    '  NEWBIZ_OPT: {');
  s = rep(s, "    /* 신사업 관리 화면 11장 — 같은 방식. 열린 장면만 칠한다 */",
    "    /* 무선망 통합관리 화면 8장 — 같은 방식. 열린 장면만 칠한다 */\n" +
    "    [" + PXS.map((p) => "'" + p + "'").join(', ') + "].forEach((px) => {\n" +
    "      if (document.querySelector('.' + px + '-root')) this.icheonTint(t, mode, '.' + px + '-root', [px + '-style', px + '-light-style', 'wnms-live-style'], 'wemb-wnms-mode', this.WNMS_OPT);\n" +
    "    });\n" +
    "    /* 신사업 관리 화면 11장 — 같은 방식. 열린 장면만 칠한다 */");
  return s;
});

/* ── 패널편집(내용 수정) — 모든 글자 ── */
edit('js/studio/dt-edit.js', '.wnm-root p', (s) => rep(s, ".nbw-root p, ", PXS.map((p) => '.' + p + '-root p').join(', ') + ", .nbw-root p, "));

/* ── '원자 변경' 창 ── */
edit('js/studio/atom-swap.js', "'wnm'", (s) => rep(s, "'nbw', ", PXS.map((p) => "'" + p + "'").join(', ') + ", 'nbw', "));

/* ── 회의 모드 — 원본 고객사 이름(Figma 파일 이름 · 옛 레이어명에 남아 있다) ── */
edit('js/core/meeting.js', "'신한울'", (s) => rep(s, "'KOEN', ", "'신한울', '한수원', '한국수력원자력', 'KHNP', 'Shinhanul', 'KOEN', "));

/* ── 옛 Hanbit 그림 파일 ── */
['src/templates/lib/hanbit.jpg', 'src/templates/lib/hanbit-hi.jpg'].forEach((f) => {
  const p = path.join(ROOT, f);
  if (fs.existsSync(p)) { fs.unlinkSync(p); console.log('  deleted', f); changed++; }
});

console.log('done ·', changed, '파일');
