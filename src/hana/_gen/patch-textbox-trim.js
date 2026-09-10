/* `text-box-trim` 은 상속되지 않는다 — 글자를 직접 담은 상자에만 걸린다.
   그런데 Figma 는 트림 클래스를 **바깥 래퍼**(flex flex-col justify-center)에 적고
   글자는 그 안의 <p leading-normal> 에 넣는다. 그대로 옮기면 래퍼에만 걸려 아무 일도 없고,
   상자 높이가 글꼴 줄상자(36px→43px) 그대로 남는다.
   클라우드현황 성능 TOP10 이 그래서 줄마다 10px 씩 두꺼워져(33→43) 10줄에 100px 이 밀리고
   판이 아래 카드 위로 침범했다.
   → 트림을 쓴 규칙에는 자식 <p>·<span> 에도 같은 트림을 걸어 주는 규칙을 함께 낸다. */
const fs = require('fs');
const path = require('path');
const F = path.join(__dirname, 'conv.js');
let s = fs.readFileSync(F, 'utf8');
const put = (find, val) => { s = s.replace(find, () => val); };

if (s.indexOf('trimPropagate') >= 0) { console.log('already patched'); process.exit(0); }

const OLD = "    if (decls.length) rules.push(ROOT + ' .' + uc + '{' + decls.map(([p, v]) => p + ':' + v).join(';') + '}');";
if (s.indexOf(OLD) < 0) { console.error('rule emit anchor not found'); process.exit(1); }

put(OLD, [
  '    if (decls.length) {',
  "      rules.push(ROOT + ' .' + uc + '{' + decls.map(([p, v]) => p + ':' + v).join(';') + '}');",
  '      /* 트림은 상속되지 않는다 — 글자를 담은 자식에도 같이 걸어 준다.',
  '         단 **줄이 하나일 때만** 건다. trim-both 는 덩어리의 첫 줄 위와 마지막 줄 아래만 깎는데,',
  '         Figma 는 두 줄짜리 글자를 <p> 두 개로 쪼개 내므로 줄마다 걸면 줄 사이 여백이 사라져',
  '         글자가 서로 붙어 버린다(네트워크현황 CD-AOC-/APML01 이 그랬다).',
  '         여러 줄짜리는 손대지 않는 게 원본과 같다 — 줄 간격이 그대로 12px 로 유지된다. */',
  "      const trimV = decls.filter(([p]) => p === 'text-box-trim')[0];",
  "      const edgeV = decls.filter(([p]) => p === 'text-box-edge')[0];",
  "      if (trimV && String(trimV[1]).indexOf('trim-') === 0 && node.tag !== 'p') {",
  "        const only = ':first-of-type:last-of-type';                 /* 그 종류의 자식이 하나뿐일 때 */",
  "        const body = 'text-box-trim:' + trimV[1] + (edgeV ? ';text-box-edge:' + edgeV[1] : '');",
  "        rules.push(ROOT + ' .' + uc + '>p' + only + ',' + ROOT + ' .' + uc + '>span' + only + '{' + body + '}');",
  '        trimFixes++;',
  '      }',
  '    }',
].join('\n'));

/* 집계 카운터 */
const CNT = 'let anon = 0, textFixes = 0,';
if (s.indexOf(CNT) < 0) { console.error('counter anchor not found'); process.exit(1); }
put(CNT, 'let anon = 0, textFixes = 0, trimFixes = 0,');

/* 리포트에 끼워 넣는다 */
const STAT = 'texts: textFixes,';
if (s.indexOf(STAT) < 0) { console.error('stat anchor not found'); process.exit(1); }
put(STAT, 'texts: textFixes, trims: trimFixes,');

fs.writeFileSync(F, s);
console.log('patched conv.js: text-box-trim propagated to text children');
