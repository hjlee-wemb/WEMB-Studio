/* 종합현황01(Screen/Overview 01 · Figma 1:5326 · 접두어 hno1)을 템플릿에서 뺀다.
   원본 dc/meta 는 _gen 에 그대로 두므로, 되살릴 때는 conv.js 의 SCREENS 에 그 줄을 다시 넣고
   이 스크립트의 반대로 index.html 을 되돌리면 된다(patch-studio.js 를 다시 돌리는 쪽이 확실하다).
   빠진 뒤의 대표 화면은 종합현황02(overview-02)다.
   실행: node src/hana/_gen/patch-drop-overview01.js  (여러 번 돌려도 안전) */
const fs = require('fs');
const path = require('path');
const F = path.join(__dirname, '..', '..', '..', 'index.html');
let s = fs.readFileSync(F, 'utf8');
const CR = String.fromCharCode(13);
const NL = String.fromCharCode(10);
const CRLF = s.indexOf(CR + NL) >= 0;
if (CRLF) s = s.split(CR + NL).join(NL);
const before = s.length;

/* ① 화면 모듈 <script> */
s = s.split('    <script src="src/hana-overview-01.js?v=1"></script>' + NL).join('');

/* ② HN_SCREENS 항목 */
s = s.split("        'overview-01': { px: 'hno1', build: 'build_hno1', css: 'HNO1_CSS', light: 'HNO1_LIGHT_CSS', title: 'HANA Bank H.I.T — 종합현황01' }," + NL).join('');

/* ③ 루트 목록 · 색 정하기 접두어 · 패널편집 대상 */
s = s.split(".hno1-root, ").join('');
s = s.split("['hno1', 'hno2',").join("['hno2',");
s = s.split(".hno1-root p, ").join('');

/* ④ 기본 화면 — 종합현황02 로 */
s = s.split("'wemb-hana-screen') || 'overview-01'").join("'wemb-hana-screen') || 'overview-02'");
s = s.split("HN_SCREENS['overview-01']").join("HN_SCREENS['overview-02']");
s = s.split("return HN_SCREENS[v] ? v : 'overview-01';").join("return HN_SCREENS[v] ? v : 'overview-02';");
s = s.split("applyHanaDT(HN_SCREENS[which] ? which : 'overview-01');").join("applyHanaDT(HN_SCREENS[which] ? which : 'overview-02');");
s = s.split("(openProj.tplScene || 'overview-01')").join("(openProj.tplScene || 'overview-02')");
s = s.split("t.tplScene || 'overview-01'").join("t.tplScene || 'overview-02'");

/* ⑤ 썸네일·슬라이드 */
s = s.split("hn.img = 'src/templates/hana-overview-01.jpg';").join("hn.img = 'src/templates/hana-overview-02.jpg';");
s = s.split("              { img: 'src/templates/hana-overview-01.jpg', label: '종합현황01' }," + NL).join('');
s = s.split("'src/templates/hana-overview-01.jpg' : null;").join("'src/templates/hana-overview-02.jpg' : null;");

/* ⑥ '스튜디오 열기' 로 만들 화면 목록 — 첫 장이 종합현황02 가 되므로 그 뒤부터 나열한다 */
s = s.split("['overview-02', 'cloud-01', 'cloud-02', 'middleware', 'infra-main', 'infra-detail', 'event', 'network-01', 'network-02', 'network-03', 'facility', 'security-01', 'security-02', 'login'][i]")
  .join("['cloud-01', 'cloud-02', 'middleware', 'infra-main', 'infra-detail', 'event', 'network-01', 'network-02', 'network-03', 'facility', 'security-01', 'security-02', 'login'][i]");

fs.writeFileSync(F, CRLF ? s.split(NL).join(CR + NL) : s);
const left = (s.match(/hno1|overview-01/g) || []).length;
console.log('index.html: -' + (before - s.length) + ' chars | 남은 hno1/overview-01 참조:', left);
