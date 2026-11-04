/* 화면별 규칙(screen-css.json) — 생성기가 뭉갠 자리를 바로잡는다. 실행: node mk-screen-css.js → node conv.js */
'use strict';
const fs = require('fs'), path = require('path');
const KEYS = ['1-426', '1-313', '1-187', '1-271', '1-194', '1-278', '1-286', '1-293', '1-300', '1-307', '1-457', '1-4858', '1-4877', '1-4916', '1-4943'];
/* 말풍선 글자 — p 여러 줄(글자 상자 높이를 줄높이로 박으면 첫 줄이 벌어진다) · 고친 글에 따라 상자가 자라게 */
const MSG = ['1:1663', '1:1676', '1:1689', '1:1702', '1:1715', '1:1728', '1:1741', '1:1754', '1:1767'];
const msgCss = MSG.map((id) => '.{{PX}}-root [data-node-id$=";' + id + '"]{line-height:0!important;height:auto!important;}');
/* 총 재생시간 — 원본 칸이 글자보다 좁아 두 줄로 꺾인다(08:4 / 0). 한 줄로 */
const timeCss = ['.{{PX}}-root [data-node-id$=";1:1869"]{white-space:nowrap!important;}'];
/* 라이트 공통 — 그림 위에 얹힌 패널은 흰 판, 글자는 짙게(대비 4.5:1). 헤더 로고 그림은 흰 글자라 어둡게 */
const R = (t) => '.{{PX}}-root[data-theme="light"] ' + t;
const LIGHT = [
  R('[data-name="Logo Image"] img:not(.tpl-studio-logo){filter:brightness(.16);}'),
  /* 떠 있는 판은 부드러운 그림자로 띄운다 */
  R('[data-name="Header"]:has([data-name="Actions"]){box-shadow:0 2px 10px rgba(30,60,100,.06);}'),
  R('[data-name="Side Bar"]{box-shadow:4px 0 22px rgba(30,60,100,.08);}'),
  R('[data-name="Minimap"] [data-name="Card"]{box-shadow:0 8px 24px rgba(30,60,100,.1);}'),
  R('[data-name^="Hover Card"],[data-name^="Equipment Card/"]{box-shadow:0 10px 28px rgba(30,60,100,.1);}'),
  R('[data-name="Panel Toggle"]{background-color:#fff!important;background-image:none!important;box-shadow:0 2px 8px rgba(30,60,100,.12);}'),
  /* 로그인 오른쪽 점 그림 — 흰 점이라 밝은 바탕에서 사라진다 */
  R('[data-name="Hero Image"] img{filter:brightness(.6) contrast(1.15);}'),
  /* 공정 단계 말풍선 */
  R('[data-name="Tooltip Label"]{color:#1f3146!important;}'),
  /* Metric 타일 — 그림자만으로는 흰 판에서 구분이 안 된다. 옅은 하늘빛 면 + 또렷한 선으로 칸을 세우고,
     값 칸은 다시 흰색으로 띄워 '타일 → 값' 위계를 만든다. 타일 면은 이름 없는 첫 자식, 안쪽 빛은 이름 없는 끝 자식이다 */
  ...['Metric/', 'Pump/', 'Control/'].map((n) => R('[data-name^="' + n + '"]:not([data-name*="Active"]) > div:not([data-name]):first-child{background:linear-gradient(180deg,#f6fafd 0%,#e9f2f8 100%)!important;box-shadow:inset 0 0 0 1px #c9dce9,inset 0 1px 0 1px rgba(255,255,255,.75);}')),
  ...['Metric/', 'Pump/', 'Control/'].map((n) => R('[data-name^="' + n + '"] > div:not([data-name]):last-child{box-shadow:none!important;}')),
  R('[data-name^="Metric/"]:has(> div:not([data-name]):first-child),[data-name^="Control/"]{box-shadow:0 1px 3px rgba(30,70,110,.08)!important;}'),
  R('[data-name="Value Box"],[data-name="Badge"]{background-color:#fff!important;box-shadow:inset 0 0 0 1px #d3e1eb;}'),
  R('[data-name^="Valve/"],[data-name^="Cooler/"]{background-color:#f5f9fc!important;box-shadow:inset 0 0 0 1px #d3e1eb;}'),
  /* 숫자가 먼저 읽히게 */
  R('[data-name^="Metric/"] [data-name="Value"],[data-name="Badge"] [data-name="Value"]{font-weight:600;}'),
  R('[data-name^="Metric/"] > [data-name="Label"]{font-weight:500;}'),
];
const OUT = {};
KEYS.forEach((k) => { OUT[k] = []; OUT[k + ':light'] = LIGHT.slice(); });
OUT['1-307'] = msgCss;
OUT['1-300'] = timeCss.concat(['.{{PX}}-root [data-node-id$=";1:1901"]{line-height:18px!important;}']);
/* VR — 여러 줄 글자는 줄높이 1.5(글자 상자 높이가 줄높이로 박히지 않게), 고친 글에 따라 상자가 자란다 */
const lh = (id, px) => '.{{PX}}-root [data-node-id="' + id + '"]{line-height:' + px + 'px!important;height:auto!important;}';
const vrShadow = (id) => ['.{{PX}}-root [data-node-id="' + id + '"]{filter:none!important;isolation:isolate;}',
  '.{{PX}}-root [data-node-id="' + id + '"]::before{content:"";position:absolute;inset:0;border-radius:10px;background:rgba(0,0,0,.35);filter:blur(12.5px);transform:translate(17.2px,24.6px);z-index:-1;pointer-events:none;}'];
const vrShadowLt = (id) => [R('[data-node-id="' + id + '"]::before{background:rgba(40,70,110,.05);}')];
OUT['1-4916'] = [lh('1:4941', 23), lh('1:4942', 23)].concat(vrShadow('1:4937'));
OUT['1-4916:light'] = LIGHT.concat(vrShadowLt('1:4937'));
OUT['1-4943'] = [lh('1:4958', 23), lh('1:4963', 23)].concat(vrShadow('1:4959'));
OUT['1-4943:light'] = LIGHT.concat(vrShadowLt('1:4959')).concat([R('[data-name="Td"] [data-name="Value"]{color:#06303a!important;}')]);
/* 시뮬레이션 칸의 값은 숫자가 아니라 설명 글이라 굵게 하지 않는다 */
OUT['1-300:light'].push(R('[data-name="Badge"] [data-name="Value"]{font-weight:400;}'));
/* VR 라이트 — 시작 화면의 검은 바탕을 밝게, 팝업은 그림 위에 뜨도록 */
const vrLt = R('[data-name^="Popup/"]{box-shadow:0 14px 40px rgba(30,60,100,.18);}');
['1-4858', '1-4877', '1-4916', '1-4943'].forEach((k) => OUT[k + ':light'].push(vrLt));
OUT['1-4858:light'].push(R('[data-name="Scene Image"]{background-color:#e8eef3!important;}'));
fs.writeFileSync(path.join(__dirname, 'screen-css.json'), JSON.stringify(OUT, null, 1));
console.log('ok');
