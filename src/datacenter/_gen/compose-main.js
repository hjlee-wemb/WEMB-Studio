/* 메인(2857:2053) design context 는 25,000 토큰 한도에서 잘려 왔다(알림 설정 팝업 2857:2153 중간에서 끊김).
   앞부분(바탕 · 3D · 옆 판 · 조작 안내 · 이벤트 로그 · 알람 메시지)은 그대로 쓰고,
   알림 설정(2857:2153) · 헤더(2857:2154)는 따로 받은 응답(dc-part-2857-2153.txt · dc-part-2857-2154.txt)을 그 자리에 끼운다.
   · 따로 받은 응답의 뿌리는 단독 렌더라 className 이 size-full → 부모(프레임) 안 자리(meta 의 x · y · w · h)로 바꾼다.
   · 에셋 상수 이름이 겹치므로 따로 받은 쪽에 꼬리표를 붙인다.
   실행: node compose-main.js  (잘린 원본은 dc-2857-2053.raw.txt 로 보관) */
'use strict';
const fs = require('fs'), path = require('path');
const G = __dirname;
const OUT = path.join(G, 'dc-2857-2053.txt');
const RAW = path.join(G, 'dc-2857-2053.raw.txt');
if (!fs.existsSync(RAW)) fs.copyFileSync(OUT, RAW);
const raw = fs.readFileSync(RAW, 'utf8');
const lines = raw.split('\n');
const cut = lines.findIndex((l) => l.includes('data-node-id="2857:2153"'));
if (cut < 0) throw new Error('2857:2153 줄을 못 찾음');
let head = lines.slice(0, cut).join('\n');
const PARTS = [
  { f: 'dc-part-2857-2153.txt', tag: 'AS', cls: 'absolute h-[146px] left-[1564px] top-[143px] w-[345px]' },
  { f: 'dc-part-2857-2154.txt', tag: 'HD', cls: 'absolute h-[190px] left-0 top-0 w-[1920px]' },
];
const consts = [], bodies = [];
for (const p of PARTS) {
  let s = fs.readFileSync(path.join(G, p.f), 'utf8');
  const names = [...s.matchAll(/^const (img\w+) = /gm)].map((m) => m[1]);
  names.sort((a, b) => b.length - a.length).forEach((n) => { s = s.replace(new RegExp('\\b' + n + '\\b', 'g'), n + p.tag); });
  if (/^function \w+\(/m.test(s.slice(0, s.indexOf('export default function')))) throw new Error('컴포넌트 함수가 있음 — 이름 꼬리표 필요: ' + p.f);
  consts.push(...s.match(/^const img\w+ = "[^"]+";$/gm));
  const exp = s.indexOf('export default function');
  const ret = s.indexOf('return (', exp);
  const j0 = s.indexOf('<', ret);
  let jsx = s.slice(j0, s.lastIndexOf(');')).trimEnd();
  if (!jsx.startsWith('<div className="relative size-full"')) throw new Error('뿌리 모양이 다름: ' + p.f);
  jsx = jsx.replace('<div className="relative size-full"', '<div className="' + p.cls + '"');
  bodies.push(jsx.split('\n').map((l, i) => (i ? '    ' : '        ') + l).join('\n'));
}
/* 에셋 상수는 맨 위(첫 const 앞)에 넣는다 */
const firstConst = head.search(/^const img/m);
head = head.slice(0, firstConst) + consts.join('\n') + '\n' + head.slice(firstConst);
const tail = '\n      </div>\n    </div>\n  );\n}\n';
fs.writeFileSync(OUT, head.replace(/\s+$/, '') + '\n' + bodies.join('\n') + tail);
console.log('wrote', path.basename(OUT), fs.statSync(OUT).size, '· 끼운 조각', PARTS.length, '· 상수', consts.length);
