/* 스튜디오에 'POSCO KDB CCTV 관제' 템플릿을 붙인다(한 번만 돌리면 된다).

   손대는 곳
     studio.html            — 화면 모듈·라이브·연결 모듈 <script>
     js/launcher/templates.js — 템플릿 카드(TPL_DEFS) · 실제 화면 연결(tpl:'posco') · tplIsLive
     js/launcher/home.js      — '스튜디오 열기' 경로(디지털트윈 판정 · 카드 썸네일 · 장면 키)
     js/core/projects.js      — 화면을 열 때 템플릿 종류 복원
     js/studio/project.js     — 템플릿 상세에서 바로 열기
     js/studio/dt-edit.js     — 패널편집(글자 수정) 대상에 .pkm-root p
     js/templates/image.js    — '색 정하기'(TPLTINT) 대상 · 이 시안의 keep/raster 규칙
     js/main.js               — 새로고침 후 이 시안으로 복원 · 화면 테마 기억

   실행: node src/posco/_gen/patch-studio.js */
'use strict';
const fs = require('fs');
const path = require('path');
const STUDIO = path.join(__dirname, '..', '..', '..');

let touched = 0;
/* 저장소 파일은 대부분 CRLF 다 — 앵커·치환문의 줄바꿈을 그 파일 것으로 맞춘다 */
function edit(rel, jobs) {
  const p = path.join(STUDIO, rel);
  let s = fs.readFileSync(p, 'utf8');
  const before = s;
  const nl = s.indexOf('\r\n') >= 0 ? '\r\n' : '\n';
  const fix = (x) => x.split('\r\n').join('\n').split('\n').join(nl);
  jobs.forEach(([find0, make0, name]) => {
    const find = fix(find0);
    const make = (a) => fix(make0(a));
    if (s.indexOf(find) < 0) {
      if (s.indexOf('posco') >= 0 || s.indexOf('POSCO') >= 0) return;   /* 이미 반영 */
      throw new Error(rel + ' — 앵커를 못 찾았다: ' + (name || find.slice(0, 40)));
    }
    s = s.split(find).join(make(find));
  });
  if (s === before) { console.log('  (변화 없음)', rel); return; }
  fs.writeFileSync(p, s);
  touched++;
  console.log('  patched', rel);
}
const skipIfDone = (rel, mark) => fs.readFileSync(path.join(STUDIO, rel), 'utf8').indexOf(mark) >= 0;

/* ── studio.html — 스크립트 ── */
if (!skipIfDone('studio.html', 'src/posco-main.js')) {
  edit('studio.html', [
    ['    <script src="src/hana-live.js?v=2"></script>', (a) => a + '\r\n\r\n'
      + '    <!-- POSCO KDB CCTV 관제 — Figma dj0SONcO5BySCm7yDdZrNc / 2:18441 Screen/Control Main 을\r\n'
      + '         순수 HTML/CSS DOM 으로 재구축한 것. 글자는 편집 가능한 실제 텍스트,\r\n'
      + '         아이콘·그래픽만 원본에서 내려받은 개별 에셋(src/posco/). 생성기: src/posco/_gen/. -->\r\n'
      + '    <script src="src/posco-main.js?v=1"></script>\r\n'
      + '    <script src="src/posco-live.js?v=1"></script>', 'studio.html 화면 모듈'],
    ['    <script src="js/templates/hana.js?v=1"></script>', (a) => a + '\r\n    <script src="js/templates/posco.js?v=1"></script>', 'studio.html 연결 모듈'],
  ]);
}

