/* 끌어다 넣기 점검 — 패널 · 심볼 · 아이콘을 라이브러리에서 화면으로 끌어 넣고, 넣은 사본의 크기 · 글자 · 편집을 잰다. Playwright filename */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/newbiz-assets/_gen/';
  const ctx = await page.context().browser().newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await p.goto('http://localhost:5543/index.html#/templates/dashboard-new-business-management');
  await p.waitForTimeout(1500);
  await p.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((x) => /스튜디오 열기/.test(x.textContent)); if (b) b.click(); });
  await p.waitForSelector('#dtStage .nbw-root', { timeout: 20000 });
  await p.waitForTimeout(5000);
  await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === '펼치기'); if (b) b.click(); });
  await p.waitForTimeout(600);
  const out = {};
  const drop = async (tabName, itemName, x, y) => {
    await p.evaluate((n) => { [...document.querySelectorAll('#libTabs button, #libTabs [role=tab]')].find((b) => b.textContent.trim() === n).click(); }, tabName);
    await p.waitForTimeout(5000);
    const item = p.locator('#libGrid .libitem', { hasText: itemName }).first();
    await item.scrollIntoViewIfNeeded();
    await item.dragTo(p.locator('#dtStage'), { targetPosition: { x, y }, force: true });
    await p.waitForTimeout(1000);
  };
  await drop('패널', '2040 목표 패널', 700, 300);
  await drop('심볼', '풍향계 말풍선 (주황)', 300, 200);
  await drop('심볼', '편집 단추 (호버)', 500, 200);
  await drop('아이콘', '칠레 국기', 600, 200);
  const measure = () => p.evaluate(() => [...document.querySelectorAll('#dtStage .hj-asset')].map((a) => {
    const r = a.getBoundingClientRect();
    return { cls: a.className.split(' ').slice(0, 2).join(' '), theme: a.dataset.theme, reg: a.dataset.hjw + 'x' + a.dataset.hjh, box: Math.round(r.width) + 'x' + Math.round(r.height), text: a.textContent.replace(/\s+/g, ' ').trim().slice(0, 40), broken: [...a.querySelectorAll('img')].filter((i) => i.complete && !i.naturalWidth).length };
  }));
  out.dark = await measure();
  out.iconsPlaced = await p.evaluate(() => document.querySelectorAll('#dtStage img[src*="flag-chile"]').length);
  await p.screenshot({ path: GEN + 'drop-dark.png' });
  await p.evaluate(() => document.querySelector('#mode button[data-m="light"]').click());
  await p.waitForTimeout(5000);
  await p.screenshot({ path: GEN + 'drop-light.png' });
  out.light = (await measure()).map((x) => x.theme);
  await p.evaluate(() => document.getElementById('editAll').click());
  await p.waitForTimeout(800);
  const c = await p.evaluate(() => { const a = document.querySelector('#dtStage .nbw-root.hj-asset'); const b = a.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height - 10]; });
  await p.mouse.click(c[0], c[1]);
  await p.waitForTimeout(500);
  out.editable = await p.evaluate(() => { const a = document.querySelector('#dtStage .nbw-root.hj-asset'); const ps = [...a.querySelectorAll('p')]; return { clicked: [ps.filter((x) => x.isContentEditable).length, ps.length], screen: [...document.querySelectorAll('#dtStage .nbw-root:not(.hj-asset) p')].filter((x) => !x.closest('.hj-asset') && x.isContentEditable).length }; });
  out.errs = errs;
  await ctx.close();
  return out;
}
