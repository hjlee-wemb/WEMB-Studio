/* 다크 대비 점검 2단계 — dk-cx-<장면>.png + .json → 글자색 대 둘레 바탕(상자 바깥 2px 띠의 중앙값) 대비비. 4.5:1(큰 글자 3:1) 미만만 찍는다.
   실행: node dk-contrast-an.js [장면…] */
const P = require('./png.js'), fs = require('fs');
const L = (r, g, b) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const CR = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
const scenes = process.argv.slice(2).length ? process.argv.slice(2) : ['main', 'diagram', 'event', 'solar', 'equipment', 'evx'];
let total = 0;
for (const sc of scenes) {
  const im = P.decode(fs.readFileSync('dk-cx-' + sc + '.png')); const items = JSON.parse(fs.readFileSync('dk-cx-' + sc + '.json', 'utf8'));
  const px = (x, y) => { x = Math.max(0, Math.min(im.w - 1, x | 0)); y = Math.max(0, Math.min(im.h - 1, y | 0)); const i = (y * im.w + x) * 4; return [im.data[i], im.data[i + 1], im.data[i + 2]]; };
  const bad = [];
  for (const it of items) {
    const m = /rgba?\(([^)]+)\)/.exec(it.col); if (!m) continue; const c = m[1].split(',').map(Number); const a = c.length > 3 ? c[3] : 1;
    const [x, y, w, h] = it.r; const ring = [];
    for (let i = -2; i <= w + 2; i += 2) { ring.push(px(x + i, y - 3), px(x + i, y + h + 2)); }
    for (let j = 0; j <= h; j += 2) { ring.push(px(x - 3, y + j), px(x + w + 2, y + j)); }
    const lum = ring.map((p) => L(...p)).sort((p, q) => p - q); const bgL = lum[lum.length >> 1];
    const bgp = ring.sort((p, q) => L(...p) - L(...q))[ring.length >> 1];
    const tc = [0, 1, 2].map((k) => c[k] * a + bgp[k] * (1 - a));
    const cr = CR(L(...tc), bgL); const big = it.fs >= 18 || (it.fs >= 14 && +it.fw >= 700);
    if (cr < (big ? 3 : 4.5)) bad.push({ cr: +cr.toFixed(2), t: it.t, col: it.col, bg: bgp.join(','), fs: it.fs, path: it.path.slice(-70) });
  }
  bad.sort((p, q) => p.cr - q.cr);
  total += bad.length;
  console.log('== ' + sc + ' 미달 ' + bad.length + ' / ' + items.length);
  bad.slice(0, 40).forEach((b) => console.log(String(b.cr).padStart(5), b.fs + 'px', JSON.stringify(b.t), b.col, 'bg', b.bg, '|', b.path));
}
console.log('합계 미달', total);
