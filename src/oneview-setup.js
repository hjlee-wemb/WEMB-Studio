/* 통합 운영 원뷰(tpl oneview) 생성기 시작 — indpark 생성기 도구를 복사해 이름 · 화면표 · 포트를 바꾼다. 한 번만 돌린다.
   실행: node src/oneview-setup.js  (WEMB Studio 루트에서) */
'use strict';
const fs = require('fs'), path = require('path');
const SRC = path.join(__dirname, 'indpark', '_gen');
const DST = path.join(__dirname, 'oneview', '_gen');
fs.mkdirSync(DST, { recursive: true });
const SKIP = /^(dc-|meta-|lboxes-|kids\.json|map-labels|asset-map|asset-sizes|light-assets|screen-css|serve\.log)/;
const SC = [
  ['2208-2033', '1-3', 'ipm', 'ovm', 'main', 'Screen/Overview'],
  ['2208-2117', '96-7914', 'ipn', 'ovn', 'overview2', 'Screen/Overview 2'],
  ['2208-2220', '56-3639', 'ips', 'ovt', 'transactions', 'Screen/Transactions'],
  ['2208-2306', '42-4769', 'ipf', 'ovw', 'was', 'Screen/WAS Status'],
  ['2208-2393', '50-5951', 'ipv', 'ovp', 'waspopup', 'Screen/WAS Status (Popup)'],
  ['2208-2792', '63-3639', 'iph', 'ovq', 'tp', 'Screen/TP Performance'],
  ['2208-3187', '22-770', 'ipe', 'ove', 'event', 'Screen/Event Status'],
  ['2208-3552', '66-10016', 'ipy', 'ovs', 'system', 'Screen/System Status'],
  ['2208-3926', '76-4561', 'ipt', 'ovr', 'system2', 'Screen/System Status 2'],
];
const EXTRA = [['77-6526', 'ovd', 'detail', 'Screen/System Status Detail'], ['84-8482', 'ovk', 'network', 'Screen/Network Status']];
const rep = (s) => {
  for (const [ok, nk, op, np] of SC) s = s.split(ok).join(nk).split(ok.replace('-', ':')).join(nk.replace('-', ':')).replace(new RegExp('(?<![A-Za-z])' + op + '(?![a-z])', 'g'), np);
  return s.split('xzZQdVDkaDM1hve8Vc88GC').join('B4mYvI2xtGTL1K5crHMLqe')
    .split('Digital Twin: Smart Industrial Complex').join('Dashboard: Integrated Operations One-View')
    .split('digital-twin-smart-industrial-complex').join('dashboard-integrated-operations-one-view')
    .split('스마트 산단 디지털 트윈').join('통합 운영 원뷰').split('스마트 산단').join('통합 운영 원뷰')
    .split('indpark').join('oneview').split('Indpark').join('Oneview').split('INDPARK').join('ONEVIEW')
    .split("'ip-").join("'ov-").split('.ip-').join('.ov-').split('"ip-').join('"ov-').split('`ip-').join('`ov-')
    .split('5560').join('5590');
};
for (const f of fs.readdirSync(SRC)) {
  if (!/\.(js|ps1|md)$/.test(f) || SKIP.test(f)) continue;
  fs.writeFileSync(path.join(DST, f), rep(fs.readFileSync(path.join(SRC, f), 'utf8')));
}
/* conv.js SCREENS 표를 11장으로 */
const cp = path.join(DST, 'conv.js');
let c = fs.readFileSync(cp, 'utf8');
const all = SC.map(([, k, , p, page, nm]) => [k, p, page, nm]).concat(EXTRA);
const order = ['1-3', '96-7914', '56-3639', '42-4769', '50-5951', '63-3639', '66-10016', '76-4561', '77-6526', '84-8482', '22-770'];
all.sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
const lines = all.map(([k, p, page, nm]) => "  { key: '" + k + "', node: '" + k.replace('-', ':') + "', px: '" + p + "', name: '" + nm + "', out: 'oneview-" + page + "', page: '" + page + "', meta: ['meta-" + k + ".xml'] },");
c = c.replace(/const SCREENS = \[\n[\s\S]*?\n\];/, 'const SCREENS = [\n' + lines.join('\n') + '\n];');
fs.writeFileSync(cp, c);
const dp = path.join(DST, 'dl.js');
fs.writeFileSync(dp, fs.readFileSync(dp, 'utf8').replace(/Object\.fromEntries\(\[[^\]]*\]/, 'Object.fromEntries(' + JSON.stringify(order)));
for (const f of ['screen-css.json', 'asset-map.json', 'light-assets.json']) fs.writeFileSync(path.join(DST, f), '{}\n');
fs.writeFileSync(path.join(DST, 'meta-page.xml'), '<canvas>\n</canvas>\n');
console.log('copied', fs.readdirSync(DST).length, 'files');
