/* ① 지도(라이트) = korea-map-lt.svg 한 장 ② 글자 색 표 ③ 화면 규칙 다시 쓰기. 한 번만. */
'use strict';
const fs = require('fs'), path = require('path');
/* ① conv.js */
let c = fs.readFileSync(path.join(__dirname, 'conv.js'), 'utf8');
const a = c.indexOf("        { tag: 'div', attrs: { className: 'absolute inset-0', 'data-name': 'Map Light' }");
const b = c.indexOf('      ];', a);
if (a < 0 || b < 0) throw new Error('Map Light 자리 없음');
c = c.slice(0, a) + `        { tag: 'div', attrs: { className: 'absolute inset-0', 'data-name': 'Map Light' }, scope: sc, children: [
          { tag: 'div', attrs: { className: box2(R), 'data-name': 'Regions' }, scope: sc, children: [{ tag: 'img', attrs: { alt: '', className: IMGC, src: { expr: 'imgKoreaLt' } }, scope: sc, children: [] }] },
        ] },
` + c.slice(b);
c = c.replace("imgKoreaRaw: big ? 'korea-map-lg-raw.png' : 'korea-map-raw.png' }", "imgKoreaLt: 'korea-map-lt.svg' }");
fs.writeFileSync(path.join(__dirname, 'conv.js'), c);
for (const f of ['korea-map-raw.png', 'korea-map-lg-raw.png']) { const p = path.join(__dirname, '..', f); if (fs.existsSync(p)) fs.unlinkSync(p); }

/* ② 글자 색 — 흰 판에서 4.5:1 이상, 색 뜻은 유지 */
let p = fs.readFileSync(path.join(__dirname, 'light-palette.js'), 'utf8');
if (!p.includes("'#7fd3fa': '#0b6f9e'")) {
  p = p.replace("const TEXT = {\n", "const TEXT = {\n  '#7fd3fa': '#0b6f9e', '#1bf0c2': '#0a7d63', '#ff6a6a': '#c93636', '#ffb742': '#a8660a', '#57daff': '#0a7aa6', '#ffdc8c': '#96670c',\n  '#f4f4f4': INK, '#eee': INK, '#eeeeee': INK, '#ededed': INK, '#f3f3f3': INK, '#c8e5f2': SUB, '#00e7ff': '#0a7aa6', '#00ff9c': '#0b7d52', '#27303a': INK,\n  'rgba(255,255,255,0.4)': MUTE, 'rgba(191,202,207,0.3)': MUTE,\n");
  fs.writeFileSync(path.join(__dirname, 'light-palette.js'), p);
}

