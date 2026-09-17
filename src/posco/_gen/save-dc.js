/* get_design_context 결과(JSON 배열 [{type,text}])를 dc-<key>.txt 로 옮긴다.

   왜 필요한가 — 이 파일의 화면 한 장은 design context 가 13만 자쯤 된다. MCP 응답이 너무 커서
   대화로 오지 않고 tool-results/*.txt 에 통째로 저장되는데, 그 원문을 손으로 옮겨 적으면
   한 글자만 어긋나도 파서가 엉뚱한 DOM 을 만든다. 그래서 파일 → 파일로 그대로 옮긴다.
   dc-2-18441.txt 와 같은 모양으로 만든다(텍스트 항목을 줄바꿈으로 이어 붙인 것).

   실행: node src/posco/_gen/save-dc.js <tool-results/…txt> <key>
   예)   node src/posco/_gen/save-dc.js "…/mcp-…-1789427420648.txt" 39-9942 */
'use strict';
const fs = require('fs');
const path = require('path');

const [src, key] = process.argv.slice(2);
if (!src || !key) {
  console.error('사용법: node save-dc.js <tool-result json> <key>   (예: 39-9942)');
  process.exit(1);
}
const raw = fs.readFileSync(src, 'utf8');
const items = JSON.parse(raw);
const text = items.filter((x) => x && typeof x.text === 'string').map((x) => x.text).join('\n');

/* 안전 점검 — 첫 항목이 코드(에셋 상수 + JSX)인지 */
if (!/^const \w+ = "https:\/\//.test(text) && !/<div/.test(text.slice(0, 4000))) {
  console.error('코드 항목으로 보이지 않는다 — 응답을 확인할 것');
  process.exit(2);
}
const out = path.join(__dirname, 'dc-' + key + '.txt');
fs.writeFileSync(out, text);
const assets = (text.match(/^const (\w+) = "https:\/\/[^"]+";$/gm) || []).length;
const nodes = (text.match(/data-node-id="/g) || []).length;
console.log('wrote', path.basename(out), text.length, '자 · 에셋 상수', assets, '개 · data-node-id', nodes, '개');
