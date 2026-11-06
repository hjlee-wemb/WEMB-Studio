/* mk-dark-login.js 가 _gen 에 저장한 로그인 바탕 다크 사본을 src/wnms/ 로 옮긴다(dark-assets.json 의 이름 그대로). 실행: node mk-dark-login-move.js */
'use strict';
const fs = require('fs'), path = require('path');
for (const n of ['background-base', 'background-overlay']) {
  const src = path.join(__dirname, 'login-' + n + '-dk.jpg'), dst = path.join(__dirname, '..', n + '-dk.jpg');
  if (!fs.existsSync(src)) { console.log('없음', src); continue; }
  fs.copyFileSync(src, dst); fs.unlinkSync(src);
  console.log(n + '-dk.jpg', fs.statSync(dst).size);
}
