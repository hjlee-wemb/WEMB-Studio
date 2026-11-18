/* 발전소 방재(plantdp) 생성기 도구를 복합화력 설비정보(ccpp) 로 옮긴다 — 한 번만 돌린다.
   실행: node retarget.js */
'use strict';
const fs = require('fs'), path = require('path');
const G = __dirname;
const SC = [
  ['427-674', '427:674', 'ccm', '설비 맵', 'main'],
  ['427-725', '427:725', 'ccl', '도서관리', 'library'],
  ['427-959', '427:959', 'ccd', '계통도', 'diagram'],
  ['427-1003', '427:1003', 'cce', '태그 · 상세정보', 'detail'],
  ['427-1364', '427:1364', 'ccf', '파일 열기', 'file-open'],
  ['427-1781', '427:1781', 'cci', '상세정보(태블릿)', 'tablet'],
];
const KEYS = JSON.stringify(SC.map((s) => s[0]));
const rep = (s) => s
  .split('QVCXpLxrGKG7Id7s9SSszf').join('r7V2rTKcUto2Yd1qL4XSfZ')
  .split('Digital Twin: Power Plant Disaster Prevention').join('Digital Twin: Combined Cycle Power Plant')
  .split('digital-twin-power-plant-disaster-prevention').join('digital-twin-combined-cycle-power-plant')
  .split('발전소 디지털트윈 방재').join('복합화력 설비정보 디지털트윈')
  .split('plantdp').join('ccpp').split('Plantdp').join('Ccpp').split('PLANTDP').join('CCPP')
  .split('localhost:5570').join('localhost:5575').split("'5570'").join("'5575'").split(' 5570').join(' 5575');

for (const f of fs.readdirSync(G)) {
  if (!/\.(js|ps1|md)$/.test(f) || f === 'retarget.js' || f === 'save-dc.js') continue;
  const p = path.join(G, f);
  let s = fs.readFileSync(p, 'utf8');
  const o = s;
  s = rep(s);
  s = s.replace(/\["3302-4796","3301-4796","3300-4796","3302-5372","3293-5251","3292-5597","3287-4796","3293-4796","3289-5423","3286-4796"[^\]]*\]/g, KEYS);
  if (s !== o) { fs.writeFileSync(p, s); console.log('retarget', f); }
}

/* conv.js 의 SCREENS 표 */
const cp = path.join(G, 'conv.js');
let c = fs.readFileSync(cp, 'utf8');
const lines = SC.map(([key, node, px, name, page]) =>
  "  { key: '" + key + "', node: '" + node + "', px: '" + px + "', name: '" + name + "', out: 'ccpp-" + page + "', page: '" + page + "', meta: ['meta-" + key + ".xml'] },");
c = c.replace(/const SCREENS = \[\n[\s\S]*?\n\];/, 'const SCREENS = [\n' + lines.join('\n') + '\n];');
/* 글꼴 — 사용자 지시: 모든 글자는 Pretendard CDN(원본 KoPubDotum · KoPubWorldDotum · SUIT 도) */
if (c.indexOf('KoPubDotum_Pro:') < 0) {
  const P = '\'"Pretendard Variable","Pretendard","Malgun Gothic",-apple-system,system-ui,sans-serif\'';
  c = c.replace('const FONTS = {\n', 'const FONTS = {\n  KoPubDotum_Pro: ' + P + ',\n  KoPubWorldDotum: ' + P + ',\n');
}
fs.writeFileSync(cp, c);
console.log('conv SCREENS', SC.length);
/* 상자 덤프 이후 Figma 에서 바로잡은 이름(키 글자가 Value 로 남아 있던 것) */
for (const k of ['427-1003', '427-1781']) {
  const mp = path.join(G, 'meta-' + k + '.xml');
  let m = fs.readFileSync(mp, 'utf8');
  m = m.replace('id="427:1311" name="Value"', 'id="427:1311" name="Key"').replace('id="427:2219" name="Value"', 'id="427:2219" name="Key"');
  fs.writeFileSync(mp, m);
}
fs.writeFileSync(path.join(G, 'meta-page.xml'), '<canvas>\n</canvas>\n');
if (!fs.existsSync(path.join(G, 'screen-css.json'))) fs.writeFileSync(path.join(G, 'screen-css.json'), '{}\n');
fs.writeFileSync(path.join(G, 'asset-map.json'), '{}\n');
fs.writeFileSync(path.join(G, 'dark-assets.json'), '{}\n');
