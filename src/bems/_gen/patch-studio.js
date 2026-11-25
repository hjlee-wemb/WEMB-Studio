/* 스튜디오 연결 — 스마트 빌딩 에너지 관리 템플릿(tpl 'bems', 2장면)을 등록한다.
   이미 들어가 있으면 건너뛴다. 고객사 이름은 카드 · 화면에 쓰지 않는다(admin 표에만). 실행: node src/bems/_gen/patch-studio.js
   js/templates/bems.js 는 mk-template.js 가 데이터센터 연결 파일을 바탕으로 만든 뒤 손으로 고친다.
   앵커는 바로 앞에 들어간 '데이터센터 통합 모니터링(datacenter)' 자리 — 그 앞(목록은 뒤)에 끼운다. */
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
  ['main', 'bem', '메인', 'bems-main'],
  ['floor', 'bef', '층별 현황', 'bems-floor'],
];
const PXS = IP.map((x) => x[1]);
const IMG = (x) => 'src/templates/' + x[3] + '.jpg';
const TITLE = 'Digital Twin: Smart Building Energy Management';
const KEY = 'CKnzs0z7gCSTPybhRZme1P';
const TPL_OR = "t.tpl === 'bems' || ";

/* ── 화면 모듈 표 — 장면마다 모듈 하나(열린 장면 것만 싣는다) ── */
edit('js/core/tpl-modules.js', 'bems-main.js', (s) => rep(s, '    /* 데이터센터 통합 모니터링 — Figma',
  '    /* 스마트 빌딩 에너지 관리 — Figma ' + KEY + '. 화면 2장(메인 · 층별 현황) */\n    bems: [\n'
  + IP.map((x) => "      { src: 'src/" + x[3] + ".js?v=1', build: ['build_" + x[1] + "'] },").join('\n')
  + "\n      { src: 'src/bems-live.js?v=1', part: 'base' },\n    ],\n    /* 데이터센터 통합 모니터링 — Figma"));

