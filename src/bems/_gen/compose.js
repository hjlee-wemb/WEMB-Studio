/* 가스 메인(3059:3990) design context 는 10만 자에서 잘려 왔다(센서 패널 2 중간에서 끊김).
   잘린 앞부분(이벤트 로그 · 패널 1 · 컴포넌트 정의)은 그대로 쓰고, 나머지 자식은 따로 받은 응답
   (dc-part-<노드>.txt)을 그 자리에 끼워 하나의 dc-3059-3990.txt 로 다시 만든다.
   · 따로 받은 응답의 뿌리는 단독 렌더라 className 이 size-full 이다 → 부모 안 자리(use_figma 로 읽은 x · y · w · h)로 바꾼다.
   · 에셋 상수 · 컴포넌트 이름이 응답끼리 겹치므로 따로 받은 쪽에 꼬리표를 붙인다.
   · Guide(3059:4549)는 Figma 에서 숨김이라 넣지 않는다.
   실행: node compose.js  (원본 잘린 응답은 dc-3059-3990.raw.txt 로 보관) */
'use strict';
const fs = require('fs'), path = require('path');
const G = __dirname;
const RAW = path.join(G, 'dc-3059-3990.raw.txt');
if (!fs.existsSync(RAW)) fs.copyFileSync(path.join(G, 'dc-3059-3990.txt'), RAW);
let raw = fs.readFileSync(RAW, 'utf8');
/* 응답 뒤에 붙은 안내문 · 끊긴 꼬리를 잘라낸다 — 패널 1 호출 줄까지만 쓴다 */
const CUT = '<WidgetSensorStatus className="h-[301px] relative shrink-0 w-[415px]" />';
const ci = raw.indexOf(CUT);
if (ci < 0) throw new Error('패널 1 호출 줄을 못 찾음');
let head = raw.slice(0, ci + CUT.length);
/* 패널 1 은 컴포넌트 함수 호출이라 뿌리에 data-name 이 없고 마스터 id(47:1045)가 붙어 온다
   → Figma 인스턴스 이름 · id(Widget/Sensor Status 1 · 3096:4290, meta 로 확인)로 되살린다(차트 바꾸기 · 패널 이동이 이름으로 찾는다) */
head = head.replace('<div className={className || "h-[301px] relative w-[415px]"} data-node-id="47:1045">',
  '<div className={className || "h-[301px] relative w-[415px]"} data-name="Widget/Sensor Status 1" data-node-id="3096:4290">');
if (!/data-name="Widget\/Sensor Status 1"/.test(head)) throw new Error('패널 1 뿌리를 못 고침');

const PARTS = [
  { f: 'dc-part-3096-4372.txt', tag: 'P2', cls: 'h-[301px] relative shrink-0 w-[415px]' },
  { f: 'dc-part-3096-4454.txt', tag: 'P3', cls: 'h-[301px] relative shrink-0 w-[415px]' },
  { f: 'dc-part-3059-4491.txt', tag: 'ST', cls: 'absolute content-stretch flex flex-col h-[912px] items-start left-0 top-[5.576px] w-[1426.974px]' },
  { f: 'dc-part-3070-2795.txt', tag: 'HD', cls: 'absolute h-[50.37px] left-[0.369px] top-0 w-[1919.262px]' },
];
const consts = [], comps = [], bodies = {};
const headComps = new Set([...head.matchAll(/^function (\w+)\(/gm)].map((m) => m[1]));
for (const p of PARTS) {
  let s = fs.readFileSync(path.join(G, p.f), 'utf8');
  const exp = s.indexOf('export default function');
  /* 에셋 이름 꼬리표 */
  const names = [...s.matchAll(/^const (img\w+) = /gm)].map((m) => m[1]);
  names.sort((a, b) => b.length - a.length).forEach((n) => { s = s.replace(new RegExp('\\b' + n + '\\b', 'g'), n + p.tag); });
  /* 겹치는 컴포넌트 이름 꼬리표 */
  const cn = [...s.slice(0, s.indexOf('export default function')).matchAll(/^function (\w+)\(/gm)].map((m) => m[1]);
  cn.filter((n) => headComps.has(n)).forEach((n) => {
    s = s.replace(new RegExp('\\bfunction ' + n + '\\(', 'g'), 'function ' + n + p.tag + '(')
      .replace(new RegExp('<' + n + '([\\s/>])', 'g'), '<' + n + p.tag + '$1')
      .replace(new RegExp('\\btype ' + n + 'Props\\b', 'g'), 'type ' + n + p.tag + 'Props')
      .replace(new RegExp('\\b' + n + 'Props\\b', 'g'), n + p.tag + 'Props');
  });
  const e2 = s.indexOf('export default function');
  const pre = s.slice(0, e2);
  pre.split('\n').filter((l) => /^const img\w+ = "/.test(l)).forEach((l) => consts.push(l));
  const defs = pre.split('\n').filter((l) => !/^const img\w+ = "/.test(l)).join('\n').trim();
  if (defs) comps.push(defs);
  const ret = s.indexOf('return (', e2);
  let jsx = s.slice(s.indexOf('<', ret), s.lastIndexOf(');')).trim();
  /* 뿌리 className 을 부모 안 자리로 */
  jsx = jsx.replace(/^<div className="[^"]*"/, '<div className="' + p.cls + '"');
  bodies[p.tag] = jsx;
}
/* 헤더 — 선택된 탭(가스)이 변형 기본 인스턴스라 data-name 이 빠졌다 → 되살린다 */
bodies.HD = bodies.HD.replace('<NavItem className="content-stretch flex h-[50px] items-center justify-center px-[37px] py-[17px] relative shrink-0 w-[152px]" />',
  '<NavItem className="content-stretch flex h-[50px] items-center justify-center px-[37px] py-[17px] relative shrink-0 w-[152px]" />');

const ind = (s, n) => s.split('\n').map((l) => ' '.repeat(n) + l).join('\n');
const out = head.replace(/^(const img\w+ = "[^"]+";\n)(?!const img)/m, (m) => m + consts.join('\n') + '\n')
  .replace(/\nexport default function/, '\n' + comps.join('\n\n') + '\n\nexport default function')
  + '\n' + ind(bodies.P2, 10) + '\n' + ind(bodies.P3, 10)
  + '\n        </div>\n' + ind(bodies.ST, 8) + '\n      </div>\n' + ind(bodies.HD, 6) + '\n    </div>\n  );\n}\n';
fs.writeFileSync(path.join(G, 'dc-3059-3990.txt'), out);
console.log('dc-3059-3990.txt', out.length, '자 · 에셋', (out.match(/^const img\w+ = "/gm) || []).length, '· 노드', (out.match(/data-node-id="/g) || []).length);
