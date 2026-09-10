/* 어떤 에셋 파일이 어느 레이어 밑에서 쓰이는지 되짚는다.
   사용: node src/hana-assets/_gen/where.js icon-1.svg icon.svg …                          */
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

process.argv.slice(2).forEach((file) => {
  console.log('\n=== ' + file + ' ===');
  let hits = 0;
  OUTS.forEach((out) => {
    const h = html(out);
    const needle = '{{B}}' + file + '"';
    let i = h.indexOf(needle);
    while (i >= 0 && hits < 6) {
      /* 앞쪽으로 거슬러 올라가며 가장 가까운 data-name 들을 모은다 */
      const head = h.slice(Math.max(0, i - 2500), i);
      const names = [...head.matchAll(/data-name="([^"]+)"/g)].map((m) => m[1]);
      console.log('  ' + out.replace('hana-', '').padEnd(14) + (names.slice(-3).join(' < ') || '(이름 없음)'));
      hits++;
      i = h.indexOf(needle, i + 1);
    }
  });
  if (!hits) console.log('  쓰이지 않음');
});
