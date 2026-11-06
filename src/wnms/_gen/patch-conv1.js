/* conv.js 보강 ① — 이 시안에서 처음 나온 변형 클래스(계통도 장비 · 기지국 그림).
   skew-x-[31.49deg] · rotate-56 · -rotate-150 · -scale-y-87 를 일반 규칙으로 번역한다(근사 없음). */
'use strict';
const fs = require('fs'), path = require('path');
const P = path.join(__dirname, 'conv.js');
let c = fs.readFileSync(P, 'utf8');
if (c.includes('/* WNMS_TR */')) { console.log('이미 적용됨'); process.exit(0); }
const at = "    if (/^opacity-\\[/.test(c)) { set('opacity', arb(c)); continue; }";
if (!c.includes(at)) throw new Error('자리 없음');
c = c.replace(at, [
  '    /* WNMS_TR */',
  "    if ((m = c.match(/^(-?)rotate-(\\d+)$/))) { tr.push('rotate(' + m[1] + m[2] + 'deg)'); continue; }",
  "    if ((m = c.match(/^(-?)skew-([xy])-\\[([^\\]]+)\\]$/))) { tr.push('skew' + m[2].toUpperCase() + '(' + (m[1] ? '-' : '') + m[3] + ')'); continue; }",
  "    if ((m = c.match(/^(-?)scale-([xy])-(\\d+)$/))) { tr.push('scale' + m[2].toUpperCase() + '(' + (m[1] ? '-' : '') + (+m[3] / 100) + ')'); continue; }",
  at].join('\n'));
fs.writeFileSync(P, c);
console.log('ok');
