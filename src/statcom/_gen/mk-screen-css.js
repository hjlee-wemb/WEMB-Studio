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
];
const OUT = {};
KEYS.forEach((k) => { OUT[k] = []; OUT[k + ':light'] = LIGHT.slice(); });
OUT['1-307'] = msgCss;
OUT['1-300'] = timeCss.concat(['.{{PX}}-root [data-node-id$=";1:1901"]{line-height:18px!important;}']);
/* VR — 여러 줄 글자는 줄높이 1.5(글자 상자 높이가 줄높이로 박히지 않게), 고친 글에 따라 상자가 자란다 */
const lh = (id, px) => '.{{PX}}-root [data-node-id="' + id + '"]{line-height:' + px + 'px!important;height:auto!important;}';
const vrShadow = (id) => ['.{{PX}}-root [data-node-id="' + id + '"]{filter:none!important;isolation:isolate;}',
  '.{{PX}}-root [data-node-id="' + id + '"]::before{content:"";position:absolute;inset:0;border-radius:10px;background:rgba(0,0,0,.35);filter:blur(12.5px);transform:translate(17.2px,24.6px);z-index:-1;pointer-events:none;}'];
const vrShadowLt = (id) => [R('[data-node-id="' + id + '"]::before{background:rgba(40,70,110,.12);}')];
OUT['1-4916'] = [lh('1:4941', 23), lh('1:4942', 23)].concat(vrShadow('1:4937'));
OUT['1-4916:light'] = LIGHT.concat(vrShadowLt('1:4937'));
OUT['1-4943'] = [lh('1:4958', 23), lh('1:4963', 23)].concat(vrShadow('1:4959'));
OUT['1-4943:light'] = LIGHT.concat(vrShadowLt('1:4959'));
fs.writeFileSync(path.join(__dirname, 'screen-css.json'), JSON.stringify(OUT, null, 1));
console.log('ok');
