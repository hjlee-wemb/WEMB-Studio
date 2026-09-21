/* PNG 청크 목록 — 색 관리(gAMA·iCCP·sRGB·cHRM) 때문에 브라우저와 Figma 의 밝기가 달라지는지 본다.
   실행: node chunks.js <파일…> */
'use strict';
const fs = require('fs');
for (const f of process.argv.slice(2)) {
  const b = fs.readFileSync(f);
  let p = 8;
  const list = [];
  while (p < b.length) {
    const len = b.readUInt32BE(p);
    const type = b.toString('latin1', p + 4, p + 8);
    if (type !== 'IDAT') list.push(type + '(' + len + ')');
    else if (!list.some((x) => x.startsWith('IDAT'))) list.push('IDAT…');
    p += 12 + len;
    if (type === 'IEND') break;
  }
  console.log(f.padEnd(28), list.join(' '));
}
