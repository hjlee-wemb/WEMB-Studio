/* 아이소메트릭 바닥판 크기 바로잡기 — Figma 코드젠의 hypot() 이 6.8% 크게 나온다.
   ─────────────────────────────────────────────────────────────────────────────
   Figma 는 회전+기울인 노드를 `containerType:size` 상자로 감싸고, 안쪽 판의 크기를
   `w-[hypot(56.155cqw,56.155cqh)] h-[hypot(43.845cqw,43.845cqh)]` 처럼 낸다.
   두 백분율은 판의 가로:세로 비(p:q, p+q=1)이고, 상자는 **회전한 뒤의 bbox** 다.
   그런데 hypot(W,H) 는 (w+h) 가 아니라 상자의 대각선이라, 되돌린 크기가 늘 커진다.
   클라우드현황 Node 바닥판이 그래서 판만 6.8% 커져 구름 밑으로 삐져나왔다.

   되돌리는 배율은 상자 크기를 몰라도 나온다 — 변환 행렬과 두 백분율만 있으면 된다.
     A = |m11|p + |m12|q,  B = |m21|p + |m22|q       (회전 후 bbox = D·A × D·B)
     bbox 가 상자와 같아야 하므로 D = W/A 인데 Figma 는 D = hypot(W,H) = W·√(A²+B²)/A
     → 배율 s = 1/√(A²+B²)
   30° 아이소메트릭에서는 s = 0.936475 다(실측으로도 이 값이 원본과 겹친다).            */
const fs = require('fs');
const path = require('path');
const F = path.join(__dirname, 'conv.js');
let s = fs.readFileSync(F, 'utf8');
const put = (find, val) => { s = s.replace(find, () => val); };

if (s.indexOf('isoPlateScale') >= 0) { console.log('already patched'); process.exit(0); }

const ANCHOR = "    if (decls.length) {";
if (s.indexOf(ANCHOR) < 0) { console.error('decls emit anchor not found (run patch-textbox-trim.js first)'); process.exit(1); }

put(ANCHOR, [
  '    if (isoPlateScale(decls)) isoFixes++;',
  ANCHOR,
].join('\n'));

/* 함수 본문을 파일 앞쪽(맨 위 헬퍼들 옆)에 심는다 */
const HEAD = 'function tagEnd(s, i) {';
if (s.indexOf(HEAD) < 0) { console.error('helper anchor not found'); process.exit(1); }

put(HEAD, [
  '/* 회전+기울임이 걸린 hypot() 크기를 컨테이너 상자에 맞게 되돌린다(위 주석 참고). */',
  'function isoPlateScale(decls) {',
  "  const get = (p) => { const d = decls.find((x) => x[0] === p); return d ? String(d[1]) : null; };",
  "  const w = get('width'), h = get('height'), tr = get('transform');",
  '  if (!w || !h || !tr) return false;',
  '  const RE = /^hypot\\(\\s*(-?[\\d.]+)cqw\\s*,\\s*(-?[\\d.]+)cqh\\s*\\)$/;',
  '  const mw = RE.exec(w), mh = RE.exec(h);',
  '  if (!mw || !mh) return false;',
  '  const p = Math.abs(parseFloat(mw[1])), q = Math.abs(parseFloat(mh[1]));',
  '  if (!(p > 0 && q > 0) || Math.abs(p + q - 100) > 0.5) return false;  /* 두 값이 100% 를 나눠 가질 때만 */',
  '  const M = trMatrix(tr);',
  '  if (!M) return false;',
  '  const pf = p / 100, qf = q / 100;',
  '  const A = Math.abs(M[0]) * pf + Math.abs(M[2]) * qf;',
  '  const B = Math.abs(M[1]) * pf + Math.abs(M[3]) * qf;',
  '  const k = Math.hypot(A, B);',
  '  if (!(k > 1.0005)) return false;                                 /* 이미 맞으면 두지 않는다 */',
  '  const sc = +(1 / k).toFixed(6);',
  "  const wi = decls.findIndex((x) => x[0] === 'width');",
  "  const hi = decls.findIndex((x) => x[0] === 'height');",
  "  decls[wi][1] = 'calc(' + w + ' * ' + sc + ')';",
  "  decls[hi][1] = 'calc(' + h + ' * ' + sc + ')';",
  '  return true;',
  '}',
  '',
  '/* transform 문자열(rotate/skewX/skewY/scale…)을 2x2 행렬 [m11,m21,m12,m22] 로 접는다 */',
  'function trMatrix(tr) {',
  '  let m = [1, 0, 0, 1];                                            /* [a,b,c,d] */',
  '  const mul = (n) => { m = [',
  '    m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],',
  '    m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3]];',
  '  };',
  '  const rad = (d) => d * Math.PI / 180;',
  '  let seen = false;',
  '  const RE = /([a-zA-Z]+)\\(([^)]*)\\)/g;',
  '  let f;',
  '  while ((f = RE.exec(tr))) {',
  '    const fn = f[1], a = f[2].split(/\\s*,\\s*/);',
  '    const num = (v) => parseFloat(v);',
  "    if (fn === 'rotate') { const t = rad(num(a[0])); mul([Math.cos(t), Math.sin(t), -Math.sin(t), Math.cos(t)]); seen = true; }",
  "    else if (fn === 'skewX') { mul([1, 0, Math.tan(rad(num(a[0]))), 1]); seen = true; }",
  "    else if (fn === 'skewY') { mul([1, Math.tan(rad(num(a[0]))), 0, 1]); seen = true; }",
  "    else if (fn === 'scale') { const x = num(a[0]), y = a.length > 1 ? num(a[1]) : x; mul([x, 0, 0, y]); seen = true; }",
  "    else if (fn === 'scaleX') { mul([num(a[0]), 0, 0, 1]); seen = true; }",
  "    else if (fn === 'scaleY') { mul([1, 0, 0, num(a[0])]); seen = true; }",
  '    else if (fn === \'translate\' || fn === \'translateX\' || fn === \'translateY\') { /* 자리만 옮긴다 */ }',
  '    else return null;                                              /* 모르는 함수 — 손대지 않는다 */',
  '  }',
  '  return seen ? m : null;',
  '}',
  '',
  HEAD,
].join('\n'));

/* 집계 */
const CNT = 'let anon = 0, textFixes = 0, trimFixes = 0,';
if (s.indexOf(CNT) < 0) { console.error('counter anchor not found'); process.exit(1); }
put(CNT, CNT.replace('trimFixes = 0,', 'trimFixes = 0, isoFixes = 0,'));
/* 두 카운터는 화면마다 새로 세야 하니 모듈 최상단이 아니라 함수 안에 있다 — 그대로 둔다 */
const STAT = 'texts: textFixes, trims: trimFixes,';
if (s.indexOf(STAT) < 0) { console.error('stat anchor not found'); process.exit(1); }
put(STAT, 'texts: textFixes, trims: trimFixes, iso: isoFixes,');

fs.writeFileSync(F, s);
console.log('patched conv.js: isometric plate sizes corrected to container box');
