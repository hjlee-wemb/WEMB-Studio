/* 스튜디오 연결 — 데이터센터 통합 모니터링 템플릿(tpl 'datacenter', 11장면)을 등록한다.
   이미 들어가 있으면 건너뛴다. 고객사 이름은 카드 · 화면에 쓰지 않는다. 실행: node src/datacenter/_gen/patch-studio.js
   js/templates/datacenter.js 는 손으로 쓴 파일이다(gasmon.js 꼴, 9장 모두 단독 화면이라 시트는 장면마다 한 벌).
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
  ['main', 'dmm', '통합모니터링', 'datacenter-main'],
  ['power', 'dmp', '통합전력계통도', 'datacenter-power'],
  ['worker', 'dmw', '작업자안전관리', 'datacenter-worker'],
  ['asset', 'dma', '자산관리', 'datacenter-asset'],
  ['equipment', 'dme', '설비정보', 'datacenter-equipment'],
  ['card', 'dmc', '설비 카드', 'datacenter-card'],
  ['search', 'dms', '설비정보팝업', 'datacenter-search'],
  ['scenario', 'dmx', '시나리오설명', 'datacenter-scenario'],
];
const PXS = IP.map((x) => x[1]).concat(['dmi']);
const IMG = (x) => 'src/templates/' + x[3] + '.jpg';
const TITLE = 'Digital Twin: Data Center Integrated Monitoring';
const KEY = 'HzfsAmSQbpqIhAYebEkOWr';
const TPL_OR = "t.tpl === 'datacenter' || ";

/* ── 화면 모듈 표 — 장면마다 모듈 하나(열린 장면 것만 싣는다) ── */
edit('js/core/tpl-modules.js', 'datacenter-main.js', (s) => rep(s, '    /* 스마트 플랜트 가스 모니터링 — Figma',
  '    /* 데이터센터 통합 모니터링 — Figma ' + KEY + '. 화면 4장 + 전력 계통도 위 팝업 5장. 팝업이 바탕 빌더를 부르므로 통째로 */\n    datacenter: [\n'
  + [['main', ['build_dmm']], ['power', ['build_dmp']], ['worker', ['build_dmw']], ['asset', ['build_dma']], ['equipment', ['build_dme', 'build_dmp_equipment']], ['card', ['build_dmc', 'build_dmp_card']], ['compact', ['build_dmi', 'build_dmp_compact']], ['search', ['build_dms', 'build_dmp_search']], ['scenario', ['build_dmx', 'build_dmp_scenario']]]
    .map((x) => "      { src: 'src/datacenter-" + x[0] + ".js?v=1', build: [" + x[1].map((b) => "'" + b + "'").join(', ') + "] },").join('\n')
  + "\n      { src: 'src/datacenter-live.js?v=1', part: 'base' },\n    ],\n    /* 스마트 플랜트 가스 모니터링 — Figma"));

