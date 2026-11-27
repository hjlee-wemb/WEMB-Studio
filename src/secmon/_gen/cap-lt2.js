async (page, args) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  for (const pg of args) {
    await page.goto('http://localhost:5620/src/secmon/' + pg + '.html?live=0&t=light&r=' + Date.now());
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/secmon/_gen/light-' + pg + '.png' });
  }
  return 'ok';
}
