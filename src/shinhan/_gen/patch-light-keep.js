/* conv.js 에 '라이트에서도 원본 색을 지키는 오브젝트' 장치를 넣는다 — 한 번만(mk-light-shinhan.js 와 짝).
   KPI 타일 · 요일 배지 · 유리 아이콘 · 심의 받침 · 보안등급 배지 · 방패 링 · 시나리오 하이라이트/막대 채움 ·
   등록 창 제목 띠/닫기/등록 단추는 흰 판 위에서도 원본 색 그대로가 자연스럽다(색 덩어리 오브젝트).
   그 노드와 자손은 light.js 의 자동 변환(darkRules)을 건너뛴다. 실행: node patch-light-keep.js */
'use strict';
const fs = require('fs'), path = require('path');
const p = path.join(__dirname, 'conv.js');
let s = fs.readFileSync(p, 'utf8');
if (s.includes('markKeep')) { console.log('이미 있음'); process.exit(0); }
function rep(a, b) { if (!s.includes(a)) throw new Error('앵커 없음: ' + a.slice(0, 60)); s = s.replace(a, () => b); }

rep('const RING_STROKE = [];',
  '/* 라이트 변환을 건너뛰는 오브젝트 이름(buildScreen 의 markKeep · mk-light-shinhan.js 와 짝) */\n'
  + 'const LIGHT_KEEP = /^(Day Badge|Icon Badge|Category Badge|Badge\\/Threat Level|Visual|Highlight|Fill|Title Bar|Close Button|Button\\/Register)$/;\n'
  + 'const RING_STROKE = [];');

const A = '  const tree = parseNodes(rootJsx, { comps, assets }, Object.assign({}, assets))[0];';
rep(A, A + '\n'
  + '  /* 라이트에서도 원본 색을 지키는 오브젝트 — 그 노드와 자손은 아래 darkRules(라이트 변환)를 건너뛴다.\n'
  + '     KPI 는 타일 판(Background) · 유리 테두리(Border) · 숫자(Measurement)만 — 이름표(Caption)는 흰 이름표로 바뀐다. */\n'
  + '  (function markKeep(n, keep, parentName) {\n'
  + "    if (!n || n.tag === '#text') return;\n"
  + "    const dn = n.attrs && typeof n.attrs['data-name'] === 'string' ? n.attrs['data-name'] : '';\n"
  + '    const k = keep || LIGHT_KEEP.test(dn) || (/^KPI\\//.test(parentName) && /^(Background|Border|Measurement)$/.test(dn));\n'
  + '    n.__lightKeep = k;\n'
  + '    (n.children || []).forEach((c) => markKeep(c, k, dn || parentName));\n'
  + "  })(tree, false, '');");

rep("    decls.forEach(([p, v]) => {\n      if (onDark && (p === 'color' || p === '-webkit-text-fill-color')) return;",
  "    if (!node.__lightKeep) decls.forEach(([p, v]) => {\n      if (onDark && (p === 'color' || p === '-webkit-text-fill-color')) return;");
fs.writeFileSync(p, s);
console.log('patched');
