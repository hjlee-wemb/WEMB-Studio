/* 캔버스에서 직접 뽑아 둔 그림을 asset-map.json 에 못 박는다.

   왜 — dl.js 를 다시 돌리면 design context 가 준 **마스터 기본 그림**을 새로 받아 오고(내용이
   다르니 `line-2.svg` 처럼 번호가 붙는다) 참조가 그쪽으로 갈아 끼워진다. 그러면 patch-canvas-asset.js
   가 고쳐 둔 자리가 도로 원상복귀한다(README 함정 ④).
   여기서는 '이 화면의 이 변수는 이 파일' 을 표로 못 박는다.

   실행: node src/posco/_gen/pin-assets.js   (dl.js · dedupe-assets.js 뒤에 돌릴 것) */
'use strict';
const fs = require('fs');
const path = require('path');
const GEN = __dirname;

/* 제목 밑줄 — 자산정보현황 판(517px)을 가로지르는 쐐기. design context 는 마스터 기본(549.656)을
   주는데 그러면 밑줄이 판 끝까지 안 간다. 같은 판을 쓰는 세 화면에 캔버스 내보내기를 못 박는다. */
const PINS = {
  '2-18441': { imgLine: 'line.svg' },
  '39-9942': { imgLine: 'line.svg' },
  '40-10872': { imgLine: 'line.svg' },
  '1-9688': { imgLine: 'line.svg' },
};

const p = path.join(GEN, 'asset-map.json');
const map = JSON.parse(fs.readFileSync(p, 'utf8'));
let n = 0;
for (const scr of Object.keys(PINS)) {
  if (!map[scr]) continue;
  for (const [v, file] of Object.entries(PINS[scr])) {
    if (map[scr][v] === file) continue;
    if (!fs.existsSync(path.join(GEN, '..', file))) { console.log('없는 파일', file); continue; }
    console.log('pin', scr, v, map[scr][v], '->', file);
    map[scr][v] = file;
    n++;
  }
}
fs.writeFileSync(p, JSON.stringify(map, null, 1));
console.log('pinned', n);
