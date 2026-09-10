/* 화면마다 '발생시각'처럼 생긴 글자가 어느 레이어에 몇 개 있는지 훑는다.
   사용: node src/hana/_gen/survey-times.js                                               */
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

/* 시각처럼 생긴 글자 — recent-time.js 가 읽을 수 있는 모양들 */
const TIME = [
  /^\d{4}[-./]\d{1,2}[-./]\d{1,2}[ T]\d{1,2}:\d{2}(:\d{2})?$/,
  /^\d{2}[-./]\d{1,2}[-./]\d{1,2}[ T]\d{1,2}:\d{2}(:\d{2})?$/,
  /^\d{1,2}:\d{2}(:\d{2})?$/,
];
const isTime = (s) => TIME.some((re) => re.test(s));

OUTS.forEach((out) => {
  const h = html(out);
  /* 텍스트 노드마다 가장 가까운 조상 data-name 들을 따라간다 */
  const stack = [];
  const hits = {};
  const re = /<(\w+)([^>]*)>|<\/(\w+)>|>([^<>]{1,40})</g;
  let m;
  const openTag = /<(\w+)([^>]*?)(\/?)>/g;
  let i = 0;
  const names = [];
  while (i < h.length) {
    const lt = h.indexOf('<', i);
    if (lt < 0) break;
    if (h[lt + 1] === '/') {                       /* 닫는 태그 */
      names.pop();
      i = h.indexOf('>', lt) + 1;
      continue;
    }
    openTag.lastIndex = lt;
    const t = openTag.exec(h);
    if (!t || t.index !== lt) { i = lt + 1; continue; }
    const attrs = t[2];
    const dn = /data-name="([^"]*)"/.exec(attrs);
    const self = t[3] === '/' || /^(img|br|input|hr)$/i.test(t[1]);
    if (!self) names.push(dn ? dn[1] : null);
    i = t.index + t[0].length;
    /* 이 태그 바로 뒤의 글자 */
    const nx = h.indexOf('<', i);
    const txt = nx > i ? h.slice(i, nx).trim() : '';
    if (txt && isTime(txt)) {
      const chain = names.filter(Boolean).slice(-3).join(' < ') || '(이름 없음)';
      hits[chain] = (hits[chain] || 0) + 1;
    }
  }
  const rows = Object.entries(hits).sort((a, b) => b[1] - a[1]);
  if (!rows.length) return;
  console.log('\n=== ' + out.replace('hana-', '') + ' ===');
  rows.slice(0, 8).forEach(([k, v]) => console.log('  ' + String(v).padStart(4) + '  ' + k));
});
