/* 에셋 라이브러리 점검 — 스튜디오에서 '펼치기' 후 탭마다 찍고, 이 시안 썸네일의 바탕이 투명한지 잰다. Playwright filename */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/plant-assets/_gen/';
  const ctx = await page.context().browser().newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await p.goto('http://localhost:5541/index.html#/templates/digital-twin-plant-power-facility');
  await p.waitForTimeout(1200);
  await p.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((x) => /이 구성으로 스튜디오 열기/.test(x.textContent)); if (b) b.click(); });
  await p.waitForSelector('#dtStage .pfo-root', { timeout: 15000 });
  await p.waitForTimeout(2200);
  await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === '펼치기'); if (b) b.click(); });
  await p.waitForTimeout(800);
  const out = { tabs: await p.evaluate(() => [...document.querySelectorAll('#libTabs [role=tab], #libTabs button')].map((b) => b.textContent.trim())) };
  await p.evaluate(() => { const i = document.getElementById('libSearch'); i.value = '전기실'; i.dispatchEvent(new Event('input', { bubbles: true })); });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: GEN + 'lib-search.png' });
  const tabs = await p.$$('#libTabs [role=tab], #libTabs button');
  out.perTab = [];
  await p.evaluate(() => { const i = document.getElementById('libSearch'); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); });
  for (let i = 0; i < tabs.length; i++) {
    await tabs[i].evaluate((b) => b.click());
    await p.waitForTimeout(900);
    out.perTab.push(await p.evaluate(() => {
      const root = document.getElementById('libGrid');
      const mine = [...root.querySelectorAll('.pfo-root.hj-asset')];
      const bg = (e) => { const out = []; for (let a = e; a && a !== root; a = a.parentElement) { const c = getComputedStyle(a); if (c.backgroundColor !== 'rgba(0, 0, 0, 0)' || c.backgroundImage !== 'none') out.push((a.className || a.tagName) + ':' + c.backgroundColor + '/' + c.backgroundImage.slice(0, 30)); } return out; };
      const first = mine[0];
      const icons = [...root.querySelectorAll('img[src*="src/plant/"]')].length;
      return { items: root.children.length, pfDom: mine.length, pfIcons: icons, bgChain: first ? bg(first).slice(0, 4) : [], sizes: mine.slice(0, 40).map((m) => { const r = m.getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height); }).slice(0, 6) };
    }));
  }
  out.errs = errs.slice(0, 6);
  await ctx.close();
  return out;
}
