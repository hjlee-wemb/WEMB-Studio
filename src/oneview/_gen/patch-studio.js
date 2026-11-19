/* 스튜디오 연결 — 통합 운영 원뷰 템플릿(tpl 'oneview', 11장면)을 등록한다.
   이미 들어가 있으면 건너뛴다. 고객사 이름은 카드 · 화면에 쓰지 않는다. 실행: node src/oneview/_gen/patch-studio.js
   js/templates/oneview.js 는 손으로 쓴 파일이다(gasmon.js 꼴, 9장 모두 단독 화면이라 시트는 장면마다 한 벌).
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
  ['main', 'ovm', '종합현황', 'oneview-main'],
  ['overview2', 'ovn', '종합현황 2', 'oneview-overview2'],
  ['transactions', 'ovt', '거래현황', 'oneview-transactions'],
  ['was', 'ovw', 'WAS 현황', 'oneview-was'],
  ['waspopup', 'ovp', 'WAS 페이지 설정', 'oneview-waspopup'],
  ['tp', 'ovq', 'TP 성능현황', 'oneview-tp'],
  ['system', 'ovs', '시스템 현황', 'oneview-system'],
  ['system2', 'ovr', '시스템 현황 2', 'oneview-system2'],
  ['detail', 'ovd', '시스템 현황 상세', 'oneview-detail'],
  ['network', 'ovk', '네트워크 현황', 'oneview-network'],
  ['event', 'ove', '이벤트현황', 'oneview-event'],
];
const PXS = IP.map((x) => x[1]);
const IMG = (x) => 'src/templates/' + x[3] + '.jpg';
const TITLE = 'Dashboard: Integrated Operations One-View';
const KEY = 'B4mYvI2xtGTL1K5crHMLqe';
const TPL_OR = "t.tpl === 'oneview' || ";

/* ── 화면 모듈 표 — 장면마다 모듈 하나(열린 장면 것만 싣는다) ── */
edit('js/core/tpl-modules.js', 'oneview-main.js', (s) => rep(s, '    /* 스마트 플랜트 가스 모니터링 — Figma',
  '    /* 통합 운영 원뷰 — Figma ' + KEY + '. 단독 화면 11장 — 열린 장면 모듈만 싣는다 */\n    oneview: [\n'
  + IP.map((x) => "      { src: 'src/" + x[3] + ".js?v=1', build: ['build_" + x[1] + "'], scene: '" + x[0] + "' },").join('\n')
  + "\n      { src: 'src/oneview-live.js?v=1', part: 'base' },\n    ],\n    /* 스마트 플랜트 가스 모니터링 — Figma"));

