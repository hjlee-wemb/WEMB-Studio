/* 그라데이션 선(stroke) 되살리기 → screen-css.json
   design context 는 그라데이션 선을 투명(rgba(...,0)) 단색으로 낸다 — 패널 윗변 시안 반짝임, 서버 이름표 양옆 세로선,
   막대 끝 눈금선이 통째로 빠졌다(2026-11-26 인프라 대조). use_figma 로 9개 뿌리의 보이는 그라데이션 선을 모두 읽어
   (gradientTransform → 노드 크기 기준 CSS 각도 · 정지 위치로 환산) grad-strokes.json 에 저장했다.
   '$;<id>' = 인스턴스 안쪽 노드 — 그 화면에서 같은 꼬리 id 가 모두 같은 선이라 접미사 선택자로 묶었다.
   그리기: conv 가 만든 ::after 링(inset:-선두께)을 그라데이션 + 마스크 테두리로 바꾼다.
   thin(폭이나 높이 ≤ 선두께×2, 1px 구분선)은 테두리를 없애고 상자 자체를 그라데이션으로 채운다.
   실행: node mk-secmon-strokes.js → node conv.js */
'use strict';
const fs = require('fs'), path = require('path');
const G = __dirname;
const DATA = JSON.parse(fs.readFileSync(path.join(G, 'grad-strokes.json'), 'utf8'));
const MASK = '-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude;';
const P = path.join(G, 'screen-css.json');
const out = JSON.parse(fs.readFileSync(P, 'utf8'));
const TAG = '/*gs*/';
let n = 0;
for (const [rid, list] of Object.entries(DATA)) {
  const key = rid.replace(':', '-');
  const rules = [];
  for (const [sig, sels] of list) {
    const [bg, , sw, , thin] = sig.split('|');
    const w = parseFloat(sw) || 1;
    const one = (s) => (s.startsWith('$;') ? '[data-node-id$=";' + s.slice(2) + '"]' : '[data-node-id="' + s + '"]');
    const host = sels.map((s) => '.{{PX}}-root ' + one(s)).join(',');
    const aft = sels.map((s) => '.{{PX}}-root ' + one(s) + '::after').join(',');
    if (thin) {
      rules.push(TAG + host + '{border:0!important;background:' + bg + '!important;}');
      rules.push(TAG + aft + '{display:none!important;}');
    } else {
      rules.push(TAG + host + '{border-color:transparent!important;}');
      rules.push(TAG + aft + '{content:"";position:absolute;inset:0;border:0!important;padding:' + w + 'px;border-radius:inherit;pointer-events:none;background:' + bg + ';' + MASK + '}');
    }
    n += sels.length;
  }
  out[key] = (out[key] || []).filter((x) => x.indexOf(TAG) !== 0).concat(rules);
}
/* 굳은 그라데이션 채움 — design context 가 그라데이션 사각형을 1024×21 PNG 로 내보냈다(이벤트 표 행 바탕 1307:11659,
   1792×35.5 를 object-cover 로 늘려 위아래 노란 번짐이 흐리고 어긋났다). use_figma 로 읽은 정지색 그대로 CSS 로 칠한다.
   gradientTransform [[0,1,0],…] → u = y : 위(0) → 아래(1) = 180deg */
const FILLS = {
  '4038-2699': [['$;1307:11659', 'linear-gradient(180deg,rgba(252,207,30,0.3) 0%,rgba(252,207,30,0) 21%,rgba(252,207,30,0.024) 79.5%,rgba(252,207,30,0.3) 100%)']],
};
const FTAG = '/*gf*/';
for (const [key, list] of Object.entries(FILLS)) {
  const rules = [];
  for (const [s, bg] of list) {
    const sel = '.{{PX}}-root ' + (s.startsWith('$;') ? '[data-node-id$=";' + s.slice(2) + '"]' : '[data-node-id="' + s + '"]');
    rules.push(FTAG + sel + '{background:' + bg + ';}');
    rules.push(FTAG + sel + '>img,' + sel + '>div>img{display:none!important;}');
  }
  out[key] = (out[key] || []).filter((x) => x.indexOf(FTAG) !== 0).concat(rules);
}
fs.writeFileSync(P, JSON.stringify(out, null, 1));
console.log('gradient strokes', n);
