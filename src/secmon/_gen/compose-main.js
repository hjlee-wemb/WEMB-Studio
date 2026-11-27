/* 메인(1:3) design context 는 서버 10만 자 한도에서 잘려 왔다(Widget/KWH 7:279 의 Graph 중간에서 끊김).
   앞부분(바탕 · 3D · 헤더 · 왼쪽 열 · Widget/KW)은 그대로 쓰고, Widget/KWH 는 따로 받은 응답(dc-part-7-279.txt)을 그 자리에 끼운다.
   · 따로 받은 뿌리는 "contents relative size-full" — 오른쪽 열(세로 flex, gap 27) 안 칸이므로 633x446 상자로 바꾼다
     (Figma: Widget/KWH = Right Column 안 0,473 · 633x446, 그 안 자식은 이 상자 기준 절대 위치).
   · 에셋 상수 이름이 겹치므로 따로 받은 쪽에 꼬리표 KH 를 붙인다.
   실행: node compose-main.js  (잘린 원본은 dc-1-3.raw.txt 로 보관) */
'use strict';
const fs = require('fs'), path = require('path');
const G = __dirname;
const OUT = path.join(G, 'dc-1-3.txt');
const RAW = path.join(G, 'dc-1-3.raw.txt');
if (!fs.existsSync(RAW)) fs.copyFileSync(OUT, RAW);
const raw = fs.readFileSync(RAW, 'utf8');
const lines = raw.split('\n');
const cut = lines.findIndex((l) => l.includes('data-node-id="7:279"'));
if (cut < 0) throw new Error('7:279 줄을 못 찾음');
let head = lines.slice(0, cut).join('\n');
let s = fs.readFileSync(path.join(G, 'dc-part-7-279.txt'), 'utf8');
const names = [...s.matchAll(/^const (img\w+) = /gm)].map((m) => m[1]);
names.sort((a, b) => b.length - a.length).forEach((n) => { s = s.replace(new RegExp('\\b' + n + '\\b', 'g'), n + 'KH'); });
const consts = s.match(/^const img\w+ = "[^"]+";$/gm);
const exp = s.indexOf('export default function');
const j0 = s.indexOf('<', s.indexOf('return (', exp));
let jsx = s.slice(j0, s.lastIndexOf(');')).trimEnd();
const ROOT = '<div className="contents relative size-full"';
if (!jsx.startsWith(ROOT)) throw new Error('뿌리 모양이 다름');
jsx = jsx.replace(ROOT, '<div className="h-[446px] relative shrink-0 w-[633px]"');
/* 단독으로 받은 조각 안의 묶음(Ranking · Icon/Widget/Building)은 'absolute contents left/top' 인데 자식 좌표가 묶음 기준이다
   (메인 응답의 묶음은 화면 기준). display:contents 로 두면 자식이 위젯 상자 기준이 되어 Top3 표가 차트 위로 올라갔다 → 자리 잡힌 상자로 */
jsx = jsx.replace(/className="absolute contents (left-(?:\[[^\]]+\]|0) top-(?:\[[^\]]+\]|0))"/g, 'className="absolute $1"');
const body = jsx.split('\n').map((l, i) => (i ? '    ' : '        ') + l).join('\n');
const firstConst = head.search(/^const img/m);
head = head.slice(0, firstConst) + consts.join('\n') + '\n' + head.slice(firstConst);
const tail = '\n      </div>\n    </div>\n  );\n}\n';
fs.writeFileSync(OUT, head.replace(/\s+$/, '') + '\n' + body + tail);
console.log('wrote', path.basename(OUT), fs.statSync(OUT).size, '· 상수', consts.length);
