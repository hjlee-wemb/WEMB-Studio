/* 무선망(wnms) 생성기 도구를 발전소 방재(plantdp) 로 옮긴다 — 한 번만 돌린다.
   실행: node retarget.js */
'use strict';
const fs = require('fs'), path = require('path');
const G = __dirname;
const SC = [
  ['3302-4796', '3302:4796', 'pdm', '종합 방재현황', 'main'],
  ['3301-4796', '3301:4796', 'pdw', '기상 상세 분석', 'weather'],
  ['3300-4796', '3300:4796', 'pds', '지진계측 상세 파형', 'seismic'],
  ['3302-5372', '3302:5372', 'pde', '이벤트 현황', 'event'],
  ['3293-5251', '3293:5251', 'pdp', 'SOP 진행 팝업', 'sop-popup'],
  ['3292-5597', '3292:5597', 'pdb', '건물 캐러셀', 'building'],
  ['3287-4796', '3287:4796', 'pdf', '층 캐러셀', 'floor'],
  ['3293-4796', '3293:4796', 'pdo', 'SOP 진행 현황', 'sop'],
  ['3289-5423', '3289:5423', 'pdy', 'SOP 대기', 'sop-standby'],
  ['3286-4796', '3286:4796', 'pdl', '로그인', 'login'],
];
const KEYS = JSON.stringify(SC.map((s) => s[0]));
const PAIRS = JSON.stringify(SC.map((s) => [s[4], s[0]]));
const rep = (s) => s
  .split('WdpL1qGqIo76WQavOsDvp6').join('QVCXpLxrGKG7Id7s9SSszf')
  .split('Dashboard: Wireless Network Management').join('Digital Twin: Power Plant Disaster Prevention')
  .split('dashboard-wireless-network-management').join('digital-twin-power-plant-disaster-prevention')
  .split('무선망 통합관리 대시보드').join('발전소 디지털트윈 방재')
  .split('wnms').join('plantdp').split('Wnms').join('Plantdp').split('WNMS').join('PLANTDP')
  .split('localhost:5544').join('localhost:5570').split("'5544'").join("'5570'");

for (const f of fs.readdirSync(G)) {
  if (!/\.(js|ps1)$/.test(f) || f === 'retarget.js' || f === 'mk-meta.js') continue;
  const p = path.join(G, f);
  let s = fs.readFileSync(p, 'utf8');
  const o = s;
  s = rep(s);
  /* 화면 키 목록 */
  s = s.replace(/\["1-1602","1-1977","1-2352","1-2727","1-3690","1-3708","1-3797","1-3943"\]/g, KEYS)
    .replace(/\["1-1602","1-1977","1-2352","1-3690","1-3708","1-3797","1-3943","1-2727"\]/g, KEYS)
    .replace(/\[\["main","1-1602"\][^\n]*?\]\];/g, PAIRS + ';');
  if (s !== o) { fs.writeFileSync(p, s); console.log('retarget', f); }
}

/* conv.js 의 SCREENS 표 */
const cp = path.join(G, 'conv.js');
let c = fs.readFileSync(cp, 'utf8');
const lines = SC.map(([key, node, px, name, page]) =>
  "  { key: '" + key + "', node: '" + node + "', px: '" + px + "', name: '" + name + "', out: 'plantdp-" + page + "', page: '" + page + "', meta: ['meta-" + key + ".xml'] },");
c = c.replace(/const SCREENS = \[\n[\s\S]*?\n\];/, 'const SCREENS = [\n' + lines.join('\n') + '\n];');
/* 글꼴 — 사용자 지시: 모든 글자는 Pretendard CDN */
c = c.replace("const FONTS = {\n", "const FONTS = {\n  NanumSquare_Neo: '\"Pretendard Variable\",\"Pretendard\",\"Malgun Gothic\",-apple-system,system-ui,sans-serif',\n  NanumSquare_Neo_OTF: '\"Pretendard Variable\",\"Pretendard\",\"Malgun Gothic\",-apple-system,system-ui,sans-serif',\n  Pretendard_GOV: '\"Pretendard Variable\",\"Pretendard\",\"Malgun Gothic\",-apple-system,system-ui,sans-serif',\n  SUIT: '\"Pretendard Variable\",\"Pretendard\",\"Malgun Gothic\",-apple-system,system-ui,sans-serif',\n");
/* var(--x, 값) → 값 (이 파일의 design context 는 간격 · 색을 변수 꼴로 준다) */
if (c.indexOf('const unVar') < 0) {
  c = c.replace("const arb = (c) => fixCalc(c.slice(c.indexOf('[') + 1, c.lastIndexOf(']')).replace(/_/g, ' '));",
    "const unVar = (v) => { let p; do { p = v; v = v.replace(/var\\(--[^,()]+,\\s*([^()]*(?:\\([^()]*\\))?[^()]*)\\)/g, '$1'); } while (v !== p); return v; };\nconst arb = (c) => fixCalc(unVar(c.slice(c.indexOf('[') + 1, c.lastIndexOf(']')).replace(/_/g, ' ')));");
}
/* 무선망 전용 글꼴 되돌리기 · 아이콘 바꿔치기는 이 파일에 없다 */
c = c.replace(/  const SWAP = \[\[[^\n]*\n  for \(const \[nm, v\] of SWAP\) \{\n[\s\S]*?\n  \}\n  s = 'const imgTypeLogout[^\n]*\n/, '');
fs.writeFileSync(cp, c);
console.log('conv SCREENS', SC.length, '· unVar', c.indexOf('const unVar') >= 0, '· SWAP 제거', c.indexOf('imgTypeLogout') < 0);
