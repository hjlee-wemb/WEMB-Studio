/* 미리보기(_gen 검증용 html)가 스튜디오와 같은 글꼴을 쓰게 한다.
   index.html 은 Pretendard 를 CDN 으로 싣는데 미리보기에는 그 줄이 없어서
   대체 글꼴(맑은 고딕)로 그려졌다 — 그대로 픽셀 대조를 하면 글자마다 어긋난다.
   실행: node src/posco/_gen/patch-preview.js */
'use strict';
const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'conv.js');
let s = fs.readFileSync(p, 'utf8');

const anchor = "'<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">',";
if (s.indexOf(anchor) < 0) throw new Error('앵커를 못 찾았다');
if (s.indexOf('pretendardvariable.min.css') < 0) {
  s = s.replace(anchor, () => anchor + '\n' +
    "    '<link rel=\"stylesheet\" crossorigin href=\"https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css\">',");
  fs.writeFileSync(p, s);
  console.log('patched conv.js — 미리보기에 Pretendard CDN 추가');
} else {
  console.log('이미 반영돼 있다');
}
