/* conv.js 고침 2 — 이 파일은 Figma stroke 가 오토레이아웃 크기에 안 들어간다(패딩은 상자 끝부터).
   CSS border 로 두면 안쪽이 1px 밀리고 상자가 2px 커져 아래가 줄줄이 밀린다 →
   모든 테두리를 안쪽 링(::after)으로 그린다. 한쪽 선(Side Bar · Header · Panel Toggle)도 같은 링에 쪽별 두께로.
   가운데 정렬 선(Body 1:663 · 1:2109)만 절반 밖으로. 실행: node patch-conv2.js */
'use strict';
const fs = require('fs'), path = require('path');
const p = path.join(__dirname, 'conv.js');
let s = fs.readFileSync(p, 'utf8');
if (s.includes('ALL_RING')) { console.log('이미 고침'); process.exit(0); }
const rep = (a, b) => { if (!s.includes(a)) throw new Error('못 찾음: ' + a.slice(0, 90)); s = s.split(a).join(b); };
rep("const RING_STROKE = [];", "const RING_STROKE = ['1:663', '1:2109'];");
rep("const thin = !!S.sop && inSopDialog && !hasSide && thinW > 0;",
  "const centerKey = RING_STROKE.indexOf(String(nid || '').split(';').pop()) >= 0;\n    const thin = !centerKey && !hasSide && thinW > 0; /* ALL_RING */");
rep("if (bwI >= 0 && !hasSide && parseFloat(decls[bwI][1]) > 0 && (outside || thin || RING_STROKE.indexOf(ringKey) >= 0)) {",
  "if (bwI >= 0 && !hasSide && parseFloat(decls[bwI][1]) > 0 && (outside || thin || centerKey)) {");
/* 한쪽 선 */
rep("    /* 헤더 탭 상태 바로잡기 — 그림과 함께 글자색도 상태를 따라간다(선택=흰색, 기본=회색) */",
  [
    "    if (hasSide) {",
    "      const w = (k) => { const d = decls.find((x) => x[0] === 'border-' + k + '-width'); return d ? d[1] : '0'; };",
    "      const bc = (decls.find((x) => x[0] === 'border-color') || [, 'currentColor'])[1];",
    "      const widths = [w('top'), w('right'), w('bottom'), w('left')].join(' ');",
    "      for (let i = decls.length - 1; i >= 0; i--) if (/^border-((top|right|bottom|left)-)?(width|color|style)$/.test(decls[i][0])) decls.splice(i, 1);",
    "      if (!decls.some((x) => x[0] === 'position')) decls.push(['position', 'relative']);",
    "      ring = ROOT + ' .' + uc + '::after{content:\"\";position:absolute;inset:0;border:1px solid ' + bc + ';border-radius:inherit;border-width:' + widths + ';pointer-events:none;}';",
    "      ringFixes++;",
    "    }",
    "    /* 헤더 탭 상태 바로잡기 — 그림과 함께 글자색도 상태를 따라간다(선택=흰색, 기본=회색) */",
  ].join('\n'));
/* 라이트 — 두께는 두고 색만 */
rep("darkRules.push(ROOT + '[data-theme=\"light\"] .' + uc + '::after{border:' + nb + ';}');",
  "darkRules.push(ROOT + '[data-theme=\"light\"] .' + uc + '::after{border-color:' + nb.replace(/^\\S+\\s+\\S+\\s+/, '') + ';}');");
fs.writeFileSync(p, s);
console.log('ok');
