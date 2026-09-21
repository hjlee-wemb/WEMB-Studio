/* 헤더 메뉴 아이콘의 상태별 사본 — src/posco/menu/icon-nav-<이름>-{off,on,off-lt,on-lt}.svg
   Figma btn-menu(17:13398): default = #CFD1D4 · active = #5C9DFF(마우스오버도 active 값).
   라이트는 라이트 시트가 옮겨 둔 값(기본 아이콘 #3C4846 · 활성 글자 #0446A9)에 맞춘다.

   왜 사본인가 — 처음엔 원본 SVG 를 CSS 마스크로 써서 글자색으로 칠했는데, **마스크 그림은 CORS 요청**이라
   파일로 열면(file://) 막혀 아이콘이 통째로 사라졌다. 그림(img content)은 그 제약이 없으므로
   형상은 한 점도 안 건드리고 채움색만 바꾼 사본을 상태마다 갈아 끼운다.
   하위 폴더(menu/)에 두는 이유 — mk-light-assets · dedupe-assets 가 src/posco 최상위만 훑어 사본을 건드리지 않게.

   실행: node src/posco/_gen/mk-menu-icons.js */
'use strict';
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '..');
const OUT = path.join(DIR, 'menu');
const ICONS = ['sop', 'operations', 'editor', 'admin', 'logout'];
const STATES = { off: '#CFD1D4', on: '#5C9DFF', 'off-lt': '#3C4846', 'on-lt': '#0446A9' };

fs.mkdirSync(OUT, { recursive: true });
let n = 0;
for (const name of ICONS) {
  const src = fs.readFileSync(path.join(DIR, 'icon-nav-' + name + '.svg'), 'utf8');
  const fills = [...new Set((src.match(/fill="#[0-9A-Fa-f]{6}"/g) || []))];
  if (fills.length !== 1) throw new Error('icon-nav-' + name + '.svg 의 채움색이 하나가 아니다: ' + fills.join(' '));
  for (const [st, hex] of Object.entries(STATES)) {
    fs.writeFileSync(path.join(OUT, 'icon-nav-' + name + '-' + st + '.svg'), src.split(fills[0]).join('fill="' + hex + '"'));
    n++;
  }
}
console.log('wrote', n, 'menu icons');
