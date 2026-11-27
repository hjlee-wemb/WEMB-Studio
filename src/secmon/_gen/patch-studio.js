/* 스튜디오 연결 — 증권 통합관제 템플릿(tpl 'secmon', 장면 6 + 팝업 장면 3)을 등록한다.
   이미 들어가 있으면 건너뛴다. 고객사 이름은 카드 · 화면에 쓰지 않는다(admin 표에만). 실행: node src/secmon/_gen/patch-studio.js
   js/templates/secmon.js 는 mk-template.js 가 빌딩 에너지 연결 파일을 바탕으로 만든 뒤 손으로 고친다.
   앵커는 바로 앞에 들어간 '스마트 빌딩 에너지 관리(bems)' 자리 — 그 앞(카탈로그는 뒤)에 끼운다. */
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
/* [장면, 뿌리 px, 카드 이름, 모듈 파일, build 이름들] */
const IP = [
  ['main', 'smm', '통합관제현황', 'secmon-main', ['build_smm']],
  ['channel', 'smc', '채널현황', 'secmon-channel', ['build_smc']],
  ['micro', 'sms', '마이크로 서비스현황', 'secmon-micro', ['build_sms']],
  ['mq', 'smq', '메시지큐현황', 'secmon-mq', ['build_smq']],
  ['infra', 'smi', '인프라현황', 'secmon-infra', ['build_smi']],
  ['event', 'sme', '이벤트현황', 'secmon-event', ['build_sme']],
  ['eventpanel', 'smx', '이벤트 현황(펼침)', 'secmon-eventpanel', ['build_smx', 'build_smm_eventpanel']],
  ['alert', 'sma', '이벤트 알림', 'secmon-alert', ['build_sma', 'build_smm_alert']],
  ['sound', 'smg', '사운드 설정 가이드', 'secmon-sound', ['build_smg', 'build_smm_sound']],
];
const PXS = IP.map((x) => x[1]);
const IMG = (x) => 'src/templates/secmon-' + x[0] + '.jpg';
const TITLE = 'Dashboard: Securities Integrated Monitoring';
const KEY = 'CWWIdHGJ2LlEolp3hCe6Gk';
const TPL_OR = "t.tpl === 'secmon' || ";

/* ── 화면 모듈 표 ── */
edit('js/core/tpl-modules.js', 'secmon-main.js', (s) => rep(s, '    /* 스마트 빌딩 에너지 관리 — Figma',
  '    /* 증권 통합관제 — Figma ' + KEY + '. 화면 6장 + 팝업 3장(팝업 모듈은 어느 장면에서나 같이 싣는다 — js/templates/secmon.js 의 SM_BUILDS) */\n    secmon: [\n'
  + IP.map((x) => "      { src: 'src/" + x[3] + ".js?v=1', build: [" + x[4].map((b) => "'" + b + "'").join(', ') + '] },').join('\n')
  + "\n      { src: 'src/secmon-live.js?v=1', part: 'base' },\n    ],\n    /* 스마트 빌딩 에너지 관리 — Figma"));

