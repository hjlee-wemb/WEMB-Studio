/* 스튜디오 연결 — 신한카드 정보보호 대시보드 템플릿(tpl 'shinhan', 장면 overview · register · entry · anomaly)을
   LS Electric 과 같은 자리에 등록한다(한 번만 돌린다. 이미 들어가 있으면 건너뛴다).
   카탈로그의 'Dashboard: Shinhan Card Security'(그림 한 장짜리)를 실제 화면 네 장으로 바꾼다.
   실행: node src/shinhan/_gen/patch-studio.js */
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
  if (s.indexOf(find) < 0) throw new Error('앵커 없음: ' + find.slice(0, 80));
  return s.replace(find, () => val);
}
function repAll(s, find, val) {
  if (s.indexOf(find) < 0) throw new Error('앵커 없음: ' + find.slice(0, 80));
  return s.split(find).join(val);
}
const LIVE = [
  '/* 신한카드 정보보호 대시보드 — Figma zXb8i3nonD9Hpu5kdZQs6t. 헤더 메뉴로 장면끼리 오가고,',
  '       이상징후 탐지 표에서 등록 창(sha)을 그 자리에 겹쳐 띄우므로 통째로 */',
].join('\n');

/* ── 화면 모듈 표 ── */
edit('js/core/tpl-modules.js', 'shinhan-overview.js', (s) => rep(s,
  "      { src: 'src/lselectric-live.js?v=9', part: 'base' },\n    ],\n  };",
  "      { src: 'src/lselectric-live.js?v=9', part: 'base' },\n    ],\n" +
  '    ' + LIVE + '\n' +
  '    shinhan: [\n' +
  "      { src: 'src/shinhan-overview.js?v=1', build: ['build_shm'] },\n" +
  "      { src: 'src/shinhan-register.js?v=1', build: ['build_sha', 'build_shm_register'] },\n" +
  "      { src: 'src/shinhan-entry.js?v=1', build: ['build_shi'] },\n" +
  "      { src: 'src/shinhan-anomaly.js?v=1', build: ['build_shd'] },\n" +
  "      { src: 'src/shinhan-live.js?v=1', part: 'base' },\n" +
  '    ],\n  };'));

/* ── studio.html — 연결 스크립트 · 바뀐 파일의 ?v= ── */
edit('studio.html', 'js/templates/shinhan.js', (s) => {
  s = rep(s, '    <script src="js/templates/lselectric.js?v=5"></script>',
    '    <script src="js/templates/lselectric.js?v=5"></script>\n' +
    '    <!-- 신한카드 정보보호 대시보드 — Figma zXb8i3nonD9Hpu5kdZQs6t 의 화면 4장을 순수 HTML/CSS DOM 으로 재구축.\n' +
    '         화면 모듈은 js/core/tpl-modules.js 가 싣는다. 생성기: src/shinhan/_gen/. -->\n' +
    '    <script src="js/templates/shinhan.js?v=1"></script>');
  s = rep(s, 'js/core/tpl-modules.js?v=4', 'js/core/tpl-modules.js?v=5');
  s = rep(s, 'js/templates/image.js?v=13', 'js/templates/image.js?v=14');
  s = rep(s, 'js/studio/dt-edit.js?v=6', 'js/studio/dt-edit.js?v=7');
  s = rep(s, 'js/main.js?v=5', 'js/main.js?v=6');
  s = rep(s, 'js/studio/project.js?v=11', 'js/studio/project.js?v=12');
  s = rep(s, 'js/core/projects.js?v=6', 'js/core/projects.js?v=7');
  s = rep(s, 'js/studio/atom-swap.js?v=10', 'js/studio/atom-swap.js?v=11');
  return s;
});
/* ── index.html · present.html — 홈 · 발표가 쓰는 파일의 ?v= ── */
edit('index.html', 'js/launcher/templates.js?v=9', (s) => {
  s = rep(s, 'js/core/projects.js?v=6', 'js/core/projects.js?v=7');
  s = rep(s, 'js/launcher/templates.js?v=8', 'js/launcher/templates.js?v=9');
  s = rep(s, 'js/launcher/home.js?v=17', 'js/launcher/home.js?v=18');
  return s;
});
edit('present.html', 'js/core/projects.js?v=7', (s) => rep(s, 'js/core/projects.js?v=6', 'js/core/projects.js?v=7'));

