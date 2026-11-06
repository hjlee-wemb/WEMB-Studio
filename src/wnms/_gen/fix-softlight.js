/* 계통도 장비 그림의 '안쪽 그림자' 를 브라우저에서도 Figma 처럼 은은하게 — dl.js 다음에 돌린다(여러 번 돌려도 같다).

   왜 — Figma 는 장비 면(Gradient)의 안쪽 그림자를 검은색 + soft-light 로 내보낸다:
     <feColorMatrix values="0 … 0 0 0 0 A 0"/> <feBlend mode="soft-light" in2="shape"/>
   Figma 는 이 합성을 그 아래 그려진 장비 면(밝은 하늘색)과 하므로 옆면이 살짝 깊어질 뿐인데,
   SVG 필터의 in2="shape" 는 반투명 그라데이션 한 겹뿐이라 검은 그림자가 거의 그대로 남아 옆면에 검은 띠가 생겼다
   (백본스위치 · 방화벽 · IPS · 자료연계 — 사용자 지적 "그림자가 어둡게 나온다").
   soft-light 는 밝은 면을 '같은 색상으로 조금 깊게' 만든다(검정을 덮는 것처럼 회색이 되지 않는다).
   그래서 같은 그림자(모양 · 위치 · 흐림 그대로)를 장비 면의 짙은 남색(#0A2FA8 계열)으로, 불투명도 A × 0.16 의 보통 합성으로 바꾼다.
   실행: node fix-softlight.js */
'use strict';
const fs = require('fs'), path = require('path');
const ART = path.join(__dirname, '..');
const MARK = '<!-- wnms:softlight3 -->', OLD = /<!-- wnms:softlight2? -->/;
const K = 0.16;
/* 그림자 색 = 그 장비의 주조색(가장 채도 높은 색)을 짙게 — 빨강 · 노랑 · 주황 장비가 회색으로 탁해지지 않게 */
function tintOf(s) {
  let best = null, bs = -1;
  for (const m of s.match(/#[0-9A-Fa-f]{6}/g) || []) {
    const n = parseInt(m.slice(1), 16), r = (n >> 16) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = mx - mn;
    if (sat > bs) { bs = sat; best = [r, g, b]; }
  }
  if (!best) return [0.04, 0.18, 0.66];
  const mx = Math.max.apply(null, best);
  return best.map((v) => +(v / mx * 0.62).toFixed(3));
}
/* 원본(soft-light) · 첫 고침(normal, A×0.25) 둘 다 잡는다 */
const RE = /<feColorMatrix type="matrix" values="0 0 0 0 ([\d.]+) 0 0 0 0 ([\d.]+) 0 0 0 0 ([\d.]+) 0 0 0 ([\d.]+) 0"\/>(\s*)<feBlend mode="(soft-light|normal)" in2="shape"/g;
let n = 0, files = 0;
for (const f of fs.readdirSync(ART).filter((x) => /\.svg$/.test(x))) {
  const p = path.join(ART, f);
  let s = fs.readFileSync(p, 'utf8');
  if (s.indexOf(MARK) >= 0) continue;
  const was = OLD.test(s);
  const TINT = tintOf(s);
  if (!was && s.indexOf('mode="soft-light"') < 0) continue;
  let k = 0;
  s = s.replace(RE, (m, r, g, b, a, sp, mode) => {
    if (mode === 'normal' && !was) return m;
    k++;
    const a0 = mode === 'normal' ? (+a > 0.13 && +a < 0.17 || +a > 0.1 && +a < 0.12 ? +a / K : +a / 0.25) : +a;
    return '<feColorMatrix type="matrix" values="0 0 0 0 ' + TINT[0] + ' 0 0 0 0 ' + TINT[1] + ' 0 0 0 0 ' + TINT[2] + ' 0 0 0 ' + (a0 * K).toFixed(3) + ' 0"/>' + sp + '<feBlend mode="normal" in2="shape"';
  });
  if (!k) continue;
  s = s.replace(new RegExp(OLD.source, 'g'), '').replace(/^(<svg[^>]*>)/, '$1' + MARK);
  fs.writeFileSync(p, s);
  n += k; files++;
  console.log(f, k);
}
console.log('고친 그림자', n, '· 파일', files);
