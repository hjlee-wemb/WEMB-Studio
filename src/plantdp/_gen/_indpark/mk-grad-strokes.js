/* 그라데이션 선 되살리기 → screen-css.json
   design context 는 그라데이션 선(stroke)을 첫 정지색 단색으로 뭉갠다 — '알람 · 정상' 칩 테두리가 흐린 선이 아니라 밝은 흰 선으로 나왔다(2026-11-13).
   use_figma 로 9화면의 보이는 그라데이션 선을 모두 읽었다(노드 · 정지색 · gradientTransform). 모양은 세 가지뿐이다:
     CHIP  흰 100%→0%, 불투명도 30%, u = 1.103x − 0.103 → 가로(왼쪽 9.3% 에서 시작해 오른쪽 끝에서 사라짐)
     FIELD rgb(138,240,255) 100% → rgb(40,227,255) 0%, u = 2.304y − 0.957 → 세로(위 41.5% ~ 84.9%)
     NAV   흰 100%→0%, u = y → 세로(위 → 아래)
   선은 모두 1px · INSIDE. 같은 자리의 ::after 링(conv.js)을 그라데이션 + 마스크 테두리로 바꾼다(LS Electric 과 같은 방법).
   타원 'Bullet'(6px)은 svg 그림이라 이미 맞다. 실행: node mk-grad-strokes.js → node conv.js */
'use strict';
const fs = require('fs'), path = require('path');

const KIND = {
  CHIP: { dark: 'linear-gradient(90deg,rgba(255,255,255,0.3) 9.33%,rgba(255,255,255,0) 100%)', light: 'linear-gradient(90deg,rgba(40,70,110,0.34) 9.33%,rgba(40,70,110,0.04) 100%)' },
  FIELD: { dark: 'linear-gradient(180deg,rgba(138,240,255,1) 41.54%,rgba(40,227,255,0) 84.95%)', light: 'linear-gradient(180deg,rgba(42,143,214,1) 41.54%,rgba(42,143,214,0.18) 84.95%)' },
  NAV: { dark: 'linear-gradient(180deg,rgba(255,255,255,1) 0%,rgba(255,255,255,0) 100%)', light: 'linear-gradient(180deg,rgba(40,70,110,0.32) 0%,rgba(40,70,110,0.06) 100%)' },
};
/* 설비 검색칸(작은 검색칸) — 화면 인스턴스 id(2267:4849 …) 대신 design context 가 마스터 id 2267:4848 로 냈다 */
/* 하단 이벤트 로그의 건수 칩 5벌(인스턴스 안쪽 358:2281 … 358:2307) — 화면마다 인스턴스 id 만 다르다 */
const COUNTS = ['358:2281', '358:2282', '358:2288', '358:2289', '358:2294', '358:2295', '358:2300', '358:2301', '358:2306', '358:2307'];
const S = {
  '2208-2033': { elog: 'I2208:2038', CHIP: [], FIELD: ['2267:4848', '2208:2114'], NAV: ['I2208:2115;361:9336'] },
  '2208-2117': { elog: 'I2208:2122', CHIP: [], FIELD: ['2267:4848', '2208:2198'], NAV: ['I2208:2199;361:9336'] },
  '2208-2220': { elog: 'I2208:2226', CHIP: [], FIELD: ['2267:4848', '2208:2302'], NAV: ['I2208:2303;361:9336'] },
  '2208-2306': { elog: 'I2208:2315', CHIP: [], FIELD: ['2267:4848', '2208:2391'], NAV: ['I2208:2311;361:9336'] },
  '2208-2393': { elog: 'I2208:2398', CHIP: ['2208:2612', '2208:2613', '2208:2619', '2208:2620', '2208:2626', '2208:2627', '2208:2632', '2208:2633', '2208:2638', '2208:2639', '2208:2663'], FIELD: ['2267:4848', '2208:2474'], NAV: ['I2208:2475;361:9336'] },
  '2208-2792': { elog: 'I2208:2797', CHIP: ['2208:3010', '2208:3011', '2208:3017', '2208:3018', '2208:3024', '2208:3025', '2208:3030', '2208:3031', '2208:3036', '2208:3037', '2208:3061'], FIELD: ['2267:4848', '2208:2872'], NAV: ['I2208:2873;361:9336'] },
  '2208-3187': { CHIP: ['2208:3212', '2208:3219', '2208:3226', '2208:3233', '2208:3240'], FIELD: ['2208:3249', '2208:3254'], NAV: ['I2208:3550;361:9336'] },
  '2208-3552': { CHIP: ['2208:3577', '2208:3584', '2208:3591', '2208:3598', '2208:3605'], FIELD: ['2208:3614', '2208:3617', '2208:3623', '2208:3628'], NAV: ['I2208:3924;361:9336'] },
  '2208-3926': { CHIP: ['2208:3935', '2208:3939'], FIELD: ['2208:4017'], NAV: ['I2208:4065;361:9336'] },
};
const MASK = '-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude;';
const P = path.join(__dirname, 'screen-css.json');
const out = JSON.parse(fs.readFileSync(P, 'utf8'));
let n = 0;
for (const [key, s] of Object.entries(S)) {
  const dark = [], light = [];
  const ids = { CHIP: s.CHIP.concat(s.elog ? COUNTS.map((c) => s.elog + ';' + c) : []), FIELD: s.FIELD, NAV: s.NAV };
  for (const [k, list] of Object.entries(ids)) {
    if (!list.length) continue;
    const sel = (suf) => list.map((id) => '.{{PX}}-root' + suf + ' [data-node-id="' + id + '"]::after').join(',');
    dark.push('/* 그라데이션 선 ' + k + ' (' + list.length + ') — mk-grad-strokes.js */');
    dark.push(sel('') + '{content:"";position:absolute;inset:0;border:0!important;padding:1px;border-radius:inherit;pointer-events:none;background:' + KIND[k].dark + ';' + MASK + '}');
    light.push(sel('[data-theme="light"]') + '{background:' + KIND[k].light + ';}');
    n += list.length;
  }
  /* 손으로 넣은 다른 규칙이 있으면 두고, 이 스크립트가 만든 줄만 바꾼다 */
  const keep = (a) => (a || []).filter((x) => !/mk-grad-strokes|-webkit-mask-composite:xor;mask:linear-gradient\(#000 0 0\) content-box/.test(x) && !/^\.\{\{PX\}\}-root\[data-theme="light"\] \[data-node-id=[^{]*::after[^{]*\{background:linear-gradient/.test(x));
  out[key] = keep(out[key]).concat(dark);
  out[key + ':light'] = keep(out[key + ':light']).concat(light);
}
fs.writeFileSync(P, JSON.stringify(out, null, 1));
console.log('gradient strokes', n);
