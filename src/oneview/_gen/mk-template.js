/* js/templates/indpark.js → js/templates/oneview.js (장면표 · 이름만 바꾼다). 실행: node src/oneview/_gen/mk-template.js */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const SC = [
  ['main', 'ovm', '종합현황'], ['overview2', 'ovn', '종합현황 2'], ['transactions', 'ovt', '거래현황'], ['was', 'ovw', 'WAS 현황'],
  ['waspopup', 'ovp', 'WAS 페이지 설정'], ['tp', 'ovq', 'TP 성능현황'], ['system', 'ovs', '시스템 현황'], ['system2', 'ovr', '시스템 현황 2'],
  ['detail', 'ovd', '시스템 현황 상세'], ['network', 'ovk', '네트워크 현황'], ['event', 'ove', '이벤트현황'],
];
let s = fs.readFileSync(path.join(ROOT, 'js', 'templates', 'indpark.js'), 'utf8');
const table = 'const OV_SCREENS = {\n' + SC.map(([k, px, t]) => "  '" + k + "': { px: '" + px + "', build: 'build_" + px + "', css: ['" + px.toUpperCase() + "_CSS'], light: ['" + px.toUpperCase() + "_LIGHT_CSS'], title: '통합 운영 원뷰 — " + t + "' },").join('\n') + '\n};';
s = s.replace(/const IP_SCREENS = \{[\s\S]*?\n\};/, table);
s = s.replace(/const IP_ROOTS = '[^']*';/, "const OV_ROOTS = '" + SC.map((x) => '.' + x[1] + '-root').join(', ') + "';");
s = s.replace(/const IP_SEED = '[^']*';/, "const OV_SEED = '#2F80FF';");
s = s.replace(/\/\* 시안 자신의 주조색 — [^\n]*\*\//, '/* 시안 자신의 주조색 — 강조 파랑(#2F80FF, Stop · 활성 단추 · 차트 강조). \'색 정하기\'의 시작값 */');
s = s.replace(/\/\* ── Digital Twin: Smart Industrial Complex[\s\S]*?\*\//,
  '/* ── Dashboard: Integrated Operations One-View — Figma 화면 11장을 순수 HTML/CSS DOM 으로 재구축한 것을 얹는다 ──\n' +
  '   원본: Figma B4mYvI2xtGTL1K5crHMLqe (Page 1 화면 11장, 익명화 · 가상 데이터 반영본) · 생성기 src/oneview/_gen.\n' +
  '   글자는 전부 편집 가능한 실제 텍스트(Pretendard CDN), 아이콘 · 그래픽만 Figma 가 내보낸 개별 svg/png(src/oneview/).\n' +
  '   원본이 다크 시안이라 라이트 시트를 함께 두어 \'화면 테마\'로 자유롭게 바꾼다.\n' +
  '   11장은 모두 단독 화면이다(팝업 장면도 Figma 에서 화면 전체로 그려져 있다) — 장면마다 뿌리가 따로(.ovm … .ove-root).\n' +
  '   인터랙션 · 라이브 · 반응형 · 차트 바꾸기 · 패널 옮기기는 src/oneview-live.js(window.initOneview). */');
s = s.replace('/* ── 스마트 산단 디지털 트윈 템플릿 연결 ── */', '/* ── 통합 운영 원뷰 템플릿 연결 ── */');
s = s.split('IP_SCREENS').join('OV_SCREENS').split('IP_ROOTS').join('OV_ROOTS').split('IP_SEED').join('OV_SEED').split('IP_BUILDS').join('OV_BUILDS')
  .split('ipSheetId').join('ovSheetId').split('Indpark').join('Oneview').split('indpark').join('oneview');
if (/\bip[a-z]-|IP_|스마트 산단/.test(s)) console.log('! 흔적', (s.match(/.{30}(\bip[a-z]-|IP_|스마트 산단).{30}/) || [])[0]);
fs.writeFileSync(path.join(ROOT, 'js', 'templates', 'oneview.js'), s);
console.log('js/templates/oneview.js', s.length);
