/* dark.js 를 이 시안(스마트 도면관리, 유리 위젯 + 흰 폼 화면)의 색으로 고친다. 한 번만. */
'use strict';
const fs = require('fs'), path = require('path');
const P = path.join(__dirname, 'dark.js');
let c = fs.readFileSync(P, 'utf8');
if (c.includes('/* DRAWING_DARK */')) { console.log('이미 적용됨'); process.exit(0); }
c = c.replace('무선망 통합관리 — 다크 테마 파생표', '스마트 도면관리 시스템 — 다크 테마 파생표');
const a = c.indexOf('const TABLE = {'), b = c.indexOf('function autoDark');
c = c.slice(0, a) + `/* DRAWING_DARK */
const TABLE = {
  text: {
    '#171d25': '#eceef2', '#202433': '#eceef2', '#232729': '#eceef2', '#32363d': '#e4e6ea', '#414651': '#c9cdd6', black: '#eceef2', '#000': '#eceef2',
    '#3967fd': '#8ba6ff', '#747474': '#a7acb6', '#636363': '#a7acb6', '#666': '#a7acb6', '#767676': '#a7acb6', '#979bae': '#8d929c', '#9196aa': '#8d929c',
    '#d4d4d4': '#5f646e', '#b4b4b4': '#6f747e', '#999': '#7d828c', '#fefdfe': '#a7acb6',
  },
  bg: {
    white: '#17191e', '#fff': '#17191e', '#ffffff': '#17191e', '#f6f8fb': '#0e0f12', '#f0f1f8': '#17191e', '#fcfcfc': '#1d2027', '#f1f1f1': '#23262d', '#f9f9fc': '#17191e', '#f5f7ff': '#23262d', '#f6f8fb80': '#0e0f12',
    'rgba(255,255,255,0.5)': 'rgba(23,25,30,0.62)', 'rgba(255,255,255,0.6)': 'rgba(23,25,30,0.7)', 'rgba(255,255,255,0.7)': 'rgba(23,25,30,0.78)',
    'rgba(254,253,254,0.4)': 'rgba(255,255,255,0.05)', 'rgba(254,253,254,0.6)': 'rgba(255,255,255,0.05)',
  },
  border: {
    '#dddfeb': '#2a2d34', '#e3e3e3': '#2a2d34', '#eeeef2': '#24272e', '#eaebf0': '#2a2d34', '#eaebec': '#2a2d34', '#d9dbe6': '#31343c', '#d5d6dd': '#31343c', '#d5d6de': '#31343c', '#dadfff': '#2d3038', '#ddd': '#2d3038', '#ebeef4': '#24272e', '#d2d2d2': '#3a3d45', '#bfbfbf': '#3a3d45', '#e2e4f2': '#31343c',
    'rgba(255,255,255,0.5)': 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.6)': 'rgba(255,255,255,0.08)',
  },
  shadow: {},
};

` + c.slice(b);
const s0 = c.indexOf('  /* 층(중성 그래파이트)'), s1 = c.indexOf('  return rules;');
c = c.slice(0, s0) + `  /* 층 — 바탕 #0e0f12 < 헤더 띠 #131519 < 패널 #17191e > 값 칸 #111316. 파랑은 강조에만 */
  const GLASS = ['Widget/Notice', 'Widget/Help Desk', 'Panel'].map((n) => R + ' [data-name="' + n + '"] > div:first-child').join(',');
  rules.push(
    R + ' > [data-node-id]{background-color:#0e0f12;}',
    R + ' [data-name="Header"] > [data-name="Background"]{background:#131519!important;box-shadow:inset 0 -1px 0 rgba(255,255,255,.06)!important;}',
    R + ' [data-name="Input"],' + R + ' [data-name="Select"],' + R + ' [data-name="Value Box"],' + R + ' [data-name^="Field/ID"],' + R + ' [data-name^="Field/Password"]{background-color:#111316;}',
    GLASS + '{background-image:none!important;background-color:rgba(23,25,30,.78)!important;}',
    R + ' [data-name="List Item/Post"]{background-color:#1d2027;}',
    R + ' [data-name="Count"]{background-color:#111316!important;}',
    R + ' [data-name="Login Card"] > div:first-child{background-color:rgba(23,25,30,.72)!important;}',
    R + ' [data-name="Search Overlay"] > [data-name="Background"],' + R + ' [data-name="Background"][data-node-id="1:6533"]{background-color:#17191e!important;}',
    R + ' [data-name="Icon Image"] img{filter:brightness(.95);}'
  );
` + c.slice(s1);
fs.writeFileSync(P, c);
console.log('ok');
