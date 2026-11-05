/* 풍향·풍속계(라이트) — 사용자 지시 "그림자 빼고 아이콘 윗부분은 하얀색". 컵 · 기둥 = 흰색, 금속 받침 = 지금 톤. 한 번만. */
'use strict';
const fs = require('fs');
const rep = (s, a, b) => { if (!s.includes(a)) throw new Error('없음 ' + a); return s.replace(a, b); };
let m = fs.readFileSync('mk-light-newbiz.js', 'utf8');
const a = m.indexOf('/* ── ② 풍향·풍속계 ──'), b = m.indexOf('/* ── ③ 벡터 색 ── */');
if (a < 0 || b < 0) throw new Error('자리 없음');
m = m.slice(0, a) + `/* ── ② 풍향·풍속계 ──
   윗부분(컵 · 기둥) = 흰색. 형태가 남도록 음영은 아주 옅게만(사용자 지시 2026-11-05).
   받침(금속) = 어두운 쪽을 끌어올린 밝은 은청색. 경계는 원본에서 잰 줄(BASE_Y), 40px 에 걸쳐 잇는다 */
const VAR = {};
for (const f of ['turbine-image.png']) {
  const I = PNG.decode(fs.readFileSync(path.join(ART, f))), D = I.data;
  const TINT = [0.9, 0.965, 1.03];
  const BASE_Y = 3010, FEATHER = 40;
  for (let y = 0; y < I.h; y++) {
    const w = Math.max(0, Math.min(1, (y - BASE_Y + FEATHER / 2) / FEATHER));   /* 0 = 윗부분, 1 = 받침 */
    for (let x = 0; x < I.w; x++) {
      const i = (y * I.w + x) * 4;
      if (!D[i + 3]) continue;
      const L = (D[i] * 0.3 + D[i + 1] * 0.59 + D[i + 2] * 0.11) / 255;
      const t = Math.max(0, Math.min(1, (L - 0.55) / 0.35));
      const up = 0.8 + 0.2 * Math.pow(t, 0.9);
      for (let k = 0; k < 3; k++) {
        const v = D[i + k] / 255;
        const lo = (0.56 + 0.44 * Math.pow(v, 1.1)) * TINT[k];
        D[i + k] = Math.min(255, Math.round(255 * (up * (1 - w) + lo * w)));
      }
    }
  }
  const lt = f.replace('.png', '-lt.png');
  fs.writeFileSync(path.join(ART, lt), PNG.encode(I.w, I.h, D));
  VAR[f] = lt;
}

` + m.slice(b);
fs.writeFileSync('mk-light-newbiz.js', m);
let s = fs.readFileSync('mk-screen-css.js', 'utf8');
s = rep(s, `L('[data-name="Anemometer Image"] img{filter:drop-shadow(0 0 .6px rgba(30,90,140,.55)) drop-shadow(0 1px 2px rgba(30,90,140,.28));}'),\n`, '');
s = rep(s, `L('[data-name="Column/Labels"] [data-name="Visual"] img{filter:brightness(.95) drop-shadow(0 0 .6px rgba(30,90,140,.5));}'),`, `L('[data-name="Column/Labels"] [data-name="Visual"] img{filter:brightness(.95);}'),`);
fs.writeFileSync('mk-screen-css.js', s);
let r = fs.readFileSync('README.md', 'utf8');
r = r.trimEnd() + '\n\n사용자 지시로 풍향·풍속계 라이트는 그림자를 뺐고 윗부분(컵 · 기둥)을 흰색으로 바꿨다(받침은 은청색, 경계 BASE_Y 3010). 흰 판 위에서는 윤곽이 옅다. 선택 표시 빛은 유지했다.\n';
fs.writeFileSync('README.md', r);
console.log('ok');
