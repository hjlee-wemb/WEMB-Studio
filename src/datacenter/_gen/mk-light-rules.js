/* 데이터센터 — 라이트 손규칙(색 대응표로 못 푸는 곳) → screen-css.json 의 '<장면 key>:light'.
   conv.js 가 각 화면 라이트 시트 끝에 붙인다({{PX}} = 접두어). 모양은 다크 그대로, 색만 바꾼다.
   실행: node mk-light-rules.js → node conv.js */
'use strict';
const fs = require('fs'), path = require('path');
const F = path.join(__dirname, 'screen-css.json');
const J = JSON.parse(fs.readFileSync(F, 'utf8') || '{}');
const R = '.{{PX}}-root[data-theme="light"]';

/* 네 화면 공통 — 헤더 */
const HEADER = [
  /* 내비 묶음 — 다크에선 투명인데 대응표가 흰 60% 판을 깔아 메뉴 뒤에 띠가 생겼다 */
  R + ' [data-name="Header"] [data-name="Nav"]{background:transparent!important;}',
  /* 시계 — 옅은 하늘 그라디언트 글자(text-clip)는 흰 바탕에서 사라진다 → 같은 방향의 짙은 파랑 */
  R + ' [data-name="Header"]:has([data-name="Icon Logout"]) p[data-name="Value"]{background-image:linear-gradient(180deg,#1d4fc4 40%,#0a8fd0)!important;}',
];
const MAIN = [
  /* 옆 판 정사각 단추 — 검정 · 짙은 회색 대각 판 → 흰 · 옅은 회청 대각 판(같은 각 · 같은 비율) */
  R + ' :is([data-name="Button/Drawing Info"],[data-name="Button/Scenario"],[data-name="Button/Equipment Info"]) > [data-name="Background"]{background-image:linear-gradient(-39.768deg,#ffffff 50.648%,#e6ecf4 50.648%)!important;box-shadow:inset 0 0 0 1px #c3d0e0;}',
  /* 알림 설정 — '알림 팝업 모두 닫기' 단추: 짙은 회색 대각 판 → 옅은 회청 대각 판 */
  R + ' [data-name="Button/Close All"] > [data-name="Background"]{background-image:linear-gradient(-24.4deg,#e3e9f1 54.2%,#f4f7fb 54.2%)!important;box-shadow:inset 0 0 0 1px #b8c6d8;}',
  R + ' [data-name="Button/Close All"] p{color:#24374e!important;}',
  /* 이벤트 등급 배지 — 진한 색 판 위 흰 글자 그대로 */
  R + ' [data-name="Event Log"] [data-name="Row"] > [data-name="Label"] p{color:#fff!important;}',
  /* Reset 글자 — 공통 규칙(파란 단추 흰 글자)이 이 회색 원 단추에도 걸려 흰 판에서 사라졌다 */
  R + ' [data-name="Button Group"] [data-name="Button/Reset"] p{color:#24374e!important;}',
  /* 왼쪽 판 — 제목 상자(Title Bar, x 10~253) 테두리가 판 테두리(x 9~254)보다 1px 안쪽이라 라이트에서 두 줄로 어긋나 보였다 → 판 테두리에 겹친다 */
  R + ' [data-name="Title Bar"]::after{left:-1px!important;right:-1px!important;}',
];
const POWER = [
  /* 왼쪽 판 바탕은 x 16~256 인데 위쪽 구분선 3개(제목 · 단추 · 시나리오 위)는 메인 치수(x 9~253)라 판 왼쪽 밖으로 7px 튀어나왔다
     (다크에선 선과 바탕이 같은 짙은 색이라 안 보였다) → 판 안쪽 폭에 맞춘다(부모 묶음이 x 8.99 에 있어 left 는 6.99) */
  R + ' :is([data-name="Divider/Title"],[data-name="Divider/Buttons"],[data-name="Divider/Section"]){left:6.99px!important;width:240.02px!important;}',
  /* 평면 계통도 그림(밝은 선 · 흰 글자 PNG) — 흰 판에서 안 보인다 → 밝기만 뒤집는다(hue-rotate 로 빨강 · 파랑 색상은 지킨다) */
  R + ' [data-name="Diagram Image"] img{filter:invert(1) hue-rotate(180deg) saturate(1.6) contrast(1.35);}',
];
/* 겹친 팝업 뿌리 — 라이트 공통 규칙이 뿌리에 화면 바탕색을 깔아 아래 전력 계통도를 덮었다 → 팝업 뿌리는 투명 */
const POP = ['.{{PX}}-root.sh-pop[data-theme="light"]{background:transparent!important;}'];

