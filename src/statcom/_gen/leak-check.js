/* 라이트 시트의 선택자가 전부 [data-theme="light"] 아래에 있는지 본다 — 조건 없는 규칙은 다크 화면과 다른 템플릿까지 칠한다.
   conv.js 뒤에 돌린다. 하나라도 있으면 종료 코드 1. 실행: node src/statcom/_gen/leak-check.js */
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const F = { tcm: 'main', tcs: 'statcom', tcp: 'power', tcv: 'valve', tcc: 'cooling', tce: 'supply', tcn: 'safety', tcu: 'simulation', tca: 'alarm', tcq: 'cards', tvt: 'vr-topic', tvo: 'vr-overview', tvs: 'vr-step', tvm: 'vr-menu', tcl: 'login' };
global.window = {};
const split = (list) => {
  const out = [];
  let depth = 0, cur = '';
  for (const ch of list) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim()).filter(Boolean);
};
let total = 0;
Object.keys(F).forEach((px) => {
  require(path.join(ROOT, 'src', 'statcom-' + F[px] + '.js'));
  const css = window[px.toUpperCase() + '_LIGHT_CSS'].replace(/\/\*[\s\S]*?\*\//g, '');
  const leaks = new Set();
  for (const m of css.matchAll(/([^{}]+)\{[^}]*\}/g)) split(m[1]).forEach((s) => { if (s.indexOf('[data-theme="light"]') < 0) leaks.add(s); });
  total += leaks.size;
  if (leaks.size) console.error('  !! ' + px + ' ' + leaks.size + ': ' + [...leaks].slice(0, 5).join(' | '));
});
console.log('라이트 시트 15개 — 조건 없는 선택자 ' + total + '개');
if (total) process.exitCode = 1;
