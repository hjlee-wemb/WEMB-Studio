/* `{A && B && <img/>}` 처럼 조건이 이어지는 형태를 바로잡는다.
   기존 splitAnd 는 **첫** `&&` 에서 잘라서 cond=`A`, body=`B && <img/>` 를 만들었고,
   그 body 를 JSX 로 파싱하는 바람에 `status === "Default" &&` 가 **글자로 화면에 찍혔다**
   (종합현황 주요거래 플로우의 서버 심볼 뒤에 겹쳐 보이던 그 글씨).
   → 오른쪽이 JSX 인 **마지막** `&&` 에서 자른다. 조건은 `A && B` 로 통째로 평가한다. */
const fs = require('fs');
const path = require('path');
const F = path.join(__dirname, 'conv.js');
let s = fs.readFileSync(F, 'utf8');

const OLD = [
  'function splitAnd(raw) {',
  '  let d = 0;',
  '  for (let i = 0; i < raw.length - 1; i++) {',
  '    const c = raw[i];',
  "    if (c === '\"' || c === \"'\") { const q = c; i++; while (i < raw.length && raw[i] !== q) i++; continue; }",
  "    if (c === '(' || c === '[') d++;",
  "    else if (c === ')' || c === ']') d--;",
  "    else if (!d && c === '&' && raw[i + 1] === '&') {",
  '      let b = raw.slice(i + 2).trim();',
  "      if (b[0] === '(') b = b.slice(1, b.lastIndexOf(')'));",
  '      return { cond: raw.slice(0, i).trim(), body: b };',
  '    }',
  '  }',
  '  return null;',
  '}',
].join('\n');

const NEW = [
  'function splitAnd(raw) {',
  '  /* 괄호 밖(top-level)의 && 자리를 모두 모은다 */',
  '  const tops = [];',
  '  let d = 0;',
  '  for (let i = 0; i < raw.length - 1; i++) {',
  '    const c = raw[i];',
  "    if (c === '\"' || c === \"'\" || c === '`') { const q = c; i++; while (i < raw.length && raw[i] !== q) { if (raw[i] === '\\\\') i++; i++; } continue; }",
  "    if (c === '(' || c === '[') d++;",
  "    else if (c === ')' || c === ']') d--;",
  "    else if (!d && c === '&' && raw[i + 1] === '&') { tops.push(i); i++; }",
  '  }',
  '  if (!tops.length) return null;',
  '  /* 오른쪽이 JSX 인 **마지막** && 에서 자른다.',
  '     `type === "server" && status === "Default" && <img/>` 를 첫 && 에서 자르면',
  "     남은 `status === \"Default\" && <img/>` 가 JSX 로 파싱돼 조건식이 글자로 새어 나온다. */",
  '  let at = -1;',
  '  for (const p of tops) {',
  '    const r = raw.slice(p + 2).trim();',
  "    if (r[0] === '(' || r[0] === '<') at = p;",
  '  }',
  '  if (at < 0) at = tops[0];',
  '  let b = raw.slice(at + 2).trim();',
  "  if (b[0] === '(') b = b.slice(1, b.lastIndexOf(')'));",
  '  return { cond: raw.slice(0, at).trim(), body: b };',
  '}',
].join('\n');

if (s.indexOf(OLD) < 0) { console.error('splitAnd anchor not found'); process.exit(1); }
s = s.replace(OLD, NEW);
fs.writeFileSync(F, s);
console.log('patched: splitAnd — chained && with JSX tail');
