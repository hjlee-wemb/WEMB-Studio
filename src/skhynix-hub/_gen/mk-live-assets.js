/* src/skhynix-hub-live.js 의 SVG-INLINE 블록을 원본 에셋으로 채운다.
   라디오 점·게이지 바늘·꺾은선 2종은 '값에 따라 움직여야' 해서 <img> 대신 인라인 SVG 로 바꿔 넣는데,
   file:// 에서는 fetch 가 막히므로 파일 내용을 모듈에 문자열로 박아 둔다(= 이 스크립트가 하는 일).

   node src/skhynix-hub/_gen/mk-live-assets.js */
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..');
const LIVE = path.join(__dirname, '..', '..', 'skhynix-hub-live.js');
const FILES = { radio: 'radio.svg', needle: 'needle.svg', lineYesterday: 'line-series.svg', lineToday: 'line-series-1.svg' };

const body = Object.keys(FILES).map((k) => {
  const raw = fs.readFileSync(path.join(DIR, FILES[k]), 'utf8').replace(/\r\n/g, '\n').trim();
  return '    ' + k + ': ' + JSON.stringify(raw) + ',';
}).join('\n');

const src = fs.readFileSync(LIVE, 'utf8');
const START = '/* SVG-INLINE-START */', END = '/* SVG-INLINE-END */';
const a = src.indexOf(START), b = src.indexOf(END);
if (a < 0 || b < 0) throw new Error('SVG-INLINE 마커를 찾지 못했다');
const out = src.slice(0, a) + START + '\n  var SVG = {\n' + body + '\n  };\n  ' + src.slice(b);
fs.writeFileSync(LIVE, out);
console.log('embedded:', Object.values(FILES).join(', '), '→ src/skhynix-hub-live.js');
