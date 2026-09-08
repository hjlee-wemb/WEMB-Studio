/* get_metadata XML → {nodeId: [name,w,h,tag,x,y]} — 브라우저에서 노드 상자 대조에 쓴다.
   페이지 통짜 메타(meta-page.xml)에 15화면이 다 들어 있어 한 벌만 만든다.
   인스턴스 안쪽 노드는 `I1:5328;1:61826` 꼴이라 그 id 와 마스터 id 둘 다 넣는다. */
const fs = require('fs');
const path = require('path');
const GEN = __dirname;
const files = ['meta-page.xml', 'meta-1-61879.xml'];
const o = {};
for (const f of files) {
  const src = fs.readFileSync(path.join(GEN, f), 'utf8');
  for (const m of src.matchAll(/<(\w[\w-]*) id="([^"]+)" name="([^"]*)" x="([-\d.e]+)" y="([-\d.e]+)" width="([-\d.e]+)" height="([-\d.e]+)"/g)) {
    const box = [m[3], +m[6], +m[7], m[1], +m[4], +m[5]];
    o[m[2]] = box;
    const id = m[2].split(';').pop();
    if (!o[id]) o[id] = box;
  }
}
fs.writeFileSync(path.join(GEN, 'nodes.json'), JSON.stringify(o));
console.log('nodes.json', Object.keys(o).length);
