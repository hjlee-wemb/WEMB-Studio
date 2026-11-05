/* 끌어다 넣기 점검 — 심볼 · 패널을 라이브러리에서 화면으로 끌어 넣고, 넣은 사본의 크기 · 로고 · 글자를 잰다. Playwright filename */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/statcom-assets/_gen/';
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await page.goto('http://localhost:5542/index.html#/templates/digital-twin-statcom-hmi');
  await page.waitForTimeout(1500);
  await page.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((x) => /스튜디오 열기/.test(x.textContent)); if (b) b.click(); });
  await page.waitForSelector('#dtStage .tcm-root', { timeout: 20000 });
  await page.waitForTimeout(2500);
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === '펼치기'); if (b) b.click(); });
  await page.waitForTimeout(600);
  const out = {};
  const drop = async (tabName, itemName, x, y) => {
    await page.evaluate((n) => { [...document.querySelectorAll('#libTabs button, #libTabs [role=tab]')].find((b) => b.textContent.trim() === n).click(); }, tabName);
    await page.waitForTimeout(2500);
    const item = page.locator('#libGrid .libitem', { hasText: itemName }).first();
    await item.scrollIntoViewIfNeeded();
    await item.dragTo(page.locator('#dtStage'), { targetPosition: { x, y }, force: true });
    await page.waitForTimeout(1000);
  };
  await drop('패널', '냉각기 상태', 900, 300);
  await drop('심볼', '냉각기 PUMP 항목 (RUN)', 600, 300);
  out.embeds = await page.evaluate(() => [...document.querySelectorAll('.hj-embed .hj-asset, #dtStage .hj-asset')].map((a) => {
    const c = a.firstElementChild, r = c.getBoundingClientRect();
    return { cls: a.className.split(' ').slice(0, 3).join(' '), reg: a.dataset.hjw + 'x' + a.dataset.hjh, box: Math.round(r.width) + 'x' + Math.round(r.height), text: a.textContent.replace(/\s+/g, ' ').slice(0, 40) };
  }));
  await page.screenshot({ path: GEN + 'drop.png' });
  out.errs = errs;
  return out;
}
