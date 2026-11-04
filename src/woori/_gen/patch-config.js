/* 신한카드 conv.js 를 복사해 온 뒤 이 시안(우리은행 거래 · 성능 · 이벤트현황)에 맞춘다 — 한 번만 돌린다.
   실행: node patch-config.js */
'use strict';
const fs = require('fs'), path = require('path');
const p = path.join(__dirname, 'conv.js');
let s = fs.readFileSync(p, 'utf8');
if (s.includes("px: 'wrt'")) { console.log('이미 고침'); process.exit(0); }
const rep = (a, b) => { if (!s.includes(a)) throw new Error('못 찾음: ' + a.slice(0, 90)); s = s.split(a).join(b); };
const between = (start, end, body) => {
  const a = s.indexOf(start); if (a < 0) throw new Error('시작 표지 없음: ' + start);
  const b = s.indexOf(end, a); if (b < 0) throw new Error('끝 표지 없음: ' + end);
  s = s.slice(0, a) + body + s.slice(b);
};

rep('/* 신한카드 정보보호 대시보드 — Figma get_design_context(React+Tailwind) → 순수 HTML/CSS 변환기\n   · 화면 4장(보안 현황 2:2 · 이상징후 탐지 등록 62:5(대화상자 66:1026) · 정보보호 현황 입력 67:1067 · 이상징후 탐지 71:2243)을 한 번에 만든다.\n   · 한진 → POSCO → LS Electric 생성기를 그대로 이어 받았다(src/lselectric/_gen/README.md).',
  '/* 우리은행 통합 대시보드 — Figma get_design_context(React+Tailwind) → 순수 HTML/CSS 변환기\n   · 화면 3장(거래현황 11:946 · 성능현황 15:2 · 이벤트현황 19:2533)을 한 번에 만든다.\n   · 한진 → POSCO → LS Electric → 신한카드 생성기를 그대로 이어 받았다(src/woori/_gen/README.md).');
rep('node src/shinhan/_gen/conv.js', 'node src/woori/_gen/conv.js');
rep('/* src/shinhan — 내려받은 에셋이 있는 곳 */', '/* src/woori — 내려받은 에셋이 있는 곳 */');
between('const SCREENS = [', '/* ══════════════════ 1. JSX 파서', [
  'const SCREENS = [',
  "  { key: '11-946', node: '11:946', px: 'wrt', name: 'Screen/Transaction Status', out: 'woori-transaction', page: 'transaction', meta: ['meta-page.xml'] },",
  "  { key: '15-2', node: '15:2', px: 'wrp', name: 'Screen/Performance Status', out: 'woori-performance', page: 'performance', meta: ['meta-page.xml'] },",
  "  { key: '19-2533', node: '19:2533', px: 'wre', name: 'Screen/Event Status', out: 'woori-event', page: 'event', meta: ['meta-page.xml'] },",
  '];',
  '',
  ''].join('\n'));
/* 숫자 글꼴 Tomorrow — 원본 그대로(앱에 들어 있는 파일). 나머지 글자는 Pretendard CDN */
rep("  \"@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css');\",\n",
  "  \"@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css');\",\n" +
  "  \"@font-face{font-family:'Tomorrow';font-weight:400;font-style:normal;font-display:swap;src:url('{{B}}../fonts/Tomorrow-Regular.ttf') format('truetype');}\",\n");
/* 이 시안 차트 그림은 통째로 내보낸 SVG — 인라인으로 심어야 시리즈마다 움직이고 색 · 라이트가 닿는다 */
between('const INLINE_SVG = [', '/* ── 헤더 탭 상태 바로잡기', "const INLINE_SVG = ['plot.svg', 'data.svg', 'data-1.svg', 'data-2.svg', 'arc.svg'];\nconst INLINE_RE = /^line-[\\w-]+\\.svg$/;\n\n");
rep('if (INLINE_SVG.indexOf(f) >= 0) {', 'if (INLINE_SVG.indexOf(f) >= 0 || INLINE_RE.test(f)) {');
/* 묶음 레이어 이름(Data/Today (Bundang) · Line/Today …)을 data-name 으로 살린다 — 라이브가 이 이름으로 시리즈를 찾는다 */
rep("    }).split('\\n').filter((l) => l.trim()).map((l) => pad + '  ' + l.trim()).join('\\n'));",
  "    }).replace(/<g id=\"([^\"]+)\"/g, (all, v) => '<g id=\"' + escAttr(uniqueId(slug(v))) + '\" data-name=\"' + escAttr(v) + '\"')\n    .split('\\n').filter((l) => l.trim()).map((l) => pad + '  ' + l.trim()).join('\\n'));");
/* 도형 id 를 data-name 으로도 — Line 1 · Segment/MCA 처럼 이름이 있는 도형 */
rep("      return '<' + tag + at.replace(/\\sid=\"[^\"]*\"/, '') + ' id=\"' + escAttr(uniqueId(nm)) + '\" class=\"' + uc2 + '\"/>';",
  "      return '<' + tag + at.replace(/\\sid=\"[^\"]*\"/, '') + ' id=\"' + escAttr(uniqueId(nm)) + '\" class=\"' + uc2 + '\"' + (idm ? ' data-name=\"' + escAttr(idm[1]) + '\"' : '') + '/>';");
/* 라이트에서도 원본 색을 지키는 오브젝트 */
rep("const LIGHT_KEEP = /^(Day Badge|Icon Badge|Category Badge|Badge\\/Threat Level|Visual|Highlight|Fill|Title Bar|Close Button|Button\\/Register)$/;",
  "const LIGHT_KEEP = /^(Visual|Glow|Logo Mark|Logo Image|Cube \\d.*|Building \\d.*)$/;");
between('const SCREEN_CSS = {', 'const BG_URL_PROPS', 'const SCREEN_CSS = {};\n');
rep("path.join(GEN, '..', '..', 'shinhan-live.js')", "path.join(GEN, '..', '..', 'woori-live.js')");
rep("'/* 신한카드 정보보호 대시보드 — ' + r.S.name,", "'/* 우리은행 통합 대시보드 — ' + r.S.name,");
rep("'   원본: Figma zXb8i3nonD9Hpu5kdZQs6t / node '", "'   원본: Figma qln8qMsqzCt918dZOQOWOS / node '");
rep("'   생성기: src/shinhan/_gen/conv.js — 손으로 고치지 말 것. */',", "'   생성기: src/woori/_gen/conv.js — 손으로 고치지 말 것. */',");
rep("\"  var A = 'src/shinhan/';\",", "\"  var A = 'src/woori/';\",");
rep("fs.writeFileSync(path.join(STUDIO, 'src', 'shinhan', r.S.page + '.html'), PREVIEW);", "fs.writeFileSync(path.join(STUDIO, 'src', 'woori', r.S.page + '.html'), PREVIEW);");
rep("'<script src=\"../shinhan-live.js?v=' + liveStamp() + '\"></script>',", "'<script src=\"../woori-live.js?v=' + liveStamp() + '\"></script>',");
rep("window.initShinhan && window.initShinhan(", "window.initWoori && window.initWoori(");
fs.writeFileSync(p, s);
console.log('conv.js 고침');
