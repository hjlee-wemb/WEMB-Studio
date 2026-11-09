/* dark.js 보강 — 입력칸 고리 그림자(밝은 회색)를 어둡게, Value Box 는 Select 면을 그대로 비치게. */
'use strict';
const fs = require('fs'), path = require('path');
const P = path.join(__dirname, 'dark.js');
let c = fs.readFileSync(P, 'utf8');
if (c.includes('DRAWING_DARK2')) { console.log('이미 적용됨'); process.exit(0); }
c = c.replace("  shadow: {},\n};", "  shadow: { /* DRAWING_DARK2 */ 'rgba(217,219,230,0.5)': 'rgba(255,255,255,0.08)', 'rgba(0,0,0,0.06)': 'rgba(0,0,0,0.3)' },\n};");
c = c.replace("R + ' [data-name=\"Select\"],' + R + ' [data-name=\"Value Box\"],' + R + ' [data-name^=\"Field/ID\"]", "R + ' [data-name=\"Select\"],' + R + ' [data-name^=\"Field/ID\"]");
fs.writeFileSync(P, c);
console.log(c.includes('DRAWING_DARK2') ? 'ok' : '실패');
