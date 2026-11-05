/* 글자 위치 보정은 글자 노드에만(메뉴 묶음이 통째로 밀렸다). 한 번만. */
'use strict';
const fs = require('fs'), path = require('path');
const f = path.join(__dirname, 'conv.js');
let c = fs.readFileSync(f, 'utf8');
const a = c.indexOf('    /* TEXT_FIT'), b = c.indexOf('    /* 텍스트 상자 고정 — <p> 뿐 아니라');
if (a < 0 || b < 0) throw new Error('자리 없음');
c = c.slice(0, a) + `    /* TEXT_FIT — 글자 크기 · trim 별 세로 보정(text-fit.json). 글자 노드에만 */
    if (TEXT_FIT && node.tag === 'p' && myFont) {
      const off = TEXT_FIT[myFont + (classes.some((x) => x.indexOf('text-box-trim') >= 0) ? 't' : '')];
      if (off && (off[0] || off[1])) decls.push(['translate', (off[0] || 0) + 'px ' + (off[1] || 0) + 'px']);
    }
` + c.slice(b);
fs.writeFileSync(f, c);
console.log('ok');
