/* 증권 통합관제 — 라이트 테마를 참고 이미지(Nexus 대시보드, 2026-11-27 사용자 제공)의 체계로.
   다크 → 라이트 원칙대로 모양 · 배치는 그대로, 색만:
     바탕      단색 #f3f4f7(바탕 사진 감춤)          판 · 카드  #ffffff + 1px 테두리 #e5e7eb, 그림자 없음
     본문 글자 #111827 · 보조 #6b7280 · 흐린 #9ca3af   강조       인디고 #4f46e5 · 바이올렛 · 블루 · 틸(차트 원색은 그대로)
     배지      옅은 색 바탕 + 같은 계열 글자(CR 빨강 · MA 주황 · MI 노랑 · WA 틸 · NO 회색 · ALL 인디고)
     헤더      흰색 + 아래 경계선, 메뉴 회색 · 고른 메뉴 짙은 글자
   무채색 단 스냅은 conv.js freshenLight, 아이콘 · 유리 심볼은 mk-light-icons.js · lt-raster.js. 이 파일 규칙은 마지막에 걸린다(꼬리표 nx).
   실행: node mk-light-nexus.js → node conv.js */
'use strict';
const fs = require('fs'), path = require('path');
const R = '.{{PX}}-root[data-theme="light"][data-theme]';   /* 앞선 라이트 규칙보다 한 단 강하게 */
const C = { bg: '#f3f4f7', card: '#ffffff', line: '#e5e7eb', ink: '#111827', sub: '#6b7280', mute: '#9ca3af', acc: '#4f46e5', accBg: '#eef0ff' };
const RING = (c) => '{border-color:' + c + '!important;background:none!important;-webkit-mask:none!important;mask:none!important;border:1px solid ' + c + '!important;padding:0!important;}';
const BADGE = { CR: ['#fdecec', '#b91c1c'], MA: ['#fff1e6', '#9a3412'], MI: ['#fef9c3', '#854d0e'], WA: ['#e6f7f6', '#0f766e'], NO: ['#f1f3f6', '#4b5563'], All: [C.accBg, C.acc] };
const RULES = [
  /* Max · Min 표지 — 흰 바탕 4.5:1 이상의 자홍 · 청록 */
  R + ' [data-name="Max Marker"] p{color:#a21caf!important;}',
  R + ' [data-name="Min Marker"] p{color:#155e75!important;}',
  /* 바탕 — 단색, 바탕 사진 감춤 */
  R + '{background:' + C.bg + '!important;}',
  R + ' > [data-node-id]{background:' + C.bg + '!important;}',
  R + ' img[src$="/image.png"],' + R + ' img[src$="/background.png"]{opacity:0!important;}',
  R + ' .sl-bgfill{background:' + C.bg + '!important;}',
  /* 헤더 — 흰색 + 아래 경계선 */
  R + ' [data-name="Header"]{background:' + C.card + '!important;box-shadow:inset 0 -1px 0 ' + C.line + '!important;}',
  R + ' [data-name="Header"] p{color:' + C.sub + '!important;-webkit-text-fill-color:' + C.sub + '!important;background:none!important;}',
  R + ' [data-name="Header"] [data-name^="Logo"] p{color:' + C.ink + '!important;-webkit-text-fill-color:' + C.ink + '!important;}',
  R + ' [data-name="Header"] [data-name="Nav"]{background:none!important;box-shadow:none!important;}',
  R + ' [data-name="Header"] [data-name="Nav"] > [data-name="Label"].sl-act,' + R + ' [data-name="Header"] [data-name="Nav"] > [data-name="Label"]:hover{color:' + C.ink + '!important;-webkit-text-fill-color:' + C.ink + '!important;text-shadow:none!important;}',
  R + ' [data-name="Header"] [data-name="Nav"] > [data-name="Separator"]{color:#d1d5db!important;-webkit-text-fill-color:#d1d5db!important;}',
  R + ' [data-name="Header"] [data-name="Clock"] [data-name="Date"]{color:' + C.sub + '!important;-webkit-text-fill-color:' + C.sub + '!important;}',
  R + ' [data-name="Header"] [data-name="Clock"] [data-name="Time"]{color:' + C.ink + '!important;-webkit-text-fill-color:' + C.ink + '!important;background:none!important;}',
  R + ' [data-name="Header"] [data-name="Select Menu"]{background:' + C.card + '!important;}',
  R + ' [data-name="Header"] [data-name="Select Menu"] p{color:' + C.ink + '!important;-webkit-text-fill-color:' + C.ink + '!important;}',
  R + ' [data-name="Header"] [data-name="Select Menu"]::after' + RING(C.line),
  R + ' img[src$="/button-logout.png"]{filter:brightness(0) invert(.45)!important;}',
  /* 헤더 아래 그라디언트 선 → 경계선 */
  R + ' [data-name="Divider"]:has(> [data-name="Divider"]){background:' + C.line + '!important;}',
  /* 이벤트 바 — 흰 카드 + 테두리, 등급 수 = 옅은 색 배지 */
  R + ' [data-name="Event Bar"] [data-name="Background"]:not([data-name^="Count/"] *):not([data-name^="Button/"] *){background:' + C.card + '!important;}',
  R + ' [data-name="Event Bar"] [data-name="Background"]:not([data-name^="Count/"] *):not([data-name^="Button/"] *)::after' + RING(C.line),
  R + ' [data-name="Event Bar"] [data-name="Background"]:not([data-name^="Count/"] *):not([data-name^="Button/"] *) > *{background:none!important;box-shadow:none!important;}',
  R + ' [data-name="Event Bar"] p:not([data-name^="Count/"] p):not([data-name^="Button/"] p){color:' + C.ink + '!important;}',
  ...Object.entries(BADGE).flatMap(([g, [bg, fg]]) => [
    R + ' [data-name="Count/' + g + '"] > [data-name="Background"]{background:' + bg + '!important;border-radius:6px;}',
    R + ' [data-name="Count/' + g + '"] > [data-name="Background"]::after' + RING('transparent'),
    R + ' [data-name="Count/' + g + '"] > [data-name="Label Background"]{background:none!important;}',
    R + ' [data-name="Count/' + g + '"] > [data-name="Label Background"]::after{display:none!important;}',
    R + ' [data-name="Count/' + g + '"] p{color:' + fg + '!important;}',
  ]),
  /* 단추(All · Ack · 필터 · 차트) — 흰 단추 + 테두리 */
  R + ' :is([data-name="Button/All"],[data-name="Button/Ack"],[data-name="Button/All (Hover)"],[data-name="Button/Ack (Hover)"]) > [data-name="Background"]{background:' + C.card + '!important;border-radius:6px;}',
  R + ' :is([data-name="Button/All"],[data-name="Button/Ack"]) > [data-name="Background"]::after' + RING(C.line),
  R + ' :is([data-name="Button/All (Hover)"],[data-name="Button/Ack (Hover)"]) > [data-name="Background"]{background:' + C.accBg + '!important;}',
  R + ' :is([data-name="Button/All (Hover)"],[data-name="Button/Ack (Hover)"]) > [data-name="Background"]::after' + RING(C.acc),
  R + ' :is([data-name^="Button/All"],[data-name^="Button/Ack"]) p{color:#374151!important;}',
  R + ' :is([data-name="Button/All (Hover)"],[data-name="Button/Ack (Hover)"]) p{color:' + C.acc + '!important;}',
  /* KPI 카드 — 흰 카드 + 테두리, 라벨 = 인디고 옅은 배지, 숫자 = 본문색 */
  R + ' [data-name="KPI Bar"] > [data-name="Content"]{background:' + C.card + '!important;border-radius:12px;box-shadow:inset 0 0 0 1px ' + C.line + '!important;}',
  R + ' [data-name="KPI Bar"] > [data-name="Content"] > *:not([data-name^="KPI/"]):not(p){background:none!important;}',
  R + ' [data-name^="KPI/"]{background:' + C.accBg + '!important;box-shadow:none!important;}',
  R + ' [data-name^="KPI/"]::after{display:none!important;}',
  R + ' [data-name^="KPI/"] p{color:' + C.acc + '!important;}',
  R + ' [data-name="KPI Bar"] > [data-name="Content"] > p{color:' + C.ink + '!important;}',
  /* 판 제목줄(탭 모양) — 옅은 회색 탭 + 테두리, 제목 = 본문색 */
  R + ' [data-name="Title Bar"] > [data-name="Background"]{background:' + C.card + '!important;box-shadow:none!important;}',
  R + ' [data-name="Title Bar"] > [data-name="Background"]::after' + RING(C.line),
  R + ' [data-name="Title Bar"] > [data-name="Background"] *{background:none!important;}',
  R + ' [data-name="Title Bar"] p,' + R + ' [data-name="Title Bar"] [data-name="Title"]{color:' + C.ink + '!important;-webkit-text-fill-color:' + C.ink + '!important;}',
  /* 제목 탭 바탕 그림(background-1.svg 파란 탭) · 헤더 아래 그라디언트 선 */
  R + ' [data-name="Title Bar"] [data-name="Background"]{background:' + C.card + '!important;}',
  R + ' [data-name="Title Bar"] [data-name="Background"] img{opacity:0!important;}',
  R + ' [data-name="Title Background"]{background:' + C.card + '!important;box-shadow:none!important;}',
  R + ' [data-name="Title Background"]::after' + RING(C.line),
  R + ' [data-name="Title Background"] ~ p,' + R + ' [data-name="Title Background"] + * p{color:' + C.ink + '!important;-webkit-text-fill-color:' + C.ink + '!important;}',
  R + ' [data-name="Divider"] > [data-name="Divider"]{background:' + C.line + '!important;border-color:' + C.line + '!important;}',
  /* 표의 파란 세로선 · 칸 테두리 → 경계선 */
  R + ' :is([data-name="Header Row"],[data-name^="Row/"]) [data-name="Divider"]{background:' + C.line + '!important;border-color:' + C.line + '!important;}',
  R + ' :is([data-name="Header Row"],[data-name^="Row/"]) [data-name="Divider"] img{opacity:0!important;}',
  R + ' :is([data-name="Header Row"],[data-name^="Row/"]) *::after{border-color:' + C.line + '!important;}',
  /* 표 머리줄 — 옅은 회색 줄, 대문자 회색 글자 */
  R + ' :is([data-name="Header Row"],[data-name="Table"]) > :is([data-name="Background"],[data-name="Header Background"]):first-child{background:#f8f9fb!important;}',
  R + ' [data-name^="Th/"]{color:' + C.sub + '!important;}',
  R + ' [data-name^="Td/"]{color:#374151!important;}',
  /* 판 테두리 그라디언트 선(다크의 시안 반짝임) — 라이트는 경계선 하나 */
  R + ' [data-name^="Widget/"] > [data-name="Background"]::after,' + R + ' [data-name="Widget/Event Status"] [data-name="Background"]::after' + RING(C.line),
  /* 판 = 흰 카드(페이지 바탕 #f3f4f7 과 구분) · 표 테두리 파란 선 → 경계선 */
  R + ' [data-name^="Widget/"] > [data-name="Background"],' + R + ' [data-name="Chart Row"] > [data-name="Background"]{background:' + C.card + '!important;}',
  R + ' [data-name="Table"] *::after{border-color:' + C.line + '!important;}',
  R + ' [data-name="Table"] > [data-name="Background"]::after' + RING(C.line),
  /* 마이크로 서비스현황 서비스명 칸 왼쪽 띠(다크 #184fcb → 투명) — 라이트에선 짙은 글자와 겹쳐 안 읽혔다 → 같은 모양의 옅은 인디고 띠 */
  R + ' [data-node-id$=";4039:4191"]{background-image:linear-gradient(to right,#dfe3ff,rgba(223,227,255,0) 60%)!important;}',
  R + ' [data-name="Td/Service Name"]{color:' + C.ink + '!important;}',
  /* 검색칸 */
  R + ' [data-name="Input Background"]{background:' + C.card + '!important;box-shadow:inset 0 0 0 1px ' + C.line + '!important;border-radius:6px;}',
  /* 스크롤 막대 · 툴팁 · 토스트 · 메뉴 */
  R + ' .sl-vbar{background:#eef0f3!important;}', R + ' .sl-vbar i{background:#cfd4dc!important;}',
  R + ' .sl-tip,' + R + ' .sl-toast,' + R + ' .sl-menu{background:#fff!important;color:' + C.ink + '!important;border-color:' + C.line + '!important;box-shadow:0 8px 24px rgba(17,24,39,.08)!important;}',
];
/* 그라데이션 선(grad-strokes.json) — 라이트에서는 모두 경계선 색 하나(굵은 시안 반짝임이 흰 판 위에서 도드라졌다) */
const GS = JSON.parse(fs.readFileSync(path.join(__dirname, 'grad-strokes.json'), 'utf8'));
const strokeRules = {};
for (const [rid, list] of Object.entries(GS)) {
  const key = rid.replace(':', '-');
  const out = [];
  for (const [sig, sels] of list) {
    const thin = /\|thin$/.test(sig);
    const sel = sels.map((s) => R + ' ' + (s.startsWith('$;') ? '[data-node-id$=";' + s.slice(2) + '"]' : '[data-node-id="' + s + '"]'));
    if (thin) out.push(sel.join(',') + '{background:' + C.line + '!important;}');
    else out.push(sel.map((x) => x + '::after').join(',') + '{background:' + C.line + '!important;}');
  }
  strokeRules[key] = out;
}
const SC = path.join(__dirname, 'screen-css.json');
const sc = JSON.parse(fs.readFileSync(SC, 'utf8'));
const TAG = '/*nx*/';
['4041-8351', '4039-2211', '4039-3717', '4039-5908', '4039-10484', '4038-2699', '4041-7220', '4041-7319', '4041-7360'].forEach((k) => {
  const key = k + ':light';
  sc[key] = (sc[key] || []).filter((x) => x.indexOf(TAG) !== 0).concat(RULES.concat(strokeRules[k] || []).map((x) => TAG + x));
});
fs.writeFileSync(SC, JSON.stringify(sc, null, 1));
console.log('nexus light rules', RULES.length, 'stroke', Object.values(strokeRules).reduce((a, b) => a + b.length, 0));
