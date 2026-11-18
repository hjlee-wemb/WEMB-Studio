/* get_design_context 응답을 화면 id 로 찾아 dc-<key>.txt 로 옮긴다. 손으로 옮겨 적지 않는다.
   큰 응답은 tool-results 파일로, 작은 응답(로그인 · 3D 통신실)은 세션 기록(jsonl)에 대화로 왔다 → 둘 다 훑는다. */
'use strict';
const fs = require('fs'), path = require('path');
const SES = 'C:/Users/wemb/.claude/projects/C--Users-wemb/f0fdd384-8f58-4436-9605-8776f4ebf21b';
const DIR = SES + '/tool-results';
const JSONL = SES + '.jsonl';
const WANT = ['1:1602', '1:1977', '1:2352', '1:2727', '1:3690', '1:3708', '1:3797', '1:3943'];
const found = {};
const rootOf = (code) => {
  const m = code.slice(code.indexOf('export default function')).match(/return \(\s*<div[^>]*data-node-id="([^"]+)"/);
  return m && m[1];
};
const take = (code) => {
  if (!code || !/data-node-id="/.test(code) || !/export default function/.test(code)) return;
  if (!/\}\s*$/.test(code)) return;                   /* 잘린 응답은 버린다 */
  const id = rootOf(code);
  if (id && WANT.includes(id)) found[id] = code;      /* 뒤에 온 것(최신)이 이긴다 */
};
/* 1) tool-results 파일 */
for (const f of fs.readdirSync(DIR).filter((f) => /get_design_context/.test(f)).sort()) {
  let items; try { items = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')); } catch (e) { continue; }
  if (!Array.isArray(items)) continue;
  take(items.filter((x) => x && typeof x.text === 'string').map((x) => x.text).find((t) => /export default function/.test(t)));
}
/* 2) 세션 기록 */
for (const ln of fs.readFileSync(JSONL, 'utf8').split('\n')) {
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
for (const id of WANT) {
  if (!found[id]) { console.log('없음', id); continue; }
  const key = id.replace(':', '-'), t = found[id];
  fs.writeFileSync(path.join(__dirname, 'dc-' + key + '.txt'), t);
  console.log(id, t.length, '자 · 에셋', (t.match(/^const (\w+) = "https:/gm) || []).length, '· 노드', (t.match(/data-node-id="/g) || []).length);
}
