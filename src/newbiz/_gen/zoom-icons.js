/* Playwright filename — 라이트 아이콘 확대(2배) */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/newbiz/_gen/';
  const ctx = await page.context().browser().newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const go = async (pg) => { await p.goto('http://localhost:5543/src/newbiz/' + pg + '.html?live=0&t=light&r=' + Date.now()); await p.waitForLoadState('networkidle').catch(() => {}); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(250); };
  await go('wind');
  await p.screenshot({ path: GEN + 'zi-map.png', clip: { x: 150, y: 700, width: 620, height: 340 } });
  await p.screenshot({ path: GEN + 'zi-time.png', clip: { x: 40, y: 130, width: 620, height: 130 } });
  await p.screenshot({ path: GEN + 'zi-act.png', clip: { x: 1560, y: 360, width: 320, height: 150 } });
  await go('overseas');
  await p.screenshot({ path: GEN + 'zi-2040.png', clip: { x: 1480, y: 810, width: 370, height: 210 } });
  await ctx.close();
  return 'ok';
}
