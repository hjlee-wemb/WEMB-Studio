/* 흰 아이콘 4개는 라이트 라이브러리 칸에서 안 보인다 — 양쪽 테마에서 보이는 라이트 색 사본을 등록한다. 한 번만. */
'use strict';
const fs = require('fs');
const rep = (s, a, b) => { if (!s.includes(a)) throw new Error('없음 ' + a); return s.replace(a, b); };
let a = fs.readFileSync('mk-assets.js', 'utf8');
a = rep(a, "const ICONS = [\n", "const USE_LT = /^(icon-action-close|type-wind-status-default|icon|icon-1)\\.svg$/;   /* 흰색이라 라이트 칸에서 안 보이는 것 */\nconst ICONS = [\n");
a = rep(a, "src: BASE + file });", "src: BASE + (USE_LT.test(file) ? file.replace('.svg', '-lt.svg') : file) });");
fs.writeFileSync('mk-assets.js', a);
console.log('ok');
