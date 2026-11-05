/* ① 지도: 다크 = 통째 그림, 라이트 = 원본 벡터(Outline + Regions). 어두운 바탕이 구워진 그림은 밝은 판에서 검은 테가 남는다
   ② 생성물 머리말의 파일 키. 한 번만. */
'use strict';
const fs = require('fs'), path = require('path');
const f = path.join(__dirname, 'conv.js');
let c = fs.readFileSync(f, 'utf8');
const a = c.indexOf("      n.children = [{ tag: 'img', attrs: { alt: '', className: 'absolute block inset-0 max-w-none size-full', src: { expr: 'imgKoreaMapPng' } }");
const b = c.indexOf('      return;\n    }\n    (n.children || []).forEach(swapMap);');
if (a < 0 || b < 0) throw new Error('자리 없음');
c = c.slice(0, a) + `      const sc = Object.assign({}, n.scope, { imgKoreaMapPng: big ? 'korea-map-lg.png' : 'korea-map.png' });
      /* 라이트 벡터 상자 — 렌더 상자(rx,ry) 기준으로 metadata 의 Regions · Outline 자리 */
      const rx = big ? 729.68 : 237, ry = big ? 191.81 : 297.7;
      const R = big ? [741, 203.2, 507.3, 798.7] : [247.8, 308.1, 459.7, 723.9];
      const O = big ? [740.25, 202.38, 508.65, 800] : [247, 307.7, 461, 725.06];
      const box2 = (b0) => 'absolute left-[' + (b0[0] - rx).toFixed(2) + 'px] top-[' + (b0[1] - ry).toFixed(2) + 'px] w-[' + b0[2] + 'px] h-[' + b0[3] + 'px]';
      const IMGC = 'absolute block inset-0 max-w-none size-full';
      n.children = [
        { tag: 'div', attrs: { className: 'absolute inset-0', 'data-name': 'Map Render' }, scope: sc, children: [{ tag: 'img', attrs: { alt: '', className: IMGC, src: { expr: 'imgKoreaMapPng' } }, scope: sc, children: [] }] },
        { tag: 'div', attrs: { className: 'absolute inset-0', 'data-name': 'Map Light' }, scope: sc, children: [
          { tag: 'div', attrs: { className: box2(O), 'data-name': 'Outline' }, scope: sc, children: [{ tag: 'img', attrs: { alt: '', className: IMGC, src: { expr: 'imgOutline' } }, scope: sc, children: [] }] },
          { tag: 'div', attrs: { className: box2(R), 'data-name': 'Regions' }, scope: sc, children: [{ tag: 'img', attrs: { alt: '', className: IMGC, src: { expr: 'imgRegions' } }, scope: sc, children: [] }] },
        ] },
      ];
` + c.slice(b);
c = c.split('lyDJkcOlrznLKWo7mD7C2n').join('cES6X45zHjsaabaXL1cdrt');
fs.writeFileSync(f, c);
console.log('ok');
