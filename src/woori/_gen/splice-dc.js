/* 화면 design context 는 응답이 100,000자에서 **잘린다** — 잘린 자리의 위젯을 따로 받아 통째로 갈아 끼운다(신한 splice-right 와 같은 장치).
   · 받은 원문을 손으로 옮기지 않는다 — 세션 기록 · tool-results 파일에서 그대로 옮긴 것을 쓴다.
   · 받은 쪽 에셋 상수 이름이 화면 dc 와 겹치면 다른 그림일 수 있어 전부 접두어를 붙여 합친다.

   성능현황 15:2      잘림: Table Row(17:1969) 안 → Table Row 안쪽 + Topology(18:2274)
   이벤트현황 19:2533  잘림: Widget/Event List(19:3339) 안 → Event List 안쪽 + Widget/Event Overview(25:4292)

   실행: node splice-dc.js   (dc-*.raw.txt · dc-part-*.txt 를 읽어 dc-15-2.txt · dc-19-2533.txt 를 만든다) */
'use strict';
const fs = require('fs'), path = require('path');
const GEN = __dirname;
const rd = (f) => fs.readFileSync(path.join(GEN, f), 'utf8');

/* 부분 응답 하나 → { consts, inner, rootOpen } — 상수 이름에 접두어를 붙이고 뿌리 안쪽만 꺼낸다 */
function part(file, tag) {
  let s = rd(file);
  s = s.slice(0, s.lastIndexOf('\n}') + 2);
  const names = [...s.matchAll(/^const (\w+) = "([^"]+)";$/gm)].map((m) => m[1]);
  for (const n of names) s = s.replace(new RegExp('\\b' + n + '\\b', 'g'), 'img' + tag + n.replace(/^img/, ''));
  const consts = [...s.matchAll(/^const \w+ = "[^"]+";$/gm)].map((m) => m[0]);
  const ret = s.indexOf('return (');
  const a = s.indexOf('<div', ret);
  let e = a, inStr = null, depth = 0;
  for (; e < s.length; e++) {
    const c = s[e];
    if (inStr) { if (c === '\\') { e++; continue; } if (c === inStr) inStr = null; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === '{') { depth++; continue; }
    if (c === '}') { depth--; continue; }
    if (!depth && c === '>') break;
  }
  const bodyEnd = s.lastIndexOf('</div>', s.lastIndexOf(');'));
  return { consts, rootOpen: s.slice(a, e + 1), inner: s.slice(e + 1, bodyEnd) };
}

/* 잘린 화면 dc 를 그 노드의 여는 태그 끝까지만 남긴다 */
function headUntil(raw, marker) {
  const at = raw.indexOf(marker);
  if (at < 0) throw new Error('자리를 못 찾았다: ' + marker);
  return raw.slice(0, at + marker.length);
}
function addConsts(head, consts) {
  const last = [...head.matchAll(/^const \w+ = "[^"]+";$/gm)].pop();
  const cut = last.index + last[0].length;
  return head.slice(0, cut) + (consts.length ? '\n' + consts.join('\n') : '') + head.slice(cut);
}
const tail = '\n    </div>\n  );\n}\n';

/* ── 성능현황 ── */
{
  const raw = rd('dc-15-2.raw.txt');
  const tr = part('dc-part-17-1969.txt', 'TR');
  const tp = part('dc-part-18-2274.txt', 'TP');
  let head = headUntil(raw, 'data-node-id="17:1969" data-name="Table Row">');
  head = addConsts(head, tr.consts.concat(tp.consts));
  /* Topology 는 뿌리가 contents — 자식 좌표가 화면 기준이라 그대로 얹는다 */
  const out = head + tr.inner + '</div>\n      <div className="absolute contents" data-node-id="18:2274" data-name="Topology">' + tp.inner + '</div>' + tail;
  fs.writeFileSync(path.join(GEN, 'dc-15-2.txt'), out);
  console.log('dc-15-2.txt', out.length, '자 · node-id', (out.match(/data-node-id="/g) || []).length);
}

/* ── 이벤트현황 ── */
{
  const raw = rd('dc-19-2533.raw.txt');
  const el = part('dc-part-19-3339.txt', 'EL');
  const ov = part('dc-part-25-4292.txt', 'OV');
  let head = headUntil(raw, 'data-node-id="19:3339" data-name="Widget/Event List">');
  head = addConsts(head, el.consts.concat(ov.consts));
  const out = head + el.inner + '</div>\n      <div className="absolute contents" data-node-id="25:4292" data-name="Widget/Event Overview">' + ov.inner + '</div>' + tail;
  fs.writeFileSync(path.join(GEN, 'dc-19-2533.txt'), out);
  console.log('dc-19-2533.txt', out.length, '자 · node-id', (out.match(/data-node-id="/g) || []).length);
}
