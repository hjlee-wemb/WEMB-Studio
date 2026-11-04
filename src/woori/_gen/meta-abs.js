/* meta-page.xml → 화면 기준 절대 좌표표(meta-abs.json) — 재구축 DOM 상자를 Figma 상자와 대조하는 데 쓴다(box-check).
   GROUP 은 metadata 에 frame 으로 찍히지만 자식 좌표가 '그룹의 부모 프레임' 기준이다 → dc 에서 contents 로 나온 노드를 그룹으로 본다.
   실행: node meta-abs.js */
'use strict';
const fs = require('fs'), path = require('path');
const GEN = __dirname;
const xml = fs.readFileSync(path.join(GEN, 'meta-page.xml'), 'utf8');
const groups = new Set();
for (const f of ['dc-11-946.txt', 'dc-15-2.txt', 'dc-19-2533.txt']) {
  const s = fs.readFileSync(path.join(GEN, f), 'utf8');
  for (const m of s.matchAll(/className="([^"]*)"[^>]*?data-node-id="([^"]+)"/g)) if (/(^|\s)(contents|inline-grid)(\s|$)/.test(m[1])) groups.add(m[2]);
}
const out = {};
const stack = [];
for (const ln of xml.split('\n')) {
  const m = /^(\s*)<(\w[\w-]*) id="([^"]+)" name="([^"]*)" x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/.exec(ln);
  if (!m) continue;
  const d = m[1].length / 2;
  while (stack.length && stack[stack.length - 1].d >= d) stack.pop();
  const par = stack[stack.length - 1];
  const x = +m[5], y = +m[6];
  /* 화면(depth 1)은 자기 자리를 0,0 으로 */
  const isScreen = d === 1;
  const ox = par ? par.ox : 0, oy = par ? par.oy : 0;
  const ax = isScreen ? 0 : ox + x, ay = isScreen ? 0 : oy + y;
  const isGroup = groups.has(m[3]);
  out[m[3]] = { x: ax, y: ay, w: +m[7], h: +m[8], n: m[4], t: m[2], g: isGroup ? 1 : 0 };
  if (!/\/>\s*$/.test(ln)) stack.push({ d, ox: isGroup ? ox : ax, oy: isGroup ? oy : ay });
}
fs.writeFileSync(path.join(GEN, 'meta-abs.json'), JSON.stringify(out));
console.log('노드', Object.keys(out).length, '그룹', groups.size);
