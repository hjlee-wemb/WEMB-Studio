/* 실린더 게이지가 인라인 <svg> 로 심겼는지, 원판·상태 속성이 붙었는지 확인한다. */
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', '..');
for (const f of ['hana-overview-02.js', 'hana-middleware.js']) {
  const s = fs.readFileSync(path.join(SRC, f), 'utf8');
  const m = /\n  var HTML = ("(?:[^"\\]|\\.)*");\n/.exec(s);
  if (!m) { console.log(f, '— HTML 못 찾음'); continue; }
  const html = JSON.parse(m[1]);
  console.log(f.padEnd(24),
    'svg=' + (html.match(/<svg /g) || []).length,
    'disk=' + (html.match(/<g id="Disk/g) || []).length,
    'status=' + (html.match(/data-hn-status/g) || []).length,
    'visual-img=' + (html.match(/\{\{B\}\}visual-[\w-]*\.svg/g) || []).length);
}
