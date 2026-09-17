/* 미리보기에 `?live=0` 을 더한다 — 픽셀 대조용.
   라이브 레이어가 켜져 있으면 시계·이벤트 피드가 매초 달라져서 Figma 렌더와 견줄 수가 없다
   (새 줄이 스며드는 중에 찍히면 그 줄이 비어 보여 '레이아웃이 틀어졌다'고 오진하게 된다).
   실행: node src/posco/_gen/patch-preview-live.js */
'use strict';
const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'conv.js');
let s = fs.readFileSync(p, 'utf8');
if (s.indexOf('live=0') >= 0) { console.log('이미 반영돼 있다'); process.exit(0); }

const re = /'<script>window\.initPosco && window\.initPosco\(document\.querySelector\("\.' \+ PX \+ '-root"\)\);<\/script>',/;
if (!re.test(s)) throw new Error('앵커를 못 찾았다');
s = s.replace(re, () =>
  "'<script>if(new URLSearchParams(location.search).get(\"live\")!==\"0\")"
  + "window.initPosco && window.initPosco(document.querySelector(\".' + PX + '-root\"));</script>',");
fs.writeFileSync(p, s);
console.log('patched conv.js — 미리보기 ?live=0');
