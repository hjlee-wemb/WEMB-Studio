/* 무선망 통합관리 생성기 → 이 시안(스마트 도면관리 시스템, 19화면)으로 옮긴다. 복사한 도구를 한 번 고쳐 쓴다. */
'use strict';
const fs = require('fs'), path = require('path');
const G = __dirname;
const LIST = require('./screens.json');
const KEYS = LIST.map((s) => s[0]);
const read = (f) => fs.readFileSync(path.join(G, f), 'utf8');
const write = (f, s) => fs.writeFileSync(path.join(G, f), s);
/* conv.js */
let c = read('conv.js');
if (!c.includes('/* DRAWING_PREP */')) {
  const a = c.indexOf('const SCREENS = ['), b = c.indexOf('];', a) + 2;
  c = c.slice(0, a) + '/* DRAWING_PREP */\nconst SCREENS = [\n' + LIST.map(([key, node, px, name, page]) =>
    "  { key: '" + key + "', node: '" + node + "', px: '" + px + "', name: '" + name + "', out: 'drawing-" + page + "', page: '" + page + "', meta: ['meta-page.xml'] },").join('\n') + '\n];' + c.slice(b);
  c = c.split('wnms-live.js').join('drawing-live.js').split('src/wnms').join('src/drawing').split("'src', 'wnms'").join("'src', 'drawing'").split('initWnms').join('initDrawing');
  c = c.split('무선망 통합관리 대시보드').join('스마트 도면관리 시스템');
  c = c.split('WdpL1qGqIo76WQavOsDvp6').join('hfgGjtOuOsX3wdxk33ldyv');
  write('conv.js', c);
}
/* 화면 목록을 쓰는 작은 도구들 */
const L = JSON.stringify(KEYS);
let d = read('dl.js').replace(/const SCREENS = Object\.fromEntries\(\[[^\]]*\]/, 'const SCREENS = Object.fromEntries(' + L).split('src/wnms/').join('src/drawing/');
write('dl.js', d);
let f = read('diff-all.js').replace(/for \(const k of \[[^\]]*\]\)/, 'for (const k of ' + L + ')');
write('diff-all.js', f);
for (const file of ['cap.js', 'cap-dark.js', 'cap-light.js', 'cap-live.js']) {
  if (!fs.existsSync(path.join(G, file))) continue;
  let s = read(file).split('src/wnms').join('src/drawing');
  s = s.replace(/const P = \[\[[^;]*\]\];/, 'const P = ' + JSON.stringify(LIST.map((x) => [x[4], x[0]])) + ';');
  write(file, s);
}
console.log('ok', LIST.length);
