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
  '      /* 트림은 상속되지 않는다 — 글자를 담은 자식에도 같이 건다(자식이 없으면 아무 일도 없다) */',
  "      const trimPropagate = decls.filter(([p]) => p === 'text-box-trim' || p === 'text-box-edge');",
  '      if (trimPropagate.length && node.tag !== \'p\') {',
  "        rules.push(ROOT + ' .' + uc + '>p,' + ROOT + ' .' + uc + '>span{'",
  "          + trimPropagate.map(([p, v]) => p + ':' + v).join(';') + '}');",
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
