/* 스튜디오 연결 — 우리은행 통합 대시보드 템플릿(tpl 'woori', 장면 transaction · performance · event)을
   신한카드와 같은 자리에 등록한다(한 번만 돌린다. 이미 들어가 있으면 건너뛴다).
   카탈로그의 'Dashboard: Woori Bank'(그림 세 장)를 실제 화면 세 장으로 바꾼다.
   실행: node src/woori/_gen/patch-studio.js */
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
  if (s.indexOf(find) < 0) throw new Error('앵커 없음: ' + find.slice(0, 90));
  return s.replace(find, () => val);
}
function repAll(s, find, val) {
  if (s.indexOf(find) < 0) throw new Error('앵커 없음: ' + find.slice(0, 90));
  return s.split(find).join(val);
}
/* ?v=N 을 1 올린다 */
function bump(s, file) {
  const re = new RegExp(file.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&') + '\\?v=(\\d+)');
  if (!re.test(s)) throw new Error('판 번호 없음: ' + file);
  return s.replace(re, (m, n) => file + '?v=' + (+n + 1));
}

/* ── 화면 모듈 표 ── */
edit('js/core/tpl-modules.js', 'woori-transaction.js', (s) => rep(s,
  "      { src: 'src/shinhan-live.js?v=8', part: 'base' },\n    ],\n",
  "      { src: 'src/shinhan-live.js?v=8', part: 'base' },\n    ],\n" +
  '    /* 우리은행 통합 대시보드 — Figma qln8qMsqzCt918dZOQOWOS. 헤더 메뉴로 장면끼리 오간다 */\n' +
  '    woori: [\n' +
  "      { src: 'src/woori-transaction.js?v=1', build: ['build_wrt'] },\n" +
  "      { src: 'src/woori-performance.js?v=1', build: ['build_wrp'] },\n" +
  "      { src: 'src/woori-event.js?v=1', build: ['build_wre'] },\n" +
  "      { src: 'src/woori-live.js?v=1', part: 'base' },\n" +
  '    ],\n'));

/* ── studio.html — 연결 스크립트 · 바뀐 파일의 ?v= ── */
edit('studio.html', 'js/templates/woori.js', (s) => {
  s = rep(s, '    <script src="js/templates/shinhan.js?v=1"></script>',
    '    <script src="js/templates/shinhan.js?v=1"></script>\n' +
    '    <!-- 우리은행 통합 대시보드 — Figma qln8qMsqzCt918dZOQOWOS 의 화면 3장을 순수 HTML/CSS DOM 으로 재구축.\n' +
    '         화면 모듈은 js/core/tpl-modules.js 가 싣는다. 생성기: src/woori/_gen/. -->\n' +
    '    <script src="js/templates/woori.js?v=1"></script>');
  ['js/core/tpl-modules.js', 'js/templates/image.js', 'js/studio/dt-edit.js', 'js/main.js', 'js/studio/project.js', 'js/core/projects.js', 'js/studio/atom-swap.js', 'js/core/meeting.js'].forEach((f) => { s = bump(s, f); });
  return s;
});
/* ── index.html · present.html — 홈 · 발표가 쓰는 파일의 ?v= ── */
const markHome = fs.readFileSync(path.join(ROOT, 'js/launcher/templates.js'), 'utf8').includes("w.tpl = 'woori'");
if (!markHome) {
  edit('index.html', '@@woori-never@@', (s) => {
    ['js/core/projects.js', 'js/core/meeting.js', 'js/launcher/templates.js', 'js/launcher/home.js'].forEach((f) => { s = bump(s, f); });
    return s;
  });
  edit('present.html', '@@woori-never@@', (s) => {
    ['js/core/projects.js', 'js/core/meeting.js'].forEach((f) => { s = bump(s, f); });
    return s;
  });
}

/* ── 템플릿 카탈로그 — 그림 세 장 → 실제 화면 세 장 ── */
edit('js/launcher/templates.js', "w.tpl = 'woori'", (s) => {
  s = rep(s, '  /* 실제 화면이 붙어 있는 템플릿인지',
    "  /* 우리은행 통합 대시보드 — '스튜디오 열기' 시 Figma(qln8qMsqzCt918dZOQOWOS) 화면 3장을\n" +
    "     순수 HTML/CSS DOM 으로 재구축한 것(src/woori-*.js)으로 연다. 상세 미리보기도 그 화면을 그대로 캡처한 것이다. */\n" +
    "  (function () {\n" +
    "    const w = TEMPLATES.find((t) => t.title === 'Dashboard: Woori Bank');\n" +
    "    if (w) {\n" +
    "      w.tpl = 'woori';\n" +
    "      w.img = 'src/templates/woori-transaction.jpg';\n" +
    "      /* 화면 3장 — 슬라이드 순서가 곧 프로젝트 안의 화면 순서다(home.js 의 tplScene 표와 짝) */\n" +
    "      w.slides = [\n" +
    "        { img: 'src/templates/woori-transaction.jpg', label: '거래 현황' },\n" +
    "        { img: 'src/templates/woori-performance.jpg', label: '성능 현황' },\n" +
    "        { img: 'src/templates/woori-event.jpg', label: '이벤트 현황' },\n" +
    "      ];\n" +
    "    }\n" +
    "  })();\n" +
    '  /* 실제 화면이 붙어 있는 템플릿인지');
  s = rep(s, "const tplIsLive = (t) => !!t && (t.tpl === 'shinhan' ||", "const tplIsLive = (t) => !!t && (t.tpl === 'woori' || t.tpl === 'shinhan' ||");
  return s;
});

/* ── 홈 — 템플릿으로 새 프로젝트 만들기 ── */
edit('js/launcher/home.js', "'woori'", (s) => {
  s = rep(s, "const isDT = t.tpl === 'shinhan' ||", "const isDT = t.tpl === 'woori' || t.tpl === 'shinhan' ||");
  s = rep(s, "      : pending.tpl === 'shinhan' ? 'src/templates/shinhan-overview.jpg' : null;",
    "      : pending.tpl === 'shinhan' ? 'src/templates/shinhan-overview.jpg'\n      : pending.tpl === 'woori' ? 'src/templates/woori-transaction.jpg' : null;");
  s = rep(s, "                  : proj.tpl === 'shinhan' ? ['register', 'entry', 'anomaly'][i]",
    "                  : proj.tpl === 'shinhan' ? ['register', 'entry', 'anomaly'][i]\n" +
    "                  : proj.tpl === 'woori' ? ['performance', 'event'][i]");
  s = rep(s, "      : openProj.tpl === 'shinhan' ? (openProj.tplScene || 'overview')",
    "      : openProj.tpl === 'shinhan' ? (openProj.tplScene || 'overview')\n      : openProj.tpl === 'woori' ? (openProj.tplScene || 'transaction')");
  s = rep(s, "      if (openProj.tpl === 'shinhan') localStorage.setItem('wemb-shinhan-screen', openScene);",
    "      if (openProj.tpl === 'shinhan') localStorage.setItem('wemb-shinhan-screen', openScene);\n" +
    "      if (openProj.tpl === 'woori') localStorage.setItem('wemb-woori-screen', openScene);");
  return s;
});

/* ── 작업공간 — 새로 연 템플릿 프로젝트 ── */
edit('js/studio/project.js', "'woori'", (s) => rep(s,
  "        else if (f.tpl === 'shinhan') {",
  "        else if (f.tpl === 'woori') {\n" +
  "          localStorage.setItem('wemb-tpl-dt', 'woori'); localStorage.removeItem('wemb-tpl-img');\n" +
  "          /* 템플릿 상세에서 고른 장면(거래 · 성능 · 이벤트현황)을 그대로 연다 */\n" +
  "          const wantWr = (typeof WR_SCREENS !== 'undefined' && WR_SCREENS[f.scene]) ? f.scene\n" +
  "            : (localStorage.getItem('wemb-woori-screen') || 'transaction');\n" +
  "          try { localStorage.setItem('wemb-woori-screen', wantWr); } catch (e3) {}\n" +
  "          if (typeof applyWooriDT === 'function') applyWooriDT(wantWr);\n" +
  "        }\n" +
  "        else if (f.tpl === 'shinhan') {"));

/* ── 저장된 화면 열기 ── */
edit('js/core/projects.js', "'woori'", (s) => {
  s = rep(s, "    try { if (t.tpl === 'shinhan') localStorage.setItem('wemb-shinhan-screen', t.tplScene || 'overview'); } catch (e) {}",
    "    try { if (t.tpl === 'shinhan') localStorage.setItem('wemb-shinhan-screen', t.tplScene || 'overview'); } catch (e) {}\n" +
    "    try { if (t.tpl === 'woori') localStorage.setItem('wemb-woori-screen', t.tplScene || 'transaction'); } catch (e) {}");
  s = repAll(s, "if (t.tpl === 'shinhan' || t.tpl === 'lselectric'", "if (t.tpl === 'woori' || t.tpl === 'shinhan' || t.tpl === 'lselectric'");
  return s;
});

/* ── 새로고침 복원 · 밝기 복원 ── */
edit('js/main.js', "'woori'", (s) => {
  s = rep(s, "    if (__tdt === 'shinhan' && typeof applyShinhanDT === 'function') {",
    "    if (__tdt === 'woori' && typeof applyWooriDT === 'function') {\n" +
    "      /* 세 장 중 어느 화면인지는 열려 있는 프로젝트의 tplScene 이 정답 */\n" +
    "      applyWooriDT(window.__wooriSceneOf ? window.__wooriSceneOf() : localStorage.getItem('wemb-woori-screen'));\n" +
    "    }\n" +
    "    else if (__tdt === 'shinhan' && typeof applyShinhanDT === 'function') {");
  s = rep(s, "  /* 신한카드 정보보호 대시보드도 Dark 가 원본 — 고른 밝기(wemb-shinhan-mode)는 그대로 되살아난다 */",
    "  /* 우리은행 통합 대시보드도 Dark 가 원본 — 고른 밝기(wemb-woori-mode)는 그대로 되살아난다 */\n" +
    "  if (state.screen === 'dt' && localStorage.getItem('wemb-tpl-dt') === 'woori') {\n" +
    "    const want = localStorage.getItem('wemb-woori-mode') === 'light' ? 'light' : 'dark';\n" +
    "    if (state.mode !== want) {\n" +
    "      state.mode = want;\n" +
    "      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));\n" +
    "    }\n" +
    "  }\n" +
    "  /* 신한카드 정보보호 대시보드도 Dark 가 원본 — 고른 밝기(wemb-shinhan-mode)는 그대로 되살아난다 */");
  return s;
});

/* ── 색 정하기 · 화면 테마 ── */
edit('js/templates/image.js', 'WOORI_OPT', (s) => {
  s = rep(s, '  SHINHAN_OPT: {',
    "  /* ── 우리은행 통합 대시보드 시안 ──\n" +
    "     주조색은 메뉴 · 구성도의 하늘 파랑(#09B6FB, 색상각 197°). 색을 그대로 둘 것:\n" +
    "       · 로고(logo-mark) · 상태 등급 표지(marker-critical · major · minor · warning · normal) — 색이 곧 뜻\n" +
    "       · 바탕 사진 · 3D 장비 렌더 · 구성도 무늬(사진이라 색상만 돌리면 어색하다 → 픽셀을 다시 칠한다) */\n" +
    "  WOORI_OPT: {\n" +
    "    seed: '#09B6FB', seededKey: 'wemb-woori-seeded', refHue: 197,\n" +
    "    keep: /(logo-mark[-\\d]*|marker-(critical|major|minor|warning|normal)[-\\d]*)(-lt)?\\.svg(\\?|$)/i,\n" +
    "    raster: /(background|visual|cube|building)[-\\w]*\\.(png|jpg)(\\?|$)/i,\n" +
    "  },\n" +
    '  SHINHAN_OPT: {');
  s = rep(s, "    ['hjc', 'hjg', 'hju'].forEach((px) => {",
    "    /* 우리은행 화면 3장 — 같은 방식. 세 장이 같은 밝기를 공유한다(wemb-woori-mode) */\n" +
    "    ['wrt', 'wrp', 'wre'].forEach((px) => {\n" +
    "      this.icheonTint(t, mode, '.' + px + '-root',\n" +
    "        [px + '-style', px + '-light-style', 'woori-live-style'], 'wemb-woori-mode', this.WOORI_OPT);\n" +
    "    });\n" +
    "    ['hjc', 'hjg', 'hju'].forEach((px) => {");
  return s;
});

/* ── 패널편집(내용 수정) — 세 화면의 모든 글자 ── */
edit('js/studio/dt-edit.js', '.wrt-root p', (s) => rep(s, ".shm-root p, ", ".wrt-root p, .wrp-root p, .wre-root p, .shm-root p, "));

/* ── '원자 변경' 창이 아는 화면 루트 접두어 ── */
edit('js/studio/atom-swap.js', "'wrt'", (s) => rep(s, "'shm', 'sha', 'shi', 'shd',", "'wrt', 'wrp', 'wre', 'shm', 'sha', 'shi', 'shd',"));

/* ── 회의 모드 — 이 고객사 이름도 가린다 ── */
edit('js/core/meeting.js', 'Woori', (s) => rep(s, "'Gammania', 'Hyundai Capital',", "'Woori Bank', 'Woori', 'WOORI', '우리은행', 'Gammania', 'Hyundai Capital',"));

console.log('done ·', changed, '파일');
