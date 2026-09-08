/* conv.js 의 컴포넌트 파서를 '상태별 early return' 형태까지 읽도록 넓힌다.
   이 Figma 파일의 컴포넌트는 한진과 달리
     if (status === "hover") { return ( … ); }  …  return ( … );
   꼴로 나온다. 가지를 전부 모아 두고 펼칠 때 props 로 조건을 평가해 고른다. */
const fs = require('fs');
const path = require('path');
const F = path.join(__dirname, 'conv.js');
let s = fs.readFileSync(F, 'utf8');

const lines = s.split('\n');
const a = lines.findIndex((l) => l.includes('/* 본문: return ( … ); 까지 */'));
const b = lines.findIndex((l) => l.includes('comps[name] = { params, derived, jsx };'));
if (a < 0 || b < 0) { console.error('anchor not found', a, b); process.exit(1); }
const snippet = fs.readFileSync(path.join(__dirname, 'snippet-branches.txt'), 'utf8').replace(/\n$/, '').split('\n');
lines.splice(a, b - a + 1, ...snippet);
s = lines.join('\n');

const oldExp = '      out.push(...parseNodes(c.jsx, ctx, sc));';
if (s.indexOf(oldExp) < 0) { console.error('expand anchor not found'); process.exit(1); }
s = s.replace(oldExp, [
  '      /* 상태 분기 — props 로 실제 평가해 그 가지의 JSX 를 펼친다 */',
  '      const _b = (c.branches || []).find((x) => x.cond === null || evalExpr(x.cond, sc));',
  '      out.push(...parseNodes(_b ? _b.jsx : c.jsx, ctx, sc));',
].join('\n'));

fs.writeFileSync(F, s);
console.log('patched: multi-branch components');
