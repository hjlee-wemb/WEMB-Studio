/* 라이트 그림 사본 — 파일마다 정한 색으로 원본 SVG 의 색 값만 바꾼다(형상은 한 점도 안 건드린다).
   판은 흰 유리, 선은 옅은 파랑, 아이콘은 짙은 파랑. 등급 표지(marker · marker-1~3) · 로고는 색이 곧 뜻이라 사본을 안 만든다.
   <mask fill="white"> 는 마스크 자체라 건드리지 않는다 — stop-color · stroke · fill="#…" 와 지정한 불투명도만 바꾼다.
   실행: node mk-light-plant.js → node conv.js */
'use strict';
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '..');
const LINE = '#7FA9CC', LINE2 = '#4F8FC4', ICON = '#2B6EA8', TEAL = '#0A9EA6';
const MAP = {
  'background.svg': { c: { '#182033': '#FFFFFF' }, stroke: { white: '#5C8FBF' }, op: { 'fill-opacity="0.6"': 'fill-opacity="0.96"' } },
  'background-1.svg': { c: { '#182033': '#FFFFFF', '#00FDFE': TEAL }, op: { 'fill-opacity="0.6"': 'fill-opacity="0.96"' } },
  'badge.svg': { c: { '#105452': '#E4FBFA', '#228D83': '#1FA79C', '#00FDFE': TEAL } },
  'badge-1.svg': { c: { '#105452': '#E4FBFA', '#228D83': '#1FA79C', '#00FDFE': TEAL } },
  'background-2.svg': { c: { '#0C2654': '#E6F2FC', '#45C5FF': '#2E8FD4' } },
  'background-3.svg': { c: { '#0C2654': '#FFFFFF', '#6697C4': '#A7C3DC' } },
  'background-4.svg': { c: { '#1A3F66': '#FFFFFF', '#181F33': '#F4F9FD', '#7CCCFF': LINE2 }, stop: { white: LINE }, op: { 'fill-opacity="0.8"': 'fill-opacity="0.93"' } },
  'card-bg.svg': { c: { '#1A3F66': '#FFFFFF', '#181F33': '#F4F9FD', '#7CCCFF': LINE2, '#48B0E5': '#CFE6F7' }, stop: { white: LINE }, op: { 'fill-opacity="0.8"': 'fill-opacity="0.93"', 'stop-opacity="0.03"': 'stop-opacity="0.9"' } },
  'border.svg': { c: { '#7CCCFF': LINE2, '#48B0E5': '#CFE6F7' }, stop: { white: LINE }, op: { 'stop-opacity="0.03"': 'stop-opacity="0.9"' } },
  'title-bg.svg': { c: { '#1A3F66': '#FFFFFF', '#181F33': '#EAF3FB', '#7CCCFF': LINE2 }, stop: { white: LINE }, op: { 'stop-opacity="0.8"': 'stop-opacity="0.96"' } },
  'fold-button.svg': { c: { '#304E69': '#DCEBF8', '#5F7F9C': '#FFFFFF', '#7CCCFF': LINE2 }, stop: { white: LINE }, fill: { '#7CCCFF': ICON } },
  'fold-button-1.svg': { c: { '#304E69': '#DCEBF8', '#5F7F9C': '#FFFFFF', '#7CCCFF': LINE2 }, stop: { white: LINE }, fill: { '#7CCCFF': ICON } },
  'icon-action-fold.svg': { fill: { white: ICON } },
  'icon-action-user.svg': { c: { '#87B6D3': ICON } },
  'icon-action-logout.svg': { c: { '#87B6D3': ICON } },
  'header-line.svg': { c: { '#48B0E5': '#6F9CC4' }, stop: { white: '#6F9CC4' } },
  'background-5.svg': { c: { '#ADC9DC': '#E6F0F8', '#E3EBF8': LINE }, stop: { white: '#FFFFFF' }, op: { 'fill-opacity="0.1"': 'fill-opacity="0.9"', 'stroke-opacity="0.5"': 'stroke-opacity="0.9"' }, grad2: LINE2 },
  'background-6.svg': { c: { '#6FFDFE': '#128C94', '#51697B': '#0A6F77', '#3E8B92': '#0C7C84', '#00FDFE': '#067E86' }, op: { 'fill-opacity="0.6"': 'fill-opacity="0.96"' } },
  'background-7.svg': { c: { '#E1E9F6': '#FFFFFF' }, stop: { white: '#FFFFFF' }, op: { 'fill-opacity="0.01"': 'fill-opacity="0.94"', 'stop-opacity="0.85"': 'stop-opacity="1"' }, last: LINE2 },
  'branch-line.svg': { stroke: { white: '#5F86A8' } },
  'marker-4.svg': { c: { '#00FFFF': '#0A8FA8' } },
  'marker-5.svg': { c: { '#B4E2FF': '#FFFFFF' }, stroke: { white: ICON } },
  'marker-6.svg': { fill: { white: ICON } },
  'tree-line.svg': { c: { '#A8BFDA': '#7C9DBD' } },
};
const eachKey = (m, fn) => Object.keys(m || {}).forEach((k) => fn(k, m[k]));
const out = {};
Object.keys(MAP).forEach((f) => {
  const R = MAP[f];
  let s = fs.readFileSync(path.join(DIR, f), 'utf8');
  eachKey(R.c, (a, b) => { s = s.split('"' + a + '"').join('"' + b + '"'); });
  eachKey(R.stop, (a, b) => { s = s.split('stop-color="' + a + '"').join('stop-color="' + b + '"'); });
  eachKey(R.stroke, (a, b) => { s = s.split('stroke="' + a + '"').join('stroke="' + b + '"'); });
  /* fill 은 mask 태그를 뺀 자리만 */
  eachKey(R.fill, (a, b) => { s = s.replace(new RegExp('(<(?!mask)[a-z]+[^>]*?\\sfill=")' + a + '"', 'g'), '$1' + b + '"'); });
  eachKey(R.op, (a, b) => { s = s.split(a).join(b); });
  const lt = f.replace(/\.svg$/, '-lt.svg');
  fs.writeFileSync(path.join(DIR, lt), s);
  out[f] = lt;
});
fs.writeFileSync(path.join(__dirname, 'light-assets.json'), JSON.stringify(out, null, 1));
console.log('라이트 사본', Object.keys(out).length);
