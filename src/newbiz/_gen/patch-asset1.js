const fs=require('fs');let s=fs.readFileSync('mk-screen-css.js','utf8');
const a=`L('> [data-node-id]{background-color:#f3f6fa!important;}'),`;
if(!s.includes(a))throw new Error('anchor');
s=s.replace(a,`/* 화면 틀에만 — 에셋 라이브러리 사본(.hj-asset)은 잘라 온 노드가 바로 아래라 면이 깔린다 */
  '.{{PX}}-root[data-theme="light"]:not(.hj-asset) > [data-node-id]{background-color:#f3f6fa!important;}',`);
fs.writeFileSync('mk-screen-css.js',s);
