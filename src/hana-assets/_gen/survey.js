/* 등록 후보 훑어보기 — 화면 DOM 에 실제로 들어 있는 '컴포넌트'만 골라 목록으로 뽑는다.
   부품(눈금선·막대 한 줄 …)은 이름 규칙으로 걸러 낸다.
   사용: node src/hana-assets/_gen/survey.js [카테고리]                                   */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..', '..');
const GEN = path.join(ROOT, 'src', 'hana', '_gen');
const SRC = path.join(ROOT, 'src');

const S = [
  ['hno2', 'hana-overview-02', '종합현황'],
  ['hnc1', 'hana-cloud-01', '클라우드현황01'],
  ['hnc2', 'hana-cloud-02', '클라우드현황02'],
  ['hnm', 'hana-middleware', '미들웨어'],
  ['hni1', 'hana-infra-main', '인프라메인'],
  ['hni2', 'hana-infra-detail', '인프라상세'],
  ['hne', 'hana-event', '이벤트'],
  ['hnn1', 'hana-network-01', '네트워크01'],
  ['hnn2', 'hana-network-02', '네트워크02'],
  ['hnn3', 'hana-network-03', '네트워크03'],
  ['hnf', 'hana-facility', '상면관리'],
  ['hns1', 'hana-security-01', '보안01'],
  ['hns2', 'hana-security-02', '보안02'],
  ['hnl', 'hana-login', '로그인'],
];

const NODES = JSON.parse(fs.readFileSync(path.join(GEN, 'nodes.json'), 'utf8'));

/* 생성된 화면 모듈에서 HTML 문자열만 꺼낸다 */
function html(out) {
  const s = fs.readFileSync(path.join(SRC, out + '.js'), 'utf8');
  const m = /\n  var HTML = ("(?:[^"\\]|\\.)*");\n/.exec(s);
  return m ? JSON.parse(m[1]) : '';
}

const want = process.argv[2] || '';
const rows = [];

S.forEach(([px, out, title]) => {
  const h = html(out);
  const ids = new Set([...h.matchAll(/data-node-id="([^"]+)"/g)].map((m) => m[1]));
  ids.forEach((nid) => {
    const meta = NODES[nid];
    if (!meta) return;
    const [name, w, hh, type] = meta;
    if (!name || !w || !hh) return;
    let cat = '';
    if (/^Widget\//.test(name) || /^Popup\//.test(name)) cat = 'panel';
    else if (/^(Donut|Gauge)\//.test(name) || /(Line|Bar|Donut|Gauge|Pie) ?Chart$/.test(name) || name === 'Chart') cat = 'chart';
    else if (/^(Node|Zone|Stage|Badge|Tab|Option|Menu Item|Symbol|Item|Toolbar|Legend)\//.test(name)) cat = 'symbol';
    else return;
    if (want && cat !== want) return;
    rows.push({ px, title, nid, name, cat, w: Math.round(w), h: Math.round(hh), type });
  });
});

rows.sort((a, b) => a.cat.localeCompare(b.cat) || a.px.localeCompare(b.px) || a.name.localeCompare(b.name));
const seen = {};
rows.forEach((r) => {
  seen[r.cat] = (seen[r.cat] || 0) + 1;
  console.log([r.cat.padEnd(7), r.px.padEnd(5), r.nid.padEnd(10), (r.w + 'x' + r.h).padEnd(11), r.name].join(' '));
});
console.log('\n' + Object.entries(seen).map(([k, v]) => k + ' ' + v).join(' · '));
