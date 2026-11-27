/* conv.js 에 '얹는 화면 클래스 스코핑'(FEMS 생성기)을 넣는다. 한 번만. 실행: node patch-overlay-scope.js */
'use strict';
const fs = require('fs'), path = require('path');
const p = path.join(__dirname, 'conv.js');
let s = fs.readFileSync(p, 'utf8');
if (s.includes('OVERLAY_SCOPE')) { console.log('이미 적용'); process.exit(0); }
const a = "  const CSS = CSS0 + '\\n' + NODE_RULES";
if (!s.includes(a)) throw new Error('CSS 줄 없음');
s = s.replace(a, "  let CSS = CSS0 + '\\n' + NODE_RULES");
const b = "  const LIGHT_CSS = ['/* ' + r.S.name";
if (!s.includes(b)) throw new Error('LIGHT_CSS 줄 없음');
s = s.replace(b, "  let LIGHT_CSS = ['/* ' + r.S.name");
const c = "  const G = PX.toUpperCase();";
if (!s.includes(c)) throw new Error('G 줄 없음');
s = s.replace(c, [
  '  /* OVERLAY_SCOPE — 얹는 화면은 바탕(dmp) 뿌리 안에 들어간다. 바탕의 \'.dmp-root .x12\' · \'.dmp-root .n2921_1215\' 규칙이',
  '     팝업 안의 같은 이름 클래스에 걸리지 않게 얹는 쪽의 x · n 클래스에 화면 접두어를 붙인다(FEMS 생성기에서 옮김). */',
  '  if (r.S.overlay) {',
  "    const sc = (t) => t.replace(/\\.(x\\d+|n[0-9I][\\w]*)(?![\\w-])/g, '.' + PX + '_$1');",
  '    CSS = sc(CSS); LIGHT_CSS = sc(LIGHT_CSS);',
  "    r.html = r.html.replace(/class=\"([^\"]*)\"/g, (m, k0) => 'class=\"' + k0.split(/\\s+/).map((k) => /^(x\\d+|n[0-9I]\\w*)$/.test(k) ? PX + '_' + k : k).join(' ') + '\"');",
  '  }',
  c,
].join('\n'));
fs.writeFileSync(p, s);
console.log('ok');
