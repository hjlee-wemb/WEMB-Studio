/* 이 시안에만 나오는 Tailwind 유틸을 conv.js 가 알아듣게 한다(근사 없이 1:1 번역).
     leading-none                         → line-height:1
     bg-top-left                          → background-position:top left
     bg-size-[168px_913.5px,auto_auto]    → background-size:168px 913.5px,auto auto
   ※ conv.js 는 CRLF 다 — 앵커는 정규식으로 잡는다(줄바꿈에 의존하지 않게).
   실행: node src/posco/_gen/patch-classes.js */
'use strict';
const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'conv.js');
let s = fs.readFileSync(p, 'utf8');
const nl = s.indexOf('\r\n') >= 0 ? '\r\n' : '\n';
let n = 0;

if (s.indexOf("case 'leading-none'") < 0) {
  const re = /( *case 'bg-center': set\('background-position', 'center'\); continue;)/;
  if (!re.test(s)) throw new Error('앵커를 못 찾았다 — conv.js 가 바뀌었는지 확인할 것');
  s = s.replace(re, (m, line) => line + nl +
    "      case 'leading-none': set('line-height', '1'); continue;" + nl +
    "      case 'bg-top-left': set('background-position', 'top left'); continue;" + nl +
    "      case 'bg-top': set('background-position', 'top'); continue;" + nl +
    "      case 'bg-left': set('background-position', 'left'); continue;");
  n++;
}

/* bg-size-[a_b,c_d] — 값 안의 `_` 는 공백, `,` 는 레이어 구분(arb() 가 처리한다) */
if (s.indexOf('bg-size-\\[') < 0) {
  const re2 = /( *if \(\/\^leading-\\\[\/\.test\(c\)\) \{ set\('line-height', arb\(c\)\); continue; \})/;
  if (!re2.test(s)) throw new Error('앵커2를 못 찾았다');
  s = s.replace(re2, (m, line) => line + nl +
    "    if (/^bg-size-\\[/.test(c)) { set('background-size', arb(c)); continue; }");
  n++;
}

fs.writeFileSync(p, s);
console.log('patched conv.js —', n, 'hunk');
