/* 스크롤 막대(Scrollbar · Thumb) 자리와 그 옆 목록을 찾는다. node scan-scroll.js */
'use strict';
const path = require('path');
for (const pg of ['main', 'menu', 'site', 'forklift', 'vibration', 'heat', 'event', 'history', 'sensor']) {
  global.window = {};
  require(path.join(__dirname, '..', '..', 'oneview-' + pg + '.js'));
  const k = Object.keys(window).find((x) => x.startsWith('build_'));
  const h = window[k]('');
  const names = [...h.matchAll(/data-name="([^"]*(Scroll|Thumb|Track)[^"]*)"/gi)].map((m) => m[1]);
  console.log(pg, [...new Set(names)].join(', '));
}
