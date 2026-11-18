/* dark.js(무선망에서 가져옴)의 대응표 · 층 규칙을 발전소 방재 시안의 색으로 바꾼다 — 한 번만. 실행: node patch-dark.js */
'use strict';
const fs = require('fs'), path = require('path');
const P = path.join(__dirname, 'dark.js');
let s = fs.readFileSync(P, 'utf8');
const a = s.indexOf('const TABLE = {'), b = s.indexOf('function autoDark(');
const TABLE = `const TABLE = {
  /* 글자 — 본문 남회색(#303a46)은 밝은 회백, 보조(#7086a0)는 차분한 회청, 브랜드 파랑 글자는 밝은 파랑 */
  text: {
    '#303a46': '#e6ebf2', '#7086a0': '#9aa8bb', '#2d2e38': '#eceef2', '#2f3042': '#dfe3ea', '#2a74f4': '#76a3ff', '#363743': '#e2e5ea',
    '#4a525d': '#c3cad4', '#676767': '#a3a8b0', '#32333b': '#e6e8ec', '#676b70': '#a3a8b0', '#5b6877': '#a9b3c0', '#616972': '#a6adb7',
    'rgba(112,134,160,0.5)': 'rgba(160,174,192,0.55)', '#1359da': '#7ea8ff', '#005bc3': '#7aa7ff', '#0058a7': '#7aa7ff', '#2b7fca': '#7fb4ec',
    '#334786': '#dfe6f5', '#b3b1b1': '#7d828a', '#000': '#eceef2', '#000000': '#eceef2', black: '#eceef2', 'rgba(0,0,0,0.8)': 'rgba(236,238,242,0.85)',
  },
  /* 면 — 흰 판은 그래파이트 패널(#171a20), 옅은 하늘 · 회색 칸은 한 단계 밝은 칸, 반투명 흰 유리는 반투명 그래파이트 */
  bg: {
    white: '#171a20', '#fff': '#171a20', '#ffffff': '#171a20', 'rgb(255,255,255)': '#171a20', 'rgba(255,255,255,1)': '#171a20',
    '#f3f9fb': '#1e222a', '#f4f3f3': '#20232a', 'rgb(244,243,243)': '#20232a', '#f1f9ff': '#1b2230', 'rgba(246,253,255,1)': '#191d24',
    '#f4fafe': '#1a1e25', 'rgb(244,250,254)': '#1a1e25', '#f1f1f1': '#23262d', '#f3f5f8': '#1f2228', '#d5f4ff': '#1b2a36',
    '#ffefef': '#3a1d21', '#ffe3e3': '#3d2125', 'rgb(255,199,199)': '#4a2428', '#ffc7c7': '#4a2428',
    '#d9d9d9': '#2a2e36', '#e5e5e5': '#2a2e36', '#dbdbdb': '#2a2e36', '#d8f3f9': '#10161d',
    'rgba(236,244,255,0.9)': 'rgba(24,28,36,0.9)', 'rgba(255,255,255,0.95)': 'rgba(23,26,32,0.95)', 'rgba(255,255,255,0.85)': 'rgba(23,26,32,0.86)',
    'rgba(255,255,255,0.8)': 'rgba(23,26,32,0.82)', 'rgba(255,255,255,0.7)': 'rgba(23,26,32,0.74)', 'rgba(255,255,255,0.5)': 'rgba(23,26,32,0.6)',
    'rgba(255,255,255,0.45)': 'rgba(23,26,32,0.55)', 'rgba(255,255,255,0.3)': 'rgba(23,26,32,0.45)', 'rgba(255,255,255,0.15)': 'rgba(255,255,255,0.04)',
    'rgba(228,228,228,0.3)': 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)': 'rgba(255,255,255,0.01)',
  },
  border: {
    '#d6dde6': '#2b3039', '#d7e1f0': '#2c323d', '#ccc': '#3a3f48', '#cccccc': '#3a3f48', '#9aabc1': '#4d5868', '#bdddff': '#2c4466', '#bcccd1': '#34404a',
    'rgba(255,255,255,0.8)': 'rgba(255,255,255,0.08)', '#e6ecf3': '#2a2f37', '#e6e6e6': '#2a2f37', 'rgba(215,225,240,0.5)': 'rgba(255,255,255,0.08)',
    '#bfc8db': '#3b4250', 'rgba(255,255,255,0.5)': 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.2)': 'rgba(255,255,255,0.06)', '#bcd4ff': '#2f4a78',
    white: '#2a2f37', '#fff': '#2a2f37', '#ffffff': '#2a2f37',
  },
  shadow: { 'rgba(215,225,240,0.8)': 'rgba(0,0,0,0.42)', 'rgba(255,255,255,0.8)': 'rgba(255,255,255,0.04)', '#97bdee': 'rgba(0,0,0,0.35)' },
};

`;
s = s.slice(0, a) + TABLE + s.slice(b);
s = s.replace(/const NAVY = 220, NS = 0\.05;/, 'const NAVY = 218, NS = 0.06;');
/* 층 규칙 — 무선망 패널 이름 → 이 시안의 판 */
const c = s.indexOf('  const PANEL = ['), d = s.indexOf('  return rules;\n}', c);
const EXTRA = `  const glass = 'background:rgba(20,23,29,.84)!important;box-shadow:0 0 0 1px rgba(255,255,255,.07),0 12px 28px rgba(0,0,0,.35)!important;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);';
  rules.push(
    /* 화면 바탕(흰 → 하늘 그라디언트) → 밤하늘 남회색 */
    R + ' > [data-node-id] > div[aria-hidden] > div{background:linear-gradient(180deg,#0d1117 0%,#111821 100%)!important;}',
    R + ' > [data-node-id] > div[aria-hidden] > img{opacity:.04!important;filter:invert(1);}',
    /* 3D 장면 · 건물 그림은 다크 바탕에서 눈부시지 않게 */
    R + ' [data-name="Stage/3D Scene"] img{filter:brightness(.74) saturate(.92) contrast(1.04);}',
    R + ' [data-name="Stage/Building Image"] img{filter:brightness(.62) contrast(1.08);}',
    R + ' [data-name="Hero"] [data-name="Background"] img{filter:brightness(.72) saturate(.9);}',
    /* 유리 판 — 레일 · 필터 · 오른쪽 위젯 · 이벤트 로그 */
    R + ' [data-name="Side Rail"],' + R + ' [data-name="Filter Panel"] [data-name="Rectangle 4"]{' + glass + '}',
    R + ' > [data-node-id] > [data-name="Header"] > [data-name="Background"],' + R + ' > [data-node-id] > [data-name="Header"] > [data-name="Header Background"]{background:#12151b!important;box-shadow:inset 0 -1px 0 rgba(255,255,255,.07)!important;}',
    /* 차트 SVG(DOM 으로 심은 것) — 흰 판 · 옅은 격자 */
    R + ' svg [fill="#FCFCFC"],' + R + ' svg [fill="#fcfcfc"],' + R + ' svg [fill="white"],' + R + ' svg [fill="#F9F9F9"]{fill:#15181e;}',
    R + ' svg [stroke="#F1F1F1"],' + R + ' svg [stroke="#f1f1f1"],' + R + ' svg [fill="#F1F1F1"]{stroke:#2a2e36;}',
    R + ' svg path[fill="#F1F1F1"]{fill:#2a2e36;}',
    /* 칩 · 표 줄 하이라이트 */
    R + ' [data-name="Event Log"] [data-name^="Row/"]:hover,' + R + ' [data-name="Event Log"] [data-name="grid-row"]:hover{filter:brightness(1.15);}',
    R + ' [data-name="Tooltip Group"] [data-name^="Tooltip/"] p{color:#e6ebf2!important;}'
  );
`;
s = s.slice(0, c) + EXTRA + s.slice(d);
fs.writeFileSync(P, s);
console.log('dark.js patched', s.length);
