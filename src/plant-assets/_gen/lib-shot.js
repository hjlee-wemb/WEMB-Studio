/* 라이브러리 썸네일 확대 사진 — 탭이 늦게 그려지므로 충분히 기다린 뒤, 이 시안 것만 남겨 2배로 찍는다. Playwright filename */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/plant-assets/_gen/';
  const ctx = await page.context().browser().newContext({ viewport: { width: 1920, height: 1600 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await p.goto('http://localhost:5541/index.html#/templates/digital-twin-plant-power-facility');
  await p.waitForTimeout(1200);
  await p.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((x) => /이 구성으로 스튜디오 열기/.test(x.textContent)); if (b) b.click(); });
  await p.waitForSelector('#dtStage .pfo-root', { timeout: 15000 });
  await p.waitForTimeout(2000);
  await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === '펼치기'); if (b) b.click(); });
  await p.waitForTimeout(600);
  const only = () => p.evaluate(() => { const g = document.getElementById('libGrid'); const keep = (c) => c.querySelector('.pfo-root') || (c.querySelector('img') && /src\/plant\//.test(c.querySelector('img').getAttribute('src') || '')); [...g.children].forEach((c) => { c.style.display = keep(c) ? '' : 'none'; }); g.style.maxHeight = 'none'; g.style.overflow = 'visible'; const r = g.getBoundingClientRect(); return { n: [...g.children].filter((c) => c.style.display !== 'none').length, x: r.left, y: r.top, w: r.width, h: r.height }; });
  const tab = (n) => p.evaluate((n) => { const b = [...document.querySelectorAll('#libTabs button, #libTabs [role=tab]')].find((x) => x.textContent.trim() === n); b.click(); }, n);
  const out = {};
  for (const [n, f] of [['심볼', 'lib-symbols'], ['패널', 'lib-panels'], ['아이콘', 'lib-icons']]) {
    await tab(n); await p.waitForTimeout(3000);
    const r = await only(); await p.waitForTimeout(500);
    const r2 = await only();
    out[n] = r2.n;
    await p.screenshot({ path: GEN + f + '.png', clip: { x: r2.x, y: r2.y, width: r2.w, height: Math.min(r2.h, 620) } });
  }
  out.errs = errs;
  await ctx.close();
  return out;
}
