/* VR Instruction Card 그림자 — Figma 는 반투명 판 뒤로도 그림자를 그린다(판 안이 어두워진다, 픽셀 샘플로 확인).
   CSS drop-shadow 는 반투명 판에서 약해지므로 흐린 판(::before)으로 대신한다. 실행: node patch-vr3.js → node mk-screen-css.js → node conv.js */
'use strict';
const fs = require('fs'), path = require('path');
const p = path.join(__dirname, 'mk-screen-css.js');
let m = fs.readFileSync(p, 'utf8');
if (m.includes('vrShadow')) { console.log('이미 고침'); process.exit(0); }
const a = "OUT['1-4916'] = [lh('1:4941', 23), lh('1:4942', 23)];";
const b = "OUT['1-4943'] = [lh('1:4958', 23), lh('1:4963', 23)];";
if (!m.includes(a) || !m.includes(b)) throw new Error('앵커');
m = m.replace(a,
  "const vrShadow = (id) => ['.{{PX}}-root [data-node-id=\"' + id + '\"]{filter:none!important;isolation:isolate;}',\n" +
  "  '.{{PX}}-root [data-node-id=\"' + id + '\"]::before{content:\"\";position:absolute;inset:0;border-radius:10px;background:rgba(0,0,0,.35);filter:blur(12.5px);transform:translate(17.2px,24.6px);z-index:-1;pointer-events:none;}'];\n" +
  "const vrShadowLt = (id) => [R('[data-node-id=\"' + id + '\"]::before{background:rgba(40,70,110,.12);}')];\n" +
  "OUT['1-4916'] = [lh('1:4941', 23), lh('1:4942', 23)].concat(vrShadow('1:4937'));\n" +
  "OUT['1-4916:light'] = LIGHT.concat(vrShadowLt('1:4937'));");
m = m.replace(b, "OUT['1-4943'] = [lh('1:4958', 23), lh('1:4963', 23)].concat(vrShadow('1:4959'));\nOUT['1-4943:light'] = LIGHT.concat(vrShadowLt('1:4959'));");
fs.writeFileSync(p, m);
console.log('ok');
