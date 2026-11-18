/* conv.js 를 이 템플릿에 맞춘다(한 번만): 태블릿 장면 빼기 · 탭 조각 3개 · 조각 파일 이름(ccpp-tabs.js). 실행: node patch-conv.js */
'use strict';
const fs = require('fs'), path = require('path');
const p = path.join(__dirname, 'conv.js');
let c = fs.readFileSync(p, 'utf8');
const n0 = c.length;
c = c.replace(/\n  \{ key: '427-1781'[^\n]*\n/, '\n'
  + "  /* 상세 팝업 탭 내용 조각 — 설계(화면 5 숨은 팝업의 설계정보 패널) · 설비 · 자재(Component 섹션 Popup/Detail 변형의 Content).\n"
  + "     live 가 탭을 누르면 Popup/Detail 의 Content 안에 갈아 끼운다(src/ccpp-tabs.js). */\n"
  + "  { key: 'tab-design', node: '427:1536', px: 'ccta', name: '탭 · 설계', frag: 'design', meta: [] },\n"
  + "  { key: 'tab-equipment', node: '427:4038', px: 'cctb', name: '탭 · 설비', frag: 'equipment', meta: [] },\n"
  + "  { key: 'tab-materials', node: '427:4307', px: 'cctc', name: '탭 · 자재', frag: 'materials', meta: [] },\n");
c = c.split("path.join(STUDIO, 'src', 'ccpp-nav.js')").join("path.join(STUDIO, 'src', 'ccpp-tabs.js')");
c = c.split('window.PD_NAV = F;').join('window.CC_TABS = F;');
c = c.split("'<script src=\"../ccpp-nav.js?v=").join("'<script src=\"../ccpp-tabs.js?v=");
c = c.split('wrote src/ccpp-nav.js').join('wrote src/ccpp-tabs.js');
c = c.replace(/'\/\* 복합화력 설비정보 디지털트윈 — 필터 패널 변형 8벌[^\n]*\n[^\n]*\n/, "'/* 복합화력 설비정보 디지털트윈 — 상세 팝업 탭 내용 조각(설계 · 설비 · 자재). live(src/ccpp-live.js)가 탭을 누를 때 Content 안에 갈아 끼운다. 생성기: src/ccpp/_gen/conv.js — 손으로 고치지 말 것. */',\n");
fs.writeFileSync(p, c);
console.log('conv.js', n0, '→', c.length, '· tablet 남음', /427-1781/.test(c), '· tabs', /ccpp-tabs\.js/.test(c));