if (!fs.readFileSync(path.join(ROOT, 'studio.html'), 'utf8').includes('js/templates/secmon.js')) {
  edit('studio.html', 'js/templates/secmon.js', (s) => {
    s = rep(s, '    <!-- 스마트 빌딩 에너지 관리 — Figma',
      '    <!-- 증권 통합관제 — Figma ' + KEY + ' 화면 6장 + 팝업 3장을 순수 HTML/CSS DOM 으로 재구축.\n' +
      '         화면 모듈은 js/core/tpl-modules.js 가 싣는다. 생성기: src/secmon/_gen/. -->\n' +
      '    <script src="js/templates/secmon.js?v=1"></script>\n' +
      '    <!-- 스마트 빌딩 에너지 관리 — Figma');
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
edit('js/launcher/templates.js', "w.tpl = 'secmon'", (s) => {
  if (!s.includes("title: '" + TITLE + "'")) {
    s = rep(s, "      { img: 'src/templates/bems-floor.jpg', label: '층별 현황' }] },\n",
      "      { img: 'src/templates/bems-floor.jpg', label: '층별 현황' }] },\n" +
      "    { title: '" + TITLE + "', area: '통합관제·IT 운영', date: 'Nov 26, 2026', slides: [\n" +
      IP.map((x) => "      { img: '" + IMG(x) + "', label: '" + x[2] + "' }").join(',\n') + '] },\n');
  }
  s = rep(s, "    'Digital Twin: Smart Building Energy Management': ['대만 Bio-Tech 빌딩 에너지 관제', '대만 Bio-Tech'],\n",
    "    'Digital Twin: Smart Building Energy Management': ['대만 Bio-Tech 빌딩 에너지 관제', '대만 Bio-Tech'],\n" +
    "    '" + TITLE + "': ['증권 통합관제', '신한투자증권'],\n");
  s = rep(s, "  /* 스마트 빌딩 에너지 관리 — '스튜디오 열기' 시",
    "  /* 증권 통합관제 — '스튜디오 열기' 시 Figma(" + KEY + ") 화면 6장 + 팝업 3장을\n" +
    "     순수 HTML/CSS DOM 으로 재구축한 것(src/secmon-*.js)으로 연다. */\n" +
    "  (function () {\n" +
    "    const w = TEMPLATES.find((t) => t.title === '" + TITLE + "');\n" +
    "    if (w) w.tpl = 'secmon';\n" +
    "  })();\n" +
    "  /* 스마트 빌딩 에너지 관리 — '스튜디오 열기' 시");
  s = repAll(s, "t.tpl === 'bems' || ", TPL_OR + "t.tpl === 'bems' || ");
  return s;
});

/* ── 홈 ── */
edit('js/launcher/home.js', "t.tpl === 'secmon'", (s) => {
  s = repAll(s, "t.tpl === 'bems' || ", TPL_OR + "t.tpl === 'bems' || ");
  s = rep(s, "      : pending.tpl === 'bems' ? 'src/templates/bems-main.jpg'",
    "      : pending.tpl === 'secmon' ? 'src/templates/secmon-main.jpg'\n      : pending.tpl === 'bems' ? 'src/templates/bems-main.jpg'");
  s = rep(s, "                  : proj.tpl === 'bems' ? [",
    "                  : proj.tpl === 'secmon' ? [" + IP.slice(1).map((x) => "'" + x[0] + "'").join(', ') + "][i]\n                  : proj.tpl === 'bems' ? [");
  s = rep(s, "      : openProj.tpl === 'bems' ? (openProj.tplScene || 'main')",
    "      : openProj.tpl === 'secmon' ? (openProj.tplScene || 'main')\n      : openProj.tpl === 'bems' ? (openProj.tplScene || 'main')");
  s = rep(s, "      if (openProj.tpl === 'bems') localStorage.setItem('wemb-bems-screen', openScene);",
    "      if (openProj.tpl === 'secmon') localStorage.setItem('wemb-secmon-screen', openScene);\n      if (openProj.tpl === 'bems') localStorage.setItem('wemb-bems-screen', openScene);");
  return s;
});

/* ── 작업공간 ── */
edit('js/studio/project.js', "f.tpl === 'secmon'", (s) => rep(s,
  "        else if (f.tpl === 'bems') {",
  "        else if (f.tpl === 'secmon') {\n" +
  "          localStorage.setItem('wemb-tpl-dt', 'secmon'); localStorage.removeItem('wemb-tpl-img');\n" +
  "          const wantSm = (typeof SM_SCREENS !== 'undefined' && SM_SCREENS[f.scene]) ? f.scene : (localStorage.getItem('wemb-secmon-screen') || 'main');\n" +
  "          try { localStorage.setItem('wemb-secmon-screen', wantSm); } catch (e3) {}\n" +
  "          if (typeof applySecmonDT === 'function') applySecmonDT(wantSm);\n" +
  "        }\n" +
  "        else if (f.tpl === 'bems') {"));

/* ── 저장된 화면 열기 ── */
edit('js/core/projects.js', "t.tpl === 'secmon'", (s) => {
  s = rep(s, "    try { if (t.tpl === 'bems') localStorage.setItem('wemb-bems-screen', t.tplScene || 'main'); } catch (e) {}",
    "    try { if (t.tpl === 'secmon') localStorage.setItem('wemb-secmon-screen', t.tplScene || 'main'); } catch (e) {}\n" +
    "    try { if (t.tpl === 'bems') localStorage.setItem('wemb-bems-screen', t.tplScene || 'main'); } catch (e) {}");
  return repAll(s, "t.tpl === 'bems' || ", TPL_OR + "t.tpl === 'bems' || ");
});

/* ── 새로고침 복원 · 밝기 복원 ── */
edit('js/main.js', "'secmon'", (s) => {
  s = rep(s, "    else if (__tdt === 'bems' && typeof applyBemsDT === 'function') {",
    "    else if (__tdt === 'secmon' && typeof applySecmonDT === 'function') {\n" +
    "      applySecmonDT(window.__secmonSceneOf ? window.__secmonSceneOf() : localStorage.getItem('wemb-secmon-screen'));\n" +
    "    }\n" +
    "    else if (__tdt === 'bems' && typeof applyBemsDT === 'function') {");
  s = rep(s, "  /* 스마트 빌딩 에너지 관리는 Dark 가 원본 — 고른 밝기(wemb-bems-mode)는 그대로 되살아난다 */",
    "  /* 증권 통합관제는 Dark 가 원본 — 고른 밝기(wemb-secmon-mode)는 그대로 되살아난다 */\n" +
    "  if (state.screen === 'dt' && localStorage.getItem('wemb-tpl-dt') === 'secmon') {\n" +
    "    const want = localStorage.getItem('wemb-secmon-mode') === 'light' ? 'light' : 'dark';\n" +
    "    if (state.mode !== want) {\n" +
    "      state.mode = want;\n" +
    "      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));\n" +
    "    }\n" +
    "  }\n" +
    "  /* 스마트 빌딩 에너지 관리는 Dark 가 원본 — 고른 밝기(wemb-bems-mode)는 그대로 되살아난다 */");
  return s;
});

/* ── 색 정하기 · 화면 테마 · 로고 ── */
edit('js/templates/image.js', 'SECMON_OPT', (s) => {
  s = rep(s, '  BEMS_OPT: {',
    "  /* 증권 통합관제 시안 — 주조색은 패널 테두리 파랑(#57A2FE, 색상각 213°). 색을 그대로 둘 것:\n" +
    "     화면 바탕 사진 · 3D 서버 · 큐브 렌더(image · facet · body) · 등급 점(circle) · 차트 선/면(data · arc · donut — 범례 색이 곧 뜻).\n" +
    "     판 · 선 · 글자 · 단추 · 아이콘 · 내비는 따라간다 */\n" +
    "  SECMON_OPT: {\n" +
    "    seed: '#57A2FE', seededKey: 'wemb-secmon-seeded', refHue: 213,\n" +
    "    keep: /(^|\\/)(image(-[\\w]+)*|background(-[\\w]+)?|facet-[-\\w]*|body(-[\\w]+)*|masked-visual(-[\\w]+)*|circle(-[\\w]+)*|data(-[\\w]+)*|arc(-[\\w]+)*|donut(-[\\w]+)*|bar(-[\\w]+)*|shape(-[\\w]+)*)(-lt)?\\.(svg|png|jpg)(\\?|$)/i,\n" +
    "    raster: /$^/,\n" +
    "  },\n" +
    '  BEMS_OPT: {');
  s = rep(s, "    /* 스마트 빌딩 에너지 관리 화면 2장면 — 같은 방식.",
    "    /* 증권 통합관제 화면 6장 + 팝업 3장 — 같은 방식. 열린 장면만 칠한다(팝업 뿌리는 장면 안에 얹혀 있다) */\n" +
    "    [" + PXS.map((p) => "'" + p + "'").join(', ') + "].forEach((px) => {\n" +
    "      if (document.querySelector('.' + px + '-root')) this.icheonTint(t, mode, '.' + px + '-root', [px + '-style', px + '-light-style', 'secmon-live-style'], 'wemb-secmon-mode', this.SECMON_OPT);\n" +
    "    });\n" +
    "    /* 스마트 빌딩 에너지 관리 화면 2장면 — 같은 방식.");
  s = rep(s, "  DOM_CUSTOM: '", "  DOM_CUSTOM: '" + PXS.slice(0, 6).map((p) => '.' + p + '-root [data-name=\"Header\"] > [data-name=\"Logo/WEMB Studio\"]').join(', ') + ", ' +\n    '");
  return s;
});

/* ── 패널편집(내용 수정) — 모든 글자 ── */
edit('js/studio/dt-edit.js', '.smm-root p', (s) => rep(s, ".bem-root p, ", PXS.map((p) => '.' + p + '-root p').join(', ') + ", .bem-root p, "));

/* ── '원자 변경' 창 ── */
edit('js/studio/atom-swap.js', "'smm'", (s) => rep(s, "'bem', ", PXS.map((p) => "'" + p + "'").join(', ') + ", 'bem', "));

console.log('done ·', changed, '파일');
