/* PNG 의 색 관리 청크(gAMA·cHRM·iCCP·sRGB)를 떼어 낸다 — 그림 자체(IDAT)는 한 바이트도 안 건드린다.

   왜 — Figma 렌더는 이 청크를 무시하고 픽셀 값을 그대로 쓰는데 브라우저는 감마·색좌표를 적용한다.
   그래서 같은 바탕 사진이 화면에서 채널마다 8쯤 어둡게 나왔다(바탕이 화면의 대부분이라 픽셀차가 통째로 부풀었다).
   청크를 떼면 브라우저도 sRGB 로 그대로 그려 Figma 와 같아진다.

   실행: node strip-gama.js <파일…>   (인자가 없으면 src/lselectric 의 png 를 모두 훑는다) */
'use strict';
const fs = require('fs');
const path = require('path');
const DROP = ['gAMA', 'cHRM', 'iCCP', 'sRGB'];
const ART = path.join(__dirname, '..');
const files = process.argv.length > 2
  ? process.argv.slice(2)
  : fs.readdirSync(ART).filter((f) => /\.png$/i.test(f)).map((f) => path.join(ART, f));

let changed = 0;
for (const f of files) {
  const b = fs.readFileSync(f);
  if (b.length < 8 || b.readUInt32BE(0) !== 0x89504e47) { console.log('건너뜀(PNG 아님):', f); continue; }
  const keep = [b.slice(0, 8)];
  let p = 8, dropped = [];
  while (p < b.length) {
    const len = b.readUInt32BE(p);
    const type = b.toString('latin1', p + 4, p + 8);
    const end = p + 12 + len;
    if (DROP.includes(type)) dropped.push(type);
    else keep.push(b.slice(p, end));
    p = end;
    if (type === 'IEND') break;
  }
  if (!dropped.length) continue;
  fs.writeFileSync(f, Buffer.concat(keep));
  changed++;
  console.log('뗌:', path.basename(f), dropped.join(','));
}
console.log('고친 파일', changed, '/', files.length);
