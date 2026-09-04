/* 게이지(하차진척률) 눈금을 실시간으로 움직이려면 '배경 호'와 '채움 호'를 따로 가려야 한다.
   원본 meter.svg 는 <g id="Track">(회색 호)와 <g id="Fill">(파란 호)이 한 파일에 들어 있어
   통째로 마스크하면 배경 호까지 잘린다. → 원본 벡터에서 그룹만 덜어낸 사본 두 장을 기계적으로 만든다.
   (손으로 그리는 게 아니라 원본 <path> 를 그대로 물려받는다. viewBox 가 같아 겹치면 원본과 동일.)
   실행: node src/hanjin/_gen/mk-gauge-assets.js  →  meter-track.svg · meter-fill.svg
   그 뒤 mk-light-assets.js 를 다시 돌려 라이트 사본까지 만든다. */
'use strict';
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '..');

/* <g id="NAME" …> … </g> 한 덩어리를 짝을 맞춰 잘라낸다(안쪽에도 <g> 가 있다) */
function cutGroup(svg, id) {
  const open = new RegExp('<g id="' + id + '"[^>]*>');
  const m = open.exec(svg);
  if (!m) throw new Error('group not found: ' + id);
  let i = m.index + m[0].length, depth = 1;
  const re = /<g\b[^>]*>|<\/g>/g;
  re.lastIndex = i;
  let t;
  while ((t = re.exec(svg))) {
    if (t[0] === '</g>') { depth--; if (!depth) return svg.slice(0, m.index) + svg.slice(t.index + 4); }
    else depth++;
  }
  throw new Error('unbalanced <g> for ' + id);
}

const src = fs.readFileSync(path.join(DIR, 'meter.svg'), 'utf8');
fs.writeFileSync(path.join(DIR, 'meter-track.svg'), cutGroup(src, 'Fill'));
fs.writeFileSync(path.join(DIR, 'meter-fill.svg'), cutGroup(src, 'Track'));
console.log('meter-track.svg / meter-fill.svg written from meter.svg');
