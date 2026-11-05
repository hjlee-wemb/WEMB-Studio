/* ① 라이트 — 화면 바탕색이 라이브러리 사본(.hj-asset)에도 깔려 넣은 심볼 뒤에 회색 네모가 생겼다 → 바탕은 화면에만
   ② drop-check — 넣은 패널은 클릭해 고른 것만 글자를 고친다. 한 번만. */
'use strict';
const fs = require('fs'), path = require('path');
const rep = (s, a, b) => { if (!s.includes(a)) throw new Error('없음 ' + a); return s.replace(a, b); };
const L = path.join(__dirname, '..', '..', 'newbiz', '_gen', 'light.js');
let l = fs.readFileSync(L, 'utf8');
l = rep(l, "const rules = [R + '{background:#eef3f7;color:#15253a;}'];", "const rules = [R + ':not(.hj-asset){background:#eef3f7;}', R + '{color:#15253a;}'];");
fs.writeFileSync(L, l);
let d = fs.readFileSync(path.join(__dirname, 'drop-check.js'), 'utf8');
d = rep(d, "  out.editable = await p.evaluate(() => { const ps = [...document.querySelectorAll('#dtStage .hj-asset p')]; return [ps.filter((x) => x.isContentEditable).length, ps.length]; });",
  `  const c = await p.evaluate(() => { const a = document.querySelector('#dtStage .nbw-root.hj-asset'); const b = a.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height - 10]; });
  await p.mouse.click(c[0], c[1]);
  await p.waitForTimeout(500);
  out.editable = await p.evaluate(() => { const a = document.querySelector('#dtStage .nbw-root.hj-asset'); const ps = [...a.querySelectorAll('p')]; return { clicked: [ps.filter((x) => x.isContentEditable).length, ps.length], screen: [...document.querySelectorAll('#dtStage .nbw-root:not(.hj-asset) p')].filter((x) => !x.closest('.hj-asset') && x.isContentEditable).length }; });`);
fs.writeFileSync(path.join(__dirname, 'drop-check.js'), d);
console.log('ok');
