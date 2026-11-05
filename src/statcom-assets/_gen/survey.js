/* STATCOM 15화면 DOM 에서 노드별 이름 · 글자를 훑는다 — 등록 목록(mk-assets.js)의 이름을 화면 글자 그대로 짓기 위해.
   사용법:  node src/statcom-assets/_gen/survey.js <접두어> [깊이=4]   */
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const FILE = { tcm: 'main', tcs: 'statcom', tcp: 'power', tcv: 'valve', tcc: 'cooling', tce: 'supply', tcn: 'safety', tcu: 'simulation', tca: 'alarm', tcq: 'cards', tvt: 'vr-topic', tvo: 'vr-overview', tvs: 'vr-step', tvm: 'vr-menu', tcl: 'login' };
const px = process.argv[2];
const maxD = +(process.argv[3] || 4);
if (!FILE[px]) { console.error('사용: node survey.js <' + Object.keys(FILE).join('|') + '> [깊이]'); process.exit(1); }
global.window = {};
require(path.join(ROOT, 'src', 'statcom-' + FILE[px] + '.js'));
const html = window['build_' + px]('src/statcom/');
const re = /<(\/?)([a-zA-Z0-9]+)([^>]*?)(\/?)>|([^<]+)/g;
const VOID = /^(img|br|hr|input|meta|link|source|path|rect|circle|line|stop|use|ellipse|polygon|polyline)$/i;
const stack = [];
const nodes = [];
let m;
while ((m = re.exec(html))) {
  if (m[5]) {
    const t = m[5].replace(/\s+/g, ' ').trim();
    if (t) stack.forEach((s) => { if (s.n) s.n.text.push(t); });
    continue;
  }
  const [, close, tag, attrs, self] = m;
  if (close) { while (stack.length) { const s = stack.pop(); if (s.tag === tag) break; } continue; }
  const id = /data-node-id="([^"]+)"/.exec(attrs);
  const nm = /data-name="([^"]*)"/.exec(attrs);
  let n = null;
  if (id) {
    const d = stack.filter((s) => s.n).length;
    n = { id: id[1], name: nm ? nm[1] : '', d, text: [] };
    nodes.push(n);
  }
  if (!self && !VOID.test(tag)) stack.push({ tag, n });
}
nodes.filter((n) => n.d <= maxD).forEach((n) => {
  const t = n.text.join(' · ');
  console.log(' '.repeat(n.d) + n.id + '  ' + n.name + (t ? '  「' + (t.length > 70 ? t.slice(0, 70) + '…' : t) + '」' : ''));
});
