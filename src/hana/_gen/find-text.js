/* 생성물 HTML 안에서 특정 문자열이 들어간 자리를 찾는다.
   usage: node find-text.js <src/hana-*.js> <찾을말> */
const fs = require('fs');
const path = require('path');
const [, , file, needle] = process.argv;
const s = fs.readFileSync(path.join(__dirname, '..', '..', '..', file), 'utf8');
const m = /\n  var HTML = ("(?:[^"\\]|\\.)*");\n/.exec(s);
if (!m) { console.error('HTML not found'); process.exit(1); }
const html = JSON.parse(m[1]);
const low = html.toLowerCase();
const q = needle.toLowerCase();
const hits = [];
let i = -1;
while ((i = low.indexOf(q, i + 1)) >= 0) hits.push(i);
console.log('occurrences:', hits.length, 'in', file);
hits.slice(0, 8).forEach((p) => {
  console.log('\n--- @' + p + ' ---');
  console.log(html.slice(Math.max(0, p - 320), p + 120).replace(/\n/g, ' '));
});