if (!fs.readFileSync(path.join(ROOT, 'studio.html'), 'utf8').includes('js/templates/datacenter.js')) {
  edit('studio.html', 'js/templates/datacenter.js', (s) => {
    s = rep(s, '    <!-- 스마트 플랜트 가스 모니터링 — Figma',
      '    <!-- 데이터센터 통합 모니터링 — Figma ' + KEY + ' 화면 8장면을 순수 HTML/CSS DOM 으로 재구축.\n' +
      '         화면 모듈은 js/core/tpl-modules.js 가 싣는다. 생성기: src/datacenter/_gen/. -->\n' +
      '    <script src="js/templates/datacenter.js?v=1"></script>\n' +
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
edit('js/launcher/templates.js', "w.tpl = 'datacenter'", (s) => {
  /* 갤러리 항목은 11-24 에 손으로 넣었다(그 사이 TPL_DEFS 뒤에 TPL_ADMIN 표가 생겨 옛 끝 찾기가 안 맞는다) — 없을 때만 넣는다 */
  if (!s.includes("title: '" + TITLE + "'")) {
    const m = /\n  \];\n(\s*)(?:\/\/[^\n]*\n\s*|\/\*[\s\S]*?\*\/\s*)*(?:const|var|let) (?:TEMPLATES|TPL_ADMIN)/.exec(s);
    if (!m) throw new Error('TPL_DEFS 끝을 못 찾음');
    s = s.slice(0, m.index) +
      "\n    { title: '" + TITLE + "', area: 'IT·데이터센터', date: 'Nov 24, 2026', slides: [\n" +
      IP.map((x) => "      { img: '" + IMG(x) + "', label: '" + x[2] + "' }").join(',\n') + '] },' + s.slice(m.index);
  }
  s = rep(s, "  /* 스마트 플랜트 가스 모니터링 — '스튜디오 열기' 시",
    "  /* 데이터센터 통합 모니터링 — '스튜디오 열기' 시 Figma(" + KEY + ") 화면 8장면을\n" +
    "     순수 HTML/CSS DOM 으로 재구축한 것(src/datacenter-*.js)으로 연다. */\n" +
    "  (function () {\n" +
    "    const w = TEMPLATES.find((t) => t.title === '" + TITLE + "');\n" +
    "    if (w) w.tpl = 'datacenter';\n" +
    "  })();\n" +
    "  /* 스마트 플랜트 가스 모니터링 — '스튜디오 열기' 시");
  s = repAll(s, "t.tpl === 'office' || t.tpl === 'gasmon' ||", TPL_OR + "t.tpl === 'office' || t.tpl === 'gasmon' ||");
  return s;
});

/* ── 홈 ── */
edit('js/launcher/home.js', "t.tpl === 'datacenter'", (s) => {
  s = repAll(s, "t.tpl === 'office' || t.tpl === 'gasmon' ||", TPL_OR + "t.tpl === 'office' || t.tpl === 'gasmon' ||");
  s = rep(s, "      : pending.tpl === 'gasmon' ? 'src/templates/gasmon-main.jpg'",
    "      : pending.tpl === 'datacenter' ? 'src/templates/datacenter-main.jpg'\n      : pending.tpl === 'gasmon' ? 'src/templates/gasmon-main.jpg'");
  s = rep(s, "                  : proj.tpl === 'gasmon' ? [",
    "                  : proj.tpl === 'datacenter' ? [" + IP.slice(1).map((x) => "'" + x[0] + "'").join(', ') + "][i]\n                  : proj.tpl === 'gasmon' ? [");
  s = rep(s, "      : openProj.tpl === 'gasmon' ? (openProj.tplScene || 'main')",
    "      : openProj.tpl === 'datacenter' ? (openProj.tplScene || 'main')\n      : openProj.tpl === 'gasmon' ? (openProj.tplScene || 'main')");
  s = rep(s, "      if (openProj.tpl === 'gasmon') localStorage.setItem('wemb-gasmon-screen', openScene);",
    "      if (openProj.tpl === 'datacenter') localStorage.setItem('wemb-datacenter-screen', openScene);\n      if (openProj.tpl === 'gasmon') localStorage.setItem('wemb-gasmon-screen', openScene);");
  return s;
});

/* ── 작업공간 ── */
edit('js/studio/project.js', "f.tpl === 'datacenter'", (s) => rep(s,
  "        else if (f.tpl === 'gasmon') {",
  "        else if (f.tpl === 'datacenter') {\n" +
  "          localStorage.setItem('wemb-tpl-dt', 'datacenter'); localStorage.removeItem('wemb-tpl-img');\n" +
  "          const wantIp = (typeof IP_SCREENS !== 'undefined' && IP_SCREENS[f.scene]) ? f.scene : (localStorage.getItem('wemb-datacenter-screen') || 'main');\n" +
  "          try { localStorage.setItem('wemb-datacenter-screen', wantIp); } catch (e3) {}\n" +
  "          if (typeof applyDatacenterDT === 'function') applyDatacenterDT(wantIp);\n" +
  "        }\n" +
  "        else if (f.tpl === 'gasmon') {"));

/* ── 저장된 화면 열기 ── */
edit('js/core/projects.js', "t.tpl === 'datacenter'", (s) => {
  s = rep(s, "    try { if (t.tpl === 'gasmon') localStorage.setItem('wemb-gasmon-screen', t.tplScene || 'main'); } catch (e) {}",
    "    try { if (t.tpl === 'datacenter') localStorage.setItem('wemb-datacenter-screen', t.tplScene || 'main'); } catch (e) {}\n" +
    "    try { if (t.tpl === 'gasmon') localStorage.setItem('wemb-gasmon-screen', t.tplScene || 'main'); } catch (e) {}");
  return repAll(s, "t.tpl === 'office' || t.tpl === 'gasmon' ||", TPL_OR + "t.tpl === 'office' || t.tpl === 'gasmon' ||");
});

/* ── 새로고침 복원 · 밝기 복원 ── */
edit('js/main.js', "'datacenter'", (s) => {
  s = rep(s, "    else if (__tdt === 'gasmon' && typeof applyGasmonDT === 'function') {",
    "    else if (__tdt === 'datacenter' && typeof applyDatacenterDT === 'function') {\n" +
    "      applyDatacenterDT(window.__datacenterSceneOf ? window.__datacenterSceneOf() : localStorage.getItem('wemb-datacenter-screen'));\n" +
    "    }\n" +
    "    else if (__tdt === 'gasmon' && typeof applyGasmonDT === 'function') {");
  s = rep(s, "  /* 스마트 플랜트 가스 모니터링은 Dark 가 원본 — 고른 밝기(wemb-gasmon-mode)는 그대로 되살아난다 */",
    "  /* 데이터센터 통합 모니터링은 Dark 가 원본 — 고른 밝기(wemb-datacenter-mode)는 그대로 되살아난다 */\n" +
    "  if (state.screen === 'dt' && localStorage.getItem('wemb-tpl-dt') === 'datacenter') {\n" +
    "    const want = localStorage.getItem('wemb-datacenter-mode') === 'light' ? 'light' : 'dark';\n" +
    "    if (state.mode !== want) {\n" +
    "      state.mode = want;\n" +
    "      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));\n" +
    "    }\n" +
    "  }\n" +
    "  /* 스마트 플랜트 가스 모니터링은 Dark 가 원본 — 고른 밝기(wemb-gasmon-mode)는 그대로 되살아난다 */");
  return s;
});

/* ── 색 정하기 · 화면 테마 · 로고 ── */
edit('js/templates/image.js', 'DATACENTER_OPT', (s) => {
  s = rep(s, '  GASMON_OPT: {',
    "  /* 데이터센터 통합 모니터링 시안 — 주조색은 시안 파랑(#2575D5, 색상각 213°). 색을 그대로 둘 것:\n" +
    "     3D 노드 그림(구슬 · 큐브 · 장비) · 화면 바탕 · 장식 그림 · 그래프 선 · 범례 점 · 상태 점(색이 곧 뜻).\n" +
    "     판 · 선 · 글자 · 단추 · 아이콘 · 내비는 따라간다 */\n" +
    "  DATACENTER_OPT: {\n" +
    "    seed: '#2575D5', seededKey: 'wemb-datacenter-seeded', refHue: 213,\n" +
    "    keep: /(^|\\/)(line-[-\\w]*|key-[-\\w]*|dot-[-\\w]*|image(-\\d+)*|shape(-\\d+)*|center|background(-\\d+)?|indicator[-\\w]*)(-lt)?\\.(svg|png|jpg)(\\?|$)/i,\n" +
    "    raster: /$^/,\n" +
    "  },\n" +
    '  GASMON_OPT: {');
  s = rep(s, "    /* 스마트 플랜트 가스 모니터링 화면 5장 — 같은 방식.",
    "    /* 데이터센터 통합 모니터링 화면 8장면 — 같은 방식. 열린 장면만 칠한다 */\n" +
    "    [" + PXS.map((p) => "'" + p + "'").join(', ') + "].forEach((px) => {\n" +
    "      if (document.querySelector('.' + px + '-root')) this.icheonTint(t, mode, '.' + px + '-root', [px + '-style', px + '-light-style', 'datacenter-live-style'], 'wemb-datacenter-mode', this.DATACENTER_OPT);\n" +
    "    });\n" +
    "    /* 스마트 플랜트 가스 모니터링 화면 5장 — 같은 방식.");
  s = rep(s, "  DOM_CUSTOM: '", "  DOM_CUSTOM: '" + PXS.map((p) => '.' + p + '-root [data-name=\"Brand\"] > [data-name=\"Logo\"]').join(', ') + ", ' +\n    '");
  return s;
});

/* ── 패널편집(내용 수정) — 모든 글자 ── */
edit('js/studio/dt-edit.js', '.dmm-root p', (s) => rep(s, ".gmm-root p, ", PXS.map((p) => '.' + p + '-root p').join(', ') + ", .gmm-root p, "));

/* ── '원자 변경' 창 ── */
edit('js/studio/atom-swap.js', "'dmm'", (s) => rep(s, "'gmm', ", PXS.map((p) => "'" + p + "'").join(', ') + ", 'gmm', "));

console.log('done ·', changed, '파일');