if (!fs.readFileSync(path.join(ROOT, 'studio.html'), 'utf8').includes('js/templates/bems.js')) {
  edit('studio.html', 'js/templates/bems.js', (s) => {
    s = rep(s, '    <!-- 데이터센터 통합 모니터링 — Figma',
      '    <!-- 스마트 빌딩 에너지 관리 — Figma ' + KEY + ' 화면 2장면을 순수 HTML/CSS DOM 으로 재구축.\n' +
      '         화면 모듈은 js/core/tpl-modules.js 가 싣는다. 생성기: src/bems/_gen/. -->\n' +
      '    <script src="js/templates/bems.js?v=1"></script>\n' +
      '    <!-- 데이터센터 통합 모니터링 — Figma');
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

/* ── 템플릿 카탈로그 · admin 표 ── */
edit('js/launcher/templates.js', "w.tpl = 'bems'", (s) => {
  if (!s.includes("title: '" + TITLE + "'")) {
    s = rep(s, "      { img: 'src/templates/datacenter-scenario.jpg', label: '시나리오설명' }] },\n",
      "      { img: 'src/templates/datacenter-scenario.jpg', label: '시나리오설명' }] },\n" +
      "    { title: '" + TITLE + "', area: '부지·건물·층', date: 'Nov 25, 2026', slides: [\n" +
      IP.map((x) => "      { img: '" + IMG(x) + "', label: '" + x[2] + "' }").join(',\n') + '] },\n');
  }
  s = rep(s, "    'Digital Twin: Data Center Integrated Monitoring': ['LG CNS 부산 데이터센터 통합모니터링', 'LG CNS'],\n",
    "    'Digital Twin: Data Center Integrated Monitoring': ['LG CNS 부산 데이터센터 통합모니터링', 'LG CNS'],\n" +
    "    '" + TITLE + "': ['대만 Bio-Tech 빌딩 에너지 관제', '대만 Bio-Tech'],\n");
  s = rep(s, "  /* 데이터센터 통합 모니터링 — '스튜디오 열기' 시",
    "  /* 스마트 빌딩 에너지 관리 — '스튜디오 열기' 시 Figma(" + KEY + ") 화면 2장면을\n" +
    "     순수 HTML/CSS DOM 으로 재구축한 것(src/bems-*.js)으로 연다. */\n" +
    "  (function () {\n" +
    "    const w = TEMPLATES.find((t) => t.title === '" + TITLE + "');\n" +
    "    if (w) w.tpl = 'bems';\n" +
    "  })();\n" +
    "  /* 데이터센터 통합 모니터링 — '스튜디오 열기' 시");
  s = repAll(s, "t.tpl === 'datacenter' || ", TPL_OR + "t.tpl === 'datacenter' || ");
  return s;
});

/* ── 홈 ── */
edit('js/launcher/home.js', "t.tpl === 'bems'", (s) => {
  s = repAll(s, "t.tpl === 'datacenter' || ", TPL_OR + "t.tpl === 'datacenter' || ");
  s = rep(s, "      : pending.tpl === 'datacenter' ? 'src/templates/datacenter-main.jpg'",
    "      : pending.tpl === 'bems' ? 'src/templates/bems-main.jpg'\n      : pending.tpl === 'datacenter' ? 'src/templates/datacenter-main.jpg'");
  s = rep(s, "                  : proj.tpl === 'datacenter' ? [",
    "                  : proj.tpl === 'bems' ? [" + IP.slice(1).map((x) => "'" + x[0] + "'").join(', ') + "][i]\n                  : proj.tpl === 'datacenter' ? [");
  s = rep(s, "      : openProj.tpl === 'datacenter' ? (openProj.tplScene || 'main')",
    "      : openProj.tpl === 'bems' ? (openProj.tplScene || 'main')\n      : openProj.tpl === 'datacenter' ? (openProj.tplScene || 'main')");
  s = rep(s, "      if (openProj.tpl === 'datacenter') localStorage.setItem('wemb-datacenter-screen', openScene);",
    "      if (openProj.tpl === 'bems') localStorage.setItem('wemb-bems-screen', openScene);\n      if (openProj.tpl === 'datacenter') localStorage.setItem('wemb-datacenter-screen', openScene);");
  return s;
});

/* ── 작업공간 ── */
edit('js/studio/project.js', "f.tpl === 'bems'", (s) => rep(s,
  "        else if (f.tpl === 'datacenter') {",
  "        else if (f.tpl === 'bems') {\n" +
  "          localStorage.setItem('wemb-tpl-dt', 'bems'); localStorage.removeItem('wemb-tpl-img');\n" +
  "          const wantBe = (f.scene === 'main' || f.scene === 'floor') ? f.scene : (localStorage.getItem('wemb-bems-screen') || 'main');\n" +
  "          try { localStorage.setItem('wemb-bems-screen', wantBe); } catch (e3) {}\n" +
  "          if (typeof applyBemsDT === 'function') applyBemsDT(wantBe);\n" +
  "        }\n" +
  "        else if (f.tpl === 'datacenter') {"));

/* ── 저장된 화면 열기 ── */
edit('js/core/projects.js', "t.tpl === 'bems'", (s) => {
  s = rep(s, "    try { if (t.tpl === 'datacenter') localStorage.setItem('wemb-datacenter-screen', t.tplScene || 'main'); } catch (e) {}",
    "    try { if (t.tpl === 'bems') localStorage.setItem('wemb-bems-screen', t.tplScene || 'main'); } catch (e) {}\n" +
    "    try { if (t.tpl === 'datacenter') localStorage.setItem('wemb-datacenter-screen', t.tplScene || 'main'); } catch (e) {}");
  return repAll(s, "t.tpl === 'datacenter' || ", TPL_OR + "t.tpl === 'datacenter' || ");
});

/* ── 새로고침 복원 · 밝기 복원 ── */
edit('js/main.js', "'bems'", (s) => {
  s = rep(s, "    else if (__tdt === 'datacenter' && typeof applyDatacenterDT === 'function') {",
    "    else if (__tdt === 'bems' && typeof applyBemsDT === 'function') {\n" +
    "      applyBemsDT(window.__bemsSceneOf ? window.__bemsSceneOf() : localStorage.getItem('wemb-bems-screen'));\n" +
    "    }\n" +
    "    else if (__tdt === 'datacenter' && typeof applyDatacenterDT === 'function') {");
  s = rep(s, "  /* 데이터센터 통합 모니터링은 Dark 가 원본 — 고른 밝기(wemb-datacenter-mode)는 그대로 되살아난다 */",
    "  /* 스마트 빌딩 에너지 관리는 Dark 가 원본 — 고른 밝기(wemb-bems-mode)는 그대로 되살아난다 */\n" +
    "  if (state.screen === 'dt' && localStorage.getItem('wemb-tpl-dt') === 'bems') {\n" +
    "    const want = localStorage.getItem('wemb-bems-mode') === 'light' ? 'light' : 'dark';\n" +
    "    if (state.mode !== want) {\n" +
    "      state.mode = want;\n" +
    "      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));\n" +
    "    }\n" +
    "  }\n" +
    "  /* 데이터센터 통합 모니터링은 Dark 가 원본 — 고른 밝기(wemb-datacenter-mode)는 그대로 되살아난다 */");
  return s;
});

/* ── 색 정하기 · 화면 테마 · 로고 ── */
edit('js/templates/image.js', 'BEMS_OPT', (s) => {
  s = rep(s, '  DATACENTER_OPT: {',
    "  /* 스마트 빌딩 에너지 관리 시안 — 주조색은 단추 테두리 · 막대 파랑(#568DFF, 색상각 221°). 색을 그대로 둘 것:\n" +
    "     3D 건물 · 층 렌더 · 화면 바탕 사진 · 건물 아이콘(사진 + 면) · 차트 선/면(범례 색이 곧 뜻).\n" +
    "     판 · 선 · 글자 · 단추 · 아이콘 · 내비는 따라간다 */\n" +
    "  BEMS_OPT: {\n" +
    "    seed: '#568DFF', seededKey: 'wemb-bems-seeded', refHue: 221,\n" +
    "    keep: /(^|\\/)(view-[-\\w]*|background(-[\\w]+)?|image(-[\\w]+)*|facet-[-\\w]*|shadow(-[\\w]+)*|reflection(-[\\w]+)*|data|line-[-\\w]*|slider[-\\w]*|bullet(-\\d+)?|icon-trend-[-\\w]*)(-lt)?\\.(svg|png|jpg)(\\?|$)/i,\n" +
    "    raster: /$^/,\n" +
    "  },\n" +
    '  DATACENTER_OPT: {');
  s = rep(s, "    /* 데이터센터 통합 모니터링 화면 8장면 — 같은 방식.",
    "    /* 스마트 빌딩 에너지 관리 화면 2장면 — 같은 방식. 열린 장면만 칠한다 */\n" +
    "    [" + PXS.map((p) => "'" + p + "'").join(', ') + "].forEach((px) => {\n" +
    "      if (document.querySelector('.' + px + '-root')) this.icheonTint(t, mode, '.' + px + '-root', [px + '-style', px + '-light-style', 'bems-live-style'], 'wemb-bems-mode', this.BEMS_OPT);\n" +
    "    });\n" +
    "    /* 데이터센터 통합 모니터링 화면 8장면 — 같은 방식.");
  s = rep(s, "  DOM_CUSTOM: '", "  DOM_CUSTOM: '" + PXS.map((p) => '.' + p + '-root [data-name=\"Header\"] > [data-name=\"Logo\"]').join(', ') + ", ' +\n    '");
  return s;
});

/* ── 패널편집(내용 수정) — 모든 글자 ── */
edit('js/studio/dt-edit.js', '.bem-root p', (s) => rep(s, ".dmm-root p, ", PXS.map((p) => '.' + p + '-root p').join(', ') + ", .dmm-root p, "));

/* ── '원자 변경' 창 ── */
edit('js/studio/atom-swap.js', "'bem'", (s) => rep(s, "'dmm', ", PXS.map((p) => "'" + p + "'").join(', ') + ", 'dmm', "));

console.log('done ·', changed, '파일');
