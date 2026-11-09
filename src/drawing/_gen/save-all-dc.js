/* get_design_context 응답을 화면 id 로 찾아 dc-<key>.txt 로 옮긴다. 손으로 옮겨 적지 않는다.
   큰 응답은 tool-results 파일로, 작은 응답은 세션 기록(jsonl)에 대화로 왔다 → 둘 다 훑는다.
   get_metadata(0:1) 응답은 meta-page.xml 로 저장한다. */
'use strict';
const fs = require('fs'), path = require('path');
const SES = 'C:/Users/wemb/.claude/projects/C--Users-wemb/fa44579d-5fae-4446-b732-bfe2a32fb91a';
const DIR = SES + '/tool-results';
const JSONL = SES + '.jsonl';
const WANT = ['1:73', '1:105', '1:199', '1:298', '1:393', '1:1890', '1:2550', '1:2787', '1:2950', '1:3119', '1:3471', '1:3597', '1:3648', '1:3738', '1:3909', '1:6530', '1:6934', '1:7737', '1:9189'];
const found = {};
const rootOf = (code) => {
  const m = code.slice(code.lastIndexOf('export default function')).match(/return \(\s*<div[^>]*data-node-id="([^"]+)"/);
  return m && m[1];
};
const take = (code) => {
  if (!code || !/data-node-id="/.test(code) || !/export default function/.test(code)) return;
  if (!/\}\s*$/.test(code)) return;                   /* 잘린 응답은 버린다 */
  const id = rootOf(code);
  if (id && WANT.includes(id)) found[id] = code;      /* 뒤에 온 것(최신)이 이긴다 */
};
let meta = null, metaT = 0;
for (const f of fs.readdirSync(DIR).filter((f) => /\.(json|txt)$/.test(f))) {
  let items; try { items = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')); } catch (e) { continue; }
  if (!Array.isArray(items)) continue;
  const texts = items.filter((x) => x && typeof x.text === 'string').map((x) => x.text);
  take(texts.find((t) => /export default function/.test(t)));
  const xml = texts.find((t) => t.startsWith('<canvas id="0:1"'));
  const t = fs.statSync(path.join(DIR, f)).mtimeMs;
  if (xml && t > metaT) { meta = xml; metaT = t; }
}
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
if (meta) { fs.writeFileSync(path.join(__dirname, 'meta-page.xml'), meta); console.log('meta-page.xml', meta.length); } else console.log('메타 없음');
