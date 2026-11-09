/* conv.js 보강 — design context 는 변형 기본 상태의 인스턴스를 함수 컴포넌트로 빼면서 뿌리의 data-name 을 빠뜨린다.
   Figma 레이어명 = class/id 를 지켜야 하므로 함수 이름 → 화면의 레이어명 표로 되찾는다(호버 · 화면 잇기도 이 이름을 쓴다). */
'use strict';
const fs = require('fs'), path = require('path');
const P = path.join(__dirname, 'conv.js');
let c = fs.readFileSync(P, 'utf8');
if (c.includes('/* DRAWING_FIX_C */')) { console.log('이미 적용됨'); process.exit(0); }
const at = "  const amap = ASSETMAP[S.key];";
if (!c.includes(at)) throw new Error('자리 없음');
const block = [
  '  /* DRAWING_FIX_C */',
  "  { const NM = { NavItemGnb: 'Nav Item/MY', ButtonEPId: 'Button/eP&ID', IconHeader: 'Icon/Header', SelectOffice: 'Select/Office', ButtonInputSmall: 'Button/Input Small', BadgeCount: 'Badge/Count', ButtonHelp: 'Button/Help', ButtonClose: 'Button/Close', Bookmark: 'Bookmark', IconButton: 'Icon/Button', Radio: 'Radio', PaginationPageSize: 'Pagination/Page Size', PaginationButton: 'Pagination/Button', ListItemCctvRoom: 'List Item/CCTV Room', ButtonPopupClose: 'Button/Popup Close', ButtonLogin: 'Button/Login', ButtonEPIdLink: 'Button/eP&ID Link' };",
  "    for (const fn of Object.keys(NM)) {",
  "      const i = src.indexOf('function ' + fn + '(');",
  "      if (i < 0) continue;",
  "      const m = /data-node-id=\"[^\"]+\"( data-name=\")?/.exec(src.slice(i));",
  "      if (!m || m[1]) continue;",
  "      const at2 = i + m.index + m[0].length;",
  "      src = src.slice(0, at2) + ' data-name=\"' + NM[fn].replace(/&/g, '&amp;') + '\"' + src.slice(at2);",
  "    }",
  "  }",
].join('\n');
c = c.split(at).join(block + '\n' + at);
fs.writeFileSync(P, c);
console.log('ok');
