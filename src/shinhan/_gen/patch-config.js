/* LS Electric 의 conv.js · dl.js 를 복사해 온 뒤 이 시안(신한카드 정보보호 대시보드)에 맞춘다 — 한 번만 돌린다.
   · 화면 목록 · 경로 · 이름(lselectric → shinhan) · 라이브 파일 이름(shinhan-live.js · initShinhan)
   · LS 전용 장치(NODE_CSS · CENTER_STROKE · SCREEN_CSS · Tomorrow 글꼴)를 비우고,
     이 시안의 그라디언트 선(use_figma 로 읽은 값)을 SCREEN_CSS 로 다시 채운다.
   · 겹친 화면(이상징후 탐지 등록 대화상자)은 원본처럼 바탕 위에 Dim(검정 50%) 판을 깔고 그 위에 얹는다.
   실행: node patch-config.js */
'use strict';
const fs = require('fs'), path = require('path');
const GEN = __dirname;
function edit(file, fn) {
  const p = path.join(GEN, file);
  const s0 = fs.readFileSync(p, 'utf8');
  const s1 = fn(s0);
  if (s1 === s0) { console.log(file, '— 바뀐 것 없음'); return; }
  fs.writeFileSync(p, s1);
  console.log(file, '고침');
}
function rep(s, a, b) { if (!s.includes(a)) throw new Error('못 찾음: ' + a.slice(0, 80)); return s.split(a).join(b); }
function between(s, startMark, endMark, body) {
  const a = s.indexOf(startMark); if (a < 0) throw new Error('시작 표지 없음: ' + startMark);
  const b = s.indexOf(endMark, a); if (b < 0) throw new Error('끝 표지 없음: ' + endMark);
  return s.slice(0, a) + body + s.slice(b);
}

/* Figma gradientTransform → CSS linear-gradient (LS patch-popups.js cssGrad 와 같은 계산) */
function cssGrad(tr, W, H, stops) {
  const a = tr[0][0], b = tr[0][1], c = tr[0][2];
  const gx = a / W, gy = b / H;
  let deg = Math.atan2(gx, -gy) * 180 / Math.PI;
  if (deg < 0) deg += 360;
  const U = (x, y) => a * x / W + b * y / H + c;
  const us = [U(0, 0), U(W, 0), U(0, H), U(W, H)];
  const u0 = Math.min.apply(null, us), u1 = Math.max.apply(null, us);
  const pct = (u) => +((u - u0) / (u1 - u0) * 100).toFixed(2) + '%';
  return 'linear-gradient(' + +deg.toFixed(2) + 'deg,' + stops.map((s) => s[1] + ' ' + pct(s[0])).join(',') + ')';
}
const RING = (w, out) => 'content:"";position:absolute;inset:' + (out ? -w : 0) + 'px;border-radius:inherit;padding:' + w + 'px;pointer-events:none;'
  + '-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;';
