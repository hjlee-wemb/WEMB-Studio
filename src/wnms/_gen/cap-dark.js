/* Playwright filename — 다크 테마 캡처(dark-<key>.png) */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/wnms/_gen/';
  const P = [["main","1-1602"],["main-expanded","1-2352"],["room-top","1-3690"],["room-view","1-3708"],["equipment","1-3797"],["detail","1-3943"],["login","1-2727"]];
  for (const [pg, key] of P) {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:5544/src/wnms/' + pg + '.html?live=0&t=dark&r=' + Date.now());
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    await page.screenshot({ path: GEN + 'dark-' + key + '.png', scale: 'css' });
  }
  return 'ok';
}
