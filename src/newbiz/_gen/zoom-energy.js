async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/newbiz/_gen/';
  const ctx = await page.context().browser().newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto('http://localhost:5543/src/newbiz/energy.html?live=0&t=dark&r=' + Date.now());
  await p.waitForLoadState('networkidle').catch(() => {});
  await p.waitForTimeout(250);
  await p.screenshot({ path: GEN + 'zi-energy-dark.png', clip: { x: 40, y: 130, width: 620, height: 130 } });
  await ctx.close();
  return 'ok';
}
