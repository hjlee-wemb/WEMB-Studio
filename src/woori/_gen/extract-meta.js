/* 세션 기록(jsonl)에서 get_metadata 결과(대화로 온 XML)를 meta-<key>.xml 로 꺼낸다 — 손으로 옮겨 적지 않으려고.
   실행: node extract-meta.js <session.jsonl> <node-id 예: 118:568> <key> */
'use strict';
const fs = require('fs'), path = require('path');
const [src, node, key] = process.argv.slice(2);
const lines = fs.readFileSync(src, 'utf8').split('\n');
const head = '<frame id="' + node + '"';
let best = null;
for (const ln of lines) {
  if (!ln.includes('<frame id=\\"' + node + '\\"')) continue;
  let o; try { o = JSON.parse(ln); } catch (e) { continue; }
  const c = o.message && o.message.content;
  if (!Array.isArray(c)) continue;
  for (const it of c) {
    if (it.type !== 'tool_result') continue;
    const parts = Array.isArray(it.content) ? it.content : [{ type: 'text', text: it.content }];
    const t = parts.filter((p) => p.type === 'text').map((p) => p.text);
    const xml = t.find((x) => x.indexOf(head) === 0);
    if (xml) best = xml;
  }
}
if (!best) { console.error('not found'); process.exit(1); }
fs.writeFileSync(path.join(__dirname, 'meta-' + key + '.xml'), best);
console.log('wrote meta-' + key + '.xml', best.length, '자 · 노드', (best.match(/ id="/g) || []).length);
