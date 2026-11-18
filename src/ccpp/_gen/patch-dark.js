/* dark.js 를 이 템플릿 팔레트로 바꾼다(한 번만) — 대응표 TABLE 과 lightExtra 의 층 규칙.
   원본 라이트: 하늘 바탕 #cae7ff · 흰 유리 판 · 남색 제목 #072549 · 본문 #434859 · 브랜드 파랑 #0073ff/#1377ff.
   다크: 중성 그래파이트(바탕 #0d1015 < 레일 · 판 #161a21 < 칸 #1b2029), 파랑은 강조에만. 실행: node patch-dark.js */
'use strict';
const fs = require('fs'), path = require('path');
const p = path.join(__dirname, 'dark.js');
let c = fs.readFileSync(p, 'utf8');
const A = c.indexOf('const TABLE = {'), B = c.indexOf('function autoDark');
const TABLE = `const TABLE = {
  /* 글자 — 남색 제목은 밝은 회백, 본문 회남색은 차분한 회백, 브랜드 파랑(키 · 머리 칸)은 밝은 파랑(대비 4.5:1 이상) */
  text: {
    '#072549': '#e8eef7', '#434859': '#c3cad6', '#1f222c': '#e6e9ef', '#0073ff': '#5ea2ff', '#1377ff': '#6aa8ff', '#999': '#8d95a3', '#999999': '#8d95a3',
    '#103f66': '#a6dbff', '#106651': '#7fe8c8', '#0d0d14': '#eef0f6', '#000': '#eceef2', '#000000': '#eceef2', black: '#eceef2',
  },
  /* 면 — 흰 유리 판은 그래파이트, 옅은 하늘 카드는 한 단계 밝은 칸, 화면 바탕 하늘은 밤 바탕 */
  bg: {
    white: '#161a21', '#fff': '#161a21', '#ffffff': '#161a21', 'rgb(255,255,255)': '#161a21', 'rgba(255,255,255,1)': '#161a21',
    'rgba(255,255,255,0.95)': 'rgba(22,26,33,0.95)', 'rgba(255,255,255,0.8)': 'rgba(22,26,33,0.84)',
    '#f7fcff': '#1b2029', 'rgb(247,252,255)': '#1b2029', '#cae7ff': '#0d1015', 'rgb(202,231,255)': '#0d1015',
    'rgba(0,140,255,0.03)': 'rgba(94,162,255,0.05)', 'rgba(0,115,255,0.05)': 'rgba(94,162,255,0.10)', 'rgba(7,37,73,0.1)': 'rgba(255,255,255,0.14)',
    'rgba(103,107,112,0.3)': 'rgba(255,255,255,0.10)', '#1f222c': '#8a94a6', 'rgba(0,0,0,0.03)': 'rgba(255,255,255,0.05)',
    'rgba(0,0,0,0.01)': 'rgba(255,255,255,0.01)', 'rgba(0,0,0,0.2)': 'rgba(255,255,255,0.14)', 'rgba(0,0,0,0.8)': 'rgba(255,255,255,0.42)',
    '#cff5ff': '#12344a', '#cffff3': '#103a31',
  },
  border: {
    'rgba(0,0,0,0.1)': 'rgba(255,255,255,0.10)', 'rgba(0,0,0,0.05)': 'rgba(255,255,255,0.07)', 'rgba(0,0,0,0.15)': 'rgba(255,255,255,0.14)',
    '#d4e6f5': '#2a3340', 'rgba(5,25,50,0.15)': 'rgba(255,255,255,0.14)', 'rgba(5,25,50,0.1)': 'rgba(255,255,255,0.10)', 'rgba(0,115,255,0.2)': 'rgba(94,162,255,0.38)',
    white: '#2a2f37', '#fff': '#2a2f37', '#ffffff': '#2a2f37',
  },
  shadow: { 'rgba(3,26,38,0.05)': 'rgba(0,0,0,0.32)', 'rgba(0,0,0,0.03)': 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.1)': 'rgba(0,0,0,0.4)' },
};

`;
c = c.slice(0, A) + TABLE + c.slice(B);
const E = c.indexOf('function lightExtra'), F = c.indexOf('/* 다크로 옮긴 뒤의');
const EXTRA = `function lightExtra(PX) {
  const R = '.' + PX + '-root[data-theme="dark"]';
  const rules = [R + ':not(.hj-asset){background:#0d1015;}', R + '{color:#e3e9f2;}'];
  const ver = (f) => { try { const b = fs.readFileSync(path.join(__dirname, '..', f)); let h = 0; for (let i = 0; i < b.length; i += 97) h = (h * 31 + b[i]) >>> 0; return h.toString(36); } catch (e) { return '1'; } };
  for (const [orig, dk] of Object.entries(VARIANTS)) rules.push(R + ' img[src$="/' + orig + '"]{content:url("{{B}}' + dk + '?v=' + ver(dk) + '");}');
  rules.push(
    /* 화면 바탕(하늘 #cae7ff) → 밤 바탕, 위쪽이 조금 밝은 남회색 */
    R + ' > [data-node-id]{background:linear-gradient(180deg,#111720 0%,#0b0e13 100%)!important;}',
    /* 3D 설비 그림(투명 PNG) — 바탕만 밤이 되었으니 설비는 아주 조금만 누른다 */
    R + ' [data-name="3D Scene"] img{filter:brightness(.88) saturate(.95) contrast(1.04);}',
    /* 계통도 그림(흰 종이 JPG) → 다크 사본(mk-dark-diagram.ps1 — 바탕 · 검은 글씨만 뒤집고 선 색상각은 지킨다) */
    R + ' img[src$="/diagram-image.png"]{content:url("{{B}}diagram-image-dk.jpg?v=' + ver('diagram-image-dk.jpg') + '");}',
    R + ' [data-name="Diagram Title Patch"]{background:linear-gradient(90deg,#3d2f63 0%,#1b2a38 50%,#352c5d 100%)!important;border-color:#7d7bf0!important;}',
    R + ' [data-name="Diagram Title Patch"] p{color:#eef0fb!important;}',
    /* 레일 · 왼쪽 판 · 상세 팝업 — 흰 유리 → 그래파이트 유리(위 1px 하이라이트 · 옅은 테두리) */
    R + ' [data-name="Side Rail"] > [data-name="Body"]{background:linear-gradient(180deg,#151920 47%,rgba(21,25,32,.9) 100%)!important;border-right-color:rgba(255,255,255,.06)!important;}',
    R + ' [data-name^="Panel/"]:not([data-name="Panel/File Open"]),' + R + ' [data-name="Popup/Detail"]{box-shadow:inset 1px 0 0 rgba(255,255,255,.04),0 12px 30px rgba(0,0,0,.35);}',
    /* 레일 단추 — 흰 원판이 그래파이트가 되니 테두리를 조금 살린다 */
    R + ' [data-name="Icon Button"]{box-shadow:inset 0 1px 0 rgba(255,255,255,.05);}'
  );
  return rules;
}

`;
c = c.slice(0, E) + EXTRA + c.slice(F);
c = c.replace(/^\/\* 무선망 통합관리 — 다크 테마 파생표/, '/* 복합화력 설비정보 — 다크 테마 파생표');
fs.writeFileSync(p, c);
console.log('dark.js patched', c.length);
