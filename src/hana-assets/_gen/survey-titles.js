/* 등록 후보의 '화면에 찍힌 이름'을 뽑는다 — 스튜디오 표기는 Figma 영문이 아니라 화면 한글을 쓴다.
   사용: node src/hana-assets/_gen/survey-titles.js panel|chart|symbol                     */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const GEN = path.join(ROOT, 'src', 'hana', '_gen');
const SRC = path.join(ROOT, 'src');

const S = [
  ['hno2', 'hana-overview-02'], ['hnc1', 'hana-cloud-01'], ['hnc2', 'hana-cloud-02'],
  ['hnm', 'hana-middleware'], ['hni1', 'hana-infra-main'], ['hni2', 'hana-infra-detail'],
  ['hne', 'hana-event'], ['hnn1', 'hana-network-01'], ['hnn2', 'hana-network-02'],
  ['hnn3', 'hana-network-03'], ['hnf', 'hana-facility'], ['hns1', 'hana-security-01'],
  ['hns2', 'hana-security-02'], ['hnl', 'hana-login'],
];
const NODES = JSON.parse(fs.readFileSync(path.join(GEN, 'nodes.json'), 'utf8'));

function html(out) {
  const s = fs.readFileSync(path.join(SRC, out + '.js'), 'utf8');
  const m = /\n  var HTML = ("(?:[^"\\]|\\.)*");\n/.exec(s);
  return m ? JSON.parse(m[1]) : '';
}
/* 노드 서브트리 잘라내기(여는/닫는 태그 짝 세기) */
function sub(h, nid) {
  const at = h.indexOf('data-node-id="' + nid + '"');
  if (at < 0) return '';
  const start = h.lastIndexOf('<', at);
  const tag = (/^<([a-zA-Z0-9]+)/.exec(h.slice(start, start + 20)) || [])[1];
  if (!tag) return '';
  const open = new RegExp('<' + tag + '(?=[\\s>])', 'g'), close = new RegExp('</' + tag + '>', 'g');
  let depth = 0, i = start;
  while (i < h.length) {
    open.lastIndex = i; close.lastIndex = i;
    const o = open.exec(h), c = close.exec(h);
    if (!c) return '';
    if (o && o.index < c.index) { depth++; i = o.index + 1; continue; }
    depth--; i = c.index + 1;
    if (depth === 0) return h.slice(start, c.index + c[0].length);
  }
  return '';
}
/* 그 안의 첫 글자 몇 개 */
function texts(frag, n) {
  const out = [];
  for (const m of frag.matchAll(/>([^<>{}]{1,40})</g)) {
    const t = m[1].replace(/&amp;/g, '&').trim();
    if (t && !/^[\s.·|/]+$/.test(t)) out.push(t);
    if (out.length >= n) break;
  }
  return out;
}

const want = process.argv[2] || 'panel';
S.forEach(([px, out]) => {
  const h = html(out);
  const ids = [...new Set([...h.matchAll(/data-node-id="([^"]+)"/g)].map((m) => m[1]))];
  ids.forEach((nid) => {
    const meta = NODES[nid];
    if (!meta) return;
    const [name, w, hh] = meta;
    if (!name || !w || !hh) return;
    let cat = '';
    if (/^Widget\//.test(name) || /^Popup\//.test(name)) cat = 'panel';
    else if (/^(Donut|Gauge)\//.test(name) || /(Line|Bar|Donut|Gauge) ?Chart$/.test(name) || name === 'Chart') cat = 'chart';
    else if (/^(Node|Zone|Stage|Badge|Tab|Option|Menu Item|Item)\//.test(name)) cat = 'symbol';
    if (cat !== want) return;
    const frag = sub(h, nid);
    console.log(px.padEnd(5) + nid.padEnd(10) + (Math.round(w) + 'x' + Math.round(hh)).padEnd(11)
      + name.padEnd(34) + texts(frag, 3).join(' / ').slice(0, 46));
  });
});
