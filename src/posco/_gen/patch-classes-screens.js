/* 나머지 다섯 화면(메인팝업·종합현황·출입동선·전체층·단층)에만 나오는 Tailwind 유틸을
   conv.js 가 알아듣게 한다(근사 없이 1:1 번역).

     to-black     → 그라디언트 끝색 #000000  (팝업 막·표 그라데이션에 쓰인다)
     top-1/4      → top:25%
     inset-1/4    → inset:25%
     left-px      → left:1px

   ※ 안 알아들으면 conv.js 가 `!! UNKNOWN CLASSES` 로 이름과 횟수를 찍는다 — 그때 여기에 더한다.
   ※ conv.js 는 CRLF 다 — 앵커는 정규식으로 잡는다.
   실행: node src/posco/_gen/patch-classes-screens.js */
'use strict';
const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'conv.js');
let s = fs.readFileSync(p, 'utf8');
const nl = s.indexOf('\r\n') >= 0 ? '\r\n' : '\n';
let n = 0;

if (s.indexOf("case 'to-black'") < 0) {
  const re = /( *case 'to-white': gTo = '#ffffff'; continue;)/;
  if (!re.test(s)) throw new Error('앵커를 못 찾았다 — conv.js 가 바뀌었는지 확인할 것');
  s = s.replace(re, (m, line) => line + nl +
    "      case 'from-black': gFrom = '#000000'; continue;" + nl +
    "      case 'to-black': gTo = '#000000'; continue;");
  n++;
}

if (s.indexOf("case 'top-1/4'") < 0) {
  const re = /( *case 'bottom-1\/4': set\('bottom', '25%'\); continue;)/;
  if (!re.test(s)) throw new Error('앵커2를 못 찾았다');
  s = s.replace(re, (m, line) => line + nl +
    "      case 'top-1/4': set('top', '25%'); continue;" + nl +
    "      case 'left-1/4': set('left', '25%'); continue;" + nl +
    "      case 'right-1/4': set('right', '25%'); continue;" + nl +
    "      case 'inset-1/4': set('inset', '25%'); continue;");
  n++;
}

if (s.indexOf("case 'left-px'") < 0) {
  const re = /( *case 'w-px': set\('width', '1px'\); continue;)/;
  if (!re.test(s)) throw new Error('앵커3을 못 찾았다');
  s = s.replace(re, (m, line) =>
    "      case 'left-px': set('left', '1px'); continue;" + nl +
    "      case 'top-px': set('top', '1px'); continue;" + nl + line);
  n++;
}

fs.writeFileSync(p, s);
console.log('patched conv.js —', n, 'hunk');
