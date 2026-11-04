/* 우리은행 생성기를 이 시안(공장 전력설비 Screen/Facility Overview 1:2)에 맞춘다 — 한 번만 돌린다.
   · conv.js 설정 · 경로 · 이름 · 인라인 SVG
   · dc: 안내문이 낱말마다 span 으로 쪼개져 온다(Bold + SemiBold 빈칸) → 글자 한 덩어리(Pretendard Bold)로
   실행: node prep.js */
'use strict';
const fs = require('fs'), path = require('path');
const p = path.join(__dirname, 'conv.js');
let s = fs.readFileSync(p, 'utf8');
if (s.includes("px: 'pfo'")) { console.log('이미 고침'); process.exit(0); }
const rep = (a, b) => { if (!s.includes(a)) throw new Error('못 찾음: ' + a.slice(0, 90)); s = s.split(a).join(b); };
const between = (start, end, body) => {
  const a = s.indexOf(start); if (a < 0) throw new Error('시작 표지 없음: ' + start);
  const b = s.indexOf(end, a); if (b < 0) throw new Error('끝 표지 없음: ' + end);
  s = s.slice(0, a) + body + s.slice(b);
};
rep('/* 우리은행 통합 대시보드 — Figma get_design_context(React+Tailwind) → 순수 HTML/CSS 변환기\n   · 화면 3장(거래현황 11:946 · 성능현황 15:2 · 이벤트현황 19:2533)을 한 번에 만든다.\n   · 한진 → POSCO → LS Electric → 신한카드 생성기를 그대로 이어 받았다(src/woori/_gen/README.md).',
  '/* 공장 전력설비 디지털 트윈 — Figma get_design_context(React+Tailwind) → 순수 HTML/CSS 변환기\n   · 화면 1장(Screen/Facility Overview 1:2)을 만든다.\n   · 한진 → POSCO → LS Electric → 신한카드 → 우리은행 생성기를 그대로 이어 받았다(src/plant/_gen/README.md).');
rep('node src/woori/_gen/conv.js', 'node src/plant/_gen/conv.js');
rep('/* src/woori — 내려받은 에셋이 있는 곳 */', '/* src/plant — 내려받은 에셋이 있는 곳 */');
between('const SCREENS = [', '/* ══════════════════ 1. JSX 파서', [
  'const SCREENS = [',
  "  { key: '1-2', node: '1:2', px: 'pfo', name: 'Screen/Facility Overview', out: 'plant-overview', page: 'overview', meta: ['meta-page.xml'] },",
  '];', '', ''].join('\n'));
/* 이끎선은 끝점이 숨쉬어야 해서 인라인으로 */
between('const INLINE_SVG = [', '/* ── 헤더 탭 상태 바로잡기', "const INLINE_SVG = ['leader.svg'];\nconst INLINE_RE = /^$/;\n\n");
rep("const LINE_BASE_W = { '15-2': 552 };", 'const LINE_BASE_W = {};');
s = s.replace(/const DASH_44 = new Set\(\[[^\]]*\]\);/, 'const DASH_44 = new Set();').replace(/const NO_DASH = new Set\(\[[^\]]*\]\);/, 'const NO_DASH = new Set();');
s = s.replace(/const LIGHT_KEEP = .*;/, () => 'const LIGHT_KEEP = /^(Hero Image|Base|Map Image|Logo Mark|Logo Glow|Glow [0-9]+)$/;');
rep("path.join(GEN, '..', '..', 'woori-live.js')", "path.join(GEN, '..', '..', 'plant-live.js')");
rep("'/* 우리은행 통합 대시보드 — ' + r.S.name,", "'/* 공장 전력설비 디지털 트윈 — ' + r.S.name,");
rep("'   원본: Figma qln8qMsqzCt918dZOQOWOS / node '", "'   원본: Figma hHans6kNFlTP98CO1O431o / node '");
rep("'   생성기: src/woori/_gen/conv.js — 손으로 고치지 말 것. */',", "'   생성기: src/plant/_gen/conv.js — 손으로 고치지 말 것. */',");
rep("\"  var A = 'src/woori/';\",", "\"  var A = 'src/plant/';\",");
rep("fs.writeFileSync(path.join(STUDIO, 'src', 'woori', r.S.page + '.html'), PREVIEW);", "fs.writeFileSync(path.join(STUDIO, 'src', 'plant', r.S.page + '.html'), PREVIEW);");
rep("'<script src=\"../woori-live.js?v=' + liveStamp() + '\"></script>',", "'<script src=\"../plant-live.js?v=' + liveStamp() + '\"></script>',");
rep("window.initWoori && window.initWoori(", "window.initPlant && window.initPlant(");
fs.writeFileSync(p, s);
/* dc — 안내문 */
const dp = path.join(__dirname, 'dc-1-2.txt');
let d = fs.readFileSync(dp, 'utf8');
d = d.replace(/(<p className=")([^"]*?font-\['Inter:Semi_Bold'\][^"]*?)("\s+data-node-id="13:943">)[\s\S]*?<\/p>/, (all, a, c, b) =>
  a + c.replace("font-['Inter:Semi_Bold'] font-semibold leading-[0]", "font-['Pretendard:Bold'] leading-[19px]") + b + '\n            전력설비 통합관제 시스템이 정상 동작 중입니다.\n          </p>');
fs.writeFileSync(dp, d);
console.log('conv.js · dc 고침');
