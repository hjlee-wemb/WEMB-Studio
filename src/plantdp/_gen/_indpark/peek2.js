/* data-name 으로 노드의 다크 CSS(D) 와 라이트 오버라이드(L) 를 함께 본다. node peek2.js <page> <px> "<name>" … [--all] */
'use strict';
const path = require('path');
global.window = {};
const args = process.argv.slice(2);
const all = args.includes('--all');
const [page, px, ...names] = args.filter((a) => a !== '--all');
require(path.join(__dirname, '..', '..', 'indpark-' + page + '.js'));
const G = px.toUpperCase();
const css = window[G + '_CSS'], lc = window[G + '_LIGHT_CSS'] || '';
const h = window['build_' + px]('');
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
for (const n of names) {
  const re = new RegExp('class="(\\S+)[^"]*" data-name="' + esc(n) + '"', 'g');
  let m, k = 0;
  while ((m = re.exec(h)) && (all || k < 1)) {
    k++;
    const c = m[1];
    console.log('■', n, c);
    for (const l of css.split('\n')) if (l.includes('.' + c + '{') || l.includes('.' + c + '::after{')) console.log('  D', l.slice(0, 360));
    for (const l of lc.split('\n')) if (l.includes('.' + c + '{') || l.includes('.' + c + '::after{')) console.log('  L', l.slice(0, 360));
    /* 자식 x 클래스(이름 없는 층) */
    const tail = h.slice(m.index, m.index + 900);
    const xs = [...new Set((tail.match(/class="(x\d+)"/g) || []).map((s) => s.slice(7, -1)))].slice(0, 4);
    for (const x of xs) {
      for (const l of css.split('\n')) if (l.includes('.' + x + '{')) console.log('    d', x, l.slice(0, 260));
      for (const l of lc.split('\n')) if (l.includes('.' + x + '{')) console.log('    l', x, l.slice(0, 260));
    }
  }
  if (!k) console.log('■', n, '(없음)');
}
