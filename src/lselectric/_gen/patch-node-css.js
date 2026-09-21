/* 이 시안의 노드 보정 규칙(NODE_CSS)을 채운다(한 번만 돌린다).

   ① 센서 상태 2x2 격자(Widget/Sensor Status) — Figma 가 격자 칸 안의 Body · Icon Group 에
      '격자 원점 기준' 여백을 그대로 적어 냈다(소화 ml-145 · 도어 mt-48 · 이상감지 ml-145 mt-48).
      CSS 격자에서는 그 여백이 **칸 안에서 한 번 더** 먹혀 소화·이상감지가 판 밖(x=338)으로,
      도어가 한 줄 아래로 밀렸다(렌더 대조로 발견). 칸 자리는 격자가 이미 잡아 주므로 안쪽 여백만 걷는다.
      값은 Figma 메타데이터 그대로 맞는다: 소화 x=192(=47+145) · 도어 y=364(=114+202+48).
   ② 알림 목록 바 테두리 그라디언트(아래 규칙 주석).
   실행: node src/lselectric/_gen/patch-node-css.js */
'use strict';
const fs = require('fs'), path = require('path');
const p = path.join(__dirname, 'conv.js');
let s = fs.readFileSync(p, 'utf8');
const want = "const NODE_CSS = [\n" +
  "  /* 센서 상태 격자 — 칸 안쪽의 '격자 원점 기준' 여백을 걷는다(patch-node-css.js ①) */\n" +
  "  '.{{PX}}-root [data-name=\"Widget/Sensor Status\"] > * > *{margin-left:0;margin-top:0;}',\n" +
  "  /* 알림 목록 바(…;13:354) 테두리 — Figma stroke 는 세로 그라디언트(60% 까지 흰색, 그 아래 #7CCCFF · 급전환 · inside)인데\n" +
  "     design context 는 흰색 한 가지로 뭉갰다(use_figma 로 원본 stroke 확인, patch-node-css.js ②) */\n" +
  "  '.{{PX}}-root [data-node-id$=\";13:354\"]{border-image:linear-gradient(to bottom,#fff 60%,#7cccff 60%) 1;}',\n" +
  "];";
if (s.indexOf('const NODE_CSS = [];') >= 0) s = s.replace('const NODE_CSS = [];', () => want);
else if (s.indexOf('13:354') < 0) s = s.replace(/const NODE_CSS = \[[\s\S]*?\n\];/, () => want);
fs.writeFileSync(p, s);
console.log('patched conv.js');
