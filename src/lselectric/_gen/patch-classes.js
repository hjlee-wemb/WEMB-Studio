/* 이 시안에만 나오는 것들을 conv.js 에 더한다(한 번만 돌린다).
   ① Tailwind 회전 유틸 -rotate-180 · -rotate-75 · -rotate-105 (알림 목록 접기 화살표 · 내비 회전 글리프)
   ② 시계 글꼴 Tomorrow — 원본이 헤더 날짜·시간을 Tomorrow 로 그린다. 저장소의 src/fonts/Tomorrow-*.ttf 를
      @font-face 로 싣는다(SK하이닉스 FMS Hub 와 같은 파일 · 같은 방식).
   실행: node src/lselectric/_gen/patch-classes.js */
'use strict';
const fs = require('fs'), path = require('path');
const p = path.join(__dirname, 'conv.js');
let s = fs.readFileSync(p, 'utf8');
const must = (find, val) => {
  if (s.indexOf(find) < 0) throw new Error('앵커 없음: ' + find);
  s = s.replace(find, () => val);
};
if (s.indexOf("case '-rotate-75'") < 0) {
  must("      case 'rotate-180': tr.push('rotate(180deg)'); continue;",
    "      case 'rotate-180': tr.push('rotate(180deg)'); continue;\n" +
    "      case '-rotate-180': tr.push('rotate(-180deg)'); continue;          /* 알림 목록 접기 화살표 */\n" +
    "      case '-rotate-75': tr.push('rotate(-75deg)'); continue;            /* 내비 회전(R) 글리프 */\n" +
    "      case '-rotate-105': tr.push('rotate(-105deg)'); continue;          /* 내비 회전(L) 글리프 */");
}
if (s.indexOf("font-family:'Tomorrow'") < 0) {
  must("  \"@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css');\",",
    "  \"@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css');\",\n" +
    "  \"@font-face{font-family:'Tomorrow';font-weight:400;font-style:normal;font-display:swap;src:url('{{B}}../fonts/Tomorrow-Regular.ttf') format('truetype');}\",");
}
fs.writeFileSync(p, s);
console.log('patched conv.js');
