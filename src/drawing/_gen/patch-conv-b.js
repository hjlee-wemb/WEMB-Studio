/* conv.js 보강 — 앞서 sed 로 넣은 드롭존 정규식의 대괄호 이스케이프가 빠졌다 → 고친다. */
'use strict';
const fs = require('fs'), path = require('path');
const P = path.join(__dirname, 'conv.js');
let c = fs.readFileSync(P, 'utf8');
c = c.split(".replace(/aspect-[984/112]/g, 'h-[112px]').replace(/py-[35px]/g, 'py-[0px]')").join(".replace(/aspect-\\[984\\/112\\]/g, 'h-[112px]').replace(/py-\\[35px\\]/g, 'py-[0px]')");
fs.writeFileSync(P, c);
console.log(c.includes(".replace(/aspect-\\[984\\/112\\]/g") ? 'ok' : '변경 없음');
