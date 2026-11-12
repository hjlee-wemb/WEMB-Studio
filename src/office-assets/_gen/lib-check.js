/* 라이브러리 점검 — 스튜디오에서 '펼치기' 후 탭마다 이 시안 것만 남겨 다크 · 라이트로 찍고, 깨진 그림 · 빈 칸 · 불투명 바탕을 잰다. Playwright filename
   카드 바탕을 자홍으로 칠해 찍는다 — 투명이 아닌 곳이 눈에 바로 보인다. 검증 서버: node src/office/_gen/serve.js 5546 */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/office-assets/_gen/';
  const BG = '#ff00d4';
  const ctx = await page.context().browser().newContext({ viewport: { width: 1920, height: 3000 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await p.goto('http://localhost:5546/index.html#/templates/dashboard-smart-office');
  await p.waitForTimeout(1200);
  await p.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((x) => /스튜디오 열기/.test(x.textContent)); if (b) b.click(); });
  await p.waitForSelector('#dtStage .ofha-root', { timeout: 15000 });
  await p.waitForTimeout(2000);
  await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === '펼치기'); if (b) b.click(); });
  await p.waitForTimeout(600);
  await p.evaluate((c) => { const s = document.createElement('style'); s.id = 'lib-check-bg'; s.textContent = '.libitem{background:' + c + '!important}'; document.head.appendChild(s); }, BG);
  const out = { tabs: await p.evaluate(() => [...document.querySelectorAll('#libTabs button, #libTabs [role=tab]')].map((b) => b.textContent.trim())) };
  const only = () => p.evaluate(() => {
    const g = document.getElementById('libGrid');
    const mine = (c) => { const a = c.querySelector('.hj-asset'); if (a) return /(^|\s)of[a-z]{2}-root/.test(a.className); const i = c.querySelector('img'); return !!(i && /src\/office\//.test(i.dataset.osrc || i.getAttribute('src') || '')); };
    const alpha = (v) => { const m = /rgba?\(([^)]+)\)/.exec(v); if (!m) return 0; const a = m[1].split(',').map(parseFloat); return a[3] === undefined ? 1 : a[3]; };
    let n = 0, empty = [], broken = 0, opaque = [];
    [...g.children].forEach((c) => {
      if (mine(c)) {
        n++;
        c.style.display = '';
        c.querySelectorAll('img').forEach((i) => { if (i.complete && !i.naturalWidth) broken++; });
        const a = c.querySelector('.hj-asset');
        if (a) {
          const r = a.getBoundingClientRect();
          if (!r.width || !r.height || (!a.textContent.trim() && !a.querySelector('img,svg'))) empty.push(c.textContent.trim().slice(0, 20));
          [a, a.firstElementChild].forEach((e) => { if (e && alpha(getComputedStyle(e).backgroundColor) > 0.5 && e === a) opaque.push(c.querySelector('.lname').textContent + ' ' + getComputedStyle(e).backgroundColor + ' root'); });
        }
      } else c.style.display = 'none';
    });
    const r = g.getBoundingClientRect();
    return { n, broken, empty, opaque, x: r.left, y: r.top, w: r.width, h: r.height };
  });
  const tab = (n) => p.evaluate((n) => { const t = [...document.querySelectorAll('#libTabs button, #libTabs [role=tab]')].find((x) => x.textContent.trim() === n); if (t) t.click(); return !!t; }, n);
  for (const theme of ['dark', 'light']) {
    await p.evaluate((t) => document.querySelector('#mode button[data-m="' + t + '"]').click(), theme);
    await p.waitForTimeout(1500);
    out[theme] = {};
    for (const [n, f] of [['차트', 'charts'], ['패널', 'panels'], ['심볼', 'symbols'], ['아이콘', 'icons']]) {
      if (!(await tab(n))) { out[theme][n] = 'no tab'; continue; }
      await p.waitForTimeout(4500);
      await only(); await p.waitForTimeout(1200);
      const r = await only();
      out[theme][n] = { n: r.n, broken: r.broken, empty: r.empty, opaque: r.opaque };
      await p.evaluate(() => document.getElementById('libGrid').scrollIntoView());
      const r2 = await only();
      await p.screenshot({ path: GEN + 'lib-' + theme + '-' + f + '.png', clip: { x: r2.x, y: Math.max(0, r2.y), width: r2.w, height: Math.min(r2.h, 3000 - Math.max(0, r2.y)) } });
    }
  }
  out.errs = errs;
  await ctx.close();
  return out;
}
