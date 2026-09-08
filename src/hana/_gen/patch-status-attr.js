/* 컴포넌트를 펼칠 때 그 자리의 상태값(status/type)을 DOM 에 남긴다 → `data-hn-status`.
   원본 시안에는 상태가 '어떤 그림을 쓰느냐'로만 박제돼 있어서, 재구축한 DOM 만 보고는
   그 심볼이 정상인지 위험인지 알 수 없었다. 상태를 속성으로 남겨 두면
   hana-live.js 가 위험 상태(warning·major·critical)만 골라 깜빡이게 할 수 있다.
   형상은 하나도 바뀌지 않는다 — 속성 한 줄만 더 붙는다. */
const fs = require('fs');
const path = require('path');
const F = path.join(__dirname, 'conv.js');
let s = fs.readFileSync(F, 'utf8');

/* ① 컴포넌트를 펼친 결과의 첫 요소에 상태를 표시해 둔다 */
const A = [
  '      /* 상태 분기 — props 로 실제 평가해 그 가지의 JSX 를 펼친다 */',
  '      const _b = (c.branches || []).find((x) => x.cond === null || evalExpr(x.cond, sc));',
  '      out.push(...parseNodes(_b ? _b.jsx : c.jsx, ctx, sc));',
].join('\n');
const B = [
  '      /* 상태 분기 — props 로 실제 평가해 그 가지의 JSX 를 펼친다 */',
  '      const _b = (c.branches || []).find((x) => x.cond === null || evalExpr(x.cond, sc));',
  '      const _ex = parseNodes(_b ? _b.jsx : c.jsx, ctx, sc);',
  "      /* 이 자리의 상태를 DOM 에 남긴다(위험 심볼만 골라 깜빡이게 하려고). 오타 prop `stauts` 도 받는다. */",
  "      const _st = [sc.status, sc.stauts].find((v) => typeof v === 'string' && v);",
  '      if (_st) {',
  "        const _first = _ex.find((n) => n && n.tag && n.tag !== '#text');",
  '        if (_first) {',
  '          _first.__status = _st;',
  "          if (typeof sc.type === 'string' && sc.type) _first.__vtype = sc.type;",
  '        }',
  '      }',
  '      out.push(..._ex);',
].join('\n');
if (s.indexOf(A) < 0) { console.error('expand anchor not found'); process.exit(1); }
s = s.replace(A, B);

/* ② 속성으로 내보낸다 */
const C = "    if (nid) attrs.push('data-node-id=\"' + nid + '\"');";
if (s.indexOf(C) < 0) { console.error('attr anchor not found'); process.exit(1); }
s = s.replace(C, C + '\n'
  + "    /* 이 심볼이 어떤 상태로 박제돼 있는지 — 위험 상태만 hana-live.js 가 깜빡이게 한다 */\n"
  + "    if (node.__status) attrs.push('data-hn-status=\"' + escAttr(node.__status) + '\"');\n"
  + "    if (node.__vtype) attrs.push('data-hn-type=\"' + escAttr(node.__vtype) + '\"');");

fs.writeFileSync(F, s);
console.log('patched: data-hn-status / data-hn-type');
