/* 스튜디오 연결 — 스마트 산단 디지털 트윈 템플릿(tpl 'indpark', 9장면)을 등록한다.
   이미 들어가 있으면 건너뛴다. 고객사 이름은 카드 · 화면에 쓰지 않는다. 실행: node src/indpark/_gen/patch-studio.js
   js/templates/indpark.js 는 손으로 쓴 파일이다(gasmon.js 꼴, 9장 모두 단독 화면이라 시트는 장면마다 한 벌).
   앵커는 바로 앞에 들어간 '스마트 플랜트 가스 모니터링(gasmon)' 자리 — 그 앞에 끼운다. */
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
const IP = [
  ['main', 'ipm', '종합 운영현황', 'indpark-main'],
  ['menu', 'ipn', '전체 메뉴', 'indpark-menu'],
  ['site', 'ips', '사업장 3D', 'indpark-site'],
  ['forklift', 'ipf', '지게차 충돌감시', 'indpark-forklift'],
  ['vibration', 'ipv', '진동센서 정보', 'indpark-vibration'],
  ['heat', 'iph', '온도센서 정보', 'indpark-heat'],
  ['event', 'ipe', '이벤트 현황', 'indpark-event'],
  ['history', 'ipy', '이벤트 히스토리', 'indpark-history'],
  ['sensor', 'ipt', '센서현황', 'indpark-sensor'],
];
const PXS = IP.map((x) => x[1]);
const IMG = (x) => 'src/templates/' + x[3] + '.jpg';
const TITLE = 'Digital Twin: Smart Industrial Complex';
const KEY = 'xzZQdVDkaDM1hve8Vc88GC';
const TPL_OR = "t.tpl === 'indpark' || ";

/* ── 화면 모듈 표 — 장면마다 모듈 하나(열린 장면 것만 싣는다) ── */
edit('js/core/tpl-modules.js', 'indpark-main.js', (s) => rep(s, '    /* 스마트 플랜트 가스 모니터링 — Figma',
  '    /* 스마트 산단 디지털 트윈 — Figma ' + KEY + '. 단독 화면 9장 — 열린 장면 모듈만 싣는다 */\n    indpark: [\n'
  + IP.map((x) => "      { src: 'src/" + x[3] + ".js?v=1', build: ['build_" + x[1] + "'], scene: '" + x[0] + "' },").join('\n')
  + "\n      { src: 'src/indpark-live.js?v=1', part: 'base' },\n    ],\n    /* 스마트 플랜트 가스 모니터링 — Figma"));