if (!fs.readFileSync(path.join(ROOT, 'studio.html'), 'utf8').includes('js/templates/oneview.js')) {
  edit('studio.html', 'js/templates/oneview.js', (s) => {
    s = rep(s, '    <!-- 스마트 플랜트 가스 모니터링 — Figma',
      '    <!-- 통합 운영 원뷰 — Figma ' + KEY + ' 화면 11장을 순수 HTML/CSS DOM 으로 재구축.\n' +
      '         화면 모듈은 js/core/tpl-modules.js 가 싣는다. 생성기: src/oneview/_gen/. -->\n' +
      '    <script src="js/templates/oneview.js?v=1"></script>\n' +
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
edit('js/launcher/templates.js', "w.tpl = 'oneview'", (s) => {
  const m = /\n  \];\n(\s*)(?:\/\/[^\n]*\n\s*|\/\*[\s\S]*?\*\/\s*)*(?:const|var|let) TEMPLATES/.exec(s);
  if (!m) throw new Error('TPL_DEFS 끝을 못 찾음');
  s = s.slice(0, m.index) +
    "\n    { title: '" + TITLE + "', area: '서비스·거래', date: 'Nov 19, 2026', slides: [\n" +
    IP.map((x) => "      { img: '" + IMG(x) + "', label: '" + x[2] + "' }").join(',\n') + '] },' + s.slice(m.index);
  s = rep(s, "  /* 스마트 플랜트 가스 모니터링 — '스튜디오 열기' 시",
    "  /* 통합 운영 원뷰 — '스튜디오 열기' 시 Figma(" + KEY + ") 화면 11장을\n" +
    "     순수 HTML/CSS DOM 으로 재구축한 것(src/oneview-*.js)으로 연다. */\n" +
    "  (function () {\n" +
    "    const w = TEMPLATES.find((t) => t.title === '" + TITLE + "');\n" +
    "    if (w) w.tpl = 'oneview';\n" +
    "  })();\n" +
    "  /* 스마트 플랜트 가스 모니터링 — '스튜디오 열기' 시");
  s = repAll(s, "t.tpl === 'office' || t.tpl === 'gasmon' ||", TPL_OR + "t.tpl === 'office' || t.tpl === 'gasmon' ||");
  return s;
});

/* ── 홈 ── */
edit('js/launcher/home.js', "t.tpl === 'oneview'", (s) => {
  s = repAll(s, "t.tpl === 'office' || t.tpl === 'gasmon' ||", TPL_OR + "t.tpl === 'office' || t.tpl === 'gasmon' ||");
  s = rep(s, "      : pending.tpl === 'gasmon' ? 'src/templates/gasmon-main.jpg'",
    "      : pending.tpl === 'oneview' ? 'src/templates/oneview-main.jpg'\n      : pending.tpl === 'gasmon' ? 'src/templates/gasmon-main.jpg'");
  s = rep(s, "                  : proj.tpl === 'gasmon' ? [",
    "                  : proj.tpl === 'oneview' ? [" + IP.slice(1).map((x) => "'" + x[0] + "'").join(', ') + "][i]\n                  : proj.tpl === 'gasmon' ? [");
  s = rep(s, "      : openProj.tpl === 'gasmon' ? (openProj.tplScene || 'main')",
    "      : openProj.tpl === 'oneview' ? (openProj.tplScene || 'main')\n      : openProj.tpl === 'gasmon' ? (openProj.tplScene || 'main')");
  s = rep(s, "      if (openProj.tpl === 'gasmon') localStorage.setItem('wemb-gasmon-screen', openScene);",
    "      if (openProj.tpl === 'oneview') localStorage.setItem('wemb-oneview-screen', openScene);\n      if (openProj.tpl === 'gasmon') localStorage.setItem('wemb-gasmon-screen', openScene);");
  return s;
});

/* ── 작업공간 ── */
edit('js/studio/project.js', "f.tpl === 'oneview'", (s) => rep(s,
  "        else if (f.tpl === 'gasmon') {",
  "        else if (f.tpl === 'oneview') {\n" +
  "          localStorage.setItem('wemb-tpl-dt', 'oneview'); localStorage.removeItem('wemb-tpl-img');\n" +
  "          const wantIp = (typeof IP_SCREENS !== 'undefined' && IP_SCREENS[f.scene]) ? f.scene : (localStorage.getItem('wemb-oneview-screen') || 'main');\n" +
  "          try { localStorage.setItem('wemb-oneview-screen', wantIp); } catch (e3) {}\n" +
  "          if (typeof applyOneviewDT === 'function') applyOneviewDT(wantIp);\n" +
  "        }\n" +
  "        else if (f.tpl === 'gasmon') {"));

/* ── 저장된 화면 열기 ── */
edit('js/core/projects.js', "t.tpl === 'oneview'", (s) => {
  s = rep(s, "    try { if (t.tpl === 'gasmon') localStorage.setItem('wemb-gasmon-screen', t.tplScene || 'main'); } catch (e) {}",
    "    try { if (t.tpl === 'oneview') localStorage.setItem('wemb-oneview-screen', t.tplScene || 'main'); } catch (e) {}\n" +
    "    try { if (t.tpl === 'gasmon') localStorage.setItem('wemb-gasmon-screen', t.tplScene || 'main'); } catch (e) {}");
  return repAll(s, "t.tpl === 'office' || t.tpl === 'gasmon' ||", TPL_OR + "t.tpl === 'office' || t.tpl === 'gasmon' ||");
});

/* ── 새로고침 복원 · 밝기 복원 ── */
edit('js/main.js', "'oneview'", (s) => {
  s = rep(s, "    else if (__tdt === 'gasmon' && typeof applyGasmonDT === 'function') {",
    "    else if (__tdt === 'oneview' && typeof applyOneviewDT === 'function') {\n" +
    "      applyOneviewDT(window.__oneviewSceneOf ? window.__oneviewSceneOf() : localStorage.getItem('wemb-oneview-screen'));\n" +
    "    }\n" +
    "    else if (__tdt === 'gasmon' && typeof applyGasmonDT === 'function') {");
  s = rep(s, "  /* 스마트 플랜트 가스 모니터링은 Dark 가 원본 — 고른 밝기(wemb-gasmon-mode)는 그대로 되살아난다 */",
    "  /* 통합 운영 원뷰은 Dark 가 원본 — 고른 밝기(wemb-oneview-mode)는 그대로 되살아난다 */\n" +
    "  if (state.screen === 'dt' && localStorage.getItem('wemb-tpl-dt') === 'oneview') {\n" +
    "    const want = localStorage.getItem('wemb-oneview-mode') === 'light' ? 'light' : 'dark';\n" +
    "    if (state.mode !== want) {\n" +
    "      state.mode = want;\n" +
    "      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));\n" +
    "    }\n" +
    "  }\n" +
    "  /* 스마트 플랜트 가스 모니터링은 Dark 가 원본 — 고른 밝기(wemb-gasmon-mode)는 그대로 되살아난다 */");
  return s;
});

/* ── 색 정하기 · 화면 테마 · 로고 ── */
edit('js/templates/image.js', 'ONEVIEW_OPT', (s) => {
  s = rep(s, '  GASMON_OPT: {',
    "  /* 통합 운영 원뷰 시안 — 주조색은 강조 파랑(#2F80FF, 색상각 216°). 색을 그대로 둘 것:\n" +
    "     3D 노드 그림(구슬 · 큐브 · 장비) · 화면 바탕 · 장식 그림 · 그래프 선 · 범례 점 · 상태 점(색이 곧 뜻).\n" +
    "     판 · 선 · 글자 · 단추 · 아이콘 · 내비는 따라간다 */\n" +
    "  ONEVIEW_OPT: {\n" +
    "    seed: '#2F80FF', seededKey: 'wemb-oneview-seeded', refHue: 216,\n" +
    "    keep: /(^|\\/)(line-[-\\w]*|key-[-\\w]*|dot-[-\\w]*|image(-\\d+)*|shape(-\\d+)*|center|background(-\\d+)?|indicator[-\\w]*)(-lt)?\\.(svg|png|jpg)(\\?|$)/i,\n" +
    "    raster: /$^/,\n" +
    "  },\n" +
    '  GASMON_OPT: {');
  s = rep(s, "    /* 스마트 플랜트 가스 모니터링 화면 5장 — 같은 방식.",
    "    /* 통합 운영 원뷰 화면 11장 — 같은 방식. 열린 장면만 칠한다 */\n" +
    "    [" + PXS.map((p) => "'" + p + "'").join(', ') + "].forEach((px) => {\n" +
    "      if (document.querySelector('.' + px + '-root')) this.icheonTint(t, mode, '.' + px + '-root', [px + '-style', px + '-light-style', 'oneview-live-style'], 'wemb-oneview-mode', this.ONEVIEW_OPT);\n" +
    "    });\n" +
    "    /* 스마트 플랜트 가스 모니터링 화면 5장 — 같은 방식.");
  s = rep(s, "  DOM_CUSTOM: '", "  DOM_CUSTOM: '" + PXS.map((p) => '.' + p + '-root [data-name=\"Brand\"] > [data-name=\"Logo\"]').join(', ') + ", ' +\n    '");
  return s;
});

/* ── 패널편집(내용 수정) — 모든 글자 ── */
edit('js/studio/dt-edit.js', '.ovm-root p', (s) => rep(s, ".gmm-root p, ", PXS.map((p) => '.' + p + '-root p').join(', ') + ", .gmm-root p, "));

/* ── '원자 변경' 창 ── */
edit('js/studio/atom-swap.js', "'ovm'", (s) => rep(s, "'gmm', ", PXS.map((p) => "'" + p + "'").join(', ') + ", 'gmm', "));

console.log('done ·', changed, '파일');
