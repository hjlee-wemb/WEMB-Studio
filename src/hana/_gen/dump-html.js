/* 생성된 화면 모듈에서 HTML 문자열만 꺼내 파일로 떨어뜨린다(조사용).
   사용: node dump-html.js hana-cloud-01.js [출력경로] */
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', '..');
const file = process.argv[2] || 'hana-cloud-01.js';
const out = process.argv[3] || path.join(__dirname, '_dump-' + file.replace(/\.js$/, '') + '.html');
const s = fs.readFileSync(path.join(SRC, file), 'utf8');
const m = /\n  var HTML = ("(?:[^"\\]|\\.)*");\n/.exec(s);
if (!m) { console.error('HTML 문자열을 못 찾음'); process.exit(1); }
const html = JSON.parse(m[1]);
fs.writeFileSync(out, html);
console.log(out, html.length + ' chars');