/* ── 템플릿 카탈로그 — 그림 한 장 → 실제 화면 네 장 ── */
edit('js/launcher/templates.js', "sh.tpl = 'shinhan'", (s) => {
  s = rep(s, '  /* 실제 화면이 붙어 있는 템플릿인지',
    "  /* 신한카드 정보보호 대시보드 — '스튜디오 열기' 시 Figma(zXb8i3nonD9Hpu5kdZQs6t) 화면 4장을\n" +
    "     순수 HTML/CSS DOM 으로 재구축한 것(src/shinhan-*.js)으로 연다. 상세 미리보기도 그 화면을 그대로 캡처한 것이다. */\n" +
    "  (function () {\n" +
    "    const sh = TEMPLATES.find((t) => t.title === 'Dashboard: Shinhan Card Security');\n" +
    "    if (sh) {\n" +
    "      sh.tpl = 'shinhan';\n" +
    "      sh.img = 'src/templates/shinhan-overview.jpg';\n" +
    "      /* 화면 4장 — 슬라이드 순서가 곧 프로젝트 안의 화면 순서다(home.js 의 tplScene 표와 짝) */\n" +
    "      sh.slides = [\n" +
    "        { img: 'src/templates/shinhan-overview.jpg', label: '보안 현황' },\n" +
    "        { img: 'src/templates/shinhan-register.jpg', label: '이상징후 탐지 등록' },\n" +
    "        { img: 'src/templates/shinhan-entry.jpg', label: '정보보호 현황 입력' },\n" +
    "        { img: 'src/templates/shinhan-anomaly.jpg', label: '이상징후 탐지' },\n" +
    "      ];\n" +
    "    }\n" +
    "  })();\n" +
    '  /* 실제 화면이 붙어 있는 템플릿인지');
  s = rep(s, "const tplIsLive = (t) => !!t && (t.tpl === 'lselectric' ||", "const tplIsLive = (t) => !!t && (t.tpl === 'shinhan' || t.tpl === 'lselectric' ||");
  return s;
});

/* ── 홈 — 템플릿으로 새 프로젝트 만들기 ── */
edit('js/launcher/home.js', "'shinhan'", (s) => {
  s = rep(s, "const isDT = t.tpl === 'lselectric' ||", "const isDT = t.tpl === 'shinhan' || t.tpl === 'lselectric' ||");
  s = rep(s, "      : pending.tpl === 'lselectric' ? 'src/templates/lselectric-statcom.jpg' : null;",
    "      : pending.tpl === 'lselectric' ? 'src/templates/lselectric-statcom.jpg'\n      : pending.tpl === 'shinhan' ? 'src/templates/shinhan-overview.jpg' : null;");
  s = rep(s, "                  : proj.tpl === 'lselectric' ? ['datacenter', 'acb', 'system', 'energy', 'transformer', 'acroom', 'charger', 'cooling', 'alarm'][i]",
    "                  : proj.tpl === 'lselectric' ? ['datacenter', 'acb', 'system', 'energy', 'transformer', 'acroom', 'charger', 'cooling', 'alarm'][i]\n" +
    "                  : proj.tpl === 'shinhan' ? ['register', 'entry', 'anomaly'][i]");
  s = rep(s, "      : openProj.tpl === 'lselectric' ? (openProj.tplScene || 'statcom')",
    "      : openProj.tpl === 'lselectric' ? (openProj.tplScene || 'statcom')\n      : openProj.tpl === 'shinhan' ? (openProj.tplScene || 'overview')");
  s = rep(s, "      if (openProj.tpl === 'lselectric') localStorage.setItem('wemb-lselectric-screen', openScene);",
    "      if (openProj.tpl === 'lselectric') localStorage.setItem('wemb-lselectric-screen', openScene);\n" +
    "      if (openProj.tpl === 'shinhan') localStorage.setItem('wemb-shinhan-screen', openScene);");
  return s;
});

/* ── 작업공간 — 새로 연 템플릿 프로젝트 ── */
edit('js/studio/project.js', "'shinhan'", (s) => rep(s,
  "        else if (f.tpl === 'hana') {",
  "        else if (f.tpl === 'shinhan') {\n" +
  "          localStorage.setItem('wemb-tpl-dt', 'shinhan'); localStorage.removeItem('wemb-tpl-img');\n" +
  "          /* 템플릿 상세에서 고른 장면(보안 현황 · 등록 · 입력 · 이상징후 탐지)을 그대로 연다 */\n" +
  "          const wantSh = (typeof SH_SCREENS !== 'undefined' && SH_SCREENS[f.scene]) ? f.scene\n" +
  "            : (localStorage.getItem('wemb-shinhan-screen') || 'overview');\n" +
  "          try { localStorage.setItem('wemb-shinhan-screen', wantSh); } catch (e3) {}\n" +
  "          if (typeof applyShinhanDT === 'function') applyShinhanDT(wantSh);\n" +
  "        }\n" +
  "        else if (f.tpl === 'hana') {"));

