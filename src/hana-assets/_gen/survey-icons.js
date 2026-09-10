/* 아이콘 후보 훑기 — 화면 DOM 에서 data-name="Icon/…" 덩어리 안에 쓰인 svg 파일을 짝지어 이름을 얻는다.
   사용: node src/hana-assets/_gen/survey-icons.js                                        */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const SRC = path.join(ROOT, 'src');

const OUTS = ['hana-overview-02', 'hana-cloud-01', 'hana-cloud-02', 'hana-middleware', 'hana-infra-main',
  'hana-infra-detail', 'hana-event', 'hana-network-01', 'hana-network-02', 'hana-network-03',
  'hana-facility', 'hana-security-01', 'hana-security-02', 'hana-login'];

function html(out) {
  const s = fs.readFileSync(path.join(SRC, out + '.js'), 'utf8');
  const m = /\n  var HTML = ("(?:[^"\\]|\\.)*");\n/.exec(s);
  return m ? JSON.parse(m[1]) : '';
}

/* data-name="Icon/…" 가 붙은 여는 태그부터 그 다음 200자 안에서 svg 파일을 찾는다
   (아이콘 덩어리는 대개 <div data-name="Icon/X"><img src="{{B}}icon-y.svg"> 꼴이다) */
const byFile = {};
OUTS.forEach((out) => {
  const h = html(out);
  for (const m of h.matchAll(/data-name="(Icon\/[^"]+)"/g)) {
    const tail = h.slice(m.index, m.index + 700);
    const f = /\{\{B\}\}([\w.-]+\.svg)/.exec(tail);
    if (!f) continue;
    const file = f[1];
    if (/-lt\.svg$/.test(file)) continue;
    if (!byFile[file]) byFile[file] = { name: m[1], screens: new Set() };
    byFile[file].screens.add(out.replace('hana-', ''));
  }
});

const files = fs.readdirSync(path.join(SRC, 'hana')).filter((f) => /^icon.*\.svg$/.test(f) && !/-lt\.svg$/.test(f));
console.log('icon-*.svg 파일 ' + files.length + '개 · Figma 이름을 찾은 것 ' + Object.keys(byFile).length + '개\n');
files.forEach((f) => {
  const e = byFile[f];
  console.log(f.padEnd(34) + (e ? e.name.padEnd(34) + [...e.screens].slice(0, 3).join(',') : '— 이름 못 찾음'));
});
const extra = Object.keys(byFile).filter((f) => !files.includes(f));
if (extra.length) console.log('\nIcon/ 안에 쓰였지만 icon-*.svg 가 아닌 파일:\n  ' + extra.join('\n  '));
