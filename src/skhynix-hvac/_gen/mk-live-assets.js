/* src/skhynix-hvac-live.js 안의 SVG 상수 블록을 원본 에셋에서 다시 만든다.
   file:// 로 열면 fetch 가 막히므로, '값에 따라 움직여야 하는' 에셋만 모듈에 문자열로 박아 둔다.
   (움직일 필요가 없는 나머지는 그대로 <img> 로 둔다 — 파일이 곧 원본이다.)

   사용법:  node src/skhynix-hvac/_gen/mk-live-assets.js
*/
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..');                       /* src/skhynix-hvac */
const LIVE = path.join(__dirname, '..', '..', 'skhynix-hvac-live.js');

/* 인라인으로 바꿔 넣는 에셋 — 키 = live 모듈에서 쓰는 이름 */
const WANT = {
  radio: 'radio.svg',   /* AUTO 라디오 점을 켜고 끈다 */
  lines: 'lines.svg',   /* 시간대별 이벤트 꺾은선 4계열 */
  arc: 'arc.svg',       /* 센터별 이벤트 도넛 조각 4개 */
};

const body = Object.keys(WANT).map((k) => {
  const src = fs.readFileSync(path.join(DIR, WANT[k]), 'utf8').trim();
  return '    ' + k + ': ' + JSON.stringify(src) + ',';
}).join('\n');

let live = fs.readFileSync(LIVE, 'utf8');
const S = '/* SVG-INLINE-START */', E = '/* SVG-INLINE-END */';
const a = live.indexOf(S), b = live.indexOf(E);
if (a < 0 || b < 0) throw new Error('SVG-INLINE 마커를 찾지 못했다');
live = live.slice(0, a) + S + '\n  var SVG = {\n' + body + '\n  };\n  ' + live.slice(b);
fs.writeFileSync(LIVE, live);
console.log('inlined', Object.keys(WANT).join(', '), '→ src/skhynix-hvac-live.js');
