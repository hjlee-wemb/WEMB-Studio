/* Tailwind 의 transform 은 클래스 적는 순서와 상관없이 늘 같은 순서로 합쳐진다:
   translate → rotate → skewX → skewY → scale.
   conv.js 는 클래스가 나온 순서대로 이어 붙여서, `-skew-x-30 … rotate-30` 처럼
   skew 가 먼저 적힌 아이소메트릭 바닥판이 `skewX(-30) rotate(30)` 이 되어 버렸다
   (matrix(.577,.5,-1,.866) — 올바른 값은 matrix(.866,.5,-1,.577)).
   그래서 클라우드현황 Node 바닥판이 눕지 않고 서서 찌그러져 보였다.
   → 합치기 직전에 Tailwind 순서로 정렬한다. */
const fs = require('fs');
const path = require('path');
const F = path.join(__dirname, 'conv.js');
let s = fs.readFileSync(F, 'utf8');
const put = (find, val) => { s = s.replace(find, () => val); };

if (s.indexOf('TW_TR_ORDER') >= 0) { console.log('already patched'); process.exit(0); }

const OLD = "  if (tr.length) set('transform', tr.join(' '));";
if (s.indexOf(OLD) < 0) { console.error('transform emit anchor not found'); process.exit(1); }

put(OLD, [
  '  if (tr.length) {',
  '    /* Tailwind 합성 순서 — 클래스를 적은 순서가 아니라 늘 이 순서다 */',
  "    const TW_TR_ORDER = ['translate', 'rotate', 'skewX', 'skewY', 'scale'];",
  '    const rank = (f) => {',
  "      const fn = (f.split('(')[0] || '');",
  '      for (let i = 0; i < TW_TR_ORDER.length; i++) {',
  '        if (fn.indexOf(TW_TR_ORDER[i]) === 0) return i;',
  '      }',
  '      return TW_TR_ORDER.length;                    /* matrix 등 통짜 값은 맨 뒤 */',
  '    };',
  '    const ordered = tr',
  '      .map((f, i) => ({ f: f, i: i, r: rank(f) }))',
  '      .sort((a, b) => (a.r - b.r) || (a.i - b.i))   /* 같은 자리끼리는 적은 순서 유지 */',
  '      .map((x) => x.f);',
  "    set('transform', ordered.join(' '));",
  '  }',
].join('\n'));

fs.writeFileSync(F, s);
console.log('patched conv.js: transform composed in Tailwind order');
