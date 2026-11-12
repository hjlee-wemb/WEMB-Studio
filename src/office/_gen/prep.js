/* 도면관리 생성기(src/drawing/_gen)를 스마트 오피스용으로 옮긴다 — 한 번만 돌린다(이미 적용됨).
   화면 목록은 screens.json, 출력 이름은 office-<장면>, 미리보기는 src/office/<장면>.html. */
'use strict';
const fs = require('fs'), path = require('path');
const F = path.join(__dirname, 'conv.js');
let s = fs.readFileSync(F, 'utf8');
const rep = (a, b, all) => {
  if (typeof a === 'string' ? !s.includes(a) : !a.test(s)) throw new Error('missing: ' + String(a).slice(0, 80));
  s = all ? s.split(a).join(b) : s.replace(a, b);
};

/* 1. 화면 목록 */
const start = s.indexOf('const SCREENS = [');
const end = s.indexOf('];', start) + 2;
s = s.slice(0, start)
  + "const SCREENS = JSON.parse(fs.readFileSync(path.join(GEN, 'screens.json'), 'utf8')).map(([key, node, px, name, page]) => ({ key, node, px, name, out: 'office-' + page, page, meta: ['meta-page.xml'] }));"
  + s.slice(end);

/* 2. 도면관리 전용 손질 제거 */
rep(/let src = normFonts\(fs\.readFileSync\(path\.join\(GEN, 'dc-' \+ S\.key \+ '\.txt'\), 'utf8'\)\)[^;]*;/, "let src = normFonts(fs.readFileSync(path.join(GEN, 'dc-' + S.key + '.txt'), 'utf8'));");
rep(/\n  src = src\.replace\(\/className="\(\[\^"\]\*\\bh-full\\b[^\n]*\n/, '\n');
rep(/const NM = \{ NavItemGnb:[^}]*\};/, 'const NM = {};');
rep("const SWAP = [['Icon/User/Logout', 'imgTypeLogout'], ['Icon/Common/Drop Close', 'imgTypeDropClose'], ['Icon/Common/Drop', 'imgTypeDrop']];", 'const SWAP = [];');
rep("s = 'const imgTypeLogout = \"local:type-logout.svg\";\\nconst imgTypeDropClose = \"local:type-drop-close.svg\";\\nconst imgTypeDrop = \"local:type-drop.svg\";\\n' + s;", '');

/* 3. Pretendard 로 되돌린 글자 중 94% 크기 · -2% 자간이 남은 공백 · 기호 구간을 원래 크기로 */
rep("  s = s.replace(/font-\\[([\"\\'])Inter:/g, 'font-[$1Pretendard:');",
  "  s = s.replace(/font-\\[([\"\\'])Inter:/g, 'font-[$1Pretendard:');\n"
  + "  s = s.replace(/text-\\[([\\d.]+)px\\] tracking-\\[-([\\d.]+)px\\]/g, (q, n, t) => (Math.abs(+n * 0.02 - +t) < 0.01 && Math.abs(Math.round(+n / 0.94) - +n / 0.94) < 0.06 ? 'text-[' + Math.round(+n / 0.94) + 'px]' : q));");

/* 4. 글꼴 — 영문 · 숫자는 시안 그대로 KRAFTON_Font(설치된 PC 에서만), 없으면 Pretendard CDN */
rep("  Pretendard: '\"Pretendard Variable\",\"Pretendard\",\"Malgun Gothic\",-apple-system,system-ui,sans-serif',",
  "  Pretendard: '\"Pretendard Variable\",\"Pretendard\",\"Malgun Gothic\",-apple-system,system-ui,sans-serif',\n"
  + "  KRAFTON_Font: '\"KRAFTON_Font\",\"Pretendard Variable\",\"Pretendard\",\"Malgun Gothic\",system-ui,sans-serif',\n"
  + "  'Barlow Semi Condensed': '\"KRAFTON_Font\",\"Pretendard Variable\",\"Pretendard\",system-ui,sans-serif',");

/* 5. 이름 · 경로 */
rep("'drawing-live.js'", "'office-live.js'", true);
rep("/* 스마트 도면관리 시스템 — '", "/* 스마트 오피스 — '");
rep("'   원본: Figma hfgGjtOuOsX3wdxk33ldyv / node ' + r.S.node + ' (1920x1080, page Light-시안01)',", "'   원본: Figma WUxDt6yorbRlc8V1py86HM / node ' + r.S.node + ' (1920x1080)',");
rep("'   생성기: src/drawing/_gen/conv.js — 손으로 고치지 말 것. */',", "'   생성기: src/office/_gen/conv.js — 손으로 고치지 말 것. */',");
rep("\"  var A = 'src/drawing/';\"", "\"  var A = 'src/office/';\"");
rep("'<script src=\"../drawing-live.js?v=' + liveStamp() + '\"></script>',", "'<script src=\"../office-live.js?v=' + liveStamp() + '\"></script>',");
rep("window.initDrawing && window.initDrawing(", "window.initOffice && window.initOffice(");
rep("fs.writeFileSync(path.join(STUDIO, 'src', 'drawing', r.S.page + '.html'), PREVIEW);", "fs.writeFileSync(path.join(STUDIO, 'src', 'office', r.S.page + '.html'), PREVIEW);");
rep('/* 스마트 도면관리 시스템 — Figma', '/* 스마트 오피스 — Figma');
rep('const ART = path.join(GEN, \'..\');                 /* src/drawing — 내려받은 에셋이 있는 곳 */', 'const ART = path.join(GEN, \'..\');                 /* src/office — 내려받은 에셋이 있는 곳 */');
fs.writeFileSync(F, s);
console.log('conv.js 준비 완료', s.length);