/* ── 템플릿 카탈로그 ── */
if (!skipIfDone('js/launcher/templates.js', 'posco')) {
  edit('js/launcher/templates.js', [
    /* 카드 한 장 — 디지털트윈(3D) · 물리보안 · 2025년 1월 */
    ["  const TPL_DEFS = [\n", (a) => a
      + "    { title: 'Digital Twin: POSCO KDB CCTV 관제', area: '물리보안', date: 'January 20, 2025', slides: [\n"
      + "      { img: 'src/templates/posco-main.jpg', label: '메인' }] },\n", 'TPL_DEFS'],
    /* 실제 화면 연결 */
    ["  /* 실제 화면이 붙어 있는 템플릿인지", (a) =>
      "  /* POSCO KDB CCTV 관제 — '스튜디오 열기' 시 Figma(dj0SONcO5BySCm7yDdZrNc) Screen/Control Main 을\n"
      + "     순수 HTML/CSS DOM 으로 재구축한 것(src/posco-main.js)으로 연다. 상세 미리보기도 그 화면을 그대로 캡처한 것이다. */\n"
      + "  (function () {\n"
      + "    const pk = TEMPLATES.find((t) => t.title === 'Digital Twin: POSCO KDB CCTV 관제');\n"
      + "    if (pk) {\n"
      + "      pk.tpl = 'posco';\n"
      + "      pk.img = 'src/templates/posco-main.jpg';\n"
      + "      pk.slides = [{ img: 'src/templates/posco-main.jpg', label: '메인' }];\n"
      + "    }\n"
      + "  })();\n" + a, 'tpl 연결'],
    ["const tplIsLive = (t) => !!t && (t.tpl === 'hanjin'", (a) => "const tplIsLive = (t) => !!t && (t.tpl === 'posco' || t.tpl === 'hanjin'", 'tplIsLive'],
  ]);
}

/* ── 홈(런처) ── */
if (!skipIfDone('js/launcher/home.js', 'posco')) {
  edit('js/launcher/home.js', [
    ["const isDT = t.tpl === 'hanjin'", (a) => "const isDT = t.tpl === 'posco' || t.tpl === 'hanjin'", 'isDT'],
    [": pending.tpl === 'hana' ? 'src/templates/hana-overview-02.jpg' : null;",
      (a) => ": pending.tpl === 'hana' ? 'src/templates/hana-overview-02.jpg'\n      : pending.tpl === 'posco' ? 'src/templates/posco-main.jpg' : null;", '카드 썸네일'],
    ["      if (openProj.tpl === 'hana') localStorage.setItem('wemb-hana-screen', openScene);",
      (a) => a + "\n      if (openProj.tpl === 'posco') localStorage.setItem('wemb-posco-screen', 'main');", '장면 키'],
  ]);
}

/* ── 화면 열기(프로젝트 복원) ── */
if (!skipIfDone('js/core/projects.js', 'posco')) {
  edit('js/core/projects.js', [
    ["    try { if (t.tpl === 'hana') localStorage.setItem('wemb-hana-screen', t.tplScene || 'overview-02'); } catch (e) {}",
      (a) => a + "\n    try { if (t.tpl === 'posco') localStorage.setItem('wemb-posco-screen', t.tplScene || 'main'); } catch (e) {}", 'tplScene'],
    ["if (t.tpl === 'hanjin' || t.tpl === 'hana' || t.tpl === 'skhynix' || t.tpl === 'skhynix-hub') localStorage.setItem('wemb-tpl-dt', t.tpl);",
      (a) => "if (t.tpl === 'posco' || t.tpl === 'hanjin' || t.tpl === 'hana' || t.tpl === 'skhynix' || t.tpl === 'skhynix-hub') localStorage.setItem('wemb-tpl-dt', t.tpl);", 'tpl-dt'],
    ["else if (t.tpl === 'hanjin' || t.tpl === 'hana' || t.tpl === 'skhynix' || t.tpl === 'skhynix-hub') { localStorage.setItem('wemb-tpl-dt', t.tpl); localStorage.removeItem('wemb-tpl-img'); }",
      (a) => "else if (t.tpl === 'posco' || t.tpl === 'hanjin' || t.tpl === 'hana' || t.tpl === 'skhynix' || t.tpl === 'skhynix-hub') { localStorage.setItem('wemb-tpl-dt', t.tpl); localStorage.removeItem('wemb-tpl-img'); }", 'tpl-dt 2'],
  ]);
}

/* ── 템플릿 상세에서 바로 열기 ── */
if (!skipIfDone('js/studio/project.js', 'posco')) {
  edit('js/studio/project.js', [
    ["        if (f.tpl === 'hana') {", (a) =>
      "        if (f.tpl === 'posco') {\n"
      + "          localStorage.setItem('wemb-tpl-dt', 'posco'); localStorage.removeItem('wemb-tpl-img');\n"
      + "          try { localStorage.setItem('wemb-posco-screen', 'main'); } catch (e3) {}\n"
      + "          if (typeof applyPoscoDT === 'function') applyPoscoDT('main');\n"
      + "        }\n"
      + "        else if (f.tpl === 'hana') {", '상세 열기'],
  ]);
}

