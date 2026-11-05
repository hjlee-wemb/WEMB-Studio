/* ① L() — 쉼표로 이은 선택자마다 테마 조건을 붙인다(뒤쪽 선택자가 다크에도 먹어 판이 하얘졌다)
   ② 라이트 지도 — Regions 벡터의 노이즈가 거칠다. 원본 렌더(korea-map-raw)를 Regions 모양으로 오려 쓴다
   ③ 배치 초기화 단추가 시계를 가린다. 한 번만. */
'use strict';
const fs = require('fs'), path = require('path');
let m = fs.readFileSync(path.join(__dirname, 'mk-screen-css.js'), 'utf8');
m = m.replace(`const L = (t) => '.{{PX}}-root[data-theme="light"] ' + t;`, `/* 쉼표로 이은 선택자마다 테마 조건을 붙인다. :not(...) · :has(...) 안의 쉼표는 나누지 않는다 */
const L = (t) => {
  const i = t.indexOf('{'), sel = t.slice(0, i), body = t.slice(i), parts = [];
  let d = 0, cur = '';
  for (const ch of sel) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && !d) { parts.push(cur); cur = ''; } else cur += ch; }
  parts.push(cur);
  return parts.map((s) => '.{{PX}}-root[data-theme="light"] ' + s.trim()).join(',') + body;
};`);
m = m.replace(`L('[data-name="Map Light"] > [data-name="Regions"]{filter:saturate(.9) brightness(1.06);}'),`, `L('[data-name="Map Light"] > [data-name="Regions"]{filter:brightness(1.22) saturate(1.05);}'),`);
fs.writeFileSync(path.join(__dirname, 'mk-screen-css.js'), m);

let c = fs.readFileSync(path.join(__dirname, 'conv.js'), 'utf8');
const a = c.indexOf("          { tag: 'div', attrs: { className: box2(R), 'data-name': 'Regions' }");
const b = c.indexOf('\n', a);
if (a < 0) throw new Error('Regions 자리 없음');
c = c.slice(0, a) + `          { tag: 'div', attrs: { className: box2(R), 'data-name': 'Regions', style: { expr: '({ maskImage: \`url("\${imgRegions}")\`, maskSize: "100% 100%", maskRepeat: "no-repeat" })' } }, scope: sc, children: [{ tag: 'img', attrs: { alt: '', className: 'absolute block max-w-none left-[' + (rx - R[0]).toFixed(2) + 'px] top-[' + (ry - R[1]).toFixed(2) + 'px] w-[' + (big ? 529.79 : 481) + 'px] h-[' + (big ? 821.14 : 745.06) + 'px]', src: { expr: 'imgKoreaRaw' } }, scope: sc, children: [] }] },` + c.slice(b);
c = c.replace("const sc = Object.assign({}, n.scope, { imgKoreaMapPng: big ? 'korea-map-lg.png' : 'korea-map.png' });", "const sc = Object.assign({}, n.scope, { imgKoreaMapPng: big ? 'korea-map-lg.png' : 'korea-map.png', imgKoreaRaw: big ? 'korea-map-lg-raw.png' : 'korea-map-raw.png' });");
fs.writeFileSync(path.join(__dirname, 'conv.js'), c);

for (const f of ['korea-map-raw.png', 'korea-map-lg-raw.png']) fs.copyFileSync(path.join(__dirname, f), path.join(__dirname, '..', f));

let l = fs.readFileSync(path.join(__dirname, 'live-src.js'), 'utf8');
l = l.replace("display:none;position:absolute;right:40px;top:78px;z-index:30;", "display:none;position:absolute;right:300px;top:78px;z-index:30;");
fs.writeFileSync(path.join(__dirname, 'live-src.js'), l);
console.log('ok');
