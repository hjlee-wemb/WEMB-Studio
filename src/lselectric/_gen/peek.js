/* 생성물에서 CSS/LIGHT/HTML 조각을 들여다보는 도구.
   실행: node peek.js <파일> <css|light|html> [찾을문자열] [앞뒤글자수] */
'use strict';
const fs = require('fs');
const path = require('path');
const [file, what, needle, padArg] = process.argv.slice(2);
const p = path.isAbsolute(file) ? file : path.join(__dirname, '..', '..', file);
const src = fs.readFileSync(p, 'utf8');
const key = { css: 'var CSS = ', light: 'var LIGHT = ', html: 'var HTML = ' }[what || 'css'];
const at = src.indexOf(key);
if (at < 0) { console.error('못 찾음: ' + key); process.exit(1); }
const start = src.indexOf('"', at);
let i = start + 1;
for (; i < src.length; i++) {
  if (src[i] === '\\') { i++; continue; }
  if (src[i] === '"') break;
}
const text = JSON.parse(src.slice(start, i + 1));
console.log('len', text.length);
if (!needle) { console.log(text.slice(0, 1500)); process.exit(0); }
const pad = +(padArg || 200);
let n = 0;
let from = 0;
while (n < 12) {
  const k = text.indexOf(needle, from);
  if (k < 0) break;
  console.log('--- @' + k + ' ---');
  console.log(text.slice(Math.max(0, k - pad), k + pad));
  from = k + needle.length;
  n++;
}
console.log('hits', n);
