/* 생성물이 가리키는 폴더·머리말을 이 시안 것으로 바꾼다(hana 에서 복사해 온 흔적 제거).
     · 에셋 기준 경로   src/hana/  → src/posco/
     · 미리보기 출력    src/hana/  → src/posco/
     · 라이브 스크립트  hana-live.js → posco-live.js (initHana → initPosco)
     · 모듈 머리말      한진/HANA → POSCO KDB CCTV 관제 + 이 파일 키
   실행: node src/posco/_gen/patch-paths.js */
'use strict';
const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'conv.js');
let s = fs.readFileSync(p, 'utf8');
const before = s;

s = s.split("\"  var A = 'src/hana/';\"").join("\"  var A = 'src/posco/';\"");
s = s.split("path.join(STUDIO, 'src', 'hana', r.S.out.replace('hana-', '') + '.html')")
     .join("path.join(STUDIO, 'src', 'posco', r.S.out.replace('posco-', '') + '.html')");
s = s.split("'<script src=\"../hana-live.js?v=1\"></script>'")
     .join("'<script src=\"../posco-live.js?v=1\"></script>'");
s = s.split("window.initHana && window.initHana(").join("window.initPosco && window.initPosco(");
s = s.split("'/* 한진 SMART 통합관제 — ' + r.S.name,")
     .join("'/* POSCO KDB CCTV 관제 — ' + r.S.name,");
s = s.split("'   원본: Figma H3S2M7DUCvuJgi75oBqg6W / node ' + r.S.node + ' (1920x1080, page Page 1)',")
     .join("'   원본: Figma dj0SONcO5BySCm7yDdZrNc / node ' + r.S.node + ' (1920x1080, page Page 1)',");
s = s.split("'   생성기: src/hana/_gen/conv.js — 손으로 고치지 말 것. */',")
     .join("'   생성기: src/posco/_gen/conv.js — 손으로 고치지 말 것. */',");
s = s.split("생성기: _gen/dark.js").join("생성기: _gen/light.js");

if (s === before) { console.log('이미 반영돼 있다'); process.exit(0); }
fs.writeFileSync(p, s);
console.log('patched conv.js');
