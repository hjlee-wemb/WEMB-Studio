/* 라이브러리 점검 — 스튜디오에서 '펼치기' 후 탭마다 이 시안 것만 남겨 다크 · 라이트로 찍고, 깨진 그림 · 빈 칸을 잰다. 패널 · 심볼 하나씩 화면으로 끌어 넣는다. Playwright filename */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/newbiz-assets/_gen/';
  const ctx = await page.context().browser().newContext({ viewport: { width: 1920, height: 1500 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await p.goto('http://localhost:5543/index.html#/templates/dashboard-new-business-management');
  await p.waitForTimeout(1200);
  await p.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((x) => /스튜디오 열기/.test(x.textContent)); if (b) b.click(); });
  await p.waitForSelector('#dtStage .nbw-root', { timeout: 15000 });
  await p.waitForTimeout(2000);
  await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === '펼치기'); if (b) b.click(); });
  await p.waitForTimeout(600);
  const out = { tabs: await p.evaluate(() => [...document.querySelectorAll('#libTabs button, #libTabs [role=tab]')].map((b) => b.textContent.trim())) };
  const only = () => p.evaluate(() => {
    const g = document.getElementById('libGrid');
    const mine = (c) => c.querySelector('.hj-asset[class*="nb"]') && /(^|\s)nb[a-z]-root/.test(c.querySelector('.hj-asset').className) || (c.querySelector('img') && /src\/newbiz\//.test(c.querySelector('img').getAttribute('src') || ''));
    const items = [...g.children];
    let n = 0, empty = [], broken = 0;
    items.forEach((c) => {
      if (mine(c)) {
        n++;
        c.style.display = '';
        c.querySelectorAll('img').forEach((i) => { if (i.complete && !i.naturalWidth) broken++; });
        const a = c.querySelector('.hj-asset');
        if (a) { const q = a.firstElementChild && (a.firstElementChild.classList.contains('hj-ofs') ? a.firstElementChild : a.firstElementChild); const r = a.getBoundingClientRect(); if (!r.width || !r.height || !a.textContent.trim() && !a.querySelector('img')) empty.push(c.textContent.trim().slice(0, 20)); }
      } else c.style.display = 'none';
    });
    const r = g.getBoundingClientRect();
    return { n, broken, empty, x: r.left, y: r.top, w: r.width, h: r.height };
  });
  const tab = (n) => p.evaluate((n) => { [...document.querySelectorAll('#libTabs button, #libTabs [role=tab]')].find((x) => x.textContent.trim() === n).click(); }, n);
  for (const theme of ['dark', 'light']) {
    await p.evaluate((t) => document.querySelector('#mode button[data-m="' + t + '"]').click(), theme);
    await p.waitForTimeout(1500);
    out[theme] = {};
    for (const [n, f] of [['패널', 'panels'], ['심볼', 'symbols'], ['아이콘', 'icons']]) {
      await tab(n); await p.waitForTimeout(3500);
      await only(); await p.waitForTimeout(800);
      const r = await only();
      out[theme][n] = { n: r.n, broken: r.broken, empty: r.empty };
      await p.evaluate(() => document.getElementById('libGrid').scrollIntoView());
      const r2 = await only();
      await p.screenshot({ path: GEN + 'lib-' + theme + '-' + f + '.png', fullPage: false, clip: { x: r2.x, y: Math.max(0, r2.y), width: r2.w, height: Math.min(r2.h, 1500 - Math.max(0, r2.y)) } });
    }
  }
  out.errs = errs;
  await ctx.close();
  return out;
}
