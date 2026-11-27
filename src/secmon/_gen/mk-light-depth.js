/* 라이트 깊이감 규칙 → screen-css.json 의 '<키>:light' 뒤쪽에 넣는다(앞쪽 손규칙은 남긴다). 실행: node mk-light-depth.js → node conv.js
   2026-11-25 사용자: "라이트에서 라인이 너무 도드라진다 — 깊이감 있는 UI 로 심미성 있게".
   원칙(다크 → 라이트): 모양 · 크기 · 선 두께는 그대로(새 판 · 카드 · 알약 금지), 색 · 그림자만 역할별로.
   · 판(위젯 바탕 · 설비 목록 칸 · 상태 카드 · 자산 판) = 흰 면 + 위가 밝은 아주 옅은 세로 그라디언트 + 옅은 선(파랑 회색 22~28%) + 겹친 부드러운 그림자
   · 칸(표 줄 · 머리 줄 · 배지 · 집계 칸 · 이벤트 줄 · 검색칸 · 꺾쇠 원) = 옅은 회청 면 + 윗면 흰 하이라이트 + 더 옅은 선, 그림자 거의 없음
   · 강조(Top3 칩 · 헤더 아이콘 단추 · CR/WA 배지) = 색 선을 옅게(35~45%) + 작은 그림자
   · 차트 = 흰 바탕에서 묻히던 하늘(#4affff) 막대 · 범례를 한 단 짙은 청록으로(색상은 그대로) */
