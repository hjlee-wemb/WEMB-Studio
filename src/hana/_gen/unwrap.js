/* MCP tool-result(JSON 배열) → 평문 텍스트. dc-*.txt / meta-*.xml 를 만든다.
   usage: node unwrap.js <in.json> <out> */
const fs = require('fs');
const [, , inp, out] = process.argv;
const d = JSON.parse(fs.readFileSync(inp, 'utf8'));
const txt = (Array.isArray(d) ? d : [d]).map((x) => (typeof x === 'string' ? x : x.text || '')).join('\n');
fs.writeFileSync(out, txt);
console.log(out, txt.length, 'chars');
