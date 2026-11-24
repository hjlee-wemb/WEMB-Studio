/* 세션 기록(jsonl)에서 get_design_context 결과(대화로 온 것)를 파일로 꺼낸다 — 손으로 옮겨 적지 않으려고.
   실행: node extract-dc.js <session.jsonl> <node-id 예: 33:748> <key> */
'use strict';
const fs = require('fs'), path = require('path');
const [src, node, key] = process.argv.slice(2);
const lines = fs.readFileSync(src, 'utf8').split('\n');
let best = null;
for (const ln of lines) {
  if (!ln.includes('data-node-id=\\"' + node + '\\"')) continue;
  let o; try { o = JSON.parse(ln); } catch (e) { continue; }
  const c = o.message && o.message.content;
  if (!Array.isArray(c)) continue;
  for (const it of c) {
    if (it.type !== 'tool_result') continue;
    const parts = Array.isArray(it.content) ? it.content : [{ type: 'text', text: it.content }];
    const t = parts.filter((p) => p.type === 'text').map((p) => p.text);
    const code = t.find((x) => /^const \w+ = "https:/.test(x) && x.includes('data-node-id="' + node + '"'));
    if (code) best = code;
  }
}
if (!best) { console.error('not found'); process.exit(1); }
fs.writeFileSync(path.join(__dirname, 'dc-' + key + '.txt'), best);
console.log('wrote dc-' + key + '.txt', best.length);
