/* 스튜디오 연결 — LS Electric STATCOM 템플릿에 세 번째 화면(ACB 진단, 장면 'acb')을 더한다.
   (한 번만 돌린다. 이미 들어가 있으면 건너뛴다.)  실행: node src/lselectric/_gen/patch-studio-acb.js

   장면 'acb' 는 STATCOM 화면 위에 팝업을 얹은 것이라 **뿌리가 .lsm-root 로 같다**.
   그래서 화면 목록(js/templates/lselectric.js)만 알면 되고, 따로 등록할 자리는
   ① 팝업 모듈 스크립트 ② 템플릿 카탈로그 슬라이드 ③ 홈의 장면 표 ④ 색 바꾸기 대상(.lsa-root) 뿐이다. */
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
/* 내용이 바뀐 파일은 ?v= 를 올려야 브라우저가 옛것을 안 문다 */
function bump(s, file) {
  const re = new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\?v=(\\d+)', 'g');
  if (!re.test(s)) throw new Error('?v= 앵커 없음: ' + file);
  return s.replace(re, (m, n) => file + '?v=' + (+n + 1));
}

/* ── studio.html — 팝업 모듈 싣기 + 바뀐 파일 ?v= ── */
edit('studio.html', 'src/lselectric-acb.js', (s) => {
  s = rep(s, '    <script src="src/lselectric-live.js?v=1"></script>',
    '    <!-- ACB 진단(1단) — STATCOM 화면 위에 얹는 팝업(Figma 76:597). build_lsm_acb 가 둘을 합친다. -->\n'
    + '    <script src="src/lselectric-acb.js?v=1"></script>\n'
    + '    <script src="src/lselectric-live.js?v=1"></script>');
  s = bump(s, 'src/lselectric-live.js');
  s = bump(s, 'js/templates/lselectric.js');
  s = bump(s, 'js/templates/image.js');
  return s;
});

/* ── index.html — 홈이 쓰는 파일의 ?v= ── */
edit('index.html', 'js/launcher/templates.js?v=5', (s) => {
  s = bump(s, 'js/launcher/templates.js');
  s = bump(s, 'js/launcher/home.js');
  return s;
});

/* ── 템플릿 카탈로그 — 세 번째 슬라이드 ── */
edit('js/launcher/templates.js', 'lselectric-acb.jpg', (s) => rep(s,
  "        { img: 'src/templates/lselectric-datacenter.jpg', label: 'Data Center' },",
  "        { img: 'src/templates/lselectric-datacenter.jpg', label: 'Data Center' },\n"
  + "        { img: 'src/templates/lselectric-acb.jpg', label: 'ACB 진단' },"));

/* ── 홈 — 슬라이드 순서 ↔ 장면 이름 표 ── */
edit('js/launcher/home.js', "['datacenter', 'acb']", (s) => rep(s,
  "                  : proj.tpl === 'lselectric' ? ['datacenter'][i]",
  "                  : proj.tpl === 'lselectric' ? ['datacenter', 'acb'][i]"));

/* ── 색 바꾸기(테마·색 정하기) — 팝업 뿌리도 같은 팔레트를 따른다 ── */
edit('js/templates/image.js', "['lsm', 'lsd', 'lsa']", (s) => rep(s,
  "    ['lsm', 'lsd'].forEach((px) => {",
  "    ['lsm', 'lsd', 'lsa'].forEach((px) => {      /* lsa = ACB 진단 팝업(.lsm-root 안에 겹쳐 있다) */"));

console.log(changed ? '\n고친 파일 ' + changed + '개' : '\n바뀐 것 없음');
