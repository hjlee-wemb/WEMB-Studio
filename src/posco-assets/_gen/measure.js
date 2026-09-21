/* 등록물 크기(w·h)를 **브라우저에서 다시 재기 위한** 코드 조각을 뽑아 준다.
   이 시안에는 전체 노드 메타가 없어(meta-*.xml 은 TEXT 상자뿐) 크기를 실제 렌더에서 잰다.

   1) node src/posco/_gen/serve.js                      정적 서버(기본 5503)
   2) 브라우저에서 http://localhost:5503/src/posco/<화면>.html?live=0&t=dark  를 열고
   3) node src/posco-assets/_gen/measure.js <px> [nid …]   가 찍어 주는 코드를 콘솔에 붙인다
      (라이브를 끄고 판을 1920x1080 으로 펴 놓고 재기 때문에 Figma 값과 같아진다)
   4) 나온 값을 mk-assets.js 의 표(w·h)에 옮기고 mk-assets.js 를 다시 돌린다.

   화면 파일:  pkm→main · pka→ack · pko→overview · pkr→route · pkf→floors · pkd→detail
               pks1→sop1 · pks2→sop2 · pks3→sop3 · pks4→sop4                              */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');

const PAGE = { pkm: 'main', pka: 'ack', pko: 'overview', pkr: 'route', pkf: 'floors', pkd: 'detail', pks1: 'sop1', pks2: 'sop2', pks3: 'sop3', pks4: 'sop4' };
const px = process.argv[2];
if (!px || !PAGE[px]) {
  console.error('사용: node src/posco-assets/_gen/measure.js <' + Object.keys(PAGE).join('|') + '> [nid …]');
  process.exit(1);
}

global.window = {};
new Function('window', fs.readFileSync(path.join(ROOT, 'src', 'posco-assets.js'), 'utf8'))(global.window);
const A = global.window.__POSCO_ASSETS || {};
const known = [];
['charts', 'symbols', 'panels', 'events'].forEach((c) => (A[c] || []).forEach((a) => { if (a.px === px) known.push(a); }));

const ids = process.argv.slice(3).concat(known.map((a) => a.nid));
const uniq = [...new Set(ids)];

console.log('/* ' + px + ' — http://localhost:5503/src/posco/' + PAGE[px] + '.html?live=0&t=dark 에서 실행 */');
console.log("(()=>{const ids=" + JSON.stringify(uniq) + ";"
  + "[document.querySelector('." + px + "-fit'),document.querySelector('." + px + "-stage')].forEach(e=>{if(!e)return;"
  + "e.style.position='absolute';e.style.inset='auto';e.style.left='0';e.style.top='0';e.style.width='1920px';e.style.height='1080px';});"
  + "return ids.map(id=>{const el=document.querySelector('[data-node-id=\"'+id+'\"]');if(!el)return id+' MISSING';"
  + "const r=el.getBoundingClientRect();return id+' '+Math.round(r.width)+'x'+Math.round(r.height);}).join('\\n');})()");

if (known.length) {
  console.log('\n/* 지금 등록된 값 */');
  known.forEach((a) => console.log('   ' + a.nid.padEnd(21) + (a.w + 'x' + a.h).padEnd(12) + a.name));
}
