/* get_design_context 응답을 화면 id 로 찾아 dc-<key>.txt 로 옮긴다(손으로 옮겨 적지 않는다).
   큰 응답은 tool-results 파일로, 작은 응답은 세션 기록(jsonl)에 대화로 왔다 → 둘 다 훑는다.
   use_figma 로 받은 노드 상자 덤프(@@meta <key> A)도 같이 meta-<key>.xml 로 만든다(mk-meta.js 와 같은 꼴).
   실행: node save-dc.js <세션 id> */
'use strict';
const fs = require('fs'), path = require('path');
const SID = process.argv[2];
const SES = 'C:/Users/wemb/.claude/projects/C--Users-wemb/' + SID;
const DIR = SES + '/tool-results';
const JSONL = SES + '.jsonl';
const WANT = ['427:674', '427:725', '427:959', '427:1003', '427:1364', '427:1781', '427:1536', '427:4038', '427:4307'];
const KEYOF = { '427:1536': 'tab-design', '427:4038': 'tab-equipment', '427:4307': 'tab-materials' };
const found = {};
const rootOf = (code) => {
  const m = code.slice(code.indexOf('export default function')).match(/return \(\s*<div[^>]*data-node-id="([^"]+)"/);
  return m && m[1];
};
const take = (code) => {
  if (code && code.indexOf('SUPER CRITICAL') > 0) code = code.slice(0, code.indexOf('SUPER CRITICAL'));
  if (!code || !/data-node-id="/.test(code) || !/export default function/.test(code)) return;
  if (!/\}\s*$/.test(code.trim())) return;
  const id = rootOf(code);
  if (id && WANT.includes(id)) found[id] = code.trim();
};
for (const f of fs.readdirSync(DIR)) {
  let items; try { items = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')); } catch (e) { continue; }
  if (!Array.isArray(items)) continue;
  take(items.filter((x) => x && typeof x.text === 'string').map((x) => x.text).find((t) => /export default function/.test(t)));
}
const TYPE = { FR: 'frame', IN: 'instance', GR: 'group', VE: 'vector', TE: 'text', RE: 'rectangle', EL: 'ellipse', BO: 'boolean', LI: 'line', CO: 'component' };
const q = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const metas = {};
const takeMeta = (txt) => {
  if (typeof txt !== 'string' || txt.indexOf('@@meta ') < 0) return;
  for (const part of txt.split(/(?=@@meta )/)) {
    const m = /^@@meta (\S+) (\w)\n([\s\S]*)$/.exec(part.trim());
    if (!m) continue;
    metas[m[1]] = m[3].split('\n').filter(Boolean).map((l) => {
      const f = l.split('|'); if (f.length < 7) return '';
      let id = f[1]; if (id.indexOf(':') < 0) id = '427:' + id;
      const name = f.slice(2, f.length - 4).join('|'); const [x, y, w, h] = f.slice(-4);
      return '<' + (TYPE[f[0]] || 'frame') + ' id="' + id + '" name="' + q(name) + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" />';
    }).filter(Boolean);
  }
};
for (const ln of fs.readFileSync(JSONL, 'utf8').split('\n')) {
  const hasDc = ln.includes('export default function') && ln.includes('data-node-id');
  const hasMeta = ln.includes('@@meta ');
  if (!hasDc && !hasMeta) continue;
  let o; try { o = JSON.parse(ln); } catch (e) { continue; }
  const c = o.message && o.message.content;
  if (!Array.isArray(c)) continue;
  for (const it of c) {
    if (it.type !== 'tool_result') continue;
    const parts = Array.isArray(it.content) ? it.content : [{ type: 'text', text: it.content }];
    for (const p of parts) {
      if (!p || p.type !== 'text') continue;
      if (/^(const \w+ = "https:|export default function)/.test(p.text)) take(p.text);
      if (p.text.indexOf('@@meta ') >= 0) takeMeta(p.text);
    }
  }
}
for (const id of WANT) {
  if (!found[id]) { console.log('없음', id); continue; }
  const key = KEYOF[id] || id.replace(':', '-'), t = found[id];
  fs.writeFileSync(path.join(__dirname, 'dc-' + key + '.txt'), t);
  console.log(id, t.length, '자 · 에셋', (t.match(/^const (\w+) = "https:/gm) || []).length, '· 노드', (t.match(/data-node-id="/g) || []).length);
}
for (const [k, lines] of Object.entries(metas)) {
  fs.writeFileSync(path.join(__dirname, 'meta-' + k + '.xml'), '<canvas>\n' + lines.join('\n') + '\n</canvas>\n');
  console.log('meta-' + k + '.xml', lines.length);
}
