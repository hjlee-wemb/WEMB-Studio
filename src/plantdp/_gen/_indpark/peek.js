/* 생성된 화면에서 data-name 으로 노드 CSS 를 본다. 실행: node peek.js <page> <px> "<name>" … */
'use strict';
const path = require('path');
global.window = {};
const [page, px, ...names] = process.argv.slice(2);
require(path.join(__dirname, '..', '..', 'indpark-' + page + '.js'));
const css = window[px.toUpperCase() + '_CSS'];
const h = window['build_' + px]('');
for (const n of names) {
  const re = new RegExp('<(\\w+) id="[^"]*" class="(\\S+)[^"]*" data-name="' + n.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&') + '"', 'g');
  let m, k = 0;
  while ((m = re.exec(h)) && k < 2) {
    k++;
    const rr = css.split('\n').filter((l) => l.indexOf('.' + m[2] + '{') >= 0 || l.indexOf('.' + m[2] + '::after{') >= 0);
    console.log('■', n, m[1], m[2], '\n   ' + rr.join('\n   ').slice(0, 500));
  }
  if (!k) console.log('■', n, '(없음)');
}
