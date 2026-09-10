/* 미리보기 페이지도 스튜디오와 같은 것을 싣게 한다 — 발생시각 되찍기(src/recent-time.js).
   이게 없으면 미리보기에서만 표가 `2025-00-00` 자리표시자로 남아, 스튜디오와 달라 보인다.
   (hana-live.js 의 installRestamp 는 이 전역이 없으면 조용히 넘어간다) */
const fs = require('fs');
const path = require('path');
const F = path.join(__dirname, 'conv.js');
let s = fs.readFileSync(F, 'utf8');
const put = (find, val) => { s = s.replace(find, () => val); };

const OLD = "    '<script src=\"../hana-live.js?v=1\"></script>',";
if (s.indexOf(OLD) < 0) { console.error('preview script anchor not found'); process.exit(1); }
if (s.indexOf('recent-time.js') >= 0) { console.log('already patched'); process.exit(0); }

put(OLD, [
  "    '<script src=\"../recent-time.js?v=1\"></script>',",
  OLD,
].join('\n'));

fs.writeFileSync(F, s);
console.log('patched conv.js: previews load recent-time.js too');
