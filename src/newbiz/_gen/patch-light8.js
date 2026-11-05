/* 풍향·풍속계 — 단색 재칠을 걷고 원본 음영을 살린다. 레이어 이름도 Turbine Image → Anemometer Image. 한 번만. */
'use strict';
const fs = require('fs');
const rep = (s, a, b) => { if (!s.includes(a)) throw new Error('없음 ' + a); return s.replace(a, b); };
let m = fs.readFileSync('mk-light-newbiz.js', 'utf8');
const a = m.indexOf('/* ── ② 터빈 ── */'), b = m.indexOf('/* ── ③ 벡터 색 ── */');
if (a < 0 || b < 0) throw new Error('자리 없음');
m = m.slice(0, a) + `/* ── ② 풍향·풍속계 ──
   금속 받침 · 흰 컵의 음영이 곧 재질이다. 색을 새로 칠하지 않고, 흰 판에 묻히는 밝은 쪽만 곡선으로 눌러 형태가 보이게 한다.
   어두운 금속은 그대로, 흰 컵은 옅은 은회색(최대 #d3dce4 쯤) + 살짝 차가운 기운 */
const VAR = {};
for (const f of ['turbine-image.png']) {
  const I = PNG.decode(fs.readFileSync(path.join(ART, f))), D = I.data;
  const TINT = [0.945, 0.975, 1.0];
  for (let i = 0; i < D.length; i += 4) {
    for (let k = 0; k < 3; k++) {
      const v = D[i + k] / 255;
      D[i + k] = Math.round(255 * Math.pow(v, 1.5) * 0.9 * TINT[k]);
    }
  }
  const lt = f.replace('.png', '-lt.png');
  fs.writeFileSync(path.join(ART, lt), PNG.encode(I.w, I.h, D));
  VAR[f] = lt;
}

` + m.slice(b);
m = m.replace('② turbine-image*-lt.png : 흰 날개가 흰 판에 묻혀 밝기를 청회색 범위로', '② turbine-image-lt.png : 풍향·풍속계. 원본 음영 그대로, 흰 컵이 흰 판에 묻히지 않게 밝은 쪽만 누른다');
fs.writeFileSync('mk-light-newbiz.js', m);

/* 이름 */
const NEW = 'Anemometer Image';
for (const f of fs.readdirSync('.').filter((x) => /^dc-1-\d+\.txt$/.test(x))) {
  const d = fs.readFileSync(f, 'utf8');
  fs.writeFileSync(f, d.split('data-name="Turbine Image"').join('data-name="' + NEW + '"'));
}
let s = fs.readFileSync('mk-screen-css.js', 'utf8');
s = s.split('Turbine Image').join(NEW);
/* 라이트 — 윤곽이 살도록 아주 옅은 그림자 */
s = rep(s, `L('[data-name="Character Image"] img{`, `L('[data-name="${NEW}"] img{filter:drop-shadow(0 1px 1.5px rgba(24,50,80,.28));}'),
  L('[data-name="Character Image"] img{`);
fs.writeFileSync('mk-screen-css.js', s);
let l = fs.readFileSync('live-src.js', 'utf8');
fs.writeFileSync('live-src.js', l.split('Turbine Image').join(NEW));
let r = fs.readFileSync('README.md', 'utf8');
r = r.trimEnd() + '\n\n## 풍향·풍속계 그림(2026-11-05 사용자 지적 "풍향 아이콘이 이상해")\n\n`turbine-image.png` 는 터빈이 아니라 금속 받침 + 흰 컵의 풍향·풍속계다. 레이어 이름을 `Anemometer Image` 로 고쳤다(파일 이름은 그대로). 라이트 사본은 단색 재칠을 걷고 원본 음영에 곡선만 적용한다(mk-light-newbiz.js ②). 그림을 다시 칠하기 전에 크게 띄워 재질부터 볼 것.\n';
fs.writeFileSync('README.md', r);
console.log('ok');
