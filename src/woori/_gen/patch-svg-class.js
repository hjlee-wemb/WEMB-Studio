/* 인라인 SVG 도형 클래스에 파일 이름을 넣는다 — 도형 id 가 모두 'Line' 인 그림이 여럿이라(line-fep · line-eai …)
   클래스를 'id 만'으로 지으면 마지막 파일의 선 색이 전부를 덮어 시간별 발생 다섯 줄이 한 색이 됐다.
   실행: node patch-svg-class.js */
'use strict';
const fs = require('fs'), path = require('path');
const p = path.join(__dirname, 'conv.js');
let s = fs.readFileSync(p, 'utf8');
const A = "const uc2 = PX + '-svg-' + nm;";
if (!s.includes(A)) { console.log('이미 고침'); process.exit(0); }
s = s.split(A).join("const uc2 = PX + '-svg-' + slug(file.replace(/\\.svg$/, '')) + '-' + nm;");
fs.writeFileSync(p, s);
console.log('conv.js 고침');
