/* 스튜디오 연결 — LS Electric STATCOM 템플릿에 네 · 다섯 번째 화면(계통 진단 'system' · 에너지 진단 'energy')을 더한다.
   (한 번만 돌린다. 이미 들어가 있으면 건너뛴다.)  실행: node src/lselectric/_gen/patch-studio-sys-energy.js

   ACB 진단과 같은 꼴(STATCOM 화면 위에 팝업)이라 뿌리는 .lsm-root 로 같다. 등록할 자리는
   ① 팝업 모듈 스크립트 ② 화면 목록(js/templates/lselectric.js) ③ 카탈로그 슬라이드 ④ 홈의 장면 표 ⑤ 색 바꾸기 대상.
   생성물이 모두 다시 만들어졌으므로(겹친 팝업 공통 클래스 ls-pop) 모듈 ?v= 도 함께 올린다. */
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
function bump(s, file) {
  const re = new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\?v=(\\d+)', 'g');
  if (!re.test(s)) throw new Error('?v= 앵커 없음: ' + file);
  return s.replace(re, (m, n) => file + '?v=' + (+n + 1));
}

/* ── studio.html — 팝업 모듈 두 개 + 바뀐 파일 ?v= ── */
edit('studio.html', 'src/lselectric-system.js', (s) => {
  s = rep(s, '    <script src="src/lselectric-acb.js?v=1"></script>\n',
    '    <script src="src/lselectric-acb.js?v=1"></script>\n'
    + '    <!-- 계통 진단(89:2000 · 팝업 76:875) · 에너지 진단(89:2927 · 팝업 94:5015) — 같은 꼴로 STATCOM 위에 얹는다 -->\n'
    + '    <script src="src/lselectric-system.js?v=1"></script>\n'
    + '    <script src="src/lselectric-energy.js?v=1"></script>\n');
  ['src/lselectric-statcom.js', 'src/lselectric-datacenter.js', 'src/lselectric-acb.js', 'src/lselectric-live.js',
    'js/templates/lselectric.js', 'js/templates/image.js'].forEach((f) => { s = bump(s, f); });
  return s;
});

/* ── index.html — 홈이 쓰는 파일의 ?v= ── */
edit('index.html', 'js/launcher/templates.js?v=7', (s) => {
  s = bump(s, 'js/launcher/templates.js');
  s = bump(s, 'js/launcher/home.js');
  return s;
});

/* ── 화면 목록 ── */
edit('js/templates/lselectric.js', "'system': {", (s) => {
  s = rep(s, "    title: 'LS Electric STATCOM — ACB 진단(1단)',\n  },\n",
    "    title: 'LS Electric STATCOM — ACB 진단(1단)',\n  },\n"
    + "  /* 계통 진단(Figma 89:2000 · 팝업 76:875) · 에너지 진단(89:2927 · 팝업 94:5015) — ACB 와 같은 꼴(STATCOM 위에 팝업) */\n"
    + "  'system': {\n    px: 'lsm', build: 'build_lsm_system',\n"
    + "    css: ['LSM_CSS', 'LSY_CSS'], light: ['LSM_LIGHT_CSS', 'LSY_LIGHT_CSS'],\n"
    + "    title: 'LS Electric STATCOM — 계통 진단',\n  },\n"
    + "  'energy': {\n    px: 'lsm', build: 'build_lsm_energy',\n"
    + "    css: ['LSM_CSS', 'LSE_CSS'], light: ['LSM_LIGHT_CSS', 'LSE_LIGHT_CSS'],\n"
    + "    title: 'LS Electric STATCOM — 에너지 진단',\n  },\n");
  /* 겹친 팝업은 종류와 상관없이 공통 클래스(.ls-pop)로 잡는다 */
  s = rep(s, "  scr.querySelectorAll('.lsa-root').forEach(function (e) { e.dataset.theme = scr.dataset.theme; });",
    "  scr.querySelectorAll('.ls-pop').forEach(function (e) { e.dataset.theme = scr.dataset.theme; });");
  return s;
});

/* ── 템플릿 카탈로그 — 네 · 다섯 번째 슬라이드 ── */
edit('js/launcher/templates.js', 'lselectric-system.jpg', (s) => rep(s,
  "        { img: 'src/templates/lselectric-acb.jpg', label: 'ACB 진단' },",
  "        { img: 'src/templates/lselectric-acb.jpg', label: 'ACB 진단' },\n"
  + "        { img: 'src/templates/lselectric-system.jpg', label: '계통 진단' },\n"
  + "        { img: 'src/templates/lselectric-energy.jpg', label: '에너지 진단' },"));

/* ── 홈 — 슬라이드 순서 ↔ 장면 이름 표 ── */
edit('js/launcher/home.js', "['datacenter', 'acb', 'system', 'energy']", (s) => rep(s,
  "                  : proj.tpl === 'lselectric' ? ['datacenter', 'acb'][i]",
  "                  : proj.tpl === 'lselectric' ? ['datacenter', 'acb', 'system', 'energy'][i]"));

/* ── 색 바꾸기(테마 · 색 정하기) — 팝업 뿌리도 같은 팔레트를 따른다 ── */
edit('js/templates/image.js', "['lsm', 'lsd', 'lsa', 'lsy', 'lse']", (s) => rep(s,
  "    ['lsm', 'lsd', 'lsa'].forEach((px) => {      /* lsa = ACB 진단 팝업(.lsm-root 안에 겹쳐 있다) */",
  "    ['lsm', 'lsd', 'lsa', 'lsy', 'lse'].forEach((px) => {      /* lsa·lsy·lse = ACB·계통·에너지 진단 팝업(.lsm-root 안에 겹쳐 있다) */"));

console.log(changed ? '\n고친 파일 ' + changed + '개' : '\n바뀐 것 없음');
