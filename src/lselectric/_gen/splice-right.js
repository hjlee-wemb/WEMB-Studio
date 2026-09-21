/* STATCOM 화면(3:5)의 design context 는 응답이 커서 **끝부분이 잘린 채** 파일로 떨어졌다
   (Navigator 의 Rotate Left 중간에서 끊겨 Site Selector 와 닫는 태그가 없다).
   우측 패널(33:746)만 따로 받아(rp-3-5.txt) 화면 dc 의 우측 패널 자리를 **통째로 갈아 끼운다**.
   · 받은 원문을 손으로 옮기지 않는다 — extract-dc.js 가 세션 기록에서 그대로 꺼낸 파일을 쓴다.
   · 에셋 상수 이름이 화면 dc 와 겹치면 다른 그림을 가리킬 수 있어(imgMarker 등) 전부 imgR… 로 바꿔 붙인다.
   · 여는 줄(위치 클래스)은 화면 dc 의 것을 그대로 둔다(받은 쪽 뿌리는 'contents relative size-full').
   실행: node src/lselectric/_gen/splice-right.js   (dc-3-5.txt 를 고쳐 쓴다 — 원본은 dc-3-5.raw.txt 로 남긴다) */
'use strict';
const fs = require('fs'), path = require('path');
const GEN = __dirname;
const rawPath = path.join(GEN, 'dc-3-5.raw.txt');
if (!fs.existsSync(rawPath)) fs.copyFileSync(path.join(GEN, 'dc-3-5.txt'), rawPath);
const scr = fs.readFileSync(rawPath, 'utf8');
let rp = fs.readFileSync(path.join(GEN, 'rp-3-5.txt'), 'utf8');
rp = rp.slice(0, rp.lastIndexOf('\n}') + 2);                       /* 함수 끝 뒤의 안내문은 버린다 */

/* 받은 쪽 에셋 상수 → imgR… */
const names = [...rp.matchAll(/^const (\w+) = "([^"]+)";$/gm)].map((m) => m[1]);
for (const n of names) rp = rp.replace(new RegExp('\\b' + n + '\\b', 'g'), 'imgR' + n.replace(/^img/, ''));
const consts = [...rp.matchAll(/^const \w+ = "[^"]+";$/gm)].map((m) => m[0]).join('\n');

/* 받은 쪽 뿌리의 자식들 */
const RP_OPEN = '<div className="contents relative size-full" data-node-id="33:746" data-name="Right Panel">';
const a = rp.indexOf(RP_OPEN);
if (a < 0) throw new Error('우측 패널 뿌리를 못 찾았다');
const bodyStart = a + RP_OPEN.length;
const bodyEnd = rp.lastIndexOf('</div>', rp.lastIndexOf(');'));   /* 뿌리의 닫는 태그 */
const inner = rp.slice(bodyStart, bodyEnd);

/* 화면 쪽 우측 패널 여는 줄까지 */
const OPEN = 'data-node-id="33:746" data-name="Right Panel">';
const at = scr.indexOf(OPEN);
if (at < 0) throw new Error('화면 dc 에서 우측 패널을 못 찾았다');
const head = scr.slice(0, at + OPEN.length);

/* 에셋 상수는 맨 위 상수 목록 끝에 붙인다 */
const lastConst = [...head.matchAll(/^const \w+ = "[^"]+";$/gm)].pop();
const cut = lastConst.index + lastConst[0].length;
const out = head.slice(0, cut) + '\n' + consts + head.slice(cut)
  + inner.replace(/\n    /g, '\n      ')              /* 들여쓰기 한 단 — 모양만 */
  + '</div>\n    </div>\n  );\n}\n';
fs.writeFileSync(path.join(GEN, 'dc-3-5.txt'), out);
console.log('dc-3-5.txt', out.length, '자 · 붙인 상수', names.length, '개 · node-id', (out.match(/data-node-id="/g) || []).length);
