/* conv.js 보강 ③ — 인스턴스 이름 보존.
   design context 는 인스턴스 뿌리에 **컴포넌트 변형 이름**(`Device=Contractor Link Firewall`, `Type=Firewall`,
   `Step=Collapsed`)을 data-name 으로 준다. 화면에서 그 인스턴스의 실제 레이어명은 `Label/Contractor Link Firewall`,
   `Device/Backbone Switch`, `GNB (Expanded)` 다 → get_metadata 의 레이어명(META)으로 되돌린다(Figma 레이어명 = class/id 보존). */
'use strict';
const fs = require('fs'), path = require('path');
const P = path.join(__dirname, 'conv.js');
let c = fs.readFileSync(P, 'utf8');
if (c.includes('/* WNMS_NAMES */')) { console.log('이미 적용됨'); process.exit(0); }
const at = '  /* KOREA_MAP';
if (!c.includes(at)) throw new Error('자리 없음');
c = c.replace(at, [
  '  /* WNMS_NAMES — 변형 이름(키=값) 대신 화면의 레이어명 */',
  '  (function realNames(n) {',
  "    if (!n || n.tag === '#text') return;",
  '    const a = n.attrs || {};',
  "    const id = a['data-node-id'];",
  "    const dn = typeof a['data-name'] === 'string' ? a['data-name'] : '';",
  "    if (id && META[id] && META[id].name && (!dn || /^[\\w ]+=/.test(dn)) && META[id].name !== dn) a['data-name'] = META[id].name;",
  '    (n.children || []).forEach(realNames);',
  '  })(tree);',
  '',
  at].join('\n'));
fs.writeFileSync(P, c);
console.log('ok');
