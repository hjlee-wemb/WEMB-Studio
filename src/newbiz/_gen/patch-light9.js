/* 풍향·풍속계 톤 — 어두운 쪽을 끌어올려 받침이 시커멓지 않게, 밝은 쪽은 맑은 은회색. 남은 옛 이름(metadata) 정리. 한 번만. */
'use strict';
const fs = require('fs');
let m = fs.readFileSync('mk-light-newbiz.js', 'utf8');
const a = "D[i + k] = Math.round(255 * Math.pow(v, 1.5) * 0.9 * TINT[k]);";
if (!m.includes(a)) throw new Error('자리 없음');
m = m.replace(a, "D[i + k] = Math.round(255 * (0.34 + 0.56 * Math.pow(v, 1.15)) * TINT[k]);");
m = m.replace("const TINT = [0.945, 0.975, 1.0];", "const TINT = [0.93, 0.975, 1.02];");
m = m.replace('어두운 금속은 그대로, 흰 컵은 옅은 은회색(최대 #d3dce4 쯤) + 살짝 차가운 기운', '어두운 금속은 #52-5a 쯤까지 끌어올리고(시커멓지 않게), 흰 컵은 맑은 은회색(최대 #d1dbe5 쯤) + 살짝 차가운 기운');
fs.writeFileSync('mk-light-newbiz.js', m);
const x = fs.readFileSync('meta-page.xml', 'utf8');
fs.writeFileSync('meta-page.xml', x.split('name="Turbine Image"').join('name="Anemometer Image"'));
console.log('ok');
