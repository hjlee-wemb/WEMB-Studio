/* 화면별 규칙(screen-css.json) — design context 가 뭉갠 자리를 바로잡고, 라이트 테마를 역할별로 적는다.
   실행: node mk-screen-css.js → node conv.js */
'use strict';
const fs = require('fs'), path = require('path');
const KEYS = ['1-2634', '1-3482', '1-4335', '1-52', '1-912', '1-1773', '1-6841', '1-5184', '1-6013', '1-7644', '1-8494'];
const R = (t) => { const i = t.indexOf('{'), sel = t.slice(0, i), parts = []; let d = 0, cur = ''; for (const ch of sel) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && !d) { parts.push(cur); cur = ''; } else cur += ch; } parts.push(cur); return parts.map((s) => '.{{PX}}-root ' + s.trim()).join(',') + t.slice(i); };
/* 쉼표로 이은 선택자마다 테마 조건을 붙인다. :not(...) · :has(...) 안의 쉼표는 나누지 않는다 */
const L = (t) => {
  const i = t.indexOf('{'), sel = t.slice(0, i), body = t.slice(i), parts = [];
  let d = 0, cur = '';
  for (const ch of sel) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && !d) { parts.push(cur); cur = ''; } else cur += ch; }
  parts.push(cur);
  return parts.map((s) => '.{{PX}}-root[data-theme="light"] ' + s.trim()).join(',') + body;
};
const COMMON = [
  /* 지도 — 다크는 통째 그림, 라이트는 원본 벡터 */
  R('[data-name="Map Light"]{display:none;}'),
  R('[data-name="Region Overlay"]{mix-blend-mode:soft-light;opacity:.8;}'),
  /* 태양광 · 선택 빛 — box-shadow 는 투명 그림의 네모 상자를 따라 그려지고 Visual 의 clip 이 빛을 자른다. 그림 모양을 따르는 drop-shadow 로 */
  R('[data-name="Visual"]{overflow:visible!important;}'),
  R('[data-name="Solar Panel Image"],[data-name="Anemometer Image"]{box-shadow:none!important;}'),
  R('[data-name="Solar Panel Image"] > div,[data-name="Anemometer Image"] > div{box-shadow:none!important;}'),
  R('[data-name="Solar Panel Image"] img{filter:drop-shadow(0 2px 3px rgba(0,0,0,.35));}'),
  R('[data-name*="(Selected)"] [data-name="Solar Panel Image"] img,[data-name*="(Selected)"] [data-name="Anemometer Image"] img{filter:drop-shadow(0 0 1px #00e7ff) drop-shadow(0 0 6px #00e7ff) drop-shadow(0 0 16px rgba(0,231,255,.8));}'),
  /* 표 줄 윗선 — 흰 안쪽 그림자가 soft-light 효과라 그대로 두면 흰 줄이 된다 */
  R('[data-name="Rows"] > [data-name^="Row/"]:not([data-name="Row/Total"]) > div:not([data-name]):last-child{mix-blend-mode:soft-light;}'),
  /* 스크롤은 되고 막대는 시안처럼 안 보이게 */
  R('[data-name="Rows"]{scrollbar-width:none;}'),
  R('[data-name="Rows"]::-webkit-scrollbar{display:none;}'),
  /* 시안 글꼴 SUIT 폭에 맞춘 풍력터빈선정 자간(-2.67) · 줄 높이를 Pretendard 에선 옆 글자와 같게 */
  ...['1:884', '1:1740', '1:2605', '1:3454', '1:4302', '1:5155'].map((id) => R('[data-node-id="' + id + '"]{letter-spacing:normal!important;line-height:27px!important;height:27px!important;width:auto!important;}')),
  /* 제목 판 선 — Figma 는 그라디언트 선(0.82, 72% 에서 사라짐)인데 design context 는 단색으로 준다 */
  R('[data-name="Title"] > [data-name="Background"]::after{border-image:linear-gradient(90deg,rgba(0,217,255,.82) 4.3%,rgba(0,217,255,0) 72%) 1;}'),
  R('[data-name="Title"] > p{font-weight:700!important;}'),
  /* 원래 자리(가로 가운데 1143) — 시안의 좁아진 글자 때문에 묶음이 8px 밀려 있다 */
  ...['1:883', '1:1739', '1:2604', '1:3453', '1:4301', '1:5154'].map((id) => R('[data-node-id="' + id + '"]{gap:4px!important;left:1085px!important;width:116px!important;}')),
];
/* 라이트 — 자동 반전 금지(다크 → 라이트 원칙). 판 = 흰색 + 옅은 선 + 부드러운 그림자, 칸 = 옅은 회청, 글자 3단.
   그림은 mk-light-newbiz.js 의 라이트 사본(필터로 억지로 어둡게 하지 않는다) */
