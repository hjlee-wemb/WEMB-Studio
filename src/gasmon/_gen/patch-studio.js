/* 스튜디오 연결 — 스마트 플랜트 가스 모니터링 템플릿(tpl 'gasmon', 5장면)을 등록한다.
   이미 들어가 있으면 건너뛴다. 고객사 이름은 카드 · 화면에 쓰지 않는다. 실행: node src/gasmon/_gen/patch-studio.js
   js/templates/gasmon.js 는 손으로 쓴 파일이다(statcom.js 꼴 + 팝업 장면은 LS Electric 처럼 시트 두 벌). */
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
const GM = [['main', 'gmm', '메인', 'gasmon-main'], ['gas', 'gmg', '가스 메인', 'gasmon-gas'], ['worksite', 'gmw', '작업개소 상세', 'gasmon-worksite'], ['alarm', 'gma', '가스농도 이상', 'gasmon-alarm'], ['confirm', 'gmc', '전송 확인', 'gasmon-confirm']];
const PXS = GM.map((x) => x[1]);
const IMG = (x) => 'src/templates/' + x[3] + '.jpg';
const TITLE = 'Dashboard: Smart Plant Gas Monitoring';
const KEY = 'CbbEsxxZo3vBcBprsiUhJm';

/* ── 화면 모듈 표 — 팝업 장면이 가스 메인 모듈도 함께 쓰므로 장면별로 나누지 않고 통째로 싣는다(LS Electric 과 같다) ── */
edit('js/core/tpl-modules.js', 'gasmon-main.js', (s) => rep(s, '    drawing: [\n',
  '    /* 스마트 플랜트 가스 모니터링 — Figma ' + KEY + '. 화면 2장 + 팝업 3장. 팝업은 가스 메인 위에 그 자리에서 얹으므로 통째로 */\n    gasmon: [\n'
  + GM.map((x) => "      { src: 'src/" + x[3] + ".js?v=1', build: ['build_" + x[1] + "'" + (x[1] === 'gmm' || x[1] === 'gmg' ? '' : ", 'build_" + x[1] + "_scene'") + '] },').join('\n')
  + "\n      { src: 'src/gasmon-live.js?v=1', part: 'base' },\n    ],\n    drawing: [\n"));

