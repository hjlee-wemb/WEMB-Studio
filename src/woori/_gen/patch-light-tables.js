/* 라이트 색표를 이 시안 색으로 채운다 — 자동 변환에 맡기면 메뉴 · 칩 · 드롭다운이 어두운 채로 남고 글자가 묻혔다.
   글자는 밝은 판 위 4.5:1 이상, 판은 흰색 계열, 선은 옅은 하늘 회색. 활성 메뉴 · 버튼 · 상태색은 원본 그대로.
   실행: node patch-light-tables.js */
'use strict';
const fs = require('fs'), path = require('path');
const p = path.join(__dirname, 'light.js');
let s = fs.readFileSync(p, 'utf8');
if (s.includes('우리은행 시안 글자')) { console.log('이미 고침'); process.exit(0); }
const rep = (a, b) => { if (!s.includes(a)) throw new Error('못 찾음: ' + a.slice(0, 80)); s = s.replace(a, () => b); };

rep(`const TEXT = {\n  '#fff': '#10231d', '#ffffff': '#10231d',`, `const TEXT = {
  /* 우리은행 시안 글자 */
  '#bdcce0': '#2c4a63', '#d6e7fd': '#1c3c58', '#c989ff': '#7a35c9', '#00f0ff': '#00779e', '#8ea6b3': '#4f6b7c', '#00ffd2': '#00806b',
  '#feffff': '#24455f', '#e2e3e5': '#4a6072', '#c7ecf4': '#1c4d6b', '#29e2ff': '#00779e', '#ccc': '#24455f', '#b2c7e3': '#36536b',
  '#8cddff': '#0a6a90', '#02d6b1': '#007a66', '#f8f8f8': '#10324d', 'rgba(255,255,255,0.9)': '#10324d',
  '#fff': '#10324d', '#ffffff': '#10324d',`);
rep(`const BG = {\n`, `const BG = {
  /* 우리은행 시안 판 */
  'rgba(35,61,96,0.5)': '#e8f2f9', 'rgba(35,61,96,0.3)': '#f0f6fb', 'rgba(33,96,117,0.1)': 'rgba(255,255,255,0.88)', 'rgba(33,96,117,0.2)': '#f6fbfe',
  '#15334d': '#e4f0f8', '#151635': '#eef4f9', '#030517': '#ffffff', 'rgba(14,37,44,0.5)': '#f3f8fb', 'rgba(3,5,23,0.5)': '#f6fafd',
  '#052844': '#eaf4fb', '#0d0f2d': '#ffffff', 'rgba(26,65,89,0.6)': '#e6f1f8', '#2e3d53': '#ffffff', '#171830': '#f4f8fb',
  'rgba(230,242,252,0.5)': 'rgba(60,100,130,0.45)', '#c989ff': '#9147e0', '#00f0ff': '#00a0c4', '#e4ff00': '#b8a000',
  'rgb(41,66,90)': '#ffffff', 'rgb(38,52,78)': '#e6f0f7', 'rgb(6,21,46)': '#ffffff', 'rgb(9,18,21)': '#ffffff',
  'rgba(255,255,255,0.08)': 'rgba(0,90,150,0.05)', 'rgba(255,255,255,0.1)': 'rgba(0,90,150,0.06)', 'rgba(235,235,235,0)': 'rgba(0,90,150,0)', 'rgba(124,124,124,0)': 'rgba(0,90,150,0)',
  '#0e252c': '#f3f8fb', '#00ffff': '#00a0c4',
`);
rep(`const BORDER = {\n`, `const BORDER = {
  /* 우리은행 시안 선 · 차트 시리즈(밝은 판에서 보이게 한 톤 짙게) */
  '#2b6e92': '#b4cddc', '#2a7ca0': '#b7d0e0', '#2c80a6': '#9dbfd2', '#214f6e': '#b4cddc', '#3d7bac': '#9cc3dc', '#0e3947': '#d3e2ec',
  '#5dafda': '#7fb6d6', '#2c6f5a': '#a9c6c0', '#236cbb': '#9dc1da', '#245360': '#7fa8bd', '#e2e3e5': '#b7c9d6', '#175e3a': '#a9c6c0',
  '#e4ff00': '#b8a000', '#00e1ff': '#0094b8', '#c989ff': '#9147e0', '#35d28d': '#139a62', '#f06c81': '#e0435f', '#45cde6': '#0a93b3',
  '#3ad59d': '#139a6a', '#f7a93c': '#d9820a', '#3badda': '#1c8fbe', '#ec696d': '#d94348', '#487af8': '#2f62e0',
`);
/* 그라디언트 값은 쉼표 뒤에 공백이 있다 — 표를 찾을 때 공백을 지운다 */
rep(`    const key = c.trim();\n`, `    const key = c.trim().replace(/\\s+/g, '');\n`);
fs.writeFileSync(p, s);
console.log('light.js 고침');