/* 안쪽 정렬 그라디언트 선 — 테두리는 투명(자리는 그대로), 같은 굵기 링을 ::after 로 */
function gradRing(id, grad, w) {
  const sel = '.{{PX}}-root [data-node-id="' + id + '"]';
  return [sel + '{border-color:transparent!important;}', sel + '::after{' + RING(w, false) + 'background:' + grad + ';}'];
}
const ROW_TR = [[1, 0, 0], [0, 1, 0]];
const ROW = [[0, '#355d8f'], [1, '#4664af']];
const ROW_P = [[0, 'rgba(87,104,217,1)'], [0.697, 'rgba(87,104,217,0)']];
const INPUT = [[0, '#7d86a2'], [0.5, '#9c97e2'], [1, '#5e5f8f']];
const BTN_IN_TR = [[0, -1, 1], [13.4444, 0, -6.2222]];
const BTN_IN = [[0, '#5fadcc'], [1, '#697eff']];
const SEARCH = [[0, '#6cabf3'], [0.5, '#bcbcff'], [1, '#7e91cd']];
const BADGE_TR = [[1.6181, -0.3935, -0.1765], [5.3405, 1.6181, -3.2295]];
const BADGE = [[0.324, '#abb2c5'], [0.5, '#fffbf2'], [0.68, '#93a9d9']];
const POP_TR = [[-6.0966, -5.0861, 6.1861], [-3.2453, -3.2397, 3.793]];
const POP = [[0, '#8fb1ff'], [0.426, '#d5dcff'], [1, '#8fa7ff']];
const rows = (ids, W, H, stops) => [].concat(...ids.map((id) => gradRing(id, cssGrad(ROW_TR, W, H, stops), 1)));
const SCREEN = {
  '2-2': [].concat(
    rows(['15:672', '15:685', '15:698', '15:709', '15:720'], 408, 30, ROW),
    rows(['22:741', '42:10'], 383, 34, ROW),
    rows(['42:20'], 354, 34, ROW_P),
    rows(['21:591', '21:602', '21:613', '21:640', '21:651', '21:662', '22:686'], 318, 30, ROW),
    rows(['42:102', '42:246', '42:256', '42:265'], 260, 40, ROW),
    /* 보안 위협 등급 배지(인스턴스 6:716 안쪽 6:298) — 2px 대각 그라디언트 */
    gradRing('6:298', cssGrad(BADGE_TR, 140, 39, BADGE), 2)),
  '66-1026': [].concat(
    ...['66:1035', '66:1042', '66:1046', '66:1050', '66:1054', '66:1058'].map((id) => gradRing(id, cssGrad(ROW_TR, 341, 43, INPUT), 1)),
    /* 대화상자 바깥 3px OUTSIDE 그라디언트 선 — CSS border(안쪽)를 걷고 상자 밖에 링을 그린다 */
    ['.{{PX}}-root [data-node-id="66:1026"]{border:0!important;}',
     '.{{PX}}-root [data-node-id="66:1026"]::after{' + RING(3, true) + 'border-radius:33px 0 33px 0;background:' + cssGrad(POP_TR, 585, 605, POP) + ';}']),
  '67-1067': [].concat(...['68:2047', '68:2137', '68:2193'].map((id) => gradRing(id, cssGrad(BTN_IN_TR, 110, 30, BTN_IN), 1))),
  '71-2243': gradRing('71:2531', cssGrad(ROW_TR, 100, 30, SEARCH), 1.5),
};

