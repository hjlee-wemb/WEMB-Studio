/* get_metadata XML → {nodeId: [name,w,h,tag]} — 브라우저에서 노드 상자 대조에 쓴다.
   인스턴스 안쪽 노드는 `I65:817;65:824` 꼴이라 그 id 와 마스터 id 둘 다 넣는다. */
const fs = require('fs');
const M = { '65-429': ['meta-65-429.xml', 'meta-65-817.xml'], '65-943': ['meta-65-943.xml', 'meta-65-817.xml'], '65-2243': ['meta-65-2243.xml', 'meta-65-817.xml'] };
for (const [k, files] of Object.entries(M)) {
  const o = {};
  for (const f of files) {
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/<(\w[\w-]*) id="([^"]+)" name="([^"]*)"(?: x="[-\d.]+")?(?: y="[-\d.]+")? width="([-\d.]+)" height="([-\d.]+)"/g)) {
      const box = [m[3], +m[4], +m[5], m[1]];
      o[m[2]] = box;
      const id = m[2].split(';').pop();
      if (!o[id]) o[id] = box;
    }
  }
  fs.writeFileSync('nodes-' + k + '.json', JSON.stringify(o));
  console.log('nodes-' + k + '.json', Object.keys(o).length);
}
