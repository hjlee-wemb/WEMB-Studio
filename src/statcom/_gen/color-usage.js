/* 화면 CSS 에 쓰인 색을 역할별로 센다(라이트 표를 짜려고). 실행: node color-usage.js */
'use strict';
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '..', '..');
const files = fs.readdirSync(DIR).filter((f) => /^statcom-(?!live).*\.js$/.test(f));
const count = { bg: {}, text: {}, border: {}, shadow: {} };
for (const f of files) {
  const s = fs.readFileSync(path.join(DIR, f), 'utf8');
  const cut = s.indexOf('var LIGHT =');
  const css = cut > 0 ? s.slice(0, cut) : s;
  const rx = /(background-color|background-image|background|color|border[a-z-]*|box-shadow|filter):([^;}"]+)/g;
  let r;
  while ((r = rx.exec(css))) {
    const p = r[1];
    const role = p === 'color' ? 'text' : /border/.test(p) ? 'border' : /shadow|filter/.test(p) ? 'shadow' : 'bg';
    (r[2].match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g) || []).forEach((c) => {
      c = c.replace(/\s/g, '').toLowerCase();
      count[role][c] = (count[role][c] || 0) + 1;
    });
  }
}
for (const k of Object.keys(count)) console.log(k + ':', Object.entries(count[k]).sort((a, b) => b[1] - a[1]).map(([c, n]) => c + ' ' + n).join(' | '));
