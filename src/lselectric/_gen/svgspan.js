/* SVG 안 path 들의 x 범위를 잰다 — 잘린 상자(viewBox) 밖으로 얼마나 더 그려져 있는지 보려고.
   (트렌드 차트를 '흐르게' 밀 때 빈 자리가 생기지 않는 여유분을 알아야 한다)
   실행: node svgspan.js <파일.svg> */
'use strict';
const fs = require('fs');
const src = fs.readFileSync(process.argv[2], 'utf8');
const vb = (src.match(/viewBox="([^"]+)"/) || [])[1];
console.log('viewBox', vb);
const re = /<path[^>]*?id="([^"]*)"[^>]*?d="([^"]+)"/g;
let m;
while ((m = re.exec(src))) {
  const nums = m[2].match(/-?\d+(?:\.\d+)?/g) || [];
  const xs = [];
  for (let i = 0; i < nums.length; i += 2) xs.push(+nums[i]);
  xs.sort((a, b) => a - b);
  console.log(String(m[1]).padEnd(10), 'x', xs[0].toFixed(1), '…', xs[xs.length - 1].toFixed(1), ' 점', xs.length);
}