edit('conv.js', (s) => {
  if (s.includes("px: 'shm'")) return s;
  s = rep(s, '/* 한진 SMART 통합관제 — Figma get_design_context(React+Tailwind) → 순수 HTML/CSS 변환기\n   · 화면 3장(Control Main 65:429 · Gate Status 65:943 · Unload Status 65:2243)을 한 번에 만든다.',
    '/* 신한카드 정보보호 대시보드 — Figma get_design_context(React+Tailwind) → 순수 HTML/CSS 변환기\n   · 화면 4장(보안 현황 2:2 · 이상징후 탐지 등록 62:5(대화상자 66:1026) · 정보보호 현황 입력 67:1067 · 이상징후 탐지 71:2243)을 한 번에 만든다.\n   · 한진 → POSCO → LS Electric 생성기를 그대로 이어 받았다(src/lselectric/_gen/README.md).');
  s = rep(s, 'node src/lselectric/_gen/conv.js', 'node src/shinhan/_gen/conv.js');
  s = rep(s, '/* src/lselectric — 내려받은 에셋이 있는 곳 */', '/* src/shinhan — 내려받은 에셋이 있는 곳 */');
  s = between(s, 'const SCREENS = [', '/* ══════════════════ 1. JSX 파서', [
    'const SCREENS = [',
    "  { key: '2-2', node: '2:2', px: 'shm', name: 'Screen/Security Overview', out: 'shinhan-overview', page: 'overview', meta: ['meta-page.xml'] },",
    '  /* 두 번째 화면(62:5) = 보안 현황 + Dim + 이상징후 탐지 등록 대화상자. 바탕은 2:2 와 같은 그림이라 대화상자(66:1026)만 만들고',
    '     바탕은 shm 을 다시 쓴다(LS ACB 와 같은 장치). 자리 = Figma 62:5 에서 대화상자가 놓인 곳(671,241 · 579x599). */',
    "  { key: '66-1026', node: '66:1026', px: 'sha', name: 'Dialog/Anomaly Registration', out: 'shinhan-register', page: 'register', meta: ['meta-page.xml'], layer: 1,",
    "    overlay: { base: 'shm', baseOut: 'shinhan-overview', build: 'build_shm_register', left: 671, top: 241, w: 579, h: 599, dim: 'rgba(0,0,0,0.5)' } },",
    "  { key: '67-1067', node: '67:1067', px: 'shi', name: 'Screen/Security Data Entry', out: 'shinhan-entry', page: 'entry', meta: ['meta-page.xml'] },",
    "  { key: '71-2243', node: '71:2243', px: 'shd', name: 'Screen/Anomaly Detection', out: 'shinhan-anomaly', page: 'anomaly', meta: ['meta-page.xml'] },",
    '];',
    '',
    ''].join('\n'));
  s = rep(s, "  \"@font-face{font-family:'Tomorrow';font-weight:400;font-style:normal;font-display:swap;src:url('{{B}}../fonts/Tomorrow-Regular.ttf') format('truetype');}\",\n", '');
  s = between(s, 'const NODE_CSS = [', '/* Figma 의 stroke 정렬', 'const NODE_CSS = [];\n');
  s = between(s, 'const CENTER_STROKE = {', 'function centerStrokeCss(S) {', 'const CENTER_STROKE = {};\n');
  s = between(s, 'const SCREEN_CSS = {', 'const BG_URL_PROPS', 'const SCREEN_CSS = ' + JSON.stringify(SCREEN, null, 1) + ';\n');
  s = rep(s, "path.join(GEN, '..', '..', 'lselectric-live.js')", "path.join(GEN, '..', '..', 'shinhan-live.js')");
  /* 겹친 화면 — Dim 판을 대화상자 자리 밑에 */
  s = rep(s, "  '.' + S.px + '-root{position:absolute;inset:0;background:transparent;z-index:auto;overflow:visible;}',\n].join('\\n');",
    "  '.' + S.px + '-root{position:absolute;inset:0;background:transparent;z-index:auto;overflow:visible;}',\n"
    + "  S.overlay.dim ? '.' + S.px + '-dim{position:absolute;inset:0;background:' + S.overlay.dim + ';z-index:59;}' : '',\n].join('\\n');");
  s = rep(s, "    '    frame.appendChild(m);',", "    (r.S.overlay.dim ? '    var dm = document.createElement(\\'div\\'); dm.className = \\'' + PX + '-dim sh-dim\\'; dm.setAttribute(\\'data-name\\', \\'Dim\\'); frame.appendChild(dm);\\n' : '') + '    frame.appendChild(m);',");
  s = rep(s, "'/* LS Electric STATCOM — ' + r.S.name,", "'/* 신한카드 정보보호 대시보드 — ' + r.S.name,");
  s = rep(s, "'   원본: Figma KkmCQi05F7eSb3tHO7ZW0Q / node '", "'   원본: Figma zXb8i3nonD9Hpu5kdZQs6t / node '");
  s = rep(s, "'   생성기: src/lselectric/_gen/conv.js — 손으로 고치지 말 것. */',", "'   생성기: src/shinhan/_gen/conv.js — 손으로 고치지 말 것. */',");
  s = rep(s, "\"  var A = 'src/lselectric/';\",", "\"  var A = 'src/shinhan/';\",");
  s = rep(s, "-mount ls-popmount", "-mount sh-popmount");
  s = rep(s, "-root ls-pop", "-root sh-pop");
  s = rep(s, "fs.writeFileSync(path.join(STUDIO, 'src', 'lselectric', r.S.page + '.html'), PREVIEW);", "fs.writeFileSync(path.join(STUDIO, 'src', 'shinhan', r.S.page + '.html'), PREVIEW);");
  s = rep(s, "'<script src=\"../lselectric-live.js?v=' + liveStamp() + '\"></script>',", "'<script src=\"../shinhan-live.js?v=' + liveStamp() + '\"></script>',");
  s = rep(s, "window.initLsElectric && window.initLsElectric(", "window.initShinhan && window.initShinhan(");
  return s;
});

edit('dl.js', (s) => {
  s = rep(s, "const OUT = path.join(__dirname, '..');           /* src/lselectric/ */", "const OUT = path.join(__dirname, '..');           /* src/shinhan/ */");
  s = between(s, 'const SCREENS = {', '/* 인자로 화면 키를', "const SCREENS = {\n  '2-2': 'dc-2-2.txt',\n  '66-1026': 'dc-66-1026.txt',\n  '67-1067': 'dc-67-1067.txt',\n  '71-2243': 'dc-71-2243.txt',\n};\n");
  return s;
});