/* ③ 화면 규칙 */
let m = fs.readFileSync(path.join(__dirname, 'mk-screen-css.js'), 'utf8');
const s0 = m.indexOf('/* 라이트 — 자동 반전 금지'), s1 = m.indexOf('const OUT = {};');
if (s0 < 0 || s1 < 0) throw new Error('LIGHT 자리 없음');
m = m.slice(0, s0) + `/* 라이트 — 자동 반전 금지(다크 → 라이트 원칙). 판 = 흰색 + 옅은 선 + 부드러운 그림자, 칸 = 옅은 회청, 글자 3단.
   그림은 mk-light-newbiz.js 의 라이트 사본(필터로 억지로 어둡게 하지 않는다) */
const LINE = '#dde7f0';
const PLATE = 'background:#fff!important;background-image:none!important;border-color:' + LINE + '!important;box-shadow:0 1px 2px rgba(24,60,96,.04),0 10px 30px rgba(24,60,96,.07)!important;';
const LIGHT = [
  L('> [data-node-id]{background-color:#f3f6fa!important;}'),
  /* 머리 */
  L('[data-name="Nav Bar"]{background:#fff!important;box-shadow:inset 0 -1px 0 ' + LINE + ';}'),
  L('[data-name="Nav Group"] > p{color:#2c3e54!important;}'),
  L('[data-name="Header"]{background:#fff!important;background-image:none!important;border-bottom:1px solid ' + LINE + '!important;box-shadow:0 2px 10px rgba(24,60,96,.04);}'),
  L('[data-name="Page Title"],[data-name="Brand"] p{color:#0b6f9e!important;}'),
  L('[data-name="Toolbar"]{border-color:' + LINE + '!important;}'),
  L('[data-name="Toolbar"] > div:first-child{background:#f6f9fc!important;}'),
  L('[data-name="Toolbar"] > div:last-child{box-shadow:none!important;}'),
  L('[data-name="Logo Mark"] img:not(.tpl-studio-logo){filter:brightness(.18);}'),
  /* 판 */
  L('[data-name="Card BG"]:not(:has(> [data-name])),[data-name="Overlay"],[data-name="Background"] > [data-name="Base"]{' + PLATE + '}'),
  L('[data-name="Card BG"] > div,[data-name="Overlay"] > div,[data-name="Background"] > [data-name="Base"] > div{background:none!important;box-shadow:none!important;}'),
  L('[data-name="Card BG"]::after,[data-name="Overlay"]::after,[data-name="Base"]::after{border-color:' + LINE + '!important;border-image:none!important;}'),
  L('[data-name="Image"]{display:none!important;}'),
  /* 지도 판 — 바다처럼 아주 옅은 물빛 */
  L('[data-name="Overlay"]{background:radial-gradient(70% 62% at 56% 50%,#edf7fd 0%,#f8fcfe 62%,#fff 100%)!important;}'),
  /* 격자 */
  L('[data-name="Fill"]{display:none!important;}'),
  L('[data-name="Cell Column"],[data-name="Dot Column"]{opacity:.1!important;}'),
  /* 지도 */
  L('[data-name="Map Render"]{display:none;}'),
  L('[data-name="Map Light"]{display:block;}'),
  L('[data-name="Map Light"] > [data-name="Regions"]{filter:drop-shadow(0 10px 18px rgba(40,110,170,.2));}'),
  L('[data-name^="Korea Map (Dim"]{opacity:.8!important;}'),
  L('[data-name="Continent"]{filter:saturate(.62) brightness(1.42) contrast(.86);}'),
  L('[data-name="Hotspot"] [data-name="Pattern"]{opacity:.75;}'),
  /* 말풍선 — 면은 흰색, 선과 글자에 색 */
  L('[data-name^="Callout/"] [data-name="Label"]{box-shadow:0 3px 10px rgba(24,60,96,.1)!important;}'),
  L('[data-name^="Callout/"] [data-name="Label"] > div{box-shadow:none!important;}'),
  L('[data-name^="Callout/"] [data-name="Label"] > div:first-child{background:#fff!important;background-image:none!important;}'),
  L('[data-name^="Callout/"] [data-name="Label"] p{color:#2c3e54!important;}'),
  L('[data-name*="(Selected)"] [data-name="Label"] > div:first-child{background:#eaf6fd!important;}'),
  L('[data-name*="(Selected)"] [data-name="Label"] p{color:#0d3f63!important;font-weight:600!important;}'),
  L('[data-name="Solar Panel Image"] img{filter:drop-shadow(0 2px 3px rgba(24,60,96,.28));}'),
  L('[data-name*="(Selected)"] [data-name="Solar Panel Image"] img{filter:drop-shadow(0 2px 8px rgba(0,150,210,.6));}'),
  L('[data-name*="(Selected)"] [data-name="Turbine Image"] img{filter:drop-shadow(0 2px 8px rgba(0,150,210,.6));}'),
  L('[data-name="Column/Labels"] [data-name="Visual"] img{filter:brightness(.55);}'),
  /* 타임라인 */
  L('[data-name="Tabs"] > :not([data-hn-status="Select"]) > div:first-child{background:#fff!important;background-image:none!important;}'),
  L('[data-name="Tabs"] > :not([data-hn-status="Select"]){box-shadow:inset 0 0 0 1px ' + LINE + ';border-radius:6px 6px 0 0;}'),
  L('[data-name="Tabs"] > :not([data-hn-status="Select"]) > div:last-child{box-shadow:none!important;border-color:transparent!important;}'),
  L('[data-name="Tabs"] > :not([data-hn-status="Select"]) p{color:#4f6279!important;}'),
  L('[data-name="Track"]{opacity:.9;}'),
  /* 표 */
  L('[data-name^="Th/"] [data-name="Background"]{background:#f0f5f9!important;background-image:none!important;border-color:' + LINE + '!important;box-shadow:none!important;}'),
  L('[data-name^="Th/"] [data-name="Background"]::after{border-color:' + LINE + '!important;border-image:none!important;}'),
  L('[data-name^="Th/"] p{color:#2c3e54!important;}'),
  L('[data-name="Th/Status"] p{color:#0b6f9e!important;}'),
  L('[data-name="Rows"] > [data-name^="Row/"] > div:not([data-name]):first-child{background:#fff!important;}'),
  L('[data-name="Rows"] > [data-name^="Row/"]:nth-child(even) > div:not([data-name]):first-child{background:#f8fbfd!important;}'),
  L('[data-name="Rows"] > [data-name^="Row/"]:not([data-name="Row/Total"]) > div:not([data-name]):last-child{mix-blend-mode:normal;box-shadow:inset 0 1px 0 ' + LINE + '!important;}'),
  L('[data-name="Row/Total"] > div:not([data-name]):first-child{background:#eaf5fc!important;}'),
  L('[data-name="Row/Total"] p{color:#0d3f63!important;}'),
  L('[data-name="Badge"]{box-shadow:none!important;}'),
  L('[data-name="Input"]{background:#fff!important;box-shadow:inset 0 0 0 1px #c9d9e6!important;}'),
  L('[data-name="Input"] p{color:#2c3e54!important;}'),
  L('[data-name="Tooltip"] [data-name="Bubble"]{background:#15253a!important;}'),
  L('[data-name="Tooltip"] [data-name="Bubble"] p{color:#fff!important;}'),
  /* 제목 판 */
  L('[data-name="Title"] > p{background-image:none!important;color:#0d3f63!important;-webkit-text-fill-color:#0d3f63;text-shadow:none!important;}'),
  L('[data-name="Title"] > [data-name="Background"]{background-image:linear-gradient(90deg,rgba(0,140,205,.12) 4.5%,rgba(0,140,205,0) 100%)!important;}'),
  /* 팝업 · 2040 목표 */
  L('[data-name^="Popup/"]{background:#fff!important;background-image:none!important;box-shadow:0 14px 40px rgba(24,60,96,.16)!important;}'),
  L('[data-name^="Popup/"] > div:not([data-name]){background:#fff!important;background-image:none!important;box-shadow:none!important;}'),
  L('[data-name^="Popup/"] [data-name="Header Row"],[data-name^="Popup/"] [data-name="Header Row"] > *{background:#eef5fa!important;background-image:none!important;}'),
  L('[data-name^="Popup/"] [data-name="Th"]{background:#f6f9fc!important;}'),
  L('[data-name^="Popup/"] [data-name="Td"]{background:#fff!important;}'),
  L('[data-name="Widget/2040 Target"]{box-shadow:0 14px 40px rgba(24,60,96,.14)!important;}'),
  L('[data-name="Widget/2040 Target"] > div:not([data-name]):first-child{background:#fff!important;background-image:none!important;box-shadow:none!important;}'),
  L('[data-name="Widget/2040 Target"] > div:not([data-name]):last-child{background:none!important;box-shadow:none!important;}'),
  L('[data-name="Widget/2040 Target"] [data-name="Title"]{background:#f0f5f9!important;background-image:none!important;}'),
  /* 해외 */
  L('[data-name^="Flag/"]{border-radius:50%;box-shadow:0 0 0 1px #c3d2df;}'),
  L('[data-name^="Route Label/"]{box-shadow:0 4px 12px rgba(30,110,170,.18)!important;}'),
  L('[data-name^="Tag/"]{box-shadow:0 2px 6px rgba(24,60,96,.12);}'),
];
` + m.slice(s1);
/* 태양광 · 선택 빛 — CSS box-shadow 는 투명 그림의 네모 상자를 따라 그려지고, Visual 의 clip 이 빛을 자른다. 그림 모양을 따르는 drop-shadow 로 */
const anchor = "  /* 표 줄 윗선 — 흰 안쪽 그림자가";
if (!m.includes('Solar Panel Image"]{box-shadow:none')) {
  m = m.replace(anchor, `  /* 태양광 · 선택 빛 — box-shadow 는 투명 그림의 네모 상자를 따라 그려지고 Visual 의 clip 이 빛을 자른다. 그림 모양을 따르는 drop-shadow 로 */
  R('[data-name="Visual"]{overflow:visible!important;}'),
  R('[data-name="Solar Panel Image"],[data-name="Turbine Image"]{box-shadow:none!important;}'),
  R('[data-name="Solar Panel Image"] > div,[data-name="Turbine Image"] > div{box-shadow:none!important;}'),
  R('[data-name="Solar Panel Image"] img{filter:drop-shadow(0 2px 3px rgba(0,0,0,.35));}'),
  R('[data-name*="(Selected)"] [data-name="Solar Panel Image"] img,[data-name*="(Selected)"] [data-name="Turbine Image"] img{filter:drop-shadow(0 0 1px #00e7ff) drop-shadow(0 0 6px #00e7ff) drop-shadow(0 0 16px rgba(0,231,255,.8));}'),
` + anchor);
}
fs.writeFileSync(path.join(__dirname, 'mk-screen-css.js'), m);
console.log('ok');
