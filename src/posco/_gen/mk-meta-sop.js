/* SOP 화면(1:9770 · 1:9852) 글자 상자 덤프(meta-sop-raw.txt, `id|w|h`) → meta-1-9770.xml
   use_figma 덤프는 20kb 에서 잘려 XML 로 통째로 못 받는다 — 짧은 줄로 받아 여기서 XML 로 편다.
   SOP03 의 층 목록(I1:9860;…)은 SOP02(I1:9778;…)와 같은 원격 인스턴스라 같은 상자를 복사한다.
   실행: node src/posco/_gen/mk-meta-sop.js */
'use strict';
const fs = require('fs');
const path = require('path');
const GEN = __dirname;
const lines = fs.readFileSync(path.join(GEN, 'meta-sop-raw.txt'), 'utf8').split(/\r?\n/).filter(Boolean);
const out = ['<frame id="1:9770" name="Screen/Control Main (SOP Dissemination)" width="1920" height="1080">'];
for (const l of lines) {
  const [id, w, h] = l.split('|');
  out.push('<text id="' + id + '" name="Text" width="' + w + '" height="' + h + '" />');
  if (id.indexOf('I1:9778;') === 0) out.push('<text id="' + id.replace('I1:9778;', 'I1:9860;') + '" name="Text" width="' + w + '" height="' + h + '" />');
}
out.push('</frame>');
fs.writeFileSync(path.join(GEN, 'meta-1-9770.xml'), out.join('\n') + '\n');
console.log('wrote meta-1-9770.xml', out.length - 2, 'boxes');
