/* 스튜디오 연결 — LS Electric STATCOM 템플릿에 단독 팝업 다섯 장(여섯 ~ 열 번째 화면)을 더한다.
   (한 번만 돌린다. 이미 들어가 있으면 건너뛴다.)  실행: node src/lselectric/_gen/patch-studio-popups.js

     transformer  상태정보(118:568)                 .lst-root
     acroom       AC전원실 전압/전류(124:1703)        .lsp-root
     charger      충전기/배터리 운영상태(124:1942)     .lsb-root
     cooling      냉각설비 상태 정보(124:3340)        .lsc-root
     alarm        알림(138:1433)                     .lsr-root

   ACB · 계통 · 에너지 진단과 같은 꼴(STATCOM 화면 위에 팝업)이라 뿌리는 .lsm-root 다. 등록할 자리는
   ① 팝업 모듈 스크립트 ② 화면 목록(js/templates/lselectric.js) ③ 카탈로그 슬라이드 ④ 홈의 장면 표 ⑤ 색 바꾸기 대상
   ⑥ 색 정하기에서 색을 지킬 그림(냉각팬 상태색 · 기준선이 든 Plot).
   dedupe 가 바탕 화면들의 에셋 이름 하나를 바꿔 다시 만들었으므로(card-bg-3-2 → card-bg-8, 같은 그림) 모듈 ?v= 도 모두 올린다. */
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
const POPS = [
  { key: 'transformer', px: 'lst', label: '상태정보', title: 'LS Electric STATCOM — 상태정보(변압기)', node: '118:568' },
  { key: 'acroom', px: 'lsp', label: 'AC전원실 전압/전류', title: 'LS Electric STATCOM — AC전원실 전압/전류', node: '124:1703' },
  { key: 'charger', px: 'lsb', label: '충전기/배터리 운영상태', title: 'LS Electric STATCOM — 충전기/배터리 운영상태', node: '124:1942' },
  { key: 'cooling', px: 'lsc', label: '냉각설비 상태 정보', title: 'LS Electric STATCOM — 냉각설비 상태 정보', node: '124:3340' },
  { key: 'alarm', px: 'lsr', label: '알림', title: 'LS Electric STATCOM — 알림', node: '138:1433' },
];

/* ── studio.html — 팝업 모듈 다섯 개 + 바뀐 파일 ?v= ── */
edit('studio.html', 'src/lselectric-transformer.js', (s) => {
  s = rep(s, '    <script src="src/lselectric-energy.js?v=1"></script>\n',
    '    <script src="src/lselectric-energy.js?v=1"></script>\n'
    + '    <!-- 단독 팝업 다섯 장(Figma popup-3 ~ 7) — 상태정보 · AC전원실 · 충전기/배터리 · 냉각설비 · 알림. STATCOM 위 한가운데에 얹는다 -->\n'
    + POPS.map((p) => '    <script src="src/lselectric-' + p.key + '.js?v=1"></script>\n').join(''));
  ['src/lselectric-statcom.js', 'src/lselectric-datacenter.js', 'src/lselectric-acb.js', 'src/lselectric-system.js', 'src/lselectric-energy.js',
    'src/lselectric-live.js', 'js/templates/lselectric.js', 'js/templates/image.js'].forEach((f) => { s = bump(s, f); });
  return s;
});

/* ── index.html — 홈이 쓰는 파일의 ?v= (카탈로그가 아직 안 고쳐졌을 때만 = 이 패치를 처음 돌릴 때만) ── */
if (fs.readFileSync(path.join(ROOT, 'js/launcher/templates.js'), 'utf8').indexOf('lselectric-transformer.jpg') < 0) {
  edit('index.html', '\u0000never', (s) => bump(bump(s, 'js/launcher/templates.js'), 'js/launcher/home.js'));
} else console.log('  (이미 있음) index.html');