/* ── 패널편집(글자 수정) 대상 ── */
if (!skipIfDone('js/studio/dt-edit.js', 'pkm-root')) {
  edit('js/studio/dt-edit.js', [
    [".skh-root p, .skv-root p,", (a) => ".skh-root p, .skv-root p, .pkm-root p,", 'DTSEL'],
  ]);
}

/* ── 색 정하기(TPLTINT) ── */
if (!skipIfDone('js/templates/image.js', 'POSCO_OPT')) {
  edit('js/templates/image.js', [
    ["  HANJIN_OPT: {", (a) =>
      "  /* ── POSCO KDB CCTV 관제 시안 ──\n"
      + "     주조색은 브랜드 파랑(#004BFF, 색상각 222°). 색을 그대로 둘 것:\n"
      + "       · 상태·등급 색이 곧 의미인 것(전구·등급 배지·상태 칩)\n"
      + "       · 3D 건물 렌더와 밤하늘 배경(사진이라 색상만 돌리면 어색하다 → 픽셀을 다시 칠한다) */\n"
      + "  POSCO_OPT: {\n"
      + "    seed: '#004BFF', seededKey: 'wemb-posco-seeded', refHue: 222,\n"
      /* 색을 그대로 둘 것은 '색이 곧 의미'인 것만 — 브랜드 파랑으로 그려진 판·알약·아이콘까지 넣었더니
         색을 바꿔도 그 자리만 파랑으로 남아 화면이 두 색으로 갈렸다(실제로 겪고 좁힌 값이다). */
      + "    keep: /(bulb[-\\w]*|status-(critical|major|minor|warning|normal)-bg|btn-event-status-bg[-\\d]*|logo-mark|icon-system-clock)(-lt)?\\.svg(\\?|$)/i,\n"
      + "    raster: /(background[-\\w]*|building-image|body|click)\\.(png|jpg)(\\?|$)/i,\n"
      + "  },\n" + a, 'POSCO_OPT'],
    ["    ['hjc', 'hjg', 'hju'].forEach((px) => {", (a) =>
      "    /* POSCO KDB CCTV 관제 — 같은 방식(시안 원본 색이면 그대로, 색을 바꾸면 팔레트를 따라 칠한다) */\n"
      + "    ['pkm'].forEach((px) => {\n"
      + "      this.icheonTint(t, mode, '.' + px + '-root',\n"
      + "        [px + '-style', px + '-light-style', 'posco-live-style'], 'wemb-posco-mode', this.POSCO_OPT);\n"
      + "    });\n" + a, 'tint apply'],
  ]);
}

/* ── 새로고침 복원 · 화면 테마 기억 ── */
if (!skipIfDone('js/main.js', 'posco')) {
  edit('js/main.js', [
    ["    if (__tdt === 'hana' && typeof applyHanaDT === 'function') {", (a) =>
      "    if (__tdt === 'posco' && typeof applyPoscoDT === 'function') {\n"
      + "      applyPoscoDT(window.__poscoSceneOf ? window.__poscoSceneOf() : localStorage.getItem('wemb-posco-screen'));\n"
      + "    }\n"
      + "    else " + a.trim().replace(/^if/, 'if'), '부팅 복원'],
    ["  if (state.screen === 'dt' && localStorage.getItem('wemb-tpl-dt') === 'hana') {", (a) =>
      "  /* POSCO 시안도 Dark 가 원본 — 고른 밝기(wemb-posco-mode)는 그대로 되살아난다 */\n"
      + "  if (state.screen === 'dt' && localStorage.getItem('wemb-tpl-dt') === 'posco') {\n"
      + "    const want = localStorage.getItem('wemb-posco-mode') === 'light' ? 'light' : 'dark';\n"
      + "    if (state.mode !== want) {\n"
      + "      state.mode = want;\n"
      + "      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));\n"
      + "    }\n"
      + "  }\n" + a, '테마 복원'],
  ]);
}

console.log('done —', touched, '개 파일');
