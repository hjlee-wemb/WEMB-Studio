/* dc-<key>.txt 의 글자 노드가 meta-*.xml 로 상자를 얻는지 센다.

   왜 — 이 파일의 화면들은 같은 컴포넌트를 다시 쓴다. design context 가 내는 node id 도
   대부분 마스터 id 라서, 이미 받아 둔 meta-2-18441.xml 하나로 새 화면의 글자 상자까지 덮인다.
   못 덮는 것만 골라 따로 받으면 된다(Figma 덤프는 20kb 에서 잘려 통째로는 못 가져온다).

   실행: node src/lselectric/_gen/check-meta.js <key> [meta1.xml meta2.xml …] */
'use strict';
const fs = require('fs');
const path = require('path');
const GEN = __dirname;

const [key, ...metaFiles] = process.argv.slice(2);
if (!key) { console.error('사용법: node check-meta.js <key> [meta…]'); process.exit(1); }
const metas = metaFiles.length ? metaFiles : ['meta-2-18441.xml'];

/* conv.js 와 같은 방식으로 META 를 만든다(정확한 id + 마스터 id 폴백) */
const META = {};
for (const f of metas) {
  const xml = fs.readFileSync(path.join(GEN, f), 'utf8');
  for (const m of xml.matchAll(/<(\w[\w-]*) id="([^"]+)" name="([^"]*)"(?: x="[-\d.]+")?(?: y="[-\d.]+")? width="([-\d.]+)" height="([-\d.]+)"/g)) {
    const box = { tag: m[1], name: m[3], w: +m[4], h: +m[5] };
    META[m[2]] = box;
    const id = m[2].split(';').pop();
    if (!META[id]) META[id] = box;
  }
}

/* dc 의 <p …> 요소(=글자)에 달린 node id 를 모은다 */
const src = fs.readFileSync(path.join(GEN, 'dc-' + key + '.txt'), 'utf8');
const ids = new Set();
for (const m of src.matchAll(/<p\b[^>]*data-node-id="([^"]+)"/g)) ids.add(m[1]);
/* 여는 태그 안에서 속성 순서가 뒤집힌 경우도 줍는다 */
for (const m of src.matchAll(/<p\b[^>]*?data-node-id='([^']+)'/g)) ids.add(m[1]);

const miss = [...ids].filter((id) => !META[id]);
console.log('dc-' + key + ' 글자 노드', ids.size, '개 · 상자 있음', ids.size - miss.length, '· 없음', miss.length);
if (miss.length) console.log('없는 것:\n  ' + miss.join('\n  '));
