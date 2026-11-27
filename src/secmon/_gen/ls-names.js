/* 장면 모듈 안 위젯급 레이어 이름 세기. node ls-names.js tp was event */
const fs = require('fs'), path = require('path');
for (const f of process.argv.slice(2)) {
  const s = fs.readFileSync(path.join(__dirname, '..', '..', 'datacenter-' + f + '.js'), 'utf8');
  const m = [...s.matchAll(/data-name=\\?["']([^"'\\]+)/g)].map((x) => x[1]);
  const c = {};
  m.filter((n) => /^(Widget|Panel|Section|Column|Line Chart|Chart|Table|Card|Group)/.test(n)).forEach((n) => { c[n] = (c[n] || 0) + 1; });
  console.log('==', f, m.length);
  console.log(Object.entries(c).slice(0, 40).map((e) => e[1] + ' ' + e[0]).join('\n'));
}
