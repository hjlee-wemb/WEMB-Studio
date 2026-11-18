/* Playwright filename — 다크 테마 캡처(dark-<key>.png) */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/plantdp/_gen/';
  const P = [["main","3302-4796"],["weather","3301-4796"],["seismic","3300-4796"],["event","3302-5372"],["sop-popup","3293-5251"],["building","3292-5597"],["floor","3287-4796"],["sop","3293-4796"],["sop-standby","3289-5423"],["login","3286-4796"]];
  for (const [pg, key] of P) {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:5570/src/plantdp/' + pg + '.html?live=0&t=dark&r=' + Date.now());
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    await page.screenshot({ path: GEN + 'dark-' + key + '.png', scale: 'css' });
  }
  return 'ok';
}
