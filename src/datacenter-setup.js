/* 데이터센터 통합 모니터링(tpl datacenter) 생성기 시작 — 통합 운영 원뷰(oneview) 생성기 도구를 복사해 이름 · 화면표 · 포트를 바꾼다.
   원본이 다크(원뷰와 같음)라 라이트 파생 도구를 그대로 쓰고, 팝업은 FEMS 처럼 전력 계통도 화면 위에 얹는다.
   한 번만 돌린다 — 다시 돌리면 screen-css · asset-map · light-assets 가 비워진다.
   실행: node src/datacenter-setup.js  (WEMB Studio 루트에서) */
'use strict';
const fs = require('fs'), path = require('path');
const SRC = path.join(__dirname, 'oneview', '_gen');
const DST = path.join(__dirname, 'datacenter', '_gen');
if (fs.existsSync(path.join(DST, 'conv.js')) && !process.argv.includes('--force')) { console.log('이미 있음 — --force 로만 다시'); process.exit(0); }
fs.mkdirSync(DST, { recursive: true });
const SKIP = /^(dc-|meta-|lboxes-|kids\.json|map-labels|asset-map|asset-sizes|light-assets|screen-css|serve\.log|dbg|peek|z\d|tree\.json)/;
const rep = (s) => s
  .split('B4mYvI2xtGTL1K5crHMLqe').join('HzfsAmSQbpqIhAYebEkOWr')
  .split('Dashboard: Integrated Operations One-View').join('Digital Twin: Data Center Integrated Monitoring')
  .split('dashboard-integrated-operations-one-view').join('digital-twin-data-center-integrated-monitoring')
  .split('Integrated Operations One-View').join('Data Center Integrated Monitoring')
  .split('통합 운영 원뷰').join('데이터센터 통합 모니터링')
  .split('oneview').join('datacenter').split('Oneview').join('Datacenter').split('ONEVIEW').join('DATACENTER')
  .split("'ov-").join("'dc-").split('.ov-').join('.dc-').split('"ov-').join('"dc-').split('`ov-').join('`dc-')
  .split('5590').join('5600');
for (const f of fs.readdirSync(SRC)) {
  if (!/\.(js|ps1|md|sh)$/.test(f) || SKIP.test(f)) continue;
  fs.writeFileSync(path.join(DST, f), rep(fs.readFileSync(path.join(SRC, f), 'utf8')));
}
/* conv.js 화면표 — 바탕 4장 + 전력 계통도(dmp) 위에 얹는 팝업 5장 */
const SCREENS = [
  "  { key: '2857-2053', node: '2857:2053', px: 'dmm', name: 'Screen/Main', out: 'datacenter-main', page: 'main', meta: ['meta-2857-2053.xml'] },",
  "  { key: '2857-2156', node: '2857:2156', px: 'dmp', name: 'Screen/Power System Diagram', out: 'datacenter-power', page: 'power', meta: ['meta-2857-2156.xml'] },",
  "  { key: '2857-2443', node: '2857:2443', px: 'dmw', name: 'Screen/Worker Safety Management', out: 'datacenter-worker', page: 'worker', meta: ['meta-2857-2443.xml'] },",
  "  { key: '2857-2664', node: '2857:2664', px: 'dma', name: 'Screen/Asset Management', out: 'datacenter-asset', page: 'asset', meta: ['meta-2857-2664.xml'] },",
  "  { key: '2857-3044', node: '2857:3044', px: 'dme', name: 'Popup/Equipment Info', out: 'datacenter-equipment', page: 'equipment', meta: ['meta-2857-3044.xml'], overlay: { base: 'dmp', build: 'build_dmp_equipment', left: 0, top: 0, w: 1920, h: 1080 } },",
  "  { key: '2857-3378', node: '2857:3378', px: 'dmc', name: 'Popup/Equipment Card', out: 'datacenter-card', page: 'card', meta: ['meta-2857-3378.xml'], overlay: { base: 'dmp', build: 'build_dmp_card', left: 1365, top: 519, w: 388, h: 376 } },",
  "  { key: '2857-3379', node: '2857:3379', px: 'dmi', name: 'Popup/Equipment Info (Compact)', out: 'datacenter-compact', page: 'compact', meta: ['meta-2857-3379.xml'], overlay: { base: 'dmp_card', build: 'build_dmp_compact', left: 510, top: 292, w: 900, h: 495 } },",
  "  { key: '2857-3670', node: '2857:3670', px: 'dms', name: 'Popup/Equipment Search', out: 'datacenter-search', page: 'search', meta: ['meta-2857-3670.xml'], overlay: { base: 'dmp', build: 'build_dmp_search', left: 460, top: 90, w: 1000, h: 900 } },",
  "  { key: '2857-3672', node: '2857:3672', px: 'dmx', name: 'Popup/Scenario Description', out: 'datacenter-scenario', page: 'scenario', meta: ['meta-2857-3672.xml'], overlay: { base: 'dmp', build: 'build_dmp_scenario', left: 0, top: 0, w: 1920, h: 1080 } },",
];
const cp = path.join(DST, 'conv.js');
let c = fs.readFileSync(cp, 'utf8');
c = c.replace(/const SCREENS = \[\n[\s\S]*?\n\];/, 'const SCREENS = [\n' + SCREENS.join('\n') + '\n];');
fs.writeFileSync(cp, c);
const KEYS = ['2857-2053', '2857-2156', '2857-2443', '2857-2664', '2857-3044', '2857-3378', '2857-3379', '2857-3670', '2857-3672'];
const dp = path.join(DST, 'dl.js');
fs.writeFileSync(dp, fs.readFileSync(dp, 'utf8').replace(/Object\.fromEntries\(\[[^\]]*\]/, 'Object.fromEntries(' + JSON.stringify(KEYS)));
for (const f of ['screen-css.json', 'asset-map.json', 'light-assets.json']) fs.writeFileSync(path.join(DST, f), '{}\n');
console.log('copied', fs.readdirSync(DST).length, 'files →', DST);
