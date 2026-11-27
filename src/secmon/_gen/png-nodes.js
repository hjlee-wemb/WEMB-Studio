/* design context 가 PNG 로 내보낸 노드 목록 — 진짜 그림인지(이미지 채움) 그라데이션을 굳힌 것인지 use_figma 로 가려 보려고.
   실행: node png-nodes.js → png-nodes.json { key: [[nodeId, imgVar, file], …] } */
'use strict';
const fs = require('fs'), path = require('path');
const MAP = JSON.parse(fs.readFileSync(path.join(__dirname, 'asset-map.json'), 'utf8'));
const out = {};
let n = 0;
for (const key of Object.keys(MAP)) {
  const f = path.join(__dirname, 'dc-' + key + '.txt');
  if (!fs.existsSync(f)) continue;
  const s = fs.readFileSync(f, 'utf8');
  const re = /data-node-id="([^"]+)"[^>]*>\s*(?:<div className="absolute inset-\[[^"]*\]">\s*)?<img [^>]*src=\{(img\w+)\}/g;
  let m; const list = [];
  while ((m = re.exec(s))) {
    const file = MAP[key][m[2]];
    if (file && /\.png$/.test(file)) list.push([m[1], m[2], file]);
  }
  out[key] = list; n += list.length;
}
fs.writeFileSync(path.join(__dirname, 'png-nodes.json'), JSON.stringify(out));
for (const k of Object.keys(out)) console.log(k, out[k].length, [...new Set(out[k].map((x) => x[2]))].length + ' files');
console.log('total', n);
