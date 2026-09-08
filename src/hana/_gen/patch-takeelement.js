/* takeElement 의 '자기닫힘' 판정을 고친다.
   기존 판정은 태그 시작 뒤 '첫 >' 를 태그 끝으로 봤는데, 이 파일은 속성 안에 '>' 가 들어 있다
   (style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg …>…\")" }} — Figma 가 그라디언트를
   인라인 SVG 로 낸다). 그래서 <div … /> 를 여는 태그로 잘못 세어 depth 가 한 칸 깊어지고,
   형제인 Content(1:5329)가 Header(1:5328) 안으로 빨려 들어가 top:calc(20%+35px) 이 80px 기준으로
   풀리면서 화면 전체가 200px 올라갔다.
   → 따옴표와 {} 를 존중하며 태그의 진짜 '>' 를 찾는다. */
const fs = require('fs');
const path = require('path');
const F = path.join(__dirname, 'conv.js');
let s = fs.readFileSync(F, 'utf8');

const OLD = [
  'function takeElement(s, i, tag) {',
  '  let depth = 1;',
  '  const start = i;',
  "  const re = tag ? new RegExp('<(/?)' + tag + '([\\\\s/>])', 'g') : /<(\\/?)>/g;",
  '  re.lastIndex = i;',
  '  let m;',
  '  while ((m = re.exec(s))) {',
  "    if (m[1]) { depth--; if (!depth) { const gt = s.indexOf('>', m.index); return { body: s.slice(start, m.index), end: gt + 1 }; } }",
  "    else if (!/\\/>/.test(s.slice(m.index, s.indexOf('>', m.index) + 1).slice(-2))) depth++;",
  '  }',
  '  return { body: s.slice(start), end: s.length };',
  '}',
].join('\n');

const NEW = [
  '/* 태그의 진짜 끝 — 따옴표(\'"`)와 {} 안의 > 는 세지 않는다.',
  '   Figma 는 그라디언트를 style={{ backgroundImage: "url(…<svg …>…)" }} 로 내보내므로',
  "   '첫 >' 를 태그 끝으로 보면 자기닫힘 판정이 틀어진다. */",
  'function tagEnd(s, i) {',
  '  let inStr = null, depth = 0;',
  '  for (let j = i; j < s.length; j++) {',
  '    const c = s[j];',
  '    if (inStr) { if (c === "\\\\") { j++; continue; } if (c === inStr) inStr = null; continue; }',
  '    if (c === \'"\' || c === "\'" || c === "`") { inStr = c; continue; }',
  '    if (c === "{") { depth++; continue; }',
  '    if (c === "}") { depth--; continue; }',
  '    if (depth > 0) continue;',
  '    if (c === ">") return { end: j + 1, self: s[j - 1] === "/" };',
  '  }',
  '  return { end: s.length, self: false };',
  '}',
  '',
  'function takeElement(s, i, tag) {',
  '  let depth = 1;',
  '  const start = i;',
  "  const re = tag ? new RegExp('<(/?)' + tag + '([\\\\s/>])', 'g') : /<(\\/?)>/g;",
  '  re.lastIndex = i;',
  '  let m;',
  '  while ((m = re.exec(s))) {',
  '    const t = tagEnd(s, m.index);',
  '    if (m[1]) { depth--; if (!depth) return { body: s.slice(start, m.index), end: t.end }; }',
  '    else if (!t.self) depth++;',
  '    if (t.end > re.lastIndex) re.lastIndex = t.end;',
  '  }',
  '  return { body: s.slice(start), end: s.length };',
  '}',
].join('\n');

if (s.indexOf(OLD) < 0) { console.error('takeElement anchor not found'); process.exit(1); }
s = s.replace(OLD, NEW);
fs.writeFileSync(F, s);
console.log('patched: takeElement quote/brace aware');
