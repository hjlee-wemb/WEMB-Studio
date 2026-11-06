/* 신사업 관리 생성기 → 이 시안(무선망 통합관리)으로 옮긴다. conv.js 를 한 번 고쳐 쓴다(이미 적용됐으면 건너뛴다).
   바뀌는 것: 화면 목록 · 원본 글꼴(이 시안은 처음부터 Pretendard) · 테마 방향(원본 라이트 → 다크를 파생) · 경로 이름. */
'use strict';
const fs = require('fs'), path = require('path');
const P = path.join(__dirname, 'conv.js');
let c = fs.readFileSync(P, 'utf8');
if (c.includes('/* WNMS_PREP */')) { console.log('이미 적용됨'); process.exit(0); }
const SCREENS = [
  ['1-1602', '1:1602', 'wnm', '무선망 통합관리 메인', 'main'],
  ['1-1977', '1:1977', 'wno', '메인 · 메뉴 열림', 'main-open'],
  ['1-2352', '1:2352', 'wnx', '메인 · 메뉴 펼침', 'main-expanded'],
  ['1-3690', '1:3690', 'wnt', '3D 통신실 · 평면', 'room-top'],
  ['1-3708', '1:3708', 'wnv', '3D 통신실 · 투시', 'room-view'],
  ['1-3797', '1:3797', 'wne', 'NMS 설비 계통도', 'equipment'],
  ['1-3943', '1:3943', 'wnd', 'NMS 세부 계통도', 'detail'],
  ['1-2727', '1:2727', 'wnl', '로그인', 'login'],
];
const rep = (a, b) => { if (!c.includes(a)) throw new Error('못 찾음: ' + a.slice(0, 60)); c = c.split(a).join(b); };
const a = c.indexOf('const SCREENS = ['), b = c.indexOf('];', a) + 2;
c = c.slice(0, a) + '/* WNMS_PREP */\nconst SCREENS = [\n' + SCREENS.map(([key, node, px, name, page]) =>
  "  { key: '" + key + "', node: '" + node + "', px: '" + px + "', name: '" + name + "', out: 'wnms-" + page + "', page: '" + page + "', meta: ['meta-page.xml'] },").join('\n') + '\n];' + c.slice(b);

/* 테마 — 원본이 라이트라 '다크'를 파생한다(dark.js 가 light.js 와 같은 모양을 내보낸다) */
rep("const LIGHT = require('./light.js');", "const LIGHT = require('./dark.js');");
c = c.split('[data-theme="light"]').join('[data-theme="dark"]');
c = c.replace(/\[data-sh-theme="light"\]/g, '[data-sh-theme="dark"]');
/* 다크에서 글자를 그대로 둘 자리 = '파생 뒤에도 밝은 면'(밝은 칩 위 진한 글자) */
rep('const onDark = myLuma == null ? parentOnDark : myLuma < 0.42;', 'const onDark = myLuma == null ? parentOnDark : myLuma > 0.42;');

/* 글꼴 — 이 시안은 Pretendard 원본이라 굵기를 내리지 않는다(SUIT 대체용 보정이었다) */
rep("set('font-weight', String((WEIGHT[style] || 400) - (fam === 'Pretendard' ? 60 : 0)));", "set('font-weight', String(WEIGHT[style] || 400));");
rep("if (fam === 'SUIT' || fam === 'Noto_Sans_KR') fam = 'Pretendard';", "if (fam === 'Inter' || fam === 'Gothic_A1' || fam === 'S-Core_Dream') fam = 'Pretendard';");

/* Figma 에서 Pretendard 를 못 불러 임시로 넣은 글꼴(Gothic A1 · Inter)을 원래 Pretendard 값으로 되돌린다.
   Gothic A1 은 크기 94% · 자간 -2% 로 맞춰 넣었었다 → 크기 ÷0.94 반올림, 자간 없앰, 라벨(14px Bold)은 SemiBold 15. */
rep("const src = fs.readFileSync(path.join(GEN, 'dc-' + S.key + '.txt'), 'utf8');", "const src = normFonts(fs.readFileSync(path.join(GEN, 'dc-' + S.key + '.txt'), 'utf8'));");
rep('/* ══════════════════ 3. 화면 한 장 생성 ══════════════════ */', [
  '/* ══════════════════ 2.5 임시 글꼴 되돌리기 ══════════════════ */',
  'function normFonts(src) {',
  '  const QUOTES = \'"\\\'`\';',
  '  let s = src, guard = 0;',
  '  for (;;) {',
  '    const m = /font-\\[(["\\\'])Gothic_A1:(\\w+)\\1\\]/.exec(s);',
  '    if (!m || ++guard > 5000) break;',
  '    const t0 = m.index, t1 = t0 + m[0].length;',
  '    let o = t0 - 1; while (o >= 0 && QUOTES.indexOf(s[o]) < 0) o--;',
  '    let e = t1; while (e < s.length && QUOTES.indexOf(s[e]) < 0) e++;',
  '    const before = s.slice(o + 1, t0), after = s.slice(t1, e);',
  '    let size = null;',
  '    const fix = (x) => x.replace(/(^|\\s)tracking-\\[[^\\]]*\\]/g, \'\').replace(/text-\\[([\\d.]+)px\\]/g, (q, n) => { if (+n === 0) return q; size = Math.round(+n / 0.94); return \'text-[\' + size + \'px]\'; });',
  '    const b2 = fix(before), a2 = fix(after);',
  '    const style = (m[2] === \'Bold\' && size === 15) ? \'SemiBold\' : m[2];',
  '    s = s.slice(0, o + 1) + b2 + \'font-[\' + m[1] + \'Pretendard:\' + style + m[1] + \']\' + a2 + s.slice(e);',
  '  }',
  '  return s.replace(/font-\\[(["\\\'])Inter:/g, \'font-[$1Pretendard:\');',
  '}',
  '',
  '/* ══════════════════ 3. 화면 한 장 생성 ══════════════════ */'].join('\n'));

/* 경로 · 이름 */
c = c.split('newbiz-live.js').join('wnms-live.js').split('src/newbiz').join('src/wnms').split("'src', 'newbiz'").join("'src', 'wnms'").split('initNewbiz').join('initWnms');
c = c.split('신사업 관리 대시보드').join('무선망 통합관리 대시보드');
c = c.split('cES6X45zHjsaabaXL1cdrt').join('WdpL1qGqIo76WQavOsDvp6').split('page Dark-시안01').join('page Light-시안01');
fs.writeFileSync(P, c);
const left = c.split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => /newbiz|statcom/i.test(l) && !/^\s*(\/\*|\*)/.test(l));
console.log('남은 newbiz/statcom 언급', left.length); left.slice(0, 12).forEach(([n, l]) => console.log(n, l.slice(0, 140)));
