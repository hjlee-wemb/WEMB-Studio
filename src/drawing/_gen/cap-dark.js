/* Playwright filename — 다크 테마 캡처(dark-<key>.png) */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/drawing/_gen/';
  const P = [["main","1-105"],["main-menu","1-199"],["main-select","1-298"],["main-popup","1-393"],["search","1-1890"],["search-detail","1-2550"],["preview","1-7737"],["preview-popup","1-9189"],["register","1-3119"],["equipment","1-2787"],["help","1-2950"],["checkin","1-3909"],["cctv","1-3471"],["desk","1-3738"],["desk-write","1-3648"],["desk-detail","1-3597"],["total-search","1-6530"],["total-result","1-6934"],["login","1-73"]];
  for (const [pg, key] of P) {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:5544/src/drawing/' + pg + '.html?live=0&t=dark&r=' + Date.now());
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    await page.screenshot({ path: GEN + 'dark-' + key + '.png', scale: 'css' });
  }
  return 'ok';
}
