/* 등록 후보 훑어보기 — 화면 DOM 에 실제로 들어 있는 '컴포넌트'만 골라 목록으로 뽑는다.
   이 시안에는 전체 노드 메타(HANA 의 nodes.json)가 없어 **레이어명과 계층**으로 고른다.
   크기는 measure.js 로 브라우저에서 잰다.
   사용: node src/posco-assets/_gen/survey.js [px] [깊이]                                  */
const path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');

const SCREEN = ['pkm', 'pka', 'pko', 'pkr', 'pkf', 'pkd', 'pks1', 'pks2', 'pks3', 'pks4'];
const OUTJS = {
  pkm: 'posco-main', pka: 'posco-ack', pko: 'posco-overview', pkr: 'posco-route',
  pkf: 'posco-floors', pkd: 'posco-detail', pks1: 'posco-sop1', pks2: 'posco-sop2',
  pks3: 'posco-sop3', pks4: 'posco-sop4',
};
global.window = {};
SCREEN.forEach((px) => require(path.join(ROOT, 'src', OUTJS[px] + '.js')));
const W = global.window;

/* 부품이 아니라 컴포넌트로 볼 만한 레이어명 */
const COMP = /^(Widget|Popup|Panel|Dialog|Nav Item|Menu Item|Item|Category|Status|Count|Button|Field|Tab|Node|Process Step|Process Node|Flow Node|Legend|Card|Chip|Badge|Row|Header Row|Table|Step List|Contact Table|Flow Diagram|Process Flow|Breadcrumb|Alert Ticker|Event Panel|Sidebar|Category Bar|Floor Selector|Floor Plan|Floor Item|Building Label|Building Selector|Logo|Toolbar|Menu|Nav Bar|Search Field|Date Field|Section Title|Status Group|Filters|Footer)/;
const VOID = new Set(['img', 'br', 'hr', 'input', 'path', 'circle', 'rect', 'line', 'use', 'stop', 'polygon', 'polyline', 'ellipse', 'source']);

const only = process.argv[2];
const maxd = +(process.argv[3] || 99);

(only ? [only] : SCREEN).forEach((px) => {
  const html = W['build_' + px]('src/posco/');
  const re = /<([a-zA-Z0-9]+)([^>]*)>|<\/([a-zA-Z0-9]+)>/g;
  let m, depth = 0;
  const seen = {};
  console.log('==== ' + px + ' ====');
  while ((m = re.exec(html))) {
    if (m[3]) { depth--; continue; }
    const tag = m[1], attrs = m[2] || '';
    const nid = (/data-node-id="([^"]+)"/.exec(attrs) || [])[1];
    const name = (/data-name="([^"]+)"/.exec(attrs) || [])[1];
    if (nid && name && depth <= maxd && COMP.test(name) && !seen[nid]) {
      seen[nid] = 1;
      console.log('  '.repeat(Math.min(depth, 12)) + name.padEnd(32) + ' [' + nid + ']');
    }
    if (!(/\/$/.test(attrs.trim()) || VOID.has(tag.toLowerCase()))) depth++;
  }
});
