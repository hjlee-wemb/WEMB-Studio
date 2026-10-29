/* 유리(배경 흐림) 그림을 인라인 SVG 로 심는다 — patch 한 번만.
   Figma 는 BACKGROUND_BLUR 를 <foreignObject> 안의 backdrop-filter div 로 내보낸다. <img> 로 넣으면 브라우저가
   foreignObject 를 그리지 않아 유리판 뒤가 흐려지지 않는다(아이콘 배지 · KPI 카드 · 판 테두리).
   그래서 이런 파일은 원본 SVG 를 손대지 않고 그대로 인라인으로 심는다 — url(#…) id 만 자리마다 새로 짓고,
   라이트 사본(-lt.svg)이 있으면 같이 심어 [data-theme] 로 하나만 보인다. 색 · 도형은 원본 그대로. */
'use strict';
const fs = require('fs'), path = require('path');
const p = path.join(__dirname, 'conv.js');
let s = fs.readFileSync(p, 'utf8');
if (s.includes('function glassSvg(')) { console.log('이미 있음'); process.exit(0); }
const A1 = "      if (INLINE_SVG.indexOf(f) >= 0) {                    /* 통짜 그림 대신 DOM 으로 심는다 */";
if (!s.includes(A1)) throw new Error('anchor1');
s = s.replace(A1, "      if (/\.svg$/.test(f) && /<foreignObject/.test(fs.readFileSync(path.join(ART, f), 'utf8'))) {   /* 유리 그림 — patch-glass.js */\n"
  + "        usedAssets.add(f);\n        glassSvg(f, attrs, pad);\n        return;\n      }\n" + A1);
const A2 = '  function inlineSvg(file, attrs, name, pad) {';
s = s.replace(A2, [
  '  /* 유리 그림을 원본 그대로 인라인으로 — id 만 새로 짓는다. 라이트 사본은 형제로 두고 테마로 고른다. */',
  '  function glassSvg(file, attrs, pad) {',
  '    const one = (f, extra) => {',
  "      let raw = fs.readFileSync(path.join(ART, f), 'utf8');",
  "      const tagId = 'g' + (++inlineSeq);",
  '      const ids = [...new Set([...raw.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))];',
  '      for (const rid of ids) {',
  "        const esc = rid.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');",
  "        raw = raw.replace(new RegExp('id=\"' + esc + '\"', 'g'), 'id=\"' + tagId + '-' + slug(rid) + '\"')",
  "          .replace(new RegExp('url\\(#' + esc + '\\)', 'g'), 'url(#' + tagId + '-' + slug(rid) + ')')",
  "          .replace(new RegExp('href=\"#' + esc + '\"', 'g'), 'href=\"#' + tagId + '-' + slug(rid) + '\"');",
  '      }',
  '      const open = raw.match(/<svg([^>]*)>/);',
  "      const inner = raw.slice(raw.indexOf('>', raw.indexOf('<svg')) + 1, raw.lastIndexOf('</svg>'));",
  '      const keep = (open ? open[1] : \'\').replace(/\s(width|height|style|id|class)="[^"]*"/g, \'\');',
  "      return pad + '<svg ' + attrs.concat(extra).join(' ') + keep + ' aria-hidden=\"true\">' + inner.replace(/\n/g, '') + '</svg>';",
  '    };',
  "    const lt = f2lt(file);",
  "    out.push(one(file, lt ? ['data-sh-theme=\"dark\"'] : []));",
  "    if (lt) out.push(one(lt, ['data-sh-theme=\"light\"']));",
  '  }',
  "  function f2lt(f) { const l = f.replace(/\.svg$/, '-lt.svg'); return fs.existsSync(path.join(ART, l)) ? l : null; }",
  A2].join('\n'));
fs.writeFileSync(p, s);
console.log('patched');