if (!fs.readFileSync(path.join(ROOT, 'studio.html'), 'utf8').includes('js/templates/gasmon.js')) {
  edit('studio.html', 'js/templates/gasmon.js', (s) => {
    s = rep(s, '    <script src="js/templates/drawing.js?v=',
      '    <!-- 스마트 플랜트 가스 모니터링 — Figma ' + KEY + ' 화면 2장 + 팝업 3장을 순수 HTML/CSS DOM 으로 재구축.\n' +
      '         화면 모듈은 js/core/tpl-modules.js 가 싣는다. 생성기: src/gasmon/_gen/. -->\n' +
      '    <script src="js/templates/gasmon.js?v=1"></script>\n' +
      '    <script src="js/templates/drawing.js?v=');
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
edit('js/launcher/templates.js', "w.tpl = 'gasmon'", (s) => {
  const m = /\n  \];\n(\s*)(?:\/\/[^\n]*\n\s*|\/\*[\s\S]*?\*\/\s*)*(?:const|var|let) TEMPLATES/.exec(s);
  if (!m) throw new Error('TPL_DEFS 끝을 못 찾음');
  s = s.slice(0, m.index) +
    "\n    { title: '" + TITLE + "', area: '제조·안전', date: 'Nov 11, 2026', slides: [\n" +
    GM.map((x) => "      { img: '" + IMG(x) + "', label: '" + x[2] + "' }").join(',\n') + '] },' + s.slice(m.index);
  s = rep(s, "  /* 스마트 도면관리 — '스튜디오 열기' 시",
    "  /* 스마트 플랜트 가스 모니터링 — '스튜디오 열기' 시 Figma(" + KEY + ") 화면 2장 + 팝업 3장을\n" +
    "     순수 HTML/CSS DOM 으로 재구축한 것(src/gasmon-*.js)으로 연다. */\n" +
    "  (function () {\n" +
    "    const w = TEMPLATES.find((t) => t.title === '" + TITLE + "');\n" +
    "    if (w) w.tpl = 'gasmon';\n" +
    "  })();\n" +
    "  /* 스마트 도면관리 — '스튜디오 열기' 시");
  s = rep(s, "t.tpl === 'drawing' || t.tpl === 'wnms' ||", "t.tpl === 'gasmon' || t.tpl === 'drawing' || t.tpl === 'wnms' ||");
  return s;
});

/* ── 홈 ── */
edit('js/launcher/home.js', "t.tpl === 'gasmon'", (s) => {
  s = rep(s, "t.tpl === 'drawing' || t.tpl === 'wnms' ||", "t.tpl === 'gasmon' || t.tpl === 'drawing' || t.tpl === 'wnms' ||");
  s = rep(s, "      : pending.tpl === 'drawing' ? 'src/templates/drawing-main.jpg'",
    "      : pending.tpl === 'gasmon' ? 'src/templates/gasmon-main.jpg'\n      : pending.tpl === 'drawing' ? 'src/templates/drawing-main.jpg'");
  s = rep(s, "                  : proj.tpl === 'drawing' ? [",
    "                  : proj.tpl === 'gasmon' ? [" + GM.slice(1).map((x) => "'" + x[0] + "'").join(', ') + "][i]\n                  : proj.tpl === 'drawing' ? [");
  s = rep(s, "      : openProj.tpl === 'drawing' ? (openProj.tplScene || 'main')",
    "      : openProj.tpl === 'gasmon' ? (openProj.tplScene || 'main')\n      : openProj.tpl === 'drawing' ? (openProj.tplScene || 'main')");
  s = rep(s, "      if (openProj.tpl === 'drawing') localStorage.setItem('wemb-drawing-screen', openScene);",
    "      if (openProj.tpl === 'gasmon') localStorage.setItem('wemb-gasmon-screen', openScene);\n      if (openProj.tpl === 'drawing') localStorage.setItem('wemb-drawing-screen', openScene);");
  return s;
});

/* ── 작업공간 ── */
edit('js/studio/project.js', "f.tpl === 'gasmon'", (s) => rep(s,
  "        else if (f.tpl === 'drawing') {",
  "        else if (f.tpl === 'gasmon') {\n" +
  "          localStorage.setItem('wemb-tpl-dt', 'gasmon'); localStorage.removeItem('wemb-tpl-img');\n" +
  "          const wantGm = (typeof GM_SCREENS !== 'undefined' && GM_SCREENS[f.scene]) ? f.scene : (localStorage.getItem('wemb-gasmon-screen') || 'main');\n" +
  "          try { localStorage.setItem('wemb-gasmon-screen', wantGm); } catch (e3) {}\n" +
  "          if (typeof applyGasmonDT === 'function') applyGasmonDT(wantGm);\n" +
  "        }\n" +
  "        else if (f.tpl === 'drawing') {"));

/* ── 저장된 화면 열기 ── */
edit('js/core/projects.js', "t.tpl === 'gasmon'", (s) => {
  s = rep(s, "    try { if (t.tpl === 'drawing') localStorage.setItem('wemb-drawing-screen', t.tplScene || 'main'); } catch (e) {}",
    "    try { if (t.tpl === 'gasmon') localStorage.setItem('wemb-gasmon-screen', t.tplScene || 'main'); } catch (e) {}\n" +
    "    try { if (t.tpl === 'drawing') localStorage.setItem('wemb-drawing-screen', t.tplScene || 'main'); } catch (e) {}");
  return repAll(s, "t.tpl === 'drawing' || t.tpl === 'wnms' || t.tpl === 'newbiz'", "t.tpl === 'gasmon' || t.tpl === 'drawing' || t.tpl === 'wnms' || t.tpl === 'newbiz'");
});

/* ── 새로고침 복원 · 밝기 복원 ── */
edit('js/main.js', "'gasmon'", (s) => {
  s = rep(s, "    else if (__tdt === 'drawing' && typeof applyDrawingDT === 'function') {",
    "    else if (__tdt === 'gasmon' && typeof applyGasmonDT === 'function') {\n" +
    "      applyGasmonDT(window.__gasmonSceneOf ? window.__gasmonSceneOf() : localStorage.getItem('wemb-gasmon-screen'));\n" +
    "    }\n" +
    "    else if (__tdt === 'drawing' && typeof applyDrawingDT === 'function') {");
  s = rep(s, "  /* 스마트 도면관리도 Light 가 원본 — 고른 밝기(wemb-drawing-mode)는 그대로 되살아난다 */",
    "  /* 스마트 플랜트 가스 모니터링은 Dark 가 원본 — 고른 밝기(wemb-gasmon-mode)는 그대로 되살아난다 */\n" +
    "  if (state.screen === 'dt' && localStorage.getItem('wemb-tpl-dt') === 'gasmon') {\n" +
    "    const want = localStorage.getItem('wemb-gasmon-mode') === 'light' ? 'light' : 'dark';\n" +
    "    if (state.mode !== want) {\n" +
    "      state.mode = want;\n" +
    "      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));\n" +
    "    }\n" +
    "  }\n" +
    "  /* 스마트 도면관리도 Light 가 원본 — 고른 밝기(wemb-drawing-mode)는 그대로 되살아난다 */");
  return s;
});

/* ── 색 정하기 · 화면 테마 · 로고 ── */
edit('js/templates/image.js', 'GASMON_OPT', (s) => {
  s = rep(s, '  DRAWING_OPT: {',
    "  /* 스마트 플랜트 가스 모니터링 시안 — 주조색은 시안(#00BBFF, 색상각 196°). 색을 그대로 둘 것:\n" +
    "     바탕 사진 · 공장 평면도 · 메뉴 카드 받침/유리 구 · 메뉴 아이콘 · 상태 배지/전구 · 센서 표지(색이 곧 뜻). 판 · 선 · 글자 · 미터는 따라간다 */\n" +
    "  GASMON_OPT: {\n" +
    "    seed: '#00BBFF', seededKey: 'wemb-gasmon-seeded', refHue: 196,\n" +
    "    keep: /(^|\\/)(screen-main[-\\w]*\\.jpg|floor-plan[-\\w]*\\.png|platform[-\\w]*|orb[-\\w]*|body[-\\w]*|cloud[-\\w]*|figure[-\\w]*|lens[-\\w]*|highlight[-\\w]*|light[-\\w]*|shadow[-\\w]*|status-[-\\w]*|btn-event-status[-\\w]*|marker-sensor[-\\w]*|background-1(-lt)?\\.svg|background-2-2(-lt)?\\.svg)(\\.(svg|png|jpg))?(\\?|$)/i,\n" +
    "    raster: /$^/,\n" +
    "  },\n" +
    '  DRAWING_OPT: {');
  s = rep(s, "    /* 스마트 도면관리 화면 19장 — 같은 방식. 열린 장면만 칠한다 */",
    "    /* 스마트 플랜트 가스 모니터링 화면 5장 — 같은 방식. 열린 장면만 칠한다(팝업 뿌리도 따로 칠한다) */\n" +
    "    [" + PXS.map((p) => "'" + p + "'").join(', ') + "].forEach((px) => {\n" +
    "      if (document.querySelector('.' + px + '-root')) this.icheonTint(t, mode, '.' + px + '-root', [px + '-style', px + '-light-style', 'gasmon-live-style'], 'wemb-gasmon-mode', this.GASMON_OPT);\n" +
    "    });\n" +
    "    /* 스마트 도면관리 화면 19장 — 같은 방식. 열린 장면만 칠한다 */");
  s = rep(s, "  DOM_CUSTOM: '", "  DOM_CUSTOM: '.gmm-root [data-name=\"Header\"] > [data-name=\"Logo\"], .gmg-root [data-name=\"Header\"] > [data-name=\"Logo\"], ' +\n    '");
  return s;
});

/* ── 패널편집(내용 수정) — 모든 글자 ── */
edit('js/studio/dt-edit.js', '.gmm-root p', (s) => rep(s, ".dwm-root p, ", PXS.map((p) => '.' + p + '-root p').join(', ') + ", .dwm-root p, "));

/* ── '원자 변경' 창 ── */
edit('js/studio/atom-swap.js', "'gmm'", (s) => rep(s, "'dwm', ", PXS.map((p) => "'" + p + "'").join(', ') + ", 'dwm', "));

console.log('done ·', changed, '파일');