if (!fs.readFileSync(path.join(ROOT, 'studio.html'), 'utf8').includes('js/templates/indpark.js')) {
  edit('studio.html', 'js/templates/indpark.js', (s) => {
    s = rep(s, '    <!-- 스마트 플랜트 가스 모니터링 — Figma',
      '    <!-- 스마트 산단 디지털 트윈 — Figma ' + KEY + ' 화면 9장을 순수 HTML/CSS DOM 으로 재구축.\n' +
      '         화면 모듈은 js/core/tpl-modules.js 가 싣는다. 생성기: src/indpark/_gen/. -->\n' +
      '    <script src="js/templates/indpark.js?v=1"></script>\n' +
      '    <!-- 스마트 플랜트 가스 모니터링 — Figma');
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
edit('js/launcher/templates.js', "w.tpl = 'indpark'", (s) => {
  const m = /\n  \];\n(\s*)(?:\/\/[^\n]*\n\s*|\/\*[\s\S]*?\*\/\s*)*(?:const|var|let) TEMPLATES/.exec(s);
  if (!m) throw new Error('TPL_DEFS 끝을 못 찾음');
  s = s.slice(0, m.index) +
    "\n    { title: '" + TITLE + "', area: '안전·보안', date: 'Nov 13, 2026', slides: [\n" +
    IP.map((x) => "      { img: '" + IMG(x) + "', label: '" + x[2] + "' }").join(',\n') + '] },' + s.slice(m.index);
  s = rep(s, "  /* 스마트 플랜트 가스 모니터링 — '스튜디오 열기' 시",
    "  /* 스마트 산단 디지털 트윈 — '스튜디오 열기' 시 Figma(" + KEY + ") 화면 9장을\n" +
    "     순수 HTML/CSS DOM 으로 재구축한 것(src/indpark-*.js)으로 연다. */\n" +
    "  (function () {\n" +
    "    const w = TEMPLATES.find((t) => t.title === '" + TITLE + "');\n" +
    "    if (w) w.tpl = 'indpark';\n" +
    "  })();\n" +
    "  /* 스마트 플랜트 가스 모니터링 — '스튜디오 열기' 시");
  s = repAll(s, "t.tpl === 'office' || t.tpl === 'gasmon' ||", TPL_OR + "t.tpl === 'office' || t.tpl === 'gasmon' ||");
  return s;
});

/* ── 홈 ── */
edit('js/launcher/home.js', "t.tpl === 'indpark'", (s) => {
  s = repAll(s, "t.tpl === 'office' || t.tpl === 'gasmon' ||", TPL_OR + "t.tpl === 'office' || t.tpl === 'gasmon' ||");
  s = rep(s, "      : pending.tpl === 'gasmon' ? 'src/templates/gasmon-main.jpg'",
    "      : pending.tpl === 'indpark' ? 'src/templates/indpark-main.jpg'\n      : pending.tpl === 'gasmon' ? 'src/templates/gasmon-main.jpg'");
  s = rep(s, "                  : proj.tpl === 'gasmon' ? [",
    "                  : proj.tpl === 'indpark' ? [" + IP.slice(1).map((x) => "'" + x[0] + "'").join(', ') + "][i]\n                  : proj.tpl === 'gasmon' ? [");
  s = rep(s, "      : openProj.tpl === 'gasmon' ? (openProj.tplScene || 'main')",
    "      : openProj.tpl === 'indpark' ? (openProj.tplScene || 'main')\n      : openProj.tpl === 'gasmon' ? (openProj.tplScene || 'main')");
  s = rep(s, "      if (openProj.tpl === 'gasmon') localStorage.setItem('wemb-gasmon-screen', openScene);",
    "      if (openProj.tpl === 'indpark') localStorage.setItem('wemb-indpark-screen', openScene);\n      if (openProj.tpl === 'gasmon') localStorage.setItem('wemb-gasmon-screen', openScene);");
  return s;
});

/* ── 작업공간 ── */
edit('js/studio/project.js', "f.tpl === 'indpark'", (s) => rep(s,
  "        else if (f.tpl === 'gasmon') {",
  "        else if (f.tpl === 'indpark') {\n" +
  "          localStorage.setItem('wemb-tpl-dt', 'indpark'); localStorage.removeItem('wemb-tpl-img');\n" +
  "          const wantIp = (typeof IP_SCREENS !== 'undefined' && IP_SCREENS[f.scene]) ? f.scene : (localStorage.getItem('wemb-indpark-screen') || 'main');\n" +
  "          try { localStorage.setItem('wemb-indpark-screen', wantIp); } catch (e3) {}\n" +
  "          if (typeof applyIndparkDT === 'function') applyIndparkDT(wantIp);\n" +
  "        }\n" +
  "        else if (f.tpl === 'gasmon') {"));

/* ── 저장된 화면 열기 ── */
edit('js/core/projects.js', "t.tpl === 'indpark'", (s) => {
  s = rep(s, "    try { if (t.tpl === 'gasmon') localStorage.setItem('wemb-gasmon-screen', t.tplScene || 'main'); } catch (e) {}",
    "    try { if (t.tpl === 'indpark') localStorage.setItem('wemb-indpark-screen', t.tplScene || 'main'); } catch (e) {}\n" +
    "    try { if (t.tpl === 'gasmon') localStorage.setItem('wemb-gasmon-screen', t.tplScene || 'main'); } catch (e) {}");
  return repAll(s, "t.tpl === 'office' || t.tpl === 'gasmon' ||", TPL_OR + "t.tpl === 'office' || t.tpl === 'gasmon' ||");
});

/* ── 새로고침 복원 · 밝기 복원 ── */
edit('js/main.js', "'indpark'", (s) => {
  s = rep(s, "    else if (__tdt === 'gasmon' && typeof applyGasmonDT === 'function') {",
    "    else if (__tdt === 'indpark' && typeof applyIndparkDT === 'function') {\n" +
    "      applyIndparkDT(window.__indparkSceneOf ? window.__indparkSceneOf() : localStorage.getItem('wemb-indpark-screen'));\n" +
    "    }\n" +
    "    else if (__tdt === 'gasmon' && typeof applyGasmonDT === 'function') {");
  s = rep(s, "  /* 스마트 플랜트 가스 모니터링은 Dark 가 원본 — 고른 밝기(wemb-gasmon-mode)는 그대로 되살아난다 */",
    "  /* 스마트 산단 디지털 트윈은 Dark 가 원본 — 고른 밝기(wemb-indpark-mode)는 그대로 되살아난다 */\n" +
    "  if (state.screen === 'dt' && localStorage.getItem('wemb-tpl-dt') === 'indpark') {\n" +
    "    const want = localStorage.getItem('wemb-indpark-mode') === 'light' ? 'light' : 'dark';\n" +
    "    if (state.mode !== want) {\n" +
    "      state.mode = want;\n" +
    "      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));\n" +
    "    }\n" +
    "  }\n" +
    "  /* 스마트 플랜트 가스 모니터링은 Dark 가 원본 — 고른 밝기(wemb-gasmon-mode)는 그대로 되살아난다 */");
  return s;
});

/* ── 색 정하기 · 화면 테마 · 로고 ── */
edit('js/templates/image.js', 'INDPARK_OPT', (s) => {
  s = rep(s, '  GASMON_OPT: {',
    "  /* 스마트 산단 디지털 트윈 시안 — 주조색은 강조 파랑(#0088FF, 색상각 208°). 색을 그대로 둘 것:\n" +
    "     위성 지도 · 3D 렌더(사업장 · 지게차 · 온도) · 화면 바탕 사진 · 등급 구슬(Badge) · 상태 전구 · 그래프 선(색이 곧 뜻).\n" +
    "     판 · 선 · 글자 · 단추 · 아이콘 · 내비는 따라간다 */\n" +
    "  INDPARK_OPT: {\n" +
    "    seed: '#0088FF', seededKey: 'wemb-indpark-seeded', refHue: 208,\n" +
    "    keep: /(^|\\/)(map\\.png|screen-[-\\w]*\\.(png|jpg)|badge-[-\\w]*|indicator[-\\w]*|data(-\\d+)?\\.svg|glyph[-\\w]*|part(-\\d+)?\\.svg|button-close-2(-lt)?\\.svg)(\\.(svg|png|jpg))?(\\?|$)/i,\n" +
    "    raster: /$^/,\n" +
    "  },\n" +
    '  GASMON_OPT: {');
  s = rep(s, "    /* 스마트 플랜트 가스 모니터링 화면 5장 — 같은 방식.",
    "    /* 스마트 산단 디지털 트윈 화면 9장 — 같은 방식. 열린 장면만 칠한다 */\n" +
    "    [" + PXS.map((p) => "'" + p + "'").join(', ') + "].forEach((px) => {\n" +
    "      if (document.querySelector('.' + px + '-root')) this.icheonTint(t, mode, '.' + px + '-root', [px + '-style', px + '-light-style', 'indpark-live-style'], 'wemb-indpark-mode', this.INDPARK_OPT);\n" +
    "    });\n" +
    "    /* 스마트 플랜트 가스 모니터링 화면 5장 — 같은 방식.");
  s = rep(s, "  DOM_CUSTOM: '", "  DOM_CUSTOM: '" + PXS.map((p) => '.' + p + '-root [data-name=\"Brand\"] > [data-name=\"Logo\"]').join(', ') + ", ' +\n    '");
  return s;
});

/* ── 패널편집(내용 수정) — 모든 글자 ── */
edit('js/studio/dt-edit.js', '.ipm-root p', (s) => rep(s, ".gmm-root p, ", PXS.map((p) => '.' + p + '-root p').join(', ') + ", .gmm-root p, "));

/* ── '원자 변경' 창 ── */
edit('js/studio/atom-swap.js', "'ipm'", (s) => rep(s, "'gmm', ", PXS.map((p) => "'" + p + "'").join(', ') + ", 'gmm', "));

console.log('done ·', changed, '파일');
