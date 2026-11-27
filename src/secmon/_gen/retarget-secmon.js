/* bems 생성기 사본을 증권 통합관제(secmon) 장면 6 + 팝업 조각 3 으로 돌린다 — 한 번만 실행.
   dl.js · conv.js · mk-live.js · mk-meta.js 의 화면 표 · 경로 · 이름을 바꾼다. */
'use strict';
const fs = require('fs'), path = require('path');
const G = __dirname;
function patch(f, pairs) {
  let s = fs.readFileSync(path.join(G, f), 'utf8');
  for (const [a, b] of pairs) {
    if (a instanceof RegExp) { if (!a.test(s)) console.log('  !! no match', f, a); s = s.replace(a, b); }
    else { if (s.indexOf(a) < 0) console.log('  !! no match', f, a.slice(0, 60)); s = s.split(a).join(b); }
  }
  fs.writeFileSync(path.join(G, f), s);
  console.log('patched', f);
}
const KEYS = ['4041-8351', '4039-2211', '4039-3717', '4039-5908', '4039-10484', '4038-2699', '4041-7220', '4041-7319', '4041-7360'];
patch('dl.js', [
  [/\["1-3","7-472"\]/, JSON.stringify(KEYS)],
  ['src/bems/', 'src/secmon/'],
]);
const SC = [
  "  { key: '4041-8351', node: '4041:8351', px: 'smm', name: 'Screen/Integrated Monitoring', out: 'secmon-main', page: 'main', meta: ['meta-4041-8351.xml'] },",
  "  { key: '4039-2211', node: '4039:2211', px: 'smc', name: 'Screen/Channel Status', out: 'secmon-channel', page: 'channel', meta: ['meta-4039-2211.xml'] },",
  "  { key: '4039-3717', node: '4039:3717', px: 'sms', name: 'Screen/Microservices', out: 'secmon-micro', page: 'micro', meta: ['meta-4039-3717.xml'] },",
  "  { key: '4039-5908', node: '4039:5908', px: 'smq', name: 'Screen/Message Queue', out: 'secmon-mq', page: 'mq', meta: ['meta-4039-5908.xml'] },",
  "  { key: '4039-10484', node: '4039:10484', px: 'smi', name: 'Screen/Infrastructure', out: 'secmon-infra', page: 'infra', meta: ['meta-4039-10484.xml'] },",
  "  { key: '4038-2699', node: '4038:2699', px: 'sme', name: 'Screen/Event Status', out: 'secmon-event', page: 'event', meta: ['meta-4038-2699.xml'] },",
  /* 통합관제 위에 얹는 조각 — 라이브가 build_<px>() 로 마크업만 꺼내 쓴다 */
  "  { key: '4041-7220', node: '4041:7220', px: 'smx', name: 'Event Panel (Expanded)', out: 'secmon-eventpanel', page: 'eventpanel', meta: ['meta-4041-7220.xml'], overlay: { base: 'smm', build: 'build_smm_eventpanel', left: 40, top: 778, w: 1840, h: 308 } },",
  "  { key: '4041-7319', node: '4041:7319', px: 'sma', name: 'Popup/Event Alert', out: 'secmon-alert', page: 'alert', meta: ['meta-4041-7319.xml'], overlay: { base: 'smm', build: 'build_smm_alert', left: 660, top: 350, w: 600, h: 380, dim: 'rgba(0,0,0,0.7)' } },",
  "  { key: '4041-7360', node: '4041:7360', px: 'smg', name: 'Popup/Sound Settings Guide', out: 'secmon-sound', page: 'sound', meta: ['meta-4041-7360.xml'], overlay: { base: 'smm', build: 'build_smm_sound', left: 360, top: 240, w: 1200, h: 600, dim: 'rgba(0,0,0,0.7)' } },",
];
patch('conv.js', [
  [/const SCREENS = \[[\s\S]*?\n\];/, () => 'const SCREENS = [\n' + SC.join('\n') + '\n];'],
  ["'bems-live.js'", "'secmon-live.js'"],
  ['../bems-live.js', '../secmon-live.js'],
  ["var A = 'src/bems/';", "var A = 'src/secmon/';"],
  ["path.join(STUDIO, 'src', 'bems', r.S.page + '.html')", "path.join(STUDIO, 'src', 'secmon', r.S.page + '.html')"],
  ['window.initBems && window.initBems(', 'window.initSecmon && window.initSecmon('],
  ["'/* 스마트 빌딩 에너지 관리 — '", "'/* 증권 통합관제 — '"],
  ["'   원본: Figma CKnzs0z7gCSTPybhRZme1P / node ' + r.S.node + ' (Dark-시안01 페이지)'", "'   원본: Figma CWWIdHGJ2LlEolp3hCe6Gk / node ' + r.S.node + ' (REM 페이지)'"],
  ["'   생성기: src/bems/_gen/conv.js — 손으로 고치지 말 것. */'", "'   생성기: src/secmon/_gen/conv.js — 손으로 고치지 말 것. */'"],
]);
patch('mk-live.js', [
  ["path.join(__dirname, '..', '..', 'bems-live.js')", "path.join(__dirname, '..', '..', 'secmon-live.js')"],
  ["console.log('bems-live.js', out.length);", "console.log('secmon-live.js', out.length);"],
]);
/* mk-meta: A/B 말고 어떤 글자 묶음이든 받는다(장면이 커서 여러 번 나눠 받았다) */
patch('mk-meta.js', [
  [/let m = \/\^@@meta \(\\S\+\) \(\\w\)\\n/, 'let m = /^@@meta (\\S+) (\\w)\\n'],
  ['const lines = [].concat(b.X || [], b.A || [], b.B || []);', 'const lines = [].concat(b.X || [], ...Object.keys(b).filter((k) => k !== "X").sort().map((k) => b[k]));'],
]);
