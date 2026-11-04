/* VR 추가분 ?v= 올리기 · 썸네일 작업 추가. 실행: node bump-vr.js (한 번만) */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const bump = (file, names) => {
  const p = path.join(ROOT, file);
  let s = fs.readFileSync(p, 'utf8');
  names.forEach((f) => {
    const re = new RegExp(f.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&') + '\\?v=(\\d+)');
    if (!re.test(s)) throw new Error(file + ' ' + f);
    s = s.replace(re, (m, n) => f + '?v=' + (+n + 1));
  });
  fs.writeFileSync(p, s);
};
bump('studio.html', ['js/core/tpl-modules.js', 'js/templates/image.js', 'js/studio/dt-edit.js', 'js/studio/atom-swap.js', 'js/templates/statcom.js']);
bump('index.html', ['js/launcher/templates.js', 'js/launcher/home.js']);
bump('js/core/tpl-modules.js', ['src/statcom-live.js']);
const t = path.join(__dirname, 'mk-thumb.ps1');
let m = fs.readFileSync(t, 'utf8');
if (!m.includes('vr-topic')) {
  const a = "@{ src = 'dom-1-426.png'; dst = 'statcom-login.jpg' }";
  if (!m.includes(a)) throw new Error('thumb');
  m = m.replace(a, a + "\r\n  @{ src = 'thumb-vr-topic.png'; dst = 'statcom-vr-topic.jpg' }\r\n  @{ src = 'thumb-vr-overview.png'; dst = 'statcom-vr-overview.jpg' }\r\n  @{ src = 'thumb-vr-step.png'; dst = 'statcom-vr-step.jpg' }\r\n  @{ src = 'thumb-vr-menu.png'; dst = 'statcom-vr-menu.jpg' }");
  fs.writeFileSync(t, m);
}
console.log('ok');
