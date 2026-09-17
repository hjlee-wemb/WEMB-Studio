/* SOP 화면(1:9688 · 1:9770 · 1:9852)을 받으며 드러난 변환 오차 둘을 고친다 — 그 화면에만 켠다(S.sop).
   예전 여섯 장은 이미 픽셀 대조를 마친 상태라 결과를 바꾸지 않는다.

   ① 1px 보다 얇은 테두리(border-[0.5px])는 브라우저가 1px 로 올려 그린다. Figma 는 stroke 를 상자 **안쪽**에
      그리고 오토레이아웃 폭에 넣지 않는데(칩 133 = 12+8+10+91+12), CSS border 는 폭에 더해져 칩마다 2px 씩
      넓어진다. 칩 묶음은 정확히 436px 을 꽉 채우도록 짜여 있어서 **2px 만 늘어도 셋째 칩이 다음 줄로 떨어진다**
      (상황실 추적 카드가 한 줄 더 길어졌다). → 얇은 테두리는 레이아웃에 안 잡히는 안쪽 링(::after inset:0)으로.
   ② <p> 안에 <span> 을 여러 개 둔 글자(조치사항 + " :")는 Figma 가 p 의 글꼴 크기를 0 으로 둔다.
      span 을 줄마다 내려 쓰면 그 사이 줄바꿈이 **크기 0 짜리 빈칸**이 되고, 뒤 span 의 앞 빈칸(" :")이 거기에
      합쳐져 사라진다 → "조치사항:" 로 붙어 나왔다. span 끼리는 줄바꿈 없이 이어 쓴다.

   ※ 이 패치 뒤에 conv.js 에서 직접 넓혔다 — ① 은 대화상자(Dialog/SOP) 안의 **모든** 테두리로(inSopDialog), ② 는 p 높이 고정 · span 위 붙이기, 그리고 겹친 층 클래스 이름(S.layer). README ⑰~⑲ 참고.
   실행: node src/posco/_gen/patch-sop-thin.js   (한 번만 — 두 번 돌리면 이미 고쳤다고 알린다) */
'use strict';
const fs = require('fs');
const path = require('path');
const P = path.join(__dirname, 'conv.js');
/* conv.js 는 CRLF 와 LF 가 섞여 있다 — 앵커가 맞도록 LF 로 고르게 해서 쓴다(node 는 둘 다 읽는다) */
let s = fs.readFileSync(P, 'utf8').split('\r\n').join('\n');
if (s.indexOf('/* SOP: 얇은 테두리') >= 0) { console.log('이미 고쳤다'); process.exit(0); }

const A1 = '    const outside = OUTSIDE_STROKE.indexOf(nid) >= 0;\n';
const B1 = A1
  + '    /* SOP: 얇은 테두리(1px 미만)는 안쪽 링으로 — patch-sop-thin.js ① */\n'
  + '    const thinW = bwI >= 0 ? parseFloat(decls[bwI][1]) : 0;\n'
  + '    const thin = !!S.sop && !hasSide && thinW > 0 && thinW < 1;\n';
const A2 = "(outside || RING_STROKE.indexOf(ringKey) >= 0)) {";
const B2 = "(outside || thin || RING_STROKE.indexOf(ringKey) >= 0)) {";
const A3 = '      const off = outside ? bw : +(bw / 2).toFixed(4);';
const B3 = '      const off = thin ? 0 : outside ? bw : +(bw / 2).toFixed(4);';
const A4 = "    if (node.children.length === 1 && node.children[0].tag === '#text') {";
const B4 = "    /* SOP: span 끼리는 줄바꿈 없이 — patch-sop-thin.js ② */\n"
  + "    if (S.sop && node.tag === 'p' && node.children.length > 1 && node.children.every((c) => c.tag === 'span' || (c.tag === '#text' && !c.text.trim()))) {\n"
  + "      const mark = out.length;\n"
  + "      node.children.filter((c) => c.tag === 'span').forEach((c) => walk(c, 0, null, onDark, myFont));\n"
  + "      const inner = out.splice(mark).map((l) => l.trim()).join('');\n"
  + "      out.push(pad + '<p ' + attrs.join(' ') + '>' + inner + '</p>');\n"
  + "      return;\n"
  + "    }\n" + A4;
for (const [a, b] of [[A1, B1], [A2, B2], [A3, B3], [A4, B4]]) {
  if (s.indexOf(a) < 0) { console.error('앵커를 못 찾았다:', a.slice(0, 60)); process.exit(1); }
  s = s.split(a).join(b);
}
/* SOP 세 화면에 표시를 단다 */
s = s.split("out: 'posco-sop1', meta:").join("out: 'posco-sop1', sop: true, meta:")
  .split("out: 'posco-sop2', meta:").join("out: 'posco-sop2', sop: true, meta:")
  .split("out: 'posco-sop3', meta:").join("out: 'posco-sop3', sop: true, meta:");
fs.writeFileSync(P, s);
console.log('patched conv.js');
