/* 고침 5 — 라이트 글자 대비: 모든 글자색을 밝은 판(#dbe6f1 근처) 기준 4.8:1 이 될 때까지 색상각을 지킨 채 어둡게 한다. 실행: node patch-fix5.js */
'use strict';
const fs = require('fs'), path = require('path');
const p = path.join(__dirname, 'light.js');
let s = fs.readFileSync(p, 'utf8');
if (s.includes('darkenText')) { console.log('이미 고침'); process.exit(0); }
const crlf = s.includes('\r\n');
s = s.replace(/\r\n/g, '\n');
const a = "    if (n === undefined) n = autoLight(key, role);\n";
if (!s.includes(a)) throw new Error('앵커');
s = s.replace(a, a + "    if (role === 'text') n = darkenText(n || key);\n");
const b = '/* 값 하나를 라이트로 옮긴다.';
s = s.replace(b, [
  '/* 밝은 판 위 글자 — 판(#dbe6f1, 휘도 0.78)에 4.8:1 이 안 나오면 색상각을 지킨 채 어둡게 */',
  'function lumOf(o) { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(o.r) + 0.7152 * f(o.g) + 0.0722 * f(o.b); }',
  'function darkenText(c) {',
  '  const o = parse(c); if (!o) return c;',
  '  const h = toHsl(o);',
  '  let cur = { r: o.r, g: o.g, b: o.b, a: 1 }, l = h.l;',
  '  while (lumOf(cur) > 0.127 && l > 0.05) { l -= 0.01; const x = fromHsl({ h: h.h, s: h.s, l, a: 1 }); cur = { r: x.r, g: x.g, b: x.b, a: 1 }; }',
  '  return out({ r: cur.r, g: cur.g, b: cur.b, a: o.a < 0.75 ? Math.max(o.a, 0.9) : o.a });',
  '}',
  '',
  b,
].join('\n'));
if (crlf) s = s.replace(/\n/g, '\r\n');
fs.writeFileSync(p, s);
console.log('ok');
