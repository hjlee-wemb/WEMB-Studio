/* 캐릭터는 라이트 사본에서 뺀다 · 탭 아이콘 사본 · 2040 패널 안쪽 그림자. 한 번만. */
'use strict';
const fs = require('fs');
const rep = (s, a, b) => { if (!s.includes(a)) throw new Error('없음 ' + a); return s.replace(a, b); };
let m = fs.readFileSync('mk-light-newbiz.js', 'utf8');
m = m.replace(/\.filter\(\(x\) => [^)]*turbine-image[^)]*\)\.test\(x\)\)/, ".filter((x) => x === 'turbine-image.png')");
if (!m.includes("x === 'turbine-image.png'")) m = rep(m, ".filter((x) => /^turbine-image(-\\d+)?\\.png$/.test(x))", ".filter((x) => x === 'turbine-image.png')");
if (!m.includes('[/^type/')) m = rep(m, '[/^track/, {', "[/^type/, { 'white': '#7f96aa' }],\n  [/^track/, {");
fs.writeFileSync('mk-light-newbiz.js', m);
if (fs.existsSync('../turbine-image-1-lt.png')) fs.unlinkSync('../turbine-image-1-lt.png');
let s = fs.readFileSync('mk-screen-css.js', 'utf8');
s = rep(s, `L('[data-name="Widget/2040 Target"] > div:not([data-name]):last-child{background:none!important;box-shadow:none!important;}'),`,
  `L('[data-name="Widget/2040 Target"] > div:not([data-name]):not([class*="nb-"]):not(:first-child){background:none!important;box-shadow:none!important;}'),`);
s = rep(s, `L('[data-name^="Popup/"] > div:not([data-name]){background:#fff!important;background-image:none!important;box-shadow:none!important;}'),`,
  `L('[data-name^="Popup/"] > div:not([data-name]):not([class*="nb-"]){background:#fff!important;background-image:none!important;box-shadow:none!important;}'),`);
s = rep(s, `L('[data-name="Solar Panel Image"] img{filter:brightness(1.32)`, `L('[data-name="Character Image"] img{filter:drop-shadow(0 2px 4px rgba(24,60,96,.18));}'),
  L('[data-name="Solar Panel Image"] img{filter:brightness(1.32)`);
fs.writeFileSync('mk-screen-css.js', s);
console.log('ok');
