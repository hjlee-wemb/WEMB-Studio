/* conv.js 보강 — 실측으로 찾은 것.
   ① Figma 는 고정 높이 칸의 안쪽 여백을 무시하지만 CSS 는 border-box 안에서 여백만큼 칸을 키운다.
      Td(높이 26, 위아래 여백 17.6)가 37px 로 자라서 표가 밀렸다 → h-full 인 Td 의 위아래 여백을 뺀다.
   ② 글자 폭 맞춤 — font-fit.json(글자 묶음 → 실제 Figma 렌더 크기). Figma 인스턴스 글자는 저장된 글리프로 그려져
      값보다 작게 보이는 묶음이 있다(트리 항목 등). 원본 렌더를 재서 만든 표로 맞춘다. */
'use strict';
const fs = require('fs'), path = require('path');
const P = path.join(__dirname, 'conv.js');
let c = fs.readFileSync(P, 'utf8');
if (c.includes('/* DRAWING_FIX_A */')) { console.log('이미 적용됨'); process.exit(0); }
const at = "const src = normFonts(fs.readFileSync(path.join(GEN, 'dc-' + S.key + '.txt'), 'utf8')).replace(/px-[580px]/g, 'px-[0px]');";
if (!c.includes(at)) throw new Error('자리 없음');
c = c.replace(at, [
  '/* DRAWING_FIX_A */',
  "  const FF = fs.existsSync(path.join(GEN, 'font-fit.json')) ? JSON.parse(fs.readFileSync(path.join(GEN, 'font-fit.json'), 'utf8')) : {};",
  "  let src = normFonts(fs.readFileSync(path.join(GEN, 'dc-' + S.key + '.txt'), 'utf8')).replace(/px-\\[580px\\]/g, 'px-[0px]');",
  "  src = src.replace(/className=\"([^\"]*\\bh-full\\b[^\"]*)\" data-node-id=\"[^\"]*\" data-name=\"Td\\/[^\"]*\"/g, (m, k) => m.replace(k, k.replace(/ ?py-\\[[\\d.]+px\\]/, '')));",
  "  for (const id of Object.keys(FF)) {",
  "    const esc = id.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');",
  "    src = src.replace(new RegExp('(className=\"[^\"]*?)text-\\\\[[\\\\d.]+px\\\\]([^\"]*\" data-node-id=\"' + esc + '\")', 'g'), '$1text-[' + FF[id] + 'px]$2');",
  "  }",
].join('\n'));
fs.writeFileSync(P, c);
console.log('ok');