const LINE = '#dde7f0';
const PLATE = 'background:#fff!important;background-image:none!important;border-color:' + LINE + '!important;box-shadow:0 1px 2px rgba(24,60,96,.04),0 10px 30px rgba(24,60,96,.07)!important;';
const LIGHT = [
  /* 화면 틀에만 — 에셋 라이브러리 사본(.hj-asset)은 잘라 온 노드가 바로 아래라 면이 깔린다 */
  '.{{PX}}-root[data-theme="light"]:not(.hj-asset) > [data-node-id]{background-color:#f3f6fa!important;}',
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
  L('[data-name="Continent"]{filter:saturate(.5) brightness(1.62) contrast(.78);}'),
  L('[data-name="Hotspot"] [data-name="Pattern"]{opacity:.75;}'),
  L('[data-name="Hotspot"] [data-name="Marker"]{filter:brightness(1.7) saturate(.75);opacity:.65;}'),
  /* 말풍선 — 면은 흰색, 선과 글자에 색 */
  L('[data-name^="Callout/"] [data-name="Label"]{box-shadow:0 3px 10px rgba(24,60,96,.1)!important;}'),
  L('[data-name^="Callout/"] [data-name="Label"] > div{box-shadow:none!important;}'),
  L('[data-name^="Callout/"] [data-name="Label"] > div:first-child{background:#fff!important;background-image:none!important;}'),
  L('[data-name^="Callout/"] [data-name="Label"] p{color:#2c3e54!important;}'),
  L('[data-name*="(Selected)"] [data-name="Label"] > div:first-child{background:#eaf6fd!important;}'),
  L('[data-name*="(Selected)"] [data-name="Label"] p{color:#0d3f63!important;font-weight:600!important;}'),
    L('[data-name="Character Image"] img{filter:drop-shadow(0 2px 4px rgba(24,60,96,.18));}'),
  L('[data-name="Solar Panel Image"] img{filter:brightness(1.48) saturate(.95) drop-shadow(0 2px 3px rgba(24,60,96,.2));}'),
  L('[data-name*="(Selected)"] [data-name="Solar Panel Image"] img{filter:brightness(1.48) saturate(.95) drop-shadow(0 2px 8px rgba(0,150,210,.6));}'),
  L('[data-name*="(Selected)"] [data-name="Anemometer Image"] img{filter:drop-shadow(0 2px 8px rgba(0,150,210,.6));}'),
  L('[data-name="Column/Labels"] [data-name="Visual"] img{filter:brightness(.95);}'),
  /* 타임라인 */
  L('[data-name="Tabs"] > :not([data-hn-status="Select"]) > div:first-child{background:#fff!important;background-image:none!important;}'),
  L('[data-name="Tabs"] > :not([data-hn-status="Select"]){box-shadow:inset 0 0 0 1px ' + LINE + ';border-radius:6px 6px 0 0;}'),
  L('[data-name="Tabs"] > :not([data-hn-status="Select"]) > div:last-child{box-shadow:none!important;border-color:transparent!important;}'),
  L('[data-name="Tabs"] > :not([data-hn-status="Select"]) p{color:#4f6279!important;}'),
  L('[data-name="Tabs"] > :not([data-hn-status="Select"]) *{border-color:transparent!important;}'),
  L('[data-name="Tabs"] > :not([data-hn-status="Select"])::after,[data-name="Tabs"] > :not([data-hn-status="Select"]) > div::after{border-color:' + LINE + '!important;}'),
  L('[data-name="Track"]{opacity:.9;}'),
  L('[data-name="Column/Labels"] [data-name="List"]{border-color:#c9d9e6!important;}'),
  L('[data-name="Column/Labels"] [data-name="List"]::after{border-color:#c9d9e6!important;}'),
  /* 편집 · 삭제 단추 — 회색 칸을 옅게 */
  L('[data-name="Button/Edit"],[data-name="Button/Delete"],[data-name="Button/Edit"] > *:not([data-name^="Icon/"]),[data-name="Icon Button"]{background-color:#f0f5f9!important;background-image:none!important;box-shadow:none!important;}'),
  L('[data-name$="(Hover)"] [data-name="Icon Button"]{background-color:#e3f2fb!important;}'),
  /* 2040 칸 — 회색 덩어리 대신 흰 칸 + 아주 옅은 줄 */
  L('[data-name="Column/Labels"] [data-name="List"],[data-name^="Column/20"]{background:#fff!important;background-image:none!important;box-shadow:none!important;}'),
  L('[data-name="Column/Labels"] [data-name="List"] > *,[data-name^="Column/20"] > [data-name^="Td/"]{background:transparent!important;background-image:none!important;box-shadow:none!important;}'),
  L('[data-name="Column/Labels"] [data-name="List"] > * > div:not([data-name]),[data-name^="Column/20"] > [data-name^="Td/"] > div:not([data-name]){background:transparent!important;background-image:none!important;box-shadow:none!important;}'),
  L('[data-name="Column/Labels"] [data-name="List"] > :nth-child(2),[data-name^="Column/20"] > [data-name^="Td/"]:nth-child(2){background:#f6f9fc!important;}'),
  /* 표 */
  L('[data-name^="Th/"] [data-name="Background"]{background:#f0f5f9!important;background-image:none!important;border-color:' + LINE + '!important;box-shadow:none!important;}'),
  L('[data-name^="Th/"] [data-name="Background"]::after{border-color:' + LINE + '!important;border-image:none!important;}'),
  L('[data-name^="Th/"] [data-name="Background"] *{background:none!important;box-shadow:none!important;}'),
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
  L('[data-name^="Popup/"] > div:not([data-name]):not([class*="nb-"]){background:#fff!important;background-image:none!important;box-shadow:none!important;}'),
  L('[data-name^="Popup/"] [data-name="Header Row"],[data-name^="Popup/"] [data-name="Header Row"] > *{background:#eef5fa!important;background-image:none!important;}'),
  L('[data-name^="Popup/"] [data-name="Th"]{background:#f6f9fc!important;}'),
  L('[data-name^="Popup/"] [data-name="Td"]{background:#fff!important;}'),
  L('[data-name="Widget/2040 Target"]{box-shadow:0 14px 40px rgba(24,60,96,.14)!important;}'),
  L('[data-name="Widget/2040 Target"] > div:not([data-name]):first-child{background:#fff!important;background-image:none!important;box-shadow:none!important;}'),
  L('[data-name="Widget/2040 Target"] > div:not([data-name]):not([class*="nb-"]):not(:first-child){background:none!important;box-shadow:none!important;}'),
  L('[data-name="Widget/2040 Target"] [data-name="Title"]{background:#f0f5f9!important;background-image:none!important;}'),
  /* 해외 */
  L('[data-name^="Flag/"]{border-radius:50%;box-shadow:0 0 0 1px #c3d2df;}'),
  L('[data-name^="Route Label/"]{box-shadow:0 4px 12px rgba(30,110,170,.18)!important;}'),
  L('[data-name^="Tag/"]{box-shadow:0 2px 6px rgba(24,60,96,.12);}'),
];
const OUT = {};
KEYS.forEach((k) => { OUT[k] = COMMON.slice(); OUT[k + ':light'] = LIGHT.slice(); });
fs.writeFileSync(path.join(__dirname, 'screen-css.json'), JSON.stringify(OUT, null, 1));
console.log('screen-css', KEYS.length, '라이트', LIGHT.length);
