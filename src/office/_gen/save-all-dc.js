/* get_design_context 응답을 화면 id 로 찾아 dc-<key>.txt 로 옮긴다. 손으로 옮겨 적지 않는다.
   큰 응답은 tool-results 파일로, 작은 응답은 세션 기록(jsonl)에 대화로 왔다 → 둘 다 훑는다. */
'use strict';
const fs = require('fs'), path = require('path');
const SES = 'C:/Users/wemb/.claude/projects/C--Users-wemb/5a94a874-6749-4003-b36c-044b3ecdc485';
const DIR = SES + '/tool-results';
const JSONL = SES + '.jsonl';
const LIST = JSON.parse(fs.readFileSync(path.join(__dirname, 'screens.json'), 'utf8'));
const WANT = LIST.map((s) => s[1]);
const found = {};
const rootOf = (code) => {
  const m = code.slice(code.lastIndexOf('export default function')).match(/return \(\s*<div[^>]*data-node-id="([^"]+)"/);
  return m && m[1];
};
const take = (code) => {
  if (!code || !/data-node-id="/.test(code) || !/export default function/.test(code)) return;
  if (!/\}\s*$/.test(code)) return;
  const id = rootOf(code);
  if (id && WANT.includes(id)) found[id] = code;
};
for (const f of fs.readdirSync(DIR).filter((f) => /get_design_context.*\.(json|txt)$/.test(f)).sort()) {
  let items; try { items = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')); } catch (e) { continue; }
  if (!Array.isArray(items)) continue;
  take(items.filter((x) => x && typeof x.text === 'string').map((x) => x.text).find((t) => /export default function/.test(t)));
}
if (fs.existsSync(JSONL)) for (const ln of fs.readFileSync(JSONL, 'utf8').split('\n')) {
  if (!ln.includes('export default function') || !ln.includes('data-node-id')) continue;
  let o; try { o = JSON.parse(ln); } catch (e) { continue; }
  const c = o.message && o.message.content;
  if (!Array.isArray(c)) continue;
  for (const it of c) {
    if (it.type !== 'tool_result') continue;
    const parts = Array.isArray(it.content) ? it.content : [{ type: 'text', text: it.content }];
    for (const p of parts) if (p && p.type === 'text' && /^const \w+ = "https:/.test(p.text)) take(p.text);
  }
}
let miss = 0;
for (const id of WANT) {
  if (!found[id]) { console.log('없음', id); miss++; continue; }
  const key = id.replace(':', '-'), t = found[id];
  fs.writeFileSync(path.join(__dirname, 'dc-' + key + '.txt'), t);
  console.log(id, t.length, '자 · 에셋', (t.match(/^const (\w+) = "https:/gm) || []).length);
}
console.log('없음 합계', miss);
