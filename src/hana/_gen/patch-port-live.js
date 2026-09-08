/* 한진 인터랙션 엔진(src/hanjin-live.js)을 이 시안용으로 이식해 src/hana-live.js 를 만든다.
   반응형·호버·선택·라이브 machinery 는 그대로 쓰고 이름만 바꾼다(hj→hn, Hanjin→Hana).
   이 시안에만 있는 것들(시계 표기·이벤트 접기·라이브 연출·헤더 메뉴·위험 깜빡임·원판 낙하)은
   뒤이어 도는 patch-live → patch-live2 → patch-risk-blink → patch-disk-drop 가 얹는다.

   실행 순서:
     node patch-port-live.js && node patch-live.js && node patch-live2.js
       && node patch-risk-blink.js && node patch-disk-drop.js */
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', '..', 'hanjin-live.js');
const OUT = path.join(__dirname, '..', '..', 'hana-live.js');

let s = fs.readFileSync(SRC, 'utf8');
s = s.replace(/\bhj-/g, 'hn-')
  .replace(/hj([A-Z])/g, 'hn$1')
  .replace(/hanjin/g, 'hana')
  .replace(/Hanjin/g, 'Hana')
  .replace(/__hjLive/g, '__hnLive')
  .replace(/hjc|hjg|hju/g, 'hn');

fs.writeFileSync(OUT, s);
console.log('ported: hanjin-live.js -> hana-live.js |', s.split('\n').length, 'lines |',
  (s.match(/hj/g) || []).length, 'hj refs left');
