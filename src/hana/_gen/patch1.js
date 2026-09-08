const fs = require('fs');
let s = fs.readFileSync('conv.js', 'utf8');
const lines = s.split('\n');
const a = lines.findIndex((l) => l.includes('/* 본문: return ( … ); 까지 */'));
const b = lines.findIndex((l) => l.includes('comps[name] = { params, derived, jsx };'));
if (a < 0 || b < 0) { console.error('anchor not found', a, b); process.exit(1); }
const NEW = [
  '    /* 본문 — 이 파일의 컴포넌트는 상태마다 일찍 돌려보낸다:',
  '         if (status === "hover") { return ( … ); } … return ( … );',
  '       가지를 전부 모아 두고, 펼칠 때 props 로 조건을 실제로 평가해 고른다(근사 없음). */',
  '    const bodyStart = re.lastIndex;',
  "    const endFn = src.indexOf('\n}\n', bodyStart);",
  '    const body = src.slice(bodyStart, endFn < 0 ? src.length : endFn);',
  '    const derived = [];',
  '    const branches = [];',
  '    let cur = 0;',
  '    for (;;) {',
  "      const r = body.indexOf('return (', cur);",
  '      if (r < 0) break;',
  '      const head = body.slice(cur, r);',
  '      if (!branches.length) for (const d of head.matchAll(/const (\w+) = ([^;]+);/g)) derived.push([d[1], d[2]]);',
  '      const ifs = [...head.matchAll(/if \(([^)]*)\)\s*\{/g)];',
  '      const cond = ifs.length ? ifs[ifs.length - 1][1] : null;',
  "      /* 닫는 자리 = return 과 같은 들여쓰기의 ');' 줄 */",
  "      const ls = body.lastIndexOf('\n', r) + 1;",
  '      const indent = body.slice(ls, r);',
  "      const close = body.indexOf('\n' + indent + ');', r);",
  '      const end = close < 0 ? body.length : close;',
  "      branches.push({ cond, jsx: body.slice(body.indexOf('<', r), end) });",
  '      cur = end + 1;',
  '    }',
  '    comps[name] = { params, derived, branches, jsx: branches.length ? branches[branches.length - 1].jsx : \'\' };',
];
lines.splice(a, b - a + 1, ...NEW);
s = lines.join('\n');
const oldExp = '      out.push(...parseNodes(c.jsx, ctx, sc));';
if (s.indexOf(oldExp) < 0) { console.error('exp anchor not found'); process.exit(1); }
s = s.replace(oldExp, [
  '      /* 상태 분기 — props 로 실제 평가해서 그 가지의 JSX 를 펼친다 */',
  '      const _b = (c.branches || []).find((x) => x.cond === null || evalExpr(x.cond, sc));',
  '      out.push(...parseNodes(_b ? _b.jsx : c.jsx, ctx, sc));',
].join('\n'));
fs.writeFileSync('conv.js', s);
console.log('patched ok');
