/* tool-results 의 get_design_context 응답들을 화면 id 로 찾아 dc-<key>.txt 로 옮긴다. 손으로 옮겨 적지 않는다. */
'use strict';
const fs = require('fs'), path = require('path');
const DIR = 'C:/Users/wemb/.claude/projects/C--Users-wemb/2cb4295e-82bc-4f2b-897a-569d13892f42/tool-results';
const WANT = ['1:2634', '1:3482', '1:4335', '1:52', '1:912', '1:1773', '1:6841', '1:5184', '1:6013', '1:7644', '1:8494'];
const files = fs.readdirSync(DIR).filter((f) => /^(toolu_|mcp-73cbc.*get_design_context)/.test(f));
const found = {};
for (const f of files) {
  let items; try { items = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')); } catch (e) { continue; }
  if (!Array.isArray(items)) continue;
  const code = items.filter((x) => x && typeof x.text === 'string').map((x) => x.text).find((t) => /data-node-id="/.test(t) && /export default function/.test(t));
  if (!code) continue;
  const m = code.slice(code.indexOf('export default function')).match(/return \(\s*<div[^>]*data-node-id="([^"]+)"/);
  if (/data-node-id="1:2634"/.test(code) && !/\}\s*$/.test(code)) continue;   /* 100,000자에서 잘린 첫 응답은 버린다 */
  if (m && WANT.includes(m[1])) found[m[1]] = code;
}
for (const id of WANT) {
  if (!found[id]) { console.log('없음', id); continue; }
  const key = id.replace(':', '-'), t = found[id];
  fs.writeFileSync(path.join(__dirname, 'dc-' + key + '.txt'), t);
  console.log(id, t.length, '자 · 에셋', (t.match(/^const (\w+) = "https:/gm) || []).length, '· 노드', (t.match(/data-node-id="/g) || []).length, '· 끝:', JSON.stringify(t.slice(-12)));
}
