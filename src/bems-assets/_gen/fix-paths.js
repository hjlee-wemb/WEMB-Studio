/* 점검 스크립트의 '이 시안 그림' 판별 경로를 src/datacenter/ → src/bems/ 로(한 번만). */
'use strict';
const fs = require('fs'), path = require('path');
for (const f of ['lib-check.js', 'lib-cards.js']) {
  const p = path.join(__dirname, f);
  let s = fs.readFileSync(p, 'utf8');
  const n = s.split('datacenter').length - 1;
  s = s.split('src\\/datacenter\\/').join('src\\/bems\\/').split('src/datacenter/_gen/pw.js ../../datacenter-assets').join('src/bems/_gen/pw.js ../../bems-assets');
  fs.writeFileSync(p, s);
  console.log(f, n, '→', s.split('datacenter').length - 1);
}
