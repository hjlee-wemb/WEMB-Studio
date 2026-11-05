/* 라이트 아이콘을 한 단계 더 밝고 맑게(사용자: "아직 칙칙해"). 윤곽은 그림자가 잡는다. 한 번만. */
'use strict';
const fs = require('fs');
const rep = (s, a, b) => { if (!s.includes(a)) throw new Error('없음 ' + a); return s.replace(a, b); };
let m = fs.readFileSync('mk-light-newbiz.js', 'utf8');
m = rep(m, 'D[i + k] = Math.round(255 * (0.34 + 0.56 * Math.pow(v, 1.15)) * TINT[k]);', 'D[i + k] = Math.min(255, Math.round(255 * (0.56 + 0.44 * Math.pow(v, 1.1)) * TINT[k]));');
m = rep(m, 'const TINT = [0.93, 0.975, 1.02];', 'const TINT = [0.9, 0.965, 1.03];');
m = rep(m, "[/^(icon|edit)/, { 'white': '#7f96aa', '#7fd3fa': '#2f9fd8', '#627b8e': '#8499ac' }],", "[/^(icon|edit)/, { 'white': '#6fa6cc', '#7fd3fa': '#37a9e2', '#627b8e': '#78a4c4' }],");
m = rep(m, "[/^type/, { 'white': '#7f96aa' }],", "[/^type/, { 'white': '#6fa6cc' }],");
fs.writeFileSync('mk-light-newbiz.js', m);
let s = fs.readFileSync('mk-screen-css.js', 'utf8');
s = rep(s, `L('[data-name="Anemometer Image"] img{filter:drop-shadow(0 1px 1.5px rgba(24,50,80,.28));}'),`, `L('[data-name="Anemometer Image"] img{filter:drop-shadow(0 0 .6px rgba(30,90,140,.55)) drop-shadow(0 1px 2px rgba(30,90,140,.28));}'),`);
s = s.split('brightness(1.32) saturate(.88)').join('brightness(1.48) saturate(.95)');
s = rep(s, `L('[data-name="Column/Labels"] [data-name="Visual"] img{filter:brightness(.82);}'),`, `L('[data-name="Column/Labels"] [data-name="Visual"] img{filter:brightness(.95) drop-shadow(0 0 .6px rgba(30,90,140,.5));}'),`);
fs.writeFileSync('mk-screen-css.js', s);
console.log('ok');
