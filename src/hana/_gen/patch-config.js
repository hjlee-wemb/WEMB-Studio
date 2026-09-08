/* 한진에서 복사해 온 conv.js 를 이 시안(HANA Bank H.I.T)용으로 맞춘다.
   화면 목록·접두어·출력 이름을 바꾸고, 한진에만 있던 특수 처리는 비운다.
   실행 순서: cp ../../hanjin/_gen/conv.js . 뒤 이 파일부터 → branches → takeelement
              → classes → splitand → status-attr → inline-gauge */
const fs = require('fs');
const path = require('path');
const F = path.join(__dirname, 'conv.js');
let s = fs.readFileSync(F, 'utf8');

const S = [
  ['1-7175', '1:7175', 'hno2', 'Screen/Overview 02', 'hana-overview-02'],
  ['1-18455', '1:18455', 'hnc1', 'Screen/Cloud Status 01', 'hana-cloud-01'],
  ['1-18154', '1:18154', 'hnc2', 'Screen/Cloud Status 02', 'hana-cloud-02'],
  ['1-18697', '1:18697', 'hnm', 'Screen/Middleware Status', 'hana-middleware'],
  ['1-21965', '1:21965', 'hni1', 'Screen/Infrastructure Main', 'hana-infra-main'],
  ['1-21682', '1:21682', 'hni2', 'Screen/Infrastructure Detail', 'hana-infra-detail'],
  ['1-19018', '1:19018', 'hne', 'Screen/Event Status', 'hana-event'],
  ['1-19299', '1:19299', 'hnn1', 'Screen/Network Status 01', 'hana-network-01'],
  ['1-19968', '1:19968', 'hnn2', 'Screen/Network Status 02', 'hana-network-02'],
  ['1-19085', '1:19085', 'hnn3', 'Screen/Network Status 03', 'hana-network-03'],
  ['1-22870', '1:22870', 'hnf', 'Screen/Facility Management', 'hana-facility'],
  ['1-23148', '1:23148', 'hns1', 'Screen/Security System 01', 'hana-security-01'],
  ['1-23799', '1:23799', 'hns2', 'Screen/Security System 02', 'hana-security-02'],
  ['1-4904', '1:4904', 'hnl', 'Screen/Login', 'hana-login'],
];
const arr = 'const SCREENS = [\n' + S.map((a) => "  { key: '" + a[0] + "', node: '" + a[1] + "', px: '" + a[2]
  + "', name: '" + a[3] + "', out: '" + a[4] + "', meta: ['meta-page.xml', 'meta-1-61879.xml'] },").join('\n') + '\n];';

/* 치환 문자열에 $ 가 들어갈 수 있으므로 항상 함수 치환자를 쓴다($& 같은 특수 패턴 방지) */
const put = (re, val) => { s = s.replace(re, () => val); };

put(/const SCREENS = \[[\s\S]*?\n\];/, arr);
put(/const RING_STROKE = \[[\s\S]*?\n\];/, 'const RING_STROKE = [];');
put(/const OUTSIDE_STROKE = \[[^\]]*\];/, 'const OUTSIDE_STROKE = [];');
put(/const FIX_SIZE = \[[^\]]*\];[^\n]*/, 'const FIX_SIZE = [];');
put(/const INLINE_SVG = \[[^\]]*\];/, 'const INLINE_SVG = [];');
put(/const MENU_STATE = \{[\s\S]*?\n\};/, 'const MENU_STATE = {};');
put(/const GRAFT = \{[\s\S]*?\n\};/, 'const GRAFT = {};');
put(/const VARIANT_SETS = \{[\s\S]*?\n\};/, 'const VARIANT_SETS = {};');
put(/const EXPORT_SVG = \{[^}]*\};/, 'const EXPORT_SVG = {};');

s = s.split('src/hanjin/').join('src/hana/');
s = s.split('hanjin-live.js').join('hana-live.js');
s = s.split('window.initHanjin').join('window.initHana');
s = s.split("path.join(STUDIO, 'src', 'hanjin'").join("path.join(STUDIO, 'src', 'hana'");
put(/'한진 SMART 통합관제 — ' \+ r\.S\.name,/, "'HANA Bank H.I.T — ' + r.S.name,");
put(/r\.S\.out\.replace\('hanjin-', ''\)/, "r.S.out.replace('hana-', '')");
put(/'   원본: Figma A11hAZefK5FSuEE9MagOgj[^\n]*\n/,
  "'   원본: Figma H3S2M7DUCvuJgi75oBqg6W / node ' + r.S.node + ' (1920x1080, page Page 1)',\n");

fs.writeFileSync(F, s);
console.log('patched: config —', (s.match(/px: '/g) || []).length, 'screens |',
  (s.match(/hanjin/g) || []).length, 'hanjin refs left(주석뿐)');