/* ── 화면 목록 ── */
edit('js/templates/lselectric.js', "'transformer': {", (s) => rep(s,
  "    title: 'LS Electric STATCOM — 에너지 진단',\n  },\n",
  "    title: 'LS Electric STATCOM — 에너지 진단',\n  },\n"
  + "  /* 단독 팝업 다섯 장(Figma popup-3 ~ 7) — 화면 프레임 없이 그려진 팝업이라 STATCOM 화면 한가운데에 얹는다(같은 꼴) */\n"
  + POPS.map((p) => "  '" + p.key + "': {\n    px: 'lsm', build: 'build_lsm_" + p.key + "',\n"
    + "    css: ['LSM_CSS', '" + p.px.toUpperCase() + "_CSS'], light: ['LSM_LIGHT_CSS', '" + p.px.toUpperCase() + "_LIGHT_CSS'],\n"
    + "    title: '" + p.title + "',\n  },\n").join('')));

/* ── 템플릿 카탈로그 — 여섯 ~ 열 번째 슬라이드 ── */
edit('js/launcher/templates.js', 'lselectric-transformer.jpg', (s) => rep(s,
  "        { img: 'src/templates/lselectric-energy.jpg', label: '에너지 진단' },",
  "        { img: 'src/templates/lselectric-energy.jpg', label: '에너지 진단' },\n"
  + POPS.map((p) => "        { img: 'src/templates/lselectric-" + p.key + ".jpg', label: '" + p.label + "' },").join('\n')));

/* ── 홈 — 슬라이드 순서 ↔ 장면 이름 표 ── */
edit('js/launcher/home.js', "'energy', 'transformer'", (s) => rep(s,
  "                  : proj.tpl === 'lselectric' ? ['datacenter', 'acb', 'system', 'energy'][i]",
  "                  : proj.tpl === 'lselectric' ? ['datacenter', 'acb', 'system', 'energy', " + POPS.map((p) => "'" + p.key + "'").join(', ') + "][i]"));

/* ── 색 바꾸기(테마 · 색 정하기) — 팝업 뿌리도 같은 팔레트를 따른다 · 상태색이 곧 뜻인 그림은 지킨다 ── */
edit('js/templates/image.js', "'lse', 'lst'", (s) => {
  s = rep(s,
    "    ['lsm', 'lsd', 'lsa', 'lsy', 'lse'].forEach((px) => {      /* lsa·lsy·lse = ACB·계통·에너지 진단 팝업(.lsm-root 안에 겹쳐 있다) */",
    "    ['lsm', 'lsd', 'lsa', 'lsy', 'lse', 'lst', 'lsp', 'lsb', 'lsc', 'lsr'].forEach((px) => {      /* lsa~lsr = STATCOM 위에 겹친 팝업(ACB·계통·에너지·상태정보·AC전원실·충전기·냉각설비·알림) */");
  s = rep(s,
    "    keep: /(marker[-\\d]*|ellipse[-\\d]*|knob[-\\d]*|logo-mark[-\\d]*|battery|plug)(-lt)?\\.svg(\\?|$)|(visual[-\\d]*|thermal-image|chart-image[-\\d]*)\\.png(\\?|$)/i,",
    "    keep: /(marker[-\\w]*|ellipse[-\\d]*|knob[-\\d]*|logo-mark[-\\d]*|battery[-\\d]*|plug|fan-[\\w-]+|plot[-\\d]*)(-lt)?\\.svg(\\?|$)|(visual[-\\d]*|thermal-image|chart-image[-\\d]*)\\.png(\\?|$)/i,\n"
    + "    /* ↑ 냉각팬(fan-*)은 상태색(동작 초록 · 중지 회색 · 과부하 주황 · 고장 빨강)이 곧 뜻 · 상태정보 Plot 은 4단계/3단계 기준선 색이 범례와 짝 ·\n"
    + "         펌프 표지(marker-running/stopped)도 운전 색을 지킨다 */");
  return s;
});

console.log(changed ? '\n고친 파일 ' + changed + '개' : '\n바뀐 것 없음');
console.log('다음: 썸네일 캡처(thumb-<장면>.png) → powershell -File mk-thumb.ps1');
