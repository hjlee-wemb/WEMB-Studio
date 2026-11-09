/* patch-conv-a 가 String.replace 의 $& 치환 때문에 정규식 한 줄을 망가뜨렸다 → 그 줄만 바로잡고, px-[580px] 정규식의 대괄호도 고친다. */
'use strict';
const fs = require('fs'), path = require('path');
const P = path.join(__dirname, 'conv.js');
const L = fs.readFileSync(P, 'utf8').split('\n');
const i = L.findIndex((x) => x.includes('const esc = id.replace('));
if (i < 0) throw new Error('줄 없음');
L[i] = "    const esc = id.replace(/[.*+?^${}()|[\\]\\\\]/g, (q) => '\\\\' + q);";
fs.writeFileSync(P, L.join('\n'));
console.log(L[i]);
