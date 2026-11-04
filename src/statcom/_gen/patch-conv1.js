/* conv.js 고침 1 — 인스턴스 안 글자 상자 찾기 · Noto 글자 → Pretendard · 모르는 클래스. 실행: node patch-conv1.js */
'use strict';
const fs = require('fs'), path = require('path');
const p = path.join(__dirname, 'conv.js');
let s = fs.readFileSync(p, 'utf8');
if (s.includes('META_PROXY')) { console.log('이미 고침'); process.exit(0); }
const rep = (a, b) => { if (!s.includes(a)) throw new Error('못 찾음: ' + a.slice(0, 90)); s = s.split(a).join(b); };
/* META_PROXY — 인스턴스 안 노드(I1:193;1:650)는 마스터 id(1:650)로도 찾는다 */
rep('  const META = {};\n', "  const META = new Proxy({}, { get: (t, k) => (typeof k === 'string' ? (t[k] || t[k.split(';').pop()]) : undefined) }); /* META_PROXY */\n");
/* Noto Sans KR(알림 본문 9곳)도 Pretendard CDN 으로 */
rep("set('font-family', FONTS[fam] ||", "if (fam === 'Noto_Sans_KR') fam = 'Pretendard';\n      set('font-family', FONTS[fam] ||");
rep("if (/^from-\\[/.test(c)) {", "if (c === 'via-1/2' || c === 'font-light') continue;\n    if (/^from-\\[/.test(c)) {");
fs.writeFileSync(p, s);
console.log('ok');