'use strict';
const fs = require('fs'), path = require('path');
const P = path.join(__dirname, 'screen-css.json');
const J = JSON.parse(fs.readFileSync(P, 'utf8'));
const R = '.{{PX}}-root[data-theme="light"]';
const LINE_PANEL = 'rgba(112,138,180,.24)', LINE_CELL = 'rgba(112,138,180,.2)';
const SH_PANEL = '0 1px 2px rgba(24,44,84,.05),0 6px 14px -4px rgba(30,58,110,.08),0 18px 36px -12px rgba(30,64,130,.14)';
const SH_CELL = '0 1px 2px rgba(24,44,84,.05)';
const HI = 'inset 0 1px 0 rgba(255,255,255,.95)';
const sel = (list) => list.map((s) => R + ' ' + s).join(',');
const PANELS = [
  '[data-name="Widget/KW"] > [data-name="Background"]', '[data-name="Widget/KWH"] > [data-name="Background"]',
  '[data-name="Widget/Total Energy"]', '[data-name="Widget/Event Count"] > [data-name="Body"]',
  '[data-name="Equipment List"] > [data-name^="Item/"]',
  '[data-name="Card"] > [data-name="Background"]', '[data-name="Side Background"]',
  '[data-name^="Status Card/"]', '[data-name="Widget/Asset List"] > [data-name="Background"]',
];
const CELLS = [
  '[data-name="Ranking"] > [data-name="Background"]', '[data-name^="Table/"] > [data-name="Header Row"]', '[data-name^="Table/"] > [data-name^="Row/"]',
  '[data-name^="Row/"] > [data-name="Badge"]', '[data-name="Equipment List"] [data-name="Badge"]', '[data-name="Equipment"] > [data-name="Badge"]',
  '[data-name^="Filter/"] > [data-name="Badge"]', '[data-name="Count"]', '[data-name="Event List"]', '[data-name^="Event Item/"]',
  '[data-name="Input/Search"]', '[data-name="Body Background"]', '[data-name="Widget/Total Energy"] > [data-name="Body"]',
];
const rules = [
  /* 판 */
  sel(PANELS) + '{box-shadow:' + SH_PANEL + ',' + HI + '!important;}',
  sel(PANELS.map((s) => s + '::after')) + '{border-color:' + LINE_PANEL + '!important;}',
  sel(['[data-name="Equipment List"] > [data-name^="Item/"]', '[data-name^="Status Card/"]', '[data-name="Widget/Total Energy"]', '[data-name="Widget/Event Count"] > [data-name="Body"]'])
    + '{background-image:linear-gradient(180deg,#ffffff 0%,#f6f9fc 100%)!important;background-color:#fff!important;}',
  /* 큰 위젯 바탕 — 원본의 사선 광택은 두고 밑면만 흰 → 아주 옅은 회청 */
  sel(['[data-name="Widget/KW"] > [data-name="Background"]', '[data-name="Widget/KWH"] > [data-name="Background"]', '[data-name="Card"] > [data-name="Background"]'])
    + '{background-image:linear-gradient(135deg,rgba(255,255,255,0) 20%,rgba(255,255,255,.7) 30%,rgba(255,255,255,0) 30%),linear-gradient(180deg,#ffffff 0%,#f5f8fc 100%)!important;}',
  R + ' [data-name="Widget/Asset List"] > [data-name="Background"]{background:linear-gradient(180deg,rgba(255,255,255,.92),rgba(241,246,252,.92))!important;}',
  R + ' [data-name="Side Background"]{background-image:linear-gradient(180deg,#ffffff 0%,#eef3f9 100%)!important;}',
  R + ' [data-name="Category"]{box-shadow:' + SH_CELL + ',' + HI + '!important;}',
  R + ' [data-name="Category"]::after{border-color:' + LINE_PANEL + '!important;}',
  /* 칸 */
  sel(CELLS) + '{box-shadow:' + SH_CELL + ',' + HI + '!important;}',
  sel(CELLS.map((s) => s + '::after')) + '{border-color:' + LINE_CELL + '!important;}',
  sel(['[data-name^="Table/"] > [data-name^="Row/"]', '[data-name^="Event Item/"]', '[data-name="Count"]'])
    + '{background-image:linear-gradient(180deg,#f9fbfd 0%,#f1f5fa 100%)!important;background-color:transparent!important;}',
  R + ' [data-name^="Table/"] > [data-name="Header Row"] > div[aria-hidden]{background-image:linear-gradient(128.96deg,rgba(255,255,255,0) 10.7%,rgba(255,255,255,.85) 51.4%,rgba(255,255,255,0) 51.4%),linear-gradient(180deg,#eef3f9,#e6edf6)!important;}',
  R + ' [data-name="Ranking"] > [data-name="Background"],' + R + ' [data-name="Event List"]{background:rgba(238,243,249,.55)!important;box-shadow:inset 0 1px 2px rgba(24,44,84,.05)!important;}',
  sel(['[data-name^="Row/"] > [data-name="Badge"]', '[data-name="Equipment List"] [data-name="Badge"]', '[data-name="Equipment"] > [data-name="Badge"]', '[data-name^="Filter/"] > [data-name="Badge"]'])
    + '{background-image:linear-gradient(180deg,#ffffff,#eef3f9)!important;background-color:transparent!important;}',
  R + ' [data-name^="Row/"] > [data-name="Badge"] > div[aria-hidden]{background:transparent!important;}',
  /* 고른 필터 — 원본의 반쪽 사선 광택을 주조 파랑으로 옅게 + 파란 선(정지 화면은 (Active) 이름, 라이브는 .be-fact) */
  sel(['[data-name^="Filter/"].be-fact > [data-name="Badge"]', '[data-name^="Filter/"][data-name$="(Active)"]:not(.be-filter) > [data-name="Badge"]'])
    + '{background-image:linear-gradient(130.29deg,rgba(36,87,197,.16) 49.7%,rgba(36,87,197,0) 49.7%),linear-gradient(180deg,#ffffff,#eef3f9)!important;box-shadow:0 4px 10px -4px rgba(36,87,197,.35),' + HI + '!important;}',
  sel(['[data-name^="Filter/"].be-fact > [data-name="Badge"]::after', '[data-name^="Filter/"][data-name$="(Active)"]:not(.be-filter) > [data-name="Badge"]::after']) + '{border-color:rgba(36,87,197,.5)!important;}',
  /* 안쪽 빛(다크용 하늘 내광 · 16px)은 흰 칸에서 탁한 테두리처럼 보였다 → 아주 옅게 */
  R + ' [data-name="Header Row"] > div:last-child,' + R + ' [data-name="Count"] > div:last-child,' + R + ' [data-name^="Row/"] [data-name="Badge"] > div:last-child{box-shadow:inset 0 0 10px 0 rgba(86,141,255,.08)!important;}',
  R + ' [data-name="Input/Search"]{background:#f3f6fa!important;}',
  /* 總電量 안쪽 칸 — 평평한 회색(#dbdde0)이 판 안에서 덩어리로 보였다 → 옅은 회청 칸 */
  R + ' [data-name="Widget/Total Energy"] > [data-name="Body"]{background:linear-gradient(180deg,#f6f9fc 0%,#edf2f8 100%)!important;}',
  /* 이벤트 줄 설비 ID · 층 — 다크용 하늘(#7dffff · #8cddff)이 흰 줄에서 2.5:1 → 같은 색상의 짙은 단 */
  R + ' [data-name="Meta"] [data-name="Equipment ID"]{color:#0a7896!important;}',
  R + ' [data-name="Meta"] [data-name="Floor"]{color:#1c66a8!important;}',
  /* 자산 이름 — 옅은 회색이라 흰 줄에서 흐렸다 */
  R + ' [data-name="Tree"] [data-name^="Item/"] p{color:#55657c!important;}',
  R + ' [data-name="Tree"] [data-name$="(Active)"]:not(.be-lunsel) p,' + R + ' [data-name="Tree"] .be-lsel p{color:#0b2a55!important;font-weight:600;}',
  R + ' [data-name="Toggle"]{background:linear-gradient(180deg,#ffffff,#e7edf5)!important;box-shadow:0 1px 2px rgba(24,44,84,.12),inset 0 0 0 1px rgba(112,138,180,.22)!important;}',
  R + ' [data-name^="Tree Item/"]{background:linear-gradient(180deg,#fbfcfe,#f2f6fb)!important;box-shadow:inset 0 -1px 0 rgba(112,138,180,.12)!important;}',
  /* 강조 */
  sel(['[data-name^="Icon Button/"]']) + '{box-shadow:0 1px 2px rgba(24,44,84,.08),0 4px 10px -4px rgba(36,87,197,.25)!important;}',
  sel(['[data-name^="Icon Button/"]::after']) + '{border-color:rgba(36,87,197,.38)!important;}',
  sel(['[data-name^="Icon Button/"] > div[aria-hidden]']) + '{background:linear-gradient(180deg,#ffffff,#eef3fb)!important;}',
  R + ' [data-name="Chip/Top3"]{box-shadow:0 2px 6px -2px rgba(36,120,210,.3)!important;}',
  R + ' [data-name="Chip/Top3"]::after{border-color:rgba(36,120,210,.45)!important;}',
  R + ' [data-name="Event Item/CR"] > [data-name="Badge"]::after{border-color:rgba(220,80,80,.45)!important;}',
  R + ' [data-name="Event Item/WA"] > [data-name="Badge"]::after{border-color:rgba(20,150,190,.45)!important;}',
  R + ' [data-name="Filter Bar"]{box-shadow:' + SH_PANEL + ',' + HI + '!important;background-image:linear-gradient(180deg,rgba(255,255,255,.94),rgba(243,247,252,.94))!important;}',
  /* 차트 — 흰 바탕에서 묻힌 하늘 막대 · 범례 · 슬라이더 빛 */
  R + ' [data-name="Bar"]{background-image:linear-gradient(to top,rgba(14,170,205,.12),#10aacd)!important;}',
  R + ' [data-name="Item/Real Time"] > [data-name="Marker"],' + R + ' [data-name="Item/This Floor"] > [data-name="Marker"]{background:#10aacd!important;}',
  R + ' [data-name="Grid Line"] > [data-name="Line"]{background:rgba(86,120,200,.14)!important;}',
  R + ' [data-name="Grid Line"]:last-child > [data-name="Line"]{background:rgba(86,120,200,.35)!important;}',
];
for (const k of ['1-3', '7-472']) {
  const key = k + ':light';
  const keep = (J[key] || []).filter((r) => r.indexOf('/*DEPTH*/') < 0);
  J[key] = keep.concat(rules.map((r) => '/*DEPTH*/' + r));
}
fs.writeFileSync(P, JSON.stringify(J, null, 1));
console.log('depth rules', rules.length);
