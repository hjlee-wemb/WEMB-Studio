/* 세션 기록(jsonl)과 tool-results 에서 get_design_context 결과를 찾아 dc-<key>.txt 로 옮긴다.
   대화로 바로 온(파일로 저장되지 않은) 결과도 jsonl 안에 원문이 있으므로 손으로 옮겨 적지 않는다.
   실행: node pull-dc.js <세션 jsonl> [tool-results 폴더] */
'use strict';
const fs = require('fs'), path = require('path');
const [jsonl, trDir] = process.argv.slice(2);
const KEYS = { '1:3': '1-3', '7:472': '7-472', '7:279': 'part-7-279' };
const found = {};
function take(text) {
  const ex = text.indexOf('export default function');
  if (ex < 0) return;
  const m = text.slice(ex).match(/return \(\s*<div[^>]*data-node-id="([^"]+)"/);
  if (!m || !KEYS[m[1]]) return;
  found[KEYS[m[1]]] = text;
}
function scanContent(c) {
  if (typeof c === 'string') { take(c); return; }
  if (Array.isArray(c)) { const t = c.filter((x) => x && typeof x.text === 'string').map((x) => x.text).join('\n'); if (t) take(t); c.forEach(scanContent); return; }
  if (c && typeof c === 'object') { if (typeof c.text === 'string') take(c.text); if (c.content) scanContent(c.content); if (c.message) scanContent(c.message); }
}
for (const line of fs.readFileSync(jsonl, 'utf8').split('\n')) {
  if (line.indexOf('export default function') < 0) continue;
  try { scanContent(JSON.parse(line)); } catch (e) {}
}
if (trDir) for (const f of fs.readdirSync(trDir)) {
  if (!/\.json$/.test(f)) continue;
  try { const it = JSON.parse(fs.readFileSync(path.join(trDir, f), 'utf8')); scanContent(it); } catch (e) {}
}
for (const [k, t] of Object.entries(found)) {
  /* 코드 항목만(첫 항목) — 뒤에 붙는 안내문은 버린다 */
  const end = t.lastIndexOf('\n}');
  const code = end > 0 ? t.slice(0, end + 2) : t;
  fs.writeFileSync(path.join(__dirname, 'dc-' + k + '.txt'), code);
  console.log(k, code.length, '자 · 에셋', (code.match(/^const \w+ = "https/gm) || []).length, '· 노드', (code.match(/data-node-id="/g) || []).length);
}
console.log('missing', Object.values(KEYS).filter((k) => !found[k]));
