/* 라이트에서 어둡게 남은 그림 찾기 — 모든 장면을 라이트로 열고, 각 <img>/<svg> 자리의 렌더 평균 밝기가 낮고 큰 것을 모은다 */
async (page, args) => {
  const PNG = require('./png.js');
  await page.setViewportSize({ width: 1920, height: 1080 });
  const res = {};
  for (const pg of args) {
    await page.goto('http://localhost:5620/src/secmon/' + pg + '.html?live=0&t=light&r=' + Date.now());
    await page.waitForTimeout(800);
    const buf = await page.screenshot();
    const I = PNG.decode(buf);
    const imgs = await page.evaluate(() => Array.from(document.querySelectorAll('img')).map((i) => { const r = i.getBoundingClientRect(); return { src: (i.getAttribute('src') || '').split('/').pop(), x: r.left, y: r.top, w: r.width, h: r.height, nm: (i.closest('[data-name]') || {}).getAttribute ? i.closest('[data-name]').getAttribute('data-name') : '' }; }));
    for (const im of imgs) {
      if (im.w * im.h < 600 || im.w < 4) continue;
      let s = 0, n = 0;
      for (let y = Math.max(0, im.y | 0); y < Math.min(1080, im.y + im.h); y += 3) for (let x = Math.max(0, im.x | 0); x < Math.min(1920, im.x + im.w); x += 3) { const i = (y * I.w + x) * 4; s += I.data[i] * .3 + I.data[i + 1] * .59 + I.data[i + 2] * .11; n++; }
      const L = n ? s / n : 255;
      if (L < (+process.env.LMAX || 110)) { const k = im.src; if (!res[k] || res[k].area < im.w * im.h) res[k] = { pg, nm: im.nm, L: Math.round(L), area: Math.round(im.w * im.h), at: [im.x | 0, im.y | 0, im.w | 0, im.h | 0] }; }
    }
  }
  return res;
}
