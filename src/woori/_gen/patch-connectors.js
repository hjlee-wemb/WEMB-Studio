/* 연결선 그림도 인라인으로 — 세 화살표(Arrow · Arrow_2 · Arrow_3)를 차례로 밝히려고.
   실행: node patch-connectors.js */
'use strict';
const fs = require('fs'), path = require('path');
const p = path.join(__dirname, 'conv.js');
let s = fs.readFileSync(p, 'utf8');
if (s.includes('connector-(terminal')) { console.log('이미 고침'); process.exit(0); }
const m = s.match(/const INLINE_RE = [^\n]*\n/);
if (!m) throw new Error('INLINE_RE 못 찾음');
s = s.replace(m[0], () => 'const INLINE_RE = /^(line-[\\w-]+|connector-(terminal|core|bank|mca|eai-fep)[\\w-]*)\\.svg$/;\n');
fs.writeFileSync(p, s);
console.log('conv.js 고침');
