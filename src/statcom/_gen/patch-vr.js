/* VR 프레임 4장을 생성기에 넣는다 — 화면 표 · 글자 상자 · Brand New Hyosung → Pretendard · 목록 글자 · dl 표.
   이 시안의 글자는 Figma 에 Brand New Hyosung 으로 박혀 있으나 사용자 요청대로 Pretendard CDN 으로 그린다.
   실행: node patch-vr.js → node dl.js 1-4858 1-4877 1-4916 1-4943 → node strip-gama.js → node mk-meta.js → node conv.js */
'use strict';
const fs = require('fs'), path = require('path');
const G = (f) => path.join(__dirname, f);
let s = fs.readFileSync(G('conv.js'), 'utf8');
if (!s.includes("px: 'tvt'")) {
  const M = "meta: ['meta-page.xml']";
  const a = "  { key: '1-457', node: '1:457', px: 'tcq', name: '11_설비 요약 정보 카드 컨셉', out: 'statcom-cards', page: 'cards', " + M + " },\n";
  if (!s.includes(a)) throw new Error('화면 표');
  s = s.replace(a, a + [
    "  { key: '1-4858', node: '1:4858', px: 'tvt', name: '1_VR 교육 주제 선택', out: 'statcom-vr-topic', page: 'vr-topic', " + M + " },",
    "  { key: '1-4877', node: '1:4877', px: 'tvm', name: '2_VR 교육 메뉴', out: 'statcom-vr-menu', page: 'vr-menu', " + M + " },",
    "  { key: '1-4916', node: '1:4916', px: 'tvs', name: '3_VR 교육 단계 안내', out: 'statcom-vr-step', page: 'vr-step', " + M + " },",
    "  { key: '1-4943', node: '1:4943', px: 'tvo', name: '4_VR 교육 개요', out: 'statcom-vr-overview', page: 'vr-overview', " + M + " },",
    '',
  ].join('\n'));
  const f = "if (fam === 'Noto_Sans_KR') fam = 'Pretendard';";
  if (!s.includes(f)) throw new Error('글꼴');
  s = s.replace(f, "if (fam === 'Noto_Sans_KR' || fam === 'Brand_New_Hyosung') fam = 'Pretendard';");
  fs.writeFileSync(G('conv.js'), s);
}
let d = fs.readFileSync(G('dl.js'), 'utf8');
if (!d.includes('1-4858')) { d = d.replace("'1-307','1-457']", "'1-307','1-457','1-4858','1-4877','1-4916','1-4943']"); fs.writeFileSync(G('dl.js'), d); }
let m = fs.readFileSync(G('mk-meta.js'), 'utf8');
if (!m.includes('1:4868=')) {
  m = m.replace(/I1:568;278:7691=25,17";/, 'I1:568;278:7691=25,17 1:4868=266,40 1:4869=266,24 1:4876=218,18 1:4886=321,24 1:4894=59,18 1:4901=78,18 1:4908=59,18 1:4915=59,18 1:4926=302,24 1:4929=30.6,18 1:4930=37.7,18 1:4931=37.7,18 1:4939=396,30 1:4941=396,46 1:4942=396,46 1:4952=302,24 1:4955=55,21 1:4957=9,21 1:4958=478,46 1:4962=429,24 1:4963=429,115 1:4971=59,18 1:4978=30,18";');
  if (!m.includes('1:4868=')) throw new Error('mk-meta');
  fs.writeFileSync(G('mk-meta.js'), m);
}
const nm = JSON.parse(fs.readFileSync(G('text-names.json'), 'utf8'));
Object.assign(nm, { '1:4868': 'Title', '1:4869': 'Subtitle', '1:4886': 'Title', '1:4926': 'Title', '1:4929': 'Step/Start', '1:4930': 'Step/1', '1:4931': 'Step/2', '1:4939': 'Title', '1:4941': 'Paragraph/1', '1:4942': 'Paragraph/2', '1:4952': 'Title', '1:4957': 'Value', '1:4958': 'Description', '1:4962': 'Text', '1:4963': 'Description' });
fs.writeFileSync(G('text-names.json'), JSON.stringify(nm));
let c = fs.readFileSync(G('cap.js'), 'utf8');
console.log('ok', c.length);
