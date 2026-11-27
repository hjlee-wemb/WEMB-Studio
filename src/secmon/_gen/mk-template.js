/* js/templates/bems.js 를 바탕으로 js/templates/secmon.js 를 만든다(한 번만, 이후엔 secmon.js 를 직접 고친다).
   장면 6(통합관제현황 · 채널 · 마이크로 서비스 · 메시지큐 · 인프라 · 이벤트) + 팝업 장면 3(이벤트 판 펼침 · 이벤트 알림 · 사운드 가이드).
   팝업 모듈 셋은 어느 장면에서나 실어 둔다 — 라이브가 이벤트 바 · 등급 수에서 그 자리에 바로 띄운다. 실행: node mk-template.js [--force] */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const OUT = path.join(ROOT, 'js', 'templates', 'secmon.js');
if (fs.existsSync(OUT) && !process.argv.includes('--force')) { console.log('이미 있음 — --force 로 덮어쓰기'); process.exit(0); }
let s = fs.readFileSync(path.join(ROOT, 'js', 'templates', 'bems.js'), 'utf8').replace(/\r\n/g, '\n');
const T = '증권 통합관제';
const sh = (px) => "[['" + px.toUpperCase() + "_CSS', '" + px + "-style'], ['" + px.toUpperCase() + "_LIGHT_CSS', '" + px + "-light-style']]";
const POPS = "['SMX_CSS', 'smx-style'], ['SMX_LIGHT_CSS', 'smx-light-style'], ['SMA_CSS', 'sma-style'], ['SMA_LIGHT_CSS', 'sma-light-style'], ['SMG_CSS', 'smg-style'], ['SMG_LIGHT_CSS', 'smg-light-style']";
const scr = (k, px, build, title) => "  '" + k + "': { px: '" + px + "', build: '" + build + "', sheets: " + sh(px).replace(/\]\]$/, '], ' + POPS + ']') + ", title: '" + T + ' — ' + title + "' },";
const head = s.indexOf('const BE_SCREENS = {');
const headEnd = s.indexOf('const BE_ROOTS = ');
s = s.slice(0, head)
  + 'const BE_SCREENS = {\n'
  + [scr('main', 'smm', 'build_smm', '통합관제현황'), scr('channel', 'smc', 'build_smc', '채널현황'), scr('micro', 'sms', 'build_sms', '마이크로 서비스현황'),
    scr('mq', 'smq', 'build_smq', '메시지큐현황'), scr('infra', 'smi', 'build_smi', '인프라현황'), scr('event', 'sme', 'build_sme', '이벤트현황'),
    scr('eventpanel', 'smm', 'build_smm_eventpanel', '이벤트 현황(펼침)'), scr('alert', 'smm', 'build_smm_alert', '이벤트 알림'), scr('sound', 'smm', 'build_smm_sound', '사운드 설정 가이드')].join('\n')
  + '\n};\n\n' + s.slice(headEnd);
s = s.replace(/const BE_ROOTS = '[^']*';/, "const BE_ROOTS = '.smm-root, .smc-root, .sms-root, .smq-root, .smi-root, .sme-root, .smx-root, .sma-root, .smg-root';");
s = s.replace(/\/\* 시안 자신의 주조색[^\n]*\n/, "/* 시안 자신의 주조색 — 패널 테두리 파랑(#57A2FE). '색 정하기'의 시작값 */\n");
s = s.replace("const BE_SEED = '#568DFF';", "const BE_SEED = '#57A2FE';");
/* 팝업 모듈은 늘 같이 싣는다(라이브가 이벤트 판 · 알림 · 가이드를 그 자리에 띄운다) */
s = s.replace(/const BE_BUILDS = \(k\) => [^\n]*\n/, "const BE_BUILDS = (k) => [(BE_SCREENS[k] || BE_SCREENS.main).build, 'build_smm', 'build_smx', 'build_sma', 'build_smg'].filter((v, i, a) => a.indexOf(v) === i);\n");
s = s.replace(/^\/\* ── 스마트 빌딩[\s\S]*?\*\/\n\/\* px = [^\n]*\n/, [
  '/* ── 증권 통합관제 대시보드 템플릿 연결 ──',
  '',
  '   Dashboard: Securities Integrated Monitoring — Figma CWWIdHGJ2LlEolp3hCe6Gk(REM 페이지, 익명화 · 가상 데이터 · Pretendard 반영본)의',
  '   화면 6장(통합관제현황 · 채널 · 마이크로 서비스 · 메시지큐 · 인프라 · 이벤트) + 팝업 3장(이벤트 판 펼침 · 이벤트 알림 · 사운드 가이드)을',
  '   순수 HTML/CSS DOM 으로 재구축한 것을 얹는다. 생성기 src/secmon/_gen.',
  '   글자는 전부 편집 가능한 실제 텍스트(Pretendard CDN), 아이콘 · 그래픽만 Figma 가 내보낸 개별 svg/png(src/secmon/).',
  '   원본이 다크 네이비라 처음엔 다크로 연다(라이트는 생성기가 파생, _gen/light.js · mk-light-secmon.js · lt-raster.js).',
  '   인터랙션 · 라이브 · 반응형 · 접기 · 스크롤 · 차트 바꾸기 · 패널 옮기기는 src/secmon-live.js(window.initSecmon). */',
  '/* px = 장면 뿌리 · sheets = 꽂을 시트 [전역 이름, 시트 id] — 팝업 시트는 모든 장면에 꽂는다 */',
  '',
].join('\n'));
/* 이름 바꾸기 — 함수 · 저장 키 · 전역 */
s = s.split('Bems').join('Secmon').split("'bems'").join("'secmon'").split('wemb-bems-').join('wemb-secmon-')
  .split('bems-live').join('secmon-live').split('스마트 빌딩 에너지 관리').join(T);
s = s.split('BE_').join('SM_').split('__bemsSceneOf').join('__secmonSceneOf');
/* 팝업 장면은 같은 뿌리(smm) 안에 얹힌 판 — 시트는 모두 꽂는다 */
const left = s.match(/bems|bem-|bef-|BEM_|BEF_/g);
fs.writeFileSync(OUT, s);
console.log('wrote', OUT, s.length, '남은 흔적', left ? left.length : 0);
