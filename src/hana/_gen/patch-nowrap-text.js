/* 원본에서 한 줄이던 글자가 브라우저에서 두 줄로 접히던 것 —
   ─────────────────────────────────────────────────────────────────────────────
   Figma 의 글자 상자는 글자 폭에 딱 맞게 잡혀 있다. 그 폭이 백분율(`w-[8.84%]`)로 넘어오는데,
   부모 폭이 원본보다 아주 조금이라도 좁으면 상자가 글자보다 좁아진다.
   여기에 Figma 가 얹어 둔 `word-break: break-word` 가 물려 내려와 **콜론에서도 잘라** 두 줄이 된다.
   네트워크현황 x축 마지막 눈금 `16:00` 이 그랬다 — 필요한 폭 29.97px, 받은 폭 29.89px, 딱 0.08px 모자랐다
   (원본 상자는 30.08px). 겨우 0.08px 때문에 눈금이 두 줄이 되고 판 아래로 흘러내렸다.

   → 원본에서 **한 줄이던** 글자(상자 높이가 한 줄 높이)에는 줄바꿈을 막는다.
     Figma 에서 안 접혔으니 여기서도 접히면 안 된다. 여러 줄이던 글자는 그대로 둔다.
     한 줄 여부를 알려면 글꼴 크기가 필요한데 대개 조상에서 물려받으므로 walk 로 같이 내린다. */
const fs = require('fs');
const path = require('path');
const F = path.join(__dirname, 'conv.js');
let s = fs.readFileSync(F, 'utf8');
const put = (find, val) => { s = s.replace(find, () => val); };

if (s.indexOf('parentFont') >= 0) { console.log('already patched'); process.exit(0); }

/* ① 글꼴 크기를 walk 로 물려 내린다 */
const SIG = '  function walk(node, depth, parentBorder, parentOnDark) {';
if (s.indexOf(SIG) < 0) { console.error('walk signature not found'); process.exit(1); }
put(SIG, '  function walk(node, depth, parentBorder, parentOnDark, parentFont) {');

const VSET = '        walk(tree, depth, parentBorder, parentOnDark);';
if (s.indexOf(VSET) < 0) { console.error('vset recursion not found'); process.exit(1); }
put(VSET, '        walk(tree, depth, parentBorder, parentOnDark, parentFont);');

const KIDS = '    node.children.forEach((c) => walk(c, depth + 1, kid, onDark));';
if (s.indexOf(KIDS) < 0) { console.error('child recursion not found'); process.exit(1); }
put(KIDS, '    node.children.forEach((c) => walk(c, depth + 1, kid, onDark, myFont));');

const ROOT = '  walk(tree, 1, null, false);';
if (s.indexOf(ROOT) < 0) { console.error('root call not found'); process.exit(1); }
put(ROOT, '  walk(tree, 1, null, false, null);');

/* ② 한 줄이던 글자는 접지 않는다 */
const OLD = [
  "    /* 텍스트 상자 고정 — <p> 뿐 아니라 text-box-trim 을 쓴 래퍼 div(원본이 text 노드인 것)도 대상 */",
  "    if ((node.tag === 'p' || (META[nid] && META[nid].tag === 'text')) && META[nid] && META[nid].w != null) {",
  '      const mw = META[nid].w, mh = META[nid].h;',
  "      const has = (p) => decls.some((x) => x[0] === p);",
].join('\n');
if (s.indexOf(OLD) < 0) { console.error('text fix anchor not found'); process.exit(1); }

put(OLD, [
  '    /* 이 노드에 적힌 글꼴 크기 — 없으면 조상에게서 물려받는다(자식에게도 이걸 내린다) */',
  "    const fsOwn = decls.find((x) => x[0] === 'font-size');",
  '    const myFont = fsOwn ? parseFloat(fsOwn[1]) : parentFont;',
  OLD,
].join('\n'));

const TAIL = '      textFixes++;\n    }';
if (s.indexOf(TAIL) < 0) { console.error('text fix tail not found'); process.exit(1); }
put(TAIL, [
  '      /* 원본에서 한 줄이던 글자는 여기서도 한 줄이라야 한다(위 주석 참고).',
  '         상자 높이가 글꼴 한 줄 높이면 원본에서 안 접힌 것이다 — 두 줄짜리는 2.3배쯤 되므로 안 걸린다. */',
  "      if (myFont && mh <= myFont * 1.6 && !has('white-space')) {",
  "        decls.push(['white-space', 'nowrap']);",
  '        nowrapFixes++;',
  '      }',
  '      textFixes++;',
  '    }',
].join('\n'));

/* ③ 집계 */
const CNT = 'let anon = 0, textFixes = 0, trimFixes = 0, isoFixes = 0,';
if (s.indexOf(CNT) < 0) { console.error('counter anchor not found (run patch-iso-plate.js first)'); process.exit(1); }
put(CNT, CNT.replace('isoFixes = 0,', 'isoFixes = 0, nowrapFixes = 0,'));

const STAT = 'texts: textFixes, trims: trimFixes, iso: isoFixes,';
if (s.indexOf(STAT) < 0) { console.error('stat anchor not found'); process.exit(1); }
put(STAT, 'texts: textFixes, trims: trimFixes, iso: isoFixes, nowrap: nowrapFixes,');

fs.writeFileSync(F, s);
console.log('patched conv.js: single-line Figma text never wraps');
