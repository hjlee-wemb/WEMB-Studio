/* 생성된 시트에서 역할별로 쓰인 색을 세어 라이트 대응표를 만들 근거로 삼는다.
   (손으로 색을 상상하지 않고, 실제로 쓰인 값만 다룬다) */
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', '..');
const files = fs.readdirSync(SRC).filter((f) => /^hana-.*\.js$/.test(f));
const COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g;
function role(prop) {
  if (prop === 'color' || prop === '-webkit-text-fill-color') return 'text';
  if (/shadow/.test(prop)) return 'shadow';
  if (/^border-.*color$|^border-color$|^outline-color$/.test(prop)) return 'border';
  if (/^background|^mask|^fill$/.test(prop)) return 'bg';
  return 'other';
}
const tally = { text: {}, bg: {}, border: {}, shadow: {}, other: {} };
for (const f of files) {
  const s = fs.readFileSync(path.join(SRC, f), 'utf8');
  const m = /\n  var CSS = ("(?:[^"\\]|\\.)*");\n/.exec(s);
  if (!m) { console.error('no CSS in', f); continue; }
  const css = JSON.parse(m[1]);
  for (const decl of css.matchAll(/([-a-z]+)\s*:\s*([^;{}]+)[;}]/g)) {
    const r = role(decl[1]);
    for (const c of decl[2].match(COLOR) || []) {
      const k = c.replace(/\s+/g, '');
      tally[r][k] = (tally[r][k] || 0) + 1;
    }
  }
}
for (const r of ['text', 'bg', 'border', 'shadow']) {
  const list = Object.entries(tally[r]).sort((a, b) => b[1] - a[1]).slice(0, 40);
  console.log('\n== ' + r + ' (' + Object.keys(tally[r]).length + ' distinct) ==');
  console.log(list.map(([c, n]) => c + ' x' + n).join('\n'));
}
