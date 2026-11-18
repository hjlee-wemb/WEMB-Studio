/* dark.js 의 SVG 색 규칙이 마스크 안 경로까지 바꾸지 않게 :not(mask *) 를 붙인다 — 한 번만 */
'use strict';
const fs = require('fs'), path = require('path');
const P = path.join(__dirname, 'dark.js');
let s = fs.readFileSync(P, 'utf8');
let n = 0;
s = s.replace(/svg (path)?\[(fill|stroke)="([^"]+)"\](?!:not)/g, (m, tag, a, v) => { n++; return 'svg ' + (tag || '') + '[' + a + '="' + v + '"]:not(mask *)'; });
fs.writeFileSync(P, s);
console.log('마스크 제외', n);
