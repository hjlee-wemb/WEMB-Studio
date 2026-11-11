/* Playwright filename — 라이트 5화면을 통째로 찍고(lfull-<장면>.png) 글자 상자(lboxes-<장면>.json)를 serve.js 로 저장,
   팝업은 얹힌 자리만 따로(light-<key>.png). 뒤에: for p in main gas worksite alarm confirm; do node contrast.js lfull-$p.png lboxes-$p.json 4.5; done */
async (page) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/gasmon/_gen/';
  const P = { main: null, gas: null, worksite: ['3059-4943', 'gmw'], alarm: ['3059-5211', 'gma'], confirm: ['3050-2030', 'gmc'] };
  const res = {};
  for (const pg of Object.keys(P)) {
    await page.goto('http://localhost:5546/src/gasmon/' + pg + '.html?live=0&t=light&r=' + Date.now());
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => { const b = document.getElementById('tt'); if (b) b.style.display = 'none'; });
    await page.waitForTimeout(300);
    await page.screenshot({ path: GEN + 'lfull-' + pg + '.png' });
    if (P[pg]) {
      const b = await page.evaluate((p) => { const r = document.querySelector('.' + p + '-mount').getBoundingClientRect(); return { x: r.x, y: r.y, width: Math.round(r.width), height: Math.round(r.height) }; }, P[pg][1]);
      await page.screenshot({ path: GEN + 'light-' + P[pg][0] + '.png', clip: b });
    }
    const boxes = await page.evaluate((pg) => {
      const pop = pg !== 'main' && pg !== 'gas' ? document.querySelector('.sh-popmount') : null;
      return [...(pop || document).querySelectorAll('p')].filter((p) => p.textContent.trim() && p.offsetWidth).map((p) => {
        const r = p.getBoundingClientRect(), cs = getComputedStyle(p);
        if (cs.visibility === 'hidden' || +cs.opacity === 0) return null;
        const c = /rgba?\(([^)]+)\)/.exec(cs.color)[1].split(',').map(Number);
        if (c.length > 3 && c[3] < 0.05) return null;
        return { t: p.textContent.trim().slice(0, 24), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), c: c.slice(0, 3) };
      }).filter((b) => b && b.x >= 0 && b.y >= 0 && b.x + b.w <= 1920 && b.y + b.h <= 1080 && b.w > 2);
    }, pg);
    await page.evaluate(async ([f, d]) => { await fetch('/__save?f=' + f, { method: 'POST', body: d }); }, ['lboxes-' + pg + '.json', JSON.stringify(boxes)]);
    res[pg] = boxes.length;
  }
  return res;
}
