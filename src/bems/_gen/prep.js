/* 스마트 플랜트 가스 모니터링 생성기(conv.js 등)를 이 시안(데이터센터 통합 모니터링 9화면)에 맞춘다 — 한 번만 돌린다.
   실행: node prep.js */
'use strict';
const fs = require('fs'), path = require('path');
const G = __dirname;
const edit = (f, fn) => { const p = path.join(G, f); const s0 = fs.readFileSync(p, 'utf8'); const s = fn(s0); if (s !== s0) fs.writeFileSync(p, s); console.log(f, s === s0 ? '(그대로)' : '고침'); };
const rep = (s, a, b) => { if (!s.includes(a)) throw new Error('못 찾음: ' + a.slice(0, 90)); return s.split(a).join(b); };

/* 화면 9장 — 전부 1920x1080 단독 프레임(셸 + 팝업이 한 장에 같이 그려져 있다) */
const SCR = [
  ['1-3', 'ovm', 'Screen/Main', 'main'],
  ['96-7914', 'ovn', 'Screen/Main (Menu Open)', 'menu'],
  ['56-3639', 'ovt', 'Screen/Site 3D', 'site'],
  ['42-4769', 'ovw', 'Screen/Forklift Collision Monitoring', 'forklift'],
  ['50-5951', 'ovp', 'Screen/Vibration Sensor Info', 'vibration'],
  ['63-3639', 'ovq', 'Screen/Heat Sensor Info', 'heat'],
  ['22-770', 'ove', 'Screen/Event Status', 'event'],
  ['66-10016', 'ovs', 'Screen/Event History', 'history'],
  ['76-4561', 'ovr', 'Screen/Sensor Status', 'sensor'],
];
const screensSrc = 'const SCREENS = [\n' + SCR.map(([k, px, nm, pg]) =>
  "  { key: '" + k + "', node: '" + k.replace('-', ':') + "', px: '" + px + "', name: '" + nm + "', out: 'datacenter-" + pg + "', page: '" + pg + "', meta: ['meta-" + k + ".xml'] },").join('\n') + '\n];\n\n';

edit('conv.js', (s) => {
  if (s.includes("px: 'ovm'")) return s;
  s = rep(s, '/* 스마트 플랜트 가스 모니터링 — Figma get_design_context(React+Tailwind) → 순수 HTML/CSS 변환기\n   · 화면 2장 + 팝업 3장(가스 메인 위에 얹는다)을 한 번에 만든다.\n   · 한진 → POSCO → LS Electric → 신한카드 → 우리은행 → 공장 전력설비 → STATCOM HMI 생성기를 이어 받았다(src/gasmon/_gen/README.md).',
    '/* 데이터센터 통합 모니터링 — Figma get_design_context(React+Tailwind) → 순수 HTML/CSS 변환기\n   · 1920x1080 화면 9장을 한 번에 만든다.\n   · 한진 → POSCO → LS Electric → 신한카드 → 우리은행 → 공장 전력설비 → STATCOM HMI → 가스 모니터링 생성기를 이어 받았다(src/datacenter/_gen/README.md).');
  s = rep(s, 'node src/gasmon/_gen/conv.js', 'node src/datacenter/_gen/conv.js');
  s = rep(s, '/* src/gasmon — 내려받은 에셋이 있는 곳 */', '/* src/datacenter — 내려받은 에셋이 있는 곳 */');
  const a = s.indexOf('const SCREENS = ['), b = s.indexOf('/* ══════════════════ 1. JSX 파서');
  s = s.slice(0, a) + screensSrc + s.slice(b);
  s = rep(s, "path.join(GEN, '..', '..', 'gasmon-live.js')", "path.join(GEN, '..', '..', 'datacenter-live.js')");
  s = rep(s, "'/* 스마트 플랜트 가스 모니터링 — ' + r.S.name,", "'/* 데이터센터 통합 모니터링 — ' + r.S.name,");
  s = rep(s, "'   원본: Figma CbbEsxxZo3vBcBprsiUhJm / node ' + r.S.node + ' (REM 페이지)',", "'   원본: Figma HzfsAmSQbpqIhAYebEkOWr / node ' + r.S.node + ' (REM 페이지)',");
  s = rep(s, "'   생성기: src/gasmon/_gen/conv.js — 손으로 고치지 말 것. */',", "'   생성기: src/datacenter/_gen/conv.js — 손으로 고치지 말 것. */',");
  s = rep(s, "\"  var A = 'src/gasmon/';\",", "\"  var A = 'src/datacenter/';\",");
  s = rep(s, "fs.writeFileSync(path.join(STUDIO, 'src', 'gasmon', r.S.page + '.html'), PREVIEW);", "fs.writeFileSync(path.join(STUDIO, 'src', 'datacenter', r.S.page + '.html'), PREVIEW);");
  s = rep(s, "'<script src=\"../gasmon-live.js?v=' + liveStamp() + '\"></script>',", "'<script src=\"../datacenter-live.js?v=' + liveStamp() + '\"></script>',");
  s = rep(s, 'window.initGasmon && window.initGasmon(', 'window.initDatacenter && window.initDatacenter(');
  /* 가스 시안 전용 규칙은 뺀다 */
  s = s.replace(/  \/\* 센서현황 탭 — 원본에 `Tab\/GAS#1 \(Active\)`[^\n]*\n  '[^\n]*Tab\/GAS#1[^\n]*\n/, '');
  s = s.replace(/const LIGHT_KEEP = .*;/, 'const LIGHT_KEEP = /^(Map|Map Labels)$/;');
  /* Pretendard GOV(헤더 로고 글자) — 같은 CDN 가족 */
  s = rep(s, "  Pretendard: '\"Pretendard Variable\",\"Pretendard\",\"Malgun Gothic\",-apple-system,system-ui,sans-serif',",
    "  Pretendard: '\"Pretendard Variable\",\"Pretendard\",\"Malgun Gothic\",-apple-system,system-ui,sans-serif',\n  'Pretendard GOV': '\"Pretendard GOV Variable\",\"Pretendard GOV\",\"Pretendard Variable\",\"Pretendard\",system-ui,sans-serif',");
  return s;
});
edit('dl.js', (s) => {
  s = s.replace("/* src/gasmon/ */", '/* src/datacenter/ */');
  s = s.replace(/const SCREENS = Object\.fromEntries\(\[[^\]]*\]/, 'const SCREENS = Object.fromEntries([' + SCR.map((x) => "'" + x[0] + "'").join(', ') + ']');
  return s;
});
edit('leak-check.js', (s) => {
  s = s.replace('node src/gasmon/_gen/leak-check.js', 'node src/datacenter/_gen/leak-check.js');
  s = s.replace(/const F = \{[^}]*\};/, 'const F = {' + SCR.map((x) => ' ' + x[1] + ": '" + x[3] + "'").join(',') + ' };');
  s = s.replace("'gasmon-' + F[px] + '.js'", "'datacenter-' + F[px] + '.js'");
  return s;
});
fs.mkdirSync(path.join(G, '..'), { recursive: true });
console.log('끝');
