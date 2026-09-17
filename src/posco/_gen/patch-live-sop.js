/* mk-live.js 에 SOP 장면(스텝 플레이어)과 패널 이동을 잇는다 — 한 번만.
   본체 코드는 sop-css.part.js · sop-live.part.js 에 있다(템플릿 문자열 밖이라 정규식·역따옴표 제약이 없다).
   실행: node src/posco/_gen/patch-live-sop.js && node src/posco/_gen/mk-live.js */
'use strict';
const fs = require('fs');
const path = require('path');
const P = path.join(__dirname, 'mk-live.js');
let s = fs.readFileSync(P, 'utf8').split('\r\n').join('\n');
if (s.indexOf('sop-live.part.js') >= 0) { console.log('이미 고쳤다'); process.exit(0); }

const R = [
  /* ① 스타일 — SOP 묶음을 같은 시트(posco-live-style)에 싣는다: '색 정하기'가 그 시트를 칠한다 */
  ["  ].join('\\\\n');\n\n  function injectStyle() {",
   "  ].concat(SOP_CSS).join('\\\\n');\n\n  function injectStyle() {"],
  /* ② 반응형 덩어리 — SOP 화면은 배경 화면 전체가 Figma 그룹(Base Screen)이라 통째로 한 덩어리가 되어
        이벤트 현황이 바닥에, 자산정보현황이 오른쪽에 붙지 못했다 → 그 그룹만 풀어서 센다 */
  ["  s = s.split(\"    if (!st.anchors) st.anchors = measureAnchors(root);\")",
   "  s = s.split(\"        if (cs.display === 'contents') { walk(c, gid == null ? groups.length : gid); continue; }\")\n"
   + "    .join(\"        if (cs.display === 'contents') { walk(c, gid == null && c.getAttribute('data-name') !== 'Base Screen' ? groups.length : gid); continue; }   /* SOP: 배경 화면 그룹은 풀어서 센다 */\");\n"
   + "  s = s.split(\"    if (!st.anchors) st.anchors = measureAnchors(root);\")"],
  /* ③ 앵커 — SOP 대화상자는 오른쪽 세로 가운데(Background 규칙보다 먼저 걸리게 맨 앞에) */
  ["  var ANCHOR = [\n",
   "  var ANCHOR = [\n    { m: '[data-name=\"Dialog/SOP\"] > *', dx: 1, dy: 0.5 },          /* SOP 대화상자 — 오른쪽, 세로 가운데 */\n"],
  /* ④ 장면 이름 · 미리보기 파일 */
  ["    if (n.indexOf('Ack') >= 0) return 'ack';",
   "    if (n.indexOf('SOP') >= 0) return 'sop';\n    if (n.indexOf('Ack') >= 0) return 'ack';"],
  ["detail: 'detail.html' };", "detail: 'detail.html', sop: 'sop.html' };"],
  ["detail: '단층' };", "detail: '단층', sop: 'SOP' };"],
  /* ⑤ 헤더 SOP 메뉴 → SOP 장면 */
  ["    all(root, '[data-name=\"Building Label\"]').forEach(function (el) { bind(el, 'floors'); });\n",
   "    all(root, '[data-name=\"Building Label\"]').forEach(function (el) { bind(el, 'floors'); });\n"
   + "    /* 헤더 SOP 메뉴 → SOP 대응 절차 화면(STEP 1~3) */\n"
   + "    all(root, '[data-name^=\"Menu Item/\"]').forEach(function (el) { if ((el.textContent || '').trim() === 'SOP') bind(el, 'sop'); });\n"],
  /* ⑥ 살리기 순서 */
  ["    try { installWideFit(root, st); } catch (e) { }   /* 판 안쪽 1920 고정 풀기 — 맞추기(fit) 뒤에 */\n",
   "    try { installWideFit(root, st); } catch (e) { }   /* 판 안쪽 1920 고정 풀기 — 맞추기(fit) 뒤에 */\n"
   + "    try { installSop(root, st); } catch (e) { }       /* SOP STEP 1~3 겹치기 · 컨트롤 바 — 호버 표시(markHot) 전에 */\n"],
  ["    try { installFeed(root, st); } catch (e) { }\n    return st;",
   "    try { installFeed(root, st); } catch (e) { }\n    try { installPanelMove(root, st); } catch (e) { }   /* 패널편집 — 판 끌어 옮기기 */\n    return st;"],
  /* ⑦ 조립 */
  ["const OUT = HEAD + CSS + '\\n' + borrowed + '\\n\\n' + STRETCH + '\\n' + SCREEN + '})();\\n';",
   "const SOP_CSS_PART = fs.readFileSync(path.join(GEN, 'sop-css.part.js'), 'utf8');\n"
   + "const SOP_LIVE_PART = fs.readFileSync(path.join(GEN, 'sop-live.part.js'), 'utf8');   /* SOP 스텝 플레이어 · 패널 이동 */\n"
   + "const OUT = HEAD + SOP_CSS_PART + CSS + '\\n' + borrowed + '\\n\\n' + STRETCH + '\\n' + SCREEN + SOP_LIVE_PART + '})();\\n';"],
];
for (const [a, b] of R) {
  if (s.indexOf(a) < 0) { console.error('앵커를 못 찾았다:\n' + a.slice(0, 120)); process.exit(1); }
  s = s.split(a).join(b);
}
fs.writeFileSync(P, s);
console.log('patched mk-live.js');