/* ── 저장된 화면 열기 ── */
edit('js/core/projects.js', "'shinhan'", (s) => {
  s = rep(s, "    try { if (t.tpl === 'lselectric') localStorage.setItem('wemb-lselectric-screen', t.tplScene || 'statcom'); } catch (e) {}",
    "    try { if (t.tpl === 'lselectric') localStorage.setItem('wemb-lselectric-screen', t.tplScene || 'statcom'); } catch (e) {}\n" +
    "    try { if (t.tpl === 'shinhan') localStorage.setItem('wemb-shinhan-screen', t.tplScene || 'overview'); } catch (e) {}");
  s = repAll(s, "if (t.tpl === 'lselectric' || t.tpl === 'posco'", "if (t.tpl === 'shinhan' || t.tpl === 'lselectric' || t.tpl === 'posco'");
  return s;
});

/* ── 새로고침 복원 · 밝기 복원 ── */
edit('js/main.js', "'shinhan'", (s) => {
  s = rep(s, "    if (__tdt === 'lselectric' && typeof applyLsElectricDT === 'function') {",
    "    if (__tdt === 'shinhan' && typeof applyShinhanDT === 'function') {\n" +
    "      /* 네 장 중 어느 화면인지는 열려 있는 프로젝트의 tplScene 이 정답 */\n" +
    "      applyShinhanDT(window.__shinhanSceneOf ? window.__shinhanSceneOf() : localStorage.getItem('wemb-shinhan-screen'));\n" +
    "    }\n" +
    "    else if (__tdt === 'lselectric' && typeof applyLsElectricDT === 'function') {");
  s = rep(s, "  if (state.screen === 'dt' && localStorage.getItem('wemb-tpl-dt') === 'hana') {",
    "  /* 신한카드 정보보호 대시보드도 Dark 가 원본 — 고른 밝기(wemb-shinhan-mode)는 그대로 되살아난다 */\n" +
    "  if (state.screen === 'dt' && localStorage.getItem('wemb-tpl-dt') === 'shinhan') {\n" +
    "    const want = localStorage.getItem('wemb-shinhan-mode') === 'light' ? 'light' : 'dark';\n" +
    "    if (state.mode !== want) {\n" +
    "      state.mode = want;\n" +
    "      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));\n" +
    "    }\n" +
    "  }\n" +
    "  if (state.screen === 'dt' && localStorage.getItem('wemb-tpl-dt') === 'hana') {");
  return s;
});

/* ── 색 정하기 · 화면 테마 ── */
edit('js/templates/image.js', 'SHINHAN_OPT', (s) => {
  s = rep(s, '  LSELECTRIC_OPT: {',
    "  /* ── 신한카드 정보보호 대시보드 시안 ──\n" +
    "     주조색은 지표 파랑(#4571FF, 색상각 226°). 색을 그대로 둘 것:\n" +
    "       · 로고(logo-mark · 보안등급 배지의 W 로고 exclude)\n" +
    "       · 바탕 사진(background*.png — 사진이라 색상만 돌리면 어색하다 → 픽셀을 다시 칠한다) */\n" +
    "  SHINHAN_OPT: {\n" +
    "    seed: '#4571FF', seededKey: 'wemb-shinhan-seeded', refHue: 226,\n" +
    "    keep: /(logo-mark[-\\d]*|exclude[-\\d]*)(-lt)?\\.svg(\\?|$)/i,\n" +
    "    raster: /background[-\\d]*\\.(png|jpg)(\\?|$)/i,\n" +
    "  },\n" +
    '  LSELECTRIC_OPT: {');
  s = rep(s, "    ['hjc', 'hjg', 'hju'].forEach((px) => {",
    "    /* 신한카드 정보보호 화면 4장 — 같은 방식. 네 장이 같은 밝기를 공유한다(wemb-shinhan-mode). sha = 등록 창 */\n" +
    "    ['shm', 'sha', 'shi', 'shd'].forEach((px) => {\n" +
    "      this.icheonTint(t, mode, '.' + px + '-root',\n" +
    "        [px + '-style', px + '-light-style', 'shinhan-live-style'], 'wemb-shinhan-mode', this.SHINHAN_OPT);\n" +
    "    });\n" +
    "    ['hjc', 'hjg', 'hju'].forEach((px) => {");
  return s;
});

/* ── 패널편집(내용 수정) — 네 화면의 모든 글자 ── */
edit('js/studio/dt-edit.js', '.shm-root p', (s) => rep(s, ".lsm-root p, .lsd-root p, ", ".lsm-root p, .lsd-root p, .shm-root p, .sha-root p, .shi-root p, .shd-root p, "));

/* ── '원자 변경' 창이 아는 화면 루트 접두어 ── */
edit('js/studio/atom-swap.js', "'shm'", (s) => rep(s, "'lst', 'lsp', 'lsb', 'lsc', 'lsr', 'skh', 'skv', 'skxp']);", "'lst', 'lsp', 'lsb', 'lsc', 'lsr', 'shm', 'sha', 'shi', 'shd', 'skh', 'skv', 'skxp']);"));

console.log('done ·', changed, '파일');
