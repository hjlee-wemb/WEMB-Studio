/* 라이브러리 카드 확대 — 이 시안 카드를 하나씩 3배로 찍어 한 장으로 붙인다(자홍 = 투명 바탕 확인). node src/bems/_gen/pw.js ../../datacenter-assets/_gen/lib-cards.js <탭> [dark|light] */
async (page, args) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/bems-assets/_gen/';
  const [TAB, THEME] = [args[0] || '심볼', args[1] || 'dark'];
  const ctx = await page.context().browser().newContext({ viewport: { width: 1600, height: 1400 }, deviceScaleFactor: 3 });
  const p = await ctx.newPage();
  await p.goto('http://localhost:5610/index.html#/templates/digital-twin-smart-building-energy-management');
  await p.waitForTimeout(1200);
  await p.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((x) => /스튜디오 열기/.test(x.textContent)); if (b) b.click(); });
  await p.waitForSelector('#dtStage .bem-root', { timeout: 15000 });
  await p.waitForTimeout(1500);
  await p.evaluate((t) => document.querySelector('#mode button[data-m="' + t + '"]').click(), THEME);
  await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === '펼치기'); if (b) b.click(); });
  await p.waitForTimeout(600);
  await p.evaluate(() => { const s = document.createElement('style'); s.textContent = '.libitem{background:#ff00d4!important}'; document.head.appendChild(s); });
  await p.evaluate((n) => { const t = [...document.querySelectorAll('#libTabs button, #libTabs [role=tab]')].find((x) => x.textContent.trim() === n); if (t) t.click(); }, TAB);
  await p.waitForTimeout(4000);
  const n = await p.evaluate(() => {
    const g = document.getElementById('libGrid');
    let n = 0;
    [...g.children].forEach((c) => { const a = c.querySelector('.hj-asset'), i = c.querySelector('img'); const mine = a ? /(^|\s)be[mf]-root/.test(a.className) : !!(i && /src\/bems\//.test(i.dataset.osrc || i.getAttribute('src') || '')); c.style.display = mine ? '' : 'none'; if (mine) n++; });
    return n;
  });
  await p.waitForTimeout(2500);
  const fsx = require('fs'); const dir = GEN + 'cards/'; if (!fsx.existsSync(dir)) fsx.mkdirSync(dir);
  const cards = await p.$$('#libGrid > *');
  const names = [];
  let k = 0;
  for (const c of cards) {
    /* 탭을 바꾸면 격자를 다시 그려 숨김 표시가 풀린다 — 카드마다 이 시안 것인지 직접 본다 */
    const mine = await c.evaluate((e) => { const a = e.querySelector('.hj-asset'), i = e.querySelector('img'); return a ? /(^|\s)be[mf]-root/.test(a.className) : !!(i && /src\/bems\//.test(i.dataset.osrc || i.getAttribute('src') || '')); });
    if (!mine) continue;
    await c.scrollIntoViewIfNeeded();
    const nm = await c.evaluate((e) => (e.querySelector('.lname') || e).textContent.trim());
    k++;
    await c.screenshot({ path: dir + THEME + '-' + TAB + '-' + String(k).padStart(2, '0') + '.png', animations: 'disabled', timeout: 60000 });
    names.push(k + ' ' + nm);
  }
  await ctx.close();
  return { n, names };
}
