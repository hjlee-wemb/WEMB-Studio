/* VR 고침 — ① ms-[ 정규식 ② 여러 줄 글자 줄높이 ③ 그라디언트 정지점 순서(25% 뒤에 20% 가 오면 CSS 는 딱 끊긴다 — 첫 정지점을 뺀다). 실행: node patch-vr2.js → node mk-screen-css.js → node conv.js */
'use strict';
const fs = require('fs'), path = require('path');
const G = (f) => path.join(__dirname, f);
let s = fs.readFileSync(G('conv.js'), 'utf8');
s = s.replace("if (/^ms-[/.test(c))", "if (/^ms-\\[/.test(c))");
fs.writeFileSync(G('conv.js'), s);
['dc-1-4916.txt', 'dc-1-4943.txt'].forEach((f) => {
  let d = fs.readFileSync(G(f), 'utf8');
  d = d.split('linear-gradient(90deg, rgba(116, 137, 180, 0.03) 25%, rgba(116, 137, 180, 0.3) 20.381%,').join('linear-gradient(90deg, rgba(116, 137, 180, 0.3) 20.381%,');
  d = d.split('linear-gradient(90deg, rgba(116, 137, 180, 0) 25%, rgba(116, 137, 180, 0.2) 23.6%,').join('linear-gradient(90deg, rgba(116, 137, 180, 0.2) 23.6%,');
  fs.writeFileSync(G(f), d);
});
let m = fs.readFileSync(G('mk-screen-css.js'), 'utf8');
if (!m.includes('1:4958')) {
  m = m.replace("fs.writeFileSync(path.join(__dirname, 'screen-css.json')",
    "/* VR — 여러 줄 글자는 줄높이 1.5(글자 상자 높이가 줄높이로 박히지 않게), 고친 글에 따라 상자가 자란다 */\n" +
    "const lh = (id, px) => '.{{PX}}-root [data-node-id=\"' + id + '\"]{line-height:' + px + 'px!important;height:auto!important;}';\n" +
    "OUT['1-4916'] = [lh('1:4941', 22.5), lh('1:4942', 22.5)];\n" +
    "OUT['1-4943'] = [lh('1:4958', 22.5), lh('1:4963', 22.5)];\n" +
    "fs.writeFileSync(path.join(__dirname, 'screen-css.json')");
  fs.writeFileSync(G('mk-screen-css.js'), m);
}
console.log('ok');
