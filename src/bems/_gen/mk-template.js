/* js/templates/datacenter.js 를 바탕으로 js/templates/bems.js 를 만든다(한 번만, 이후엔 bems.js 를 직접 고친다).
   장면 2개(main · floor)라 팝업 · 카드 조립은 뺀다. 실행: node mk-template.js */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const OUT = path.join(ROOT, 'js', 'templates', 'bems.js');
if (fs.existsSync(OUT) && !process.argv.includes('--force')) { console.log('이미 있음 — --force 로 덮어쓰기'); process.exit(0); }
let s = fs.readFileSync(path.join(ROOT, 'js', 'templates', 'datacenter.js'), 'utf8').replace(/\r\n/g, '\n');
const head = s.indexOf('const DC_SCREENS = {');
const headEnd = s.indexOf("const DC_ROOTS = ");
s = s.slice(0, head)
  + "const DC_SCREENS = {\n"
  + "  'main': { px: 'bem', build: 'build_bem', sheets: [['BEM_CSS', 'bem-style'], ['BEM_LIGHT_CSS', 'bem-light-style']], title: '스마트 빌딩 에너지 관리 — 메인' },\n"
  + "  'floor': { px: 'bef', build: 'build_bef', sheets: [['BEF_CSS', 'bef-style'], ['BEF_LIGHT_CSS', 'bef-light-style']], title: '스마트 빌딩 에너지 관리 — 층별 현황' },\n"
  + "};\n\n"
  + s.slice(headEnd);
s = s.replace(/const DC_ROOTS = '[^']*';/, "const DC_ROOTS = '.bem-root, .bef-root';");
s = s.replace(/\/\* 시안 자신의 주조색[^\n]*\n/, "/* 시안 자신의 주조색 — 단추 테두리 · 막대 파랑(#568DFF). '색 정하기'의 시작값 */\n");
s = s.replace("const DC_SEED = '#2575D5';", "const DC_SEED = '#568DFF';");
s = s.replace(/const DC_BUILDS = \(k\) => [^\n]*\n/, "const DC_BUILDS = (k) => [(DC_SCREENS[k] || DC_SCREENS.main).build];\n");
/* 머리 주석 */
s = s.replace(/^\/\* ── 데이터센터[\s\S]*?\*\/\n\/\* px = [^\n]*\n/, [
  '/* ── 스마트 빌딩 에너지 관리 디지털트윈 템플릿 연결 ──',
  '',
  '   Digital Twin: Smart Building Energy Management — Figma CKnzs0z7gCSTPybhRZme1P(Dark-시안01, 익명화 · 가상 데이터 반영본)의',
  '   화면 2장(메인 · 층별 현황)을 순수 HTML/CSS DOM 으로 재구축한 것을 얹는다. 생성기 src/bems/_gen.',
  '   글자는 전부 편집 가능한 실제 텍스트(Pretendard CDN · Tomorrow), 아이콘 · 그래픽만 Figma 가 내보낸 개별 svg/png(src/bems/).',
  '   원본이 다크 시안이라 처음엔 다크로 연다(라이트는 생성기가 파생, _gen/light.js).',
  '   인터랙션 · 라이브 · 반응형 · 접기 · 스크롤 · 차트 바꾸기 · 패널 옮기기는 src/bems-live.js(window.initBems). */',
  '/* px = 장면 뿌리 · sheets = 꽂을 시트 [전역 이름, 시트 id] */',
  '',
].join('\n'));
/* 이름 바꾸기 — 함수 · 저장 키 · 전역 */
s = s.split('Datacenter').join('Bems').split("'datacenter'").join("'bems'").split('wemb-datacenter-').join('wemb-bems-')
  .split('datacenter-live').join('bems-live').split('데이터센터 통합 모니터링').join('스마트 빌딩 에너지 관리');
s = s.split('DC_').join('BE_');
/* 남은 흔적 */
const left = s.match(/datacenter|dmm|dmp|dmc|dmi/g);
fs.writeFileSync(OUT, s);
console.log('wrote', OUT, s.length, '남은 흔적', left ? left.length : 0);
