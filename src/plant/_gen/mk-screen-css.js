/* 화면별 규칙 — design context 가 뭉갠 선 · 효과를 use_figma 로 읽은 값으로 되살린다(screen-css.json).
   값의 출처: 2026-11-04 use_figma(strokeAlign · strokeWeight · gradientTransform · effects).
   실행: node mk-screen-css.js → node conv.js */
'use strict';
const fs = require('fs'), path = require('path');

const sel = (id, tail) => '.{{PX}}-root [data-node-id="' + id + '"]' + (tail || '');
const MASK = '-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;';
const ROWS = ['6:266', '6:280', '6:294', '6:308', '6:322'];

const DARK = [].concat(
  /* Body — 가운데 정렬 1px(#0a3957). 오토레이아웃 크기에 안 들어가므로 테두리를 걷고 안팎 1px 을 절반 농도로 */
  [sel('6:249') + '{border-width:0!important;box-shadow:0 0 0 1px rgba(10,57,87,.5),inset 0 0 0 1px rgba(10,57,87,.5);}'],
  /* Header Row — 가운데 정렬 1px 세로 그라디언트(#fff→#7cccff, 불투명도 .5) → 안팎 2px 을 절반 농도로 */
  [sel('6:251') + '{border-width:0!important;}',
    sel('6:251', '::after') + '{content:"";position:absolute;inset:-1px;border-radius:0 0 11px 0;padding:2px;pointer-events:none;' + MASK + 'background:linear-gradient(180deg,#fff 0%,#7cccff 100%);opacity:.25;}'],
  /* 표 줄 — 가운데 정렬 아래 선 */
  ROWS.map((id) => sel(id) + '{border-bottom-width:0!important;box-shadow:inset 0 -1px 0 rgba(118,125,154,.5),0 1px 0 rgba(118,125,154,.5);}'),
  /* Room Selector 접기 단추 — 안쪽 정렬 1px 가로 그라디언트(왼쪽 #fff → 오른쪽 #7cccff) */
  [sel('13:893') + '{border-color:transparent!important;}',
    sel('13:893', '::after') + '{content:"";position:absolute;inset:-1px;border-radius:0 7px 7px 0;padding:1px;pointer-events:none;' + MASK + 'background:linear-gradient(90deg,#fff 0%,#7cccff 100%);}'],
  /* 표 칸 글자 — Figma 글자 폭으로 못 박고 왼쪽 정렬이면, 글꼴 폭이 조금만 달라도(Variable 굵기 · 새로 찍은 시각) 칸 가운데에서 벗어나고
     긴 글자는 상자 밖으로 넘친다. 칸이 flex 가운데 정렬이므로 글자 상자를 글자 폭으로 두면 늘 가운데다(줄바꿈은 nowrap 이 막는다) */
  [sel('6:251') + ' [data-name^="Th/"] > p,.{{PX}}-root [data-name="Table/Event List"] [data-name^="Td/"] > p{width:auto!important;}'],
  /* Tree Line — x 1685.5 폭 1 이라 Figma 는 두 픽셀에 절반씩 그린다. 브라우저는 한 픽셀로 붙여 더 진해진다 */
  [sel('11:613') + '{left:1685px!important;width:2px!important;background-color:rgba(168,191,218,.5)!important;}'],
  /* Brand 묶음의 그림자 두 겹 — GROUP 이라 design context 에 안 나온다 */
  [sel('13:927') + '{text-shadow:0 0 7px #000,0 0 7px rgba(43,61,85,.6);}',
    sel('13:925') + '{filter:drop-shadow(0 0 3.5px #000);}']
);

const R = (tail) => '.{{PX}}-root[data-theme="light"] ' + tail;
const LIGHT = [].concat(
  [R('[data-node-id="6:249"]{background-color:rgba(255,255,255,.94)!important;box-shadow:0 0 0 1px rgba(103,146,188,.45),inset 0 0 0 1px rgba(103,146,188,.45);}')],
  [R('[data-node-id="6:251"]{background-color:#dcebf8!important;}'),
    R('[data-node-id="6:251"]::after{background:linear-gradient(180deg,#7fa9cc 0%,#5d93c0 100%);opacity:.6;}')],
  ROWS.map((id) => R('[data-node-id="' + id + '"]{box-shadow:inset 0 -1px 0 rgba(106,136,166,.35),0 1px 0 rgba(106,136,166,.35);}')),
  [R('[data-node-id="13:893"]{background-image:linear-gradient(90deg,#ffffff 0%,#dcebf8 100%)!important;}'),
    R('[data-node-id="13:893"]::after{background:linear-gradient(90deg,#9cc0dd 0%,#4f8fc4 100%);}')],
  /* 브랜드 — 밝은 띠 위라 그림자를 걷고 짙은 글자로 */
  [R('[data-node-id="13:927"]{text-shadow:none;color:#10324d!important;}'),
    R('[data-node-id="13:925"]{filter:drop-shadow(0 1px 3px rgba(20,60,100,.35));}')],
  /* 바탕 — 위 띠(Base)는 밝은 판으로, 야경 렌더는 낮처럼 밝게(그림 자체는 그대로) */
  [R('[data-name="Base"] img{opacity:0;}'),
    R('[data-name="Background"] > [data-name="Base"]{background:linear-gradient(180deg,#f4f8fc 0%,#dfeaf4 100%);}'),
    R('[data-name="Hero Image"] img{filter:brightness(1.14) contrast(.95) saturate(1.02);}'),
    /* 글자 — 판이 다 밝아졌으니 한 번에 짙은 글자로. 켜진 항목 · 메뉴 · 등급 숫자만 아래에서 따로 */
    R('p{color:#10324d!important;}'),
    R('[data-node-id="9:556"],') + R('[data-node-id="13:871"]{color:#00708a!important;}'),
    /* 트리 줄 — 흰 판 위의 옅은 파랑 */
    R('[data-name^="Tree Item/"]{background-color:rgba(214,231,246,.85)!important;}'),
    R('[data-name="Map Image"] img{filter:brightness(1.12) saturate(.95);}'),
    R('[data-name="Logo Glow"] [data-name^="Glow"]{mix-blend-mode:normal;opacity:.28;}')],
  /* 켜진 메뉴 — 짙은 청록 판 + 흰 글자 */
  [R('[data-node-id="13:959"]{color:#fff!important;}')],
  /* 등급 숫자 칸 — 흰 판에서 읽히게 등급 색을 짙게 */
  [['7:446', '7:438', '7:430', '7:422', '7:371'].map((id) => R('[data-node-id="' + id + '"]')).join(',') + '{background-color:#fff!important;border-color:#a7c3dc!important;}',
    R('[data-node-id="7:447"]{color:#10324d!important;}'),
    R('[data-node-id="7:439"]{color:#c21f1f!important;}'),
    R('[data-node-id="7:431"]{color:#b35400!important;}'),
    R('[data-node-id="7:423"]{color:#8a6a00!important;}'),
    R('[data-node-id="7:365"]{color:#00708a!important;}')]
);

const OUT = { '1-2': DARK, '1-2:light': LIGHT };
fs.writeFileSync(path.join(__dirname, 'screen-css.json'), JSON.stringify(OUT, null, 1));
console.log('다크', DARK.length, '라이트', LIGHT.length);