/* 팝업 판 — 다크는 짙은 판이 파란 화면 위에 떠서 또렷했는데, 라이트는 흰 판 · 옅은 회색이 밝은 화면에 묻혔다(그림자 4%).
   모양은 그대로 두고 ① 판에 또렷한 테두리 + 떠 있는 그림자 ② 제목 띠의 탁한 회색 그라디언트를 같은 방향의 옅은 회청 그라디언트로
   ③ 값 칸 회색(#d9dade)을 맑은 칸으로 ④ 설비 검색 표 머리 글자(2.43:1)를 짙은 파랑으로 */
const SHADOW = 'box-shadow:0 18px 44px rgba(20,45,80,.26),0 2px 8px rgba(20,45,80,.12)!important;';
const HEAD = 'background-image:linear-gradient(to right,#e4ebf4 48.714%,#bccbdd)!important;box-shadow:inset 0 -1px 0 #b3c3d6;';
const id = (s) => '[data-node-id="' + s + '"]';
const PER = {
  '2857-3044': [   /* 설비정보 */
    R + ' ' + id('2857:3046') + '{' + SHADOW + '}',
    R + ' ' + id('2857:3046') + '::after{border-color:#a9b9cd!important;}',
    R + ' ' + id('2857:3049') + '{' + HEAD + '}',
    R + ' ' + id('2857:3063') + '{background-color:#f1f5fa!important;}',
  ],
  '2857-3670': [   /* 설비정보팝업(검색) */
    R + ' ' + id('I2857:3670;726:1267') + '{' + SHADOW + '}',
    R + ' ' + id('I2857:3670;726:1267') + '::after{border-color:#a9b9cd!important;}',
    R + ' ' + id('I2857:3670;726:1364') + '{' + HEAD + '}',
    R + ' ' + id('I2857:3670;726:1340') + '{background-color:#f1f5fa!important;}',
    R + ' :is(' + id('I2857:3670;726:1268') + ',' + id('I2857:3670;726:1381;726:1081') + '){background-color:#e6edf6!important;}',
    R + ' [data-name="Table Header"] p{color:#1d4fa8!important;}',
  ],
  '2857-3379': [   /* 간이 설비정보(카드 장면) — 판 하나가 없고 제목 띠 + 몸통이라 화면 프레임에 그림자 */
    R + ' > [data-node-id]{' + SHADOW + 'outline:1px solid #a9b9cd;}',
    R + ' ' + id('I2857:3379;729:4606') + '{' + HEAD + '}',
    R + ' ' + id('I2857:3379;729:4618') + '{background-color:#e4eaf2!important;}',
    R + ' ' + id('I2857:3379;729:4619') + '{background-color:#f1f5fa!important;}',
  ],
  '2857-3378': [   /* 설비 카드 */
    R + ' > [data-node-id]{' + SHADOW + '}',
    R + ' ' + id('729:4230') + '{background-color:rgba(244,247,251,.96)!important;}',
    R + ' ' + id('729:4230') + '::after{border-color:#a9b9cd!important;}',
  ],
  '2857-3672': [   /* 시나리오 설명(전체 화면) */
    R + ' ' + id('2857:3674') + '{' + HEAD + '}',
  ],
};

const KEYS = { '2857-2053': HEADER.concat(MAIN), '2857-2156': HEADER.concat(POWER), '2857-2443': HEADER, '2857-2664': HEADER };
['2857-3044', '2857-3378', '2857-3379', '2857-3670', '2857-3672'].forEach((k) => { KEYS[k] = POP.concat(PER[k] || []); });
for (const [k, v] of Object.entries(KEYS)) J[k + ':light'] = v;
fs.writeFileSync(F, JSON.stringify(J, null, 1));
console.log('screen-css.json 라이트 손규칙', Object.entries(KEYS).map(([k, v]) => k + ':' + v.length).join(' '));

/* 형상 보정(다크 · 라이트 공통) — 설비정보 팝업 표의 값 두 칸(2857:3067 · 3068)은 줄높이 12/24 가 섞인 글자 하나다.
   Figma 는 이것을 24px 행마다 한 줄씩(첫 줄 가운데 = 위에서 6px) 그리는데, 브라우저는 줄마다 높이를 따로 쌓아
   값이 표 행에서 6~30px 씩 어긋났다(빈 줄 12px). → 두 칸만 모든 줄 24px, 6px 위로. 스크린샷 대조로 행 가운데와 일치 확인. */
const EQ = ['.{{PX}}-root :is([data-node-id="2857:3067"],[data-node-id="2857:3068"]) > p{line-height:24px!important;}',
  '.{{PX}}-root :is([data-node-id="2857:3067"],[data-node-id="2857:3068"]){translate:0 -6px;}'];
const J2 = JSON.parse(fs.readFileSync(F, 'utf8'));
J2['2857-3044'] = EQ;
fs.writeFileSync(F, JSON.stringify(J2, null, 1));
console.log('screen-css.json 형상 보정 2857-3044:' + EQ.length);
