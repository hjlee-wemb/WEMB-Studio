/* 이 에셋 파일이 **어느 레이어 밑에** 쓰이는지 — 숫자만 붙은 파일(icon-3.svg …)에 이름을 붙일 때 쓴다.
   화면 어디에도 안 나오면 Figma 가 내보내기만 한 파일이니 등록하지 않는다.
   사용: node src/posco-assets/_gen/where.js '^icon'     (파일명 정규식, 기본 ^icon)         */
const path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');

const OUTJS = {
  pkm: 'posco-main', pka: 'posco-ack', pko: 'posco-overview', pkr: 'posco-route',
  pkf: 'posco-floors', pkd: 'posco-detail', pks1: 'posco-sop1', pks2: 'posco-sop2',
  pks3: 'posco-sop3', pks4: 'posco-sop4',
};
global.window = {};
Object.values(OUTJS).forEach((f) => require(path.join(ROOT, 'src', f + '.js')));
const W = global.window;

const pat = new RegExp(process.argv[2] || '^icon');
const VOID = new Set(['img', 'br', 'hr', 'input', 'path', 'circle', 'rect', 'line', 'use', 'stop', 'polygon', 'polyline', 'ellipse', 'source']);
const hit = new Map();

Object.keys(OUTJS).forEach((px) => {
  const html = W['build_' + px]('src/posco/');
  const re = /<([a-zA-Z0-9]+)([^>]*)>|<\/([a-zA-Z0-9]+)>/g;
  let m;
  const stack = [];
  while ((m = re.exec(html))) {
    if (m[3]) { stack.pop(); continue; }
    const tag = m[1], attrs = m[2] || '';
    const src = (/src="([^"]+)"/.exec(attrs) || [])[1];
    if (src) {
      const file = src.split('/').pop();
      if (pat.test(file) && !hit.has(file)) {
        hit.set(file, px + '  ' + stack.slice(-3).map((x) => x.n || '?').join(' < '));
      }
    }
    if (!(/\/$/.test(attrs.trim()) || VOID.has(tag.toLowerCase()))) {
      stack.push({ n: (/data-name="([^"]+)"/.exec(attrs) || [])[1] });
    }
  }
});

[...hit.keys()].sort().forEach((k) => console.log(k.padEnd(28) + hit.get(k)));
console.log('\n' + hit.size + '개 (화면이 실제로 쓰는 것만)');
