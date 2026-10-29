/* 보안 현황 메인(2:2)의 design context 는 응답이 커서 **끝부분이 잘린 채** 파일로 떨어졌다
   (Right Column 여는 줄 바로 뒤에서 끊긴다 — 좌측 열까지는 온전하다).
   우측 열(80:21)만 따로 받아(dc-rc-2-2.txt) 화면 dc 의 우측 열 자리를 **통째로 갈아 끼운다**(LS splice-right 와 같은 장치).
   · 받은 원문을 손으로 옮기지 않는다 — save-dc.js 가 tool-results 파일에서 그대로 옮긴 것을 쓴다.
   · 받은 쪽 에셋 상수 이름이 화면 dc 와 겹치면 다른 그림일 수 있어 전부 imgR… 로 바꿔 붙인다.
   · 우측 열 뒤의 형제 'Marker (Stray)'(19:18 · 1005,348 7x5)도 잘려 나갔다 — 같은 자리 같은 그림인
     입력 화면(67:1067)의 67:1690 그림 상수를 imgS… 로 가져와 같은 마크업으로 붙인다.
   실행: node splice-right.js   (dc-2-2.txt 를 고쳐 쓴다 — 원본은 dc-2-2.raw.txt 로 남긴다) */
'use strict';
const fs = require('fs'), path = require('path');
const GEN = __dirname;
const rawPath = path.join(GEN, 'dc-2-2.raw.txt');
if (!fs.existsSync(rawPath)) fs.copyFileSync(path.join(GEN, 'dc-2-2.txt'), rawPath);
const scr = fs.readFileSync(rawPath, 'utf8');
let rp = fs.readFileSync(path.join(GEN, 'dc-rc-2-2.txt'), 'utf8');
rp = rp.slice(0, rp.lastIndexOf('\n}') + 2);

const names = [...rp.matchAll(/^const (\w+) = "([^"]+)";$/gm)].map((m) => m[1]);
for (const n of names) rp = rp.replace(new RegExp('\\b' + n + '\\b', 'g'), 'imgR' + n.replace(/^img/, ''));
let consts = [...rp.matchAll(/^const \w+ = "[^"]+";$/gm)].map((m) => m[0]).join('\n');

/* 떠 있는 표지 그림 — 입력 화면 dc 의 67:1690 */
const dc3 = fs.readFileSync(path.join(GEN, 'dc-67-1067.txt'), 'utf8');
const stray = /^const imgMarkerStray = "([^"]+)";$/m.exec(dc3);
if (!stray) throw new Error('67:1690 그림 상수를 못 찾았다');
consts += '\nconst imgSMarkerStray = "' + stray[1] + '";';

const RP_OPEN = '<div className="contents relative size-full" data-node-id="80:21" data-name="Right Column">';
const a = rp.indexOf(RP_OPEN);
if (a < 0) throw new Error('우측 열 뿌리를 못 찾았다');
const bodyStart = a + RP_OPEN.length;
const bodyEnd = rp.lastIndexOf('</div>', rp.lastIndexOf(');'));
const inner = rp.slice(bodyStart, bodyEnd);

const OPEN = 'data-node-id="80:21" data-name="Right Column">';
const at = scr.indexOf(OPEN);
if (at < 0) throw new Error('화면 dc 에서 우측 열을 못 찾았다');
const head = scr.slice(0, at + OPEN.length);

const lastConst = [...head.matchAll(/^const \w+ = "[^"]+";$/gm)].pop();
const cut = lastConst.index + lastConst[0].length;
/* 19:18 — 1005,348 7x5 (화면 1920x1080 기준 inset) */
const MARKER = '\n      <div className="absolute inset-[32.22%_47.29%_67.31%_52.34%]" data-node-id="19:18" data-name="Marker (Stray)">\n'
  + '        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgSMarkerStray} />\n      </div>';
const out = head.slice(0, cut) + '\n' + consts + head.slice(cut)
  + inner.replace(/\n    /g, '\n      ')
  + '</div>' + MARKER + '\n    </div>\n  );\n}\n';
fs.writeFileSync(path.join(GEN, 'dc-2-2.txt'), out);
console.log('dc-2-2.txt', out.length, '자 · 붙인 상수', names.length + 1, '개 · node-id', (out.match(/data-node-id="/g) || []).length);
