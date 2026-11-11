/* use_figma 로 읽은 노드 상자(화면마다 · 응답 한도 48KB 라 나눠 받음) → meta-<key>.xml (conv.js 의 텍스트 상자 고정용).
   세션 기록(jsonl)에서 `@@meta <key> A|B`(압축: 종류|id|이름|x|y|w|h) · `<!--meta <key>-->`(XML) 묶음을 꺼낸다.
   실행: node mk-meta.js <session.jsonl> */
'use strict';
const fs = require('fs'), path = require('path');
const src = process.argv[2];
const TYPE = { FR: 'frame', IN: 'instance', GR: 'group', VE: 'vector', TE: 'text', RE: 'rectangle', EL: 'ellipse', BO: 'boolean', LI: 'line', SE: 'section', CO: 'component', PO: 'polygon', ST: 'star' };
const q = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const blocks = {};
const take = (txt) => {
  if (typeof txt !== 'string') return;
  for (const part of txt.split(/(?=@@meta |<!--meta )/)) {
    let m = /^@@meta (\S+) (\w)\n([\s\S]*)$/.exec(part.trim());
    if (m) {
      const lines = m[3].split('\n').filter(Boolean).map((l) => {
        const f = l.split('|');
        if (f.length < 7) return '';
        const name = f.slice(2, f.length - 4).join('|');
        const [x, y, w, h] = f.slice(-4);
        return '<' + (TYPE[f[0]] || 'frame') + ' id="' + f[1] + '" name="' + q(name) + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" />';
      }).filter(Boolean);
      (blocks[m[1]] = blocks[m[1]] || {})[m[2]] = lines;
      continue;
    }
    m = /^<!--meta (\S+)-->\n([\s\S]*)$/.exec(part.trim());
    if (m) (blocks[m[1]] = blocks[m[1]] || {}).X = m[2].split('\n').filter((l) => l.startsWith('<'));
  }
};
for (const ln of fs.readFileSync(src, 'utf8').split('\n')) {
  if (ln.indexOf('@@meta ') < 0 && ln.indexOf('<!--meta ') < 0) continue;
  let o; try { o = JSON.parse(ln); } catch (e) { continue; }
  const c = o.message && o.message.content;
  if (!Array.isArray(c)) continue;
  for (const it of c) {
    if (it.type !== 'tool_result') continue;
    const parts = Array.isArray(it.content) ? it.content : [{ type: 'text', text: it.content }];
    parts.forEach((p) => p && p.type === 'text' && take(p.text));
  }
}
for (const [k, b] of Object.entries(blocks)) {
  const lines = [].concat(b.X || [], b.A || [], b.B || []);
  fs.writeFileSync(path.join(__dirname, 'meta-' + k + '.xml'), '<canvas>\n' + lines.join('\n') + '\n</canvas>\n');
  console.log('meta-' + k + '.xml', lines.length);
}
