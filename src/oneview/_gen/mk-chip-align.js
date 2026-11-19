/* 팝업 '이벤트 현황' 등급 칩 줄 맞춤 → screen-css.json
   Figma 원본에서 CR 칩만 바르고(구슬 · 글자 · 오른쪽 끝 숫자 동그라미), MA · MI · WA · NO 는 숫자 동그라미(Value Box)가
   글자 위로 밀려 들어가 겹쳐 있었다(2026-11-13 사용자: 뒤죽박죽 → 라인 맞게). 하단 이벤트 로그 칩은 원본도 바르다.
   CR 을 기준으로 칩 배경(Background, 80px) 시작점에서 글자 +19.24px · 숫자 동그라미 +48px(배경 오른쪽 끝에 붙음),
   숫자는 동그라미(32px) 가운데. MI 는 안쪽에 Box 묶음이 하나 더 있어 Box 기준으로 같은 값.
   실행: node mk-chip-align.js → node conv.js */
'use strict';
const fs = require('fs'), path = require('path');
/* [배경 시작 margin-left(칩 기준), Value Box, Value, Label] — 진동(50-5951) · 온도(63-3639) */
const CHIPS = {
  '50-5951': [[14.29, '2208:2613', '2208:2614', '2208:2615'], [15.78, '2208:2620', '2208:2621', '2208:2622'], [0, '2208:2627', '2208:2628', '2208:2629'],
    [18.77, '2208:2633', '2208:2634', '2208:2635'], [19.47, '2208:2639', '2208:2640', '2208:2641']],
  '63-3639': [[14.29, '2208:3011', '2208:3012', '2208:3013'], [15.78, '2208:3018', '2208:3019', '2208:3020'], [0, '2208:3025', '2208:3026', '2208:3027'],
    [18.77, '2208:3031', '2208:3032', '2208:3033'], [19.47, '2208:3037', '2208:3038', '2208:3039']],
};
const TAG = '/* 등급 칩 줄 맞춤 — mk-chip-align.js */';
const P = path.join(__dirname, 'screen-css.json');
const out = JSON.parse(fs.readFileSync(P, 'utf8'));
const r2 = (v) => Math.round(v * 100) / 100;
let n = 0;
for (const [key, list] of Object.entries(CHIPS)) {
  const rules = [TAG];
  for (const [b, vb, val, lab] of list) {
    const S = (id) => '.{{PX}}-root [data-node-id="' + id + '"]';
    rules.push(S(vb) + '{margin-left:' + r2(b + 48) + 'px!important;}');
    rules.push(S(val) + '{margin-left:' + r2(b + 48) + 'px!important;width:32px!important;text-align:center!important;}');
    rules.push(S(lab) + '{margin-left:' + r2(b + 19.24) + 'px!important;}');
    n++;
  }
  /* 이 스크립트가 만든 줄만 바꾼다 */
  const prev = out[key] || [];
  const i = prev.indexOf(TAG);
  const keep = i < 0 ? prev : prev.slice(0, i).concat(prev.slice(i + 1).filter((x) => !/^\.\{\{PX\}\}-root \[data-node-id="[^"]+"\]\{margin-left:[\d.]+px!important;/.test(x)));
  out[key] = keep.concat(rules);
}
fs.writeFileSync(P, JSON.stringify(out, null, 1));
console.log('chips aligned', n);
